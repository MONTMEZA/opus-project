-- ==========================================================================
--  ESSAIS DE LA SECTION 45 — le SIRET devient la condition de l'inscription
--  professionnelle
--
--  À rejouer sur un PostgreSQL NEUF, après local-prelude.sql et schema.sql
--  (deux fois) :
--
--    psql -d opus -v ON_ERROR_STOP=0 -f supabase/essais-section-45.sql
--
--  Chaque cas vit dans son `begin … rollback` et JAMAIS dans un bloc `do` :
--  une politique RLS n'y est pas appliquée (CLAUDE.md, 01/10/2026). Le rôle
--  et l'identité se posent par `set local`, chacun dans son propre ordre.
--  Chaque ordre qui doit échouer est le DERNIER de sa transaction : après
--  une erreur, tout ce qui suivrait répondrait « current transaction is
--  aborted », ce qui ressemble beaucoup à un second défaut.
--
--  Les refus attendus s'affichent en `ERROR` avec leur texte : il faut les
--  LIRE, et les comparer à l'attendu annoncé juste au-dessus. Un
--  `grep '^ERROR'` ne les voit pas — psql préfixe chaque ligne par le nom du
--  fichier.
--
--  ORDRE DU FICHIER, et il n'est pas décoratif :
--    A. on prouve d'abord que la donnée EXISTE et que la lecture MARCHE.
--       Sans ça, un « 0 identité lue » prouverait seulement qu'il n'y avait
--       rien à lire — le défaut des essais de la section 29 ;
--    B. on prouve que chaque porte est fermée ;
--    C. on prouve que le chemin légitime passe. Un verrou qui refuse aussi
--       les vrais artisans n'est pas un verrou, c'est une panne.
--
--  LES SIRET SONT FICTIFS, à clé de contrôle juste, et le répertoire n'en
--  connaît aucun (vérifié le 15/10/2026 : 0 résultat pour chaque SIRET et
--  chaque SIREN, et 1 pour un témoin réel). Les preuves sont posées par le
--  superutilisateur, comme la fonction Edge les poserait.
-- ==========================================================================

\set QUIET on
\pset pager off

\set ADMIN   '''a4500000-0000-4000-8000-0000000000ad'''
\set A       '''a4500000-0000-4000-8000-00000000000a'''
\set B       '''a4500000-0000-4000-8000-00000000000b'''
\set C       '''a4500000-0000-4000-8000-00000000000c'''
\set D       '''a4500000-0000-4000-8000-00000000000d'''
\set S       '''a4500000-0000-4000-8000-000000000005'''
\set T       '''a4500000-0000-4000-8000-000000000007'''
\set VIEUX   '''a4500000-0000-4000-8000-000000000008'''
\set BADGE   '''a4500000-0000-4000-8000-000000000009'''
\set NEUF    '''a4500000-0000-4000-8000-0000000000ee'''

-- Ménage d'un passage précédent interrompu : le fichier se rejoue.
delete from public.administrateurs where user_id = :ADMIN;
delete from auth.users where id::text like 'a4500000-0000-4000-8000-%';
delete from public.preuves_siret where siret like '0000002%';

-- --------------------------------------------------------------------------
--  LE JEU D'ESSAI
--
--  Les preuves d'abord, comme la fonction Edge les poserait. Le SIREN
--  000000208 en a DEUX : son siège, et un second établissement — le
--  déménagement de C5.
-- --------------------------------------------------------------------------
insert into public.preuves_siret
  (siret, denomination, nom_commercial, nom_complet_registre, est_ei, forme_juridique,
   ape, est_siege, adresse, code_postal, commune, code_insee, statut_diffusion,
   source, verifiee_le, expire_le)
values
  ('00000020800017', 'MACONNERIE DU REPERTOIRE', null, 'MACONNERIE DU REPERTOIRE', false, '5499',
   '43.99C', true, '1 RUE DU SIEGE', '13410', 'LAMBESC', '13050', 'O',
   'registre', now() - interval '1 hour', now() + interval '23 hours'),
  ('00000020800025', 'MACONNERIE DU REPERTOIRE', null, 'MACONNERIE DU REPERTOIRE', false, '5499',
   '43.99C', false, '2 RUE NOUVELLE', '13100', 'AIX-EN-PROVENCE', '13001', 'O',
   'registre', now(), now() + interval '24 hours'),
  ('00000021600010', null, 'BOIS ET CHARPENTE', 'DUPONT (JEAN)', true, '1000',
   '43.91A', true, '3 CHEMIN PRIVE', '13350', 'CHARLEVAL', '13024', 'O',
   'registre', now(), now() + interval '24 hours'),
  ('00000022400014', 'TOITURES DE PROVENCE', null, 'TOITURES DE PROVENCE', false, '5710',
   '43.91B', true, '4 AVENUE DU TOIT', '13090', 'AIX-EN-PROVENCE', '13001', 'O',
   'registre', now(), now() + interval '24 hours'),
  ('00000024000010', 'LE VRAI TITULAIRE', null, 'LE VRAI TITULAIRE', false, '5499',
   '43.99C', true, '5 RUE VRAIE', '13001', 'MARSEILLE', '13201', 'O',
   'registre', now(), now() + interval '24 hours'),
  ('00000026500017', 'AUTRE ENTREPRISE', null, 'AUTRE ENTREPRISE', false, '5499',
   '43.99C', true, null, null, 'PERTUIS', '84089', 'O',
   'registre', now(), now() + interval '24 hours'),
  -- Une preuve EXPIRÉE : le répertoire a dit « oui » il y a deux jours.
  ('00000027300011', 'EXPIREE', null, 'EXPIREE', false, '5499',
   '43.99C', true, null, null, 'LAMBESC', '13050', 'O',
   'registre', now() - interval '2 days', now() - interval '1 day');
-- Et 00000023200017 n'a AUCUNE preuve : le répertoire ne la montre pas.

-- Une preuve ESSAI, posée à la main comme pour un compte jetable : elle
-- NOMME le compte qu'elle sert (`pour_email`), et ne vaut que pour lui.
insert into public.preuves_siret
  (siret, denomination, nom_complet_registre, est_ei, forme_juridique, ape, est_siege,
   commune, code_insee, statut_diffusion, source, verifiee_le, expire_le, pour_email)
