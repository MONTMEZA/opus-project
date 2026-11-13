/**
 * LA CARTE « CONDITIONS » D'UN DEVIS — la réduction, l'acompte, la
 * validité, la retenue de garantie (lot 2a, 03/11/2026).
 *
 * ELLE EST FAITE EXACTEMENT COMME LA CARTE D'UNE LIGNE (`CarteLigne`) :
 * posée au-dessus de la liste, elle prend l'écran ; sa barre est en HAUT,
 * fixe, hors du défilement (« ‹ Devis » enregistre et ferme), et le contenu
 * défile avec `CLAVIER` — sous le clavier de l'iPhone, une barre du bas
 * serait cachée pendant qu'on tape. Une carte, pas une `Modal` : la saisie
 * tient UN état de carte (`carte`), et il n'y en a jamais deux.
 *
 * QUAND ELLE ENREGISTRE : un champ quitté ; une PASTILLE touchée (une nature,
 * une durée, l'interrupteur de la retenue) ; la carte fermée. À chaque fois,
 * elle LIT tous ses champs (`lireConditions`, `devis.js`) : une pastille
 * touchée pendant qu'on tape le montant enregistre aussi le montant.
 *
 * UNE PASTILLE D'UNITÉ (« % » / « € ») N'ÉCRIT RIEN (relecture ÉCRAN-9 du
 * lot 2a) : elle vide le champ, ou y remet la valeur enregistrée dans cette
 * unité, et la carte DIT la valeur qui reste (« Enregistrée : 10 % — écrivez
 * un montant en euros pour la remplacer »). Avant, « 10 % » puis « € »
 * enregistrait 10,00 € sans rien retaper : un appui par erreur changeait le
 * devis.
 *
 * LES PAIRES PARTENT ENSEMBLE (relecture BASE-2) : la réduction pose ses
 * DEUX colonnes en une écriture (`remiseCentiemes` ou `remiseCentimes`,
 * l'autre à `null`) ; l'acompte aussi, avec sa nature. Changer l'unité ne
 * passe donc jamais par un état que la base refuse (les deux formes à la
 * fois).
 *
 * LES MONTANTS AFFICHÉS SONT CEUX DE LA BASE (`totaux`, relus après chaque
 * écriture) : la carte ne calcule rien. Une réduction ou un acompte plus
 * grand que le total n'est jamais refusé — il est RAMENÉ, et la carte le dit
 * (à VoiceOver aussi). Mais « ramené » ne se juge que contre la demande que
 * la BASE a vue (`totaux.demande`) : tant que l'envoi n'est pas fini, la
 * carte dit « Calcul en cours… », et après un échec elle se tait — sa ligne
 * d'état, sous la barre, dit l'échec et « Réessayer » (relecture ÉCRAN-1 et
 * ÉCRAN-2 du lot 2a).
 *
 * Ce qui ne se lit pas (« 12,5,3 ») n'est pas envoyé : `lire()` le rend dans
 * `erreurs`, avec le TEXTE tapé (`textes`), que la saisie garde pour qu'une
 * carte rouverte par « Corriger » le montre encore.
 *
 * OUVERTE DEPUIS « POUR LE REMETTRE » (lot 2b-1, critique E-13) : la carte
 * s'ouvre SUR LE CHAMP qui manque (`champInitial` : la réduction, l'acompte,
 * sa nature, la validité) — mesuré, la validité était à y = 1 132 à
 * l'ouverture, hors de l'écran sur les trois tailles —, et son retour dit
 * qu'il ramène à la LISTE (`depuisLaListe`), où la saisie la rouvre. Le
 * défilement se pose une fois, quand le titre du champ a sa place : avant,
 * on ne sait pas où il est.
 *
 * QUAND LE CLIENT PAIE L'ACOMPTE (lot 2b-3, réponse P2 du 12/11, cahier
 * §3.7, annexe A.4) : sous « Acompte ou arrhes ? », deux pastilles — « Dès
 * le 8e jour (par défaut) » et « À la signature » —, TOUJOURS montrées,
 * acompte ou non : montrées avec l'acompte seulement, elles naissaient sous
 * la pastille touchée et poussaient « Validité » d'environ 90 points (E-I2).
 * Rien n'est choisi d'office : vide, Opus compte le 8e jour. Elles écrivent
 * par la VOIE UNIQUE de la carte (`etatInitialConditions` → `choisir` →
 * `lireConditions`) : un choix qui ne passait pas par elle repartait vide à
 * la fermeture, en silence (E-B1). Sous elles, quand « À la signature » est
 * choisi, qu'un acompte est posé et que la règle ne le permet pas, UNE
 * phrase dit la première cause (`pourquoiPasALaSignature`) — jamais un
 * bouton qui proposerait de marquer des lignes « urgentes » : une marque
 * fausse, c'est la nullité et le pénal. L'aide de l'échéance ne bouge pas :
 * elle reste juste après.
 */
