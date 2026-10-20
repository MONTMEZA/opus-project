-- ==========================================================================
--  ESSAI DU RATTRAPAGE DE LA SECTION 47 (lot T) — sur la base que le
--  propriétaire a RÉELLEMENT
--
--  Le rattrapage de 47.2 ne tourne qu'UNE fois (sa garde est l'absence de la
--  colonne `taux_horaire_centimes`). Il ne s'éprouve donc pas sur une base
--  neuve au nouveau schéma — il n'y aurait rien à rattraper —, mais sur la
--  version de `schema.sql` que la vraie base a reçue : celle du commit
--  d0560e8 (le lot 0a), avec des données « d'avant » qui imitent les cas
--  qu'on peut y rencontrer (CLAUDE.md : « la bonne base de départ n'est pas
--  schema.sql d'aujourd'hui mais celle de la version réellement appliquée »).
--
--  CE FICHIER SE JOUE EN QUATRE MOITIÉS, choisies par la variable `moitie` :
--
--    avant          les données d'avant, sur le schéma de d0560e8 ;
--    apres          les vérifications, après le NOUVEAU schéma ;
--    retrait        le retrait des colonnes mortes, SIMULÉ (le lot de
--                   nettoyage qui viendra un jour) ;
--    apres_retrait  après le nouveau schéma rejoué sur cette base-là.
--
--  LA PROCÉDURE, en entier (base `opus_rattrapage`, PostgreSQL 16) :
--
--    P="psql -h /tmp -p 5433 -U postgres -X -d opus_rattrapage"
--    git show d0560e8:supabase/schema.sql > /tmp/schema-d0560e8.sql
--    $P -v ON_ERROR_STOP=1 -f supabase/local-prelude.sql
--    $P -v ON_ERROR_STOP=1 -f /tmp/schema-d0560e8.sql     # deux fois
--    $P -v ON_ERROR_STOP=1 -f /tmp/schema-d0560e8.sql
--    $P -v ON_ERROR_STOP=1 -v moitie=avant -f supabase/essais-section-47-rattrapage.sql
--    $P -v ON_ERROR_STOP=1 -f supabase/schema.sql         # NOTER LA NOTICE :
--        « Section 47 : 4 ligne(s) de tarifs créées ou complétées ;
--          4 ligne(s) SOS dont une valeur n'a pas été copiée ;
--          1 ligne(s) SOS éteinte(s). »
--    $P -v ON_ERROR_STOP=0 -v moitie=apres -f supabase/essais-section-47-rattrapage.sql
--    $P -v ON_ERROR_STOP=1 -f supabase/schema.sql         # ENCORE : aucune notice
--    $P -v ON_ERROR_STOP=0 -v moitie=apres -f supabase/essais-section-47-rattrapage.sql
--        # les MÊMES résultats : rejouer ne refait rien
--    $P -v ON_ERROR_STOP=1 -v moitie=retrait -f supabase/essais-section-47-rattrapage.sql
--    $P -v ON_ERROR_STOP=1 -f supabase/schema.sql         # deux fois, aucune
--    $P -v ON_ERROR_STOP=1 -f supabase/schema.sql         # erreur
--    $P -v ON_ERROR_STOP=0 -v moitie=apres_retrait -f supabase/essais-section-47-rattrapage.sql
--
--  La NOTICE n'est lisible que dans `psql` : sur la vraie base, la preuve
--  du rattrapage est un relevé de forme avant et après (cahier §8.2).
--
--  LES DONNÉES D'AVANT — six artisans, une ligne SOS chacun (deux pour R6),
--  et ce que le rattrapage doit en faire :
--
--    R1  plombier, SOS 45 / 62 / 40 actif, aucune ligne de tarifs
--        → 4500 / 6200 / 40 copiés, `affiche` faux, SOS toujours actif ;
--    R2  MAÇON, SOS « électricité » 0 / 0 / 0 actif — la ligne du
--        propriétaire, reproduite → rien copié, SOS ÉTEINT ;
--    R3  plombier, SOS 35 / 55 / 25, des frais de devis DÉJÀ déclarés (30 €)
--        → les frais du devis gagnent (3000), taux 5500, majoration 25 ;
--    R4  serrurier, SOS 20 000 / 0,50 / 0 — hors des bornes → rien copié ;
--    R5  chauffagiste, SOS 45 / 60 / 30, des frais en CONDITIONS SEULES
--        → aucun montant collé aux conditions, taux 6000, majoration 30 ;
--    R6  plombier, deux lignes SOS : « plomberie » active 40 / 50 / 20,
--        « chauffage » inactive 99 / 99 / 99, plus récente
--        → la ligne ACTIVE est copiée (4000 / 5000 / 20).
--
--  Un particulier Q, à un kilomètre de R1, lit la recherche : le
--  rattrapage n'a RIEN publié (`affiche` n'est jamais allumé par une
--  migration), et la donnée est pourtant là — on le prouve dans une
--  transaction annulée.
--
--  SIRET FICTIFS à clé de Luhn juste, propres à ce fichier, vérifiés
--  inconnus du répertoire Sirene (INSEE) le 19/10/2026.
-- ==========================================================================

