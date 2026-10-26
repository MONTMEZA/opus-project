/**
 * « EST-CE MA PUBLICATION ? » — une seule réponse, pour toutes les cartes.
 *
 * Décidé par le propriétaire le 26/10/2026 : sur SA propre publication, un
 * artisan ne voit plus « Suivre » ni « Contacter ». Se suivre soi-même et
 * s'écrire à soi-même n'ont pas de sens, et le bouton qu'on touche pour rien
 * fait croire que l'application est cassée. Relevé au tournage des vidéos
 * de présentation : le compte filmé est l'auteur de la première
 * publication du fil, et il s'y proposait de se contacter.
 *
 * POURQUOI UN FICHIER À PART, qui n'importe rien : la leçon de
 * `cloudinary-adresses.js` — un calcul rangé dans un écran ne peut pas être
 * FAIT TOURNER par un contrôle (`node` ne sait pas ouvrir React Native).
 * `verifier-fil` appelle ces deux fonctions sur les cas qui comptent.
 *
 * LE PIÈGE, et c'est toute la raison d'être de `maFiche()` : l'identité du
 * compte n'est pas la même chose en démonstration et sur la vraie base.
 *   - sur la VRAIE base, une fiche pro porte l'identifiant de son compte
 *     (un compte = une entreprise) : ma fiche est celle de `userId` ;
 *   - en DÉMONSTRATION, `userId` vaut 'demo-user', qui n'est la clé
 *     d'aucune fiche : le compte de démonstration est la PREMIÈRE fiche,
 *     comme pour `myProId` dans `OpusApp`.
 * Et la règle de CLAUDE.md : « chez un particulier, `myProId` n'est pas
 * personne, c'est le premier artisan chargé ». Un particulier n'a donc
 * AUCUNE fiche ici, sinon il perdrait « Suivre » et « Contacter » sur les
 * publications du premier artisan de la liste.
 *
 * Et sur la vraie base, si ma fiche n'est pas (encore) dans la liste, on
 * rend `null` plutôt que la première venue : au pire, « Suivre » reste
 * affiché sur ma publication — ce qui n'abîme rien ; le contraire le
 * retirerait sur celles d'un AUTRE artisan, qui n'aurait plus de clients
 * pour le contacter.
 */

/**
 * L'identifiant de MA fiche professionnelle, ou `null`.
 * @param {{ userType: string|null, pros: object, userId: any, mode: string }} etat
 */
export function maFiche({ userType, pros, userId, mode } = {}) {
  if (userType !== 'pro') return null;
  const fiches = pros || {};
  if (userId != null && fiches[userId]) return String(userId);
  if (mode === 'demo') {
    const premiere = Object.keys(fiches)[0];
    return premiere === undefined ? null : String(premiere);
  }
  return null;
}

/**
 * Vrai si la publication est la mienne. `String(…)` des DEUX côtés : en
 * démonstration les publications portent un identifiant NUMÉRIQUE et
 * `Object.keys` rend une chaîne — le piège des chantiers du 06/10.
 * Une publicité n'a pas d'auteur : elle n'est jamais « la mienne ».
 */
export function estMienne(post, ficheId) {
  if (!ficheId || !post || post.proId === undefined || post.proId === null) return false;
  return String(post.proId) === String(ficheId);
}
