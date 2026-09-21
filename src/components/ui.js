/**
 * Briques d'interface réutilisables.
 * Chaque composant correspond à une classe CSS du prototype
 * (le nom de la classe d'origine est rappelé en commentaire).
 */
import React from 'react';
import {
  View, Text, Pressable, TextInput, StyleSheet, useWindowDimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, T, S, R, SH, AVATAR_TONES, gradColors, GRAD_160, GRAD_120 } from '../theme';
import { Check } from './icons';

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

export function Avatar({ seed = 0, size = 40, uri, ring = 0, ringColor = C.surface }) {
  const base = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: AVATAR_TONES[toneIndex(seed)],
  };
  const withRing = ring ? { ...base, borderWidth: ring, borderColor: ringColor } : base;
  if (uri) return <Image source={{ uri }} style={withRing} />;
  return <View style={withRing} />;
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
        <Image source={{ uri }} style={{ height, width: '100%' }} resizeMode="cover" />
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
export function ConfirmBanner({ msg, onClose }) {
  if (!msg) return null;
  return (
    <Pressable style={s.banner} onPress={onClose}>
      <Check size={14} color="#fff" />
      <Text style={s.bannerText}>{msg}</Text>
    </Pressable>
  );
}

/* --- .btn-main / .btn-block --- */
export function BtnMain({ label, onPress, block, disabled, children, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.btnMain, block && s.btnBlock, disabled && { opacity: 0.6 }, style]}
    >
      {children || <Text style={s.btnMainText}>{label}</Text>}
    </Pressable>
  );
}

/* --- .btn-outline / .btn-outline-on --- */
export function BtnOutline({ label, onPress, on }) {
  return (
    <Pressable onPress={onPress} style={[s.btnOutline, on && s.btnOutlineOn]}>
      <Text style={[s.btnOutlineText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/* --- .btn-mini / .btn-mini-outline --- */
export function BtnMini({ label, onPress, outline, disabled, children, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.btnMini, outline && s.btnMiniOutline, disabled && { opacity: 0.6 }, style]}
    >
      {children || <Text style={[s.btnMiniText, outline && { color: C.ink }]}>{label}</Text>}
    </Pressable>
  );
}

/* --- .chip / .chip-on --- */
export function Chip({ label, on, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/* --- .chip-follow / .chip-followed --- */
export function ChipFollow({ following, onPress, video }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chipFollow, video && s.chipFollowVideo, following && !video && s.chipFollowed]}
    >
      <Text style={[s.chipFollowText, following && !video && { color: C.ink }]}>
        {following ? 'Suivi' : 'Suivre'}
      </Text>
    </Pressable>
  );
}

/* --- .icon-btn --- */
export function IconBtn({ onPress, children, style }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[s.iconBtn, style]}>
      {children}
    </Pressable>
  );
}

/* --- .empty-state --- */
export function EmptyState({ children, style }) {
  return <Text style={[s.empty, style]}>{children}</Text>;
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
export function PillToggle({ options, value, onChange, small }) {
  return (
    <View style={s.pill}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[s.pillBtn, small && s.pillBtnSm, on && s.pillBtnOn]}
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
  banner: {
    position: 'absolute', top: 60, alignSelf: 'center', zIndex: 20,
    backgroundColor: C.ink, paddingVertical: S.sm, paddingHorizontal: S.lg,
    borderRadius: R.gelule,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    ...SH.detache,
  },
  bannerText: { color: '#fff', fontSize: T.petit, fontFamily: F.inter },

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
