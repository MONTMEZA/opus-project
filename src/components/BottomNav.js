/**
 * 10. Navigation basse. (.bottom-nav du prototype)
 *
 * Le bouton central change de rôle selon qui est connecté — même place,
 * même poids visuel, action principale de chacun :
 *   - professionnel : Publier (orange chantier)
 *   - particulier   : SOS     (rouge brique)
 *
 * Deux variantes d'habillage : claire, ou sombre et translucide quand elle
 * flotte par-dessus la vidéo plein écran.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { Home, Search, PlusSquare, MessageCircle, User } from './icons';

export default function BottomNav({
  screen, onNavigate, dark, canPublish = true, dots = {}, onLayout,
}) {
  const insets = useSafeAreaInsets();

  const centre = canPublish
    ? { key: 'creer', label: '', Icon: PlusSquare }
    : { key: 'sos', label: '', sos: true };

  const tabs = [
    { key: 'home', label: 'Accueil', Icon: Home },
    { key: 'decouvrir', label: 'Découvrir', Icon: Search },
    centre,
    { key: 'messages', label: 'Messages', Icon: MessageCircle },
    { key: 'profil', label: 'Profil', Icon: User },
  ];

  const idle = dark ? 'rgba(255,255,255,0.65)' : C.muted;
  const active = dark ? '#fff' : C.ink;

  return (
    <View
      onLayout={onLayout}
      style={[s.nav, dark && s.navDark, { paddingBottom: 12 + insets.bottom }]}
    >
      {tabs.map(({ key, label, Icon, sos }) => {
        const on = screen === key || (key === 'profil' && screen === 'profilPro');
        return (
          <Pressable key={key} style={s.btn} onPress={() => onNavigate(key)}>
            {sos ? (
              <View style={s.sos}><Text style={s.sosText}>SOS</Text></View>
            ) : key === 'creer' ? (
              <View style={s.publier}><Icon size={18} color="#111" /></View>
            ) : (
              <View>
                <Icon size={20} color={on ? active : idle} />
                {dots[key] && <View style={s.dot} />}
              </View>
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
  sos: { width: 44, height: 30, backgroundColor: C.sos, alignItems: 'center', justifyContent: 'center' },
  sosText: { fontFamily: F.oswald7, fontSize: 13, color: '#fff', letterSpacing: 0.5 },

  /* le « voyant » : un point orange quand de nouvelles demandes arrivent */
  dot: {
    position: 'absolute', top: -2, right: -4,
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent,
  },
});
