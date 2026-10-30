-- ==========================================================================
--  ESSAIS DU LOT S-c — les compteurs et les dates tenus par la base, et la
--  remise en avant (30/10/2026)
--
--  À rejouer sur un PostgreSQL NEUF, après local-prelude.sql et schema.sql
--  (deux fois) :
--
--    psql -d opus -v ON_ERROR_STOP=0 -f supabase/essais-section-51c.sql
--
--  Méthode : celle de tous les essais du projet. Chaque cas est dans son
--  propre `begin … rollback` ; le rôle et l'identité se posent par
--  `set local`, chacun dans son propre ordre, JAMAIS dans un bloc `do` (une
--  politique RLS n'y est pas appliquée). Un ordre qui doit échouer est le
--  DERNIER de sa transaction. Les relectures rendent des BOOLÉENS nommés
--  d'après ce qu'ils prouvent : chacun doit valoir `t`.
--
--  « avant le lot » : mesuré en jouant les mêmes écritures sur le schéma du
--  commit 2bab8ec (juste avant S-c) — la critique « base » du 29/10.
--
--  ORDRE : A. la donnée existe ; B. les dates ; C. les files ;
--  D. la réputation ; E. les publications ; F. les commentaires ;
--  G. les chantiers ; H. les avis ; I. le compte ; J. la remise en avant ;
--  K. le fil ; L. le catalogue.
--
--  Les SIRET sont fictifs, à clé de contrôle juste (ceux de
--  essais-section-45.sql), les comptes sont préfixés a51c0000.
--
--    A  plombier, qui répond aux urgences, tarifs affichés ;
--    B  électricien ; P  particulier ; Q  autre particulier ;
--    ADMIN  l'administration.
-- ==========================================================================

\set QUIET on
\pset pager off

\set ADMIN '''a51c0000-0000-4000-8000-0000000000ad'''
\set A     '''a51c0000-0000-4000-8000-00000000000a'''
\set B     '''a51c0000-0000-4000-8000-00000000000b'''
\set P     '''a51c0000-0000-4000-8000-000000000001'''
\set Q     '''a51c0000-0000-4000-8000-000000000002'''
\set PA    '''a51c0000-0000-4000-8000-0000000000a1'''
\set PA2   '''a51c0000-0000-4000-8000-0000000000a2'''
\set PA3   '''a51c0000-0000-4000-8000-0000000000a3'''
\set PA4   '''a51c0000-0000-4000-8000-0000000000a4'''
\set PA5   '''a51c0000-0000-4000-8000-0000000000a5'''
\set PB    '''a51c0000-0000-4000-8000-0000000000b1'''
\set AN_A  '''a51c0000-0000-4000-8000-0000000000a6'''
\set DEM_P '''a51c0000-0000-4000-8000-0000000000d1'''
\set CONV  '''a51c0000-0000-4000-8000-0000000000c1'''
\set PUB   '''a51c0000-0000-4000-8000-0000000000ee'''

-- Ménage d'un passage précédent : le fichier se rejoue.
delete from public.administrateurs where user_id = :ADMIN;
delete from public.posts where id = :PUB;
delete from auth.users where id::text like 'a51c0000-0000-4000-8000-%';
delete from public.preuves_siret where siret in ('00000024000010', '00000025700014', '00000020800017');

insert into public.preuves_siret
  (siret, denomination, nom_complet_registre, est_ei, forme_juridique, ape, est_siege,
   adresse, code_postal, commune, code_insee, statut_diffusion, source, verifiee_le, expire_le)
values
  ('00000024000010', 'ENTREPRISE A ESSAI', 'ENTREPRISE A ESSAI', false, '5499', '43.22A', true,
   '1 RUE A', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours'),
  ('00000025700014', 'ENTREPRISE B ESSAI', 'ENTREPRISE B ESSAI', false, '5499', '43.21A', true,
   '2 RUE B', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours'),
  ('00000020800017', 'ENTREPRISE C ESSAI', 'ENTREPRISE C ESSAI', false, '5499', '43.99C', true,
   '3 RUE C', '13001', 'MARSEILLE', '13201', 'O', 'registre', now(), now() + interval '24 hours');

insert into auth.users (id, email, raw_user_meta_data) values
  (:ADMIN, 'admin51c@exemple-opus.test', '{"type":"particulier","nom":"Admin Opus","cgu":"2026-10-28"}'::jsonb),
  (:A, 'a51c@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan A', 'entreprise', 'Plomberie A', 'cgu', '2026-10-28',
                      'metiers', jsonb_build_array('plombier'), 'ville', 'Marseille (13)',
                      'latitude', '43.2965', 'longitude', '5.3698', 'siret', '00000024000010')),
  (:B, 'b51c@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan B', 'entreprise', 'Électricité B', 'cgu', '2026-10-28',
                      'metiers', jsonb_build_array('electricien'), 'ville', 'Marseille (13)',
                      'siret', '00000025700014')),
  (:P, 'p51c@exemple-opus.test',
   '{"type":"particulier","nom":"Paule P.","ville":"Marseille (13)","cgu":"2026-10-28"}'::jsonb),
  (:Q, 'q51c@exemple-opus.test',
   '{"type":"particulier","nom":"Quentin Q.","ville":"Marseille (13)","cgu":"version-inventee-2099"}'::jsonb);
insert into public.administrateurs (user_id, note) values (:ADMIN, 'essais lot S-c');

-- A répond aux urgences de plomberie, tarifs affichés et complets.
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes, taux_horaire_centimes,
                               majoration_pct, affiche)
values (:A, 4500, 6200, 40, true);
insert into public.sos_availability (professional_id, metier_key, actif, rayon_km, delai_minutes)
values (:A, 'plomberie', true, 20, 45);

