-- ==========================================================================
--  ESSAIS — LE CHEMIN DE SORTIE D'UN COMPTE (section 18.2)
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` et
--  `schema.sql` (rejoué deux fois) :
--
--      psql -h 127.0.0.1 -p 5444 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-suppression-compte.sql
--
--  QUATRE CAS ATTENDENT UNE ERREUR. C'est le but : un essai de sécurité
--  qui ne montre aucun refus n'éprouve rien. Chaque ordre qui doit échouer
--  est le DERNIER de sa transaction — après une erreur, PostgreSQL abandonne
--  la transaction entière et tout ce qui suivrait répondrait « current
--  transaction is aborted », ce qui ressemble beaucoup à un second défaut.
--
--  ET SURTOUT PAS DANS UN BLOC `do $$ … $$` : à l'intérieur, les
--  politiques RLS ne sont pas appliquées, et un essai de sécurité y passe
--  au vert sans rien éprouver (constaté le 01/10/2026).
-- ==========================================================================

\set A '''aaaa3333-0000-4000-8000-00000000aaaa'''
\set B '''bbbb3333-0000-4000-8000-00000000bbbb'''
\set C '''cccc3333-0000-4000-8000-00000000cccc'''
\set POST '''dddd3333-0000-4000-8000-00000000dddd'''

-- --------------------------------------------------------------------------
--  LA PREUVE DU RÉPERTOIRE — depuis la section 45 (15/10/2026), un compte
--  pro ne naît qu'avec une preuve FRAÎCHE pour son SIRET. On la pose ici en
--  superutilisateur, comme la fonction Edge `siret` la poserait, sur un SIRET
--  FICTIF à clé juste que le répertoire Sirene ne connaît pas (vérifié : 0
--  résultat). Sans elle, chaque compte pro de ce fichier serait refusé
--  (OP006), et les cas suivants ne prouveraient plus rien.
-- --------------------------------------------------------------------------
insert into public.preuves_siret (siret, denomination, source, expire_le) values
  ('00000013300017', 'ESSAIS SUPPRESSION — A', 'registre', now() + interval '1 hour'),
  ('00000014100010', 'ESSAIS SUPPRESSION — C', 'registre', now() + interval '1 hour')
on conflict (siret) do update set expire_le = excluded.expire_le;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. LE DROIT : plus de delete ; un compte connecté lit toujours le nom (t), un visiteur plus rien depuis le lot S-d du 30/10/2026 (f) ; update intact ==='
-- Un droit de TABLE, et non une politique : une politique ne sait pas
-- distinguer « modifier ma ligne » de « supprimer ma ligne ».
-- --------------------------------------------------------------------------
select r.rolname,
       has_table_privilege(r.rolname,'public.users','delete')          as delete_attendu_false,
       has_column_privilege(r.rolname,'public.users','nom','select')   as lit_le_nom_anon_f_connecte_t,
       has_column_privilege(r.rolname,'public.users','email','select') as lit_l_email_attendu_false
  from (values ('anon'),('authenticated')) as r(rolname);

select has_column_privilege('authenticated','public.users','telephone','update')
         as l_artisan_enregistre_son_numero;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. LE RACCOURCI EST FERME : un pro ne supprime plus sa ligne ==='
-- Avant le 11/10/2026 cet ordre répondait « DELETE 1 » sans un mot.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :A, 'a@exemple-opus.test',
  jsonb_build_object('type','pro','siret','00000013300017','nom','A Maconnerie','entreprise','A Maconnerie',
                     'metiers', jsonb_build_array('macon'), 'ville','Marseille (13)'));
set local role authenticated;
set local request.jwt.claim.sub = :A;
delete from public.users where id = :A;   -- 42501 attendu
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. …et un visiteur sans compte non plus ==='
-- La politique l arreterait déjà (`auth.uid()` est vide). Un droit qui n a
-- aucune raison d exister ne doit pas attendre qu une politique le rattrape.
-- --------------------------------------------------------------------------
begin;
set local role anon;
delete from public.users;                 -- 42501 attendu
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. LE VRAI CHEMIN MARCHE TOUJOURS, et il ANONYMISE ==='
-- `preparer_suppression_compte()` est `security definer` : elle s exécute
-- avec les droits de son propriétaire, le `revoke` ne la touche pas.
-- Ce que le raccourci ne faisait PAS : poser `auteur_supprime`.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a@exemple-opus.test',jsonb_build_object('type','pro','siret','00000013300017','nom','A Maconnerie','entreprise','A Maconnerie','metiers',jsonb_build_array('macon'),'ville','Marseille (13)')),
 (:C,'c@exemple-opus.test',jsonb_build_object('type','pro','siret','00000014100010','nom','C Couverture','entreprise','C Couverture','metiers',jsonb_build_array('couvreur'),'ville','Aix (13)')),
 (:B,'b@exemple-opus.test',jsonb_build_object('type','particulier','nom','Client B'));
-- un avis RECU par A, un avis ECRIT par A sur C, un commentaire ECRIT par A
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
 values (:A,:B,1,1,1,'Chantier abandonne.'),
        (:C,:A,2,2,2,'Travail bacle, je deconseille.');
insert into public.posts (id, author_id, type, texte) values (:POST, :C, 'texte', 'Chantier du jour');
insert into public.comments (post_id, author_id, texte) values (:POST, :A, 'Ce prix me parait trop bas.');

set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.preparer_suppression_compte() as resume;
reset role;

select (select count(*) from public.users where id = :A)                 as ligne_users_attendu_0,
       (select count(*) from public.professional_profiles where id = :A) as fiche_attendu_0,
       (select commentaire from public.reviews where professional_id = :C) as avis_ecrit_par_lui_GARDE,
       (select auteur_supprime from public.reviews  where professional_id = :C) as avis_marque_attendu_t,
       (select auteur_supprime from public.comments where author_id is null)    as comm_marque_attendu_t,
       (select count(*) from public.reviews where professional_id = :A)   as avis_RECUS_attendu_0;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. CE QUE LE RACCOURCI LAISSAIT : un compte IRREPARABLE ==='
-- Sans ligne `public.users`, la réparation de la fiche (`ensureProProfile`,
-- appelée à chaque ouverture depuis le 05/10) échouait sur la clé étrangère.
-- Et `auth.users` reste : la session marche encore. Le compte ne peut donc
-- ni servir, ni se réparer, ni se supprimer par le chemin de l application.
--
-- CE QUE CE CAS MONTRE AUJOURD'HUI, et il faut le lire avec son histoire :
--   - le 11/10, l'insertion tombait sur 23503, la clé étrangère ;
--   - depuis la section 44 (15/10), elle tombait sur OP005 AVANT d'y
--     arriver — la ligne `users` absente rend un type vide. L'essai
--     annonçait toujours « 23503 attendu », et un contrôle qui cherchait ce
--     nombre dans ce fichier le trouvait… dans le commentaire ;
--   - depuis la section 45, elle tombe sur OP010 : une fiche ne se crée
--     plus du tout depuis l'application, et `ensureProProfile` a disparu.
-- Le compte laissé derrière n'a donc plus AUCUNE réparation possible depuis
-- l'application : c'est pour ça que le raccourci (cas 2) doit rester fermé.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :A, 'a@exemple-opus.test',
  jsonb_build_object('type','pro','siret','00000013300017','nom','A Maconnerie','entreprise','A Maconnerie',
                     'metiers', jsonb_build_array('macon'), 'ville','Marseille (13)'));
delete from public.users where id = :A;   -- en superutilisateur : on simule l etat laisse
select (select count(*) from auth.users where id = :A) as session_encore_valable_attendu_1;
set local role authenticated;
set local request.jwt.claim.sub = :A;
/* `entreprise`, `metier` ET `ville` sont `not null` : sans eux, l ordre
   échouerait sur UNE DE CES contraintes et l essai passerait pour la
   mauvaise raison — c est arrivé DEUX FOIS au premier jet (`metier`, puis
   `ville`). On veut voir OP010, le refus de toute fiche venue de
   l application, et rien d autre. */
\echo '    attendu : ERROR OP010, une fiche professionnelle ne se crée pas depuis l application'
insert into public.professional_profiles (id, entreprise, metier, ville)
  values (:A, 'A Maconnerie', 'macon', 'Marseille (13)');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. LA CASCADE DEPUIS auth.users MARCHE TOUJOURS ==='
-- C est par là que passent la fonction Edge `compte` (clé de service) et
-- l administration depuis Supabase → Authentication → Users. Le `revoke` ne
-- vise que `anon` et `authenticated`, pas le propriétaire de la table.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :A, 'a@exemple-opus.test',
  jsonb_build_object('type','pro','siret','00000013300017','nom','A Maconnerie','entreprise','A Maconnerie',
                     'metiers', jsonb_build_array('macon'), 'ville','Marseille (13)'));
delete from auth.users where id = :A;
select (select count(*) from public.users where id = :A)                 as ligne_users_attendu_0,
       (select count(*) from public.professional_profiles where id = :A) as fiche_attendu_0;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. ET MODIFIER SA LIGNE MARCHE ENCORE ==='
-- Le `revoke delete` ne doit pas avoir emporté l écriture : c est bien son
-- propre numéro qu un particulier enregistre.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :B, 'b@exemple-opus.test', jsonb_build_object('type','particulier','nom','Client B'));
set local role authenticated;
set local request.jwt.claim.sub = :B;
update public.users set telephone = '0600000000' where id = :B;
reset role;
select telephone as numero_enregistre from public.users where id = :B;
rollback;

-- Les preuves posées en tête de fichier partent avec lui : la base ressort
-- comme elle est entrée.
delete from public.preuves_siret where siret in ('00000013300017', '00000014100010');

\echo ''
\echo '############ FIN DES ESSAIS ############'
