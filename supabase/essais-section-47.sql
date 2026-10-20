-- ==========================================================================
--  ESSAIS DE LA SECTION 47 — les tarifs réunis : devis, fiche et SOS (lot T)
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` puis
--  `schema.sql` rejoué DEUX fois :
--
--      psql -h /tmp -p 5433 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-47.sql
--
--  LES SIRET DE CES ESSAIS SONT FICTIFS, et vérifiés. Ils ne servent qu'à
--  cette base d'essai, jamais à une inscription sur la vraie base. Leurs
--  SIREN (000047001, 000047100, 000047209) ont une clé de Luhn juste et ont
--  été cherchés au répertoire Sirene (recherche-entreprises.api.gouv.fr) le
--  20/10/2026 : aucun résultat. CLAUDE.md interdit le SIRET d'une vraie
--  entreprise, même pour un essai.
--
--  DES CAS ATTENDENT UNE ERREUR, et c'est le but : un essai de sécurité qui
--  ne montre aucun refus n'éprouve rien. psql préfixe chaque ligne d'erreur
--  par le nom du fichier et le numéro de ligne : un `grep '^ERROR'` ne les
--  voit pas.
--
--  TROIS RÈGLES, et aucune n'est décorative :
--
--   1. CHAQUE CAS EST DANS SON PROPRE `begin … rollback`, ET CONSTRUIT SON
--      PROPRE ÉTAT (`execute tarifs_a; execute affiche_a; execute sos_a;`).
--      Aucun cas ne dépend d'un autre : c'est ce qui garantit qu'un cas
--      « sur une ligne affichée » l'est vraiment.
--   2. CHAQUE « 0 » EST PRÉCÉDÉ, DANS LA MÊME TRANSACTION, DU « 1 » QUI LE
--      REND CRÉDIBLE : la donnée existe, le particulier la voit, puis on
--      bloque, on exclut ou on écrit, et on lit 0 (leçon du 04/10 : un essai
--      de sécurité prouve d'abord que la donnée EXISTE).
--   3. CHAQUE ORDRE QUI DOIT ÉCHOUER EST LE DERNIER DE SA TRANSACTION —
--      après une erreur, PostgreSQL abandonne la transaction entière. AUCUN
--      CAS DE RLS DANS UN BLOC `do $$ … $$` : à l'intérieur, les politiques
--      ne sont PAS appliquées (01/10/2026). `set local role` et
--      `set local request.jwt.claim.sub`, chacun dans son propre ordre.
--
--  ET LA RÈGLE DE CE LOT : toute LECTURE publique s'éprouve avec un
--  PARTICULIER (P), jamais avec l'artisan — le titulaire lit TOUJOURS sa
--  propre ligne, par « mes tarifs ». Toute NON-lecture par un concurrent
--  s'éprouve avec B, un AUTRE artisan, après que P a lu 1 dans la même
--  transaction (réponse du propriétaire du 19/10 : les tarifs affichés ne
--  sont lus que par les particuliers).
--
--  Le rattrapage de 47.2, lui, ne tourne qu'une fois : il s'éprouve à part,
--  sur la base que le propriétaire a réellement
--  (`essais-section-47-rattrapage.sql`).
-- ==========================================================================

\set A '''a4700000-0000-4000-8000-00000000000a'''
\set B '''a4700000-0000-4000-8000-00000000000b'''
\set P '''a4700000-0000-4000-8000-00000000000e'''

-- --------------------------------------------------------------------------
--  LE MÉNAGE DE TÊTE — le fichier se rejoue. Ceci se fait EN LOCAL, sous
--  psql : sur la vraie base, un compte d'essai se supprime par le chemin de
--  l'application (CLAUDE.md), et le connecteur n'est jamais concerné.
-- --------------------------------------------------------------------------
delete from auth.users where id::text like 'a4700000-%';

-- --------------------------------------------------------------------------
--  LES PREUVES DU RÉPERTOIRE — un compte pro ne naît qu'avec une preuve
--  FRAÎCHE pour son SIRET (section 45). SIRET FICTIFS à clé de Luhn juste,
--  propres à ce fichier, vérifiés inconnus du répertoire Sirene (INSEE) le
--  19/10/2026 : 0 résultat pour chaque SIREN et chaque SIRET.
--
--    A  plombier, à Brest — l'artisan dont on lit les tarifs ;
--    B  électricien concurrent — l'artisan qui ne doit RIEN lire de A ;
--    P  particulier, à un kilomètre de A — celui qui LIT.
-- --------------------------------------------------------------------------
insert into public.preuves_siret
  (siret, denomination, est_ei, forme_juridique, est_siege, tva, adresse, code_postal, commune,
   statut_diffusion, maj_insee, source, expire_le, pour_email) values
  ('00004700100011', 'ESSAIS 47 A', false, '5499', true, null,
   '1 RUE DE L ESSAI 29200 BREST', '29200', 'BREST', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00004710000011', 'ESSAIS 47 B', false, '5499', true, null,
   '2 RUE DE L ESSAI 29200 BREST', '29200', 'BREST', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null)
on conflict (siret) do update set expire_le = excluded.expire_le;

begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a4700@exemple-opus.test',jsonb_build_object('type','pro','siret','00004700100011','nom','A Essais',
   'entreprise','A Essais','metiers',jsonb_build_array('plombier'),'ville','Brest (29)',
   'latitude','48.3904','longitude','-4.4861')),
 (:B,'b4700@exemple-opus.test',jsonb_build_object('type','pro','siret','00004710000011','nom','B Essais',
   'entreprise','B Essais','metiers',jsonb_build_array('electricien'),'ville','Brest (29)',
   'latitude','48.3800','longitude','-4.5000')),
 (:P,'p4700@exemple-opus.test',jsonb_build_object('type','particulier','nom','P Essais','ville','Brest (29)',
   'latitude','48.4000','longitude','-4.4800'));
commit;

-- LES ÉTATS, écrits une fois ici et rejoués par chaque cas qui en a besoin.
prepare tarifs_a as
  insert into public.tarifs_pro (pro_id, frais_deplacement_centimes, taux_horaire_centimes,
                                 majoration_pct, affiche)
  values (:A, 4500, 6200, 40, false);
prepare affiche_a as
  update public.tarifs_pro set affiche = true where pro_id = :A;
prepare sos_a as
  insert into public.sos_availability (professional_id, metier_key, actif, rayon_km, delai_minutes)
  values (:A, 'plomberie', true, 20, 45);


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 0. La donnee EXISTE, et elle est AFFICHEE ==='
-- Sans ce cas, le « 0 » de B aux cas 5, 5 bis et 8 ter serait le bon
-- résultat pour la mauvaise raison.
-- --------------------------------------------------------------------------
select count(*) as fiches_pro_attendu_2 from public.professional_profiles where id::text like 'a4700000-%';
select metiers as a_metiers_plombier, latitude is not null and longitude is not null as a_situe_attendu_t
  from public.professional_profiles where id = :A;
begin;
execute tarifs_a;
execute affiche_a;
execute sos_a;
select (select count(*) from public.tarifs_pro where pro_id = :A) as tarifs_attendu_1,
       (select count(*) from public.tarifs_pro where pro_id = :A and affiche is true) as affichee_attendu_1,
       (select count(*) from public.sos_availability where professional_id = :A) as sos_attendu_1;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. Les six colonnes : toutes nullables, « affiche » eteint par defaut ==='
-- --------------------------------------------------------------------------
select column_name, data_type, is_nullable as nullable_attendu_yes, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'tarifs_pro'
   and column_name in ('taux_horaire_centimes', 'majoration_pct', 'decompte_temps_texte',
                       'prix_devis_centimes', 'affiche', 'affiche_le')
 order by ordinal_position;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2 a. Un taux a 0 -> tarif_taux_horaire_check (ERREUR attendue) ==='
-- Un taux horaire n'a pas de 0 : « 0 – 0 € » ne doit jamais sortir.
-- --------------------------------------------------------------------------
begin;
insert into public.tarifs_pro (pro_id, taux_horaire_centimes) values (:A, 0);
rollback;

\echo ''
\echo '=== 2 b. Un taux a 0,99 EUR -> tarif_taux_horaire_check (ERREUR attendue) ==='
begin;
insert into public.tarifs_pro (pro_id, taux_horaire_centimes) values (:A, 99);
rollback;

\echo ''
\echo '=== 2 c. Une majoration de 201 % -> tarif_majoration_check (ERREUR attendue) ==='
begin;
insert into public.tarifs_pro (pro_id, majoration_pct) values (:A, 201);
rollback;

\echo ''
\echo '=== 2 d. Un devis a -1 centime -> tarif_devis_check (ERREUR attendue) ==='
begin;
insert into public.tarifs_pro (pro_id, prix_devis_centimes) values (:A, -1);
rollback;

\echo ''
\echo '=== 2 e. Un decompte de 201 caracteres -> tarif_decompte_texte_check (ERREUR attendue) ==='
begin;
insert into public.tarifs_pro (pro_id, decompte_temps_texte) values (:A, repeat('x', 201));
rollback;

\echo ''
\echo '=== 2 f. Afficher SANS aucun tarif -> tarif_affiche_check (ERREUR attendue) ==='
-- Un bloc affiché n'est jamais vide.
begin;
insert into public.tarifs_pro (pro_id, affiche) values (:A, true);
rollback;

\echo ''
\echo '=== 2 g. Afficher avec la SEULE majoration -> tarif_affiche_check (ERREUR attendue) ==='
-- Une majoration modifie un taux : seule, elle ne dit pas un prix.
begin;
insert into public.tarifs_pro (pro_id, majoration_pct, affiche) values (:A, 40, true);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2 bis. Afficher des conditions seules, le seul devis gratuit, un taux seul : ca PASSE ==='
-- Un dépanneur au forfait doit pouvoir afficher ses frais et son prix de
-- devis sans taux horaire (relecture droit, I5).
-- --------------------------------------------------------------------------
begin;
insert into public.tarifs_pro (pro_id, frais_deplacement_texte, affiche)
values (:A, 'Gratuit jusqu’à 20 km, puis 0,50 € du kilomètre', true);
select count(*) as conditions_seules_attendu_1 from public.tarifs_pro where pro_id = :A and affiche;
rollback;
begin;
insert into public.tarifs_pro (pro_id, prix_devis_centimes, affiche) values (:A, 0, true);
select count(*) as devis_gratuit_seul_attendu_1 from public.tarifs_pro where pro_id = :A and affiche;
rollback;
begin;
insert into public.tarifs_pro (pro_id, taux_horaire_centimes, affiche) values (:A, 6200, true);
select count(*) as taux_seul_attendu_1 from public.tarifs_pro where pro_id = :A and affiche;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2 ter a. Un rayon de 0 km -> sos_rayon_check (ERREUR attendue) ==='
-- Un client modifié qui écrirait 100 000 km apparaîtrait dans la recherche
-- de tous les particuliers.
-- --------------------------------------------------------------------------
begin;
insert into public.sos_availability (professional_id, metier_key, actif, rayon_km) values (:A, 'plomberie', true, 0);
rollback;

\echo ''
\echo '=== 2 ter b. Un rayon de 201 km -> sos_rayon_check (ERREUR attendue) ==='
begin;
insert into public.sos_availability (professional_id, metier_key, actif, rayon_km) values (:A, 'plomberie', true, 201);
rollback;

\echo ''
\echo '=== 2 ter c. Un delai de 4 minutes -> sos_delai_check (ERREUR attendue) ==='
begin;
insert into public.sos_availability (professional_id, metier_key, actif, delai_minutes) values (:A, 'plomberie', true, 4);
rollback;

\echo ''
\echo '=== 2 ter d. Un delai de 601 minutes -> sos_delai_check (ERREUR attendue) ==='
begin;
insert into public.sos_availability (professional_id, metier_key, actif, delai_minutes) values (:A, 'plomberie', true, 601);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. Le nettoyage : un decompte de blancs devient null, un decompte se rogne, affiche null devient faux ==='
-- --------------------------------------------------------------------------
begin;
insert into public.tarifs_pro (pro_id, decompte_temps_texte, affiche) values (:A, E'  \n ', null);
select decompte_temps_texte is null as blancs_en_null_attendu_t,
       affiche as affiche_attendu_f
  from public.tarifs_pro where pro_id = :A;
update public.tarifs_pro set decompte_temps_texte = '  au quart d’heure  ' where pro_id = :A;
select decompte_temps_texte = 'au quart d’heure' as rogne_attendu_t from public.tarifs_pro where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3 bis. La DATE du geste est posee par la base, jamais par le telephone ==='
-- Avec le jeton de A, par le chemin de l'application. Une date de 2001
-- envoyée par le client est remplacée ; elle se garde tant que l'affichage
-- dure, s'efface quand il s'éteint, et renaît quand il se rallume.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.tarifs_pro (pro_id, taux_horaire_centimes, affiche, affiche_le)
values (:A, 6200, true, '2001-01-01');
select affiche_le as date_1, affiche_le::date = current_date as aujourd_hui_attendu_t,
       affiche_le > '2001-01-02' as pas_2001_attendu_t
  from public.tarifs_pro where pro_id = :A \gset
\echo :aujourd_hui_attendu_t :pas_2001_attendu_t
update public.tarifs_pro set taux_horaire_centimes = 6300 where pro_id = :A;
select affiche_le = :'date_1'::timestamptz as la_meme_apres_le_taux_attendu_t
  from public.tarifs_pro where pro_id = :A;
update public.tarifs_pro set affiche = false, affiche_le = '2001-01-01' where pro_id = :A;
select affiche_le is null as eteint_vide_attendu_t from public.tarifs_pro where pro_id = :A;
update public.tarifs_pro set affiche = true where pro_id = :A;
select affiche_le is not null and affiche_le > :'date_1'::timestamptz as une_date_neuve_attendu_t
  from public.tarifs_pro where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3 ter. Les blancs INVISIBLES se rognent aussi : un tarif invisible n est pas declare ==='
-- Relecture du 19/10/2026 : des conditions faites d'un seul U+200B
-- passaient `tarif_affiche_check` sans aucun prix, et la fiche montrait un
-- bloc « Ses tarifs » vide. chr(8203) = U+200B (espace de largeur nulle),
-- chr(160) = U+00A0 (insécable), chr(65279) = U+FEFF. D'abord ce qui se
-- rogne, ligne non affichée ; puis afficher avec eux seuls, refusé
-- (ERREUR attendue, dernier ordre).
-- --------------------------------------------------------------------------
begin;
insert into public.tarifs_pro (pro_id, frais_deplacement_texte, decompte_temps_texte)
values (:A, chr(8203), chr(160) || chr(65279));
select frais_deplacement_texte is null as conditions_invisibles_en_null_attendu_t,
       decompte_temps_texte is null as decompte_invisible_en_null_attendu_t
  from public.tarifs_pro where pro_id = :A;
update public.tarifs_pro
   set decompte_temps_texte = chr(8203) || 'au quart d’heure' || chr(160)
 where pro_id = :A;
select decompte_temps_texte = 'au quart d’heure' as rogne_aux_deux_bouts_attendu_t
  from public.tarifs_pro where pro_id = :A;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.tarifs_pro (pro_id, frais_deplacement_texte, decompte_temps_texte, affiche)
values (:A, chr(8203), chr(8203), true);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. Une ligne NON affichee : A la lit, P et B non ==='
-- --------------------------------------------------------------------------
begin;
execute tarifs_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select count(*) as a_attendu_1 from public.tarifs_pro;
set local request.jwt.claim.sub = :P;
select count(*) as p_attendu_0 from public.tarifs_pro;
set local request.jwt.claim.sub = :B;
select count(*) as b_attendu_0 from public.tarifs_pro;
rollback;

\echo ''
\echo '=== 4 bis. Un visiteur sans compte -> permission denied for table tarifs_pro (ERREUR attendue) ==='
-- Pas une liste vide : `anon` n'a toujours aucun droit (section 46.5).
begin;
execute tarifs_a;
execute affiche_a;
set local role anon;
select count(*) from public.tarifs_pro;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. Une ligne AFFICHEE : P la lit, B NON, A toujours ==='
-- Réponse du 19/10 : les tarifs affichés ne vont qu'aux particuliers.
-- --------------------------------------------------------------------------
begin;
execute tarifs_a;
execute affiche_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as p_attendu_1 from public.tarifs_pro;
set local request.jwt.claim.sub = :B;
select count(*) as b_attendu_0 from public.tarifs_pro;
set local request.jwt.claim.sub = :A;
select count(*) as a_attendu_1 from public.tarifs_pro;
rollback;

\echo ''
\echo '=== 5 bis. L administration ne lit pas : son compte est un compte pro ==='
begin;
execute tarifs_a;
execute affiche_a;
insert into public.administrateurs (user_id, note) values (:B, 'essai section 47');
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as p_attendu_1 from public.tarifs_pro;
set local request.jwt.claim.sub = :B;
select public.est_admin() as b_est_admin_attendu_t;
select count(*) as b_admin_attendu_0 from public.tarifs_pro;
rollback;

\echo ''
\echo '=== 5 ter. Un particulier « en attente » (porte de secours SIRET) LIT : il n a pas de fiche ==='
begin;
execute tarifs_a;
execute affiche_a;
insert into public.demandes_pro (compte_id, siret, motif) values (:P, '00004720900010', 'introuvable');
select count(*) as demande_en_attente_attendu_1 from public.demandes_pro where compte_id = :P and statut = 'nouvelle';
set local role authenticated;
set local request.jwt.claim.sub = :P;
select public.est_un_pro() as p_est_pro_attendu_f;
select count(*) as p_en_attente_attendu_1 from public.tarifs_pro;
rollback;


\echo ''
\echo '=== 5 quater. CE QUE « PARTICULIER » VEUT DIRE ICI : un administrateur PARTICULIER lit ==='
-- La limite, mesurée au lieu d'être tue (relecture du 19/10/2026) :
-- l'exclusion de l'administration tient au TYPE de compte de chaque
-- administrateur, pas à son rôle. Aujourd'hui le seul est un compte pro
-- (cas 5 bis). Le jour où un second est nommé, on relit 47.5 et la CGU.
begin;
execute tarifs_a;
execute affiche_a;
insert into public.administrateurs (user_id, note) values (:P, 'essai section 47');
set local role authenticated;
set local request.jwt.claim.sub = :P;
select public.est_admin() as p_est_admin_attendu_t, public.est_un_pro() as p_est_pro_attendu_f;
select count(*) as admin_particulier_lit_attendu_1 from public.tarifs_pro;
rollback;

\echo ''
\echo '=== 5 quinquies a. Un compte de type « pro » SANS fiche lit : est_un_pro() ne regarde que la fiche ==='
-- C'est la session anonyme du 14/09 sur la vraie base (type pro, aucune
-- fiche) : le propriétaire la supprime avant la migration, et le relevé de
-- forme compte ces comptes (doit valoir 0).
begin;
execute tarifs_a;
execute affiche_a;
update public.users set type = 'pro' where id = :P;
select u.type as p_type_attendu_pro,
       (select count(*) from public.professional_profiles where id = :P) as p_fiche_attendu_0
  from public.users u where u.id = :P;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as pro_sans_fiche_lit_attendu_1 from public.tarifs_pro;
rollback;

\echo ''
\echo '=== 5 quinquies b. Un artisan dont les donnees viennent d etre effacees lit, tant que son jeton vit ==='
-- `preparer_suppression_compte()` efface sa ligne `users` et sa fiche ;
-- la fonction Edge `compte` supprime ensuite le compte. Entre les deux,
-- son jeton est encore valide : il n'est plus un pro. B lit d'abord 0.
begin;
execute tarifs_a;
execute affiche_a;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select count(*) as b_avant_attendu_0 from public.tarifs_pro;
select (public.preparer_suppression_compte()) is not null as donnees_effacees_attendu_t;
select public.est_un_pro() as b_est_pro_attendu_f;
select count(*) as b_apres_effacement_lit_attendu_1 from public.tarifs_pro;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. P LIT la ligne affichee, mais n y ecrit RIEN ==='
-- `for all`, c'est quatre portes : on éprouve celui qui LIT. UPDATE 0,
-- DELETE 0, le taux intact, puis l'insert au nom de A refusé
-- (ERREUR attendue, dernier ordre).
-- --------------------------------------------------------------------------
begin;
execute tarifs_a;
execute affiche_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as p_attendu_1 from public.tarifs_pro;
update public.tarifs_pro set taux_horaire_centimes = 100 where pro_id = :A;
delete from public.tarifs_pro where pro_id = :A;
reset role;
select taux_horaire_centimes as taux_intact_attendu_6200 from public.tarifs_pro where pro_id = :A;
set local role authenticated;
insert into public.tarifs_pro (pro_id) values (:A)
  on conflict (pro_id) do update set taux_horaire_centimes = 100;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6 bis a. A rallume l affichage par un UPDATE : ca passe ==='
-- --------------------------------------------------------------------------
begin;
execute tarifs_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
update public.tarifs_pro set affiche = true where pro_id = :A;
select affiche as affiche_par_update_attendu_t from public.tarifs_pro where pro_id = :A;
rollback;

\echo ''
\echo '=== 6 bis b. …mais un UPSERT PARTIEL ({ affiche: true } seul) est refuse : la LIGNE ENTIERE, toujours (ERREUR attendue) ==='
-- PostgreSQL vérifie les contraintes sur la ligne PROPOSÉE d'un
-- `insert … on conflict`, avant de résoudre le conflit (mesuré le
-- 19/10/2026) : la ligne proposée n'a aucun prix, et la ligne en base en a.
-- C'est la forme que PostgREST produit pour `.upsert({ affiche: true })` :
-- l'application envoie donc toujours les sept colonnes, et la
-- démonstration valide la ligne proposée comme la base.
begin;
execute tarifs_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select count(*) as ligne_avec_prix_attendu_1 from public.tarifs_pro
 where pro_id = :A and taux_horaire_centimes = 6200;
insert into public.tarifs_pro (affiche, pro_id) values (true, :A)
  on conflict (pro_id) do update set affiche = excluded.affiche, pro_id = excluded.pro_id;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. P bloque A : il ne lit plus ses tarifs, et la recherche ne le rend plus ==='
-- --------------------------------------------------------------------------
begin;
execute tarifs_a;
execute affiche_a;
execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as p_avant_attendu_1 from public.tarifs_pro;
select count(*) as p_sos_avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
reset role;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local role authenticated;
select count(*) as p_bloque_attendu_0 from public.tarifs_pro;
select count(*) as p_sos_bloque_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;

\echo ''
\echo '=== 7 bis. A bloque P (l autre sens) : meme resultat ==='
begin;
execute tarifs_a;
execute affiche_a;
execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as p_avant_attendu_1 from public.tarifs_pro;
select count(*) as p_sos_avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
reset role;
insert into public.blocages (bloqueur_id, bloque_id) values (:A, :P);
set local role authenticated;
select count(*) as p_bloque_attendu_0 from public.tarifs_pro;
select count(*) as p_sos_bloque_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. La recherche, par P : les tarifs en EUROS, aux types d hier ==='
-- --------------------------------------------------------------------------
begin;
execute tarifs_a;
execute affiche_a;
execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) over () as lignes_attendu_1,
       deplacement as deplacement_attendu_45_00, horaire as horaire_attendu_62_00,
       majoration as majoration_attendu_40, delai_minutes as delai_attendu_45,
       pg_typeof(deplacement)::text as type_attendu_numeric,
       pg_typeof(majoration)::text as type_maj_attendu_integer
  from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;

\echo ''
\echo '=== 8 bis. Un visiteur l appelle -> permission denied for function artisans_urgence (ERREUR attendue) ==='
begin;
execute tarifs_a;
execute affiche_a;
execute sos_a;
set local role anon;
select * from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;

\echo ''
\echo '=== 8 ter. La recherche appelee par un ARTISAN : aucun autre artisan, au plus lui-meme ==='
-- Réponse du 19/10. Le titulaire s'y trouve, par « mes tarifs » : c'est son
-- propre prix, pas une fuite.
begin;
execute tarifs_a;
execute affiche_a;
execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as p_sos_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
set local request.jwt.claim.sub = :B;
select count(*) as b_sos_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
set local request.jwt.claim.sub = :A;
select count(*) as a_sos_lui_meme_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. Le catalogue : meme signature, meme type, plus d anon ; les fonctions de la politique gardent leur droit ==='
-- --------------------------------------------------------------------------
select pg_get_function_result('public.artisans_urgence(text, double precision, double precision)'::regprocedure)
         = 'TABLE(professional_id uuid, entreprise text, metier text, ville text, avatar_url text, '
           'verifie boolean, deplacement numeric, horaire numeric, majoration integer, '
           'delai_minutes integer, distance double precision)' as resultat_identique_attendu_t,
       p.prosecdef as definer_attendu_f,
       p.proargnames = array['p_metier_key','p_lat','p_lon','professional_id','entreprise','metier',
                             'ville','avatar_url','verifie','deplacement','horaire','majoration',
                             'delai_minutes','distance'] as noms_inchanges_attendu_t,
       p.proacl::text !~ '(^\{|,)=X' as pas_de_public_attendu_t
  from pg_proc p
 where p.oid = 'public.artisans_urgence(text, double precision, double precision)'::regprocedure;
select f, r, has_function_privilege(r, f, 'execute') as execute_
  from unnest(array['public.artisans_urgence(text, double precision, double precision)',
                    'public.metier_du_sos(text)']) f,
       unnest(array['anon', 'authenticated']) r
 order by 1, 2;
select (select proacl::text !~ '(^\{|,)=X' from pg_proc
          where oid = 'public.metier_du_sos(text)'::regprocedure) as metier_pas_de_public_attendu_t,
       has_function_privilege('authenticated', 'public.est_un_pro()', 'execute') as est_un_pro_attendu_t,
       has_function_privilege('authenticated', 'public.est_masque(uuid)', 'execute') as est_masque_attendu_t;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. Les exclusions : P voit 1, on change UNE chose, P lit 0 ==='
-- Le changement se fait sans jeton (`request.jwt.claim.sub` vide), comme
-- depuis l'éditeur SQL : les verrous de la fiche reconnaissent le
-- professionnel à `auth.uid() = id`, et l'administration à `auth.uid()` vide.
-- --------------------------------------------------------------------------
\echo '--- 10 a. affiche eteint'
begin;
execute tarifs_a; execute affiche_a; execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
reset role; set local request.jwt.claim.sub = '';
update public.tarifs_pro set affiche = false where pro_id = :A;
set local role authenticated; set local request.jwt.claim.sub = :P;
select count(*) as apres_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;

\echo '--- 10 b. frais en conditions seules'
begin;
execute tarifs_a; execute affiche_a; execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
reset role; set local request.jwt.claim.sub = '';
update public.tarifs_pro set frais_deplacement_centimes = null,
       frais_deplacement_texte = 'Gratuit jusqu’à 20 km' where pro_id = :A;
set local role authenticated; set local request.jwt.claim.sub = :P;
select count(*) as apres_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;

\echo '--- 10 c. majoration non declaree'
begin;
execute tarifs_a; execute affiche_a; execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
reset role; set local request.jwt.claim.sub = '';
update public.tarifs_pro set majoration_pct = null where pro_id = :A;
set local role authenticated; set local request.jwt.claim.sub = :P;
select count(*) as apres_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;

\echo '--- 10 d. le metier d urgence n est plus sur la fiche'
begin;
execute tarifs_a; execute affiche_a; execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
reset role; set local request.jwt.claim.sub = '';
update public.professional_profiles set metiers = '{macon}' where id = :A;
set local role authenticated; set local request.jwt.claim.sub = :P;
select count(*) as apres_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;

\echo '--- 10 e. la disponibilite eteinte'
begin;
execute tarifs_a; execute affiche_a; execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
reset role; set local request.jwt.claim.sub = '';
update public.sos_availability set actif = false where professional_id = :A;
set local role authenticated; set local request.jwt.claim.sub = :P;
select count(*) as apres_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;

\echo '--- 10 f. un point a 30 km (rayon de 20)'
begin;
execute tarifs_a; execute affiche_a; execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) as avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
select round(public.distance_km(48.6600, -4.4861, 48.3904, -4.4861)) as distance_km_30;
select count(*) as apres_attendu_0 from public.artisans_urgence('plomberie', 48.6600, -4.4861);
rollback;

\echo '--- 10 g. le piege du titulaire : A s y trouve, puis eteint, et ne s y trouve plus'
begin;
execute tarifs_a; execute affiche_a; execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select count(*) as avant_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
update public.tarifs_pro set affiche = false where pro_id = :A;
select count(*) as a_lit_encore_sa_ligne_attendu_1 from public.tarifs_pro;
select count(*) as apres_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10 bis. Deplacement offert (0) : la recherche le rend, a 0,00 ==='
-- --------------------------------------------------------------------------
begin;
execute tarifs_a; execute affiche_a; execute sos_a;
update public.tarifs_pro set frais_deplacement_centimes = 0 where pro_id = :A;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select count(*) over () as lignes_attendu_1, deplacement as deplacement_attendu_0_00
  from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. metier_du_sos : les quatre cles, et null pour une cle inconnue ==='
-- --------------------------------------------------------------------------
select public.metier_du_sos('plomberie') as plombier, public.metier_du_sos('electricite') as electricien,
       public.metier_du_sos('serrurerie') as serrurier, public.metier_du_sos('chauffage') as chauffagiste,
       public.metier_du_sos('menuiserie') is null as inconnue_null_attendu_t;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 12. L export RGPD : les colonnes nouvelles, la disponibilite, les urgences des deux cotes ==='
-- --------------------------------------------------------------------------
begin;
execute tarifs_a;
execute sos_a;
insert into public.sos_requests (client_id, professional_id, metier_key, probleme_key, adresse)
values (:P, :A, 'plomberie', 'fuite', '1 rue de l’Essai, Brest');
set local role authenticated;
set local request.jwt.claim.sub = :A;
select (d -> 'mes_tarifs') ?& array['taux_horaire_centimes', 'majoration_pct', 'decompte_temps_texte',
                                    'prix_devis_centimes', 'affiche', 'affiche_le'] as six_cles_attendu_t,
       jsonb_array_length(d -> 'ma_disponibilite_urgences') as disponibilite_attendu_1,
       jsonb_array_length(d -> 'urgences') as a_urgences_attendu_1
  from (select public.mes_donnees() as d) x;
set local request.jwt.claim.sub = :P;
select jsonb_array_length(d -> 'urgences') as p_urgences_attendu_1
  from (select public.mes_donnees() as d) x;
set local request.jwt.claim.sub = :B;
select d -> 'mes_tarifs' = 'null'::jsonb as b_tarifs_nul_attendu_t,
       jsonb_array_length(d -> 'ma_disponibilite_urgences') as b_disponibilite_attendu_0,
       jsonb_array_length(d -> 'urgences') as b_urgences_attendu_0
  from (select public.mes_donnees() as d) x;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 13. Les droits de table : anon n a rien sur tarifs_pro ; sur sos_availability, il ne fait que lire ==='
-- --------------------------------------------------------------------------
select has_table_privilege('anon', 'public.tarifs_pro', 'select')   as tp_anon_select_attendu_f,
       has_table_privilege('anon', 'public.tarifs_pro', 'insert')   as tp_anon_insert_attendu_f,
       has_table_privilege('anon', 'public.tarifs_pro', 'update')   as tp_anon_update_attendu_f,
       has_table_privilege('anon', 'public.tarifs_pro', 'delete')   as tp_anon_delete_attendu_f,
       has_table_privilege('anon', 'public.tarifs_pro', 'truncate') as tp_anon_truncate_attendu_f,
       has_table_privilege('authenticated', 'public.tarifs_pro', 'truncate') as tp_auth_truncate_attendu_f;
select has_table_privilege('anon', 'public.sos_availability', 'select')   as sos_anon_select_attendu_t,
       has_table_privilege('anon', 'public.sos_availability', 'insert')   as sos_anon_insert_attendu_f,
       has_table_privilege('anon', 'public.sos_availability', 'update')   as sos_anon_update_attendu_f,
       has_table_privilege('anon', 'public.sos_availability', 'delete')   as sos_anon_delete_attendu_f,
       has_table_privilege('anon', 'public.sos_availability', 'truncate') as sos_anon_truncate_attendu_f,
       has_table_privilege('authenticated', 'public.sos_availability', 'truncate') as sos_auth_truncate_attendu_f;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 14. Qui lit ces tables : une liste fermee, aucune security definer, aucune vue ==='
-- --------------------------------------------------------------------------
select string_agg(p.proname, ', ' order by p.proname) as nomment_tarifs_pro,
       string_agg(p.proname, ', ' order by p.proname)
         = 'artisans_urgence, emetteur_incomplet, mes_donnees' as liste_fermee_attendu_t
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public' and p.prosrc ~ '\mtarifs_pro\M';
select string_agg(p.proname, ', ' order by p.proname) as nomment_emetteur,
       string_agg(p.proname, ', ' order by p.proname)
         = 'emetteur_incomplet, mes_donnees' as liste_fermee_attendu_t
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public' and p.prosrc ~ '\m(emetteur_assurances|emetteur)\M';
select count(*) filter (where p.prosecdef) as definer_attendu_0
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public' and p.prosrc ~ '\m(tarifs_pro|emetteur_assurances|emetteur)\M';
select (select count(*) from pg_views where definition ~ '\m(tarifs_pro|emetteur_assurances|emetteur)\M')
     + (select count(*) from pg_matviews where definition ~ '\m(tarifs_pro|emetteur_assurances|emetteur)\M')
         as vues_attendu_0;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 15. Les politiques de tarifs_pro : deux, et la lecture publique pour les particuliers seulement ==='
-- --------------------------------------------------------------------------
select policyname, cmd, roles, qual
  from pg_policies where schemaname = 'public' and tablename = 'tarifs_pro'
 order by policyname;
select qual = '((affiche IS TRUE) AND (NOT est_un_pro()) AND (NOT est_masque(pro_id)))'
         as qual_exact_attendu_t
  from pg_policies where schemaname = 'public' and tablename = 'tarifs_pro'
   and policyname = 'tarifs affiches';


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 16. Le compte de A part : ses tarifs et sa disponibilite partent avec lui ==='
-- --------------------------------------------------------------------------
begin;
execute tarifs_a;
execute sos_a;
select (select count(*) from public.tarifs_pro where pro_id = :A) as avant_tarifs_attendu_1,
       (select count(*) from public.sos_availability where professional_id = :A) as avant_sos_attendu_1;
delete from auth.users where id = :A;
select (select count(*) from public.tarifs_pro where pro_id = :A) as apres_tarifs_attendu_0,
       (select count(*) from public.sos_availability where professional_id = :A) as apres_sos_attendu_0;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 17. Les contraintes : toutes en _check, aucune anonyme ; huit sur tarifs_pro ==='
-- --------------------------------------------------------------------------
select count(*) filter (where conname !~ '_check$') as mal_nommees_attendu_0,
       count(*) filter (where conname ~ '_check[0-9]+$') as anonymes_attendu_0
  from pg_constraint
 where contype = 'c'
   and conrelid in ('public.tarifs_pro'::regclass, 'public.sos_availability'::regclass);
select count(*) as tarifs_pro_attendu_8
  from pg_constraint where contype = 'c' and conrelid = 'public.tarifs_pro'::regclass;
select string_agg(conname, ', ' order by conname) as contraintes_sos
  from pg_constraint where contype = 'c' and conrelid = 'public.sos_availability'::regclass;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18. Aucun agregat sur les tarifs de plusieurs artisans ==='
-- Pas de moyenne, pas de prix conseillé (docs/DONNEES-DES-ARTISANS.md). En
-- mot entier : `min(` en sous-chaîne accuserait `est_admin(`.
-- --------------------------------------------------------------------------
select count(*) as agregats_attendu_0
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public' and p.prosrc ~ 'tarifs_pro'
   and (p.prosrc ~ '\m(avg|sum|min|max|stddev|median)\s*\(' or p.prosrc ~ 'percentile_');


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 19 a. Les colonnes MORTES : une mise a jour non nulle -> OP012 (ERREUR attendue) ==='
-- Avec le jeton de A, comme l'enverrait l'icône « preview » du 17/10.
-- --------------------------------------------------------------------------
\set VERBOSITY verbose
begin;
execute sos_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
update public.sos_availability set deplacement = 45, horaire = 62, majoration = 40
 where professional_id = :A;
rollback;

\echo ''
\echo '=== 19 b. …un insert non nul -> OP012 (ERREUR attendue) ==='
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.sos_availability (professional_id, metier_key, actif, deplacement, horaire, majoration)
values (:A, 'serrurerie', true, 45, 62, 40);
rollback;
\set VERBOSITY default

\echo ''
\echo '=== 19 c. …un insert a 0 / 0 / 0 PASSE ==='
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.sos_availability (professional_id, metier_key, actif, deplacement, horaire, majoration)
values (:A, 'serrurerie', true, 0, 0, 0);
select deplacement, horaire, majoration from public.sos_availability
 where professional_id = :A and metier_key = 'serrurerie';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 20. Aucune fonction ne LIT les colonnes mortes, sauf celle qui les refuse ==='
-- On cherche ce qui les lit vraiment : un accès `x.deplacement` (ce que
-- faisait l'ancienne `artisans_urgence`) ou une clé `'deplacement'` (le
-- refus, qui lit la ligne par `to_jsonb(new)` et ne nomme pas la table).
-- Le mot seul attraperait `horaires_valides`, qui parle des horaires
-- d'ouverture.
-- --------------------------------------------------------------------------
select string_agg(p.proname, ', ' order by p.proname)
         as lecteurs_attendu_refuse_les_colonnes_mortes_du_sos
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public'
   and (p.prosrc ~ '\m[a-z_]+\.(deplacement|horaire|majoration)\M'
        or p.prosrc ~ '''(deplacement|horaire|majoration)''');


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 20 bis. sos_availability.updated_at : la base dit qu elle n est plus tenue ==='
-- Relecture du 19/10/2026 : depuis le lot T, ni l'application ni la base
-- ne la mettent à jour ; elle reste lisible de tous et part dans l'export.
-- --------------------------------------------------------------------------
select col_description('public.sos_availability'::regclass,
         (select attnum from pg_attribute
           where attrelid = 'public.sos_availability'::regclass and attname = 'updated_at'))
         like 'NON TENUE%' as commentaire_non_tenue_attendu_t;

deallocate tarifs_a;
deallocate affiche_a;
deallocate sos_a;
