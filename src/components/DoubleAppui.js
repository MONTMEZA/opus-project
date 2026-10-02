/**
 * LE DOUBLE-APPUI POUR AIMER, et le cœur qui s'envole.
 *
 * POURQUOI
 * --------
 * Relevé le 02/10/2026 : **zéro occurrence** de `numberOfTaps` dans tout le
 * projet. Aimer une publication demandait de viser un cœur de 17 px dans la
 * barre du bas. C'est le geste le plus fréquent d'un réseau social, et
 * c'était le plus difficile à faire.
 *
 * TROIS DÉCISIONS, ET AUCUNE N'EST COSMÉTIQUE
 * -------------------------------------------
 * 1. **Le double-appui AIME, il ne retire jamais.** Sur toutes les
 *    applications qui font ce geste, c'est la règle — et pour une bonne
 *    raison : on double-appuie souvent par enthousiasme, parfois par
 *    accident, et un geste accidentel ne doit pas défaire quelque chose.
 *    Pour retirer, le cœur de la barre est là, et lui bascule.
 *
 * 2. **Le cœur s'envole MÊME si c'était déjà aimé.** Sinon le geste a
 *    l'air de ne pas avoir marché, et on recommence. On confirme ce qui
 *    est déjà vrai : c'est une réponse, pas un changement d'état.
 *
 * 3. **Un appui simple attend que le double ait échoué.** C'est la rançon
 *    du geste, environ 250 ms, et elle ne se paie QUE là où un appui
 *    simple fait quelque chose (ouvrir une vidéo en plein écran). Sur une
 *    photo, qui n'a pas d'appui simple, il n'y a aucune attente.
 *
 * ET CE QU'ON NE FAIT PAS
 * -----------------------
 * Pas d'`entering` : ce composant vit dans le `renderItem` d'une liste, et
 * `theme.js` l'interdit depuis le lot 1 — c'est le défaut qui bloquait
 * l'iPhone plusieurs secondes au démarrage. Ici l'animation ne part qu'au
 * doigt, jamais au montage. La nuance est toute la différence.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay,
  runOnJS, Easing, interpolate,
} from 'react-native-reanimated';
import { Heart } from './icons';
import { C, M } from '../theme';
import * as retour from '../lib/retour';
import { useMouvementReduit } from '../lib/retour';

export default function DoubleAppui({
  onAimer, onAppuiSimple, taille = 92, style, children,
}) {
  const vol = useSharedValue(0);
  const sansMouvement = useMouvementReduit();

  const envoyer = React.useCallback(() => {
    /* Le vibreur AVANT l'écran : le doigt est encore posé, les yeux
       suivent le mouvement. C'est là qu'un geste doit « cliquer ». */
    retour.prise();
    if (onAimer) onAimer();
  }, [onAimer]);

  const partir = React.useCallback(() => {
    if (sansMouvement) return;
    vol.value = withSequence(
      withTiming(1, { duration: M.bref, easing: Easing.out(Easing.back(2)) }),
      withDelay(220, withTiming(0, { duration: M.courant, easing: Easing.in(Easing.quad) })),
    );
  }, [vol, sansMouvement]);

  const doubleAppui = Gesture.Tap()
    .numberOfTaps(2)
    /* Sans cette marge, deux appuis séparés de quelques pixels — ce qui est
       le cas normal d'un pouce — ne comptent pas comme un double. */
    .maxDistance(28)
    .onEnd((_, reussi) => {
      if (!reussi) return;
      runOnJS(envoyer)();
      runOnJS(partir)();
    });

  const appuiSimple = Gesture.Tap()
    .numberOfTaps(1)
    .maxDistance(16)
    .onEnd((_, reussi) => {
      if (reussi && onAppuiSimple) runOnJS(onAppuiSimple)();
    });

  /* `Exclusive` : le simple ne part que si le double a échoué. Et quand il
     n'y a pas d'appui simple, on n'en met pas — pas d'attente pour rien. */
  const geste = onAppuiSimple
    ? Gesture.Exclusive(doubleAppui, appuiSimple)
    : doubleAppui;

  const styleCoeur = useAnimatedStyle(() => ({
    opacity: interpolate(vol.value, [0, 0.35, 1], [0, 1, 1]),
    transform: [
      { scale: interpolate(vol.value, [0, 0.7, 1], [0.4, 1.18, 1]) },
      /* Il monte un peu en s'effaçant : un cœur qui disparaît sur place
         ressemble à une erreur d'affichage. */
      { translateY: interpolate(vol.value, [0, 1], [10, 0]) },
    ],
  }));

  return (
    <GestureDetector gesture={geste}>
      <View style={style}>
        {children}
        <Animated.View style={[s.scene, styleCoeur]} pointerEvents="none">
          <Heart size={taille} filled color={C.accent} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  scene: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
