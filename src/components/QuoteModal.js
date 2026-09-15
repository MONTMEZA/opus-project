/**
 * 9. Modale devis / être rappelé (bottom sheet).
 * (.modal-overlay / .modal-card du prototype)
 *
 * Le formulaire part rempli avec ce que l'application sait déjà du client :
 * son nom, sa ville, son téléphone. Ce qui manque reste vide, mais une phrase
 * dit pourquoi il faut le remplir — « Votre numéro » tout seul n'explique
 * rien, « sans numéro, l'artisan ne pourra pas vous rappeler » si.
 *
 * Ce qu'on saisit ici peut être mémorisé dans le compte, pour ne pas le
 * retaper à chaque demande.
 */
import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { C, F } from '../theme';
import { BtnMain, Chip, Field, TextArea, IconBtn } from './ui';
import { X, Check } from './icons';
import { METIERS } from '../data/demo';

const CRENEAUX = ['Matin', 'Midi', 'Après-midi', 'Soir'];

export default function QuoteModal({ quote, moi = {}, onClose, onSubmit }) {
  const { open, pro, mode } = quote;

  const [metier, setMetier] = useState('');
  const [description, setDescription] = useState('');
  const [ville, setVille] = useState('');
  const [budget, setBudget] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [creneau, setCreneau] = useState(null);
  const [memoriser, setMemoriser] = useState(true);

  // À chaque ouverture : le métier du professionnel, et les coordonnées du
  // compte. On ne garde rien de la demande précédente.
  useEffect(() => {
    if (!open) return;
    setMetier(pro ? pro.metier : METIERS[0]);
    setDescription(''); setBudget(''); setCreneau(null);
    setNom(moi.nom && moi.nom !== 'Vous' ? moi.nom : '');
    setVille(moi.ville || '');
    setTelephone(moi.telephone || '');
    setMemoriser(true);
  }, [open, pro, moi.nom, moi.ville, moi.telephone]);

  if (!open || !pro) return null;

  const manqueNom = !nom.trim();
  const manqueTel = !telephone.trim();
  // On ne propose de mémoriser que ce qui n'était pas déjà connu.
  const duNouveau = (!moi.nom || moi.nom === 'Vous') && !!nom.trim()
    || !moi.telephone && !!telephone.trim()
    || !moi.ville && !!ville.trim();

  const envoyer = () => onSubmit(
    mode === 'devis'
      ? { metier, description, ville, budget, nom, telephone, memoriser: memoriser && duNouveau }
      : { nom, telephone, creneau, ville, memoriser: memoriser && duNouveau },
  );

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

            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 400 }}>
              {mode === 'devis' && (
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
                </>
              )}

              <Text style={s.label}>Vos coordonnées</Text>

              <Field style={s.input} placeholder="Votre nom" value={nom} onChangeText={setNom} />
              {manqueNom && (
                <Text style={s.aide}>
                  Indiquez votre nom : l'artisan saura à qui il répond.
                </Text>
              )}

              <Field
                style={s.input}
                placeholder="Votre numéro"
                keyboardType="phone-pad"
                value={telephone}
                onChangeText={setTelephone}
              />
              {manqueTel && (
                <Text style={s.aide}>
                  {mode === 'devis'
                    ? "Ajoutez votre numéro : c'est par là que l'artisan vous joindra le plus vite."
                    : "Sans numéro, l'artisan ne pourra pas vous rappeler."}
                </Text>
              )}

              <Field
                style={s.input}
                placeholder={mode === 'devis' ? 'Ville ou adresse du chantier' : 'Votre ville'}
                value={ville}
                onChangeText={setVille}
              />

              {mode === 'devis' ? (
                <Field
                  style={s.input}
                  placeholder="Budget approximatif (facultatif)"
                  value={budget}
                  onChangeText={setBudget}
                />
              ) : (
                <>
                  <Text style={s.label}>Quand vous rappeler ?</Text>
                  <View style={s.chipRow}>
                    {CRENEAUX.map((c) => (
                      <Chip key={c} label={c} on={creneau === c} onPress={() => setCreneau(c)} />
                    ))}
                  </View>
                </>
              )}

              {duNouveau && (
                <Pressable style={s.memo} onPress={() => setMemoriser((v) => !v)}>
                  <View style={[s.case, memoriser && s.caseOn]}>
                    {memoriser && <Check size={11} color="#fff" />}
                  </View>
                  <Text style={s.memoTexte}>
                    Retenir ces informations dans mon profil, pour ne plus les retaper
                  </Text>
                </Pressable>
              )}
            </ScrollView>

            <BtnMain
              block
              label={mode === 'devis' ? 'Envoyer ma demande' : 'Demander à être rappelé'}
              onPress={envoyer}
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
  aide: { fontSize: 11, color: C.accent, fontFamily: F.inter, lineHeight: 16, marginTop: -4, marginBottom: 9 },

  memo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 6 },
  case: {
    width: 16, height: 16, borderWidth: 1, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg,
  },
  caseOn: { backgroundColor: C.accent, borderColor: C.accent },
  memoTexte: { flex: 1, fontSize: 11, color: C.muted, fontFamily: F.inter, lineHeight: 16 },
});
