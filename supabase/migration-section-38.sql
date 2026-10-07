-- ==========================================================================
--  MIGRATION À COLLER DANS SUPABASE → SQL EDITOR
--
--  Pourquoi ce fichier existe : le connecteur Supabase ne répond plus dans
--  la session où cette section a été écrite, donc la migration n'a pas pu
--  être appliquée automatiquement. La règle du projet est alors claire —
--  « un lot dont la moitié BASE n'est pas appliquée n'est pas fini » : on
--  écrit la migration ici, et on le dit.
--
--  ⚠️  L'ORDRE COMPTE, ET IL N'EST PAS NÉGOCIABLE :
--
--      1. coller CE fichier dans Supabase → SQL Editor, et l'exécuter ;
--      2. SEULEMENT APRÈS, redéployer la fonction Edge `ai`.
--
--  Dans l'autre sens, la fonction appellerait `enregistrer_appel_ia` avant
--  qu'elle n'existe : l'assistant répondrait « n'a pas pu être appelé » à
--  chaque demande. C'est exactement la panne des six commits du 21/09,
--  quand l'application avait pris de l'avance sur la base.
--
--  Ce fichier est RETIRÉ du dépôt dès la migration appliquée : un fichier
--  que personne n'a plus à ouvrir est le « bouton §18 » sous une autre
--  forme.
--
--  Aucun ordre ne commence par `drop` ni `delete` : il passe donc aussi
--  par le connecteur, le jour où il répond à nouveau.
-- ==========================================================================

-- ==========================================================================
--  38. LE SOCLE DE L'AGENT — qui appelle l'IA, et on le NOTE
--
--  CE QUI A DÉCLENCHÉ CETTE SECTION, et c'est mesuré
--  --------------------------------------------------
--  Le 07/10/2026, avant de construire le récit de chantier, un appel réel
--  à la fonction Edge `ai` depuis le conteneur de travail, **sans aucun
--  compte**, avec la seule clé publiable — celle qui est dans
--  l'application, donc lisible par quiconque installe Opus :
--
--      POST /functions/v1/ai  { action: "summary", … }
--      → 200, et une réponse complète.
--
--  > **La fonction ne lisait AUCUN jeton.** N'importe qui pouvait donc
--  > faire tourner la clé Anthropic du propriétaire en boucle, sans
--  > limite, sans trace, et sans que rien ne le signale. Ce n'est pas une
--  > fuite de données — c'est une fuite d'ARGENT, et elle était ouverte
--  > depuis le premier jour de l'IA.
--
--  CE QUE LE CAHIER DES CHARGES EXIGE, ET QUI TOMBE EXACTEMENT ICI
--  ---------------------------------------------------------------
--  §21 : « Journal d'activité et audit des actions de l'IA. »
--  §22 : « Le système doit éviter d'envoyer inutilement toute la base de
--         données au modèle. Il faut mettre en place récupération
--         contextuelle, permissions et journalisation. »
--  §23 : « Journal des actions IA. Possibilité de consulter l'historique. »
--  §24 : « TRAÇABILITÉ : les actions importantes sont enregistrées. »
--
--  C'est la PREMIÈRE PIERRE de l'agent Opus (§3), et elle est posée
--  maintenant parce que la règle du projet l'impose : « ne plus ajouter
--  d'action IA à la main dans la fonction Edge `ai` ; la prochaine se
--  construit avec le journal d'audit et les permissions du §21, ou elle
--  sera à refaire ».
--
--  CE QUE CETTE SECTION NE POSE PAS, ET POURQUOI
--  ---------------------------------------------
--  Le §4 décrit sept familles d'action réglables (devis, facture,
--  publication, profil, planning, dépense, contrat). **Six n'existent pas
--  encore dans Opus** : il n'y a ni devis, ni facture, ni planning.
--
--  > Poser les sept réglages aujourd'hui créerait une table que personne
--  > ne lit — le « bouton §18 » que ce projet retire avant de livrer.
--  > Chaque permission naîtra AVEC l'action qu'elle gouverne. Ce qui est
--  > posé ici est ce qui a un lecteur dès aujourd'hui : l'identité de
--  > l'appelant, le journal, et la limite.
-- ==========================================================================

