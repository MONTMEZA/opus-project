-- ==========================================================================
--  ESSAIS DU LOT S-b — les demandes reçues, le blocage, les partenariats,
--  les réponses (26/10/2026)
--
--  À rejouer sur un PostgreSQL NEUF, après local-prelude.sql et schema.sql
--  (deux fois) :
--
--    psql -d opus -v ON_ERROR_STOP=0 -f supabase/essais-section-51b.sql
--
--  Méthode : celle de tous les essais du projet. Chaque cas est dans son
--  propre `begin … rollback` ; le rôle et l'identité se posent par
--  `set local`, chacun dans son propre ordre, JAMAIS dans un bloc `do` (une
--  politique RLS n'y est pas appliquée). Une écriture refusée par une
--  politique répond « 0 ligne » sans erreur (`UPDATE 0`, `DELETE 0`), ou
--  « new row violates row-level security policy » : il faut LIRE chaque
--  réponse et la comparer à l'attendu annoncé au-dessus. Un ordre qui doit
--  échouer est le DERNIER de sa transaction.
--
--  « avant le lot » : mesuré en jouant ce fichier sur le schéma du commit
--  ae081f8 (juste avant S-b).
--
--  ORDRE : A. la donnée existe ; B. les demandes reçues ; C. l'urgence ;
--  D. le lien d'un devis ; E. les notifications ; F. ce qu'on écrit sous
--  blocage ; G. les réponses ; H. les partenariats ; I. le catalogue.
--
--  Les SIRET sont fictifs, à clé de contrôle juste (ceux de
--  essais-section-45.sql), les comptes sont préfixés a51b0000.
--
--    A  plombier, qui répond aux urgences, tarifs affichés ;
--    B  électricien ; C  maçon, un TIERS ;
--    P  particulier ; Q  autre particulier ; ADMIN  l'administration.
-- ==========================================================================

\set QUIET on
\pset pager off

\set ADMIN '''a51b0000-0000-4000-8000-0000000000ad'''
\set A     '''a51b0000-0000-4000-8000-00000000000a'''
\set B     '''a51b0000-0000-4000-8000-00000000000b'''
\set C     '''a51b0000-0000-4000-8000-00000000000c'''
\set P     '''a51b0000-0000-4000-8000-000000000001'''
\set Q     '''a51b0000-0000-4000-8000-000000000002'''
\set PA    '''a51b0000-0000-4000-8000-0000000000a1'''
\set PB    '''a51b0000-0000-4000-8000-0000000000b1'''
\set AN_B  '''a51b0000-0000-4000-8000-0000000000b2'''
\set AN_C  '''a51b0000-0000-4000-8000-0000000000c2'''
\set DEM_P '''a51b0000-0000-4000-8000-0000000000d1'''
\set DEM_Q '''a51b0000-0000-4000-8000-0000000000d2'''

-- Ménage d'un passage précédent : le fichier se rejoue.
delete from public.administrateurs where user_id = :ADMIN;
delete from auth.users where id::text like 'a51b0000-0000-4000-8000-%';
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
  (:ADMIN, 'admin51b@exemple-opus.test', '{"type":"particulier","nom":"Admin Opus"}'::jsonb),
  (:A, 'a51b@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan A', 'entreprise', 'Plomberie A',
                      'metiers', jsonb_build_array('plombier'), 'ville', 'Marseille (13)',
                      'latitude', '43.2965', 'longitude', '5.3698', 'siret', '00000024000010')),
  (:B, 'b51b@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan B', 'entreprise', 'Électricité B',
                      'metiers', jsonb_build_array('electricien'), 'ville', 'Marseille (13)',
                      'siret', '00000025700014')),
  (:C, 'c51b@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan C', 'entreprise', 'Maçonnerie C',
                      'metiers', jsonb_build_array('macon'), 'ville', 'Marseille (13)',
                      'siret', '00000020800017')),
  (:P, 'p51b@exemple-opus.test',
   '{"type":"particulier","nom":"Paule P.","ville":"Marseille (13)"}'::jsonb),
  (:Q, 'q51b@exemple-opus.test',
   '{"type":"particulier","nom":"Quentin Q.","ville":"Marseille (13)"}'::jsonb);
insert into public.administrateurs (user_id, note) values (:ADMIN, 'essais lot S-b');

-- A répond aux urgences de plomberie, tarifs affichés et complets.
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes, taux_horaire_centimes,
                               majoration_pct, affiche)
values (:A, 4500, 6200, 40, true);
insert into public.sos_availability (professional_id, metier_key, actif, rayon_km, delai_minutes)
values (:A, 'plomberie', true, 20, 45);

-- Une publication de A, une de B ; une annonce de B, une de C ; une
-- demande de P, une de Q.
insert into public.posts (id, author_id, type, texte) values
  (:PA, :A, 'texte', 'Publication de A'),
  (:PB, :B, 'texte', 'Publication de B');
insert into public.annonces_pro (id, auteur_id, type, titre, texte) values
  (:AN_B, :B, 'entraide', 'Annonce de B', 'Un coup de main'),
  (:AN_C, :C, 'entraide', 'Annonce de C', 'Un coup de main');
insert into public.demandes (id, client_id, metier, ville, texte) values
  (:DEM_P, :P, 'plombier', 'Marseille (13)', 'Fuite sous l évier'),
  (:DEM_Q, :Q, 'plombier', 'Marseille (13)', 'Robinet qui goutte');

-- Ce que les cas rejouent : une demande de devis, de rappel, en attente.
prepare devis_de(uuid, uuid) as
  insert into public.quote_requests (id, client_id, professional_id, metier, description, nom, telephone)
  values (gen_random_uuid(), $1, $2, 'plombier', 'Fuite', 'Client', '06 39 98 00 01')
  returning id;

\set QUIET off

\echo ''
\echo '##### A. LA DONNÉE EXISTE #####'

\echo '--- A1. A est pro, plombier, ses tarifs sont affichés, sa ligne d urgence active (attendu : t | {plombier} | t | t)'
select (select type = 'pro' from public.users where id = :A) as pro,
       (select metiers from public.professional_profiles where id = :A) as metiers,
       (select affiche from public.tarifs_pro where pro_id = :A) as affiche,
       (select actif from public.sos_availability where professional_id = :A) as urgences;

\echo '--- A2. P LIT les tarifs de A et le trouve dans la recherche d urgence (attendu : 1 | 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
select (select count(*) from public.tarifs_pro) as tarifs_lus,
       (select count(*) from public.artisans_urgence('plomberie', 43.30, 5.37)) as dans_la_recherche;
rollback;

\echo ''
\echo '##### B. LES DEMANDES REÇUES — section 24.4 et 13.5 #####'

\echo '--- B1. P dépose une demande de devis DÉJÀ « accepte » (attendu : ERROR … row-level security — avant le lot : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.quote_requests (client_id, professional_id, metier, statut)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plombier', 'accepte');
rollback;

