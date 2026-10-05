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
  avatarUrl = null, avatarSeed = 0, avatarNom = null,
}) {
  const insets = useSafeAreaInsets();

  /* Les deux boutons du milieu n'ont PAS de texte sous l'icône — c'est
     voulu, ils se reconnaissent à leur forme. Mais un lecteur d'écran, lui,
     n'a que le texte : d'où `annonce`, qui dit ce que le bouton fait. */
  const centre = canPublish
    ? { key: 'creer', label: '', annonce: 'Publier', Icon: PlusSquare }
    : { key: 'sos', label: '', annonce: 'SOS — demander une intervention d’urgence', sos: true };

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
      accessibilityRole="tablist"
      style={[s.nav, dark && s.navDark, { paddingBottom: S.md + insets.bottom }]}
    >
      {tabs.map(({ key, label, annonce, Icon, sos }) => {
        const on = screen === key || (key === 'profil' && screen === 'profilPro');
        /**
         * L'ANNEAU DE L'ONGLET ACTIF — 05/10/2026, demandé par le
         * propriétaire : « on ne voit pas forcément où on est ».
         *
         * Il avait raison, et c'était mesurable : le SEUL signal était la
         * couleur de l'icône, `C.muted` quand on n'y est pas, `C.ink`
         * quand on y est. Calculé, ça fait **3,02 : 1** entre les deux —
         * exactement le minimum pour un élément graphique. Perceptible,
         * et c'est tout.
         *
         * Et l'onglet Profil, lui, avait DÉJÀ son anneau orange depuis que
         * la photo est entrée dans la barre. Ce lot ne fait donc
         * qu'étendre aux quatre autres ce que le cinquième faisait seul —
         * UNE seule règle, écrite une fois, plutôt que deux façons de dire
         * « vous êtes ici » dans la même barre.
         */
        const anneau = on ? (dark ? '#fff' : C.accent) : 'transparent';
        /* La pastille est une information, pas une décoration : sans cela,
           « Messages » et « Messages, nouveautés » s'annoncent pareil. */
        const etiquette = (annonce || label) + (dots[key] ? ', nouveautés' : '');
        return (
          <Pressable
            key={key}
            style={s.btn}
            onPress={() => onNavigate(key)}
            accessibilityRole="tab"
            accessibilityLabel={etiquette}
            aria-selected={on}
          >
            {sos ? (
              <View style={s.sos}><Text style={s.sosText}>SOS</Text></View>
            ) : key === 'creer' ? (
              <View style={s.publier}><Icon size={18} color={C.surAccent} /></View>
            ) : key === 'profil' && avatarUrl ? (
              /* L'anneau marque l'onglet actif exactement comme la couleur le
                 fait pour les icônes : même information, même endroit. */
              <View>
                <Avatar
                  size={PHOTO}
                  uri={avatarUrl}
                  nom={avatarNom}
                  seed={avatarSeed}
                  ring={2}
                  ringColor={anneau}
                />
                {dots[key] && <View style={s.dot} />}
              </View>
            ) : (
              /* LA BOÎTE FAIT TOUJOURS 30 × 30, anneau ou pas : seule la
                 COULEUR de la bordure change. Une bordure qui apparaît
                 décalerait l'icône de deux pixels à chaque changement
                 d'onglet, et toute la barre sauterait. */
              <View style={[s.anneau, { borderColor: anneau }]}>
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
  /* 48 et non 38 : c'est la barre la plus touchée de l'application, et
     elle est en bas, là où le pouce arrive de travers. Mesuré au
     navigateur le 02/10/2026. */
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
  label: { fontSize: T.micro, fontFamily: F.inter5 },

  publier: {
    width: 44, height: 30, borderRadius: R.gelule, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sos: {
    width: 46, height: 30, borderRadius: R.gelule, backgroundColor: C.sos,
    alignItems: 'center', justifyContent: 'center',
  },
  sosText: { fontFamily: F.oswald7, fontSize: T.corps, color: '#fff', letterSpacing: 0.5 },

  /* L'anneau de l'onglet actif. 30 de haut comme le bouton « Publier » :
     la barre garde exactement la même hauteur qu'avant. */
  anneau: {
    width: 30, height: 30, borderRadius: R.gelule, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },

  /* le « voyant » : un point orange quand de nouvelles demandes arrivent */
  dot: {
    position: 'absolute', top: -2, right: -4,
    width: 8, height: 8, borderRadius: R.gelule, backgroundColor: C.accent,
  },
});
