-- ==========================================================================
--  ESSAIS DE LA SECTION 45.3 bis — la réserve d'un SIREN retiré survit à la
--  suppression du compte
--
--  À rejouer sur un PostgreSQL NEUF, après local-prelude.sql et schema.sql
--  (deux fois) :
--
--    psql -d opus -v ON_ERROR_STOP=0 -f supabase/essais-section-45-bis.sql
--
--  LE DÉFAUT, prouvé sur le schéma d'avant (17/10/2026) : l'administration
--  retire un SIREN à un squatteur, le squatteur SUPPRIME SON COMPTE, et la
--  ligne qui portait le gel part avec lui (`pro_id … on delete cascade`). Un
--  compte neuf s'inscrivait alors avec le même numéro, sans aucun refus.
--
--  Méthode : la même que essais-section-45.sql. Chaque cas qui doit échouer
--  est le DERNIER ordre de sa transaction ; le rôle et l'identité se posent
--  par `set local`, jamais dans un bloc `do` (une politique RLS n'y est pas
--  appliquée). Les refus s'affichent en `ERROR` avec leur texte : il faut
--  les LIRE et les comparer à l'attendu annoncé au-dessus.
--
--  ORDRE : A. la donnée existe ; B. le squatteur part, et chaque porte reste
--  fermée ; C. le chemin légitime passe encore — le vrai titulaire récupère
--  son entreprise, et la réserve se LÈVE sans s'effacer.
--
--  Les SIRET sont fictifs, à clé de contrôle juste — les mêmes que ceux de
--  essais-section-45.sql, avec des comptes distincts (préfixe a4510000).
-- ==========================================================================

\set QUIET on
\pset pager off

\set ADMIN '''a4510000-0000-4000-8000-0000000000ad'''
\set S     '''a4510000-0000-4000-8000-000000000005'''
\set T     '''a4510000-0000-4000-8000-000000000007'''
\set B     '''a4510000-0000-4000-8000-00000000000b'''
\set NEUF  '''a4510000-0000-4000-8000-0000000000ee'''

-- Ménage d'un passage précédent : le fichier se rejoue.
delete from public.administrateurs where user_id = :ADMIN;
delete from auth.users where id::text like 'a4510000-0000-4000-8000-%';
delete from public.preuves_siret where siret = '00000024000010';
update public.sirens_reserves set leve_le = null where false;  -- (la table doit exister)

insert into public.preuves_siret
  (siret, denomination, nom_complet_registre, est_ei, forme_juridique, ape, est_siege,
   adresse, code_postal, commune, code_insee, statut_diffusion, source, verifiee_le, expire_le)
values
  ('00000024000010', 'LE VRAI TITULAIRE', 'LE VRAI TITULAIRE', false, '5499', '43.99C', true,
   '5 RUE VRAIE', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours');

insert into auth.users (id, email, raw_user_meta_data) values
  (:ADMIN, 'admin451@exemple-opus.test', '{"type":"particulier","nom":"Admin Opus"}'::jsonb);
insert into public.administrateurs (user_id, note) values (:ADMIN, 'essais section 45 bis');

insert into auth.users (id, email, raw_user_meta_data) values
  -- S, le squatteur : il a tapé le SIRET d'un autre.
  (:S, 's451@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Squatteur', 'entreprise', 'Le Vrai Titulaire',
                      'metiers', jsonb_build_array('macon'), 'ville', 'Marseille (13)',
                      'siret', '00000024000010')),
  -- B, un particulier, qui tentera de passer pro avec le même numéro.
  (:B, 'b451@exemple-opus.test',
   '{"type":"particulier","nom":"B Particulier","ville":"Marseille (13)"}'::jsonb);
-- T, le vrai titulaire, arrive APRÈS : son entreprise est prise, il passe
-- par la porte de secours.
insert into auth.users (id, email, raw_user_meta_data) values
  (:T, 't451@exemple-opus.test',
   jsonb_build_object('type', 'particulier', 'nom', 'T Titulaire', 'ville', 'Marseille (13)',
                      'demande_pro', jsonb_build_object(
                        'siret', '00000024000010', 'motif', 'deja_utilise',
                        'entreprise', 'Le Vrai Titulaire',
                        'metiers', jsonb_build_array('macon'))));
select id as "DEM_T" from public.demandes_pro where compte_id = :T \gset

\set QUIET off

\echo ''
\echo '##### A. LA DONNÉE EXISTE #####'

\echo '--- A1. S tient 000000240, T a une demande ouverte, et aucune réserve n''existe encore (attendu : 1 | nouvelle | 0)'
select (select count(*) from public.entreprise_registre
         where siren = '000000240' and retiree_le is null and pro_id = :S) as tenue_par_s,
       (select statut from public.demandes_pro where id = :'DEM_T') as demande_de_t,
       (select count(*) from public.sirens_reserves where siren = '000000240') as reserves;

\echo '--- A2. la table ne référence ni la fiche ni le compte : aucune clé étrangère (attendu : 0)'
select count(*) as cles_etrangeres
  from pg_constraint where conrelid = 'public.sirens_reserves'::regclass and contype = 'f';

\echo '--- A3. l''ancienne colonne a disparu (attendu : 0)'
select count(*) as colonne_gele
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entreprise_registre' and column_name = 'gele';

\echo ''
\echo '##### B. LE SQUATTEUR PART, ET LA RÉSERVE RESTE #####'

