-- ==========================================================================
--  ESSAI DU RATTRAPAGE DE 49.6 ter, ET DE SA GARDE (lot 2a — relecture
--  BASE-1, BASE-2, BASE-3 et BASE-6 du 03/11/2026)
--
--  CE QUI EST ÉPROUVÉ, C'EST LE RATTRAPAGE ÉCRIT DANS `schema.sql` — PAS UNE
--  COPIE. Le cas 21 de `essais-section-49-conditions.sql` recopiait l'ordre
--  `update` : il éprouvait sa copie, sur UN seul ancien devis (des postes,
--  aucune option), et c'est pourquoi trois défauts passaient — les devis aux
--  options seules restaient à 0, un devis à l'horloge maximale arrêtait la
--  migration (OP016), des options au-delà du plafond la faisaient échouer
--  plus tard, pendant la suppression du compte d'un client. Ici, on pose
--  d'anciens devis TELS QUE LE LOT 1 LES LAISSAIT (les trois colonnes du
--  lot 2a à 0), puis on REJOUE `schema.sql` lui-même (`\ir schema.sql`), et
--  on lit ce qu'il en a fait.
--
--  À LANCER sur un PostgreSQL ordinaire, après `local-prelude.sql` puis
--  `schema.sql` rejoué DEUX fois — depuis n'importe quel dossier : `\ir`
--  cherche `schema.sql` à côté de CE fichier :
--
--      psql -h /tmp -p 5433 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-49-rattrapage.sql
--
--  `ON_ERROR_STOP=0` est NÉCESSAIRE : les parties 2 et 3 attendent des
--  erreurs (la garde). Avec 1, le fichier s'arrêterait à la première.
--
--  CHAQUE PARTIE VIT DANS SON `begin … rollback` : le schéma y est rejoué EN
--  ENTIER, à l'intérieur de la transaction, et la base finit comme elle a
--  commencé (les comptes de l'essai 49 mis à part : le même ménage de tête,
--  les mêmes SIRET FICTIFS — les fichiers se jouent l'un après l'autre).
--  `ON_ERROR_ROLLBACK` laisse le rejeu CONTINUER après une erreur attendue
--  (psql pose un point de sauvegarde avant chaque ordre) : on voit ainsi la
--  garde refuser, PUIS ce qui se serait passé sans elle. Une vraie migration,
--  elle, est une seule transaction : elle s'arrête à la garde.
--
--  POURQUOI `session_replication_role = replica` : aucun déclencheur ne
--  tourne (les contraintes, si). C'est la seule façon de poser, sous le
--  schéma d'AUJOURD'HUI, un devis qui a l'état d'AVANT — ses totaux du
--  lot 1, et un total toutes options comprises resté à son défaut, 0.
--  `devis_calculs_check` est retirée le temps de la transaction : sous le
--  lot 1, elle n'existait pas, et le rejeu la repose.
--
--  CHAQUE VALEUR SE JUGE PAR UNE COLONNE `…_attendu_t` : `t` si la valeur
--  lue est l'attendue. Un `f`, une colonne vide, ou un « ERROR » qui n'est
--  pas annoncé mot pour mot dans son `\echo` est un ÉCHEC de l'essai.
--  Les montants attendus sont calculés à la main dans chaque `\echo`.
--
--  ET UN « ERROR » ANNONCÉ QUI MANQUE EST UN ÉCHEC AUSSI (relecture finale
--  du lot 2a, RBM-1). La garde de 49.6 ter vit DANS `\ir schema.sql`, et le
--  rejeu continue après elle : aucune colonne ne peut la juger. L'état de la
--  base est le même qu'elle se déclenche ou non (`ON_ERROR_ROLLBACK` annule
--  les deux refus), et `LAST_ERROR_MESSAGE` ne garde que la DERNIÈRE erreur
--  — celle d'après la garde. Neutralisée (`if v_n > 1` à ses deux
--  endroits), elle laissait cet essai à zéro `f`, code de sortie 0 : seules
--  manquaient deux lignes « ERROR ». On COMPTE donc. Joué comme ci-dessus,
--  ce fichier écrit EXACTEMENT QUATRE lignes `psql:… ERROR`, dans cet ordre :
--      partie 2 : P0001 « Rattrapage du lot 2a … », puis 23514 devis_plafond_check ;
--      partie 3 : P0001 « Rattrapage du lot 2a … », puis 23514 devis_calculs_check.
--  Pour compter :
--      … -f supabase/essais-section-49-rattrapage.sql 2>&1 | grep -c '^psql:.*ERROR:'
--          → 4
--      … -f supabase/essais-section-49-rattrapage.sql 2>&1 \
--          | grep -c '^psql:.*ERROR:  P0001: Rattrapage du lot 2a'
--          → 2
--  Un autre compte est un ÉCHEC, même quand toutes les colonnes valent `t`.
--  (Mesuré le 04/11/2026 : garde neutralisée à ses deux endroits, 2 et 0 ;
--  à un seul, 3 et 1.)
-- ==========================================================================