-- Écrites par l'éditeur SQL (postgres) : ses dates passent (R-A). Cinq
-- publications de A, de plus en plus anciennes ; une de B ; une annonce
-- de A ; une demande de P ; une conversation P-A.
insert into public.posts (id, author_id, type, texte, metier, latitude, longitude, created_at) values
  (:PA,  :A, 'texte', 'Publication de A, il y a 2 h', 'plombier', 43.30, 5.37, now() - interval '2 hours'),
  (:PA2, :A, 'texte', 'Publication de A, il y a 10 j', 'plombier', 43.30, 5.37, now() - interval '10 days'),
  (:PA3, :A, 'texte', 'Publication de A, il y a 11 j', 'plombier', 43.30, 5.37, now() - interval '11 days'),
  (:PA4, :A, 'texte', 'Publication de A, il y a 12 j', 'plombier', 43.30, 5.37, now() - interval '12 days'),
  (:PA5, :A, 'texte', 'Publication de A, il y a 13 j', 'plombier', 43.30, 5.37, now() - interval '13 days'),
  (:PB,  :B, 'texte', 'Publication de B, il y a 1 h', 'electricien', 43.30, 5.37, now() - interval '1 hour');
insert into public.annonces_pro (id, auteur_id, type, titre, texte) values
  (:AN_A, :A, 'entraide', 'Annonce de A', 'Un coup de main');
insert into public.demandes (id, client_id, metier, ville, texte) values
  (:DEM_P, :P, 'plombier', 'Marseille (13)', 'Fuite sous l évier');
insert into public.conversations (id, client_id, professional_id) values (:CONV, :P, :A);

\set QUIET off

\echo ''
\echo '##### A. LA DONNÉE EXISTE #####'

\echo '--- A1. A est pro avec sa fiche, P particulier, 6 publications, la conversation (attendu : t | t | 6 | 1)'
select (select type = 'pro' from public.users where id = :A)
         and exists (select 1 from public.professional_profiles where id = :A) as a_est_pro,
       (select type = 'particulier' from public.users where id = :P) as p_particulier,
       (select count(*) from public.posts where id::text like 'a51c0000-%') as publications,
       (select count(*) from public.conversations where id = :CONV) as conversation;

\echo '--- A2. La version des CGU : P garde « 2026-10-28 », Q (« version-inventee-2099 ») n en a pas (attendu : t | t). Avant le lot : Q gardait la version inventée.'
select (select cgu_version = '2026-10-28' and cgu_acceptees_le is not null from public.users where id = :P) as p_garde_sa_version,
       (select cgu_version is null and cgu_acceptees_le is null from public.users where id = :Q) as q_version_ecartee;

\echo ''
\echo '##### B. LES DATES — posées par la base #####'

\echo '--- B1. Le client écrit 2099 ou 2001 à la CRÉATION, dans dix tables : chaque date est celle du jour (attendu : t sur toute la ligne). Avant le lot : 2099 et 2001 étaient gardées.'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.comments (id, post_id, author_id, texte, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f1', :PA, :P, 'Commentaire', '2099-01-01');
insert into public.quote_requests (id, client_id, professional_id, metier, description, nom, telephone, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f2', :P, :A, 'plombier', 'Fuite', 'Paule', '06 39 98 00 01', '2099-01-01');
insert into public.callback_requests (id, client_id, professional_id, nom, telephone, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f3', :P, :A, 'Paule', '06 39 98 00 01', '2001-01-01');
insert into public.sos_requests (id, client_id, professional_id, metier_key, probleme_key, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f4', :P, :A, 'plomberie', 'fuite', '2099-01-01');
insert into public.messages (id, conversation_id, sender_id, texte, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f5', :CONV, :P, 'Bonjour', '2001-01-01');
insert into public.post_vues (post_id, spectateur_id, created_at) values (:PB, :P, '2099-01-01');
insert into public.reviews (id, professional_id, author_id, delais, qualite, tarif, commentaire, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f6', :A, :P, 4, 4, 4, 'Bien', '2001-01-01');
insert into public.demandes (id, client_id, metier, ville, texte, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f7', :P, 'plombier', 'Marseille (13)', 'Robinet', '2099-01-01');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.posts (id, author_id, type, texte, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f8', :A, 'texte', 'Forgée', '2099-01-01');
insert into public.demande_reponses (id, demande_id, professional_id, message, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f9', :DEM_P, :A, 'Je peux passer', '2001-01-01');
insert into public.chantiers (id, pro_id, titre, created_at)
  values ('a51c0000-0000-4000-8000-0000000000fa', :A, 'Toiture Charleval', '2001-01-01');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000b';
insert into public.annonce_reponses (id, annonce_id, professional_id, message, created_at)
  values ('a51c0000-0000-4000-8000-0000000000fb', :AN_A, :B, 'Dispo', '2099-01-01');
insert into public.annonces_pro (id, auteur_id, type, titre, texte, created_at)
  values ('a51c0000-0000-4000-8000-0000000000fc', :B, 'entraide', 'Annonce B', 'Coup de main', '2001-01-01');
reset role;
select
  (select abs(extract(epoch from now() - created_at)) < 60 from public.comments          where id = 'a51c0000-0000-4000-8000-0000000000f1') as commentaire,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.quote_requests    where id = 'a51c0000-0000-4000-8000-0000000000f2') as devis,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.callback_requests where id = 'a51c0000-0000-4000-8000-0000000000f3') as rappel,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.sos_requests      where id = 'a51c0000-0000-4000-8000-0000000000f4') as urgence,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.messages          where id = 'a51c0000-0000-4000-8000-0000000000f5') as message,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.post_vues         where post_id = :PB and spectateur_id = :P) as vue,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.reviews           where id = 'a51c0000-0000-4000-8000-0000000000f6') as avis,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.demandes          where id = 'a51c0000-0000-4000-8000-0000000000f7') as demande,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.posts             where id = 'a51c0000-0000-4000-8000-0000000000f8') as publication,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.demande_reponses  where id = 'a51c0000-0000-4000-8000-0000000000f9') as reponse_demande,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.chantiers         where id = 'a51c0000-0000-4000-8000-0000000000fa') as chantier,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.annonce_reponses  where id = 'a51c0000-0000-4000-8000-0000000000fb') as reponse_annonce,
  (select abs(extract(epoch from now() - created_at)) < 60 from public.annonces_pro      where id = 'a51c0000-0000-4000-8000-0000000000fc') as annonce;
rollback;

