/**
 * 5b. Messages — détail d'une conversation.
 * Bulles à droite pour moi, à gauche pour l'artisan. (.conv-wrap du prototype)
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, Pressable, KeyboardAvoidingView, Platform, Linking, StyleSheet,
} from 'react-native';
import { C, F, T, S, R, APPUI, interligne, viser } from '../theme';
import { EmptyState } from '../components/ui';
import ChampLocal from '../components/ChampLocal';
import { Send, Flag, AlertTriangle, FileText, X } from '../components/icons';
import { choisirDocument } from '../lib/media';
import { refusPiece, urlPiece } from '../lib/api';
import * as retour from '../lib/retour';
import { messageClair } from '../lib/erreurs';

/** « 182 ko », « 2,4 Mo » — jamais un nombre d'octets brut. */
export function poidsLisible(octets) {
  if (!octets) return '';
  if (octets < 1024 * 1024) return `${Math.max(1, Math.round(octets / 1024))} ko`;
  return `${(octets / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

/**
 * LA PIÈCE JOINTE, DANS LA BULLE.
 *
 * On ne range PAS d'adresse ouverte dans le message : l'espace est privé, et
 * l'adresse se demande au moment où on touche — signée, valable cinq
 * minutes. Une adresse éternelle posée dans une conversation finirait par
 * circuler toute seule.
 */
function PieceJointe({ piece, clair, onErreur }) {
  const [ouverture, setOuverture] = useState(false);

  const ouvrir = async () => {
    if (ouverture) return;
    setOuverture(true);
    try {
      const url = await urlPiece(piece.chemin);
      if (!url) throw new Error('Ce fichier n’est plus disponible.');
      Linking.openURL(url).catch(() => {});
    } catch (e) {
      retour.echec();
      if (onErreur) onErreur(messageClair(e));
    } finally { setOuverture(false); }
  };

  return (
    <Pressable
      onPress={ouvrir}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${piece.nom || 'la pièce jointe'}`}
      style={({ pressed }) => [s.piece, pressed && APPUI.discret]}
    >
      <FileText size={15} color={clair ? '#fff' : C.accentTexte} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[s.pieceNom, clair && { color: '#fff' }]}>
          {piece.nom || 'Pièce jointe'}
        </Text>
        <Text style={[s.piecePoids, clair && { color: 'rgba(255,255,255,0.75)' }]}>
          {ouverture ? 'Ouverture…' : poidsLisible(piece.taille)}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * UNE BULLE, isolée et mémorisée.
 *
 * Dans une liste virtualisée, React redessine chaque ligne visible dès que
 * l'écran se redessine. `memo` l'en empêche tant que le message n'a pas
 * changé — ce qui, pour un message déjà envoyé, n'arrive jamais.
 */
