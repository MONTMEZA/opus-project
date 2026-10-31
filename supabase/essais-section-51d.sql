-- ==========================================================================
--  ESSAIS DU LOT S-d — ce que chacun lit des autres : les lectures, les
--  droits, l'export (30/10/2026)
--
--  À rejouer sur un PostgreSQL NEUF, après local-prelude.sql et schema.sql
--  (deux fois) :
--
--    psql -d opus -v ON_ERROR_STOP=0 -f supabase/essais-section-51d.sql
--
--  Méthode : celle de tous les essais du projet. Chaque cas est dans son
--  propre `begin … rollback` ; le rôle et l'identité se posent par
--  `set local`, chacun dans son propre ordre, JAMAIS dans un bloc `do` (une
--  politique RLS n'y est pas appliquée). Un ordre qui doit échouer est le
--  DERNIER de sa transaction. Les relectures rendent des valeurs nommées
--  d'après ce qu'elles prouvent ; l'annonce de chaque cas dit l'attendu.
--
--  « avant le lot » : mesuré en jouant les mêmes ordres sur le schéma du
--  commit 0b01d1b (juste avant S-d) — la critique adverse et les
--  reproductions du 30/10.
--
--  ÉTAPE M1d : ce fichier prouve l'état que `schema.sql` décrit aujourd'hui.
--  Les droits de colonne de `users` et des fiches pro (étape M2) s'y
--  ajouteront avec elle.
--
--  ORDRE : A. la donnée existe ; B. `users` et `profil_public()` ;
--  C. j'aime et abonnements ; D. les réponses aux demandes ; E. les droits
--  de table ; F. les signalements ; G. les conversations ; H. la
--  disponibilité aux urgences ; I. la fiche pro privée ; J. l'export ;
--  K. les notifications d'un compte qui part ; L. les fonctions ouvertes.
--
--  Les SIRET sont fictifs, à clé de contrôle juste (ceux de
--  essais-section-45.sql), les comptes sont préfixés a51d0000.
--
--    A  plombier ; B  électricien ; P  particulier, à Brest ;
--    Q  autre particulier, à Lille ; ADMIN  l'administration.
-- ==========================================================================

\set QUIET on
\pset pager off

\set ADMIN '''a51d0000-0000-4000-8000-0000000000ad'''
\set A     '''a51d0000-0000-4000-8000-00000000000a'''
\set B     '''a51d0000-0000-4000-8000-00000000000b'''
\set P     '''a51d0000-0000-4000-8000-000000000001'''
\set Q     '''a51d0000-0000-4000-8000-000000000002'''
\set PA    '''a51d0000-0000-4000-8000-0000000000a1'''
\set AN_A  '''a51d0000-0000-4000-8000-0000000000a6'''
\set DEM_P '''a51d0000-0000-4000-8000-0000000000d1'''
\set CONV  '''a51d0000-0000-4000-8000-0000000000c1'''
\set COM_Q '''a51d0000-0000-4000-8000-0000000000e1'''
\set COM_P '''a51d0000-0000-4000-8000-0000000000e2'''
\set CONV2 '''a51d0000-0000-4000-8000-0000000000c2'''
\set AN_B  '''a51d0000-0000-4000-8000-0000000000b6'''
\set MSG_A '''a51d0000-0000-4000-8000-0000000000f1'''

-- Ménage d'un passage précédent : le fichier se rejoue.
delete from public.administrateurs where user_id = :ADMIN;
-- Un signalement SURVIT au compte de son auteur (`auteur_id` passe à vide)
-- et `cible_auteur_id` n'a pas de clé étrangère : sans cette ligne, le
-- second passage retrouvait chez A le signalement du premier (relecture du
-- 31/10). Un essai est rejoué par psql : l'ordre `delete` y est permis.
delete from public.signalements
 where cible_auteur_id::text like 'a51d0000-0000-4000-8000-%'
    or cible_id::text like 'a51d0000-0000-4000-8000-%'
    or auteur_id::text like 'a51d0000-0000-4000-8000-%';
delete from auth.users where id::text like 'a51d0000-0000-4000-8000-%';
delete from public.preuves_siret where siret in ('00000024000010', '00000025700014');

insert into public.preuves_siret
  (siret, denomination, nom_complet_registre, est_ei, forme_juridique, ape, est_siege,
   adresse, code_postal, commune, code_insee, statut_diffusion, source, verifiee_le, expire_le)
values
  ('00000024000010', 'ENTREPRISE A ESSAI', 'ENTREPRISE A ESSAI', false, '5499', '43.22A', true,
   '1 RUE A', '29200', 'BREST', '29019', 'O', 'registre', now(), now() + interval '24 hours'),
  ('00000025700014', 'ENTREPRISE B ESSAI', 'ENTREPRISE B ESSAI', false, '5499', '43.21A', true,
   '2 RUE B', '29200', 'BREST', '29019', 'O', 'registre', now(), now() + interval '24 hours');

insert into auth.users (id, email, raw_user_meta_data) values
  (:ADMIN, 'admin51d@exemple-opus.test', '{"type":"particulier","nom":"Admin Opus","cgu":"2026-10-28"}'::jsonb),
  (:A, 'a51d@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan A', 'entreprise', 'Plomberie A', 'cgu', '2026-10-28',
                      'metiers', jsonb_build_array('plombier'), 'ville', 'Brest (29)',
                      'latitude', '48.3904', 'longitude', '-4.4861', 'siret', '00000024000010')),
  (:B, 'b51d@exemple-opus.test',
   jsonb_build_object('type', 'pro', 'nom', 'Artisan B', 'entreprise', 'Électricité B', 'cgu', '2026-10-28',
                      'metiers', jsonb_build_array('electricien'), 'ville', 'Brest (29)',
                      'siret', '00000025700014')),
  (:P, 'p51d@exemple-opus.test',
   '{"type":"particulier","nom":"Paule P.","ville":"Brest (29)","cgu":"2026-10-28"}'::jsonb),
  (:Q, 'q51d@exemple-opus.test',
   '{"type":"particulier","nom":"Quentin Q.","ville":"Lille (59)","cgu":"2026-10-28"}'::jsonb);
insert into public.administrateurs (user_id) values (:ADMIN);
update public.users set ville = 'Brest (29)', code_postal = '29200' where id = :P;
update public.users set ville = 'Lille (59)', code_postal = '59000' where id = :Q;
-- Un motif de refus, un RGE déclaré : ce que l'étape M2 fermera.
update public.professional_profiles
   set verification_note = 'Kbis illisible', rge_numero = 'RGE-0001'
 where id = :A;

