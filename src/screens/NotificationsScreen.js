/**
 * 6. Notifications — point orange tant que la notification n'est pas lue.
 * (.notif-row du prototype)
 *
 * Une notification qui ne mène nulle part ne sert à rien : toucher une ligne
 * ouvre la publication concernée, commentaires dépliés, et la marque lue.
 */
import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  C, F, T, APPUI, S, GOUTTIERE,
} from '../theme';
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

/**
 * UNE LIGNE DE NOTIFICATION, isolée et mémorisée.
 *
 * POURQUOI `React.memo` : dans une liste virtualisée, React redessine
 * chaque ligne visible dès que l'écran se redessine — même celles qui
 * n'ont pas bougé d'un pixel. `memo` lui dit de n'en rien faire tant que
 * la notification elle-même est la même ligne.
 */
const Ligne = React.memo(function Ligne({ n, onOuvrir }) {
  const Icone = ICONES[n.type] || Bell;
  const teinte = COULEURS[n.type] || C.muted;
  const menuQuelquePart = !!n.postId;
  return (
    <Pressable
      style={({ pressed }) => [s.row, pressed && APPUI.discret]}
      onPress={() => onOuvrir(n)}
      accessibilityRole="button"
      accessibilityLabel={`${n.lue ? '' : 'Non lue. '}${n.texte}`
        + (menuQuelquePart ? '. Ouvrir la publication' : '')}
    >
      {!n.lue && <View style={s.dot} />}

      {n.acteurId
        ? <Avatar seed={n.acteurId} size={34} uri={n.avatarUrl} nom={n.acteurNom} />
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
});

export default function NotificationsScreen({ notifications, onOuvrir, onToutLire,
  onRafraichir, rafraichit = false,
}) {
  if (!notifications.length) {
    return <EmptyState>Aucune notification pour le moment.</EmptyState>;
  }

  const nonLues = notifications.filter((n) => !n.lue).length;

  return (
    /* UNE LISTE VIRTUALISÉE, et pas une boucle dans un `ScrollView`.
       Avant, les notifications étaient TOUTES montées d'un coup, avec leurs
       avatars. Après une semaine d'absence il y en a cinquante ; après six
       mois, des centaines. Les réglages sont ceux que CLAUDE.md impose à
       toute liste longue depuis le blocage de l'iPhone du 29/09. */
    <FlatList
      style={{ flex: 1 }}
      data={notifications}
      keyExtractor={(n) => String(n.id)}
      initialNumToRender={8}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews
      contentContainerStyle={[s.pad, { paddingBottom: S.xl }]}
      refreshControl={onRafraichir ? (
        <RefreshControl refreshing={!!rafraichit} onRefresh={onRafraichir}
          tintColor={C.muted} colors={[C.accent]} />
      ) : undefined}
      /* POURQUOI CE BOUTON
         Le point orange de la cloche ne tombait qu'en ouvrant les
         notifications UNE PAR UNE. Après une semaine d'absence, il fallait
         toucher vingt lignes pour faire disparaître une pastille — alors
         qu'on voulait juste dire « j'ai vu ». La plupart des gens
         renoncent, et la pastille finit par ne plus rien vouloir dire. */
      ListHeaderComponent={nonLues > 0 && !!onToutLire ? (
        <View style={s.barre}>
          <Text style={s.compte}>
            {nonLues} non lue{nonLues > 1 ? 's' : ''}
          </Text>
          <BtnMini outline label="Tout marquer comme lu" onPress={onToutLire} />
        </View>
      ) : null}
      renderItem={({ item }) => <Ligne n={item} onOuvrir={onOuvrir} />}
    />
  );
}

const s = StyleSheet.create({
  /* `contentContainerStyle`, pas `style` — voir GOUTTIERE dans theme.js. */
  pad: { paddingTop: S.md, paddingHorizontal: GOUTTIERE },
  barre: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, paddingBottom: 10,
  },
  compte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.muted },
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
  text: { fontSize: T.corps, color: C.ink, fontFamily: F.inter, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  time: { fontSize: T.petit, color: C.muted, fontFamily: F.inter },
});
