/**
 * 4. Publier — type de publication, description, métier, ville.
 * (.create-types / .create-media / .create-textarea du prototype)
 *
 * Note : le <select> HTML du prototype n'existe pas en React Native ;
 * le métier se choisit ici dans la même rangée de puces que l'écran Découvrir.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { BtnMain, Chip, Field, TextArea, Gradient } from '../components/ui';
import { Camera, VideoIcon, TypeIcon, Layers, Lightbulb } from '../components/icons';
import { METIERS } from '../data/demo';

const TYPES = [
  ['photo', Camera, 'Photo'],
  ['video', VideoIcon, 'Vidéo'],
  ['avantapres', Layers, 'Avant/Après'],
  ['texte', TypeIcon, 'Texte'],
  ['conseil', Lightbulb, 'Conseil'],
];

export default function CreerScreen({
  createType, setCreateType, createText, setCreateText,
  createMetier, setCreateMetier, createVille, setCreateVille, onPublish,
}) {
  return (
    <ScrollView style={s.pad} keyboardShouldPersistTaps="handled">
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
        <Camera size={26} color="#fff" />
      </Gradient>

      <TextArea
        placeholder="Décris ta publication..."
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

      <BtnMain block label="Publier" onPress={onPublish} style={{ marginTop: 14, marginBottom: 30 }} />
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
  media: { height: 130, marginVertical: 10, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.oswald6, fontSize: 12, color: C.ink, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
});
