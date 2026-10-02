/**
 * L'OUVERTURE — deux barrières de chantier qui s'écartent.
 *
 * DEMANDÉ PAR LE PROPRIÉTAIRE, LE 02/10/2026
 * ------------------------------------------
 * « Quand quelqu'un ouvre Opus, une animation en rapport avec le BTP qui
 * vient laisser apparaître la connexion. Il faut que ça fasse waouh avant
 * même de s'inscrire. »
 *
 * POURQUOI ELLE NE COÛTE AUCUN TEMPS
 * ----------------------------------
 * C'est tout l'intérêt, et c'est ce qui sépare une intro qu'on admire d'une
 * intro qu'on subit. Mesuré au navigateur, processeur bridé six fois (l'ordre
 * de grandeur d'un téléphone) : **il y a déjà 1,24 seconde** entre la page
 * servie et l'écran d'accueil — le temps de charger les polices Oswald et
 * Inter, et de lire la session. Sur un iPhone dans Expo Go, c'est plus long.
 *
 * Et jusqu'ici, cette seconde était remplie par **une roue qui tourne**. La
 * chose la plus banale du monde, sur la première seconde que quelqu'un passe
 * avec Opus.
 *
 * Les barrières restent donc FERMÉES tant que le travail réel n'est pas fini
 * (`pret`), et s'ouvrent quand il l'est. L'animation occupe un temps qui
 * existe déjà ; elle n'en ajoute pas.
 *
 * LES QUATRE RÈGLES QUI L'EMPÊCHENT DE DEVENIR INSUPPORTABLE
 * ----------------------------------------------------------
 *   1. **Un doigt l'interrompt.** Toujours, à n'importe quel moment.
 *   2. **Complète au premier lancement, courte ensuite.** Une intro de
 *      1,2 s est magnifique la première fois et détestable la vingtième.
 *      Le drapeau vit dans le téléphone (`AsyncStorage`).
 *   3. **« Réduire les animations » la remplace par un fondu.** Ce réglage
 *      n'est pas un goût : il existe pour les personnes que le mouvement
 *      rend malades.
 *   4. **Aucune dépendance nouvelle.** Reanimated est là depuis le début ;
 *      ajouter une bibliothèque, c'est risquer de devoir quitter Expo Go,
 *      le seul moyen d'essai du propriétaire.
 *
 * LE DÉTAIL QUI FAIT QUE ÇA RESSEMBLE À UNE VRAIE BARRIÈRE
 * --------------------------------------------------------
 * Elle ne part pas tout droit : elle **pivote légèrement**, comme un
 * panneau sur ses pieds, et elle **tremble** une fois avant de céder. Sans
 * ce tremblement, on voit deux rectangles glisser ; avec lui, on sent un
 * poids. C'est huit lignes de code pour toute la différence.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay,
  runOnJS, Easing, interpolate,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { HardHat, Hammer, Wrench, Paintbrush } from './icons';

/** Le drapeau « cette personne a déjà vu l'ouverture complète ». */
const CLE_DEJA_VU = 'opus.ouverture.vue';

/* Les durées. La version courte ne rogne pas sur l'écartement — c'est lui
   qu'on regarde — mais sur tout ce qui l'entoure. */
const COMPLETE = { tremblement: 150, ecart: 760, logo: 260, sortie: 220 };
const COURTE = { tremblement: 0, ecart: 460, logo: 150, sortie: 180 };

/** Largeur d'une bande du motif de chantier, et son pas. */
const BANDE = 14;
const PAS = 28;

/**
 * UN PANNEAU DE CHANTIER — le même motif que `HazardStrip`, mais sur toute
 * la hauteur.
 *
 * Les bandes sont des vues penchées posées les unes à côté des autres : il
 * n'existe pas de dégradé répété en React Native, et une image perdrait la
 * netteté du motif. C'est déjà la technique de la bande de l'en-tête.
 */
