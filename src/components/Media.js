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
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { C, F, T, S, R, rond } from '../theme';
import { Gradient } from './ui';
import { Play } from './icons';
/* `estFichier` et `estVideo` vivent dans un fichier qui n'importe que
   `cloudinary-adresses.js`, pour qu'un contrôle les FASSE TOURNER. Ils
   sont ré-exportés ici : `VideoSlide` les prend toujours à cette porte. */
import { estFichier, estVideo } from '../lib/types-media';

export { estFichier, estVideo };

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

/**
 * `pleineResolution` — UNE PHOTO DU FIL N'EST PLUS RÉDUITE PAR LE PROCESSEUR
 * (17/10/2026, sur iPhone seulement).
 *
 * Par défaut, expo-image réduit chaque photo à la taille de sa vue. Lu dans
 * son code natif : cette réduction (`resize`, UIGraphicsImageRenderer)
 * tourne sur le FIL PRINCIPAL, celui qui anime l'élan du défilement — et,
 * quand l'image est déjà en mémoire, en ligne, PENDANT le montage de la
 * carte. Une photo de 1600 × 2845 coûtait quelques millisecondes à chaque
 * (re)montage, un carrousel deux fois, et le fil remonte ses cartes dans
 * les deux sens : c'étaient les saccades que le propriétaire voyait en
 * lâchant le doigt.
 *
 * Sans réduction, l'image entière — déjà décodée en arrière-plan par
 * SDWebImage — est remise telle quelle, et c'est la puce graphique qui la
 * met à l'échelle. Le prix : l'image entière reste tenue tant que la carte
 * est montée (18 Mo pour une 1600 × 2845). D'où trois bornes :
 *   - iPhone seulement : sur Android, Glide réduit HORS du fil principal,
 *     il n'y a rien à gagner et de la mémoire à perdre ;
 *   - le fil seulement : `PostCard` le demande, les grilles et les petites
 *     vignettes non — une image entière pour une case de 100 pt ;
 *   - et `windowSize` reste à 5 dans le fil (HomeScreen.js).
 *
 * `enforceEarlyResizing` a été écarté : sa miniature est calculée pour
 * TENIR dans le cadre, donc une photo verticale en `cover` serait agrandie
 * de 42 % — floue —, et SDWebImage 5.21.6 et suivantes la rangent sous la
 * clé de l'original : la visionneuse plein écran pourrait l'afficher floue.
 */
