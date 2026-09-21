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
 *
 * L'ONGLET PROFIL PORTE LA VRAIE PHOTO
 * ------------------------------------
 * Une icône de bonhomme générique ne dit pas à qui appartient le compte.
 * Sa propre photo, si : on la reconnaît sans lire, et l'onglet devient le
 * seul endroit de l'écran qui parle de soi. C'est ce que font Instagram et
 * l'application montrée en référence, et c'est plus qu'un détail esthétique —
 * sur un réseau professionnel, cette photo rappelle en permanence que ce
 * qu'on publie est signé.
 *
 * Sans photo envoyée, on retombe sur l'icône : une pastille de couleur vide
 * ne voudrait rien dire du tout.
 *
 * LES ARRONDIS, ET LA RÈGLE QUI LES DÉCIDE
 * ----------------------------------------
 * Le bandeau lui-même garde ses angles vifs : c'est de la structure, il
 * porte la ligne de séparation du contenu. Les deux boutons d'action —
 * Publier, SOS — sont en gélule : on appuie dessus, ils flottent au-dessus
 * du reste. Voir la règle complète dans src/theme.js.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, T, S, R } from '../theme';
import { Avatar } from './ui';
import { Home, Search, PlusSquare, MessageCircle, User } from './icons';

/** Taille de la photo dans l'onglet : celle d'une icône, anneau compris. */
const PHOTO = 22;

export default function BottomNav({
  screen, onNavigate, dark, canPublish = true, dots = {}, onLayout,
  avatarUrl = null, avatarSeed = 0,
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
      style={[s.nav, dark && s.navDark, { paddingBottom: S.md + insets.bottom }]}
    >
      {tabs.map(({ key, label, Icon, sos }) => {
        const on = screen === key || (key === 'profil' && screen === 'profilPro');
        return (
          <Pressable key={key} style={s.btn} onPress={() => onNavigate(key)}>
            {sos ? (
              <View style={s.sos}><Text style={s.sosText}>SOS</Text></View>
            ) : key === 'creer' ? (
              <View style={s.publier}><Icon size={18} color="#111" /></View>
            ) : key === 'profil' && avatarUrl ? (
              /* L'anneau marque l'onglet actif exactement comme la couleur le
                 fait pour les icônes : même information, même endroit. */
              <View>
                <Avatar
                  size={PHOTO}
                  uri={avatarUrl}
                  seed={avatarSeed}
                  ring={2}
                  ringColor={on ? (dark ? '#fff' : C.accent) : 'transparent'}
                />
                {dots[key] && <View style={s.dot} />}
              </View>
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
    paddingTop: S.sm, paddingHorizontal: S.xs + 2,
  },
  navDark: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(17,17,17,0.82)', borderTopColor: 'rgba(255,255,255,0.12)',
  },
  btn: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: T.micro, fontFamily: F.inter5 },

  publier: {
    width: 44, height: 30, borderRadius: R.gelule, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sos: {
    width: 46, height: 30, borderRadius: R.gelule, backgroundColor: C.sos,
    alignItems: 'center', justifyContent: 'center',
  },
  sosText: { fontFamily: F.oswald7, fontSize: 13, color: '#fff', letterSpacing: 0.5 },

  /* le « voyant » : un point orange quand de nouvelles demandes arrivent */
  dot: {
    position: 'absolute', top: -2, right: -4,
    width: 8, height: 8, borderRadius: R.gelule, backgroundColor: C.accent,
  },
});
