/**
 * « RÉPONDRE » À UNE DEMANDE, ET LA CONVERSATION QUI VA AVEC (lot S-b,
 * seconde relecture du 27/10/2026).
 *
 * Deux écritures, dans cet ordre : la RÉPONSE (c'est elle que la base
 * refuse sur une demande fermée, ou dont l'auteur est en blocage avec
 * l'artisan), PUIS la conversation. Et l'on ne se souvient d'avoir répondu
 * qu'une fois la conversation OUVERTE.
 *
 * Le défaut que ceci corrige, et qui avait été CRÉÉ par la première
 * relecture : la carte retenait « Vous avez répondu » dès la réponse
 * enregistrée. Si la conversation échouait ensuite (une coupure entre les
 * deux requêtes suffit), la carte n'avait plus de bouton, et au
 * redémarrage la base relisait la réponse : l'artisan ne pouvait plus
 * JAMAIS écrire à ce client depuis la demande. Désormais un nouvel appui
 * repart : la réponse déjà comptée revient en `{ nouvelle: false }` (le
 * compteur ne monte pas deux fois), et la conversation se crée.
 *
 * ET APRÈS UN REDÉMARRAGE (troisième relecture du 27/10) : la base relit
 * la réponse, la carte se souvient donc d'avoir répondu — mais elle ne sait
 * pas si la conversation a pu s'ouvrir. Le souvenir n'enlève donc PLUS le
 * geste : la carte porte « Répondu · Écrire », qui rejoue ce même geste.
 * Ce premier correctif ne tenait que pendant la session.
 *
 * Deux autres pièges, mesurés eux aussi :
 *   - une conversation CHARGÉE DE LA BASE n'a pas de `contact` (seulement
 *     `autre`) : la chercher par `contact.id` ne la trouvait jamais, et la
 *     seconde création était refusée par la clé unique — « La conversation
 *     n'a pas pu être ouverte » alors qu'elle existait ;
 *   - une conversation créée côté serveur dont la réponse s'est perdue :
 *     chaque nouvel appui recevait 23505. On la RELIT au lieu d'échouer.
 *
 * IL N'IMPORTE RIEN, et c'est voulu : la leçon de `cloudinary-adresses.js`.
 * `verifier-demandes` FAIT TOURNER `repondreEtOuvrir` avec une base simulée
 * — réseau coupé sur la conversation, conversation déjà là sans `contact`,
 * conversation créée mais réponse perdue, refus de la réponse.
 */

/**
 * Cette demande est-elle la MIENNE ? (troisième relecture du 27/10 : la
 * règle vivait dans l'écran, que le contrôle ne fait pas tourner — une
 * faute de frappe la rendait toujours fausse, et l'écran montrait
 * « Répondre » sur sa propre demande en retirant « J'ai trouvé ».)
 * L'identifiant peut arriver en nombre ou en chaîne : on compare des chaînes.
 */
export function demandeEstLaMienne(d, monId) {
  if (!d || monId === null || monId === undefined || monId === '') return false;
  return String(d.auteurId) === String(monId);
}

/** La conversation avec un particulier, qu'elle ait été créée ici (`contact`) ou chargée de la base (`autre`). */
export function conversationAvec(conversations, idParticulier) {
  if (idParticulier === null || idParticulier === undefined) return null;
  const id = String(idParticulier);
  return (conversations || []).find((c) => (c.contact && c.contact.id === `part-${id}`)
    || (c.autre && String(c.autre.id) === id)) || null;
}

/**
 * Cette conversation est-elle avec cette personne ? Les TROIS formes d'une
 * conversation à l'écran : chargée de la base (`proId` = `autre.id`), ou
 * construite à l'instant par « Répondre » ou « Envoyer un message »
 * (`autre`, `contact`). Troisième relecture du 27/10 : bloquer ne regardait
 * que `proId`, qui valait `null` sur une conversation construite à
 * l'instant — elle restait affichée, alors que les textes promettent
 * « masquées des deux côtés ».
 */
export function conversationConcerne(c, idPersonne) {
  if (!c || idPersonne === null || idPersonne === undefined) return false;
  const id = String(idPersonne);
  return (c.proId !== null && c.proId !== undefined && String(c.proId) === id)
    || (!!c.autre && String(c.autre.id) === id)
    || (!!c.contact && c.contact.id === `part-${id}`);
}

/**
 * Obtenir la conversation avec un particulier : la retrouver, ou la créer,
 * ou — si la base répond qu'elle existe déjà (23505) — la RELIRE.
 * Rend `{ id, ajoutee, relue }`, ou lève l'erreur de la création.
 *   - `creer(idParticulier)` rend la ligne créée (`{ id }`) ou `null` (démonstration) ;
 *   - `relire(idParticulier)` rend la ligne existante, ou `null`.
 */
export async function obtenirConversation({ conversations, idParticulier, creer, relire }) {
  const trouvee = conversationAvec(conversations, idParticulier);
  if (trouvee) return { id: trouvee.id, ajoutee: false, relue: false };
  try {
    const ligne = await creer(idParticulier);
    return { id: ligne && ligne.id ? ligne.id : null, ajoutee: true, relue: false };
  } catch (e) {
    if (!e || e.code !== '23505') throw e;
    const ligne = await relire(idParticulier);
    if (!ligne || !ligne.id) throw e;
    return { id: ligne.id, ajoutee: true, relue: true };
  }
}

/**
 * Tout le geste « Répondre ». Rend une ISSUE, que l'écran applique :
 *   { etat: 'fermee', message }        la base refuse (demande fermée, ou
 *                                       blocage) : phrase neutre ;
 *   { etat: 'echec_reponse', erreur }  la réponse n'est pas partie ;
 *   { etat: 'echec_conversation', comptee, erreur }
 *                                      la réponse est enregistrée, la
 *                                      conversation non : la carte GARDE
 *                                      « Répondre », un nouvel appui repart ;
 *   { etat: 'ouverte', id, ajoutee, relue, comptee }
 * `comptee` dit si la base vient de COMPTER une réponse (le compteur de la
 * carte monte alors d'un).
 */
export async function repondreEtOuvrir({ demande, conversations, repondre, creer, relire }) {
  let resultat;
  try {
    resultat = await repondre(demande.id);
  } catch (e) {
    if (e && e.code === 'REPONSE_FERMEE') return { etat: 'fermee', message: e.message };
    return { etat: 'echec_reponse', erreur: e };
  }
  const comptee = !!(resultat && resultat.nouvelle);
  try {
    const conv = await obtenirConversation({
      conversations, idParticulier: demande.auteurId, creer, relire,
    });
    return { etat: 'ouverte', comptee, ...conv };
  } catch (e) {
    return { etat: 'echec_conversation', comptee, erreur: e };
  }
}
