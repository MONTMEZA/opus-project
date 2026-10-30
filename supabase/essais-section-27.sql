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
\set TIERS '''cccccccc-0000-0000-0000-000000000003'''

-- --------------------------------------------------------------------------
--  LES COMPTES — ajoutés le 16/10/2026, et c'est la cause de la panne.
--
--  Ce fichier ne créait ni l'administrateur, ni l'artisan, ni le tiers :
--  ils l'étaient à la main, avant de le lancer, sur la base où il a été
--  écrit (les mêmes identifiants que `essais-section-25.sql`). Rejoué sur
--  une base NEUVE, la demande de métiers et la spécialité proposée
--  tombaient sur leur clé étrangère, ADM n'était pas administrateur, et
--  aucun des huit cas n'éprouvait rien : les cas 2 à 5 et 7 répondaient
--  « Cette action est réservée à l'administration » puis « current
--  transaction is aborted », le 6 tombait sur la clé étrangère de sa
--  propre demande avant d'atteindre le verrou, et le 8 affichait
--  « UPDATE 0 » et une ligne vide. Le cas 1 — « un tiers ne lit pas les
--  files » — était refusé pour la bonne raison par hasard : personne
--  n'était administrateur.
--
--  Et on ne peut plus créer un pro « à la main » : section 44 (OP005) puis
--  section 45 (OP006). Les deux pros naissent comme GoTrue les crée — par
--  `auth.users`, avec les métadonnées et un SIRET FICTIF à clé juste, que
--  le répertoire Sirene ne connaît pas (vérifié le 17/10/2026, témoin réel à l appui : 0 résultat
--  pour le SIRET et pour le SIREN). La preuve est posée en
--  superutilisateur, comme la fonction Edge `siret` la poserait.
--
--  ADM est administrateur ET professionnel (maçon) : sans fiche, il ne
--  pourrait pas déposer la demande de l'essai 6, et le refus qu'on y lit
--  viendrait de la clé étrangère au lieu de « on ne tranche pas sa propre
--  demande ».
-- --------------------------------------------------------------------------
\set QUIET on
-- Ménage d'un passage précédent interrompu : le fichier se rejoue.
delete from public.specialites_proposees where id = 'ffffffff-0000-0000-0000-000000000006';
delete from auth.users where id in (:ADM, :PRO, :TIERS);
delete from public.preuves_siret where siret in ('00000032300014', '00000033100017');

insert into public.preuves_siret (siret, denomination, source, expire_le) values
  ('00000032300014', 'ESSAIS 27 — ADMIN', 'registre', now() + interval '1 hour'),
  ('00000033100017', 'ESSAIS 27 — PRO',   'registre', now() + interval '1 hour');

insert into auth.users (id, email, raw_user_meta_data) values
  (:ADM, 'admin27@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'siret', '00000032300014', 'nom', 'Admin Opus',
                      'entreprise', 'Maconnerie de l Admin', 'metiers', jsonb_build_array('macon'),
                      'ville', 'Lambesc (13)')),
  (:PRO, 'pro27@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'siret', '00000033100017', 'nom', 'Pro Carreleur',
                      'entreprise', 'Carrelage du Sud', 'metiers', jsonb_build_array('carreleur'),
                      'ville', 'Aix-en-Provence (13)')),
  (:TIERS, 'tiers27@exemple-opus.test',
   jsonb_build_object('type', 'particulier', 'nom', 'Un Tiers'));

-- La seule entrée de cette table est l'éditeur SQL (25.1) : c'est ici.
insert into public.administrateurs (user_id, note) values (:ADM, 'essais section 27');

-- PRO est VÉRIFIÉ, et c'est ce qui donne son sens à l'essai 3 (relecture
-- adverse du 17/10/2026). Le verrou `tient_les_metiers()` ne mord que sur
-- une fiche vérifiée (`old.verifie`) : avec un PRO non vérifié — ce que
-- donnait la première réparation —, l'essai 3 passait sans que le verrou
-- soit sur le chemin, et il ne prouvait pas ce que la section 27 affirme :
-- « l'artisan vérifié ne peut pas le faire lui-même ; l'administrateur,
-- lui, passe ». Posé ici en superutilisateur (`auth.uid()` vide), comme le
-- ferait l'administration.
update public.professional_profiles
   set kbis_valide = true, assurance_valide = true
 where id = :PRO;
\set QUIET off

\echo '=== jeu d essai ==='
\echo '-- attendu : INSERT 0 1, INSERT 0 1, puis « fiche avant | {carreleur} | t »'
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
-- La demande est posée par l'éditeur SQL : depuis le lot S-c (section 52.2),
-- le client n'insère que les colonnes que l'application envoie, et `id`
-- n'en fait pas partie. Insérée en `authenticated` avec son `id`, elle
-- était refusée, et l'appel de l'administrateur n'était plus JAMAIS joué —
-- l'essai ne prouvait plus rien, sans rien rougir (critique du 29/10).
begin;
  insert into public.metier_demandes (id, professional_id, metiers_actuels, metiers_voulus)
    values ('11111111-0000-0000-0000-000000000009', :ADM, array['macon'], array['macon','couvreur']);
  set local role authenticated; set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
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

-- --------------------------------------------------------------------------
--  Ménage : la base ressort comme elle est entrée. La spécialité proposée
--  survit à son auteur (`on delete set null`, c'est voulu) : elle part à
--  la main. Le reste suit les comptes en cascade.
-- --------------------------------------------------------------------------
\set QUIET on
delete from public.specialites_proposees where id = 'ffffffff-0000-0000-0000-000000000006';
delete from auth.users where id in (:ADM, :PRO, :TIERS);
delete from public.preuves_siret where siret in ('00000032300014', '00000033100017');
\set QUIET off