\echo '--- B2. Le client récrit la date en MODIFICATION, là où c est le mode : annonce, demande, chantier, fiche, compte (attendu : t sur toute la ligne)'
begin;
insert into public.chantiers (id, pro_id, titre, created_at)
  values ('a51c0000-0000-4000-8000-0000000000fa', :A, 'Toiture Charleval', now() - interval '3 days');
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
update public.annonces_pro set created_at = '2099-01-01', titre = 'Annonce de A (corrigée)' where id = :AN_A;
update public.chantiers set created_at = '2001-01-01', titre = 'Toiture' where id = 'a51c0000-0000-4000-8000-0000000000fa';
update public.professional_profiles set created_at = '2001-01-01', bio = 'Nouvelle bio' where id = :A;
update public.users set created_at = '2001-01-01', nom = 'Artisan A bis' where id = :A;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
update public.demandes set created_at = '2099-01-01', texte = 'Fuite (corrigée)' where id = :DEM_P;
reset role;
select
  (select created_at < now() + interval '1 minute' and titre like '%corrigée%' from public.annonces_pro where id = :AN_A) as annonce_gardee_texte_change,
  (select created_at > now() - interval '4 days' and created_at < now() - interval '2 days' and titre = 'Toiture'
     from public.chantiers where id = 'a51c0000-0000-4000-8000-0000000000fa') as chantier_garde_sa_date,
  (select created_at > now() - interval '1 hour' and bio = 'Nouvelle bio' from public.professional_profiles where id = :A) as fiche_gardee,
  (select created_at > now() - interval '1 hour' and nom = 'Artisan A bis' from public.users where id = :A) as compte_garde,
  (select created_at < now() + interval '1 minute' and texte like '%corrigée%' from public.demandes where id = :DEM_P) as demande_gardee;
rollback;

\echo '--- B3. Une demande reçue datée en modification : OP019 tient toujours, la date du jour reste (attendu : ERROR OP019)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.quote_requests (id, client_id, professional_id, metier, description, nom, telephone)
  values ('a51c0000-0000-4000-8000-0000000000f2', :P, :A, 'plombier', 'Fuite', 'Paule', '06 39 98 00 01');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
update public.quote_requests set created_at = '2001-01-01', statut = 'accepte'
 where id = 'a51c0000-0000-4000-8000-0000000000f2';
rollback;

\echo '--- B4. Une réponse à une annonce datée en modification : OP021 tient toujours (attendu : ERROR OP021)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000b';
insert into public.annonce_reponses (id, annonce_id, professional_id, message)
  values ('a51c0000-0000-4000-8000-0000000000fb', :AN_A, :B, 'Dispo');
update public.annonce_reponses set created_at = '2001-01-01' where id = 'a51c0000-0000-4000-8000-0000000000fb';
rollback;

\echo '--- B5. L éditeur SQL (postgres) garde ses dates — c est ce qui permet les reprises et les essais (attendu : t)'
begin;
insert into public.posts (id, author_id, type, texte, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f8', :A, 'texte', 'Reprise', '2026-01-01');
select (select created_at = '2026-01-01'::timestamptz from public.posts where id = 'a51c0000-0000-4000-8000-0000000000f8') as date_de_l_editeur_gardee;
rollback;

-- B6 — LE CARNET DE CLIENTS, l'EXCEPTION à B5 (relecture du 30/10 : la
-- règle de `tient_le_client()` n'était éprouvée nulle part). Sa date est
-- posée par la base pour TOUS les rôles, éditeur SQL compris : le carnet ne
-- se reprend aujourd'hui depuis aucun autre outil. Le jour où il le faudra
-- (un import de clients), cette règle sera à revoir — et cet essai avec.
\echo '--- B6. Le carnet : création datée 2099 par A → date du jour ; modification datée 2001 → date gardée, le nom change ; l éditeur SQL aussi remis à l horloge (attendu : t | t | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.clients (id, pro_id, type, nom, created_at)
  values ('a51c0000-0000-4000-8000-0000000000c6', :A, 'particulier', 'Mme Test', '2099-01-01');
update public.clients set created_at = '2001-01-01', nom = 'Mme Test bis'
  where id = 'a51c0000-0000-4000-8000-0000000000c6';
reset role;
insert into public.clients (id, pro_id, type, nom, created_at)
  values ('a51c0000-0000-4000-8000-0000000000c7', :A, 'particulier', 'Reprise', '2020-01-01');
select (select abs(extract(epoch from now() - created_at)) < 60 from public.clients where id = 'a51c0000-0000-4000-8000-0000000000c6') as creation_du_jour,
       (select created_at > '2001-01-02' from public.clients where id = 'a51c0000-0000-4000-8000-0000000000c6') as modification_gardee,
       (select nom = 'Mme Test bis' from public.clients where id = 'a51c0000-0000-4000-8000-0000000000c6') as nom_change,
       (select abs(extract(epoch from now() - created_at)) < 60 from public.clients where id = 'a51c0000-0000-4000-8000-0000000000c7') as editeur_aussi_a_l_horloge;
rollback;

\echo ''
\echo '##### C. LES FILES DE L ADMINISTRATION — droits de colonne #####'

\echo '--- C1. Les colonnes que l application envoie passent : un signalement (8), une demande de métiers (4, avec returning), une spécialité (3) (attendu : INSERT 0 1, une ligne rendue, INSERT 0 1, puis t | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.signalements (auteur_id, cible_type, cible_id, cible_auteur_id, extrait, motif, details, statut)
  values (:P, 'publication', :PA, :A, 'Publication de A', 'spam', null, 'nouveau');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.metier_demandes (professional_id, metiers_actuels, metiers_voulus, motif)
  values (:A, array['plombier'], array['plombier', 'chauffagiste'], 'Je fais aussi du chauffage')
  returning statut;
insert into public.specialites_proposees (texte, metier, propose_par) values ('Recherche de fuite', 'plombier', :A);
reset role;
select (select statut = 'nouveau' and traite_par is null and note is null and abs(extract(epoch from now() - created_at)) < 60
          from public.signalements where auteur_id = :P) as signalement_neuf,
       (select statut = 'en_attente' and note is null and abs(extract(epoch from now() - created_at)) < 60
          from public.metier_demandes where professional_id = :A) as demande_metiers_neuve,
       (select statut = 'en_attente' from public.specialites_proposees where propose_par = :A) as specialite_neuve;
rollback;

\echo '--- C2. Un signalement né « traité par l administrateur » (attendu : ERROR permission denied for table signalements). Avant le lot : INSERT 0 1.'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.signalements (auteur_id, cible_type, cible_id, motif, statut, traite_par, note, traite_at, created_at)
  values (:P, 'publication', :PA, 'spam', 'nouveau', :ADMIN, 'rien à signaler', now(), '2001-01-01');
rollback;

\echo '--- C3. Une demande de métiers née « acceptée » (attendu : ERROR permission denied for table metier_demandes)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.metier_demandes (professional_id, metiers_actuels, metiers_voulus, statut)
  values (:A, array['plombier'], array['plombier', 'macon'], 'acceptee');
rollback;

\echo '--- C4. Une spécialité née « ajoutée », datée 2001 (attendu : ERROR permission denied for table specialites_proposees)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.specialites_proposees (texte, metier, propose_par, statut, created_at)
  values ('Pose de ballon', 'plombier', :A, 'ajoutee', '2001-01-01');
rollback;

\echo ''
\echo '##### D. LA RÉPUTATION D UNE FICHE #####'

\echo '--- D1. A forge ses avis, ses notes, ses abonnés, et pose « demandes vues » en 2099 (attendu : t | t | t | t). Avant le lot : 9999, 5,00, 9999, 2099.'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
update public.professional_profiles
   set avis_count = 9999, note_delais = 5, note_qualite = 5, note_tarif = 5,
       followers_count = 9999, demandes_vues_le = '2099-01-01', bio = 'Bio'
 where id = :A;
reset role;
select avis_count = 0 as avis_gardes,
       note_delais = 0 and note_qualite = 0 and note_tarif = 0 as notes_gardees,
       followers_count = 0 as abonnes_gardes,
       abs(extract(epoch from now() - demandes_vues_le)) < 60 as vue_a_l_heure_de_la_base
  from public.professional_profiles where id = :A;
rollback;

\echo '--- D2. Les vrais gestes font toujours bouger les compteurs : un abonnement, un avis (attendu : 1 | 1 | 4.00)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.follows (follower_id, following_id) values (:P, :A);
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 4, 4, 4, 'Bien');
reset role;
select followers_count, avis_count, note_qualite from public.professional_profiles where id = :A;
rollback;

