-- ==========================================================================
--  ESSAIS DE LA SECTION 40 — le nom de l agent, et le compteur de refus
--
--  A lancer sur un PostgreSQL ou schema.sql vient d etre rejoue :
--    psql -f supabase/local-prelude.sql && psql -f supabase/schema.sql
--    psql -f supabase/essais-section-40.sql
--
--  CHAQUE ESSAI EST DANS SON PROPRE begin … rollback, et SURTOUT PAS dans
--  un bloc do : un essai de RLS ecrit dans un do ne prouve RIEN.
--
--  Et les essais qui touchent le verrou du compteur passent par
--  `set local role` + `set local request.jwt.claim.sub`, chacun dans son
--  propre ordre : c est la lecon du lot E, ou un essai sans jeton passait
--  au vert sans eprouver le verrou — auth.uid() y etait vide, donc le
--  verrou ne s appliquait pas.
-- ==========================================================================
\set ON_ERROR_STOP off
\set moi   '''aaaa0000-0000-4000-8000-0000000040aa'''
\set autre '''bbbb0000-0000-4000-8000-0000000040bb'''

create or replace function pg_temp.jeu() returns void language plpgsql as $$
begin
  insert into auth.users (id, email) values
    ('aaaa0000-0000-4000-8000-0000000040aa', 'moi40@exemple.test'),
    ('bbbb0000-0000-4000-8000-0000000040bb', 'autre40@exemple.test')
  on conflict (id) do nothing;
  insert into public.users (id, email, nom, type) values
    ('aaaa0000-0000-4000-8000-0000000040aa', 'moi40@exemple.test', 'Moi', 'pro'),
    ('bbbb0000-0000-4000-8000-0000000040bb', 'autre40@exemple.test', 'Autre', 'pro')
  on conflict (id) do update set nom = excluded.nom;
  insert into public.professional_profiles (id, entreprise, metiers, ville) values
    ('aaaa0000-0000-4000-8000-0000000040aa', 'Moi SARL',   array['macon'], 'Lambesc'),
    ('bbbb0000-0000-4000-8000-0000000040bb', 'Autre SARL', array['macon'], 'Lambesc')
  on conflict (id) do update set entreprise = excluded.entreprise;
end $$;

\echo '=== 1. UNE FICHE NAIT SANS AGENT NOMME, ET A ZERO PROPOSITION ==='
begin;
select pg_temp.jeu();
select agent_nom is null as pas_de_nom, agent_propositions as propositions
  from public.professional_profiles where id = :moi;
rollback;

\echo '=== 2. ON NOMME SON AGENT ==='
begin;
select pg_temp.jeu();
update public.professional_profiles set agent_nom = 'Leon' where id = :moi;
select agent_nom from public.professional_profiles where id = :moi;
rollback;

\echo '=== 3. LE NOM EST NETTOYE, ET DES BLANCS SEULS VALENT null ==='
-- Une seule facon de dire « il n y en a pas » : sinon l ecran affiche un
-- agent qui s appelle «  ». Meme regle que email_pro et que le recit.
begin;
select pg_temp.jeu();
update public.professional_profiles set agent_nom = '   Margot  ' where id = :moi;
select agent_nom = 'Margot' as rogne from public.professional_profiles where id = :moi;
update public.professional_profiles set agent_nom = '    ' where id = :moi;
select agent_nom is null as vide_devient_null
  from public.professional_profiles where id = :moi;
rollback;

\echo '=== 4. UN NOM TROP LONG EST REFUSE (attendu : 23514) ==='
begin;
select pg_temp.jeu();
update public.professional_profiles
   set agent_nom = 'Un nom beaucoup trop long pour un agent'
 where id = :moi;
rollback;

\echo '=== 5. UN NOM D UNE SEULE LETTRE EST REFUSE (attendu : 23514) ==='
begin;
select pg_temp.jeu();
update public.professional_profiles set agent_nom = 'L' where id = :moi;
rollback;