-- Une publication de A, aimée par P et Q ; P suit A ; Q y commente.
insert into public.posts (id, author_id, type, texte) values (:PA, :A, 'texte', 'Publication de A');
insert into public.post_likes (post_id, user_id) values (:PA, :P), (:PA, :Q);
insert into public.follows (follower_id, following_id) values (:P, :A);
insert into public.saved_posts (post_id, user_id) values (:PA, :P);
insert into public.comments (id, post_id, author_id, texte) values (:COM_Q, :PA, :Q, 'Joli travail');
-- Une demande de P ; A et B y répondent.
insert into public.demandes (id, client_id, metier, ville, texte) values
  (:DEM_P, :P, 'plombier', 'Brest (29)', 'Fuite sous l évier');
insert into public.demande_reponses (demande_id, professional_id, message) values
  (:DEM_P, :A, 'Je peux passer demain'),
  (:DEM_P, :B, 'Je connais un plombier');
-- Une annonce de A ; B y répond.
insert into public.annonces_pro (id, auteur_id, type, titre, texte) values
  (:AN_A, :A, 'entraide', 'Annonce de A', 'Un coup de main');
insert into public.annonce_reponses (annonce_id, professional_id, message) values (:AN_A, :B, 'Dispo jeudi');
-- Une conversation P — A, un message de chaque côté.
insert into public.conversations (id, client_id, professional_id) values (:CONV, :P, :A);
insert into public.messages (conversation_id, sender_id, texte) values
  (:CONV, :P, 'Bonjour, c est pour la fuite');
insert into public.messages (id, conversation_id, sender_id, texte) values
  (:MSG_A, :CONV, :A, 'Je passe demain matin');
-- P répond au commentaire de Q : une réponse ADRESSÉE à Q.
insert into public.comments (id, post_id, author_id, parent_id, texte)
values (:COM_P, :PA, :P, :COM_Q, 'Merci Quentin');
-- DES DONNÉES QUI NE CONCERNENT PAS P (relecture du 30/10, RT10) : une
-- conversation A — B, une annonce de B à laquelle A répond, Q qui suit B.
-- Aucune ne doit apparaître dans l'export de P.
insert into public.conversations (id, client_id, professional_id) values (:CONV2, :A, :B);
insert into public.messages (conversation_id, sender_id, texte) values (:CONV2, :B, 'MESSAGE PRIVE B VERS A');
insert into public.annonces_pro (id, auteur_id, type, titre, texte) values
  (:AN_B, :B, 'entraide', 'Annonce de B', 'Un autre coup de main');
insert into public.annonce_reponses (annonce_id, professional_id, message) values (:AN_B, :A, 'REPONSE DE A A B');
insert into public.follows (follower_id, following_id) values (:Q, :B);
-- Un avis de P sur A.
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values (:A, :P, 4, 4, 4, 'Bon travail');
-- Un signalement de Q sur la publication de A, traité avec une note interne.
insert into public.signalements (auteur_id, cible_type, cible_id, cible_auteur_id, motif, extrait)
values (:Q, 'publication', :PA, :A, 'spam', 'Publication de A');
-- P signale le message que A lui a écrit (le geste de ConversationScreen).
insert into public.signalements (auteur_id, cible_type, cible_id, motif)
values (:P, 'message', :MSG_A, 'haine');
update public.signalements set statut = 'traite', traite_par = :ADMIN, note = 'déjà averti deux fois'
 where auteur_id = :Q;
-- A répond aux urgences de plomberie.
insert into public.sos_availability (professional_id, metier_key, actif, rayon_km, delai_minutes)
values (:A, 'plomberie', true, 20, 45);
-- Une notification déclenchée par Q (son commentaire) chez A, et une de
-- l'administration, sans acteur.
insert into public.notifications (user_id, type, texte, acteur_id, post_id)
values (:A, 'commentaire', 'Quentin Q. a commenté votre publication', :Q, :PA);
insert into public.notifications (user_id, type, texte)
values (:A, 'verification_acceptee', 'Votre badge est accordé');

\set QUIET off

-- ==========================================================================
\echo '=== 0. La donnée existe : 5 comptes, 2 j aime, 1 abonnement, 2 réponses, 1 conversation, 2 messages, 1 signalement, 1 dispo (attendu : 5 | 2 | 1 | 2 | 1 | 2 | 1 | 1)'
select (select count(*) from public.users where id::text like 'a51d0000-%') as comptes,
       (select count(*) from public.post_likes where post_id = :PA) as j_aime,
       (select count(*) from public.follows where follower_id = :P) as abonnements,
       (select count(*) from public.demande_reponses where demande_id = :DEM_P) as reponses,
       (select count(*) from public.conversations where id = :CONV) as conversations,
       (select count(*) from public.messages where conversation_id = :CONV) as messages,
       (select count(*) from public.signalements where auteur_id = :Q) as signalements,
       (select count(*) from public.sos_availability where professional_id = :A) as dispo;

-- ==========================================================================
--  B. `users` et `profil_public()`
-- ==========================================================================
\echo '--- B1. Un visiteur ne lit plus rien de `users` (attendu : ERROR permission denied for table users — avant : 5 lignes, ville et code postal compris)'
begin;
set local role anon;
select id, nom, ville, code_postal from public.users where id::text like 'a51d0000-%';
rollback;

\echo '--- B2. `anon` n a plus AUCUN droit sur `users`, ni de table ni de colonne ; `authenticated` lit encore `nom` (attendu : f | f | f | f | f | t)'
select has_table_privilege('anon', 'public.users', 'select') as anon_lit,
       has_table_privilege('anon', 'public.users', 'insert')
         or has_table_privilege('anon', 'public.users', 'update')
         or has_table_privilege('anon', 'public.users', 'delete') as anon_ecrit,
       has_column_privilege('anon', 'public.users', 'nom', 'select') as anon_nom,
       has_column_privilege('anon', 'public.users', 'ville', 'select') as anon_ville,
       has_any_column_privilege('anon', 'public.users', 'select') as anon_une_colonne,
       has_column_privilege('authenticated', 'public.users', 'nom', 'select') as connecte_nom;

\echo '--- B3. Un compte connecté lit le NOM d un autre (attendu : Quentin Q.)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select nom from public.users where id = :Q;
rollback;

\echo '--- B4. `profil_public()` : P sur lui-même (sa ville), P sur Q (pas de ville), A sur P (sa ville), B sur P (sa ville), P sur A (un pro : pas de ville de compte) (attendu : Brest (29) | null | Brest (29) | Brest (29) | null)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select (select ville from public.profil_public(:P)) as p_sur_p,
       (select coalesce(ville, 'null') from public.profil_public(:Q)) as p_sur_q;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select (select ville from public.profil_public(:P)) as a_sur_p;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000b';
select (select ville from public.profil_public(:P)) as b_sur_p;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select (select coalesce(ville, 'null') from public.profil_public(:A)) as p_sur_a,
       (select type from public.profil_public(:A)) as type_de_a;
rollback;

\echo '--- B5. Un blocage, dans un sens ou dans l autre, retire la ville au pro (attendu : null | null)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select coalesce((select ville from public.profil_public(:P)), 'null') as p_a_bloque_a;
rollback;
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :P);
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select coalesce((select ville from public.profil_public(:P)), 'null') as a_a_bloque_p;
rollback;

