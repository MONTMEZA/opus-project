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
 * QUATRE ÉTATS, dans l'ordre du cahier (§3.1) — décidés par `etatDeLaListe`,
 * plus bas, jamais par une condition écrite dans un rendu :
 *   1. le brouillon n'est pas encore en base : AUCUN appel, et une phrase
 *      (la fonction rendrait OP027 pour un devis qu'elle ne trouve pas) ;
 *   2. des changements partent, ou ne sont pas enregistrés : la DERNIÈRE
 *      liste sûre reste affichée — elle ne clignote pas (E-6) —, avec la
 *      phrase qui le dit ;
 *   3. la lecture a échoué : « Liste non lue — Réessayer », JAMAIS « rien ne
 *      manque ». Un travail qui n'a pas pu se faire ne ressemble pas à un
 *      travail fait (la règle de « Pour moi », 05/10) ;
 *   4. la liste.
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
 * NOTE POUR LA SUITE : les fonctions pures de ce fichier (`etatDeLaListe`,
 * `phraseDesEndroits`, `premierePhrase`, `actionDuPoint`) n'importent rien
 * de React Native, mais elles vivent dans un fichier qui en importe :
 * `node` ne peut pas les faire tourner. Leur place est `devis.js` (la leçon
 * de `cloudinary-adresses.js`) — à déménager par celui qui tient ce fichier.
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
  PAS_ENCORE_VERIFIE, RIEN_NE_MANQUE_POUR_CE_DEVIS, LISTE_AVANT_LA_PREMIERE_LIGNE, LISTE_EN_ROUTE,
  LISTE_NON_LUE, MENTIONS_PARTICULIER_PAR_PRUDENCE,
} from '../lib/devis';

/** La valeur de l'état `carte` de la saisie quand cette carte est ouverte —
 *  jamais `'remise'`, qui désigne déjà la RÉDUCTION dans le code (E-18). */
export const CARTE_POUR_REMETTRE = 'pour_remettre';

/** Le titre de la ligne et de la carte. */
export const TITRE_POUR_REMETTRE = 'Pour le remettre';

/* Ce qui n'est pas parti et ne partira pas tout seul — une ligne refusée,
   une ligne incomplète, un champ de l'en-tête refusé. « Des changements
   partent » serait FAUX : rien ne part. La liste, elle, ne les compte pas
   (la base ne les a pas). */
export const LISTE_SANS_CE_QUI_NEST_PAS_ENREGISTRE = 'Ce qui n’est pas enregistré n’est pas compté dans cette liste.';

/* La première lecture, pas encore revenue. */
export const LISTE_EN_LECTURE = 'Lecture de la liste…';

/* La ligne, pendant une écriture, à la suite du compte : une MENTION, qui
   ne change pas la hauteur de la ligne (E-6). */
const MISE_A_JOUR = ' · mise à jour…';

/* Une lecture repart (après une écriture, au retour de « Mon entreprise ») :
   la liste affichée reste, et ceci le dit, sans changer de place. */
export const LISTE_MISE_A_JOUR = 'Mise à jour de la liste…';

/**
 * L'ÉTAT DE LA LISTE — l'ordre du cahier (§3.1), et rien d'autre ne décide.
 *   `enBase`     : le brouillon existe en base (`file.devisEnBase()`) ;
 *   `enRoute`    : une écriture est en vol ;
 *   `nonParties` : des lignes ou des champs ne sont pas enregistrés, et
 *                  rien ne part ;
 *   `erreur`     : la DERNIÈRE lecture a échoué ;
 *   `lue`        : la dernière liste sûre (ce que `lireMotifsDeRemise` rend), ou `null`.
 * Rend `'pas_en_base' | 'en_route' | 'echec' | 'lecture' | 'liste'`.
 *
 * UN ÉCHEC PASSE DEVANT CE QUI N'EST PAS ENREGISTRÉ quand rien ne part : une
 * ligne refusée ne relira jamais la liste toute seule, et « Liste non lue —
 * Réessayer » disparaîtrait sous une phrase qui attend. Une écriture EN VOL,
 * elle, passe devant tout : sa confirmation relira la liste.
 */
export function etatDeLaListe({
  enBase = false, enRoute = false, nonParties = false, erreur = null, lue = null,
} = {}) {
  if (!enBase) return 'pas_en_base';
  if (enRoute) return 'en_route';
  if (erreur) return 'echec';
  if (nonParties) return 'en_route';
  if (!lue) return 'lecture';
  return 'liste';
}

/** « aucun point », « 1 point », « 3 points ». */
const points = (n) => {
  if (!n) return 'aucun point';
  return n > 1 ? `${n} points` : '1 point';
};

/** Le compte PAR ENDROIT : le devis, et l'entreprise (ses mentions dues à
 *  un particulier comprises — elles se corrigent au même endroit). */
export function comptesParEndroit(lue) {
  const c = (lue && lue.comptes) || {};
  return { devis: c.devis || 0, entreprise: (c.entreprise || 0) + (c.particulier || 0) };
}

/** « ce devis — 2 points · votre entreprise — 1 point ». */
export function phraseDesEndroits(lue) {
  const c = comptesParEndroit(lue);
  return `ce devis — ${points(c.devis)} · votre entreprise — ${points(c.entreprise)}`;
}

/**
 * LA PREMIÈRE PHRASE d'un texte long, et s'il en reste : `{ debut, suite }`.
 * Une phrase finit sur « . », « ! » ou « ? » suivi d'un blanc et d'une
 * MAJUSCULE (ou d'un guillemet ouvrant) — jamais sur « L. 111-1 » ni
 * « R. 123-237 » (un chiffre suit), ni sur une initiale seule. Un texte
 * court se montre en entier : on ne coupe pas une phrase de 150 caractères
 * pour économiser deux lignes.
 */
