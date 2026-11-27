/**
 * LA FABRICATION DE L'APERÇU — du HTML au fichier PDF marqué sur chaque
 * page (étape 2c-1, cahier §5.2).
 *
 * TOUT CE QUI DÉCIDE EST ICI, LES OUTILS SONT PASSÉS (K6). L'enveloppe du
 * téléphone (`devis-pdf.js`) ne fait que fournir les vrais outils —
 * l'impression d'`expo-print`, les fichiers d'`expo-file-system`, le module
 * `pdf-lib` — et `verifier-apercu` (F) fait tourner CE fichier avec des faux
 * qui enregistrent leurs appels : le verrou, les délais, l'effacement du
 * fichier brut, la purge, le refus d'un document vide se JOUENT, au lieu
 * d'être relus.
 *
 * LES ÉTAPES, chacune NOMMÉE dans sa phrase (la leçon d'`envoiTelephone` :
 * sur un défaut qu'on ne peut pas reproduire, la phrase que lit l'artisan est
 * la seule donnée qu'on aura) :
 *   module → purge → mise en page → validité → lecture → marque → écriture.
 *
 * LE DÉLAI D'UNE ÉTAPE LOCALE NE PASSE JAMAIS PAR `messageClair` (T7) :
 * `avecDelai` lève une erreur qu'`erreurs.js` prend pour une coupure du
 * RÉSEAU. Un rendu de pages trop long n'est pas une coupure : il a ses
 * phrases, et son minuteur (`attendre`, passé).
 *
 * LE VERROU, ET LE RENDU QUI NE REVIENT JAMAIS (T7). `expo-print` ne sait pas
 * quand le moteur de rendu de WebKit meurt : sa promesse peut ne JAMAIS se
 * régler. D'où :
 *   - un seul rendu à la fois : un second appel ATTEND le premier ;
 *   - au délai DOUX (30 s), la fabrication rend son échec (« met trop
 *     longtemps »), mais le verrou reste tenu : le rendu tourne peut-être
 *     encore ;
 *   - au délai DUR (90 s), le verrou se relâche : le rendu est perdu ;
 *   - un résultat arrivé APRÈS un délai voit son fichier brut EFFACÉ à son
 *     arrivée ;
 *   - `enCours()` rend une promesse qui se règle quand le rendu en cours
 *     finit ou est tenu pour perdu (et `null` quand rien ne tourne).
 *
 * LES FICHIERS (D21) : le dossier de l'aperçu est CRÉÉ avant d'écrire (sous
 * iOS, écrire dans un dossier absent échoue) ; le brut d'`expo-print` est
 * effacé dès qu'il est lu ; les deux dossiers sont purgés au geste suivant
 * (une application tuée laisse son fichier : la purge le ramasse). Aucune de
 * ces étapes de nettoyage ne lève jamais.
 *
 * CE FICHIER N'IMPORTE QUE `./tampon-apercu.js` ET `./format-a4.js`, qui
 * n'importent rien : `node` le fait tourner.
 */

import { tamponner } from './tampon-apercu.js';
import * as A4 from './format-a4.js';

/** Le délai DOUX de la mise en page : la séance dit « met trop longtemps ».
 *  Une minute, et pas trente secondes : passé 5 s, l'écran dit « Sur un long
 *  devis, cela peut prendre jusqu’à une minute » — abandonné à 30 s, un rendu
 *  de 40 s n'était JAMAIS montré, et « Réessayer » rejouait le même échec
 *  (relectures « technique » et « écran » du 27/11, mesuré). Le délai DUR
 *  reste au-dessus. */
export const DELAI_DOUX = 60000;
/** Le délai DUR : le rendu est tenu pour perdu, le verrou se relâche. */
export const DELAI_DUR = 90000;

/** Les phrases de la fabrication, l'étape entre crochets (A.2 et §5.2). */
export const PHRASES_DE_LA_FABRICATION = Object.freeze({
  module: '[module] Cette version d’Opus ne sait pas encore fabriquer un aperçu : mettez Opus à jour.',
  /* pdf-lib ABSENT DU PAQUET (relecture « technique » du 27/11) : un
     `npm ci` oublié sur l'ordinateur, après un `git pull` — mettre Opus à
     jour n'y ferait rien. La commande est celle que le propriétaire lance
     déjà (PowerShell). */
  moduleAbsent: '[module] Le module des PDF manque à ce paquet d’Opus : sur l’ordinateur, arrêtez le serveur (Ctrl+C), '
    + 'lancez « npm ci », puis « npx expo start -c ».',
  tropLong: '[mise en page] Le téléphone met trop longtemps à fabriquer les pages.',
  rendu: '[mise en page] Le téléphone n’a pas pu fabriquer les pages.',
  vide: '[mise en page] Le téléphone a rendu un document vide.',
  lecture: '[lecture] Le document fabriqué n’a pas pu être relu.',
  marque: '[marque sur chaque page] L’aperçu n’a pas pu être marqué sur chaque page : il n’est pas montré.',
  ecriture: '[écriture] L’aperçu n’a pas pu être rangé sur le téléphone.',
});