values
  ('00000025700014', 'ESSAI JETABLE', 'ESSAI JETABLE', false, '5499', '43.99C', true,
   'LAMBESC', '13050', 'O', 'essai', now(), now() + interval '1 hour',
   'jetable45@exemple-opus.test');

-- L'administrateur d'abord : la demande de C, à l'inscription, doit le
-- prévenir.
insert into auth.users (id, email, raw_user_meta_data) values
  (:ADMIN, 'admin45@exemple-opus.test', '{"type":"particulier","nom":"Admin Opus"}'::jsonb);
insert into public.administrateurs (user_id, note) values (:ADMIN, 'essais section 45');

insert into auth.users (id, email, raw_user_meta_data) values
  -- A s'inscrit en pro. Le SIRET arrive AVEC ses espaces, et les
  -- métadonnées PRÉTENDENT une autre dénomination : c'est la preuve qui
  -- doit gagner.
  (:A, 'a45@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'A Maçon', 'entreprise', 'Maçonnerie A',
                      'metiers', jsonb_build_array('macon'), 'ville', 'Lambesc (13)',
                      'siret', '000 000 208 00017', 'denomination', 'NOM INVENTÉ')),
  (:B, 'b45@exemple-opus.test',
   jsonb_build_object('type', 'particulier', 'nom', 'Jean Dupont', 'ville', 'Charleval (13)',
                      'code_postal', '13350', 'latitude', '43.716', 'longitude', '5.244')),
  -- C s'inscrit par la porte de secours : particulier, avec une demande.
  (:C, 'c45@exemple-opus.test',
   jsonb_build_object('type', 'particulier', 'nom', 'C Couvreur', 'ville', 'Aix-en-Provence (13)',
                      'demande_pro', jsonb_build_object(
                        'siret', '000 000 224 00014', 'motif', 'introuvable',
                        'entreprise', 'Toitures C',
                        'metiers', jsonb_build_array('couvreur')))),
  (:D, 'd45@exemple-opus.test',
   jsonb_build_object('type', 'particulier', 'nom', 'D Plombier', 'ville', 'Pertuis (84)',
                      'demande_pro', jsonb_build_object(
                        'siret', '00000023200017', 'motif', 'non_diffusible',
                        'metiers', jsonb_build_array('plombier')))),
  -- S, le squatteur : il a tapé le SIRET d'un autre, que le répertoire
  -- connaît bien.
  (:S, 's45@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Squatteur', 'entreprise', 'Le Vrai Titulaire',
                      'metiers', jsonb_build_array('macon'), 'ville', 'Marseille (13)',
                      'siret', '00000024000010'));
-- T, le vrai titulaire, arrive APRÈS : son entreprise est prise.
insert into auth.users (id, email, raw_user_meta_data) values
  (:T, 't45@exemple-opus.test',
   jsonb_build_object('type', 'particulier', 'nom', 'T Titulaire', 'ville', 'Marseille (13)',
                      'demande_pro', jsonb_build_object(
                        'siret', '00000024000010', 'motif', 'deja_utilise',
                        'entreprise', 'Le Vrai Titulaire',
                        'metiers', jsonb_build_array('macon'))));

-- Deux fiches « d'avant ce lot », sans entreprise rattachée : c'est la
-- forme exacte des sept fiches de la vraie base. Créées comme
-- l'administration le ferait depuis l'éditeur SQL, où `current_user` est le
-- propriétaire — et l'une porte le badge, comme trois d'entre elles.
insert into auth.users (id, email, raw_user_meta_data) values
  (:VIEUX, 'vieux45@exemple-opus.test', '{"type":"particulier","nom":"Vieux Pro"}'::jsonb),
  (:BADGE, 'badge45@exemple-opus.test', '{"type":"particulier","nom":"Pro Badge"}'::jsonb);
update public.users set type = 'pro' where id in (:VIEUX, :BADGE);
insert into public.professional_profiles (id, entreprise, metier, metiers, ville, siret)
values (:VIEUX, 'Vieux Pro SARL', 'macon', array['macon'], 'Pertuis', '812 345 678 00019'),
       (:BADGE, 'Pro Badgé', 'macon', array['macon'], 'Lambesc', '123 456 789 00012');
update public.professional_profiles set kbis_valide = true, assurance_valide = true
 where id = :BADGE;

-- Les identifiants des demandes, lus ICI, en superutilisateur. Lus plus bas
-- sous le rôle de l'administrateur, ils seraient filtrés par « lecture de
-- mes demandes pro » — l'administration ne lit la file que par
-- `admin_demandes_pro()` — et la fonction répondrait « cette demande
-- n'existe pas » : un essai qui échoue pour la mauvaise raison.
select id as "DEM_C" from public.demandes_pro where compte_id = :C \gset
select id as "DEM_D" from public.demandes_pro where compte_id = :D \gset
select id as "DEM_T" from public.demandes_pro where compte_id = :T \gset

\set QUIET off

\echo ''
\echo '##### A. LA DONNÉE EXISTE, ET LA LECTURE MARCHE #####'

\echo '--- A1. huit preuves, dont une expirée (attendu : 8 | 1)'
select count(*) as preuves, count(*) filter (where expire_le <= now()) as expirees
  from public.preuves_siret where siret like '0000002%';

\echo '--- A2. A est né pro, avec sa fiche ET son identité (attendu : pro | t | 000000208 | 00000020800017 | registre | MACONNERIE DU REPERTOIRE | t)'
select u.type,
       exists (select 1 from public.professional_profiles p where p.id = u.id) as a_une_fiche,
       e.siren, e.siret, e.source, e.denomination,
       e.verifie_le = (select verifiee_le from public.preuves_siret where siret = '00000020800017')
         as date_de_la_preuve
  from public.users u
  join public.entreprise_registre e on e.pro_id = u.id and e.retiree_le is null
 where u.id = :A;

\echo '--- A3. S, le squatteur, tient 000000240 (attendu : pro | 000000240)'
select u.type, e.siren from public.users u
  join public.entreprise_registre e on e.pro_id = u.id and e.retiree_le is null
 where u.id = :S;