\echo ''
\echo '##### E. LES PUBLICATIONS — elles naissent sans rien #####'

\echo '--- E1. A publie avec 9999 j aime, en fausse publicité, déjà « modifiée » et « remise en avant » (attendu : t | t | t). Avant le lot : tout était gardé.'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.posts (id, author_id, type, texte, likes_count, comments_count, vues_count,
                          is_ad, annonceur, accroche, cta, modifie_le, remonte_le)
  values ('a51c0000-0000-4000-8000-0000000000f8', :A, 'texte', 'Forgée', 9999, 9999, 9999,
          true, 'Marque X', 'Promo', 'Voir', '2001-01-01', '2099-01-01');
reset role;
select likes_count = 0 and comments_count = 0 and vues_count = 0 as compteurs_a_zero,
       not is_ad and annonceur is null and accroche is null and cta is null as pas_une_publicite,
       modifie_le is null and remonte_le is null as ni_modifiee_ni_remontee
  from public.posts where id = 'a51c0000-0000-4000-8000-0000000000f8';
rollback;

\echo '--- E2. Le client « upserte » sa publication pour récrire sa date, sa remise en avant, ses j aime (attendu : t | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.posts (id, author_id, type, texte) values (:PA2, :A, 'texte', 'x')
  on conflict (id) do update set created_at = '2099-01-01', remonte_le = '2099-01-01', likes_count = 5000;
reset role;
select created_at < now() - interval '9 days' as date_gardee, remonte_le is null as pas_remontee, likes_count = 0 as jaime_gardes
  from public.posts where id = :PA2;
rollback;

\echo '--- E3. L éditeur SQL pose une VRAIE publicité, sans auteur, avec un métier et des coordonnées (attendu : INSERT 0 1)'
begin;
insert into public.posts (id, type, texte, is_ad, annonceur, metier, latitude, longitude)
  values (:PUB, 'photo', 'Promo', true, 'Négoce essai', 'plombier', 43.30, 5.37);
rollback;

\echo '--- E4. Une publicité AVEC un auteur (attendu : ERROR new row … violates check constraint "post_publicite_sans_auteur_check"). Avant le lot : INSERT 0 1.'
begin;
insert into public.posts (id, author_id, type, texte, is_ad, annonceur)
  values (:PUB, :A, 'photo', 'Promo', true, 'Négoce essai');
rollback;

\echo '--- E5. Une publication sans auteur ni publicité : refusée par l ancienne contrainte, qui reste (attendu : ERROR … "post_a_un_auteur_ou_est_une_pub")'
begin;
insert into public.posts (id, type, texte) values (:PUB, 'texte', 'Personne');
rollback;

\echo ''
\echo '##### F. LES COMMENTAIRES #####'

\echo '--- F1. P commente en 2099, « modifié » et « auteur supprimé » (attendu : t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.comments (id, post_id, author_id, texte, created_at, modifie_le, auteur_supprime)
  values ('a51c0000-0000-4000-8000-0000000000f1', :PA, :P, 'Ce prix me paraît trop bas', '2099-01-01', '2001-01-01', true);
reset role;
select abs(extract(epoch from now() - created_at)) < 60 as date_du_jour,
       modifie_le is null and not auteur_supprime as ni_modifie_ni_supprime
  from public.comments where id = 'a51c0000-0000-4000-8000-0000000000f1';
rollback;

