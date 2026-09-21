/**
 * Les textes légaux, lisibles DEPUIS l'application.
 *
 * Apple et Google exigent qu'ils soient accessibles sans compte et sans
 * connexion : un lien vers un site qui tombe en panne fait refuser la mise à
 * jour. Ils vivent donc dans src/data/legal.js, versionnés avec le code.
 *
 * LE BANDEAU D'AVERTISSEMENT
 * Tant que les mentions légales ne sont pas complètes, un bandeau orange le
 * dit, en haut, en toutes lettres, avec la liste de ce qui manque. Un texte
 * légal à moitié rempli qui passe inaperçu est le pire des deux mondes — et
 * une mention légale fausse engage la responsabilité de celui qui la publie.
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, F, T, S, interligne } from '../theme';
import { AlertTriangle } from '../components/icons';
import {
  VERSION, MENTIONS, CGU, CONFIDENTIALITE, editeurComplet, manquesEditeur,
} from '../data/legal';

const TEXTES = {
  mentions: { titre: 'Mentions légales', blocs: MENTIONS },
  cgu: { titre: 'Conditions d’utilisation', blocs: CGU },
  confidentialite: { titre: 'Politique de confidentialité', blocs: CONFIDENTIALITE },
};

export const TITRES_LEGAUX = {
  mentions: TEXTES.mentions.titre,
  cgu: TEXTES.cgu.titre,
  confidentialite: TEXTES.confidentialite.titre,
};

export default function LegalScreen({ texte = 'cgu' }) {
  const { titre, blocs } = TEXTES[texte] || TEXTES.cgu;
  const manques = manquesEditeur();

  return (
    <ScrollView style={s.page} contentContainerStyle={{ paddingBottom: 40 }}>
      {!editeurComplet() && (
        <View style={s.alerte}>
          <View style={s.alerteHaut}>
            <AlertTriangle size={15} color={C.accent} />
            <Text style={s.alerteTitre}>À compléter avant publication</Text>
          </View>
          <Text style={s.alerteTexte}>
            Ces textes ne sont pas encore valables : {manques.length} information
            {manques.length > 1 ? 's' : ''} manque
            {manques.length > 1 ? 'nt' : ''} — {manques.join(', ')}.
            {'\n\n'}
            Elles se remplissent dans le fichier `src/data/legal.js`, en haut.
            Personne d’autre que vous ne les connaît, et une mention légale
            inventée engagerait votre responsabilité.
          </Text>
        </View>
      )}

      <Text style={s.titre}>{titre}</Text>
      <Text style={s.version}>Version du {VERSION}</Text>

      {blocs.map((bloc) => (
        <View key={bloc.titre} style={s.bloc}>
          <Text style={s.blocTitre}>{bloc.titre}</Text>
          <Text style={s.blocTexte}>{bloc.texte}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: S.lg, paddingTop: S.md },

  alerte: {
    backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.accent,
    padding: S.md, gap: 6, marginBottom: S.lg,
  },
  alerteHaut: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alerteTitre: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accent },
  alerteTexte: {
    fontFamily: F.inter, fontSize: T.petit, color: C.ink,
    lineHeight: interligne(T.petit),
  },

  titre: { fontFamily: F.oswald7, fontSize: T.titre, color: C.ink },
  version: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, marginTop: S.xs },

  bloc: { marginTop: S.xl },
  blocTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  blocTexte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant) + 2, marginTop: 6,
  },
});