function Panneau({ largeur, hauteur, style }) {
  /* LE PIÈGE DU PENCHAGE, trouvé à la première capture : `skewX` penche
     autour du CENTRE de la vue, donc il décale le haut et le bas de la
     moitié de sa hauteur, chacun d'un côté. Sur la bande de 5 px de
     l'en-tête, ça ne se voit pas. Sur un écran de 844 px, la bande part
     à 422 px de son point de départ — et le motif laissait le tiers bas
     de l'écran nu, en diagonale.
     D'où une bande exactement aussi haute que le panneau (donc un décalage
     de ±hauteur/2, connu), et un nombre de bandes qui en tient compte. */
  const nombre = Math.ceil((largeur + hauteur) / PAS) + 2;
  return (
    <View style={[{ width: largeur, height: hauteur, backgroundColor: C.ink, overflow: 'hidden' }, style]}>
      {Array.from({ length: nombre }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: i * PAS - hauteur / 2 - PAS,
            top: 0,
            width: BANDE,
            height: hauteur,
            backgroundColor: C.accent,
            transform: [{ skewX: '-45deg' }],
          }}
        />
      ))}
      {/* Les deux traverses d'une vraie barrière : sans elles, le motif
          ressemble à un papier peint plutôt qu'à un panneau. */}
      <View style={[s.traverse, { top: hauteur * 0.26 }]} />
      <View style={[s.traverse, { top: hauteur * 0.7 }]} />
    </View>
  );
}

