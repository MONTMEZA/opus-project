/**
 * L'AFFICHEUR DE L'APERÇU, SUR L'IPHONE — le PDF marqué, dans une `WebView`
 * aux portes fermées (étape 2c-1, cahier §5.5).
 *
 * MINCE, EXPRÈS (K6). Ce qui DÉCIDE — les réglages, l'adresse permise, le
 * délai d'une page qui reste blanche — vit dans `reglages-afficheur.js`, que
 * `node` fait tourner (`verifier-apercu`, G). Ce fichier ne fait que brancher
 * `react-native-webview`.
 *
 * CE QUI SE CHARGE AU MOMENT DE MONTRER, et jamais au démarrage d'Opus :
 * `react-native-webview`, après avoir vérifié que son module natif est là —
 * c'est l'enveloppe qu'autorise `verifier-imports`.
 *
 * LES RÉGLAGES SONT ÉTALÉS EN DERNIER (`{...PROPS_AFFICHEUR}`) : un attribut
 * écrit après eux les remplacerait. La porte de navigation
 * (`onShouldStartLoadWithRequest`) ne laisse passer QUE le fichier de
 * l'aperçu, et inscrit chaque adresse refusée pour les Détails.
 *
 * UNE PAGE QUI RESTE BLANCHE SE DÉTECTE (E-M7) : un refus de navigation ne
 * lève aucune erreur, et la fin du chargement peut ne jamais venir. Un
 * indicateur jusqu'à `onLoadEnd` ; 10 s sans lui, l'afficheur le dit à la
 * séance (« [affichage] Le document n’a pas pu s’afficher. », « Réessayer »).
 *
 * AUCUNE ÉTIQUETTE `accessibilityLabel` SUR LA `WebView` (E-m5) : elle
 * pourrait en faire un seul élément et cacher le PDF à VoiceOver. La ligne de
 * texte qui la précède dit ce que c'est.
 *
 * AUCUN BOUTON D'OPUS QUI ENVOIE, PARTAGE OU IMPRIME.
 *
 * Au navigateur, c'est `AfficheurPdf.web.js` qui est pris (l'importeur écrit
 * `'./AfficheurPdf'`, sans extension).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ActivityIndicator, Platform, StyleSheet,
} from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { C, F, T, S, interligne } from '../theme';
import { PROPS_AFFICHEUR, adresseAutorisee, DELAI_AFFICHAGE } from '../lib/reglages-afficheur';
import { PHRASES_DE_LA_SEANCE } from '../lib/etapes-apercu';

/* LE MODULE DE LA `WebView`, chargé au moment de montrer : rien hors de
   l'iPhone, rien sans son natif. */
let cacheAfficheur;
function moduleAfficheur() {
  if (cacheAfficheur !== undefined) return cacheAfficheur;
  cacheAfficheur = null;
  if (Platform.OS !== 'ios') return null;
  if (!requireOptionalNativeModule('RNCWebViewModule')) return null;
  try {
    cacheAfficheur = require('react-native-webview').WebView || null;
  } catch (e) {
    cacheAfficheur = null;
  }
  return cacheAfficheur;
}

/**
 * `uri` : le fichier de l'aperçu ; `onEchec(detail)` : la page n'a pas pu
 * s'afficher (la séance efface le fichier et propose de réessayer) ;
 * `onAdresses({ vue, refusees })` : ce que la porte a vu, pour les Détails.
 */
export default function AfficheurPdf({ uri, onEchec = null, onAdresses = null }) {
  const [charge, setCharge] = useState(false);
  const refusees = useRef([]);
  const fin = useRef(false);
  /* Résolu UNE fois, au montage (un état, pas un appel à chaque rendu : un
     composant qui changerait d'un rendu à l'autre remonterait la page). */
  const [WebView] = useState(moduleAfficheur);

  /* Le dernier rappel, toujours : le minuteur et la porte ne doivent pas
     appeler celui du premier rendu. */
  const rappels = useRef({ onEchec, onAdresses });
  useEffect(() => { rappels.current = { onEchec, onAdresses }; });

  /* Le premier échec seulement : la séance n'en entend qu'un. */
  const echouer = (detail) => {
    if (fin.current) return;
    fin.current = true;
    if (rappels.current.onEchec) rappels.current.onEchec(detail);
  };

  /* 10 s sans fin de chargement : la page est tenue pour blanche. Sans le
     module de la `WebView`, l'échec se dit tout de suite. Un minuteur par
     document : un autre `uri`, c'est un autre afficheur (sa clé). */
  useEffect(() => {
    const dire = (detail) => {
      if (fin.current) return;
      fin.current = true;
      if (rappels.current.onEchec) rappels.current.onEchec(detail);
    };
    if (!WebView) {
      dire('l’afficheur de documents manque à cette version d’Opus');
      return undefined;
    }
    const minuteur = setTimeout(() => {
      dire(`${DELAI_AFFICHAGE / 1000} s sans fin de chargement${refusees.current.length
        ? ` ; refusées : ${refusees.current.join(', ')}` : ''}`);
    }, DELAI_AFFICHAGE);
    return () => clearTimeout(minuteur);
  }, [uri, WebView]);

  if (!WebView) {
    return (
      <View style={s.boite}>
        <Text style={s.phrase}>{PHRASES_DE_LA_SEANCE.affichage}</Text>
      </View>
    );
  }

  const porte = (requete) => {
    const vue = requete && requete.url;
    const ok = adresseAutorisee(vue, uri);
    if (!ok) refusees.current.push(String(vue));
    if (rappels.current.onAdresses) rappels.current.onAdresses({ vue: ok ? String(vue) : null, refusees: [...refusees.current] });
    return ok;
  };

  return (
    <View style={s.boite}>
      <WebView
        source={{ uri }}
        onShouldStartLoadWithRequest={porte}
        onError={(e) => echouer(`erreur : ${String((e && e.nativeEvent && e.nativeEvent.description) || 'inconnue')}`)}
        onHttpError={(e) => echouer(`erreur HTTP ${String((e && e.nativeEvent && e.nativeEvent.statusCode) || '')}`)}
        onLoadEnd={() => { fin.current = true; setCharge(true); }}
        style={s.vue}
        {...PROPS_AFFICHEUR}
      />
      {!charge && (
        <View style={s.attente} pointerEvents="none">
          <ActivityIndicator color={C.accent2} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  boite: { flex: 1, backgroundColor: C.bg },
  vue: { flex: 1, backgroundColor: C.bg },
  /* `absoluteFill`, pas `absoluteFillObject`, que React Native 0.86 ne
     connaît plus (voir `CarteApercu.js`). */
  attente: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  phrase: {
    fontFamily: F.inter, fontSize: T.courant, color: C.bad, lineHeight: interligne(T.courant), padding: S.lg,
  },
});