\echo '--- B1. l''administration retire l''entreprise à S (attendu : true, puis 1 réserve active posée par l''administrateur)'
set role authenticated;
set request.jwt.claim.sub = :ADMIN;
select x ->> 'retiree' as retiree
  from public.admin_retirer_entreprise(:S, 'Squatteur signalé par le vrai titulaire.') x;
reset role;
reset request.jwt.claim.sub;
select count(*) as reserves_actives,
       bool_and(reserve_par = :ADMIN) as par_l_administrateur
  from public.sirens_reserves where siren = '000000240' and leve_le is null;

\echo '--- B2. S SUPPRIME SON COMPTE — la cascade du chemin de l''application (attendu : DELETE 1, puis 0 identité de S, 0 ligne pour 000000240)'
delete from auth.users where id = :S;
select (select count(*) from public.entreprise_registre where pro_id = :S) as identites_de_s,
       (select count(*) from public.entreprise_registre where siren = '000000240') as lignes_du_siren;

\echo '--- B3. LE CŒUR DU LOT : la réserve a SURVÉCU (attendu : 1 | t — le schéma d''avant rendait 0 ici)'
select (select count(*) from public.sirens_reserves where siren = '000000240' and leve_le is null) as reserves_actives,
       public.siren_reserve('000000240') as reserve;

\echo '--- B4. un COMPTE NEUF s''inscrit avec le même SIRET (attendu : ERROR OP007 — le schéma d''avant le laissait passer)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'neuf451@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Le squatteur, revenu', 'entreprise', 'X',
                      'metiers', jsonb_build_array('macon'), 'ville', 'Marseille (13)',
                      'siret', '00000024000010'));
rollback;

\echo '--- B5. …ni un particulier qui passe pro (attendu : ERROR OP007)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select public.devenir_pro('{"siret":"00000024000010"}'::jsonb);
rollback;

\echo '--- B6. la file de l''administration DIT que l''entreprise est réservée (attendu : t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select bool_or((x ->> 'reservee_le') is not null) as la_file_le_dit
  from jsonb_array_elements(public.admin_demandes_pro()) x
 where x ->> 'siret' = '00000024000010';
rollback;

\echo '--- B7. un client ne LIT pas la table (attendu : ERROR permission denied for table sirens_reserves)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select count(*) from public.sirens_reserves;
rollback;

\echo '--- B8. …ni sans compte (attendu : ERROR permission denied for table sirens_reserves)'
begin;
set local role anon;
select count(*) from public.sirens_reserves;
rollback;

\echo '--- B9. un client n''APPELLE pas la fonction : elle dirait qu''un compte a été écarté (attendu : ERROR permission denied for function siren_reserve)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select public.siren_reserve('000000240');
rollback;

\echo '--- B10. …mais la clé de service, celle de la fonction Edge, l''appelle (attendu : t)'
begin;
set local role service_role;
select public.siren_reserve('000000240') as reserve_vue_par_l_edge;
rollback;

\echo ''
\echo '##### C. LE CHEMIN LÉGITIME PASSE ENCORE #####'

\echo '--- C1. l''administration ACCEPTE la demande du vrai titulaire : la réserve se LÈVE, sans s''effacer (attendu : acceptee | pro | 1 identité active chez T | 0 réserve active | 1 ligne levée par l''administrateur)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select x ->> 'statut' as statut
  from public.admin_traiter_demande_pro(:'DEM_T', 'accepter', null) x;
reset role;
select u.type as type_de_t,
       (select count(*) from public.entreprise_registre
         where siren = '000000240' and retiree_le is null and pro_id = :T) as active_chez_t,
       (select count(*) from public.sirens_reserves
         where siren = '000000240' and leve_le is null) as reserves_actives,
       (select count(*) from public.sirens_reserves
         where siren = '000000240' and leve_le is not null and leve_par = :ADMIN) as levees
  from public.users u where u.id = :T;
rollback;

\echo '--- C2. un SECOND retrait du même SIREN REPOSE la réserve (attendu : 1 réserve active, et une seule ligne pour ce SIREN)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select x ->> 'statut' as statut
  from public.admin_traiter_demande_pro(:'DEM_T', 'accepter', null) x;
select x ->> 'retiree' as retiree
  from public.admin_retirer_entreprise(:T, 'Second retrait, pour l''essai du lot 45 bis.') x;
reset role;
select count(*) filter (where leve_le is null) as reserves_actives,
       count(*) as lignes
  from public.sirens_reserves where siren = '000000240';
rollback;

\echo '--- C3. un SIREN qui n''a jamais été retiré n''est pas réservé (attendu : f)'
select public.siren_reserve('000000208') as reserve;

-- Ménage : les comptes d'essai partent ; la réserve, elle, n'appartient à
-- aucun compte — on la retire à la main, comme l'éditeur SQL le ferait.
\set QUIET on
delete from public.administrateurs where user_id = :ADMIN;
delete from auth.users where id::text like 'a4510000-0000-4000-8000-%';
delete from public.preuves_siret where siret = '00000024000010';
delete from public.sirens_reserves where siren = '000000240';
\set QUIET off
\echo '--- FIN. ménage fait (attendu : 0 | 0)'
select (select count(*) from auth.users where id::text like 'a4510000-0000-4000-8000-%') as comptes,
       (select count(*) from public.sirens_reserves where siren = '000000240') as reserves;
