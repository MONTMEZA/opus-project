/**
 * 6. Notifications — point orange tant que la notification n'est pas lue.
 * (.notif-row du prototype)
 *
 * Une notification qui ne mène nulle part ne sert à rien : toucher une ligne
 * ouvre la publication concernée, commentaires dépliés, et la marque lue.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { Avatar, EmptyState } from '../components/ui';
import { MessageSquare, CornerDownRight, Bell, ChevronRight } from '../components/icons';

const ICONES = {
  commentaire: MessageSquare,
  reponse: CornerDownRight,
};

export default function NotificationsScreen({ notifications, onOuvrir }) {
  if (!notifications.length) {
    return <EmptyState>Aucune notification pour le moment.</EmptyState>;
  }

  return (
    <ScrollView style={s.pad} contentContainerStyle={{ paddingBottom: 24 }}>
      {notifications.map((n) => {
        const Icone = ICONES[n.type] || Bell;
        const menuQuelquePart = !!n.postId;
        return (
          <Pressable key={String(n.id)} style={s.row} onPress={() => onOuvrir(n)}>
            {!n.lue && <View style={s.dot} />}

            {n.acteurId
              ? <Avatar seed={n.acteurId} size={34} uri={n.avatarUrl} />
              : <View style={s.rond}><Icone size={15} color={C.muted} /></View>}

            <View style={s.corps}>
              <Text style={[s.text, !n.lue && { fontFamily: F.inter6 }]}>{n.texte}</Text>
              <View style={s.meta}>
                <Icone size={11} color={C.muted} />
                {!!n.time && <Text style={s.time}>{n.time}</Text>}
              </View>
            </View>

            {menuQuelquePart && <ChevronRight size={14} color={C.muted} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 11, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  rond: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center',
  },
  corps: { flex: 1, minWidth: 0 },
  text: { fontSize: 12.5, color: C.ink, fontFamily: F.inter, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  time: { fontSize: 10.5, color: C.muted, fontFamily: F.inter },
});
