/**
 * LE GABARIT DE L'APERÇU — le document composé devenu une page HTML A4
 * (étape 2c-1, cahier §4.1, §4.3, §4.4, §4.6).
 *
 * CE QUE CE FICHIER FAIT, ET RIEN D'AUTRE
 * ---------------------------------------
 * Il reçoit le document de `document-devis.js` (des CHAÎNES, déjà
 * composées) et les polices, et il rend une page HTML complète. Il ne
 * calcule rien, il n'écrit aucune phrase : il ÉCHAPPE chaque chaîne (`&`,
 * `<`, `>`, `"`, `'`) et range les blocs dans l'ordre du §4.3. Les seuls
 * textes qu'il pose lui-même sont le titre de la fenêtre (« Aperçu du
 * devis ») et les quatre chiffres invisibles qui tiennent la place du rang
 * du numéro (§4.6). `verifier-apercu` (C) le vérifie dans les deux sens :
 * chaque chaîne de la page du document se retrouve dans le HTML, et le HTML
 * n'a aucun autre texte.
 *
 * DEUX LISTES POSITIVES (K14). La page n'emploie que des éléments, des
 * attributs et des propriétés CSS d'une liste fermée, que le contrôle tient
 * (il lit le CSS par jetons). Ce qui est écarté, et pourquoi : `position:
 * fixed` (WebKit ne l'imprime qu'une fois), tout fond (WebKit ne les imprime
 * pas par défaut : les filets font le travail), les arrondis, les ombres,
 * `flex` et `grid` (leur découpage en pages est le moins sûr), les unités
 * d'écran (`px`, `vh`, `vw`). Aucun script, aucun lien, aucune image : une
 * page qui ne peut rien charger ni rien exécuter.
 *
 * LE PAPIER, PAS L'ÉCRAN. Les tailles sont écrites en points du papier ; iOS
 * imprime 1 px CSS à 0,8 pt (D30), un 9 pt du CSS sort donc en 9,6 pt. Les
 * marges ne sont pas ici : c'est l'option `margins` d'`expo-print` qui les
 * pose (`format-a4.js`, D6).
 *
 * LES POLICES (§4.9) : Inter 400 et 700, Oswald 600, en WOFF2 dans une adresse
 * `data:` — la PREMIÈRE et SEULE source de chaque `@font-face`. Oswald ne
 * reçoit QUE des libellés fixes (« DEVIS », les titres de section) : un nom
 * tapé (une zone, une pièce) est en Inter gras, qui a le latin étendu.
 *
 * LE NUMÉRO EN ATTENTE (§4.6) : « N° DEV-2026-···· », les quatre points à la
 * largeur de quatre chiffres tabulaires — le rang 2c-3 tiendra la même place.
 *
 * CE FICHIER N'IMPORTE RIEN, et `node` le fait tourner.
 */

/** Le numéro du gabarit : `verifier-apercu` fige l'empreinte de chaque page
 *  SOUS ce numéro (§4.1). Une page qui change sans lui est refusée. */
export const VERSION_GABARIT = 1;

/** Les couleurs du papier, celles de l'application (`theme.js`, comparées
 *  par le contrôle) : l'encre, le gris du texte secondaire, le filet,
 *  l'orange à LIRE (les crochets), l'orange de la bande (le dessin
 *  seulement). Une couleur ne porte jamais seule une information. */
export const PALETTE_PAPIER = Object.freeze({
  encre: '#1A1B19',
  gris: '#6A665C',
  filet: '#CFC9BB',
  orangeLire: '#B14212',
  orangeBande: '#E85C1F',
});

/** Les quatre chiffres invisibles du rang en attente : la largeur que le
 *  rang tiendra, jamais peinte (`visibility: hidden`). */
export const RANG_GABARIT = '0000';

/** Le titre de la fenêtre (et des métadonnées du PDF de WebKit). */
export const TITRE_DE_LA_FENETRE = 'Aperçu du devis';

/** Une police embarquée ne dépasse pas ce nombre de caractères de base64 :
 *  WebKit lance tôt le chargement d'une police `data:` de moins de 1 Mo
 *  (§4.9). */
export const LIMITE_POLICE = 1000000;

/** Les classes posées en Oswald : des libellés FIXES seulement (T16). */
export const CLASSES_EN_OSWALD = Object.freeze(['titre-devis', 'titre-section']);

/** Échapper un texte pour le HTML : tout ce qui pourrait ouvrir une balise,
 *  un attribut ou une entité. */