export const SEUIL_LIRE_LA_SUITE = 200;
export function premierePhrase(texte) {
  const t = texte == null ? '' : String(texte);
  if (t.length <= SEUIL_LIRE_LA_SUITE) return { debut: t, suite: false };
  const re = /[.!?](?=\s+[«A-ZÀ-ÖØ-Þ])/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    const avant = t.slice(Math.max(0, m.index - 2), m.index);
    /* Une initiale seule (« M. », « L. ») n'est pas une fin de phrase. */
    if (/(^|\s)[A-ZÀ-ÖØ-Þ]$/.test(avant)) continue;
    const debut = t.slice(0, m.index + 1);
    if (t.slice(m.index + 1).trim()) return { debut, suite: true };
    break;
  }
  return { debut: t, suite: false };
}

/**
 * L'ACTION D'UN POINT — son libellé, ou `null` quand l'écran ne sait mener
 * nulle part (une clé inconnue, la profession réglementée, ou un poste à
 * ajouter alors que le régime de TVA ne permet pas encore de chiffrer).
 * `ligneExiste` : la ligne fautive est-elle à l'écran ? Sinon, aucune
 * cible : ouvrir une carte sur une ligne absente montrerait un écran vide.
 */
export function actionDuPoint(point, { chiffrerPossible = false, ligneExiste = () => false } = {}) {
  const e = point && point.endroit;
  if (!e) return null;
  switch (e.endroit) {
    case 'client': return { libelle: 'Choisir le client' };
    case 'lignes': return chiffrerPossible ? { libelle: 'Ajouter un poste' } : null;
    case 'ligne': return ligneExiste(e.ligneId) ? { libelle: 'Ouvrir cette ligne' } : null;
    case 'lieu': return { libelle: 'Écrire le lieu' };
    case 'delai': return { libelle: 'Écrire le délai' };
    case 'conditions':
      if (e.champ === 'validite') return { libelle: 'Choisir la validité' };
      if (e.champ === 'nature') return { libelle: 'Choisir : acompte ou arrhes' };
      return { libelle: 'Corriger dans les conditions' };
    case 'entreprise':
      return e.section ? { libelle: 'Compléter dans « Mon entreprise »' } : null;
    default: return null;
  }
}

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
  variante = 'haut', etat, lue, erreurReessayable = true, erreurPhrase = null, enRoute = false, enLecture = false,
  onOuvrir, onReessayer,
}) {
  let contenu;
  let action = onOuvrir;
  let aDire;
  if (etat === 'pas_en_base') {
    contenu = LISTE_AVANT_LA_PREMIERE_LIGNE;
    action = null;
  } else if (etat === 'echec') {
    if (erreurReessayable) {
      contenu = LISTE_NON_LUE;
      action = onReessayer;
      aDire = 'Liste de ce qu’il manque non lue. Réessayer';
    } else {
      contenu = erreurPhrase || LISTE_NON_LUE;
    }
  } else if (etat === 'lecture') {
    contenu = LISTE_EN_LECTURE;
  } else if (etat === 'en_route' && !lue) {
    contenu = enRoute ? LISTE_EN_ROUTE : LISTE_EN_LECTURE;
  } else {
    contenu = `${phraseDesEndroits(lue)}${enRoute || enLecture ? MISE_A_JOUR : ''}`;
  }
  /* Une phrase qui finit déjà par un point, ou par « … », n'en reçoit pas
     un second. */
  if (!aDire) {
    const fin = /[.…]$/.test(contenu) ? ' ' : '. ';
    aDire = `${TITRE_POUR_REMETTRE} : ${action ? `${contenu}${fin}Ouvrir la liste` : contenu}`;
  }

  const corps = (
    <>
      <View style={s.ligneCorps}>
        <Text style={variante === 'bas' ? s.ligneTitreBas : s.ligneTitre}>{TITRE_POUR_REMETTRE}</Text>
        <Text style={variante === 'bas' ? s.ligneTexteBas : s.ligneTexte} numberOfLines={2}>{contenu}</Text>
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
 * la dernière lecture. `enRoute` : une écriture est en vol (sinon, en état
 * `en_route`, c'est que des choses ne sont pas enregistrées). `avis` : ce
 * que rend `avisDuDevis` — jamais comptés. `lignes` : les lignes de
 * l'écran, pour nommer une ligne fautive. `onAgir(point)` : la saisie mène
 * où il faut.
 */
export default function PourRemettre({
  etat, lue = null, erreurPhrase = null, erreurReessayable = true, enRoute = false, enLecture = false, avis = [],
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

  /* La dernière liste sûre se montre en `liste` ET en `en_route` (elle ne
     clignote pas pendant un envoi) ; jamais sur un échec. */
  const montrer = !!lue && (etat === 'liste' || etat === 'en_route');
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

        {etat === 'pas_en_base' && <Text style={s.etatTexte}>{LISTE_AVANT_LA_PREMIERE_LIGNE}</Text>}

        {etat === 'lecture' && (
          <View style={s.lecture}>
            <ActivityIndicator color={C.accent2} />
            <Text style={[s.etatTexte, s.flexible]}>{LISTE_EN_LECTURE}</Text>
          </View>
        )}

        {etat === 'en_route' && (
          <Text style={s.etatTexte}>{enRoute ? LISTE_EN_ROUTE : LISTE_SANS_CE_QUI_NEST_PAS_ENREGISTRE}</Text>
        )}
        {etat === 'liste' && enLecture && <Text style={s.aide}>{LISTE_MISE_A_JOUR}</Text>}

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
  lecture: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  flexible: { flex: 1, minWidth: 0 },
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
