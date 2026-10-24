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
 * « enregistrement… » ; « Non enregistrée — Réessayer » ; « Incomplète — La
 * compléter ». Un travail qui n'a pas pu se faire ne ressemble jamais à un
 * travail fait — et le pied le dit aussi (« · 2 lignes non enregistrées »).
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
 * EN DÉMONSTRATION, tout cela VIT : la base en mémoire de
 * `src/data/devis-demo.js` refuse avec les mots de la vraie base, une
 * écriture y prend un tiers de seconde, et les états « enregistrement… » ou
 * « non enregistrée » s'y voient sans fichier `.env`.
 */
import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, GOUTTIERE, CARTE, TOUCHE, APPUI, interligne, surFond,
} from '../theme';
import {
  BtnOutline, Pastille, Interrupteur, Montant,
} from '../components/ui';
import { ChevronDown, ChevronRight } from '../components/icons';
import EnteteDevis from '../components/EnteteDevis';
import CarteLigne, { MANQUE } from '../components/CarteLigne';
import ChoixClientDevis from '../components/ChoixClientDevis';
import FeuilleAjoutPoste from '../components/FeuilleAjoutPoste';
import FeuillePoste from '../components/FeuillePoste';
import ChampMontant from '../components/ChampMontant';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import { CLAVIER } from '../lib/clavier';
import { messageClair, messageDeContrainte } from '../lib/erreurs';
import { DELAI_ECRITURE } from '../lib/file-ecriture';
import { nouvelIdentifiant, IDENTIFIANT_IMPOSSIBLE } from '../lib/identifiant';
import { clientDepuisDemande } from '../lib/clients';
import {
  UNITES, TYPES_CHIFFRES, MENTION_FRANCHISE, PHRASE_RETENUE, CHAMPS_DEVIS,
  validerLigne, validerDevis, nettoyerDevis, trierLignes, sousTotaux, totalLigne,
  lignesDeLaPiece, titreQuiRecoit, pieceDeLaLigne, ligneVierge, ordreEntre, renumeroter,
  monter, descendre, tauxLisible, tauxProposes, tauxHorairePropose, coherenceRegime,
  devisDepuisClient, milliemesLisibles, versCentiemes, centiemesEnSaisie, texteNet, choisirChamps,
  fusionnerAvecLaFile,
} from '../lib/devis';
import { posteDepuisLaLigne } from '../lib/postes';

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
});

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
  };
}

const ordreMax = (lignes) => (lignes.length ? Math.max(...lignes.map((l) => Number(l.ordre) || 0)) : null);

/* --------------------------------------------------------------------------
   UNE RANGÉE DE LA LISTE — mémorisée, et elle ne reçoit que des VALEURS
   (un total, un état, un sous-total), jamais des fonctions qui décident :
   sinon chaque rangée se croirait différente à chaque rendu.
   -------------------------------------------------------------------------- */