\echo '--- A4. C, D et T sont nés PARTICULIERS, chacun avec une demande ouverte (attendu : 3 lignes particulier | nouvelle ; métiers C = {couvreur}, D = {plombier}, T = {macon})'
select u.nom, u.type, d.statut, d.motif, d.siret, d.metiers
  from public.users u join public.demandes_pro d on d.compte_id = u.id
 where u.id in (:C, :D, :T) order by u.nom;

\echo '--- A5. aucun des trois n''a de fiche, ni d''identité (attendu : 0 | 0)'
select (select count(*) from public.professional_profiles where id in (:C, :D, :T)) as fiches,
       (select count(*) from public.entreprise_registre where pro_id in (:C, :D, :T)) as identites;

\echo '--- A6. l''administrateur a été prévenu trois fois, avec la demande et le demandeur (attendu : 3 | 3 | 3)'
select count(*) as notifications,
       count(*) filter (where n.demande_pro_id is not null) as avec_la_demande,
       count(*) filter (where n.acteur_id in (:C, :D, :T)) as avec_le_demandeur
  from public.notifications n
 where n.user_id = :ADMIN and n.type = 'demande_pro_nouvelle';

\echo '--- A7. A lit SON identité par la règle RLS (attendu : 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select count(*) as mon_identite from public.entreprise_registre;
rollback;

\echo '--- A8. C lit SA demande (attendu : 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :C;
select count(*) as ma_demande from public.demandes_pro;
rollback;

\echo '--- A9. l''administration lit les identités et la file (attendu : 2 | 3 demandes, les plus anciennes d''abord : C, D, T)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select count(*) as identites_lues from public.entreprise_registre;
select x ->> 'motif' as motif, x -> 'compte' ->> 'nom' as compte,
       x -> 'preuve' ->> 'denomination' as le_repertoire_dit,
       x -> 'detenteur' ->> 'entreprise' as detenteur
  from jsonb_array_elements(public.admin_demandes_pro()) x;
rollback;

\echo '--- A10. …et la file ne montre ni e-mail, ni téléphone, ni adresse (attendu : f | f | f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_demandes_pro()::text like '%@%'          as un_email,
       public.admin_demandes_pro()::text like '%RUE%'        as une_adresse,
       public.admin_demandes_pro()::text like '%telephone%'  as un_telephone;
rollback;

\echo ''
\echo '##### B. CHAQUE PORTE EST FERMÉE #####'

\echo '--- B1. inscription pro SANS preuve (attendu : ERROR OP006, et aucun compte)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'neuf45@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Sans preuve', 'metiers', jsonb_build_array('macon'),
                      'siret', '00000023200017'));
rollback;

\echo '--- B2. inscription pro avec une preuve EXPIRÉE (attendu : ERROR OP006)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'neuf45@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Preuve expirée', 'siret', '00000027300011'));
rollback;

\echo '--- B3. une preuve ESSAI pour une adresse ordinaire (attendu : ERROR OP006)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'quelquun@exemple.fr',
   jsonb_build_object('type', 'pro', 'nom', 'Lecteur du dépôt', 'siret', '00000025700014'));
rollback;

\echo '--- B3 bis. …ou pour une AUTRE adresse du domaine d''essai, inventée (attendu : ERROR OP006 — la preuve nomme UN compte, pas un domaine)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'n.importe.qui@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Lecteur du dépôt', 'siret', '00000025700014'));
rollback;

\echo '--- B3 ter. une preuve essai qui ne nomme personne, ou une adresse hors du domaine d''essai (attendu : ERROR preuve_essai_check, deux fois)'
begin;
insert into public.preuves_siret (siret, source, expire_le)
  values ('00000028100014', 'essai', now() + interval '1 hour');
rollback;
begin;
insert into public.preuves_siret (siret, source, expire_le, pour_email)
  values ('00000028100014', 'essai', now() + interval '1 hour', 'quelquun@exemple.fr');
rollback;

\echo '--- B4. le MÊME SIREN qu''un autre compte, par un autre établissement (attendu : ERROR OP007)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'neuf45@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Second compte', 'siret', '00000020800025'));
rollback;

\echo '--- B5. …et le refus n''a rien laissé derrière lui (attendu : 0 | 0)'
select (select count(*) from auth.users where id = :NEUF) as auth,
       (select count(*) from public.users where id = :NEUF) as users;

\echo '--- B6. un client LIT les preuves (attendu : ERROR permission denied for table preuves_siret)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select count(*) from public.preuves_siret;
rollback;

\echo '--- B7. un client ÉCRIT une preuve (attendu : ERROR permission denied for table preuves_siret)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.preuves_siret (siret, source, expire_le)
  values ('00000023200017', 'registre', now() + interval '1 day');
rollback;

\echo '--- B8. un client lit les compteurs d''appels (attendu : ERROR permission denied for table siret_limites)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select count(*) from public.siret_limites;
rollback;

\echo '--- B9. un visiteur VIDE les compteurs (attendu : ERROR permission denied for table siret_limites)'
begin;
set local role anon;
delete from public.siret_limites;
rollback;

\echo '--- B10. les droits de table, en une fois (attendu : f PARTOUT, sauf authenticated lit entreprise_registre — demandes_pro passe désormais par des droits de COLONNE, voir B10 bis)'
select t.nom, r.role,
       has_table_privilege(r.role, t.nom, 'select') as lit,
       has_table_privilege(r.role, t.nom, 'insert') as insere,
       has_table_privilege(r.role, t.nom, 'update') as modifie,
       has_table_privilege(r.role, t.nom, 'delete') as supprime
  from (values ('public.preuves_siret'), ('public.siret_limites'),
               ('public.entreprise_registre'), ('public.demandes_pro')) t(nom),
       (values ('anon'), ('authenticated')) r(role)
 order by 1, 2;

\echo '--- B10 bis. demandes_pro, colonne par colonne, pour authenticated (attendu : lit tout SAUF traitee_par ; n''insère QUE compte_id, siret, motif, entreprise, metiers, message, justificatif)'
select a.attname as colonne,
       has_column_privilege('authenticated', 'public.demandes_pro', a.attname, 'select') as lit,
       has_column_privilege('authenticated', 'public.demandes_pro', a.attname, 'insert') as insere
  from pg_attribute a
 where a.attrelid = 'public.demandes_pro'::regclass and a.attnum > 0 and not a.attisdropped
 order by a.attnum;

