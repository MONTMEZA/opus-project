-- ==========================================================================
--  ESSAIS DE LA SECTION 31 — un compte d'artisan ne se crée plus à moitié
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` et
--  `schema.sql` (rejoué deux fois) :
--
--      psql -h 127.0.0.1 -p 5444 -U postgres -d opus_essai \
--           -f supabase/essais-section-31.sql
--
--  CHAQUE CAS EST DANS SON PROPRE `begin … rollback` : la base ressort
--  exactement comme elle est entrée.
--
--  ET SURTOUT PAS DANS UN BLOC `do $$ … $$` — constaté le 01/10/2026 :
--  à l'intérieur d'un `do`, les politiques RLS ne sont PAS appliquées, et
--  un essai de sécurité y passe au vert sans rien éprouver. Les
--  déclencheurs et les contraintes, eux, s'exécutent quoi qu'il arrive.
-- ==========================================================================

\set MOI   '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set CLIENT '''bbbb0000-0000-4000-8000-00000000bbbb'''


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. Un artisan s inscrit : les DEUX moities naissent ensemble ==='
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object(
    'type', 'pro',
    'nom', 'Belaid Maconnerie',
    'entreprise', 'Belaid Maconnerie',
    'metiers', jsonb_build_array('macon', 'carreleur'),
    'ville', 'Marseille (13)',
    'cgu', '2026-09-21'
  )
);

select u.type, u.nom, (u.cgu_version is not null) as cgu_enregistrees,
       p.entreprise, p.metier, p.metiers, p.ville, p.verifie, p.verification_statut
  from public.users u
  left join public.professional_profiles p on p.id = u.id
 where u.id = :MOI;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. Un metier INVENTE ne fait pas echouer l inscription ==='
-- Il retombe sur le premier du catalogue. Faire echouer la creation du
-- compte pour une metadonnee malformee serait pire que le defaut corrige.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Bidon',
                     'metiers', jsonb_build_array('dresseur-de-licornes'))
);
select metier, metiers from public.professional_profiles where id = :MOI;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. Des metadonnees qui reclament le badge sont IGNOREES ==='
-- Elles sont ecrites par le client au moment de l inscription : un client
-- modifie peut y mettre n importe quoi. L insertion nomme ses colonnes.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Tricheur',
                     'verifie', true, 'kbis_valide', true,
                     'assurance_valide', true, 'rge', true)
);
select verifie, kbis_valide, assurance_valide, rge, verification_statut
  from public.professional_profiles where id = :MOI;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. Un PARTICULIER n a pas de fiche professionnelle ==='
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'particulier', 'nom', 'Julie')
);
select u.type,
       (select count(*) from public.professional_profiles p where p.id = u.id) as fiches_pro
  from public.users u where u.id = :MOI;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. LE BADGE NE SE DECERNE PAS A LA CREATION (faille du 05/10) ==='
-- Avant ce lot : INSERT 0 1, aucune erreur, et la fiche ressortait
-- verifie = t. Le verrou de tient_le_profil_pro() ne regardait que UPDATE.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'particulier', 'nom', 'Tricheur')
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
insert into public.professional_profiles
  (id, entreprise, metier, metiers, ville, kbis_valide, assurance_valide, verifie)
values (:MOI, 'Tricheur SARL', 'macon', array['macon'], 'Nulle part', true, true, true);
reset role;

select verifie, kbis_valide, assurance_valide, verification_statut
  from public.professional_profiles where id = :MOI;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. L administration, elle, pose toujours le badge ==='
-- auth.uid() est nul depuis l editeur SQL : le verrou laisse passer.
-- C est par la que passe le back-office de la section 25.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Honnete',
                     'metiers', jsonb_build_array('macon'))
);
update public.professional_profiles
   set kbis_valide = true, assurance_valide = true where id = :MOI;
select verifie, verification_statut from public.professional_profiles where id = :MOI;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. UNE FICHE PRO NE SE SUPPRIME PAS — et les avis survivent ==='
-- Avant ce lot : DELETE 1, et les avis ecrits SUR lui disparaissaient
-- avec la fiche (on delete cascade). Un pro effacait ses mauvais avis.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Belaid',
                     'metiers', jsonb_build_array('macon'))
);
insert into auth.users (id, email, raw_user_meta_data) values (
  :CLIENT, 'client@exemple-opus.test',
  jsonb_build_object('type', 'particulier', 'nom', 'Un client')
);
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values (:MOI, :CLIENT, 1, 1, 1, 'Chantier abandonne.');

\echo '--- avant : combien d avis ? ---'
select count(*) as avis from public.reviews where professional_id = :MOI;

\echo '--- le pro tente de supprimer SA fiche ---'
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
delete from public.professional_profiles where id = :MOI;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. …et l avis est TOUJOURS la apres la tentative ==='
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Belaid',
                     'metiers', jsonb_build_array('macon'))
);
insert into auth.users (id, email, raw_user_meta_data) values (
  :CLIENT, 'client@exemple-opus.test',
  jsonb_build_object('type', 'particulier', 'nom', 'Un client')
);
insert into public.reviews (professional_id, author_id, delais, qualite, tarif, commentaire)
values (:MOI, :CLIENT, 1, 1, 1, 'Chantier abandonne.');

savepoint avant_tentative;
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
delete from public.professional_profiles where id = :MOI;
rollback to savepoint avant_tentative;

select count(*) as avis_toujours_la, count(*) filter (where auteur_supprime) as anonymises
  from public.reviews where professional_id = :MOI;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. LA CASCADE DOIT PASSER : supprimer son compte reste un droit ==='
-- `preparer_suppression_compte()` finit par `delete from public.users`.
-- La fiche part en cascade, et le declencheur doit la laisser partir.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Qui s en va',
                     'metiers', jsonb_build_array('macon'))
);
delete from public.users where id = :MOI;
select (select count(*) from public.users where id = :MOI) as comptes,
       (select count(*) from public.professional_profiles where id = :MOI) as fiches;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. …et la cascade depuis auth.users aussi (le 2e des 3 chemins) ==='
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :MOI, 'essai@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Qui s en va',
                     'metiers', jsonb_build_array('macon'))
);
delete from auth.users where id = :MOI;
select (select count(*) from public.users where id = :MOI) as comptes,
       (select count(*) from public.professional_profiles where id = :MOI) as fiches;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. Une inscription SANS metadonnees ne casse pas ==='
-- Un compte cree a la main dans l editeur SQL, par exemple.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email) values (:MOI, 'essai@exemple-opus.test');
select type, nom, (cgu_version is null) as sans_cgu from public.users where id = :MOI;
rollback;


\echo ''
\echo '=== FIN DES ESSAIS DE LA SECTION 31 ==='
