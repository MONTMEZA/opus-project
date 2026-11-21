/**
 * LA CARTE « DÉCHETS DU CHANTIER » D'UN DEVIS (étape 2b-5, cahier §3.8,
 * annexe A.2, 21/11/2026).
 *
 * CE QUE LA LOI DEMANDE (C. env. L. 541-21-2-3 I, D. 541-45-1 I) : sur tout
 * devis de construction, de rénovation ou de démolition d'un bâtiment, et sur
 * tout devis de jardinage, quel que soit le client, ce que deviendront les
 * déchets — la QUANTITÉ estimée, le TRI (les déchets collectés à part), les
 * LIEUX où l'entreprise prévoit de les déposer, une estimation du COÛT. Il
 * suffit qu'une seule de ces informations manque pour exposer à une amende.
 *
 * ELLE EST FAITE EXACTEMENT COMME « CONDITIONS » (`ConditionsDevis.js`) : une
 * carte posée au-dessus de la liste, qui prend l'écran ; sa barre en HAUT,
 * fixe (« ‹ Devis » enregistre et ferme) ; sa ligne d'état réservée dessous
 * (la carte couvre les bandes du bas : elle dit elle-même l'envoi et
 * l'échec) ; un contenu qui défile avec `CLAVIER`. Une valeur de plus de
 * l'état UNIQUE `carte` de la saisie (`CARTE_DECHETS`), jamais une `Modal`.
 *
 * LA VOIE UNIQUE (le modèle de `etatInitialConditions` → `poser` →
 * `lireConditions`) : l'état de départ vient de `etatInitialDechets`
 * (`devis.js`, que `verifier-devis` fait tourner) — sur un devis vierge,
 * RIEN n'est coché, choisi ni répondu, pas même l'unité, pas même le seul
 * lieu d'un artisan qui n'en a qu'un (« Opus propose, l'artisan confirme »,
 * T27) ; un APPUI pose son choix (`poser`, dans un gestionnaire d'appui
 * NOMMÉ, jamais dans un `useEffect`), puis la carte se lit ENTIÈRE
 * (`lireDechets`) et s'enregistre. Les tableaux posés sont toujours NEUFS
 * (les fonctions d'appui de `devis.js` les fabriquent) : jamais un `push`
 * sur un tableau que la base a rendu.
 *
 * TROIS RÈGLES, et aucune n'est cosmétique :
 *   - JAMAIS DE TABLEAU VIDE (T3, T10) : décocher la dernière case écrit VIDE
 *     DE VALEUR, jamais `[]` — `fluxApresAppui`, `surPlaceApresAppui`,
 *     `lieuxApresAppui` le tiennent ; « Aucune collecte séparée » et « Aucun
 *     dépôt » sont des pastilles EXCLUSIVES, qui s'ANNONCENT quand elles
 *     retirent des cases cochées (T28 : « un champ qui change sans geste doit
 *     s'annoncer ») ;
 *   - LES LIEUX CHOISIS NE S'EFFACENT QUE SOUS LE DOIGT (T10) : la carte
 *     garde les identifiants TELS QUE LUS, orphelins compris ; ce qu'elle
 *     MONTRE est l'intersection avec la liste VIVANTE (la prop `lieux`, que
 *     la fermeture de « Mon entreprise » relit). Un appui sur un lieu rebâtit
 *     la liste depuis la liste LUE ; sur une liste NON LUE, aucune case n'est
 *     montrée et rien ne change ;
 *   - LA LISTE DES LIEUX A TROIS ÉTATS (T12 bis, `etatDesLieux`) : en
 *     lecture, rien n'est dit ; en échec, « Vos lieux de dépôt n'ont pas pu
 *     être lus » et « Réessayer » ; vide, la phrase et « Ajouter un lieu de
 *     dépôt » ; lue, les cases. JAMAIS « aucun lieu » d'une liste qu'on n'a
 *     pas lue : montrer « aucun lieu » à qui en a inviterait au doublon.
 *
 * SOUS « NON », les rubriques se TAISENT — elles ne sont pas montées —, mais
 * ce qui est écrit est GARDÉ (le modèle de `lireConditions` : un champ
 * démonté se lit `undefined`, et sa valeur reste) : « au cas où vous
 * changeriez d'avis ».
 *
 * LA PORTE « MES LIEUX DE DÉPÔT » (T25) : un artisan qui a des lieux, dont
 * aucun ne convient, doit pouvoir en ajouter sans quitter le devis. La porte
 * ENREGISTRE la carte, puis ouvre « Mon entreprise » sur la section de ses
 * lieux (la saisie, `ouvrirMesLieux`) ; à la fermeture, la liste revient par
 * la prop, et la carte — restée ouverte — montre le lieu ajouté.
 *
 * OUVERTE DEPUIS « POUR LE REMETTRE » (T8) : SUR la rubrique que vise le
 * point (`rubriqueInitiale` : la question, la quantité, le tri, le lieu, le
 * coût), et son retour dit « ‹ Liste ». Le défilement se pose UNE fois, à la
 * mise en page du titre visé — un enfant DIRECT du contenu défilant, dont la
 * position est relative au contenu.
 *
 * TOUS LES MOTS VIENNENT DE `devis.js` (`LES_DECHETS`, `FLUX_DECHETS`,
 * `SUR_PLACE_DECHETS`, `UNITES_DECHETS`, `libelleDuCout`) : la carte ne
 * compose aucune phrase — `verifier-devis` les compare à l'annexe A.2.
 */
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import {
  Pastille, Interrupteur, BtnOutline,
} from './ui';
import ChampMontant from './ChampMontant';
import { CLAVIER } from '../lib/clavier';
import * as retour from '../lib/retour';
import {
  LES_DECHETS, FLUX_DECHETS, SUR_PLACE_DECHETS, UNITES_DECHETS, AUCUNE_COLLECTE, AUCUN_DEPOT,
  etatInitialDechets, lireDechets, fluxApresAppui, surPlaceApresAppui, lieuxApresAppui,
  annonceDuTri, annonceDesLieux, etatDesLieux, libelleDuCout, libelleParleDuCout, pastillesDeLaQuestionDesDechets,
  textesInitiauxDesDechets, ligneDEtatDeLaCarte, aucunDepotContredit,
} from '../lib/devis';
import { libelleDuTypeDeLieu } from '../lib/emetteur';

