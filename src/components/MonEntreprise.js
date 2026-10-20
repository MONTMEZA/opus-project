/**
 * « MON ENTREPRISE » — l'identité de l'entreprise ET ce qui rend un devis
 * légal (lot 0a du module devis, section 46 de `schema.sql`).
 *
 * UNE SEULE « MON ENTREPRISE », DEUX PORTES, LE MÊME TRAVAIL
 * ----------------------------------------------------------
 * Elle s'ouvre depuis « Mon profil » (une rangée sous « Mes clients ») et
 * depuis « Modifier mon profil » (la rangée qui résume l'entreprise). Les
 * deux appellent `ouvrirMonEntreprise()` dans `OpusApp`, qui la monte UNE
 * fois, à la racine, avec une `key` qui change à chaque ouverture : elle
 * repart toujours de ce qui est en base. Jamais deux écrans du même nom
 * (plan 10.1) — l'ancienne feuille `FeuilleEntreprise.js` a disparu.
 *
 * PLEIN ÉCRAN, ET PAS UNE FEUILLE DU BAS
 * --------------------------------------
 * Une vingtaine de champs ne tiennent pas dans une feuille collée au bas de
 * l'écran : le clavier de l'iPhone la recouvre, champ ET croix — le « je
 * suis bloqué » du 04/10. Ici la croix est EN HAUT, dans une boîte de 44
 * points (pas un `hitSlop`, que le navigateur ignore), et le conteneur qui
 * défile porte `{...CLAVIER}` : c'est son CONTENU qui remonte au-dessus du
 * clavier. Aucun `KeyboardAvoidingView` par-dessus — la hauteur du clavier
 * serait comptée deux fois.
 *
 * QUATRE MODES DANS LA MÊME FENÊTRE, jamais deux fenêtres empilées (deux
 * `Modal` l'une sur l'autre laissent sur iPhone un voile invisible qui
 * avale les touches) :
 *   - `lecture`    : prêt à émettre ? l'entreprise, l'aperçu de l'en-tête ;
 *   - `edition`    : les informations de devis (`FicheEmetteur`) ;
 *   - `assurance`  : une assurance (`FicheAssurance`) ;
 *   - `mediateur`  : la liste officielle — une `FlatList` qui REMPLACE le
 *                    `ScrollView`, parce qu'une liste virtualisée ne va pas
 *                    dans un `ScrollView` de même orientation.
 * Partir choisir un médiateur ou une assurance démonte le formulaire : son
 * état est gardé dans un BROUILLON, et il revient avec ce qu'on avait tapé.
 *
 * LES MESSAGES VIVENT DANS LA FENÊTRE. Le bandeau d'`OpusApp` est SOUS
 * elle : un message posé là ne se verrait qu'une fois la fenêtre fermée.
 *
 * SES TARIFS (lot T, section 47) : « Mon entreprise » est la SEULE porte qui
 * les écrit. En lecture, un bloc « Vos tarifs » dit s'ils sont affichés, les
 * MONTRE tels que les particuliers les voient (ou les verraient), et dit ce
 * que devient le réglage d'urgence — la phrase d'`etatReglageSos`, reçue
 * d'`OpusApp`, jamais réécrite ici. Chaque lecture et chaque enregistrement
 * de la fiche remonte les tarifs à `OpusApp` (`onTarifs`) : le réglage
 * d'urgence et « Mes tarifs » lisent la même ligne.
 *
 * UN ÉCHEC DE LECTURE N'OUVRE JAMAIS UN FORMULAIRE VIDE : il ferait croire
 * que rien n'est enregistré, et un « Enregistrer » touché là effacerait ce
 * qui l'était. Le bouton est désactivé tant que la lecture n'a pas répondu,
 * et remplacé par une explication si elle a échoué.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, ScrollView, FlatList, Pressable, StyleSheet, Linking,
} from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne,
} from '../theme';
import { BtnMain, BtnMini, BandeDemo } from './ui';
import { X } from './icons';
import { CLAVIER } from '../lib/clavier';
import * as api from '../lib/api';
import * as retour from '../lib/retour';
import { messageClair, messageDeContrainte } from '../lib/erreurs';
import {
  validerEmetteur, validerTarifs, avisEmetteur, chercherMediateur,
} from '../lib/emetteur';
import { dateFrancaise } from '../lib/entreprise';
import { messageTva } from '../lib/tva';
import {
  QUI_VOIT_LES_TARIFS, QUI_VERRAIT_LES_TARIFS, TARIFS_NON_AFFICHES, lignesTarifs,
} from '../lib/tarifs';
import IdentiteEntreprise from './IdentiteEntreprise';
import TarifsPublics from './TarifsPublics';
import PretAEmettre from './PretAEmettre';
import ApercuEntete from './ApercuEntete';
import FicheEmetteur, { etatDepuis, memeEtat, SECTION_DU_CHAMP } from './FicheEmetteur';
import FicheAssurance from './FicheAssurance';
import {
  EnteteMediateurs, RangeeMediateur, PiedMediateurs, AucunMediateur,
} from './ListeMediateurs';

const FICHE_EN_LECTURE = {
  etat: 'charge', emetteur: null, assurances: [], tarifs: null, preuveTva: null,
};
const MANQUES_EN_LECTURE = { etat: 'charge', liste: [] };

/* LES DEUX LECTURES, hors du composant : elles ne posent leur résultat
   qu'APRÈS la réponse, jamais pendant le rendu ni au début d'un effet.
   `surTarifs` reçoit les tarifs lus : `OpusApp` garde ainsi `mesTarifs` à
   jour, et un réglage d'urgence qui disait « vos tarifs n'ont pas pu être
   lus » se corrige dès qu'ils l'ont été ici. */
