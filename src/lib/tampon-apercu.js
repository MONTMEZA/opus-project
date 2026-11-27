/**
 * LE TAMPON DE L'APERÇU — la marque sur CHAQUE page, posée après la mise en
 * page (étape 2c-1, cahier §4.7).
 *
 * POURQUOI APRÈS COUP. WebKit n'imprime `position: fixed` qu'une seule fois,
 * n'a pas de boîtes de marge (« Page 2 sur 4 » ne s'écrit pas en CSS), et
 * `expo-print` ne pose ni en-tête ni pied. On relit donc le PDF que le
 * téléphone a fabriqué, et `@cantoo/pdf-lib` y écrit, page par page :
 *   - en TÊTE, dans un filet : « APERÇU — ce document n’est pas remis ·
 *     Document d’essai — sans valeur » (et, pour un exemple, « Exemple —
 *     données inventées », sur une seconde ligne si la largeur le demande) ;
 *   - en DIAGONALE : « APERÇU » ;
 *   - en PIED : « Devis DEV-2026-···· — Page 2 sur 4 ».
 *
 * IL NE TOUCHE QU'UNE LISTE FERMÉE DE TEXTES (`TEXTES_DU_TAMPON`) : les trois
 * marques, « APERÇU », « Devis », le numéro en attente, « Page », « sur », des
 * chiffres. Jamais une donnée : un nom, une adresse, une désignation ne
 * passent jamais par ici — ils sont dans la page, avec les polices d'Opus. Un
 * texte hors de la liste LÈVE. Et la police du tampon (Helvetica, l'une des
 * quatorze polices « standard » du PDF) n'écrit que l'alphabet WinAnsi : un
 * caractère hors de cet alphabet y devient « ? » SANS ERREUR (mesuré :
 * l'espace fine insécable, la flèche). Le tampon REFUSE donc un texte qu'il
 * ne saurait pas écrire tel quel, au lieu d'imprimer « ? ».
 *
 * IL NE FABRIQUE JAMAIS DE PAGE (T5) : un PDF de zéro page est refusé, et
 * l'enregistrement se fait TOUJOURS avec `addDefaultPage: false` — sans quoi
 * `pdf-lib` ajouterait une page blanche, que la boucle du tampon n'aurait pas
 * marquée : un « aperçu » sans « APERÇU ».
 *
 * IL LIT LES POLICES DE TOUT LE DOCUMENT, AVANT DE TAMPONNER (T2) : sous iOS,
 * chaque page du PDF d'`expo-print` est le PDF de WebKit redessiné ; ses
 * polices vivent alors dans un « XObject de forme » que les ressources de la
 * page ne nomment pas. On parcourt donc tous les objets du document. Les
 * quatorze polices standard ne comptent pas (le tampon en ajoute deux).
 *
 * CE FICHIER N'IMPORTE RIEN : le module `pdf-lib` et les positions du format
 * A4 (`format-a4.js`) lui sont PASSÉS. `node` le fait tourner avec le vrai
 * `pdf-lib` (`verifier-apercu`, section E) ; l'enveloppe du téléphone
 * (`devis-pdf.js`) lui passe le même module, chargé au geste.
 */

/**
 * LES SEULS TEXTES QUE LE TAMPON ÉCRIT (avec le numéro en attente et des
 * chiffres). Les trois marques sont celles de la composition
 * (`MARQUES`, `document-devis.js`), écrites ici une seconde fois : ce fichier
 * n'importe rien, et `verifier-apercu` compare les deux, et les deux à ses
 * propres textes écrits en toutes lettres.
 */
export const TEXTES_DU_TAMPON = Object.freeze({
  apercu: 'APERÇU — ce document n’est pas remis',
  essai: 'Document d’essai — sans valeur',
  exemple: 'Exemple — données inventées',
  diagonale: 'APERÇU',
  devis: 'Devis',
  page: 'Page',
  sur: 'sur',
});

/** Entre deux marques de la tête. */
export const SEPARATEUR_TETE = ' · ';

/** Le numéro en attente, et lui seul : « DEV-2026-···· » (quatre U+00B7).
 *  Un numéro remis (2c-3) ne passera pas par l'aperçu. */
export const FORME_DU_NUMERO = /^DEV-[0-9]{4}-····$/;

/** Les quatorze polices « standard » du PDF : elles ne disent rien de la mise
 *  en page d'Opus (le tampon lui-même en ajoute deux). */
export const POLICES_STANDARD = Object.freeze([
  'Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique',
  'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique',
  'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic',
  'Symbol', 'ZapfDingbats',
]);