export default function Media({
  media, style, lecture = false, muet = true, children, onRatio,
  pleineResolution = false, repos, affiche = null,
}) {
  if (!estFichier(media)) {
    return <Gradient media={media} style={style}>{children}</Gradient>;
  }

  if (estVideo(media)) {
    return (
      <VideoMedia
        uri={media}
        style={style}
        lecture={lecture}
        muet={muet}
        repos={repos}
        affiche={affiche}
      >
        {children}
      </VideoMedia>
    );
  }

  /* `Image` vient d'expo-image, pas de React Native : il met les photos en
     cache sur le disque. Avec celui de React Native, redescendre dans le fil
     retéléchargeait chaque image — sur le forfait de l'artisan, à chaque
     fois. `transition` évite le clignotement blanc quand l'image arrive. */
  /* UNE MATIÈRE SOUS LA PHOTO, et pas du vide. Sans elle, une image qui
     n'arrive pas — réseau coupé, fichier supprimé — laissait un trou
     transparent dans la carte : on voyait le fond de l'écran au milieu
     d'une publication, ce qui ressemble beaucoup plus à un défaut du
     programme qu'à une photo manquante. */
  return (
    <View style={[{ backgroundColor: C.line }, style]}>
      <Image
        source={{ uri: media }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        allowDownscaling={Platform.OS !== 'ios' || !pleineResolution}
        /* LA FORME RÉELLE DE LA PHOTO, remontée une fois qu'elle est
           chargée. C'est la seule façon de la connaître : elle n'est
           écrite nulle part en base. Voir `Carrousel`, qui s'en sert pour
           que le cadre suive la photo au lieu de la rogner. */
        onLoad={onRatio ? (e) => {
          const src = (e && e.source) || {};
          if (src.width > 0 && src.height > 0) onRatio(src.width / src.height);
        } : undefined}
        /* Dans une liste, expo-image réutilise ses vues : sans cette clé,
           une vignette peut rester affichée sur la ligne du voisin pendant
           un instant. */
        recyclingKey={media}
      />
      {children}
    </View>
  );
}

/**
 * UNE VIDÉO DU FIL : SON LECTEUR NAÎT AU REPOS, JAMAIS PENDANT UN ÉLAN
 * (17/10/2026).
 *
 * Lu dans expo-video : une `VideoView` crée dès sa naissance un contrôleur
 * de lecture d'iOS (AVPlayerViewController), sur le fil principal, dans le
 * montage de la carte. Mesuré au navigateur : avec la fenêtre du fil, les
 * deux lecteurs de la vraie base étaient détruits puis recréés à CHAQUE
 * passage, en plein élan.
 *
 * `repos` (un compteur tenu par `HomeScreen`, qui monte chaque fois que le
 * défilement s'arrête) décide donc du moment :
 *   - `repos` absent : le lecteur naît tout de suite, comme avant. C'est le
 *     cas de la visionneuse, du fil Vidéos et de la page d'une publication,
 *     qui veulent la vidéo prête sans attendre ;
 *   - `repos` présent : la carte naît SANS lecteur. Il naît au premier arrêt
 *     qui suit son montage, et il RESTE jusqu'au démontage. Ce verrou n'est
 *     pas un détail : l'en-tête de ce fichier raconte qu'un lecteur qu'on
 *     détruit et recrée « rechargeait la vidéo depuis le début, à chaque
 *     fois qu'on arrivait dessus ». Un lecteur armé ne se désarme pas.
 *
 * En attendant, une AFFICHE — l'image que Cloudinary tire du clip — ou, pour
 * une vidéo rangée chez Supabase qui n'en a pas, un fond sombre. Elle reste
 * jusqu'à ce que la première image de la vidéo soit vraiment à l'écran :
 * sinon on verrait un rectangle noir entre l'affiche et la vidéo.
 */
function VideoMedia({
  uri, style, lecture, muet, children, repos, affiche,
}) {
  const differe = repos !== undefined;
  /* La valeur du compteur AU MONTAGE. Un `useState` et pas une référence :
     on la lit pendant le rendu, et le compteur ne fait que monter — dès
     qu'il a bougé, il ne reviendra jamais à cette valeur. Le lecteur reste
     donc armé sans qu'aucun état n'ait à le retenir. */
  const [reposAuMontage] = useState(repos);
  const arme = !differe || repos !== reposAuMontage;
  const [premiereImage, setPremiereImage] = useState(false);

  return (
    <View style={style}>
      {arme && (
        <LecteurVideo
          uri={uri}
          lecture={lecture}
          muet={muet}
          onPremiereImage={() => setPremiereImage(true)}
        />
      )}
      {differe && !premiereImage && (
        affiche ? (
          <Image
            source={{ uri: affiche }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            /* L'affiche de Cloudinary fait 720 px : plus petite que la
               vue, elle n'est pas réduite. Mais une adresse sans
               transformation le serait, à chaque montage — la raison même
               de ce lot. */
            allowDownscaling={false}
            recyclingKey={affiche}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, s.sansAffiche]} />
        )
      )}
      {!lecture && (
        <View style={s.voile} pointerEvents="none">
          <View style={s.pastille}><Play size={14} color="#fff" /></View>
        </View>
      )}
      {children}
    </View>
  );
}

/**
 * Le lecteur lui-même, séparé pour pouvoir naître PLUS TARD que la carte.
 *
 * Il charge la vidéo dès sa naissance, même en pause : quand la carte
 * devient visible, tout est déjà en mémoire et la lecture part sans délai.
 */
function LecteurVideo({ uri, lecture, muet, onPremiereImage }) {
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

  /* `pointerEvents="none"` est capital : VideoView est une vue NATIVE, et
     sans cela elle garde la touche pour elle. Les gestes posés au-dessus —
     glisser vers le profil, toucher pour le plein écran, double-appui pour
     aimer — ne recevaient jamais rien. On n'y perd aucune fonction : le
     lecteur n'a pas de commandes (`nativeControls={false}`). */
  return (
    <VideoView
      style={StyleSheet.absoluteFill}
      player={player}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
      pointerEvents="none"
      onFirstFrameRender={onPremiereImage}
    />
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
  sansAffiche: { backgroundColor: C.dark },
  voile: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pastille: {
    width: 44, height: 44, borderRadius: rond(44),
    backgroundColor: 'rgba(26,27,25,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  /* Une étiquette posée sur une image flotte au-dessus du contenu : elle
     suit donc la règle des arrondis (voir src/theme.js). */
  etiquette: {
    position: 'absolute', left: S.sm, top: S.sm, flexDirection: 'row', alignItems: 'center',
    gap: 4, backgroundColor: 'rgba(26,27,25,0.72)',
    paddingVertical: 4, paddingHorizontal: S.sm, borderRadius: R.gelule,
  },
  etiquetteTexte: { fontFamily: F.oswald6, fontSize: T.micro, color: '#fff' },
});
