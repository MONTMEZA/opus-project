/**
 * LA SAISIE D'UN DEVIS — il tape, ça se totalise, et ça se relit (lot 1 du
 * module devis, 22/10/2026).
 *
 * UN ÉCRAN, PAS UNE FENÊTRE : plein écran, retour EN HAUT (le clavier monte
 * du bas, il ne peut enfermer personne), et c'est ce qui permet d'ouvrir la
 * fiche d'un client ou « Mon entreprise » PAR-DESSUS sans jamais deux
 * `Modal` empilées.
 *
 * CE QUI FAIT FOI, C'EST LA BASE
 * ------------------------------
 * Chaque ligne s'enregistre quand on la QUITTE, par la file d'écriture du
 * devis (`fileDuDevis`, `file-ecriture.js`) — une requête à la fois, des
 * identifiants choisis par le téléphone, un délai sur chaque écriture. Le
 * total affiché — HT, la TVA par taux, TTC — est celui que la BASE a
 * recalculé, relu après chaque écriture : jamais celui du téléphone. Le
 * total d'une ligne et les sous-totaux, eux, se calculent ici par les
 * fonctions pures de `devis.js` — les mêmes, au centime, que celles de la
 * base (`verifier-devis` les éprouve sur le même jeu que PostgreSQL).
 *
 * CHAQUE RANGÉE DIT SON ÉTAT : rien quand elle est enregistrée ;
 * « enregistrement… » ; « Non enregistrée — Réessayer » ; « Non enregistrée —
 * La corriger » quand la base l'a REFUSÉE (renvoyée telle quelle, elle serait
 * refusée pareil : « Réessayer » mentirait) ; « Incomplète — La compléter ».
 * Un travail qui n'a pas pu se faire ne ressemble jamais à un travail fait —
 * et le pied le dit aussi (« · 2 lignes non enregistrées »). Les OPTIONS
 * aussi : elles vivent sous la liste, et leur rangée ne disait rien.
 *
 * LIRE EN LISTE, ÉDITER EN CARTE — et la carte prend l'écran (`CarteLigne`).
 *
 * LA GARDE DE SORTIE : on quitte cet écran par des chemins qu'il ne voit pas
 * (le retour, la barre du bas, la cloche, une notification, la
 * déconnexion), et chaque changement d'écran le DÉMONTE. Un texte qui n'est
 * que dans un champ démonté est perdu. L'écran inscrit donc dans
 * `gardeSortie` (une référence d'`OpusApp`) de quoi tout lire et tout
 * enregistrer AVANT le démontage, et `OpusApp` passe par
 * `quitterSaisieDevis()` à chacune de ces portes.
 *
 * LES FEUILLES : « Pour qui ? », « Ajouter à ma base » et la feuille d'un
 * poste (lot P). Elles se posent PAR-DESSUS la saisie — et par-dessus la
 * carte d'une ligne, qui n'est pas une `Modal` — sans la quitter. Leur état
 * est UNE valeur (`feuille`), jamais un booléen par feuille : deux `Modal`
 * empilées laissent sur l'iPhone un voile invisible qui avale les touches
 * (la leçon des Demandes, « un seul panneau à la fois, tenu par une chaîne
 * et non par trois booléens »). Deux feuilles ne peuvent donc pas être
 * demandées ensemble, par construction.
 *
 * « POUR LE REMETTRE » (lot 2b-1, 05/11/2026) — ce qu'il manque pour
 * remettre ce devis, dit par la BASE (`motifs_refus_remise`) : une ligne
 * sous le bandeau du haut, une rangée sous « Conditions », et la carte
 * qu'elles ouvrent (`PourRemettre`, une valeur de plus de l'état `carte`).
 * La liste se LIT :
 *   - à l'ouverture d'un devis déjà en base — jamais avant (un brouillon
 *     qui n'est pas en base rendrait OP027) ;
 *   - après chaque relecture des totaux lancée par la file (l'événement
 *     `totaux`), sous la MÊME garde : la génération de la file. Une réponse
 *     partie avant une écriture est écartée, comme les totaux (I3) ;
 *   - au retour de « Mon entreprise », qui écrit par d'autres chemins que
 *     la file (`retourEntreprise`, un compteur d'`OpusApp`) ;
 *   - sur « Réessayer ».
 * Pendant un envoi, la dernière liste sûre reste affichée : elle ne
 * clignote pas. Un appui mène à l'endroit de chaque point — le client, la
 * ligne fautive, le délai ou le lieu (qui prennent le focus), la carte
 * « Conditions » ouverte SUR son champ (et « ‹ » y ramène à la liste), ou
 * « Mon entreprise » sur sa section.
 *
 * LOT 2b-2 (cahier §3.4-§3.8) — « À QUEL TITRE ? » ET « LE CHANTIER » :
 *   - sous le choix du client, le bloc « À quel titre ? » (dans l'en-tête,
 *     à hauteur fixe) ; sa feuille des quatre réponses s'ouvre par l'état
 *     UNIQUE `feuille` (`{ type: 'pour_qui' }`), jamais par l'en-tête ;
 *   - avant « Conditions », la rangée « Le chantier », qui ouvre une carte
 *     plein écran (`CARTE_CHANTIER`, une valeur de plus de l'état `carte`) ;
 *     le « Oui » à la première question se confirme dans une feuille
 *     (`{ type: 'chantier_neuf' }`) posée par-dessus ;
 *   - « en route » et « pas enregistré » se CALCULENT à chaque événement de
 *     la file (`etatDesChampsDuDevis`), jamais mémorisés : un état « en
 *     cours » gardé en mémoire survivait à un échec (critique écran E-B2) ;
 *   - la partie « Votre entreprise » de la liste DÉPEND DU DEVIS : la
 *     réponse « à quel titre » retire des mentions. Quand la réponse que la
 *     BASE a vue change, les DEUX parties se relisent ; et la phrase des
 *     mentions dues à un particulier suit la réponse rangée AVEC la liste
 *     (`liste.reponseVue`), jamais celle de l'écran.
 *
 * LOT 2b-3 (cahier §3.4-§3.8) — LES LIGNES :
 *   - une ligne neuve naît avec la réparation urgente ÉTEINTE (`ligneNeuve`),
 *     jamais reprise ; la carte d'un poste porte l'interrupteur, et reçoit
 *     UNE valeur de plus, `depuisUneUrgence` (la carte ne lit pas le devis) ;
 *   - « Le chantier » gagne une troisième question (la décennale), avec son
 *     état calculé depuis la file (`etatQ3`) ; ouverte depuis un point, la
 *     carte s'ouvre SUR la question visée (`questionChantier`) ;
 *   - « Conditions » reçoit les lignes de l'écran et `toutUrgent`, pour
 *     l'aide de l'échéance et la ligne « pourquoi ».
 *
 * EN DÉMONSTRATION, tout cela VIT : la base en mémoire de
 * `src/data/devis-demo.js` refuse avec les mots de la vraie base, une
 * écriture y prend un tiers de seconde, et les états « enregistrement… » ou
 * « non enregistrée » s'y voient sans fichier `.env`.
 */
import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, Keyboard, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, GOUTTIERE, CARTE, TOUCHE, APPUI, interligne, surFond,
} from '../theme';
import {
  BtnOutline, Pastille, Montant,
} from '../components/ui';
import { ChevronRight } from '../components/icons';
import EnteteDevis from '../components/EnteteDevis';
import CarteLigne, { MANQUE } from '../components/CarteLigne';
import ChoixClientDevis from '../components/ChoixClientDevis';
import FeuilleAjoutPoste from '../components/FeuilleAjoutPoste';
import FeuillePoste from '../components/FeuillePoste';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import { CLAVIER } from '../lib/clavier';
import {
  messageClair, messageDeContrainte, estUnRefusDefinitif, messageDEcritureDuDevis,
} from '../lib/erreurs';
import { DELAI_ECRITURE } from '../lib/file-ecriture';
import { nouvelIdentifiant, IDENTIFIANT_IMPOSSIBLE } from '../lib/identifiant';
import { clientDepuisDemande } from '../lib/clients';
import {
  UNITES, TYPES_CHIFFRES, MENTION_FRANCHISE,
  validerLigne, validerDevis, nettoyerDevis, trierLignes, sousTotaux, totalLigne,
  lignesDeLaPiece, titreQuiRecoit, pieceDeLaLigne, ligneVierge, ordreEntre, renumeroter,
  monter, descendre, tauxLisible, tauxProposes, tauxHorairePropose, coherenceRegime,
  devisDepuisClient, milliemesLisibles, texteNet,
  fusionnerAvecLaFile, proprietesDeLaRangee,
  rangeesDesTotaux, resumeDesConditions, suffixeDuPied, libellesDesTotaux, phraseEchecDuDevis,
  demandeDuDevis, vibrerPourLaCarte, nomsDesRefus,
  cheminDeLEcriture, refusDeLaLigne, renvoyerLaLigne, creerRenvoisAutomatiques, phraseDuRejeu, echecsDeLaFile,
  echecASignaler, renvoyerLesRetraits, retraitsARenvoyer, bilanDeLaGarde, ENTETE_EN_COURS, devisPourMesDevis,
  lireMotifsDeRemise, avisDuDevis, CARTE_POUR_REMETTRE, TITRE_POUR_REMETTRE, etatDeLaListe, ceQueLaListeNeComptePas,
  pourQuiValable, resumeAQuelTitre, resumeDuChantier, etatDesChampsDuDevis,
  CHAMPS_A_QUEL_TITRE, CHAMPS_DU_CHANTIER, GABARITS_DU_CHANTIER, LE_CHANTIER, DETAIL_URGENCE, DETAIL_URGENCE_SEUL,
  toutUrgent,
} from '../lib/devis';
import { SECTION_DU_MOTIF } from '../lib/emetteur';
import ConditionsDevis from '../components/ConditionsDevis';
import ChantierDevis from '../components/ChantierDevis';
import FeuilleAQuelTitre from '../components/FeuilleAQuelTitre';
import FeuilleChantierNeuf from '../components/FeuilleChantierNeuf';
import PourRemettre, { LigneRemise } from '../components/PourRemettre';
import { posteDepuisLaLigne, postesLus, phraseSuppressionDuBrouillon } from '../lib/postes';

/* Ce que nomme la bande de la garde quand un champ de l'en-tête a été REFUSÉ
   par l'écran (relecture « données » des étapes 4 à 7, I1). */
const NOMS_ENTETE = Object.freeze({
  objet: 'Objet',
  lieuAdresse: 'Lieu des travaux',
  lieuCodePostal: 'Code postal',
  lieuVille: 'Ville',
  delaiExecution: 'Délai d’exécution',
  retenueGarantieCentiemes: 'Taux de la retenue',
  clientId: 'Pour qui ?',
  remiseCentiemes: 'Réduction',
  remiseCentimes: 'Réduction',
  /* Les deux montants de l'acompte n'ont PAS de nom fixe : ils prennent celui
     de leur nature (`nomsDesRefus`, devis.js) — « Acompte ou arrhes » tant
     qu'elle n'est pas choisie, jamais « Acompte » seul. */
  acompteNature: 'Acompte ou arrhes',
  validiteJours: 'Validité de l’offre',
  /* 2b-2 : la réponse et le client pour lequel elle est donnée sont UNE
     écriture (la paire) — un seul nom ; les deux questions du chantier
     aussi (critique écran E-M3). */
  pourQui: 'À quel titre',
  pourQuiClient: 'À quel titre',
  chantierNeufConso: 'Le chantier',
  chantierNeufTva: 'Le chantier',
  /* 2b-3 : la question de la décennale (« Le chantier ») et le moment où le
     client paie (« Conditions »). */
  engageDecennale: 'Le chantier',
  acompteALaSignature: 'Conditions',
});

/* LES CHAMPS DE LA CARTE « CONDITIONS » (lot 2a) : « Corriger » rouvre la
   carte quand l'un d'eux a été refusé. */
const CHAMPS_CONDITIONS = Object.freeze([
  'remiseCentiemes', 'remiseCentimes', 'acompteCentiemes', 'acompteCentimes', 'acompteNature', 'validiteJours',
  'retenueGarantieCentiemes',
  /* 2b-3 : le moment où le client paie s'écrit dans la carte (annexe B,
     point 21) — un refus de l'en-tête qui l'emporte se dit sur la rangée
     « Conditions », et « Corriger » rouvre la CARTE, pas le haut de la
     liste (`NOMS_ENTETE` le nomme déjà « Conditions »). */
  'acompteALaSignature',
]);

/* L'UNIQUE ÉTAT DE CARTE (cahier du lot 2, §3.4) : `null`, l'identifiant
   d'une LIGNE, `CARTE_CONDITIONS`, ou `CARTE_POUR_REMETTRE` (lot 2b-1,
   « ce qu'il manque pour remettre ce devis »). Une seule valeur, jamais
   deux booléens : deux cartes ne peuvent pas être ouvertes ensemble, et le
   retour, la garde et VoiceOver les traitent pareil. Un identifiant de ligne
   est un UUID : il ne vaut jamais « conditions » ni « pour_remettre ». */
const CARTE_CONDITIONS = 'conditions';
/* …et `CARTE_CHANTIER` (lot 2b-2) : la carte des questions sur le chantier
   (deux sur le neuf ; 2b-3 : la troisième, la garantie décennale). */
const CARTE_CHANTIER = 'chantier';

/* « Rien en route, rien en échec » : l'état de départ d'un ensemble de
   champs, avant le premier événement de la file. */
const AUCUN_ETAT = Object.freeze({ enRoute: false, enEchec: false, local: false });

/* Ce qu'une lecture de la liste « Pour le remettre » relit parce que cela
   vient de changer : rien (lot 2b-1, relecture ECR-1). */
const AUCUNE_RELECTURE = Object.freeze({ devis: false, entreprise: false });

const uniteDe = (cle) => UNITES.find((u) => u.cle === cle) || null;
const NIVEAU = { zone: 1, piece: 2 };

/* Une ligne NEUVE, toutes colonnes dites : rien n'est envoyé tant qu'elle
   n'est pas recevable. */
function ligneNeuve(type, id, ordre, taux) {
  const chiffree = TYPES_CHIFFRES.includes(type);
  return {
    id, ordre, type, designation: null,
    quantiteMilliemes: null, unite: null, prixUnitaireCentimes: null,
    tauxTvaCentiemes: chiffree ? taux : null,
    offert: false, mainOeuvre: false, fournitureNonComprise: false,
    surfaceSolMilliemes: null, surfaceMursMilliemes: null,
    /* 2b-3 : la réparation urgente naît ÉTEINTE, toujours — jamais reprise
       de la ligne précédente (à l'inverse du taux, `tauxPour`), jamais
       déduite de l'origine du devis : allumée, elle retire des droits au
       client. Seul un appui sur son interrupteur l'allume. */
    urgence: false,
  };
}

const ordreMax = (lignes) => (lignes.length ? Math.max(...lignes.map((l) => Number(l.ordre) || 0)) : null);

/* --------------------------------------------------------------------------
   UNE RANGÉE DE LA LISTE — mémorisée, et elle ne reçoit que des VALEURS
   (un total, un état, un sous-total), jamais des fonctions qui décident :
   sinon chaque rangée se croirait différente à chaque rendu. Ces valeurs
   sont CE QUE REND `proprietesDeLaRangee` (`devis.js`), et rien d'autre :
   la liste est l'écran qu'on montre à un client, elle ne dit rien de la
   base de postes (réponse du propriétaire du 23/10, Q3 a). `verifier-postes`
   fait tourner la fonction, et refuse une balise qui ajouterait quoi que ce
   soit à ce qu'elle rend.
   -------------------------------------------------------------------------- */
/* L'ÉTAT D'UNE RANGÉE — celle d'une ligne de la liste, ou d'une option sous
   elle. UN REFUS DÉFINITIF NE PROPOSE PAS « Réessayer » (reprise « écran »
   du lot 2a, point 1) : la même écriture recevrait la même réponse —
   mesuré, « Réessayer » sur une ligne qui faisait dépasser le plafond
   échouait à l'identique, autant de fois qu'on le touchait. La rangée dit
   QUOI FAIRE : « La corriger » ouvre sa carte (`definitif === 'ligne'`) ;
   une ligne qui attend un brouillon refusé n'a rien à corriger elle-même
   (`definitif === 'brouillon'`), la bande du bas dit pourquoi. */