import React, {
  forwardRef, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import {
  Pastille, Interrupteur, Montant, BtnOutline,
} from './ui';
import ChampMontant from './ChampMontant';
import { CLAVIER } from '../lib/clavier';
import * as retour from '../lib/retour';
import {
  NATURES_ACOMPTE, VALIDITES_PROPOSEES, PHRASE_RETENUE,
  aidesDeLAcompte, AIDE_REDUCTION, AIDE_ACOMPTE, AIDE_VALIDITE, AIDE_RETENUE,
  ECHEANCE_DE_L_ACOMPTE, pastillesDeLEcheance, pourquoiPasALaSignature,
  centiemesEnSaisie, rangeesDesTotaux, effetDeLaReduction, effetDeLAcompte, libelleAcompte,
  etatInitialConditions, lireConditions, texteEnregistreDans, phraseUniteEnAttente, libellesDesConditions,
  ligneDEtatDeLaCarte,
} from '../lib/devis';

const present = (v) => v !== null && v !== undefined;

/* Le texte d'un champ à l'ouverture : celui que la saisie a gardé (un texte
   refusé, rouvert par « Corriger »), sinon la valeur enregistrée. Un texte
   gardé VIDE n'a rien à corriger : la valeur enregistrée. */
const texteDe = (textes, cle, valeur) => (textes && present(textes[cle]) && String(textes[cle]).trim() !== ''
  ? textes[cle] : valeur);

const ConditionsDevis = forwardRef(function ConditionsDevis({
  devis = {}, totaux = null, regime, nbOptions = 0, erreurs = {}, textes = null,
  etatEcriture = null, totauxIllisibles = false, onReessayer, onRelireTotaux,
  onEnregistrer, onFermer, champInitial = null, depuisLaListe = false,
  /* 2b-2 : ce que l'ÉCRAN sait du client et du chantier — la réponse « à quel
     titre » VALABLE, le « Oui » à la première question du chantier, et la
     date que la BASE en a posée. Les aides de l'acompte les suivent
     (`aidesDeLAcompte`) : ce sont des aides, pas des comptes. */
  reponseATitre = null, chantierNeufConso = null, chantierNeufConsoLe = null,
  /* 2b-3 : les lignes de l'ÉCRAN, et si toutes ses lignes chiffrées sont
     marquées « réparation urgente » (`toutUrgent`, calculé par la saisie) —
     pour l'aide de l'échéance et la ligne « pourquoi ». Le motif, lui, lit
     les lignes de la BASE : l'écart est transitoire, et « Non enregistrée »
     se voit sur la ligne. */
  toutUrgent = false, lignes = [],
}, ref) {
  const refReduction = useRef(null);
  const refAcompte = useRef(null);
  const refValidite = useRef(null);
  const refRetenue = useRef(null);
  /* LE CHAMP SUR LEQUEL LA CARTE S'OUVRE (lot 2b-1) : le défilement, et la
     place de chaque titre dans le contenu, relevée à sa mise en page. Le
     défilement se pose UNE fois — après, c'est l'artisan qui défile. */
  const refDefile = useRef(null);
  const place = useRef(false);
  const ancre = (cle) => (e) => {
    if (place.current || cle !== champInitial || !refDefile.current) return;
    place.current = true;
    refDefile.current.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - S.md), animated: false });
  };

  /* Les choix faits d'un appui : une RÉFÉRENCE (lue par `lire()` dans la
     même boucle que l'appui) ET un état (pour le dessin). L'état de départ
     vient de `etatInitialConditions` (`devis.js`, que `verifier-devis` fait
     tourner) : sur un devis vierge, RIEN n'est choisi à la place de
     l'artisan ; rouverte par « Corriger », la carte reprend ses choix
     (relecture CONTROLES-2, ÉCRAN-3, ÉCRAN-4 du lot 2a). */
  const [initial] = useState(() => etatInitialConditions(devis, textes));
  const choix = useRef(initial);
  const [c, setC] = useState(initial);
  const poser = (x) => { choix.current = { ...choix.current, ...x }; setC(choix.current); };

  /* TOUT CE QUE LA CARTE PORTE À CET INSTANT — la règle vit dans
     `lireConditions` (`devis.js`). Un champ PAS ENCORE MONTÉ (on vient de
     toucher « Autre », ou d'allumer la retenue) se lit `undefined` : il
     naîtra avec la valeur enregistrée, et c'est elle qui part. Les choix
     sont ceux DU MOMENT, pas ceux du dernier rendu : un appui pose son choix
     PUIS enregistre, dans la même boucle. */
  const lire = () => {
    const lu = (r) => (r.current ? r.current.lire() : undefined);
    return lireConditions({
      choix: choix.current,
      tapes: {
        reduction: lu(refReduction), acompte: lu(refAcompte), validite: lu(refValidite), retenue: lu(refRetenue),
      },
      devis,
    });
  };

  /* `geste` : le champ quitté ou la pastille touchée — la saisie ne vibre
     que pour SA faute (relecture ÉCRAN-13). Les choix partent avec les
     textes : la saisie les garde tant qu'une valeur est refusée. */
  const enregistrer = (geste = 'fermer') => {
    const l = lire();
    if (onEnregistrer) onEnregistrer(l.changements, l.erreurs, { ...l.textes, choix: choix.current }, geste);
    return l;
  };
  useImperativeHandle(ref, () => ({ lire, enregistrer }));

  /* Un APPUI change un choix, PUIS la carte s'enregistre entière. */
  const choisir = (x, geste) => { poser(x); enregistrer(geste); };

  /* UNE PASTILLE D'UNITÉ N'ÉCRIT RIEN DE CE QUI EST TAPÉ (ÉCRAN-9) : le champ
     prend la valeur enregistrée DANS CETTE UNITÉ, ou se vide ; un champ vide
     dans une autre unité que la valeur enregistrée ne dit rien
     (`lireConditions`), et la valeur reste. L'enregistrement qui suit ne
     relit que les AUTRES champs — et efface le refus d'un texte qu'on vient
     d'abandonner en changeant d'unité. */
  const changerUnite = (prefixe, unite) => {
    const cle = prefixe === 'remise' ? 'uniteReduction' : 'uniteAcompte';
    if (choix.current[cle] === unite) return;
    poser({ [cle]: unite });
    const champ = prefixe === 'remise' ? refReduction : refAcompte;
    if (champ.current) champ.current.ecrire(texteEnregistreDans(devis, prefixe, unite));
    enregistrer('unite');
  };

  const sous = (...cles) => {
    const cle = cles.find((k) => erreurs && erreurs[k]);
    return cle ? <Text style={s.erreur} accessibilityLiveRegion="polite">{erreurs[cle]}</Text> : null;
  };

  const noms = libellesDesConditions(regime, c.nature);
  const aides = aidesDeLAcompte({ reponse: reponseATitre, chantierNeufConso, chantierNeufConsoLe, toutUrgent });
  /* LA LIGNE « POURQUOI » (2b-3, E-I7) : « À la signature » choisi, un
     acompte posé, et la règle ne le permet pas — la même règle que le point
     de la liste et que l'aide (`signaturePermise`). Sans acompte, rien : le
     motif ne sort pas non plus. */
  const acomptePose = present(devis.acompteCentiemes) || present(devis.acompteCentimes);
  const pourquoi = c.echeance === true && acomptePose
    ? pourquoiPasALaSignature({ reponse: reponseATitre, chantierNeufConso, lignes }) : null;
  const [pastilleHuitieme, pastilleSignature] = pastillesDeLEcheance(c.echeance);
  const rangees = rangeesDesTotaux(totaux, regime, { nbOptions });
  const total = rangees.find((r) => r.cle === 'total');
  const reste = rangees.find((r) => r.cle === 'reste');
  /* APRÈS UN ÉCHEC, AUCUNE PHRASE D'EFFET QUI MENTE : une demande que la
     base n'a pas vue ne se dit ni « ramenée », ni « appliquée » (ÉCRAN-1). */
  const enEchec = !!(etatEcriture && etatEcriture.echec) || totauxIllisibles;
  const effetR = effetDeLaReduction(totaux, devis, regime, { enEchec });
  const effetA = effetDeLAcompte(totaux, devis, regime, { enEchec });
  /* « Enregistrée » seulement si la BASE a vu cette valeur (la demande
     relue) : pendant l'envoi, ou après un échec, « Pas encore enregistrée ». */
  const demandeVue = totaux && totaux.demande;
  const attenteR = phraseUniteEnAttente(devis, 'remise', c.uniteReduction, null, demandeVue);
  const attenteA = phraseUniteEnAttente(devis, 'acompte', c.uniteAcompte, c.nature, demandeVue);
  const etat = ligneDEtatDeLaCarte({
    echec: etatEcriture && etatEcriture.echec,
    reessayable: !!(etatEcriture && etatEcriture.reessayable),
    enCours: !!(etatEcriture && etatEcriture.enCours),
    totauxIllisibles,
  });

  /* « RAMENÉE À … » SE DIT AUSSI À VOICEOVER (ÉCRAN-1) : la phrase apparaît
     sous un champ qu'on vient de quitter, et rien ne l'annonçait. Une fois
     par phrase nouvelle — et seulement quand c'est vrai : contre la demande
     que la base a vue. */
  const ramenees = [effetR && effetR.ramenee ? effetR.aDire : null, effetA && effetA.ramene ? effetA.aDire : null]
    .filter(Boolean).join(' ');
  const annonce = useRef('');
  useEffect(() => {
    if (ramenees && ramenees !== annonce.current) retour.annoncer(ramenees);
    annonce.current = ramenees;
  }, [ramenees]);
  /* La ligne « pourquoi » apparaît sous les pastilles qu'on vient de
     toucher : elle s'annonce, une fois par phrase nouvelle. */
  const annoncePourquoi = useRef('');
  useEffect(() => {
    if (pourquoi && pourquoi !== annoncePourquoi.current) retour.annoncer(pourquoi);
    annoncePourquoi.current = pourquoi || '';
  }, [pourquoi]);

  /* SOUS CHAQUE MONTANT, UNE PLACE RÉSERVÉE (ÉCRAN-12) : la faute, la valeur
     en attente d'une unité, ou l'effet — la place est là avant eux, et rien
     ne saute au moment où l'on vise le champ suivant.

     SOUS UNE FAUTE, PAS D'EFFET (contre-vérification du lot 2a, mesurée) :
     l'effet est celui de la valeur ENREGISTRÉE, pas du texte refusé qu'on
     lit juste au-dessus — « 400,38 € TTC — reste à payer… » sous « 30,5,5 »
     se lisait comme l'effet de ce qu'on venait de taper. Et la faute plus
     l'effet faisaient trois ou quatre lignes : la carte sautait de 36 px au
     moment même où l'on visait le champ suivant. La valeur en attente
     d'une unité, elle, reste dite : elle dit ce qui n'a PAS changé. */
  const zone = (faute, attente, effet, ramene) => (
    <View style={s.zone}>
      {faute}
      {attente
        ? <Text style={s.aideZone}>{attente}</Text>
        : !faute && !!effet && <Text style={ramene ? s.rameneZone : s.aideZone}>{effet.aDire}</Text>}
    </View>
  );

  return (
    /* MODALE pour VoiceOver, comme la carte d'une ligne : sous elle, la
       liste, le pied et les bandes sont cachés. */
    <View style={s.ecran} accessibilityViewIsModal>
      <View style={s.barre}>
        <Pressable
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel={depuisLaListe
            ? 'Enregistrer les conditions et revenir à ce qu’il manque pour remettre ce devis'
            : 'Enregistrer les conditions et revenir au devis'}
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <Text style={s.retourTexte}>{depuisLaListe ? '‹ Liste' : '‹ Devis'}</Text>
        </Pressable>
        <View style={s.milieu} accessibilityLabel={[total && total.aDire, reste && reste.aDire].filter(Boolean).join('. ')}>
          <Text style={s.barreTitre} numberOfLines={1}>Conditions</Text>
          {!!total && <Montant centimes={total.centimes} style={s.barreMontant} />}
          {/* La ligne du reste a sa place même vide : qu'un acompte arrive, et
              la barre grandissait — tout le contenu descendait de 4 px au
              moment où l'on visait le champ suivant (ÉCRAN-12, mesuré). */}
          <View style={s.ligneReste}>
            {!!reste && (
              <Text style={s.barreReste} numberOfLines={1}>
                {'Reste à payer '}
                <Montant centimes={reste.centimes} enLigne style={s.barreReste} />
              </Text>
            )}
          </View>
        </View>
        <View style={s.place} />
      </View>

      {/* LA LIGNE D'ÉTAT, sous la barre et hors du défilement : la carte
          couvre les bandes du bas, elle dit donc elle-même l'envoi en cours,
          l'échec (« Réessayer ») et des totaux pas relus (« Relire »)
          — relecture ÉCRAN-2. Sa place est réservée même au repos. */}
      <View style={s.etat} accessibilityLiveRegion="polite">
        <Text style={etat.ton === 'echec' ? s.etatEchec : s.etatTexte}>{etat.texte}</Text>
        {etat.action === 'reessayer' && (
          <BtnOutline label="Réessayer" accessibilityLabel="Réessayer l’enregistrement des conditions" onPress={onReessayer} />
        )}
        {etat.action === 'relire' && (
          <BtnOutline label="Relire" accessibilityLabel="Relire les totaux" onPress={onRelireTotaux} />
        )}
      </View>

      <ScrollView ref={refDefile} {...CLAVIER} keyboardDismissMode="on-drag" contentContainerStyle={s.contenu}>
        {/* LA RÉDUCTION — « Réduction », en % ou en € (décision du 03/11). */}
        <Text style={s.titre} onLayout={ancre('reduction')} accessibilityRole="header">Réduction</Text>
        <View style={s.pastilles}>
          <Pastille label="%" nom="Réduction en pourcentage" choisie={c.uniteReduction === 'pourcent'}
            onPress={() => changerUnite('remise', 'pourcent')} />
          <Pastille label="€" nom="Réduction en euros" choisie={c.uniteReduction === 'montant'}
            onPress={() => changerUnite('remise', 'montant')} />
        </View>
        <ChampMontant
          ref={refReduction}
          defaut={texteDe(textes, 'reduction', texteEnregistreDans(devis, 'remise', c.uniteReduction))}
          placeholder={c.uniteReduction === 'montant' ? noms.reductionExemple : 'Pourcentage'}
          accessibilityLabel={c.uniteReduction === 'montant' ? noms.reductionMontant : noms.reductionPourcent}
          onBlur={() => enregistrer('reduction')}
        />
        {zone(sous('remiseCentiemes', 'remiseCentimes'), attenteR, effetR, !!(effetR && effetR.ramenee))}
        <Text style={s.aide}>{AIDE_REDUCTION}</Text>
        {!!noms.aideReductionMontant && <Text style={s.aide}>{noms.aideReductionMontant}</Text>}

        {/* L'ACOMPTE — au choix % ou €, et sa NATURE, sans défaut. Tant
            qu'elle n'est pas choisie, son nom est NEUTRE : « Acompte ou
            arrhes », jamais « Acompte » seul (ÉCRAN-8). */}
        <Text style={s.titre} onLayout={ancre('acompte')} accessibilityRole="header">{noms.acompte}</Text>
        <View style={s.pastilles}>
          <Pastille label="%" nom={noms.acompteEnPourcentage} choisie={c.uniteAcompte === 'pourcent'}
            onPress={() => changerUnite('acompte', 'pourcent')} />
          <Pastille label="€" nom={noms.acompteEnEuros} choisie={c.uniteAcompte === 'montant'}
            onPress={() => changerUnite('acompte', 'montant')} />
        </View>
        <ChampMontant
          ref={refAcompte}
          defaut={texteDe(textes, 'acompte', texteEnregistreDans(devis, 'acompte', c.uniteAcompte))}
          placeholder={c.uniteAcompte === 'montant' ? noms.acompteExemple : 'Pourcentage'}
          accessibilityLabel={c.uniteAcompte === 'montant' ? noms.acompteMontant : noms.acomptePourcent}
          onBlur={() => enregistrer('acompte')}
        />
        {zone(sous('acompteCentiemes', 'acompteCentimes'), attenteA, effetA, !!(effetA && effetA.ramene))}
        <Text style={s.aide}>{AIDE_ACOMPTE}</Text>
        {!!noms.aideAcompteMontant && <Text style={s.aide}>{noms.aideAcompteMontant}</Text>}
        <Text style={s.etiquette} onLayout={ancre('nature')}>Acompte ou arrhes ?</Text>
        <View style={s.pastilles}>
          {NATURES_ACOMPTE.map((n) => (
            <Pastille key={n} label={libelleAcompte(n)} nom={`C’est ${n === 'arrhes' ? 'des arrhes' : 'un acompte'}`}
              choisie={c.nature === n} onPress={() => choisir({ nature: n }, 'nature')} />
          ))}
        </View>
        {sous('acompteNature')}
        {/* LA NATURE ET LE 8e JOUR, selon le client et le chantier (2b-2) :
            pour une entreprise dans son activité principale, ni le 8e jour ni
            la rétractation ; pour un chantier neuf confirmé, le 8e jour du
            code de la consommation ne vaut pas, mais Opus ne permet pas le
            paiement à la signature (le code de la construction, décision du
            13/11) ; pour une association, par prudence. */}
        <Text style={s.aide}>{aides.nature}</Text>

        {/* QUAND LE CLIENT PAIE (2b-3) — TOUJOURS montrée, rien de choisi
            d'office : vide, Opus compte le 8e jour. Deux pastilles, pas un
            second interrupteur (la carte n'en a qu'un, la retenue). */}
        <Text style={s.etiquette} onLayout={ancre('echeance')}>{ECHEANCE_DE_L_ACOMPTE.etiquette}</Text>
        <View style={s.pastilles}>
          <Pastille label={pastilleHuitieme} choisie={c.echeance === false}
            onPress={() => choisir({ echeance: false }, 'echeance')} />
          <Pastille label={pastilleSignature} choisie={c.echeance === true}
            onPress={() => choisir({ echeance: true }, 'echeance')} />
        </View>
        {/* Sous les pastilles, la cause — jamais un bouton. */}
        {!!pourquoi && <Text style={s.pourquoi}>{pourquoi}</Text>}
        {!!aides.echeance && <Text style={s.aide}>{aides.echeance}</Text>}

        {/* LA VALIDITÉ — 15, 30, 60, 90 jours ou « Autre » ; RIEN de
            pré-choisi : la durée se confirme d'un appui (décision du 03/11). */}
        <Text style={s.titre} onLayout={ancre('validite')} accessibilityRole="header">Validité de l’offre</Text>
        <View style={s.pastilles}>
          {VALIDITES_PROPOSEES.map((j) => (
            <Pastille key={j} label={`${j} jours`} nom={`Valable ${j} jours`}
              choisie={!c.validiteAutre && c.validite === j}
              onPress={() => choisir({ validite: c.validite === j && !c.validiteAutre ? null : j, validiteAutre: false }, 'validite')} />
          ))}
          <Pastille label="Autre" nom="Une autre durée de validité" choisie={c.validiteAutre}
            onPress={() => choisir({ validiteAutre: !c.validiteAutre, validite: null }, 'validite')} />
        </View>
        {c.validiteAutre && (
          <ChampMontant
            ref={refValidite}
            defaut={texteDe(textes, 'validite', present(devis.validiteJours) ? String(devis.validiteJours) : '')}
            placeholder="Nombre de jours"
            accessibilityLabel="Durée de validité, en jours"
            onBlur={() => enregistrer('validite')}
            maxLength={4}
          />
        )}
        {sous('validiteJours')}
        <Text style={s.aide}>{AIDE_VALIDITE}</Text>

        {/* LA RETENUE DE GARANTIE — elle vivait dans le bas de la liste ;
            toutes les conditions sont maintenant au même endroit. */}
        <Text style={s.titre} accessibilityRole="header">Retenue de garantie</Text>
        <Interrupteur
          actif={c.retenue}
          libelle="Retenue de garantie"
          /* JAMAIS LA DURÉE SANS SA RÉSERVE (loi n° 71-584, art. 2) : la
             phrase vit dans `devis.js` (`AIDE_RETENUE`), comparée par sa
             valeur. Ici, ELLE SEULE : ni morceau ajouté, ni prop étalée qui
             la remplacerait (relecture finale du lot 2a, TC-3). */
          aide={AIDE_RETENUE}
          onPress={() => choisir({ retenue: !c.retenue }, 'retenue')}
        />
        {c.retenue && (
          <>
            <Text style={s.etiquette}>Taux de la retenue (%)</Text>
            <ChampMontant
              ref={refRetenue}
              defaut={texteDe(textes, 'retenue', present(devis.retenueGarantieCentiemes)
                ? centiemesEnSaisie(devis.retenueGarantieCentiemes) : '5')}
              placeholder="5"
              accessibilityLabel="Taux de la retenue de garantie, en pour cent"
              onBlur={() => enregistrer('retenue')}
            />
            {sous('retenueGarantieCentiemes')}
            {/* La phrase de la loi, SANS AUCUN MONTANT : l'assiette de la
                retenue est une question posée au juriste. */}
            <Text style={s.aide}>{PHRASE_RETENUE}</Text>
          </>
        )}

        {/* CE QUE LE DEVIS DIRA — les rangées de la BASE, dites comme la
            ventilation du bas : la réduction se lit en montant POSITIF. */}
        {rangees.length > 0 && (
          <View style={s.recap}>
            {rangees.map((r) => (
              <View key={r.cle} style={s.rangee} accessible accessibilityLabel={r.aDire}>
                <Text style={r.fort ? s.libelleFort : s.libelle}>
                  {r.libelle}
                  {r.base != null && <Text>{' '}<Montant centimes={r.base} enLigne style={s.libelle} /></Text>}
                </Text>
                <Text style={r.fort ? s.libelleFort : s.libelle}>
                  {r.moins ? '− ' : ''}
                  <Montant centimes={r.centimes} enLigne fort={!!r.fort} />
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
});

export default ConditionsDevis;

const s = StyleSheet.create({
  /* Elle PREND L'ÉCRAN, comme la carte d'une ligne. */
  ecran: { ...StyleSheet.absoluteFillObject, backgroundColor: C.surface, zIndex: 20 },
  barre: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.sm, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  retour: { minHeight: TOUCHE, minWidth: TOUCHE, justifyContent: 'center', paddingHorizontal: S.sm },
  retourTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  milieu: { flex: 1, minWidth: 0, alignItems: 'center' },
  barreTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  barreMontant: { fontSize: T.petit, color: C.ink, textAlign: 'center' },
  barreReste: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  ligneReste: { minHeight: interligne(T.petit) },
  place: { minWidth: TOUCHE },
  contenu: { padding: S.lg, paddingBottom: S.xxl * 3, gap: S.xs },
  titre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, marginTop: S.lg },
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, marginTop: S.md, marginBottom: S.xs },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs, marginBottom: S.xs },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* La ligne « pourquoi » (2b-3) : à l'encre du texte, en demi-gras — elle
     dit pourquoi le choix fait un point à corriger ; pas le rouge des refus :
     rien n'est refusé à la saisie. */
  pourquoi: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* LA PLACE RÉSERVÉE sous un montant (ÉCRAN-12) : deux lignes, la longueur
     des phrases d'effet et des fautes courantes, même à 320 points. Mesuré
     au navigateur avant la correction : la carte sautait de 24 px, puis de
     4, au moment où l'on visait le champ suivant. */
  /* …plus la marge haute d'une faute (`erreur`, `S.xs`) : une faute de deux
     lignes y tient aussi — mesuré, elle poussait encore la carte de 4 px. */
  zone: { minHeight: 2 * interligne(T.petit) + S.xs, marginTop: S.xs },
  aideZone: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  /* Une demande RAMENÉE au total : de l'encre, pas le rouge des refus — rien
     n'est refusé, la phrase dit ce que le devis portera. */
  rameneZone: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit) },
  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* LA LIGNE D'ÉTAT (ÉCRAN-2) : une ligne réservée même au repos — l'envoi
     qui commence ne pousse pas la carte. L'échec, plus long, et son bouton,
     la font grandir : c'est le moment où elle doit se voir. */
  etat: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.sm,
    minHeight: interligne(T.petit) + 2 * S.xs, paddingHorizontal: S.lg, paddingVertical: S.xs,
    borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  etatTexte: { flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  etatEchec: { flex: 1, minWidth: 0, fontFamily: F.inter6, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit) },
  recap: { marginTop: S.xl, gap: S.xs, borderTopWidth: 1, borderTopColor: C.line, paddingTop: S.md },
  rangee: { flexDirection: 'row', justifyContent: 'space-between', gap: S.sm },
  libelle: { flexShrink: 1, fontFamily: F.inter, fontSize: T.petit, color: C.ink },
  libelleFort: { flexShrink: 1, fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
});
