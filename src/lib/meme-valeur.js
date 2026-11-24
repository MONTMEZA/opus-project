/**
 * DEUX VALEURS SONT-ELLES LA MÊME ? — une seule règle, pour tout le devis
 * (étape 2b-5 du module devis, 21/11/2026, décision T4 du cahier).
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Jusqu'à 2b-4, toutes les valeurs d'un devis étaient des nombres, des
 * textes, des booléens ou `null` : `Object.is` suffisait à dire « c'est la
 * même valeur ». L'étape 2b-5 (les déchets du chantier) y met trois LISTES :
 * les déchets triés, ce qui reste sur le chantier, les lieux de dépôt
 * choisis. Or deux listes égales ne sont jamais `Object.is` l'une à
 * l'autre : `Object.is(['bois'], ['bois'])` est FAUX, parce que ce sont deux
 * objets différents. L'étape 2b-6 (le label RGE, 24/11/2026) en ajoute
 * trois de la même famille : les travaux d'énergie cochés
 * (`energieTravaux`), ceux pour lesquels l'artisan déclare ne pas détenir
 * de label RGE (`energieSansLabel`) et les sous-traitants choisis
 * (`energieSousTraitants`). La règle ne change pas : elle sert telle quelle.
 *
 * Sans cette fonction, trois défauts, et aucun ne lèverait une erreur :
 *   - la file d'écriture croirait qu'une liste a changé à chaque appui,
 *     même revenue à sa valeur enregistrée, et l'enverrait pour rien ;
 *   - la rangée « Déchets » dirait « — enregistrement… » alors que rien des
 *     déchets ne part (mesuré par la contradiction des contrôles, CTL-3 :
 *     un refus, puis le retour à la valeur confirmée par une liste NEUVE,
 *     puis un autre champ en route) ;
 *   - la saisie enverrait une écriture d'en-tête à chaque fermeture de la
 *     carte.
 *
 * LA RÈGLE, ÉCRITE UNE FOIS : deux valeurs sont la même si elles sont
 * `Object.is` l'une à l'autre, OU si ce sont deux listes de même longueur
 * dont chaque élément est `Object.is` à l'élément de même rang. L'ORDRE
 * compte (la base range les lieux dans l'ordre de la liste de « Mon
 * entreprise », et deux ordres différents sont deux écritures différentes).
 * Et une liste vide n'est PAS « rien » : `memeValeur(null, [])` est FAUX —
 * un tableau vide est une valeur que la base refuse (2b-5 n'en écrit
 * jamais), et le confondre avec `null` cacherait ce défaut au lieu de le
 * montrer.
 *
 * Elle ne descend pas plus bas qu'un niveau : aucune valeur du devis n'est
 * une liste de listes (la base refuse les tableaux à deux dimensions).
 *
 * CE FICHIER N'IMPORTE RIEN : `node` le fait tourner (`verifier-devis`), et
 * il est importé par `file-ecriture.js` (qui, sans lui, n'importait rien),
 * par `devis.js` et par la saisie. Une seule écriture de la règle : une
 * jumelle écrite ailleurs finirait par dire autre chose.
 */
export function memeValeur(a, b) {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}
