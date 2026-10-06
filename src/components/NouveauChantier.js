/**
 * DONNER UN NOM À UN CHANTIER.
 *
 * LE NOM NE DOIT PAS ÊTRE CELUI DU CLIENT, et c'est tout l'objet de
 * l'avertissement sous le champ. Le propriétaire avait spontanément proposé
 * « Chantier Martin » — or ce titre s'affiche PUBLIQUEMENT sur chacune des
 * publications du chantier. Ça revient à écrire « Monsieur Martin, à
 * Charleval, a fait refaire sa toiture » : une donnée personnelle sur
 * quelqu'un qui n'a rien accepté et n'est même pas sur Opus.
 *
 * C'est la règle du 21/09 — ce qui concerne des TIERS ne se publie pas à la
 * légère. La base ne peut pas deviner un nom de famille : c'est ici que ça
 * se dit, et c'est pourquoi l'exemple proposé décrit le TRAVAIL.
 *
 * Et c'est aussi ce qu'un client cherche : il veut « quelqu'un qui fait des
 * toitures », pas « quelqu'un qui connaît Martin ».
 *
 * `FeuilleBas` et pas une fenêtre à nous : elle monte avec le clavier, son
 * voile ferme, et son contenu défile. Sans ces trois-là, le clavier de
 * l'iPhone recouvre le champ ET la croix — le défaut du 04/10 qui a fait
 * dire « je suis bloqué ».
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F, T, S, interligne } from '../theme';
import FeuilleBas from './FeuilleBas';
import { BtnMain, Field } from './ui';

export default function NouveauChantier({ villeParDefaut = '', onFermer, onCreer }) {
  const [titre, setTitre] = useState('');
  const [occupe, setOccupe] = useState(false);

  const valider = async () => {
    const propre = titre.trim();
    if (!propre || occupe) return;
    setOccupe(true);
    try { await onCreer({ titre: propre, ville: villeParDefaut || null }); }
    finally { setOccupe(false); }
  };

  return (
    <FeuilleBas titre="Nouveau chantier" onFermer={onFermer}>
      <Text style={s.label}>Nom du chantier</Text>
      <Field
        placeholder="Toiture Charleval"
        value={titre}
        onChangeText={setTitre}
        autoFocus
        maxLength={80}
        returnKeyType="done"
        onSubmitEditing={valider}
      />

      <View style={s.garde}>
        <Text style={s.gardeTitre}>Ce nom sera visible de tout le monde</Text>
        <Text style={s.gardeTexte}>
          Décrivez le TRAVAIL, pas votre client : « Toiture Charleval »,
          « Piscine Rogne ». Un nom de famille sur une publication, c&apos;est
          une information sur quelqu&apos;un qui ne vous l&apos;a pas demandé —
          et vos clients cherchent un couvreur, pas une connaissance.
        </Text>
      </View>

      <BtnMain
        block
        disabled={!titre.trim() || occupe}
        label={occupe ? 'Création…' : 'Créer le chantier'}
        onPress={valider}
        style={{ marginTop: S.md }}
      />
    </FeuilleBas>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink, marginBottom: S.sm },
  /* Angle VIF : ce bloc PORTE un avertissement, il ne flotte pas. */
  garde: {
    marginTop: S.md, padding: S.md,
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.accent,
  },
  gardeTitre: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accentTexte },
  gardeTexte: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    marginTop: S.xs, lineHeight: interligne(T.petit),
  },
});
