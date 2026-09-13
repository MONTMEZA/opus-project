/**
 * 10. Navigation basse — le bouton central Publier en orange.
 * (.bottom-nav du prototype)
 *
 * Deux variantes :
 *  - claire, posée sous le contenu (fil classique et tous les autres écrans) ;
 *  - sombre et translucide, flottant par-dessus la vidéo plein écran.
 *
 * Le bouton Publier n'apparaît que pour les professionnels : le fil
 * d'actualité leur est réservé.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { Home, Search, PlusSquare, MessageCircle, User } from './icons';

const TAB_ACCUEIL = { key: 'home', label: 'Accueil', Icon: Home };
const TAB_DECOUVRIR = { key: 'decouvrir', label: 'Découvrir', Icon: Search };
const TAB_PUBLIER = { key: 'creer', label: '', Icon: PlusSquare };
const TAB_MESSAGES = { key: 'messages', label: 'Messages', Icon: MessageCircle };
const TAB_PROFIL = { key: 'profil', label: 'Profil', Icon: User };

export default function BottomNav({ screen, onNavigate, dark, canPublish = true, onLayout }) {
  const insets = useSafeAreaInsets();

  const tabs = canPublish
    ? [TAB_ACCUEIL, TAB_DECOUVRIR, TAB_PUBLIER, TAB_MESSAGES, TAB_PROFIL]
    : [TAB_ACCUEIL, TAB_DECOUVRIR, TAB_MESSAGES, TAB_PROFIL];

  const idle = dark ? 'rgba(255,255,255,0.65)' : C.muted;
  const active = dark ? '#fff' : C.ink;

  return (
    <View
      onLayout={onLayout}
      style={[
        s.nav,
        dark && s.navDark,
        { paddingBottom: 12 + insets.bottom },
      ]}
    >
      {tabs.map(({ key, label, Icon }) => {
        const on = screen === key || (key === 'profil' && screen === 'profilPro');
        return (
          <Pressable key={key} style={s.btn} onPress={() => onNavigate(key)}>
            {key === 'creer' ? (
              <View style={s.publier}><Icon size={18} color="#111" /></View>
            ) : (
              <Icon size={20} color={on ? active : idle} />
            )}
            {!!label && (
              <Text style={[s.label, { color: on ? active : idle }]}>{label}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  nav: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.line,
    paddingTop: 8, paddingHorizontal: 6,
  },
  navDark: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(17,17,17,0.82)', borderTopColor: 'rgba(255,255,255,0.12)',
  },
  btn: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 9.5, fontFamily: F.inter5 },
  publier: { width: 40, height: 30, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
});
