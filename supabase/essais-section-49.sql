-- ==========================================================================
--  ESSAIS DE LA SECTION 49 — le chiffrage : le devis en brouillon, ses
--  lignes, sa TVA (lot 1 du module devis)
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` puis
--  `schema.sql` rejoué DEUX fois, DEPUIS LA RACINE DU DÉPÔT (le cas 30 lit
--  `supabase/cas-devis.json`) :
--
--      psql -h /tmp -p 5433 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-49.sql
--
--  LES SIRET DE CES ESSAIS SONT FICTIFS, et vérifiés. Leurs SIREN
--  (000049007, 000049106) ont une clé de Luhn juste, les SIRET aussi, et
--  tous ont été cherchés au répertoire Sirene (recherche-entreprises.api.
--  gouv.fr) le 21/10/2026 : aucun résultat. CLAUDE.md interdit le SIRET
--  d'une vraie entreprise, même pour un essai.
--
--  DES CAS ATTENDENT UNE ERREUR — 73 refus, et c'est le but : un essai de
--  sécurité qui ne montre aucun refus n'éprouve rien. Chacun est annoncé
--  dans son `\echo` PAR SON NOM : la contrainte (`devis_ligne_…_check`), le
--  code (`OP013`, `OP014`, `OP015`, `OP016`, `OP017`, `23505`), « permission
--  denied for table … » ou « … for function … ». Un « ERROR » qui ne porte pas le nom annoncé est un ÉCHEC de
--  l'essai, même s'il a l'air d'un refus. `\set VERBOSITY verbose` affiche
--  le code de chaque erreur. psql préfixe chaque ligne d'erreur par le nom
--  du fichier : un `grep '^ERROR'` ne les voit pas.
--
--  SES RÈGLES, et aucune n'est décorative :
--
--   1. CHAQUE CAS EST DANS SON PROPRE `begin … rollback`, ET CONSTRUIT SON
--      PROPRE ÉTAT (`execute devis_ref; execute lignes_ref;`). Aucun cas ne
--      dépend d'un autre.
--   2. CHAQUE « 0 » EST PRÉCÉDÉ, DANS LA MÊME TRANSACTION, DU « 1 » QUI LE
--      REND CRÉDIBLE : A lit son devis, PUIS B lit 0.
--   3. CHAQUE ORDRE QUI DOIT ÉCHOUER EST LE DERNIER DE SA TRANSACTION —
--      sauf derrière un `savepoint`, qui est dit (cas 11 e).
--   4. AUCUN CAS DE RLS DANS UN BLOC `do $$ … $$` : à l'intérieur, les
--      politiques ne sont PAS appliquées (01/10/2026). `set local role
--      authenticated;` puis `set local request.jwt.claim.sub = :A;`, chacun
--      dans son propre ordre.
--   5. TOUTE SUPPRESSION COMPTE LES LIGNES AVANT ET APRÈS, même quand elle
--      doit réussir.
--   6. UN REFUS ATTENDU SE LIT PAR SON NOM, jamais par la seule présence
--      d'« ERROR ».
--   7. LA SÉCURITÉ SE DEMANDE AU CATALOGUE, PAS AU TEXTE. Un contrôle qui
--      lit du texte (`verifier-devis`, `verifier-legal`, `verifier-portes`)
--      ne peut pas voir toutes les formes qu'un SQL peut prendre : deux
--      relectures en ont trouvé dix-sept qui lui échappaient (guillemets,
--      `begin atomic`, corps entre apostrophes, procédure, `public . x`,
--      `grant` sans `public.` ou en masse, nom de politique sans guillemets,
--      appel non qualifié, `insert into x (cols)`…), avec des dommages
--      prouvés. LA PREUVE DE SÉCURITÉ EST CET ESSAI, QUI INTERROGE LA BASE
--      REJOUÉE : droits par rôle et par colonne (cas 26), fonctions par
--      `prosrc` ET `prosqlbody`, `definer` en listes fermées, dépendances,
--      règles et déclencheurs (cas 27), politiques (cas 28). Une propriété de
--      sécurité ajoutée au schéma s'ajoute ICI, par le catalogue ; un motif
--      de texte en plus ne remplace jamais ce cas.
--
--  ET LA RÈGLE DE LA PARADE (section 49.5 bis) : toute écriture DIRECTE
--  d'un devis ou d'une ligne porte un NUMÉRO (`generation`) plus grand que
--  l'horloge du devis — ici comme dans le téléphone. Le devis de référence
--  naît à l'horloge 1, ses neuf lignes portent 2 à 10 ; chaque cas écrit
--  ensuite 11, 12, 13… Une écriture sans numéro neuf est refusée (OP015),
--  une écriture sans numéro du tout, ou hors de ses bornes (1 à 2^53 − 1),
--  par OP016 : le cas 32 le prouve, et c'est pour cela que chaque `update`
--  ci-dessous en porte un. Une CASCADE (`set null`, cas 22 et 23) n'en porte
--  pas, et passe : c'est ce que ces deux cas éprouvent aussi.
--
--  LES CARACTÈRES INVISIBLES s'écrivent en séquences `\u…` dans un `E'…'`,
--  jamais en caractères littéraux (relecture des essais de l'étape 3, M9) :
--  un éditeur qui les normaliserait ferait passer les cas 4l et 20 sur des
--  espaces ordinaires, sans un mot.
--
--  ---------------------------------------------------------------------
--  LA CONCURRENCE ET LA REQUÊTE TARDIVE — à part, à DEUX sessions
--  ---------------------------------------------------------------------
--  Deux sessions ne se jouent pas par un seul `psql -f`. La procédure, sur
--  une base où ce fichier a tourné (les comptes A et B existent) :
--
--   A. LA CONCURRENCE (le verrou de `recalcule_devis`), quatre passages, une
--      base neuve chacun (`create database … template …`). Préparation, en
--      superutilisateur : un devis de A, à l'horloge 10, VALIDÉ.
--        session 1 : begin; set local role authenticated;
--                    set local request.jwt.claim.sub = '<A>';
--                    insert une ligne (1 u à 10,00 €, taux 1000, n° 20);
--                    select pg_sleep(3); commit;
--        session 2 (lancée 1 s après) : la même, une AUTRE ligne au MÊME taux
--                    (n° 21) — au même taux, sinon chaque recalcul upserte
--                    sa propre ligne de ventilation et le total est juste
--                    même sans verrou : un essai qui ne peut pas échouer
--                    n'éprouve rien.
--      | passage | verrou de `recalcule_devis`  | témoin | attendu                     |
--      | 1       | AUCUN (sabotage)             | non    | 2 lignes en base, HT 1000   |
--      | 2       | `for no key update`          | non    | HT 2000, nb_lignes 2        |
--      | 3       | `for update` (sabotage)      | OUI    | 40P01 deadlock detected     |
--      | 4       | `for no key update`          | OUI    | aucun interblocage, HT 2000 |
--      Le témoin vit dans `essais-section-49-temoin.sql`, JAMAIS dans
--      `schema.sql` : un déclencheur `S_attente` (entre `RI_…` et `trg_…`
--      dans l'alphabet) qui dort 2 s, et élargit la fenêtre entre la
--      vérification de clé et le recalcul.
--
--   B. LA REQUÊTE TARDIVE (49.5 bis), mêmes deux sessions : la plus
--      récente (n° 13, 60 €) tient le verrou de la ligne trois secondes ;
--      la tardive (n° 12, 50 €) part pendant ce temps, attend, puis passe
--      — et doit être refusée (OP015) : la base garde 60 €. Les autres
--      formes (insertion tardive d'une ligne retirée, suppression tardive
--      d'une ligne retouchée ou du brouillon, en-tête ancien, deux
--      appareils) se jouent l'une après l'autre : elles sont au cas 32.
--      Sur une base SANS la parade, chacune doit se produire (50 € gagne,
--      la ligne revient, la ligne retouchée part…) : un essai qui ne
--      montre pas le défaut sans la règle n'éprouve pas la règle. Et le
--      DÉPLACEMENT tardif (49.5 bis, point 6) se joue aussi à deux
--      sessions : la retouche (n° 20) validée, puis le déplacement (n° 15)
--      vers un second devis à l'horloge basse — refusé (OP015).
--
--   C. LE PLAFOND PAR DEMANDE (OP017), sous son verrou consultatif : deux
--      sessions de A, chacune devant 19 devis liés à QA (validés), créent
--      chacune le 20e, la première dormant 3 s avant de valider. Attendu :
--      20 en base, la seconde reçoit OP017. Sans le verrou (sabotage), les
--      deux comptaient 19 : 21 en base — la leçon d'OP014.
-- ==========================================================================

\set VERBOSITY verbose
\set SHOW_CONTEXT never
\pset footer off

\set A '''a4900000-0000-4000-8000-00000000000a'''
\set B '''a4900000-0000-4000-8000-00000000000b'''
\set P '''a4900000-0000-4000-8000-00000000000e'''
\set C1 '''c4900000-0000-4000-8000-0000000000c1'''
\set CB '''c4900000-0000-4000-8000-0000000000cb'''
\set QA '''e4900000-0000-4000-8000-00000000a0a1'''
\set QB '''e4900000-0000-4000-8000-00000000a0b1'''
\set SA '''e4900000-0000-4000-8000-00000000b0a1'''
\set SB '''e4900000-0000-4000-8000-00000000b0b1'''
\set DREF '''d4900000-0000-4000-8000-0000000000d1'''
\set D2 '''d4900000-0000-4000-8000-0000000000d2'''
\set DB '''d4900000-0000-4000-8000-0000000000db'''
\set DV '''d4900000-0000-4000-8000-0000000000d0'''
\set DX '''d4900000-0000-4000-8000-0000000000dd'''
\set L1 '''f4900000-0000-4000-8000-000000000001'''
\set L3 '''f4900000-0000-4000-8000-000000000003'''
\set L4 '''f4900000-0000-4000-8000-000000000004'''
\set L5 '''f4900000-0000-4000-8000-000000000005'''
\set L6 '''f4900000-0000-4000-8000-000000000006'''
\set L7 '''f4900000-0000-4000-8000-000000000007'''
\set LX '''f4900000-0000-4000-8000-0000000000ff'''

-- --------------------------------------------------------------------------
--  LE MÉNAGE DE TÊTE — le fichier se rejoue. Ceci se fait EN LOCAL, sous
--  psql : sur la vraie base, un compte d'essai se supprime par le chemin de
--  l'application (CLAUDE.md), et le connecteur n'est jamais concerné.
-- --------------------------------------------------------------------------
delete from auth.users where id::text like 'a4900000-%';

-- --------------------------------------------------------------------------
--  LES PREUVES DU RÉPERTOIRE, posées en superutilisateur AVANT les comptes
--  (sinon OP006) : A, une SARL en siège ; B, une SARL en siège.
-- --------------------------------------------------------------------------
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

-- Deux artisans, un particulier ; une fiche du carnet de chacun ; une
-- demande de devis et une urgence de P à chacun, ACCEPTÉES. Le tout VALIDÉ :
-- c'est le décor commun, que chaque cas lit sans le modifier pour de bon.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a4900@exemple-opus.test',jsonb_build_object('type','pro','siret','00004900700016','nom','A Essais','entreprise','A Essais','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
 (:B,'b4900@exemple-opus.test',jsonb_build_object('type','pro','siret','00004910600016','nom','B Essais','entreprise','B Essais','metiers',jsonb_build_array('plombier'),'ville','Aix (13)')),
 (:P,'p4900@exemple-opus.test',jsonb_build_object('type','particulier','nom','P Essais','ville','Lambesc (13)'));
insert into public.clients (id, pro_id, type, nom, adresse, code_postal, ville) values
 (:C1, :A, 'particulier', 'Client essai A', '4 rue de l''Essai', '13410', 'Lambesc'),
 (:CB, :B, 'particulier', 'Client essai B', '9 rue de l''Essai', '13100', 'Aix-en-Provence');
insert into public.quote_requests (id, client_id, professional_id, metier, description, ville, budget, statut) values
 (:QA, :P, :A, 'macon', 'Refaire la salle de bain', 'Lambesc', 'environ 2 000 €', 'accepte'),
 (:QB, :P, :B, 'plombier', 'Changer un chauffe-eau', 'Lambesc', null, 'accepte');
insert into public.sos_requests (id, client_id, professional_id, metier_key, probleme_key, statut) values
 -- « plomberie » et non plus « maconnerie » : depuis le lot S-b (26/10/2026),
 -- `sos_metier_key_check` n'accepte que les quatre clés d'urgence. L'essai ne
 -- regarde pas le métier de l'urgence, seulement le lien du devis.
 (:SA, :P, :A, 'plomberie', 'fuite', 'acceptee'),
 (:SB, :P, :B, 'plomberie', 'fuite', 'acceptee');
commit;

-- LE DEVIS DE RÉFÉRENCE DE A — lié à C1, QA ET SA (la double cascade du
-- cas 24 en dépend), source « demande », retenue 5 %, horloge 1. Ses neuf
-- lignes, n° 2 à 10 :
--   zone « Rez-de-chaussée » ; pièce « Salle de bain » (sol 6,5 m², murs
--   21 m²) ; quatre postes à DEUX taux ; un poste « Offert » qui GARDE sa
--   valeur de 45,00 € ; une option ; une réserve.
--
-- LES TOTAUX, CALCULÉS À LA MAIN :
--   « Dépose du carrelage » 6,500 m² × 18,00 € à 10 %  → 117,00 € (main-d'œuvre AU M² : accepté)
--   « Pose de faïence »     21,000 m² × 42,55 € à 10 % → 893,55 €
--   « Joint silicone » offert, 1 u × 45,00 € à 10 %    →   0,00 € (le prix est GARDÉ)
--        base 10 %  = 11 700 + 89 355 + 0 = 101 055 c ; TVA = 10 105,5 → 10 106 c (le demi monte)
--   « Receveur de douche »  1 u × 389,90 € à 20 %      → 389,90 €
--   « Évacuation des gravats » 1 forfait × 150,00 € à 20 % → 150,00 €
--        base 20 %  = 38 990 + 15 000 = 53 990 c ; TVA = 10 798 c
--   HT 155 045 c, TVA 20 904 c, TTC 175 949 c ; ventilation 1000:101055:10106:3, 2000:53990:10798:2.
--   L'option « Niche murale » (220,00 € à 10 %) n'entre NULLE PART.
prepare devis_ref as
  insert into public.devis (id, pro_id, client_id, quote_request_id, sos_request_id, source, objet,
                            lieu_adresse, lieu_code_postal, lieu_ville, delai_execution,
                            retenue_garantie_centiemes, generation)
  values (:DREF, :A, :C1, :QA, :SA, 'demande', 'Rénovation de la salle de bain',
          '4 rue de l''Essai', '13410', 'Lambesc', 'Dans les 30 jours suivant la signature du devis', 500, 1);
prepare lignes_ref as
  insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                   prix_unitaire_centimes, taux_tva_centiemes, offert, main_oeuvre,
                                   fourniture_non_comprise, surface_sol_milliemes, surface_murs_milliemes, generation)
  values
   (:L1, :DREF, 1000, 'zone',    'Rez-de-chaussée',          null,  null,      null,  null, false, false, false, null, null, 2),
   ('f4900000-0000-4000-8000-000000000002', :DREF, 2000, 'piece', 'Salle de bain', null, null, null, null, false, false, false, 6500, 21000, 3),
   (:L3, :DREF, 3000, 'poste',   'Dépose du carrelage',      6500,  'm2',      1800,  1000, false, true,  false, null, null, 4),
   (:L4, :DREF, 4000, 'poste',   'Pose de faïence',          21000, 'm2',      4255,  1000, false, true,  false, null, null, 5),
   (:L5, :DREF, 5000, 'poste',   'Receveur de douche',       1000,  'u',       38990, 2000, false, false, false, null, null, 6),
   (:L6, :DREF, 6000, 'poste',   'Évacuation des gravats',   1000,  'forfait', 15000, 2000, false, false, true,  null, null, 7),
   (:L7, :DREF, 7000, 'poste',   'Joint silicone',           1000,  'u',       4500,  1000, true,  false, false, null, null, 8),
   ('f4900000-0000-4000-8000-000000000008', :DREF, 8000, 'option', 'Niche murale', 1000, 'u', 22000, 1000, false, false, false, null, null, 9),
   ('f4900000-0000-4000-8000-000000000009', :DREF, 9000, 'reserve', 'Sous réserve de l''état du support', null, null, null, null, false, false, false, null, null, 10);
-- Un devis VIDE de A, pour les refus de ligne (horloge 1).
prepare devis_vide as
  insert into public.devis (id, pro_id, generation) values (:DV, :A, 1);
-- Ce qu'on relit d'un devis, en une ligne.
prepare totaux(uuid) as
  select d.total_ht_centimes as ht, d.total_tva_centimes as tva, d.total_ttc_centimes as ttc,
         coalesce((select string_agg(concat_ws(':', t.taux_tva_centiemes, t.base_centimes, t.tva_centimes, t.nb_lignes),
                                     ',' order by t.taux_tva_centiemes)
                     from public.devis_tva t where t.devis_id = d.id), '—') as ventilation_toutes_lignes,
         d.generation as horloge
    from public.devis d where d.id = $1;


-- ==========================================================================
\echo ''
\echo '=== 0. LA DONNÉE EXISTE — A lit son devis de référence, et les totaux sont ceux calculés à la main ==='
-- ==========================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_ref;
execute lignes_ref;
select count(*) as devis_de_A_attendu_1 from public.devis;
select count(*) as lignes_attendu_9 from public.devis_lignes where devis_id = :DREF;
select count(*) as taux_presents_attendu_2 from public.devis_tva where devis_id = :DREF and nb_lignes > 0;
\echo '-- attendu : 155045 | 20904 | 175949 | 1000:101055:10106:3,2000:53990:10798:2 | horloge 10'
execute totaux(:DREF);
\echo '-- la ligne « Offert » : prix 4500 GARDÉ, total 0 ; l''option : 22000, hors totaux'
select designation, prix_unitaire_centimes as prix, total_centimes as total, offert
  from public.devis_lignes where devis_id = :DREF and (offert or type = 'option') order by ordre;
reset role;
select count(*) as devis_en_superutilisateur_attendu_1 from public.devis where pro_id = :A;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 1. LES COLONNES — la liste FERMÉE (cahier §2.2-2.4, plus `generation`, 49.5 bis) ==='
-- ==========================================================================
select t.table_name,
       string_agg(c.column_name || ':' || c.data_type || ':' || c.is_nullable, ',' order by c.ordinal_position)
         = case t.table_name
             when 'devis' then 'id:uuid:NO,pro_id:uuid:NO,client_id:uuid:YES,quote_request_id:uuid:YES,sos_request_id:uuid:YES,source:text:NO,statut:text:NO,objet:text:YES,lieu_adresse:text:YES,lieu_code_postal:text:YES,lieu_ville:text:YES,delai_execution:text:YES,retenue_garantie_centiemes:integer:YES,total_ht_centimes:bigint:NO,total_tva_centimes:bigint:NO,total_ttc_centimes:bigint:NO,generation:bigint:NO,created_at:timestamp with time zone:NO,modifie_le:timestamp with time zone:NO'
             when 'devis_lignes' then 'id:uuid:NO,devis_id:uuid:NO,ordre:integer:NO,type:text:NO,designation:text:YES,quantite_milliemes:bigint:YES,unite:text:YES,prix_unitaire_centimes:bigint:YES,taux_tva_centiemes:integer:YES,total_centimes:bigint:YES,offert:boolean:NO,main_oeuvre:boolean:NO,fourniture_non_comprise:boolean:NO,surface_sol_milliemes:bigint:YES,surface_murs_milliemes:bigint:YES,generation:bigint:NO,modifie_le:timestamp with time zone:NO'
             when 'devis_tva' then 'devis_id:uuid:NO,taux_tva_centiemes:integer:NO,base_centimes:bigint:NO,tva_centimes:bigint:NO,nb_lignes:integer:NO'
           end as liste_fermee_attendu_t,
       count(*) as colonnes
  from (values ('devis'), ('devis_lignes'), ('devis_tva')) t(table_name)
  join information_schema.columns c on c.table_schema = 'public' and c.table_name = t.table_name
 group by t.table_name order by t.table_name;
select count(*) as colonnes_interdites_attendu_0
  from information_schema.columns
 where table_schema = 'public' and table_name in ('devis', 'devis_lignes', 'devis_tva')
   and (column_name in ('compte_id', 'particulier_id', 'demande_id', 'visite_id', 'dossier_id', 'nature',
                        'date_redaction', 'taux_justification', 'regime_tva')
        or data_type in ('numeric', 'real', 'double precision'));


-- ==========================================================================
\echo ''
\echo '=== 2. LES CONTRAINTES — 23 check, toutes en _check, aucune numérotée ==='
-- ==========================================================================
select count(*) as check_attendu_23,
       count(*) filter (where conname !~ '_check$') as non_suffixees_attendu_0,
       count(*) filter (where conname ~ '_check[0-9]+$') as numerotees_attendu_0
  from pg_constraint
 where contype = 'c' and conrelid in ('public.devis'::regclass, 'public.devis_lignes'::regclass, 'public.devis_tva'::regclass);
\echo '-- les dix de devis_lignes, dans l''ordre où PostgreSQL les applique (designation < forme < offert < prix < quantite < surfaces < taux < total < type < unite)'
select string_agg(conname, ' ' order by conname) as contraintes_de_ligne
  from pg_constraint where contype = 'c' and conrelid = 'public.devis_lignes'::regclass;


-- ==========================================================================
\echo ''
\echo '=== 3. D4-a — les seules clés obligatoires : l entreprise, le devis ; les liens en SET NULL ==='
-- ==========================================================================
select c.conrelid::regclass as table_, a.attname as colonne, a.attnotnull as obligatoire, c.confdeltype as en_suppression
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
 where c.contype = 'f' and c.conrelid in ('public.devis'::regclass, 'public.devis_lignes'::regclass, 'public.devis_tva'::regclass)
 order by 1, 2;
\echo '-- attendu : devis.pro_id t c ; client_id, quote_request_id, sos_request_id f n ; devis_lignes.devis_id t c ; devis_tva.devis_id t c'


-- ==========================================================================
\echo ''
\echo '=== 4. LES REFUS DE FORME d une ligne — chaque nom lu (A, jeton, un devis vide) ==='
-- ==========================================================================
\echo '--- 4a. quantité 0 → devis_ligne_quantite_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Chape', 0, 'm2', 1000, 1000, 2);
rollback;
\echo '--- 4b. quantité −1 → devis_ligne_quantite_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Chape', -1, 'm2', 1000, 1000, 2);
rollback;
\echo '--- 4c. quantité 100 000 000 (100 000 m²) → devis_ligne_quantite_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Chape', 100000000, 'm2', 1000, 1000, 2);
rollback;
\echo '--- 4d. quantité 3 000 000 000 → devis_ligne_quantite_check (jamais un 22003)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Chape', 3000000000, 'm2', 1000, 1000, 2);
rollback;
\echo '--- 4e. prix −1 → devis_ligne_prix_check (et NON offert_check : l écart n° 1, « <> 0 »)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Remise', 1000, 'u', -1, 1000, 2);
rollback;
\echo '--- 4f. prix 0 sans « Offert » → devis_ligne_offert_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Gratuit', 1000, 'u', 0, 1000, 2);
rollback;
\echo '--- 4g. taux 1960 (l ancien taux normal) → devis_ligne_taux_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Chape', 1000, 'm2', 1000, 1960, 2);
rollback;
\echo '--- 4h. taux 105 (1,05 %, outre-mer) sur une LIGNE → devis_ligne_taux_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Chape', 1000, 'm2', 1000, 105, 2);
rollback;
\echo '--- 4i. un titre qui porte un prix → devis_ligne_forme_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, prix_unitaire_centimes, generation)
values (:DV, 1000, 'zone', 'Étage', 1000, 2);
rollback;
\echo '--- 4j. un type « remise » → devis_ligne_type_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'remise', 'Geste commercial', 1000, 'u', 1000, 1000, 2);
rollback;
\echo '--- 4k. l unité « ml » → devis_ligne_unite_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Plinthes', 1000, 'ml', 1000, 1000, 2);
rollback;
\echo '--- 4l. une désignation faite d un U+200B → devis_ligne_designation_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, generation)
values (:DV, 1000, 'zone', E'\u200b', 2);
rollback;
\echo '--- 4m. des surfaces sur un POSTE → devis_ligne_forme_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, surface_sol_milliemes, generation)
values (:DV, 1000, 'poste', 'Chape', 1000, 'm2', 1000, 1000, 17000, 2);
rollback;
\echo '--- 4n. une surface de 0 sur une PIÈCE → devis_ligne_surfaces_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, surface_sol_milliemes, generation)
values (:DV, 1000, 'piece', 'Cuisine', 0, 2);
rollback;
\echo '--- 4o. un poste SANS taux → devis_ligne_forme_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, generation)
values (:DV, 1000, 'poste', 'Chape', 1000, 'm2', 1000, 2);
rollback;
\echo '--- 4p. un « Offert » dont la VALEUR dépasse le plafond → devis_ligne_total_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, offert, generation)
values (:DV, 1000, 'poste', 'Cadeau démesuré', 99999999, 'u', 9999999999, 1000, true, 2);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 4 bis. LES REFUS DU DEVIS — chaque nom lu ==='
-- ==========================================================================
\echo '--- retenue 501 (5,01 %) → devis_retenue_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, retenue_garantie_centiemes, generation) values (:A, 501, 1);
rollback;
\echo '--- retenue 0 → devis_retenue_check (0 n est pas « aucune » : aucune, c est vide)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, retenue_garantie_centiemes, generation) values (:A, 0, 1);
rollback;
\echo '--- source « qr » → devis_source_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, source, generation) values (:A, 'qr', 1);
rollback;
\echo '--- statut « remis » → devis_statut_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, statut, generation) values (:A, 'remis', 1);
rollback;
\echo '--- code postal « 1341 » → devis_lieu_code_postal_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, lieu_code_postal, generation) values (:A, '1341', 1);
rollback;
\echo '--- objet de 1 001 caractères → devis_objet_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, objet, generation) values (:A, repeat('a', 1001), 1);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 4 ter. LA DOUBLE FAUTE : quantité 0 ET prix 0 sans « Offert » → devis_ligne_offert_check (l ordre alphabétique) ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Double faute', 0, 'm2', 0, 1000, 2);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 4 quater. CE QUE LA v1 REFUSAIT ET QUE LA v2 ACCEPTE ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
\echo '-- un poste « Main-d œuvre » AU M² : INSERT 0 1 attendu (arrêté du 24/01/2017, art. 2)'
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, main_oeuvre, generation)
values (:LX, :DV, 1000, 'poste', 'Pose au m²', 17000, 'm2', 4200, 1000, true, 2);
\echo '-- un « Offert » sur 10,00 € : prix 1000, total 0'
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, offert, generation)
values ('f4900000-0000-4000-8000-0000000000fe', :DV, 2000, 'poste', 'Petit geste', 1000, 'u', 1000, 1000, true, 3);
select prix_unitaire_centimes as prix_attendu_1000, total_centimes as total_attendu_0
  from public.devis_lignes where id = 'f4900000-0000-4000-8000-0000000000fe';
\echo '-- « Offert » éteint : total 1000, le prix revenu tout seul'
update public.devis_lignes set offert = false, generation = 4 where id = 'f4900000-0000-4000-8000-0000000000fe';
select prix_unitaire_centimes as prix_attendu_1000, total_centimes as total_attendu_1000
  from public.devis_lignes where id = 'f4900000-0000-4000-8000-0000000000fe';
-- LES SEPT UNITÉS, INSÉRÉES POUR DE VRAI — relecture des essais de l'étape
-- 3, 2e tour (N13) : une contrainte qui gardait sa liste de sept mais
-- ajoutait `and unite not in ('jour', 'm3')` passait l'essai ET le contrôle
-- (qui compare la LISTE écrite), et la base refusait toute ligne au jour —
-- la panne du format `montage`, exactement (CLAUDE.md : « toute écriture
-- nouvelle doit être insérée pour de vrai dans PostgreSQL »). Le refus de
-- « ml » (4k) ne prouve pas l'ACCEPTATION des sept ; cette insertion, si.
\echo '-- les sept unités de devis.js (UNITES), une ligne chacune : INSERT 0 7 attendu, puis les sept relues'
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, main_oeuvre, generation) values
 (:DV, 3000, 'poste', 'Chape',          1000, 'm2',      1000, 1000, false, 5),
 (:DV, 3100, 'poste', 'Plinthes',       1000, 'm',       1000, 1000, false, 6),
 (:DV, 3200, 'poste', 'Béton',          1000, 'm3',      1000, 1000, false, 7),
 (:DV, 3300, 'poste', 'Robinet',        1000, 'u',       1000, 1000, false, 8),
 (:DV, 3400, 'poste', 'Main-d''œuvre',  1000, 'h',       1000, 1000, true,  9),
 (:DV, 3500, 'poste', 'Compagnon',      1000, 'jour',    1000, 1000, true,  10),
 (:DV, 3600, 'poste', 'Évacuation',     1000, 'forfait', 1000, 1000, false, 11);
select string_agg(unite, ',' order by unite) = 'forfait,h,jour,m,m2,m3,u' as sept_unites_acceptees_attendu_t,
       count(*) as lignes_attendu_7
  from public.devis_lignes where devis_id = :DV and ordre between 3000 and 3600;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 5. LE TOTAL D UNE LIGNE VIENT DE LA BASE — A envoie total_centimes = 1 sur 2,5 m² à 33,33 € ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, total_centimes, generation)
values (:LX, :DV, 1000, 'poste', 'Ragréage', 2500, 'm2', 3333, 2000, 1, 2);
select total_centimes as total_attendu_8333 from public.devis_lignes where id = :LX;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 6. LA MÉTHODE — 3 postes à 33,33 € à 10 % : base 9999, TVA 1000 (et non 999) ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation) values
 (:DV, 1000, 'poste', 'Poste A', 1000, 'u', 3333, 1000, 2),
 (:DV, 2000, 'poste', 'Poste B', 1000, 'u', 3333, 1000, 3),
 (:DV, 3000, 'poste', 'Poste C', 1000, 'u', 3333, 1000, 4);
\echo '-- attendu : 9999 | 1000 | 10999 | 1000:9999:1000:3'
execute totaux(:DV);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 7. LES FONCTIONS SEULES ==='
-- ==========================================================================
select public.devis_tva_de(5, 1000) as tva_5c_10pc_attendu_1,
       public.devis_tva_de(300, 550) as tva_300c_5_5pc_attendu_17,
       public.devis_tva_de(1000, 105) as tva_1000c_1_05pc_attendu_11,
       public.devis_tva_de(200, 175) as tva_200c_1_75pc_attendu_4,
       public.devis_tva_de(-6, 1000) as negatif_attendu_null;
select public.devis_total_ligne(2500, 3333) as ligne_attendu_8333,
       public.devis_total_ligne(0, 100) as quantite_nulle_attendu_null,
       public.devis_total_ligne(1000, -1) as prix_negatif_attendu_null;
\echo '-- la borne du taux (écart n° 2) : au-delà de 9000, NULL — et non une erreur 22003 en anglais'
select public.devis_tva_de(999999999999999, 9224) as taux_9224_attendu_null,
       public.devis_tva_de(999999999999999, 9000) as taux_9000_attendu_899999999999999,
       public.devis_tva_de(10000, 9001) as taux_9001_attendu_null;


-- ==========================================================================
\echo ''
\echo '=== 8. LE RECALCUL DANS LES DEUX SENS ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
\echo '-- A retire les gravats (150,00 € à 20 %) — attendu : 140045 | 17904 | 157949 | 1000:101055:10106:3,2000:38990:7798:1'
select count(*) as lignes_avant_attendu_9 from public.devis_lignes where devis_id = :DREF;
delete from public.devis_lignes where id = :L6;
select count(*) as lignes_apres_attendu_8 from public.devis_lignes where devis_id = :DREF;
execute totaux(:DREF);
\echo '-- A passe le receveur de 20 % à 10 % — attendu : 140045 | 14005 | 154050 | 1000:140045:14005:4,2000:0:0:0 (le taux disparu reste, À ZÉRO)'
update public.devis_lignes set taux_tva_centiemes = 1000, generation = 11 where id = :L5;
execute totaux(:DREF);
\echo '-- A retire TOUT — attendu : 0 | 0 | 0 | 1000:0:0:0,2000:0:0:0'
delete from public.devis_lignes where devis_id = :DREF;
select count(*) as lignes_apres_attendu_0 from public.devis_lignes where devis_id = :DREF;
execute totaux(:DREF);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 9. LES INVARIANTS, sur tous les devis de la base d essai — comparés aux LIGNES, pas à la ventilation elle-même ==='
-- ==========================================================================
-- La première version comparait les totaux du devis à `devis_tva`… que
-- `tient_le_devis()` RELIT pour poser ces totaux : vrai par construction. Et
-- elle ne parcourait que les lignes de `devis_tva` qui EXISTENT : un taux
-- que le recalcul oublie n'y était pas, donc rien ne se comparait (relecture
-- des essais de l'étape 3, I-5 : un recalcul sans le 5,5 % passait ce cas à
-- 0 écart). On compare donc tout aux LIGNES, et la ventilation aux lignes
-- groupées par taux par une jointure COMPLÈTE, qui rougit dans les deux sens.
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation) values
 (:DV, 1000, 'poste', 'Poste 5,5 %', 3000, 'u', 333, 550, 2),
 (:DV, 2000, 'poste', 'Poste 20 %', 1500, 'h', 5682, 2000, 3);
reset role;
select count(*) as devis_examines_au_moins_2,
       count(*) filter (where d.total_ttc_centimes <> d.total_ht_centimes + d.total_tva_centimes) as ecart_ttc_attendu_0,
       count(*) filter (where d.total_ht_centimes <> (select coalesce(sum(l.total_centimes), 0) from public.devis_lignes l
                                                       where l.devis_id = d.id and l.type = 'poste')) as ecart_ht_aux_lignes_attendu_0,
       count(*) filter (where d.total_tva_centimes <> (select coalesce(sum(public.devis_tva_de(s.base, s.taux)), 0)
                                                         from (select l.taux_tva_centiemes as taux, sum(l.total_centimes)::bigint as base
                                                                 from public.devis_lignes l where l.devis_id = d.id and l.type = 'poste'
                                                                group by 1) s)) as ecart_tva_aux_lignes_attendu_0
  from public.devis d;
\echo '-- la ventilation contre les lignes groupées par taux, jointure COMPLÈTE : d abord combien de couples (devis, taux) se comparent (le « 4 » qui rend le « 0 » crédible)'
with lignes as (select l.devis_id, l.taux_tva_centiemes as taux, sum(l.total_centimes)::bigint as base, count(*)::int as nb
                  from public.devis_lignes l where l.type = 'poste' group by 1, 2),
     ventilation as (select t.devis_id, t.taux_tva_centiemes as taux, t.base_centimes as base, t.tva_centimes as tva, t.nb_lignes as nb
                       from public.devis_tva t where t.nb_lignes > 0)
select count(*) as couples_compares_attendu_4,
       count(*) filter (where x.base is distinct from v.base or x.nb is distinct from v.nb
                           or public.devis_tva_de(x.base, x.taux) is distinct from v.tva) as ecarts_ventilation_attendu_0
  from lignes x full join ventilation v using (devis_id, taux);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 10. LES TOTAUX NE S ÉCRIVENT PAS — A envoie 100 / 100 ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set total_ht_centimes = 100, total_tva_centimes = 0, total_ttc_centimes = 100, generation = 11 where id = :DREF;
\echo '-- attendu : relus, 155045 | 20904 | 175949'
execute totaux(:DREF);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 11. devis_tva NE S ÉCRIT PAS — c est le DROIT DE TABLE qui refuse ==='
-- ==========================================================================
\echo '--- 11a. A LIT sa ventilation (le « 1 » qui rend crédibles les refus)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
select count(*) as ventilation_lue_attendu_2 from public.devis_tva where devis_id = :DREF;
rollback;
\echo '--- 11b. insert direct → permission denied for table devis_tva'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
insert into public.devis_tva (devis_id, taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes) values (:DREF, 550, 0, 0, 0);
rollback;
\echo '--- 11c. update → permission denied for table devis_tva'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis_tva set tva_centimes = 0 where devis_id = :DREF;
rollback;
\echo '--- 11d. delete → permission denied for table devis_tva'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
delete from public.devis_tva where devis_id = :DREF;
rollback;
\echo '--- 11e. les trois, chacune derrière un savepoint (insert, update, delete → permission denied for table devis_tva ×3), puis la ventilation relue en superutilisateur : intacte'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
savepoint s0;
insert into public.devis_tva (devis_id, taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes) values (:DREF, 550, 0, 0, 0);
rollback to savepoint s0;
savepoint s1;
update public.devis_tva set tva_centimes = 0 where devis_id = :DREF;
rollback to savepoint s1;
savepoint s2;
delete from public.devis_tva where devis_id = :DREF;
rollback to savepoint s2;
reset role;
\echo '-- attendu : 1000:101055:10106:3,2000:53990:10798:2'
select string_agg(concat_ws(':', taux_tva_centiemes, base_centimes, tva_centimes, nb_lignes), ',' order by taux_tva_centiemes) as ventilation
  from public.devis_tva where devis_id = :DREF;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 12. QUI LIT — A, puis B, puis P, puis un visiteur ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
select count(*) as A_lit_son_devis_attendu_1 from public.devis where id = :DREF;
set local request.jwt.claim.sub = :B;
select (select count(*) from public.devis where id = :DREF) as B_devis_attendu_0,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as B_lignes_attendu_0,
       (select count(*) from public.devis_tva where devis_id = :DREF) as B_tva_attendu_0;
set local request.jwt.claim.sub = :P;
select (select count(*) from public.devis where id = :DREF) as P_devis_attendu_0,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as P_lignes_attendu_0,
       (select count(*) from public.devis_tva where devis_id = :DREF) as P_tva_attendu_0;
\echo '-- un visiteur sans compte → permission denied for table devis (le droit de table, pas une liste vide)'
set local role anon;
select count(*) from public.devis;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 13. QUI ÉCRIT CHEZ UN AUTRE — B ==='
-- ==========================================================================
\echo '--- 13a. B crée un devis au nom de A → new row violates row-level security policy for table "devis"'
begin; set local role authenticated; set local request.jwt.claim.sub = :B;
insert into public.devis (pro_id, generation) values (:A, 1);
rollback;
\echo '--- 13b. B ajoute une ligne au devis de A → new row violates row-level security policy for table "devis_lignes"'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
set local request.jwt.claim.sub = :B;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DREF, 9500, 'poste', 'Ajout de B', 1000, 'u', 100, 1000, 99);
rollback;
\echo '--- 13c. B modifie, puis supprime, le devis de A : UPDATE 0, DELETE 0 ; puis 1 devis et 9 lignes, comptés en superutilisateur'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
reset role;
select (select count(*) from public.devis where id = :DREF) as devis_avant_attendu_1,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as lignes_avant_attendu_9;
set local role authenticated;
set local request.jwt.claim.sub = :B;
update public.devis set objet = 'Écrit par B', generation = 99 where id = :DREF;
update public.devis_lignes set prix_unitaire_centimes = 1, generation = 99 where devis_id = :DREF;
delete from public.devis_lignes where devis_id = :DREF;
delete from public.devis where id = :DREF;
reset role;
select (select count(*) from public.devis where id = :DREF) as devis_attendu_1,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as lignes_attendu_9,
       (select objet from public.devis where id = :DREF) as objet_inchange;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 14. OP013 — un lien vers la fiche, la demande ou l urgence d UN AUTRE ==='
-- ==========================================================================
\echo '--- 14a. client_id = la fiche de B → OP013'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set client_id = :CB, generation = 11 where id = :DREF;
rollback;
\echo '--- 14b. quote_request_id = la demande adressée à B → OP013'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set quote_request_id = :QB, generation = 11 where id = :DREF;
rollback;
\echo '--- 14c. sos_request_id = l urgence adressée à B → OP013'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set sos_request_id = :SB, generation = 11 where id = :DREF;
rollback;
\echo '--- 14d. une fiche qui N EXISTE PAS → OP013 aussi (jamais 23503 : aucun oracle par l erreur)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set client_id = 'c4900000-0000-4000-8000-0000000000ee', generation = 11 where id = :DREF;
rollback;
\echo '--- 14e. les trois liens VIDÉS : UPDATE 1 ; puis remis à C1, QA, SA : UPDATE 1'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set client_id = null, quote_request_id = null, sos_request_id = null, generation = 11 where id = :DREF;
update public.devis set client_id = :C1, quote_request_id = :QA, sos_request_id = :SA, generation = 12 where id = :DREF;
select client_id = :C1 and quote_request_id = :QA and sos_request_id = :SA as liens_remis_attendu_t from public.devis where id = :DREF;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 14 bis. UN LIEN INCHANGÉ NE SE REVÉRIFIE PAS — et l essai PEUT échouer ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
reset role;
\echo '-- en superutilisateur, la demande QA passe à B'
update public.quote_requests set professional_id = :B where id = :QA;
set local role authenticated; set local request.jwt.claim.sub = :A;
\echo '-- A change l objet, lien inchangé : UPDATE 1'
update public.devis set objet = 'Objet retouché', generation = 11 where id = :DREF;
\echo '-- A vide quote_request_id : UPDATE 1'
update public.devis set quote_request_id = null, generation = 12 where id = :DREF;
\echo '-- A le remet à QA, qui n est plus à lui → OP013 (c est ce refus qui rend crédibles les deux UPDATE 1)'
update public.devis set quote_request_id = :QA, generation = 13 where id = :DREF;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 14 ter. LA PRÉMISSE D OP013 — sans la garde, la clé étrangère laisse passer la fiche d un autre ==='
-- ==========================================================================
begin;
alter table public.devis disable trigger trg_tient_le_devis;
set local role authenticated; set local request.jwt.claim.sub = :A;
\echo '-- attendu : INSERT 0 1 — c est ce « 1 » qui rend la garde NÉCESSAIRE'
insert into public.devis (pro_id, client_id, generation) values (:A, :CB, 1);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 14 quater. LES IDENTIFIANTS CHOISIS PAR LE TÉLÉPHONE — renvoyer ne double rien ==='
-- ==========================================================================
\echo '--- le devis : INSERT 0 1, puis le même identifiant → 23505 devis_pkey'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, generation) values (:DX, :A, 1);
insert into public.devis (id, pro_id, generation) values (:DX, :A, 2);
rollback;
\echo '--- la ligne : INSERT 0 1, puis le même identifiant → 23505 devis_lignes_pkey'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_vide;
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:LX, :DV, 1000, 'poste', 'Chape', 1000, 'm2', 1000, 1000, 2);
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:LX, :DV, 1000, 'poste', 'Chape', 1000, 'm2', 1000, 1000, 3);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 14 quinquies. OP013 À LA CRÉATION — la même garde, sur un INSERT (relecture des essais de l étape 3, I-1) ==='
-- ==========================================================================
-- Le cas 14 n'éprouvait la garde que sur des MODIFICATIONS ; le 14 ter
-- montrait l'insertion SANS la garde, jamais AVEC. Une version qui ne
-- vérifierait que les modifications passait donc tout l'essai — et l'artisan
-- rattachait, à la CRÉATION, un devis à la fiche d'un autre.
\echo '--- a. une création liée à la fiche de B → OP013'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, client_id, generation) values (:A, :CB, 1);
rollback;
\echo '--- b. une création liée à la demande adressée à B → OP013'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, quote_request_id, generation) values (:A, :QB, 1);
rollback;
\echo '--- c. une création liée à l urgence adressée à B → OP013'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, sos_request_id, generation) values (:A, :SB, 1);
rollback;
\echo '--- d. une création liée à une fiche qui N EXISTE PAS → OP013 (jamais 23503)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, client_id, generation) values (:A, 'c4900000-0000-4000-8000-0000000000ee', 1);
rollback;
\echo '--- e. le « 1 » qui rend ces quatre refus crédibles : une création liée à SES C1, QA, SA → INSERT 0 1'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, client_id, quote_request_id, sos_request_id, generation) values (:DX, :A, :C1, :QA, :SA, 1);
select count(*) as cree_avec_ses_liens_attendu_1 from public.devis where id = :DX and client_id = :C1 and quote_request_id = :QA and sos_request_id = :SA;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 15. UNE LIGNE CHANGE DE DEVIS — les deux totaux suivent ; chez B, refusé ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
insert into public.devis (id, pro_id, generation) values (:D2, :A, 1);
\echo '-- le receveur (389,90 € à 20 %) passe dans le second devis de A'
update public.devis_lignes set devis_id = :D2, generation = 11 where id = :L5;
\echo '-- attendu : 116055 | 13106 | 129161 | 1000:101055:10106:3,2000:15000:3000:1 | horloge 11 — le devis QUITTÉ reçoit AUSSI le numéro du déplacement (49.5 bis, point 6)'
execute totaux(:DREF);
\echo '-- attendu : 38990 | 7798 | 46788 | 2000:38990:7798:1'
execute totaux(:D2);
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DB, :B, 1);
set local request.jwt.claim.sub = :A;
\echo '-- puis vers le devis de B → new row violates row-level security policy for table "devis_lignes"'
update public.devis_lignes set devis_id = :DB, generation = 12 where id = :L5;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 16. LES PLAFONDS, À LA BORNE ==='
-- ==========================================================================
\echo '--- 16a. q = 1351, p = 7 401 924 500 → total = plafond + 1 c → devis_ligne_total_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Borne + 1', 1351, 'u', 7401924500, 0, 2);
rollback;
\echo '--- 16b. q = 1001, p = 9 990 009 989, en franchise → accepté, total 9999999999 AU plafond'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Au plafond', 1001, 'u', 9990009989, 0, 2);
\echo '-- attendu : 9999999999 | 0 | 9999999999 | 0:9999999999:0:1'
execute totaux(:DV);
rollback;
\echo '--- 16c. un poste de 90 000 000,00 € à 20 % : HT sous le plafond, TTC au-dessus → devis_plafond_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Très gros poste', 1000, 'forfait', 9000000000, 2000, 2);
rollback;
\echo '--- 16d. deux postes de 60 000 000,00 € : la SECONDE ligne → devis_plafond_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Moitié 1', 1000, 'forfait', 6000000000, 0, 2);
select count(*) as premiere_acceptee_attendu_1 from public.devis_lignes where devis_id = :DV;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 2000, 'poste', 'Moitié 2', 1000, 'forfait', 6000000000, 0, 3);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 16 bis. OP014 — 500 lignes, puis une 501e ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
\timing on
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
select :DV, g * 1000, 'poste', 'Ligne ' || g, 1000, 'u', 100, 1000, 1 + g from generate_series(1, 500) g;
\timing off
select count(*) as lignes_attendu_500 from public.devis_lignes where devis_id = :DV;
\echo '-- attendu : 50000 | 5000 | 55000 | 1000:50000:5000:500'
execute totaux(:DV);
\echo '-- la 501e → OP014, phrase complète'
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 501000, 'poste', 'Ligne 501', 1000, 'u', 100, 1000, 502);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 16 ter. OP014 PAR UN DÉPLACEMENT — une ligne qui rejoint un devis déjà plein ==='
-- ==========================================================================
-- Seule l'insertion était éprouvée (16 bis) ; un déplacement passe par le
-- même recalcul, sous le même verrou, et doit buter sur la même borne.
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
select :DV, g * 1000, 'poste', 'Ligne ' || g, 1000, 'u', 100, 1000, 1 + g from generate_series(1, 500) g;
insert into public.devis (id, pro_id, generation) values (:D2, :A, 1);
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:LX, :D2, 1000, 'poste', 'À déplacer', 1000, 'u', 100, 1000, 600);
select (select count(*) from public.devis_lignes where devis_id = :DV) as plein_attendu_500,
       (select count(*) from public.devis_lignes where devis_id = :D2) as second_attendu_1;
\echo '-- la ligne passe dans le devis plein → OP014'
update public.devis_lignes set devis_id = :DV, generation = 601 where id = :LX;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 17. L OPTION HORS DES TOTAUX ET HORS DE devis_tva ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation) values
 (:DV, 1000, 'poste',  'Poste',  1000, 'u', 3333, 1000, 2),
 (:DV, 2000, 'option', 'Option', 1000, 'u', 3333, 1000, 3),
 (:DV, 3000, 'option', 'Option à 20 %', 1000, 'u', 3333, 2000, 4);
\echo '-- attendu : 3333 | 333 | 3666 | 1000:3333:333:1 — aucune ligne 2000 (l option à 20 % n entre pas), nb_lignes 1 (et non 2)'
execute totaux(:DV);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 18. « OFFERT » SEUL À SON TAUX, avec une valeur ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, offert, generation) values
 (:DV, 1000, 'poste', 'Offert à 20 %', 1000, 'u', 1000, 2000, true, 2),
 (:DV, 2000, 'poste', 'Payé à 10 %',   1000, 'u', 1000, 1000, false, 3);
\echo '-- attendu : 1000 | 100 | 1100 | 1000:1000:100:1,2000:0:0:1 — le taux de l « Offert » est là, à base 0, nb_lignes 1'
execute totaux(:DV);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 19. CE QUE LA BASE POSE — la date de création, la source ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, created_at, source, generation) values (:DX, :A, '2001-01-01', 'demande', 1);
select created_at > now() - interval '1 hour' as cree_aujourd_hui_attendu_t, source as source_attendu_demande
  from public.devis where id = :DX;
create temporary table m19 on commit drop as select modifie_le from public.devis where id = :DX;
update public.devis set source = 'manuelle', created_at = '1999-01-01', generation = 2 where id = :DX;
select d.created_at > now() - interval '1 hour' as toujours_aujourd_hui_attendu_t,
       d.source as source_toujours_demande,
       d.modifie_le > m.modifie_le as modifie_le_a_bouge_attendu_t
  from public.devis d, m19 m where d.id = :DX;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 20. LE NETTOYAGE — un blanc n est pas une valeur ; le code postal perd ses espaces (liste EXPLICITE) ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, objet, lieu_code_postal, delai_execution, generation)
values (:DX, :A, E'  \n ', ' 13 410 ', E'\u00a0', 1);
select objet is null as objet_vide_attendu_t, lieu_code_postal as cp_attendu_13410, delai_execution is null as delai_vide_attendu_t
  from public.devis where id = :DX;
insert into public.devis_lignes (id, devis_id, ordre, type, designation, generation) values (:LX, :DX, 1000, 'zone', '  pose  ', 2);
select designation as designation_attendu_pose from public.devis_lignes where id = :LX;
\echo '-- U+00A0 et U+202F (l espace fine des milliers) sont retirés : 13410 ×2'
update public.devis set lieu_code_postal = E'13\u00a0410', generation = 3 where id = :DX;
select lieu_code_postal as cp_nbsp_attendu_13410 from public.devis where id = :DX;
update public.devis set lieu_code_postal = E'13\u202f410', generation = 4 where id = :DX;
select lieu_code_postal as cp_espace_fine_attendu_13410 from public.devis where id = :DX;
\echo '-- la tabulation VERTICALE est retirée : 13410 (relecture de la migration, 22/10)'
-- Pourquoi ce témoin, et le suivant : la classe du code postal est la SEULE
-- ligne de schema.sql écrite avec deux barres obliques inverses. Qu'une
-- barre se perde en route — un transport, un copier-coller — et la classe
-- contiendrait la LETTRE v au lieu de la tabulation verticale. Les espaces
-- ci-dessus passeraient pareil ; ces deux cas, non.
update public.devis set lieu_code_postal = E'13\x0b410', generation = 5 where id = :DX;
select lieu_code_postal as cp_tab_verticale_attendu_13410 from public.devis where id = :DX;
\echo '-- U+2002 n est PAS dans la liste (JavaScript non plus) → devis_lieu_code_postal_check'
update public.devis set lieu_code_postal = E'13\u2002410', generation = 6 where id = :DX;
rollback;

begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, generation) values (:DX, :A, 1);
\echo '-- la LETTRE v n est pas un blanc : 13v410 → devis_lieu_code_postal_check'
update public.devis set lieu_code_postal = '13v410', generation = 2 where id = :DX;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 21. SUPPRIMER UN BROUILLON — compté avant, compté après ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
reset role;
\echo '-- avant : 1 / 9 / 2'
select (select count(*) from public.devis where id = :DREF) as devis,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as lignes,
       (select count(*) from public.devis_tva where devis_id = :DREF) as tva;
set local role authenticated; set local request.jwt.claim.sub = :A;
delete from public.devis where id = :DREF;
reset role;
\echo '-- après : 0 / 0 / 0, et aucune erreur du recalcul pendant la cascade'
select (select count(*) from public.devis where id = :DREF) as devis,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as lignes,
       (select count(*) from public.devis_tva where devis_id = :DREF) as tva;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 22. SUPPRIMER LA FICHE C1 — le devis reste, détaché ; la cascade passe SANS numéro ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
select count(*) as fiche_avant_attendu_1 from public.clients where id = :C1;
delete from public.clients where id = :C1;
select count(*) as fiche_apres_attendu_0 from public.clients where id = :C1;
reset role;
select (select count(*) from public.devis where id = :DREF) as devis_attendu_1,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as lignes_attendu_9,
       (select client_id is null from public.devis where id = :DREF) as client_vide_attendu_t,
       (select quote_request_id = :QA and sos_request_id = :SA from public.devis where id = :DREF) as autres_liens_intacts_attendu_t,
       (select generation from public.devis where id = :DREF) as horloge_inchangee_attendu_10;
\echo '-- totaux intacts : 155045 | 20904 | 175949'
execute totaux(:DREF);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 23. D3 — LE PARTICULIER PART : le devis reste, ses deux liens vides, source « demande » ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
reset role;
select (select count(*) from public.quote_requests where id = :QA) as qa_avant_attendu_1,
       (select count(*) from public.sos_requests where id = :SA) as sa_avant_attendu_1;
set local role authenticated; set local request.jwt.claim.sub = :P;
select public.preparer_suppression_compte();
reset role;
delete from auth.users where id = :P;
select (select count(*) from auth.users where id = :P) as compte_P_attendu_0,
       (select count(*) from public.quote_requests where id = :QA) as qa_apres_attendu_0,
       (select count(*) from public.sos_requests where id = :SA) as sa_apres_attendu_0;
select count(*) as devis_attendu_1,
       bool_and(quote_request_id is null) as demande_vide_attendu_t,
       bool_and(sos_request_id is null) as urgence_vide_attendu_t,
       bool_and(client_id = :C1) as fiche_intacte_attendu_t,
       min(source) as source_attendu_demande,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as lignes_attendu_9
  from public.devis where id = :DREF;
\echo '-- D11 : les clés vidées, comptées sur tous les devis de A — attendu 1 et 1'
select count(*) filter (where quote_request_id is null) as demandes_videes,
       count(*) filter (where sos_request_id is null) as urgences_videes
  from public.devis where pro_id = :A;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 24. L ARTISAN PART — la double cascade (set null PUIS delete sur la même ligne) ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
reset role;
\echo '-- avant : 1 / 9 / 2 / 1 fiche'
select (select count(*) from public.devis where pro_id = :A) as devis,
       (select count(*) from public.devis_lignes l join public.devis d on d.id = l.devis_id where d.pro_id = :A) as lignes,
       (select count(*) from public.devis_tva where devis_id = :DREF) as tva,
       (select count(*) from public.clients where pro_id = :A) as fiches;
set local role authenticated; set local request.jwt.claim.sub = :A;
select public.preparer_suppression_compte();
reset role;
delete from auth.users where id = :A;
\echo '-- après : 0 / 0 / 0 / 0'
select (select count(*) from public.devis where pro_id = :A or id = :DREF) as devis,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as lignes,
       (select count(*) from public.devis_tva where devis_id = :DREF) as tva,
       (select count(*) from public.clients where pro_id = :A) as fiches;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 25. L EXPORT — mes_donnees() pour A, B et P ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
select jsonb_array_length(x->'devis_emis') as devis_emis_attendu_1,
       jsonb_array_length(x->'devis_lignes') as devis_lignes_attendu_9,
       jsonb_array_length(x->'devis_tva') as devis_tva_attendu_2,
       x ? 'demandes_de_devis' as demandes_de_devis_presente_attendu_t,
       x ? 'devis' as cle_devis_attendu_f,
       x->'devis_lignes'->0->>'designation' as premiere_ligne_attendu_rez_de_chaussee,
       x->'devis_emis'->0->>'generation' as horloge_exportee_attendu_10
  from (select public.mes_donnees() as x) s;
set local request.jwt.claim.sub = :B;
select jsonb_array_length(x->'devis_emis') as B_devis_attendu_0,
       jsonb_array_length(x->'devis_lignes') as B_lignes_attendu_0,
       jsonb_array_length(x->'devis_tva') as B_tva_attendu_0
  from (select public.mes_donnees() as x) s;
set local request.jwt.claim.sub = :P;
\echo '-- P : les demandes qu il a ENVOYÉES (QA à A, QB à B) — c est ce qui justifie le nom'
select (select count(*) from jsonb_array_elements(x->'demandes_de_devis') e where e->>'id' in (:QA, :QB)) as demandes_envoyees_attendu_2,
       jsonb_array_length(x->'devis_emis') as P_devis_attendu_0
  from (select public.mes_donnees() as x) s;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 26. LES DROITS ==='
-- ==========================================================================
select t as table_, bool_or(has_table_privilege('anon', t, p)) as anon_un_droit_attendu_f
  from unnest(array['public.devis', 'public.devis_lignes', 'public.devis_tva']) t,
       unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) p
 group by t order by t;
\echo '-- authenticated : lire et écrire devis et lignes ; LIRE la ventilation ; rien d autre — ni truncate, ni references, ni trigger (relecture sécurité, M2)'
select t as table_,
       string_agg(p, ',' order by p) filter (where has_table_privilege('authenticated', t, p)) as droits_authentifie
  from unnest(array['public.devis', 'public.devis_lignes', 'public.devis_tva']) t,
       unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) p
 group by t order by t;
select bool_and(has_table_privilege('authenticated', t, p) = (p in ('select', 'insert', 'update', 'delete')))
         filter (where t <> 'public.devis_tva') as devis_et_lignes_exactement_quatre_attendu_t,
       bool_and(has_table_privilege('authenticated', t, p) = (p = 'select'))
         filter (where t = 'public.devis_tva') as ventilation_lecture_seule_attendu_t
  from unnest(array['public.devis', 'public.devis_lignes', 'public.devis_tva']) t,
       unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) p;
select has_function_privilege('public', 'public.recalcule_devis(uuid, bigint)', 'execute') as recalcule_public_attendu_f,
       has_function_privilege('anon', 'public.recalcule_devis(uuid, bigint)', 'execute') as recalcule_anon_attendu_f,
       has_function_privilege('authenticated', 'public.recalcule_devis(uuid, bigint)', 'execute') as recalcule_authentifie_attendu_f;
\echo '-- les trois fonctions de déclencheur, pour les TROIS rôles (relecture des essais, M7) : f partout'
select f as fonction,
       has_function_privilege('public', f, 'execute') as public_attendu_f,
       has_function_privilege('anon', f, 'execute') as anon_attendu_f,
       has_function_privilege('authenticated', f, 'execute') as authentifie_attendu_f
  from unnest(array['public.tient_le_devis()', 'public.tient_la_ligne_de_devis()', 'public.recalcule_apres_ligne_de_devis()']) f
 order by 1;
\echo '-- les gardiennes : appelées par une contrainte (les deux arrondis) ou par les politiques (mes_entreprises) — t pour authenticated, f pour anon'
select f as fonction,
       has_function_privilege('authenticated', f, 'execute') as authentifie_attendu_t,
       has_function_privilege('anon', f, 'execute') as anon_attendu_f
  from unnest(array['public.devis_total_ligne(bigint, bigint)', 'public.devis_tva_de(bigint, integer)', 'public.mes_entreprises()']) f
 order by 1;
-- LES DROITS, DEMANDÉS AU CATALOGUE POUR CHAQUE RÔLE, sous toutes leurs
-- formes — relecture des essais de l'étape 3, 2e tour (N5, N5b, N12) : un
-- `grant` peut s'écrire sans `public.`, sans `table`, en masse (`on all
-- tables in schema public`) ou par COLONNE (`grant select (prix_unitaire_
-- centimes) on devis_lignes to anon`), et un contrôle de texte ne les voit
-- pas toutes. Prouvé sur une copie sabotée : `grant all on all tables …
-- to authenticated` laissait B, qui ne lit RIEN de A, vider par `truncate`
-- les lignes de TOUS les artisans (TRUNCATE ignore la RLS) ; `grant select
-- on all tables … to anon` laissait un visiteur lire les e-mails des
-- comptes. Ce que la base a enregistré ne dépend d'aucune écriture : PUBLIC
-- (le rôle de tout le monde) n'a aucun droit de table, et AUCUN DROIT DE
-- COLONNE n'est donné à `anon` ni à PUBLIC — `has_table_privilege` ne voit
-- pas un droit de colonne, `has_any_column_privilege` si ; `authenticated`
-- n'a, sur aucune colonne, ni `references`, ni l'écriture de la ventilation.
\echo '-- PUBLIC : aucun droit de table (f partout)'
select t as table_, bool_or(has_table_privilege('public', t, p)) as public_un_droit_attendu_f
  from unnest(array['public.devis', 'public.devis_lignes', 'public.devis_tva']) t,
       unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) p
 group by t order by t;
\echo '-- les droits de COLONNE : aucun pour anon ni PUBLIC ; pour authenticated, ni references, ni l écriture d une colonne de devis_tva (f partout)'
select t as table_,
       bool_or(has_any_column_privilege('anon', t, c)) as anon_colonne_attendu_f,
       bool_or(has_any_column_privilege('public', t, c)) as public_colonne_attendu_f,
       coalesce(bool_or(has_any_column_privilege('authenticated', t, c))
         filter (where c = 'references' or (t = 'public.devis_tva' and c <> 'select')), false) as authentifie_colonne_interdite_attendu_f
  from unnest(array['public.devis', 'public.devis_lignes', 'public.devis_tva']) t,
       unnest(array['select', 'insert', 'update', 'references']) c
 group by t order by t;


-- ==========================================================================
\echo ''
\echo '=== 27. LE CATALOGUE — qui nomme les trois tables, LU DANS LA BASE et non dans un texte ==='
-- ==========================================================================
-- Relecture des essais de l'étape 3, I-2 : la première version lisait
-- `prosrc` dans le schéma `public` seul, par un motif `public.devis…` — et
-- quatre formes lui échappaient, avec une FUITE prouvée (B lisait 86 545 c,
-- la somme des prix de A) : un nom entre guillemets (`public."devis_lignes"`),
-- un corps SQL standard (`begin atomic`, dont `prosrc` est VIDE), une
-- jointure à virgule, un autre schéma. On lisait donc `pg_get_functiondef()`,
-- guillemets dépliés, commentaires et chaînes retirés, dans TOUS les schémas
-- d'application, et on ajoutait deux propriétés sans texte.
--
-- LE 2e TOUR (22/10/2026) A TROUVÉ LE MOTIF LUI-MÊME TROUÉ : il écartait tout
-- nom suivi d'une parenthèse (`(?!\s*\()`) — c'est-à-dire exactement un
-- `insert into devis_lignes (devis_id, …)`. Une fonction de déclencheur
-- `definer`, posée sur `clients`, qui écrivait ainsi dans les lignes d'un
-- autre artisan passait l'essai ET les trois contrôles (N9, prouvé : B
-- ajoutait une ligne au devis de A en créant une fiche dans SON carnet).
-- Le regard en avant est retiré ; le corps se lit dans `prosrc` ET dans
-- `prosqlbody` (`pg_get_function_sqlbody`), sans l'en-tête de la fonction ;
-- et surtout :
--
--   UN CONTRÔLE QUI LIT DU TEXTE NE PEUT PAS VOIR TOUTES LES FORMES QU'UN
--   SQL PEUT PRENDRE ; LA PREUVE DE SÉCURITÉ EST CET ESSAI, QUI INTERROGE
--   LE CATALOGUE DE LA BASE REJOUÉE.
--
-- D'où, après le motif, QUATRE propriétés qui ne lisent AUCUN texte : les
-- `definer` appelables par un client (27b), les `definer` qui ne le sont pas
-- — une fonction de déclencheur ne l'est jamais, et elle écrit quand même —
-- (27c), ce que la base a enregistré comme dépendant des trois tables (27d,
-- 27e), et les déclencheurs posés sur elles (27f). Une `definer` NOUVELLE,
-- quelle qu'elle soit et quel que soit son corps, fait rougir 27b ou 27c :
-- c'est voulu. Si elle est légitime, elle entre dans la liste, avec sa
-- raison, dans le même lot.
\echo '--- 27a. le motif : qui nomme les tables (prosrc + prosqlbody, guillemets dépliés, commentaires et chaînes retirés, AUCUN regard en avant)'
with corps as (
  select n.nspname, p.proname, p.prosecdef,
         regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(coalesce(p.prosrc, '') || ' ' || coalesce(pg_get_function_sqlbody(p.oid), ''),
                 '"([a-z_][a-z0-9_]*)"', '\1', 'g'),
             '/\*.*?\*/', ' ', 'g'),
           '--[^\n]*', '', 'g'),
         '''(?:[^'']|'''')*''', '''''', 'g') as src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema') and n.nspname !~ '^pg_' and p.prokind in ('f', 'p')
)
select string_agg(nspname || '.' || proname, ', ' order by proname) filter (where src ~* '\m(public\s*\.\s*)?devis(_lignes|_tva)?\M')
         = 'public.mes_donnees, public.recalcule_devis, public.tient_le_devis' as liste_fermee_attendu_t,
       string_agg(nspname || '.' || proname, ', ' order by proname) filter (where src ~* '\m(public\s*\.\s*)?devis(_lignes|_tva)?\M') as qui_les_nomme,
       string_agg(proname, ', ') filter (where src ~* '\m(public\s*\.\s*)?devis(_lignes|_tva)?\M' and prosecdef) as definer_attendu_recalcule_devis,
       count(*) filter (where src ~* '\m(public\s*\.\s*)?devis(_lignes|_tva)?\M' and proname ~ '^admin_') as admin_attendu_0
  from corps;
\echo '--- 27b. sans texte : les fonctions security definer EXÉCUTABLES par un client (anon ou authenticated), comparées à la liste relevée le 21/10/2026, plus admin_valider_pieces (lot S-a, 25/10/2026 : valider la pièce que l administration a vue) et peut_faire_un_devis (lot S-b, 26/10/2026 : dire AVANT la saisie si un nouveau devis peut se rattacher à une demande, sans rien dire d une demande qui n est pas à l appelant) et remonter_publication (lot S-c, 30/10/2026 : la seule écriture de la remise en avant, et de son historique, que le client ne peut pas écrire), et quatre du lot S-d (30/10/2026) : profil_public (la fiche publique d un particulier, ville aux seuls pros), ma_fiche_pro (SA fiche pro entière, colonnes privées comprises), admin_etat_des_fiches (la suspension, pour l administration seule) et mes_donnees_sans_masquage (ce que la RLS cacherait à tort dans l export, et seulement ce qui concerne l appelant) — une NOUVELLE, quelle qu elle soit, rougit'
with ouvertes as (
  select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema') and n.nspname !~ '^pg_' and p.prosecdef
     and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
)
select count(*) as definer_ouvertes_attendu_31,
       coalesce(string_agg(proname, ', ' order by proname) filter (where proname not in (
         'a_deja_une_reponse', 'admin_demandes_pro', 'admin_etat_des_fiches', 'admin_file_verifications', 'admin_metier_demandes', 'admin_refuser_pro',
         'admin_resume', 'admin_retirer_entreprise', 'admin_signalements', 'admin_specialites', 'admin_traiter_demande_pro',
         'admin_traiter_metier_demande', 'admin_traiter_signalement', 'admin_traiter_specialite', 'admin_valider_pieces', 'admin_verifier_pro',
         'annuler_ma_demande_pro', 'completer_ma_demande_pro', 'devenir_pro', 'est_admin', 'est_masque', 'marquer_lus',
         'ma_fiche_pro', 'mes_demandes_recues', 'mes_donnees_sans_masquage', 'mon_compte', 'peut_faire_un_devis',
         'preparer_suppression_compte', 'profil_public', 'rattacher_mon_siret',
         'remonter_publication')), '—') as nouvelles_attendu_tiret
  from ouvertes;
\echo '--- 27c. sans texte : les fonctions security definer que AUCUN client ne peut appeler (fonctions de déclencheur, recalculs internes), comparées à la liste relevée le 22/10/2026, plus trois du lot S-b (26/10/2026) : maj_nb_reponses_demande (le compteur des réponses d une demande), tait_les_notifications_bloquees (il lit les blocages du DESTINATAIRE) et tient_le_lien_du_devis (il lit les blocages posés par le CLIENT), et une du lot S-d (30/10/2026) : tient_le_signalement (il relève l auteur et l extrait VRAIS de la cible d un signalement, même cachée à celui qui signale) — une NOUVELLE rougit, même sans un mot qui nomme les tables (N9 : un déclencheur definer qui écrivait dans le devis d un autre)'
with fermees as (
  select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema') and n.nspname !~ '^pg_' and p.prosecdef
     and not (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
)
select count(*) as definer_fermees_attendu_31,
       coalesce(string_agg(proname, ', ' order by proname) filter (where proname not in (
         'admin_exige_droit', 'anonymise_actes_admin', 'calcule_client_verifie', 'compter_appel_siret', 'compter_essai_tva',
         'cree_fiche_utilisateur', 'enregistrer_appel_ia', 'fiche_pro_indestructible', 'maj_chantier', 'maj_comments_count',
         'maj_followers_count', 'maj_likes_count', 'maj_nb_reponses', 'maj_nb_reponses_demande', 'maj_notes_pro', 'maj_vues_count', 'notifie_commentaire',
         'notifie_demande', 'notifie_demande_pro', 'notifie_partenariat', 'notifie_reponse_annonce', 'pose_le_lieu_du_post',
         'recalcule_apres_ligne_de_devis', 'recalcule_chantier', 'recalcule_devis', 'recalcule_notes_pro', 'siren_reserve',
         'tait_les_notifications_bloquees', 'tient_le_chantier_du_post', 'tient_le_lien_du_devis',
         'tient_le_signalement')), '—') as nouvelles_attendu_tiret
  from fermees;
\echo '--- 27d. sans texte : les fonctions que la BASE a enregistrées comme dépendant des trois tables (corps SQL standard)'
select coalesce(string_agg(distinct p.proname, ', '), '—') as fonctions_dependantes_attendu_tiret
  from pg_depend d join pg_proc p on d.classid = 'pg_proc'::regclass and p.oid = d.objid
 where d.refclassid = 'pg_class'::regclass
   and d.refobjid in ('public.devis'::regclass, 'public.devis_lignes'::regclass, 'public.devis_tva'::regclass);
\echo '--- 27e. sans texte : les VUES et les RÈGLES (create rule) posées ailleurs qui les lisent ou les écrivent — elles agissent avec les droits du propriétaire de leur table, par-dessus la RLS'
select count(distinct v.oid) as vues_ou_regles_attendu_0
  from pg_depend d join pg_rewrite r on d.classid = 'pg_rewrite'::regclass and r.oid = d.objid
  join pg_class v on v.oid = r.ev_class
 where d.refobjid in ('public.devis'::regclass, 'public.devis_lignes'::regclass, 'public.devis_tva'::regclass)
   and v.oid not in ('public.devis'::regclass, 'public.devis_lignes'::regclass, 'public.devis_tva'::regclass);
\echo '--- 27f. sans texte : les déclencheurs posés sur les trois tables (hors clés étrangères) — exactement les quatre nommés (trg_tient_le_lien_du_devis depuis le lot S-b : un nouveau lien vers la demande d une personne en blocage, OP020), et aucune règle sur elles'
select string_agg(c.relname || '.' || t.tgname, ', ' order by c.relname, t.tgname)
         = 'devis.trg_tient_le_devis, devis.trg_tient_le_lien_du_devis, devis_lignes.trg_recalcule_devis, devis_lignes.trg_tient_la_ligne_de_devis' as declencheurs_exacts_attendu_t,
       string_agg(c.relname || '.' || t.tgname, ', ' order by c.relname, t.tgname) as declencheurs,
       (select count(*) from pg_rewrite r
         where r.ev_class in ('public.devis'::regclass, 'public.devis_lignes'::regclass, 'public.devis_tva'::regclass)) as regles_sur_elles_attendu_0
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
 where t.tgrelid in ('public.devis'::regclass, 'public.devis_lignes'::regclass, 'public.devis_tva'::regclass)
   and not t.tgisinternal;


-- ==========================================================================
\echo ''
\echo '=== 28. LES POLITIQUES — trois, les chaînes exactes COMPARÉES ==='
-- ==========================================================================
-- Les chaînes étaient affichées, jamais comparées (relecture des essais,
-- M8). Elles le sont, blancs ramenés à un seul.
select tablename,
       regexp_replace(qual, '\s+', ' ', 'g') = case tablename
         when 'devis' then '(pro_id IN ( SELECT mes_entreprises() AS mes_entreprises))'
         else '(devis_id IN ( SELECT d.id FROM devis d WHERE (d.pro_id IN ( SELECT mes_entreprises() AS mes_entreprises))))'
       end as using_exact_attendu_t,
       coalesce(regexp_replace(with_check, '\s+', ' ', 'g'), '—') = case tablename
         when 'devis' then '(pro_id IN ( SELECT mes_entreprises() AS mes_entreprises))'
         when 'devis_lignes' then '(devis_id IN ( SELECT d.id FROM devis d WHERE (d.pro_id IN ( SELECT mes_entreprises() AS mes_entreprises))))'
         else '—'
       end as with_check_exact_attendu_t,
       cmd, roles
  from pg_policies where schemaname = 'public' and tablename in ('devis', 'devis_lignes', 'devis_tva')
 order by tablename;
select count(*) as politiques_attendu_3,
       count(*) filter (where roles::text ~ 'anon|public') as anon_ou_public_attendu_0,
       count(*) filter (where coalesce(qual, '') || coalesce(with_check, '') ~ 'est_masque|est_admin|auth\.uid\(\)|true') as fautes_attendu_0,
       count(*) filter (where tablename = 'devis_tva' and cmd <> 'SELECT') as ecriture_sur_tva_attendu_0
  from pg_policies where schemaname = 'public' and tablename in ('devis', 'devis_lignes', 'devis_tva');


-- ==========================================================================
\echo ''
\echo '=== 29. D4-b — une origine SANS lien : aucune contrainte « origine ⇒ lien » ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
\echo '-- attendu : INSERT 0 1, deux fois'
insert into public.devis (pro_id, source, generation) values (:A, 'demande', 1);
insert into public.devis (pro_id, source, generation) values (:A, 'urgence', 1);
select count(*) as devis_sans_lien_attendu_2 from public.devis where client_id is null and quote_request_id is null and sos_request_id is null;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 30. LES CAS D ARGENT, JOUÉS PAR POSTGRESQL — supabase/cas-devis.json, les MÊMES attendus que JavaScript ==='
-- ==========================================================================
-- Le joueur vit dans `pg_temp` : RIEN n'entre dans le schéma. Chaque cas
-- est inséré POUR DE VRAI — déclencheurs, contraintes, horloge — dans un
-- devis neuf de A, en superutilisateur (la RLS est éprouvée plus haut ;
-- ici, c'est le calcul). Chaque écriture porte un numéro qui monte : le
-- devis naît à 1, chaque opération prend le suivant. Une exception de fin
-- annule tout : le cas suivant part d'une base vide.
create or replace function pg_temp.jouer_cas(c jsonb, pro uuid) returns text language plpgsql as $$
declare d uuid; op jsonb; rang int := 0; num bigint := 1; ids jsonb := '{}'; lid uuid; res text; nom text; etat text;
begin
  if c->'operations' is null then return null; end if;
  begin
    insert into public.devis (pro_id, generation) values (pro, num) returning id into d;
    for op in select * from jsonb_array_elements(c->'operations') loop
      num := num + 1;
      if op->>'op' = 'ajouter' then
        rang := rang + 1; lid := gen_random_uuid(); ids := ids || jsonb_build_object(op->>'ligne', lid);
        insert into public.devis_lignes select * from jsonb_populate_record(null::public.devis_lignes,
          jsonb_build_object('id', lid, 'devis_id', d, 'ordre', rang * 1000, 'type', 'poste', 'offert', false,
            'main_oeuvre', false, 'fourniture_non_comprise', false, 'modifie_le', now(), 'generation', num) || (op->'valeurs'));
      elsif op->>'op' = 'modifier' then
        lid := (ids->>(op->>'ligne'))::uuid;
        update public.devis_lignes t set (type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes,
            offert, main_oeuvre, fourniture_non_comprise, surface_sol_milliemes, surface_murs_milliemes, generation)
          = (select r.type, r.designation, r.quantite_milliemes, r.unite, r.prix_unitaire_centimes, r.taux_tva_centiemes,
            r.offert, r.main_oeuvre, r.fourniture_non_comprise, r.surface_sol_milliemes, r.surface_murs_milliemes, num
             from jsonb_populate_record(t, op->'valeurs') r)
         where t.id = lid;
      elsif op->>'op' = 'retirer' then
        delete from public.devis_lignes where id = (ids->>(op->>'ligne'))::uuid;
      else raise exception 'opération inconnue %', op->>'op';
      end if;
    end loop;
    select concat_ws('|', v.total_ht_centimes, v.total_tva_centimes, v.total_ttc_centimes,
      coalesce((select string_agg(concat_ws(':', t.taux_tva_centiemes, t.base_centimes, t.tva_centimes, t.nb_lignes), ',' order by t.taux_tva_centiemes desc)
                  from public.devis_tva t where t.devis_id = d and t.nb_lignes > 0), '—'),
      coalesce((select string_agg(concat_ws(':', l.taux_tva_centiemes, l.total_centimes), ',' order by l.ordre, l.id)
                  from public.devis_lignes l where l.devis_id = d and l.type = 'option'), '—'))
      into res from public.devis v where v.id = d;
    raise exception 'FIN_DU_CAS' using detail = res;
  exception when others then
    get stacked diagnostics nom = constraint_name, etat = returned_sqlstate, res = pg_exception_detail;
    if sqlerrm = 'FIN_DU_CAS' then return res; end if;
    return 'REFUS:' || coalesce(nullif(nom, ''), etat);
  end;
end $$;
create or replace function pg_temp.jouer_fonction(f jsonb) returns text language sql as $$
  select case f->>'nom'
    when 'devis_tva_de' then coalesce(public.devis_tva_de((f->'args'->>0)::bigint, (f->'args'->>1)::int)::text, 'null')
    when 'devis_total_ligne' then coalesce(public.devis_total_ligne((f->'args'->>0)::bigint, (f->'args'->>1)::bigint)::text, 'null')
  end $$;

\set cas `cat supabase/cas-devis.json`
select (:'cas'::jsonb->>'nombre')::int as nombre_annonce_attendu_44,
       count(*) as cas_lus_attendu_44,
       count(*) filter (where c->'operations' is not null) as suites_attendu_43,
       (select count(*) from jsonb_array_elements(:'cas'::jsonb->'cas') x, jsonb_array_elements(coalesce(x->'fonctions', '[]')) f) as appels_attendu_8,
       count(*) filter (where c->>'attendu' like 'REFUS:%') as refus_attendus_23
  from jsonb_array_elements(:'cas'::jsonb->'cas') c;
\echo '-- les écarts, un par ligne (VIDE = aucun)'
select c->>'id' as cas, pg_temp.jouer_cas(c, :A) as obtenu, c->>'attendu' as attendu
  from jsonb_array_elements(:'cas'::jsonb->'cas') c
 where c->'operations' is not null and pg_temp.jouer_cas(c, :A) is distinct from c->>'attendu';
select c->>'id' as cas, f->>'nom' as fonction, pg_temp.jouer_fonction(f) as obtenu, coalesce(f->>'attendu', 'null') as attendu
  from jsonb_array_elements(:'cas'::jsonb->'cas') c, jsonb_array_elements(coalesce(c->'fonctions', '[]')) f
 where pg_temp.jouer_fonction(f) is distinct from coalesce(f->>'attendu', 'null');
select 'écarts : ' || ((select count(*) from jsonb_array_elements(:'cas'::jsonb->'cas') c
    where c->'operations' is not null and pg_temp.jouer_cas(c, :A) is distinct from c->>'attendu')
  + (select count(*) from jsonb_array_elements(:'cas'::jsonb->'cas') c, jsonb_array_elements(coalesce(c->'fonctions', '[]')) f
    where pg_temp.jouer_fonction(f) is distinct from coalesce(f->>'attendu', 'null'))) as bilan_attendu_ecarts_0;
\echo '-- et la preuve que le joueur JOUE : trois cas lus en entier (un accepté, un refusé, un retrait)'
select c->>'id' as cas, pg_temp.jouer_cas(c, :A) as obtenu
  from jsonb_array_elements(:'cas'::jsonb->'cas') c where c->>'id' in ('C01', 'C09', 'C14c') order by 1;
select count(*) as devis_restants_attendu_0 from public.devis where pro_id = :A;


-- ==========================================================================
\echo ''
\echo '=== 31. L ORDRE DES DÉCLENCHEURS — les AFTER ROW de devis_lignes, dans l ordre où ils partent ==='
-- ==========================================================================
select string_agg(case when tgname like 'RI_ConstraintTrigger_c_%' then 'RI_ConstraintTrigger_c_…' else tgname end, ' → ' order by tgname) as ordre_attendu_RI_puis_trg_recalcule_devis
  from pg_trigger where tgrelid = 'public.devis_lignes'::regclass and tgtype & 3 = 1;
select string_agg(tgname, ', ' order by tgname) as les_quatre_declencheurs_nommes
  from pg_trigger where not tgisinternal
   and tgrelid in ('public.devis'::regclass, 'public.devis_lignes'::regclass, 'public.devis_tva'::regclass);


-- ==========================================================================
\echo ''
\echo '=== 32. LA REQUÊTE TARDIVE (49.5 bis) — les formes qui se jouent l une après l autre ==='
-- ==========================================================================
\echo '--- 32a. une modification ancienne (n° 11) arrivée APRÈS la plus récente (n° 12) → OP015 ; la base garde 60 €'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis_lignes set prix_unitaire_centimes = 6000, generation = 12 where id = :L5;
select prix_unitaire_centimes as prix_attendu_6000 from public.devis_lignes where id = :L5;
update public.devis_lignes set prix_unitaire_centimes = 5000, generation = 11 where id = :L5;
rollback;
\echo '--- 32b. une ligne écrite SANS numéro (0, la valeur par défaut) → OP016 (« mettez Opus à jour », et non « un autre appareil »)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes)
values (:DV, 1000, 'poste', 'Sans numéro', 1000, 'u', 100, 1000);
rollback;
\echo '--- 32c. une modification de ligne qui ne change PAS le numéro → OP015'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis_lignes set designation = 'Même numéro' where id = :L5;
rollback;
\echo '--- 32d. l en-tête : la plus récente (n° 12, « Nouveau ») passe ; l ancienne (n° 11) → OP015'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set objet = 'Nouveau', generation = 12 where id = :DREF;
select objet as objet_attendu_nouveau, generation as horloge_attendu_12 from public.devis where id = :DREF;
update public.devis set objet = 'Ancien', generation = 11 where id = :DREF;
rollback;
\echo '--- 32e. l en-tête écrit SANS numéro neuf → OP015 (l horloge ne fait que monter)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set objet = 'Sans numéro' where id = :DREF;
rollback;
\echo '--- 32f. L INSERTION TARDIVE d une ligne retirée : la file LÈVE l horloge (n° 12), supprime sous condition (n° 13) ; l insertion (n° 11) arrive → OP015'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set generation = 12 where id = :DREF;
select count(*) as avant_attendu_0 from public.devis_lignes where id = :LX;
delete from public.devis_lignes where id = :LX and generation < 13;
select count(*) as apres_attendu_0 from public.devis_lignes where id = :LX;
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:LX, :DREF, 9500, 'poste', 'Plinthes', 1000, 'm', 1200, 1000, 11);
rollback;
\echo '--- 32g. …et SANS la levée, la même insertion PASSE : la ligne retirée revient (c est pourquoi la file lève)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
select count(*) as avant_attendu_0 from public.devis_lignes where id = :LX;
delete from public.devis_lignes where id = :LX and generation < 13;
select count(*) as apres_attendu_0 from public.devis_lignes where id = :LX;
insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:LX, :DREF, 9500, 'poste', 'Plinthes', 1000, 'm', 1200, 1000, 11);
select count(*) as ligne_revenue_attendu_1 from public.devis_lignes where id = :LX;
rollback;
\echo '--- 32h. LA SUPPRESSION TARDIVE d une ligne retouchée ensuite : partie au n° 12, la ligne porte le n° 13 → DELETE 0 — la protection est la CONDITION que la file pose (`generation < N`) : la base n a AUCUNE règle sur une suppression'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis_lignes set designation = 'Retouchée', generation = 13 where id = :L5;
select count(*) as avant_attendu_1 from public.devis_lignes where id = :L5;
delete from public.devis_lignes where id = :L5 and generation < 12;
select count(*) as apres_attendu_1 from public.devis_lignes where id = :L5;
rollback;
\echo '--- 32i. LA SUPPRESSION TARDIVE du brouillon retouché ensuite : partie au n° 11, l horloge est à 12 → DELETE 0 — ici aussi, c est la condition de la file qui protège'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set objet = 'Retouché', generation = 12 where id = :DREF;
select count(*) as avant_attendu_1 from public.devis where id = :DREF;
delete from public.devis where id = :DREF and generation < 11;
select count(*) as apres_attendu_1 from public.devis where id = :DREF;
rollback;
\echo '--- 32j. l horloge ne RECULE jamais : A tente de la ramener à 5 → OP015'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set generation = 5 where id = :DREF;
rollback;
\echo '--- 32k. LA FRONTIÈRE : une ligne écrite au numéro ÉGAL à l horloge (10) — la « même milliseconde » de 49.5 bis → OP015 (relecture des essais, M2 : rien ne tenait le « <= »)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
select generation as horloge_attendu_10 from public.devis where id = :DREF;
update public.devis_lignes set designation = 'Même numéro que l horloge', generation = 10 where id = :L5;
rollback;
\echo '--- 32l. LE DÉPLACEMENT TARDIF (49.5 bis, point 6) : la ligne est retouchée au n° 20 dans son devis ; un déplacement plus ancien (n° 15) vers un second devis (horloge 1) arrive ensuite → OP015'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
insert into public.devis (id, pro_id, generation) values (:D2, :A, 1);
update public.devis_lignes set designation = 'Retouchée', generation = 20 where id = :L5;
select designation as designation_attendu_retouchee, generation as numero_attendu_20 from public.devis_lignes where id = :L5;
update public.devis_lignes set devis_id = :D2, designation = 'Ancienne', generation = 15 where id = :L5;
rollback;
\echo '--- 32m. LE CONTRAT « un ordre = une ligne » : deux lignes écrites par UN SEUL ordre, au MÊME numéro → la seconde OP015 (et deux numéros distincts et croissants passent : le cas 6)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation) values
 (:DV, 1000, 'poste', 'Première', 1000, 'u', 100, 1000, 5),
 (:DV, 2000, 'poste', 'Seconde, même numéro', 1000, 'u', 100, 1000, 5);
rollback;
\echo '--- 32n. LES BORNES DU NUMÉRO (OP016) : generation NULL sur une ligne → OP016 (et non 23502 en anglais)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute devis_vide;
insert into public.devis_lignes (devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, generation)
values (:DV, 1000, 'poste', 'Numéro nul', 1000, 'u', 100, 1000, null);
rollback;
\echo '--- 32o. un devis qui naîtrait à l horloge −1 (sous lui, une ligne SANS numéro passait) → OP016'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, generation) values (:A, -1);
rollback;
\echo '--- 32p. un en-tête poussé au-delà de 2^53 − 1 (le devis ne s écrirait plus, ni ne se supprimerait par la file) → OP016'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set generation = 9007199254740992 where id = :DREF;
rollback;
\echo '--- 32q. …et la borne elle-même PASSE (2^53 − 1) : le « 1 » qui rend les trois refus crédibles'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
update public.devis set generation = 9007199254740991 where id = :DREF;
select generation as horloge_attendu_9007199254740991 from public.devis where id = :DREF;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 33. CEUX QUI N ONT RIEN À FAIRE ICI — visiteur, jeton sans compte, compte inconnu, administrateur, blocage, upsert (relecture sécurité, M3) ==='
-- ==========================================================================
-- Tout passait déjà, éprouvé par la relecture dans SON script : rien n'en
-- restait dans le dépôt, donc une régression n'aurait été vue par aucun
-- essai. Ces cas en font partie.
\echo '--- 33a. un visiteur appelle mes_donnees() → permission denied for function mes_donnees'
begin; set local role anon;
select public.mes_donnees();
rollback;
\echo '--- 33b. un visiteur appelle recalcule_devis() → permission denied for function recalcule_devis'
begin; set local role anon;
select public.recalcule_devis('d4900000-0000-4000-8000-0000000000d1'::uuid, 999);
rollback;
\echo '--- 33c. un visiteur appelle mes_entreprises() → permission denied for function mes_entreprises'
begin; set local role anon;
select public.mes_entreprises();
rollback;
\echo '--- 33d. un connecté SANS sub : A lit 1, puis le jeton vide lit 0 / 0 / 0, son export ne rend aucun devis, et sa création au nom de A → row-level security policy for table "devis"'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
select count(*) as A_lit_son_devis_attendu_1 from public.devis where id = :DREF;
set local request.jwt.claim.sub = '';
select (select count(*) from public.devis) as sans_sub_devis_attendu_0,
       (select count(*) from public.devis_lignes) as sans_sub_lignes_attendu_0,
       (select count(*) from public.devis_tva) as sans_sub_tva_attendu_0,
       jsonb_array_length(public.mes_donnees()->'devis_emis') as sans_sub_export_attendu_0;
insert into public.devis (pro_id, generation) values (:A, 1);
rollback;
\echo '--- 33e. un sub INCONNU (aucun compte) : 0, puis sa création au nom de A → row-level security policy for table "devis"'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
select count(*) as A_lit_son_devis_attendu_1 from public.devis where id = :DREF;
set local request.jwt.claim.sub = 'a4900000-0000-4000-8000-0000000000ff';
select count(*) as inconnu_lit_attendu_0 from public.devis;
insert into public.devis (pro_id, generation) values (:A, 1);
rollback;
\echo '--- 33f. un ADMINISTRATEUR (B, nommé) ne lit RIEN de A : aucune porte d administration (D6)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
reset role;
insert into public.administrateurs (user_id) values (:B);
set local role authenticated; set local request.jwt.claim.sub = :B;
select public.est_admin() as b_est_admin_attendu_t,
       (select count(*) from public.devis where id = :DREF) as admin_lit_devis_attendu_0,
       (select count(*) from public.devis_lignes where devis_id = :DREF) as admin_lit_lignes_attendu_0;
rollback;
\echo '--- 33g. LE BLOCAGE ne change rien au devis (D6) : P bloque A, A bloque B ; A lit toujours son devis, B (bloqué) lit 0'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
reset role;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A), (:A, :B);
set local role authenticated; set local request.jwt.claim.sub = :A;
select count(*) as A_bloque_lit_toujours_attendu_1 from public.devis where id = :DREF;
set local request.jwt.claim.sub = :B;
select count(*) as B_lit_attendu_0 from public.devis where id = :DREF;
rollback;
\echo '--- 33h. B envoie l identifiant du devis de A → 23505 devis_pkey : il apprend que cet UUID EXISTE, et rien d autre (dit en 49.2)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DREF, :B, 1);
rollback;
\echo '--- 33i. …« on conflict (id) do nothing » : INSERT 0 0, et le devis de A est intact'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, objet, generation) values (:DREF, :B, 'Écrit par B', 50) on conflict (id) do nothing;
reset role;
select pro_id = :A as toujours_a_A_attendu_t, objet as objet_inchange from public.devis where id = :DREF;
rollback;
\echo '--- 33j. …« on conflict (id) do update » sur le devis de A → new row violates row-level security policy (USING expression) for table "devis"'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DREF, :B, 50)
  on conflict (id) do update set objet = 'Écrit par B', generation = 50;
rollback;
\echo '--- 33k. …et sur une LIGNE de A, par une ligne posée dans SON PROPRE devis (l insertion passe la politique, le conflit vise la ligne de A) → new row violates row-level security policy (USING expression) for table "devis_lignes"'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute devis_ref; execute lignes_ref;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DB, :B, 1);
insert into public.devis_lignes (id, devis_id, ordre, type, designation, generation) values (:L1, :DB, 1000, 'zone', 'B', 50)
  on conflict (id) do update set designation = 'Écrit par B', generation = 50;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 34. LE PLAFOND PAR DEMANDE ET PAR URGENCE (OP017) — relecture sécurité, I1 ==='
-- ==========================================================================
-- Mesuré par la relecture : A rattachait 100 000 brouillons à la demande et
-- à l'urgence de P ; quand P supprimait son compte, la suppression dépassait
-- les 8 s de la vraie base. Vingt devis d'une entreprise par demande, vingt
-- par urgence ; le 21e est refusé, que le lien soit posé à la création ou
-- par une modification. Et la suppression de P reste rapide.
\echo '--- 34a. vingt devis de A liés à QA ET SA : INSERT 0 20 ; le 21e → OP017'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, quote_request_id, sos_request_id, source, generation)
select :A, :QA, :SA, 'demande', 1 from generate_series(1, 20);
select count(*) as devis_lies_attendu_20 from public.devis where quote_request_id = :QA;
insert into public.devis (pro_id, quote_request_id, generation) values (:A, :QA, 1);
rollback;
\echo '--- 34b. le 21e par une MODIFICATION (un devis sans lien qu on rattache à l urgence) → OP017'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, sos_request_id, generation)
select :A, :SA, 1 from generate_series(1, 20);
insert into public.devis (id, pro_id, generation) values (:DX, :A, 1);
select count(*) as urgence_liee_attendu_20 from public.devis where sos_request_id = :SA;
update public.devis set sos_request_id = :SA, generation = 2 where id = :DX;
rollback;
\echo '--- 34c. le plafond ne compte QUE quand le lien est posé ou change : à 20, A retouche l objet d un devis déjà lié → UPDATE 1'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, quote_request_id, generation) select :A, :QA, 1 from generate_series(1, 19);
insert into public.devis (id, pro_id, quote_request_id, generation) values (:DX, :A, :QA, 1);
select count(*) as lies_attendu_20 from public.devis where quote_request_id = :QA;
update public.devis set objet = 'Retouché, toujours lié', generation = 2 where id = :DX;
select objet as objet_retouche from public.devis where id = :DX;
rollback;
\echo '--- 34d. P supprime son compte : les 20 devis liés se détachent, sans erreur, et vite (le chronomètre le dit)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (pro_id, quote_request_id, sos_request_id, source, generation)
select :A, :QA, :SA, 'demande', 1 from generate_series(1, 20);
reset role;
select count(*) as lies_avant_attendu_20 from public.devis where quote_request_id = :QA;
set local role authenticated; set local request.jwt.claim.sub = :P;
set local statement_timeout = '8s';
\timing on
select public.preparer_suppression_compte() is not null as suppression_de_p_attendu_t;
\timing off
reset role;
select count(*) as devis_detaches_attendu_20 from public.devis where pro_id = :A and quote_request_id is null and sos_request_id is null;
rollback;

\set VERBOSITY default
\set SHOW_CONTEXT errors
\echo ''
\echo '=== FIN — 73 refus attendus, chacun annoncé par son nom ci-dessus ==='