const Bulle = React.memo(function Bulle({ m, onRenvoyer, onSignaler, interlocuteur, onErreur }) {
  return (
    <View style={s.rangee}>
      {/* `flex: 1` N'EST PAS DÉCORATIF ICI. Sans lui, ce bloc se dimensionne
          sur son contenu, et le `maxWidth: '75%'` de la bulle se calcule
          alors sur… lui-même. Mesuré au navigateur : la rangée de la pièce
          jointe faisait 196 px et la bulle 175, donc le nom du fichier
          débordait du cadre sombre. Avec `flex: 1`, les 75 % se comptent
          enfin sur la largeur de l'écran. */}
      <View style={{
        flex: 1, alignItems: m.from === 'moi' ? 'flex-end' : 'flex-start',
      }}>
        <View style={[
          s.bubble, m.from === 'moi' && s.bubbleMoi,
          m.etat === 'echec' && s.bubbleEchec,
        ]}>
          {!!m.piece && (
            <PieceJointe piece={m.piece} clair={m.from === 'moi'} onErreur={onErreur} />
          )}
          {/* Un message qui ne porte QU'un fichier n'a pas de texte : la
              base l'autorise (section 28), et une ligne vide laisserait un
              blanc sous la pièce. */}
          {!!(m.texte || '').trim() && (
            <Text style={[s.bubbleText, m.from === 'moi' && { color: '#fff' }]}>{m.texte}</Text>
          )}
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
            hitSlop={viser(24)}
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
          hitSlop={viser(24)}
          style={s.signaler}
          accessibilityRole="button"
          accessibilityLabel="Signaler ce message"
          onPress={() => onSignaler({
            cibleType: 'message',
            cibleId: m.id,
            auteurId: m.auteurId,
            auteurNom: interlocuteur || 'cette personne',
            extrait: m.texte || (m.piece ? `(pièce jointe : ${m.piece.nom})` : ''),
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
  chargement = false, onRenvoyer, amorce = '', onAmorceUtilisee, onErreur,
}) {
  /* LE BROUILLON NE VIT PLUS DANS `OpusApp`.
     Il y était, et chaque lettre redessinait donc toute l'application —
     132 ms par lettre au navigateur, processeur bridé six fois. Dans une
     messagerie, c'est précisément l'endroit où l'on tape le plus vite.
     Rien ici n'a besoin de connaître le texte avant l'envoi : il n'y a
     même pas de bouton à éteindre. Le champ le garde donc entièrement. */
  const brouillon = useRef(null);

  /* LA PIÈCE CHOISIE VIT ICI, et pas dans `OpusApp` : c'est la même règle
     que le brouillon. Elle ne concerne que cet écran, et la remonter
     ferait redessiner toute l'application pour un nom de fichier. */
  const [piece, setPiece] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const joindre = async () => {
    try {
      const f = await choisirDocument();
      if (!f) return;
      /* On refuse AVANT de monter le fichier. Le serveur refuserait de
         toute façon, mais au bout de l'envoi — trois minutes d'attente en
         4G sur un chantier, pour un message que personne ne lit. */
      const refus = refusPiece(f);
      if (refus) { retour.echec(); if (onErreur) onErreur(refus); return; }
      retour.prise();
      setPiece(f);
    } catch (e) {
      if (onErreur) onErreur(messageClair(e));
    }
  };

  const envoyer = async () => {
    if (envoiEnCours) return;
    const t = brouillon.current ? brouillon.current.lire() : '';
    /* Un fichier seul suffit : la base accepte un message sans texte dès
       qu'il porte une pièce. */
    if (!t.trim() && !piece) return;
    setEnvoiEnCours(true);
    try {
      await onSend(t, piece);
      brouillon.current.vider();
      setPiece(null);
    } finally {
      setEnvoiEnCours(false);
    }
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
            onErreur={onErreur}
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

      {/* CE QUI VA PARTIR, AVANT QUE ÇA PARTE. Sans cet aperçu, on choisit
          un fichier et plus rien ne bouge à l'écran : on croit que le
          trombone n'a pas marché, et on recommence. */}
      {!!piece && (
        <View style={s.apercu}>
          <FileText size={15} color={C.accentTexte} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={s.pieceNom}>{piece.nom}</Text>
            <Text style={s.piecePoids}>{poidsLisible(piece.taille)}</Text>
          </View>
          <Pressable
            onPress={() => { retour.prise(); setPiece(null); }}
            hitSlop={viser(24)}
            accessibilityRole="button"
            accessibilityLabel="Retirer la pièce jointe"
            style={({ pressed }) => [pressed && APPUI.discret]}
          >
            <X size={15} color={C.muted} />
          </Pressable>
        </View>
      )}

      <View style={s.inputRow}>
        <Pressable
          style={({ pressed }) => [s.trombone, pressed && APPUI.discret]}
          onPress={joindre}
          accessibilityRole="button"
          accessibilityLabel="Joindre un fichier"
        >
          <FileText size={16} color={C.ink} />
        </Pressable>
        <ChampLocal
          ref={brouillon}
          amorce={amorce}
          onAmorceUtilisee={onAmorceUtilisee}
          style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 12, fontSize: T.corps }}
          placeholder="Écrire un message..."
          onSubmitEditing={envoyer}
          returnKeyType="send"
        />
        <Pressable
          style={s.send}
          onPress={envoyer}
          accessibilityRole="button"
          accessibilityLabel="Envoyer le message"
          disabled={envoiEnCours}
        >
          <Send size={16} color={envoiEnCours ? 'rgba(255,255,255,0.5)' : '#fff'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

/* La place qu'il faut pour lire un nom de fichier, en points. Mesuré au
   navigateur : en dessous, le nom se coupe avant d'être reconnaissable. */
const LARGEUR_PIECE = 196;

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
  bubbleText: { fontSize: T.corps, color: C.ink, fontFamily: F.inter },
  inputRow: {
    flexDirection: 'row', gap: 8, paddingVertical: 10, paddingHorizontal: 12,
    borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.surface,
  },
  send: { backgroundColor: C.ink, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  /* 44 points de haut et de large : la mesure d'Apple, et celle d'un doigt
     ganté. Le trombone est un bouton comme un autre. */
  trombone: {
    width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.bordChamp, borderRadius: R.vif,
  },

  /* DE QUOI LIRE UN NOM DE FICHIER.
     Sans largeur minimale, la bulle se dimensionne sur le TEXTE du
     message : « Voici le devis. » donnait une bulle étroite, et le nom du
     fichier s'affichait « devis-e… ». Or c'est l'information principale
     d'une pièce jointe — deux devis du même chantier deviennent sinon
     indiscernables, et on ouvre le mauvais.
     La bulle reste bornée à 75 % de la largeur : ce minimum ne fait que
     l'empêcher de se replier sur elle-même. */
  piece: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    minHeight: 44, paddingVertical: S.xs, minWidth: LARGEUR_PIECE,
  },
  pieceNom: { fontFamily: F.inter6, fontSize: T.courant, color: C.accentTexte },
  piecePoids: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted,
    lineHeight: interligne(T.micro),
  },
  apercu: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingVertical: S.sm, paddingHorizontal: S.md,
    backgroundColor: C.okBg, borderTopWidth: 1, borderTopColor: C.line,
  },

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
