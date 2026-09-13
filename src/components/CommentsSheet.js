/**
 * Panneau de commentaires qui monte du bas de l'écran.
 * Utilisé par le fil vidéo plein écran, où il n'y a pas la place
 * de déplier les commentaires dans la carte comme sur le fil classique.
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { Field, IconBtn, EmptyState } from './ui';
import { X, Send } from './icons';

export default function CommentsSheet({ visible, post, onClose, onAddComment }) {
  const [draft, setDraft] = useState('');
  const insets = useSafeAreaInsets();

  if (!visible || !post) return null;
  const comments = post.comments || [];

  const envoyer = () => {
    if (!draft.trim()) return;
    onAddComment(post.id, draft.trim());
    setDraft('');
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.sheetWrap}
        >
          <Pressable style={[s.sheet, { paddingBottom: insets.bottom + 10 }]} onPress={(e) => e.stopPropagation()}>
            <View style={s.grabber} />

            <View style={s.head}>
              <Text style={s.headText}>
                {comments.length} {comments.length > 1 ? 'commentaires' : 'commentaire'}
              </Text>
              <IconBtn onPress={onClose}><X size={16} color={C.ink} /></IconBtn>
            </View>

            <ScrollView style={s.list} keyboardShouldPersistTaps="handled">
              {comments.map((c) => (
                <View key={String(c.id)} style={s.row}>
                  <Text style={s.auteur}>{c.auteur}</Text>
                  <Text style={s.texte}>{c.texte}</Text>
                </View>
              ))}
              {comments.length === 0 && (
                <EmptyState>Aucun commentaire — lancez la discussion.</EmptyState>
              )}
            </ScrollView>

            <View style={s.inputRow}>
              <Field
                style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 12, fontSize: 12.5 }}
                placeholder="Ajouter un commentaire..."
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={envoyer}
                returnKeyType="send"
              />
              <Pressable style={s.send} onPress={envoyer}>
                <Send size={16} color="#fff" />
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: C.surface, width: '100%', height: '62%',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line,
  },
  grabber: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: C.line,
    alignSelf: 'center', marginBottom: 8,
  },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  headText: { fontFamily: F.oswald6, fontSize: 13, color: C.ink },
  list: { flex: 1, paddingHorizontal: 16 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  auteur: { fontFamily: F.inter6, fontSize: 12, color: C.ink, marginBottom: 2 },
  texte: { fontSize: 12.5, lineHeight: 18, color: C.ink, fontFamily: F.inter },
  inputRow: {
    flexDirection: 'row', gap: 8, paddingTop: 10, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: C.line,
  },
  send: { backgroundColor: C.ink, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
});
