/**
 * 2. Accueil — bascule "Fil" / "Vidéos" et sous-onglets "Pour vous" / "Abonnements".
 * (.home-wrap du prototype)
 */
import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { C } from '../theme';
import { PillToggle, EmptyState } from '../components/ui';
import PostCard from '../components/PostCard';
import VideoSlide from '../components/VideoSlide';

export default function HomeScreen({
  posts, pros, feedMode, setFeedMode, feedTab, setFeedTab,
  followingIds, savedIds, openCommentsId, openContactId,
  onLike, onFollow, onView, onHide, onToggleComments, onAddComment,
  onSave, onToggleContact, onContact, onShare,
}) {
  const [bodyHeight, setBodyHeight] = useState(0);

  return (
    <View style={s.wrap}>
      {/* bascule de mode */}
      <View style={s.modeRow}>
        <PillToggle
          value={feedMode}
          onChange={setFeedMode}
          options={[{ key: 'classic', label: 'Fil' }, { key: 'video', label: 'Vidéos' }]}
        />
        {feedMode === 'classic' && (
          <PillToggle
            small
            value={feedTab}
            onChange={setFeedTab}
            options={[
              { key: 'pourvous', label: 'Pour vous' },
              { key: 'abonnements', label: 'Abonnements' },
            ]}
          />
        )}
      </View>

      <View style={{ flex: 1 }} onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}>
        {feedMode === 'classic' ? (
          <FlatList
            data={posts}
            keyExtractor={(p) => String(p.id)}
            contentContainerStyle={s.classicContent}
            ListEmptyComponent={
              <EmptyState>Suis des professionnels pour voir leurs publications ici.</EmptyState>
            }
            renderItem={({ item: p }) => (
              <PostCard
                post={p}
                pro={p.proId ? pros[p.proId] : null}
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
        ) : (
          bodyHeight > 0 && (
            <FlatList
              data={posts}
              keyExtractor={(p) => String(p.id)}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              snapToInterval={bodyHeight}
              decelerationRate="fast"
              style={{ backgroundColor: C.dark }}
              getItemLayout={(_, index) => ({ length: bodyHeight, offset: bodyHeight * index, index })}
              renderItem={({ item: p }) => (
                <VideoSlide
                  post={p}
                  pro={p.proId ? pros[p.proId] : null}
                  following={p.proId ? followingIds.has(p.proId) : false}
                  saved={savedIds.has(p.id)}
                  height={bodyHeight}
                  onLike={onLike}
                  onFollow={onFollow}
                  onSave={onSave}
                  onView={onView}
                  onShare={onShare}
                  onContact={onContact}
                />
              )}
            />
          )
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  modeRow: {
    gap: 8, paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  classicContent: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 16, gap: 10 },
});
