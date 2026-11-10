/**
 * « BÂTIMENT NEUF OU TRANSFORMATION IMPORTANTE » — la confirmation du « Oui »
 * à la première question du chantier (lot 2b-2, cahier §3.5, annexe A.4).
 *
 * Ce « Oui » RETIRE au client des protections — 14 jours pour changer
 * d'avis, le formulaire de rétractation, la règle du 8e jour (C. consom.
 * L. 221-2 12°) : rien n'est écrit avant « Je confirme », et la BASE garde
 * la date de la confirmation (`chantier_neuf_conso_le`). Les textes sont
 * ceux de `LE_CHANTIER.confirmation` (devis.js), mot pour mot.
 *
 * UNE FEUILLE DU BAS, par l'état UNIQUE `feuille` de la saisie
 * (`{ type: 'chantier_neuf' }`), posée par-dessus la carte « Le chantier »,
 * comme la feuille d'un poste par-dessus une ligne. « Garder « Non » » est
 * le premier bouton : c'est le cas le plus sûr.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  C, F, T, S, interligne,
} from '../theme';
import FeuilleBas from './FeuilleBas';
import { BtnMain, BtnOutline } from './ui';
import { LE_CHANTIER } from '../lib/devis';

export default function FeuilleChantierNeuf({ onConfirmer, onFermer }) {
  const c = LE_CHANTIER.confirmation;
  return (
    <FeuilleBas titre={c.titre} onFermer={onFermer}>
      {c.paragraphes.map((p) => <Text key={p.slice(0, 24)} style={s.texte}>{p}</Text>)}
      <View style={s.boutons}>
        <BtnOutline label={c.garder} onPress={onFermer} />
        <BtnMain block ton="sombre" label={c.confirmer} onPress={onConfirmer} />
      </View>
    </FeuilleBas>
  );
}

const s = StyleSheet.create({
  texte: { fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  boutons: { gap: S.sm, marginTop: S.sm },
});