\echo '--- F2. LE VERROU OP001 NE SE CONTOURNE PLUS : P date son commentaire 2099, Q lui répond, P veut le récrire (attendu : ERROR OP001). Avant le lot : UPDATE 1 — la conversation se récrivait.'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.comments (id, post_id, author_id, texte, created_at)
  values ('a51c0000-0000-4000-8000-0000000000f1', :PA, :P, 'Ce prix me paraît trop bas', '2099-01-01');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000002';
insert into public.comments (post_id, author_id, texte, parent_id)
  values (:PA, :Q, 'D accord', 'a51c0000-0000-4000-8000-0000000000f1');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
update public.comments set texte = 'Ce prix me paraît honnête' where id = 'a51c0000-0000-4000-8000-0000000000f1';
rollback;

\echo ''
\echo '##### G. LES CHANTIERS #####'

\echo '--- G1. A crée un chantier « 9999 publications », puis le récrit ; une vraie publication le recalcule (attendu : t | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.chantiers (id, pro_id, titre, nb_publications, couverture, debut, fin)
  values ('a51c0000-0000-4000-8000-0000000000fa', :A, 'Toiture', 9999, 'https://x/y.jpg', '2001-01-01', '2099-01-01');
reset role;
select nb_publications = 0 and couverture is null and debut is null and fin is null as ne_sans_rien
  from public.chantiers where id = 'a51c0000-0000-4000-8000-0000000000fa';
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
update public.chantiers set nb_publications = 500, couverture = 'z', statut = 'termine'
 where id = 'a51c0000-0000-4000-8000-0000000000fa';
reset role;
select nb_publications = 0 and couverture is null and statut = 'termine' as compteurs_gardes_statut_change
  from public.chantiers where id = 'a51c0000-0000-4000-8000-0000000000fa';
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.posts (author_id, type, texte, media, chantier_id)
  values (:A, 'photo', 'Étape', 'https://img/1.jpg', 'a51c0000-0000-4000-8000-0000000000fa');
reset role;
select nb_publications = 1 and couverture = 'https://img/1.jpg' as recalcule_par_la_base
  from public.chantiers where id = 'a51c0000-0000-4000-8000-0000000000fa';
rollback;

\echo ''
\echo '##### H. LES AVIS — figés, mais retirables (décision du 29/10) #####'

\echo '--- H1. P publie un avis daté 2001, « auteur supprimé », « client vérifié » (attendu : t | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.reviews (id, professional_id, author_id, delais, qualite, tarif, commentaire,
                            created_at, auteur_supprime, client_verifie)
  values ('a51c0000-0000-4000-8000-0000000000f6', :A, :P, 5, 5, 5, 'Bien', '2001-01-01', true, true);
reset role;
select abs(extract(epoch from now() - created_at)) < 60 as date_du_jour,
       not auteur_supprime as auteur_present,
       not client_verifie as verifie_par_la_base
  from public.reviews where id = 'a51c0000-0000-4000-8000-0000000000f6';
rollback;

\echo '--- H2. P veut DÉPLACER son avis vers B (attendu : ERROR permission denied for table reviews). Avant le lot : UPDATE 1.'
begin;
insert into public.reviews (id, professional_id, author_id, delais, qualite, tarif, commentaire)
  values ('a51c0000-0000-4000-8000-0000000000f6', :A, :P, 1, 1, 1, 'Mal');
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
update public.reviews set professional_id = :B where id = 'a51c0000-0000-4000-8000-0000000000f6';
rollback;

\echo '--- H3. P « upserte » son avis pour le récrire (attendu : ERROR permission denied for table reviews)'
begin;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 1, 1, 1, 'Mal');
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 5, 5, 5, 'Très bien')
  on conflict (professional_id, author_id) do update set commentaire = 'Très bien';
rollback;

\echo '--- H4. P RETIRE son avis, puis en écrit un autre ; la note suit (attendu : DELETE 1, INSERT 0 1, puis 1 | 5.00)'
begin;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 1, 1, 1, 'Mal');
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
delete from public.reviews where professional_id = :A and author_id = :P;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 5, 5, 5, 'Finalement très bien');
reset role;
select avis_count, note_qualite from public.professional_profiles where id = :A;
rollback;

\echo '--- H5. P a bloqué A : il peut encore RETIRER son avis (clore, oui) (attendu : DELETE 1)'
begin;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 1, 1, 1, 'Mal');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
delete from public.reviews where professional_id = :A and author_id = :P;
rollback;

\echo '--- H6. Q ne retire pas l avis de P (attendu : DELETE 0)'
begin;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 1, 1, 1, 'Mal');
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000002';
delete from public.reviews where professional_id = :A and author_id = :P;
rollback;

\echo '--- H7. Un second avis du même client (attendu : ERROR … "reviews_professional_id_author_id_key")'
begin;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 1, 1, 1, 'Mal');
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
  values (:A, :P, 5, 5, 5, 'Encore');
rollback;

\echo '--- H8. L anonymisation passe malgré le droit retiré : P supprime son compte, son avis reste, détaché (attendu : t)'
begin;
insert into public.reviews (id, professional_id, author_id, delais, qualite, tarif, commentaire)
  values ('a51c0000-0000-4000-8000-0000000000f6', :A, :P, 4, 4, 4, 'Bien');
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
select public.preparer_suppression_compte() is not null as suppression_preparee;
reset role;
select author_id is null and auteur_supprime as avis_anonymise
  from public.reviews where id = 'a51c0000-0000-4000-8000-0000000000f6';
rollback;

\echo ''
\echo '##### I. LE COMPTE #####'

\echo '--- I1. P récrit sa trace des CGU (attendu : ERROR OP023). Avant le lot : UPDATE 1.'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
update public.users set cgu_version = '1999-01-01' where id = :P;
rollback;

\echo '--- I2. P récrit son e-mail (attendu : ERROR OP023)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
update public.users set email = 'autre@exemple-opus.test' where id = :P;
rollback;

\echo '--- I3. « Modifier mon profil » d un particulier (sept colonnes, comme l application) passe (attendu : UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
update public.users set nom = 'Paule P.', ville = 'Aix-en-Provence (13)', telephone = '06 39 98 00 02',
       avatar_url = null, code_postal = '13100', latitude = 43.53, longitude = 5.45
 where id = :P;