\echo '--- B1 bis. … un rappel « accepte » (attendu : ERROR … row-level security — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.callback_requests (client_id, professional_id, statut)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'accepte');
rollback;

\echo '--- B1 ter. … une urgence « acceptee » (attendu : ERROR … row-level security — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key, statut)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plomberie', 'fuite', 'acceptee');
rollback;

\echo '--- B2. P dépose une demande de devis et une demande de rappel, sans statut (attendu : INSERT 0 1, INSERT 0 1, puis A a 2 notifications : « Paule P. vous demande un devis » et « Paule P. attend votre appel »)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.quote_requests (client_id, professional_id, metier, description)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plombier', 'Fuite');
insert into public.callback_requests (client_id, professional_id, nom, telephone)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'Paule P.', '06 39 98 00 01');
reset role;
select type, texte from public.notifications where user_id = :A order by type;
rollback;

\echo '--- B3. A modifie la DESCRIPTION de la demande reçue (attendu : ERROR OP019 « Une demande reçue ne se modifie pas : seuls Accepter, Refuser et Marquer terminé changent son état. » — avant : UPDATE 1)'
begin;
execute devis_de(:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set description = 'Récrite par l artisan' where client_id = :P;
rollback;

\echo '--- B3 bis. A récrit le NOM et le numéro du client en même temps qu il accepte (attendu : ERROR OP019 — avant : UPDATE 1)'
begin;
execute devis_de(:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'accepte', telephone = '06 00 00 00 00' where client_id = :P;
rollback;

\echo '--- B4. A ACCEPTE, puis renvoie « accepte » (un double appui), puis la MARQUE TERMINÉE (attendu : UPDATE 1, UPDATE 1, UPDATE 1, puis P a 1 notification « devis_accepte »)'
begin;
execute devis_de(:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'accepte' where client_id = :P;
update public.quote_requests set statut = 'accepte' where client_id = :P;
update public.quote_requests set statut = 'termine' where client_id = :P;
reset role;
select type, count(*) from public.notifications where user_id = :P group by type;
rollback;

\echo '--- B5. une demande ACCEPTÉE ne se refuse plus (attendu : ERROR OP019 « Cette demande a déjà été acceptée : vous pouvez la marquer terminée. » — avant : UPDATE 1)'
begin;
execute devis_de(:P, :A);
update public.quote_requests set statut = 'accepte' where client_id = :P;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'refuse' where client_id = :P;
rollback;

\echo '--- B6. une demande EN ATTENTE ne se termine pas (attendu : ERROR OP019 « Cette demande n a pas encore été acceptée : acceptez-la ou refusez-la d abord. » — avant : UPDATE 1)'
begin;
execute devis_de(:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'termine' where client_id = :P;
rollback;

\echo '--- B7. une demande REFUSÉE ne revient pas (attendu : ERROR OP019 « Cette demande a déjà été refusée : elle ne peut plus changer. » — avant : UPDATE 1)'
begin;
execute devis_de(:P, :A);
update public.quote_requests set statut = 'refuse' where client_id = :P;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'accepte' where client_id = :P;
rollback;

\echo '--- B8. une demande TERMINÉE ne revient pas (attendu : ERROR OP019 « Cette demande est déjà terminée : elle ne peut plus changer. » — avant : UPDATE 1)'
begin;
execute devis_de(:P, :A);
update public.quote_requests set statut = 'accepte' where client_id = :P;
update public.quote_requests set statut = 'termine' where client_id = :P;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'en_attente' where client_id = :P;
rollback;

\echo '--- B9. les mots de l urgence : A accepte, puis termine une urgence (attendu : INSERT 0 1 par P, UPDATE 1, UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plomberie', 'fuite');
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.sos_requests set statut = 'acceptee' where client_id = :P;
update public.sos_requests set statut = 'termine' where client_id = :P;
rollback;

\echo '--- B10. R-A : l éditeur SQL (ici `postgres`) corrige une demande — une migration doit pouvoir réparer (attendu : UPDATE 1)'
begin;
execute devis_de(:P, :A);
update public.quote_requests set description = 'Corrigée par une migration' where client_id = :P;
rollback;

\echo '--- B11. le CLIENT ne change pas le statut de sa demande (attendu : UPDATE 0 — aucune politique, avant comme après)'
begin;
execute devis_de(:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
update public.quote_requests set statut = 'accepte' where client_id = :P;
rollback;

\echo '--- B12. A se demande un devis À LUI-MÊME (attendu : ERROR … quote_requests_pas_soi_meme_check — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.quote_requests (client_id, professional_id, metier)
values ('a51b0000-0000-4000-8000-00000000000a', 'a51b0000-0000-4000-8000-00000000000a', 'plombier');
rollback;

\echo '--- B12 bis. … un rappel à lui-même (attendu : ERROR … callback_requests_pas_soi_meme_check — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.callback_requests (client_id, professional_id)
values ('a51b0000-0000-4000-8000-00000000000a', 'a51b0000-0000-4000-8000-00000000000a');
rollback;

\echo '--- B12 ter. … une conversation avec lui-même (attendu : ERROR … conversations_pas_soi_meme_check — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.conversations (client_id, professional_id)
values ('a51b0000-0000-4000-8000-00000000000a', 'a51b0000-0000-4000-8000-00000000000a');
rollback;

\echo '--- B12 quater. les trois contraintes posées sur des tables qui ont DÉJÀ une ligne « soi-même » sur la vraie base sont `not valid` ; celle des urgences, table vide, est valide (attendu : f | f | f | t)'
select conname, convalidated from pg_constraint
 where conname in ('quote_requests_pas_soi_meme_check', 'callback_requests_pas_soi_meme_check',
                   'conversations_pas_soi_meme_check', 'sos_requests_pas_soi_meme_check')
 order by conname;

\echo '--- B13. P a bloqué A : A ne peut plus ACCEPTER la demande (attendu : ERROR OP020 « Vous ne pouvez plus accepter cette demande. Vous pouvez encore la refuser. » — avant : UPDATE 1)'
begin;
execute devis_de(:P, :A);
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'accepte' where client_id = :P;
rollback;

\echo '--- B14. … mais il peut la REFUSER, et P — qui a bloqué A — ne reçoit pas la notification de A (attendu : UPDATE 1, puis 0 notification « demande_refusee » chez P — avant : 1)'
begin;
execute devis_de(:P, :A);
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'refuse' where client_id = :P;
reset role;
select count(*) as refus_notifie_a_p from public.notifications where user_id = :P and type = 'demande_refusee';
rollback;

\echo '--- B15. dans l AUTRE sens — décision Q1 : A a bloqué Q, il ne peut plus accepter, mais son REFUS arrive bien chez Q, qui n a bloqué personne (attendu : ERROR OP020 au premier essai ; dans un second temps UPDATE 1 et 1 notification « demande_refusee »)'
begin;
execute devis_de(:Q, :A);
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :Q);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'accepte' where client_id = :Q;
rollback;
begin;
execute devis_de(:Q, :A);
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :Q);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'refuse' where client_id = :Q;
reset role;
select count(*) as refus_notifie_a_q from public.notifications where user_id = :Q and type = 'demande_refusee';
rollback;

\echo ''
\echo '##### C. L URGENCE NE PART QUE VERS QUI Y RÉPOND — section 24.4, OP025 #####'

\echo '--- C1. P envoie une urgence à B, électricien SANS ligne d urgence ni tarifs (attendu : ERROR OP025 « Cet artisan ne répond plus aux urgences de ce métier… » — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000b', 'electricite', 'panne');
rollback;

\echo '--- C2. P envoie à A une urgence de SERRURERIE — A ne répond qu aux urgences de plomberie (attendu : ERROR OP025 — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'serrurerie', 'porte');
rollback;

\echo '--- C3. P envoie à A une urgence d un métier INVENTÉ (attendu : ERROR OP025 — le déclencheur joue avant la contrainte ; avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'peinture', 'mur');
rollback;

\echo '--- C3 bis. … et la contrainte garde la porte de la base elle-même (`postgres`, sans le déclencheur) (attendu : ERROR … sos_metier_key_check)'
begin;
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values (:P, :A, 'peinture', 'mur');
rollback;

\echo '--- C4. A n AFFICHE plus ses tarifs : plus d urgence vers lui (attendu : ERROR OP025 — avant : INSERT 0 1)'
begin;
update public.tarifs_pro set affiche = false where pro_id = :A;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plomberie', 'fuite');
rollback;

\echo '--- C5. un compte PRO (B) n envoie pas d urgence — il ne lit aucun tarif (attendu : ERROR OP025 — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-00000000000a', 'plomberie', 'fuite');
rollback;

