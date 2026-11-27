/**
 * LA COMPOSITION D'UN APERÇU, EN UNE FONCTION — des données lues au geste à
 * la page HTML (étape 2c-1, cahier §5.3 : le `composer` que la séance reçoit).
 *
 * POURQUOI UN FICHIER À PART. La séance (`etapes-apercu.js`) reçoit son
 * `composer` de l'appelant, et deux appelants le lui donnent : la saisie d'un
 * devis (les vraies lectures) et l'écran des exemples (des données
 * inventées). Écrite dans chacun d'eux, la même suite — l'instantané, le
 * document, la page, le compte des points de la liste — finirait par
 * différer, et un exemple ne prouverait plus rien du vrai aperçu.
 *
 * LES POLICES SONT PASSÉES, jamais importées ici : `polices-devis.js` (≈ 60 Ko
 * de chaînes) ne se charge qu'au geste, par l'enveloppe (`devis-pdf.js`, D3).
 * `verifier-apercu` (H) fait tourner CE fichier avec des polices d'essai.
 *
 * `donnees` = les entrées de `instantaneDuDevis` (sans `maintenant`, que la
 * séance donne), plus `motifs` : la liste « Pour le remettre » LUE, ou `null`
 * quand elle n'a pas pu l'être — l'écran tait alors le compte des points
 * (A.2). Une liste lue et vide n'est pas une liste illisible.
 *
 * CE FICHIER N'IMPORTE QUE DES FICHIERS PURS : `node` le fait tourner.
 */
import { instantaneDuDevis } from './instantane-devis.js';
import { documentDuDevis, MARQUES, RANG_EN_ATTENTE } from './document-devis.js';
import { devisHtml } from './devis-html.js';
import { compterLesPlaces } from './devis.js';
import { tamponner } from './tampon-apercu.js';
import * as A4 from './format-a4.js';
import { empreinteFnv1a } from './etapes-apercu.js';

/**
 * `{ ok: true, html, document, places }`, ou le refus de l'instantané tel
 * quel (`{ ok: false, raison, phrase? }`) : la séance en fait sa phrase.
 * `places` : `{ page, pasEncore }` sur la liste lue, ou `null`.
 */
export function composerLApercu(donnees, maintenant, polices) {
  const { motifs = null, ...entrees } = donnees && typeof donnees === 'object' ? donnees : {};
  const r = instantaneDuDevis({ ...entrees, maintenant });
  if (!r.ok) return r;
  const document = documentDuDevis(r.instantane);
  return {
    ok: true,
    html: devisHtml(document, polices),
    document,
    places: Array.isArray(motifs) ? compterLesPlaces(motifs) : null,
  };
}

/**
 * LES EMPREINTES DE CONTRÔLE (K9, cahier §6.2) — de quoi prouver, sur
 * l'iPhone, que Hermes compose et tamponne comme `node` : l'empreinte FNV-1a
 * (huit caractères) de la page HTML des trois exemples composés à un instant
 * FIXÉ, et celle du tampon posé sur le PDF témoin
 * (`scripts/donnees/apercu-chromium-1.pdf`, recopié dans `pdf-temoin.js`)
 * avec les marques d'essai. `verifier-apercu` (H.4) imprime les valeurs
 * attendues ; les Détails de la fabrication (`__DEV__`) montrent celles du
 * téléphone. Rien d'un vrai devis n'y entre (C-M13).
 *
 * `exemples` : le module `apercu-exemples.js` ; `temoin` : le PDF témoin
 * (base64 ou octets : `pdf-lib` lit les deux) ; `pdfLib`, `polices` : les
 * modules chargés par l'enveloppe.
 */
export const MAINTENANT_DES_EMPREINTES = Date.UTC(2026, 10, 26, 9, 30);
export const MARQUES_DU_TEMOIN = Object.freeze({ apercu: MARQUES.apercu, essai: MARQUES.essai, exemple: null });

export async function empreintesDeControle({ exemples, temoin, pdfLib, polices }) {
  const e = {};
  const LISTE = [['E1', 'exempleUneLigne'], ['E5', 'exempleCinqPostes'], ['E60', 'exempleSoixanteLignes']];
  for (const [nom, fonction] of LISTE) {
    const lu = await exemples[fonction](MAINTENANT_DES_EMPREINTES);
    const c = lu && lu.ok ? composerLApercu(lu.donnees, MAINTENANT_DES_EMPREINTES, polices) : null;
    e[nom] = c && c.ok ? empreinteFnv1a(c.html) : 'refus';
  }
  if (!pdfLib || pdfLib.absent || !temoin) e.tampon = 'pdf-lib absent';
  else {
    const t = await tamponner(pdfLib, temoin, { textes: MARQUES_DU_TEMOIN, numeroAffiche: `DEV-2026-${RANG_EN_ATTENTE}`, a4: A4 });
    e.tampon = empreinteFnv1a(t.octets);
  }
  return e;
}
