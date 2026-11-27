/**
 * L'ENVELOPPE DE L'APERÇU SUR LE TÉLÉPHONE — elle branche `expo-print`,
 * `expo-file-system` et `@cantoo/pdf-lib` sur la fabrication (étape 2c-1,
 * cahier §5.4, §4.7).
 *
 * MINCE, EXPRÈS (K6). Tout ce qui DÉCIDE — le verrou, les délais, l'effacement
 * du brut, la purge, le refus d'un document vide — vit dans
 * `fabrication-apercu.js`, que `node` fait tourner avec des faux
 * (`verifier-apercu`, F). Ici, on ne fait que fournir les VRAIS outils.
 *
 * CE QUI SE CHARGE AU GESTE, ET JAMAIS AU DÉMARRAGE D'OPUS :
 *   - `expo-print`, après avoir vérifié que son module natif est là
 *     (`requireOptionalNativeModule('ExpoPrint')`) : son fichier lève dès son
 *     chargement sans le natif (`ExponentPrint.ts:3`) ;
 *   - `@cantoo/pdf-lib`, par un `require` écrit comme PREMIÈRE instruction du
 *     bloc d'un `try` (D29) : Metro en fait une dépendance FACULTATIVE. Paquet
 *     absent du PC (un `npm ci` oublié), Opus s'ouvre quand même, et c'est
 *     l'aperçu seul qui dit « [module] » — mesuré à l'étape 1 de la
 *     construction (paquet de développement servi par Metro : la dépendance
 *     rangée `[null]`). UNE FORME FRAGILE : un `if` entre le `try` et le
 *     `require`, ou le `require` dans une fonction appelée depuis le `try`,
 *     et la dépendance redevient obligatoire — `verifier-apercu` (F.2) exige
 *     la forme exacte ;
 *   - les polices (`polices-devis.js`, ≈ 60 Ko de chaînes, §4.9).
 *
 * UNE FABRIQUE POUR TOUTE L'APPLICATION (`fabriqueDuTelephone`) : le verrou
 * est le sien, et deux cartes qui auraient chacune leur fabrique laisseraient
 * deux rendus tourner ensemble.
 *
 * LES FICHIERS. `expo-print` range son PDF dans `Library/Caches/Print/` ;
 * l'aperçu marqué va dans `Library/Caches/apercu-devis/`, CRÉÉ avant d'écrire
 * (T6). `Library/Caches` n'apparaît pas dans l'app Fichiers (`app.json` ne
 * pose ni `UIFileSharingEnabled` ni `LSSupportsOpeningDocumentsInPlace`).
 * Purger `Print/*.pdf` est sûr en 2c-1 — seul l'aperçu y écrit — et SERA À
 * REVOIR EN 2c-3, quand le devis remis y passera aussi.
 *
 * SUR LE NAVIGATEUR, c'est `devis-pdf.web.js` qui est pris : il n'appelle
 * rien (au web, `printToFileAsync` EST `window.print()`). Les importeurs
 * écrivent `'../lib/devis-pdf'` SANS extension — avec `.js`, Metro prendrait
 * ce fichier-ci même au navigateur (K12).
 *
 * AUCUN BOUTON D'OPUS NE PARTAGE NI N'IMPRIME : ce fichier ne fabrique qu'un
 * fichier provisoire, que l'aperçu montre puis efface.
 */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { File, Directory, Paths } from 'expo-file-system';
import { creerFabrique } from './fabrication-apercu.js';
import * as A4 from './format-a4.js';
import { composerLApercu, empreintesDeControle } from './composition-apercu.js';
import { nouvelIdentifiant } from './identifiant.js';

/* LE MODULE PDF, chargé au geste (D29). La forme est exacte : le `require`
   est la première instruction du bloc du `try`. */
let cachePdf = null;
function modulePdf() {
  if (cachePdf) return cachePdf;
  try {
    cachePdf = require('@cantoo/pdf-lib');
  } catch (e) {
    return { absent: true, erreur: e };
  }
  return cachePdf;
}

/* LES POLICES, chargées au premier aperçu, gardées ensuite. */
let cachePolices = null;
function policesDuDevis() {
  if (!cachePolices) cachePolices = require('../data/polices-devis').POLICES_DEVIS;
  return cachePolices;
}

