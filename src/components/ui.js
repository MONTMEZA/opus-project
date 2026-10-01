/**
 * Briques d'interface réutilisables.
 * Chaque composant correspond à une classe CSS du prototype
 * (le nom de la classe d'origine est rappelé en commentaire).
 */
import React from 'react';
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
  C, F, T, S, R, SH, M, APPUI, AVATAR_TONES, gradColors, GRAD_160, GRAD_120,
  interligne,
} from '../theme';
import { Check, AlertTriangle, WifiOff } from './icons';

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

export function Avatar({
  seed = 0, size = 40, uri, ring = 0, ringColor = C.surface, nom,
}) {
  const base = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: AVATAR_TONES[toneIndex(seed)],
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
  return <View style={withRing} {...acces} />;
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
  if (!msg) return null;
  return (
    <Animated.View
      entering={FadeInUp.duration(M.courant)}
      exiting={FadeOutUp.duration(M.bref)}
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
export function BtnMain({
  label, onPress, block, disabled, children, style, accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      aria-disabled={!!disabled}
      style={({ pressed }) => [
        s.btnMain, block && s.btnBlock, disabled && { opacity: 0.6 }, style,
        pressed && !disabled && APPUI.plein,
      ]}
    >
      {children || <Text style={s.btnMainText}>{label}</Text>}
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
      hitSlop={S.sm}
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
      hitSlop={S.sm}
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
      hitSlop={S.sm}
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
      hitSlop={8}
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
export function Field({ style, ...props }) {
  return (
    <TextInput
      placeholderTextColor={C.muted}
      style={[s.field, style]}
      {...props}
    />
  );
}

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
            accessibilityLabel={o.label}
            aria-selected={on}
            hitSlop={S.xs}
            style={({ pressed }) => [
              s.pillBtn, small && s.pillBtnSm, on && s.pillBtnOn,
              pressed && !on && APPUI.discret,
            ]}
          >
            <Text style={[s.pillText, small && { fontSize: T.micro }, on && { color: '#fff' }]}>
              {o.label}
            </Text>
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

  btnMain: {
    backgroundColor: C.ink, paddingVertical: 10, paddingHorizontal: S.xl,
    borderRadius: R.gelule,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  btnBlock: { width: '100%', marginTop: S.sm },
  btnMainText: { fontFamily: F.oswald6, fontSize: T.courant, color: '#fff' },

  btnOutline: {
    paddingVertical: 10, paddingHorizontal: S.xl, borderWidth: 1.5, borderColor: C.ink,
    borderRadius: R.gelule,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineOn: { backgroundColor: C.ink },
  btnOutlineText: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },

  btnMini: {
    backgroundColor: C.accent, paddingVertical: S.sm, paddingHorizontal: S.md,
    borderRadius: R.gelule,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5,
  },
  btnMiniOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.ink },
  btnMiniText: { fontFamily: F.oswald6, fontSize: T.petit, color: '#111' },

  chip: {
    paddingVertical: 6, paddingHorizontal: S.md,
    borderRadius: R.gelule,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontFamily: F.oswald, fontSize: T.petit, color: C.ink },

  chipFollow: {
    paddingVertical: 5, paddingHorizontal: S.md,
    borderRadius: R.gelule, backgroundColor: C.ink,
  },
  chipFollowed: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  chipFollowVideo: { backgroundColor: 'rgba(255,255,255,0.2)' },
  chipFollowText: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },

  iconBtn: { padding: S.xs, position: 'relative' },

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
  field: {
    borderWidth: 1, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 10,
    fontSize: T.courant, fontFamily: F.inter, backgroundColor: C.surface, color: C.ink,
  },
  textarea: {
    width: '100%', minHeight: 70, borderWidth: 1, borderColor: C.line, padding: 10,
    fontFamily: F.inter, fontSize: T.corps, marginBottom: 10,
    backgroundColor: C.surface, color: C.ink,
  },

  pill: {
    flexDirection: 'row', backgroundColor: C.bg, borderRadius: R.gelule,
    padding: 3, alignSelf: 'flex-start',
  },
  pillBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: R.gelule },
  pillBtnSm: { paddingVertical: 5, paddingHorizontal: S.md },
  pillBtnOn: { backgroundColor: C.ink },
  pillText: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },
});

export const uiStyles = s;
