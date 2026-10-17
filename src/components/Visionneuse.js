/**
 * Visionneuse plein écran, pour regarder une réalisation en grand.
 *
 * On balaie du doigt pour passer d'une photo à l'autre — c'est le geste
 * naturel sur un téléphone. Les flèches existent quand même : sur une
 * tablette ou sur le web, on attend de pouvoir cliquer.
 *
 * Fond sombre, compteur en haut, croix pour fermer. Rien d'autre : la photo
 * du chantier est le sujet, pas l'interface.
 *
 * TROIS PAGES MONTÉES AU PLUS, ET UN LECTEUR NÉ AU REPOS (17/10/2026)
 * -------------------------------------------------------------------
 * Sans réglage, une liste monte DIX éléments d'un coup : ouvrir un
 * portfolio de dix vidéos créait dix lecteurs ensemble, chacun avec son
 * AVPlayerViewController, sur le fil principal — celui qui anime le
 * glissement. D'où la fenêtre de trois pages (la précédente, celle qu'on
 * regarde, la suivante), et le même compteur d'arrêts que le fil : une
 * vidéo ne crée son lecteur qu'au premier arrêt qui suit son montage, et
 * montre son affiche d'ici là.
 */
import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import {
  Modal, View, Text, Pressable, FlatList, StyleSheet, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  F, T, viser,
} from '../theme';
import Media from './Media';
import { estVideo, afficheVideo } from '../lib/types-media';
import { X, ChevronLeft, ChevronRight } from './icons';

/** Immobile depuis ce temps-là : on s'est posé (la même valeur que le fil). */
const ATTENTE_REPOS = 200;

export default function Visionneuse({ items = [], index = 0, onClose }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const liste = useRef(null);
  const [courant, setCourant] = useState(index);
  /* Le compteur d'arrêts — le même mécanisme que le fil (HomeScreen) : il
     monte quand plus rien n'a bougé depuis 200 ms. Une vidéo arme son
     lecteur dès qu'il a bougé depuis son montage (Media.js) : la page
     affichée à l'ouverture une fois le fondu fini, une voisine montée
     pendant le glissement une fois qu'on s'y est posé. Il ne fait que
     MONTER : un compteur qui retrouverait la valeur d'un montage
     désarmerait le lecteur, et la vidéo repartirait du début. */
  const [repos, setRepos] = useState(0);
  const minuteurRepos = useRef(null);
  const armerRepos = useCallback(() => {
    clearTimeout(minuteurRepos.current);
    minuteurRepos.current = setTimeout(() => setRepos((n) => n + 1), ATTENTE_REPOS);
  }, []);

  useEffect(() => { setCourant(index); }, [index]);
  useEffect(() => {
    armerRepos();
    return () => clearTimeout(minuteurRepos.current);
  }, [armerRepos]);

  if (!items.length) return null;

  const aller = (n) => {
    const cible = Math.max(0, Math.min(items.length - 1, n));
    setCourant(cible);
    armerRepos();
    if (liste.current) liste.current.scrollToIndex({ index: cible, animated: true });
  };

  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={s.fond}>
        <FlatList
          ref={liste}
          data={items}
          horizontal
          pagingEnabled
          initialScrollIndex={index}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          onScroll={armerRepos}
          scrollEventThrottle={32}
          onMomentumScrollEnd={(e) => {
            setCourant(Math.round(e.nativeEvent.contentOffset.x / width));
            armerRepos();
          }}
          renderItem={({ item, index: i }) => (
            <Pressable
              style={{ width, height }}
              onPress={onClose}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Réalisation ${i + 1} sur ${items.length}. Toucher pour fermer.`}
            >
              {/* Seule la photo affichée se lit : comparer les adresses ne
                  suffirait pas, deux réalisations peuvent être le même
                  fichier. On compare les rangs. */}
              <Media
                media={item}
                style={{ width, height }}
                lecture={i === courant}
                muet={false}
                repos={estVideo(item) ? repos : undefined}
                affiche={estVideo(item) ? afficheVideo(item) : null}
              />
            </Pressable>
          )}
        />

        {/* haut : compteur et fermeture */}
        <View style={[s.haut, { paddingTop: insets.top + 8 }]}>
          <Text style={s.compteur}>{courant + 1} / {items.length}</Text>
          <Pressable
            style={s.rond}
            onPress={onClose}
            hitSlop={viser(24)}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <X size={18} color="#fff" />
          </Pressable>
        </View>

        {/* flèches : inutiles sur une seule photo */}
        {items.length > 1 && (
          <>
            {courant > 0 && (
              <Pressable
                style={[s.fleche, { left: 10 }]}
                onPress={() => aller(courant - 1)}
                hitSlop={viser(24)}
                accessibilityRole="button"
                accessibilityLabel="Réalisation précédente"
              >
                <ChevronLeft size={22} color="#fff" />
              </Pressable>
            )}
            {courant < items.length - 1 && (
              <Pressable
                style={[s.fleche, { right: 10 }]}
                onPress={() => aller(courant + 1)}
                hitSlop={viser(24)}
                accessibilityRole="button"
                accessibilityLabel="Réalisation suivante"
              >
                <ChevronRight size={22} color="#fff" />
              </Pressable>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fond: { flex: 1, backgroundColor: '#000' },
  haut: {
    position: 'absolute', left: 0, right: 0, top: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 8,
  },
  compteur: { fontFamily: F.oswald6, fontSize: T.corps, color: '#fff' },
  rond: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  fleche: {
    position: 'absolute', top: '50%', marginTop: -19,
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
});
