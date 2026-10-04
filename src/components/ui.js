/**
 * Briques d'interface réutilisables.
 * Chaque composant correspond à une classe CSS du prototype
 * (le nom de la classe d'origine est rappelé en commentaire).
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, useWindowDimensions,
} from 'react-native';
/* expo-image et non celui de React Native : cache disque, et pas de
   clignotement blanc au chargement. Un avatar revient sur presque chaque
   écran — sans cache, il est retéléchargé à chaque fois. */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
/* Import EN HAUT, comme tout le reste : `await import()` est interdit dans
   `src/` et `npm run verifier-imports` le refuse. */
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import {
  C, F, T, S, R, SH, M, APPUI, TOUCHE, viser, AVATAR_TONES,
  gradColors, GRAD_160, GRAD_120, interligne, surFond,
} from '../theme';
import { Check, AlertTriangle, WifiOff, Eye, EyeOff } from './icons';
import { useMouvementReduit } from '../lib/retour';

/* --- dégradé (remplace les linear-gradient CSS) --- */
export function Gradient({ media, angle = 160, style, children }) {
  const dir = angle === 120 ? GRAD_120 : GRAD_160;
  return (
    <LinearGradient
      colors={gradColors(media)}
      start={dir.start}
      end={dir.end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

/* --- .hazard-strip : la bande diagonale façon ruban de chantier --- */
export function HazardStrip({ height = 5, dark = C.ink }) {
  const { width } = useWindowDimensions();
  const step = 20;
  const bars = Math.ceil(width / step) + 2;
  return (
    <View style={{ height, backgroundColor: dark, overflow: 'hidden' }}>
      {Array.from({ length: bars }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: i * step - step,
            top: -height,
            width: 10,
            height: height * 3,
            backgroundColor: C.accent,
            transform: [{ skewX: '-45deg' }],
          }}
        />
      ))}
    </View>
  );
}

/* --- .avatar ---
   `uri` : la vraie photo de profil quand elle existe.
   `ring` : l'anneau blanc autour de l'avatar sur les pages profil.
   Sans photo, on retombe sur une pastille de couleur, comme le prototype. */
function toneIndex(seed) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h % AVATAR_TONES.length;
}

/**
 * LES INITIALES — et pourquoi l'application en était pleine de trous.
 *
 * Relevé le 02/10/2026 : sur SEIZE avatars posés dans l'application,
 * **quinze ne recevaient pas le nom** de la personne. Et même avec le nom,
 * l'avatar sans photo n'affichait rien du tout : une pastille beige vide.
 *
 * Or la plupart des comptes n'ont pas encore de photo. Un fil entier de
 * ronds beiges, ça ne ressemble pas à une application qui démarre : ça
 * ressemble à une application cassée. Deux lettres suffisent à transformer
 * un trou en quelqu'un.
 *
 * L'encre se calcule (`surFond`) : les quatre tons béton sont clairs, donc
 * c'est le presque-noir qui tombe — mais on ne l'écrit pas en dur, sans
 * quoi un ton ajouté un jour donnerait des initiales illisibles.
 */
