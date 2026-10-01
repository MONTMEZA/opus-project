/**
 * 5b. Messages — détail d'une conversation.
 * Bulles à droite pour moi, à gauche pour l'artisan. (.conv-wrap du prototype)
 */
import React, { useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { C, F, T, APPUI } from '../theme';
import { EmptyState, Field } from '../components/ui';
import { Send, Flag, AlertTriangle } from '../components/icons';

export default function ConversationScreen({
  conversation, draft, setDraft, onSend, onSignaler, interlocuteur,
  chargement = false, onRenvoyer,
}) {
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
          <View key={m.cle || m.id || i} style={s.rangee}>
            <View style={{ alignItems: m.from === 'moi' ? 'flex-end' : 'flex-start' }}>
              <View style={[
                s.bubble, m.from === 'moi' && s.bubbleMoi,
                m.etat === 'echec' && s.bubbleEchec,
              ]}>
                <Text style={[s.bubbleText, m.from === 'moi' && { color: '#fff' }]}>{m.texte}</Text>
              </View>

              {/* L'ÉTAT DE L'ENVOI, SOUS LA BULLE.
                  Sans lui, un message qui n'est jamais parti ressemblait
                  trait pour trait à un message reçu par son destinataire —
                  et on continuait la conversation tout seul. */}
              {m.from === 'moi' && m.etat === 'envoi' && (
                <Text style={s.etat}>Envoi…</Text>
              )}
              {m.from === 'moi' && m.etat === 'echec' && (
                <Pressable
                  onPress={() => onRenvoyer && onRenvoyer(m)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Message non envoyé. Toucher pour réessayer."
                  style={({ pressed }) => [s.rangeeEchec, pressed && APPUI.discret]}
                >
                  <AlertTriangle size={11} color={C.bad} />
                  <Text style={s.etatEchec}>Non envoyé — toucher pour réessayer</Text>
                </Pressable>
              )}
            </View>
            {/* Un message reçu se signale. C'est souvent là, et pas dans le
                fil, que commencent les menaces et les arnaques — et c'est le
                seul endroit où personne d'autre ne peut le voir. */}
            {!!onSignaler && m.from !== 'moi' && !!m.id && (
              <Pressable
                hitSlop={8}
                style={s.signaler}
                accessibilityRole="button"
                accessibilityLabel="Signaler ce message"
                onPress={() => onSignaler({
                  cibleType: 'message',
                  cibleId: m.id,
                  auteurId: m.auteurId,
                  auteurNom: interlocuteur || 'cette personne',
                  extrait: m.texte,
                })}
              >
                <Flag size={11} color={C.muted} />
              </Pressable>
            )}
          </View>
        ))}
        {/* On dit que ça charge, au lieu d'afficher « Dites bonjour » sur
            une conversation qui a dix messages mais qui n'est pas encore
            arrivée. */}
        {chargement && <EmptyState>Chargement…</EmptyState>}
        {!chargement && conversation.messages.length === 0 && (
          <EmptyState>Dites bonjour 👋</EmptyState>
        )}
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
        <Pressable
          style={s.send}
          onPress={onSend}
          accessibilityRole="button"
          accessibilityLabel="Envoyer le message"
        >
          <Send size={16} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 14, gap: 8 },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signaler: { paddingVertical: 4, paddingHorizontal: 2 },
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

  /* Une bulle en échec reste LISIBLE : on ne la grise pas au point de ne
     plus pouvoir la relire. Un liseré suffit à dire que quelque chose
     cloche. */
  bubbleEchec: { borderWidth: 1, borderColor: C.bad },
  etat: { fontFamily: F.inter, fontSize: T.micro, color: C.muted, paddingTop: 2 },
  rangeeEchec: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingTop: 2, minHeight: 22,
  },
  etatEchec: { fontFamily: F.inter5, fontSize: T.micro, color: C.bad },
});
