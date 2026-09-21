/**
 * Plusieurs photos dans une seule publication, qu'on fait défiler au doigt.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Jusqu'ici, un artisan qui photographiait son chantier sous cinq angles ne
 * pouvait en publier qu'UN seul : `PostCard` n'affichait `post.media`, et la
 * création limitait la sélection à une image (`NB_MEDIAS.photo = 1`). Les
 * quatre autres photos n'existaient nulle part.
 *
 * Or un chantier ne se montre pas en une image. Une salle de bains refaite,
 * c'est le carrelage, la douche, la robinetterie, les joints. C'est même le
 * principal argument d'un artisan : la preuve par le détail.
 *
 * COMMENT LE GESTE EST ARBITRÉ
 * ----------------------------
 * On utilise un défilement horizontal natif (`ScrollView` en `pagingEnabled`)
 * et NON un `PanResponder` ni un `Gesture.Pan()`. La raison est directement
 * la leçon écrite dans CLAUDE.md : le système sait déjà départager un
 * glissement horizontal d'un défilement vertical, et il le fait côté natif,
 * donc toujours mieux qu'un arbitrage écrit en JavaScript. Ici il n'y a
 * aucune vue native qui mange la touche — ce sont des images — donc rien ne
 * s'oppose à la solution simple.
 *
 * CE QUI NE PEUT PAS ÊTRE VÉRIFIÉ ICI
 * -----------------------------------
 * Sur ordinateur, une zone défilante répond à la molette, pas au glissement :
 * l'arbitrage réel entre « je fais défiler le fil » et « je change de photo »
 * ne se juge que sur le téléphone. Ce qui SE vérifie au navigateur : que les
 * N photos sont bien montées, et que les points sont au bon nombre.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, F, T, S, R } from '../theme';
import Media from './Media';

export default function Carrousel({ medias = [], style, aspectRatio = 16 / 10, enfant }) {
  const [largeur, setLargeur] = useState(0);
  const [index, setIndex] = useState(0);

  /* Une seule photo : pas de carrousel, pas de points. Un indicateur qui ne
     sert à rien est un indicateur qu'on finit par ne plus voir du tout. */
  if (medias.length <= 1) {
    return (
      <Media media={medias[0]} style={[{ width: '100%', aspectRatio }, style]}>
        {enfant}
      </Media>
    );
  }

  const suivre = (e) => {
    if (!largeur) return;
    const n = Math.round(e.nativeEvent.contentOffset.x / largeur);
    if (n !== index) setIndex(Math.max(0, Math.min(medias.length - 1, n)));
  };

  return (
    <View
      style={[{ width: '100%', aspectRatio }, style]}
      onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        /* `onScroll` en plus de `onMomentumScrollEnd` : sur Android, un
           glissement lent se termine sans élan, et l'événement de fin d'élan
           n'arrive jamais. Les points resteraient bloqués sur la première
           photo. */
        onScroll={suivre}
        onMomentumScrollEnd={suivre}
        scrollEventThrottle={32}
        style={StyleSheet.absoluteFill}
      >
        {medias.map((m, i) => (
          <Media key={`${i}-${String(m).slice(0, 24)}`} media={m} style={{ width: largeur || 1, height: '100%' }} />
        ))}
      </ScrollView>

      {/* Le compteur : il dit combien il reste à voir AVANT qu'on ait
          commencé à glisser. Les points seuls, sur cinq photos, se comptent
          mal du premier coup d'œil. */}
      <View style={s.compteur} pointerEvents="none">
        <Text style={s.compteurTexte}>{index + 1}/{medias.length}</Text>
      </View>

      <View style={s.points} pointerEvents="none">
        {medias.map((_, i) => (
          <View key={i} style={[s.point, i === index && s.pointActif]} />
        ))}
      </View>

      {enfant}
    </View>
  );
}

const s = StyleSheet.create({
  compteur: {
    position: 'absolute', right: S.sm, top: S.sm,
    backgroundColor: 'rgba(26,27,25,0.72)',
    paddingVertical: 3, paddingHorizontal: S.sm,
    borderRadius: R.gelule,
  },
  compteurTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },

  points: {
    position: 'absolute', left: 0, right: 0, bottom: S.sm,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  point: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  /* L'orange plutôt qu'un blanc plein : le point actif est une information,
     et c'est la couleur d'Opus qui la porte partout ailleurs. */
  pointActif: { backgroundColor: C.accent, width: 6, height: 6, borderRadius: 3 },
});
