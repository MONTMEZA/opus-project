/**
 * LA CARTE « APERÇU DU DEVIS » — le CADRE (étape 2c-1, cahier §6.2, D18).
 *
 * Le cadre des autres cartes du devis (`PourRemettre.js`) : une vue plein
 * écran posée au-dessus de la saisie, JAMAIS une `Modal` (la saisie tient UN
 * état de carte) ; `accessibilityViewIsModal` — sans elle, VoiceOver lirait
 * le devis sous l'aperçu ; une barre fixe avec « ‹ Devis » (44 × 44,
 * « Revenir au devis ») et le titre « Aperçu du devis ». Il ne monte PAS de
 * `ScrollView` : le document défile lui-même, et une `WebView` dans un
 * `ScrollView` vertical empêche de faire défiler l'une ou l'autre.
 *
 * Le CORPS (`ApercuDevis.js`) est partagé avec l'écran des exemples : il
 * reçoit la séance et l'arrête quand il se démonte — fermer la carte, c'est
 * effacer l'aperçu.
 *
 * AUCUN BOUTON D'OPUS QUI ENVOIE, PARTAGE OU IMPRIME.
 */
import React from 'react';
import {
  View, Text, Pressable, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI,
} from '../theme';
import ApercuDevis from './ApercuDevis';
import { TEXTES_DE_L_ECRAN } from '../lib/etapes-apercu';

/** `seance` : la séance créée par le geste ; `onFermer()` : la carte se ferme. */
export default function CarteApercu({ seance, onFermer }) {
  return (
    <View style={s.ecran} accessibilityViewIsModal>
      <View style={s.barre}>
        <Pressable
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel={TEXTES_DE_L_ECRAN.retourVoix}
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <Text style={s.retourTexte}>{TEXTES_DE_L_ECRAN.retour}</Text>
        </Pressable>
        <View style={s.milieu}>
          <Text style={s.barreTitre} numberOfLines={1}>{TEXTES_DE_L_ECRAN.titre}</Text>
        </View>
        <View style={s.place} />
      </View>
      <View style={s.corps}>
        <ApercuDevis seance={seance} onRevenir={onFermer} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  /* LA CARTE prend l'écran. `StyleSheet.absoluteFill`, et SURTOUT PAS
     `absoluteFillObject` : React Native 0.86 ne le connaît plus (seul
     `react-native-web` le garde). Étalé, il ne posait RIEN sur l'iPhone :
     la carte se rangeait sous le pied du devis, réduite à sa barre, et
     l'aperçu n'avait aucune hauteur (constaté par le propriétaire le
     27/11, capture à l'appui). Au navigateur, rien ne se voyait. */
  ecran: { ...StyleSheet.absoluteFill, backgroundColor: C.surface, zIndex: 20 },
  barre: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.sm, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  retour: { minHeight: TOUCHE, minWidth: TOUCHE, justifyContent: 'center', paddingHorizontal: S.sm },
  retourTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  milieu: { flex: 1, minWidth: 0, alignItems: 'center' },
  barreTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  place: { minWidth: TOUCHE },
  corps: { flex: 1 },
});
