/**
 * 5a. Messages — liste des conversations. (.msg-list du prototype)
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { Avatar, EmptyState } from '../components/ui';

export default function MessagesScreen({ conversations, pros, onOpen }) {
  return (
    <ScrollView style={s.pad}>
      {conversations.map((c) => {
        const pro = pros[c.proId];
        if (!pro) return null;
        const last = c.messages[c.messages.length - 1];
        return (
          <Pressable key={String(c.id)} style={s.row} onPress={() => onOpen(c.id)}>
            <Avatar seed={pro.id} size={44} />
            <View style={s.body}>
              <View style={s.top}>
                <Text style={s.name}>{pro.entreprise}</Text>
                <Text style={s.time}>{last ? last.heure : ''}</Text>
              </View>
              <Text style={s.preview} numberOfLines={1}>{last ? last.texte : ''}</Text>
            </View>
          </Pressable>
        );
      })}
      {conversations.length === 0 && (
        <EmptyState>Vos prochaines conversations apparaîtront ici.</EmptyState>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, paddingTop: 12, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  body: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontFamily: F.inter6, fontSize: 13.5, color: C.ink },
  time: { fontSize: 11, color: C.muted, fontFamily: F.inter },
  preview: { fontSize: 12, color: C.muted, fontFamily: F.inter },
});
