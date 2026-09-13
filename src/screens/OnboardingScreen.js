/**
 * 1. Onboarding — choix "Professionnel" / "Particulier".
 * (.onboard du prototype, sans le cadre téléphone : on occupe tout l'écran.)
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, GRAD_160 } from '../theme';
import { HazardStrip } from '../components/ui';
import { HardHat, Hammer, Wrench, Paintbrush } from '../components/icons';

export default function OnboardingScreen({ onChoose }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['#1A1B19', '#3a3a38', '#1B4B6B']}
      locations={[0, 0.6, 1]}
      start={GRAD_160.start}
      end={GRAD_160.end}
      style={s.wrap}
    >
      <View style={{ paddingTop: insets.top }}>
        <HazardStrip height={6} dark="#111" />
      </View>

      <View style={s.content}>
        <View style={s.icons}>
          <HardHat size={22} color="#fff" />
          <Hammer size={22} color="#fff" />
          <Wrench size={22} color="#fff" />
          <Paintbrush size={22} color="#fff" />
        </View>

        <Text style={s.brand}>OPUS<Text style={{ color: C.accent }}>-PROJECT</Text></Text>
        <Text style={s.tag}>Découvrez. Partagez. Construisez.</Text>

        <View style={{ flex: 1 }} />

        <Pressable style={[s.btn, s.btnPro]} onPress={() => onChoose('pro')}>
          <Text style={[s.btnText, { color: '#111' }]}>JE SUIS UN PROFESSIONNEL</Text>
        </Pressable>
        <Pressable style={[s.btn, s.btnPart]} onPress={() => onChoose('particulier')}>
          <Text style={[s.btnText, { color: '#fff' }]}>JE SUIS UN PARTICULIER</Text>
        </Pressable>

        <Text style={[s.note, { marginBottom: insets.bottom + 10 }]}>
          Choisissez votre profil pour entrer dans l'application.
        </Text>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 26, paddingBottom: 20 },
  icons: { flexDirection: 'row', gap: 16, marginTop: 60, opacity: 0.85 },
  brand: { fontFamily: F.oswald7, fontSize: 34, color: '#fff', marginTop: 24, letterSpacing: 0.5 },
  tag: { fontSize: 13, color: '#fff', opacity: 0.85, marginTop: 6, fontFamily: F.inter },
  btn: { width: '100%', paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  btnPro: { backgroundColor: C.accent },
  btnPart: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  btnText: { fontFamily: F.oswald6, fontSize: 13, letterSpacing: 0.3 },
  note: { fontSize: 10, color: '#fff', opacity: 0.6, textAlign: 'center' },
});
