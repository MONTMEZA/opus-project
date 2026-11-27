/**
 * LE FORMAT A4 DE L'APERÇU — écrit UNE fois (étape 2c-1, cahier §5.1).
 *
 * Trois lecteurs, une seule écriture : l'enveloppe d'`expo-print`
 * (`devis-pdf.js`, la taille de la page et ses marges), le tampon
 * (`tampon-apercu.js`, où poser la marque de chaque page), et la mesure au
 * navigateur (`mesure-apercu`, qui fait imprimer Chromium aux mêmes marges).
 * Écrites deux fois, ces valeurs finiraient par différer — et le tampon
 * tomberait alors sur le texte au lieu de la marge, sans aucune erreur.
 *
 * LES MARGES NE VIVENT QU'ICI (D6) : la page HTML n'en pose aucune dans
 * `@page` (WebKit ne les lit que derrière un réglage) ; c'est l'option
 * `margins` d'`expo-print` qui les donne.
 *
 * LE TAMPON ÉCRIT DANS LA MARGE, JAMAIS SUR LE CONTENU : sa tête est à 7 mm
 * du haut, son pied à 8 mm du bas, et les marges du contenu font 20 mm en
 * haut et en bas. `verifier-apercu` (E.3) refait le calcul avec les vraies
 * mesures des polices de `pdf-lib`.
 *
 * Les points sont ceux du PDF (1 pt = 1/72 de pouce, 1 mm = 72/25,4 pt).
 *
 * CE FICHIER N'IMPORTE RIEN : `node` le fait tourner, et le tampon le reçoit
 * en paramètre.
 */

/** Un millimètre, en points du PDF. */
export const MM = 72 / 25.4;

/** La page A4, en points (210 × 297 mm). */
export const A4_PT = Object.freeze({ largeur: 595.28, hauteur: 841.89 });

/** La même page, pour une feuille de style ou `page.pdf` de Chromium. */
export const A4_MM = Object.freeze({ largeur: '210mm', hauteur: '297mm' });

/** Les marges du contenu, en points, dans la forme qu'`expo-print` attend
 *  (`margins: { left, top, right, bottom }`) : 20 mm en haut et en bas,
 *  15 mm à gauche et à droite. */
export const MARGES_PT = Object.freeze({ top: 56.69, right: 42.52, bottom: 56.69, left: 42.52 });

/** Les mêmes marges, en millimètres, pour Chromium (`page.pdf({ margin })`). */
export const MARGES_MM = Object.freeze({ top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' });

/**
 * LE TAMPON DE CHAQUE PAGE (D14), en VRAIS points du PDF — `pdf-lib` les
 * pose après la mise en page, ils ne passent pas par l'échelle d'iOS :
 *   - la TÊTE : Helvetica gras 9,5 pt, dans un filet de 0,75 pt, le haut du
 *     filet à 7 mm du haut de la page, 3 pt d'air au-dessus et au-dessous du
 *     texte, 5 pt à gauche et à droite, une ligne tous les 1,25 × 9,5 pt ;
 *   - la DIAGONALE : « APERÇU », Helvetica gras 72 pt, gris, opacité 0,30,
 *     35°, au centre de la page ;
 *   - le PIED : Helvetica 8,5 pt, gris, sa ligne de base à 8 mm du bas.
 * L'encre et le gris sont ceux de l'application (`theme.js`) : le contrôle
 * compare.
 */
export const TAMPON = Object.freeze({
  teteDepuisLeHautMm: 7,
  piedDepuisLeBasMm: 8,
  tailleTete: 9.5,
  taillePied: 8.5,
  tailleDiagonale: 72,
  angleDiagonale: 35,
  opaciteDiagonale: 0.3,
  gris: '#6A665C',
  encre: '#1A1B19',
  filet: 0.75,
  interligneTete: 1.25,
  airVertical: 3,
  airHorizontal: 5,
});

/** La largeur du contenu : ce que la tête du tampon ne doit jamais
 *  dépasser (510,24 pt). */
export const LARGEUR_CONTENU_PT = A4_PT.largeur - MARGES_PT.left - MARGES_PT.right;