\echo '--- C6. le cas qui doit PASSER : P, plomberie, vers A (attendu : INSERT 0 1, puis A a 1 notification « a besoin de vous EN URGENCE »)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plomberie', 'fuite');
reset role;
select texte from public.notifications where user_id = :A and type = 'sos';
rollback;

\echo ''
\echo '##### D. LE LIEN D UN DEVIS — section 49.6 bis, OP020 #####'

\echo '--- D1. sans blocage : A fait un devis pour la demande de P, et `peut_faire_un_devis` dit oui (attendu : t, puis INSERT 0 1)'
begin;
execute devis_de(:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
select public.peut_faire_un_devis((select id from public.quote_requests where client_id = 'a51b0000-0000-4000-8000-000000000001'), null) as peut;
insert into public.devis (pro_id, quote_request_id, source, generation)
select 'a51b0000-0000-4000-8000-00000000000a', id, 'demande', 1 from public.quote_requests
 where client_id = 'a51b0000-0000-4000-8000-000000000001';
rollback;

\echo '--- D2. P a bloqué A — un blocage que A ne VOIT pas : `peut_faire_un_devis` dit non, et un NOUVEAU devis est refusé (attendu : f, puis ERROR OP020 « Vous ne pouvez plus rattacher un nouveau devis à cette demande… » — avant : INSERT 0 1)'
begin;
execute devis_de(:P, :A);
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
select public.peut_faire_un_devis((select id from public.quote_requests where client_id = 'a51b0000-0000-4000-8000-000000000001'), null) as peut;
insert into public.devis (pro_id, quote_request_id, source, generation)
select 'a51b0000-0000-4000-8000-00000000000a', id, 'demande', 1 from public.quote_requests
 where client_id = 'a51b0000-0000-4000-8000-000000000001';
rollback;

\echo '--- D3. … un devis COMMENCÉ AVANT le blocage reste modifiable — rien ne disparaît (attendu : UPDATE 1, et son lien est toujours posé : t)'
begin;
execute devis_de(:P, :A);
insert into public.devis (id, pro_id, quote_request_id, source, generation)
select 'a51b0000-0000-4000-8000-0000000000e1', :A, id, 'demande', 1 from public.quote_requests where client_id = :P;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.devis set objet = 'Remplacement du siphon', generation = 2
 where id = 'a51b0000-0000-4000-8000-0000000000e1';
reset role;
select quote_request_id is not null as lien_garde from public.devis where id = 'a51b0000-0000-4000-8000-0000000000e1';
rollback;

\echo '--- D4. A a bloqué Q (l autre sens) : pas de nouveau devis sur sa demande (attendu : ERROR OP020 — avant : INSERT 0 1)'
begin;
execute devis_de(:Q, :A);
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :Q);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.devis (pro_id, quote_request_id, source, generation)
select 'a51b0000-0000-4000-8000-00000000000a', id, 'demande', 1 from public.quote_requests
 where client_id = 'a51b0000-0000-4000-8000-000000000002';
rollback;

\echo '--- D5. « pas à vous » est décidé AVANT le blocage : B tente de rattacher son devis à la demande de P adressée à A, P ayant bloqué A (attendu : ERROR OP013 — jamais OP020 : B n apprend rien du blocage)'
begin;
execute devis_de(:P, :A);
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
create temp table dem_p on commit drop as select id from public.quote_requests where client_id = :P;
grant select on dem_p to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.devis (pro_id, quote_request_id, source, generation)
select 'a51b0000-0000-4000-8000-00000000000b', id, 'demande', 1 from dem_p;
rollback;

\echo '--- D6. `peut_faire_un_devis` ne dit rien d une demande qui n est pas à l appelant, ni d un appel mal formé (attendu : f | f | f)'
begin;
execute devis_de(:P, :A);
create temp table dem_p2 on commit drop as select id from public.quote_requests where client_id = :P;
grant select on dem_p2 to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
select public.peut_faire_un_devis((select id from dem_p2), null) as pas_a_moi,
       public.peut_faire_un_devis(gen_random_uuid(), null) as inexistante,
       public.peut_faire_un_devis((select id from dem_p2), gen_random_uuid()) as deux_cles;
rollback;

\echo '--- D7. un visiteur ne l appelle pas (attendu : ERROR permission denied for function peut_faire_un_devis)'
begin;
set local role anon;
select public.peut_faire_un_devis(gen_random_uuid(), null);
rollback;

\echo '--- D8. la cascade passe : la demande disparaît, le lien du devis passe à vide malgré le blocage (attendu : DELETE 1, puis lien vide : t)'
begin;
execute devis_de(:P, :A);
insert into public.devis (id, pro_id, quote_request_id, source, generation)
select 'a51b0000-0000-4000-8000-0000000000e2', :A, id, 'demande', 1 from public.quote_requests where client_id = :P;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
delete from public.quote_requests where client_id = :P;
select quote_request_id is null as lien_vide from public.devis where id = 'a51b0000-0000-4000-8000-0000000000e2';
rollback;

\echo ''
\echo '##### E. LES NOTIFICATIONS — section 13.5 quater, décision Q1 #####'

