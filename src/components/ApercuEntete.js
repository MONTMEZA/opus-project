/**
 * « VOTRE EN-TÊTE DE DEVIS » — le texte tel qu'il s'imprimera.
 *
 * L'aperçu ne compose RIEN : tout vient d'`enteteImprime()`
 * (src/lib/emetteur.js), que `verifier-emetteur` fait tourner, et que le
 * lot 2 appellera sur l'instantané figé au moment de remettre un devis. Un
 * aperçu qui écrirait ses propres lignes finirait par montrer autre chose
 * que ce qui s'imprime.
 *
 * Ce qui manque s'écrit À SA PLACE, « [à compléter : votre médiateur] », en
 * orange de texte avec un filet : ce sont les MOTS qui portent
 * l'information, la couleur ne fait que la souligner. Et la source de
 * l'identité — « répertoire Sirene (INSEE), … consultée le … » — s'écrit en
 * petit sous l'identité : c'est la date de CONSULTATION, jamais une « date
 * de vérification », et c'est l'attribution que demande la Licence Ouverte.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  C, F, T, S, CARTE_PLEINE, interligne,
} from '../theme';
import { enteteImprime, estUnManque } from '../lib/emetteur';

function Ligne({ texte }) {
  const manque = estUnManque(texte);
  return <Text style={manque ? s.manque : s.ligne}>{texte}</Text>;
}

export default function ApercuEntete({
  entreprise = null, emetteur = null, assurances = [], tarifs = null,
}) {
  const { identite, mentions, source } = enteteImprime({ entreprise, emetteur, assurances, tarifs });
  return (
    <View style={s.carte}>
      <Text style={s.titre}>Votre en-tête de devis</Text>
      <Text style={s.aide}>
        Le texte est celui qui s’imprimera ; la mise en page viendra avec les modèles.
      </Text>
      <View style={s.groupe}>
        {identite.map((l, i) => <Ligne key={`i${i}`} texte={l} />)}
      </View>
      {!!source && <Text style={s.source}>{source}</Text>}
      <View style={[s.groupe, s.mentions]}>
        {mentions.map((l, i) => <Ligne key={`m${i}`} texte={l} />)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  /* La carte de CONTENU, angle vif : elle porte l'information. */
  carte: { ...CARTE_PLEINE, gap: S.sm },
  titre: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  groupe: { gap: S.xs },
  mentions: { paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.line },
  ligne: { fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  manque: {
    fontFamily: F.inter6, fontSize: T.courant, color: C.accentTexte, lineHeight: interligne(T.courant),
    borderLeftWidth: 3, borderLeftColor: C.accent, paddingLeft: S.sm,
  },
  source: { fontFamily: F.inter, fontSize: T.micro, color: C.muted, lineHeight: interligne(T.micro) },
});
