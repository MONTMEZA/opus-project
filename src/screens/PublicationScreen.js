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
import { CLAVIER } from '../lib/clavier';
import { estMienne } from '../lib/ma-fiche';

export default function PublicationScreen({
  post, pros = {}, chantiers = {}, commentaireCible = null,
  followingIds, savedIds, openContactId, moiId, maFicheId = null,
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
        {/* Une phrase qui vaut pour les DEUX portes (lot S-c) : la cloche,
            et « Mes publications ». « Depuis que la notification est
            arrivée » était faux pour la seconde. */}
        Elle a peut-être été supprimée entre-temps.
      </EmptyState>
    );
  }

  const pro = pros[post.proId] || null;
  /* LE DICTIONNAIRE DES CHANTIERS, comme le fil (`HomeScreen`) : `OpusApp`
     le passe tel quel, indexé par identifiant. L'écran le parcourait comme
     une LISTE (`chantiers.find`) : toute notification qui menait à une
     publication rangée dans un chantier faisait planter l'application —
     écran blanc, « chantiers.find is not a function ». Vrai depuis le
     07/10, et invisible tant que la publication essayée n'avait pas de
     chantier. Trouvé en filmant la démonstration, le 25/10. */
  const chantier = post.chantierId ? (chantiers[post.chantierId] || null) : null;

  return (
    <ScrollView
      /* Le panneau des commentaires est ouvert d'office sur cette page :
         on y ÉCRIT. `CLAVIER` fait les deux choses qu'il faut — le premier
         appui sur « Répondre » agit même clavier ouvert, et le champ
         remonte au-dessus du clavier au lieu de rester dessous. */
      {...CLAVIER}
      style={{ flex: 1 }}
      contentContainerStyle={s.contenu}
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
        /* Une notification mène souvent à SA publication (« X a commenté
           votre publication ») : c'est exactement là qu'il ne faut ni
           « Suivre » ni « Contacter ». Même règle que le fil. */
        mienne={estMienne(post, maFicheId)}
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
