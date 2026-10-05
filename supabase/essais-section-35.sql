-- ==========================================================================
--  ESSAIS DE LA SECTION 35 — les vues
--
--      psql -h 127.0.0.1 -p 5444 -U postgres -d opus35 \
--           -f supabase/essais-section-35.sql
--
--  CE QU'IL FAUT ÉPROUVER, ET QUI NE SE VOIT PAS À L'ŒIL
--  -----------------------------------------------------
--  Un compteur de vues peut être faux de six façons, et aucune ne lève
--  d'erreur : compter deux fois la même personne, compter l'auteur
--  lui-même, compter quelqu'un qu'on a bloqué, laisser quelqu'un gonfler le
--  compteur d'un autre, laisser l'artisan LIRE qui l'a regardé, et perdre
--  dix-neuf publications sur vingt parce qu'une seule était interdite.
--
--  ET SURTOUT PAS DANS UN BLOC `do $$ … $$` — constaté le 01/10/2026 : à
--  l'intérieur d'un `do`, les politiques RLS ne sont PAS appliquées et un
--  essai de sécurité y passe au vert sans rien éprouver. Toute cette
--  section repose sur la RLS : c'est donc `set local role` puis l'ordre,
--  chacun dans son propre appel.
--
--  Chaque cas dans son `begin … rollback`, et le jeu d'essai est recompté à
--  chaque fois : un essai de sécurité doit d'abord prouver que la donnée
--  EXISTE.
-- ==========================================================================