\echo '--- E1. ce qui se tait, et ce qui passe — B a bloqué A (attendu : commentaire 0 | sans_acteur 1 | admin 1 | autre_sens 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:B, :A);
-- A → B (B a bloqué A) : tu.
insert into public.notifications (user_id, type, texte, acteur_id) values (:B, 'commentaire', 'A a commenté', :A);
-- Sans acteur : une décision de l'administration.
insert into public.notifications (user_id, type, texte) values (:B, 'verification_acceptee', 'Badge accordé');
-- Adressée à l'administration : jamais tue.
insert into public.blocages (bloqueur_id, bloque_id) values (:ADMIN, :A);
insert into public.notifications (user_id, type, texte, acteur_id) values (:ADMIN, 'demande_pro_nouvelle', 'Un compte attend', :A);
-- B → A : A n'a bloqué personne, il la reçoit.
insert into public.notifications (user_id, type, texte, acteur_id) values (:A, 'commentaire', 'B a commenté', :B);
select (select count(*) from public.notifications where user_id = :B and type = 'commentaire') as commentaire,
       (select count(*) from public.notifications where user_id = :B and type = 'verification_acceptee') as sans_acteur,
       (select count(*) from public.notifications where user_id = :ADMIN) as admin,
       (select count(*) from public.notifications where user_id = :A) as autre_sens;
rollback;

\echo '--- E2. la liste des types qu un blocage fait taire, un par un (attendu : 12 types, tous à 0 ; demande_pro_nouvelle à 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:B, :A);
insert into public.notifications (user_id, type, texte, acteur_id)
select :B, t, 'essai', :A
  from unnest(array['commentaire', 'reponse', 'partenaire_demande', 'partenaire_accepte',
                    'devis', 'rappel', 'sos', 'devis_accepte', 'rappel_accepte', 'sos_accepte',
                    'demande_refusee', 'annonce', 'demande_pro_nouvelle']) t;
select t as type, (select count(*) from public.notifications n where n.user_id = :B and n.type = t) as gardees
  from unnest(array['commentaire', 'reponse', 'partenaire_demande', 'partenaire_accepte',
                    'devis', 'rappel', 'sos', 'devis_accepte', 'rappel_accepte', 'sos_accepte',
                    'demande_refusee', 'annonce', 'demande_pro_nouvelle']) t;
rollback;

\echo ''
\echo '##### F. CE QU ON ÉCRIT SOUS BLOCAGE — section 13.5 bis, règle R-B #####'
\echo '(P a bloqué B dans chaque cas ; chaque cas commence par prouver que la MÊME écriture vers A passe)'

\echo '--- F1. P aime la publication de A, puis celle de B (attendu : INSERT 0 1, puis ERROR … row-level security — avant : INSERT 0 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.post_likes (post_id, user_id) values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-000000000001');
insert into public.post_likes (post_id, user_id) values ('a51b0000-0000-4000-8000-0000000000b1', 'a51b0000-0000-4000-8000-000000000001');
rollback;