export default function Ouverture({ pret, sansMouvement, onFini }) {
  const { width, height } = useWindowDimensions();
  /* L'encoche : l'écran d'accueil pose sa bande de chantier dessous, donc
     son logo descend d'autant. Sans ça, le logo sauterait de la hauteur de
     l'encoche au moment du fondu. */
  const insets = useSafeAreaInsets();
  const haut = insets.top + 6;
  const [court, setCourt] = useState(null);   // null = on ne sait pas encore
  const [fini, setFini] = useState(false);

  /* Avancement de l'ouverture : 0 = fermé, 1 = les panneaux sont sortis. */
  const ecart = useSharedValue(0);
  const secousse = useSharedValue(0);
  const logo = useSharedValue(0);
  const voile = useSharedValue(1);

  /* Première fois ou non ? La réponse vient du téléphone, donc elle arrive
     avec un retard — on garde les barrières fermées en attendant, ce qui
     est exactement ce qu'on veut de toute façon. */
  useEffect(() => {
    let vivant = true;
    AsyncStorage.getItem(CLE_DEJA_VU)
      .then((v) => { if (vivant) setCourt(!!v); })
      .catch(() => { if (vivant) setCourt(false); })
      .finally(() => { AsyncStorage.setItem(CLE_DEJA_VU, '1').catch(() => {}); });
    return () => { vivant = false; };
  }, []);

  const terminer = React.useCallback(() => {
    setFini(true);
    if (onFini) onFini();
  }, [onFini]);

  /* L'ouverture elle-même. Elle ne part que lorsque les DEUX conditions sont
     réunies : le travail est fini (`pret`) et on sait quelle version jouer. */
  useEffect(() => {
    if (!pret || court === null || fini) return;

    if (sansMouvement) {
      /* Pas de mouvement : un simple fondu. On ne supprime pas l'écran, on
         le rend inoffensif — quelqu'un qui souffre du mouvement a quand
         même droit à une ouverture soignée. */
      voile.value = withTiming(0, { duration: 260 }, (ok) => { if (ok) runOnJS(terminer)(); });
      logo.value = withTiming(1, { duration: 200 });
      return;
    }

    const d = court ? COURTE : COMPLETE;
    logo.value = withDelay(d.tremblement, withTiming(1, { duration: d.logo }));

    /* Le tremblement, puis l'écartement. `withSequence` enchaîne les deux
       sur le fil natif : rien ne passe par JavaScript entre les deux, donc
       rien ne saute si le téléphone est occupé à finir son démarrage. */
    secousse.value = d.tremblement
      ? withSequence(
        withTiming(1, { duration: d.tremblement * 0.45, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: d.tremblement * 0.55, easing: Easing.in(Easing.quad) }),
      )
      : 0;

    ecart.value = withDelay(
      d.tremblement,
      withTiming(1, { duration: d.ecart, easing: Easing.inOut(Easing.cubic) }, (ok) => {
        if (!ok) return;
        voile.value = withTiming(0, { duration: d.sortie }, (ok2) => {
          if (ok2) runOnJS(terminer)();
        });
      }),
    );
  }, [pret, court, sansMouvement, fini, terminer, ecart, secousse, logo, voile]);

  /* LE DOIGT PASSE DEVANT TOUT. On ne « saute » pas d'un coup — ce serait un
     clignement désagréable — on termine très vite. */
  const passer = () => {
    if (fini) return;
    ecart.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
    logo.value = withTiming(1, { duration: 100 });
    voile.value = withDelay(140, withTiming(0, { duration: 120 }, (ok) => {
      if (ok) runOnJS(terminer)();
    }));
  };

  /* Chaque panneau couvre un peu plus que la moitié : sinon un cheveu de
     fond apparaît entre les deux pendant le pivot. */
  const demi = Math.ceil(width / 2) + 2;

  const styleGauche = useAnimatedStyle(() => ({
    transform: [
      { translateX: -secousse.value * 3 - ecart.value * (demi + 40) },
      { rotate: `${-ecart.value * 5}deg` },
      { translateY: ecart.value * 10 },
    ],
  }));
  const styleDroite = useAnimatedStyle(() => ({
    transform: [
      { translateX: secousse.value * 3 + ecart.value * (demi + 40) },
      { rotate: `${ecart.value * 5}deg` },
      { translateY: ecart.value * 10 },
    ],
  }));
  const styleLogo = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: interpolate(logo.value, [0, 1], [0.94, 1]) }],
  }));
  const styleVoile = useAnimatedStyle(() => ({ opacity: voile.value }));

  if (fini) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, s.scene, styleVoile]}
      pointerEvents="auto"
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={passer}
        accessibilityRole="button"
        accessibilityLabel="Passer l’animation d’ouverture"
      >
        {/* LE MOT-SYMBOLE, derrière les panneaux : il est déjà là quand ils
            s'écartent, donc on ne le voit pas « arriver » — on le découvre.
            C'est la différence entre une révélation et une apparition.

            ET C'EST EXACTEMENT LE MÊME que celui de l'écran d'accueil :
            même mots, même police, même taille, même place (les icônes
            d'outils, puis « OPUS-PROJECT », puis la phrase). Quand les
            barrières sortent et que le voile tombe, le logo NE BOUGE PAS —
            seul le reste de l'écran arrive. Le propriétaire avait posé la
            condition : « il faut que la transition soit cohérente. » Un
            logo centré ici et en haut juste après, ce sont deux écrans qui
            se succèdent ; au même endroit, c'est un seul écran qu'on
            découvre. */}
        {/* ET SEULEMENT UNE FOIS LES POLICES LÀ. Mesuré : affiché avant,
            le mot-symbole se dessine dans la police de secours du système,
            puis saute de 22 px et change de largeur quand Oswald arrive.
            Les barrières, elles, ne sont que des formes : elles peuvent
            s'afficher tout de suite, et c'est d'ailleurs ce qu'on veut —
            elles occupent précisément ce temps de chargement. */}
        <Animated.View
          style={[s.logoPlace, { paddingTop: haut }, styleLogo]}
          pointerEvents="none"
        >
          {!!pret && (
          <>
          <View style={s.outils}>
            <HardHat size={22} color={C.surface} />
            <Hammer size={22} color={C.surface} />
            <Wrench size={22} color={C.surface} />
            <Paintbrush size={22} color={C.surface} />
          </View>
          <Text style={s.mot}>OPUS<Text style={{ color: C.accent }}>-PROJECT</Text></Text>
          <Text style={s.tag}>Découvrez. Partagez. Construisez.</Text>
          </>
          )}
        </Animated.View>

        <Animated.View style={[s.panneau, { left: 0 }, styleGauche]} pointerEvents="none">
          <Panneau largeur={demi} hauteur={height} />
        </Animated.View>
        <Animated.View style={[s.panneau, { right: 0 }, styleDroite]} pointerEvents="none">
          <Panneau largeur={demi} hauteur={height} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  /* Le MÊME presque-noir que l'écran de lancement d'iOS (app.json) : on ne
     doit pas voir la jointure entre les deux. */
  scene: { backgroundColor: C.ink, zIndex: 100 },
  panneau: { position: 'absolute', top: 0, bottom: 0 },
  traverse: {
    position: 'absolute', left: 0, right: 0, height: 7,
    backgroundColor: C.ink, opacity: 0.85,
  },
  /* Les trois valeurs qui suivent sont CELLES d'`OnboardingScreen` : si
     elles divergent, le logo sautera au moment du fondu. */
  logoPlace: { ...StyleSheet.absoluteFillObject, alignItems: 'center', paddingHorizontal: 26 },
  outils: { flexDirection: 'row', gap: 16, marginTop: 60, opacity: 0.85 },
  mot: {
    fontFamily: F.oswald7, fontSize: 34, color: C.surface,
    marginTop: 24, letterSpacing: 0.5,
    /* Le suffixe est en orange de remplissage, et c'est volontaire : il est
       posé sur le presque-noir de cet écran, ce qui donne 4,92 : 1. C'est
       la même exception que l'écran d'accueil — et il FAUT que ce soit la
       même, puisque c'est le même mot-symbole, au même endroit. */
  },
  tag: { fontSize: 13, color: C.surface, opacity: 0.85, marginTop: 6, fontFamily: F.inter },
});
