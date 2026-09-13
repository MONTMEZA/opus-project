/**
 * 5b. Messages — détail d'une conversation.
 * Bulles à droite pour moi, à gauche pour l'artisan. (.conv-wrap du prototype)
 */
import React, { useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { C, F } from '../theme';
import { EmptyState, Field } from '../components/ui';
import { Send } from '../components/icons';

export default function ConversationScreen({ conversation, draft, setDraft, onSend }) {
  const scrollRef = useRef(null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        onContentSizeChange={() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: true })}
      >
        {conversation.messages.map((m, i) => (
          <View key={i} style={[s.bubble, m.from === 'moi' && s.bubbleMoi]}>
            <Text style={[s.bubbleText, m.from === 'moi' && { color: '#fff' }]}>{m.texte}</Text>
          </View>
        ))}
        {conversation.messages.length === 0 && <EmptyState>Dites bonjour 👋</EmptyState>}
      </ScrollView>

      <View style={s.inputRow}>
        <Field
          style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 12, fontSize: 12.5 }}
          placeholder="Écrire un message..."
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <Pressable style={s.send} onPress={onSend}>
          <Send size={16} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 14, gap: 8 },
  bubble: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
    maxWidth: '75%', alignSelf: 'flex-start',
  },
  bubbleMoi: { backgroundColor: C.ink, alignSelf: 'flex-end', borderColor: C.ink },
  bubbleText: { fontSize: 12.5, color: C.ink, fontFamily: F.inter },
  inputRow: {
    flexDirection: 'row', gap: 8, paddingVertical: 10, paddingHorizontal: 12,
    borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.surface,
  },
  send: { backgroundColor: C.ink, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
});
