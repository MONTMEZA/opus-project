/**
 * Diapositive du fil vidéo plein écran (.feed-card du prototype).
 * La diapositive occupe toute la hauteur de l'écran : la barre du haut et la
 * navigation du bas flottent par-dessus, comme sur TikTok. `bottomInset`
 * réserve la place de cette navigation pour que le texte ne passe pas dessous.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { Gradient, BtnMain, ChipFollow, Avatar, HazardStrip } from './ui';
import { nombreCommentaires } from './Commentaires';
import Media, { estFichier } from './Media';
import LecteurMontage from './LecteurMontage';
import GlissementLateral from './GlissementLateral';
import {
  BadgeCheck, Heart, MessageSquare, Share2, Bookmark, MapPin, ChevronRight, Home,
} from './icons';

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
  post, pro, following, saved, height, bottomInset = 0, actif = true,
  onLike, onFollow, onSave, onView, onShare, onContact, onComment,
  onGlisserVersProfil, onGlisserVersFil,
}) {
  const infoPad = 24 + bottomInset;
  const clips = post.medias && post.medias.length ? post.medias : [post.media];

  /* --- publicité en plein écran --- */
  if (post.type === 'ad') {
    return (
      <Gradient media={post.media} style={[s.card, { height }]}>
        <Scrim />
        <View style={[s.info, { paddingBottom: infoPad }]}>
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

  /* Trois cas, du meilleur au moins bon :

     1. le montage a été assemblé en UN SEUL fichier par Cloudinary : on le lit
        comme une vidéo ordinaire, et il n'y a par construction aucun passage
        d'un clip à l'autre ;
     2. pas de fichier assemblé, mais de vrais clips : on les enchaîne avec
        deux lecteurs qui s'alternent ;
     3. ni l'un ni l'autre — les dégradés des données de démonstration : on
        affiche simplement, un lecteur vidéo ne saurait quoi en faire. */
  const montageAssemble = post.format === 'montage' && estFichier(post.montageUrl);
  const clipsEnchaines = post.format === 'montage' && !montageAssemble
    && clips.every(estFichier);

  const Surface = clipsEnchaines ? LecteurMontage : Media;
  const proprietes = clipsEnchaines
    ? { clips, musique: post.musique, actif }
    : { media: montageAssemble ? post.montageUrl : post.media, lecture: actif, muet: false };

  /* Glissements façon TikTok. Le doigt part à GAUCHE : la page de l'artisan
     arrive par la droite. Le doigt part à DROITE : on revient au fil. C'est
     le sens qu'ont TikTok et Instagram — on pousse le contenu de côté pour
     découvrir ce qui est derrière.
     Le détecteur enveloppe toute la diapositive : il doit être AU-DESSUS du
     lecteur vidéo dans l'arbre, pas à l'intérieur. */
  return (
    <GlissementLateral
      style={{ height }}
      onVersGauche={onGlisserVersProfil && pro ? () => onGlisserVersProfil(pro) : null}
      onVersDroite={onGlisserVersFil || null}
      apercuDroite={<ApercuPro pro={pro} />}
      apercuGauche={<ApercuFil />}
    >
      <Surface {...proprietes} style={[s.card, { height }]}>
        <Scrim />

        {/* actions sur le côté droit */}
        <View style={[s.actions, { bottom: 150 + bottomInset }]}>
          <Pressable style={s.action} onPress={() => onLike(post.id)}>
            <View style={s.actionIcon}>
              <Heart size={22} filled={post.liked} color={post.liked ? C.accent : '#fff'} />
            </View>
            <Text style={s.actionLabel}>{post.likes}</Text>
          </Pressable>
          <Pressable style={s.action} onPress={() => onComment(post)}>
            <View style={s.actionIcon}><MessageSquare size={22} color="#fff" /></View>
            <Text style={s.actionLabel}>{nombreCommentaires(post.comments)}</Text>
          </Pressable>
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
        <View style={[s.info, { paddingBottom: infoPad }]}>
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
      </Surface>
    </GlissementLateral>
  );
}


/**
 * Ce qui attend derrière la vidéo quand le doigt part à gauche : la page de
 * l'artisan, annoncée par ce qu'on a besoin de savoir pour décider d'y aller.
 */
function ApercuPro({ pro }) {
  if (!pro) return null;
  return (
    <View style={s.apercu}>
      <HazardStrip height={6} />
      <View style={[s.apercuCorps, s.apercuDepuisDroite]}>
        <Avatar seed={pro.id} uri={pro.avatarUrl} size={92} ring={3} ringColor={C.accent} />
        <View style={s.apercuNomRang}>
          <Text style={s.apercuNom}>{pro.entreprise}</Text>
          {pro.verifie && <BadgeCheck size={17} color={C.verif} />}
        </View>
        <Text style={s.apercuMeta}>{pro.metier} · {pro.ville}</Text>
        <View style={s.apercuAction}>
          <Text style={s.apercuActionTexte}>Voir sa page</Text>
          <ChevronRight size={15} color="#fff" />
        </View>
      </View>
      <HazardStrip height={6} />
    </View>
  );
}

/** Et à droite : le fil principal, qu'on retrouve. */
function ApercuFil() {
  return (
    <View style={s.apercu}>
      <HazardStrip height={6} />
      <View style={[s.apercuCorps, s.apercuDepuisGauche]}>
        <View style={s.apercuRond}><Home size={34} color="#fff" /></View>
        <Text style={s.apercuNom}>Le fil</Text>
        <Text style={s.apercuMeta}>Photos et publications</Text>
      </View>
      <HazardStrip height={6} />
    </View>
  );
}

const s = StyleSheet.create({
  card: { width: '100%', justifyContent: 'flex-end' },

  apercu: { ...StyleSheet.absoluteFillObject, backgroundColor: C.ink, justifyContent: 'center' },
  /* Le contenu est calé contre le bord par lequel l'écran arrive — sinon il
     reste au centre, donc caché par la vidéo pendant tout le glissement. */
  apercuCorps: { flex: 1, justifyContent: 'center', gap: 8, paddingHorizontal: 26, maxWidth: 300 },
  apercuDepuisDroite: { alignItems: 'flex-start' },
  apercuDepuisGauche: { alignItems: 'flex-end', alignSelf: 'flex-end' },
  apercuRond: {
    width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
  },
  apercuNomRang: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  apercuNom: { fontFamily: F.oswald7, fontSize: 22, color: '#fff' },
  apercuMeta: { fontFamily: F.inter, fontSize: 13, color: 'rgba(255,255,255,0.72)' },
  apercuAction: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14,
    backgroundColor: C.accent, paddingVertical: 9, paddingHorizontal: 14,
  },
  apercuActionTexte: { fontFamily: F.oswald6, fontSize: 13, color: '#fff' },

  actions: { position: 'absolute', right: 10, zIndex: 2, gap: 16, alignItems: 'center' },
  action: { alignItems: 'center', gap: 3 },
  actionIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { color: '#fff', fontSize: 11, fontFamily: F.inter },

  info: { zIndex: 2, paddingHorizontal: 16 },
  tag: { alignSelf: 'flex-start', backgroundColor: C.accent, paddingVertical: 3, paddingHorizontal: 9, marginBottom: 8 },
  tagText: { fontFamily: F.oswald6, fontSize: 11, color: '#111' },
  feedNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  feedName: { fontFamily: F.oswald6, fontSize: 16, color: '#fff' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locText: { fontSize: 11, color: '#fff', opacity: 0.85, fontFamily: F.inter },
  feedText: { fontSize: 13, color: '#fff', marginTop: 8, lineHeight: 18, maxWidth: 250, fontFamily: F.inter },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
});
