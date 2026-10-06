-- ==========================================================================
--  ESSAIS DE LA SECTION 36 — le chantier
--
--      psql -h 127.0.0.1 -p 5444 -U postgres -d opus36 \
--           -f supabase/essais-section-36.sql
--
--  ET SURTOUT PAS DANS UN BLOC `do $$ … $$` pour la RLS : à l'interieur
--  d'un `do`, les politiques ne sont PAS appliquées et un essai de
--  sécurité y passe au vert sans rien éprouver (constaté le 01/10/2026).
-- ==========================================================================

\set MACON    '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set COUVREUR '''bbbb0000-0000-4000-8000-00000000bbbb'''
\set CLIENT   '''cccc0000-0000-4000-8000-00000000cccc'''

create or replace function pg_temp.jeu_dessai() returns void
language plpgsql as $$
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'macon@exemple-opus.test',
     jsonb_build_object('type','pro','nom','Macon','entreprise','Macon',
       'metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'couvreur@exemple-opus.test',
     jsonb_build_object('type','pro','nom','Couvreur','entreprise','Couvreur',
       'metiers',jsonb_build_array('couvreur'),'ville','Charleval (13)')),
    ('cccc0000-0000-4000-8000-00000000cccc', 'client@exemple-opus.test',
     jsonb_build_object('type','particulier','nom','Julie'));
end $$;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. LA FONCTION D APPARTENANCE REND BIEN auth.uid() = pro ==='
-- Elle est le SEUL endroit a changer le jour ou un salarie aura son acces.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select public.est_mon_entreprise('aaaa0000-0000-4000-8000-00000000aaaa') as la_mienne,
       public.est_mon_entreprise('bbbb0000-0000-4000-8000-00000000bbbb') as celle_d_un_autre,
       public.est_mon_entreprise(null) as personne;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. DEUX FOIS LE MEME NOM NE FONT QU UN CHANTIER ==='
-- « Toiture Charleval », « toiture charleval » et le meme avec une espace :
-- l index unique les ramene a un seul. C est la garde la plus importante du
-- lot, parce que l usage decrit etait « je remets chantier Martin ».
-- Attendu : 23505 (violation d unicite).
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
insert into public.chantiers (pro_id, titre)
values ('aaaa0000-0000-4000-8000-00000000aaaa', 'Toiture Charleval');
insert into public.chantiers (pro_id, titre)
values ('aaaa0000-0000-4000-8000-00000000aaaa', '  toiture charleval  ');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2 bis. MAIS DEUX ARTISANS PEUVENT AVOIR LE MEME NOM ==='
-- L unicite est PAR PRO. « Toiture Charleval » est un nom que deux
-- couvreurs du village peuvent tres bien employer tous les deux.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (pro_id, titre) values
  ('aaaa0000-0000-4000-8000-00000000aaaa', 'Toiture Charleval'),
  ('bbbb0000-0000-4000-8000-00000000bbbb', 'Toiture Charleval');
select count(*) as chantiers from public.chantiers;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. UN TITRE VIDE EST REFUSE ==='
-- Une bande de couvertures sans nom ne se lit pas. Attendu : 23514.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (pro_id, titre)
values ('aaaa0000-0000-4000-8000-00000000aaaa', '   ');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. JE NE CREE PAS UN CHANTIER AU NOM D UN AUTRE ==='
-- C est la fonction d appartenance qui garde la porte. Attendu : 42501.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
insert into public.chantiers (pro_id, titre)
values ('bbbb0000-0000-4000-8000-00000000bbbb', 'Chantier vole');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. UNE PUBLICATION NE REJOINT QUE MON CHANTIER ==='
-- La politique des publications ne regarde que `author_id` : sans le
-- declencheur, on accroche sa publication au dossier de quelqu un d autre.
-- Attendu : OP002, avec une phrase en francais.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (id, pro_id, titre)
values ('11110000-0000-4000-8000-000000001111',
        'bbbb0000-0000-4000-8000-00000000bbbb', 'Toiture Charleval');
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
insert into public.posts (author_id, type, texte, metier, chantier_id)
values ('aaaa0000-0000-4000-8000-00000000aaaa','photo','Je m invite.','macon',
        '11110000-0000-4000-8000-000000001111');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. LES COMPTEURS SE RECALCULENT, ET LA COUVERTURE EST LE RESULTAT ==='
-- La couverture est la publication la plus RECENTE qui porte une image :
-- personne n a envie de commencer par une toiture arrachee.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (id, pro_id, titre, ville)
values ('11110000-0000-4000-8000-000000001111',
        'bbbb0000-0000-4000-8000-00000000bbbb', 'Toiture Charleval', 'Charleval (13)');
insert into public.posts (author_id, type, texte, metier, chantier_id, media, created_at) values
  ('bbbb0000-0000-4000-8000-00000000bbbb','photo','Depose de la couverture.','couvreur',
   '11110000-0000-4000-8000-000000001111','photo-1.jpg', now() - interval '6 day'),
  ('bbbb0000-0000-4000-8000-00000000bbbb','photo','Pose des chevrons.','couvreur',
   '11110000-0000-4000-8000-000000001111','photo-2.jpg', now() - interval '4 day'),
  ('bbbb0000-0000-4000-8000-00000000bbbb','texte','Ecran sous-toiture pose.','couvreur',
   '11110000-0000-4000-8000-000000001111', null,         now() - interval '2 day'),
  ('bbbb0000-0000-4000-8000-00000000bbbb','photo','Chantier fini.','couvreur',
   '11110000-0000-4000-8000-000000001111','photo-4.jpg', now() - interval '1 day');
select nb_publications, couverture,
       (fin - debut) >= interval '4 day' as duree_coherente
  from public.chantiers where id = '11110000-0000-4000-8000-000000001111';
\echo '-- on retire la derniere : la couverture REDESCEND sur la precedente'
delete from public.posts where texte = 'Chantier fini.';
select nb_publications, couverture
  from public.chantiers where id = '11110000-0000-4000-8000-000000001111';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. SUPPRIMER UN CHANTIER NE DETRUIT PAS LES PUBLICATIONS ==='
-- `on delete set null` : on defait la couture, on ne jette pas neuf
-- publications avec leurs j aime et leurs commentaires.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (id, pro_id, titre)
values ('11110000-0000-4000-8000-000000001111',
        'bbbb0000-0000-4000-8000-00000000bbbb', 'Toiture Charleval');
insert into public.posts (author_id, type, texte, metier, chantier_id) values
  ('bbbb0000-0000-4000-8000-00000000bbbb','photo','Une.','couvreur','11110000-0000-4000-8000-000000001111'),
  ('bbbb0000-0000-4000-8000-00000000bbbb','photo','Deux.','couvreur','11110000-0000-4000-8000-000000001111');
set local role authenticated;
set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-00000000bbbb';
delete from public.chantiers where id = '11110000-0000-4000-8000-000000001111';
reset role;
select count(*) as publications_restantes,
       count(*) filter (where chantier_id is null) as decousues
  from public.posts;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. UN BLOCAGE CACHE LES CHANTIERS ==='
-- `chantiers_du_pro` est `security invoker` : la lecture passe par
-- « lecture chantiers », donc par le blocage.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (pro_id, titre)
values ('bbbb0000-0000-4000-8000-00000000bbbb', 'Toiture Charleval');
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
\echo '-- avant le blocage'
select count(*) as chantiers_lus
  from public.chantiers_du_pro('bbbb0000-0000-4000-8000-00000000bbbb');
insert into public.blocages (bloqueur_id, bloque_id)
values ('cccc0000-0000-4000-8000-00000000cccc','bbbb0000-0000-4000-8000-00000000bbbb');
\echo '-- apres'
select count(*) as chantiers_lus
  from public.chantiers_du_pro('bbbb0000-0000-4000-8000-00000000bbbb');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. LES CHANTIERS EN COURS PASSENT DEVANT ==='
-- Meme regle que `mes_demandes_recues()` : ce dont la suite va arriver
-- passe avant ce qui est regle, meme si c est plus ancien.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (pro_id, titre, statut, created_at) values
  ('bbbb0000-0000-4000-8000-00000000bbbb','Piscine Rogne','termine',  now() - interval '1 day'),
  ('bbbb0000-0000-4000-8000-00000000bbbb','Toiture Charleval','en_cours', now() - interval '30 day');
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select titre, statut from public.chantiers_du_pro('bbbb0000-0000-4000-8000-00000000bbbb');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. UNE PUBLICATION PEUT CHANGER DE CHANTIER ==='
-- Les deux compteurs doivent bouger : celui qu on quitte ET celui qu on
-- rejoint. Un declencheur qui n incrementerait que l arrivee laisserait le
-- premier faux pour toujours.
--
-- ET CET ESSAI SE FAIT AVEC UN JETON, ce qui n etait pas le cas avant le
-- 06/10/2026. Sans jeton, `auth.uid()` est vide, donc le verrou
-- `tient_le_texte()` ne s applique pas : l essai passait au vert pendant
-- que la VRAIE base refusait le deplacement en silence. Un essai qui ne
-- prouve rien est pire qu un essai absent.
--
-- `set local role` et `set local request.jwt.claim.sub` sont ecrits
-- chacun dans son propre ordre, JAMAIS dans un bloc `do` : dans un `do`,
-- la RLS n est pas appliquee (voir CLAUDE.md).
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (id, pro_id, titre) values
  ('11110000-0000-4000-8000-000000001111','bbbb0000-0000-4000-8000-00000000bbbb','Toiture Charleval'),
  ('22220000-0000-4000-8000-000000002222','bbbb0000-0000-4000-8000-00000000bbbb','Piscine Rogne');
insert into public.posts (id, author_id, type, texte, metier, chantier_id, media)
values ('33330000-0000-4000-8000-000000003333',
        'bbbb0000-0000-4000-8000-00000000bbbb','photo','Une.','couvreur',
        '11110000-0000-4000-8000-000000001111','photo-1.jpg');
\echo '-- avant'
select titre, nb_publications from public.chantiers order by titre;
set local role authenticated;
set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-00000000bbbb';
update public.posts set chantier_id = '22220000-0000-4000-8000-000000002222'
 where id = '33330000-0000-4000-8000-000000003333';
reset role;
\echo '-- apres le deplacement, PAR LE CHEMIN DE L APPLICATION'
select titre, nb_publications, couverture from public.chantiers order by titre;
\echo '-- et le reste de la publication est toujours verrouille'
select texte, media, likes_count from public.posts
 where id = '33330000-0000-4000-8000-000000003333';
rollback;

-- --------------------------------------------------------------------------
\echo '=== 10 bis. MAIS LE RESTE DE LA PUBLICATION NE BOUGE PAS ==='
-- Le verrou de la section 20.1 doit tenir sur tout le reste : laisser
-- passer `chantier_id` ne doit pas ouvrir `media` ni `likes_count`.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.posts (id, author_id, type, texte, metier, media, likes_count)
values ('44440000-0000-4000-8000-000000004444',
        'bbbb0000-0000-4000-8000-00000000bbbb','photo','Avant.','couvreur','vrai.jpg', 7);
set local role authenticated;
set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-00000000bbbb';
update public.posts set media = 'triche.jpg', likes_count = 9999, texte = 'Apres.'
 where id = '44440000-0000-4000-8000-000000004444';
reset role;
\echo '-- media et likes_count intacts, seul le texte a change'
select texte, media, likes_count from public.posts
 where id = '44440000-0000-4000-8000-000000004444';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. L EXPORT RGPD CONTIENT MES CHANTIERS ==='
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.chantiers (pro_id, titre)
values ('bbbb0000-0000-4000-8000-00000000bbbb', 'Toiture Charleval');
set local role authenticated;
set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-00000000bbbb';
select jsonb_array_length(public.mes_donnees() -> 'chantiers') as mes_chantiers;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select jsonb_array_length(public.mes_donnees() -> 'chantiers') as ceux_d_un_autre;
rollback;
