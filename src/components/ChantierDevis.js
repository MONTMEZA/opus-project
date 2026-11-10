/**
 * « LE CHANTIER » — la carte des deux questions sur le neuf (lot 2b-2 du
 * module devis, cahier §3.5, annexe A.4).
 *
 * DEUX QUESTIONS INDÉPENDANTES, parce que leurs « Oui » vont en sens
 * inverse (cahier §1.2, C) :
 *   1. « Pour les droits de votre client » — le « Oui » RETIRE des
 *      protections (C. consom. L. 221-2 12°) : il se CONFIRME, par une
 *      feuille posée par-dessus cette carte (l'état `feuille` de la saisie,
 *      `{ type: 'chantier_neuf' }`), et la base garde la date. Revenir à
 *      « Non » se fait d'un appui, sans confirmation ;
 *   2. « Pour la TVA » — le « Oui » AJOUTE une garde : une ligne à 10 % ou
 *      5,5 % empêchera de remettre le devis (`devis_taux_reduit_neuf`).
 *      « Non (par défaut) » tant que rien n'est répondu.
 *
 * UNE CARTE PLEIN ÉCRAN, une valeur de plus de l'état UNIQUE `carte` de la
 * saisie (`CARTE_CHANTIER`), ouverte par la rangée « Le chantier » posée
 * juste avant « Conditions » — jamais au-dessus des lignes : les questions
 * et leurs aides font de l'ordre de 440 points (critique écran E-I7).
 * Ouverte depuis la liste « Pour le remettre » (« Revoir « Le chantier » »),
 * elle y RAMÈNE.
 *
 * CE QUI EST MONTRÉ VIENT DE `questionsDuChantier` (devis.js) : la première
 * question se tait pour une réponse « pour son entreprise » (sans objet), la
 * seconde n'existe qu'au régime réel LU — ou quand sa valeur est vraie : on
 * ne renvoie jamais vers une question invisible.
 *
 * Chaque pastille ÉCRIT par la file de l'en-tête (`onRepondre`), et
 * l'écriture se DIT : « enregistrement… », « pas enregistré », calculés à
 * chaque événement de la file, jamais mémorisés (cahier §3.8). La date du
 * « Oui » est celle de la BASE.
 */
import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import { Pastille } from './ui';
import {
  LE_CHANTIER, questionsDuChantier, libelleOuiDuChantier, pastillesDeLaQuestionTva, suffixeDEtat,
} from '../lib/devis';

/* L'état de l'écriture d'UNE réponse, dit sous ses pastilles : « en
   route » d'abord, puis « pas enregistré » (les suffixes de `devis.js`,
   sans leur tiret). Rien quand la base a la réponse. */