/* Une erreur du tampon, avec sa cause : `vide` (zéro page), `hors_liste` (un
   texte qui n'est pas dans la liste fermée), `encodage` (un caractère que
   Helvetica écrirait « ? »), `largeur` (une marque plus large que le
   contenu), `parametres`. */
function erreur(code, message) {
  const e = new Error(`tampon : ${message}`);
  e.code = code;
  return e;
}

/** Le pied d'une page : « Devis DEV-2026-···· — Page 2 sur 4 ». */
export function piedDeLaPage(numeroAffiche, rang, total) {
  const T = TEXTES_DU_TAMPON;
  return `${T.devis} ${numeroAffiche} — ${T.page} ${rang} ${T.sur} ${total}`;
}

/**
 * LES MARQUES DE LA TÊTE, ET LEURS LIGNES. `textes` : les marques du document
 * (`{ apercu, essai, exemple }`, une marque absente vaut `null`). La marque
 * de l'aperçu est OBLIGATOIRE — aucun mode ne la retire en 2c-1. Chaque
 * marque présente doit être EXACTEMENT celle de la liste ; sinon, on lève.
 */
export function marquesDeLaTete(textes) {
  const T = TEXTES_DU_TAMPON;
  if (!textes || typeof textes !== 'object') throw erreur('parametres', 'les marques manquent');
  if (textes.apercu !== T.apercu) throw erreur('hors_liste', 'la marque « APERÇU » manque ou a changé');
  const marques = [T.apercu];
  for (const cle of ['essai', 'exemple']) {
    const v = textes[cle];
    if (v == null) continue;
    if (v !== T[cle]) throw erreur('hors_liste', `la marque « ${cle} » n’est pas celle de la liste`);
    marques.push(v);
  }
  const inconnues = Object.keys(textes).filter((k) => !['apercu', 'essai', 'exemple'].includes(k));
  if (inconnues.length) throw erreur('hors_liste', `des textes hors de la liste : ${inconnues.join(', ')}`);
  return marques;
}

/**
 * LES LIGNES DE LA TÊTE : les marques rangées dans l'ordre, séparées par
 * « · », une nouvelle ligne quand la suivante ne tient plus dans la largeur.
 * `largeurDe(texte)` mesure un texte à la taille de la tête. Une seule marque
 * plus large que le contenu LÈVE : elle déborderait de la page.
 */
export function lignesDeLaTete(marques, largeurDe, largeurMax) {
  const lignes = [];
  for (const m of marques) {
    if (largeurDe(m) > largeurMax) throw erreur('largeur', `« ${m} » est plus large que la page`);
    const derniere = lignes.length ? lignes[lignes.length - 1] : null;
    const ensemble = derniere == null ? null : `${derniere}${SEPARATEUR_TETE}${m}`;
    if (ensemble != null && largeurDe(ensemble) <= largeurMax) lignes[lignes.length - 1] = ensemble;
    else lignes.push(m);
  }
  return lignes;
}

/**
 * OÙ TOMBE CHAQUE CHOSE SUR UNE PAGE — un calcul pur, que le tampon suit et
 * que le contrôle refait (E.3). `boite` : la page (`{ x, y, largeur, hauteur
 * }`, sa MediaBox) ; `mesures` : les mesures des polices (`{ largeurTete(t),
 * montantTete, largeurPied(t), largeurDiagonale, montantDiagonale }`) ;
 * `lignes` : les lignes de la tête ; `pied` : le texte du pied ; `a4` : le
 * module `format-a4.js`.
 */
export function geometrieDuTampon({ boite, mesures, lignes, pied, a4 }) {
  const t = a4.TAMPON;
  const mm = a4.MM;
  const haut = boite.y + boite.hauteur - t.teteDepuisLeHautMm * mm;
  const interligne = t.tailleTete * t.interligneTete;
  const largeurs = lignes.map((l) => mesures.largeurTete(l));
  const largeurFilet = Math.max(...largeurs) + 2 * t.airHorizontal;
  const hauteurFilet = 2 * t.airVertical + lignes.length * interligne;
  const filet = {
    x: boite.x + (boite.largeur - largeurFilet) / 2,
    y: haut - hauteurFilet,
    largeur: largeurFilet,
    hauteur: hauteurFilet,
  };
  const lignesPosees = lignes.map((texte, k) => ({
    texte,
    x: boite.x + (boite.largeur - largeurs[k]) / 2,
    y: haut - t.airVertical - mesures.montantTete - k * interligne,
    largeur: largeurs[k],
  }));
  const largeurPied = mesures.largeurPied(pied);
  const piedPose = {
    texte: pied,
    x: boite.x + (boite.largeur - largeurPied) / 2,
    y: boite.y + t.piedDepuisLeBasMm * mm,
    largeur: largeurPied,
  };
  /* La diagonale tourne autour de son point de départ : on la décale pour
     que le MILIEU du mot tombe au milieu de la page. */
  const a = (t.angleDiagonale * Math.PI) / 180;
  const cx = boite.x + boite.largeur / 2;
  const cy = boite.y + boite.hauteur / 2;
  const w = mesures.largeurDiagonale;
  const h = mesures.montantDiagonale;
  const diagonale = {
    texte: TEXTES_DU_TAMPON.diagonale,
    x: cx - (w / 2) * Math.cos(a) + (h / 2) * Math.sin(a),
    y: cy - (w / 2) * Math.sin(a) - (h / 2) * Math.cos(a),
  };
  return { filet, lignes: lignesPosees, pied: piedPose, diagonale };
}

