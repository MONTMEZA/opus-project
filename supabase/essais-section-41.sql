-- ==========================================================================
--  ESSAIS DE LA SECTION 41 — le carnet de clients
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` et
--  `schema.sql` (rejoué deux fois) :
--
--      psql -h 127.0.0.1 -p 5444 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-41.sql
--
--  CINQ CAS ATTENDENT UNE ERREUR, et c'est le but : un essai de sécurité
--  qui ne montre aucun refus n'éprouve rien. Chaque ordre qui doit échouer
--  est le DERNIER de sa transaction — après une erreur, PostgreSQL abandonne
--  la transaction entière.
--
--  ET SURTOUT PAS DANS UN BLOC `do $$ … $$` : à l'intérieur, les politiques
--  RLS ne sont PAS appliquées (constaté le 01/10/2026), et un essai de
--  sécurité y passe au vert sans rien éprouver. `set local role` et
--  `set local request.jwt.claim.sub`, chacun dans son propre ordre.
-- ==========================================================================

\set A '''aaaa4100-0000-4000-8000-00000000aaaa'''
\set B '''bbbb4100-0000-4000-8000-00000000bbbb'''

-- Deux artisans, pour tout le fichier.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a4100@exemple-opus.test',jsonb_build_object('type','pro','nom','A Maconnerie','entreprise','A Maconnerie','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
 (:B,'b4100@exemple-opus.test',jsonb_build_object('type','pro','nom','B Couverture','entreprise','B Couverture','metiers',jsonb_build_array('couvreur'),'ville','Aix (13)'));
commit;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. A ecrit une fiche client, et le declencheur la nettoie ==='
-- Blancs -> null, e-mail en minuscules, SIRET sans ses espaces.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, type, nom, siret, telephone, email, adresse, code_postal, ville, notes)
values (:A, 'entreprise', '  SCI du Moulin  ', '123 456 789 00012', '  06 12 34 56 78 ',
        '  Contact@SCI-Moulin.FR ', ' 4 rue des Lilas ', ' 13410 ', ' Lambesc ', '   ');
reset role;
select nom, siret, telephone, email, adresse, code_postal, ville,
       (notes is null) as notes_vidées, archive, type
  from public.clients where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. Un PARTICULIER perd son SIRET, sans un mot ==='
-- On supprime le defaut au lieu de le refuser : le numero ne veut plus rien
-- dire. L ecran le vide aussi, pour que ca se VOIE.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, type, nom, siret)
values (:A, 'particulier', 'Mme Dupont', '12345678900012');
reset role;
select nom, type, (siret is null) as siret_vidé from public.clients where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. …et le changement de type le vide AUSSI ==='
-- C est le cas qui compte : on a saisi une entreprise, on se corrige.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, type, nom, siret)
values (:A, 'entreprise', 'Martin SARL', '12345678900012');
select siret as avant from public.clients where pro_id = :A;
update public.clients set type = 'particulier' where pro_id = :A;
reset role;
select type, (siret is null) as siret_vidé from public.clients where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. DEUX Martin differents sont acceptes ==='
-- Pas d index unique sur le nom : un nom de client est une IDENTITE, pas
-- une etiquette. Dans un village il y a souvent trois Martin.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, nom) values (:A, 'Martin'), (:A, 'Martin');
reset role;
select count(*) as deux_martin_attendu_2 from public.clients where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. `modifie_le` est posee par la BASE ==='
-- Une date envoyee par le client est ignoree : l horloge d un telephone
-- peut mentir, et c est le seul service que rend cette colonne.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, nom, modifie_le)
values (:A, 'Client Daté', '2001-01-01T00:00:00Z');
reset role;
select (modifie_le > '2020-01-01'::timestamptz) as date_du_client_ignorée
  from public.clients where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. B ne LIT RIEN du carnet de A ==='
-- Et le cas 1 prouve d abord que la donnee EXISTE : sans lui, ce « 0 »
-- serait le bon resultat pour la mauvaise raison (lecon du 04/10).
-- --------------------------------------------------------------------------
begin;
insert into public.clients (pro_id, nom, telephone) values (:A, 'Mme Martin', '0612345678');
select count(*) as vraiment_en_base_attendu_1 from public.clients where pro_id = :A;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select count(*) as ce_que_B_lit_attendu_0 from public.clients;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. …et un VISITEUR sans compte est REFUSE, pas juste a zero ==='
-- DEUX GARDES, et la seconde est meilleure que la premiere :
--   1. AUCUNE politique pour `anon` — ce n est pas une vitrine, et le motif
--      a deux politiques de la section 18 n a rien a faire ici. Seul, il
--      rendrait « 0 ligne » ;
--   2. AUCUN droit de table (section 41.2 bis) — et la, c est un REFUS.
--
-- La seconde protege ce que la premiere laisserait passer le jour ou
-- quelqu un ajoute une politique `anon` « pour afficher quelque chose ».
-- C est la lecon de la section 18.2, ecrite le matin meme.
-- --------------------------------------------------------------------------
begin;
insert into public.clients (pro_id, nom) values (:A, 'Mme Martin');
select count(*) as vraiment_en_base_attendu_1 from public.clients where pro_id = :A;
set local role anon;
select count(*) from public.clients;      -- 42501 attendu
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. B ne peut pas ECRIRE dans le carnet de A ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.clients (pro_id, nom) values (:A, 'Client vole');   -- 42501 attendu
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. Un nom vide est refuse ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, nom) values (:A, '   ');            -- 23514 attendu
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. Un SIRET de trois chiffres est refuse ==='
-- Le declencheur a deja retire les espaces : ce qui reste doit faire 9 ou
-- 14 chiffres. L ecran le dit AVANT d envoyer ; ceci est le garde-fou.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, type, nom, siret)
values (:A, 'entreprise', 'Bidon', '123');                              -- 23514 attendu
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. Un code postal qui n en est pas un est refuse ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, nom, code_postal) values (:A, 'Bidon', '1341');  -- 23514 attendu
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 12. Une adresse qui ne PEUT PAS etre un e-mail est refusee ==='
-- On refuse ce qui ne peut pas etre une adresse ; on ne pretend pas prouver
-- qu elle existe. La seule preuve, c est qu un message y arrive.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, nom, email) values (:A, 'Bidon', 'pas-une-adresse'); -- 23514 attendu
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 13. A supprime une fiche de SON carnet — c est son droit ==='
-- `for all` ouvre bien la porte du `delete`, et ici c est JUSTE : une faute
-- de frappe doit pouvoir partir, et un client qui demande a etre oublie
-- doit pouvoir l etre. Rien ici n engage un tiers (contrairement a un avis).
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.clients (pro_id, nom) values (:A, 'Faute de frappe');
delete from public.clients where pro_id = :A;
reset role;
select count(*) as apres_suppression_attendu_0 from public.clients where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 14. B ne supprime pas une fiche de A ==='
-- --------------------------------------------------------------------------
begin;
insert into public.clients (pro_id, nom) values (:A, 'Mme Martin');
set local role authenticated;
set local request.jwt.claim.sub = :B;
delete from public.clients;
reset role;
select count(*) as toujours_la_attendu_1 from public.clients where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 15. L EXPORT RGPD contient le carnet ==='
-- Pas au titre de l article 15 — ces lignes ne me concernent pas — mais de
-- l article 28.3.g : mon sous-traitant doit me RENDRE mes donnees.
-- --------------------------------------------------------------------------
begin;
insert into public.clients (pro_id, nom) values (:A, 'Mme Martin');
set local role authenticated;
set local request.jwt.claim.sub = :A;
select (public.mes_donnees() ? 'clients_de_mon_entreprise') as la_clé_existe,
       jsonb_array_length(public.mes_donnees()->'clients_de_mon_entreprise') as combien;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 16. Le compte part, le carnet part avec lui ==='
-- Par la cascade : clients -> professional_profiles -> users. Rien a
-- ajouter dans `preparer_suppression_compte()`.
-- --------------------------------------------------------------------------
begin;
insert into public.clients (pro_id, nom) values (:A, 'Mme Martin');
set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.preparer_suppression_compte() is not null as compte_prepare;
reset role;
select count(*) as carnet_restant_attendu_0 from public.clients where pro_id = :A;
rollback;


-- Le menage du jeu d essai.
begin;
delete from auth.users where id in (:A, :B);
commit;

\echo ''
\echo '############ FIN DES ESSAIS DE LA SECTION 41 ############'
