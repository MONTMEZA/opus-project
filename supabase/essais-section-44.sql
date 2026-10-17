-- ==========================================================================
--  ESSAIS DE LA SECTION 44 — être un professionnel ne se décide pas soi-même
--
--  À rejouer sur un PostgreSQL neuf, après local-prelude.sql et schema.sql
--  (deux fois) :
--
--    psql -d opus -f supabase/essais-section-44.sql
--
--  Chaque cas vit dans son `begin … rollback` et JAMAIS dans un bloc `do` :
--  une politique RLS n'y est pas appliquée (CLAUDE.md, 01/10/2026). Le rôle
--  et l'identité se posent par `set local`, chacun dans son propre ordre.
--
--  Les refus attendus s'affichent en `ERROR` avec leur code : il faut les
--  LIRE. Un `grep '^ERROR'` ne les voit pas — psql préfixe chaque ligne par
--  le nom du fichier.
--
--  ORDRE DU FICHIER, et il n'est pas décoratif :
--    A. on prouve d'abord que la donnée EXISTE et que la lecture MARCHE.
--       Sans ça, un « 0 demande lue » prouverait seulement qu'il n'y avait
--       rien à lire — le défaut des essais de la section 29 ;
--    B. on prouve que le trou est fermé ;
--    C. on prouve que le chemin légitime passe toujours. Un verrou qui
--       refuse aussi les vrais artisans n'est pas un verrou, c'est une panne.
-- ==========================================================================

\set QUIET on
\pset pager off

-- --------------------------------------------------------------------------
--  LA PREUVE DU RÉPERTOIRE — depuis la section 45 (15/10/2026), un compte
--  pro ne naît qu'avec une preuve FRAÎCHE pour son SIRET. On la pose ici en
--  superutilisateur, comme la fonction Edge `siret` la poserait, sur un SIRET
--  FICTIF à clé juste que le répertoire Sirene ne connaît pas (vérifié : 0
--  résultat). Sans elle, chaque compte pro de ce fichier serait refusé
--  (OP006), et les cas suivants ne prouveraient plus rien.
-- --------------------------------------------------------------------------
insert into public.preuves_siret (siret, denomination, source, expire_le) values
  ('00000011700010', 'ESSAIS 44 — VRAI PRO', 'registre', now() + interval '1 hour'),
  ('00000012500013', 'ESSAIS 44 — C10', 'registre', now() + interval '1 hour')
on conflict (siret) do update set expire_le = excluded.expire_le;

-- Le jeu d'essai : créé comme GoTrue le crée, par auth.users, donc par
-- `cree_fiche_utilisateur()`. Un vrai pro, un particulier, et une demande.
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-00000000000a', 'vraipro@essai.test',
   '{"type":"pro","siret":"00000011700010","nom":"Vrai Maçon","entreprise":"Maçonnerie Vraie","metiers":["macon"],"ville":"Lambesc"}'::jsonb),
  ('b0000000-0000-0000-0000-00000000000b', 'particulier@essai.test',
   '{"type":"particulier","nom":"Julie","ville":"Lambesc"}'::jsonb),
  ('c0000000-0000-0000-0000-00000000000c', 'dupont@essai.test',
   '{"type":"particulier","nom":"Monsieur Dupont","ville":"Charleval"}'::jsonb)
  on conflict do nothing;

insert into public.demandes (client_id, metier, ville, texte)
  select 'c0000000-0000-0000-0000-00000000000c', 'macon', 'Charleval',
         'Fissure dans mon mur porteur côté jardin, je suis inquiet'
  where not exists (select 1 from public.demandes
                    where client_id = 'c0000000-0000-0000-0000-00000000000c');
\set QUIET off

\echo ''
\echo '##### A. LA DONNÉE EXISTE, ET LA LECTURE MARCHE #####'

\echo '--- A1. le vrai pro a bien été créé PAR LE DÉCLENCHEUR, avec sa fiche (attendu : pro | t)'
select u.type, exists (select 1 from public.professional_profiles p where p.id = u.id) as a_une_fiche
  from public.users u where u.id = 'a0000000-0000-0000-0000-00000000000a';

\echo '--- A2. le particulier n''a PAS de fiche (attendu : particulier | f)'
select u.type, exists (select 1 from public.professional_profiles p where p.id = u.id) as a_une_fiche
  from public.users u where u.id = 'b0000000-0000-0000-0000-00000000000b';

