/**
 * Une petite carte, sans bibliothèque de cartographie.
 *
 * POURQUOI PAS UNE VRAIE CARTE
 * ----------------------------
 * `react-native-maps` existe, et il fonctionne dans Expo Go. Mais ce qu'on
 * veut montrer ici est volontairement pauvre : **où il travaille, à
 * l'échelle de la commune**, et jusqu'où il se déplace. Pas de navigation,
 * pas de zoom, pas de recherche.
 *
 * Or une carte qu'on peut agrandir finit toujours par montrer la rue — et
 * beaucoup d'artisans déclarent l'adresse de leur MAISON. « Se déplace
 * jusqu'à 30 km » ne dit pas où il habite ; une carte zoomable, si.
 * `ZOOM_MAX` est donc un verrou, pas un réglage.
 *
 * Trois conséquences heureuses : aucune dépendance en plus (donc aucun
 * risque de devoir quitter Expo Go, le seul moyen de test du propriétaire),
 * le même rendu au navigateur et sur le téléphone (donc ça se vérifie
 * ici), et des calculs purs — donc contrôlables par un script.
 *
 * LES TUILES
 * ----------
 * Une carte en ligne est un damier d'images de 256 × 256 px. À un niveau de
 * zoom `z`, le monde entier tient dans 2^z × 2^z tuiles. On calcule quelle
 * tuile tombe au centre, puis on pose les voisines autour.
 *
 * Celles d'ici viennent de la **Géoplateforme de l'IGN** : données
 * publiques, sans clé d'accès, service public français. L'attribution
 * « © IGN » s'affiche sur la carte — c'est la condition d'usage.
 */

/** Une tuile fait 256 px de côté. C'est la convention, partout. */
export const TAILLE_TUILE = 256;

/**
 * Les deux bornes du zoom.
 *
 * `ZOOM_MAX = 12` : une tuile couvre alors environ 7 km à nos latitudes, on
 * voit les villages et les routes, **pas les rues nommées**. C'est le
 * verrou qui protège l'adresse du domicile. Ne pas l'augmenter sans se
 * demander ce qu'on révèle.
 *
 * `ZOOM_MIN = 4` : de quoi contenir un rayon de 300 km, le maximum accepté
 * par la base (`pro_zone_km_check`).
 */
export const ZOOM_MIN = 4;
export const ZOOM_MAX = 12;

/** La circonférence de la Terre divisée par 256 : la base de tout le reste. */
const RESOLUTION_ZERO = 156543.03392;

const enRadians = (degres) => (degres * Math.PI) / 180;

/**
 * Combien de mètres représente UN pixel, ici, à ce zoom.
 *
 * Le `cos(latitude)` n'est pas un détail : la projection Web Mercator
 * étire les distances à mesure qu'on monte vers le pôle. Sans lui, un
 * cercle de 30 km serait juste à l'équateur et faux à Lille.
 */
export function metresParPixel(latitude, zoom) {
  return (RESOLUTION_ZERO * Math.cos(enRadians(latitude))) / 2 ** zoom;
}

/**
 * Le zoom qui fait tenir le cercle dans la largeur donnée.
 *
 * `cotePx` est **la plus petite des deux dimensions du cadre**. Prendre la
 * largeur seule ferait déborder le cercle en haut et en bas d'un cadre plus
 * large que haut — ce qui est précisément la forme d'une carte de fiche.
 *
 * `marge` laisse de l'air autour : un cercle qui touche les bords donne
 * l'impression d'être coupé.
 *
 * On ARRONDIT VERS LE BAS, jamais vers le haut : un zoom plus petit montre
 * plus de terrain, donc le cercle rentre à coup sûr. L'arrondi au-dessus
 * l'aurait fait déborder une fois sur deux.
 */