function EtatDeLaRangee({
  id, etat, erreurTexte, incomplete, definitif, onOuvrir, onReessayer, aligne = false, option = false,
}) {
  /* `aligne` : dans le bloc des options, qui a déjà sa marge — le bouton
     s'aligne sur le texte de l'option au lieu de reculer deux fois. Il
     perd sa MARGE, jamais son remplissage : sans lui, le texte touchait le
     bord arrondi de la gélule (relecture finale, ÉCRAN-F4 — un texte de
     135 points dans une gélule de 137). La boîte, elle, perd le sien. */
  const bouton = ({ pressed }) => [s.etatBouton, aligne && s.etatBoutonAligne, pressed && APPUI.plein];
  /* VoiceOver dit ce qu'est la rangée : une option n'est pas une « ligne ». */
  const quoi = option ? 'Option' : 'Ligne';
  return (
    <>
      {etat === 'en_cours' && <Text style={[s.etat, aligne && s.etatBoiteAligne]}>enregistrement…</Text>}
      {etat === 'echec' && (
        <View style={[s.etatBoite, aligne && s.etatBoiteAligne]}>
          {definitif === 'ligne' && (
            <Pressable
              onPress={() => onOuvrir(id)}
              accessibilityRole="button"
              accessibilityLabel={`${quoi} non enregistrée. La corriger`}
              style={bouton}
            >
              <Text style={s.etatBoutonTexte}>Non enregistrée — La corriger</Text>
            </Pressable>
          )}
          {definitif === 'brouillon' && <Text style={s.etatMot}>Non enregistrée — le brouillon d’abord</Text>}
          {!definitif && (
            <Pressable
              onPress={() => onReessayer(id)}
              accessibilityRole="button"
              accessibilityLabel={`${quoi} non enregistrée. Réessayer`}
              style={bouton}
            >
              <Text style={s.etatBoutonTexte}>Non enregistrée — Réessayer</Text>
            </Pressable>
          )}
          {!!erreurTexte && <Text style={s.etatPhrase}>{erreurTexte}</Text>}
        </View>
      )}
      {incomplete && etat !== 'echec' && (
        <Pressable
          onPress={() => onOuvrir(id)}
          accessibilityRole="button"
          accessibilityLabel={`${quoi} incomplète. La compléter`}
          style={bouton}
        >
          <Text style={s.etatBoutonTexte}>Incomplète — La compléter</Text>
        </Pressable>
      )}
    </>
  );
}

const RangeeLigne = React.memo(function RangeeLigne({
  id, type, designation, total, offert, fournitureNonComprise, urgence, quantite, unite, prix,
  sousTotal, etat, erreurTexte, incomplete, definitif, onOuvrir, onReessayer,
}) {
  const u = uniteDe(unite);
  let contenu;
  if (type === 'zone' || type === 'piece') {
    contenu = (
      <View style={s.titreLigne}>
        <Text style={type === 'zone' ? s.zone : s.piece} numberOfLines={2}>{designation || 'Sans titre'}</Text>
        {/* Le sous-total en Inter, chiffres tabulaires : jamais dans
            l'Oswald du titre, qui n'en a pas. */}
        <Montant centimes={sousTotal} />
      </View>
    );
  } else if (type === 'reserve') {
    contenu = (
      <Text style={s.reserve}>
        <Text style={s.reserveMot}>Réserve : </Text>
        {designation || ''}
      </Text>
    );
  } else {
    contenu = (
      <View style={s.poste}>
        <View style={s.posteTexte}>
          {/* La désignation se lit EN ENTIER : jamais coupée au milieu d'un
              nombre. */}
          <Text style={s.designation}>{designation || 'Ligne sans désignation'}</Text>
          {quantite != null && (
            <Text style={s.detail}>
              {`${milliemesLisibles(quantite)}${u ? ` ${u.court}` : ''} × `}
              <Montant centimes={offert && prix === 0 ? null : prix} enLigne style={s.detailMontant} />
              {fournitureNonComprise ? ' · fourniture non comprise' : ''}
              {/* 2b-3 (cahier §3.5) : APRÈS « fourniture non comprise », et
                  avant le total — la liste est l'écran qu'on montre à un
                  client, et la marque s'imprimera en 2c. */}
              {urgence ? ` · ${DETAIL_URGENCE}` : ''}
            </Text>
          )}
          {quantite == null && fournitureNonComprise && <Text style={s.detail}>Fourniture non comprise</Text>}
          {quantite == null && urgence && (
            <Text style={s.detail}>{DETAIL_URGENCE_SEUL}</Text>
          )}
        </View>
        {offert ? <Text style={s.offert}>Offert</Text> : <Montant centimes={total} fort />}
      </View>
    );
  }
  const libelle = type === 'reserve' ? `Réserve : ${designation || ''}`
    : `${designation || 'Ligne'}${urgence ? `, ${DETAIL_URGENCE}` : ''}, ouvrir`;
  return (
    <View style={[s.rangee, (type === 'zone' || type === 'piece') && s.rangeeTitre]}>
      <Pressable
        onPress={() => onOuvrir(id)}
        accessibilityRole="button"
        accessibilityLabel={libelle}
        style={({ pressed }) => [s.rangeeZone, pressed && APPUI.discret]}
      >
        {contenu}
      </Pressable>
      <EtatDeLaRangee
        id={id}
        etat={etat}
        erreurTexte={erreurTexte}
        incomplete={incomplete}
        definitif={definitif}
        onOuvrir={onOuvrir}
        onReessayer={onReessayer}
      />
    </View>
  );
});

/* Le séparateur, déclaré au niveau du MODULE (un type neuf à chaque rendu
   remonterait tous les séparateurs) ; l'espace va DANS la cellule, jamais
   un `gap` dans le conteneur d'une liste. */
function Intervalle() {
  return <View style={s.intervalle} />;
}

/* --------------------------------------------------------------------------
   LE BAS DU DEVIS — les options, la barre « Ajouter », la ventilation, les
   conditions, la suppression. Un composant à lui, posé comme un ÉLÉMENT
   (`ListFooterComponent={bas}`) : le champ de la retenue garde son texte.
   -------------------------------------------------------------------------- */
