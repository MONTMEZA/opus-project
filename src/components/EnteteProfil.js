/**
 * En-tête de profil, partagé par « mon profil » et le profil d'un autre pro.
 *
 * L'esprit LinkedIn — grande bannière, photo qui la chevauche — mais avec la
 * signature d'Opus : la bande de chantier court au bas de la bannière, et la
 * photo vient l'enjamber. C'est ce détail qui rend l'écran reconnaissable
 * sans copier personne.
 *
 * Un voile sombre sous la bannière garantit que l'anneau blanc de la photo
 * se détache, même sur une image claire.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';
import { Avatar, ProfileBanner, HazardStrip } from './ui';

const HAUTEUR_BANNIERE = 170;
const TAILLE_PHOTO = 104;
const ANNEAU = 5;
/** Part de la photo qui déborde sur la bannière : un peu plus de la moitié. */
const CHEVAUCHEMENT = 62;

export default function EnteteProfil({ bannerUrl, avatarUrl, seed, action }) {
  return (
    <View>
      <ProfileBanner uri={bannerUrl} height={HAUTEUR_BANNIERE}>
        {/* voile : détache l'anneau de la photo sur une bannière claire */}
        <LinearGradient
          colors={['transparent', 'rgba(26,27,25,0.45)']}
          style={s.voile}
          pointerEvents="none"
        />
        <View style={s.bande}>
          <HazardStrip height={5} />
        </View>
      </ProfileBanner>

      <View style={s.zonePhoto}>
        <View style={s.ombre}>
          <Avatar seed={seed} size={TAILLE_PHOTO} ring={ANNEAU} uri={avatarUrl} />
        </View>
      </View>

      {action}
    </View>
  );
}

export const CHEVAUCHEMENT_PHOTO = CHEVAUCHEMENT;

const s = StyleSheet.create({
  voile: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 },
  bande: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  zonePhoto: { alignItems: 'center', marginTop: -CHEVAUCHEMENT },
  ombre: {
    borderRadius: (TAILLE_PHOTO + ANNEAU * 2) / 2,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
});