export function initialesDe(nom) {
  const mots = String(nom || '')
    .replace(/[^\p{L}\p{N}\s'’-]/gu, ' ')
    .split(/[\s'’-]+/)
    .filter(Boolean);
  if (mots.length === 0) return '';
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

export function Avatar({
  seed = 0, size = 40, uri, ring = 0, ringColor = C.surface, nom,
}) {
  const fond = AVATAR_TONES[toneIndex(seed)];
  const base = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: fond,
  };
  const withRing = ring ? { ...base, borderWidth: ring, borderColor: ringColor } : base;
  /* Le nom est presque toujours écrit juste à côté : annoncer la photo en
     plus ferait entendre deux fois la même chose. On ne l'annonce donc que
     si l'appelant donne un nom, et on l'efface sinon. */
  const acces = nom
    ? { accessible: true, accessibilityRole: 'image', accessibilityLabel: `Photo de ${nom}` }
    : { accessible: false, importantForAccessibility: 'no' };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={withRing}
        contentFit="cover"
        cachePolicy="memory-disk"
        {...acces}
      />
    );
  }

  const initiales = initialesDe(nom);
  return (
    <View style={[withRing, { alignItems: 'center', justifyContent: 'center' }]} {...acces}>
      {!!initiales && (
        <Text
          style={{
            fontFamily: F.oswald6,
            /* 38 % du diamètre : la proportion tient de 24 px à 96 px. */
            fontSize: Math.round(size * 0.38),
            color: surFond(fond),
            letterSpacing: 0.5,
          }}
        >
          {initiales}
        </Text>
      )}
    </View>
  );
}

/**
 * L'AVATAR QUI PORTE « SUIVRE » — le choix du propriétaire, 02/10/2026.
 *
 * Avant, « Suivre » était une pastille noire pleine posée dans l'en-tête
 * d'une publication. Deux conséquences, les deux mesurées :
 *
 *   1. elle mangeait la largeur, et **deux cartes sur trois avaient leur
 *      ligne « métier · ville » coupée** — « Maçon · Marseille (13) »
 *      devenait « Maçon · Marseille … » ;
 *   2. elle était la chose la plus voyante de la carte. Un bouton pesait
 *      plus lourd que le travail de l'artisan.
 *
 * Le « + » posé sur la photo rend TOUTE la largeur au texte.
 *
 * CE QUE ÇA COÛTE, ET IL FAUT LE SAVOIR : un « + » est moins explicite
 * qu'un mot écrit. Trois précautions, donc :
 *   - il est ORANGE PLEIN, pas discret : on doit le voir au premier
 *     coup d'œil ;
 *   - il porte une étiquette lue à voix haute (« Suivre <nom> ») ;
 *   - **le mot « Suivre » reste écrit en toutes lettres sur la fiche de
 *     l'artisan** (`ChipFollow`). C'est là qu'on apprend le geste.
 *
 * Et un arbitrage assumé : la zone de visée du « + » recouvre le quart
 * inférieur droit de la photo. Appuyer là suit donc le « + » et non la
 * photo — mais ouvrir la fiche reste possible par le nom, juste à côté,
 * qui est une cible bien plus grande.
 */
export function AvatarSuivre({
  seed, uri, nom, size = 40, suivi, onSuivre, onVoir,
}) {
  const d = Math.round(size * 0.55);

  /* UN BOUTON NE SE MET PAS DANS UN BOUTON, et le navigateur l'a dit tout
     de suite : « button cannot be a descendant of button ». La photo était
     posée dans le bloc appuyable qui ouvre la fiche, et le « + » est un
     bouton à son tour. Sur le web c'est un avertissement ; pour un lecteur
     d'écran, c'est une cible qui en contient une autre, et on ne sait plus
     laquelle on actionne.
     D'où DEUX boutons VOISINS dans un conteneur qui, lui, n'en est pas
     un : la photo ouvre la fiche, la pastille suit. */
  const photo = onVoir ? (
    <Pressable
      onPress={onVoir}
      accessibilityRole="button"
      accessibilityLabel={`Voir la fiche de ${nom || 'cet artisan'}`}
      style={({ pressed }) => [pressed && APPUI.discret]}
    >
      <Avatar seed={seed} uri={uri} nom={nom} size={size} />
    </Pressable>
  ) : (
    <Avatar seed={seed} uri={uri} nom={nom} size={size} />
  );

  /* Pas de pastille du tout quand il n'y a rien à suivre (sa propre
     publication) : un bouton sans effet est pire qu'un bouton absent. */
  if (!onSuivre) return <View style={{ width: size, height: size }}>{photo}</View>;

  return (
    <View style={{ width: size, height: size }}>
      {photo}
      <Pressable
        onPress={onSuivre}
        hitSlop={viser(d)}
        accessibilityRole="button"
        accessibilityLabel={suivi ? `Ne plus suivre ${nom || 'cet artisan'}` : `Suivre ${nom || 'cet artisan'}`}
        aria-selected={!!suivi}
        style={({ pressed }) => [
          s.suivreBadge,
          { width: d, height: d, borderRadius: d / 2, right: -2, bottom: -2 },
          suivi && s.suivreBadgeOn,
          pressed && APPUI.plein,
        ]}
      >
        {/* L'encre se calcule : le « + » est posé sur l'ORANGE, où le blanc
            ne donnerait que 3,51 : 1 — et sur le presque-noir une fois
            suivi, où c'est l'inverse. Deux fonds, donc jamais de couleur
            écrite en dur. */}
        <Text
          style={[
            s.suivreBadgeTexte,
            { fontSize: Math.round(d * 0.62), color: surFond(suivi ? C.ink : C.accent) },
          ]}
        >
          {suivi ? '✓' : '+'}
        </Text>
      </Pressable>
    </View>
  );
}

/* --- bannière de profil ---
   Trois cas, dans l'ordre : une vraie photo envoyée par le professionnel,
   un dégradé venu de son portfolio (les réalisations de démonstration en
   sont), ou à défaut le dégradé bleu acier du prototype. */
export function ProfileBanner({ uri, height = 140, children }) {
  const estPhoto = typeof uri === 'string' && /^(https?:|file:|data:|content:|blob:)/.test(uri);
  const estDegrade = typeof uri === 'string' && !estPhoto && uri.includes(',');

  if (estPhoto) {
    return (
      <View style={{ height, width: '100%' }}>
        <Image
          source={{ uri }}
          style={{ height, width: '100%' }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
        {children}
      </View>
    );
  }

  return (
    <Gradient
      media={estDegrade ? uri : '#1B4B6B,#3a3a38'}
      angle={120}
      style={{ height, width: '100%' }}
    >
      {children}
    </Gradient>
  );
}

/* --- .confirm-banner --- */
/**
 * Le bandeau du haut — confirmation OU erreur.
 *
 * Il affichait une COCHE VERTE sur tous les messages, y compris
 * « Enregistrement impossible : … ». Un échec annoncé par une coche se lit
 * comme une réussite, et le vrai motif — qui suit les deux-points — passait
 * inaperçu. Constaté le 29/09/2026 : le propriétaire a vu « enregistrement
 * impossible » sans pouvoir lire la suite.
 *
 * Une erreur est donc ROUGE, avec un triangle, et elle tient sur autant de
 * lignes qu'il faut : le motif est souvent la seule chose utile.
 */
/* C'est le SEUL canal par lequel l'application répond — une trentaine
   d'appels à `showBanner` y passent. Il apparaissait et disparaissait d'un
   coup sec, au point qu'on pouvait le rater entièrement. Il glisse
   désormais depuis le haut, d'où il vient.
   `exiting` est sans danger ici : il n'y en a qu'un seul à l'écran, jamais
   une liste qu'on filtre (voir les trois interdits dans `theme.js`). */
/**
 * UN PIÈGE À NE PAS REDÉCOUVRIR, payé le 01/10/2026.
 *
 * Un `Animated.createAnimatedComponent(Pressable)` n'accepte PAS la forme
 * fonction du style — `style={({ pressed }) => […]}`. Elle est silencieusement
 * ignorée : aucune erreur, aucun avertissement, et le composant se retrouve
 * SANS AUCUN STYLE.
 *
 * Constaté en coupant le réseau : le bandeau d'erreur affichait son texte
 * blanc sur le fond beige de l'application, donc illisible — alors que
 * c'est le seul canal par lequel l'application parle. Un bandeau d'erreur
 * invisible est pire que pas de bandeau du tout.
 *
 * L'état pressé passe donc par une vue INTÉRIEURE, qui, elle, est un
 * `Pressable` ordinaire. L'animation reste dehors.
 */
export function ConfirmBanner({ msg, erreur, onClose }) {
  /* « Réduire les animations » n'est pas un goût : ce réglage existe pour
     les personnes que le mouvement rend malades. Le bandeau apparaît alors
     sans glisser — il apparaît quand même, c'est le mouvement qu'on retire,
     pas l'information. */
  const sansMouvement = useMouvementReduit();
  if (!msg) return null;
  return (
    <Animated.View
      entering={sansMouvement ? undefined : FadeInUp.duration(M.courant)}
      exiting={sansMouvement ? undefined : FadeOutUp.duration(M.bref)}
      style={s.bannerPort}
      pointerEvents="box-none"
    >
      <Pressable
        style={({ pressed }) => [s.banner, erreur && s.bannerErreur, pressed && APPUI.discret]}
        onPress={onClose}
        accessibilityRole="alert"
        accessibilityLabel={`${erreur ? 'Erreur' : 'Confirmation'} : ${msg}. Touchez pour fermer.`}
        accessibilityLiveRegion="polite"
      >
        {erreur ? <AlertTriangle size={15} color="#fff" /> : <Check size={14} color="#fff" />}
        <Text style={s.bannerText}>{msg}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ==========================================================================
   L'ACCESSIBILITÉ, ET POURQUOI ELLE COMMENCE ICI
   --------------------------------------------------------------------------
   Un relevé sur `src/` n'avait trouvé AUCUN `accessibilityLabel` dans tout
   le projet. Conséquence concrète, sur un chantier : un artisan qui
   travaille avec des lunettes, qui agrandit les caractères de son iPhone ou
   qui se sert de VoiceOver entendait « bouton » — sans savoir lequel.

   Le pire cas n'est pas le texte, c'est l'ICÔNE SEULE : un cœur, une
   flèche, trois points. Sans étiquette, elle ne dit rigoureusement rien.

   Trois règles tenues partout :

   1. L'étiquette dit ce que le bouton FAIT, pas ce qu'il montre.
      « J'aime cette publication », pas « cœur ».
   2. L'ÉTAT ne se met pas dans l'étiquette. Il se met dans un attribut
      `aria-selected` / `aria-disabled` / `aria-expanded` : un lecteur
      d'écran annonce « sélectionné » lui-même, dans la langue du
      téléphone. Écrire « J'aime (activé) » dans l'étiquette ferait dire
      deux fois la même chose, et pas dans la bonne langue.

      Pourquoi la forme `aria-*` plutôt que `accessibilityState` : React
      Native comprend les deux, mais la version WEB ne traduit pas
      `accessibilityState`. Avec `aria-*`, l'état se relève au navigateur —
      donc il se vérifie, au lieu d'être supposé.
   3. Les boutons de ce fichier déduisent leur étiquette de leur `label`.
      On n'écrit donc rien de plus dans les écrans, SAUF quand le bouton
      n'a pas de texte — et c'est justement là que ça compte.
   ========================================================================== */

/* --- la bande « mode démonstration » --- */
/**
 * CE BANDEAU EXISTE À CAUSE D'UNE PANNE PRÉCISE.
 *
 * Sans fichier `.env`, `src/lib/api.js` remplace CHAQUE écriture par rien.
 * L'application répond alors « Votre publication est en ligne » — et rien
 * n'est enregistré nulle part. C'est la première règle de CLAUDE.md, et
 * c'est elle qui a laissé passer le format `montage` refusé par la base
 * pendant plusieurs jours : les essais ne voyaient rien.
 *
 * `api.mode` valait `'demo'` depuis le début, et n'était LU nulle part —
 * calculé, puis oublié. Il est désormais à l'écran, en permanence, avec la
 * bande de chantier : impossible de confondre une réussite avec un
 * simulacre.
 *
 * Elle n'apparaît QUE dans ce mode. Un propriétaire relié à sa base ne la
 * voit jamais.
 */
export function BandeDemo({ visible }) {
  if (!visible) return null;
  return (
    <View
      style={s.demo}
      accessibilityRole="alert"
      accessibilityLabel="Mode démonstration : rien n’est enregistré dans la base de données."
    >
      <HazardStrip height={4} />
      <Text style={s.demoTexte}>
        MODE DÉMONSTRATION — rien n’est enregistré
      </Text>
    </View>
  );
}

/* --- la bande « pas de connexion » --- */
/**
 * CE QUI MANQUAIT : une porte de sortie.
 *
 * Quand le chargement échouait, trois `catch` posaient des listes VIDES —
 * `setAnnonces([])`, `setDemandes([])`. L'écran affichait donc « Aucune
 * annonce » : une panne de réseau devenait, mot pour mot, « il n'y a
 * rien ». L'utilisateur n'avait aucun moyen de savoir laquelle des deux
 * c'était, ni rien à toucher pour réessayer.
 *
 * Cette bande dit lequel des deux, et donne le bouton. Elle est posée EN
 * HAUT DU CONTENU, pas en flottant : ce n'est pas un message passager,
 * c'est un état.
 */
export function BandeHorsLigne({ raison, onReessayer, enCours }) {
  if (!raison) return null;
  const reseau = raison === 'reseau';
  return (
    <View style={s.horsLigne} accessibilityRole="alert">
      <WifiOff size={14} color={C.bad} />
      <Text style={s.horsLigneTexte}>
        {reseau
          ? 'Pas de connexion. Ce qui est affiché date de votre dernière visite.'
          : 'Le chargement a échoué. Ce qui est affiché peut être incomplet.'}
      </Text>
      {!!onReessayer && (
        <BtnMini
          outline
          label={enCours ? 'Essai…' : 'Réessayer'}
          disabled={enCours}
          onPress={onReessayer}
        />
      )}
    </View>
  );
}

/* --- .btn-main / .btn-block --- */
/**
 * LES TROIS NIVEAUX D'ACTION — et pourquoi il a fallu les écrire.
 *
 * `theme.js` dit depuis le premier jour :
 *
 *     accent: '#E85C1F',   // orange chantier, CTA principaux
 *
 * …et les VINGT-TROIS gros boutons de l'application étaient noirs. Le code
 * contredisait l'identité qu'il prétendait tenir. Le propriétaire l'a dit
 * autrement le 02/10/2026 : « les gros boutons tout noirs font des taches,
 * les boutons orange ou bleu sortent mieux ».
 *
 * Il avait raison, mais la correction n'est pas « tout en orange » : si
 * tout crie, plus rien ne ressort — c'est exactement le défaut qu'on
 * corrige, avec une autre couleur. D'où trois niveaux, et un seul orange
 * par écran :
 *
 *   `principal` (orange) — CE QUE L'ÉCRAN ATTEND DE VOUS. Un par écran.
 *       Publier, Contacter, Créer mon compte, Envoyer ma demande.
 *
 *   `sombre` (presque-noir) — une action solide mais SECONDAIRE : elle
 *       ouvre autre chose, ou elle appartient à une section et non à
 *       l'écran. C'est aussi le ton des publicités : le bouton d'un
 *       annonceur ne doit PAS porter la couleur des actions d'Opus, sans
 *       quoi on ne distingue plus ce qui vient de l'application de ce qui
 *       vient de quelqu'un qui a payé.
 *
 *   `danger` (rouge brique) — ce qui détruit. Supprimer son compte.
 *
 * L'encre se CALCULE à partir du fond (`surFond`) : noir sur l'orange,
 * blanc sur les deux autres. Écrite en dur, elle serait fausse une fois
 * sur trois — mesuré au lot 5.
 */
const FOND_ACTION = { principal: C.accent, sombre: C.ink, danger: C.bad };

export function BtnMain({
  label, onPress, block, disabled, children, style, accessibilityLabel,
  ton = 'principal',
}) {
  const fond = FOND_ACTION[ton] || C.accent;
  const encre = surFond(fond);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      aria-disabled={!!disabled}
      style={({ pressed }) => [
        s.btnMain, { backgroundColor: fond },
        block && s.btnBlock, disabled && { opacity: 0.6 }, style,
        pressed && !disabled && APPUI.plein,
      ]}
    >
      {children || <Text style={[s.btnMainText, { color: encre }]}>{label}</Text>}
    </Pressable>
  );
}

/* --- .btn-outline / .btn-outline-on --- */
export function BtnOutline({ label, onPress, on, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      aria-selected={!!on}
      style={({ pressed }) => [s.btnOutline, on && s.btnOutlineOn, pressed && APPUI.plein]}
    >
      <Text style={[s.btnOutlineText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/* --- .btn-mini / .btn-mini-outline --- */
export function BtnMini({
  label, onPress, outline, disabled, children, style, accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      aria-disabled={!!disabled}
      hitSlop={viser(40)}
      style={({ pressed }) => [
        s.btnMini, outline && s.btnMiniOutline, disabled && { opacity: 0.6 }, style,
        pressed && !disabled && APPUI.plein,
      ]}
    >
      {children || <Text style={[s.btnMiniText, outline && { color: C.ink }]}>{label}</Text>}
    </Pressable>
  );
}

/* --- .chip / .chip-on --- */
export function Chip({ label, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filtrer sur ${label}`}
      aria-selected={!!on}
      hitSlop={viser(40)}
      style={({ pressed }) => [s.chip, on && s.chipOn, pressed && APPUI.plein]}
    >
      <Text style={[s.chipText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/* --- .chip-follow / .chip-followed --- */
export function ChipFollow({ following, onPress, video }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={following ? 'Ne plus suivre' : 'Suivre ce professionnel'}
      aria-selected={!!following}
      hitSlop={viser(40)}
      style={({ pressed }) => [
        s.chipFollow, video && s.chipFollowVideo,
        following && !video && s.chipFollowed, pressed && APPUI.plein,
      ]}
    >
      <Text style={[s.chipFollowText, following && !video && { color: C.ink }]}>
        {following ? 'Suivi' : 'Suivre'}
      </Text>
    </Pressable>
  );
}

/* --- .icon-btn --- */
/**
 * Un bouton qui ne porte QU'UNE ICÔNE.
 *
 * `accessibilityLabel` n'est pas facultatif ici : sans lui, un lecteur
 * d'écran annonce « bouton » et rien d'autre. Il est donc réclamé, et un
 * oubli laisse une trace dans les journaux plutôt que de passer inaperçu.
 */
export function IconBtn({ onPress, children, style, accessibilityLabel }) {
  if (__DEV__ && !accessibilityLabel) {
    console.warn('IconBtn sans accessibilityLabel : ce bouton n’a aucun texte, '
      + 'il sera annoncé « bouton » et rien de plus.');
  }
  return (
    <Pressable
      onPress={onPress}
      hitSlop={viser(44)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [s.iconBtn, style, pressed && APPUI.discret]}
    >
      {children}
    </Pressable>
  );
}

/* --- .empty-state --- */
/**
 * Ce qu'on voit quand il n'y a rien.
 *
 * C'ÉTAIT UNE SEULE LIGNE DE TEXTE GRIS, quatorze fois dans l'application.
 * Un écran vide n'est pourtant pas une information : c'est une question.
 * « Aucune demande » ne dit ni pourquoi, ni ce qu'on peut y faire, ni si
 * c'est normal.
 *
 * La signature reste compatible — `<EmptyState>du texte</EmptyState>`
 * continue de marcher partout — et s'enrichit : une icône, un titre, et
 * surtout une ACTION quand il y en a une à proposer. Un écran vide qui
 * porte un bouton cesse d'être un cul-de-sac.
 */
export function EmptyState({ icone: Icone, titre, children, action, style }) {
  if (!Icone && !titre && !action) {
    return <Text style={[s.empty, style]}>{children}</Text>;
  }
  return (
    <View style={[s.videBloc, style]}>
      {!!Icone && <Icone size={26} color={C.line} />}
      {!!titre && <Text style={s.videTitre}>{titre}</Text>}
      {!!children && <Text style={s.empty}>{children}</Text>}
      {!!action && (
        <BtnOutline label={action.label} onPress={action.onPress} />
      )}
    </View>
  );
}

/* --- .portfolio-label --- */
export function SectionLabel({ children, right, style }) {
  return (
    <View style={[s.sectionLabel, style]}>
      <Text style={s.sectionLabelText}>{children}</Text>
      {right}
    </View>
  );
}

/* --- .create-input / .create-select (champ texte) --- */
/* `forwardRef` : c'est par là que « Suivant » sur le clavier atteint le
   champ d'après. Sans elle, la référence s'arrête sur le composant et
   `.focus()` ne fait rien. */
export const Field = React.forwardRef(function Field({ style, ...props }, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={C.muted}
      style={[s.field, style]}
      {...props}
    />
  );
});

/* --- .create-textarea --- */
export function TextArea({ style, ...props }) {
  return (
    <TextInput
      multiline
      textAlignVertical="top"
      placeholderTextColor={C.muted}
      style={[s.textarea, style]}
      {...props}
    />
  );
}

/* --- un champ de mot de passe --- */
/**
 * LE MOT DE PASSE SE TAPE À L'AVEUGLE, ET L'IPHONE NE SAIT MÊME PAS QU'IL
 * EN EXISTE UN.
 *
 * Deux défauts en un, relevés le 02/10/2026 :
 *
 *   - **aucun œil pour vérifier.** Sur un téléphone, au soleil, avec des
 *     mains sales, on se trompe. Sans moyen de relire, on recommence —
 *     et au bout de deux fois on renonce à créer son compte.
 *   - **aucune indication au système.** Sans `textContentType`, iOS ne
 *     propose ni le trousseau, ni « mot de passe fort », ni le
 *     remplissage automatique. L'artisan tape donc son mot de passe à la
 *     main à chaque connexion.
 *
 * `autoComplete` est la propriété de React Native, `textContentType` celle
 * d'iOS : les deux sont nécessaires, elles ne font pas le même travail.
 */
export const ChampMotDePasse = React.forwardRef(function ChampMotDePasse(
  { nouveau = false, style, ...reste }, ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={s.motDePasse}>
      <Field
        ref={ref}
        {...reste}
        style={[{ flex: 1, borderWidth: 0, minHeight: TOUCHE - 2 }, style]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={nouveau ? 'new-password' : 'current-password'}
        textContentType={nouveau ? 'newPassword' : 'password'}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={viser(TOUCHE)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        style={({ pressed }) => [s.oeil, pressed && APPUI.discret]}
      >
        {visible ? <EyeOff size={16} color={C.muted} /> : <Eye size={16} color={C.muted} />}
      </Pressable>
    </View>
  );
});

/* --- .pill-toggle --- */
/**
 * Le sélecteur d'onglets — « Fil / Vidéos », « Pour moi / Place des pros /
 * Demandes ».
 *
 * C'EST LE BOUTON LE PLUS TOUCHÉ DE L'APPLICATION, et il était le seul à
 * n'avoir ni état pressé, ni rôle, ni étiquette : un lecteur d'écran
 * annonçait « bouton » sans dire lequel, ni lequel était choisi. Relevé le
 * 01/10/2026, corrigé ici parce que c'est une brique partagée — la réparer
 * une fois les répare toutes.
 *
 * L'état va dans `aria-selected`, jamais dans l'étiquette : un lecteur
 * d'écran annonce « sélectionné » lui-même, dans la langue du téléphone.
 *
 * UN POINT QUI DIT « IL Y A QUELQUE CHOSE » DOIT DIRE OÙ
 * ------------------------------------------------------
 * Relevé par le propriétaire le 04/10/2026 : « on voit un point orange sur
 * Découvrir, ça veut dire qu'il y a quelque chose à aller voir, c'est
 * parfait. Après on clique sur Découvrir et là on a trois choix — Pour moi,
 * Place des pros, Demandes — mais le point ne s'affiche pas, donc on ne
 * sait pas ce qui doit être vu. »
 *
 * C'est le défaut qui tue un voyant : il promet, on ouvre, et il faut
 * fouiller les trois onglets. Au bout de trois fois, on cesse de le
 * regarder — exactement ce qui était arrivé à la cloche des notifications.
 *
 * > **Un voyant se RELAIE jusqu'à ce qu'on voie la chose.** Le point de la
 * > barre du bas dit « quelque part ici », celui de l'onglet dit « là ».
 * > Chaque niveau rétrécit la recherche ; le dernier la termine.
 *
 * `o.dot` est donc une option de chaque onglet, pas un réglage du
 * composant : c'est l'appelant qui sait ce qui est neuf.
 */
export function PillToggle({ options, value, onChange, small }) {
  return (
    <View style={s.pill}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            /* LE POINT EST UNE INFORMATION, PAS UNE DÉCORATION. Sans ce
               mot dans l'étiquette, VoiceOver annonce « Pour moi » que
               l'onglet ait du neuf ou non — la même règle que la barre
               du bas. */
            accessibilityLabel={o.label + (o.dot ? ', nouveautés' : '')}
            aria-selected={on}
            hitSlop={viser(38)}
            style={({ pressed }) => [
              s.pillBtn, small && s.pillBtnSm, on && s.pillBtnOn,
              pressed && !on && APPUI.discret,
            ]}
          >
            <View style={s.pillContenu}>
              <Text style={[s.pillText, small && { fontSize: T.micro }, on && { color: '#fff' }]}>
                {o.label}
              </Text>
              {/* LA COULEUR DU POINT DÉPEND DU FOND, et c'est mesuré.
                  Le fond de la barre d'onglets est clair (`C.bg`) : l'orange
                  de signature n'y donne que 2,76 : 1, sous le seuil de 3
                  exigé d'un élément graphique — un point de 7 px qu'on ne
                  distingue pas ne sert à rien. `C.accentTexte` y donne
                  4,52. Sur l'onglet CHOISI, dont le fond est presque noir,
                  c'est l'inverse : 3,01 contre 4,92. On prend donc l'encre
                  qui va avec le fond, exactement comme le reste du projet. */}
              {!!o.dot && <View style={[s.pillDot, on && s.pillDotOn]} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------------------------
 *  LA RÈGLE DES BORDS, appliquée ici une fois pour toutes
 *
 *  Angle vif  = la STRUCTURE : champ de saisie, bloc, section, carte.
 *  Arrondi    = ce sur quoi on APPUIE : bouton, puce, pastille, bandeau.
 *
 *  L'identité d'Opus ne tient pas à ce que TOUT soit carré, elle tient à ce
 *  que le contenu le soit. Un bouton en gélule se distingue immédiatement du
 *  fond qu'il surplombe — c'est de la lisibilité au doigt, pas une mode.
 *  La règle complète est écrite dans src/theme.js.
 * ------------------------------------------------------------------------ */
const s = StyleSheet.create({
  /* La bande PORTE une information : angle vif, et elle est collée en haut
     du contenu plutôt que flottante — on ne doit pas pouvoir la rater ni la
     confondre avec un message passager. */
  demo: { backgroundColor: C.ink },
  /* Rouge brique sur fond clair : lisible, et ce n'est pas une alerte
     rouge vif qui ferait croire à une catastrophe. */
  horsLigne: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: '#F6E7E3',   // le rouge brique, très éclairci
    borderBottomWidth: 1, borderBottomColor: C.line,
    paddingVertical: S.sm, paddingHorizontal: S.lg,
  },
  horsLigneTexte: {
    flex: 1, fontFamily: F.inter5, fontSize: T.petit, color: C.bad,
    lineHeight: interligne(T.petit),
  },
  demoTexte: {
    fontFamily: F.oswald6, fontSize: T.micro, color: C.bg,
    letterSpacing: 1, textAlign: 'center',
    paddingVertical: 3,
  },

  videBloc: {
    alignItems: 'center', gap: S.sm,
    paddingVertical: S.xxl, paddingHorizontal: S.xl,
  },
  videTitre: {
    fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink,
    textAlign: 'center', letterSpacing: 0.3,
  },

  /* Le positionnement passe sur l'enveloppe ANIMÉE ; la bulle, elle, garde
     sa forme. Les deux séparées, parce qu'un composant animé ne sait pas
     prendre un style en forme de fonction (voir le commentaire de
     ConfirmBanner). */
  bannerPort: {
    position: 'absolute', top: 60, left: 0, right: 0, zIndex: 20,
    alignItems: 'center',
  },
  banner: {
    backgroundColor: C.ink, paddingVertical: S.sm, paddingHorizontal: S.lg,
    borderRadius: R.gelule,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    ...SH.detache,
  },
  /* Rouge, et non plus noir : on doit voir AVANT de lire que c'est un
     échec. Et une largeur bornée, pour que le motif tienne sur plusieurs
     lignes au lieu d'être coupé. */
  bannerErreur: { backgroundColor: C.bad, maxWidth: '88%' },
  bannerText: { flexShrink: 1, color: '#fff', fontSize: T.petit, fontFamily: F.inter },

  /* `minHeight: TOUCHE` partout où la mise en page le supporte : c'est la
     BOÎTE qui grandit, pas le texte. Relevé du 02/10/2026 : 70 cibles sur
     71 étaient sous les 44 points, la plus petite à 14. */
  /* Sans `backgroundColor` : c'est `ton` qui le pose (voir BtnMain). */
  btnMain: {
    paddingVertical: 10, paddingHorizontal: S.xl,
    borderRadius: R.gelule, minHeight: TOUCHE,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  btnBlock: { width: '100%', marginTop: S.sm },
  btnMainText: { fontFamily: F.oswald6, fontSize: T.courant },

  btnOutline: {
    paddingVertical: 10, paddingHorizontal: S.xl, borderWidth: 1.5, borderColor: C.ink,
    borderRadius: R.gelule, minHeight: TOUCHE,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineOn: { backgroundColor: C.ink },
  btnOutlineText: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },

  /* Un « mini » reste visuellement petit — il vit dans des cartes denses —
     mais sa boîte atteint 36, et `hitSlop` finit le travail. */
  btnMini: {
    backgroundColor: C.accent, paddingVertical: S.sm, paddingHorizontal: S.md,
    borderRadius: R.gelule, minHeight: 36,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5,
  },
  btnMiniOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.ink },
  btnMiniText: { fontFamily: F.oswald6, fontSize: T.petit, color: C.surAccent },

  chip: {
    paddingVertical: 6, paddingHorizontal: S.md,
    borderRadius: R.gelule, minHeight: 40, justifyContent: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontFamily: F.oswald, fontSize: T.petit, color: C.ink },

  /* La pastille « Suivre » posée sur la photo. Bordure de la couleur du
     fond : c'est ce qui la détache de la photo quelle qu'elle soit. */
  suivreBadge: {
    position: 'absolute',
    backgroundColor: C.accent,
    borderWidth: 2, borderColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  /* Suivi : on ne garde qu'une confirmation discrète. Elle reste
     appuyable — se désabonner doit rester possible depuis le fil. */
  suivreBadgeOn: { backgroundColor: C.ink },
  suivreBadgeTexte: {
    fontFamily: F.oswald7,
    /* La croix d'Oswald tombe un cheveu bas dans son cadre. */
    marginTop: -1,
  },

  chipFollow: {
    paddingVertical: 5, paddingHorizontal: S.md,
    borderRadius: R.gelule, backgroundColor: C.ink,
    minHeight: 40, justifyContent: 'center',
  },
  chipFollowed: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  chipFollowVideo: { backgroundColor: 'rgba(255,255,255,0.2)' },
  chipFollowText: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },

  /* Un bouton-icône : l'icône fait 15 px, la boîte 44. C'est le
     remplissage qui change, pas le dessin. */
  /* 44 de HAUT, 40 de large. La hauteur est ce que vise le pouce ; la
     largeur, elle, se dispute avec le nom de l'artisan dans l'en-tête
     d'une publication — et un nom coupé est une information perdue. */
  iconBtn: {
    padding: S.xs, position: 'relative',
    minWidth: 40, minHeight: TOUCHE,
    alignItems: 'center', justifyContent: 'center',
  },

  empty: {
    fontSize: T.corps, color: C.muted, textAlign: 'center',
    paddingVertical: 30, paddingHorizontal: 20, lineHeight: 19, fontFamily: F.inter,
  },

  sectionLabel: {
    paddingTop: 14, paddingHorizontal: S.lg, paddingBottom: S.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionLabelText: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },

  /* Les champs gardent leurs angles vifs : c'est de la structure, ils
     portent ce que l'artisan écrit. Les arrondir les ferait ressembler à
     des boutons, et on chercherait où appuyer. */
  /* Le champ et l'œil dans un seul cadre : la bordure est portée par
     l'enveloppe, sinon on verrait deux rectangles. */
  motDePasse: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.bordChamp, backgroundColor: C.surface,
    minHeight: TOUCHE,
  },
  oeil: {
    width: TOUCHE, minHeight: TOUCHE,
    alignItems: 'center', justifyContent: 'center',
  },

  field: {
    borderWidth: 1, borderColor: C.bordChamp, paddingVertical: 10, paddingHorizontal: 10,
    minHeight: TOUCHE,
    fontSize: T.courant, fontFamily: F.inter, backgroundColor: C.surface, color: C.ink,
  },
  textarea: {
    width: '100%', minHeight: 70, borderWidth: 1, borderColor: C.bordChamp, padding: 10,
    fontFamily: F.inter, fontSize: T.corps, marginBottom: 10,
    backgroundColor: C.surface, color: C.ink,
  },

  pill: {
    flexDirection: 'row', backgroundColor: C.bg, borderRadius: R.gelule,
    padding: 3, alignSelf: 'flex-start',
  },
  pillBtn: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: R.gelule,
    minHeight: 38, justifyContent: 'center',
  },
  pillBtnSm: { paddingVertical: 5, paddingHorizontal: S.md, minHeight: 38, justifyContent: 'center' },
  pillBtnOn: { backgroundColor: C.ink },
  pillText: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },
  /* Le point est POSÉ À CÔTÉ du mot, pas en exposant sur le coin : la
     gélule est étroite, et un point débordant serait rogné par le fond de
     la barre d'onglets. */
  pillContenu: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  pillDot: {
    width: 7, height: 7, borderRadius: R.gelule, backgroundColor: C.accentTexte,
  },
  pillDotOn: { backgroundColor: C.accent },
});

export const uiStyles = s;