\echo '--- B11. B lit l''identité de A (attendu : 0 — et A7 prouve qu''il y avait une identité à lire)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select count(*) as identites_d_autrui from public.entreprise_registre;
rollback;

\echo '--- B12. B lit la demande de C (attendu : 0 — et A8 prouve qu''elle existe)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select count(*) as demandes_d_autrui from public.demandes_pro;
rollback;

\echo '--- B13. A réécrit SON identité (attendu : ERROR permission denied for table entreprise_registre)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
update public.entreprise_registre set siren = '000000216', siret = '00000021600010';
rollback;

\echo '--- B14. A s''insère une identité de plus (attendu : ERROR permission denied for table entreprise_registre)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.entreprise_registre (pro_id, siren, siret, source, verifie_le)
  values (:A, '000000265', '00000026500017', 'registre', now());
rollback;

\echo '--- B15. un visiteur lit une identité ou une demande (attendu : ERROR permission denied for table entreprise_registre)'
begin;
set local role anon;
select count(*) from public.entreprise_registre;
rollback;

\echo '--- B16. un particulier s''insère une fiche pro (attendu : ERROR OP010)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.professional_profiles (id, entreprise, metier, metiers, ville)
  values (:B, 'Pas une entreprise', 'macon', array['macon'], 'Charleval');
rollback;

\echo '--- B17. un compte PRO resté sans fiche (le cas du 14/09) se la crée (attendu : pro | f, puis ERROR OP010)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'neuf45@exemple-opus.test', '{"type":"particulier","nom":"Sans fiche"}'::jsonb);
update public.users set type = 'pro' where id = :NEUF;
select u.type, exists (select 1 from public.professional_profiles p where p.id = u.id) as a_une_fiche
  from public.users u where u.id = :NEUF;
set local role authenticated;
set local request.jwt.claim.sub = :NEUF;
insert into public.professional_profiles (id, entreprise, metier, metiers, ville)
  values (:NEUF, 'Réparée', 'macon', array['macon'], 'Lambesc');
rollback;

\echo '--- B18. un client s''insère une demande déjà ACCEPTÉE (attendu : ERROR permission denied for table demandes_pro — le statut et la note ne s''écrivent plus du tout par le client ; la politique reste derrière, B18 bis)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.demandes_pro (compte_id, siret, motif, statut, note)
  values (:B, '00000023200017', 'introuvable', 'acceptee', 'Validé par Opus');
rollback;

\echo '--- B19. …ou une demande signée par l''administration (attendu : ERROR permission denied for table demandes_pro)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.demandes_pro (compte_id, siret, motif, traitee_par)
  values (:B, '00000023200017', 'introuvable', :ADMIN);
rollback;

\echo '--- B18 bis. …ou ANTIDATÉE pour passer en tête de la file (attendu : ERROR permission denied for table demandes_pro)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.demandes_pro (compte_id, siret, motif, created_at)
  values (:B, '00000023200017', 'introuvable', '2020-01-01');
rollback;

\echo '--- B18 ter. la politique tient encore SEULE : avec les droits de table rendus, une demande « acceptée » (attendu : ERROR row-level security)'
begin;
grant insert on public.demandes_pro to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.demandes_pro (compte_id, siret, motif, statut, note)
  values (:B, '00000023200017', 'introuvable', 'acceptee', 'Validé par Opus');
rollback;

\echo '--- B18 quater. le demandeur lit QUI l''a refusé (attendu : ERROR permission denied for table demandes_pro)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :C;
select traitee_par from public.demandes_pro;
rollback;

\echo '--- B20. un PRO dépose une demande (attendu : ERROR row-level security)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.demandes_pro (compte_id, siret, motif)
  values (:A, '00000023200017', 'introuvable');
rollback;

\echo '--- B21. une seconde demande OUVERTE (attendu : ERROR duplicate key idx_demandes_pro_une_ouverte)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :C;
insert into public.demandes_pro (compte_id, siret, motif)
  values (:C, '00000023200017', 'autre');
rollback;

\echo '--- B22. un justificatif rangé dans le dossier d''un AUTRE (attendu : ERROR demande_pro_justificatif_check)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :C;
select public.completer_ma_demande_pro(
  jsonb_build_object('justificatif', 'a4500000-0000-4000-8000-00000000000a/kbis.pdf'));
rollback;

\echo '--- B23. compléter une demande qu''on n''a pas (attendu : ERROR aucune demande … en attente)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select public.completer_ma_demande_pro('{"message":"bonjour"}'::jsonb);
rollback;

\echo '--- B24. devenir pro SANS preuve (attendu : ERROR OP006)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select public.devenir_pro('{"siret":"00000023200017"}'::jsonb);
rollback;

\echo '--- B25. devenir pro avec l''entreprise de quelqu''un d''autre (attendu : ERROR OP007)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select public.devenir_pro('{"siret":"00000020800017"}'::jsonb);
rollback;

\echo '--- B26. un PRO « devient pro » une seconde fois (attendu : ERROR déjà un compte professionnel)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.devenir_pro('{"siret":"00000021600010"}'::jsonb);
rollback;

\echo '--- B27. A rattache une AUTRE entreprise (attendu : ERROR OP008)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.rattacher_mon_siret('00000026500017');
rollback;

\echo '--- B28. une fiche BADGÉE sans entreprise rattache un SIRET (attendu : ERROR OP009)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :BADGE;
select public.rattacher_mon_siret('00000026500017');
rollback;

\echo '--- B29. une fiche sans entreprise prend celle du squatteur (attendu : ERROR OP007)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :VIEUX;
select public.rattacher_mon_siret('00000024000010');
rollback;

\echo '--- B30. un PARTICULIER rattache un SIRET (attendu : ERROR seul un compte professionnel)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select public.rattacher_mon_siret('00000021600010');
rollback;

\echo '--- B31. l''ancien SIRET libre ne se réécrit plus par son titulaire (attendu : 812 345 678 00019 avant ET après, aucune erreur)'
begin;
select siret as avant from public.professional_profiles where id = :VIEUX;
set local role authenticated;
set local request.jwt.claim.sub = :VIEUX;
update public.professional_profiles set siret = '99999999999999', telephone = '0600000000'
 where id = :VIEUX;
