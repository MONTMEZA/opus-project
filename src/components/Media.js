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
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { C, F } from '../theme';
import { Gradient } from './ui';
import { Play } from './icons';

const EXT_VIDEO = /\.(mp4|mov|m4v|webm)(\?|$)/i;

/** Un dégradé s'écrit « couleur,couleur » ; tout le reste est un fichier. */
export function estFichier(media) {
  return typeof media === 'string'
    && /^(https?:|file:|data:|content:|blob:|assets-library:|ph:)/.test(media);
}

export function estVideo(media) {
  if (!estFichier(media)) return false;
  return EXT_VIDEO.test(media) || /\/video\//i.test(media);
}

/**
 * `lecture` demande la lecture automatique en boucle — le fil vidéo plein
 * écran. Ailleurs on se contente de la première image, avec une pastille :
 * une carte du fil qui lance trois vidéos en même temps vide la batterie.
 */
export default function Media({ media, style, lecture = false, muet = true, children }) {
  if (!estFichier(media)) {
    return <Gradient media={media} style={style}>{children}</Gradient>;
  }

  if (estVideo(media)) {
    return lecture
      ? <VideoLue uri={media} style={style} muet={muet}>{children}</VideoLue>
      : <VideoFigee uri={media} style={style}>{children}</VideoFigee>;
  }

  return (
    <View style={style}>
      <Image source={{ uri: media }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {children}
    </View>
  );
}

/** Vidéo en lecture : fil plein écran. */
function VideoLue({ uri, style, muet, children }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = muet;
    p.play();
  });

  return (
    <View style={style}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {children}
    </View>
  );
}

/**
 * Vidéo arrêtée sur sa première image, façon vignette.
 * expo-video n'expose pas d'extraction de miniature : on charge la vidéo en
 * pause, ce qui affiche la première image sans rien lire.
 */
function VideoFigee({ uri, style, children }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = true;
    p.pause();
  });

  return (
    <View style={style}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      <View style={s.voile} pointerEvents="none">
        <View style={s.pastille}>
          <Play size={14} color="#fff" />
        </View>
      </View>
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