\echo '--- B6. … et la fonction rend : ni code postal, ni date d inscription (attendu : id, nom, avatar_url, type, ville)'
select string_agg(a, ', ' order by o) as colonnes
  from unnest((select proargnames from pg_proc where proname = 'profil_public' and pronamespace = 'public'::regnamespace))
       with ordinality as t(a, o)
 where o > 1;

\echo '--- B7. Un visiteur ne peut pas l appeler (attendu : ERROR permission denied for function profil_public)'
begin;
set local role anon;
select * from public.profil_public('a51d0000-0000-4000-8000-000000000001');
rollback;

\echo '--- B8. Un particulier enregistre toujours son profil (attendu : UPDATE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
update public.users set nom = 'Paule P.', ville = 'Brest (29)', code_postal = '29200' where id = :P;
rollback;

-- ==========================================================================
--  C. J'aime et abonnements — décision du 30/10 : soi seulement
-- ==========================================================================
\echo '--- C1. Q ne lit plus les j aime de P, ni les abonnements de P ; P lit les siens (attendu : 0 | 0 | 1 | 1 — avant : 1 | 1 | 1 | 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select (select count(*) from public.post_likes where user_id = :P) as q_lit_jaime_de_p,
       (select count(*) from public.follows where follower_id = :P) as q_lit_abonnements_de_p;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select (select count(*) from public.post_likes where user_id = :P) as p_lit_ses_jaime,
       (select count(*) from public.follows where follower_id = :P) as p_lit_ses_abonnements;
rollback;

\echo '--- C2. Un visiteur ne lit AUCUNE ligne, sans erreur (attendu : 0 | 0 — avant : 2 | 1)'
begin;
set local role anon;
select (select count(*) from public.post_likes) as visiteur_jaime,
       (select count(*) from public.follows) as visiteur_abonnements;
rollback;

\echo '--- C3. … et le fil marche toujours pour un visiteur : `fil_filtre()` nomme `follows` (attendu : t, sans erreur)'
begin;
set local role anon;
select count(*) >= 1 as fil_du_visiteur from public.fil_filtre();
rollback;

\echo '--- C4. L onglet « Abonnements » de P contient la publication de A ; les nombres restent justes (attendu : t | 2 | 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select exists (select 1 from public.fil_filtre(p_abonnements => true) f where f.id = :PA) as abonnement_de_p,
       (select likes_count from public.posts where id = :PA) as likes_count,
       (select followers_count from public.professional_profiles where id = :A) as followers_count;
rollback;

\echo '--- C5. `anon` garde la LECTURE de ces deux tables (la politique ne lui rend rien), plus l écriture (attendu : t | t | f | f)'
select has_table_privilege('anon', 'public.post_likes', 'select') as anon_lit_jaime,
       has_table_privilege('anon', 'public.follows', 'select') as anon_lit_follows,
       has_table_privilege('anon', 'public.post_likes', 'insert')
         or has_table_privilege('anon', 'public.post_likes', 'update')
         or has_table_privilege('anon', 'public.post_likes', 'delete') as anon_ecrit_jaime,
       has_table_privilege('anon', 'public.follows', 'insert')
         or has_table_privilege('anon', 'public.follows', 'update')
         or has_table_privilege('anon', 'public.follows', 'delete') as anon_ecrit_follows;

\echo '--- C6. Aimer et retirer passent toujours (attendu : INSERT 0 1 puis DELETE 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000b';
insert into public.post_likes (post_id, user_id) values (:PA, :B);
delete from public.post_likes where post_id = :PA and user_id = :B;
rollback;

-- ==========================================================================
--  D. Les réponses aux demandes — entre leurs deux parties
-- ==========================================================================
\echo '--- D1. Q (particulier, pas l auteur) ne lit aucune réponse (attendu : 0 — avant : 2)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select count(*) as q_lit from public.demande_reponses where demande_id = :DEM_P;
rollback;

\echo '--- D2. B (pro qui a répondu) ne lit que la SIENNE (attendu : 1 — avant : 2)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000b';
select count(*) as b_lit from public.demande_reponses where demande_id = :DEM_P;
rollback;

\echo '--- D3. P (l auteur) lit les deux (attendu : 2)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select count(*) as p_lit from public.demande_reponses where demande_id = :DEM_P;
rollback;

\echo '--- D4. P a bloqué A : il lit toujours les deux ; A a bloqué P : idem (attendu : 2 | 2 — avant : 1 | 1)'
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select count(*) as p_a_bloque_a from public.demande_reponses where demande_id = :DEM_P;
rollback;
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :P);
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select count(*) as a_a_bloque_p from public.demande_reponses where demande_id = :DEM_P;
rollback;

-- ==========================================================================
--  E. Les droits de table que la RLS ne tient pas
-- ==========================================================================
\echo '--- E1. Aucune table de public n accorde TRUNCATE, REFERENCES ni TRIGGER à anon ni à authenticated (attendu : 0 — avant : plusieurs centaines)'
select count(*) as droits_restants
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join (values ('anon'), ('authenticated')) r(role)
  cross join (values ('truncate'), ('references'), ('trigger')) d(droit)
 where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')
   and has_table_privilege(r.role, c.oid, d.droit);

\echo '--- E2. Une table créée APRÈS naît sans eux, et garde la lecture (attendu : f | f | f | t)'
begin;
create table public.t_essai_51d (x int);
select has_table_privilege('anon', 'public.t_essai_51d', 'truncate') as truncate_naissant,
       has_table_privilege('authenticated', 'public.t_essai_51d', 'trigger') as trigger_naissant,
       has_table_privilege('authenticated', 'public.t_essai_51d', 'references') as references_naissant,
       has_table_privilege('authenticated', 'public.t_essai_51d', 'select') as lecture_naissante;
rollback;

\echo '--- E3. TRUNCATE refusé à un compte connecté (attendu : ERROR permission denied for table clients — avant : TRUNCATE TABLE)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
truncate public.clients;
rollback;

-- ==========================================================================
--  F. Les signalements — ni l'administrateur, ni sa note
-- ==========================================================================
\echo '--- F1. L auteur lit son signalement (attendu : 1 | traite)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select count(*) as lus, max(statut) as statut from public.signalements;
rollback;

\echo '--- F2. … mais plus la note (attendu : ERROR permission denied for table signalements — avant : déjà averti deux fois)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select note from public.signalements;
rollback;

\echo '--- F3. … ni l administrateur (attendu : ERROR permission denied for table signalements — avant : son identifiant)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select traite_par from public.signalements;
rollback;

\echo '--- F4. Signaler passe toujours (attendu : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
insert into public.signalements (auteur_id, cible_type, cible_id, cible_auteur_id, motif)
values (:P, 'publication', :PA, :A, 'spam');
rollback;