-- --------------------------------------------------------------------------
--  38.1 Le journal — et ce qu'il NE contient pas
--
--  Il note QUE l'IA a été appelée, par QUI, pour QUOI et à quel COÛT.
--  Il ne garde ni la question ni la réponse.
--
--  > **Ce qu'on n'écrit pas ne peut pas fuir.** Le texte d'une demande à
--  > l'IA contient le nom d'un client, un prix, parfois une adresse — des
--  > données de TIERS que l'artisan n'a pas à voir conservées, et que le
--  > RGPD obligerait à purger. Le journal répond aux questions qu'on se
--  > pose vraiment (« qu'est-ce que mon agent a fait ? », « pourquoi ma
--  > facture Anthropic monte-t-elle ? ») sans rien de tout cela.
--
--  Même esprit que `journal_admin` (section 25) : **aucune politique
--  d'écriture**. Seule la fonction Edge, qui détient la clé de service,
--  peut y ajouter une ligne. Un journal qu'on peut récrire ne prouve rien.
-- --------------------------------------------------------------------------
create table if not exists public.journal_ia (
  id          uuid primary key default gen_random_uuid(),
  -- `on delete cascade` : le journal d'un compte supprimé part avec lui.
  -- C'est une donnée personnelle sur CET utilisateur, et sur personne
  -- d'autre — contrairement aux avis, qui s'anonymisent au lieu de partir.
  user_id     uuid not null references public.users(id) on delete cascade,
  action      text not null,
  -- Ce que l'action visait, quand elle visait quelque chose : un chantier,
  -- une publication. Jamais une clé étrangère : l'action peut viser un
  -- objet d'un module qui n'existe pas encore, et une colonne par module
  -- serait ingérable. On garde donc le COUPLE (type, identifiant) en
  -- texte, et c'est assumé — ce journal ne sert pas à naviguer, il sert à
  -- rendre compte.
  cible_type  text,
  cible_id    text,
  -- Le coût réel, rendu par Anthropic. C'est lui qui répond à « pourquoi
  -- ma facture monte ».
  jetons_entree int not null default 0,
  jetons_sortie int not null default 0,
  -- `refuse` quand la limite a mordu, `erreur` quand le modèle n'a pas
  -- répondu. Les deux doivent se voir : une limite qui mord en silence
  -- ressemble à une panne.
  resultat    text not null default 'ok'
              check (resultat in ('ok', 'refuse', 'erreur')),
  created_at  timestamptz not null default clock_timestamp()
);

-- `clock_timestamp()` et pas `now()` : la leçon du journal d'administration
-- (section 25). `now()` rend l'heure de DÉBUT DE TRANSACTION, donc deux
-- actes de la même transaction portent le même horodatage et `order by`
-- en sort un au hasard — un journal dont on ne peut pas lire l'ordre.

create index if not exists idx_journal_ia_user
  on public.journal_ia (user_id, created_at desc);

alter table public.journal_ia enable row level security;

do $mig$
begin
  -- Création SOUS CONDITION : le connecteur Supabase refuse tout ordre qui
  -- commence par `drop`, y compris dans un `execute`. Voir CLAUDE.md.
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'journal_ia'
       and policyname = 'lecture mon journal ia'
  ) then
    create policy "lecture mon journal ia" on public.journal_ia
      for select to authenticated using (user_id = auth.uid());
  end if;
end $mig$;

-- Et AUCUNE politique d'insertion, de modification ni de suppression. Ce
-- n'est pas un oubli : c'est ce qui rend ce journal crédible.

comment on table public.journal_ia is
  'Journal d''audit des actions de l''IA (§21, §23 du cahier des charges). '
  'Ne contient NI la question NI la réponse : ce qu''on n''écrit pas ne '
  'peut pas fuir. Écrit uniquement par la fonction Edge `ai`, qui détient '
  'la clé de service. Section 38.';

