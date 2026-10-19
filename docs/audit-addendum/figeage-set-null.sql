\set ON_ERROR_STOP off
drop table if exists devis, clients, quote_requests, pros cascade;
create table pros (id int primary key);
create table clients (id int primary key, pro_id int references pros(id) on delete cascade);
create table quote_requests (id int primary key);
create table devis (
  id int primary key,
  pro_id int references pros(id) on delete cascade,
  statut text not null default 'brouillon',
  total int,
  signe_le timestamptz,
  client_id int references clients(id) on delete set null,
  demande_id int references quote_requests(id) on delete set null
);
-- la forme du PLAN §3.3 (PLAN-DEVIS.md:868-890), liste blanche statut + signe_le
create or replace function devis_se_fige() returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    if not exists (select 1 from pros where id = old.pro_id) then return old; end if;
    if old.statut <> 'brouillon' then
      raise exception 'Ce devis est parti' using errcode = 'OP003';
    end if;
    return old;
  end if;
  if old.statut <> 'brouillon' then
    new := jsonb_populate_record(new, to_jsonb(old) - 'statut' - 'signe_le');
  end if;
  return new;
end $$;
create trigger trg_devis_se_fige before update or delete on devis
  for each row execute function devis_se_fige();

insert into pros values (1);
insert into clients values (10, 1), (11, 1);
insert into quote_requests values (100), (101);
insert into devis (id, pro_id, statut, total, client_id, demande_id) values
  (1, 1, 'remis', 500, 10, 100),
  (2, 1, 'brouillon', 300, 11, 101);

\echo '--- CAS A : le pro supprime la fiche client d''un devis REMIS (droit a l''effacement)'
select count(*) as clients_avant from clients;
delete from clients where id = 10;
select count(*) as clients_apres from clients;
select id, statut, client_id from devis order by id;
\echo '--- verification de l''integrite : un devis pointe-t-il une fiche absente ?'
select d.id, d.client_id from devis d left join clients c on c.id = d.client_id where d.client_id is not null and c.id is null;

\echo '--- CAS B : le particulier supprime son compte -> quote_requests part en cascade'
select count(*) as qr_avant from quote_requests;
delete from quote_requests where id = 100;
select count(*) as qr_apres from quote_requests;
select id, statut, demande_id from devis order by id;
select d.id, d.demande_id from devis d left join quote_requests q on q.id = d.demande_id where d.demande_id is not null and q.id is null;

\echo '--- TEMOIN : meme chose sur un BROUILLON'
delete from clients where id = 11;
delete from quote_requests where id = 101;
select id, statut, client_id, demande_id from devis order by id;
