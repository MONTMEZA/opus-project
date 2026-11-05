/**
 * « CE QU'IL MANQUE POUR REMETTRE CE DEVIS » — la liste, dite par la BASE
 * (lot 2b-1 du module devis, 05/11/2026).
 *
 * Deux choses vivent ici, et rien d'autre :
 *   - `LigneRemise` : la ligne qui RÉSUME, posée deux fois — sous le bandeau
 *     du haut (visible à l'ouverture : la rangée « Conditions » est à
 *     y = 961 sur un devis neuf, critique E-3) et en bas, sous
 *     « Conditions » (réponse 4 du propriétaire, le 05/11 : « en haut et en
 *     bas ») ;
 *   - `PourRemettre` : la CARTE plein écran qu'elle ouvre, sur le modèle de
 *     `PretAEmettre` (« un motif = une cible qui ouvre sa section ») et de
 *     la carte « Conditions » (une vue posée au-dessus de la liste, jamais
 *     une `Modal` : la saisie tient UN état de carte).
 *
 * LA BASE EST L'AUTORITÉ. Les phrases sont celles que `motifs_refus_remise()`
 * rend, lues par `lireMotifsDeRemise()` (devis.js) : l'écran ne recompose
 * rien, et une clé qu'il ne connaît pas s'affiche quand même.
 *
 * LES ÉTATS, dans l'ordre du cahier (§3.1) — décidés par `etatDeLaListe`
 * (devis.js), jamais par une condition écrite dans un rendu :
 *   1. le brouillon n'est pas encore en base : AUCUN appel, et une phrase
 *      (la fonction rendrait OP027 pour un devis qu'elle ne trouve pas) ;
 *   2. des changements partent (une écriture en route, ou un champ de
 *      l'en-tête tapé et pas encore quitté) : la DERNIÈRE liste sûre reste
 *      affichée dans la carte — elle ne clignote pas (E-6) —, et la ligne
 *      comme la carte disent « Des changements partent : la liste sera à
 *      jour juste après. » (annexe B.8) ;
 *   3. la lecture a échoué : « Liste non lue — Réessayer », JAMAIS « rien ne
 *      manque ». Un travail qui n'a pas pu se faire ne ressemble pas à un
 *      travail fait (la règle de « Pour moi », 05/10) ;
 *   4. la liste.
 * Ce qui N'EST PAS ENREGISTRÉ (une ligne refusée, rien ne part) n'est pas un
 * état : la ligne et la carte le DISENT, avec le compte du pied
 * (`ceQueLaListeNeComptePas`) — sinon « ce devis ne chiffre aucun travail »
 * mentirait sous une ligne visible.
 *
 * LE COMPTE SE DIT PAR ENDROIT (critique E-4) : « ce devis — 2 points ·
 * votre entreprise — 1 point ». Chez le propriétaire, la ligne « votre
 * entreprise » restera allumée tant que son n° de TVA est refusé par VIES :
 * un compteur unique ne s'éteindrait jamais, et un voyant qui ne s'éteint
 * jamais cesse d'être lu. Les mentions dues à un particulier se corrigent
 * dans « Mon entreprise » : elles comptent dans « votre entreprise ».
 *
 * LES AVIS NE COMPTENT JAMAIS : ils s'affichent à part, sous la liste.
 *
 * RIEN N'EST IMBRIQUÉ : un point n'est pas un bouton — sa phrase est un
 * texte, et ses deux cibles (« Lire la suite », l'action) sont des SŒURS.
 * Pour VoiceOver, une cible qui en contient une autre ne s'annonce pas.
 *
 * CE QUE L'ÉCRAN DÉCIDE VIT DANS `devis.js` (`etatDeLaListe`,
 * `texteDeLaLigneRemise`, `ceQueDitLaCarte`, `ceQueLaListeNeComptePas`,
 * `premierePhrase`, `actionDuPoint`…) : ce fichier charge React Native, et
 * `node` ne pourrait pas les faire tourner. `verifier-devis` les IMPORTE
 * (vérification de construction du lot 2b-1, écart 9 — la leçon de
 * `cloudinary-adresses.js`). Ici, il ne reste que le dessin.
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne,
} from '../theme';
import { ChevronRight } from './icons';
import {
  PAS_ENCORE_VERIFIE, RIEN_NE_MANQUE_POUR_CE_DEVIS, LISTE_NON_LUE, MENTIONS_PARTICULIER_PAR_PRUDENCE,
  TITRE_POUR_REMETTRE, points, comptesParEndroit, premierePhrase, actionDuPoint,
  texteDeLaLigneRemise, ceQueDitLaCarte,
} from '../lib/devis';

/* ========================================================================== */
/*  LA LIGNE QUI RÉSUME — en haut et en bas                                   */
/* ========================================================================== */

