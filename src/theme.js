/**
 * Identité visuelle Opus-Project.
 * Les valeurs sont reprises telles quelles du prototype (opus-project.jsx).
 * Ne pas les réinterpréter : toute couleur de l'app doit venir d'ici.
 */

export const C = {
  ink: '#1A1B19',      // texte principal, quasi noir
  bg: '#E7E4DC',       // fond général, béton clair
  surface: '#FFFFFF',  // fond des cartes
  line: '#CFC9BB',     // bordures et séparateurs — décoratifs
  accent: '#E85C1F',   // orange chantier, CTA principaux
  accent2: '#1B4B6B',  // bleu acier, liens secondaires
  /* LE GRIS DU TEXTE SECONDAIRE A ÉTÉ FONCÉ, le 02/10/2026, de #726E63 à
     #6A665C. Mesuré : sur le fond beige, l'ancien donnait 4,01 : 1 de
     contraste, sous le seuil de 4,5 — autrement dit illisible en plein
     soleil, et les artisans travaillent dehors. Le nouveau donne 4,51.
     L'écart est de quatre pour cent de luminosité : invisible à l'œil,
     décisif à la mesure. Ce n'est pas une réinterprétation de l'identité,
     c'est une correction de lisibilité. */
  muted: '#6A665C',    // texte secondaire

  // Couleurs de service (reprises du CSS du prototype)
  /* LA BORDURE D'UN CHAMP N'EST PAS UN SÉPARATEUR : elle dit OÙ APPUYER.
     `line` (#CFC9BB) donnait 1,65 : 1 sur blanc — on ne voyait pas où
     étaient les champs dehors. Celle-ci donne 3,03 sur le fond et 3,85 sur
     blanc, le seuil des éléments d'interface étant de 3. Les cartes et les
     séparateurs gardent `line` : eux n'ont rien à faire viser. */
  bordChamp: '#8D8164',

  /* L'ORANGE QUAND IL EST DU TEXTE, et pas une surface.
     #E85C1F est la signature d'Opus : il ne bouge pas. Mais en TEXTE sur
     blanc il donne 3,51 : 1, et 2,76 sur le fond beige — illisible dehors.
     Celui-ci est le MÊME ton (18° de teinte, à l'identique), assombri juste
     assez : 5,74 sur blanc, 4,52 sur le fond.
     La règle : `accent` pour ce qu'on REMPLIT (boutons, pastilles, barres,
     icônes), `accentTexte` pour ce qu'on LIT. */
  accentTexte: '#B14212',

  /* CE QU'ON POSE SUR L'ORANGE — mesuré le 02/10/2026.
     Le blanc sur #E85C1F donne 3,51 : 1. C'est sous le seuil de 4,5, et
     ça se voit : le label d'un bouton orange se lit moins bien que celui
     d'un bouton noir, alors que c'est le bouton orange qui compte.
     Le presque-noir, lui, donne 4,92 : 1.

     ATTENTION, la règle ne se généralise PAS. Sur les autres
     remplissages, le noir serait un recul, et de loin :

         remplissage            blanc      noir
         accent  (#E85C1F)      3,51       4,92   → noir
         sos/bad (#B4432B)      5,56       3,11   → blanc
         accent2 (#1B4B6B)      9,27       1,86   → blanc
         ink     (#1A1B19)     17,29       1,00   → blanc

     D'où un jeton par couple, et non une règle « tout en noir ». */
  surAccent: '#1A1B19',

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

/* ==========================================================================
   LE MOUVEMENT — la quatrième échelle, et la raison pour laquelle elle existe
   --------------------------------------------------------------------------
   Relevé fait le 01/10/2026 sur tout `src/` : `react-native-reanimated` est
   installé (4.5.1) et n'était importé que dans DEUX fichiers sur
   soixante-treize. Zéro `entering=`, zéro `exiting=`, zéro `layout=`, zéro
   `LayoutAnimation`. Et surtout, le mot `pressed` n'apparaissait NULLE
   PART : sur 106 zones appuyables, aucune ne montrait qu'on l'avait
   touchée.

   C'est ce qui fait dire « ça ne réagit pas », même quand tout marche :
   l'écran ne change qu'une fois l'action terminée, donc le doigt doute
   pendant tout le temps du traitement.

   Les deux fichiers qui bougeaient déjà — `GlissementLateral.js` et
   `GestionMedias.js` — avaient chacun écrit SON ressort, et ils ne sont
   pas les mêmes (230 et 190 de raideur). C'est exactement la dérive que
   `T`, `S`, `R` et `SH` ont corrigée ailleurs : une échelle, trois crans,
   et plus personne n'invente.

   CE QU'IL NE FAUT PAS ANIMER — à lire avant d'en poser une seule
   ---------------------------------------------------------------
   Le projet a déjà payé ce défaut une fois : dix éléments montés d'un coup
   bloquaient l'écran plusieurs secondes sur l'iPhone (voir `initialNumToRender`
   dans CLAUDE.md). Une animation sur le chemin du premier rendu coûte du
   temps de calcul au pire moment.

     1. Jamais d'`entering` dans un `renderItem` de liste. Le fil, le fil
        vidéo et le sélecteur de métiers montent déjà le minimum : animer
        chaque arrivée annulerait ce réglage.
     2. Jamais d'animation sur un écran tant qu'il charge. On anime ce qui
        est prêt, pas ce qui attend.
     3. Jamais d'`exiting` sur un élément qui peut être démonté en masse
        (une liste qu'on filtre) : chaque sortie garde son nœud vivant le
        temps de l'animation.
   ========================================================================== */

/** Trois durées, en millisecondes. Au-delà de 320 ms, on attend. */
export const M = {
  bref: 120,      // un retour immédiat : un bouton, une pastille, un cran
  courant: 220,   // ce qui entre ou sort : un bandeau, une feuille, un écran
  ample: 320,     // un mouvement qu'on doit suivre des yeux
};

/** Le ressort du retour en place — celui de `GlissementLateral`. */
export const RESSORT = { damping: 20, stiffness: 230, mass: 0.6 };

/** Un peu plus mou : ce qu'on porte au doigt (une photo qu'on déplace). */
export const RESSORT_PORTE = { damping: 20, stiffness: 190, mass: 0.6 };

/**
 * CE QU'ON VOIT QUAND LE DOIGT EST POSÉ.
 *
 * `plein` sert à ce qui a une forme propre — un bouton, une puce : il
 * s'enfonce légèrement. 0,97 se voit sans donner l'impression que le bouton
 * recule.
 *
 * `discret` sert à ce qui n'a pas de forme — une icône seule, une ligne de
 * liste, une carte entière : une échelle n'y serait pas lisible, seule
 * l'opacité l'est.
 */
export const APPUI = {
  plein: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  discret: { opacity: 0.55 },
};

/* ==========================================================================
   VISER AVEC UN DOIGT — et avec un doigt ganté
   --------------------------------------------------------------------------
   Relevé au navigateur le 02/10/2026, sur cinq écrans, en mesurant la boîte
   RÉELLE de chaque zone appuyable : **70 cibles sur 71 sous 44 points**, la
   plus petite à 14.

   44, ce n'est pas un goût : c'est la mesure d'Apple, tirée de la taille
   d'un doigt. Et les utilisateurs d'Opus ne travaillent pas assis à un
   bureau — un maçon en gants n'a plus un doigt de 7 mm mais une surface
   molle de 15 mm qui ne sent pas où elle appuie. À 25 points, la puce
   « Suivre » se rate une fois sur deux ; à 14, le petit drapeau de
   signalement ne s'atteint jamais.

   DEUX FAÇONS D'Y ARRIVER, ET ELLES NE SE VALENT PAS
   -------------------------------------------------
     1. **Agrandir la BOÎTE** avec du remplissage. L'icône garde sa taille,
        c'est la zone autour qui grandit. C'est la bonne solution : elle se
        voit, elle se mesure, et elle vaut aussi à la souris.
     2. **`hitSlop`**, qui élargit la zone de touche SANS changer la mise en
        page. Indispensable quand la boîte ne peut pas grandir — mais
        `react-native-web` l'ignore, donc ça ne se vérifie PAS au
        navigateur. Seul l'iPhone le dira.

   On préfère donc (1) partout où la mise en page le supporte, et on ne
   garde (2) que pour ce qui est vraiment à l'étroit.
   ========================================================================== */

/** Le minimum qu'un pouce atteint. Mesure d'Apple, pas une préférence. */
export const TOUCHE = 44;

/**
 * De combien élargir la zone de touche d'un élément haut de `hauteur`
 * points pour atteindre les 44. Rend 0 quand il n'y a rien à faire.
 *
 *     <Pressable hitSlop={viser(24)} …>   // 10 de chaque côté
 */
export function viser(hauteur) {
  return Math.max(0, Math.ceil((TOUCHE - hauteur) / 2));
}


/* ==========================================================================
 *  CE QU'ON POSE SUR UNE COULEUR — et pourquoi ça se calcule
 * ==========================================================================
 *
 * Les étiquettes d'Opus tirent leur couleur de leurs DONNÉES, pas d'une
 * feuille de style : le type d'une annonce (`TYPES_ANNONCE`), le degré
 * d'urgence d'une demande (`URGENCES`), l'origine d'une demande reçue. Le
 * texte posé dessus, lui, était écrit en dur — `'#fff'`, partout, par
 * habitude.
 *
 * Mesuré le 02/10/2026 : le blanc tenait sur le bleu (9,27 : 1) et sur le
 * rouge brique (5,56), mais pas sur l'orange de signature — 3,51, sous le
 * seuil de 4,5. Et l'orange est précisément la couleur des étiquettes qui
 * comptent : « Je cherche », « Urgent », « Demande de rappel ».
 *
 * `surFond()` tranche par le CALCUL, pas par l'œil. Conséquence utile : le
 * jour où une couleur est ajoutée au catalogue des annonces, son étiquette
 * est lisible sans que personne n'y pense.
 */

/** Luminance relative WCAG — la même formule que `verifier-cibles.mjs`. */
function luminance(hex) {
  const h = String(hex).replace('#', '');
  if (h.length !== 6) return 0;
  const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]);
}

/** Le rapport de contraste entre deux couleurs, de 1 à 21. */
export function contraste(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * LA COULEUR DU TEXTE À POSER SUR `fond` : celle des deux qui se lit le
 * mieux. Pas de demi-mesure — un gris « qui va avec » perdrait sur les
 * deux tableaux.
 *
 * On ne rend pas du blanc pur mais `C.surface`, et pas du noir pur mais
 * `C.surAccent` : ce sont les deux encres de l'application.
 */
export function surFond(fond) {
  if (!fond) return C.surface;
  return contraste(C.surAccent, fond) >= contraste(C.surface, fond)
    ? C.surAccent
    : C.surface;
}
