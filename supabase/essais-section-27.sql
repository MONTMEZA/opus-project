-- ==========================================================================
--  LES ESSAIS DE LA SECTION 27 (le référentiel, côté administration)
--
--      psql ... -f supabase/local-prelude.sql
--      psql ... -f supabase/schema.sql          # deux fois
--      psql ... -f supabase/essais-section-27.sql
--
--  Chaque cas dans son propre `begin … rollback`, jamais dans un bloc `do` :
--  la clause `with check` d'une politique n'y est pas appliquée (règle du
--  01/10/2026).
--
--  Les dix cas :
--    1  un tiers ne lit pas les files
--    2  l'administration les lit, avec les noms et non les clés
--    3  ACCEPTER APPLIQUE VRAIMENT les métiers sur la fiche
--    4  un refus sans motif suffisant est refusé
--    5  un refus motivé ne touche PAS la fiche
--    6  on ne tranche pas sa propre demande (le verrou annulerait en silence)
--    7  retenir une spécialité n'insère RIEN au catalogue — c'est voulu
--    8  un métier désactivé ne casse PAS la fiche de qui l'exerce
--       (la garantie du §18, même si l'écran de désactivation reste à
--        construire — voir 27.4 de schema.sql)
-- ==========================================================================
\set ADM '''aaaaaaaa-0000-0000-0000-000000000001'''
\set PRO '''bbbbbbbb-0000-0000-0000-000000000002'''

\echo '=== jeu d essai ==='
insert into public.metier_demandes (id, professional_id, metiers_actuels, metiers_voulus, motif)
values ('eeeeeeee-0000-0000-0000-000000000005', :PRO, array['carreleur'],
        array['carreleur','plaquiste'], 'Je pose aussi des cloisons depuis deux ans.')
on conflict do nothing;
insert into public.specialites_proposees (id, texte, metier, propose_par)
values ('ffffffff-0000-0000-0000-000000000006', 'douche à l italienne', 'carreleur', :PRO)
on conflict do nothing;
select 'fiche avant' as quoi, metiers, verifie from public.professional_profiles where id = :PRO;

\echo '=== 1. un tiers ne lit pas les files ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000003';
  select * from public.admin_metier_demandes(); rollback;

\echo '=== 2. l administration les lit ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select entreprise, metiers_actuels, metiers_voulus, statut, jours, est_moi from public.admin_metier_demandes();
  select texte, metier_nom, propose_par, statut from public.admin_specialites();
rollback;

\echo '=== 3. ACCEPTER APPLIQUE VRAIMENT les métiers ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select public.admin_traiter_metier_demande('eeeeeeee-0000-0000-0000-000000000005', 'acceptee');
  select statut from public.admin_metier_demandes();
  reset role; reset request.jwt.claim.sub;
  select 'fiche après' as quoi, metiers, metier from public.professional_profiles where id = :PRO;
  select action, cible_type from public.journal_admin order by created_at desc limit 1;
  select type, left(texte, 55) as texte from public.notifications where user_id = :PRO order by created_at desc limit 1;
rollback;

\echo '=== 4. un refus sans motif est refusé ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select public.admin_traiter_metier_demande('eeeeeeee-0000-0000-0000-000000000005', 'refusee', 'non'); rollback;

\echo '=== 5. un refus motivé, et la fiche NE bouge PAS ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select public.admin_traiter_metier_demande('eeeeeeee-0000-0000-0000-000000000005', 'refusee',
    'Le plaquiste demande une attestation que vous n avez pas encore envoyée.');
  reset role; reset request.jwt.claim.sub;
  select 'fiche après refus' as quoi, metiers from public.professional_profiles where id = :PRO;
rollback;

\echo '=== 6. on ne tranche pas SA PROPRE demande ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  insert into public.metier_demandes (id, professional_id, metiers_actuels, metiers_voulus)
    values ('11111111-0000-0000-0000-000000000009', :ADM, array['macon'], array['macon','couvreur']);
  select public.admin_traiter_metier_demande('11111111-0000-0000-0000-000000000009', 'acceptee');
rollback;

\echo '=== 7. une spécialité se retient, et le catalogue NE bouge pas ==='
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  /* Le catalogue AVANT — « douche à l'italienne » y figure peut-être déjà
     comme spécialité du carreleur. Compter après seulement ne prouverait
     rien : c'est l'ÉCART qui compte, et il doit être nul. */
  create temporary table avant_catalogue as select count(*) n from public.metiers_catalogue;
  select public.admin_traiter_specialite('ffffffff-0000-0000-0000-000000000006', 'ajoutee');
  select texte, statut from public.admin_specialites();
  reset role; reset request.jwt.claim.sub;
  select (select n from avant_catalogue) as avant,
         (select count(*) from public.metiers_catalogue) as apres,
         (select count(*) from public.metiers_catalogue) - (select n from avant_catalogue)
           as ecart_attendu_zero;
rollback;

\echo '=== 8. un métier désactivé ne casse PAS la fiche de qui l exerce ==='
begin;
  update public.metiers_catalogue set actif = false where cle = 'carreleur';
  set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  update public.professional_profiles set telephone = '0612345678' where id = :PRO;
  select 'téléphone enregistré malgré le métier désactivé' as constat, telephone
    from public.professional_profiles where id = :PRO;
rollback;
