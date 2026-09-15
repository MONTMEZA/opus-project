/**
 * Lecteur de montage : plusieurs clips enchaînés, avec une musique par-dessus.
 *
 * Pourquoi ce n'est PAS un fichier vidéo unique
 * --------------------------------------------
 * Coller des clips et y incruster une bande-son demande un encodeur vidéo sur
 * le téléphone. En React Native, cela passait par ffmpeg-kit-react-native —
 * un paquet aujourd'hui abandonné par son éditeur (déprécié sur npm, plus
 * aucune version depuis janvier 2025). Il n'existe pas d'équivalent maintenu.
 *
 * Le montage est donc assemblé À LA LECTURE : les clips s'enchaînent dans
 * l'ordre choisi, la musique court par-dessus, et la boucle repart au
 * premier. Le spectateur voit exactement ce qu'il verrait d'un fichier
 * monté. La différence tient en une phrase : il n'y a pas de fichier à
 * exporter vers un autre réseau. Ce sera le travail d'un service
 * d'encodage côté serveur, le jour où il sera utile.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';

export default function LecteurMontage({ clips = [], musique, style, muet = false, children }) {
  const [index, setIndex] = useState(0);
  const suivant = useRef(null);

  const clip = clips[index] || clips[0] || null;

  /* Un seul lecteur vidéo, dont on change la source : en ouvrir un par clip
     multiplierait les décodeurs matériels, que le téléphone limite. */
  const player = useVideoPlayer(clip, (p) => {
    p.loop = false;
    // Avec une musique, le son des clips est coupé : deux bandes-son
    // simultanées ne s'écoutent pas.
    p.muted = muet || !!musique;
    p.play();
  });

  const audio = useAudioPlayer(musique || null);

  /* Fin d'un clip : on passe au suivant, et on reboucle sur le premier. */
  useEffect(() => {
    if (!player) return undefined;
    const abonnement = player.addListener('playToEnd', () => {
      suivant.current = setTimeout(() => {
        setIndex((i) => (clips.length ? (i + 1) % clips.length : 0));
      }, 0);
    });
    return () => {
      abonnement.remove();
      if (suivant.current) clearTimeout(suivant.current);
    };
  }, [player, clips.length]);

  useEffect(() => {
    if (!player || !clip) return;
    player.replace(clip);
    player.muted = muet || !!musique;
    player.play();
  }, [clip, player, muet, musique]);

  /* La musique tourne en boucle, indépendamment des clips : c'est elle qui
     donne son unité au montage. */
  useEffect(() => {
    if (!audio || !musique) return undefined;
    audio.loop = true;
    audio.muted = muet;
    audio.play();
    return () => { try { audio.pause(); } catch (e) { /* déjà libéré */ } };
  }, [audio, musique, muet]);

  if (!clip) return <View style={style}>{children}</View>;

  return (
    <View style={style}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
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
