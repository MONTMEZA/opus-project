/**
 * Grille de réalisations que l'on réorganise en les faisant GLISSER.
 *
 * Les flèches d'avant ont disparu. On appuie une demi-seconde sur une photo,
 * elle se soulève, on l'emmène où on veut, les autres s'écartent pour lui
 * faire de la place, on lâche. C'est le geste qu'on connaît de l'écran
 * d'accueil d'un téléphone — personne n'a besoin qu'on l'explique.
 *
 * POURQUOI UN APPUI LONG AVANT DE POUVOIR GLISSER
 * -----------------------------------------------
 * La grille vit dans une page qui défile. Si la photo partait au premier
 * mouvement, on ne pourrait plus faire défiler la page sans déplacer une
 * réalisation par accident. L'appui long lève l'ambiguïté : un doigt qui
 * passe fait défiler, un doigt qui s'attarde saisit.
 *
 * COMMENT L'ORDRE EST TENU
 * ------------------------
 * `base` est la liste de référence : elle ne bouge pas tant qu'on ne retire
 * rien. `positions` dit, pour chaque photo de `base`, la case qu'elle occupe
 * à l'écran. Déplacer une photo ne fait donc que réécrire des numéros de
 * case — la liste, elle, ne se réordonne jamais sous nos pieds. C'est ce qui
 * évite l'image qui saute au moment où on lâche.
 *
 * `items` n'est lu qu'au premier affichage : à partir de là, c'est cette
 * grille qui fait foi et qui prévient le parent par `onChanger`.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedReaction,
  withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, F } from '../theme';
import Media from './Media';
import { apercuDe } from '../lib/cloudinary';
import { X, Move } from './icons';

const COLONNES = 2;
const ECART = 12;
const MARGE = 16;
const APPUI_LONG = 220;                                  // ms avant la saisie
const RESSORT = { damping: 20, stiffness: 190, mass: 0.6 };

/**
 * Renumérote les cases quand la photo `item` part occuper la case `cible`.
 * Tout ce qui se trouvait entre les deux se décale d'un cran — exactement
 * comme des livres qu'on tasse sur une étagère.
 */
function renumeroter(cases, item, cible) {
  'worklet';
  const actuelle = cases[item];
  if (actuelle === cible) return cases;
  const copie = [...cases];
  for (let i = 0; i < copie.length; i += 1) {
    if (i === item) copie[i] = cible;
    else if (actuelle < cible && copie[i] > actuelle && copie[i] <= cible) copie[i] -= 1;
    else if (actuelle > cible && copie[i] >= cible && copie[i] < actuelle) copie[i] += 1;
  }
  return copie;
}

/** De `positions` (photo → case) vers la liste dans l'ordre affiché. */
function ordreAffiche(cases, base) {
  const liste = new Array(base.length);
  cases.forEach((caseDeLaPhoto, i) => { liste[caseDeLaPhoto] = base[i]; });
  return liste;
}

export default function GestionMedias({ items = [], onChanger }) {
  const { width } = useWindowDimensions();
  const [base, setBase] = useState(items);
  const positions = useSharedValue(items.map((_, i) => i));
  const aRemettreAPlat = useRef(false);

  const cote = (width - 2 * MARGE - ECART * (COLONNES - 1)) / COLONNES;
  const hauteur = cote * 1.25;
  const pasX = cote + ECART;
  const pasY = hauteur + ECART;
  const lignes = Math.ceil(base.length / COLONNES) || 1;

  /* Retirer une photo change la liste de référence : les numéros de case
     repartent donc de zéro. On le fait dans un effet « de mise en page »,
     qui s'exécute après le rendu mais avant que l'écran soit peint — sinon
     la grille clignote le temps d'une image. */
  useLayoutEffect(() => {
    if (!aRemettreAPlat.current) return;
    aRemettreAPlat.current = false;
    positions.value = base.map((_, i) => i);
  }, [base, positions]);

  const retirer = (indexBase) => {
    const affiche = ordreAffiche(positions.value, base);
    const nouveau = affiche.filter((_, k) => k !== positions.value[indexBase]);
    aRemettreAPlat.current = true;
    setBase(nouveau);
    onChanger(nouveau);
  };

  const deposer = () => {
    onChanger(ordreAffiche(positions.value, base));
  };

  const vibrer = () => {
    /* Le petit choc au moment où la photo se soulève : c'est lui qui fait
       comprendre qu'on la tient. Le navigateur ne sait pas vibrer, et un
       appareil peut refuser : dans les deux cas on continue sans rien dire,
       un retour tactile absent ne doit jamais casser un déplacement. */
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (e) { /* pas de vibreur ici */ }
  };

  if (base.length === 0) {
    return <Text style={s.vide}>Aucune réalisation pour l'instant.</Text>;
  }

  return (
    <View style={[s.grille, { height: lignes * pasY - ECART }]}>
      {base.map((media, i) => (
        <Case
          key={`${media}-${i}`}
          index={i}
          media={media}
          nombre={base.length}
          cote={cote}
          hauteur={hauteur}
          pasX={pasX}
          pasY={pasY}
          positions={positions}
          onRetirer={() => retirer(i)}
          onDeposer={deposer}
          onSaisir={vibrer}
        />
      ))}
    </View>
  );
}