\set VERBOSITY verbose
\set SHOW_CONTEXT never
\set ON_ERROR_ROLLBACK on
\pset footer off

\set A '''a4900000-0000-4000-8000-00000000000a'''
\set D1 '''d4930000-0000-4000-8000-000000000001'''
\set D2 '''d4930000-0000-4000-8000-000000000002'''
\set D3 '''d4930000-0000-4000-8000-000000000003'''
\set D4 '''d4930000-0000-4000-8000-000000000004'''
\set D5 '''d4930000-0000-4000-8000-000000000005'''
\set D6 '''d4930000-0000-4000-8000-000000000006'''
\set D7 '''d4930000-0000-4000-8000-000000000007'''
\set D8 '''d4930000-0000-4000-8000-000000000008'''
\set D9 '''d4930000-0000-4000-8000-000000000009'''
\set D10 '''d4930000-0000-4000-8000-000000000010'''

-- --------------------------------------------------------------------------
--  LE MÉNAGE DE TÊTE — le fichier se rejoue (en local seulement). Le compte
--  A est celui de l'essai 49 : même identifiant, même SIRET fictif.
-- --------------------------------------------------------------------------
delete from auth.users where id::text like 'a4900000-%';

insert into public.preuves_siret
  (siret, denomination, est_ei, forme_juridique, est_siege, tva, adresse, code_postal, commune,
   statut_diffusion, maj_insee, source, expire_le, pour_email) values
  ('00004900700016', 'ESSAIS 49 A', false, '5499', true, null,
   '1 RUE DE L ESSAI 13410 LAMBESC', '13410', 'LAMBESC', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null)
on conflict (siret) do update set expire_le = excluded.expire_le;

begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a4900@exemple-opus.test',jsonb_build_object('type','pro','siret','00004900700016','nom','A Essais','entreprise','A Essais','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)'));
commit;

-- Ce qu'on lit d'un ancien devis : ses totaux, ses trois colonnes du lot 2a
-- et son horloge, puis `valeurs_attendu_t`, qui les compare à l'attendu
-- passé en second paramètre — `ht|tva|ttc|réduction|acompte|options|horloge`.
prepare lire(uuid, text) as
  select d.objet, d.total_ht_centimes as ht, d.total_tva_centimes as tva, d.total_ttc_centimes as ttc,
         d.remise_ht_centimes as reduction, d.acompte_ttc_centimes as acompte,
         d.total_ttc_options_centimes as options, d.generation as horloge,
         concat_ws('|', d.total_ht_centimes, d.total_tva_centimes, d.total_ttc_centimes, d.remise_ht_centimes,
                   d.acompte_ttc_centimes, d.total_ttc_options_centimes, d.generation) = $2 as valeurs_attendu_t
    from public.devis d where d.id = $1;


