-- ==========================================================================
--  CE QUE SUPABASE FOURNIT D'OFFICE, ET QU'UN POSTGRESQL NU N'A PAS
--
--  À QUOI ÇA SERT, ET À QUOI ÇA NE SERT PAS
--  ----------------------------------------
--  `CLAUDE.md` demande depuis le début de rejouer `schema.sql` DEUX FOIS
--  sur un vrai PostgreSQL avant de l'appliquer. Rien dans le dépôt ne le
--  permettait : `schema.sql` appelle `auth.uid()`, écrit dans
--  `storage.buckets` et accorde des droits à `anon` et `authenticated` —
--  trois choses qu'un PostgreSQL ordinaire n'a pas. Chaque session
--  réécrivait donc ce prélude de mémoire, et il manquait toujours quelque
--  chose.
--
--  Ce fichier NE PART JAMAIS sur Supabase : là-bas, tout ceci existe déjà.
--  Il ne sert qu'à faire tourner le schéma hors de Supabase :
--
--      psql ... -f supabase/local-prelude.sql
--      psql ... -f supabase/schema.sql     # puis une SECONDE fois
--
--  LA LIGNE QUI A COÛTÉ UNE SÉRIE D'ESSAIS POUR RIEN
--  -------------------------------------------------
--  `alter default privileges ... grant all on tables`, tout en bas.
--  Sans elle, un essai de RLS échoue sur « permission denied for table »
--  AVANT que la politique ne s'applique : Supabase accorde les droits de
--  table à `anon` et `authenticated` sur tout ce qui naît dans `public`,
--  un PostgreSQL nu ne les accorde à personne. Les contrôles passaient
--  donc « au rouge » sur des règles parfaitement justes.
--
--  Et c'est bien `alter default privileges` et non un `grant on all
--  tables` : les tables n'existent pas encore au moment du prélude, et un
--  grant posé APRÈS le schéma annulerait les révocations de colonnes de la
--  section 18 — celles qui ferment `users.email` et `users.telephone`.
-- ==========================================================================
create extension if not exists pgcrypto;

-- LES RÔLES SONT À L'ÉCHELLE DE LA GRAPPE, PAS DE LA BASE — 05/10/2026.
-- Ce prélude existe pour qu'on puisse rejouer `schema.sql` hors de Supabase.
-- Il n'était lui-même pas rejouable : sur un serveur où il a déjà tourné une
-- fois, « create role anon » échoue par « role already exists », et
-- ON_ERROR_STOP arrête tout AVANT le schéma. On croit alors que c'est le
-- schéma qui est cassé.
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin', r);
    end if;
  end loop;
end $$;

create schema if not exists auth;
create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  -- Le déclencheur `cree_fiche_utilisateur()` du projet la lit : sans cette
  -- colonne, le moindre `insert` dans auth.users échoue.
  raw_user_meta_data jsonb
);

-- `auth.uid()` lit la même variable de session que chez Supabase.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create schema if not exists storage;
create table if not exists storage.buckets (
  id   text primary key,
  name text,
  public boolean default false,
  file_size_limit bigint
);
create table if not exists storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name      text,
  owner     uuid
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$
  select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 1)];
$$;

create publication supabase_realtime;

grant usage on schema public, auth, storage to anon, authenticated, service_role;

-- LES DROITS DE TABLE. Sans eux, un essai de RLS échoue sur « permission
-- denied for table » AVANT que la politique ne s'applique : il ne vérifie
-- donc RIEN. Voir l'en-tête.
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects, storage.buckets to anon, authenticated, service_role;
