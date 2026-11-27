/**
 * L'APERÇU D'UN DEVIS — étape 2c-1, cahier §8.1 (sections A à H, et B.15).
 *
 * CE QUE CE CONTRÔLE GARDE
 * ------------------------
 * L'aperçu imprime des FAITS (l'instantané, `instantane-devis.js`) devenus
 * des PHRASES (la composition, `document-devis.js`). Ce contrôle FAIT
 * TOURNER la chaîne : il ne lit pas le code pour deviner ce qu'il rend, il
 * l'appelle sur des cas écrits ici et compare la sortie à des valeurs
 * écrites EN TOUTES LETTRES (K11 : les oracles ne sont pas le code).
 *
 *   A. l'instantané — la liste fermée des champs (dans les deux sens), ce
 *      qui n'y entre jamais (téléphone, e-mail, notes du client), la réponse
 *      « à quel titre » valable, les refus, la parité avec les conversions
 *      de l'application, et le DÉTERMINISME : trois fuseaux et deux horloges
 *      fausses, dans des processus à part, doivent rendre la même chose ;
 *   B. la composition — sa forme, les totaux de la BASE, la table des places
 *      des motifs, « marqueur ⇔ motif » sur les 237 cas de
 *      `supabase/cas-remise.json` (la liste rendue par la VRAIE fonction
 *      SQL), la parité des clés de l'entreprise, les mentions dues à un
 *      particulier, les assurances échues, les frais, le régime, les unités,
 *      l'ordre des totaux, les places de 2c-2, le mode exemple, et les MOTS
 *      (§4.8), chaque règle avec ses exceptions fermées et sa contre-épreuve ;
 *   C. le gabarit HTML (`devis-html.js`) — il n'importe rien (lu par l'arbre
 *      de TypeScript) ; l'échappement ; les éléments, les attributs et le CSS
 *      jugés par des LISTES POSITIVES (le CSS lu par jetons, un échappement,
 *      un commentaire, une fonction se voient), avec leur contre-épreuve
 *      (chaque forme refusée, glissée dans une vraie page, est vue) ; la
 *      structure (une ligne = un `div.ligne`, ce qui ne se sépare pas) ; les
 *      marques ; le numéro en attente par sa STRUCTURE ; les polices et la
 *      palette ; et le gabarit n'écrit rien : le texte de la page = les
 *      chaînes du document, dans les deux sens ;
 *   E. le tampon (`tampon-apercu.js`), avec le VRAI pdf-lib, sur des PDF
 *      témoins fabriqués ici : chaque page marquée (tête, diagonale, pied,
 *      lus dans le flux décodé, en toutes lettres), le contenu d'origine
 *      gardé, la géométrie, les textes en liste fermée, les polices lues dans
 *      TOUS les objets (XObjects compris), les métadonnées, le déterminisme ;
 *   F. la fabrication (`fabrication-apercu.js`) avec de faux outils et une
 *      fausse horloge : la mise en page en A4, chaque échec avec son étape et
 *      sa phrase, les délais doux et dur, le verrou, la purge ;
 *   G. les réglages de l'afficheur, par valeur, et l'adresse permise ;
 *   H. la séance (`etapes-apercu.js`), jouée sur la VRAIE chaîne : les
 *      étapes, ce que VoiceOver entend, les refus, l'arrêt à chaque étape,
 *      l'aperçu précédent, la phrase du long devis, le navigateur ; et les
 *      Détails, qui ne reçoivent rien du document.
 *
 *   D. les polices engendrées (`polices-devis.js`) — ses exports, la licence
 *      en tête, l'empreinte et la taille de chaque WOFF2, sa cmap lue par un
 *      VRAI lecteur de WOFF2 écrit ici = celle que fontTools a rangée = celle
 *      écrite en toutes lettres = celle de la police d'origine dans les
 *      plages demandées, ses noms de licence, et qu'aucun fichier de
 *      l'application ne la charge au démarrage ;
 *   B.15 les empreintes (K8) — l'instantané, le document, la page et le
 *      tampon de chaque cas, figés par `--figer` dans
 *      `scripts/donnees/apercu-empreintes.json` : une empreinte qui change
 *      SOUS LA MÊME VERSION est refusée, même par `--figer`.
 *
 * E tourne AUSSI sur trois PDF commités (`scripts/donnees/`, K16) : deux PDF
 * de Chromium faits par la vraie chaîne et les vraies polices, et le premier
 * dont chaque page est un XObject, comme iOS (`generer-pdf-apercu.mjs`).
 *
 * Chaque vérification porte son NUMÉRO dans sa sortie (« A.1 », « C.4 ») :
 * le banc de sabotages relève le nom de celle qui rougit (K13). Une section
 * qui lève, ou qui ne se termine pas, rougit sous son numéro (`sousGarde`).
 *
 * DEPUIS L'ÉTAPE 4 (les enveloppes), il LIT aussi ce que `node` ne peut pas
 * ouvrir, par l'arbre de TypeScript : F.2 (`devis-pdf.js` : la forme du
 * `require` de pdf-lib que Metro tient pour facultative, `expo-print` après
 * sa sonde ; et `devis-pdf.web.js`, JOUÉ) ; G.3 et G.4 (`AfficheurPdf.js` :
 * les réglages étalés en dernier, la porte ; le cadre web fermé) ; H.2 à
 * H.4 (l'écran, la carte, la saisie, les exemples, et leurs mots) ; H.6 (le
 * témoin K9, ENGENDRÉ par `--figer`, et les huit caractères que l'iPhone
 * doit afficher) ; I.1 (la liste des fichiers de l'aperçu, DÉRIVÉE de la
 * fermeture de ses imports, comparée à git et aux listes des contrôles).
 *
 * Ni base, ni navigateur, ni réseau : il tourne dans GitHub.
 *
 *   npm run verifier-apercu
 *   npm run verifier-apercu -- --figer   (sur un poste : refige B.15 et engendre le témoin H.6)
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';

import {
  instantaneDuDevis, cheminsDeLInstantane, COLONNES_DE_L_INSTANTANE, VERSIONS_DU_RENDU, MODES, STATUTS_EDITEUR,
  VERSION_INSTANTANE,
} from '../src/lib/instantane-devis.js';
import {
  documentDuDevis, VERSION_COMPOSITION, PREFIXE_A_VENIR, MARQUES, MARQUEURS, A_VENIR, RANG_EN_ATTENTE,
  SOURCE_EXEMPLE, FRAIS_HORS_DU_TOTAL,
} from '../src/lib/document-devis.js';
import {
  rowToDevis, ligneDepuisBase, totauxDepuisBase, totauxDuDevisLu, rangeesImprimees, sommeDesLignesLues,
  UNITES_IMPRIMEES, PLACES_DES_MOTIFS, compterLesPlaces, MOTIFS_DEVIS, CARTE_APERCU, typeDe,
  mentionComptee, tvaDe, LES_DECHETS, LE_LABEL, LE_CHANTIER,
} from '../src/lib/devis.js';
import {
  enteteImprime, enteteImprimeDetaille, motifsEmetteur, MOTIFS, PREFIXE_MANQUE, assurancesDansLOrdre, validerEmetteur,
} from '../src/lib/emetteur.js';
import { clientDepuisBase } from '../src/lib/clients.js';
import { jourAParis, nombreDe } from '../src/lib/formats.js';
import { FORMES_JURIDIQUES } from '../src/data/formes-juridiques.js';
import { createRequire } from 'node:module';
import ts from 'typescript';
import {
  devisHtml, echapper, VERSION_GABARIT, PALETTE_PAPIER, RANG_GABARIT, TITRE_DE_LA_FENETRE, LIMITE_POLICE, CLASSES_EN_OSWALD,
} from '../src/lib/devis-html.js';
import * as A4 from '../src/lib/format-a4.js';
import {
  tamponner, TEXTES_DU_TAMPON, SEPARATEUR_TETE, FORME_DU_NUMERO, POLICES_STANDARD, issueDesPolices, geometrieDuTampon, policesDuDocument,
  lignesDeLaTete, marquesDeLaTete, piedDeLaPage, sEcritTelQuel,
} from '../src/lib/tampon-apercu.js';
import { creerFabrique, PHRASES_DE_LA_FABRICATION, DELAI_DOUX, DELAI_DUR, OUTILS_REQUIS } from '../src/lib/fabrication-apercu.js';
import {
  creerSeance, TEXTES_DES_ETAPES, PHRASES_DE_LA_SEANCE, BOUTONS, PHRASE_LONG_DEVIS, DELAI_PRECEDENT, DELAI_PHRASE_LONGUE,
  annoncePrete, nombreLocal, phraseDeLEnregistrement, empreinteFnv1a, detailsDeFabrication, ANNONCE_WEB,
  PHRASE_POLICES_DU_TELEPHONE, TEXTES_DE_L_ECRAN, resumeDuDocument, ligneAvantLeDocument, phraseDeCeQuiManque,
} from '../src/lib/etapes-apercu.js';
import { PROPS_AFFICHEUR, adresseAutorisee, DELAI_AFFICHAGE } from '../src/lib/reglages-afficheur.js';
import {
  composerLApercu, empreintesDeControle, MAINTENANT_DES_EMPREINTES, MARQUES_DU_TEMOIN,
} from '../src/lib/composition-apercu.js';
import { C as COULEURS } from '../src/theme.js';

/* `@cantoo/pdf-lib` par `createRequire` (K-m3) : un `import` prendrait la
   construction `es/`, alors que Metro empaquette `cjs/`. */
const exiger = createRequire(import.meta.url);
const PDFLib = exiger('@cantoo/pdf-lib');

/* Des « polices » pour le gabarit : des chaînes base64, une par police, pour
   reconnaître chaque `@font-face`. Les vraies, engendrées, viennent à
   l'étape 3 (`polices-devis.js`, section D). */
const POLICES_ESSAI = Object.freeze({ inter400: 'SU5URVItNDAw', inter700: 'SU5URVItNzAw', oswald600: 'T1NXQUxELTYwMA==' });

const SOUS_PROCESSUS = process.argv.includes('--sous-processus');
/* `--figer` : écrire `scripts/donnees/apercu-empreintes.json` (B.15) — jamais
   en CI, et jamais par-dessus une empreinte qui change SOUS LA MÊME VERSION. */
const FIGER = process.argv.includes('--figer');
const ICI = fileURLToPath(import.meta.url);
const NS = ' ';

/* ------------------------------------------------------------------ */
/*  Outils                                                              */
/* ------------------------------------------------------------------ */

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${String(detail).slice(0, 1500)}` : ''}`);
};
const section = (titre) => console.log(`\n${titre}`);
const lire = (f) => readFileSync(f, 'utf8');
/* Un JSON aux clés TRIÉES : deux objets égaux s'écrivent pareil, quel que
   soit l'ordre de leurs clés. */
const trier = (v) => {
  if (Array.isArray(v)) return v.map(trier);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, trier(v[k])]));
  return v;
};
const canon = (v) => JSON.stringify(trier(v));
const egal = (a, b) => canon(a) === canon(b);
/* Les commentaires partent avant toute lecture du code : un contrôle qui
   accuse la documentation qui explique le défaut, ce projet l'a vu dix fois. */
const sansCommentaires = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/* Toutes les CHAÎNES d'un objet, avec leur chemin. */
function chaines(v, chemin = '', sortie = []) {
  if (typeof v === 'string') sortie.push({ chemin, texte: v });
  else if (Array.isArray(v)) v.forEach((x, i) => chaines(x, `${chemin}[${i}]`, sortie));
  else if (v && typeof v === 'object') Object.keys(v).forEach((k) => chaines(v[k], chemin ? `${chemin}.${k}` : k, sortie));
  return sortie;
}
/* Un compte de clés (un multiensemble), pour comparer deux listes de motifs. */
const compte = (cles) => cles.reduce((m, c) => ({ ...m, [c]: (m[c] || 0) + 1 }), {});

/* ------------------------------------------------------------------ */
/*  Les données des cas — inventées, et écrites ici                     */
/* ------------------------------------------------------------------ */

/* Le 26/11/2026 à 10 h 30 à Paris (UTC+1 en hiver). */
const MAINTENANT = Date.UTC(2026, 10, 26, 9, 30);

/* L'entreprise telle que `api.monEntreprise()` la rend : des colonnes en
   plus (`id`, `pro_id`, `statut_diffusion`, `retiree_le`) que l'instantané
   ne garde pas. `verifie_le` à 22 h 30 à Greenwich, 0 h 30 à Paris (UTC+2
   en septembre) : le jour de Paris est le 29/09, celui de Greenwich le 28
   (D28). */
const ENT = Object.freeze({
  id: 'ent-1', pro_id: 'pro-1', siren: '000004887', siret: '00000488700014', denomination: 'ESSAI A', nom_commercial: null,
  est_ei: false, forme_juridique: '5499', est_siege: true, tva: 'FR26000004887', adresse: '12 RUE DE L ESSAI 13004 MARSEILLE',
  code_postal: '13004', commune: 'MARSEILLE', statut_diffusion: 'O', maj_insee: '2026-09-02', source: 'registre',
  verifie_le: '2026-09-28T22:30:00.000Z', retiree_le: null,
});
/* La fiche « Mon entreprise », COMPLÈTE, au régime réel — avec ses colonnes
   techniques, que l'instantané ne garde pas. */
const EM = Object.freeze({
  id: 'em-1', pro_id: 'pro-1', denomination_ei: null, registre: 'rcs', greffe_ville: 'Marseille', capital_centimes: 100000,
  capital_variable: false, en_liquidation: false, locataire_gerant: false, etablissement_adresse: null,
  etablissement_code_postal: null, etablissement_ville: null, siege_adresse: null, siege_code_postal: null, siege_ville: null,
  telephone: '04 91 00 00 00', email: 'contact@exemple-opus.test', regime_tva: 'reel', regime_tva_declare_le: '2026-09-01T10:00:00Z',
  mediateur_nom: 'Médiation Solution', mediateur_adresse: 'Adresse de son contrat', mediateur_site: 'https://sasmediationsolution-conso.fr/',
  garantie_legale_texte: 'Parfait achèvement, biennale et décennale.', garantie_commerciale_texte: 'Deux ans sur la pose.',
  sav_texte: 'Sous quarante-huit heures.', modalites_paiement_texte: 'Paiement à réception de facture.',
  modalites_execution_texte: 'Travaux réalisés aux dates convenues.', reclamations_texte: 'Par écrit, réponse sous quinze jours.',
  modifie_le: '2026-11-01T10:00:00Z',
});
const DECENNALE_VALABLE = Object.freeze({
  id: 'as-1', pro_id: 'pro-1', nature: 'decennale', libelle: null, assureur_nom: 'Assureur Témoin', assureur_coordonnees: '1 rue des Assureurs, Paris',
  couverture: 'France métropolitaine', numero_contrat: 'C-42', valide_jusquau: '2027-06-30', created_at: '2026-10-01T08:00:00+00:00',
  attestation_chemin: 'pro-1/attestation-decennale.pdf',
});
const RC_ECHUE = Object.freeze({
  ...DECENNALE_VALABLE, id: 'as-2', nature: 'rc_pro', assureur_nom: 'Second Assureur', numero_contrat: null,
  valide_jusquau: '2026-10-01', created_at: '2026-10-02T08:00:00+00:00',
});
const TARIFS_35 = Object.freeze({ pro_id: 'pro-1', frais_deplacement_centimes: 3500, frais_deplacement_texte: 'au-delà de 20 km', affiche: false });

/* Un devis tel que la BASE le range (noms de colonnes) — `rowToDevis` en
   fait la forme de l'application, comme `api.unDevis`. */
const devisBrut = (o = {}) => ({
  id: 'dev-1', pro_id: 'pro-1', client_id: 'cli-1', quote_request_id: null, sos_request_id: null, source: 'manuelle', statut: 'brouillon',
  objet: 'Salle de bains', lieu_adresse: '4 rue de l’Essai', lieu_code_postal: '13410', lieu_ville: 'Lambesc',
  delai_execution: 'Trois semaines', retenue_garantie_centiemes: null, remise_centiemes: null, remise_centimes: null,
  acompte_centiemes: null, acompte_centimes: null, acompte_nature: null, validite_jours: 30, total_ht_centimes: 56250,
  total_tva_centimes: 5625, total_ttc_centimes: 61875, remise_ht_centimes: 0, acompte_ttc_centimes: 0,
  total_ttc_options_centimes: 61875, pour_qui: 'consommateur', pour_qui_client: 'cli-1', chantier_neuf_conso: null,
  chantier_neuf_conso_le: null, chantier_neuf_tva: null, engage_decennale: null, acompte_a_la_signature: null,
  cout_devis_centimes: 0, generation: 3, created_at: '2026-11-20T10:00:00+00:00', modifie_le: '2026-11-20T10:00:00+00:00',
  ...o,
});
let rangDeLigne = 0;
const ligneBrute = (o = {}) => {
  rangDeLigne += 1;
  return {
    id: `lig-${String(rangDeLigne).padStart(3, '0')}`, devis_id: 'dev-1', ordre: rangDeLigne * 1000, type: 'poste', designation: 'Carrelage',
    quantite_milliemes: 12500, unite: 'm2', prix_unitaire_centimes: 4500, taux_tva_centiemes: 1000, total_centimes: 56250, offert: false,
    main_oeuvre: false, fourniture_non_comprise: false, surface_sol_milliemes: null, surface_murs_milliemes: null, urgence: false,
    generation: 3, modifie_le: '2026-11-20T10:00:00+00:00', ...o,
  };
};
const tvaBrute = (taux, base, tva, nb = 1, remise = 0) => ({
  taux_tva_centiemes: taux, base_centimes: base, remise_centimes: remise, tva_centimes: tva, nb_lignes: nb,
});
const CLIENT_BRUT = Object.freeze({
  id: 'cli-1', pro_id: 'pro-1', type: 'particulier', nom: 'Mme TÉMOIN', siret: null, telephone: '06 39 98 00 11',
  email: 'temoin@exemple-opus.test', adresse: '99 rue du Témoin', code_postal: '13410', ville: 'Lambesc',
  notes: 'NOTE-TÉMOIN : ne jamais imprimer', archive: false, created_at: '2026-10-05T10:00:00+00:00', modifie_le: '2026-10-05T10:00:00+00:00',
});
const CLIENT_ENT_BRUT = Object.freeze({
  ...CLIENT_BRUT, id: 'cli-2', type: 'entreprise', nom: 'SCI DU TÉMOIN', siret: '00004800900013', telephone: null, email: null, notes: null,
});

/* Ce que `api.unDevis` rend : la même composition que `unDevisSupabase`
   (A.5 vérifie que l'API compose bien ainsi). */
const lu = (d, lignes, tva) => ({
  devis: rowToDevis(d), lignes: lignes.map(ligneDepuisBase), ventilation: totauxDepuisBase({ ...d, devis_tva: tva }).ventilation,
});

/* UN CAS : les lignes BRUTES (pour la parité A.5), et les entrées de
   l'instantané qui en sont tirées. Tout ce qui n'est pas dit est le cas
   « complet » : réel, client particulier, une décennale valable, 35 € de
   déplacement, le n° de TVA de l'annuaire. */
function cas(nom, o = {}) {
  rangDeLigne = 0;
  const devis = devisBrut(o.devis || {});
  const lignes = (o.lignes || [{}]).map((l) => ligneBrute(l));
  const tva = o.tva || [tvaBrute(1000, 56250, 5625)];
  const client = Object.prototype.hasOwnProperty.call(o, 'client') ? o.client : CLIENT_BRUT;
  const brut = { devis, lignes, tva, client };
  const entrees = {
    devisLu: Object.prototype.hasOwnProperty.call(o, 'devisLu') ? o.devisLu : lu(devis, lignes, tva),
    entreprise: Object.prototype.hasOwnProperty.call(o, 'entreprise') ? o.entreprise : ENT,
    emetteur: Object.prototype.hasOwnProperty.call(o, 'emetteur') ? o.emetteur : EM,
    assurances: Object.prototype.hasOwnProperty.call(o, 'assurances') ? o.assurances : [DECENNALE_VALABLE],
    tarifs: Object.prototype.hasOwnProperty.call(o, 'tarifs') ? o.tarifs : TARIFS_35,
    preuveTva: Object.prototype.hasOwnProperty.call(o, 'preuveTva') ? o.preuveTva : null,
    client: client ? clientDepuisBase(client) : null,
    maintenant: o.maintenant ?? MAINTENANT,
    statut: o.statut ?? 'essai',
    mode: o.mode ?? 'apercu',
  };
  return { nom, brut, entrees, attendu: o.attendu || {} };
}

const PIECE = { type: 'piece', designation: 'Salle de bains', quantite_milliemes: null, unite: null, prix_unitaire_centimes: null,
  taux_tva_centiemes: null, total_centimes: null };
const ZONE = { ...PIECE, type: 'zone', designation: 'Rez-de-chaussée' };
const RESERVE = { ...PIECE, type: 'reserve', designation: 'Sous réserve de l’état du support' };
const sansTaux = (l) => ({ ...l, taux_tva_centiemes: 0 });

const PREUVE = Object.freeze({ pro_id: 'pro-1', siren: '000004887', numero: 'FR26000004887', source: 'vies',
  reconnu_le: '2026-10-20T13:51:01+00:00', declare_le: null, declaration_texte: null });

/* LES CAS A (§8.1 : une trentaine) — chacun avec ce qu'on attend de lui,
   écrit ici. */
const CAS_A = [
  cas('réel, complet', { attendu: { valable: 'consommateur' } }),
  cas('franchise, sans taxe', {
    emetteur: { ...EM, regime_tva: 'franchise' }, lignes: [sansTaux({})], tva: [tvaBrute(0, 56250, 0)],
    devis: { total_tva_centimes: 0, total_ttc_centimes: 56250, total_ttc_options_centimes: 56250 },
  }),
  cas('franchise avec une ligne taxée (D13)', {
    emetteur: { ...EM, regime_tva: 'franchise' },
    attendu: { refus: 'Vous êtes déclaré en franchise de TVA, mais des lignes portent un taux de TVA : en franchise, '
      + 'vous n’en facturez pas. Corrigez ces lignes, ou votre régime dans « Mon entreprise ».' },
  }),
  cas('non déclaré, titres et réserves seulement', {
    emetteur: { ...EM, regime_tva: null }, lignes: [PIECE, RESERVE], tva: [],
    devis: { total_ht_centimes: 0, total_tva_centimes: 0, total_ttc_centimes: 0, total_ttc_options_centimes: 0 },
  }),
  cas('non déclaré avec une ligne chiffrée (D13)', {
    emetteur: { ...EM, regime_tva: null }, lignes: [{ taux_tva_centiemes: null }],
    attendu: { refus: 'Votre régime de TVA n’est pas déclaré : ce devis porte des lignes chiffrées, mais Opus ne '
      + 'sait pas s’il faut y ajouter la TVA. Déclarez-le dans « Mon entreprise ».' },
  }),
  cas('aucune fiche « Mon entreprise », aucune ligne', {
    emetteur: null, lignes: [], tva: [],
    devis: { total_ht_centimes: 0, total_tva_centimes: 0, total_ttc_centimes: 0, total_ttc_options_centimes: 0 },
  }),
  cas('réel, une ligne à 0 (pas un refus, C-m1)', {
    lignes: [{}, sansTaux({ designation: 'Évacuation' })], tva: [tvaBrute(1000, 56250, 5625), tvaBrute(0, 56250, 0)],
  }),
  cas('à titre privé', { devis: { pour_qui: 'consommateur' }, attendu: { valable: 'consommateur' } }),
  cas('association, copropriété, société civile', { devis: { pour_qui: 'non_professionnel' }, attendu: { valable: 'non_professionnel' } }),
  cas('petite entreprise hors de son activité', {
    devis: { pour_qui: 'professionnel_hors_activite' }, attendu: { valable: 'professionnel_hors_activite' },
  }),
  cas('pour son entreprise', { devis: { pour_qui: 'professionnel' }, attendu: { valable: 'professionnel' } }),
  cas('« à quel titre » vide', { devis: { pour_qui: null, pour_qui_client: null }, attendu: { valable: null } }),
  cas('réponse donnée pour un AUTRE client', { devis: { pour_qui_client: 'cli-autre' }, attendu: { valable: null } }),
  cas('client absent', { devis: { client_id: null, pour_qui: null, pour_qui_client: null }, client: null, attendu: { valable: null } }),
  cas('client au devis, fiche introuvable', { client: null, attendu: { valable: 'consommateur' } }),
  cas('client entreprise, avec son SIRET', {
    devis: { client_id: 'cli-2', pour_qui: 'professionnel', pour_qui_client: 'cli-2' }, client: CLIENT_ENT_BRUT,
    attendu: { valable: 'professionnel' },
  }),
  cas('une assurance échue (D8)', { assurances: [DECENNALE_VALABLE, RC_ECHUE] }),
  cas('une assurance sans date', { assurances: [{ ...DECENNALE_VALABLE, valide_jusquau: null }] }),
  cas('une assurance qui finit le jour même', { assurances: [{ ...DECENNALE_VALABLE, valide_jusquau: '2026-11-26' }] }),
  cas('n° de TVA déclaré sur l’honneur', {
    entreprise: { ...ENT, tva: null },
    preuveTva: { ...PREUVE, source: 'declaration', declare_le: '2026-11-09T10:00:00.123456+00:00', declaration_texte: 'texte' },
  }),
  cas('preuve de TVA d’essai', { entreprise: { ...ENT, tva: null }, preuveTva: { ...PREUVE, source: 'essai' } }),
  cas('preuve de TVA pour un autre SIREN', {
    entreprise: { ...ENT, tva: null }, preuveTva: { ...PREUVE, siren: '000048009', numero: 'FR91000048009' },
  }),
  cas('déplacement offert', { tarifs: { ...TARIFS_35, frais_deplacement_centimes: 0, frais_deplacement_texte: null } }),
  cas('déplacement en texte seul', { tarifs: { ...TARIFS_35, frais_deplacement_centimes: null, frais_deplacement_texte: 'selon la distance' } }),
  cas('aucun tarif', { tarifs: null }),
  cas('franchise, déplacement à 35 €', {
    emetteur: { ...EM, regime_tva: 'franchise' }, lignes: [sansTaux({})], tva: [tvaBrute(0, 56250, 0)],
    devis: { total_tva_centimes: 0, total_ttc_centimes: 56250, total_ttc_options_centimes: 56250, cout_devis_centimes: 3000 },
  }),
  cas('devis vide', {
    devis: { objet: null, lieu_adresse: null, lieu_code_postal: null, lieu_ville: null, delai_execution: null, validite_jours: null,
      cout_devis_centimes: null, client_id: null, pour_qui: null, pour_qui_client: null, total_ht_centimes: 0,
      total_tva_centimes: 0, total_ttc_centimes: 0, total_ttc_options_centimes: 0 },
    lignes: [], tva: [], client: null,
  }),
  cas('mode exemple', { mode: 'exemple' }),
  cas('éditeur en société (plus d’essai)', { statut: 'societe' }),
  cas('aucune entreprise rattachée', { entreprise: null }),
  cas('23 h 30 à Paris le 26/11 : déjà le 27', { maintenant: Date.UTC(2026, 10, 26, 23, 30) }),
  cas('payant, réduction, acompte, arrhes, retenue, options', {
    lignes: [ZONE, PIECE, {}, { designation: 'Dépose', unite: 'forfait', quantite_milliemes: 1000, prix_unitaire_centimes: 15000,
      taux_tva_centiemes: 2000, total_centimes: 0, offert: true },
    { type: 'option', designation: 'Faïence murale', quantite_milliemes: 3000, unite: 'jour', prix_unitaire_centimes: 15000,
      taux_tva_centiemes: 1000, total_centimes: 45000 }, RESERVE],
    tva: [tvaBrute(2000, 0, 0), tvaBrute(1000, 53437, 5344, 1, 2813)],
    devis: { remise_centiemes: 500, remise_ht_centimes: 2813, total_ht_centimes: 53437, total_tva_centimes: 5344,
      total_ttc_centimes: 58781, acompte_centiemes: 3000, acompte_nature: 'arrhes', acompte_ttc_centimes: 17634,
      retenue_garantie_centiemes: 500, total_ttc_options_centimes: 108281, cout_devis_centimes: 3000 },
  }),
  cas('une réparation urgente, client pour son entreprise', {
    lignes: [{ urgence: true }], devis: { pour_qui: 'professionnel' }, attendu: { valable: 'professionnel' },
  }),
  cas('une réparation urgente, client à titre privé', { lignes: [{ urgence: true }] }),
  cas('acompte sans nature', { devis: { acompte_centimes: 10000, acompte_ttc_centimes: 10000 } }),
  cas('des entrées qui disent « artisan »', {
    entreprise: { ...ENT, denomination: 'ARTISANS DU BATI', nom_commercial: 'L’Artisan du carrelage', forme_juridique: '5453' },
    lignes: [{ designation: 'Pose artisanale de tomettes' }],
    devis: { objet: 'Travaux d’artisan', delai_execution: 'Selon l’artisan, avant le 12/12/2026' },
    emetteur: { ...EM, modalites_execution_texte: 'Main d’œuvre artisanale, paiement à la signature.' },
  }),
  cas('les totaux de la base diffèrent du miroir d’un centime (B.2)', {
    lignes: [PIECE, {}, { designation: 'Joints', quantite_milliemes: 1000, unite: 'forfait', prix_unitaire_centimes: 2001,
      taux_tva_centiemes: 1000, total_centimes: 2001 }],
    tva: [tvaBrute(1000, 58252, 5826, 2)],
    devis: { total_ht_centimes: 58252, total_tva_centimes: 5826, total_ttc_centimes: 64078, total_ttc_options_centimes: 64078 },
  }),
  cas('chaque unité (B.10)', {
    lignes: [
      { designation: 'Sol', unite: 'm2', quantite_milliemes: 1000, total_centimes: 4500 },
      { designation: 'Plinthes', unite: 'm', quantite_milliemes: 1000, prix_unitaire_centimes: 1000, total_centimes: 1000 },
      { designation: 'Plinthes bis', unite: 'm', quantite_milliemes: 2500, prix_unitaire_centimes: 1000, total_centimes: 2500 },
      { designation: 'Béton', unite: 'm3', quantite_milliemes: 2000, prix_unitaire_centimes: 1000, total_centimes: 2000 },
      { designation: 'Robinet', unite: 'u', quantite_milliemes: 3000, prix_unitaire_centimes: 1000, total_centimes: 3000 },
      { designation: 'Main d’œuvre', unite: 'h', quantite_milliemes: 1500, prix_unitaire_centimes: 1000, total_centimes: 1500 },
      { designation: 'Location', unite: 'jour', quantite_milliemes: 1000, prix_unitaire_centimes: 1000, total_centimes: 1000 },
      { designation: 'Location bis', unite: 'jour', quantite_milliemes: 2000, prix_unitaire_centimes: 1000, total_centimes: 2000 },
      { designation: 'Nettoyage', unite: 'forfait', quantite_milliemes: 1000, prix_unitaire_centimes: 1000, total_centimes: 1000 },
      { designation: 'Nettoyages', unite: 'forfait', quantite_milliemes: 2000, prix_unitaire_centimes: 1000, total_centimes: 2000 },
    ],
    tva: [tvaBrute(1000, 20500, 2050, 10)],
    devis: { total_ht_centimes: 20500, total_tva_centimes: 2050, total_ttc_centimes: 22550, total_ttc_options_centimes: 22550 },
  }),
  cas('fourniture non comprise', { lignes: [{ fourniture_non_comprise: true }] }),
  /* LES PLACES DE 2c-2 QUE LA RELECTURE « CONTENU » DU 27/11 A TROUVÉES
     ABSENTES : les déchets, le label RGE, l'attestation décennale — et la
     place de l'acompte, qui disparaissait avec les modalités de paiement. */
  cas('déchets « Non », décennale « Non », énergie « Aucun de ces travaux »', {
    devis: { dechets_concerne: false, engage_decennale: false, energie_travaux: ['aucun'] },
  }),
  cas('déchets « Oui », décennale « Oui », des travaux d’énergie, à titre privé', {
    devis: { dechets_concerne: true, engage_decennale: true, energie_travaux: ['isolation_combles', 'ventilation'] },
  }),
  cas('des travaux d’énergie, association', { devis: { pour_qui: 'non_professionnel', energie_travaux: ['ventilation'] } }),
  cas('des travaux d’énergie, « à quel titre » vide', {
    devis: { pour_qui: null, pour_qui_client: null, energie_travaux: ['ventilation'] },
  }),
  cas('des travaux d’énergie, petite entreprise hors de son activité', {
    devis: { pour_qui: 'professionnel_hors_activite', energie_travaux: ['ventilation'] },
  }),
  cas('des travaux d’énergie, pour son entreprise', { devis: { pour_qui: 'professionnel', energie_travaux: ['ventilation'] } }),
  cas('aucune assurance déclarée', { assurances: [] }),
  cas('arrhes, client pour son entreprise, sans modalités de paiement', {
    devis: { pour_qui: 'professionnel', acompte_centiemes: 3000, acompte_nature: 'arrhes', acompte_ttc_centimes: 18563 },
    emetteur: { ...EM, modalites_paiement_texte: null },
  }),
];

/* LE RÉSULTAT D'UN CAS : l'instantané (ou ce qui a été levé), et le
   document quand il y a un aperçu. */
function resultat(c) {
  let r;
  try {
    r = instantaneDuDevis(c.entrees);
  } catch (e) {
    return { leve: String(e && e.message) };
  }
  if (!r.ok) return { refus: r };
  let document = null;
  try {
    document = documentDuDevis(r.instantane);
  } catch (e) {
    return { instantane: r.instantane, documentLeve: String(e && e.message) };
  }
  return { instantane: r.instantane, document };
}

/* Les entrées de `jourAParis` sur les bords (A.6) — et ce qu'il doit rendre,
   écrit ici. Le changement d'heure d'été : dernier dimanche de mars à
   01:00 UTC ; d'hiver : dernier dimanche d'octobre à 01:00 UTC. */
const BORDS_DE_JOUR = [
  ['2026-11-26T22:59:59.999Z', '2026-11-26'], ['2026-11-26T23:00:00Z', '2026-11-27'],
  ['2026-07-14T21:59:59Z', '2026-07-14'], ['2026-07-14T22:00:00Z', '2026-07-15'],
  ['2026-03-28T22:59:59Z', '2026-03-28'], ['2026-03-28T23:00:00Z', '2026-03-29'],
  ['2026-03-29T00:59:59Z', '2026-03-29'], ['2026-03-29T01:00:00Z', '2026-03-29'],
  ['2026-03-29T21:59:59Z', '2026-03-29'], ['2026-03-29T22:00:00Z', '2026-03-30'],
  ['2026-10-24T21:59:59Z', '2026-10-24'], ['2026-10-24T22:00:00Z', '2026-10-25'],
  ['2026-10-25T00:59:59Z', '2026-10-25'], ['2026-10-25T01:00:00Z', '2026-10-25'],
  ['2026-10-25T22:59:59Z', '2026-10-25'], ['2026-10-25T23:00:00Z', '2026-10-26'],
  ['2026-12-31T23:00:00Z', '2027-01-01'], ['2026-11-26T23:30:00+02:00', '2026-11-26'],
  ['2026-11-09T10:00:00.123456+00:00', '2026-11-09'], ['2026-09-02', '2026-09-02'],
  ['2026-02-31', null], ['2026-09-02T10:00:00', null], ['n’importe quoi', null],
  [Date.UTC(2026, 10, 26, 23, 0), '2026-11-27'], [new Date(Date.UTC(2026, 5, 1, 21, 59)), '2026-06-01'],
];

/* CE QUE LE SOUS-PROCESSUS REND (A.6) : tous les cas A, et les bords de
   jour. Le même calcul est fait ici, dans le processus du contrôle. */
const deterministe = () => ({
  cas: CAS_A.map((c) => {
    const r = resultat(c);
    return { nom: c.nom, ...r, html: r.document ? devisHtml(r.document, POLICES_ESSAI) : null };
  }),
  jours: BORDS_DE_JOUR.map(([e]) => jourAParis(e)),
});

/* Le sous-processus écrit dans un FICHIER (`--sortie <chemin>`) : écrite sur
   la sortie standard, une grande réponse est coupée par `process.exit`
   avant d'être lue (mesuré : le parent recevait une sortie vide). */
if (SOUS_PROCESSUS) {
  writeFileSync(process.argv[process.argv.indexOf('--sortie') + 1], JSON.stringify({
    resultat: trier(deterministe()),
    /* Ce que le sous-processus a VU : sans cela, un fuseau ou une horloge
       ignorés passeraient pour un déterminisme prouvé. */
    vu: { maintenant: Date.now(), decalage: new Date(Date.UTC(2026, 10, 26, 12)).getTimezoneOffset() },
  }));
  process.exit(0);
}

/* `--montrer <numéro>` : le document d'un cas A, pour le relire à l'œil. */
if (process.argv.includes('--montrer')) {
  const n = Number(process.argv[process.argv.indexOf('--montrer') + 1]);
  const c = CAS_A[n];
  console.log(c ? `${c.nom}\n${JSON.stringify(resultat(c), null, 1)}` : `Aucun cas ${n} (0 à ${CAS_A.length - 1}).`);
  process.exit(0);
}

/* ================================================================== */
/*  A. L'INSTANTANÉ                                                     */
/* ================================================================== */

const RESULTATS_A = CAS_A.map((c) => ({ c, r: resultat(c) }));
const FICHIER = JSON.parse(lire('supabase/champs-instantane.json'));
const CHEMINS_DU_FICHIER = (FICHIER.champs || []).map((x) => x.chemin);

section('A.0 Les cas eux-mêmes');
{
  const leves = RESULTATS_A.filter(({ r }) => r.leve || r.documentLeve).map(({ c, r }) => `${c.nom} : ${r.leve || r.documentLeve}`);
  verifier(`A.0 les ${CAS_A.length} cas se composent sans lever (sauf les refus attendus)`, leves.length === 0, leves.join(' | '));
  verifier('A.0 une trentaine de cas au moins (§8.1)', CAS_A.length >= 30, String(CAS_A.length));
}

section('A.1 Les clés de l’instantané = supabase/champs-instantane.json, dans les deux sens');
{
  const vus = new Set();
  const horsListe = [];
  /* Une table vide (`null`) ne produit que son propre chemin : il est permis
     seulement si le fichier a des champs SOUS lui. */
  const estUneTable = (p) => CHEMINS_DU_FICHIER.some((f) => f.startsWith(`${p}.`) || f.startsWith(`${p}[].`));
  for (const { c, r } of RESULTATS_A) {
    if (!r.instantane) continue;
    for (const p of cheminsDeLInstantane(r.instantane)) {
      if (CHEMINS_DU_FICHIER.includes(p)) vus.add(p);
      else if (!estUneTable(p)) horsListe.push(`${c.nom} : ${p}`);
    }
  }
  verifier('A.1 aucune clé produite hors de la liste fermée', horsListe.length === 0, horsListe.slice(0, 12).join(' | '));
  const jamaisVus = CHEMINS_DU_FICHIER.filter((p) => !vus.has(p));
  verifier('A.1 chaque champ de la liste est produit par au moins un cas', jamaisVus.length === 0, jamaisVus.join(', '));
  const doublons = CHEMINS_DU_FICHIER.filter((p, i) => CHEMINS_DU_FICHIER.indexOf(p) !== i);
  verifier('A.1 chaque champ une seule fois dans la liste', doublons.length === 0, doublons.join(', '));
  const champsIncomplets = (FICHIER.champs || []).filter((x) => !x.chemin || !x.type || !x.source || !x.imprime
    || !['en_place', 'copie', 'pose', 'aucun'].includes(x.en2c3));
  verifier('A.1 chaque champ dit son type, sa source, ce qu’il imprime et ce qu’en fera 2c-3', champsIncomplets.length === 0,
    champsIncomplets.map((x) => x.chemin).join(', '));
  /* Les colonnes de la fonction sont celles du fichier, table par table. */
  const duFichier = (table) => CHEMINS_DU_FICHIER.filter((p) => p.startsWith(`${table}.`) && !p.slice(table.length + 1).includes('.')
    && !p.includes('[]')).map((p) => p.slice(table.length + 1));
  const ecarts = ['entreprise', 'emetteur', 'tarifs', 'preuve_tva', 'client'].filter((t) => !egal(duFichier(t), COLONNES_DE_L_INSTANTANE[t]));
  const devisDuFichier = duFichier('devis').filter((c) => c !== 'pour_qui_valable');
  if (!egal(devisDuFichier, COLONNES_DE_L_INSTANTANE.devis)) ecarts.push('devis');
  const sousListe = (prefixe) => CHEMINS_DU_FICHIER.filter((p) => p.startsWith(prefixe)).map((p) => p.slice(prefixe.length));
  if (!egal(sousListe('lignes[].'), COLONNES_DE_L_INSTANTANE.lignes)) ecarts.push('lignes');
  if (!egal(sousListe('assurances[].'), COLONNES_DE_L_INSTANTANE.assurances)) ecarts.push('assurances');
  if (!egal(sousListe('devis.ventilation[].'), COLONNES_DE_L_INSTANTANE.ventilation)) ecarts.push('ventilation');
  verifier('A.1 les colonnes d’instantane-devis.js = celles du fichier, table par table et dans l’ordre', ecarts.length === 0, ecarts.join(', '));
}

section('A.2 Le téléphone, l’e-mail et les notes du client n’entrent jamais');
{
  const fautes = [];
  const temoins = [CLIENT_BRUT.telephone, CLIENT_BRUT.email, CLIENT_BRUT.notes, 'NOTE-TÉMOIN'];
  for (const { c, r } of RESULTATS_A) {
    if (!r.instantane) continue;
    const cl = r.instantane.client;
    if (cl && ['telephone', 'email', 'notes', 'archive', 'pro_id', 'proId', 'id', 'created_at', 'creeLe', 'modifie_le', 'modifieLe']
      .some((k) => Object.prototype.hasOwnProperty.call(cl, k))) fautes.push(`${c.nom} : une clé interdite dans client`);
    const tout = JSON.stringify(r);
    temoins.forEach((t) => { if (tout.includes(t)) fautes.push(`${c.nom} : « ${t} » se retrouve dans la sortie`); });
  }
  const fichePleine = clientDepuisBase(CLIENT_BRUT);
  verifier('A.2 la fiche passée PORTE bien les trois champs (sinon le contrôle ne prouve rien)',
    fichePleine.telephone && fichePleine.email && fichePleine.notes, JSON.stringify(fichePleine));
  verifier('A.2 ni dans l’instantané, ni dans le document, sur tous les cas', fautes.length === 0, fautes.slice(0, 8).join(' | '));
}

section('A.3 La réponse « à quel titre » valable, en littéraux');
{
  const fautes = [];
  let jugés = 0;
  for (const { c, r } of RESULTATS_A) {
    if (!Object.prototype.hasOwnProperty.call(c.attendu, 'valable')) continue;
    jugés += 1;
    const vu = r.instantane ? r.instantane.devis.pour_qui_valable : '(pas d’instantané)';
    if (vu !== c.attendu.valable) fautes.push(`${c.nom} : ${JSON.stringify(vu)} au lieu de ${JSON.stringify(c.attendu.valable)}`);
  }
  verifier(`A.3 ${jugés} cas : les quatre réponses, le vide, la réponse pour un AUTRE client, le client absent`,
    fautes.length === 0 && jugés >= 10, fautes.join(' | ') || String(jugés));
}

section('A.4 Les refus et ce qui lève');
{
  const fautes = [];
  for (const { c, r } of RESULTATS_A) {
    if (c.attendu.refus) {
      if (!r.refus || r.refus.raison !== 'regime_contradictoire' || r.refus.phrase !== c.attendu.refus) {
        fautes.push(`${c.nom} : ${JSON.stringify(r.refus || 'pas de refus')}`);
      }
    } else if (r.refus) fautes.push(`${c.nom} : refus inattendu ${JSON.stringify(r.refus)}`);
  }
  verifier('A.4 les deux cas de D13 refusent, avec la phrase écrite ici en toutes lettres ; aucun autre ne refuse', fautes.length === 0,
    fautes.join(' | '));
  const zero = RESULTATS_A.find(({ c }) => c.nom.startsWith('réel, une ligne à 0'));
  verifier('A.4 au régime réel, une ligne à 0 N’EST PAS un refus (C-m1)', !!(zero && zero.r.document), JSON.stringify(zero && zero.r.refus));
  const base = CAS_A[0].entrees;
  const absent = [instantaneDuDevis({ ...base, devisLu: null }), instantaneDuDevis({ ...base, devisLu: { devis: null, lignes: [] } })];
  verifier('A.4 un devis absent → { ok: false, raison: « devis_absent » }',
    absent.every((x) => egal(x, { ok: false, raison: 'devis_absent' })), JSON.stringify(absent));
  const leve = (nom, entrees) => {
    try { instantaneDuDevis(entrees); return `${nom} : n’a pas levé`; } catch (e) { return null; }
  };
  const sansCle = (cle) => { const x = { ...base }; delete x[cle]; return x; };
  const nonLeves = [
    leve('mode « remis »', { ...base, mode: 'remis' }),
    leve('mode absent', sansCle('mode')),
    leve('mode undefined', { ...base, mode: undefined }),
    leve('maintenant absent', sansCle('maintenant')),
    leve('maintenant null', { ...base, maintenant: null }),
    leve('maintenant en chaîne', { ...base, maintenant: '2026-11-26T10:00:00Z' }),
    leve('maintenant illisible', { ...base, maintenant: new Date('pas une date') }),
    leve('statut inconnu', { ...base, statut: 'essais' }),
    leve('client oublié', sansCle('client')),
    leve('entreprise oubliée', sansCle('entreprise')),
    leve('fiche d’un autre client', { ...base, client: clientDepuisBase({ ...CLIENT_BRUT, id: 'cli-autre' }) }),
  ].filter(Boolean);
  verifier('A.4 lèvent : un mode hors liste ou absent, un « maintenant » absent ou illisible, un statut inconnu, une clé oubliée, '
    + 'la fiche d’un autre client', nonLeves.length === 0, nonLeves.join(' | '));
  verifier('A.4 les listes fermées des modes et des statuts', egal(MODES, ['apercu', 'exemple'])
    && egal(STATUTS_EDITEUR, ['essai', 'particulier', 'micro', 'societe']), JSON.stringify([MODES, STATUTS_EDITEUR]));
  const casse = instantaneDuDevis({ ...base, client: clientDepuisBase({ ...CLIENT_BRUT, id: 'CLI-1' }) });
  verifier('A.4 la fiche se reconnaît sans la casse (deux uuid)', casse.ok === true, JSON.stringify(casse).slice(0, 200));
}

section('A.5 La parité avec la base (K10) : lignes brutes → conversions de l’application → instantané');
{
  /* Les colonnes, LUES DANS LE FICHIER : c'est la liste qui fait foi. */
  const cols = (prefixe) => CHEMINS_DU_FICHIER.filter((p) => p.startsWith(prefixe) && !p.slice(prefixe.length).includes('.')
    && !p.slice(prefixe.length).includes('[]')).map((p) => p.slice(prefixe.length));
  const projeter = (ligne, colonnes) => Object.fromEntries(colonnes.map((k) => [k, ligne && ligne[k] !== undefined ? ligne[k] : null]));
  const parOrdre = (a, b) => (a.ordre - b.ordre) || (a.id < b.id ? -1 : 1);
  const fautes = [];
  for (const { c, r } of RESULTATS_A) {
    if (!r.instantane || c.entrees.devisLu === null) continue;
    const i = r.instantane;
    const b = c.brut;
    const devisCols = cols('devis.').filter((k) => k !== 'pour_qui_valable');
    const { ventilation, pour_qui_valable: _v, ...devisVu } = i.devis;
    if (!egal(devisVu, projeter(b.devis, devisCols))) fautes.push(`${c.nom} : devis`);
    const tva = b.tva.filter((t) => t.nb_lignes > 0).sort((x, y) => y.taux_tva_centiemes - x.taux_tva_centiemes);
    if (!egal(ventilation, tva.map((t) => projeter(t, cols('devis.ventilation[].'))))) fautes.push(`${c.nom} : ventilation`);
    if (!egal(i.lignes, [...b.lignes].sort(parOrdre).map((l) => projeter(l, cols('lignes[].'))))) fautes.push(`${c.nom} : lignes`);
    const clientAttendu = b.client && b.devis.client_id ? projeter(b.client, cols('client.')) : null;
    if (!egal(i.client, clientAttendu)) fautes.push(`${c.nom} : client`);
    const e = c.entrees;
    const ent = e.entreprise ? { ...projeter(e.entreprise, cols('entreprise.')), maj_insee: jourAParis(e.entreprise.maj_insee),
      verifie_le: jourAParis(e.entreprise.verifie_le) } : null;
    if (!egal(i.entreprise, ent)) fautes.push(`${c.nom} : entreprise`);
    if (!egal(i.emetteur, e.emetteur ? projeter(e.emetteur, cols('emetteur.')) : null)) fautes.push(`${c.nom} : emetteur`);
    if (!egal(i.tarifs, e.tarifs ? projeter(e.tarifs, cols('tarifs.')) : null)) fautes.push(`${c.nom} : tarifs`);
    if (!egal(i.preuve_tva, e.preuveTva ? projeter(e.preuveTva, cols('preuve_tva.')) : null)) fautes.push(`${c.nom} : preuve_tva`);
    const ass = assurancesDansLOrdre(e.assurances || []).map((a) => projeter(a, cols('assurances[].')));
    if (!egal(i.assurances, ass)) fautes.push(`${c.nom} : assurances`);
  }
  verifier('A.5 chaque cas : l’instantané = les lignes brutes projetées sur le fichier', fautes.length === 0, fautes.slice(0, 10).join(' | '));
  /* Les jours de l'entreprise, en littéraux : la fiche mise à jour le
     02/09 (une date) et consultée le 29/09 À PARIS (22 h 30 à Greenwich le
     28). */
  const std = RESULTATS_A[0].r.instantane;
  verifier('A.5 les jours de l’entreprise, à Paris : « 2026-09-02 » et « 2026-09-29 »',
    std.entreprise.maj_insee === '2026-09-02' && std.entreprise.verifie_le === '2026-09-29',
    JSON.stringify([std.entreprise.maj_insee, std.entreprise.verifie_le]));
  /* Les conversions de l'application, sur une ligne brute, en littéraux :
     elles ont déménagé d'`api.js` sans changer. */
  const brut = { id: 'l', devis_id: 'd', ordre: '1000', type: null, designation: undefined, quantite_milliemes: '12500', unite: 'm2',
    prix_unitaire_centimes: 4500, taux_tva_centiemes: null, total_centimes: 56250, offert: 'true', main_oeuvre: true,
    fourniture_non_comprise: false, surface_sol_milliemes: null, surface_murs_milliemes: 3000, urgence: true, generation: 7,
    modifie_le: 'm', devis: { id: 'd', objet: 'O', source: 's', modifie_le: 'm2' } };
  verifier('A.5 ligneDepuisBase, en littéraux', egal(ligneDepuisBase(brut), {
    id: 'l', devisId: 'd', ordre: 1000, type: 'poste', designation: null, quantiteMilliemes: 12500, unite: 'm2',
    prixUnitaireCentimes: 4500, tauxTvaCentiemes: null, totalCentimes: 56250, offert: false, mainOeuvre: true,
    fournitureNonComprise: false, surfaceSolMilliemes: null, surfaceMursMilliemes: 3000, urgence: true, generation: 7, modifieLe: 'm',
    devis: { id: 'd', objet: 'O', source: 's', modifieLe: 'm2' },
  }) && ligneDepuisBase(null) === null, JSON.stringify(ligneDepuisBase(brut)));
  verifier('A.5 clientDepuisBase, en littéraux', egal(clientDepuisBase({ id: 'c', pro_id: 'p', type: '', nom: 'N', siret: '',
    telephone: 't', email: '', adresse: 'a', code_postal: null, ville: 'v', notes: '', archive: 1, created_at: 'x' }), {
    id: 'c', proId: 'p', type: 'particulier', nom: 'N', siret: null, telephone: 't', email: null, adresse: 'a', codePostal: null,
    ville: 'v', notes: null, archive: true, creeLe: 'x', modifieLe: null,
  }), '');
  /* `api.js` compose `unDevis` et la fiche du carnet par CES conversions
     (lu) — sinon la parité jouée ici ne dirait rien de l'application. */
  const api = sansCommentaires(lire('src/lib/api.js'));
  const corpsUnDevis = (/async function unDevisSupabase\([\s\S]*?\n\}/.exec(api) || [''])[0];
  verifier('A.5 (lu) api.unDevis = { devis: rowToDevis(devis), lignes: ….map(ligneDepuisBase), ventilation: totauxDepuisBase(data).ventilation }',
    /devis: rowToDevis\(devis\),/.test(corpsUnDevis) && /lignes: \(lignes \|\| \[\]\)\.map\(ligneDepuisBase\),/.test(corpsUnDevis)
      && /ventilation: totauxDepuisBase\(data\)\.ventilation,/.test(corpsUnDevis), corpsUnDevis.slice(0, 300));
  verifier('A.5 (lu) api.js importe ligneDepuisBase de devis.js et clientDepuisBase de clients.js, et ne les redéfinit plus',
    /import\s*\{[^}]*\bligneDepuisBase\b[^}]*\}\s*from\s*'\.\/devis'/.test(api) && /import\s*\{\s*clientDepuisBase\s*\}\s*from\s*'\.\/clients'/.test(api)
      && !/function rowToLigne\b/.test(api) && !/function rowToClient\b/.test(api) && !/\browToClient\(/.test(api) && !/\browToLigne\b/.test(api));
  verifier('A.5 (lu) la saisie pose les totaux par totauxDuDevisLu', /poserTotaux\(totauxDuDevisLu\(r\)\);/
    .test(sansCommentaires(lire('src/screens/SaisieDevisScreen.js'))));
  verifier('A.5 totauxDuDevisLu, en littéraux', egal(totauxDuDevisLu({
    devis: { totalHtCentimes: 100, totalTvaCentimes: 20, totalTtcCentimes: 120, remiseHtCentimes: 5, acompteTtcCentimes: 30,
      totalTtcOptionsCentimes: null, remiseCentimes: 5, acompteNature: 'arrhes' },
    ventilation: [{ taux: 2000 }],
  }), {
    ht: 100, tva: 20, ttc: 120, reduction: 5, brut: 105, acompte: 30, ttcOptions: 120,
    demande: totauxDuDevisLu({ devis: { remiseCentimes: 5, acompteNature: 'arrhes' } }).demande, ventilation: [{ taux: 2000 }],
  }) && totauxDuDevisLu({ devis: { remiseCentimes: 5, acompteNature: 'arrhes' } }).demande.remiseCentimes === 5
    && totauxDuDevisLu({ devis: { remiseCentimes: 5, acompteNature: 'arrhes' } }).demande.acompteNature === 'arrhes'
    && egal(totauxDuDevisLu(null).ventilation, []), JSON.stringify(totauxDuDevisLu({ devis: {} })));
}

section('A.6 Le déterminisme (K7) : trois fuseaux, deux horloges fausses');
{
  const ici = canon(deterministe());
  /* Une horloge fausse : le `Date` global remplacé AVANT que le contrôle ne
     charge un seul fichier (`--import`), pour que même une horloge lue au
     chargement d'un module soit fausse. */
  const horloge = (t) => `data:text/javascript,${encodeURIComponent(
    `const V=Date;const T=${t};class F extends V{constructor(...a){if(a.length===0)super(T);else super(...a);}`
    + 'static now(){return T;}}globalThis.Date=F;',
  )}`;
  const RUNS = [
    { nom: 'TZ=Europe/Paris', tz: 'Europe/Paris', decalage: -60 },
    { nom: 'TZ=America/Martinique', tz: 'America/Martinique', decalage: 240 },
    { nom: 'TZ=Pacific/Kiritimati', tz: 'Pacific/Kiritimati', decalage: -840 },
    { nom: 'horloge fausse 2031-01-01 (TZ=Pacific/Kiritimati)', tz: 'Pacific/Kiritimati', decalage: -840, t: Date.UTC(2031, 0, 1) },
    { nom: 'horloge fausse 1999-12-31 23:59 (TZ=America/Martinique)', tz: 'America/Martinique', decalage: 240,
      t: Date.UTC(1999, 11, 31, 23, 59) },
  ];
  const dossier = mkdtempSync(path.join(tmpdir(), 'verifier-apercu-'));
  for (const [rang, run] of RUNS.entries()) {
    const fichier = path.join(dossier, `${rang}.json`);
    const args = [...(run.t != null ? ['--import', horloge(run.t)] : []), ICI, '--sous-processus', '--sortie', fichier];
    const p = spawnSync(process.execPath, args, { env: { ...process.env, TZ: run.tz }, encoding: 'utf8' });
    let sortie = null;
    try { sortie = JSON.parse(lire(fichier)); } catch { sortie = null; }
    const vu = sortie && sortie.vu;
    const horlogeVue = run.t == null || (vu && vu.maintenant === run.t);
    verifier(`A.6 ${run.nom} : le sous-processus a VU ce fuseau${run.t != null ? ' et cette horloge' : ''}`,
      p.status === 0 && vu && vu.decalage === run.decalage && horlogeVue, `${p.status} ${JSON.stringify(vu)} ${(p.stderr || '').slice(0, 300)}`);
    verifier(`A.6 ${run.nom} : instantanés, documents, pages HTML et jours IDENTIQUES`, !!sortie && canon(sortie.resultat) === ici,
      sortie ? 'une différence' : (p.stderr || '').slice(0, 300));
  }
  rmSync(dossier, { recursive: true, force: true });
  const jours = BORDS_DE_JOUR.map(([e, attendu]) => ({ e: String(e), vu: jourAParis(e), attendu })).filter((x) => x.vu !== x.attendu);
  verifier(`A.6 jourAParis sur ${BORDS_DE_JOUR.length} bords : minuit, les deux changements d’heure, les dates seules, l’illisible`,
    jours.length === 0, JSON.stringify(jours));
  verifier('A.6 les versions portées par l’instantané = VERSION_COMPOSITION et VERSION_GABARIT ; la forme, VERSION_INSTANTANE = 1',
    VERSIONS_DU_RENDU.composition === VERSION_COMPOSITION && VERSIONS_DU_RENDU.gabarit === VERSION_GABARIT && VERSION_INSTANTANE === 1
      && RESULTATS_A[0].r.instantane.versions.composition === VERSION_COMPOSITION
      && RESULTATS_A[0].r.instantane.versions.gabarit === VERSION_GABARIT,
    JSON.stringify([VERSIONS_DU_RENDU, VERSION_GABARIT]));
  /* Les fichiers de la chaîne ne lisent aucune horloge, aucune langue. */
  const FICHIERS_PURS = ['src/lib/instantane-devis.js', 'src/lib/document-devis.js'];
  const interdits = [/\bIntl\b/, /\bDate\.now\b/, /new Date\(\s*\)/, /\blocaleCompare\b/, /\btoLocale\w*\(/, /\bMath\.round\b/,
    /\.toFixed\(/, /\bparseFloat\b/, /\bprocess\./, /\bDate\.parse\b/];
  const trouves = [];
  FICHIERS_PURS.forEach((f) => {
    const c = sansCommentaires(lire(f));
    interdits.forEach((re) => { if (re.test(c)) trouves.push(`${f} : ${re}`); });
  });
  const formats = sansCommentaires(lire('src/lib/formats.js'));
  ['jourAParis', 'instantDe', 'dernierDimanche', 'nombreDe'].forEach((nom) => {
    const corps = (new RegExp(`function ${nom}\\([\\s\\S]*?\\n\\}`).exec(formats) || [''])[0];
    if (!corps) trouves.push(`formats.js : ${nom} introuvable`);
    interdits.forEach((re) => { if (re.test(corps)) trouves.push(`formats.js ${nom} : ${re}`); });
  });
  verifier('A.6 ni Intl, ni horloge, ni langue, ni arrondi flottant dans la chaîne (instantané, composition, jourAParis, nombreDe)',
    trouves.length === 0, trouves.join(' | '));
  /* Les imports : des listes FERMÉES (des fichiers purs, que `node` ouvre). */
  const importsDe = (f) => [...sansCommentaires(lire(f)).matchAll(/^import[\s\S]*?from\s+'([^']+)';/gm)].map((m) => m[1]).sort();
  verifier('A.6 instantane-devis.js n’importe que ./devis.js et ./formats.js',
    egal(importsDe('src/lib/instantane-devis.js'), ['./devis.js', './formats.js']), JSON.stringify(importsDe('src/lib/instantane-devis.js')));
  verifier('A.6 document-devis.js n’importe que ./centimes.js, ./devis.js, ./emetteur.js, ./formats.js',
    egal(importsDe('src/lib/document-devis.js'), ['./centimes.js', './devis.js', './emetteur.js', './formats.js']),
    JSON.stringify(importsDe('src/lib/document-devis.js')));
  verifier('A.6 formats.js et clients.js n’importent toujours rien',
    importsDe('src/lib/formats.js').length === 0 && importsDe('src/lib/clients.js').length === 0,
    JSON.stringify([importsDe('src/lib/formats.js'), importsDe('src/lib/clients.js')]));
}

/* ================================================================== */
/*  B. LA COMPOSITION                                                   */
/* ================================================================== */

const DOCS_A = RESULTATS_A.filter(({ r }) => r.document).map(({ c, r }) => ({ c, i: r.instantane, d: r.document }));
const docDe = (debut) => {
  const x = DOCS_A.find(({ c }) => c.nom.startsWith(debut));
  if (!x) throw new Error(`verifier-apercu : aucun cas « ${debut} »`);
  return x;
};
/* Ce que la PAGE montre : tout le document, sauf ce que l'écran seul lit. */
const HORS_DE_LA_PAGE = ['avisEcran', 'marqueursVus'];
const texteDeLaPage = (d) => chaines(d).filter((x) => !HORS_DE_LA_PAGE.some((k) => x.chemin === k || x.chemin.startsWith(`${k}[`)));
/* Un montant imprimé → des centimes (« 1 234,50 € » → 123450 ; « Offert » → 0). */
const centimesDe = (t) => {
  if (t === 'Offert') return 0;
  const m = /(\d[\d  ]*),(\d{2}) €/.exec(String(t || ''));
  return m ? Number(m[1].replace(/[  ]/g, '')) * 100 + Number(m[2]) : null;
};

section('B.1 La sortie : des chaînes, `version` entier, `numero.enAttente` booléen, des null');
{
  const fautes = [];
  const parcourir = (v, chemin) => {
    if (v === null || typeof v === 'string') return;
    if (Array.isArray(v)) { v.forEach((x, k) => parcourir(x, `${chemin}[${k}]`)); return; }
    if (typeof v === 'number') { if (!(chemin === 'version' && Number.isInteger(v))) fautes.push(`${chemin} : nombre`); return; }
    if (typeof v === 'boolean') { if (chemin !== 'numero.enAttente') fautes.push(`${chemin} : booléen`); return; }
    if (typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
      Object.keys(v).forEach((k) => parcourir(v[k], chemin ? `${chemin}.${k}` : k));
      return;
    }
    fautes.push(`${chemin} : ${typeof v}`);
  };
  DOCS_A.forEach(({ c, d }) => { const avant = fautes.length; parcourir(d, ''); if (fautes.length > avant) fautes.push(`(${c.nom})`); });
  verifier('B.1 aucune autre valeur, aucun objet venu de la base (K-m2)', fautes.length === 0, fautes.slice(0, 10).join(' | '));
  const cles = Object.keys(DOCS_A[0].d).sort();
  verifier('B.1 les blocs du document, en liste fermée', egal(cles, ['aVenir', 'avisEcran', 'chantier', 'client', 'conditions', 'decompte',
    'decompteAVenir', 'decompteVide', 'emetteur', 'enTete', 'informations', 'marques', 'marqueursVus', 'numero', 'numeroAffiche',
    'options', 'titre', 'titres', 'totaux', 'version']), cles.join(', '));
  const d = DOCS_A[0].d;
  verifier('B.1 en toutes lettres : le titre, le numéro en attente, la date, les titres de blocs, la validité, le coût',
    d.titre === 'DEVIS' && egal(d.numero, { libelle: 'N°', prefixe: 'DEV-2026-', enAttente: true }) && !('rang' in d.numero)
      && d.numeroAffiche === 'DEV-2026-····' && RANG_EN_ATTENTE === '····'
      && d.enTete.date === 'Date : le jour où ce devis sera remis'
      && d.enTete.validite === `Validité de l’offre : 30${NS}jours à compter de la date du devis` && d.enTete.cout === 'Devis gratuit'
      && egal(d.titres, { client: 'Client', decompte: 'Détail des travaux' }), JSON.stringify([d.numero, d.enTete]));
  verifier('B.1 les trois marques, en toutes lettres', egal(MARQUES, {
    apercu: 'APERÇU — ce document n’est pas remis', essai: 'Document d’essai — sans valeur', exemple: 'Exemple — données inventées',
  }) && egal(d.marques, { apercu: MARQUES.apercu, essai: MARQUES.essai, exemple: null })
    && docDe('éditeur en société').d.marques.essai === null && docDe('mode exemple').d.marques.exemple === MARQUES.exemple,
  JSON.stringify(d.marques));
}

section('B.2 Les totaux viennent de la BASE ; les sous-totaux, des lignes imprimées');
{
  const { d } = docDe('les totaux de la base diffèrent');
  const net = d.totaux.rangees.find((r) => r.cle === 'net');
  /* 562,50 + 20,01 = 582,51 € par les lignes ; la base dit 582,52 €. */
  verifier('B.2 « Total HT » imprime la base (582,52 €), pas la somme des lignes (582,51 €)',
    net && net.montant === `582,52${NS}€`, JSON.stringify(net));
  verifier('B.2 …et le sous-total de la pièce, la somme des totaux de ligne imprimés (582,51 € HT)',
    d.decompte[0].sousTotal === `Sous-total : 582,51${NS}€${NS}HT`, JSON.stringify(d.decompte[0]));
  /* S21 : un poste dont le total RELU par la base (562,51 €) n'est pas celui
     du miroir (12,5 m² × 45,00 € = 562,50 €). La ligne ET le sous-total de sa
     pièce impriment le RELU : un sous-total refait par `totalLigne` (le
     miroir) ne serait plus la somme des totaux imprimés juste au-dessus — et
     sur les autres cas, où relu et miroir s'accordent, rien ne le verrait
     (mesuré par le banc des sabotages de 2c-1). */
  const releve = cas('un total relu qui n’est pas celui du miroir (B.2)', {
    lignes: [PIECE, { total_centimes: 56251 }], tva: [tvaBrute(1000, 56251, 5625)],
    devis: { total_ht_centimes: 56251, total_tva_centimes: 5625, total_ttc_centimes: 61876, total_ttc_options_centimes: 61876 },
  });
  const ri = instantaneDuDevis(releve.entrees);
  const rd = ri.ok ? documentDuDevis(ri.instantane) : null;
  verifier('B.2 un poste dont le total RELU (562,51 €) n’est pas celui du miroir (12,5 × 45,00 € = 562,50 €) : sa ligne et le '
    + 'sous-total de sa pièce impriment le relu', !!rd && rd.decompte.length === 2
    && rd.decompte[0].sousTotal === `Sous-total : 562,51${NS}€${NS}HT` && rd.decompte[1].total === `562,51${NS}€${NS}HT`,
  rd ? JSON.stringify(rd.decompte) : JSON.stringify(ri).slice(0, 300));
  /* Sur tous les cas : chaque sous-total = la somme des totaux de ligne
     imprimés sous son titre (une zone compte ses pièces). */
  const fautes = [];
  DOCS_A.forEach(({ c, d: doc }) => {
    const titres = [];
    doc.decompte.forEach((b) => {
      if (b.genre === 'zone') { titres.splice(0, titres.length, { b, somme: 0, vu: false }); return; }
      if (b.genre === 'piece') {
        const zone = titres.find((t) => t.b.genre === 'zone');
        titres.splice(0, titres.length, ...(zone ? [zone] : []), { b, somme: 0, vu: false });
        return;
      }
      if (b.genre === 'ligne') titres.forEach((t) => { t.somme += centimesDe(b.total); t.vu = true; });
      titres.forEach((t) => { t.b.attendu = t.vu ? t.somme : null; });
    });
    doc.decompte.filter((b) => b.genre === 'zone' || b.genre === 'piece').forEach((b) => {
      const imprime = b.sousTotal == null ? null : centimesDe(b.sousTotal);
      if (imprime !== (b.attendu ?? null)) fautes.push(`${c.nom} : ${b.titre} ${b.sousTotal} ≠ ${b.attendu}`);
      delete b.attendu;
    });
  });
  verifier('B.2 sur tous les cas, chaque sous-total = la somme des totaux de ligne imprimés sous son titre', fautes.length === 0,
    fautes.join(' | '));
  const opt = docDe('payant, réduction').d;
  verifier('B.2 « si toutes les options sont commandées » imprime le total de la base (1 082,81 €)',
    (opt.totaux.rangees.find((r) => r.cle === 'options') || {}).montant === `1${NS}082,81${NS}€`, JSON.stringify(opt.totaux.rangees));
  verifier('B.2 sommeDesLignesLues, en littéraux : les postes seulement, et null si un total manque',
    sommeDesLignesLues([{ type: 'poste', totalCentimes: 100 }, { type: 'option', totalCentimes: 50 }, { type: 'reserve' },
      { totalCentimes: 1 }]) === 101 && sommeDesLignesLues([{ type: 'poste', totalCentimes: null }]) === null
      && sommeDesLignesLues([]) === 0, String(sommeDesLignesLues([{ type: 'poste', totalCentimes: 100 }])));
}

section('B.3 La table des places des motifs (§4.2 bis)');
{
  const PAGE = ['devis_client', 'devis_lignes', 'devis_taux_sans_tva', 'devis_lieu', 'devis_delai', 'devis_validite',
    'devis_acompte_nature', 'devis_cout', 'entreprise', 'identite', 'adresse_etablissement', 'conso_adresse_etablissement', 'nom_ei',
    'adresse_siege', 'conso_adresse_siege', 'registre', 'capital', 'conso_telephone', 'conso_email', 'regime_tva', 'conso_tva_intra',
    'conso_mediateur', 'conso_garantie_legale', 'conso_modalites_paiement', 'conso_modalites_execution', 'conso_reclamations',
    'frais_deplacement'];
  const PAS_ENCORE = ['devis_pour_qui', 'devis_taux_reduit_neuf', 'devis_acompte_ramene', 'devis_reduction_ramenee',
    'devis_acompte_signature', 'devis_decennale', 'devis_attestation_date', 'devis_attestation', 'devis_dechets',
    'devis_dechets_rubriques', 'devis_energie', 'devis_energie_mentions', 'devis_energie_mentions_prudence', 'entreprise_ancienne',
    'conso_profession_reglementee'];
  const attendu = Object.fromEntries([...PAGE.map((k) => [k, 'page']), ...PAS_ENCORE.map((k) => [k, 'pas_encore']),
    ['devis_taux_franchise', 'pas_d_apercu']]);
  verifier('B.3 PLACES_DES_MOTIFS = le tableau du §4.2 bis, écrit ici', egal(PLACES_DES_MOTIFS, attendu),
    Object.keys({ ...attendu, ...PLACES_DES_MOTIFS }).filter((k) => attendu[k] !== PLACES_DES_MOTIFS[k]).join(', '));
  const lesDeux = [...Object.keys(MOTIFS_DEVIS), ...MOTIFS.map((m) => m.cle)];
  verifier('B.3 elle couvre MOTIFS_DEVIS et MOTIFS (emetteur.js), dans les deux sens, chaque clé une fois',
    egal([...lesDeux].sort(), Object.keys(PLACES_DES_MOTIFS).sort()) && new Set(lesDeux).size === lesDeux.length,
    `${lesDeux.filter((k) => !(k in PLACES_DES_MOTIFS)).join(', ')} / ${Object.keys(PLACES_DES_MOTIFS).filter((k) => !lesDeux.includes(k)).join(', ')}`);
  verifier('B.3 compterLesPlaces, en littéraux (une clé inconnue compte « pas encore »)', egal(compterLesPlaces([
    { cle: 'devis_lieu' }, { cle: 'conso_email' }, { cle: 'devis_decennale' }, { cle: 'devis_taux_franchise' }, { cle: 'inconnue' },
    null, { cle: 'toString' },
  ]), { page: 2, pasEncore: 5 }) && egal(compterLesPlaces(null), { page: 0, pasEncore: 0 }), '');
  verifier('B.3 la carte de l’aperçu a son nom (CARTE_APERCU)', CARTE_APERCU === 'apercu', String(CARTE_APERCU));
}

/* L'entreprise et la fiche FIXÉES, complètes, pour B.4 : seules les clés du
   DEVIS sont jugées là. */
const docDuCasRemise = (k) => {
  const d = k.devis;
  const client = d.clientId ? { id: d.clientId, proId: d.proId, type: 'particulier', nom: 'Client témoin', siret: null,
    telephone: null, email: null, adresse: '1 rue du Témoin', codePostal: '13410', ville: 'Lambesc', notes: null } : null;
  return instantaneDuDevis({
    devisLu: { devis: d, lignes: k.lignes, ventilation: [] }, entreprise: ENT, emetteur: { ...EM, regime_tva: k.regime },
    assurances: [], tarifs: TARIFS_35, preuveTva: null, client, maintenant: MAINTENANT, statut: 'essai', mode: 'apercu',
  });
};

section('B.4 Marqueur ⇔ motif, sur les 237 cas de supabase/cas-remise.json (la VRAIE fonction SQL, K11)');
const DOCS_REMISE = [];
{
  const CAS = JSON.parse(lire('supabase/cas-remise.json')).cas;
  verifier('B.4 les 237 cas sont là', CAS.length === 237, String(CAS.length));
  const fautes = [];
  let apercus = 0;
  let refus = 0;
  for (const k of CAS) {
    const attendusDevis = (k.attendu || []).map((m) => m.cle).filter((c) => c in MOTIFS_DEVIS);
    let r;
    try { r = docDuCasRemise(k); } catch (e) { fautes.push(`cas ${k.n} : lève ${e.message}`); continue; }
    if (!r.ok) {
      refus += 1;
      const chiffre = k.lignes.some((l) => ['poste', 'option'].includes(typeDe(l)));
      const juste = (k.regime === 'franchise' && attendusDevis.includes('devis_taux_franchise'))
        || (k.regime == null && chiffre);
      if (!juste) fautes.push(`cas ${k.n} (${k.nom}) : refus sans raison (${k.regime})`);
      continue;
    }
    if (attendusDevis.includes('devis_taux_franchise')) fautes.push(`cas ${k.n} : devis_taux_franchise sans refus d’aperçu`);
    let doc;
    try { doc = documentDuDevis(r.instantane); } catch (e) { fautes.push(`cas ${k.n} : la composition lève ${e.message}`); continue; }
    apercus += 1;
    DOCS_REMISE.push({ k, i: r.instantane, d: doc });
    const poses = compte(doc.marqueursVus.filter((c) => c in MOTIFS_DEVIS));
    const dus = compte(attendusDevis.filter((c) => PLACES_DES_MOTIFS[c] === 'page'));
    if (!egal(poses, dus)) fautes.push(`cas ${k.n} (${k.nom}) : posés ${JSON.stringify(poses)} ≠ dus ${JSON.stringify(dus)}`);
    /* Un marqueur posé ⇒ son motif est rendu par la base (sens 1, toutes
       places confondues). */
    const horsBase = Object.keys(poses).filter((c) => !attendusDevis.includes(c));
    if (horsBase.length) fautes.push(`cas ${k.n} : marqueur sans motif ${horsBase.join(', ')}`);
  }
  verifier(`B.4 ${apercus} aperçus et ${refus} refus : chaque marqueur posé a son motif, chaque motif « dans la page » son marqueur`,
    fautes.length === 0 && apercus > 150, fautes.slice(0, 8).join(' | '));
}

/* ------------------------------------------------------------------ */
/*  B.5 — les entrées de l'en-tête (le complément de l'étape 0)          */
/* ------------------------------------------------------------------ */
const ENT_A = { ...ENT };
const ENT_B = { ...ENT, denomination: null, est_ei: true, forme_juridique: '1000', est_siege: false, tva: null,
  adresse: '3 CHEMIN DES ESSAIS', code_postal: '13410', commune: 'LAMBESC' };
const ENT_C = { ...ENT_B, est_siege: true, adresse: null };
const ENTREPRISES = [
  null, ENT_A, { ...ENT_A, nom_commercial: 'Le Mur Droit' }, { ...ENT_A, denomination: null }, { ...ENT_A, est_siege: false },
  { ...ENT_A, adresse: null }, { ...ENT_A, source: 'administration', tva: null }, { ...ENT_A, source: 'essai', maj_insee: null, verifie_le: null },
  { ...ENT_A, siret: null, siren: null, tva: null }, ENT_B, { ...ENT_B, est_ei: null }, { ...ENT_B, est_ei: null, forme_juridique: null },
  ENT_C, { ...ENT_C, est_siege: null }, { ...ENT_A, forme_juridique: '6578', tva: null }, { ...ENT_A, forme_juridique: '5202' },
  { ...ENT_A, forme_juridique: '5710' }, { ...ENT_A, forme_juridique: '5308' }, { ...ENT_A, forme_juridique: '5453' },
  { ...ENT_A, forme_juridique: '9999' },
];
const EMETTEURS = [
  null, {}, EM, { ...EM, capital_centimes: null, capital_variable: true }, { ...EM, capital_centimes: null },
  { ...EM, registre: 'rne', greffe_ville: null }, { ...EM, greffe_ville: null }, { ...EM, registre: 'aucun', greffe_ville: null },
  { ...EM, registre: null, greffe_ville: null }, { ...EM, en_liquidation: true, locataire_gerant: true }, { ...EM, regime_tva: 'franchise' },
  { ...EM, regime_tva: null }, { ...EM, siege_adresse: '1 rue du Siège', siege_code_postal: '13000', siege_ville: 'Marseille',
    etablissement_adresse: '9 rue saisie', etablissement_code_postal: '13100', etablissement_ville: 'Aix' },
  { ...EM, siege_adresse: '1 rue du Siège', siege_code_postal: null, siege_ville: 'Marseille' },
  { ...EM, denomination_ei: 'Jean Dupont EI', registre: 'rne', greffe_ville: null },
  { ...EM, garantie_commerciale_texte: null, sav_texte: null },
  { ...EM, telephone: null, email: '   ', mediateur_nom: null, mediateur_adresse: null, mediateur_site: null,
    garantie_legale_texte: null, modalites_paiement_texte: null,
    modalites_execution_texte: null, reclamations_texte: null },
];
const TARIFS_B5 = [null, { frais_deplacement_centimes: 0, frais_deplacement_texte: null }, TARIFS_35,
  { frais_deplacement_centimes: null, frais_deplacement_texte: 'selon la distance' }, { frais_deplacement_centimes: null, frais_deplacement_texte: null }];
const PREUVES_B5 = [null, PREUVE, { ...PREUVE, source: 'essai' }, { ...PREUVE, source: 'declaration', declare_le: '2026-11-09T10:00:00+00:00' },
  { ...PREUVE, siren: '000048009', numero: 'FR91000048009' }];
/* Comme la BASE range la fiche (`tient_l_emetteur` : un texte rogné de ses
   blancs ASCII, et vide → null) : la parité se juge sur ce qui peut exister. */
const commeLaBase = (e) => (e ? Object.fromEntries(Object.entries(e).map(([k, v]) => {
  if (typeof v !== 'string') return [k, v];
  const t = v.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '');
  return [k, t === '' ? null : t];
})) : e);
/* Seules les fiches que la BASE accepte (`validerEmetteur`, le miroir de
   ses contraintes) : « RCS » sans ville du greffe est refusé
   (`emetteur_greffe_check`), et le marqueur « la ville du greffe », porté
   par la clé `registre`, n'y a pas de motif — un état qui ne peut pas
   exister ne se juge pas. */
const EMETTEURS_ACCEPTES = EMETTEURS.filter((em) => em === null || validerEmetteur(commeLaBase(em)).ok === true);
const ENTREES_B5 = [];
ENTREPRISES.forEach((en, i) => EMETTEURS_ACCEPTES.forEach((em, j) => {
  ENTREES_B5.push({
    entreprise: en, emetteur: commeLaBase(em), assurances: [DECENNALE_VALABLE], tarifs: TARIFS_B5[(i + j) % TARIFS_B5.length],
    preuveTva: PREUVES_B5[(i + 2 * j) % PREUVES_B5.length],
  });
}));

section(`B.5 Les clés de l’entreprise : enteteImprimeDetaille = le miroir d’emetteur_incomplet (${ENTREES_B5.length} entrées)`);
{
  const HORS = ['entreprise_ancienne', 'conso_profession_reglementee'];
  const fautes = [];
  const fautesTextes = [];
  for (const x of ENTREES_B5) {
    const det = enteteImprimeDetaille(x);
    const cles = [...det.identite, ...det.mentions].map((l) => l.cle).filter(Boolean).sort();
    const motifs = motifsEmetteur({ ...x, metiers: null, maintenant: new Date(MAINTENANT) }).map((m) => m.split(': ')[0])
      .filter((c) => !HORS.includes(c)).sort();
    if (!egal(cles, motifs)) fautes.push(`${JSON.stringify(cles)} ≠ ${JSON.stringify(motifs)}`);
    const ancien = enteteImprime(x);
    const garde = (l) => !l.seulementSurLeDevis;
    if (!egal(ancien.identite, det.identite.filter(garde).map((l) => l.texte))
      || !egal(ancien.mentions, det.mentions.filter(garde).map((l) => l.texte)) || ancien.source !== det.source) {
      fautesTextes.push(JSON.stringify(x).slice(0, 120));
    }
  }
  verifier('B.5 sur chaque entrée, les clés posées = les motifs du miroir, hors entreprise_ancienne et conso_profession_reglementee',
    fautes.length === 0, `${fautes.length} écart(s) : ${fautes.slice(0, 4).join(' | ')}`);
  verifier('B.5 enteteImprime = les textes d’enteteImprimeDetaille (sans les lignes « seulement sur le devis »), et la même source',
    fautesTextes.length === 0, fautesTextes.slice(0, 3).join(' | '));
  /* Le cas que la refonte a ajouté, en littéraux : une SARL (au RCS par sa
     forme) déclarée au RNE allume le motif `registre` ; le devis le montre,
     l'en-tête de « Mon entreprise » ne change pas. */
  const rne = { entreprise: ENT_A, emetteur: { ...EM, registre: 'rne', greffe_ville: null } };
  const lignes = [...enteteImprimeDetaille(rne).identite].filter((l) => l.cle === 'registre');
  verifier('B.5 une SARL déclarée au RNE : « [à compléter : où votre entreprise est immatriculée] » sur le devis seulement',
    lignes.length === 1 && lignes[0].seulementSurLeDevis === true
      && lignes[0].texte === `${PREFIXE_MANQUE}où votre entreprise est immatriculée]`
      && !enteteImprime(rne).identite.includes(lignes[0].texte)
      && motifsEmetteur({ ...rne, maintenant: new Date(MAINTENANT) }).some((m) => m.startsWith('registre: ')), JSON.stringify(lignes));
  verifier('B.5 PREFIXE_MANQUE, en toutes lettres', PREFIXE_MANQUE === '[à compléter : ', JSON.stringify(PREFIXE_MANQUE));
  verifier('B.5 les fiches écartées comme impossibles en base : « RCS sans greffe » SEULEMENT',
    EMETTEURS.length - EMETTEURS_ACCEPTES.length === 1 && !EMETTEURS_ACCEPTES.some((e) => e && e.registre === 'rcs' && !e.greffe_ville),
    EMETTEURS.filter((em) => em && validerEmetteur(commeLaBase(em)).ok !== true)
      .map((em) => JSON.stringify(validerEmetteur(commeLaBase(em)))).join(' | '));
}

section('B.6 Les mentions dues à un particulier suivent `mentionComptee`, par CLÉ');
{
  /* Une EI hors RCS, sans adresse d'établissement connue, hors du siège, sans
     n° de TVA, et une fiche qui ne dit aucun de ses contacts : TOUTES les
     mentions dues à un particulier manquent. */
  const ent = { ...ENT_B, adresse: null };
  const em = { ...EM, denomination_ei: 'Jean Témoin EI', registre: 'rne', greffe_ville: null, capital_centimes: null,
    telephone: null, email: null, mediateur_nom: null, mediateur_adresse: null, mediateur_site: null, garantie_legale_texte: null,
    modalites_paiement_texte: null, modalites_execution_texte: null, reclamations_texte: null };
  const TOUTES = ['conso_adresse_etablissement', 'conso_adresse_siege', 'conso_email', 'conso_garantie_legale', 'conso_mediateur',
    'conso_modalites_execution', 'conso_modalites_paiement', 'conso_reclamations', 'conso_telephone', 'conso_tva_intra'];
  const GARDEES_POUR_UN_PRO = ['conso_adresse_etablissement', 'conso_adresse_siege'];
  const fautes = [];
  for (const [pourQui, client] of [[null, null], ['consommateur', 'cli-1'], ['non_professionnel', 'cli-1'],
    ['professionnel_hors_activite', 'cli-1'], ['professionnel', 'cli-1'], ['professionnel', 'cli-autre']]) {
    const c = cas(`B.6 ${pourQui}`, { entreprise: ent, emetteur: em, devis: { pour_qui: pourQui, pour_qui_client: client } });
    const r = resultat(c);
    const valable = r.instantane.devis.pour_qui_valable;
    const vus = r.document.marqueursVus.filter((k) => k.startsWith('conso_')).sort();
    const attendu = valable === 'professionnel' ? GARDEES_POUR_UN_PRO : TOUTES;
    if (!egal(vus, attendu)) fautes.push(`${pourQui}/${client} : ${vus.join(', ')}`);
    const crochets = texteDeLaPage(r.document).filter((x) => x.texte.startsWith('[pour un particulier : ')).length;
    if (crochets !== attendu.length) fautes.push(`${pourQui}/${client} : ${crochets} « [pour un particulier : … ] » au lieu de ${attendu.length}`);
    if (!egal(attendu.filter((k) => mentionComptee(k, valable)), attendu)) fautes.push(`${pourQui} : mentionComptee diverge`);
  }
  verifier('B.6 pour un client « professionnel » (réponse valable) : seules les deux adresses ; pour les autres réponses, le vide, '
    + 'et la réponse donnée pour un autre client : toutes', fautes.length === 0, fautes.join(' | '));
}

section('B.7 Une assurance échue reste imprimée, suivie de son marqueur (D8)');
{
  const { d } = docDe('une assurance échue');
  const k = d.informations.findIndex((t) => t.startsWith('Responsabilité civile professionnelle — Second Assureur'));
  verifier('B.7 la ligne de l’assurance reste, et le marqueur la suit, en toutes lettres', k >= 0 && d.informations[k + 1]
    === '[à compléter : la nouvelle attestation de votre responsabilité civile professionnelle, la précédente était valable jusqu’au 01/10/2026]',
  JSON.stringify(d.informations.slice(0, 4)));
  verifier('B.7 ce marqueur ne montre aucun point de la liste (D8 : pas de clé)', !d.marqueursVus.length, JSON.stringify(d.marqueursVus));
  const sansMarqueur = ['une assurance qui finit le jour même', 'une assurance sans date', 'réel, complet']
    .filter((n) => docDe(n).d.informations.some((t) => t.includes('la nouvelle attestation')));
  verifier('B.7 aucune attestation réclamée le jour même de la fin, sans date, ni valable', sansMarqueur.length === 0, sansMarqueur.join(', '));
  const autre = documentDuDevis(instantaneDuDevis({ ...CAS_A[0].entrees, assurances: [{ ...RC_ECHUE, nature: 'autre', libelle: 'Bris de machine' },
    { ...RC_ECHUE, id: 'as-9', nature: 'decennale' }] }).instantane);
  verifier('B.7 la nature dans la phrase : « assurance « Bris de machine » », « assurance décennale »',
    autre.informations.includes('[à compléter : la nouvelle attestation de votre assurance « Bris de machine », la précédente était valable jusqu’au 01/10/2026]')
      && autre.informations.includes('[à compléter : la nouvelle attestation de votre assurance décennale, la précédente était valable jusqu’au 01/10/2026]'),
    JSON.stringify(autre.informations));
}

section('B.8 Les frais de déplacement (D25), et le coût du devis');
{
  const fin = 'Facturé seulement s’il figure dans le détail des travaux.';
  const lu8 = (n) => docDe(n).d.conditions.filter((t) => t.startsWith('Tarif de déplacement') || t.startsWith('Déplacement')
    || t.includes('frais de déplacement'));
  const attendus = [
    ['réel, complet', [`Tarif de déplacement : 35,00${NS}€${NS}TTC — au-delà de 20 km. ${fin}`]],
    ['franchise, déplacement à 35 €', [`Tarif de déplacement : 35,00${NS}€ — au-delà de 20 km. ${fin}`]],
    ['déplacement en texte seul', [`Tarif de déplacement : selon la distance. ${fin}`]],
    ['déplacement offert', ['Déplacement offert']],
    ['aucun tarif', ['[à compléter : vos frais de déplacement]']],
  ];
  const fautes = attendus.filter(([n, a]) => !egal(lu8(n), a)).map(([n]) => `${n} : ${JSON.stringify(lu8(n))}`);
  verifier('B.8 la phrase des frais, en toutes lettres : « TTC » au réel seulement ; le texte de l’artisan tel quel ; « Déplacement offert » ; '
    + 'le marqueur', fautes.length === 0 && FRAIS_HORS_DU_TOTAL === fin, fautes.join(' | '));
  verifier('B.8 le marqueur des frais montre son point (frais_deplacement)', docDe('aucun tarif').d.marqueursVus.includes('frais_deplacement'),
    JSON.stringify(docDe('aucun tarif').d.marqueursVus));
  const point = documentDuDevis(instantaneDuDevis({ ...CAS_A[0].entrees,
    tarifs: { frais_deplacement_centimes: 3500, frais_deplacement_texte: 'au-delà de 20 km.' } }).instantane);
  verifier('B.8 un texte qui finit par un point ne le double pas',
    point.conditions.includes(`Tarif de déplacement : 35,00${NS}€${NS}TTC — au-delà de 20 km. ${fin}`), JSON.stringify(point.conditions));
  verifier('B.8 le coût du devis : « Devis payant : 30,00 € TTC » au réel, « Devis payant : 30,00 € » en franchise, « Devis gratuit », le marqueur',
    docDe('payant, réduction').d.enTete.cout === `Devis payant : 30,00${NS}€${NS}TTC`
      && docDe('franchise, déplacement à 35 €').d.enTete.cout === `Devis payant : 30,00${NS}€`
      && docDe('réel, complet').d.enTete.cout === 'Devis gratuit'
      && docDe('devis vide').d.enTete.cout === '[à compléter : gratuit ou payant]', '');
}

section('B.9 Le régime sur la page (§4.5) : HT et TTC au réel, rien de la TVA ailleurs, un taux une seule fois');
{
  const fautes = [];
  const reel = (doc) => doc.i.emetteur && doc.i.emetteur.regime_tva === 'reel';
  const tous = [...DOCS_A, ...DOCS_REMISE];
  for (const doc of tous) {
    const nom = doc.c ? doc.c.nom : `cas-remise ${doc.k.n}`;
    const textes = texteDeLaPage(doc.d).filter((x) => !x.chemin.startsWith('totaux.'));
    if (reel(doc)) {
      /* Chaque « € » hors des totaux est suivi de « HT » ou de « TTC » —
         sauf le capital d'une société, qui n'est pas un prix. */
      textes.forEach(({ chemin, texte }) => {
        const t = texte.replace(/au capital de [\d  ]+,\d{2} €/g, '');
        const nus = [...t.matchAll(/€(?! (HT|TTC)(?![\p{L}]))/gu)];
        if (nus.length) fautes.push(`${nom} : ${chemin} « ${texte} »`);
      });
    } else {
      const EXCEPTIONS = ['TVA non applicable, article 293 B du CGI', 'N° de TVA intracommunautaire : ', 'n° de TVA : ',
        '[à compléter : votre régime de TVA]'];
      texteDeLaPage(doc.d).forEach(({ chemin, texte }) => {
        let t = texte;
        EXCEPTIONS.forEach((e) => { t = t.split(e).join(''); });
        if (/(?<![\p{L}])(HT|TTC|TVA)(?![\p{L}])/u.test(t)) fautes.push(`${nom} : ${chemin} « ${texte} »`);
      });
    }
    const tableau = doc.d.totaux.tableau;
    if (tableau) {
      const taux = tableau.lignes.map((l) => l[0]);
      if (new Set(taux).size !== taux.length) fautes.push(`${nom} : un taux deux fois dans le tableau`);
      doc.d.totaux.rangees.forEach((r) => { if (taux.some((x) => r.libelle.includes(x))) fautes.push(`${nom} : un taux dans « ${r.libelle} »`); });
    } else if (reel(doc) && doc.i.devis.ventilation.length) fautes.push(`${nom} : pas de tableau de TVA au réel`);
  }
  verifier(`B.9 sur ${tous.length} documents : au réel tout montant dit HT ou TTC (hors totaux) ; en franchise et non déclaré, ni HT, `
    + 'ni TTC, ni TVA (hors la mention 293 B, le n° de TVA et le marqueur du régime) ; chaque taux une fois, dans le tableau seulement',
  fautes.length === 0, fautes.slice(0, 6).join(' | '));
  /* S28 : au réel, une option dit son HT ET son TTC — « X HT, soit Y TTC »,
     Y = X + la TVA de son taux (`tvaDe`, le miroir de `devis_tva_de`) ; une
     option offerte dit « Offert ». La règle du dessus (« tout montant dit HT
     ou TTC ») laissait passer une option réduite à son HT : seule l'empreinte
     (B.15) la voyait, et une empreinte se refige. */
  const fautesOptions = [];
  let optionsJugees = 0;
  for (const doc of tous.filter(reel)) {
    const nom = doc.c ? doc.c.nom : `cas-remise ${doc.k.n}`;
    const brutes = (doc.i.lignes || []).filter((l) => typeDe(l) === 'option');
    const imprimees = doc.d.options ? doc.d.options.lignes : [];
    if (brutes.length !== imprimees.length) {
      fautesOptions.push(`${nom} : ${brutes.length} option(s), ${imprimees.length} imprimée(s)`);
    } else {
      brutes.forEach((l, k) => {
        const t = imprimees[k].total;
        if (l.offert === true) { if (t !== 'Offert') fautesOptions.push(`${nom} : « ${t} » pour une option offerte`); return; }
        optionsJugees += 1;
        const m = new RegExp(`^(.+)${NS}HT, soit (.+)${NS}TTC$`).exec(t);
        const tva = tvaDe(l.total_centimes, l.taux_tva_centiemes);
        if (!m || tva == null || centimesDe(m[1]) !== l.total_centimes || centimesDe(m[2]) !== l.total_centimes + tva) {
          fautesOptions.push(`${nom} : « ${t} »`);
        }
      });
    }
  }
  const opt9 = docDe('payant, réduction').d;
  verifier(`B.9 au réel, chaque option dit son HT ET son TTC, « X HT, soit Y TTC » (Y = X + la TVA de son taux), sur ${optionsJugees} `
    + 'option(s) ; en toutes lettres : « 450,00 € HT, soit 495,00 € TTC »', fautesOptions.length === 0 && optionsJugees > 0
    && !!opt9.options && opt9.options.lignes[0].total === `450,00${NS}€${NS}HT, soit 495,00${NS}€${NS}TTC`,
  fautesOptions.slice(0, 4).join(' | ') || JSON.stringify(opt9.options && opt9.options.lignes[0]));
  const f = docDe('franchise, sans taxe').d;
  verifier('B.9 en franchise : « Total » seul dans les totaux, aucun tableau, la mention 293 B dans l’identité',
    egal(f.totaux.rangees.map((r) => r.libelle), ['Total']) && f.totaux.tableau === null
      && f.emetteur.identite.includes('TVA non applicable, article 293 B du CGI'), JSON.stringify(f.totaux));
  const nd = docDe('non déclaré, titres').d;
  verifier('B.9 non déclaré : « Total » sans taxe, le marqueur du régime, des titres et des réserves seulement',
    egal(nd.totaux.rangees.map((r) => r.libelle), ['Total']) && nd.emetteur.identite.includes('[à compléter : votre régime de TVA]')
      && nd.decompte.every((b) => b.genre !== 'ligne'), JSON.stringify(nd.totaux));
}

section('B.10 Les unités, le pluriel, « Offert », « sans TVA », « Base HT après réduction »');
{
  const { d } = docDe('chaque unité');
  const x = (q, u) => `${q}${NS}${u} × 10,00${NS}€${NS}HT · TVA 10${NS}%`;
  const attendus = [`1${NS}m² × 45,00${NS}€${NS}HT · TVA 10${NS}%`, x('1', 'm linéaire'), x('2,5', 'm linéaires'), x('2', 'm³'),
    x('3', 'u'), x('1,5', 'h'), x('1', 'jour'), x('2', 'jours'), x('1', 'forfait'), x('2', 'forfaits')];
  verifier('B.10 le détail de chaque unité, en toutes lettres', egal(d.decompte.map((b) => b.detail), attendus),
    JSON.stringify(d.decompte.map((b) => b.detail)));
  verifier('B.10 UNITES_IMPRIMEES, en toutes lettres', egal(UNITES_IMPRIMEES, {
    m2: { singulier: 'm²', pluriel: 'm²' }, m: { singulier: 'm linéaire', pluriel: 'm linéaires' }, m3: { singulier: 'm³', pluriel: 'm³' },
    u: { singulier: 'u', pluriel: 'u' }, h: { singulier: 'h', pluriel: 'h' }, jour: { singulier: 'jour', pluriel: 'jours' },
    forfait: { singulier: 'forfait', pluriel: 'forfaits' },
  }), JSON.stringify(UNITES_IMPRIMEES));
  verifier('B.10 nombreDe : « 1 jour », « 2 jours », « 1 page », « 1 point », « 0 point », « 1,5 jour », le nombre écrit gardé',
    nombreDe(1, 'jour', 'jours') === '1 jour' && nombreDe(2, 'jour', 'jours') === '2 jours' && nombreDe(1, 'page', 'pages') === '1 page'
      && nombreDe(1, 'point', 'points') === '1 point' && nombreDe(0, 'point', 'points') === '0 point'
      && nombreDe(1.5, 'jour', 'jours', '1,5') === '1,5 jour' && nombreDe(1234, 'jour', 'jours', `1${NS}234`) === `1${NS}234 jours`
      && nombreDe(-3, 'point', 'points') === '-3 points', nombreDe(2, 'jour', 'jours'));
  const ml = DOCS_A.filter(({ d: doc }) => texteDeLaPage(doc).some(({ texte }) => /(?<![\p{L}])ml(?![\p{L}])/iu.test(texte)));
  verifier('B.10 jamais « ml »', ml.length === 0, ml.map(({ c }) => c.nom).join(', '));
  const o = docDe('payant, réduction').d;
  verifier('B.10 une ligne offerte dit « Offert » ; le tableau dit « Base HT après réduction » quand il y a une réduction, « Base HT » sinon',
    o.decompte.some((b) => b.genre === 'ligne' && b.total === 'Offert') && o.totaux.tableau.colonnes[1] === 'Base HT après réduction'
      && docDe('réel, complet').d.totaux.tableau.colonnes[1] === 'Base HT'
      && egal(o.totaux.tableau.colonnes, ['Taux', 'Base HT après réduction', 'TVA']), JSON.stringify(o.totaux.tableau));
  const z = docDe('réel, une ligne à 0').d;
  const ligne0 = z.decompte.find((b) => b.designation === 'Évacuation');
  verifier('B.10 au réel, une ligne à 0 : « sans TVA », son marqueur, et son point (devis_taux_sans_tva)',
    ligne0 && ligne0.detail.endsWith(' · sans TVA') && egal(ligne0.marqueurs, ['[à compléter : le taux de TVA de cette ligne]'])
      && egal(z.marqueursVus, ['devis_taux_sans_tva']) && egal(z.totaux.tableau.lignes.map((l) => l[0]), [`10${NS}%`, 'Sans TVA']),
    JSON.stringify([ligne0, z.marqueursVus, z.totaux.tableau]));
  const sansTauxAuReel = documentDuDevis(instantaneDuDevis({ ...CAS_A[0].entrees,
    devisLu: lu(devisBrut(), [ligneBrute({ taux_tva_centiemes: null })], []) }).instantane);
  verifier('B.10 une ligne SANS taux ne dit pas « sans TVA » et ne porte aucun marqueur (rien ne contredit le régime)',
    !sansTauxAuReel.decompte[0].detail.includes('TVA') && egal(sansTauxAuReel.decompte[0].marqueurs, []), JSON.stringify(sansTauxAuReel.decompte));
  const fnc = docDe('fourniture non comprise').d.decompte[0].detail;
  verifier('B.10 « · fourniture non comprise » et « · réparation urgente »', fnc.endsWith(' · fourniture non comprise')
    && docDe('une réparation urgente, client à titre privé').d.decompte[0].detail.endsWith(' · réparation urgente'), fnc);
}

section('B.11 L’ordre des totaux (D27)');
{
  const o = docDe('payant, réduction').d.totaux;
  verifier('B.11 avant et après la réduction, la TVA, le total, l’acompte et le reste, PUIS « options comprises »',
    egal(o.rangees.map((r) => r.cle), ['brut', 'reduction', 'net', 'tva', 'total', 'acompte', 'reste', 'options']), o.rangees.map((r) => r.cle).join(', '));
  verifier('B.11 les libellés, en toutes lettres', egal(o.rangees.map((r) => [r.libelle, r.montant, r.ton]), [
    ['Total HT avant réduction', `562,50${NS}€`, 'normal'], [`Réduction 5${NS}%`, `−${NS}28,13${NS}€`, 'normal'],
    ['Total HT', `534,37${NS}€`, 'normal'], ['TVA', `53,44${NS}€`, 'normal'], ['Total TTC', `587,81${NS}€`, 'fort'],
    [`Arrhes 30${NS}% du total, sans les options`, `176,34${NS}€`, 'normal'],
    ['Reste à payer, sans les options, avant la retenue de garantie', `411,47${NS}€`, 'normal'],
    ['Total TTC si toutes les options sont commandées', `1${NS}082,81${NS}€`, 'normal'],
  ]) && egal(o.notes, ['La réduction ne porte pas sur les options.']), JSON.stringify(o.rangees.map((r) => [r.libelle, r.montant])));
  const sn = docDe('acompte sans nature').d;
  verifier('B.11 un acompte sans nature : le marqueur à la place du mot, et son point (devis_acompte_nature)',
    sn.totaux.rangees.some((r) => r.libelle === '[à compléter : acompte ou arrhes], sans les options')
      && sn.marqueursVus.includes('devis_acompte_nature'), JSON.stringify(sn.totaux.rangees.map((r) => r.libelle)));
  verifier('B.11 rangeesImprimees ne pose la note de la réduction que s’il y a des options',
    rangeesImprimees({ ht: 900, tva: 0, ttc: 900, reduction: 100, brut: 1000, acompte: 0, ttcOptions: 900, demande: {} }, 'reel').notes.length === 0
      && rangeesImprimees({ ht: 900, tva: 0, ttc: 900, reduction: 100, brut: 1000, acompte: 0, ttcOptions: 1900, demande: {} }, 'reel',
        { nbOptions: 1 }).notes.length === 1, '');
}

section('B.12 Les places de 2c-2, « [prochaine version d’Opus : …] » (D24)');
{
  verifier('B.12 PREFIXE_A_VENIR et les neuf places, en toutes lettres', PREFIXE_A_VENIR === '[prochaine version d’Opus : ' && egal(A_VENIR, {
    retenue: '[prochaine version d’Opus : ce que la loi dit de la retenue de garantie]',
    acompte: '[prochaine version d’Opus : quand la somme demandée d’avance se paie]',
    tauxReduit: '[prochaine version d’Opus : la mention de TVA à taux réduit que votre client signera sur le devis]',
    urgence: '[prochaine version d’Opus : ce que la réparation urgente change pour votre client]',
    dechets: '[prochaine version d’Opus : ce que deviendront les déchets du chantier]',
    energie: '[prochaine version d’Opus : les travaux d’économies d’énergie et le label RGE]',
    decennale: '[prochaine version d’Opus : l’attestation de votre assurance décennale, jointe au devis]',
    finConsommateur: '[prochaine version d’Opus : la rétractation et son formulaire, la demande de commencer avant la fin du délai, '
      + 'les pièces remplacées (dépannage, réparation, entretien), les signatures]',
    finProfessionnel: '[prochaine version d’Opus : les signatures]',
  }), JSON.stringify(A_VENIR));
  /* LES TROIS PLACES NÉES DE LA RELECTURE DU 27/11, chacune dans les deux
     sens : posée quand la règle de la liste (rang 13, rang 14, rang 11)
     peut demander le bloc, absente quand elle ne le demande pas. */
  const non = docDe('déchets « Non », décennale « Non », énergie « Aucun de ces travaux »').d;
  const oui = docDe('déchets « Oui », décennale « Oui », des travaux d’énergie, à titre privé').d;
  const std = docDe('réel, complet').d;
  verifier('B.12 les déchets : leur place au bout du décompte tant que la réponse n’est pas « Non » (vide vaut « Oui »)',
    std.decompteAVenir.includes(A_VENIR.dechets) && oui.decompteAVenir.includes(A_VENIR.dechets) && !non.decompteAVenir.includes(A_VENIR.dechets),
    JSON.stringify([std.decompteAVenir, non.decompteAVenir]));
  const energie = [['déchets « Oui », décennale « Oui », des travaux d’énergie, à titre privé', true],
    ['des travaux d’énergie, association', true], ['des travaux d’énergie, « à quel titre » vide', true],
    ['des travaux d’énergie, petite entreprise hors de son activité', false], ['des travaux d’énergie, pour son entreprise', false],
    ['déchets « Non », décennale « Non », énergie « Aucun de ces travaux »', false], ['réel, complet', false]]
    .filter(([n, attendu]) => docDe(n).d.decompteAVenir.includes(A_VENIR.energie) !== attendu);
  verifier('B.12 le label RGE : sa place quand des travaux d’énergie sont cochés, pour un client à titre privé, une association ou une '
    + 'réponse vide — jamais pour les deux réponses « entreprise », ni pour « Aucun », ni sans réponse', energie.length === 0,
  energie.map(([n]) => n).join(', '));
  const apres = (doc) => doc.informations.indexOf(A_VENIR.decennale);
  const sansAss = docDe('aucune assurance déclarée').d;
  verifier('B.12 l’attestation décennale : sa place juste après les assurances tant que la réponse n’est pas « Non » ; en tête des '
    + 'informations sans assurance', apres(std) === 1 && std.informations[0].startsWith('Assurance décennale') && apres(oui) === 1
    && !non.informations.includes(A_VENIR.decennale) && apres(sansAss) === 0, JSON.stringify([std.informations, sansAss.informations]));
  const pro = docDe('arrhes, client pour son entreprise, sans modalités de paiement').d;
  verifier('B.12 la place de l’acompte ne disparaît pas avec les modalités de paiement : en tête des conditions, la même demande '
    + 'donnant la même page', pro.conditions[0] === A_VENIR.acompte && pro.conditions.filter((x) => x === A_VENIR.acompte).length === 1,
  JSON.stringify(pro.conditions));
  const urgPro = docDe('une réparation urgente, client pour son entreprise').d;
  const urgPrive = docDe('une réparation urgente, client à titre privé').d;
  verifier('B.12 la réparation urgente : marquée pour un client à titre privé, pas pour son entreprise',
    urgPrive.decompteAVenir.includes(A_VENIR.urgence) && !urgPro.decompteAVenir.includes(A_VENIR.urgence), '');
  verifier('B.12 l’attestation de taux réduit : au réel avec une ligne à 10 % ou 5,5 %, jamais en franchise',
    docDe('réel, complet').d.decompteAVenir.includes(A_VENIR.tauxReduit)
      && !docDe('franchise, sans taxe').d.decompteAVenir.includes(A_VENIR.tauxReduit)
      && !documentDuDevis(instantaneDuDevis({ ...CAS_A[0].entrees, devisLu: lu(devisBrut(), [ligneBrute({ taux_tva_centiemes: 2000 })], []) })
        .instantane).decompteAVenir.includes(A_VENIR.tauxReduit), '');
  const ac = docDe('payant, réduction').d.conditions;
  verifier('B.12 l’acompte demandé : sa place juste après les modalités de paiement ; la retenue : « Retenue de garantie : 5 % » puis sa place',
    ac[ac.findIndex((t) => t.startsWith('Modalités de paiement : ')) + 1] === A_VENIR.acompte
      && ac[ac.indexOf(`Retenue de garantie : 5${NS}%`) + 1] === A_VENIR.retenue
      && !docDe('réel, complet').d.conditions.includes(A_VENIR.acompte) && !docDe('réel, complet').d.conditions.includes(A_VENIR.retenue),
    JSON.stringify(ac));
  const fins = [['à titre privé', A_VENIR.finConsommateur], ['association', A_VENIR.finConsommateur],
    ['petite entreprise', A_VENIR.finConsommateur], ['« à quel titre » vide', A_VENIR.finConsommateur],
    ['réponse donnée pour un AUTRE', A_VENIR.finConsommateur], ['pour son entreprise', A_VENIR.finProfessionnel]]
    .filter(([n, a]) => docDe(n).d.aVenir !== a);
  verifier('B.12 le dernier bloc : les signatures seules pour un client professionnel, la rétractation pour tous les autres et le vide',
    fins.length === 0, fins.map(([n]) => n).join(', '));
  const horsListe = DOCS_A.flatMap(({ c, d }) => texteDeLaPage(d).filter((x) => x.texte.includes(PREFIXE_A_VENIR)
    && !Object.values(A_VENIR).includes(x.texte)).map((x) => `${c.nom} : ${x.texte}`));
  verifier('B.12 aucune autre place « à venir » que les neuf', horsListe.length === 0, horsListe.join(' | '));
}

section('B.12 bis Les marqueurs « [à compléter : …] » de la composition, en toutes lettres, avec leur point');
{
  verifier('B.12 bis chaque marqueur, son texte et la clé du point qu’il montre (la désignation : aucune, la base l’interdit vide)',
    egal(MARQUEURS, {
      client: { texte: '[à compléter : le client de ce devis]', cle: 'devis_client' },
      lieu: { texte: '[à compléter : le lieu des travaux]', cle: 'devis_lieu' },
      delai: { texte: '[à compléter : le délai d’exécution]', cle: 'devis_delai' },
      validite: { texte: '[à compléter : la durée de validité]', cle: 'devis_validite' },
      cout: { texte: '[à compléter : gratuit ou payant]', cle: 'devis_cout' },
      lignes: { texte: '[à compléter : au moins un poste chiffré]', cle: 'devis_lignes' },
      designation: { texte: '[à compléter : la désignation]', cle: null },
      nature: { texte: '[à compléter : acompte ou arrhes]', cle: 'devis_acompte_nature' },
      tauxDeLaLigne: { texte: '[à compléter : le taux de TVA de cette ligne]', cle: 'devis_taux_sans_tva' },
    }), JSON.stringify(MARQUEURS));
  const vide = docDe('devis vide').d;
  verifier('B.12 bis le devis vide montre les six marqueurs du devis qui le concernent, et leurs points',
    egal([...vide.marqueursVus].filter((k) => k.startsWith('devis_')).sort(),
      ['devis_client', 'devis_cout', 'devis_delai', 'devis_lieu', 'devis_lignes', 'devis_validite'])
      && vide.decompteVide === MARQUEURS.lignes.texte && egal(vide.client, [MARQUEURS.client.texte])
      && vide.enTete.validite === MARQUEURS.validite.texte, JSON.stringify(vide.marqueursVus));
  const sansFiche = docDe('client au devis, fiche introuvable').d;
  verifier('B.12 bis un client au devis dont la fiche n’a pas été lue : le marqueur, mais AUCUN point (devis_client n’est pas allumé)',
    egal(sansFiche.client, [MARQUEURS.client.texte]) && !sansFiche.marqueursVus.includes('devis_client'), JSON.stringify(sansFiche.marqueursVus));
}

section('B.13 Le mode exemple');
{
  const ex = docDe('mode exemple').d;
  const exemple2 = documentDuDevis(instantaneDuDevis({ ...CAS_A[0].entrees, entreprise: { ...ENT, source: 'exemple' } }).instantane);
  const sources = [ex, exemple2].map((d) => d.emetteur.source);
  const fuites = [ex, exemple2].flatMap((d) => texteDeLaPage(d).filter(({ texte }) => /Sirene|DGFiP|INSEE|annuaire/i.test(texte)));
  verifier('B.13 la source dit « Identité inventée pour l’exemple » (en mode exemple, et pour une identité d’exemple), jamais Sirene ni DGFiP',
    egal(sources, [SOURCE_EXEMPLE, SOURCE_EXEMPLE]) && SOURCE_EXEMPLE === 'Identité inventée pour l’exemple' && fuites.length === 0,
    JSON.stringify([sources, fuites]));
}

section('B.14 Les mots (§4.8) : chaque règle, ses exceptions FERMÉES, et sa contre-épreuve');
/* Ce qui vient d'un CHAMP s'imprime tel quel (Q1, recommandation A) : on le
   MASQUE avant de juger, pour ne juger que ce qu'Opus écrit lui-même. */
function saisiesDe(i) {
  const s = [];
  const pousser = (v) => { if (typeof v === 'string' && v.trim()) s.push(v); };
  const d = i.devis || {};
  ['objet', 'lieu_adresse', 'lieu_code_postal', 'lieu_ville', 'delai_execution'].forEach((k) => pousser(d[k]));
  (i.lignes || []).forEach((l) => pousser(l.designation));
  if (i.entreprise) ['denomination', 'nom_commercial', 'adresse', 'commune', 'code_postal'].forEach((k) => pousser(i.entreprise[k]));
  if (i.emetteur) Object.values(i.emetteur).forEach(pousser);
  (i.assurances || []).forEach((a) => ['libelle', 'assureur_nom', 'assureur_coordonnees', 'couverture', 'numero_contrat'].forEach((k) => pousser(a[k])));
  if (i.tarifs) pousser(i.tarifs.frais_deplacement_texte);
  if (i.client) ['nom', 'adresse', 'ville', 'code_postal'].forEach((k) => pousser(i.client[k]));
  return [...new Set(s)].sort((a, b) => b.length - a.length);
}
const masquer = (texte, saisies) => saisies.reduce((t, s) => t.split(s).join('◆'), texte);
/* Les trois formes juridiques que l'INSEE nomme « artisanale » (Q1) : elles
   s'impriment telles quelles. Toute autre trace du mot vient d'un champ, ou
   c'est Opus qui l'écrit — refusé. */
const FORMES_ARTISANALES = ['5453', '5553', '5653'].map((k) => FORMES_JURIDIQUES[k]);
const L = '(?<![\\p{L}\\p{N}_])';
const R = '(?![\\p{L}\\p{N}_])';
const REGLES = [
  { nom: '« artisan », toute forme, toute casse (K1)', re: /(?<![\p{L}])artisan/iu, retirer: FORMES_ARTISANALES,
    fautif: ['Fait par un artisan', 'Artisanal', 'Deux artisans', 'COOPÉRATIVE ARTISANALE'], juste: ['partisan', 'Une SARL'] },
  { nom: '« vérifié », « certifié », « agréé », « conforme », « aux normes »',
    re: new RegExp(`${L}(v[ée]rifi[ée]e?s?|certifi[ée]e?s?|agr[ée][ée]e?s?|conformes?|aux normes)${R}`, 'iu'),
    fautif: ['travail vérifié', 'Entreprise certifiée', 'installateur agréé', 'conforme', 'aux normes'], juste: ['vérification à venir'] },
  { nom: '« garanti(e)(s) » hors des termes imposés',
    re: new RegExp(`${L}garanti(e|es|s)?${R}`, 'iu'),
    retirer: ['Garantie légale : ', 'Garantie commerciale : ', 'Retenue de garantie : ', 'avant la retenue de garantie',
      'ce que la loi dit de la retenue de garantie', 'vos garanties légales'],
    fautif: ['garantie totale', 'Travaux garantis'], juste: ['Retenue de garantie : 5 %', 'Garantie légale : …'] },
  /* Une seule forme de l'INSEE contient le mot : 6901, « Autre personne de
     droit privé inscrite au registre du commerce et des sociétés ». Comme les
     formes « artisanales », elle s'imprime telle que l'INSEE la nomme — une
     exception que le §4.8 n'avait pas vue (mesuré sur les 260 codes). */
  { nom: '« registre » (mot entier)', re: new RegExp(`${L}registres?${R}`, 'iu'), retirer: [FORMES_JURIDIQUES['6901']],
    fautif: ['inscrit au registre'], juste: ['enregistrement', 'RCS', FORMES_JURIDIQUES['6901']] },
  { nom: '« remise » (mot entier)', re: new RegExp(`${L}remises?${R}`, 'iu'), fautif: ['une remise de 5 %', 'Remise'],
    juste: ['le jour où ce devis sera remis'] },
  { nom: '« Opus » hors de la source d’essai et des places « à venir »', re: new RegExp(`${L}Opus${R}`, 'u'),
    retirer: [PREFIXE_A_VENIR, 'preuve d’essai posée par Opus'], fautif: ['Opus le dit'], juste: [`${PREFIXE_A_VENIR}les signatures]`] },
  { nom: '« VIES » hors de la source d’essai', re: new RegExp(`${L}VIES${R}`, 'u'), retirer: ['non soumise à VIES'],
    fautif: ['reconnu par VIES'], juste: ['non soumise à VIES'] },
  { nom: '« à la signature » écrit par Opus', re: /à la signature/iu, fautif: ['payé à la signature'], juste: ['signature'] },
  { nom: '« ml », « 0 % », « TVA 0 »', re: /(?<![\p{L}])ml(?![\p{L}])|(?<![\d,])0[  ]?%|TVA[  ]0(?![\d,])/iu,
    fautif: ['12 ml', `0${NS}%`, 'TVA 0'], juste: [`10${NS}%`, `5,5${NS}%`, 'TVA 20'] },
  { nom: '« undefined », « null », « NaN », « [object Object] »', re: /(?<![\p{L}])(undefined|null|NaN)(?![\p{L}])|\[object Object\]/u,
    fautif: ['undefined', 'Tél. null', 'NaN €', '[object Object]'], juste: ['nulle'] },
];
const DATE = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/;
/* Une date ne s'imprime que dans deux champs fermés : la source de
   l'identité (`maj_insee`, `verifie_le`, la date d'une preuve de TVA), et le
   marqueur d'une assurance échue (D8). */
const dateAutorisee = (chemin, texte) => chemin === 'emetteur.source' || texte.startsWith('[à compléter : la nouvelle attestation de votre ');
const juger = (regle, texte) => regle.re.test((regle.retirer || []).reduce((t, r) => t.split(r).join(''), texte));
{
  /* La contre-épreuve d'abord : une règle qui ne refuse rien ne garde rien,
     et une règle qui refuse la sortie juste serait affaiblie un jour. */
  const mortes = REGLES.filter((r) => !r.fautif.every((t) => juger(r, t)) || r.juste.some((t) => juger(r, t))).map((r) => r.nom);
  verifier('B.14 contre-épreuve : chaque règle refuse ses exemples fautifs et laisse passer ses exemples justes', mortes.length === 0
    && DATE.test('le 01/02/2026') && !DATE.test('C-42'), mortes.join(' | '));

  /* LA COMPOSITION SUR CHAQUE CODE DE `FORMES_JURIDIQUES` — une
     énumération, pas un échantillon. */
  const parForme = Object.keys(FORMES_JURIDIQUES).map((code) => {
    const c = cas(`forme ${code}`, { entreprise: { ...ENT, forme_juridique: code, est_ei: null, denomination: 'ENTREPRISE TÉMOIN' },
      emetteur: { ...EM, denomination_ei: 'Jean Témoin EI' } });
    return { code, c, r: resultat(c) };
  });
  const formesEnEchec = parForme.filter(({ r }) => !r.document).map(({ code, r }) => `${code} : ${r.leve || r.documentLeve || JSON.stringify(r.refus)}`);
  verifier(`B.14 la composition passe sur les ${parForme.length} codes de FORMES_JURIDIQUES`, formesEnEchec.length === 0,
    formesEnEchec.slice(0, 5).join(' | '));
  const artisan = REGLES[0];
  const fautesFormes = parForme.filter(({ code, r }) => r.document && texteDeLaPage(r.document).some(({ texte }) => {
    const t = masquer(texte, saisiesDe(r.instantane));
    return ['5453', '5553', '5653'].includes(code) ? juger(artisan, t) : artisan.re.test(t);
  })).map(({ code }) => code);
  verifier('B.14 sur des entrées NEUTRES, « artisan » ne vient que des trois formes de l’INSEE (5453, 5553, 5653)', fautesFormes.length === 0
    && parForme.filter(({ code, r }) => ['5453', '5553', '5653'].includes(code)
      && texteDeLaPage(r.document).some(({ texte }) => artisan.re.test(texte))).length === 3, fautesFormes.join(', '));

  /* Les mots, sur le TEXTE de tous les documents. */
  const tous = [...DOCS_A, ...DOCS_REMISE, ...parForme.filter(({ r }) => r.document).map(({ c, r }) => ({ c, i: r.instantane, d: r.document }))];
  const fautes = [];
  for (const doc of tous) {
    const nom = doc.c ? doc.c.nom : `cas-remise ${doc.k.n}`;
    const saisies = saisiesDe(doc.i);
    for (const { chemin, texte } of texteDeLaPage(doc.d)) {
      const t = masquer(texte, saisies);
      REGLES.forEach((r) => { if (juger(r, t)) fautes.push(`${nom} : ${r.nom} dans ${chemin} « ${texte} »`); });
      if (DATE.test(t) && !dateAutorisee(chemin, texte)) fautes.push(`${nom} : une date dans ${chemin} « ${texte} »`);
    }
  }
  verifier(`B.14 sur ${tous.length} documents, aucune règle des mots ne rougit (exceptions fermées)`, fautes.length === 0,
    fautes.slice(0, 6).join(' | '));

  /* Les entrées qui disent « artisan » ressortent INTACTES. */
  const { d } = docDe('des entrées qui disent « artisan »');
  const textes = texteDeLaPage(d).map((x) => x.texte);
  const intactes = ['Pose artisanale de tomettes', 'Objet : Travaux d’artisan', 'Délai d’exécution : Selon l’artisan, avant le 12/12/2026',
    'Nom commercial : L’Artisan du carrelage', 'Modalités d’exécution : Main d’œuvre artisanale, paiement à la signature.']
    .filter((t) => !textes.includes(t));
  verifier('B.14 des entrées qui contiennent « artisan » ressortent intactes (Q1)', intactes.length === 0
    && textes.some((t) => t.startsWith('ARTISANS DU BATI — SARL coopérative artisanale')), intactes.join(' | '));

  /* Les chaînes LITTÉRALES de la composition, commentaires retirés : les
     mêmes règles (les dates mises à part : aucune n'y est écrite). */
  const code = sansCommentaires(lire('src/lib/document-devis.js'));
  /* Le code entre `${…}` d'un gabarit n'est pas du texte : il part. */
  const sansExpressions = (t) => {
    let r = '';
    for (let k = 0, prof = 0; k < t.length; k += 1) {
      if (prof === 0 && t[k] === '$' && t[k + 1] === '{') { prof = 1; k += 1; r += '◆'; continue; }
      if (prof > 0) { if (t[k] === '{') prof += 1; else if (t[k] === '}') prof -= 1; continue; }
      r += t[k];
    }
    return r;
  };
  const litteraux = [...code.matchAll(/'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)]
    .map((m) => (m[1] != null ? m[1] : sansExpressions(m[2] ?? '')));
  const fautesCode = litteraux.flatMap((t) => REGLES.filter((r) => juger(r, t)).map((r) => `${r.nom} : « ${t} »`));
  verifier(`B.14 les ${litteraux.length} chaînes littérales de document-devis.js passent les mêmes règles`, fautesCode.length === 0
    && litteraux.length > 40, fautesCode.join(' | '));
}


/* ================================================================== */
/*  C. LE GABARIT HTML                                                  */
/* ================================================================== */

/* LES LISTES POSITIVES (§4.4), écrites ICI et pas lues dans le gabarit : un
   oracle qui serait le code ne garderait rien (K11). */
const ELEMENTS_PERMIS = ['html', 'head', 'meta', 'title', 'style', 'body', 'div', 'span', 'p', 'table', 'thead', 'tbody', 'tr', 'th',
  'td', 'svg', 'rect', 'polygon'];
const ATTRIBUTS_PERMIS = {
  '*': ['class', 'aria-hidden'],
  html: ['lang'],
  meta: ['charset'],
  svg: ['xmlns', 'viewbox', 'width', 'height', 'preserveaspectratio'],
  rect: ['x', 'y', 'width', 'height', 'fill'],
  polygon: ['points', 'fill'],
};
const XMLNS_SVG = 'http://www.w3.org/2000/svg';
const PALETTE_ATTENDUE = { encre: '#1A1B19', gris: '#6A665C', filet: '#CFC9BB', orangeLire: '#B14212', orangeBande: '#E85C1F' };
const PROPRIETES_PERMISES = ['font-family', 'font-size', 'font-weight', 'font-style', 'font-variant-numeric', 'font-feature-settings',
  'line-height', 'color', 'text-align', 'text-transform', 'letter-spacing', 'white-space', 'overflow-wrap', 'word-break', 'hyphens',
  '-webkit-text-size-adjust', 'width', 'min-width', 'max-width', 'vertical-align', 'display', 'table-layout', 'border-collapse',
  'border-spacing', 'box-sizing', 'visibility', 'position', 'left', 'right', 'top', 'bottom', 'break-inside', 'page-break-inside',
  'break-before', 'page-break-before', 'break-after', 'page-break-after', 'orphans', 'widows'];
const proprietePermise = (p) => PROPRIETES_PERMISES.includes(p) || /^(margin|padding)(-(top|right|bottom|left))?$/.test(p)
  || /^border(-(top|right|bottom|left))?(-(width|style|color))?$/.test(p);
/* Les mots-clés permis, propriété par propriété ; une propriété absente n'en
   permet aucun. */
const MOTS_CLES = {
  display: ['block', 'inline', 'inline-block', 'table', 'table-row', 'table-cell', 'none'],
  position: ['relative', 'absolute'],
  hyphens: ['manual'],
  visibility: ['hidden', 'visible'],
  'border-collapse': ['collapse', 'separate'],
  'table-layout': ['fixed', 'auto'],
  'white-space': ['nowrap', 'normal'],
  'text-align': ['left', 'right', 'center'],
  'vertical-align': ['top', 'bottom', 'middle', 'baseline'],
  'overflow-wrap': ['anywhere', 'normal', 'break-word'],
  'word-break': ['normal'],
  'font-style': ['normal'],
  'font-variant-numeric': ['tabular-nums'],
  'text-transform': ['none'],
  'box-sizing': ['border-box', 'content-box'],
};
['break-inside', 'page-break-inside', 'break-before', 'page-break-before', 'break-after', 'page-break-after']
  .forEach((p) => { MOTS_CLES[p] = ['avoid', 'auto']; });
const NOMBRES_SANS_UNITE = ['line-height', 'font-weight', 'orphans', 'widows'];
const UNITES_PERMISES = ['pt', 'mm', 'em'];

/* LE CSS, LU PAR JETONS (K14) : un échappement, un commentaire, une
   fonction, un `!` se voient comme des jetons — pas une expression qui lit
   une règle « comme on l'a écrite ». */
function jetonsCss(css, fautes) {
  const j = [];
  let k = 0;
  while (k < css.length) {
    const c = css[k];
    const reste = css.slice(k);
    if (/\s/.test(c)) { k += 1; continue; }
    if (c === '\\') { fautes.push('un échappement « \\ »'); k += 1; continue; }
    if (reste.startsWith('/*')) {
      fautes.push('un commentaire « /* »');
      const f = css.indexOf('*/', k + 2);
      k = f < 0 ? css.length : f + 2;
      continue;
    }
    if (c === '"' || c === '\'') {
      const f = css.indexOf(c, k + 1);
      if (f < 0) { fautes.push('une chaîne jamais fermée'); break; }
      j.push({ t: 'chaine', v: css.slice(k + 1, f) });
      k = f + 1;
      continue;
    }
    const nb = /^[+-]?(?:\d+\.?\d*|\.\d+)/.exec(reste);
    if (nb) {
      k += nb[0].length;
      const u = /^(%|[A-Za-z_][A-Za-z0-9_-]*)/.exec(css.slice(k));
      if (u) k += u[0].length;
      j.push({ t: u ? (u[0] === '%' ? 'pourcent' : 'dimension') : 'nombre', n: Number(nb[0]), u: u && u[0] !== '%' ? u[0] : null,
        v: `${nb[0]}${u ? u[0] : ''}` });
      continue;
    }
    if (c === '#') {
      const h = /^#[A-Za-z0-9_-]+/.exec(reste);
      if (h) { j.push({ t: 'diese', v: h[0] }); k += h[0].length; continue; }
    }
    if (c === '@') {
      const a = /^@-?[A-Za-z_][A-Za-z0-9_-]*/.exec(reste);
      if (a) { j.push({ t: 'arobase', v: a[0].slice(1) }); k += a[0].length; continue; }
    }
    const id = /^-{0,2}[A-Za-z_\u0080-￿][A-Za-z0-9_\-\u0080-￿]*/.exec(reste);
    if (id) {
      k += id[0].length;
      if (css[k] === '(') {
        if (id[0].toLowerCase() === 'url') {
          const f = css.indexOf(')', k);
          if (f < 0) { fautes.push('une adresse jamais fermée'); break; }
          j.push({ t: 'url', v: css.slice(k + 1, f) });
          k = f + 1;
        } else {
          j.push({ t: 'fonction', v: id[0] });
          k += 1;
        }
        continue;
      }
      j.push({ t: 'ident', v: id[0] });
      continue;
    }
    if ('{}:;,().*>+~[]=!/|$^'.includes(c)) { j.push({ t: 'delim', v: c }); k += 1; continue; }
    fautes.push(`un caractère inattendu « ${c} »`);
    k += 1;
  }
  return j;
}
const estDelim = (x, v) => x && x.t === 'delim' && x.v === v;
function reglesCss(css) {
  const fautes = [];
  const j = jetonsCss(css, fautes);
  const regles = [];
  let k = 0;
  const bloc = () => {
    const decl = [];
    while (k < j.length && !estDelim(j[k], '}')) {
      const nom = j[k];
      if (estDelim(nom, '{')) { fautes.push('un bloc dans un bloc'); k += 1; continue; }
      if (!nom || nom.t !== 'ident') { fautes.push(`une déclaration illisible (« ${nom && nom.v} »)`); k += 1; continue; }
      k += 1;
      if (!estDelim(j[k], ':')) { fautes.push(`« ${nom.v} » sans « : »`); continue; }
      k += 1;
      const valeur = [];
      while (k < j.length && !estDelim(j[k], ';') && !estDelim(j[k], '}')) {
        if (estDelim(j[k], '{')) fautes.push('un « { » dans une valeur');
        valeur.push(j[k]);
        k += 1;
      }
      if (estDelim(j[k], ';')) k += 1;
      decl.push({ propriete: nom.v, valeur });
    }
    k += 1;
    return decl;
  };
  while (k < j.length) {
    const prelude = [];
    while (k < j.length && !estDelim(j[k], '{') && !estDelim(j[k], ';')) { prelude.push(j[k]); k += 1; }
    if (k >= j.length) { if (prelude.length) fautes.push('une règle sans bloc'); break; }
    if (estDelim(j[k], ';')) { fautes.push(`une instruction sans bloc (« ${prelude.map((x) => x.v).join(' ')} »)`); k += 1; continue; }
    k += 1;
    regles.push({ prelude, declarations: bloc() });
  }
  return { regles, fautes };
}
const texteValeur = (v) => v.map((x) => x.v).join(' ');
/* Les sélecteurs d'une règle : des éléments permis, des classes, des
   virgules — rien d'autre (ni « : », ni « [ », ni « * », ni « > »). */
function selecteurs(prelude, fautes) {
  const liste = [[]];
  for (let k = 0; k < prelude.length; k += 1) {
    const x = prelude[k];
    if (estDelim(x, ',')) { liste.push([]); continue; }
    if (estDelim(x, '.') && prelude[k + 1] && prelude[k + 1].t === 'ident') { liste[liste.length - 1].push(`.${prelude[k + 1].v}`); k += 1; continue; }
    if (x.t === 'ident' && ELEMENTS_PERMIS.includes(x.v)) { liste[liste.length - 1].push(x.v); continue; }
    fautes.push(`un sélecteur hors de la liste (« ${x.v} »)`);
  }
  return liste.map((s) => s.join(' '));
}
/* LA FEUILLE DE STYLE, jugée. → { fautes, faces, regles } */
function jugerCss(css) {
  const { regles, fautes } = reglesCss(css);
  const faces = [];
  let pages = 0;
  const parSelecteur = {};
  for (const r of regles) {
    const tete = r.prelude[0];
    if (tete && tete.t === 'arobase') {
      if (r.prelude.length !== 1) fautes.push(`@${tete.v} suivi d’autre chose`);
      if (tete.v === 'page') {
        pages += 1;
        if (r.declarations.length !== 1 || r.declarations[0].propriete !== 'size' || texteValeur(r.declarations[0].valeur) !== '210mm 297mm') {
          fautes.push(`@page n’est pas exactement « size: 210mm 297mm » (${r.declarations.map((d) => d.propriete).join(', ')})`);
        }
      } else if (tete.v === 'font-face') {
        const props = r.declarations.map((d) => d.propriete).sort();
        if (!egal(props, ['font-display', 'font-family', 'font-style', 'font-weight', 'src'])) fautes.push(`@font-face : ${props.join(', ')}`);
        const val = (p) => (r.declarations.find((d) => d.propriete === p) || { valeur: [] }).valeur;
        const src = val('src');
        const PREFIXE = 'data:font/woff2;base64,';
        if (src.length !== 1 || src[0].t !== 'url' || !src[0].v.startsWith(PREFIXE)) {
          fautes.push(`@font-face : la source n’est pas UNE adresse data:font/woff2 (« ${texteValeur(src).slice(0, 60)} »)`);
        } else {
          const b64 = src[0].v.slice(PREFIXE.length);
          if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || b64.length > 1000000) fautes.push('@font-face : base64 illisible ou au-delà de 1 Mo');
          faces.push({ famille: texteValeur(val('font-family')), graisse: texteValeur(val('font-weight')), b64 });
        }
        if (texteValeur(val('font-display')) !== 'swap' || texteValeur(val('font-style')) !== 'normal') fautes.push('@font-face : swap et normal');
      } else fautes.push(`@${tete.v} refusé`);
      continue;
    }
    const sel = selecteurs(r.prelude, fautes);
    sel.forEach((s) => { parSelecteur[s] = [...(parSelecteur[s] || []), ...r.declarations]; });
    const vus = {};
    for (const d of r.declarations) {
      const p = d.propriete;
      vus[p] = texteValeur(d.valeur);
      if (/[A-Z]/.test(p)) { fautes.push(`une propriété en majuscules (« ${p} »)`); continue; }
      if (!proprietePermise(p)) { fautes.push(`la propriété « ${p} » n’est pas permise`); continue; }
      for (const x of d.valeur) {
        if (estDelim(x, '!')) fautes.push(`« !important » (${p})`);
        else if (x.t === 'fonction') fautes.push(`la fonction « ${x.v}( » (${p})`);
        else if (x.t === 'url') fautes.push(`une adresse hors d’un @font-face (${p})`);
        else if (x.t === 'dimension' && !UNITES_PERMISES.includes(x.u)) fautes.push(`l’unité « ${x.u} » (${p})`);
        else if (x.t === 'nombre' && x.n !== 0 && !NOMBRES_SANS_UNITE.includes(p)) fautes.push(`un nombre sans unité (${p}: ${x.v})`);
        else if (x.t === 'pourcent' && !['width', 'min-width', 'max-width', '-webkit-text-size-adjust'].includes(p)) fautes.push(`un % (${p})`);
        else if (x.t === 'diese' && !Object.values(PALETTE_ATTENDUE).includes(x.v.toUpperCase())) fautes.push(`la couleur ${x.v} (${p})`);
        else if (x.t === 'chaine' && p !== 'font-family') fautes.push(`une chaîne (${p})`);
        else if (x.t === 'delim' && !(estDelim(x, ',') && p === 'font-family')) fautes.push(`« ${x.v} » (${p})`);
        else if (x.t === 'arobase') fautes.push(`@${x.v} dans une valeur`);
        else if (x.t === 'ident') {
          const permis = p === 'font-family' || (MOTS_CLES[p] || []).includes(x.v)
            || (/^margin/.test(p) && x.v === 'auto') || (/^border/.test(p) && ['solid', 'none'].includes(x.v));
          if (!permis) fautes.push(`« ${p}: ${x.v} »`);
        }
      }
      if (p === 'font-family' && /Oswald/.test(vus[p]) && !sel.every((s) => CLASSES_EN_OSWALD.map((c) => `.${c}`).includes(s))) {
        fautes.push(`Oswald sur « ${sel.join(', ')} » (des libellés fixes seulement)`);
      }
    }
    /* Chaque `break-*` avec son jumeau `page-break-*`, de même valeur. */
    for (const cote of ['inside', 'before', 'after']) {
      if ((`break-${cote}` in vus) !== (`page-break-${cote}` in vus) || vus[`break-${cote}`] !== vus[`page-break-${cote}`]) {
        if ((`break-${cote}` in vus) || (`page-break-${cote}` in vus)) fautes.push(`break-${cote} sans son jumeau (${sel.join(', ')})`);
      }
    }
  }
  if (pages !== 1) fautes.push(`${pages} règles @page (une exigée)`);
  const decl = (s, p) => (parSelecteur[s] || []).filter((d) => d.propriete === p).map((d) => texteValeur(d.valeur));
  if (!egal(decl('html', 'margin'), ['0']) || !egal(decl('html', 'padding'), ['0']) || !egal(decl('body', 'margin'), ['0'])
    || !egal(decl('body', 'padding'), ['0'])) fautes.push('« html, body { margin: 0; padding: 0 } » manque (T14)');
  if (!decl('.bande', 'display').includes('block')) fautes.push('la bande (SVG) sans display: block (T14)');
  if (!egal(decl('.gabarit', 'visibility'), ['hidden'])) fautes.push('le gabarit du rang n’est pas caché');
  if (!egal(decl('.points', 'position'), ['absolute']) || !egal(decl('.rang', 'position'), ['relative'])) fautes.push('le rang n’est pas posé (§4.6)');
  return { fautes, faces, regles };
}

/* LE HTML, LU PAR ÉLÉMENTS ET ATTRIBUTS (la casse ignorée) : un arbre. */
const ENTITES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\'' };
function lireHtml(html) {
  const fautes = [];
  const racine = { nom: '#racine', attributs: [], enfants: [], parent: null };
  let courant = racine;
  let k = 0;
  const DOCTYPE = '<!doctype html>';
  if (html.startsWith(DOCTYPE)) k = DOCTYPE.length; else fautes.push('le doctype manque');
  const decoder = (brut) => {
    if (/>/.test(brut)) fautes.push(`« > » brut dans un texte (« ${brut.slice(0, 50)} »)`);
    return brut.split(/(&[^;\s<]*;?)/).map((m) => {
      if (!m.startsWith('&')) return m;
      if (m in ENTITES) return ENTITES[m];
      fautes.push(`une entité inconnue (« ${m} »)`);
      return m;
    }).join('');
  };
  while (k < html.length) {
    const lt = html.indexOf('<', k);
    const brut = html.slice(k, lt < 0 ? html.length : lt);
    if (brut) courant.enfants.push({ texte: decoder(brut), parent: courant });
    if (lt < 0) break;
    const reste = html.slice(lt);
    const m = /^<(\/?)([A-Za-z][A-Za-z0-9-]*)((?:\s+[^\s="'<>/]+(?:="[^"<>]*")?)*)\s*>/.exec(reste);
    if (!m) { fautes.push(`une balise illisible (« ${reste.slice(0, 40)} »)`); k = lt + 1; continue; }
    k = lt + m[0].length;
    const nom = m[2].toLowerCase();
    if (m[1]) {
      if (courant.nom !== nom) fautes.push(`</${nom}> ferme <${courant.nom}>`);
      else courant = courant.parent;
      continue;
    }
    const attributs = [...m[3].matchAll(/\s+([^\s="'<>/]+)(?:="([^"<>]*)")?/g)].map((a) => [a[1], a[2] == null ? null : a[2]]);
    const el = { nom, attributs, enfants: [], parent: courant };
    courant.enfants.push(el);
    if (nom === 'style') {
      const fin = html.toLowerCase().indexOf('</style>', k);
      if (fin < 0) { fautes.push('<style> jamais fermé'); break; }
      el.css = html.slice(k, fin);
      k = fin + '</style>'.length;
      continue;
    }
    if (nom !== 'meta') courant = el;
  }
  if (courant !== racine) fautes.push(`<${courant.nom}> jamais fermé`);
  return { racine, fautes };
}
const parcourir = (n, f) => { f(n); (n.enfants || []).forEach((e) => parcourir(e, f)); };
const classesDe = (el) => ((el.attributs || []).find(([a]) => a.toLowerCase() === 'class') || [null, ''])[1].split(/\s+/).filter(Boolean);
const aLaClasse = (el, c) => !!el.nom && classesDe(el).includes(c);
const texteDe = (n) => (n.texte != null ? n.texte : (n.enfants || []).map(texteDe).join(''));
const ancetres = (n) => { const a = []; for (let p = n.parent; p; p = p.parent) a.push(p); return a; };
/* Le HTML jugé : éléments, attributs, feuille de style. */
function jugerHtml(html) {
  const { racine, fautes } = lireHtml(html);
  let css = null;
  const elements = [];
  parcourir(racine, (n) => { if (n.nom && n.nom !== '#racine') elements.push(n); });
  for (const el of elements) {
    if (!ELEMENTS_PERMIS.includes(el.nom)) { fautes.push(`l’élément <${el.nom}>`); continue; }
    const permis = [...ATTRIBUTS_PERMIS['*'], ...(ATTRIBUTS_PERMIS[el.nom] || [])];
    for (const [a, v] of el.attributs) {
      const al = a.toLowerCase();
      if (!permis.includes(al)) fautes.push(`l’attribut « ${a} » sur <${el.nom}>`);
      if (v == null) fautes.push(`l’attribut « ${a} » sans valeur`);
      if (al === 'xmlns' && v !== XMLNS_SVG) fautes.push(`xmlns « ${v} »`);
      if (al === 'fill' && !Object.values(PALETTE_ATTENDUE).includes(String(v).toUpperCase())) fautes.push(`fill « ${v} »`);
      if (al === 'lang' && v !== 'fr') fautes.push(`lang « ${v} »`);
      if (al === 'charset' && String(v).toLowerCase() !== 'utf-8') fautes.push(`charset « ${v} »`);
    }
    if (el.nom === 'style') {
      if (!el.parent || el.parent.nom !== 'head') fautes.push('un <style> hors de <head>');
      else if (css != null) fautes.push('deux <style>');
      else css = el.css;
    }
  }
  if (css == null) fautes.push('aucun <style>');
  const jugeCss = css == null ? { fautes: [], faces: [], regles: [] } : jugerCss(css);
  fautes.push(...jugeCss.fautes);
  const html0 = elements.find((e) => e.nom === 'html');
  if (!html0 || !html0.attributs.some(([a, v]) => a === 'lang' && v === 'fr')) fautes.push('<html lang="fr"> manque');
  const titre = elements.find((e) => e.nom === 'title');
  if (!titre || texteDe(titre) !== 'Aperçu du devis') fautes.push('<title>Aperçu du devis</title> manque');
  return { racine, fautes, faces: jugeCss.faces, elements };
}
/* Les nœuds de texte du CORPS, dans l'ordre. */
function textesDuCorps(racine) {
  const corps = [];
  parcourir(racine, (n) => {
    if (n.texte != null && n.parent && ancetres(n).some((a) => a.nom === 'body')) corps.push(n);
  });
  return corps;
}
/* Les chaînes du document que la PAGE imprime : ni les clés de rangement
   (`genre`, `cle`, `ton`), ni ce que l'écran seul lit, ni le numéro (le
   gabarit l'écrit en un morceau, le tampon en pied). */
const NON_IMPRIMES = ['avisEcran', 'marqueursVus', 'numeroAffiche', 'numero.libelle', 'numero.prefixe'];
const textesImprimes = (d) => chaines(d).filter((x) => !NON_IMPRIMES.some((k) => x.chemin === k || x.chemin.startsWith(`${k}[`))
  && !/\.(genre|cle|ton)$/.test(x.chemin)).map((x) => x.texte);

/* Les pages de tous les documents : ceux des cas A, et ceux des 237 cas de
   `cas-remise.json`. */
const PAGES = [...DOCS_A.map((x) => ({ nom: x.c.nom, i: x.i, d: x.d })), ...DOCS_REMISE.map((x) => ({ nom: `cas-remise ${x.k.n}`, i: x.i, d: x.d }))]
  .map((x) => {
    let html = null;
    let leve = null;
    try { html = devisHtml(x.d, POLICES_ESSAI); } catch (e) { leve = e.message; }
    return { ...x, html, leve, juge: html ? jugerHtml(html) : null };
  });

/* Une section qui LÈVE, ou qui ne se termine pas, rougit sous SON numéro :
   un contrôle qui plante ne vérifie rien, et le banc de sabotages relève le
   numéro (K13). Sans le minuteur, une promesse jamais tenue (un verrou jamais
   rendu) ferait sortir node en silence, sans un « ✘ ». */
const DELAI_D_UNE_SECTION = 20000;
const sousGarde = async (numero, f) => {
  let minuteur = null;
  try {
    await Promise.race([f(), new Promise((_, rejeter) => {
      minuteur = setTimeout(() => rejeter(new Error(`ne se termine pas en ${DELAI_D_UNE_SECTION / 1000} s`)), DELAI_D_UNE_SECTION);
    })]);
  } catch (e) {
    verifier(`${numero} s’exécute jusqu’au bout`, false, `lève : ${e && e.message}`);
  } finally {
    clearTimeout(minuteur);
  }
};

section('C.1 Le gabarit n’importe rien (arbre syntaxique)');
/* Les imports et les chargements d'un fichier, lus par l'arbre de
   TypeScript : un commentaire qui NOMME un module ne compte pas, un import
   écrit sur trois lignes se voit. */
function chargementsDe(fichier) {
  const texte = lire(fichier);
  const sf = ts.createSourceFile(fichier, texte, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const vus = [];
  const visiter = (n) => {
    if (ts.isImportDeclaration(n)) vus.push(`import ${n.moduleSpecifier.getText(sf)}`);
    else if (ts.isExportDeclaration(n) && n.moduleSpecifier) vus.push(`export from ${n.moduleSpecifier.getText(sf)}`);
    else if (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword
      || (ts.isIdentifier(n.expression) && n.expression.text === 'require'))) vus.push(`${n.expression.getText(sf)}(${n.arguments.map((a) => a.getText(sf)).join(', ')})`);
    ts.forEachChild(n, visiter);
  };
  visiter(sf);
  return { vus, illisible: Array.isArray(sf.parseDiagnostics) && sf.parseDiagnostics.length > 0 };
}
await sousGarde('C.1', async () => {
  const g = chargementsDe('src/lib/devis-html.js');
  verifier('C.1 devis-html.js : aucun import, aucun require, aucun import()', !g.illisible && g.vus.length === 0, g.vus.join(' | '));
  /* Les autres fichiers de la chaîne : des listes FERMÉES. */
  const attendus = {
    'src/lib/format-a4.js': [],
    'src/lib/tampon-apercu.js': [],
    'src/lib/etapes-apercu.js': [],
    'src/lib/reglages-afficheur.js': [],
    'src/lib/fabrication-apercu.js': ['import \'./format-a4.js\'', 'import \'./tampon-apercu.js\''],
  };
  const ecarts = Object.entries(attendus).map(([f, a]) => {
    const vu = chargementsDe(f);
    return vu.illisible || !egal([...vu.vus].sort(), a) ? `${f} : ${vu.vus.join(', ') || 'rien'}` : null;
  }).filter(Boolean);
  verifier('C.1 format-a4, tampon, séance, réglages de l’afficheur n’importent rien ; la fabrication, le tampon et le format seulement',
    ecarts.length === 0, ecarts.join(' | '));
  /* Ni horloge, ni langue, ni arrondi flottant dans ce qui décide. */
  const interdits = [/\bIntl\b/, /\bDate\.now\b/, /new Date\(/, /\blocaleCompare\b/, /\btoLocale\w*\(/, /\bMath\.round\b/, /\.toFixed\(/,
    /\bparseFloat\b/, /\bprocess\./, /\bsetTimeout\b/, /\bsetInterval\b/, /\bMath\.random\b/];
  const trouves = Object.keys(attendus).concat('src/lib/devis-html.js').flatMap((f) => {
    const c = sansCommentaires(lire(f));
    return interdits.filter((re) => re.test(c)).map((re) => `${f} : ${re}`);
  });
  verifier('C.1 ni horloge, ni minuteur, ni hasard, ni langue, ni arrondi flottant : tout est PASSÉ (maintenant, attendre)',
    trouves.length === 0, trouves.join(' | '));
});

section('C.2 L’échappement');
await sousGarde('C.2', async () => {
  const c = cas('échappement', {
    lignes: [{ designation: '<script>alert(1)</script>' }, { designation: '"onload=alert(2) x=\'y\' & <b>gras</b>' }],
    client: { ...CLIENT_BRUT, nom: '<img src=x onerror=alert(3)>' },
    devis: { objet: 'R&D <style>p{}</style>' },
  });
  const r = resultat(c);
  const html = r.document ? devisHtml(r.document, POLICES_ESSAI) : '';
  const j = html ? jugerHtml(html) : { fautes: ['pas de page'], racine: { enfants: [] } };
  const textes = textesDuCorps(j.racine).map((n) => n.texte);
  verifier('C.2 une désignation « <script>…</script> » et « "onload= » ressortent ÉCHAPPÉES, la page reste juste',
    html.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && !/<script/i.test(html) && !/<img/i.test(html) && html.includes('&quot;onload=')
      && j.fautes.length === 0, j.fautes.slice(0, 4).join(' | '));
  verifier('C.2 …et se relisent INTACTES dans le texte de la page', textes.includes('<script>alert(1)</script>')
    && textes.includes('"onload=alert(2) x=\'y\' & <b>gras</b>') && textes.includes('<img src=x onerror=alert(3)>')
    && textes.includes('Objet : R&D <style>p{}</style>'), JSON.stringify(textes.slice(0, 30)));
  verifier('C.2 echapper(), en littéraux', echapper('<a href="x">&\'</a>') === '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    echapper('<a href="x">&\'</a>'));

  /* CHAQUE CHAMP TAPÉ, ou venu du répertoire, porte son poison (relecture
     « contrôles » du 27/11) : les trois champs d'au-dessus seuls laissaient
     passer une réserve ou le détail d'une ligne écrits SANS `echapper`, et
     la page de ce cas restait identique à l'octet. Chaque poison est
     numéroté : on sait lequel a fui. */
  let rang = 0;
  const poison = () => { rang += 1; return `P${String(rang).padStart(2, '0')}<b>x</b>"onload=y' &`; };
  const ligneP = (type, o = {}) => ({ type, designation: poison(), ...(type === 'poste' || type === 'option' ? {} : {
    quantite_milliemes: null, unite: null, prix_unitaire_centimes: null, taux_tva_centiemes: null, total_centimes: null }), ...o });
  const cp = cas('échappement, chaque champ', {
    lignes: [ligneP('zone'), ligneP('piece'), ligneP('poste'), ligneP('option', { total_centimes: 45000 }), ligneP('reserve')],
    client: { ...CLIENT_BRUT, nom: poison(), adresse: poison(), code_postal: poison(), ville: poison() },
    devis: { objet: poison(), lieu_adresse: poison(), lieu_code_postal: poison(), lieu_ville: poison(), delai_execution: poison() },
    entreprise: { ...ENT, est_ei: true, est_siege: false, denomination: poison(), nom_commercial: poison(), adresse: poison(),
      commune: poison(), code_postal: poison() },
    emetteur: { ...EM, denomination_ei: poison(), greffe_ville: poison(), etablissement_adresse: poison(), etablissement_code_postal: poison(),
      etablissement_ville: poison(), siege_adresse: poison(), siege_code_postal: poison(), siege_ville: poison(), telephone: poison(),
      email: poison(), mediateur_nom: poison(), mediateur_adresse: poison(), mediateur_site: poison(), garantie_legale_texte: poison(),
      garantie_commerciale_texte: poison(), sav_texte: poison(), modalites_paiement_texte: poison(), modalites_execution_texte: poison(),
      reclamations_texte: poison() },
    assurances: [{ ...DECENNALE_VALABLE, nature: 'autre', libelle: poison(), assureur_nom: poison(), assureur_coordonnees: poison(),
      couverture: poison(), numero_contrat: poison() }],
    tarifs: { ...TARIFS_35, frais_deplacement_texte: poison() },
  });
  const poisons = Array.from({ length: rang }, (_, k) => `P${String(k + 1).padStart(2, '0')}<b>x</b>"onload=y' &`);
  const rp = resultat(cp);
  const htmlP = rp.document ? devisHtml(rp.document, POLICES_ESSAI) : '';
  const jp = htmlP ? jugerHtml(htmlP) : { fautes: ['pas de page'], racine: { enfants: [] } };
  const textesP = textesDuCorps(jp.racine).map((n) => n.texte);
  const portes = poisons.filter((x) => texteDeLaPage(rp.document || {}).some(({ texte }) => texte.includes(x)));
  const perdus = portes.filter((x) => !textesP.some((y) => y.includes(x)));
  verifier(`C.2 ${portes.length} champs empoisonnés que la page imprime (sur ${poisons.length}) : aucun élément ni attribut né d’un champ, `
    + 'la page dans ses listes positives, chaque texte relu INTACT', portes.length >= 35 && !/<b>/.test(htmlP) && !/<b /.test(htmlP)
    && jp.fautes.length === 0 && perdus.length === 0,
  `${jp.fautes.slice(0, 3).join(' | ')} ${perdus.join(', ')} — non imprimés : ${poisons.filter((x) => !portes.includes(x)).map((x) => x.slice(0, 3)).join(', ')}`);

  /* …ET LE GABARIT, SEUL, sur CHAQUE chaîne du document (le banc des
     corrections du 27/11) : le détail d'une ligne n'est fait que de nombres
     et d'unités, aucun champ tapé n'y passe — son `echapper` retiré, la
     vérification d'au-dessus restait verte. Chaque chaîne du document
     composé reçoit donc le poison, sauf ce qui est STRUCTURE (`genre`,
     `ton`, `cle`, le numéro) ; la page doit le rendre échappé, et le relire
     intact. */
  const STRUCTURE = new Set(['genre', 'ton', 'cle']);
  const POISON = '<b>x</b>"onload=y\' &';
  const empoisonne = [];
  const empoisonner = (v, chemin) => {
    if (typeof v === 'string') {
      const cle = chemin.split('.').pop().replace(/\[\d+\]$/, '');
      if (STRUCTURE.has(cle) || chemin.startsWith('numero') || HORS_DE_LA_PAGE.some((k) => chemin.startsWith(k))) return v;
      empoisonne.push(`${v}${POISON}`);
      return `${v}${POISON}`;
    }
    if (Array.isArray(v)) return v.map((x, k) => empoisonner(x, `${chemin}[${k}]`));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, empoisonner(x, chemin ? `${chemin}.${k}` : k)]));
    return v;
  };
  const docRiche = docDe('payant, réduction, acompte, arrhes, retenue, options').d;
  const htmlG = devisHtml(empoisonner(docRiche, ''), POLICES_ESSAI);
  const jg = jugerHtml(htmlG);
  const textesG = textesDuCorps(jg.racine).map((n) => n.texte);
  const perdusG = empoisonne.filter((x) => !textesG.some((y) => y.includes(x)));
  verifier(`C.2 le GABARIT échappe chacune des ${empoisonne.length} chaînes du document (le détail d’une ligne compris) : aucun élément `
    + 'né d’une chaîne, chacune relue intacte', empoisonne.length >= 40 && !/<b[ >]/.test(htmlG) && jg.fautes.length === 0 && perdusG.length === 0,
  `${jg.fautes.slice(0, 3).join(' | ')} ${perdusG.slice(0, 4).join(' | ')}`);
});

section('C.3 et C.4 Les éléments, les attributs, et le CSS lu par jetons (listes positives)');
await sousGarde('C.3', async () => {
  const leves = PAGES.filter((x) => x.leve).map((x) => `${x.nom} : ${x.leve}`);
  verifier(`C.3 les ${PAGES.length} pages se composent (cas A et cas-remise)`, leves.length === 0, leves.slice(0, 4).join(' | '));
  const fautes = PAGES.filter((x) => x.juge && x.juge.fautes.length).map((x) => `${x.nom} : ${x.juge.fautes.slice(0, 3).join(' ; ')}`);
  verifier(`C.3 C.4 sur les ${PAGES.length} pages : éléments, attributs, CSS — tout dans les listes positives`, fautes.length === 0,
    fautes.slice(0, 4).join(' | '));
  /* LA CONTRE-ÉPREUVE : chaque forme refusée, glissée dans une vraie page,
     est vue ; la page juste passe (ci-dessus). */
  const base = PAGES[0].html;
  const dansLeCorps = (bout) => base.replace('</body>', `${bout}</body>`);
  const dansLeStyle = (bout) => base.replace('</style>', `\n${bout}</style>`);
  const remplacer = (a, b) => (base.includes(a) ? base.replace(a, b) : `${base}(motif « ${a} » introuvable)`);
  const SABOTS_HTML = [
    ['<script>', dansLeCorps('<script>alert(1)</script>')],
    ['<SCRIPT> en majuscules', dansLeCorps('<SCRIPT>alert(1)</SCRIPT>')],
    ['<a href>', dansLeCorps('<a href="https://exemple.test">x</a>')],
    ['<img>', dansLeCorps('<img src="x">')],
    ['<link>', remplacer('</head>', '<link href="x"></head>')],
    ['<iframe>', dansLeCorps('<iframe></iframe>')],
    ['<foreignObject> dans le SVG', remplacer('</svg>', '<foreignObject></foreignObject></svg>')],
    ['un <style> dans le SVG', remplacer('</svg>', '<style>p{}</style></svg>')],
    ['un attribut style=', dansLeCorps('<p style="color: #1A1B19">x</p>')],
    ['un attribut onclick=', dansLeCorps('<p onclick="x">x</p>')],
    ['un attribut entre apostrophes', dansLeCorps('<p class=\'x\'>x</p>')],
    ['un commentaire HTML', dansLeCorps('<!-- x -->')],
    ['un xmlns étranger', remplacer(`xmlns="${XMLNS_SVG}"`, 'xmlns="https://exemple.test/svg"')],
    ['un fill hors palette', remplacer('fill="#E85C1F"', 'fill="#FF0000"')],
    ['une entité inconnue', dansLeCorps('<p>&nbsp;</p>')],
    ['un « > » brut', dansLeCorps('<p>a > b</p>')],
  ];
  const SABOTS_CSS = [
    ['position: fixed', dansLeStyle('.x { position: fixed; }')],
    ['p\\osition: fixed', dansLeStyle('.x { p\\osition: fixed; }')],
    ['var()', dansLeStyle('.x { --p: fixed; position: var(--p); }')],
    ['@media', dansLeStyle('@media print { .x { display: none; } }')],
    ['@supports', dansLeStyle('@supports (display: grid) { .x { display: block; } }')],
    ['@import', dansLeStyle('@import url(x.css);')],
    ['margin dans @page', remplacer('@page { size: 210mm 297mm; }', '@page { size: 210mm 297mm; margin: 0; }')],
    ['@page retiré', remplacer('@page { size: 210mm 297mm; }', '')],
    ['une taille en px', dansLeStyle('.x { width: 10px; }')],
    ['une hauteur en vh', dansLeStyle('.x { width: 10vh; }')],
    ['!important', dansLeStyle('.x { display: block !important; }')],
    ['background-color', dansLeStyle('.x { background-color: #1A1B19; }')],
    ['background (une image)', dansLeStyle('.x { background: url(https://exemple.test/a.png); }')],
    ['hyphens: auto', dansLeStyle('.x { hyphens: auto; }')],
    ['html, body sans marge 0', remplacer('html, body { margin: 0; padding: 0; }', 'html, body { padding: 0; }')],
    ['le SVG sans display: block', remplacer('.bande { display: block;', '.bande { display: inline;')],
    ['break-inside sans son jumeau', dansLeStyle('.x { break-inside: avoid; }')],
    ['une couleur hors palette', dansLeStyle('.x { color: #FF0000; }')],
    ['une propriété en majuscules', dansLeStyle('.x { COLOR: #1A1B19; }')],
    ['un commentaire CSS', dansLeStyle('/* x */')],
    ['border-radius', dansLeStyle('.x { border-radius: 2pt; }')],
    ['opacity', dansLeStyle('.x { opacity: 0.5; }')],
    ['transform', dansLeStyle('.x { transform: none; }')],
    ['box-shadow', dansLeStyle('.x { box-shadow: none; }')],
    ['display: flex', dansLeStyle('.x { display: flex; }')],
    ['display: grid', dansLeStyle('.x { display: grid; }')],
    ['counter()', dansLeStyle('.x { content: counter(page); }')],
    ['@top-center', dansLeStyle('@top-center { content: "x"; }')],
    ['::before', dansLeStyle('.x::before { color: #1A1B19; }')],
    ['Oswald sur un nom tapé', dansLeStyle('.titre-zone { font-family: Oswald, sans-serif; }')],
    ['une seconde source de police', remplacer('src: url(data:font/woff2;base64,', 'src: url(https://exemple.test/i.woff2), url(data:font/woff2;base64,')],
    ['la police data: en seconde place', remplacer('src: url(data:font/woff2;base64,SU5URVItNDAw)',
      'src: local(Inter), url(data:font/woff2;base64,SU5URVItNDAw)')],
  ];
  const vus = [...SABOTS_HTML, ...SABOTS_CSS].map(([nom, h]) => ({ nom, fautes: jugerHtml(h).fautes }));
  const passes = vus.filter((x) => x.fautes.length === 0).map((x) => x.nom);
  verifier(`C.3 C.4 contre-épreuve : les ${vus.length} formes refusées, glissées dans une vraie page, sont TOUTES vues`, passes.length === 0,
    passes.join(' | '));
});

section('C.5 La structure : chaque ligne dans un div.ligne ; ce qui ne doit pas se séparer');
await sousGarde('C.5', async () => {
  const fautes = [];
  for (const x of PAGES.filter((p) => p.juge)) {
    const { racine } = x.juge;
    const ordre = [];
    parcourir(racine, (n) => { if (n.nom) ordre.push(n); });
    const lignes = ordre.filter((n) => n.nom === 'div' && aLaClasse(n, 'ligne'));
    const duDocument = [...x.d.decompte.filter((b) => b.genre === 'ligne'), ...(x.d.options ? x.d.options.lignes : [])];
    const designations = lignes.map((l) => {
      const t = l.enfants[0] && aLaClasse(l.enfants[0], 'ligne-texte') ? l.enfants[0] : null;
      return t && t.enfants[0] ? texteDe(t.enfants[0]) : null;
    });
    if (!egal(designations, duDocument.map((l) => l.designation))) fautes.push(`${x.nom} : les div.ligne ≠ les lignes du document`);
    const montants = lignes.map((l) => (l.enfants[1] && aLaClasse(l.enfants[1], 'ligne-montant') ? texteDe(l.enfants[1]) : null));
    if (!egal(montants, duDocument.map((l) => l.total))) fautes.push(`${x.nom} : un total hors de sa ligne`);
    const garde = (n) => ancetres(n).find((a) => a.nom === 'div' && aLaClasse(a, 'garde-ensemble')) || null;
    /* Les totaux avec la DERNIÈRE ligne (ou option) qui les précède. */
    const totaux = ordre.filter((n) => n.nom === 'table' && aLaClasse(n, 'totaux'));
    if (!totaux.length) fautes.push(`${x.nom} : aucune table des totaux`);
    totaux.forEach((t) => {
      const g = garde(t);
      if (!g) fautes.push(`${x.nom} : des totaux hors de tout garde-ensemble`);
      else if (lignes.length && !ancetres(lignes[lignes.length - 1]).includes(g)) fautes.push(`${x.nom} : les totaux séparés de la dernière ligne`);
    });
    /* Chaque titre du détail avec la première ligne qui le suit. */
    const titres = ordre.filter((n) => (n.nom === 'div' && (aLaClasse(n, 'titre-zone') || aLaClasse(n, 'titre-piece')))
      || (n.nom === 'p' && aLaClasse(n, 'titre-section') && texteDe(n) !== x.d.titres.client));
    titres.forEach((t) => {
      const suivante = lignes.find((l) => ordre.indexOf(l) > ordre.indexOf(t));
      if (!suivante) return;
      const g = garde(t);
      if (!g || !ancetres(suivante).includes(g)) fautes.push(`${x.nom} : le titre « ${texteDe(t)} » séparé de sa première ligne`);
    });
  }
  verifier(`C.5 sur ${PAGES.length} pages : une ligne = un div.ligne (désignation, total) ; les totaux avec la dernière ligne ; `
    + 'chaque titre avec la première ligne qui le suit', fautes.length === 0, fautes.slice(0, 5).join(' | '));
  const essai = docDe('payant, réduction').d;
  verifier('C.5 le cas « payant… » a bien une zone, une pièce, des options (sinon la structure n’est pas éprouvée)',
    essai.decompte.some((b) => b.genre === 'zone') && essai.decompte.some((b) => b.genre === 'piece') && !!essai.options, '');
});

section('C.6 Les marques dans le flux');
await sousGarde('C.6', async () => {
  const fautes = [];
  for (const x of PAGES.filter((p) => p.juge)) {
    const blocs = [];
    parcourir(x.juge.racine, (n) => { if (n.nom === 'div' && aLaClasse(n, 'marques')) blocs.push(n); });
    const vues = blocs.length === 1 ? blocs[0].enfants.map(texteDe) : null;
    const attendues = ['APERÇU — ce document n’est pas remis', ...(x.i.statut === 'essai' ? ['Document d’essai — sans valeur'] : []),
      ...(x.i.mode === 'exemple' ? ['Exemple — données inventées'] : [])];
    if (!egal(vues, attendues)) fautes.push(`${x.nom} : ${JSON.stringify(vues)}`);
  }
  verifier('C.6 « APERÇU — ce document n’est pas remis » toujours ; « Document d’essai — sans valeur » dès que le statut vaut essai ; '
    + '« Exemple — données inventées » en mode exemple', fautes.length === 0, fautes.slice(0, 4).join(' | '));
  const societe = PAGES.find((x) => x.nom.startsWith('éditeur en société'));
  const exemple = PAGES.find((x) => x.nom === 'mode exemple');
  verifier('C.6 les cas « éditeur en société » et « mode exemple » sont bien jugés', !!(societe && societe.juge && exemple && exemple.juge), '');
});

section('C.7 Le numéro en attente, par sa STRUCTURE (§4.6)');
await sousGarde('C.7', async () => {
  const fautes = [];
  for (const x of PAGES.filter((p) => p.juge)) {
    const numeros = [];
    parcourir(x.juge.racine, (n) => { if (n.nom === 'p' && aLaClasse(n, 'numero')) numeros.push(n); });
    if (numeros.length !== 1) { fautes.push(`${x.nom} : ${numeros.length} numéros`); continue; }
    const [n] = numeros;
    const [texte, rang, ...reste] = n.enfants;
    const forme = texte && texte.texte === `N° DEV-${x.i.annee}-` && rang && rang.nom === 'span' && aLaClasse(rang, 'rang') && !reste.length
      && rang.enfants.length === 2 && aLaClasse(rang.enfants[0], 'gabarit') && texteDe(rang.enfants[0]) === '0000'
      && rang.enfants[0].enfants.length === 1 && aLaClasse(rang.enfants[1], 'points') && texteDe(rang.enfants[1]) === '····'
      && rang.enfants[1].enfants.length === 1;
    if (!forme) fautes.push(`${x.nom} : ${JSON.stringify(texteDe(n))}`);
    if (x.d.numero.enAttente !== true || 'rang' in x.d.numero) fautes.push(`${x.nom} : le document n’est pas « en attente »`);
    const chiffres = textesDuCorps(x.juge.racine).filter((t) => /DEV-\d{4}-\d/.test(t.texte));
    if (chiffres.length) fautes.push(`${x.nom} : un rang écrit (« ${chiffres[0].texte} »)`);
  }
  verifier('C.7 « N° DEV-2026- », puis span.rang = span.gabarit « 0000 » + span.points « ···· », rien d’autre ; jamais un rang écrit',
    fautes.length === 0 && RANG_GABARIT === '0000', fautes.slice(0, 4).join(' | '));
  const d = DOCS_A[0].d;
  const leve = (doc) => { try { devisHtml(doc, POLICES_ESSAI); return false; } catch { return true; } };
  verifier('C.7 un numéro remis (enAttente faux, ou un rang) ne passe pas par le gabarit : il LÈVE',
    leve({ ...d, numero: { ...d.numero, enAttente: false } }) && leve({ ...d, numero: { ...d.numero, rang: '0001' } })
      && leve({ ...d, numeroAffiche: 'DEV-2025-····' }), '');
});

/* ================================================================== */
/*  LES POLICES ENGENDRÉES, et un VRAI lecteur de WOFF2 (C.8, D)        */
/* ================================================================== */

/* `polices-devis.js` n'est jamais importé en haut d'un fichier (§4.9) :
   ici non plus — il se charge au moment de s'en servir. */
let policesChargees = null;
const chargerPolices = async () => {
  if (!policesChargees) policesChargees = await import(pathToFileURL(path.resolve('src/data/polices-devis.js')).href);
  return policesChargees;
};
const CLES_POLICES = Object.freeze(['inter400', 'inter700', 'oswald600']);
const sha256 = (v) => createHash('sha256').update(typeof v === 'string' ? v : Buffer.from(v)).digest('hex');

/* LE LECTEUR DE WOFF2 (T11) — écrit ici, sans fontTools : un en-tête de 48
   octets, un répertoire de tables dont les longueurs sont en UIntBase128,
   PUIS un seul flux Brotli. `brotliDecompressSync` appelé sur le fichier
   entier échoue : il faut d'abord sauter l'en-tête et le répertoire. Il ne
   détransforme aucune table : il ne lit que `cmap`, `name` et `maxp`, que
   WOFF2 ne transforme jamais. Le générateur lit la même chose par fontTools :
   deux lecteurs indépendants doivent tomber d'accord (D.3). */
const ETIQUETTES_WOFF2 = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep',
  'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC',
  'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx',
  'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
function lireWoff2(octets) {
  const b = Buffer.from(octets);
  const leve = (m) => { throw new Error(`WOFF2 : ${m}`); };
  if (b.length < 48 || b.toString('latin1', 0, 4) !== 'wOF2') leve('pas de signature « wOF2 »');
  const saveur = b.readUInt32BE(4);
  if (saveur === 0x74746366) leve('une collection (ttcf), non attendue');
  if (b.readUInt32BE(8) !== b.length) leve(`longueur annoncée ${b.readUInt32BE(8)}, lue ${b.length}`);
  const nbTables = b.readUInt16BE(12);
  const tailleCompressee = b.readUInt32BE(20);
  let o = 48;
  const b128 = () => {
    let v = 0;
    for (let i = 0; i < 5; i += 1) {
      if (o >= b.length) leve('répertoire coupé');
      const x = b[o];
      o += 1;
      if (i === 0 && x === 0x80) leve('UIntBase128 qui commence par un zéro');
      if (v > 0x1FFFFFF) leve('UIntBase128 qui déborde');
      v = v * 128 + (x & 0x7f);
      if (!(x & 0x80)) return v;
    }
    return leve('UIntBase128 sur plus de cinq octets');
  };
  const tables = [];
  for (let i = 0; i < nbTables; i += 1) {
    const drapeaux = b[o];
    o += 1;
    let etiquette = ETIQUETTES_WOFF2[drapeaux & 0x3f];
    if ((drapeaux & 0x3f) === 0x3f) { etiquette = b.toString('latin1', o, o + 4); o += 4; }
    const version = drapeaux >> 6;
    const origine = b128();
    const transformee = etiquette === 'glyf' || etiquette === 'loca' ? version === 0 : version !== 0;
    tables.push({ etiquette, origine, longueur: transformee ? b128() : origine, transformee });
  }
  if (o + tailleCompressee > b.length) leve('flux compressé coupé');
  const flux = zlib.brotliDecompressSync(b.subarray(o, o + tailleCompressee));
  const attendu = tables.reduce((s, t) => s + t.longueur, 0);
  if (flux.length !== attendu) leve(`un flux de ${flux.length} octets pour des tables de ${attendu}`);
  const parEtiquette = {};
  let d = 0;
  for (const t of tables) {
    parEtiquette[t.etiquette] = { ...t, octets: flux.subarray(d, d + t.longueur) };
    d += t.longueur;
  }
  return { saveur, tables: parEtiquette, etiquettes: tables.map((t) => t.etiquette) };
}
/* Une police SFNT (le TTF d'origine) : douze octets, puis seize par table. */
function lireSfnt(octets) {
  const b = Buffer.from(octets);
  const n = b.readUInt16BE(4);
  const tables = {};
  for (let i = 0; i < n; i += 1) {
    const r = 12 + 16 * i;
    const etiquette = b.toString('latin1', r, r + 4);
    tables[etiquette] = { octets: b.subarray(b.readUInt32BE(r + 8), b.readUInt32BE(r + 8) + b.readUInt32BE(r + 12)) };
  }
  return { saveur: b.readUInt32BE(0), tables };
}
/* LES CARACTÈRES QU'UNE CMAP PORTE : ceux qui mènent à un glyphe autre que
   le glyphe vide (0), dans les tables Unicode (formats 4 et 12). Le format 4
   se lit EN ENTIER — `idDelta`, `idRangeOffset` —, pas seulement ses
   plages : un caractère d'une plage peut mener au glyphe vide. */
function caracteresDeLaCmap(cmap) {
  const c = Buffer.from(cmap);
  const points = new Set();
  let lues = 0;
  for (let i = 0; i < c.readUInt16BE(2); i += 1) {
    const plateforme = c.readUInt16BE(4 + i * 8);
    const codage = c.readUInt16BE(6 + i * 8);
    const off = c.readUInt32BE(8 + i * 8);
    if (!(plateforme === 0 || (plateforme === 3 && (codage === 1 || codage === 10)))) continue;
    const format = c.readUInt16BE(off);
    lues += 1;
    if (format === 4) {
      const seg2 = c.readUInt16BE(off + 6);
      const fins = off + 14;
      const debuts = fins + seg2 + 2;
      const deltas = debuts + seg2;
      const decalages = deltas + seg2;
      for (let k = 0; k < seg2 / 2; k += 1) {
        const a = c.readUInt16BE(debuts + 2 * k);
        const z = c.readUInt16BE(fins + 2 * k);
        const delta = c.readUInt16BE(deltas + 2 * k);
        const dec = c.readUInt16BE(decalages + 2 * k);
        for (let x = a; x <= z && x !== 0xFFFF; x += 1) {
          let g;
          if (dec === 0) g = (x + delta) & 0xFFFF;
          else {
            const g0 = c.readUInt16BE(decalages + 2 * k + dec + 2 * (x - a));
            g = g0 === 0 ? 0 : (g0 + delta) & 0xFFFF;
          }
          if (g !== 0) points.add(x);
        }
      }
    } else if (format === 12) {
      for (let k = 0; k < c.readUInt32BE(off + 12); k += 1) {
        const r = off + 16 + 12 * k;
        const a = c.readUInt32BE(r);
        const z = c.readUInt32BE(r + 4);
        const g0 = c.readUInt32BE(r + 8);
        for (let x = a; x <= z; x += 1) if (g0 + (x - a) !== 0) points.add(x);
      }
    } else {
      throw new Error(`cmap : le format ${format} n’est pas lu par ce lecteur`);
    }
  }
  if (!lues) throw new Error('cmap : aucune table Unicode');
  return points;
}
/* LES NOMS (plateforme Windows, anglais), en UTF-16 gros-boutiste. */
function nomsDeLaPolice(name) {
  const n = Buffer.from(name);
  const base = n.readUInt16BE(4);
  const noms = {};
  for (let i = 0; i < n.readUInt16BE(2); i += 1) {
    const r = 6 + i * 12;
    const [plateforme, codage, langue, id, longueur, off] = [0, 2, 4, 6, 8, 10].map((x) => n.readUInt16BE(r + x));
    if (plateforme === 3 && (codage === 1 || codage === 10) && langue === 0x409) {
      const o = n.subarray(base + off, base + off + longueur);
      let t = '';
      for (let k = 0; k + 1 < o.length; k += 2) t += String.fromCharCode(o.readUInt16BE(k));
      noms[id] = t;
    }
  }
  return noms;
}
/* « U+0020-007E,U+00A0 » ↔ un ensemble de points de code. */
function depuisPlages(texte) {
  const s = new Set();
  for (const p of String(texte).split(',')) {
    const m = /^U\+([0-9A-F]{4,6})(?:-([0-9A-F]{4,6}))?$/.exec(p.trim());
    if (!m) throw new Error(`une plage illisible : « ${p} »`);
    const a = parseInt(m[1], 16);
    const z = m[2] ? parseInt(m[2], 16) : a;
    for (let c = a; c <= z; c += 1) s.add(c);
  }
  return s;
}
function enPlages(points) {
  const tri = [...new Set(points)].sort((a, b) => a - b);
  const plages = [];
  for (const c of tri) {
    const derniere = plages[plages.length - 1];
    if (derniere && c === derniere[1] + 1) derniere[1] = c; else plages.push([c, c]);
  }
  const hex = (c) => c.toString(16).toUpperCase().padStart(4, '0');
  return plages.map(([a, b]) => (a === b ? `U+${hex(a)}` : `U+${hex(a)}-${hex(b)}`)).join(',');
}
/* Ce que chaque police PORTE, écrit EN TOUTES LETTRES (K11 : l'oracle n'est
   pas le code) — relevé le 27/11 sur les sous-ensembles engendrés. Inter :
   le latin de base, le latin-1, le latin étendu A (sans U+0149, que la police
   n'a pas), les virgules souscrites du roumain, la ponctuation, l'euro, le
   carré blanc (une case à cocher, pour 2c-2). Oswald : le latin de base et le
   latin-1, la ponctuation qu'il a — ni l'espace fine insécable, ni le trait
   d'union insécable, ni le latin étendu : il ne reçoit que des libellés
   fixes. */
const POINTS_ATTENDUS = Object.freeze({
  inter400: 'U+0020-007E,U+00A0-00AC,U+00AE-0148,U+014A-017F,U+0218-021B,U+2010-2027,U+202F-203A,U+20AC,U+2122,U+2212,U+2264-2265,U+25A1',
  inter700: 'U+0020-007E,U+00A0-00AC,U+00AE-0148,U+014A-017F,U+0218-021B,U+2010-2027,U+202F-203A,U+20AC,U+2122,U+2212,U+2264-2265,U+25A1',
  oswald600: 'U+0020-007E,U+00A0-00AC,U+00AE-00FF,U+0152-0153,U+0178,U+2010,U+2013-2014,U+2018-201A,U+201C-201E,U+2020-2022,'
    + 'U+2026,U+2030,U+2032-2033,U+2039-203A,U+20AC,U+2122,U+2212,U+2264-2265',
});
/* Les noms que chaque police doit garder, en toutes lettres : le droit
   d'auteur (0), le nom PostScript (6 : celui qu'un PDF écrit, et que le
   tampon lit pour dire « les polices d'Opus »), l'adresse de la licence
   (14) ; le nom 13 doit citer la licence. */
const NOMS_ATTENDUS = Object.freeze({
  inter400: { 0: 'Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)', 6: 'Inter-Regular', 14: 'https://openfontlicense.org' },
  inter700: { 0: 'Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)', 6: 'Inter-Bold', 14: 'https://openfontlicense.org' },
  oswald600: { 0: 'Copyright 2016 The Oswald Project Authors (https://github.com/googlefonts/OswaldFont)', 6: 'Oswald-SemiBold',
    14: 'https://scripts.sil.org/OFL' },
});
/* Une police engendrée, lue : ses octets, son WOFF2, sa cmap, ses noms. */
async function policesLues() {
  const P = await chargerPolices();
  return Object.fromEntries(CLES_POLICES.map((k) => {
    const octets = Buffer.from(P.POLICES_DEVIS[k], 'base64');
    const w = lireWoff2(octets);
    return [k, { octets, woff2: w, points: caracteresDeLaCmap(w.tables.cmap.octets), noms: nomsDeLaPolice(w.tables.name.octets),
      glyphes: w.tables.maxp.octets.readUInt16BE(4) }];
  }));
}

section('C.8 Les polices, la palette, Oswald');
await sousGarde('C.8', async () => {
  const fautes = [];
  for (const x of PAGES.filter((p) => p.juge)) {
    const f = x.juge.faces.map((y) => `${y.famille} ${y.graisse} ${y.b64}`).sort();
    const attendu = [`Inter 400 ${POLICES_ESSAI.inter400}`, `Inter 700 ${POLICES_ESSAI.inter700}`, `Oswald 600 ${POLICES_ESSAI.oswald600}`].sort();
    if (!egal(f, attendu)) fautes.push(`${x.nom} : ${JSON.stringify(f)}`);
    /* Oswald : des libellés fixes, et rien d'autre. */
    parcourir(x.juge.racine, (n) => {
      if (n.nom && CLASSES_EN_OSWALD.some((c) => aLaClasse(n, c))) {
        const t = texteDe(n);
        if (!['DEVIS', 'Client', 'Détail des travaux', 'Options, non comprises dans le total'].includes(t)) fautes.push(`${x.nom} : « ${t} » en Oswald`);
      }
    });
  }
  verifier('C.8 trois @font-face — Inter 400, Inter 700, Oswald 600 — chacun avec SA police, en seule source ; Oswald ne reçoit '
    + 'que « DEVIS », « Client », « Détail des travaux », « Options, non comprises dans le total »', fautes.length === 0 && egal(CLASSES_EN_OSWALD,
    ['titre-devis', 'titre-section']), fautes.slice(0, 4).join(' | '));
  verifier('C.8 la palette du papier = celle de theme.js (encre, gris, filet, orange à lire, orange de la bande)',
    egal(PALETTE_PAPIER, PALETTE_ATTENDUE) && PALETTE_PAPIER.encre === COULEURS.ink && PALETTE_PAPIER.gris === COULEURS.muted
      && PALETTE_PAPIER.filet === COULEURS.line && PALETTE_PAPIER.orangeLire === COULEURS.accentTexte
      && PALETTE_PAPIER.orangeBande === COULEURS.accent, JSON.stringify(PALETTE_PAPIER));
  const d = DOCS_A[0].d;
  const leve = (p) => { try { devisHtml(d, p); return false; } catch { return true; } };
  verifier('C.8 une police absente, une police qui n’est pas du base64 (une parenthèse qui fermerait l’adresse), une police '
    + 'au-delà de 1 Mo : le gabarit LÈVE', leve(null) && leve({ ...POLICES_ESSAI, oswald600: undefined })
    && leve({ ...POLICES_ESSAI, inter400: 'AAAA) , url(https://exemple.test/x' }) && leve({ ...POLICES_ESSAI, inter700: 'A'.repeat(1000004) })
    && LIMITE_POLICE === 1000000, '');
  /* LES VRAIES POLICES (étape 3) : chaque page composée avec `polices-devis.js`
     passe les mêmes listes positives — le base64 réel ne trompe pas la
     lecture du CSS —, et ses trois @font-face portent EXACTEMENT les trois
     chaînes engendrées, chacune sous la limite. */
  const P = await chargerPolices();
  const lues = await policesLues();
  const fautesVraies = [];
  const attenduVrai = [`Inter 400 ${P.POLICES_DEVIS.inter400}`, `Inter 700 ${P.POLICES_DEVIS.inter700}`,
    `Oswald 600 ${P.POLICES_DEVIS.oswald600}`].sort();
  for (const x of DOCS_A) {
    const html = devisHtml(x.d, P.POLICES_DEVIS);
    const j = jugerHtml(html);
    if (j.fautes.length) fautesVraies.push(`${x.c.nom} : ${j.fautes.slice(0, 2).join(' ; ')}`);
    if (!egal(j.faces.map((y) => `${y.famille} ${y.graisse} ${y.b64}`).sort(), attenduVrai)) {
      fautesVraies.push(`${x.c.nom} : les @font-face ne portent pas les polices engendrées`);
    }
    const adresses = (html.match(/url\(/g) || []).length;
    if (adresses !== 3) fautesVraies.push(`${x.c.nom} : ${adresses} adresses url(…)`);
  }
  verifier(`C.8 avec les VRAIES polices (polices-devis.js) : les ${DOCS_A.length} pages passent les listes positives, et leurs trois `
    + '@font-face portent exactement les trois chaînes engendrées, chacune sous 1 Mo', fautesVraies.length === 0
    && CLES_POLICES.every((k) => P.POLICES_DEVIS[k].length < LIMITE_POLICE), fautesVraies.slice(0, 3).join(' | '));
  /* OSWALD NE REÇOIT QUE CE QU'IL PORTE (K-m8) : chaque caractère de chaque
     texte posé dans une classe en Oswald est dans SA cmap — sinon WebKit
     prendrait, pour ce caractère, une police du téléphone, et la propriété
     des polices resterait verte. Et chaque caractère qu'OPUS écrit sur une
     page est dans celle d'Inter. Ce qui est TAPÉ (une désignation, un nom,
     un délai) peut porter n'importe quoi — une espace idéographique, un
     caractère chinois : WebKit le dessine alors dans une police du
     téléphone, pour ce caractère seulement ; on le retire avant de juger,
     blancs compris (`saisiesDe` ne garde pas une saisie faite de blancs). */
  const nonPortes = (texte, points) => [...String(texte)].filter((ch) => !points.has(ch.codePointAt(0)));
  const retirer = (t, liste) => liste.reduce((x, y) => x.split(y).join(''), t);
  const tapees = (i) => {
    const blanches = chaines({ d: i.devis, l: i.lignes, c: i.client, e: i.emetteur, n: i.entreprise, a: i.assurances, t: i.tarifs })
      .map((x) => x.texte).filter((t) => t.length > 0 && !t.trim());
    return [...saisiesDe(i), ...new Set(blanches)];
  };
  const horsOswald = new Map();
  const horsInter = new Map();
  let enOswald = 0;
  for (const x of PAGES.filter((p) => p.juge)) {
    parcourir(x.juge.racine, (n) => {
      if (n.nom && CLASSES_EN_OSWALD.some((c) => aLaClasse(n, c))) {
        enOswald += 1;
        nonPortes(texteDe(n), lues.oswald600.points).forEach((ch) => horsOswald.set(ch, `${x.nom} : « ${texteDe(n)} »`));
      }
    });
    const saisies = tapees(x.i);
    for (const n of textesDuCorps(x.juge.racine)) {
      nonPortes(retirer(n.texte, saisies), lues.inter400.points).forEach((ch) => horsInter.set(ch, `${x.nom} : « ${n.texte.slice(0, 50)} »`));
    }
  }
  const dire = (m) => [...m].slice(0, 4).map(([ch, ou]) => `U+${ch.codePointAt(0).toString(16).toUpperCase()} (${ou})`).join(' | ');
  verifier(`C.8 (K-m8) chaque caractère des ${enOswald} textes posés en Oswald est dans la cmap d’Oswald — lue dans le WOFF2 engendré`,
    horsOswald.size === 0 && enOswald > PAGES.length, dire(horsOswald));
  verifier(`C.8 sur les ${PAGES.length} pages, chaque caractère qu’Opus écrit (ce qui est tapé retiré) est dans la cmap d’Inter : `
    + 'aucun texte d’Opus ne prend une police du téléphone', horsInter.size === 0, dire(horsInter));
  verifier('C.8 contre-épreuve : « Łazienka » n’est pas portée par Oswald (d’où Inter gras pour un nom tapé) ; « Łukasz Ağaoğlu », '
    + '« Ștefan », « 12,5 m² × 45,00 € » le sont par Inter ; « 中 » et « 😀 » ne le sont pas, et se voient',
  egal(nonPortes('Łazienka', lues.oswald600.points), ['Ł']) && nonPortes('Łukasz Ağaoğlu Ștefan', lues.inter400.points).length === 0
    && nonPortes('12,5 m² × 45,00 €', lues.inter700.points).length === 0 && egal(nonPortes('a中😀', lues.inter400.points), ['中', '😀'])
    && ['DEVIS', 'Client', 'Détail des travaux', 'Options, non comprises dans le total']
      .every((t) => nonPortes(t, lues.oswald600.points).length === 0), '');
});

section('C.9 Le gabarit n’écrit rien : le texte de la page = les chaînes du document, dans les deux sens');
await sousGarde('C.9', async () => {
  const fautes = [];
  const AJOUTS = (x) => [`N° DEV-${x.i.annee}-`, '0000', '····'];
  for (const x of PAGES.filter((p) => p.juge)) {
    const vus = compte(textesDuCorps(x.juge.racine).map((n) => n.texte));
    const attendus = compte([...textesImprimes(x.d), ...AJOUTS(x)]);
    if (!egal(vus, attendus)) {
      const plus = Object.keys(vus).filter((t) => vus[t] !== attendus[t]);
      const moins = Object.keys(attendus).filter((t) => !(t in vus));
      fautes.push(`${x.nom} : ${JSON.stringify(plus.slice(0, 2))} / manquent ${JSON.stringify(moins.slice(0, 2))}`);
    }
  }
  verifier(`C.9 sur ${PAGES.length} pages : chaque chaîne imprimée du document est dans la page, et la page n’a aucun autre texte `
    + '(sauf « N° DEV-2026- » et le rang en attente)', fautes.length === 0, fautes.slice(0, 4).join(' | '));
  /* L'ORDRE DES BLOCS (§4.3) : en-tête, marques, client, chantier, détail,
     totaux, conditions, informations, source, place de 2c-2. */
  const ordreFaux = [];
  for (const x of PAGES.filter((p) => p.juge)) {
    const t = textesDuCorps(x.juge.racine).map((n) => n.texte);
    const pos = (v) => (v == null ? null : t.indexOf(v));
    const reperes = [pos('DEVIS'), pos(x.d.marques.apercu), pos(x.d.titres.client), pos(x.d.titres.decompte),
      pos(x.d.totaux.rangees.find((r) => r.ton === 'fort') ? x.d.totaux.rangees.find((r) => r.ton === 'fort').libelle : null),
      x.d.conditions.length ? pos(x.d.conditions[0]) : null, x.d.informations.length ? pos(x.d.informations[0]) : null,
      pos(x.d.emetteur.source), pos(x.d.aVenir)].filter((v) => v != null);
    if (reperes.some((v, k) => v < 0 || (k > 0 && v <= reperes[k - 1]))) ordreFaux.push(`${x.nom} : ${JSON.stringify(reperes)}`);
  }
  verifier('C.9 l’ordre des blocs du §4.3', ordreFaux.length === 0, ordreFaux.slice(0, 3).join(' | '));
  /* Les mots (§4.8) sur les NŒUDS TEXTE du HTML, `<style>` retiré. */
  const mots = [];
  for (const x of PAGES.filter((p) => p.juge)) {
    const saisies = saisiesDe(x.i);
    for (const n of textesDuCorps(x.juge.racine)) {
      const t = masquer(n.texte, saisies);
      REGLES.forEach((r) => { if (juger(r, t)) mots.push(`${x.nom} : ${r.nom} « ${n.texte} »`); });
    }
  }
  verifier('C.9 les règles des mots (§4.8) sur le texte de toutes les pages', mots.length === 0, mots.slice(0, 4).join(' | '));
  /* Les chaînes LITTÉRALES du gabarit, commentaires retirés. */
  const code = sansCommentaires(lire('src/lib/devis-html.js'));
  const litteraux = [...code.matchAll(/'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)].map((m) => (m[1] != null ? m[1] : m[2] || ''));
  const fautesCode = litteraux.flatMap((t) => REGLES.filter((r) => juger(r, t)).map((r) => `${r.nom} : « ${t.slice(0, 60)} »`));
  verifier(`C.9 les ${litteraux.length} chaînes littérales de devis-html.js passent les mêmes règles`, fautesCode.length === 0
    && litteraux.length > 30, fautesCode.join(' | '));
  verifier('C.9 le titre de la fenêtre, en toutes lettres', TITRE_DE_LA_FENETRE === 'Aperçu du devis', TITRE_DE_LA_FENETRE);
});

/* ================================================================== */
/*  D. LES POLICES ENGENDRÉES — l'empreinte, la couverture, la licence  */
/* ================================================================== */

/* GitHub n'a pas `pyftsubset` : la CI ne refait pas les polices. Elle
   vérifie ce qui se vérifie sans lui (§4.9) — l'empreinte de chaque WOFF2,
   la liste de ses caractères lue par le lecteur écrit ici, ses noms de
   licence, et qu'aucun fichier ne le charge au démarrage. La régénération,
   elle : `npm run generer-polices-devis -- --verifier`, là où fontTools est
   installé. */
section('D.1 Le fichier engendré : ses exports en liste fermée, sa licence en tête, rien d’importé');
await sousGarde('D.1', async () => {
  const P = await chargerPolices();
  const exports = Object.keys(P).sort();
  verifier('D.1 les exports, en liste fermée : POLICES_DEVIS, EMPREINTES_POLICES, TAILLES_POLICES, POINTS_POLICES, NOMS_POLICES, '
    + 'ORIGINE_POLICES', egal(exports, ['EMPREINTES_POLICES', 'NOMS_POLICES', 'ORIGINE_POLICES', 'POINTS_POLICES', 'POLICES_DEVIS',
    'TAILLES_POLICES']), exports.join(', '));
  const tables = ['POLICES_DEVIS', 'EMPREINTES_POLICES', 'TAILLES_POLICES', 'POINTS_POLICES', 'NOMS_POLICES'];
  verifier('D.1 chacun gelé, aux trois clés inter400, inter700, oswald600 — celles que devisHtml attend',
    tables.every((t) => Object.isFrozen(P[t]) && egal(Object.keys(P[t]), CLES_POLICES)) && Object.isFrozen(P.ORIGINE_POLICES),
    tables.map((t) => `${t} : ${Object.keys(P[t]).join(',')}`).join(' | '));
  const texte = lire('src/data/polices-devis.js');
  const tete = texte.slice(0, texte.indexOf('*/'));
  verifier('D.1 l’en-tête dit ENGENDRÉ, et porte la licence : les deux droits d’auteur et le texte de la SIL Open Font License 1.1',
    /FICHIER ENGENDRÉ : NE PAS L’ÉCRIRE À LA MAIN/.test(tete) && tete.includes('scripts/generer-polices-devis.mjs')
    && tete.includes('Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter)')
    && tete.includes('Copyright 2016 The Oswald Project Authors (https://github.com/googlefonts/OswaldFont)')
    && tete.includes('SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007') && tete.includes('TERMINATION')
    && tete.includes('Reserved Font Name'), tete.slice(0, 200));
  const sf = ts.createSourceFile('polices-devis.js', texte, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const vus = [];
  const visiter = (n) => {
    if (ts.isImportDeclaration(n) || (ts.isExportDeclaration(n) && n.moduleSpecifier)) vus.push(n.getText(sf).slice(0, 60));
    else if (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword
      || (ts.isIdentifier(n.expression) && n.expression.text === 'require'))) vus.push(n.getText(sf).slice(0, 60));
    ts.forEachChild(n, visiter);
  };
  visiter(sf);
  verifier('D.1 polices-devis.js n’importe rien (arbre syntaxique)', vus.length === 0, vus.join(' | '));
});

section('D.2 Chaque police : du base64 sous 1 Mo, un WOFF2, son empreinte SHA-256 et sa taille = celles rangées');
await sousGarde('D.2', async () => {
  const P = await chargerPolices();
  const fautes = [];
  for (const k of CLES_POLICES) {
    const b = P.POLICES_DEVIS[k];
    if (typeof b !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(b) || b.length % 4 !== 0 || b.length >= LIMITE_POLICE) {
      fautes.push(`${k} : pas du base64 sous ${LIMITE_POLICE}`);
      continue;
    }
    const o = Buffer.from(b, 'base64');
    if (o.toString('base64') !== b) fautes.push(`${k} : le base64 ne se relit pas à l’identique`);
    if (o.toString('latin1', 0, 4) !== 'wOF2') fautes.push(`${k} : pas un WOFF2`);
    if (sha256(o) !== P.EMPREINTES_POLICES[k]) fautes.push(`${k} : empreinte ${sha256(o)} ≠ rangée ${P.EMPREINTES_POLICES[k]}`);
    if (o.length !== P.TAILLES_POLICES[k]) fautes.push(`${k} : ${o.length} octets ≠ ${P.TAILLES_POLICES[k]} rangés`);
    if (!(o.length > 5000 && o.length < 40000)) fautes.push(`${k} : ${o.length} octets, hors de ce qu’un sous-ensemble pèse`);
  }
  verifier('D.2 inter400, inter700, oswald600 : base64 relu à l’identique, signature « wOF2 », SHA-256 et taille = celles rangées',
    fautes.length === 0, fautes.join(' | '));
  console.log(`  … ${CLES_POLICES.map((k) => `${k} ${P.TAILLES_POLICES[k]} octets (${P.EMPREINTES_POLICES[k].slice(0, 12)}…)`).join(' · ')}`);
});

section('D.3 Le lecteur de WOFF2 écrit ici : les tables, la cmap = la liste rangée = la liste écrite en toutes lettres');
await sousGarde('D.3', async () => {
  const P = await chargerPolices();
  const lues = await policesLues();
  const fautes = [];
  const REQUISES = ['cmap', 'glyf', 'head', 'hhea', 'hmtx', 'loca', 'maxp', 'name', 'OS/2', 'post'];
  for (const k of CLES_POLICES) {
    const l = lues[k];
    if (l.woff2.saveur !== 0x00010000) fautes.push(`${k} : saveur ${l.woff2.saveur.toString(16)} (TrueType attendu)`);
    const manque = REQUISES.filter((t) => !l.woff2.etiquettes.includes(t));
    if (manque.length) fautes.push(`${k} : tables absentes ${manque.join(', ')}`);
    const lu = enPlages(l.points);
    if (lu !== P.POINTS_POLICES[k]) fautes.push(`${k} : lu ici ${lu} ≠ rangé par fontTools ${P.POINTS_POLICES[k]}`);
    if (lu !== POINTS_ATTENDUS[k]) fautes.push(`${k} : lu ${lu} ≠ écrit ici ${POINTS_ATTENDUS[k]}`);
    if (!(l.glyphes > l.points.size)) fautes.push(`${k} : ${l.glyphes} glyphes pour ${l.points.size} caractères`);
  }
  verifier('D.3 les trois WOFF2 se lisent (en-tête, répertoire, un flux Brotli de la longueur des tables), TrueType, les dix tables '
    + 'requises ; leur cmap lue ici = celle que fontTools a rangée = celle écrite en toutes lettres', fautes.length === 0,
  fautes.join(' | '));
  verifier('D.3 Inter 400 et Inter 700 portent les MÊMES caractères ; Oswald, moins (aucun latin étendu)',
    enPlages(lues.inter400.points) === enPlages(lues.inter700.points) && !lues.oswald600.points.has(0x141)
    && lues.inter400.points.has(0x141) && lues.inter400.points.has(0x202F), '');
  const leve = (f) => { try { f(); return null; } catch (e) { return e.message; } };
  const o = lues.inter400.octets;
  const mauvais = [
    ['une signature changée', Buffer.concat([Buffer.from('wOFF'), o.subarray(4)])],
    ['un fichier coupé', o.subarray(0, o.length - 100)],
    ['un flux abîmé', Buffer.concat([o.subarray(0, o.length - 40), Buffer.alloc(40, 0x55)])],
  ].filter(([, b]) => !leve(() => lireWoff2(b))).map(([nom]) => nom);
  verifier('D.3 contre-épreuve : le lecteur REFUSE une signature changée, un fichier coupé, un flux abîmé', mauvais.length === 0,
    mauvais.join(' | '));
  /* L'ORIGINE : le sous-ensemble porte EXACTEMENT ce que la police d'origine
     porte dans les plages demandées — lu par le même lecteur, sur le TTF
     de node_modules. Et l'empreinte de ce TTF est celle que le générateur a
     rangée : sinon, la provenance écrite dans le fichier mentirait. */
  const origine = [];
  for (const k of CLES_POLICES) {
    const src = P.ORIGINE_POLICES.sources[k];
    const chemin = src && src.fichier;
    if (!chemin || !existsSync(chemin)) { origine.push(`${k} : la police d’origine manque (${chemin})`); continue; }
    const ttf = readFileSync(chemin);
    if (sha256(ttf) !== src.sha256) origine.push(`${k} : ${chemin} a changé depuis la génération — npm run generer-polices-devis`);
    const plages = depuisPlages(P.ORIGINE_POLICES.plages[k.startsWith('inter') ? 'inter' : 'oswald']);
    const dansLOrigine = [...caracteresDeLaCmap(lireSfnt(ttf).tables.cmap.octets)].filter((c) => plages.has(c));
    if (enPlages(dansLOrigine) !== enPlages(lues[k].points)) origine.push(`${k} : ${enPlages(dansLOrigine)} dans l’origine`);
  }
  verifier('D.3 chaque sous-ensemble = les caractères de SA police d’origine dans les plages rangées ; l’origine n’a pas changé',
    origine.length === 0, origine.join(' | '));
});

section('D.4 Les noms : le droit d’auteur, le nom PostScript, la licence — en toutes lettres, et = ceux rangés');
await sousGarde('D.4', async () => {
  const P = await chargerPolices();
  const lues = await policesLues();
  const fautes = [];
  for (const k of CLES_POLICES) {
    const n = lues[k].noms;
    const a = NOMS_ATTENDUS[k];
    for (const id of [0, 6, 14]) if (n[id] !== a[id]) fautes.push(`${k} : nom ${id} « ${n[id]} » ≠ « ${a[id]} »`);
    if (!/SIL Open Font License, Version 1\.1/.test(n[13] || '')) fautes.push(`${k} : le nom 13 ne cite pas l’OFL 1.1`);
    const r = P.NOMS_POLICES[k];
    if (!r || r.droitDAuteur !== n[0] || r.postscript !== n[6] || r.licence !== n[13] || r.adresseDeLaLicence !== n[14]
      || r.famille !== n[1] || r.version !== n[5]) fautes.push(`${k} : NOMS_POLICES ≠ ce que la police porte`);
  }
  verifier('D.4 les noms 0, 6, 13 et 14 de chaque police (la licence que l’OFL exige de garder), et NOMS_POLICES = la police',
    fautes.length === 0, fautes.join(' | '));
  /* Un PDF qui ne porte QUE ces trois polices, nommées comme un moteur les
     nomme (un préfixe de sous-ensemble) : le VRAI lecteur du tampon doit y
     voir « les polices d'Opus ». */
  const d = await PDFLib.PDFDocument.create({ updateMetadata: false });
  CLES_POLICES.forEach((k, i) => d.context.register(d.context.obj({ Type: 'Font', Subtype: 'TrueType',
    BaseFont: `${'ABC'[i].repeat(6)}+${lues[k].noms[6]}` })));
  const pol = policesDuDocument(PDFLib, d);
  verifier('D.4 les noms PostScript sont ceux que le tampon reconnaît : un PDF fait de ces trois polices est dit « polices d’Opus »',
    issueDesPolices(pol) === 'opus' && egal(pol.noms, ['Inter-Bold', 'Inter-Regular', 'Oswald-SemiBold']), JSON.stringify(pol));
});

section('D.5 Jamais chargé au démarrage : aucun fichier de l’application ne l’importe en haut');
await sousGarde('D.5', async () => {
  /* Les fichiers suivis ET ceux qui ne le sont pas encore (hors .gitignore) :
     un fichier nouveau, pas encore commité, est lu lui aussi. */
  const fichiers = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'App.js', 'src'], { encoding: 'utf8' })
    .stdout.split('\n')
    .filter((f) => /\.(js|jsx|ts|tsx)$/.test(f) && existsSync(f) && f !== 'src/data/polices-devis.js');
  const fautes = [];
  for (const f of fichiers) {
    const texte = lire(f);
    if (!texte.includes('polices-devis')) continue;
    const sf = ts.createSourceFile(f, texte, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const dansUneFonction = (n) => {
      for (let p = n.parent; p; p = p.parent) {
        if (ts.isFunctionLike(p)) return true;
      }
      return false;
    };
    const visiter = (n) => {
      if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && /polices-devis/.test(n.moduleSpecifier.getText(sf))) {
        fautes.push(`${f} : ${n.getText(sf).slice(0, 70)}`);
      } else if (ts.isCallExpression(n) && n.arguments.some((a) => /polices-devis/.test(a.getText(sf)))) {
        const appel = n.expression.getText(sf);
        if (n.expression.kind === ts.SyntaxKind.ImportKeyword) fautes.push(`${f} : import() — interdit dans src/`);
        else if (appel === 'require' && !dansUneFonction(n)) fautes.push(`${f} : require au niveau du module`);
      }
      ts.forEachChild(n, visiter);
    };
    visiter(sf);
  }
  verifier(`D.5 sur ${fichiers.length} fichiers de l’application : polices-devis.js n’est importé en haut d’aucun (ni import, ni `
    + 'export from, ni require hors d’une fonction)', fautes.length === 0 && fichiers.length > 50, fautes.join(' | '));
});

section('D.6 Le générateur : les versions fixées, les plages = celles rangées');
await sousGarde('D.6', async () => {
  const P = await chargerPolices();
  const g = sansCommentaires(lire('scripts/generer-polices-devis.mjs'));
  const constante = (nom) => {
    const m = new RegExp(`const ${nom} = ((?:'[^']*'\\s*\\+?\\s*)+);`).exec(g);
    return m ? [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1]).join('') : null;
  };
  verifier('D.6 fontTools 4.69.1 et brotli 1.2.1, fixés par le générateur et rangés dans le fichier ; les plages et les fonctions '
    + 'du générateur = celles rangées', constante('VERSION_FONTTOOLS') === '4.69.1' && constante('VERSION_BROTLI') === '1.2.1'
    && P.ORIGINE_POLICES.fonttools === '4.69.1' && P.ORIGINE_POLICES.brotli === '1.2.1'
    && constante('PLAGES_INTER') === P.ORIGINE_POLICES.plages.inter && constante('PLAGES_OSWALD') === P.ORIGINE_POLICES.plages.oswald
    && constante('FONCTIONS') === P.ORIGINE_POLICES.fonctions && P.ORIGINE_POLICES.fonctions === 'kern,liga,tnum,lnum',
  JSON.stringify({ ft: constante('VERSION_FONTTOOLS'), inter: constante('PLAGES_INTER') }));
});


/* ================================================================== */
/*  E. LE TAMPON — pdf-lib RÉEL, sur des PDF fabriqués ici              */
/* ================================================================== */

/* LES PDF TÉMOINS, fabriqués en mémoire par pdf-lib : des pages A4 (ou de la
   taille que Chromium écrit), des polices NOMMÉES comme Chromium les nomme
   (un préfixe de sous-ensemble), un contenu d'origine — retourné ou non —,
   une image si on la demande. Les PDF de Chromium eux-mêmes, figés dans le
   dépôt, viennent à l'étape 3 (avec les polices). */
const { PDFOperator, PDFOperatorNames: OP, PDFNumber, PDFString } = PDFLib;
const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const META_TEMOIN = Object.freeze({ createur: 'Essai', producteur: 'verifier-apercu', titre: 'Aperçu du devis' });
async function pdfTemoin({ pages = 2, polices = ['AAAAAA+Inter-Regular', 'BAAAAA+Oswald-SemiBold'], retourne = false, image = false,
  taille = [595.28, 841.89] } = {}) {
  const d = await PDFLib.PDFDocument.create({ updateMetadata: false });
  d.setCreator(META_TEMOIN.createur);
  d.setProducer(META_TEMOIN.producteur);
  d.setTitle(META_TEMOIN.titre);
  const refs = polices.map((nom) => d.context.register(d.context.obj({ Type: 'Font', Subtype: 'TrueType', BaseFont: nom })));
  const img = image ? await d.embedPng(PNG_1PX) : null;
  for (let k = 0; k < pages; k += 1) {
    const p = d.addPage(taille);
    const noms = refs.map((r, i) => p.node.newFontDictionary(`F${i}`, r));
    const ops = [];
    if (retourne) ops.push(PDFOperator.of(OP.ConcatTransformationMatrix, [1, 0, 0, -1, 0, taille[1]].map((n) => PDFNumber.of(n))));
    if (noms.length) {
      ops.push(PDFOperator.of(OP.BeginText), PDFOperator.of(OP.SetFontAndSize, [noms[0], PDFNumber.of(12)]),
        PDFOperator.of(OP.MoveText, [PDFNumber.of(72), PDFNumber.of(700)]), PDFOperator.of(OP.ShowText, [PDFString.of(`Contenu ${k + 1}`)]),
        PDFOperator.of(OP.EndText));
    }
    p.pushOperators(...ops);
    if (img) p.drawImage(img, { x: 10, y: 10, width: 20, height: 20 });
  }
  return d.save({ useObjectStreams: true, addDefaultPage: false });
}
/* Le même document, chaque page posée comme un XObject (ce que fait un
   afficheur qui recompose) : les polices ne sont plus dans les ressources de
   la page, mais dans celles du formulaire. */
async function enXobjet(octets) {
  const src = await PDFLib.PDFDocument.load(octets, { updateMetadata: false });
  const d = await PDFLib.PDFDocument.create({ updateMetadata: false });
  d.setCreator(META_TEMOIN.createur);
  d.setProducer(META_TEMOIN.producteur);
  const formes = await d.embedPages(src.getPages());
  for (const f of formes) d.addPage([595.28, 841.89]).drawPage(f, { x: 0, y: 0 });
  return d.save({ useObjectStreams: true, addDefaultPage: false });
}
const contenuDeLaPage = (doc, page) => {
  const c = page.node.Contents();
  const flux = c instanceof PDFLib.PDFArray ? c.asArray().map((r) => doc.context.lookup(r)) : [c];
  return flux.map((s) => Buffer.from(PDFLib.decodePDFRawStream(s).decode()).toString('latin1')).join('\n');
};
/* Un texte en WinAnsi, en hexadécimal — la table écrite ICI (K11) : ce que
   pdf-lib écrit dans le flux pour une police standard. */
const WINANSI = { 'Ç': 0xC7, '—': 0x97, '’': 0x92, '·': 0xB7, 'é': 0xE9 };
const hexWinAnsi = (t) => [...t].map((c) => {
  const v = c.charCodeAt(0) < 0x80 ? c.charCodeAt(0) : WINANSI[c];
  if (v == null) throw new Error(`verifier-apercu : « ${c} » hors de la table WinAnsi d’essai`);
  return v.toString(16).padStart(2, '0').toUpperCase();
}).join('');
const contientHex = (contenu, texte) => contenu.toUpperCase().includes(`<${hexWinAnsi(texte)}>`);
const MARQUES_ESSAI = Object.freeze({ apercu: 'APERÇU — ce document n’est pas remis', essai: 'Document d’essai — sans valeur', exemple: null });
const MARQUES_EXEMPLE = Object.freeze({ ...MARQUES_ESSAI, exemple: 'Exemple — données inventées' });
const tamponEssai = (octets, o = {}) => tamponner(o.pdfLib || PDFLib, octets, {
  textes: o.textes || MARQUES_ESSAI, numeroAffiche: o.numeroAffiche || 'DEV-2026-····', a4: A4,
});
const levee = async (f) => { try { await f(); return null; } catch (e) { return e; } };

const TEMOIN = await pdfTemoin();
const TEMOIN_RETOURNE = await pdfTemoin({ retourne: true });
const TEMOIN_CHROMIUM = await pdfTemoin({ pages: 3, taille: [595.92, 841.92] });
const TEMOIN_XOBJET = await enXobjet(TEMOIN);
const TEMOIN_IMAGE = await pdfTemoin({ polices: [], image: true, pages: 1 });
const TEMOIN_STANDARD = await pdfTemoin({ polices: ['Helvetica'], pages: 1 });
const TEMOIN_AUTRE = await pdfTemoin({ polices: ['CCCCCC+SFPro-Regular'], pages: 1 });
const TEMOIN_INTER_SEUL = await pdfTemoin({ polices: ['AAAAAA+Inter-Regular'], pages: 1 });
const ZERO_PAGE = await (await PDFLib.PDFDocument.create({ updateMetadata: false })).save({ addDefaultPage: false });

section('E.0 pdf-lib, résolu comme Metro le résout (cjs)');
verifier('E.0 @cantoo/pdf-lib se charge par createRequire, construction cjs, avec ce dont le tampon a besoin',
  typeof PDFLib.PDFDocument === 'function' && typeof PDFLib.rgb === 'function' && typeof PDFLib.degrees === 'function'
  && !!PDFLib.StandardFonts && /[\\/]cjs[\\/]/.test(exiger.resolve('@cantoo/pdf-lib')), exiger.resolve('@cantoo/pdf-lib'));

section('E.1 Les pages : gardées, aucune ajoutée ; zéro page refusée ; les options de chargement et d’écriture');
await sousGarde('E.1', async () => {
  const espion = [];
  const PDFLibEspion = {
    ...PDFLib,
    PDFDocument: {
      load: async (octets, options) => {
        espion.push(['load', options]);
        const d = await PDFLib.PDFDocument.load(octets, options);
        const save = d.save.bind(d);
        d.save = (o) => { espion.push(['save', o]); return save(o); };
        return d;
      },
    },
  };
  const t = await tamponEssai(TEMOIN_CHROMIUM, { pdfLib: PDFLibEspion });
  const relu = await PDFLib.PDFDocument.load(t.octets);
  verifier('E.1 trois pages de 595,92 × 841,92 (la taille de Chromium) → trois pages, de la MÊME taille',
    t.pages === 3 && relu.getPageCount() === 3 && egal(t.tailles, [{ largeur: 595.92, hauteur: 841.92 }, { largeur: 595.92, hauteur: 841.92 },
      { largeur: 595.92, hauteur: 841.92 }]) && relu.getPages().every((p) => p.getWidth() === 595.92 && p.getHeight() === 841.92),
    JSON.stringify(t.tailles));
  verifier('E.1 chargé avec { updateMetadata: false }, écrit avec { useObjectStreams: true, addDefaultPage: false }',
    egal(espion, [['load', { updateMetadata: false }], ['save', { useObjectStreams: true, addDefaultPage: false }]]), JSON.stringify(espion));
  const e = await levee(() => tamponEssai(ZERO_PAGE));
  verifier('E.1 un PDF de zéro page : le tampon LÈVE, code « vide » (aucune page n’est inventée)', !!e && e.code === 'vide', e && e.code);
});

section('E.2 Chaque page porte la tête, la diagonale et son pied ; le contenu d’origine est gardé, dans q … Q');
await sousGarde('E.2', async () => {
  const ORACLES = {
    tete: 'APERÇU — ce document n’est pas remis · Document d’essai — sans valeur',
    teteExemple: 'APERÇU — ce document n’est pas remis · Document d’essai — sans valeur · Exemple — données inventées',
    diagonale: 'APERÇU',
    pieds: ['Devis DEV-2026-···· — Page 1 sur 2', 'Devis DEV-2026-···· — Page 2 sur 2'],
  };
  for (const [nom, src, textes, tete] of [['A4', TEMOIN, MARQUES_ESSAI, ORACLES.tete], ['retourné', TEMOIN_RETOURNE, MARQUES_ESSAI, ORACLES.tete],
    ['exemple', TEMOIN, MARQUES_EXEMPLE, ORACLES.teteExemple]]) {
    const t = await tamponEssai(src, { textes });
    const d = await PDFLib.PDFDocument.load(t.octets);
    const fautes = d.getPages().map((p, k) => {
      const c = contenuDeLaPage(d, p);
      const manque = [[tete, 'la tête'], [ORACLES.diagonale, 'la diagonale'], [ORACLES.pieds[k], 'le pied']]
        .filter(([texte]) => !contientHex(c, texte)).map(([, quoi]) => quoi);
      if (!new RegExp(`^\\s*q\\b[\\s\\S]*\\(Contenu ${k + 1}\\)[\\s\\S]*\\bQ\\b[\\s\\S]*<${hexWinAnsi(tete)}>`, 'i').test(c)) {
        manque.push('le contenu d’origine dans q … Q, AVANT le tampon');
      }
      if (!/0\.8191\d*\s+0\.5735\d*\s+-0\.5735\d*\s+0\.8191\d*\s+[-\d.]+\s+[-\d.]+\s+(cm|Tm)\b/.test(c)) manque.push('la rotation de 35°');
      if (!/\bgs\b/.test(c)) manque.push('l’opacité (gs)');
      return manque.length ? `page ${k + 1} : ${manque.join(', ')}` : null;
    }).filter(Boolean);
    verifier(`E.2 ${nom} : sur CHAQUE page, « ${tete.slice(0, 30)}… », « APERÇU » à 35° et « Devis DEV-2026-···· — Page k sur 2 », `
      + 'en toutes lettres', d.getPageCount() === 2 && fautes.length === 0, fautes.join(' | '));
  }
  const t = await tamponEssai(TEMOIN_CHROMIUM);
  const d = await PDFLib.PDFDocument.load(t.octets);
  const pieds = d.getPages().map((p, k) => contientHex(contenuDeLaPage(d, p), `Devis DEV-2026-···· — Page ${k + 1} sur 3`));
  verifier('E.2 trois pages : « Page 1 sur 3 », « Page 2 sur 3 », « Page 3 sur 3 »', egal(pieds, [true, true, true]), JSON.stringify(pieds));
  verifier('E.2 piedDeLaPage, en littéraux', piedDeLaPage('DEV-2026-····', 2, 7) === 'Devis DEV-2026-···· — Page 2 sur 7'
    && SEPARATEUR_TETE === ' · ', piedDeLaPage('DEV-2026-····', 2, 7));
});

section('E.3 La géométrie : la tête dans la marge du haut, le pied dans celle du bas, la diagonale au centre');
await sousGarde('E.3', async () => {
  const MM_ = 72 / 25.4;
  /* Des mesures d'essai, écrites ici : 5 pt par caractère en tête, 4 au
     pied, une diagonale de 300 × 52. */
  const mesures = { largeurTete: (s) => [...s].length * 5, montantTete: 7, largeurPied: (s) => [...s].length * 4, largeurDiagonale: 300,
    montantDiagonale: 52 };
  const fautes = [];
  for (const boite of [{ x: 0, y: 0, largeur: 595.28, hauteur: 841.89 }, { x: 0, y: 0, largeur: 595.92, hauteur: 841.92 }]) {
    for (const lignes of [['APERÇU — ce document n’est pas remis · Document d’essai — sans valeur'],
      ['APERÇU — ce document n’est pas remis', 'Document d’essai — sans valeur · Exemple — données inventées']]) {
      const pied = 'Devis DEV-2026-···· — Page 1 sur 2';
      const g = geometrieDuTampon({ boite, mesures, lignes, pied, a4: A4 });
      const W = boite.largeur;
      const H = boite.hauteur;
      const pres = (a, b) => Math.abs(a - b) < 0.01;
      const nom = `${W} × ${H}, ${lignes.length} ligne(s)`;
      if (!pres(g.filet.y + g.filet.hauteur, H - 7 * MM_)) fautes.push(`${nom} : le filet ne commence pas à 7 mm du haut`);
      if (!(g.filet.y > H - 20 * MM_)) fautes.push(`${nom} : le filet descend dans le contenu (marge de 20 mm)`);
      if (!(g.filet.x >= 0 && g.filet.x + g.filet.largeur <= W)) fautes.push(`${nom} : le filet sort de la page`);
      g.lignes.forEach((l, k) => {
        if (l.texte !== lignes[k]) fautes.push(`${nom} : la ligne ${k} n’est pas la sienne`);
        if (!pres(l.x + l.largeur / 2, W / 2)) fautes.push(`${nom} : la ligne ${k} n’est pas centrée`);
        if (!(l.x >= 15 * MM_ - 0.01 && l.x + l.largeur <= W - 15 * MM_ + 0.01)) fautes.push(`${nom} : la ligne ${k} sort des marges`);
        if (k > 0 && !pres(g.lignes[k - 1].y - l.y, 9.5 * 1.25)) fautes.push(`${nom} : l’interligne de la tête`);
        if (!(l.y > g.filet.y && l.y + 7 < g.filet.y + g.filet.hauteur)) fautes.push(`${nom} : la ligne ${k} hors du filet`);
      });
      if (!pres(g.pied.y, 8 * MM_) || !pres(g.pied.x + g.pied.largeur / 2, W / 2) || g.pied.texte !== pied) fautes.push(`${nom} : le pied`);
      if (!(g.pied.y + 8.5 < 20 * MM_)) fautes.push(`${nom} : le pied monte dans le contenu`);
      /* Le milieu du mot, tourné de 35°, au milieu de la page. */
      const a = (35 * Math.PI) / 180;
      const mx = g.diagonale.x + 150 * Math.cos(a) - 26 * Math.sin(a);
      const my = g.diagonale.y + 150 * Math.sin(a) + 26 * Math.cos(a);
      if (!pres(mx, W / 2) || !pres(my, H / 2) || g.diagonale.texte !== 'APERÇU') fautes.push(`${nom} : la diagonale n’est pas au centre`);
    }
  }
  verifier('E.3 deux tailles (A4, Chromium), une et deux lignes : filet à 7 mm du haut et au-dessus des 20 mm, lignes centrées dans '
    + 'les marges de 15 mm, pied à 8 mm du bas, milieu de « APERÇU » au milieu de la page', fautes.length === 0, fautes.slice(0, 4).join(' | '));
  const largeur = (s) => [...s].length * 5;
  const deux = lignesDeLaTete(['APERÇU — ce document n’est pas remis', 'Document d’essai — sans valeur', 'Exemple — données inventées'], largeur, 300);
  verifier('E.3 trop large pour une ligne : la tête passe sur deux lignes, « · » entre les marques d’une même ligne',
    egal(deux, ['APERÇU — ce document n’est pas remis', 'Document d’essai — sans valeur · Exemple — données inventées']), JSON.stringify(deux));
  const une = lignesDeLaTete(['APERÇU — ce document n’est pas remis', 'Document d’essai — sans valeur'], largeur, 510.24);
  verifier('E.3 assez large : une seule ligne', egal(une, ['APERÇU — ce document n’est pas remis · Document d’essai — sans valeur']), JSON.stringify(une));
  let e = null;
  try { lignesDeLaTete(['APERÇU — ce document n’est pas remis'], largeur, 100); } catch (x) { e = x; }
  verifier('E.3 une marque plus large que la page : LÈVE (code « largeur »), jamais coupée', !!e && e.code === 'largeur', e && e.code);
  verifier('E.3 le format, en littéraux : A4 de 595,28 × 841,89, marges 56,69 / 42,52, contenu de 510,24',
    egal(A4.A4_PT, { largeur: 595.28, hauteur: 841.89 }) && egal(A4.MARGES_PT, { top: 56.69, right: 42.52, bottom: 56.69, left: 42.52 })
    && egal(A4.MARGES_MM, { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }) && Math.abs(A4.LARGEUR_CONTENU_PT - 510.24) < 1e-9
    && A4.TAMPON.teteDepuisLeHautMm === 7 && A4.TAMPON.piedDepuisLeBasMm === 8 && A4.TAMPON.tailleTete === 9.5 && A4.TAMPON.taillePied === 8.5
    && A4.TAMPON.angleDiagonale === 35 && A4.TAMPON.opaciteDiagonale === 0.3 && A4.TAMPON.gris === '#6A665C' && Object.isFrozen(A4.TAMPON),
  JSON.stringify(A4.TAMPON));
});

section('E.4 Les textes du tampon : en littéraux, tels quels dans Helvetica, et une liste FERMÉE');
await sousGarde('E.4', async () => {
  verifier('E.4 les textes du tampon, en toutes lettres, = les marques de la composition', egal(TEXTES_DU_TAMPON, {
    apercu: 'APERÇU — ce document n’est pas remis', essai: 'Document d’essai — sans valeur', exemple: 'Exemple — données inventées',
    diagonale: 'APERÇU', devis: 'Devis', page: 'Page', sur: 'sur',
  }) && TEXTES_DU_TAMPON.apercu === MARQUES.apercu && TEXTES_DU_TAMPON.essai === MARQUES.essai && TEXTES_DU_TAMPON.exemple === MARQUES.exemple,
  JSON.stringify(TEXTES_DU_TAMPON));
  const d = await PDFLib.PDFDocument.create();
  const gras = await d.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const normal = await d.embedFont(PDFLib.StandardFonts.Helvetica);
  const textes = [...Object.values(TEXTES_DU_TAMPON), 'APERÇU — ce document n’est pas remis · Document d’essai — sans valeur · Exemple — données inventées',
    'Devis DEV-2026-···· — Page 12 sur 12'];
  const nonTels = textes.filter((t) => !sEcritTelQuel(gras, t) || !sEcritTelQuel(normal, t));
  verifier('E.4 chaque texte du tampon s’écrit TEL QUEL en Helvetica et Helvetica-Bold (aucun « ? » fabriqué)', nonTels.length === 0,
    nonTels.join(' | '));
  verifier('E.4 contre-épreuve : une espace fine insécable (U+202F) ne s’écrit pas telle quelle — et un vrai « ? » ne compte pas',
    !sEcritTelQuel(normal, '5\u202f%') && !sEcritTelQuel(normal, 'a\u2003b') && sEcritTelQuel(normal, 'Et alors ?'), '');
  const refus = [];
  for (const [nom, o] of [
    ['un nom à la place de la marque d’essai', { textes: { ...MARQUES_ESSAI, essai: 'Mme TÉMOIN' } }],
    ['une clé de plus', { textes: { ...MARQUES_ESSAI, client: 'Mme TÉMOIN' } }],
    ['la marque « APERÇU » absente', { textes: { essai: MARQUES_ESSAI.essai } }],
    ['la marque « APERÇU » changée', { textes: { ...MARQUES_ESSAI, apercu: 'Aperçu' } }],
    ['un numéro remis', { numeroAffiche: 'DEV-2026-0001' }],
    ['un numéro sans année', { numeroAffiche: 'DEV-····' }],
  ]) {
    const e = await levee(() => tamponEssai(TEMOIN, o));
    if (!e || e.code !== 'hors_liste') refus.push(`${nom} (${e ? e.code : 'passé'})`);
  }
  verifier('E.4 hors de la liste fermée — un nom, une clé de plus, la marque absente ou changée, un numéro remis : LÈVE « hors_liste »',
    refus.length === 0, refus.join(' | '));
  verifier('E.4 la forme du numéro en attente', FORME_DU_NUMERO.test('DEV-2026-····') && !FORME_DU_NUMERO.test('DEV-2026-0001')
    && !FORME_DU_NUMERO.test('DEV-2026-···'), '');
  verifier('E.4 marquesDeLaTete, en littéraux', egal(marquesDeLaTete(MARQUES_EXEMPLE), ['APERÇU — ce document n’est pas remis',
    'Document d’essai — sans valeur', 'Exemple — données inventées']) && egal(marquesDeLaTete({ apercu: MARQUES_ESSAI.apercu, essai: null }),
    ['APERÇU — ce document n’est pas remis']), '');
});

section('E.5 Les polices du document, lues dans TOUS ses objets');
await sousGarde('E.5', async () => {
  const cas5 = [
    ['Inter et Oswald (le PDF de Chromium)', TEMOIN, { issue: 'opus', noms: ['Inter-Regular', 'Oswald-SemiBold'], aucune: false, images: 0 }],
    ['les mêmes, dans des XObjects', TEMOIN_XOBJET, { issue: 'opus', noms: ['Inter-Regular', 'Oswald-SemiBold'], aucune: false, images: 0 }],
    ['une image seule', TEMOIN_IMAGE, { issue: 'aucune', noms: [], aucune: true, images: 2 }],
    ['Helvetica seule (une police standard)', TEMOIN_STANDARD, { issue: 'aucune', noms: [], aucune: true, images: 0, standard: ['Helvetica'] }],
    ['une police du téléphone', TEMOIN_AUTRE, { issue: 'telephone', noms: ['SFPro-Regular'], aucune: false, images: 0, autres: ['SFPro-Regular'] }],
    ['Inter sans Oswald', TEMOIN_INTER_SEUL, { issue: 'telephone', noms: ['Inter-Regular'], aucune: false, images: 0 }],
  ];
  const fautes = [];
  for (const [nom, octets, a] of cas5) {
    const t = await tamponEssai(octets);
    const p = t.polices;
    const ok = issueDesPolices(p) === a.issue && egal(p.noms, a.noms) && p.aucune === a.aucune && p.images === a.images
      && (!a.standard || egal(p.standard, a.standard)) && (!a.autres || egal(p.autres, a.autres));
    if (!ok) fautes.push(`${nom} : ${JSON.stringify(p)}`);
  }
  verifier('E.5 Inter + Oswald → « opus » (même dans des XObjects) ; une image seule ou une police standard seule → « aucune » ; '
    + 'une autre police → « telephone » ; le préfixe de sous-ensemble retiré', fautes.length === 0, fautes.join(' | '));
  const x = await PDFLib.PDFDocument.load(TEMOIN_XOBJET);
  const ressources = x.getPage(0).node.Resources();
  const policesDeLaPage = ressources && ressources.lookup(PDFLib.PDFName.of('Font'));
  verifier('E.5 le témoin XObject est bien un témoin : la PAGE n’a aucune police dans ses ressources',
    !policesDeLaPage || policesDeLaPage.entries().length === 0, String(policesDeLaPage));
  verifier('E.5 les 14 polices standard, en littéraux', egal(POLICES_STANDARD, ['Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique',
    'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique', 'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic',
    'Symbol', 'ZapfDingbats']) && issueDesPolices(null) === 'aucune', '');
});

section('E.6 Les métadonnées : lues, et laissées telles quelles');
await sousGarde('E.6', async () => {
  const t = await tamponEssai(TEMOIN);
  const d = await PDFLib.PDFDocument.load(t.octets, { updateMetadata: false });
  verifier('E.6 Creator, Producer et Title lus avant la marque, et INCHANGÉS après', egal(t.metadonnees, META_TEMOIN)
    && d.getCreator() === 'Essai' && d.getProducer() === 'verifier-apercu' && d.getTitle() === 'Aperçu du devis', JSON.stringify(t.metadonnees));
});

section('E.7 Le déterminisme du tampon, et l’empreinte FNV-1a');
await sousGarde('E.7', async () => {
  const a = await tamponEssai(TEMOIN);
  const b = await tamponEssai(TEMOIN);
  verifier('E.7 deux tampons du même témoin : les MÊMES octets', Buffer.compare(Buffer.from(a.octets), Buffer.from(b.octets)) === 0,
    `${a.octets.length} / ${b.octets.length}`);
  verifier('E.7 FNV-1a 32 bits, les valeurs publiées : « » 811c9dc5, « a » e40c292c, « foobar » bf9cf968 — en chaîne et en octets',
    empreinteFnv1a('') === '811c9dc5' && empreinteFnv1a('a') === 'e40c292c' && empreinteFnv1a('foobar') === 'bf9cf968'
    && empreinteFnv1a(Uint8Array.from([0x61])) === 'e40c292c' && empreinteFnv1a(Buffer.from('foobar')) === 'bf9cf968',
    [empreinteFnv1a(''), empreinteFnv1a('a'), empreinteFnv1a('foobar')].join(' '));
  let e = null;
  try { empreinteFnv1a(42); } catch (x) { e = x; }
  verifier('E.7 ni chaîne ni octets : LÈVE', !!e, '');
  console.log(`  … empreinte du témoin fabriqué ici, tamponné : ${empreinteFnv1a(a.octets)} (${a.octets.length} octets).`);
});

/* ------------------------------------------------------------------ */
/*  E, SUR LES TROIS PDF DE DONNÉES (K16) — deux PDF de Chromium, faits */
/*  par la vraie chaîne avec les polices engendrées, et le premier dont */
/*  chaque page est un XObject de forme, comme iOS                      */
/*  (`scripts/generer-pdf-apercu.mjs`). Un PDF fabriqué par pdf-lib     */
/*  n'a ni les polices embarquées ni la structure d'un PDF de moteur :  */
/*  la propriété des polices ne s'y éprouve que dans son cas NÉGATIF.   */
/* ------------------------------------------------------------------ */
const PDF_DE_DONNEES = Object.freeze(['apercu-chromium-1.pdf', 'apercu-chromium-60.pdf', 'apercu-xobjet.pdf']);
const DE_CHROMIUM = Object.freeze(['apercu-chromium-1.pdf', 'apercu-chromium-60.pdf']);
const lirePdfDeDonnees = (nom) => readFileSync(`scripts/donnees/${nom}`);
const ORACLE_TETE = Object.freeze({
  essai: 'APERÇU — ce document n’est pas remis · Document d’essai — sans valeur',
  exemple: 'APERÇU — ce document n’est pas remis · Document d’essai — sans valeur · Exemple — données inventées',
});
const policesDeLaPage = (page) => {
  const r = page.node.Resources();
  const f = r && r.lookup(PDFLib.PDFName.of('Font'));
  return f ? f.entries().length : 0;
};

section('E.1 (données) Les trois PDF : là, de la bonne nature ; le tampon garde le nombre et la taille de leurs pages');
await sousGarde('E.1', async () => {
  const sources = {};
  const absents = PDF_DE_DONNEES.filter((n) => !existsSync(`scripts/donnees/${n}`));
  verifier('E.1 scripts/donnees/ porte apercu-chromium-1.pdf, apercu-chromium-60.pdf et apercu-xobjet.pdf', absents.length === 0,
    `manquent : ${absents.join(', ')} — npm run generer-pdf-apercu`);
  if (absents.length) return;
  for (const n of PDF_DE_DONNEES) sources[n] = await PDFLib.PDFDocument.load(lirePdfDeDonnees(n), { updateMetadata: false });
  const un = sources['apercu-chromium-1.pdf'];
  const soixante = sources['apercu-chromium-60.pdf'];
  const x = sources['apercu-xobjet.pdf'];
  const tailles = (d) => d.getPages().map((p) => `${p.getWidth()}×${p.getHeight()}`);
  verifier('E.1 deux PDF de Chromium (Skia/PDF), titrés « Aperçu du devis » ; une page pour une ligne, plusieurs pour soixante ; '
    + 'chacun sous 60 Ko', DE_CHROMIUM.every((n) => /^Skia\/PDF/.test(sources[n].getProducer() || '') && sources[n].getTitle() === 'Aperçu du devis'
      && lirePdfDeDonnees(n).length < 60000) && un.getPageCount() === 1 && soixante.getPageCount() >= 2,
  DE_CHROMIUM.map((n) => `${n} : ${sources[n].getProducer()}, ${sources[n].getPageCount()} p.`).join(' | '));
  verifier('E.1 la variante XObject : les pages du premier, de la même taille, et AUCUNE police dans les ressources de ses pages '
    + '(elles vivent dans les XObjects, comme sous iOS)', egal(tailles(x), tailles(un)) && x.getPages().every((p) => policesDeLaPage(p) === 0)
    && un.getPages().every((p) => policesDeLaPage(p) > 0), `${tailles(x)} / ${tailles(un)}`);
  const fautes = [];
  for (const n of PDF_DE_DONNEES) {
    const t = await tamponEssai(lirePdfDeDonnees(n));
    const relu = await PDFLib.PDFDocument.load(t.octets);
    const avant = sources[n].getPages().map((p) => ({ largeur: p.getMediaBox().width, hauteur: p.getMediaBox().height }));
    if (t.pages !== sources[n].getPageCount() || relu.getPageCount() !== t.pages || !egal(t.tailles, avant) || !egal(tailles(relu), tailles(sources[n]))) {
      fautes.push(`${n} : ${t.pages} / ${relu.getPageCount()} pages, ${JSON.stringify(t.tailles)}`);
    }
  }
  verifier('E.1 chacun tamponné : autant de pages, de la MÊME taille (595,92 × 841,92, celle de Chromium) — aucune ajoutée',
    fautes.length === 0, fautes.join(' | '));
});

section('E.2 (données) Chaque page des trois PDF : la tête, la diagonale, « Page k sur N », et le contenu d’origine gardé');
await sousGarde('E.2', async () => {
  const fautes = [];
  let pages = 0;
  for (const n of PDF_DE_DONNEES) {
    for (const [textes, tete] of [[MARQUES_ESSAI, ORACLE_TETE.essai], [MARQUES_EXEMPLE, ORACLE_TETE.exemple]]) {
      const source = await PDFLib.PDFDocument.load(lirePdfDeDonnees(n), { updateMetadata: false });
      const t = await tamponEssai(lirePdfDeDonnees(n), { textes });
      const d = await PDFLib.PDFDocument.load(t.octets);
      const total = d.getPageCount();
      d.getPages().forEach((p, k) => {
        pages += 1;
        const c = contenuDeLaPage(d, p);
        const manque = [[tete, 'la tête'], ['APERÇU', 'la diagonale'], [`Devis DEV-2026-···· — Page ${k + 1} sur ${total}`, 'le pied']]
          .filter(([texte]) => !contientHex(c, texte)).map(([, quoi]) => quoi);
        const origine = contenuDeLaPage(source, source.getPage(k));
        if (origine.length < 20 || !c.includes(origine)) manque.push('le contenu d’origine');
        if (!/0\.8191\d*\s+0\.5735\d*\s+-0\.5735\d*\s+0\.8191\d*\s+[-\d.]+\s+[-\d.]+\s+(cm|Tm)\b/.test(c)) manque.push('la rotation de 35°');
        if (manque.length) fautes.push(`${n}, page ${k + 1} : ${manque.join(', ')}`);
      });
    }
  }
  verifier(`E.2 sur ${pages} pages tamponnées (deux jeux de marques) : la tête en toutes lettres, « APERÇU » à 35°, `
    + '« Devis DEV-2026-···· — Page k sur N », lus dans le flux DÉCODÉ, et le flux d’origine entier', fautes.length === 0 && pages >= 12,
  fautes.slice(0, 4).join(' | '));
});

section('E.5 (données) Les polices : Inter et Oswald embarquées par Chromium, lues aussi quand la page est un XObject');
await sousGarde('E.5', async () => {
  const fautes = [];
  for (const n of PDF_DE_DONNEES) {
    const t = await tamponEssai(lirePdfDeDonnees(n));
    const p = t.polices;
    if (issueDesPolices(p) !== 'opus' || !egal(p.noms, ['Inter-Bold', 'Inter-Regular', 'Oswald-SemiBold']) || p.images !== 0
      || p.aucune !== false || !egal(p.autres, []) || !egal(p.standard, [])) fautes.push(`${n} : ${JSON.stringify(p)}`);
  }
  verifier('E.5 les trois → « opus » : Inter-Bold, Inter-Regular, Oswald-SemiBold, aucune autre, aucune image — la variante '
    + 'XObject comprise (lue dans TOUS les objets, pas dans les ressources des pages)', fautes.length === 0, fautes.join(' | '));
});

section('E.6 (données) Les métadonnées des PDF de Chromium : lues, et laissées telles quelles');
await sousGarde('E.6', async () => {
  const fautes = [];
  for (const n of DE_CHROMIUM) {
    const t = await tamponEssai(lirePdfDeDonnees(n));
    const d = await PDFLib.PDFDocument.load(t.octets, { updateMetadata: false });
    const m = t.metadonnees;
    if (m.titre !== 'Aperçu du devis' || !/^Skia\/PDF/.test(m.producteur || '') || !/Chrome/.test(m.createur || '')
      || d.getTitle() !== m.titre || d.getProducer() !== m.producteur || d.getCreator() !== m.createur) fautes.push(`${n} : ${JSON.stringify(m)}`);
  }
  verifier('E.6 Title « Aperçu du devis » (le <title> du gabarit), Producer Skia/PDF, Creator Chrome : lus, et INCHANGÉS par le tampon',
    fautes.length === 0, fautes.join(' | '));
});

section('E.7 (données) Le déterminisme du tampon sur les trois, et l’empreinte FNV-1a du témoin (K9)');
await sousGarde('E.7', async () => {
  const fautes = [];
  for (const n of PDF_DE_DONNEES) {
    const a = await tamponEssai(lirePdfDeDonnees(n));
    const b = await tamponEssai(lirePdfDeDonnees(n));
    if (Buffer.compare(Buffer.from(a.octets), Buffer.from(b.octets)) !== 0) fautes.push(n);
  }
  verifier('E.7 deux tampons de chacun des trois : les MÊMES octets', fautes.length === 0, fautes.join(' | '));
  const temoin = await tamponEssai(lirePdfDeDonnees('apercu-chromium-1.pdf'));
  console.log(`  … le témoin (apercu-chromium-1.pdf, marques d’essai), tamponné : FNV-1a ${empreinteFnv1a(temoin.octets)}, `
    + `${temoin.octets.length} octets — la valeur que les Détails doivent montrer sous Hermes (figée en B.15).`);
});

/* ================================================================== */
/*  F. LA FABRICATION — de faux outils, une fausse horloge, le VRAI      */
/*     tampon                                                           */
/* ================================================================== */

/* Une horloge qu'on avance à la main : `attendre(ms)` ne finit que quand on
   l'a avancée d'autant. */
function creerHorloge(depart = MAINTENANT) {
  let t = depart;
  const attentes = [];
  return {
    maintenant: () => t,
    attendre: (ms) => new Promise((r) => { attentes.push({ a: t + ms, r }); }),
    avancer: (ms) => {
      t += ms;
      attentes.filter((x) => x.a <= t).forEach((x) => { attentes.splice(attentes.indexOf(x), 1); x.r(); });
    },
  };
}
const vider = async (n = 40) => { for (let k = 0; k < n; k += 1) await new Promise((r) => { setImmediate(r); }); };
const differe = () => {
  let tenir = null;
  let lacher = null;
  const promesse = new Promise((r, j) => { tenir = r; lacher = j; });
  return { promesse, tenir, lacher };
};
const DOSSIER_APERCU = 'file:///docs/apercu-devis';
const DOSSIER_IMPRESSION = 'file:///cache/Print';
/* De faux outils : un disque en mémoire (un dossier doit être CRÉÉ avant
   qu'on y écrive), et chaque appel noté. */
function creerOutils(o = {}) {
  const fichiers = new Map(o.fichiers || []);
  const dossiers = new Set();
  const appels = [];
  const horloge = o.horloge || creerHorloge();
  let id = 0;
  let bruts = 0;
  const outils = {
    pdfLib: Object.prototype.hasOwnProperty.call(o, 'pdfLib') ? o.pdfLib : PDFLib,
    dossierApercu: DOSSIER_APERCU,
    dossierImpression: DOSSIER_IMPRESSION,
    imprimer: async (options) => {
      appels.push(['imprimer', options]);
      if (o.imprimer) return o.imprimer(options, fichiers);
      bruts += 1;
      const uri = `${DOSSIER_IMPRESSION}/brut-${bruts}.pdf`;
      fichiers.set(uri, o.pdf || TEMOIN);
      return { uri, numberOfPages: o.pages ?? 2 };
    },
    lireOctets: async (uri) => {
      appels.push(['lireOctets', uri]);
      if (o.lireOctets) return o.lireOctets(uri);
      if (!fichiers.has(uri)) throw new Error(`absent : ${uri}`);
      return fichiers.get(uri);
    },
    creerDossier: (d) => { appels.push(['creerDossier', d]); dossiers.add(d); },
    ecrire: async (uri, octets) => {
      appels.push(['ecrire', uri]);
      if (o.ecrire) return o.ecrire(uri);
      if (!dossiers.has(uri.slice(0, uri.lastIndexOf('/')))) throw new Error('le dossier n’existe pas');
      fichiers.set(uri, octets);
      return undefined;
    },
    effacer: (uri) => {
      appels.push(['effacer', uri]);
      if (o.effacer) o.effacer(uri);
      fichiers.delete(uri);
    },
    lister: (d) => {
      appels.push(['lister', d]);
      if (o.lister) return o.lister(d);
      return [...fichiers.keys()].filter((u) => u.startsWith(`${d}/`));
    },
    existe: (uri) => fichiers.has(uri),
    maintenant: horloge.maintenant,
    attendre: horloge.attendre,
    nouvelId: () => { id += 1; return `id-${id}`; },
  };
  (o.retirer || []).forEach((k) => { delete outils[k]; });
  return { outils, fichiers, dossiers, appels, horloge };
}
const fabriquerEssai = (fab) => fab.fabriquer({ html: '<!doctype html>', textes: MARQUES_ESSAI, numeroAffiche: 'DEV-2026-····' });

section('F.1 Le chemin nominal : la mise en page en A4, le brut effacé, le dossier créé, l’aperçu marqué');
await sousGarde('F.1', async () => {
  const f = creerOutils({ fichiers: [[`${DOSSIER_APERCU}/ancien.pdf`, TEMOIN], [`${DOSSIER_IMPRESSION}/vieux.pdf`, TEMOIN]] });
  const fab = creerFabrique(f.outils);
  const r = await fabriquerEssai(fab);
  const imp = f.appels.find(([n]) => n === 'imprimer');
  verifier('F.1 l’impression reçoit EXACTEMENT { html, width 595,28, height 841,89, margins 56,69 / 42,52 / 56,69 / 42,52, base64: false } — '
    + 'ni format, ni useMarkupFormatter', !!imp && egal(imp[1], { html: '<!doctype html>', width: 595.28, height: 841.89,
    margins: { top: 56.69, right: 42.52, bottom: 56.69, left: 42.52 }, base64: false }), JSON.stringify(imp && imp[1]));
  const ordre = (nom) => f.appels.findIndex(([n]) => n === nom);
  verifier('F.1 réussi : l’aperçu rangé dans apercu-devis/id-1.pdf, deux pages, le brut EFFACÉ et dit « pas encore là »',
    r.ok === true && r.uri === `${DOSSIER_APERCU}/id-1.pdf` && r.pages === 2 && r.pagesTelephone === 2 && f.fichiers.has(r.uri)
    && !f.fichiers.has(`${DOSSIER_IMPRESSION}/brut-1.pdf`) && r.brutEncoreLa === false && r.octets === f.fichiers.get(r.uri).length,
    JSON.stringify({ ...r, polices: undefined }));
  verifier('F.1 la purge d’abord (l’ancien aperçu et le vieux brut partis), puis la mise en page ; le dossier CRÉÉ avant l’écriture',
    !f.fichiers.has(`${DOSSIER_APERCU}/ancien.pdf`) && !f.fichiers.has(`${DOSSIER_IMPRESSION}/vieux.pdf`) && ordre('lister') < ordre('imprimer')
    && ordre('creerDossier') >= 0 && ordre('creerDossier') < ordre('ecrire'), JSON.stringify(f.appels.map(([n]) => n)));
  const relu = await PDFLib.PDFDocument.load(f.fichiers.get(r.uri));
  verifier('F.1 le fichier rangé est le PDF MARQUÉ (« Page 2 sur 2 » sur sa page 2)', relu.getPageCount() === 2
    && contientHex(contenuDeLaPage(relu, relu.getPage(1)), 'Devis DEV-2026-···· — Page 2 sur 2'), '');
  verifier('F.1 les durées de chaque étape, les polices et les métadonnées sont rendues', egal(Object.keys(r.durees).sort(),
    ['ecriture', 'marque', 'miseEnPage', 'purge', 'relecture', 'total']) && issueDesPolices(r.polices) === 'opus' && egal(r.metadonnees, META_TEMOIN)
    && fab.enCours() === null, JSON.stringify(r.durees));
  verifier('F.1 les outils requis, en littéraux ; les délais, 60 s et 90 s (« jusqu’à une minute », dit l’écran)', egal(OUTILS_REQUIS, ['imprimer', 'lireOctets', 'creerDossier',
    'ecrire', 'effacer', 'lister', 'existe', 'maintenant', 'attendre', 'nouvelId']) && DELAI_DOUX === 60000 && DELAI_DUR === 90000, '');
});
/* ------------------------------------------------------------------ */
/*  L'ARBRE DES ENVELOPPES (F.2, G.3, G.4, H.2 à H.4, I.1)             */
/* ------------------------------------------------------------------ */
/* Les enveloppes chargent React Native : `node` ne les ouvre pas. On les
   LIT, par l'arbre de TypeScript (un commentaire qui nomme un module ne
   compte pas, une forme écrite sur trois lignes se voit). */
const arbreDe = (f) => ts.createSourceFile(f, lire(f), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function noeudsDe(racine, garder) {
  const r = [];
  const v = (n) => { if (garder(n)) r.push(n); ts.forEachChild(n, v); };
  v(racine);
  return r;
}
const estAppelDe = (n, nom) => ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === nom;
const premierArgument = (n) => (n.arguments[0] && ts.isStringLiteralLike(n.arguments[0]) ? n.arguments[0].text : null);
const fonctionDe = (n) => { for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return p; return null; };
/* La première INSTRUCTION qui contient un nœud — le chemin que suit Metro
   (`isOptionalDependency`) : un `if` sans accolades est une instruction. */
const instructionDe = (n) => {
  for (let p = n.parent; p; p = p.parent) if (/Statement$/.test(ts.SyntaxKind[p.kind])) return p;
  return null;
};
const importsStatiquesDe = (sf) => sf.statements
  .filter((s) => (ts.isImportDeclaration(s) || ts.isExportDeclaration(s)) && s.moduleSpecifier)
  .map((s) => s.moduleSpecifier.text);
const requiresDe = (racine) => noeudsDe(racine, (n) => estAppelDe(n, 'require') && premierArgument(n) !== null);
const balisesJsx = (sf, nom) => noeudsDe(sf, (n) => (ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n))
  && n.tagName.getText(sf) === nom);
const attributDe = (el, nom) => el.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText() === nom) || null;
/* Le texte d'une fonction `const nom = … => { … };` de la saisie, sans
   commentaires et les blancs réduits : une fonction FIGÉE se compare ainsi. */
const reduit = (t) => sansCommentaires(t).replace(/\s+/g, ' ').trim();
function constanteDe(code, nom) {
  const debut = code.indexOf(`\n  const ${nom} = `);
  if (debut < 0) return null;
  const fin = code.indexOf('\n  };\n', debut);
  return fin < 0 ? null : code.slice(debut + 1, fin + 5);
}

section('F.2 L’enveloppe du téléphone (devis-pdf.js) : pdf-lib et expo-print chargés au geste, dans la forme que Metro tient pour facultative');
await sousGarde('F.2', async () => {
  const f = 'src/lib/devis-pdf.js';
  const sf = arbreDe(f);
  const req = requiresDe(sf);
  const de = (m) => req.filter((n) => premierArgument(n) === m);

  const pdf = de('@cantoo/pdf-lib');
  const formePdf = pdf.length === 1 && (() => {
    const st = instructionDe(pdf[0]);
    const bloc = st && st.parent;
    return !!bloc && ts.isBlock(bloc) && ts.isTryStatement(bloc.parent) && bloc.parent.tryBlock === bloc && !!fonctionDe(bloc.parent);
  })();
  verifier('F.2 `require(\'@cantoo/pdf-lib\')` : UN seul, dans une instruction enfant DIRECTE du bloc d’un `try` (jamais derrière '
    + 'un `if` à accolades, jamais dans le `finally`), dans une fonction (D29)', formePdf,
  pdf.map((n) => (instructionDe(n) ? instructionDe(n).getText(sf) : '?')).join(' | ') || 'aucun');

  const impression = de('expo-print');
  const fonction = impression.length === 1 ? fonctionDe(impression[0]) : null;
  const sonde = fonction ? noeudsDe(fonction, (n) => estAppelDe(n, 'requireOptionalNativeModule') && premierArgument(n) === 'ExpoPrint') : [];
  verifier('F.2 `require(\'expo-print\')` : UN seul, dans une fonction, APRÈS `requireOptionalNativeModule(\'ExpoPrint\')` dans la même',
    !!fonction && sonde.length === 1 && sonde[0].getStart(sf) < impression[0].getStart(sf), `${impression.length} require, ${sonde.length} sonde`);

  const interdits = ['expo-print', 'react-native-webview', '@cantoo/pdf-lib', 'react-native-share'];
  const enHaut = importsStatiquesDe(sf).filter((m) => interdits.includes(m) || /polices-devis|apercu-exemples|pdf-temoin/.test(m));
  const auModule = req.filter((n) => !fonctionDe(n)).map((n) => premierArgument(n));
  verifier('F.2 devis-pdf.js n’importe en haut ni expo-print, ni react-native-webview, ni pdf-lib, ni les polices, les exemples ou le '
    + 'témoin ; aucun `require` au niveau du module', enHaut.length === 0 && auModule.length === 0, [...enHaut, ...auModule].join(', '));

  const formateurs = ['src/lib/devis-pdf.js', 'src/lib/fabrication-apercu.js'].flatMap((x) => {
    const a = arbreDe(x);
    return noeudsDe(a, (n) => ((ts.isPropertyAssignment(n) || ts.isShorthandPropertyAssignment(n))
      && ['format', 'useMarkupFormatter'].includes(n.name.getText(a))) || (ts.isIdentifier(n) && n.text === 'useMarkupFormatter'))
      .map((n) => `${x} : ${n.getText(a).slice(0, 50)}`);
  });
  verifier('F.2 ni `useMarkupFormatter`, ni `format` passés à l’impression (les mesures de `format-a4.js` décident seules)',
    formateurs.length === 0, formateurs.join(' | '));

  /* Les deux enveloppes rendent les MÊMES noms : `devis-pdf` s'importe SANS
     extension, et Metro prend l'une ou l'autre selon la plateforme (K12). */
  const exportes = (a) => a.statements.filter((s) => (ts.isFunctionDeclaration(s) || ts.isVariableStatement(s))
    && (s.modifiers || []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword))
    .flatMap((s) => (ts.isFunctionDeclaration(s) ? [s.name.text] : s.declarationList.declarations.map((d) => d.name.getText(a))))
    .sort();
  const web = arbreDe('src/lib/devis-pdf.web.js');
  verifier('F.2 devis-pdf.web.js rend les MÊMES noms que devis-pdf.js', egal(exportes(sf), exportes(web)),
    `${exportes(sf).join(', ')} / ${exportes(web).join(', ')}`);
  const webInterdits = [...importsStatiquesDe(web), ...requiresDe(web).map(premierArgument)]
    .filter((m) => [...interdits, 'expo-file-system', 'expo', 'react-native'].includes(m));
  verifier('F.2 devis-pdf.web.js ne nomme ni expo-print, ni react-native-webview, ni pdf-lib, ni expo-file-system',
    webInterdits.length === 0, webInterdits.join(', '));

  const W = await import(pathToFileURL(path.resolve('src/lib/devis-pdf.web.js')).href);
  const fw = W.fabriqueDuTelephone();
  const r = await fw.fabriquer({ html: '<p>x</p>' });
  verifier('F.2 la fabrique du navigateur, jouée : `surLeWeb`, aucune fabrication (l’étape `web`), rien à effacer, aucune empreinte',
    fw.surLeWeb === true && r.ok === false && r.etape === 'web' && fw.enCours() === null && W.effacerApercu('file:///x.pdf') === false
    && W.purgerApercus() === 0 && (await W.empreintesDuTelephone()) === null, JSON.stringify(r));

  /* LES VRAIS OUTILS DU TÉLÉPHONE, FIGÉS PAR L'ARBRE (relecture « contrôles »
     du 27/11) : F.1 joue la fabrique avec des faux, F.2 ne lisait que la
     forme des `require`. Un effacement neutralisé laissait sur le téléphone
     le PDF brut d'expo-print — sans la marque « APERÇU », avec le nom et
     l'adresse du client —, et plus aucun aperçu ne se purgeait, sans qu'un
     contrôle rougisse. Chaque clé de l'objet rendu, avec le texte EXACT de sa
     valeur ; et les deux fonctions de nettoyage, ENTIÈRES. */
  const OUTILS_FIGES = {
    imprimer: '(options) => impression.printToFileAsync(options)',
    lireOctets: '(uri) => new File(uri).bytes()',
    creerDossier: '(uri) => { new Directory(uri).create({ intermediates: true, idempotent: true }); }',
    ecrire: '(uri, octets) => { new File(uri).write(octets); }',
    effacer: 'effacerFichier',
    lister: 'listerDossier',
    existe: '(uri) => new File(uri).exists',
    pdfLib: 'get pdfLib() { return modulePdf(); }',
    maintenant: '() => Date.now()',
    attendre: '(ms) => new Promise((resoudre) => { setTimeout(resoudre, ms); })',
    nouvelId: '() => nouvelIdentifiant() || `apercu-${Date.now()}`',
    dossierApercu: 'new Directory(Paths.cache, \'apercu-devis\').uri',
    dossierImpression: 'new Directory(Paths.cache, \'Print\').uri',
  };
  const fnOutils = sf.statements.find((s) => ts.isFunctionDeclaration(s) && s.name && s.name.text === 'outilsDuTelephone');
  const retours = fnOutils ? noeudsDe(fnOutils, (n) => ts.isReturnStatement(n) && !!n.expression && ts.isObjectLiteralExpression(n.expression)) : [];
  const vus = {};
  if (retours.length === 1) {
    for (const prop of retours[0].expression.properties) {
      const nom = prop.name ? prop.name.getText(sf) : '?';
      vus[nom] = reduit(ts.isPropertyAssignment(prop) ? prop.initializer.getText(sf) : prop.getText(sf));
    }
  }
  const attendus = Object.fromEntries(Object.entries(OUTILS_FIGES).map(([k, v]) => [k, reduit(v)]));
  verifier('F.2 `outilsDuTelephone()` rend UN objet, figé clé par clé (l’effacement, la purge, le dossier créé `idempotent`, l’écriture)',
    retours.length === 1 && egal(vus, attendus), JSON.stringify(Object.keys(vus).filter((k) => vus[k] !== attendus[k])));
  const FONCTIONS_FIGEES = {
    effacerFichier: 'function effacerFichier(uri) { try { const f = new File(uri); if (f.exists) f.delete(); } catch (e) { /* rien */ } }',
    listerDossier: 'function listerDossier(uri) { try { return new Directory(uri).list().map((x) => x.uri); } catch (e) { return []; } }',
  };
  const corpsFaux = Object.entries(FONCTIONS_FIGEES).filter(([nom, texte]) => {
    const fn = sf.statements.find((s) => ts.isFunctionDeclaration(s) && s.name && s.name.text === nom);
    return !fn || reduit(fn.getText(sf)) !== reduit(texte);
  }).map(([nom]) => nom);
  verifier('F.2 `effacerFichier` et `listerDossier`, ENTIÈRES (un fichier qui existe est effacé ; un dossier absent, c’est « rien »)',
    corpsFaux.length === 0, corpsFaux.join(', '));
});

section('F.3 Chaque échec a son étape et sa phrase, en toutes lettres');
await sousGarde('F.3', async () => {
  const P = {
    module: '[module] Cette version d’Opus ne sait pas encore fabriquer un aperçu : mettez Opus à jour.',
    moduleAbsent: '[module] Le module des PDF manque à ce paquet d’Opus : sur l’ordinateur, arrêtez le serveur (Ctrl+C), '
      + 'lancez « npm ci », puis « npx expo start -c ».',
    tropLong: '[mise en page] Le téléphone met trop longtemps à fabriquer les pages.',
    rendu: '[mise en page] Le téléphone n’a pas pu fabriquer les pages.',
    vide: '[mise en page] Le téléphone a rendu un document vide.',
    lecture: '[lecture] Le document fabriqué n’a pas pu être relu.',
    marque: '[marque sur chaque page] L’aperçu n’a pas pu être marqué sur chaque page : il n’est pas montré.',
    ecriture: '[écriture] L’aperçu n’a pas pu être rangé sur le téléphone.',
  };
  verifier('F.3 les phrases de la fabrication, en toutes lettres', egal(PHRASES_DE_LA_FABRICATION, P), JSON.stringify(PHRASES_DE_LA_FABRICATION));
  const brutVide = (pages) => (options, fichiers) => { fichiers.set(`${DOSSIER_IMPRESSION}/b.pdf`, TEMOIN); return { uri: `${DOSSIER_IMPRESSION}/b.pdf`, numberOfPages: pages }; };
  const CAS_F = [
    ['l’impression ne rend rien', { imprimer: () => undefined }, 'validité', P.vide],
    ['une adresse qui n’est pas une chaîne', { imprimer: () => ({ uri: 3, numberOfPages: 2 }) }, 'validité', P.vide],
    ['zéro page annoncée', { imprimer: brutVide(0) }, 'validité', P.vide, { efface: `${DOSSIER_IMPRESSION}/b.pdf` }],
    ['pdf-lib absent du paquet', { pdfLib: { absent: true, erreur: new Error('Cannot find module \'@cantoo/pdf-lib\'') } }, 'module',
      P.moduleAbsent, { detail: /Cannot find module/, sansImpression: true }],
    ['pdf-lib absent du paquet (Metro)', { pdfLib: { absent: true, erreur: new Error('Requiring unknown module "1234".') } }, 'module',
      P.moduleAbsent, { detail: /Requiring unknown module/, sansImpression: true }],
    ['pdf-lib qui plante à son chargement', { pdfLib: { absent: true, erreur: new TypeError('undefined is not a function') } }, 'module',
      P.module, { detail: /undefined is not a function/, sansImpression: true }],
    ['pdf-lib qui lève', { pdfLib: { ...PDFLib, PDFDocument: { load: async () => { throw new Error('casse'); } } } }, 'marque', P.marque,
      { efface: `${DOSSIER_IMPRESSION}/brut-1.pdf`, sansEcriture: true }],
    ['l’impression lève', { imprimer: () => { throw new Error('WKWebView'); } }, 'mise en page', P.rendu, { detail: /WKWebView/ }],
    ['la relecture lève', { lireOctets: () => { throw new Error('illisible'); } }, 'lecture', P.lecture, { efface: `${DOSSIER_IMPRESSION}/brut-1.pdf` }],
    ['la relecture ne rend aucun octet', { lireOctets: () => new Uint8Array(0) }, 'lecture', P.lecture],
    ['l’écriture lève', { ecrire: () => { throw new Error('disque plein'); } }, 'écriture', P.ecriture, { efface: `${DOSSIER_APERCU}/id-1.pdf` }],
    ['un PDF de zéro page derrière une page annoncée', { pdf: ZERO_PAGE, pages: 1 }, 'marque', P.vide],
    ['aucun outil', null, 'module', P.module, { detail: /aucun outil/ }],
    ['un outil manque', { retirer: ['nouvelId'] }, 'module', P.module, { detail: /outils absents : nouvelId/ }],
  ];
  const fautes = [];
  for (const [nom, o, etape, phrase, plus = {}] of CAS_F) {
    const f = o === null ? null : creerOutils(o);
    const r = await fabriquerEssai(creerFabrique(f ? f.outils : null));
    const noms = f ? f.appels.map(([n]) => n) : [];
    const ecarts = [];
    if (r.ok !== false || r.etape !== etape || r.phrase !== phrase) ecarts.push(`${r.etape} « ${r.phrase} »`);
    if (plus.detail && !plus.detail.test(String(r.detail))) ecarts.push(`détail « ${r.detail} »`);
    if (plus.efface && !f.appels.some(([n, u]) => n === 'effacer' && u === plus.efface)) ecarts.push(`${plus.efface} pas effacé`);
    if (plus.sansImpression && noms.includes('imprimer')) ecarts.push('l’impression a été appelée');
    if (plus.sansEcriture && noms.includes('ecrire')) ecarts.push('quelque chose a été écrit');
    if (f && [...f.fichiers.keys()].some((u) => u.startsWith(`${DOSSIER_APERCU}/`))) ecarts.push('un aperçu reste rangé');
    if (ecarts.length) fautes.push(`${nom} : ${ecarts.join(', ')}`);
  }
  verifier(`F.3 ${CAS_F.length} échecs : l’étape, la phrase EXACTE, le détail, le brut effacé, aucun aperçu laissé`, fautes.length === 0,
    fautes.join(' | '));
  const sansEffacer = creerOutils({ effacer: () => { throw new Error('verrouillé'); } });
  const r1 = await fabriquerEssai(creerFabrique(sansEffacer.outils));
  verifier('F.3 un effacement qui lève ne fait pas perdre l’aperçu — et le brut est dit « encore là »', r1.ok === true && r1.brutEncoreLa === true,
    JSON.stringify({ ok: r1.ok, brutEncoreLa: r1.brutEncoreLa }));
  const sansLister = creerOutils({ lister: () => { throw new Error('pas de dossier'); } });
  const r2 = await fabriquerEssai(creerFabrique(sansLister.outils));
  verifier('F.3 une purge qui lève ne fait pas perdre l’aperçu', r2.ok === true, JSON.stringify({ ok: r2.ok, etape: r2.etape }));
});

section('F.4 Le délai doux (60 s) : l’échec dit, le verrou TENU, le brut tardif effacé à son arrivée');
await sousGarde('F.4', async () => {
  const rendu = differe();
  const f = creerOutils({ imprimer: () => rendu.promesse });
  const fab = creerFabrique(f.outils);
  const p = fabriquerEssai(fab);
  await vider();
  const avant = fab.enCours();
  f.horloge.avancer(59999);
  await vider();
  const encore = await Promise.race([p.then(() => 'fini'), vider(5).then(() => 'en cours')]);
  f.horloge.avancer(1);
  const r = await p;
  const tenu = fab.enCours() !== null;
  f.fichiers.set(`${DOSSIER_IMPRESSION}/tard.pdf`, TEMOIN);
  rendu.tenir({ uri: `${DOSSIER_IMPRESSION}/tard.pdf`, numberOfPages: 2 });
  await vider();
  verifier('F.4 à 59,999 s rien ; à 60 s « [mise en page] Le téléphone met trop longtemps à fabriquer les pages. »',
    avant !== null && encore === 'en cours' && r.ok === false && r.etape === 'mise en page'
    && r.phrase === '[mise en page] Le téléphone met trop longtemps à fabriquer les pages.', `${encore} ${r.etape} ${r.phrase}`);
  verifier('F.4 le verrou reste TENU tant que le rendu tourne ; à son arrivée, son fichier est effacé et le verrou rendu',
    tenu && !f.fichiers.has(`${DOSSIER_IMPRESSION}/tard.pdf`) && fab.enCours() === null
    && !f.appels.some(([n]) => n === 'ecrire'), `${tenu} ${f.fichiers.has(`${DOSSIER_IMPRESSION}/tard.pdf`)} ${fab.enCours()}`);
});

section('F.5 Le délai dur (90 s) : un rendu qui ne revient jamais rend le verrou');
await sousGarde('F.5', async () => {
  let premiers = 0;
  const f = creerOutils({
    imprimer: (options, fichiers) => {
      premiers += 1;
      if (premiers === 1) return new Promise(() => {});
      fichiers.set(`${DOSSIER_IMPRESSION}/b2.pdf`, TEMOIN);
      return { uri: `${DOSSIER_IMPRESSION}/b2.pdf`, numberOfPages: 2 };
    },
  });
  const fab = creerFabrique(f.outils);
  const p = fabriquerEssai(fab);
  await vider();
  f.horloge.avancer(60000);
  const r = await p;
  await vider();
  f.horloge.avancer(29999);
  await vider();
  const tenuA89 = fab.enCours() !== null;
  f.horloge.avancer(1);
  await vider();
  const libreA90 = fab.enCours() === null;
  const r2 = await fabriquerEssai(fab);
  verifier('F.5 refus à 60 s ; verrou tenu jusqu’à 89,999 s, rendu à 90 s ; un nouvel aperçu se fabrique ensuite',
    r.etape === 'mise en page' && tenuA89 && libreA90 && r2.ok === true, `${r.etape} ${tenuA89} ${libreA90} ${r2.ok}`);
});

section('F.6 Deux aperçus demandés coup sur coup : un rendu à la fois');
await sousGarde('F.6', async () => {
  let actifs = 0;
  let maximum = 0;
  let n = 0;
  const f = creerOutils({
    imprimer: async (options, fichiers) => {
      actifs += 1;
      maximum = Math.max(maximum, actifs);
      n += 1;
      const uri = `${DOSSIER_IMPRESSION}/b${n}.pdf`;
      fichiers.set(uri, TEMOIN);
      await vider(5);
      actifs -= 1;
      return { uri, numberOfPages: 2 };
    },
  });
  const fab = creerFabrique(f.outils);
  const a = fabriquerEssai(fab);
  const tenu = fab.enCours() !== null;
  const b = fabriquerEssai(fab);
  const [ra, rb] = await Promise.all([a, b]);
  verifier('F.6 le verrou est pris dès l’appel ; les deux rendus passent l’un APRÈS l’autre ; deux aperçus distincts',
    tenu && maximum === 1 && n === 2 && ra.ok && rb.ok && ra.uri !== rb.uri && fab.enCours() === null, `${tenu} max ${maximum} n ${n}`);
  verifier('F.6 le second aperçu a purgé le premier (un seul aperçu sur le téléphone)', !f.fichiers.has(ra.uri) && f.fichiers.has(rb.uri), '');
});

section('F.7 La purge : apercu-devis/ entier, les seuls .pdf de l’impression, jamais d’erreur');
await sousGarde('F.7', async () => {
  const f = creerOutils({
    fichiers: [[`${DOSSIER_APERCU}/a.pdf`, TEMOIN], [`${DOSSIER_APERCU}/b.pdf`, TEMOIN], [`${DOSSIER_IMPRESSION}/x.pdf`, TEMOIN],
      [`${DOSSIER_IMPRESSION}/y.txt`, TEMOIN], ['file:///docs/autre/z.pdf', TEMOIN]],
  });
  const fab = creerFabrique(f.outils);
  const n = fab.purger();
  verifier('F.7 trois fichiers effacés ; y.txt et autre/z.pdf restent', n === 3 && egal([...f.fichiers.keys()].sort(),
    [`${DOSSIER_IMPRESSION}/y.txt`, 'file:///docs/autre/z.pdf'].sort()), JSON.stringify([...f.fichiers.keys()]));
  const absents = creerOutils({ lister: () => { throw new Error('dossier absent'); } });
  let e = null;
  let m = null;
  try { m = creerFabrique(absents.outils).purger(); } catch (x) { e = x; }
  const sansOutils = creerFabrique(null);
  verifier('F.7 un dossier absent, ou aucun outil : la purge rend 0 et ne lève pas', e === null && m === 0 && sansOutils.purger() === 0
    && sansOutils.effacer('file:///x.pdf') === false, String(e));
});

/* ================================================================== */
/*  G. LES RÉGLAGES DE L'AFFICHEUR                                      */
/* ================================================================== */

section('G.1 Les réglages de la WebView, par VALEUR');
verifier('G.1 originWhitelist [*], allowsLinkPreview faux, textInteractionEnabled faux, menuItems [], dataDetectorTypes none, '
  + 'incognito vrai, javaScriptEnabled faux — et rien d’autre', egal(PROPS_AFFICHEUR, {
  originWhitelist: ['*'], allowsLinkPreview: false, textInteractionEnabled: false, menuItems: [], dataDetectorTypes: 'none', incognito: true,
  javaScriptEnabled: false,
}) && Object.isFrozen(PROPS_AFFICHEUR) && Object.isFrozen(PROPS_AFFICHEUR.originWhitelist) && Object.isFrozen(PROPS_AFFICHEUR.menuItems)
  && ['allowingReadAccessToURL', 'allowFileAccess', 'allowFileAccessFromFileURLs', 'allowUniversalAccessFromFileURLs',
    'onShouldStartLoadWithRequest', 'source', 'injectedJavaScript'].every((k) => !(k in PROPS_AFFICHEUR)) && DELAI_AFFICHAGE === 10000,
JSON.stringify(PROPS_AFFICHEUR));

section('G.2 L’adresse permise : le fichier de l’aperçu, et lui seul');
await sousGarde('G.2', async () => {
  const ATTENDUE = 'file:///var/mobile/Containers/Data/Application/ABC/Documents/apercu-devis/id-1.pdf';
  const TABLE = [
    ['la même', ATTENDUE, ATTENDUE, true],
    ['sans file://', '/var/mobile/Containers/Data/Application/ABC/Documents/apercu-devis/id-1.pdf', ATTENDUE, true],
    ['avec /private devant /var', 'file:///private/var/mobile/Containers/Data/Application/ABC/Documents/apercu-devis/id-1.pdf', ATTENDUE, true],
    ['une espace écrite %20', 'file:///var/Mes%20Docs/id-1.pdf', 'file:///var/Mes Docs/id-1.pdf', true],
    ['un autre fichier du même dossier', 'file:///var/mobile/Containers/Data/Application/ABC/Documents/apercu-devis/id-2.pdf', ATTENDUE, false],
    ['le dossier seul', 'file:///var/mobile/Containers/Data/Application/ABC/Documents/apercu-devis/', ATTENDUE, false],
    ['une page web au même chemin', 'https://exemple.test/var/mobile/Containers/Data/Application/ABC/Documents/apercu-devis/id-1.pdf', ATTENDUE, false],
    ['about:blank', 'about:blank', ATTENDUE, false],
    ['une adresse vide', '', ATTENDUE, false],
    ['rien', null, ATTENDUE, false],
    ['un nombre', 42, ATTENDUE, false],
    ['une barre oblique écrite %2F', 'file:///var/a%2Fb.pdf', 'file:///var/a/b.pdf', false],
    ['un %xx illisible', 'file:///var/a%E0%A4%A.pdf', 'file:///var/a.pdf', false],
    ['une remontée ..', `${ATTENDUE}/../id-2.pdf`, ATTENDUE, false],
    ['la racine', 'file:///', 'file:///', false],
    ['aucune adresse attendue', ATTENDUE, null, false],
  ];
  const fautes = TABLE.filter(([, vue, attendue, oui]) => adresseAutorisee(vue, attendue) !== oui).map(([nom]) => nom);
  verifier(`G.2 ${TABLE.length} adresses : vrai pour le fichier de l’aperçu (avec ou sans file://, avec /private, %20 décodé), `
    + 'faux pour tout le reste', fautes.length === 0, fautes.join(' | '));
});
section('G.3 L’afficheur du téléphone (AfficheurPdf.js) : les réglages étalés EN DERNIER, la porte qui ne laisse passer que le fichier');
await sousGarde('G.3', async () => {
  const f = 'src/components/AfficheurPdf.js';
  const sf = arbreDe(f);
  const vues = balisesJsx(sf, 'WebView');
  const props = vues.length === 1 ? vues[0].attributes.properties : [];
  const etalees = props.filter((a) => ts.isJsxSpreadAttribute(a));
  const derniere = props[props.length - 1];
  verifier('G.3 UNE `WebView`, et `{...PROPS_AFFICHEUR}` est son SEUL étalement, posé EN DERNIER (un attribut écrit après le remplacerait)',
    vues.length === 1 && etalees.length === 1 && !!derniere && ts.isJsxSpreadAttribute(derniere)
    && derniere.expression.getText(sf) === 'PROPS_AFFICHEUR', props.map((a) => a.getText(sf).slice(0, 40)).join(' | '));
  verifier('G.3 aucune étiquette `accessibilityLabel` sur la `WebView` (E-m5 : elle cacherait le PDF à VoiceOver)',
    vues.length === 1 && !attributDe(vues[0], 'accessibilityLabel'), '');
  const porte = vues.length === 1 ? attributDe(vues[0], 'onShouldStartLoadWithRequest') : null;
  const nomPorte = porte && porte.initializer && ts.isJsxExpression(porte.initializer) && porte.initializer.expression
    && ts.isIdentifier(porte.initializer.expression) ? porte.initializer.expression.text : null;
  const declaration = nomPorte ? noeudsDe(sf, (n) => ts.isVariableDeclaration(n) && n.name.getText(sf) === nomPorte)[0] : null;
  const appelle = declaration ? noeudsDe(declaration, (n) => estAppelDe(n, 'adresseAutorisee')) : [];
  const rend = declaration ? noeudsDe(declaration, (n) => ts.isReturnStatement(n)) : [];
  verifier('G.3 `onShouldStartLoadWithRequest` passe par `adresseAutorisee` (importée de `reglages-afficheur.js`), et rend SON résultat',
    appelle.length === 1 && rend.length === 1 && rend[0].expression && ts.isIdentifier(rend[0].expression)
    && appelle[0].parent && ts.isVariableDeclaration(appelle[0].parent) && appelle[0].parent.name.getText(sf) === rend[0].expression.text
    && importsStatiquesDe(sf).includes('../lib/reglages-afficheur'), declaration ? declaration.getText(sf).slice(0, 200) : 'aucune porte');
  /* …et SES ARGUMENTS (relecture « contrôles » du 27/11) : `adresseAutorisee(uri, uri)` rendait toujours vrai, et la `WebView`
     aurait suivi n'importe quelle adresse — G.2 ne joue que la fonction pure. L'adresse DEMANDÉE, puis celle du fichier. */
  const vueDeLaPorte = declaration ? noeudsDe(declaration, (n) => ts.isVariableDeclaration(n) && n.name.getText(sf) === 'vue') : [];
  verifier('G.3 la porte appelle EXACTEMENT `adresseAutorisee(vue, uri)`, `vue` étant l’adresse de la requête (`requete && requete.url`)',
    appelle.length === 1 && appelle[0].getText(sf) === 'adresseAutorisee(vue, uri)' && vueDeLaPorte.length === 1
    && vueDeLaPorte[0].initializer && vueDeLaPorte[0].initializer.getText(sf) === 'requete && requete.url',
  appelle.length ? appelle[0].getText(sf) : 'aucun appel');
  const req = requiresDe(sf).filter((n) => premierArgument(n) === 'react-native-webview');
  const fn = req.length === 1 ? fonctionDe(req[0]) : null;
  const sonde = fn ? noeudsDe(fn, (n) => estAppelDe(n, 'requireOptionalNativeModule') && premierArgument(n) === 'RNCWebViewModule') : [];
  verifier('G.3 `react-native-webview` chargé au moment de montrer : UN `require`, dans une fonction, APRÈS la sonde de son module '
    + 'natif ; jamais importé en haut', !!fn && sonde.length === 1 && sonde[0].getStart(sf) < req[0].getStart(sf)
    && !importsStatiquesDe(sf).includes('react-native-webview'), `${req.length} require, ${sonde.length} sonde`);
  const source = vues.length === 1 ? attributDe(vues[0], 'source') : null;
  verifier('G.3 la `WebView` ne montre que l’adresse de l’aperçu (`source={{ uri }}`), et le délai d’une page blanche est '
    + '`DELAI_AFFICHAGE`', !!source && source.getText(sf) === 'source={{ uri }}' && /setTimeout\([\s\S]*DELAI_AFFICHAGE\);/.test(lire(f)), '');
});

section('G.4 Le cadre du navigateur (AfficheurPdf.web.js) : fermé, sans script, la bande par-dessus');
await sousGarde('G.4', async () => {
  const f = 'src/components/AfficheurPdf.web.js';
  const sf = arbreDe(f);
  const cadres = balisesJsx(sf, 'iframe');
  const sandbox = cadres.length === 1 ? attributDe(cadres[0], 'sandbox') : null;
  verifier('G.4 UN cadre, `sandbox` à la chaîne VIDE (aucun script, aucun formulaire, une origine opaque) ; ni `allow`, ni '
    + '`allow-scripts`', !!sandbox && !!sandbox.initializer && ts.isStringLiteral(sandbox.initializer) && sandbox.initializer.text === ''
    && !attributDe(cadres[0], 'allow') && !/allow-/.test(sansCommentaires(lire(f))), sandbox ? sandbox.getText(sf) : 'aucun');
  const srcDoc = cadres.length === 1 ? attributDe(cadres[0], 'srcDoc') : null;
  const litteraux = srcDoc ? noeudsDe(srcDoc, (n) => ts.isStringLiteralLike(n) || ts.isTemplateExpression(n)).map((n) => n.getText(sf)) : [];
  verifier('G.4 `srcDoc` = la page composée seule (`html`), sans `<script` ajouté ; le fichier n’écrit nulle part `<script`',
    !!srcDoc && /\bhtml\b/.test(srcDoc.getText(sf)) && litteraux.every((t) => !/script/i.test(t))
    && !/<script/i.test(sansCommentaires(lire(f))), srcDoc ? srcDoc.getText(sf) : 'aucun');
  const vuesSansAppui = balisesJsx(sf, 'View').filter((el) => {
    const a = attributDe(el, 'pointerEvents');
    return a && a.initializer && ts.isStringLiteral(a.initializer) && a.initializer.text === 'none';
  });
  verifier('G.4 la bande « APERÇU — ce document n’est pas remis » est posée PAR-DESSUS le cadre, sans recevoir d’appui ; la phrase '
    + 'du navigateur au-dessus', vuesSansAppui.length === 1 && /TEXTES_DE_L_ECRAN\.bandeWeb/.test(vuesSansAppui[0].parent.getText(sf))
    && /TEXTES_DE_L_ECRAN\.web\b/.test(lire(f)), '');
  const modules = [...importsStatiquesDe(sf), ...requiresDe(sf).map(premierArgument)];
  verifier('G.4 le cadre web n’importe que react, react-native, le thème et les textes de l’écran',
    egal([...new Set(modules)].sort(), ['../lib/etapes-apercu', '../theme', 'react', 'react-native']), modules.join(', '));
});

/* ================================================================== */
/*  H. LA SÉANCE D'APERÇU                                               */
/* ================================================================== */

/* La VRAIE chaîne : l'instantané, la composition, la page, la fabrication
   (de faux outils, le vrai tampon). */
const composerEssai = (donnees, maintenant) => {
  const r = instantaneDuDevis({ ...donnees, maintenant });
  if (!r.ok) return r;
  const document = documentDuDevis(r.instantane);
  return { ok: true, html: devisHtml(document, POLICES_ESSAI), document, places: null };
};
const donneesDe = (c) => { const { maintenant, ...reste } = c.entrees; return reste; };
const BILAN_OK = Object.freeze({ ok: true, incompletes: [], enCours: 0, enEchec: 0, nonEnregistrees: 0, devisEnEchec: false, enteteRefuse: [], texte: '' });
function creerSeanceEssai(o = {}) {
  const horloge = o.horloge || creerHorloge();
  const f = o.outils === undefined ? creerOutils({ horloge, ...(o.outilsOptions || {}) }) : o.outils;
  const fabrique = o.fabrique || creerFabrique(f.outils);
  const journal = { annonces: [], vibrations: [], etats: [], lectures: 0, compositions: 0, files: 0 };
  const seance = creerSeance({
    attendreLaFile: o.attendreLaFile || (async () => { journal.files += 1; return BILAN_OK; }),
    lire: async () => { journal.lectures += 1; return o.lire ? o.lire() : { ok: true, donnees: donneesDe(o.cas || CAS_A[0]) }; },
    composer: async (donnees, maintenant) => { journal.compositions += 1; return (o.composer || composerEssai)(donnees, maintenant); },
    fabrique,
    maintenant: horloge.maintenant,
    attendre: horloge.attendre,
    annoncer: (t) => journal.annonces.push(t),
    vibrer: (v) => journal.vibrations.push(v),
  });
  seance.abonner(() => {
    const e = seance.lire().etape;
    if (journal.etats[journal.etats.length - 1] !== e) journal.etats.push(e);
  });
  return { seance, journal, f, fabrique, horloge };
}

section('H.1 La séance jouée : les étapes, les annonces, les vibrations, le fichier tenu puis effacé');
await sousGarde('H.1', async () => {
  const s = creerSeanceEssai();
  await s.seance.demarrer();
  const e = s.seance.lire();
  verifier('H.1 enregistrement → lecture → mise en page → marque → prêt', egal(s.journal.etats, ['enregistrement', 'lecture', 'mise_en_page', 'marque', 'pret']),
    JSON.stringify(s.journal.etats));
  verifier('H.1 VoiceOver entend DEUX phrases : « Enregistrement de vos dernières modifications… » et « Aperçu prêt, 2 pages » ; une vibration '
    + 'de réussite', egal(s.journal.annonces, ['Enregistrement de vos dernières modifications…', 'Aperçu prêt, 2 pages'])
    && egal(s.journal.vibrations, ['reussite']), JSON.stringify(s.journal));
  verifier('H.1 l’état prêt : le fichier rangé, deux pages des deux côtés, les polices d’Opus, les durées de chaque étape ; lire() rend le MÊME objet',
    e.etape === 'pret' && e.uri === `${DOSSIER_APERCU}/id-1.pdf` && e.pages === 2 && e.pagesTelephone === 2 && issueDesPolices(e.polices) === 'opus'
    && ['enregistrement', 'lecture', 'composition', 'fabrication', 'miseEnPage', 'marque'].every((k) => typeof e.durees[k] === 'number')
    && Array.isArray(e.avisEcran) && s.seance.lire() === e && Object.isFrozen(e) && s.f.fichiers.has(e.uri), JSON.stringify({ ...e, polices: undefined }));
  s.seance.arreter();
  verifier('H.1 arrêter efface le fichier tenu', !s.f.fichiers.has(e.uri), '');
  verifier('H.1 les textes des étapes, en toutes lettres', egal(TEXTES_DES_ETAPES, {
    attente_precedent: 'Un aperçu précédent se termine encore…', enregistrement: 'Enregistrement de vos dernières modifications…',
    lecture: 'Lecture du devis…', mise_en_page: 'Mise en page…', marque: 'Marque « APERÇU » sur chaque page…',
  }) && egal(BOUTONS, { reessayer: 'Réessayer', revenir: 'Revenir au devis' }) && ANNONCE_WEB === 'Aperçu prêt.'
    && PHRASE_LONG_DEVIS === 'Sur un long devis, cela peut prendre jusqu’à une minute.' && DELAI_PHRASE_LONGUE === 5000 && DELAI_PRECEDENT === 30000
    && annoncePrete(1) === 'Aperçu prêt, 1 page' && annoncePrete(12) === 'Aperçu prêt, 12 pages', '');
  const ecarts = [-3, -2, -1, 0, 1, 1.5, 2, 3, 12, 1000].filter((n) => nombreLocal(n, 'ligne', 'lignes') !== nombreDe(n, 'ligne', 'lignes'));
  verifier('H.1 nombreLocal = nombreDe de formats.js, de −3 à 1000', ecarts.length === 0, ecarts.join(', '));
});
await sousGarde('H.1', async () => {
  /* Ce qui n'est pas en base : la phrase, « Revenir au devis », et RIEN
     d'autre n'est lu. */
  const ORACLES_FILE = [
    [{ ok: false, incompletes: [], enCours: 1, enEchec: 0 }, '[enregistrement] Il n’y a pas d’aperçu : 1 ligne n’est pas encore en base.'],
    [{ ok: false, incompletes: ['l1'], enCours: 0, enEchec: 0 },
      '[enregistrement] Il n’y a pas d’aperçu : 1 ligne n’est pas encore en base. Une ligne n’est pas complète.'],
    [{ ok: false, incompletes: ['l1', 'l2'], enCours: 1, enEchec: 0 },
      '[enregistrement] Il n’y a pas d’aperçu : 3 lignes ne sont pas encore en base. 2 lignes ne sont pas complètes.'],
    [{ ok: false, incompletes: [], enCours: 0, enEchec: 2, texte: 'Une écriture a échoué.' },
      '[enregistrement] Il n’y a pas d’aperçu : 2 lignes ne sont pas encore en base. Une écriture a échoué.'],
    /* Un champ refusé, SANS les noms (une saisie qui ne les donne pas) : la
       phrase générale — jamais « l’en-tête n’est pas encore en base » d'un
       devis qui y est (relecture « écran » du 27/11, grave). */
    [{ ok: false, incompletes: [], enCours: 0, enEchec: 0, enteteRefuse: ['objet'] },
      '[enregistrement] Il n’y a pas d’aperçu : ce que vous avez écrit n’est pas enregistré : corrigez-le dans le devis.'],
    [{ ok: false }, '[enregistrement] Il n’y a pas d’aperçu : l’en-tête du devis n’est pas encore en base.'],
    [null, '[enregistrement] Il n’y a pas d’aperçu : l’en-tête du devis n’est pas encore en base.'],
    /* LA FORME QUE REND `bilan()` (SaisieDevisScreen) : le champ refusé
       NOMMÉ, et l'endroit où il vit — « Conditions », « Déchets », le haut du
       devis —, dit même quand des lignes manquent aussi. */
    [{ ok: false, incompletes: [], incompletesNoms: [], enCours: 0, enEchec: 0, devisEnEchec: false, enteteRefuse: ['validiteJours'],
      refusNommes: ['Validité de l’offre'], refusOu: ['dans « Conditions »'], texte: '' },
    '[enregistrement] Il n’y a pas d’aperçu : ce que vous avez écrit dans « Validité de l’offre » n’est pas enregistré. '
      + 'Corrigez-le dans « Conditions ».'],
    [{ ok: false, incompletes: [], incompletesNoms: [], enCours: 0, enEchec: 0, devisEnEchec: false, enteteRefuse: ['dechetsCoutCentimes'],
      refusNommes: ['Coût estimé des déchets'], refusOu: ['dans « Déchets »'], texte: '' },
    '[enregistrement] Il n’y a pas d’aperçu : ce que vous avez écrit dans « Coût estimé des déchets » n’est pas enregistré. '
      + 'Corrigez-le dans « Déchets ».'],
    [{ ok: false, incompletes: [], enCours: 0, enEchec: 0, devisEnEchec: false, enteteRefuse: ['objet', 'validiteJours'],
      refusNommes: ['Objet', 'Validité de l’offre'], refusOu: ['en haut du devis', 'dans « Conditions »'], texte: '' },
    '[enregistrement] Il n’y a pas d’aperçu : ce que vous avez écrit dans « Objet » et « Validité de l’offre » n’est pas '
      + 'enregistré. Corrigez-le en haut du devis et dans « Conditions ».'],
    [{ ok: false, incompletes: [], enCours: 0, enEchec: 1, devisEnEchec: false, enteteRefuse: ['validiteJours'],
      refusNommes: ['Validité de l’offre'], refusOu: ['dans « Conditions »'], texte: 'Une ligne n’a pas pu être enregistrée.' },
    '[enregistrement] Il n’y a pas d’aperçu : 1 ligne n’est pas encore en base. Une ligne n’a pas pu être enregistrée. '
      + 'Ce que vous avez écrit dans « Validité de l’offre » n’est pas enregistré. Corrigez-le dans « Conditions ».'],
    [{ ok: false, incompletes: [], enCours: 0, enEchec: 0, devisEnEchec: true, enteteRefuse: ['validiteJours'],
      refusNommes: ['Validité de l’offre'], refusOu: ['dans « Conditions »'],
      texte: 'L’en-tête du devis n’est pas encore enregistré : l’envoi continue, mais rien ne garantit qu’il aboutira.' },
    '[enregistrement] Il n’y a pas d’aperçu : l’en-tête du devis n’est pas encore en base. L’en-tête du devis n’est pas encore '
      + 'enregistré : l’envoi continue, mais rien ne garantit qu’il aboutira. Ce que vous avez écrit dans « Validité de l’offre » '
      + 'n’est pas enregistré. Corrigez-le dans « Conditions ».'],
    /* LA LIGNE INCOMPLÈTE NOMMÉE (§6.3), la première quand il y en a
       plusieurs ; une désignation longue coupée à soixante caractères. */
    [{ ok: false, incompletes: ['l7'], incompletesNoms: ['  Pose de plinthes  '], enCours: 0, enEchec: 0, enteteRefuse: [], texte: '' },
      '[enregistrement] Il n’y a pas d’aperçu : 1 ligne n’est pas encore en base. La ligne « Pose de plinthes » n’est pas complète.'],
    [{ ok: false, incompletes: ['l1', 'l2'], incompletesNoms: ['Faïence murale', null], enCours: 0, enEchec: 0, enteteRefuse: [] },
      '[enregistrement] Il n’y a pas d’aperçu : 2 lignes ne sont pas encore en base. 2 lignes ne sont pas complètes, '
      + 'la première : « Faïence murale ».'],
    [{ ok: false, incompletes: ['l1'], incompletesNoms: [null], enCours: 0, enEchec: 0 },
      '[enregistrement] Il n’y a pas d’aperçu : 1 ligne n’est pas encore en base. Une ligne n’est pas complète.'],
    [{ ok: false, incompletes: ['l1'], incompletesNoms: [`${'a'.repeat(58)}b — et la suite qui ne tient pas`], enCours: 0, enEchec: 0 },
      `[enregistrement] Il n’y a pas d’aperçu : 1 ligne n’est pas encore en base. La ligne « ${'a'.repeat(58)}b… » n’est pas complète.`],
  ];
  const fautes = ORACLES_FILE.filter(([b, attendu]) => phraseDeLEnregistrement(b) !== attendu).map(([b]) => `${JSON.stringify(b)} → « ${phraseDeLEnregistrement(b)} »`);
  verifier('H.1 la phrase de ce qui n’est pas en base, en toutes lettres (le singulier à 1)', fautes.length === 0, fautes.join(' | '));
  const s = creerSeanceEssai({ attendreLaFile: async () => ORACLES_FILE[2][0] });
  await s.seance.demarrer();
  const e = s.seance.lire();
  verifier('H.1 la file n’est pas en base : refus, « Revenir au devis », et ni lecture, ni composition, ni impression',
    e.etape === 'refus' && e.phrase === ORACLES_FILE[2][1] && e.bouton === 'revenir' && e.origine === 'enregistrement' && s.journal.lectures === 0
    && s.journal.compositions === 0 && !s.f.appels.some(([n]) => n === 'imprimer') && egal(s.journal.vibrations, ['echec'])
    && egal(s.journal.annonces, ['Enregistrement de vos dernières modifications…', ORACLES_FILE[2][1]]), JSON.stringify(e));
});
await sousGarde('H.1', async () => {
  const fautes = [];
  /* La lecture ratée (le réseau) : « Réessayer ». */
  const lecture = creerSeanceEssai({ lire: () => ({ ok: false, phrase: '[lecture du devis] Pas de connexion.', bouton: 'reessayer', detail: 'réseau' }) });
  await lecture.seance.demarrer();
  const a = lecture.seance.lire();
  if (!(a.etape === 'refus' && a.phrase === '[lecture du devis] Pas de connexion.' && a.bouton === 'reessayer' && a.detail === 'réseau'
    && lecture.journal.compositions === 0)) fautes.push(`lecture ratée : ${JSON.stringify(a)}`);
  /* La lecture qui LÈVE : jamais un écran blanc. */
  const leve = creerSeanceEssai({ lire: () => { throw new Error('boum'); } });
  await leve.seance.demarrer();
  const b = leve.seance.lire();
  if (!(b.etape === 'refus' && b.phrase === '[lecture] Une erreur inattendue a arrêté l’aperçu.' && b.detail === 'boum' && b.bouton === 'reessayer')) {
    fautes.push(`lecture qui lève : ${JSON.stringify(b)}`);
  }
  /* Le devis absent (supprimé, ou plus à vous) : « Revenir au devis ». */
  const absent = creerSeanceEssai({ lire: () => ({ ok: true, donnees: { ...donneesDe(CAS_A[0]), devisLu: { devis: null, lignes: [], ventilation: [] } } }) });
  await absent.seance.demarrer();
  const c = absent.seance.lire();
  if (!(c.etape === 'refus' && c.phrase === '[lecture du devis] Ce devis n’existe plus, ou n’est plus à vous.' && c.bouton === 'revenir')) {
    fautes.push(`devis absent : ${JSON.stringify(c)}`);
  }
  /* Le régime contradictoire (D13) : la phrase de la composition, préfixée. */
  const casRegime = CAS_A.find((x) => x.nom === 'franchise avec une ligne taxée (D13)');
  const direct = instantaneDuDevis(casRegime.entrees);
  const regime = creerSeanceEssai({ cas: casRegime });
  await regime.seance.demarrer();
  const d = regime.seance.lire();
  if (!(direct.ok === false && direct.raison === 'regime_contradictoire' && d.etape === 'refus' && d.phrase === `[régime de TVA] ${direct.phrase}`
    && d.bouton === 'revenir' && !regime.f.appels.some(([n]) => n === 'imprimer'))) fautes.push(`régime : ${JSON.stringify(d)}`);
  /* La fabrication qui échoue : sa phrase, « Réessayer ». */
  const fab = creerSeanceEssai({ outilsOptions: { imprimer: () => { throw new Error('WKWebView'); } } });
  await fab.seance.demarrer();
  const g = fab.seance.lire();
  if (!(g.etape === 'refus' && g.phrase === '[mise en page] Le téléphone n’a pas pu fabriquer les pages.' && g.bouton === 'reessayer'
    && g.origine === 'mise en page' && typeof g.durees.fabrication === 'number' && egal(fab.journal.vibrations, ['echec']))) fautes.push(`fabrication : ${JSON.stringify(g)}`);
  /* Le module qui manque : « Revenir au devis » — le paquet chargé ne change
     pas d'un essai à l'autre, « Réessayer » ne pourrait pas réussir. */
  for (const [nom, erreur, phrase] of [
    ['absent du paquet', new Error('Cannot find module \'@cantoo/pdf-lib\''), PHRASES_DE_LA_FABRICATION.moduleAbsent],
    ['planté au chargement', new TypeError('undefined is not a function'), PHRASES_DE_LA_FABRICATION.module],
  ]) {
    const m = creerSeanceEssai({ outilsOptions: { pdfLib: { absent: true, erreur } } });
    await m.seance.demarrer();
    const x = m.seance.lire();
    if (!(x.etape === 'refus' && x.phrase === phrase && x.bouton === 'revenir' && x.origine === 'module')) fautes.push(`module ${nom} : ${JSON.stringify(x)}`);
  }
  verifier('H.1 les refus : lecture ratée (Réessayer), lecture qui lève, devis absent (Revenir), régime contradictoire (Revenir, préfixé), '
    + 'fabrication ratée (Réessayer), module qui manque (Revenir, deux phrases) — chacun avec sa phrase', fautes.length === 0, fautes.join(' | '));
  verifier('H.1 les phrases de la séance, en toutes lettres', egal(PHRASES_DE_LA_SEANCE, {
    precedent: 'Un aperçu précédent se termine encore : réessayez dans quelques secondes.',
    devisAbsent: '[lecture du devis] Ce devis n’existe plus, ou n’est plus à vous.', prefixeRegime: '[régime de TVA] ',
    prefixeEnregistrement: '[enregistrement] Il n’y a pas d’aperçu : ', enteteEnAttente: 'l’en-tête du devis n’est pas encore en base.',
    affichage: '[affichage] Le document n’a pas pu s’afficher.', inattendue: ' Une erreur inattendue a arrêté l’aperçu.',
  }), '');
});
await sousGarde('H.1', async () => {
  /* L'ARRÊT, à chaque étape : plus rien ne suit, rien ne reste. */
  const fautes = [];
  const fileTenue = differe();
  const a = creerSeanceEssai({ attendreLaFile: () => fileTenue.promesse });
  const pa = a.seance.demarrer();
  await vider();
  a.seance.arreter();
  fileTenue.tenir(BILAN_OK);
  await pa;
  if (a.journal.lectures !== 0 || a.seance.lire().etape !== 'enregistrement') fautes.push('arrêt pendant l’enregistrement');

  const lu = differe();
  const b = creerSeanceEssai({ lire: () => lu.promesse });
  const pb = b.seance.demarrer();
  await vider();
  b.seance.arreter();
  lu.tenir({ ok: true, donnees: donneesDe(CAS_A[0]) });
  await pb;
  if (b.journal.compositions !== 0) fautes.push('arrêt pendant la lecture');

  const rendu = differe();
  const c = creerSeanceEssai({ outilsOptions: { imprimer: () => rendu.promesse } });
  const pc = c.seance.demarrer();
  await vider();
  c.seance.arreter();
  c.f.fichiers.set(`${DOSSIER_IMPRESSION}/arrete.pdf`, TEMOIN);
  rendu.tenir({ uri: `${DOSSIER_IMPRESSION}/arrete.pdf`, numberOfPages: 2 });
  await pc;
  await vider();
  if (c.f.fichiers.size !== 0 || c.f.appels.some(([n]) => n === 'ecrire') || c.seance.lire().etape !== 'mise_en_page') {
    fautes.push(`arrêt pendant la mise en page : ${JSON.stringify([...c.f.fichiers.keys()])}`);
  }

  /* Une fabrique qui ne lit PAS doitContinuer : son fichier tardif est
     effacé par la séance. */
  const tard = differe();
  const effaces = [];
  const sourde = {
    fabriquer: async ({ surEtape }) => { surEtape('marque'); await tard.promesse; return { ok: true, uri: `${DOSSIER_APERCU}/tard.pdf`, pages: 1,
      pagesTelephone: 1, polices: {}, metadonnees: {}, octets: 10, brutEncoreLa: false, durees: {} }; },
    effacer: (u) => effaces.push(u),
    enCours: () => null,
  };
  const d = creerSeanceEssai({ fabrique: sourde });
  const pd = d.seance.demarrer();
  await vider();
  const pendant = d.seance.lire().etape;
  d.seance.arreter();
  tard.tenir();
  await pd;
  if (pendant !== 'marque' || !egal(effaces, [`${DOSSIER_APERCU}/tard.pdf`]) || d.seance.lire().etape !== 'marque') {
    fautes.push(`arrêt pendant la marque : ${pendant} ${JSON.stringify(effaces)} ${d.seance.lire().etape}`);
  }
  verifier('H.1 arrêter pendant l’enregistrement, la lecture, la mise en page, la marque : aucune étape ne suit, le fichier tardif est effacé',
    fautes.length === 0, fautes.join(' | '));
  const e = creerSeanceEssai();
  e.seance.arreter();
  await e.seance.demarrer();
  verifier('H.1 une séance arrêtée ne redémarre pas', e.journal.files === 0 && e.seance.lire().etape === 'repos', '');
});
await sousGarde('H.1', async () => {
  /* UN APERÇU PRÉCÉDENT SE TERMINE ENCORE. */
  const fautes = [];
  const fini = { ok: true, uri: `${DOSSIER_APERCU}/f.pdf`, pages: 1, pagesTelephone: 1, polices: {}, metadonnees: {}, octets: 10,
    brutEncoreLa: false, durees: {} };
  const precedent = differe();
  let occupe = true;
  const fab = { fabriquer: async () => fini, effacer: () => {}, enCours: () => (occupe ? precedent.promesse : null) };
  const a = creerSeanceEssai({ fabrique: fab });
  const pa = a.seance.demarrer();
  await vider();
  const etapeA = a.seance.lire().etape;
  occupe = false;
  precedent.tenir();
  await pa;
  if (!(etapeA === 'attente_precedent' && a.seance.lire().etape === 'pret' && a.journal.annonces[0] === 'Un aperçu précédent se termine encore…')) {
    fautes.push(`précédent fini : ${etapeA} ${a.seance.lire().etape} ${JSON.stringify(a.journal.annonces)}`);
  }
  const jamais = { fabriquer: async () => fini, effacer: () => {}, enCours: () => new Promise(() => {}) };
  const b = creerSeanceEssai({ fabrique: jamais });
  const pb = b.seance.demarrer();
  await vider();
  b.horloge.avancer(29999);
  await vider();
  const encore = b.seance.lire().etape;
  b.horloge.avancer(1);
  await pb;
  const r = b.seance.lire();
  if (!(encore === 'attente_precedent' && r.etape === 'refus' && r.phrase === 'Un aperçu précédent se termine encore : réessayez dans quelques secondes.'
    && r.bouton === 'reessayer' && b.journal.files === 0)) fautes.push(`précédent jamais fini : ${encore} ${JSON.stringify(r)}`);
  verifier('H.1 un aperçu précédent qui se termine : on l’attend ; 30 s sans fin : « Un aperçu précédent se termine encore : réessayez… »',
    fautes.length === 0, fautes.join(' | '));
});
await sousGarde('H.1', async () => {
  /* La phrase du long devis, à 5 s ; le navigateur ; deux démarrages ; l'afficheur qui échoue. */
  const fautes = [];
  const rendu = differe();
  const a = creerSeanceEssai({ outilsOptions: { imprimer: () => rendu.promesse } });
  const pa = a.seance.demarrer();
  await vider();
  const avant = a.seance.lire();
  a.horloge.avancer(4999);
  await vider();
  const a4999 = a.seance.lire().long;
  a.horloge.avancer(1);
  await vider();
  const apres = a.seance.lire();
  a.f.fichiers.set(`${DOSSIER_IMPRESSION}/long.pdf`, TEMOIN);
  rendu.tenir({ uri: `${DOSSIER_IMPRESSION}/long.pdf`, numberOfPages: 2 });
  await pa;
  if (!(avant.etape === 'mise_en_page' && avant.long === false && a4999 === false && apres.etape === 'mise_en_page' && apres.long === true
    && apres.phraseLongue === 'Sur un long devis, cela peut prendre jusqu’à une minute.' && a.seance.lire().etape === 'pret'
    && a.journal.annonces.length === 2)) fautes.push(`phrase longue : ${JSON.stringify(apres)}`);

  for (const [nom, fab] of [['surLeWeb', { surLeWeb: true, fabriquer: async () => { throw new Error('jamais'); }, effacer: () => {}, enCours: () => null }],
    ['étape « web »', { fabriquer: async () => ({ ok: false, etape: 'web' }), effacer: () => {}, enCours: () => null }]]) {
    const w = creerSeanceEssai({ fabrique: fab });
    await w.seance.demarrer();
    const e = w.seance.lire();
    if (!(e.etape === 'web' && typeof e.html === 'string' && e.html.startsWith('<!doctype html>') && egal(w.journal.annonces,
      ['Enregistrement de vos dernières modifications…', 'Aperçu prêt.']) && egal(w.journal.vibrations, ['reussite'])
      && (nom !== 'surLeWeb' || !w.journal.etats.includes('mise_en_page')))) fautes.push(`${nom} : ${JSON.stringify({ ...e, html: undefined })}`);
  }

  const d = creerSeanceEssai();
  const p1 = d.seance.demarrer();
  const p2 = d.seance.demarrer();
  await Promise.all([p1, p2]);
  if (!(p1 === p2 && d.journal.files === 1)) fautes.push('deux démarrages');

  const premier = d.seance.lire().uri;
  d.seance.echecAffichage('10 s sans fin de chargement');
  const r = d.seance.lire();
  const efface = !d.f.fichiers.has(premier);
  await d.seance.demarrer();
  const ensuite = d.seance.lire();
  if (!(r.etape === 'refus' && r.phrase === '[affichage] Le document n’a pas pu s’afficher.' && r.bouton === 'reessayer'
    && r.detail === '10 s sans fin de chargement' && efface && ensuite.etape === 'pret' && ensuite.uri === `${DOSSIER_APERCU}/id-2.pdf`)) {
    fautes.push(`afficheur : ${JSON.stringify(r)} → ${ensuite.etape} ${ensuite.uri}`);
  }
  d.seance.echecAffichage('encore');
  d.seance.arreter();
  d.seance.echecAffichage('après');
  verifier('H.1 la phrase du long devis à 5 s, pas avant ; au navigateur, la page et « Aperçu prêt. » ; deux démarrages = un seul ; '
    + 'l’afficheur qui échoue efface le fichier et propose de réessayer', fautes.length === 0, fautes.join(' | '));
  let e = null;
  try { creerSeance({ attendreLaFile: async () => BILAN_OK }); } catch (x) { e = x; }
  verifier('H.1 un outil de la séance manque : creerSeance LÈVE', !!e && /il manque/.test(e.message), e && e.message);
});
section('H.2 L’écran de l’aperçu : rien n’envoie, rien ne partage, rien n’imprime ; la carte est modale ; la fabrication part du geste');
await sousGarde('H.2', async () => {
  /* Le `composer` de l'application est celui que ce contrôle fait tourner
     depuis le début (H.1) : la même composition, octet pour octet. */
  const motifsEssai = [{ cle: 'devis_client' }, { cle: 'devis_delai' }, { cle: 'emetteur_mediateur' }];
  const ecarts = CAS_A.filter((c) => {
    const a = composerLApercu(donneesDe(c), MAINTENANT, POLICES_ESSAI);
    const b = composerEssai(donneesDe(c), MAINTENANT);
    const m = composerLApercu({ ...donneesDe(c), motifs: motifsEssai }, MAINTENANT, POLICES_ESSAI);
    return !(a.ok === b.ok && (!a.ok || (a.html === b.html && egal(a.document, b.document) && a.places === null
      && m.html === a.html && egal(m.places, compterLesPlaces(motifsEssai)))));
  }).map((c) => c.nom);
  verifier(`H.2 composerLApercu = la composition de H, sur les ${CAS_A.length} cas ; « motifs » ne change pas la page, il donne les places`,
    ecarts.length === 0 && CAS_A.length > 3, ecarts.join(' | '));
  verifier('H.2 composerPourLApercu passe les VRAIES polices (`policesDuDevis()`), des deux côtés',
    [lire('src/lib/devis-pdf.js'), lire('src/lib/devis-pdf.web.js')].every((t) => /return composerLApercu\(donnees, maintenant, policesDuDevis\(\)\);/.test(sansCommentaires(t))), '');
  const ECRAN = ['src/components/ApercuDevis.js', 'src/components/CarteApercu.js', 'src/lib/etapes-apercu.js',
    'src/components/AfficheurPdf.js', 'src/components/AfficheurPdf.web.js'];
  const fautes = [];
  for (const f of ECRAN) {
    const a = arbreDe(f);
    /* Ce que le CODE nomme (l'arbre) : un texte des Détails qui écrit
       « Pages : expo-print 3 · pdf-lib 3 » n'imprime rien. */
    noeudsDe(a, (n) => ts.isIdentifier(n) && ['enregistrerTout', 'Share', 'printAsync', 'printToFileAsync', 'shareAsync'].includes(n.text))
      .forEach((n) => fautes.push(`${f} : ${n.text}`));
    [...importsStatiquesDe(a), ...requiresDe(a).map(premierArgument)]
      .filter((m) => /react-native-share|partage|expo-print|expo-sharing/.test(m)).forEach((m) => fautes.push(`${f} : ${m}`));
  }
  verifier('H.2 ni `enregistrerTout` (E-G1 : il FERME la carte), ni `react-native-share`, ni `../lib/partage`, ni `Share`, ni '
    + '`expo-print` dans l’écran, la carte, la séance et les afficheurs', fautes.length === 0, fautes.join(' | '));

  const carte = arbreDe('src/components/CarteApercu.js');
  const racines = noeudsDe(carte, (n) => ts.isReturnStatement(n) && n.expression && fonctionDe(n)
    && fonctionDe(n).name && fonctionDe(n).name.getText(carte) === 'CarteApercu');
  const premiere = racines.length === 1 ? noeudsDe(racines[0], (n) => ts.isJsxOpeningElement(n))[0] : null;
  verifier('H.2 la carte est MODALE pour VoiceOver : `accessibilityViewIsModal` sur sa vue racine ; elle ne monte aucun `ScrollView`',
    !!premiere && !!attributDe(premiere, 'accessibilityViewIsModal') && balisesJsx(carte, 'ScrollView').length === 0, '');

  const corps = arbreDe('src/components/ApercuDevis.js');
  const demarrages = noeudsDe(corps, (n) => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)
    && n.expression.name.text === 'demarrer');
  const dansUnAppui = (n) => {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isJsxAttribute(p)) return p.name.getText(corps) === 'onPress';
      if (ts.isCallExpression(p) && ts.isIdentifier(p.expression) && /^use/.test(p.expression.text)) return false;
    }
    return false;
  };
  verifier('H.2 l’écran ne DÉMARRE la séance que sur un appui (« Réessayer ») — jamais dans un effet au montage (K2, S59)',
    demarrages.length === 1 && dansUnAppui(demarrages[0]), demarrages.map((n) => n.getText(corps)).join(' | '));
  /* …ET NULLE PART AILLEURS dans les vues de l'aperçu, sous AUCUNE forme
     (relecture « contrôles » du 27/11) : un `useEffect(() => {
     seance.demarrer(); }, [seance])` posé dans CarteApercu.js passait tout —
     le cliquet du linter ne le voit pas, et la vérification d'au-dessus ne
     lisait que le corps. `seance.demarrer`, `seance['demarrer']`, une
     déstructuration : chacune compte. */
  const VUES = ['src/components/ApercuDevis.js', 'src/components/CarteApercu.js', 'src/components/AfficheurPdf.js',
    'src/components/AfficheurPdf.web.js'];
  const mentions = VUES.flatMap((f) => {
    const a = arbreDe(f);
    return noeudsDe(a, (n) => (ts.isPropertyAccessExpression(n) && n.name.text === 'demarrer')
      || (ts.isElementAccessExpression(n) && ts.isStringLiteralLike(n.argumentExpression) && n.argumentExpression.text === 'demarrer')
      || (ts.isBindingElement(n) && (n.propertyName || n.name).getText(a) === 'demarrer')
      || (ts.isShorthandPropertyAssignment(n) && n.name.text === 'demarrer')).map((n) => `${f} : ${n.getText(a).slice(0, 60)}`);
  });
  verifier('H.2 …et aucune autre mention de `demarrer` dans les vues de l’aperçu (la carte, le corps, les afficheurs), sous aucune forme',
    mentions.length === 1 && mentions[0].startsWith('src/components/ApercuDevis.js : seance.demarrer'), mentions.join(' | '));
  const arrets = noeudsDe(corps, (n) => estAppelDe(n, 'useEffect') && /seance\.arreter\(\)/.test(n.getText(corps)));
  verifier('H.2 l’écran ARRÊTE la séance dans le nettoyage d’un effet (`useEffect(() => () => seance.arreter(), [seance])`)',
    arrets.length === 1 && reduit(arrets[0].getText(corps)) === 'useEffect(() => () => seance.arreter(), [seance])',
    arrets.map((n) => n.getText(corps)).join(' | '));
  const documents = balisesJsx(corps, 'AfficheurPdf');
  const sousUnDefilement = documents.filter((el) => {
    for (let p = el.parent; p; p = p.parent) {
      if (ts.isJsxElement(p) && p.openingElement.tagName.getText(corps) === 'ScrollView') return true;
    }
    return false;
  });
  verifier('H.2 le document n’est JAMAIS dans un `ScrollView` (une page qui défile dans une page qui défile ne défile plus)',
    documents.length === 2 && sousUnDefilement.length === 0, `${documents.length} afficheurs, ${sousUnDefilement.length} sous un ScrollView`);
  const details = noeudsDe(corps, (n) => estAppelDe(n, 'detailsDeFabrication'));
  verifier('H.2 les Détails reçoivent l’état, la version d’iOS, les adresses et les empreintes — JAMAIS le document (C-M13)',
    details.length === 1 && !/document|html|donnees/.test(details[0].getText(corps).replace(/afficheur: adresses/, '')), '');
  verifier('H.2 « Détails de la fabrication » n’existe qu’en `__DEV__`', /\{__DEV__ && \(\s*<View style=\{s\.dev\}>/.test(lire('src/components/ApercuDevis.js')), '');

  /* LES MOTS DE L'ÉCRAN (Annexe A.2), écrits ICI en toutes lettres (K11). */
  const ORACLE_ECRAN = {
    rangee: 'Aperçu du devis (page A4)',
    rangeeVoix: 'Voir l’aperçu du devis, en pages A4, sans numéro. Opus ne l’envoie nulle part.',
    pasEnBase: 'L’aperçu sera possible dès que ce devis aura une ligne ou un objet.',
    pasEncoreEnregistre: 'L’aperçu sera possible dès que ce devis sera enregistré.',
    android: 'L’aperçu en pages A4 se fait sur iPhone.',
    titre: 'Aperçu du devis',
    retour: '‹ Devis',
    retourVoix: 'Revenir au devis',
    depliant: 'Ce que montre cet aperçu',
    replier: 'Revenir au document',
    pasComplet: 'Ce n’est pas encore le document complet : ce qui viendra est marqué dans la page « [prochaine version d’Opus : …] ».',
    fichier: 'Opus ne l’envoie nulle part ; il est effacé quand vous fermez cet aperçu (après une fermeture forcée d’Opus, le prochain aperçu l’efface).',
    rienNeManque: 'Rien ne manque de ce qu’Opus vérifie aujourd’hui.',
    web: 'Au navigateur : ni pages, ni marque sur chaque page, ni numéros de page.',
    bandeWeb: 'APERÇU — ce document n’est pas remis',
    details: 'Détails de la fabrication',
    calculEmpreintes: 'Calcul des empreintes…',
    exemplesTitre: 'Pour les essais de l’aperçu (Opus Dev seulement)',
    exempleUneLigne: 'Exemple : 1 ligne',
    exempleCinqPostes: 'Exemple : 5 postes (9 lignes)',
    exempleSoixanteLignes: 'Exemple : 60 lignes',
    titreExemple: 'Exemple d’aperçu',
  };
  verifier('H.2 les textes de l’écran (`TEXTES_DE_L_ECRAN`) = l’Annexe A.2, mot pour mot, dans les deux sens',
    egal(TEXTES_DE_L_ECRAN, ORACLE_ECRAN), JSON.stringify(Object.keys(TEXTES_DE_L_ECRAN).filter((k) => TEXTES_DE_L_ECRAN[k] !== ORACLE_ECRAN[k])));
  const JEU = [
    [resumeDuDocument(3), '3 pages · « APERÇU » sur chaque page'], [resumeDuDocument(1), '1 page · « APERÇU » sur chaque page'],
    [ligneAvantLeDocument(3), 'Aperçu du devis, 3 pages'], [ligneAvantLeDocument(1), 'Aperçu du devis, 1 page'],
    [phraseDeCeQuiManque(null), null], [phraseDeCeQuiManque({ page: 0, pasEncore: 0 }), 'Rien ne manque de ce qu’Opus vérifie aujourd’hui.'],
    [phraseDeCeQuiManque({ page: 3, pasEncore: 4 }),
      '3 points se voient dans la page, entre crochets ; 4 autres n’y ont pas encore de place : la liste « Pour le remettre » les dit.'],
    [phraseDeCeQuiManque({ page: 1, pasEncore: 1 }),
      '1 point se voit dans la page, entre crochets ; 1 autre n’y a pas encore de place : la liste « Pour le remettre » le dit.'],
    [phraseDeCeQuiManque({ page: 2, pasEncore: 0 }), '2 points se voient dans la page, entre crochets.'],
    [phraseDeCeQuiManque({ page: 0, pasEncore: 2 }), '2 points n’ont pas encore de place dans la page : la liste « Pour le remettre » les dit.'],
    [phraseDeCeQuiManque({ page: 0, pasEncore: 1 }), '1 point n’a pas encore de place dans la page : la liste « Pour le remettre » le dit.'],
  ];
  const faux = JEU.filter(([a, b]) => a !== b).map(([a, b]) => `${a} ≠ ${b}`);
  verifier(`H.2 le résumé, la ligne avant le document et ce qu’il manque, joués (${JEU.length} cas, singulier et pluriel)`,
    faux.length === 0, faux.join(' | '));
});

section('H.3 La saisie : l’ouverture figée, une attente de la file qui ne ferme RIEN, la rangée');
await sousGarde('H.3', async () => {
  const f = 'src/screens/SaisieDevisScreen.js';
  const code = lire(f);
  const OUVRIR = reduit([
    'const ouvrirApercu = () => {',
    '  if (gesteApercu.current || carteRef.current === CARTE_APERCU) return;',
    '  gesteApercu.current = true;',
    '  try {',
    '    if (carteRef.current && carteRef.current !== CARTE_APERCU) enregistrerCarte();',
    '    if (refEntete.current) refEntete.current.enregistrer();',
    '    Keyboard.dismiss();',
    '    poserRetour(null);',
    '    const seance = creerSeance({',
    '      attendreLaFile,',
    '      lire: lireLApercu,',
    '      composer: composerPourLApercu,',
    '      fabrique: fabriqueDuTelephone(),',
    '      maintenant: () => new Date(),',
    '      attendre: (ms) => new Promise((resoudre) => { setTimeout(resoudre, ms); }),',
    '      annoncer: retour.annoncer,',
    '      vibrer: (nom) => (nom === \'reussite\' ? retour.reussite() : retour.echec()),',
    '    });',
    '    setSeanceApercu(seance);',
    '    poserCarte(CARTE_APERCU);',
    '    setCleCarte((k) => k + 1);',
    '    if (rappels.current.onCarte) rappels.current.onCarte(TEXTES_DE_L_ECRAN.titre);',
    '    seance.demarrer();',
    '  } finally {',
    '    gesteApercu.current = false;',
    '  }',
    '};',
  ].join('\n'));
  const ouvrir = constanteDe(code, 'ouvrirApercu');
  verifier('H.3 `ouvrirApercu` figée ENTIÈRE (E-m1) : le verrou par une référence, la carte ouverte enregistrée, l’en-tête envoyé, '
    + 'le retour remis à zéro, la séance créée PUIS démarrée par le geste, une clé neuve', !!ouvrir && reduit(ouvrir) === OUVRIR,
  ouvrir ? reduit(ouvrir).slice(0, 400) : 'absente');
  const ATTENDRE = reduit([
    'const attendreLaFile = async () => {',
    '  if (refEntete.current) refEntete.current.enregistrer();',
    '  const f = fileRef.current;',
    '  if (f) await f.attendre(DELAI_ECRITURE);',
    '  return bilan();',
    '};',
  ].join('\n'));
  const attendre = constanteDe(code, 'attendreLaFile');
  verifier('H.3 `attendreLaFile` figée : ni `fermerCarte`, ni `poserRetour`, ni `enregistrerTout` (E-G1, S54)',
    !!attendre && reduit(attendre) === ATTENDRE && !/fermerCarte|poserRetour|enregistrerTout/.test(attendre), attendre || 'absente');
  verifier('H.3 `enregistrerCarte` ne fait rien pour la carte de l’aperçu (elle n’a aucun champ)',
    code.includes('if (id === CARTE_POUR_REMETTRE || id === CARTE_CHANTIER || id === CARTE_ENERGIE || id === CARTE_APERCU) return;'), '');
  const sf = arbreDe(f);
  const bas = balisesJsx(sf, 'BasDuDevis');
  const valeur = (el, nom) => { const a = el && attributDe(el, nom); return a && a.initializer ? a.initializer.getText(sf) : null; };
  verifier('H.3 `BasDuDevis` reçoit `devisEnBase` (l’état de la file), `brouillonEnRoute` (écrit, pas encore en base : l’envoi '
    + 'continue ou a échoué) et `onOuvrirApercu` (le geste), et déclare les trois',
  bas.length === 1 && valeur(bas[0], 'devisEnBase') === '{attente.devisEnBase}' && valeur(bas[0], 'onOuvrirApercu') === '{ouvrirApercu}'
    && valeur(bas[0], 'brouillonEnRoute') === '{!attente.devisEnBase && (attente.enCours || attente.devisErreur != null || attente.nb > 0)}'
    && /brouillonEnRoute = false,\n {2}devisEnBase = false, onOuvrirApercu = null,\n\}\) \{/.test(code),
  bas.length ? `${valeur(bas[0], 'devisEnBase')} ${valeur(bas[0], 'brouillonEnRoute')} ${valeur(bas[0], 'onOuvrirApercu')}` : '');
  const rangee = /\{Platform\.OS === 'android' \? \([\s\S]{0,160}TEXTES_DE_L_ECRAN\.android[\s\S]{0,80}\) : devisEnBase \? \([\s\S]{0,60}<Pressable\s+onPress=\{onOuvrirApercu\}\s+accessibilityRole="button"\s+accessibilityLabel=\{TEXTES_DE_L_ECRAN\.rangeeVoix\}[\s\S]{0,300}TEXTES_DE_L_ECRAN\.rangee\}[\s\S]{0,200}\) : \([\s\S]{0,80}\{brouillonEnRoute \? TEXTES_DE_L_ECRAN\.pasEncoreEnregistre : TEXTES_DE_L_ECRAN\.pasEnBase\}/;
  verifier('H.3 la rangée : sur Android une phrase et RIEN n’est appelé ; brouillon pas en base, sa phrase (vierge, ou écrit et en '
    + 'route) ; sinon une rangée qui ouvre', rangee.test(code), '');
  /* LE REFUS DE L'APERÇU NOMME LE CHAMP REFUSÉ ET SA CARTE (relecture
     « écran » du 27/11, grave) : `bilan()` les donne, sous les noms de la
     bande de la garde, et `ouVitLeChamp` dit l'endroit, figé ENTIER. */
  const OU = reduit([
    'function ouVitLeChamp(champ) {',
    '  if (CHAMPS_CONDITIONS.includes(champ)) return \'dans « Conditions »\';',
    '  if (CHAMPS_DECHETS.includes(champ)) return `dans « ${LES_DECHETS.rangee} »`;',
    '  if (CHAMPS_ENERGIE.includes(champ)) return `dans « ${LE_LABEL.rangee} »`;',
    '  if (CHAMPS_DU_CHANTIER.includes(champ)) return `dans « ${LE_CHANTIER.titre} »`;',
    '  return \'en haut du devis\';',
    '}',
  ].join('\n'));
  const ou = (/\nfunction ouVitLeChamp\(champ\) \{[\s\S]*?\n\}\n/.exec(code) || [''])[0];
  const corpsBilan = constanteDe(code, 'bilan') || '';
  verifier('H.3 le refus nomme ce qui bloque : `ouVitLeChamp` figée, et `bilan()` rend `refusNommes` (`nomsDesRefus`, `NOMS_ENTETE`), '
    + '`refusOu` et `incompletesNoms` — dans ses DEUX sorties', reduit(ou) === OU
    && /const refusNommes = nomsDesRefus\(enteteRefuse, \{\s+noms: NOMS_ENTETE,/.test(corpsBilan)
    && /const refusOu = \[\.\.\.new Set\(enteteRefuse\.map\(ouVitLeChamp\)\)\];/.test(corpsBilan)
    && /const incompletesNoms = lignesIncompletes\.map\(\(l\) => texteNet\(l\.designation\) \|\| null\);/.test(corpsBilan)
    && (corpsBilan.match(/refusNommes, refusOu/g) || []).length === 1 && /devisEnBase: false, enteteRefuse, refusNommes, refusOu,|devisEnEchec: false, enteteRefuse, refusNommes, refusOu,/.test(corpsBilan)
    && /incompletes, incompletesNoms, enCours, enEchec,/.test(corpsBilan) && /enteteRefuse, refusNommes,\s+refusOu, texte: phrase, quitter,/.test(corpsBilan),
  reduit(ou).slice(0, 200));
  /* Et chaque endroit dit, l'est sous le nom de la rangée à l'écran. */
  verifier('H.3 les endroits nommés sont ceux de l’écran : « Déchets », « Énergie (label RGE) », « Le chantier »',
    LES_DECHETS.rangee === 'Déchets' && LE_LABEL.rangee === 'Énergie (label RGE)' && LE_CHANTIER.titre === 'Le chantier',
    `${LES_DECHETS.rangee} | ${LE_LABEL.rangee} | ${LE_CHANTIER.titre}`);
  verifier('H.3 la carte se monte avec SA séance et se ferme par `fermerCarte` (la flèche, la barre du bas, le retour : un seul chemin)',
    /\{carte === CARTE_APERCU && !!seanceApercu && \(\s*<CarteApercu key=\{`apercu-\$\{cleCarte\}`\} seance=\{seanceApercu\} onFermer=\{fermerCarte\} \/>/.test(code), '');
  const imports = importsStatiquesDe(sf);
  verifier('H.3 la saisie importe l’enveloppe SANS extension (`../lib/devis-pdf`, `../components/CarteApercu`) : Metro choisit '
    + 'la variante de la plateforme (K12)', imports.includes('../lib/devis-pdf') && imports.includes('../components/CarteApercu')
    && !imports.some((m) => /devis-pdf\.|AfficheurPdf|CarteApercu\./.test(m)), imports.filter((m) => /apercu|pdf/i.test(m)).join(', '));
  const lecture = constanteDe(code, 'lireLApercu');
  verifier('H.3 les lectures de l’aperçu nomment chacune leur échec (« [lecture du devis] », « [lecture de « Mon entreprise »] », '
    + '« [lecture du client] ») ; la liste « Pour le remettre » ne bloque rien', !!lecture
    && ['[lecture du devis] ', '[lecture de « Mon entreprise »] ', '[lecture du client] '].every((t) => lecture.includes(t))
    && /motifs: rMotifs\.status === 'fulfilled' && Array\.isArray\(rMotifs\.value\) \? rMotifs\.value : null/.test(lecture)
    && /statut: STATUT,\s+mode: 'apercu',/.test(lecture), '');
  /* « STATUT » NE SE DÉCLARE QU'UNE FOIS, par l'import nommé, sans alias,
     des textes légaux (relecture « contrôles » du 27/11) : un
     `import { STATUT as STATUT_LEGAL }` suivi d'un `const STATUT = …` retirait
     la marque « Document d’essai — sans valeur » de la page et du tampon, et
     les 59 contrôles passaient. Lu dans l'ARBRE, pour les trois fichiers qui
     décident de la marque ou des exemples. */
  const declarationsDeStatut = (fichier) => noeudsDe(arbreDe(fichier), (n) => (ts.isImportSpecifier(n) && n.name.text === 'STATUT')
    || ((ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n) || ts.isFunctionDeclaration(n)
      || ts.isClassDeclaration(n) || ts.isEnumDeclaration(n)) && !!n.name && ts.isIdentifier(n.name) && n.name.text === 'STATUT')
    || ((ts.isImportClause(n) || ts.isNamespaceImport(n)) && !!n.name && n.name.text === 'STATUT'));
  const fautesStatut = [];
  for (const [fichier, legal] of [['src/screens/SaisieDevisScreen.js', '../data/legal'], ['src/screens/DevisScreen.js', '../data/legal'],
    ['src/OpusApp.js', './data/legal']]) {
    const d = declarationsDeStatut(fichier);
    const seul = d.length === 1 && ts.isImportSpecifier(d[0]) && !d[0].propertyName;
    const de = seul ? d[0].parent.parent.parent.moduleSpecifier.text : null;
    if (!seul || de !== legal) fautesStatut.push(`${fichier} : ${d.length} déclaration(s)${de ? ` (de ${de})` : ''}`);
  }
  verifier('H.3 « STATUT » se déclare UNE fois dans la saisie, « Mes devis » et OpusApp : l’import nommé, sans alias, des textes légaux '
    + '— la marque d’essai ne se retire pas par une redéfinition', fautesStatut.length === 0, fautesStatut.join(' | '));
});

section('H.4 Les exemples : Opus Dev seulement, chargés au geste ; et les empreintes que le téléphone doit rendre (K9)');
await sousGarde('H.4', async () => {
  const opus = lire('src/OpusApp.js');
  const ecranDevis = lire('src/screens/DevisScreen.js');
  verifier('H.4 « Mes devis » ne montre les exemples que si `__DEV__` ET `STATUT === \'essai\'`, et jamais sur Android (l’aperçu A4 se '
    + 'fait sur iPhone)', /\{__DEV__ && STATUT === 'essai' && Platform\.OS !== 'android' && !!onExemple && \(/.test(ecranDevis)
    && /import \{ STATUT \} from '\.\.\/data\/legal';/.test(ecranDevis), '');
  const ouvrirExemple = constanteDe(opus, 'ouvrirExemple');
  verifier('H.4 l’ouverture d’un exemple exige les DEUX conditions, charge `apercu-exemples` AU GESTE, et n’attend aucune file',
    !!ouvrirExemple && /^\s*const ouvrirExemple = \(fonction\) => \{\n\s*if \(!\(__DEV__ && STATUT === 'essai'\)\) return;/.test(ouvrirExemple)
    && /lire: async \(\) => require\('\.\/data\/apercu-exemples'\)\[fonction\]\(new Date\(\)\),/.test(ouvrirExemple)
    && /attendreLaFile: async \(\) => \(\{ ok: true \}\),/.test(ouvrirExemple) && /seance\.demarrer\(\);/.test(ouvrirExemple),
  ouvrirExemple ? ouvrirExemple.slice(0, 300) : 'absente');

  /* Ce qui ne se charge qu'au geste n'est importé en haut d'AUCUN fichier
     (ni `import`, ni `export from`, ni `require` hors d'une fonction) — la
     règle de D.5, pour les trois. */
  const fichiers = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'App.js', 'src'], { encoding: 'utf8' })
    .stdout.split('\n').filter((x) => /\.(js|jsx|ts|tsx)$/.test(x) && existsSync(x));
  const fautes = [];
  for (const x of fichiers) {
    const texte = lire(x);
    if (!/apercu-exemples|polices-devis|pdf-temoin/.test(texte)) continue;
    const a = ts.createSourceFile(x, texte, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    importsStatiquesDe(a).filter((m) => /apercu-exemples|polices-devis|pdf-temoin/.test(m)).forEach((m) => fautes.push(`${x} : import ${m}`));
    requiresDe(a).filter((n) => /apercu-exemples|polices-devis|pdf-temoin/.test(premierArgument(n)) && !fonctionDe(n))
      .forEach((n) => fautes.push(`${x} : require('${premierArgument(n)}') au niveau du module`));
    noeudsDe(a, (n) => n.kind === ts.SyntaxKind.ImportKeyword && ts.isCallExpression(n.parent)).forEach(() => fautes.push(`${x} : import()`));
  }
  verifier(`H.4 sur ${fichiers.length} fichiers : apercu-exemples.js, polices-devis.js et pdf-temoin.js ne sont importés en haut d’aucun`,
    fautes.length === 0 && fichiers.length > 50, fautes.join(' | '));
  const ex = arbreDe('src/data/apercu-exemples.js');
  const modulesEx = [...importsStatiquesDe(ex), ...requiresDe(ex).map(premierArgument)];
  verifier('H.4 les exemples ne lisent ni n’écrivent la base : ni `api`, ni `supabase`, ni le réseau',
    !modulesEx.some((m) => /api|supabase|storage|fetch/.test(m)) && !/\bfetch\(/.test(sansCommentaires(lire('src/data/apercu-exemples.js'))),
    modulesEx.join(', '));

  const EX = await import(pathToFileURL(path.resolve('src/data/apercu-exemples.js')).href);
  const P = await chargerPolices();
  const ATTENDUS = [['exempleUneLigne', 1], ['exempleCinqPostes', 9], ['exempleSoixanteLignes', 60]];
  const fauxEx = [];
  for (const [nom, n] of ATTENDUS) {
    const a = await EX[nom](MAINTENANT);
    const b = await EX[nom](MAINTENANT);
    const c = a && a.ok ? composerLApercu(a.donnees, MAINTENANT, P.POLICES_DEVIS) : null;
    const d = b && b.ok ? composerLApercu(b.donnees, MAINTENANT, P.POLICES_DEVIS) : null;
    if (!(a && a.ok && a.donnees.mode === 'exemple' && a.donnees.statut === 'essai' && a.donnees.devisLu.lignes.length === n
      && c && c.ok && d && d.ok && c.html === d.html && c.document.marques && c.document.marques.exemple === MARQUES.exemple)) {
      fauxEx.push(`${nom} : ${a && a.ok ? `${a.donnees.devisLu.lignes.length} lignes, ${a.donnees.mode}` : 'refus'} ${c && c.ok ? '' : `composition ${c && c.raison}`}`);
    }
  }
  verifier('H.4 les trois exemples, fabriqués à la demande : 1, 9 et 60 lignes, mode « exemple », statut « essai », la même page deux fois',
    fauxEx.length === 0, fauxEx.join(' | '));
});

section('H.5 Les Détails de la fabrication : rien du document');
await sousGarde('H.5', async () => {
  const temoin = cas('détails témoin', { client: { ...CLIENT_BRUT, nom: 'NOM-TÉMOIN', adresse: '99 rue TÉMOIN' } });
  const s = creerSeanceEssai({ cas: temoin });
  await s.seance.demarrer();
  const e = s.seance.lire();
  const html = composerEssai(donneesDe(temoin), MAINTENANT).html;
  const lignes = detailsDeFabrication({ etat: e, plateforme: { version: '26.1' }, afficheur: { vue: e.uri, refusees: ['about:blank'] },
    empreintes: { html: empreinteFnv1a(html) } });
  const texte = lignes.join('\n');
  verifier('H.5 la page contient bien « NOM-TÉMOIN » et « 99 rue TÉMOIN » — et les Détails, NI l’un NI l’autre', html.includes('NOM-TÉMOIN')
    && html.includes('99 rue TÉMOIN') && !texte.includes('TÉMOIN') && !texte.includes('NOM-'), texte);
  const attendues = ['Version d’iOS : 26.1', 'Étape : pret', 'Pages : expo-print 2 · pdf-lib 2', 'Polices d’Opus : oui',
    'Polices lues : Inter-Regular, Oswald-SemiBold ; 0 image', 'Métadonnées : Creator Essai · Producer verifier-apercu · Title Aperçu du devis',
    'Fichier brut encore là : non', `Adresse vue par l’afficheur : ${DOSSIER_APERCU}/id-1.pdf`, 'Adresses refusées : about:blank',
    `Empreintes : html ${empreinteFnv1a(html)}`];
  const manquent = attendues.filter((l) => !lignes.includes(l));
  verifier('H.5 les lignes des Détails, en toutes lettres', manquent.length === 0 && lignes.some((l) => /^Durées : enregistrement \d+ ms/.test(l))
    && lignes.some((l) => /^Poids : \d+ octets$/.test(l)), manquent.join(' | '));
  const image = detailsDeFabrication({ etat: { ...e, polices: { noms: [], standard: [], aucune: true, images: 2, inter: false, oswald: false } } });
  const refus = detailsDeFabrication({ etat: { etape: 'refus', origine: 'marque', detail: 'casse', durees: {} } });
  verifier('H.5 « Aucune police lue ; 2 images » ; un refus dit son étape et son erreur', image.includes('Aucune police lue ; 2 images')
    && image.includes('Polices d’Opus : non') && refus.includes('Étape : refus (marque)') && refus.includes('Erreur : casse')
    && !refus.some((l) => l.startsWith('Pages :')), JSON.stringify([image, refus]));
  verifier('H.5 la phrase des polices du téléphone existe (l’écran la montre quand l’issue est « telephone »)',
    typeof PHRASE_POLICES_DU_TELEPHONE === 'string' && PHRASE_POLICES_DU_TELEPHONE.length > 20, String(PHRASE_POLICES_DU_TELEPHONE));
});

/* ================================================================== */
/*  B.15 LES EMPREINTES (K8) — ce qui tient les numéros de version       */
/* ================================================================== */

/* POURQUOI. La page est composée AUSSI par des fonctions qui vivent hors des
   deux fichiers versionnés (`enteteImprimeDetaille`, `rangeesImprimees`,
   `centimesLisibles`…) : changer l'une d'elles change le devis imprimé
   SANS toucher `VERSION_COMPOSITION` ni `VERSION_GABARIT`. Une version que
   personne n'est obligé de monter ne prouve rien — et 2c-3 figera la version
   de chaque devis remis.

   CE QUI EST FIGÉ, pour chaque cas (les cas A, et les 237 de
   `cas-remise.json`) : l'empreinte SHA-256 de ses DONNÉES (les lignes
   brutes, `maintenant` fixé), de son instantané, de son document composé et
   de sa page HTML (avec les VRAIES polices) — ou de son refus. Et pour
   chacun des trois PDF de données : l'empreinte du PDF, et celle de son
   tampon (SHA-256 et FNV-1a).

   LA RÈGLE (le procédé d'`essais-sql` et de `generer-cas-remise`) :
   - le fichier est ENGENDRÉ par `npm run verifier-apercu -- --figer`,
     jamais écrit à la main, jamais en CI ;
   - à données égales, une empreinte qui change SOUS LA MÊME VERSION est
     REFUSÉE, même par `--figer` : l'instantané sous `VERSION_INSTANTANE` (et
     les deux versions qu'il porte) ;
     le document sous celle-ci et `VERSION_COMPOSITION` ; la page sous les
     deux, `VERSION_GABARIT` et les empreintes des polices ; un tampon sous
     la même clé — l'empreinte du code du tampon (`tampon-apercu.js`,
     `format-a4.js`) et la version de pdf-lib. Changer la page devient une
     décision visible : la version monte, le fichier se refige, son diff se
     relit ;
   - sans `--figer`, toute différence rougit, et dit laquelle. */
const FICHIER_EMPREINTES = 'scripts/donnees/apercu-empreintes.json';
const EN_TETE_EMPREINTES = 'ENGENDRÉ par « npm run verifier-apercu -- --figer » : ne pas l’écrire à la main. '
  + 'Une empreinte qui change sous la même version est refusée (cahier 2c-1, §4.1, K8).';

async function empreintesActuelles() {
  const P = await chargerPolices();
  const pdfLibVersion = JSON.parse(lire('node_modules/@cantoo/pdf-lib/package.json')).version;
  const versions = {
    instantane: VERSION_INSTANTANE, composition: VERSION_COMPOSITION, gabarit: VERSION_GABARIT,
    polices: Object.fromEntries(CLES_POLICES.map((k) => [k, P.EMPREINTES_POLICES[k]])),
    /* Le code du tampon, fins de ligne ramenées à LF : un poste Windows
       (core.autocrlf) ne doit pas changer la clé. */
    tampon: sha256(`${lire('src/lib/tampon-apercu.js')}\n${lire('src/lib/format-a4.js')}\npdf-lib ${pdfLibVersion}`.replace(/\r\n/g, '\n')),
  };
  const empreinteDe = (donnees, r) => {
    const e = { donnees: sha256(canon(donnees)) };
    if (!r.ok) return { ...e, refus: sha256(canon(r)) };
    const document = documentDuDevis(r.instantane);
    return {
      ...e, instantane: sha256(canon(r.instantane)), document: sha256(canon(document)),
      html: sha256(devisHtml(document, P.POLICES_DEVIS)),
    };
  };
  const cas = {};
  const doublons = [];
  const ranger = (nom, valeur) => { if (nom in cas) doublons.push(nom); cas[nom] = valeur; };
  for (const c of CAS_A) {
    const { devisLu, client, ...autres } = c.entrees;
    ranger(c.nom, empreinteDe({ brut: c.brut, ...autres }, instantaneDuDevis(c.entrees)));
  }
  for (const k of JSON.parse(lire('supabase/cas-remise.json')).cas) {
    const { attendu, ...sansAttendu } = k;
    ranger(`cas-remise ${k.n}`, empreinteDe({ k: sansAttendu, ENT, EM, TARIFS_35, MAINTENANT }, docDuCasRemise(k)));
  }
  const tampons = {};
  for (const n of PDF_DE_DONNEES) {
    const octets = lirePdfDeDonnees(n);
    const essai = await tamponEssai(octets);
    const exemple = await tamponEssai(octets, { textes: MARQUES_EXEMPLE });
    tampons[n] = {
      source: sha256(octets), pages: essai.pages, essai: sha256(essai.octets), essaiFnv1a: empreinteFnv1a(essai.octets),
      exemple: sha256(exemple.octets), exempleFnv1a: empreinteFnv1a(exemple.octets),
    };
  }
  return { actuel: { versions, cas, tampons }, doublons };
}
/* LES DIFFÉRENCES, classées : celles qu'une version montée (ou des données
   changées, ou un PDF refait) autorise, et celles qu'aucun `--figer` ne
   couvre. */
function ecartsDesEmpreintes(ancien, actuel) {
  const permis = [];
  const interdits = [];
  const memes = (...cles) => cles.every((k) => egal(ancien.versions[k], actuel.versions[k]));
  for (const k of Object.keys(actuel.versions)) if (!egal(ancien.versions[k], actuel.versions[k])) permis.push(`version « ${k} » changée`);
  const noms = [...new Set([...Object.keys(ancien.cas || {}), ...Object.keys(actuel.cas)])];
  for (const nom of noms) {
    const a = (ancien.cas || {})[nom];
    const b = actuel.cas[nom];
    if (!a) { permis.push(`nouveau cas : ${nom}`); continue; }
    if (!b) { permis.push(`cas retiré : ${nom}`); continue; }
    if (egal(a, b)) continue;
    if (a.donnees !== b.donnees) { permis.push(`données changées : ${nom}`); continue; }
    const avant = interdits.length;
    /* L'instantané PORTE les versions de la composition et du gabarit
       (`versions`, §3.9) : il change aussi quand l'une d'elles monte. */
    if (a.instantane !== b.instantane && memes('instantane', 'composition', 'gabarit')) {
      interdits.push(`${nom} : l’instantané a changé sous VERSION_INSTANTANE ${actuel.versions.instantane}`);
    }
    if ((a.document !== b.document || a.refus !== b.refus) && memes('instantane', 'composition')) {
      interdits.push(`${nom} : le document a changé sous VERSION_COMPOSITION ${actuel.versions.composition}`);
    }
    if (a.html !== b.html && memes('instantane', 'composition', 'gabarit', 'polices')) {
      interdits.push(`${nom} : la page a changé sous VERSION_GABARIT ${actuel.versions.gabarit} et les mêmes polices`);
    }
    if (interdits.length === avant) permis.push(`changé, sa version montée : ${nom}`);
  }
  const pdfs = [...new Set([...Object.keys(ancien.tampons || {}), ...Object.keys(actuel.tampons)])];
  for (const n of pdfs) {
    const a = (ancien.tampons || {})[n];
    const b = actuel.tampons[n];
    if (!a || !b) { permis.push(`PDF ${a ? 'retiré' : 'nouveau'} : ${n}`); continue; }
    if (egal(a, b)) continue;
    if (a.source !== b.source) { permis.push(`PDF refait : ${n}`); continue; }
    if (memes('tampon')) interdits.push(`${n} : le tampon a changé sous le même code et le même pdf-lib`);
    else permis.push(`tampon changé, son code changé : ${n}`);
  }
  return { permis, interdits: [...new Set(interdits)] };
}
/* Le fichier : un cas par ligne, pour que son diff se relise. */
function ecrireEmpreintes(o) {
  const bloc = (obj) => Object.keys(obj).map((k, i, t) => `    ${JSON.stringify(k)}: ${JSON.stringify(obj[k])}${i < t.length - 1 ? ',' : ''}`);
  return ['{', `  "_": ${JSON.stringify(EN_TETE_EMPREINTES)},`, `  "versions": ${JSON.stringify(o.versions)},`, '  "cas": {', ...bloc(o.cas),
    '  },', '  "tampons": {', ...bloc(o.tampons), '  }', '}', ''].join('\n');
}

/* LE TÉMOIN DES EMPREINTES (K9) : `src/data/pdf-temoin.js` est ENGENDRÉ par
   `--figer` depuis `scripts/donnees/apercu-chromium-1.pdf`, jamais écrit à
   la main ; sans `--figer`, il doit en être la copie exacte. */
const FICHIER_TEMOIN = 'src/data/pdf-temoin.js';
const texteDuTemoin = (octets) => [
  '/**',
  ' * LE PDF TÉMOIN DES EMPREINTES (K9) — ENGENDRÉ par « npm run verifier-apercu -- --figer » : ne pas l’écrire à la main.',
  ' *',
  ' * `scripts/donnees/apercu-chromium-1.pdf` (un PDF fait par la vraie chaîne, au navigateur, avec les vraies',
  ' * polices), en base64. Il ne sert qu’à Opus Dev : « Détails de la fabrication » y pose le tampon et en montre',
  ' * l’empreinte, que `verifier-apercu` imprime aussi — huit caractères égaux disent que Hermes tamponne comme',
  ' * `node`. Chargé au geste, en `__DEV__` seulement (`empreintesDuTelephone`, `devis-pdf.js`) : jamais au',
  ' * démarrage d’Opus. `verifier-apercu` (H.6) vérifie qu’il est la copie exacte du fichier de données.',
  ' */',
  `export const PDF_TEMOIN = '${Buffer.from(octets).toString('base64')}';`,
  '',
].join('\n');

section(`H.6 Le témoin des empreintes (K9) : ${FIGER ? 'ENGENDRÉ (--figer)' : `${FICHIER_TEMOIN} = scripts/donnees/apercu-chromium-1.pdf`} ; les huit caractères que l’iPhone doit rendre`);
await sousGarde('H.6', async () => {
  const octets = lirePdfDeDonnees('apercu-chromium-1.pdf');
  const attendu = texteDuTemoin(octets);
  if (FIGER && !process.env.CI) {
    if (!existsSync(FICHIER_TEMOIN) || lire(FICHIER_TEMOIN) !== attendu) writeFileSync(FICHIER_TEMOIN, attendu);
  }
  const present = existsSync(FICHIER_TEMOIN) ? lire(FICHIER_TEMOIN) : null;
  verifier(`H.6 ${FICHIER_TEMOIN} est la copie EXACTE (base64) de apercu-chromium-1.pdf (sinon : npm run verifier-apercu -- --figer)`,
    present === attendu, present === null ? 'absent' : 'différent');
  const T = await import(pathToFileURL(path.resolve(FICHIER_TEMOIN)).href);
  const decode = Buffer.from(T.PDF_TEMOIN, 'base64');
  verifier('H.6 décodé, le témoin rend les octets du fichier de données', decode.equals(Buffer.from(octets)), `${decode.length} / ${octets.length}`);
  verifier('H.6 les marques du témoin sont celles de l’essai (E) : « APERÇU », « Document d’essai — sans valeur », aucune « Exemple »',
    egal(MARQUES_DU_TEMOIN, MARQUES_ESSAI), JSON.stringify(MARQUES_DU_TEMOIN));

  const EX = await import(pathToFileURL(path.resolve('src/data/apercu-exemples.js')).href);
  const P = await chargerPolices();
  const e = await empreintesDeControle({ exemples: EX, temoin: T.PDF_TEMOIN, pdfLib: PDFLib, polices: P.POLICES_DEVIS });
  const encore = await empreintesDeControle({ exemples: EX, temoin: T.PDF_TEMOIN, pdfLib: PDFLib, polices: P.POLICES_DEVIS });
  const depuisLesOctets = empreinteFnv1a((await tamponEssai(octets)).octets);
  const huit = (v) => typeof v === 'string' && /^[0-9a-f]{8}$/.test(v);
  verifier('H.6 les empreintes de contrôle : quatre fois huit caractères, les mêmes deux fois ; le tampon du témoin (base64) = '
    + 'celui de ses octets (E)', ['E1', 'E5', 'E60', 'tampon'].every((k) => huit(e[k])) && egal(e, encore) && e.tampon === depuisLesOctets,
  JSON.stringify({ ...e, depuisLesOctets }));
  const e1 = composerLApercu((await EX.exempleUneLigne(MAINTENANT_DES_EMPREINTES)).donnees, MAINTENANT_DES_EMPREINTES, P.POLICES_DEVIS);
  verifier('H.6 l’empreinte E1 est bien celle de la page de l’exemple « 1 ligne » composée à l’instant fixé (26/11/2026, 09:30 UTC)',
    e1.ok && empreinteFnv1a(e1.html) === e.E1 && MAINTENANT_DES_EMPREINTES === Date.UTC(2026, 10, 26, 9, 30), '');
  console.log(`  … ce que « Détails de la fabrication » doit afficher sur l’iPhone (K9) : E1 ${e.E1} · E5 ${e.E5} · E60 ${e.E60} `
    + `· tampon ${e.tampon}`);
});

section('I.1 La liste des fichiers de l’aperçu, DÉRIVÉE (K-m4) : la fermeture des imports, comparée à git et aux listes des contrôles');
await sousGarde('I.1', async () => {
  /* La fermeture : depuis l'écran, la carte et les deux enveloppes, chaque
     import et chaque `require` relatif, avec la variante `.web.js` d'un
     fichier quand elle existe (Metro la prend au navigateur). */
  const RACINES = ['src/components/ApercuDevis.js', 'src/components/CarteApercu.js', 'src/lib/devis-pdf.js', 'src/lib/devis-pdf.web.js'];
  const vus = new Set();
  const file = [...RACINES];
  while (file.length) {
    const x = file.shift();
    if (vus.has(x)) continue;
    vus.add(x);
    const a = arbreDe(x);
    const specs = [...importsStatiquesDe(a), ...requiresDe(a).map(premierArgument)].filter((m) => m.startsWith('.'));
    for (const m of specs) {
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(x), m)).replace(/\.js$/, '');
      [`${base}.js`, `${base}.web.js`].filter((c) => existsSync(c) && !vus.has(c)).forEach((c) => file.push(c));
    }
  }
  const fermeture = [...vus].sort();
  const suivis = new Set(spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .stdout.split('\n').filter(Boolean));
  const horsDeGit = fermeture.filter((x) => !suivis.has(x));
  verifier(`I.1 les ${fermeture.length} fichiers de la fermeture sont tous connus de git (suivis, ou nouveaux et non ignorés)`,
    horsDeGit.length === 0 && fermeture.length > 20, horsDeGit.join(', '));

  /* Les listes écrites à la main par les autres contrôles : les mots de
     l'écran (`verifier-etats`, « registre » et « vérifié » en mot entier),
     le module du devis (`verifier-devis`). Lues dans leur texte. */
  const listeDe = (fichier, nom) => {
    const t = lire(fichier);
    const i = t.indexOf(`const ${nom} = [`);
    const j = i < 0 ? -1 : t.indexOf('];', i);
    return i < 0 || j < 0 ? null : [...sansCommentaires(t.slice(i, j)).matchAll(/'(src\/[^']+\.js)'/g)].map((m) => m[1]);
  };
  const MOTS = listeDe('scripts/verifier-etats.mjs', 'DEVIS');
  const MODULE = listeDe('scripts/verifier-devis.mjs', 'FICHIERS_DU_MODULE');
  /* LE SOCLE : ce que l'aperçu emprunte au reste d'Opus, relu par SES
     contrôles (le thème, les boutons, les textes communs, le calcul du
     devis, la démonstration), et les deux fichiers ENGENDRÉS (polices,
     témoin), relus par D et H.6. Un fichier qui n'est ni du socle, ni dans
     les listes, est un fichier NOUVEAU de l'aperçu que personne ne relit :
     il rougit. */
  const SOCLE = [
    'src/theme.js', 'src/components/ui.js', 'src/components/icons.js',
    'src/lib/centimes.js', 'src/lib/devis.js', 'src/lib/entreprise.js', 'src/lib/erreurs.js', 'src/lib/formats.js',
    'src/lib/identifiant.js', 'src/lib/meme-valeur.js', 'src/lib/metiers.js', 'src/lib/postes.js', 'src/lib/rapprochement.js',
    'src/lib/retour.js', 'src/lib/siret.js', 'src/lib/texte.js', 'src/lib/tva.js',
    'src/data/ape-metiers.js', 'src/data/catalogue-metiers.js', 'src/data/demo.js', 'src/data/devis-demo.js', 'src/data/emetteur-demo.js',
    'src/data/formes-juridiques.js', 'src/data/mediateurs.js', 'src/data/photos-demo.js', 'src/data/pieces-justificatives.js',
    'src/data/siret-demo.js',
    'src/data/polices-devis.js', 'src/data/pdf-temoin.js',
  ];
  const sansListe = fermeture.filter((x) => !SOCLE.includes(x) && !(MOTS || []).includes(x) && !(MODULE || []).includes(x));
  verifier('I.1 chaque fichier de l’aperçu est relu par une liste (`verifier-etats` DEVIS, `verifier-devis` FICHIERS_DU_MODULE) ou '
    + 'nommé au socle — un fichier nouveau qui n’y est pas rougit', !!MOTS && !!MODULE && sansListe.length === 0, sansListe.join(', '));
  const PROPRES = ['src/components/AfficheurPdf.js', 'src/components/AfficheurPdf.web.js', 'src/components/ApercuDevis.js',
    'src/components/CarteApercu.js', 'src/data/apercu-exemples.js', 'src/lib/composition-apercu.js', 'src/lib/devis-html.js',
    'src/lib/devis-pdf.js', 'src/lib/devis-pdf.web.js', 'src/lib/document-devis.js', 'src/lib/etapes-apercu.js',
    'src/lib/fabrication-apercu.js', 'src/lib/format-a4.js', 'src/lib/instantane-devis.js', 'src/lib/reglages-afficheur.js',
    'src/lib/tampon-apercu.js'];
  const absentsDesMots = PROPRES.filter((x) => !(MOTS || []).includes(x));
  verifier('I.1 les fichiers PROPRES de l’aperçu sont tous dans la liste des mots de `verifier-etats` (« registre », « vérifié »)',
    absentsDesMots.length === 0, absentsDesMots.join(', '));
  const absentsDuModule = ['src/components/ApercuDevis.js', 'src/components/CarteApercu.js'].filter((x) => !(MODULE || []).includes(x));
  verifier('I.1 la carte et l’écran de l’aperçu sont dans `FICHIERS_DU_MODULE` de `verifier-devis`', absentsDuModule.length === 0,
    absentsDuModule.join(', '));
  const propresHorsFermeture = PROPRES.filter((x) => !fermeture.includes(x));
  verifier('I.1 …et chacun est bien dans la fermeture (une liste qui garde un fichier parti ne relit rien)',
    propresHorsFermeture.length === 0, propresHorsFermeture.join(', '));
});

section(`B.15 Les empreintes (K8) : instantané, document, page, tampon — ${FIGER ? 'FIGÉES (--figer)' : 'comparées à scripts/donnees/apercu-empreintes.json'}`);
await sousGarde('B.15', async () => {
  const { actuel, doublons } = await empreintesActuelles();
  verifier('B.15 chaque cas a un nom à lui (sinon deux empreintes se recouvriraient)', doublons.length === 0, doublons.join(' | '));
  const nbCas = Object.keys(actuel.cas).length;
  const ancien = existsSync(FICHIER_EMPREINTES) ? JSON.parse(lire(FICHIER_EMPREINTES)) : null;
  if (FIGER) {
    if (process.env.CI) {
      verifier('B.15 --figer ne tourne jamais en CI : les empreintes se figent sur un poste, et leur diff se relit', false, 'CI');
      return;
    }
    const { permis, interdits } = ancien ? ecartsDesEmpreintes(ancien, actuel) : { permis: ['premier --figer'], interdits: [] };
    verifier('B.15 --figer : aucune empreinte ne change sous la même version (sinon : montez VERSION_COMPOSITION, VERSION_GABARIT '
      + 'ou VERSION_INSTANTANE, et relisez pourquoi)', interdits.length === 0, interdits.slice(0, 6).join(' | '));
    if (interdits.length) return;
    writeFileSync(FICHIER_EMPREINTES, ecrireEmpreintes(actuel));
    console.log(`  ✎ ${FICHIER_EMPREINTES} écrit : ${nbCas} cas, ${Object.keys(actuel.tampons).length} tampons — `
      + `${permis.length ? `${permis.length} différence(s) : ${permis.slice(0, 5).join(' ; ')}${permis.length > 5 ? ' ; …' : ''}` : 'rien n’a changé'}.`);
    return;
  }
  verifier(`B.15 ${FICHIER_EMPREINTES} existe (sinon : npm run verifier-apercu -- --figer)`, !!ancien, '');
  if (!ancien) return;
  verifier('B.15 son en-tête dit qu’il est engendré', ancien._ === EN_TETE_EMPREINTES, String(ancien._));
  const { permis, interdits } = ecartsDesEmpreintes(ancien, actuel);
  verifier('B.15 aucune empreinte n’a changé sous la même version (instantané, document, page, tampon)', interdits.length === 0,
    `${interdits.slice(0, 5).join(' | ')} — montez la version qui convient, puis --figer, et relisez le diff`);
  verifier(`B.15 les ${nbCas} cas et les ${Object.keys(actuel.tampons).length} tampons = le fichier, au caractère près`,
    egal(ancien.versions, actuel.versions) && egal(ancien.cas, actuel.cas) && egal(ancien.tampons, actuel.tampons),
    `${permis.slice(0, 5).join(' | ')} — si c’est voulu : npm run verifier-apercu -- --figer, et relisez le diff`);
  const t = actuel.tampons['apercu-chromium-1.pdf'];
  console.log(`  … le témoin K9 (apercu-chromium-1.pdf, marques d’essai) : FNV-1a ${t.essaiFnv1a} ; en exemple : ${t.exempleFnv1a}.`);
});

if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ L’aperçu : l’instantané, la composition, le gabarit, les polices, le tampon, la fabrication, l’afficheur, la séance '
  + 'et les empreintes (A, B, C, D, E, F, G, H, I) tiennent leurs règles.\n');
