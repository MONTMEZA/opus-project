/**
 * L'ENVELOPPE DE L'APERÇU AU NAVIGATEUR — les mêmes noms que `devis-pdf.js`,
 * et RIEN n'est appelé (étape 2c-1, cahier §5.4, D23).
 *
 * Au navigateur, `printToFileAsync` d'`expo-print` EST `window.print()` : il
 * ouvrirait la boîte d'impression du navigateur. Ce fichier n'importe donc
 * ni `expo-print`, ni `expo-file-system`, ni `@cantoo/pdf-lib`. Sa fabrique
 * ne fabrique rien : elle dit `surLeWeb`, et la séance montre la page HTML
 * dans le cadre web (`AfficheurPdf.web.js`), sans étape « mise en page » ni
 * « marque », sans résumé « N pages » (E-M5) — il n'y a ni pages, ni marque
 * sur chaque page, ni numéros de page au navigateur.
 *
 * Metro prend ce fichier au navigateur parce que les importeurs écrivent
 * `'../lib/devis-pdf'` SANS extension (K12) ; `verifier-imports` refuse un
 * import écrit avec `.js`.
 */
import { composerLApercu } from './composition-apercu.js';

/* Les polices, chargées au premier aperçu : la page du cadre web les pose
   comme celle du téléphone. */
let cachePolices = null;
function policesDuDevis() {
  if (!cachePolices) cachePolices = require('../data/polices-devis').POLICES_DEVIS;
  return cachePolices;
}

/** Le `composer` de la séance : la même composition que sur l'iPhone. */
export function composerPourLApercu(donnees, maintenant) {
  return composerLApercu(donnees, maintenant, policesDuDevis());
}

/* Une fabrique qui ne fabrique rien : la séance s'arrête à la page. */
const FABRIQUE_DU_NAVIGATEUR = Object.freeze({
  surLeWeb: true,
  fabriquer: async () => ({ ok: false, etape: 'web', phrase: null, detail: null, durees: {} }),
  enCours: () => null,
  effacer: () => false,
  purger: () => 0,
});

export function fabriqueDuTelephone() {
  return FABRIQUE_DU_NAVIGATEUR;
}

export function effacerApercu() {
  return false;
}

export function purgerApercus() {
  return 0;
}

/** Les empreintes de contrôle (K9) ne valent que pour l'iPhone : rien ici. */
export async function empreintesDuTelephone() {
  return null;
}
