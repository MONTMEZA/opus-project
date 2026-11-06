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
 *   2. des changements partent (une écriture du devis en route, la lecture
 *      qui la suit, ou un champ de l'en-tête tapé et pas encore quitté) :
 *      la ligne dit « Des changements partent : la liste sera à jour juste
 *      après. » (annexe B.8). La carte garde « Votre entreprise » — une
 *      écriture du devis ne la change pas, elle ne clignote pas (E-6) —,
 *      mais la partie « Ce devis » de la dernière liste se tait : « Ce
 *      devis : la liste se met à jour. » se lit à sa place ; elle disait
 *      « ne chiffre encore aucun travail » sous un poste qu'on venait
 *      d'écrire (relecture de 2b-1, ECR-1). Au retour de « Mon
 *      entreprise », les DEUX parties se relisent — « Votre entreprise », et
 *      « Ce devis », dont le régime de TVA écrit là décide des points
 *      (relecture 2, REL-2) —, et la ligne dit « Mise à jour de la liste… » :
 *      rien ne prouve qu'on y a changé quoi que ce soit (relecture 4,
 *      06/11/2026). UNE PARTIE QUI SE TAIT GARDE SA PLACE (relecture 2, REL-3) :
 *      elle reste montée, invisible et cachée à VoiceOver, sous sa phrase —
 *      rien de ce qui suit ne remonte puis ne redescend sous le doigt ;
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
 * dans « Mon entreprise » : elles comptent dans « votre entreprise », et le
 * titre de la carte dit combien (« Votre entreprise — 5 points, dont 3 dus
 * à un particulier », décision D-B du propriétaire, 05/11/2026 au soir).
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
  TITRE_POUR_REMETTRE, titresDesParties, premierePhrase, actionDuPoint,
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
 * (E-6). Quand quelque chose n'est pas compté sur un devis en base, elle
 * dit la phrase ET le décompte (décision D-A du propriétaire, 05/11/2026 au
 * soir).
 *
 * TANT QUE QUELQUE CHOSE N'EST PAS COMPTÉ SUR UN DEVIS EN BASE, SA HAUTEUR
 * NE DÉPEND NI DE L'ÉTAT, NI DES NOMBRES, NI DE LA PHRASE (relecture 2 de
 * 2b-1, REL-1 ; décision D-A bis du propriétaire, le 06/11/2026 ; relecture
 * 4, RELIRE3-1) : `texteDeLaLigneRemise` rend alors la liste FIXE
 * `GABARITS_DE_LA_LIGNE` — les plus longs des textes que la ligne peut
 * prendre dans ces états —, posés dans le flux, INVISIBLES (opacité nulle,
 * aucun toucher, cachés à VoiceOver), et ce que la ligne dit vraiment est
 * posé PAR-DESSUS. La ligne fait la hauteur du PLUS GRAND, à toute largeur.
 * Avant, les gabarits suivaient les nombres de la dernière liste lue : la
 * ligne du haut passait de 92 à 110 points à 393 quand le dernier point du
 * devis était corrigé, et à la première lecture il n'y en avait aucun.
 * Sans mesure ni course. Ce qui la change encore (hors de la décision) : la
 * phrase « pas compté » qui apparaît ou disparaît, et le passage d'un
 * brouillon « pas encore en base » à « en base ».
 *
 * LA SUPERPOSITION (`s.superpose`) : une RANGÉE dont chaque couche fait
 * toute la largeur, les suivantes ramenées sous la première par une marge de
 * −100 %. Une rangée prend la hauteur de son élément le PLUS HAUT — dans
 * `react-native-web` (la boîte flexible du navigateur) comme dans Yoga
 * (iOS, Android) — et une marge en pourcentage se calcule sur la largeur du
 * parent dans les deux. Le texte lu est l'une des couches, la dernière : il
 * ne peut donc ni déborder ni chevaucher ce qui suit, même agrandi dans les
 * réglages du téléphone ; et comme il n'est jamais plus long que les
 * gabarits (`verifier-devis` le compte), il ne change pas la hauteur. Rien
 * n'est coupé (`numberOfLines` n'y est pas). Aucune
 * `accessibilityLiveRegion` : elle parlerait à chaque ligne quittée.
 *
 * En ÉCHEC (réessayable), la ligne EST le bouton « Réessayer » : elle
 * n'ouvre rien (E-19). Pas encore en base, elle n'est PAS une cible : il
 * n'y a rien à ouvrir, et une cible qui ne répond pas est pire que pas de
 * cible.
 */
