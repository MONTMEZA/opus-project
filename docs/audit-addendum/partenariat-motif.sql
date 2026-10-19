\set ON_ERROR_STOP off
-- Réplique minimale des règles RELEVÉES sur la vraie base (pg_policies, 19/10/2026)
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
create table professional_profiles (id uuid primary key);
create table professional_partners (
  professional_id uuid references professional_profiles(id) on delete cascade,
  partner_id uuid references professional_profiles(id) on delete cascade,
  statut text not null default 'accepte' check (statut in ('en_attente','accepte','refuse')),
  repondu_le timestamptz, created_at timestamptz default now(),
  primary key (professional_id, partner_id),
  constraint pas_son_propre_partenaire check (professional_id <> partner_id));
alter table professional_partners enable row level security;
create policy "lecture partenaires" on professional_partners for select using (true);
create policy "lecture partenariats" on professional_partners for select using (statut = 'accepte' or auth.uid() = professional_id or auth.uid() = partner_id);
create policy "je demande un partenariat" on professional_partners for insert with check (auth.uid() = professional_id and statut = 'en_attente');
create policy "je reponds a un partenariat" on professional_partners for update using (auth.uid() = partner_id) with check (auth.uid() = partner_id);
grant select, insert, update, delete on professional_partners to authenticated;
insert into professional_profiles values
 ('aaaaaaaa-0000-0000-0000-000000000000'),('bbbbbbbb-0000-0000-0000-000000000000'),('cccccccc-0000-0000-0000-000000000000');
-- A demande à B (posé ici en superutilisateur, comme l'aurait fait l'insertion autorisée)
insert into professional_partners (professional_id, partner_id, statut) values
 ('aaaaaaaa-0000-0000-0000-000000000000','bbbbbbbb-0000-0000-0000-000000000000','en_attente');
\echo '--- cas 0 : la demande A -> B existe'
select professional_id, partner_id, statut from professional_partners;
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000000';
\echo '--- B (le destinataire) récrit le DEMANDEUR en C et accepte'
update professional_partners set professional_id = 'cccccccc-0000-0000-0000-000000000000', statut = 'accepte'
 where partner_id = 'bbbbbbbb-0000-0000-0000-000000000000';
commit;
\echo '--- résultat : un partenariat C <-> B accepté, que C n''a jamais demandé'
select professional_id, partner_id, statut from professional_partners;