async function lireFiche(poser, surTarifs = null) {
  try {
    const d = await api.monEmetteur();
    poser({ etat: 'pret', ...d });
    if (surTarifs) surTarifs(d.tarifs || null);
    return d;
  } catch (e) {
    poser({ ...FICHE_EN_LECTURE, etat: 'echec' });
    return null;
  }
}

async function lireManques(poser) {
  try {
    const liste = await api.emetteurIncomplet();
    poser({ etat: 'pret', liste });
    return liste;
  } catch (e) {
    poser({ etat: 'echec', liste: [] });
    return null;
  }
}

/* Les colonnes DÉCLARÉES d'une ligne de tarifs : sans aucune, et sans
   « Afficher », la ligne est vide — et une ligne vide ne s'écrit pas. */
const TARIFS_DECLARES = [
  'frais_deplacement_centimes', 'frais_deplacement_texte', 'taux_horaire_centimes',
  'majoration_pct', 'decompte_temps_texte', 'prix_devis_centimes',
];

/* Le champ d'un refus de la BASE sur `tarifs_pro`, d'après le nom de la
   contrainte : le message va sous le bon champ, et l'écran y défile. Un
   refus qui n'en nomme aucune (une règle, le réseau) ne vise aucun champ. */
const CHAMP_DE_LA_CONTRAINTE = {
  tarif_affiche_check: 'affiche',
  tarif_taux_horaire_check: 'taux_horaire_centimes',
  tarif_majoration_check: 'majoration_pct',
  tarif_devis_check: 'prix_devis_centimes',
  tarif_decompte_texte_check: 'decompte_temps_texte',
  tarif_frais_check: 'frais_deplacement_centimes',
  tarif_frais_texte_check: 'frais_deplacement_texte',
  tarif_frais_zero_check: 'frais_deplacement_texte',
};

/* Le séparateur de la liste des médiateurs, déclaré au niveau du MODULE :
   écrit en fonction fléchée, ce serait un type de composant neuf à chaque
   rendu, et React démonterait puis remonterait tous les séparateurs. Et
   l'espace va DANS la cellule — jamais un `gap` dans le conteneur d'une
   liste, où le fenêtrage tombe dans les trous (17/10). */
function SeparateurMediateurs() {
  return <View style={s.separateur} />;
}

const choses = (n) => (n > 1 ? `${n} choses` : `${n} chose`);

