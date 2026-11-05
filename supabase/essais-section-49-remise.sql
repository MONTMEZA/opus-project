-- ==========================================================================
--  ESSAIS DE LA SECTION 49.9 — « Ce qu'il manque pour remettre ce devis »
--  (lot 2b, étape 2b-1, 05/11/2026) : `motifs_refus_remise(p_devis)`
--
--  À lancer sur un PostgreSQL ordinaire, après `local-prelude.sql` puis
--  `schema.sql` rejoué DEUX fois :
--
--      psql -h /tmp -p 5433 -U postgres -d opus_essai \
--           -v ON_ERROR_STOP=0 -f supabase/essais-section-49-remise.sql
--
--  LE DÉCOR EST CELUI DE L'ESSAI 49 — les mêmes comptes (préfixe a4900000),
--  les mêmes SIRET FICTIFS (vérifiés absents du répertoire Sirene le
--  21/10/2026, voir l'en-tête de `essais-section-49.sql`), le même ménage de
--  tête : les trois fichiers 49 peuvent se jouer l'un après l'autre sur la
--  même base. A est une SARL en siège (5499), SANS n° de TVA connu.
--
--  ONZE CAS ATTENDENT UNE ERREUR, et c'est le but : un essai de sécurité qui
--  ne montre aucun refus n'éprouve rien. Joué comme ci-dessus sur une base
--  neuve, ce fichier écrit EXACTEMENT 11 lignes `psql:… ERROR`
--  (`… 2>&1 | grep -c '^psql:.*ERROR:'` → 11). Un autre compte est un ÉCHEC,
--  même quand toutes les colonnes valent `t`. Les onze, tous au cas 12 :
--
--     1  12 a   A demande la liste du devis de B             → OP027
--     2  12 b   A, un identifiant inventé                     → OP027
--     3  12 c   A, un identifiant vide                        → OP027
--     4  12 d   P (particulier) demande la liste du devis de A → OP027
--     5  12 e   P, un identifiant inventé                     → OP027
--     6  12 f   par une fonction security definer : le devis de B → OP027
--     7  12 f   …et un identifiant inventé                    → OP027
--     8  12 g   par la clé de service, jeton de A : le devis de B → OP027
--     9  12 g   …et un identifiant inventé                    → OP027
--    10  12 g   par la clé de service SANS jeton : le devis de A → OP027
--    11  12 h   un visiteur (anon)  → « permission denied for function motifs_refus_remise »
--
--  ET CHACUN EST JUGÉ EN SQL, pas à l'œil (la leçon de RBM-1, lot 2a) :
--  `:ERROR`, `LAST_ERROR_SQLSTATE` et `LAST_ERROR_MESSAGE` sont relevés
--  juste après l'ordre, puis comparés, la transaction annulée, au code et au
--  message attendus — le MÊME message pour les dix OP027. Un refus qui
--  manque laisse un `f`, pas seulement une ligne de moins.
--
--  LES RÈGLES DE L'ESSAI 49 VALENT ICI : chaque cas dans son `begin …
--  rollback`, construisant son propre état ; chaque ordre qui doit échouer
--  est le DERNIER de sa transaction, ou suivi d'un `rollback to savepoint`
--  (cas 12 f, dit) ; AUCUN CAS DE RLS DANS UN BLOC `do` — `set local role
--  authenticated;` puis `set local request.jwt.claim.sub = :A;`, chacun dans
--  son propre ordre ; chaque « aucun motif » est précédé, dans la même
--  transaction, de la preuve que la donnée existe.
--
--  CHAQUE MOTIF EST ALLUMÉ PUIS ÉTEINT PAR LE CHEMIN D'UN CLIENT : les
--  écritures passent par les droits de colonne de 49.7, par
--  `tient_le_devis()` et par l'horloge du devis (chaque écriture porte un
--  numéro plus grand que le précédent — 49.5 bis).
--
--  Les valeurs se jugent par des colonnes `…_attendu_t` : un `f`, ou une
--  colonne vide, est un ÉCHEC. `motifs(id, attendu)` rend les clés dans
--  l'ordre de sortie, séparées par des virgules, « — » quand il n'y en a
--  AUCUNE.
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
\set D1 '''d4930000-0000-4000-8000-0000000000d1'''
\set DX '''d4930000-0000-4000-8000-0000000000d7'''
\set DY '''d4930000-0000-4000-8000-0000000000d8'''
\set DZ '''d4930000-0000-4000-8000-0000000000d9'''
\set DB '''d4930000-0000-4000-8000-0000000000db'''
\set DI '''d4930000-0000-4000-8000-0000000000ff'''
\set L1 '''f4930000-0000-4000-8000-000000000001'''
\set L2 '''f4930000-0000-4000-8000-000000000002'''
\set L3 '''f4930000-0000-4000-8000-000000000003'''
\set L4 '''f4930000-0000-4000-8000-000000000004'''
\set L5 '''f4930000-0000-4000-8000-000000000005'''
\set L6 '''f4930000-0000-4000-8000-000000000006'''
\set L7 '''f4930000-0000-4000-8000-000000000007'''

-- Le message d'OP027, écrit une fois : celui que tous les refus doivent porter.
\set MSG_OP027 'Ce devis n’existe pas, ou il n’est pas le vôtre.'

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

-- Deux artisans, un particulier ; une fiche du carnet de chacun ; une
-- demande de devis et une urgence de P à A, ACCEPTÉES (le cas 13 en a
-- besoin). Le tout VALIDÉ : c'est le décor commun.
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
 (:SA, :P, :A, 'plomberie', 'fuite', 'acceptee'),
 (:SB, :P, :B, 'plomberie', 'fuite', 'acceptee');
commit;

-- LA FICHE « MON ENTREPRISE » DE A, COMPLÈTE, au régime passé en paramètre
-- (posée en superutilisateur, comme dans l'essai 46). En franchise, avec ses
-- frais de déplacement, il ne manque RIEN à l'entreprise de A : tout motif
-- qui reste est un motif du DEVIS.
prepare fiche_a(text) as
  insert into public.emetteur
    (pro_id, registre, greffe_ville, capital_centimes, telephone, email, regime_tva,
     mediateur_nom, mediateur_adresse, mediateur_site, garantie_legale_texte,
     modalites_paiement_texte, modalites_execution_texte, reclamations_texte)
  values
    (:A, 'rcs', 'Aix-en-Provence', 100000, '04 42 00 00 00', 'contact@exemple-opus.test', $1,
     'Médiateur d’essai', '1 rue de l’Essai, 13410 Lambesc', 'https://mediateur.exemple-opus.test',
     'Garantie de parfait achèvement, biennale et décennale.',
     'Paiement à réception de facture.', 'Travaux réalisés aux dates convenues.',
     'Par écrit, réponse sous quinze jours.');
prepare frais_a as
  insert into public.tarifs_pro (pro_id, frais_deplacement_centimes) values (:A, 3500);

-- UN DEVIS DE A OÙ RIEN NE MANQUE (horloge 1) : client, lieu, délai, validité.
prepare devis_complet(uuid) as
  insert into public.devis (id, pro_id, client_id, objet, lieu_adresse, lieu_code_postal, lieu_ville,
                            delai_execution, validite_jours, generation)
  values ($1, :A, :C1, 'Salle de bain', '4 rue de l''Essai', '13410', 'Lambesc',
          'Dans les 30 jours suivant la signature', 30, 1);
-- Une ligne CHIFFRÉE : (id, devis, ordre, type, prix en centimes, taux, offert, numéro d'écriture).
prepare chiffree(uuid, uuid, integer, text, bigint, integer, boolean, bigint) as
  insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite,
                                   prix_unitaire_centimes, taux_tva_centiemes, offert, generation)
  values ($1, $2, $3, $4, 'Ligne d’essai', 1000, 'forfait', $5, $6, $7, $8);
-- Une ligne SANS chiffre (zone, pièce, réserve) : (id, devis, ordre, type, numéro).
prepare titre(uuid, uuid, integer, text, bigint) as
  insert into public.devis_lignes (id, devis_id, ordre, type, designation, generation)
  values ($1, $2, $3, $4, 'Titre d’essai', $5);

-- Ce qu'on relit : les clés, dans l'ordre de SORTIE de la fonction, et leur
-- comparaison à l'attendu (« — » = aucune ligne).
prepare motifs(uuid, text) as
  select coalesce(string_agg(m.cle, ',' order by m.o), '—') as cles,
         coalesce(string_agg(m.cle, ',' order by m.o), '—') = $2 as motifs_attendu_t
    from public.motifs_refus_remise($1) with ordinality as m(rang, cle, phrase, nature, ligne_id, o);
-- Les lignes désignées par les motifs de LIGNE, dans l'ordre de sortie.
-- Toute la liste est lue (pas seulement les motifs de ligne) : un motif qui
-- n'est pas de ligne et qui porterait une ligne serait vu.
prepare fautives(uuid, text) as
  select coalesce(string_agg(m.ligne_id::text, ',' order by m.o)
                    filter (where m.cle = 'devis_taux_regime'), '—') = $2 as lignes_attendu_t,
         count(*) filter (where m.cle = 'devis_taux_regime' and m.ligne_id is null) as sans_ligne_attendu_0,
         count(*) filter (where m.cle <> 'devis_taux_regime' and m.ligne_id is not null) as ligne_en_trop_attendu_0
    from public.motifs_refus_remise($1) with ordinality as m(rang, cle, phrase, nature, ligne_id, o);
-- LES TROIS LISTES du cas 13 : chacune réduite à sa SIGNATURE complète —
-- rang, clé, nature, phrase, et l'ORDRE de la ligne désignée (pas son
-- identifiant, qui change d'un devis à l'autre) —, comparées entre elles, et
-- les clés de la première comparées à l'attendu.
prepare trois_listes(uuid, uuid, uuid, text) as
  with sig as (
    select v.n,
           (select coalesce(string_agg(concat_ws('|', m.rang, m.cle, m.nature, m.phrase,
                                                 coalesce((select l.ordre::text from public.devis_lignes l
                                                            where l.id = m.ligne_id), '-')),
                                       ' ¶ ' order by m.o), '—')
              from public.motifs_refus_remise(v.id) with ordinality as m(rang, cle, phrase, nature, ligne_id, o)) as s,
           (select coalesce(string_agg(m.cle, ',' order by m.o), '—')
              from public.motifs_refus_remise(v.id) with ordinality as m(rang, cle, phrase, nature, ligne_id, o)) as cles
      from (values (1, $1), (2, $2), (3, $3)) as v(n, id))
  select (select cles from sig where n = 1) as cles_de_x,
         (select cles from sig where n = 1) = $4 as cles_attendu_t,
         count(distinct s) = 1 and count(*) = 3 as x_y_z_identiques_attendu_t
    from sig;


-- ==========================================================================
\echo ''
\echo '=== 0. LA DONNÉE EXISTE — un devis de A où rien ne manque : A le lit, la fonction ne rend AUCUNE ligne ==='
\echo '    attendu : devis 1, lignes 1, cles « — » (motifs_attendu_t t), lignes_rendues 0'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
select (select count(*) from public.devis where id = :D1) as devis_attendu_1,
       (select count(*) from public.devis_lignes where devis_id = :D1) as lignes_attendu_1,
       (select count(*) from public.motifs_refus_remise(:D1)) as lignes_rendues_attendu_0;
execute motifs(:D1, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 1. devis_client — allumé (client retiré), puis éteint (client remis) ==='
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
execute motifs(:D1, '—');
update public.devis set client_id = null, generation = 3 where id = :D1;
execute motifs(:D1, 'devis_client');
update public.devis set client_id = :C1, generation = 4 where id = :D1;
execute motifs(:D1, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 2. devis_lignes — ni un titre, ni une réserve, ni une OPTION ne sont un poste ; un poste OFFERT en est un ==='
\echo '    attendu : devis_lignes ×5 (sans ligne, zone, pièce, réserve, option), puis « — » (poste offert),'
\echo '              puis devis_lignes (le poste retiré), puis « — » (un poste payant)'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute motifs(:D1, 'devis_lignes');
execute titre(:L1, :D1, 1000, 'zone', 2);
execute motifs(:D1, 'devis_lignes');
execute titre(:L2, :D1, 2000, 'piece', 3);
execute motifs(:D1, 'devis_lignes');
execute titre(:L3, :D1, 3000, 'reserve', 4);
execute motifs(:D1, 'devis_lignes');
execute chiffree(:L4, :D1, 4000, 'option', 22000, 0, false, 5);
execute motifs(:D1, 'devis_lignes');
execute chiffree(:L5, :D1, 5000, 'poste', 4500, 0, true, 6);
execute motifs(:D1, '—');
delete from public.devis_lignes where id = :L5;
execute motifs(:D1, 'devis_lignes');
execute chiffree(:L6, :D1, 6000, 'poste', 100000, 0, false, 7);
execute motifs(:D1, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 3 a. devis_taux_regime en FRANCHISE — UNE ligne par ligne fautive (poste ET option, offerte comprise), dans l’ordre « ordre, id » ==='
\echo '    lignes : zone (sans taux) ; L1 poste 0 % (juste) ; L2 poste 20 % ordre 2000 ; L3 option 10 % ordre 3000 ;'
\echo '             L4 poste OFFERT 5,5 % ordre 4000 ; L5 poste 20 % ordre 1500 (écrit APRÈS, rangé AVANT) ;'
\echo '             L6 option 20 % ordre 4000 (même ordre que L4 : L4 < L6 par identifiant)'
\echo '    attendu : cinq devis_taux_regime désignant L5, L2, L3, L4, L6 ; puis chaque ligne remise à 0 → « — »'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute titre(:L7, :D1, 500, 'zone', 2);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 3);
execute chiffree(:L2, :D1, 2000, 'poste', 10000, 2000, false, 4);
execute chiffree(:L3, :D1, 3000, 'option', 10000, 1000, false, 5);
execute chiffree(:L4, :D1, 4000, 'poste', 4500, 550, true, 6);
execute chiffree(:L5, :D1, 1500, 'poste', 10000, 2000, false, 7);
execute chiffree(:L6, :D1, 4000, 'option', 10000, 2000, false, 8);
execute motifs(:D1, 'devis_taux_regime,devis_taux_regime,devis_taux_regime,devis_taux_regime,devis_taux_regime');
execute fautives(:D1, concat_ws(',', :L5::text, :L2::text, :L3::text, :L4::text, :L6::text));
update public.devis_lignes set taux_tva_centiemes = 0, generation = 9  where id = :L2;
update public.devis_lignes set taux_tva_centiemes = 0, generation = 10 where id = :L3;
update public.devis_lignes set taux_tva_centiemes = 0, generation = 11 where id = :L4;
update public.devis_lignes set taux_tva_centiemes = 0, generation = 12 where id = :L5;
execute fautives(:D1, :L6::text);
update public.devis_lignes set taux_tva_centiemes = 0, generation = 13 where id = :L6;
execute motifs(:D1, '—');
rollback;

\echo ''
\echo '=== 3 b. devis_taux_regime au RÉEL — une ligne chiffrée à 0 (poste offert, option) est fautive ; 20 % est juste ==='
\echo '    attendu : devis_taux_regime ×2 (L2, L3), puis conso_tva_intra de l’entreprise (A n’a aucun n° de TVA) ;'
\echo '              les deux lignes passées à 20 % et 10 % → il ne reste que conso_tva_intra'
-- ==========================================================================
begin;
execute fiche_a('reel');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 2000, false, 2);
execute chiffree(:L2, :D1, 2000, 'poste', 4500, 0, true, 3);
execute chiffree(:L3, :D1, 3000, 'option', 10000, 0, false, 4);
execute motifs(:D1, 'devis_taux_regime,devis_taux_regime,conso_tva_intra');
execute fautives(:D1, concat_ws(',', :L2::text, :L3::text));
update public.devis_lignes set taux_tva_centiemes = 2000, generation = 5 where id = :L2;
update public.devis_lignes set taux_tva_centiemes = 1000, generation = 6 where id = :L3;
execute motifs(:D1, 'conso_tva_intra');
rollback;

\echo ''
\echo '=== 3 c. RÉGIME NON DÉCLARÉ — aucune ligne n’est fautive (le motif regime_tva de l’entreprise le dit), avec ou sans fiche ==='
\echo '    attendu, deux fois : taux_regime 0 ; regime_tva 1'
-- ==========================================================================
begin;
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 2000, false, 2);
execute chiffree(:L2, :D1, 2000, 'option', 10000, 0, false, 3);
select count(*) filter (where cle = 'devis_taux_regime') as taux_regime_sans_fiche_attendu_0,
       count(*) filter (where cle = 'regime_tva') as regime_tva_attendu_1
  from public.motifs_refus_remise(:D1);
reset role;
execute fiche_a(null);
set local role authenticated;
select count(*) filter (where cle = 'devis_taux_regime') as taux_regime_fiche_sans_regime_attendu_0,
       count(*) filter (where cle = 'regime_tva') as regime_tva_attendu_1
  from public.motifs_refus_remise(:D1);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 4. devis_lieu — des BLANCS ne sont pas un lieu (espaces, insécable, espace sans chasse) ; un seul des trois suffit ==='
\echo '    attendu : les trois colonnes rangées vides (null) ; devis_lieu ; puis « — » avec la ville seule,'
\echo '              le code postal seul, l’adresse seule'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
update public.devis
   set lieu_adresse = '   ', lieu_code_postal = ' ' || chr(160) || chr(8239),
       lieu_ville = chr(160) || chr(8203) || ' ', generation = 3
 where id = :D1;
select lieu_adresse is null and lieu_code_postal is null and lieu_ville is null as ranges_vides_attendu_t
  from public.devis where id = :D1;
execute motifs(:D1, 'devis_lieu');
update public.devis set lieu_ville = 'Lambesc', generation = 4 where id = :D1;
execute motifs(:D1, '—');
update public.devis set lieu_ville = null, lieu_code_postal = '13410', generation = 5 where id = :D1;
execute motifs(:D1, '—');
update public.devis set lieu_code_postal = null, lieu_adresse = '4 rue de l''Essai', generation = 6 where id = :D1;
execute motifs(:D1, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 5. devis_delai — des blancs ne sont pas un délai ; c’est une RÈGLE D’OPUS (réponse du 05/11) ==='
\echo '    attendu : delai rangé vide ; devis_delai, nature regle_opus, rang 5 ; puis « — »'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
update public.devis set delai_execution = ' ' || chr(160) || ' ', generation = 3 where id = :D1;
select delai_execution is null as range_vide_attendu_t from public.devis where id = :D1;
execute motifs(:D1, 'devis_delai');
select rang = 5 and nature = 'regle_opus' and ligne_id is null as rang_nature_attendu_t
  from public.motifs_refus_remise(:D1) where cle = 'devis_delai';
update public.devis set delai_execution = 'Deux semaines', generation = 4 where id = :D1;
execute motifs(:D1, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 6. devis_validite — allumé (validité retirée), puis éteint (15 jours) ==='
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
update public.devis set validite_jours = null, generation = 3 where id = :D1;
execute motifs(:D1, 'devis_validite');
update public.devis set validite_jours = 15, generation = 4 where id = :D1;
execute motifs(:D1, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 7. devis_acompte_nature — en %, puis en euros ; pas d’acompte, pas de motif ==='
\echo '    attendu : « — » (aucun acompte) ; devis_acompte_nature (30 %) ; « — » (acompte) ;'
\echo '              devis_acompte_nature (100,00 €) ; « — » (arrhes) ; « — » (acompte retiré, nature retirée)'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
execute motifs(:D1, '—');
update public.devis set acompte_centiemes = 3000, generation = 3 where id = :D1;
execute motifs(:D1, 'devis_acompte_nature');
update public.devis set acompte_nature = 'acompte', generation = 4 where id = :D1;
execute motifs(:D1, '—');
update public.devis set acompte_centiemes = null, acompte_centimes = 10000, acompte_nature = null, generation = 5 where id = :D1;
execute motifs(:D1, 'devis_acompte_nature');
update public.devis set acompte_nature = 'arrhes', generation = 6 where id = :D1;
execute motifs(:D1, '—');
update public.devis set acompte_centimes = null, acompte_nature = null, generation = 7 where id = :D1;
execute motifs(:D1, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 8. devis_acompte_ramene — EN EUROS seulement : la demande dépasse l’acompte appliqué ==='
\echo '    deux postes de 500,00 € en franchise : TTC 100 000 c'
\echo '    attendu : 2 000,00 € → ramené (acompte appliqué 100 000) ; 1 000,00 € (= TTC) → « — » ;'
\echo '              un poste retiré (TTC 50 000) → ramené SANS toucher à l’acompte ; 100 % → « — » ;'
\echo '              2 000,00 € sans nature → devis_acompte_nature PUIS devis_acompte_ramene (ordre des rangs)'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 50000, 0, false, 2);
execute chiffree(:L2, :D1, 2000, 'poste', 50000, 0, false, 3);
update public.devis set acompte_centimes = 200000, acompte_nature = 'acompte', generation = 4 where id = :D1;
select acompte_ttc_centimes = 100000 as acompte_applique_attendu_t from public.devis where id = :D1;
execute motifs(:D1, 'devis_acompte_ramene');
update public.devis set acompte_centimes = 100000, generation = 5 where id = :D1;
execute motifs(:D1, '—');
delete from public.devis_lignes where id = :L2;
select acompte_ttc_centimes = 50000 as acompte_ramene_par_le_retrait_attendu_t from public.devis where id = :D1;
execute motifs(:D1, 'devis_acompte_ramene');
update public.devis set acompte_centimes = null, acompte_centiemes = 10000, generation = 6 where id = :D1;
execute motifs(:D1, '—');
update public.devis set acompte_centiemes = null, acompte_centimes = 200000, acompte_nature = null, generation = 7 where id = :D1;
execute motifs(:D1, 'devis_acompte_nature,devis_acompte_ramene');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 9. devis_reduction_ramenee — EN EUROS seulement : la demande dépasse la réduction appliquée ==='
\echo '    un poste de 1 000,00 € HT : brut 100 000 c'
\echo '    attendu : 2 000,00 € → ramenée (appliquée 100 000) ; 1 000,00 € (= brut) → « — » ; 500,00 € → « — » ;'
\echo '              100 % → « — » ; sans aucun poste, 0,01 € → devis_lignes PUIS devis_reduction_ramenee'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
update public.devis set remise_centimes = 200000, generation = 3 where id = :D1;
select remise_ht_centimes = 100000 as reduction_appliquee_attendu_t from public.devis where id = :D1;
execute motifs(:D1, 'devis_reduction_ramenee');
update public.devis set remise_centimes = 100000, generation = 4 where id = :D1;
execute motifs(:D1, '—');
update public.devis set remise_centimes = 50000, generation = 5 where id = :D1;
execute motifs(:D1, '—');
update public.devis set remise_centimes = null, remise_centiemes = 10000, generation = 6 where id = :D1;
select remise_ht_centimes = 100000 as cent_pour_cent_attendu_t from public.devis where id = :D1;
execute motifs(:D1, '—');
delete from public.devis_lignes where id = :L1;
update public.devis set remise_centiemes = null, remise_centimes = 1, generation = 7 where id = :D1;
execute motifs(:D1, 'devis_lignes,devis_reduction_ramenee');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 10. LES NEUF MOTIFS À LA FOIS — rangs 1 à 9, natures, phrases au CARACTÈRE près, aucune ligne en trop ==='
\echo '    un devis NEUF de A (franchise, entreprise complète) : aucun client, aucun lieu, ni délai, ni validité ;'
\echo '    une OPTION à 20 % (fautive en franchise, et pas un poste) ; un acompte de 50,00 € sans nature'
\echo '    (ramené : le TTC vaut 0) ; une réduction de 1,00 € (ramenée : le brut vaut 0)'
\echo '    attendu : rangs 1,2,3,4,5,6,7,8,9 ; chaque phrase = celle du contrat (annexe B.2 du cahier 2b) ;'
\echo '              ligne_id posée sur le seul motif 3 ; aucune phrase ne porte de chiffre, d’euro,'
\echo '              d’apostrophe droite, d’espace insécable ni de barre oblique inverse'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, acompte_centimes, remise_centimes, generation)
values (:D1, :A, 5000, 100, 1);
execute chiffree(:L1, :D1, 1000, 'option', 10000, 2000, false, 2);
execute motifs(:D1, 'devis_client,devis_lignes,devis_taux_regime,devis_lieu,devis_delai,devis_validite,devis_acompte_nature,devis_acompte_ramene,devis_reduction_ramenee');
with m as (select * from public.motifs_refus_remise(:D1) with ordinality as x(rang, cle, phrase, nature, ligne_id, o)),
     contrat(rang, cle, nature, phrase) as (values
  (1, 'devis_client',            'loi',        'Ce devis ne s’adresse encore à personne : choisissez le client.'),
  (2, 'devis_lignes',            'loi',        'Ce devis ne chiffre encore aucun travail : ajoutez au moins un poste.'),
  (3, 'devis_taux_regime',       'loi',        'Le taux de TVA de cette ligne ne correspond pas à votre régime de TVA : corrigez-la.'),
  (4, 'devis_lieu',              'prudence',   'Écrivez le lieu des travaux. La loi le demande pour un dépannage, une réparation ou un entretien, et Opus ne sait pas encore si ce devis en est un.'),
  (5, 'devis_delai',             'regle_opus', 'Écrivez le délai d’exécution des travaux. La loi le demande pour un particulier et pour un devis signé chez le client ; Opus le demande pour tous vos devis.'),
  (6, 'devis_validite',          'prudence',   'Choisissez la durée de validité du devis. La loi la demande pour un dépannage, une réparation ou un entretien, et Opus ne sait pas encore si ce devis en est un.'),
  (7, 'devis_acompte_nature',    'prudence',   'Dites si la somme demandée d’avance est un acompte ou des arrhes : leurs effets ne sont pas les mêmes, et Opus ne choisit pas à votre place.'),
  (8, 'devis_acompte_ramene',    'prudence',   'L’acompte en euros dépasse le total du devis : Opus l’a ramené. Corrigez-le pour que le devis dise ce que vous voulez.'),
  (9, 'devis_reduction_ramenee', 'prudence',   'La réduction en euros dépasse le total du devis : Opus l’a ramenée. Corrigez-la pour que le devis dise ce que vous voulez.'))
select (select count(*) from m) as lignes_attendu_9,
       (select string_agg(rang::text, ',' order by o) from m) = '1,2,3,4,5,6,7,8,9' as rangs_dans_l_ordre_attendu_t,
       (select count(*) from m join contrat c using (rang)
         where m.cle = c.cle and m.nature = c.nature and m.phrase = c.phrase) as conformes_au_contrat_attendu_9,
       (select bool_and((m.ligne_id is not null) = (m.cle = 'devis_taux_regime')) from m) as ligne_id_seulement_au_3_attendu_t,
       (select ligne_id = :L1 from m where cle = 'devis_taux_regime') as la_bonne_ligne_attendu_t,
       (select bool_and(phrase !~ '[0-9€]' and position('''' in phrase) = 0
                        and position(chr(160) in phrase) = 0 and position(chr(8239) in phrase) = 0
                        and position(chr(92) in phrase) = 0) from m) as phrases_propres_attendu_t,
       (select pg_typeof(rang)::text from m limit 1) = 'smallint' as rang_smallint_attendu_t;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 11 a. LES MOTIFS DE L’ENTREPRISE — rang 100 + position, clé et phrase = les deux moitiés coupées au PREMIER « : » ==='
\echo '    A sans fiche « Mon entreprise » ni frais : ses 11 motifs, dans l’ordre d’emetteur_incomplet(A),'
\echo '    rangs 101 à 111 ; frais_deplacement en regle_opus, les autres en loi ; aucun ligne_id ;'
\echo '    et « cle: phrase » recomposée = l’élément d’emetteur_incomplet, au caractère près'
-- ==========================================================================
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 2000, false, 2);
with m as (select * from public.motifs_refus_remise(:D1) with ordinality as x(rang, cle, phrase, nature, ligne_id, o)
            where x.rang >= 100),
     e as (select * from unnest(public.emetteur_incomplet(:A)) with ordinality as y(motif, pos))
select (select count(*) from m) as motifs_entreprise_attendu_11,
       (select count(*) from m join e on e.pos = m.rang - 100
         where m.cle || ': ' || m.phrase = e.motif) as recomposes_attendu_11,
       (select string_agg(rang::text, ',' order by o) from m)
         = '101,102,103,104,105,106,107,108,109,110,111' as rangs_attendu_t,
       (select string_agg(cle || '=' || nature, ',' order by o) from m)
         = 'registre=loi,capital=loi,conso_telephone=loi,conso_email=loi,regime_tva=loi,conso_mediateur=loi,'
           'conso_garantie_legale=loi,conso_modalites_paiement=loi,conso_modalites_execution=loi,'
           'conso_reclamations=loi,frais_deplacement=regle_opus' as cles_natures_attendu_t,
       (select count(*) filter (where ligne_id is not null) from m) as ligne_id_attendu_0,
       (select count(*) filter (where phrase ~ '^\s' or phrase = '') from m) as phrases_mal_coupees_attendu_0;
-- Et les motifs du DEVIS viennent AVANT : ici il n'y en a aucun.
select count(*) filter (where rang < 100) as motifs_du_devis_attendu_0
  from public.motifs_refus_remise(:D1);
rollback;

\echo ''
\echo '=== 11 b. LES TROIS RÈGLES D’OPUS DE L’ENTREPRISE (réponse du 05/11) — entreprise lue il y a plus d’un an,'
\echo '          régime réel sans n° de TVA, aucun frais déclaré : nature regle_opus pour les trois ==='
\echo '    attendu : entreprise_ancienne=regle_opus,conso_tva_intra=regle_opus,frais_deplacement=regle_opus'
-- ==========================================================================
begin;
execute fiche_a('reel');
update public.entreprise_registre set verifie_le = now() - interval '400 days'
 where pro_id = :A and retiree_le is null;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 2000, false, 2);
select string_agg(cle || '=' || nature, ',' order by rang)
         = 'entreprise_ancienne=regle_opus,conso_tva_intra=regle_opus,frais_deplacement=regle_opus'
         as trois_regles_d_opus_attendu_t,
       string_agg(cle || '=' || nature, ',' order by rang) as lues
  from public.motifs_refus_remise(:D1);
rollback;

\echo ''
\echo '=== 11 c. LA PROFESSION RÉGLEMENTÉE — une PRUDENCE (Opus ne sait pas encore écrire titre, État et ordre) ==='
\echo '    A devient architecte (posé en superutilisateur) ; attendu : conso_profession_reglementee=prudence, seul'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
update public.professional_profiles set metiers = array['architecte'] where id = :A;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
select string_agg(cle || '=' || nature, ',' order by rang)
         = 'conso_profession_reglementee=prudence' as prudence_attendu_t,
       string_agg(cle || '=' || nature, ',' order by rang) as lues
  from public.motifs_refus_remise(:D1);
rollback;


-- ==========================================================================
\echo ''
\echo '=== 12. OP027 — LE MÊME CODE ET LE MÊME MESSAGE, D’OÙ QU’ON APPELLE (critique B1) ==='
\echo '    Chaque refus est le dernier ordre de sa transaction (ou suivi d’un rollback to savepoint, 12 f),'
\echo '    relevé aussitôt par :ERROR, LAST_ERROR_SQLSTATE et LAST_ERROR_MESSAGE, et JUGÉ après l’annulation.'
-- ==========================================================================

\echo ''
\echo '--- 12 a. A demande la liste du devis de B → OP027 (refus 1/11)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DB, :B, 1);
select count(*) as b_lit_son_devis_attendu_1 from public.devis where id = :DB;
select count(*) > 0 as b_a_sa_liste_attendu_t from public.motifs_refus_remise(:DB);
set local request.jwt.claim.sub = :A;
select * from public.motifs_refus_remise(:DB);
\set e12a_err :ERROR
\set e12a_code :LAST_ERROR_SQLSTATE
\set e12a_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 b. A, un identifiant inventé → OP027 (refus 2/11)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select * from public.motifs_refus_remise(:DI);
\set e12b_err :ERROR
\set e12b_code :LAST_ERROR_SQLSTATE
\set e12b_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 c. A, un identifiant vide → OP027 (refus 3/11)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select * from public.motifs_refus_remise(null);
\set e12c_err :ERROR
\set e12c_code :LAST_ERROR_SQLSTATE
\set e12c_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 d. P (particulier, sans fiche pro) demande la liste du devis de A → OP027 (refus 4/11)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
select count(*) > 0 as a_a_sa_liste_attendu_t from public.motifs_refus_remise(:D1);
set local request.jwt.claim.sub = :P;
select * from public.motifs_refus_remise(:D1);
\set e12d_err :ERROR
\set e12d_code :LAST_ERROR_SQLSTATE
\set e12d_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 e. P, un identifiant inventé → OP027 (refus 5/11)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :P;
select * from public.motifs_refus_remise(:DI);
\set e12e_err :ERROR
\set e12e_code :LAST_ERROR_SQLSTATE
\set e12e_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 f. DEPUIS UNE FONCTION security definer — comme la remise de 2c l’appellera. L’enveloppe est'
\echo '          créée ET retirée dans la même transaction (le rollback la retire : sinon l’essai 49, cas 27b,'
\echo '          compterait une definer de plus). Le devis de A passe (attendu t), puis, derrière deux'
\echo '          savepoints : le devis de B → OP027 (refus 6/11), un identifiant inventé → OP027 (refus 7/11)'
begin;
create function public.essai_remise_enveloppe(p uuid)
returns table (cle text)
language plpgsql
security definer
set search_path = public
as $enveloppe$
begin
  return query select m.cle from public.motifs_refus_remise(p) m;
end;
$enveloppe$;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DB, :B, 1);
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
select count(*) > 0 as a_passe_par_l_enveloppe_attendu_t from public.essai_remise_enveloppe(:D1);
savepoint s1;
select * from public.essai_remise_enveloppe(:DB);
\set e12f1_err :ERROR
\set e12f1_code :LAST_ERROR_SQLSTATE
\set e12f1_msg :LAST_ERROR_MESSAGE
rollback to savepoint s1;
savepoint s2;
select * from public.essai_remise_enveloppe(:DI);
\set e12f2_err :ERROR
\set e12f2_code :LAST_ERROR_SQLSTATE
\set e12f2_msg :LAST_ERROR_MESSAGE
rollback to savepoint s2;
rollback;
select count(*) as enveloppe_retiree_attendu_0 from pg_proc where proname = 'essai_remise_enveloppe';

\echo '--- 12 g. PAR LA CLÉ DE SERVICE (bypassrls) — jeton de A : son devis passe (attendu t), le devis de B → OP027'
\echo '          (refus 8/11), un identifiant inventé → OP027 (refus 9/11) ; SANS jeton, le devis de A lui-même'
\echo '          → OP027 (refus 10/11) : la clé de service n’est l’entreprise de personne'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DB, :B, 1);
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
set local role service_role;
select count(*) > 0 as service_jeton_a_son_devis_attendu_t from public.motifs_refus_remise(:D1);
select * from public.motifs_refus_remise(:DB);
\set e12g1_err :ERROR
\set e12g1_code :LAST_ERROR_SQLSTATE
\set e12g1_msg :LAST_ERROR_MESSAGE
rollback;
begin;
set local role service_role;
set local request.jwt.claim.sub = :A;
select * from public.motifs_refus_remise(:DI);
\set e12g2_err :ERROR
\set e12g2_code :LAST_ERROR_SQLSTATE
\set e12g2_msg :LAST_ERROR_MESSAGE
rollback;
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
set local role service_role;
set local request.jwt.claim.sub = '';
select * from public.motifs_refus_remise(:D1);
\set e12g3_err :ERROR
\set e12g3_code :LAST_ERROR_SQLSTATE
\set e12g3_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 h. UN VISITEUR (anon) → « permission denied for function motifs_refus_remise » (refus 11/11)'
begin;
set local role anon;
select * from public.motifs_refus_remise(:DI);
\set e12h_err :ERROR
\set e12h_code :LAST_ERROR_SQLSTATE
\set e12h_msg :LAST_ERROR_MESSAGE
rollback;

\echo ''
\echo '--- 12 i. LE JUGEMENT : dix OP027 au MÊME message, et le refus du visiteur (attendu : t partout)'
select :'e12a_err'  = 'true' and :'e12a_code'  = 'OP027' and :'e12a_msg'  = :'MSG_OP027' as a_devis_de_b_attendu_t,
       :'e12b_err'  = 'true' and :'e12b_code'  = 'OP027' and :'e12b_msg'  = :'MSG_OP027' as b_invente_attendu_t,
       :'e12c_err'  = 'true' and :'e12c_code'  = 'OP027' and :'e12c_msg'  = :'MSG_OP027' as c_vide_attendu_t,
       :'e12d_err'  = 'true' and :'e12d_code'  = 'OP027' and :'e12d_msg'  = :'MSG_OP027' as d_particulier_attendu_t,
       :'e12e_err'  = 'true' and :'e12e_code'  = 'OP027' and :'e12e_msg'  = :'MSG_OP027' as e_particulier_invente_attendu_t;
select :'e12f1_err' = 'true' and :'e12f1_code' = 'OP027' and :'e12f1_msg' = :'MSG_OP027' as f_definer_devis_de_b_attendu_t,
       :'e12f2_err' = 'true' and :'e12f2_code' = 'OP027' and :'e12f2_msg' = :'MSG_OP027' as f_definer_invente_attendu_t,
       :'e12g1_err' = 'true' and :'e12g1_code' = 'OP027' and :'e12g1_msg' = :'MSG_OP027' as g_service_devis_de_b_attendu_t,
       :'e12g2_err' = 'true' and :'e12g2_code' = 'OP027' and :'e12g2_msg' = :'MSG_OP027' as g_service_invente_attendu_t,
       :'e12g3_err' = 'true' and :'e12g3_code' = 'OP027' and :'e12g3_msg' = :'MSG_OP027' as g_service_sans_jeton_attendu_t,
       :'e12h_err'  = 'true' and :'e12h_code'  = '42501'
         and :'e12h_msg' = 'permission denied for function motifs_refus_remise' as h_visiteur_attendu_t;


-- ==========================================================================
\echo ''
\echo '=== 13. D4-c — AUCUN MOTIF NE DÉPEND DE L’ORIGINE : trois devis identiques sauf leurs liens et la façon dont'
\echo '        ils ont été ouverts (manuelle ; demande + urgence ; urgence seule) rendent la MÊME liste ==='
\echo '    état 1 : une ligne fautive (option à 20 % en franchise), délai et validité vides, acompte de 30 % sans'
\echo '             nature ; puis P bloque A, toujours dans l’état 1 — la liste ne le voit pas (c’est la REMISE'
\echo '             de 2c qui refusera) ; état 2 : tout corrigé. attendu : non vide, non vide, vide, et X = Y = Z'
\echo '             à chaque fois (t ×3)'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
insert into public.devis (id, pro_id, client_id, quote_request_id, sos_request_id, source, objet,
                          lieu_adresse, lieu_code_postal, lieu_ville, acompte_centiemes, generation) values
 (:DX, :A, :C1, null, null, 'manuelle', 'Salle de bain', '4 rue de l''Essai', '13410', 'Lambesc', 3000, 1),
 (:DY, :A, :C1, :QA,  :SA,  'demande',  'Salle de bain', '4 rue de l''Essai', '13410', 'Lambesc', 3000, 1),
 (:DZ, :A, :C1, null, :SA,  'urgence',  'Salle de bain', '4 rue de l''Essai', '13410', 'Lambesc', 3000, 1);
select string_agg(source || ':' || (quote_request_id is not null) || ':' || (sos_request_id is not null), ',' order by id)
         = 'manuelle:false:false,demande:true:true,urgence:false:true' as origines_differentes_attendu_t
  from public.devis where id in (:DX, :DY, :DZ);
execute chiffree('f4930000-0000-4000-8000-0000000000a1', :DX, 1000, 'poste',  100000, 0,    false, 2);
execute chiffree('f4930000-0000-4000-8000-0000000000a2', :DX, 2000, 'option', 10000,  2000, false, 3);
execute chiffree('f4930000-0000-4000-8000-0000000000b1', :DY, 1000, 'poste',  100000, 0,    false, 2);
execute chiffree('f4930000-0000-4000-8000-0000000000b2', :DY, 2000, 'option', 10000,  2000, false, 3);
execute chiffree('f4930000-0000-4000-8000-0000000000c1', :DZ, 1000, 'poste',  100000, 0,    false, 2);
execute chiffree('f4930000-0000-4000-8000-0000000000c2', :DZ, 2000, 'option', 10000,  2000, false, 3);
\echo '-- état 1 (attendu : cles_attendu_t t, x_y_z_identiques_attendu_t t)'
execute trois_listes(:DX, :DY, :DZ, 'devis_taux_regime,devis_delai,devis_validite,devis_acompte_nature');
\echo '-- état 1, après que P a bloqué A (attendu : t, t — la liste ne voit pas le blocage)'
set local request.jwt.claim.sub = :P;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local request.jwt.claim.sub = :A;
execute trois_listes(:DX, :DY, :DZ, 'devis_taux_regime,devis_delai,devis_validite,devis_acompte_nature');
\echo '-- état 2, tout corrigé sur les trois devis (attendu : cles « — », t, t)'
update public.devis set delai_execution = 'Deux semaines', validite_jours = 30, acompte_nature = 'arrhes', generation = 4
 where id in (:DX, :DY, :DZ);
update public.devis_lignes set taux_tva_centiemes = 0, generation = 5 where type = 'option' and devis_id in (:DX, :DY, :DZ);
execute trois_listes(:DX, :DY, :DZ, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 14. LE CATALOGUE — la forme, les droits, ce que le corps lit et ce qu’il ne lit JAMAIS ==='
-- ==========================================================================
\echo '--- 14 a. une seule fonction de ce nom (aucune surcharge), sa signature et son type de retour (attendu : t partout)'
select (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where p.proname = 'motifs_refus_remise') = 1 as une_seule_attendu_t,
       pg_get_function_identity_arguments(p.oid) = 'p_devis uuid' as argument_attendu_t,
       pg_get_function_result(p.oid)
         = 'TABLE(rang smallint, cle text, phrase text, nature text, ligne_id uuid)' as retour_attendu_t,
       p.proretset as ensemble_attendu_t,
       not p.prosecdef as invoker_attendu_t,
       p.provolatile = 's' as stable_attendu_t,
       (select l.lanname from pg_language l where l.oid = p.prolang) = 'plpgsql' as plpgsql_attendu_t,
       p.proconfig = array['search_path=public'] as search_path_attendu_t,
       obj_description(p.oid, 'pg_proc') ~ 'Section 49\.9' as commentaire_attendu_t
  from pg_proc p
 where p.oid = 'public.motifs_refus_remise(uuid)'::regprocedure;

\echo '--- 14 b. les droits : ni PUBLIC, ni visiteur ; un compte connecté et la clé de service, oui (attendu : t | f | t | t)'
select p.proacl::text !~ '(^\{|,)=X' as pas_public_attendu_t,
       has_function_privilege('anon', p.oid, 'execute') as anon_attendu_f,
       has_function_privilege('authenticated', p.oid, 'execute') as connecte_attendu_t,
       has_function_privilege('service_role', p.oid, 'execute') as service_attendu_t
  from pg_proc p
 where p.oid = 'public.motifs_refus_remise(uuid)'::regprocedure;

\echo '--- 14 c. LE CORPS, commentaires et chaînes retirés : il ne nomme QUE devis, devis_lignes et emetteur (plus'
\echo '          est_mon_entreprise et emetteur_incomplet), et AUCUN des mots de l’origine ni des lectures entières'
\echo '          (D4-c, critique B5) — attendu : la liste exacte, puis 0 | 0 | 0 | t'
with corps as (
  select regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(p.prosrc, '"([a-z_][a-z0-9_]*)"', '\1', 'g'),
             '/\*.*?\*/', ' ', 'g'),
           '--[^\n]*', '', 'g'),
         '''(?:[^'']|'''')*''', '''''', 'g') as src,
         p.prosrc as brut
    from pg_proc p where p.oid = 'public.motifs_refus_remise(uuid)'::regprocedure
)
select (select string_agg(distinct x[1], ',' order by x[1])
          from regexp_matches(src, 'public\s*\.\s*([a-z_][a-z0-9_]*)', 'g') as x)
         = 'devis,devis_lignes,emetteur,emetteur_incomplet,est_mon_entreprise' as nomme_exactement_attendu_t,
       (select count(*) from regexp_matches(src,
          '\m(quote_request_id|sos_request_id|source|quote_requests|sos_requests|callback_requests|demandes|demande_reponses|peut_faire_un_devis|to_jsonb|row_to_json|jsonb_populate_record|hstore|devis_tva|tarifs_pro|users|professional_profiles|preuves_tva|entreprise_registre)\M',
          'gi')) as mots_interdits_attendu_0,
       (select count(*) from regexp_matches(src, '(%\s*rowtype|select\s+\*|\.\s*\*)', 'gi')) as lectures_entieres_attendu_0,
       (select count(*) from regexp_matches(brut, '''(qr|visite|dossier)''', 'gi')) as mots_d_origine_attendu_0,
       position(chr(92) in brut) = 0 and position(chr(160) in brut) = 0 and position(chr(8239) in brut) = 0
         as aucune_sequence_ni_insecable_attendu_t
  from corps;

\echo '--- 14 d. la base ne l’enregistre comme dépendante d’AUCUNE table (plpgsql, pas un corps SQL standard : attendu 0)'
select count(*) as dependances_attendu_0
  from pg_depend d
 where d.classid = 'pg_proc'::regclass
   and d.objid = 'public.motifs_refus_remise(uuid)'::regprocedure
   and d.refclassid = 'pg_class'::regclass;

\echo '--- 14 e. les deux listes security definer NE BOUGENT PAS (essai 49, cas 27b et 27c ; essai 50, cas 13i) :'
\echo '          31 ouvertes, 32 fermées, et motifs_refus_remise dans aucune (attendu : 31 | 32 | 0)'
select count(*) filter (where has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
         as definer_ouvertes_attendu_31,
       count(*) filter (where not (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute')))
         as definer_fermees_attendu_32,
       count(*) filter (where p.proname = 'motifs_refus_remise') as elle_n_y_est_pas_attendu_0
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname not in ('pg_catalog', 'information_schema') and n.nspname !~ '^pg_' and p.prosecdef;

\set VERBOSITY default
\set SHOW_CONTEXT errors
