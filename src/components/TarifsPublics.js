/**
 * LE BLOC DES TARIFS — « Ses tarifs » sur la fiche d'un artisan, « Mes
 * tarifs » sur sa propre page, et l'aperçu de « Mon entreprise » (lot T,
 * section 47 de `schema.sql`).
 *
 * UN SEUL COMPOSANT POUR LES TROIS, et c'est la règle de `FicheContactPro` :
 * écrit deux fois, il divergerait, et l'artisan ne verrait plus ce que
 * voient les particuliers.
 *
 * CE QU'IL NE DÉCIDE PAS — et c'est voulu
 * ---------------------------------------
 *   - Il ne regarde PAS si les tarifs sont affichés. Il sert aussi d'aperçu
 *     dans « Mon entreprise » (« Ce que verraient les particuliers »),
 *     précisément quand ils ne le sont pas. La garde vit chez les deux
 *     écrans publics.
 *   - Il ne regarde PAS qui le lit. Les tarifs affichés ne vont qu'aux
 *     PARTICULIERS (réponse du propriétaire du 19/10/2026) : la base le tient
 *     d'abord (`not est_un_pro()`), puis `OpusApp`, qui ne les lit et ne
 *     les transmet que pour un particulier.
 *   - Il n'a AUCUN texte de remplacement. Sans ligne, il ne rend rien : un
 *     « aucun tarif » montré à un autre artisan serait faux — l'artisan a
 *     peut-être des tarifs affichés, ils ne sont simplement pas pour lui.
 *
 * `quiLesVoit` : la phrase qui dit à l'artisan QUI voit ce bloc. Sur sa
 * propre page, il voit ses tarifs ; ses confrères, eux, ne les voient pas.
 * Sans elle, « l'artisan voit sa page comme ses clients » lui ferait croire
 * que tout le monde voit ce bloc. Elle vient toujours de
 * `QUI_VOIT_LES_TARIFS` (src/lib/tarifs.js), jamais écrite à la main.
 *
 * La majoration n'est qu'un POURCENTAGE (`lignesTarifs`) : l'artisan n'a
 * déclaré que ce chiffre, et les heures où Opus l'applique sont une
 * convention d'Opus, pas la sienne.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  C, F, T, S, CARTE, GOUTTIERE, interligne,
} from '../theme';
import { SectionLabel } from './ui';
import { lignesTarifs } from '../lib/tarifs';

export default function TarifsPublics({
  tarifs, titre, quiLesVoit = null, dansUnePage = true,
}) {
  const lignes = lignesTarifs(tarifs);
  if (lignes.length === 0) return null;

  return (
    <View>
      <SectionLabel style={!dansUnePage && s.sansMarge}>{titre}</SectionLabel>
      {!!quiLesVoit && (
        <Text style={[s.quiLesVoit, !dansUnePage && s.sansMarge]}>{quiLesVoit}</Text>
      )}
      <View style={[s.carte, !dansUnePage && s.carteSansMarge]}>
        {lignes.map((l, i) => (
          <View
            key={l.cle}
            style={[s.ligne, i > 0 && s.ligneSuivante]}
            accessible
            accessibilityLabel={l.libelle ? `${l.libelle} : ${l.valeur}` : l.valeur}
          >
            {!!l.libelle && <Text style={s.libelle}>{l.libelle}</Text>}
            <Text style={s.valeur}>{l.valeur}</Text>
          </View>
        ))}
        <Text style={s.pied}>
          Tarifs déclarés par l’artisan, toutes taxes comprises. Le prix d’un chantier se fixe
          sur devis.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sansMarge: { paddingHorizontal: 0, marginHorizontal: 0 },
  quiLesVoit: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
    marginHorizontal: GOUTTIERE, marginBottom: S.sm,
  },
  /* Le bloc PORTE l'information : la carte de contenu, angle vif. */
  carte: { ...CARTE, marginHorizontal: GOUTTIERE, paddingHorizontal: S.md, paddingBottom: S.md },
  carteSansMarge: { marginHorizontal: 0 },
  ligne: { paddingTop: S.md, gap: S.xs },
  ligneSuivante: { borderTopWidth: 1, borderTopColor: C.line, marginTop: S.md },
  libelle: { fontFamily: F.inter, fontSize: T.courant, color: C.muted },
  valeur: {
    fontFamily: F.inter6, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps),
  },
  pied: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
    marginTop: S.md,
  },
});