-- ==========================================================================
\echo ''
\echo '=== 1. LE RATTRAPAGE, PAR schema.sql LUI-MÊME, sur huit anciens devis — puis un SECOND rejeu qui ne bouge plus rien ==='
\echo '    D1 trois postes de 1 000,00 € (20 %, 10 %, 5,5 %) : ht 300000, tva 35500, ttc 335500 ; options 0 → 335500 ;'
\echo '       horloge 4 → 5 (une écriture directe la fait monter) ; les totaux ne bougent pas'
\echo '    D2 OPTIONS SEULES, 50,00 € à 20 % : ttc 0 ; options 0 → 5000 + 1000 = 6000 ; horloge 2 → 3 (BASE-1)'
\echo '    D3 POSTE OFFERT + OPTION, poste 70,00 € à 10 % offert, option 40,00 € à 10 % : ttc 0 ;'
\echo '       options 0 → union 10 % 0 + 4000 = 4000, tva 400 → 4400 ; horloge 3 → 4 (BASE-1)'
\echo '    D4 OPTIONS SEULES À L HORLOGE MAXIMALE : EXCLU (BASE-2) — aucune OP016, options laissées à 0,'
\echo '       horloge 9007199254740991 inchangée (le moindre mal pour un devis qui ne s écrit plus)'
\echo '    D5 UNE OPTION OFFERTE SEULE : elle vaut 0, rien à rattraper — horloge 2 inchangée'
\echo '    D6 VIDE : rien à rattraper — horloge 1 inchangée'
\echo '    D9 POSTE + OPTION À UN AUTRE TAUX (la forme la plus courante d un vrai devis), poste 100,00 € à 20 %,'
\echo '       option 33,33 € à 10 % : ttc 12000 ; options 0 → union 20 % 10000 → 12000, 10 % 3333 → tva 333'
\echo '       (333,3) → 3666 ; 15666 ; horloge 3 → 4 (contre-vérification du 03/11 : aucun ancien devis du'
\echo '       fichier n avait d option À CÔTÉ de ses postes — c est pourtant le cas réel)'
\echo '    D10 OPTIONS SEULES À L HORLOGE MAXIMALE MOINS UN, option 50,00 € à 20 % : rattrapé (6000), et son'
\echo '       horloge monte À la borne, 9007199254740991 ; au SECOND rejeu il est exclu — et déjà juste : la'
\echo '       garde ne doit PAS l arrêter (contre-vérification du 03/11 : le seul devis qui change de camp'
\echo '       entre les deux rejeux)'
\echo '    attendu : aucun ERROR ; après le PREMIER rejeu comme après le SECOND, les huit valeurs_attendu_t à t'
\echo '              (le second rejeu n a rien récrit : les horloges sont celles du premier)'
-- ==========================================================================
begin;
alter table public.devis drop constraint devis_calculs_check;
set local session_replication_role = replica;
insert into public.devis (id, pro_id, objet, total_ht_centimes, total_tva_centimes, total_ttc_centimes,
                          total_ttc_options_centimes, generation) values
 (:D1, :A, 'D1 postes',                      300000, 35500, 335500, 0, 4),
 (:D2, :A, 'D2 options seules',                   0,     0,      0, 0, 2),
 (:D3, :A, 'D3 poste offert + option',            0,     0,      0, 0, 3),
 (:D4, :A, 'D4 options seules, horloge max',      0,     0,      0, 0, 9007199254740991),
 (:D5, :A, 'D5 option offerte seule',             0,     0,      0, 0, 2),
 (:D6, :A, 'D6 vide',                             0,     0,      0, 0, 1),
 (:D9, :A, 'D9 poste + option autre taux',   10000,  2000,  12000, 0, 3),
 (:D10, :A, 'D10 options seules, borne - 1',     0,     0,      0, 0, 9007199254740990);
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, offert, total_centimes, generation) values
 (:D1, 1000, 'poste',  'Poste à 20 %',   1000, 'forfait', 100000, 2000, false, 100000, 2),
 (:D1, 2000, 'poste',  'Poste à 10 %',   1000, 'forfait', 100000, 1000, false, 100000, 3),
 (:D1, 3000, 'poste',  'Poste à 5,5 %',  1000, 'forfait', 100000,  550, false, 100000, 4),
 (:D2, 1000, 'option', 'Option',         1000, 'u',         5000, 2000, false,   5000, 2),
 (:D3, 1000, 'poste',  'Poste offert',   1000, 'u',         7000, 1000, true,       0, 2),
 (:D3, 2000, 'option', 'Option',         1000, 'u',         4000, 1000, false,   4000, 3),
 (:D4, 1000, 'option', 'Option',         1000, 'u',         5000, 2000, false,   5000, 2),
 (:D5, 1000, 'option', 'Option offerte', 1000, 'u',         5000, 2000, true,       0, 2),
 (:D9, 1000, 'poste',  'Poste à 20 %',   1000, 'u',        10000, 2000, false,  10000, 2),
 (:D9, 2000, 'option', 'Option à 10 %',  1000, 'u',         3333, 1000, false,   3333, 3),
 (:D10, 1000, 'option', 'Option',        1000, 'u',         5000, 2000, false,   5000, 2);
