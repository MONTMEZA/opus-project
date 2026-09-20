/**
 * 2. Accueil — bascule "Fil" / "Vidéos" et sous-onglets "Pour vous" / "Abonnements".
 * (.home-wrap du prototype)
 *
 * En mode "Vidéos", les diapositives occupent toute la hauteur de l'écran et
 * la bascule Fil/Vidéos flotte par-dessus, comme sur TikTok.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { PillToggle, EmptyState } from '../components/ui';
import PostCard from '../components/PostCard';
import VideoSlide from '../components/VideoSlide';

const MODES = [{ key: 'classic', label: 'Fil' }, { key: 'video', label: 'Vidéos' }];
const TABS = [
  { key: 'pourvous', label: 'Pour vous' },
  { key: 'abonnements', label: 'Abonnements' },
];

export default function HomeScreen({
  posts, pros, feedMode, setFeedMode, feedTab, setFeedTab,
  followingIds, savedIds, openCommentsId, openContactId, bottomInset = 0, rappel,
  videoCible,
  onLike, onFollow, onView, onHide, onToggleComments, onAddComment,
  onSave, onToggleContact, onContact, onShare, onComment, onVoirCommentateur,
  onOuvrirVideo,
}) {
  const [bodyHeight, setBodyHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /* Une seule vidéo joue à la fois : en laisser tourner cinq en arrière-plan
     vide la batterie et sature les décodeurs du téléphone. */
  const [slideActive, setSlideActive] = useState(0);

  /* Dans le fil classique, la vidéo se lance quand la carte arrive à l'écran,
     et s'arrête quand elle en sort. Le son reste coupé : une vidéo qui parle
     toute seule pendant qu'on fait défiler est insupportable — Instagram et
     Facebook font pareil, le son ne vient qu'en plein écran. */
  /* Quand on arrive depuis une vidéo touchée dans le fil, le plein écran
     s'ouvre directement sur elle plutôt qu'au début de la liste. */
  const indexCible = videoCible
    ? Math.max(0, posts.findIndex((p) => p.id === videoCible))
    : 0;

  useEffect(() => {
    if (feedMode === 'video') setSlideActive(indexCible);
  }, [feedMode, indexCible]);

  const [visibles, setVisibles] = useState(() => new Set());
  const reglesVisibilite = useRef({ itemVisiblePercentThreshold: 65 });
  const surVisibilite = useRef(({ viewableItems }) => {
    setVisibles(new Set(viewableItems.map((v) => v.item.id)));
  });

  /* ---------- mode vidéo : plein écran ---------- */
  if (feedMode === 'video') {
    return (
      <View style={s.videoWrap}>
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={indexCible}
          snapToInterval={windowHeight}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: windowHeight, offset: windowHeight * index, index,
          })}
          onMomentumScrollEnd={(e) => {
            setSlideActive(Math.round(e.nativeEvent.contentOffset.y / windowHeight));
          }}
          ListEmptyComponent={
            <View style={[s.videoVide, { height: windowHeight }]}>
              <Text style={s.videoVideTexte}>
                Aucune vidéo pour le moment.
              </Text>
              <Text style={s.videoVideDetail}>
                Les photos et les publications texte restent dans l'onglet « Fil ».
              </Text>
            </View>
          }
          renderItem={({ item: p, index }) => (
            <VideoSlide
              post={p}
              actif={index === slideActive}
              pro={p.proId ? pros[p.proId] : null}
              following={p.proId ? followingIds.has(p.proId) : false}
              saved={savedIds.has(p.id)}
              height={windowHeight}
              bottomInset={bottomInset}
              onLike={onLike}
              onFollow={onFollow}
              onSave={onSave}
              onView={onView}
              onShare={onShare}
              onContact={onContact}
              onComment={onComment}
            />
          )}
        />

        {/* bascule flottante par-dessus la vidéo */}
        <View style={[s.floatingToggle, { top: insets.top + 10 }]}>
          <PillToggle value={feedMode} onChange={setFeedMode} options={MODES} />
        </View>
      </View>
    );
  }

  /* ---------- mode fil classique ---------- */
  return (
    <View style={s.wrap}>
      <View style={s.modeRow}>
        <PillToggle value={feedMode} onChange={setFeedMode} options={MODES} />
        <PillToggle small value={feedTab} onChange={setFeedTab} options={TABS} />
      </View>

      <View style={{ flex: 1 }} onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}>
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={s.classicContent}
          ListHeaderComponent={rappel || null}
          ListEmptyComponent={
            <EmptyState>Suis des professionnels pour voir leurs publications ici.</EmptyState>
          }
          viewabilityConfig={reglesVisibilite.current}
          onViewableItemsChanged={surVisibilite.current}
          renderItem={({ item: p }) => (
            <PostCard
              post={p}
              actif={visibles.has(p.id)}
              onOuvrirVideo={onOuvrirVideo}
              pro={p.proId ? pros[p.proId] : null}
              pros={pros}
              onVoirCommentateur={onVoirCommentateur}
              following={p.proId ? followingIds.has(p.proId) : false}
              onLike={onLike}
              onFollow={onFollow}
              onView={onView}
              onHide={onHide}
              commentsOpen={openCommentsId === p.id}
              onToggleComments={onToggleComments}
              onAddComment={onAddComment}
              saved={savedIds.has(p.id)}
              onSave={onSave}
              contactOpen={openContactId === p.id}
              onToggleContact={onToggleContact}
              onContact={onContact}
              onShare={onShare}
            />
          )}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  videoWrap: { flex: 1, backgroundColor: C.dark },
  videoVide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 8 },
  videoVideTexte: { fontFamily: F.oswald6, fontSize: 15, color: '#fff', textAlign: 'center' },
  videoVideDetail: {
    fontFamily: F.inter, fontSize: 12, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 18,
  },
  floatingToggle: { position: 'absolute', left: 14, zIndex: 5 },
  modeRow: {
    gap: 8, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  classicContent: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 16, gap: 10 },
});