-- ==========================================================================
--  G. Une conversation a toujours un professionnel — décision du 30/10
-- ==========================================================================
\echo '--- G1. P (particulier) ouvre une conversation avec Q en se mettant « professionnel » (attendu : ERROR new row violates row-level security policy — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
insert into public.conversations (client_id, professional_id) values (:Q, :P);
rollback;

\echo '--- G2. … ni dans l autre sens (attendu : ERROR new row violates row-level security policy — avant : INSERT 0 1, une SECONDE conversation)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
insert into public.conversations (client_id, professional_id) values (:P, :Q);
rollback;

\echo '--- G3. Un particulier écrit à un pro, un pro à un particulier, un pro à un pro : inchangés (attendu : INSERT 0 1 ×3)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.conversations (client_id, professional_id) values (:Q, :A);
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000b';
insert into public.conversations (client_id, professional_id) values (:Q, :B);
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000b';
insert into public.conversations (client_id, professional_id) values (:B, :A);
rollback;

-- ==========================================================================
--  H. La disponibilité aux urgences — plus sans compte
-- ==========================================================================
\echo '--- H1. Un visiteur ne la lit plus (attendu : ERROR permission denied for table sos_availability — avant : 1 ligne)'
begin;
set local role anon;
select professional_id, actif from public.sos_availability;
rollback;

\echo '--- H2. Un particulier connecté la lit (attendu : 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select (select count(*) from public.sos_availability where professional_id = :A) as p_lit;
rollback;

-- ==========================================================================
--  I. La fiche pro privée — `ma_fiche_pro()` et l'administration
-- ==========================================================================
\echo '--- I1. A lit SA fiche entière, motif de refus et RGE compris ; P n en reçoit aucune (attendu : 1 | Kbis illisible | RGE-0001 | 0)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select count(*) as a_lit, max(verification_note) as note, max(rge_numero) as rge from public.ma_fiche_pro();
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select count(*) as p_recoit from public.ma_fiche_pro();
rollback;

\echo '--- I2. L administration lit l état des fiches (attendu : 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-0000000000ad';
select count(*) as admin_lit from public.admin_etat_des_fiches(array[:A]::uuid[]);
rollback;

\echo '--- I3. … un particulier non (attendu : ERROR … réservé à l administration)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select * from public.admin_etat_des_fiches(array[:A]::uuid[]);
rollback;

-- ==========================================================================
--  J. L'export
-- ==========================================================================
\echo '--- J1. Les clés de l export, en LISTE FERMÉE (attendu : 48 | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
with e as (select public.mes_donnees() as j)
select (select count(*) from jsonb_object_keys(e.j)) as nb_cles,
       (select array_agg(k order by k) from jsonb_object_keys(e.j) k)
         = array['abonnements', 'annonces', 'avis_laisses', 'avis_recus', 'chantiers', 'clients_de_mon_entreprise',
                 'commentaires', 'commentaires_recus', 'compte', 'conversations', 'decisions_de_l_administration', 'demandes',
                 'demandes_de_devis', 'demandes_pro', 'devis_emis', 'devis_lignes', 'devis_tva',
                 'entreprise_registre', 'export_du', 'fiche_professionnelle', 'journal_ia',
                 'limites_de_l_export', 'ma_base_de_postes', 'ma_disponibilite_urgences',
                 'mes_assurances_professionnelles', 'mes_demandes_de_metier', 'mes_j_aime',
                 'mes_notifications', 'mes_remontees', 'mes_specialites_proposees', 'mes_tarifs',
                 'messages', 'messages_recus', 'metadonnees_d_inscription', 'mon_entreprise',
                 'mon_numero_de_tva', 'partenariats', 'personnes_bloquees', 'publications',
                 'publications_enregistrees', 'publications_vues', 'rappels', 'reponses_que_j_ai_ecrites',
                 'reponses_recues_a_mes_annonces', 'reponses_recues_a_mes_demandes',
                 'signalements_deposes', 'signalements_visant_mes_contenus', 'urgences']::text[] as liste_fermee,
       e.j ? 'messages_recus_total' is false as total_pas_en_tete
  from e;
rollback;

\echo '--- J1 bis. Les clés de la partie SANS MASQUAGE, en liste fermée — elle est appelable seule par `rpc/mes_donnees_sans_masquage` ; et chaque partie bornée dit son total, ses lignes rendues et celles écartées, rien d autre (attendu : 15 | t | t)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
with e as (select public.mes_donnees_sans_masquage() as j)
select (select count(*) from jsonb_object_keys(e.j)) as nb_cles,
       (select array_agg(k order by k) from jsonb_object_keys(e.j) k)
         = array['avis_recus', 'commentaires_recus', 'conversations', 'decisions_de_l_administration',
                 'demandes_de_devis', 'limites', 'mes_notifications', 'messages', 'messages_recus',
                 'metadonnees_d_inscription', 'rappels', 'reponses_recues_a_mes_annonces',
                 'reponses_recues_a_mes_demandes', 'signalements_visant_mes_contenus', 'urgences']::text[] as liste_fermee,
       (select bool_and((select array_agg(c order by c) from jsonb_object_keys(v) c)
                        = array['ecartees', 'rendus', 'total']::text[])
          from jsonb_each(e.j -> 'limites') l(k, v)) as limites_fermees
  from e;
rollback;

\echo '--- J1 ter. LA TAILLE D UNE LIGNE COMPTE TOUTES SES COLONNES DE LONGUEUR VARIABLE — relu dans le CATALOGUE : pour chaque partie bornée, les colonnes que `octet_length(z.…)` compte sont exactement celles de la table (ou de la liste choisie) dont la longueur n est pas fixe (attendu : 10 | 0 — avant : 10 parties, 4 incomplètes)'
with corps as (
  select p.prosrc from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.proname = 'mes_donnees_sans_masquage'),
parties(nom, tbl) as (values
  ('recus_messages', 'messages'), ('recus_commentaires', 'comments'),
  ('recus_reponses_annonces', 'annonce_reponses'), ('recus_reponses_demandes', 'demande_reponses'),
  ('recus_avis', 'reviews'), ('recus_signalements', 'signalements'),
  ('recus_devis', 'quote_requests'), ('recus_rappels', 'callback_requests'),
  ('mes_notifications', 'notifications'), ('recus_urgences', 'sos_requests')),
morceau as (
  select pa.nom, pa.tbl,
         substring(c.prosrc from '  ' || pa.nom || ' as materialized \((.*?)limit 5000\)') as txt
    from parties pa cross join corps c),
comptees as (
  select m.nom, array(select x[1] from regexp_matches(m.txt, 'octet_length\(z\.(\w+)\)', 'g') x order by 1) as cols
    from morceau m),
choisies as (
  -- la sélection la plus intérieure (pas celle de `z`, qui mesure) :
  -- `select m.*` = toute la table ; sinon la liste écrite (`select g.id, …`)
  select m.nom, m.tbl,
         case when m.txt ~ 'from \(select (?!z\.)\w\.\*' then null
              else array(select y[1] from regexp_matches(
                     substring(m.txt from 'from \(select ((?!z\.)\w\.\w+(?:, \w\.\w+)*)'), '\w\.(\w+)', 'g') y) end as liste
    from morceau m),
