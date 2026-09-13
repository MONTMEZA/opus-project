/**
 * 10. Navigation basse — 5 icônes, le bouton central Publier en orange.
 * (.bottom-nav du prototype)
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { Home, Search, PlusSquare, MessageCircle, User } from './icons';

const TABS = [
  { key: 'home', label: 'Accueil', Icon: Home },
  { key: 'decouvrir', label: 'Découvrir', Icon: Search },
  { key: 'creer', label: '', Icon: PlusSquare },
  { key: 'messages', label: 'Messages', Icon: MessageCircle },
  { key: 'profil', label: 'Profil', Icon: User },
];

export default function BottomNav({ screen, onNavigate }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.nav, { paddingBottom: 12 + insets.bottom }]}>
      {TABS.map(({ key, label, Icon }) => {
        const active = screen === key || (key === 'profil' && screen === 'profilPro');
        return (
          <Pressable key={key} style={s.btn} onPress={() => onNavigate(key)}>
            {key === 'creer' ? (
              <View style={s.publier}><Icon size={18} color="#111" /></View>
            ) : (
              <Icon size={20} color={active ? C.ink : C.muted} />
            )}
            {!!label && <Text style={[s.label, active && { color: C.ink }]}>{label}</Text>}
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
  btn: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 9.5, color: C.muted, fontFamily: F.inter5 },
  publier: { width: 40, height: 30, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
});
