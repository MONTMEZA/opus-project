-- ==========================================================================
--  ESSAIS DE LA SECTION 49.9 — « Ce qu'il manque pour remettre ce devis »
--  (lot 2b, étape 2b-1, 05/11/2026) : `motifs_refus_remise(p_devis)` — et
--  ce que l'étape 2b-2 (09/11/2026) y a ajouté : « à quel titre », le
--  chantier neuf et sa date (49.4 ter)
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
--  TREIZE CAS ATTENDENT UNE ERREUR, et c'est le but : un essai de sécurité
--  qui ne montre aucun refus n'éprouve rien. Joué comme ci-dessus sur une
--  base neuve, ce fichier écrit EXACTEMENT 13 lignes `psql:… ERROR`
--  (`… 2>&1 | grep -c '^psql:.*ERROR:'` → 13). Un autre compte est un ÉCHEC,
--  même quand toutes les colonnes valent `t`. Les onze de 2b-1, tous au cas
--  12, puis les deux de 2b-2 (cas 15 g et 18 b) :
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
--    12  15 g   une réponse « à quel titre » inconnue        → devis_pour_qui_check (23514)
--    13  18 b   le téléphone écrit la date du « Oui »         → « permission denied for table devis »
--
--  ET CHACUN EST JUGÉ EN SQL, pas à l'œil (la leçon de RBM-1, lot 2a) :
--  `:ERROR`, `LAST_ERROR_SQLSTATE` et `LAST_ERROR_MESSAGE` sont relevés
--  juste après l'ordre, puis comparés, la transaction annulée, au code et au
--  message attendus — le MÊME message pour les dix OP027. Un refus qui
--  manque laisse un `f`, pas seulement une ligne de moins. Les trente-neuf
--  variables (trente-trois de 2b-1, six de 2b-2) sont DÉCLARÉES D'AVANCE (« jamais relevé ») : un cas retiré
--  entier laisse un `f` à sa place, au lieu d'une erreur de syntaxe qui
--  remplacerait la sienne dans le compte (constat T01 de la vérification du
--  lot 2b-1 : le cas 12 h retiré, le fichier écrivait encore 11 erreurs).
--
--  ET IL JUGE EXACTEMENT 187 VALEURS, ANNONCÉES ICI (`VALEURS_ANNONCEES`),
--  puis une 188e qui les compte (cas 19) : chaque valeur jugée passe par
--  `pg_temp.v(…)`, qui avance une séquence temporaire — qu'aucun `rollback`
--  n'annule. Une valeur qui ne s'est pas calculée (un ordre en erreur, une
--  transaction déjà annulée, un cas retiré) manque au compte, et le cas 15
--  vaut `f`. Joué comme ci-dessus, le juge relit 188 colonnes `…_attendu_`
--  et AUCUN écart ; une autre somme est un ÉCHEC.
--
--  CE QUE 2b-2 A AJOUTÉ (09/11/2026) : `devis_complet` donne sa réponse « à
--  quel titre » POUR SON CLIENT (sinon `devis_pour_qui` sortirait partout) ;
--  le contrat du cas 10 passe à DOUZE clés sur neuf rangs ; le cas 13 (D4-c)
--  part sans réponse et la donne à l'état 2 ; le cas 14 c interdit aussi
--  `clients` et `chantier_neuf_conso` dans le corps ; et quatre cas
--  nouveaux — 15 : `devis_pour_qui`, la réponse liée à SON client, la base
--  qui ne mute rien, l'exclusion avec `devis_client` ; 16 : le filtre et les
--  natures de l'entreprise selon la réponse valable, les rangs À TROUS ;
--  17 : `devis_taux_reduit_neuf`, une clé par ligne, les deux clés du réel
--  qui ALTERNENT ; 18 : la date du « Oui » au chantier neuf. Cinquante-sept
--  valeurs de plus (130 → 187), deux refus de plus (11 → 13). Le compte,
--  toujours en dernier, est devenu le cas 19.
--
--  CE QUE LA RELECTURE DE 2b-1 A CHANGÉ (05/11/2026, au soir) : le motif de
--  rang 3 est coupé en DEUX clés (TXT-1) — `devis_taux_franchise` (la loi)
--  et `devis_taux_sans_tva` (une prudence : l'autoliquidation le permet) — ;
--  `devis_client` et `devis_lignes` sont des RÈGLES D'OPUS (décision D-C du
--  propriétaire, TXT-4) ; `regime_tva` est une prudence (TXT-7) ; les
--  phrases du lieu, du délai, de la validité et de la réduction disent le
--  droit plus exactement (TXT-5, TXT-6, BASE-3) ; et le cas 5 FIGE qu'un
--  délai fait d'un seul U+3000 passe pour écrit (BASE-1 : la liste vérifie
--  une présence, pas un sens). Quatre valeurs de plus (126 → 130).
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
\set C2 '''c4900000-0000-4000-8000-0000000000c2'''
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

