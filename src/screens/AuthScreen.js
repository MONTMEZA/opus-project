/**
 * Création de compte et connexion.
 *
 * L'écran s'adapte au type choisi juste avant : un professionnel donne aussi
 * le nom de son entreprise, son métier et sa ville, pour que sa fiche publique
 * existe dès l'inscription.
 *
 * DEPUIS LE 15/10/2026, UN PROFESSIONNEL S'INSCRIT EN DEUX TEMPS
 * --------------------------------------------------------------
 * Un compte pro ne naît plus qu'avec une entreprise trouvée ACTIVE au
 * répertoire Sirene de l'INSEE (section 45 de `schema.sql`). D'où :
 *
 *   1. « Votre entreprise » : le SIRET seul (`SaisieSiret`), et la carte
 *      « Est-ce bien votre entreprise ? » ;
 *   2. après « Oui » : le formulaire d'avant, PRÉREMPLI — le nom, les
 *      métiers proposés d'après le code d'activité, la commune. Préremplir
 *      AVANT la confirmation ferait valider sans lire.
 *
 * Et une troisième voie, la PORTE DE SECOURS, quand le répertoire ne
 * connaît pas l'entreprise ou ne répond pas : le compte s'ouvre en
 * PARTICULIER, avec une demande que l'administration examinera. Ce n'est
 * pas un refus déguisé — le même compte devient professionnel dès que
 * l'entreprise est contrôlée, sans rien perdre.
 *
 * Le `KeyboardAvoidingView` reste : ce formulaire est centré, et
 * `verifier-feuilles` tient qu'il monte avec le clavier. On ne lui ajoute
 * PAS `CLAVIER` — les deux mécanismes compteraient le clavier deux fois.
 */
import { pieceExistence } from '../lib/verification';
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  C, F, T, S, GRAD_160, interligne, TOUCHE, APPUI,
} from '../theme';
/* La traduction des erreurs vivait ICI, enfermée : partout ailleurs dans
   l'application, le même défaut sortait en anglais. Elle est devenue
   `src/lib/erreurs.js`, et elle sait aussi reconnaître une perte de réseau —
   le cas le plus fréquent sur un chantier. */
import { messageClair as traduire } from '../lib/erreurs';
import {
  HazardStrip, Field, BtnMain, ChampMotDePasse, TextArea,
} from '../components/ui';
import ChampVille from '../components/ChampVille';
import ChoixMetiers from '../components/ChoixMetiers';
import SaisieSiret, { EntrepriseRepliee } from '../components/SaisieSiret';
import { ChevronLeft, Check, ShieldCheck } from '../components/icons';
import { VERSION } from '../data/legal';
import {
  entreprisePreremplie, propositionMetiers, communeEtDepartement,
  AIDE_NOM_EI, AIDE_VILLE, NOM_ENTREPRISE_MAX,
} from '../lib/entreprise';
import { formaterSiret, libelleMotif } from '../lib/siret';
import * as retour from '../lib/retour';

/* Le texte de la porte de secours — celui que le plan du lot a arrêté.
   Il dit ce que le compte PEUT faire en attendant, et ce qu'il ne peut
   pas : un artisan qui découvre après coup qu'il ne peut pas publier
   croirait l'application cassée. */
const TEXTE_SECOURS = 'Opus va vérifier votre entreprise lui-même. En attendant, votre '
  + 'compte est ouvert en attente : vous pouvez tout regarder et écrire des messages, mais '
  + 'pas encore publier ni recevoir de demandes. Dès que votre entreprise est vérifiée, ce '
  + 'même compte devient professionnel : vous ne perdez rien.';

/* Un message de 500 caractères au plus : la contrainte de la base
   (`demande_pro_message_check`). Le refuser APRÈS l'avoir laissé taper
   serait pire que de l'arrêter au bon moment. */
const MESSAGE_MAX = 500;

