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

-- --------------------------------------------------------------------------
--  LE JEU D'ESSAI — ajouté le 16/10/2026, et c'est la cause de la panne.
--
--  Ce fichier n'a JAMAIS contenu ses données : ADMIN, PRO, TIERS et SIGNAL
--  étaient créés à la main, avant de le lancer, sur la base où il a été
--  écrit. Rejoué sur une base NEUVE — ce que ce projet exige —, quinze des
--  seize cas n'éprouvaient rien (seul le 16 ne dépend d'aucune donnée) :
--  `est_admin()` répondait f pour l'administrateur, l'essai 3 affichait
--  « UPDATE 0 » au lieu du « UPDATE 1 » que CLAUDE.md cite, les cas 4 à 7,
--  9 et 11 à 13 tombaient sur « Cette action est réservée à
--  l'administration », puis sur « current transaction is aborted », et le
--  15 lisait 0 document des trois côtés. Les refus des cas 2, 8 et 10
--  tombaient juste PAR HASARD : personne n'était administrateur. Le cas 4
--  — « on ne vérifie pas sa propre fiche » — était refusé pour la MAUVAISE
--  raison.
--
--  Et on ne pouvait plus le recréer « à la main » : depuis la section 44,
--  une fiche pro n'existe que sur un compte pro (OP005), et depuis la
--  section 45, un compte pro ne naît qu'avec une preuve du répertoire
--  (OP006). Les deux comptes pros naissent donc comme GoTrue les crée —
--  par `auth.users`, avec les métadonnées et un SIRET FICTIF à clé juste
--  que le répertoire Sirene ne connaît pas (vérifié le 17/10/2026, témoin réel à l appui :
--  0 résultat pour le SIRET et pour le SIREN). La preuve est posée en
--  superutilisateur, comme la fonction Edge `siret` la poserait.
--
--  ADMIN est administrateur ET professionnel : c'est la situation du
--  propriétaire, et c'est ce qui donne un sens à l'essai 4 et à la colonne
--  `est_moi` de l'essai 13. PRO a envoyé son Kbis : il est en tête de la
--  file, et l'essai 15 a un document à lire. SIGNAL est un signalement
--  « contrefaçon » vieux de quatre jours — celui du relevé du 03/10.
-- --------------------------------------------------------------------------
\set QUIET on
-- Ménage d'un passage précédent interrompu : le fichier se rejoue. Le
-- signalement d'abord : il concerne un TIERS, donc la suppression de son
-- auteur l'ANONYMISE au lieu de l'emporter (`on delete set null`), et il
-- resterait pour faire échouer le passage suivant sur sa clé primaire.
delete from public.signalements where id = :SIGNAL;
delete from storage.objects where bucket_id = 'documents'
   and name like 'bbbbbbbb-0000-0000-0000-000000000002/%';
delete from auth.users where id in (:ADMIN, :PRO, :TIERS);
delete from public.preuves_siret where siret in ('00000030700017', '00000031500010');

insert into public.preuves_siret (siret, denomination, source, expire_le) values
  ('00000030700017', 'ESSAIS 25 — ADMIN', 'registre', now() + interval '1 hour'),
  ('00000031500010', 'ESSAIS 25 — PRO',   'registre', now() + interval '1 hour');

insert into auth.users (id, email, raw_user_meta_data) values
  (:ADMIN, 'admin25@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'siret', '00000030700017', 'nom', 'Admin Opus',
                      'entreprise', 'Maconnerie de l Admin', 'metiers', jsonb_build_array('macon'),
                      'ville', 'Lambesc (13)')),
  (:PRO, 'pro25@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'siret', '00000031500010', 'nom', 'Pro Carreleur',
                      'entreprise', 'Carrelage du Sud', 'metiers', jsonb_build_array('carreleur'),
                      'ville', 'Aix-en-Provence (13)')),
  (:TIERS, 'tiers25@exemple-opus.test',
   jsonb_build_object('type', 'particulier', 'nom', 'Un Tiers'));

-- La seule entrée de cette table est l'éditeur SQL (25.1) : c'est ici.
insert into public.administrateurs (user_id, note) values (:ADMIN, 'essais section 25');

-- PRO a envoyé son Kbis ET son attestation, rangés dans SON dossier de
-- l'espace privé. Les deux : depuis le lot S-a (25/10/2026), on ne valide
-- plus une pièce qui n'est pas là — le cas 5 valide les deux.
insert into storage.objects (bucket_id, name, owner)
values ('documents', 'bbbbbbbb-0000-0000-0000-000000000002/kbis.pdf', :PRO),
       ('documents', 'bbbbbbbb-0000-0000-0000-000000000002/assurance.pdf', :PRO);
update public.professional_profiles
   set kbis_url = 'bbbbbbbb-0000-0000-0000-000000000002/kbis.pdf',
       assurance_url = 'bbbbbbbb-0000-0000-0000-000000000002/assurance.pdf',
       verification_statut = 'en_attente'
 where id = :PRO;

-- Une publication de PRO, que TIERS a signalée il y a quatre jours.
insert into public.posts (id, author_id, type, texte)
values ('eeeeeeee-0000-0000-0000-000000000025', :PRO, 'photo', 'Salle de bains terminee.');
insert into public.signalements
  (id, auteur_id, cible_type, cible_id, cible_auteur_id, extrait, motif, created_at)
values (:SIGNAL, :TIERS, 'publication', 'eeeeeeee-0000-0000-0000-000000000025', :PRO,
        'Salle de bains terminee.', 'contrefacon', now() - interval '4 days');
\set QUIET off

\echo '0. LA DONNEE EXISTE avant qu on pretende la proteger (le piege de la section 29)'
\echo '   attendu : Admin Opus pro|t|f|t ; Pro Carreleur pro|t|f|f ; Un Tiers particulier|f||f ; puis 1 | 2'
select u.nom, u.type,
       exists (select 1 from public.professional_profiles p where p.id = u.id) as a_une_fiche,
       (select p.verifie from public.professional_profiles p where p.id = u.id) as verifie,
       exists (select 1 from public.administrateurs a where a.user_id = u.id) as admin
  from public.users u where u.id in (:ADMIN, :PRO, :TIERS) order by u.nom;
select (select count(*) from public.signalements where id = :SIGNAL) as signalements,
       (select count(*) from storage.objects where bucket_id = 'documents') as documents;

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

-- --------------------------------------------------------------------------
--  Ménage : la base ressort comme elle est entrée. Supprimer les comptes
--  par `auth.users` emporte, en cascade, leurs lignes `users`, les fiches,
--  les identités, l'administrateur et la publication. PAS le signalement :
--  il est anonymisé (`on delete set null`), donc il part à la main.
-- --------------------------------------------------------------------------
\set QUIET on
delete from public.signalements where id = :SIGNAL;
delete from storage.objects where bucket_id = 'documents'
   and name like 'bbbbbbbb-0000-0000-0000-000000000002/%';
delete from auth.users where id in (:ADMIN, :PRO, :TIERS);
delete from public.preuves_siret where siret in ('00000030700017', '00000031500010');
\set QUIET off
