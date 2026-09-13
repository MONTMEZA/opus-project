/**
 * Grille de réalisations, 3 colonnes carrées. (.portfolio-grid du prototype)
 */
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gradient } from './ui';

export default function PortfolioGrid({ items = [] }) {
  const { width } = useWindowDimensions();
  const cell = (width - 4 - 4) / 3; // 2px de marge extérieure + 2px entre les cellules

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: 2, paddingBottom: 6 }}>
      {items.map((g, i) => (
        <Gradient key={i} media={g} style={{ width: cell, height: cell }} />
      ))}
    </View>
  );
}
