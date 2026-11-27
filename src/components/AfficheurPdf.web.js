/**
 * L'AFFICHEUR DE L'APERÇU, AU NAVIGATEUR — la page HTML dans un cadre fermé
 * (étape 2c-1, cahier §5.5, D23, E-M5).
 *
 * Au navigateur, il n'y a pas de PDF : `expo-print` y ouvrirait la boîte
 * d'impression. On montre la PAGE du devis telle que la chaîne l'a composée,
 * dans un `iframe` :
 *   - `sandbox=""` (la chaîne VIDE) : aucun script, aucun formulaire, une
 *     origine opaque. Mesuré par la critique (`…/essais/cadre-web.mjs`) : un
 *     `<script>` posé dans un tel cadre ne s'exécute pas, et la page ne peut
 *     pas écouter le `print` du cadre ;
 *   - dans une boîte de 210 mm de large, 15 mm de marge intérieure — la
 *     largeur d'une page A4, sans ses pages —, RÉDUITE à la largeur de
 *     l'écran (`transform: scale`), comme un lecteur de PDF « ajusté à la
 *     largeur ». Mesuré au navigateur, à 393 points : sans la réduction, la
 *     page se tassait dans 393 px et la colonne de l'entreprise s'écrivait
 *     une lettre par ligne ;
 *   - une BANDE « APERÇU — ce document n’est pas remis » posée PAR-DESSUS le
 *     cadre : la page du navigateur n'a pas le tampon de chaque page ;
 *   - au-dessus, la phrase fixe qui dit ce que le navigateur ne montre pas :
 *     « Au navigateur : ni pages, ni marque sur chaque page, ni numéros de
 *     page. » Jamais « sur chaque page » dans un texte qui dirait le
 *     contraire (E-M5).
 *
 * AUCUN BOUTON D'OPUS QUI IMPRIME OU PARTAGE. (La boîte d'impression du
 * NAVIGATEUR reste la sienne : on ne dit pas « ni impression », on dit
 * « aucun bouton d'Opus », T13.)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F, T, S, interligne } from '../theme';
import { TEXTES_DE_L_ECRAN } from '../lib/etapes-apercu';

/* Les mesures du PAPIER, en millimètres : des chaînes posées telles quelles
   sur les éléments du navigateur (le cadre n'est pas un écran de la grille
   de 4). Un millimètre CSS vaut 96 / 25,4 pixels : la largeur de la feuille,
   en pixels, sert à calculer la réduction. */
const LARGEUR_FEUILLE_PX = (210 * 96) / 25.4;
const FEUILLE = Object.freeze({
  width: '210mm', padding: '15mm', boxSizing: 'border-box', position: 'absolute', top: 0, left: 0,
  backgroundColor: C.surface, display: 'flex', flexDirection: 'column', transformOrigin: 'top left',
});
const CADRE = Object.freeze({ border: 'none', width: '100%', flex: 1, backgroundColor: C.surface });

/* La réduction « ajustée à la largeur » : jamais d'agrandissement. */
export const reductionDeLaFeuille = (largeur) => (largeur > 0 ? Math.min(1, largeur / LARGEUR_FEUILLE_PX) : 1);

/** `html` : la page composée (`devisHtml`) — jamais un document du réseau. */
export default function AfficheurPdf({ html }) {
  /* La place réellement donnée à la feuille, mesurée : la feuille garde sa
     largeur de papier et se réduit pour y tenir ; sa hauteur, divisée par la
     même réduction, remplit la place une fois réduite. */
  const [place, setPlace] = useState({ largeur: 0, hauteur: 0 });
  const k = reductionDeLaFeuille(place.largeur);
  const feuille = { ...FEUILLE, height: place.hauteur > 0 ? `${place.hauteur / k}px` : '100%', transform: `scale(${k})` };
  return (
    <View style={s.boite}>
      <Text style={s.phrase}>{TEXTES_DE_L_ECRAN.web}</Text>
      <View
        style={s.feuilleBoite}
        onLayout={(e) => setPlace({ largeur: e.nativeEvent.layout.width, hauteur: e.nativeEvent.layout.height })}
      >
        <div style={feuille}>
          <iframe title={TEXTES_DE_L_ECRAN.titre} srcDoc={typeof html === 'string' ? html : ''} sandbox="" style={CADRE} />
        </div>
        {/* LA BANDE, PAR-DESSUS LE CADRE : elle ne reçoit aucun appui. */}
        <View style={s.bande} pointerEvents="none">
          <Text style={s.bandeTexte}>{TEXTES_DE_L_ECRAN.bandeWeb}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  boite: { flex: 1, gap: S.sm, backgroundColor: C.bg },
  phrase: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), paddingHorizontal: S.lg,
  },
  feuilleBoite: { flex: 1, position: 'relative', overflow: 'hidden' },
  /* De la STRUCTURE posée sur le document : angle vif, l'encre et le fond de
     l'application. */
  bande: {
    position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingVertical: S.xs,
    backgroundColor: C.ink,
  },
  bandeTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.surface },
});
