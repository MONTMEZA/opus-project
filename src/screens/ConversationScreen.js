/**
 * 5b. Messages — détail d'une conversation.
 * Bulles à droite pour moi, à gauche pour l'artisan. (.conv-wrap du prototype)
 */
import React, { useMemo, useRef } from 'react';
import {
  View, Text, FlatList, Pressable, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { C, F, T, APPUI } from '../theme';
import { EmptyState } from '../components/ui';
import ChampLocal from '../components/ChampLocal';
import { Send, Flag, AlertTriangle } from '../components/icons';

/**
 * UNE BULLE, isolée et mémorisée.
 *
 * Dans une liste virtualisée, React redessine chaque ligne visible dès que
 * l'écran se redessine. `memo` l'en empêche tant que le message n'a pas
 * changé — ce qui, pour un message déjà envoyé, n'arrive jamais.
 */
const Bulle = React.memo(function Bulle({ m, onRenvoyer, onSignaler, interlocuteur }) {
  return (
    <View style={s.rangee}>
      <View style={{ alignItems: m.from === 'moi' ? 'flex-end' : 'flex-start' }}>
        <View style={[
          s.bubble, m.from === 'moi' && s.bubbleMoi,
          m.etat === 'echec' && s.bubbleEchec,
        ]}>
          <Text style={[s.bubbleText, m.from === 'moi' && { color: '#fff' }]}>{m.texte}</Text>
        </View>

        {/* L'ÉTAT DE L'ENVOI, SOUS LA BULLE.
            Sans lui, un message qui n'est jamais parti ressemblait trait
            pour trait à un message reçu par son destinataire — et on
            continuait la conversation tout seul. */}
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

      {/* Un message reçu se signale. C'est souvent là, et pas dans le fil,
          que commencent les menaces et les arnaques — et c'est le seul
          endroit où personne d'autre ne peut le voir. */}
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
  );
});

export default function ConversationScreen({
  conversation, onSend, onSignaler, interlocuteur,
  chargement = false, onRenvoyer,
}) {
  /* LE BROUILLON NE VIT PLUS DANS `OpusApp`.
     Il y était, et chaque lettre redessinait donc toute l'application —
     132 ms par lettre au navigateur, processeur bridé six fois. Dans une
     messagerie, c'est précisément l'endroit où l'on tape le plus vite.
     Rien ici n'a besoin de connaître le texte avant l'envoi : il n'y a
     même pas de bouton à éteindre. Le champ le garde donc entièrement. */
  const brouillon = useRef(null);
  const envoyer = () => {
    const t = brouillon.current ? brouillon.current.lire() : '';
    if (!t.trim()) return;
    onSend(t);
    brouillon.current.vider();
  };
  /* La liste est INVERSÉE : on lui donne donc les messages à l'envers, du
     plus récent au plus ancien. `useMemo` pour ne pas refabriquer ce
     tableau à chaque frappe — ce serait reprendre d'une main ce que le
     champ local vient de nous rendre. */
  const messagesInverses = useMemo(
    () => [...(conversation.messages || [])].reverse(),
    [conversation.messages],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* UNE LISTE INVERSÉE, et c'est le bon outil pour une conversation.
          Avant : un `ScrollView` qui montait TOUS les messages, plus un
          `scrollToEnd` déclenché à chaque changement de taille. Sur une
          conversation de six mois, c'est des centaines de bulles créées
          pour en voir cinq.
          `inverted` retourne la liste : le dernier message est en haut des
          données et en bas de l'écran, donc on démarre au bon endroit sans
          rien faire défiler, et les anciens messages ne sont montés que si
          on remonte les chercher. */}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        data={messagesInverses}
        keyExtractor={(m, i) => String(m.cle || m.id || i)}
        inverted
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Bulle
            m={item}
            onRenvoyer={onRenvoyer}
            onSignaler={onSignaler}
            interlocuteur={interlocuteur}
          />
        )}
        ListFooterComponent={(
          <>
            {/* On dit que ça charge, au lieu d'afficher « Dites bonjour »
                sur une conversation qui a dix messages mais qui n'est pas
                encore arrivée. En bas du composant car la liste est
                inversée : ce pied s'affiche donc EN HAUT. */}
            {chargement && <EmptyState>Chargement…</EmptyState>}
            {!chargement && conversation.messages.length === 0 && (
              <EmptyState>Dites bonjour 👋</EmptyState>
            )}
          </>
        )}
      />

      <View style={s.inputRow}>
        <ChampLocal
          ref={brouillon}
          style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 12, fontSize: 12.5 }}
          placeholder="Écrire un message..."
          onSubmitEditing={envoyer}
          returnKeyType="send"
        />
        <Pressable
          style={s.send}
          onPress={envoyer}
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