/**
 * `variante` : `'haut'` (sous le bandeau, une carte de structure au filet
 * orange de lecture) ou `'bas'` (sous « Conditions », la forme de sa
 * rangée). Son texte tient sur DEUX lignes RÉSERVÉES : qu'une écriture
 * passe, et la ligne ne grandit pas — la liste ne saute pas sous le doigt
 * (E-6). Aucune `accessibilityLiveRegion` : elle parlerait à chaque ligne
 * quittée.
 *
 * En ÉCHEC (réessayable), la ligne EST le bouton « Réessayer » : elle
 * n'ouvre rien (E-19). Pas encore en base, elle n'est PAS une cible : il
 * n'y a rien à ouvrir, et une cible qui ne répond pas est pire que pas de
 * cible.
 */
export function LigneRemise({
  variante = 'haut', etat, lue, erreurReessayable = true, erreurPhrase = null, enLecture = false, pasCompte = null,
  onOuvrir, onReessayer,
}) {
  /* TOUT ce que la ligne dit se décide dans `texteDeLaLigneRemise`
     (devis.js), que `verifier-devis` fait tourner. */
  const dit = texteDeLaLigneRemise({
    etat, lue, enLecture, erreurReessayable, erreurPhrase, pasCompte,
  });
  const { contenu, aDire } = dit;
  let action = null;
  if (dit.action === 'ouvrir') action = onOuvrir;
  else if (dit.action === 'reessayer') action = onReessayer;

  const corps = (
    <>
      <View style={s.ligneCorps}>
        <Text style={variante === 'bas' ? s.ligneTitreBas : s.ligneTitre}>{TITRE_POUR_REMETTRE}</Text>
        <Text style={variante === 'bas' ? s.ligneTexteBas : s.ligneTexte} numberOfLines={3}>{contenu}</Text>
      </View>
      {!!action && <ChevronRight size={16} color={C.accent2} />}
    </>
  );
  const style = variante === 'bas' ? s.ligneBas : s.ligneHaut;
  if (!action) {
    return <View style={style} accessible accessibilityLabel={aDire}>{corps}</View>;
  }
  return (
    <Pressable
      onPress={action}
      accessibilityRole="button"
      accessibilityLabel={aDire}
      style={({ pressed }) => [style, pressed && APPUI.discret]}
    >
      {corps}
    </Pressable>
  );
}

/* ========================================================================== */
/*  UN POINT DE LA LISTE                                                      */
/* ========================================================================== */

