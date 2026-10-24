/**
 * LA CARTE D'UNE LIGNE DE DEVIS — elle prend l'écran le temps de la
 * modifier (lot 1, 22/10/2026).
 *
 * POURQUOI ELLE PREND L'ÉCRAN, et ne s'ouvre pas à sa place dans la liste
 * (tranché par le cahier du lot 1, après la critique « écran ») : fermer une
 * carte de 580 points pour en ouvrir une plus bas fait SAUTER la liste
 * d'autant ; sur un petit écran, clavier ouvert, ce qui suit le champ actif
 * (les pastilles, les suggestions) passe sous le clavier ; et le fenêtrage
 * d'une liste démonte ce qui sort de l'écran. Posée AU-DESSUS de la liste
 * (une vue, pas une `Modal` : aucune fenêtre iOS de plus), elle laisse la
 * liste montée en dessous — on revient exactement où l'on était.
 *
 * Ce qu'on perd, et qui est compensé : on ne voit plus les lignes voisines.
 * D'où le titre de la pièce et son SOUS-TOTAL en tête de carte.
 *
 * SA BARRE EST EN HAUT, FIXE, HORS DU DÉFILEMENT : « ‹ Devis » (enregistre
 * et ferme) et « Poste suivant » (enregistre, puis ouvre un poste neuf juste
 * après, dans la même pièce). En bas de la carte, ces deux actions seraient
 * sous le clavier pendant qu'on tape le prix.
 *
 * QUAND ELLE ENREGISTRE (la critique « écran », B1) : un champ quitté ; une
 * PASTILLE ou un INTERRUPTEUR touché — `CLAVIER` garde le clavier ouvert
 * sur un appui, donc le champ ne perd pas le focus, et au régime réel le
 * taux est souvent le dernier geste d'une ligne : sans ce déclencheur, il
 * n'aurait rien enregistré — ; une valeur posée par un appui (une surface,
 * une suggestion) ; la carte fermée. À chaque fois, la carte LIT tous ses
 * champs (`lire()`) : une pastille touchée pendant qu'on tape le prix
 * enregistre aussi le prix.
 *
 * LA BASE DE POSTES (lot P, 24/10/2026) — ce que la carte en montre, de
 * haut en bas, et pourquoi à cet endroit :
 *   - la LIGNE DE RÉFÉRENCE, AU-DESSUS de la quantité et du prix : « Votre
 *     prix de référence : 45,00 € / m², fixé le 14/10/2026. » Elle paraît
 *     dès que la ligne porte un poste de la base (même phrase à une
 *     variante d'écriture près, même unité, même fourniture), AVANT qu'on
 *     tape le prix — c'est là qu'elle sert. Clavier ouvert, elle reste
 *     au-dessus du champ que le défilement amène contre le clavier. Quand
 *     la phrase de la ligne ne s'écrit pas comme celle du poste, elle NOMME
 *     le poste (« … pour « Dépose fenêtre » … ») ;
 *   - le BLOC « base », juste SOUS le prix : l'écart (« Vous mettez
 *     52,00 € — c'est voulu ? ») et sa réponse « Changer ma référence » ;
 *     « Ce poste existe déjà dans votre base, sous « … ». » quand la ligne
 *     en est une variante, avec la sortie d'un faux rapprochement ;
 *     « Ajouter à ma base ». Une phrase DISCRÈTE, jamais une fenêtre, jamais
 *     un refus, jamais le rouge des refus ni l'orange : c'est une question,
 *     et l'écart peut être une décision.
 * La référence ne vit QUE dans la carte, jamais dans la liste du devis
 * (réponse du propriétaire du 23/10) : la liste est l'écran qu'on montre à
 * un client.
 *
 * TOUCHER « Ajouter à ma base » (ou « Changer ma référence », « Modifier »,
 * « Fixer le prix ») : la carte s'ENREGISTRE d'abord (le même travail que
 * quitter un champ), FERME le clavier — sur iOS, il resterait sinon attaché
 * au champ prix caché sous la feuille —, puis DEMANDE la feuille à la
 * saisie, qui tient l'UNIQUE état de feuille. La carte n'est pas une
 * `Modal` : il n'y en a jamais qu'une à l'écran.
 */
