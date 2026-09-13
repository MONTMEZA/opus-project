/**
 * Identité visuelle Opus-Project.
 * Les valeurs sont reprises telles quelles du prototype (opus-project.jsx).
 * Ne pas les réinterpréter : toute couleur de l'app doit venir d'ici.
 */

export const C = {
  ink: '#1A1B19',      // texte principal, quasi noir
  bg: '#E7E4DC',       // fond général, béton clair
  surface: '#FFFFFF',  // fond des cartes
  line: '#CFC9BB',     // bordures
  accent: '#E85C1F',   // orange chantier, CTA principaux
  accent2: '#1B4B6B',  // bleu acier, liens secondaires
  muted: '#726E63',    // texte secondaire

  // Couleurs de service (reprises du CSS du prototype)
  verif: '#4FA9E0',    // pastille "vérifié"
  ok: '#1F7A4D',       // information vérifiée valide
  okBg: '#E7F3EC',     // fond du badge "Client vérifié"
  bad: '#B4432B',      // information manquante / erreur
  dark: '#111111',     // fond du fil vidéo
};

/** Familles de polices chargées dans App.js */
export const F = {
  oswald: 'Oswald_500Medium',
  oswald6: 'Oswald_600SemiBold',
  oswald7: 'Oswald_700Bold',
  inter: 'Inter_400Regular',
  inter5: 'Inter_500Medium',
  inter6: 'Inter_600SemiBold',
};

/** Les avatars du prototype : 4 tons béton choisis à partir d'un identifiant. */
export const AVATAR_TONES = ['#c9c4b8', '#b5a99a', '#9fb3ad', '#c2ab9a'];

/**
 * Le prototype stocke les dégradés sous la forme "#3a3a38,#8a8578"
 * (utilisée ensuite dans un linear-gradient(160deg, ...)).
 * En React Native on a besoin d'un tableau de couleurs.
 */
export function gradColors(media) {
  if (!media) return [C.ink, C.muted];
  if (Array.isArray(media)) return media;
  const parts = String(media).split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length >= 2 ? parts : [parts[0] || C.ink, parts[0] || C.muted];
}

/**
 * linear-gradient(160deg, ...) converti en points start/end pour expo-linear-gradient.
 * 160° en CSS = vers le bas, légèrement vers la droite.
 */
export const GRAD_160 = { start: { x: 0.33, y: 0.03 }, end: { x: 0.67, y: 0.97 } };
/** linear-gradient(120deg, ...) pour la bannière de profil. */
export const GRAD_120 = { start: { x: 0.07, y: 0.25 }, end: { x: 0.93, y: 0.75 } };