rollback;

\echo '--- I4. La seconde porte : P efface ses données puis recrée sa ligne avec une trace de CGU et un e-mail (attendu : t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
select public.preparer_suppression_compte() is not null as suppression_preparee;
insert into public.users (id, nom, email, cgu_version, cgu_acceptees_le, created_at)
  values (:P, 'Revenu', 'faux@exemple-opus.test', '2026-10-28', '2001-01-01', '2001-01-01');
reset role;
select email is null and cgu_version is null and cgu_acceptees_le is null
       and abs(extract(epoch from now() - created_at)) < 60 as ligne_recree_sans_trace
  from public.users where id = :P;
rollback;

\echo '--- I5. devenir_pro écarte une version inventée (la précédente reste) et garde une version plausible (attendu : t, puis t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
select public.devenir_pro('{"siret":"00000020800017","cgu_version":"2099-12-31","metiers":["macon"],"entreprise":"P Maçonnerie"}'::jsonb) is not null as appel;
reset role;
select (select type = 'pro' and cgu_version = '2026-10-28' from public.users where id = :P) as version_inventee_ecartee;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
select public.devenir_pro('{"siret":"00000020800017","cgu_version":"2026-10-29","metiers":["macon"],"entreprise":"P Maçonnerie"}'::jsonb) is not null as appel;
reset role;
select (select type = 'pro' and cgu_version = '2026-10-29' from public.users where id = :P) as version_plausible_gardee;
rollback;

\echo '--- I6. version_cgu_ou_null : forme, vraie date, ni avant 09/2026 ni plus tard que demain (attendu : t sur toute la ligne)'
select public.version_cgu_ou_null('2026-10-28') = '2026-10-28' as juste,
       public.version_cgu_ou_null(' 2026-10-28 ') = '2026-10-28' as blancs,
       public.version_cgu_ou_null('2026-02-31') is null as date_impossible,
       public.version_cgu_ou_null('2099-01-01') is null as futur,
       public.version_cgu_ou_null('2001-01-01') is null as trop_ancienne,
       public.version_cgu_ou_null('version-inventee') is null as pas_une_date,
       public.version_cgu_ou_null(null) is null as vide;

\echo ''
\echo '##### J. LA REMISE EN AVANT #####'

\echo '--- J1. A remet en avant sa publication d il y a 10 jours : la date de publication ne bouge pas, la remise est datée, l historique en garde une (attendu : t | t | 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
select public.remonter_publication(:PA2) is not null as remontee;
reset role;
select created_at < now() - interval '9 days' as date_de_publication_gardee,
       abs(extract(epoch from now() - remonte_le)) < 60 as remise_datee,
       (select count(*) from public.remontees where auteur_id = :A) as historique
  from public.posts where id = :PA2;
rollback;

\echo '--- J2. Elle passe EN TÊTE du fil, devant la publication de B d il y a 1 h (attendu : t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
select public.remonter_publication(:PA2) is not null as remontee;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
select (select id from public.fil_filtre() limit 1) = :PA2 as en_tete;
rollback;

\echo '--- J3. Une publication de moins de sept jours : OP022 « publication », le hint dit « publication + 7 jours », à la seconde supérieure (attendu : t | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
create temporary table refus (code text, detail text, hint text, message text) on commit drop;
do $$
begin
  perform public.remonter_publication('a51c0000-0000-4000-8000-0000000000a1');
exception when others then
  declare c text; d text; h text; m text;
  begin
    get stacked diagnostics c = returned_sqlstate, d = pg_exception_detail,
                            h = pg_exception_hint, m = message_text;
    insert into refus values (c, d, h, m);
  end;
end $$;
reset role;
select code = 'OP022' and detail = 'publication' as refus_publication,
       hint ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' as hint_iso_utc_a_la_seconde,
       abs(extract(epoch from hint::timestamptz
                            - ((select created_at from public.posts where id = :PA) + interval '7 days'))) < 1.0001
         and hint::timestamptz >= (select created_at from public.posts where id = :PA) + interval '7 days'
         as hint_arrondi_au_dessus
  from refus;
rollback;

\echo '--- J4. Deux fois la même : OP022 « publication », hint = remise + 7 jours (attendu : t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
select public.remonter_publication(:PA2) is not null as premiere;
create temporary table refus (code text, detail text, hint text) on commit drop;
do $$
begin
  perform public.remonter_publication('a51c0000-0000-4000-8000-0000000000a2');
exception when others then
  declare c text; d text; h text;
  begin
    get stacked diagnostics c = returned_sqlstate, d = pg_exception_detail, h = pg_exception_hint;
    insert into refus values (c, d, h);
  end;
end $$;
reset role;
select code = 'OP022' and detail = 'publication' as refus_publication,
       hint::timestamptz between (select remonte_le from public.posts where id = :PA2) + interval '7 days'
                             and (select remonte_le from public.posts where id = :PA2) + interval '7 days 1 second'
         as hint_remise_plus_sept_jours
  from refus;
rollback;

\echo '--- J5. La QUATRIÈME de la semaine : OP022 « artisan », hint = la plus ancienne des trois + 7 jours, à la seconde supérieure (attendu : 3 | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
select public.remonter_publication(:PA2) is not null,
       public.remonter_publication(:PA3) is not null,
       public.remonter_publication(:PA4) is not null;
create temporary table refus (code text, detail text, hint text) on commit drop;
do $$
begin
  perform public.remonter_publication('a51c0000-0000-4000-8000-0000000000a5');
exception when others then
  declare c text; d text; h text;
  begin
    get stacked diagnostics c = returned_sqlstate, d = pg_exception_detail, h = pg_exception_hint;
    insert into refus values (c, d, h);
  end;
end $$;
reset role;
select (select count(*) from public.remontees where auteur_id = :A) as historique,
       code = 'OP022' and detail = 'artisan' as refus_artisan,
       hint::timestamptz between (select min(remontee_le) from public.remontees where auteur_id = :A) + interval '7 days'
                             and (select min(remontee_le) from public.remontees where auteur_id = :A) + interval '7 days 1 second'
         as hint_premiere_plus_sept_jours
  from refus;
