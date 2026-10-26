/**
 * LES PHOTOS DE LA DÉMONSTRATION — 26/10/2026.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Le mode démonstration (aucun fichier `.env`) montrait des DÉGRADÉS de
 * couleur à la place des photos : « #3a3a38,#8a8578 ». Le propriétaire a
 * demandé de vraies photos, libres de droits, parce que ces écrans servent
 * aussi aux vidéos de publicité.
 *
 * Les données de démonstration (`demo.js`) les désignent par une CLÉ —
 * « demo:chantier-fondations » —, jamais par un `require` : `demo.js` est
 * ouvert par `node` dans plusieurs contrôles, et `node` ne sait pas charger
 * une image. Ce fichier-ci, lui, ne sert qu'à l'application.
 *
 * LA LICENCE EST UNE RÈGLE : uniquement CC0 ou domaine public (aucune
 * condition, pas même l'attribution, et rien qui interdise une publicité),
 * sans personne reconnaissable ni marque lisible. Chaque photo, sa source et
 * sa licence sont dans `assets/demo/LICENCES.md`, et `verifier-demo` refuse
 * une clé sans fichier, un fichier sans licence notée, ou une photo trop
 * lourde : elles sont DANS l'application, même quand elle tourne sur la
 * vraie base.
 */
export const PHOTOS_DEMO = {
};

/** La photo d'une clé « demo:… », ou `null` pour tout le reste. */
export function photoDemo(media) {
  if (typeof media !== 'string' || !media.startsWith('demo:')) return null;
  return PHOTOS_DEMO[media.slice(5)] || null;
}
