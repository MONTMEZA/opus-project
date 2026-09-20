/**
 * Lecteur de montage : plusieurs clips enchaînés, avec une musique par-dessus.
 *
 * DEUX LECTEURS QUI S'ALTERNENT
 * -----------------------------
 * La version précédente n'en avait qu'un : à la fin d'un clip, elle lui
 * demandait de charger le suivant. Or charger une vidéo prend du temps —
 * d'où le trou visible entre deux clips.
 *
 * Ici, pendant que le clip 1 joue dans le lecteur A, le clip 2 est déjà
 * chargé et prêt dans le lecteur B, invisible. À la fin du clip 1, il n'y a
 * rien à charger : on échange simplement lequel des deux est à l'écran, et le
 * lecteur A part chercher le clip 3. C'est la technique employée partout où
 * l'on enchaîne des vidéos sans coupure.
 *
 * Ce que cela ne fait toujours pas : un fichier unique. Le montage reste
 * assemblé à la lecture (voir le README), parce qu'aucun encodeur vidéo
 * maintenu n'existe aujourd'hui côté téléphone en React Native.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';

/** Démarrer vite plutôt que mettre beaucoup en réserve — voir Media.js. */
const TAMPON = {
  minBufferForPlayback: 0.5,
  preferredForwardBufferDuration: 5,
  prioritizeTimeOverSizeThreshold: true,
  waitsToMinimizeStalling: false,
};

function preparer(p) {
  p.loop = false;
  p.muted = true;          // le son réel est réglé plus bas, selon la musique
  p.bufferOptions = TAMPON;
}

export default function LecteurMontage({
  clips = [], musique, actif = true, muet = false, style, children,
}) {
  const a = useVideoPlayer(null, preparer);
  const b = useVideoPlayer(null, preparer);
  const audio = useAudioPlayer(musique || null);

  const [surA, setSurA] = useState(true);
  const [index, setIndex] = useState(0);

  /* Les écouteurs d'événements capturent l'état au moment où ils sont posés.
     Des références permettent de lire la valeur courante, pas celle d'hier. */
  const surARef = useRef(true);
  const indexRef = useRef(0);
  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  const signature = clips.join('|');
  const unSeulClip = clips.length === 1;
  // Avec une musique, le son des clips est coupé : deux bandes-son
  // simultanées ne s'écoutent pas.
  const clipsMuets = muet || !!musique;

  /* --- chargement initial, et rechargement si la publication change --- */
  useEffect(() => {
    if (!clips.length || !a || !b) return;

    surARef.current = true; indexRef.current = 0;
    setSurA(true); setIndex(0);

    a.loop = unSeulClip;          // un clip seul se répète tout seul
    a.replaceAsync(clips[0]).then(() => { if (actif) a.play(); }).catch(() => {});
    if (!unSeulClip) {
      // Le clip suivant se charge pendant que le premier joue : c'est tout
      // l'intérêt du second lecteur.
      b.replaceAsync(clips[1]).catch(() => {});
    }
  }, [signature]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* --- fin d'un clip : on bascule sur l'autre lecteur --- */
  useEffect(() => {
    if (!a || !b || unSeulClip) return undefined;

    const basculer = (termine) => () => {
      // Un clip qui finit alors qu'il n'est pas à l'écran ne déclenche rien.
      const cEtaitLui = (termine === 'A') === surARef.current;
      if (!cEtaitLui) return;

      const liste = clipsRef.current;
      const suivant = (indexRef.current + 1) % liste.length;
      indexRef.current = suivant;
      setIndex(suivant);

      // L'autre lecteur est prêt : on l'affiche et on le lance, sans attente.
      surARef.current = !surARef.current;
      setSurA(surARef.current);
      const aLEcran = surARef.current ? a : b;
      const enCoulisse = surARef.current ? b : a;
      aLEcran.currentTime = 0;
      aLEcran.play();

      // Et celui qui vient de finir part chercher le clip d'après.
      // Sur deux clips, il recharge donc celui qu'il vient de jouer : c'est
      // voulu, c'est ce qui fait repartir la boucle sans attente.
      const apres = (suivant + 1) % liste.length;
      enCoulisse.replaceAsync(liste[apres]).catch(() => {});
    };

    const sa = a.addListener('playToEnd', basculer('A'));
    const sb = b.addListener('playToEnd', basculer('B'));
    return () => { sa.remove(); sb.remove(); };
  }, [a, b, unSeulClip]);

  /* --- lecture / pause selon que la diapositive est à l'écran --- */
  useEffect(() => {
    if (!a || !b) return;
    const aLEcran = surA ? a : b;
    const enCoulisse = surA ? b : a;
    /* Ne demander une pause que si le lecteur joue vraiment : interrompre une
       lecture qui démarre à peine provoque une erreur, et c'est ce que le
       test a fait apparaître. */
    if (enCoulisse.playing) enCoulisse.pause();
    if (actif && !aLEcran.playing) aLEcran.play();
    if (!actif && aLEcran.playing) aLEcran.pause();
  }, [actif, surA, a, b]);

  useEffect(() => {
    if (a) a.muted = clipsMuets;
    if (b) b.muted = clipsMuets;
  }, [clipsMuets, a, b]);

  /* --- la musique, qui donne son unité au montage --- */
  useEffect(() => {
    if (!audio || !musique) return undefined;
    audio.loop = true;
    audio.muted = muet;
    if (actif) audio.play(); else audio.pause();
    return () => { try { audio.pause(); } catch (e) { /* déjà libéré */ } };
  }, [audio, musique, muet, actif]);

  if (!clips.length) return <View style={style}>{children}</View>;

  return (
    <View style={style}>
      {/* Les deux lecteurs sont empilés ; seul celui à l'écran est visible.
          On ne les démonte jamais : c'est ce qui garde le clip suivant prêt. */}
      <VideoView
        style={[StyleSheet.absoluteFill, { opacity: surA ? 1 : 0 }]}
        player={a}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {!unSeulClip && (
        <VideoView
          style={[StyleSheet.absoluteFill, { opacity: surA ? 0 : 1 }]}
          player={b}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      )}

      {clips.length > 1 && (
        <View style={s.jauges} pointerEvents="none">
          {clips.map((_, i) => (
            <View key={i} style={[s.jauge, i === index && s.jaugeActive]} />
          ))}
        </View>
      )}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  jauges: {
    position: 'absolute', left: 10, right: 10, top: 8,
    flexDirection: 'row', gap: 3,
  },
  jauge: { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.32)' },
  jaugeActive: { backgroundColor: '#fff' },
});
