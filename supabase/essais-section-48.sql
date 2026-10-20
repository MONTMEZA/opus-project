-- ==========================================================================
--  ESSAIS DE LA SECTION 48 — le n° de TVA que l'annuaire ne publie pas,
--  écrit par l'artisan et reconnu par VIES (20/10/2026)
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` puis
--  `schema.sql` rejoué DEUX fois :
--
--      psql -h /tmp -p 5433 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-48.sql
--
--  DES CAS ATTENDENT UNE ERREUR, et c'est le but : un essai de sécurité qui
--  ne montre aucun refus n'éprouve rien. Chaque ordre qui doit échouer est
--  le DERNIER de sa transaction. Et psql préfixe chaque ligne d'erreur par
--  le nom du fichier : un `grep '^ERROR'` ne les voit pas.
--
--  AUCUN CAS DE RLS DANS UN BLOC `do $$ … $$` : à l'intérieur, les
--  politiques ne sont PAS appliquées (constaté le 01/10/2026).
--
--  CE QUI N'EST PAS ICI : l'appel à VIES. PostgreSQL ne sait pas appeler le
--  web ; c'est la fonction Edge `tva` qui écrit `preuves_tva`, avec la clé
--  de service. Les écritures « de la fonction » sont donc faites ici en
--  superutilisateur, comme elle les ferait — et c'est `verifier-tva` qui
--  éprouve sa lecture des réponses de VIES.
-- ==========================================================================

\set A '''a4800000-0000-4000-8000-00000000000a'''
\set B '''a4800000-0000-4000-8000-00000000000b'''
\set C '''a4800000-0000-4000-8000-00000000000c'''

-- --------------------------------------------------------------------------
--  LE MÉNAGE DE TÊTE — le fichier se rejoue. EN LOCAL seulement.
-- --------------------------------------------------------------------------
delete from auth.users where id::text like 'a4800000-%';

-- --------------------------------------------------------------------------
--  LES PREUVES DU RÉPERTOIRE, sur des SIRET FICTIFS à clé de Luhn juste,
--  propres à ce fichier, vérifiés inconnus du répertoire Sirene le
--  20/10/2026 (0 résultat pour chaque SIREN).
--
--    A  SARL (5499), siège, SANS n° de TVA dans l'annuaire — le cas du lot ;
--    B  entrepreneur individuel (1000), siège, sans n° de TVA — le tiers ;
--    C  SARL (5499), siège, AVEC un n° de TVA publié par l'annuaire.
--
--  Le quatrième SIRET (00004803300013) sert au changement d'entreprise.
-- --------------------------------------------------------------------------
insert into public.preuves_siret
  (siret, denomination, est_ei, forme_juridique, est_siege, tva, adresse, code_postal, commune,
   statut_diffusion, maj_insee, source, expire_le, pour_email) values
  ('00004800900013', 'ESSAIS 48 A', false, '5499', true, null,
   '12 RUE DE L ESSAI 13004 MARSEILLE', '13004', 'MARSEILLE', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00004801700016', null, true, '1000', true, null,
   '3 CHEMIN DES ESSAIS 13410 LAMBESC', '13410', 'LAMBESC', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00004802500019', 'ESSAIS 48 C', false, '5499', true, 'FR42000048025',
   '5 AVENUE DES ESSAIS 13100 AIX-EN-PROVENCE', '13100', 'AIX-EN-PROVENCE', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null)
on conflict (siret) do update set expire_le = excluded.expire_le, tva = excluded.tva;

begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a4800@exemple-opus.test',jsonb_build_object('type','pro','siret','00004800900013','nom','A Essais','entreprise','A Essais','metiers',jsonb_build_array('macon'),'ville','Marseille (13)')),
 (:B,'b4800@exemple-opus.test',jsonb_build_object('type','pro','siret','00004801700016','nom','B Essais','entreprise','B Essais','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
 (:C,'c4800@exemple-opus.test',jsonb_build_object('type','pro','siret','00004802500019','nom','C Essais','entreprise','C Essais','metiers',jsonb_build_array('macon'),'ville','Aix (13)'));
commit;

-- LA FICHE COMPLÈTE DE A, au régime RÉEL : il ne doit lui manquer QUE le
-- n° de TVA. Écrite en superutilisateur, une fois pour tout le fichier.
insert into public.emetteur
  (pro_id, registre, greffe_ville, capital_centimes, telephone, email, regime_tva,
   mediateur_nom, mediateur_adresse, mediateur_site, garantie_legale_texte,
   modalites_paiement_texte, modalites_execution_texte, reclamations_texte)
values
  (:A, 'rcs', 'Marseille', 100000, '04 91 00 00 00', 'contact@exemple-opus.test', 'reel',
   'Médiateur d’essai', '1 rue de l’Essai, 13004 Marseille', 'https://mediateur.exemple-opus.test',
   'Garantie de parfait achèvement, biennale et décennale.',
   'Paiement à réception de facture.', 'Travaux réalisés aux dates convenues.',
   'Par écrit, réponse sous quinze jours.');
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:A, 3500);
insert into public.emetteur (pro_id, regime_tva) values (:C, 'reel');


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 0. La donnee EXISTE : trois identites actives, A sans TVA, C avec ==='
-- Sans ce cas, les « 0 » que lit un tiers plus bas seraient le bon
-- résultat pour la mauvaise raison (leçon du 04/10).
-- --------------------------------------------------------------------------
select count(*) as identites_actives_attendu_3,
       count(*) filter (where pro_id = :A and tva is null) as a_sans_tva_attendu_1,
       count(*) filter (where pro_id = :C and tva = 'FR42000048025') as c_avec_tva_attendu_1
  from public.entreprise_registre
 where pro_id::text like 'a4800000-%' and retiree_le is null;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. A au reel, sans numero publie ni preuve : il ne lui manque QUE conso_tva_intra ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select string_agg(split_part(m, ':', 1), ',') as seul_attendu_conso_tva_intra
  from unnest(public.emetteur_incomplet(:A)) m;
select bool_or(m like '%contrôler par VIES%') as la_phrase_nomme_vies_attendu_t,
       bool_or(m like '%DGFiP%') as et_la_dgfip_attendu_t
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. Un visiteur ne lit RIEN : refus attendu (permission denied) ==='
-- --------------------------------------------------------------------------
begin;
set local role anon;
select count(*) from public.preuves_tva;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. A ne s ECRIT pas de preuve : refus attendu (permission denied) ==='
-- Sans ce verrou, un client modifié s'écrirait le numéro de son choix.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.preuves_tva (pro_id, siren, numero) values (:A, '000048009', 'FR91000048009');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. La fonction Edge ecrit la preuve de A (ici en superutilisateur) ; la date envoyee est IGNOREE ==='
-- --------------------------------------------------------------------------
insert into public.preuves_tva (pro_id, siren, numero, vies_le, reconnu_le)
values (:A, '000048009', 'FR91000048009', '2026-10-20T13:51:00.982Z', '2001-01-01');
select count(*) as preuves_de_A_attendu_1,
       bool_and(reconnu_le > now() - interval '1 minute') as date_posee_par_la_base_attendu_t,
       bool_and(source = 'vies') as source_vies_attendu_t
  from public.preuves_tva where pro_id = :A;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. A lit SA preuve (1) ; B, le tiers, lit 0 ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select count(*) as ce_que_A_lit_attendu_1 from public.preuves_tva;
set local request.jwt.claim.sub = :B;
select count(*) as ce_que_B_lit_attendu_0 from public.preuves_tva;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. Avec la preuve, A ne manque plus de RIEN ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select coalesce(array_length(public.emetteur_incomplet(:A), 1), 0) as motifs_de_A_attendu_0;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. A ne modifie pas et ne supprime pas sa preuve : deux refus attendus ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
update public.preuves_tva set numero = 'FR91000048009' where pro_id = :A;
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
delete from public.preuves_tva where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. Les contraintes : huit refus attendus, chacun nomme sa contrainte ==='
-- --------------------------------------------------------------------------
-- (a) un numéro qui désigne une AUTRE entreprise (clé en lettres, pour que
--     seule la règle du SIREN puisse refuser)
begin;
insert into public.preuves_tva (pro_id, siren, numero) values (:B, '000048017', 'FRK1000048009');
rollback;
-- (b) une clé de deux chiffres FAUSSE (la bonne est 18)
begin;
insert into public.preuves_tva (pro_id, siren, numero) values (:B, '000048017', 'FR00000048017');
rollback;
-- (c) des minuscules : la fonction écrit la forme normale, la base l'exige
begin;
insert into public.preuves_tva (pro_id, siren, numero) values (:B, '000048017', 'fr18000048017');
rollback;
-- (d) une source inconnue
begin;
insert into public.preuves_tva (pro_id, siren, numero, source) values (:B, '000048017', 'FR18000048017', 'annuaire');
rollback;
-- (e) un SIREN mal formé : c'est preuve_tva_numero_check qui le nomme
--     (« les 9 chiffres = le SIREN »), pas une contrainte à part
begin;
insert into public.preuves_tva (pro_id, siren, numero) values (:B, '48017', 'FR18000048017');
rollback;
-- (f) un numéro trop court
begin;
insert into public.preuves_tva (pro_id, siren, numero) values (:B, '000048017', 'FR1800048017');
rollback;
-- (g) un SIREN qui n'est pas fait de chiffres : un refus qui NOMME sa
--     contrainte, et pas une erreur de conversion (22P02) que
--     `messageClair()` ne saurait pas lire — la clé chiffrée est contrôlée
--     avant, dans l'ordre des noms, et garde sa conversion
begin;
insert into public.preuves_tva (pro_id, siren, numero) values (:B, 'ABCDEFGHI', 'FR18ABCDEFGHI');
rollback;
-- (h) une clé avec I ou O : aucune clé française ne les emploie
begin;
insert into public.preuves_tva (pro_id, siren, numero) values (:B, '000048017', 'FRIO000048017');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. Une cle en LETTRES passe (il en existe d actives) ; une cle chiffree juste aussi ==='
-- --------------------------------------------------------------------------
begin;
insert into public.preuves_tva (pro_id, siren, numero) values (:B, '000048017', 'FRK1000048017');
select numero as cle_lettres_attendu_FRK1000048017 from public.preuves_tva where pro_id = :B;
rollback;
begin;
insert into public.preuves_tva (pro_id, siren, numero, source) values (:B, '000048017', 'FR18000048017', 'essai');
select numero || ' ' || source as cle_chiffree_attendu_FR18000048017_essai from public.preuves_tva where pro_id = :B;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9 bis. Une preuve ESSAI sur un VRAI compte : refus attendu (23514, compte d essai) ==='
-- Posée par erreur sur un compte réel, elle éteindrait le motif d'un numéro
-- que VIES n'a jamais vu. B devient ici, le temps de la transaction, un
-- compte dont l'adresse n'est pas une adresse d'essai.
-- --------------------------------------------------------------------------
begin;
update auth.users set email = 'b4800@exemple.fr' where id = :B;
insert into public.preuves_tva (pro_id, siren, numero, source) values (:B, '000048017', 'FR18000048017', 'essai');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. La date du controle : un nouveau controle la RAFRAICHIT, une autre ecriture ne la touche PAS ==='
-- La fonction Edge n'envoie pas la date : sans le déclencheur, un numéro
-- recontrôlé garderait la date du premier contrôle. Mais une mise à jour
-- qui n'est PAS un contrôle (l'éditeur SQL, le remplissage d'une colonne)
-- ne doit pas dater un contrôle qui n'a pas eu lieu — sinon la preuve « de
-- moins de 24 h » dispenserait de rappeler VIES (relecture du 20/10/2026).
-- --------------------------------------------------------------------------
begin;
-- une date ancienne, posée en contournant le déclencheur
alter table public.preuves_tva disable trigger trg_tient_la_preuve_tva;
update public.preuves_tva set reconnu_le = '2025-01-01' where pro_id = :A;
alter table public.preuves_tva enable trigger trg_tient_la_preuve_tva;
-- (a) une écriture de maintenance, en superutilisateur : la date ne bouge pas
update public.preuves_tva set source = source where pro_id = :A;
update public.preuves_tva set reconnu_le = now() where pro_id = :A;
select bool_and(reconnu_le = '2025-01-01') as maintenance_garde_la_date_attendu_t
  from public.preuves_tva where pro_id = :A;
-- (b) l'upsert de la fonction Edge, sous la clé de SERVICE : un contrôle
set local role service_role;
insert into public.preuves_tva (pro_id, siren, numero, vies_le)
values (:A, '000048009', 'FR91000048009', now())
on conflict (pro_id) do update set siren = excluded.siren, numero = excluded.numero, vies_le = excluded.vies_le;
reset role;
select bool_and(reconnu_le > now() - interval '1 minute') as controle_rafraichit_attendu_t
  from public.preuves_tva where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. A change d ENTREPRISE : sa preuve ne vaut plus, le motif REVIENT ==='
-- La preuve désigne un SIREN ; la jointure ne la prend que pour le SIREN
-- ACTIF. On ne l'efface pas : elle ne compte simplement plus.
-- --------------------------------------------------------------------------
begin;
update public.entreprise_registre set retiree_le = now(), retrait_motif = 'transfert de siège'
 where pro_id = :A and retiree_le is null;
insert into public.entreprise_registre
  (pro_id, siren, siret, denomination, est_ei, forme_juridique, est_siege, adresse, code_postal, commune,
   source, verifie_le)
values
  (:A, '000048033', '00004803300013', 'ESSAIS 48 A BIS', false, '5499', true,
   '7 RUE DE L ESSAI 13004 MARSEILLE', '13004', 'MARSEILLE', 'registre', now());
set local role authenticated;
set local request.jwt.claim.sub = :A;
select count(*) as preuve_toujours_la_attendu_1 from public.preuves_tva;
select string_agg(split_part(m, ':', 1), ',') as motif_revenu_attendu_conso_tva_intra
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 12. L annuaire garde le dernier mot : C, au reel, SANS preuve, ne manque pas de TVA ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :C;
select coalesce(bool_or(m like 'conso_tva_intra: %'), false) as c_annuaire_attendu_f
  from unnest(public.emetteur_incomplet(:C)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 13. En franchise, sans preuve : pas de motif TVA ==='
-- --------------------------------------------------------------------------
begin;
delete from public.preuves_tva where pro_id = :A;
update public.emetteur set regime_tva = 'franchise' where pro_id = :A;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select coalesce(bool_or(m like 'conso_tva_intra: %'), false) as franchise_attendu_f
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 14. L export RGPD : A y trouve son numero, B rien ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.mes_donnees() -> 'mon_numero_de_tva' ->> 'numero' as export_A_attendu_FR91000048009;
set local request.jwt.claim.sub = :B;
select jsonb_typeof(public.mes_donnees() -> 'mon_numero_de_tva') = 'null' as export_B_vide_attendu_t,
       public.mes_donnees() ? 'mon_numero_de_tva' as la_cle_existe_attendu_t;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 15. Les portes : le declencheur n est appelable par personne ; une seule politique, en lecture ==='
-- --------------------------------------------------------------------------
select has_function_privilege('anon', 'public.tient_la_preuve_tva()', 'execute') as anon_attendu_f,
       has_function_privilege('authenticated', 'public.tient_la_preuve_tva()', 'execute') as connecte_attendu_f;
select count(*) as politiques_attendu_1,
       bool_and(cmd = 'SELECT') as en_lecture_attendu_t,
       bool_and(roles = '{authenticated}') as pour_connectes_attendu_t
  from pg_policies where schemaname = 'public' and tablename = 'preuves_tva';
select has_table_privilege('anon', 'public.preuves_tva', 'select') as anon_lit_attendu_f,
       has_table_privilege('authenticated', 'public.preuves_tva', 'insert') as connecte_ecrit_attendu_f,
       has_table_privilege('authenticated', 'public.preuves_tva', 'update') as connecte_modifie_attendu_f,
       has_table_privilege('authenticated', 'public.preuves_tva', 'delete') as connecte_supprime_attendu_f,
       has_table_privilege('authenticated', 'public.preuves_tva', 'truncate') as connecte_vide_attendu_f;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 16. La preuve PART avec le compte (cascade) ==='
-- --------------------------------------------------------------------------
begin;
delete from auth.users where id = :A;
select count(*) as preuves_de_A_apres_suppression_attendu_0 from public.preuves_tva where pro_id = :A;
rollback;
select count(*) as et_rien_n_est_perdu_hors_essai_attendu_1 from public.preuves_tva where pro_id = :A;

-- --------------------------------------------------------------------------
\echo ''
\echo '=== 17. Les compteurs : le compte et tout Opus dans UN ordre ; si l un refuse, l autre ne monte pas ==='
-- --------------------------------------------------------------------------
begin;
set local role service_role;
select public.compter_essai_tva('tva-compte:e48', '2026-10-20 12:00+00', 2, '2026-10-20 12:34+00', 3) as premier_attendu_ok,
       public.compter_essai_tva('tva-compte:e48', '2026-10-20 12:00+00', 2, '2026-10-20 12:34+00', 3) as second_attendu_ok,
       public.compter_essai_tva('tva-compte:e48', '2026-10-20 12:00+00', 2, '2026-10-20 12:34+00', 3) as troisieme_attendu_compte;
-- le refus du compte n'a PAS consommé la place de tout Opus : 2, pas 3
reset role;
select n as global_apres_refus_du_compte_attendu_2 from public.siret_limites
 where cle = 'tva-global' and fenetre = '2026-10-20 12:34+00';
set local role service_role;
-- un autre compte prend la dernière place de tout Opus, puis la limite de tous mord
select public.compter_essai_tva('tva-compte:e48b', '2026-10-20 12:00+00', 5, '2026-10-20 12:34+00', 3) as autre_compte_attendu_ok,
       public.compter_essai_tva('tva-compte:e48b', '2026-10-20 12:00+00', 5, '2026-10-20 12:34+00', 3) as tout_opus_attendu_service;
reset role;
select n as autre_compte_apres_refus_global_attendu_1 from public.siret_limites
 where cle = 'tva-compte:e48b' and fenetre = '2026-10-20 12:00+00';
rollback;
-- une clé qui n'est pas celle d'un compte : refus attendu
begin;
set local role service_role;
select public.compter_essai_tva('global', '2026-10-20 12:00+00', 2, '2026-10-20 12:34+00', 3);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18. Les compteurs : appelables par la seule cle de service ==='
-- --------------------------------------------------------------------------
select has_function_privilege('anon', 'public.compter_essai_tva(text, timestamptz, int, timestamptz, int)', 'execute') as anon_attendu_f,
       has_function_privilege('authenticated', 'public.compter_essai_tva(text, timestamptz, int, timestamptz, int)', 'execute') as connecte_attendu_f,
       has_function_privilege('service_role', 'public.compter_essai_tva(text, timestamptz, int, timestamptz, int)', 'execute') as service_attendu_t;
-- et un connecté qui l'appelle est refusé (permission denied) : refus attendu
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select public.compter_essai_tva('tva-compte:e48', '2026-10-20 12:00+00', 100000, '2026-10-20 12:34+00', 100000);
rollback;

-- Ménage de queue : rien ne reste de ce fichier.
delete from auth.users where id::text like 'a4800000-%';
select count(*) as reste_attendu_0 from public.preuves_tva where pro_id::text like 'a4800000-%';
