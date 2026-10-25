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
  /* Le badge suspendu le temps qu'une nouvelle pièce soit regardée (lot
     S-a, 25/10/2026) : posée par `tient_le_profil_pro()`, sans acteur. */
  'verification_suspendue',
  /* DEUX TYPES QUE LA BASE ÉCRIVAIT DÉJÀ ET QUE PERSONNE NE SAVAIT OUVRIR
     (trouvés le 25/10/2026 en ajoutant le précédent) : `admin_verifier_pro`
     écrit `verification_attente` quand il manque encore une pièce, et
     `admin_traiter_metiers` écrit `metiers_refuses`. Un appui dessus ne
     menait nulle part. `verifier-notifications` relève désormais les types
     dans `schema.sql` lui-même, au lieu de faire confiance à cette liste. */
  'verification_attente', 'metiers_refuses',
  'metiers_acceptes',
  /* La porte de secours et les entreprises (section 45, 15/10/2026) :
     quatre types, et chacun mène quelque part — sinon c'est le défaut du
     06/10 refait au premier type ajouté. */
  'demande_pro_nouvelle', 'compte_pro_ouvert', 'demande_pro_refusee',
  'entreprise_retiree',
];

/* CE QUI SE PASSE SUR MA PROPRE FICHE. Un partenariat s'accepte dans le
   bloc « Demandes de partenariat » ; un badge accordé ou refusé se lit
   dans « Informations vérifiées » ; des métiers acceptés s'y voient aussi.
   Les trois vivent sur le même écran, donc une seule destination. */
export const NOTIFS_PROFIL = new Set([
  'partenaire_demande', 'partenaire_accepte',
  'verification_acceptee', 'verification_refusee', 'verification_suspendue',
  'verification_attente', 'metiers_acceptes', 'metiers_refuses',
  /* Une entreprise retirée par l'administration : la fiche est l'endroit
     où l'on voit ce qui est rattaché, et ce qui ne l'est plus. Elle n'a
     pas de cible — l'identité retirée n'est plus la sienne. */
  'entreprise_retiree',
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

  /* UNE DEMANDE DE COMPTE PRO (section 45) — la même colonne, et trois
     destinataires qui ne vont pas au même endroit. C'est l'exception à
     « la cible passe avant le type », et elle est assumée : la cible dit
     QUELLE demande, le type dit QUI la reçoit. L'administrateur va à la
     file ; le demandeur, à son profil — ou, si son compte vient d'être
     ouvert, dans son espace d'artisan. */
  if (n.demandeProId) {
    if (n.type === 'compte_pro_ouvert') return { quoi: 'compte_pro', demandeProId: n.demandeProId };
    if (n.type === 'demande_pro_refusee') return { quoi: 'profil', demandeProId: n.demandeProId };
    return { quoi: 'administration', demandeProId: n.demandeProId };
  }

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
  verification_suspendue: null,
  verification_attente: null,
  metiers_acceptes: null,
  metiers_refuses: null,
  demande_pro_nouvelle: 'demandeProId',
  compte_pro_ouvert: 'demandeProId',
  demande_pro_refusee: 'demandeProId',
  entreprise_retiree: null,
};

/**
 * LA PHOTO DE CELUI QUI VOUS ÉCRIT — et pourquoi elle se cherche à DEUX
 * endroits.
 *
 * Signalé par le propriétaire le 07/10/2026 : « les images de profil ne
 * s'affichent toujours pas sur les personnes qui font des notifications ».
 * Il avait raison, et mon essai de la veille l'avait MASQUÉ : j'avais
 * écrit la photo du compte d'essai dans les DEUX tables à la main, ce que
 * l'application ne fait jamais.
 *
 * Mesuré sur la vraie base :
 *
 *   photo sur `professional_profiles` ....... 2 artisans sur 7
 *   photo sur `users` (ce que lisait la cloche) .... 0 sur 7
 *
 * > **La photo d'un ARTISAN vit sur sa FICHE, celle d'un particulier sur
 * > son compte.** `updateProfile` écrit dans l'une ou dans l'autre selon
 * > le type — jamais dans les deux. Ce n'est pas un oubli : dupliquer la
 * > même donnée dans deux tables est exactement le défaut du 05/10 (« deux
 * > moitiés créées par deux mécanismes différents finiront par se
 * > désaligner »). C'est donc la LECTURE qui doit regarder aux deux
 * > endroits, pas l'écriture qui doit recopier.
 *
 * Et la base le fait déjà : `notifie_commentaire()` compose le nom de
 * l'acteur avec `coalesce(pp.entreprise, u.nom, 'Quelqu''un')` et un
 * `left join professional_profiles` — exactement ce raisonnement, écrit en
 * SQL depuis le premier jour. L'application lisait la moitié de ce que la
 * base savait déjà.
 *
 * `acteur` est la ligne jointe telle que PostgREST la rend. Une relation
 * un-à-un peut arriver en objet OU en tableau d'un élément selon la façon
 * dont la requête est écrite : on accepte les deux plutôt que de dépendre
 * d'un détail qui ne lèvera aucune erreur le jour où il changera.
 */
export function photoActeur(acteur) {
  if (!acteur) return null;
  const fiche = Array.isArray(acteur.fiche) ? acteur.fiche[0] : acteur.fiche;
  return (fiche && fiche.avatar_url) || acteur.avatar_url || null;
}
