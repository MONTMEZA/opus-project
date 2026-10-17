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
import { cadreConnu, retenirCadre } from '../lib/cadres-connus';

/** Combien de photos on monte de part et d'autre de celle qu'on regarde. */
const VOISINES_MONTEES = 1;

/**
 * Le cadre d'une photo suit la PHOTO, borné des deux côtés — voir
 * `src/lib/cadre.js`, qui porte le calcul, les mesures et les raisons.
 */
export default function Carrousel({
  medias = [], style, aspectRatio = 1, enfant, basReserve = 0,
}) {
  const [largeur, setLargeur] = useState(0);
  const [index, setIndex] = useState(0);
  /* `aspectRatio` n'est plus qu'un POINT DE DÉPART : le carré, qui est la
     forme la plus fréquente, donc celle qui bouge le moins au chargement.
     La vraie forme arrive avec la photo.

     SAUF SI ON L'A DÉJÀ MESURÉE (15/10/2026). Le fil démonte une carte
     qui s'éloigne, mais lui garde la place de sa VRAIE photo ; repartir du
     carré au remontage la faisait naître plus courte que sa place, et le
     contenu reculait sous le doigt puis revenait — le « petit blocage » en
     remontant. Le raisonnement complet est dans `cadres-connus.js`. */
  const [cadre, setCadre] = useState(() => cadreConnu(medias[0]) ?? aspectRatio);

  /* LA CLÉ EST L'ADRESSE DE LA PHOTO QUI DONNE LE CADRE, et `onRatio` ne
     transmet que le rapport : on la tient donc ici. C'est `medias[0]` dans
     les deux cas — la photo seule, ou la PREMIÈRE du carrousel, la seule
     qui reçoive `mesurer` — et c'est la valeur de CE rendu, celle-là même
     que `Media` affiche. */
  const premiere = medias[0];
  const mesurer = (r) => {
    if (!(r > 0)) return;
    const borne = retenirCadre(premiere, r);
    setCadre((ancien) => (Math.abs(ancien - borne) < 0.005 ? ancien : borne));
  };

  /* Une seule photo : pas de carrousel, pas de points. Un indicateur qui ne
     sert à rien est un indicateur qu'on finit par ne plus voir du tout. */
  if (medias.length <= 1) {
    return (
      <Media
        media={medias[0]}
        style={[{ width: '100%', aspectRatio: cadre }, style]}
        onRatio={mesurer}
      >
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
      style={[{ width: '100%', aspectRatio: cadre }, style]}
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
        {/* On ne monte que la photo affichée et ses deux voisines.
            Une publication peut porter six photos : les six se
            téléchargeaient et se décodaient au moment où la carte
            apparaissait, alors qu'une seule est visible. Les emplacements,
            eux, restent tous là — sinon le carrousel ne saurait plus où
            s'arrêter. La voisine est toujours prête avant qu'on l'atteigne,
            donc le glissement ne montre jamais de vide.

            ET PAS AVANT D'AVOIR UNE LARGEUR (15/10/2026). Au premier rendu,
            les emplacements font 1 pt de large, le temps que `onLayout`
            réponde. Une photo montée là, expo-image la charge et la
            redessine pour une vue de 1 pt — puis la largeur arrive, la
            taille change, et il recommence tout, sur le fil principal du
            téléphone. On n'y perd qu'une image : avant la largeur, ces
            emplacements n'étaient de toute façon qu'une bande de 1 pt, et
            dans le fil la carte est montée deux écrans avant qu'on la voie.

            `onLayout` reste la seule source de la largeur, et surtout pas
            la fenêtre : dans un chantier ou une annonce, le cadre n'a pas
            la largeur de l'écran (la leçon de `PagesGlissantes`, le 04/10). */}
        {medias.map((m, i) => (
          <View
            key={`${i}-${String(m).slice(0, 24)}`}
            style={{ width: largeur || 1, height: '100%' }}
          >
            {largeur > 0 && Math.abs(i - index) <= VOISINES_MONTEES && (
              <Media
                media={m}
                style={{ width: '100%', height: '100%' }}
                /* Seule la PREMIÈRE donne le cadre : sur une série, les
                   photos n'ont pas toutes la même forme, et un cadre qui
                   changerait à chaque glissement serait insupportable. */
                onRatio={i === 0 ? mesurer : undefined}
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Le compteur : il dit combien il reste à voir AVANT qu'on ait
          commencé à glisser. Les points seuls, sur cinq photos, se comptent
          mal du premier coup d'œil. */}
      <View style={s.compteur} pointerEvents="none">
        <Text style={s.compteurTexte}>{index + 1}/{medias.length}</Text>
      </View>

      {/* `basReserve` : la place prise par la barre d'actions posée sur la
          photo. Sans ça, les points se retrouvent DERRIÈRE elle et on ne
          sait plus combien de photos il reste. */}
      <View style={[s.points, { bottom: S.sm + basReserve }]} pointerEvents="none">
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
    position: 'absolute', left: 0, right: 0,
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
