/**
 * Affiche un média, quel qu'il soit.
 *
 * Trois formes cohabitent dans l'application, et c'est voulu :
 *   - un dégradé « #3a3a38,#8a8578 », hérité des données de démonstration ;
 *   - une photo (URL http, ou fichier local pas encore envoyé) ;
 *   - une vidéo.
 *
 * Les écrans n'ont pas à savoir laquelle : ils posent un <Media> et
 * s'occupent de la mise en page.
 *
 * UN SEUL LECTEUR, qu'on met en pause
 * -----------------------------------
 * `lecture` ne change PAS de composant : le même lecteur reste monté et on
 * se contente de jouer ou de mettre en pause. C'est essentiel — passer d'un
 * composant « vignette » à un composant « lecture » détruisait le lecteur et
 * rechargeait la vidéo depuis le début, à chaque fois qu'on arrivait dessus.
 * D'où l'attente avant que l'image apparaisse.
 */
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { C, F } from '../theme';
import { Gradient } from './ui';
import { Play } from './icons';

const EXT_VIDEO = /\.(mp4|mov|m4v|webm)(\?|$)/i;

/**
 * Réglages de mise en mémoire tampon, choisis pour démarrer vite.
 *
 * Par défaut, Android attend 2 secondes de vidéo en réserve avant de lancer
 * la lecture, et en garde 20 d'avance. Sur un fil qu'on fait défiler, cette
 * prudence se paie en attente à chaque vidéo. On démarre après une
 * demi-seconde, et on garde 5 secondes d'avance : c'est assez pour une vidéo
 * courte, et l'image apparaît presque immédiatement.
 */
const TAMPON = {
  minBufferForPlayback: 0.5,
  preferredForwardBufferDuration: 5,
  prioritizeTimeOverSizeThreshold: true,
  waitsToMinimizeStalling: false,
};

/** Un dégradé s'écrit « couleur,couleur » ; tout le reste est un fichier. */
export function estFichier(media) {
  return typeof media === 'string'
    && /^(https?:|file:|data:|content:|blob:|assets-library:|ph:)/.test(media);
}

export function estVideo(media) {
  if (!estFichier(media)) return false;
  return EXT_VIDEO.test(media) || /\/video\//i.test(media);
}

export default function Media({ media, style, lecture = false, muet = true, children }) {
  if (!estFichier(media)) {
    return <Gradient media={media} style={style}>{children}</Gradient>;
  }

  if (estVideo(media)) {
    return (
      <VideoMedia uri={media} style={style} lecture={lecture} muet={muet}>
        {children}
      </VideoMedia>
    );
  }

  return (
    <View style={style}>
      <Image source={{ uri: media }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {children}
    </View>
  );
}

function VideoMedia({ uri, style, lecture, muet, children }) {
  /* Le lecteur est créé une fois pour cette source. Il charge la vidéo dès
     le montage, même en pause : quand la diapositive devient visible, tout
     est déjà en mémoire et la lecture part sans délai. */
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = muet;
    p.bufferOptions = TAMPON;
  });

  useEffect(() => {
    if (!player) return;
    if (lecture) player.play(); else player.pause();
  }, [player, lecture]);

  useEffect(() => {
    if (player) player.muted = muet;
  }, [player, muet]);

  return (
    <View style={style}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {!lecture && (
        <View style={s.voile} pointerEvents="none">
          <View style={s.pastille}><Play size={14} color="#fff" /></View>
        </View>
      )}
      {children}
    </View>
  );
}

/** Étiquette « Vidéo », posée par les cartes du fil. */
export function EtiquetteVideo() {
  return (
    <View style={s.etiquette}>
      <Play size={12} color="#fff" />
      <Text style={s.etiquetteTexte}>Vidéo</Text>
    </View>
  );
}

const s = StyleSheet.create({
  voile: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pastille: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(26,27,25,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  etiquette: {
    position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: 'rgba(26,27,25,0.72)', paddingVertical: 4, paddingHorizontal: 8,
  },
  etiquetteTexte: { fontFamily: F.oswald6, fontSize: 10.5, color: '#fff' },
});