attendues as (
  select ch.nom,
         array(select a.attname::text
                 from pg_attribute a
                 join pg_type t on t.oid = a.atttypid
                where a.attrelid = ('public.' || ch.tbl)::regclass
                  and a.attnum > 0 and not a.attisdropped
                  and t.typlen = -1 and t.typname <> 'numeric'
                  and (ch.liste is null or a.attname::text = any(ch.liste))
                order by 1) as cols
    from choisies ch)
select count(*) as parties,
       count(*) filter (where co.cols is distinct from at.cols) as incompletes
  from comptees co join attendues at using (nom);

\echo '--- J2. L export de P : ses j aime, ses enregistrements, ses messages, les reçus, la conversation, les deux réponses, ses informations d inscription (attendu : 1 | 1 | 1 | 1 | 1 | 2 | Brest (29))'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'mes_j_aime') as j_aime,
       jsonb_array_length(e.j -> 'publications_enregistrees') as enregistrees,
       jsonb_array_length(e.j -> 'messages') as messages,
       jsonb_array_length(e.j -> 'messages_recus') as recus,
       jsonb_array_length(e.j -> 'conversations') as conversations,
       jsonb_array_length(e.j -> 'reponses_recues_a_mes_demandes') as reponses,
       e.j -> 'metadonnees_d_inscription' ->> 'ville' as inscription
  from e;
rollback;

\echo '--- J3. L export de A : la réponse à son annonce, l avis reçu, sa réponse écrite, le signalement qui le vise — sans son auteur, ses détails ni la note — et sa fiche entière (attendu : 1 | 1 | 1 | 1 | f | f | f | Kbis illisible)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'reponses_recues_a_mes_annonces') as reponses_annonce,
       jsonb_array_length(e.j -> 'avis_recus') as avis_recus,
       jsonb_array_length(e.j -> 'reponses_que_j_ai_ecrites' -> 'demandes') as ses_reponses,
       jsonb_array_length(e.j -> 'signalements_visant_mes_contenus') as signalements_le_visant,
       (e.j -> 'signalements_visant_mes_contenus' -> 0) ? 'auteur_id' as auteur_rendu,
       (e.j -> 'signalements_visant_mes_contenus' -> 0) ? 'details' as details_rendus,
       (e.j -> 'signalements_visant_mes_contenus' -> 0) ? 'note' as note_rendue,
       e.j -> 'fiche_professionnelle' ->> 'verification_note' as fiche
  from e;
rollback;

\echo '--- J4. L export de Q : son signalement, sans la note ni l administrateur, ni l auteur ni l extrait que la BASE a relevés sur ce qu il vise (attendu : 1 | f | f | f | f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'signalements_deposes') as deposes,
       (e.j -> 'signalements_deposes' -> 0) ? 'note' as note_rendue,
       (e.j -> 'signalements_deposes' -> 0) ? 'traite_par' as admin_rendu,
       (e.j -> 'signalements_deposes' -> 0) ? 'cible_auteur_id' as auteur_releve_rendu,
       (e.j -> 'signalements_deposes' -> 0) ? 'extrait' as extrait_rendu
  from e;
rollback;

\echo '--- J5. Aucune clé de l export ne porte `admin_id`, `traite_par` ni `admin_supprime` (attendu : f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select public.mes_donnees()::text ~ '"(admin_id|traite_par|admin_supprime)"' as identite_admin;
rollback;

\echo '--- J6. Les décisions de l administration sur SA fiche, sans l administrateur (attendu : t | f)'
begin;
-- une décision passée par l'administration sur la fiche de A
insert into public.journal_admin (admin_id, action, cible_type, cible_id, avant, apres, motif)
values (:ADMIN, 'pro_refuse', 'profil_pro', :A, '{}'::jsonb, '{}'::jsonb, 'Kbis illisible');
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'decisions_de_l_administration') = 1 as une_decision,
       (e.j -> 'decisions_de_l_administration' -> 0) ? 'admin_id' as admin_rendu
  from e;
rollback;

\echo '--- J7. UN BLOCAGE NE FAIT RIEN DISPARAÎTRE DE L EXPORT — dans un sens puis dans l autre, aucune clé de P, de A ni de Q ne RACCOURCIT (`personnes_bloquees`, elle, s allonge) (attendu : 0 | 0 | 0 | 0 | 0 | 0 — avant : P perdait son message, A la réponse de B à son annonce)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select public.mes_donnees() as p_avant \gset
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select public.mes_donnees() as a_avant \gset
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select public.mes_donnees() as q_avant \gset
rollback;
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :P), (:B, :A), (:A, :Q);
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select count(*) as p_cles_raccourcies
  from jsonb_each(public.mes_donnees()) apres
  join jsonb_each(:'p_avant'::jsonb) avant using (key)
 where jsonb_typeof(avant.value) = 'array'
   and jsonb_array_length(apres.value) < jsonb_array_length(avant.value);
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select count(*) as a_cles_raccourcies
  from jsonb_each(public.mes_donnees()) apres
  join jsonb_each(:'a_avant'::jsonb) avant using (key)
 where jsonb_typeof(avant.value) = 'array'
   and jsonb_array_length(apres.value) < jsonb_array_length(avant.value);
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select count(*) as q_cles_raccourcies
  from jsonb_each(public.mes_donnees()) apres
  join jsonb_each(:'q_avant'::jsonb) avant using (key)
 where jsonb_typeof(avant.value) = 'array'
   and jsonb_array_length(apres.value) < jsonb_array_length(avant.value);
rollback;
begin;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A), (:A, :B), (:Q, :A);
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select count(*) as p_cles_raccourcies_2
  from jsonb_each(public.mes_donnees()) apres
  join jsonb_each(:'p_avant'::jsonb) avant using (key)
 where jsonb_typeof(avant.value) = 'array'
   and jsonb_array_length(apres.value) < jsonb_array_length(avant.value);
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select count(*) as a_cles_raccourcies_2
  from jsonb_each(public.mes_donnees()) apres
  join jsonb_each(:'a_avant'::jsonb) avant using (key)
 where jsonb_typeof(avant.value) = 'array'
   and jsonb_array_length(apres.value) < jsonb_array_length(avant.value);
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select count(*) as q_cles_raccourcies_2
  from jsonb_each(public.mes_donnees()) apres
  join jsonb_each(:'q_avant'::jsonb) avant using (key)
 where jsonb_typeof(avant.value) = 'array'
   and jsonb_array_length(apres.value) < jsonb_array_length(avant.value);
rollback;

\echo '--- J8. UN TIERS NE FAIT PAS ÉCHOUER L EXPORT D UN AUTRE — A inonde la conversation de 300 000 messages ; l export de P passe sous le délai de 8 s de la vraie base, borné et le disant (attendu : 5000 | 300001 | 5000 | 1 — avant : 2,4 s pour l export actuel, plus de 8 s pour les reçus)'
begin;
insert into public.messages (conversation_id, sender_id, texte)
  select :CONV, :A, 'message ' || g from generate_series(1, 300000) g;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
