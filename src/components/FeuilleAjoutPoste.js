/**
 * « AJOUTER À MA BASE » — la feuille qui range une ligne de devis dans la
 * base de postes de l'artisan (lot P du module devis, 24/10/2026).
 *
 * CE QU'ELLE FAIT, ET CE QU'ELLE NE FAIT PAS
 * ------------------------------------------
 * Un poste n'entre dans la base que par l'appui de l'artisan — c'est sa
 * réponse du 23/10 (« d'un appui »), et rien d'autre n'appelle
 * `ajouterPoste`. La feuille MONTRE la phrase, mot pour mot, sans champ
 * pour la corriger : c'est la phrase de la ligne, celle qui ira au client ;
 * la corriger ici détacherait le poste de la ligne ouverte. On la corrige
 * dans la ligne, avant, ou plus tard dans « Ma base de postes ».
 *
 * Elle PROPOSE le prix de la ligne comme prix de référence (sa réponse du
 * 23/10), modifiable avant de valider, et laissable vide (« à fixer plus
 * tard »). Le champ ne prend PAS le focus à l'ouverture : le pavé décimal
 * monterait et cacherait le bouton.
 *
 * DEUX ÉTATS, ET UN SEUL SE VOIT : « saisie » et « ce poste existe déjà ».
 * Lequel, c'est `etatDeLaFeuilleAjout()` (`postes.js`, que `verifier-postes`
 * fait tourner), RECALCULÉ À CHAQUE RENDU : une base
 * relue entre-temps (le résultat d'un ajout parti plus tôt, un autre
 * appareil, ou la relecture qui suit un refus 23505) fait passer la feuille
 * ouverte à « existe déjà » d'elle-même. Dans cet état, elle change
 * ELLE-MÊME le prix de référence du poste existant (`modifierPoste`, sous
 * condition sur la date lue) : elle n'ouvre JAMAIS la feuille d'un poste.
 * Deux `Modal` empilées laissent sur l'iPhone un voile invisible qui avale
 * les touches — le « je suis bloqué » du 04/10 — et `react-native-web`
 * n'a pas ce défaut, donc aucune mesure au navigateur ne le verrait : c'est
 * une règle de construction. Et AUCUN bouton n'y crée un second poste, ni
 * n'y remplace la phrase du poste par celle de la ligne : la phrase d'un
 * poste est une décision de l'artisan, elle ne dérive pas au gré des fautes
 * de frappe.
 *
 * UNE REQUÊTE PARTIE NE S'ARRÊTE PAS QUAND LA FEUILLE SE FERME (le voile,
 * la croix, la garde de sortie de la saisie) : son résultat est rangé
 * quand même dans l'état d'`OpusApp` (`onRanger`), et DIT
 * (`retour.annoncer`). Un travail fait ne doit pas passer inaperçu parce
 * qu'on a fermé la fenêtre pendant qu'il se faisait.
 *
 * DANS SON PROPRE FICHIER, rendue par la saisie : `verifier-feuilles` juge
 * PAR FICHIER, et une feuille du bas (`FeuilleBas`, qui monte avec le
 * clavier) ne se cumule jamais avec `{...CLAVIER}`.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F, T, S, interligne } from '../theme';
import FeuilleBas from './FeuilleBas';
import ChampMontant from './ChampMontant';
import { BtnMain, BtnOutline, Montant } from './ui';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import { messageClair, messageDeContrainte, ErreurPoste } from '../lib/erreurs';
import { versCentimes } from '../lib/centimes';
import { centimesEnSaisie } from '../lib/devis';
import {
  etatDeLaFeuilleAjout, posteExistant, postesProches, phraseProche, indicesDuClient, phraseIndices, ligneDescriptive,
  etiquettePrixReference, validerPoste, phrasePrixDuPoste, coupeAutourDuPrix, PHRASE_SORTIE, issueDuModifieEntreTemps,
} from '../lib/postes';

/* Une phrase qui porte un montant : le montant par `Montant` (chiffres
   alignés, à l'encre du texte), le reste dans le style de la phrase.
   Déclarée au niveau du MODULE : écrite dans le rendu, ce serait un type de
   composant neuf à chaque frappe. */
function Phrase({ morceaux, style }) {
  if (!morceaux || (!morceaux.avant && morceaux.prix == null)) return null;
  return (
    <Text style={style}>
      {morceaux.avant}
      {morceaux.prix != null && <Montant centimes={morceaux.prix} enLigne style={s.montant} />}
      {morceaux.apres}
    </Text>
  );
}

