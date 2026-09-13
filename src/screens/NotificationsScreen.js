/**
 * 6. Notifications — point orange tant que la notification n'est pas lue.
 * (.notif-row du prototype)
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { C, F } from '../theme';

export default function NotificationsScreen({ notifications, onRead }) {
  return (
    <ScrollView style={s.pad}>
      {notifications.map((n) => (
        <Pressable key={String(n.id)} style={s.row} onPress={() => onRead(n.id)}>
          {!n.lue && <View style={s.dot} />}
          <Text style={[s.text, !n.lue && { fontFamily: F.inter6 }]}>{n.texte}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  text: { fontSize: 12.5, color: C.ink, flex: 1, fontFamily: F.inter },
});