set local statement_timeout = '8s';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'messages_recus') as recus_rendus,
       e.j -> 'limites_de_l_export' -> 'messages_recus' ->> 'total' as recus_total,
       e.j -> 'limites_de_l_export' -> 'messages_recus' ->> 'rendus' as limite_rendus,
       jsonb_array_length(e.j -> 'messages') as ses_messages
  from e;
rollback;

\echo '--- J9. Un visiteur ne peut appeler ni l export ni sa partie sans masquage (attendu : ERROR permission denied for function mes_donnees_sans_masquage)'
begin;
set local role anon;
select public.mes_donnees_sans_masquage();
rollback;

\echo '--- J9 bis. … ni l export lui-même (attendu : ERROR permission denied for function mes_donnees)'
begin;
set local role anon;
select public.mes_donnees();
rollback;

\echo '--- J10. UN SIGNALEMENT NE S INVENTE PLUS (relecture du 30/10) — Q signale la demande de P en désignant A et un texte de son choix : la base relève l auteur et l extrait VRAIS (attendu : P | Fuite sous l évier — avant : A | texte inventé)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.signalements (auteur_id, cible_type, cible_id, cible_auteur_id, motif, extrait)
values (:Q, 'demande', :DEM_P, :A, 'spam', 'Texte inventé par Q');
reset role;
select case cible_auteur_id when :P then 'P' when :A then 'A' else 'autre' end as auteur_releve, extrait
  from public.signalements where auteur_id = :Q and cible_type = 'demande';
rollback;

\echo '--- J10 sexies. SIGNALER N EST PAS UN MOYEN DE LIRE (relecture du 31/10) — Q ne lit pas la demande de P ; il la signale, puis ne retrouve son texte ni dans son export, ni dans sa ligne (attendu : 0 | f puis ERROR permission denied for table signalements — avant : 0 | t puis P | Fuite sous l évier)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.signalements (auteur_id, cible_type, cible_id, motif)
values (:Q, 'demande', :DEM_P, 'spam');
select (select count(*) from public.demandes where id = :DEM_P) as demande_lisible,
       position('Fuite sous l' in public.mes_donnees()::text) > 0 as texte_dans_son_export;
select cible_auteur_id, extrait from public.signalements where auteur_id = :Q and cible_type = 'demande';
rollback;

\echo '--- J10 septies. On ne signale qu en SON nom, et le refus est le même que la conversation soit la sienne ou non : Q au nom de P (une partie), puis au nom de B (attendu : ERROR OP026, deux fois — avant : ERROR row-level security, puis OP026)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.signalements (auteur_id, cible_type, cible_id, motif)
values (:P, 'message', :MSG_A, 'spam');
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.signalements (auteur_id, cible_type, cible_id, motif)
values (:B, 'message', :MSG_A, 'spam');
rollback;

\echo '--- J10 bis. Une cible inventée est refusée (attendu : ERROR OP026 — avant : INSERT 0 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.signalements (auteur_id, cible_type, cible_id, cible_auteur_id, motif, extrait)
values (:Q, 'publication', gen_random_uuid(), :P, 'spam', 'Texte inventé');
rollback;

\echo '--- J10 ter. Q ne signale pas un message d une conversation où il n est pas (attendu : ERROR OP026)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.signalements (auteur_id, cible_type, cible_id, motif)
values (:Q, 'message', :MSG_A, 'haine');
rollback;

\echo '--- J10 quater. … et A ne signale pas son PROPRE message (attendu : ERROR OP026)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
insert into public.signalements (auteur_id, cible_type, cible_id, motif)
values (:A, 'message', :MSG_A, 'haine');
rollback;

\echo '--- J10 quinquies. Une précision de plus de 1 000 caractères est refusée (attendu : ERROR signalements_details_check)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.signalements (auteur_id, cible_type, cible_id, motif, details)
values (:Q, 'commentaire', :COM_P, 'spam', repeat('x', 1001));
rollback;

\echo '--- J11. LE SIGNALEMENT D UN MESSAGE N ENTRE PAS DANS L EXPORT DE SON AUTEUR : dans une conversation à deux, il dirait qui l a déposé (attendu : 0 | 1 | 1 — avant : 1)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
with e as (select public.mes_donnees() as j)
select (select count(*) from jsonb_array_elements(e.j -> 'signalements_visant_mes_contenus') x
         where x ->> 'cible_type' = 'message') as messages_signales_rendus,
       jsonb_array_length(e.j -> 'signalements_visant_mes_contenus') as autres_rendus,
       (e.j -> 'limites_de_l_export' -> 'signalements_visant_mes_contenus' ->> 'total')::int as total_dit
  from e;
rollback;

\echo '--- J12. LA BORNE EST AUSSI EN TAILLE — A écrit 5 000 messages de 56 ko : l export de P passe, borné à 10 Mo, et le dit (attendu : t | 5001 | t | t — avant : ERROR total size of jsonb array elements exceeds the maximum)'
begin;
insert into public.messages (conversation_id, sender_id, texte)
  select :CONV, :A, repeat('x', 56000) || g from generate_series(1, 5000) g;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
set local statement_timeout = '8s';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'messages_recus') between 100 and 200 as rendus_dans_10_mo,
       (e.j -> 'limites_de_l_export' -> 'messages_recus' ->> 'total')::int as total,
       (e.j -> 'limites_de_l_export' -> 'messages_recus' ->> 'rendus')::int
         = jsonb_array_length(e.j -> 'messages_recus') as rendus_dits,
       octet_length(e.j::text) < 20000000 as export_sous_20_mo
  from e;
rollback;

\echo '--- J12 bis. LA TAILLE EST CELLE DE LA LIGNE ENTIÈRE (relecture du 31/10) — A écrit 5 000 messages au texte court mais à la pièce jointe de 60 ko (`piece_url`, une colonne qu on ne comptait pas) : l export de P passe, borné à 10 Mo (attendu : t | t | t — avant : ERROR total size of jsonb array elements exceeds the maximum)'
begin;
insert into public.messages (conversation_id, sender_id, texte, piece_url, piece_type)
  select :CONV, :A, 'x', repeat('y', 60000) || g, 'image/jpeg' from generate_series(1, 5000) g;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
set local statement_timeout = '8s';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'messages_recus') between 100 and 200 as rendus_dans_10_mo,
       (e.j -> 'limites_de_l_export' -> 'messages_recus' ->> 'rendus')::int
         = jsonb_array_length(e.j -> 'messages_recus') as rendus_dits,
       octet_length(e.j::text) < 20000000 as export_sous_20_mo
  from e;
rollback;

