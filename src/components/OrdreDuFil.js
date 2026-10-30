/**
 * « COMMENT LE FIL EST ORDONNÉ » — une ligne qui se DÉPLIE sur place (lot
 * S-c, 30/10/2026).
 *
 * Le texte vit dans `legal.js` (`ORDRE_DU_FIL`), écrit UNE fois et servi à
 * la CGU comme ici : deux écritures finiraient par se contredire, et l'une
 * des deux est opposable.
 *
 * POURQUOI DÉPLIER, ET PAS OUVRIR LES CONDITIONS : l'information doit être
 * accessible depuis la page des RÉSULTATS (la ligne « Filtre : … » du fil),
 * pas trois écrans plus loin ; et l'écran des textes légaux ne sait ouvrir
 * aucune section — il ouvrirait toute la CGU (critique « textes » du cahier,
 * constat 7). Fermée, la ligne ne prend que 44 points.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import { Info, ChevronDown } from './icons';
import { ORDRE_DU_FIL } from '../data/legal';

export default function OrdreDuFil({ style }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <View style={style}>
      <Pressable
        onPress={() => setOuvert((o) => !o)}
        style={({ pressed }) => [s.ligne, pressed && APPUI.discret]}
        accessibilityRole="button"
        accessibilityState={{ expanded: ouvert }}
        accessibilityLabel="Comment le fil est ordonné"
      >
        <Info size={14} color={C.muted} />
        <Text style={s.titre}>Comment le fil est ordonné</Text>
        <View style={ouvert ? s.chevronOuvert : null}>
          <ChevronDown size={16} color={C.muted} />
        </View>
      </Pressable>
      {ouvert && <Text style={s.texte}>{ORDRE_DU_FIL}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE,
  },
  titre: { flex: 1, minWidth: 0, fontFamily: F.inter6, fontSize: T.petit, color: C.muted },
  chevronOuvert: { transform: [{ rotate: '180deg' }] },
  texte: {
    fontFamily: F.inter, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit),
    paddingBottom: S.sm,
  },
});