\echo '--- A3. le VRAI pro lit la demande de Monsieur Dupont (attendu : 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select count(*) as demandes_lues_par_le_vrai_pro from public.demandes;
rollback;

\echo ''
\echo '##### B. LE TROU EST FERMÉ — chaque porte du 12/10, une par une #####'

\echo '--- B1. le particulier se déclare pro (attendu : ERROR OP004)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
update public.users set type = 'pro' where id = auth.uid();
rollback;

\echo '--- B2. il s''insère une fiche pro, comme le faisait ensureProProfile (attendu : ERROR OP010 — depuis la section 45 une fiche ne se crée plus depuis l''application ; c''était OP005)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
insert into public.professional_profiles (id, entreprise, metier, metiers, ville)
  values (auth.uid(), 'Pas une entreprise', 'macon', array['macon'], 'Lambesc');
rollback;

\echo '--- B3. MÊME en passant par la porte du type d''abord, dans la même transaction (attendu : ERROR OP004, rien d''autre ne part)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
update public.users set type = 'pro' where id = auth.uid();
insert into public.professional_profiles (id, entreprise, metier, metiers, ville)
  values (auth.uid(), 'Pas une entreprise', 'macon', array['macon'], 'Lambesc');
rollback;

\echo '--- B4. donc est_un_pro() reste FAUX (attendu : f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select public.est_un_pro() as est_un_pro;
rollback;

\echo '--- B5. il ne lit PAS la demande de Monsieur Dupont (attendu : 0 — et A3 prouve qu''il y avait 1 demande à lire)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select count(*) as demandes_lues_par_le_particulier from public.demandes;
rollback;

\echo '--- B6. il publie dans le fil (attendu : ERROR row-level security)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
insert into public.posts (author_id, type, texte) values (auth.uid(), 'texte', 'Je ne suis pas artisan');
rollback;

\echo '--- B7. il ouvre un carnet de clients (attendu : ERROR row-level security)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
insert into public.clients (pro_id, type, nom) values (auth.uid(), 'particulier', 'Client inventé');
rollback;

\echo '--- B8. il crée un chantier public (attendu : ERROR row-level security)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
insert into public.chantiers (pro_id, titre) values (auth.uid(), 'Chantier inventé');
rollback;

\echo '--- B9. il pose une annonce dans la Place des pros (attendu : ERROR row-level security)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
insert into public.annonces_pro (auteur_id, type, titre, texte)
  values (auth.uid(), 'entraide', 'Annonce inventée', 'Je ne suis pas artisan');
rollback;

\echo '--- B10. LA SECONDE PORTE : il efface ses données, recrée sa ligne en pro (attendu : t, puis ERROR OP004)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select public.preparer_suppression_compte() is not null as donnees_effacees;
insert into public.users (id, type, nom) values (auth.uid(), 'pro', 'Revenu en pro');
rollback;

\echo '--- B11. …et la fiche qui suivait n''a plus de compte pro où naître (attendu : t, INSERT 0 1, ERROR OP010 — c''était OP005)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select public.preparer_suppression_compte() is not null as donnees_effacees;
insert into public.users (id, nom) values (auth.uid(), 'Revenu en particulier');
insert into public.professional_profiles (id, entreprise, metier, metiers, ville)
  values (auth.uid(), 'Fausse entreprise', 'macon', array['macon'], 'Lambesc');
rollback;

\echo ''
\echo '##### C. LE CHEMIN LÉGITIME PASSE TOUJOURS #####'

\echo '--- C1. le vrai pro publie (attendu : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
insert into public.posts (author_id, type, texte) values (auth.uid(), 'texte', 'Chantier terminé à Lambesc');
rollback;

\echo '--- C2. il pose une annonce (attendu : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
insert into public.annonces_pro (auteur_id, type, titre, texte)
  values (auth.uid(), 'entraide', 'Coup de main samedi', 'Besoin d''un bras pour couler une dalle');
rollback;

\echo '--- C3. il enregistre un client, et crée un chantier (attendu : INSERT 0 1, deux fois)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
insert into public.clients (pro_id, type, nom) values (auth.uid(), 'particulier', 'Mme Martin');
insert into public.chantiers (pro_id, titre) values (auth.uid(), 'Toiture Charleval');
rollback;

