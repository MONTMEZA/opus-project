/**
 * « Mes publications » — tout ce que le professionnel a publié, au même
 * endroit, avec de quoi agir dessus.
 *
 * Le fil montre les publications mêlées à celles des autres, et dans l'ordre
 * du fil. Pour retrouver la sienne d'il y a trois semaines et la supprimer,
 * il fallait faire défiler indéfiniment. D'où cet écran.
 *
 * Trois actions, et une seule est irréversible — c'est la seule qui demande
 * confirmation.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { BtnMini, EmptyState, SectionLabel } from '../components/ui';
import Media from '../components/Media';
import { apercuDe } from '../lib/cloudinary';
import { nombreCommentaires } from '../components/Commentaires';
import {
  Heart, MessageSquare, Share2, Trash, RefreshCw, Grid, VideoIcon, Layers, TypeIcon,
} from '../components/icons';

const ICONE_FORMAT = {
  photo: Grid, video: VideoIcon, montage: Layers, avantapres: Layers,
  texte: TypeIcon, conseil: TypeIcon,
};

const NOM_FORMAT = {
  photo: 'Photo', video: 'Vidéo', montage: 'Montage',
  avantapres: 'Avant/Après', texte: 'Texte', conseil: 'Conseil',
};

export default function MesPublicationsScreen({
  posts = [], onSupprimer, onRepublier, onPartager, onOuvrir,
}) {
  // La publication dont on vient de demander la suppression, en attente de
  // confirmation. Une seule à la fois.
  const [aSupprimer, setASupprimer] = useState(null);

  if (posts.length === 0) {
    return (
      <EmptyState>
        Vous n'avez encore rien publié. Vos photos et vidéos de chantier
        apparaîtront ici.
      </EmptyState>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
      <SectionLabel>
        {posts.length} {posts.length > 1 ? 'publications' : 'publication'}
      </SectionLabel>

      <View style={s.liste}>
        {posts.map((p) => {
          const Icone = ICONE_FORMAT[p.format] || Grid;
          const enSuppression = aSupprimer === p.id;

          return (
            <View key={String(p.id)} style={s.carte}>
              <Pressable style={s.haut} onPress={() => onOuvrir && onOuvrir(p)}>
                <Media media={apercuDe(p.media)} style={s.vignette} />

                <View style={s.infos}>
                  <View style={s.formatLigne}>
                    <Icone size={12} color={C.muted} />
                    <Text style={s.format}>{NOM_FORMAT[p.format] || 'Publication'}</Text>
                    <Text style={s.temps}>· {p.time}</Text>
                  </View>

                  <Text style={s.texte} numberOfLines={2}>
                    {p.texte || '(sans description)'}
                  </Text>

                  <View style={s.chiffres}>
                    <View style={s.chiffre}>
                      <Heart size={12} color={C.muted} />
                      <Text style={s.chiffreTexte}>{p.likes}</Text>
                    </View>
                    <View style={s.chiffre}>
                      <MessageSquare size={12} color={C.muted} />
                      <Text style={s.chiffreTexte}>{nombreCommentaires(p.comments)}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              {enSuppression ? (
                /* La confirmation remplace la barre d'actions : impossible
                   d'appuyer sur « Supprimer » en croyant viser autre chose. */
                <View style={s.confirmation}>
                  <Text style={s.confirmationTexte}>
                    Supprimer définitivement ? Les commentaires et les j'aime
                    partiront avec.
                  </Text>
                  <View style={s.confirmationBoutons}>
                    <BtnMini outline label="Annuler" onPress={() => setASupprimer(null)} />
                    <BtnMini
                      label="Supprimer"
                      style={{ backgroundColor: C.bad, borderColor: C.bad }}
                      onPress={() => { setASupprimer(null); onSupprimer(p); }}
                    />
                  </View>
                </View>
              ) : (
                <View style={s.actions}>
                  <Pressable style={s.action} onPress={() => onRepublier(p)}>
                    <RefreshCw size={14} color={C.accent2} />
                    <Text style={[s.actionTexte, { color: C.accent2 }]}>Remettre en avant</Text>
                  </Pressable>

                  <Pressable style={s.action} onPress={() => onPartager(p)}>
                    <Share2 size={14} color={C.muted} />
                    <Text style={s.actionTexte}>Partager</Text>
                  </Pressable>

                  <Pressable style={s.action} onPress={() => setASupprimer(p.id)}>
                    <Trash size={14} color={C.bad} />
                    <Text style={[s.actionTexte, { color: C.bad }]}>Supprimer</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Text style={s.note}>
        « Remettre en avant » ne crée pas de doublon : la publication remonte en
        tête du fil en gardant ses j'aime et ses commentaires.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  liste: { gap: 10, paddingHorizontal: 16 },
  carte: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  haut: { flexDirection: 'row', gap: 10, padding: 10 },
  vignette: { width: 64, height: 80, backgroundColor: C.line },
  infos: { flex: 1, minWidth: 0 },
  formatLigne: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  format: { fontFamily: F.oswald6, fontSize: 11, color: C.muted },
  temps: { fontSize: 10.5, color: C.muted, fontFamily: F.inter },
  texte: { fontSize: 12.5, color: C.ink, fontFamily: F.inter, lineHeight: 18, marginTop: 4 },
  chiffres: { flexDirection: 'row', gap: 14, marginTop: 6 },
  chiffre: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chiffreTexte: { fontSize: 11, color: C.muted, fontFamily: F.inter6 },

  actions: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line,
  },
  action: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10,
  },
  actionTexte: { fontSize: 11, color: C.muted, fontFamily: F.inter6 },

  confirmation: {
    borderTopWidth: 1, borderTopColor: C.line, padding: 10, gap: 8,
    backgroundColor: C.bg,
  },
  confirmationTexte: { fontSize: 11.5, color: C.ink, fontFamily: F.inter, lineHeight: 17 },
  confirmationBoutons: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },

  note: {
    fontSize: 11, color: C.muted, fontFamily: F.inter, lineHeight: 16,
    paddingHorizontal: 16, paddingTop: 14,
  },
});
