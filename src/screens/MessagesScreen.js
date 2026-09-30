/**
 * 5a. Messages — liste des conversations. (.msg-list du prototype)
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { C, F, T, S, R } from '../theme';
import { nomMetier } from '../lib/metiers';
import { Avatar, EmptyState } from '../components/ui';

export default function MessagesScreen({ conversations, onOpen }) {
  return (
    <ScrollView style={s.pad}>
      {conversations.map((c) => {
        const { contact } = c;
        if (!contact) return null;
        /* L'aperçu vient de `dernier`, calculé par la base : les messages
           eux-mêmes ne sont plus chargés tant qu'on n'ouvre pas la
           conversation. */
        const last = c.dernier;
        const nonLus = c.nonLus || 0;
        return (
          <Pressable key={String(c.id)} style={s.row} onPress={() => onOpen(c.id)}>
            <Avatar seed={contact.id} size={44} uri={contact.avatarUrl} />
            <View style={s.body}>
              <View style={s.top}>
                <Text style={[s.name, nonLus > 0 && s.nameNonLu]} numberOfLines={1}>
                  {contact.titre}
                </Text>
                <Text style={s.time}>{last ? last.heure : ''}</Text>
              </View>
              {!!contact.metier && <Text style={s.sousTitre}>{nomMetier(contact.metier)}</Text>}
              <View style={s.basLigne}>
                <Text
                  style={[s.preview, nonLus > 0 && s.previewNonLu]}
                  numberOfLines={1}
                >
                  {last ? last.texte : ''}
                </Text>
                {/* La pastille : le seul endroit où le nombre compte
                    vraiment. Au-delà de 9, « 9+ » — un cercle qui s'allonge
                    pour afficher 137 ne dit rien de plus. */}
                {nonLus > 0 && (
                  <View style={s.pastille}>
                    <Text style={s.pastilleTexte}>{nonLus > 9 ? '9+' : nonLus}</Text>
                  </View>
                )}
              </View>
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
  name: { fontFamily: F.inter6, fontSize: 13.5, color: C.ink, flexShrink: 1 },
  nameNonLu: { fontFamily: F.inter6, color: C.ink },
  basLigne: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  previewNonLu: { color: C.ink, fontFamily: F.inter5 },
  pastille: {
    minWidth: 18, height: 18, borderRadius: R.gelule, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  pastilleTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },
  sousTitre: { fontSize: 11, color: C.accent2, fontFamily: F.inter },
  time: { fontSize: 11, color: C.muted, fontFamily: F.inter },
  preview: { flex: 1, fontSize: 12, color: C.muted, fontFamily: F.inter },
});