export function LigneRemise({
  variante = 'haut', etat, lue, erreurReessayable = true, erreurPhrase = null, enLecture = false, pasCompte = null,
  relecture = null, onOuvrir, onReessayer,
}) {
  /* TOUT ce que la ligne dit se décide dans `texteDeLaLigneRemise`
     (devis.js), que `verifier-devis` fait tourner. */
  const dit = texteDeLaLigneRemise({
    etat, lue, enLecture, erreurReessayable, erreurPhrase, pasCompte, relecture,
  });
  const { contenu, compte, gabarits, aDire } = dit;
  let action = null;
  if (dit.action === 'ouvrir') action = onOuvrir;
  else if (dit.action === 'reessayer') action = onReessayer;
  /* Le décompte va à la ligne : il ne se colle pas à la fin d'une phrase. */
  const styleTexte = variante === 'bas' ? s.ligneTexteBas : s.ligneTexte;
  const texte = compte ? `${contenu}\n${compte}` : contenu;

  const corps = (
    <>
      <View style={s.ligneCorps}>
        <Text style={variante === 'bas' ? s.ligneTitreBas : s.ligneTitre}>{TITRE_POUR_REMETTRE}</Text>
        {gabarits ? (
          /* LES GABARITS DONNENT LA HAUTEUR — le plus grand —, le texte lu
             est posé dessus (REL-1, D-A bis, RELIRE3-1). */
          <View style={s.superpose}>
            {gabarits.map((g, i) => (
              <View
                key={`gabarit-${i}`}
                style={[s.couche, i > 0 && s.coucheSuivante, s.gabarit]}
                aria-hidden
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Text style={styleTexte}>{g}</Text>
              </View>
            ))}
            <View style={[s.couche, s.coucheSuivante]}>
              <Text style={styleTexte}>{texte}</Text>
            </View>
          </View>
        ) : <Text style={styleTexte} numberOfLines={3}>{texte}</Text>}
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
          accessibilityLabel={action.aDire || action.libelle}
          style={({ pressed }) => [s.action, pressed && APPUI.plein]}
        >
          <Text style={s.actionTexte}>{action.libelle}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ========================================================================== */
/*  UNE PARTIE DE LA LISTE — lue, ou qui se relit en gardant sa place          */
/* ========================================================================== */

/**
 * `partie` : ce que rend `ceQueDitLaCarte` pour elle — `{ montrer, phrase,
 * garder }`. Lue (`montrer`), elle se montre. Pendant qu'elle se relit
 * (`garder`), la DERNIÈRE LISTE SÛRE de cette partie reste MONTÉE dans le
 * flux, INVISIBLE (opacité nulle, aucun toucher), CACHÉE à VoiceOver et à
 * TalkBack, et sa phrase (« Ce devis : la liste se met à jour. ») est posée
 * PAR-DESSUS (relecture 2 de 2b-1, REL-3). Retirée, elle faisait remonter
 * tout ce qui la suit, puis redescendre au retour de la liste : le premier
 * bouton de « Votre entreprise » passait de y = 400 à y = 470 sous le doigt
 * (mesuré au navigateur, liste revenue identique). Jamais ESTOMPÉE : on y
 * lirait des points périmés (ECR-1).
 *
 * LA PLACE EST LA PLUS GRANDE DES DEUX (relecture 3 de 2b-1, banc de la
 * relecture 2, point 2) : la phrase est une COUCHE de la même superposition
 * que la partie gardée (`s.superpose`, la technique de la ligne). Posée en
 * position absolue, elle débordait sur ce qui suit quand elle était plus
 * haute que la partie gardée — « Votre entreprise — aucun point », un titre
 * seul, avec un texte agrandi dans les réglages du téléphone : la phrase
 * passe sur deux lignes avant le titre. La place prend maintenant la
 * hauteur de la plus haute des deux.
 *
 * LE MÊME ARBRE dans les deux cas : la partie ne se démonte pas en se
 * relisant — un point déplié par « Lire la suite » le reste. Elle est
 * toujours la PREMIÈRE couche ; la phrase, quand elle est là, la seconde.
 */
function Partie({ partie, children }) {
  const garder = !!partie.garder;
  return (
    <View style={s.superpose}>
      <View
        style={[s.partie, s.couche, garder && s.cachee]}
        aria-hidden={garder}
        accessibilityElementsHidden={garder}
        importantForAccessibility={garder ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </View>
      {garder && (
        <View style={[s.couche, s.coucheSuivante]}>
          <Text style={s.seRelit} accessibilityRole="header">{partie.phrase}</Text>
        </View>
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
  etat, lue = null, erreurPhrase = null, erreurReessayable = true, enLecture = false, pasCompte = null, relecture = null,
  avis = [], lignes = [], chiffrerPossible = false, onAgir, onReessayer, onFermer,
}) {
  const ligneExiste = (id) => !!id && lignes.some((l) => String(l.id) === String(id));
  const designationDe = (id) => {
    const l = lignes.find((x) => String(x.id) === String(id));
    return l && l.designation ? l.designation : null;
  };
  const rendrePoint = (p, i) => {
    const designation = p.endroit && p.endroit.endroit === 'ligne' ? designationDe(p.endroit.ligneId) : null;
    return (
      <Point
        key={`${p.cle || 'inconnu'}-${p.ligneId || ''}-${i}`}
        point={p}
        action={actionDuPoint(p, { chiffrerPossible, ligneExiste, designation })}
        designation={designation}
        onAgir={onAgir}
      />
    );
  };

  /* CE QUE DIT LA CARTE, et ce qu'elle montre de la liste : `ceQueDitLaCarte`
     (devis.js). La dernière liste sûre se montre en `liste` ET en
     `en_route` ; jamais sur un échec, ni avant la première lecture. Mais
     une PARTIE PÉRIMÉE ne se lit pas (ECR-1) : « Ce devis » pendant
     qu'une écriture du devis part puis se relit, les DEUX parties pendant la
     relecture qui suit « Mon entreprise » (le régime de TVA s'y écrit, REL-2)
     — une phrase la remplace, posée sur sa place gardée (REL-3). */
  const { phrases, montrerLaListe: montrer, parties: aMontrer } = ceQueDitLaCarte({
    etat, lue, enLecture, pasCompte, relecture,
  });
  const parties = montrer ? lue.parties : null;
  const titres = montrer ? titresDesParties(lue) : null;

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
            {/* 1. CE DEVIS — ou, s'il se relit, la phrase qui le dit : ni
                ses points, ni leurs boutons, ni « rien ne manque » ne se
                lisent (ECR-1), mais la partie GARDE SA PLACE, invisible
                (REL-3 : `Partie`). */}
            <Partie partie={aMontrer.devis}>
              <Text style={s.titre} accessibilityRole="header">{titres.devis}</Text>
              {parties.devis.length === 0 ? (
                <View style={s.rien}>
                  <Text style={s.rienTexte}>{RIEN_NE_MANQUE_POUR_CE_DEVIS}</Text>
                  {/* Sans cette phrase, « rien ne manque » mentirait (D2). */}
                  <Text style={s.aide}>{PAS_ENCORE_VERIFIE}</Text>
                </View>
              ) : parties.devis.map(rendrePoint)}
            </Partie>

            {/* 2. VOTRE ENTREPRISE — un bouton PAR point, qui ouvre « Mon
                entreprise » sur sa section ; son titre dit combien sont dus
                à un particulier (D-B). Ou, si elle se relit, la phrase, sur
                sa place gardée. */}
            <Partie partie={aMontrer.entreprise}>
              <Text style={s.titre} accessibilityRole="header">{titres.entreprise}</Text>
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
            </Partie>
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
  /* LES GABARITS DE LA LIGNE (REL-1, D-A bis) : dans le flux, le plus grand
     donne la hauteur ; on ne les voit pas, on ne les touche pas, VoiceOver
     ne les lit pas. */
  gabarit: { opacity: 0, pointerEvents: 'none' },
  /* LA SUPERPOSITION (la ligne et les parties de la carte) : une RANGÉE
     prend la hauteur de son élément le plus haut ; chaque couche fait toute
     la largeur, et les suivantes reviennent sous la première par une marge
     de −100 % (calculée sur la largeur du parent, dans le navigateur comme
     dans Yoga). Le texte lu, ou la phrase d'une partie qui se relit, est une
     couche : il ne déborde jamais sur ce qui suit, il agrandit la place.
     Elle suppose un parent de LARGEUR IMPOSÉE (une colonne étirée, comme la
     saisie et la carte) : dans un parent qui se dimensionne sur son contenu,
     des pourcentages ne veulent plus rien dire (constaté au banc du texte
     agrandi : un bouton de `react-native-web` se rétrécit sur son texte). */
  superpose: { flexDirection: 'row', alignItems: 'flex-start' },
  couche: { width: '100%' },
  coucheSuivante: { marginLeft: '-100%' },

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
  /* UNE PARTIE : ses enfants espacés comme ceux du contenu (`gap`), qu'ils
     soient lus ou gardés invisibles. */
  partie: { gap: S.sm },
  /* …GARDÉE pendant qu'elle se relit (REL-3) : on ne la voit pas, on ne la
     touche pas. VoiceOver ne la lit pas (`aria-hidden`, posé avec elle). */
  cachee: { opacity: 0, pointerEvents: 'none' },
  /* UNE PARTIE QUI SE RELIT : sa phrase à la place de son titre, à la même
     hauteur (la même marge du haut), en couche sur la partie gardée. */
  seRelit: {
    fontFamily: F.inter6, fontSize: T.courant, color: C.muted, lineHeight: interligne(T.courant), marginTop: S.lg,
  },
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
