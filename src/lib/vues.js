/**
 * QUAND UNE PUBLICATION A-T-ELLE ÉTÉ « VUE » ? — du calcul pur.
 *
 * POURQUOI CE FICHIER N'IMPORTE RIEN
 * -----------------------------------
 * Huitième application de la leçon de `cloudinary-adresses.js` : un calcul
 * rangé dans un composant ne peut pas être FAIT TOURNER par un contrôle,
 * parce que `node` ne sait pas ouvrir React Native. Et ce calcul-là en a
 * particulièrement besoin : il dépend du TEMPS, donc il est impossible à
 * juger à l'œil et pénible à juger à l'écran — il faudrait faire défiler un
 * fil pendant des secondes et regarder passer des requêtes.
 *
 * CE QU'IL FAUT COMPRENDRE AVANT DE LE LIRE
 * ------------------------------------------
 * `onViewableItemsChanged` d'une `FlatList` se déclenche à chaque fois que
 * la composition de l'écran change — c'est-à-dire plusieurs fois par
 * seconde pendant qu'on fait défiler. Compter une vue à chaque passage
 * donnerait un chiffre qui ne veut rien dire :
 *
 *   - **une publication traversée en descendant n'est pas une vue.** On ne
 *     l'a pas regardée, on est passé dessus. D'où `DUREE_VUE` : elle doit
 *     rester à l'écran un moment avant de compter ;
 *   - **vingt publications ne font pas vingt requêtes.** On accumule, et on
 *     envoie par paquets — sur un chantier en 4G, vingt allers-retours
 *     pendant qu'on fait défiler, c'est l'application qui rame.
 *
 * Et la base pose la vraie garantie, celle qu'aucun minuteur ne peut
 * tenir : la clé primaire `(post_id, spectateur_id)` fait qu'une personne
 * ne compte qu'UNE FOIS par publication, quoi que l'écran envoie
 * (section 35 de `schema.sql`). Ce fichier ne fait qu'éviter du bruit.
 */

/**
 * Combien de temps une publication doit rester à l'écran pour compter.
 *
 * Une seconde : c'est le seuil des grandes plateformes, et il a une raison
 * physique — en dessous, on n'a pas eu le temps de lire le nom de
 * l'artisan.
 */
export const DUREE_VUE = 1000;

/** Toutes les combien on envoie ce qui s'est accumulé. */
export const DELAI_ENVOI = 5000;

/**
 * La borne du paquet. Elle double celle de la base (50, section 35) —
 * deux bornes pour la même chose, et c'est voulu : celle de la base
 * protège contre un client modifié, celle-ci évite de la heurter par
 * accident un jour où l'on monterait la taille d'une page de fil.
 */
export const PAQUET_MAX = 50;

/**
 * Met à jour le registre des arrivées, et rend ce qui est DÛ.
 *
 * `arrivees` est une `Map` identifiant → instant d'arrivée à l'écran. La
 * fonction la modifie en place (c'est une référence qui vit entre deux
 * rendus, pas un état React : la mettre dans un `useState` redessinerait
 * l'écran plusieurs fois par seconde, ce que le lot 6 interdit).
 *
 * @param arrivees  Map partagée, modifiée en place
 * @param visibles  les identifiants actuellement à l'écran
 * @param dejaVues  ce qu'on a déjà envoyé dans cette session
 * @param maintenant  l'horloge, passée en argument pour être contrôlable
 * @returns les identifiants qui viennent d'atteindre la durée
 */
export function aRetenir(arrivees, visibles, dejaVues, maintenant, duree = DUREE_VUE) {
  const presents = new Set(visibles);

  /* CE QUI SORT DE L'ÉCRAN OUBLIE SON HORLOGE. Sans ça, trois passages de
     400 ms finiraient par en faire une vue — alors que personne n'a rien
     regardé. Une vue, c'est une seconde D'AFFILÉE. */
  arrivees.forEach((_, id) => { if (!presents.has(id)) arrivees.delete(id); });

  const dus = [];
  presents.forEach((id) => {
    if (id === null || id === undefined || dejaVues.has(id)) return;
    const depuis = arrivees.get(id);
    if (depuis === undefined) { arrivees.set(id, maintenant); return; }
    if (maintenant - depuis >= duree) dus.push(id);
  });
  return dus;
}

/**
 * Ce qui part vraiment, et ce qui reste pour la fois d'après.
 *
 * `file` est modifiée en place, comme `arrivees` : rendre une nouvelle
 * liste obligerait l'appelant à la ranger quelque part, donc dans un état,
 * donc à redessiner.
 */
export function prochainPaquet(file, taille = PAQUET_MAX) {
  const paquet = file.splice(0, taille);
  return paquet;
}

/**
 * Les identifiants qui PEUVENT compter une vue.
 *
 * Deux cas sortent, et les deux sortiraient de toute façon côté base — on
 * les retire ici pour ne pas envoyer des identifiants qu'on sait inutiles :
 *
 *   - **sa propre publication.** Relire ce qu'on vient de publier n'est pas
 *     une vue : le chiffre mesurerait l'anxiété de l'artisan ;
 *   - **ce qui n'a pas d'identifiant de base.** Une publication qu'on vient
 *     de poser porte un identifiant local (`local-…`) tant que la base n'a
 *     pas répondu.
 */
export function vuesPossibles(posts, moiId) {
  return posts
    .filter((p) => p && typeof p.id === 'string' && !p.id.startsWith('local-'))
    .filter((p) => !moiId || p.proId !== moiId)
    .map((p) => p.id);
}
