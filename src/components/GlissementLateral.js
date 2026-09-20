/**
 * Glissement latéral façon TikTok : on tire la vidéo vers la droite pour
 * ouvrir la page de l'artisan, vers la gauche pour revenir au fil.
 *
 * POURQUOI PAS PanResponder
 * -------------------------
 * La première version utilisait `PanResponder`, et elle ne marchait pas
 * au-dessus d'une vidéo. La raison : `VideoView` est une **vue native**.
 * Elle reçoit la touche avant JavaScript, et `PanResponder` — qui vit
 * entièrement en JavaScript — ne voyait tout simplement jamais le geste.
 * Au-dessus des dégradés de démonstration, il n'y a pas de vue native :
 * le glissement y fonctionnait. D'où l'impression d'un bug capricieux.
 *
 * `react-native-gesture-handler` pose ses détecteurs du côté natif, dans la
 * même arène que le lecteur vidéo et que la liste qui défile. C'est lui qui
 * arbitre, et c'est pour cela qu'il faut `GestureHandlerRootView` à la racine
 * de l'application (voir App.js).
 *
 * L'ARBITRAGE AVEC LE DÉFILEMENT VERTICAL
 * ---------------------------------------
 * La liste des vidéos défile de haut en bas ; ce composant écoute de gauche à
 * droite. Deux réglages suffisent à les départager :
 *   - `activeOffsetX` : le geste ne se déclenche qu'après 18 px horizontaux ;
 *   - `failOffsetY`   : il abandonne dès 14 px verticaux.
 * Autrement dit, au moindre doute, c'est le défilement qui gagne — ce qui est
 * le bon choix : on fait défiler cent fois pour un glissement.
 */
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { C, F } from '../theme';
import { ChevronLeft, ChevronRight } from './icons';

const DEBUT_HORIZONTAL = 18;   // px avant de prendre la main
const ABANDON_VERTICAL = 14;   // px verticaux qui rendent la main au défilement
const VALIDATION = 78;         // px au-delà desquels on part vraiment
const VITESSE = 600;           // un geste vif vaut un geste long
const ELASTIQUE = 130;         // au-delà, la vidéo résiste

/** Le déplacement freine après `ELASTIQUE` px : on sent qu'on touche le bout. */
function freiner(x) {
  'worklet';
  const amplitude = Math.abs(x);
  if (amplitude <= ELASTIQUE) return x;
  return Math.sign(x) * (ELASTIQUE + (amplitude - ELASTIQUE) * 0.3);
}

export default function GlissementLateral({
  onVersDroite, onVersGauche, libelleDroite, libelleGauche, style, children,
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
      /* Tirer vers un côté qui ne mène nulle part ne doit rien faire bouger :
         une animation sans suite se lit comme une panne. */
      if (e.translationX > 0 && !aDroite) { decalage.value = 0; return; }
      if (e.translationX < 0 && !aGauche) { decalage.value = 0; return; }
      decalage.value = freiner(e.translationX);
    })
    .onEnd((e) => {
      const assezLoin = Math.abs(e.translationX) > VALIDATION;
      const assezVif = Math.abs(e.velocityX) > VITESSE && Math.abs(e.translationX) > 30;

      if (assezLoin || assezVif) {
        if (e.translationX > 0 && aDroite) runOnJS(onVersDroite)();
        else if (e.translationX < 0 && aGauche) runOnJS(onVersGauche)();
      }
      /* On revient toujours en place : si le geste a mené quelque part,
         l'écran change de toute façon ; sinon la vidéo se remet droite. */
      decalage.value = withSpring(0, { damping: 20, stiffness: 220, mass: 0.6 });
    });

  const styleAnime = useAnimatedStyle(() => ({
    transform: [{ translateX: decalage.value }],
  }));

  /* Les deux repères n'apparaissent qu'en tirant, et se remplissent à mesure :
     à pleine opacité, on sait que lâcher suffira. */
  const styleDroite = useAnimatedStyle(() => ({
    opacity: interpolate(decalage.value, [0, VALIDATION], [0, 1], Extrapolation.CLAMP),
  }));
  const styleGauche = useAnimatedStyle(() => ({
    opacity: interpolate(decalage.value, [0, -VALIDATION], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[style, { width, overflow: 'hidden' }]}>
      {aDroite && (
        <Animated.View style={[s.repere, s.repereGauche, styleDroite]} pointerEvents="none">
          <ChevronRight size={16} color="#fff" />
          <Text style={s.repereTexte} numberOfLines={1}>{libelleDroite}</Text>
        </Animated.View>
      )}
      {aGauche && (
        <Animated.View style={[s.repere, s.repereDroit, styleGauche]} pointerEvents="none">
          <ChevronLeft size={16} color="#fff" />
          <Text style={s.repereTexte} numberOfLines={1}>{libelleGauche}</Text>
        </Animated.View>
      )}

      <GestureDetector gesture={geste}>
        <Animated.View style={[{ flex: 1 }, styleAnime]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  repere: {
    position: 'absolute', top: '46%', zIndex: 1,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    maxWidth: 150, paddingVertical: 8, paddingHorizontal: 11,
    backgroundColor: C.accent,
  },
  repereGauche: { left: 0 },
  repereDroit: { right: 0 },
  repereTexte: { fontFamily: F.oswald6, fontSize: 12, color: '#fff', flexShrink: 1 },
});
