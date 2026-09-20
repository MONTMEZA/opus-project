/**
 * Glissement latéral façon TikTok.
 *
 * Le doigt part à GAUCHE : la page de l'artisan arrive par la droite.
 * Le doigt part à DROITE : on revient au fil principal.
 * C'est le sens de TikTok, d'Instagram et des applications de photos : on
 * pousse le contenu de côté pour découvrir ce qui est derrière.
 *
 * CE QUI FAIT QUE ÇA « SENT » BON
 * -------------------------------
 * Trois choses, et aucune n'est décorative :
 *   1. la vidéo suit le doigt au pixel près, sans retard ni ressort — un
 *      ressort ici donne l'impression que l'écran traîne ;
 *   2. la destination est posée JUSTE À CÔTÉ, comme la page suivante d'un
 *      carrousel : elle entre exactement à la vitesse où la vidéo sort. Son
 *      contenu est calé du bord par lequel elle arrive, sans quoi il reste
 *      au centre de l'écran, donc caché par la vidéo pendant tout le geste —
 *      c'est l'erreur de la première version ;
 *   3. quand on lâche assez loin, la vidéo finit sa course jusqu'au bord
 *      avant que l'écran change. Sans cela, on voit un saut.
 *
 * POURQUOI PAS PanResponder
 * -------------------------
 * `VideoView` est une vue **native** : elle reçoit la touche avant
 * JavaScript. `PanResponder`, qui vit entièrement en JavaScript, ne voyait
 * donc jamais le geste — le glissement ne marchait qu'au-dessus des dégradés
 * de démonstration, d'où l'impression d'un bug capricieux.
 * `react-native-gesture-handler` arbitre du côté natif, dans la même arène
 * que le lecteur vidéo et la liste qui défile. D'où `GestureHandlerRootView`
 * à la racine de l'application (App.js).
 *
 * L'ARBITRAGE AVEC LE DÉFILEMENT VERTICAL
 * ---------------------------------------
 *   - `activeOffsetX` : rien ne bouge avant 18 px horizontaux ;
 *   - `failOffsetY`   : on rend la main dès 14 px verticaux.
 * Au moindre doute, c'est le défilement qui gagne : on fait défiler cent
 * fois pour un glissement.
 */
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';

const DEBUT_HORIZONTAL = 18;   // px avant de prendre la main
const ABANDON_VERTICAL = 14;   // px verticaux qui rendent la main au défilement
const VALIDATION = 0.28;       // part de l'écran au-delà de laquelle on part
const VITESSE = 650;           // un geste vif vaut un geste long
const SORTIE = 190;            // ms de la course finale jusqu'au bord

export default function GlissementLateral({
  onVersDroite, onVersGauche, apercuDroite, apercuGauche, style, children,
}) {
  const { width } = useWindowDimensions();
  const decalage = useSharedValue(0);

  const aDroite = typeof onVersDroite === 'function';
  const aGauche = typeof onVersGauche === 'function';

  const geste = Gesture.Pan()
    .activeOffsetX([-DEBUT_HORIZONTAL, DEBUT_HORIZONTAL])
    .failOffsetY([-ABANDON_VERTICAL, ABANDON_VERTICAL])
    .enabled(aDroite || aGauche)
    .onUpdate((e) => {
      const d = e.translationX;
      /* Tirer vers un côté qui ne mène nulle part ne doit rien faire bouger :
         une animation sans suite se lit comme une panne. */
      if ((d > 0 && !aDroite) || (d < 0 && !aGauche)) { decalage.value = 0; return; }
      // Un carrousel ne va pas au-delà de la page voisine : on borne à un écran.
      decalage.value = Math.max(-width, Math.min(width, d));
    })
    .onEnd((e) => {
      const seuil = width * VALIDATION;
      const part = Math.abs(e.translationX) > seuil
        || (Math.abs(e.velocityX) > VITESSE && Math.abs(e.translationX) > 40);
      const versLaDroite = e.translationX > 0;
      const possible = versLaDroite ? aDroite : aGauche;

      if (part && possible) {
        /* La course finale jusqu'au bord, PUIS le changement d'écran. Changer
           d'écran pendant que la vidéo est encore à moitié là donne un saut. */
        decalage.value = withTiming(
          versLaDroite ? width : -width,
          { duration: SORTIE },
          (fini) => {
            if (!fini) return;
            runOnJS(versLaDroite ? onVersDroite : onVersGauche)();
            decalage.value = 0;
          },
        );
        return;
      }
      decalage.value = withSpring(0, { damping: 20, stiffness: 230, mass: 0.6 });
    });

  const styleContenu = useAnimatedStyle(() => ({
    transform: [{ translateX: decalage.value }],
  }));

  /* Les deux voisines sont posées à un écran de distance, de part et d'autre.
     Elles se déplacent avec la vidéo : c'est ce qui fait un carrousel plutôt
     qu'une apparition. */
  const styleGauche = useAnimatedStyle(() => ({
    transform: [{ translateX: decalage.value - width }],
  }));
  const styleDroite = useAnimatedStyle(() => ({
    transform: [{ translateX: decalage.value + width }],
  }));

  return (
    <View style={[style, { width, overflow: 'hidden', backgroundColor: '#000' }]}>
      {/* Les deux destinations attendent de part et d'autre, hors de l'écran.
          Celle de gauche entre quand le doigt va à droite, et inversement.
          Chaque aperçu cale son contenu contre le bord par lequel il arrive
          (voir VideoSlide) : c'est ce qui le rend visible dès les premiers
          pixels du geste, au lieu de rester caché au centre. */}
      {aDroite && apercuGauche ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, styleGauche]}
          pointerEvents="none"
        >
          {apercuGauche}
        </Animated.View>
      ) : null}
      {aGauche && apercuDroite ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, styleDroite]}
          pointerEvents="none"
        >
          {apercuDroite}
        </Animated.View>
      ) : null}

      <GestureDetector gesture={geste}>
        <Animated.View style={[{ flex: 1 }, styleContenu]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
