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
import { C, F, AVATAR_TONES, gradColors, GRAD_160, GRAD_120 } from '../theme';
import { Check } from './icons';

/* --- dégradé (remplace les linear-gradient CSS) --- */
export function Gradient({ media, angle = 160, style, children }) {
  const dir = angle === 120 ? GRAD_120 : GRAD_160;
  return (
    <LinearGradient colors={gradColors(media)} start={dir.start} end={dir.end} style={style}>
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
            <Text style={[s.pillText, small && { fontSize: 10.5 }, on && { color: '#fff' }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute', top: 60, alignSelf: 'center', zIndex: 20,
    backgroundColor: C.ink, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  bannerText: { color: '#fff', fontSize: 11.5, fontFamily: F.inter },

  btnMain: {
    backgroundColor: C.ink, paddingVertical: 9, paddingHorizontal: 18,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  btnBlock: { width: '100%', marginTop: 8 },
  btnMainText: { fontFamily: F.oswald6, fontSize: 12.5, color: '#fff' },

  btnOutline: {
    paddingVertical: 9, paddingHorizontal: 18, borderWidth: 1.5, borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineOn: { backgroundColor: C.ink },
  btnOutlineText: { fontFamily: F.oswald6, fontSize: 12.5, color: C.ink },

  btnMini: {
    backgroundColor: C.accent, paddingVertical: 7, paddingHorizontal: 11,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5,
  },
  btnMiniOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.ink },
  btnMiniText: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },

  chip: {
    paddingVertical: 6, paddingHorizontal: 11,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { fontFamily: F.oswald, fontSize: 11, color: C.ink },

  chipFollow: { paddingVertical: 5, paddingHorizontal: 10, backgroundColor: C.ink },
  chipFollowed: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  chipFollowVideo: { backgroundColor: 'rgba(255,255,255,0.2)' },
  chipFollowText: { fontFamily: F.oswald6, fontSize: 10.5, color: '#fff' },

  iconBtn: { padding: 4, position: 'relative' },

  empty: {
    fontSize: 12.5, color: C.muted, textAlign: 'center',
    paddingVertical: 30, paddingHorizontal: 20, lineHeight: 19, fontFamily: F.inter,
  },

  sectionLabel: {
    paddingTop: 14, paddingHorizontal: 16, paddingBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionLabelText: { fontFamily: F.oswald6, fontSize: 12.5, color: C.ink },

  field: {
    borderWidth: 1, borderColor: C.line, paddingVertical: 9, paddingHorizontal: 10,
    fontSize: 12, fontFamily: F.inter, backgroundColor: C.surface, color: C.ink,
  },
  textarea: {
    width: '100%', minHeight: 70, borderWidth: 1, borderColor: C.line, padding: 10,
    fontFamily: F.inter, fontSize: 12.5, marginBottom: 10,
    backgroundColor: C.surface, color: C.ink,
  },

  pill: { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 20, padding: 3, alignSelf: 'flex-start' },
  pillBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  pillBtnSm: { paddingVertical: 5, paddingHorizontal: 11 },
  pillBtnOn: { backgroundColor: C.ink },
  pillText: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted },
});

export const uiStyles = s;
