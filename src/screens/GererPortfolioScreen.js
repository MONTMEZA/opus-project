/**
 * « Organiser mes réalisations » — réordonner et retirer les photos du
 * portfolio.
 *
 * L'ordre compte : c'est la première réalisation qui sert de bannière par
 * défaut au profil, et ce sont les premières que voit un particulier qui
 * hésite entre deux artisans. Jusqu'ici l'ordre était celui des publications,
 * sans moyen d'y toucher.
 *
 * Rien n'est enregistré avant d'avoir appuyé sur « Enregistrer » : on peut
 * essayer plusieurs ordres, se tromper, et repartir sans rien casser.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { BtnMain, BtnOutline, SectionLabel } from '../components/ui';
import GestionMedias from '../components/GestionMedias';

export default function GererPortfolioScreen({ portfolio = [], onEnregistrer, onAnnuler }) {
  const [liste, setListe] = useState(portfolio);

  const modifie = liste.length !== portfolio.length
    || liste.some((m, i) => m !== portfolio[i]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 34 }}>
      <View style={s.intro}>
        <Text style={s.introTexte}>
          Les flèches changent l'ordre, la croix retire une réalisation.
          {'\n'}
          La première sert de bannière à votre profil quand vous n'en avez pas
          choisi une.
        </Text>
      </View>

      <SectionLabel>
        {liste.length} {liste.length > 1 ? 'réalisations' : 'réalisation'}
      </SectionLabel>

      <GestionMedias items={liste} onChanger={setListe} />

      <View style={s.boutons}>
        <BtnOutline label="Annuler" onPress={onAnnuler} />
        <BtnMain
          label={modifie ? 'Enregistrer' : 'Aucun changement'}
          disabled={!modifie}
          onPress={() => onEnregistrer(liste)}
        />
      </View>

      <Text style={s.note}>
        Retirer une réalisation ne supprime pas la publication correspondante :
        elle reste dans le fil et dans « Mes publications ». Seule la vitrine
        de votre profil change.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  intro: { paddingHorizontal: 16, paddingTop: 14 },
  introTexte: { fontSize: 12, color: C.muted, fontFamily: F.inter, lineHeight: 18 },
  boutons: {
    flexDirection: 'row', gap: 8, justifyContent: 'flex-end',
    paddingHorizontal: 16, paddingTop: 18,
  },
  note: {
    fontSize: 11, color: C.muted, fontFamily: F.inter, lineHeight: 16,
    paddingHorizontal: 16, paddingTop: 16,
  },
});