export function zoomPour(latitude, rayonKm, cotePx, marge = 1.35) {
  if (!(rayonKm > 0) || !(cotePx > 0)) return ZOOM_MAX;
  const voulu = (2 * rayonKm * 1000 * marge) / cotePx; // mètres par pixel
  const brut = Math.log2((RESOLUTION_ZERO * Math.cos(enRadians(latitude))) / voulu);
  if (!Number.isFinite(brut)) return ZOOM_MAX;
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.floor(brut)));
}

/** La position du point, en tuiles (avec sa fraction), sur l'axe des X. */
export function tuileX(longitude, zoom) {
  return ((longitude + 180) / 360) * 2 ** zoom;
}

/**
 * Idem sur l'axe des Y — et c'est là qu'est toute la projection Mercator.
 *
 * Le `log(tan + sec)` est la formule de Mercator ; c'est elle qui fait que
 * les méridiens restent parallèles et que le Groenland paraît immense.
 */
export function tuileY(latitude, zoom) {
  const r = enRadians(latitude);
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** zoom;
}

/**
 * L'adresse d'une tuile chez l'IGN.
 *
 * `GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2` est le plan IGN ordinaire — celui
 * qu'on reconnaît, avec les routes en orange et les communes nommées.
 * Aucune clé : depuis la bascule vers la Géoplateforme, les données
 * ouvertes sont servies sans compte.
 */
export function urlTuile(x, y, zoom) {
  return 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0'
    + '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM'
    + '&FORMAT=image/png'
    + `&TILEMATRIX=${zoom}&TILEROW=${y}&TILECOL=${x}`;
}

/**
 * Le damier à poser, et où poser chaque image.
 *
 * Renvoie une liste de `{ cle, url, left, top }` : `left` et `top` sont des
 * positions en pixels DANS le cadre, à donner telles quelles à un
 * `position: 'absolute'`. Elles sont souvent négatives — c'est normal : la
 * première tuile commence avant le bord gauche, sinon le centre ne
 * tomberait pas au milieu.
 *
 * Les tuiles hors du monde (au-delà du bord de la carte) sont écartées
 * plutôt que demandées : le serveur répondrait par une erreur, et
 * l'application afficherait un carré vide en attendant.
 */
export function grilleTuiles({ latitude, longitude, zoom, largeur, hauteur }) {
  if (!(largeur > 0) || !(hauteur > 0)) return [];

  const nbTuiles = 2 ** zoom;
  /* Le centre, en pixels du monde entier. */
  const centreX = tuileX(longitude, zoom) * TAILLE_TUILE;
  const centreY = tuileY(latitude, zoom) * TAILLE_TUILE;
  /* Le coin haut-gauche de ce qu'on affiche, dans le même repère. */
  const origineX = centreX - largeur / 2;
  const origineY = centreY - hauteur / 2;

  const premiereColonne = Math.floor(origineX / TAILLE_TUILE);
  const premiereLigne = Math.floor(origineY / TAILLE_TUILE);
  const nbColonnes = Math.ceil((origineX + largeur) / TAILLE_TUILE) - premiereColonne;
  const nbLignes = Math.ceil((origineY + hauteur) / TAILLE_TUILE) - premiereLigne;

  const tuiles = [];
  for (let i = 0; i < nbColonnes; i += 1) {
    for (let j = 0; j < nbLignes; j += 1) {
      const x = premiereColonne + i;
      const y = premiereLigne + j;
      if (x < 0 || y < 0 || x >= nbTuiles || y >= nbTuiles) continue;
      tuiles.push({
        cle: `${zoom}-${x}-${y}`,
        url: urlTuile(x, y, zoom),
        left: x * TAILLE_TUILE - origineX,
        top: y * TAILLE_TUILE - origineY,
      });
    }
  }
  return tuiles;
}

/** Le diamètre du cercle à dessiner, en pixels. */
export function diametrePx(latitude, rayonKm, zoom) {
  return (2 * rayonKm * 1000) / metresParPixel(latitude, zoom);
}