import React, {
  forwardRef, useImperativeHandle, useRef, useState,
} from 'react';
import {
  View, Text, Pressable, ScrollView, Keyboard, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne, surFond,
} from '../theme';
import { Pastille, Interrupteur, Montant } from './ui';
import ChampDesignation from './ChampDesignation';
import ChampMontant from './ChampMontant';
import { CLAVIER } from '../lib/clavier';
import { versCentimes } from '../lib/centimes';
import {
  UNITES, UNITE_MAIN_OEUVRE, tauxLisible, versMilliemes, milliemesEnSaisie, centimesEnSaisie,
  milliemesLisibles,
} from '../lib/devis';
import {
  etatDansLaBase, referenceDuPoste, ecartAuPoste, morceauxDeLaReference, morceauxDeLEcart, libelleEcart,
  libelleChangerReference, PHRASE_SORTIE, posteDeLaLigne, posteDepuisLaLigne, valeursDeLaProposition, prixAEcrire,
  changementDUnite,
} from '../lib/postes';

/* Ce qu'il manque à une ligne chiffrée, dit champ par champ : la phrase de
   la contrainte de forme (« une ligne chiffrée a une quantité, une unité… »)
   est juste, mais elle ne dit pas LAQUELLE manque. */
export const MANQUE = Object.freeze({
  quantiteMilliemes: 'Écrivez la quantité.',
  unite: 'Choisissez une unité.',
  prixUnitaireCentimes: 'Écrivez le prix — ou touchez « Offert ».',
  tauxTvaCentiemes: 'Choisissez un taux de TVA.',
});

const TITRES = { zone: 'Zone', piece: 'Pièce', reserve: 'Réserve', option: 'Option', poste: 'Poste' };

/** Le texte d'un prix dans son champ : une ligne offerte sans valeur reste VIDE. */
const prixEnSaisie = (l) => (l.offert && l.prixUnitaireCentimes === 0 ? '' : centimesEnSaisie(l.prixUnitaireCentimes));

