-- ==========================================================================
--  ESSAIS DE LA SECTION 33 — le fil se filtre dans la BASE
--
--      psql -h 127.0.0.1 -p 5444 -U postgres -d opus_essai \
--           -f supabase/essais-section-33.sql
--
--  ET SURTOUT PAS DANS UN BLOC `do $$ … $$` — constaté le 01/10/2026 :
--  à l'intérieur d'un `do`, les politiques RLS ne sont PAS appliquées, et
--  un essai de sécurité y passe au vert sans rien éprouver. `fil_filtre()`
--  est `security invoker` précisément pour que la RLS s'applique : c'est
--  donc le cœur de ce qu'il faut éprouver ici.
--
--  CHAQUE CAS EST DANS SON PROPRE `begin … rollback`. Et comme un essai
--  de sécurité doit d'abord prouver que la donnée EXISTE (leçon du
--  04/10 : le cas « un tiers ne lit rien » affichait 0 parce qu'il n'y
--  avait rien à lire), le jeu d'essai est recompté à chaque cas.
-- ==========================================================================

\set MACON    '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set COUVREUR '''bbbb0000-0000-4000-8000-00000000bbbb'''
\set CLIENT   '''cccc0000-0000-4000-8000-00000000cccc'''

-- --------------------------------------------------------------------------
--  Le jeu d'essai, posé par une fonction pour ne pas le recopier dix fois.
--
--  Lambesc (43,65 / 5,26) et Lille (50,63 / 3,06) : 800 km, aucun rayon
--  réaliste ne les confond.
-- --------------------------------------------------------------------------
create or replace function pg_temp.jeu_dessai() returns void
language plpgsql as $$
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'macon@exemple-opus.test',
     jsonb_build_object('type','pro','nom','Macon de Lambesc',
       'entreprise','Macon de Lambesc','metiers',jsonb_build_array('macon'),
       'ville','Lambesc (13)','latitude',43.6508,'longitude',5.2636)),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'couvreur@exemple-opus.test',
     jsonb_build_object('type','pro','nom','Couvreur de Lille',
       'entreprise','Couvreur de Lille','metiers',jsonb_build_array('couvreur'),
       'ville','Lille (59)','latitude',50.6292,'longitude',3.0573)),
    ('cccc0000-0000-4000-8000-00000000cccc', 'client@exemple-opus.test',
     jsonb_build_object('type','particulier','nom','Julie'));

  -- Le maçon est vérifié et noté 4/5 ; le couvreur n'a AUCUN avis.
  update public.professional_profiles
     set kbis_valide = true, assurance_valide = true,
         avis_count = 3, note_delais = 4, note_qualite = 4, note_tarif = 4
   where id = 'aaaa0000-0000-4000-8000-00000000aaaa';

  insert into public.posts (author_id, type, texte, metier, created_at) values
    ('aaaa0000-0000-4000-8000-00000000aaaa','photo','Mur a Lambesc.','macon', now() - interval '1 hour'),
    ('aaaa0000-0000-4000-8000-00000000aaaa','video','Video a Lambesc.','macon', now() - interval '2 hour'),
    ('bbbb0000-0000-4000-8000-00000000bbbb','photo','Toit a Lille.','couvreur', now() - interval '3 hour');

  -- Une publicité : ni auteur, ni métier, ni lieu, ni badge.
  insert into public.posts (type, texte, is_ad, annonceur, accroche, cta, created_at)
  values ('photo','Nouvelle gamme.',true,'Une marque','Promo','Voir', now() - interval '4 hour');
end $$;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. SANS FILTRE : tout, du plus recent au plus ancien ==='
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
select count(*) as total, count(*) filter (where is_ad) as publicites
  from public.fil_filtre();
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. PAR METIER : les macons, et PAS la publicite ==='
-- Une publicite n a pas de metier : elle ne peut satisfaire aucun critere.
-- Demander « les macons » et recevoir une publicite serait exactement ce
-- qui fait perdre confiance dans un fil.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
select count(*) as total, count(*) filter (where is_ad) as publicites,
       string_agg(distinct metier, ', ') as metiers
  from public.fil_filtre(p_metier => 'macon');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. PAR SECTEUR : 20 km autour de Lambesc ==='
-- Lille est a 800 km. La publicite n a pas de coordonnees : « pas de
-- coordonnees » veut dire « on ne sait pas ou », pas « partout ».
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
\echo '--- d abord : la donnee EXISTE bien (4 publications) ---'
select count(*) as sans_filtre from public.fil_filtre();
\echo '--- 20 km autour de Lambesc ---'
select count(*) as total, string_agg(distinct ville, ' / ') as villes
  from public.fil_filtre(p_lat => 43.6508, p_lon => 5.2636, p_rayon_km => 20);
\echo '--- 900 km autour de Lambesc : Lille entre, la publicite non ---'
select count(*) as total from public.fil_filtre(p_lat => 43.6508, p_lon => 5.2636, p_rayon_km => 900);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. VERIFIES SEULEMENT ==='
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
select count(*) as total, count(*) filter (where is_ad) as publicites
  from public.fil_filtre(p_verifies => true);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. LE PIEGE DE LA NOTE : sans avis, on est ECARTE ==='
-- Mesure avant d ecrire : 4 artisans sur 7 n ont aucun avis. Un filtre
-- « minimum 3/5 » les ecarte tous, donc tous les nouveaux inscrits, pour
-- toujours. On ne peut pas faire autrement — on ne va pas leur preter une
-- note — mais l ECRAN doit le dire.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
\echo '--- le couvreur a bien 0 avis ---'
select entreprise, avis_count from public.professional_profiles order by entreprise;
\echo '--- minimum 3/5 : seul le macon reste ---'
select count(*) as total, string_agg(distinct metier, ', ') as metiers
  from public.fil_filtre(p_note_min => 3);
\echo '--- minimum 5/5 : plus personne (le macon est a 4) ---'
select count(*) as total from public.fil_filtre(p_note_min => 5);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. ABONNEMENTS : les miens, PLUS les publicites ==='
-- La publicite est le contrat passe avec l annonceur : elle ne depend de
-- personne, et la retirer de cet onglet reviendrait a ne la montrer qu a
-- ceux qui ne s abonnent a personne.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.follows (follower_id, following_id)
values (:CLIENT, :MACON);

set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select count(*) as total, count(*) filter (where is_ad) as publicites,
       string_agg(distinct coalesce(metier,'(pub)'), ', ') as origines
  from public.fil_filtre(p_abonnements => true);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. VIDEOS : rien que ce qui se regarde en plein ecran ==='
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
select count(*) as total, string_agg(distinct type, ', ') as types,
       count(*) filter (where is_ad) as publicites
  from public.fil_filtre(p_videos => true);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. LE BLOCAGE TIENT — c est pourquoi la fonction est INVOKER ==='
-- Une fonction `security definer` rendrait ici les publications des
-- personnes qu on a bloquees, et PERSONNE ne s en apercevrait : elle
-- rendrait des publications parfaitement normales.
--
-- `set local role` puis l ordre, chacun dans son propre appel, JAMAIS dans
-- un `do` — a l interieur d un bloc, la RLS n est pas appliquee.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();

\echo '--- avant blocage : le client voit les 4 ---'
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select count(*) as avant from public.fil_filtre();
reset role;

insert into public.blocages (bloqueur_id, bloque_id) values (:CLIENT, :MACON);

\echo '--- apres blocage : les DEUX publications du macon disparaissent ---'
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select count(*) as apres, string_agg(distinct coalesce(metier,'(pub)'), ', ') as reste
  from public.fil_filtre();
\echo '--- et un filtre ne le contourne pas ---'
select count(*) as macons_vus from public.fil_filtre(p_metier => 'macon');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. LA PAGINATION PAR CURSEUR ==='
-- Par curseur et non par numero de page : entre deux pages, quelqu un
-- publie, et tout se decale.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
\echo '--- page 1 : deux publications ---'
select count(*) as page1, min(created_at) as plus_ancienne
  from public.fil_filtre(p_limite => 2);
\echo '--- page 2 : ce qui est plus ancien que la derniere de la page 1 ---'
select count(*) as page2 from public.fil_filtre(
  p_limite => 2,
  p_avant => (select min(created_at) from public.fil_filtre(p_limite => 2)));
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. LA LIMITE EST PLAFONNEE ==='
-- Un client modifie peut demander `p_limite => 100000`. On plafonne a 50 :
-- c est le fil, pas un export.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
select count(*) as rendu from public.fil_filtre(p_limite => 100000);
\echo '(4 publications en base : ce qui se verifie ici, c est que la fonction'
\echo ' ne leve pas et que le `least(…, 50)` est bien ecrit)'
select pg_get_functiondef('public.fil_filtre(text,double precision,double precision,int,numeric,boolean,boolean,boolean,timestamptz,int)'::regprocedure) ~ 'least\(coalesce\(p_limite, 20\), 50\)' as plafond_present;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. PLUSIEURS FILTRES ENSEMBLE ==='
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
select count(*) as total
  from public.fil_filtre(p_metier => 'macon', p_lat => 43.6508, p_lon => 5.2636,
                         p_rayon_km => 20, p_verifies => true, p_note_min => 3);
\echo '--- et le meme, a Lille : plus rien ---'
select count(*) as total
  from public.fil_filtre(p_metier => 'macon', p_lat => 50.6292, p_lon => 3.0573,
                         p_rayon_km => 20, p_verifies => true, p_note_min => 3);
rollback;


\echo ''
\echo '=== FIN DES ESSAIS DE LA SECTION 33 ==='
