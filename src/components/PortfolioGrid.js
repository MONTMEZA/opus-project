/**
 * Grille de réalisations, 3 colonnes carrées. (.portfolio-grid du prototype)
 *
 * Une vignette de 130 px ne montre pas un chantier : on la touche pour ouvrir
 * la visionneuse plein écran, et on balaie pour passer d'une photo à l'autre.
 */
import React, { useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { Gradient } from './ui';
import Visionneuse from './Visionneuse';

export default function PortfolioGrid({ items = [] }) {
  const { width } = useWindowDimensions();
  const cell = (width - 4 - 4) / 3; // 2px de marge extérieure + 2px entre les cellules
  const [ouvert, setOuvert] = useState(null);   // index, ou null

  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: 2, paddingBottom: 6 }}>
        {items.map((g, i) => (
          <Pressable key={i} onPress={() => setOuvert(i)}>
            <Gradient media={g} style={{ width: cell, height: cell }} />
          </Pressable>
        ))}
      </View>

      {ouvert !== null && (
        <Visionneuse items={items} index={ouvert} onClose={() => setOuvert(null)} />
      )}
    </>
  );
}
