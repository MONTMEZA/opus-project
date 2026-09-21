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
  sos: '#B4432B',      // rouge brique des urgences (même valeur que `bad`)
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


/**
 * Style de l'en-tête de profil. Deux partis pris, changeables d'un mot :
 *
 *   'classique' — bannière de 170 px, photo centrée qui enjambe la bande de
 *                 chantier, puis tout le reste sur le fond béton.
 *
 *   'immersif'  — grande image en haut, avec seulement la photo, le nom, le
 *                 métier et la ville posés dessus. Les statistiques, les
 *                 boutons et surtout le bloc « informations vérifiées »
 *                 restent sur le fond béton, où ils gardent leur autorité.
 */
export const STYLE_ENTETE = 'immersif';


/* ==========================================================================
 *  LES FONDATIONS — ce qui manquait, et pourquoi ça se voyait
 * ==========================================================================
 *
 * Un relevé sur tout `src/` a donné : 20 tailles de police différentes pour
 * 247 usages, 24 valeurs d'espacement (dont 97 sur des nombres impairs : 1,
 * 3, 5, 7, 9, 11), 14 rayons de bordure, et 5 opacités d'ombre utilisées
 * chacune UNE seule fois.
 *
 * Aucune de ces valeurs n'est fausse toute seule. C'est leur nombre qui pose
 * problème : deux écrans voisins ne s'alignent jamais tout à fait, et l'œil
 * lit ça comme « pas fini » sans savoir dire pourquoi.
 *
 * Ces échelles ne remplacent rien de force. Les fichiers migrent au fur et à
 * mesure : une valeur en dur qui traîne encore continue de marcher.
 */

/**
 * LES TAILLES DE TEXTE.
 *
 * Huit crans au lieu de vingt. L'écart entre deux crans est assez grand pour
 * qu'on voie la différence — c'est ce qui crée la hiérarchie. Entre 12,5 et
 * 12,8 (deux valeurs réellement présentes dans le code), personne ne voit
 * rien : on a deux tailles pour le prix d'une seule information.
 */
export const T = {
  micro: 10,      // étiquettes posées sur une image, mentions
  petit: 11,      // libellés de boutons, métadonnées sous un nom
  courant: 12,    // texte d'interface, contenu des champs
  corps: 13,      // le texte qu'on lit vraiment : descriptions, messages
  sousTitre: 15,
  titre: 18,
  grandTitre: 24,
  heros: 34,      // le grand chiffre d'un tableau de bord
};

/**
 * L'INTERLIGNE, déduit de la taille.
 *
 * 1,45 fois la taille pour un paragraphe : c'est l'aération qui rend un bloc
 * de texte lisible sur un téléphone tenu à bout de bras, en plein soleil.
 * On arrondit au pair pour rester sur la grille.
 */
export function interligne(taille) {
  return Math.round((taille * 1.45) / 2) * 2;
}

/**
 * LES ESPACEMENTS — une grille de 4 px.
 *
 * Tout écart entre deux éléments est un multiple de 4. Les valeurs impaires
 * (5, 7, 9, 11) qui traînent dans le code sont des réglages faits à l'œil,
 * un écran à la fois : elles ne s'accordent avec rien.
 */
export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * LES RAYONS — et la règle qui décide lequel.
 *
 * L'identité d'Opus tient aux angles vifs : l'équerre, le plan, le chantier.
 * Mais tout arrondir n'est pas la seule alternative à tout garder carré. La
 * règle tenue ici est celle-ci, et elle vaut partout :
 *
 *   ANGLE VIF   = la STRUCTURE, ce qui porte l'information.
 *                 Cartes, champs de saisie, blocs, sections, bandeaux.
 *
 *   ARRONDI     = ce qui FLOTTE au-dessus et sur quoi on appuie.
 *                 Boutons, puces de filtre, pastilles, barre du bas.
 *
 * Ce n'est pas un compromis mou : c'est ce qui rend l'interface lisible au
 * doigt. Un bord arrondi dit « je suis détaché du fond, appuie sur moi » ;
 * un bord vif dit « je suis le fond, lis-moi ». Les avatars restent ronds,
 * comme avant.
 */
export const R = {
  vif: 0,        // la structure — la valeur par défaut, toujours
  doux: 8,       // une surface qui flotte : menu, feuille, bulle
  gelule: 999,   // un bouton, une puce : arrondi complet
};

/** Un cercle parfait pour une pastille ou un avatar de `taille` px. */
export function rond(taille) {
  return taille / 2;
}

/**
 * LES OMBRES — trois niveaux, pas davantage.
 *
 * Une ombre ne décore pas : elle dit à quelle hauteur se trouve un élément.
 * Cinq opacités différentes utilisées une fois chacune, c'est cinq hauteurs
 * que personne ne peut distinguer. Trois suffisent, et se reconnaissent.
 *
 * `elevation` est la version Android de la même idée : les deux sont données
 * ensemble, sinon l'ombre n'existe que sur iPhone.
 */
export const SH = {
  /** Posé sur le fond : une carte qu'on veut juste décoller un peu. */
  pose: {
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  /** Flottant : un menu, une puce qui passe par-dessus le contenu. */
  flottant: {
    shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  /** Détaché : ce qui recouvre l'écran — bandeau de confirmation, modale. */
  detache: {
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
};