\echo '--- F2. P commente la publication de A, puis celle de B (attendu : INSERT 0 1, puis ERROR … row-level security — avant : INSERT 0 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.comments (post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-000000000001', 'Joli');
insert into public.comments (post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000b1', 'a51b0000-0000-4000-8000-000000000001', 'Joli');
rollback;

\echo '--- F2 bis. B a commenté sous la publication de A (un TIERS) ; P, qui a bloqué B, lui répond (attendu : ERROR « Le commentaire parent n existe pas » — la lecture lui cache le commentaire de B)'
begin;
insert into public.comments (id, post_id, author_id, texte)
values ('a51b0000-0000-4000-8000-0000000000c1', :PA, :B, 'Commentaire de B');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.comments (post_id, author_id, texte, parent_id)
values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-000000000001', 'Réponse', 'a51b0000-0000-4000-8000-0000000000c1');
rollback;

\echo '--- F2 ter. LE FIL INDIRECT (relecture du 26/10) : P a bloqué B. B a un commentaire d origine sous la publication de A, Q y a répondu ; P répond à la réponse de Q (attendu : ERROR « Le commentaire parent n existe pas » — avant la correction : INSERT 0 1, rangée sous le commentaire de B)'
begin;
insert into public.comments (id, post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000e1', :PA, :B, 'Commentaire de B');
insert into public.comments (id, post_id, author_id, texte, parent_id) values ('a51b0000-0000-4000-8000-0000000000e2', :PA, :Q, 'Réponse de Q', 'a51b0000-0000-4000-8000-0000000000e1');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.comments (post_id, author_id, texte, parent_id)
values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-000000000001', 'Réponse de P', 'a51b0000-0000-4000-8000-0000000000e2');
rollback;

\echo '--- F2 ter b. … l autre sens : P a un commentaire d origine, Q y a répondu ; B, que P a bloqué, répond à la réponse de Q (attendu : ERROR « Le commentaire parent n existe pas »)'
begin;
insert into public.comments (id, post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000e1', :PA, :P, 'Commentaire de P');
insert into public.comments (id, post_id, author_id, texte, parent_id) values ('a51b0000-0000-4000-8000-0000000000e2', :PA, :Q, 'Réponse de Q', 'a51b0000-0000-4000-8000-0000000000e1');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.comments (post_id, author_id, texte, parent_id)
values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-00000000000b', 'Réponse de B', 'a51b0000-0000-4000-8000-0000000000e2');
rollback;

\echo '--- F2 ter c. TÉMOIN, sans blocage : B répond à la réponse de Q, et sa réponse est rangée sous le commentaire d origine (attendu : INSERT 0 1, puis t)'
begin;
insert into public.comments (id, post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000e1', :PA, :P, 'Commentaire de P');
insert into public.comments (id, post_id, author_id, texte, parent_id) values ('a51b0000-0000-4000-8000-0000000000e2', :PA, :Q, 'Réponse de Q', 'a51b0000-0000-4000-8000-0000000000e1');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.comments (post_id, author_id, texte, parent_id)
values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-00000000000b', 'Réponse de B', 'a51b0000-0000-4000-8000-0000000000e2');
select parent_id = 'a51b0000-0000-4000-8000-0000000000e1' as sous_le_commentaire_d_origine from public.comments where author_id = 'a51b0000-0000-4000-8000-00000000000b';
rollback;

\echo '--- F2 ter d. UNE RÉPONSE VIT SOUS LA PUBLICATION DE SON PARENT (seconde relecture du 27/10) : P a bloqué B ; Q a commenté la publication de B ; P lit ce commentaire (pas la publication), et y répond en déclarant la publication de A (attendu : 0 | 1, puis ERROR « Le commentaire parent n existe pas » — avant la correction : INSERT 0 1, accroché au fil de la publication de B)'
begin;
insert into public.comments (id, post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000e3', :PB, :Q, 'Commentaire de Q sous la publication de B');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
select (select count(*) from public.posts where id = 'a51b0000-0000-4000-8000-0000000000b1') as p_lit_la_publication_de_b,
       (select count(*) from public.comments where id = 'a51b0000-0000-4000-8000-0000000000e3') as p_lit_le_commentaire_de_q;
insert into public.comments (post_id, author_id, texte, parent_id)
values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-000000000001', 'Réponse de P', 'a51b0000-0000-4000-8000-0000000000e3');
rollback;

\echo '--- F2 ter e. … et c est une règle d intégrité, pas de blocage : sans aucun blocage, A répond au même commentaire en déclarant SA publication, puis en déclarant la bonne (attendu : ERROR « Le commentaire parent n existe pas », puis INSERT 0 1)'
begin;
insert into public.comments (id, post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000e3', :PB, :Q, 'Commentaire de Q sous la publication de B');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.comments (post_id, author_id, texte, parent_id)
values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-00000000000a', 'Réponse de A, mauvaise publication', 'a51b0000-0000-4000-8000-0000000000e3');
rollback;
begin;
insert into public.comments (id, post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000e3', :PB, :Q, 'Commentaire de Q sous la publication de B');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.comments (post_id, author_id, texte, parent_id)
values ('a51b0000-0000-4000-8000-0000000000b1', 'a51b0000-0000-4000-8000-00000000000a', 'Réponse de A, bonne publication', 'a51b0000-0000-4000-8000-0000000000e3');
rollback;

\echo '--- F2 ter f. une réponse INCOHÉRENTE écrite avant cette règle ne bloque pas le droit à l effacement : P, son auteur, supprime son compte (attendu : t, puis anonymisee t | compte_parti t)'
begin;
insert into public.comments (id, post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000e3', :PB, :Q, 'Commentaire de Q sous la publication de B');
alter table public.comments disable trigger trg_limite_profondeur_commentaire;
insert into public.comments (id, post_id, author_id, texte, parent_id) values ('a51b0000-0000-4000-8000-0000000000e4', :PA, :P, 'Réponse de P, d avant la règle', 'a51b0000-0000-4000-8000-0000000000e3');
alter table public.comments enable trigger trg_limite_profondeur_commentaire;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
select public.preparer_suppression_compte() is not null as compte_prepare;
reset role;
select (select author_id is null and auteur_supprime from public.comments where id = 'a51b0000-0000-4000-8000-0000000000e4') as anonymisee,
       not exists (select 1 from public.users where id = :P) as compte_parti;
rollback;

\echo '--- F2 quater. la notification d un commentaire qu on ne peut pas lire se tait : P a bloqué B ; dans le fil de Q, B avait répondu ; P y répond (attendu : INSERT 0 1, puis reponse_chez_b 0 | reponse_chez_q 1 — avant la correction : 1 | 1)'
begin;
insert into public.comments (id, post_id, author_id, texte) values ('a51b0000-0000-4000-8000-0000000000e1', :PA, :Q, 'Commentaire de Q');
insert into public.comments (post_id, author_id, texte, parent_id) values (:PA, :B, 'Réponse de B', 'a51b0000-0000-4000-8000-0000000000e1');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.comments (post_id, author_id, texte, parent_id)
values ('a51b0000-0000-4000-8000-0000000000a1', 'a51b0000-0000-4000-8000-000000000001', 'Réponse de P', 'a51b0000-0000-4000-8000-0000000000e1');
reset role;
select (select count(*) from public.notifications where user_id = :B and acteur_id = :P) as reponse_chez_b,
       (select count(*) from public.notifications where user_id = :Q and acteur_id = :P) as reponse_chez_q;
rollback;

\echo '--- F3. P s abonne à A, puis à B (attendu : INSERT 0 1, puis ERROR … row-level security — avant : INSERT 0 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.follows (follower_id, following_id) values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a');
insert into public.follows (follower_id, following_id) values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000b');
rollback;

\echo '--- F3 bis. … et B, bloqué par P, ne s abonne pas à P non plus — les deux sens (attendu : ERROR … row-level security — avant : INSERT 0 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.follows (follower_id, following_id) values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-000000000001');
rollback;

\echo '--- F3 ter. un « j aime » ne se DÉPLACE pas (relecture du 26/10) : P aime la publication de A, puis le déplace vers celle de B (attendu : INSERT 0 1, puis ERROR permission denied for table post_likes — avant : UPDATE 1, et le compteur de A gardait +1 sans ligne)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.post_likes (user_id, post_id) values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-0000000000a1');
update public.post_likes set post_id = 'a51b0000-0000-4000-8000-0000000000b1' where user_id = 'a51b0000-0000-4000-8000-000000000001';
rollback;

\echo '--- F3 quater. … un abonnement non plus (attendu : INSERT 0 1, puis ERROR permission denied for table follows — avant : UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.follows (follower_id, following_id) values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a');
update public.follows set following_id = 'a51b0000-0000-4000-8000-00000000000c' where follower_id = 'a51b0000-0000-4000-8000-000000000001';
rollback;

\echo '--- F3 quinquies. aimer et retirer, s abonner et se désabonner, passent toujours (attendu : INSERT 0 1, DELETE 1, INSERT 0 1, DELETE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.post_likes (user_id, post_id) values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-0000000000a1');
delete from public.post_likes where user_id = 'a51b0000-0000-4000-8000-000000000001';
insert into public.follows (follower_id, following_id) values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a');
delete from public.follows where follower_id = 'a51b0000-0000-4000-8000-000000000001';
rollback;

\echo '--- F4. P laisse un avis à A, puis à B (attendu : INSERT 0 1, puis ERROR … row-level security — avant : INSERT 0 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values ('a51b0000-0000-4000-8000-00000000000a', 'a51b0000-0000-4000-8000-000000000001', 5, 5, 5, 'Très bien');
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-000000000001', 1, 1, 1, 'Chantier abandonné');
rollback;

\echo '--- F5. DÉCISION Q2 — un avis écrit AVANT le blocage : B, qu il vise, le LIT toujours ; Q, un tiers, aussi ; C, qui a bloqué P, ne le lit pas (attendu : 1 | 1 | 0 — avant : 0 | 1 | 0)'
begin;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values (:B, :P, 1, 1, 1, 'Chantier abandonné');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
insert into public.blocages (bloqueur_id, bloque_id) values (:C, :P);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
select count(*) as b_lit_l_avis_qui_le_vise from public.reviews where professional_id = :B;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000002';
select count(*) as q_tiers from public.reviews where professional_id = :B;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000c';
select count(*) as c_a_bloque_l_auteur from public.reviews where professional_id = :B;
rollback;

\echo '--- F6. … P, après le blocage, ne CORRIGE plus son avis, mais peut le RETIRER (attendu : ERROR … row-level security au premier essai ; DELETE 1 au second)'
begin;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values (:B, :P, 1, 1, 1, 'Chantier abandonné');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
update public.reviews set commentaire = 'Pire encore' where author_id = 'a51b0000-0000-4000-8000-000000000001';
rollback;
begin;
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values (:B, :P, 1, 1, 1, 'Chantier abandonné');
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
delete from public.reviews where author_id = 'a51b0000-0000-4000-8000-000000000001';
rollback;

\echo '--- F7. RÉPONDRE À UNE ANNONCE — A répond à celle de C, puis B a bloqué A et A répond à celle de B (attendu : INSERT 0 1, puis ERROR … row-level security — avant : INSERT 0 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:B, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.annonce_reponses (annonce_id, professional_id, message) values ('a51b0000-0000-4000-8000-0000000000c2', 'a51b0000-0000-4000-8000-00000000000a', 'Dispo');
insert into public.annonce_reponses (annonce_id, professional_id, message) values ('a51b0000-0000-4000-8000-0000000000b2', 'a51b0000-0000-4000-8000-00000000000a', 'Dispo');
rollback;

\echo '--- F7 bis. … à SA PROPRE annonce, et à une annonce POURVUE (attendu : ERROR … row-level security, deux fois — avant : INSERT 0 1, deux fois)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.annonce_reponses (annonce_id, professional_id) values ('a51b0000-0000-4000-8000-0000000000b2', 'a51b0000-0000-4000-8000-00000000000b');
rollback;
begin;
update public.annonces_pro set statut = 'pourvue' where id = :AN_C;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.annonce_reponses (annonce_id, professional_id) values ('a51b0000-0000-4000-8000-0000000000c2', 'a51b0000-0000-4000-8000-00000000000a');
rollback;

\echo '--- F8. CLORE reste permis : B a bloqué A ; A RETIRE sa réponse à l annonce de B, écrite avant (attendu : DELETE 1)'
begin;
insert into public.annonce_reponses (annonce_id, professional_id, message) values (:AN_B, :A, 'Dispo');
insert into public.blocages (bloqueur_id, bloque_id) values (:B, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
delete from public.annonce_reponses where professional_id = 'a51b0000-0000-4000-8000-00000000000a';
rollback;

\echo '--- F9. CLIENT VÉRIFIÉ — une demande seulement ENVOYÉE ne suffit pas (attendu : INSERT 0 1, INSERT 0 1, puis en_attente | f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.quote_requests (client_id, professional_id, metier, description) values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plombier', 'Fuite');
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values ('a51b0000-0000-4000-8000-00000000000a', 'a51b0000-0000-4000-8000-000000000001', 4, 4, 4, 'Bien');
reset role;
select q.statut, r.client_verifie from public.reviews r, public.quote_requests q
 where r.author_id = :P and q.client_id = :P;
rollback;

\echo '--- F9 bis. … une urgence ACCEPTÉE suffit (attendu : INSERT 0 1, UPDATE 1, INSERT 0 1, puis acceptee | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key)
values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plomberie', 'fuite');
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.sos_requests set statut = 'acceptee' where client_id = :P;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values ('a51b0000-0000-4000-8000-00000000000a', 'a51b0000-0000-4000-8000-000000000001', 5, 5, 5, 'Rapide');
reset role;
select s.statut, r.client_verifie from public.reviews r, public.sos_requests s
 where r.author_id = :P and s.client_id = :P;
rollback;

\echo '--- F9 ter. … et la mention SURVIT au départ de l auteur : devis accepté, avis vérifié, puis P supprime son compte (attendu : t, puis t | t | t — avant la correction : f | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.quote_requests (client_id, professional_id, metier, description) values ('a51b0000-0000-4000-8000-000000000001', 'a51b0000-0000-4000-8000-00000000000a', 'plombier', 'Fuite');
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.quote_requests set statut = 'accepte' where client_id = :P;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values ('a51b0000-0000-4000-8000-00000000000a', 'a51b0000-0000-4000-8000-000000000001', 5, 5, 5, 'Parfait');
select client_verifie from public.reviews where professional_id = 'a51b0000-0000-4000-8000-00000000000a';
select public.preparer_suppression_compte() is not null as suppression;
reset role;
select client_verifie, auteur_supprime, author_id is null as anonyme
  from public.reviews where professional_id = :A;
rollback;

\echo '--- F10. LES CONVERSATIONS (seconde relecture du 27/10) : masquées des deux côtés sous un blocage, et revenues seulement quand PLUS AUCUN blocage ne sépare les deux personnes (attendu, P puis A à chaque étape : avant 1|1 1|1 ; P bloque A 0|0 0|0 ; A bloque P aussi 0|0 ; P retire le sien DELETE 1 puis 0|0 ; A retire le sien DELETE 1 puis 1|1 1|1)'
begin;
insert into public.conversations (id, client_id, professional_id) values ('a51b0000-0000-4000-8000-0000000000e5', :P, :A);
insert into public.messages (conversation_id, sender_id, texte) values ('a51b0000-0000-4000-8000-0000000000e5', :P, 'Bonjour');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
select 'avant, P' as etape, (select count(*) from public.conversations) as conv, (select count(*) from public.messages) as msg;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
select 'avant, A' as etape, (select count(*) from public.conversations) as conv, (select count(*) from public.messages) as msg;
reset role;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
select 'P bloque A, P' as etape, (select count(*) from public.conversations) as conv, (select count(*) from public.messages) as msg;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
select 'P bloque A, A' as etape, (select count(*) from public.conversations) as conv, (select count(*) from public.messages) as msg;
reset role;
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :P);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
delete from public.blocages where bloqueur_id = 'a51b0000-0000-4000-8000-000000000001' and bloque_id = 'a51b0000-0000-4000-8000-00000000000a';
select 'P a retiré le sien, A garde le sien, P' as etape, (select count(*) from public.conversations) as conv, (select count(*) from public.messages) as msg;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
delete from public.blocages where bloqueur_id = 'a51b0000-0000-4000-8000-00000000000a' and bloque_id = 'a51b0000-0000-4000-8000-000000000001';
select 'plus aucun blocage, A' as etape, (select count(*) from public.conversations) as conv, (select count(*) from public.messages) as msg;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
select 'plus aucun blocage, P' as etape, (select count(*) from public.conversations) as conv, (select count(*) from public.messages) as msg;
rollback;

\echo ''
\echo '##### G. LES RÉPONSES AUX DEMANDES — section 30.3 #####'

\echo '--- G1. A répond à la demande de P : le compteur de la demande monte (attendu : INSERT 0 1, puis nb_reponses = 1 lu par P)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.demande_reponses (demande_id, professional_id, message)
values ('a51b0000-0000-4000-8000-0000000000d1', 'a51b0000-0000-4000-8000-00000000000a', 'Je passe demain');
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
select nb_reponses from public.demandes where id = 'a51b0000-0000-4000-8000-0000000000d1';
rollback;

\echo '--- G2. P écrit « 40 réponses » sous sa demande, après une vraie réponse de A, puis la passe « pourvue » (seconde relecture du 27/10 : l ancien nombre est GARDÉ — attendu : INSERT 0 1, UPDATE 1, 1, UPDATE 1, 1 ; une garde qui remettrait 0 à chaque écriture rendrait 0)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.demande_reponses (demande_id, professional_id, message)
values ('a51b0000-0000-4000-8000-0000000000d1', 'a51b0000-0000-4000-8000-00000000000a', 'Je passe demain');
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000001';
update public.demandes set nb_reponses = 40 where id = 'a51b0000-0000-4000-8000-0000000000d1';
select nb_reponses from public.demandes where id = 'a51b0000-0000-4000-8000-0000000000d1';
update public.demandes set statut = 'pourvue' where id = 'a51b0000-0000-4000-8000-0000000000d1';
select nb_reponses from public.demandes where id = 'a51b0000-0000-4000-8000-0000000000d1';
rollback;

\echo '--- G2 bis. B écrit « 40 réponses » sous SON ANNONCE et change son titre, après une vraie réponse de A, puis la ferme (relecture du 26/10 et du 27/10 : attendu INSERT 0 1, UPDATE 1, 1, UPDATE 1, 1 — avant : 40)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.annonce_reponses (annonce_id, professional_id, message) values ('a51b0000-0000-4000-8000-0000000000b2', 'a51b0000-0000-4000-8000-00000000000a', 'Dispo');
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
update public.annonces_pro set nb_reponses = 40, titre = 'Annonce de B, retouchée' where id = 'a51b0000-0000-4000-8000-0000000000b2';
select nb_reponses from public.annonces_pro where id = 'a51b0000-0000-4000-8000-0000000000b2';
update public.annonces_pro set statut = 'pourvue' where id = 'a51b0000-0000-4000-8000-0000000000b2';
select nb_reponses from public.annonces_pro where id = 'a51b0000-0000-4000-8000-0000000000b2';
rollback;

\echo '--- G2 ter. … et le vrai compteur monte toujours : A répond à l annonce de B (attendu : INSERT 0 1, puis 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.annonce_reponses (annonce_id, professional_id, message) values ('a51b0000-0000-4000-8000-0000000000b2', 'a51b0000-0000-4000-8000-00000000000a', 'Dispo');
select nb_reponses from public.annonces_pro where id = 'a51b0000-0000-4000-8000-0000000000b2';
rollback;

\echo '--- G3. A DÉPLACE sa réponse vers la demande de Q (attendu : ERROR OP021 « Une réponse ne se déplace pas : seul son message peut changer. » — avant : UPDATE 1)'
begin;
insert into public.demande_reponses (demande_id, professional_id, message) values (:DEM_P, :A, 'Je passe demain');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.demande_reponses set demande_id = 'a51b0000-0000-4000-8000-0000000000d2' where professional_id = 'a51b0000-0000-4000-8000-00000000000a';
rollback;

\echo '--- G4. … son MESSAGE, lui, change (attendu : UPDATE 1)'
begin;
insert into public.demande_reponses (demande_id, professional_id, message) values (:DEM_P, :A, 'Je passe demain');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.demande_reponses set message = 'Je passe jeudi' where professional_id = 'a51b0000-0000-4000-8000-00000000000a';
rollback;

\echo '--- G5. P a bloqué B : B ne répond plus à sa demande (attendu : ERROR … row-level security — avant : INSERT 0 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.demande_reponses (demande_id, professional_id) values ('a51b0000-0000-4000-8000-0000000000d1', 'a51b0000-0000-4000-8000-00000000000b');
rollback;

\echo '--- G6. une demande POURVUE ne reçoit plus de réponse (attendu : ERROR … row-level security — avant : INSERT 0 1)'
begin;
update public.demandes set statut = 'pourvue' where id = :DEM_P;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.demande_reponses (demande_id, professional_id) values ('a51b0000-0000-4000-8000-0000000000d1', 'a51b0000-0000-4000-8000-00000000000a');
rollback;

\echo '--- G7. un visiteur ne lit plus aucune réponse (attendu : ERROR permission denied for table demande_reponses — avant : 1 ligne, avec le message)'
begin;
insert into public.demande_reponses (demande_id, professional_id, message) values (:DEM_P, :A, 'Je passe demain');
set local role anon;
select count(*) from public.demande_reponses;
rollback;

\echo '--- G8. le rattrapage RECALCULE : un compteur faussé par l éditeur SQL est remis juste au rejeu (attendu : 1)'
begin;
insert into public.demande_reponses (demande_id, professional_id, message) values (:DEM_P, :A, 'Je passe demain');
update public.demandes set nb_reponses = 7 where id = :DEM_P;
update public.demandes d
   set nb_reponses = (select count(*) from public.demande_reponses r where r.demande_id = d.id)
 where d.nb_reponses is distinct from (select count(*) from public.demande_reponses r where r.demande_id = d.id);
select nb_reponses from public.demandes where id = :DEM_P;
rollback;

\echo '--- G9. une réponse d ANNONCE ne se déplace pas non plus (attendu : ERROR OP021)'
begin;
insert into public.annonce_reponses (annonce_id, professional_id, message) values (:AN_C, :A, 'Dispo');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.annonce_reponses set annonce_id = 'a51b0000-0000-4000-8000-0000000000b2' where professional_id = 'a51b0000-0000-4000-8000-00000000000a';
rollback;

\echo ''
\echo '##### H. LES PARTENARIATS — section 13.5 ter #####'

\echo '--- H0. CAS 0 — la donnée existe : un partenariat ACCEPTÉ entre A et C, lu par Q, un tiers ; une demande EN ATTENTE de B vers A, lue par A (attendu : 1, puis 1)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:A, :C, 'accepte');
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'en_attente');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000002';
select count(*) as q_lit_l_accepte from public.professional_partners where statut = 'accepte';
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
select count(*) as a_lit_la_demande from public.professional_partners where statut = 'en_attente';
rollback;

\echo '--- H1. un visiteur ne lit plus rien, pas même un partenariat accepté (attendu : ERROR permission denied for table professional_partners — avant : 2 lignes, la demande en attente comprise)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:A, :C, 'accepte');
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'en_attente');
set local role anon;
select count(*) from public.professional_partners;
rollback;