function etatDeLaReponse(e) {
  const suffixe = suffixeDEtat({ enRoute: !!(e && e.enRoute), enEchec: !!(e && e.enEchec) });
  if (!suffixe) return null;
  const t = suffixe.replace(/^\s*—\s*/, '');
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}`;
}

export default function ChantierDevis({
  devis, regime = null, confirmeLe = null, etats = null, onRepondre, onDemanderConfirmation, onFermer,
  depuisLaListe = false,
}) {
  const d = devis || {};
  const { q1, q2 } = questionsDuChantier({ devis: d, regime });
  /* L'état de chaque réponse, calculé par la saisie depuis la file à chaque
     événement (jamais mémorisé) : `{ q1: { enRoute, enEchec }, q2: … }`. */
  const e1 = (etats && etats.q1) || {};
  const e2 = (etats && etats.q2) || {};
  const oui1 = d.chantierNeufConso === true;
  const oui2 = d.chantierNeufTva === true;
  const [nonTva, ouiTva] = pastillesDeLaQuestionTva(d.chantierNeufTva);
  /* Le « Oui » de la première question porte son état et sa date
     (`libelleOuiDuChantier`) ; son « Non », un état à part. */
  const ouiDit = libelleOuiDuChantier({ confirmeLe, enRoute: !!e1.enRoute, enEchec: !!e1.enEchec });
  const etat1 = oui1 ? null : etatDeLaReponse(e1);
  const etat2 = etatDeLaReponse(e2);

  return (
    /* MODALE pour VoiceOver, comme les autres cartes : sous elle, la liste,
       le pied et les bandes sont cachés. */
    <View style={s.ecran} accessibilityViewIsModal>
      <View style={s.barre}>
        <Pressable
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel={depuisLaListe ? 'Revenir à la liste de ce qu’il manque' : 'Revenir au devis'}
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <Text style={s.retourTexte}>{depuisLaListe ? '‹ Liste' : '‹ Devis'}</Text>
        </Pressable>
        <View style={s.milieu}>
          <Text style={s.barreTitre} numberOfLines={1}>{LE_CHANTIER.titre}</Text>
        </View>
        <View style={s.place} />
      </View>

      <ScrollView contentContainerStyle={s.contenu} keyboardShouldPersistTaps="handled">
        <Text style={s.grandTitre} accessibilityRole="header">{LE_CHANTIER.titre}</Text>
        <Text style={s.aide}>{LE_CHANTIER.introduction}</Text>

        {q1 && (
          <View style={s.question}>
            <Text style={s.sousTitre} accessibilityRole="header">{LE_CHANTIER.q1.sousTitre}</Text>
            <Text style={s.enonce}>{LE_CHANTIER.q1.question}</Text>
            <View style={s.pastilles}>
              {/* « Non » : un appui, sans confirmation — la base efface la date. */}
              <Pastille
                label={LE_CHANTIER.q1.non}
                choisie={!oui1}
                onPress={() => { if (d.chantierNeufConso !== false) onRepondre({ chantierNeufConso: false }); }}
              />
              {/* « Oui » ne s'écrit qu'après « Je confirme », dans la feuille. */}
              <Pastille
                label={oui1 ? ouiDit : LE_CHANTIER.q1.oui}
                nom={oui1 ? ouiDit : `${LE_CHANTIER.q1.oui} : à confirmer`}
                choisie={oui1}
                onPress={() => { if (!oui1) onDemanderConfirmation(); }}
              />
            </View>
            {!!etat1 && <Text style={s.etat} accessibilityLiveRegion="polite">{etat1}</Text>}
            <Text style={s.aide}>{LE_CHANTIER.q1.aide}</Text>
          </View>
        )}

        {q2 && (
          <View style={s.question}>
            <Text style={s.sousTitre} accessibilityRole="header">{LE_CHANTIER.q2.sousTitre}</Text>
            <Text style={s.enonce}>{LE_CHANTIER.q2.question}</Text>
            <View style={s.pastilles}>
              <Pastille
                label={nonTva}
                choisie={!oui2}
                onPress={() => { if (d.chantierNeufTva !== false) onRepondre({ chantierNeufTva: false }); }}
              />
              <Pastille
                label={ouiTva}
                choisie={oui2}
                onPress={() => { if (!oui2) onRepondre({ chantierNeufTva: true }); }}
              />
            </View>
            {!!etat2 && <Text style={s.etat} accessibilityLiveRegion="polite">{etat2}</Text>}
            <Text style={s.aide}>{LE_CHANTIER.q2.aide}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  /* LA CARTE prend l'écran, comme « Conditions » et « Pour le remettre ». */
  ecran: { ...StyleSheet.absoluteFillObject, backgroundColor: C.surface, zIndex: 20 },
  barre: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.sm, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  retour: { minHeight: TOUCHE, minWidth: TOUCHE, justifyContent: 'center', paddingHorizontal: S.sm },
  retourTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  milieu: { flex: 1, minWidth: 0, alignItems: 'center' },
  barreTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  place: { minWidth: TOUCHE },
  contenu: { padding: S.lg, paddingBottom: S.xxl * 3, gap: S.sm },
  grandTitre: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink, lineHeight: interligne(T.sousTitre) },
  /* UNE QUESTION : de la structure (angle vif), un filet en tête. */
  question: { gap: S.sm, paddingTop: S.md, marginTop: S.sm, borderTopWidth: 1, borderTopColor: C.line },
  sousTitre: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2 },
  enonce: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  etat: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
});
