/**
 * RETIRER SON AVIS — ce que l'écran décide (lot S-c, 30/10/2026).
 *
 * Un avis ne se modifie plus (décision du propriétaire du 29/10) : on le
 * retire, puis on en écrit un autre. Deux choses peuvent mentir sans bruit,
 * et la relecture du 30/10 les a remises à la main au vert :
 *
 *   - un retrait qui ne touche AUCUNE ligne (l'avis n'est plus là, ou la
 *     règle de la base a changé) annoncé comme fait ;
 *   - la phrase de confirmation, qui dit ce qu'un avis peut et ne peut pas.
 *
 * La décision et la phrase vivent donc ici, dans un fichier qui n'importe
 * rien : `verifier-legal` les FAIT TOURNER et les compare mot pour mot.
 */

/** Le retrait n'a touché aucune ligne. */
export const AVIS_DEJA_PARTI = 'Cet avis n’est plus là : il a sans doute été retiré depuis un '
  + 'autre appareil. Rechargez la fiche.';

/** La confirmation, sous « Retirer mon avis ». Elle dit la règle des CGU. */
export const CONFIRMATION_RETRAIT_AVIS = 'Retirer votre avis ? Il disparaît de la fiche et la '
  + 'note se recalcule. Un avis ne se modifie pas une fois publié : vous pourrez ensuite en '
  + 'écrire un autre.';

/**
 * L'issue d'un `delete … select('id')` sur `reviews` : `true` si UNE ligne
 * est partie, sinon une erreur. Jamais un succès sur zéro ligne — un tableau
 * vide est « vrai » en JavaScript, et c'est exactement le piège.
 */
export function issueDuRetrait(reponse) {
  const { data, error } = reponse || {};
  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) throw new Error(AVIS_DEJA_PARTI);
  return true;
}
