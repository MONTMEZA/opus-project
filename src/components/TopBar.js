/**
 * Barre du haut : marque + cloche (.topbrand) ou retour (.backbar).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  C, F, T, R,
} from '../theme';
import { HazardStrip, IconBtn } from './ui';
import { HardHat, Bell, ArrowLeft, Search } from './icons';

export function TopBrand({ unreadCount, onBell, onLoupe, filtreActif = false, resumeFiltre = '' }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.top}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.ink }} />
      <HazardStrip height={5} />
      <View style={s.row}>
        <View style={s.left} accessible accessibilityRole="header">
          <HardHat size={18} color={C.ink} />
          <Text style={s.brand}>OPUS</Text>
        </View>
        {/* LA LOUPE, ET RIEN D'AUTRE — demandé par le propriétaire le
            05/10/2026 : « je ne veux pas de grosses pastilles, je veux que
            l'écran du fil reste simple ».

            Mais elle doit DIRE qu'un filtre est posé, sinon on cherche
            pendant cinq minutes pourquoi « il n'y a rien » — c'est la règle
            du 04/10, « un filtre qu'on ne voit pas est un filtre qu'on
            oublie d'enlever ». Elle change donc de couleur et porte un
            point, et la ligne de rappel sous les onglets dit QUOI.

            `C.accentTexte` et non `C.accent` : une icône posée sur le fond
            clair de la barre est un élément graphique, il lui faut 3 : 1 —
            l'orange de signature n'y donne que 2,76. Même mesure que les
            voyants du 04/10. */}
        {!!onLoupe && (
          <IconBtn
            onPress={onLoupe}
            accessibilityLabel={filtreActif
              ? `Recherche, filtre actif : ${resumeFiltre}`
              : 'Rechercher dans le fil'}
          >
            <Search size={18} color={filtreActif ? C.accentTexte : C.ink} />
            {filtreActif && <View style={s.pointLoupe} />}
          </IconBtn>
        )}
        <IconBtn
          onPress={onBell}
          accessibilityLabel={unreadCount > 0
            ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
            : 'Notifications'}
        >
          <Bell size={18} color={C.ink} />
          {unreadCount > 0 && (
            <View style={s.badge}><Text style={s.badgeText}>{unreadCount}</Text></View>
          )}
        </IconBtn>
      </View>
    </View>
  );
}

export function BackBar({ title, onBack }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.top}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.surface }} />
      <View style={s.backRow}>
        <IconBtn onPress={onBack} accessibilityLabel="Revenir en arrière">
          <ArrowLeft size={18} color={C.ink} />
        </IconBtn>
        <Text style={s.backTitle} numberOfLines={1} accessibilityRole="header">{title}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14 },
  /* `flex: 1, minWidth: 0` : sans lui, la marque POUSSE la rangée au lieu
     de se raccourcir, et la loupe sort de l'écran. Leçon du lot 5, avec le
     bouton « Suivre » qui recouvrait le nom de l'artisan. */
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  brand: { fontFamily: F.oswald7, fontSize: T.titre, letterSpacing: 0.5, color: C.ink },
  badge: {
    position: 'absolute', top: -3, right: -4, backgroundColor: C.accent,
    width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontFamily: F.oswald7, color: C.surAccent },
  /* Le point de la loupe : 7 px, donc un ÉLÉMENT GRAPHIQUE au sens des
     règles d'accès — il lui faut 3 : 1 sur son fond. `C.accentTexte`
     donne 4,52 sur le fond clair de la barre, l'orange de signature
     2,76. Recalculé par `verifier-cibles` à chaque passage. */
  pointLoupe: {
    position: 'absolute', top: 0, right: -1,
    width: 7, height: 7, borderRadius: R.gelule, backgroundColor: C.accentTexte,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  backTitle: { fontFamily: F.oswald6, fontSize: 14, color: C.ink, flex: 1 },
});