export default function MonEntreprise({
  sectionInitiale = null, onFermer,
  entreprise = null, entrepriseRetiree = null, badge = false, entrepriseEtat = 'jamais',
  onChargerEntreprise, onRattacherSiret,
  proId = null, metiers = [], telephoneFiche = '', emailFiche = '', emailCompte = '',
  attestationBadge = null,
  /* Lot T : ce que dit le réglage d'urgence (`etatReglageSos`, calculé par
     `OpusApp`), ou `null` s'il n'y a rien à en dire ; et la remontée des
     tarifs lus ou enregistrés. */
  etatSos = null, onTarifs = null,
}) {
  const [mode, setMode] = useState('lecture');
  const [donnees, setDonnees] = useState(FICHE_EN_LECTURE);
  const [manques, setManques] = useState(MANQUES_EN_LECTURE);
  const [brouillon, setBrouillon] = useState(null);
  const [cleFiche, setCleFiche] = useState(0);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [quitter, setQuitter] = useState(false);
  const [assurance, setAssurance] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [occupe, setOccupe] = useState(false);
  /* Une assurance en cours d'envoi ou de retrait (son formulaire le dit
     par `onOccupe`) : pendant ce temps, fermer ne doit pas proposer de
     « quitter sans enregistrer » — l'écriture est déjà partie. */
  const [occupeAssurance, setOccupeAssurance] = useState(false);
  /* Un contrôle de n° de TVA en vol (section 48) : VIES met souvent 10 à
     30 secondes. Fermer la fenêtre ne l'annulerait pas — la fonction Edge
     écrirait quand même la preuve —, et rouvrir montrait un écran qui
     disait le contraire de ce qui se passait, puis laissait partir un
     second contrôle (relecture du 20/10/2026). On attend, comme pour un
     enregistrement. */
  const [occupeTva, setOccupeTva] = useState(false);
  /* Un message « attendez » ne survit pas à ce qu'il fait attendre : resté
     affiché après la réponse de VIES, il disait « en cours » au-dessus d'un
     numéro déjà reconnu (capture du 20/10/2026). Il part au moment même où
     le contrôle se termine — dans le rappel, pas dans un effet. */
  const occuperTva = (enCours) => {
    setOccupeTva(enCours);
    if (!enCours) setMessage((m) => (m && m.ton === 'attente' ? null : m));
  };
  /* Le garde du RETRAIT, dans une référence : deux appuis arrivés dans la
     même image verraient encore tous les deux l'ancien état. */
  const retraitEnCours = useRef(false);

  const fiche = useRef(null);
  const ficheAssurance = useRef(null);
  const defile = useRef(null);
  /* Où se trouvent les sections, pour y défiler : l'identité (en lecture),
     le formulaire, et chacune de ses sections. */
  const positions = useRef({ identite: null, fiche: null, sections: {} });
  const cible = useRef(null);

  useEffect(() => {
    if (sectionInitiale === 'entreprise') cible.current = 'entreprise';
    (async () => {
      const d = await lireFiche(setDonnees, onTarifs);
      if (d && sectionInitiale && sectionInitiale !== 'entreprise') {
        cible.current = sectionInitiale;
        setCleFiche((k) => k + 1);
        setMode('edition');
      }
    })();
    lireManques(setManques);
  }, [sectionInitiale, onTarifs]);

  const reference = { emetteur: donnees.emetteur, tarifs: donnees.tarifs };
  const demo = api.mode === 'demo';

  /* ------------------------------------------------------------------ */
  /*  Les messages, dans la fenêtre                                      */
  /* ------------------------------------------------------------------ */
  const afficher = (texte, ton = 'ok') => {
    setMessage({ texte, ton });
    retour.annoncer(texte);
  };

  /* ------------------------------------------------------------------ */
  /*  Défiler jusqu'à une section                                        */
  /* ------------------------------------------------------------------ */
  const tenterDefilement = () => {
    const c = cible.current;
    if (!c || !defile.current) return;
    const p = positions.current;
    let y = null;
    if (c === 'entreprise') y = p.identite;
    else if (p.fiche != null && p.sections[c] != null) y = p.fiche + p.sections[c];
    if (y == null) return;
    defile.current.scrollTo({ y: Math.max(0, y - S.md), animated: true });
    cible.current = null;
  };

  const enHaut = () => { if (defile.current) defile.current.scrollTo({ y: 0, animated: false }); };

  /* ------------------------------------------------------------------ */
  /*  Les passages d'un mode à l'autre                                   */
  /* ------------------------------------------------------------------ */
  const entrerEnEdition = (section = null) => {
    if (donnees.etat !== 'pret') {
      afficher('Vos informations de devis n’ont pas pu être lues : réessayez avant de les compléter.',
        'erreur');
      return;
    }
    if (occupeTva) {
      afficher('Contrôle auprès de VIES en cours : attendez sa réponse.', 'attente');
      return;
    }
    setBrouillon(null);
    setErreur(null);
    setMessage(null);
    setQuitter(false);
    positions.current.sections = {};
    cible.current = section;
    setCleFiche((k) => k + 1);
    setMode('edition');
    if (!section) enHaut();
  };

  const completer = (motif) => {
    if (motif.section === 'entreprise') {
      cible.current = 'entreprise';
      tenterDefilement();
      return;
    }
    entrerEnEdition(motif.section);
  };

  /* Revenir au formulaire depuis une assurance ou la liste des médiateurs :
     il se remonte sur le BROUILLON, et défile jusqu'à la section d'où l'on
     était parti. */
  const revenirAuFormulaire = (section) => {
    setQuitter(false);
    positions.current.sections = {};
    cible.current = section;
    setCleFiche((k) => k + 1);
    setMode('edition');
  };

  const ouvrirAssurance = (a) => {
    setBrouillon(fiche.current ? fiche.current.instantane() : brouillon);
    setAssurance({ fiche: a || null });
    setErreur(null);
    setQuitter(false);
    setMode('assurance');
    enHaut();
  };

  const choisirMediateur = (instantane) => {
    setBrouillon(instantane);
    setRecherche('');
    setQuitter(false);
    setMode('mediateur');
  };

  const mediateurChoisi = (m) => {
    setBrouillon((b) => {
      const base = b || etatDepuis(reference);
      /* Le même médiateur garde l'adresse déjà recopiée ; un autre la
         vide : ce n'est plus la même adresse. La liste publiée ne la donne
         pas, et la contrainte refuse un médiateur à moitié écrit. */
      const meme = base.mediateur && base.mediateur.nom === m.nom;
      return {
        ...base,
        mediateur: { mode: 'liste', nom: m.nom, site: m.site },
        textes: {
          ...base.textes,
          mediateur_nom: m.nom,
          mediateur_site: m.site,
          mediateur_adresse: meme ? base.textes.mediateur_adresse : '',
        },
      };
    });
    revenirAuFormulaire('mediateur');
  };

  const mediateurLibre = () => {
    setBrouillon((b) => ({ ...(b || etatDepuis(reference)), mediateur: { mode: 'libre', nom: null, site: null } }));
    revenirAuFormulaire('mediateur');
  };

  /* ------------------------------------------------------------------ */
  /*  Fermer, et la bande « Quitter sans enregistrer »                   */
  /* ------------------------------------------------------------------ */
  const aDesChangements = () => {
    if (mode === 'edition') return !!(fiche.current && fiche.current.aDesChangements());
    if (mode === 'assurance' && ficheAssurance.current && ficheAssurance.current.aDesChangements()) return true;
    if (mode === 'assurance' || mode === 'mediateur') return !!brouillon && !memeEtat(brouillon, etatDepuis(reference));
    return false;
  };

  /* LA BANDE DIT VRAI, OU ELLE N'EST PAS LÀ — relecture du 18/10/2026.
     Elle restait affichée après un enregistrement réussi (« vos
     modifications ne sont pas enregistrées », juste au-dessus de
     « Enregistré »), et, touchée PENDANT l'envoi, la croix proposait
     « Quitter sans enregistrer » alors que l'écriture partie aboutissait
     quand même. Un renoncement qui n'en est pas un. Donc : chaque succès et
     chaque changement de mode la referme, et pendant un envoi on attend. */
  const fermer = () => {
    if (occupe || occupeAssurance) {
      afficher('Enregistrement en cours : attendez qu’il se termine. L’interrompre ne '
        + 'l’annulerait pas.');
      return;
    }
    if (occupeTva) {
      afficher('Contrôle auprès de VIES en cours : attendez sa réponse. Fermer ne l’annulerait pas.', 'attente');
      return;
    }
    if (!quitter && aDesChangements()) {
      setQuitter(true);
      retour.avertissement();
      retour.annoncer('Vos modifications ne sont pas enregistrées.');
      return;
    }
    onFermer();
  };

  /* ------------------------------------------------------------------ */
  /*  Enregistrer les informations de devis                              */
  /* ------------------------------------------------------------------ */
  const refuser = (champ, texte) => {
    setErreur({ champ, message: texte });
    retour.echec();
    retour.annoncer(texte);
    const section = SECTION_DU_CHAMP[champ];
    /* Le champ refusé est dans une section affichée : on y va. Sinon (une
       section que la forme de l'entreprise ne montre pas), le message ne
       peut vivre que dans la bande du haut — jamais nulle part. */
    if (section && positions.current.sections[section] != null) {
      cible.current = section;
      tenterDefilement();
    } else {
      afficher(texte, 'erreur');
    }
  };

  const phraseApres = (liste) => {
    const debut = demo
      ? 'Enregistré pour la démonstration : rien n’est écrit en base.'
      : 'Enregistré.';
    if (liste == null) return `${debut} Ce qui manque n’a pas pu être relu : réessayez.`;
    if (!liste.length) return `${debut} Vos informations d’entreprise sont complètes.`;
    return `${debut} Il manque encore ${choses(liste.length)}.`;
  };

  const enregistrer = async () => {
    if (occupe || !fiche.current) return;
    const lu = fiche.current.lirePourEnregistrer();
    if (!lu.ok) { refuser(lu.champ, lu.message); return; }
    /* LES MÊMES REFUS QUE LA BASE, AVANT L'ENVOI, avec les mêmes mots :
       `messageDeContrainte` est la table qui traduit aussi un refus de la
       vraie base. Le formulaire garde tout. */
    const v = validerEmetteur(lu.emetteur);
    if (!v.ok) { refuser(v.champ, messageDeContrainte(v.contrainte)); return; }
    const vt = validerTarifs(lu.tarifs);
    if (!vt.ok) { refuser(vt.champ, messageDeContrainte(vt.contrainte)); return; }

    setOccupe(true);
    setErreur(null);
    setMessage(null);
    try {
      /* UNE LIGNE DE TARIFS VIDE NE S'ÉCRIT PAS. Sans ligne, « non déclaré »
         se dit déjà ; deux `null` créés sans qu'on ait touché aux frais ne
         feraient qu'apparaître vides dans l'export de ses données (relevé
         sur la vraie base le 18/10). Une ligne qui EXISTE, elle, se met à
         jour même vers rien : c'est ainsi qu'on retire ses frais. */
      /* Lot T : vide = les SIX valeurs non déclarées ET « Afficher » éteint.
         Un 0 n'est pas un vide : c'est un interrupteur touché. */
      const tarifsVides = !lu.tarifs || (TARIFS_DECLARES
        .every((c) => lu.tarifs[c] == null || lu.tarifs[c] === '') && lu.tarifs.affiche !== true);
      const tarifs = tarifsVides && !donnees.tarifs ? undefined : lu.tarifs;
      const r = await api.enregistrerEmetteur({ emetteur: lu.emetteur, tarifs });
      setDonnees((d) => ({
        ...d, etat: 'pret', emetteur: r.emetteur || d.emetteur, tarifs: r.tarifs || d.tarifs,
      }));
      if (onTarifs) onTarifs(r.tarifs || donnees.tarifs || null);
      setBrouillon(null);
      setQuitter(false);
      setMode('lecture');
      enHaut();
      retour.reussite();
      const liste = await lireManques(setManques);
      afficher(phraseApres(liste));
    } catch (e) {
      retour.echec();
      if (e && e.etape === 'tarifs') {
        /* LA FICHE EST PARTIE, LES TARIFS NON — et l'écran le dit, au lieu
           de laisser croire que rien ne l'est. On relit, pour que le
           formulaire compare désormais à ce qui est vraiment en base. */
        lireFiche(setDonnees, onTarifs);
        const texte = `Vos informations de devis sont enregistrées, mais pas vos tarifs. ${messageClair(e)}`;
        const nom = (String((e && e.message) || '').match(/"(tarif_[a-z_]+_check)"/) || [])[1];
        const champ = nom ? CHAMP_DE_LA_CONTRAINTE[nom] : null;
        setErreur(champ ? { champ, message: messageClair(e, 'Vos tarifs') } : null);
        afficher(texte, 'erreur');
      } else {
        afficher(messageClair(e, 'Vos informations de devis'), 'erreur');
      }
    }
    setOccupe(false);
  };

  /* ------------------------------------------------------------------ */
  /*  Les assurances                                                     */
  /* ------------------------------------------------------------------ */
  /* L'ATTESTATION D'ABORD, LA LIGNE ENSUITE : une ligne qui pointerait un
     fichier pas encore arrivé serait un lien mort. */
  const enregistrerAssurance = async (valeurs, doc) => {
    let chemin = valeurs.attestation_chemin || null;
    if (doc) chemin = await api.envoyerAttestation(doc);
    const existante = assurance && assurance.fiche;
    const pose = await api.enregistrerAssurance(
      { ...valeurs, attestation_chemin: chemin }, existante ? existante.id : null,
    );
    setDonnees((d) => ({
      ...d,
      assurances: existante
        ? d.assurances.map((x) => (String(x.id) === String(pose.id) ? pose : x))
        : [...d.assurances, pose],
    }));
    retour.reussite();
    setQuitter(false);
    afficher(demo
      ? 'Assurance enregistrée pour la démonstration : rien n’est écrit en base.'
      : 'Assurance enregistrée.');
    lireManques(setManques);
    revenirAuFormulaire('assurances');
  };

  /* UN SEUL RETRAIT, même sous un double appui (relecture du 18/10/2026 :
     deux suppressions partaient, deux vibrations, deux messages). Et la
     phrase ne parle d'une attestation conservée que s'il y en avait une. */
  const retirerAssurance = async (a) => {
    if (retraitEnCours.current) return;
    retraitEnCours.current = true;
    try {
      await api.retirerAssurance(a.id);
      setDonnees((d) => ({ ...d, assurances: d.assurances.filter((x) => String(x.id) !== String(a.id)) }));
      retour.reussite();
      setQuitter(false);
      afficher(a.attestation_chemin
        ? 'Assurance retirée. Son attestation reste dans vos documents professionnels.'
        : 'Assurance retirée.');
      lireManques(setManques);
      revenirAuFormulaire('assurances');
    } catch (e) {
      retour.echec();
      afficher(messageClair(e, 'Cette assurance n’a pas pu être retirée'), 'erreur');
    } finally {
      retraitEnCours.current = false;
    }
  };

  const voirAttestation = async (chemin) => {
    try {
      const url = await api.lienAttestation(chemin);
      if (url) Linking.openURL(url);
      else afficher('Cette attestation ne peut pas s’ouvrir ici.', 'erreur');
    } catch (e) {
      afficher(messageClair(e, 'L’attestation n’a pas pu s’ouvrir'), 'erreur');
    }
  };

  /* Rattacher son SIRET depuis le bloc « Votre entreprise » : ce qui manque
     change avec l'entreprise, on le relit. */
  const rattacher = async (siret) => {
    const identite = await onRattacherSiret(siret);
    afficher('Votre entreprise est rattachée à votre fiche.');
    lireManques(setManques);
    return identite;
  };

  /* Faire contrôler son n° de TVA par VIES (section 48). La fonction Edge a
     DÉJÀ écrit (ou retiré) la preuve quand elle répond : l'écran pose ce
     qu'elle a dit, puis relit ce qui manque — c'est la base qui décide si
     le motif `conso_tva_intra` s'éteint. */
  const controlerTva = async (numero) => {
    const r = await api.controlerTva(numero);
    if (r.issue === 'reconnu' && entreprise) {
      setDonnees((d) => ({
        ...d,
        preuveTva: { siren: entreprise.siren, numero: r.numero, reconnu_le: r.reconnu_le || null, source: 'vies' },
      }));
      lireManques(setManques);
    } else if (r.issue === 'refuse') {
      setDonnees((d) => (d.preuveTva && d.preuveTva.numero === r.numero ? { ...d, preuveTva: null } : d));
      lireManques(setManques);
    } else if (r.issue === 'deja_publie') {
      /* La base a déjà le numéro de l'annuaire, et l'écran ne l'avait pas
         (une revérification par l'administration, un autre appareil) : on
         RELIT l'entreprise — sans redemander le SIRET — et ce qui manque.
         Le bloc de saisie disparaît avec l'arrivée du numéro : le message
         vit dans la bande de la fenêtre. */
      if (onChargerEntreprise) onChargerEntreprise();
      lireManques(setManques);
      afficher(messageTva('deja_publie').texte);
    }
    return r;
  };

  const reessayerFiche = () => { setDonnees(FICHE_EN_LECTURE); lireFiche(setDonnees, onTarifs); };
  const reessayerManques = () => { setManques(MANQUES_EN_LECTURE); lireManques(setManques); };

  /* Le bloc « Vos tarifs » de la lecture. */
  const tarifsLus = donnees.tarifs || null;
  const tarifsAffiches = !!(tarifsLus && tarifsLus.affiche === true);
  const afficheLe = tarifsAffiches && tarifsLus.affiche_le ? dateFrancaise(tarifsLus.affiche_le) : null;
  const aDesTarifs = lignesTarifs(tarifsLus).length > 0;

  const titreBouton = manques.etat === 'pret' && manques.liste.length === 0 && donnees.emetteur
    ? 'Modifier mes informations de devis'
    : 'Compléter mes informations de devis';

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={fermer}>
      <View style={s.ecran}>
        <BandeDemo visible={demo} />
        <View style={s.entete}>
          <Text style={s.titre} accessibilityRole="header">Mon entreprise</Text>
          <Pressable
            onPress={fermer}
            accessibilityRole="button"
            accessibilityLabel="Fermer « Mon entreprise »"
            style={({ pressed }) => [s.croix, pressed && APPUI.discret]}
          >
            <X size={20} color={C.ink} />
          </Pressable>
        </View>

        {quitter && (
          <View style={s.quitter}>
            <Text style={s.quitterTexte}>Vos modifications ne sont pas enregistrées.</Text>
            <View style={s.quitterBoutons}>
              <BtnMini outline label="Rester" onPress={() => setQuitter(false)} style={s.cible} />
              <BtnMain ton="danger" label="Quitter sans enregistrer" onPress={onFermer} />
            </View>
          </View>
        )}

        {!!message && (
          <View style={[s.message, message.ton === 'erreur' && s.messageErreur,
            message.ton === 'attente' && s.messageAttente]}
          >
            <Text style={s.messageTexte}>{message.texte}</Text>
            <Pressable
              onPress={() => setMessage(null)}
              accessibilityRole="button"
              accessibilityLabel="Masquer ce message"
              style={({ pressed }) => [s.croix, pressed && APPUI.discret]}
            >
              <X size={16} color={C.muted} />
            </Pressable>
          </View>
        )}

        {mode === 'mediateur' ? (
          <FlatList
            {...CLAVIER}
            data={chercherMediateur(recherche)}
            keyExtractor={(m) => m.cle}
            renderItem={({ item }) => <RangeeMediateur mediateur={item} onChoisir={mediateurChoisi} />}
            ItemSeparatorComponent={SeparateurMediateurs}
            ListHeaderComponent={(
              <EnteteMediateurs
                recherche={recherche}
                onChercher={setRecherche}
                onRevenir={() => revenirAuFormulaire('mediateur')}
              />
            )}
            ListFooterComponent={<PiedMediateurs onLibre={mediateurLibre} />}
            ListEmptyComponent={AucunMediateur}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={5}
            contentContainerStyle={s.listeMediateurs}
          />
        ) : (
          <ScrollView {...CLAVIER} ref={defile} contentContainerStyle={s.contenu}>
            {mode === 'lecture' && (
              <>
                <PretAEmettre
                  etat={manques.etat}
                  motifs={manques.liste}
                  avis={donnees.etat === 'pret'
                    ? avisEmetteur({ assurances: donnees.assurances, emetteur: donnees.emetteur })
                    : []}
                  onReessayer={reessayerManques}
                  onCompleter={donnees.etat === 'pret' ? completer : null}
                />
                <IdentiteEntreprise
                  entreprise={entreprise}
                  retiree={entrepriseRetiree}
                  badge={badge}
                  etat={entrepriseEtat}
                  onRecharger={onChargerEntreprise}
                  onRattacher={rattacher}
                  onLayout={(e) => { positions.current.identite = e.nativeEvent.layout.y; tenterDefilement(); }}
                  preuveTva={donnees.etat === 'pret' ? donnees.preuveTva : null}
                  regimeTva={donnees.etat === 'pret' && donnees.emetteur ? donnees.emetteur.regime_tva : null}
                  onControlerTva={donnees.etat === 'pret' ? controlerTva : null}
                  onOccupeTva={occuperTva}
                />
                {donnees.etat === 'pret' && entrepriseEtat === 'pret' && (
                  <ApercuEntete
                    entreprise={entreprise}
                    emetteur={donnees.emetteur}
                    assurances={donnees.assurances}
                    tarifs={donnees.tarifs}
                    preuveTva={donnees.preuveTva}
                  />
                )}
                {/* VOS TARIFS (lot T) — SEULEMENT une fois la fiche LUE : pendant
                    la lecture ou après un échec, `tarifs` vaut `null`, et le
                    bloc dirait « Non affichés » de tarifs qu'on n'a pas lus. */}
                {donnees.etat === 'pret' && (
                  <View style={s.blocTarifs}>
                    <Text style={s.titreBloc} accessibilityRole="header">Vos tarifs</Text>
                    <Text style={s.texte}>
                      {tarifsAffiches
                        ? `Affichés sur votre fiche${afficheLe ? ` depuis le ${afficheLe}` : ''}.`
                        : `Non affichés. ${TARIFS_NON_AFFICHES}`}
                    </Text>
                    {/* Le réglage d'urgence, en une phrase : celle de
                        `etatReglageSos`, la même que dans « Modifier mon
                        profil ». */}
                    {!!etatSos && <Text style={s.texte}>{etatSos.phrase}</Text>}
                    {/* ON MONTRE AVANT DE PUBLIER, ET À QUI : l'aperçu est le
                        bloc exact de la fiche, avec la phrase qui dit que seuls
                        les particuliers le voient — au CONDITIONNEL quand ils
                        ne sont pas affichés : sous « Ce que verraient… », le
                        présent « Visibles des particuliers » disait faux
                        (relecture du 19/10/2026). */}
                    {aDesTarifs && (
                      <TarifsPublics
                        tarifs={donnees.tarifs}
                        titre={tarifsAffiches ? 'Ce que voient les particuliers' : 'Ce que verraient les particuliers'}
                        quiLesVoit={tarifsAffiches ? QUI_VOIT_LES_TARIFS : QUI_VERRAIT_LES_TARIFS}
                        dansUnePage={false}
                      />
                    )}
                    <Pressable
                      onPress={() => entrerEnEdition('frais')}
                      accessibilityRole="button"
                      accessibilityLabel={aDesTarifs ? 'Modifier mes tarifs' : 'Déclarer mes tarifs'}
                      style={({ pressed }) => [s.rangee, pressed && APPUI.discret]}
                    >
                      <Text style={s.rangeeTexte}>{aDesTarifs ? 'Modifier mes tarifs' : 'Déclarer mes tarifs'}</Text>
                    </Pressable>
                  </View>
                )}
                {donnees.etat === 'echec' ? (
                  <View style={s.echec}>
                    <Text style={s.texte}>
                      Vos informations de devis n’ont pas pu être lues. Ce n’est pas qu’elles sont
                      vides : réessayez.
                    </Text>
                    <BtnMini outline label="Réessayer" onPress={reessayerFiche} style={s.cible} />
                  </View>
                ) : (
                  <BtnMain
                    block
                    label={donnees.etat === 'pret' ? titreBouton : 'Lecture de vos informations de devis…'}
                    disabled={donnees.etat !== 'pret'}
                    onPress={() => entrerEnEdition(null)}
                  />
                )}
                {!!(donnees.emetteur && donnees.emetteur.modifie_le) && (
                  <Text style={s.pied}>
                    {`Dernière modification le ${dateFrancaise(donnees.emetteur.modifie_le)}`}
                  </Text>
                )}
              </>
            )}

            {mode === 'edition' && (
              <>
                <Text style={s.intro}>
                  Ce qui rend vos devis légaux et que le répertoire Sirene (INSEE) ne donne pas.
                  Rien n’est coché à votre place : ce que vous ne savez pas encore peut rester vide,
                  et « Prêt à émettre un devis ? » dira ce qui manque.
                </Text>
                <View onLayout={(e) => { positions.current.fiche = e.nativeEvent.layout.y; tenterDefilement(); }}>
                  <FicheEmetteur
                    key={`fiche-${cleFiche}`}
                    ref={fiche}
                    entreprise={entrepriseEtat === 'pret' ? entreprise : null}
                    preuveTva={donnees.preuveTva}
                    reference={reference}
                    depart={brouillon}
                    assurances={donnees.assurances}
                    onAjouterAssurance={() => ouvrirAssurance(null)}
                    onOuvrirAssurance={ouvrirAssurance}
                    onChoisirMediateur={choisirMediateur}
                    telephoneFiche={telephoneFiche}
                    emailFiche={emailFiche}
                    emailCompte={emailCompte}
                    erreur={erreur}
                    onEffacerErreur={() => setErreur(null)}
                    onPosition={(cle, y) => { positions.current.sections[cle] = y; tenterDefilement(); }}
                  />
                </View>
                <BtnMain
                  block
                  disabled={occupe}
                  label={occupe ? 'Enregistrement…' : 'Enregistrer mes informations de devis'}
                  onPress={enregistrer}
                  style={s.enregistrer}
                />
              </>
            )}

            {mode === 'assurance' && (
              <FicheAssurance
                key={`assurance-${cleFiche}`}
                ref={ficheAssurance}
                assurance={assurance ? assurance.fiche : null}
                metiers={metiers}
                proId={proId}
                attestationBadge={attestationBadge}
                voirPossible={!demo}
                onEnregistrer={enregistrerAssurance}
                onRetirer={retirerAssurance}
                onOccupe={setOccupeAssurance}
                onAnnuler={() => revenirAuFormulaire('assurances')}
                onVoir={voirAttestation}
              />
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.bg, paddingTop: S.xxl + S.md },
  entete: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    paddingLeft: S.lg, paddingRight: S.xs, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  titre: { flex: 1, fontFamily: F.oswald6, fontSize: T.titre, color: C.ink },
  /* LA CROIX : une boîte de 44 × 44, pas un `hitSlop` — le navigateur
     ignore celui-ci, et on ne mesurerait rien. */
  croix: { minWidth: TOUCHE, minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center' },
  quitter: {
    gap: S.sm, padding: S.md, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.line, borderLeftWidth: S.xs, borderLeftColor: C.bad,
  },
  quitterTexte: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink },
  quitterBoutons: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.sm },
  message: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingLeft: S.md,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
    borderLeftWidth: S.xs, borderLeftColor: C.ok,
  },
  messageErreur: { borderLeftColor: C.bad },
  /* Ni une réussite (vert) ni une erreur : une attente. */
  messageAttente: { borderLeftColor: C.accent2 },
  messageTexte: {
    flex: 1, minWidth: 0, paddingVertical: S.sm, fontFamily: F.inter, fontSize: T.courant,
    color: C.ink, lineHeight: interligne(T.courant),
  },
  /* La marge d'un conteneur qui défile va dans `contentContainerStyle`. */
  contenu: { padding: S.lg, paddingBottom: S.xxl * 2, gap: S.lg },
  listeMediateurs: { padding: S.lg, paddingBottom: S.xxl * 2 },
  separateur: { height: S.sm },
  intro: { fontFamily: F.inter, fontSize: T.courant, color: C.muted, lineHeight: interligne(T.courant) },
  texte: { fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  echec: {
    gap: S.sm, padding: S.md, backgroundColor: C.surface,
    borderLeftWidth: S.xs, borderLeftColor: C.bad, borderRadius: R.vif,
  },
  enregistrer: { marginTop: S.lg },
  pied: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, textAlign: 'center' },
  cible: { minHeight: TOUCHE, alignSelf: 'flex-start' },
  /* Le bloc « Vos tarifs » PORTE l'information : angle vif. */
  blocTarifs: {
    gap: S.sm, padding: S.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderRadius: R.vif,
  },
  titreBloc: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  /* Une rangée de réglage : 44 points par sa boîte, jamais un `hitSlop`. */
  rangee: {
    flexDirection: 'row', alignItems: 'center', minHeight: TOUCHE,
    paddingHorizontal: S.md, borderWidth: 1, borderColor: C.bordChamp, backgroundColor: C.surface,
  },
  rangeeTexte: { flex: 1, fontFamily: F.inter6, fontSize: T.courant, color: C.accent2 },
});
