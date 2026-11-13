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
 *   { n, nom, devis, lignes, regime, motifsEmetteur, assurances, attendu }
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
const q = (v) => (v === null || v === undefined ? 'null' : typeof v === 'number' ? String(v)
  : typeof v === 'boolean' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

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
const COMPLET = {
  client_id: C1, lieu_adresse: '4 rue de l’Essai', lieu_code_postal: '13410', lieu_ville: 'Lambesc',
  delai_execution: 'Dans les 30 jours suivant la signature', validite_jours: 30,
  pour_qui: 'consommateur', pour_qui_client: C1,
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
  { nom: 'un devis NEUF (rien de dit) : client, lignes, lieu, délai, validité', e: 'franchise', devis: VIDE, lignes: [] },
  { nom: 'les neuf rangs du devis à la fois (le rang 3 en franchise)', e: 'franchise',
    devis: { ...VIDE, acompte_centimes: 5000, remise_centimes: 100 }, lignes: [option(10000, 2000)] },
  { nom: 'un devis neuf et AUCUNE fiche : les motifs du devis puis ceux de l’entreprise', e: 'vide', devis: VIDE, lignes: [] },
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
  { nom: 'D4-c : devis NEUF VIDE venu d’une urgence', e: 'franchise',
    devis: { ...VIDE, sos_request_id: SA, source: 'urgence' }, lignes: [] },
  { nom: 'D4-c : devis NEUF VIDE venu d’une demande ET d’une urgence', e: 'franchise',
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
  { nom: 'un devis NEUF (rien de dit) et aucune assurance : client, lignes, lieu, délai, validité, puis devis_decennale',
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
  const m = l.match(/^(DEVIS|LIGNES|REGIME|EMET|SORTIE|ASSUR)\|(\d+)\|(.*)$/);
  if (m) (lu[m[2]] ||= {})[m[1]] = JSON.parse(m[3]);
}

const nombreOuNul = (v) => (v === null || v === undefined ? null : Number(v));
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

const cas = SITUATIONS.map((s, k) => {
  const n = k + 1;
  const r = lu[n];
  if (!r || !r.DEVIS || !r.LIGNES || !('REGIME' in r) || !r.EMET || !r.SORTIE || !r.ASSUR) {
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
  return { n, nom: s.nom, devis, lignes, regime: r.REGIME, motifsEmetteur: r.EMET, assurances, attendu };
});

/* Ce que le fichier doit couvrir, vérifié ici : chaque motif du devis seul
   au moins une fois, chaque nature, un cas où rien ne manque, et des motifs
   de l'entreprise. Un fichier qui ne couvre plus quelque chose rougit à la
   génération, pas au premier défaut. */
const CLES_DU_DEVIS = ['devis_client', 'devis_pour_qui', 'devis_lignes', 'devis_taux_franchise', 'devis_taux_sans_tva',
  'devis_taux_reduit_neuf', 'devis_lieu', 'devis_delai', 'devis_validite', 'devis_acompte_nature', 'devis_acompte_ramene',
  'devis_reduction_ramenee', 'devis_acompte_signature', 'devis_decennale', 'devis_attestation_date', 'devis_attestation'];
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
if (cas.length < 85 || cas.slice(0, 85).some((c, i) => c.n !== i + 1)) throw new Error('les 85 cas d’avant ont bougé');

const LISEZ_MOI = 'Engendré par scripts/generer-cas-remise.mjs : ce que motifs_refus_remise() (schema.sql, section 49.9) '
  + 'rend pour chaque situation, jouée par la VRAIE base (le devis et ses lignes écrits par le chemin d’un client, la '
  + 'fiche de l’entreprise posée en superutilisateur). Chaque cas : { n, nom, devis (rowToDevis, dates à null), lignes '
  + '(la traduction de rowToLigne, dans l’ordre où elles ont été ÉCRITES), regime (emetteur.regime_tva), motifsEmetteur '
  + '(la sortie de emetteur_incomplet, des « clé: phrase »), assurances (2b-3 : toutes les lignes de emetteur_assurances, '
  + 'celles d’un autre artisan comprises, aux dates FIXES 2001 ou 2999), attendu (les lignes de la fonction dans son ordre : rang, '
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
