/**
 * L'IDENTIFIANT D'UN DEVIS OU D'UNE LIGNE, CHOISI PAR LE TÉLÉPHONE.
 *
 * POURQUOI LE TÉLÉPHONE LE CHOISIT (lot 1 du module devis, 21/10/2026)
 * --------------------------------------------------------------------
 * Une ligne de devis s'enregistre quand on la quitte. Si son identifiant
 * venait de la base, la ligne n'en aurait pas tant que la base n'a pas
 * répondu — et deux enregistrements rapprochés (une pastille touchée, puis
 * un champ quitté) partiraient AVANT la réponse : deux insertions, donc
 * deux lignes, dont une en double. Et une écriture renvoyée après un délai
 * dépassé, alors qu'elle était peut-être passée, en ferait une troisième.
 *
 * Avec un identifiant posé dès la naissance de la carte :
 *   - une écriture renvoyée est la MÊME écriture : la base répond 23505
 *     (« cette clé existe déjà »), et la file d'écriture sait que c'était
 *     déjà fait — jamais un doublon ;
 *   - la clé de la rangée à l'écran ne change jamais : aucune cellule ne se
 *     remonte quand la base répond, et le champ ne perd pas le focus.
 *
 * Un identifiant choisi par le client n'ouvre rien : la base juge le DEVIS
 * visé (ses règles d'accès), pas l'identifiant ; un identifiant qui
 * existerait déjà chez un autre artisan rend 23505, sans rien lui montrer.
 *
 * D'OÙ IL VIENT, SANS AUCUN PAQUET NOUVEAU
 * ----------------------------------------
 *   1. le navigateur : `crypto.randomUUID()`, l'API standard ;
 *   2. le téléphone : `globalThis.expo.uuidv4()`, le générateur du cœur
 *      d'Expo (`expo-modules-core` : `CoreModule.swift`, `CoreModule.kt`),
 *      déjà présent dans Expo Go et dans le build de développement — aucun
 *      module natif à ajouter, donc aucune reconstruction.
 * On ne l'importe PAS de `expo-modules-core` : ce paquet n'est pas une
 * dépendance directe d'Opus, et `verifier-imports` refuse tout paquet
 * absent de `package.json` (l'écran blanc du 11/10/2026).
 *
 * CE QU'IL NE FAIT JAMAIS : bricoler un identifiant (`Math.random`, une
 * date). Un identifiant deviné ou répété ferait exactement ce que ce
 * fichier empêche — deux lignes confondues. Sans générateur, il rend
 * `null`, et l'écran le DIT au lieu d'enregistrer de travers.
 *
 * Ce fichier n'importe RIEN : `verifier-devis` le fait tourner sous `node`,
 * avec et sans `crypto.randomUUID`.
 *
 * Ce qui n'est pas vérifié ici, et qui le sera par la toute première ligne
 * enregistrée depuis l'iPhone : que `globalThis.expo.uuidv4` soit bien là
 * dans l'application d'essai (DÉDUIT du code d'Expo).
 *
 * UN ESSAI AU NAVIGATEUR SE FAIT SUR `localhost` (ou en HTTPS). Ouverte par
 * une adresse du réseau local en HTTP (`http://192.168.…`), la page n'est
 * pas un « contexte sécurisé » : `crypto.randomUUID` n'y existe pas, et le
 * repli web d'Expo (`expo-modules-core/src/uuid/index.web.ts`) le rappelle
 * lui-même. Ce fichier rend alors `null`, et aucune ligne ne s'enregistre —
 * un refus DIT, jamais un doublon (relecture des étapes 0-2, mineur 17).
 */

/* Un UUID version 4, en minuscules : la forme que PostgreSQL rend, et celle
   que le tri des lignes compare (`trierLignes`, par `ordre` puis `id`). */
const FORME_UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/* Une valeur rendue par un générateur n'est gardée que si elle a la forme
   d'un UUID v4. Les minuscules ne sont pas un bricolage : c'est la même
   valeur, écrite comme PostgreSQL l'écrit. */
function bienForme(valeur) {
  if (typeof valeur !== 'string') return null;
  const v = valeur.toLowerCase();
  return FORME_UUID_V4.test(v) ? v : null;
}

/* Chaque source est essayée dans un `try` : un générateur qui lève (un
   contexte non sécurisé au navigateur, un module natif absent) n'est pas
   une panne — on passe au suivant, puis on rend `null`. */
function essayer(fabrique) {
  try {
    return bienForme(fabrique());
  } catch (e) {
    return null;
  }
}

/**
 * Un identifiant neuf, ou `null` quand l'appareil ne sait pas en fabriquer.
 * L'appelant refuse alors d'enregistrer, avec une phrase
 * (`IDENTIFIANT_IMPOSSIBLE`) — jamais un identifiant inventé.
 */
export function nouvelIdentifiant() {
  const g = globalThis;
  if (g.crypto && typeof g.crypto.randomUUID === 'function') {
    const id = essayer(() => g.crypto.randomUUID());
    if (id) return id;
  }
  if (g.expo && typeof g.expo.uuidv4 === 'function') {
    const id = essayer(() => g.expo.uuidv4());
    if (id) return id;
  }
  return null;
}

/** La phrase de l'écran quand `nouvelIdentifiant()` rend `null`. */
export const IDENTIFIANT_IMPOSSIBLE = 'Cet appareil ne sait pas fabriquer d’identifiant pour cette ligne : '
  + 'mettez Opus à jour. Rien n’a été enregistré.';

/** Vrai pour un UUID v4 bien formé, en minuscules — ce que rend `nouvelIdentifiant()`. */
export function estUnIdentifiant(valeur) {
  return typeof valeur === 'string' && FORME_UUID_V4.test(valeur);
}