/* « #6A665C » → la couleur de `pdf-lib`. */
function couleur(PDFLib, hex) {
  const n = (k) => parseInt(hex.slice(k, k + 2), 16) / 255;
  return PDFLib.rgb(n(1), n(3), n(5));
}

/* Le texte s'écrit-il TEL QUEL dans cette police ? `encodeText` rend les
   octets WinAnsi ; un caractère inconnu devient « ? » (0x3F) sans erreur. On
   compte donc les « ? » : il en faut exactement autant que le texte en a. */
export function sEcritTelQuel(police, texte) {
  const octets = police.encodeText(texte).asBytes();
  let fabriques = 0;
  for (const o of octets) if (o === 0x3f) fabriques += 1;
  let presents = 0;
  for (const c of texte) if (c === '?') presents += 1;
  return fabriques === presents;
}

/**
 * LES POLICES DU DOCUMENT ENTIER (T2), lues AVANT le tampon : chaque
 * dictionnaire `/Type /Font` de chaque objet — y compris ceux qu'un XObject
 * de forme garde pour lui — et le nombre d'images (`/Subtype /Image`). Une
 * page rendue en IMAGE n'aurait aucune police : c'est ce que dit `aucune`
 * avec `images`.
 *   → { noms, inter, oswald, autres, standard, aucune, images }
 * `noms` : les polices lues hors des quatorze standard, sans leur préfixe de
 * sous-ensemble (« ABCDEF+ »), triées par points de code ; `standard` : les
 * standard lues, pour les Détails seulement — elles ne COMPTENT pas : WebKit
 * embarque toujours ses polices, une standard ne vient que d'un outil comme
 * celui-ci, et `aucune` ne regarde que `noms`.
 */
export function policesDuDocument(PDFLib, doc) {
  const { PDFDict, PDFArray, PDFName, PDFStream, PDFRef } = PDFLib;
  const nomType = PDFName.of('Type');
  const nomFont = PDFName.of('Font');
  const nomSousType = PDFName.of('Subtype');
  const nomImage = PDFName.of('Image');
  const nomBase = PDFName.of('BaseFont');
  const lus = new Set();
  const vus = new Set();
  let images = 0;
  const parcourir = (o) => {
    if (!o || o instanceof PDFRef || vus.has(o)) return;
    vus.add(o);
    const dict = o instanceof PDFDict ? o : (o instanceof PDFStream ? o.dict : null);
    if (dict) {
      if (dict.get(nomType) === nomFont) {
        const b = dict.get(nomBase);
        if (b instanceof PDFName) lus.add(b.decodeText());
      }
      if (o instanceof PDFStream && dict.get(nomSousType) === nomImage) images += 1;
      for (const [, v] of dict.entries()) parcourir(v);
    } else if (o instanceof PDFArray) {
      for (const v of o.asArray()) parcourir(v);
    }
  };
  for (const [, o] of doc.context.enumerateIndirectObjects()) parcourir(o);
  const sansPrefixe = [...lus].map((n) => n.replace(/^[A-Z]{6}\+/, ''));
  const parPoints = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));
  const standard = [...new Set(sansPrefixe.filter((n) => POLICES_STANDARD.includes(n)))].sort(parPoints);
  const noms = [...new Set(sansPrefixe.filter((n) => !POLICES_STANDARD.includes(n)))].sort(parPoints);
  const estInter = (n) => /^Inter(?![A-Za-z])/.test(n);
  const estOswald = (n) => /^Oswald(?![A-Za-z])/.test(n);
  return {
    noms,
    inter: noms.some(estInter),
    oswald: noms.some(estOswald),
    autres: noms.filter((n) => !estInter(n) && !estOswald(n)),
    standard,
    aucune: noms.length === 0,
    images,
  };
}