function Point({
  point, action, designation = null, onAgir,
}) {
  const [ouvert, setOuvert] = useState(false);
  const { debut, suite } = premierePhrase(point.phrase);
  return (
    <View style={s.point}>
      {!!point.etiquette && <Text style={s.nature}>{point.etiquette}</Text>}
      <Text style={s.phrase}>{ouvert || !suite ? point.phrase : debut}</Text>
      {!!designation && <Text style={s.designation} numberOfLines={2}>{`« ${designation} »`}</Text>}
      {suite && (
        <Pressable
          onPress={() => setOuvert((o) => !o)}
          accessibilityRole="button"
          accessibilityLabel={ouvert ? 'Réduire ce point' : 'Lire la suite de ce point'}
          accessibilityState={{ expanded: ouvert }}
          style={({ pressed }) => [s.suite, pressed && APPUI.discret]}
        >
          <Text style={s.suiteTexte}>{ouvert ? 'Réduire' : 'Lire la suite'}</Text>
        </Pressable>
      )}
      {!!action && (
        <Pressable
          onPress={() => onAgir(point)}
          accessibilityRole="button"
          accessibilityLabel={action.libelle}
          style={({ pressed }) => [s.action, pressed && APPUI.plein]}
        >
          <Text style={s.actionTexte}>{action.libelle}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ========================================================================== */
/*  LA CARTE                                                                  */
/* ========================================================================== */

/**
 * `etat` : celui d'`etatDeLaListe`. `lue` : la dernière liste sûre
 * (`lireMotifsDeRemise`). `erreurPhrase` / `erreurReessayable` : l'échec de
 * la dernière lecture. `pasCompte` : ce que la liste ne compte pas
 * (`ceQueLaListeNeComptePas`), ou `null`. `avis` : ce
 * que rend `avisDuDevis` — jamais comptés. `lignes` : les lignes de
 * l'écran, pour nommer une ligne fautive. `onAgir(point)` : la saisie mène
 * où il faut.
 */
export default function PourRemettre({
  etat, lue = null, erreurPhrase = null, erreurReessayable = true, enLecture = false, pasCompte = null, avis = [],
  lignes = [], chiffrerPossible = false, onAgir, onReessayer, onFermer,
}) {
  const ligneExiste = (id) => !!id && lignes.some((l) => String(l.id) === String(id));
  const designationDe = (id) => {
    const l = lignes.find((x) => String(x.id) === String(id));
    return l && l.designation ? l.designation : null;
  };
  const rendrePoint = (p, i) => (
    <Point
      key={`${p.cle || 'inconnu'}-${p.ligneId || ''}-${i}`}
      point={p}
      action={actionDuPoint(p, { chiffrerPossible, ligneExiste })}
      designation={p.endroit && p.endroit.endroit === 'ligne' ? designationDe(p.endroit.ligneId) : null}
      onAgir={onAgir}
    />
  );

  /* CE QUE DIT LA CARTE, et si elle montre la liste : `ceQueDitLaCarte`
     (devis.js). La dernière liste sûre se montre en `liste` ET en
     `en_route` (elle ne clignote pas pendant un envoi) ; jamais sur un
     échec, ni avant la première lecture. */
  const { phrases, montrerLaListe: montrer } = ceQueDitLaCarte({
    etat, lue, enLecture, pasCompte,
  });
  const parties = montrer ? lue.parties : null;
  const comptes = montrer ? comptesParEndroit(lue) : null;

  return (
    /* MODALE pour VoiceOver, comme la carte d'une ligne et « Conditions » :
       sous elle, la liste, le pied et les bandes sont cachés. */
    <View style={s.ecran} accessibilityViewIsModal>
      <View style={s.barre}>
        <Pressable
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel="Revenir au devis"
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <Text style={s.retourTexte}>‹ Devis</Text>
        </Pressable>
        <View style={s.milieu}>
          <Text style={s.barreTitre} numberOfLines={1}>{TITRE_POUR_REMETTRE}</Text>
        </View>
        <View style={s.place} />
      </View>

      <ScrollView contentContainerStyle={s.contenu}>
        <Text style={s.grandTitre} accessibilityRole="header">Ce qu’il manque pour remettre ce devis</Text>

        {/* LES PHRASES D'ÉTAT, dans l'ordre que décide `ceQueDitLaCarte` :
            « pas encore en base », « lecture », « des changements
            partent », « mise à jour », et ce que la liste ne compte pas. */}
        {etat === 'lecture' && <ActivityIndicator color={C.accent2} />}
        {phrases.map((p) => (
          <Text key={p.texte} style={p.ton === 'aide' ? s.aide : s.etatTexte}>{p.texte}</Text>
        ))}

        {/* L'ÉCHEC : jamais « rien ne manque ». Un refus définitif (OP027 :
            ce devis n'existe plus, ou n'est pas le vôtre) ne propose pas
            « Réessayer » : la même demande recevrait la même réponse. */}
        {etat === 'echec' && (
          <View style={s.echec}>
            {erreurReessayable ? (
              <Pressable
                onPress={onReessayer}
                accessibilityRole="button"
                accessibilityLabel="Liste non lue. Réessayer"
                style={({ pressed }) => [s.action, s.actionEchec, pressed && APPUI.plein]}
              >
                <Text style={[s.actionTexte, s.actionTexteEchec]}>{LISTE_NON_LUE}</Text>
              </Pressable>
            ) : null}
            {!!erreurPhrase && <Text style={s.erreur}>{erreurPhrase}</Text>}
          </View>
        )}

        {!!parties && (
          <>
            {/* 1. CE DEVIS */}
            <Text style={s.titre} accessibilityRole="header">{`Ce devis — ${points(comptes.devis)}`}</Text>
            {parties.devis.length === 0 ? (
              <View style={s.rien}>
                <Text style={s.rienTexte}>{RIEN_NE_MANQUE_POUR_CE_DEVIS}</Text>
                {/* Sans cette phrase, « rien ne manque » mentirait (D2). */}
                <Text style={s.aide}>{PAS_ENCORE_VERIFIE}</Text>
              </View>
            ) : parties.devis.map(rendrePoint)}

            {/* 2. VOTRE ENTREPRISE — un bouton PAR point, qui ouvre « Mon
                entreprise » sur sa section. */}
            <Text style={s.titre} accessibilityRole="header">{`Votre entreprise — ${points(comptes.entreprise)}`}</Text>
            {parties.entreprise.map(rendrePoint)}

            {/* 3. LES MENTIONS DUES À UN PARTICULIER — par prudence, tant
                qu'Opus ne sait pas pour qui le client commande. */}
            {parties.particulier.length > 0 && (
              <>
                <Text style={s.sousTitre} accessibilityRole="header">Mentions dues à un particulier</Text>
                <Text style={s.aide}>{MENTIONS_PARTICULIER_PAR_PRUDENCE}</Text>
                {parties.particulier.map(rendrePoint)}
              </>
            )}
          </>
        )}

        {/* LES AVIS NE BLOQUENT RIEN, et ne comptent jamais : à part, à
            l'encre discrète. */}
        {etat !== 'pas_en_base' && avis.length > 0 && (
          <View style={s.avis}>
            <Text style={s.sousTitre} accessibilityRole="header">À vérifier</Text>
            {avis.map((a) => <Text key={a.cle} style={s.avisTexte}>{a.phrase}</Text>)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  /* LA LIGNE DU HAUT : de la STRUCTURE (angle vif), sous le bandeau. Son
     filet est un élément graphique : l'orange de LECTURE (4,52 : 1 sur le
     fond), jamais l'orange de signature (2,76) — la règle du lot 5. */
  ligneHaut: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE,
    paddingHorizontal: S.md, paddingVertical: S.sm, marginBottom: S.md,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderLeftWidth: 3, borderLeftColor: C.accentTexte,
  },
  /* LA RANGÉE DU BAS : la forme de la rangée « Conditions », juste au-dessus. */
  ligneBas: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE, paddingVertical: S.sm,
  },
  ligneCorps: { flex: 1, minWidth: 0, gap: S.xs },
  ligneTitre: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accentTexte },
  ligneTitreBas: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  /* DEUX LIGNES RÉSERVÉES : la hauteur ne bouge pas d'un état à l'autre. */
  ligneTexte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
    minHeight: 2 * interligne(T.courant),
  },
  ligneTexteBas: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
    minHeight: 2 * interligne(T.petit),
  },

  /* LA CARTE prend l'écran, comme « Conditions ». */
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
  titre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, marginTop: S.lg },
  sousTitre: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2, marginTop: S.md },
  etatTexte: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  echec: { gap: S.sm },
  erreur: { fontFamily: F.inter, fontSize: T.courant, color: C.bad, lineHeight: interligne(T.courant) },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  rien: { gap: S.xs },
  rienTexte: { fontFamily: F.inter6, fontSize: T.courant, color: C.okTexte, lineHeight: interligne(T.courant) },

  /* UN POINT : de la structure (angle vif), un filet en tête. Il n'est PAS
     une cible : ses cibles sont dedans, sœurs l'une de l'autre. */
  point: { gap: S.xs, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.line },
  nature: { fontFamily: F.inter6, fontSize: T.petit, color: C.accent2 },
  phrase: { fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  designation: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  /* « Lire la suite » : 44 points par sa boîte, un mot qu'on vise au pouce. */
  suite: { minHeight: TOUCHE, justifyContent: 'center', alignSelf: 'flex-start' },
  suiteTexte: { fontFamily: F.inter6, fontSize: T.petit, color: C.accent2, textDecorationLine: 'underline' },
  /* L'ACTION : un bouton qui flotte — arrondi, 44 points par sa boîte. */
  action: {
    minHeight: TOUCHE, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.accent2, borderRadius: R.gelule,
  },
  actionTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2 },
  actionEchec: { borderColor: C.bad },
  actionTexteEchec: { color: C.bad },

  avis: { gap: S.xs, marginTop: S.lg, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.line },
  avisTexte: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
});
