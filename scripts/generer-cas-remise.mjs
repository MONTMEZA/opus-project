#!/usr/bin/env node
/**
 * Engendre `supabase/cas-remise.json` : ce que la BASE dit qu'il manque pour
 * remettre un devis — `motifs_refus_remise(p_devis)`, section 49.9 de
 * `schema.sql` (lot 2b, étape 2b-1, 05/11/2026) —, sur une cinquantaine de
 * situations.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * La démonstration n'a pas de base : elle fait tourner un MIROIR de la
 * fonction, écrit en JavaScript (`motifsDeRemise`, `src/lib/devis.js`).
 * Deux écritures d'une règle finissent par diverger — sauf si l'une est
 * éprouvée sur la sortie de l'autre. Ce script fait jouer chaque situation
 * par la VRAIE fonction, sur un PostgreSQL local, et range l'entrée (le
 * devis et ses lignes tels que l'application les tient, le régime de TVA,
 * ce que rend `emetteur_incomplet()`) et la sortie ; `verifier-devis` fait
 * tourner le miroir sur les mêmes entrées et exige ZÉRO écart. C'est le
 * procédé des 768 cas du badge (`generer-cas-badge.mjs`, lot S-a).
 *
 * La fonction n'est pas PURE (elle lit des tables) : elle ne peut pas se
 * jouer « comme `cas-devis.json` ». Chaque situation est donc CONSTRUITE —
 * la fiche de l'entreprise en superutilisateur, puis le devis et ses lignes
 * PAR LE CHEMIN D'UN CLIENT (rôle `authenticated` et jeton de l'artisan),
 * donc à travers les droits de colonne, `tient_le_devis()` et le recalcul —,
 * relue, puis annulée (`rollback to savepoint`).
 *
 *   node scripts/generer-cas-remise.mjs               # écrit le fichier
 *   node scripts/generer-cas-remise.mjs --verifier    # compare, n'écrit rien
 *
 * Le script CRÉE SA PROPRE BASE (`cas_remise_<n° du processus>`), y joue
 * `local-prelude.sql` puis `schema.sql` DEUX fois, et la SUPPRIME à la fin,
 * même en cas d'échec : il se relance autant qu'on veut, sans rien laisser.
 * Il lui faut un PostgreSQL joignable (par défaut `-h /tmp -p 5433 -U
 * postgres`, ou `PGHOST`, `PGPORT`, `PGUSER`) — jamais la vraie base.
 *
 * À RELANCER, et le fichier à COMMITER, dès que la règle de la base change.
 *
 * LE FORMAT DE CHAQUE CAS (un par ligne, lisible dans un diff) :
 *   { n, nom, devis, lignes, regime, motifsEmetteur, assurances, lieux, labels, sousTraitants, attendu }
 *   - `devis` : la ligne de la base passée par `rowToDevis` (`devis.js`),
 *     ses deux dates retirées (`createdAt`, `modifieLe` à `null`) — elles
 *     changeraient à chaque génération, et la règle ne les lit pas ;
 *   - `lignes` : les lignes passées par la même traduction que `rowToLigne`
 *     (`api.js`, qui charge Supabase et que `node` ne sait pas ouvrir : sa
 *     traduction est recopiée ici, champ pour champ), dans l'ORDRE OÙ ELLES
 *     ONT ÉTÉ ÉCRITES — pas dans celui du devis : le miroir doit les ranger
 *     lui-même (`ordre`, puis `id`) ;
 *   - `regime` : `emetteur.regime_tva` (`'franchise'`, `'reel'` ou `null`) ;
 *   - `motifsEmetteur` : la sortie de `emetteur_incomplet()`, telle quelle
 *     (des « clé: phrase ») ;
 *   - `assurances` (2b-3) : TOUTES les lignes de `emetteur_assurances` de la
 *     base, relues en superutilisateur — celles de A ET celles d'un autre
 *     artisan (B) : le miroir doit écarter, comme la base (`a.pro_id =
 *     v_pro`), ce qui n'est pas à l'entreprise du devis. Quatre colonnes
 *     (`pro_id`, `nature`, `attestation_chemin`, `valide_jusquau`), dans un
 *     ordre fixe. LES DATES SONT FIXES — 2001 (passée) ou 2999 (valable) —,
 *     jamais relatives : le fichier ne vieillit pas, et le miroir peut les
 *     juger au jour du TÉLÉPHONE (son défaut) quand la base les juge au jour
 *     de PARIS. Le script REFUSE toute date entre 2002 et 2998 ;
 *   - `lieux` (2b-5) : TOUS les lieux de dépôt des déchets de la base
 *     (`emetteur_lieux_depot`), relus en superutilisateur, en OBJETS
 *     `{ id, proId }` — ceux de A ET ceux d'un autre artisan (B) : le
 *     miroir doit écarter, comme la base (`l.pro_id = v_pro`), ce qui n'est
 *     pas à l'entreprise du devis, et un identifiant du devis qui ne
 *     désigne aucun lieu (un lieu retiré : « orphelin ») ne compte pas. Rangés
 *     par `proId` puis `id` ; `[]` quand la base n'en a aucun ;
 *   - `labels` (2b-6) : TOUS les signes de qualité de la base
 *     (`emetteur_labels`), relus en superutilisateur, en LIGNES DE LA BASE
 *     (les noms des colonnes, comme `assurances` : c'est ainsi que « Mon
 *     entreprise » les lit, `select('*')`) réduites à ce que la règle lit —
 *     `{ id, pro_id, categories, valide_jusquau, justificatif_chemin }` —,
 *     ceux de A ET ceux d'un autre artisan (B) : le miroir doit écarter, comme
 *     la base (`g.pro_id = v_pro`), ce qui n'est pas à l'entreprise du devis.
 *     Rangés par `pro_id` puis `id` ; `[]` quand la base n'en a aucun. LES
 *     DATES SONT FIXES (2001 ou 2999), comme pour les assurances ;
 *   - `sousTraitants` (2b-6) : TOUS les sous-traitants de la base
 *     (`emetteur_sous_traitants`), de même — `{ id, pro_id, label_detient,
 *     label_categories, label_valide_jusquau, label_justificatif_chemin }` —,
 *     ceux de A ET ceux de B ; un identifiant du devis qui ne désigne aucun
 *     sous-traitant (« orphelin ») ne compte pas. Ni le nom, ni le SIRET : la
 *     règle ne les lit pas. Mêmes dates fixes ;
 *   - `attendu` : les lignes de la fonction, dans son ordre de sortie —
 *     `{ rang, cle, phrase, nature, ligne_id }`, où `ligne_id` est remplacé
 *     par l'INDICE de la ligne désignée dans `lignes` (ou `null`).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rowToDevis } from '../src/lib/devis.js';
import { DECLARATION_TVA } from '../src/lib/tva.js';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = join(RACINE, 'supabase', 'cas-remise.json');
const VERIFIER = process.argv.includes('--verifier');

const HOTE = process.env.PGHOST || '/tmp';
const PORT = process.env.PGPORT || '5433';
const QUI = process.env.PGUSER || 'postgres';
const BASE = `cas_remise_${process.pid}`;

// Les comptes et les SIRET FICTIFS de l'essai 49 (vérifiés absents du
// répertoire Sirene le 21/10/2026) : A, une SARL en siège, SANS n° de TVA.
const A = 'a4900000-0000-4000-8000-00000000000a';
// 2b-3 : un SECOND artisan, B — sa décennale valable ne doit JAMAIS valoir
// pour le devis de A (`a.pro_id = v_pro`, la seule barrière quand la remise
// de 2c appellera la fonction depuis une fonction `security definer`).
const B = 'a4900000-0000-4000-8000-00000000000b';
const P = 'a4900000-0000-4000-8000-00000000000e';
const C1 = 'c4900000-0000-4000-8000-0000000000c1';
// 2b-2 : une seconde fiche du carnet de A, une entreprise — pour « la réponse
// a été donnée pour un AUTRE client », et « on revient au client d'avant ».
const C2 = 'c4900000-0000-4000-8000-0000000000c2';
const QA = 'e4900000-0000-4000-8000-00000000a0a1';
const SA = 'e4900000-0000-4000-8000-00000000b0a1';
const idDevis = (n) => `d4940000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const idLigne = (n, i) => `f4940000-0000-4000-8000-${String(n).padStart(6, '0')}${String(i).padStart(6, '0')}`;

const psql = (args, input) => execFileSync('psql',
  ['-X', '-h', HOTE, '-p', PORT, '-U', QUI, '-v', 'ON_ERROR_STOP=1', ...args],
  { input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 1e8 });
/* 2b-5 : un TABLEAU s'écrit en littéral « '{"a","b"}' », que la colonne
   type elle-même (`text[]` ou `uuid[]`) — `array['…']` serait un `text[]`,
   et PostgreSQL ne change pas un `text[]` en `uuid[]` sans qu'on le lui
   demande. Un élément qui porterait un guillemet, une apostrophe ou une
   barre oblique inverse est REFUSÉ : il faudrait l'échapper, et aucune
   situation n'en a besoin. Un tableau VIDE n'est jamais écrit : la base le
   refuse (`dechets_*_check`), et le refus annulerait le savepoint. */