reset role;
select siret as apres, telephone as le_reste_passe from public.professional_profiles where id = :VIEUX;
rollback;

\echo '--- B32. aucune fonction nouvelle n''est appelable sans compte (attendu : 8 lignes, anon = f partout ; compter_appel_siret : authenticated = f aussi)'
select p.proname,
       has_function_privilege('anon', p.oid, 'execute')          as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as authentifie
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('compter_appel_siret', 'completer_ma_demande_pro', 'annuler_ma_demande_pro',
                     'rattacher_mon_siret', 'devenir_pro', 'admin_demandes_pro',
                     'admin_traiter_demande_pro', 'admin_retirer_entreprise')
 order by 1;

\echo '--- B33. …ni les deux déclencheurs nouveaux, par personne (attendu : f | f, deux fois)'
select p.proname,
       has_function_privilege('anon', p.oid, 'execute')          as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as authentifie
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('notifie_demande_pro', 'fige_le_siret_libre')
 order by 1;

\echo '--- B34. un client appelle le compteur d''appels (attendu : ERROR permission denied for function compter_appel_siret)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select public.compter_appel_siret('ip:moi', date_trunc('hour', now()), 20);
rollback;

\echo '--- B35. le particulier change son type lui-même (attendu : ERROR OP004, et le message désigne Profil → Passer en compte professionnel)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
update public.users set type = 'pro' where id = auth.uid();
rollback;

\echo '--- B36. CE QUE LE VERROU 44.1 LAISSE PASSER : un déclencheur security definer qui écrit users.type (attendu : pro — c''est pourquoi verifier-pro tient la liste des trois seules fonctions permises)'
begin;
create function public.essai45_promotion() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  update public.users set type = 'pro' where id = new.compte_id;
  return new;
end $$;
create trigger trg_essai45_promotion after insert on public.demandes_pro
  for each row execute function public.essai45_promotion();
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.demandes_pro (compte_id, siret, motif) values (:B, '00000023200017', 'autre');
reset role;
select type as promu_par_un_definer from public.users where id = :B;
rollback;

\echo '--- B37. un non-administrateur tranche une demande (attendu : ERROR réservée à l''administration)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.admin_traiter_demande_pro(
  :'DEM_C', 'accepter', null);
rollback;

\echo '--- B38. ACCEPTER une entreprise déjà tenue par un autre (attendu : ERROR OP007 « retirez d''abord … »)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_traiter_demande_pro(
  :'DEM_T', 'accepter', null);
rollback;

\echo '--- B39. REFUSER sans motif (attendu : ERROR au moins dix caractères)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_traiter_demande_pro(
  :'DEM_C', 'refuser', 'non');
rollback;

\echo '--- B40. TRANSFÉRER sans motif (attendu : ERROR au moins dix caractères)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_traiter_demande_pro(
  :'DEM_T', 'transferer', 'court');
rollback;

\echo '--- B41. RETIRER sans motif (attendu : ERROR au moins dix caractères)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_retirer_entreprise(:A, 'non');
rollback;

\echo '--- B42. UN RETRAIT TIENT : l''administration retire au squatteur S son entreprise, et il la RATTACHE aussitôt (attendu : retiree = true, puis ERROR OP007 — la première version le laissait la reprendre)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select x ->> 'retiree' as retiree
  from public.admin_retirer_entreprise(:S, 'Squatteur signalé par le vrai titulaire.') x;
set local request.jwt.claim.sub = :S;
select public.rattacher_mon_siret('00000024000010');
rollback;

\echo '--- B43. …ni par un COMPTE NEUF, à l''inscription (attendu : ERROR OP007)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_retirer_entreprise(:S, 'Squatteur signalé par le vrai titulaire.') is not null as retiree;
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'neuf45@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Le squatteur, revenu', 'siret', '00000024000010'));
rollback;

\echo '--- B44. …ni par un particulier qui passe pro (attendu : ERROR OP007)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_retirer_entreprise(:S, 'Squatteur signalé par le vrai titulaire.') is not null as retiree;
set local request.jwt.claim.sub = :B;
select public.devenir_pro('{"siret":"00000024000010"}'::jsonb);
rollback;

\echo '--- B45. …et la fonction Edge la voit PRISE : la requête de son étape 2 (attendu : 0 identité active | 1 prise — elle répondra deja_utilise, pas ok)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_retirer_entreprise(:S, 'Squatteur signalé par le vrai titulaire.') is not null as retiree;
reset role;
select count(*) filter (where retiree_le is null)          as identites_actives,
       count(*) filter (where retiree_le is null or gele)  as prise_pour_l_edge
  from public.entreprise_registre where siren = '000000240';
rollback;

\echo '--- B46. UNE RAFALE ne sonne qu''une fois : B dépose et annule cinq fois (attendu : 5 demandes | 1 notification | 0 annulation dans la file des décisions | les 3 demandes ouvertes du jeu, et celle de B)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
\set QUIET on
insert into public.demandes_pro (compte_id, siret, motif) values (:B, '00000023200017', 'autre');
select public.annuler_ma_demande_pro() \g /dev/null
insert into public.demandes_pro (compte_id, siret, motif) values (:B, '00000023200017', 'autre');
select public.annuler_ma_demande_pro() \g /dev/null
insert into public.demandes_pro (compte_id, siret, motif) values (:B, '00000023200017', 'autre');
select public.annuler_ma_demande_pro() \g /dev/null
insert into public.demandes_pro (compte_id, siret, motif) values (:B, '00000023200017', 'autre');
select public.annuler_ma_demande_pro() \g /dev/null
insert into public.demandes_pro (compte_id, siret, motif) values (:B, '00000023200017', 'autre');
\set QUIET off
reset role;
select (select count(*) from public.demandes_pro where compte_id = :B) as demandes_de_b,
       (select count(*) from public.notifications
         where user_id = :ADMIN and type = 'demande_pro_nouvelle' and acteur_id = :B) as sonneries;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select count(*) filter (where x ->> 'statut' = 'annulee')  as annulations_dans_la_file,
       count(*) filter (where x ->> 'statut' = 'nouvelle') as ouvertes
  from jsonb_array_elements(public.admin_demandes_pro()) x;
rollback;

