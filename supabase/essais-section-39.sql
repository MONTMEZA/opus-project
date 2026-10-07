-- ==========================================================================
--  ESSAIS DE LA SECTION 39 — le recit d un chantier
--
--  A lancer sur un PostgreSQL ou schema.sql vient d etre rejoue :
--    psql -f supabase/local-prelude.sql && psql -f supabase/schema.sql
--    psql -f supabase/essais-section-39.sql
--
--  CHAQUE ESSAI EST DANS SON PROPRE begin … rollback, et SURTOUT PAS dans
--  un bloc do : un essai de RLS ecrit dans un do ne prouve RIEN (la
--  politique with check n y est pas appliquee). Voir CLAUDE.md.
--
--  Et les essais qui touchent un verrou dependant de auth.uid() passent
--  par `set local role` + `set local request.jwt.claim.sub`, chacun dans
--  son propre ordre — la lecon du lot E, ou l essai 10 passait au vert
--  sans jeton, donc sans eprouver le verrou.
-- ==========================================================================
\set ON_ERROR_STOP off
\set moi   '''aaaa0000-0000-4000-8000-00000000aaaa'''
\set autre '''bbbb0000-0000-4000-8000-00000000bbbb'''

create or replace function pg_temp.jeu() returns uuid language plpgsql as $$
declare c uuid;
begin
  insert into auth.users (id, email) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'moi39@exemple.test'),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'autre39@exemple.test')
  on conflict (id) do nothing;
  insert into public.users (id, email, nom, type) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'moi39@exemple.test', 'Moi', 'pro'),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'autre39@exemple.test', 'Autre', 'pro')
  on conflict (id) do update set nom = excluded.nom;
  insert into public.professional_profiles (id, entreprise, metiers, ville) values
    ('aaaa0000-0000-4000-8000-00000000aaaa', 'Moi SARL',   array['macon'], 'Lambesc'),
    ('bbbb0000-0000-4000-8000-00000000bbbb', 'Autre SARL', array['macon'], 'Lambesc')
  on conflict (id) do update set entreprise = excluded.entreprise;

  insert into public.chantiers (pro_id, titre, ville)
  values ('aaaa0000-0000-4000-8000-00000000aaaa', 'Toiture Charleval', 'Charleval')
  on conflict (pro_id, lower(btrim(titre))) do update set ville = excluded.ville
  returning id into c;
  return c;
end $$;

\echo '=== 1. UN CHANTIER NAIT SANS RECIT ==='
begin;
select pg_temp.jeu() as chantier \gset
select recit is null as pas_de_recit, recit_ecrit_le is null as pas_de_date
  from public.chantiers where id = :'chantier';
rollback;

\echo '=== 2. ECRIRE LE RECIT POSE LA DATE TOUT SEUL ==='
-- L application n envoie JAMAIS recit_ecrit_le : un indicateur qui depend
-- de l horloge du telephone peut mentir.
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers set recit = 'Nous avons commence par deposer l ancienne couverture.'
 where id = :'chantier';
select recit_ecrit_le is not null as date_posee,
       recit_ecrit_le >= now() - interval '1 minute' as date_fraiche
  from public.chantiers where id = :'chantier';
rollback;

\echo '=== 3. UNE DATE ENVOYEE PAR LE CLIENT EST IGNOREE ==='
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers
   set recit = 'Un texte.', recit_ecrit_le = '2001-01-01'::timestamptz
 where id = :'chantier';
select recit_ecrit_le > '2020-01-01'::timestamptz as la_base_a_decide
  from public.chantiers where id = :'chantier';
rollback;

\echo '=== 4. LE RECIT NE BOUGE PAS => SA DATE NON PLUS ==='
-- Sinon renommer un chantier rajeunirait son recit, et l avertissement
-- « des etapes ont ete ajoutees depuis » s eteindrait tout seul.
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers set recit = 'Un texte.' where id = :'chantier';
select recit_ecrit_le as avant from public.chantiers where id = :'chantier' \gset
select pg_sleep(0.05);
update public.chantiers set titre = 'Toiture Charleval' where id = :'chantier';
select recit_ecrit_le = :'avant'::timestamptz as date_inchangee
  from public.chantiers where id = :'chantier';