\echo '--- H2. un connecté TIERS ne lit pas une demande en attente (attendu : 0 — avant : 1)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'en_attente');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000002';
select count(*) as q_lit_l_attente from public.professional_partners;
rollback;

\echo '--- H3. Q a bloqué C : il ne lit plus le partenariat A–C (attendu : 0 — avant : 1)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:A, :C, 'accepte');
insert into public.blocages (bloqueur_id, bloque_id) values (:Q, :C);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-000000000002';
select count(*) as q_lit from public.professional_partners;
rollback;

\echo '--- H4. B demande un partenariat déjà « accepte » (attendu : ERROR … row-level security, avant comme après)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.professional_partners (professional_id, partner_id, statut) values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-00000000000a', 'accepte');
rollback;

\echo '--- H5. B demande SANS statut : le défaut est « en attente » (attendu : INSERT 0 1, puis en_attente — avant : ERROR … row-level security, le défaut valait « accepte »)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.professional_partners (professional_id, partner_id) values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-00000000000a');
select statut from public.professional_partners;
rollback;

\echo '--- H6. B choisit sa DATE de demande (attendu : ERROR permission denied for table professional_partners — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.professional_partners (professional_id, partner_id, statut, created_at) values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-00000000000a', 'en_attente', '2001-01-01');
rollback;