export default function AuthScreen({ userType, onSignUp, onSignIn, onRetour, onLireLegal }) {
  /* Le clavier doit mener quelque part : « Suivant » saute d'un champ à
     l'autre au lieu de se refermer. */
  const champMotDePasse = useRef(null);
  const insets = useSafeAreaInsets();
  const estPro = userType === 'pro';

  const [mode, setMode] = useState('inscription');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [entreprise, setEntreprise] = useState('');
  /* VIDE au départ, et c'est voulu : il n'y a plus de « Maçon » coché
     d'office. Les métiers viennent du code d'activité de l'entreprise, ou
     de l'artisan lui-même — jamais d'une valeur par défaut qu'on valide
     sans la lire. */
  const [metiers, setMetiers] = useState([]);
  const [proposition, setProposition] = useState(null);
  const [lieu, setLieu] = useState({ affichage: '' });

  /* LES TROIS TEMPS DE L'INSCRIPTION PRO : 'entreprise' (le SIRET),
     'formulaire' (après « Oui »), 'secours' (la vérification à la main). */
  const [etape, setEtape] = useState('entreprise');
  const [identite, setIdentite] = useState(null);
  const [secours, setSecours] = useState(null);
  const [message, setMessage] = useState('');
  const [aideNom, setAideNom] = useState(null);
  const [villePreremplie, setVillePreremplie] = useState(false);
  /* Ce que `SaisieSiret` doit montrer en revenant à l'étape 1 — le numéro,
     et la raison du retour. La `cle` remonte le composant : ses valeurs
     initiales ne sont lues qu'au montage. */
  const [saisie, setSaisie] = useState({ cle: 0, siret: '', resultat: null });

  /* LES CHAMPS QUE L'ARTISAN A TOUCHÉS. Changer de numéro ne remplace que
     ce qu'il n'a pas corrigé lui-même : effacer une correction faite à la
     main, c'est la refaire faire. Une référence, pas un état — elle ne
     sert qu'aux gestionnaires, jamais à l'affichage. */
  const touche = useRef({ entreprise: false, metiers: false, lieu: false });
  const defilement = useRef(null);
  const position = useRef({ carte: 0, siret: 0 });

  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [mailEnvoye, setMailEnvoye] = useState(false);
  /* Ce qu'il advient du message d'une demande quand la confirmation par
     e-mail retient la session : 'attente' (il partira à la première
     connexion, depuis ce téléphone), 'perdu' (le téléphone n'a pas pu le
     garder), ou null. */
  const [messageDemande, setMessageDemande] = useState(null);
  /* L'acceptation des conditions. Décochée au départ, sans exception : une
     case pré-cochée ne vaut rien juridiquement — c'est le point que la CNIL
     rappelle le plus souvent. */
  const [conditions, setConditions] = useState(false);

  const enHaut = () => {
    if (defilement.current) defilement.current.scrollTo({ y: 0, animated: true });
  };

  /* Après une réponse, on remonte jusqu'au bloc du SIRET : la carte ou le
     message apparaît SOUS le champ, souvent sous le clavier qui vient de
     se ranger. */
  const versLeSiret = () => {
    if (!defilement.current) return;
    const y = Math.max(0, position.current.carte + position.current.siret - S.md);
    defilement.current.scrollTo({ y, animated: true });
  };

  /* « OUI, C'EST MON ENTREPRISE » — et SEULEMENT ALORS on préremplit. */
  const confirmer = (id) => {
    setIdentite(id);
    setErreur(null);
    if (!touche.current.entreprise) {
      const n = entreprisePreremplie(id);
      setEntreprise(n);
      setAideNom(n ? null : AIDE_NOM_EI);
    }
    if (!touche.current.metiers) {
      const p = propositionMetiers(id);
      setMetiers(p.metiers);
      setProposition(p.phrase);
    }
    if (!touche.current.lieu) {
      const v = communeEtDepartement(id);
      if (v) {
        /* Le code INSEE voyage avec : `completerLieu` s'en sert pour ne
           pas confondre deux communes du même nom. */
        setLieu({ affichage: v, codePostal: id.code_postal || null, codeInsee: id.code_insee || null });
        setVillePreremplie(true);
      }
    }
    setEtape('formulaire');
    enHaut();
  };

  /* CE QUE LE RÉPERTOIRE A PRÉREMPLI NE SURVIT PAS À UN CHANGEMENT DE
     NUMÉRO — relecture adverse, mesuré au navigateur sur l'écran voisin
     (`PasserProScreen`, le même code). « Changer », un numéro introuvable,
     puis la porte de secours : la demande partait avec le nom, les métiers
     « proposés d'après votre activité » et la commune d'une AUTRE
     entreprise — et ce nom devenait le nom PUBLIC du compte, puisqu'une
     demande de secours ouvre un compte particulier sous ce nom. Ce que
     l'artisan a corrigé lui-même (`touche`) reste ; le reste repart de
     zéro. */
  const oublierPreremplissage = () => {
    if (!touche.current.entreprise) {
      setEntreprise('');
      setAideNom(null);
    }
    if (!touche.current.metiers) setMetiers([]);
    setProposition(null);
    if (!touche.current.lieu) {
      setLieu({ affichage: '' });
      setVillePreremplie(false);
    }
  };

  /* Revenir à l'étape 1, avec le numéro déjà tapé et — s'il y en a une —
     la raison du retour, que `SaisieSiret` affiche comme un résultat. */
  const revenirAuSiret = (siret, resultat = null) => {
    setIdentite(null);
    setSecours(null);
    oublierPreremplissage();
    setEtape('entreprise');
    setSaisie((x) => ({ cle: x.cle + 1, siret: siret || '', resultat }));
    enHaut();
  };

  const valider = async () => {
    setErreur(null);

    if (!email.trim() || !motDePasse) {
      setErreur('Renseignez votre email et votre mot de passe.');
      return;
    }
    if (mode === 'inscription') {
      /* « CRÉER MON COMPTE » RESTE ACTIF, et c'est voulu : un bouton grisé
         ne dit pas pourquoi — on appuie, rien ne se passe, et on croit
         l'application cassée. Sans entreprise confirmée, il ramène à
         l'étape 1 en le disant. */
      if (estPro && etape === 'formulaire' && !identite) {
        retour.echec();
        revenirAuSiret('');
        setErreur('Vérifiez d’abord votre SIRET : c’est la première étape.');
        return;
      }
      if (motDePasse.length < 6) {
        setErreur('Le mot de passe doit faire au moins 6 caractères.');
        return;
      }
      if (estPro && !entreprise.trim()) {
        setErreur("Indiquez le nom de votre entreprise.");
        return;
      }
      /* La liste peut être VIDE à l'écran (rien n'est coché d'office) ; elle
         ne peut pas l'être à l'enregistrement. */
      if (estPro && metiers.length === 0) {
        setErreur('Choisissez au moins un métier : c’est par lui que les clients vous trouvent.');
        return;
      }
      if (!estPro && !nom.trim()) {
        setErreur('Indiquez votre nom.');
        return;
      }
      /* OBLIGATOIRE, ET C'EST UN CHOIX — 05/10/2026.
         Ce document met en garde contre l'allongement de ce formulaire, et
         c'est pour ça que le téléphone n'y est pas. La ville, elle, est le
         champ qui rend l'application utile dès la première seconde : sans
         elle, le fil montre les chantiers de toute la France, et « autour
         de moi » ne peut rien rendre. Un champ, avec des propositions dès
         la troisième lettre. */
      if (!lieu.affichage.trim()) {
        setErreur('Indiquez votre ville : elle sert à vous montrer ce qui se passe près de chez vous.');
        return;
      }
      if (!conditions) {
        setErreur('Il faut accepter les conditions d’utilisation pour créer un compte.');
        return;
      }
    }

    setEnCours(true);
    try {
      if (mode === 'inscription') {
        /* LE TYPE D'INSCRIPTION, dit en clair : 'pro' (entreprise trouvée),
           'secours' (compte particulier + demande) ou 'particulier'.
           `OpusApp` démarre avec le type EFFECTIF qui en découle — jamais
           avec le bouton choisi sur l'écran d'accueil. */
        const inscription = !estPro ? 'particulier' : (etape === 'secours' ? 'secours' : 'pro');
        const resultat = await onSignUp({
          email, motDePasse,
          nom: estPro ? entreprise : nom,
          entreprise, metiers, metier: metiers[0],
          ville: lieu.affichage,
          codePostal: lieu.codePostal,
          codeInsee: lieu.codeInsee,
          latitude: lieu.latitude,
          longitude: lieu.longitude,
          /* La VERSION acceptée voyage avec l'inscription : sans elle, on
             saurait que la personne a accepté « quelque chose », sans savoir
             quoi — et des conditions modifiées après coup ne prouveraient
             rien. */
          cguVersion: VERSION,
          inscription,
          siret: inscription === 'pro' && identite ? identite.siret : null,
          demandePro: inscription === 'secours' && secours
            ? { siret: secours.siret, motif: secours.motif, entreprise, metiers }
            : null,
          message: inscription === 'secours' ? message : null,
        });
        if (resultat && resultat.reverification) {
          /* La revérification d'avant la création a répondu autre chose
             que « ok » : l'entreprise vient d'être prise, le répertoire ne
             répond plus… On revient au SIRET, et on DIT pourquoi. */
          retour.echec();
          revenirAuSiret(resultat.reverification.pour, resultat.reverification);
        } else if (resultat && resultat.confirmationRequise) {
          setMessageDemande(resultat.messageEnAttente ? 'attente'
            : resultat.messagePerdu ? 'perdu' : null);
          setMailEnvoye(true);
        }
      } else {
        await onSignIn({ email, motDePasse });
      }
    } catch (e) {
      /* « Database error saving new user » : la base a refusé le compte
         (OP006 ou OP007) — la preuve a expiré pendant qu'on remplissait le
         formulaire, ou l'entreprise vient d'être prise. Le message dit de
         toucher « Vérifier » : on ramène donc là où ce bouton se trouve. */
      if (estPro && mode === 'inscription' && etape === 'formulaire'
          && /database error saving new user/i.test(String((e && e.message) || ''))) {
        revenirAuSiret(identite ? identite.siret : '');
      }
      setErreur(traduire(e));
    }
    setEnCours(false);
  };

  /* --- confirmation par email demandée par Supabase --- */
  if (mailEnvoye) {
    return (
      <Fond insets={insets}>
        <View style={s.carte}>
          <View style={s.checkRond}><Check size={22} color="#fff" /></View>
          <Text style={s.titre}>Vérifiez votre boîte mail</Text>
          <Text style={s.texte}>
            Un message vient d'être envoyé à {email.trim()}. Cliquez sur le lien
            qu'il contient pour activer votre compte, puis revenez ici pour vous
            connecter.
          </Text>
          {messageDemande === 'attente' && (
            <Text style={s.texte}>
              Votre demande de compte professionnel est enregistrée. Le mot que vous
              avez écrit pour Opus partira avec elle à votre première connexion,
              depuis ce téléphone.
            </Text>
          )}
          {messageDemande === 'perdu' && (
            <Text style={s.texte}>
              Votre demande de compte professionnel est enregistrée, mais le mot que
              vous avez écrit pour Opus n’a pas pu être gardé : vous pourrez joindre
              un justificatif depuis votre profil une fois connecté.
            </Text>
          )}
          <BtnMain
            block
            label="J'ai confirmé, je me connecte"
            onPress={() => { setMailEnvoye(false); setMode('connexion'); }}
          />
        </View>
      </Fond>
    );
  }

  /* L'ÉTAPE 1 DU PROFESSIONNEL : le SIRET, et rien d'autre. Le reste du
     formulaire n'apparaît qu'après « Oui, c'est mon entreprise » — ou
     après le choix de la vérification à la main. */
  const etapeSiret = mode !== 'connexion' && estPro && etape === 'entreprise';
  const etapeSecours = mode !== 'connexion' && estPro && etape === 'secours';

  /* Ce qui coiffe le formulaire d'un pro : l'entreprise confirmée, repliée
     en une ligne — ou l'explication de la porte de secours. Posé ici, hors
     du bloc du formulaire, pour que celui-ci reste lisible. */
  let enteteEntreprise = null;
  if (etapeSecours && secours) {
    enteteEntreprise = (
      <View style={s.secoursBloc}>
        <Text style={s.secoursTitre}>Vérification à la main</Text>
        <Text style={s.secoursTexte}>{TEXTE_SECOURS}</Text>
        <Text style={s.secoursRappel}>
          SIRET {formaterSiret(secours.siret)} · {libelleMotif(secours.motif)}
        </Text>
        <Pressable
          onPress={() => revenirAuSiret(secours.siret)}
          accessibilityRole="button"
          accessibilityLabel="Revenir à la vérification automatique du SIRET"
          style={({ pressed }) => [s.lienBloc, pressed && APPUI.discret]}
        >
          <Text style={s.lienTexte}>Revenir au SIRET</Text>
        </Pressable>
      </View>
    );
  } else if (mode !== 'connexion' && estPro && identite) {
    enteteEntreprise = (
      <EntrepriseRepliee identite={identite} onChanger={() => revenirAuSiret(identite.siret)} />
    );
  }

  return (
    <Fond insets={insets}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={defilement}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={s.retour} onPress={onRetour}>
            <ChevronLeft size={14} color="#fff" />
            <Text style={s.retourText}>Changer de type de compte</Text>
          </Pressable>

          <View
            style={s.carte}
            onLayout={(e) => { position.current.carte = e.nativeEvent.layout.y; }}
          >
            <Text style={s.badge}>
              {estPro ? 'COMPTE PROFESSIONNEL' : 'COMPTE PARTICULIER'}
            </Text>

            <View style={s.onglets}>
              {[
                { key: 'inscription', label: 'Créer un compte' },
                { key: 'connexion', label: 'Se connecter' },
              ].map((o) => (
                <Pressable
                  key={o.key}
                  style={[s.onglet, mode === o.key && s.ongletOn]}
                  onPress={() => { setMode(o.key); setErreur(null); }}
                >
                  <Text style={[s.ongletText, mode === o.key && { color: '#fff' }]}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {etapeSiret ? (
              <View onLayout={(e) => { position.current.siret = e.nativeEvent.layout.y; }}>
                <Text style={s.label}>Votre entreprise</Text>
                <Text style={[s.aide, s.aideEtape]}>
                  Opus ouvre un compte professionnel à une entreprise active au
                  répertoire Sirene de l’INSEE. Votre SIRET figure sur votre avis
                  de situation INSEE ou votre attestation URSSAF.
                </Text>
                <SaisieSiret
                  key={saisie.cle}
                  siretInitial={saisie.siret}
                  resultatInitial={saisie.resultat}
                  onConfirme={confirmer}
                  onSecours={(x) => {
                    oublierPreremplissage();
                    setSecours(x);
                    setEtape('secours');
                    setErreur(null);
                    enHaut();
                  }}
                  onConnexion={() => { setMode('connexion'); setErreur(null); }}
                  onResultat={versLeSiret}
                />
                {!!erreur && <Text style={s.erreur}>{erreur}</Text>}
              </View>
            ) : (
              <>
                {enteteEntreprise}

                {mode === 'inscription' && (
                  <>
                    {estPro ? (
                      <>
                        <Text style={s.label}>Nom de l'entreprise</Text>
                        <Field
                          value={entreprise}
                          onChangeText={(t) => { touche.current.entreprise = true; setEntreprise(t); }}
                          placeholder="Le nom que vos clients connaissent"
                          maxLength={NOM_ENTREPRISE_MAX}
                        />
                        {!!aideNom && <Text style={s.aide}>{aideNom}</Text>}

                        <Text style={s.label}>Vos métiers</Text>
                        <ChoixMetiers
                          valeurs={metiers}
                          onChange={(m) => { touche.current.metiers = true; setMetiers(m); }}
                          proposition={proposition}
                        />
                      </>
                    ) : (
                      <>
                        <Text style={s.label}>Votre nom</Text>
                        <Field value={nom} onChangeText={setNom} placeholder="Dylan M." />
                      </>
                    )}

                    {/* LA VILLE EST DEMANDÉE AUX DEUX — 05/10/2026.
                        Elle ne l'était qu'aux artisans : un particulier n'avait
                        donc ni commune ni coordonnées, et aucune recherche
                        « autour de moi » ne pouvait fonctionner pour lui. */}
                    <Text style={s.label}>Ville</Text>
                    <ChampVille
                      valeur={lieu.affichage}
                      onChange={(l) => { touche.current.lieu = true; setVillePreremplie(false); setLieu(l); }}
                    />
                    <Text style={s.aide}>
                      {villePreremplie ? AIDE_VILLE
                        : estPro
                          ? "Elle place votre fiche sur la carte, au centre de la commune — jamais à votre adresse."
                          : "Elle sert à vous montrer les artisans près de chez vous. On ne demande jamais votre adresse."}
                    </Text>

                    {etapeSecours && (
                      <>
                        <Text style={s.label}>Un mot pour Opus (facultatif)</Text>
                        <TextArea
                          value={message}
                          onChangeText={setMessage}
                          maxLength={MESSAGE_MAX}
                          placeholder="Ce qui peut aider : votre entreprise vient d’être créée, elle n’est pas publiée par l’INSEE, ce numéro est déjà pris…"
                        />
                        <Text style={s.aide}>
                          {message.length} sur {MESSAGE_MAX}. Un justificatif pourra être
                          joint ensuite depuis votre profil — jamais par la messagerie.
                        </Text>
                      </>
                    )}
                  </>
                )}

                <Text style={s.label}>Email</Text>
                <Field
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vous@exemple.fr"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  /* Le trousseau du téléphone propose alors l'adresse déjà
                     enregistrée, au lieu de la faire retaper. */
                  autoComplete="email"
                  textContentType="emailAddress"
                  /* LE CLAVIER MÈNE QUELQUE PART. Sans ça, « Suivant » n'existe
                     pas et il faut refermer le clavier pour viser le champ
                     d'après — six fois à l'inscription. */
                  returnKeyType="next"
                  onSubmitEditing={() => champMotDePasse.current && champMotDePasse.current.focus()}
                  blurOnSubmit={false}
                />

                <Text style={s.label}>Mot de passe</Text>
                <ChampMotDePasse
                  ref={champMotDePasse}
                  value={motDePasse}
                  onChangeText={setMotDePasse}
                  placeholder={mode === 'inscription' ? '6 caractères minimum' : 'Votre mot de passe'}
                  nouveau={mode === 'inscription'}
                  returnKeyType={mode === 'inscription' ? 'next' : 'go'}
                  onSubmitEditing={mode === 'inscription' ? undefined : valider}
                />

                {mode === 'inscription' && (
                  <Pressable style={s.conditions} onPress={() => setConditions((v) => !v)}>
                    <View style={[s.case, conditions && s.caseCochee]}>
                      {conditions && <Check size={12} color={C.surAccent} />}
                    </View>
                    <Text style={s.conditionsTexte}>
                      J’ai lu et j’accepte les{' '}
                      <Text
                        style={s.conditionsLien}
                        onPress={() => onLireLegal && onLireLegal('cgu')}
                      >
                        conditions d’utilisation
                      </Text>
                      {' '}et la{' '}
                      <Text
                        style={s.conditionsLien}
                        onPress={() => onLireLegal && onLireLegal('confidentialite')}
                      >
                        politique de confidentialité
                      </Text>.
                    </Text>
                  </Pressable>
                )}

                {!!erreur && <Text style={s.erreur}>{erreur}</Text>}

                <BtnMain block onPress={valider} disabled={enCours} style={{ marginTop: S.md }}>
                  {enCours ? (
                    <>
                      <ActivityIndicator size="small" color={C.surAccent} />
                      <Text style={s.btnText}>Un instant...</Text>
                    </>
                  ) : (
                    <Text style={s.btnText}>
                      {mode !== 'inscription' ? 'Se connecter'
                        : etapeSecours ? 'Créer mon compte et envoyer la demande'
                          : 'Créer mon compte'}
                    </Text>
                  )}
                </BtnMain>

                {mode === 'inscription' && estPro && !etapeSecours && (
                  <View style={s.encart}>
                    <ShieldCheck size={15} color={C.accent2} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.encartTitre}>Le badge vérifié, en plus</Text>
                      <Text style={s.encartTexte}>
                        Votre entreprise trouvée au répertoire Sirene, vous entrez tout
                        de suite et pouvez publier. Le badge, lui, demande encore votre
                        {' '}<Text style={s.gras}>{pieceExistence().nom.toLowerCase()}</Text> et
                        {' '}<Text style={s.gras}>votre attestation d&apos;assurance</Text>,
                        contrôlés par un humain depuis votre profil — sans lui, les
                        particuliers voient que vos justificatifs n'ont pas été fournis.
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Fond>
  );
}

function Fond({ insets, children }) {
  return (
    <LinearGradient
      colors={['#1A1B19', '#3a3a38', '#1B4B6B']}
      locations={[0, 0.6, 1]}
      start={GRAD_160.start}
      end={GRAD_160.end}
      style={{ flex: 1 }}
    >
      <View style={{ paddingTop: insets.top }}>
        <HazardStrip height={6} dark="#111" />
      </View>
      {children}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  /* L'acceptation des conditions. La case est CARRÉE : c'est de la
     structure, pas un bouton (voir la règle des bords dans theme.js). */
  conditions: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.md,
    marginTop: S.lg, paddingRight: S.xs,
  },
  case: {
    width: 20, height: 20, borderWidth: 1.5, borderColor: C.line,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  caseCochee: { backgroundColor: C.accent, borderColor: C.accent },
  conditionsTexte: {
    flex: 1, fontFamily: F.inter, fontSize: T.petit, color: C.ink, lineHeight: 17,
  },
  conditionsLien: { color: C.accent2, fontFamily: F.inter6 },

  scroll: { padding: 20, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },

  retour: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  retourText: { color: '#fff', opacity: 0.8, fontSize: T.courant, fontFamily: F.inter6 },

  carte: { backgroundColor: C.surface, padding: 18 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: C.accent, color: C.surAccent,
    fontFamily: F.oswald6, fontSize: T.petit, paddingVertical: 3, paddingHorizontal: 9,
    marginBottom: 14, overflow: 'hidden',
  },

  onglets: { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 20, padding: 3, marginBottom: 6 },
  onglet: { flex: 1, paddingVertical: 8, borderRadius: 16, alignItems: 'center' },
  ongletOn: { backgroundColor: C.ink },
  ongletText: { fontFamily: F.oswald6, fontSize: T.courant, color: C.muted },

  label: { fontFamily: F.oswald6, fontSize: T.courant, color: C.muted, marginTop: 14, marginBottom: 6 },
  aideEtape: { marginBottom: S.sm },

  /* La porte de secours : un BLOC (angle vif), parce qu'il porte une
     information qu'on doit lire avant de remplir quoi que ce soit. */
  secoursBloc: {
    gap: S.xs, padding: S.md, marginTop: S.md,
    backgroundColor: C.bg, borderLeftWidth: S.xs, borderLeftColor: C.accent2,
  },
  secoursTitre: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  secoursTexte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  secoursRappel: {
    fontFamily: F.inter6, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit),
  },
  lienBloc: { minHeight: TOUCHE, justifyContent: 'center', alignSelf: 'flex-start' },
  lienTexte: {
    fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2, textDecorationLine: 'underline',
  },
  /* Pourquoi on demande ce champ. Un formulaire qui réclame sans
     expliquer fait abandonner — et `C.muted` est la seule encre grise
     qui tienne le contraste depuis le lot 5. */
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, marginTop: S.xs, lineHeight: interligne(T.petit) },

  erreur: {
    fontSize: T.courant, color: C.bad, marginTop: 12, lineHeight: 16,
    fontFamily: F.inter, borderLeftWidth: 3, borderLeftColor: C.bad, paddingLeft: 8,
  },
  btnText: { fontFamily: F.oswald6, fontSize: T.corps, color: C.surAccent },
  encart: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    backgroundColor: C.bg, borderLeftWidth: 3, borderLeftColor: C.accent2,
    padding: 11, marginTop: 14,
  },
  encartTitre: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2, marginBottom: 4 },
  encartTexte: { fontSize: T.petit, color: C.muted, lineHeight: 16, fontFamily: F.inter },
  gras: { fontFamily: F.inter6, color: C.ink },

  titre: { fontFamily: F.oswald6, fontSize: 17, color: C.ink, marginBottom: 8, textAlign: 'center' },
  texte: { fontSize: T.corps, color: C.muted, lineHeight: 19, textAlign: 'center', marginBottom: 16, fontFamily: F.inter },
  checkRond: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.ok,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14,
  },
});