const CarteLigne = forwardRef(function CarteLigne({
  ligne, franchise = false, tauxProposes = null, regimeEnEchec = false,
  piece = null, sousTotalPiece = null, sousTotalPropre = null,
  memoire = null, memoireEchec = false, onRelireMemoire = null, erreur = null, tauxHoraire = null, retrait = null,
  peutMonter = false, peutDescendre = false,
  /* La base de postes (lot P) : le tableau lu par `OpusApp` (le MÊME objet
     d'un rendu à l'autre : ses clés restent en cache, `postesPrepares`),
     l'état de sa lecture, la date de déclaration du régime de TVA (une
     référence fixée avant ne se compare plus, elle se vérifie), et les deux
     demandes de feuille, que la SAISIE exauce. */
  postes = null, postesEtat = 'vide', onRelirePostes = null, regimeDeclareLe = null,
  onAjouterALaBase = null, onOuvrirPoste = null,
  onEnregistrer, onFermer, onPosteSuivant, onPosteDansPiece, onMonter, onDescendre, onRetirer,
}, ref) {
  const refDesignation = useRef(null);
  const refQuantite = useRef(null);
  const refPrix = useRef(null);
  const refSol = useRef(null);
  const refMurs = useRef(null);
  const [confirmeRetrait, setConfirmeRetrait] = useState(false);
  /* « L'unité est passée de m² à forfait : la quantité 27 est restée,
     vérifiez-la. » — 27 m² à 900 € le forfait font sinon 24 300 € sans un
     mot. Posée par une proposition qui change l'unité d'une ligne qui a
     une quantité ; effacée dès que la quantité est retouchée ou qu'une
     unité est rechoisie. */
  const [phraseUnite, setPhraseUnite] = useState(null);

  const chiffree = ligne.type === 'poste' || ligne.type === 'option';
  const estPiece = ligne.type === 'piece';

  /* Tout ce que la carte porte À CET INSTANT : la ligne, plus le texte de
     chaque champ, lu et converti. Une saisie illisible (« 2,5,3 ») n'efface
     rien : elle part dans `erreurs`, et la ligne n'est pas envoyée. */
  const lire = () => {
    const v = { ...ligne };
    const erreurs = {};
    if (refDesignation.current) v.designation = refDesignation.current.lire();
    const nombre = (r, cle, conversion, resultat) => {
      if (!r.current) return;
      const lu = conversion(r.current.lire());
      if (lu.ok) v[cle] = lu[resultat];
      else erreurs[cle] = lu.message;
    };
    if (chiffree) {
      nombre(refQuantite, 'quantiteMilliemes', versMilliemes, 'milliemes');
      nombre(refPrix, 'prixUnitaireCentimes', versCentimes, 'centimes');
      /* « Offert », prix laissé vide : la ligne ne dit pas ce qu'elle offre,
         et c'est permis (0 avec « Offert »). Sans cette règle, le prix vide
         serait refusé comme manquant — et l'aide dit « laissez-le vide ». */
      if (v.offert && refPrix.current && !String(refPrix.current.lire()).trim()) v.prixUnitaireCentimes = 0;
    }
    if (estPiece) {
      nombre(refSol, 'surfaceSolMilliemes', versMilliemes, 'milliemes');
      nombre(refMurs, 'surfaceMursMilliemes', versMilliemes, 'milliemes');
    }
    return { valeurs: v, erreurs };
  };

  /** Enregistrer, avec un changement posé par un appui (une pastille, un interrupteur). */
  const enregistrer = (changement = {}) => {
    const lu = lire();
    onEnregistrer({ ...lu.valeurs, ...changement }, lu.erreurs);
  };

  useImperativeHandle(ref, () => ({ lire }));

  /* DEMANDER UNE FEUILLE : la carte s'enregistre (tout ce qu'elle porte, lu
     à l'instant), ferme le clavier, PUIS demande la feuille à la saisie —
     avec les valeurs lues, pas celles du dernier rendu : une désignation
     tapée sans quitter le champ en fait partie. */
  const versLaFeuille = (demander) => {
    const lu = lire();
    onEnregistrer(lu.valeurs, lu.erreurs);
    Keyboard.dismiss();
    demander(lu.valeurs);
  };
  /* La feuille d'un poste, pré-remplie avec le prix de la LIGNE
     (`avecLePrixDeLaLigne`) ou avec la référence du poste. Le poste est
     relu sur les valeurs lues : une phrase changée sans quitter le champ ne
     porte peut-être plus ce poste — alors rien ne s'ouvre, et le bloc se
     redessine sur la vraie ligne. */
  const ouvrirLePoste = (avecLePrixDeLaLigne) => versLaFeuille((v) => {
    const p = posteDeLaLigne(v, postes);
    if (!p || !onOuvrirPoste) return;
    onOuvrirPoste(p, avecLePrixDeLaLigne ? posteDepuisLaLigne(v).prixPropose : null);
  });

  const sous = (champ) => (erreur && erreur.champ === champ
    ? <Text style={s.erreur} accessibilityLiveRegion="polite">{erreur.message}</Text> : null);

  /* Les deux appuis de surface : une ligne au m² sous une pièce qui en a. */
  const surfaces = chiffree && ligne.unite === 'm2' && piece
    ? [['Sol', piece.surfaceSolMilliemes], ['Murs', piece.surfaceMursMilliemes]].filter(([, v]) => v != null)
    : [];

  const aLHeure = ligne.mainOeuvre && ligne.unite === 'h';
  const etiquetteQuantite = aLHeure ? 'Temps estimé' : 'Quantité';
  let etiquettePrix;
  if (aLHeure) etiquettePrix = franchise ? 'Taux horaire' : 'Taux horaire (HT)';
  else etiquettePrix = franchise ? 'Prix unitaire' : 'Prix unitaire HT';

  const titreBarre = estPiece ? (ligne.designation || 'Pièce') : (piece ? piece.designation : TITRES[ligne.type]);
  const sousTotalBarre = estPiece ? sousTotalPropre : sousTotalPiece;

  /* LA LIGNE DEVANT SA BASE — calculée sur la ligne ENREGISTRÉE (chaque
     champ quitté, chaque pastille l'enregistre). La référence et l'écart ne
     se disent que d'une base LUE : une base illisible ne montre pas une
     référence peut-être périmée, et le bloc se tait (l'échec et son
     « Réessayer » sont sous la désignation). */
  const base = chiffree ? etatDansLaBase(ligne, postes, postesEtat) : { etat: 'sans_objet', poste: null, sous: null };
  const lue = chiffree && postesEtat === 'ok';
  const reference = lue ? referenceDuPoste(ligne, postes, { regimeDeclareLe }) : null;
  const ecart = lue ? ecartAuPoste(ligne, postes, { regimeDeclareLe }) : null;
  const morceauxReference = reference ? morceauxDeLaReference(reference) : null;
  const morceauxEcart = ecart && !ecart.avantRegime ? morceauxDeLEcart(ecart) : null;
  let bloc = null;
  if (base.etat === 'dans_la_base') {
    let etatPoste = null;
    let pastille = null;
    if (reference && reference.avantRegime) {
      /* La ligne de référence dit déjà « vérifiez-le » : pas de question. */
      pastille = <Pastille label="Modifier" nom="Modifier le prix de référence de ce poste" onPress={() => ouvrirLePoste(false)} />;
    } else if (morceauxEcart) {
      etatPoste = (
        <Text style={s.aide} accessibilityLabel={libelleEcart(ecart)}>
          {morceauxEcart.avant}
          {morceauxEcart.prix != null && <Montant centimes={morceauxEcart.prix} enLigne style={s.aideMontant} />}
          {morceauxEcart.apres}
        </Text>
      );
      pastille = <Pastille label="Changer ma référence" nom={libelleChangerReference(ecart)} onPress={() => ouvrirLePoste(true)} />;
    } else if (reference) {
      if (!base.sous) etatPoste = <Text style={s.aide}>Dans votre base de postes.</Text>;
      pastille = <Pastille label="Modifier" nom="Modifier le prix de référence de ce poste" onPress={() => ouvrirLePoste(false)} />;
    } else {
      etatPoste = (
        <Text style={s.aide}>
          {base.sous ? 'Il n’a pas encore de prix de référence.' : 'Dans votre base, sans prix de référence.'}
        </Text>
      );
      pastille = <Pastille label="Fixer le prix" nom="Fixer le prix de référence de ce poste" onPress={() => ouvrirLePoste(true)} />;
    }
    bloc = (
      <View style={s.bloc}>
        {/* LES MOTS PROMIS AU PROPRIÉTAIRE, et la sortie d'un faux
            rapprochement : la ligne garde SA phrase (c'est elle qui ira au
            client), le poste garde la sienne. */}
        {!!base.sous && (
          <>
            <Text style={s.blocTexte}>{`Ce poste existe déjà dans votre base, sous « ${base.sous} ».`}</Text>
            <Text style={s.aide}>{PHRASE_SORTIE}</Text>
          </>
        )}
        {etatPoste}
        {!!pastille && <View style={s.pastilles}>{pastille}</View>}
      </View>
    );
  } else if (base.etat === 'ajoutable' && onAjouterALaBase) {
    bloc = (
      <View style={s.pastilles}>
        <Pastille
          label="Ajouter à ma base"
          nom="Ajouter cette ligne à ma base de postes"
          onPress={() => versLaFeuille((v) => onAjouterALaBase(v))}
        />
      </View>
    );
  }

  return (
    /* LA CARTE EST MODALE pour VoiceOver : sous elle, la liste est cachée,
       et le pied et les bandes de la saisie aussi — sans cela, « Réessayer »
       ou « Rester » restaient atteignables sous une vue opaque (relecture
       « écran » des étapes 4 à 7, C4). */
    <View style={s.ecran} accessibilityViewIsModal>
      {/* LA BARRE, fixe, toujours au-dessus du clavier. */}
      <View style={s.barre}>
        <Pressable
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer cette ligne et revenir au devis"
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <Text style={s.retourTexte}>‹ Devis</Text>
        </Pressable>
        <View style={s.milieu}>
          <Text style={s.barreTitre} numberOfLines={1}>{titreBarre || TITRES[ligne.type]}</Text>
          {(estPiece || piece) && <Montant centimes={sousTotalBarre} style={s.barreMontant} />}
        </View>
        {chiffree ? (
          /* Sur une OPTION, « suivant » ouvre une OPTION : le bouton le dit
             (relecture « écran » des étapes 4 à 7, C8). */
          <Pressable
            onPress={onPosteSuivant}
            accessibilityRole="button"
            accessibilityLabel={ligne.type === 'option'
              ? 'Enregistrer, puis ouvrir une option neuve juste après'
              : 'Enregistrer, puis ouvrir un poste neuf juste après'}
            style={({ pressed }) => [s.suivant, pressed && APPUI.plein]}
          >
            <Text style={s.suivantTexte}>{ligne.type === 'option' ? 'Option suivante' : 'Poste suivant'}</Text>
          </Pressable>
        ) : <View style={s.place} />}
      </View>

      <ScrollView
        {...CLAVIER}
        keyboardDismissMode="on-drag"
        contentContainerStyle={s.contenu}
      >
        <Text style={s.type}>{TITRES[ligne.type]}</Text>
        <Text style={s.etiquette}>
          {ligne.type === 'reserve' ? 'La réserve' : estPiece || ligne.type === 'zone' ? 'Le titre' : 'Désignation'}
        </Text>
        <ChampDesignation
          ref={refDesignation}
          defaut={ligne.designation || ''}
          idLigne={ligne.id}
          memoire={chiffree ? memoire : null}
          memoireEchec={chiffree && memoireEchec}
          onRelireMemoire={onRelireMemoire}
          postes={chiffree ? postes : null}
          postesEtat={chiffree ? postesEtat : 'sans_objet'}
          onRelirePostes={onRelirePostes}
          autoFocus={!ligne.designation}
          accessibilityLabel={estPiece ? 'Nom de la pièce' : 'Désignation de la ligne'}
          placeholder={estPiece ? 'Salle de bains' : ligne.type === 'zone' ? 'Rez-de-chaussée' : ligne.type === 'reserve'
            ? 'Sous réserve de l’état des supports' : 'Pose de faïence murale'}
          onBlur={() => enregistrer()}
          onChoisir={(sug) => {
            /* CE QU'UN APPUI RECOPIE : la phrase rangée, l'unité, la
               fourniture, la main-d'œuvre — et un prix SEULEMENT s'il y en a
               un (`prixAEcrire` rend `null` : « ne touchez pas au champ »).
               Une proposition sans prix ne vide jamais un prix déjà tapé.
               Jamais le taux, jamais « Offert », jamais la quantité. */
            const v = valeursDeLaProposition(sug);
            if (!v) return;
            const avant = lire().valeurs;
            const prix = prixAEcrire(v);
            if (prix !== null && refPrix.current) refPrix.current.ecrire(prix);
            const changement = {
              designation: v.designation, unite: v.unite,
              fournitureNonComprise: v.fournitureNonComprise, mainOeuvre: v.mainOeuvre,
            };
            if (prix !== null) changement.prixUnitaireCentimes = v.prixUnitaireCentimes;
            setPhraseUnite(changementDUnite(avant, { unite: v.unite }));
            enregistrer(changement);
            /* La main passe à la QUANTITÉ : c'est le seul nombre qui dépend
               du chantier. */
            if (refQuantite.current) refQuantite.current.focus();
          }}
        />
        {sous('designation')}

        {chiffree && (
          <>
            {/* L'UNITÉ AVANT LA QUANTITÉ : c'est elle qui fait apparaître les
                appuis de surface, et ils ne doivent pas surgir au-dessus de
                ce qu'on vient de toucher. */}
            <Text style={s.etiquette}>Unité</Text>
            <View style={s.pastilles}>
              {UNITES.map((u) => (
                <Pastille
                  key={u.cle}
                  label={u.pastille}
                  nom={u.nom}
                  choisie={ligne.unite === u.cle}
                  onPress={() => { setPhraseUnite(null); enregistrer({ unite: u.cle }); }}
                />
              ))}
            </View>
            {sous('unite')}
            {!!phraseUnite && <Text style={s.aide} accessibilityLiveRegion="polite">{phraseUnite}</Text>}

            {/* LE TAUX, au régime réel seulement : rien de coché sur la
                première ligne, celui de la précédente ensuite. En franchise,
                aucun taux — c'est la mention de franchise qui parle. */}
            {!!tauxProposes && tauxProposes.length > 1 && (
              <>
                <Text style={s.etiquette}>Taux de TVA</Text>
                <View style={s.pastilles}>
                  {tauxProposes.map((t) => (
                    <Pastille
                      key={t}
                      label={tauxLisible(t)}
                      nom={`TVA à ${tauxLisible(t)}`}
                      choisie={ligne.tauxTvaCentiemes === t}
                      onPress={() => enregistrer({ tauxTvaCentiemes: t })}
                    />
                  ))}
                </View>
              </>
            )}
            {franchise && ligne.tauxTvaCentiemes != null && ligne.tauxTvaCentiemes !== 0 && (
              <View style={s.pastilles}>
                <Text style={s.aide}>Cette ligne porte un taux de TVA : en franchise, vous n’en facturez pas.</Text>
                <Pastille label="Retirer la TVA" onPress={() => enregistrer({ tauxTvaCentiemes: 0 })} />
              </View>
            )}
            {regimeEnEchec && <Text style={s.aide}>Votre régime de TVA n’a pas pu être lu : le taux attend.</Text>}
            {!!tauxProposes && tauxProposes.length === 0 && (
              <Text style={s.aide}>Déclarez votre régime de TVA dans « Mon entreprise » pour choisir un taux.</Text>
            )}
            {sous('tauxTvaCentiemes')}

            {/* LA RÉFÉRENCE, AU-DESSUS DU PRIX : elle se lit avant qu'on le
                tape. Le montant par `Montant` (chiffres alignés, à l'encre
                du texte), le reste en gris — une phrase discrète. */}
            {!!morceauxReference && (
              <Text style={s.aide}>
                {morceauxReference.avant}
                {morceauxReference.prix != null && <Montant centimes={morceauxReference.prix} enLigne style={s.aideMontant} />}
                {morceauxReference.apres}
              </Text>
            )}

            {/* QUANTITÉ ET PRIX CÔTE À CÔTE : chacun environ 140 points à 320
                de large, assez pour « 99 999 999,99 ». */}
            <View style={s.deux}>
              <View style={s.moitie}>
                <Text style={s.etiquette}>{etiquetteQuantite}</Text>
                <ChampMontant
                  ref={refQuantite}
                  defaut={milliemesEnSaisie(ligne.quantiteMilliemes)}
                  placeholder="1"
                  accessibilityLabel={etiquetteQuantite}
                  onBlur={() => { setPhraseUnite(null); enregistrer(); }}
                />
              </View>
              <View style={s.moitie}>
                <Text style={s.etiquette}>{etiquettePrix}</Text>
                <ChampMontant
                  ref={refPrix}
                  defaut={prixEnSaisie(ligne)}
                  placeholder="0,00"
                  accessibilityLabel={etiquettePrix}
                  onBlur={() => enregistrer()}
                />
              </View>
            </View>
            {sous('quantiteMilliemes')}
            {sous('prixUnitaireCentimes')}
            {/* LE BLOC « BASE », JUSTE SOUS LE PRIX — visible sans glisser,
                clavier fermé. */}
            {bloc}
            {surfaces.length > 0 && (
              <View style={s.pastilles}>
                {surfaces.map(([nom, v]) => (
                  <Pastille
                    key={nom}
                    label={`${nom} ${milliemesLisibles(v)} m²`}
                    nom={`${nom === 'Sol' ? 'Surface du sol' : 'Surface des murs'} : ${milliemesLisibles(v)} mètres carrés`}
                    onPress={() => {
                      if (refQuantite.current) refQuantite.current.ecrire(milliemesEnSaisie(v));
                      enregistrer({ quantiteMilliemes: v });
                    }}
                  />
                ))}
              </View>
            )}
            {aLHeure && !!tauxHoraire && <Text style={s.aide}>{tauxHoraire.phrase}</Text>}

            <View style={s.interrupteurs}>
              <Interrupteur
                actif={!!ligne.mainOeuvre}
                libelle="Main-d’œuvre"
                aide="À l’heure : écrivez le temps estimé dans la quantité. Un prix au m² ou au mètre est un prix forfaitaire : il convient aussi."
                onPress={() => {
                  const allume = !ligne.mainOeuvre;
                  const changement = { mainOeuvre: allume };
                  if (allume && !ligne.unite) changement.unite = UNITE_MAIN_OEUVRE;
                  /* Le taux horaire déclaré n'est PROPOSÉ qu'en franchise, et
                     seulement dans un prix encore vide ; au régime réel il
                     est MONTRÉ, jamais converti. */
                  if (allume && tauxHoraire && tauxHoraire.valeur != null && refPrix.current
                    && !String(refPrix.current.lire()).trim()) {
                    refPrix.current.ecrire(centimesEnSaisie(tauxHoraire.valeur));
                  }
                  enregistrer(changement);
                }}
              />
              <Interrupteur
                actif={!!ligne.fournitureNonComprise}
                libelle="Fourniture non comprise"
                aide="Le client achète lui-même ce qui est posé : la ligne ne chiffre que le travail."
                onPress={() => enregistrer({ fournitureNonComprise: !ligne.fournitureNonComprise })}
              />
              <Interrupteur
                actif={!!ligne.offert}
                libelle="Offert"
                aide="Le prix reste écrit : il dit ce que vous offrez. Laissez-le vide si vous ne voulez pas l’indiquer."
                onPress={() => enregistrer({ offert: !ligne.offert })}
              />
            </View>
          </>
        )}

        {estPiece && (
          <>
            <Text style={s.etiquette}>Surfaces de la pièce (facultatif)</Text>
            <View style={s.deux}>
              <View style={s.moitie}>
                <Text style={s.etiquette}>Sol (m²)</Text>
                <ChampMontant
                  ref={refSol}
                  defaut={milliemesEnSaisie(ligne.surfaceSolMilliemes)}
                  placeholder="17"
                  accessibilityLabel="Surface du sol, en mètres carrés"
                  onBlur={() => enregistrer()}
                />
              </View>
              <View style={s.moitie}>
                <Text style={s.etiquette}>Murs (m²)</Text>
                <ChampMontant
                  ref={refMurs}
                  defaut={milliemesEnSaisie(ligne.surfaceMursMilliemes)}
                  placeholder="42,5"
                  accessibilityLabel="Surface des murs, en mètres carrés"
                  onBlur={() => enregistrer()}
                />
              </View>
            </View>
            {sous('surfaceSolMilliemes')}
            {sous('surfaceMursMilliemes')}
            <View style={s.pastilles}>
              <Pastille label="Ajouter un poste dans cette pièce" onPress={onPosteDansPiece} />
            </View>
          </>
        )}
        {sous('type')}

        {/* MONTER / DESCENDRE, deux pastilles : pas de glisser-déposer, qui
            ajouterait un geste concurrent du défilement. */}
        <View style={s.pastilles}>
          <Pastille label="Monter" nom="Monter cette ligne" disabled={!peutMonter} onPress={onMonter} />
          <Pastille label="Descendre" nom="Descendre cette ligne" disabled={!peutDescendre} onPress={onDescendre} />
        </View>

        {/* RETIRER, EN DEUX APPUIS — et sur un titre, le second DIT ce qui
            va se passer pour les lignes qu'il porte. */}
        <View style={s.retrait}>
          <Pressable
            onPress={() => {
              if (!confirmeRetrait) { setConfirmeRetrait(true); return; }
              onRetirer(false);
            }}
            accessibilityRole="button"
            accessibilityLabel={confirmeRetrait ? 'Confirmer : retirer cette ligne' : 'Retirer cette ligne'}
            style={({ pressed }) => [s.action, confirmeRetrait && s.actionDanger, pressed && APPUI.plein]}
          >
            <Text style={[s.actionTexte, confirmeRetrait && s.actionDangerTexte]}>
              {confirmeRetrait ? 'Confirmer le retrait' : 'Retirer cette ligne'}
            </Text>
          </Pressable>
          {confirmeRetrait && !!retrait && !!retrait.phrase && <Text style={s.aide}>{retrait.phrase}</Text>}
          {confirmeRetrait && !!retrait && retrait.nb > 0 && (
            <Pressable
              onPress={() => onRetirer(true)}
              accessibilityRole="button"
              accessibilityLabel={`Retirer ce titre et ses ${retrait.nb} lignes`}
              style={({ pressed }) => [s.action, pressed && APPUI.plein]}
            >
              <Text style={s.actionTexte}>
                {`Retirer ${estPiece ? 'la pièce' : 'la zone'} et ${retrait.nb > 1 ? `ses ${retrait.nb} lignes` : 'sa ligne'}`}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

export default CarteLigne;

const s = StyleSheet.create({
  /* Elle PREND L'ÉCRAN : posée au-dessus de la liste, fond opaque. */
  ecran: { ...StyleSheet.absoluteFillObject, backgroundColor: C.surface, zIndex: 20 },
  barre: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.sm, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  retour: { minHeight: TOUCHE, minWidth: TOUCHE, justifyContent: 'center', paddingHorizontal: S.sm },
  retourTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  milieu: { flex: 1, minWidth: 0, alignItems: 'center' },
  barreTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  barreMontant: { fontSize: T.petit, color: C.muted, textAlign: 'center' },
  /* « Poste suivant » FLOTTE : arrondi, et l'orange de signature porte son
     encre (`C.surAccent`, 4,92 : 1). */
  suivant: {
    minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: S.md,
    backgroundColor: C.accent, borderRadius: R.gelule,
  },
  suivantTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.surAccent },
  place: { minWidth: TOUCHE },
  contenu: { padding: S.lg, paddingBottom: S.xxl * 3, gap: S.xs },
  type: { fontFamily: F.oswald6, fontSize: T.petit, color: C.muted, letterSpacing: 0.5 },
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, marginTop: S.md, marginBottom: S.xs },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.sm },
  deux: { flexDirection: 'row', gap: S.sm },
  moitie: { flex: 1, minWidth: 0 },
  interrupteurs: { gap: S.sm, marginTop: S.md },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* Le montant d'une phrase d'aide : à l'encre du texte, chiffres alignés. */
  aideMontant: { fontSize: T.petit, color: C.ink },
  /* Le bloc « base » : de la STRUCTURE posée sous le prix, sans fond ni
     couleur d'alerte — c'est une question, pas un refus. */
  bloc: { gap: S.xs, marginTop: S.sm },
  blocTexte: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit) },
  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit), marginTop: S.xs },
  retrait: { marginTop: S.xl, gap: S.sm, borderTopWidth: 1, borderTopColor: C.line, paddingTop: S.md },
  action: {
    minHeight: TOUCHE, justifyContent: 'center', paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.line, borderRadius: R.doux,
  },
  actionTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  actionDanger: { backgroundColor: C.bad, borderColor: C.bad },
  actionDangerTexte: { color: surFond(C.bad) },
});