function BasDuDevis({
  options, franchise, reel, regime, propositions, regimeEnEchec, totaux, totauxIllisibles, devis, erreurs,
  etatDeLOption, onReessayer,
  onOuvrir, onAjouter, onRelireTotaux, onOuvrirConditions, onSupprimer, confirmeSuppression, phraseSuppression,
  rangeeRemise = null, resumeChantier = null, onOuvrirChantier = null,
}) {
  /* Les postes attendent le régime : `null` = on ne sait pas encore (en
     lecture, ou la lecture a échoué) ; `[]` = non déclaré — seuls les titres
     et les réserves se posent alors. */
  const chiffrerPossible = Array.isArray(propositions) && propositions.length > 0;

  return (
    <View style={s.bas}>
      {options.length > 0 && (
        <View style={s.options}>
          <Text style={s.titreSection} accessibilityRole="header">Options, non comprises</Text>
          {/* Chacune avec SON prix, et AUCUN total : une option n'est pas dans
              le devis tant que le client ne l'a pas choisie. */}
          {/* UNE OPTION DIT SON ÉTAT COMME UNE LIGNE (point 1) : refusée par
              le plafond, sa rangée ne disait RIEN — seul le pied comptait
              « 1 ligne non enregistrée », sans dire laquelle (mesuré). */}
          {options.map((o) => {
            const e = etatDeLOption(o);
            return (
              <View key={o.id}>
                <Pressable
                  onPress={() => onOuvrir(o.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Option : ${o.designation || 'sans désignation'}, ouvrir`}
                  style={({ pressed }) => [s.option, pressed && APPUI.discret]}
                >
                  <Text style={s.designation}>{o.designation || 'Option sans désignation'}</Text>
                  <View style={s.optionPrix}>
                    {o.offert ? <Text style={s.offert}>Offert</Text> : <Montant centimes={totalLigne(o)} />}
                    {reel && !!tauxLisible(o.tauxTvaCentiemes) && (
                      <Text style={s.detail}>{`HT · ${tauxLisible(o.tauxTvaCentiemes)}`}</Text>
                    )}
                  </View>
                </Pressable>
                <EtatDeLaRangee
                  id={o.id}
                  etat={e.etat}
                  erreurTexte={e.erreurTexte}
                  incomplete={e.incomplete}
                  definitif={e.definitif}
                  onOuvrir={onOuvrir}
                  onReessayer={onReessayer}
                  aligne
                  option
                />
              </View>
            );
          })}
        </View>
      )}

      {/* LA BARRE « AJOUTER » : des pastilles de 44 points, en fin de devis. */}
      <Text style={s.titreSection}>Ajouter</Text>
      <View style={s.pastilles}>
        {propositions !== null && propositions.length === 0 ? null : (
          <Pastille label="Poste" nom="Ajouter un poste chiffré" disabled={!chiffrerPossible} onPress={() => onAjouter('poste')} />
        )}
        <Pastille label="Pièce" nom="Ajouter une pièce" onPress={() => onAjouter('piece')} />
        <Pastille label="Zone" nom="Ajouter une zone" onPress={() => onAjouter('zone')} />
        <Pastille label="Réserve" nom="Ajouter une réserve" onPress={() => onAjouter('reserve')} />
        {propositions !== null && propositions.length === 0 ? null : (
          <Pastille label="Option" nom="Ajouter une option" disabled={!chiffrerPossible} onPress={() => onAjouter('option')} />
        )}
      </View>
      {/* DEUX PASTILLES GRISÉES DISENT POURQUOI, à côté d'elles : l'avis du
          régime est tout en haut, et l'on n'appuie pas sur ce qui a l'air
          cassé sans savoir pourquoi (relecture « écran » des étapes 4 à 7,
          C10). */}
      {propositions === null && (
        <Text style={s.aide}>
          {regimeEnEchec
            ? 'Les postes et les options attendent votre régime de TVA, qui n’a pas pu être lu : réessayez en haut de l’écran.'
            : 'Lecture de votre régime de TVA…'}
        </Text>
      )}

      {/* LA VENTILATION — celle que la BASE a calculée. En franchise, aucun
          taux : la mention de franchise, à la place de la TVA. Et quand le
          régime n'est PAS CONNU (en lecture, en échec, non déclaré), on ne
          nomme pas la taxe : « Total », sans « TVA 10 % » ni « TTC » — un
          régime qu'on n'a pas pu lire ne permet pas de dire qu'il y a une
          TVA (relecture « écran » des étapes 4 à 7, C2). */}
      <View style={s.ventilation}>
        {/* LES RANGÉES viennent de `rangeesDesTotaux` (devis.js), la MÊME
            fonction que la carte « Conditions » : total avant réduction et
            réduction s'il y en a une, HT et TVA par taux AU RÉGIME RÉEL
            SEULEMENT, total, total toutes options comprises, acompte et
            reste à payer. Une réduction se DIT en montant positif (`aDire`),
            jamais avec un trait d'union. */}
        {rangeesDesTotaux(totaux || { ht: null, tva: null, ttc: null, ventilation: [] }, regime,
          { nbOptions: options.length }).map((r) => (
          <View key={r.cle} style={s.ligneTotal} accessible accessibilityLabel={r.aDire}>
            <Text style={r.fort ? s.libelleTotal : s.libelle}>
              {r.libelle}
              {r.base != null && (
                <>
                  {' '}
                  <Montant centimes={r.base} enLigne style={s.libelleMontant} />
                </>
              )}
            </Text>
            {/* Le montant à DROITE, sans `flex` : il prend sa largeur, le
                libellé prend le reste — les montants tombent en colonne. */}
            <Text style={r.fort ? s.valeurTotal : s.valeur}>
              {r.moins ? '− ' : ''}
              <Montant centimes={r.centimes} enLigne fort={!!r.fort} />
            </Text>
          </View>
        ))}
        {franchise && <Text style={s.mention}>{MENTION_FRANCHISE}</Text>}
        {totauxIllisibles && (
          <View style={s.illisibles}>
            <Text style={s.etatPhrase}>Les totaux n’ont pas pu être relus : ceux-ci peuvent dater.</Text>
            <BtnOutline label="Relire" onPress={onRelireTotaux} />
          </View>
        )}
      </View>

      {/* « LE CHANTIER » (lot 2b-2) — juste AVANT « Conditions », jamais
          au-dessus des lignes. Elle n'existe que si une question au moins est
          montrée (`resumeDuChantier` rend alors son résumé). SA HAUTEUR NE
          DÉPEND PAS DE CE QU'ELLE DIT : tous ses résumés possibles sont posés
          en gabarits invisibles (`GABARITS_DU_CHANTIER`), le résumé lu
          par-dessus — la règle « garder la grande place ». */}
      {!!resumeChantier && (
        <Pressable
          onPress={onOuvrirChantier}
          accessibilityRole="button"
          accessibilityLabel={`${LE_CHANTIER.titre} : ${resumeChantier}. Ouvrir`}
          style={({ pressed }) => [s.resume, pressed && APPUI.discret]}
        >
          <View style={s.resumeTexte}>
            <Text style={s.replieTexte}>{LE_CHANTIER.titre}</Text>
            <View style={s.superpose}>
              {GABARITS_DU_CHANTIER.map((g, i) => (
                <View
                  key={`gabarit-${i}`}
                  style={[s.couche, i > 0 && s.coucheSuivante, s.gabarit]}
                  aria-hidden
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                >
                  <Text style={s.aide}>{g}</Text>
                </View>
              ))}
              <View style={[s.couche, s.coucheSuivante]}>
                <Text style={s.aide}>{resumeChantier}</Text>
              </View>
            </View>
          </View>
          <ChevronRight size={16} color={C.accent2} />
        </Pressable>
      )}

      {/* LES CONDITIONS — une rangée qui les RÉSUME et ouvre leur carte
          (lot 2a). Ce qui manque passe d'abord ; un champ refusé se dit. */}
      <Pressable
        onPress={onOuvrirConditions}
        accessibilityRole="button"
        accessibilityLabel={`Conditions : ${resumeDesConditions(devis)}. Ouvrir`}
        style={({ pressed }) => [s.resume, pressed && APPUI.discret]}
      >
        <View style={s.resumeTexte}>
          <Text style={s.replieTexte}>Conditions</Text>
          <Text style={s.aide} numberOfLines={2}>{resumeDesConditions(devis)}</Text>
          {CHAMPS_CONDITIONS.some((c) => erreurs && erreurs[c]) && (
            <Text style={s.erreur}>Une condition n’est pas enregistrée : touchez pour la corriger.</Text>
          )}
        </View>
        <ChevronRight size={16} color={C.accent2} />
      </Pressable>

      {/* « POUR LE REMETTRE » (lot 2b-1) — la même ligne que sous le bandeau,
          pour qui arrive en fin de chiffrage. Son étiquette ne commence pas
          par « Conditions : » : c'est une autre rangée. */}
      {rangeeRemise}

      {/* SUPPRIMER CE BROUILLON, en deux appuis — et le second le DIT. */}
      <Pressable
        onPress={onSupprimer}
        accessibilityRole="button"
        accessibilityLabel={confirmeSuppression ? 'Confirmer la suppression de ce brouillon' : 'Supprimer ce brouillon'}
        style={({ pressed }) => [s.supprimer, confirmeSuppression && s.supprimerDanger, pressed && APPUI.plein]}
      >
        <Text style={[s.supprimerTexte, confirmeSuppression && s.supprimerDangerTexte]}>
          {confirmeSuppression ? 'Confirmer : supprimer ce brouillon' : 'Supprimer ce brouillon'}
        </Text>
      </Pressable>
      {/* …et ce qui RESTE : les postes rangés depuis ce devis (TEXTES8) —
          `phraseSuppressionDuBrouillon`, jamais une phrase écrite ici. */}
      {confirmeSuppression && <Text style={s.aide}>{phraseSuppression}</Text>}
    </View>
  );
}

/* ========================================================================== */

export default function SaisieDevisScreen({
  ouverture, regime, tarifs = null, clients = [], clientsEtat = 'vide', onGarde = null,
  onRelireRegime, onMonEntreprise, onChargerClients, onNouveauClient,
  onCarte, onRanger, onSupprime, onErreur,
  /* LA BASE DE POSTES (lot P) : lue par `OpusApp` — à la première carte
     chiffrée, comme la mémoire —, rangée par `OpusApp` (`onRangerPoste`).
     `regimeDeclareLe` : une référence fixée avant la déclaration du régime
     de TVA actuel se vérifie au lieu de se comparer. */
  postes = null, postesEtat = 'vide', regimeDeclareLe = null, onChargerPostes = null, onRangerPoste = null,
  /* LOT 2b-1 : un compteur qu'`OpusApp` incrémente à chaque fermeture de
     « Mon entreprise » — la liste de ce qu'il manque se relit alors. */
  retourEntreprise = 0,
}) {
  /* L'identifiant d'un brouillon NEUF vient du téléphone (une écriture
     renvoyée n'est jamais un doublon) ; s'il ne sait pas en fabriquer,
     l'écran le DIT au lieu d'enregistrer de travers. */
  const [devisIdInitial] = useState(() => (ouverture.devisId || nouvelIdentifiant()));
  const [etat, setEtat] = useState(() => {
    if (!devisIdInitial) return 'impossible';
    return ouverture.devisId ? 'chargement' : 'pret';
  });
  const [tentative, setTentative] = useState(0);
  const [erreurLecture, setErreurLecture] = useState(null);
  const [devis, setDevis] = useState(() => (ouverture.devisId ? {} : {
    ...(ouverture.valeurs || {}), demande: ouverture.demande || null, urgence: ouverture.urgence || null,
  }));
  const [clientAffiche, setClientAffiche] = useState(ouverture.client || null);
  const [lignes, setLignes] = useState([]);
  const [etats, setEtats] = useState({});
  /* La phrase d'une ligne en échec, traduite UNE fois, à l'arrivée de
     l'événement : l'erreur de la base reste brute dans la file (son code
     décide d'une reprise), la phrase est pour l'écran. */
  const [phrasesEchec, setPhrasesEchec] = useState({});
  /* LA NATURE D'UN REFUS DÉFINITIF, par ligne (`refusDeLaLigne`) : la rangée
     ne propose plus « Réessayer », et la carte ne renvoie pas une ligne
     inchangée. Une référence aussi : `enregistrerLigne` la lit. */
  const [definitifs, setDefinitifs] = useState({});
  const definitifsRef = useRef({});
  /* Les refus du plafond renvoyés TOUT SEULS (`creerRenvoisAutomatiques`,
     devis.js) : quand l'un passe, on l'annonce ; s'il est refusé encore,
     rien ne se signale — sauf si l'artisan a écrit sur la clé entre-temps
     (N1 : c'est alors l'échec de SON geste). */
  const [renvois] = useState(creerRenvoisAutomatiques);
  const [erreurs, setErreurs] = useState({});
  /* LES CHAMPS DE L'EN-TÊTE REFUSÉS PAR L'ÉCRAN, champ par champ, et ce
     qu'il en a dit. Une référence ET un état : la garde de sortie les lit
     au moment de partir — refusés, ils n'ont RIEN envoyé, et quitter sans le
     dire perdait ce qui était tapé (relecture « données » des étapes 4 à 7,
     I1 : un code postal de quatre chiffres, une retenue de 6 %, partis sans
     un mot). */
  const [erreursEntete, setErreursEntete] = useState({});
  /* UN CHAMP DE L'EN-TÊTE TAPÉ ET PAS ENCORE QUITTÉ (l'objet, le lieu, le
     délai) : ce qui y est écrit n'est pas encore parti, et la liste « Pour
     le remettre » ne le connaît pas — elle dit « Des changements
     partent… » (cahier §3.1, annexe B.8). L'en-tête le signale UNE fois
     par saisie (`onFrappe`), jamais à chaque lettre. */
  const [champOuvert, setChampOuvert] = useState(false);
  const refusEntete = useRef({});
  const [totaux, setTotaux] = useState(() => (ouverture.devisId ? null : {
    ht: 0, tva: 0, ttc: 0, brut: 0, reduction: 0, acompte: 0, ttcOptions: 0, ventilation: [],
    /* Un brouillon neuf : la base n'a vu AUCUNE demande (relecture ÉCRAN-1
       du lot 2a — la carte ne juge « ramenée » que contre elle). */
    demande: demandeDuDevis({}),
  }));
  /* LES DERNIERS TOTAUX REÇUS, aussi dans une référence (2b-2) : la liste
     « Pour le remettre », à son retour, range avec elle la réponse « à quel
     titre » que la base a vue DANS LA MÊME PHOTO — le bloc `demande` de ces
     totaux, relus sous la même génération de la file. */
  const totauxRef = useRef(totaux);
  const poserTotaux = (t) => {
    totauxRef.current = t;
    setTotaux(t);
  };
  const [totauxIllisibles, setTotauxIllisibles] = useState(false);
  const [attente, setAttente] = useState({
    nb: 0, enCours: false, devisErreur: null, devisEnBase: false, retraitsEnEchec: 0, renvoisEnRoute: 0,
    etatAQuelTitre: AUCUN_ETAT, etatChantier: AUCUN_ETAT, etatQ1: AUCUN_ETAT, etatQ2: AUCUN_ETAT, etatQ3: AUCUN_ETAT,
  });
  const [carte, setCarte] = useState(null);
  const [cleCarte, setCleCarte] = useState(0);
  const [memoire, setMemoire] = useState(null);
  /* L'UNIQUE ÉTAT DE FEUILLE : `null`, `{ type: 'client' }`,
     `{ type: 'ajout', valeurs, devisOrigineId }`,
     `{ type: 'poste', poste, prixPropose }`, et depuis 2b-2
     `{ type: 'pour_qui' }` (« À quel titre ? ») et
     `{ type: 'chantier_neuf' }` (la confirmation du chantier neuf). Jamais
     deux booléens. */
  const [feuille, setFeuille] = useState(null);
  const [phraseLieu, setPhraseLieu] = useState(null);
  const [garde, setGarde] = useState(null);
  const gardeRef = useRef(null);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);
  const refListe = useRef(null);

  const fileRef = useRef(null);
  const lignesRef = useRef([]);
  const devisRef = useRef(devis);
  const erreursRef = useRef({});
  const carteRef = useRef(null);
  const derniereEnvoyee = useRef({});
  const memoireDemandee = useRef(false);
  const refEntete = useRef(null);
  const refCarte = useRef(null);
  const refConditions = useRef(null);
  /* Le TEXTE tapé dans la carte « Conditions » quand une valeur y a été
     refusée : la carte rouverte par « Corriger » le montre encore, au lieu
     de la dernière valeur enregistrée. */
  const [textesConditions, setTextesConditions] = useState(null);
  /* LA LISTE « POUR LE REMETTRE » (lot 2b-1) — ce que la base a rendu :
       motifs   : la DERNIÈRE liste sûre (`null` : jamais lue, ou la
                  dernière lecture a échoué — elle ne peut plus être dite
                  sûre) ;
       erreur   : l'échec de la dernière lecture ;
       enLecture: une lecture est partie ;
       relecture: ce que la lecture EN COURS relit parce que cela vient de
                  changer — `devis` (une écriture du devis confirmée), ou les
                  DEUX (« Mon entreprise » refermée). La partie qui se relit
                  ne se lit pas tant que la liste n'est pas revenue : elle
                  peut mentir (relecture de 2b-1, ECR-1).
     LE RÉGIME DE TVA N'Y EST PAS (relecture 4 de 2b-1, 06/11/2026) : la
     liste est calculée par la BASE, qui lit le régime DANS la base au moment
     de la lecture (`motifs_refus_remise`) — une liste lue est toujours juste
     pour le régime que la base avait alors, et ce que le TÉLÉPHONE sait du
     régime (pas encore lu, en lecture, en échec) ne la rend jamais fausse.
     Le régime de la base ne change que par « Mon entreprise », dont la
     fermeture relit tout : ses trois sorties — la croix, le geste de retour
     d'Android, « Quitter sans enregistrer » — attendent la fin d'un envoi en
     cours (relecture 5 de 2b-1, RELIRE4-A : le bouton de la bande fermait
     pendant l'envoi, et la relecture partait avant l'écriture du régime).
     Un changement de la propriété `regime` ne relit donc rien et n'efface
     rien.
     `lectureListe` numérote les lectures : seule la DERNIÈRE partie
     s'affiche. `monte` : une réponse qui arrive après le démontage ne
     touche à rien. */
  /* `reponseVue` (2b-2, cahier §3.6) : la réponse « à quel titre » VALABLE
     que la base avait quand elle a calculé CETTE liste — le bloc `demande`
     des totaux relus sous la même génération de la file, rangé avec elle au
     retour. `undefined` : aucune liste lue, ou une photo dont la génération
     n'est pas celle de la liste (la phrase de prudence se dit alors). Jamais
     la réponse de l'écran, en avance d'un envoi. Une référence aussi : la
     règle de relecture des événements `totaux` la compare. */
  const [liste, setListe] = useState({
    motifs: null, erreur: null, enLecture: false, relecture: AUCUNE_RELECTURE, reponseVue: undefined,
  });
  const reponseVueRef = useRef(undefined);
  /* La GÉNÉRATION de la file à laquelle les derniers totaux ont été relus :
     la réponse qu'ils portent n'est celle de la liste que si la liste est
     lue sous la même. */
  const totauxGenRef = useRef(null);
  const lectureListe = useRef(0);
  const monte = useRef(true);
  useEffect(() => () => { monte.current = false; }, []);
  /* OÙ REVIENT LA CARTE OUVERTE DEPUIS LA LISTE : `CARTE_POUR_REMETTRE`, ou
     `null` (au devis). Une RÉFÉRENCE (`fermerCarte` la lit) et un état (le
     libellé « ‹ Liste » de la carte). Une seule valeur (critique E-13). */
  const retourRef = useRef(null);
  const [retourCarte, setRetourCarte] = useState(null);
  /* Le champ sur lequel « Conditions » s'ouvre, et le champ de l'en-tête
     qui doit prendre le focus une fois la liste fermée. */
  const [champConditions, setChampConditions] = useState(null);
  /* …et la question sur laquelle « Le chantier » s'ouvre, depuis un point
     de la liste (2b-3, E-I1) : `'q2'`, `'q3'` ou `null` (en haut). */
  const [questionChantier, setQuestionChantier] = useState(null);
  const [focusDemande, setFocusDemande] = useState(null);
  /* Les rappels d'`OpusApp`, toujours les derniers : la file écoute depuis
     son ouverture, et un rappel capturé ce jour-là serait périmé. */
  const rappels = useRef({});
  useEffect(() => {
    rappels.current = {
      onRanger, onSupprime, onErreur, onCarte, onNouveauClient,
    };
  });

  /* Les lignes, dans l'état ET dans une référence : les gestionnaires
     (« Poste suivant », la garde) ont besoin des lignes du moment, pas de
     celles du rendu où ils ont été créés. */
  const changerLignes = (f) => {
    const suivantes = f(lignesRef.current);
    lignesRef.current = suivantes;
    setLignes(suivantes);
  };
  const changerDevis = (v) => {
    devisRef.current = v;
    setDevis(v);
  };
  const poserErreur = (id, e) => {
    const x = { ...erreursRef.current };
    if (e) x[id] = e; else delete x[id];
    erreursRef.current = x;
    setErreurs(x);
  };
  const poserCarte = (id) => {
    carteRef.current = id;
    setCarte(id);
  };
  const poserRetour = (v) => {
    retourRef.current = v;
    setRetourCarte(v);
  };
  const poserDefinitif = (id, r) => {
    const x = { ...definitifsRef.current };
    if (r) x[id] = r; else delete x[id];
    definitifsRef.current = x;
    setDefinitifs(x);
  };
  /* Renvoyer ce que le plafond avait refusé, s'il passerait maintenant — et
     le retenir pour l'annoncer quand ça passe. */
  const rejouerLePlafond = () => {
    const f = fileRef.current;
    if (f) renvois.rejouer(f);
  };
  const poserGarde = (g) => {
    gardeRef.current = g;
    setGarde(g);
  };
  /* Les champs `touches` repartent de zéro, `refus` s'ajoutent. */
  const poserRefusEntete = (touches, refus = {}) => {
    const x = { ...refusEntete.current };
    touches.forEach((c) => { delete x[c]; });
    Object.assign(x, refus);
    refusEntete.current = x;
    setErreursEntete(x);
  };

  /* L'état de la file, résumé pour le pied et la garde. */
  const majAttente = () => {
    const f = fileRef.current;
    if (!f) return;
    const e = f.etats();
    const entrees = f.entreesVoulues();
    const retraits = Object.keys(e).filter((id) => f.retiree(id) && e[id] === 'echec').length;
    setAttente({
      nb: f.enAttente(),
      enCours: Object.values(e).includes('en_cours') || f.etatDe('devis') === 'en_cours',
      devisErreur: f.etatDe('devis') === 'echec' ? (f.erreurDe('devis') || true) : null,
      /* Ce que l'en-tête tient À PART (la réduction refusée par le plafond) :
         la phrase le nomme encore quand une AUTRE écriture a échoué depuis
         (ÉCRAN-F1). */
      devisRetenue: f.etatDe('devis') === 'echec' ? f.retenueDe('devis') : null,
      /* Le brouillon est-il DÉJÀ en base ? Alors un échec de l'en-tête est
         celui d'un CHAMP (`phraseEchecDuDevis`), pas du brouillon. */
      devisEnBase: f.devisEnBase(),
      retraitsEnEchec: retraits,
      /* Les écritures RENVOYÉES APRÈS UN ÉCHEC encore en route (relecture 6
         de 2b-1) : la ligne « Pour le remettre » garde sa grande place
         pendant ce temps (`garderLaPlace`, devis.js). Lues ICI, après chaque
         événement de la file — jamais par une référence pendant le rendu. */
      renvoisEnRoute: f.renvoisEnRoute().length,
      /* Ceux que « Réessayer » de leur bande peut renvoyer : jamais un refus
         définitif (TC-1). */
      retraitsRenvoyables: retraitsARenvoyer(entrees.map((x) => ({ ...x, erreur: f.erreurDe(x.cle) })),
        { estDefinitif: estUnRefusDefinitif }).length,
      /* « À QUEL TITRE » ET « LE CHANTIER » (2b-2, cahier §3.8) : en route,
         en échec — calculés ICI, depuis ce que la file veut et ce que la base
         a confirmé, à CHAQUE événement de la file (`etatDesChampsDuDevis`),
         jamais mémorisés d'un geste à l'autre : un « enregistrement… »
         gardé en mémoire survivait à un échec (critique écran E-B2). */
      etatAQuelTitre: etatDesChampsDuDevis(entrees, CHAMPS_A_QUEL_TITRE),
      etatChantier: etatDesChampsDuDevis(entrees, CHAMPS_DU_CHANTIER),
      etatQ1: etatDesChampsDuDevis(entrees, ['chantierNeufConso']),
      etatQ2: etatDesChampsDuDevis(entrees, ['chantierNeufTva']),
      /* 2b-3 (E-I6) : la question de la décennale a son état, comme les
         deux autres — une réponse refusée ne laisse pas « Non » choisi dans
         la carte sans « pas enregistré », pendant que la base compte
         « Oui ». */
      etatQ3: etatDesChampsDuDevis(entrees, ['engageDecennale']),
    });
  };

  /* Ce que « Mes devis » doit montrer de ce brouillon : UNE porte,
     `rangerDevis` d'`OpusApp`. */
  const ranger = (t = null) => {
    const f = fileRef.current;
    if (!f || !f.devisEnBase() || !rappels.current.onRanger) return;
    const d = devisRef.current;
    /* CE QUE LA BASE A, jamais ce que l'écran voudrait (ÉCRAN-F1) : un objet
       refusé, ou parti sans réponse, ne s'affiche pas dans « Mes devis ». */
    const enBase = f.entreesVoulues().find((x) => x.cle === 'devis');
    rappels.current.onRanger({
      ...devisPourMesDevis({ confirme: enBase ? enBase.confirme : null, local: d, client: clientAffiche }),
      id: f.devisId(), statut: 'brouillon', demande: d.demande || null, urgence: d.urgence || null,
      ...(t ? {
        totalHtCentimes: t.ht, totalTvaCentimes: t.tva, totalTtcCentimes: t.ttc,
        remiseHtCentimes: t.reduction ?? 0, acompteTtcCentimes: t.acompte ?? 0, totalTtcOptionsCentimes: t.ttcOptions ?? t.ttc,
      } : {}),
      ...(t && t.modifieLe ? { modifieLe: t.modifieLe } : {}),
    });
  };
  const rangerRef = useRef(ranger);
  useEffect(() => { rangerRef.current = ranger; });

  /* ------------------------------------------------------------------ */
  /*  LA LISTE « POUR LE REMETTRE » — lue par la base (lot 2b-1)          */
  /* ------------------------------------------------------------------ */
  /* AUCUN APPEL tant que le brouillon n'est pas en base : la fonction
     rendrait OP027 pour un devis qu'elle ne trouve pas, et « Réessayer » le
     rendrait à l'infini (critique E-2).

     LA MÊME GARDE QUE LES TOTAUX (`relire()`, file-ecriture.js) : la
     génération de la file est relevée au départ ; si une écriture est
     partie pendant la lecture, la réponse peut dater, et elle est ÉCARTÉE.
     L'écriture, une fois confirmée, relira les totaux, donc la liste ; si
     elle est refusée, rien ne relira — d'où la relecture quand la file a
     fini, si aucune autre n'est partie depuis. Un appel À CÔTÉ de la file,
     sans cette garde, écrasait une valeur plus récente (I3, lot 1).

     Elle ne touche que des références et des fonctions d'état : la
     version écoutée par la file depuis l'ouverture reste juste.

     `cause` : ce qui vient de changer — `'devis'` (une écriture du devis
     confirmée : la partie « Ce devis » se relit) ou `'entreprise'` (« Mon
     entreprise » refermée : la partie « Votre entreprise » se relit).
     Les causes S'AJOUTENT tant qu'aucune liste n'est revenue : une lecture
     en remplace une autre, pas ce que l'autre devait relire. Une cause, ou
     une liste de causes (les deux, au retour de « Mon entreprise »).
     « Réessayer » passe l'événement de l'appui, jamais l'une de ces deux
     chaînes. */
  const lireLaListe = (cause = null) => {
    const f = fileRef.current;
    if (!f || !f.devisEnBase()) return;
    lectureListe.current += 1;
    const n = lectureListe.current;
    const g = f.generation();
    /* LA RÉPONSE QUE LA BASE A VUE DANS CETTE PHOTO (2b-2) : celle des
       derniers totaux relus, s'ils l'ont été sous CETTE génération — sinon
       elle n'est pas connue (`undefined`), et la phrase de prudence se dit. */
    const t = totauxRef.current;
    const vue = t && t.demande && totauxGenRef.current === g ? pourQuiValable(t.demande) : undefined;
    const causes = Array.isArray(cause) ? cause : [cause];
    setListe((l) => ({
      ...l,
      erreur: null,
      enLecture: true,
      relecture: {
        devis: l.relecture.devis || causes.includes('devis'),
        entreprise: l.relecture.entreprise || causes.includes('entreprise'),
      },
    }));
    api.motifsRefusRemise(f.devisId())
      .then((motifs) => ({ motifs }), (erreur) => ({ erreur }))
      .then((r) => {
        if (!monte.current || n !== lectureListe.current || fileRef.current !== f) return;
        if (g !== f.generation()) {
          f.attendre(DELAI_ECRITURE).then(() => {
            if (monte.current && n === lectureListe.current) lireLaListe();
          });
          return;
        }
        /* UN ÉCHEC EFFACE LA LISTE : celle d'avant date d'avant l'écriture
           qui a lancé cette lecture, elle n'est plus sûre. L'écran dit
           « Liste non lue », jamais « rien ne manque ». La HAUTEUR de la
           ligne, elle, ne dépend d'aucune liste (`GABARITS_DE_LA_LIGNE`,
           devis.js) : rien n'est à garder pour elle. */
        const lues = !r.erreur && Array.isArray(r.motifs) ? r.motifs : null;
        /* Un échec garde la dernière réponse vue : elle ne sert qu'à
           comparer, et aucune liste ne s'affiche. */
        if (!r.erreur) reponseVueRef.current = vue;
        setListe((l) => (r.erreur
          ? {
            motifs: null, erreur: r.erreur, enLecture: false, relecture: AUCUNE_RELECTURE, reponseVue: l.reponseVue,
          }
          : {
            motifs: lues, erreur: null, enLecture: false, relecture: AUCUNE_RELECTURE, reponseVue: vue,
          }));
      });
  };

  /* ------------------------------------------------------------------ */
  /*  L'OUVERTURE — le devis lu en base, ou un brouillon neuf              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!devisIdInitial) return undefined;
    let vivant = true;
    let desabonner = null;
    const ecouter = (ev) => {
      if (!vivant) return;
      if (ev.type === 'etat') {
        setEtats((x) => ({ ...x, [ev.cle]: ev.etat }));
        /* LA PHRASE DE SON CHEMIN (point 3) : une ligne, une option et
           l'en-tête ne sont pas refusés par le plafond pour la même raison. */
        const ligne = ev.cle === 'devis' ? null : lignesRef.current.find((l) => l.id === ev.cle);
        const chemin = cheminDeLEcriture(ev.cle, ligne);
        setPhrasesEchec((x) => {
          const y = { ...x };
          if (ev.etat === 'echec') y[ev.cle] = messageDEcritureDuDevis(ev.erreur, chemin); else delete y[ev.cle];
          return y;
        });
        if (ev.cle !== 'devis') {
          poserDefinitif(ev.cle, ev.etat === 'echec' ? refusDeLaLigne({
            definitif: estUnRefusDefinitif(ev.erreur), devisEnBase: !!(fileRef.current && fileRef.current.devisEnBase()),
          }) : null);
        }
        /* UN RENVOI AUTOMATIQUE (le plafond, renvoyé tout seul) : s'il passe,
           on l'annonce — la phrase de ce qui est PARTI (une réduction retirée
           ne se dit pas « enregistrée », ÉCRAN-F3) ; s'il est refusé encore,
           rien ne vibre ni ne s'annonce : l'artisan n'a rien fait, la bande
           suffit (ÉCRAN-F2). Un refus TENU re-posé par la file non plus :
           l'objet, lui, vient d'être enregistré (ÉCRAN-F1). */
        const automatique = renvois.issue(fileRef.current, ev);
        if (automatique && ev.etat === 'enregistree') retour.annoncer(phraseDuRejeu(chemin, devisRef.current));
        if (echecASignaler({ etat: ev.etat, automatique, retenu: ev.retenu === true })) {
          retour.echec();
          retour.annoncer(ev.cle === 'devis'
            ? phraseEchecDuDevis({ enBase: !!(fileRef.current && fileRef.current.devisEnBase()), erreur: ev.erreur })
            : 'Une ligne n’a pas pu être enregistrée.');
        }
        if (ev.cle === 'devis' && ev.etat === 'enregistree') rangerRef.current();
      } else if (ev.type === 'totaux') {
        if (ev.totaux) {
          poserTotaux(ev.totaux);
          totauxGenRef.current = fileRef.current ? fileRef.current.generation() : null;
        }
        setTotauxIllisibles(false);
        rangerRef.current(ev.totaux);
        /* LA FILE EST AU REPOS, une écriture vient d'être confirmée (point 2) :
           ce que le plafond avait refusé repart, s'il passerait maintenant —
           une fois. Après l'événement, pas pendant : la file finit de le
           distribuer d'abord. */
        Promise.resolve().then(() => { if (vivant) rejouerLePlafond(); });
        /* …ET LA LISTE « POUR LE REMETTRE » SE RELIT (lot 2b-1), sous la
           même génération que ces totaux — la partie « Ce devis » se relit
           (ECR-1) : jusqu'au retour, la carte ne la montre pas. ET LA PARTIE
           « VOTRE ENTREPRISE » AUSSI quand la réponse « à quel titre » que la
           base a vue n'est plus celle de la dernière liste (2b-2, cahier
           §3.6) : les mentions dues à un particulier en dépendent. Avant la
           première liste, rien à comparer. */
        const vueNouvelle = ev.totaux ? pourQuiValable(ev.totaux.demande) : reponseVueRef.current;
        const changee = reponseVueRef.current !== undefined && vueNouvelle !== reponseVueRef.current;
        lireLaListe(changee ? ['devis', 'entreprise'] : 'devis');
      } else if (ev.type === 'totaux_illisibles') {
        setTotauxIllisibles(true);
      } else if (ev.type === 'renomme' && ev.quoi === 'ligne') {
        changerLignes((ls) => ls.map((l) => (l.id === ev.ancien ? { ...l, id: ev.nouveau } : l)));
        if (carteRef.current === ev.ancien) poserCarte(ev.nouveau);
      } else if (ev.type === 'supprimee' && ev.cle !== 'devis') {
        changerLignes((ls) => ls.filter((l) => l.id !== ev.cle));
        /* CE QUE LA FILE NE CONNAÎT PLUS N'A PLUS D'ÉTAT : une ligne refusée,
           puis retirée, restait « echec » dans l'état de l'écran — le pied
           comptait « 2 lignes non enregistrées » pour un devis dont toutes
           les lignes étaient en base (mesuré, reprise « écran » du lot 2a). */
        const sans = (x) => {
          const y = { ...x };
          delete y[ev.cle];
          return y;
        };
        setEtats(sans);
        setPhrasesEchec(sans);
        poserDefinitif(ev.cle, null);
      }
      majAttente();
    };
    (async () => {
      await null;
      let f;
      if (ouverture.devisId) {
        /* LA FILE DE CE DEVIS ÉCRIT PEUT-ÊTRE ENCORE (on l'a quitté par
           « Quitter sans elles », ou la garde n'a pas attendu la fin) : on
           attend qu'elle finisse AVANT de lire la base, et on le DIT. Une
           photo de la base prise pendant qu'elle écrit montrait l'ancien
           prix, cachait la ligne ajoutée, et l'artisan qui la retapait
           créait un doublon (relecture « données » des étapes 4 à 7, I2). */
        const existante = api.fileExistante(ouverture.devisId);
        if (existante && !existante.vide()) {
          setEtat('attente');
          await existante.attendre(DELAI_ECRITURE);
          if (!vivant) return;
        }
        let r;
        try {
          r = await api.unDevis(ouverture.devisId);
        } catch (e) {
          if (!vivant) return;
          /* RIEN N'EST AFFICHÉ : la phrase du réseau ne promet pas que « ce qui
             est déjà affiché reste lisible » (relecture « écran », C9). */
          setErreurLecture(e && e.baseEnRetard
            ? 'La base n’est pas encore à jour pour les devis : ce n’est pas que ce devis n’existe pas.'
            : messageClair(e, 'Ce devis', { rienAffiche: true }));
          setEtat('echec');
          return;
        }
        if (!vivant) return;
        if (!r) { setEtat('absent'); return; }
        f = api.fileDuDevis({
          devisId: r.devis.id, devis: r.devis, devisEnBase: true, lignesEnBase: r.lignes, horloge: r.devis.generation,
        });
        /* Ce que la file VEUT passe devant la photo de la base : une ligne
           encore en cours, en échec ou retirée y est telle que l'artisan l'a
           laissée — et sa rangée le DIT (son état vient de la file). */
        const vue = fusionnerAvecLaFile({ devis: r.devis, lignes: r.lignes }, f.entreesVoulues());
        changerDevis(vue.devis);
        /* Le TYPE et le SIRET de la fiche viennent avec (2b-2) : le bloc « À
           quel titre ? » ne PROPOSE « à titre privé » que pour un type LU. */
        if (r.devis.client) {
          setClientAffiche({ nom: r.devis.client.nom, type: r.devis.client.type ?? null, siret: r.devis.client.siret ?? null });
        }
        lignesRef.current = vue.lignes;
        setLignes(vue.lignes);
        r.lignes.forEach((l) => { derniereEnvoyee.current[l.id] = l; });
        poserTotaux({
          ht: r.devis.totalHtCentimes, tva: r.devis.totalTvaCentimes, ttc: r.devis.totalTtcCentimes,
          /* Les conditions telles que la BASE les a calculées (lot 2a). */
          reduction: r.devis.remiseHtCentimes ?? 0,
          brut: (r.devis.totalHtCentimes ?? 0) + (r.devis.remiseHtCentimes ?? 0),
          acompte: r.devis.acompteTtcCentimes ?? 0,
          ttcOptions: r.devis.totalTtcOptionsCentimes ?? r.devis.totalTtcCentimes,
          /* La demande que la base a vue, lue dans la MÊME photo que les
             totaux (relecture ÉCRAN-1 du lot 2a). */
          demande: demandeDuDevis(r.devis),
          ventilation: r.ventilation || [],
        });
      } else {
        f = api.fileDuDevis({ devisId: devisIdInitial, devis: devisRef.current, horloge: 0 });
      }
      if (!vivant) return;
      fileRef.current = f;
      desabonner = f.abonner(ecouter);
      /* La photo de l'ouverture est celle de la génération de départ — si la
         file n'écrit plus rien : sinon, la réponse vue attend les prochains
         totaux (2b-2). */
      if (ouverture.devisId && f.vide()) totauxGenRef.current = f.generation();
      setEtats(f.etats());
      /* UNE FILE QUI A SURVÉCU À L'ÉCRAN garde ses échecs : leurs phrases et
         ce qui est refusé définitivement se refont ici (point 1, par la porte
         de la réouverture). */
      const echecs = echecsDeLaFile(f.entreesVoulues().map((x) => ({ ...x, erreur: f.erreurDe(x.cle) })), {
        devisEnBase: f.devisEnBase(), estDefinitif: estUnRefusDefinitif, phraseDe: messageDEcritureDuDevis,
      });
      setPhrasesEchec(echecs.phrases);
      definitifsRef.current = echecs.definitifs;
      setDefinitifs(echecs.definitifs);
      majAttente();
      setEtat('pret');
      /* UN DEVIS DÉJÀ EN BASE : sa liste se lit à l'ouverture (critique
         E-2). Un brouillon neuf attend son premier enregistrement. */
      lireLaListe();
    })();
    return () => {
      vivant = false;
      if (desabonner) desabonner();
      /* La file est oubliée dès qu'elle n'a plus rien en vol — pas avant :
         une écriture partie finit, et rouvrir ce devis retrouve la MÊME. */
      if (fileRef.current) api.laisserFileDuDevis(fileRef.current.devisId());
    };
  }, [tentative]); // eslint-disable-line react-hooks/exhaustive-deps

  /* « MON ENTREPRISE » VIENT DE SE FERMER (lot 2b-1, critique E-1) : elle
     écrit par d'autres chemins que la file — la fiche, les assurances, les
     tarifs, la preuve VIES —, aucune écriture du devis ne relirait donc la
     liste. Sans ce signal, le médiateur choisi là restait signalé au
     retour : le geste central de la liste (voir, corriger, revenir)
     échouait pour tous les points de l'entreprise. La valeur de départ ne
     relit rien : l'ouverture s'en charge. */
  const retourEntrepriseVu = useRef(retourEntreprise);
  useEffect(() => {
    if (retourEntrepriseVu.current === retourEntreprise) return;
    retourEntrepriseVu.current = retourEntreprise;
    /* TOUJOURS LES DEUX CAUSES, une fois par retour (relecture 4 de 2b-1,
       06/11/2026) : « Votre entreprise » date d'avant ce qu'on vient
       peut-être d'y écrire, et « Ce devis » aussi — le régime de TVA, qui
       s'écrit là, décide de ses points (relecture 2, REL-2). Jusqu'au retour
       de la liste, la carte ne lit ni l'une ni l'autre (ECR-1 ; leur place
       est gardée, REL-3), et la ligne dit « Mise à jour de la liste… » :
       rien ne prouve qu'on y a changé quoi que ce soit (`phraseEnRoute`).
       Avant, la saisie comparait le régime de la liste et celui de l'écran
       pour ne relire « Ce devis » que s'il avait changé : cette comparaison
       courait après des lectures du régime en cours ou ratées, et se
       trompait dans deux courses (relecture 3, RELIRE3-2 et RELIRE3-3). La
       base calcule la liste avec SON régime : il suffit de relire. */
    lireLaListe(['devis', 'entreprise']);
  }, [retourEntreprise]); // eslint-disable-line react-hooks/exhaustive-deps

  /* LE CHAMP DE L'EN-TÊTE QUI PREND LE FOCUS — après le rendu qui a fermé
     la liste : la carte n'est plus par-dessus. */
  useEffect(() => {
    if (focusDemande && refEntete.current) refEntete.current.focusChamp(focusDemande.champ);
  }, [focusDemande]);

  /* ------------------------------------------------------------------ */
  /*  LE RÉGIME — cinq états, et un échec n'est JAMAIS « non déclaré »     */
  /* ------------------------------------------------------------------ */
  const regimeEnEchec = !!(regime && typeof regime === 'object' && regime.echec);
  const franchise = regime === 'franchise';
  const reel = regime === 'reel';
  const propositions = tauxProposes(regime);
  const coherence = coherenceRegime(lignes, regime);
  let avisRegime = null;
  if (regimeEnEchec) avisRegime = { type: 'echec' };
  else if (regime === null) {
    avisRegime = {
      type: 'non_declare',
      phrase: coherence || 'Votre régime de TVA n’est pas déclaré : Opus ne sait pas s’il faut ajouter la TVA. '
        + 'Déclarez-le dans « Mon entreprise ». En attendant, vous pouvez poser des titres et des réserves.',
    };
  } else if (coherence) avisRegime = { type: 'incoherent', phrase: coherence };

  /* Le taux d'une ligne neuve : aucun en franchise ; au régime réel, celui de
     la ligne DU MÊME TYPE qui la précède (rien de coché sur la première) ; et
     rien tant que le régime n'est pas connu.

     DU MÊME TYPE : un poste reprend le dernier POSTE, une option la dernière
     OPTION. Les options s'affichent à part, sous la liste : un poste ajouté
     après une option à 5,5 % naissait à 5,5 % pré-coché alors que le poste
     juste au-dessus de lui, à l'écran, était à 10 % — au régime réel, un taux
     pré-coché qu'on ne remarque pas est un taux faux sur le devis (relevé à
     l'étape 7, confirmé par la relecture « écran », B7). */
  const tauxPour = (avantOrdre, type = 'poste') => {
    if (franchise) return 0;
    if (!reel) return null;
    const precedentes = trierLignes(lignesRef.current)
      .filter((l) => l.type === type && (avantOrdre == null || Number(l.ordre) <= avantOrdre));
    const t = precedentes.length ? precedentes[precedentes.length - 1].tauxTvaCentiemes : null;
    return propositions && propositions.includes(t) ? t : null;
  };

  /* ------------------------------------------------------------------ */
  /*  ENREGISTRER — l'en-tête, une ligne                                   */
  /* ------------------------------------------------------------------ */
  /** `{ ok, refus }` — `refus` : les champs que l'écran a refusés, et ce
   *  qu'il en a dit. Les AUTRES partent quand même : un code postal faux
   *  n'emporte pas la rue et la ville tapées avec lui (le lieu part en
   *  bloc). */
  const enregistrerEntete = (changements, { vibrer = true } = {}) => {
    const f = fileRef.current;
    if (!f) return { ok: false, refus: {} };
    const avant = devisRef.current;
    let recevables = { ...changements };
    const refus = {};
    for (let i = Object.keys(changements).length; i >= 0; i -= 1) {
      const v = validerDevis({ ...avant, ...recevables });
      if (v.ok) break;
      /* Le refus vise un champ que cette écriture ne porte PAS (une paire
         écrite à moitié, un état déjà refusé) : rien ne part, et CHAQUE champ
         jeté le DIT. Avant le lot 2a, la boucle vidait l'écriture et rendait
         `ok: true` — l'écriture disparaissait en silence (cahier §2.4). */
      if (!Object.prototype.hasOwnProperty.call(recevables, v.champ)) {
        Object.keys(recevables).forEach((k) => { refus[k] = messageDeContrainte(v.contrainte); });
        recevables = {};
        break;
      }
      refus[v.champ] = messageDeContrainte(v.contrainte);
      delete recevables[v.champ];
    }
    poserRefusEntete(Object.keys(changements), refus);
    const ok = Object.keys(refus).length === 0;
    /* La carte « Conditions » décide elle-même de vibrer (ÉCRAN-13) : elle
       sait quel champ on vient de quitter. */
    if (!ok && vibrer) retour.echec();
    /* Ce que la base rangerait (blancs retirés, code postal sans espaces),
       comparé à ce qu'elle a : seul ce qui CHANGE part. */
    const net = nettoyerDevis({ ...avant, ...recevables });
    const diff = {};
    Object.keys(recevables).forEach((k) => {
      const nouveau = net[k] === undefined ? null : net[k];
      const ancien = avant[k] === undefined ? null : avant[k];
      if (!Object.is(nouveau, ancien)) diff[k] = nouveau;
    });
    if (!Object.keys(diff).length) return { ok, refus };
    changerDevis({ ...avant, ...diff });
    /* UN BROUILLON NE NAÎT QU'AU PREMIER GESTE : un champ quitté VIDE sur un
       devis qui n'existe pas encore ne crée rien. */
    if (f.etatDe('devis') === 'locale' && !f.devisEnBase() && !Object.values(diff).some((x) => x != null)) return { ok, refus };
    f.devis(diff);
    /* L'état « en route » de « À quel titre » et du chantier se lit tout de
       suite (2b-2) : il ne dépend que de la file. */
    majAttente();
    return { ok, refus };
  };

  const enregistrerLigne = (valeurs, erreursSaisie = {}) => {
    const f = fileRef.current;
    if (!f || !valeurs || !valeurs.id) return false;
    changerLignes((ls) => ls.map((l) => (l.id === valeurs.id ? { ...valeurs } : l)));
    const premier = Object.keys(erreursSaisie || {})[0];
    if (premier) {
      poserErreur(valeurs.id, { champ: premier, message: erreursSaisie[premier] });
      f.marquerLocale(valeurs.id, valeurs);
      return false;
    }
    const v = validerLigne(valeurs);
    if (!v.ok) {
      /* La phrase de la contrainte que la base citerait — et, pour un champ
         simplement MANQUANT, lequel. Aucune requête ne part. */
      const message = v.contrainte === 'devis_ligne_forme_check' && MANQUE[v.champ]
        ? MANQUE[v.champ] : messageDeContrainte(v.contrainte);
      poserErreur(valeurs.id, { champ: v.champ, message });
      if (!ligneVierge(valeurs)) f.marquerLocale(valeurs.id, valeurs);
      return false;
    }
    poserErreur(valeurs.id, null);
    /* UNE LIGNE REFUSÉE DÉFINITIVEMENT, INCHANGÉE, NE REPART PAS (point 1) :
       fermer sa carte la renvoyait telle quelle, et la base la refusait
       pareil (mesuré). Changée, elle part. Une ligne en échec NON définitif
       (le réseau, un interblocage), inchangée, repart : c'est la file qui la
       tient pour un RENVOI et le marque (file-ecriture.js, point 18 ;
       relecture 7, RELIRE6-1) — la ligne « Pour le remettre » garde sa
       place, comme pour « Réessayer ». */
    if (!renvoyerLaLigne({
      valeurs, derniere: derniereEnvoyee.current[valeurs.id], etat: f.etatDe(valeurs.id), refus: definitifsRef.current[valeurs.id],
    })) return false;
    derniereEnvoyee.current[valeurs.id] = valeurs;
    f.ligne(valeurs);
    return true;
  };

  /* LES CONDITIONS (lot 2a) : ce qui se lit part par l'en-tête — les PAIRES
     entières, en une écriture —, ce qui ne se lit pas est REFUSÉ par
     l'écran, avec sa phrase, et la garde le saura.

     Trois règles de la relecture du lot 2a :
       - LA CARTE EST RELUE ENTIÈRE à chaque fois : ses refus repartent de
         zéro — les DEUX clés de chaque paire, et tous ses autres champs
         (ÉCRAN-6). Sinon une réduction refusée en euros, puis retapée en
         pour cent, laissait ses deux refus : la bande disait « « Réduction »,
         « Réduction » », avec le message des euros sous un champ en % ;
       - les TEXTES et les CHOIX de la carte sont gardés tant qu'une valeur
         est refusée — par l'écran (une saisie illisible) OU par
         `enregistrerEntete` (ÉCRAN-5) : « Corriger » la rouvre telle qu'on
         l'a laissée (ÉCRAN-3, ÉCRAN-4) ;
       - on ne vibre que pour la faute du champ, ou de la pastille, qu'on
         VIENT de toucher (`geste`, ÉCRAN-13). */
  const enregistrerConditions = (changements, erreursSaisie = {}, textes = null, geste = 'fermer') => {
    const fautes = Object.keys(erreursSaisie || {});
    /* Les fautes DÉJÀ dites, avant ce geste : une faute nouvelle vibre une
       fois, même à la fermeture (`vibrerPourLaCarte`). */
    const deja = CHAMPS_CONDITIONS.filter((k) => refusEntete.current[k]);
    poserRefusEntete(CHAMPS_CONDITIONS);
    const r = enregistrerEntete(changements, { vibrer: false });
    if (fautes.length) {
      poserRefusEntete([], Object.fromEntries(fautes.map((k) => [k, erreursSaisie[k]])));
    }
    const refusees = [...fautes, ...Object.keys(r.refus || {})];
    setTextesConditions(refusees.length ? textes : null);
    if (vibrerPourLaCarte(geste, refusees, deja)) retour.echec();
    return r;
  };

  /* La carte ouverte : lue, puis enregistrée — ou oubliée si elle n'a jamais
     rien été. */
  const enregistrerCarte = () => {
    const id = carteRef.current;
    if (id === CARTE_CONDITIONS) {
      if (refConditions.current) refConditions.current.enregistrer();
      return;
    }
    /* La liste « Pour le remettre » ne porte aucun champ : rien à lire. La
       carte « Le chantier » non plus : chaque pastille écrit à l'appui. */
    if (id === CARTE_POUR_REMETTRE || id === CARTE_CHANTIER) return;
    if (!id || !refCarte.current) return;
    const lu = refCarte.current.lire();
    const f = fileRef.current;
    if (ligneVierge(lu.valeurs) && !(f && f.etatDe(id))) {
      changerLignes((ls) => ls.filter((l) => l.id !== id));
      poserErreur(id, null);
      return;
    }
    enregistrerLigne(lu.valeurs, lu.erreurs);
  };

  const titreDeLaCarte = (id) => {
    const l = lignesRef.current.find((x) => x.id === id);
    if (!l) return null;
    if (l.type === 'piece') return l.designation || 'Pièce';
    const p = pieceDeLaLigne(lignesRef.current, id);
    return p ? (p.designation || 'Pièce') : 'Ligne du devis';
  };

  /* LA MÉMOIRE, demandée à la première carte chiffrée. UN ÉCHEC SE DIT, et se
     redemande : une mémoire illisible rendait `[]` sans un mot, et ne se
     relisait plus de la session — l'artisan croyait n'avoir jamais écrit
     ce prix (relecture « écran » des étapes 4 à 7, C3). */
  const demanderMemoire = () => {
    memoireDemandee.current = true;
    setMemoire(null);
    api.memoireDesLignes().then((ls) => setMemoire(ls || [])).catch(() => setMemoire('echec'));
  };

  const ouvrirCarte = (id) => {
    if (carteRef.current && carteRef.current !== id) enregistrerCarte();
    /* Ouverte ici, la carte revient au devis ; c'est la liste qui dit le
       contraire, APRÈS cet appel (`agirSurLePoint`). */
    poserRetour(null);
    /* Le lieu tapé sans suggestion s'enregistre à l'ouverture d'une carte. */
    if (refEntete.current) refEntete.current.enregistrer();
    const l = lignesRef.current.find((x) => x.id === id);
    if (l && TYPES_CHIFFRES.includes(l.type) && !memoireDemandee.current) demanderMemoire();
    /* LA BASE DE POSTES, une fois par session, à la première carte
       chiffrée — sauf si « Ma base de postes » l'a déjà lue. Une lecture
       ratée ne se redemande pas toute seule : « Réessayer », sous la
       désignation. */
    if (l && TYPES_CHIFFRES.includes(l.type) && postesEtat === 'vide' && onChargerPostes) onChargerPostes();
    poserCarte(id);
    setCleCarte((k) => k + 1);
    if (rappels.current.onCarte) rappels.current.onCarte(titreDeLaCarte(id));
  };

  const fermerCarte = () => {
    enregistrerCarte();
    poserCarte(null);
    if (rappels.current.onCarte) rappels.current.onCarte(null);
    /* OUVERTE DEPUIS LA LISTE « POUR LE REMETTRE », la carte y RAMÈNE
       (critique E-13) : on revient voir le point suivant, pas le haut du
       devis. Une fois. */
    const vers = retourRef.current;
    poserRetour(null);
    if (vers === CARTE_POUR_REMETTRE) ouvrirPourRemettre();
  };

  /* La carte « Conditions » : la carte ouverte s'enregistre d'abord, comme
     pour une ligne. */
  const ouvrirConditions = () => {
    if (carteRef.current && carteRef.current !== CARTE_CONDITIONS) enregistrerCarte();
    if (refEntete.current) refEntete.current.enregistrer();
    poserRetour(null);
    setChampConditions(null);
    poserCarte(CARTE_CONDITIONS);
    setCleCarte((k) => k + 1);
    if (rappels.current.onCarte) rappels.current.onCarte('Conditions');
  };

  /* « CONDITIONS », OUVERTE DEPUIS LA LISTE SUR UN CHAMP (lot 2b-1) : la
     validité, la nature de l'acompte, l'acompte ou la réduction. Mesuré, la
     validité était à y = 1 132 à l'ouverture — hors de l'écran sur les trois
     tailles (critique E-13). « ‹ » ramène à la liste. */
  const ouvrirConditionsSur = (champ) => {
    ouvrirConditions();
    setChampConditions(champ || null);
    poserRetour(CARTE_POUR_REMETTRE);
  };

  /* LA LISTE « POUR LE REMETTRE » (lot 2b-1). Ce qui est tapé dans
     l'en-tête sans avoir quitté le champ part d'abord — un délai tapé, puis
     un appui sur la ligne du haut : `CLAVIER` garde le clavier ouvert sur un
     appui, le champ ne perd pas le focus, et la liste dirait « le délai
     manque » devant un délai écrit. Le clavier se ferme : il n'y a rien à
     écrire dans cette carte. */
  const ouvrirPourRemettre = () => {
    if (carteRef.current && carteRef.current !== CARTE_POUR_REMETTRE) enregistrerCarte();
    if (refEntete.current) refEntete.current.enregistrer();
    Keyboard.dismiss();
    poserRetour(null);
    poserCarte(CARTE_POUR_REMETTRE);
    setCleCarte((k) => k + 1);
    if (rappels.current.onCarte) rappels.current.onCarte(TITRE_POUR_REMETTRE);
  };

  /* « LE CHANTIER » (lot 2b-2, cahier §3.5) — une carte comme
     « Conditions » : la carte ouverte s'enregistre d'abord, ce qui est tapé
     dans l'en-tête part, et le clavier se ferme — il n'y a rien à écrire.
     Ouverte depuis la liste (« Revoir « Le chantier » »), elle y ramène. */
  const ouvrirChantier = () => {
    if (carteRef.current && carteRef.current !== CARTE_CHANTIER) enregistrerCarte();
    if (refEntete.current) refEntete.current.enregistrer();
    Keyboard.dismiss();
    poserRetour(null);
    setQuestionChantier(null);
    poserCarte(CARTE_CHANTIER);
    setCleCarte((k) => k + 1);
    if (rappels.current.onCarte) rappels.current.onCarte(LE_CHANTIER.titre);
  };
  /* OUVERTE DEPUIS UN POINT (2b-3, E-I1) : la carte s'ouvre SUR la question
     que vise le point — la TVA (`q2`) pour une ligne à taux réduit d'un
     chantier neuf, la décennale (`q3`) pour une réponse vide. Sans elle,
     la troisième question tombait sous le pli sur les trois tailles. */
  const ouvrirChantierDepuisLaListe = (question = null) => {
    ouvrirChantier();
    setQuestionChantier(question === 'q2' || question === 'q3' ? question : null);
    poserRetour(CARTE_POUR_REMETTRE);
  };
  /* Une pastille de la carte : `{ chantierNeufConso: false }`,
     `{ chantierNeufTva: … }`, `{ engageDecennale: … }` (2b-3) — par la file
     de l'en-tête. La décennale n'a PAS de confirmation : la réponse se dit
     par devis, son défaut est le cas protecteur. */
  const repondreChantier = (changements) => { enregistrerEntete(changements); };
  /* Le « Oui » à la première question RETIRE des protections au client : il
     se confirme, par la feuille posée par-dessus la carte (l'état unique
     `feuille`). Rien n'est écrit avant « Je confirme ». */
  const demanderConfirmationChantier = () => setFeuille({ type: 'chantier_neuf' });
  const confirmerChantierNeuf = () => {
    setFeuille(null);
    enregistrerEntete({ chantierNeufConso: true });
  };

  /* ------------------------------------------------------------------ */
  /*  AJOUTER, DÉPLACER, RETIRER                                          */
  /* ------------------------------------------------------------------ */
  /* Les ordres refaits de 1 000 en 1 000 quand il n'y a plus de place : UN
     ordre = UNE ligne (le contrat de la file), chacune par son
     enregistrement. */
  const renumeroterTout = () => {
    const nums = renumeroter(lignesRef.current);
    nums.forEach(({ id, ordre }) => {
      const l = lignesRef.current.find((x) => x.id === id);
      if (!l || Number(l.ordre) === ordre) return;
      const v = { ...l, ordre };
      if (validerLigne(v).ok && fileRef.current && fileRef.current.etatDe(id)) enregistrerLigne(v);
      else changerLignes((ls) => ls.map((x) => (x.id === id ? v : x)));
    });
  };

  const inserer = (type, apresId) => {
    const id = nouvelIdentifiant();
    if (!id) { if (rappels.current.onErreur) rappels.current.onErreur(IDENTIFIANT_IMPOSSIBLE); return null; }
    const calculer = () => {
      const tri = trierLignes(lignesRef.current);
      if (!apresId) return ordreEntre(ordreMax(tri), null);
      const i = tri.findIndex((x) => x.id === apresId);
      if (i < 0) return ordreEntre(ordreMax(tri), null);
      return ordreEntre(Number(tri[i].ordre), i + 1 < tri.length ? Number(tri[i + 1].ordre) : null);
    };
    let ordre = calculer();
    if (ordre == null) { renumeroterTout(); ordre = calculer(); }
    const l = ligneNeuve(type, id, ordre, tauxPour(ordre, type));
    changerLignes((ls) => [...ls, l]);
    return id;
  };

  const ajouter = (type) => {
    if (carteRef.current) enregistrerCarte();
    const id = inserer(type, null);
    if (id) ouvrirCarte(id);
  };

  const posteSuivant = () => {
    const actuelle = carteRef.current;
    const l = lignesRef.current.find((x) => x.id === actuelle);
    enregistrerCarte();
    const id = inserer(l && l.type === 'option' ? 'option' : 'poste', actuelle);
    if (id) ouvrirCarte(id);
  };

  const posteDansPiece = () => {
    const pieceId = carteRef.current;
    enregistrerCarte();
    const contenu = lignesDeLaPiece(lignesRef.current, pieceId);
    const id = inserer('poste', contenu.length ? contenu[contenu.length - 1].id : pieceId);
    if (id) ouvrirCarte(id);
  };

  const deplacer = (sens) => {
    const id = carteRef.current;
    if (!id || !refCarte.current) return;
    const lu = refCarte.current.lire();
    changerLignes((ls) => ls.map((x) => (x.id === id ? lu.valeurs : x)));
    const calcul = sens < 0 ? monter : descendre;
    let r = calcul(lignesRef.current, id);
    if (r && r.renumeroter) { renumeroterTout(); r = calcul(lignesRef.current, id); }
    if (!r || r.ordre == null) return;
    const courante = lignesRef.current.find((x) => x.id === id);
    enregistrerLigne({ ...courante, ordre: r.ordre }, lu.erreurs);
  };

  const retirer = (avecLignes) => {
    const id = carteRef.current;
    const f = fileRef.current;
    const ids = avecLignes ? [id, ...lignesDeLaPiece(lignesRef.current, id).map((l) => l.id)] : [id];
    poserCarte(null);
    if (rappels.current.onCarte) rappels.current.onCarte(null);
    /* Une ligne ouverte depuis la liste « Pour le remettre », puis retirée :
       on revient à la liste, comme par « ‹ ». */
    const vers = retourRef.current;
    poserRetour(null);
    ids.forEach((x) => {
      /* Une ligne jamais envoyée disparaît sans requête ; une ligne en base
         part par la file — et tant que sa suppression n'est pas faite, le
         pied la compte. */
      if (f && f.etatDe(x)) f.retirerLigne(x);
      changerLignes((ls) => ls.filter((l) => l.id !== x));
      poserErreur(x, null);
      delete derniereEnvoyee.current[x];
    });
    majAttente();
    if (vers === CARTE_POUR_REMETTRE) ouvrirPourRemettre();
    /* RETIRER UNE LIGNE REFUSÉE N'ÉCRIT RIEN (elle n'a jamais été en base) :
       aucune écriture confirmée, donc aucune relecture des totaux, et la
       réduction refusée à cause d'elle restait refusée. Retirer peut faire
       tenir le devis : on regarde tout de suite (point 2). */
    rejouerLePlafond();
  };

  /* Ce que dit le second appui de « Retirer » sur un titre. */
  const retraitDe = (l) => {
    if (!l || !NIVEAU[l.type]) return null;
    const contenu = lignesDeLaPiece(lignes, l.id);
    const n = contenu.length;
    if (!n) return { nb: 0, phrase: null };
    const nom = l.type === 'piece' ? 'pièce' : 'zone';
    const debut = n > 1 ? `Les ${n} lignes de cette ${nom}` : `La ligne de cette ${nom}`;
    const verbe = n > 1 ? 'passeront' : 'passera';
    const recoit = titreQuiRecoit(lignes, l.id);
    if (recoit) return { nb: n, phrase: `${debut} ${verbe} dans « ${recoit.designation || 'sans titre'} ».` };
    const tri = trierLignes(lignes);
    const i = tri.findIndex((x) => x.id === l.id);
    const zone = l.type === 'piece' ? tri.slice(0, i).reverse().find((x) => NIVEAU[x.type]) : null;
    if (zone && zone.type === 'zone') {
      return { nb: n, phrase: `${debut} ${n > 1 ? 'resteront' : 'restera'} dans « ${zone.designation || 'la zone'} », sans pièce.` };
    }
    return { nb: n, phrase: `${debut} ${verbe} en tête du devis, sans ${nom}.` };
  };

  /* ------------------------------------------------------------------ */
  /*  POUR QUI ?                                                          */
  /* ------------------------------------------------------------------ */
  const choisirClient = (fiche) => {
    setFeuille(null);
    if (!fiche || !fiche.id) return;
    setClientAffiche({
      nom: fiche.nom, ville: fiche.ville || null, type: fiche.type ?? null, siret: fiche.siret ?? null,
    });
    const changements = { clientId: fiche.id };
    const lieu = refEntete.current ? refEntete.current.lire() : {};
    const lieuVide = !texteNet(lieu.lieuAdresse) && !texteNet(lieu.lieuCodePostal) && !texteNet(lieu.lieuVille);
    /* Le lieu VIDE prend l'adresse du client — PROPOSÉE, jamais imposée, et
       jamais par-dessus un lieu déjà tapé. */
    if (lieuVide && (fiche.adresse || fiche.codePostal || fiche.ville)) {
      const copie = devisDepuisClient(fiche);
      if (refEntete.current) refEntete.current.poserLieu(copie);
      Object.assign(changements, {
        lieuAdresse: copie.lieuAdresse, lieuCodePostal: copie.lieuCodePostal, lieuVille: copie.lieuVille,
      });
      setPhraseLieu('Adresse du client reprise : modifiez-la si le chantier est ailleurs.');
    }
    enregistrerEntete(changements);
  };

  const ouvrirChoixClient = () => {
    if (clientsEtat === 'vide' || clientsEtat === 'echec') onChargerClients();
    setFeuille({ type: 'client' });
  };

  const nouveauClient = () => {
    setFeuille(null);
    const depuis = ouverture.demandeSource ? clientDepuisDemande(ouverture.demandeSource) : null;
    if (rappels.current.onNouveauClient) rappels.current.onNouveauClient(depuis, choisirClient);
  };

  /* ------------------------------------------------------------------ */
  /*  À QUEL TITRE ? (lot 2b-2, cahier §3.4)                              */
  /* ------------------------------------------------------------------ */
  /* « Répondre », « Autre réponse », « Changer » et le bouton du point
     `devis_pour_qui` ouvrent LA MÊME feuille, par l'état unique `feuille`
     (critique écran E-I11). Le clavier se ferme : il n'y a rien à écrire. */
  const ouvrirAQuelTitre = () => {
    Keyboard.dismiss();
    setFeuille({ type: 'pour_qui' });
  };
  /* LA PAIRE, en une écriture : la réponse ET le client pour lequel elle est
     donnée — l'identifiant lu À L'INSTANT de l'appui, jamais celui de
     l'affichage (critique écran E-M8). Sans client, rien ne part. */
  const ecrireAQuelTitre = (valeur) => {
    const clientId = devisRef.current ? devisRef.current.clientId : null;
    if (!clientId || !valeur) return;
    enregistrerEntete({ pourQui: valeur, pourQuiClient: clientId });
  };
  const choisirAQuelTitre = (valeur) => {
    setFeuille(null);
    ecrireAQuelTitre(valeur);
  };
  /* « Oui, à titre privé » : le SEUL bouton qui écrit sans feuille, et
     seulement quand la fiche LUE est « particulier » (décision du 09/11 :
     Opus propose, l'artisan confirme). */
  const ouiATitrePrive = () => ecrireAQuelTitre('consommateur');

  /* ------------------------------------------------------------------ */
  /*  « POUR LE REMETTRE » — chaque point mène à son endroit (lot 2b-1)   */
  /* ------------------------------------------------------------------ */
  /* L'endroit vient de `endroitDuMotif` (devis.js) ; l'écran ne fait que
     l'exécuter :
       - le client : la feuille « Pour qui ? » se pose PAR-DESSUS la liste
         (elle n'est pas une `Modal`) — choisir écrit, et la liste se relit ;
       - une ligne fautive, ou un premier poste : sa carte, et « ‹ » ramène
         à la liste ;
       - le délai, le lieu : la liste se ferme et le champ prend le focus ;
       - une condition : la carte « Conditions » ouverte SUR son champ ;
       - l'entreprise : « Mon entreprise » sur SA section — un bouton par
         point (critique E-8) ; sa fermeture relit la liste. */
  const agirSurLePoint = (point) => {
    const e = point && point.endroit;
    if (!e) return;
    switch (e.endroit) {
      case 'client':
        ouvrirChoixClient();
        return;
      case 'pour_qui':
        /* LA CARTE SE FERME et la feuille « À quel titre ? » s'ouvre (cahier
           §3.6) : la réponse change le bloc de l'en-tête, qu'on revoit. */
        poserRetour(null);
        poserCarte(null);
        if (rappels.current.onCarte) rappels.current.onCarte(null);
        ouvrirAQuelTitre();
        return;
      case 'entreprise':
        if (e.section && onMonEntreprise) onMonEntreprise(e.section);
        return;
      case 'conditions':
        ouvrirConditionsSur(e.champ);
        return;
      case 'ligne':
        if (!lignesRef.current.some((l) => String(l.id) === String(e.ligneId))) return;
        ouvrirCarte(e.ligneId);
        poserRetour(CARTE_POUR_REMETTRE);
        return;
      case 'lignes': {
        if (!(Array.isArray(propositions) && propositions.length > 0)) return;
        if (carteRef.current) enregistrerCarte();
        const id = inserer('poste', null);
        if (!id) return;
        ouvrirCarte(id);
        poserRetour(CARTE_POUR_REMETTRE);
        return;
      }
      case 'lieu':
      case 'delai':
        poserCarte(null);
        if (rappels.current.onCarte) rappels.current.onCarte(null);
        setFocusDemande((x) => ({ champ: e.endroit, n: ((x && x.n) || 0) + 1 }));
        return;
      default:
    }
  };
  /* LE SECOND BOUTON D'UN POINT (2b-2) : « Revoir « Le chantier » » sur une
     ligne à taux réduit d'un chantier neuf — la carte, qui ramène à la
     liste. 2b-3 : « Répondre dans « Le chantier » » sur la décennale sans
     réponse ; chacun ouvre la carte SUR sa question (`secondeActionDuPoint`
     la dit). */
  const agirAussiSurLePoint = (point, seconde) => {
    if (seconde && seconde.endroit === 'chantier') ouvrirChantierDepuisLaListe(seconde.question || null);
  };

  /* ------------------------------------------------------------------ */
  /*  LA BASE DE POSTES — les deux feuilles que la carte demande          */
  /* ------------------------------------------------------------------ */
  /* « Ajouter à ma base » : ce que la feuille PROPOSE vient de la ligne
     (`posteDepuisLaLigne` : la phrase, l'unité, la fourniture, la
     main-d'œuvre et son prix comme prix de référence — jamais « Offert »,
     jamais la quantité, jamais le taux). Le lien d'origine n'est posé que
     si le devis est DÉJÀ en base à cet instant : aucune attente de la file. */
  const demanderAjout = (valeurs) => {
    const f = fileRef.current;
    /* L'AVERTISSEMENT D'UN NOM DE CLIENT LIT LA FICHE DU CARNET — encore
       faut-il que le carnet soit lu : un devis rouvert depuis « Mes devis »
       ne le charge pas (relecture « textes », TEXTES9). On le demande ici,
       comme « Pour qui ? » ; la feuille se met à jour quand il arrive. */
    if (devis.clientId && (clientsEtat === 'vide' || clientsEtat === 'echec')) onChargerClients();
    setFeuille({
      type: 'ajout',
      valeurs: posteDepuisLaLigne(valeurs),
      devisOrigineId: f && f.devisEnBase() ? f.devisId() : null,
    });
  };
  /* La feuille d'un poste, PAR-DESSUS la carte : changer sa référence ne
     quitte pas la saisie. */
  const demanderPoste = (poste, prixPropose = null) => {
    if (poste) setFeuille({ type: 'poste', poste, prixPropose });
  };
  const relirePostes = () => (onChargerPostes ? onChargerPostes() : Promise.resolve(null));

  /* ------------------------------------------------------------------ */
  /*  LA SUPPRESSION, LES TOTAUX                                           */
  /* ------------------------------------------------------------------ */
  const supprimer = async () => {
    if (!confirmeSuppression) { setConfirmeSuppression(true); return; }
    const f = fileRef.current;
    if (!f) return;
    const id = f.devisId();
    try {
      await f.supprimerDevis();
      retour.reussite();
      if (rappels.current.onSupprime) rappels.current.onSupprime(id);
    } catch (e) {
      retour.echec();
      setConfirmeSuppression(false);
      if (rappels.current.onErreur) rappels.current.onErreur(messageClair(e, 'Ce brouillon n’a pas pu être supprimé'));
    }
  };

  /* « RELIRE » PASSE PAR LA FILE : sa réponse est jetée si une écriture part
     entre-temps (la génération), et elle arrive par l'événement `totaux` —
     appelée à côté, une relecture partie AVANT une écriture écrasait le
     total plus récent (relecture « données » des étapes 4 à 7, I3). */
  const relireTotaux = () => {
    const f = fileRef.current;
    if (f) f.relireLesTotaux();
  };

  /* ------------------------------------------------------------------ */
  /*  LA GARDE DE SORTIE                                                  */
  /* ------------------------------------------------------------------ */
  /* Ce qui n'est pas en base, après qu'on a tout lu et tout envoyé — et ce
     que l'écran a REFUSÉ dans l'en-tête, qui n'est parti nulle part. Les
     lignes « en cours » (l'envoi continue) et « en échec » (refusées, ou
     sans réponse) ne se disent pas pareil : quitter ne fait pas le même
     effet aux unes et aux autres. */
  const bilan = () => {
    const f = fileRef.current;
    const enteteRefuse = Object.keys(refusEntete.current);
    if (!f) {
      return {
        ok: !enteteRefuse.length, incompletes: [], enCours: 0, enEchec: 0, nonEnregistrees: 0, devisEnEchec: false, enteteRefuse,
      };
    }
    const e = f.etats();
    const incompletes = lignesRef.current
      .filter((l) => !ligneVierge(l) && (erreursRef.current[l.id] || e[l.id] === 'locale'))
      .map((l) => l.id);
    const enCours = Object.keys(e).filter((id) => e[id] === 'en_cours').length;
    const enEchec = Object.keys(e).filter((id) => e[id] === 'echec').length;
    const etatEntete = f.etatDe('devis');
    const devisEnEchec = ['en_cours', 'echec'].includes(etatEntete);
    /* La phrase de l'en-tête qui n'est pas en base : refusé (le champ, et ce
       qui reste tenu à part), ou encore en route. */
    let entete = null;
    if (etatEntete === 'echec') {
      entete = phraseEchecDuDevis({ enBase: f.devisEnBase(), erreur: f.erreurDe('devis'), retenue: f.retenueDe('devis') });
    } else if (etatEntete === 'en_cours') entete = ENTETE_EN_COURS;
    const { phrase, quitter } = bilanDeLaGarde({ enEchec, enCours, entete });
    return {
      ok: !incompletes.length && !enCours && !enEchec && !devisEnEchec && !enteteRefuse.length,
      incompletes, enCours, enEchec, nonEnregistrees: enCours + enEchec, devisEnEchec, enteteRefuse, texte: phrase, quitter,
    };
  };

  /** Tout lire (la carte ouverte — une ligne ou les conditions —, l'en-tête), tout envoyer, et
   *  attendre la file — huit secondes au plus. `pendantLAttente` : appelé
   *  AVANT d'attendre, si la file a quelque chose en vol. */
  const enregistrerTout = async ({ pendantLAttente = null } = {}) => {
    /* On PART : une carte ouverte depuis la liste ne la rouvre pas — la
       garde se dit à l'écran, jamais sous une carte. */
    poserRetour(null);
    if (carteRef.current) fermerCarte();
    if (refEntete.current) refEntete.current.enregistrer();
    const f = fileRef.current;
    if (f && !f.vide() && pendantLAttente) pendantLAttente();
    if (f) await f.attendre(DELAI_ECRITURE);
    return bilan();
  };

  const nonEnregistrees = () => bilan();

  const sortir = async ({ parLeRetour = false } = {}) => {
    /* Carte ouverte, le RETOUR ferme la carte (elle s'enregistre) au lieu de
       quitter l'écran. */
    if (parLeRetour && carteRef.current) { fermerCarte(); return false; }
    /* La feuille ouverte se ferme : rien n'y a été écrit, il n'y a rien à
       dire. Une requête déjà partie finit, et se dit. */
    setFeuille(null);
    /* Une bande déjà affichée (un second appui sur la barre du bas) : la
       première demande répond « on reste », la seconde prend la place. Sans
       ça, la première attendrait pour toujours. */
    const avant = gardeRef.current;
    if (avant && avant.resoudre) avant.resoudre(false);
    return new Promise((resoudre) => {
      const jeton = {};
      let repondu = false;
      const repondre = (quitter) => {
        if (repondu) return;
        repondu = true;
        if (gardeRef.current && gardeRef.current.jeton === jeton) poserGarde(null);
        resoudre(quitter);
      };
      /* L'APPUI SE VOIT TOUT DE SUITE : si la file écrit encore, la bande
         « Enregistrement avant de partir… » paraît AU MOMENT de l'appui, avec
         « Rester ». Avant, l'écran restait identique jusqu'à huit secondes,
         le doigt doutait, et l'on ré-appuyait (relecture « écran » des étapes
         4 à 7, B4). « Quitter sans attendre » n'est PAS proposé : une écriture
         qui échoue derrière un écran parti ne se dirait à personne — la bande
         suivante, au bout de l'attente, laisse partir EN LE SACHANT. */
      const enAttente = () => {
        if (repondu) return;
        retour.annoncer('Enregistrement avant de partir.');
        poserGarde({
          jeton, resoudre: repondre, phase: 'attente', incompletes: [], enteteRefuse: [], enCours: 0, enEchec: 0,
        });
      };
      enregistrerTout({ pendantLAttente: enAttente }).then((r) => {
        if (repondu) return;
        if (r.ok) { repondre(true); return; }
        retour.avertissement();
        poserGarde({ ...r, jeton, resoudre: repondre, phase: 'bilan' });
      });
    });
  };

  /* LES RANGÉES SONT MÉMORISÉES : elles reçoivent des rappels STABLES, qui
     appellent la version du dernier rendu (sinon chaque rangée se croirait
     différente à chaque frappe, et toute la liste se redessinerait). */
  const actions = useRef({});
  useEffect(() => { actions.current = { ouvrirCarte }; });
  const ouvrirStable = useCallback((id) => actions.current.ouvrirCarte(id), []);
  const reessayerStable = useCallback((id) => { if (fileRef.current) fileRef.current.reessayer(id); }, []);

  /* L'écran S'INSCRIT auprès d'`OpusApp` (sa référence `gardeSortie`), et se
     désinscrit en partant : `OpusApp` ne peut pas lire ce qui est tapé dans
     un champ qu'il ne voit pas. */
  useEffect(() => {
    if (!onGarde) return undefined;
    onGarde({ sortir, enregistrerTout, nonEnregistrees });
    return () => onGarde(null);
  });

  const repondreGarde = (quitter) => {
    const g = gardeRef.current;
    if (g && g.resoudre) g.resoudre(quitter);
    else poserGarde(null);
  };

  /* La garde a dit ce qui n'est pas parti ; l'artisan décide pour une partie
     (l'en-tête, des lignes incomplètes) : on refait le bilan, et l'on part
     s'il n'y a plus rien, sinon la bande suivante prend la place. */
  const reprendreLeBilan = (g) => {
    const r = bilan();
    if (r.ok) { repondreGarde(true); return; }
    poserGarde({ ...r, jeton: g && g.jeton, resoudre: g && g.resoudre, phase: 'bilan' });
  };

  /* « Corriger » : on reste, et l'on revient au champ refusé — en haut de la
     liste pour l'en-tête, dans la carte « Conditions » pour une condition. */
  const corrigerEntete = () => {
    const g = gardeRef.current;
    const champ = g && g.enteteRefuse ? g.enteteRefuse[0] : null;
    repondreGarde(false);
    if (CHAMPS_CONDITIONS.includes(champ)) { ouvrirConditions(); return; }
    if (!refListe.current) return;
    refListe.current.scrollToOffset({ offset: 0, animated: true });
  };

  /* « Quitter sans l'enregistrer » : ce qui a été refusé est abandonné EN LE
     SACHANT. */
  const abandonnerEntete = () => {
    const g = gardeRef.current;
    poserRefusEntete(Object.keys(refusEntete.current));
    setTextesConditions(null);
    reprendreLeBilan(g);
  };

  /* « L'abandonner » : une ligne déjà en base revient à sa dernière version
     enregistrée ; une ligne qui n'y a jamais été disparaît. */
  const abandonnerIncompletes = () => {
    const g = gardeRef.current;
    const f = fileRef.current;
    (g ? g.incompletes : []).forEach((id) => {
      const avant = derniereEnvoyee.current[id];
      poserErreur(id, null);
      if (avant && f) {
        changerLignes((ls) => ls.map((l) => (l.id === id ? avant : l)));
        f.ligne(avant);
      } else {
        if (f && f.etatDe(id)) f.retirerLigne(id);
        changerLignes((ls) => ls.filter((l) => l.id !== id));
      }
    });
    reprendreLeBilan(g);
  };

  /* ------------------------------------------------------------------ */
  /*  LE RENDU                                                            */
  /* ------------------------------------------------------------------ */
  const tri = useMemo(() => trierLignes(lignes), [lignes]);
  const visibles = useMemo(() => tri.filter((l) => l.type !== 'option'), [tri]);
  const options = useMemo(() => tri.filter((l) => l.type === 'option'), [tri]);
  const sous = useMemo(() => sousTotaux(lignes), [lignes]);

  /* La mémoire : les lignes de MES devis, plus celles de ce brouillon. */
  const memoireComplete = useMemo(() => {
    if (memoire === null) return null;
    const lue = Array.isArray(memoire) ? memoire : [];
    const ici = new Set(lignes.map((l) => l.id));
    const devisCourant = {
      id: devisIdInitial, objet: devis.objet || null, source: devis.source || null, modifieLe: devis.modifieLe || null,
    };
    return [
      ...lue.filter((l) => !ici.has(l.id)),
      ...lignes.filter((l) => TYPES_CHIFFRES.includes(l.type)).map((l) => ({ ...l, devis: devisCourant })),
    ];
  }, [memoire, lignes, devisIdInitial, devis.objet, devis.source, devis.modifieLe]);

  /* « POUR LE REMETTRE » : ce que la base a rendu, rangé en trois parties
     comptées (`lireMotifsDeRemise`, devis.js), avec la table des sections
     d'« Mon entreprise » — la même que `PretAEmettre`. Les AVIS se calculent
     plus bas, une fois l'état de la liste connu. */
  const lue = useMemo(() => (Array.isArray(liste.motifs)
    ? lireMotifsDeRemise(liste.motifs, { sections: SECTION_DU_MOTIF }) : null), [liste.motifs]);

  if (etat === 'impossible') {
    return <View style={s.centre}><Text style={s.texteCentre}>{IDENTIFIANT_IMPOSSIBLE}</Text></View>;
  }
  if (etat === 'chargement' || etat === 'attente') {
    return (
      <View style={s.centre}>
        <ActivityIndicator color={C.accent} />
        <Text style={s.texteCentre}>
          {etat === 'attente'
            ? 'Ce devis termine un enregistrement en cours. Il s’ouvre dès que c’est fait.'
            : 'Lecture du devis…'}
        </Text>
      </View>
    );
  }
  if (etat === 'echec') {
    return (
      <View style={s.centre}>
        <Text style={s.titreCentre}>Lecture impossible</Text>
        <Text style={s.texteCentre}>{erreurLecture}</Text>
        <BtnOutline label="Réessayer" onPress={() => { setEtat('chargement'); setTentative((t) => t + 1); }} />
      </View>
    );
  }
  if (etat === 'absent') {
    return (
      <View style={s.centre}>
        <Text style={s.titreCentre}>Ce brouillon n’existe plus</Text>
        <Text style={s.texteCentre}>Il a été supprimé, peut-être depuis un autre appareil.</Text>
      </View>
    );
  }

  const ligneOuverte = carte ? tri.find((l) => l.id === carte) : null;
  const pieceOuverte = ligneOuverte ? pieceDeLaLigne(lignes, ligneOuverte.id) : null;
  const voisines = ligneOuverte ? tri.filter((x) => (x.type === 'option') === (ligneOuverte.type === 'option')) : [];
  const rang = ligneOuverte ? voisines.findIndex((x) => x.id === ligneOuverte.id) : -1;
  const clientFiche = devis.clientId
    ? clients.find((c) => String(c.id) === String(devis.clientId)) : null;
  /* LE TYPE ET LE SIRET DE LA FICHE (2b-2) : le bloc « À quel titre ? » ne
     propose « à titre privé » que pour un type LU, et les avis lisent le
     SIRET. Ceux du carnet sont sûrs (la colonne n'est jamais vide) ; sinon,
     ce que le devis ouvert a joint, sans valeur par défaut. */
  const client = clientFiche
    ? {
      nom: clientFiche.nom, ville: clientFiche.ville, type: clientFiche.type ?? null, siret: clientFiche.siret ?? null,
    }
    : clientAffiche;
  const nbIncompletes = lignes.filter((l) => !ligneVierge(l) && (erreurs[l.id] || etats[l.id] === 'locale')).length;
  const nbEchecs = Object.keys(etats).filter((id) => id !== 'devis' && etats[id] === 'echec').length;
  const nbNonEnregistrees = nbIncompletes + nbEchecs;
  const chiffrerPossible = Array.isArray(propositions) && propositions.length > 0;
  const suffixe = suffixeDuPied({
    nbNonEnregistrees, enCours: attente.enCours, reduction: totaux ? Number(totaux.reduction) || 0 : 0,
  });

  /* L'ÉTAT DE LA LISTE « POUR LE REMETTRE », dans l'ordre du cahier
     (`etatDeLaListe`, devis.js) : pas encore en base, des changements en
     route (une écriture, ou un champ de l'en-tête tapé et pas encore
     quitté), un échec, la liste. Ce qui n'est PAS ENREGISTRÉ se dit à côté
     (`ceQueLaListeNeComptePas`), avec LE compte du pied
     (`nbNonEnregistrees`) — jamais un second. */
  /* LA PARTIE « VOTRE ENTREPRISE » SE TAIT AUSSI pendant qu'une réponse
     « à quel titre » part (2b-2, cahier §3.8) : les mentions dues à un
     particulier en dépendent. Calculé à chaque rendu, depuis l'état de la
     file — jamais gardé : un échec la rend aussitôt. */
  const relectureVue = attente.etatAQuelTitre.enRoute && !liste.relecture.entreprise
    ? { ...liste.relecture, entreprise: true } : liste.relecture;
  const etatListe = etatDeLaListe({
    enBase: attente.devisEnBase,
    enRoute: attente.enCours,
    champOuvert,
    erreur: liste.erreur,
    lue,
    relecture: relectureVue,
  });
  const pasCompte = ceQueLaListeNeComptePas({
    nbLignes: nbNonEnregistrees,
    entete: !!attente.devisErreur || Object.keys(erreursEntete).length > 0,
    enBase: attente.devisEnBase,
  });
  /* LA PLACE DE LA LIGNE, SANS MÉMOIRE (relecture 6 de 2b-1) : la ligne la
     réserve tant que quelque chose n'est pas compté (`pasCompte`) OU qu'une
     écriture renvoyée après un échec est en route (`renvoi`, que la file dit
     dans `attente`) — `garderLaPlace`, appelée par `texteDeLaLigneRemise`.
     « Réessayer » ne la fait donc plus tomber (RELIRE4-C), ni la carte d'une
     ligne en échec fermée sans rien changer (RELIRE6-1), et ce qui cesse
     d'être compté sans écriture la rend au geste, jamais au retour d'une
     liste sans rapport (RELIRE5-R1). Rien ne se retient d'un rendu au
     suivant. */
  /* LES AVIS, calculés ici sur ce que l'écran a, jamais comptés — et
     « ce devis ne coûte rien » se tait tant que la liste n'est pas sûre
     (relecture de 2b-1, PAR-8). */
  const avis = avisDuDevis({
    devis, lignes, totaux, etat: etatListe, pasCompte, client, reponseVue: liste.reponseVue,
  });
  let erreurListe = null;
  if (liste.erreur) {
    erreurListe = liste.erreur.baseEnRetard
      ? 'La base n’est pas encore à jour pour cette liste : ce n’est pas que rien ne manque.'
      : messageClair(liste.erreur, 'La liste de ce qu’il manque pour remettre ce devis', { rienAffiche: true });
  }
  const listeReessayable = !!liste.erreur && !estUnRefusDefinitif(liste.erreur);

  /* « À QUEL TITRE ? » ET « LE CHANTIER » (2b-2) — ce que l'écran a (la
     réponse voulue), avec l'état de son écriture. La DATE du « Oui » au
     chantier neuf est celle de la BASE (les totaux relus), et seulement
     quand la base a ce « Oui ». */
  const dejaVu = totaux && totaux.demande ? totaux.demande : null;
  const confirmeLe = dejaVu && dejaVu.chantierNeufConso === true ? (dejaVu.chantierNeufConsoLe || null) : null;
  const aQuelTitre = resumeAQuelTitre({
    devis, client, enRoute: attente.etatAQuelTitre.enRoute, enEchec: attente.etatAQuelTitre.enEchec,
  });
  const resumeChantier = resumeDuChantier({
    devis: { ...devis, chantierNeufConsoLe: confirmeLe },
    regime,
    enRoute: attente.etatChantier.enRoute,
    enEchec: attente.etatChantier.enEchec,
  });
  /* La ligne du haut et la rangée du bas : le MÊME composant, la même
     règle — deux écritures de la même vérité finiraient par se contredire
     (la leçon des voyants du 04/10). */
  const ligneRemise = (variante) => (
    <LigneRemise
      variante={variante}
      etat={etatListe}
      lue={lue}
      enLecture={liste.enLecture}
      pasCompte={pasCompte}
      relecture={relectureVue}
      renvoi={attente.renvoisEnRoute > 0}
      erreurReessayable={listeReessayable}
      erreurPhrase={erreurListe}
      onOuvrir={ouvrirPourRemettre}
      onReessayer={lireLaListe}
    />
  );

  /* LA FEUILLE, UN SEUL `switch` : une seule à l'écran, par construction. */
  const rendreLaFeuille = () => {
    if (!feuille) return null;
    switch (feuille.type) {
      case 'client':
        return (
          <ChoixClientDevis
            clients={clients}
            etat={clientsEtat}
            onRecharger={onChargerClients}
            onChoisir={choisirClient}
            onNouveau={nouveauClient}
            onFermer={() => setFeuille(null)}
          />
        );
      case 'ajout':
        return (
          <FeuilleAjoutPoste
            valeurs={feuille.valeurs}
            devisOrigineId={feuille.devisOrigineId}
            postes={postesLus(postes, postesEtat)}
            regime={regime}
            /* L'avertissement d'un nom de client lit la FICHE du carnet (son
               nom, son adresse, son téléphone) quand le carnet est lu — il est
               demandé à l'ouverture de la feuille —, sinon le nom seul. Pour
               un devis venu d'une demande, le nom que le demandeur a écrit,
               quand le devis vient d'être ouvert depuis « Pour moi » ; rouvert
               plus tard depuis « Mes devis », la saisie ne connaît plus ce nom
               (le devis ne garde de la demande que sa date et son budget), et
               seuls les motifs (« chez », « Mme », un numéro…) jouent. Et le
               lieu des travaux. */
            client={clientFiche || client || (ouverture.demandeSource ? clientDepuisDemande(ouverture.demandeSource) : null)}
            lieu={{ adresse: devis.lieuAdresse || null }}
            onRanger={onRangerPoste}
            onRelire={relirePostes}
            onFermer={() => setFeuille(null)}
          />
        );
      case 'pour_qui':
        return (
          <FeuilleAQuelTitre
            valeur={pourQuiValable(devis)}
            onChoisir={choisirAQuelTitre}
            onFermer={() => setFeuille(null)}
          />
        );
      case 'chantier_neuf':
        return (
          <FeuilleChantierNeuf
            onConfirmer={confirmerChantierNeuf}
            onFermer={() => setFeuille(null)}
          />
        );
      case 'poste': {
        /* Le poste relu dans la base à chaque rendu : une relecture
           (« modifié entre-temps ») lui donne la date à jour. Absent d'une
           base LUE, il a été retiré : la feuille le DIT, et n'écrit plus rien
           — elle retombait sur le poste disparu, et « Enregistrer » repartait
           vers un poste qui n'existe plus (relecture « textes », TEXTES5). */
        const lue = postesLus(postes, postesEtat);
        const posteLu = lue ? lue.find((p) => String(p.id) === String(feuille.poste.id)) : null;
        return (
          <FeuillePoste
            poste={posteLu || feuille.poste}
            absent={!!lue && !posteLu}
            prixPropose={feuille.prixPropose}
            postes={postes}
            regime={regime}
            regimeDeclareLe={regimeDeclareLe}
            onRanger={onRangerPoste}
            onRelire={relirePostes}
            onFermer={() => setFeuille(null)}
          />
        );
      }
      default:
        return null;
    }
  };

  const entete = (
    <EnteteDevis
      ref={refEntete}
      devis={devis}
      client={client}
      avisRegime={avisRegime}
      erreurs={erreursEntete}
      phraseLieu={phraseLieu}
      onEnregistrer={enregistrerEntete}
      onFrappe={setChampOuvert}
      onChoisirClient={ouvrirChoixClient}
      onNouveauClient={nouveauClient}
      aQuelTitre={aQuelTitre}
      onRepondreAQuelTitre={ouvrirAQuelTitre}
      onOuiATitrePrive={ouiATitrePrive}
      onMonEntreprise={() => onMonEntreprise('tva')}
      onRelireRegime={onRelireRegime}
      ligneRemise={ligneRemise('haut')}
    />
  );

  const bas = (
    <BasDuDevis
      options={options}
      franchise={franchise}
      reel={reel}
      regime={regime}
      propositions={propositions}
      regimeEnEchec={regimeEnEchec}
      totaux={totaux}
      totauxIllisibles={totauxIllisibles}
      devis={devis}
      erreurs={erreursEntete}
      etatDeLOption={(o) => proprietesDeLaRangee(o, { etats, erreurs, phrasesEchec, definitifs })}
      onReessayer={reessayerStable}
      onOuvrir={ouvrirCarte}
      onAjouter={ajouter}
      onRelireTotaux={relireTotaux}
      onOuvrirConditions={ouvrirConditions}
      onSupprimer={supprimer}
      confirmeSuppression={confirmeSuppression}
      phraseSuppression={phraseSuppressionDuBrouillon({ postes, postesEtat, devisId: devisIdInitial })}
      rangeeRemise={ligneRemise('bas')}
      resumeChantier={resumeChantier}
      onOuvrirChantier={ouvrirChantier}
    />
  );

  /* GLISSER LA LISTE REFERME LE CLAVIER (`on-drag`) — SAUF QUAND UNE CARTE
     OU UNE FEUILLE LA COUVRE (relecture 6 de 2b-1) : on ne peut plus la
     glisser, et ce qui change sous elles change sa hauteur (la place de la
     ligne « Pour le remettre » qui se rend ou se réserve, une rangée qui
     passe en échec). Au navigateur, Chromium compense ce défilement
     (`overflow-anchor`) et `react-native-web` ferme le clavier à la fin de
     TOUT défilement : le champ de la carte qu'on était en train de remplir
     perdait la main (mesuré : « Poste suivant » sur la seule ligne
     incomplète, un renvoi qui réussit pendant qu'on tape — `mesure-devis`).
     iOS ne ferme le clavier qu'à un glissement du doigt, impossible sous la
     carte : rien n'y change. Une condition du rendu, pas une mémoire. */
  const glisserFermeLeClavier = carte || feuille ? 'none' : 'on-drag';

  return (
    <View style={s.ecran}>
      <FlatList
        ref={refListe}
        {...CLAVIER}
        keyboardDismissMode={glisserFermeLeClavier}
        data={visibles}
        keyExtractor={(l) => String(l.id)}
        renderItem={({ item }) => (
          <RangeeLigne
            {...proprietesDeLaRangee(item, { sousTotaux: sous, etats, erreurs, phrasesEchec, definitifs })}
            onOuvrir={ouvrirStable}
            onReessayer={reessayerStable}
          />
        )}
        ListHeaderComponent={entete}
        ListHeaderComponentStyle={s.enteteBoite}
        ListFooterComponent={bas}
        ItemSeparatorComponent={Intervalle}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={7}
        contentContainerStyle={s.contenu}
        /* Pendant que la carte est ouverte, la liste est CACHÉE à VoiceOver :
           elle est dessous, et on ne doit pas pouvoir y entrer par erreur. */
        accessibilityElementsHidden={!!carte}
        importantForAccessibility={carte ? 'no-hide-descendants' : 'auto'}
      />

      {/* LE BAS DE L'ÉCRAN — les bandes et le pied. CARTE OUVERTE, il est
          caché à VoiceOver comme la liste : la carte est opaque, et l'on ne
          doit pas pouvoir toucher « Réessayer » ou « Rester » à travers elle
          (relecture « écran » des étapes 4 à 7, C4). La garde, elle, ne
          s'affiche jamais carte ouverte : elle commence par la fermer. */}
      <View
        accessibilityElementsHidden={!!carte}
        importantForAccessibility={carte ? 'no-hide-descendants' : 'auto'}
      >
        {/* CE QUI N'EST PAS PARTI SE DIT, et se renvoie. */}
        {/* UN REFUS DÉFINITIF NE SE RÉESSAIE PAS (lot S-b) : « ce n'est pas
            votre demande » (OP013), « vous ne pouvez plus rattacher un
            nouveau devis à cette demande » (OP020, un blocage). Renvoyée,
            la même écriture recevrait la même réponse : « Réessayer »
            mentirait. La phrase de la base dit ce qui reste possible, et
            la garde de sortie laisse partir (« Quitter sans elles »). */}
        {!!attente.devisErreur && (
          <View style={s.bande}>
            <Text style={s.bandeTexte}>
              {`${phraseEchecDuDevis({ enBase: attente.devisEnBase, erreur: attente.devisErreur, retenue: attente.devisRetenue })} ${
                typeof attente.devisErreur === 'object' ? messageDEcritureDuDevis(attente.devisErreur, 'entete') : ''}`}
            </Text>
            {!estUnRefusDefinitif(attente.devisErreur) && (
              <BtnOutline label="Réessayer" onPress={() => fileRef.current && fileRef.current.reessayer('devis')} />
            )}
          </View>
        )}
        {attente.retraitsEnEchec > 0 && (
          <View style={s.bande}>
            <Text style={s.bandeTexte}>
              {attente.retraitsEnEchec > 1
                ? `${attente.retraitsEnEchec} lignes retirées n’ont pas pu être supprimées : elles sont encore dans le devis.`
                : 'Une ligne retirée n’a pas pu être supprimée : elle est encore dans le devis.'}
            </Text>
            {/* LES RETRAITS SEULEMENT (TC-1) : jamais l'en-tête ni une ligne
                refusés pour de bon, que `reessayer()` sans clé renvoyait. */}
            {attente.retraitsRenvoyables > 0 && (
              <BtnOutline
                label="Réessayer"
                onPress={() => fileRef.current && renvoyerLesRetraits(fileRef.current, { estDefinitif: estUnRefusDefinitif })}
              />
            )}
          </View>
        )}

        {/* LA BANDE DE LA GARDE — d'abord l'ATTENTE, au moment même de
            l'appui (B4) ; puis, dans l'ordre : les lignes incomplètes, ce que
            l'écran a refusé dans l'en-tête (I1), ce qui n'est pas en base. */}
        {!!garde && garde.phase === 'attente' && (
          <View style={s.bande} accessibilityLiveRegion="assertive">
            <View style={s.attenteLigne}>
              <ActivityIndicator color={C.accent2} />
              <Text style={[s.bandeTexte, s.attenteTexte]}>
                Enregistrement avant de partir… (huit secondes au plus)
              </Text>
            </View>
            <BtnOutline label="Rester" onPress={() => repondreGarde(false)} />
          </View>
        )}
        {!!garde && garde.phase === 'bilan' && garde.incompletes.length > 0 && (
          <View style={s.bande} accessibilityLiveRegion="assertive">
            <Text style={s.bandeTexte}>
              {garde.incompletes.length > 1
                ? `${garde.incompletes.length} lignes ne sont pas complètes : elles ne seront pas enregistrées.`
                : 'Cette ligne n’est pas complète : elle ne sera pas enregistrée.'}
            </Text>
            <View style={s.bandeBoutons}>
              <View style={s.moitie}>
                <BtnOutline
                  label="La compléter"
                  onPress={() => { const id = garde.incompletes[0]; repondreGarde(false); ouvrirCarte(id); }}
                />
              </View>
              <View style={s.moitie}>
                <BtnOutline label="L’abandonner" onPress={abandonnerIncompletes} />
              </View>
            </View>
          </View>
        )}
        {!!garde && garde.phase === 'bilan' && garde.incompletes.length === 0 && garde.enteteRefuse.length > 0 && (
          <View style={s.bande} accessibilityLiveRegion="assertive">
            <Text style={s.bandeTexte}>
              {/* Un nom par champ, même quand les deux formes d'une paire sont
                  refusées (ÉCRAN-6) : jamais « « Réduction », « Réduction » » ;
                  et l'acompte sous le nom de la nature que la carte montrait. */}
              {`${nomsDesRefus(garde.enteteRefuse, {
                noms: NOMS_ENTETE,
                nature: textesConditions && textesConditions.choix ? textesConditions.choix.nature : devis.acompteNature,
              }).map((n) => `« ${n} »`).join(', ')} : ce que vous avez écrit n’est `
                + `pas enregistré. ${erreursEntete[garde.enteteRefuse[0]] || ''}`}
            </Text>
            <View style={s.bandeBoutons}>
              <View style={s.moitie}>
                <BtnOutline label="Corriger" onPress={corrigerEntete} />
              </View>
              <View style={s.moitie}>
                <BtnOutline label="Quitter sans l’enregistrer" onPress={abandonnerEntete} />
              </View>
            </View>
          </View>
        )}
        {!!garde && garde.phase === 'bilan' && garde.incompletes.length === 0 && garde.enteteRefuse.length === 0 && (
          <View style={s.bande} accessibilityLiveRegion="assertive">
            {/* CE QUI N'EST PAS EN BASE, ET RIEN D'AUTRE (`bilanDeLaGarde`,
                devis.js) : les lignes refusées, celles dont l'envoi continue
                — « n'a pas pu » serait faux, il peut aboutir (relecture
                « données », I2) —, et l'en-tête s'il n'y est pas, même avec
                des lignes ; le bouton ne dit « sans elles » que pour des
                lignes (ÉCRAN-F1). */}
            <Text style={s.bandeTexte}>{garde.texte}</Text>
            <View style={s.bandeBoutons}>
              <View style={s.moitie}>
                <BtnOutline label="Rester" onPress={() => repondreGarde(false)} />
              </View>
              <View style={s.moitie}>
                <BtnOutline label={garde.quitter} onPress={() => repondreGarde(true)} />
              </View>
            </View>
          </View>
        )}

        {/* LE PIED, FIXE, UNE SEULE RANGÉE : la dernière valeur sûre de la
            base, suivie de ce qui n'y est pas encore. Caché par le clavier
            pendant la frappe — la règle du projet interdit un
            `KeyboardAvoidingView` par-dessus une liste qui porte `CLAVIER`
            (l'inset compterait deux fois) ; glisser la liste vers le bas
            referme le clavier.

            « Total TTC » au régime réel SEULEMENT : en franchise, en lecture,
            en échec ou non déclaré, « Total » (C2).

            UN DEVIS VIDE PORTE « + Poste » ICI : sous l'en-tête, la barre
            « Ajouter » tombait SOUS le pied et la barre du bas — y = 793 sur
            un écran de 844 —, et le premier poste coûtait un glissement que
            le compte du cahier ne compte pas (relecture « écran », B5). */}
        <View style={s.pied} accessibilityRole="summary">
          {lignes.length === 0 && chiffrerPossible && (
            <Pastille label="+ Poste" nom="Ajouter un premier poste chiffré" onPress={() => ajouter('poste')} />
          )}
          <Text style={s.piedLibelle} numberOfLines={1}>
            {libellesDesTotaux(regime).total}
            <Text style={s.piedSuffixe}>{suffixe}</Text>
          </Text>
          <Montant centimes={totaux ? totaux.ttc : null} fort style={s.piedMontant} />
        </View>
      </View>

      {!!ligneOuverte && (
        <CarteLigne
          key={`carte-${cleCarte}`}
          ref={refCarte}
          ligne={ligneOuverte}
          franchise={franchise}
          tauxProposes={propositions}
          regimeEnEchec={regimeEnEchec}
          piece={pieceOuverte}
          sousTotalPiece={pieceOuverte ? sous[pieceOuverte.id] : null}
          sousTotalPropre={ligneOuverte.type === 'piece' ? sous[ligneOuverte.id] : null}
          memoire={memoireComplete}
          memoireEchec={memoire === 'echec'}
          onRelireMemoire={demanderMemoire}
          postes={postes}
          postesEtat={postesEtat}
          onRelirePostes={relirePostes}
          regimeDeclareLe={regimeDeclareLe}
          onAjouterALaBase={demanderAjout}
          onOuvrirPoste={demanderPoste}
          erreur={erreurs[ligneOuverte.id] || null}
          /* La carte prend l'écran : elle dit elle-même pourquoi la ligne
             n'est pas enregistrée (point 1) — sous elle, la rangée ne se voit
             plus. */
          echec={etats[ligneOuverte.id] === 'echec'
            ? (phrasesEchec[ligneOuverte.id] || 'Cette ligne n’a pas pu être enregistrée.') : null}
          tauxHoraire={tauxHorairePropose(tarifs, regime)}
          retrait={retraitDe(ligneOuverte)}
          peutMonter={rang > 0}
          peutDescendre={rang >= 0 && rang < voisines.length - 1}
          onEnregistrer={enregistrerLigne}
          onFermer={fermerCarte}
          onPosteSuivant={posteSuivant}
          onPosteDansPiece={posteDansPiece}
          onMonter={() => deplacer(-1)}
          onDescendre={() => deplacer(1)}
          onRetirer={retirer}
          depuisLaListe={retourCarte === CARTE_POUR_REMETTRE}
          /* 2b-3 : une VALEUR — la carte ne reçoit pas le devis, et la source
             ne se récrit jamais (D3). Elle pose une ligne fixe au-dessus de
             l'interrupteur « Réparation urgente », jamais la case cochée. */
          depuisUneUrgence={devis.source === 'urgence'}
        />
      )}

      {carte === CARTE_CONDITIONS && (
        <ConditionsDevis
          key={`conditions-${cleCarte}`}
          ref={refConditions}
          devis={devis}
          totaux={totaux}
          regime={regime}
          nbOptions={options.length}
          erreurs={erreursEntete}
          textes={textesConditions}
          /* LA CARTE PREND L'ÉCRAN, par-dessus les bandes et le pied : elle
             doit DIRE elle-même l'écriture en cours, l'échec et « Réessayer »,
             et des totaux qui n'ont pas pu être relus (relecture ÉCRAN-2 du
             lot 2a). La même phrase que la bande du bas. */
          etatEcriture={{
            enCours: attente.enCours,
            echec: attente.devisErreur
              ? `${phraseEchecDuDevis({ enBase: attente.devisEnBase, erreur: attente.devisErreur, retenue: attente.devisRetenue })} ${
                typeof attente.devisErreur === 'object' ? messageDEcritureDuDevis(attente.devisErreur, 'entete') : ''}`.trim()
              : null,
            reessayable: !!attente.devisErreur && !estUnRefusDefinitif(attente.devisErreur),
          }}
          totauxIllisibles={totauxIllisibles}
          onReessayer={() => fileRef.current && fileRef.current.reessayer('devis')}
          onRelireTotaux={relireTotaux}
          onEnregistrer={enregistrerConditions}
          onFermer={fermerCarte}
          champInitial={champConditions}
          depuisLaListe={retourCarte === CARTE_POUR_REMETTRE}
          /* Les aides de l'acompte suivent la réponse de l'ÉCRAN (ce sont des
             aides, pas des comptes) ; la date du chantier neuf, celle de la
             base (2b-2, cahier §3.5). */
          reponseATitre={pourQuiValable(devis)}
          chantierNeufConso={devis.chantierNeufConso ?? null}
          chantierNeufConsoLe={confirmeLe}
          /* 2b-3 : les lignes de l'ÉCRAN — l'aide de l'échéance et la ligne
             « pourquoi » les lisent (une marque pas encore enregistrée y
             compte, et « Non enregistrée » se voit sur la ligne) ; le motif,
             lui, lit celles de la BASE. */
          toutUrgent={toutUrgent(lignes)}
          lignes={lignes}
        />
      )}

      {/* « LE CHANTIER » (lot 2b-2) — une carte comme les autres ; la
          confirmation du chantier neuf se pose par-dessus (`feuille`). */}
      {carte === CARTE_CHANTIER && (
        <ChantierDevis
          key={`chantier-${cleCarte}`}
          devis={devis}
          regime={regime}
          confirmeLe={confirmeLe}
          etats={{ q1: attente.etatQ1, q2: attente.etatQ2, q3: attente.etatQ3 }}
          onRepondre={repondreChantier}
          onDemanderConfirmation={demanderConfirmationChantier}
          onFermer={fermerCarte}
          depuisLaListe={retourCarte === CARTE_POUR_REMETTRE}
          questionInitiale={questionChantier}
        />
      )}

      {/* « CE QU'IL MANQUE POUR REMETTRE CE DEVIS » (lot 2b-1) — une carte
          comme les autres : elle prend l'écran, et une feuille (« Pour
          qui ? ») peut se poser par-dessus sans la quitter. */}
      {carte === CARTE_POUR_REMETTRE && (
        <PourRemettre
          key={`pour-remettre-${cleCarte}`}
          etat={etatListe}
          lue={lue}
          enLecture={liste.enLecture}
          pasCompte={pasCompte}
          relecture={relectureVue}
          erreurPhrase={erreurListe}
          erreurReessayable={listeReessayable}
          avis={avis}
          lignes={lignes}
          chiffrerPossible={chiffrerPossible}
          onAgir={agirSurLePoint}
          onAgirAussi={agirAussiSurLePoint}
          reponseVue={liste.reponseVue}
          onReessayer={lireLaListe}
          onFermer={fermerCarte}
        />
      )}

      {rendreLaFeuille()}
    </View>
  );
}

const s = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.bg },
  contenu: { padding: GOUTTIERE, paddingBottom: S.xxl * 2 },
  enteteBoite: { marginBottom: S.md },
  intervalle: { height: S.sm },
  centre: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.md, padding: GOUTTIERE, backgroundColor: C.bg,
  },
  titreCentre: { fontFamily: F.oswald6, fontSize: T.titre, color: C.ink, textAlign: 'center' },
  texteCentre: { fontFamily: F.inter, fontSize: T.corps, color: C.muted, textAlign: 'center', lineHeight: interligne(T.corps) },

  /* Une rangée est une CARTE de contenu : angle vif, fond blanc — c'est ce
     qui rend le rouge brique d'une erreur lisible (5,56 : 1 sur le blanc,
     4,37 seulement sur le beige du fond). */
  rangee: { ...CARTE },
  rangeeTitre: { backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.accent2 },
  rangeeZone: { minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: S.md, paddingVertical: S.sm },
  titreLigne: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  zone: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  piece: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  reserve: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  reserveMot: { fontFamily: F.inter6, color: C.bad },
  poste: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  posteTexte: { flex: 1, minWidth: 0 },
  designation: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  detail: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), marginTop: S.xs },
  detailMontant: { fontSize: T.petit, color: C.muted },
  offert: { fontFamily: F.inter6, fontSize: T.corps, color: C.okTexte },
  etat: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, paddingHorizontal: S.md, paddingBottom: S.sm },
  etatBoite: { paddingHorizontal: S.md, paddingBottom: S.sm, gap: S.xs },
  /* « Réessayer » est un VRAI bouton, 44 points par sa boîte, en rouge brique
     sur la carte blanche. */
  etatBouton: {
    minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: S.md, marginHorizontal: S.md, marginBottom: S.sm,
    borderWidth: 1, borderColor: C.bad, borderRadius: R.gelule, alignSelf: 'flex-start',
  },
  etatBoutonTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.bad },
  etatMot: { fontFamily: F.oswald6, fontSize: T.petit, color: C.bad, marginBottom: S.xs },
  /* Dans le bloc des options : sans retrait de plus (le bloc a sa marge) —
     la BOÎTE perd son remplissage, le BOUTON sa marge seulement : sa gélule
     garde le sien (ÉCRAN-F4). */
  etatBoiteAligne: { paddingHorizontal: 0 },
  etatBoutonAligne: { marginHorizontal: 0 },
  etatPhrase: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit) },

  bas: { marginTop: S.lg, gap: S.sm },
  options: { ...CARTE, padding: S.md, gap: S.sm },
  titreSection: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, marginTop: S.sm },
  option: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm, minHeight: TOUCHE, paddingVertical: S.xs },
  optionPrix: { alignItems: 'flex-end' },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  ventilation: { ...CARTE, padding: S.md, gap: S.xs, marginTop: S.sm },
  ligneTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm },
  libelle: { flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.corps, color: C.ink },
  libelleMontant: { fontFamily: F.inter, color: C.ink },
  libelleTotal: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  valeur: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, textAlign: 'right' },
  valeurTotal: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink, textAlign: 'right' },
  mention: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  illisibles: { gap: S.xs, marginTop: S.sm },
  /* La rangée qui résume les conditions : une cible qui OUVRE une carte,
     44 points au moins, comme une ligne de devis. */
  resume: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE, marginTop: S.md,
    paddingVertical: S.sm,
  },
  resumeTexte: { flex: 1, minWidth: 0, gap: S.xs },
  /* LA SUPERPOSITION de la rangée « Le chantier » (la technique de
     `LigneRemise`) : la rangée prend la hauteur de son plus grand gabarit. */
  superpose: { flexDirection: 'row', alignItems: 'flex-start' },
  couche: { width: '100%' },
  coucheSuivante: { marginLeft: '-100%' },
  gabarit: { opacity: 0, pointerEvents: 'none' },
  replieTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit) },
  supprimer: {
    minHeight: TOUCHE, justifyContent: 'center', alignItems: 'center', marginTop: S.xl,
    borderWidth: 1, borderColor: C.bad, borderRadius: R.doux, backgroundColor: C.surface,
  },
  supprimerTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.bad },
  supprimerDanger: { backgroundColor: C.bad },
  supprimerDangerTexte: { color: surFond(C.bad) },

  /* Les bandes : de la STRUCTURE posée au-dessus du pied, angle vif. */
  bande: {
    backgroundColor: C.surface, borderTopWidth: 3, borderTopColor: C.bad,
    paddingHorizontal: GOUTTIERE, paddingVertical: S.sm, gap: S.sm,
  },
  bandeTexte: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  bandeBoutons: { flexDirection: 'row', gap: S.sm },
  attenteLigne: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  attenteTexte: { flex: 1, minWidth: 0 },
  moitie: { flex: 1, minWidth: 0 },

  pied: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE,
    paddingHorizontal: GOUTTIERE, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.line,
  },
  piedLibelle: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  piedSuffixe: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },
  piedMontant: { fontSize: T.sousTitre },
});
