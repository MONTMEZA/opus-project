-- ==========================================================================
--  ESSAIS DE LA SECTION 32 — où se passe une publication
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` et
--  `schema.sql` (rejoué deux fois) :
--
--      psql -h 127.0.0.1 -p 5444 -U postgres -d opus_essai \
--           -f supabase/essais-section-32.sql
--
--  CHAQUE CAS EST DANS SON PROPRE `begin … rollback`.
--
--  ET SURTOUT PAS DANS UN BLOC `do $$ … $$` — à l'intérieur d'un `do`, les
--  politiques RLS ne sont pas appliquées, et un essai de sécurité y passe
--  au vert sans rien éprouver. Les DÉCLENCHEURS, eux, s'exécutent quoi
--  qu'il arrive : c'est tout ce que cette section contient.
-- ==========================================================================

\set PRO    '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set CLIENT '''bbbb0000-0000-4000-8000-00000000bbbb'''


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. UN PARTICULIER A ENFIN UNE COMMUNE ET DES COORDONNEES ==='
-- Avant ce lot il ne donnait que son nom : aucune recherche « autour de
-- moi » ne pouvait fonctionner pour lui.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :CLIENT, 'client@exemple-opus.test',
  jsonb_build_object('type', 'particulier', 'nom', 'Julie',
                     'ville', 'Lambesc (13)', 'code_postal', '13410',
                     'latitude', 43.6508, 'longitude', 5.2636)
);
select nom, ville, code_postal, latitude, longitude
  from public.users where id = :CLIENT;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. UN PRO : LES DEUX MOITIES SONT PLACEES ==='
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Belaid Maconnerie',
                     'entreprise', 'Belaid Maconnerie',
                     'metiers', jsonb_build_array('macon'),
                     'ville', 'Lambesc (13)', 'code_postal', '13410',
                     'latitude', 43.6508, 'longitude', 5.2636)
);
select u.ville as ville_compte, u.latitude as lat_compte,
       p.ville as ville_fiche, p.code_postal, p.latitude as lat_fiche,
       p.longitude as lon_fiche
  from public.users u
  join public.professional_profiles p on p.id = u.id
 where u.id = :PRO;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. DES COORDONNEES ILLISIBLES NE COUTENT PAS UN COMPTE ==='
-- Ces metadonnees sont ecrites par le CLIENT. Un `::double precision` pose
-- directement sur « nulle part » leverait une erreur, et cette erreur
-- ferait echouer l inscription. On rend null. Meme regle que les metiers
-- inventes de la section 31.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Bidon',
                     'metiers', jsonb_build_array('macon'),
                     'ville', 'Nulle part',
                     'latitude', 'quelque part', 'longitude', '')
);
select (select count(*) from public.users where id = :PRO) as compte_cree,
       latitude, longitude
  from public.professional_profiles where id = :PRO;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. UNE LATITUDE DE 500 N EST PAS UNE LATITUDE ==='
-- 500 est un nombre parfaitement valide. La borne compte autant que le
-- format : sans elle, le compte serait place nulle part et aucun calcul de
-- distance ne s en plaindrait.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Hors bornes',
                     'metiers', jsonb_build_array('macon'),
                     'latitude', 500, 'longitude', 5.2636)
);
select latitude, longitude from public.professional_profiles where id = :PRO;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. UNE SEULE DES DEUX NE SITUE RIEN : LES DEUX PARTENT ==='
-- Une ligne a moitie placee serait ignoree en silence par tout calcul de
-- distance, en ayant l air placee.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'A moitie',
                     'metiers', jsonb_build_array('macon'),
                     'latitude', 43.6508)
);
select latitude, longitude from public.professional_profiles where id = :PRO;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. UNE PUBLICATION HERITE DE LA COMMUNE DE SON AUTEUR ==='
-- C est le PLANCHER : reseau coupe, Base Adresse Nationale muette, vieille
-- version de l application, insertion depuis l editeur SQL.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Belaid',
                     'metiers', jsonb_build_array('macon'),
                     'ville', 'Lambesc (13)',
                     'latitude', 43.6508, 'longitude', 5.2636)
);
insert into public.posts (author_id, type, texte, metier)
values (:PRO, 'photo', 'Un mur monte ce matin.', 'macon');
select ville, latitude, longitude from public.posts where author_id = :PRO;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. …MAIS CE QUE L APPLICATION A ENVOYE N EST PAS ECRASE ==='
-- `completerLieu()` cote application sait placer un chantier sur une AUTRE
-- commune que celle de la fiche. Le declencheur ne doit pas la ramener.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Belaid',
                     'metiers', jsonb_build_array('macon'),
                     'ville', 'Lambesc (13)',
                     'latitude', 43.6508, 'longitude', 5.2636)
);
insert into public.posts (author_id, type, texte, metier, ville, latitude, longitude)
values (:PRO, 'photo', 'Chantier a Aix.', 'macon', 'Aix-en-Provence (13)',
        43.5297, 5.4474);
select ville, latitude, longitude from public.posts where author_id = :PRO;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. UNE SEULE COORDONNEE ENVOYEE : ON REPART DE LA FICHE ==='
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Belaid',
                     'metiers', jsonb_build_array('macon'),
                     'ville', 'Lambesc (13)',
                     'latitude', 43.6508, 'longitude', 5.2636)
);
insert into public.posts (author_id, type, texte, metier, latitude)
values (:PRO, 'photo', 'A moitie place.', 'macon', 48.8566);
select latitude, longitude from public.posts where author_id = :PRO;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. UNE PUBLICITE RESTE SANS LIEU, ET SANS ERREUR ==='
-- `is_ad = true` n a pas d auteur : il n y a rien a heriter. Elle sortira
-- d un fil filtre par secteur, comme une annonce sans coordonnees sort de
-- la Place des pros.
-- --------------------------------------------------------------------------
begin;
insert into public.posts (type, texte, is_ad, annonceur, accroche, cta)
values ('photo', 'Nouvelle gamme d enduits.', true, 'Une marque',
        'Promotion du mois', 'Decouvrir');
select is_ad, annonceur, latitude, longitude, ville
  from public.posts where is_ad = true order by created_at desc limit 1;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. UN AUTEUR SANS COORDONNEES NE CASSE RIEN ==='
-- C est le cas des six fiches de la vraie base avant le rattrapage du
-- 04/10, et de tout compte cree a la main dans l editeur SQL.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Sans lieu',
                     'metiers', jsonb_build_array('macon'))
);
insert into public.posts (author_id, type, texte, metier)
values (:PRO, 'photo', 'Nulle part.', 'macon');
select ville, latitude, longitude from public.posts where author_id = :PRO;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. LE RATTRAPAGE : il place ce qui existait, et UNE SEULE FOIS ==='
-- Seize publications sans coordonnees existaient avant ce lot. Sans le
-- rattrapage, poser le filtre ferait disparaitre TOUT le contenu — ce qui
-- ressemblerait trait pour trait a un filtre casse.
--
-- Et il doit etre rejouable : `schema.sql` est rejoue deux fois, toujours.
-- --------------------------------------------------------------------------
begin;
insert into auth.users (id, email, raw_user_meta_data) values (
  :PRO, 'pro@exemple-opus.test',
  jsonb_build_object('type', 'pro', 'nom', 'Belaid',
                     'metiers', jsonb_build_array('macon'),
                     'ville', 'Lambesc (13)',
                     'latitude', 43.6508, 'longitude', 5.2636)
);
-- Une publication d'AVANT ce lot : on remet volontairement son lieu à null,
-- en contournant le déclencheur, qui ne regarde que l'insertion.
insert into public.posts (author_id, type, texte, metier)
values (:PRO, 'photo', 'Une ancienne.', 'macon');
update public.posts set latitude = null, longitude = null, ville = null
 where author_id = :PRO;

\echo '--- avant le rattrapage ---'
select ville, latitude from public.posts where author_id = :PRO;

update public.posts p
   set latitude  = pp.latitude,
       longitude = pp.longitude,
       ville     = coalesce(nullif(btrim(coalesce(p.ville, '')), ''), pp.ville)
  from public.professional_profiles pp
 where pp.id = p.author_id and p.latitude is null and pp.latitude is not null;

\echo '--- apres le rattrapage ---'
select ville, latitude, longitude from public.posts where author_id = :PRO;

\echo '--- le SECOND passage ne doit toucher AUCUNE ligne ---'
update public.posts p
   set latitude  = pp.latitude,
       longitude = pp.longitude,
       ville     = coalesce(nullif(btrim(coalesce(p.ville, '')), ''), pp.ville)
  from public.professional_profiles pp
 where pp.id = p.author_id and p.latitude is null and pp.latitude is not null;
rollback;


\echo ''
\echo '=== FIN DES ESSAIS DE LA SECTION 32 ==='
