/**
 * LE CADRE D'UNE PHOTO DÉJÀ MESURÉE — retenu pour la session.
 *
 * POURQUOI CE FICHIER EXISTE — 15/10/2026
 * ---------------------------------------
 * Le propriétaire : « en remontant le fil, ça fait des petits blocages ».
 * Le mécanisme le plus probable, établi maillon par maillon dans le source
 * puis reproduit au navigateur :
 *
 *   1. le fil DÉMONTE une carte qui est à plus de deux écrans (`windowSize`
 *      5), mais il GARDE la hauteur qu'elle avait pour lui réserver sa
 *      place — la hauteur de la VRAIE photo, donc d'un portrait en 0,8 ;
 *   2. quand on remonte, la carte renaît, et `Carrousel` repartait du
 *      CARRÉ, faute de mieux : la forme réelle n'est écrite nulle part en
 *      base, elle n'arrive qu'avec `onLoad`. La carte naissait donc 89 pt
 *      plus courte que sa place, et tout ce qu'on regarde remontait d'autant ;
 *   3. la photo répondait ensuite, le cadre repassait en portrait, et tout
 *      redescendait.
 *
 * Sur iOS, rien ne compense : `UIScrollView` n'a pas l'ancrage de
 * défilement de Chrome. Au navigateur, ancrage coupé pour imiter l'iPhone,
 * 1 à 3 décalages par remontée — et 0 avec le cadre retenu.
 *
 * Sept premières photos sur dix sont en portrait sur la vraie base : c'est
 * le haut du fil, celui qu'on remonte, qui sautait.
 *
 * CE QU'ON RETIENT, ET SOUS QUELLE CLÉ
 * ------------------------------------
 * L'ADRESSE EXACTE de la photo mesurée — la même chaîne que `recyclingKey`
 * dans `Media`. Les adresses du stockage sont horodatées : une adresse ne
 * désigne jamais deux images, donc un cadre retenu ne peut pas être celui
 * d'une autre photo.
 *
 * `onLoad` RESTE la source de vérité. Ce qui est retenu n'est qu'un POINT
 * DE DÉPART meilleur que le carré : si la photo répond autre chose, c'est
 * elle qui gagne, et elle est retenue à son tour.
 *
 * POURQUOI CE N'EST PAS DANS `cadre.js`
 * ------------------------------------
 * `cadre.js` est « du calcul, et rien d'autre », et `verifier-listes`
 * l'importe sous `node`. Un état qui change pendant la session n'y a pas sa
 * place : ce fichier-ci porte la mémoire, `cadre.js` le calcul. Et il
 * n'importe que `cadre.js`, pour que `verifier-fil` puisse le FAIRE TOURNER
 * — la leçon de `cloudinary-adresses.js`.
 *
 * Et surtout PAS en changeant le défaut de `cadrePhoto` pour 0,8 : les
 * photos carrées et en paysage feraient alors le saut inverse.
 */
import { cadrePhoto } from './cadre.js';

/**
 * Combien de cadres on garde. Une entrée pèse quelques dizaines d'octets ;
 * la borne ne protège pas la mémoire du téléphone, elle empêche une session
 * de plusieurs heures de faire grandir une table que personne ne vide.
 * Trois cents, c'est quinze pages de fil : bien plus que ce qu'on remonte.
 */
export const CADRES_RETENUS_MAX = 300;

const cadres = new Map();

/** Une clé utilisable : une adresse, pas un dégradé vide ni `undefined`. */
function cleValable(adresse) {
  return typeof adresse === 'string' && adresse.length > 0;
}

/**
 * Retient le cadre d'une photo qu'on vient de mesurer, et le rend.
 *
 * Un rapport absurde — image sans dimensions, fichier illisible — rend le
 * carré, comme `cadrePhoto`, mais N'EST PAS retenu : ce n'est pas une
 * mesure, et le retenir ferait naître la carte suivante au carré pour de
 * bon, au lieu de la laisser attendre la vraie forme.
 */
export function retenirCadre(adresse, rapport) {
  const cadre = cadrePhoto(rapport);
  if (!cleValable(adresse) || !(rapport > 0)) return cadre;
  /* Retirer puis remettre : la photo qu'on vient de revoir passe en fin de
     file, et c'est la plus ANCIENNEMENT vue qui part quand la table est
     pleine — pas celle qu'on regarde. */
  cadres.delete(adresse);
  cadres.set(adresse, cadre);
  while (cadres.size > CADRES_RETENUS_MAX) {
    cadres.delete(cadres.keys().next().value);
  }
  return cadre;
}

/** Le cadre déjà mesuré pour cette adresse, ou `null` si on ne la connaît pas. */
export function cadreConnu(adresse) {
  if (!cleValable(adresse)) return null;
  const cadre = cadres.get(adresse);
  return cadre === undefined ? null : cadre;
}
