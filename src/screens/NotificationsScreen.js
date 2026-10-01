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
import { Avatar, EmptyState, BtnMini } from '../components/ui';
import {
  MessageSquare, CornerDownRight, Bell, ChevronRight,
  Phone, Clock, AlertTriangle, Check, X,
} from '../components/icons';

/* Une notification qui porte la même cloche que les dix autres ne dit rien.
   Depuis le 01/10/2026, les demandes reçues arrivent ici aussi — et une
   urgence ne doit pas ressembler à un « j'aime ». */
const ICONES = {
  commentaire: MessageSquare,
  reponse: CornerDownRight,
  devis: Clock,
  rappel: Phone,
  sos: AlertTriangle,
  devis_accepte: Check,
  rappel_accepte: Check,
  sos_accepte: Check,
  demande_refusee: X,
};

/* L'urgence est la seule qui change de couleur : tout mettre en rouge
   reviendrait à ne rien signaler du tout. */
const COULEURS = { sos: C.sos };

export default function NotificationsScreen({ notifications, onOuvrir, onToutLire }) {
  if (!notifications.length) {
    return <EmptyState>Aucune notification pour le moment.</EmptyState>;
  }

  const nonLues = notifications.filter((n) => !n.lue).length;

  return (
    <ScrollView style={s.pad} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* POURQUOI CE BOUTON
          Le point orange de la cloche ne tombait qu'en ouvrant les
          notifications UNE PAR UNE. Après une semaine d'absence, il fallait
          toucher vingt lignes pour faire disparaître une pastille — alors
          qu'on voulait juste dire « j'ai vu ». La plupart des gens
          renoncent, et la pastille finit par ne plus rien vouloir dire. */}
      {nonLues > 0 && !!onToutLire && (
        <View style={s.barre}>
          <Text style={s.compte}>
            {nonLues} non lue{nonLues > 1 ? 's' : ''}
          </Text>
          <BtnMini outline label="Tout marquer comme lu" onPress={onToutLire} />
        </View>
      )}

      {notifications.map((n) => {
        const Icone = ICONES[n.type] || Bell;
        const teinte = COULEURS[n.type] || C.muted;
        const menuQuelquePart = !!n.postId;
        return (
          <Pressable
            key={String(n.id)}
            style={s.row}
            onPress={() => onOuvrir(n)}
            accessibilityRole="button"
            accessibilityLabel={`${n.lue ? '' : 'Non lue. '}${n.texte}`
              + (menuQuelquePart ? '. Ouvrir la publication' : '')}
          >
            {!n.lue && <View style={s.dot} />}

            {n.acteurId
              ? <Avatar seed={n.acteurId} size={34} uri={n.avatarUrl} />
              : <View style={s.rond}><Icone size={15} color={teinte} /></View>}

            <View style={s.corps}>
              <Text style={[s.text, !n.lue && { fontFamily: F.inter6 }]}>{n.texte}</Text>
              <View style={s.meta}>
                <Icone size={11} color={teinte} />
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
  barre: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingBottom: 10,
  },
  compte: { fontFamily: F.oswald6, fontSize: 11.5, color: C.muted },
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