export function echapper(texte) {
  return String(texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* LA BANDE DE CHANTIER (§4.3, bloc 1) : la signature d'Opus, en dessin —
   des parallélogrammes orange sur un fond d'encre. Un SVG et pas un fond CSS
   (que WebKit n'imprime pas). Sa géométrie est fixe. */
const BANDE = (() => {
  const largeur = 1125;
  const hauteur = 10;
  const motifs = [];
  for (let x = -10; x < largeur; x += 20) {
    motifs.push(`<polygon points="${x},${hauteur} ${x + 10},0 ${x + 20},0 ${x + 10},${hauteur}" fill="${PALETTE_PAPIER.orangeBande}"></polygon>`);
  }
  return `<svg class="bande" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" width="100%" height="1.6mm" `
    + `preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="${largeur}" height="${hauteur}" `
    + `fill="${PALETTE_PAPIER.encre}"></rect>${motifs.join('')}</svg>`;
})();

/* LA FEUILLE DE STYLE — une seule, et aucun attribut `style=`. Les unités du
   papier (pt, mm, em, %) ; chaque `break-*` avec son jumeau `page-break-*`
   (WebKit lit encore les seconds). Les chiffres TABULAIRES (de même largeur,
   pour que les montants s'alignent) seulement dans les colonnes de montants
   et le rang du numéro : chez Inter, ce réglage élargit aussi le trait
   d'union, et « Rez-de-chaussée » s'écrivait « Rez - de - chaussée » (vu sur
   un PDF de Chromium, le 27/11). */
const P = PALETTE_PAPIER;
const STYLE = [
  '@page { size: 210mm 297mm; }',
  'html, body { margin: 0; padding: 0; }',
  `body { font-family: Inter, sans-serif; font-size: 9pt; line-height: 1.35; color: ${P.encre}; `
    + '-webkit-text-size-adjust: 100%; }',
  'p { margin: 0; orphans: 2; widows: 2; }',
  '.bande { display: block; width: 100%; margin: 0 0 4mm 0; }',
  '.entete { display: table; width: 100%; table-layout: fixed; }',
  '.emetteur { display: table-cell; vertical-align: top; padding: 0 6mm 0 0; overflow-wrap: anywhere; }',
  '.devis { display: table-cell; vertical-align: top; width: 74mm; text-align: right; }',
  '.nom { font-weight: 700; }',
  '.mention { font-size: 8.5pt; }',
  '.titre-devis { font-family: Oswald, sans-serif; font-weight: 600; font-size: 22pt; line-height: 1.1; letter-spacing: 0.02em; }',
  '.numero { font-weight: 700; white-space: nowrap; }',
  '.rang { position: relative; display: inline-block; font-variant-numeric: tabular-nums; }',
  '.gabarit { visibility: hidden; }',
  '.points { position: absolute; left: 0; right: 0; top: 0; text-align: center; }',
  `.marques { margin: 4mm 0 0 0; padding: 2pt 5pt; border: 0.75pt solid ${P.encre}; font-weight: 700; `
    + 'break-inside: avoid; page-break-inside: avoid; }',
  '.titre-section { font-family: Oswald, sans-serif; font-weight: 600; font-size: 11pt; margin: 5mm 0 1.5mm 0; '
    + 'break-after: avoid; page-break-after: avoid; }',
  '.chantier { margin: 3mm 0 0 0; overflow-wrap: anywhere; }',
  '.client { overflow-wrap: anywhere; }',
  `.titre-zone { display: table; width: 100%; table-layout: fixed; margin: 3mm 0 0 0; border-bottom: 0.75pt solid ${P.encre}; `
    + 'font-weight: 700; font-size: 10pt; break-after: avoid; page-break-after: avoid; }',
  `.titre-piece { display: table; width: 100%; table-layout: fixed; margin: 2mm 0 0 0; border-bottom: 0.5pt solid ${P.filet}; `
    + 'font-weight: 700; font-size: 10pt; break-after: avoid; page-break-after: avoid; }',
  '.titre-nom { display: table-cell; vertical-align: bottom; overflow-wrap: anywhere; padding: 1.5pt 0; }',
  '.titre-somme { display: table-cell; vertical-align: bottom; width: 46mm; text-align: right; font-weight: 400; '
    + 'font-size: 8.5pt; padding: 1.5pt 0 1.5pt 3mm; }',
  `.ligne { display: table; width: 100%; table-layout: fixed; border-bottom: 0.5pt solid ${P.filet}; `
    + 'break-inside: avoid; page-break-inside: avoid; }',
  '.ligne-texte { display: table-cell; vertical-align: top; overflow-wrap: anywhere; word-break: normal; hyphens: manual; '
    + 'padding: 2.5pt 0; }',
  '.ligne-montant { display: table-cell; vertical-align: top; width: 40mm; text-align: right; padding: 2.5pt 0 2.5pt 3mm; '
    + 'font-variant-numeric: tabular-nums; }',
  `.detail { font-size: 8.5pt; color: ${P.gris}; }`,
  `.marqueur { font-size: 8.5pt; color: ${P.orangeLire}; }`,
  `.reserve { padding: 2.5pt 0; border-bottom: 0.5pt solid ${P.filet}; overflow-wrap: anywhere; `
    + 'break-inside: avoid; page-break-inside: avoid; }',
  `.a-venir-decompte { margin: 2mm 0 0 0; font-size: 8.5pt; color: ${P.orangeLire}; }`,
  '.garde-ensemble { break-inside: avoid; page-break-inside: avoid; }',
  '.totaux { width: 100mm; margin: 4mm 0 0 auto; border-collapse: collapse; }',
  '.tva { width: 100mm; margin: 1.5mm 0 1.5mm auto; border-collapse: collapse; font-size: 8.5pt; }',
  `.tva th { font-weight: 400; color: ${P.gris}; text-align: right; padding: 1pt 0 1pt 3mm; }`,
  '.tva td { text-align: right; padding: 1pt 0 1pt 3mm; font-variant-numeric: tabular-nums; }',
  '.rangee-libelle { text-align: left; padding: 1.5pt 0; }',
  '.rangee-montant { text-align: right; white-space: nowrap; padding: 1.5pt 0 1.5pt 3mm; font-variant-numeric: tabular-nums; }',
  `.fort td { font-weight: 700; font-size: 11pt; border-top: 0.75pt solid ${P.encre}; padding: 2.5pt 0 2.5pt 0; }`,
  '.note { font-size: 8.5pt; text-align: right; margin: 1.5mm 0 0 0; }',
  `.bloc { margin: 5mm 0 0 0; padding: 2mm 0 0 0; border-top: 0.5pt solid ${P.filet}; font-size: 8.5pt; overflow-wrap: anywhere; }`,
  '.bloc p { margin: 0 0 1.5pt 0; }',
  `.source { margin: 4mm 0 0 0; font-size: 7pt; color: ${P.gris}; }`,
  `.a-venir { margin: 5mm 0 0 0; font-size: 8.5pt; color: ${P.orangeLire}; }`,
].join('\n');

/* Une police : une chaîne base64, rien d'autre (aucun guillemet, aucune
   parenthèse ne peut fermer l'adresse), sous la limite. */
function police(polices, cle) {
  const b = polices && polices[cle];
  if (typeof b !== 'string' || b.length === 0 || b.length > LIMITE_POLICE || !/^[A-Za-z0-9+/]+={0,2}$/.test(b)) {
    throw new Error(`devisHtml : la police « ${cle} » manque ou n’est pas une chaîne base64 sous ${LIMITE_POLICE} caractères`);
  }
  return b;
}
function policesEnCss(polices) {
  const face = (famille, graisse, cle) => `@font-face { font-family: ${famille}; font-weight: ${graisse}; font-style: normal; `
    + `font-display: swap; src: url(data:font/woff2;base64,${police(polices, cle)}); }`;
  return [face('Inter', 400, 'inter400'), face('Inter', 700, 'inter700'), face('Oswald', 600, 'oswald600')].join('\n');
}

/* Un paragraphe, une division : la classe est une constante de ce fichier,
   le texte est TOUJOURS échappé. Un texte entre crochets (« [à compléter :
   …] », « [pour un particulier : …] », « [prochaine version d’Opus : …] »)
   se lit en orange — les MOTS disent déjà ce qu'il est. */
const chaine = (v, quoi) => {
  if (typeof v !== 'string') throw new Error(`devisHtml : ${quoi} n’est pas une chaîne`);
  return v;
};
const crochet = (t) => t.startsWith('[');
const p = (classe, texte) => {
  const t = chaine(texte, 'un texte');
  const c = [classe, crochet(t) ? 'marqueur' : null].filter(Boolean).join(' ');
  return `<p${c ? ` class="${c}"` : ''}>${echapper(t)}</p>`;
};
const div = (classe, contenu) => `<div class="${classe}">${contenu}</div>`;

/* UNE LIGNE CHIFFRÉE (D4) : la désignation, son détail, ses marqueurs, et
   son total à droite — un bloc qui se lit seul, et ne se coupe pas. */
function ligne(l) {
  const texte = [
    `<div class="designation">${echapper(chaine(l.designation, 'une désignation'))}</div>`,
    l.detail ? `<div class="detail">${echapper(l.detail)}</div>` : '',
    ...(l.marqueurs || []).map((m) => `<div class="marqueur">${echapper(chaine(m, 'un marqueur'))}</div>`),
  ].join('');
  return div('ligne', `${div('ligne-texte', texte)}${div('ligne-montant', echapper(chaine(l.total, 'un total')))}`);
}

/* UN TITRE DE ZONE OU DE PIÈCE, et son sous-total. */
function titre(b) {
  const somme = b.sousTotal ? div('titre-somme', echapper(b.sousTotal)) : div('titre-somme', '');
  return div(b.genre === 'zone' ? 'titre-zone' : 'titre-piece', `${div('titre-nom', echapper(chaine(b.titre, 'un titre')))}${somme}`);
}

/* LES RANGÉES DES TOTAUX : une table, une rangée par montant. */
const rangees = (liste) => (liste.length
  ? `<table class="totaux"><tbody>${liste.map((r) => `<tr${r.ton === 'fort' ? ' class="fort"' : ''}>`
    + `<td class="rangee-libelle">${echapper(chaine(r.libelle, 'un libellé'))}</td>`
    + `<td class="rangee-montant">${echapper(chaine(r.montant, 'un montant'))}</td></tr>`).join('')}</tbody></table>`
  : '');

/* LE TABLEAU DE TVA (D12) : une seule présentation des taux. */
function tableauDeTva(t) {
  if (!t) return '';
  const tete = `<thead><tr>${t.colonnes.map((c) => `<th>${echapper(chaine(c, 'une colonne'))}</th>`).join('')}</tr></thead>`;
  const corps = `<tbody>${t.lignes.map((r) => `<tr>${r.map((c) => `<td>${echapper(chaine(c, 'une case'))}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;
  return `<table class="tva">${tete}${corps}</table>`;
}

/* LES TOTAUX (§4.3, bloc 8) : les rangées jusqu'au « Total HT », le tableau
   de TVA, puis la TVA, le total et ce qui suit ; les notes. */
function totaux(t) {
  const liste = t.rangees || [];
  let coupe = liste.findIndex((r) => r.cle === 'tva');
  if (coupe < 0 && t.tableau) coupe = liste.findIndex((r) => r.cle === 'total');
  if (coupe < 0) coupe = liste.length;
  return `${rangees(liste.slice(0, coupe))}${tableauDeTva(t.tableau)}${rangees(liste.slice(coupe))}`
    + `${(t.notes || []).map((n) => p('note', n)).join('')}`;
}

/**
 * LES MORCEAUX DU DÉTAIL, ET CE QUI NE DOIT PAS SE SÉPARER (D5). Un titre
 * reste avec la première ligne qui le suit (une zone, sa pièce et sa
 * première ligne ensemble) ; les totaux restent avec la dernière ligne (ou
 * option) qui les précède — d'où `garde-ensemble`, que le découpage en pages
 * ne coupe pas.
 */
function grouper(morceaux) {
  const sortie = [];
  let attente = [];
  const vider = () => {
    if (!attente.length) return;
    sortie.push({ html: div('garde-ensemble', attente.map((m) => m.html).join('')), ligne: attente.some((m) => m.ligne) });
    attente = [];
  };
  for (const m of morceaux) {
    if (m.titre) attente.push(m);
    else if (attente.length) {
      attente.push(m);
      if (m.ligne) vider();
    } else sortie.push(m);
  }
  vider();
  return sortie;
}

/**
 * LA PAGE — `document` : la sortie de `documentDuDevis` ; `polices` :
 * `{ inter400, inter700, oswald600 }`, trois chaînes base64 de WOFF2. Une
 * chaîne HTML complète. Il LÈVE sur un document qui ne vient pas de la
 * composition (un champ qui n'est pas une chaîne, un numéro qui ne serait
 * plus en attente) et sur une police absente : mieux vaut pas d'aperçu
 * qu'un aperçu faux.
 */
export function devisHtml(document, polices) {
  const d = document;
  if (!d || typeof d !== 'object' || !d.numero || !d.marques || !d.totaux) throw new Error('devisHtml : document absent');
  /* En 2c-1, aucun numéro n'est remis : la page ne sait écrire QUE la place
     du rang (2c-3 lui apprendra le rang). */
  if (d.numero.enAttente !== true || 'rang' in d.numero) throw new Error('devisHtml : un numéro remis ne passe pas par l’aperçu');
  const prefixe = chaine(d.numero.prefixe, 'le préfixe du numéro');
  const affiche = chaine(d.numeroAffiche, 'le numéro affiché');
  if (!affiche.startsWith(prefixe)) throw new Error('devisHtml : le numéro affiché ne suit pas son préfixe');
  const points = affiche.slice(prefixe.length);
  const css = `${policesEnCss(polices)}\n${STYLE}`;

  /* L'EN-TÊTE (bloc 2) : l'émetteur à gauche, le devis à droite. */
  const identite = d.emetteur.identite.map((t, k) => p(k === 0 ? 'nom' : 'mention', chaine(t, 'une ligne d’identité'))).join('');
  const numero = `<p class="numero">${echapper(`${chaine(d.numero.libelle, 'le libellé du numéro')} ${prefixe}`)}`
    + `<span class="rang"><span class="gabarit">${RANG_GABARIT}</span><span class="points">${echapper(points)}</span></span></p>`;
  const droite = [
    `<p class="titre-devis">${echapper(chaine(d.titre, 'le titre'))}</p>`,
    numero,
    p('', d.enTete.date),
    p('', d.enTete.validite),
    p('', d.enTete.cout),
  ].join('');
  const entete = div('entete', `${div('emetteur', identite)}${div('devis', droite)}`);

  /* LES MARQUES DANS LE FLUX (bloc 3) : en page 1, encadrées. */
  const marques = div('marques', ['apercu', 'essai', 'exemple'].filter((k) => d.marques[k] != null)
    .map((k) => p('marque', chaine(d.marques[k], 'une marque'))).join(''));

  /* LE CLIENT (bloc 4) et LE CHANTIER (bloc 5). */
  const client = div('garde-ensemble', `<p class="titre-section">${echapper(chaine(d.titres.client, 'un titre'))}</p>`
    + div('client', d.client.map((t, k) => p(k === 0 ? 'nom' : '', t)).join('')));
  const chantier = div('chantier', d.chantier.map((t) => p('', t)).join(''));

  /* LE DÉTAIL DES TRAVAUX (bloc 6) et LES OPTIONS (bloc 7). */
  const morceaux = [{ titre: true, html: `<p class="titre-section">${echapper(chaine(d.titres.decompte, 'un titre'))}</p>` }];
  for (const b of d.decompte) {
    if (b.genre === 'zone' || b.genre === 'piece') morceaux.push({ titre: true, html: titre(b) });
    else if (b.genre === 'ligne') morceaux.push({ ligne: true, html: ligne(b) });
    else if (b.genre === 'reserve') morceaux.push({ html: div('reserve', echapper(chaine(b.texte, 'une réserve'))) });
    else throw new Error(`devisHtml : un bloc inconnu (${String(b.genre)})`);
  }
  if (d.decompteVide) morceaux.push({ html: p('a-venir-decompte', d.decompteVide) });
  for (const t of d.decompteAVenir || []) morceaux.push({ html: p('a-venir-decompte', t) });
  if (d.options) {
    morceaux.push({ titre: true, html: `<p class="titre-section">${echapper(chaine(d.options.titre, 'un titre'))}</p>` });
    for (const o of d.options.lignes) morceaux.push({ ligne: true, html: ligne(o) });
  }
  const groupes = grouper(morceaux);
  /* Les totaux, avec la dernière ligne qui les précède. */
  let derniere = -1;
  groupes.forEach((g, k) => { if (g.ligne) derniere = k; });
  const avant = derniere < 0 ? groupes : groupes.slice(0, derniere);
  const avecLesTotaux = derniere < 0 ? [] : groupes.slice(derniere);
  const blocTotaux = div('garde-ensemble', `${avecLesTotaux.map((g) => g.html).join('')}${totaux(d.totaux)}`);

  /* LES CONDITIONS (bloc 9), LES INFORMATIONS (bloc 10), LA SOURCE (bloc 11),
     LA PLACE DE 2c-2 (bloc 12). */
  const bloc = (liste) => (liste && liste.length ? div('bloc', liste.map((t) => p('', t)).join('')) : '');
  const corps = [
    BANDE,
    entete,
    marques,
    client,
    chantier,
    ...avant.map((g) => g.html),
    blocTotaux,
    bloc(d.conditions),
    bloc(d.informations),
    d.emetteur.source ? p('source', d.emetteur.source) : '',
    p('a-venir', chaine(d.aVenir, 'la place de la prochaine version')),
  ].join('');

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${echapper(TITRE_DE_LA_FENETRE)}</title>`
    + `<style>${css}</style></head><body>${corps}</body></html>`;
}