const present = (v) => v !== null && v !== undefined;

const DechetsDevis = forwardRef(function DechetsDevis({
  devis = {}, regime, erreurs = {}, textes = null,
  /* LA LISTE VIVANTE DES LIEUX de « Mon entreprise », SANS valeur par
     défaut : `undefined` tant qu'elle n'est pas lue, `null` si elle n'a pas
     pu l'être, un tableau sinon — jamais un `[]` inventé (T12 bis). */
  lieux,
  etatEcriture = null, onReessayer, onEnregistrer, onFermer,
  rubriqueInitiale = null, depuisLaListe = false,
  /* « Réessayer » sous une liste de lieux non lue : la MÊME lecture que le
     régime (`onRelireRegime` de la saisie). */
  onRelireLieux = null,
  /* La porte « Mes lieux de dépôt » (T25) : la saisie enregistre la carte,
     puis ouvre « Mon entreprise » sur la section des lieux. */
  onMesLieux = null,
}, ref) {
  const refQuantite = useRef(null);
  const refCout = useRef(null);
  /* LA RUBRIQUE SUR LAQUELLE LA CARTE S'OUVRE (T8) : le défilement se pose
     UNE fois — après, c'est l'artisan qui défile. */
  const refDefile = useRef(null);
  const place = useRef(false);
  const ancre = (cle) => (e) => {
    if (place.current || cle !== rubriqueInitiale || !refDefile.current) return;
    place.current = true;
    refDefile.current.scrollTo({ y: Math.max(0, e.nativeEvent.layout.y - S.md), animated: false });
  };

  /* Les choix faits d'un appui : une RÉFÉRENCE (lue par `lire()` dans la
     même boucle que l'appui) ET un état (pour le dessin). L'état de départ
     vient de `etatInitialDechets` : rien n'est choisi à la place de
     l'artisan, et les lieux sont gardés TELS QUE LUS. */
  const [initial] = useState(() => etatInitialDechets(devis, textes));
  const choix = useRef(initial);
  const [c, setC] = useState(initial);
  const poser = (x) => { choix.current = { ...choix.current, ...x }; setC(choix.current); };
  /* LE PLAFOND DES LIEUX (relecture BASE-R1 / ÉCRAN-1) : un onzième lieu ne
     s'ajoute pas, et la carte le DIT juste sous les cases — rien n'est
     écrit. Retombe au premier appui sur un lieu qui passe, ou
     sur « Aucun dépôt ». */
  const [plafond, setPlafond] = useState(false);

  /* TOUT CE QUE LA CARTE PORTE À CET INSTANT — la règle vit dans
     `lireDechets` (`devis.js`). Un champ PAS MONTÉ (sous « Non ») se lit
     `undefined` : sa valeur enregistrée reste, rien n'est effacé. */
  const lire = () => {
    const lu = (r) => (r.current ? r.current.lire() : undefined);
    return lireDechets({
      choix: choix.current,
      tapes: { quantite: lu(refQuantite), cout: lu(refCout) },
      devis,
    });
  };

  /* `geste` : le champ quitté ou la case touchée — la saisie ne vibre que
     pour SA faute (`vibrerPourLesDechets`). Les choix partent avec les
     textes : la saisie les garde tant qu'une valeur est refusée. */
  const enregistrer = (geste = 'fermer') => {
    const l = lire();
    if (onEnregistrer) onEnregistrer(l.changements, l.erreurs, { ...l.textes, choix: choix.current }, geste);
    return l;
  };
  useImperativeHandle(ref, () => ({ lire, enregistrer }));

  /* Un APPUI change un choix, PUIS la carte s'enregistre entière. */
  const choisir = (x, geste) => { poser(x); enregistrer(geste); };

  /* LES GESTIONNAIRES D'APPUI — les SEULS qui posent un choix (T27). */

  /* La question : « Non » écrit `false`, « Oui » (ou « Oui (par défaut) »)
     écrit `true` — l'artisan confirme ce qu'Opus comptait. Une pastille déjà
     choisie, retouchée « pour valider », ne fait rien. */
  const repondre = (valeur) => {
    if (choix.current.concerne === valeur) return;
    choisir({ concerne: valeur }, 'concerne');
  };
  /* L'unité : toucher l'autre GARDE le nombre tapé (comme l'unité d'une
     ligne) ; la même, retouchée, ne fait rien. */
  const choisirUnite = (unite) => {
    if (choix.current.unite === unite) return;
    choisir({ unite }, 'unite');
  };
  /* Une case du tri : elle se coche ou se décoche, et la pastille « Aucune
     collecte séparée » tombe — sans annonce : c'est l'objet même de l'appui. */
  const toucherDechet = (cle) => {
    choisir({ flux: fluxApresAppui(choix.current.flux, cle) }, 'tri');
  };
  /* La pastille « Aucune collecte séparée » : allumée, elle RETIRE les
     déchets cochés, dans le même geste — et le DIT (T28). */
  const toucherAucuneCollecte = () => {
    const avant = choix.current.flux;
    const apres = fluxApresAppui(avant, AUCUNE_COLLECTE);
    choisir({ flux: apres }, 'tri');
    const dire = annonceDuTri(avant, apres);
    if (dire) retour.annoncer(dire);
  };
  const toucherSurPlace = (cle) => {
    choisir({ surPlace: surPlaceApresAppui(choix.current.surPlace, cle) }, 'surPlace');
  };
  /* Un lieu : rebâti depuis la liste LUE, dans son ordre (`lieuxApresAppui`) —
     le SEUL endroit où les lieux choisis se récrivent (T10). Un lieu de
     trop (`plafond`) n'écrit RIEN : la phrase se MONTRE, s'annonce (iOS n'a
     pas de région vivante), et la carte vibre — une annonce seule
     laisserait à qui voit une case qui ne fait rien. */
  const toucherLieu = (id) => {
    const avant = { lieux: choix.current.lieux, sansDepot: choix.current.sansDepot };
    const apres = lieuxApresAppui(avant, lieux, id);
    if (apres.plafond) {
      setPlafond(true);
      retour.echec();
      retour.annoncer(LES_DECHETS.lieux.plafond);
      return;
    }
    setPlafond(false);
    choisir({ lieux: apres.lieux, sansDepot: apres.sansDepot }, 'lieux');
  };
  /* La pastille « Aucun dépôt » (réponse P6) : allumée, elle RETIRE les lieux
     cochés ET MONTRÉS — et le DIT ; un orphelin, jamais montré, ne s'annonce
     pas (T28). */
  const toucherAucunDepot = () => {
    setPlafond(false);
    const avant = { lieux: choix.current.lieux, sansDepot: choix.current.sansDepot };
    const apres = lieuxApresAppui(avant, lieux, AUCUN_DEPOT);
    choisir({ lieux: apres.lieux, sansDepot: apres.sansDepot }, 'lieux');
    const dire = annonceDesLieux(avant, apres, lieux);
    if (dire) retour.annoncer(dire);
  };
  /* LA PORTE vers « Mon entreprise » : la carte s'enregistre d'abord — ce
     qui est tapé dans la quantité ou le coût ne se perd pas. */
  const allerAMesLieux = () => {
    enregistrer('fermer');
    if (onMesLieux) onMesLieux();
  };

  const faute = (...cles) => {
    const cle = cles.find((k) => erreurs && erreurs[k]);
    return cle ? <Text style={s.erreur} accessibilityLiveRegion="polite">{erreurs[cle]}</Text> : null;
  };

  const q = LES_DECHETS.question;
  const [pastilleNon, pastilleOui] = pastillesDeLaQuestionDesDechets(c.concerne);
  const non = c.concerne === false;
  const coches = Array.isArray(c.flux) ? c.flux : [];
  const aucuneCollecte = coches.includes(AUCUNE_COLLECTE);
  const surPlace = Array.isArray(c.surPlace) ? c.surPlace : [];
  const choisis = Array.isArray(c.lieux) ? c.lieux : [];
  const etatLieux = etatDesLieux(regime, lieux);
  const lieuxMontres = Array.isArray(lieux) ? lieux : [];
  const unite = UNITES_DECHETS.find((u) => u.cle === c.unite) || null;
  /* « Choisissez m³ ou tonnes. » à la place réservée (T23) : une quantité
     enregistrée sans unité — RIEN n'est refusé, la quantité est partie. */
  const sansUnite = present(devis.dechetsQuantiteMilliemes) && !present(c.unite) ? LES_DECHETS.quantite.sansUnite : null;
  const libelleCout = libelleDuCout(regime);
  /* Les deux textes à l'ouverture des champs (`textesInitiauxDesDechets`,
     que `verifier-devis` fait tourner) — recalculés à chaque rendu, comme
     avant : sous « Non » les champs sont démontés, et revenus à « Oui » ils
     se remontent sur la valeur ENREGISTRÉE entre-temps. */
  const textesInit = textesInitiauxDesDechets(devis, textes);
  const etat = ligneDEtatDeLaCarte({
    echec: etatEcriture && etatEcriture.echec,
    reessayable: !!(etatEcriture && etatEcriture.reessayable),
    enCours: !!(etatEcriture && etatEcriture.enCours),
  });

  return (
    /* MODALE pour VoiceOver, comme les autres cartes : sous elle, la liste,
       le pied et les bandes sont cachés. */
    <View style={s.ecran} accessibilityViewIsModal>
      <View style={s.barre}>
        <Pressable
          onPress={onFermer}
          accessibilityRole="button"
          accessibilityLabel={depuisLaListe
            ? 'Enregistrer les déchets et revenir à ce qu’il manque pour remettre ce devis'
            : 'Enregistrer les déchets et revenir au devis'}
          style={({ pressed }) => [s.retour, pressed && APPUI.discret]}
        >
          <Text style={s.retourTexte}>{depuisLaListe ? '‹ Liste' : '‹ Devis'}</Text>
        </Pressable>
        <View style={s.milieu}>
          <Text style={s.barreTitre} numberOfLines={1}>{LES_DECHETS.titre}</Text>
        </View>
        <View style={s.place} />
      </View>

      {/* LA LIGNE D'ÉTAT, sous la barre et hors du défilement : la carte
          couvre les bandes du bas, elle dit donc elle-même l'envoi en cours
          et l'échec (« Réessayer »). Sa place est réservée même au repos. */}
      <View style={s.etat} accessibilityLiveRegion="polite">
        <Text style={etat.ton === 'echec' ? s.etatEchec : s.etatTexte}>{etat.texte}</Text>
        {etat.action === 'reessayer' && (
          <BtnOutline label="Réessayer" accessibilityLabel="Réessayer l’enregistrement des déchets" onPress={onReessayer} />
        )}
      </View>

      <ScrollView ref={refDefile} {...CLAVIER} keyboardDismissMode="on-drag" contentContainerStyle={s.contenu}>
        <Text style={s.aide}>{LES_DECHETS.introduction}</Text>

        {/* LA QUESTION (réponse P1), EN TÊTE (T7) : « Non » à GAUCHE, comme
            les trois questions de « Le chantier » — un pouce qui vise « Oui »
            à droite par habitude toucherait sinon la réponse qui retire
            l'exigence. Vide, Opus compte « Oui », par prudence. */}
        <Text style={s.sousTitre} onLayout={ancre('question')} accessibilityRole="header">{q.sousTitre}</Text>
        <Text style={s.enonce}>{q.question}</Text>
        <View style={s.pastilles}>
          <Pastille label={pastilleNon} choisie={non} onPress={() => repondre(false)} />
          <Pastille label={pastilleOui} choisie={!non} onPress={() => repondre(true)} />
        </View>
        {faute('dechetsConcerne')}
        <Text style={s.aide}>{non ? q.sousNon : q.aide}</Text>

        {/* LES QUATRE RUBRIQUES — démontées sous « Non » : ce qui y est écrit
            est gardé. */}
        {!non && (
          <>
            {/* LA QUANTITÉ ESTIMÉE — un nombre (le pavé décimal de
                `ChampMontant`) et son unité, d'un appui ; rien d'office. */}
            <Text style={s.titre} onLayout={ancre('quantite')} accessibilityRole="header">{LES_DECHETS.quantite.titre}</Text>
            <Text style={s.etiquette}>{LES_DECHETS.quantite.question}</Text>
            <ChampMontant
              ref={refQuantite}
              defaut={textesInit.quantite}
              placeholder={LES_DECHETS.quantite.placeholder}
              accessibilityLabel={unite ? `Quantité estimée des déchets, en ${unite.nom}` : 'Quantité estimée des déchets'}
              onBlur={() => enregistrer('quantite')}
            />
            <View style={s.pastilles}>
              {UNITES_DECHETS.map((u) => (
                <Pastille key={u.cle} label={u.pastille} nom={`Quantité en ${u.nom}`} choisie={c.unite === u.cle}
                  onPress={() => choisirUnite(u.cle)} />
              ))}
            </View>
            {/* LA PLACE RÉSERVÉE sous la quantité : la faute, ou le rappel de
                l'unité — rien ne saute quand l'un ou l'autre arrive. */}
            <View style={s.zone}>
              {faute('dechetsQuantiteMilliemes', 'dechetsUnite')
                || (!!sansUnite && <Text style={s.rappel} accessibilityLiveRegion="polite">{sansUnite}</Text>)}
            </View>
            <Text style={s.aide}>{LES_DECHETS.quantite.aide}</Text>

            {/* LE TRI — les quatorze sortes (réponse P4), des `Interrupteur`
                TELS QUELS (T14) ; le libellé, qui s'imprimera, est séparé de
                ses exemples, qui aident à l'écran (T21). La pastille « Aucune
                collecte séparée » APRÈS les cases. */}
            <Text style={s.titre} onLayout={ancre('tri')} accessibilityRole="header">{LES_DECHETS.tri.titre}</Text>
            <Text style={s.etiquette}>{LES_DECHETS.tri.question}</Text>
            {FLUX_DECHETS.map((f) => (
              <Interrupteur
                key={f.cle}
                actif={coches.includes(f.cle)}
                libelle={f.libelle}
                aide={f.exemples || undefined}
                onPress={() => toucherDechet(f.cle)}
              />
            ))}
            <View style={s.pastilles}>
              <Pastille label={LES_DECHETS.tri.aucune} choisie={aucuneCollecte} onPress={toucherAucuneCollecte} />
            </View>
            <Text style={s.aide}>{LES_DECHETS.tri.sousAucune}</Text>
            {faute('dechetsFlux')}
            <Text style={s.aide}>{LES_DECHETS.tri.aide}</Text>

            {/* SUR LE CHANTIER (T3 bis) — un fait À PART, montré toujours,
                jamais exigé, qui ne complète JAMAIS le tri. */}
            <Text style={s.titre} onLayout={ancre('surPlace')} accessibilityRole="header">{LES_DECHETS.surPlace.titre}</Text>
            <Text style={s.etiquette}>{LES_DECHETS.surPlace.question}</Text>
            {SUR_PLACE_DECHETS.map((x) => (
              <Interrupteur
                key={x.cle}
                actif={surPlace.includes(x.cle)}
                libelle={x.libelle}
                onPress={() => toucherSurPlace(x.cle)}
              />
            ))}
            {faute('dechetsSurPlace')}

            {/* LES LIEUX — trois états (T12 bis) ; une case par lieu LU ; la
                pastille « Aucun dépôt » seulement sur une liste lue (sinon un
                appui ne changerait rien) ; la porte « Mes lieux de dépôt »
                (T25). */}
            <Text style={s.titre} onLayout={ancre('lieu')} accessibilityRole="header">{LES_DECHETS.lieux.titre}</Text>
            {etatLieux === 'echec' && (
              <>
                <Text style={s.erreur} accessibilityLiveRegion="polite">{LES_DECHETS.lieux.echec}</Text>
                <View style={s.boutons}>
                  <BtnOutline label={LES_DECHETS.lieux.reessayer} accessibilityLabel="Relire vos lieux de dépôt"
                    onPress={onRelireLieux} />
                  <BtnOutline label={LES_DECHETS.lieux.porte}
                    accessibilityLabel="Mes lieux de dépôt : ouvrir « Mon entreprise » sur vos lieux de dépôt" onPress={allerAMesLieux} />
                </View>
              </>
            )}
            {etatLieux === 'vide' && (
              <>
                <Text style={s.etiquette}>{LES_DECHETS.lieux.vide}</Text>
                <View style={s.boutons}>
                  <BtnOutline label={LES_DECHETS.lieux.ajouter}
                    accessibilityLabel="Ajouter un lieu de dépôt : ouvrir « Mon entreprise » sur vos lieux de dépôt" onPress={allerAMesLieux} />
                </View>
              </>
            )}
            {etatLieux === 'lus' && (
              <>
                {lieuxMontres.map((l) => (
                  <Interrupteur
                    key={String(l.id)}
                    actif={choisis.includes(l.id)}
                    libelle={l.raison_sociale || ''}
                    aide={[libelleDuTypeDeLieu(l), l.ville].filter(Boolean).join(', ')}
                    onPress={() => toucherLieu(l.id)}
                  />
                ))}
                {/* LE PLAFOND, JUSTE SOUS LES CASES (relecture BASE-R1 /
                    ÉCRAN-1) : posée à la place de la faute des lieux — sous
                    « Aucun dépôt » —, la phrase tombait HORS DE L'ÉCRAN
                    quand on touchait la onzième case (mesuré au navigateur,
                    à 393 × 852). Rien AU-DESSUS ne bouge. */}
                {plafond && <Text style={s.erreur} accessibilityLiveRegion="polite">{LES_DECHETS.lieux.plafond}</Text>}
                <View style={s.boutons}>
                  <BtnOutline label={LES_DECHETS.lieux.porte}
                    accessibilityLabel="Mes lieux de dépôt : ouvrir « Mon entreprise » sur vos lieux de dépôt" onPress={allerAMesLieux} />
                </View>
              </>
            )}
            {(etatLieux === 'vide' || etatLieux === 'lus') && (
              <>
                <View style={s.pastilles}>
                  <Pastille label={LES_DECHETS.lieux.aucunDepot} choisie={c.sansDepot === true} onPress={toucherAucunDepot} />
                </View>
                {/* « AUCUN DÉPÔT » CONTREDIT PAR LE TRI (DROIT-R2, décision du
                    21/11 : « Le signaler ») : des déchets cochés dans le tri
                    PARTIRONT, et leur lieu manque — la phrase le dit JUSTE
                    SOUS la pastille, tant que la contradiction dure
                    (`aucunDepotContredit`, sur les choix de la carte), et
                    tombe dès qu'elle tombe. De l'encre, pas le rouge des
                    refus : rien n'est refusé, le choix est enregistré. Rien
                    AU-DESSUS ne bouge. */}
                {aucunDepotContredit(c) && (
                  <Text style={s.rappelLieux} accessibilityLiveRegion="polite">{LES_DECHETS.lieux.partentAPart}</Text>
                )}
                <Text style={s.aide}>{LES_DECHETS.lieux.sousAucunDepot}</Text>
              </>
            )}
            {faute('dechetsLieux', 'dechetsSansDepot')}
            <Text style={s.aide}>{LES_DECHETS.lieux.aide}</Text>

            {/* LE COÛT ESTIMÉ (réponse P2) — toujours un montant, jamais 0,
                HORS du total ; « HT » au seul régime réel (T16). */}
            <Text style={s.titre} onLayout={ancre('cout')} accessibilityRole="header">{libelleCout}</Text>
            <Text style={s.etiquette}>{LES_DECHETS.cout.question}</Text>
            <ChampMontant
              ref={refCout}
              defaut={textesInit.cout}
              placeholder={LES_DECHETS.cout.placeholder}
              accessibilityLabel={libelleParleDuCout(regime)}
              onBlur={() => enregistrer('cout')}
            />
            <View style={s.zone}>{faute('dechetsCoutCentimes')}</View>
            <Text style={s.aide}>{LES_DECHETS.cout.aide}</Text>

            {/* L'AMENDE (réponse P3) — dans l'aide de la carte, jamais dans
                une phrase du point. */}
            <Text style={s.amende}>{LES_DECHETS.amende}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
});

export default DechetsDevis;

const s = StyleSheet.create({
  /* Elle PREND L'ÉCRAN, comme « Conditions » et « Le chantier ». */
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
  contenu: { padding: S.lg, paddingBottom: S.xxl * 3, gap: S.xs },
  sousTitre: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2, marginTop: S.md },
  enonce: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  titre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, marginTop: S.lg },
  etiquette: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, marginTop: S.xs, marginBottom: S.xs },
  pastilles: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs, marginBottom: S.xs },
  boutons: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* L'amende : une aide, à l'encre du texte — elle dit ce qui se joue. */
  amende: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit), marginTop: S.xl },
  /* LA PLACE RÉSERVÉE sous un montant (le modèle de « Conditions ») : deux
     lignes, plus la marge haute d'une faute. */
  zone: { minHeight: 2 * interligne(T.petit) + S.xs, marginTop: S.xs },
  /* Le rappel de l'unité : de l'encre, pas le rouge des refus — rien n'est
     refusé, la quantité est enregistrée. */
  rappel: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit) },
  /* Le même rappel, sous la pastille « Aucun dépôt » (DROIT-R2). */
  rappelLieux: { fontFamily: F.inter6, fontSize: T.petit, color: C.ink, lineHeight: interligne(T.petit), marginTop: S.xs },
  erreur: { fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit), marginTop: S.xs },
  /* LA LIGNE D'ÉTAT : une ligne réservée même au repos — l'envoi qui
     commence ne pousse pas la carte. */
  etat: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.sm,
    minHeight: interligne(T.petit) + 2 * S.xs, paddingHorizontal: S.lg, paddingVertical: S.xs,
    borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.surface,
  },
  etatTexte: { flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  etatEchec: { flex: 1, minWidth: 0, fontFamily: F.inter6, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit) },
});
