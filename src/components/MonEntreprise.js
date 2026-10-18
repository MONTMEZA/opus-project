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
import IdentiteEntreprise from './IdentiteEntreprise';
import PretAEmettre from './PretAEmettre';
import ApercuEntete from './ApercuEntete';
import FicheEmetteur, { etatDepuis, memeEtat, SECTION_DU_CHAMP } from './FicheEmetteur';
import FicheAssurance from './FicheAssurance';
import {
  EnteteMediateurs, RangeeMediateur, PiedMediateurs, AucunMediateur,
} from './ListeMediateurs';

const FICHE_EN_LECTURE = { etat: 'charge', emetteur: null, assurances: [], tarifs: null };
const MANQUES_EN_LECTURE = { etat: 'charge', liste: [] };

/* LES DEUX LECTURES, hors du composant : elles ne posent leur résultat
   qu'APRÈS la réponse, jamais pendant le rendu ni au début d'un effet. */
async function lireFiche(poser) {
  try {
    const d = await api.monEmetteur();
    poser({ etat: 'pret', ...d });
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
      const d = await lireFiche(setDonnees);
      if (d && sectionInitiale && sectionInitiale !== 'entreprise') {
        cible.current = sectionInitiale;
        setCleFiche((k) => k + 1);
        setMode('edition');
      }
    })();
    lireManques(setManques);
  }, [sectionInitiale]);

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
      const tarifsVides = !lu.tarifs || (lu.tarifs.frais_deplacement_centimes == null
        && !lu.tarifs.frais_deplacement_texte);
      const tarifs = tarifsVides && !donnees.tarifs ? undefined : lu.tarifs;
      const r = await api.enregistrerEmetteur({ emetteur: lu.emetteur, tarifs });
      setDonnees((d) => ({
        ...d, etat: 'pret', emetteur: r.emetteur || d.emetteur, tarifs: r.tarifs || d.tarifs,
      }));
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
        /* LA FICHE EST PARTIE, LES FRAIS NON — et l'écran le dit, au lieu
           de laisser croire que rien ne l'est. On relit, pour que le
           formulaire compare désormais à ce qui est vraiment en base. */
        lireFiche(setDonnees);
        const texte = 'Vos informations de devis sont enregistrées, mais pas vos frais de '
          + `déplacement. ${messageClair(e)}`;
        setErreur({ champ: 'frais_deplacement_centimes', message: messageClair(e, 'Vos frais de déplacement') });
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

  const reessayerFiche = () => { setDonnees(FICHE_EN_LECTURE); lireFiche(setDonnees); };
  const reessayerManques = () => { setManques(MANQUES_EN_LECTURE); lireManques(setManques); };

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
          <View style={[s.message, message.ton === 'erreur' && s.messageErreur]}>
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
                />
                {donnees.etat === 'pret' && entrepriseEtat === 'pret' && (
                  <ApercuEntete
                    entreprise={entreprise}
                    emetteur={donnees.emetteur}
                    assurances={donnees.assurances}
                    tarifs={donnees.tarifs}
                  />
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
});
