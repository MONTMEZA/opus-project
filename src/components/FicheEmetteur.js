/**
 * MES INFORMATIONS DE DEVIS — le mode « édition » de « Mon entreprise ».
 *
 * Tout ce qui rend un devis légal et que le répertoire Sirene (INSEE) ne
 * donne pas : l'immatriculation, le capital, les adresses qu'Opus n'a pas,
 * les coordonnées, le régime de TVA, les assurances, le médiateur, les
 * garanties, les conditions, les frais de déplacement (section 46).
 *
 * CE QUE LE FORMULAIRE NE FAIT JAMAIS, et le contrôle le tient
 * ------------------------------------------------------------
 *   - COCHER À LA PLACE DE L'ARTISAN. Les choix partent de
 *     `etatInitialFormulaire()`, qui rend `null` pour une fiche jamais
 *     enregistrée : un franchisé présumé à tort émettrait des devis sans
 *     TVA (plan 10.1).
 *   - EFFACER CE QU'IL N'AFFICHE PAS. Une section cachée (le nom d'EI pour
 *     une société, le capital pour un EI) n'a aucun champ monté : sa
 *     lecture rend `undefined`, et `fusionnerFormulaire()` garde la valeur
 *     chargée. Sans elle, l'enregistrement l'effacerait sans un mot.
 *   - COMPOSER UNE MENTION. Le nom d'EI, les garanties, les conditions
 *     s'écrivent en ses mots : Opus ne rédige rien à sa place.
 *   - PRÉSENTER UN CHOIX D'OPUS COMME LA LOI. Le code de la consommation ne
 *     vaut que face à un particulier (réponse du propriétaire, 18/10/2026),
 *     et les phrases le disent.
 *
 * LE CLAVIER
 * ----------
 * Chaque texte est un `ChampLocal` (une lettre ne redessine que lui).
 * « Suivant » n'existe qu'entre deux champs d'une ligne de la même section,
 * et il AMÈNE au suivant (`focus()`), sinon il ne fait que refermer le
 * clavier. Les pavés `number-pad`, `phone-pad` et `decimal-pad` n'ont
 * AUCUN `returnKeyType` : un clavier numérique d'iOS n'a pas de touche
 * retour, l'annoncer serait mentir. Le conteneur qui défile, lui, est
 * celui de `MonEntreprise.js`, avec `{...CLAVIER}`.
 */
import React, {
  forwardRef, useImperativeHandle, useRef, useState,
} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne, rond,
} from '../theme';
import { BtnMini, TextArea } from './ui';
import ChampLocal from './ChampLocal';
import ChampVille from './ChampVille';
import { Check, ChevronDown, ChevronRight, Plus } from './icons';
import { useRechercheDifferee } from '../lib/frappe';
import { dateFrancaise } from '../lib/entreprise';
import {
  REGISTRES, REGISTRE_D_UNE_SOCIETE, REGIMES_TVA, NATURES_ASSURANCE, LONGUEUR_MAX,
  LIBELLES_IMPRIMES, etatInitialFormulaire, fusionnerFormulaire, fraisDepuisFormulaire,
  versCentimes, estEI, estSocieteCommerciale, rcsOblige, mediateurDeLaListe,
  parleDUnPaiementALaSignature, avisEmetteur,
} from '../lib/emetteur';
import { MEDIATEURS_RELEVES_LE, ADRESSE_A_RECOPIER } from '../data/mediateurs';

const L = LONGUEUR_MAX.emetteur;

/* Les colonnes TEXTE d'`emetteur`, telles que le formulaire les tient. */
const CHAMPS_TEXTE = [
  'denomination_ei', 'greffe_ville',
  'etablissement_adresse', 'etablissement_code_postal', 'etablissement_ville',
  'siege_adresse', 'siege_code_postal', 'siege_ville',
  'telephone', 'email',
  'mediateur_nom', 'mediateur_adresse', 'mediateur_site',
  'garantie_legale_texte', 'garantie_commerciale_texte', 'sav_texte',
  'modalites_paiement_texte', 'modalites_execution_texte', 'reclamations_texte',
];
/* Les deux rues passent par `ChampVille`, qui propose les adresses : leur
   texte se tient dans une référence, pas dans un `ChampLocal`. */
const RUES = ['etablissement_adresse', 'siege_adresse'];

/** De quelle section relève un champ — pour défiler jusqu'à lui quand il est refusé. */
export const SECTION_DU_CHAMP = Object.freeze({
  denomination_ei: 'identite',
  registre: 'immatriculation',
  greffe_ville: 'immatriculation',
  capital_centimes: 'capital',
  capital_variable: 'capital',
  etablissement_adresse: 'adresses',
  etablissement_code_postal: 'adresses',
  etablissement_ville: 'adresses',
  siege_adresse: 'adresses',
  siege_code_postal: 'adresses',
  siege_ville: 'adresses',
  telephone: 'contact',
  email: 'contact',
  regime_tva: 'tva',
  mediateur_nom: 'mediateur',
  mediateur_adresse: 'mediateur',
  mediateur_site: 'mediateur',
  garantie_legale_texte: 'garanties',
  garantie_commerciale_texte: 'garanties',
  sav_texte: 'garanties',
  modalites_paiement_texte: 'conditions',
  modalites_execution_texte: 'conditions',
  reclamations_texte: 'conditions',
  frais_deplacement_centimes: 'frais',
  frais_deplacement_texte: 'frais',
});

/** 350000 → « 3500 » ; 350050 → « 3500,50 » : ce qu'on retape, pas ce qu'on imprime. */
function montantEnSaisie(centimes) {
  if (centimes == null || !Number.isInteger(Number(centimes))) return '';
  const c = Number(centimes);
  const euros = Math.floor(c / 100);
  const reste = c % 100;
  return reste ? `${euros},${String(reste).padStart(2, '0')}` : String(euros);
}

const texteDe = (v) => (v == null ? '' : String(v));

