/**
 * LE CADRE D'UNE PHOTO DANS LE FIL — du calcul, et rien d'autre.
 *
 * POURQUOI CE FICHIER N'IMPORTE RIEN
 * ----------------------------------
 * C'est la leçon de `cloudinary-adresses.js`, apprise le 02/10/2026 : un
 * calcul rangé dans un composant devient incontrôlable, parce que `node`
 * ne sait pas ouvrir un fichier qui importe React Native. Le contrôle ne
 * peut alors plus le FAIRE TOURNER — il ne peut que relire le code, ce qui
 * ne prouve rien.
 *
 * POURQUOI UN CADRE QUI S'ADAPTE
 * ------------------------------
 * Mesuré sur les VRAIES photos du propriétaire : trois sont carrées
 * (1179 × 1179) et une est très verticale (1600 × 2845). Le fil imposait
 * un cadre fixe de 16:10.
 *
 *     photo carrée     dans 16:10 →  37,5 % de hauteur perdue
 *     photo verticale  dans 16:10 →  64,9 % de hauteur perdue
 *
 * On pourrait croire qu'il suffit de passer en 4:5. Non : une photo de
 * chantier en paysage y perdrait **55 % de sa largeur**. Aucune valeur
 * fixe ne convient à tout le monde — c'est la photo qui doit décider.
 *
 *     carrée    → gardée telle quelle,  0 % perdu
 *     verticale → ramenée à 4:5,     29,7 % perdus (au lieu de 64,9)
 *     paysage   → ramenée à 16:10,     10 % perdus
 *
 * POURQUOI DES BORNES QUAND MÊME
 * ------------------------------
 * Sans elles, une photo panoramique ferait une bande de 40 px dans le fil,
 * et une capture d'écran de téléphone un mur de deux écrans de haut qu'il
 * faudrait franchir avant de voir la publication suivante. Les bornes ne
 * sont pas un compromis esthétique : elles tiennent le RYTHME du fil.
 */

/** La limite portrait : 0,80. Au-delà, la carte deviendrait un mur. */
export const PLUS_HAUT = 4 / 5;

/** La limite paysage : 1,60. Au-delà, la photo deviendrait une bande. */
export const PLUS_LARGE = 16 / 10;

/**
 * Le cadre retenu pour une photo dont on connaît le rapport largeur/hauteur.
 *
 * Un rapport inconnu — image pas encore chargée, fichier illisible,
 * dimensions nulles — rend le CARRÉ : c'est la forme la plus fréquente des
 * photos de chantier (un téléphone récent photographie en 4:3 ou en 1:1),
 * donc celle qui bougera le moins quand la vraie forme arrivera.
 */
export function cadrePhoto(rapport) {
  if (!(rapport > 0)) return 1;
  return Math.max(PLUS_HAUT, Math.min(PLUS_LARGE, rapport));
}