\if :{?moitie}
\else
  \echo 'Indiquez la moitié : -v moitie=avant | apres | retrait | apres_retrait (voir l en-tête).'
  \quit
\endif

\set R1 '''a4710000-0000-4000-8000-000000000001'''
\set R2 '''a4710000-0000-4000-8000-000000000002'''
\set R3 '''a4710000-0000-4000-8000-000000000003'''
\set R4 '''a4710000-0000-4000-8000-000000000004'''
\set R5 '''a4710000-0000-4000-8000-000000000005'''
\set R6 '''a4710000-0000-4000-8000-000000000006'''
\set Q '''a4710000-0000-4000-8000-00000000000e'''

select :'moitie' = 'avant' as m_avant, :'moitie' = 'apres' as m_apres,
       :'moitie' = 'retrait' as m_retrait, :'moitie' = 'apres_retrait' as m_apres_retrait \gset


-- ==========================================================================
\if :m_avant
\echo ''
\echo '=== AVANT — les donnees, en superutilisateur, sur le schema de d0560e8 ==='
-- ==========================================================================
delete from auth.users where id::text like 'a4710000-%';

insert into public.preuves_siret
  (siret, denomination, est_ei, forme_juridique, est_siege, tva, adresse, code_postal, commune,
   statut_diffusion, maj_insee, source, expire_le, pour_email) values
  ('00004740700010', 'RATTRAPAGE R1', false, '5499', true, null, '1 RUE R1 29200 BREST', '29200', 'BREST',
   'O', '2026-09-02', 'registre', now() + interval '1 hour', null),
  ('00004750600019', 'RATTRAPAGE R2', false, '5499', true, null, '2 RUE R2 29000 QUIMPER', '29000', 'QUIMPER',
   'O', '2026-09-02', 'registre', now() + interval '1 hour', null),
  ('00004760500019', 'RATTRAPAGE R3', false, '5499', true, null, '3 RUE R3 35000 RENNES', '35000', 'RENNES',
   'O', '2026-09-02', 'registre', now() + interval '1 hour', null),
  ('00004770400010', 'RATTRAPAGE R4', false, '5499', true, null, '4 RUE R4 56100 LORIENT', '56100', 'LORIENT',
   'O', '2026-09-02', 'registre', now() + interval '1 hour', null),
  ('00004780300010', 'RATTRAPAGE R5', false, '5499', true, null, '5 RUE R5 22000 SAINT-BRIEUC', '22000', 'SAINT-BRIEUC',
   'O', '2026-09-02', 'registre', now() + interval '1 hour', null),
  ('00004790200010', 'RATTRAPAGE R6', false, '5499', true, null, '6 RUE R6 29600 MORLAIX', '29600', 'MORLAIX',
   'O', '2026-09-02', 'registre', now() + interval '1 hour', null)
on conflict (siret) do update set expire_le = excluded.expire_le;

begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:R1,'r1-4710@exemple-opus.test',jsonb_build_object('type','pro','siret','00004740700010','nom','R1','entreprise','R1',
   'metiers',jsonb_build_array('plombier'),'ville','Brest (29)','latitude','48.3904','longitude','-4.4861')),
 (:R2,'r2-4710@exemple-opus.test',jsonb_build_object('type','pro','siret','00004750600019','nom','R2','entreprise','R2',
   'metiers',jsonb_build_array('macon'),'ville','Quimper (29)','latitude','47.9960','longitude','-4.1020')),
 (:R3,'r3-4710@exemple-opus.test',jsonb_build_object('type','pro','siret','00004760500019','nom','R3','entreprise','R3',
   'metiers',jsonb_build_array('plombier'),'ville','Rennes (35)','latitude','48.1173','longitude','-1.6778')),
 (:R4,'r4-4710@exemple-opus.test',jsonb_build_object('type','pro','siret','00004770400010','nom','R4','entreprise','R4',
   'metiers',jsonb_build_array('serrurier'),'ville','Lorient (56)','latitude','47.7483','longitude','-3.3700')),
 (:R5,'r5-4710@exemple-opus.test',jsonb_build_object('type','pro','siret','00004780300010','nom','R5','entreprise','R5',
   'metiers',jsonb_build_array('chauffagiste'),'ville','Saint-Brieuc (22)','latitude','48.5141','longitude','-2.7603')),
 (:R6,'r6-4710@exemple-opus.test',jsonb_build_object('type','pro','siret','00004790200010','nom','R6','entreprise','R6',
   'metiers',jsonb_build_array('plombier'),'ville','Morlaix (29)','latitude','48.5775','longitude','-3.8278')),
 (:Q,'q-4710@exemple-opus.test',jsonb_build_object('type','particulier','nom','Q','ville','Brest (29)',
   'latitude','48.4000','longitude','-4.4800'));

insert into public.sos_availability
  (professional_id, metier_key, actif, deplacement, horaire, majoration, rayon_km, delai_minutes, updated_at) values
  (:R1, 'plomberie',   true,  45.00,    62.00, 40, 20, 45, now()),
  (:R2, 'electricite', true,   0,        0,     0, 20, 45, now()),
  (:R3, 'plomberie',   true,  35.00,    55.00, 25, 20, 45, now()),
  (:R4, 'serrurerie',  true,  20000.00,  0.50,  0, 20, 45, now()),
  (:R5, 'chauffage',   true,  45.00,    60.00, 30, 20, 45, now()),
  (:R6, 'plomberie',   true,  40.00,    50.00, 20, 20, 45, now() - interval '1 day'),
  (:R6, 'chauffage',   false, 99.00,    99.00, 99, 20, 45, now());

insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:R3, 3000);
insert into public.tarifs_pro (pro_id, frais_deplacement_texte)
values (:R5, 'Gratuit jusqu’à 20 km, puis 0,50 € du kilomètre');
commit;

select count(*) as fiches_attendu_6 from public.professional_profiles where id::text like 'a4710000-%';
select count(*) as lignes_sos_attendu_7,
       count(*) filter (where deplacement <> 0 or horaire <> 0 or majoration <> 0) as non_nulles_attendu_6
  from public.sos_availability where professional_id::text like 'a4710000-%';
select count(*) as lignes_tarifs_attendu_2 from public.tarifs_pro where pro_id::text like 'a4710000-%';
\endif


-- ==========================================================================
\if :m_apres
\echo ''
\echo '=== APRES — ce que le rattrapage a fait, ligne par ligne ==='
-- ==========================================================================
select case t.pro_id when :R1 then 'R1' when :R2 then 'R2' when :R3 then 'R3'
                     when :R4 then 'R4' when :R5 then 'R5' when :R6 then 'R6' end as r,
       t.frais_deplacement_centimes as frais, t.frais_deplacement_texte is not null as conditions,
       t.taux_horaire_centimes as taux, t.majoration_pct as maj,
       t.affiche, t.affiche_le is null as affiche_le_null
  from public.tarifs_pro t where t.pro_id::text like 'a4710000-%' order by 1;