\echo '--- J12 ter. … de même pour 5 000 demandes de devis au BUDGET de 60 ko, et 5 000 rappels au NUMÉRO de 60 ko : l export de A passe (attendu : t | t | t — avant : ERROR total size of jsonb array elements exceeds the maximum)'
begin;
insert into public.quote_requests (client_id, professional_id, nom, telephone, description, budget, statut)
  select :P, :A, 'Paule P.', '0639980000', 'demande', repeat('b', 60000) || g, 'en_attente' from generate_series(1, 5000) g;
insert into public.callback_requests (client_id, professional_id, nom, telephone, statut)
  select :P, :A, 'Paule P.', repeat('6', 60000) || g, 'en_attente' from generate_series(1, 5000) g;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
set local statement_timeout = '8s';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'demandes_de_devis') between 50 and 120 as devis_dans_5_mo,
       jsonb_array_length(e.j -> 'rappels') between 20 and 50 as rappels_dans_2_mo,
       octet_length(e.j::text) < 20000000 as export_sous_20_mo
  from e;
rollback;

\echo '--- J12 quater. UNE LIGNE ÉNORME EN TÊTE NE VIDE PLUS LA PARTIE (relecture du 31/10) — Q écrit sous la publication de A un commentaire de 6 Mo, puis prend un nom de 3 Mo et commente encore : chez A, les autres commentaires et notifications restent, la ligne énorme est écartée et comptée (attendu : t | 1 | t | t | 1 — avant : 0 commentaire rendu, 0 notification rendue)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
insert into public.comments (post_id, author_id, texte) values (:PA, :Q, repeat('z', 6000000));
update public.users set nom = repeat('N', 3000000) where id = :Q;
insert into public.comments (post_id, author_id, texte) values (:PA, :Q, 'coucou');
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
with e as (select public.mes_donnees() as j)
select position('Joli travail' in (e.j -> 'commentaires_recus')::text) > 0 as autres_commentaires_rendus,
       (e.j -> 'limites_de_l_export' -> 'commentaires_recus' ->> 'ecartees')::int as commentaires_ecartes,
       position('Votre badge est accord' in (e.j -> 'mes_notifications')::text) > 0 as autres_notifications_rendues,
       (e.j -> 'limites_de_l_export' -> 'mes_notifications' ->> 'rendus')::int
         = jsonb_array_length(e.j -> 'mes_notifications') as rendues_dites,
       (e.j -> 'limites_de_l_export' -> 'mes_notifications' ->> 'ecartees')::int as notifications_ecartees
  from e;
rollback;

\echo '--- J13. Un particulier qui inonde un artisan de 50 000 demandes de devis ne fait pas échouer son export : ses demandes REÇUES sont bornées, celles de P à lui-même restent (attendu : 5000 | 50001 | 5000 — avant : délai dépassé à 200 000)'
begin;
insert into public.quote_requests (client_id, professional_id, nom, telephone, description, statut)
  select :P, :A, 'Paule P.', '0639980000', 'demande ' || g, 'en_attente' from generate_series(1, 50000) g;
insert into public.quote_requests (client_id, professional_id, nom, telephone, description, statut)
  values (:P, :A, 'Paule P.', '0639980000', 'une de plus', 'en_attente');
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
set local statement_timeout = '8s';
with e as (select public.mes_donnees() as j)
select jsonb_array_length(e.j -> 'demandes_de_devis') as rendues,
       (e.j -> 'limites_de_l_export' -> 'demandes_de_devis_recues' ->> 'total')::int as total,
       (e.j -> 'limites_de_l_export' -> 'demandes_de_devis_recues' ->> 'rendus')::int as rendus
  from e;
rollback;

\echo '--- J14. RIEN DE CE QUI NE CONCERNE PAS P N EST DANS SON EXPORT, ni dans sa partie sans masquage : la conversation A — B, la réponse de A à l annonce de B, l abonnement de Q (attendu : f | f | f | f | f)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
with e as (select public.mes_donnees()::text as t, public.mes_donnees_sans_masquage()::text as s)
select position('MESSAGE PRIVE B VERS A' in e.t) > 0 as message_etranger,
       position('REPONSE DE A A B' in e.t) > 0 as reponse_etrangere,
       position('a51d0000-0000-4000-8000-0000000000c2' in e.t) > 0 as conversation_etrangere,
       position('MESSAGE PRIVE B VERS A' in e.s) > 0 or position('REPONSE DE A A B' in e.s) > 0 as sans_masquage_etranger,
       (select count(*) from jsonb_array_elements(public.mes_donnees() -> 'abonnements') x
         where x ->> 'follower_id' <> 'a51d0000-0000-4000-8000-000000000001') > 0 as abonnement_etranger
  from e;
rollback;

\echo '--- J14 bis. NI QUI VOUS A BLOQUÉ, NI QUI VOUS SUIT, NI QUI VOUS A SIGNALÉ — trois comptes DÉDIÉS, qui n ont rien d autre à voir avec P ni avec A : R bloque P, F suit A, S signale la publication de A ; leur identifiant n est nulle part dans le texte ENTIER des deux exports, sans masquage compris (attendu : f | f | f | f | f | f | 1 — la dernière colonne prouve que le signalement de S est bien chez A)'
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('a51d0000-0000-4000-8000-0000000000b9', 'r51d@exemple-opus.test', '{"type":"particulier","nom":"Rémi R.","cgu":"2026-10-28"}'::jsonb),
  ('a51d0000-0000-4000-8000-0000000000ba', 'f51d@exemple-opus.test', '{"type":"particulier","nom":"Fanny F.","cgu":"2026-10-28"}'::jsonb),
  ('a51d0000-0000-4000-8000-0000000000bb', 's51d@exemple-opus.test', '{"type":"particulier","nom":"Serge S.","cgu":"2026-10-28"}'::jsonb);
insert into public.blocages (bloqueur_id, bloque_id) values ('a51d0000-0000-4000-8000-0000000000b9', :P);
insert into public.follows (follower_id, following_id) values ('a51d0000-0000-4000-8000-0000000000ba', :A);
insert into public.signalements (auteur_id, cible_type, cible_id, motif, details)
values ('a51d0000-0000-4000-8000-0000000000bb', 'publication', :PA, 'arnaque', 'PRECISION ECRITE PAR S');
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
with e as (select public.mes_donnees()::text as t, public.mes_donnees_sans_masquage()::text as s)
select position('a51d0000-0000-4000-8000-0000000000b9' in e.t) > 0 as p_voit_qui_la_bloque,
       position('a51d0000-0000-4000-8000-0000000000b9' in e.s) > 0 as p_le_voit_sans_masquage
  from e \gset j14b_
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
with e as (select public.mes_donnees()::text as t, public.mes_donnees_sans_masquage()::text as s,
                  public.mes_donnees() as j)
