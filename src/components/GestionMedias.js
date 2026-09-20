/**
 * Grille de médias que l'on peut réorganiser et supprimer.
 *
 * Sert au portfolio du professionnel. Rien n'est enregistré tant qu'on n'a
 * pas confirmé : on peut donc se tromper, revenir en arrière, et quitter sans
 * conséquence. Une suppression qui part au premier appui, sur une liste de
 * photos qui se ressemblent, se regrette vite.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { C, F } from '../theme';
import Media from './Media';
import { apercuDe } from '../lib/cloudinary';
import { X, ChevronLeft, ChevronRight } from './icons';

export default function GestionMedias({ items = [], onChanger }) {
  const { width } = useWindowDimensions();
  const cote = (width - 32 - 12) / 2;

  const retirer = (i) => onChanger(items.filter((_, k) => k !== i));
  const deplacer = (i, pas) => {
    const cible = i + pas;
    if (cible < 0 || cible >= items.length) return;
    const copie = [...items];
    [copie[i], copie[cible]] = [copie[cible], copie[i]];
    onChanger(copie);
  };

  if (items.length === 0) {
    return <Text style={s.vide}>Aucune réalisation pour l'instant.</Text>;
  }

  return (
    <View style={s.grille}>
      {items.map((m, i) => (
        <View key={`${m}-${i}`} style={{ width: cote }}>
          <Media media={apercuDe(m)} style={{ width: cote, height: cote * 1.25 }} />

          <View style={s.rang}>
            <Text style={s.rangTexte}>{i + 1}</Text>
          </View>

          <Pressable style={s.retirer} onPress={() => retirer(i)} hitSlop={8}>
            <X size={13} color="#fff" />
          </Pressable>

          <View style={s.ordre}>
            <Pressable onPress={() => deplacer(i, -1)} disabled={i === 0} hitSlop={8}>
              <ChevronLeft size={16} color={i === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
            </Pressable>
            <Pressable
              onPress={() => deplacer(i, 1)}
              disabled={i === items.length - 1}
              hitSlop={8}
            >
              <ChevronRight
                size={16}
                color={i === items.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'}
              />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  vide: {
    fontSize: 12, color: C.muted, fontFamily: F.inter,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  rang: {
    position: 'absolute', left: 6, top: 6,
    backgroundColor: 'rgba(26,27,25,0.72)', paddingHorizontal: 6, paddingVertical: 2,
  },
  rangTexte: { fontFamily: F.oswald6, fontSize: 10.5, color: '#fff' },
  retirer: {
    position: 'absolute', right: 6, top: 6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(180,67,43,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  ordre: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(26,27,25,0.6)',
  },
});