\echo '--- B47. LA PROPRIÉTÉ, VUE PAR LE CATALOGUE : quelles fonctions security definer écrivent users.type ? (attendu : exactement admin_traiter_demande_pro | cree_fiche_utilisateur | devenir_pro)'
-- `verifier-pro` lit le TEXTE de schema.sql, et la relecture adverse l'a
-- trompé par trois formes ordinaires (un alias « as », la colonne entre
-- guillemets, une fonction déclarée sans « public. »). Ici, c'est la BASE
-- qui répond, sur ce qu'elle a réellement compilé.
select p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
   and (p.prosrc ~* 'update\s+(only\s+)?(public\.)?"?users"?(\s+(as\s+)?\w+)?\s+set[^;]*[[:space:],(]"?type"?\s*='
        or p.prosrc ~* 'insert\s+into\s+(public\.)?"?users"?\s*\([^)]*\m"?type\M'
        or p.prosrc ~* 'insert\s+into\s+(public\.)?"?users"?[^;]*do\s+update\s+set[^;]*[[:space:],(]"?type"?\s*=')
 order by 1;

\echo ''
\echo '##### C. LE CHEMIN LÉGITIME PASSE #####'

\echo '--- C1. A a son identité DEPUIS LA PREUVE, pas depuis le formulaire (attendu : MACONNERIE DU REPERTOIRE | Maçonnerie A — le nom public reste celui choisi)'
select e.denomination as identite_privee, p.entreprise as nom_public
  from public.entreprise_registre e join public.professional_profiles p on p.id = e.pro_id
 where e.pro_id = :A;

\echo '--- C2. une preuve ESSAI pour une adresse d''essai (attendu : pro | essai)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  (:NEUF, 'jetable45@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Jetable', 'siret', '00000025700014'));
select u.type, e.source from public.users u
  join public.entreprise_registre e on e.pro_id = u.id where u.id = :NEUF;
rollback;

\echo '--- C3. UNE MÉTADONNÉE MALFORMÉE NE COÛTE JAMAIS UN COMPTE (attendu : 4 comptes particuliers | 0 demande)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('a4500000-0000-4000-8000-0000000000f1', 'f1@exemple-opus.test',
   '{"type":"particulier","nom":"Motif inventé","demande_pro":{"siret":"00000023200017","motif":"pirate"}}'::jsonb),
  ('a4500000-0000-4000-8000-0000000000f2', 'f2@exemple-opus.test',
   '{"type":"particulier","nom":"SIRET illisible","demande_pro":{"siret":"abc","motif":"introuvable"}}'::jsonb),
  ('a4500000-0000-4000-8000-0000000000f3', 'f3@exemple-opus.test',
   jsonb_build_object('type','particulier','nom','Entreprise trop longue',
     'demande_pro', jsonb_build_object('siret','00000023200017','motif','autre','entreprise', repeat('x', 200)))),
  ('a4500000-0000-4000-8000-0000000000f4', 'f4@exemple-opus.test',
   '{"type":"particulier","nom":"Demande qui n est pas un objet","demande_pro":"oui"}'::jsonb);
select count(*) as comptes,
       (select count(*) from public.demandes_pro
         where compte_id::text like 'a4500000-0000-4000-8000-0000000000f%') as demandes
  from public.users where id::text like 'a4500000-0000-4000-8000-0000000000f%' and type = 'particulier';
rollback;

\echo '--- C3 bis. …et un métier INVENTÉ ne coûte pas la demande : la liste retombe à vide, comme l''inscription pro retombe sur « macon » (attendu : nouvelle | {})'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('a4500000-0000-4000-8000-0000000000f5', 'f5@exemple-opus.test',
   '{"type":"particulier","nom":"Licorne","demande_pro":{"siret":"00000023200017","motif":"autre","metiers":["couvreur","licorne"]}}'::jsonb);
select statut, metiers from public.demandes_pro
 where compte_id = 'a4500000-0000-4000-8000-0000000000f5';
rollback;

\echo '--- C4. B DEVIENT PRO par le répertoire, depuis l''application (attendu : pro | 000000216 | BOIS ET CHARPENTE | f — le nom brut ne sort pas ; puis t ; puis pro | Jean Dupont — entreprise vide, on prend le nom du compte | Charleval (13) | 13350 | {charpentier} | t | 2026-10-15)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select x ->> 'type' as type, x -> 'identite' ->> 'siren' as siren,
       x -> 'identite' ->> 'nom_commercial' as nom_commercial,
       x -> 'identite' ? 'nom_complet_registre' as nom_brut_rendu
  from public.devenir_pro('{"siret":"000 000 216 00010","entreprise":"","metiers":["charpentier"],"cgu_version":"2026-10-15"}'::jsonb) x;
select public.est_un_pro() as est_un_pro;
reset role;
select u.type, p.entreprise, p.ville, p.code_postal, p.metiers, p.latitude is not null as placee,
       u.cgu_version
  from public.users u join public.professional_profiles p on p.id = u.id where u.id = :B;
rollback;

\echo '--- C5. …et sa demande de secours se ferme toute seule (attendu : acceptee | « Ouverte automatiquement … »)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.demandes_pro (compte_id, siret, motif) values (:B, '00000021600010', 'injoignable');
select (public.devenir_pro('{"siret":"00000021600010"}'::jsonb)) is not null as devenu_pro;
select statut, note from public.demandes_pro where compte_id = :B;
rollback;

\echo '--- C6. A DÉMÉNAGE : même SIREN, autre SIRET (attendu : 2 lignes — l''ancienne retirée « transfert de siège », la nouvelle active)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select x ->> 'siret' as nouveau_siret from public.rattacher_mon_siret('00000020800025') x;
reset role;
select siret, retiree_le is not null as retiree, retrait_motif
  from public.entreprise_registre where pro_id = :A order by created_at;
rollback;

\echo '--- C7. une fiche d''avant ce lot, sans badge, rattache son SIRET (attendu : AUTRE ENTREPRISE | registre)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :VIEUX;
select x ->> 'denomination' as denomination, x ->> 'source' as source
  from public.rattacher_mon_siret('00000026500017') x;
rollback;