select :'j14b_p_voit_qui_la_bloque'::boolean as p_voit_qui_la_bloque,
       :'j14b_p_le_voit_sans_masquage'::boolean as p_le_voit_sans_masquage,
       position('a51d0000-0000-4000-8000-0000000000ba' in e.t) > 0
         or position('a51d0000-0000-4000-8000-0000000000ba' in e.s) > 0 as a_voit_qui_le_suit,
       position('a51d0000-0000-4000-8000-0000000000bb' in e.t) > 0 as a_voit_qui_l_a_signale,
       position('a51d0000-0000-4000-8000-0000000000bb' in e.s) > 0 as a_le_voit_sans_masquage,
       position('PRECISION ECRITE PAR S' in e.t) > 0 or position('PRECISION ECRITE PAR S' in e.s) > 0
         as a_lit_ce_que_s_a_ecrit,
       (select count(*) from jsonb_array_elements(e.j -> 'signalements_visant_mes_contenus') x
         where x ->> 'motif' = 'arnaque') as signalement_de_s_rendu
  from e;
rollback;

\echo '--- J15. CE QU ON VOUS ÉCRIT EST DANS VOTRE EXPORT : A reçoit le commentaire de Q sous sa publication, Q la réponse de P à son commentaire — et une réponse à une RÉPONSE, rangée sous la racine du fil, va à celui qui a parlé AVANT elle, comme sa notification ; ce qui précède sa participation, non (attendu : t | t | 3 | 3 | t | f | 1 — avant : P ne recevait pas la réponse de B)'
begin;
-- B répond dans le fil de Q AVANT la réponse de P (date posée à la main :
-- l'éditeur SQL écrit la sienne), puis répond à la réponse de P.
insert into public.comments (post_id, author_id, parent_id, texte, created_at)
select :PA, :B, :COM_Q, 'REPONSE DE B AVANT P', k.created_at - interval '1 minute'
  from public.comments k where k.id = :COM_P;
insert into public.comments (post_id, author_id, parent_id, texte)
values (:PA, :B, :COM_P, 'REPONSE DE B A P');
set local role authenticated;
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-00000000000a';
select position('Joli travail' in (public.mes_donnees() -> 'commentaires_recus')::text) > 0 as a_recoit_q \gset
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000001';
select position('REPONSE DE B A P' in (public.mes_donnees() -> 'commentaires_recus')::text) > 0 as p_recoit_b,
       position('REPONSE DE B AVANT P' in (public.mes_donnees() -> 'commentaires_recus')::text) > 0 as p_recoit_avant,
       (public.mes_donnees() -> 'limites_de_l_export' -> 'commentaires_recus' ->> 'total')::int as total_p \gset
set local request.jwt.claim.sub = 'a51d0000-0000-4000-8000-000000000002';
select :'a_recoit_q'::boolean as a_recoit_q,
       position('Merci Quentin' in (public.mes_donnees() -> 'commentaires_recus')::text) > 0 as q_recoit_p,
       (public.mes_donnees() -> 'limites_de_l_export' -> 'commentaires_recus' ->> 'total')::int as total_q,
       jsonb_array_length(public.mes_donnees() -> 'commentaires_recus') as rendus_q,
       :'p_recoit_b'::boolean as p_recoit_b,
       :'p_recoit_avant'::boolean as p_recoit_avant,
       :'total_p'::int as total_p;
rollback;

-- ==========================================================================
--  K. Les notifications d'un compte qui part — décision du 30/10
-- ==========================================================================
\echo '--- K1. Q part : sa notification chez A part avec lui, celle de l administration reste (attendu : 0 | 1 — avant : 1 | 1, avec son nom dans le texte)'
begin;
delete from auth.users where id = :Q;
select (select count(*) from public.notifications where user_id = :A and texte like 'Quentin Q.%') as de_q,
       (select count(*) from public.notifications where user_id = :A and acteur_id is null) as de_l_administration;
rollback;

\echo '--- K2. La clé est bien en cascade (attendu : c)'
select confdeltype from pg_constraint where conname = 'notifications_acteur_id_fkey';

-- ==========================================================================
--  L. Les fonctions ouvertes, et ce qu'elles nomment
-- ==========================================================================
\echo '--- L1. Aucune fonction INVOKER exécutable par un visiteur ne nomme une table qu un visiteur ne peut plus lire (attendu : aucune ligne — sinon elle tomberait sur « permission denied »)'
select p.proname as fonction, c.relname as table_nommee
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  cross join pg_class c
  join pg_namespace nc on nc.oid = c.relnamespace
 where n.nspname = 'public' and nc.nspname = 'public'
   and c.relkind in ('r', 'p', 'v', 'm')
   and not p.prosecdef
   and p.prorettype <> 'pg_catalog.trigger'::regtype
   and has_function_privilege('anon', p.oid, 'execute')
   and not has_table_privilege('anon', c.oid, 'select')
   and p.prosrc ~* ('public\.' || c.relname || '\M')
 order by 1, 2;

\echo '--- L2. Les quatre fonctions du lot : definer, appelables par un compte connecté, jamais par un visiteur (attendu : 4 | 4 | 0)'
select count(*) filter (where p.prosecdef) as definer,
       count(*) filter (where has_function_privilege('authenticated', p.oid, 'execute')) as connecte,
       count(*) filter (where has_function_privilege('anon', p.oid, 'execute')) as visiteur
  from pg_proc p
 where p.pronamespace = 'public'::regnamespace
   and p.proname in ('profil_public', 'ma_fiche_pro', 'admin_etat_des_fiches', 'mes_donnees_sans_masquage');

\echo '--- L3. Le déclencheur des signalements : definer, appelable par PERSONNE ; et un compte connecté ne lit ni `cible_auteur_id` ni `extrait` (attendu : t | f | f | f | f)'
select p.prosecdef as definer,
       has_function_privilege('authenticated', p.oid, 'execute') as connecte,
       has_function_privilege('anon', p.oid, 'execute') as visiteur,
       has_column_privilege('authenticated', 'public.signalements', 'cible_auteur_id', 'select') as lit_l_auteur,
       has_column_privilege('authenticated', 'public.signalements', 'extrait', 'select') as lit_l_extrait
  from pg_proc p
 where p.pronamespace = 'public'::regnamespace and p.proname = 'tient_le_signalement';

-- Ménage.
\set QUIET on
delete from public.administrateurs where user_id = :ADMIN;
-- Un signalement SURVIT au compte de son auteur (`auteur_id` passe à vide)
-- et `cible_auteur_id` n'a pas de clé étrangère : sans cette ligne, le
-- second passage retrouvait chez A le signalement du premier (relecture du
-- 31/10). Un essai est rejoué par psql : l'ordre `delete` y est permis.
delete from public.signalements
 where cible_auteur_id::text like 'a51d0000-0000-4000-8000-%'
    or cible_id::text like 'a51d0000-0000-4000-8000-%'
    or auteur_id::text like 'a51d0000-0000-4000-8000-%';
delete from auth.users where id::text like 'a51d0000-0000-4000-8000-%';
delete from public.preuves_siret where siret in ('00000024000010', '00000025700014');
\set QUIET off
\echo 'FIN des essais du lot S-d (étape M1d)'
