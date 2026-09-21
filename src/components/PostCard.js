/**
 * Carte publication du fil classique (.post-card du prototype).
 * Gère aussi les publications sponsorisées (.ad-card).
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F, T, S, R, SH, interligne } from '../theme';
import {
  Gradient, Avatar, BtnMain, BtnMini, ChipFollow, IconBtn,
} from './ui';
import Commentaires, { nombreCommentaires } from './Commentaires';
import {
  BadgeCheck, EyeOff, Heart, MessageSquare, Share2, Bookmark,
  MessageCircle, Phone, FileText, User, Send, Maximize, Flag,
} from './icons';
import Media, { EtiquetteVideo } from './Media';
import Carrousel from './Carrousel';

/** Les formats qui se regardent aussi en plein écran dans le fil « Vidéos ». */
const EST_VIDEO = new Set(['video', 'montage']);

export default function PostCard({
  post, pro, pros = {}, following, actif = false,
  onLike, onFollow, onView, onHide, onOuvrirVideo, onSignaler,
  commentsOpen, onToggleComments, onAddComment, onVoirCommentateur,
  saved, onSave, contactOpen, onToggleContact, onContact, onShare,
}) {

  const estVideo = EST_VIDEO.has(post.format);

  /* Les photos de la publication. `medias` porte la série complète ; `media`
     reste la première, gardée pour les anciennes publications et pour les
     aperçus (notifications, partage) qui n'attendent qu'une image. */
  const photos = (post.medias && post.medias.length)
    ? post.medias
    : (post.media ? [post.media] : []);

  /* --- publication sponsorisée --- */
  if (post.type === 'ad') {
    return (
      <View style={s.card}>
        <Gradient media={post.media} style={{ width: '100%', height: 140 }} />
        <View style={s.adTag}><Text style={s.adTagText}>Sponsorisé</Text></View>
        <View>
          <Text style={s.adAnnonceur}>{post.annonceur}</Text>
          <Text style={s.postText}>{post.accroche}</Text>
          <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
            <BtnMain
              block
              label={post.cta}
              onPress={() => onShare(`Ouverture de "${post.annonceur}" (simulation).`)}
            />
          </View>
        </View>
      </View>
    );
  }

  if (!pro) return null;

  return (
    <View style={s.card}>
      {/* en-tête */}
      <View style={s.head}>
        <Pressable style={s.headLeft} onPress={() => onView(pro.id)}>
          <Avatar seed={pro.id} uri={pro.avatarUrl} />
          <View>
            <View style={s.nameRow}>
              <Text style={s.name}>{pro.entreprise}</Text>
              {pro.verifie && <BadgeCheck size={14} color={C.verif} />}
            </View>
            <Text style={s.meta}>{pro.metier} · {pro.ville} · {post.time}</Text>
          </View>
        </Pressable>
        <View style={s.headRight}>
          <ChipFollow following={following} onPress={() => onFollow(pro.id)} />
          {/* Deux gestes distincts, et deux icônes distinctes. « Masquer »
              range la publication pour soi ; « Signaler » l'envoie à la
              modération. Les cacher tous les deux derrière un « … » ferait
              qu'on ne trouverait ni l'un ni l'autre — or les magasins
              d'applications vérifient qu'un signalement se trouve. */}
          <IconBtn onPress={() => onHide(post.id)}><EyeOff size={15} color={C.ink} /></IconBtn>
          {!!onSignaler && (
            <IconBtn onPress={() => onSignaler({
              cibleType: 'publication',
              cibleId: post.id,
              auteurId: pro.id,
              auteurNom: pro.entreprise,
              extrait: post.texte,
            })}>
              <Flag size={14} color={C.muted} />
            </IconBtn>
          )}
        </View>
      </View>

      <Text style={s.postText}>{post.texte}</Text>
      {post.format === 'avantapres' && (post.medias || []).length > 1 ? (
        /* Avant/après : les deux photos côte à côte, chacune étiquetée.
           C'est la comparaison qui fait tout l'intérêt du format. */
        <View style={s.avantApres}>
          {post.medias.slice(0, 2).map((m, i) => (
            <View key={i} style={{ flex: 1 }}>
              <Media media={m} style={{ width: '100%', aspectRatio: 3 / 4 }} />
              <View style={s.etiquetteAA}>
                <Text style={s.etiquetteAATexte}>{i === 0 ? 'Avant' : 'Après'}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : estVideo ? (
        /* Une vidéo se filme debout : dans un cadre 16/10 on n'en voit qu'une
           bande. Le format 4/5 en montre beaucoup plus sans dévorer le fil —
           c'est le compromis retenu par Instagram.
           Et surtout, on peut la toucher : elle s'ouvre alors en plein écran,
           avec le son, à l'endroit exact où on l'a laissée dans le fil. */
        <Pressable onPress={() => onOuvrirVideo && onOuvrirVideo(post)}>
          <Media
            media={post.media}
            style={{ width: '100%', aspectRatio: 4 / 5, backgroundColor: C.dark }}
            lecture={actif}
            muet
          >
            <EtiquetteVideo />
            <View style={s.indicePleinEcran} pointerEvents="none">
              <Maximize size={12} color="#fff" />
              <Text style={s.indicePleinEcranTexte}>Voir en plein écran</Text>
            </View>
          </Media>
        </Pressable>
      ) : (
        /* Une photo, ou plusieurs qu'on fait défiler au doigt. Avec une seule
           image, le carrousel se retire complètement : ni points, ni
           compteur. */
        <Carrousel medias={photos} aspectRatio={16 / 10} />
      )}

      {/* barre d'actions */}
      <View style={s.actions}>
        <Pressable style={s.action} onPress={() => onLike(post.id)}>
          <Heart size={17} filled={post.liked} color={post.liked ? C.accent : C.muted} />
          <Text style={[s.actionText, post.liked && { color: C.accent }]}>{post.likes}</Text>
        </Pressable>
        <Pressable style={s.action} onPress={() => onToggleComments(post.id)}>
          <MessageSquare size={17} color={C.muted} />
          <Text style={s.actionText}>{nombreCommentaires(post.comments)}</Text>
        </Pressable>
        <Pressable style={s.action} onPress={() => onShare('Lien de la publication copié.')}>
          <Share2 size={16} color={C.muted} />
          <Text style={s.actionText}>Partager</Text>
        </Pressable>
        <Pressable style={s.action} onPress={() => onSave(post.id)}>
          <Bookmark size={16} filled={saved} color={saved ? C.accent : C.muted} />
        </Pressable>
        <View style={s.contactWrap}>
          <BtnMini label="Contacter" onPress={() => onToggleContact(post.id)} />
        </View>
      </View>

      {/* menu Contacter */}
      {contactOpen && (
        <View style={s.contactPop}>
          <ContactItem icon={<MessageCircle size={13} color={C.ink} />} label="Envoyer un message" onPress={() => onContact(pro, 'message')} />
          <ContactItem icon={<Phone size={13} color={C.ink} />} label="Être rappelé" onPress={() => onContact(pro, 'rappel')} />
          <ContactItem icon={<FileText size={13} color={C.ink} />} label="Demander un devis" onPress={() => onContact(pro, 'devis')} />
          <ContactItem icon={<User size={13} color={C.ink} />} label="Voir le profil" onPress={() => onView(pro.id)} last />
        </View>
      )}

      {/* commentaires */}
      {commentsOpen && (
        <View style={s.comments}>
          <Commentaires
            commentaires={post.comments}
            pros={pros}
            onVoirProfil={onVoirCommentateur}
            onSignaler={onSignaler}
            onEnvoyer={(texte, parentId) => onAddComment(post.id, texte, parentId)}
          />
        </View>
      )}
    </View>
  );
}

function ContactItem({ icon, label, onPress, last }) {
  return (
    <Pressable style={[s.contactItem, last && { borderBottomWidth: 0 }]} onPress={onPress}>
      {icon}
      <Text style={s.contactItemText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  /* Posé sur l'image, donc flottant, donc arrondi (règle dans theme.js). */
  indicePleinEcran: {
    position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: 'rgba(26,27,25,0.72)',
    paddingVertical: 4, paddingHorizontal: S.sm, borderRadius: R.gelule,
  },
  indicePleinEcranTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },
  avantApres: { flexDirection: 'row', gap: 2 },
  etiquetteAA: {
    position: 'absolute', left: S.sm, top: S.sm,
    backgroundColor: 'rgba(26,27,25,0.72)',
    paddingVertical: 3, paddingHorizontal: S.sm, borderRadius: R.gelule,
  },
  etiquetteAATexte: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },

  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 12, paddingBottom: 6,
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  meta: { fontSize: T.micro, color: C.muted, marginTop: 1, fontFamily: F.inter },

  postText: {
    fontSize: T.corps, paddingTop: S.xs, paddingHorizontal: S.md, paddingBottom: S.sm,
    lineHeight: interligne(T.corps), color: C.ink, fontFamily: F.inter,
  },

  actions: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 10, paddingHorizontal: 12, flexWrap: 'wrap',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: T.courant, color: C.muted, fontFamily: F.inter },
  contactWrap: { marginLeft: 'auto' },

  /* Ce menu FLOTTE au-dessus de la carte : légèrement arrondi, et une ombre
     de la même famille que partout ailleurs. */
  contactPop: {
    alignSelf: 'flex-end', width: 190, marginRight: S.md, marginBottom: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderRadius: R.doux, overflow: 'hidden',
    ...SH.flottant,
  },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  contactItemText: { fontSize: T.courant, color: C.ink, fontFamily: F.inter },

  comments: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingHorizontal: 12, paddingBottom: 10 },

  adTag: {
    position: 'absolute', top: S.sm, left: S.sm, zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 3, paddingHorizontal: S.sm, borderRadius: R.gelule,
  },
  adTagText: { color: '#fff', fontSize: T.micro, fontFamily: F.oswald },
  adAnnonceur: { fontFamily: F.oswald6, fontSize: T.corps, paddingTop: 6, paddingHorizontal: S.md, color: C.ink },
});