\echo '--- C4. il enregistre son profil en renvoyant son type INCHANGÉ, comme le fait l''application (attendu : UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
update public.users set type = 'pro', nom = 'Vrai Maçon SARL' where id = auth.uid();
rollback;

\echo '--- C5. mais il ne peut pas redevenir particulier tout seul (attendu : ERROR OP004)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
update public.users set type = 'particulier' where id = auth.uid();
rollback;

\echo '--- C6. il RETIRE une publication : la condition n''est que dans with check (attendu : DELETE 1)'
begin;
insert into public.posts (id, author_id, type, texte)
  values ('d0000000-0000-0000-0000-00000000000d', 'a0000000-0000-0000-0000-00000000000a', 'texte', 'À retirer');
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
delete from public.posts where id = 'd0000000-0000-0000-0000-00000000000d';
rollback;

\echo '--- C7. CHANGÉ PAR LA SECTION 45 : un compte pro resté SANS fiche ne se répare PLUS depuis l''application (attendu : pro | f, puis ERROR OP010 — c''était INSERT 0 1)'
begin;
-- Un compte inscrit en particulier (le déclencheur crée la ligne `users`,
-- pas de fiche), puis passé en pro par l'administration (auth.uid() vide) :
-- c'est la forme exacte d'un compte pro resté sans fiche.
--
-- `ensureProProfile` le réparait en relisant les métadonnées du compte —
-- que le client peut réécrire — et la fiche naissait SANS entreprise. Elle a
-- disparu avec la section 45 : une fiche ne naît plus que dans une fonction
-- de la base, qui exige une entreprise. Le seul compte de la vraie base dans
-- cet état est la session anonyme du 14/09, sans jeton valable : le
-- propriétaire la supprime dans Supabase → Authentication → Users.
insert into auth.users (id, email, raw_user_meta_data) values
  ('e0000000-0000-0000-0000-00000000000e', 'areparer@essai.test',
   '{"type":"particulier","nom":"Compte à réparer"}'::jsonb);
update public.users set type = 'pro' where id = 'e0000000-0000-0000-0000-00000000000e';
select type, exists (select 1 from public.professional_profiles p where p.id = u.id) as a_une_fiche
  from public.users u where u.id = 'e0000000-0000-0000-0000-00000000000e';
set local role authenticated;
set local request.jwt.claim.sub = 'e0000000-0000-0000-0000-00000000000e';
insert into public.professional_profiles (id, entreprise, metier, metiers, ville)
  values (auth.uid(), 'Réparée', 'macon', array['macon'], 'Lambesc')
  on conflict (id) do nothing;
rollback;

\echo '--- C8. l''éditeur SQL (auth.uid() vide) peut corriger un type : c''est la porte de l''administration (attendu : UPDATE 1)'
begin;
update public.users set type = 'pro' where id = 'b0000000-0000-0000-0000-00000000000b';
rollback;

\echo '--- C9. un vrai pro supprime son compte : la cascade passe (attendu : 0 ligne restante)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select public.preparer_suppression_compte();
reset role;
select count(*) as lignes_restantes from public.users where id = 'a0000000-0000-0000-0000-00000000000a';
rollback;

\echo '--- C10. une inscription en pro par GoTrue crée toujours les deux moitiés (attendu : pro | t)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('f0000000-0000-0000-0000-00000000000f', 'nouveaupro@essai.test',
   '{"type":"pro","siret":"00000012500013","nom":"Nouveau","entreprise":"Nouvelle Couverture","metiers":["couvreur"],"ville":"Aix-en-Provence"}'::jsonb);
select u.type, exists (select 1 from public.professional_profiles p where p.id = u.id) as a_une_fiche
  from public.users u where u.id = 'f0000000-0000-0000-0000-00000000000f';
rollback;

-- Le jeu d'essai part avec lui, PUIS les preuves : la base ressort comme
-- elle est entrée. Jusqu'au 17/10/2026, seules les preuves partaient — ce
-- commentaire l'affirmait quand même, et le fichier laissait trois comptes,
-- une fiche, une demande et l'identité d'entreprise du vrai pro (relecture
-- adverse). Par `auth.users`, comme ailleurs : la cascade emporte `users`,
-- la fiche, l'identité de l'entreprise et la demande de Monsieur Dupont.
\set QUIET on
delete from auth.users where id in ('a0000000-0000-0000-0000-00000000000a',
  'b0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000c');
delete from public.preuves_siret where siret in ('00000011700010', '00000012500013');
\set QUIET off
