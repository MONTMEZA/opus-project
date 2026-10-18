/**
 * « PRÊT À ÉMETTRE UN DEVIS ? » — ce qui manque, dit par la BASE.
 *
 * Le premier bloc de « Mon entreprise ». Il répond à la seule question qui
 * compte avant le premier devis, et il y répond avec les phrases
 * d'`emetteur_incomplet()` (section 46) : la base est l'autorité, l'écran
 * ne recompose rien.
 *
 * TROIS CHOSES QUI NE SONT PAS COSMÉTIQUES
 * ---------------------------------------
 *   1. LE TITRE VIENT DE `titrePreparation()`, et un ÉCHEC NE REND JAMAIS
 *      « OUI ». Un travail qui n'a pas pu se faire ne doit jamais ressembler
 *      à un travail fait — la règle de « Pour moi » du 05/10. Le contrôle
 *      le fait tourner.
 *   2. DEUX NIVEAUX DE « PRÊT » : pour un devis à un PROFESSIONNEL, puis à un
 *      PARTICULIER. Le code de la consommation ne vaut que face à un
 *      consommateur (réponse du propriétaire, 18/10/2026) : ses motifs
 *      portent le préfixe `conso_`, et l'écran les range à part, sous
 *      « Seulement pour un devis à un particulier ». Le code de commerce,
 *      lui, vaut pour tout devis.
 *   3. CHAQUE MOTIF QUI SE COMPLÈTE EST UNE CIBLE de 44 points, dont
 *      l'étiquette parlée est la PHRASE ENTIÈRE. Un motif qui ne se complète
 *      pas dans Opus (la profession réglementée) reste un TEXTE : une cible
 *      qui ne répond pas est pire que pas de cible.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import { BtnMini } from './ui';
import { ChevronRight } from './icons';
import { titrePreparation, etatPreparation } from '../lib/emetteur';

const COULEUR_DU_TON = {
  neutre: C.line,
  echec: C.bad,
  pret: C.ok,
  partiel: C.accent2,
  /* Un filet est un élément graphique : il lui faut 3 : 1 contre ce qui
     l'entoure. L'orange de signature n'y donne que 2,76 sur le fond beige ;
     l'encre orange de lecture donne 4,52 et 5,74 (règle du lot 5, comme les
     voyants). Le titre dit de toute façon l'état en mots. */
  manque: C.accentTexte,
};

function Motif({ motif, onCompleter }) {
  if (!motif.section || !onCompleter) {
    return <Text style={s.motifTexte}>{motif.phrase}</Text>;
  }
  return (
    <Pressable
      onPress={() => onCompleter(motif)}
      accessibilityRole="button"
      accessibilityLabel={motif.phrase}
      accessibilityHint="Ouvre la section qui permet de le compléter"
      style={({ pressed }) => [s.motif, pressed && APPUI.discret]}
    >
      <Text style={s.motifTexte}>{motif.phrase}</Text>
      <ChevronRight size={15} color={C.muted} />
    </Pressable>
  );
}

export default function PretAEmettre({
  etat, motifs = [], avis = [], onReessayer, onCompleter,
}) {
  const { titre, detail, ton } = titrePreparation(etat, motifs);
  const p = etat === 'pret' ? etatPreparation(motifs) : null;

  return (
    <View style={[s.bloc, { borderLeftColor: COULEUR_DU_TON[ton] || C.line }]}>
      <Text style={s.question}>Prêt à émettre un devis ?</Text>
      <Text style={s.titre} accessibilityRole="header">{titre}</Text>
      {!!detail && <Text style={s.detail}>{detail}</Text>}

      {etat !== 'pret' && etat !== 'charge' && !!onReessayer && (
        <BtnMini outline label="Réessayer" onPress={onReessayer} style={s.cible} />
      )}

      {/* Ce qui bloque TOUT devis d'abord : le code de commerce, les choix
          d'Opus. Puis, à part, ce que seul un particulier exige. */}
      {!!p && p.manque.length > 0 && (
        <View style={s.liste}>
          {p.manque.map((m, i) => (
            <Motif key={`${m.cle || 'inconnu'}-${i}`} motif={m} onCompleter={onCompleter} />
          ))}
        </View>
      )}

      {!!p && p.manqueParticulier.length > 0 && (
        <View style={s.liste}>
          {p.manque.length > 0 && (
            <Text style={s.sousTitre}>Seulement pour un devis à un particulier :</Text>
          )}
          {p.manqueParticulier.map((m, i) => (
            <Motif key={`${m.cle || 'inconnu'}-${i}`} motif={m} onCompleter={onCompleter} />
          ))}
        </View>
      )}

      {/* LES AVIS NE BLOQUENT RIEN, et l'encre discrète le dit : ce sont des
          remarques, pas des manques. */}
      {avis.length > 0 && (
        <View style={s.avis}>
          {/* Une CLÉ UNIQUE par avis : deux assurances dans le même cas
              donnent deux avis de même `cle` (relecture du 18/10/2026). */}
          {avis.map((a, i) => (
            <Text key={`${a.cle}-${a.id == null ? i : a.id}`} style={s.avisTexte}>{a.texte}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  /* Angle VIF : ce bloc PORTE l'information. Le filet de gauche dit l'état,
     et les mots le disent aussi — la couleur ne porte jamais l'information
     toute seule. */
  bloc: {
    gap: S.sm, padding: S.md, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, borderLeftWidth: S.xs,
  },
  question: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted },
  titre: {
    fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink, lineHeight: interligne(T.sousTitre),
  },
  detail: { fontFamily: F.inter, fontSize: T.courant, color: C.muted, lineHeight: interligne(T.courant) },
  liste: { gap: S.xs },
  sousTitre: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2, marginTop: S.sm },
  motif: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE,
    paddingVertical: S.sm, borderTopWidth: 1, borderTopColor: C.line,
  },
  motifTexte: {
    flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
  },
  avis: { gap: S.sm, marginTop: S.sm, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.line },
  avisTexte: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  cible: { minHeight: TOUCHE, alignSelf: 'flex-start' },
});
