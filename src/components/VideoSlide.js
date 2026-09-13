/**
 * Diapositive du fil vidéo plein écran (.feed-card du prototype).
 * Le défilement vertical page par page est géré par l'écran Accueil.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { Gradient, BtnMain, ChipFollow } from './ui';
import { BadgeCheck, Heart, MessageSquare, Share2, Bookmark, MapPin } from './icons';

function Scrim() {
  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.35)']}
      locations={[0, 0.45, 1]}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

export default function VideoSlide({
  post, pro, following, saved, height,
  onLike, onFollow, onSave, onView, onShare, onContact,
}) {
  /* --- publicité en plein écran --- */
  if (post.type === 'ad') {
    return (
      <Gradient media={post.media} style={[s.card, { height }]}>
        <Scrim />
        <View style={s.info}>
          <View style={[s.tag, { backgroundColor: '#fff' }]}><Text style={s.tagText}>Sponsorisé</Text></View>
          <Text style={s.feedName}>{post.annonceur}</Text>
          <Text style={s.feedText}>{post.accroche}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <BtnMain
              label={post.cta}
              onPress={() => onShare(`Ouverture de "${post.annonceur}" (simulation).`)}
            />
          </View>
        </View>
      </Gradient>
    );
  }

  if (!pro) return null;

  return (
    <Gradient media={post.media} style={[s.card, { height }]}>
      <Scrim />

      {/* actions sur le côté droit */}
      <View style={s.actions}>
        <Pressable style={s.action} onPress={() => onLike(post.id)}>
          <View style={s.actionIcon}>
            <Heart size={22} filled={post.liked} color={post.liked ? C.accent : '#fff'} />
          </View>
          <Text style={s.actionLabel}>{post.likes}</Text>
        </Pressable>
        <View style={s.action}>
          <View style={s.actionIcon}><MessageSquare size={22} color="#fff" /></View>
          <Text style={s.actionLabel}>{post.comments.length}</Text>
        </View>
        <Pressable style={s.action} onPress={() => onShare('Lien de la vidéo copié.')}>
          <View style={s.actionIcon}><Share2 size={20} color="#fff" /></View>
          <Text style={s.actionLabel}>Partager</Text>
        </Pressable>
        <Pressable style={s.action} onPress={() => onSave(post.id)}>
          <View style={s.actionIcon}>
            <Bookmark size={19} filled={saved} color={saved ? C.accent : '#fff'} />
          </View>
        </Pressable>
      </View>

      {/* informations en bas */}
      <View style={s.info}>
        <View style={s.tag}><Text style={s.tagText}>{pro.metier}</Text></View>
        <Pressable style={s.feedNameRow} onPress={() => onView(pro.id)}>
          <Text style={s.feedName}>{pro.entreprise}</Text>
          {pro.verifie && <BadgeCheck size={15} color={C.verif} />}
        </Pressable>
        <View style={s.loc}>
          <MapPin size={12} color="#fff" />
          <Text style={s.locText}>{pro.ville}</Text>
        </View>
        <Text style={s.feedText}>{post.texte}</Text>
        <View style={s.btnRow}>
          <ChipFollow video following={following} onPress={() => onFollow(pro.id)} />
          <BtnMain label="Contacter" onPress={() => onContact(pro, 'message')} />
        </View>
      </View>
    </Gradient>
  );
}

const s = StyleSheet.create({
  card: { width: '100%', justifyContent: 'flex-end' },

  actions: { position: 'absolute', right: 10, bottom: 150, zIndex: 2, gap: 16, alignItems: 'center' },
  action: { alignItems: 'center', gap: 3 },
  actionIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { color: '#fff', fontSize: 11, fontFamily: F.inter },

  info: { zIndex: 2, paddingHorizontal: 16, paddingBottom: 24 },
  tag: { alignSelf: 'flex-start', backgroundColor: C.accent, paddingVertical: 3, paddingHorizontal: 9, marginBottom: 8 },
  tagText: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },
  feedNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  feedName: { fontFamily: F.oswald6, fontSize: 16, color: '#fff' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locText: { fontSize: 11, color: '#fff', opacity: 0.85, fontFamily: F.inter },
  feedText: { fontSize: 13, color: '#fff', marginTop: 8, lineHeight: 18, maxWidth: 250, fontFamily: F.inter },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
});
