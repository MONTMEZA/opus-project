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
 *   { n, nom, devis, lignes, regime, motifsEmetteur, attendu }
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
 *   - `attendu` : les lignes de la fonction, dans son ordre de sortie —
 *     `{ rang, cle, phrase, nature, ligne_id }`, où `ligne_id` est remplacé
 *     par l'INDICE de la ligne désignée dans `lignes` (ou `null`).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rowToDevis } from '../src/lib/devis.js';

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
const P = 'a4900000-0000-4000-8000-00000000000e';
const C1 = 'c4900000-0000-4000-8000-0000000000c1';
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
};

/* ---------------------------------------------------------------------------
   LES DEVIS. Le devis « complet » : client, lieu, délai, validité. Une
   situation le change par `devis` (des colonnes à écrire, aux noms de la
   base) ; ses lignes sont écrites dans l'ordre donné.
   --------------------------------------------------------------------------- */
const COMPLET = {
  client_id: C1, lieu_adresse: '4 rue de l’Essai', lieu_code_postal: '13410', lieu_ville: 'Lambesc',
  delai_execution: 'Dans les 30 jours suivant la signature', validite_jours: 30,
};
const VIDE = {
  client_id: null, lieu_adresse: null, lieu_code_postal: null, lieu_ville: null,
  delai_execution: null, validite_jours: null,
};
// Lignes : poste, option, et les trois sans chiffre.
const poste = (prix, taux, extra = {}) => ({ type: 'poste', prix, taux, ...extra });
const option = (prix, taux, extra = {}) => ({ type: 'option', prix, taux, ...extra });
const titre = (type, extra = {}) => ({ type, ...extra });
const UN_POSTE_0 = [poste(100000, 0)];
const UN_POSTE_20 = [poste(100000, 2000)];

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
  // --- devis_taux_regime
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
  { nom: 'les neuf motifs du devis à la fois', e: 'franchise',
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
   'registre', now() + interval '1 hour', null);
insert into auth.users (id, email, raw_user_meta_data) values
 ('${A}', 'a-cas-remise@exemple-opus.test', jsonb_build_object('type','pro','siret','00004900700016','nom','A Essais',
   'entreprise','A Essais','metiers',jsonb_build_array('macon'),'ville','Lambesc (13)')),
 ('${P}', 'p-cas-remise@exemple-opus.test', jsonb_build_object('type','particulier','nom','P Essais','ville','Lambesc (13)'));
insert into public.clients (id, pro_id, type, nom, adresse, code_postal, ville)
values ('${C1}', '${A}', 'particulier', 'Client essai A', '4 rue de l''Essai', '13410', 'Lambesc');
insert into public.quote_requests (id, client_id, professional_id, metier, description, ville, statut)
values ('${QA}', '${P}', '${A}', 'macon', 'Refaire la salle de bain', 'Lambesc', 'accepte');
insert into public.sos_requests (id, client_id, professional_id, metier_key, probleme_key, statut)
values ('${SA}', '${P}', '${A}', 'plomberie', 'fuite', 'acceptee');
`;
SITUATIONS.forEach((s, k) => {
  const n = k + 1;
  const d = idDevis(n);
  const cols = { source: 'manuelle', ...COMPLET, ...(s.devis || {}) };
  const noms = Object.keys(cols);
  sql += `savepoint s${n};\n${(ENTREPRISES[s.e] || []).join('\n')}\n`;
  sql += `set local role authenticated;\nset local request.jwt.claim.sub = '${A}';\n`;
  sql += `insert into public.devis (id, pro_id, ${noms.join(', ')}, generation) values ('${d}', '${A}', ${noms.map((c) => q(cols[c])).join(', ')}, 1);\n`;
  s.lignes.forEach((l, i) => {
    const id = idLigne(n, l.id ?? i + 1);
    const ordre = l.ordre ?? (i + 1) * 1000;
    if (l.type === 'poste' || l.type === 'option') {
      sql += `insert into public.devis_lignes (id, devis_id, ordre, type, designation, quantite_milliemes, unite, prix_unitaire_centimes, taux_tva_centiemes, offert, generation)
values ('${id}', '${d}', ${ordre}, '${l.type}', 'Ligne ${i + 1}', 1000, 'forfait', ${l.prix}, ${l.taux}, ${l.offert === true}, ${i + 2});\n`;
    } else {
      sql += `insert into public.devis_lignes (id, devis_id, ordre, type, designation, generation)
values ('${id}', '${d}', ${ordre}, '${l.type}', 'Titre ${i + 1}', ${i + 2});\n`;
    }
  });
  sql += `select 'DEVIS|${n}|' || row_to_json(x)::text from public.devis x where x.id = '${d}';
select 'LIGNES|${n}|' || coalesce(json_agg(row_to_json(l) order by l.generation)::text, '[]') from public.devis_lignes l where l.devis_id = '${d}';
select 'REGIME|${n}|' || coalesce((select to_json(e.regime_tva)::text from public.emetteur e where e.pro_id = '${A}'), 'null');
select 'EMET|${n}|' || to_json(public.emetteur_incomplet('${A}'))::text;
select 'SORTIE|${n}|' || coalesce(json_agg(json_build_object('rang', m.rang, 'cle', m.cle, 'phrase', m.phrase,
       'nature', m.nature, 'ligne_id', m.ligne_id) order by m.o)::text, '[]')
  from public.motifs_refus_remise('${d}') with ordinality as m(rang, cle, phrase, nature, ligne_id, o);
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
  const m = l.match(/^(DEVIS|LIGNES|REGIME|EMET|SORTIE)\|(\d+)\|(.*)$/);
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
  generation: nombreOuNul(l.generation),
  modifieLe: null,
});

const cas = SITUATIONS.map((s, k) => {
  const n = k + 1;
  const r = lu[n];
  if (!r || !r.DEVIS || !r.LIGNES || !('REGIME' in r) || !r.EMET || !r.SORTIE) {
    throw new Error(`cas ${n} (${s.nom}) : la base n’a pas tout rendu`);
  }
  const devis = { ...rowToDevis(r.DEVIS), createdAt: null, modifieLe: null };
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
  return { n, nom: s.nom, devis, lignes, regime: r.REGIME, motifsEmetteur: r.EMET, attendu };
});

/* Ce que le fichier doit couvrir, vérifié ici : chaque motif du devis seul
   au moins une fois, chaque nature, un cas où rien ne manque, et des motifs
   de l'entreprise. Un fichier qui ne couvre plus quelque chose rougit à la
   génération, pas au premier défaut. */
const CLES_DU_DEVIS = ['devis_client', 'devis_lignes', 'devis_taux_regime', 'devis_lieu', 'devis_delai',
  'devis_validite', 'devis_acompte_nature', 'devis_acompte_ramene', 'devis_reduction_ramenee'];
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

const LISEZ_MOI = 'Engendré par scripts/generer-cas-remise.mjs : ce que motifs_refus_remise() (schema.sql, section 49.9) '
  + 'rend pour chaque situation, jouée par la VRAIE base (le devis et ses lignes écrits par le chemin d’un client, la '
  + 'fiche de l’entreprise posée en superutilisateur). Chaque cas : { n, nom, devis (rowToDevis, dates à null), lignes '
  + '(la traduction de rowToLigne, dans l’ordre où elles ont été ÉCRITES), regime (emetteur.regime_tva), motifsEmetteur '
  + '(la sortie de emetteur_incomplet, des « clé: phrase »), attendu (les lignes de la fonction dans son ordre : rang, '
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