rollback;

\echo '=== 5. EFFACER LE RECIT EFFACE SA DATE ==='
-- « Ecrit le 7 octobre » ne doit pas survivre a un recit qui n existe plus.
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers set recit = 'Un texte.' where id = :'chantier';
update public.chantiers set recit = null where id = :'chantier';
select recit is null as plus_de_recit, recit_ecrit_le is null as plus_de_date
  from public.chantiers where id = :'chantier';
rollback;

\echo '=== 6. UNE CHAINE DE BLANCS N EST PAS UN RECIT ==='
-- Une seule facon de dire « il n y en a pas » : null.
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers set recit = '   ' where id = :'chantier';
select recit is null as ramene_a_null, recit_ecrit_le is null as sans_date
  from public.chantiers where id = :'chantier';
rollback;

\echo '=== 7. UN RECIT TROP LONG EST REFUSE ==='
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers set recit = repeat('a', 2001) where id = :'chantier';
rollback;

\echo '=== 8. …ET 2000 PASSE ==='
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers set recit = repeat('a', 2000) where id = :'chantier';
select char_length(recit) as longueur from public.chantiers where id = :'chantier';
rollback;

\echo '=== 9. UN AUTRE PRO NE PEUT PAS ECRIRE MON RECIT ==='
-- LE CAS QUI COMPTE. Sans jeton, auth.uid() est vide et la politique ne
-- s applique pas : cet essai passerait au vert sans rien eprouver.
begin;
select pg_temp.jeu() as chantier \gset
set local role authenticated;
set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-00000000bbbb';
update public.chantiers set recit = 'Je vole la vitrine du voisin.' where id = :'chantier';
\echo '-- doit afficher UPDATE 0 :'
reset role;
select recit is null as recit_intact from public.chantiers where id = :'chantier';
rollback;

\echo '=== 10. …ET SON PROPRIETAIRE, SI ==='
begin;
select pg_temp.jeu() as chantier \gset
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
update public.chantiers set recit = 'Nous avons depose la couverture.' where id = :'chantier';
reset role;
select recit is not null as recit_ecrit, recit_ecrit_le is not null as date_posee
  from public.chantiers where id = :'chantier';
rollback;

\echo '=== 11. LE RECIT EST PUBLIC — c est la vitrine ==='
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers set recit = 'Un beau chantier.' where id = :'chantier';
set local role anon;
select count(*) as ce_qu_un_visiteur_lit
  from public.chantiers where id = :'chantier' and recit is not null;
reset role;
rollback;

\echo '=== 12. L EXPORT RGPD EMPORTE LE RECIT ==='
begin;
select pg_temp.jeu() as chantier \gset
update public.chantiers set recit = 'Un texte exporte.' where id = :'chantier';
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-00000000aaaa';
select (public.mes_donnees()->'chantiers'->0->>'recit') as recit_exporte;
reset role;
rollback;

\echo '=== 13. SUPPRIMER LE CHANTIER EMPORTE LE RECIT, PAS LES ETAPES ==='
-- Section 36 : on delete set null sur posts.chantier_id.
begin;
select pg_temp.jeu() as chantier \gset
insert into public.posts (author_id, type, texte, chantier_id)
values ('aaaa0000-0000-4000-8000-00000000aaaa', 'photo', 'Depose de la couverture.', :'chantier');
update public.chantiers set recit = 'Un texte.' where id = :'chantier';
delete from public.chantiers where id = :'chantier';
select count(*) as publications_restantes from public.posts
 where author_id = 'aaaa0000-0000-4000-8000-00000000aaaa';
select count(*) as publications_decousues from public.posts
 where author_id = 'aaaa0000-0000-4000-8000-00000000aaaa' and chantier_id is null;
rollback;

\echo ''
\echo '=== FIN DES ESSAIS DE LA SECTION 39 ==='
