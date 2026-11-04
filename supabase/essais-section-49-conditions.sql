-- ==========================================================================
--  ESSAIS DU LOT 2a — les CONDITIONS du devis (section 49.4 bis et suivantes) :
--  la réduction sur le total, l'acompte, la validité, le total toutes
--  options comprises, et l'écriture fermée colonne par colonne (49.7)
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` puis
--  `schema.sql` rejoué DEUX fois :
--
--      psql -h /tmp -p 5433 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-49-conditions.sql
--
--  LE DÉCOR EST CELUI DE L'ESSAI 49 — les mêmes comptes, les mêmes SIRET
--  FICTIFS (vérifiés absents du répertoire Sirene le 21/10/2026, voir
--  l'en-tête de `essais-section-49.sql`), et le même ménage de tête : les
--  deux fichiers peuvent se jouer l'un après l'autre sur la même base.
--
--  DES CAS ATTENDENT UNE ERREUR, chacun annoncé dans son `\echo` PAR SON
--  NOM : la contrainte (`devis_…_check`), le code (`OP015`), ou
--  « permission denied for table … ». Un « ERROR » qui ne porte pas le nom
--  annoncé est un ÉCHEC de l'essai.
--
--  LES RÈGLES DE L'ESSAI 49 VALENT ICI : chaque cas dans son `begin …
--  rollback` et construisant son propre état ; chaque ordre qui doit
--  échouer est le dernier de sa transaction ; aucun cas de droits ou de RLS
--  dans un bloc `do` — `set local role authenticated;` puis
--  `set local request.jwt.claim.sub = :A;`, chacun dans son propre ordre.
--
--  LES MONTANTS ATTENDUS SONT CALCULÉS À LA MAIN dans chaque `\echo`, et
--  recalculés indépendamment (une règle écrite en Python, hors du dépôt)
--  avant d'être écrits ici.
--
--  ET CHAQUE VALEUR DES CAS 0 À 11 SE JUGE PAR UNE COLONNE `…_attendu_t`,
--  qui vaut `t` quand la valeur lue est l'attendue (relecture BASE-6 du
--  03/11) : avant, ces cas imprimaient une valeur et un `\echo attendu` à
--  comparer À L'ŒIL — une régression d'un centime sortait sans un seul
--  « ERROR ». Un `f`, ou une colonne vide, est un ÉCHEC de l'essai. Les
--  valeurs passent par `relire(id, attendu)` : `ht|tva|ttc|réduction|
--  acompte|options|ventilation`, dans cet ordre, écrites à la main dans
--  l'appel, à côté de l'`\echo` qui les explique.
--
--  LE RATTRAPAGE DE 49.6 ter N'EST PLUS ICI (cas 21) : il s'éprouve en
--  rejouant `schema.sql` lui-même, dans `essais-section-49-rattrapage.sql`.
--
--  CE QUI NE SE JOUE PAS DANS CE FICHIER : les DEUX SESSIONS (une réduction
--  et une ligne écrites en même temps, une réduction tardive). Elles se
--  jouent à la main, comme les procédures A à C de l'essai 49 :
--    1. session 1 : begin; set local role authenticated;
--                   set local request.jwt.claim.sub = '<A>';
--                   update public.devis set remise_centiemes = 1000,
--                          generation = 20 where id = '<DR>';
--       session 2 : (même rôle) insert d'une ligne n° 21 — elle attend ;
--       session 1 : commit ; session 2 passe : la ventilation porte la
--       réduction ET la ligne, l'horloge vaut 21.
--    2. l'inverse : la ligne n° 20 d'abord, la réduction n° 21 ensuite.
--    3. la réduction TARDIVE : la ligne n° 21 validée, puis la réduction
--       n° 20 — refusée (OP015), l'ancienne réduction gardée.
-- ==========================================================================

\set VERBOSITY verbose
\set SHOW_CONTEXT never
\pset footer off

\set A '''a4900000-0000-4000-8000-00000000000a'''
\set B '''a4900000-0000-4000-8000-00000000000b'''
\set P '''a4900000-0000-4000-8000-00000000000e'''
\set DR '''d4920000-0000-4000-8000-0000000000d1'''
\set DB '''d4920000-0000-4000-8000-0000000000db'''
\set K1 '''f4920000-0000-4000-8000-000000000001'''
\set K2 '''f4920000-0000-4000-8000-000000000002'''
\set K3 '''f4920000-0000-4000-8000-000000000003'''
\set K4 '''f4920000-0000-4000-8000-000000000004'''
\set K5 '''f4920000-0000-4000-8000-000000000005'''
\set K6 '''f4920000-0000-4000-8000-000000000006'''

-- --------------------------------------------------------------------------
--  LE MÉNAGE DE TÊTE — le fichier se rejoue (en local seulement).
-- --------------------------------------------------------------------------
delete from auth.users where id::text like 'a4900000-%';

insert into public.preuves_siret
  (siret, denomination, est_ei, forme_juridique, est_siege, tva, adresse, code_postal, commune,
   statut_diffusion, maj_insee, source, expire_le, pour_email) values
  ('00004900700016', 'ESSAIS 49 A', false, '5499', true, null,
   '1 RUE DE L ESSAI 13410 LAMBESC', '13410', 'LAMBESC', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00004910600016', 'ESSAIS 49 B', false, '5499', true, null,
   '2 RUE DE L ESSAI 13100 AIX-EN-PROVENCE', '13100', 'AIX-EN-PROVENCE', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null)
on conflict (siret) do update set expire_le = excluded.expire_le;

begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a4900@exemple-opus.test',jsonb_build_object('type','pro','siret','00004900700016','nom','A Essais','entreprise','A Essais','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
 (:B,'b4900@exemple-opus.test',jsonb_build_object('type','pro','siret','00004910600016','nom','B Essais','entreprise','B Essais','metiers',jsonb_build_array('plombier'),'ville','Aix (13)')),
 (:P,'p4900@exemple-opus.test',jsonb_build_object('type','particulier','nom','P Essais','ville','Lambesc (13)'));
commit;

-- LE DEVIS DES CONDITIONS DE A : trois postes de 1 000,00 € à trois taux.
--   brut 300 000 c ; HT 300 000, TVA 20 000 + 10 000 + 5 500 = 35 500, TTC 335 500.
prepare devis_cond as
  insert into public.devis (id, pro_id, objet, generation)
  values (:DR, :A, 'Conditions', 1);
prepare lignes_cond as
  insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                   prix_unitaire_centimes, taux_tva_centiemes, generation)
  values
   (:K1, :DR, 1000, 'poste', 'Poste à 20 %',  1000, 'forfait', 100000, 2000, 2),
   (:K2, :DR, 2000, 'poste', 'Poste à 10 %',  1000, 'forfait', 100000, 1000, 3),
   (:K3, :DR, 3000, 'poste', 'Poste à 5,5 %', 1000, 'forfait', 100000,  550, 4);
-- Ce qu'on relit d'un devis, en une ligne : les totaux, la réduction et
-- l'acompte EFFECTIFS, le total toutes options comprises, et la ventilation
-- taux:base_nette:part_de_réduction:tva:nb_lignes (toutes ses lignes) —
-- puis `valeurs_attendu_t`, qui compare les sept premières à l'attendu
-- passé en second paramètre (`ht|tva|ttc|réduction|acompte|options|
-- ventilation`). L'horloge est lue, pas jugée : chaque cas dit la sienne.
prepare relire(uuid, text) as
  select r.*,
         concat_ws('|', r.ht, r.tva, r.ttc, r.reduction, r.acompte, r.options, r.ventilation) = $2
           as valeurs_attendu_t
    from (select d.total_ht_centimes as ht, d.total_tva_centimes as tva, d.total_ttc_centimes as ttc,
                 d.remise_ht_centimes as reduction, d.acompte_ttc_centimes as acompte,
                 d.total_ttc_options_centimes as options,
                 coalesce((select string_agg(concat_ws(':', t.taux_tva_centiemes, t.base_centimes, t.remise_centimes,
                                                       t.tva_centimes, t.nb_lignes),
                                             ',' order by t.taux_tva_centiemes desc)
                             from public.devis_tva t where t.devis_id = d.id), '—') as ventilation,
                 d.generation as horloge
            from public.devis d where d.id = $1) r;


-- ==========================================================================
\echo ''
\echo '=== 0. LA DONNÉE EXISTE — sans aucune condition, les totaux du lot 1, au centime ==='
\echo '    attendu : ht 300000, tva 35500, ttc 335500, réduction 0, acompte 0, options 335500,'
\echo '    ventilation 2000:100000:0:20000:1,1000:100000:0:10000:1,550:100000:0:5500:1 ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
execute relire(:DR, '300000|35500|335500|0|0|335500|2000:100000:0:20000:1,1000:100000:0:10000:1,550:100000:0:5500:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 1. RÉDUCTION EN MONTANT : 10,00 € sur trois taux égaux → 334 / 333 / 333 (le plus fort reste ; à reste égal, le taux le plus fort) ==='
\echo '    attendu : ventilation 2000:99666:334:19933:1,1000:99667:333:9967:1,550:99667:333:5482:1'
\echo '              ht 299000, tva 35382, ttc 334382, réduction 1000, options 334382 ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centimes = 1000, generation = 10 where id = :DR;
execute relire(:DR, '299000|35382|334382|1000|0|334382|2000:99666:334:19933:1,1000:99667:333:9967:1,550:99667:333:5482:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 2. RÉDUCTION EN POURCENTAGE : 10 % → 10 000 c par taux ; la TVA se calcule sur la base NETTE ==='
\echo '    attendu : ventilation 2000:90000:10000:18000:1,1000:90000:10000:9000:1,550:90000:10000:4950:1'
\echo '              ht 270000, tva 31950, ttc 301950, réduction 30000, options 301950 ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centiemes = 1000, generation = 10 where id = :DR;
execute relire(:DR, '270000|31950|301950|30000|0|301950|2000:90000:10000:18000:1,1000:90000:10000:9000:1,550:90000:10000:4950:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 3. LA RÉDUCTION POSÉE AVANT LES LIGNES : elle s applique aux lignes qui arrivent ensuite ==='
\echo '    attendu : comme au cas 2 (ht 270000, tva 31950, ttc 301950, réduction 30000, options = ttc) ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, remise_centiemes, generation) values (:DR, :A, 1000, 1);
execute lignes_cond;
execute relire(:DR, '270000|31950|301950|30000|0|301950|2000:90000:10000:18000:1,1000:90000:10000:9000:1,550:90000:10000:4950:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 4. RÉDUCTION PLUS GRANDE QUE LE TOTAL : 4 000,00 € sur 3 000,00 € — RAMENÉE au brut, jamais refusée ==='
\echo '    attendu : réduction 300000, ht 0, tva 0, ttc 0, options 0 ; ventilation 2000:0:100000:0:1,1000:0:100000:0:1,550:0:100000:0:1 ;'
\echo '              aucune base ni TVA négative ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centimes = 400000, generation = 10 where id = :DR;
execute relire(:DR, '0|0|0|300000|0|0|2000:0:100000:0:1,1000:0:100000:0:1,550:0:100000:0:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 5. RÉDUCTION DE 100 % — tout à zéro, aucune TVA négative ==='
\echo '    attendu : ventilation 2000:0:100000:0:1,1000:0:100000:0:1,550:0:100000:0:1 ; ttc 0, réduction 300000 ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centiemes = 10000, generation = 10 where id = :DR;
execute relire(:DR, '0|0|0|300000|0|0|2000:0:100000:0:1,1000:0:100000:0:1,550:0:100000:0:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 6. UN TAUX QUI DISPARAÎT EST À ZÉRO EN ENTIER, sa part de réduction comprise (relecture BASE-4) ==='
\echo '    réduction 10 %, puis la ligne à 10 % retirée : brut 200000, réduction 20000'
\echo '    attendu : ventilation 2000:90000:10000:18000:1,1000:0:0:0:0,550:90000:10000:4950:1 ; réduction 20000 ;'
\echo '              ht 200000 - 20000 = 180000 ; tva 18000 + 4950 = 22950 ; ttc 202950 = options ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centiemes = 1000, generation = 10 where id = :DR;
delete from public.devis_lignes where id = :K2 and generation < 11;
execute relire(:DR, '180000|22950|202950|20000|0|202950|2000:90000:10000:18000:1,1000:0:0:0:0,550:90000:10000:4950:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 7. UNE OPTION : jamais réduite, et le total toutes options comprises se calcule sur l UNION, taux par taux ==='
\echo '    réduction 10 % ; option 1 : 333,33 € à 10 % ; option 2 : 123,45 € sans TVA'
\echo '    union : 20 % 90000 → 108000 ; 10 % 90000+33333=123333 → tva 12333 → 135666 ;'
\echo '            5,5 % 90000 → 94950 ; 0 % 12345 → 12345 ; total 350961'
\echo '    attendu : ttc 301950 (les options n y entrent pas), réduction 30000, options 350961 ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centiemes = 1000, generation = 10 where id = :DR;
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:K4, :DR, 4000, 'option', 'Option à 10 %', 1000, 'u', 33333, 1000, 11),
       (:K5, :DR, 5000, 'option', 'Option sans TVA', 1000, 'u', 12345, 0, 12);
execute relire(:DR, '270000|31950|301950|30000|0|350961|2000:90000:10000:18000:1,1000:90000:10000:9000:1,550:90000:10000:4950:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 7 bis. L UNION N EST PAS UNE ADDITION : une option de 33,33 € à 10 % sur une base de 0,04 € ==='
\echo '    option 33,33 € à 10 % : seule 3333 + 333 (333,3) = 3666 ;'
\echo '    poste 0,04 € à 10 % : base 4, tva 0 (0,4) → 4 ; addition 4 + 3666 = 3670 ;'
\echo '    union : 3337 → tva 334 (333,7) → 3671'
\echo '    attendu : ttc 4, options 3671 (et non 3670) ; valeurs_attendu_t t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, generation) values (:DR, :A, 1);
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:K1, :DR, 1000, 'poste',  'Poste de 4 centimes', 1000, 'u', 4, 1000, 2),
       (:K4, :DR, 2000, 'option', 'Option',              1000, 'u', 3333, 1000, 3);
execute relire(:DR, '4|0|4|0|0|3671|1000:4:0:0:1');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 8. L ACOMPTE EN POURCENTAGE : sur le TTC HORS options, arrondi au centime, le demi vers le haut ==='
\echo '    30 % de 335500 = 100650 ; 0,10 % de 335500 = 335,5 → 336'
\echo '    attendu : acompte 100650, puis acompte 336 ; les deux colonnes _attendu_t à t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set acompte_centiemes = 3000, acompte_nature = 'acompte', generation = 10 where id = :DR;
select acompte_ttc_centimes as acompte_30_pourcent, acompte_ttc_centimes = 100650 as acompte_30_pourcent_attendu_t
  from public.devis where id = :DR;
update public.devis set acompte_centiemes = 10, generation = 11 where id = :DR;
select acompte_ttc_centimes as acompte_0_10_pourcent, acompte_ttc_centimes = 336 as acompte_0_10_pourcent_attendu_t
  from public.devis where id = :DR;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 9. L ACOMPTE SUIT LE TOTAL : réduction 10 % puis acompte 30 % → 30 % de 301950 = 90585 ; une option ne le change pas ==='
\echo '    attendu : acompte 90585, puis, après l option, acompte 90585 et options > ttc :'
\echo '              union 20 % 90000 + 50000 = 140000 → 168000 ; 10 % 99000 ; 5,5 % 94950 → options 361950 ;'
\echo '              les deux colonnes _attendu_t à t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centiemes = 1000, acompte_centiemes = 3000, acompte_nature = 'arrhes', generation = 10 where id = :DR;
select acompte_ttc_centimes as acompte, acompte_ttc_centimes = 90585 as acompte_attendu_t from public.devis where id = :DR;
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:K4, :DR, 4000, 'option', 'Option', 1000, 'u', 50000, 2000, 11);
select acompte_ttc_centimes as acompte, total_ttc_centimes as ttc, total_ttc_options_centimes as options,
       (acompte_ttc_centimes, total_ttc_centimes, total_ttc_options_centimes) = (90585, 301950, 361950) as apres_option_attendu_t
  from public.devis where id = :DR;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 10. ACOMPTE EN MONTANT PLUS GRAND QUE LE TTC : RAMENÉ ; puis TOUTES les lignes retirées — la suppression PASSE (relecture BASE-1) ==='
\echo '    attendu : acompte 335500 ; après les trois suppressions : ttc 0, acompte 0, sans erreur ;'
\echo '              ventilation 2000:0:0:0:0,1000:0:0:0:0,550:0:0:0:0 ; les deux colonnes _attendu_t à t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set acompte_centimes = 500000, acompte_nature = 'acompte', generation = 10 where id = :DR;
select acompte_ttc_centimes as acompte, acompte_ttc_centimes = 335500 as acompte_ramene_attendu_t from public.devis where id = :DR;
delete from public.devis_lignes where id = :K1 and generation < 11;
delete from public.devis_lignes where id = :K2 and generation < 11;
delete from public.devis_lignes where id = :K3 and generation < 11;
execute relire(:DR, '0|0|0|0|0|0|2000:0:0:0:0,1000:0:0:0:0,550:0:0:0:0');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 11. LA NATURE SANS ACOMPTE PASSE — et l acompte sans nature aussi : c est un motif de refus de la remise (lot 2b), jamais une contrainte (relecture BASE-2) ==='
\echo '    attendu : deux UPDATE 1, sans erreur ; les deux colonnes _attendu_t à t'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set acompte_nature = 'arrhes', generation = 10 where id = :DR;
select acompte_nature as nature, acompte_centiemes as pourcentage,
       acompte_nature is not distinct from 'arrhes' and acompte_centiemes is null as nature_seule_attendu_t
  from public.devis where id = :DR;
update public.devis set acompte_nature = null, acompte_centiemes = 3000, generation = 11 where id = :DR;
select acompte_nature as nature, acompte_centiemes as pourcentage,
       acompte_nature is null and acompte_centiemes is not distinct from 3000 as acompte_seul_attendu_t
  from public.devis where id = :DR;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 12. LES REFUS DES CONDITIONS — chaque nom lu ==='
-- ==========================================================================
\echo '--- acompte sous ses DEUX formes → devis_acompte_une_forme_check (relecture BASE-3)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set acompte_centiemes = 3000, acompte_centimes = 100, acompte_nature = 'acompte', generation = 10 where id = :DR;
rollback;
\echo '--- réduction sous ses DEUX formes → devis_remise_une_forme_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set remise_centiemes = 1000, remise_centimes = 5000, generation = 10 where id = :DR;
rollback;
\echo '--- acompte de 100,01 % → devis_acompte_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set acompte_centiemes = 10001, generation = 10 where id = :DR;
rollback;
\echo '--- acompte de 0 € → devis_acompte_check (aucun acompte, c est vide)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set acompte_centimes = 0, generation = 10 where id = :DR;
rollback;
\echo '--- acompte de 20 000 000 % sur un devis de 84 000 000,00 € TTC → devis_acompte_check, et NON « bigint out of range » (22003) :'
\echo '    le déclencheur ne multiplie le pourcentage que dans ses bornes, la contrainte refuse sous son nom (relecture BASE-5)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, generation) values (:DR, :A, 1);
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:K1, :DR, 1000, 'poste', 'Gros poste', 1000, 'forfait', 7000000000, 2000, 2);
update public.devis set acompte_centiemes = 2000000000, generation = 3 where id = :DR;
rollback;
\echo '--- nature « caution » → devis_acompte_nature_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set acompte_nature = 'caution', generation = 10 where id = :DR;
rollback;
\echo '--- réduction de 0 % → devis_remise_check (aucune réduction, c est vide)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set remise_centiemes = 0, generation = 10 where id = :DR;
rollback;
\echo '--- réduction de 100,01 % → devis_remise_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set remise_centiemes = 10001, generation = 10 where id = :DR;
rollback;
\echo '--- réduction négative → devis_remise_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set remise_centimes = -100, generation = 10 where id = :DR;
rollback;
\echo '--- validité de 0 jour → devis_validite_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set validite_jours = 0, generation = 10 where id = :DR;
rollback;
\echo '--- validité de 366 jours → devis_validite_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set validite_jours = 366, generation = 10 where id = :DR;
rollback;
\echo '--- validité de 1 et de 365 jours : les deux bornes passent (UPDATE 1 ×2)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set validite_jours = 1, generation = 10 where id = :DR;
update public.devis set validite_jours = 365, generation = 11 where id = :DR;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 13. LE HT EST BORNÉ SUR LE BRUT (relecture BASE-6) : trois postes de 90 000 000,00 € et une réduction de 100 % → devis_plafond_check ==='
\echo '    (sans la règle, le net 0 passait : des lignes au-delà de la borne tenaient sous elle grâce à la réduction)'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, remise_centiemes, generation) values (:DR, :A, 10000, 1);
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:K1, :DR, 1000, 'poste', 'Gros poste 1', 1000, 'forfait', 9000000000, 2000, 2),
       (:K2, :DR, 2000, 'poste', 'Gros poste 2', 1000, 'forfait', 9000000000, 2000, 3);
rollback;
\echo '--- et une option qui ferait dépasser le total toutes options comprises → devis_plafond_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, generation) values (:DR, :A, 1);
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:K1, :DR, 1000, 'poste',  'Poste',  1000, 'forfait', 5000000000, 2000, 2),
       (:K4, :DR, 2000, 'option', 'Option', 1000, 'forfait', 5000000000, 2000, 3);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 13 bis. RETIRER LA RÉDUCTION PRÈS DU PLAFOND DU TTC → devis_plafond_check (relecture BASE-4 du 03/11) ==='
\echo '    Le HT est borné sur le brut, le TTC NET de la réduction : un poste de 90 000 000,00 € à 20 %'
\echo '    et 50 % de réduction donnent ht 45·10^8, réduction 45·10^8, tva 9·10^8, ttc 54·10^8 — accepté.'
\echo '    Sans la réduction, le ttc vaudrait 108·10^8, au-delà de 99 999 999,99 € : la retirer est REFUSÉ,'
\echo '    et c est juste (un devis ne dépasse pas la borne, avec ou sans réduction). L écran dit alors'
\echo '    « La réduction n a pas pu être changée », pas « pour cette ligne » (erreurs.js, devis.js).'
\echo '    attendu : valeurs_attendu_t t ; puis la baisse à 20 % passe (ttc 86,4·10^8, attendu_t t) ;'
\echo '              puis le retrait → devis_plafond_check'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, remise_centiemes, generation) values (:DR, :A, 5000, 1);
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:K1, :DR, 1000, 'poste', 'Gros poste', 1000, 'forfait', 9000000000, 2000, 2);
execute relire(:DR, '4500000000|900000000|5400000000|4500000000|0|5400000000|2000:4500000000:4500000000:900000000:1');
update public.devis set remise_centiemes = 2000, generation = 3 where id = :DR;
execute relire(:DR, '7200000000|1440000000|8640000000|1800000000|0|8640000000|2000:7200000000:1800000000:1440000000:1');
update public.devis set remise_centiemes = null, generation = 4 where id = :DR;
rollback;

-- ==========================================================================
\echo ''
\echo '=== 14. L HORLOGE : une réduction plus ancienne que l horloge du devis → OP015 ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centiemes = 1000, generation = 4 where id = :DR;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 15. LA RÉPONSE D UNE ÉCRITURE DE RÉDUCTION PORTE LES TOTAUX D AVANT ; la relecture, les vrais (relecture BASE-11, condition 3) ==='
\echo '    attendu : returning ht 300000 (avant), puis relu ht 270000'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis set remise_centiemes = 1000, generation = 10 where id = :DR returning total_ht_centimes as ht_rendu;
select total_ht_centimes as ht_relu from public.devis where id = :DR;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 16. CE QUE L APPLICATION ENVOIE PASSE, SOUS LES DROITS DE COLONNE (sept formes, relecture BASE-16) ==='
\echo '    attendu : INSERT 0 1, UPDATE 1 (en-tête + numéro), UPDATE 1 (la levée, numéro seul),'
\echo '              UPDATE 1 (réduction et acompte, une paire en une écriture), INSERT 0 1 (ligne entière),'
\echo '              UPDATE 1 (ligne), puis la suppression conditionnée rend son identifiant'
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, source, client_id, quote_request_id, sos_request_id, objet, lieu_adresse,
                          lieu_code_postal, lieu_ville, delai_execution, retenue_garantie_centiemes,
                          remise_centiemes, remise_centimes, acompte_centiemes, acompte_centimes, acompte_nature,
                          validite_jours, generation)
values (:DR, :A, 'manuelle', null, null, null, 'Objet', '1 rue', '13410', 'Lambesc', 'Sous 30 jours', 500,
        null, null, null, null, null, null, 1);
update public.devis set objet = 'Objet retouché', generation = 2 where id = :DR returning id;
update public.devis set generation = 3 where id = :DR returning id;
update public.devis set remise_centiemes = null, remise_centimes = 5000, acompte_centiemes = 3000,
                        acompte_centimes = null, acompte_nature = 'acompte', validite_jours = 30, generation = 4
 where id = :DR returning id;
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, offert, main_oeuvre,
                                 fourniture_non_comprise, surface_sol_milliemes, surface_murs_milliemes, generation)
values (:K1, :DR, 1000, 'poste', 'Ligne', 1000, 'u', 10000, 2000, false, false, false, null, null, 5);
update public.devis_lignes set prix_unitaire_centimes = 12000, generation = 6 where id = :K1 returning id;
delete from public.devis_lignes where id = :K1 and generation < 7 returning id;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 17. CE QUE SEULE LA BASE ÉCRIT EST REFUSÉ AU CLIENT, AVANT TOUT DÉCLENCHEUR (49.7) ==='
-- ==========================================================================
\echo '--- statut écrit à la création → permission denied for table devis'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, statut, generation) values (:DR, :A, 'brouillon', 1);
rollback;
\echo '--- statut écrit, même INCHANGÉ → permission denied for table devis'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set statut = 'brouillon', generation = 10 where id = :DR;
rollback;
\echo '--- un total écrit → permission denied for table devis'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set total_ttc_centimes = 1, generation = 10 where id = :DR;
rollback;
\echo '--- la réduction EFFECTIVE écrite → permission denied for table devis'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set remise_ht_centimes = 0, generation = 10 where id = :DR;
rollback;
\echo '--- l acompte EFFECTIF écrit → permission denied for table devis'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set acompte_ttc_centimes = 0, generation = 10 where id = :DR;
rollback;
\echo '--- le total toutes options comprises écrit → permission denied for table devis'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set total_ttc_options_centimes = 0, generation = 10 where id = :DR;
rollback;
\echo '--- l entreprise changée → permission denied for table devis'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set pro_id = :A, generation = 10 where id = :DR;
rollback;
\echo '--- la source changée → permission denied for table devis (D3 : elle était déjà figée par le déclencheur)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set source = 'manuelle', generation = 10 where id = :DR;
rollback;
\echo '--- une date écrite → permission denied for table devis'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond;
update public.devis set modifie_le = now(), generation = 10 where id = :DR;
rollback;
\echo '--- une ligne déplacée vers un autre devis → permission denied for table devis_lignes (relecture BASE-9)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis_lignes set devis_id = :DR, generation = 10 where id = :K1;
rollback;
\echo '--- le total d une ligne écrit → permission denied for table devis_lignes'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis_lignes set total_centimes = 1, generation = 10 where id = :K1;
rollback;
\echo '--- la ventilation écrite → permission denied for table devis_tva'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
update public.devis_tva set remise_centimes = 0 where devis_id = :DR;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 18. LES DROITS, LUS DANS LE CATALOGUE, COLONNE PAR COLONNE ET DANS LES DEUX SENS ==='
\echo '    attendu : aucune ligne « écart » (la liste attendue est celle de 49.7, recopiée ici)'
-- ==========================================================================
with attendu(tab, col, ins, upd) as (values
  ('devis','id',true,false), ('devis','pro_id',true,false), ('devis','source',true,false),
  ('devis','client_id',true,true), ('devis','quote_request_id',true,true), ('devis','sos_request_id',true,true),
  ('devis','objet',true,true), ('devis','lieu_adresse',true,true), ('devis','lieu_code_postal',true,true),
  ('devis','lieu_ville',true,true), ('devis','delai_execution',true,true),
  ('devis','retenue_garantie_centiemes',true,true), ('devis','remise_centiemes',true,true),
  ('devis','remise_centimes',true,true), ('devis','acompte_centiemes',true,true),
  ('devis','acompte_centimes',true,true), ('devis','acompte_nature',true,true),
  ('devis','validite_jours',true,true), ('devis','generation',true,true),
  ('devis_lignes','id',true,false), ('devis_lignes','devis_id',true,false),
  ('devis_lignes','ordre',true,true), ('devis_lignes','type',true,true), ('devis_lignes','designation',true,true),
  ('devis_lignes','quantite_milliemes',true,true), ('devis_lignes','unite',true,true),
  ('devis_lignes','prix_unitaire_centimes',true,true), ('devis_lignes','taux_tva_centiemes',true,true),
  ('devis_lignes','offert',true,true), ('devis_lignes','main_oeuvre',true,true),
  ('devis_lignes','fourniture_non_comprise',true,true), ('devis_lignes','surface_sol_milliemes',true,true),
  ('devis_lignes','surface_murs_milliemes',true,true), ('devis_lignes','generation',true,true)
), reel as (
  select c.table_name::text as tab, c.column_name::text as col,
         has_column_privilege('authenticated', format('public.%I', c.table_name), c.column_name, 'INSERT') as ins,
         has_column_privilege('authenticated', format('public.%I', c.table_name), c.column_name, 'UPDATE') as upd,
         has_column_privilege('anon', format('public.%I', c.table_name), c.column_name, 'INSERT')
           or has_column_privilege('anon', format('public.%I', c.table_name), c.column_name, 'UPDATE')
           or has_column_privilege('anon', format('public.%I', c.table_name), c.column_name, 'SELECT') as anon
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name in ('devis', 'devis_lignes', 'devis_tva')
)
select 'écart' as ecart, r.tab, r.col, r.ins, r.upd, a.ins as ins_attendu, a.upd as upd_attendu, r.anon
  from reel r left join attendu a on a.tab = r.tab and a.col = r.col
 where r.ins is distinct from coalesce(a.ins, false)
    or r.upd is distinct from coalesce(a.upd, false)
    or r.anon
 order by 2, 3;
\echo '--- et chaque colonne attendue existe (une faute de frappe ici ne passerait pas)'
select count(*) as colonnes_attendues_trouvees
  from information_schema.columns c
 where c.table_schema = 'public' and c.table_name in ('devis', 'devis_lignes')
   and (c.table_name, c.column_name) in (
     ('devis','id'),('devis','pro_id'),('devis','source'),('devis','client_id'),('devis','quote_request_id'),
     ('devis','sos_request_id'),('devis','objet'),('devis','lieu_adresse'),('devis','lieu_code_postal'),
     ('devis','lieu_ville'),('devis','delai_execution'),('devis','retenue_garantie_centiemes'),
     ('devis','remise_centiemes'),('devis','remise_centimes'),('devis','acompte_centiemes'),
     ('devis','acompte_centimes'),('devis','acompte_nature'),('devis','validite_jours'),('devis','generation'),
     ('devis_lignes','id'),('devis_lignes','devis_id'),('devis_lignes','ordre'),('devis_lignes','type'),
     ('devis_lignes','designation'),('devis_lignes','quantite_milliemes'),('devis_lignes','unite'),
     ('devis_lignes','prix_unitaire_centimes'),('devis_lignes','taux_tva_centiemes'),('devis_lignes','offert'),
     ('devis_lignes','main_oeuvre'),('devis_lignes','fourniture_non_comprise'),
     ('devis_lignes','surface_sol_milliemes'),('devis_lignes','surface_murs_milliemes'),('devis_lignes','generation'));
\echo '    attendu : 34'
select has_table_privilege('authenticated', 'public.devis', 'INSERT') as table_devis_insert,
       has_table_privilege('authenticated', 'public.devis', 'UPDATE') as table_devis_update,
       has_table_privilege('authenticated', 'public.devis', 'SELECT') as table_devis_select,
       has_table_privilege('authenticated', 'public.devis', 'DELETE') as table_devis_delete,
       has_table_privilege('authenticated', 'public.devis_tva', 'SELECT') as tva_select,
       has_any_column_privilege('authenticated', 'public.devis_tva', 'UPDATE') as tva_update;
\echo '    attendu : f, f, t, t, t, f'


-- ==========================================================================
\echo ''
\echo '=== 19. LES FONCTIONS DE LA RÉDUCTION : aucune n est exécutable par un client ; le déclencheur est definer et ne joue qu à une modification de la réduction ==='
-- ==========================================================================
select p.proname, p.prosecdef as definer,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('repartir_au_plus_fort_reste', 'recalcule_devis', 'recalcule_apres_reduction')
 order by 1;
\echo '    attendu : recalcule_apres_reduction t f f ; recalcule_devis t f f ; repartir_au_plus_fort_reste f f f'
select t.tgname, pg_get_triggerdef(t.oid) like '%AFTER UPDATE OF remise_centiemes, remise_centimes ON public.devis%' as forme
  from pg_trigger t
 where t.tgrelid = 'public.devis'::regclass and not t.tgisinternal
 order by 1;
\echo '    attendu : trg_recalcule_apres_reduction t ; trg_tient_le_devis f ; trg_tient_le_lien_du_devis f'


-- ==========================================================================
\echo ''
\echo '=== 20. LA RÉPARTITION, SES BORDS (49.1) — en superutilisateur, la fonction n est à aucun client ==='
-- ==========================================================================
select public.repartir_au_plus_fort_reste(0, '{}')          as vide_zero,
       public.repartir_au_plus_fort_reste(5, '{}')          as vide_cinq,
       public.repartir_au_plus_fort_reste(0, '{0,0}')       as poids_nuls,
       public.repartir_au_plus_fort_reste(1, '{0,0}')       as total_plus_grand,
       public.repartir_au_plus_fort_reste(-1, '{1}')        as total_negatif,
       public.repartir_au_plus_fort_reste(1, '{-1,2}')      as poids_negatif,
       public.repartir_au_plus_fort_reste(1, '{1,null}')    as poids_nul_sql,
       public.repartir_au_plus_fort_reste(null, '{1}')      as total_nul_sql;
\echo '    attendu : {} | (vide) | {0,0} | (vide) | (vide) | (vide) | (vide) | (vide)'
select public.repartir_au_plus_fort_reste(1, '{100,100,100}')  as un_centime,
       public.repartir_au_plus_fort_reste(2, '{100,100,100}')  as deux_centimes,
       public.repartir_au_plus_fort_reste(1000, '{100000,100000,100000}') as mille_sur_trois,
       public.repartir_au_plus_fort_reste(3, '{0,5,0}')        as poids_unique,
       public.repartir_au_plus_fort_reste(10, '{3,3,4}')       as plus_fort_reste;
\echo '    attendu : {1,0,0} | {1,1,0} | {334,333,333} | {0,3,0} | {3,3,4}'
select public.repartir_au_plus_fort_reste(9999999999, '{9999999999,9999999999}') as grands,
       public.repartir_au_plus_fort_reste(4503599627370497, '{9007199254740993,9007199254740993}') as au_dela_de_2_53;
\echo '    attendu : {5000000000,4999999999} | {2251799813685249,2251799813685248}'


-- ==========================================================================
\echo ''
\echo '=== 21. LE RATTRAPAGE DE 49.6 ter — il ne se joue plus ici : voir essais-section-49-rattrapage.sql ==='
\echo '    Ce cas recopiait l ordre `update` du rattrapage : il éprouvait sa COPIE, et la copie ne voyait'
\echo '    ni les devis aux options seules, ni l horloge à la borne, ni les options au-delà du plafond'
\echo '    (relecture BASE-1 à BASE-3 et BASE-6 du 03/11). L essai dédié pose d anciens devis, puis'
\echo '    REJOUE schema.sql lui-même (deux fois), et éprouve sa garde.'
-- ==========================================================================


-- ==========================================================================
\echo ''
\echo '=== 22. UN AUTRE ARTISAN NE PEUT RIEN SUR CES COLONNES : B ne lit pas, ne réduit pas le devis de A ==='
\echo '    attendu : A lit 1 ligne ; B lit 0 ligne ; la réduction de B ne touche aucune ligne (UPDATE 0)'
-- ==========================================================================
begin;
set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_cond; execute lignes_cond;
select count(*) as a_lit from public.devis where id = :DR;
set local request.jwt.claim.sub = :B;
select count(*) as b_lit from public.devis where id = :DR;
update public.devis set remise_centiemes = 10000, generation = 99 where id = :DR;
set local request.jwt.claim.sub = :A;
select remise_centiemes as reduction_gardee from public.devis where id = :DR;
rollback;
\echo '    attendu (dernière ligne) : réduction_gardee vide'


-- ==========================================================================
\echo ''
\echo '=== 23. LES DÉFAUTS DES COLONNES DU LOT 2a, RELUS DANS LE CATALOGUE : rien de pré-choisi pour ce que l artisan choisit, 0 pour ce que la base calcule ==='
\echo '    attendu : onze lignes, toutes avec forme_attendu_t = t ; puis colonnes_lues_attendu_t = t'
-- ==========================================================================
-- Relecture CONTROLES-2 (04/11) : « la nature n a pas de défaut » et « la
-- validité : rien de pré-choisi » (décisions du 03/11) n étaient tenues par
-- AUCUN essai. Un `alter table … alter column … set default …` posé plus bas
-- dans schema.sql passait tous les cas : ils écrivent chaque colonne, donc
-- ne lisent jamais sa valeur par défaut. Ce cas la lit dans le catalogue de
-- la base rejouée. La même liste est écrite dans scripts/verifier-devis.mjs
-- (26 bis) : chacune garde l autre.
with attendu(tab, col, defaut, nullable) as (values
  ('devis', 'remise_centiemes', null, 'YES'),
  ('devis', 'remise_centimes', null, 'YES'),
  ('devis', 'acompte_centiemes', null, 'YES'),
  ('devis', 'acompte_centimes', null, 'YES'),
  ('devis', 'acompte_nature', null, 'YES'),
  ('devis', 'validite_jours', null, 'YES'),
  ('devis', 'retenue_garantie_centiemes', null, 'YES'),
  ('devis', 'remise_ht_centimes', '0', 'NO'),
  ('devis', 'acompte_ttc_centimes', '0', 'NO'),
  ('devis', 'total_ttc_options_centimes', '0', 'NO'),
  ('devis_tva', 'remise_centimes', '0', 'NO')
)
select a.tab || '.' || a.col as colonne,
       c.column_default as defaut_lu,
       c.is_nullable as nullable_lu,
       coalesce(c.column_default is not distinct from a.defaut and c.is_nullable = a.nullable, false) as forme_attendu_t
  from attendu a
  left join information_schema.columns c
    on c.table_schema = 'public' and c.table_name = a.tab and c.column_name = a.col
 order by a.tab, a.col;
-- Les onze colonnes existent, une fois chacune (une colonne renommée
-- donnerait une ligne vide ci-dessus, et un faux « t » nulle part).
select count(*) = 11 as colonnes_lues_attendu_t
  from information_schema.columns c
 where c.table_schema = 'public'
   and (c.table_name, c.column_name) in (
     ('devis', 'remise_centiemes'), ('devis', 'remise_centimes'), ('devis', 'acompte_centiemes'),
     ('devis', 'acompte_centimes'), ('devis', 'acompte_nature'), ('devis', 'validite_jours'),
     ('devis', 'retenue_garantie_centiemes'), ('devis', 'remise_ht_centimes'),
     ('devis', 'acompte_ttc_centimes'), ('devis', 'total_ttc_options_centimes'),
     ('devis_tva', 'remise_centimes'));
