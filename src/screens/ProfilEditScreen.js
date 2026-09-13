/**
 * Modifier mon profil — pro ou particulier.
 *
 * Côté professionnel, l'écran contient aussi le miroir du bouton SOS :
 * c'est ici que l'artisan déclare qu'il répond aux urgences et renseigne
 * ses trois chiffres (déplacement, tarif horaire, majoration).
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import {
  Avatar, BtnMain, BtnMini, BtnOutline, Chip, Field, TextArea, ProfileBanner, SectionLabel,
} from '../components/ui';
import { Camera, AlertTriangle } from '../components/icons';
import { METIERS } from '../data/demo';
import { METIERS_SOS } from '../data/urgences';
import { choisirImage } from '../lib/media';

/** Le métier d'urgence correspondant au métier déclaré, s'il existe. */
function metierSosDe(metier) {
  return METIERS_SOS.find((m) => m.metier === metier) || null;
}

export default function ProfilEditScreen({
  userType, profil, sos, onSave, onErreur,
}) {
  const estPro = userType === 'pro';

  const [avatarUrl, setAvatarUrl] = useState(profil.avatarUrl || null);
  const [bannerUrl, setBannerUrl] = useState(profil.bannerUrl || null);
  const [nom, setNom] = useState(profil.nom || '');
  const [entreprise, setEntreprise] = useState(profil.entreprise || '');
  const [metier, setMetier] = useState(profil.metier || METIERS[0]);
  const [ville, setVille] = useState(profil.ville || '');
  const [bio, setBio] = useState(profil.bio || '');
  const [siret, setSiret] = useState(profil.siret || '');
  const [exp, setExp] = useState(String(profil.exp || ''));

  const [sosActif, setSosActif] = useState(!!(sos && sos.actif));
  const [deplacement, setDeplacement] = useState(String((sos && sos.deplacement) || ''));
  const [horaire, setHoraire] = useState(String((sos && sos.horaire) || ''));
  const [majoration, setMajoration] = useState(String((sos && sos.majoration) || ''));
  const [rayonKm, setRayonKm] = useState(String((sos && sos.rayonKm) || '20'));

  const sosMetier = metierSosDe(metier);

  const prendre = async (usage, camera) => {
    try {
      const uri = await choisirImage({ camera, usage });
      if (!uri) return;
      if (usage === 'avatar') setAvatarUrl(uri);
      else setBannerUrl(uri);
    } catch (e) {
      onErreur(e.message || "L'image n'a pas pu être ouverte.");
    }
  };

  const enregistrer = () => {
    onSave({
      profil: estPro
        ? {
            avatarUrl, bannerUrl, entreprise, metier, ville, bio, siret,
            exp: Number(exp) || 0,
          }
        : { avatarUrl, nom, ville },
      sos: estPro && sosMetier
        ? {
            actif: sosActif,
            metierKey: sosMetier.key,
            deplacement: Number(deplacement) || 0,
            horaire: Number(horaire) || 0,
            majoration: Number(majoration) || 0,
            rayonKm: Number(rayonKm) || 20,
          }
        : null,
    });
  };

  return (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      {/* --- bannière (professionnels seulement) --- */}
      {estPro && (
        <>
          <ProfileBanner uri={bannerUrl} height={120} />
          <View style={s.mediaBtns}>
            <BtnMini outline onPress={() => prendre('banniere', false)}>
              <Camera size={12} color={C.ink} />
              <Text style={s.mediaBtnText}>Changer la bannière</Text>
            </BtnMini>
          </View>
        </>
      )}

      {/* --- photo de profil --- */}
      <View style={s.avatarZone}>
        <Avatar seed={profil.id || 9} size={88} ring={4} uri={avatarUrl} />
        <View style={{ gap: 6 }}>
          <BtnMini onPress={() => prendre('avatar', true)}>
            <Camera size={12} color="#111" />
            <Text style={s.mediaBtnTextOn}>Prendre une photo</Text>
          </BtnMini>
          <BtnMini outline onPress={() => prendre('avatar', false)}>
            <Text style={s.mediaBtnText}>Choisir dans la galerie</Text>
          </BtnMini>
        </View>
      </View>

      <View style={s.pad}>
        {estPro ? (
          <>
            <Text style={s.label}>Nom de l'entreprise</Text>
            <Field value={entreprise} onChangeText={setEntreprise} placeholder="Belaïd Maçonnerie" />

            <Text style={s.label}>Métier</Text>
            <View style={s.chipRow}>
              {METIERS.map((m) => (
                <Chip key={m} label={m} on={metier === m} onPress={() => setMetier(m)} />
              ))}
            </View>

            <Text style={s.label}>Ville</Text>
            <Field value={ville} onChangeText={setVille} placeholder="Marseille (13)" />

            <Text style={s.label}>Présentation</Text>
            <TextArea value={bio} onChangeText={setBio} placeholder="Décrivez votre activité..." />

            <Text style={s.label}>SIRET</Text>
            <Field value={siret} onChangeText={setSiret} placeholder="812 345 678 00019" />

            <Text style={s.label}>Années d'expérience</Text>
            <Field value={exp} onChangeText={setExp} keyboardType="number-pad" placeholder="9" />
          </>
        ) : (
          <>
            <Text style={s.label}>Votre nom</Text>
            <Field value={nom} onChangeText={setNom} placeholder="Dylan M." />

            <Text style={s.label}>Ville</Text>
            <Field value={ville} onChangeText={setVille} placeholder="Marseille (13)" />
          </>
        )}
      </View>

      {/* --- disponibilité SOS (professionnels des 4 métiers d'urgence) --- */}
      {estPro && (
        <>
          <SectionLabel>Interventions d'urgence</SectionLabel>
          <View style={s.pad}>
            {sosMetier ? (
              <View style={s.sosBloc}>
                <View style={s.sosLigne}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sosTitre}>Je réponds aux urgences</Text>
                    <Text style={s.sosDetail}>
                      Vous apparaîtrez dans les demandes SOS « {sosMetier.label} » près de chez vous.
                    </Text>
                  </View>
                  <Switch
                    value={sosActif}
                    onValueChange={setSosActif}
                    trackColor={{ false: C.line, true: C.sos }}
                    thumbColor="#fff"
                  />
                </View>

                {sosActif && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={s.label}>Forfait de déplacement (€)</Text>
                    <Field value={deplacement} onChangeText={setDeplacement} keyboardType="decimal-pad" placeholder="45" />

                    <Text style={s.label}>Tarif horaire (€/h)</Text>
                    <Field value={horaire} onChangeText={setHoraire} keyboardType="decimal-pad" placeholder="62" />

                    <Text style={s.label}>Majoration nuit et week-end (%)</Text>
                    <Field value={majoration} onChangeText={setMajoration} keyboardType="number-pad" placeholder="40" />

                    <Text style={s.label}>Rayon d'intervention (km)</Text>
                    <Field value={rayonKm} onChangeText={setRayonKm} keyboardType="number-pad" placeholder="20" />

                    <View style={s.avert}>
                      <AlertTriangle size={14} color={C.sos} />
                      <Text style={s.avertText}>
                        Ces chiffres servent à calculer une fourchette affichée au client
                        avant votre déplacement. Ce n'est pas un devis : vous restez libre
                        de chiffrer sur place après diagnostic.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={s.sosBloc}>
                <Text style={s.sosDetail}>
                  Les urgences concernent la plomberie, l'électricité, la serrurerie et le
                  chauffage. Votre métier n'est pas concerné par le bouton SOS.
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      <View style={[s.pad, { paddingBottom: 34 }]}>
        <BtnMain block label="Enregistrer" onPress={enregistrer} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  mediaBtns: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, marginTop: -16 },
  mediaBtnText: { fontFamily: F.oswald6, fontSize: 11, color: C.ink },
  mediaBtnTextOn: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },

  avatarZone: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingVertical: 16,
  },

  label: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted, marginTop: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  sosBloc: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 12 },
  sosLigne: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sosTitre: { fontFamily: F.inter6, fontSize: 13, color: C.ink },
  sosDetail: { fontSize: 11.5, color: C.muted, marginTop: 3, lineHeight: 16, fontFamily: F.inter },

  avert: {
    flexDirection: 'row', gap: 8, marginTop: 14,
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.sos, padding: 10,
  },
  avertText: { flex: 1, fontSize: 11, color: C.muted, lineHeight: 16, fontFamily: F.inter },
});
