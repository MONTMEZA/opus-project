/**
 * Fiche publique d'un particulier.
 *
 * Elle existe pour une raison précise : sous un commentaire, on doit pouvoir
 * toucher un nom et arriver quelque part. Un professionnel a sa page ; un
 * particulier n'avait rien, et son nom n'était donc cliquable nulle part.
 *
 * On n'y montre que ce qu'il a lui-même rendu public — son nom, sa ville,
 * les demandes qu'il a publiées. Jamais son adresse ni son courriel : ce
 * n'est pas parce qu'une donnée est en base qu'elle a sa place à l'écran.
 */
import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { Avatar, BtnMain, EmptyState, SectionLabel, Gradient } from '../components/ui';
import { MapPin } from '../components/icons';

export default function ProfilPublicScreen({ profil, chargement, onContacter }) {
  if (chargement) {
    return (
      <View style={s.centre}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }
  if (!profil) return <EmptyState>Ce profil n'est plus disponible.</EmptyState>;

  const demandes = profil.demandes || [];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={s.entete}>
        <Avatar seed={profil.id} size={84} uri={profil.avatarUrl} ring={4} ringColor={C.bg} />
        <Text style={s.nom}>{profil.nom}</Text>
        {!!profil.ville && (
          <View style={s.ligneVille}>
            <MapPin size={12} color={C.muted} />
            <Text style={s.ville}>{profil.ville}</Text>
          </View>
        )}
        <Text style={s.role}>Particulier</Text>

        {!!onContacter && (
          <BtnMain
            label="Envoyer un message"
            onPress={() => onContacter(profil)}
            style={{ marginTop: 14 }}
          />
        )}
      </View>

      <SectionLabel>Ses demandes publiées</SectionLabel>
      {demandes.length === 0 && (
        <EmptyState>Cette personne n'a publié aucune demande.</EmptyState>
      )}
      <View style={s.liste}>
        {demandes.map((d) => (
          <View key={String(d.id)} style={s.carte}>
            <View style={s.carteHaut}>
              <Text style={s.metier}>{d.metier}</Text>
              <Text style={s.temps}>{d.time}</Text>
            </View>
            <Text style={s.texte}>{d.texte}</Text>
            {!!d.media && (
              <Gradient media={d.media} style={{ width: '100%', aspectRatio: 16 / 10, marginTop: 8 }} />
            )}
            <View style={s.ligneVille}>
              <MapPin size={11} color={C.muted} />
              <Text style={s.ville}>{d.ville}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  entete: { alignItems: 'center', paddingTop: 22, paddingHorizontal: 20, paddingBottom: 14 },
  nom: { fontFamily: F.oswald6, fontSize: 19, color: C.ink, marginTop: 10, textAlign: 'center' },
  ligneVille: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ville: { fontSize: 11.5, color: C.muted, fontFamily: F.inter },
  role: { fontSize: 11, color: C.muted, fontFamily: F.inter6, marginTop: 6 },

  liste: { gap: 10, paddingHorizontal: 16 },
  carte: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, padding: 12 },
  carteHaut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metier: {
    fontFamily: F.oswald6, fontSize: 11, color: '#fff', backgroundColor: C.accent,
    paddingVertical: 2, paddingHorizontal: 7, overflow: 'hidden',
  },
  temps: { fontSize: 10.5, color: C.muted, fontFamily: F.inter },
  texte: { fontSize: 12.5, lineHeight: 18, color: C.ink, fontFamily: F.inter, marginTop: 8 },
});
