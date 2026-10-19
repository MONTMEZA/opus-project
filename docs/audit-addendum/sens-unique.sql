\set ON_ERROR_STOP off
drop table if exists d3_devis, d3_qr cascade;
create table d3_qr (id int primary key);
create table d3_devis (id int primary key, statut text not null default 'brouillon',
  source text not null default 'manuelle',
  quote_request_id int references d3_qr(id) on delete set null,
  constraint d3_sens_unique_check check (source <> 'demande' or quote_request_id is not null));
insert into d3_qr values (100);
insert into d3_devis values (1, 'brouillon', 'demande', 100);
\echo '--- le particulier part : sa demande est supprimée (comme preparer_suppression_compte)'
select count(*) as demandes_avant from d3_qr;
delete from d3_qr where id = 100;
select count(*) as demandes_apres from d3_qr;
select * from d3_devis;