rollback;

\echo '--- J6. Supprimer une publication remise en avant NE REND PAS sa place (attendu : 3 | 2 | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
select public.remonter_publication(:PA2) is not null,
       public.remonter_publication(:PA3) is not null,
       public.remonter_publication(:PA4) is not null;
delete from public.posts where id = :PA4;
create temporary table refus (code text, detail text) on commit drop;
do $$
begin
  perform public.remonter_publication('a51c0000-0000-4000-8000-0000000000a5');
exception when others then
  declare c text; d text;
  begin
    get stacked diagnostics c = returned_sqlstate, d = pg_exception_detail;
    insert into refus values (c, d);
  end;
end $$;
reset role;
select (select count(*) from public.remontees where auteur_id = :A) as historique,
       (select count(*) from public.remontees where auteur_id = :A and post_id is not null) as encore_rattachees,
       (select detail = 'artisan' from refus) as la_place_reste_prise;
rollback;

\echo '--- J7. La publication d un autre, une publicité, un identifiant inconnu : OP022 « absente », LA MÊME phrase (attendu : 3 | 1 | 1)'
begin;
insert into public.posts (id, type, texte, is_ad, annonceur) values (:PUB, 'photo', 'Promo', true, 'Négoce essai');
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
create temporary table refus (code text, detail text, message text) on commit drop;
do $$
declare cible uuid;
begin
  foreach cible in array array['a51c0000-0000-4000-8000-0000000000b1',
                               'a51c0000-0000-4000-8000-0000000000ee',
                               'a51c0000-0000-4000-8000-0000000000ff']::uuid[] loop
    begin
      perform public.remonter_publication(cible);
    exception when others then
      declare c text; d text; m text;
      begin
        get stacked diagnostics c = returned_sqlstate, d = pg_exception_detail, m = message_text;
        insert into refus values (c, d, m);
      end;
    end;
  end loop;
end $$;
reset role;
select count(*) filter (where code = 'OP022' and detail = 'absente') as absentes,
       count(distinct message) as une_seule_phrase,
       count(distinct code) as un_seul_code
  from refus;
rollback;

\echo '--- J8. Un visiteur ne peut pas l appeler (attendu : ERROR permission denied for function remonter_publication)'
begin;
set local role anon;
select public.remonter_publication('a51c0000-0000-4000-8000-0000000000a2');
rollback;

\echo '--- J9. Un connecté SANS identité : refusé (attendu : ERROR Connectez-vous pour remettre une publication en avant.)'
begin;
set local role authenticated;
select public.remonter_publication('a51c0000-0000-4000-8000-0000000000a2');
rollback;

\echo '--- J10. Le client écrit remonte_le lui-même : remise à vide par tient_le_texte (attendu : t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
update public.posts set remonte_le = '2099-01-01', texte = 'Corrigée' where id = :PA2;
reset role;
select remonte_le is null and texte = 'Corrigée' as remise_refusee_texte_corrige from public.posts where id = :PA2;
rollback;

\echo '--- J11. L historique : A lit le sien, P rien ; personne ne l écrit ni ne le vide (attendu : 1 | 0, puis ERROR permission denied for table remontees)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
select public.remonter_publication(:PA2) is not null as remontee;
select count(*) as a_lit from public.remontees;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
select count(*) as p_lit from public.remontees;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
insert into public.remontees (post_id, auteur_id, remontee_le) values (:PA3, :A, '2001-01-01');
rollback;

\echo '--- J12. Ni vider ni supprimer l historique (attendu : ERROR permission denied for table remontees)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
truncate public.remontees;
rollback;

\echo '--- J13. L export RGPD de A porte ses remises en avant (attendu : 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-00000000000a';
select public.remonter_publication(:PA2) is not null as remontee;
select jsonb_array_length(public.mes_donnees() -> 'mes_remontees') as dans_l_export;
rollback;

\echo ''
\echo '##### K. LE FIL #####'

\echo '--- K1. Les publicités : dans le fil sans filtre et dans « Abonnements » ; jamais sous le métier, la distance, la note, le badge, les vidéos (attendu : t | t | 0 | 0 | 0 | 0 | 0). Avant le lot : métier 1, distance 1.'
begin;
insert into public.posts (id, type, texte, is_ad, annonceur, metier, latitude, longitude)
  values (:PUB, 'video', 'Promo', true, 'Négoce essai', 'plombier', 43.30, 5.37);
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
select exists (select 1 from public.fil_filtre(p_limite => 50) where id = :PUB) as sans_filtre,
       exists (select 1 from public.fil_filtre(p_abonnements => true, p_limite => 50) where id = :PUB) as abonnements,
       (select count(*) from public.fil_filtre(p_metier => 'plombier', p_limite => 50) where id = :PUB) as metier,
       (select count(*) from public.fil_filtre(p_lat => 43.30, p_lon => 5.37, p_rayon_km => 20, p_limite => 50) where id = :PUB) as distance,
       (select count(*) from public.fil_filtre(p_note_min => 1, p_limite => 50) where id = :PUB) as note,
       (select count(*) from public.fil_filtre(p_verifies => true, p_limite => 50) where id = :PUB) as badge,
       (select count(*) from public.fil_filtre(p_videos => true, p_limite => 50) where id = :PUB) as videos;
rollback;

\echo '--- K2. LA PAGINATION traverse une publication remise en avant posée EXACTEMENT au bout de la première page : 45 publications de B, 3 remises en avant, pages de 20. Le curseur de l application (la clé de tri) ne perd rien et ne double rien ; le TÉMOIN — le curseur d avant, la date de publication — en perd (attendu : 51 | 51 | 0 | t | t)'
begin;
insert into public.posts (author_id, type, texte, created_at)
  select :B, 'texte', 'Publication ' || g, now() - (g || ' hours')::interval
    from generate_series(1, 45) g;
