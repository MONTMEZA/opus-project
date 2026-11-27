/**
 * LE CORPS DE L'APERÇU — ce que l'écran montre d'une SÉANCE (étape 2c-1,
 * cahier §6.2, §6.3).
 *
 * Il reçoit une séance (`creerSeance`, `etapes-apercu.js`) et RIEN d'autre :
 * le cadre de la saisie (`CarteApercu.js`) et l'écran des exemples d'OpusApp
 * le montent tous les deux. Il lit la séance par `useSyncExternalStore`, et
 * l'ARRÊTE dans le nettoyage d'un effet : quel que soit le chemin de sortie
 * (la flèche, la barre du bas, un autre écran, la saisie démontée), la
 * chaîne s'arrête là où elle en est et le fichier de l'aperçu est effacé.
 *
 * LA FABRICATION PART DU GESTE (K2), jamais d'un effet au montage : c'est
 * l'appelant qui démarre la séance. Ce composant ne la redémarre que sur
 * « Réessayer ».
 *
 * CE QU'IL MONTRE, UNE FOIS PRÊT (E-M2), de haut en bas : une ligne de
 * résumé (« 3 pages · « APERÇU » sur chaque page », iPhone seulement) ; une
 * rangée « Ce que montre cet aperçu », qui déplie ses phrases À LA PLACE du
 * document ; le document, en `flex: 1`, JAMAIS dans un `ScrollView` (une
 * `WebView` qui défile dans un `ScrollView` vertical empêche de faire
 * défiler l'une ou l'autre) ; et, en `__DEV__` seulement, « Détails de la
 * fabrication », qui les montre À LA PLACE du document — ils ne reçoivent
 * jamais le document (C-M13).
 *
 * LES REFUS ONT UN SEUL BOUTON (§6.3) : « Réessayer » quand réessayer peut
 * réussir, « Revenir au devis » quand il faut d'abord changer le devis.
 *
 * AUCUN BOUTON D'OPUS QUI ENVOIE, PARTAGE OU IMPRIME.
 */
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, Platform, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import { BtnMain } from './ui';
import { ChevronRight, ChevronDown } from './icons';
import AfficheurPdf from './AfficheurPdf';
import {
  TEXTES_DE_L_ECRAN, BOUTONS, PHRASE_POLICES_DU_TELEPHONE, resumeDuDocument, ligneAvantLeDocument, phraseDeCeQuiManque,
  detailsDeFabrication,
} from '../lib/etapes-apercu';
import { issueDesPolices } from '../lib/tampon-apercu';
import { empreintesDuTelephone } from '../lib/devis-pdf';

const ATTENTE = new Set(['repos', 'attente_precedent', 'enregistrement', 'lecture', 'mise_en_page', 'marque']);

/* Les phrases de « Ce que montre cet aperçu » (A.2), dans leur ordre. Le
   fichier ne se dit que sur l'iPhone : au navigateur, il n'y en a pas. */
function phrasesDeLApercu(etat) {
  const p = [];
  const manque = phraseDeCeQuiManque(etat.places);
  if (manque) p.push(manque);
  p.push(TEXTES_DE_L_ECRAN.pasComplet);
  (Array.isArray(etat.avisEcran) ? etat.avisEcran : []).forEach((a) => {
    const t = a && typeof a === 'object' ? a.texte : a;
    if (typeof t === 'string' && t) p.push(t);
  });
  if (etat.etape === 'pret' && issueDesPolices(etat.polices) === 'telephone') p.push(PHRASE_POLICES_DU_TELEPHONE);
  if (etat.etape === 'pret') p.push(TEXTES_DE_L_ECRAN.fichier);
  return p;
}

/**
 * `seance` : la séance (`creerSeance`) ; `onRevenir()` : « Revenir au devis »
 * (la carte se ferme).
 */