/**
 * L'ÉTAT DE DÉPART DU FORMULAIRE, depuis ce qui est enregistré.
 *
 * C'est aussi la forme du BROUILLON que « Mon entreprise » garde quand on
 * part choisir un médiateur ou une assurance : le formulaire se démonte
 * (une liste remplace le `ScrollView`), et il revient avec ce qu'on avait
 * tapé. `choix` vient de `etatInitialFormulaire()`, et de lui seul.
 */
export function etatDepuis(reference) {
  const e = (reference && reference.emetteur) || {};
  const t = (reference && reference.tarifs) || {};
  const textes = {};
  CHAMPS_TEXTE.forEach((c) => { textes[c] = texteDe(e[c]); });
  textes.capital = montantEnSaisie(e.capital_centimes);
  /* Le 0 ne s'écrit jamais dans le montant : il veut dire « je ne facture
     pas », et c'est l'interrupteur qui le porte. */
  textes.frais_montant = t.frais_deplacement_centimes > 0 ? montantEnSaisie(t.frais_deplacement_centimes) : '';
  textes.frais_texte = texteDe(t.frais_deplacement_texte);
  const liste = mediateurDeLaListe(e.mediateur_nom, e.mediateur_site);
  let mediateur = { mode: 'aucun', nom: null, site: null };
  if (liste) mediateur = { mode: 'liste', nom: e.mediateur_nom, site: e.mediateur_site };
  else if (e.mediateur_nom || e.mediateur_adresse || e.mediateur_site) {
    mediateur = { mode: 'libre', nom: null, site: null };
  }
  return {
    textes,
    choix: etatInitialFormulaire(reference && reference.emetteur, reference && reference.tarifs),
    enLiquidation: e.en_liquidation === true,
    locataireGerant: e.locataire_gerant === true,
    mediateur,
  };
}

/** Deux états du formulaire disent-ils la même chose ? (aux blancs près) */
export function memeEtat(a, b) {
  const norm = (x) => JSON.stringify({
    textes: Object.fromEntries(Object.entries((x && x.textes) || {}).map(([k, v]) => [k, texteDe(v).trim()])),
    choix: (x && x.choix) || {},
    enLiquidation: !!(x && x.enLiquidation),
    locataireGerant: !!(x && x.locataireGerant),
    mediateur: (x && x.mediateur) || {},
  });
  return norm(a) === norm(b);
}

/* ==================================================================== */
/*  LES BRIQUES : une option, un interrupteur, une section               */
/* ==================================================================== */

/**
 * UN CHOIX, et pas une pastille. Une rangée entière de 44 points au moins,
 * annoncée « bouton radio » avec son état : `PillToggle` atteint les 44 par
 * `hitSlop`, que le navigateur ignore, et ne se mesure donc pas ici.
 */
export function Option({ choisi, libelle, aide, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: !!choisi }}
      /* `react-native-web` n'émet PAS `aria-checked` depuis
         `accessibilityState` — mesuré au navigateur le 18/10 : les cinq
         options sortaient sans état, et un lecteur d'écran n'y entendait
         aucun choix. La propriété `aria-*`, React Native la comprend aussi
         (comme `aria-selected` dans `ui.js`). */
      aria-checked={!!choisi}
      accessibilityLabel={aide ? `${libelle}. ${aide}` : libelle}
      style={({ pressed }) => [s.option, choisi && s.optionChoisie, pressed && APPUI.discret]}
    >
      <View style={[s.rond, choisi && s.rondPlein]} />
      <View style={s.optionTexte}>
        <Text style={s.optionLibelle}>{libelle}</Text>
        {!!aide && <Text style={s.optionAide}>{aide}</Text>}
      </View>
    </Pressable>
  );
}

function Interrupteur({ actif, libelle, aide, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!actif }}
      aria-checked={!!actif}
      accessibilityLabel={aide ? `${libelle}. ${aide}` : libelle}
      style={({ pressed }) => [s.option, actif && s.optionChoisie, pressed && APPUI.discret]}
    >
      <View style={[s.case_, actif && s.caseCochee]}>
        {actif && <Check size={14} color={C.surface} />}
      </View>
      <View style={s.optionTexte}>
        <Text style={s.optionLibelle}>{libelle}</Text>
        {!!aide && <Text style={s.optionAide}>{aide}</Text>}
      </View>
    </Pressable>
  );
}

function Section({ ancre, titre, onPosition, children }) {
  return (
    <View
      style={s.section}
      onLayout={(e) => onPosition && onPosition(ancre, e.nativeEvent.layout.y)}
    >
      <Text style={s.sectionTitre} accessibilityRole="header">{titre}</Text>
      {children}
    </View>
  );
}

function Aide({ children }) {
  return <Text style={s.aide}>{children}</Text>;
}

/**
 * LES MODALITÉS DE PAIEMENT, avec l'avis « à la signature » qui apparaît
 * PENDANT la saisie — au départ de la frappe différée, jamais à chaque
 * lettre. Son propre composant, avec son propre texte : seul lui se
 * redessine. L'avis ne bloque RIEN : sur un devis envoyé après la visite
 * et accepté plus tard, la formule est permise (cahier 4.1).
 */
const ChampPaiement = forwardRef(function ChampPaiement({ defaut }, ref) {
  /* `vu` : le texte une fois la frappe retombée — c'est lui qui décide de
     l'avis. `vif` : le texte exact, pour `lire()` au moment d'enregistrer
     (la leçon de `ChampLocal` : une lecture d'un rendu passé amputerait les
     dernières lettres). */
  const [vu, setVu] = useState(defaut);
  const [texte, setTexte] = useRechercheDifferee(vu, setVu);
  const vif = useRef(defaut);
  useImperativeHandle(ref, () => ({ lire: () => vif.current }));
  const avis = parleDUnPaiementALaSignature(vu)
    ? avisEmetteur({ emetteur: { modalites_paiement_texte: vu } }).find((a) => a.cle === 'a_la_signature')
    : null;
  return (
    <>
      <TextArea
        value={texte}
        onChangeText={(t) => { vif.current = t; setTexte(t); }}
        placeholder="Quand et comment le client paie : à réception de facture, par virement…"
        maxLength={L.modalites_paiement_texte}
        accessibilityLabel="Modalités de paiement"
      />
      {!!avis && <Text style={s.avisEnLigne}>{avis.texte}</Text>}
    </>
  );
});