/** LE `composer` DE LA SÉANCE : les données lues → la page, avec les vraies
 *  polices. */
export function composerPourLApercu(donnees, maintenant) {
  return composerLApercu(donnees, maintenant, policesDuDevis());
}

/* Un nettoyage ne lève jamais : un fichier qui ne s'efface pas n'est pas une
   raison de perdre l'aperçu. `delete()` est synchrone, et lève si le fichier
   n'existe pas. */
function effacerFichier(uri) {
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch (e) { /* rien */ }
}

/* Le contenu d'un dossier, en adresses. `list()` lève sur un dossier absent :
   ce n'est pas une panne, c'est « rien ». */
function listerDossier(uri) {
  try {
    return new Directory(uri).list().map((x) => x.uri);
  } catch (e) {
    return [];
  }
}

/**
 * LES VRAIS OUTILS DE LA FABRICATION, ou `null` : hors de l'iPhone (l'aperçu
 * en pages A4 ne se fait que là), ou quand le module natif d'impression
 * manque à cette version d'Opus Dev.
 */
function outilsDuTelephone() {
  if (Platform.OS !== 'ios') return null;
  if (!requireOptionalNativeModule('ExpoPrint')) return null;
  let impression = null;
  try {
    impression = require('expo-print');
  } catch (e) {
    return null;
  }
  if (!impression || typeof impression.printToFileAsync !== 'function') return null;
  return {
    imprimer: (options) => impression.printToFileAsync(options),
    lireOctets: (uri) => new File(uri).bytes(),
    creerDossier: (uri) => { new Directory(uri).create({ intermediates: true, idempotent: true }); },
    ecrire: (uri, octets) => { new File(uri).write(octets); },
    effacer: effacerFichier,
    lister: listerDossier,
    existe: (uri) => new File(uri).exists,
    /* Relu à CHAQUE fabrication : un module absent au premier geste peut être
       là au suivant (après un `npm ci` et un rechargement). */
    get pdfLib() { return modulePdf(); },
    maintenant: () => Date.now(),
    attendre: (ms) => new Promise((resoudre) => { setTimeout(resoudre, ms); }),
    nouvelId: () => nouvelIdentifiant() || `apercu-${Date.now()}`,
    dossierApercu: new Directory(Paths.cache, 'apercu-devis').uri,
    dossierImpression: new Directory(Paths.cache, 'Print').uri,
  };
}

let fabrique = null;
/** LA fabrique de l'application, créée au premier geste et gardée. */
export function fabriqueDuTelephone() {
  if (!fabrique) {
    let outils = null;
    try { outils = outilsDuTelephone(); } catch (e) { outils = null; }
    fabrique = creerFabrique(outils, A4);
  }
  return fabrique;
}

/** Effacer un aperçu ; ne lève jamais. */
export function effacerApercu(uri) {
  try { return fabriqueDuTelephone().effacer(uri); } catch (e) { return false; }
}

/** Purger les aperçus et les bruts laissés ; ne lève jamais. */
export function purgerApercus() {
  try { return fabriqueDuTelephone().purger(); } catch (e) { return 0; }
}

/**
 * LES EMPREINTES DE CONTRÔLE (K9, `__DEV__` seulement) — huit caractères
 * chacune, que le propriétaire compare à celles qu'imprime
 * `verifier-apercu` (H.4) : si elles sont égales, Hermes compose et tamponne
 * comme `node`. Les exemples et le PDF témoin se chargent ICI, au geste — et
 * jamais dans une version publiée, où `__DEV__` est faux. Rien d'un vrai
 * devis n'y entre (C-M13). Ne lève jamais : une erreur se dit dans les
 * Détails.
 */
export async function empreintesDuTelephone() {
  if (!__DEV__) return null;
  try {
    return await empreintesDeControle({
      exemples: require('../data/apercu-exemples'),
      temoin: require('../data/pdf-temoin').PDF_TEMOIN,
      pdfLib: modulePdf(),
      polices: policesDuDevis(),
    });
  } catch (e) {
    return { erreur: e && e.message ? String(e.message) : String(e) };
  }
}