function Case({
  index, media, nombre, cote, hauteur, pasX, pasY, positions,
  onRetirer, onDeposer, onSaisir,
}) {
  const enMain = useSharedValue(false);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  /* La case d'où l'on est parti, figée à la saisie. Elle DOIT être figée :
     la première version la relisait à chaque mouvement, or elle change dès
     que la photo prend la place d'une autre. Le point de départ se déplaçait
     donc en même temps que le doigt, et la photo filait hors de l'écran. */
  const departX = useSharedValue(0);
  const departY = useSharedValue(0);
  const [rang, setRang] = useState(index + 1);

  const geste = Gesture.Pan()
    .activateAfterLongPress(APPUI_LONG)
    .onStart(() => {
      const caseDepart = positions.value[index];
      departX.value = (caseDepart % COLONNES) * pasX;
      departY.value = Math.floor(caseDepart / COLONNES) * pasY;
      x.value = departX.value;
      y.value = departY.value;
      enMain.value = true;
      runOnJS(onSaisir)();
    })
    .onUpdate((e) => {
      x.value = departX.value + e.translationX;
      y.value = departY.value + e.translationY;

      /* On vise avec le CENTRE de la photo, pas avec le doigt : c'est ce que
         l'œil suit, et le résultat paraît juste au lieu d'être en avance. */
      const colonne = Math.min(
        COLONNES - 1,
        Math.max(0, Math.floor((x.value + cote / 2) / pasX)),
      );
      const ligne = Math.max(0, Math.floor((y.value + hauteur / 2) / pasY));
      const cible = Math.min(nombre - 1, Math.max(0, ligne * COLONNES + colonne));

      if (cible !== positions.value[index]) {
        positions.value = renumeroter(positions.value, index, cible);
      }
    })
    .onEnd(() => {
      enMain.value = false;
      runOnJS(onDeposer)();
    });

  const style = useAnimatedStyle(() => {
    const caseActuelle = positions.value[index] ?? index;
    const cibleX = (caseActuelle % COLONNES) * pasX;
    const cibleY = Math.floor(caseActuelle / COLONNES) * pasY;

    /* Tenue en main, la photo suit le doigt sans ressort — un ressort ici
       donnerait l'impression qu'elle traîne. Reposée, elle rejoint sa case
       avec un ressort : c'est ce qui rend le réarrangement lisible. */
    return {
      zIndex: enMain.value ? 20 : 0,
      elevation: enMain.value ? 10 : 0,
      shadowOpacity: withTiming(enMain.value ? 0.35 : 0, { duration: 140 }),
      transform: [
        { translateX: enMain.value ? x.value : withSpring(cibleX, RESSORT) },
        { translateY: enMain.value ? y.value : withSpring(cibleY, RESSORT) },
        { scale: withSpring(enMain.value ? 1.07 : 1, RESSORT) },
      ],
    };
  });

  /* La pastille « 1 », « 2 »… doit suivre la CASE, pas la photo : on recopie
     donc le numéro depuis le fil d'animation vers React pendant le
     déplacement, pour que l'ordre se lise en direct. */
  useAnimatedReaction(
    () => positions.value[index],
    (actuelle, precedente) => {
      if (actuelle !== precedente && actuelle != null) runOnJS(setRang)(actuelle + 1);
    },
    [index],
  );

  return (
    <GestureDetector gesture={geste}>
      <Animated.View style={[s.case, { width: cote, height: hauteur }, style]}>
        <Media media={apercuDe(media)} style={{ width: cote, height: hauteur }} />

        <View style={s.rang}><Text style={s.rangTexte}>{rang}</Text></View>

        <Pressable style={s.retirer} onPress={onRetirer} hitSlop={10}>
          <X size={13} color="#fff" />
        </Pressable>

        {/* La poignée ne dit rien : elle se montre. Six fois « Maintenir pour
            déplacer » sur un même écran, c'est du bruit — la consigne est déjà
            écrite une fois, en haut de la page. */}
        <View style={s.poignee} pointerEvents="none">
          <Move size={13} color="#fff" />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const s = StyleSheet.create({
  grille: { marginHorizontal: MARGE, marginTop: 4 },
  case: {
    position: 'absolute', top: 0, left: 0,
    backgroundColor: C.line,
    shadowColor: '#000', shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
  },
  vide: {
    fontSize: 12, color: C.muted, fontFamily: F.inter,
    paddingHorizontal: MARGE, paddingVertical: 10,
  },
  rang: {
    position: 'absolute', left: 6, top: 6,
    backgroundColor: 'rgba(26,27,25,0.72)', paddingHorizontal: 6, paddingVertical: 2,
  },
  rangTexte: { fontFamily: F.oswald6, fontSize: 10.5, color: '#fff' },
  retirer: {
    position: 'absolute', right: 6, top: 6, width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(180,67,43,0.92)', alignItems: 'center', justifyContent: 'center',
  },
  poignee: {
    position: 'absolute', right: 0, bottom: 0,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(26,27,25,0.66)',
  },
});