-- Trois remises en avant, posées par l'éditeur SQL. La « Publication 44 »,
-- remise en avant il y a 16 h 30, tombe au VINGTIÈME rang : c'est elle
-- qui ferme la première page.
update public.posts set remonte_le = now() - interval '30 minutes'          where author_id = :B and texte = 'Publication 40';
update public.posts set remonte_le = now() - interval '16 hours 30 minutes' where author_id = :B and texte = 'Publication 44';
update public.posts set remonte_le = now() - interval '25 hours 30 minutes' where author_id = :B and texte = 'Publication 45';
set local role authenticated;
set local request.jwt.claim.sub = 'a51c0000-0000-4000-8000-000000000001';
create temporary table vues (id uuid, page int, curseur text) on commit drop;
do $$
declare
  methode text;
  curseur timestamptz;
  page int;
  r record;
  derniere record;
  n int;
begin
  foreach methode in array array['cle', 'temoin'] loop
    curseur := null;
    page := 0;
    loop
      page := page + 1;
      n := 0;
      for r in select * from public.fil_filtre(p_avant => curseur, p_limite => 20) loop
        insert into vues values (r.id, page, methode);
        derniere := r;
        n := n + 1;
      end loop;
      exit when n < 20 or page > 10;
      if methode = 'cle' then
        curseur := coalesce(derniere.remonte_le, derniere.created_at);
      else
        curseur := derniere.created_at;
      end if;
    end loop;
  end loop;
end $$;
reset role;
select (select count(*) from public.posts) as dans_la_base,
       (select count(distinct id) from vues where curseur = 'cle') as vues_distinctes,
       (select count(*) - count(distinct id) from vues where curseur = 'cle') as doublons,
       (select p.texte = 'Publication 44'
          from (select id, row_number() over () as rang from vues where curseur = 'cle' and page = 1) v
          join public.posts p on p.id = v.id where v.rang = 20) as la_vingtieme_est_remontee,
       (select count(distinct id) from vues where curseur = 'temoin') < (select count(*) from public.posts)
         as le_temoin_perd_des_publications;
rollback;

\echo ''
\echo '##### L. LE CATALOGUE #####'

\echo '--- L1. Les quinze déclencheurs de date, un par table, et leurs verbes (attendu : 15 lignes ; INSERT seul sur les dix, INSERT OR UPDATE sur les cinq)'
select c.relname as table_, t.tgname as declencheur,
       case when t.tgtype & 16 > 0 then 'insert or update' else 'insert' end as verbes
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_proc f on f.oid = t.tgfoid
 where f.proname = 'pose_la_date' and not t.tgisinternal
 order by 3, 1;

\echo '--- L2. Chaque déclencheur de date porte le nom de SA table (attendu : 0)'
select count(*) as mal_nommes
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_proc f on f.oid = t.tgfoid
 where f.proname = 'pose_la_date' and not t.tgisinternal
   and t.tgname <> 'trg_pose_la_date_' || c.relname;

\echo '--- L3. Les gardes nouvelles sont security invoker et regardent current_user (R-A) (attendu : 7 lignes, toutes t | t)'
select p.proname, not p.prosecdef as invoker, p.prosrc ~ 'current_user in \(''authenticated'', ''anon''\)' as regle_ra
  from pg_proc p
 where p.pronamespace = 'public'::regnamespace
   and p.proname in ('pose_la_date', 'tient_la_reputation', 'tient_la_publication_neuve',
                     'tient_le_commentaire_neuf', 'tient_les_compteurs_du_chantier',
                     'tient_l_avis_neuf', 'tient_le_compte')
 order by 1;

\echo '--- L4. remonter_publication : definer, VOLATILE, exécutable par authenticated seul (attendu : t | v | f | f | t)'
select p.prosecdef as definer, p.provolatile as volatilite,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('public', p.oid, 'execute') as public_,
       has_function_privilege('authenticated', p.oid, 'execute') as connecte
  from pg_proc p where p.oid = 'public.remonter_publication(uuid)'::regprocedure;

\echo '--- L5. Les droits : avis sans UPDATE, historique sans écriture, files sans droit de table à l INSERT (attendu : f | f | f | f | f | f | t)'
select has_table_privilege('authenticated', 'public.reviews', 'update') as avis_update,
       has_table_privilege('authenticated', 'public.remontees', 'insert')
         or has_table_privilege('authenticated', 'public.remontees', 'update')
         or has_table_privilege('authenticated', 'public.remontees', 'delete') as historique_ecrit,
       has_table_privilege('authenticated', 'public.remontees', 'truncate') as historique_vide,
       has_table_privilege('anon', 'public.remontees', 'select') as historique_visiteur,
       has_table_privilege('authenticated', 'public.signalements', 'insert')
         or has_table_privilege('authenticated', 'public.metier_demandes', 'insert')
         or has_table_privilege('authenticated', 'public.specialites_proposees', 'insert') as files_par_table,
       has_column_privilege('authenticated', 'public.signalements', 'traite_par', 'insert') as traite_par,
       has_column_privilege('authenticated', 'public.signalements', 'motif', 'insert') as motif;

\echo '--- L6. Le curseur de fil_filtre est écrit SANS coalesce, l ordre AVEC (attendu : t | t)'
select pg_get_functiondef('public.fil_filtre(text, double precision, double precision, int, numeric, boolean, boolean, boolean, timestamptz, int)'::regprocedure)
         ~ 'p\.remonte_le < p_avant' as curseur_sans_coalesce,
       pg_get_functiondef('public.fil_filtre(text, double precision, double precision, int, numeric, boolean, boolean, boolean, timestamptz, int)'::regprocedure)
         ~ 'order by coalesce\(p\.remonte_le, p\.created_at\) desc, p\.id desc' as ordre;

\echo '--- L7. Une seule fil_filtre (aucune surcharge) (attendu : 1)'
select count(*) as fil_filtre from pg_proc where proname = 'fil_filtre' and pronamespace = 'public'::regnamespace;

-- Ménage.
\set QUIET on
delete from public.administrateurs where user_id = :ADMIN;
delete from public.posts where id = :PUB;
delete from auth.users where id::text like 'a51c0000-0000-4000-8000-%';
delete from public.preuves_siret where siret in ('00000024000010', '00000025700014', '00000020800017');
\set QUIET off
\echo 'FIN des essais du lot S-c'
