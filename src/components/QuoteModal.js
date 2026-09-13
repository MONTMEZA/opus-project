/**
 * 9. Modale devis / être rappelé (bottom sheet).
 * (.modal-overlay / .modal-card du prototype)
 */
import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { C, F } from '../theme';
import { BtnMain, Chip, Field, TextArea, IconBtn } from './ui';
import { X } from './icons';
import { METIERS } from '../data/demo';

const CRENEAUX = ['Matin', 'Midi', 'Après-midi', 'Soir'];

export default function QuoteModal({ quote, onClose, onSubmit }) {
  const { open, pro, mode } = quote;

  const [metier, setMetier] = useState('');
  const [description, setDescription] = useState('');
  const [ville, setVille] = useState('');
  const [budget, setBudget] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [creneau, setCreneau] = useState(null);

  // À chaque ouverture on repart d'un formulaire vierge,
  // avec le métier du professionnel pré-sélectionné.
  useEffect(() => {
    if (open) {
      setMetier(pro ? pro.metier : METIERS[0]);
      setDescription(''); setVille(''); setBudget('');
      setNom(''); setTelephone(''); setCreneau(null);
    }
  }, [open, pro]);

  if (!open || !pro) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <Pressable style={s.card} onPress={(e) => e.stopPropagation()}>
            <View style={s.head}>
              <Text style={s.headText} numberOfLines={1}>
                {mode === 'devis' ? 'Demander un devis' : 'Être rappelé'} — {pro.entreprise}
              </Text>
              <IconBtn onPress={onClose}><X size={16} color={C.ink} /></IconBtn>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 380 }}>
              {mode === 'devis' ? (
                <>
                  <Text style={s.label}>Métier concerné</Text>
                  <View style={s.chipRow}>
                    {METIERS.map((m) => (
                      <Chip key={m} label={m} on={metier === m} onPress={() => setMetier(m)} />
                    ))}
                  </View>
                  <TextArea
                    placeholder="Décrivez votre projet..."
                    value={description}
                    onChangeText={setDescription}
                  />
                  <Field
                    style={s.input}
                    placeholder="Ville ou adresse"
                    value={ville}
                    onChangeText={setVille}
                  />
                  <Field
                    style={s.input}
                    placeholder="Budget approximatif (facultatif)"
                    value={budget}
                    onChangeText={setBudget}
                  />
                </>
              ) : (
                <>
                  <Field style={s.input} placeholder="Votre nom" value={nom} onChangeText={setNom} />
                  <Field
                    style={s.input}
                    placeholder="Votre numéro"
                    keyboardType="phone-pad"
                    value={telephone}
                    onChangeText={setTelephone}
                  />
                  <Text style={s.label}>Quand vous rappeler ?</Text>
                  <View style={s.chipRow}>
                    {CRENEAUX.map((c) => (
                      <Chip key={c} label={c} on={creneau === c} onPress={() => setCreneau(c)} />
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <BtnMain
              block
              label={mode === 'devis' ? 'Envoyer ma demande' : 'Demander à être rappelé'}
              onPress={() => onSubmit(
                mode === 'devis'
                  ? { metier, description, ville, budget }
                  : { nom, telephone, creneau },
              )}
            />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  card: { backgroundColor: C.surface, width: '100%', padding: 16, paddingBottom: 26, gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headText: { fontFamily: F.oswald6, fontSize: 13, color: C.ink, flex: 1 },
  label: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  input: { marginBottom: 8 },
});
