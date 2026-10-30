-- ==========================================================================
--  ESSAIS DE LA SECTION 50 — la base de postes : ce que l'artisan FIXE
--  lui-même (lot P du module devis)
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` puis
--  `schema.sql` rejoué DEUX fois, DEPUIS LA RACINE DU DÉPÔT (le cas 18 lit
--  `supabase/cas-rapprochement.json`) :
--
--      psql -h /tmp -p 5433 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-50.sql
--
--  Le fichier SE REJOUE : il commence par effacer ses propres comptes.
--
--  LES SIRET DE CES ESSAIS SONT FICTIFS, et vérifiés. Leurs SIREN
--  (000050005, 000050104) ont une clé de Luhn juste, les SIRET aussi
--  (00005000500016, 00005010400017), et les deux SIREN ont été cherchés au
--  répertoire Sirene (recherche-entreprises.api.gouv.fr) le 23/10/2026 :
--  aucun résultat. Ce ne sont PAS ceux de l'essai 49 : deux jeux posés sur
--  une même base avec les mêmes SIREN, et le second tombe sur OP007.
--  CLAUDE.md interdit le SIRET d'une vraie entreprise, même pour un essai.
--
--  DES CAS ATTENDENT UNE ERREUR — 50 refus, et c'est le but : un essai de
--  sécurité qui ne montre aucun refus n'éprouve rien. Chacun est annoncé
--  dans son `\echo` PAR SON NOM : la contrainte (`base_poste_…_check`),
--  l'index (`idx_base_postes_rapprochement`), la clé (`devis_pkey`,
--  `base_postes_devis_origine_fkey`), le code (`OP018`, `428C9`), « row-level
--  security policy for table "base_postes" », « permission denied for table
--  … » ou « … for function … ». Un « ERROR » qui ne porte pas le nom annoncé
--  est un ÉCHEC de l'essai, même s'il a l'air d'un refus. `\set VERBOSITY
--  verbose` affiche le code de chaque erreur. psql préfixe chaque ligne
--  d'erreur par le nom du fichier : un `grep '^ERROR'` ne les voit pas.
--
--  LES VALEURS ATTENDUES SONT DANS LE NOM DES COLONNES : `…_attendu_t`,
--  `…_attendu_f`, `…_attendu_0`, `…_attendu_1000`, `…_attendu_tiret` (« — »).
--  Une valeur qui ne vaut pas son attendu est un échec, même si la ligne a
--  l'air normale. Le nombre de ces valeurs est écrit à la fin.
--
--  SES RÈGLES — celles de l'essai 49, et aucune n'est décorative :
--
--   1. CHAQUE CAS EST DANS SON PROPRE `begin … rollback`, ET CONSTRUIT SON
--      PROPRE ÉTAT. Aucun cas ne dépend d'un autre.
--   2. CHAQUE « 0 » EST PRÉCÉDÉ, DANS LA MÊME TRANSACTION, DU « 1 » QUI LE
--      REND CRÉDIBLE : A lit son poste, PUIS B lit 0.
--   3. CHAQUE ORDRE QUI DOIT ÉCHOUER EST LE DERNIER DE SA TRANSACTION —
--      sauf derrière un `savepoint`, qui est dit (cas 9 b et 23).
--   4. AUCUN CAS DE RLS DANS UN BLOC `do $$ … $$` : à l'intérieur, les
--      politiques ne sont PAS appliquées (01/10/2026). `set local role
--      authenticated;` puis `set local request.jwt.claim.sub = :A;`, chacun
--      dans son propre ordre.
--   5. TOUTE SUPPRESSION COMPTE CE QU'ELLE A SUPPRIMÉ, même quand elle doit
--      ne rien supprimer.
--   6. UN REFUS ATTENDU SE LIT PAR SON NOM, jamais par la seule présence
--      d'« ERROR ».
--   7. LA SÉCURITÉ SE DEMANDE AU CATALOGUE, PAS AU TEXTE (cas 12, 13, 20) :
--      un contrôle qui lit du texte (`verifier-postes`, `verifier-legal`)
--      ne voit pas toutes les formes qu'un SQL peut prendre.
--
--  LES CARACTÈRES INVISIBLES ET LES BLANCS s'écrivent par `chr(n)`, jamais
--  en caractères littéraux ni en séquences : un éditeur qui les
--  normaliserait ferait passer les cas sur des espaces ordinaires, sans un
--  mot. Ce fichier ne contient d'ailleurs aucune séquence « barre oblique
--  inverse, u, quatre chiffres » : l'outil d'écriture des sessions de
--  travail les change en caractères.
--
--  ---------------------------------------------------------------------
--  QUATRE PROCÉDURES À DEUX SESSIONS OU PLUS — à part
--  ---------------------------------------------------------------------
--  Deux sessions ne se jouent pas par un seul `psql -f`, et un refus annule
--  la transaction : ce qui suit ne tient pas dans ce fichier. Chacune se
--  joue sur une COPIE d'une base où ce fichier a tourné (les comptes A, B
--  et P existent) : `create database x template y`. Leurs résultats sont
--  dans le compte rendu de l'étape qui les a jouées.
--
--   A. LE PLAFOND (OP018), AVEC ET SANS LE VERROU. Préparation : A a 999
--      postes, VALIDÉS.
--        session 1 : begin; set local role authenticated;
--                    set local request.jwt.claim.sub = '<A>';
--                    insert un poste « Session 1 »; select pg_sleep(3); commit;
--        session 2 (lancée 1 s après) : la même, un poste « Session 2 ».
--      | passage | verrou consultatif de `tient_le_poste` | attendu                       |
--      | 1       | présent                                | 1 000 en base, la 2e : OP018  |
--      | 2       | ligne du verrou retirée (sabotage 8)   | 1 001 en base                 |
--      Sans le verrou, les deux sessions comptent 999 : la leçon d'OP014.
--
--   B. LA MODIFICATION ET LA SUPPRESSION TARDIVES (50.2). Un poste de A, sa
--      date `modifie_le` lue par « deux appareils ».
--        session 1, la RÉCENTE : update … set prix = 5500 where id = <X>
--                    and modifie_le = '<lu>'; select pg_sleep(3); commit;
--        session 2, la TARDIVE, lancée 1 s après avec la MÊME date lue :
--                    update … set prix = 5000 … (puis, au second passage,
--                    delete … where id = <X> and modifie_le = '<lu>').
--      Attendu : la tardive ATTEND le verrou de la ligne, puis rend
--      `UPDATE 0` (`DELETE 0`) — READ COMMITTED réévalue `modifie_le =
--      <lu>` sur la version validée. Le prix reste 5500, le poste reste.
--
--   C. L'EMPREINTE DE TOUT UNICODE (1 112 063 points de code, une
--      cinquantaine de secondes), à rejouer CHAQUE FOIS QUE LA TABLE DE LA
--      CLÉ CHANGE : la requête du cas 18 bis, de 1 à 1114111 (moitiés de
--      paire exceptées). Attendu : la valeur `empreintes.tout_unicode.md5`
--      de `supabase/cas-rapprochement.json`, celle que `node` rend
--      (`verifier-postes`).
--
--   D. UN ÉTRANGER NE PREND JAMAIS LE VERROU DE A (50.4).
--        forme déterministe — session 1 (superutilisateur) : begin; select
--                    pg_advisory_xact_lock(hashtextextended('base_postes:'
--                    || '<A>', 0)); select pg_sleep(4); commit;
--                    session 2, lancée 1 s après : P, avec
--                    `set local statement_timeout = '1s'`, insère un poste
--                    AU NOM DE A.
--        Attendu : la session 2 est refusée par la politique SANS ATTENDRE
--        (« row-level security policy », quelques millisecondes). Condition
--        retirée du déclencheur (sabotage 98) : elle attend, et tombe sur
--        57014 à une seconde.
--        forme de charge — P écrit une phrase de 2 Mo au nom de A pendant
--        que A ajoute SON poste, puis 40 écritures étrangères en parallèle :
--        A n'attend pas (quelques dizaines de millisecondes ; condition
--        retirée, plusieurs centaines).
--        D ter, UNE SESSION CLIENTE SANS `sub` (24/10/2026) — la même forme
--        déterministe, la session 2 en `set local role authenticated; set
--        local request.jwt.claim.sub = '';` : `auth.uid()` y est vide, et elle
--        passait pour l'éditeur SQL. Attendu : refusée par la politique SANS
--        ATTENDRE (« row-level security policy »). Avant la correction (le
--        « sans jeton » décidé sur `auth.uid()` seul), elle attendait le
--        verrou de A et tombait sur 57014 à une seconde.
--
--  ET LES VERROUS PARTAGÉS AVEC LE LOT 1 (50.2) : un poste qui cite un devis
--  pose `FOR KEY SHARE` sur ce devis, le temps de sa transaction. Modifier
--  l'objet du devis, ou lui ajouter une ligne — donc son recalcul en `FOR NO
--  KEY UPDATE` —, ne l'attend pas ; seule la SUPPRESSION du devis l'attend,
--  puis vide le lien des postes. À rejouer comme la procédure D : session 1
--  ajoute un poste qui cite le devis et dort trois secondes ; session 2
--  modifie l'objet (instantané), ajoute une ligne (instantané), puis
--  supprime le devis (attend la fin de la session 1).
-- ==========================================================================

\set VERBOSITY verbose
\set SHOW_CONTEXT never
\pset footer off

\set A '''a5000000-0000-4000-8000-00000000000a'''
\set B '''a5000000-0000-4000-8000-00000000000b'''
\set P '''a5000000-0000-4000-8000-00000000000e'''
\set INCONNU_SUB '''a5000000-0000-4000-8000-0000000000ff'''
\set C1 '''c5000000-0000-4000-8000-0000000000c1'''
\set DA '''d5000000-0000-4000-8000-0000000000da'''
\set DA2 '''d5000000-0000-4000-8000-0000000000d2'''
\set DB '''d5000000-0000-4000-8000-0000000000db'''
\set DC '''d5000000-0000-4000-8000-0000000000dc'''
\set DINCONNU '''d5000000-0000-4000-8000-00000000ffff'''
\set X1 '''f5000000-0000-4000-8000-000000000001'''
\set X2 '''f5000000-0000-4000-8000-000000000002'''
\set X3 '''f5000000-0000-4000-8000-000000000003'''
\set X9 '''f5000000-0000-4000-8000-000000000009'''

-- --------------------------------------------------------------------------
--  LE MÉNAGE DE TÊTE — le fichier se rejoue. Ceci se fait EN LOCAL, sous
--  psql : sur la vraie base, un compte d'essai se supprime par le chemin de
--  l'application (CLAUDE.md). Les postes partent avec les comptes.
-- --------------------------------------------------------------------------
delete from auth.users where id::text like 'a5000000-%';

-- --------------------------------------------------------------------------
--  LES PREUVES DU RÉPERTOIRE, posées en superutilisateur AVANT les comptes
--  (sinon OP006) : A, une SARL en siège à Brest ; B, une SARL en siège.
-- --------------------------------------------------------------------------
insert into public.preuves_siret
  (siret, denomination, est_ei, forme_juridique, est_siege, tva, adresse, code_postal, commune,
   statut_diffusion, maj_insee, source, expire_le, pour_email) values
  ('00005000500016', 'ESSAIS 50 A', false, '5499', true, null,
   '1 RUE DE L ESSAI 29200 BREST', '29200', 'BREST', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00005010400017', 'ESSAIS 50 B', false, '5499', true, null,
   '2 RUE DE L ESSAI 29200 BREST', '29200', 'BREST', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null)
on conflict (siret) do update set expire_le = excluded.expire_le;

-- Deux artisans, un particulier (un compte SANS fiche) ; deux devis de A,
-- un de B, à l'horloge 1. Le tout VALIDÉ : c'est le décor commun, que
-- chaque cas lit sans le modifier pour de bon.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a5000@exemple-opus.test',jsonb_build_object('type','pro','siret','00005000500016','nom','A Essais','entreprise','A Essais','metiers',jsonb_build_array('plaquiste'),'ville','Brest (29)')),
 (:B,'b5000@exemple-opus.test',jsonb_build_object('type','pro','siret','00005010400017','nom','B Essais','entreprise','B Essais','metiers',jsonb_build_array('carreleur'),'ville','Brest (29)')),
 (:P,'p5000@exemple-opus.test',jsonb_build_object('type','particulier','nom','P Essais','ville','Brest (29)'));
insert into public.devis (id, pro_id, generation) values (:DA, :A, 1), (:DA2, :A, 1), (:DB, :B, 1);
commit;

-- Les postes de référence de A : une phrase bordée d'une espace insécable
-- et d'un U+200B (la phrase est ROGNÉE, rien d'autre), un prix de 45,00 €,
-- le devis DA pour origine ; et une phrase sans prix.
prepare postes_ref as
  insert into public.base_postes (id, pro_id, designation, unite, fourniture_non_comprise, prix_reference_centimes, devis_origine_id)
  values (:X1, :A, chr(160) || 'Chape sèche avant carrelage collé' || chr(8203), 'm2', false, 4500, :DA),
         (:X2, :A, 'Pose de plinthes', 'm', false, null, null);
-- Un seul poste de A, pour les cas qui n'ont besoin que de lui.
prepare poste_A as
  insert into public.base_postes (id, pro_id, designation, unite, prix_reference_centimes)
  values (:X1, :A, 'Chape sèche avant carrelage collé', 'm2', 4500);
-- A AU PLAFOND : son poste X1, puis 999 autres, d'un seul ordre chacun.
prepare A_au_plafond as
  insert into public.base_postes (pro_id, designation, unite, prix_reference_centimes)
  select :A, 'Poste numéro ' || g || ', fourniture et pose', 'u', 1000 + g from generate_series(1, 999) g;


-- ==========================================================================
\echo ''
\echo '=== 0. LA DONNÉE EXISTE — A range deux postes et les relit ==='
-- ==========================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute postes_ref;
select count(*) as postes_de_A_attendu_2 from public.base_postes;
\echo '-- la phrase ROGNÉE (U+00A0 et U+200B en bord, partis), son prix, sa clé ; un prix vide reste vide'
select designation = 'Chape sèche avant carrelage collé' as phrase_rognee_attendu_t,
       prix_reference_centimes as prix_attendu_4500,
       cle_rapprochement = 'chape seche avant carrelage colle' as cle_attendu_t,
       cle_rapprochement as cle
  from public.base_postes where id = :X1;
select prix_reference_centimes is null and prix_fixe_le is null as prix_vide_reste_vide_attendu_t
  from public.base_postes where id = :X2;
reset role;
select count(*) as en_superutilisateur_attendu_2 from public.base_postes where pro_id = :A;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 1. LA FORME — chaque refus lu PAR SON NOM (23514), jamais un 22003 ; ce qui passe, et pourquoi ==='
-- ==========================================================================
\echo '--- 1a. un U+200B seul (la phrase rognée devient vide) → base_poste_designation_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(8203), 'm2');
rollback;
\echo '--- 1b. 2 001 caractères → base_poste_designation_check (la garde rend une clé NULL, la contrainte de la clé se tait)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, repeat('a', 2001), 'm2');
rollback;
\echo '--- 1c. l unité « ml » → base_poste_unite_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'Plinthe', 'ml');
rollback;
\echo '--- 1d. aucune unité → base_poste_unite_check (et pas 23502 : la colonne est NULLABLE, la contrainte NOMMÉE)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation) values (:A, 'Plinthe');
rollback;
\echo '--- 1e. un prix de référence de 0 → base_poste_prix_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite, prix_reference_centimes) values (:A, 'Plinthe', 'm', 0);
rollback;
\echo '--- 1f. un prix de −1 → base_poste_prix_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite, prix_reference_centimes) values (:A, 'Plinthe', 'm', -1);
rollback;
\echo '--- 1g. un prix de 10 000 000 000 c → base_poste_prix_check (jamais un 22003)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite, prix_reference_centimes) values (:A, 'Plinthe', 'm', 10000000000);
rollback;
\echo '--- 1h. 2 000 caractères de QUATRE octets : ACCEPTÉ — une clé de 8 000 octets, que l index tient par son empreinte'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, repeat(chr(128293), 2000), 'u');
select char_length(designation) as caracteres_attendu_2000,
       octet_length(cle_rapprochement) as octets_de_la_cle_attendu_8000
  from public.base_postes where pro_id = :A;
rollback;
\echo '--- 1i. « — » seul (une clé VIDE) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, '—', 'u');
rollback;
\echo '--- 1j. « … » seul → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, '…', 'u');
rollback;
\echo '--- 1k. « « » » seuls → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, '« »', 'u');
rollback;
\echo '--- 1l. un remplisseur hangûl seul, chr(12644) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(12644), 'u');
rollback;
\echo '--- 1m. un sélecteur de variante seul, chr(65039) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(65039), 'u');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 1 bis. LES BLANCS QUE LA CLASSE DU PROJET NE CONNAÎT PAS — refusés ici, toujours acceptés par devis_lignes (lot S) ==='
-- ==========================================================================
\echo '--- 1 bis a. U+3000 seul, chr(12288) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(12288), 'u');
rollback;
\echo '--- 1 bis b. U+202F seul, chr(8239) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(8239), 'u');
rollback;
\echo '--- 1 bis c. la tabulation verticale seule, chr(11) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(11), 'u');
rollback;
\echo '--- 1 bis d. U+0085 seul, chr(133) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(133), 'u');
rollback;
\echo '--- 1 bis e. U+2028 seul, chr(8232) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(8232), 'u');
rollback;
\echo '--- 1 bis f. …et le défaut reste OUVERT pour devis_lignes : la même phrase y fait une réserve (INSERT 0 1)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis_lignes (devis_id, ordre, type, designation, generation) values (:DA, 1000, 'reserve', chr(12288), 2);
select count(*) as reserve_faite_d_un_blanc_attendu_1 from public.devis_lignes where devis_id = :DA;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 2. L ORDRE DES NOMS — quand une phrase viole deux contraintes, PostgreSQL nomme la première dans l ordre alphabétique ==='
-- ==========================================================================
\echo '--- 2a. une phrase vide ET « ml » → base_poste_designation_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, '', 'ml');
rollback;
\echo '--- 2b. « — » ET « ml » → base_poste_rapprochement_check (r avant u)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, '—', 'ml');
rollback;
\echo '--- 2c. « — » ET un prix 0 → base_poste_prix_check (p avant r)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite, prix_reference_centimes) values (:A, '—', 'u', 0);
rollback;
\echo '--- 2d. 2 001 « é » → base_poste_designation_check (la garde rend une clé NULL)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, repeat('é', 2001), 'u');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 3. LES DATES APPARTIENNENT À LA BASE ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
\echo '-- A envoie 2001 pour les trois dates : ignoré'
insert into public.base_postes (id, pro_id, designation, unite, prix_reference_centimes, created_at, modifie_le, prix_fixe_le)
values (:X1, :A, 'Chape sèche', 'm2', 4500, '2001-01-01', '2001-01-01', '2001-01-01');
select created_at > '2020-01-01' as creation_posee_par_la_base_attendu_t,
       modifie_le = created_at as modifie_le_egale_creation_attendu_t,
       prix_fixe_le = created_at as prix_fixe_a_la_creation_attendu_t
  from public.base_postes where id = :X1;
select prix_fixe_le as prix_fixe_1, modifie_le as modifie_1 from public.base_postes where id = :X1 \gset
\echo '-- seule la phrase change (et A renvoie 2001 pour la date du prix) : la date du prix est GARDÉE, modifie_le avance'
update public.base_postes set designation = 'Chape sèche fibrée', prix_fixe_le = '2001-01-01' where id = :X1;
select prix_fixe_le = :'prix_fixe_1'::timestamptz as date_du_prix_gardee_attendu_t,
       modifie_le > :'modifie_1'::timestamptz as modifie_le_avance_attendu_t
  from public.base_postes where id = :X1;
\echo '-- le prix change : sa date avance'
update public.base_postes set prix_reference_centimes = 4800 where id = :X1;
select prix_fixe_le > :'prix_fixe_1'::timestamptz as date_du_prix_avance_attendu_t
  from public.base_postes where id = :X1;
\echo '-- le prix est vidé : sa date se vide avec lui'
update public.base_postes set prix_reference_centimes = null where id = :X1;
select prix_fixe_le is null as date_du_prix_videe_attendu_t from public.base_postes where id = :X1;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 4. LE LIEN VERS LE DEVIS D ORIGINE — une clé COMPOSÉE, aucun oracle, une origine qui ne se récrit pas ==='
-- ==========================================================================
\echo '--- 4a. son propre devis : accepté'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (id, pro_id, designation, unite, devis_origine_id) values (:X1, :A, 'Chape', 'm2', :DA);
select count(*) as lie_a_son_devis_attendu_1 from public.base_postes where devis_origine_id = :DA;
rollback;
\echo '--- 4b. le devis de B → 23503 base_postes_devis_origine_fkey, « Key is not present in table "devis" », SANS valeur'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite, devis_origine_id) values (:A, 'Chape', 'm2', :DB);
rollback;
\echo '--- 4c. un devis qui n existe pas → le MÊME 23503, le même message : aucun oracle'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite, devis_origine_id) values (:A, 'Chape', 'm2', :DINCONNU);
rollback;
\echo '--- 4d. l origine ne se RÉCRIT pas (vers DA2 : elle reste DA) ; elle se VIDE'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (id, pro_id, designation, unite, devis_origine_id) values (:X1, :A, 'Chape', 'm2', :DA);
update public.base_postes set devis_origine_id = :DA2 where id = :X1;
select devis_origine_id = :DA as origine_inchangee_attendu_t from public.base_postes where id = :X1;
update public.base_postes set devis_origine_id = null where id = :X1;
select devis_origine_id is null as origine_videe_attendu_t from public.base_postes where id = :X1;
rollback;
\echo '--- 4e. A supprime son devis : le poste RESTE, le lien est vide, modifie_le est INCHANGÉE, et la modification conditionnée passe ensuite'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (id, pro_id, designation, unite, prix_reference_centimes, devis_origine_id) values (:X1, :A, 'Chape', 'm2', 4500, :DA);
select modifie_le as lu_4e from public.base_postes where id = :X1 \gset
with s as (delete from public.devis where id = :DA returning 1) select count(*) as devis_supprime_attendu_1 from s;
select count(*) as poste_reste_attendu_1,
       bool_and(devis_origine_id is null) as lien_vide_attendu_t,
       bool_and(modifie_le = :'lu_4e'::timestamptz) as modifie_le_inchangee_attendu_t
  from public.base_postes where id = :X1;
with u as (update public.base_postes set prix_reference_centimes = 4600 where id = :X1 and modifie_le = :'lu_4e' returning 1)
select count(*) as modification_conditionnee_attendu_1 from u;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 4 bis. UNE PHRASE QUI NOMME UN CLIENT survit à la fiche ET au devis — et l export la contient ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.clients (id, pro_id, type, nom, adresse, code_postal, ville)
values (:C1, :A, 'particulier', 'Mme Fictive Essai', '3 rue de l''Essai', '29200', 'Brest');
insert into public.devis (id, pro_id, client_id, generation) values (:DC, :A, :C1, 1);
insert into public.base_postes (id, pro_id, designation, unite, devis_origine_id)
values (:X3, :A, 'Dépose fenêtre chez Mme Fictive Essai, 3 rue de l''Essai', 'forfait', :DC);
with s as (delete from public.clients where id = :C1 returning 1) select count(*) as fiche_supprimee_attendu_1 from s;
with s as (delete from public.devis where id = :DC returning 1) select count(*) as devis_supprime_attendu_1 from s;
select (select count(*) from public.clients where id = :C1) as fiche_attendu_0,
       (select count(*) from public.devis where id = :DC) as devis_attendu_0,
       (select count(*) from public.base_postes where id = :X3) as poste_attendu_1,
       (select bool_and(designation like '%Mme Fictive Essai%') from public.base_postes where id = :X3) as nomme_encore_attendu_t,
       (select bool_and(devis_origine_id is null) from public.base_postes where id = :X3) as lien_vide_attendu_t;
select count(*) as export_contient_la_phrase_attendu_1
  from jsonb_array_elements(public.mes_donnees()->'ma_base_de_postes') e
 where e->>'designation' like '%Mme Fictive Essai%';
rollback;


-- ==========================================================================
\echo ''
\echo '=== 5. QUI LIT — A, puis B, puis P (un compte SANS fiche), puis un visiteur ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
select count(*) as A_lit_attendu_1 from public.base_postes;
set local request.jwt.claim.sub = :B;
select count(*) as B_lit_attendu_0 from public.base_postes;
set local request.jwt.claim.sub = :P;
select count(*) as P_lit_attendu_0 from public.base_postes;
rollback;
\echo '--- 5b. un visiteur, alors que le poste existe → permission denied for table base_postes (et pas une liste vide)'
begin;
execute poste_A;
select count(*) as existe_en_superutilisateur_attendu_1 from public.base_postes where pro_id = :A;
set local role anon;
select count(*) from public.base_postes;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 5 bis. L ADMINISTRATION ne lit RIEN — B nommé administrateur lit 0 alors que A a son poste ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
select count(*) as A_lit_attendu_1 from public.base_postes;
reset role;
insert into public.administrateurs (user_id) values (:B);
set local role authenticated; set local request.jwt.claim.sub = :B;
select public.est_admin() as B_est_admin_attendu_t,
       (select count(*) from public.base_postes) as admin_lit_attendu_0;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 5 ter. UN JETON SANS COMPTE, ET UN JETON VIDE — 0 ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
select count(*) as A_lit_attendu_1 from public.base_postes;
set local request.jwt.claim.sub = :INCONNU_SUB;
select count(*) as jeton_sans_compte_lit_attendu_0 from public.base_postes;
set local request.jwt.claim.sub = '';
select count(*) as jeton_vide_lit_attendu_0 from public.base_postes;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 6. QUI ÉCRIT — B chez A, B au nom de A, un particulier, A qui déplace son poste ==='
-- ==========================================================================
\echo '--- 6a. B modifie et retire le poste de A : 0 ligne, et le poste de A est intact'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
select count(*) as A_lit_attendu_1 from public.base_postes;
set local request.jwt.claim.sub = :B;
with u as (update public.base_postes set prix_reference_centimes = 1, designation = 'Écrit par B' where id = :X1 returning 1)
select count(*) as B_modifie_attendu_0 from u;
with s as (delete from public.base_postes where id = :X1 returning 1) select count(*) as B_retire_attendu_0 from s;
set local request.jwt.claim.sub = :A;
select count(*) as toujours_la_attendu_1,
       bool_and(prix_reference_centimes = 4500 and designation = 'Chape sèche avant carrelage collé') as intact_attendu_t
  from public.base_postes where id = :X1;
rollback;
\echo '--- 6b. B crée un poste AU NOM DE A → new row violates row-level security policy for table "base_postes"'
begin; set local role authenticated; set local request.jwt.claim.sub = :B;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'Écrit par B', 'u');
rollback;
\echo '--- 6c. un particulier crée un poste → new row violates row-level security policy for table "base_postes"'
begin; set local role authenticated; set local request.jwt.claim.sub = :P;
insert into public.base_postes (pro_id, designation, unite) values (:P, 'Écrit par P', 'u');
rollback;
\echo '--- 6d. A tente de DÉPLACER son poste chez B : UPDATE 1, et le poste RESTE chez A (pro_id figé) ; B lit toujours 0'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
with u as (update public.base_postes set pro_id = :B where id = :X1 returning pro_id)
select count(*) as mise_a_jour_attendu_1, bool_and(pro_id = :A) as toujours_chez_A_attendu_t from u;
set local request.jwt.claim.sub = :B;
select count(*) as B_lit_attendu_0 from public.base_postes;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 6 bis. PAS D ORACLE DU NOMBRE — A au plafond ; B écrit au nom de A → row-level security policy, JAMAIS OP018 ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A; execute A_au_plafond;
select count(*) as A_au_plafond_attendu_1000 from public.base_postes;
set local request.jwt.claim.sub = :B;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'B au nom de A', 'u');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 7. LE DOUBLON — une phrase PRESQUE identique est un doublon (23505 idx_base_postes_rapprochement) ==='
-- ==========================================================================
\echo '--- 7a. la même phrase en minuscules → 23505 idx_base_postes_rapprochement'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'chape sèche avant carrelage collé', 'm2');
rollback;
\echo '--- 7b. sans accents → 23505 idx_base_postes_rapprochement'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'chape seche avant carrelage colle', 'm2');
rollback;
\echo '--- 7c. « Chapes sèches avant carrelage collé. » (pluriel et point) → 23505 idx_base_postes_rapprochement'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'Chapes sèches avant carrelage collé.', 'm2');
rollback;
\echo '--- 7d. la forme DÉCOMPOSÉE (un e suivi de son accent, chr(768) et chr(769)) → 23505 idx_base_postes_rapprochement'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite)
values (:A, 'Chape se' || chr(768) || 'che avant carrelage colle' || chr(769), 'm2');
rollback;
\echo '--- 7e. une espace insécable et un double espace → 23505 idx_base_postes_rapprochement'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite)
values (:A, 'Chape' || chr(160) || 'sèche  avant carrelage collé', 'm2');
rollback;
\echo '--- 7f. un U+200B au milieu d un mot, chr(8203) → 23505 idx_base_postes_rapprochement'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite)
values (:A, 'Chape sè' || chr(8203) || 'che avant carrelage collé', 'm2');
rollback;
\echo '--- 7g. un U+FE0F à la fin, chr(65039) → 23505 idx_base_postes_rapprochement'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite)
values (:A, 'Chape sèche avant carrelage collé' || chr(65039), 'm2');
rollback;
\echo '--- 7h. « CHAPE SÈCHE, AVANT CARRELAGE COLLÉ. » → 23505 idx_base_postes_rapprochement'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'CHAPE SÈCHE, AVANT CARRELAGE COLLÉ.', 'm2');
rollback;
\echo '--- 7i. ce qui RESTE permis : au forfait, fourniture non comprise, chez B ; et les signes qui portent un sens'
begin; set local role authenticated; set local request.jwt.claim.sub = :A; execute poste_A;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'Chape sèche avant carrelage collé', 'forfait');
insert into public.base_postes (pro_id, designation, unite, fourniture_non_comprise) values (:A, 'Chape sèche avant carrelage collé', 'm2', true);
select count(*) as trois_postes_de_A_attendu_3 from public.base_postes;
\echo '-- « Plancher bas » et « Plancher BA », « Déplacement < 20 km », « > 20 km » et « 20 km » : CINQ postes'
insert into public.base_postes (pro_id, designation, unite) values
  (:A, 'Plancher bas', 'forfait'), (:A, 'Plancher BA', 'forfait'),
  (:A, 'Déplacement < 20 km', 'forfait'), (:A, 'Déplacement > 20 km', 'forfait'), (:A, 'Déplacement 20 km', 'forfait');
select count(*) as cinq_postes_attendu_5, count(distinct cle_rapprochement) as cinq_cles_attendu_5
  from public.base_postes where designation ~ '^(Plancher|Déplacement)';
set local request.jwt.claim.sub = :B;
insert into public.base_postes (pro_id, designation, unite) values (:B, 'Chape sèche avant carrelage collé', 'm2');
select count(*) as B_a_la_meme_phrase_attendu_1 from public.base_postes;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 8. L ÉCRITURE TARDIVE, EN SÉQUENCE — sous condition sur modifie_le, sans horloge ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
select modifie_le as lu_8 from public.base_postes where id = :X1 \gset
with u as (update public.base_postes set prix_reference_centimes = 5000 where id = :X1 and modifie_le = :'lu_8' returning 1)
select count(*) as premiere_modification_attendu_1 from u;
with u as (update public.base_postes set prix_reference_centimes = 5500 where id = :X1 and modifie_le = :'lu_8' returning 1)
select count(*) as seconde_meme_date_lue_attendu_0 from u;
select prix_reference_centimes as prix_de_la_premiere_attendu_5000 from public.base_postes where id = :X1;
with s as (delete from public.base_postes where id = :X1 and modifie_le = :'lu_8' returning 1)
select count(*) as suppression_date_perimee_attendu_0 from s;
select count(*) as poste_toujours_la_attendu_1 from public.base_postes where id = :X1;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 8 bis. L ÉCRITURE TARDIVE À DEUX SESSIONS — la procédure B de l en-tête (elle ne tient pas dans un seul psql) ==='
-- ==========================================================================
\echo '-- attendu : la tardive ATTEND le verrou de la récente, puis UPDATE 0 ; le prix de la récente est gardé ; la suppression tardive : DELETE 0'


-- ==========================================================================
\echo ''
\echo '=== 9. LE PLAFOND — 1 000 postes par entreprise (OP018), et la phrase en toutes lettres ==='
-- ==========================================================================
\echo '--- 9a. 1 000 postes, puis le 1 001e → OP018 « Votre base compte déjà 1 000 postes : retirez-en un dont vous ne vous servez plus, puis réessayez. »'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A; execute A_au_plafond;
select count(*) as au_plafond_attendu_1000 from public.base_postes;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'Le mille et unième', 'u');
rollback;
\echo '--- 9b. 1 001 postes d UN SEUL ordre, derrière un savepoint (dit) → OP018, et RIEN n est inséré'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
savepoint avant_9b;
insert into public.base_postes (pro_id, designation, unite)
select :A, 'Poste numéro ' || g, 'u' from generate_series(1, 1001) g;
rollback to avant_9b;
select count(*) as rien_insere_attendu_0 from public.base_postes;
rollback;
\echo '--- 9c. l ÉDITEUR SQL, sans jeton, au plafond → OP018 : il reste COMPTÉ'
begin;
execute poste_A; execute A_au_plafond;
select auth.uid() is null as sans_jeton_attendu_t,
       (select count(*) from public.base_postes where pro_id = :A) as au_plafond_attendu_1000;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'Depuis l éditeur SQL', 'u');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 10. L EXPORT — mes_donnees() pour A, B et P ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute postes_ref;
select jsonb_array_length(x->'ma_base_de_postes') as A_postes_exportes_attendu_2,
       x ? 'ma_base_de_postes' as cle_presente_attendu_t,
       (x->'ma_base_de_postes'->0) ? 'cle_rapprochement' as la_ligne_entiere_attendu_t
  from (select public.mes_donnees() as x) s;
set local request.jwt.claim.sub = :B;
select jsonb_array_length(public.mes_donnees()->'ma_base_de_postes') as B_postes_exportes_attendu_0;
set local request.jwt.claim.sub = :P;
select jsonb_array_length(public.mes_donnees()->'ma_base_de_postes') as P_postes_exportes_attendu_0;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 11. LE COMPTE PART — preparer_suppression_compte(), puis la cascade depuis auth.users : 0 poste ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute postes_ref;
reset role;
select count(*) as avant_attendu_2 from public.base_postes where pro_id = :A;
set local role authenticated; set local request.jwt.claim.sub = :A;
select public.preparer_suppression_compte() is not null as suppression_preparee_attendu_t;
reset role;
delete from auth.users where id = :A;
select count(*) as apres_attendu_0 from public.base_postes where pro_id = :A or id in (:X1, :X2);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 12. LES DROITS — demandés au catalogue ==='
-- ==========================================================================
select bool_or(has_table_privilege('anon', 'public.base_postes', p)) as anon_un_droit_attendu_f,
       bool_or(has_table_privilege('public', 'public.base_postes', p)) as public_un_droit_attendu_f,
       string_agg(p, ',' order by p) filter (where has_table_privilege('authenticated', 'public.base_postes', p))
         = 'delete,insert,select,update' as authentifie_quatre_droits_attendu_t,
       string_agg(p, ',' order by p) filter (where has_table_privilege('authenticated', 'public.base_postes', p)) as droits_authentifie
  from unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) p;
\echo '-- les droits de COLONNE, lus dans pg_attribute.attacl — jamais dans information_schema.column_privileges, qui en invente'
select count(*) as colonnes_attendu_12,
       count(*) filter (where attacl is not null) as droits_de_colonne_attendu_0
  from pg_attribute
 where attrelid = 'public.base_postes'::regclass and attnum > 0 and not attisdropped;
\echo '-- la fonction du déclencheur, pour les TROIS rôles : f partout (le balayage de la section 43)'
select has_function_privilege('public', 'public.tient_le_poste()', 'execute') as poste_public_attendu_f,
       has_function_privilege('anon', 'public.tient_le_poste()', 'execute') as poste_anon_attendu_f,
       has_function_privilege('authenticated', 'public.tient_le_poste()', 'execute') as poste_authentifie_attendu_f;


-- ==========================================================================
\echo ''
\echo '=== 13. LE CATALOGUE — qui nomme la table, LU DANS LA BASE et non dans un texte ==='
-- ==========================================================================
\echo '--- 13a. le motif NORMALISÉ du cas 27a de l essai 49 (prosrc + prosqlbody, guillemets dépliés, commentaires et chaînes retirés)'
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
select string_agg(nspname || '.' || proname, ', ' order by proname) filter (where src ~* '\m(public\s*\.\s*)?base_postes\M')
         = 'public.mes_donnees, public.tient_le_poste' as liste_fermee_attendu_t,
       string_agg(nspname || '.' || proname, ', ' order by proname) filter (where src ~* '\m(public\s*\.\s*)?base_postes\M') as qui_la_nomme,
       count(*) filter (where src ~* '\m(public\s*\.\s*)?base_postes\M' and prosecdef) as definer_attendu_0,
       count(*) filter (where src ~* '\m(public\s*\.\s*)?base_postes\M' and proname ~ '^admin_') as admin_attendu_0
  from corps;
\echo '--- 13b. sans texte : les fonctions que la BASE a enregistrées comme dépendant de la table (analogue de 27d)'
select coalesce(string_agg(distinct p.proname, ', '), '—') as fonctions_dependantes_attendu_tiret
  from pg_depend d join pg_proc p on d.classid = 'pg_proc'::regclass and p.oid = d.objid
 where d.refclassid = 'pg_class'::regclass and d.refobjid = 'public.base_postes'::regclass;
\echo '--- 13c. sans texte : les VUES et les RÈGLES qui la lisent ou l écrivent (analogue de 27e)'
select count(distinct v.oid) as vues_ou_regles_attendu_0
  from pg_depend d join pg_rewrite r on d.classid = 'pg_rewrite'::regclass and r.oid = d.objid
  join pg_class v on v.oid = r.ev_class
 where d.refobjid = 'public.base_postes'::regclass and v.oid <> 'public.base_postes'::regclass;
\echo '--- 13d. sans texte : ses déclencheurs (hors clés étrangères) — exactement trg_tient_le_poste, aucune règle (analogue de 27f)'
select string_agg(t.tgname, ', ' order by t.tgname) = 'trg_tient_le_poste' as declencheur_exact_attendu_t,
       (select count(*) from pg_rewrite r where r.ev_class = 'public.base_postes'::regclass) as regles_attendu_0
  from pg_trigger t where t.tgrelid = 'public.base_postes'::regclass and not t.tgisinternal;
\echo '--- 13e. tient_le_poste est security INVOKER (en definer, B apprendrait que la base de A est pleine)'
select prosecdef as poste_definer_attendu_f from pg_proc where oid = 'public.tient_le_poste()'::regprocedure;
\echo '--- 13f. la politique — UNE, la chaîne exacte comparée'
select count(*) as politiques_attendu_1,
       bool_and(regexp_replace(qual, '\s+', ' ', 'g') = '(pro_id IN ( SELECT mes_entreprises() AS mes_entreprises))') as using_exact_attendu_t,
       bool_and(regexp_replace(with_check, '\s+', ' ', 'g') = '(pro_id IN ( SELECT mes_entreprises() AS mes_entreprises))') as with_check_exact_attendu_t,
       bool_and(cmd = 'ALL' and roles::text = '{authenticated}') as tous_verbes_authentifie_attendu_t
  from pg_policies where schemaname = 'public' and tablename = 'base_postes';
\echo '--- 13g. la clé composée, et sa liste `set null` (confdelsetcols) : devis_origine_id SEULE'
select c.confrelid = 'public.devis'::regclass as vers_devis_attendu_t,
       c.confdeltype as en_suppression_attendu_n,
       (select array_agg(a.attname order by a.attnum) from pg_attribute a where a.attrelid = c.conrelid and a.attnum = any(c.conkey))
         = array['pro_id', 'devis_origine_id']::name[] as deux_colonnes_attendu_t,
       (select array_agg(a.attname) from pg_attribute a where a.attrelid = c.conrelid and a.attnum = any(c.confdelsetcols))
         = array['devis_origine_id']::name[] as set_null_d_une_seule_attendu_t
  from pg_constraint c where c.conname = 'base_postes_devis_origine_fkey' and c.conrelid = 'public.base_postes'::regclass;
\echo '--- 13h. les deux index UNIQUES'
select (select indisunique from pg_index where indexrelid = 'public.idx_base_postes_rapprochement'::regclass) as rapprochement_unique_attendu_t,
       (select indisunique from pg_index where indexrelid = 'public.idx_devis_id_pro'::regclass) as devis_id_pro_unique_attendu_t;
\echo '--- 13i. les listes 27b et 27c de l essai 49 : le lot P n y ajoute aucune fonction security definer (27 = les 24 d avant lui, plus admin_valider_pieces du lot S-a, peut_faire_un_devis du lot S-b et remonter_publication du lot S-c ; 30 = les 27 d avant, plus les trois déclencheurs definer du lot S-b)'
select count(*) filter (where has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
         as definer_ouvertes_attendu_27,
       count(*) filter (where not (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute')))
         as definer_fermees_attendu_30
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname not in ('pg_catalog', 'information_schema') and n.nspname !~ '^pg_' and p.prosecdef;


-- ==========================================================================
\echo ''
\echo '=== 14. L IDENTIFIANT EST FIGÉ — update … set id = <autre> : il reste ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
with u as (update public.base_postes set id = :X9 where id = :X1 returning id)
select count(*) as mise_a_jour_attendu_1, bool_and(id = :X1) as identifiant_garde_attendu_t from u;
select (select count(*) from public.base_postes where id = :X1) as ancien_attendu_1,
       (select count(*) from public.base_postes where id = :X9) as nouveau_attendu_0;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 15. devis_pkey D ABORD — le second index unique de devis ne parle jamais le premier ==='
-- ==========================================================================
\echo '--- 15a. A renvoie l identifiant de SON devis → 23505 devis_pkey, jamais idx_devis_id_pro'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, generation) values (:DA, :A, 1);
rollback;
\echo '--- 15b. A envoie l identifiant du devis de B → 23505 devis_pkey'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, generation) values (:DB, :A, 1);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 16. LE CONTRAT DE L UPSERT — A au plafond, « on conflict (id) do update » sur un poste existant → OP018 ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A; execute A_au_plafond;
select count(*) as au_plafond_attendu_1000 from public.base_postes;
insert into public.base_postes (id, pro_id, designation, unite) values (:X1, :A, 'Autre phrase', 'u')
  on conflict (id) do update set designation = excluded.designation;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 17. LE CONTRAT DE L AJOUT TARDIF — ajout, retrait, puis le même ajout : le poste REVIENT (non couvert, et dit) ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
with s as (delete from public.base_postes where id = :X1 returning 1) select count(*) as retire_attendu_1 from s;
execute poste_A;
select count(*) as le_poste_revient_attendu_1 from public.base_postes where id = :X1;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 18. LA CLÉ, LES CAS PARTAGÉS — supabase/cas-rapprochement.json, les MÊMES attendus que JavaScript ==='
-- ==========================================================================
\set cas `cat supabase/cas-rapprochement.json`
select (:'cas'::jsonb->>'nombre')::int as nombre_annonce_attendu_188,
       jsonb_array_length(:'cas'::jsonb->'cas') as cas_lus_attendu_188,
       jsonb_array_length(:'cas'::jsonb->'distincts') as paires_lues_attendu_22;
\echo '-- les écarts, un par ligne (AUCUNE ligne attendue)'
select c->>'id' as cas, public.cle_de_rapprochement(c->>'phrase') as obtenu, c->>'attendu' as attendu
  from jsonb_array_elements(:'cas'::jsonb->'cas') c
 where public.cle_de_rapprochement(c->>'phrase') is distinct from c->>'attendu';
select count(*) filter (where public.cle_de_rapprochement(c->>'phrase') is distinct from c->>'attendu') as ecarts_attendu_0,
       count(*) filter (where c->>'attendu' is null) as attendus_null_attendu_2
  from jsonb_array_elements(:'cas'::jsonb->'cas') c;
select count(*) filter (where public.cle_de_rapprochement(d->>'a') = public.cle_de_rapprochement(d->>'b')) as paires_confondues_attendu_0
  from jsonb_array_elements(:'cas'::jsonb->'distincts') d;
\echo '-- la preuve que le joueur JOUE : dix cas lus en entier'
select c->>'id' as cas, c->>'phrase' as phrase, public.cle_de_rapprochement(c->>'phrase') as obtenu, c->>'attendu' as attendu
  from jsonb_array_elements(:'cas'::jsonb->'cas') c
 where c->>'id' in ('R01', 'D01', 'L01', 'S03', 'V01', 'N04', 'Y01', 'E02', 'I04', 'G02') order by 1;
select count(*) as dix_cas_attendu_10,
       bool_and(public.cle_de_rapprochement(c->>'phrase') is not distinct from c->>'attendu') as dix_cas_justes_attendu_t
  from jsonb_array_elements(:'cas'::jsonb->'cas') c
 where c->>'id' in ('R01', 'D01', 'L01', 'S03', 'V01', 'N04', 'Y01', 'E02', 'I04', 'G02');
select public.cle_de_rapprochement(null) is null as null_rend_null_attendu_t;


-- ==========================================================================
\echo ''
\echo '=== 18 bis. L EMPREINTE DU PLAN DE BASE — la même que node, sous quatre collations et sous standard_conforming_strings = off ==='
-- ==========================================================================
-- Pour chaque point de code c du plan de base (moitiés de paire exceptées),
-- la clé de la sonde c + 'a' + c + 'bs ' + c + 'X' + c, une ligne « n:clé »,
-- et le md5 de l'ensemble : la MÊME sonde que `verifier-postes`. Puis la
-- même requête, la collation posée sur l'argument : `lower()` changerait
-- de résultat d'une collation à l'autre, cette fonction non. Une minute et
-- demie en tout depuis que la table compte les 4 174 invisibles (chaque
-- requête prépare 79 Ko de SQL et parcourt une table cinq fois plus longue).
select count(*) as points_attendu_63487,
       md5(string_agg(n::text || ':' || public.cle_de_rapprochement(chr(n) || 'a' || chr(n) || 'bs ' || chr(n) || 'X' || chr(n)), chr(10) order by n))
         = (:'cas'::jsonb->'empreintes'->'plan_de_base'->>'md5') as empreinte_du_fichier_attendu_t,
       md5(string_agg(n::text || ':' || public.cle_de_rapprochement(chr(n) || 'a' || chr(n) || 'bs ' || chr(n) || 'X' || chr(n)), chr(10) order by n)) as empreinte
  from generate_series(1, 65535) n where n not between 55296 and 57343;
select md5(string_agg(n::text || ':' || public.cle_de_rapprochement((chr(n) || 'a' || chr(n) || 'bs ' || chr(n) || 'X' || chr(n)) collate "C"), chr(10) order by n))
         = (:'cas'::jsonb->'empreintes'->'plan_de_base'->>'md5') as sous_c_attendu_t
  from generate_series(1, 65535) n where n not between 55296 and 57343;
select md5(string_agg(n::text || ':' || public.cle_de_rapprochement((chr(n) || 'a' || chr(n) || 'bs ' || chr(n) || 'X' || chr(n)) collate "und-x-icu"), chr(10) order by n))
         = (:'cas'::jsonb->'empreintes'->'plan_de_base'->>'md5') as sous_und_icu_attendu_t
  from generate_series(1, 65535) n where n not between 55296 and 57343;
select md5(string_agg(n::text || ':' || public.cle_de_rapprochement((chr(n) || 'a' || chr(n) || 'bs ' || chr(n) || 'X' || chr(n)) collate "fr-x-icu"), chr(10) order by n))
         = (:'cas'::jsonb->'empreintes'->'plan_de_base'->>'md5') as sous_fr_icu_attendu_t
  from generate_series(1, 65535) n where n not between 55296 and 57343;
select md5(string_agg(n::text || ':' || public.cle_de_rapprochement((chr(n) || 'a' || chr(n) || 'bs ' || chr(n) || 'X' || chr(n)) collate "tr-TR-x-icu"), chr(10) order by n))
         = (:'cas'::jsonb->'empreintes'->'plan_de_base'->>'md5') as sous_tr_icu_attendu_t
  from generate_series(1, 65535) n where n not between 55296 and 57343;
begin;
set local standard_conforming_strings = off;
select md5(string_agg(n::text || ':' || public.cle_de_rapprochement(chr(n) || 'a' || chr(n) || 'bs ' || chr(n) || 'X' || chr(n)), chr(10) order by n))
         = (:'cas'::jsonb->'empreintes'->'plan_de_base'->>'md5') as sous_scs_off_attendu_t
  from generate_series(1, 65535) n where n not between 55296 and 57343;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 19. LA CLÉ POSÉE PAR LE DÉCLENCHEUR — la base seule l écrit, et la fonction reste exécutable par celui qui écrit ==='
-- ==========================================================================
\echo '--- 19a. A envoie cle_rapprochement à l insertion → 428C9 (la base calcule cette cle, elle ne s envoie pas)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite, cle_rapprochement) values (:A, 'Chape', 'm2', 'une autre cle');
rollback;
\echo '--- 19b. …et à la modification → 428C9 (la base calcule cette cle, elle ne s ecrit que par son recalcul exact)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
update public.base_postes set cle_rapprochement = 'une autre cle' where id = :X1;
rollback;
\echo '--- 19b bis. …mais son recalcul EXACT passe : c est la réécriture du contrat (50.0), et elle ne change rien ici'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
with u as (update public.base_postes set cle_rapprochement = public.cle_de_rapprochement(designation) where id = :X1 returning cle_rapprochement)
select count(*) as recalcul_exact_accepte_attendu_1,
       bool_and(cle_rapprochement = 'chape seche avant carrelage colle') as cle_inchangee_attendu_t from u;
rollback;
\echo '--- 19c. une phrase modifiée RECALCULE la clé : « POSES DE PLINTHES » → pose de plinthe'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (id, pro_id, designation, unite) values (:X2, :A, 'Pose de plinthes', 'm');
update public.base_postes set designation = 'POSES DE PLINTHES' where id = :X2;
select cle_rapprochement = 'pose de plinthe' as cle_recalculee_attendu_t from public.base_postes where id = :X2;
rollback;
\echo '--- 19d. le droit d exécuter la fonction de la clé : authenticated oui, anon et PUBLIC non'
select has_function_privilege('authenticated', 'public.cle_de_rapprochement(text)', 'execute') as cle_authentifie_attendu_t,
       has_function_privilege('anon', 'public.cle_de_rapprochement(text)', 'execute') as cle_anon_attendu_f,
       has_function_privilege('public', 'public.cle_de_rapprochement(text)', 'execute') as cle_public_attendu_f;
\echo '--- 19e. dans une transaction ANNULÉE, le droit retiré à authenticated : l insertion suivante (le déclencheur, security invoker, appelle la fonction) → permission denied for function cle_de_rapprochement'
begin;
revoke execute on function public.cle_de_rapprochement(text) from authenticated;
set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'Chape', 'm2');
rollback;
select has_function_privilege('authenticated', 'public.cle_de_rapprochement(text)', 'execute') as droit_rendu_par_le_rollback_attendu_t;


-- ==========================================================================
\echo ''
\echo '=== 20. LE CATALOGUE DE LA CLÉ — la colonne, la fonction, son corps, l index ==='
-- ==========================================================================
\echo '-- la colonne est ORDINAIRE : ni générée, ni défaut (une colonne générée se recalculait à CHAQUE modification de la ligne)'
select a.attgenerated = '' as colonne_ordinaire_attendu_t,
       (select count(*) from pg_attrdef d where d.adrelid = a.attrelid and d.adnum = a.attnum) as expression_ou_defaut_attendu_0
  from pg_attribute a
 where a.attrelid = 'public.base_postes'::regclass and a.attname = 'cle_rapprochement';
\echo '-- le déclencheur l écrit : trois appels à la fonction (l insertion, la vérification d une clé écrite, la phrase changée), deux refus 428C9, et le « sans jeton » décidé sur le RÔLE'
select (char_length(prosrc) - char_length(replace(prosrc, 'public.cle_de_rapprochement(new.designation)', '')))
         / char_length('public.cle_de_rapprochement(new.designation)') as appels_dans_le_declencheur_attendu_3,
       (char_length(prosrc) - char_length(replace(prosrc, 'errcode = ''428C9''', ''))) / char_length('errcode = ''428C9''') as refus_428c9_attendu_2,
       prosrc like '%new.designation is distinct from old.designation%' as seulement_si_la_phrase_change_attendu_t,
       prosrc like '%v_compter := current_user not in (''anon'', ''authenticated'');%' as sans_jeton_sur_le_role_attendu_t
  from pg_proc where oid = 'public.tient_le_poste()'::regprocedure;
select provolatile = 'i' as immuable_attendu_t,
       proisstrict as stricte_attendu_t,
       prosecdef as cle_definer_attendu_f,
       proconfig = array['search_path=public'] as search_path_attendu_t,
       prosrc !~* '(lower|upper|initcap|normalize)\s*\(|unaccent|collate|ilike|~\*' as aucune_table_unicode_attendu_t,
       strpos(prosrc, chr(92)) as barre_oblique_inverse_attendu_0,
       (char_length(prosrc) - char_length(replace(prosrc, 'chr(92)', ''))) / char_length('chr(92)') as chr_92_attendu_3,
       ltrim(prosrc, chr(10) || ' ') like 'select case when char_length(p_phrase) > 2000 then null else%' as commence_par_la_garde_attendu_t,
       prosrc ~ 'replace[(]translate[(]\s+p_phrase,' as table_avant_les_remplacements_attendu_t,
       (char_length(prosrc) - char_length(replace(prosrc, '|| (', ''))) / char_length('|| (') as groupes_de_seize_apres_le_premier_attendu_318
  from pg_proc where oid = 'public.cle_de_rapprochement(text)'::regprocedure;
select i.indexrelid::regclass::text = 'idx_base_postes_rapprochement' as nom_attendu_t,
       pg_get_indexdef(i.indexrelid) like '%(md5(cle_rapprochement))::uuid%' as empreinte_uuid_attendu_t,
       pg_get_indexdef(i.indexrelid) like '%unite COLLATE "C"%' as unite_collation_c_attendu_t,
       (select bool_and(c = 0 or c = (select oid from pg_collation where collname = 'C' and collnamespace = 'pg_catalog'::regnamespace))
          from unnest(i.indcollation::oid[]) c) as seulement_0_et_c_attendu_t,
       pg_get_indexdef(i.indexrelid) as definition
  from pg_index i where i.indexrelid = 'public.idx_base_postes_rapprochement'::regclass;
\echo '-- et plus aucune expression de la table ne dépend de la fonction (pg_depend : 0)'
select count(*) as dependance_attendu_0
  from pg_depend dp join pg_attrdef d on dp.classid = 'pg_attrdef'::regclass and dp.objid = d.oid
 where d.adrelid = 'public.base_postes'::regclass
   and dp.refclassid = 'pg_proc'::regclass and dp.refobjid = 'public.cle_de_rapprochement(text)'::regprocedure;


-- ==========================================================================
\echo ''
\echo '=== 21. LE CONTRAT DE LA RÈGLE — remplacer la fonction ne change AUCUNE clé rangée ; seule la réécriture du contrat les recalcule ==='
-- ==========================================================================
begin;
insert into public.base_postes (id, pro_id, designation, unite, prix_reference_centimes) values (:X1, :A, 'Pose des plinthes', 'm', 1000);
select cle_rapprochement = 'pose de plinthe' as avant_attendu_t from public.base_postes where id = :X1;
create or replace function public.cle_de_rapprochement(p_phrase text)
returns text language sql immutable strict parallel safe security invoker set search_path = public
as $$ select lower(p_phrase) $$;
select cle_rapprochement = 'pose de plinthe' as rangee_ne_change_pas_attendu_t from public.base_postes where id = :X1;
\echo '--- 21a. le PRIX seul change : la clé ne bouge pas (avec la colonne générée, elle était recalculée — relecture BASE1)'
update public.base_postes set prix_reference_centimes = 1100 where id = :X1;
select cle_rapprochement = 'pose de plinthe' as prix_seul_cle_gardee_attendu_t from public.base_postes where id = :X1;
\echo '--- 21b. la phrase renvoyée À L IDENTIQUE : la clé ne bouge pas non plus'
update public.base_postes set designation = designation where id = :X1;
select cle_rapprochement = 'pose de plinthe' as meme_phrase_cle_gardee_attendu_t from public.base_postes where id = :X1;
\echo '--- 21c. la RÉÉCRITURE du contrat : la seule écriture de la clé acceptée, exactement son recalcul'
with u as (update public.base_postes set cle_rapprochement = public.cle_de_rapprochement(designation)
            where cle_rapprochement is distinct from public.cle_de_rapprochement(designation) returning 1)
select count(*) as reecrites_attendu_1 from u;
select cle_rapprochement = 'pose des plinthes' as reecrite_change_attendu_t from public.base_postes where id = :X1;
rollback;
select public.cle_de_rapprochement('Pose des plinthes') = 'pose de plinthe' as fonction_restauree_attendu_t;


-- ==========================================================================
\echo ''
\echo '=== 21 bis. ENTRE LE REMPLACEMENT ET LA RÉÉCRITURE — la cascade d un devis ne touche plus la clé ; la réécriture tombe sur le doublon et annule TOUT ==='
-- ==========================================================================
-- Une règle nouvelle qui confondrait « Pose plinthe » et « Pose » (le premier
-- mot seul). Avec la colonne générée, A qui supprimait SON devis entre le
-- remplacement de la fonction et la réécriture tombait sur 23505 : la
-- cascade recalculait la clé du poste qui citait le devis (relecture BASE1).
begin;
insert into public.base_postes (id, pro_id, designation, unite, devis_origine_id) values
  (:X1, :A, 'Pose plinthe', 'm', :DA), (:X2, :A, 'Pose', 'm', null);
\echo '--- 21 bis a. AVANT la migration, la recherche des doublons par une fonction TEMPORAIRE qui porte la nouvelle règle (une lecture)'
create function pg_temp.cle_nouvelle(p text) returns text language sql immutable as $$ select split_part(lower(p), ' ', 1) $$;
select count(*) as doublons_a_trancher_attendu_1
  from (select pro_id, pg_temp.cle_nouvelle(designation), unite, fourniture_non_comprise
          from public.base_postes where pro_id = :A group by 1, 2, 3, 4 having count(*) > 1) d;
create or replace function public.cle_de_rapprochement(p_phrase text)
returns text language sql immutable strict parallel safe security invoker set search_path = public
as $$ select split_part(lower(p_phrase), ' ', 1) $$;
\echo '--- 21 bis b. A supprime SON devis : la cascade passe, la clé du poste qui le citait ne bouge pas'
set local role authenticated; set local request.jwt.claim.sub = :A;
with s as (delete from public.devis where id = :DA returning 1) select count(*) as devis_supprime_attendu_1 from s;
reset role;
select cle_rapprochement = 'pose plinthe' as cle_inchangee_par_la_cascade_attendu_t,
       devis_origine_id is null as lien_vide_attendu_t
  from public.base_postes where id = :X1;
\echo '--- 21 bis c. la réécriture, sous le verrou du contrat, tombe sur le doublon que la nouvelle règle crée → 23505 idx_base_postes_rapprochement, et TOUT est annulé'
lock table public.base_postes in share row exclusive mode;
update public.base_postes set cle_rapprochement = public.cle_de_rapprochement(designation)
 where cle_rapprochement is distinct from public.cle_de_rapprochement(designation);
rollback;
select public.cle_de_rapprochement('Pose plinthe') = 'pose plinthe' as ancienne_regle_restauree_attendu_t;


-- ==========================================================================
\echo ''
\echo '=== 21 ter. LE COÛT — la clé ne se calcule qu à l insertion et quand la phrase change : un prix, une cascade, 0 appel ==='
-- ==========================================================================
-- Les appels se comptent par pg_stat_get_xact_function_calls : la fonction
-- porte `set search_path`, elle n'est jamais dépliée, chaque appel compte.
-- Mesuré sur 999 postes de pire cas avant la correction : le prix seul, 999
-- appels et 60 s ; la cascade, 999 appels et 59 s. Après : 0 appel, 90 ms.
begin;
set local track_functions = 'all';
select 'public.cle_de_rapprochement(text)'::regprocedure::oid as fcle \gset
set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (id, pro_id, designation, unite, prix_reference_centimes, devis_origine_id)
  values (:X1, :A, 'Chape sèche avant carrelage collé', 'm2', 4500, :DA);
reset role;
select coalesce(pg_stat_get_xact_function_calls(:fcle), 0) as appels_apres_insertion_attendu_1;
set local role authenticated; set local request.jwt.claim.sub = :A;
update public.base_postes set prix_reference_centimes = 4600 where id = :X1;
update public.base_postes set main_oeuvre = main_oeuvre where id = :X1;
with s as (delete from public.devis where id = :DA returning 1) select count(*) as devis_supprime_attendu_1 from s;
reset role;
select coalesce(pg_stat_get_xact_function_calls(:fcle), 0) as appels_apres_prix_rien_et_cascade_attendu_1,
       (select devis_origine_id is null from public.base_postes where id = :X1) as lien_vide_attendu_t;
set local role authenticated; set local request.jwt.claim.sub = :A;
update public.base_postes set designation = 'Chapes sèches avant carrelage collé' where id = :X1;
reset role;
select coalesce(pg_stat_get_xact_function_calls(:fcle), 0) as appels_apres_phrase_changee_attendu_2;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 22. LA GARDE — 10 Mo rendent NULL en moins d une seconde ; 2 000 points de code ont une clé, 2 001 non ==='
-- ==========================================================================
begin;
set local statement_timeout = '2s';
select clock_timestamp() as debut_22 \gset
select public.cle_de_rapprochement(repeat('Chapes sèches, ', 700000)) is null as dix_mo_null_attendu_t,
       clock_timestamp() - :'debut_22'::timestamptz < interval '1 second' as moins_d_une_seconde_attendu_t;
select public.cle_de_rapprochement(repeat('a', 2000)) = repeat('a', 2000) as deux_mille_attendu_t,
       public.cle_de_rapprochement(repeat('a', 2001)) is null as deux_mille_un_null_attendu_t;
\echo '-- le PIRE cas n est pas une phrase longue mais une phrase courte qui s allonge : 1 990 « % », chacun devenu « pourcent » (~50 ms mesurés)'
select clock_timestamp() as debut_22b \gset
select char_length(public.cle_de_rapprochement('1 ' || repeat('%', 1990))) = 1 + 9 * 1990 as pire_cas_cle_entiere_attendu_t,
       clock_timestamp() - :'debut_22b'::timestamptz < interval '1 second' as pire_cas_moins_d_une_seconde_attendu_t;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 23. L ÉTRANGER NE COMPTE PAS — A au plafond ; P puis B au nom de A : row-level security policy, JAMAIS OP018 ==='
-- ==========================================================================
-- Qu'ils ne PRENNENT PAS le verrou de A se prouve à deux sessions : c'est
-- la procédure D de l'en-tête. Ici, derrière des savepoints (dit) : un
-- refus annule la transaction, et A doit rester au plafond pour le second.
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A; execute A_au_plafond;
select count(*) as A_au_plafond_attendu_1000 from public.base_postes;
savepoint avant_p;
\echo '--- 23a. P au nom de A → new row violates row-level security policy for table "base_postes"'
set local request.jwt.claim.sub = :P;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'P au nom de A', 'u');
rollback to avant_p;
\echo '--- 23b. B au nom de A → new row violates row-level security policy for table "base_postes"'
set local request.jwt.claim.sub = :B;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'B au nom de A', 'u');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 24. LE RÉGLAGE DE SESSION — standard_conforming_strings = off ne change aucune clé ==='
-- ==========================================================================
begin;
set local standard_conforming_strings = off;
select public.cle_de_rapprochement('Pose des plinthes') = 'pose de plinthe' as plinthes_sous_off_attendu_t,
       public.cle_de_rapprochement('Mur [bas]') = 'mur bas' as mur_bas_sous_off_attendu_t;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 25. LES SIGNES DE SENS ET L EXCEPTION — trois clés lues dans la COLONNE, depuis une vraie insertion ==='
-- ==========================================================================
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values
  (:A, 'Déplacement < 20 km', 'forfait'), (:A, 'Planchers bas', 'm2'), (:A, 'Frais 50€', 'forfait');
select designation, cle_rapprochement from public.base_postes order by designation;
select (select cle_rapprochement from public.base_postes where designation = 'Déplacement < 20 km') = 'deplacement inf 20 km' as inf_attendu_t,
       (select cle_rapprochement from public.base_postes where designation = 'Planchers bas') = 'plancher bas' as bas_garde_son_s_attendu_t,
       (select cle_rapprochement from public.base_postes where designation = 'Frais 50€') = 'frai 50 euro' as euro_attendu_t,
       public.cle_de_rapprochement('Frais 50 euros') = (select cle_rapprochement from public.base_postes where designation = 'Frais 50€')
         as frais_50_euros_meme_cle_attendu_t;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 26. LES INVISIBLES — toute la propriété Default_Ignorable_Code_Point est supprimée, U+2800 est un séparateur ==='
-- ==========================================================================
\echo '--- 26a. U+2800 seul (le motif braille vide) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(10240), 'u');
rollback;
\echo '--- 26b. une étiquette et un sélecteur de variante seuls (U+E0001, U+E0100) → base_poste_rapprochement_check'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (pro_id, designation, unite) values (:A, chr(917505) || chr(917760), 'u');
rollback;
\echo '--- 26c. la même phrase qu un poste rangé, un U+E0100 glissé à la fin → 23505 idx_base_postes_rapprochement (c était un second poste)'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
execute poste_A;
insert into public.base_postes (pro_id, designation, unite) values (:A, 'Chape sèche avant carrelage collé' || chr(917760), 'm2');
rollback;
\echo '--- 26d. trois clés lues dans la COLONNE : U+2800 sépare, U+061C et U+2065 disparaissent'
begin; set local role authenticated; set local request.jwt.claim.sub = :A;
insert into public.base_postes (id, pro_id, designation, unite) values
  (:X1, :A, 'Chape' || chr(10240) || 'sèche', 'm2'), (:X2, :A, 'Isolant' || chr(1564) || 's', 'm2'), (:X3, :A, 'pla' || chr(8293) || 'co', 'm2');
select (select cle_rapprochement from public.base_postes where id = :X1) = 'chape seche' as braille_separe_attendu_t,
       (select cle_rapprochement from public.base_postes where id = :X2) = 'isolant' as marque_arabe_supprimee_attendu_t,
       (select cle_rapprochement from public.base_postes where id = :X3) = 'placo' as reserve_2065_supprimee_attendu_t;
rollback;


-- ==========================================================================
\echo ''
\echo '=== FIN — 50 refus attendus, chacun annoncé par son nom ci-dessus ; les valeurs attendues sont dans le nom des colonnes ==='
