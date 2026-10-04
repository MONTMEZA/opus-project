/**
 * OÙ EST LE FICHIER QU'ON VEUT JOINDRE ?
 *
 * POURQUOI CETTE FEUILLE EXISTE
 * -----------------------------
 * Le trombone ouvrait directement l'application **Fichiers**. Le
 * propriétaire l'a essayé le 04/10/2026 : « il faudrait qu'on puisse
 * choisir, si par exemple ce qu'on veut envoyer est une photo ».
 *
 * Sur iPhone, Fichiers et Photos sont deux mondes séparés : la photothèque
 * n'apparaît pas dans Fichiers. Un artisan qui vient de photographier une
 * fissure ne trouvait donc, derrière ce bouton, aucun moyen de l'envoyer —
 * et rien ne le lui disait.
 *
 * CE QUI SE JOUE DANS LE DÉTAIL
 * -----------------------------
 *   - **chaque choix porte une phrase.** « Photothèque » et « Fichiers » ne
 *     veulent rien dire pour qui ne connaît pas iOS ; « une photo déjà
 *     prise » et « un devis, un plan, un PDF », si ;
 *   - **44 points de haut**, comme toute cible de ce projet : on vise ça
 *     avec un gant ;
 *   - **on ne vibre pas** en choisissant dans une liste. On vibre quand le
 *     fichier est attaché, c'est-à-dire pour ce qu'on ne regarde pas.
 *     (`src/lib/retour.js`) ;
 *   - **pas d'animation à l'arrivée des lignes.** Trois lignes montées en
 *     même temps n'ont rien à gagner à apparaître l'une après l'autre, et
 *     `theme.js` l'interdit pour de bonnes raisons.
 */
import React from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet,
} from 'react-native';
import { C, F, T, S, R, APPUI, viser } from '../theme';
import { SOURCES_PIECE } from '../lib/media';
import { X, ImageIcon, Camera, FileText, ChevronRight } from './icons';

const ICONES = { photos: ImageIcon, camera: Camera, fichiers: FileText };

export default function ChoixPiece({ ouvert, onChoisir, onFermer }) {
  if (!ouvert) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFermer}>
      {/* LE VOILE FERME LA FEUILLE. Une feuille qui monte du bas sans qu'on
          puisse la refermer en touchant à côté donne l'impression d'être
          coincé — et on cherche un bouton qui n'existe pas. */}
      <Pressable style={s.fond} onPress={onFermer} accessibilityLabel="Fermer" />
      <View style={s.ancrage}>
        <View style={s.feuille}>
          <View style={s.haut}>
            <Text style={s.titre}>Joindre…</Text>
            <Pressable
              onPress={onFermer}
              hitSlop={viser(24)}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={18} color={C.muted} />
            </Pressable>
          </View>

          {SOURCES_PIECE.map((source) => {
            const Icone = ICONES[source.cle] || FileText;
            return (
              <Pressable
                key={source.cle}
                onPress={() => onChoisir(source.cle)}
                accessibilityRole="button"
                accessibilityLabel={`${source.label} — ${source.aide}`}
                style={({ pressed }) => [s.ligne, pressed && APPUI.plein]}
              >
                <View style={s.pastille}>
                  <Icone size={16} color={C.ink} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.label}>{source.label}</Text>
                  <Text style={s.aide}>{source.aide}</Text>
                </View>
                <ChevronRight size={16} color={C.muted} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fond: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  ancrage: { flex: 1, justifyContent: 'flex-end' },
  feuille: {
    backgroundColor: C.surface, width: '100%',
    padding: S.lg, paddingBottom: S.xl, gap: S.sm,
  },
  haut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: S.xs,
  },
  titre: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },

  /* Une ligne de liste PORTE l'information : angle vif. C'est la pastille
     de l'icône qui flotte, et elle seule s'arrondit. */
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    minHeight: 56, paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.line, backgroundColor: C.bg,
  },
  pastille: {
    width: 36, height: 36, borderRadius: R.gelule,
    alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line,
  },
  label: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink },
  aide: { fontFamily: F.inter, fontSize: T.micro, color: C.muted },
});
