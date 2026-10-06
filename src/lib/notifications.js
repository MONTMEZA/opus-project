/**
 * OÙ MÈNE UNE NOTIFICATION — et le calcul vit ICI, qui n'importe rien.
 *
 * Neuvième application de la leçon de `cloudinary-adresses.js` : un calcul
 * pur rangé dans un composant ne peut pas être FAIT TOURNER par un
 * contrôle, donc il n'est jamais éprouvé. Ce fichier ne charge ni React ni
 * React Native ; `npm run verifier-notifications` l'exécute sur chaque type
 * de notification que la base sait créer.
 *
 * CE QUE CE FICHIER EMPÊCHE
 * -------------------------
 * `OpusApp` faisait, pour TOUTES les notifications :
 *
 *     if (!n.postId) return;
 *
 * Mesuré sur la vraie base le 06/10/2026 : **11 notifications sur 15**
 * n'avaient pas de publication — annonce, partenariat, badge vérifié,
 * devis, rappel, demande refusée. Onze culs-de-sac sur quinze, et aucune
 * erreur pour le dire. Le propriétaire l'a trouvé en s'en servant.
 *
 * > **Un type qui ne sait pas où il mène doit faire ROUGIR un contrôle**,
 * > pas se taire à l'écran. C'est pour ça que `TYPES_CONNUS` est écrit ici
 * > et pas deviné : le jour où la base en ajoute un, le contrôle le
 * > réclame.
 */

/* LES TYPES QUE LES DÉCLENCHEURS DE `schema.sql` SAVENT ÉCRIRE.
   Relevés un par un dans le fichier — sections 13 (commentaires),
   13 bis (partenariats), 24 (demandes), 25 (vérification), 27 (métiers)
   et 29 (annonces). */
export const TYPES_CONNUS = [
  'commentaire', 'reponse',
  'annonce',
  'devis', 'devis_accepte',
  'rappel', 'rappel_accepte',
  'sos', 'sos_accepte',
  'demande_refusee',
  'partenaire_demande', 'partenaire_accepte',
  'verification_acceptee', 'verification_refusee',
  'metiers_acceptes',
];

/* CE QUI SE PASSE SUR MA PROPRE FICHE. Un partenariat s'accepte dans le
   bloc « Demandes de partenariat » ; un badge accordé ou refusé se lit
   dans « Informations vérifiées » ; des métiers acceptés s'y voient aussi.
   Les trois vivent sur le même écran, donc une seule destination. */
export const NOTIFS_PROFIL = new Set([
  'partenaire_demande', 'partenaire_accepte',
  'verification_acceptee', 'verification_refusee',
  'metiers_acceptes',
]);

/**
 * La destination d'une notification, sous la forme que l'écran attend.
 *
 * On regarde D'ABORD les identifiants de cible, et seulement ENSUITE le
 * type — et cet ordre n'est pas interchangeable : une notification porte
 * son adresse, le type ne dit que la famille. Le jour où un partenariat
 * emmènera ailleurs qu'à la fiche, c'est une colonne qu'on ajoutera, pas
 * un `if` sur une chaîne de caractères.
 *
 * Rend toujours un objet. `{ quoi: 'rien' }` est une réponse, pas un
 * silence : l'écran l'explique au lieu de ne pas bouger.
 */
export function destinationNotif(n) {
  if (!n) return { quoi: 'rien' };

  if (n.postId) {
    return { quoi: 'post', postId: n.postId, commentId: n.commentId || null };
  }
  if (n.annonceId) return { quoi: 'annonce', annonceId: n.annonceId };

  if (n.devisId)  return { quoi: 'demande', id: n.devisId,  origine: 'devis' };
  if (n.rappelId) return { quoi: 'demande', id: n.rappelId, origine: 'rappel' };
  if (n.sosId)    return { quoi: 'demande', id: n.sosId,    origine: 'sos' };

  if (NOTIFS_PROFIL.has(n.type)) return { quoi: 'profil' };

  return { quoi: 'rien' };
}

/**
 * De quelle CIBLE un type a-t-il besoin pour mener quelque part ?
 *
 * Sert au contrôle, et à lui seul : il fabrique une notification de chaque
 * type avec la cible que la base y met, et vérifie que `destinationNotif`
 * ne rend jamais `'rien'`. Sans cette table, le contrôle ne pourrait que
 * relire le code — et un type ajouté demain passerait inaperçu.
 */
export const CIBLE_ATTENDUE = {
  commentaire: 'postId',
  reponse: 'postId',
  annonce: 'annonceId',
  devis: 'devisId',
  devis_accepte: 'devisId',
  rappel: 'rappelId',
  rappel_accepte: 'rappelId',
  sos: 'sosId',
  sos_accepte: 'sosId',
  /* Un refus peut venir des trois tables : le déclencheur remplit celle
     dont la demande vient, et `destinationNotif` les essaie dans l'ordre. */
  demande_refusee: 'devisId',
  partenaire_demande: null,
  partenaire_accepte: null,
  verification_acceptee: null,
  verification_refusee: null,
  metiers_acceptes: null,
};