const elementDeTableau = (e) => {
  const t = String(e);
  if (/["'\\]/.test(t)) throw new Error(`élément de tableau non écrit tel quel : ${t}`);
  return `"${t}"`;
};
const tableau = (v) => {
  if (v.length === 0) throw new Error('tableau vide : la base le refuse');
  return `'{${v.map(elementDeTableau).join(',')}}'`;
};
const q = (v) => (v === null || v === undefined ? 'null' : typeof v === 'number' ? String(v)
  : typeof v === 'boolean' ? String(v) : Array.isArray(v) ? tableau(v)
  : `'${String(v).replace(/'/g, "''")}'`);

/* ---------------------------------------------------------------------------
   LES ENTREPRISES — ce que « Mon entreprise » de A contient. Posées en
   superutilisateur, comme dans les essais 46 et 49-remise.
   --------------------------------------------------------------------------- */
const FICHE = (regime) => `insert into public.emetteur
  (pro_id, registre, greffe_ville, capital_centimes, telephone, email, regime_tva,
   mediateur_nom, mediateur_adresse, mediateur_site, garantie_legale_texte,
   modalites_paiement_texte, modalites_execution_texte, reclamations_texte)
values ('${A}', 'rcs', 'Aix-en-Provence', 100000, '04 42 00 00 00', 'contact@exemple-opus.test', ${q(regime)},
  'Médiateur d’essai', '1 rue de l’Essai, 13410 Lambesc', 'https://mediateur.exemple-opus.test',
  'Garantie de parfait achèvement, biennale et décennale.',
  'Paiement à réception de facture.', 'Travaux réalisés aux dates convenues.',
  'Par écrit, réponse sous quinze jours.');`;
const FRAIS = (centimes, texte = null) =>
  `insert into public.tarifs_pro (pro_id, frais_deplacement_centimes, frais_deplacement_texte) values ('${A}', ${q(centimes)}, ${q(texte)});`;
const ENTREPRISES = {
  // Rien ne manque à l'entreprise : tout motif qui reste est un motif du DEVIS.
  franchise: [FICHE('franchise'), FRAIS(3500)],
  // Au régime réel, A n'a aucun n° de TVA : conso_tva_intra (règle d'Opus).
  reel: [FICHE('reel'), FRAIS(3500)],
  // Au régime réel AVEC un n° de TVA connu de l'annuaire (posé en
  // superutilisateur ; FR78000049007 est le numéro CALCULÉ du SIREN fictif
  // 000049007) : rien ne manque à l'entreprise, et un motif de ligne au réel
  // (`devis_taux_sans_tva`) peut être le SEUL de la liste.
  reel_tva: [FICHE('reel'), FRAIS(3500),
    `update public.entreprise_registre set tva = 'FR78000049007' where pro_id = '${A}' and retiree_le is null;`],
  vide: [],
  sans_regime: [FICHE(null), FRAIS(3500)],
  sans_frais: [FICHE('franchise')],
  frais_offerts: [FICHE('franchise'), FRAIS(0)],
  frais_texte: [FICHE('franchise'), FRAIS(null, 'Gratuit jusqu’à 20 km, puis 0,50 € le kilomètre')],
  partielle: [`insert into public.emetteur (pro_id, telephone, regime_tva) values ('${A}', '04 42 00 00 00', 'franchise');`],
  ancienne_reel: [FICHE('reel'),
    `update public.entreprise_registre set verifie_le = now() - interval '400 days' where pro_id = '${A}' and retiree_le is null;`],
  architecte: [FICHE('franchise'), FRAIS(3500),
    `update public.professional_profiles set metiers = array['architecte'] where id = '${A}';`],
  // 2b-2 : au régime réel, le numéro calculé du SIREN fictif DÉCLARÉ SUR
  // L'HONNEUR (posé en superutilisateur : la garde I1 l'accepte, le compte est
  // en @exemple-opus.test) — la déclaration éteint `conso_tva_intra`.
  reel_declare: [FICHE('reel'), FRAIS(3500),
    `insert into public.preuves_tva (pro_id, siren, numero, source, declaration_texte) values ('${A}', '000049007', 'FR78000049007', 'declaration', ${q(DECLARATION_TVA)});`],
  // 2b-2 : au régime réel, une fiche à peine remplie (le téléphone) : la
  // plupart des mentions dues à un particulier manquent, `conso_tva_intra` et
  // les deux adresses compris — de quoi voir le filtre « pour son
  // entreprise », ses TROUS, et les natures selon la réponse.
  partielle_reel: [`insert into public.emetteur (pro_id, telephone, regime_tva) values ('${A}', '04 42 00 00 00', 'reel');`,
    // un établissement dont l'adresse n'a pas été transmise, et qui n'est pas
    // le siège : les deux mentions d'adresse dues à un particulier manquent.
    `update public.entreprise_registre set adresse = null, est_siege = false where pro_id = '${A}' and retiree_le is null;`],
};

/* ---------------------------------------------------------------------------
   LES DEVIS. Le devis « complet » : client, lieu, délai, validité. Une
   situation le change par `devis` (des colonnes à écrire, aux noms de la
   base) ; ses lignes sont écrites dans l'ordre donné.
   --------------------------------------------------------------------------- */
// 2b-2 : le devis « complet » répond à « À quel titre ? » POUR son client
// (`pour_qui_client` = `client_id`) — sans quoi la base demanderait
// `devis_pour_qui` à chaque situation.
// 2b-4 : « complet » dit aussi que le devis lui-même est GRATUIT
// (`cout_devis_centimes` = 0) — sans quoi `devis_cout` (rang 12, une
// prudence) s'ajouterait à chaque situation, et les 125 cas d'avant
// changeraient de sens. `VIDE` NE LE REÇOIT PAS : les situations qui en
// partent gardent le 0 de `COMPLET` (elles sont « neuves, sauf gratuit ») ;
// celles qui veulent le prix VIDE l'écrivent (`cout_devis_centimes: null`).
// 2b-5 : « complet » répond aussi « Non » à « S'agit-il de travaux sur un
// bâtiment, ou de jardinage ? » (`dechets_concerne` = faux) — sans quoi
// `devis_dechets` (rang 13, une prudence) s'ajouterait à chaque situation,
// et les 139 cas d'avant changeraient de sens. Même procédé que le prix du
// devis lui-même en 2b-4 : `VIDE` NE LE REÇOIT PAS, et les situations qui
// veulent la réponse vide l'écrivent (`dechets_concerne: null`).
// 2b-6 : « complet » répond aussi « Aucun de ces travaux » aux travaux
// d'énergie (`energie_travaux` = {aucun}) — sans quoi `devis_energie` (rang
// 14, une prudence) s'ajouterait à chaque situation, et les 184 cas d'avant
// changeraient de sens. Même procédé : `VIDE` NE LE REÇOIT PAS, et les
// situations qui veulent la réponse vide l'écrivent (`energie_travaux: null`).
const COMPLET = {
  client_id: C1, lieu_adresse: '4 rue de l’Essai', lieu_code_postal: '13410', lieu_ville: 'Lambesc',
  delai_execution: 'Dans les 30 jours suivant la signature', validite_jours: 30,
  pour_qui: 'consommateur', pour_qui_client: C1, cout_devis_centimes: 0, dechets_concerne: false,
  energie_travaux: ['aucun'],
};
const VIDE = {
  client_id: null, lieu_adresse: null, lieu_code_postal: null, lieu_ville: null,
  delai_execution: null, validite_jours: null, pour_qui: null, pour_qui_client: null,
};
// Lignes : poste, option, et les trois sans chiffre.
const poste = (prix, taux, extra = {}) => ({ type: 'poste', prix, taux, ...extra });
const option = (prix, taux, extra = {}) => ({ type: 'option', prix, taux, ...extra });
const titre = (type, extra = {}) => ({ type, ...extra });
const UN_POSTE_0 = [poste(100000, 0)];
const UN_POSTE_20 = [poste(100000, 2000)];
// 2b-3 : un poste marqué « réparation urgente » (49.3 bis) — un fait de
// ligne posé par l'artisan, jamais déduit de l'origine.
const urgent = (prix, taux, extra = {}) => poste(prix, taux, { urgence: true, ...extra });
// 2b-3 : l'acompte du devis « à la signature » — un acompte AVEC sa nature,
// pour que seul le rang 10 puisse parler.
const SIGNATURE = { acompte_centiemes: 3000, acompte_nature: 'acompte', acompte_a_la_signature: true };
// 2b-3 : les assurances d'une situation — REMPLACENT celles du décor (la
// décennale de A, jointe et valable). `pro` : A ou B ; `chemin` : vrai (un
// fichier désigné dans le dossier de l'artisan), faux (aucun) ; `fin` : une
// date FIXE ou `null`.
const PASSEE = '2001-06-30';
const VALABLE = '2999-12-31';
const assurance = (nature, chemin, fin, pro = A) => ({ pro, nature, chemin, fin });
// 2b-5 : les LIEUX DE DÉPÔT des déchets (46.2 bis) d'une situation, posés en
// superutilisateur dans son savepoint (`lieux`). Des identifiants FIXES : LA1
// et LA2 à A, LB1 à B (un AUTRE artisan : son lieu ne vaut jamais pour le
// devis de A), LX jamais posé (l'ORPHELIN : un lieu retiré depuis « Mon
// entreprise » laisse son identifiant dans le tableau du devis). Aucun lieu
// dans le décor : les 139 cas d'avant répondent « Non » et ne lisent rien.
const LA1 = 'b4950000-0000-4000-8000-0000000001a1';
const LA2 = 'b4950000-0000-4000-8000-0000000001a2';
const LB1 = 'b4950000-0000-4000-8000-0000000001b1';
const LX = 'b4950000-0000-4000-8000-0000000001ff';
const lieu = (id, pro = A) => ({ id, pro });
const LIEU_A = [lieu(LA1)];
const LIEUX_A_ET_B = [lieu(LA1), lieu(LB1, B)];
// 2b-5 : les DÉCHETS d'un devis où les quatre rubriques sont dites (la
// quantité ET son unité, le tri, un lieu de A, le coût), à « Oui ». Une
// situation en retire une, ou change la réponse.
const DECHETS = {
  dechets_concerne: true, dechets_quantite_milliemes: 2500, dechets_unite: 'm3', dechets_flux: ['bois', 'platre'],
  dechets_lieux: [LA1], dechets_cout_centimes: 15000,
};
// 2b-6 : les SIGNES DE QUALITÉ (46.2 ter) et les SOUS-TRAITANTS (46.2 quater)
// d'une situation, posés en superutilisateur dans son savepoint (`labels`,
// `sousTraitants`), AVANT de devenir A. Des identifiants FIXES : GA1 et GA2
// à A, GB1 à B ; TA1 et TA2 à A, TB1 à B ; TX jamais posé (l'ORPHELIN). Les
// dates sont FIXES (2001 ou 2999, la garde des assurances) : les cas « au
// jour de Paris » vivent dans l'essai 49-remise seul. Aucune ligne dans le
// décor : les 184 cas d'avant répondent « Aucun » et ne lisent rien.
const GA1 = 'b4960000-0000-4000-8000-0000000002a1';
const GA2 = 'b4960000-0000-4000-8000-0000000002a2';
const GB1 = 'b4960000-0000-4000-8000-0000000002b1';
const TA1 = 'b4960000-0000-4000-8000-0000000003a1';
const TA2 = 'b4960000-0000-4000-8000-0000000003a2';
const TB1 = 'b4960000-0000-4000-8000-0000000003b1';
const TX = 'b4960000-0000-4000-8000-0000000003ff';
// Un signe : (identifiant, travaux couverts, date de fin, certificat joint ?, entreprise).
const signe = (id, categories, fin, joint = true, pro = A) => ({ id, pro, categories, fin, joint });
// Un sous-traitant : (identifiant, son label — null, false ou true —, ses travaux, sa
// date, justificatif joint ?, entreprise). Sous « Oui », les travaux et la date sont
// obligatoires (la croisée `emetteur_sous_traitant_complet_check`).
const sousTraitant = (id, detient, { categories = null, fin = null, joint = false } = {}, pro = A) =>
  ({ id, pro, detient, categories, fin, joint });
// Les combles cochés, la sous-traitance « Non » : la base des situations du rang 14.
const COMBLES = { energie_travaux: ['isolation_combles'], energie_sous_traitance: false };
// Les combles DÉCLARÉS sans label : seule la sous-traitance peut encore parler.
const COMBLES_DECLARES = { energie_travaux: ['isolation_combles'], energie_sans_label: ['isolation_combles'] };

const SITUATIONS = [
  // --- rien ne manque, et ce qui ne compte pas
  { nom: 'franchise, devis complet, un poste à 0 : rien ne manque', e: 'franchise', lignes: UN_POSTE_0 },
  { nom: 'réel, devis complet, un poste à 20 % : seul conso_tva_intra (règle d’Opus)', e: 'reel', lignes: UN_POSTE_20 },
  { nom: 'franchise, frais de déplacement offerts (0) : rien ne manque', e: 'frais_offerts', lignes: UN_POSTE_0 },
  { nom: 'franchise, frais en texte seulement : rien ne manque', e: 'frais_texte', lignes: UN_POSTE_0 },
  // --- devis_client
  { nom: 'sans client', e: 'franchise', devis: { client_id: null }, lignes: UN_POSTE_0 },
  // --- devis_lignes
  { nom: 'aucune ligne', e: 'franchise', lignes: [] },
  { nom: 'zone, pièce et réserve seulement', e: 'franchise', lignes: [titre('zone'), titre('piece'), titre('reserve')] },
  { nom: 'une option seule (à 0)', e: 'franchise', lignes: [option(22000, 0)] },
  { nom: 'un poste OFFERT seul : c’est un poste', e: 'franchise', lignes: [poste(4500, 0, { offert: true })] },
  { nom: 'une réserve et un poste', e: 'franchise', lignes: [titre('reserve'), poste(100000, 0)] },
  // --- rang 3 : devis_taux_franchise (la loi) et devis_taux_sans_tva (une
  //     prudence) — deux clés depuis la relecture de 2b-1 (TXT-1)
  { nom: 'franchise, un poste à 20 %', e: 'franchise', lignes: [poste(100000, 2000)] },
  { nom: 'franchise, une option à 10 % (et un poste juste)', e: 'franchise', lignes: [poste(100000, 0), option(10000, 1000)] },
  { nom: 'franchise, un poste OFFERT à 5,5 %', e: 'franchise', lignes: [poste(100000, 0), poste(4500, 550, { offert: true })] },
  { nom: 'franchise, trois fautives écrites dans le désordre (ordre 3000, 1000, 2000) et une juste',
    e: 'franchise',
    lignes: [poste(10000, 2000, { ordre: 3000 }), poste(10000, 0, { ordre: 500 }), option(10000, 1000, { ordre: 1000 }), poste(10000, 550, { ordre: 2000 })] },
  // L'identifiant de la SECONDE écrite est le plus petit : un miroir qui ne
  // rangerait que par `ordre` (et garderait l'ordre d'écriture) se tromperait.
  { nom: 'franchise, deux fautives au MÊME ordre : départagées par l’identifiant, pas par l’ordre d’écriture',
    e: 'franchise',
    lignes: [poste(10000, 0, { ordre: 500 }), poste(10000, 2000, { ordre: 1000, id: 9 }), option(10000, 2000, { ordre: 1000, id: 8 })] },
  { nom: 'réel, un poste à 0', e: 'reel', lignes: [poste(100000, 0)] },
  { nom: 'réel, une option OFFERTE à 0 et un poste à 20 %', e: 'reel', lignes: [poste(100000, 2000), option(10000, 0, { offert: true })] },
  { nom: 'réel, postes et options à 20, 10, 5,5 % : aucune fautive', e: 'reel',
    lignes: [poste(100000, 2000), poste(50000, 1000), option(20000, 550), poste(3000, 550)] },
  { nom: 'régime non déclaré (fiche sans régime) : aucune ligne fautive, regime_tva', e: 'sans_regime',
    lignes: [poste(100000, 2000), option(10000, 0)] },
  { nom: 'aucune fiche « Mon entreprise » : aucune ligne fautive, les motifs de l’entreprise', e: 'vide',
    lignes: [poste(100000, 2000), poste(10000, 0)] },
  // --- devis_lieu
  { nom: 'lieu vide (les trois colonnes)', e: 'franchise', devis: { lieu_adresse: null, lieu_code_postal: null, lieu_ville: null }, lignes: UN_POSTE_0 },
  { nom: 'lieu : la ville seule', e: 'franchise', devis: { lieu_adresse: null, lieu_code_postal: null }, lignes: UN_POSTE_0 },
  { nom: 'lieu : le code postal seul', e: 'franchise', devis: { lieu_adresse: null, lieu_ville: null }, lignes: UN_POSTE_0 },
  { nom: 'lieu : l’adresse seule', e: 'franchise', devis: { lieu_code_postal: null, lieu_ville: null }, lignes: UN_POSTE_0 },
  { nom: 'lieu fait de blancs (rangé vide par la base)', e: 'franchise',
    devis: { lieu_adresse: '   ', lieu_code_postal: ' ', lieu_ville: '  ' }, lignes: UN_POSTE_0 },
  // La base ne compte PAS l'espace fine (U+202F) parmi les blancs de la VILLE
  // (`tient_le_devis()` : seulement pour le code postal) : une ville faite d'un
  // U+202F, écrite par le chemin d'un client, est rangée telle quelle, et le
  // lieu passe pour écrit. Le miroir rend ce que la base rend (correction de
  // la vérification du lot 2b-1, point 6) ; corriger la classe des blancs est
  // une affaire du lot S, pas d'ici.
  { nom: 'lieu : une ville faite d’une seule espace fine (U+202F) — rangée telle quelle par la base, le lieu passe pour écrit',
    e: 'franchise', devis: { lieu_adresse: null, lieu_code_postal: null, lieu_ville: '\u202f' }, lignes: UN_POSTE_0 },
  // --- devis_delai, devis_validite
  { nom: 'délai vide', e: 'franchise', devis: { delai_execution: null }, lignes: UN_POSTE_0 },
  { nom: 'délai fait de blancs (rangé vide par la base)', e: 'franchise', devis: { delai_execution: '   ' }, lignes: UN_POSTE_0 },
  { nom: 'validité vide', e: 'franchise', devis: { validite_jours: null }, lignes: UN_POSTE_0 },
  // --- devis_acompte_nature
  { nom: 'acompte de 30 % sans nature', e: 'franchise', devis: { acompte_centiemes: 3000 }, lignes: UN_POSTE_0 },
  { nom: 'acompte de 100,00 € sans nature', e: 'franchise', devis: { acompte_centimes: 10000 }, lignes: UN_POSTE_0 },
  { nom: 'acompte de 30 %, nature « acompte »', e: 'franchise', devis: { acompte_centiemes: 3000, acompte_nature: 'acompte' }, lignes: UN_POSTE_0 },
  { nom: 'acompte de 100,00 €, nature « arrhes »', e: 'franchise', devis: { acompte_centimes: 10000, acompte_nature: 'arrhes' }, lignes: UN_POSTE_0 },
  // --- devis_acompte_ramene
  { nom: 'acompte de 2 000,00 € sur un TTC de 1 000,00 € : ramené', e: 'franchise',
    devis: { acompte_centimes: 200000, acompte_nature: 'acompte' }, lignes: UN_POSTE_0 },
  { nom: 'acompte de 1 000,00 € = le TTC : pas ramené', e: 'franchise',
    devis: { acompte_centimes: 100000, acompte_nature: 'acompte' }, lignes: UN_POSTE_0 },
  { nom: 'acompte de 1 000,01 € : ramené d’un centime', e: 'franchise',
    devis: { acompte_centimes: 100001, acompte_nature: 'acompte' }, lignes: UN_POSTE_0 },
  { nom: 'acompte de 100 % : jamais ramené', e: 'franchise',
    devis: { acompte_centiemes: 10000, acompte_nature: 'arrhes' }, lignes: UN_POSTE_0 },
  { nom: 'acompte en euros ramené ET sans nature : les deux, dans l’ordre des rangs', e: 'franchise',
    devis: { acompte_centimes: 200000 }, lignes: UN_POSTE_0 },
  { nom: 'acompte de 50,00 € sur un devis tout offert (TTC 0) : ramené', e: 'franchise',
    devis: { acompte_centimes: 5000, acompte_nature: 'acompte' }, lignes: [poste(4500, 0, { offert: true })] },
  { nom: 'réel : acompte de 1 200,00 € sur un TTC de 1 200,00 € (1 000,00 € HT à 20 %) : pas ramené', e: 'reel',
    devis: { acompte_centimes: 120000, acompte_nature: 'acompte' }, lignes: UN_POSTE_20 },
  { nom: 'réel : acompte de 1 200,01 € : ramené', e: 'reel',
    devis: { acompte_centimes: 120001, acompte_nature: 'acompte' }, lignes: UN_POSTE_20 },
  // --- devis_reduction_ramenee
  { nom: 'réduction de 2 000,00 € sur un brut de 1 000,00 € : ramenée', e: 'franchise', devis: { remise_centimes: 200000 }, lignes: UN_POSTE_0 },
  { nom: 'réduction de 1 000,00 € = le brut : pas ramenée', e: 'franchise', devis: { remise_centimes: 100000 }, lignes: UN_POSTE_0 },
  { nom: 'réduction de 500,00 €', e: 'franchise', devis: { remise_centimes: 50000 }, lignes: UN_POSTE_0 },
  { nom: 'réduction de 100 % : jamais ramenée', e: 'franchise', devis: { remise_centiemes: 10000 }, lignes: UN_POSTE_0 },
  { nom: 'réduction de 0,01 € sans aucun poste : devis_lignes puis ramenée', e: 'franchise', devis: { remise_centimes: 1 }, lignes: [] },
  { nom: 'réduction de 10,00 € sur un poste OFFERT seul (brut 0) : ramenée', e: 'franchise',
    devis: { remise_centimes: 1000 }, lignes: [poste(4500, 0, { offert: true })] },
  { nom: 'réel : réduction de 10 % et acompte de 2 000,00 € ramené', e: 'reel',
    devis: { remise_centiemes: 1000, acompte_centimes: 200000, acompte_nature: 'acompte' }, lignes: UN_POSTE_20 },
  { nom: 'réduction de 1 000,00 € sur deux taux (brut 600,00 €) : ramenée', e: 'reel',
    devis: { remise_centimes: 100000 }, lignes: [poste(30000, 2000), poste(30000, 1000)] },
  // --- combinaisons
  { nom: 'un devis NEUF (rien de dit, sauf « gratuit ») : client, lignes, lieu, délai, validité', e: 'franchise', devis: VIDE, lignes: [] },
  { nom: 'les neuf rangs du devis à la fois (le rang 3 en franchise)', e: 'franchise',
    devis: { ...VIDE, acompte_centimes: 5000, remise_centimes: 100 }, lignes: [option(10000, 2000)] },
  { nom: 'un devis neuf (rien de dit, sauf « gratuit ») et AUCUNE fiche : les motifs du devis puis ceux de l’entreprise', e: 'vide', devis: VIDE, lignes: [] },
  // --- les motifs de l'entreprise
  { nom: 'entreprise sans frais déclarés : frais_deplacement (règle d’Opus)', e: 'sans_frais', lignes: UN_POSTE_0 },
  { nom: 'entreprise à peine remplie (téléphone, franchise)', e: 'partielle', lignes: UN_POSTE_0 },
  { nom: 'entreprise lue il y a plus d’un an, réel sans TVA, sans frais : les trois règles d’Opus', e: 'ancienne_reel', lignes: UN_POSTE_20 },
  { nom: 'architecte : la profession réglementée, une prudence', e: 'architecte', lignes: UN_POSTE_0 },
  // --- D4-c : l'origine ne change rien (les mêmes motifs que les cas voisins)
  { nom: 'D4-c : devis venu d’une demande (et d’une urgence), sans délai', e: 'franchise',
    devis: { quote_request_id: QA, sos_request_id: SA, source: 'demande', delai_execution: null }, lignes: UN_POSTE_0 },
  { nom: 'D4-c : devis venu d’une urgence, sans délai', e: 'franchise',
    devis: { sos_request_id: SA, source: 'urgence', delai_execution: null }, lignes: UN_POSTE_0 },
  { nom: 'D4-c : devis ouvert à la main, sans délai', e: 'franchise',
    devis: { source: 'manuelle', delai_execution: null }, lignes: UN_POSTE_0 },
  // --- ajoutés par la correction de la relecture de 2b-1 (05/11/2026), À LA
  //     FIN pour que les numéros des cas déjà là ne bougent pas
  // TXT-1 : au régime réel, une ligne à 0 est une PRUDENCE (la sous-traitance
  // en autoliquidation la permet) — seule de la liste quand l'entreprise a un
  // n° de TVA connu ; et la même avec une option offerte et une fautive au
  // MÊME ordre, départagées par l'identifiant.
  { nom: 'réel avec n° de TVA, un poste à 0 : devis_taux_sans_tva seul (une prudence)', e: 'reel_tva', lignes: [poste(100000, 0)] },
  { nom: 'réel avec n° de TVA, trois fautives (poste, option offerte, option) dont deux au même ordre', e: 'reel_tva',
    lignes: [poste(10000, 0, { ordre: 3000 }), poste(10000, 2000, { ordre: 500 }), option(10000, 0, { ordre: 1000, id: 9, offert: true }),
      option(10000, 0, { ordre: 1000, id: 8 })] },
  // BASE-1 : la liste vérifie une PRÉSENCE, pas un sens. Un délai fait d'un
  // seul U+3000 (espace idéographique, hors de la classe de blancs du
  // projet) est rangé tel quel par la base, et ne rend PAS devis_delai. Le
  // miroir doit rendre la même chose : ce cas FIGE le comportement actuel,
  // jusqu'à ce que la classe soit élargie dans toutes ses copies à la fois.
  { nom: 'délai fait d’un seul U+3000 — hors de la classe de blancs, rangé tel quel : pas de devis_delai', e: 'franchise',
    devis: { delai_execution: '\u3000' }, lignes: UN_POSTE_0 },
  // PAR-6 : D4-c sur un devis NEUF VIDE (aucun client, lieu, délai, validité,
  // aucun poste) : chacun des motifs du devis est alors éprouvé contre chaque
  // origine — le cas « un devis NEUF » plus haut est celui ouvert à la main.
  { nom: 'D4-c : devis NEUF VIDE (rien de dit, sauf « gratuit ») venu d’une urgence', e: 'franchise',
    devis: { ...VIDE, sos_request_id: SA, source: 'urgence' }, lignes: [] },
  { nom: 'D4-c : devis NEUF VIDE (rien de dit, sauf « gratuit ») venu d’une demande ET d’une urgence', e: 'franchise',
    devis: { ...VIDE, quote_request_id: QA, sos_request_id: SA, source: 'demande' }, lignes: [] },
  // --- 2b-2, À LA FIN pour que les numéros des cas déjà là ne bougent pas.
  //     « À quel titre ? » : la réponse ne vaut que pour le client à qui elle
  //     a été donnée ; le rang 1 est EXCLUSIF.
  { nom: 'à quel titre : un client, aucune réponse — devis_pour_qui seul (règle d’Opus)', e: 'franchise',
    devis: { pour_qui: null, pour_qui_client: null }, lignes: UN_POSTE_0 },
  { nom: 'à quel titre : la réponse donnée pour un AUTRE client ne vaut rien — devis_pour_qui', e: 'franchise',
    devis: { pour_qui: 'consommateur', pour_qui_client: C2 }, lignes: UN_POSTE_0 },
  { nom: 'à quel titre : une réponse sans témoin ne vaut rien — devis_pour_qui', e: 'franchise',
    devis: { pour_qui: 'consommateur', pour_qui_client: null }, lignes: UN_POSTE_0 },
  { nom: 'à quel titre : un témoin sans réponse — devis_pour_qui', e: 'franchise',
    devis: { pour_qui: null, pour_qui_client: C1 }, lignes: UN_POSTE_0 },
  { nom: 'à quel titre : le client a CHANGÉ (C2), la réponse est restée celle de C1 — devis_pour_qui', e: 'franchise',
    devis: { client_id: C2, pour_qui: 'consommateur', pour_qui_client: C1 }, lignes: UN_POSTE_0 },
  { nom: 'à quel titre : réponse posée, client vide, témoin vide — devis_client SEUL au rang 1, et toutes les mentions',
    e: 'partielle_reel', devis: { client_id: null, pour_qui: 'professionnel', pour_qui_client: null }, lignes: UN_POSTE_20 },
  { nom: 'à quel titre : la fiche du client supprimée (le lien passe à vide) — devis_client, et toutes les mentions comptent',
    e: 'partielle_reel', devis: { pour_qui: 'professionnel' }, lignes: UN_POSTE_20,
    apres: `delete from public.clients where id = '${C1}';` },
  //     Le filtre et les natures, sur une entreprise à qui manquent beaucoup
  //     de mentions dues à un particulier.
  { nom: 'à titre privé (consommateur) : toutes les mentions dues à un particulier, en « loi » (sauf conso_tva_intra)',
    e: 'partielle_reel', lignes: UN_POSTE_20 },
  { nom: 'association, copropriété, société civile : toutes les mentions, en « prudence » — conso_tva_intra reste une règle d’Opus',
    e: 'partielle_reel', devis: { pour_qui: 'non_professionnel' }, lignes: UN_POSTE_20 },
  { nom: 'petite entreprise hors de son activité principale : toutes les mentions, en « loi »', e: 'partielle_reel',
    devis: { pour_qui: 'professionnel_hors_activite' }, lignes: UN_POSTE_20 },
  { nom: 'pour son entreprise, dans son activité principale : plus aucun conso_ sauf les deux adresses (en prudence), rangs À TROUS',
    e: 'partielle_reel', devis: { pour_qui: 'professionnel' }, lignes: UN_POSTE_20 },
  { nom: 'pour son entreprise, sans aucune fiche « Mon entreprise » : le filtre, les trous, le reste de l’entreprise',
    e: 'vide', devis: { pour_qui: 'professionnel' }, lignes: UN_POSTE_20 },
  { nom: 'pour son entreprise, au réel sans n° de TVA : conso_tva_intra ne compte plus — rien ne manque', e: 'reel',
    devis: { pour_qui: 'professionnel' }, lignes: UN_POSTE_20 },
  { nom: 'au réel, numéro DÉCLARÉ sur l’honneur : la déclaration éteint conso_tva_intra — rien ne manque', e: 'reel_declare',
    lignes: UN_POSTE_20 },
  //     Le taux réduit d'un chantier qui crée un bâtiment neuf : la question
  //     TVA, et elle seule.
  { nom: 'chantier neuf (question TVA à « Oui »), un poste à 10 % : devis_taux_reduit_neuf seul (une prudence)', e: 'reel_tva',
    devis: { chantier_neuf_tva: true }, lignes: [poste(100000, 1000)] },
  { nom: 'chantier neuf : 10 %, 0 %, option 5,5 %, 20 %, offert 10 %, 0 % — les deux clés de rang 3 ALTERNENT, dans l’ordre des lignes',
    e: 'reel_tva', devis: { chantier_neuf_tva: true },
    lignes: [poste(10000, 1000, { ordre: 1000 }), poste(10000, 0, { ordre: 2000 }), option(10000, 550, { ordre: 3000 }),
      poste(10000, 2000, { ordre: 4000 }), poste(4500, 1000, { ordre: 5000, offert: true }), poste(10000, 0, { ordre: 6000 })] },
  { nom: 'chantier neuf écrit dans le désordre, deux lignes au même ordre : départagées par l’identifiant', e: 'reel_tva',
    devis: { chantier_neuf_tva: true },
    lignes: [poste(10000, 550, { ordre: 3000 }), poste(10000, 1000, { ordre: 1000, id: 9 }), option(10000, 0, { ordre: 1000, id: 8 })] },
  { nom: 'chantier neuf en FRANCHISE : la clé de la franchise, jamais celle du neuf', e: 'franchise',
    devis: { chantier_neuf_tva: true }, lignes: [poste(100000, 1000)] },
  { nom: 'chantier neuf, régime non déclaré : aucune ligne fautive', e: 'sans_regime',
    devis: { chantier_neuf_tva: true }, lignes: [poste(100000, 1000)] },
  { nom: 'question des DROITS du client à « Oui », question TVA vide : rien au rang 3', e: 'reel_tva',
    devis: { chantier_neuf_conso: true }, lignes: [poste(100000, 1000)] },
  { nom: 'question TVA à « Non » (faux, pas vide) : rien au rang 3', e: 'reel_tva',
    devis: { chantier_neuf_tva: false }, lignes: [poste(100000, 1000), option(10000, 550)] },
  // --- 2b-3, À LA FIN pour que les numéros des cas déjà là ne bougent pas.
  //     Le rang 10 : « à la signature », un acompte, et aucun des deux cas
  //     qu'Opus permet (`signaturePermise`). Une PRUDENCE. Le bâtiment neuf
  //     n'en est plus un depuis la décision du 13/11 (code de la
  //     construction, L. 271-1 et L. 271-2) : son cas garde sa place et son
  //     numéro, et attend désormais le rang 10.
  { nom: 'à la signature, à titre privé, un poste non marqué : devis_acompte_signature seul (une prudence)', e: 'franchise',
    devis: SIGNATURE, lignes: UN_POSTE_0 },
  { nom: 'à la signature, à titre privé, toutes les lignes chiffrées marquées « réparation urgente » : permis, rien ne manque',
    e: 'franchise', devis: SIGNATURE, lignes: [urgent(100000, 0), urgent(20000, 0)] },
  { nom: 'à la signature, à titre privé, deux postes dont un seul marqué : le rang 10', e: 'franchise',
    devis: SIGNATURE, lignes: [urgent(100000, 0), poste(20000, 0)] },
  { nom: 'à la signature, à titre privé, un poste marqué et une OPTION (jamais marquable) : le rang 10', e: 'franchise',
    devis: SIGNATURE, lignes: [urgent(100000, 0), option(20000, 0)] },
  { nom: 'à la signature, à titre privé, un poste marqué et un poste OFFERT non marqué : le rang 10', e: 'franchise',
    devis: SIGNATURE, lignes: [urgent(100000, 0), poste(4500, 0, { offert: true })] },
  { nom: 'à la signature, à titre privé, un poste OFFERT marqué, une zone et une réserve : permis (les titres ne comptent pas)',
    e: 'franchise', devis: SIGNATURE, lignes: [titre('zone'), urgent(100000, 0), urgent(4500, 0, { offert: true }), titre('reserve')] },
  { nom: 'à la signature, pour son entreprise dans son activité principale, rien de marqué : permis', e: 'franchise',
    devis: { ...SIGNATURE, pour_qui: 'professionnel' }, lignes: UN_POSTE_0 },
  { nom: 'à la signature, à titre privé, « Oui » à la question des DROITS (bâtiment neuf) : le rang 10 (le bâtiment neuf ne permet plus, 13/11)',
    e: 'franchise', devis: { ...SIGNATURE, chantier_neuf_conso: true }, lignes: UN_POSTE_0 },
  { nom: 'à la signature, petite entreprise hors de son activité principale, tout marqué : le rang 10 (l’urgence ne lève pas le 8e jour)',
    e: 'franchise', devis: { ...SIGNATURE, pour_qui: 'professionnel_hors_activite' }, lignes: [urgent(100000, 0)] },
  { nom: 'à la signature, association, copropriété ou société civile, tout marqué : permis', e: 'franchise',
    devis: { ...SIGNATURE, pour_qui: 'non_professionnel' }, lignes: [urgent(100000, 0)] },
  { nom: 'à la signature, association, copropriété ou société civile, rien de marqué : le rang 10', e: 'franchise',
    devis: { ...SIGNATURE, pour_qui: 'non_professionnel' }, lignes: UN_POSTE_0 },
  { nom: 'à la signature, AUCUNE réponse « à quel titre », tout marqué : devis_pour_qui ET le rang 10 (une réponse vide ne permet rien)',
    e: 'franchise', devis: { ...SIGNATURE, pour_qui: null, pour_qui_client: null }, lignes: [urgent(100000, 0)] },
  { nom: 'à la signature, réponse donnée pour un AUTRE client, tout marqué : devis_pour_qui ET le rang 10', e: 'franchise',
    devis: { ...SIGNATURE, pour_qui: 'consommateur', pour_qui_client: C2 }, lignes: [urgent(100000, 0)] },
  { nom: 'à la signature, sans client, tout marqué : devis_client ET le rang 10', e: 'franchise',
    devis: { ...SIGNATURE, client_id: null }, lignes: [urgent(100000, 0)] },
  { nom: 'à la signature, SANS acompte : rien (le rang 10 exige un acompte)', e: 'franchise',
    devis: { acompte_a_la_signature: true }, lignes: UN_POSTE_0 },
  { nom: 'à la signature, un acompte de 100,00 € (en euros) : le rang 10', e: 'franchise',
    devis: { acompte_centimes: 10000, acompte_nature: 'arrhes', acompte_a_la_signature: true }, lignes: UN_POSTE_0 },
  { nom: 'à la signature, aucune ligne : devis_lignes ET le rang 10 (aucune ligne chiffrée = « pas toutes »)', e: 'franchise',
    devis: SIGNATURE, lignes: [] },
  { nom: 'à la signature, des titres et une réserve seulement : devis_lignes ET le rang 10', e: 'franchise',
    devis: SIGNATURE, lignes: [titre('zone'), titre('piece'), titre('reserve')] },
  { nom: '« Dès le 8e jour » (faux, pas vide), un acompte, rien de marqué : rien au rang 10', e: 'franchise',
    devis: { ...SIGNATURE, acompte_a_la_signature: false }, lignes: UN_POSTE_0 },
  { nom: 'à la signature au réel, à titre privé, rien de marqué : le rang 10 puis conso_tva_intra', e: 'reel',
    devis: SIGNATURE, lignes: UN_POSTE_20 },
  //     Le rang 11 : l'attestation décennale. Vide = « Oui », par prudence ;
  //     « Non » ne lit rien ; une clé au plus.
  { nom: 'décennale sans réponse, aucune assurance : devis_decennale seul (une prudence)', e: 'franchise',
    assur: [], lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », aucune assurance : devis_attestation (la loi)', e: 'franchise',
    devis: { engage_decennale: true }, assur: [], lignes: UN_POSTE_0 },
  { nom: 'décennale « Non », aucune assurance : rien', e: 'franchise',
    devis: { engage_decennale: false }, assur: [], lignes: UN_POSTE_0 },
  { nom: 'décennale sans réponse, attestation jointe SANS date : devis_decennale (la réponse vide l’emporte)', e: 'franchise',
    assur: [assurance('decennale', true, null)], lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », attestation jointe SANS date de fin : devis_attestation_date (une prudence)', e: 'franchise',
    devis: { engage_decennale: true }, assur: [assurance('decennale', true, null)], lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », attestation jointe PASSÉE : devis_attestation', e: 'franchise',
    devis: { engage_decennale: true }, assur: [assurance('decennale', true, PASSEE)], lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », date valable mais AUCUN fichier joint : devis_attestation', e: 'franchise',
    devis: { engage_decennale: true }, assur: [assurance('decennale', false, VALABLE)], lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », une jointe sans date ET une jointe passée : devis_attestation_date', e: 'franchise',
    devis: { engage_decennale: true }, assur: [assurance('decennale', true, PASSEE), assurance('decennale', true, null)],
    lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », une RC professionnelle seule, jointe et valable : devis_attestation (une RC pro ne compte jamais)',
    e: 'franchise', devis: { engage_decennale: true }, assur: [assurance('rc_pro', true, VALABLE)], lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », une passée et une VALABLE : rien (une seule suffit)', e: 'franchise',
    devis: { engage_decennale: true }, assur: [assurance('decennale', true, PASSEE), assurance('decennale', true, VALABLE)],
    lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », la seule valable est celle d’un AUTRE artisan (B) : devis_attestation', e: 'franchise',
    devis: { engage_decennale: true }, assur: [assurance('decennale', true, VALABLE, B)], lignes: UN_POSTE_0 },
  { nom: 'décennale sans réponse, la seule valable est celle d’un AUTRE artisan (B) : devis_decennale', e: 'franchise',
    assur: [assurance('decennale', true, VALABLE, B)], lignes: UN_POSTE_0 },
  { nom: 'décennale « Non », celle d’un autre artisan seulement : rien', e: 'franchise',
    devis: { engage_decennale: false }, assur: [assurance('decennale', true, VALABLE, B)], lignes: UN_POSTE_0 },
  { nom: 'décennale « Non », attestation jointe sans date : rien (« Non » ne lit rien)', e: 'franchise',
    devis: { engage_decennale: false }, assur: [assurance('decennale', true, null)], lignes: UN_POSTE_0 },
  { nom: 'décennale « Oui », l’attestation du décor (jointe, valable) : rien', e: 'franchise',
    devis: { engage_decennale: true }, lignes: UN_POSTE_0 },
  { nom: 'le rang 10 ET le rang 11 dans le même devis, dans l’ordre des rangs', e: 'franchise',
    devis: { ...SIGNATURE, engage_decennale: true }, assur: [assurance('decennale', true, PASSEE)], lignes: UN_POSTE_0 },
  { nom: 'un devis NEUF (rien de dit, sauf « gratuit ») et aucune assurance : client, lignes, lieu, délai, validité, puis devis_decennale',
    e: 'franchise', devis: VIDE, assur: [], lignes: [] },
  // --- La décision du 13/11 (R1), À LA FIN pour que les numéros des cas déjà
  //     là ne bougent pas : le bâtiment neuf ne permet plus « à la
  //     signature », mais il n'EMPÊCHE rien non plus — l'urgence et « pour son
  //     entreprise » permettent toujours sur ce chantier, et une association
  //     qui n'a pas tout marqué garde le rang 10.
  { nom: 'à la signature, à titre privé, bâtiment neuf ET toutes les lignes marquées « réparation urgente » : permis (l’urgence permet toujours)',
    e: 'franchise', devis: { ...SIGNATURE, chantier_neuf_conso: true }, lignes: [urgent(100000, 0), urgent(20000, 0)] },
  { nom: 'à la signature, pour son entreprise dans son activité principale, bâtiment neuf : permis', e: 'franchise',
    devis: { ...SIGNATURE, pour_qui: 'professionnel', chantier_neuf_conso: true }, lignes: UN_POSTE_0 },
  { nom: 'à la signature, association, copropriété ou société civile, bâtiment neuf, rien de marqué : le rang 10', e: 'franchise',
    devis: { ...SIGNATURE, pour_qui: 'non_professionnel', chantier_neuf_conso: true }, lignes: UN_POSTE_0 },
  // --- 2b-4, À LA FIN pour que les numéros des cas déjà là ne bougent pas.
  //     Le rang 12 : le prix du devis lui-même pas encore dit
  //     (`cout_devis_centimes` vide), une PRUDENCE (réponse Q2 du 16/11). 0
  //     (gratuit) et un montant (payant) le taisent pareil ; il ne lit ni la
  //     réponse « à quel titre », ni l'origine. Le PREMIER cas est sur une
  //     fiche complète EN FRANCHISE : au régime réel, `conso_tva_intra`
  //     s'ajouterait, et la couverture de `verifier-devis` (un motif SEUL de
  //     toute la liste) ne le compterait pas.
  { nom: 'prix du devis lui-même vide, devis complet en franchise : devis_cout seul (une prudence)', e: 'franchise',
    devis: { cout_devis_centimes: null }, lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même à 0 (gratuit) : rien ne manque', e: 'franchise',
    devis: { cout_devis_centimes: 0 }, lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même à 3 000 centimes (payant) : rien ne manque', e: 'franchise',
    devis: { cout_devis_centimes: 3000 }, lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même vide ET validité vide : le rang 6 puis le rang 12', e: 'franchise',
    devis: { cout_devis_centimes: null, validite_jours: null }, lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même vide ET décennale sans réponse, aucune assurance : le rang 11 puis le rang 12', e: 'franchise',
    devis: { cout_devis_centimes: null }, assur: [], lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même vide, au régime réel sans n° de TVA : devis_cout puis conso_tva_intra', e: 'reel',
    devis: { cout_devis_centimes: null }, lignes: UN_POSTE_20 },
  { nom: 'prix du devis lui-même vide, à titre privé (consommateur) : devis_cout', e: 'franchise',
    devis: { cout_devis_centimes: null, pour_qui: 'consommateur' }, lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même vide, pour son entreprise dans son activité principale : devis_cout (la réponse ne le lève pas)',
    e: 'franchise', devis: { cout_devis_centimes: null, pour_qui: 'professionnel' }, lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même vide, petite entreprise hors de son activité principale : devis_cout', e: 'franchise',
    devis: { cout_devis_centimes: null, pour_qui: 'professionnel_hors_activite' }, lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même vide, association, copropriété ou société civile : devis_cout', e: 'franchise',
    devis: { cout_devis_centimes: null, pour_qui: 'non_professionnel' }, lignes: UN_POSTE_0 },
  { nom: 'prix du devis lui-même vide, sans client : le rang 1 puis le rang 12', e: 'franchise',
    devis: { cout_devis_centimes: null, client_id: null }, lignes: UN_POSTE_0 },
  //     D4-c sur un devis NEUF VIDE SANS PRIX : le motif de 2b-4 éprouvé
  //     contre chaque origine (ouvert à la main ; venu d'une urgence ; venu
  //     d'une demande ET d'une urgence) — les trois doivent rendre la MÊME
  //     liste, `devis_cout` compris.
  { nom: 'D4-c : devis NEUF VIDE SANS PRIX ouvert à la main', e: 'franchise',
    devis: { ...VIDE, cout_devis_centimes: null, source: 'manuelle' }, lignes: [] },
  { nom: 'D4-c : devis NEUF VIDE SANS PRIX venu d’une urgence', e: 'franchise',
    devis: { ...VIDE, cout_devis_centimes: null, sos_request_id: SA, source: 'urgence' }, lignes: [] },
  { nom: 'D4-c : devis NEUF VIDE SANS PRIX venu d’une demande ET d’une urgence', e: 'franchise',
    devis: { ...VIDE, cout_devis_centimes: null, quote_request_id: QA, sos_request_id: SA, source: 'demande' }, lignes: [] },
  // --- 2b-5, À LA FIN pour que les numéros des cas déjà là ne bougent pas.
  //     Le rang 13 : les déchets du chantier. « Non » tait le rang ; « Oui »
  //     ou vide, et une des quatre rubriques manque (la quantité ou son unité,
  //     le tri, un lieu choisi qui existe chez A ou « Aucun dépôt », le coût) :
  //     `devis_dechets` (une prudence) pour la réponse vide,
  //     `devis_dechets_rubriques` (la loi) pour « Oui ». Une clé au plus. Les
  //     cas « seuls » sont EN FRANCHISE, sur une fiche complète : au régime
  //     réel, `conso_tva_intra` s'ajouterait, et la couverture de
  //     `verifier-devis` (un motif SEUL de toute la liste) ne le compterait pas.
  { nom: 'déchets sans réponse, rien de dit : devis_dechets seul (une prudence)', e: 'franchise',
    devis: { dechets_concerne: null }, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », rien de dit : devis_dechets_rubriques seul (la loi)', e: 'franchise',
    devis: { dechets_concerne: true }, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », les quatre rubriques dites, un lieu de A : rien ne manque', e: 'franchise',
    devis: DECHETS, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets SANS RÉPONSE, les quatre rubriques dites, un lieu de A : rien ne manque (la réponse vide ne demande que les rubriques)',
    e: 'franchise', devis: { ...DECHETS, dechets_concerne: null }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Non », des rubriques dites à moitié et un lieu orphelin : rien (« Non » ne lit rien)', e: 'franchise',
    devis: { dechets_concerne: false, dechets_flux: ['bois'], dechets_lieux: [LX] }, lignes: UN_POSTE_0 },
  //     Chaque rubrique seule manquante, à « Oui ».
  { nom: 'déchets « Oui », la quantité manque : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_quantite_milliemes: null }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », l’unité de la quantité manque : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_unite: null }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », le tri manque : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_flux: null }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », aucun lieu choisi et pas « Aucun dépôt » : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: null }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », le coût manque : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_cout_centimes: null }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », la quantité ET le coût manquent : une seule clé au rang 13', e: 'franchise',
    devis: { ...DECHETS, dechets_quantite_milliemes: null, dechets_cout_centimes: null }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets sans réponse, le tri seul manque : devis_dechets (la clé suit la réponse, pas la rubrique)', e: 'franchise',
    devis: { ...DECHETS, dechets_concerne: null, dechets_flux: null }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  //     Le tri : « Aucune collecte séparée » le remplit ; ce qui reste sur le
  //     chantier n'y compte jamais.
  { nom: 'déchets « Oui », tri « aucune collecte séparée » ({aucune}) : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_flux: ['aucune'] }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », « sur le chantier » seul (broyage), aucun tri : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_flux: null, dechets_sur_place: ['broyage'] }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », un tri ET « sur le chantier » (broyage, compostage) : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_sur_place: ['broyage', 'compostage'] }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », la quantité en tonnes : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_unite: 't' }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  //     Les lieux : un identifiant du devis ne prouve aucune appartenance.
  { nom: 'déchets « Oui », seul choisi un lieu ORPHELIN (retiré) : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: [LX] }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », seul choisi le lieu d’un AUTRE artisan (B) : devis_dechets_rubriques (le point reste)', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: [LB1] }, lieux: LIEUX_A_ET_B, lignes: UN_POSTE_0 },
  { nom: 'déchets sans réponse, seul choisi le lieu d’un AUTRE artisan (B) : devis_dechets', e: 'franchise',
    devis: { ...DECHETS, dechets_concerne: null, dechets_lieux: [LB1] }, lieux: LIEUX_A_ET_B, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », un orphelin ET un lieu de A : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: [LX, LA1] }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », le lieu de B ET un lieu de A : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: [LB1, LA1] }, lieux: LIEUX_A_ET_B, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », deux lieux de A : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: [LA1, LA2] }, lieux: [lieu(LA1), lieu(LA2)], lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », le MÊME lieu de A choisi deux fois (un doublon que la base ne refuse pas) : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: [LA1, LA1] }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  //     « Aucun dépôt » (réponse P6) remplit la rubrique des lieux — SEULEMENT
  //     si le tri ne nomme aucune sorte qui part à part (décision du 21/11,
  //     question DROIT-R2 : « Le signaler »). Le décor `DECHETS` trie le bois
  //     et le plâtre : ces deux cas, qui rendaient « rien ne manque » jusqu'à
  //     cette décision, rendent désormais le point — c'est voulu. Les cas qui
  //     prouvent la règle sont À LA FIN (les numéros d'avant ne bougent pas).
  { nom: 'déchets « Oui », « Aucun dépôt », le bois et le plâtre triés à part, aucun lieu choisi : devis_dechets_rubriques (des déchets partent, leur lieu manque)', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: null, dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », « Aucun dépôt », le bois et le plâtre triés à part, un lieu orphelin : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_lieux: [LX], dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  //     Le rang 13 parmi les autres : après le rang 12, avant l'entreprise ;
  //     il ne lit pas la réponse « à quel titre ».
  { nom: 'prix du devis lui-même vide ET déchets sans réponse : le rang 12 puis le rang 13', e: 'franchise',
    devis: { cout_devis_centimes: null, dechets_concerne: null }, lignes: UN_POSTE_0 },
  { nom: 'déchets « Oui », rien de dit, au régime réel sans n° de TVA : le rang 13 puis conso_tva_intra', e: 'reel',
    devis: { dechets_concerne: true }, lignes: UN_POSTE_20 },
  { nom: 'déchets « Oui », rien de dit, pour son entreprise dans son activité principale : devis_dechets_rubriques (la loi vise tout client)',
    e: 'franchise', devis: { dechets_concerne: true, pour_qui: 'professionnel' }, lignes: UN_POSTE_0 },
  { nom: 'déchets sans réponse, sans client : le rang 1 puis le rang 13', e: 'franchise',
    devis: { dechets_concerne: null, client_id: null }, lignes: UN_POSTE_0 },
  //     D4-c sur un devis NEUF VIDE SANS RÉPONSE AUX DÉCHETS : le motif de
  //     2b-5 éprouvé contre chaque origine — les trois rendent la MÊME liste,
  //     `devis_dechets` compris.
  { nom: 'D4-c : devis NEUF VIDE SANS RÉPONSE AUX DÉCHETS ouvert à la main', e: 'franchise',
    devis: { ...VIDE, dechets_concerne: null, source: 'manuelle' }, lignes: [] },
  { nom: 'D4-c : devis NEUF VIDE SANS RÉPONSE AUX DÉCHETS venu d’une urgence', e: 'franchise',
    devis: { ...VIDE, dechets_concerne: null, sos_request_id: SA, source: 'urgence' }, lignes: [] },
  { nom: 'D4-c : devis NEUF VIDE SANS RÉPONSE AUX DÉCHETS venu d’une demande ET d’une urgence', e: 'franchise',
    devis: { ...VIDE, dechets_concerne: null, quote_request_id: QA, sos_request_id: SA, source: 'demande' }, lignes: [] },
  // --- 2b-5, DROIT-R2 (décision du propriétaire du 21/11 : « Le signaler »),
  //     À LA FIN : « Aucun dépôt : rien ne quittera le chantier » ne remplit
  //     la rubrique des lieux que si le tri ne nomme aucune sorte qui part à
  //     part — vide de valeur (le tri manque alors de toute façon) ou
  //     exactement `{aucune}`. Un lieu choisi qui existe chez A remplit
  //     toujours la rubrique. « Sur le chantier » n'y change rien.
  { nom: 'DROIT-R2 : « Oui », « Aucun dépôt » et « Aucune collecte séparée » ({aucune}), aucun lieu : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_flux: ['aucune'], dechets_lieux: null, dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : « Oui », « Aucun dépôt », un tri VIDE DE VALEUR, aucun lieu : devis_dechets_rubriques (le tri manque, pas le lieu)',
    e: 'franchise', devis: { ...DECHETS, dechets_flux: null, dechets_lieux: null, dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : « Oui », « Aucun dépôt », le bois et le plâtre triés à part, ET un lieu de A : rien ne manque (le lieu existe)',
    e: 'franchise', devis: { ...DECHETS, dechets_lieux: [LA1], dechets_sans_depot: true }, lieux: LIEU_A, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : « Oui », « Aucun dépôt », le bois et le plâtre triés à part, et seul le lieu d’un AUTRE artisan (B) : devis_dechets_rubriques',
    e: 'franchise', devis: { ...DECHETS, dechets_lieux: [LB1], dechets_sans_depot: true }, lieux: LIEUX_A_ET_B, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : « Oui », « Aucun dépôt », les déchets dangereux à part, aucun lieu : devis_dechets_rubriques', e: 'franchise',
    devis: { ...DECHETS, dechets_flux: ['dangereux'], dechets_lieux: null, dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : SANS RÉPONSE, « Aucun dépôt », le bois et le plâtre triés à part, aucun lieu : devis_dechets (une prudence)',
    e: 'franchise', devis: { ...DECHETS, dechets_concerne: null, dechets_lieux: null, dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : SANS RÉPONSE, « Aucun dépôt » et {aucune}, aucun lieu : rien ne manque', e: 'franchise',
    devis: { ...DECHETS, dechets_concerne: null, dechets_flux: ['aucune'], dechets_lieux: null, dechets_sans_depot: true },
    lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : SANS RÉPONSE, « Aucun dépôt », un tri VIDE DE VALEUR, aucun lieu : devis_dechets', e: 'franchise',
    devis: { ...DECHETS, dechets_concerne: null, dechets_flux: null, dechets_lieux: null, dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : « Non », « Aucun dépôt », le bois et le plâtre triés à part, aucun lieu : rien (« Non » ne lit rien)', e: 'franchise',
    devis: { ...DECHETS, dechets_concerne: false, dechets_lieux: null, dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  //     Le jardinage (le coût de la règle, dit au propriétaire) : des déchets
  //     verts cochés « à part » ET compostés sur place, « Aucun dépôt » —
  //     le point ; « Aucune collecte séparée » et le compostage — rien.
  { nom: 'DROIT-R2 : jardinage, les déchets verts triés à part ET compostés sur place, « Aucun dépôt », aucun lieu : devis_dechets_rubriques',
    e: 'franchise', devis: { ...DECHETS, dechets_flux: ['verts'], dechets_sur_place: ['compostage'], dechets_lieux: null,
      dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : jardinage, « Aucune collecte séparée », compostés sur place, « Aucun dépôt », aucun lieu : rien ne manque',
    e: 'franchise', devis: { ...DECHETS, dechets_flux: ['aucune'], dechets_sur_place: ['compostage'], dechets_lieux: null,
      dechets_sans_depot: true }, lignes: UN_POSTE_0 },
  //     LE VIDE DE « AUCUN DÉPÔT » (banc des sabotages de DROIT-R2, B2) : la
  //     condition reste sûre face au vide — `v_dechets_sans is true`, jamais
  //     `v_dechets_sans` seul : `null and vrai` vaut `null`, son `not` aussi,
  //     et le point se TAIT. Seul un tri `{aucune}` le montre (avec une sorte,
  //     `null and faux` vaut faux) : sans ces deux cas, la parité restait
  //     verte sous cette mutation.
  { nom: 'DROIT-R2 : « Oui », « Aucune collecte séparée » ({aucune}), « Aucun dépôt » VIDE, aucun lieu : devis_dechets_rubriques (le lieu manque)',
    e: 'franchise', devis: { ...DECHETS, dechets_flux: ['aucune'], dechets_lieux: null }, lignes: UN_POSTE_0 },
  { nom: 'DROIT-R2 : SANS RÉPONSE, {aucune}, « Aucun dépôt » VIDE, aucun lieu : devis_dechets', e: 'franchise',
    devis: { ...DECHETS, dechets_concerne: null, dechets_flux: ['aucune'], dechets_lieux: null }, lignes: UN_POSTE_0 },
  // --- 2b-6, À LA FIN pour que les numéros des cas déjà là ne bougent pas.
  //     Le rang 14 : les travaux d'énergie et le label RGE. « Aucun » tait le
  //     rang ; les deux réponses « entreprise » aussi. `devis_energie` (une
  //     prudence) quand les travaux ne sont pas dits ; une rubrique qui manque
  //     rend `devis_energie_mentions` (la loi) à titre privé, sinon
  //     `devis_energie_mentions_prudence`. Les cas « seuls » sont EN
  //     FRANCHISE, sur une fiche complète, comme ceux du rang 13.
  { nom: 'énergie : les travaux PAS DITS : devis_energie seul (une prudence)', e: 'franchise',
    devis: { energie_travaux: null }, lignes: UN_POSTE_0 },
  { nom: 'énergie : « Aucun », avec une déclaration et des sous-traitants RESTÉS : rien ne manque (la lecture ne tourne pas)',
    e: 'franchise', devis: { energie_travaux: ['aucun'], energie_sans_label: ['isolation_combles'], energie_sous_traitance: true,
      energie_sous_traitants: [TX] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : les combles, rien d’autre : devis_energie_mentions seul (la loi)', e: 'franchise',
    devis: { energie_travaux: ['isolation_combles'] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : les combles déclarés sans label, « Non » : rien ne manque', e: 'franchise',
    devis: { ...COMBLES, ...COMBLES_DECLARES }, lignes: UN_POSTE_0 },
  { nom: 'énergie : les combles déclarés, la sous-traitance PAS DITE : devis_energie_mentions', e: 'franchise',
    devis: COMBLES_DECLARES, lignes: UN_POSTE_0 },
  { nom: 'énergie : les combles, la déclaration VIDE DE VALEUR, « Non » : devis_energie_mentions (`is not true`)', e: 'franchise',
    devis: COMBLES, lignes: UN_POSTE_0 },
  //     Les signes de qualité de A, puis de B.
  { nom: 'énergie : un signe de A qui couvre les combles, joint, valable : rien ne manque', e: 'franchise',
    devis: COMBLES, labels: [signe(GA1, ['isolation_combles'], VALABLE)], lignes: UN_POSTE_0 },
  { nom: 'énergie : un signe de A valable SANS certificat : devis_energie_mentions', e: 'franchise',
    devis: COMBLES, labels: [signe(GA1, ['isolation_combles'], VALABLE, false)], lignes: UN_POSTE_0 },
  { nom: 'énergie : un signe de A valable SANS certificat, ET la déclaration : devis_energie_mentions (on ne déclare pas ne pas détenir ce qu’on a dit détenir)',
    e: 'franchise', devis: { ...COMBLES, ...COMBLES_DECLARES }, labels: [signe(GA1, ['isolation_combles'], VALABLE, false)],
    lignes: UN_POSTE_0 },
  { nom: 'énergie : un signe de A expiré (2001), joint, ET la déclaration : rien ne manque (un label expiré est déclarable)',
    e: 'franchise', devis: { ...COMBLES, ...COMBLES_DECLARES }, labels: [signe(GA1, ['isolation_combles'], PASSEE)], lignes: UN_POSTE_0 },
  { nom: 'énergie : un signe de A expiré (2001), joint, sans déclaration : devis_energie_mentions', e: 'franchise',
    devis: COMBLES, labels: [signe(GA1, ['isolation_combles'], PASSEE)], lignes: UN_POSTE_0 },
  { nom: 'énergie : un signe de A expiré ET sans certificat, ET la déclaration : rien ne manque', e: 'franchise',
    devis: { ...COMBLES, ...COMBLES_DECLARES }, labels: [signe(GA1, ['isolation_combles'], PASSEE, false)], lignes: UN_POSTE_0 },
  { nom: 'énergie : un signe de A d’une AUTRE catégorie (la ventilation) : devis_energie_mentions', e: 'franchise',
    devis: COMBLES, labels: [signe(GA1, ['ventilation'], VALABLE)], lignes: UN_POSTE_0 },
  { nom: 'énergie : les combles et la ventilation, le signe couvre les combles, la ventilation déclarée : rien ne manque', e: 'franchise',
    devis: { ...COMBLES, energie_travaux: ['isolation_combles', 'ventilation'], energie_sans_label: ['ventilation'] },
    labels: [signe(GA1, ['isolation_combles'], VALABLE)], lignes: UN_POSTE_0 },
  { nom: 'énergie : les combles et la ventilation, le signe couvre les combles, rien de plus : devis_energie_mentions', e: 'franchise',
    devis: { ...COMBLES, energie_travaux: ['isolation_combles', 'ventilation'] },
    labels: [signe(GA1, ['isolation_combles'], VALABLE)], lignes: UN_POSTE_0 },
  { nom: 'énergie : deux signes de A, chacun couvre un des deux travaux : rien ne manque', e: 'franchise',
    devis: { ...COMBLES, energie_travaux: ['isolation_combles', 'ventilation'] },
    labels: [signe(GA1, ['isolation_combles'], VALABLE), signe(GA2, ['ventilation'], VALABLE)], lignes: UN_POSTE_0 },
  { nom: 'énergie : un signe de A sans certificat ET un second, complet : rien ne manque, même déclaré', e: 'franchise',
    devis: { ...COMBLES, ...COMBLES_DECLARES },
    labels: [signe(GA1, ['isolation_combles'], VALABLE, false), signe(GA2, ['isolation_combles'], VALABLE)], lignes: UN_POSTE_0 },
  { nom: 'énergie : le signe COMPLET de B, seul : devis_energie_mentions (il ne vaut jamais pour A)', e: 'franchise',
    devis: COMBLES, labels: [signe(GB1, ['isolation_combles'], VALABLE, true, B)], lignes: UN_POSTE_0 },
  { nom: 'énergie : le signe de B SANS certificat, et la déclaration de A : rien ne manque (il n’empêche rien chez A)', e: 'franchise',
    devis: { ...COMBLES, ...COMBLES_DECLARES }, labels: [signe(GB1, ['isolation_combles'], VALABLE, false, B)], lignes: UN_POSTE_0 },
  { nom: 'énergie : les combles déclarés, les fenêtres ajoutées : devis_energie_mentions (la déclaration ne vaut que pour ce qu’elle nomme)',
    e: 'franchise', devis: { ...COMBLES, energie_travaux: ['isolation_combles', 'fenetres'], energie_sans_label: ['isolation_combles'] },
    lignes: UN_POSTE_0 },
  { nom: 'énergie : une clé déclarée pour un travail DÉCOCHÉ, sans effet : rien ne manque', e: 'franchise',
    devis: { ...COMBLES, energie_sans_label: ['isolation_combles', 'ventilation'] }, lignes: UN_POSTE_0 },
  //     Les deux travaux comptés par prudence (réponse P12).
  { nom: 'énergie : le photovoltaïque seul, « Non » : devis_energie_mentions_prudence seul', e: 'franchise',
    devis: { ...COMBLES, energie_travaux: ['photovoltaique'] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : le désembouage seul, « Non » : devis_energie_mentions_prudence', e: 'franchise',
    devis: { ...COMBLES, energie_travaux: ['desembouage'] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : le photovoltaïque, la sous-traitance PAS DITE : devis_energie_mentions (la sous-traitance qui manque)', e: 'franchise',
    devis: { energie_travaux: ['photovoltaique'] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : le photovoltaïque et les combles, rien : devis_energie_mentions', e: 'franchise',
    devis: { ...COMBLES, energie_travaux: ['photovoltaique', 'isolation_combles'] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : le photovoltaïque et les combles, les combles déclarés : devis_energie_mentions_prudence', e: 'franchise',
    devis: { ...COMBLES, energie_travaux: ['photovoltaique', 'isolation_combles'], energie_sans_label: ['isolation_combles'] },
    lignes: UN_POSTE_0 },
  { nom: 'énergie : le photovoltaïque déclaré, « Non » : rien ne manque', e: 'franchise',
    devis: { ...COMBLES, energie_travaux: ['photovoltaique'], energie_sans_label: ['photovoltaique'] }, lignes: UN_POSTE_0 },
  //     Les sous-traitants (réponses P3 et P13).
  { nom: 'énergie : « Oui », aucun sous-traitant choisi : devis_energie_mentions', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true }, lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », un sous-traitant de A complet, sans label : rien ne manque', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TA1] },
    sousTraitants: [sousTraitant(TA1, false)], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », un sous-traitant de A dont le label n’est PAS DIT : devis_energie_mentions', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TA1] },
    sousTraitants: [sousTraitant(TA1, null)], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », un sous-traitant de A labellisé, valable, justifié : rien ne manque', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TA1] },
    sousTraitants: [sousTraitant(TA1, true, { categories: ['isolation_combles'], fin: VALABLE, joint: true })], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », un sous-traitant de A labellisé, expiré (2001) : devis_energie_mentions', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TA1] },
    sousTraitants: [sousTraitant(TA1, true, { categories: ['isolation_combles'], fin: PASSEE, joint: true })], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », un sous-traitant de A labellisé, SANS justificatif : devis_energie_mentions', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TA1] },
    sousTraitants: [sousTraitant(TA1, true, { categories: ['isolation_combles'], fin: VALABLE, joint: false })], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », un sous-traitant complet ET un incomplet : devis_energie_mentions', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TA1, TA2] },
    sousTraitants: [sousTraitant(TA1, false), sousTraitant(TA2, null)], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », le même sous-traitant complet DEUX fois : rien ne manque (compté une fois)', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TA1, TA1] },
    sousTraitants: [sousTraitant(TA1, false)], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », un identifiant ORPHELIN seul choisi, A ayant un sous-traitant complet : devis_energie_mentions', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TX] },
    sousTraitants: [sousTraitant(TA1, false)], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Oui », le sous-traitant de B seul choisi : devis_energie_mentions (il ne vaut jamais pour A)', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: true, energie_sous_traitants: [TB1] },
    sousTraitants: [sousTraitant(TB1, false, {}, B)], lignes: UN_POSTE_0 },
  { nom: 'énergie : « Non », des identifiants de sous-traitants RESTÉS : rien ne manque', e: 'franchise',
    devis: { ...COMBLES_DECLARES, energie_sous_traitance: false, energie_sous_traitants: [TB1, TX] },
    sousTraitants: [sousTraitant(TB1, false, {}, B)], lignes: UN_POSTE_0 },
  //     Les réponses « à quel titre ».
  { nom: 'énergie : une association, les travaux pas dits : devis_energie (une prudence)', e: 'franchise',
    devis: { pour_qui: 'non_professionnel', energie_travaux: null }, lignes: UN_POSTE_0 },
  { nom: 'énergie : une association, les combles, rien : devis_energie_mentions_prudence', e: 'franchise',
    devis: { ...COMBLES, pour_qui: 'non_professionnel' }, lignes: UN_POSTE_0 },
  { nom: 'énergie : une association, le photovoltaïque : devis_energie_mentions_prudence', e: 'franchise',
    devis: { ...COMBLES, pour_qui: 'non_professionnel', energie_travaux: ['photovoltaique'] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : pour son entreprise, les combles, rien : rien ne manque (le rang se tait)', e: 'franchise',
    devis: { pour_qui: 'professionnel', energie_travaux: ['isolation_combles'] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : pour son entreprise, les travaux pas dits : rien ne manque', e: 'franchise',
    devis: { pour_qui: 'professionnel', energie_travaux: null }, lignes: UN_POSTE_0 },
  { nom: 'énergie : une petite entreprise hors de son activité, les combles, rien : rien ne manque', e: 'franchise',
    devis: { pour_qui: 'professionnel_hors_activite', energie_travaux: ['isolation_combles'] }, lignes: UN_POSTE_0 },
  { nom: 'énergie : la réponse « à quel titre » VIDE, les combles : devis_pour_qui, puis devis_energie_mentions_prudence', e: 'franchise',
    devis: { ...COMBLES, pour_qui: null, pour_qui_client: null }, lignes: UN_POSTE_0 },
  { nom: 'énergie : sans client, les travaux pas dits : devis_client, puis devis_energie', e: 'franchise',
    devis: { client_id: null, energie_travaux: null }, lignes: UN_POSTE_0 },
  //     L'ordre des rangs.
  { nom: 'énergie : les déchets sans réponse ET les travaux pas dits : les rangs 13 puis 14', e: 'franchise',
    devis: { dechets_concerne: null, energie_travaux: null }, lignes: UN_POSTE_0 },
  { nom: 'énergie : au réel, les travaux pas dits : le rang 14, puis conso_tva_intra', e: 'reel',
    devis: { energie_travaux: null }, lignes: UN_POSTE_20 },
  //     D4-c : l'origine ne change rien au rang 14.
  { nom: 'D4-c : devis NEUF VIDE SANS RÉPONSE AUX TRAVAUX ouvert à la main', e: 'franchise',
    devis: { ...VIDE, energie_travaux: null, source: 'manuelle' }, lignes: [] },
  { nom: 'D4-c : devis NEUF VIDE SANS RÉPONSE AUX TRAVAUX venu d’une urgence', e: 'franchise',
    devis: { ...VIDE, energie_travaux: null, sos_request_id: SA, source: 'urgence' }, lignes: [] },
  { nom: 'D4-c : devis NEUF VIDE SANS RÉPONSE AUX TRAVAUX venu d’une demande ET d’une urgence', e: 'franchise',
    devis: { ...VIDE, energie_travaux: null, quote_request_id: QA, sos_request_id: SA, source: 'demande' }, lignes: [] },
];

/* ---------------------------------------------------------------------------
   LE SQL : un décor commun, puis chaque situation dans son savepoint.
   --------------------------------------------------------------------------- */
let sql = `\\set QUIET on
\\pset format unaligned
\\pset tuples_only on
begin;
insert into public.preuves_siret
  (siret, denomination, est_ei, forme_juridique, est_siege, tva, adresse, code_postal, commune,
   statut_diffusion, maj_insee, source, expire_le, pour_email) values
  ('00004900700016', 'ESSAIS 49 A', false, '5499', true, null,
   '1 RUE DE L ESSAI 13410 LAMBESC', '13410', 'LAMBESC', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null),
  ('00004910600016', 'ESSAIS 49 B', false, '5499', true, null,
   '2 RUE DE L ESSAI 13100 AIX-EN-PROVENCE', '13100', 'AIX-EN-PROVENCE', 'O', '2026-09-02',
   'registre', now() + interval '1 hour', null);
insert into auth.users (id, email, raw_user_meta_data) values
 ('${A}', 'a-cas-remise@exemple-opus.test', jsonb_build_object('type','pro','siret','00004900700016','nom','A Essais',
   'entreprise','A Essais','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
 ('${B}', 'b-cas-remise@exemple-opus.test', jsonb_build_object('type','pro','siret','00004910600016','nom','B Essais',
   'entreprise','B Essais','metiers',jsonb_build_array('plombier'),'ville','Aix (13)')),
 ('${P}', 'p-cas-remise@exemple-opus.test', jsonb_build_object('type','particulier','nom','P Essais','ville','Lambesc (13)'));
insert into public.clients (id, pro_id, type, nom, adresse, code_postal, ville)
values ('${C1}', '${A}', 'particulier', 'Client essai A', '4 rue de l''Essai', '13410', 'Lambesc'),
       ('${C2}', '${A}', 'entreprise', 'Client essai A2', '6 rue de l''Essai', '13410', 'Lambesc');
insert into public.quote_requests (id, client_id, professional_id, metier, description, ville, statut)
values ('${QA}', '${P}', '${A}', 'macon', 'Refaire la salle de bain', 'Lambesc', 'accepte');
insert into public.sos_requests (id, client_id, professional_id, metier_key, probleme_key, statut)
values ('${SA}', '${P}', '${A}', 'plomberie', 'fuite', 'acceptee');
-- 2b-3 : LA DÉCENNALE DE A, JOINTE ET VALABLE (une date FIXE et lointaine) —
-- la forme du décor de l'essai 49-remise. Sans elle, une réponse vide
-- comptant « Oui », les 85 cas d'avant gagnaient devis_decennale. Les cas du
-- rang 11 la REMPLACENT dans leur savepoint (\`assur\`).
insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture,
                                        attestation_chemin, valide_jusquau)
values ('${A}', 'decennale', 'Assureur d’essai', '1 rue de l’Essai, 13410 Lambesc', 'France métropolitaine',
        '${A}/attestation.pdf', '${VALABLE}');
`;
SITUATIONS.forEach((s, k) => {
  const n = k + 1;
  const d = idDevis(n);
  const cols = { source: 'manuelle', ...COMPLET, ...(s.devis || {}) };
  const noms = Object.keys(cols);
  sql += `savepoint s${n};\n${(ENTREPRISES[s.e] || []).join('\n')}\n`;
  if (s.assur) {
    sql += `delete from public.emetteur_assurances where pro_id in ('${A}', '${B}');\n`;
    s.assur.forEach((a, i) => {
      const chemin = a.chemin ? `${a.pro}/attestation-${n}-${i + 1}.pdf` : null;
      sql += `insert into public.emetteur_assurances (pro_id, nature, assureur_nom, assureur_coordonnees, couverture, attestation_chemin, valide_jusquau)
values ('${a.pro}', ${q(a.nature)}, 'Assureur d’essai', '1 rue de l’Essai', 'France métropolitaine', ${q(chemin)}, ${q(a.fin)});\n`;
    });
  }
  // 2b-5 : les lieux de dépôt de la situation, complets (la contrainte
  // `emetteur_lieu_complet_check`), posés AVANT de devenir A.
  (s.lieux || []).forEach((l, i) => {
    sql += `insert into public.emetteur_lieux_depot (id, pro_id, raison_sociale, adresse, code_postal, ville, type_installation)
values ('${l.id}', '${l.pro}', 'Déchèterie d’essai ${i + 1}', '1 chemin de l’Essai', '13410', 'Lambesc', 'decheterie_pro');\n`;
  });
  // 2b-6 : les signes de qualité et les sous-traitants de la situation,
  // complets (les contraintes de 46.2 ter et quater), posés AVANT de devenir A.
  (s.labels || []).forEach((g, i) => {
    const chemin = g.joint ? `${g.pro}/certificat-${n}-${i + 1}.pdf` : null;
    sql += `insert into public.emetteur_labels (id, pro_id, organisme, intitule, categories, valide_jusquau, justificatif_chemin)
values ('${g.id}', '${g.pro}', 'Organisme d’essai', 'Label d’essai ${i + 1}', ${q(g.categories)}, ${q(g.fin)}, ${q(chemin)});\n`;
  });
  (s.sousTraitants || []).forEach((t, i) => {
    const chemin = t.joint ? `${t.pro}/justificatif-${n}-${i + 1}.pdf` : null;
    sql += `insert into public.emetteur_sous_traitants (id, pro_id, raison_sociale, siret, label_detient, label_categories,
  label_valide_jusquau, label_justificatif_chemin)
values ('${t.id}', '${t.pro}', 'Sous-traitant d’essai ${i + 1}', '00004910600016', ${q(t.detient)}, ${q(t.categories)}, ${q(t.fin)}, ${q(chemin)});\n`;
  });
  sql += `set local role authenticated;\nset local request.jwt.claim.sub = '${A}';\n`;
  sql += `insert into public.devis (id, pro_id, ${noms.join(', ')}, generation) values ('${d}', '${A}', ${noms.map((c) => q(cols[c])).join(', ')}, 1);\n`;
  s.lignes.forEach((l, i) => {
    const id = idLigne(n, l.id ?? i + 1);
    const ordre = l.ordre ?? (i + 1) * 1000;
    if (l.type === 'poste' || l.type === 'option') {
      sql += `insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, offert, urgence, generation)
values ('${id}', '${d}', ${ordre}, '${l.type}', 'Ligne ${i + 1}', 1000, 'forfait', ${l.prix}, ${l.taux}, ${l.offert === true}, ${l.urgence === true}, ${i + 2});\n`;
    } else {
      sql += `insert into public.devis_lignes (id, devis_id, ordre, type, designation, generation)
values ('${id}', '${d}', ${ordre}, '${l.type}', 'Titre ${i + 1}', ${i + 2});\n`;
    }
  });
  if (s.apres) sql += `${s.apres}\n`;
  sql += `select 'DEVIS|${n}|' || row_to_json(x)::text from public.devis x where x.id = '${d}';
select 'LIGNES|${n}|' || coalesce(json_agg(row_to_json(l) order by l.generation)::text, '[]') from public.devis_lignes l where l.devis_id = '${d}';
select 'REGIME|${n}|' || coalesce((select to_json(e.regime_tva)::text from public.emetteur e where e.pro_id = '${A}'), 'null');
select 'EMET|${n}|' || to_json(public.emetteur_incomplet('${A}'))::text;
select 'SORTIE|${n}|' || coalesce(json_agg(json_build_object('rang', m.rang, 'cle', m.cle, 'phrase', m.phrase,
       'nature', m.nature, 'ligne_id', m.ligne_id) order by m.o)::text, '[]')
  from public.motifs_refus_remise('${d}') with ordinality as m(rang, cle, phrase, nature, ligne_id, o);
reset role;
select 'ASSUR|${n}|' || coalesce(json_agg(json_build_object('pro_id', a.pro_id, 'nature', a.nature,
       'attestation_chemin', a.attestation_chemin, 'valide_jusquau', a.valide_jusquau)
       order by a.pro_id, a.nature, a.valide_jusquau nulls first, a.attestation_chemin nulls first)::text, '[]')
  from public.emetteur_assurances a;
select 'LIEUX|${n}|' || coalesce(json_agg(json_build_object('id', l.id, 'proId', l.pro_id) order by l.pro_id, l.id)::text, '[]')
  from public.emetteur_lieux_depot l;
select 'LABELS|${n}|' || coalesce(json_agg(json_build_object('id', g.id, 'pro_id', g.pro_id, 'categories', g.categories,
       'valide_jusquau', g.valide_jusquau, 'justificatif_chemin', g.justificatif_chemin) order by g.pro_id, g.id)::text, '[]')
  from public.emetteur_labels g;
select 'STRAIT|${n}|' || coalesce(json_agg(json_build_object('id', t.id, 'pro_id', t.pro_id, 'label_detient', t.label_detient,
       'label_categories', t.label_categories, 'label_valide_jusquau', t.label_valide_jusquau,
       'label_justificatif_chemin', t.label_justificatif_chemin) order by t.pro_id, t.id)::text, '[]')
  from public.emetteur_sous_traitants t;
rollback to savepoint s${n};
`;
});
sql += 'rollback;\n';

/* ---------------------------------------------------------------------------
   LA BASE JETABLE : créée, rejouée, interrogée, supprimée — quoi qu'il arrive.
   --------------------------------------------------------------------------- */
let sortieBrute;
psql(['-d', 'postgres', '-q', '-c', `drop database if exists ${BASE}`, '-c', `create database ${BASE}`]);
try {
  psql(['-d', BASE, '-q', '-f', join(RACINE, 'supabase', 'local-prelude.sql')]);
  psql(['-d', BASE, '-q', '-f', join(RACINE, 'supabase', 'schema.sql')]);
  psql(['-d', BASE, '-q', '-f', join(RACINE, 'supabase', 'schema.sql')]);
  sortieBrute = psql(['-d', BASE], sql);
} finally {
  psql(['-d', 'postgres', '-q', '-c', `drop database if exists ${BASE}`]);
}

const lu = {};
for (const l of sortieBrute.split('\n')) {
  const m = l.match(/^(DEVIS|LIGNES|REGIME|EMET|SORTIE|ASSUR|LIEUX|LABELS|STRAIT)\|(\d+)\|(.*)$/);
  if (m) (lu[m[2]] ||= {})[m[1]] = JSON.parse(m[3]);
}

const nombreOuNul = (v) => (v === null || v === undefined ? null : Number(v));
const egalTableau = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
/* LA TRADUCTION DE `rowToLigne` (`src/lib/api.js`), recopiée champ pour
   champ : `api.js` charge Supabase, `node` ne sait pas l'ouvrir. La date est
   retirée (`modifieLe` à null), comme celles du devis. */
const rowToLigne = (l) => ({
  id: l.id,
  devisId: l.devis_id ?? null,
  ordre: nombreOuNul(l.ordre),
  type: l.type ?? 'poste',
  designation: l.designation ?? null,
  quantiteMilliemes: nombreOuNul(l.quantite_milliemes),
  unite: l.unite ?? null,
  prixUnitaireCentimes: nombreOuNul(l.prix_unitaire_centimes),
  tauxTvaCentiemes: nombreOuNul(l.taux_tva_centiemes),
  totalCentimes: nombreOuNul(l.total_centimes),
  offert: l.offert === true,
  mainOeuvre: l.main_oeuvre === true,
  fournitureNonComprise: l.fourniture_non_comprise === true,
  surfaceSolMilliemes: nombreOuNul(l.surface_sol_milliemes),
  surfaceMursMilliemes: nombreOuNul(l.surface_murs_milliemes),
  urgence: l.urgence === true,
  generation: nombreOuNul(l.generation),
  modifieLe: null,
});

const bruts = {};
const cas = SITUATIONS.map((s, k) => {
  const n = k + 1;
  const r = lu[n];
  if (!r || !r.DEVIS || !r.LIGNES || !('REGIME' in r) || !r.EMET || !r.SORTIE || !r.ASSUR || !r.LIEUX || !r.LABELS
    || !r.STRAIT) {
    throw new Error(`cas ${n} (${s.nom}) : la base n’a pas tout rendu`);
  }
  /* La date du « Oui » au chantier neuf, posée par la base, change à chaque
     génération : retirée comme les deux autres (la règle ne la lit pas). */
  const devis = { ...rowToDevis(r.DEVIS), createdAt: null, modifieLe: null, chantierNeufConsoLe: null };
  const lignes = r.LIGNES.map(rowToLigne);
  const indice = (id) => {
    if (id === null) return null;
    const i = lignes.findIndex((l) => l.id === id);
    if (i < 0) throw new Error(`cas ${n} : la ligne ${id} désignée n’est pas dans le devis`);
    return i;
  };
  const attendu = r.SORTIE.map((m) => ({
    rang: m.rang, cle: m.cle, phrase: m.phrase, nature: m.nature, ligne_id: indice(m.ligne_id),
  }));
  /* 2b-3 : AUCUNE date entre 2002 et 2998 — une date proche vieillirait le
     fichier (une attestation « valable » le deviendrait plus) et le jour du
     téléphone pourrait différer de celui de Paris. */
  const assurances = r.ASSUR;
  for (const a of assurances) {
    if (a.valide_jusquau !== null && !(a.valide_jusquau <= '2001-12-31' || a.valide_jusquau >= '2999-01-01')) {
      throw new Error(`cas ${n} : une date d’assurance proche (${a.valide_jusquau}) — 2001 ou 2999 seulement`);
    }
  }
  /* 2b-5 : les lieux de dépôt, des OBJETS `{ id, proId }`. La ligne BRUTE du
     devis est gardée À CÔTÉ (jamais écrite dans le fichier) : les gardes de
     couverture des déchets la lisent, pour ne pas dépendre de ce que
     `rowToDevis` sait déjà traduire. */
  const lieux = r.LIEUX;
  /* 2b-6 : les signes de qualité et les sous-traitants, des LIGNES de la base
     réduites à ce que la règle lit — et la garde des dates des assurances :
     2001 ou 2999 seulement. */
  const labels = r.LABELS;
  const sousTraitants = r.STRAIT;
  for (const [quoi, d] of [...labels.map((g) => ['signe de qualité', g.valide_jusquau]),
    ...sousTraitants.map((t) => ['sous-traitant', t.label_valide_jusquau])]) {
    if (d !== null && !(d <= '2001-12-31' || d >= '2999-01-01')) {
      throw new Error(`cas ${n} : une date de ${quoi} proche (${d}) — 2001 ou 2999 seulement`);
    }
  }
  /* 2b-6 (cahier, §5.5 e) : `rowToDevis` doit connaître les QUATRE champs de
     l'énergie AVANT la régénération — sans eux, le miroir lirait `undefined`
     sur chaque cas, et la parité dirait vrai ou faux pour une mauvaise
     raison (la leçon de 2b-4). */
  for (const champ of ['energieTravaux', 'energieSansLabel', 'energieSousTraitance', 'energieSousTraitants']) {
    if (!(champ in devis)) {
      throw new Error(`rowToDevis (src/lib/devis.js) ne rend pas encore « ${champ} » : apprenez-lui les quatre champs de `
        + 'l’énergie (2b-6, 49.4 septies) avant de régénérer ce fichier');
    }
  }
  bruts[n] = r.DEVIS;
  return { n, nom: s.nom, devis, lignes, regime: r.REGIME, motifsEmetteur: r.EMET, assurances, lieux, labels, sousTraitants, attendu };
});

/* Ce que le fichier doit couvrir, vérifié ici : chaque motif du devis seul
   au moins une fois, chaque nature, un cas où rien ne manque, et des motifs
   de l'entreprise. Un fichier qui ne couvre plus quelque chose rougit à la
   génération, pas au premier défaut. */
const CLES_DU_DEVIS = ['devis_client', 'devis_pour_qui', 'devis_lignes', 'devis_taux_franchise', 'devis_taux_sans_tva',
  'devis_taux_reduit_neuf', 'devis_lieu', 'devis_delai', 'devis_validite', 'devis_acompte_nature', 'devis_acompte_ramene',
  'devis_reduction_ramenee', 'devis_acompte_signature', 'devis_decennale', 'devis_attestation_date', 'devis_attestation',
  'devis_cout', 'devis_dechets', 'devis_dechets_rubriques',
  /* 2b-6 : les trois clés du rang 14. */
  'devis_energie', 'devis_energie_mentions', 'devis_energie_mentions_prudence'];
for (const cle of CLES_DU_DEVIS) {
  if (!cas.some((c) => c.attendu.length > 0 && c.attendu.filter((m) => m.rang < 100).every((m) => m.cle === cle)
    && c.attendu.some((m) => m.cle === cle))) {
    throw new Error(`aucun cas où ${cle} est le seul motif du devis`);
  }
}
for (const nature of ['loi', 'prudence', 'regle_opus']) {
  if (!cas.some((c) => c.attendu.some((m) => m.nature === nature))) throw new Error(`aucun motif de nature ${nature}`);
}
if (!cas.some((c) => c.attendu.length === 0)) throw new Error('aucun cas où rien ne manque');
if (!cas.some((c) => c.attendu.some((m) => m.rang > 100))) throw new Error('aucun motif de l’entreprise');
if (!cas.some((c) => c.attendu.filter((m) => m.ligne_id !== null).length >= 3)) throw new Error('aucun cas à trois lignes fautives');
/* 2b-2 : les deux clés de rang 3 qui ALTERNENT dans un même devis (les deux
   tableaux de la base, alignés indice par indice) ; un filtre « pour son
   entreprise » qui laisse des TROUS dans les rangs de l'entreprise ; les deux
   adresses gardées ; chaque réponse « à quel titre » jouée. */
const rang3 = (c) => c.attendu.filter((m) => m.rang === 3).map((m) => m.cle);
if (!cas.some((c) => rang3(c).some((k, i, t) => i > 0 && k !== t[i - 1] && t.slice(i + 1).includes(t[i - 1])))) {
  throw new Error('aucun cas où deux clés de rang 3 alternent');
}
const aTrous = (c) => {
  const r = c.attendu.filter((m) => m.rang > 100).map((m) => m.rang);
  return r.length > 1 && r.some((x, i) => i > 0 && x !== r[i - 1] + 1);
};
if (!cas.some((c) => c.devis.pourQui === 'professionnel' && c.devis.clientId && aTrous(c)
  && c.attendu.some((m) => m.cle === 'conso_adresse_etablissement' || m.cle === 'conso_adresse_siege'))) {
  throw new Error('aucun cas « pour son entreprise » à rangs troués qui garde une adresse');
}
for (const pq of ['consommateur', 'non_professionnel', 'professionnel_hors_activite', 'professionnel']) {
  if (!cas.some((c) => c.devis.pourQui === pq && c.devis.clientId && c.devis.pourQuiClient === c.devis.clientId
    && c.attendu.some((m) => m.rang > 100))) throw new Error(`aucun cas où la réponse « ${pq} » filtre les mentions`);
}
/* 2b-3 : « à la signature » PERMIS par chacun des deux cas (aucun rang 10)
   — et, depuis le 13/11 (décision R1), sur un bâtiment neuf aussi quand l'un
   d'eux tient —, et REFUSÉ pour chaque réponse qui ne le permet pas, le
   bâtiment neuf compris ; le rang 11 sur chacun de ses trois états, et
   « Non » qui ne lit rien ; une assurance d'un AUTRE artisan ; le rang 10 et
   le rang 11 ensemble ; et les 85 cas d'avant gardent leur numéro (rien
   n'est inséré avant eux). */
const sig = (c) => c.devis.acompteALaSignature === true && (c.devis.acompteCentiemes != null || c.devis.acompteCentimes != null);
const r10 = (c) => c.attendu.some((m) => m.cle === 'devis_acompte_signature');
const urgents = (c) => c.lignes.filter((l) => l.type === 'poste' || l.type === 'option');
const toutMarque = (c) => urgents(c).length > 0 && urgents(c).every((l) => l.urgence === true);
const valableDe = (c, r) => c.devis.pourQui === r && c.devis.pourQuiClient === c.devis.clientId;
const neuf = (c) => c.devis.chantierNeufConso === true;
const permis = {
  professionnel: (c) => valableDe(c, 'professionnel'),
  urgence_prive: (c) => toutMarque(c) && valableDe(c, 'consommateur'),
  urgence_association: (c) => toutMarque(c) && valableDe(c, 'non_professionnel'),
  // 13/11 (R1) : sur un bâtiment neuf, les deux cas permettent toujours.
  professionnel_neuf: (c) => neuf(c) && valableDe(c, 'professionnel'),
  urgence_prive_neuf: (c) => neuf(c) && toutMarque(c) && valableDe(c, 'consommateur'),
};
for (const [cle, f] of Object.entries(permis)) {
  if (!cas.some((c) => sig(c) && f(c) && !r10(c))) throw new Error(`aucun cas où « à la signature » est permis par ${cle}`);
}
/* 13/11 (R1) : le bâtiment neuf ne permet PLUS « à la signature » — à titre
   privé comme pour une association, rien de marqué : le rang 10. */
for (const r of ['consommateur', 'non_professionnel']) {
  if (!cas.some((c) => sig(c) && neuf(c) && !toutMarque(c) && valableDe(c, r) && r10(c))) {
    throw new Error(`aucun cas où le bâtiment neuf, pour « ${r} », laisse le rang 10`);
  }
}
if (!cas.some((c) => sig(c) && toutMarque(c) && c.devis.pourQui === 'professionnel_hors_activite' && r10(c))) {
  throw new Error('aucun cas où l’urgence ne lève pas le 8e jour pour une petite entreprise');
}
if (!cas.some((c) => sig(c) && toutMarque(c) && c.devis.pourQuiClient !== c.devis.clientId && r10(c))) {
  throw new Error('aucun cas où une réponse non valable laisse le rang 10, tout marqué');
}
if (!cas.some((c) => sig(c) && c.lignes.some((l) => l.type === 'option') && r10(c))) throw new Error('aucun cas où une option empêche');
for (const [quoi, f] of [['« Non »', (c) => c.devis.engageDecennale === false && c.assurances.every((a) => a.pro_id !== c.devis.proId)],
  ['B', (c) => c.assurances.some((a) => a.pro_id !== c.devis.proId)]]) {
  if (!cas.some(f)) throw new Error(`aucun cas du rang 11 : ${quoi}`);
}
if (!cas.some((c) => c.attendu.some((m) => m.rang === 10) && c.attendu.some((m) => m.rang === 11))) {
  throw new Error('aucun cas où les rangs 10 et 11 sortent ensemble');
}
if (cas.some((c) => c.attendu.filter((m) => m.rang === 11).length > 1)) throw new Error('le rang 11 a rendu plus d’une clé');
/* 2b-4 : les 125 cas d'avant gardent leur numéro (rien n'est inséré avant
   eux) — ET AUCUN NE PORTE `devis_cout`. Sans la seconde garde, `COMPLET`
   oublié faisait gagner le motif à tous les cas, et la garde de numérotation
   restait verte (sabotage S5 du cahier 2b-4). Le motif ne vit que dans les
   situations ajoutées à la fin, qui écrivent le prix vide elles-mêmes. */
if (cas.length < 125 || cas.slice(0, 125).some((c, i) => c.n !== i + 1)) throw new Error('les 125 cas d’avant ont bougé');
if (cas.slice(0, 125).some((c) => c.attendu.some((m) => m.cle === 'devis_cout'))) {
  throw new Error('un des 125 cas d’avant porte devis_cout : le décor « complet » ne dit plus « gratuit »');
}
/* 2b-4 : la preuve D4-c du motif nouveau — les trois devis neufs sans prix,
   d'origines différentes, rendent la MÊME liste, `devis_cout` compris. */
{
  const sansPrix = cas.filter((c) => /^D4-c : devis NEUF VIDE SANS PRIX /.test(c.nom));
  const listes = new Set(sansPrix.map((c) => JSON.stringify(c.attendu)));
  if (sansPrix.length !== 3 || listes.size !== 1 || !sansPrix[0].attendu.some((m) => m.cle === 'devis_cout')) {
    throw new Error('les trois devis neufs sans prix, d’origines différentes, ne rendent pas la même liste avec devis_cout');
  }
}

/* 2b-5 : les 139 cas d'avant gardent leur numéro (rien n'est inséré avant
   eux) — ET AUCUN NE PORTE LE RANG 13 : sans la seconde garde, `COMPLET`
   qui oublierait « Non » ferait gagner `devis_dechets` à tous, et la garde
   de numérotation resterait verte (la leçon du sabotage S5 de 2b-4). */
if (cas.length < 139 || cas.slice(0, 139).some((c, i) => c.n !== i + 1)) throw new Error('les 139 cas d’avant ont bougé');
if (cas.slice(0, 139).some((c) => c.attendu.some((m) => m.rang === 13))) {
  throw new Error('un des 139 cas d’avant porte le rang 13 : le décor « complet » ne répond plus « Non »');
}
/* 2b-5, DROIT-R2 (21/11) : les 171 cas d'avant la décision gardent leur
   numéro — les cas qui la prouvent sont ajoutés À LA FIN. */
if (cas.length < 171 || cas.slice(0, 171).some((c, i) => c.n !== i + 1)) throw new Error('les 171 cas d’avant DROIT-R2 ont bougé');
/* 2b-5 : UNE SEULE CLÉ AU RANG 13, toujours — et chacune avec sa nature
   (la réponse vide : une prudence ; « Oui » : la loi). */
if (cas.some((c) => c.attendu.filter((m) => m.rang === 13).length > 1)) throw new Error('le rang 13 a rendu plus d’une clé');
if (cas.some((c) => c.attendu.some((m) => (m.cle === 'devis_dechets' && m.nature !== 'prudence')
  || (m.cle === 'devis_dechets_rubriques' && m.nature !== 'loi')))) {
  throw new Error('une clé du rang 13 n’a pas sa nature');
}
/* 2b-5 : la COUVERTURE des lieux, lue sur la ligne BRUTE du devis (la
   colonne `dechets_lieux`) et sur les lieux que la base a rendus — un lieu
   ORPHELIN seul choisi, puis le lieu d'un AUTRE artisan seul choisi, et le
   point qui RESTE dans les deux cas ; « Aucun dépôt » qui l'éteint ; un
   tri `{aucune}` et « sur le chantier » seul ; la réponse vide quand tout
   est dit (rien ne manque) ; « Non » qui ne lit rien malgré un orphelin. */
{
  const r13 = (c) => c.attendu.some((m) => m.rang === 13);
  const choisis = (c) => bruts[c.n].dechets_lieux || [];
  const connus = (c) => new Map((c.lieux || []).map((l) => [l.id, l.proId]));
  const sansDepot = (c) => bruts[c.n].dechets_sans_depot === true;
  /* La sorte qui part à part (DROIT-R2), lue sur la ligne BRUTE : écrite
     ICI à nouveau, jamais importée de `devis.js` — la garde ne doit pas
     changer avec la règle qu'elle couvre. */
  const nommeSorte = (c) => Array.isArray(bruts[c.n].dechets_flux) && bruts[c.n].dechets_flux.some((x) => x !== 'aucune');
  const repondu = (c) => bruts[c.n].dechets_concerne !== false;
  const orphelinSeul = (c) => repondu(c) && !sansDepot(c) && choisis(c).length > 0
    && choisis(c).every((id) => !connus(c).has(id)) && (c.lieux || []).some((l) => l.proId === bruts[c.n].pro_id) && r13(c);
  const autreSeul = (c) => repondu(c) && !sansDepot(c) && choisis(c).length > 0
    && choisis(c).every((id) => connus(c).has(id) && connus(c).get(id) !== bruts[c.n].pro_id) && r13(c);
  const gardes = [
    ['un lieu orphelin seul choisi (le point reste)', orphelinSeul],
    ['le lieu d’un autre artisan seul choisi (le point reste)', autreSeul],
    ['« Aucun dépôt » sans lieu, un tri qui ne nomme aucune sorte ({aucune}), et rien ne manque', (c) => repondu(c) && sansDepot(c)
      && choisis(c).length === 0 && egalTableau(bruts[c.n].dechets_flux || [], ['aucune']) && c.attendu.length === 0],
    /* DROIT-R2 (décision du 21/11) : « Aucun dépôt » ne remplit plus les
       lieux quand le tri nomme une sorte — à « Oui » (la loi) ET sans réponse
       (la prudence) ; un lieu de A qui existe les remplit toujours ; un tri
       vide de valeur : le point reste (par le tri). */
    ['« Aucun dépôt » sans lieu, une sorte triée à part, « Oui » : le point (la loi) reste', (c) => bruts[c.n].dechets_concerne === true
      && sansDepot(c) && choisis(c).length === 0 && nommeSorte(c) && c.attendu.some((m) => m.cle === 'devis_dechets_rubriques')],
    ['« Aucun dépôt » sans lieu, une sorte triée à part, sans réponse : le point (la prudence) reste', (c) => bruts[c.n].dechets_concerne === null
      && sansDepot(c) && choisis(c).length === 0 && nommeSorte(c) && c.attendu.some((m) => m.cle === 'devis_dechets')],
    ['« Aucun dépôt », une sorte triée à part, ET un lieu de A : rien ne manque', (c) => repondu(c) && sansDepot(c) && nommeSorte(c)
      && choisis(c).some((id) => connus(c).get(id) === bruts[c.n].pro_id) && c.attendu.length === 0],
    ['« Aucun dépôt », une sorte triée à part, seul le lieu d’un autre artisan : le point reste', (c) => repondu(c) && sansDepot(c)
      && nommeSorte(c) && choisis(c).length > 0 && choisis(c).every((id) => connus(c).has(id) && connus(c).get(id) !== bruts[c.n].pro_id)
      && r13(c)],
    ['« Aucun dépôt », un tri vide de valeur : le point reste (par le tri)', (c) => repondu(c) && sansDepot(c)
      && bruts[c.n].dechets_flux === null && choisis(c).length === 0 && r13(c)],
    /* Le VIDE de « Aucun dépôt » (B2) : un tri `{aucune}`, aucun lieu, la
       pastille jamais touchée — le point reste, à « Oui » ET sans réponse. */
    ['« Aucun dépôt » VIDE, un tri {aucune}, aucun lieu, « Oui » : le point (la loi) reste', (c) => bruts[c.n].dechets_concerne === true
      && bruts[c.n].dechets_sans_depot === null && egalTableau(bruts[c.n].dechets_flux, ['aucune']) && choisis(c).length === 0
      && c.attendu.some((m) => m.cle === 'devis_dechets_rubriques')],
    ['« Aucun dépôt » VIDE, un tri {aucune}, aucun lieu, sans réponse : le point (la prudence) reste', (c) => bruts[c.n].dechets_concerne === null
      && bruts[c.n].dechets_sans_depot === null && egalTableau(bruts[c.n].dechets_flux, ['aucune']) && choisis(c).length === 0
      && c.attendu.some((m) => m.cle === 'devis_dechets')],
    ['le tri {aucune}, et rien ne manque', (c) => repondu(c) && egalTableau(bruts[c.n].dechets_flux, ['aucune']) && c.attendu.length === 0],
    ['« sur le chantier » seul, et le point reste', (c) => repondu(c) && bruts[c.n].dechets_flux === null
      && (bruts[c.n].dechets_sur_place || []).length > 0 && r13(c)],
    ['la réponse vide quand tout est dit, et rien ne manque', (c) => bruts[c.n].dechets_concerne === null && c.attendu.length === 0],
    ['« Non » malgré un lieu orphelin, et rien ne manque', (c) => bruts[c.n].dechets_concerne === false
      && choisis(c).some((id) => !connus(c).has(id)) && c.attendu.length === 0],
  ];
  for (const [quoi, f] of gardes) if (!cas.some(f)) throw new Error(`aucun cas des déchets : ${quoi}`);
  /* La preuve D4-c du motif nouveau : les trois devis neufs sans réponse aux
     déchets, d'origines différentes, rendent la MÊME liste, `devis_dechets`
     compris. */
  const neufs = cas.filter((c) => /^D4-c : devis NEUF VIDE SANS RÉPONSE AUX DÉCHETS /.test(c.nom));
  const listes = new Set(neufs.map((c) => JSON.stringify(c.attendu)));
  if (neufs.length !== 3 || listes.size !== 1 || !neufs[0].attendu.some((m) => m.cle === 'devis_dechets')) {
    throw new Error('les trois devis neufs sans réponse aux déchets, d’origines différentes, ne rendent pas la même liste avec devis_dechets');
  }
}

/* 2b-6 (cahier, §5.5) : les gardes ÉCRITES D'AVANCE, celles que 2b-4 et 2b-5
   ont dû écrire après coup.
   (a) les 184 cas d'avant gardent leur numéro (rien n'est inséré avant eux)
       — ET AUCUN NE PORTE LE RANG 14 : sans la seconde garde, `COMPLET` qui
       oublierait « Aucun » ferait gagner `devis_energie` à tous, DES DEUX
       CÔTÉS, et la parité resterait verte (la leçon S5 de 2b-4). */
if (cas.length < 184 || cas.slice(0, 184).some((c, i) => c.n !== i + 1)) throw new Error('les 184 cas d’avant 2b-6 ont bougé');
if (cas.slice(0, 184).some((c) => c.attendu.some((m) => m.rang === 14))) {
  throw new Error('un des 184 cas d’avant porte le rang 14 : le décor « complet » ne répond plus « Aucun de ces travaux »');
}
/* (b) UNE SEULE CLÉ AU RANG 14, toujours — chacune avec sa nature. */
if (cas.some((c) => c.attendu.filter((m) => m.rang === 14).length > 1)) throw new Error('le rang 14 a rendu plus d’une clé');
{
  const NATURE_14 = { devis_energie: 'prudence', devis_energie_mentions: 'loi', devis_energie_mentions_prudence: 'prudence' };
  if (cas.some((c) => c.attendu.some((m) => m.rang === 14 && NATURE_14[m.cle] !== m.nature))) {
    throw new Error('une clé du rang 14 n’a pas sa nature (ou une clé inconnue au rang 14)');
  }
}
/* (c) la preuve D4-c du rang 14 : les trois devis neufs sans réponse aux
   travaux, d'origines différentes, rendent la MÊME liste, `devis_energie`
   compris. */
{
  const neufs = cas.filter((c) => /^D4-c : devis NEUF VIDE SANS RÉPONSE AUX TRAVAUX /.test(c.nom));
  const listes = new Set(neufs.map((c) => JSON.stringify(c.attendu)));
  if (neufs.length !== 3 || listes.size !== 1 || !neufs[0].attendu.some((m) => m.cle === 'devis_energie')) {
    throw new Error('les trois devis neufs sans réponse aux travaux, d’origines différentes, ne rendent pas la même liste avec devis_energie');
  }
}
/* (d) LA COUVERTURE, lue sur la ligne BRUTE du devis (les colonnes `energie_…`)
   et sur les signes et sous-traitants que la base a rendus — écrite ICI à
   nouveau, jamais importée de `devis.js` : la garde ne doit pas changer avec
   la règle qu'elle couvre. Le cas « labellisé sans date » n'existe pas en
   base (la croisée) : il vit dans l'essai 49-remise seul (V22). */
{
  const r14 = (c) => c.attendu.some((m) => m.rang === 14);
  const rien = (c) => c.attendu.length === 0;
  const br = (c) => bruts[c.n];
  const travaux = (c) => br(c).energie_travaux || [];
  const coche = (c) => travaux(c).length > 0 && !egalTableau(travaux(c), ['aucun']);
  const declare = (c) => Array.isArray(br(c).energie_sans_label);
  const aA = (x, c) => x.pro_id === br(c).pro_id;
  const choisis = (c) => br(c).energie_sous_traitants || [];
  const connus = (c) => new Map((c.sousTraitants || []).map((t) => [t.id, t.pro_id]));
  const reponse = (c) => (br(c).client_id && br(c).pour_qui_client === br(c).client_id ? br(c).pour_qui : null);
  const gardes = [
    ['le signe de B SEUL, complet : le point reste', (c) => coche(c) && c.labels.length > 0 && c.labels.every((g) => !aA(g, c))
      && c.labels.some((g) => g.justificatif_chemin !== null) && r14(c)],
    ['le sous-traitant de B SEUL choisi : le point reste', (c) => br(c).energie_sous_traitance === true && choisis(c).length > 0
      && choisis(c).every((id) => connus(c).has(id) && connus(c).get(id) !== br(c).pro_id) && r14(c)],
    ['un sous-traitant ORPHELIN seul choisi, A en ayant un : le point reste', (c) => br(c).energie_sous_traitance === true
      && choisis(c).length > 0 && choisis(c).every((id) => !connus(c).has(id))
      && c.sousTraitants.some((t) => aA(t, c)) && r14(c)],
    ['un signe de A valable SANS certificat, non déclaré : le point', (c) => coche(c) && !declare(c)
      && c.labels.some((g) => aA(g, c) && g.justificatif_chemin === null && g.valide_jusquau >= '2999-01-01') && r14(c)],
    ['un signe de A valable SANS certificat, DÉCLARÉ : le point reste', (c) => coche(c) && declare(c)
      && c.labels.some((g) => aA(g, c) && g.justificatif_chemin === null && g.valide_jusquau >= '2999-01-01') && r14(c)],
    ['un signe de A expiré, déclaré : rien', (c) => coche(c) && declare(c) && c.labels.length > 0
      && c.labels.every((g) => aA(g, c) && g.valide_jusquau <= '2001-12-31') && rien(c)],
    ['« Aucun », une déclaration et des sous-traitants RESTÉS : rien', (c) => egalTableau(travaux(c), ['aucun']) && declare(c)
      && choisis(c).length > 0 && rien(c)],
    ['« Non », des identifiants RESTÉS : rien', (c) => br(c).energie_sous_traitance === false && choisis(c).length > 0 && rien(c)],
    ['pour son entreprise, un travail coché : rien', (c) => reponse(c) === 'professionnel' && coche(c) && rien(c)],
    ['une petite entreprise hors de son activité, un travail coché : rien', (c) => reponse(c) === 'professionnel_hors_activite'
      && coche(c) && rien(c)],
    ['la réponse « à quel titre » vide, un travail coché : la prudence', (c) => reponse(c) === null && br(c).client_id && coche(c)
      && c.attendu.some((m) => m.cle === 'devis_energie_mentions_prudence')],
    ['une ligne de prudence SEULE, à titre privé : la prudence', (c) => reponse(c) === 'consommateur' && coche(c)
      && travaux(c).every((k) => k === 'photovoltaique' || k === 'desembouage')
      && c.attendu.some((m) => m.cle === 'devis_energie_mentions_prudence')],
    ['une déclaration VIDE DE VALEUR, un travail non couvert : la loi', (c) => reponse(c) === 'consommateur' && coche(c)
      && !declare(c) && c.labels.length === 0 && br(c).energie_sous_traitance === false
      && c.attendu.some((m) => m.cle === 'devis_energie_mentions')],
  ];
  for (const [quoi, f] of gardes) if (!cas.some(f)) throw new Error(`aucun cas de l’énergie : ${quoi}`);
}
/* (e) le format : chaque cas porte ses `labels` et ses `sousTraitants` (des
   listes, vides le plus souvent). */
if (cas.some((c) => !Array.isArray(c.labels) || !Array.isArray(c.sousTraitants))) {
  throw new Error('un cas ne porte pas ses labels ou ses sous-traitants');
}

const LISEZ_MOI = 'Engendré par scripts/generer-cas-remise.mjs : ce que motifs_refus_remise() (schema.sql, section 49.9) '
  + 'rend pour chaque situation, jouée par la VRAIE base (le devis et ses lignes écrits par le chemin d’un client, la '
  + 'fiche de l’entreprise posée en superutilisateur). Chaque cas : { n, nom, devis (rowToDevis, dates à null), lignes '
  + '(la traduction de rowToLigne, dans l’ordre où elles ont été ÉCRITES), regime (emetteur.regime_tva), motifsEmetteur '
  + '(la sortie de emetteur_incomplet, des « clé: phrase »), assurances (2b-3 : toutes les lignes de emetteur_assurances, '
  + 'celles d’un autre artisan comprises, aux dates FIXES 2001 ou 2999), lieux (2b-5 : tous les lieux de dépôt des déchets de '
  + 'la base, en objets { id, proId }, ceux d’un autre artisan compris), labels (2b-6 : tous les signes de qualité de la base, '
  + 'en lignes { id, pro_id, categories, valide_jusquau, justificatif_chemin }, ceux d’un autre artisan compris, aux dates FIXES), '
  + 'sousTraitants (2b-6 : tous les sous-traitants de la base, en lignes { id, pro_id, label_detient, label_categories, '
  + 'label_valide_jusquau, label_justificatif_chemin }, ceux d’un autre artisan compris, aux dates FIXES), attendu (les lignes '
  + 'de la fonction dans son ordre : rang, '
  + 'cle, phrase, nature, et ligne_id remplacé par l’INDICE de la ligne dans lignes, ou null) }. verifier-devis fait '
  + 'tourner motifsDeRemise (src/lib/devis.js) dessus et exige zéro écart. À relancer et commiter dès que la règle change.';
const texte = `{"_lisez_moi": ${JSON.stringify(LISEZ_MOI)},\n"cas": [\n${cas.map((c) => JSON.stringify(c)).join(',\n')}\n]}\n`;

if (VERIFIER) {
  let actuel = '';
  try { actuel = readFileSync(SORTIE, 'utf8'); } catch { /* absent : écart */ }
  if (actuel !== texte) {
    console.error('✘ supabase/cas-remise.json ne correspond plus à ce que la base rend : relancez '
      + '`node scripts/generer-cas-remise.mjs`, relisez le diff, et commitez-le.');
    process.exit(1);
  }
  console.log(`✔ supabase/cas-remise.json correspond à ce que la base rend (${cas.length} cas)`);
} else {
  writeFileSync(SORTIE, texte);
  const motifs = cas.reduce((t, c) => t + c.attendu.length, 0);
  console.log(`${cas.length} cas écrits dans supabase/cas-remise.json (${motifs} motifs, `
    + `${cas.filter((c) => c.attendu.length === 0).length} cas où rien ne manque)`);
}