const RangeeLigne = React.memo(function RangeeLigne({
  id, type, designation, total, offert, fournitureNonComprise, quantite, unite, prix,
  sousTotal, etat, erreurTexte, incomplete, onOuvrir, onReessayer,
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
            </Text>
          )}
          {quantite == null && fournitureNonComprise && <Text style={s.detail}>Fourniture non comprise</Text>}
        </View>
        {offert ? <Text style={s.offert}>Offert</Text> : <Montant centimes={total} fort />}
      </View>
    );
  }
  const libelle = type === 'reserve' ? `Réserve : ${designation || ''}` : `${designation || 'Ligne'}, ouvrir`;
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
      {etat === 'en_cours' && <Text style={s.etat}>enregistrement…</Text>}
      {etat === 'echec' && (
        <View style={s.etatBoite}>
          <Pressable
            onPress={() => onReessayer(id)}
            accessibilityRole="button"
            accessibilityLabel="Ligne non enregistrée. Réessayer"
            style={({ pressed }) => [s.etatBouton, pressed && APPUI.plein]}
          >
            <Text style={s.etatBoutonTexte}>Non enregistrée — Réessayer</Text>
          </Pressable>
          {!!erreurTexte && <Text style={s.etatPhrase}>{erreurTexte}</Text>}
        </View>
      )}
      {incomplete && etat !== 'echec' && (
        <Pressable
          onPress={() => onOuvrir(id)}
          accessibilityRole="button"
          accessibilityLabel="Ligne incomplète. La compléter"
          style={({ pressed }) => [s.etatBouton, pressed && APPUI.plein]}
        >
          <Text style={s.etatBoutonTexte}>Incomplète — La compléter</Text>
        </Pressable>
      )}
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
const BasDuDevis = forwardRef(function BasDuDevis({
  options, franchise, reel, propositions, regimeEnEchec, totaux, totauxIllisibles, retenue, erreurs,
  onOuvrir, onAjouter, onRelireTotaux, onRetenue, onSupprimer, confirmeSuppression,
}, ref) {
  const refRetenue = useRef(null);
  const [ouvert, setOuvert] = useState(retenue != null);

  const lireRetenue = () => {
    if (!refRetenue.current) return;
    const lu = versCentiemes(refRetenue.current.lire());
    onRetenue(lu.ok ? lu.centiemes : undefined, lu.ok ? null : lu.message);
  };
  useImperativeHandle(ref, () => ({ enregistrer: lireRetenue }));

  /* Les postes attendent le régime : `null` = on ne sait pas encore (en
     lecture, ou la lecture a échoué) ; `[]` = non déclaré — seuls les titres
     et les réserves se posent alors. */
  const chiffrerPossible = Array.isArray(propositions) && propositions.length > 0;
  const ventilation = (totaux && totaux.ventilation) || [];

  return (
    <View style={s.bas}>
      {options.length > 0 && (
        <View style={s.options}>
          <Text style={s.titreSection} accessibilityRole="header">Options, non comprises</Text>
          {/* Chacune avec SON prix, et AUCUN total : une option n'est pas dans
              le devis tant que le client ne l'a pas choisie. */}
          {options.map((o) => (
            <Pressable
              key={o.id}
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
          ))}
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
        {!franchise && !reel ? (
          <View style={s.ligneTotal}>
            <Text style={s.libelleTotal}>Total</Text>
            <Montant centimes={totaux ? totaux.ttc : null} fort />
          </View>
        ) : franchise ? (
          <>
            <View style={s.ligneTotal}>
              <Text style={s.libelleTotal}>Total</Text>
              <Montant centimes={totaux ? totaux.ttc : null} fort />
            </View>
            <Text style={s.mention}>{MENTION_FRANCHISE}</Text>
          </>
        ) : (
          <>
            <View style={s.ligneTotal}>
              <Text style={s.libelle}>Total HT</Text>
              <Montant centimes={totaux ? totaux.ht : null} />
            </View>
            {ventilation.map((v) => (
              <View key={v.taux} style={s.ligneTotal}>
                <Text style={s.libelle}>
                  {tauxLisible(v.taux) ? `TVA ${tauxLisible(v.taux)} sur ` : 'Sans TVA, sur '}
                  <Montant centimes={v.base} enLigne style={s.libelleMontant} />
                </Text>
                <Montant centimes={v.tva} />
              </View>
            ))}
            <View style={s.ligneTotal}>
              <Text style={s.libelle}>TVA</Text>
              <Montant centimes={totaux ? totaux.tva : null} />
            </View>
            <View style={s.ligneTotal}>
              <Text style={s.libelleTotal}>Total TTC</Text>
              <Montant centimes={totaux ? totaux.ttc : null} fort />
            </View>
          </>
        )}
        {totauxIllisibles && (
          <View style={s.illisibles}>
            <Text style={s.etatPhrase}>Les totaux n’ont pas pu être relus : ceux-ci peuvent dater.</Text>
            <BtnOutline label="Relire" onPress={onRelireTotaux} />
          </View>
        )}
      </View>

      {/* LES CONDITIONS, repliées. */}
      <Pressable
        onPress={() => setOuvert((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={ouvert ? 'Replier les conditions' : 'Déplier les conditions'}
        style={({ pressed }) => [s.replie, pressed && APPUI.discret]}
      >
        {ouvert ? <ChevronDown size={16} color={C.accent2} /> : <ChevronRight size={16} color={C.accent2} />}
        <Text style={s.replieTexte}>Conditions</Text>
      </Pressable>
      {ouvert && (
        <View style={s.conditions}>
          <Interrupteur
            actif={retenue != null}
            libelle="Retenue de garantie"
            /* JAMAIS LA DURÉE SANS SA RÉSERVE (loi n° 71-584, art. 2) : cette
               aide s'affiche SEULE quand la retenue est éteinte — « rendus un
               an après » promettrait à l'artisan un remboursement que le
               client peut bloquer. `verifier-devis` (A-5) relit désormais
               TOUTES les chaînes du module, attributs JSX compris. */
            aide={'Au plus 5 % des acomptes, rendus un an après la réception des travaux, sauf si le client '
              + 'notifie une opposition motivée.'}
            onPress={() => {
              if (retenue != null) { onRetenue(null, null); return; }
              if (refRetenue.current) refRetenue.current.ecrire('5');
              onRetenue(500, null);
            }}
          />
          {retenue != null && (
            <>
              <Text style={s.etiquette}>Taux de la retenue (%)</Text>
              <ChampMontant
                ref={refRetenue}
                defaut={centiemesEnSaisie(retenue)}
                placeholder="5"
                accessibilityLabel="Taux de la retenue de garantie, en pour cent"
                onBlur={lireRetenue}
              />
              {!!erreurs && !!erreurs.retenueGarantieCentiemes && (
                <Text style={s.erreur}>{erreurs.retenueGarantieCentiemes}</Text>
              )}
              {/* La phrase de la loi, SANS AUCUN MONTANT : l'assiette de la
                  retenue est une question posée au juriste. */}
              <Text style={s.aide}>{PHRASE_RETENUE}</Text>
            </>
          )}
        </View>
      )}

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
      {confirmeSuppression && (
        <Text style={s.aide}>Définitif : le brouillon et toutes ses lignes partent. Rien n’avait été envoyé au client.</Text>
      )}
    </View>
  );
});

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
  const [erreurs, setErreurs] = useState({});
  /* LES CHAMPS DE L'EN-TÊTE REFUSÉS PAR L'ÉCRAN, champ par champ, et ce
     qu'il en a dit. Une référence ET un état : la garde de sortie les lit
     au moment de partir — refusés, ils n'ont RIEN envoyé, et quitter sans le
     dire perdait ce qui était tapé (relecture « données » des étapes 4 à 7,
     I1 : un code postal de quatre chiffres, une retenue de 6 %, partis sans
     un mot). */
  const [erreursEntete, setErreursEntete] = useState({});
  const refusEntete = useRef({});
  const [totaux, setTotaux] = useState(() => (ouverture.devisId ? null : { ht: 0, tva: 0, ttc: 0, ventilation: [] }));
  const [totauxIllisibles, setTotauxIllisibles] = useState(false);
  const [attente, setAttente] = useState({ nb: 0, enCours: false, devisErreur: null, retraitsEnEchec: 0 });
  const [carte, setCarte] = useState(null);
  const [cleCarte, setCleCarte] = useState(0);
  const [memoire, setMemoire] = useState(null);
  /* L'UNIQUE ÉTAT DE FEUILLE : `null`, `{ type: 'client' }`,
     `{ type: 'ajout', valeurs, devisOrigineId }` ou
     `{ type: 'poste', poste, prixPropose }`. Jamais deux booléens. */
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
  const refBas = useRef(null);
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
    const retraits = Object.keys(e).filter((id) => f.retiree(id) && e[id] === 'echec').length;
    setAttente({
      nb: f.enAttente(),
      enCours: Object.values(e).includes('en_cours') || f.etatDe('devis') === 'en_cours',
      devisErreur: f.etatDe('devis') === 'echec' ? (f.erreurDe('devis') || true) : null,
      retraitsEnEchec: retraits,
    });
  };

  /* Ce que « Mes devis » doit montrer de ce brouillon : UNE porte,
     `rangerDevis` d'`OpusApp`. */
  const ranger = (t = null) => {
    const f = fileRef.current;
    if (!f || !f.devisEnBase() || !rappels.current.onRanger) return;
    const d = devisRef.current;
    rappels.current.onRanger({
      ...choisirChamps(d, CHAMPS_DEVIS),
      id: f.devisId(), statut: 'brouillon', demande: d.demande || null, urgence: d.urgence || null,
      client: d.clientId && clientAffiche ? { nom: clientAffiche.nom } : (d.client || null),
      ...(t ? { totalHtCentimes: t.ht, totalTvaCentimes: t.tva, totalTtcCentimes: t.ttc } : {}),
      ...(t && t.modifieLe ? { modifieLe: t.modifieLe } : {}),
    });
  };
  const rangerRef = useRef(ranger);
  useEffect(() => { rangerRef.current = ranger; });

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
        setPhrasesEchec((x) => {
          const y = { ...x };
          if (ev.etat === 'echec') y[ev.cle] = messageClair(ev.erreur, ''); else delete y[ev.cle];
          return y;
        });
        if (ev.etat === 'echec') {
          retour.echec();
          retour.annoncer(ev.cle === 'devis'
            ? 'Le brouillon n’a pas pu être enregistré.'
            : 'Une ligne n’a pas pu être enregistrée.');
        }
        if (ev.cle === 'devis' && ev.etat === 'enregistree') rangerRef.current();
      } else if (ev.type === 'totaux') {
        if (ev.totaux) setTotaux(ev.totaux);
        setTotauxIllisibles(false);
        rangerRef.current(ev.totaux);
      } else if (ev.type === 'totaux_illisibles') {
        setTotauxIllisibles(true);
      } else if (ev.type === 'renomme' && ev.quoi === 'ligne') {
        changerLignes((ls) => ls.map((l) => (l.id === ev.ancien ? { ...l, id: ev.nouveau } : l)));
        if (carteRef.current === ev.ancien) poserCarte(ev.nouveau);
      } else if (ev.type === 'supprimee' && ev.cle !== 'devis') {
        changerLignes((ls) => ls.filter((l) => l.id !== ev.cle));
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
        if (r.devis.client) setClientAffiche({ nom: r.devis.client.nom });
        lignesRef.current = vue.lignes;
        setLignes(vue.lignes);
        r.lignes.forEach((l) => { derniereEnvoyee.current[l.id] = l; });
        setTotaux({
          ht: r.devis.totalHtCentimes, tva: r.devis.totalTvaCentimes, ttc: r.devis.totalTtcCentimes,
          ventilation: r.ventilation || [],
        });
      } else {
        f = api.fileDuDevis({ devisId: devisIdInitial, devis: devisRef.current, horloge: 0 });
      }
      if (!vivant) return;
      fileRef.current = f;
      desabonner = f.abonner(ecouter);
      setEtats(f.etats());
      majAttente();
      setEtat('pret');
    })();
    return () => {
      vivant = false;
      if (desabonner) desabonner();
      /* La file est oubliée dès qu'elle n'a plus rien en vol — pas avant :
         une écriture partie finit, et rouvrir ce devis retrouve la MÊME. */
      if (fileRef.current) api.laisserFileDuDevis(fileRef.current.devisId());
    };
  }, [tentative]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const enregistrerEntete = (changements) => {
    const f = fileRef.current;
    if (!f) return { ok: false, refus: {} };
    const avant = devisRef.current;
    let recevables = { ...changements };
    const refus = {};
    for (let i = Object.keys(changements).length; i >= 0; i -= 1) {
      const v = validerDevis({ ...avant, ...recevables });
      if (v.ok) break;
      if (!Object.prototype.hasOwnProperty.call(recevables, v.champ)) { recevables = {}; break; }
      refus[v.champ] = messageDeContrainte(v.contrainte);
      delete recevables[v.champ];
    }
    poserRefusEntete(Object.keys(changements), refus);
    const ok = Object.keys(refus).length === 0;
    if (!ok) retour.echec();
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
    derniereEnvoyee.current[valeurs.id] = valeurs;
    f.ligne(valeurs);
    return true;
  };

  /* La carte ouverte : lue, puis enregistrée — ou oubliée si elle n'a jamais
     rien été. */
  const enregistrerCarte = () => {
    const id = carteRef.current;
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
    setClientAffiche({ nom: fiche.nom, ville: fiche.ville || null });
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
  /*  LA BASE DE POSTES — les deux feuilles que la carte demande          */
  /* ------------------------------------------------------------------ */
  /* « Ajouter à ma base » : ce que la feuille PROPOSE vient de la ligne
     (`posteDepuisLaLigne` : la phrase, l'unité, la fourniture, la
     main-d'œuvre et son prix comme prix de référence — jamais « Offert »,
     jamais la quantité, jamais le taux). Le lien d'origine n'est posé que
     si le devis est DÉJÀ en base à cet instant : aucune attente de la file. */
  const demanderAjout = (valeurs) => {
    const f = fileRef.current;
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
  /*  LA RETENUE, LA SUPPRESSION, LES TOTAUX                               */
  /* ------------------------------------------------------------------ */
  const changerRetenue = (centiemes, message) => {
    if (message) {
      /* Illisible (« abc ») : REFUSÉE, et la garde le saura. */
      poserRefusEntete(['retenueGarantieCentiemes'], { retenueGarantieCentiemes: messageDeContrainte('devis_retenue_check') });
      retour.echec();
      return;
    }
    if (centiemes === undefined) return;
    enregistrerEntete({ retenueGarantieCentiemes: centiemes });
  };

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
    const devisEnEchec = ['en_cours', 'echec'].includes(f.etatDe('devis'));
    return {
      ok: !incompletes.length && !enCours && !enEchec && !devisEnEchec && !enteteRefuse.length,
      incompletes, enCours, enEchec, nonEnregistrees: enCours + enEchec, devisEnEchec, enteteRefuse,
    };
  };

  /** Tout lire (la carte ouverte, l'en-tête, la retenue), tout envoyer, et
   *  attendre la file — huit secondes au plus. `pendantLAttente` : appelé
   *  AVANT d'attendre, si la file a quelque chose en vol. */
  const enregistrerTout = async ({ pendantLAttente = null } = {}) => {
    if (carteRef.current) fermerCarte();
    if (refEntete.current) refEntete.current.enregistrer();
    if (refBas.current) refBas.current.enregistrer();
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

  /* « Corriger » : on reste, et la liste revient au champ refusé — en haut
     pour l'en-tête, en bas pour la retenue. */
  const corrigerEntete = () => {
    const g = gardeRef.current;
    const champ = g && g.enteteRefuse ? g.enteteRefuse[0] : null;
    repondreGarde(false);
    if (!refListe.current) return;
    if (champ === 'retenueGarantieCentiemes') refListe.current.scrollToEnd({ animated: true });
    else refListe.current.scrollToOffset({ offset: 0, animated: true });
  };

  /* « Quitter sans l'enregistrer » : ce qui a été refusé est abandonné EN LE
     SACHANT. */
  const abandonnerEntete = () => {
    const g = gardeRef.current;
    poserRefusEntete(Object.keys(refusEntete.current));
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
  const client = clientFiche ? { nom: clientFiche.nom, ville: clientFiche.ville } : clientAffiche;
  const nbIncompletes = lignes.filter((l) => !ligneVierge(l) && (erreurs[l.id] || etats[l.id] === 'locale')).length;
  const nbEchecs = Object.keys(etats).filter((id) => id !== 'devis' && etats[id] === 'echec').length;
  const nbNonEnregistrees = nbIncompletes + nbEchecs;
  const chiffrerPossible = Array.isArray(propositions) && propositions.length > 0;
  let suffixe = '';
  if (nbNonEnregistrees) suffixe = ` · ${nbNonEnregistrees} ${nbNonEnregistrees > 1 ? 'lignes non enregistrées' : 'ligne non enregistrée'}`;
  else if (attente.enCours) suffixe = ' · ligne en cours';

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
            postes={postesEtat === 'ok' ? postes : null}
            regime={regime}
            /* L'avertissement d'un nom de client lit la FICHE du carnet (son
               nom, son adresse, son téléphone) et le lieu des travaux. */
            client={clientFiche || client}
            lieu={{ adresse: devis.lieuAdresse || null }}
            onRanger={onRangerPoste}
            onRelire={relirePostes}
            onFermer={() => setFeuille(null)}
          />
        );
      case 'poste': {
        /* Le poste relu dans la base à chaque rendu : une relecture
           (« modifié entre-temps ») lui donne la date à jour. */
        const poste = (Array.isArray(postes) ? postes.find((p) => String(p.id) === String(feuille.poste.id)) : null) || feuille.poste;
        return (
          <FeuillePoste
            poste={poste}
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
      onChoisirClient={ouvrirChoixClient}
      onNouveauClient={nouveauClient}
      onMonEntreprise={() => onMonEntreprise('tva')}
      onRelireRegime={onRelireRegime}
    />
  );

  const bas = (
    <BasDuDevis
      ref={refBas}
      options={options}
      franchise={franchise}
      reel={reel}
      propositions={propositions}
      regimeEnEchec={regimeEnEchec}
      totaux={totaux}
      totauxIllisibles={totauxIllisibles}
      retenue={devis.retenueGarantieCentiemes == null ? null : devis.retenueGarantieCentiemes}
      erreurs={erreursEntete}
      onOuvrir={ouvrirCarte}
      onAjouter={ajouter}
      onRelireTotaux={relireTotaux}
      onRetenue={changerRetenue}
      onSupprimer={supprimer}
      confirmeSuppression={confirmeSuppression}
    />
  );

  return (
    <View style={s.ecran}>
      <FlatList
        ref={refListe}
        {...CLAVIER}
        keyboardDismissMode="on-drag"
        data={visibles}
        keyExtractor={(l) => String(l.id)}
        renderItem={({ item }) => (
          <RangeeLigne
            id={item.id}
            type={item.type}
            designation={item.designation}
            total={totalLigne(item)}
            offert={!!item.offert}
            fournitureNonComprise={!!item.fournitureNonComprise}
            quantite={item.quantiteMilliemes}
            unite={item.unite}
            prix={item.prixUnitaireCentimes}
            sousTotal={NIVEAU[item.type] ? sous[item.id] : null}
            etat={etats[item.id] || null}
            erreurTexte={etats[item.id] === 'echec' ? (phrasesEchec[item.id] || null) : null}
            incomplete={!!erreurs[item.id] || etats[item.id] === 'locale'}
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
        {!!attente.devisErreur && (
          <View style={s.bande}>
            <Text style={s.bandeTexte}>
              {`Le brouillon n’a pas pu être enregistré. ${typeof attente.devisErreur === 'object'
                ? messageClair(attente.devisErreur, '') : ''}`}
            </Text>
            <BtnOutline label="Réessayer" onPress={() => fileRef.current && fileRef.current.reessayer('devis')} />
          </View>
        )}
        {attente.retraitsEnEchec > 0 && (
          <View style={s.bande}>
            <Text style={s.bandeTexte}>
              {attente.retraitsEnEchec > 1
                ? `${attente.retraitsEnEchec} lignes retirées n’ont pas pu être supprimées : elles sont encore dans le devis.`
                : 'Une ligne retirée n’a pas pu être supprimée : elle est encore dans le devis.'}
            </Text>
            <BtnOutline label="Réessayer" onPress={() => fileRef.current && fileRef.current.reessayer()} />
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
              {`${garde.enteteRefuse.map((c) => `« ${NOMS_ENTETE[c] || c} »`).join(', ')} : ce que vous avez écrit n’est `
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
            <Text style={s.bandeTexte}>
              {[
                garde.enEchec > 1 ? `${garde.enEchec} lignes n’ont pas pu être enregistrées.` : null,
                garde.enEchec === 1 ? 'Une ligne n’a pas pu être enregistrée.' : null,
                /* EN COURS n'est pas REFUSÉE : l'envoi continue après le
                   départ, et il peut aboutir — dire « n'a pas pu » était faux
                   (relecture « données », I2). */
                garde.enCours > 1 ? `${garde.enCours} lignes ne sont pas encore enregistrées : l’envoi continue, mais rien ne garantit qu’il aboutira.` : null,
                garde.enCours === 1 ? 'Une ligne n’est pas encore enregistrée : l’envoi continue, mais rien ne garantit qu’il aboutira.' : null,
                !garde.enEchec && !garde.enCours ? 'Le brouillon n’a pas pu être enregistré.' : null,
              ].filter(Boolean).join(' ')}
            </Text>
            <View style={s.bandeBoutons}>
              <View style={s.moitie}>
                <BtnOutline label="Rester" onPress={() => repondreGarde(false)} />
              </View>
              <View style={s.moitie}>
                <BtnOutline label={garde.enEchec || !garde.enCours ? 'Quitter sans elles' : 'Quitter quand même'} onPress={() => repondreGarde(true)} />
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
            {reel ? 'Total TTC' : 'Total'}
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
  mention: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  illisibles: { gap: S.xs, marginTop: S.sm },
  replie: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE, marginTop: S.md },
  replieTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  conditions: { ...CARTE, padding: S.md, gap: S.sm },
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