select (select frais_deplacement_centimes = 4500 and taux_horaire_centimes = 6200 and majoration_pct = 40
               and affiche is false and affiche_le is null from public.tarifs_pro where pro_id = :R1) as r1_attendu_t,
       (select count(*) = 0 from public.tarifs_pro where pro_id = :R2) as r2_aucune_ligne_attendu_t,
       (select frais_deplacement_centimes = 3000 and taux_horaire_centimes = 5500 and majoration_pct = 25
          from public.tarifs_pro where pro_id = :R3) as r3_le_devis_gagne_attendu_t,
       (select count(*) = 0 from public.tarifs_pro where pro_id = :R4) as r4_aucune_ligne_attendu_t,
       (select frais_deplacement_centimes is null
               and frais_deplacement_texte = 'Gratuit jusqu’à 20 km, puis 0,50 € du kilomètre'
               and taux_horaire_centimes = 6000 and majoration_pct = 30
          from public.tarifs_pro where pro_id = :R5) as r5_conditions_intactes_attendu_t,
       (select frais_deplacement_centimes = 4000 and taux_horaire_centimes = 5000 and majoration_pct = 20
          from public.tarifs_pro where pro_id = :R6) as r6_la_ligne_active_attendu_t;
select count(*) filter (where affiche) as affichees_attendu_0
  from public.tarifs_pro where pro_id::text like 'a4710000-%';

\echo ''
\echo '--- les disponibilites : R2 eteinte (macon sur l electricite), les autres comme avant'
select case sa.professional_id when :R1 then 'R1' when :R2 then 'R2' when :R3 then 'R3'
                               when :R4 then 'R4' when :R5 then 'R5' when :R6 then 'R6' end as r,
       sa.metier_key, sa.actif
  from public.sos_availability sa where sa.professional_id::text like 'a4710000-%' order by 1, 2;
select (select actif from public.sos_availability where professional_id = :R1) as r1_actif_attendu_t,
       (select actif from public.sos_availability where professional_id = :R2) as r2_eteinte_attendu_f;

\echo ''
\echo '--- les colonnes mortes : les SEPT lignes a 0 / 0 / 0'
select count(*) as lignes_attendu_7,
       count(*) filter (where deplacement = 0 and horaire = 0 and majoration = 0) as a_zero_attendu_7
  from public.sos_availability where professional_id::text like 'a4710000-%';

\echo ''
\echo '--- la recherche par Q : la donnee est LA (transaction annulee) mais rien n est publie'
begin;
update public.tarifs_pro set affiche = true where pro_id = :R1;
set local role authenticated;
set local request.jwt.claim.sub = :Q;
select count(*) as r1_si_affiche_attendu_1 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = :Q;
select count(*) as rien_de_publie_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
select count(*) as tarifs_lus_par_q_attendu_0 from public.tarifs_pro;
rollback;
\endif


-- ==========================================================================
\if :m_retrait
\echo ''
\echo '=== RETRAIT — les colonnes mortes retirees, comme le fera un jour le lot de nettoyage ==='
-- Ici en local, par psql. Sur la vraie base, le connecteur refuse
-- `drop column` : ce retrait appartiendra au propriétaire, fichier et base
-- ensemble.
-- ==========================================================================
alter table public.sos_availability
  drop column deplacement, drop column horaire, drop column majoration;
select count(*) as colonnes_mortes_restantes_attendu_0
  from information_schema.columns
 where table_schema = 'public' and table_name = 'sos_availability'
   and column_name in ('deplacement', 'horaire', 'majoration');
\endif


-- ==========================================================================
\if :m_apres_retrait
\echo ''
\echo '=== APRES RETRAIT — l ecriture passe (le corps tolerant), la recherche rend les memes lignes ==='
-- ==========================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :R1;
update public.sos_availability set actif = true where professional_id = :R1;
rollback;
begin;
update public.tarifs_pro set affiche = true where pro_id = :R1;
set local role authenticated;
set local request.jwt.claim.sub = :Q;
select count(*) as r1_si_affiche_attendu_1, max(deplacement) as deplacement_attendu_45_00
  from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = :Q;
select count(*) as rien_de_publie_attendu_0 from public.artisans_urgence('plomberie', 48.3950, -4.4850);
rollback;
select count(*) as commentaires_morte_attendu_0
  from pg_description d join pg_attribute a on a.attrelid = d.objoid and a.attnum = d.objsubid
 where d.objoid = 'public.sos_availability'::regclass and d.description like 'MORTE%';
\endif
