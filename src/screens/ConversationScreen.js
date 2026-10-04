/**
 * 5b. Messages — détail d'une conversation.
 * Bulles à droite pour moi, à gauche pour l'artisan. (.conv-wrap du prototype)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, Pressable, KeyboardAvoidingView, Platform, Linking, StyleSheet,
} from 'react-native';
import { C, F, T, S, R, APPUI, interligne, viser } from '../theme';
import { EmptyState } from '../components/ui';
import ChampLocal from '../components/ChampLocal';
import { Send, Flag, AlertTriangle, FileText, Paperclip, X } from '../components/icons';
import { choisirPieceJointe } from '../lib/media';
import ChoixPiece from '../components/ChoixPiece';
import Media from '../components/Media';
import { cadreApercuMessage } from '../lib/cadre';
import { refusPiece, urlPiece, urlsPieces } from '../lib/api';
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
export function estPhoto(piece) {
  return !!piece && typeof piece.type === 'string' && piece.type.startsWith('image/');
}

/**
 * UNE PHOTO SE VOIT, ELLE NE SE LIT PAS.
 *
 * Demandé par le propriétaire le 04/10/2026 : « je préfère que la photo se
 * voie directement sur la conversation ». Et c'est juste : un nom de
 * fichier comme « photo-2026-10-04-1530.jpg » ne porte AUCUNE information.
 * Sur un chantier, la photo EST le message — « regarde cette fissure » —,
 * alors qu'un devis en PDF, lui, se reconnaît à son nom.
 *
 * LA FORME SUIT LA PHOTO, entre deux bornes (`cadrePhoto`, la même règle
 * que le fil) : une fissure est verticale, un mur est horizontal, et aucun
 * cadre fixe ne convient aux deux. Tant que l'image n'est pas chargée, le
 * carré — la forme la plus fréquente, donc celle qui bougera le moins.
 *
 * ET UNE HAUTEUR MAXIMALE, qui n'est pas dans `cadre.js` : dans le fil, une
 * photo haute coûte un geste de défilement ; dans une conversation, elle
 * pousse hors de l'écran les messages qui l'entourent, et on perd le fil de
 * ce qui se dit.
 */
const HAUTEUR_MAX_APERCU = 260;

function ApercuPhoto({ piece, apercu, clair, onOuvrir, ouverture }) {
  const [rapport, setRapport] = useState(null);
  const mesurer = useCallback((r) => setRapport(r), []);

  /* Tant que l'adresse signée n'est pas arrivée — ou si elle n'arrive
     jamais, fichier retiré, droit refusé —, on garde la ligne « nom +
     poids ». Elle reste parfaitement utilisable : on peut toujours toucher
     pour ouvrir. Un trou gris, lui, ressemblerait à une panne. */
  if (!apercu) return null;

  const { cadre, largeur } = cadreApercuMessage(
    rapport, LARGEUR_PIECE + 2 * S.md, HAUTEUR_MAX_APERCU,
  );

  return (
    <Pressable
      onPress={onOuvrir}
      accessibilityRole="imagebutton"
      accessibilityLabel={`Photo ${piece.nom || ''} — toucher pour l’agrandir`}
      style={({ pressed }) => [pressed && APPUI.plein]}
    >
      <Media
        media={apercu}
        onRatio={mesurer}
        style={{ width: largeur, aspectRatio: cadre }}
      />
      {!!ouverture && (
        <Text style={[s.piecePoids, s.enCours, clair && { color: 'rgba(255,255,255,0.75)' }]}>
          Ouverture…
        </Text>
      )}
    </Pressable>
  );
}