/** Les outils sans lesquels la fabrication ne peut pas commencer. */
export const OUTILS_REQUIS = Object.freeze([
  'imprimer', 'lireOctets', 'creerDossier', 'ecrire', 'effacer', 'lister', 'existe', 'maintenant', 'attendre', 'nouvelId',
]);

const message = (e) => (e && e.message ? String(e.message) : String(e));

/* Un chemin dans un dossier : `<dossier>/<nom>`, sans double barre. */
const dansLeDossier = (dossier, nom) => `${String(dossier).replace(/\/+$/, '')}/${nom}`;

/**
 * LA FABRIQUE — `outils` : `{ imprimer, lireOctets, creerDossier, ecrire,
 * effacer, lister, existe, pdfLib, maintenant, attendre, nouvelId,
 * dossierApercu, dossierImpression }` (ou `null` : pas de téléphone qui sache
 * imprimer). `a4` : le format (par défaut, `format-a4.js`).
 *   → { fabriquer, enCours, effacer, purger }
 */
export function creerFabrique(outils, a4 = A4) {
  const o = outils || null;
  let verrou = null;

  /* Prendre le verrou : la promesse qu'`enCours()` rend, et la main qui le
     relâche — une seule fois, quel que soit le chemin. */
  const prendre = () => {
    let relacher = null;
    const promesse = new Promise((r) => { relacher = r; });
    const v = { promesse, libre: false };
    v.liberer = () => {
      if (v.libre) return;
      v.libre = true;
      if (verrou === v) verrou = null;
      relacher();
    };
    verrou = v;
    return v;
  };

  /* Les nettoyages ne lèvent jamais : un fichier qui ne s'efface pas n'est
     pas une raison de perdre l'aperçu. */
  const effacer = (uri) => {
    if (!o || typeof uri !== 'string' || !uri) return false;
    try { o.effacer(uri); return true; } catch { return false; }
  };
  const lister = (dossier) => {
    if (!o || !dossier) return [];
    try {
      const l = o.lister(dossier);
      return Array.isArray(l) ? l.filter((x) => typeof x === 'string') : [];
    } catch { return []; }
  };
  const existe = (uri) => {
    if (!o || typeof uri !== 'string') return null;
    try { return !!o.existe(uri); } catch { return null; }
  };
  /** La purge : les aperçus de `apercu-devis/`, et les PDF bruts que
   *  l'impression a laissés. Ne lève jamais ; rend le nombre de fichiers
   *  effacés. */
  const purger = () => {
    let n = 0;
    for (const uri of lister(o && o.dossierApercu)) if (effacer(uri)) n += 1;
    for (const uri of lister(o && o.dossierImpression)) if (/\.pdf$/i.test(uri) && effacer(uri)) n += 1;
    return n;
  };

  const instant = () => {
    const v = o.maintenant();
    return typeof v === 'number' ? v : Number(v);
  };

  /**
   * FABRIQUER — `html` : la page ; `textes` : les marques du document ;
   * `numeroAffiche` : « DEV-2026-···· » ; `surEtape(nom)` : prévenu quand la
   * marque commence (la séance l'affiche) ; `doitContinuer()` : lu avant
   * chaque étape (la séance arrêtée, la chaîne s'arrête là où elle en est).
   *   → { ok: true, uri, pages, pagesTelephone, polices, metadonnees, octets,
   *       durees, brutEncoreLa }
   *   → { ok: false, etape, phrase, detail, durees }
   */
  async function fabriquer({ html, textes, numeroAffiche, surEtape = null, doitContinuer = null } = {}) {
    const durees = {};
    const refus = (etape, phrase, detail = null) => ({ ok: false, etape, phrase, detail: detail == null ? null : String(detail), durees });
    const manquants = o ? OUTILS_REQUIS.filter((k) => typeof o[k] !== 'function') : ['tous'];
    if (!o || manquants.length) {
      return refus('module', PHRASES_DE_LA_FABRICATION.module, o ? `outils absents : ${manquants.join(', ')}` : 'aucun outil');
    }
    if (!o.pdfLib || o.pdfLib.absent || !o.pdfLib.PDFDocument) {
      const detail = o.pdfLib && o.pdfLib.erreur ? message(o.pdfLib.erreur) : 'pdf-lib absent';
      /* Absent du paquet (le message de Metro ou de `node`), ou planté à son
         chargement : deux causes, deux phrases. */
      const absentDuPaquet = /Cannot find module|Requiring unknown module|Unable to resolve/i.test(detail);
      return refus('module', absentDuPaquet ? PHRASES_DE_LA_FABRICATION.moduleAbsent : PHRASES_DE_LA_FABRICATION.module, detail);
    }
    const continuer = () => (typeof doitContinuer === 'function' ? doitContinuer() !== false : true);

    /* Un rendu à la fois : on attend celui qui tourne (ou qui est tenu pour
       perdu au délai dur). */
    while (verrou) await verrou.promesse;
    if (!continuer()) return refus('arret', null);
    const v = prendre();
    let relacherPlusTard = false;
    const t0 = instant();
    try {
      /* LA PURGE (D21) : ce que le geste précédent a laissé. */
      purger();
      durees.purge = instant() - t0;
      if (!continuer()) return refus('arret', null);

      /* LA MISE EN PAGE, avec ses deux délais. */
      const t1 = instant();
      const rendu = Promise.resolve().then(() => o.imprimer({
        html,
        width: a4.A4_PT.largeur,
        height: a4.A4_PT.hauteur,
        margins: { top: a4.MARGES_PT.top, right: a4.MARGES_PT.right, bottom: a4.MARGES_PT.bottom, left: a4.MARGES_PT.left },
        base64: false,
      }));
      const DOUX = {};
      let issue;
      try {
        issue = await Promise.race([rendu, o.attendre(DELAI_DOUX).then(() => DOUX)]);
      } catch (e) {
        return refus('mise en page', PHRASES_DE_LA_FABRICATION.rendu, message(e));
      }
      if (issue === DOUX) {
        /* Le rendu tourne peut-être encore : le verrou reste tenu jusqu'à
           sa fin, ou jusqu'au délai dur ; son fichier, s'il arrive, est
           effacé à son arrivée. */
        relacherPlusTard = true;
        rendu.then((r) => { if (r && typeof r.uri === 'string') effacer(r.uri); v.liberer(); }, () => v.liberer());
        o.attendre(DELAI_DUR - DELAI_DOUX).then(() => v.liberer(), () => v.liberer());
        return refus('mise en page', PHRASES_DE_LA_FABRICATION.tropLong, `plus de ${DELAI_DOUX / 1000} s`);
      }
      durees.miseEnPage = instant() - t1;
      const r = issue;
      const brut = r && typeof r.uri === 'string' ? r.uri : null;

      /* LA VALIDITÉ (D22) : une adresse, et au moins une page. */
      if (!brut || !(Number(r.numberOfPages) > 0)) {
        effacer(brut);
        return refus('validité', PHRASES_DE_LA_FABRICATION.vide, `uri ${typeof (r && r.uri)}, pages ${r ? r.numberOfPages : 'aucune'}`);
      }
      if (!continuer()) { effacer(brut); return refus('arret', null); }

      /* LA LECTURE, puis le brut EFFACÉ dans tous les cas. */
      const t2 = instant();
      let octets;
      try {
        octets = await o.lireOctets(brut);
        if (!octets || typeof octets.length !== 'number' || octets.length === 0) throw new Error('aucun octet');
      } catch (e) {
        effacer(brut);
        return refus('lecture', PHRASES_DE_LA_FABRICATION.lecture, message(e));
      }
      effacer(brut);
      const brutEncoreLa = existe(brut);
      durees.relecture = instant() - t2;
      if (!continuer()) return refus('arret', null);

      /* LA MARQUE SUR CHAQUE PAGE. Un document de zéro page est un document
         VIDE : la même phrase que l'impression qui n'en rend aucune. */
      if (typeof surEtape === 'function') { try { surEtape('marque'); } catch { /* l'écran ne doit rien casser ici */ } }
      const t3 = instant();
      let tampon;
      try {
        tampon = await tamponner(o.pdfLib, octets, { textes, numeroAffiche, a4 });
      } catch (e) {
        if (e && e.code === 'vide') return refus('marque', PHRASES_DE_LA_FABRICATION.vide, message(e));
        return refus('marque', PHRASES_DE_LA_FABRICATION.marque, message(e));
      }
      durees.marque = instant() - t3;
      if (!continuer()) return refus('arret', null);

      /* L'ÉCRITURE : le dossier CRÉÉ d'abord (T6). */
      const t4 = instant();
      let uri = null;
      try {
        o.creerDossier(o.dossierApercu);
        uri = dansLeDossier(o.dossierApercu, `${o.nouvelId()}.pdf`);
        await o.ecrire(uri, tampon.octets);
      } catch (e) {
        effacer(uri);
        return refus('écriture', PHRASES_DE_LA_FABRICATION.ecriture, message(e));
      }
      durees.ecriture = instant() - t4;
      durees.total = instant() - t0;
      return {
        ok: true,
        uri,
        pages: tampon.pages,
        pagesTelephone: Number(r.numberOfPages),
        polices: tampon.polices,
        metadonnees: tampon.metadonnees,
        octets: tampon.octets.length,
        durees,
        brutEncoreLa,
      };
    } finally {
      if (!relacherPlusTard) v.liberer();
    }
  }

  return {
    fabriquer,
    enCours: () => (verrou ? verrou.promesse : null),
    effacer,
    purger,
  };
}
