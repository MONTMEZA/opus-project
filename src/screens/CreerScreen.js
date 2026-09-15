/**
 * 4. Publier — format, destination, description, métier, ville.
 * (.create-types / .create-media / .create-textarea du prototype)
 *
 * Deux choix distincts, et c'est volontaire :
 *
 *   - le FORMAT dit ce qu'on montre (photo, vidéo, avant/après…). C'est lui
 *     qui décide si la publication apparaît dans le fil des vidéos ;
 *   - la DESTINATION dit où elle va. Un artisan ne veut pas toujours publier :
 *     parfois il veut juste enrichir son portfolio, sans rien annoncer. Et
 *     souvent il veut les deux, d'un seul geste — c'est le choix par défaut.
 *
 * Note : le <select> HTML du prototype n'existe pas en React Native ;
 * le métier se choisit ici dans la même rangée de puces que l'écran Découvrir.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { BtnMain, Chip, Field, TextArea, Gradient } from '../components/ui';
import {
  Camera, VideoIcon, TypeIcon, Layers, Lightbulb, Grid, Send,
} from '../components/icons';
import { METIERS } from '../data/demo';

const TYPES = [
  ['photo', Camera, 'Photo'],
  ['video', VideoIcon, 'Vidéo'],
  ['avantapres', Layers, 'Avant/Après'],
  ['texte', TypeIcon, 'Texte'],
  ['conseil', Lightbulb, 'Conseil'],
];

/** Les formats qui produisent une image ou une vidéo, donc bons pour le portfolio. */
export const FORMATS_VISUELS = new Set(['photo', 'video', 'avantapres']);

const DESTINATIONS = [
  ['fil', Send, 'Le fil', "Visible par tous, avec likes et commentaires."],
  ['portfolio', Grid, 'Mon portfolio', "Rangé dans vos réalisations, rien dans le fil."],
  ['deux', Layers, 'Les deux', "Publié dans le fil ET ajouté à vos réalisations."],
];

export default function CreerScreen({
  createType, setCreateType, createText, setCreateText,
  createMetier, setCreateMetier, createVille, setCreateVille,
  createDestination, setCreateDestination, onPublish,
}) {
  const aUnVisuel = FORMATS_VISUELS.has(createType);
  const destination = aUnVisuel ? createDestination : 'fil';
  const dansLeFil = destination !== 'portfolio';

  const Icone = (TYPES.find(([k]) => k === createType) || TYPES[0])[1];

  return (
    <ScrollView style={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.label}>Format</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.types}>
        {TYPES.map(([key, Icon, label]) => {
          const on = createType === key;
          return (
            <Pressable key={key} style={[s.type, on && s.typeOn]} onPress={() => setCreateType(key)}>
              <Icon size={18} color={on ? '#fff' : C.muted} />
              <Text style={[s.typeText, on && { color: '#fff' }]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Gradient media="#3a3a38,#8a8578" style={s.media}>
        <Icone size={26} color="#fff" />
        {createType === 'video' && (
          <Text style={s.mediaNote}>Apparaîtra dans le fil « Vidéos »</Text>
        )}
      </Gradient>

      {/* --- destination --- */}
      {aUnVisuel && (
        <>
          <Text style={s.label}>Où l'envoyer ?</Text>
          <View style={s.destinations}>
            {DESTINATIONS.map(([key, Icon, titre, detail]) => {
              const on = destination === key;
              return (
                <Pressable
                  key={key}
                  style={[s.destination, on && s.destinationOn]}
                  onPress={() => setCreateDestination(key)}
                >
                  <Icon size={15} color={on ? C.accent : C.muted} />
                  <View style={s.destinationTextes}>
                    <Text style={[s.destinationTitre, on && { color: C.accent }]}>{titre}</Text>
                    <Text style={s.destinationDetail}>{detail}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Text style={s.label}>
        {dansLeFil ? 'Description' : 'Description (facultative)'}
      </Text>
      <TextArea
        placeholder={dansLeFil
          ? 'Décris ta publication...'
          : 'Une légende, si tu veux...'}
        value={createText}
        onChangeText={setCreateText}
      />

      <Text style={s.label}>Métier</Text>
      <View style={s.chipRow}>
        {METIERS.map((m) => (
          <Chip key={m} label={m} on={createMetier === m} onPress={() => setCreateMetier(m)} />
        ))}
      </View>

      <Field placeholder="Ville" value={createVille} onChangeText={setCreateVille} />

      <BtnMain
        block
        label={destination === 'portfolio' ? 'Ajouter à mon portfolio' : 'Publier'}
        onPress={onPublish}
        style={{ marginTop: 14, marginBottom: 30 }}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },
  types: { gap: 6, paddingBottom: 6 },
  type: {
    alignItems: 'center', gap: 4, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, paddingVertical: 10, paddingHorizontal: 12,
  },
  typeOn: { backgroundColor: C.ink, borderColor: C.ink },
  typeText: { fontSize: 10.5, color: C.muted, fontFamily: F.oswald },
  media: { height: 130, marginVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 7 },
  mediaNote: { fontSize: 10.5, color: 'rgba(255,255,255,0.85)', fontFamily: F.inter5 },
  label: { fontFamily: F.oswald6, fontSize: 12, color: C.ink, marginBottom: 6 },

  destinations: { gap: 6, marginBottom: 12 },
  destination: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  destinationOn: { borderColor: C.accent, borderWidth: 2 },
  destinationTextes: { flex: 1, minWidth: 0 },
  destinationTitre: { fontFamily: F.oswald6, fontSize: 12.5, color: C.ink },
  destinationDetail: { fontSize: 10.5, color: C.muted, fontFamily: F.inter, marginTop: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
});
