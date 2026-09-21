/**
 * Panneau de commentaires qui monte du bas de l'écran.
 * Utilisé par le fil vidéo plein écran, où il n'y a pas la place
 * de déplier les commentaires dans la carte comme sur le fil classique.
 */
import React from 'react';
import {
  Modal, View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { IconBtn } from './ui';
import Commentaires, { nombreCommentaires } from './Commentaires';
import { X } from './icons';

export default function CommentsSheet({
  visible, post, pros = {}, onClose, onAddComment, onVoirCommentateur, onSignaler,
}) {
  const insets = useSafeAreaInsets();

  if (!visible || !post) return null;
  const comments = post.comments || [];
  const total = nombreCommentaires(comments);

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
                {total} {total > 1 ? 'commentaires' : 'commentaire'}
              </Text>
              <IconBtn onPress={onClose}><X size={16} color={C.ink} /></IconBtn>
            </View>

            <Commentaires
              scroll
              style={s.list}
              commentaires={comments}
              pros={pros}
              onVoirProfil={(c) => { onClose(); onVoirCommentateur(c); }}
              onSignaler={onSignaler ? (cible) => { onClose(); onSignaler(cible); } : null}
              onEnvoyer={(texte, parentId) => onAddComment(post.id, texte, parentId)}
            />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  // flex:1 est indispensable : sans hauteur connue, le « 62% » du panneau
  // ne se résout pas et le panneau s'écrase sur son contenu.
  sheetWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
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
});
