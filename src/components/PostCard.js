/**
 * Carte publication du fil classique (.post-card du prototype).
 * Gère aussi les publications sponsorisées (.ad-card).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import {
  Gradient, Avatar, BtnMain, BtnMini, ChipFollow, IconBtn, Field,
} from './ui';
import {
  BadgeCheck, EyeOff, Heart, MessageSquare, Share2, Bookmark,
  MessageCircle, Phone, FileText, User, Send, Play,
} from './icons';

export default function PostCard({
  post, pro, following, onLike, onFollow, onView, onHide,
  commentsOpen, onToggleComments, onAddComment,
  saved, onSave, contactOpen, onToggleContact, onContact, onShare,
}) {
  const [draft, setDraft] = useState('');

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
          <IconBtn onPress={() => onHide(post.id)}><EyeOff size={15} color={C.ink} /></IconBtn>
        </View>
      </View>

      <Text style={s.postText}>{post.texte}</Text>
      {/* Une vidéo reste visible dans le fil, mais se signale comme telle :
          la pastille dit qu'elle se regarde aussi en plein écran. */}
      <Gradient media={post.media} style={{ width: '100%', aspectRatio: 16 / 10 }}>
        {post.format === 'video' && (
          <View style={s.pastilleVideo}>
            <Play size={13} color="#fff" />
            <Text style={s.pastilleVideoTexte}>Vidéo</Text>
          </View>
        )}
      </Gradient>

      {/* barre d'actions */}
      <View style={s.actions}>
        <Pressable style={s.action} onPress={() => onLike(post.id)}>
          <Heart size={17} filled={post.liked} color={post.liked ? C.accent : C.muted} />
          <Text style={[s.actionText, post.liked && { color: C.accent }]}>{post.likes}</Text>
        </Pressable>
        <Pressable style={s.action} onPress={() => onToggleComments(post.id)}>
          <MessageSquare size={17} color={C.muted} />
          <Text style={s.actionText}>{post.comments.length}</Text>
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
          {post.comments.map((c) => (
            <Text style={s.commentRow} key={c.id}>
              <Text style={s.commentAuthor}>{c.auteur}</Text> {c.texte}
            </Text>
          ))}
          {post.comments.length === 0 && (
            <Text style={s.commentEmpty}>Aucun commentaire pour l'instant.</Text>
          )}
          <View style={s.commentInputRow}>
            <Field
              style={{ flex: 1, borderColor: C.line, paddingVertical: 7, paddingHorizontal: 10 }}
              placeholder="Ajouter un commentaire..."
              value={draft}
              onChangeText={setDraft}
            />
            <Pressable
              style={s.commentSend}
              onPress={() => {
                if (draft.trim()) { onAddComment(post.id, draft.trim()); setDraft(''); }
              }}
            >
              <Send size={14} color="#fff" />
            </Pressable>
          </View>
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
  pastilleVideo: {
    position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: 'rgba(26,27,25,0.72)', paddingVertical: 4, paddingHorizontal: 8,
  },
  pastilleVideoTexte: { fontFamily: F.oswald6, fontSize: 10.5, color: '#fff' },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },

  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, paddingHorizontal: 12, paddingBottom: 6,
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontFamily: F.inter6, fontSize: 13, color: C.ink },
  meta: { fontSize: 10.5, color: C.muted, marginTop: 1, fontFamily: F.inter },

  postText: {
    fontSize: 12.8, paddingTop: 4, paddingHorizontal: 12, paddingBottom: 8,
    lineHeight: 18, color: C.ink, fontFamily: F.inter,
  },

  actions: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 10, paddingHorizontal: 12, flexWrap: 'wrap',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, color: C.muted, fontFamily: F.inter },
  contactWrap: { marginLeft: 'auto' },

  contactPop: {
    alignSelf: 'flex-end', width: 190, marginRight: 12, marginBottom: 10,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  contactItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  contactItemText: { fontSize: 12, color: C.ink, fontFamily: F.inter },

  comments: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingHorizontal: 12, paddingBottom: 10 },
  commentRow: { fontSize: 12, paddingVertical: 4, color: C.ink, fontFamily: F.inter },
  commentAuthor: { fontFamily: F.inter6 },
  commentEmpty: { fontSize: 11.5, color: C.muted, paddingVertical: 4, fontFamily: F.inter },
  commentInputRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  commentSend: { backgroundColor: C.ink, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },

  adTag: {
    position: 'absolute', top: 8, left: 8, zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.65)', paddingVertical: 3, paddingHorizontal: 8,
  },
  adTagText: { color: '#fff', fontSize: 10, fontFamily: F.oswald },
  adAnnonceur: { fontFamily: F.oswald6, fontSize: 13, paddingTop: 6, paddingHorizontal: 12, color: C.ink },
});
