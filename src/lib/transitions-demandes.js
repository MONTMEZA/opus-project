/**
 * LES TRANSITIONS D'UNE DEMANDE REÇUE — devis, rappel, urgence (lot S-b,
 * 26/10/2026).
 *
 * La base les tient (`tient_la_demande()`, section 24.4 de `schema.sql`) :
 * Accepter et Refuser une demande en attente, Marquer terminée une demande
 * acceptée, et rien d'autre. Ce fichier en est l'écriture pour la
 * DÉMONSTRATION, qui doit refuser comme la base, avec ses mots exacts.
 *
 * IL N'IMPORTE RIEN, et c'est voulu : la leçon de `cloudinary-adresses.js`.
 * Un calcul rangé dans `api.js`, qui charge Supabase et React Native, ne
 * peut pas être FAIT TOURNER par un contrôle. `verifier-demandes` fait
 * tourner `refusDeTransition` sur chaque paire d'états, pour les trois
 * genres, et compare à la règle de la base.
 */

/** Les trois genres, et ce qu'ils valent côté base. */
export const GENRES_DEMANDE = {
  devis:  { table: 'quote_requests',    accepte: 'accepte',  refuse: 'refuse',  termine: 'termine' },
  rappel: { table: 'callback_requests', accepte: 'accepte',  refuse: 'refuse',  termine: 'termine' },
  /* Les urgences accordent leurs participes : 'acceptee', 'refusee'. On ne
     les aligne PAS — des lignes existent déjà, et la contrainte `check` de
     la table les impose. On traduit ici, une fois pour toutes. */
  sos:    { table: 'sos_requests',      accepte: 'acceptee', refuse: 'refusee', termine: 'termine' },
};

/**
 * Rend la clé de la phrase de refus de `REFUS_DEMANDES` (`erreurs.js`), ou
 * `null` si la transition est permise. Un statut renvoyé inchangé est
 * permis : un double appui ne doit pas faire une erreur.
 */
export function refusDeTransition(regles, avant, apres) {
  if (avant === apres) return null;
  const attente = regles.table === 'sos_requests' ? 'envoyee' : 'en_attente';
  if (avant === attente && (apres === regles.accepte || apres === regles.refuse)) return null;
  if (avant === regles.accepte && apres === regles.termine) return null;
  if (avant === regles.accepte) return 'OP019_acceptee';
  if (avant === regles.refuse) return 'OP019_refusee';
  if (avant === 'termine') return 'OP019_terminee';
  if (avant === attente) return 'OP019_en_attente';
  return 'OP019_annulee';
}

/**
 * « FAIRE UN DEVIS » DEPUIS UNE DEMANDE : que fait la carte ? (lot S-b,
 * relecture du 26/10/2026)
 *
 * Deux questions partent ensemble : les brouillons déjà ouverts pour cette
 * demande (`liste`), et la permission d'en commencer un nouveau
 * (`permis` — la base répond `true` / `false`, sans dire pourquoi). Chacune
 * arrive comme un résultat de `Promise.allSettled` : `{ status, value }`.
 *
 * Ce qui décide, et pourquoi :
 *   - la LISTE a échoué : on ne sait pas s'il existe un brouillon — 'echec'
 *     (« Je n'ai pas pu vérifier… ») ;
 *   - la PERMISSION a échoué seule : elle est INCONNUE (`null`), jamais
 *     « non ». Dire « vous ne pouvez plus » sur une question restée sans
 *     réponse inventerait un refus ; on ouvre, et si la base refuse, elle
 *     le dira à la première écriture (OP020), sans « Réessayer » ;
 *   - liste vide, permission qui n'est pas `false` : on ouvre la saisie ;
 *   - liste vide, permission `false` : 'ferme' ;
 *   - un brouillon au moins : 'trouve' — « Reprendre » toujours, « Nouveau
 *     devis » tant que la permission n'est pas `false`.
 */
export function issueDeFaireUnDevis(resultatListe, resultatPermis) {
  if (!resultatListe || resultatListe.status !== 'fulfilled') return { etat: 'echec' };
  const liste = resultatListe.value || [];
  const nouveauPermis = resultatPermis && resultatPermis.status === 'fulfilled'
    ? resultatPermis.value === true
    : null;
  if (!liste.length) return nouveauPermis === false ? { etat: 'ferme' } : { etat: 'ouvrir' };
  return { etat: 'trouve', liste, nouveauPermis };
}