/**
 * CE QUE L'ÉCRAN DIT DES POLICES LUES (§4.9) : `opus` (Inter et Oswald, rien à
 * dire au-dessus du document) ; `telephone` (d'autres polices ont servi : la
 * phrase `PHRASE_POLICES_DU_TELEPHONE`, `etapes-apercu.js`) ; `aucune` (une
 * page vide, ou des pages en image : rien au-dessus, les Détails le disent).
 */
export function issueDesPolices(polices) {
  if (!polices || polices.aucune) return 'aucune';
  if (polices.inter && polices.oswald) return 'opus';
  return 'telephone';
}

/**
 * TAMPONNER — `PDFLib` : le module `@cantoo/pdf-lib` ; `octets` : le PDF
 * fabriqué par le téléphone ; `textes` : les marques du document ;
 * `numeroAffiche` : « DEV-2026-···· » ; `a4` : le module `format-a4.js`.
 *   → { octets, pages, tailles, polices, metadonnees }
 * Il LÈVE (avec un `code`) sur un texte hors de la liste, un PDF de zéro
 * page, un texte que Helvetica ne sait pas écrire tel quel.
 */
export async function tamponner(PDFLib, octets, { textes, numeroAffiche, a4 } = {}) {
  if (!PDFLib || !PDFLib.PDFDocument) throw erreur('parametres', 'pdf-lib manque');
  if (!a4 || !a4.TAMPON || !(a4.LARGEUR_CONTENU_PT > 0)) throw erreur('parametres', 'le format A4 manque');
  const marques = marquesDeLaTete(textes);
  if (typeof numeroAffiche !== 'string' || !FORME_DU_NUMERO.test(numeroAffiche)) {
    throw erreur('hors_liste', 'le numéro n’est pas un numéro en attente');
  }
  const doc = await PDFLib.PDFDocument.load(octets, { updateMetadata: false });
  const total = doc.getPageCount();
  if (total === 0) throw erreur('vide', 'le document n’a aucune page');

  const polices = policesDuDocument(PDFLib, doc);
  const metadonnees = {
    createur: doc.getCreator() ?? null,
    producteur: doc.getProducer() ?? null,
    titre: doc.getTitle() ?? null,
  };

  const t = a4.TAMPON;
  const gras = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const normal = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const largeurTete = (s) => gras.widthOfTextAtSize(s, t.tailleTete);
  const lignes = lignesDeLaTete(marques, largeurTete, a4.LARGEUR_CONTENU_PT);
  const mesures = {
    largeurTete,
    montantTete: gras.heightAtSize(t.tailleTete, { descender: false }),
    largeurPied: (s) => normal.widthOfTextAtSize(s, t.taillePied),
    largeurDiagonale: gras.widthOfTextAtSize(TEXTES_DU_TAMPON.diagonale, t.tailleDiagonale),
    montantDiagonale: gras.heightAtSize(t.tailleDiagonale, { descender: false }),
  };
  /* Chaque texte, avant d'en écrire un seul : tel quel, ou rien. */
  const aEcrire = [
    ...lignes.map((s) => [gras, s]),
    [gras, TEXTES_DU_TAMPON.diagonale],
    [normal, piedDeLaPage(numeroAffiche, total, total)],
  ];
  for (const [police, s] of aEcrire) {
    if (!sEcritTelQuel(police, s)) throw erreur('encodage', `« ${s} » ne s’écrit pas tel quel dans la police du tampon`);
  }

  const encre = couleur(PDFLib, t.encre);
  const gris = couleur(PDFLib, t.gris);
  const tailles = [];
  doc.getPages().forEach((page, k) => {
    const b = page.getMediaBox();
    tailles.push({ largeur: b.width, hauteur: b.height });
    const pied = piedDeLaPage(numeroAffiche, k + 1, total);
    const g = geometrieDuTampon({ boite: { x: b.x, y: b.y, largeur: b.width, hauteur: b.height }, mesures, lignes, pied, a4 });
    page.drawRectangle({
      x: g.filet.x, y: g.filet.y, width: g.filet.largeur, height: g.filet.hauteur, borderWidth: t.filet, borderColor: encre,
    });
    g.lignes.forEach((l) => page.drawText(l.texte, { x: l.x, y: l.y, size: t.tailleTete, font: gras, color: encre }));
    page.drawText(g.diagonale.texte, {
      x: g.diagonale.x, y: g.diagonale.y, size: t.tailleDiagonale, font: gras, color: gris,
      opacity: t.opaciteDiagonale, rotate: PDFLib.degrees(t.angleDiagonale),
    });
    page.drawText(g.pied.texte, { x: g.pied.x, y: g.pied.y, size: t.taillePied, font: normal, color: gris });
  });

  const sortie = await doc.save({ useObjectStreams: true, addDefaultPage: false });
  return { octets: sortie, pages: total, tailles, polices, metadonnees };
}