-- LE NOMBRE DE VALEURS JUGÉES, ANNONCÉ (voir l'en-tête) : 187. Toute valeur
-- jugée passe par `pg_temp.v(…)`, qui avance une SÉQUENCE temporaire — une
-- séquence n'est pas annulée par `rollback` : une valeur calculée dans un
-- cas annulé compte, une valeur qui n'a pas pu se calculer (un ordre en
-- erreur, une transaction déjà annulée, une variable indéfinie) ne compte
-- pas. Le jugement final (cas 19) compare le compte à l’annonce.
\set VALEURS_ANNONCEES 187
create temporary sequence essai_valeurs;
-- `security definer` : la séquence appartient à `postgres`, et la valeur se
-- calcule aussi sous `authenticated`, `service_role` et `anon`. Elle vit dans
-- `pg_temp` : le relevé des fonctions `security definer` du cas 14 e (et de
-- l'essai 49, cas 27 b) ne regarde pas les schémas `pg_*`.
create function pg_temp.v(x anyelement) returns anyelement
language plpgsql volatile security definer as $v$
begin
  perform nextval('pg_temp.essai_valeurs');
  return x;
end;
$v$;
create function pg_temp.valeurs_jugees() returns bigint
language sql volatile as $c$
  select case when is_called then last_value else 0 end from pg_temp.essai_valeurs;
$c$;

-- LES TREIZE REFUS ATTENDUS, DÉCLARÉS D'AVANCE : un cas retiré ne rend pas son
-- jugement illisible (une variable indéfinie ferait échouer l'ordre — une
-- AUTRE erreur à la place de la sienne, et six valeurs de moins), il laisse
-- un `f` à sa place.
\set e12a_err 'jamais relevé'
\set e12a_code 'jamais relevé'
\set e12a_msg 'jamais relevé'
\set e12b_err 'jamais relevé'
\set e12b_code 'jamais relevé'
\set e12b_msg 'jamais relevé'
\set e12c_err 'jamais relevé'
\set e12c_code 'jamais relevé'
\set e12c_msg 'jamais relevé'
\set e12d_err 'jamais relevé'
\set e12d_code 'jamais relevé'
\set e12d_msg 'jamais relevé'
\set e12e_err 'jamais relevé'
\set e12e_code 'jamais relevé'
\set e12e_msg 'jamais relevé'
\set e12f1_err 'jamais relevé'
\set e12f1_code 'jamais relevé'
\set e12f1_msg 'jamais relevé'
\set e12f2_err 'jamais relevé'
\set e12f2_code 'jamais relevé'
\set e12f2_msg 'jamais relevé'
\set e12g1_err 'jamais relevé'
\set e12g1_code 'jamais relevé'
\set e12g1_msg 'jamais relevé'
\set e12g2_err 'jamais relevé'
\set e12g2_code 'jamais relevé'
\set e12g2_msg 'jamais relevé'
\set e12g3_err 'jamais relevé'
\set e12g3_code 'jamais relevé'
\set e12g3_msg 'jamais relevé'
\set e12h_err 'jamais relevé'
\set e12h_code 'jamais relevé'
\set e12h_msg 'jamais relevé'
\set e15g_err 'jamais relevé'
\set e15g_code 'jamais relevé'
\set e15g_msg 'jamais relevé'
\set e18b_err 'jamais relevé'
\set e18b_code 'jamais relevé'
\set e18b_msg 'jamais relevé'

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

-- UN DEVIS DE A OÙ RIEN NE MANQUE (horloge 1) : client, lieu, délai, validité
-- — et, depuis 2b-2, la réponse « à quel titre » (à titre privé), DONNÉE
-- POUR SON CLIENT (`pour_qui_client = client_id`) : sans elle, le motif
-- `devis_pour_qui` sortirait, et le cas 0 tomberait.
prepare devis_complet(uuid) as
  insert into public.devis (id, pro_id, client_id, objet, lieu_adresse, lieu_code_postal, lieu_ville,
                            delai_execution, validite_jours, pour_qui, pour_qui_client, generation)
  values ($1, :A, :C1, 'Salle de bain', '4 rue de l''Essai', '13410', 'Lambesc',
          'Dans les 30 jours suivant la signature', 30, 'consommateur', :C1, 1);
-- UNE SECONDE FICHE DU CARNET DE A (une entreprise), posée DANS les cas 2b-2
-- qui en ont besoin, en superutilisateur, et annulée avec eux.
prepare client_c2 as
  insert into public.clients (id, pro_id, type, nom, ville)
  values (:C2, :A, 'entreprise', 'Entreprise essai A', 'Lambesc');
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
         pg_temp.v(coalesce(string_agg(m.cle, ',' order by m.o), '—') = $2) as motifs_attendu_t
    from public.motifs_refus_remise($1) with ordinality as m(rang, cle, phrase, nature, ligne_id, o);
-- LA LISTE ENTIÈRE, « rang:clé=nature » dans l'ordre de sortie (2b-2, cas 16) :
-- le rang, la clé ET la nature, ensemble — un trou dans les rangs se lit.
prepare liste(uuid, text) as
  select coalesce(string_agg(m.rang || ':' || m.cle || '=' || m.nature, ',' order by m.o), '—') as lue,
         pg_temp.v(coalesce(string_agg(m.rang || ':' || m.cle || '=' || m.nature, ',' order by m.o), '—') = $2)
           as liste_attendu_t
    from public.motifs_refus_remise($1) with ordinality as m(rang, cle, phrase, nature, ligne_id, o);
-- Les lignes désignées par les motifs de LIGNE (le rang 3 : ses deux clés,
-- `devis_taux_franchise` et `devis_taux_sans_tva`), dans l'ordre de sortie.
-- Toute la liste est lue (pas seulement les motifs de ligne) : un motif qui
-- n'est pas de ligne et qui porterait une ligne serait vu.
prepare fautives(uuid, text) as
  select pg_temp.v(coalesce(string_agg(m.ligne_id::text, ',' order by m.o)
                    filter (where m.rang = 3), '—') = $2) as lignes_attendu_t,
         pg_temp.v(count(*) filter (where m.rang = 3 and m.ligne_id is null)) as sans_ligne_attendu_0,
         pg_temp.v(count(*) filter (where m.rang <> 3 and m.ligne_id is not null)) as ligne_en_trop_attendu_0
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
         pg_temp.v((select cles from sig where n = 1) = $4) as cles_attendu_t,
         pg_temp.v(count(distinct s) = 1 and count(*) = 3) as x_y_z_identiques_attendu_t
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
select pg_temp.v((select count(*) from public.devis where id = :D1)) as devis_attendu_1,
       pg_temp.v((select count(*) from public.devis_lignes where devis_id = :D1)) as lignes_attendu_1,
       pg_temp.v((select count(*) from public.motifs_refus_remise(:D1))) as lignes_rendues_attendu_0;
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
\echo '=== 3 a. devis_taux_franchise (LA LOI) en FRANCHISE — UNE ligne par ligne fautive (poste ET option, offerte comprise), dans l’ordre « ordre, id » ==='
\echo '    lignes : zone (sans taux) ; L1 poste 0 % (juste) ; L2 poste 20 % ordre 2000 ; L3 option 10 % ordre 3000 ;'
\echo '             L4 poste OFFERT 5,5 % ordre 4000 ; L5 poste 20 % ordre 1500 (écrit APRÈS, rangé AVANT) ;'
\echo '             L6 option 20 % ordre 4000 (même ordre que L4 : L4 < L6 par identifiant)'
\echo '    attendu : cinq devis_taux_franchise désignant L5, L2, L3, L4, L6, nature loi et la phrase du contrat ;'
\echo '              puis chaque ligne remise à 0 → « — »'
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
execute motifs(:D1, 'devis_taux_franchise,devis_taux_franchise,devis_taux_franchise,devis_taux_franchise,devis_taux_franchise');
execute fautives(:D1, concat_ws(',', :L5::text, :L2::text, :L3::text, :L4::text, :L6::text));
select pg_temp.v(count(*) = 5 and bool_and(nature = 'loi'
         and phrase = 'En franchise de TVA, aucune ligne ne porte de TVA : corrigez le taux de cette ligne.'))
         as franchise_la_loi_attendu_t
  from public.motifs_refus_remise(:D1) where rang = 3;
update public.devis_lignes set taux_tva_centiemes = 0, generation = 9  where id = :L2;
update public.devis_lignes set taux_tva_centiemes = 0, generation = 10 where id = :L3;
update public.devis_lignes set taux_tva_centiemes = 0, generation = 11 where id = :L4;
update public.devis_lignes set taux_tva_centiemes = 0, generation = 12 where id = :L5;
execute fautives(:D1, :L6::text);
update public.devis_lignes set taux_tva_centiemes = 0, generation = 13 where id = :L6;
execute motifs(:D1, '—');
rollback;

\echo ''
\echo '=== 3 b. devis_taux_sans_tva (UNE PRUDENCE) au RÉEL — une ligne chiffrée à 0 (poste offert, option) est fautive ; 20 % est juste ==='
\echo '    (la loi permet une ligne sans TVA dans quelques cas — la sous-traitance en autoliquidation, CGI 283 2 nonies —'
\echo '     qu’Opus ne sait pas encore imprimer : ce n’est pas « la loi », c’est une prudence)'
\echo '    attendu : devis_taux_sans_tva ×2 (L2, L3), nature prudence et la phrase du contrat, puis conso_tva_intra de'
\echo '              l’entreprise (A n’a aucun n° de TVA) ;'
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
execute motifs(:D1, 'devis_taux_sans_tva,devis_taux_sans_tva,conso_tva_intra');
execute fautives(:D1, concat_ws(',', :L2::text, :L3::text));
select pg_temp.v(count(*) = 2 and bool_and(nature = 'prudence'
         and phrase = 'Au régime réel, une ligne sans TVA n’est possible que dans quelques cas, comme la sous-traitance en autoliquidation, qu’Opus ne sait pas encore imprimer : corrigez le taux de cette ligne.'))
         as reel_sans_tva_prudence_attendu_t
  from public.motifs_refus_remise(:D1) where rang = 3;
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
select pg_temp.v(count(*) filter (where rang = 3)) as taux_regime_sans_fiche_attendu_0,
       pg_temp.v(count(*) filter (where cle = 'regime_tva')) as regime_tva_attendu_1
  from public.motifs_refus_remise(:D1);
reset role;
execute fiche_a(null);
set local role authenticated;
select pg_temp.v(count(*) filter (where rang = 3)) as taux_regime_fiche_sans_regime_attendu_0,
       pg_temp.v(count(*) filter (where cle = 'regime_tva')) as regime_tva_attendu_1
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
select pg_temp.v(lieu_adresse is null and lieu_code_postal is null and lieu_ville is null) as ranges_vides_attendu_t
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
\echo '    attendu : delai rangé vide ; devis_delai, nature regle_opus, rang 5 ; puis « — » ;'
\echo '    puis un délai fait d’un SEUL U+3000 (espace idéographique, HORS de la classe de blancs du projet) : rangé tel'
\echo '    quel, et la liste ne dit PAS devis_delai — elle vérifie une présence, pas un sens (relecture de 2b-1, BASE-1).'
\echo '    Ce cas FIGE le comportement d’aujourd’hui : il changera, avec lui, le jour où la classe sera élargie dans'
\echo '    toutes ses copies (lot de consolidation) ; c’est 2c qui refusera à l’impression un délai sans lettre ni chiffre.'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
update public.devis set delai_execution = ' ' || chr(160) || ' ', generation = 3 where id = :D1;
select pg_temp.v(delai_execution is null) as range_vide_attendu_t from public.devis where id = :D1;
execute motifs(:D1, 'devis_delai');
select pg_temp.v(rang = 5 and nature = 'regle_opus' and ligne_id is null) as rang_nature_attendu_t
  from public.motifs_refus_remise(:D1) where cle = 'devis_delai';
update public.devis set delai_execution = 'Deux semaines', generation = 4 where id = :D1;
execute motifs(:D1, '—');
update public.devis set delai_execution = chr(12288), generation = 5 where id = :D1;
select pg_temp.v(delai_execution = chr(12288)) as u3000_range_tel_quel_attendu_t from public.devis where id = :D1;
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
select pg_temp.v(acompte_ttc_centimes = 100000) as acompte_applique_attendu_t from public.devis where id = :D1;
execute motifs(:D1, 'devis_acompte_ramene');
update public.devis set acompte_centimes = 100000, generation = 5 where id = :D1;
execute motifs(:D1, '—');
delete from public.devis_lignes where id = :L2;
select pg_temp.v(acompte_ttc_centimes = 50000) as acompte_ramene_par_le_retrait_attendu_t from public.devis where id = :D1;
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
select pg_temp.v(remise_ht_centimes = 100000) as reduction_appliquee_attendu_t from public.devis where id = :D1;
execute motifs(:D1, 'devis_reduction_ramenee');
update public.devis set remise_centimes = 100000, generation = 4 where id = :D1;
execute motifs(:D1, '—');
update public.devis set remise_centimes = 50000, generation = 5 where id = :D1;
execute motifs(:D1, '—');
update public.devis set remise_centimes = null, remise_centiemes = 10000, generation = 6 where id = :D1;
select pg_temp.v(remise_ht_centimes = 100000) as cent_pour_cent_attendu_t from public.devis where id = :D1;
execute motifs(:D1, '—');
delete from public.devis_lignes where id = :L1;
update public.devis set remise_centiemes = null, remise_centimes = 1, generation = 7 where id = :D1;
execute motifs(:D1, 'devis_lignes,devis_reduction_ramenee');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 10. LES NEUF RANGS À LA FOIS — rangs 1 à 9, natures, phrases au CARACTÈRE près, aucune ligne en trop ==='
\echo '    un devis NEUF de A (franchise, entreprise complète) : aucun client, aucun lieu, ni délai, ni validité ;'
\echo '    une OPTION à 20 % (fautive en franchise, et pas un poste) ; un acompte de 50,00 € sans nature'
\echo '    (ramené : le TTC vaut 0) ; une réduction de 1,00 € (ramenée : le brut vaut 0)'
\echo '    attendu : rangs 1,2,3,4,5,6,7,8,9 (le rang 3 sous sa clé de franchise) ; chaque phrase = celle du contrat'
\echo '              (annexe B.2 du cahier 2b, revue le 05/11 au soir, plus les deux clés de 2b-2 : DOUZE clés sur neuf rangs) ;'
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
execute motifs(:D1, 'devis_client,devis_lignes,devis_taux_franchise,devis_lieu,devis_delai,devis_validite,devis_acompte_nature,devis_acompte_ramene,devis_reduction_ramenee');
with m as (select * from public.motifs_refus_remise(:D1) with ordinality as x(rang, cle, phrase, nature, ligne_id, o)),
     contrat(rang, cle, nature, phrase) as (values
  (1, 'devis_client',            'regle_opus', 'Ce devis ne s’adresse encore à personne : choisissez le client. La loi demande son nom pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus le demande pour tous vos devis.'),
  (1, 'devis_pour_qui',          'regle_opus', 'Dites à quel titre ce client commande : selon la réponse, la loi ne demande pas les mêmes mentions sur le devis. Opus le demande pour tous vos devis.'),
  (2, 'devis_lignes',            'regle_opus', 'Ce devis ne chiffre encore aucun travail : ajoutez au moins un poste. La loi demande de décrire les travaux et leur prix pour un devis à un particulier ; Opus le demande pour tous vos devis.'),
  (3, 'devis_taux_franchise',    'loi',        'En franchise de TVA, aucune ligne ne porte de TVA : corrigez le taux de cette ligne.'),
  (3, 'devis_taux_sans_tva',     'prudence',   'Au régime réel, une ligne sans TVA n’est possible que dans quelques cas, comme la sous-traitance en autoliquidation, qu’Opus ne sait pas encore imprimer : corrigez le taux de cette ligne.'),
  (3, 'devis_taux_reduit_neuf',  'prudence',   'Mettez cette ligne au taux normal, ou changez votre réponse dans « Le chantier » : vous avez répondu que ces travaux font partie d’un chantier qui crée un bâtiment neuf.'),
  (4, 'devis_lieu',              'prudence',   'Écrivez le lieu des travaux. La loi le demande pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un.'),
  (5, 'devis_delai',             'regle_opus', 'Écrivez le délai d’exécution des travaux. La loi le demande pour la plupart des devis à un particulier ; Opus le demande pour tous vos devis.'),
  (6, 'devis_validite',          'prudence',   'Choisissez la durée de validité du devis. La loi la demande pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un.'),
  (7, 'devis_acompte_nature',    'prudence',   'Dites si la somme demandée d’avance est un acompte ou des arrhes : leurs effets ne sont pas les mêmes, et Opus ne choisit pas à votre place.'),
  (8, 'devis_acompte_ramene',    'prudence',   'L’acompte en euros dépasse le total du devis : Opus l’a ramené. Corrigez-le pour que le devis dise ce que vous voulez.'),
  (9, 'devis_reduction_ramenee', 'prudence',   'La réduction en euros dépasse le total des postes : Opus l’a ramenée. Corrigez-la pour que le devis dise ce que vous voulez.'))
select pg_temp.v((select count(*) from m)) as lignes_attendu_9,
       pg_temp.v((select string_agg(rang::text, ',' order by o) from m) = '1,2,3,4,5,6,7,8,9') as rangs_dans_l_ordre_attendu_t,
       pg_temp.v((select count(*) from m join contrat c using (rang)
         where m.cle = c.cle and m.nature = c.nature and m.phrase = c.phrase)) as conformes_au_contrat_attendu_9,
       pg_temp.v((select bool_and((m.ligne_id is not null) = (m.rang = 3)) from m)) as ligne_id_seulement_au_3_attendu_t,
       pg_temp.v((select ligne_id = :L1 from m where rang = 3)) as la_bonne_ligne_attendu_t,
       pg_temp.v((select bool_and(phrase !~ '[0-9€]' and position('''' in phrase) = 0
                        and position(chr(160) in phrase) = 0 and position(chr(8239) in phrase) = 0
                        and position(chr(92) in phrase) = 0) from m)) as phrases_propres_attendu_t,
       pg_temp.v((select pg_typeof(rang)::text from m limit 1) = 'smallint') as rang_smallint_attendu_t;
rollback;


-- ==========================================================================
\echo ''
\echo '=== 11 a. LES MOTIFS DE L’ENTREPRISE — rang 100 + position, clé et phrase = les deux moitiés coupées au PREMIER « : » ==='
\echo '    A sans fiche « Mon entreprise » ni frais : ses 11 motifs, dans l’ordre d’emetteur_incomplet(A),'
\echo '    rangs 101 à 111 ; frais_deplacement en regle_opus, regime_tva en prudence (relecture de 2b-1, TXT-7 : aucune'
\echo '    loi ne demande de déclarer son régime à Opus), les autres en loi — registre compris ; aucun ligne_id ;'
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
select pg_temp.v((select count(*) from m)) as motifs_entreprise_attendu_11,
       pg_temp.v((select count(*) from m join e on e.pos = m.rang - 100
         where m.cle || ': ' || m.phrase = e.motif)) as recomposes_attendu_11,
       pg_temp.v((select string_agg(rang::text, ',' order by o) from m)
         = '101,102,103,104,105,106,107,108,109,110,111') as rangs_attendu_t,
       pg_temp.v((select string_agg(cle || '=' || nature, ',' order by o) from m)
         = 'registre=loi,capital=loi,conso_telephone=loi,conso_email=loi,regime_tva=prudence,conso_mediateur=loi,'
           'conso_garantie_legale=loi,conso_modalites_paiement=loi,conso_modalites_execution=loi,'
           'conso_reclamations=loi,frais_deplacement=regle_opus') as cles_natures_attendu_t,
       pg_temp.v((select count(*) filter (where ligne_id is not null) from m)) as ligne_id_attendu_0,
       pg_temp.v((select count(*) filter (where phrase ~ '^\s' or phrase = '') from m)) as phrases_mal_coupees_attendu_0;
-- Et les motifs du DEVIS viennent AVANT : ici il n'y en a aucun.
select pg_temp.v(count(*) filter (where rang < 100)) as motifs_du_devis_attendu_0
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
select pg_temp.v(string_agg(cle || '=' || nature, ',' order by rang)
         = 'entreprise_ancienne=regle_opus,conso_tva_intra=regle_opus,frais_deplacement=regle_opus')
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
select pg_temp.v(string_agg(cle || '=' || nature, ',' order by rang)
         = 'conso_profession_reglementee=prudence') as prudence_attendu_t,
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
\echo '--- 12 a. A demande la liste du devis de B → OP027 (refus 1/13)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DB, :B, 1);
select pg_temp.v(count(*)) as b_lit_son_devis_attendu_1 from public.devis where id = :DB;
select pg_temp.v(count(*) > 0) as b_a_sa_liste_attendu_t from public.motifs_refus_remise(:DB);
set local request.jwt.claim.sub = :A;
select * from public.motifs_refus_remise(:DB);
\set e12a_err :ERROR
\set e12a_code :LAST_ERROR_SQLSTATE
\set e12a_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 b. A, un identifiant inventé → OP027 (refus 2/13)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select * from public.motifs_refus_remise(:DI);
\set e12b_err :ERROR
\set e12b_code :LAST_ERROR_SQLSTATE
\set e12b_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 c. A, un identifiant vide → OP027 (refus 3/13)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select * from public.motifs_refus_remise(null);
\set e12c_err :ERROR
\set e12c_code :LAST_ERROR_SQLSTATE
\set e12c_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 d. P (particulier, sans fiche pro) demande la liste du devis de A → OP027 (refus 4/13)'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
select pg_temp.v(count(*) > 0) as a_a_sa_liste_attendu_t from public.motifs_refus_remise(:D1);
set local request.jwt.claim.sub = :P;
select * from public.motifs_refus_remise(:D1);
\set e12d_err :ERROR
\set e12d_code :LAST_ERROR_SQLSTATE
\set e12d_msg :LAST_ERROR_MESSAGE
rollback;

\echo '--- 12 e. P, un identifiant inventé → OP027 (refus 5/13)'
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
\echo '          savepoints : le devis de B → OP027 (refus 6/13), un identifiant inventé → OP027 (refus 7/13)'
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
select pg_temp.v(count(*) > 0) as a_passe_par_l_enveloppe_attendu_t from public.essai_remise_enveloppe(:D1);
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
select pg_temp.v(count(*)) as enveloppe_retiree_attendu_0 from pg_proc where proname = 'essai_remise_enveloppe';

\echo '--- 12 g. PAR LA CLÉ DE SERVICE (bypassrls) — jeton de A : son devis passe (attendu t), le devis de B → OP027'
\echo '          (refus 8/13), un identifiant inventé → OP027 (refus 9/13) ; SANS jeton, le devis de A lui-même'
\echo '          → OP027 (refus 10/13) : la clé de service n’est l’entreprise de personne'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :B;
insert into public.devis (id, pro_id, generation) values (:DB, :B, 1);
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
set local role service_role;
select pg_temp.v(count(*) > 0) as service_jeton_a_son_devis_attendu_t from public.motifs_refus_remise(:D1);
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

\echo '--- 12 h. UN VISITEUR (anon) → « permission denied for function motifs_refus_remise » (refus 11/13)'
begin;
set local role anon;
select * from public.motifs_refus_remise(:DI);
\set e12h_err :ERROR
\set e12h_code :LAST_ERROR_SQLSTATE
\set e12h_msg :LAST_ERROR_MESSAGE
rollback;

\echo ''
\echo '--- 12 i. LE JUGEMENT : dix OP027 au MÊME message, et le refus du visiteur (attendu : t partout)'
select pg_temp.v(:'e12a_err'  = 'true' and :'e12a_code'  = 'OP027' and :'e12a_msg'  = :'MSG_OP027') as a_devis_de_b_attendu_t,
       pg_temp.v(:'e12b_err'  = 'true' and :'e12b_code'  = 'OP027' and :'e12b_msg'  = :'MSG_OP027') as b_invente_attendu_t,
       pg_temp.v(:'e12c_err'  = 'true' and :'e12c_code'  = 'OP027' and :'e12c_msg'  = :'MSG_OP027') as c_vide_attendu_t,
       pg_temp.v(:'e12d_err'  = 'true' and :'e12d_code'  = 'OP027' and :'e12d_msg'  = :'MSG_OP027') as d_particulier_attendu_t,
       pg_temp.v(:'e12e_err'  = 'true' and :'e12e_code'  = 'OP027' and :'e12e_msg'  = :'MSG_OP027') as e_particulier_invente_attendu_t;
select pg_temp.v(:'e12f1_err' = 'true' and :'e12f1_code' = 'OP027' and :'e12f1_msg' = :'MSG_OP027') as f_definer_devis_de_b_attendu_t,
       pg_temp.v(:'e12f2_err' = 'true' and :'e12f2_code' = 'OP027' and :'e12f2_msg' = :'MSG_OP027') as f_definer_invente_attendu_t,
       pg_temp.v(:'e12g1_err' = 'true' and :'e12g1_code' = 'OP027' and :'e12g1_msg' = :'MSG_OP027') as g_service_devis_de_b_attendu_t,
       pg_temp.v(:'e12g2_err' = 'true' and :'e12g2_code' = 'OP027' and :'e12g2_msg' = :'MSG_OP027') as g_service_invente_attendu_t,
       pg_temp.v(:'e12g3_err' = 'true' and :'e12g3_code' = 'OP027' and :'e12g3_msg' = :'MSG_OP027') as g_service_sans_jeton_attendu_t,
       pg_temp.v(:'e12h_err'  = 'true' and :'e12h_code'  = '42501'
         and :'e12h_msg' = 'permission denied for function motifs_refus_remise') as h_visiteur_attendu_t;


-- ==========================================================================
\echo ''
\echo '=== 13. D4-c — AUCUN MOTIF NE DÉPEND DE L’ORIGINE : trois devis identiques sauf leurs liens et la façon dont'
\echo '        ils ont été ouverts (manuelle ; demande + urgence ; urgence seule) rendent la MÊME liste ==='
\echo '    état 1 : pas de réponse « à quel titre » (2b-2), une ligne fautive (option à 20 % en franchise), délai et'
\echo '             validité vides, acompte de 30 % sans nature ; puis P bloque A, toujours dans l’état 1 — la liste ne'
\echo '             le voit pas (c’est la REMISE de 2c qui refusera) ; état 2 : tout corrigé, la réponse donnée.'
\echo '             attendu : non vide, non vide, vide, et X = Y = Z à chaque fois (t ×3)'
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
select pg_temp.v(string_agg(source || ':' || (quote_request_id is not null) || ':' || (sos_request_id is not null), ',' order by id)
         = 'manuelle:false:false,demande:true:true,urgence:false:true') as origines_differentes_attendu_t
  from public.devis where id in (:DX, :DY, :DZ);
execute chiffree('f4930000-0000-4000-8000-0000000000a1', :DX, 1000, 'poste',  100000, 0,    false, 2);
execute chiffree('f4930000-0000-4000-8000-0000000000a2', :DX, 2000, 'option', 10000,  2000, false, 3);
execute chiffree('f4930000-0000-4000-8000-0000000000b1', :DY, 1000, 'poste',  100000, 0,    false, 2);
execute chiffree('f4930000-0000-4000-8000-0000000000b2', :DY, 2000, 'option', 10000,  2000, false, 3);
execute chiffree('f4930000-0000-4000-8000-0000000000c1', :DZ, 1000, 'poste',  100000, 0,    false, 2);
execute chiffree('f4930000-0000-4000-8000-0000000000c2', :DZ, 2000, 'option', 10000,  2000, false, 3);
\echo '-- état 1 (attendu : cles_attendu_t t, x_y_z_identiques_attendu_t t)'
execute trois_listes(:DX, :DY, :DZ, 'devis_pour_qui,devis_taux_franchise,devis_delai,devis_validite,devis_acompte_nature');
\echo '-- état 1, après que P a bloqué A (attendu : t, t — la liste ne voit pas le blocage)'
set local request.jwt.claim.sub = :P;
insert into public.blocages (bloqueur_id, bloque_id) values (:P, :A);
set local request.jwt.claim.sub = :A;
execute trois_listes(:DX, :DY, :DZ, 'devis_pour_qui,devis_taux_franchise,devis_delai,devis_validite,devis_acompte_nature');
\echo '-- état 2, tout corrigé sur les trois devis (attendu : cles « — », t, t)'
update public.devis set delai_execution = 'Deux semaines', validite_jours = 30, acompte_nature = 'arrhes',
                        pour_qui = 'consommateur', pour_qui_client = :C1, generation = 4
 where id in (:DX, :DY, :DZ);
update public.devis_lignes set taux_tva_centiemes = 0, generation = 5 where type = 'option' and devis_id in (:DX, :DY, :DZ);
execute trois_listes(:DX, :DY, :DZ, '—');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 14. LE CATALOGUE — la forme, les droits, ce que le corps lit et ce qu’il ne lit JAMAIS ==='
-- ==========================================================================
\echo '--- 14 a. une seule fonction de ce nom (aucune surcharge), sa signature et son type de retour (attendu : t partout)'
select pg_temp.v((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where p.proname = 'motifs_refus_remise') = 1) as une_seule_attendu_t,
       pg_temp.v(pg_get_function_identity_arguments(p.oid) = 'p_devis uuid') as argument_attendu_t,
       pg_temp.v(pg_get_function_result(p.oid)
         = 'TABLE(rang smallint, cle text, phrase text, nature text, ligne_id uuid)') as retour_attendu_t,
       pg_temp.v(p.proretset) as ensemble_attendu_t,
       pg_temp.v(not p.prosecdef) as invoker_attendu_t,
       pg_temp.v(p.provolatile = 's') as stable_attendu_t,
       pg_temp.v((select l.lanname from pg_language l where l.oid = p.prolang) = 'plpgsql') as plpgsql_attendu_t,
       pg_temp.v(p.proconfig = array['search_path=public']) as search_path_attendu_t,
       pg_temp.v(obj_description(p.oid, 'pg_proc') ~ 'Section 49\.9') as commentaire_attendu_t
  from pg_proc p
 where p.oid = 'public.motifs_refus_remise(uuid)'::regprocedure;

\echo '--- 14 b. les droits : ni PUBLIC, ni visiteur ; un compte connecté et la clé de service, oui (attendu : t | f | t | t)'
select pg_temp.v(p.proacl::text !~ '(^\{|,)=X') as pas_public_attendu_t,
       pg_temp.v(has_function_privilege('anon', p.oid, 'execute')) as anon_attendu_f,
       pg_temp.v(has_function_privilege('authenticated', p.oid, 'execute')) as connecte_attendu_t,
       pg_temp.v(has_function_privilege('service_role', p.oid, 'execute')) as service_attendu_t
  from pg_proc p
 where p.oid = 'public.motifs_refus_remise(uuid)'::regprocedure;

\echo '--- 14 c. LE CORPS, commentaires et chaînes retirés : il ne nomme QUE devis, devis_lignes et emetteur (plus'
\echo '          est_mon_entreprise et emetteur_incomplet), et AUCUN des mots de l’origine ni des lectures entières'
\echo '          (D4-c, critique B5) — ni, depuis 2b-2, `clients` (le type de la fiche ne décide de rien) ni'
\echo '          `chantier_neuf_conso` (le motif du taux réduit ne lit que la question TVA) — attendu : la liste exacte,'
\echo '          puis 0 | 0 | 0 | t'
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
select pg_temp.v((select string_agg(distinct x[1], ',' order by x[1])
          from regexp_matches(src, 'public\s*\.\s*([a-z_][a-z0-9_]*)', 'g') as x)
         = 'devis,devis_lignes,emetteur,emetteur_incomplet,est_mon_entreprise') as nomme_exactement_attendu_t,
       pg_temp.v((select count(*) from regexp_matches(src,
          '\m(quote_request_id|sos_request_id|source|quote_requests|sos_requests|callback_requests|demandes|demande_reponses|peut_faire_un_devis|to_jsonb|row_to_json|jsonb_populate_record|hstore|devis_tva|tarifs_pro|users|professional_profiles|preuves_tva|entreprise_registre|clients|chantier_neuf_conso)\M',
          'gi'))) as mots_interdits_attendu_0,
       pg_temp.v((select count(*) from regexp_matches(src, '(%\s*rowtype|select\s+\*|\.\s*\*)', 'gi'))) as lectures_entieres_attendu_0,
       pg_temp.v((select count(*) from regexp_matches(brut, '''(qr|visite|dossier)''', 'gi'))) as mots_d_origine_attendu_0,
       pg_temp.v(position(chr(92) in brut) = 0 and position(chr(160) in brut) = 0 and position(chr(8239) in brut) = 0)
         as aucune_sequence_ni_insecable_attendu_t
  from corps;

\echo '--- 14 d. la base ne l’enregistre comme dépendante d’AUCUNE table (plpgsql, pas un corps SQL standard : attendu 0)'
select pg_temp.v(count(*)) as dependances_attendu_0
  from pg_depend d
 where d.classid = 'pg_proc'::regclass
   and d.objid = 'public.motifs_refus_remise(uuid)'::regprocedure
   and d.refclassid = 'pg_class'::regclass;

\echo '--- 14 e. les deux listes security definer NE BOUGENT PAS (essai 49, cas 27b et 27c ; essai 50, cas 13i) :'
\echo '          31 ouvertes, 32 fermées, et motifs_refus_remise dans aucune (attendu : 31 | 32 | 0)'
select pg_temp.v(count(*) filter (where has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute')))
         as definer_ouvertes_attendu_31,
       pg_temp.v(count(*) filter (where not (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))))
         as definer_fermees_attendu_32,
       pg_temp.v(count(*) filter (where p.proname = 'motifs_refus_remise')) as elle_n_y_est_pas_attendu_0
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname not in ('pg_catalog', 'information_schema') and n.nspname !~ '^pg_' and p.prosecdef;

-- ==========================================================================
\echo ''
\echo '=== 15. « À QUEL TITRE ? » (2b-2) — devis_pour_qui : rang 1, une RÈGLE D’OPUS, EXCLUSIF de devis_client ; la'
\echo '        réponse ne vaut que pour SON client, et la base ne MUTE rien (49.4 ter) ==='
\echo '    a. la réponse retirée → devis_pour_qui (rang 1, regle_opus, la phrase du contrat, aucune ligne) ; remise → « — »'
\echo '    b. la réponse donnée pour un AUTRE client (le témoin vaut C2, le client C1) → devis_pour_qui'
\echo '    c. le client passe à C2, la réponse reste pour C1 → devis_pour_qui, et la réponse est INTACTE ; retour à C1 → « — »'
\echo '    d. client vide : témoin vide → devis_client SEUL ; témoin C1 → devis_client SEUL (jamais les deux)'
\echo '    e. les quatre réponses, chacune donnée pour C1 → « — » ×4 (l’entreprise de A est complète)'
\echo '    f. la fiche C1 SUPPRIMÉE par A : client_id passe à vide (set null), la réponse et son témoin RESTENT tels quels,'
\echo '       et la liste dit devis_client'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
execute client_c2;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 2);
execute motifs(:D1, '—');
update public.devis set pour_qui = null, generation = 3 where id = :D1;
execute motifs(:D1, 'devis_pour_qui');
select pg_temp.v(count(*) = 1 and bool_and(rang = 1 and nature = 'regle_opus' and ligne_id is null
         and phrase = 'Dites à quel titre ce client commande : selon la réponse, la loi ne demande pas les mêmes mentions sur le devis. Opus le demande pour tous vos devis.')) as pour_qui_rang_nature_phrase_attendu_t
  from public.motifs_refus_remise(:D1) where cle = 'devis_pour_qui';
update public.devis set pour_qui = 'consommateur', generation = 4 where id = :D1;
execute motifs(:D1, '—');
update public.devis set pour_qui_client = :C2, generation = 5 where id = :D1;
execute motifs(:D1, 'devis_pour_qui');
update public.devis set pour_qui_client = :C1, client_id = :C2, generation = 6 where id = :D1;
execute motifs(:D1, 'devis_pour_qui');
select pg_temp.v(pour_qui = 'consommateur' and pour_qui_client = :C1 and client_id = :C2) as reponse_intacte_attendu_t
  from public.devis where id = :D1;
update public.devis set client_id = :C1, generation = 7 where id = :D1;
execute motifs(:D1, '—');
update public.devis set client_id = null, pour_qui_client = null, generation = 8 where id = :D1;
execute motifs(:D1, 'devis_client');
update public.devis set pour_qui_client = :C1, generation = 9 where id = :D1;
execute motifs(:D1, 'devis_client');
update public.devis set client_id = :C1, pour_qui = 'non_professionnel', generation = 10 where id = :D1;
execute motifs(:D1, '—');
update public.devis set pour_qui = 'professionnel_hors_activite', generation = 11 where id = :D1;
execute motifs(:D1, '—');
update public.devis set pour_qui = 'professionnel', generation = 12 where id = :D1;
execute motifs(:D1, '—');
update public.devis set pour_qui = 'consommateur', generation = 13 where id = :D1;
execute motifs(:D1, '—');
delete from public.clients where id = :C1;
select pg_temp.v(client_id is null and pour_qui = 'consommateur' and pour_qui_client = :C1) as fiche_partie_reponse_restee_attendu_t
  from public.devis where id = :D1;
execute motifs(:D1, 'devis_client');
rollback;

\echo '--- 15 g. une réponse INCONNUE → devis_pour_qui_check (refus 12/13), jugé en SQL juste après'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
update public.devis set pour_qui = 'autre', generation = 2 where id = :D1;
\set e15g_err :ERROR
\set e15g_code :LAST_ERROR_SQLSTATE
\set e15g_msg :LAST_ERROR_MESSAGE
rollback;
select pg_temp.v(:'e15g_err' = 'true' and :'e15g_code' = '23514'
         and :'e15g_msg' = 'new row for relation "devis" violates check constraint "devis_pour_qui_check"')
         as reponse_inconnue_refusee_attendu_t;


-- ==========================================================================
\echo ''
\echo '=== 16. LE FILTRE ET LES NATURES DE L’ENTREPRISE SELON LA RÉPONSE VALABLE (2b-2) ==='
\echo '    A devient (en superutilisateur) un entrepreneur individuel architecte, établissement qui n’est pas le siège,'
\echo '    adresse non transmise, au RNE, au régime réel : ses DOUZE… treize motifs sont relus d’abord (la donnée existe).'
\echo '    attendu, rang:clé=nature dans l’ordre de sortie :'
\echo '      consommateur, hors de son activité : les treize, les conso_ en loi (conso_tva_intra regle_opus) ;'
\echo '      non_professionnel : les treize, les conso_ en PRUDENCE (conso_tva_intra toujours regle_opus) ;'
\echo '      professionnel : 101, 102, 103 et 112 SEULEMENT — les deux adresses gardées en prudence, des TROUS dans les rangs ;'
\echo '      professionnel donné pour un AUTRE client, ou client vidé (témoin C1), ou fiche supprimée : rien n’est filtré'
-- ==========================================================================
begin;
update public.entreprise_registre set forme_juridique = '1000', est_ei = true, est_siege = false, adresse = null
 where pro_id = :A and retiree_le is null;
update public.professional_profiles set metiers = array['architecte'] where id = :A;
insert into public.emetteur (pro_id, registre, regime_tva) values (:A, 'rne', 'reel');
execute client_c2;
set local role authenticated;
set local request.jwt.claim.sub = :A;
select pg_temp.v(string_agg(split_part(m, ': ', 1), ',' order by o)
         = 'conso_adresse_etablissement,nom_ei,conso_adresse_siege,conso_telephone,conso_email,conso_tva_intra,'
           'conso_mediateur,conso_garantie_legale,conso_modalites_paiement,conso_modalites_execution,'
           'conso_reclamations,frais_deplacement,conso_profession_reglementee') as treize_motifs_existent_attendu_t
  from unnest(public.emetteur_incomplet(:A)) with ordinality as u(m, o);
execute devis_complet(:D1);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 2000, false, 2);
execute liste(:D1, '101:conso_adresse_etablissement=loi,102:nom_ei=loi,103:conso_adresse_siege=loi,104:conso_telephone=l'
         || 'oi,105:conso_email=loi,106:conso_tva_intra=regle_opus,107:conso_mediateur=loi,108:conso_garantie_leg'
         || 'ale=loi,109:conso_modalites_paiement=loi,110:conso_modalites_execution=loi,111:conso_reclamations=lo'
         || 'i,112:frais_deplacement=regle_opus,113:conso_profession_reglementee=prudence');
update public.devis set pour_qui = 'professionnel_hors_activite', generation = 3 where id = :D1;
execute liste(:D1, '101:conso_adresse_etablissement=loi,102:nom_ei=loi,103:conso_adresse_siege=loi,104:conso_telephone=l'
         || 'oi,105:conso_email=loi,106:conso_tva_intra=regle_opus,107:conso_mediateur=loi,108:conso_garantie_leg'
         || 'ale=loi,109:conso_modalites_paiement=loi,110:conso_modalites_execution=loi,111:conso_reclamations=lo'
         || 'i,112:frais_deplacement=regle_opus,113:conso_profession_reglementee=prudence');
update public.devis set pour_qui = 'non_professionnel', generation = 4 where id = :D1;
execute liste(:D1, '101:conso_adresse_etablissement=prudence,102:nom_ei=loi,103:conso_adresse_siege=prudence,104:conso_t'
         || 'elephone=prudence,105:conso_email=prudence,106:conso_tva_intra=regle_opus,107:conso_mediateur=pruden'
         || 'ce,108:conso_garantie_legale=prudence,109:conso_modalites_paiement=prudence,110:conso_modalites_exec'
         || 'ution=prudence,111:conso_reclamations=prudence,112:frais_deplacement=regle_opus,113:conso_profession'
         || '_reglementee=prudence');
update public.devis set pour_qui = 'professionnel', generation = 5 where id = :D1;
execute liste(:D1, '101:conso_adresse_etablissement=prudence,102:nom_ei=loi,103:conso_adresse_siege=prudence,112:frais_d'
         || 'eplacement=regle_opus');
-- les rangs gardés sont 100 + LEUR position dans emetteur_incomplet : un trou, jamais une renumérotation
with m as (select * from public.motifs_refus_remise(:D1) where rang > 100),
     e as (select * from unnest(public.emetteur_incomplet(:A)) with ordinality as y(motif, pos))
select pg_temp.v((select count(*) from m join e on e.pos = m.rang - 100 where m.cle || ': ' || m.phrase = e.motif)
         = (select count(*) from m) and (select count(*) from m) = 4) as rangs_d_origine_attendu_t;
update public.devis set pour_qui_client = :C2, generation = 6 where id = :D1;
execute liste(:D1, '1:devis_pour_qui=regle_opus,101:conso_adresse_etablissement=loi,102:nom_ei=loi,103:conso_adresse_sie'
         || 'ge=loi,104:conso_telephone=loi,105:conso_email=loi,106:conso_tva_intra=regle_opus,107:conso_mediateu'
         || 'r=loi,108:conso_garantie_legale=loi,109:conso_modalites_paiement=loi,110:conso_modalites_execution=l'
         || 'oi,111:conso_reclamations=loi,112:frais_deplacement=regle_opus,113:conso_profession_reglementee=prud'
         || 'ence');
update public.devis set pour_qui_client = :C1, client_id = null, generation = 7 where id = :D1;
execute liste(:D1, '1:devis_client=regle_opus,101:conso_adresse_etablissement=loi,102:nom_ei=loi,103:conso_adresse_siege'
         || '=loi,104:conso_telephone=loi,105:conso_email=loi,106:conso_tva_intra=regle_opus,107:conso_mediateur='
         || 'loi,108:conso_garantie_legale=loi,109:conso_modalites_paiement=loi,110:conso_modalites_execution=loi'
         || ',111:conso_reclamations=loi,112:frais_deplacement=regle_opus,113:conso_profession_reglementee=pruden'
         || 'ce');
update public.devis set client_id = :C1, generation = 8 where id = :D1;
execute liste(:D1, '101:conso_adresse_etablissement=prudence,102:nom_ei=loi,103:conso_adresse_siege=prudence,112:frais_d'
         || 'eplacement=regle_opus');
update public.devis set pour_qui = null, generation = 9 where id = :D1;
execute liste(:D1, '1:devis_pour_qui=regle_opus,101:conso_adresse_etablissement=loi,102:nom_ei=loi,103:conso_adresse_sie'
         || 'ge=loi,104:conso_telephone=loi,105:conso_email=loi,106:conso_tva_intra=regle_opus,107:conso_mediateu'
         || 'r=loi,108:conso_garantie_legale=loi,109:conso_modalites_paiement=loi,110:conso_modalites_execution=l'
         || 'oi,111:conso_reclamations=loi,112:frais_deplacement=regle_opus,113:conso_profession_reglementee=prud'
         || 'ence');
update public.devis set pour_qui = 'professionnel', generation = 10 where id = :D1;
delete from public.clients where id = :C1;
execute liste(:D1, '1:devis_client=regle_opus,101:conso_adresse_etablissement=loi,102:nom_ei=loi,103:conso_adresse_siege'
         || '=loi,104:conso_telephone=loi,105:conso_email=loi,106:conso_tva_intra=regle_opus,107:conso_mediateur='
         || 'loi,108:conso_garantie_legale=loi,109:conso_modalites_paiement=loi,110:conso_modalites_execution=loi'
         || ',111:conso_reclamations=loi,112:frais_deplacement=regle_opus,113:conso_profession_reglementee=pruden'
         || 'ce');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 17. devis_taux_reduit_neuf (2b-2) — au RÉEL, une ligne à 10 % ou 5,5 % quand l’artisan a répondu « Oui » à la'
\echo '        question TVA de « Le chantier » : UNE clé par ligne, et les deux clés du réel ALTERNENT dans l’ordre'
\echo '    lignes : zone L7 (sans taux) ; L1 poste 20 % (juste) ; L2 poste 10 % ordre 2000 ; L5 poste 0 % ordre 2500 ;'
\echo '             L6 poste 5,5 % ordre 3000 ; L3 OPTION 5,5 % ordre 4000 ; L4 poste OFFERT 10 % ordre 5000'
\echo '    attendu : question vide, « Non », ou seule la question des DROITS à « Oui » → devis_taux_sans_tva sur L5 seulement ;'
\echo '              « Oui » → L2 neuf, L5 sans TVA, L6 neuf, L3 neuf, L4 neuf (alignés), nature prudence, la phrase du contrat ;'
\echo '              en franchise → cinq devis_taux_franchise, aucun neuf ; régime vide → aucun motif de ligne ;'
\echo '              au réel, tout passé à 20 % → il ne reste que conso_tva_intra'
-- ==========================================================================
begin;
execute fiche_a('reel');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
execute titre(:L7, :D1, 500, 'zone', 2);
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 2000, false, 3);
execute chiffree(:L2, :D1, 2000, 'poste', 10000, 1000, false, 4);
execute chiffree(:L5, :D1, 2500, 'poste', 10000, 0, false, 5);
execute chiffree(:L6, :D1, 3000, 'poste', 10000, 550, false, 6);
execute chiffree(:L3, :D1, 4000, 'option', 10000, 550, false, 7);
execute chiffree(:L4, :D1, 5000, 'poste', 4500, 1000, true, 8);
execute motifs(:D1, 'devis_taux_sans_tva,conso_tva_intra');
execute fautives(:D1, :L5::text);
update public.devis set chantier_neuf_tva = false, generation = 9 where id = :D1;
execute motifs(:D1, 'devis_taux_sans_tva,conso_tva_intra');
update public.devis set chantier_neuf_tva = null, chantier_neuf_conso = true, generation = 10 where id = :D1;
execute motifs(:D1, 'devis_taux_sans_tva,conso_tva_intra');
update public.devis set chantier_neuf_tva = true, chantier_neuf_conso = null, generation = 11 where id = :D1;
execute motifs(:D1, 'devis_taux_reduit_neuf,devis_taux_sans_tva,devis_taux_reduit_neuf,devis_taux_reduit_neuf,devis_taux_reduit_neuf,conso_tva_intra');
execute fautives(:D1, concat_ws(',', :L2::text, :L5::text, :L6::text, :L3::text, :L4::text));
select pg_temp.v(string_agg(ligne_id::text || '=' || cle, ',' order by o)
         = concat_ws(',', :L2::text || '=devis_taux_reduit_neuf', :L5::text || '=devis_taux_sans_tva',
                     :L6::text || '=devis_taux_reduit_neuf', :L3::text || '=devis_taux_reduit_neuf',
                     :L4::text || '=devis_taux_reduit_neuf')) as cles_alignees_sur_les_lignes_attendu_t
  from public.motifs_refus_remise(:D1) with ordinality as m(rang, cle, phrase, nature, ligne_id, o) where rang = 3;
select pg_temp.v(count(*) = 4 and bool_and(nature = 'prudence' and phrase = 'Mettez cette ligne au taux normal, ou changez votre réponse dans « Le chantier » : vous avez répondu que ces travaux font partie d’un chantier qui crée un bâtiment neuf.')) as reduit_neuf_prudence_attendu_t
  from public.motifs_refus_remise(:D1) where cle = 'devis_taux_reduit_neuf';
reset role;
update public.emetteur set regime_tva = 'franchise' where pro_id = :A;
set local role authenticated;
execute motifs(:D1, 'devis_taux_franchise,devis_taux_franchise,devis_taux_franchise,devis_taux_franchise,devis_taux_franchise');
execute fautives(:D1, concat_ws(',', :L1::text, :L2::text, :L6::text, :L3::text, :L4::text));
reset role;
update public.emetteur set regime_tva = null where pro_id = :A;
set local role authenticated;
select pg_temp.v(count(*) filter (where rang = 3)) as regime_vide_aucune_ligne_attendu_0,
       pg_temp.v(count(*) filter (where cle = 'regime_tva')) as regime_tva_attendu_1
  from public.motifs_refus_remise(:D1);
reset role;
update public.emetteur set regime_tva = 'reel' where pro_id = :A;
set local role authenticated;
update public.devis_lignes set taux_tva_centiemes = 2000, generation = 12 where id = :L2;
update public.devis_lignes set taux_tva_centiemes = 2000, generation = 13 where id = :L5;
update public.devis_lignes set taux_tva_centiemes = 2000, generation = 14 where id = :L6;
update public.devis_lignes set taux_tva_centiemes = 2000, generation = 15 where id = :L3;
update public.devis_lignes set taux_tva_centiemes = 2000, generation = 16 where id = :L4;
execute motifs(:D1, 'conso_tva_intra');
rollback;


-- ==========================================================================
\echo ''
\echo '=== 18. LA DATE DU « OUI » AU CHANTIER NEUF (2b-2, tient_le_devis, point 1 bis) — posée par la BASE quand la réponse'
\echo '        DEVIENT vraie, gardée ensuite, effacée quand elle cesse de l’être ; une date envoyée est ignorée ==='
\echo '    attendu : vide à la naissance ; posée au « Oui » ; GARDÉE par une autre écriture, par le recalcul d’une ligne,'
\echo '              par un « Oui » renvoyé, par une date de 2001 écrite en superutilisateur, par la cascade d’une fiche'
\echo '              supprimée ; effacée par « Non » et par vide ; un nouveau « Oui » en pose une PLUS RÉCENTE ; à'
\echo '              l’insertion en superutilisateur, une date envoyée est remplacée (Oui) ou vidée (sinon)'
-- ==========================================================================
begin;
execute fiche_a('franchise');
execute frais_a;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
select pg_temp.v(chantier_neuf_conso_le is null) as vide_a_la_naissance_attendu_t from public.devis where id = :D1;
update public.devis set chantier_neuf_conso = true, generation = 2 where id = :D1;
select chantier_neuf_conso_le as date_oui from public.devis where id = :D1 \gset
select pg_temp.v(chantier_neuf_conso_le is not null and chantier_neuf_conso_le >= now()
         and chantier_neuf_conso_le <= clock_timestamp()) as posee_par_la_base_attendu_t
  from public.devis where id = :D1;
update public.devis set objet = 'Extension', generation = 3 where id = :D1;
execute chiffree(:L1, :D1, 1000, 'poste', 100000, 0, false, 4);
update public.devis set chantier_neuf_conso = true, generation = 5 where id = :D1;
select pg_temp.v(chantier_neuf_conso_le = :'date_oui'::timestamptz) as gardee_par_trois_ecritures_attendu_t
  from public.devis where id = :D1;
reset role;
update public.devis set chantier_neuf_conso_le = '2001-01-01', generation = 6 where id = :D1;
set local role authenticated;
select pg_temp.v(chantier_neuf_conso_le = :'date_oui'::timestamptz) as date_de_2001_ignoree_attendu_t
  from public.devis where id = :D1;
update public.devis set chantier_neuf_conso = false, generation = 7 where id = :D1;
select pg_temp.v(chantier_neuf_conso_le is null) as effacee_par_non_attendu_t from public.devis where id = :D1;
update public.devis set chantier_neuf_conso = true, generation = 8 where id = :D1;
select chantier_neuf_conso_le as date_oui2 from public.devis where id = :D1 \gset
select pg_temp.v(chantier_neuf_conso_le > :'date_oui'::timestamptz) as nouvelle_date_plus_recente_attendu_t
  from public.devis where id = :D1;
delete from public.clients where id = :C1;
select pg_temp.v(client_id is null and chantier_neuf_conso is true
         and chantier_neuf_conso_le = :'date_oui2'::timestamptz) as gardee_par_la_cascade_attendu_t
  from public.devis where id = :D1;
update public.devis set chantier_neuf_conso = null, generation = 9 where id = :D1;
select pg_temp.v(chantier_neuf_conso_le is null) as effacee_par_vide_attendu_t from public.devis where id = :D1;
reset role;
insert into public.devis (id, pro_id, chantier_neuf_conso, chantier_neuf_conso_le, generation)
values (:DX, :A, true, '2001-01-01', 1), (:DY, :A, false, '2001-01-01', 1), (:DZ, :A, null, '2001-01-01', 1);
select pg_temp.v(count(*) filter (where id = :DX and chantier_neuf_conso_le >= now())
         + count(*) filter (where id in (:DY, :DZ) and chantier_neuf_conso_le is null) = 3) as insertion_date_envoyee_attendu_t
  from public.devis where id in (:DX, :DY, :DZ);
rollback;

\echo '--- 18 b. le TÉLÉPHONE écrit la date → « permission denied for table devis » (refus 13/13), jugé en SQL juste après'
begin;
set local role authenticated;
set local request.jwt.claim.sub = :A;
execute devis_complet(:D1);
update public.devis set chantier_neuf_conso = true, chantier_neuf_conso_le = '2001-01-01', generation = 2 where id = :D1;
\set e18b_err :ERROR
\set e18b_code :LAST_ERROR_SQLSTATE
\set e18b_msg :LAST_ERROR_MESSAGE
rollback;
select pg_temp.v(:'e18b_err' = 'true' and :'e18b_code' = '42501'
         and :'e18b_msg' = 'permission denied for table devis') as date_ecrite_par_le_telephone_refusee_attendu_t;

-- ==========================================================================
\echo ''
\echo '=== 19. LE COMPTE — chaque valeur annoncée a été JUGÉE (attendu : t, et VALEURS_ANNONCEES) ==='
\echo '    Un cas retiré, un ordre qui échoue à la place d’un autre, une transaction déjà annulée : des valeurs'
\echo '    manquent, et ceci vaut f. C’est la 188e colonne « …_attendu_ » du fichier.'
-- ==========================================================================
select pg_temp.valeurs_jugees() = :VALEURS_ANNONCEES as toutes_les_valeurs_jugees_attendu_t,
       pg_temp.valeurs_jugees() as valeurs_jugees;

\set VERBOSITY default
\set SHOW_CONTEXT errors
