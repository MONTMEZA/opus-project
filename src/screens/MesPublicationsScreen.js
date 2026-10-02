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
import {
  C, F, T, CARTE,
} from '../theme';
import { BtnMini, EmptyState, SectionLabel, TextArea } from '../components/ui';
import Media from '../components/Media';
import { apercuDe } from '../lib/cloudinary';
import { nbCommentairesDe } from '../components/Commentaires';
import {
  Heart, MessageSquare, Share2, Trash, RefreshCw, Grid, VideoIcon, Layers, TypeIcon,
  Edit,
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
  posts = [], onSupprimer, onModifier, onRepublier, onPartager, onOuvrir,
}) {
  // La publication dont on vient de demander la suppression, en attente de
  // confirmation. Une seule à la fois.
  const [aSupprimer, setASupprimer] = useState(null);
  /* Seul le TEXTE se corrige, pas les photos : changer l'image d'une
     publication que des gens ont déjà aimée en ferait autre chose. La base
     tient d'ailleurs la même règle (section 20 de schema.sql). */
  const [aModifier, setAModifier] = useState(null);
  const [brouillon, setBrouillon] = useState('');

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
          const enModification = aModifier === p.id;

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
                    {p.modifie ? '  · modifié' : ''}
                  </Text>

                  <View style={s.chiffres}>
                    <View style={s.chiffre}>
                      <Heart size={12} color={C.muted} />
                      <Text style={s.chiffreTexte}>{p.likes}</Text>
                    </View>
                    <View style={s.chiffre}>
                      <MessageSquare size={12} color={C.muted} />
                      <Text style={s.chiffreTexte}>{nbCommentairesDe(p)}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>

              {enModification ? (
                <View style={s.confirmation}>
                  <Text style={s.confirmationTexte}>
                    Corriger le texte. Les photos, elles, ne changent pas :
                    ce serait une autre publication.
                  </Text>
                  <TextArea
                    value={brouillon}
                    onChangeText={setBrouillon}
                    autoFocus
                    accessibilityLabel="Corriger le texte de ma publication"
                  />
                  <View style={s.confirmationBoutons}>
                    <BtnMini outline label="Annuler" onPress={() => setAModifier(null)} />
                    <BtnMini
                      label="Enregistrer"
                      disabled={!brouillon.trim() || brouillon === p.texte}
                      onPress={() => {
                        setAModifier(null);
                        onModifier(p, brouillon.trim());
                      }}
                    />
                  </View>
                </View>
              ) : enSuppression ? (
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

                  {!!onModifier && (
                    <Pressable
                      style={s.action}
                      onPress={() => { setBrouillon(p.texte || ''); setAModifier(p.id); }}
                      accessibilityRole="button"
                      accessibilityLabel="Corriger le texte de cette publication"
                    >
                      <Edit size={14} color={C.muted} />
                      <Text style={s.actionTexte}>Modifier</Text>
                    </Pressable>
                  )}

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
  carte: { ...CARTE },
  haut: { flexDirection: 'row', gap: 10, padding: 10 },
  vignette: { width: 64, height: 80, backgroundColor: C.line },
  infos: { flex: 1, minWidth: 0 },
  formatLigne: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  format: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },
  temps: { fontSize: T.petit, color: C.muted, fontFamily: F.inter },
  texte: { fontSize: T.corps, color: C.ink, fontFamily: F.inter, lineHeight: 18, marginTop: 4 },
  chiffres: { flexDirection: 'row', gap: 14, marginTop: 6 },
  chiffre: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chiffreTexte: { fontSize: T.petit, color: C.muted, fontFamily: F.inter6 },

  actions: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.line,
  },
  action: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10,
  },
  actionTexte: { fontSize: T.petit, color: C.muted, fontFamily: F.inter6 },

  confirmation: {
    borderTopWidth: 1, borderTopColor: C.line, padding: 10, gap: 8,
    backgroundColor: C.bg,
  },
  confirmationTexte: { fontSize: T.courant, color: C.ink, fontFamily: F.inter, lineHeight: 17 },
  confirmationBoutons: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },

  note: {
    fontSize: T.petit, color: C.muted, fontFamily: F.inter, lineHeight: 16,
    paddingHorizontal: 16, paddingTop: 14,
  },
});
