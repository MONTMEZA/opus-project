/**
 * UNE PUBLICATION, SEULE SUR SA PAGE.
 *
 * POURQUOI CETTE PAGE EXISTE — et c'est le troisième essai
 * ---------------------------------------------------------
 * Le propriétaire, trois fois de suite, sur son iPhone :
 *
 *   « Ça ouvre bien le post mais ça ne me dirige pas dessus, je suis
 *     obligé de le chercher à la main en descendant le fil. »
 *
 * Les deux premières corrections essayaient de FAIRE DÉFILER le fil jusqu'à
 * la bonne carte. Les deux ont échoué, et la seconde pour une raison qu'il
 * faut retenir :
 *
 * > **`scrollToIndex` ne sait pas sauter à une carte qui n'est pas montée**,
 * > et le fil n'en monte que deux au départ (lot 4 — ce réglage est celui
 * > qui a débloqué l'iPhone au démarrage, il ne bouge pas). Mesuré sur la
 * > vraie base : les commentaires visent des publications aux rangs 3 à 6.
 * > On peut rattraper le coup en sautant à une position approchée puis en
 * > recalant, mais ça reste une course contre la virtualisation — et
 * > **`react-native-web` ne virtualise pas comme iOS**, donc je ne peux
 * > rien éprouver ici. Mesuré : 4 cartes sur 4 montées au navigateur alors
 * > que le réglage en demande 2.
 *
 * Livrer une troisième correction invérifiable aurait été recommencer la
 * même faute. **On supprime donc le problème au lieu de le contrôler** :
 * il n'y a plus de fil à parcourir, plus de rang, plus de virtualisation —
 * la publication est seule à l'écran.
 *
 * C'est la règle du calendrier du 04/10, appliquée telle quelle : « le
 * meilleur message d'erreur est celui qu'on ne peut plus déclencher ».
 *
 * Et c'est aussi ce que font les applications qu'il connaît : toucher une
 * notification n'y ramène jamais dans le fil, ça ouvre la publication.
 *
 * CE QUE CETTE PAGE NE FAIT PAS, ET POURQUOI
 * ------------------------------------------
 * Elle ne recharge rien : `OpusApp` lui passe la publication qu'il a déjà,
 * et va la chercher en base quand elle n'est pas dans la page chargée —
 * c'est le même chemin qu'avant, il marchait, on n'y touche pas.
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { C, S, GOUTTIERE } from '../theme';
import { EmptyState } from '../components/ui';
import PostCard from '../components/PostCard';
import { MessageSquare } from '../components/icons';

export default function PublicationScreen({
  post, pros = {}, chantiers = [], commentaireCible = null,
  followingIds, savedIds, openContactId, moiId,
  onLike, onFollow, onView, onHide, onOuvrirVideo, onSignaler,
  onAddComment, onVoirCommentateur, onSave, onToggleContact, onContact,
  onShare, onSupprimerCommentaire, onModifierCommentaire, onOuvrirChantier,
}) {
  /* Une publication supprimée entre-temps, ou qu'on n'a pas le droit de
     lire : on le DIT. Un écran vide ressemblerait à un chargement qui ne
     finit pas — et le message d'`OpusApp` (« cette publication n'est plus
     disponible ») ne s'affiche que si la recherche en base a échoué. */
  if (!post) {
    return (
      <EmptyState icone={MessageSquare} titre="Publication introuvable">
        Elle a peut-être été supprimée depuis que la notification est
        arrivée.
      </EmptyState>
    );
  }

  const pro = pros[post.proId] || null;
  const chantier = post.chantierId
    ? chantiers.find((c) => String(c.id) === String(post.chantierId)) || null
    : null;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={s.contenu}
      /* Sans lui, le premier appui sur « Répondre » alors que le clavier
         est ouvert ne fait que refermer le clavier. La leçon de
         `FeuilleBas`, et elle vaut pour tout conteneur défilant qui porte
         des champs. */
      keyboardShouldPersistTaps="handled"
    >
      <PostCard
        post={post}
        pro={pro}
        pros={pros}
        chantier={chantier}
        onOuvrirChantier={onOuvrirChantier}
        following={pro ? followingIds.has(post.proId) : false}
        saved={savedIds.has(post.id)}
        onSave={onSave}
        moiId={moiId}
        /* LE PANNEAU EST OUVERT D'OFFICE : on arrive ici par une
           notification de commentaire, donc c'est précisément ce qu'on
           vient lire. Et `onToggleComments` n'est pas transmis — il n'y a
           rien à replier sur une page qui ne contient que ça. */
        commentsOpen
        commentaireCible={commentaireCible}
        onAddComment={onAddComment}
        onVoirCommentateur={onVoirCommentateur}
        onSupprimerCommentaire={onSupprimerCommentaire}
        onModifierCommentaire={onModifierCommentaire}
        contactOpen={openContactId === post.id}
        onToggleContact={onToggleContact}
        onContact={onContact}
        onLike={onLike}
        onFollow={onFollow}
        onView={onView}
        onHide={onHide}
        onOuvrirVideo={onOuvrirVideo}
        onSignaler={onSignaler}
        onShare={onShare}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  /* `contentContainerStyle`, pas `style` — voir GOUTTIERE dans theme.js. */
  contenu: {
    paddingHorizontal: GOUTTIERE,
    paddingTop: S.md,
    paddingBottom: S.xxl,
    backgroundColor: C.bg,
  },
});
