/**
 * En-tête de profil, version immersive.
 *
 * Une grande image occupe le haut de l'écran. On n'y pose QUE l'identité :
 * photo, nom, métier, ville. Ces éléments se reconnaissent même à moitié
 * lisibles sur une photo chargée.
 *
 * Tout ce qui relève de la preuve — statistiques, boutons, bloc des
 * informations vérifiées — reste volontairement en dessous, sur le fond
 * béton, où le contraste est garanti. Une attestation d'assurance posée sur
 * une photo de chantier cesse de se lire comme un document ; c'est
 * exactement ce qu'il ne faut pas.
 */
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { Avatar, ProfileBanner, HazardStrip } from './ui';
import { BadgeCheck } from './icons';

const TAILLE_PHOTO = 84;
const ANNEAU = 4;

export default function EnteteProfilImmersif({
  bannerUrl, avatarUrl, seed, titre, sousTitre, verifie,
}) {
  const { height } = useWindowDimensions();
  // Un peu plus du tiers de l'écran : assez pour respirer, pas au point
  // de repousser les informations utiles hors de vue.
  const hauteur = Math.round(Math.min(Math.max(height * 0.38, 260), 340));

  return (
    <ProfileBanner uri={bannerUrl} height={hauteur}>
      {/* Voile progressif : la photo reste visible en haut, le texte lisible en bas. */}
      <LinearGradient
        colors={['rgba(26,27,25,0.15)', 'rgba(26,27,25,0.30)', 'rgba(26,27,25,0.86)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[s.contenu, { height: hauteur }]}>
        <View style={s.ligne}>
          <Avatar seed={seed} size={TAILLE_PHOTO} ring={ANNEAU} uri={avatarUrl} />
          <View style={s.textes}>
            <View style={s.titreLigne}>
              <Text style={s.titre} numberOfLines={2}>{titre}</Text>
              {verifie && <BadgeCheck size={16} color={C.verif} />}
            </View>
            {!!sousTitre && <Text style={s.sousTitre}>{sousTitre}</Text>}
          </View>
        </View>
      </View>

      <View style={s.bande}><HazardStrip height={5} /></View>
    </ProfileBanner>
  );
}

const s = StyleSheet.create({
  contenu: { justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 18 },
  ligne: { flexDirection: 'row', alignItems: 'flex-end', gap: 13 },
  textes: { flex: 1, minWidth: 0, paddingBottom: 4 },
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titre: {
    fontFamily: F.oswald6, fontSize: 21, color: '#fff', flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  sousTitre: {
    fontFamily: F.inter5, fontSize: 12.5, color: 'rgba(255,255,255,0.92)', marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  bande: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