function PieceJointe({ piece, apercu, clair, onErreur }) {
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

  /* UNE PHOTO SE MONTRE, UN DOCUMENT SE NOMME. Le nom d'une photo ne dit
     rien, celui d'un devis dit tout — et un PDF n'a de toute façon pas de
     vignette. */
  if (estPhoto(piece) && apercu) {
    return (
      <ApercuPhoto
        piece={piece}
        apercu={apercu}
        clair={clair}
        ouverture={ouverture}
        onOuvrir={ouvrir}
      />
    );
  }

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
const Bulle = React.memo(function Bulle({
  m, apercu, onRenvoyer, onSignaler, interlocuteur, onErreur,
}) {
  /* UNE BULLE-PHOTO N'A PAS DE MARGE. Avec le remplissage ordinaire, la
     photo apparaissait au milieu d'un cadre sombre épais : on dirait une
     image encadrée, pas une photo envoyée. Le texte, lui, garde sa marge —
     collé au bord, il serait illisible. */
  const photoVisible = estPhoto(m.piece) && !!apercu;

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
          photoVisible && s.bubblePhoto,
          m.etat === 'echec' && s.bubbleEchec,
        ]}>
          {!!m.piece && (
            <PieceJointe
              piece={m.piece}
              apercu={apercu}
              clair={m.from === 'moi'}
              onErreur={onErreur}
            />
          )}
          {/* Un message qui ne porte QU'un fichier n'a pas de texte : la
              base l'autorise (section 28), et une ligne vide laisserait un
              blanc sous la pièce. */}
          {!!(m.texte || '').trim() && (
            <Text style={[
              s.bubbleText,
              photoVisible && s.texteSousPhoto,
              m.from === 'moi' && { color: '#fff' },
            ]}>
              {m.texte}
            </Text>
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
  /* OÙ EST LE FICHIER ? Le trombone ouvrait Fichiers directement, et sur
     iPhone la photothèque n'y apparaît pas : impossible d'envoyer la photo
     qu'on vient de prendre. Signalé par le propriétaire le 04/10/2026. */
  const [choixOuvert, setChoixOuvert] = useState(false);

  const joindre = async (depuis) => {
    setChoixOuvert(false);
    try {
      const f = await choisirPieceJointe(depuis);
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
  /* LES APERÇUS DES PHOTOS, EN UNE SEULE REQUÊTE POUR TOUTE LA
     CONVERSATION.
     L'espace est privé : une photo ne s'affiche qu'avec une adresse
     signée. Une par bulle ferait vingt requêtes sur une conversation de
     vingt photos — sur un chantier en 4G, ça se sent. `urlsPieces()` les
     signe toutes d'un coup.
     On ne redemande QUE ce qu'on n'a pas : la liste des chemins manquants
     ne change pas tant qu'aucune photo n'arrive, donc l'effet ne repart
     pas en boucle. */
  const [apercus, setApercus] = useState({});
  const aSigner = useMemo(() => {
    const vus = new Set();
    (conversation.messages || []).forEach((m) => {
      if (estPhoto(m.piece) && m.piece.chemin && !apercus[m.piece.chemin]) {
        vus.add(m.piece.chemin);
      }
    });
    return [...vus].sort().join('|');
  }, [conversation.messages, apercus]);

  useEffect(() => {
    if (!aSigner) return undefined;
    let vivant = true;
    urlsPieces(aSigner.split('|'))
      .then((par) => {
        /* Un écran démonté pendant la requête ne doit pas poser son état :
           c'est l'avertissement React qu'on voit sinon en quittant vite une
           conversation. */
        if (vivant && Object.keys(par).length) setApercus((a) => ({ ...a, ...par }));
      })
      /* UNE VIGNETTE QUI MANQUE N'EST PAS UNE PANNE : la bulle retombe sur
         la ligne « nom + poids », et on peut toujours toucher pour ouvrir.
         Un bandeau rouge, lui, ferait croire que le message est perdu. */
      .catch(() => {});
    return () => { vivant = false; };
  }, [aSigner]);

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
            /* ON PASSE UNE CHAÎNE, PAS LE DICTIONNAIRE. `Bulle` est
               mémorisée : lui donner l'objet entier la ferait redessiner à
               chaque nouvelle adresse signée, pour les vingt bulles à la
               fois. C'est le piège du lot 4, rencontré avec
               `jyAiRepondu`. */
            apercu={item.piece ? apercus[item.piece.chemin] : undefined}
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
          onPress={() => setChoixOuvert(true)}
          accessibilityRole="button"
          accessibilityLabel="Joindre une photo ou un fichier"
        >
          <Paperclip size={16} color={C.ink} />
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
      <ChoixPiece
        ouvert={choixOuvert}
        onChoisir={joindre}
        onFermer={() => setChoixOuvert(false)}
      />
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
  /* DEUX PIÈGES DANS CES TROIS VALEURS, et les deux se voient à l'œil.

     1. `padding: 0` N'ANNULE PAS `paddingVertical`. React Native aplatit
        les styles par PRÉCISION, pas par ordre : la forme longue l'emporte
        sur la forme courte, où qu'elle soit écrite. Une bulle-photo gardait
        donc son cadre sombre de 8 × 12 px, et la photo avait l'air encadrée
        plutôt qu'envoyée. Il faut annuler ce qu'on a posé.
     2. `overflow: 'hidden'` fait suivre les coins de la bulle à la photo.
        Sans lui, l'image dépasse du rayon et les angles redeviennent
        vifs — or une bulle flotte, donc elle s'arrondit. */
  bubblePhoto: { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' },
  texteSousPhoto: { paddingVertical: S.sm, paddingHorizontal: S.md },
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
