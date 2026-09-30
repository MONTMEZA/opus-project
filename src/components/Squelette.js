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