\echo '--- H6 bis. … et si un droit de colonne était un jour élargi par mégarde, la date resterait celle de la BASE (relecture du 26/10 : attendu INSERT 0 1, puis t)'
begin;
grant insert (created_at) on public.professional_partners to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.professional_partners (professional_id, partner_id, statut, created_at) values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-00000000000a', 'en_attente', '2001-01-01');
select created_at > now() - interval '1 hour' as date_de_la_base from public.professional_partners;
rollback;

\echo '--- H7. DÉFAUT N° 2 DU 19/10 : A, en ACCEPTANT la demande de B, en change l AUTEUR pour C (attendu : ERROR permission denied for table professional_partners — avant : UPDATE 1, et C se retrouvait partenaire de A sans rien avoir demandé)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'en_attente');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.professional_partners set statut = 'accepte', professional_id = 'a51b0000-0000-4000-8000-00000000000c'
 where partner_id = 'a51b0000-0000-4000-8000-00000000000a';
rollback;

\echo '--- H8. A accepte ; la date de réponse est celle de la BASE, pas celle envoyée (attendu : UPDATE 1, puis accepte | t — avant : la date de 2001 restait)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'en_attente');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.professional_partners set statut = 'accepte', repondu_le = '2001-01-01'
 where partner_id = 'a51b0000-0000-4000-8000-00000000000a';