\echo '--- C8. C complète sa demande, puis l''annule, puis en dépose une neuve (attendu : message + justificatif posés, annulee, INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :C;
select x ->> 'message' as message, x ->> 'justificatif' as justificatif
  from public.completer_ma_demande_pro(jsonb_build_object(
         'message', 'Mon entreprise vient d''être créée.',
         'justificatif', 'a4500000-0000-4000-8000-00000000000c/demande-pro/avis.pdf')) x;
-- Joindre un justificatif ne doit pas effacer le message.
select x ->> 'message' as message_garde
  from public.completer_ma_demande_pro('{"justificatif":"a4500000-0000-4000-8000-00000000000c/demande-pro/autre.pdf"}'::jsonb) x;
select x ->> 'statut' as statut from public.annuler_ma_demande_pro() x;
insert into public.demandes_pro (compte_id, siret, motif) values (:C, '00000022400014', 'autre');
rollback;

\echo '--- C9. l''administration ACCEPTE C, que le répertoire connaît (attendu : pro | Toitures C | {couvreur} | registre | TOITURES DE PROVENCE | acceptee | compte_pro_ouvert avec la demande, sans acteur)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select x ->> 'statut' as statut
  from public.admin_traiter_demande_pro(
         :'DEM_C', 'accepter', null) x;
reset role;
select u.type, p.entreprise, p.metiers, e.source, e.denomination, d.statut
  from public.users u
  join public.professional_profiles p on p.id = u.id
  join public.entreprise_registre e on e.pro_id = u.id and e.retiree_le is null
  join public.demandes_pro d on d.compte_id = u.id
 where u.id = :C;
select type, demande_pro_id is not null as mene_a_la_demande, acteur_id is null as sans_acteur
  from public.notifications where user_id = :C and type = 'compte_pro_ouvert';
rollback;

\echo '--- C10. …et le JOURNAL ne garde que l''état (attendu : demande_pro_acceptee | demande_pro | {motif,siren,statut} deux fois)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_traiter_demande_pro(
  :'DEM_C', 'accepter', null) is not null as fait;
reset role;
select action, cible_type,
       (select array_agg(k order by k) from jsonb_object_keys(avant) k) as cles_avant,
       (select array_agg(k order by k) from jsonb_object_keys(apres) k) as cles_apres
  from public.journal_admin
 where cible_id = :'DEM_C';
rollback;

\echo '--- C11. l''administration ACCEPTE D, que le répertoire ne montre pas (attendu : pro | administration | un SIRET, rien d''autre)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_traiter_demande_pro(
  :'DEM_D', 'accepter',
  'Avis de situation Sirene et attestation d''assurance vus.') is not null as fait;
reset role;
select u.type, e.source, e.siret, e.denomination
  from public.users u join public.entreprise_registre e on e.pro_id = u.id where u.id = :D;
rollback;

\echo '--- C12. LE SQUAT : T récupère son entreprise par un TRANSFERT (attendu : S retirée avec la note, T pro et titulaire, S prévenu, deux lignes au journal)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select x ->> 'statut' as statut
  from public.admin_traiter_demande_pro(
         :'DEM_T', 'transferer',
         'Attestation d''assurance nominative de T vue : S ne l''a pas.') x;
reset role;
select pro_id = :S as chez_le_squatteur, retiree_le is not null as retiree, retrait_motif
  from public.entreprise_registre where siren = '000000240' order by created_at;
select u.type as type_de_t from public.users u where u.id = :T;
select type, acteur_id is null as sans_acteur from public.notifications
 where user_id = :S and type = 'entreprise_retiree';
select action, cible_type,
       (select array_agg(k order by k) from jsonb_object_keys(apres) k) as cles_apres
  from public.journal_admin
 where action in ('entreprise_transferee', 'demande_pro_acceptee') order by created_at;
rollback;

\echo '--- C13. …et le squatteur ne peut pas la REPRENDRE (attendu : ERROR OP007)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_traiter_demande_pro(
  :'DEM_T', 'transferer',
  'Attestation d''assurance nominative de T vue : S ne l''a pas.') is not null as fait;
set local request.jwt.claim.sub = :S;
select public.rattacher_mon_siret('00000024000010');
rollback;

\echo '--- C14. l''administration REFUSE C, avec une note (attendu : refusee | la note | demande_pro_refusee menant à la demande | journal demande_pro_refusee)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_traiter_demande_pro(
  :'DEM_C', 'refuser',
  'Aucune entreprise à ce numéro, même avec votre avis Sirene.') is not null as fait;
reset role;
select statut, note, traitee_par = :ADMIN as tranchee_par_l_admin
  from public.demandes_pro where compte_id = :C;
select type, demande_pro_id is not null as mene_a_la_demande
  from public.notifications where user_id = :C and type = 'demande_pro_refusee';
select action from public.journal_admin
 where cible_id = :'DEM_C';
rollback;

\echo '--- C15. RETIRER une entreprise sans la donner à personne (attendu : retiree | entreprise_retiree | {siren,statut} | notification)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select x ->> 'retiree' as retiree from public.admin_retirer_entreprise(:A, 'Entreprise radiée le 01/10/2026.') x;
reset role;
select action, cible_type, (select array_agg(k order by k) from jsonb_object_keys(apres) k) as cles_apres
  from public.journal_admin where action = 'entreprise_retiree';
select count(*) as prevenu from public.notifications where user_id = :A and type = 'entreprise_retiree';
rollback;

\echo '--- C16. le résumé de l''administration compte les demandes ouvertes (attendu : 3)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_resume() ->> 'demandes_pro' as demandes_pro;
rollback;

\echo '--- C17. l''export RGPD de A porte son entreprise, retirées comprises ; celui de C, sa demande (attendu : 2 | 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.rattacher_mon_siret('00000020800025') is not null as demenage;
select jsonb_array_length(public.mes_donnees() -> 'entreprise_registre') as identites_de_a;
set local request.jwt.claim.sub = :C;
select jsonb_array_length(public.mes_donnees() -> 'demandes_pro') as demandes_de_c;
rollback;

