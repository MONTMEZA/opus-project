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
  'carrelage-grand-format': require('../../assets/demo/carrelage-grand-format.jpg'),
  'carrelage-pose': require('../../assets/demo/carrelage-pose.jpg'),
  'chantier-ferraillage': require('../../assets/demo/chantier-ferraillage.jpg'),
  'chantier-fondations': require('../../assets/demo/chantier-fondations.jpg'),
  'chantier-terrassement': require('../../assets/demo/chantier-terrassement.jpg'),
  'charpente-traditionnelle': require('../../assets/demo/charpente-traditionnelle.jpg'),
  'chauffage-chaudiere': require('../../assets/demo/chauffage-chaudiere.jpg'),
  'chauffage-radiateur': require('../../assets/demo/chauffage-radiateur.jpg'),
  'demande-fissure': require('../../assets/demo/demande-fissure.jpg'),
  'demande-salle-de-bain': require('../../assets/demo/demande-salle-de-bain.jpg'),
  'electricite-tableau': require('../../assets/demo/electricite-tableau.jpg'),
  'electricite-testeur': require('../../assets/demo/electricite-testeur.jpg'),
  'macon-coffrage': require('../../assets/demo/macon-coffrage.jpg'),
  'macon-mur-pierre': require('../../assets/demo/macon-mur-pierre.jpg'),
  'macon-parpaings': require('../../assets/demo/macon-parpaings.jpg'),
  'peinture-mur': require('../../assets/demo/peinture-mur.jpg'),
  'plomberie-cuivre': require('../../assets/demo/plomberie-cuivre.jpg'),
  'serrurerie-porte': require('../../assets/demo/serrurerie-porte.jpg'),
  'toiture-ancienne': require('../../assets/demo/toiture-ancienne.jpg'),
  'toiture-chevrons': require('../../assets/demo/toiture-chevrons.jpg'),
  'toiture-ecran-liteaux': require('../../assets/demo/toiture-ecran-liteaux.jpg'),
  'toiture-tuiles-posees': require('../../assets/demo/toiture-tuiles-posees.jpg'),
};

/** La photo d'une clé « demo:… », ou `null` pour tout le reste. */
export function photoDemo(media) {
  if (typeof media !== 'string' || !media.startsWith('demo:')) return null;
  return PHOTOS_DEMO[media.slice(5)] || null;
}