select statut, repondu_le > now() - interval '1 hour' as date_de_la_base from public.professional_partners;
rollback;

\echo '--- H9. une demande REFUSÉE ne s accepte plus (attendu : UPDATE 0 — avant : UPDATE 1)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'refuse');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.professional_partners set statut = 'accepte' where partner_id = 'a51b0000-0000-4000-8000-00000000000a';
rollback;

\echo '--- H10. le DEMANDEUR ne supprime plus le refus — sinon il redemande en boucle ; celui qui a refusé, lui, le peut (attendu : DELETE 0, puis DELETE 1 — avant : DELETE 1, puis DELETE 0, le refus était déjà parti)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'refuse');
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
delete from public.professional_partners;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
delete from public.professional_partners;
rollback;

\echo '--- H11. sous blocage, on ne PROPOSE pas — dans les deux sens (attendu : ERROR OP020 « Vous ne pouvez pas proposer ce partenariat. », deux fois — avant : INSERT 0 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.professional_partners (professional_id, partner_id, statut) values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-00000000000a', 'en_attente');
rollback;
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :B);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
insert into public.professional_partners (professional_id, partner_id, statut) values ('a51b0000-0000-4000-8000-00000000000a', 'a51b0000-0000-4000-8000-00000000000b', 'en_attente');
rollback;

\echo '--- H12. une demande déposée AVANT le blocage : A ne l ACCEPTE plus, mais la REFUSE (attendu : ERROR OP020 « Vous ne pouvez plus accepter ce partenariat. Vous pouvez encore le refuser. » ; puis UPDATE 1)'
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'en_attente');
insert into public.blocages (bloqueur_id, bloque_id) values (:B, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.professional_partners set statut = 'accepte' where partner_id = 'a51b0000-0000-4000-8000-00000000000a';
rollback;
begin;
insert into public.professional_partners (professional_id, partner_id, statut) values (:B, :A, 'en_attente');
insert into public.blocages (bloqueur_id, bloque_id) values (:B, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000a';
update public.professional_partners set statut = 'refuse' where partner_id = 'a51b0000-0000-4000-8000-00000000000a';
rollback;

\echo '--- H13. demander, annuler, redemander : A n est prévenu qu UNE fois par 24 h (attendu : INSERT 0 1, DELETE 1, INSERT 0 1, puis 1 notification — avant : 2)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.professional_partners (professional_id, partner_id, statut) values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-00000000000a', 'en_attente');
delete from public.professional_partners where professional_id = 'a51b0000-0000-4000-8000-00000000000b';
insert into public.professional_partners (professional_id, partner_id, statut) values ('a51b0000-0000-4000-8000-00000000000b', 'a51b0000-0000-4000-8000-00000000000a', 'en_attente');
reset role;
select count(*) as sonneries from public.notifications where user_id = :A and type = 'partenaire_demande';
rollback;

\echo ''
\echo '##### I. LE CATALOGUE #####'

\echo '--- I1. les fonctions du lot, leur mode et leur appel (attendu : definer f/t comme ci-dessous ; aucune de déclencheur appelable ; peut_faire_un_devis appelable par authenticated seul)'
select p.proname, p.prosecdef as definer,
       has_function_privilege('anon', p.oid, 'execute') as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as authentifie
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('tient_la_demande', 'tient_l_urgence', 'tient_le_partenariat', 'tient_la_reponse',
                     'tient_le_compteur_de_demande', 'tient_le_compteur_d_annonce',
                     'maj_nb_reponses_demande', 'tient_le_lien_du_devis',
                     'tait_les_notifications_bloquees', 'peut_faire_un_devis',
                     'limite_profondeur_commentaire')
 order by p.proname;

\echo '--- I2. les droits de table qu un visiteur n a plus (attendu : f | f)'
select has_table_privilege('anon', 'public.professional_partners', 'select') as partenaires,
       has_table_privilege('anon', 'public.demande_reponses', 'select') as reponses;

\echo '--- I3. les droits de colonne des partenariats (attendu : insert : t t t f f ; update : f f t t f)'
select has_column_privilege('authenticated', 'public.professional_partners', 'professional_id', 'insert') as i_pro,
       has_column_privilege('authenticated', 'public.professional_partners', 'partner_id', 'insert') as i_part,
       has_column_privilege('authenticated', 'public.professional_partners', 'statut', 'insert') as i_statut,
       has_column_privilege('authenticated', 'public.professional_partners', 'created_at', 'insert') as i_date,
       has_column_privilege('authenticated', 'public.professional_partners', 'repondu_le', 'insert') as i_rep;
select has_column_privilege('authenticated', 'public.professional_partners', 'professional_id', 'update') as u_pro,
       has_column_privilege('authenticated', 'public.professional_partners', 'partner_id', 'update') as u_part,
       has_column_privilege('authenticated', 'public.professional_partners', 'statut', 'update') as u_statut,
       has_column_privilege('authenticated', 'public.professional_partners', 'repondu_le', 'update') as u_rep,
       has_column_privilege('authenticated', 'public.professional_partners', 'created_at', 'update') as u_date;

\echo '--- I4. toute politique qui appelle est_masque est `to authenticated` — appelée pour un visiteur, elle échouerait au lieu de filtrer (attendu : aucune ligne, avant comme après)'
select tablename, policyname, roles from pg_policies
 where schemaname = 'public'
   and (coalesce(qual, '') || coalesce(with_check, '')) like '%est_masque%'
   and not roles @> array['authenticated']::name[];

\echo ''
\echo '##### FIN #####'