\echo '--- C18. A supprime son compte : l''identité part avec lui ; C aussi : sa demande part (attendu : 0 | 0 | 0 | 0)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.preparer_suppression_compte() is not null as donnees_effacees;
set local request.jwt.claim.sub = :C;
select public.preparer_suppression_compte() is not null as donnees_effacees;
reset role;
select (select count(*) from public.entreprise_registre where pro_id = :A)  as identites_de_a,
       (select count(*) from public.professional_profiles where id = :A)    as fiche_de_a,
       (select count(*) from public.demandes_pro where compte_id = :C)      as demandes_de_c,
       -- La notification de l'ADMINISTRATEUR part aussi : elle menait à une
       -- demande qui n'existe plus (A6 prouve qu'elle existait).
       (select count(*) from public.notifications
         where demande_pro_id = :'DEM_C')                                  as notifs_de_la_demande;
rollback;

\echo '--- C19. …et par la cascade depuis auth.users, le second chemin (attendu : 0 | 0)'
begin;
delete from auth.users where id in (:A, :T);
select (select count(*) from public.entreprise_registre where pro_id = :A) as identites_de_a,
       (select count(*) from public.demandes_pro where compte_id = :T)    as demandes_de_t;
rollback;

\echo '--- C20. LE JOURNAL DU BADGE ne garde plus la fiche : l''artisan part, plus de téléphone ni de SIRET (attendu : badge_pose = t, puis {assurance_valide,kbis_valide,rge,verification_statut,verifie} | f | f)'
begin;
update public.professional_profiles set telephone = '0611111111' where id = :VIEUX;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_verifier_pro(:VIEUX, true, true);
reset role;
select verifie as badge_pose from public.professional_profiles where id = :VIEUX;
set local role authenticated;
set local request.jwt.claim.sub = :VIEUX;
select public.preparer_suppression_compte() is not null as compte_parti;
reset role;
select (select array_agg(k order by k) from jsonb_object_keys(apres) k) as cles_apres,
       apres::text like '%0611111111%' as garde_le_telephone,
       apres::text like '%812 345 678%' as garde_le_siret
  from public.journal_admin where cible_id = :VIEUX;
rollback;

\echo '--- C21. le compteur d''appels, appelé par la fonction Edge (attendu : t | t | f — la troisième dépasse 2)'
begin;
set local role service_role;
select public.compter_appel_siret('global', date_trunc('minute', now()), 2) as premier,
       public.compter_appel_siret('global', date_trunc('minute', now()), 2) as second,
       public.compter_appel_siret('global', date_trunc('minute', now()), 2) as troisieme;
rollback;

\echo '--- C22. l''éditeur SQL (auth.uid() vide) change encore un type : la porte de l''administration (attendu : UPDATE 1)'
begin;
update public.users set type = 'pro' where id = :B;
rollback;

\echo '--- C23. …le VRAI TITULAIRE la récupère par sa demande : l''administration ACCEPTE après le retrait, et lève le gel (attendu : t | acceptee | pro | 1 identité active, chez T | 0 gelée)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_retirer_entreprise(:S, 'Squatteur signalé par le vrai titulaire.') is not null as retiree;
select x ->> 'statut' as statut
  from public.admin_traiter_demande_pro(:'DEM_T', 'accepter', null) x;
reset role;
select u.type as type_de_t,
       (select count(*) from public.entreprise_registre
         where siren = '000000240' and retiree_le is null and pro_id = :T) as active_chez_t,
       (select count(*) from public.entreprise_registre
         where siren = '000000240' and gele) as gelees
  from public.users u where u.id = :T;
rollback;

\echo '--- C24. une demande pour UN numéro, puis un passage pro avec UN AUTRE : la demande est ANNULÉE, pas « acceptée » (attendu : annulee | « Compte ouvert avec une autre entreprise (SIREN 000000216) … »)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.demandes_pro (compte_id, siret, motif) values (:B, '00000023200017', 'introuvable');
select (public.devenir_pro('{"siret":"00000021600010"}'::jsonb)) is not null as devenu_pro;
reset role;
select statut, note from public.demandes_pro where compte_id = :B;
rollback;

\echo '--- C25. compléter ou annuler SA demande ne rend pas l''administrateur, ni l''export RGPD (attendu : f | f | f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :C;
select public.completer_ma_demande_pro('{"message":"bonjour"}'::jsonb) ? 'traitee_par' as complete_le_rend,
       public.annuler_ma_demande_pro() ? 'traitee_par' as annule_le_rend,
       (public.mes_donnees() -> 'demandes_pro' -> 0) ? 'traitee_par' as export_le_rend;
rollback;

\echo '--- C26. LE JOURNAL D''UNE DEMANDE DE MÉTIERS ne garde que l''état, même après le départ de l''artisan (attendu : {statut} | {statut} | la note de l''administration | f — le motif libre de l''artisan est parti)'
begin;
insert into public.metier_demandes (professional_id, metiers_actuels, metiers_voulus, motif)
  values (:VIEUX, array['macon'], array['macon', 'couvreur'],
          'TEXTE-PERSONNEL-DU-PRO : je refais aussi les toits de mon voisin');
select id as "DEM_METIER" from public.metier_demandes where professional_id = :VIEUX \gset
set local role authenticated;
set local request.jwt.claim.sub = :ADMIN;
select public.admin_traiter_metier_demande(:'DEM_METIER', 'refusee',
  'Couvreur demande une décennale à votre nom.');
reset role;
delete from auth.users where id = :VIEUX;
select (select array_agg(k order by k) from jsonb_object_keys(avant) k) as cles_avant,
       (select array_agg(k order by k) from jsonb_object_keys(apres) k) as cles_apres,
       motif,
       (avant::text || apres::text) like '%TEXTE-PERSONNEL%' as garde_le_texte_du_pro
  from public.journal_admin where cible_id = :'DEM_METIER';
rollback;

-- --------------------------------------------------------------------------
--  Ménage : la base ressort comme elle est entrée.
-- --------------------------------------------------------------------------
\set QUIET on
delete from public.administrateurs where user_id = :ADMIN;
delete from auth.users where id::text like 'a4500000-0000-4000-8000-%';
delete from public.preuves_siret where siret like '0000002%';
\set QUIET off

\echo ''
\echo '--- FIN. Ménage fait (attendu : 0 | 0 | 0)'
select (select count(*) from auth.users where id::text like 'a4500000-0000-4000-8000-%') as comptes,
       (select count(*) from public.preuves_siret where siret like '0000002%')           as preuves,
       (select count(*) from public.demandes_pro)                                        as demandes;