/* ==================================================================== */
/*  LE FORMULAIRE                                                        */
/* ==================================================================== */

const FicheEmetteur = forwardRef(function FicheEmetteur({
  entreprise = null, reference, depart = null, assurances = [],
  onAjouterAssurance, onOuvrirAssurance, onChoisirMediateur,
  telephoneFiche = '', emailFiche = '', emailCompte = '',
  erreur = null, onEffacerErreur, onPosition,
}, ref) {
  /* L'ÉTAT DE DÉPART : le brouillon s'il y en a un, sinon ce qui est
     enregistré. Lu UNE fois, au montage — « Mon entreprise » change la
     `key` du formulaire chaque fois qu'il doit repartir d'ailleurs. */
  const [init, setInit] = useState(() => depart || etatDepuis(reference));
  const [choix, setChoix] = useState(init.choix);
  const [enLiquidation, setEnLiquidation] = useState(init.enLiquidation);
  const [locataireGerant, setLocataireGerant] = useState(init.locataireGerant);
  const [situationsRares, setSituationsRares] = useState(init.enLiquidation || init.locataireGerant);
  const [mediateur, setMediateur] = useState(init.mediateur);
  const [telVide, setTelVide] = useState(!init.textes.telephone.trim());
  const [emailVide, setEmailVide] = useState(!init.textes.email.trim());
  const [erreurFrais, setErreurFrais] = useState(null);

  /* Une référence par champ, posée par le champ lui-même au montage et
     retirée au démontage : un champ caché rend `undefined`, jamais une
     valeur périmée. */
  const champs = useRef({});
  const rues = useRef({ etablissement_adresse: init.textes.etablissement_adresse, siege_adresse: init.textes.siege_adresse });

  const montre = {
    identite: estEI(entreprise),
    capital: estSocieteCommerciale(entreprise),
    etablissement: !!entreprise && entreprise.adresse == null,
    siege: !!entreprise && entreprise.est_siege !== true,
  };

  /** Le texte du moment, champ par champ ; `undefined` pour un champ non monté. */
  const lireTextes = () => {
    const lu = {};
    const monte = (c) => champs.current[c];
    CHAMPS_TEXTE.forEach((c) => {
      if (RUES.includes(c)) {
        const visible = c === 'etablissement_adresse' ? montre.etablissement : montre.siege;
        lu[c] = visible ? rues.current[c] : undefined;
      } else {
        lu[c] = monte(c) ? monte(c).lire() : undefined;
      }
    });
    lu.capital = monte('capital') ? monte('capital').lire() : undefined;
    lu.frais_montant = monte('frais_montant') ? monte('frais_montant').lire() : undefined;
    lu.frais_texte = monte('frais_texte') ? monte('frais_texte').lire() : undefined;
    return lu;
  };

  /* Ce qui est défini l'emporte, le reste vient du départ. */
  const definis = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

  /** L'ÉTAT ENTIER du formulaire — le brouillon que « Mon entreprise » garde. */
  const instantane = () => ({
    textes: { ...init.textes, ...definis(lireTextes()) },
    choix,
    enLiquidation,
    locataireGerant,
    mediateur,
  });

  /* GARDER ce qui est tapé avant qu'un choix ne démonte des champs : sans
     ça, basculer « Je ne facture pas » puis revenir effacerait le montant
     qu'on venait d'écrire. */
  const garder = () => setInit((i) => ({ ...i, textes: { ...i.textes, ...definis(lireTextes()) } }));

  /**
   * CE QUI PART À LA BASE, aux noms de la base.
   *
   * Rend `{ ok: true, emetteur, tarifs }`, ou `{ ok: false, champ, message }`
   * pour un montant illisible ou un « 0 » tapé dans les frais — refusés
   * AVANT toute requête. Les autres refus viennent des miroirs des
   * contraintes, que « Mon entreprise » applique ensuite.
   */
  const lirePourEnregistrer = () => {
    const t = lireTextes();
    const lu = {};
    CHAMPS_TEXTE.forEach((c) => { if (t[c] !== undefined) lu[c] = t[c]; });

    lu.registre = choix.registre;
    if (choix.registre === 'rcs') {
      lu.en_liquidation = enLiquidation;
      lu.locataire_gerant = locataireGerant;
    } else {
      /* L'écran vide ce que la base viderait : on le voit, et rien ne
         s'enregistre « à moitié ». */
      lu.greffe_ville = null;
      lu.en_liquidation = false;
      lu.locataire_gerant = false;
    }

    if (montre.capital) {
      if (choix.capital === 'variable') {
        lu.capital_variable = true;
        lu.capital_centimes = null;
      } else if (choix.capital === 'montant') {
        const m = versCentimes(t.capital);
        if (!m.ok) return { ok: false, champ: 'capital_centimes', message: m.message };
        lu.capital_variable = false;
        lu.capital_centimes = m.centimes;
      } else {
        lu.capital_variable = null;
        lu.capital_centimes = null;
      }
    }

    lu.regime_tva = choix.regime_tva;

    if (mediateur.mode === 'liste') {
      lu.mediateur_nom = mediateur.nom;
      lu.mediateur_site = mediateur.site;
    } else if (mediateur.mode === 'aucun') {
      lu.mediateur_nom = null;
      lu.mediateur_adresse = null;
      lu.mediateur_site = null;
    }

    const frais = fraisDepuisFormulaire({
      aucun: choix.frais === 'aucun',
      montant: t.frais_montant,
      texte: t.frais_texte,
    });
    if (!frais.ok) return { ok: false, champ: frais.champ, message: frais.message };

    const base = (reference && reference.emetteur) || {};
    return { ok: true, emetteur: fusionnerFormulaire(base, lu), tarifs: frais.valeurs };
  };

  useImperativeHandle(ref, () => ({
    instantane,
    lirePourEnregistrer,
    aDesChangements: () => !memeEtat(instantane(), etatDepuis(reference)),
  }));

  const choisir = (cle, valeur) => {
    garder();
    if (cle === 'registre' && valeur !== 'rcs') {
      setInit((i) => ({ ...i, textes: { ...i.textes, greffe_ville: '' } }));
      setEnLiquidation(false);
      setLocataireGerant(false);
    }
    setChoix((c) => ({ ...c, [cle]: valeur }));
    if (onEffacerErreur) onEffacerErreur();
  };

  const sous = (champ) => {
    if (champ === 'frais_deplacement_centimes' && erreurFrais) {
      return <Text style={s.erreur}>{erreurFrais}</Text>;
    }
    return erreur && erreur.champ === champ ? <Text style={s.erreur}>{erreur.message}</Text> : null;
  };

  /* Une ancre par section, rapportée à « Mon entreprise » qui défile. */
  const pos = onPosition;

  const registres = rcsOblige(entreprise) ? REGISTRES.filter((r) => r.cle === 'rcs') : REGISTRES;
  const ref0 = (reference && reference.emetteur) || {};
  const tva = entreprise && entreprise.tva;
  const avisPaiementTexte = init.textes.modalites_paiement_texte;

  return (
    <View>
      {/* 1. — LE NOM D'UN ENTREPRENEUR INDIVIDUEL */}
      {montre.identite && (
        <Section ancre="identite" titre="Votre nom sur le devis" onPosition={pos}>
          <ChampLocal
            ref={(r) => { champs.current.denomination_ei = r; }}
            defaut={init.textes.denomination_ei}
            placeholder="Jean Dupont EI"
            maxLength={L.denomination_ei}
            returnKeyType="done"
          />
          <Aide>
            Votre nom suivi de « EI » ou « entrepreneur individuel » (code de commerce,
            R. 526-27). Si votre entreprise est une EIRL : « EIRL » ou « entrepreneur individuel à
            responsabilité limitée ». Opus ne le compose pas à votre place.
          </Aide>
          {sous('denomination_ei')}
        </Section>
      )}

      {/* 2. — L'IMMATRICULATION */}
      <Section ancre="immatriculation" titre="Où votre entreprise est immatriculée" onPosition={pos}>
        <View style={s.options}>
          {registres.map((r) => (
            <Option
              key={r.cle}
              choisi={choix.registre === r.cle}
              libelle={r.libelle}
              aide={r.aide}
              onPress={() => choisir('registre', r.cle)}
            />
          ))}
        </View>
        {rcsOblige(entreprise) && <Aide>{REGISTRE_D_UNE_SOCIETE}</Aide>}
        {sous('registre')}
        {choix.registre === 'rcs' && (
          <>
            <Text style={s.label}>Ville du greffe</Text>
            <ChampLocal
              ref={(r) => { champs.current.greffe_ville = r; }}
              defaut={init.textes.greffe_ville}
              placeholder="Marseille"
              maxLength={L.greffe_ville}
              returnKeyType="done"
            />
            {sous('greffe_ville')}
            <Pressable
              onPress={() => setSituationsRares((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: situationsRares }}
              accessibilityLabel="Situations rares : en liquidation, locataire-gérant"
              style={({ pressed }) => [s.replie, pressed && APPUI.discret]}
            >
              {situationsRares ? <ChevronDown size={15} color={C.accent2} /> : <ChevronRight size={15} color={C.accent2} />}
              <Text style={s.replieTexte}>Situations rares</Text>
            </Pressable>
            {situationsRares && (
              <View style={s.options}>
                <Interrupteur
                  actif={enLiquidation}
                  libelle="Mon entreprise est en liquidation"
                  aide="Le devis portera « en liquidation » après le RCS (code de commerce, R. 123-237)."
                  onPress={() => setEnLiquidation((v) => !v)}
                />
                <Interrupteur
                  actif={locataireGerant}
                  libelle="J’exploite un fonds en location-gérance"
                  aide="Le devis portera « locataire-gérant » après le RCS (code de commerce, R. 123-237)."
                  onPress={() => setLocataireGerant((v) => !v)}
                />
              </View>
            )}
          </>
        )}
      </Section>

      {/* 3. — LE CAPITAL D'UNE SOCIÉTÉ COMMERCIALE */}
      {montre.capital && (
        <Section ancre="capital" titre="Capital social" onPosition={pos}>
          <View style={s.options}>
            <Option
              choisi={choix.capital === 'montant'}
              libelle="Un montant"
              onPress={() => choisir('capital', 'montant')}
            />
            <Option
              choisi={choix.capital === 'variable'}
              libelle="À capital variable"
              aide="« À capital variable » remplace le montant sur vos devis."
              onPress={() => choisir('capital', 'variable')}
            />
          </View>
          {choix.capital === 'montant' && (
            <ChampLocal
              ref={(r) => { champs.current.capital = r; }}
              defaut={init.textes.capital}
              placeholder="Montant en euros, par exemple 1000"
              keyboardType="decimal-pad"
              accessibilityLabel="Capital social, en euros"
            />
          )}
          <Aide>
            Une SARL ou une société par actions (SA, SAS, SCA) indique son capital sur ses devis
            (code de commerce, R. 123-238). Une SNC ou une SCS n’y est pas tenue, mais « à capital
            variable » se dit si c’est le cas (L. 231-2).
          </Aide>
          {sous('capital_centimes')}
        </Section>
      )}

      {/* 4. — LES ADRESSES QU'OPUS N'A PAS */}
      {(montre.etablissement || montre.siege) && (
        <Section ancre="adresses" titre="Adresses" onPosition={pos}>
          {montre.etablissement && (
            <>
              <Text style={s.label}>Adresse de votre établissement</Text>
              <Aide>
                Le répertoire Sirene (INSEE) ne l’a pas transmise — c’est le cas quand son
                titulaire s’est opposé à sa diffusion. Elle ne s’affiche que sur vos devis.
              </Aide>
              <ChampVille
                type="rue"
                placeholder="Numéro et rue"
                valeur={init.textes.etablissement_adresse}
                maxLength={L.etablissement_adresse}
                onChange={(lieu) => {
                  rues.current.etablissement_adresse = lieu.rue || lieu.affichage || '';
                  if (lieu.codePostal && champs.current.etablissement_code_postal) {
                    champs.current.etablissement_code_postal.ecrire(lieu.codePostal);
                  }
                  if (lieu.ville && champs.current.etablissement_ville) {
                    champs.current.etablissement_ville.ecrire(lieu.ville);
                  }
                }}
              />
              {sous('etablissement_adresse')}
              <View style={s.ligneCp}>
                <View style={s.cp}>
                  <Text style={s.label}>Code postal</Text>
                  <ChampLocal
                    ref={(r) => { champs.current.etablissement_code_postal = r; }}
                    defaut={init.textes.etablissement_code_postal}
                    placeholder="13410"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={s.ville}>
                  <Text style={s.label}>Ville</Text>
                  <ChampLocal
                    ref={(r) => { champs.current.etablissement_ville = r; }}
                    defaut={init.textes.etablissement_ville}
                    placeholder="Lambesc"
                    maxLength={L.etablissement_ville}
                    returnKeyType="done"
                  />
                </View>
              </View>
              {sous('etablissement_code_postal')}
              {sous('etablissement_ville')}
            </>
          )}
          {montre.siege && (
            <>
              <Text style={s.label}>Adresse du siège</Text>
              <Aide>
                {entreprise.est_siege === false
                  ? 'Votre établissement n’est pas le siège de votre entreprise : vos devis porteront '
                    + 'aussi l’adresse du siège — tous vos devis si votre entreprise est au RCS, ceux '
                    + 'adressés à un particulier sinon. Opus ne l’a pas encore enregistrée depuis le '
                    + 'répertoire : écrivez-la telle qu’elle figure sur votre extrait d’immatriculation.'
                  : 'Le répertoire ne dit pas si votre établissement est le siège. Si ce n’est pas '
                    + 'le cas, écrivez ici l’adresse du siège, telle qu’elle figure sur votre extrait '
                    + 'd’immatriculation.'}
              </Aide>
              <ChampVille
                type="rue"
                placeholder="Numéro et rue du siège"
                valeur={init.textes.siege_adresse}
                maxLength={L.siege_adresse}
                onChange={(lieu) => {
                  rues.current.siege_adresse = lieu.rue || lieu.affichage || '';
                  if (lieu.codePostal && champs.current.siege_code_postal) {
                    champs.current.siege_code_postal.ecrire(lieu.codePostal);
                  }
                  if (lieu.ville && champs.current.siege_ville) champs.current.siege_ville.ecrire(lieu.ville);
                }}
              />
              {sous('siege_adresse')}
              <View style={s.ligneCp}>
                <View style={s.cp}>
                  <Text style={s.label}>Code postal</Text>
                  <ChampLocal
                    ref={(r) => { champs.current.siege_code_postal = r; }}
                    defaut={init.textes.siege_code_postal}
                    placeholder="13001"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={s.ville}>
                  <Text style={s.label}>Ville</Text>
                  <ChampLocal
                    ref={(r) => { champs.current.siege_ville = r; }}
                    defaut={init.textes.siege_ville}
                    placeholder="Marseille"
                    maxLength={L.siege_ville}
                    returnKeyType="done"
                  />
                </View>
              </View>
              {sous('siege_code_postal')}
              {sous('siege_ville')}
            </>
          )}
        </Section>
      )}

      {/* 5. — POUR VOUS JOINDRE */}
      <Section ancre="contact" titre="Pour vous joindre" onPosition={pos}>
        <Text style={s.label}>Téléphone</Text>
        <ChampLocal
          ref={(r) => { champs.current.telephone = r; }}
          defaut={init.textes.telephone}
          placeholder="04 90 00 00 00"
          keyboardType="phone-pad"
          maxLength={L.telephone}
          surSeuil={({ vide }) => setTelVide(vide)}
        />
        {/* UNE PROPOSITION QUI MONTRE AVANT DE POSER, et disparaît dès que le
            champ est rempli : la règle de l'e-mail du 05/10. */}
        {telVide && !!telephoneFiche && (
          <Pressable
            onPress={() => champs.current.telephone && champs.current.telephone.ecrire(telephoneFiche)}
            accessibilityRole="button"
            accessibilityLabel={`Reprendre le téléphone de ma fiche, ${telephoneFiche}`}
            style={({ pressed }) => [s.reprendre, pressed && APPUI.plein]}
          >
            <Text style={s.reprendreTexte} numberOfLines={2}>
              {`Reprendre celui de ma fiche (${telephoneFiche})`}
            </Text>
          </Pressable>
        )}
        {sous('telephone')}

        <Text style={s.label}>E-mail</Text>
        <ChampLocal
          ref={(r) => { champs.current.email = r; }}
          defaut={init.textes.email}
          placeholder="contact@votre-entreprise.fr"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={L.email}
          returnKeyType="done"
          surSeuil={({ vide }) => setEmailVide(vide)}
        />
        {emailVide && !!emailFiche && (
          <Pressable
            onPress={() => champs.current.email && champs.current.email.ecrire(emailFiche)}
            accessibilityRole="button"
            accessibilityLabel={`Reprendre l’e-mail de ma fiche, ${emailFiche}`}
            style={({ pressed }) => [s.reprendre, pressed && APPUI.plein]}
          >
            <Text style={s.reprendreTexte} numberOfLines={2}>
              {`Reprendre celui de ma fiche (${emailFiche})`}
            </Text>
          </Pressable>
        )}
        {emailVide && !!emailCompte && emailCompte !== emailFiche && (
          <Pressable
            onPress={() => champs.current.email && champs.current.email.ecrire(emailCompte)}
            accessibilityRole="button"
            accessibilityLabel={`Utiliser l’adresse de mon compte, ${emailCompte}`}
            style={({ pressed }) => [s.reprendre, pressed && APPUI.plein]}
          >
            <Text style={s.reprendreTexte} numberOfLines={2}>
              {`Utiliser l’adresse de mon compte (${emailCompte})`}
            </Text>
          </Pressable>
        )}
        {sous('email')}
        <Aide>
          Imprimés sur vos devis, que seul votre client reçoit. Ils ne s’affichent pas sur votre
          fiche publique. Pour un devis à un particulier, la loi demande vos coordonnées
          (code de la consommation, L. 111-1).
        </Aide>
      </Section>

      {/* 6. — LA TVA : rien de pré-coché */}
      <Section ancre="tva" titre="TVA" onPosition={pos}>
        <View style={s.options}>
          {REGIMES_TVA.map((r) => (
            <Option
              key={r.cle}
              choisi={choix.regime_tva === r.cle}
              libelle={r.libelle}
              aide={r.aide}
              onPress={() => choisir('regime_tva', r.cle)}
            />
          ))}
        </View>
        {sous('regime_tva')}
        {!!entreprise && (
          <Aide>
            {tva
              ? `Numéro de TVA intracommunautaire transmis par l’annuaire des entreprises (liste de la `
                + `DGFiP) : ${tva} — il s’imprimera sur vos devis, quel que soit votre régime.`
              : 'L’annuaire des entreprises (liste de la DGFiP) n’affiche pas de numéro de TVA '
                + 'intracommunautaire pour votre entreprise. Cela ne prouve rien sur votre régime : '
                + 'c’est à vous de le dire.'}
          </Aide>
        )}
        {!!ref0.regime_tva_declare_le && choix.regime_tva === ref0.regime_tva && (
          <Text style={s.declare}>{`Déclaré le ${dateFrancaise(ref0.regime_tva_declare_le)}`}</Text>
        )}
      </Section>

      {/* 7. — LES ASSURANCES : déclarées, jamais exigées */}
      <Section ancre="assurances" titre="Assurances" onPosition={pos}>
        {assurances.length === 0 && (
          <Aide>
            Aucune assurance déclarée. Opus n’en exige aucune ; déclarez celles que vous avez
            souscrites, elles s’imprimeront sur vos devis.
          </Aide>
        )}
        {assurances.map((a) => {
          const n = a.nature === 'autre'
            ? (a.libelle || 'Autre assurance')
            : ((NATURES_ASSURANCE.find((x) => x.cle === a.nature) || {}).libelle || 'Assurance');
          return (
            <Pressable
              key={String(a.id)}
              onPress={() => onOuvrirAssurance(a)}
              accessibilityRole="button"
              accessibilityLabel={`${n}, ${a.assureur_nom}. Modifier cette assurance`}
              style={({ pressed }) => [s.assurance, pressed && APPUI.discret]}
            >
              <View style={s.optionTexte}>
                <Text style={s.optionLibelle}>{n}</Text>
                <Text style={s.optionAide} numberOfLines={2}>
                  {`${a.assureur_nom} — ${a.couverture}${a.attestation_chemin ? ' · attestation jointe' : ''}`}
                </Text>
              </View>
              <ChevronRight size={15} color={C.muted} />
            </Pressable>
          );
        })}
        <Pressable
          onPress={onAjouterAssurance}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une assurance"
          style={({ pressed }) => [s.ajouter, pressed && APPUI.plein]}
        >
          <Plus size={15} color={C.accent2} />
          <Text style={s.ajouterTexte}>Ajouter une assurance</Text>
        </Pressable>
      </Section>

      {/* 8. — LE MÉDIATEUR : la liste officielle d'abord */}
      <Section ancre="mediateur" titre="Médiateur de la consommation" onPosition={pos}>
        <Aide>
          Ce n’est pas une information à trouver : c’est une adhésion à un médiateur référencé
          par la Commission d’évaluation et de contrôle de la médiation de la consommation
          (CECMC). Sans médiateur, vous pourrez préparer des devis pour des professionnels, pas
          pour des particuliers.
        </Aide>

        {mediateur.mode === 'liste' && (
          <>
            <View style={s.mediateurChoisi}>
              <Text style={s.optionLibelle}>{mediateur.nom}</Text>
              <Text style={s.optionAide}>{mediateur.site}</Text>
            </View>
            <View style={s.rangeeBoutons}>
              <BtnMini outline label="Changer" onPress={() => onChoisirMediateur(instantane())} style={s.cible} />
              <BtnMini
                outline
                label="Retirer"
                onPress={() => { garder(); setMediateur({ mode: 'aucun', nom: null, site: null }); }}
                style={s.cible}
              />
            </View>
            <Text style={s.label}>Adresse du médiateur</Text>
            <ChampLocal
              ref={(r) => { champs.current.mediateur_adresse = r; }}
              defaut={init.textes.mediateur_adresse}
              placeholder="Telle qu’elle figure sur votre contrat d’adhésion"
              maxLength={L.mediateur_adresse}
              returnKeyType="done"
            />
            <Aide>{ADRESSE_A_RECOPIER}</Aide>
          </>
        )}

        {mediateur.mode === 'libre' && (
          <>
            <Aide>
              {`La liste a été relevée le ${dateFrancaise(MEDIATEURS_RELEVES_LE)}. Si votre médiateur a `
                + 'été référencé depuis, écrivez-le ici : il doit l’être par la CECMC.'}
            </Aide>
            <Text style={s.label}>Nom du médiateur</Text>
            <ChampLocal
              ref={(r) => { champs.current.mediateur_nom = r; }}
              defaut={init.textes.mediateur_nom}
              placeholder="Le nom de votre médiateur"
              maxLength={L.mediateur_nom}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => champs.current.mediateur_adresse && champs.current.mediateur_adresse.focus()}
            />
            <Text style={s.label}>Son adresse</Text>
            <ChampLocal
              ref={(r) => { champs.current.mediateur_adresse = r; }}
              defaut={init.textes.mediateur_adresse}
              placeholder="Telle qu’elle figure sur votre contrat d’adhésion"
              maxLength={L.mediateur_adresse}
              returnKeyType="done"
            />
            <Text style={s.label}>Son site</Text>
            <ChampLocal
              ref={(r) => { champs.current.mediateur_site = r; }}
              defaut={init.textes.mediateur_site}
              placeholder="https://www.exemple.fr"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={L.mediateur_site}
              returnKeyType="done"
            />
            <BtnMini outline label="Choisir plutôt dans la liste" onPress={() => onChoisirMediateur(instantane())} style={s.cible} />
          </>
        )}

        {mediateur.mode === 'aucun' && (
          <>
            <Pressable
              onPress={() => onChoisirMediateur(instantane())}
              accessibilityRole="button"
              accessibilityLabel="Choisir mon médiateur dans la liste officielle"
              style={({ pressed }) => [s.principalListe, pressed && APPUI.plein]}
            >
              <Text style={s.principalListeTexte}>Choisir dans la liste officielle</Text>
            </Pressable>
            <BtnMini
              outline
              label="Mon médiateur n’est pas dans la liste"
              onPress={() => { garder(); setMediateur({ mode: 'libre', nom: null, site: null }); }}
              style={s.cible}
            />
          </>
        )}
        {sous('mediateur_nom')}
        {sous('mediateur_adresse')}
        {sous('mediateur_site')}
      </Section>

      {/* 9. — LES GARANTIES, en ses mots */}
      <Section ancre="garanties" titre="Garanties" onPosition={pos}>
        <Text style={s.label}>Garanties légales</Text>
        <ChampLocal
          ref={(r) => { champs.current.garantie_legale_texte = r; }}
          multiligne
          defaut={init.textes.garantie_legale_texte}
          placeholder="En vos mots"
          maxLength={L.garantie_legale_texte}
        />
        <Aide>
          Les garanties que la loi attache à vos travaux (pour un ouvrage : code civil, articles
          1792 et suivants). Écrivez-les en vos mots : Opus ne rédige pas cette mention.
        </Aide>
        {sous('garantie_legale_texte')}
        <Text style={s.label}>Garantie commerciale</Text>
        <ChampLocal
          ref={(r) => { champs.current.garantie_commerciale_texte = r; }}
          multiligne
          defaut={init.textes.garantie_commerciale_texte}
          placeholder="Facultatif"
          maxLength={L.garantie_commerciale_texte}
        />
        <Aide>
          Seulement si vous en offrez une : elle s’ajoute à la garantie légale, elle ne la
          remplace pas.
        </Aide>
        {sous('garantie_commerciale_texte')}
        <Text style={s.label}>Service après-vente</Text>
        <ChampLocal
          ref={(r) => { champs.current.sav_texte = r; }}
          multiligne
          defaut={init.textes.sav_texte}
          placeholder="Facultatif"
          maxLength={L.sav_texte}
        />
        {sous('sav_texte')}
      </Section>

      {/* 10. — VOS CONDITIONS */}
      <Section ancre="conditions" titre="Vos conditions" onPosition={pos}>
        <Text style={s.label}>Modalités de paiement</Text>
        <ChampPaiement
          ref={(r) => { champs.current.modalites_paiement_texte = r; }}
          defaut={avisPaiementTexte}
        />
        <Aide>
          Les modalités s’impriment sur tous vos devis. L’acompte et sa date se fixeront sur
          chaque devis.
        </Aide>
        {sous('modalites_paiement_texte')}
        <Text style={s.label}>Modalités d’exécution</Text>
        <ChampLocal
          ref={(r) => { champs.current.modalites_execution_texte = r; }}
          multiligne
          defaut={init.textes.modalites_execution_texte}
          placeholder="Comment se déroulent vos travaux : préparation, protection, nettoyage…"
          maxLength={L.modalites_execution_texte}
        />
        {sous('modalites_execution_texte')}
        <Text style={s.label}>Réclamations</Text>
        <ChampLocal
          ref={(r) => { champs.current.reclamations_texte = r; }}
          multiligne
          defaut={init.textes.reclamations_texte}
          placeholder="Comment un client vous adresse une réclamation, et comment vous la traitez"
          maxLength={L.reclamations_texte}
        />
        {sous('reclamations_texte')}
        <Aide>
          Pour un devis à un particulier, la loi demande ces trois indications (code de la
          consommation, R. 111-1).
        </Aide>
      </Section>

      {/* 11. — LES FRAIS DE DÉPLACEMENT : un champ vide et « aucun » ne se
          ressemblent pas. SEUL l'interrupteur écrit le 0. */}
      <Section ancre="frais" titre="Frais de déplacement" onPosition={pos}>
        <Interrupteur
          actif={choix.frais === 'aucun'}
          libelle="Je ne facture pas de frais de déplacement"
          aide={`Vos devis porteront « ${LIBELLES_IMPRIMES.fraisNonFactures} ».`}
          onPress={() => {
            /* L'interrupteur ne fait que changer le CHOIX : c'est
               `fraisDepuisFormulaire`, à l'enregistrement, qui en tire le 0 —
               le seul endroit qui l'écrit. */
            setErreurFrais(null);
            choisir('frais', choix.frais === 'aucun' ? 'facture' : 'aucun');
          }}
        />
        {choix.frais !== 'aucun' && (
          <>
            <Text style={s.label}>Montant</Text>
            <ChampLocal
              ref={(r) => { champs.current.frais_montant = r; }}
              defaut={init.textes.frais_montant}
              placeholder="En euros, par exemple 35"
              keyboardType="decimal-pad"
              accessibilityLabel="Frais de déplacement, en euros"
              /* `onBlur`, et pas `onEndEditing`, que `react-native-web` ne
                 connaît pas (mesuré le 18/10) : le refus doit se voir des
                 deux côtés, avant tout envoi. */
              onBlur={() => {
                const r = fraisDepuisFormulaire({
                  aucun: false,
                  montant: champs.current.frais_montant ? champs.current.frais_montant.lire() : '',
                  texte: '',
                });
                setErreurFrais(r.ok ? null : r.message);
              }}
            />
            {sous('frais_deplacement_centimes')}
            <Text style={s.label}>Vos conditions</Text>
            <ChampLocal
              ref={(r) => { champs.current.frais_texte = r; }}
              multiligne
              defaut={init.textes.frais_texte}
              placeholder="Par exemple : gratuit jusqu’à 20 km, puis 0,50 € par kilomètre"
              maxLength={LONGUEUR_MAX.tarifs_pro.frais_deplacement_texte}
            />
            {sous('frais_deplacement_texte')}
          </>
        )}
        <Aide>Un champ vide et « aucun » ne se ressemblent pas : dites-le.</Aide>
        {/* DEUX CHIFFRES DE DÉPLACEMENT COEXISTENT jusqu'au lot des tarifs :
            celui du devis, privé, et celui du SOS, PUBLIC — `SosScreen` les
            affiche aux particuliers. Sans la dernière phrase, l'artisan
            croyait que l'engagement « Vos tarifs et vos prix » couvrait aussi
            ses tarifs d'urgence (relecture du 18/10/2026). La phrase du
            propriétaire reste telle quelle, au milieu. */}
        <Aide>
          Ces frais-ci, ceux de vos devis, ne sont montrés à personne d’autre que vous : ils ne
          s’impriment que sur vos devis.
        </Aide>
        <Aide>
          Les tarifs de vos urgences (SOS) se règlent encore à part, dans « Modifier mon profil ».
          Ceux-là s’affichent aux particuliers qui cherchent une urgence.
        </Aide>
        <Aide>
          Si vous faites du dépannage, de la réparation ou de l’entretien, la loi demande aussi
          d’afficher vos tarifs sur vos pages en ligne (arrêté du 24 janvier 2017, art. 3), et
          votre fiche Opus pourrait en être une. Opus ne les y affiche pas encore.
        </Aide>
      </Section>
    </View>
  );
});

