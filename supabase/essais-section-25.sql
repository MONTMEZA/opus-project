-- ==========================================================================
--  LES ESSAIS DE LA SECTION 25 (le back-office)
--
--  À LANCER SUR UN POSTGRESQL JETABLE, jamais sur la vraie base :
--
--      psql ... -f supabase/local-prelude.sql
--      psql ... -f supabase/schema.sql          # deux fois
--      psql ... -f supabase/essais-section-25.sql
--
--  CHAQUE CAS EST DANS SON PROPRE `begin … rollback`, ET SURTOUT PAS DANS
--  UN BLOC `do $$ … $$` : c'est la règle apprise le 01/10/2026. Dans un
--  bloc `do`, la clause `with check` d'une politique n'est PAS appliquée —
--  deux contrôles avaient « échoué » alors que la règle était juste, et
--  l'inverse est tout aussi possible. Un essai de RLS écrit dans un `do`
--  ne prouve rien.
--
--  Les seize cas, et ce que chacun défend :
--    1  la porte s'ouvre pour l'administration, pas pour les autres
--    2  un tiers ne vérifie personne
--    3  LE PIÈGE : un pro qui pose son propre badge est annulé EN SILENCE
--    4  …d'où le refus explicite quand l'administrateur est le pro visé
--    5  vérifier quelqu'un d'autre : badge, journal, ET notification lue
--       par l'artisan
--    6  un refus sans motif suffisant est refusé
--    7  un refus motivé passe
--    8  le journal ne s'écrit pas à la main, même par l'administration
--    9  …et il ne s'effface pas non plus
--   10  un administrateur n'en nomme pas un autre
--   11  trancher un signalement : `en_examen` n'est pas daté, `traite` l'est
--   12  un statut inconnu est refusé
--   13  les deux files se lisent, et pas par un tiers
--   14  `admin_resume()` rend des zéros à un tiers, sans lever d'erreur
--   15  les documents privés : l'administration les lit, un tiers non
--   16  `admin_exige_droit()` n'est pas appelable depuis l'extérieur
-- ==========================================================================
\set ADMIN   '''aaaaaaaa-0000-0000-0000-000000000001'''
\set PRO     '''bbbbbbbb-0000-0000-0000-000000000002'''
\set TIERS   '''cccccccc-0000-0000-0000-000000000003'''
\set SIGNAL  '''dddddddd-0000-0000-0000-000000000004'''
\echo '1. est_admin : admin / tiers / visiteur'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001'; select public.est_admin() as admin; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000003'; select public.est_admin() as tiers; rollback;
begin; set local role anon; select public.est_admin() as visiteur; rollback;
\echo '2. un tiers ne verifie personne'
begin; set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000003'; select public.admin_verifier_pro(:PRO, true, true); rollback;
\echo '3. LE PIEGE : le pro qui pose son propre badge est annule EN SILENCE'
begin; set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  update public.professional_profiles set kbis_valide = true, assurance_valide = true where id = :PRO;
  select verifie, kbis_valide, assurance_valide from public.professional_profiles where id = :PRO; rollback;
\echo '4. un admin refuse de se verifier LUI-MEME'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001'; select public.admin_verifier_pro(:ADMIN, true, true); rollback;
\echo '5. il verifie quelquun dautre : badge + journal + notification'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select public.admin_verifier_pro(:PRO, true, true, null, 'Kbis de mars 2026, decennale AXA');
  select verifie, verification_statut from public.professional_profiles where id = :PRO;
  select action, (apres->>'verifie') as apres from public.journal_admin order by created_at desc limit 1;
  set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
  select type, left(texte, 55) as lu_par_l_artisan from public.notifications order by created_at desc limit 1;
rollback;
\echo '6. refus sans motif suffisant'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001'; select public.admin_refuser_pro(:PRO, 'non'); rollback;
\echo '7. refus motive'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select public.admin_refuser_pro(:PRO, 'Le Kbis date de 2023 : il en faut un de moins de trois mois.');
  select verifie, verification_statut from public.professional_profiles where id = :PRO; rollback;
\echo '8. le journal ne secrit pas a la main'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  insert into public.journal_admin (admin_id, action, cible_type, cible_id) values (:ADMIN, 'pro_verifie', 'profil_pro', :PRO); rollback;
\echo '9. et il ne seffface pas'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select public.admin_verifier_pro(:PRO, true, true, null, 'pour avoir une ligne');
  with x as (delete from public.journal_admin returning 1) select count(*) as lignes_effacees from x; rollback;
\echo '10. un admin ne nomme pas un autre admin'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  insert into public.administrateurs (user_id) values (:TIERS); rollback;
\echo '11. trancher un signalement'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select public.admin_traiter_signalement(:SIGNAL, 'en_examen', 'je regarde');
  select statut, traite_at is null as pas_encore_date from public.admin_signalements();
  select public.admin_traiter_signalement(:SIGNAL, 'traite', 'photos retirees');
  select statut, traite_at is not null as datee from public.admin_signalements(); rollback;
\echo '12. statut inconnu refuse'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001'; select public.admin_traiter_signalement(:SIGNAL, 'classe-sans-suite'); rollback;
\echo '13. les deux files, et pas par un tiers'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
  select entreprise, a_envoye, est_moi from public.admin_file_verifications();
  select motif, statut, jours, cible_auteur, auteur from public.admin_signalements(); rollback;
begin; set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000003'; select * from public.admin_file_verifications(); rollback;
\echo '14. admin_resume'
begin; set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000003'; select public.admin_resume() as pour_un_tiers; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001'; select public.admin_resume() as pour_l_admin; rollback;
\echo '15. les documents prives'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001'; select 'admin' as qui, count(*) from storage.objects where bucket_id='documents'; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub = 'cccccccc-0000-0000-0000-000000000003'; select 'tiers' as qui, count(*) from storage.objects where bucket_id='documents'; rollback;
begin; set local role authenticated; set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002'; select 'proprietaire' as qui, count(*) from storage.objects where bucket_id='documents'; rollback;
\echo '16. admin_exige_droit nest pas appelable'
begin; set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001'; select public.admin_exige_droit(); rollback;