insert into public.devis_tva (devis_id, taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes) values
 (:D1, 2000, 100000, 20000, 1), (:D1, 1000, 100000, 10000, 1), (:D1, 550, 100000, 5500, 1),
 (:D3, 1000, 0, 0, 1),
 (:D9, 2000, 10000, 2000, 1);
set local session_replication_role = origin;
\echo '--- avant : les huit à leur état du lot 1 (options 0 partout)'
select objet, total_ttc_centimes as ttc, total_ttc_options_centimes as options, generation as horloge,
       total_ttc_options_centimes = 0 as options_a_zero_attendu_t
  from public.devis where id in (:D1, :D2, :D3, :D4, :D5, :D6, :D9, :D10) order by objet;
\echo '--- premier rejeu de schema.sql (ses sorties masquées ; une erreur s afficherait quand même)'
set local client_min_messages = warning;
\o /dev/null
\ir schema.sql
\o
execute lire(:D1, '300000|35500|335500|0|0|335500|5');
execute lire(:D2, '0|0|0|0|0|6000|3');
execute lire(:D3, '0|0|0|0|0|4400|4');
execute lire(:D4, '0|0|0|0|0|0|9007199254740991');
execute lire(:D5, '0|0|0|0|0|0|2');
execute lire(:D6, '0|0|0|0|0|0|1');
execute lire(:D9, '10000|2000|12000|0|0|15666|4');
execute lire(:D10, '0|0|0|0|0|6000|9007199254740991');
\echo '--- second rejeu de schema.sql : le rattrapage ne trouve plus rien, aucune horloge ne monte'
\o /dev/null
\ir schema.sql
\o
execute lire(:D1, '300000|35500|335500|0|0|335500|5');
execute lire(:D2, '0|0|0|0|0|6000|3');
execute lire(:D3, '0|0|0|0|0|4400|4');
execute lire(:D4, '0|0|0|0|0|0|9007199254740991');
execute lire(:D5, '0|0|0|0|0|0|2');
execute lire(:D6, '0|0|0|0|0|0|1');
execute lire(:D9, '10000|2000|12000|0|0|15666|4');
execute lire(:D10, '0|0|0|0|0|6000|9007199254740991');
\echo '--- et devis_calculs_check est reposée'
select count(*) = 1 as devis_calculs_check_reposee_attendu_t
  from pg_constraint where conrelid = 'public.devis'::regclass and conname = 'devis_calculs_check';
rollback;


-- ==========================================================================
\echo ''
\echo '=== 2. LA GARDE, PREMIER REFUS (BASE-3) : des OPTIONS au-delà du plafond, sur un ancien devis aux options seules ==='
\echo '    D7 deux options de 60 000 000,00 € à 20 % (acceptées avant le lot 2a, rien ne bornait les options) :'
\echo '       recalculé, son total toutes options vaudrait 2 × 6·10^9 × 1,2 = 14 400 000 000 c, au-delà de 9 999 999 999.'
\echo '    attendu, DANS CET ORDRE :'
\echo '      1. ERROR P0001 « Rattrapage du lot 2a (schema.sql, section 49.6 ter) arrêté avant d écrire quoi que ce'
\echo '         soit. Devis dont le total toutes options comprises, une fois recalculé, dépasserait 99 999 999,99 € … : 1 »,'
\echo '         qui NOMME d4930000-0000-4000-8000-000000000007 — c est l échec d une vraie migration, au moment'
\echo '         où on l applique ;'
\echo '      2. puis, parce que ce rejeu CONTINUE (ON_ERROR_ROLLBACK), ce que la garde évite : le rattrapage'
\echo '         lui-même refusé, ERROR 23514 devis_plafond_check — sans la garde, la migration échouait là, sous'
\echo '         ce nom sans rapport ; et sans le rattrapage de ce devis, c était PLUS TARD, pendant la'
\echo '         suppression du compte d un client (la cascade) ;'
\echo '      3. aucun autre ERROR ; D7 intact (valeurs_attendu_t t)'
-- ==========================================================================
begin;
alter table public.devis drop constraint devis_calculs_check;
set local session_replication_role = replica;
insert into public.devis (id, pro_id, objet, total_ht_centimes, total_tva_centimes, total_ttc_centimes,
                          total_ttc_options_centimes, generation) values
 (:D7, :A, 'D7 options énormes seules', 0, 0, 0, 0, 3);
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, offert, total_centimes, generation) values
 (:D7, 1000, 'option', 'Option énorme 1', 1000, 'u', 6000000000, 2000, false, 6000000000, 2),
 (:D7, 2000, 'option', 'Option énorme 2', 1000, 'u', 6000000000, 2000, false, 6000000000, 3);
