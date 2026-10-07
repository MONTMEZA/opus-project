-- ==========================================================================
--  CORRECTIF À COLLER DANS SUPABASE → SQL EDITOR
--  (après `migration-section-38.sql`, et AVANT de redéployer la fonction)
--
--  POURQUOI CE SECOND FICHIER
--  ---------------------------
--  Juste après l'application de la première migration, un appel anonyme à
--  `enregistrer_appel_ia` depuis le conteneur de travail a répondu **409**
--  — une violation de clé étrangère. Autrement dit : la fonction s'était
--  EXÉCUTÉE. Elle était donc appelable par n'importe qui.
--
--  La cause, et elle est précise : Supabase accorde `execute` à `anon` et
--  `authenticated` par `alter default privileges`, c'est-à-dire par un
--  grant DIRECT sur ces rôles. Un `revoke … from public` ne le touche pas.
--
--  > **Et la base d'essai ne pouvait pas le montrer** : son prélude
--  > accordait les droits par défaut sur les TABLES, pas sur les
--  > FONCTIONS. L'essai « un compte ordinaire ne peut pas écrire dans son
--  > journal » y passait au vert pendant que la porte était grande ouverte
--  > en production. `local-prelude.sql` accorde désormais la même chose,
--  > et le défaut a été reproduit puis refermé sur la base d'essai avant
--  > d'écrire ce fichier.
--
--  Ce que ça permettait, concrètement : la fonction est `security
--  definer` et reçoit `p_user` en paramètre. N'importe quel compte pouvait
--  donc écrire ce qu'il voulait dans le journal d'audit de N'IMPORTE QUI.
--  Un journal qu'on peut récrire ne prouve rien.
--
--  Aucun ordre ne commence par `drop` ni `delete`.
-- ==========================================================================

revoke all on function public.enregistrer_appel_ia(
  uuid, text, text, text, int, int, text, int
) from public, anon, authenticated;

grant execute on function public.enregistrer_appel_ia(
  uuid, text, text, text, int, int, text, int
) to service_role;

-- Pour vérifier d'un coup d'œil que c'est bien passé : la colonne doit
-- montrer `service_role=X/postgres` et plus rien d'autre d'ouvert.
select proname, proacl
  from pg_proc
 where proname = 'enregistrer_appel_ia';
