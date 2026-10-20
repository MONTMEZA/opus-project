-- ==========================================================================
--  ESSAIS DE LA SECTION 46 — « Mon entreprise » pour les devis (lot 0a)
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` puis
--  `schema.sql` rejoué DEUX fois :
--
--      psql -h /tmp -p 5433 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-46.sql
--
--  DES CAS ATTENDENT UNE ERREUR, et c'est le but : un essai de sécurité qui
--  ne montre aucun refus n'éprouve rien. Chaque ordre qui doit échouer est
--  le DERNIER de sa transaction — après une erreur, PostgreSQL abandonne la
--  transaction entière. Et psql préfixe chaque ligne d'erreur par le nom du
--  fichier et le numéro de ligne : un `grep '^ERROR'` ne les voit pas.
--
--  AUCUN CAS DE RLS DANS UN BLOC `do $$ … $$` : à l'intérieur, les
--  politiques ne sont PAS appliquées (constaté le 01/10/2026), et l'essai y
--  passerait au vert sans rien éprouver. `set local role` et
--  `set local request.jwt.claim.sub`, chacun dans son propre ordre.
--
--  LES ATTENDUS TIENNENT COMPTE DES RÉPONSES DU PROPRIÉTAIRE DU 18/10/2026 :
--  aucune assurance n'est exigée ; ce que seul le code de la consommation
--  demande porte le préfixe `conso_`. Une fiche vide de société en siège
--  manque donc de 11 choses, et non de 12.
--
--  ET DES RELECTURES DU MÊME JOUR, lues dans les textes : le lieu du siège
--  n'est dû sur tout devis qu'à une entreprise immatriculée au RCS
--  (R. 123-237 ne vise que le RCS) — hors RCS, `conso_adresse_*` ; le
--  capital n'est dû que par une SARL ou une société par actions
--  (R. 123-238) ; une identité de nature inconnue réclame un nom ; la
--  mention « EI » seule ne fait pas un nom ; la date de création d'une
--  assurance est posée par la base ; et aucune fonction hors d'une liste
--  fermée ne lit ces trois tables (l'engagement « Vos tarifs et vos prix »).
-- ==========================================================================

\set A '''a4600000-0000-4000-8000-00000000000a'''
\set B '''a4600000-0000-4000-8000-00000000000b'''
\set C '''a4600000-0000-4000-8000-00000000000c'''
\set D '''a4600000-0000-4000-8000-00000000000d'''
\set P '''a4600000-0000-4000-8000-00000000000e'''

-- --------------------------------------------------------------------------
--  LE MÉNAGE DE TÊTE — le fichier se rejoue. Ceci se fait EN LOCAL, sous
--  psql : sur la vraie base, un compte d'essai se supprime par le chemin de
--  l'application (CLAUDE.md), et le connecteur n'est jamais concerné.
-- --------------------------------------------------------------------------
delete from auth.users where id::text like 'a4600000-%';

-- --------------------------------------------------------------------------
--  LES PREUVES DU RÉPERTOIRE — depuis la section 45, un compte pro ne naît
--  qu'avec une preuve FRAÎCHE pour son SIRET. Posées en superutilisateur,
--  comme la fonction Edge `siret` les poserait, sur des SIRET FICTIFS à clé
--  de Luhn juste, propres à ce fichier, et vérifiés inconnus du répertoire
--  Sirene le 18/10/2026 (0 résultat pour chaque SIREN et chaque SIRET).
--
--    A  SARL (5499), son établissement EST le siège, avec un n° de TVA ;
--    B  entrepreneur individuel (1000), établissement SECONDAIRE, sans TVA ;
--    C  entrepreneur individuel (1000), siège, adresse NON DIFFUSÉE (« P ») ;
--    D  SCP d'architectes (6578), siège — une société CIVILE, immatriculée
--       au RCS, qui n'indique pas de capital.
-- --------------------------------------------------------------------------
insert into public.preuves_siret
  (siret, denomination, est_ei, forme_juridique, est_siege, tva, adresse, code_postal, commune,
   statut_diffusion, maj_insee, source, expire_le, pour_email) values
  ('00004600300018', 'ESSAIS 46 A', false, '5499', true, 'FR87000046003',
   '12 RUE DE L ESSAI 13004 MARSEILLE', '13004', 'MARSEILLE', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00004601100011', null, true, '1000', false, null,
   '3 CHEMIN DES ESSAIS 13410 LAMBESC', '13410', 'LAMBESC', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00004602900013', null, true, '1000', true, null,
   null, null, null, 'P', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00004603700016', 'SCP ESSAIS 46 D', false, '6578', true, null,
   '5 AVENUE DES ESSAIS 13100 AIX-EN-PROVENCE', '13100', 'AIX-EN-PROVENCE', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null)
on conflict (siret) do update set expire_le = excluded.expire_le;

-- Quatre artisans et un particulier, pour tout le fichier.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 (:A,'a4600@exemple-opus.test',jsonb_build_object('type','pro','siret','00004600300018','nom','A Essais','entreprise','A Essais','metiers',jsonb_build_array('macon'),'ville','Marseille (13)')),
 (:B,'b4600@exemple-opus.test',jsonb_build_object('type','pro','siret','00004601100011','nom','B Essais','entreprise','B Essais','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
 (:C,'c4600@exemple-opus.test',jsonb_build_object('type','pro','siret','00004602900013','nom','C Essais','entreprise','C Essais','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
 (:D,'d4600@exemple-opus.test',jsonb_build_object('type','pro','siret','00004603700016','nom','D Essais','entreprise','D Essais','metiers',jsonb_build_array('architecte'),'ville','Aix (13)')),
 (:P,'p4600@exemple-opus.test',jsonb_build_object('type','particulier','nom','P Essais','ville','Aix (13)'));
commit;

-- LA FICHE COMPLÈTE DE A, écrite une fois ici et rejouée par plusieurs cas.
-- Aucune assurance : aucune n'est exigée (réponse du 18/10).
prepare fiche_complete_a as
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
prepare frais_a as
  insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:A, 3500);


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 0. La donnée EXISTE : quatre identités actives, et A lit LA SIENNE ==='
-- Sans ce cas, les « 0 » que lit un tiers plus bas seraient le bon
-- résultat pour la mauvaise raison (leçon du 04/10).
-- --------------------------------------------------------------------------
select count(*) as identites_actives_attendu_4
  from public.entreprise_registre
 where pro_id::text like 'a4600000-%' and retiree_le is null;
select count(*) as fiches_pro_attendu_4
  from public.professional_profiles where id::text like 'a4600000-%';
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select count(*) as ce_que_A_lit_attendu_1 from public.entreprise_registre;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 1. A (SARL, siège, TVA), fiche vide : les 11 clés, des phrases propres ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select string_agg(split_part(m, ':', 1), ',' order by o) as cles,
       string_agg(split_part(m, ':', 1), ',' order by o)
         = 'registre,capital,conso_telephone,conso_email,regime_tva,conso_mediateur,'
           'conso_garantie_legale,conso_modalites_paiement,conso_modalites_execution,'
           'conso_reclamations,frais_deplacement' as conforme_attendu_t,
       count(*) as nombre_attendu_11,
       bool_and(m ~ '^[a-z_]+: .{40,}$' and position('''' in m) = 0) as phrases_propres_attendu_t
  from unnest(public.emetteur_incomplet(:A)) with ordinality u(m, o);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 2. B (EI, etablissement secondaire) vide : 12 cles, dont nom_ei et conso_adresse_siege, sans capital ==='
-- B n'a encore rien déclaré : rien ne dit qu'il est au RCS. L'adresse du
-- siège ne lui est due que face à un particulier (R. 111-1) : `conso_`.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select string_agg(split_part(m, ':', 1), ',' order by o)
         = 'nom_ei,conso_adresse_siege,registre,conso_telephone,conso_email,regime_tva,'
           'conso_mediateur,conso_garantie_legale,conso_modalites_paiement,'
           'conso_modalites_execution,conso_reclamations,frais_deplacement' as conforme_attendu_t,
       count(*) as nombre_attendu_12
  from unnest(public.emetteur_incomplet(:B)) with ordinality u(m, o);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3. C (EI, siege, adresse non diffusee) : hors RCS conso_adresse_etablissement ; au RCS adresse_etablissement SANS prefixe ==='
-- Le lieu du siège est une mention du code de COMMERCE (R. 123-237 3°),
-- due sur tout devis — mais R. 123-237 ne vise que « toute personne
-- immatriculée » au RCS. Un EI inscrit au seul RNE ne la doit qu'au
-- particulier. C dit donc son registre, et le motif suit.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :C;
select string_agg(split_part(m, ':', 1), ',' order by o) as cles,
       bool_or(m like 'conso_adresse_etablissement: %') as hors_rcs_conso_attendu_t,
       bool_or(m like 'adresse_etablissement: %') as hors_rcs_sans_prefixe_attendu_f,
       bool_or(m like 'nom_ei: %') as nom_ei_attendu_t
  from unnest(public.emetteur_incomplet(:C)) with ordinality u(m, o);
insert into public.emetteur (pro_id, registre) values (:C, 'rne');
select bool_or(m like 'conso_adresse_etablissement: %') as rne_conso_attendu_t,
       bool_or(m like 'adresse_etablissement: %') as rne_sans_prefixe_attendu_f
  from unnest(public.emetteur_incomplet(:C)) m;
update public.emetteur set registre = 'rcs', greffe_ville = 'Aix-en-Provence' where pro_id = :C;
select bool_or(m like 'adresse_etablissement: %') as rcs_sans_prefixe_attendu_t,
       bool_or(m like 'conso_adresse_etablissement: %') as rcs_conso_attendu_f
  from unnest(public.emetteur_incomplet(:C)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3 bis. C hors siege inconnu (est_siege null) : conso_adresse_etablissement, seulement pour un particulier ==='
-- --------------------------------------------------------------------------
begin;
update public.entreprise_registre set est_siege = null where pro_id = :C and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = :C;
select bool_or(m like 'conso_adresse_etablissement: %') as conso_adresse_attendu_t,
       bool_or(m like 'adresse_etablissement: %') as adresse_etablissement_attendu_f,
       bool_or(m like 'adresse_siege: %') as adresse_siege_attendu_f
  from unnest(public.emetteur_incomplet(:C)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3 ter. B (etablissement secondaire) : au RCS adresse_siege SANS prefixe ; au RNE conso_adresse_siege ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, registre, greffe_ville) values (:B, 'rcs', 'Aix-en-Provence');
select bool_or(m like 'adresse_siege: %') as rcs_sans_prefixe_attendu_t,
       bool_or(m like 'conso_adresse_siege: %') as rcs_conso_attendu_f
  from unnest(public.emetteur_incomplet(:B)) m;
update public.emetteur set registre = 'rne' where pro_id = :B;
select bool_or(m like 'conso_adresse_siege: %') as rne_conso_attendu_t,
       bool_or(m like 'adresse_siege: %') as rne_sans_prefixe_attendu_f
  from unnest(public.emetteur_incomplet(:B)) m;
update public.emetteur set siege_adresse = '1 rue du Siège', siege_code_postal = '13001',
                           siege_ville = 'Marseille' where pro_id = :B;
select coalesce(bool_or(m like '%adresse_siege: %'), false) as siege_ecrit_plus_de_motif_attendu_f
  from unnest(public.emetteur_incomplet(:B)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 3 quater. Une identite ouverte par l administration (SIREN et SIRET seuls) reclame un nom ==='
-- Sa nature est inconnue (ni forme, ni `est_ei`) : `ei is not true`, et le
-- motif `identite` sort. Sans lui, l'écran disait « Oui » au-dessus d'un
-- en-tête sans nom (relecture du 18/10/2026). La fiche est complète par
-- ailleurs : c'est le SEUL motif.
-- --------------------------------------------------------------------------
begin;
update public.entreprise_registre set retiree_le = now() where pro_id = :C and retiree_le is null;
insert into public.entreprise_registre (pro_id, siren, siret, source, verifie_le)
values (:C, '000046029', '00004602900013', 'administration', now());
insert into public.emetteur
  (pro_id, registre, telephone, email, regime_tva, mediateur_nom, mediateur_adresse, mediateur_site,
   garantie_legale_texte, modalites_paiement_texte, modalites_execution_texte, reclamations_texte,
   etablissement_adresse, etablissement_code_postal, etablissement_ville)
values
  (:C, 'aucun', '04 91 00 00 00', 'c4600@exemple-opus.test', 'franchise', 'Médiateur d’essai',
   '1 rue de l’Essai, 13004 Marseille', 'https://mediateur.exemple-opus.test',
   'Garantie de parfait achèvement.', 'À réception de facture.', 'Aux dates convenues.',
   'Par écrit.', '1 rue de l’Essai', '13004', 'Marseille');
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:C, 0);
set local role authenticated;
set local request.jwt.claim.sub = :C;
select string_agg(split_part(m, ':', 1), ',') as seul_attendu_identite
  from unnest(public.emetteur_incomplet(:C)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4. D (SCP d architectes, 6578) choisit RNE : registre et conso_profession_reglementee, pas capital ==='
-- Une société civile est immatriculée au RCS (catégorie 6) mais n'indique
-- pas de capital (catégorie 5 seulement). Et l'architecte exerce une
-- profession réglementée qu'Opus ne sait pas encore écrire.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :D;
insert into public.emetteur (pro_id, registre) values (:D, 'rne');
select string_agg(split_part(m, ':', 1), ',' order by o) as cles,
       bool_or(m like 'registre: %') as registre_attendu_t,
       bool_or(m like 'conso_profession_reglementee: %') as profession_attendu_t,
       bool_or(m like 'capital: %') as capital_attendu_f
  from unnest(public.emetteur_incomplet(:D)) with ordinality u(m, o);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 4 bis. Le capital : une SNC (5202) et une SCS (5306) ne le doivent pas ; une SAS (5710) le doit ==='
-- R. 123-238 : le capital n'est dû que par une SARL (3°) ou une société
-- par actions (4°). Une SNC ou une SCS indique sa forme, pas son capital.
-- La fiche de A est complète SANS capital ; seule la forme change.
-- --------------------------------------------------------------------------
begin;
execute fiche_complete_a;
execute frais_a;
update public.emetteur set capital_centimes = null where pro_id = :A;
update public.entreprise_registre set forme_juridique = '5202' where pro_id = :A and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select cardinality(public.emetteur_incomplet(:A)) as snc_rien_attendu_0;
reset role;
update public.entreprise_registre set forme_juridique = '5306' where pro_id = :A and retiree_le is null;
set local role authenticated;
select cardinality(public.emetteur_incomplet(:A)) as scs_rien_attendu_0;
reset role;
update public.entreprise_registre set forme_juridique = '5710' where pro_id = :A and retiree_le is null;
set local role authenticated;
select string_agg(split_part(m, ':', 1), ',') as sas_attendu_capital
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 5. A ecrit une fiche sale : le declencheur la nettoie, et pose SES dates ==='
-- E-mail à blancs et capitales ; un téléphone fait de blancs ; capital
-- variable ET montant ; « rne » avec greffe et liquidation ; une garantie
-- faite d'un seul retour à la ligne ; des dates de 2001 envoyées par le
-- client, ignorées.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur
  (pro_id, email, telephone, capital_variable, capital_centimes, registre, greffe_ville,
   en_liquidation, regime_tva, regime_tva_declare_le, modifie_le, garantie_legale_texte,
   denomination_ei)
values
  (:A, '  Contact@EXEMPLE-Opus.TEST ', '   ', true, 500000, ' rne ', 'Aix',
   true, 'franchise', '2001-01-01T00:00:00Z', '2001-01-01T00:00:00Z', E'\n \n',
   E'\tJean Dupont EI\n');
select email, telephone is null as telephone_vide_attendu_t,
       capital_centimes is null as montant_retire_attendu_t, registre,
       greffe_ville is null as greffe_vide_attendu_t, en_liquidation as liquidation_attendu_f,
       locataire_gerant as locataire_attendu_f,
       garantie_legale_texte is null as retour_ligne_seul_vide_attendu_t,
       denomination_ei,
       regime_tva_declare_le > '2020-01-01' as date_regime_de_la_base_attendu_t,
       modifie_le > '2020-01-01' as modifie_le_de_la_base_attendu_t
  from public.emetteur where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6. La date du regime : inchangee, puis plus grande, puis vide ==='
-- Renvoyer la fiche entière ne rajeunit pas « déclaré le … » ; changer de
-- régime le date de nouveau ; retirer le régime retire la date.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur (pro_id, regime_tva) values (:A, 'franchise');
select regime_tva_declare_le as d1 from public.emetteur where pro_id = :A \gset
select pg_sleep(0.01);
update public.emetteur set telephone = '04 91 00 00 00', regime_tva_declare_le = '2001-01-01'
 where pro_id = :A;
select regime_tva_declare_le = :'d1' as inchangee_attendu_t from public.emetteur where pro_id = :A;
select pg_sleep(0.01);
update public.emetteur set regime_tva = 'reel' where pro_id = :A;
select regime_tva_declare_le > :'d1' as plus_grande_attendu_t from public.emetteur where pro_id = :A;
update public.emetteur set regime_tva = null where pro_id = :A;
select regime_tva_declare_le is null as vide_attendu_t from public.emetteur where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 6 bis. Le meme chemin que l application : un upsert, deux fois ==='
-- PostgREST écrit `insert … on conflict (pro_id) do update`. Le
-- déclencheur d'INSERT pose une date sur la ligne proposée, puis la mise à
-- jour repart de la ligne EXISTANTE : la date ne doit bouger que si le
-- régime change.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur (pro_id, telephone, regime_tva) values (:A, '04 91 00 00 00', 'franchise')
  on conflict (pro_id) do update set telephone = excluded.telephone, regime_tva = excluded.regime_tva;
select regime_tva_declare_le as u1 from public.emetteur where pro_id = :A \gset
select pg_sleep(0.01);
insert into public.emetteur (pro_id, telephone, regime_tva) values (:A, '06 00 00 00 00', 'franchise')
  on conflict (pro_id) do update set telephone = excluded.telephone, regime_tva = excluded.regime_tva;
select telephone, regime_tva_declare_le = :'u1' as meme_regime_meme_date_attendu_t
  from public.emetteur where pro_id = :A;
select pg_sleep(0.01);
insert into public.emetteur (pro_id, regime_tva) values (:A, 'reel')
  on conflict (pro_id) do update set regime_tva = excluded.regime_tva;
select regime_tva_declare_le > :'u1' as autre_regime_autre_date_attendu_t
  from public.emetteur where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 7. A : un mediateur a moitie -> emetteur_mediateur_check (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur (pro_id, mediateur_nom) values (:A, 'Médiateur d’essai');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 8. A : RCS sans greffe -> emetteur_greffe_check (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur (pro_id, registre) values (:A, 'rcs');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 9. B : trois noms d EI passent ; « Jean Dupont » seul -> emetteur_denomination_ei_check (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, denomination_ei) values (:B, 'Jean Dupont EI');
update public.emetteur set denomination_ei = 'JEAN DUPONT EIRL' where pro_id = :B;
update public.emetteur set denomination_ei = 'Jean Dupont, entrepreneur individuel à responsabilité limitée'
 where pro_id = :B;
select denomination_ei as dernier_accepte from public.emetteur where pro_id = :B;
update public.emetteur set denomination_ei = 'Jean Dupont' where pro_id = :B;
rollback;

\echo ''
\echo '=== 9 bis. B : « EI » seul, sans nom -> emetteur_denomination_ei_check (ERREUR attendue) ==='
-- R. 526-27 demande le NOM suivi de la mention : la mention seule ne fait
-- pas un nom, et l'en-tête s'imprimerait « EI ».
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, denomination_ei) values (:B, 'Jean EI');
select denomination_ei as un_nom_court_passe from public.emetteur where pro_id = :B;
update public.emetteur set denomination_ei = 'EI' where pro_id = :B;
rollback;

\echo ''
\echo '=== 9 ter. B : « ENTREPRENEUR INDIVIDUEL À RESPONSABILITÉ LIMITÉE » seul -> emetteur_denomination_ei_check (ERREUR attendue) ==='
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, denomination_ei) values (:B, 'ENTREPRENEUR INDIVIDUEL À RESPONSABILITÉ LIMITÉE');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 10. A : « au plus tot le 8e jour apres la signature » ET « a la signature » passent tous les deux ==='
-- Aucune contrainte de la base sur ce texte en 0a : la règle se décide
-- devis par devis au lot 2 ; ici, l'écran affiche un AVIS.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur (pro_id, modalites_paiement_texte)
values (:A, 'Paiement à réception de facture, au plus tôt le 8e jour après la signature');
update public.emetteur set modalites_paiement_texte = 'Acompte de 30 % à la signature' where pro_id = :A;
select modalites_paiement_texte as les_deux_passent from public.emetteur where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11. A : une decennale SANS contrat passe ; « autre » sans libelle -> emetteur_assurance_libelle_check (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture)
values (:A, 'decennale', 'Assureur d’essai', '1 rue de l’Assurance, 75000 Paris', 'France métropolitaine');
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture)
values (:A, 'autre', 'Assureur d’essai', '1 rue de l’Assurance, 75000 Paris', 'France métropolitaine');
rollback;

\echo ''
\echo '=== 11 (suite). A : une assurance sans couverture -> emetteur_assurance_complete_check (ERREUR attendue) ==='
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees)
values (:A, 'rc_pro', 'Assureur d’essai', '1 rue de l’Assurance, 75000 Paris');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 11 bis. Le libelle s efface hors « autre », et l ordre de la liste ne se recrit pas ==='
-- Ni à la mise à jour, ni à la CRÉATION : une date de 2001 envoyée par le
-- client ferait passer l'assurance en tête de la liste et de l'en-tête.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur_assurances (pro_id, nature, libelle, assureur_nom, assureur_coordonnees, couverture)
values (:A, 'rc_pro', 'Un libellé inutile', ' Assureur d’essai ', '1 rue de l’Assurance, 75000 Paris', 'France');
select created_at as c1 from public.emetteur_assurances where pro_id = :A \gset
update public.emetteur_assurances set created_at = '2001-01-01', couverture = 'Europe' where pro_id = :A;
select libelle is null as libelle_efface_attendu_t, assureur_nom,
       created_at = :'c1' as ordre_garde_attendu_t
  from public.emetteur_assurances where pro_id = :A;
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture, created_at)
values (:A, 'decennale', 'Assureur force', '2 rue de l’Assurance, 75000 Paris', 'France', '2001-01-01T00:00:00Z');
select created_at > '2020-01-01' as date_forcee_ignoree_attendu_t
  from public.emetteur_assurances where pro_id = :A and assureur_nom = 'Assureur force';
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 12. A : une attestation dans SON dossier passe ; dans celui de B -> emetteur_assurance_chemin_check (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture, attestation_chemin)
values (:A, 'decennale', 'Assureur', 'Paris', 'France', 'a4600000-0000-4000-8000-00000000000a/attestation-assurance-1.pdf');
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture, attestation_chemin)
values (:A, 'decennale', 'Assureur', 'Paris', 'France', 'a4600000-0000-4000-8000-00000000000b/attestation-assurance-1.pdf');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 13. Les frais de deplacement : trois etats, et le 0 avec des conditions refuse ==='
-- Une transaction par état. (a) rien de déclaré → le motif est là ;
-- (b) « Je ne facture pas » (0) → parti ; (c) un montant → parti ;
-- (d) des conditions seules, rognées → parti.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select bool_or(m like 'frais_deplacement: %') as a_sans_ligne_motif_attendu_t
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes, frais_deplacement_texte) values (:A, 0, null);
select coalesce(bool_or(m like 'frais_deplacement: %'), false) as b_zero_motif_attendu_f
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:A, 3500);
select coalesce(bool_or(m like 'frais_deplacement: %'), false) as c_montant_motif_attendu_f
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.tarifs_pro (pro_id, frais_deplacement_texte) values (:A, '  Selon la distance  ');
select frais_deplacement_texte as d_texte_rogne from public.tarifs_pro where pro_id = :A;
select coalesce(bool_or(m like 'frais_deplacement: %'), false) as d_texte_motif_attendu_f
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;

\echo ''
\echo '=== 13 (e). 0 ET « gratuit jusqu a 20 km » -> tarif_frais_zero_check (ERREUR attendue) ==='
-- Le refus EST la preuve que le texte n'a pas été vidé en silence : un
-- déclencheur qui l'aurait vidé aurait laissé passer la ligne, et le devis
-- aurait imprimé « Déplacement offert ».
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes, frais_deplacement_texte)
values (:A, 0, 'gratuit jusqu’à 20 km');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 14. A : -100 -> tarif_frais_check (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:A, -100);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 15. A remplit tout — SANS assurance : plus rien ne manque ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute fiche_complete_a;
execute frais_a;
select cardinality(public.emetteur_incomplet(:A)) as rien_ne_manque_attendu_0,
       (select count(*) from public.emetteur_assurances where pro_id = :A) as assurances_attendu_0;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 16. La meme chose sans mediateur : un seul element, conso_mediateur ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute fiche_complete_a;
execute frais_a;
update public.emetteur set mediateur_nom = null, mediateur_adresse = null, mediateur_site = null
 where pro_id = :A;
select string_agg(split_part(m, ':', 1), ',') as seul_attendu_conso_mediateur
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 17. TVA : B au reel sans numero transmis, puis en franchise ; A au reel avec numero ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, regime_tva) values (:B, 'reel');
select bool_or(m like 'conso_tva_intra: %') as b_reel_attendu_t from unnest(public.emetteur_incomplet(:B)) m;
update public.emetteur set regime_tva = 'franchise' where pro_id = :B;
select coalesce(bool_or(m like 'conso_tva_intra: %'), false) as b_franchise_attendu_f
  from unnest(public.emetteur_incomplet(:B)) m;
set local request.jwt.claim.sub = :A;
insert into public.emetteur (pro_id, regime_tva) values (:A, 'reel');
select coalesce(bool_or(m like 'conso_tva_intra: %'), false) as a_reel_avec_numero_attendu_f
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18. Deux identites : la RETIREE avait un n° de TVA, l ACTIVE non -> conso_tva_intra present ==='
-- La jointure lit l'identité active : une identité retirée ne prête pas son
-- numéro à la suivante.
-- --------------------------------------------------------------------------
begin;
update public.entreprise_registre set retiree_le = now(), tva = 'FR00000046011'
 where pro_id = :B and retiree_le is null;
insert into public.entreprise_registre
  (pro_id, siren, siret, est_ei, forme_juridique, est_siege, adresse, code_postal, commune, source, verifie_le)
values
  (:B, '000046011', '00004601100011', true, '1000', false, '3 CHEMIN DES ESSAIS 13410 LAMBESC', '13410',
   'LAMBESC', 'registre', now());
select count(*) as identites_de_B_attendu_2,
       count(*) filter (where retiree_le is null) as dont_active_attendu_1,
       count(*) filter (where retiree_le is not null and tva is not null) as retiree_avec_tva_attendu_1
  from public.entreprise_registre where pro_id = :B;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, regime_tva) values (:B, 'reel');
select bool_or(m like 'conso_tva_intra: %') as tva_intra_attendu_t from unnest(public.emetteur_incomplet(:B)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18 bis. Le calcul du n° de TVA : cinq SIREN dont le numero est connu, et ce qui n est pas un SIREN ==='
-- La Poste (356000000) : FR39356000000 sur la liste de la DGFiP, relevé le
-- 20/10/2026 par l'API Recherche d'entreprises. 404833048 et 552032534 :
-- les exemples publiés des calculateurs, refaits à la main. Les mêmes que
-- `verifier-emetteur` passe à `tvaIntraDuSiren` : les deux écritures de la
-- règle tournent sur le même jeu. Le dernier a une clé à UN chiffre (2) :
-- c'est lui qui prouve le zéro devant (`lpad`), les quatre autres ne le
-- pourraient pas.
-- --------------------------------------------------------------------------
select public.tva_intra_du_siren('356000000') = 'FR39356000000'
     and public.tva_intra_du_siren('404833048') = 'FR83404833048'
     and public.tva_intra_du_siren('552032534') = 'FR27552032534'
     and public.tva_intra_du_siren('000046011') = 'FR14000046011'
     and public.tva_intra_du_siren('000000029') = 'FR02000000029' as cinq_numeros_attendu_t,
       public.tva_intra_du_siren('12345678') is null
     and public.tva_intra_du_siren('1234567890') is null
     and public.tva_intra_du_siren('12345678a') is null
     and public.tva_intra_du_siren(null) is null as le_reste_attendu_t;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18 ter. B au reel, sans numero transmis, CONFIRME le sien : ecrit en vrac, range propre, et le motif se leve ==='
-- C'est le défaut du 20/10/2026 : un artisan au régime réel que l'annuaire
-- laissait sans numéro n'avait aucune porte. Le numéro est envoyé comme un
-- humain le recopierait — minuscules, espaces, point, tiret, espace
-- insécable — et la base le range sans un séparateur.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, regime_tva) values (:B, 'reel');
select bool_or(m like 'conso_tva_intra: %') as avant_attendu_t from unnest(public.emetteur_incomplet(:B)) m;
update public.emetteur set tva_intra = E' fr 14\u00a0000.046-011 ' where pro_id = :B;
select tva_intra, tva_intra = 'FR14000046011' as range_propre_attendu_t from public.emetteur where pro_id = :B;
select coalesce(bool_or(m like 'conso_tva_intra: %'), false) as apres_attendu_f
  from unnest(public.emetteur_incomplet(:B)) m;
-- En franchise, le numéro confirmé reste : un franchisé peut en avoir un.
update public.emetteur set regime_tva = 'franchise' where pro_id = :B;
select tva_intra is not null as garde_en_franchise_attendu_t from public.emetteur where pro_id = :B;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18 quater. B ecrit le numero de A, juste mais pas le sien -> OP013 (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
\set VERBOSITY verbose
insert into public.emetteur (pro_id, regime_tva, tva_intra) values (:B, 'reel', 'FR87000046003');
\set VERBOSITY default
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18 quinquies. B ecrit son SIREN avec une cle fausse -> OP013 aussi (ERREUR attendue) ==='
-- Le déclencheur passe AVANT la contrainte : un numéro qui n'est pas celui
-- du SIREN rattaché est refusé avec la phrase qui dit quoi toucher.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, regime_tva, tva_intra) values (:B, 'reel', 'FR00000046011');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18 sexies. L entreprise rattachee change : le numero d avant ne compte plus, et ne bloque rien ==='
-- Un numéro confirmé pour l'ancienne entreprise ne doit ni s'imprimer pour
-- la nouvelle (le motif revient), ni empêcher d'enregistrer le téléphone.
-- Le nouveau SIREN est fictif, propre à ce cas.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, regime_tva, tva_intra) values (:B, 'reel', 'FR14000046011');
reset role;
update public.entreprise_registre set retiree_le = now() where pro_id = :B and retiree_le is null;
insert into public.entreprise_registre
  (pro_id, siren, siret, est_ei, forme_juridique, est_siege, adresse, code_postal, commune, source, verifie_le)
values
  (:B, '000046110', '00004611000010', true, '1000', true, '3 CHEMIN DES ESSAIS 13410 LAMBESC', '13410',
   'LAMBESC', 'registre', now());
set local role authenticated;
set local request.jwt.claim.sub = :B;
select bool_or(m like 'conso_tva_intra: %') as motif_revient_attendu_t from unnest(public.emetteur_incomplet(:B)) m;
update public.emetteur set telephone = '04 42 00 00 00' where pro_id = :B;
select telephone is not null and tva_intra = 'FR14000046011' as telephone_passe_attendu_t
  from public.emetteur where pro_id = :B;
update public.emetteur set tva_intra = public.tva_intra_du_siren('000046110') where pro_id = :B;
select coalesce(bool_or(m like 'conso_tva_intra: %'), false) as nouveau_confirme_attendu_f
  from unnest(public.emetteur_incomplet(:B)) m;
update public.emetteur set tva_intra = null where pro_id = :B;
select bool_or(m like 'conso_tva_intra: %') as retire_attendu_t from unnest(public.emetteur_incomplet(:B)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18 septies. Sans entreprise rattachee, aucun numero ne s ecrit -> OP013 (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
update public.entreprise_registre set retiree_le = now() where pro_id = :B and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, regime_tva, tva_intra) values (:B, 'reel', 'FR14000046011');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 18 octies. La contrainte elle-meme, declencheurs coupes : une cle fausse -> emetteur_tva_intra_check (ERREUR attendue) ==='
-- Le déclencheur refuse avant elle : on le coupe (superutilisateur,
-- `session_replication_role`) pour éprouver la contrainte seule, qui garde
-- la FORME même si une écriture contournait le déclencheur.
-- --------------------------------------------------------------------------
begin;
set local session_replication_role = replica;
insert into public.emetteur (pro_id, tva_intra) values (:D, 'FR00000046037');
rollback;
begin;
set local session_replication_role = replica;
insert into public.emetteur (pro_id, tva_intra) values (:D, 'FR3700004603');
rollback;
\echo '(les deux refus ci-dessus sont attendus : une cle fausse, puis douze chiffres au lieu de onze)'


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 19. Fraicheur : lue il y a 400 jours -> entreprise_ancienne ; 300 -> rien ; 400 par l administration -> rien ==='
-- La relecture annuelle est une règle d'Opus, et elle ne vise que ce qui
-- vient du répertoire : une identité ouverte par l'administration n'y a
-- jamais été lue.
-- --------------------------------------------------------------------------
begin;
execute fiche_complete_a;
execute frais_a;
update public.entreprise_registre set verifie_le = now() - interval '400 days'
 where pro_id = :A and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select string_agg(split_part(m, ':', 1), ',') as attendu_entreprise_ancienne
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;

begin;
execute fiche_complete_a;
execute frais_a;
update public.entreprise_registre set verifie_le = now() - interval '300 days'
 where pro_id = :A and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select cardinality(public.emetteur_incomplet(:A)) as a_300_jours_attendu_0;
rollback;

begin;
execute fiche_complete_a;
execute frais_a;
update public.entreprise_registre set verifie_le = now() - interval '400 days', source = 'administration'
 where pro_id = :A and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select cardinality(public.emetteur_incomplet(:A)) as administration_400_jours_attendu_0;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 20. L identite de A retiree, fiche complete : « entreprise » seul ==='
-- --------------------------------------------------------------------------
begin;
execute fiche_complete_a;
execute frais_a;
update public.entreprise_registre set retiree_le = now() where pro_id = :A and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select string_agg(split_part(m, ':', 1), ',') as attendu_entreprise
  from unnest(public.emetteur_incomplet(:A)) m;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 21. B ne LIT RIEN de A, dans aucune des trois tables, et n y ecrit rien ==='
-- Les lignes de A existent d'abord (1, 1, 1 en superutilisateur, puis pour
-- A lui-même) : c'est ce qui rend les « 0 » de B crédibles.
-- --------------------------------------------------------------------------
begin;
execute fiche_complete_a;
execute frais_a;
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture)
values (:A, 'decennale', 'Assureur', 'Paris', 'France');
select (select count(*) from public.emetteur where pro_id = :A) as vraiment_en_base_attendu_1,
       (select count(*) from public.tarifs_pro where pro_id = :A) as tarifs_attendu_1,
       (select count(*) from public.emetteur_assurances where pro_id = :A) as assurances_attendu_1;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select (select count(*) from public.emetteur) as a_lit_attendu_1,
       (select count(*) from public.tarifs_pro) as a_lit_tarifs_attendu_1,
       (select count(*) from public.emetteur_assurances) as a_lit_assurances_attendu_1;
set local request.jwt.claim.sub = :B;
select (select count(*) from public.emetteur) as b_lit_attendu_0,
       (select count(*) from public.tarifs_pro) as b_lit_tarifs_attendu_0,
       (select count(*) from public.emetteur_assurances) as b_lit_assurances_attendu_0;
update public.emetteur set telephone = '06 66 66 66 66' where pro_id = :A;
update public.tarifs_pro set frais_deplacement_centimes = 1 where pro_id = :A;
update public.emetteur_assurances set couverture = 'Monde' where pro_id = :A;
delete from public.tarifs_pro where pro_id = :A;
reset role;
select telephone as toujours_celui_de_A, (select frais_deplacement_centimes from public.tarifs_pro where pro_id = :A)
         as frais_intacts_attendu_3500
  from public.emetteur where pro_id = :A;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 22. B ecrit une fiche AU NOM de A -> RLS sur "emetteur" (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur (pro_id, telephone) values (:A, '06 66 66 66 66');
rollback;

\echo ''
\echo '=== 22 bis. …des frais au nom de A -> RLS sur "tarifs_pro" (ERREUR attendue) ==='
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:A, 1);
rollback;

\echo ''
\echo '=== 22 ter. …une assurance au nom de A -> RLS sur "emetteur_assurances" (ERREUR attendue) ==='
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture)
values (:A, 'decennale', 'Assureur', 'Paris', 'France');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 23. Un PARTICULIER ecrit « sa » fiche -> RLS (ERREUR attendue) ==='
-- `est_mon_entreprise()` exige d'être un professionnel : un identifiant
-- n'est pas une entreprise.
-- --------------------------------------------------------------------------
begin;
set local role authenticated;
set local request.jwt.claim.sub = :P;
insert into public.emetteur (pro_id, telephone) values (:P, '06 00 00 00 00');
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 24 a. Un visiteur sans compte, sur "emetteur" -> permission denied (ERREUR attendue) ==='
-- Pas une liste vide : aucun droit de table pour `anon`.
-- --------------------------------------------------------------------------
begin;
set local role anon;
select count(*) from public.emetteur;
rollback;

\echo ''
\echo '=== 24 b. …sur "emetteur_assurances" (ERREUR attendue) ==='
begin;
set local role anon;
select count(*) from public.emetteur_assurances;
rollback;

\echo ''
\echo '=== 24 c. …sur "tarifs_pro" (ERREUR attendue) ==='
begin;
set local role anon;
select count(*) from public.tarifs_pro;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 25. B demande ce qui manque a A -> OP011 et son texte (ERREUR attendue) ==='
-- --------------------------------------------------------------------------
\set VERBOSITY verbose
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
select public.emetteur_incomplet(:A);
rollback;

\echo ''
\echo '=== 25 bis. Sans jeton (editeur SQL, fonction Edge) -> OP011 aussi : `is not true`, pas `not` (ERREUR attendue) ==='
begin;
select public.emetteur_incomplet(:A);
rollback;
\set VERBOSITY default

\echo ''
\echo '=== 25 ter. Un visiteur l appelle -> permission denied for function (ERREUR attendue) ==='
begin;
set local role anon;
select public.emetteur_incomplet(:A);
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 26. Les droits : les declencheurs ne s appellent pas, la fonction pour les connectes seulement ==='
-- --------------------------------------------------------------------------
select f, r, has_function_privilege(r, f, 'execute') as execute_attendu_f
  from unnest(array['public.tient_l_emetteur()', 'public.tient_l_assurance()',
                    'public.tient_les_tarifs()']) f,
       unnest(array['anon', 'authenticated']) r
 order by 1, 2;
select has_function_privilege('anon', 'public.emetteur_incomplet(uuid)', 'execute') as anon_attendu_f,
       has_function_privilege('authenticated', 'public.emetteur_incomplet(uuid)', 'execute')
         as authenticated_attendu_t;
-- Le calcul du n° de TVA : appelé par une CONTRAINTE, donc exécutable par
-- qui écrit (`authenticated`) ; personne d'autre n'en a besoin.
select has_function_privilege('anon', 'public.tva_intra_du_siren(text)', 'execute') as tva_anon_attendu_f,
       has_function_privilege('authenticated', 'public.tva_intra_du_siren(text)', 'execute')
         as tva_authenticated_attendu_t;
select t, has_table_privilege('anon', t, 'select') as anon_select_attendu_f,
       has_table_privilege('authenticated', t, 'truncate') as truncate_attendu_f
  from unnest(array['public.emetteur', 'public.emetteur_assurances', 'public.tarifs_pro']) t
 order by 1;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 26 bis. Personne d autre ne lit ces trois tables : une liste FERMEE de fonctions, aucune security definer, aucune vue ==='
-- C'est ce que promet « Vos tarifs et vos prix » (src/data/legal.js) :
-- aucun écran ne montre les prix d'un artisan à quelqu'un d'autre. Une
-- fonction `security definer` sous n'importe quel nom, ou une vue, les
-- ouvrirait à un visiteur sans qu'aucune politique ne soit touchée — le
-- contrôle ne peut pas viser un NOM (`admin_…`), il vise le catalogue.
--
-- ATTENDU CHANGÉ PAR LA SECTION 47 (lot T) : `artisans_urgence()` lit
-- désormais `tarifs_pro`, et entre dans la liste fermée. Elle reste
-- `security invoker` — elle ne lit qu'à travers « tarifs affiches », qui
-- réserve les lignes affichées aux particuliers — et l'attendu se lit par
-- ENSEMBLE, pas par un nombre : un nom remplacé par un autre ne garderait
-- pas le compte juste pour une mauvaise raison.
-- --------------------------------------------------------------------------
select coalesce(string_agg(p.proname, ', ' order by p.proname), '(aucune)')
         as hors_liste_attendu_aucune
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public'
   and p.prosrc ~ '\m(tarifs_pro|emetteur_assurances|emetteur)\M'
   and p.proname <> all (array['tient_l_emetteur', 'tient_l_assurance', 'tient_les_tarifs',
                               'emetteur_incomplet', 'mes_donnees', 'artisans_urgence']);
select count(*) filter (where p.prosecdef) as definer_attendu_0,
       string_agg(p.proname, ', ' order by p.proname)
         as les_nomment,
       string_agg(p.proname, ', ' order by p.proname)
         = 'artisans_urgence, emetteur_incomplet, mes_donnees' as liste_attendu_t
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
 where ns.nspname = 'public' and p.prosrc ~ '\m(tarifs_pro|emetteur_assurances|emetteur)\M';
select (select count(*) from pg_views
         where definition ~ '\m(tarifs_pro|emetteur_assurances|emetteur)\M')
     + (select count(*) from pg_matviews
         where definition ~ '\m(tarifs_pro|emetteur_assurances|emetteur)\M') as vues_attendu_0;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 27. L export RGPD : les trois cles pour A, rien de A pour B ==='
-- --------------------------------------------------------------------------
begin;
execute fiche_complete_a;
insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:A, 0);
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture)
values (:A, 'decennale', 'Assureur', 'Paris', 'France');
set local role authenticated;
set local request.jwt.claim.sub = :A;
select d ? 'mon_entreprise' and d -> 'mon_entreprise' <> 'null'::jsonb as mon_entreprise_attendu_t,
       jsonb_array_length(d -> 'mes_assurances_professionnelles') as assurances_attendu_1,
       d -> 'mes_tarifs' ->> 'frais_deplacement_centimes' as frais_attendu_0
  from (select public.mes_donnees() as d) x;
set local request.jwt.claim.sub = :B;
select d -> 'mon_entreprise' = 'null'::jsonb as b_rien_attendu_t,
       jsonb_array_length(d -> 'mes_assurances_professionnelles') as b_assurances_attendu_0,
       d -> 'mes_tarifs' = 'null'::jsonb as b_tarifs_rien_attendu_t
  from (select public.mes_donnees() as d) x;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 28. Le compte de A part : ses trois tables partent avec lui ==='
-- --------------------------------------------------------------------------
begin;
execute fiche_complete_a;
execute frais_a;
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture)
values (:A, 'decennale', 'Assureur', 'Paris', 'France');
select (select count(*) from public.emetteur where pro_id = :A) as avant_attendu_1,
       (select count(*) from public.tarifs_pro where pro_id = :A) as avant_tarifs_attendu_1,
       (select count(*) from public.emetteur_assurances where pro_id = :A) as avant_assurances_attendu_1;
delete from auth.users where id = :A;
select (select count(*) from public.emetteur where pro_id = :A) as apres_attendu_0,
       (select count(*) from public.tarifs_pro where pro_id = :A) as apres_tarifs_attendu_0,
       (select count(*) from public.emetteur_assurances where pro_id = :A) as apres_assurances_attendu_0;
rollback;


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 29. Les contraintes : toutes nommees en _check, aucune anonyme, pas de emetteur_paiement_check ==='
-- ATTENDU CHANGÉ PAR LA SECTION 47 (lot T) : 25 et non plus 20. La
-- section 47 pose cinq contraintes de plus sur `tarifs_pro` (le taux
-- horaire, la majoration, le prix du devis, le décompte, l'affichage).
-- PUIS 26 le 20/10/2026 : `emetteur_tva_intra_check`, le n° de TVA confirmé.
-- --------------------------------------------------------------------------
select count(*) filter (where conname !~ '_check$') as mal_nommees_attendu_0,
       count(*) filter (where conname ~ '_check[0-9]+$') as anonymes_attendu_0,
       count(*) filter (where conname = 'emetteur_paiement_check') as paiement_attendu_0,
       count(*) filter (where conname = 'emetteur_tva_intra_check') as tva_intra_attendu_1,
       count(*) as contraintes_check_attendu_26
  from pg_constraint
 where contype = 'c'
   and conrelid in ('public.emetteur'::regclass, 'public.emetteur_assurances'::regclass,
                    'public.tarifs_pro'::regclass);


-- --------------------------------------------------------------------------
\echo ''
\echo '=== 30. Rien n est « not null » sauf les cles ==='
-- --------------------------------------------------------------------------
select string_agg(table_name || '.' || column_name, ', ' order by table_name, column_name)
         as seules_les_cles
  from information_schema.columns
 where table_schema = 'public'
   and table_name in ('emetteur', 'emetteur_assurances', 'tarifs_pro')
   and is_nullable = 'NO';

deallocate fiche_complete_a;
deallocate frais_a;
