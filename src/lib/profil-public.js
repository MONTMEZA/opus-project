/**
 * LA FICHE PUBLIQUE D'UNE PERSONNE — ce que l'écran en montre, et à qui
 * (lot S-d, 30/10/2026).
 *
 * Sur la vraie base, c'est `profil_public()` (section 53.1 de schema.sql)
 * qui décide de la ville : l'écran ne reçoit que ce qu'il a le droit de
 * montrer. Ces fonctions-ci redisent la même règle pour la DÉMONSTRATION,
 * qui n'a pas de base — sans elles, la règle D3 du 25/10 (« la ville d'un
 * particulier, aux artisans connectés seulement ») ne se verrait nulle
 * part sans fichier `.env`. Et elles décident de ce que l'écran affiche
 * autour : les demandes, le bouton « Envoyer un message ».
 *
 * Ce fichier n'importe RIEN : `node` sait l'ouvrir, et `verifier-lectures`
 * le FAIT TOURNER (la leçon de `cloudinary-adresses.js`).
 */

/** Combien de demandes une fiche publique montre, au plus. */
export const DEMANDES_SUR_UNE_FICHE = 20;

/**
 * La ville d'une personne, telle que `regardeur` a le droit de la lire :
 *   - celle d'un PARTICULIER seulement — la ville affichée d'un
 *     professionnel est sur sa fiche d'entreprise, pas sur son compte ;
 *   - à lui-même ;
 *   - à un professionnel, si aucun blocage ne les sépare (`masque`).
 * Sinon `null`. Le code postal, jamais.
 */
export function villeVisible({ personne = null, regardeur = null } = {}) {
  if (!personne || personne.type !== 'particulier') return null;
  const ville = personne.ville || null;
  if (!ville) return null;
  if (!regardeur) return null;
  if (regardeur.id != null && String(regardeur.id) === String(personne.id)) return ville;
  if (regardeur.estPro && !regardeur.masque) return ville;
  return null;
}

/**
 * Les demandes qu'on montre sur la fiche d'un particulier : à un
 * professionnel seulement (ce sont eux qui y répondent ; un particulier
 * n'en lit de toute façon aucune d'un autre), les OUVERTES seulement — une
 * demande pourvue affichée sans son état passait pour en cours —, les plus
 * récentes d'abord, vingt au plus.
 */
export function demandesAMontrer(demandes, { jeSuisPro = false } = {}) {
  if (!jeSuisPro || !Array.isArray(demandes)) return [];
  return demandes
    .filter((d) => d && (d.statut == null || d.statut === 'ouverte'))
    .slice(0, DEMANDES_SUR_UNE_FICHE);
}

/**
 * Le bouton « Envoyer un message » sur la fiche d'un particulier : à un
 * PROFESSIONNEL seulement (décision du 30/10 — la base refuse aussi une
 * conversation entre deux particuliers), et jamais sur sa propre fiche.
 */
export function peutEcrireDepuisLaFiche({ profil = null, monId = null, jeSuisPro = false } = {}) {
  if (!profil || !jeSuisPro) return false;
  if (profil.type && profil.type !== 'particulier') return false;
  if (monId != null && String(monId) === String(profil.id)) return false;
  return true;
}

/**
 * Ce que la fiche dit quand elle n'a aucune demande à montrer. Jamais
 * « cette personne n'a publié aucune demande » : une demande pourvue, ou
 * cachée par un blocage, n'est pas une demande qui n'existe pas.
 */
export const AUCUNE_DEMANDE_A_MONTRER = 'Aucune demande en cours à afficher.';
