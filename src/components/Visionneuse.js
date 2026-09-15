/**
 * Visionneuse plein écran, pour regarder une réalisation en grand.
 *
 * On balaie du doigt pour passer d'une photo à l'autre — c'est le geste
 * naturel sur un téléphone. Les flèches existent quand même : sur une
 * tablette ou sur le web, on attend de pouvoir cliquer.
 *
 * Fond sombre, compteur en haut, croix pour fermer. Rien d'autre : la photo
 * du chantier est le sujet, pas l'interface.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, Pressable, FlatList, StyleSheet, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';
import { Gradient } from './ui';
import { X, ChevronLeft, ChevronRight } from './icons';

export default function Visionneuse({ items = [], index = 0, onClose }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const liste = useRef(null);
  const [courant, setCourant] = useState(index);

  useEffect(() => { setCourant(index); }, [index]);

  if (!items.length) return null;

  const aller = (n) => {
    const cible = Math.max(0, Math.min(items.length - 1, n));
    setCourant(cible);
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
          onMomentumScrollEnd={(e) => {
            setCourant(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item }) => (
            <Pressable style={{ width, height }} onPress={onClose}>
              <Gradient media={item} style={{ width, height }} />
            </Pressable>
          )}
        />

        {/* haut : compteur et fermeture */}
        <View style={[s.haut, { paddingTop: insets.top + 8 }]}>
          <Text style={s.compteur}>{courant + 1} / {items.length}</Text>
          <Pressable style={s.rond} onPress={onClose} hitSlop={10}>
            <X size={18} color="#fff" />
          </Pressable>
        </View>

        {/* flèches : inutiles sur une seule photo */}
        {items.length > 1 && (
          <>
            {courant > 0 && (
              <Pressable style={[s.fleche, { left: 10 }]} onPress={() => aller(courant - 1)} hitSlop={10}>
                <ChevronLeft size={22} color="#fff" />
              </Pressable>
            )}
            {courant < items.length - 1 && (
              <Pressable style={[s.fleche, { right: 10 }]} onPress={() => aller(courant + 1)} hitSlop={10}>
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
  compteur: { fontFamily: F.oswald6, fontSize: 13, color: '#fff' },
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
