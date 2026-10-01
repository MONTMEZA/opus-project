/**
 * Le squelette de chargement — et pourquoi ce n'est pas un rond qui tourne.
 *
 * CE QUE ÇA REMPLACE
 * ------------------
 * Pendant que l'application chargeait, l'écran restait vide avec un rond au
 * milieu, puis tout apparaissait d'un coup. Sur une connexion lente — la 4G
 * d'un chantier, un sous-sol — on ne sait pas si ça charge ou si c'est
 * planté. Un rond qui tourne dit « attends » ; il ne dit pas « attends
 * QUOI ».
 *
 * Un squelette, lui, montre la FORME de ce qui arrive : on reconnaît le fil,
 * ses cartes, sa barre du bas. On sait qu'on est au bon endroit, et le
 * passage à la vraie donnée ne déplace rien.
 *
 * L'IDENTITÉ TENUE
 * ----------------
 * Les blocs gardent les **angles vifs** : ce sont des cartes, donc de la
 * structure. Seules les pastilles rondes — les avatars — restent rondes.
 * C'est la même règle que partout ailleurs (voir `src/theme.js`).
 *
 * LE BATTEMENT
 * ------------
 * Une opacité qui va et vient lentement, entre 0,45 et 1. Assez pour dire
 * « ça travaille », assez lent pour ne pas fatiguer : deux secondes
 * l'aller-retour. `useNativeDriver` fait tourner l'animation du côté natif,
 * donc elle continue même quand le fil JavaScript est occupé à charger —
 * ce qui est précisément le cas ici.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { C, S, R, rond } from '../theme';

/** Un bloc gris qui bat doucement. */
export function Bloc({ largeur = '100%', hauteur = 12, ronde = false, style }) {
  const battement = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(battement, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(battement, { toValue: 0.45, duration: 1000, useNativeDriver: true }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [battement]);

  return (
    <Animated.View
      style={[
        {
          width: largeur,
          height: hauteur,
          backgroundColor: C.line,
          borderRadius: ronde ? rond(hauteur) : R.vif,
          opacity: battement,
        },
        style,
      ]}
    />
  );
}

/** Une carte de publication, telle qu'elle arrivera. */
function CarteFil() {
  return (
    <View style={s.carte}>
      <View style={s.entete}>
        <Bloc largeur={40} hauteur={40} ronde />
        <View style={{ flex: 1, gap: S.sm - 2 }}>
          <Bloc largeur="55%" hauteur={11} />
          <Bloc largeur="35%" hauteur={9} />
        </View>
      </View>
      <View style={{ gap: S.sm - 2, paddingHorizontal: S.md }}>
        <Bloc hauteur={10} />
        <Bloc largeur="80%" hauteur={10} />
      </View>
      <Bloc hauteur={190} style={{ marginTop: S.md }} />
      <View style={s.actions}>
        <Bloc largeur={54} hauteur={12} />
        <Bloc largeur={54} hauteur={12} />
        <Bloc largeur={70} hauteur={12} />
      </View>
    </View>
  );
}

/**
 * Le fil en cours de chargement.
 *
 * Deux cartes, pas plus : au-delà, on ne les voit pas, et chacune coûte une
 * animation. C'est la même raison qui a fait régler `initialNumToRender`
 * (voir HomeScreen).
 */
export default function SqueletteFil() {
  return (
    <View
      style={s.pad}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement du fil d'actualité"
    >
      <CarteFil />
      <CarteFil />
    </View>
  );
}

const s = StyleSheet.create({
  pad: { flex: 1, backgroundColor: C.bg, paddingTop: S.md, gap: S.md },

  /* Les deux formes de la fiche d'un artisan. Mêmes angles vifs que les
     blocs qu'elles remplacent : un squelette doit avoir la silhouette de ce
     qui arrive, sinon l'écran saute au moment du remplacement. */
  bloc: {
    backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: C.line, paddingHorizontal: S.lg, paddingVertical: S.md,
  },
  avis: { paddingVertical: S.sm },
  avisSuivant: { borderTopWidth: 1, borderTopColor: C.line, marginTop: S.sm },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  grille: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: S.lg, paddingTop: S.sm,
  },
  /* Angle vif : une carte PORTE l'information, elle ne flotte pas. */
  carte: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, borderRadius: R.vif,
    paddingVertical: S.md,
  },
  entete: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingHorizontal: S.md, paddingBottom: S.md,
  },
  actions: {
    flexDirection: 'row', gap: S.lg,
    paddingHorizontal: S.md, paddingTop: S.md,
  },
});

/**
 * LA FICHE D'UN ARTISAN, PENDANT QU'ELLE ARRIVE.
 *
 * POURQUOI ELLE EXISTE
 * --------------------
 * Ouvrir la fiche d'un artisan affichait l'écran TOUT DE SUITE, avec la
 * version légère du profil — celle qui sert aux listes, et qui ne porte ni
 * présentation, ni réalisations, ni avis. L'écran annonçait donc, noir sur
 * blanc : « Aucun avis pour le moment — soyez le premier à en laisser un »,
 * et « Aucune réalisation ».
 *
 * C'est un mensonge, et c'est le pire endroit pour en faire un : la fiche
 * est exactement ce qu'un client regarde avant de décider. Un artisan avec
 * trente avis pouvait passer pour un débutant pendant une seconde — et une
 * seconde suffit à faire remonter le pouce.
 *
 * On montre donc la FORME de ce qui arrive, comme pour le fil.
 */
export function SqueletteAvis({ combien = 2 }) {
  return (
    <View style={s.bloc}>
      {Array.from({ length: combien }).map((_, i) => (
        <View key={i} style={[s.avis, i > 0 && s.avisSuivant]}>
          <View style={s.ligne}>
            <Bloc largeur={38} hauteur={38} ronde />
            <View style={{ flex: 1, gap: S.xs }}>
              <Bloc largeur="45%" hauteur={11} />
              <Bloc largeur="30%" hauteur={9} />
            </View>
          </View>
          <Bloc largeur="92%" hauteur={10} style={{ marginTop: S.sm }} />
          <Bloc largeur="70%" hauteur={10} style={{ marginTop: S.xs }} />
        </View>
      ))}
    </View>
  );
}

/** Une grille de réalisations, telle qu'elle arrivera. */
export function SquelettePortfolio({ combien = 6 }) {
  return (
    <View style={s.grille}>
      {Array.from({ length: combien }).map((_, i) => (
        <Bloc key={i} largeur="31%" hauteur={92} style={{ marginBottom: S.sm }} />
      ))}
    </View>
  );
}