export default FicheEmetteur;

const s = StyleSheet.create({
  section: {
    gap: S.xs, paddingTop: S.lg, marginTop: S.lg, borderTopWidth: 1, borderTopColor: C.line,
  },
  sectionTitre: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink, marginBottom: S.xs },
  label: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink, marginTop: S.md },
  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
    marginTop: S.xs,
  },
  erreur: {
    fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit),
    borderLeftWidth: S.xs, borderLeftColor: C.bad, paddingLeft: S.sm, marginTop: S.xs,
  },
  avisEnLigne: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
    borderLeftWidth: S.xs, borderLeftColor: C.accent2, paddingLeft: S.sm, marginTop: S.xs,
  },
  declare: { fontFamily: F.inter6, fontSize: T.petit, color: C.ok, marginTop: S.xs },
  options: { gap: S.xs },
  /* UNE OPTION est une rangée de formulaire : angle VIF, et la bordure des
     champs, qui dit OÙ APPUYER (3,85 : 1 sur blanc). 44 points au moins. */
  option: {
    flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: TOUCHE,
    paddingVertical: S.sm, paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.bordChamp, backgroundColor: C.surface,
  },
  optionChoisie: { borderColor: C.accent2, borderWidth: 2 },
  optionTexte: { flex: 1, minWidth: 0, gap: S.xs },
  optionLibelle: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink },
  optionAide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  rond: {
    width: S.lg + S.xs, height: S.lg + S.xs, borderRadius: rond(S.lg + S.xs),
    borderWidth: 2, borderColor: C.bordChamp,
  },
  rondPlein: { borderColor: C.accent2, borderWidth: 6 },
  case_: {
    width: S.lg + S.xs, height: S.lg + S.xs, borderWidth: 2, borderColor: C.bordChamp,
    alignItems: 'center', justifyContent: 'center',
  },
  caseCochee: { backgroundColor: C.accent2, borderColor: C.accent2 },
  replie: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE },
  replieTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2 },
  ligneCp: { flexDirection: 'row', gap: S.md },
  cp: { width: 112 },
  ville: { flex: 1, minWidth: 0 },
  /* Les propositions FLOTTENT : arrondies, 44 points, orange de texte. */
  reprendre: {
    alignSelf: 'flex-start', justifyContent: 'center', minHeight: TOUCHE,
    borderRadius: R.gelule, borderWidth: 1, borderColor: C.accentTexte,
    paddingHorizontal: S.md, marginTop: S.sm,
  },
  reprendreTexte: { fontFamily: F.inter6, fontSize: T.petit, color: C.accentTexte },
  assurance: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE,
    paddingVertical: S.sm, paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.line, backgroundColor: C.surface,
  },
  ajouter: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, alignSelf: 'flex-start',
    minHeight: TOUCHE, paddingHorizontal: S.md, marginTop: S.sm,
    borderWidth: 1, borderColor: C.accent2, borderRadius: R.gelule,
  },
  ajouterTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2 },
  mediateurChoisi: {
    gap: S.xs, padding: S.md, marginTop: S.sm, backgroundColor: C.bg,
    borderLeftWidth: S.xs, borderLeftColor: C.accent2,
  },
  rangeeBoutons: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  principalListe: {
    minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center', marginTop: S.sm,
    borderRadius: R.gelule, backgroundColor: C.accent2, paddingHorizontal: S.lg,
  },
  /* Le blanc sur le bleu acier : 9,27 : 1 (theme.js). */
  principalListeTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.surface },
  cible: { minHeight: TOUCHE, alignSelf: 'flex-start', marginTop: S.sm },
});
