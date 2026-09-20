/**
 * Ligne "artisan" réutilisée dans Découvrir, les partenaires et les abonnements.
 * (.artisan-row du prototype)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { libelleMetiers } from '../lib/metiers';
import { Avatar } from './ui';
import { BadgeCheck, Star } from './icons';

export default function ArtisanRow({ pro, avatarSize = 44, note, raison, right }) {
  return (
    <View style={s.row}>
      <Avatar seed={pro.id} size={avatarSize} uri={pro.avatarUrl} />
      <View style={s.info}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{pro.entreprise}</Text>
          {pro.verifie && <BadgeCheck size={13} color={C.verif} />}
        </View>
        <Text style={s.meta}>{libelleMetiers(pro)} · {pro.ville}</Text>
        {note !== undefined && (
          <View style={s.rate}>
            <Star size={12} color={C.accent} />
            <Text style={s.rateText}>{note.value} ({note.count} avis)</Text>
          </View>
        )}
        {!!raison && <Text style={s.raison}>{raison}</Text>}
      </View>
      {right}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: 10, paddingHorizontal: 12,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontFamily: F.inter6, fontSize: 13, color: C.ink, flexShrink: 1 },
  meta: { fontSize: 11.5, color: C.muted, marginTop: 1, fontFamily: F.inter },
  rate: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  rateText: { fontSize: 11, color: C.ink, fontFamily: F.inter },
  raison: { fontSize: 10.5, color: C.accent2, marginTop: 2, lineHeight: 14, fontFamily: F.inter },
});