-- --------------------------------------------------------------------------
--  38.2 La limite — et pourquoi elle est tenue par la BASE
--
--  Identifier l'appelant ferme la porte aux inconnus. Elle ne ferme pas
--  celle d'un compte qui, lui, a le droit d'appeler : **un seul compte
--  d'essai suffirait à vider le budget** en lançant la même demande mille
--  fois.
--
--  > **Le comptage et l'écriture sont le MÊME ordre**, et c'est tout
--  > l'intérêt : compter d'un côté puis écrire de l'autre laisse un
--  > intervalle où deux appels simultanés passent tous les deux. Ici, la
--  > ligne du journal n'existe que si la limite le permet, et dans la même
--  > transaction.
--
--  `security definer` parce que la table n'a aucune politique d'écriture —
--  c'est le seul chemin, et il est volontairement étroit : la fonction
--  n'écrit QUE pour `p_user`, qui lui est imposé par l'appelant de
--  confiance (la fonction Edge, avec la clé de service).
-- --------------------------------------------------------------------------
create or replace function public.enregistrer_appel_ia(
  p_user        uuid,
  p_action      text,
  p_cible_type  text default null,
  p_cible_id    text default null,
  p_jetons_in   int  default 0,
  p_jetons_out  int  default 0,
  p_resultat    text default 'ok',
  p_limite_jour int  default 60
)
returns public.journal_ia
language plpgsql
security definer
set search_path = public
as $$
declare
  faits int;
  ligne public.journal_ia;
begin
  if p_user is null then
    raise exception 'Aucun utilisateur : un appel à l''IA est toujours nominatif.'
      using errcode = '23514';
  end if;

  -- On ne compte QUE les appels qui ont abouti. Compter les refus ferait
  -- qu'un compte bloqué le reste pour la journée entière à cause de ses
  -- propres tentatives — une punition qui s'auto-entretient.
  select count(*) into faits
    from public.journal_ia
   where user_id = p_user
     and resultat = 'ok'
     and created_at > now() - interval '24 hours';

  -- UN REFUS N'EST PAS UNE PANNE : la fonction REND toujours une ligne, et
  -- c'est son `resultat` qui dit ce qui s'est passé. L'appelant lit ce
  -- champ et s'arrête là.
  --
  -- > **Le premier jet levait une exception, et l'essai l'a démoli en une
  -- > ligne : `raise` ANNULE la transaction, donc l'insertion du refus
  -- > qu'on venait d'écrire était effacée avec elle.** Le journal n'aurait
  -- > gardé aucune trace des limites atteintes — exactement l'inverse de
  -- > ce qu'on voulait, et invisible sans l'exécuter.
  --
  -- L'exception ne reste que pour `p_user is null`, qui n'est pas un cas
  -- métier mais une faute de programmation : là, il FAUT que ça casse.
  if p_resultat = 'ok' and faits >= p_limite_jour then
    insert into public.journal_ia
      (user_id, action, cible_type, cible_id, resultat)
    values (p_user, p_action, p_cible_type, p_cible_id, 'refuse')
    returning * into ligne;
    return ligne;
  end if;

  insert into public.journal_ia
    (user_id, action, cible_type, cible_id, jetons_entree, jetons_sortie, resultat)
  values (p_user, p_action, p_cible_type, p_cible_id, p_jetons_in, p_jetons_out, p_resultat)
  returning * into ligne;

  return ligne;
end; $$;

-- Elle n'est PAS exécutable par un utilisateur connecté : seule la
-- fonction Edge, avec la clé de service, s'en sert. Un artisan qui
-- pourrait l'appeler écrirait ce qu'il veut dans son propre journal
-- d'audit — ce qui le viderait de son sens.
--
-- > **ET C'EST `public` QU'IL FAUT RÉVOQUER, PAS LES RÔLES.** Le premier
-- > jet disait `from anon, authenticated` et ne retirait RIEN : PostgreSQL
-- > accorde `execute` à **PUBLIC** sur toute fonction nouvellement créée,
-- > et un `revoke` sur un rôle ne touche pas ce droit-là. Mesuré :
-- > `proacl` valait `{=X/postgres,…}` — ce `=X` en tête, c'est PUBLIC.
-- > L'essai 9 a donc vu un compte ordinaire écrire la ligne « invente »
-- > dans son propre journal.
-- >
-- > C'est exactement le piège du 29/09 sur les colonnes : « `revoke
-- > select (colonne)` ne retire rien tant que le rôle possède le droit de
-- > lire la table entière ». Même forme, autre objet.
revoke all on function public.enregistrer_appel_ia(
  uuid, text, text, text, int, int, text, int
) from public;

grant execute on function public.enregistrer_appel_ia(
  uuid, text, text, text, int, int, text, int
) to service_role;

comment on function public.enregistrer_appel_ia(uuid, text, text, text, int, int, text, int) is
  'Écrit une ligne du journal d''audit IA ET applique la limite quotidienne, '
  'dans le même ordre. Réservée à la fonction Edge `ai`. Section 38.';

--