\set MACON  '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set CLIENT '''cccc0000-0000-4000-8000-00000000cccc'''
\set AUTRE  '''dddd0000-0000-4000-8000-00000000dddd'''

create or replace function pg_temp.jeu_dessai() returns void
language plpgsql as $$
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'macon@exemple-opus.test',
     jsonb_build_object('type','pro','nom','Macon','entreprise','Macon',
       'metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
    ('cccc0000-0000-4000-8000-00000000cccc', 'client@exemple-opus.test',
     jsonb_build_object('type','particulier','nom','Julie')),
    ('dddd0000-0000-4000-8000-00000000dddd', 'autre@exemple-opus.test',
     jsonb_build_object('type','particulier','nom','Marc'));

  insert into public.posts (id, author_id, type, texte, metier) values
    ('11110000-0000-4000-8000-000000001111',
     'aaaa0000-0000-4000-8000-00000000aaaa','photo','Mur a Lambesc.','macon'),
    ('22220000-0000-4000-8000-000000002222',
     'aaaa0000-0000-4000-8000-00000000aaaa','video','Video a Lambesc.','macon');

  -- Une publicite : aucun auteur. Elle doit compter ses vues comme le reste.
  insert into public.posts (id, type, texte, is_ad, annonceur, accroche, cta)
  values ('33330000-0000-4000-8000-000000003333','photo','Promo.',true,
          'Une marque','Promo','Voir');
end $$;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. UNE VUE COMPTE UNE FOIS, MEME EN INSISTANT ==='
-- Descendre et remonter le fil dix fois ne fait pas dix vues : la cle
-- primaire (post_id, spectateur_id) est la regle.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]) as inserees_1er_appel;
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]) as inserees_2e_appel;
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]) as inserees_3e_appel;
reset role;
select vues_count from public.posts where id = '11110000-0000-4000-8000-000000001111';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. DEUX PERSONNES DIFFERENTES FONT DEUX VUES ==='
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]);
set local request.jwt.claim.sub = 'dddd0000-0000-4000-8000-00000000dddd';
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]);
reset role;
select vues_count from public.posts where id = '11110000-0000-4000-8000-000000001111';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. L AUTEUR NE SE COMPTE PAS LUI-MEME ==='
-- Sinon le chiffre mesure l anxiete de l artisan, pas l interet du public.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select public.enregistrer_vues(array[
  '11110000-0000-4000-8000-000000001111',
  '22220000-0000-4000-8000-000000002222']::uuid[]) as inserees;
reset role;
select id, vues_count from public.posts
 where id in ('11110000-0000-4000-8000-000000001111',
              '22220000-0000-4000-8000-000000002222') order by id;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3 bis. ET IL NE PEUT PAS NON PLUS LE FAIRE A LA MAIN ==='
-- La fonction pre-filtre ; la politique, elle, garde la porte contre un
-- appel direct. Attendu : 42501.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
insert into public.post_vues (post_id, spectateur_id)
values ('11110000-0000-4000-8000-000000001111',
        'aaaa0000-0000-4000-8000-00000000aaaa');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. ON NE COMPTE PAS UNE VUE AU NOM DE QUELQU UN D AUTRE ==='
-- Attendu : 42501. Sans cette garde, n importe qui gonfle n importe quoi.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
insert into public.post_vues (post_id, spectateur_id)
values ('11110000-0000-4000-8000-000000001111',
        'dddd0000-0000-4000-8000-00000000dddd');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. UN BLOCAGE EMPECHE LA VUE ==='
-- La fonction est `security invoker` : le `select` sur public.posts est
-- filtre par « lecture posts », donc par le blocage. La publication ne sort
-- pas du select, donc elle n entre pas dans l insert.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
\echo '-- avant le blocage'
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]) as inserees;
insert into public.blocages (bloqueur_id, bloque_id)
values ('cccc0000-0000-4000-8000-00000000cccc','aaaa0000-0000-4000-8000-00000000aaaa');
\echo '-- apres le blocage, sur l AUTRE publication du meme auteur'
select public.enregistrer_vues(array['22220000-0000-4000-8000-000000002222']::uuid[]) as inserees;
reset role;
select id, vues_count from public.posts
 where id in ('11110000-0000-4000-8000-000000001111',
              '22220000-0000-4000-8000-000000002222') order by id;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. UN LOT MELANGE N EST PAS PERDU EN ENTIER ==='
-- C est le piege du lot : un `insert … select` dont UNE ligne viole la
-- politique echoue ENTIEREMENT. On envoie ici trois identifiants dont DEUX
-- sont interdits — une publication d un auteur bloque, et une publication
-- a soi — plus une publicite. Attendu : 1 inseree, et SURTOUT aucune
-- erreur : les identifiants recevables ne sont pas perdus avec les autres.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.posts (id, author_id, type, texte, metier)
values ('44440000-0000-4000-8000-000000004444',
        'dddd0000-0000-4000-8000-00000000dddd','photo','Post de Marc.','macon');
set local role authenticated;
set local request.jwt.claim.sub = 'dddd0000-0000-4000-8000-00000000dddd';
insert into public.blocages (bloqueur_id, bloque_id)
values ('dddd0000-0000-4000-8000-00000000dddd','aaaa0000-0000-4000-8000-00000000aaaa');
select public.enregistrer_vues(array[
  '11110000-0000-4000-8000-000000001111',   -- auteur bloque
  '44440000-0000-4000-8000-000000004444',   -- la mienne
  '33330000-0000-4000-8000-000000003333'    -- une publicite
]::uuid[]) as inserees;
reset role;
select id, vues_count from public.posts where vues_count > 0 order by id;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. L ARTISAN VOIT COMBIEN, JAMAIS QUI ==='
-- Le coeur de ce lot. L auteur lit son compteur et ZERO ligne de detail.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]);
\echo '-- le spectateur lit SA propre ligne'
select count(*) as lignes_vues from public.post_vues;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
\echo '-- l auteur de la publication n en lit AUCUNE'
select count(*) as lignes_vues from public.post_vues;
\echo '-- mais il lit bien son compteur'
select vues_count from public.posts where id = '11110000-0000-4000-8000-000000001111';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. LE COMPTEUR NE DESCEND PAS QUAND UN COMPTE PART ==='
-- Une vue a EU LIEU. La ligne est une donnee personnelle et elle part ;
-- le chiffre, lui, est un fait sur la publication.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]);
reset role;
\echo '-- avant'
select (select vues_count from public.posts where id = '11110000-0000-4000-8000-000000001111') as compteur,
       (select count(*) from public.post_vues) as lignes;
delete from auth.users where id = 'cccc0000-0000-4000-8000-00000000cccc';
\echo '-- apres la suppression du compte du spectateur'
select (select vues_count from public.posts where id = '11110000-0000-4000-8000-000000001111') as compteur,
       (select count(*) from public.post_vues) as lignes;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. UNE VUE NE SE RETIRE NI NE SE CORRIGE ==='
-- Aucune politique `update`, aucune politique `delete` : 0 ligne touchee,
-- sans erreur. C est voulu — comme une piece jointe envoyee.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]);
with d as (delete from public.post_vues returning 1)
select count(*) as lignes_supprimees from d;
with u as (update public.post_vues set created_at = now() returning 1)
select count(*) as lignes_modifiees from u;
reset role;
select count(*) as lignes_restantes from public.post_vues;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. LA BORNE DE CINQUANTE ==='
-- Les identifiants viennent du CLIENT. On en envoie 60 valides : seuls les
-- 50 premiers sont retenus.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
insert into public.posts (author_id, type, texte, metier)
select 'aaaa0000-0000-4000-8000-00000000aaaa', 'photo', 'Post ' || g, 'macon'
  from generate_series(1, 60) g;
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select public.enregistrer_vues(
  (select array_agg(id) from public.posts where texte like 'Post %')) as inserees;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. L EXPORT RGPD CONTIENT CE QUE J AI REGARDE ==='
-- « Ce que j ai regarde » est une donnee personnelle sur MOI.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]);
select jsonb_array_length(public.mes_donnees() -> 'publications_vues') as vues_exportees;
\echo '-- et l export de l AUTEUR n en contient aucune'
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select jsonb_array_length(public.mes_donnees() -> 'publications_vues') as vues_exportees;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 12. UNE VUE NE MARQUE PAS LA PUBLICATION « MODIFIEE » ==='
-- Le declencheur `tient_le_texte` se declenche sur tout UPDATE de posts.
-- `pg_trigger_depth()` doit le faire passer son tour ici.
-- --------------------------------------------------------------------------
begin;
select pg_temp.jeu_dessai();
set local role authenticated;
set local request.jwt.claim.sub = 'cccc0000-0000-4000-8000-00000000cccc';
select public.enregistrer_vues(array['11110000-0000-4000-8000-000000001111']::uuid[]);
reset role;
select vues_count, modifie_le is null as jamais_modifiee
  from public.posts where id = '11110000-0000-4000-8000-000000001111';
rollback;
