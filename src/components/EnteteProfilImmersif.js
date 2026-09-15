/**
 * En-tête de profil, version immersive.
 *
 * Une grande image occupe le haut de l'écran, et la photo de profil vient
 * l'enjamber, centrée, à cheval sur la bande de chantier. C'est ce disque
 * qui donne le point de repère : on sait immédiatement à qui appartient la
 * page, même quand la bannière est une photo chargée.
 *
 * Le nom, le métier et la ville se posent juste en dessous, sur le fond
 * béton. Tout ce qui relève de la preuve — statistiques, boutons, bloc des
 * informations vérifiées — reste plus bas encore : une attestation
 * d'assurance posée sur une photo de chantier cesse de se lire comme un
 * document, et c'est exactement ce qu'il ne faut pas.
 */
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { Avatar, ProfileBanner, HazardStrip } from './ui';
import { BadgeCheck } from './icons';

const TAILLE_PHOTO = 112;
const ANNEAU = 5;
/** La photo est posée à cheval : exactement la moitié déborde sur la bannière. */
const CHEVAUCHEMENT = TAILLE_PHOTO / 2 + ANNEAU;

export default function EnteteProfilImmersif({
  bannerUrl, avatarUrl, seed, titre, sousTitre, verifie,
}) {
  const { height } = useWindowDimensions();
  // Environ un tiers de l'écran : assez pour respirer, pas au point de
  // repousser les informations utiles hors de vue.
  const hauteur = Math.round(Math.min(Math.max(height * 0.34, 240), 320));

  return (
    <View>
      <ProfileBanner uri={bannerUrl} height={hauteur}>
        {/* Voile progressif : la photo reste visible en haut, l'anneau clair
            de la photo de profil se détache en bas, même sur une image claire. */}
        <LinearGradient
          colors={['rgba(26,27,25,0.10)', 'rgba(26,27,25,0.22)', 'rgba(26,27,25,0.55)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={s.bande}><HazardStrip height={5} /></View>
      </ProfileBanner>

      <View style={s.zonePhoto}>
        <View style={s.ombre}>
          <Avatar
            seed={seed}
            size={TAILLE_PHOTO}
            ring={ANNEAU}
            ringColor={C.bg}
            uri={avatarUrl}
          />
        </View>
      </View>

      <View style={s.identite}>
        <View style={s.titreLigne}>
          <Text style={s.titre} numberOfLines={2}>{titre}</Text>
          {verifie && <BadgeCheck size={16} color={C.verif} />}
        </View>
        {!!sousTitre && <Text style={s.sousTitre}>{sousTitre}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bande: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  zonePhoto: { alignItems: 'center', marginTop: -CHEVAUCHEMENT },
  ombre: {
    borderRadius: (TAILLE_PHOTO + ANNEAU * 2) / 2,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  identite: { alignItems: 'center', paddingHorizontal: 20, marginTop: 9 },
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titre: { fontFamily: F.oswald6, fontSize: 20, color: C.ink, flexShrink: 1, textAlign: 'center' },
  sousTitre: { fontFamily: F.inter5, fontSize: 12.5, color: C.muted, marginTop: 3, textAlign: 'center' },
});
