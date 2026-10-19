\set ON_ERROR_STOP off
-- Parade candidate : une clé étrangère « on delete set null » peut passer à NULL
-- sur un devis remis, et RIEN d'autre (ni vers une autre fiche).
create or replace function devis_se_fige() returns trigger language plpgsql as $$
declare garde jsonb;
begin
  if TG_OP = 'DELETE' then
    if not exists (select 1 from pros where id = old.pro_id) then return old; end if;
    if old.statut <> 'brouillon' then
      raise exception 'Ce devis est parti' using errcode = 'OP003';
    end if;
    return old;
  end if;
  if old.statut <> 'brouillon' then
    garde := to_jsonb(old) - 'statut' - 'signe_le';
    if new.client_id is null then garde := garde - 'client_id'; end if;
    if new.demande_id is null then garde := garde - 'demande_id'; end if;
    new := jsonb_populate_record(new, garde);
  end if;
  return new;
end $$;
truncate devis, clients, quote_requests cascade;
insert into clients values (10, 1);
insert into clients values (12, 1);
insert into quote_requests values (100);
insert into devis (id, pro_id, statut, total, client_id, demande_id) values (1, 1, 'remis', 500, 10, 100);
\echo '--- 1. on supprime la fiche et la demande : le devis doit passer à NULL, pas pendre'
delete from clients where id = 10;
delete from quote_requests where id = 100;
select id, statut, total, client_id, demande_id from devis;
\echo '--- 2. on tente de REDIRIGER le devis remis vers une autre fiche : doit rester NULL'
update devis set client_id = 12, total = 1 where id = 1;
select id, statut, total, client_id from devis;
