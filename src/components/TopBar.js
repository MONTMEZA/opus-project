/**
 * Barre du haut : marque + cloche (.topbrand) ou retour (.backbar).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { HazardStrip, IconBtn } from './ui';
import { HardHat, Bell, ArrowLeft } from './icons';

export function TopBrand({ unreadCount, onBell }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.top}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.ink }} />
      <HazardStrip height={5} />
      <View style={s.row}>
        <View style={s.left}>
          <HardHat size={18} color={C.ink} />
          <Text style={s.brand}>OPUS</Text>
        </View>
        <IconBtn onPress={onBell}>
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
        <IconBtn onPress={onBack}><ArrowLeft size={18} color={C.ink} /></IconBtn>
        <Text style={s.backTitle} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontFamily: F.oswald7, fontSize: 18, letterSpacing: 0.5, color: C.ink },
  badge: {
    position: 'absolute', top: -3, right: -4, backgroundColor: C.accent,
    width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontFamily: F.oswald7, color: '#111' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  backTitle: { fontFamily: F.oswald6, fontSize: 14, color: C.ink, flex: 1 },
});
