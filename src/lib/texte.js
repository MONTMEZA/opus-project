/**
 * Mettre un texte à plat, pour le comparer.
 *
 * POURQUOI CE FICHIER EXISTE TOUT SEUL
 * ------------------------------------
 * `normaliser()` vivait dans `recherche.js`. Le jour où `metiers.js` en a
 * eu besoin — pour chercher un métier sans accent —, les deux fichiers se
 * sont mis à s'importer l'un l'autre. Un cycle d'imports « fonctionne »
 * jusqu'au jour où l'ordre de chargement change : l'un des deux se
 * construit alors que l'autre n'est pas encore prêt, et on obtient un
 * `undefined is not a function` à la première frappe, impossible à relier
 * à sa cause.
 *
 * Une fonction dont deux modules ont besoin se met dans un troisième.
 */

/**
 * Enlève les accents et la casse.
 * `normalize('NFD')` sépare la lettre de son accent, et on retire ensuite
 * tous les signes diacritiques d'un coup.
 */
export function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