export default function FeuilleAjoutPoste({
  valeurs, devisOrigineId = null, postes = null, regime = null, client = null, lieu = null,
  onRanger, onRelire, onFermer,
}) {
  const refPrix = useRef(null);
  /* LA GARDE PAR RÉFÉRENCE, en plus du bouton désactivé : deux appuis dans
     la même image partiraient deux fois — un bouton n'est désactivé que par
     un état, qui n'a pas encore changé. */
  const enVol = useRef(false);
  /* La feuille est-elle encore à l'écran ? Une réponse qui arrive après sa
     fermeture est rangée et dite, mais ne referme rien : une AUTRE feuille
     a pu s'ouvrir entre-temps. */
  const vivant = useRef(true);
  useEffect(() => () => { vivant.current = false; }, []);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [echecEnvoi, setEchecEnvoi] = useState(false);
  /* LE PRIX QUE LA FEUILLE PORTE (T) : celui de la ligne à l'ouverture,
     puis ce que l'artisan a validé ou laissé dans le champ. Si la feuille
     passe à « existe déjà », c'est LUI qui décide : égal à la référence du
     poste, il n'y a rien à changer ; sinon, le champ le garde — jamais le
     prix de la ligne, que l'artisan a pu corriger. */
  const [prixTape, setPrixTape] = useState(valeurs && valeurs.prixPropose != null ? valeurs.prixPropose : null);
  /* L'ARTISAN EST EN TRAIN DE TAPER UN PRIX (ECRAN4) : une lettre tapée au
     doigt depuis que le prix porté a été fixé. Tant que c'est vrai, le prix
     porté n'est pas connu — si la base arrive à ce moment-là, la feuille
     garde le champ (et ce qui y est tapé) au lieu de conclure « il a déjà ce
     prix ». */
  const [prixTouche, setPrixTouche] = useState(false);
  /* La base a refusé un doublon (23505), relue, et ne montre aucun poste de
     même clé : une application en retard d'une règle. */
  const [doublonInvisible, setDoublonInvisible] = useState(false);

  /* L'ÉTAT DE LA FEUILLE, décidé par `etatDeLaFeuilleAjout` — jamais ici. */
  const feuille = etatDeLaFeuilleAjout({ valeurs, postes, prixTape, prixTouche, doublonInvisible });
  const { existant } = feuille;

  const lirePrix = () => versCentimes(refPrix.current ? refPrix.current.lire() : '');
  const refuser = (message) => {
    setErreur(message);
    retour.echec();
  };
  /* LE PRIX PORTÉ DEVIENT CELUI DU CHAMP : l'artisan n'est plus « en train
     de taper », et la prochaine lettre le redira. */
  const porter = (centimes) => {
    setPrixTape(centimes);
    setPrixTouche(false);
    if (refPrix.current) refPrix.current.rearmer();
  };
  /* Le champ quitté, pendant la saisie : le prix porté change. */
  const surSortieDuPrix = () => {
    if (existant) return;
    const lu = lirePrix();
    if (lu.ok) porter(lu.centimes);
  };

  /* « AJOUTER À MA BASE » — l'état « saisie ». */
  const ajouter = async () => {
    if (enVol.current) return;
    const lu = lirePrix();
    if (!lu.ok) { refuser(lu.message); return; }
    porter(lu.centimes);
    const poste = {
      designation: valeurs.designation,
      unite: valeurs.unite,
      fournitureNonComprise: !!valeurs.fournitureNonComprise,
      mainOeuvre: !!valeurs.mainOeuvre,
      prixReferenceCentimes: lu.centimes,
    };
    const v = validerPoste(poste);
    if (!v.ok) { refuser(messageDeContrainte(v.contrainte)); return; }
    enVol.current = true;
    setEnvoi(true);
    setErreur(null);
    setEchecEnvoi(false);
    try {
      /* AUCUNE ATTENTE DE LA FILE DU DEVIS : le lien d'origine n'est posé
         que si le devis était DÉJÀ en base à l'appui (`devisOrigineId`,
         décidé par la saisie). L'origine n'est qu'une information. */
      const pose = await api.ajouterPoste(poste, { devisOrigineId });
      onRanger(pose);
      retour.reussite();
      retour.annoncer('Ajouté à votre base de postes.');
      if (vivant.current) onFermer();
    } catch (e) {
      if (String((e && e.code) || '') === '23505') {
        /* CE POSTE EXISTE DÉJÀ, presque mot pour mot : on RELIT la base, et
           la feuille le MONTRE (elle passe d'elle-même à « existe déjà »).
           La phrase de l'index ne sert qu'en dernier recours, si la
           relecture échoue. */
        const liste = await onRelire();
        if (!vivant.current) {
          retour.annoncer('Ce poste était déjà dans votre base de postes.');
        } else if (!liste) {
          refuser(messageClair(e, 'Pas enregistré'));
        } else if (!posteExistant(valeurs, liste)) {
          setDoublonInvisible(true);
        }
      } else if (vivant.current) {
        setEchecEnvoi(true);
        refuser(messageClair(e, 'Pas enregistré'));
      } else {
        retour.echec();
        retour.annoncer(messageClair(e, 'L’ajout à votre base de postes n’a pas pu se faire'));
      }
    } finally {
      enVol.current = false;
      if (vivant.current) setEnvoi(false);
    }
  };

  /* « CHANGER MA RÉFÉRENCE » / « FIXER LE PRIX » — l'état « existe déjà ».
     Le PRIX SEUL part : jamais la phrase de la ligne. */
  const changer = async () => {
    if (enVol.current || !existant) return;
    const lu = lirePrix();
    if (!lu.ok) { refuser(lu.message); return; }
    if (lu.centimes == null) { refuser('Écrivez un prix, ou touchez « Fermer ».'); return; }
    porter(lu.centimes);
    /* Le montant vaut déjà la référence : AUCUNE requête. */
    if (lu.centimes === existant.prixReferenceCentimes) {
      retour.annoncer('Il a déjà ce prix de référence.');
      onFermer();
      return;
    }
    const v = validerPoste({ ...existant, prixReferenceCentimes: lu.centimes });
    if (!v.ok) { refuser(messageDeContrainte(v.contrainte)); return; }
    enVol.current = true;
    setEnvoi(true);
    setErreur(null);
    try {
      /* SOUS CONDITION sur la date lue : un poste modifié entre-temps ne
         change pas, et ça se DIT. */
      const pose = await api.modifierPoste(existant.id, { prixReferenceCentimes: lu.centimes }, { modifieLe: existant.modifieLe });
      onRanger(pose);
      retour.reussite();
      retour.annoncer('Votre prix de référence est changé.');
      if (vivant.current) onFermer();
    } catch (e) {
      /* « Modifié entre-temps » : la base est relue, et la feuille se
         ré-évalue sur ce qu'elle contient vraiment — et la phrase dit ce que
         la relecture a rendu : relue ou non, le poste toujours là ou retiré
         (TEXTES5). */
      const message = e instanceof ErreurPoste
        ? issueDuModifieEntreTemps(await onRelire(), existant.id).phrase
        : messageClair(e, 'Pas enregistré');
      if (vivant.current) refuser(message);
      else {
        retour.echec();
        retour.annoncer(e instanceof ErreurPoste ? message : messageClair(e, 'Le prix de référence n’a pas pu être changé'));
      }
    } finally {
      enVol.current = false;
      if (vivant.current) setEnvoi(false);
    }
  };

  /* LE CHAMP DU PRIX : un seul, à la MÊME place et sous la MÊME clé dans
     les deux états — il garde donc ce qui y est tapé quand la feuille passe
     à « existe déjà ». */
  const champ = (poste) => [
    <Text key="etiquette-prix" style={s.etiquette}>{etiquettePrixReference(poste, regime)}</Text>,
    <ChampMontant
      key="prix"
      ref={refPrix}
      defaut={centimesEnSaisie(valeurs && valeurs.prixPropose)}
      placeholder="0,00"
      accessibilityLabel={etiquettePrixReference(poste, regime)}
      onBlur={surSortieDuPrix}
      surPremiereFrappe={() => setPrixTouche(true)}
    />,
    erreur ? <Text key="erreur" style={s.erreur} accessibilityLiveRegion="polite">{erreur}</Text> : null,
  ];

  let titre;
  let contenu;
  if (feuille.etat === 'invisible') {
    titre = 'Ce poste existe déjà';
    contenu = [
      <Text key="invisible" style={s.texte}>
        Votre base contient déjà un poste presque identique. Si vous ne le voyez pas dans « Ma base de postes », mettez Opus à jour.
      </Text>,
      <BtnOutline key="fermer" label="Fermer" onPress={onFermer} />,
    ];
  } else if (feuille.etat === 'existe') {
    /* LA DÉCISION D'ABORD, LES EXPLICATIONS ENSUITE (ECRAN10) : à 320 × 568,
       sur une ligne variante, « Changer ma référence » tombait sous le bord
       et « Fermer » hors de l'écran, sous quatre phrases d'explication. Le
       titre dit déjà « Ce poste existe déjà » : la ligne qui le redisait mot
       pour mot est partie (ECRAN8). */
    titre = 'Ce poste existe déjà';
    contenu = [
      <Text key="poste" style={s.texteFort}>{`Le poste : « ${existant.designation} »`}</Text>,
      <Text key="descriptive" style={s.aide}>{ligneDescriptive(existant)}</Text>,
    ];
    if (feuille.memePrix) {
      /* LE MÊME PRIX, et l'artisan n'y touche pas : il n'y a rien à décider —
         « Fermer », et rien d'autre. */
      contenu.push(
        <Phrase
          key="meme-prix"
          style={s.texte}
          morceaux={coupeAutourDuPrix(phrasePrixDuPoste(existant, 'Il a déjà ce prix de référence'), existant.prixReferenceCentimes, { dernier: true })}
        />,
      );
    } else {
      contenu.push(
        feuille.aUneReference ? (
          <Phrase
            key="sa-reference"
            style={s.texte}
            morceaux={coupeAutourDuPrix(phrasePrixDuPoste(existant, 'Son prix de référence'), existant.prixReferenceCentimes, { dernier: true })}
          />
        ) : <Text key="sans-reference" style={s.texte}>Il n’a pas encore de prix de référence.</Text>,
        ...champ(existant),
        <BtnMain
          key="changer"
          label={envoi ? 'Enregistrement…' : (feuille.action === 'changer' ? 'Changer ma référence' : 'Fixer le prix')}
          disabled={envoi}
          onPress={changer}
        />,
      );
    }
    contenu.push(<BtnOutline key="fermer" label="Fermer" onPress={onFermer} />);
    if (feuille.sous) {
      contenu.push(
        <Text key="ligne" style={s.texte}>{`Votre ligne : « ${valeurs.designation} »`}</Text>,
        <Text key="pourquoi" style={s.aide}>
          Opus la reconnaît comme la phrase de ce poste : majuscules, accents, espaces, ponctuation et pluriel mis à part.
        </Text>,
        <Text key="sortie" style={s.aide}>{PHRASE_SORTIE}</Text>,
      );
    }
  } else {
    titre = 'Ajouter à ma base';
    /* L'AVERTISSEMENT D'UN NOM DE CLIENT — jamais un refus : « M. Blanc » et
       « blanc cassé » font un faux positif, connu et accepté. */
    const avertissement = phraseIndices(indicesDuClient(valeurs.designation, { client: client || {}, lieu: lieu || {} }));
    const proche = postesProches(postes, valeurs)[0] || null;
    contenu = [
      <Text key="mot-pour-mot" style={s.etiquette}>Mot pour mot</Text>,
      <Text key="phrase" style={s.phrase}>{valeurs.designation}</Text>,
      <Text key="pour-tous" style={s.aide}>
        Cette phrase vous sera proposée telle quelle sur vos prochains devis, pour tous vos clients. N’y laissez ni le nom
        ni l’adresse d’un client : pour la corriger, corrigez d’abord la ligne, ou corrigez-la ensuite dans « Ma base de
        postes ».
      </Text>,
      avertissement ? (
        <View key="avertissement" style={s.avertissement}>
          <Text style={s.avertissementTexte}>{avertissement}</Text>
        </View>
      ) : null,
      <Text key="descriptive" style={s.aide}>{ligneDescriptive(valeurs)}</Text>,
      ...champ(valeurs),
      <Text key="aide-prix" style={s.aide}>
        C’est le prix que vous voulez retrouver sur vos prochains devis ? Corrigez-le si ce chantier était particulier.
        Laissez vide pour le fixer plus tard.
      </Text>,
      proche ? (
        <Phrase
          key="proche"
          style={s.aide}
          morceaux={coupeAutourDuPrix(phraseProche(proche, valeurs), proche.prixReferenceCentimes, { dernier: true })}
        />
      ) : null,
      <BtnMain
        key="ajouter"
        label={envoi ? 'Enregistrement…' : (echecEnvoi ? 'Réessayer' : 'Ajouter à ma base')}
        disabled={envoi}
        onPress={ajouter}
      />,
    ];
  }

  return (
    <FeuilleBas titre={titre} onFermer={onFermer}>
      {contenu}
    </FeuilleBas>
  );
}

const s = StyleSheet.create({
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, marginTop: S.xs },
  /* La phrase, EN ENTIER : c'est elle qui sera proposée sur tous les devis. */
  phrase: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  texte: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  texteFort: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  montant: { color: C.ink },
  /* L'avertissement : encre du texte, filet ORANGE DE LECTURE à gauche
     (`C.accentTexte`, 4,52 : 1 sur le fond) — l'orange de signature n'y
     donnerait que 2,76 : 1, sous le seuil d'un élément graphique. */
  avertissement: { borderLeftWidth: 3, borderLeftColor: C.accentTexte, paddingLeft: S.sm },
  avertissementTexte: { fontFamily: F.inter, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit) },
  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit) },
});