export default function ApercuDevis({ seance, onRevenir = null }) {
  const etat = useSyncExternalStore(seance.abonner, seance.lire, seance.lire);
  /* L'ARRÊT AU DÉMONTAGE : un seul mécanisme pour tous les chemins de sortie. */
  useEffect(() => () => seance.arreter(), [seance]);

  /* `null` : le document ; `ce_qu_il_montre` ; `details` (`__DEV__`). */
  const [vue, setVue] = useState(null);
  const [adresses, setAdresses] = useState(null);
  const [empreintes, setEmpreintes] = useState(null);

  const basculer = (v) => setVue((avant) => (avant === v ? null : v));
  const ouvrirDetails = () => {
    basculer('details');
    if (empreintes === null) {
      setEmpreintes('calcul');
      empreintesDuTelephone().then((e) => setEmpreintes(e || {}), (e) => setEmpreintes({ erreur: String(e && e.message) }));
    }
  };

  if (ATTENTE.has(etat.etape)) {
    return (
      <View style={s.attente} accessibilityLiveRegion="polite">
        <ActivityIndicator color={C.accent2} />
        {!!etat.texte && <Text style={s.etape}>{etat.texte}</Text>}
        {!!etat.phraseLongue && <Text style={s.aide}>{etat.phraseLongue}</Text>}
      </View>
    );
  }

  if (etat.etape === 'refus') {
    const revenir = etat.bouton === 'revenir';
    return (
      <ScrollView style={s.fondRefus} contentContainerStyle={s.refus}>
        <Text style={s.refusTexte} accessibilityRole="alert">{etat.phrase}</Text>
        {revenir
          ? <BtnMain label={BOUTONS.revenir} onPress={() => { if (onRevenir) onRevenir(); }} />
          : <BtnMain label={BOUTONS.reessayer} onPress={() => { seance.demarrer(); }} />}
        {__DEV__ && !!etat.detail && <Text style={s.detail}>{etat.detail}</Text>}
      </ScrollView>
    );
  }

  /* PRÊT (l'iPhone) ou WEB (le navigateur). */
  const surLeTelephone = etat.etape === 'pret';
  const montre = vue === 'ce_qu_il_montre';
  const Chevron = montre ? ChevronDown : ChevronRight;
  return (
    <View style={s.pret}>
      {surLeTelephone && (
        <Text style={s.resume} accessibilityRole="header">{resumeDuDocument(etat.pages)}</Text>
      )}
      <Pressable
        onPress={() => basculer('ce_qu_il_montre')}
        accessibilityRole="button"
        accessibilityState={{ expanded: montre }}
        accessibilityLabel={TEXTES_DE_L_ECRAN.depliant}
        style={({ pressed }) => [s.rangee, pressed && APPUI.discret]}
      >
        <Text style={s.rangeeTexte}>{TEXTES_DE_L_ECRAN.depliant}</Text>
        <Chevron size={16} color={C.accent2} />
      </Pressable>

      {vue === 'ce_qu_il_montre' && (
        <ScrollView style={s.place} contentContainerStyle={s.phrases}>
          {phrasesDeLApercu(etat).map((p) => <Text key={p} style={s.phraseListe}>{p}</Text>)}
        </ScrollView>
      )}

      {vue === 'details' && (
        <ScrollView style={s.place} contentContainerStyle={s.phrases}>
          <Text style={s.rangeeTexte} accessibilityRole="header">{TEXTES_DE_L_ECRAN.details}</Text>
          {detailsDeFabrication({
            etat,
            plateforme: { version: Platform.Version },
            afficheur: adresses,
            empreintes: empreintes && typeof empreintes === 'object' ? empreintes : null,
          }).map((l) => <Text key={l} style={s.detail}>{l}</Text>)}
          {empreintes === 'calcul' && <Text style={s.detail}>{TEXTES_DE_L_ECRAN.calculEmpreintes}</Text>}
        </ScrollView>
      )}

      {vue === null && (
        <View style={s.place}>
          {surLeTelephone && issueDesPolices(etat.polices) === 'telephone' && (
            <Text style={s.phrase}>{PHRASE_POLICES_DU_TELEPHONE}</Text>
          )}
          {surLeTelephone && <Text style={s.avant}>{ligneAvantLeDocument(etat.pages)}</Text>}
          {surLeTelephone ? (
            <AfficheurPdf
              key={etat.uri}
              uri={etat.uri}
              onEchec={(detail) => seance.echecAffichage(detail)}
              onAdresses={setAdresses}
            />
          ) : (
            <AfficheurPdf html={etat.html} />
          )}
        </View>
      )}

      {/* UNE RANGÉE de 44 points, comme « Ce que montre cet aperçu », et non
          un grand bouton : mesuré au navigateur (`mesure-apercu`, 27/11), le
          bouton et sa marge prenaient 61 points, et le document tombait sous
          60 % de la hauteur utile à 320 × 568 (E-M2). */}
      {__DEV__ && (
        <View style={s.dev}>
          <Pressable
            onPress={ouvrirDetails}
            accessibilityRole="button"
            accessibilityState={{ expanded: vue === 'details' }}
            accessibilityLabel={vue === 'details' ? TEXTES_DE_L_ECRAN.replier : TEXTES_DE_L_ECRAN.details}
            style={({ pressed }) => [s.rangee, s.rangeeSansFilet, pressed && APPUI.discret]}
          >
            <Text style={s.rangeeTexte}>{vue === 'details' ? TEXTES_DE_L_ECRAN.replier : TEXTES_DE_L_ECRAN.details}</Text>
            <ChevronRight size={16} color={C.accent2} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  attente: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm, padding: S.lg, backgroundColor: C.surface,
  },
  etape: {
    fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant), textAlign: 'center',
  },
  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), textAlign: 'center',
  },
  /* Le fond blanc, comme l'attente et le document : sur le béton de l'écran
     des exemples, le rouge du refus ne donnait que 4,37 : 1 (5,56 sur blanc,
     relecture « écran » du 27/11). */
  fondRefus: { backgroundColor: C.surface },
  refus: { padding: S.lg, gap: S.md },
  refusTexte: { fontFamily: F.inter, fontSize: T.courant, color: C.bad, lineHeight: interligne(T.courant) },
  pret: { flex: 1, backgroundColor: C.surface },
  resume: {
    fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, paddingHorizontal: S.lg, paddingTop: S.sm,
  },
  /* UNE RANGÉE comme celles du devis : 44 points par sa BOÎTE. */
  rangee: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm, minHeight: TOUCHE,
    paddingHorizontal: S.lg, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  rangeeTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  place: { flex: 1 },
  phrases: { padding: S.lg, gap: S.sm },
  phraseListe: { fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  /* La phrase des polices, AU-DESSUS du document (§4.9). */
  phrase: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant), paddingHorizontal: S.lg,
    paddingTop: S.sm,
  },
  avant: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, paddingHorizontal: S.lg, paddingVertical: S.xs },
  detail: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  rangeeSansFilet: { borderBottomWidth: 0 },
  dev: { borderTopWidth: 1, borderTopColor: C.line },
});