set local session_replication_role = origin;
set local client_min_messages = warning;
\o /dev/null
\ir schema.sql
\o
execute lire(:D7, '0|0|0|0|0|0|3');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 3. LA GARDE, SECOND REFUS (BASE-2) : un ancien devis À POSTES, à l horloge maximale ==='
\echo '    D8 un poste de 70,00 € à 10 % (ttc 7700), horloge 9007199254740991 : le rattrapage l exclut —'
\echo '       generation + 1 sortirait de la borne d OP016 — et son total toutes options resterait à 0, sous'
\echo '       son ttc : devis_calculs_check le refuserait.'
\echo '    attendu, DANS CET ORDRE :'
\echo '      1. ERROR P0001 « Rattrapage du lot 2a (schema.sql, section 49.6 ter) arrêté avant d écrire quoi que ce'
\echo '         soit. Devis dont le numéro d écriture est à la borne (9 007 199 254 740 991) et que le rattrapage'
\echo '         devrait récrire : 1 … », qui NOMME d4930000-0000-4000-8000-000000000008 ;'
\echo '      2. puis, le rejeu continuant, ce que la garde évite : ERROR 23514 « check constraint'
\echo '         "devis_calculs_check" of relation "devis" is violated by some row » — un refus qui ne dit ni'
\echo '         quel devis, ni pourquoi ;'
\echo '      3. aucune OP016 (le rattrapage ne l a pas touché), aucun autre ERROR ; D8 intact (valeurs_attendu_t t)'
-- ==========================================================================
begin;
alter table public.devis drop constraint devis_calculs_check;
set local session_replication_role = replica;
insert into public.devis (id, pro_id, objet, total_ht_centimes, total_tva_centimes, total_ttc_centimes,
                          total_ttc_options_centimes, generation) values
 (:D8, :A, 'D8 postes, horloge max', 7000, 700, 7700, 0, 9007199254740991);
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite,
                                 prix_unitaire_centimes, taux_tva_centiemes, offert, total_centimes, generation) values
 (:D8, 1000, 'poste', 'Poste', 1000, 'u', 7000, 1000, false, 7000, 2);
insert into public.devis_tva (devis_id, taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes) values
 (:D8, 1000, 7000, 700, 1);
set local session_replication_role = origin;
set local client_min_messages = warning;
\o /dev/null
\ir schema.sql
\o
execute lire(:D8, '7000|700|7700|0|0|0|9007199254740991');
rollback;

\echo ''
\echo '=== FIN — la base est revenue à son état de départ (chaque partie s est annulée) ==='
\echo '    et ce fichier a écrit EXACTEMENT 4 lignes « psql:… ERROR », dont 2 « P0001: Rattrapage du lot 2a »'
\echo '    (parties 2 et 3) : un autre compte est un ÉCHEC — la garde ne se juge que comme ça (en-tête).'
select count(*) = 0 as aucun_devis_de_l_essai_attendu_t
  from public.devis where id::text like 'd4930000-%';
select count(*) = 1 as devis_calculs_check_en_place_attendu_t
  from pg_constraint where conrelid = 'public.devis'::regclass and conname = 'devis_calculs_check';