\echo '=== 6. UN AUTRE PROFESSIONNEL NE PEUT PAS NOMMER MON AGENT ==='
-- Aucune politique nouvelle : « ecriture mon profil » exige auth.uid() = id.
-- On attend ZERO ligne modifiee, et surtout pas une erreur — c est ainsi
-- que la RLS refuse une mise a jour.
begin;
select pg_temp.jeu();
set local role authenticated;
set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-0000000040bb';
update public.professional_profiles set agent_nom = 'Pirate' where id = 'aaaa0000-0000-4000-8000-0000000040aa';
rollback;

\echo '=== 7. …ET LE NOM N A PAS BOUGE ==='
begin;
select pg_temp.jeu();
update public.professional_profiles set agent_nom = 'Leon' where id = :moi;
set local role authenticated;
set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-0000000040bb';
update public.professional_profiles set agent_nom = 'Pirate' where id = 'aaaa0000-0000-4000-8000-0000000040aa';
reset role;
select agent_nom = 'Leon' as intact from public.professional_profiles where id = :moi;
rollback;

\echo '=== 8. LE COMPTEUR DE REFUS MONTE ==='
begin;
select pg_temp.jeu();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-0000000040aa';
update public.professional_profiles set agent_propositions = 1 where id = 'aaaa0000-0000-4000-8000-0000000040aa';
update public.professional_profiles set agent_propositions = 2 where id = 'aaaa0000-0000-4000-8000-0000000040aa';
reset role;
select agent_propositions from public.professional_profiles where id = :moi;
rollback;

\echo '=== 9. LE COMPTEUR NE REDESCEND JAMAIS — le verrou de la section ==='
-- C est la promesse « on s arrete apres trois refus ». Elle n est tenue que
-- si rien ne peut remettre le compteur a zero : une version plus ancienne
-- de l application qui renvoie la fiche entiere, un enregistrement de
-- profil qui ne connait pas cette colonne, une faute de frappe.
--
-- ET IL FAUT UN JETON POUR L EPROUVER : sans `set local role` + `sub`,
-- auth.uid() est vide, le verrou ne s applique pas, et l essai passerait
-- au vert en ne prouvant rien.
begin;
select pg_temp.jeu();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-0000000040aa';
update public.professional_profiles set agent_propositions = 3 where id = 'aaaa0000-0000-4000-8000-0000000040aa';
update public.professional_profiles set agent_propositions = 0 where id = 'aaaa0000-0000-4000-8000-0000000040aa';
reset role;
select agent_propositions = 3 as le_compteur_tient
  from public.professional_profiles where id = :moi;
rollback;

\echo '=== 10. …MAIS L ADMINISTRATION PEUT LE REMETTRE A ZERO ==='
-- auth.uid() vide — l editeur SQL, une fonction Edge — laisse passer :
-- c est par la que passerait une remise a zero decidee par un humain.
-- Meme echappatoire que tient_le_profil_pro() et tient_les_metiers().
begin;
select pg_temp.jeu();
update public.professional_profiles set agent_propositions = 3 where id = :moi;
update public.professional_profiles set agent_propositions = 0 where id = :moi;
select agent_propositions = 0 as remise_a_zero_possible
  from public.professional_profiles where id = :moi;
rollback;

\echo '=== 11. NOMMER SON AGENT NE DONNE AUCUN DROIT DE PLUS ==='
-- Un nom n est pas une permission. Le verrou du badge verifie tient
-- toujours : l artisan ecrit son agent_nom et verifie reste false.
begin;
select pg_temp.jeu();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-0000000040aa';
update public.professional_profiles
   set agent_nom = 'Gaston', verifie = true, kbis_valide = true
 where id = 'aaaa0000-0000-4000-8000-0000000040aa';
reset role;
select agent_nom = 'Gaston' as nom_pose, verifie, kbis_valide
  from public.professional_profiles where id = :moi;
rollback;

\echo '=== 12. L EXPORT RGPD EMPORTE LE NOM DE L AGENT ==='
-- `mes_donnees()` rend to_jsonb(p) sur la fiche entiere : une colonne
-- ajoutee ici y entre toute seule. C est voulu, et c est pour ca que
-- l export rend la ligne et pas une liste de colonnes.
begin;
select pg_temp.jeu();
update public.professional_profiles set agent_nom = 'Leon' where id = :moi;
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-0000000040aa';
select public.mes_donnees() -> 'fiche_professionnelle' -> 'agent_nom' as dans_l_export;
reset role;
rollback;
