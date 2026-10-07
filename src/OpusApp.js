/**
 * Racine de l'application : contient l'état et enchaîne les écrans,
 * exactement comme le composant OpusProject du prototype.
 *
 * Principe : l'écran met à jour l'état local tout de suite (l'app reste fluide),
 * puis on écrit dans Supabase en arrière-plan via src/lib/api.js.
 * Sans .env, l'écriture Supabase ne fait rien : l'app tourne en mode démo.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { C, M } from './theme';
import { BandeDemo, BandeHorsLigne, ConfirmBanner, PillToggle } from './components/ui';
import { TopBrand, BackBar } from './components/TopBar';
import BottomNav from './components/BottomNav';
import QuoteModal from './components/QuoteModal';
import CommentsSheet from './components/CommentsSheet';
import RappelVerification from './components/RappelVerification';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import PublicationScreen from './screens/PublicationScreen';
import DecouvrirScreen from './screens/DecouvrirScreen';
import PlaceProScreen from './screens/PlaceProScreen';
import CreerScreen from './screens/CreerScreen';
import MessagesScreen from './screens/MessagesScreen';
import ConversationScreen from './screens/ConversationScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SqueletteFil from './components/Squelette';
import ProfilOwnScreen from './screens/ProfilOwnScreen';
import ProfilProScreen from './screens/ProfilProScreen';
import ChantierScreen from './screens/ChantierScreen';
import NouveauChantier from './components/NouveauChantier';
import { destinationNotif } from './lib/notifications';
import ProfilPublicScreen from './screens/ProfilPublicScreen';
import ConfidentialiteScreen from './screens/ConfidentialiteScreen';
import LegalScreen, { TITRES_LEGAUX } from './screens/LegalScreen';
import Signaler from './components/Signaler';
import ProfilEditScreen from './screens/ProfilEditScreen';
import MesPublicationsScreen from './screens/MesPublicationsScreen';
import GererPortfolioScreen from './screens/GererPortfolioScreen';
import SosScreen from './screens/SosScreen';
import DemandesScreen from './screens/DemandesScreen';
import DemandesRecuesScreen, { appeler } from './screens/DemandesRecuesScreen';
import AdminScreen from './screens/AdminScreen';
import { POST_GRADIENTS, avgReviews } from './data/demo';
import { METIER_PAR_DEFAUT, nomMetier , metiersDe } from './lib/metiers';
import { etapesPourLeRecit } from './lib/recit';
import { FORMATS_VISUELS, FORMATS_VIDEO } from './lib/formats-publication';
import * as api from './lib/api';
import * as retour from './lib/retour';
import { useMouvementReduit } from './lib/retour';
import {
  messageClair, estUnProblemeDeReseau, avecDelai, avecReprise,
} from './lib/erreurs';
import { hasSupabase } from './lib/supabase';
import { artisansDisponibles as artisansDisponiblesDemo } from './data/urgences';
import { envoyerFichier, estFichierLocal } from './lib/storage';
import {
  aCloudinary, urlMontage, envoyerVideo as envoyerVideoCloudinary,
} from './lib/cloudinary';
import { aiMatchPros, aiRecitChantier } from './lib/ai';
import { partagerPost } from './lib/partage';
import PagesGlissantes from './components/PagesGlissantes';
import { completerLieu } from './lib/adresse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FeuilleRecherche from './components/FeuilleRecherche';
import {
  FILTRE_VIDE, filtreActif, resumeFiltre, argumentsDuFil,
} from './lib/filtre-fil';

/* LE SECTEUR SURVIT À LA FERMETURE, LE MÉTIER NON — et c'est la réponse
   exacte à la crainte du propriétaire : « si un jour il a besoin d'un
   couvreur il faut pas qu'il soit bloqué que sur des maçons ».

   Les deux n'ont pas la même durée de vie. Le secteur, c'est l'endroit où
   l'on habite : il ne change pas, et le redemander tous les matins serait
   absurde. Le métier, c'est un besoin du moment : il change. À la
   réouverture de l'application, il n'y a donc plus que le secteur — et
   personne ne peut rester enfermé sur un métier sans l'avoir voulu. */
const CLE_SECTEUR = 'opus.fil.secteur';

/**
 * Ce qu'on annonce à l'artisan, selon l'endroit où sa publication est partie.
 *
 * ET SELON LE MODE, parce que « Votre publication est en ligne » était FAUX
 * sans fichier `.env` : `api.js` remplace alors chaque écriture par rien.
 * C'est la panne qui a laissé passer le format `montage` refusé par la base
 * pendant plusieurs jours — les essais ne voyaient rien.
 */
const MESSAGE_PUBLICATION = api.mode === 'demo' ? {
  fil: 'Démonstration : la publication s’affiche, mais rien n’est enregistré.',
  portfolio: 'Démonstration : rien n’est enregistré.',
  deux: 'Démonstration : rien n’est enregistré.',
} : {
  fil: 'Votre publication est en ligne.',
  portfolio: 'Ajouté à votre portfolio.',
  deux: 'En ligne, et ajouté à votre portfolio.',
};

export default function OpusApp() {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demarrage, setDemarrage] = useState(true);   // reprise de session
  /* « Réduire les animations » : lu une fois ici, et respecté par la
     transition d'écran comme par l'ouverture. */
  const sansMouvement = useMouvementReduit();
  const [typeChoisi, setTypeChoisi] = useState(null); // type retenu avant connexion
  const [screen, setScreen] = useState('home');
  /* 'filVideo' quand la fiche d'un artisan a été ouverte depuis le fil
     vidéo — par le glissement comme par un appui sur son nom. */
  const [origineProfil, setOrigineProfil] = useState(null);
  /* L'AMORCE D'UN MESSAGE — « Bonjour, je suis Dylan M., Lambesc. »
     Elle vivait dans `setMsgDraft`, supprimé au lot 4 quand le brouillon
     est descendu dans le champ. Les deux appels, eux, sont restés : ils
     levaient un `ReferenceError` à chaque fois qu'un particulier
     contactait un artisan, et à chaque réponse à une annonce.
     Personne ne l'avait vu — c'est le linter du lot 8 qui l'a trouvé. */
  const [amorceMessage, setAmorceMessage] = useState('');
  const [feedMode, setFeedMode] = useState('classic');
  // Vidéo sur laquelle ouvrir le plein écran, quand on y arrive depuis le fil.
  const [videoCible, setVideoCible] = useState(null);
  const [feedTab, setFeedTab] = useState('pourvous');

  /* Le filtre du fil, et la feuille qui le règle. Posé par la LOUPE de la
     barre du haut — le propriétaire ne voulait pas de rangée de pastilles
     sur le fil, qui est le seul écran d'Opus où l'on vient pour regarder. */
  const [filtreFil, setFiltreFil] = useState(FILTRE_VIDE);
  const [loupeOuverte, setLoupeOuverte] = useState(false);

  const [pros, setPros] = useState({});
  const [posts, setPosts] = useState([]);
  /* LES CHANTIERS (section 36), par identifiant. Un dictionnaire, comme
     `pros` : la publication ne porte que l'identifiant, et c'est l'écran
     qui a besoin du TITRE. Il se remplit de deux côtés — les chantiers des
     publications affichées, et les miens, que je dois voir même quand ils
     ne portent encore aucune publication. */
  const [chantiers, setChantiers] = useState({});
  const [chantierOuvert, setChantierOuvert] = useState(null);
  const [publicationsChantier, setPublicationsChantier] = useState([]);
  const [chantierCharge, setChantierCharge] = useState(false);
  const [createChantier, setCreateChantier] = useState(null);
  const [feuilleChantier, setFeuilleChantier] = useState(false);

  /* RANGE DES CHANTIERS DANS LE DICTIONNAIRE, sans écraser les autres.
     Déclarée ICI, au-dessus de tout ce qui l'appelle — le démarrage s'en
     sert dès la première page du fil. Posée plus bas, c'était une
     `const` lue avant sa déclaration : ce fichier a déjà livré un écran
     blanc pour ça, deux fois, sans que le linter ni `expo export` ne
     disent quoi que ce soit. */
  const rangerChantiers = useCallback((liste) => {
    if (!liste || liste.length === 0) return;
    setChantiers((d) => {
      const suite = { ...d };
      liste.forEach((c) => { suite[c.id] = c; });
      return suite;
    });
  }, []);

  const [followingIds, setFollowingIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [openCommentsId, setOpenCommentsId] = useState(null);
  /* LES TROIS CIBLES D'UNE NOTIFICATION (section 37). Elles vivent ici
     parce qu'elles traversent des écrans : la cloche est dans la barre du
     haut, et la destination est trois écrans plus loin. Chacune se REMET À
     NULL dès que l'écran visé l'a consommée — une cible qui traîne
     rouvrirait la même chose au prochain passage, et on croirait à un
     écran qui se bloque. */
  const [commentaireCible, setCommentaireCible] = useState(null);
  /* LA PUBLICATION VERS LAQUELLE LE FIL DOIT DÉFILER. Séparée de
     `commentaireCible` à dessein : `openCommentsId` se pose aussi
     quand on touche simplement le bouton « commentaires » d'une carte,
     et faire sauter le fil sous le doigt de quelqu'un qui est déjà
     devant la bonne publication serait désagréable. Le défilement
     n'appartient donc qu'au chemin de la CLOCHE. */
  const [postCible, setPostCible] = useState(null);
  const [annonceCible, setAnnonceCible] = useState(null);
  const [demandeCible, setDemandeCible] = useState(null);
  const [openContactId, setOpenContactId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [viewedProId, setViewedProId] = useState(null);
  const [commentsPostId, setCommentsPostId] = useState(null);  // fil vidéo
  // Fiche publique d'un particulier, ouverte depuis un commentaire.
  const [profilPublic, setProfilPublic] = useState(null);
  const [profilPublicCharge, setProfilPublicCharge] = useState(false);
  const [navHeight, setNavHeight] = useState(0);               // hauteur de la nav flottante

  /* Espace « Demandes » : l'inverse du fil, réservé aux particuliers qui publient. */
  const [decouvrirTab, setDecouvrirTab] = useState('artisans');
  const [demandes, setDemandes] = useState([]);
  const [demandeFiltre, setDemandeFiltre] = useState(null);
  /* DEUX DATES, ET C'EST VOULU.
     `demandesVuesLe` est celle qui vient de la BASE au chargement : elle ne
     bouge pas de la session, et c'est elle qui décide ce qui porte
     « Nouveau ». Sans ça, ouvrir l'onglet effacerait les badges SOUS LES
     YEUX de celui qui vient les regarder.
     `demandesVuesMaj` est posée au moment où l'on ouvre l'onglet : elle
     n'éteint que le POINT, tout de suite, et la base retient l'heure pour
     la prochaine fois. */
  const [demandesVuesLe, setDemandesVuesLe] = useState(null);
  const [demandesVuesMaj, setDemandesVuesMaj] = useState(false);
  /* Les demandes qui me sont ADRESSÉES — devis, rappels, urgences. Elles ne
     partent pas avec `loadAll()` : le démarrage est déjà le point sensible,
     et elles n'intéressent que l'artisan au moment où il ouvre l'onglet.
     Le SIGNAL, lui, est gratuit : c'est la notification que la base écrit. */
  /* Pourquoi le chargement a échoué, pour pouvoir proposer de réessayer
     plutôt que de laisser des listes vides qui ressemblent à « il n'y a
     rien ». */
  const [echecChargement, setEchecChargement] = useState(null);
  /* Une clé par message envoyé, pour retrouver SA bulle quand la réponse du
     serveur arrive — l'index dans la liste bouge, lui. */
  const compteurEnvoi = useRef(0);
  /* LE BACK-OFFICE. `admin` reste `null` tant qu'on n'a pas demandé — et on
     ne demande QU'EN OUVRANT le profil, jamais au démarrage. CLAUDE.md
     retient un repère mesuré : « 24 requêtes, et `loadAll` ne part qu'une
     fois ». Ajouter un appel sur le chemin du démarrage pour afficher un
     bouton que presque personne ne verra serait un mauvais échange. */
  const [admin, setAdmin] = useState(null);
  const adminDemande = useRef(false);
  const [demandesRecues, setDemandesRecues] = useState([]);
  const [demandesRecuesEtat, setDemandesRecuesEtat] = useState('jamais');
  /* Un MIROIR de l'état, parce que l'abonnement au temps réel est posé une
     fois pour toutes dans un `useEffect` : la valeur qu'il capture ne
     bougerait plus jamais. Un `ref`, lui, est toujours à jour.
     C'est le piège classique de la fermeture périmée, et il ne se voit
     qu'à l'usage — l'écran ne se rafraîchirait simplement jamais. */
  const demandesRecuesChargees = useRef(false);

  /* Compte : profil du particulier, et disponibilité SOS du professionnel. */
  const [monProfil, setMonProfil] = useState({
    nom: 'Vous', ville: '', telephone: '', email: '',
    avatarUrl: null, bannerUrl: null,
  });
  // Partenariats en cours : reçus d'un côté, envoyés de l'autre.
  const [demandesPartenariat, setDemandesPartenariat] = useState([]);
  const [partenariatsEnvoyes, setPartenariatsEnvoyes] = useState([]);
  const [mesSos, setMesSos] = useState(null);
  /* La demande de modification des métiers en cours d'examen, s'il y en a
     une. Elle empêche d'en déposer une seconde — la base le refuse aussi. */
  const [demandeMetiers, setDemandeMetiers] = useState(null);
  /* La Place des pros : les annonces entre professionnels, et les demandes
     de particuliers auxquelles j'ai déjà répondu. */
  const [annonces, setAnnonces] = useState([]);
  const [mesReponsesDemandes, setMesReponsesDemandes] = useState(new Set());

  const [quote, setQuote] = useState({ open: false, pro: null, mode: 'devis' });
  const [banner, setBanner] = useState(null);
  const bannerTimer = useRef(null);

  const [aiMatches, setAiMatches] = useState(null);
  const [aiMatchLoading, setAiMatchLoading] = useState(false);
  const [aiMatchError, setAiMatchError] = useState(null);

  /* `search`, `filterMetier` et `aiQuery` vivaient ici, à la racine de
     l'application. Conséquence : CHAQUE LETTRE tapée dans « Découvrir »
     re-rendait OpusApp en entier — tous les écrans, toutes les listes.
     Mesuré au navigateur avec le processeur bridé six fois, pour imiter un
     téléphone : 219 ms par lettre. Sur un iPhone, le champ paraît
     simplement ne pas répondre, et c'est ce qui a été constaté le
     29/09/2026 sur l'assistant IA.

     Ils sont désormais DANS DecouvrirScreen : une lettre ne re-rend plus
     que cet écran-là. Rien d'autre ne les lisait. */

  const [createType, setCreateType] = useState('photo');
  /* « C'est un conseil » — une ÉTIQUETTE qui se combine à n'importe quel
     format (section 34). Elle se REMET À FAUX après chaque publication, à la
     différence de la ville : un conseil est exceptionnel, et une case restée
     cochée étiquetterait la photo de chantier suivante sans que personne ne
     l'ait demandé. */
  const [createConseil, setCreateConseil] = useState(false);
  // Où va la publication : le fil, le portfolio, ou les deux.
  const [createDestination, setCreateDestination] = useState('deux');
  // Fichiers choisis pour la publication en cours, et sa bande-son.
  const [medias, setMedias] = useState([]);

  /* La pagination du fil. `finDuFil` évite que l'écran redemande une page à
     chaque fois qu'on touche le bas alors qu'il n'y a plus rien. */
  const [finDuFil, setFinDuFil] = useState(false);
  const [chargePage, setChargePage] = useState(false);
  const [rafraichit, setRafraichit] = useState(false);

  /* Signalement : une seule modale pour toute l'application. Chaque écran
     lui dit QUOI est signalé ; elle s'occupe du reste. */
  const [aSignaler, setASignaler] = useState(null);
  /* Quel texte légal est affiché (mentions / cgu / confidentialite). */
  const [texteLegal, setTexteLegal] = useState('cgu');
  /* Les textes légaux doivent être lisibles AVANT d'avoir un compte : c'est
     une exigence des magasins d'applications, et c'est logique — on ne peut
     pas accepter des conditions qu'on n'a pas pu lire. */
  const [legalAvantConnexion, setLegalAvantConnexion] = useState(null);
  const [musique, setMusique] = useState(null);
  // Progression de l'envoi : { index, total, part } ou null.
  const [envoi, setEnvoi] = useState(null);
  // Dernier refus, affiché sur l'écran Publier jusqu'au prochain essai.
  const [erreurPublication, setErreurPublication] = useState(null);
  const [createMetier, setCreateMetier] = useState(METIER_PAR_DEFAUT);
  const [createVille, setCreateVille] = useState('');

  /* Une confirmation se lit en trois secondes : « Profil enregistré. » Un
     échec, non — il porte un motif technique, et c'est justement lui qui
     sert. Il reste donc neuf secondes, en rouge, et se ferme d'une touche. */
  const showBanner = (msg, erreur = false) => {
    /* Le bandeau sort en HAUT de l'écran, et on regarde rarement le haut de
       l'écran quand on vient d'appuyer en bas. La vibration est souvent la
       seule chose qui prévient — surtout pour un échec. Voir la doctrine
       dans `src/lib/retour.js` : elle passe toute par ici, donc elle ne se
       disperse pas dans trente fichiers. */
    if (erreur) retour.echec(); else retour.reussite();
    /* ET À VOIX HAUTE. `accessibilityLiveRegion` n'existe que sur Android :
       sur iPhone, un échec passait complètement inaperçu pour qui se sert
       de VoiceOver — on appuyait sur « Publier », on n'entendait rien, on
       recommençait. */
    retour.annoncer(msg);
    setBanner({ texte: msg, erreur });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), erreur ? 9000 : 3000);
  };
  const showErreur = (msg) => showBanner(msg, true);

  useEffect(() => () => { if (bannerTimer.current) clearTimeout(bannerTimer.current); }, []);

  /* ---------- chargement (démo ou Supabase) ---------- */
  /**
   * ON ENTRE DANS L'APPLICATION DÈS QUE LA SESSION EST VALIDE.
   *
   * Avant, `setUserType` et `setScreen('home')` étaient à la FIN, après
   * `loadAll()`. Sans réseau, le chargement échouait, les deux lignes
   * n'étaient jamais atteintes, et un artisan déjà connecté se retrouvait
   * devant « Choisissez votre profil » — comme s'il n'avait pas de compte.
   *
   * Désormais la session ouvre la porte, et l'échec de chargement se
   * traite À L'INTÉRIEUR : on voit ses écrans, on lit « pas de
   * connexion », et on peut réessayer. C'est la différence entre une
   * application qui attend le réseau et une application qui en dépend.
   */
  const start = useCallback(async (type) => {
    setLoading(true);
    try {
      await api.ensureSession();
      /* La porte, ici et pas plus bas. */
      setUserType(type);
      setScreen('home');
      setEchecChargement(null);
      /* AVEC UN DÉLAI, et ce n'est pas une précaution théorique : sans lui,
         une base injoignable laissait l'application figée sur son squelette
         de démarrage pour toujours. Une requête qui ne revient jamais
         n'atteint jamais la ligne suivante, et aucun `catch` n'y peut rien.
         Mesuré en coupant la liaison le 01/10/2026.

         ET AVEC UN SECOND ESSAI, ajouté le 02/10/2026. Le propriétaire a
         vu « Le chargement a échoué » pendant que la couche API de Supabase
         REDÉMARRAIT — aucune requête refusée, personne au bout du fil. Il a
         dû fermer et rouvrir l'application ; or rouvrir, côté réseau, c'est
         exactement redemander. L'application le fait donc elle-même, une
         fois, et une seule. */
      const data = await avecReprise(() => api.loadAll(), { quoi: 'La base' });
      setPros(data.pros);
      setPosts(data.posts);
      setFinDuFil(!!data.finDuFil);
      /* LES CHANTIERS DES PUBLICATIONS CHARGÉES — une seule requête pour
         toute la page, et aucune tant qu'aucune publication n'appartient à
         un chantier. On ne touche PAS à `fil_filtre()` : lui ajouter une
         jointure voudrait dire changer sa signature, donc la surcharger, et
         le fil tomberait sur « is not unique » (leçon du lot C). */
      api.chantiersDeCesPosts(data.posts).then(rangerChantiers).catch(() => {});
      setConversations(data.conversations);
      setDemandes(data.demandes || []);
      setDemandesVuesLe(data.demandesVuesLe || null);
      setDemandesVuesMaj(false);
      setMesSos(data.mesSos || null);
      setNotifications(data.notifications);
      setFollowingIds(new Set(data.followingIds));
      setSavedIds(new Set(data.savedIds));
      setDemandesPartenariat(data.demandesPartenariat || []);
      setPartenariatsEnvoyes(data.partenariatsEnvoyes || []);
      /* Une demande de modification des métiers déjà déposée doit réapparaître
         à la reconnexion, sinon l'artisan la redépose et la base la refuse. */
      if (type === 'pro') {
        /* UN COMPTE PRO SANS FICHE SE RÉPARE ICI, ET NULLE PART AILLEURS.
           C'est le seul endroit par lequel passent TOUS les chemins —
           inscription, connexion, réouverture de l'application. Un compte
           créé avant le 05/10/2026, ou sur une base où la section 31 n'a
           pas encore été rejouée, retrouve donc sa fiche à la première
           ouverture. La détection ne coûte rien : `loadAll()` vient de
           rendre les fiches, on regarde simplement si la mienne y est. */
        if (!data.pros[api.getUserId()]) {
          try {
            const reparee = await api.reparerFichePro();
            if (reparee) setPros((ps) => ({ ...ps, [api.getUserId()]: reparee }));
          } catch (e) {
            /* On le dit, sans bloquer l'entrée : un artisan qui ne peut pas
               entrer du tout ne peut rien corriger non plus. */
            showErreur(messageClair(e, "Votre fiche professionnelle n'a pas pu être créée"));
          }
        }

        /* MA fiche complète : mon portfolio et ma présentation s'affichent
           sur mon propre profil, qui n'est pas la page publique. */
        try {
          const moiComplet = await api.chargerProfilPro(api.getUserId());
          if (moiComplet) {
            setPros((ps) => (ps[api.getUserId()]
              ? { ...ps, [api.getUserId()]: { ...ps[api.getUserId()], ...moiComplet, portfolioCharge: true } }
              : ps));
          }
        } catch (e) { /* la fiche légère suffit à afficher l'écran */ }

        try { setDemandeMetiers(await api.chargerDemandeMetiers()); }
        catch (e) { setDemandeMetiers(null); }
        try { setAnnonces(await api.chargerAnnonces()); }
        catch (e) { setAnnonces([]); }
        try { setMesReponsesDemandes(new Set(await api.mesReponsesDemandes())); }
        catch (e) { setMesReponsesDemandes(new Set()); }
      }
      // Sans ça, un particulier qui se reconnecte s'appelle « Vous ».
      if (data.monCompte && data.monCompte.nom) {
        setMonProfil((p) => ({ ...p, ...data.monCompte }));
      }
      setEchecChargement(null);
    } catch (e) {
      /* Si la session elle-même n'a pas pu s'ouvrir, on n'est entré nulle
         part : il faut le dire et laisser l'écran d'accueil. Sinon, on est
         DEDANS, et c'est le contenu qui manque — pas le compte. */
      setEchecChargement(estUnProblemeDeReseau(e) ? 'reseau' : 'autre');
      showErreur(messageClair(e, 'Chargement impossible'));
    }
    setLoading(false);
  }, []);

  /* Une session déjà ouverte sur ce téléphone évite de redemander le mot de passe. */
  useEffect(() => {
    let vivant = true;
    (async () => {
      try {
        /* DEUX TEMPS, ET C'EST TOUT L'INTÉRÊT.
           D'abord ce que le téléphone sait tout seul : la session et le
           type de compte, lus localement, sans réseau. Ensuite seulement on
           demande à la base de confirmer — et si elle ne répond pas, on est
           DÉJÀ entré. Avant, les deux étaient collés : sans réseau, un
           artisan connecté se retrouvait devant « Choisissez votre
           profil », comme s'il n'avait pas de compte. */
        const locale = await api.sessionLocale();
        if (locale && vivant) {
          await start(locale.userType);
          /* La confirmation, en arrière-plan. Elle ne bloque plus rien. */
          avecDelai(api.restoreSession(), 8000, 'La base')
            .then((s2) => { if (s2 && vivant && s2.userType !== locale.userType) start(s2.userType); })
            .catch(() => {});
        }
      } catch (e) {
        // pas de session valide : on montre l'écran d'accueil
      } finally {
        /* `finally` et pas après le `catch` : si une promesse n'aboutit
           jamais, on n'arrive pas non plus au `catch`. C'est le délai
           ci-dessus qui garantit qu'on y arrive — les deux vont ensemble. */
        if (vivant) setDemarrage(false);
      }
    })();
    return () => { vivant = false; };
  }, [start]);

  /* ---------- création de compte et connexion ---------- */
  const choisirType = (type) => {
    // En mode démo, il n'y a pas de compte : on entre directement.
    if (!hasSupabase) { start(type); return; }
    setTypeChoisi(type);
  };

  /**
   * Inscription.
   *
   * CE QUI A CHANGÉ LE 05/10/2026, ET POURQUOI C'EST PLUS COURT
   * -----------------------------------------------------------
   * Cette fonction créait elle-même la fiche professionnelle et
   * enregistrait les CGU — après le `return` du cas « confirmation par
   * e-mail ». Les deux étaient donc perdus dès que la confirmation était
   * demandée, et l'artisan se retrouvait avec un demi-compte : un compte
   * `pro` sans fiche, qui n'apparaît nulle part et ne reçoit rien.
   *
   * Les deux moitiés viennent maintenant de la BASE, qui les crée ensemble
   * à partir des métadonnées (section 31 de `schema.sql`). Il ne reste ici
   * qu'à envoyer le formulaire.
   */
  const handleSignUp = async ({
    email, motDePasse, nom, entreprise, metiers, cguVersion,
    ville, codePostal, codeInsee, latitude, longitude,
  }) => {
    /* LE LIEU SE COMPLÈTE AVANT DE CRÉER LE COMPTE — 05/10/2026.
       PostgreSQL ne sait pas appeler la Base Adresse Nationale, donc le
       déclencheur qui crée les deux fiches ne peut pas placer le compte sur
       une carte. C'était le trou connu : un artisan qui venait de
       s'inscrire n'apparaissait dans AUCUNE recherche par secteur tant
       qu'il n'avait pas ouvert « Modifier mon profil » une fois.

       Même endroit et même raison que l'enregistrement du profil et la
       publication d'une annonce : là où il y a déjà une attente visible.

       ET L'ÉCHEC NE BLOQUE RIEN. Un réseau coupé ne doit pas empêcher de
       créer un compte — même règle que le vibreur de `retour.js` et que
       `publierAnnonce`. Sans coordonnées, la personne n'apparaît pas dans
       une recherche par secteur ; sans compte, elle n'apparaît nulle part. */
    let lieu = { ville, codePostal, codeInsee, latitude, longitude };
    if (ville) {
      try {
        lieu = await completerLieu({
          affichage: ville, codePostal, codeInsee, latitude, longitude,
        });
      } catch { /* on crée le compte sans coordonnées */ }
    }

    const { session } = await api.signUp({
      email, password: motDePasse, userType: typeChoisi, nom,
      entreprise, metiers, cguVersion,
      ville, codePostal: lieu.codePostal || codePostal || null,
      latitude: lieu.latitude || null,
      longitude: lieu.longitude || null,
    });
    if (!session) return { confirmationRequise: true };
    await start(typeChoisi);
    return {};
  };

  const handleSignIn = async ({ email, motDePasse }) => {
    const { userType: type } = await api.signIn({ email, password: motDePasse });
    await start(type || typeChoisi);
  };

  /** Mon compte professionnel : le mien s'il existe, sinon le premier de la liste. */
  const myProId = pros[api.getUserId()] ? api.getUserId() : Object.keys(pros)[0];

  /**
   * MES CHANTIERS EN COURS — ceux que l'écran de publication propose.
   *
   * Dérivés du dictionnaire, jamais recopiés dans un second état : deux
   * listes pour une seule vérité finissent toujours par se contredire,
   * c'est la leçon des voyants du 04/10.
   */
  const mesChantiers = useMemo(
    () => Object.values(chantiers)
      /* `String(…)` des DEUX côtés, et ce n'est pas de la prudence : en mode
         démonstration `myProId` vient de `Object.keys(pros)[0]`, qui rend
         TOUJOURS une chaîne, alors que les chantiers d'exemple portent un
         identifiant numérique. Un `===` strict rendait donc une liste vide,
         et le bloc « Mes chantiers » ne s'affichait JAMAIS sans fichier
         `.env` — trouvé au navigateur, pas en relisant. `mesPublications`
         tenait déjà cette garde. */
      .filter((c) => String(c.proId) === String(myProId))
      .sort((a, b) => (a.statut === 'en_cours' ? 0 : 1) - (b.statut === 'en_cours' ? 0 : 1)),
    [chantiers, myProId],
  );
  const mesChantiersEnCours = mesChantiers.filter((c) => c.statut === 'en_cours');

  /**
   * LES CHANTIERS D'UN ARTISAN, à l'ouverture de sa fiche.
   *
   * Une requête de plus, et seulement quand on ouvre une fiche — pas au
   * démarrage. La règle du fil : on ne télécharge pas cinq cents dossiers
   * pour en regarder un.
   */
  const chargerChantiersDuPro = useCallback(async (proId) => {
    if (!proId) return;
    try { rangerChantiers(await api.chantiersDuPro(proId)); }
    catch { /* la fiche reste utilisable sans sa bande */ }
  }, [rangerChantiers]);

  /**
   * CRÉER UN CHANTIER, et le choisir aussitôt.
   *
   * L'enchaînement compte : on vient de le nommer parce qu'on s'apprête à
   * publier dedans. Le laisser à « Aucun » obligerait à le rechoisir juste
   * après, et c'est exactement le genre de pas de plus qu'on oublie.
   */
  const creerChantier = async ({ titre, ville }) => {
    try {
      const c = await api.creerChantier({ titre, ville });
      if (c) {
        rangerChantiers([c]);
        setCreateChantier(c.id);
      }
      setFeuilleChantier(false);
      showBanner(hasSupabase ? 'Chantier créé.' : 'Chantier créé (démonstration).');
    } catch (e) {
      showErreur(messageClair(e));
    }
  };

  /**
   * TERMINER UN CHANTIER, OU LE ROUVRIR — un seul chemin pour les deux.
   *
   * Il reste visible dans les deux cas : il cesse seulement d'être « en
   * cours », donc l'écran de publication ne le propose plus. Et la bascule
   * est volontaire : terminer d'un appui sans pouvoir revenir en arrière
   * laisserait un chantier clos par erreur, sans aucune porte.
   */
  const basculerStatutChantier = async (chantier) => {
    const vers = chantier.statut === 'en_cours' ? 'termine' : 'en_cours';
    try {
      const c = await api.changerStatutChantier(chantier.id, vers);
      if (c) {
        rangerChantiers([c]);
        setChantierOuvert(c);
      }
      showBanner(vers === 'termine'
        ? 'Chantier marqué terminé.'
        : 'Chantier rouvert : il revient dans « en cours ».');
    } catch (e) {
      showErreur(messageClair(e));
    }
  };

  /**
   * DEMANDER LE RÉCIT À L'AGENT (section 39).
   *
   * Il rend un TEXTE, et rien de plus : l'écran le met dans un champ,
   * l'artisan le lit, et c'est lui qui publie. « L'agent écrit, l'artisan
   * publie » est la première permission du §4 — rien ne part sur une
   * vitrine publique sans qu'un humain l'ait relu.
   *
   * Le métier part avec : « dépose » et « enduit » n'appartiennent pas au
   * même chantier, et l'agent doit garder le vocabulaire de celui qui
   * parle.
   */
  const ecrireRecitChantier = async () => {
    if (!chantierOuvert) return '';
    const fiche = pros[chantierOuvert.proId] || {};
    return aiRecitChantier({
      chantierId: chantierOuvert.id,
      titre: chantierOuvert.titre,
      ville: chantierOuvert.ville,
      metier: nomMetier((fiche.metiers && fiche.metiers[0]) || fiche.metier || ''),
      etapes: etapesPourLeRecit(publicationsChantier),
    });
  };

  /** …et l'enregistrer, une fois qu'il l'a lu. Une chaîne vide le retire. */
  const enregistrerRecitChantier = async (texte) => {
    if (!chantierOuvert) return;
    const c = await api.enregistrerRecit(chantierOuvert.id, texte);
    if (c) {
      rangerChantiers([c]);
      setChantierOuvert(c);
    }
    showBanner(texte
      ? 'Récit publié sur la page du chantier.'
      : 'Récit retiré.');
  };

  /**
   * OUVRIR UN CHANTIER. Les publications arrivent dans l'ordre où elles
   * ont été faites — c'est le seul écran d'Opus qui remonte le temps à
   * l'endroit, parce qu'une histoire ne se raconte pas à l'envers.
   */
  const ouvrirChantier = async (chantier) => {
    if (!chantier) return;
    setChantierOuvert(chantier);
    setPublicationsChantier([]);
    setChantierCharge(false);
    setScreen('chantier');
    try {
      setPublicationsChantier(await api.publicationsDuChantier(chantier.id));
    } catch (e) {
      showErreur(messageClair(e));
    } finally {
      setChantierCharge(true);
    }
  };

  /* MES CHANTIERS, dès que je suis identifié. Ils ne viennent pas du fil :
     un chantier tout neuf, sans aucune publication, doit quand même
     apparaître dans l'écran de publication — sinon on le crée et on ne le
     retrouve pas. */
  useEffect(() => {
    if (!myProId || userType !== 'pro') return undefined;
    /* `vivant` : si l'écran est démonté pendant la requête — on se
       déconnecte, on ferme —, on ne pose plus rien. Poser un état après le
       démontage ne casse rien de visible, et c'est exactement pour ça que
       ça traîne longtemps avant d'être remarqué. */
    let vivant = true;
    api.chantiersDuPro(myProId)
      .then((liste) => { if (vivant) rangerChantiers(liste); })
      .catch(() => { /* la liste reste vide, on ne bloque pas l'écran */ });
    return () => { vivant = false; };
  }, [myProId, userType, rangerChantiers]);

  /** Ma photo, d'où qu'elle vienne : fiche pro pour un artisan, compte sinon. */
  const monAvatar = userType === 'pro' && pros[myProId]
    ? pros[myProId].avatarUrl
    : monProfil.avatarUrl;

  /**
   * Toucher une vidéo dans le fil l'ouvre en plein écran, sur elle-même.
   *
   * Dans le fil, une vidéo filmée debout n'est vue qu'en partie et reste
   * muette : c'est un aperçu. Le plein écran, lui, la montre entière, avec le
   * son. Renvoyer au début de la liste ferait perdre celle qu'on regardait.
   */
  const ouvrirVideoEnGrand = (post) => {
    setVideoCible(post.id);
    setFeedMode('video');
  };


  /* ---------- actions publication ---------- */
  const toggleLike = (id) => {
    let liked = false;
    setPosts((ps) => ps.map((p) => {
      if (p.id !== id) return p;
      liked = !p.liked;
      return { ...p, liked, likes: p.likes + (p.liked ? -1 : 1) };
    }));
    api.setLike(id, liked).catch(() => showErreur("Le j'aime n'a pas pu être enregistré."));
  };

  const toggleSave = (id) => {
    let saved = false;
    setSavedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else { n.add(id); saved = true; }
      return n;
    });
    api.setSaved(id, saved).catch(() => {});
  };

  const hidePost = (id) => setHiddenIds((s) => new Set(s).add(id));
  /**
   * La page suivante du fil, quand on arrive en bas.
   *
   * `chargePage` sert de verrou : une liste peut appeler `onEndReached`
   * plusieurs fois de suite pendant un défilement rapide, et sans lui on
   * demanderait trois fois la même page.
   */
  const chargerPlusDeFil = async () => {
    if (chargePage || finDuFil || posts.length === 0) return;
    const dernier = posts[posts.length - 1];
    if (!dernier || !dernier.curseur) { setFinDuFil(true); return; }

    setChargePage(true);
    try {
      const { posts: suite, fin } = await api.chargerPageFil({
        curseur: dernier.curseur,
        filtre: argumentsDuFil(filtreFil, {
          abonnements: feedTab === 'abonnements', videos: feedMode === 'video',
        }),
      });
      /* On écarte ce qu'on a déjà : si quelqu'un publie entre deux pages, la
         même publication peut revenir. Mieux vaut un doublon écarté qu'un
         doublon affiché. */
      setPosts((ps) => {
        const connus = new Set(ps.map((x) => String(x.id)));
        return [...ps, ...suite.filter((x) => !connus.has(String(x.id)))];
      });
      setFinDuFil(fin);
    } catch (e) {
      showErreur('La suite du fil n’a pas pu être chargée.');
    }
    setChargePage(false);
  };

  /** Tirer vers le bas : on recharge la première page, rien d'autre. */
  const rafraichirFil = async () => {
    setRafraichit(true);
    try {
      const { posts: page, fin } = await api.chargerPageFil({
        filtre: argumentsDuFil(filtreFil, {
          abonnements: feedTab === 'abonnements', videos: feedMode === 'video',
        }),
      });
      setPosts(page);
      setFinDuFil(fin);
    } catch (e) {
      showErreur('Le fil n’a pas pu être rafraîchi.');
    }
    setRafraichit(false);
  };

  /**
   * LA SEULE PORTE QUI CHANGE CE QU'ON VOIT DANS LE FIL.
   *
   * Filtre, « Fil / Vidéos », « Pour vous / Abonnements » : les trois
   * passent par ici, parce que les trois sont la même chose — une question
   * posée à la base. Avant, les deux derniers filtraient À L'ÉCRAN les
   * vingt publications déjà téléchargées : avec mille artisans, les vingt
   * dernières publications de toute la France n'en contiennent AUCUNE de
   * vos abonnements, et l'onglet affiche une page vide.
   *
   * On passe les trois valeurs en ARGUMENT plutôt que de lire l'état :
   * `setFeedTab(x)` puis `rechargerFil()` lirait l'ANCIEN onglet — un état
   * React ne change pas dans la foulée de l'appel qui l'a posé. C'est
   * exactement le piège de la réponse à une annonce, le 04/10.
   */
  const changerCeQuOnVoit = async ({
    filtre = filtreFil, mode = feedMode, tab = feedTab,
  } = {}) => {
    setFiltreFil(filtre);
    setFeedMode(mode);
    setFeedTab(tab);
    if (mode !== feedMode) setVideoCible(null);

    setChargePage(true);
    try {
      const { posts: page, fin } = await api.chargerPageFil({
        filtre: argumentsDuFil(filtre, {
          abonnements: tab === 'abonnements', videos: mode === 'video',
        }),
      });
      setPosts(page);
      setFinDuFil(fin);
    } catch (e) {
      showErreur(messageClair(e, 'Le fil n’a pas pu être chargé.'));
    }
    setChargePage(false);
  };

  /* LES TROIS ENVELOPPES SONT DÉCLARÉES ICI, ET PAS PLUS HAUT.
     Elles appellent `changerCeQuOnVoit` : écrites au-dessus, elles liraient
     une `const` avant sa déclaration. Ça fonctionne — elles ne sont
     appelées qu'au doigt —, et ce projet a quand même perdu deux écrans
     blancs sur cette famille d'erreur (`noop`, puis les trois voyants).
     L'ordre du fichier est la seule chose qui l'empêche vraiment. */

  /* Bascule manuelle Fil / Vidéos : on oublie la vidéo visée, sinon le fil
     rouvrirait toujours au même endroit. Et on repasse par la porte unique,
     parce que « Vidéos » est un filtre comme les autres depuis le
     05/10/2026 : il est appliqué par la base, pas sur ce qui revient. */
  const changerFeedMode = (mode) => { changerCeQuOnVoit({ mode }); };

  /* Même raison pour « Pour vous » / « Abonnements ». Deux façons d'arriver
     au même écran doivent faire exactement le même travail — c'est la leçon
     du glissement de Découvrir, le 04/10. */
  const changerFeedTab = (tab) => { changerCeQuOnVoit({ tab }); };

  /* Et le filtre de la loupe. Seul le SECTEUR est enregistré : à la
     réouverture, le métier a disparu, donc personne ne reste enfermé sur
     des maçons le jour où il cherche un couvreur. */
  const appliquerFiltre = (filtre) => {
    changerCeQuOnVoit({ filtre });
    const secteur = filtre && filtre.secteur;
    (secteur && secteur.rayonKm
      ? AsyncStorage.setItem(CLE_SECTEUR, JSON.stringify(secteur))
      : AsyncStorage.removeItem(CLE_SECTEUR)).catch(() => {});
  };

  /**
   * Le secteur enregistré, relu au démarrage.
   *
   * `try`/`catch` autour de CHAQUE accès : un stockage illisible — première
   * installation, mémoire pleine, navigateur en navigation privée — ne doit
   * pas empêcher le fil de s'afficher. Même règle que le vibreur de
   * `retour.js`.
   */
  useEffect(() => {
    let vivant = true;
    AsyncStorage.getItem(CLE_SECTEUR)
      .then((brut) => {
        if (!vivant || !brut) return;
        const secteur = JSON.parse(brut);
        if (!secteur || !secteur.rayonKm) return;
        setFiltreFil((f) => ({ ...f, secteur }));
        return api.chargerPageFil({ filtre: argumentsDuFil({ secteur }) })
          .then(({ posts: page, fin }) => {
            if (!vivant) return;
            setPosts(page);
            setFinDuFil(fin);
          });
      })
      .catch(() => {});
    return () => { vivant = false; };
  }, []);

  /**
   * Tirer vers le bas, sur les autres écrans.
   *
   * Le geste n'existait que sur le fil. Ailleurs — notifications, messages,
   * demandes, Place des pros —, tirer ne faisait rien : l'écran paraissait
   * figé alors qu'il suffisait de redemander. Une seule fonction, parce que
   * ces quatre listes viennent toutes du même chargement.
   *
   * `echecChargement` est remis à zéro en cas de succès : la bande « pas de
   * connexion » disparaît alors d'elle-même, ce qui est la seule preuve
   * honnête que le réseau est revenu.
   */
  const rafraichirEcran = async () => {
    setRafraichit(true);
    try {
      const data = await api.loadAll();
      setPosts(data.posts);
      setFinDuFil(!!data.finDuFil);
      setConversations(data.conversations);
      setDemandes(data.demandes || []);
      setDemandesVuesLe(data.demandesVuesLe || null);
      setDemandesVuesMaj(false);
      setNotifications(data.notifications);
      setPros(data.pros);
      if (userType === 'pro') {
        try { setAnnonces(await api.chargerAnnonces()); } catch (e) { /* liste conservée */ }
      }
      setEchecChargement(null);
    } catch (e) {
      setEchecChargement(estUnProblemeDeReseau(e) ? 'reseau' : 'autre');
      showErreur(messageClair(e, 'Rafraîchissement impossible'));
    }
    setRafraichit(false);
  };

  /**
   * Ouvrir les commentaires d'une publication — et aller les chercher si
   * c'est la première fois. Depuis que le fil se charge par pages, ils ne
   * sont plus téléchargés d'avance.
   */
  /* OUVRIR, ET ALLER CHERCHER — une seule porte, parce qu'il y en a DEUX
     qui y mènent : le bouton « commentaires » de la carte, et la cloche.

     Le lot G a d'abord posé `setOpenCommentsId(...)` à la main dans
     `ouvrirNotification`. Le panneau s'ouvrait donc VIDE : depuis que le
     fil se charge par pages, `post.comments` n'existe pas tant que
     personne ne l'a demandé, et c'était `toggleComments` — et lui seul —
     qui allait le chercher.

     Vérifié au navigateur, sur la vraie base : le bon post arrivait bien à
     l'écran, et le commentaire n'apparaissait pas. C'est-à-dire le défaut
     exact que le propriétaire a signalé — « ça me ramène sur le fil » —
     corrigé à moitié.

     > DEUX FAÇONS D'ARRIVER AU MÊME ÉCRAN DOIVENT FAIRE EXACTEMENT LE MÊME
     > TRAVAIL. C'est la règle écrite le 04/10 pour `changerOngletDecouvrir`,
     > et je venais de la violer dans l'autre sens : là, un état changeait
     > sans le travail qui va avec ; ici, un panneau s'ouvrait sans son
     > contenu. */
  const ouvrirCommentaires = async (id) => {
    setOpenCommentsId(id);

    const post = posts.find((p) => String(p.id) === String(id));
    if (!post || Array.isArray(post.comments)) return;

    try {
      const liste = await api.chargerCommentaires(id);
      setPosts((ps) => ps.map((p) => (String(p.id) === String(id) ? { ...p, comments: liste } : p)));
    } catch (e) {
      showErreur('Les commentaires n’ont pas pu être chargés.');
      setPosts((ps) => ps.map((p) => (String(p.id) === String(id) ? { ...p, comments: [] } : p)));
    }
  };

  const toggleComments = async (id) => {
    if (openCommentsId === id) { setOpenCommentsId(null); return; }
    await ouvrirCommentaires(id);
  };
  const toggleContact = (id) => setOpenContactId((c) => (c === id ? null : id));

  /**
   * Ajoute un commentaire, ou une réponse à un commentaire existant.
   * On l'affiche tout de suite, avant la réponse du serveur : sinon
   * l'utilisateur tape, et rien ne se passe pendant une seconde.
   */
  const addComment = (postId, texte, parentId = null) => {
    const nouveau = {
      id: `local-${Date.now()}`,
      auteurId: api.getUserId(),
      auteur: userType === 'pro' && pros[myProId]
        ? pros[myProId].entreprise
        : (monProfil.nom || 'Vous'),
      auteurType: userType,
      avatarUrl: monAvatar,
      texte,
      time: "À l'instant",
      reponses: [],
    };

    setPosts((ps) => ps.map((p) => {
      if (p.id !== postId) return p;
      /* `comments` peut valoir null : on commente depuis un endroit où ils
         n'ont pas été chargés. On part alors d'une liste vide plutôt que de
         planter. Le compteur, lui, avance dans tous les cas. */
      const actuels = Array.isArray(p.comments) ? p.comments : [];
      const nbCommentaires = (p.nbCommentaires || 0) + 1;
      if (!parentId) return { ...p, nbCommentaires, comments: [...actuels, nouveau] };
      return {
        ...p,
        nbCommentaires,
        comments: actuels.map((c) => (c.id === parentId
          ? { ...c, reponses: [...(c.reponses || []), nouveau] }
          : c)),
      };
    }));

    api.addComment(postId, texte, parentId)
      .catch(() => showErreur("Le commentaire n'a pas pu être envoyé."));
  };

  /**
   * Retirer un commentaire — le SIEN, et rien d'autre.
   *
   * La règle est tenue par la base : la politique RLS des commentaires ne
   * laisse passer que `auth.uid() = author_id`. Vérifié sur PostgreSQL —
   * même l'auteur de la publication se fait refuser la suppression du
   * commentaire de quelqu'un d'autre. Cet écran ne fait que proposer le
   * geste à qui y a droit ; il ne décide de rien.
   *
   * Supprimer un commentaire emporte ses réponses (`on delete cascade`) :
   * le compteur baisse donc de 1 PLUS le nombre de réponses.
   */
  /**
   * Corriger son commentaire.
   *
   * Le texte change TOUT DE SUITE à l'écran, et la base suit. Si elle
   * refuse, on remet l'ancien et on le dit : c'est le seul cas où revenir
   * en arrière est moins déroutant que de laisser un texte qui n'existe
   * que sur ce téléphone.
   */
  /**
   * Une spécialité écrite à la main rejoint la file du référentiel.
   *
   * Elle est DÉJÀ sur la fiche : cette remontée ne bloque rien et ne dit
   * rien à l'artisan, ni en succès ni en échec. Un message — même vert —
   * laisserait croire qu'il attend une autorisation, alors que non.
   */
  const proposerSpecialite = (texte, metier) => {
    api.proposerSpecialite(texte, metier);
  };

  const modifierCommentaire = async (postId, commentaire, texte) => {
    const remplacer = (c) => (c.id === commentaire.id
      ? { ...c, texte, modifie: true }
      : { ...c, reponses: (c.reponses || []).map(remplacer) });
    const restaurer = (c) => (c.id === commentaire.id
      ? { ...c, texte: commentaire.texte, modifie: commentaire.modifie }
      : { ...c, reponses: (c.reponses || []).map(restaurer) });

    const appliquer = (fn) => setPosts((ps) => ps.map((p) => (p.id !== postId || !Array.isArray(p.comments)
      ? p
      : { ...p, comments: p.comments.map(fn) })));

    appliquer(remplacer);
    try {
      await api.modifierCommentaire(commentaire.id, texte);
    } catch (e) {
      appliquer(restaurer);
      /* `OP001` est le code que la base renvoie quand quelqu'un a répondu
         après ce commentaire : il ne se corrige plus (section 20.1 bis de
         schema.sql). On dit POURQUOI — un « échec » sans raison passerait
         pour un bug, alors que c'est une règle. Le cas se produit quand une
         réponse arrive pendant qu'on est en train de corriger. */
      showErreur(e && e.code === 'OP001'
        ? 'Trop tard : quelqu\u2019un a répondu, ce commentaire ne se corrige plus.'
        : "Le commentaire n'a pas pu être corrigé.");
    }
  };

  const supprimerCommentaire = async (postId, commentaire) => {
    const nbReponses = (commentaire.reponses || []).length;

    /* Retrait immédiat, avant la réponse du serveur : sinon on appuie et
       rien ne bouge pendant une seconde. */
    setPosts((ps) => ps.map((p) => {
      if (p.id !== postId) return p;
      const actuels = Array.isArray(p.comments) ? p.comments : [];
      const restants = actuels
        .filter((c) => c.id !== commentaire.id)
        .map((c) => ({
          ...c,
          reponses: (c.reponses || []).filter((r) => r.id !== commentaire.id),
        }));
      return {
        ...p,
        comments: restants,
        nbCommentaires: Math.max((p.nbCommentaires || 0) - 1 - nbReponses, 0),
      };
    }));

    try {
      await api.supprimerCommentaire(commentaire.id);
    } catch (e) {
      showErreur("Le commentaire n'a pas pu être supprimé. Rechargez le fil.");
    }
  };

  /**
   * Toucher le nom sous un commentaire. Un professionnel a sa page ; un
   * particulier a sa fiche publique, qu'on va chercher à la demande.
   */
  const voirCommentateur = async (c) => {
    if (!c.auteurId) return;
    setOpenContactId(null);
    if (pros[c.auteurId]) { viewProfile(c.auteurId); return; }

    setScreen('profilPublic');
    setProfilPublicCharge(true);
    // Repli du mode démo : la fiche se reconstruit depuis le commentaire.
    setProfilPublic({ id: c.auteurId, nom: c.auteur, avatarUrl: c.avatarUrl, demandes: [] });
    try {
      const fiche = await api.chargerProfilPublic(c.auteurId);
      if (fiche) setProfilPublic(fiche);
    } catch (e) {
      showErreur("Ce profil n'a pas pu être chargé.");
    }
    setProfilPublicCharge(false);
  };

  const toggleFollow = (proId) => {
    let following = false;
    setFollowingIds((s) => {
      const n = new Set(s);
      if (n.has(proId)) n.delete(proId); else { n.add(proId); following = true; }
      return n;
    });
    api.setFollow(proId, following).catch(() => {});
  };

  /**
   * Ouvrir la page d'un artisan.
   *
   * La fiche connue est légère : elle n'a ni présentation, ni réalisations,
   * ni avis — ces trois-là ne servent que sur cette page, et les charger
   * pour tout le monde au démarrage revenait à télécharger cinq cents
   * portfolios pour en regarder un.
   *
   * On affiche donc TOUT DE SUITE ce qu'on a — nom, métier, ville, note —
   * et le reste arrive derrière. Attendre pour montrer une page complète
   * donnerait l'impression que l'application est lente.
   */
  const viewProfile = async (proId, origine = null) => {
    setViewedProId(proId);
    /* D'OÙ L'ON VIENT, et pourquoi il faut s'en souvenir.
       Le glissement de retour n'est proposé sur la fiche d'un artisan que
       si le fil vidéo est réellement DERRIÈRE elle. Ouverte depuis la
       Place des pros ou depuis une notification, le même geste
       téléporterait l'artisan dans un fil qu'il n'a pas demandé.
       Un argument qui vaut `null` par défaut remet donc le compteur à
       zéro : tous les autres appels à `viewProfile` ferment le geste sans
       avoir à y penser. */
    setOrigineProfil(origine);
    setScreen('profilPro');
    setOpenContactId(null);

    /* LES CHANTIERS SE CHARGENT AVANT LA SORTIE ANTICIPÉE — et il a fallu
       s'en apercevoir. Posés en dessous, ils n'étaient JAMAIS demandés en
       mode démonstration, où `portfolioCharge` vaut vrai dès le départ : la
       bande serait restée vide sur toutes les fiches, sans erreur et sans
       que rien ne le dise. Ils ont leur propre requête, donc leur propre
       raison de partir. */
    chargerChantiersDuPro(proId);

    const connu = pros[proId];
    /* `portfolioCharge` distingue « pas encore demandé » de « demandé, et
       il est vide ». Sans lui, on redemanderait à chaque ouverture le
       profil d'un artisan qui n'a aucune réalisation. */
    if (connu && connu.portfolioCharge) return;

    try {
      const complet = await api.chargerProfilPro(proId);
      if (!complet) return;
      setPros((ps) => (ps[proId]
        ? { ...ps, [proId]: { ...ps[proId], ...complet, portfolioCharge: true } }
        : ps));
    } catch (e) {
      /* La page reste utilisable avec ce qu'on a déjà : on ne bloque pas
         pour une présentation manquante. */
      showErreur("Le profil n'a pas pu être chargé entièrement.");
    }
  };

  /* ---------- contact / devis / rappel ---------- */
  /* ELLE REND LA CONVERSATION depuis le 04/10/2026. Répondre à une annonce
     doit pouvoir y écrire DANS LA FOULÉE — l'état React, lui, n'aura pas
     encore bougé. */
  const handleContact = async (pro, mode) => {
    setOpenContactId(null);
    if (mode !== 'message') { setQuote({ open: true, pro, mode }); return null; }

    let conv = conversations.find((c) => c.proId === pro.id);
    if (!conv) {
      let id = `local-${Date.now()}`;
      try {
        const row = await api.createConversation(pro.id);
        if (row) id = row.id;
      } catch (e) {
        showErreur("La conversation n'a pas pu être créée.");
      }
      conv = {
        id,
        proId: pro.id,
        autre: { id: pro.id, nom: pro.entreprise, avatarUrl: pro.avatarUrl || null, type: 'pro' },
        messages: [],
      };
      setConversations((cs) => [conv, ...cs]);

      /* Première prise de contact : on amorce le message avec ce qu'on sait
         déjà du client. Un artisan qui reçoit « Bonjour » tout court doit
         redemander qui écrit et d'où. Le texte reste modifiable, et
         effaçable — c'est une amorce, pas un message imposé. */
      if (userType !== 'pro') {
        const nom = monProfil.nom && monProfil.nom !== 'Vous' ? monProfil.nom : '';
        const ville = monProfil.ville || '';
        const presentation = nom && ville ? `${nom}, ${ville}`
          : nom || ville;
        // Beaucoup de gens s'inscrivent sous « Dylan M. » : sans ce nettoyage,
        // l'amorce se terminerait par deux points.
        setAmorceMessage(presentation
          ? `Bonjour, je suis ${presentation.replace(/\.+$/, '')}. `
          : 'Bonjour, ');
      }
    }
    await ouvrirConversation(conv.id);
    return conv;
  };

  const submitQuote = async (form) => {
    const { pro, mode } = quote;
    const { memoriser, ...donnees } = form;
    setQuote({ open: false, pro: null, mode: 'devis' });
    try {
      if (mode === 'devis') {
        await api.createQuoteRequest({ proId: pro.id, ...donnees });
      } else {
        await api.createCallbackRequest({ proId: pro.id, ...donnees });
      }
      // Coordonnées saisies dans le formulaire : on les garde, pour que la
      // demande suivante parte déjà remplie.
      if (memoriser) {
        const { nom, telephone, ville } = donnees;
        setMonProfil((p) => ({
          ...p,
          nom: nom || p.nom,
          telephone: telephone || p.telephone,
          ville: ville || p.ville,
        }));
        api.enregistrerCoordonnees({ nom, telephone, ville }).catch(() => {});
      }
      /* « Envoyée » et rien d'autre, c'était vrai — mais ça laissait le
         client devant un écran muet, sans savoir ce qui allait se passer.
         Depuis que la base prévient l'artisan (section 24), on peut
         annoncer la suite, et elle arrive vraiment. */
      showBanner(mode === 'devis'
        ? `Demande de devis envoyée à ${pro.entreprise}. Vous serez prévenu dès qu'il répond.`
        : `Demande de rappel envoyée à ${pro.entreprise}. Vous serez prévenu dès qu'il répond.`);
    } catch (e) {
      showErreur(messageClair(e, 'Envoi impossible'));
    }
  };

  /* ---------- messagerie ---------- */

  /**
   * Ouvrir une conversation : aller chercher ses messages, et marquer comme
   * lus ceux qu'on vient de lire.
   *
   * Les messages ne sont plus téléchargés d'avance — `messages` vaut `null`
   * tant qu'on n'a pas ouvert. Avant, l'application téléchargeait TOUS les
   * messages de TOUTES ses conversations à chaque ouverture, pour n'afficher
   * qu'un aperçu.
   */
  const ouvrirConversation = async (id) => {
    setActiveConvId(id);
    setScreen('messages');

    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    if (!Array.isArray(conv.messages)) {
      try {
        const liste = await api.chargerMessages(id);
        setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, messages: liste } : c)));
      } catch (e) {
        showErreur("La conversation n'a pas pu être chargée.");
        setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, messages: [] } : c)));
      }
    }

    /* Le compteur retombe tout de suite : on est en train de les lire. Si
       l'appel échoue, ils repasseront non-lus au prochain chargement — mieux
       que de laisser une pastille sur une conversation ouverte. */
    if (conv.nonLus) {
      setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, nonLus: 0 } : c)));
      api.marquerLus(id).catch(() => {});
    }
  };

  /**
   * Envoyer un message.
   *
   * LE MESSAGE S'AFFICHE AVANT D'ÊTRE PARTI — c'est la bonne pratique, et
   * elle était déjà là. Ce qui manquait, c'est la SUITE : en cas d'échec,
   * la bulle restait exactement comme une bulle envoyée, et le bandeau
   * sortait en VERT avec une coche (`showBanner` sans le drapeau d'erreur).
   * On croyait donc avoir écrit à quelqu'un qui n'avait rien reçu.
   *
   * Chaque bulle porte désormais son état : `envoi`, `envoye`, `echec`. Et
   * une bulle en échec se touche pour réessayer — sans ça, le seul recours
   * serait de retaper le message.
   */
  /* `convId` EST EXPLICITE DEPUIS LE 04/10/2026, et ce n'est pas du confort.
     Répondre à une annonce crée la conversation PUIS envoie le message : à
     cet instant, `activeConvId` ne vaut pas encore la nouvelle conversation
     — un état React ne change pas dans la foulée de l'appel qui l'a posé.
     Le message serait parti dans la conversation d'avant, ou nulle part. */
  const sendMessage = (texteDonne, piece = null, convId = null) => {
    const cible = convId || activeConvId;
    const texte = String(texteDonne || '').trim();
    /* Un fichier seul suffit depuis le 04/10 : la base accepte un message
       sans texte dès qu'il porte une pièce (section 28). */
    if ((!texte && !piece) || cible == null) return Promise.resolve();

    const cle = `envoi-${compteurEnvoi.current}`;
    compteurEnvoi.current += 1;

    const majEtat = (etat) => setConversations((cs) => cs.map((c) => (c.id === cible
      ? { ...c, messages: (c.messages || []).map((m) => (m.cle === cle ? { ...m, etat } : m)) }
      : c)));

    /* La bulle optimiste porte déjà le NOM du fichier : sur un chantier en
       4G, un envoi de 8 Mo prend du temps, et un écran qui ne montre rien
       pendant ce temps-là fait recommencer. `chemin` reste vide — la pièce
       n'est pas encore là, on ne peut pas l'ouvrir. */
    const apercu = piece
      ? { chemin: null, nom: piece.nom, taille: piece.taille, type: piece.type }
      : null;
    const resume = texte || (piece ? `📎 ${piece.nom}` : '');

    setConversations((cs) => cs.map((c) => (c.id === cible
      ? {
        ...c,
        messages: [...(Array.isArray(c.messages) ? c.messages : []),
          { cle, from: 'moi', texte, piece: apercu, heure: "à l'instant", etat: 'envoi' }],
        dernier: { texte: resume, heure: "à l'instant", de: api.getUserId() },
      }
      : c)));

    return api.envoyerMessage(cible, texte, piece)
      .then((ligne) => {
        majEtat('envoye');
        /* On remplace l'aperçu par la VRAIE pièce : sans son chemin, la
           bulle resterait un libellé qu'on ne peut pas ouvrir jusqu'au
           prochain chargement. */
        if (ligne && ligne.piece_url) {
          setConversations((cs) => cs.map((c) => (c.id === cible
            ? {
              ...c,
              messages: (c.messages || []).map((m) => (m.cle === cle
                ? { ...m, id: ligne.id, piece: { chemin: ligne.piece_url, nom: ligne.piece_nom, taille: ligne.piece_taille, type: ligne.piece_type } }
                : m)),
            }
            : c)));
        }
      })
      .catch((e) => {
        majEtat('echec');
        showErreur(messageClair(e, 'Message non envoyé'));
      });
  };

  /** Retenter un message resté en échec, sans avoir à le retaper. */
  const renvoyerMessage = (m) => {
    setConversations((cs) => cs.map((c) => (c.id === activeConvId
      ? { ...c, messages: (c.messages || []).filter((x) => x.cle !== m.cle) }
      : c)));
    /* On ne renvoie que le TEXTE : le fichier local a pu disparaître du
       cache du téléphone entre-temps, et renvoyer un chemin mort ferait
       échouer une seconde fois sans rien expliquer. */
    sendMessage(m.texte);
  };

  /**
   * Le temps réel : un message reçu apparaît sans rien faire.
   *
   * L'abonnement suit la session : on le referme à la déconnexion, sinon il
   * survivrait au changement de compte et le suivant recevrait les messages
   * du précédent.
   */
  useEffect(() => {
    if (!userType) return undefined;

    const fermer = api.ecouterMessagerie({
      onMessage: ({ conversationId, message }) => {
        setConversations((cs) => cs.map((c) => {
          if (c.id !== conversationId) return c;
          const dejaLa = Array.isArray(c.messages)
            && c.messages.some((m) => m.id && m.id === message.id);
          if (dejaLa) return c;
          return {
            ...c,
            messages: Array.isArray(c.messages) ? [...c.messages, message] : c.messages,
            dernier: { texte: message.texte, heure: message.heure, de: message.auteurId },
            /* La conversation ouverte à l'écran est lue à l'instant : pas de
               pastille sur ce qu'on est en train de regarder. */
            nonLus: conversationId === activeConvId ? 0 : (c.nonLus || 0) + 1,
          };
        }));

        if (conversationId === activeConvId) api.marquerLus(conversationId).catch(() => {});
      },
      onNotification: (n) => {
        setNotifications((ns) => (ns.some((x) => x.id === n.id) ? ns : [{
          id: n.id,
          type: n.type,
          texte: n.texte,
          acteurId: n.acteur_id,
          postId: n.post_id,
          lue: false,
          time: "À l'instant",
        }, ...ns]));

        /* Une demande qui arrive PENDANT qu'on regarde l'écran « Pour moi »
           doit s'y poser toute seule. Sans cela, l'artisan voit la
           notification et une liste qui ne bouge pas : il croit à une
           panne. Silencieux, parce que l'écran affiche déjà quelque
           chose. */
        if (['devis', 'rappel', 'sos'].includes(n.type) && demandesRecuesChargees.current) {
          chargerDemandesRecues({ silencieux: true });
        }
      },
    });

    return fermer;
  }, [userType, activeConvId]);

  /* ---------- création ---------- */
  /**
   * `legende` arrive de l'écran, qui la lit à l'instant où on appuie.
   *
   * Elle ne vit plus ici depuis le 02/10/2026 : tant qu'elle y était,
   * chaque lettre redessinait toute l'application — 203 ms par lettre,
   * mesuré. Voir `src/components/ChampLocal.js`.
   */
  const publish = async (legende = '') => {
    if (envoi) return;                     // envoi déjà en cours
    if (userType !== 'pro') {
      showBanner("Le fil d'actualité est réservé aux professionnels.");
      return;
    }

    // Un texte et un conseil n'ont rien à montrer : ils ne vont que dans le fil.
    const aUnVisuel = FORMATS_VISUELS.has(createType);
    const destination = aUnVisuel ? createDestination : 'fil';
    const versLeFil = destination !== 'portfolio';
    const versLePortfolio = aUnVisuel && destination !== 'fil';

    if (versLeFil && !String(legende).trim()) {
      showBanner('Ajoute une description avant de publier.');
      return false;
    }
    if (aUnVisuel && medias.length === 0) {
      showBanner('Choisis une photo ou une vidéo avant de publier.');
      return false;
    }
    if (createType === 'avantapres' && medias.length < 2) {
      showBanner("Un avant/après demande deux photos : l'avant, puis l'après.");
      return false;
    }

    const texte = String(legende).trim();
    let id = `local-${Date.now()}`;
    let envoyes = medias;
    let urlMusique = musique ? musique.uri : null;
    // Identifiants Cloudinary des clips, nécessaires pour fabriquer le montage.
    const identifiants = [];
    let identifiantMusique = null;
    let montageUrl = null;
    const versCloudinary = FORMATS_VIDEO.has(createType) && aCloudinary;

    /* On ne met pas le voile de chargement : il masquerait la jauge. C'est
       elle qui dit que l'application travaille, et combien il reste. */
    const total = medias.length + (musique ? 1 : 0);
    setErreurPublication(null);
    setEnvoi({ index: 1, total, part: 0 });
    try {
      /* Les fichiers partent d'abord vers Supabase Storage : un chemin local
         « file://… » ne veut rien dire sur le téléphone de quelqu'un d'autre. */
      const uid = api.getUserId();
      envoyes = [];
      for (const uri of medias) {
        const rang = envoyes.length + 1;
        setEnvoi({ index: rang, total, part: 0 });
        const suivi = (part) => setEnvoi({ index: rang, total, part });

        if (!estFichierLocal(uri)) { envoyes.push(uri); continue; }

        /* Les vidéos passent par Cloudinary quand il est configuré : lui seul
           sait les compresser et, surtout, assembler un montage en un seul
           fichier. Les photos — et tout le reste si Cloudinary manque —
           restent dans Supabase Storage, où les règles d'accès sont déjà
           écrites. */
        if (versCloudinary) {
          const clip = await envoyerVideoCloudinary({ uri, onProgress: suivi });
          identifiants.push(clip.publicId);
          envoyes.push(clip.url);
        } else {
          envoyes.push(await envoyerFichier({
            uri, bucket: 'publications', nom: 'media', userId: uid, onProgress: suivi,
          }));
        }
      }
      if (musique && estFichierLocal(musique.uri)) {
        setEnvoi({ index: total, total, part: 0 });
        const suiviSon = (part) => setEnvoi({ index: total, total, part });

        /* La musique suit le même chemin que les clips. Elle doit se trouver
           chez Cloudinary pour pouvoir entrer dans le montage assemblé : une
           bande-son restée chez Supabase serait injoignable au moment de
           fabriquer le fichier unique. Cloudinary range l'audio parmi les
           ressources vidéo, l'envoi est donc identique. */
        if (versCloudinary) {
          const son = await envoyerVideoCloudinary({ uri: musique.uri, onProgress: suiviSon });
          identifiantMusique = son.publicId;
          urlMusique = son.url;
        } else {
          urlMusique = await envoyerFichier({
            uri: musique.uri, bucket: 'publications', nom: 'musique', userId: uid,
            onProgress: suiviSon,
          });
        }
      }

      // La vignette est le premier média : c'est elle que montrent les listes.
      /* PAS DE FAUSSE COUVERTURE POUR UNE PUBLICATION SANS VISUEL — 05/10/2026.
         Cette ligne valait `envoyes[0] || POST_GRADIENTS[0]` : faute de
         fichier, un DÉGRADÉ de démonstration. Un conseil au format « Texte »
         publié sur la vraie base recevait donc une fausse image, rangée en
         base pour toujours, et tout ce qui lit `media` en concluait « il y a
         un visuel » — vignette grise et pastille « agrandir » sur un texte.

         Trouvé en publiant pour de vrai, pas en relisant : en mode
         démonstration les conseils d'exemple portent `media: null`, écrit à
         la main. L'écran était juste là où je l'avais regardé, et faux là où
         le propriétaire l'aurait vu. */
      const couverture = envoyes[0] || (aUnVisuel ? POST_GRADIENTS[0] : null);

      /* Le montage assemblé : une seule adresse, que Cloudinary fabriquera au
         premier visionnage puis gardera en cache. Un montage d'un seul clip
         n'a rien à assembler. */
      if (createType === 'montage' && identifiants.length > 1) {
        montageUrl = urlMontage(identifiants, { musique: identifiantMusique });
      }

      if (versLeFil) {
        /* OÙ SE PASSE CETTE PUBLICATION — 05/10/2026.
           `createVille` est un champ de TEXTE LIBRE : il ne porte aucune
           coordonnée. On le complète ici, au moment de publier, exactement
           comme `publierAnnonce` le fait depuis le 04/10 — et pas dans le
           champ, où compléter en arrière-plan pendant la frappe ferait
           bouger la valeur sans que personne ne l'ait demandé.

           Un échec ne bloque pas la publication : le déclencheur
           `pose_le_lieu_du_post()` (section 32) fait alors hériter la
           publication de la commune déclarée sur la fiche. Il y a donc deux
           filets, et le second est tenu par la base. */
        let lieuPost = {};
        if (createVille.trim()) {
          try { lieuPost = await completerLieu({ affichage: createVille }); }
          catch { lieuPost = {}; }
        }
        const row = await api.createPost({
          type: createType, texte, media: couverture, medias: envoyes,
          musique: urlMusique, montageUrl, metier: createMetier, ville: createVille,
          latitude: lieuPost.latitude || null,
          longitude: lieuPost.longitude || null,
          /* `versLeFil` est vrai ici par construction — on est dans sa
             branche. L'étiquette n'existe donc que pour ce qui part dans le
             fil, et la case elle-même disparaît pour le portfolio seul
             (voir CreerScreen) : les deux disent la même chose, et c'est
             voulu. Une seule des deux gardes suffirait, et c'est justement
             pour ça qu'il y en a deux. */
          conseil: createConseil,
          /* LE CHANTIER. Comme la case « conseil », il n'existe que pour
             ce qui part dans le fil — une publication rangée au seul
             portfolio ne crée aucune ligne dans `posts`. */
          chantierId: createChantier,
        });
        if (row) id = row.id;
      }
      if (versLePortfolio) {
        for (const url of envoyes) await api.ajouterAuPortfolio(url);
      }
    } catch (e) {
      setEnvoi(null);
      setErreurPublication(e.message || String(e));
      showErreur('Publication non enregistrée.');
      return;
    }
    setEnvoi(null);

    const couverture = envoyes[0] || (aUnVisuel ? POST_GRADIENTS[0] : null);
    if (versLeFil) {
      setPosts((ps) => [{
        id, type: 'post', format: createType, proId: myProId, time: "À l'instant",
        conseil: createConseil, chantierId: createChantier,
        texte, media: couverture, medias: envoyes, musique: urlMusique, montageUrl,
        likes: 0, liked: false, comments: [],
      }, ...ps]);
    }
    if (versLePortfolio && myProId) {
      setPros((ps) => (ps[myProId]
        ? { ...ps, [myProId]: { ...ps[myProId], portfolio: [...ps[myProId].portfolio, ...envoyes] } }
        : ps));
    }
    /* UN CONSEIL APPARAÎT TOUT DE SUITE DANS « Ses conseils ».
       Sans ça, l'artisan coche la case, publie, ouvre sa fiche — et ne voit
       rien. `chargerProfilPro()` ne repasse pas : `portfolioCharge` est déjà
       vrai, c'est tout l'intérêt de ce drapeau. Il faudrait fermer puis
       relancer l'application pour voir son propre conseil, et entre-temps on
       conclut que la case ne sert à rien. */
    if (versLeFil && createConseil && myProId) {
      setPros((ps) => (ps[myProId]
        ? {
          ...ps,
          [myProId]: {
            ...ps[myProId],
            conseils: [
              { id, format: createType, texte, media: couverture, time: "À l'instant" },
              ...(ps[myProId].conseils || []),
            ],
          },
        }
        : ps));
    }

    /* LA VILLE NE SE VIDE PLUS APRÈS UNE PUBLICATION — 05/10/2026.
       On publie trois photos du même chantier à la suite ; la vider
       obligeait à la retaper chaque fois, et c'est elle qui place la
       publication sur la carte. Un champ qu'on retape est un champ
       qu'on finit par laisser vide. */
    setMedias([]); setMusique(null); setCreateConseil(false);
    /* LE CHANTIER RESTE CHOISI, à la différence de la case « conseil ».
       On publie deux ou trois étapes du même chantier dans la journée ; le
       remettre à « Aucun » obligerait à le rechoisir à chaque fois, et un
       réglage qu'on retape est un réglage qu'on finit par ne plus poser.
       C'est le même raisonnement que la ville, qui ne se vide plus depuis
       le 05/10.

       Et on RELIT le chantier : son compteur et sa couverture viennent de
       changer côté base (déclencheur de la section 36). Sans ça, la bande
       afficherait « 3 publications » sur un chantier qui en a quatre. */
    if (versLeFil && createChantier) {
      api.chantiersDuPro(myProId).then(rangerChantiers).catch(() => {});
    }
    // Le fil des vidéos ne montre que des vidéos : on y renvoie l'artisan
    // quand c'est là que sa publication vient d'atterrir.
    if (versLeFil) setFeedMode(FORMATS_VIDEO.has(createType) ? 'video' : 'classic');
    setScreen(versLeFil ? 'home' : 'profil');
    showBanner(MESSAGE_PUBLICATION[destination]);
    /* L'écran vide SON champ lui-même : le texte ne vit plus ici, donc on
       ne peut plus le remettre à zéro d'ici. On dit juste que c'est parti. */
    return true;
  };

  /* ---------- avis ---------- */
  const submitReview = async (proId, { delais, qualite, tarif, commentaire }) => {
    let verifie = true;   // en démo, l'avis est considéré comme vérifié
    let id = `local-${Date.now()}`;
    try {
      const row = await api.createReview({ proId, delais, qualite, tarif, commentaire });
      if (row) { id = row.id; verifie = !!row.client_verifie; }
    } catch (e) {
      showErreur(messageClair(e, 'Avis non enregistré'));
      return;
    }

    setPros((prev) => {
      const pro = prev[proId];
      if (!pro) return prev;
      const review = {
        id, auteur: 'Vous', verifie, date: "À l'instant", delais, qualite, tarif, commentaire,
      };
      return { ...prev, [proId]: { ...pro, reviews: [review, ...pro.reviews] } };
    });

    showBanner(verifie
      ? 'Avis publié — vous êtes un client vérifié.'
      : 'Avis publié (non vérifié : aucun devis accepté avec ce pro).');
  };

  /* ---------- partenaires ----------
     Un partenariat engage les deux noms : il se demande, il ne se prend pas.
     Rien n'apparaît sur les profils tant que l'autre n'a pas accepté. */
  const demanderPartenariat = async (otherId) => {
    try {
      await api.demanderPartenariat(otherId);
    } catch (e) {
      showErreur(messageClair(e, 'Demande impossible'));
      return;
    }
    setPartenariatsEnvoyes((l) => [...new Set([...l, otherId])]);
    showBanner('Demande envoyée. Le partenariat apparaîtra une fois acceptée.');
  };

  const repondrePartenariat = async (demandeurId, accepte) => {
    try {
      await api.repondrePartenariat(demandeurId, accepte);
    } catch (e) {
      showErreur(messageClair(e, 'Réponse impossible'));
      return;
    }
    setDemandesPartenariat((l) => l.filter((id) => id !== demandeurId));
    if (!accepte) { showBanner('Demande refusée.'); return; }

    // Accepté : chacun apparaît maintenant chez l'autre.
    setPros((prev) => {
      if (!prev[myProId] || !prev[demandeurId]) return prev;
      return {
        ...prev,
        [myProId]: { ...prev[myProId], partners: [...new Set([...prev[myProId].partners, demandeurId])] },
        [demandeurId]: { ...prev[demandeurId], partners: [...new Set([...prev[demandeurId].partners, myProId])] },
      };
    });
    showBanner('Partenariat accepté.');
  };

  /* ---------- mes publications ---------- */
  /* Comparaison sur le texte, et non sur la valeur brute : les identifiants
     sont des UUID avec Supabase, mais des nombres dans les données de
     démonstration — où myProId, lu comme clé d'objet, est une chaîne. Sans
     cette précaution, la liste restait vide en démonstration. */
  const mesPublications = posts.filter(
    (p) => p.type === 'post' && String(p.proId) === String(myProId),
  );

  /**
   * Corriger le texte d'une de mes publications.
   *
   * Le texte SEULEMENT : changer la photo d'une publication que des gens
   * ont déjà aimée en ferait autre chose. La base tient la même règle,
   * indépendamment de cet écran (section 20 de schema.sql).
   */
  const modifierPublication = async (post, texte) => {
    const appliquer = (t, modifie) => setPosts((ps) => ps.map((p) => (p.id === post.id
      ? { ...p, texte: t, modifie }
      : p)));

    appliquer(texte, true);
    try {
      await api.modifierPost(post.id, texte);
      showBanner('Publication corrigée.');
    } catch (e) {
      appliquer(post.texte, post.modifie);
      showErreur(messageClair(e, 'Correction impossible'));
    }
  };

  const supprimerPublication = async (post) => {
    setPosts((ps) => ps.filter((p) => p.id !== post.id));
    try {
      await api.supprimerPost(post.id);
      showBanner('Publication supprimée.');
    } catch (e) {
      showErreur(messageClair(e, 'Suppression impossible'));
      await start(userType);          // on remet la liste d'aplomb
    }
  };

  /* Remonter une publication, sans la recopier : une copie perdrait ses
     j'aime et ses commentaires, et laisserait deux fois la même chose. */
  const republierPublication = async (post) => {
    try {
      await api.republierPost(post.id);
    } catch (e) {
      showErreur(messageClair(e, 'Impossible de remettre en avant'));
      return;
    }
    setPosts((ps) => [
      { ...post, time: "À l'instant" },
      ...ps.filter((p) => p.id !== post.id),
    ]);
    showBanner('Publication remise en tête du fil.');
  };

  const partagerPublication = async (post) => {
    try {
      const message = await partagerPost(post, pros[post.proId]);
      if (message) showBanner(message);
    } catch (e) {
      showErreur(messageClair(e, 'Partage impossible'));
    }
  };

  /* ---------- portfolio ---------- */
  const enregistrerPortfolio = async (liste) => {
    if (!myProId) return;
    const avant = pros[myProId] ? pros[myProId].portfolio : [];
    setPros((ps) => (ps[myProId]
      ? { ...ps, [myProId]: { ...ps[myProId], portfolio: liste } }
      : ps));
    try {
      await api.definirPortfolio(liste);
      showBanner('Réalisations enregistrées.');
      setScreen('profil');
    } catch (e) {
      setPros((ps) => (ps[myProId]
        ? { ...ps, [myProId]: { ...ps[myProId], portfolio: avant } }
        : ps));
      showErreur(messageClair(e, 'Enregistrement impossible'));
    }
  };

  /* ---------- notifications ---------- */
  const readNotification = (id) => {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, lue: true } : n)));
    api.markNotificationRead(id).catch(() => {});
  };

  /**
   * Toucher une notification doit mener au contenu, pas seulement la marquer
   * lue. On revient au fil et on ouvre la discussion concernée — en remettant
   * l'onglet « Pour vous », sinon la publication resterait invisible derrière
   * le filtre « Abonnements ».
   */
  /**
   * TOUCHER UNE NOTIFICATION MÈNE EXACTEMENT LÀ OÙ ÇA SE PASSE.
   *
   * Demandé par le propriétaire le 06/10/2026, après l'avoir essayée sur
   * son iPhone : « si je reçois "Melina a commenté votre publication", je
   * voudrais que ça nous redirige sur le post en question et que ça ouvre
   * le commentaire en question — et pareil pour toutes les autres ».
   *
   * CE QU'IL Y AVAIT AVANT, et ce que ça valait, mesuré sur la vraie base :
   *
   *     if (!n.postId) return;   // ← 11 notifications sur 15
   *
   * Annonce, partenariat, badge vérifié, devis, rappel, demande refusée :
   * onze sur quinze étaient des CULS-DE-SAC. On appuyait, l'écran ne
   * bougeait pas. C'est ce que ce projet interdit depuis le lot 5 — « une
   * cible qui ne répond pas est pire que pas de cible » — et c'était dans
   * le code pendant tout ce temps.
   *
   * > **UNE SEULE PORTE, et une destination par TYPE.** Même procédé que
   * > `changerOngletDecouvrir` : deux façons d'arriver au même écran
   * > doivent faire le même travail, et un type qu'on ajoute demain doit
   * > se voir refuser par un contrôle s'il ne sait pas où il mène.
   */
  const ouvrirNotification = async (n) => {
    readNotification(n.id);
    const ou = destinationNotif(n);

    /* 1. UNE PUBLICATION — et elle se cherche EN BASE si elle n'est pas
       dans la page chargée. Avant, `posts.some(...)` ne regardait que les
       vingt publications du fil courant (filtrées par la loupe depuis le
       lot B) : un commentaire du 21/09 répondait « Cette publication n'est
       plus disponible » alors qu'elle existait. Un message précis et faux
       est pire qu'un message général et juste — la leçon de la liste vide
       du 04/10. */
    if (ou.quoi === 'post') {
      let presente = posts.some((p) => String(p.id) === String(ou.postId));
      if (!presente) {
        try {
          const trouve = await api.publicationParId(ou.postId);
          if (trouve) { setPosts((liste) => [trouve, ...liste]); presente = true; }
        } catch (e) { /* on retombe sur le message ci-dessous */ }
      }
      if (!presente) {
        showBanner("Cette publication n'est plus disponible.");
        return;
      }
      setHiddenIds((h) => { const c = new Set(h); c.delete(ou.postId); return c; });
      /* `ouvrirCommentaires` et PAS `setOpenCommentsId` : c'est elle qui va
         CHERCHER le fil de discussion. Le panneau s'ouvrait vide, et on
         revoyait exactement le défaut signalé. */
      ouvrirCommentaires(ou.postId);
      /* LE commentaire, pas le panneau. `comment_id` est rempli par
         `notifie_commentaire()` depuis le premier jour et n'était lu par
         PERSONNE — le défaut du 01/10 dans sa forme la plus pure, puisque
         l'écran en avait précisément besoin. */
      setCommentaireCible(ou.commentId);
      /* ON OUVRE LA PUBLICATION SUR SA PROPRE PAGE, au lieu de chercher à
         faire défiler le fil jusqu'à elle. Deux tentatives de défilement
         ont échoué sur son iPhone — voir l'en-tête de
         `PublicationScreen.js` : `scrollToIndex` ne sait pas sauter à une
         carte qui n'est pas montée, et ça ne se vérifie pas au navigateur.
         Ici il n'y a plus de rang, plus de fil, plus de virtualisation. */
      setPostCible(ou.postId);
      setScreen('publication');
      return;
    }

    /* 2. UNE ANNONCE DE LA PLACE DES PROS → ses réponses. C'est le cas que
       le propriétaire a nommé : « quand c'est des notifications de réponse
       à la Place des pros et que l'on clique dessus, rien ne se passe ». */
    if (ou.quoi === 'annonce') {
      setCommentaireCible(null);
      if (!changerOngletDecouvrir('artisans')) return;
      setAnnonceCible(ou.annonceId);
      setScreen('decouvrir');
      return;
    }

    /* 3. UNE DEMANDE → « Pour moi », sur CETTE demande. Les trois colonnes
       de la section 37 disent aussi QUELLE sorte, donc quelle pastille
       ouvrir : l'écran n'a pas à interpréter le texte du type. */
    if (ou.quoi === 'demande') {
      setCommentaireCible(null);
      if (!changerOngletDecouvrir('pourmoi')) return;
      setDemandeCible({ id: ou.id, origine: ou.origine });
      setScreen('decouvrir');
      return;
    }

    /* 4. CE QUI SE PASSE SUR MA PROPRE FICHE : une demande de partenariat,
       un badge accordé ou refusé, des métiers acceptés. */
    if (ou.quoi === 'profil') {
      setCommentaireCible(null);
      setScreen('profil');
      return;
    }

    /* 5. ET CE QUI NE MÈNE NULLE PART LE DIT. Une notification dont la
       cible a disparu — la base passe en `on delete cascade`, mais une
       vieille ligne peut rester — ne doit pas laisser croire à une panne :
       on l'explique, au lieu de ne rien faire. `verifier-notifications`
       refuse qu'un type CONNU tombe ici. */
    showBanner('Cette notification n\u2019a plus rien à montrer.');
  };

  /**
   * Tout marquer comme lu.
   *
   * L'écran se met à jour TOUT DE SUITE, et la base suit. Attendre la
   * réponse du serveur pour effacer vingt points orange donnerait
   * l'impression que le bouton n'a pas marché — et si l'écriture échoue,
   * les notifications repasseront non lues au prochain chargement, ce qui
   * est exactement le bon comportement : on n'a rien perdu.
   */
  const toutMarquerLu = async () => {
    setNotifications((liste) => liste.map((n) => ({ ...n, lue: true })));
    try {
      await api.marquerToutesNotificationsLues();
    } catch (e) {
      showErreur(messageClair(e, "Les notifications n'ont pas pu être marquées lues"));
    }
  };

  /* ---------- les demandes qu'on m'adresse ---------- */

  /**
   * Charger « Pour moi ».
   *
   * À LA DEMANDE, et pas au démarrage : `loadAll()` est déjà ce qui décide
   * si l'application s'ouvre vite ou non. Ces demandes n'intéressent que
   * l'artisan, et seulement quand il ouvre l'onglet.
   *
   * `silencieux` sert au rafraîchissement d'arrière-plan : on ne remet pas
   * l'écran en « Chargement… » alors qu'il affiche déjà quelque chose.
   */
  /* LE SIGNAL NE COÛTE RIEN.
     On ne charge pas les demandes au démarrage pour savoir s'il y en a : la
     base vient d'écrire une notification pour chacune, et elle est déjà
     chargée. Une notification non lue de type `devis`, `rappel` ou `sos`
     veut dire, littéralement, « une demande vient d'arriver ». */
  const TYPES_DEMANDE = ['devis', 'rappel', 'sos'];
  const nouvellesDemandes = notifications.filter(
    (n) => !n.lue && TYPES_DEMANDE.includes(n.type),
  );

  /* QUI PEUT ADMINISTRER EST DÉCIDÉ PAR LA BASE, pas par une liste
     d'adresses écrite ici. `admin_resume()` rend `{ admin: false }` à tout
     le monde sauf aux lignes de `public.administrateurs`, et elle ne lève
     PAS d'erreur pour les autres : un utilisateur ordinaire ne doit pas
     remplir les journaux d'erreurs du projet en ouvrant son profil.

     `aTraiter` additionne les deux files : c'est ce que porte la pastille,
     et une pastille qui compte une seule des deux ferait manquer l'autre. */
  const chargerResumeAdmin = async () => {
    try {
      const r = await api.resumeAdmin();
      setAdmin(r && r.admin
        ? { ...r, aTraiter: (r.verifications || 0) + (r.signalements || 0) }
        : null);
    } catch (e) {
      /* Un back-office qui ne répond pas n'est PAS une panne de
         l'application : on n'affiche simplement pas le bouton. Afficher un
         bandeau rouge ici alarmerait tout le monde pour une fonction que
         presque personne n'utilise. */
      setAdmin(null);
    }
  };

  const chargerDemandesRecues = async ({ silencieux = false } = {}) => {
    if (!silencieux) setDemandesRecuesEtat('charge');
    try {
      setDemandesRecues(await api.chargerDemandesRecues());
      setDemandesRecuesEtat('pret');
      demandesRecuesChargees.current = true;
    } catch (e) {
      setDemandesRecuesEtat('echec');
      showErreur(messageClair(e, "Vos demandes n'ont pas pu être chargées"));
    }
  };

  /**
   * Accepter, refuser, clore.
   *
   * L'écran se met à jour tout de suite et la base suit — même raison que
   * pour les notifications : attendre le serveur pour faire bouger un
   * bouton donne l'impression qu'il n'a pas marché. En cas d'échec, on
   * remet la demande dans son état d'avant ET on le dit : une demande
   * qu'on croit acceptée alors qu'elle ne l'est pas, c'est un client qui
   * attend pour rien.
   */
  /** Éteindre le signal : les notifications de demande passent lues. */
  const marquerDemandesVues = () => {
    const aEteindre = nouvellesDemandes.map((n) => n.id);
    if (!aEteindre.length) return;
    setNotifications((liste) => liste.map((n) => (
      aEteindre.includes(n.id) ? { ...n, lue: true } : n
    )));
    /* On n'attend pas, et on ne crie pas si ça échoue : au pire la
       pastille revient au prochain chargement, ce qui est le bon
       comportement — on n'a rien perdu. */
    aEteindre.forEach((id) => { api.markNotificationRead(id).catch(() => {}); });
  };

  const repondreDemandeRecue = async (demande, statut) => {
    const avant = demande.statut;
    setDemandesRecues((liste) => liste.map((d) => (
      d.id === demande.id ? { ...d, statut } : d
    )));
    try {
      const { statut: enBase } = await api.repondreDemandeRecue(demande.genre, demande.id, statut);
      setDemandesRecues((liste) => liste.map((d) => (
        d.id === demande.id ? { ...d, statut: enBase } : d
      )));
      if (statut === 'accepte') {
        showBanner(demande.telephone
          ? `Demande acceptée. Vous pouvez appeler ${demande.nom} au ${demande.telephone}.`
          : 'Demande acceptée. Le client est prévenu.');
      } else if (statut === 'refuse') {
        showBanner('Demande refusée. Le client est prévenu, il pourra chercher ailleurs.');
      } else {
        showBanner('Demande close.');
      }
    } catch (e) {
      setDemandesRecues((liste) => liste.map((d) => (
        d.id === demande.id ? { ...d, statut: avant } : d
      )));
      showErreur(messageClair(e, "La réponse n'est pas partie"));
    }
  };

  /* ---------- mon compte ---------- */
  /**
   * Demande de modification des métiers, pour un profil déjà vérifié.
   * La base n'en accepte qu'une en attente à la fois : le message d'erreur
   * le dit plutôt que de laisser croire à une panne.
   */
  const demanderMetiers = async ({ metiersVoulus, motif }) => {
    const moi = pros[myProId] || {};
    try {
      await api.demanderChangementMetiers({
        metiersActuels: moi.metiers || (moi.metier ? [moi.metier] : []),
        metiersVoulus,
        motif,
      });
      setDemandeMetiers({ metiers_voulus: metiersVoulus, motif, statut: 'en_attente' });
      showBanner('Demande envoyée. Vos métiers actuels restent en place en attendant.');
    } catch (e) {
      const dejaUne = String(e.message || e).includes('idx_metier_demande_unique_en_attente');
      showErreur(dejaUne
        ? 'Vous avez déjà une demande en cours d\'examen.'
        : messageClair(e, 'Demande impossible'));
    }
  };

  const enregistrerProfil = async ({ profil, sos }) => {
    let complet = profil;

    /* TROIS ÉTAPES, TROIS MESSAGES DISTINCTS
       --------------------------------------
       Tout était dans un seul `try`, et l'échec s'annonçait toujours par
       « Enregistrement impossible ». Or ces trois étapes échouent pour des
       raisons qui n'ont rien à voir : l'envoi d'une image dépend du réseau
       et du stockage, l'écriture de la fiche dépend de la base. Le
       29/09/2026, une photo de profil refusait de s'enregistrer, et le
       message ne disait pas laquelle des trois avait lâché.

       On nomme donc l'étape. Sur un défaut qu'on ne peut pas reproduire —
       l'envoi depuis un téléphone n'existe pas dans le conteneur où je
       travaille — c'est la moitié du chemin. */
    const uid = api.getUserId();
    let avatarUrl = profil.avatarUrl;
    let bannerUrl = profil.bannerUrl;

    if (estFichierLocal(profil.avatarUrl)) {
      try {
        avatarUrl = await envoyerFichier({
          uri: profil.avatarUrl, bucket: 'avatars', nom: 'avatar', userId: uid,
        });
      } catch (e) {
        showErreur(messageClair(e, 'Envoi de la photo de profil impossible'));
        return;
      }
    }

    if (estFichierLocal(profil.bannerUrl)) {
      try {
        bannerUrl = await envoyerFichier({
          uri: profil.bannerUrl, bucket: 'bannieres', nom: 'banniere', userId: uid,
        });
      } catch (e) {
        showErreur(messageClair(e, 'Envoi de la bannière impossible'));
        return;
      }
    }

    /* MÊME RATTRAPAGE POUR LA FICHE PRO, et c'est celui qui compte le plus :
       sans MES coordonnées, aucun filtre « autour de moi » ne peut
       fonctionner, quelles que soient les coordonnées des autres. Relevé le
       04/10/2026 : 1 fiche sur 7 en avait. */
    let lieuPro = profil;
    try {
      lieuPro = await completerLieu({
        affichage: profil.ville, codePostal: profil.codePostal,
        codeInsee: profil.codeInsee,
        latitude: profil.latitude, longitude: profil.longitude,
      });
    } catch { lieuPro = profil; }

    complet = {
      ...profil,
      avatarUrl,
      bannerUrl,
      codePostal: lieuPro.codePostal || null,
      codeInsee: lieuPro.codeInsee || null,
      latitude: lieuPro.latitude || null,
      longitude: lieuPro.longitude || null,
    };

    try {
      await api.updateProfile({ userType, profil: complet });
    } catch (e) {
      showErreur(messageClair(e, 'Enregistrement de la fiche impossible'));
      return;
    }

    if (sos) {
      try {
        await api.updateSosAvailability(sos);
      } catch (e) {
        showErreur(messageClair(e, 'Disponibilité aux urgences non enregistrée'));
        return;
      }
    }

    if (userType === 'pro') {
      setPros((prev) => (prev[myProId]
        ? { ...prev, [myProId]: { ...prev[myProId], ...complet } }
        : prev));
    } else {
      setMonProfil((p) => ({ ...p, ...complet }));
    }
    if (sos) setMesSos(sos);

    setScreen('profil');
    showBanner('Profil enregistré.');
  };

  /**
   * Envoi du Kbis et de l'attestation d'assurance.
   * Le profil passe en « en attente » : c'est vous qui validez depuis Supabase.
   */
  const envoyerDocuments = async ({ kbis, assurance, rgeFichier, rge }) => {
    try {
      const uid = api.getUserId();
      const kbisPath = kbis
        ? await envoyerFichier({ uri: kbis.uri, bucket: 'documents', nom: 'kbis', userId: uid })
        : null;
      const assurancePath = assurance
        ? await envoyerFichier({ uri: assurance.uri, bucket: 'documents', nom: 'assurance', userId: uid })
        : null;
      /* L'attestation RGE rejoint les deux autres dans l'espace privé
         `documents` : elle porte un numéro de qualification, elle n'a rien
         à faire dans un espace public. */
      const rgePath = rgeFichier
        ? await envoyerFichier({ uri: rgeFichier.uri, bucket: 'documents', nom: 'rge', userId: uid })
        : null;

      await api.submitDocuments({ kbisPath, assurancePath, rgePath, rge });

      setPros((prev) => (prev[myProId]
        ? {
            ...prev,
            [myProId]: {
              ...prev[myProId],
              kbisPath: kbisPath || prev[myProId].kbisPath,
              assurancePath: assurancePath || prev[myProId].assurancePath,
              rgePath: rgePath || prev[myProId].rgePath,
              rgeDeclare: rge ? !!rge.declare : prev[myProId].rgeDeclare,
              rgeNumero: rge ? rge.numero : prev[myProId].rgeNumero,
              rgeExpire: rge ? rge.expire : prev[myProId].rgeExpire,
              verificationStatut: 'en_attente',
            },
          }
        : prev));

      setScreen('profil');
      showBanner('Documents envoyés. Votre profil passe en vérification.');
    } catch (e) {
      showErreur(messageClair(e, 'Envoi impossible'));
    }
  };

  /** Déconnexion : on repart de l'écran d'accueil, l'état est remis à zéro. */
  const deconnexion = async () => {
    try { await api.signOut(); } catch (e) { /* rien à faire de plus */ }
    setUserType(null);
    setTypeChoisi(null);
    setScreen('home');
    setPros({});
    setPosts([]);
    setFinDuFil(false);
    setConversations([]);
    setNotifications([]);
    setFollowingIds(new Set());
    setSavedIds(new Set());
    setHiddenIds(new Set());
    setActiveConvId(null);
    setViewedProId(null);
    setCommentsPostId(null);
    setDecouvrirTab('artisans');
    setDemandesVuesLe(null); setDemandesVuesMaj(false);
    setMonProfil({ nom: 'Vous', ville: '', telephone: '', avatarUrl: null, bannerUrl: null });
    setDemandesPartenariat([]); setPartenariatsEnvoyes([]);
    setMesSos(null);
    setDemandeMetiers(null);
    setAnnonces([]);
    setMesReponsesDemandes(new Set());
    setFeedMode('classic');
    setFeedTab('pourvous');
  };

  /* ---------- modération et droits des personnes ---------- */

  /**
   * Supprimer son compte.
   *
   * La suppression côté serveur se fait en deux temps (voir api.js). Quoi
   * qu'il arrive ensuite, on repart de l'écran d'accueil et on vide tout ce
   * qui est en mémoire : laisser des publications affichées après une
   * suppression donnerait l'impression qu'elle n'a pas eu lieu.
   */
  const supprimerMonCompte = async () => {
    try {
      await api.supprimerMonCompte();
      await deconnexion();
      showBanner('Votre compte a été supprimé. Merci d’être passé par Opus.');
    } catch (e) {
      /* Cas particulier : les données sont parties mais le compte de
         connexion subsiste. On le DIT, au lieu de laisser croire à un
         échec complet — et on déconnecte quand même. */
      if (e && e.partiel) {
        await deconnexion();
        showBanner(e.message);
        return;
      }
      throw e;
    }
  };

  /**
   * Signaler un contenu. L'écran ouvre la modale en disant QUOI ; elle
   * s'occupe du reste, y compris du blocage si la personne préfère ça.
   */
  const ouvrirSignalement = (cible) => setASignaler(cible);

  const bloquerPersonne = async (userId) => {
    await api.bloquer(userId);
    /* On retire tout de suite ce qui vient de cette personne : la base ne le
       renverra plus, mais ce qui est déjà affiché à l'écran, si. */
    setPosts((ps) => ps.filter((post) => String(post.proId) !== String(userId)));
    setDemandes((ds) => ds.filter((d) => String(d.auteurId) !== String(userId)));
    setConversations((cs) => cs.filter((c) => String(c.proId) !== String(userId)));
    setFollowingIds((ids) => {
      const suite = new Set(ids);
      suite.delete(userId);
      return suite;
    });
  };

  /* ---------- demandes de particuliers ---------- */
  const publierDemande = async ({
    metier, ville, texte, codePostal, latitude, longitude, photos = [],
    budget = null, urgence = 'quand_possible',
  }) => {
    let id = `local-${Date.now()}`;
    let envoyees = photos;
    setLoading(true);
    try {
      const uid = api.getUserId();
      envoyees = [];
      for (const uri of photos) {
        envoyees.push(estFichierLocal(uri)
          ? await envoyerFichier({ uri, bucket: 'publications', nom: 'demande', userId: uid })
          : uri);
      }
      const ligne = await api.createDemande({
        metier, ville, texte, codePostal, latitude, longitude,
        media: envoyees[0] || null, medias: envoyees,
        budget, urgence,
      });
      if (ligne) id = ligne.id;
    } catch (e) {
      setLoading(false);
      showErreur(messageClair(e, 'Publication impossible'));
      return;
    }
    setLoading(false);

    setDemandes((ds) => [{
      id,
      auteurId: api.getUserId(),
      auteur: monProfil.nom || 'Vous',
      avatarUrl: monProfil.avatarUrl || null,
      metier,
      ville: ville || 'Non précisée',
      codePostal, latitude, longitude,
      texte,
      media: envoyees[0] || null,
      medias: envoyees,
      time: "À l'instant",
      reponses: 0,
      budget, urgence,
    }, ...ds]);
    showBanner('Votre demande est publiée. Les pros du métier vont la recevoir.');
  };

  const repondreDemande = async (demande) => {
    const contactId = `part-${demande.auteurId || demande.id}`;
    let conv = conversations.find((c) => c.contact && c.contact.id === contactId);

    if (!conv) {
      let id = `local-${Date.now()}`;
      try {
        const row = await api.createConversationWithClient(demande.auteurId);
        if (row) id = row.id;
      } catch (e) {
        showErreur("La conversation n'a pas pu être ouverte.");
        return;
      }
      conv = {
        id,
        proId: null,
        /* La photo du particulier arrive avec la demande : on la reprend,
           au lieu de laisser une pastille vide jusqu'au prochain
           rechargement. */
        autre: {
          id: demande.auteurId,
          nom: demande.auteur,
          avatarUrl: demande.avatarUrl || null,
          type: 'particulier',
        },
        contact: {
          id: contactId,
          titre: demande.auteur,
          metier: `Demande · ${nomMetier(demande.metier)}`,
          avatarUrl: demande.avatarUrl || null,
        },
        messages: [],
      };
      setConversations((cs) => [conv, ...cs]);

      try {
        await api.repondreADemande(demande.id, null);
      } catch (e) {
        // La conversation est ouverte : la réponse sera comptée au prochain envoi.
      }
      setDemandes((ds) => ds.map((d) => (
        d.id === demande.id ? { ...d, reponses: d.reponses + 1 } : d
      )));
    }

    /* Se souvenir qu'on a répondu, pour ne pas relire dix fois la même
       demande. Même si la conversation existait déjà. */
    setMesReponsesDemandes((r) => new Set([...r, demande.id]));

    await ouvrirConversation(conv.id);
  };

  /**
   * « J'AI TROUVÉ » — l'auteur referme sa demande, ou la rouvre.
   *
   * `statut` existait depuis le premier jour et RIEN ne le lisait : une
   * demande ne se fermait jamais, et la liste des artisans gardait des
   * chantiers faits depuis six mois. C'est la même famille que les trois
   * tables du 01/10 — une colonne écrite que personne ne relit.
   *
   * On met à jour l'écran AVANT la base, puis on remet en place si elle
   * refuse : fermer sa demande est un geste sans conséquence, et attendre
   * le réseau pour voir une étiquette changer donne l'impression que rien
   * ne s'est passé.
   */
  const changerStatutDemande = async (id, statut) => {
    const avant = demandes;
    setDemandes((ds) => ds.map((d) => (d.id === id ? { ...d, statut } : d)));
    try {
      await api.changerStatutDemande(id, statut);
      showBanner(statut === 'pourvue'
        ? 'Demande fermée. Les artisans ne la voient plus.'
        : 'Demande rouverte.');
    } catch (e) {
      setDemandes(avant);
      showErreur(messageClair(e, 'La demande n’a pas pu être modifiée'));
    }
  };

  /* ---------- la Place des pros ---------- */
  const publierAnnonce = async (annonce) => {
    let id = `local-${Date.now()}`;
    /* LES PHOTOS PARTENT AVANT L'ANNONCE, exactement comme pour une demande
       de particulier : ce qui est rangé en base, ce sont des ADRESSES, et
       une adresse qui pointe encore sur le téléphone ne s'affiche chez
       personne. `estFichierLocal` laisse passer ce qui est déjà en ligne —
       sans quoi republier renverrait les mêmes photos une seconde fois. */
    let medias = annonce.medias || [];
    let lieu = annonce;
    setLoading(true);
    try {
      const uid = api.getUserId();
      const envoyees = [];
      for (const uri of medias) {
        envoyees.push(estFichierLocal(uri)
          ? await envoyerFichier({ uri, bucket: 'publications', nom: 'annonce', userId: uid })
          : uri);
      }
      medias = envoyees.filter(Boolean);
      /* LES COORDONNÉES, RETROUVÉES AU MOMENT D'ENREGISTRER.
         Le champ ville du formulaire est PRÉ-REMPLI depuis le profil :
         personne ne le touche, donc personne ne choisit de suggestion,
         donc aucune annonce n'avait jamais de coordonnées — relevé le
         04/10/2026, 0 sur 4 sur la vraie base. Sans elles, le filtre par
         secteur ne trouve rien et le tri par proximité ne trie rien.
         L'échec ne bloque pas : la ligne part sans, et le prochain
         enregistrement la complétera. */
      try {
        lieu = await completerLieu({
          affichage: annonce.ville, codePostal: annonce.codePostal,
          latitude: annonce.latitude, longitude: annonce.longitude,
        });
      } catch { lieu = annonce; }   // jamais de publication refusée pour ça
      const ligne = await api.publierAnnonce({
        ...annonce, medias,
        codePostal: lieu.codePostal || null,
        latitude: lieu.latitude || null,
        longitude: lieu.longitude || null,
      });
      if (ligne) id = ligne.id;
    } catch (e) {
      setLoading(false);
      showErreur(messageClair(e, 'Publication impossible'));
      return;
    }
    setLoading(false);
    const moi = pros[myProId] || {};
    setAnnonces((as) => [{
      ...annonce,
      codePostal: lieu.codePostal || null,
      latitude: lieu.latitude || null,
      longitude: lieu.longitude || null,
      medias,
      id,
      time: "À l'instant",
      reponses: 0,
      aMoi: true,
      jyAiRepondu: false,
      auteurId: myProId,
      auteur: {
        id: myProId,
        entreprise: moi.entreprise,
        metier: moi.metier,
        metiers: moi.metiers || [],
        ville: moi.ville,
        verifie: !!moi.verifie,
        avatarUrl: moi.avatarUrl,
        latitude: moi.latitude,
        longitude: moi.longitude,
      },
    }, ...as]);
    showBanner('Annonce publiée sur la Place des pros.');
  };

  /**
   * Répondre à une annonce ouvre une conversation avec son auteur : c'est
   * un artisan, donc le mécanisme des messages entre pros existe déjà.
   */
  /**
   * RÉPONDRE À UNE ANNONCE — et le message part VRAIMENT.
   *
   * Avant le 04/10/2026, cette fonction écrivait la ligne de réponse puis
   * posait une AMORCE dans la conversation : un brouillon. Si le répondant
   * l'abandonnait — ce que fait la moitié des gens —, l'auteur voyait son
   * compteur monter et n'entendait jamais personne. Un « 3 réponses » qui
   * ne veut rien dire.
   *
   * L'ORDRE COMPTE, et il est l'inverse de ce qu'on écrirait d'instinct :
   * on envoie le message D'ABORD, on enregistre la réponse ENSUITE. Si
   * l'envoi échoue, il n'y a pas de réponse fantôme à expliquer.
   */
  const repondreAnnonce = async (annonce, texte) => {
    if (!annonce.auteur) return;
    const message = String(texte || '').trim();
    if (!message) return;

    try {
      const conv = await handleContact({ id: annonce.auteur.id }, 'message');
      if (!conv) throw new Error('La conversation n’a pas pu être ouverte.');
      await sendMessage(message, null, conv.id);
      await api.repondreAnnonce(annonce.id, message);
    } catch (e) {
      showErreur(messageClair(e, 'Réponse impossible'));
      return;
    }

    setAnnonces((as) => as.map((a) => (
      a.id === annonce.id ? { ...a, jyAiRepondu: true, reponses: a.reponses + 1 } : a
    )));
  };

  const fermerAnnonce = async (annonce) => {
    try {
      await api.fermerAnnonce(annonce.id);
    } catch (e) {
      showErreur(messageClair(e, 'Retrait impossible'));
      return;
    }
    setAnnonces((as) => as.filter((a) => a.id !== annonce.id));
    showBanner('Annonce retirée.');
  };

  /**
   * Ouvrir une conversation avec un particulier depuis sa fiche publique.
   * Même mécanique que la réponse à une demande, sans la demande.
   */
  const contacterParticulier = async (profil) => {
    const contactId = `part-${profil.id}`;
    let conv = conversations.find((c) => c.contact && c.contact.id === contactId);

    if (!conv) {
      let id = `local-${Date.now()}`;
      try {
        const row = await api.createConversationWithClient(profil.id);
        if (row) id = row.id;
      } catch (e) {
        showErreur("La conversation n'a pas pu être ouverte.");
        return;
      }
      conv = {
        id,
        proId: null,
        autre: {
          id: profil.id,
          nom: profil.nom,
          avatarUrl: profil.avatarUrl || null,
          type: 'particulier',
        },
        contact: {
          id: contactId,
          titre: profil.nom,
          metier: profil.ville || 'Particulier',
          avatarUrl: profil.avatarUrl || null,
        },
        messages: [],
      };
      setConversations((cs) => [conv, ...cs]);
    }

    await ouvrirConversation(conv.id);
  };

  /* ---------- SOS : intervention d'urgence ---------- */

  /**
   * Cherche les artisans disponibles autour de l'adresse déclarée.
   * Avec Supabase, c'est la base qui trie par distance et écarte ceux dont
   * le rayon ne couvre pas l'intervention. En démonstration, on se rabat sur
   * les disponibilités d'exemple et leurs distances simulées.
   */
  const chercherArtisansUrgence = async ({ metierKey, latitude, longitude }) => {
    if (!hasSupabase) return artisansDisponiblesDemo(metierKey);
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error(
        "Choisissez votre adresse dans la liste de suggestions : sans coordonnées, "
        + 'impossible de trouver les artisans les plus proches.',
      );
    }
    return api.chercherArtisansUrgence({ metierKey, latitude, longitude });
  };

  const envoyerSos = async (demande) => {
    const pro = pros[demande.proId];
    try {
      /* Le nom et le numéro partent avec la demande : une urgence sans
         numéro ne sert à rien, l'artisan ne peut même pas dire qu'il
         arrive. L'écran du SOS le dit avant qu'on appuie. */
      await api.createSosRequest({
        ...demande,
        nom: monProfil.nom || null,
        telephone: monProfil.telephone || null,
      });
    } catch (e) {
      showErreur(messageClair(e, 'Envoi impossible'));
      return;
    }
    setScreen('home');
    /* ON NE POUSSE PLUS DE FAUSSE NOTIFICATION ICI.
       Celle qui vivait à cet endroit n'existait que sur CE téléphone :
       elle annonçait « l'artisan a été prévenu » à celui qui venait
       d'écrire, et personne d'autre ne la voyait jamais. C'est maintenant
       la base qui prévient — déclencheur `notifie_demande`, section 24 de
       schema.sql —, donc l'artisan la reçoit pour de bon, et le client est
       prévenu en retour quand elle est acceptée. */
    showBanner(
      pro
        ? `Votre demande est partie à ${pro.entreprise}. Vous serez prévenu dès qu'il répond. `
          + `Estimation ${demande.prixMin}–${demande.prixMax} €.`
        : 'Votre demande d\'urgence est partie.',
    );
  };

  /* ---------- assistant IA ---------- */
  const askAiMatch = async (texte) => {
    const demande = String(texte || '').trim();
    if (!demande) return;
    setAiMatchLoading(true); setAiMatchError(null); setAiMatches(null);
    try {
      /* On envoie TOUS les métiers exercés, pas seulement le principal :
         sinon un plombier-chauffagiste reste invisible pour une demande de
         chauffage. C'est le même oubli qui avait été corrigé dans la
         recherche par mot-clé. */
      const liste = Object.values(pros).map((p) => {
        const avg = avgReviews(p);
        return {
          proId: p.id, metiers: metiersDe(p), ville: p.ville, exp: p.exp,
          note: avg.count ? avg.global.toFixed(1) : null, bio: p.bio,
        };
      });
      const recs = await aiMatchPros(demande, liste);
      setAiMatches(recs.filter((r) => pros[r.proId]));
    } catch (e) {
      setAiMatchError(e && e.message
        ? e.message
        : "L'assistant IA n'a pas pu répondre. Réessayez.");
    }
    setAiMatchLoading(false);
  };

  /* ---------- dérivés ---------- */
  const visiblePosts = posts.filter((p) => !hiddenIds.has(p.id));
  /* LE FIL NE SE REFILTRE PLUS À L'ÉCRAN — 05/10/2026.
     `feedAbonnements` retenait ici les publications de mes abonnements
     PARMI LES VINGT DÉJÀ TÉLÉCHARGÉES. Avec trois abonnements et seize
     publications, personne ne le voit. Avec mille artisans, les vingt
     dernières publications de toute la France n'en contiennent aucune :
     l'onglet affiche une page vide, et la suivante aussi.
     `fil_filtre()` (section 33 de schema.sql) le fait dans la base, et
     `changerCeQuOnVoit` est la seule porte qui le lui demande.
     Il ne reste ici que « masquer cette publication », qui est un geste de
     lecture, immédiat, et qui ne doit pas coûter une requête. */
  /**
   * Le fil « Vidéos » ne retient que ce qui se regarde en plein écran — les
   * vidéos ET les montages — et pas les publicités, qui n'en sont pas. Le fil
   * « Fil » garde tout : une vidéo y apparaît comme une carte, avec sa
   * pastille de lecture.
   *
   * FORMATS_VIDEO est la même liste que celle qui décide vers quel fil
   * renvoyer après une publication. Deux listes séparées finiraient par
   * diverger : c'est exactement ce qui excluait les montages d'ici.
   */
  const feedFiltered = visiblePosts;

  /**
   * L'interlocuteur d'une conversation. C'est un professionnel quand un
   * particulier l'a contacté, et un particulier quand un pro répond à une
   * demande : la messagerie fonctionne dans les deux sens.
   */
  const contactDe = (conv) => {
    /* 1. Un professionnel : sa fiche est la plus riche — raison sociale,
          métier, badge vérifié. */
    if (conv.proId && pros[conv.proId]) {
      const p = pros[conv.proId];
      return {
        id: p.id, titre: p.entreprise, metier: p.metier,
        avatarUrl: p.avatarUrl, verifie: p.verifie,
      };
    }

    /* 2. Un PARTICULIER : il n'a pas de fiche professionnelle, mais il a un
          nom et une photo dans `users`. C'est ce qui manquait — la
          messagerie affichait « Contact » à la place de la personne dès
          qu'un artisan parlait à un client. */
    if (conv.autre && conv.autre.nom) {
      return {
        id: conv.autre.id,
        titre: conv.autre.nom,
        avatarUrl: conv.autre.avatarUrl || null,
      };
    }

    /* 3. Une conversation ouverte à l'instant, pas encore rechargée. */
    if (conv.contact) return conv.contact;

    /* 4. Le compte a été supprimé. On le dit, plutôt que « Contact » — qui
          ne veut rien dire et laisse croire à un défaut d'affichage. */
    return { id: conv.id, titre: 'Compte supprimé' };
  };

  const conversationsAffichees = conversations.map((c) => ({ ...c, contact: contactDe(c) }));
  const activeConv = conversationsAffichees.find((c) => c.id === activeConvId);
  const unreadCount = notifications.filter((n) => !n.lue).length;
  /* Le total des messages non lus, pour la pastille de la barre du bas. */
  const messagesNonLus = conversations.reduce((n, c) => n + (c.nonLus || 0), 0);

  /** Le fil d'actualité est réservé aux professionnels. */
  const canPublish = userType === 'pro';

  /* ------------------------------------------------------------------
     LES DEUX VOYANTS DE « DÉCOUVRIR », ÉCRITS UNE SEULE FOIS

     Relevé par le propriétaire le 04/10/2026 : « on voit un point orange
     sur Découvrir, ça veut dire qu'il y a quelque chose à aller voir.
     Après on clique, et là on a trois choix, mais le point ne s'affiche
     pas — donc on ne sait pas ce qui doit être vu. »

     Le défaut n'était pas que les onglets manquaient de point : c'est que
     la barre du bas calculait SA condition dans son coin. Deux formules
     pour une seule vérité, et rien pour les tenir ensemble.

     > **Un voyant de parent est exactement le OU de ses enfants.** Pas
     > « à peu près » : exactement, sinon il s'allume pour quelque chose
     > qu'on ne trouvera jamais — et au bout de trois fois, on cesse de le
     > regarder. C'est ce qui était arrivé à la cloche des notifications.

     Les deux conditions vivent donc ici, nommées, et la barre du bas n'a
     plus le droit d'en inventer une troisième.

     ET ELLES SONT ÉCRITES SOUS `canPublish`, PAS PLUS HAUT : une `const`
     lue avant sa déclaration lève un `ReferenceError` au démarrage — pas
     un avertissement, un écran blanc. Le linter ne l'a pas signalé.
     ------------------------------------------------------------------ */
  const voyantPourMoi = nouvellesDemandes.length > 0;
  /* CE QUI EST NOUVEAU : déposé APRÈS ma dernière visite de l'onglet, et
     pas par moi. Avant, le point s'allumait sur `demandes.length > 0` —
     c'est-à-dire sur l'EXISTENCE d'une demande, pas sur sa nouveauté. Avec
     une seule demande vieille de trois semaines dans la base, il était
     allumé en permanence, et un point toujours allumé ne veut plus rien
     dire. C'est le défaut que le propriétaire a signalé le 04/10. */
  const estNouvelleDemande = (d) => !!d.deposeeLe
    && String(d.auteurId) !== String(api.getUserId())
    && (!demandesVuesLe || d.deposeeLe > demandesVuesLe);
  const nbDemandesNouvelles = demandes.filter(estNouvelleDemande).length;
  const voyantDemandes = canPublish && !demandesVuesMaj && nbDemandesNouvelles > 0;
  const voyantDecouvrir = voyantPourMoi || voyantDemandes;

  /* ------------------------------------------------------------------
     LES ONGLETS DE « DÉCOUVRIR » — une seule liste, deux lecteurs.

     Elle sert à la fois à la rangée de pastilles et aux pages qu'on fait
     défiler au doigt. Deux listes séparées se désaligneraient le jour où
     l'on ajoute un onglet : la pastille dirait « Demandes » et le doigt
     ouvrirait autre chose, sans la moindre erreur. Même raisonnement que
     les trois voyants ci-dessus.

     L'ORDRE EST UN CHOIX. « Pour moi » d'abord, parce qu'une demande qui
     m'est nommément adressée passe avant une annonce publique : c'est du
     travail qui attend une réponse, pas une occasion à saisir. Et un
     artisan n'a pas besoin qu'on lui trouve un artisan — son deuxième
     onglet est sa place de marché entre pros.
     ------------------------------------------------------------------ */
  const ongletsDecouvrir = canPublish ? [
    { key: 'pourmoi', label: 'Pour moi', dot: voyantPourMoi },
    { key: 'artisans', label: 'Place des pros' },
    { key: 'demandes', label: 'Demandes', dot: voyantDemandes },
  ] : [
    { key: 'artisans', label: 'Artisans' },
    { key: 'demandes', label: 'Demandes', dot: voyantDemandes },
  ];

  const indexDecouvrir = Math.max(
    0, ongletsDecouvrir.findIndex((o) => o.key === decouvrirTab),
  );

  /**
   * CHANGER D'ONGLET — par la pastille OU par le glissement.
   *
   * Les deux chemins passent ici, et c'est la règle des voyants du 04/10
   * appliquée d'avance : deux façons d'arriver au même écran doivent faire
   * exactement le même travail. Sans cette fonction unique, glisser jusqu'à
   * « Pour moi » n'aurait ni rechargé les demandes ni éteint le point — et
   * personne ne l'aurait remarqué, puisque l'écran, lui, s'affiche.
   */
  const changerOngletDecouvrir = (k) => {
    /* UNE CLÉ INCONNUE NE DOIT PAS RETOMBER SUR LA PREMIÈRE PAGE EN
       SILENCE. C'est le défaut du lot G, trouvé au navigateur : la cloche
       appelait `changerOngletDecouvrir('pros')`, et la clé de la Place des
       pros est `'artisans'`. `indexDecouvrir` fait
       `Math.max(0, findIndex(...))`, donc −1 devenait 0 : on atterrissait
       sur « Pour moi », AUCUNE pastille n'était active — l'onglet demandé
       ne correspondait à rien —, et rien n'a levé la moindre alerte.
       « Pour moi » marchait, lui, par pur hasard : c'est la page de repli.

       Et le cas qui reste, qui n'est pas une faute de frappe : un
       PARTICULIER n'a pas d'onglet « Pour moi ». Une notification « a
       accepté votre demande » lui est pourtant destinée. Il n'existe
       aujourd'hui aucun écran « mes demandes envoyées » : on le dit, au
       lieu de le poser sur une page au hasard. */
    if (!ongletsDecouvrir.some((o) => o.key === k)) {
      showBanner('Cet écran n’existe pas encore pour votre compte.');
      return false;
    }
    setDecouvrirTab(k);
    if (k === 'demandes') {
      /* Le POINT s'éteint tout de suite ; les badges « Nouveau », eux,
         restent jusqu'au prochain chargement — on ne les retire pas sous
         les yeux de celui qui vient justement les lire. */
      setDemandesVuesMaj(true);
      /* Et la base retient l'heure, pour que le point ne revienne pas au
         prochain lancement. L'échec n'est pas remonté : ne pas réussir à
         éteindre un point n'est pas une raison d'afficher une erreur. */
      api.marquerDemandesVues().catch(() => {});
    }
    /* On recharge à chaque ouverture : une demande peut être arrivée depuis
       la dernière fois, et l'artisan vient justement vérifier ça.
       Silencieux si on a déjà quelque chose à montrer. */
    if (k === 'pourmoi') {
      chargerDemandesRecues({ silencieux: demandesRecuesEtat === 'pret' });
      /* Venir les lire ÉTEINT le signal. Sans cela, la pastille resterait
         allumée pour toujours et finirait par ne plus rien vouloir dire —
         c'est exactement ce qui était arrivé à la cloche des
         notifications. */
      marquerDemandesVues();
    }
    return true;
  };

  /** Le post dont on regarde les commentaires dans le fil vidéo. */
  const commentsPost = commentsPostId != null
    ? posts.find((p) => p.id === commentsPostId)
    : null;

  /* ---------- rendu ---------- */

  /* Reprise d'une session existante : on évite de faire clignoter l'accueil.
     Un rond qui tourne sur fond vide, c'est ce qu'on regarde en se demandant
     si l'application est plantée. Le squelette, lui, montre la forme de ce
     qui arrive — on reconnaît le fil avant même qu'il soit là. */
  if (demarrage) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar style="dark" />
        <SqueletteFil />
      </View>
    );
  }

  if (!userType) {
    /* Un texte légal consulté depuis l'écran d'inscription : il prend tout
       l'écran, avec son propre retour. On ne perd pas ce qui était déjà
       saisi, puisqu'AuthScreen reste monté derrière. */
    if (legalAvantConnexion) {
      return (
        <View style={s.app}>
          <StatusBar style="dark" />
          <BackBar
            title={TITRES_LEGAUX[legalAvantConnexion] || 'Informations légales'}
            onBack={() => setLegalAvantConnexion(null)}
          />
          <LegalScreen texte={legalAvantConnexion} />
        </View>
      );
    }

    return (
      <>
        <StatusBar style="light" />
        {typeChoisi ? (
          <AuthScreen
            userType={typeChoisi}
            onSignUp={handleSignUp}
            onSignIn={handleSignIn}
            onRetour={() => setTypeChoisi(null)}
            onLireLegal={setLegalAvantConnexion}
          />
        ) : (
          <OnboardingScreen onChoose={choisirType} />
        )}
        {/* La connexion est partie : on quitte l'écran d'accueil pour
            montrer ce qui arrive, plutôt qu'un rond par-dessus un
            formulaire qu'on ne peut plus utiliser. */}
        {loading && (
          <View style={s.chargementPleinEcran}>
            <SqueletteFil />
          </View>
        )}
      </>
    );
  }

  const showBack = screen === 'publication'
    || screen === 'profilPro' || screen === 'creer' || screen === 'sos'
    || screen === 'profilEdit' || screen === 'profilPublic'
    || screen === 'mesPublications' || screen === 'gererPortfolio'
    || screen === 'confidentialite' || screen === 'legal' || screen === 'admin'
    || (screen === 'messages' && activeConvId);

  const backTitle = screen === 'publication' ? 'Publication'
    : screen === 'profilPro'
    ? (pros[viewedProId] ? pros[viewedProId].entreprise : '')
    : screen === 'profilPublic' ? (profilPublic ? profilPublic.nom : 'Profil')
    : screen === 'sos' ? 'SOS — Urgence'
    : screen === 'profilEdit' ? 'Modifier mon profil'
    : screen === 'mesPublications' ? 'Mes publications'
    : screen === 'gererPortfolio' ? 'Organiser mes réalisations'
    : screen === 'confidentialite' ? 'Confidentialité et sécurité'
    : screen === 'admin' ? 'Administration'
    : screen === 'legal' ? (TITRES_LEGAUX[texteLegal] || 'Informations légales')
    : screen === 'creer' ? 'Publier'
    : activeConv && activeConv.contact ? activeConv.contact.titre : '';

  /* En mode "Vidéos", la diapositive occupe tout l'écran : on retire la barre
     du haut et la navigation du bas passe en flottant par-dessus. */
  const videoMode = screen === 'home' && feedMode === 'video' && !showBack;

  return (
    <View style={[s.app, videoMode && { backgroundColor: C.dark }]}>
      <StatusBar style={videoMode ? 'light' : 'dark'} />

      {!videoMode && (showBack ? (
        <BackBar
          title={backTitle}
          onBack={() => {
            /* On revient d'où l'on vient : la cloche. Repartir sur le
               fil ferait perdre la liste qu'on était en train de lire. */
            if (screen === 'publication') { setPostCible(null); setScreen('notifications'); }
            else if (screen === 'messages') setActiveConvId(null);
            else if (screen === 'legal') setScreen('confidentialite');
            else if (screen === 'profilEdit' || screen === 'mesPublications'
                     || screen === 'gererPortfolio' || screen === 'admin'
                     || screen === 'confidentialite') setScreen('profil');
            else setScreen('home');
          }}
        />
      ) : (
        <TopBrand
          unreadCount={unreadCount}
          onBell={() => setScreen('notifications')}
          /* La loupe n'apparaît QUE sur le fil : c'est le fil qu'elle
             filtre. Sur Découvrir, Messages ou Profil, elle ouvrirait une
             feuille qui ne changerait rien à ce qu'on regarde. */
          onLoupe={screen === 'home' ? () => setLoupeOuverte(true) : null}
          filtreActif={filtreActif(filtreFil)}
          resumeFiltre={resumeFiltre(filtreFil)}
        />
      ))}

      <View style={[s.body, videoMode && { backgroundColor: C.dark }]}>
        {/* Elle est DANS le corps et pas flottante : on ne doit ni pouvoir
            la rater, ni la confondre avec un message passager. */}
        <BandeDemo visible={api.mode === 'demo'} />
        <BandeHorsLigne
          raison={echecChargement}
          enCours={loading}
          onReessayer={() => start(userType)}
        />

        <ConfirmBanner
          msg={banner && banner.texte}
          erreur={!!(banner && banner.erreur)}
          onClose={() => setBanner(null)}
        />

        {/* UNE TRANSITION, ET POURQUOI ELLE EST SI COURTE.
            On passait d'un écran à l'autre par un remplacement sec : rien
            ne reliait les deux, et l'application paraissait assemblée de
            morceaux. Un fondu très bref avec une montée de quelques
            pixels suffit à les relier — au-delà, on ATTEND l'écran, ce qui
            est exactement le défaut qu'on voulait corriger.

            `key={screen}` est ce qui déclenche l'animation : React remonte
            le bloc à chaque changement, comme il le faisait déjà. On
            n'ajoute donc aucun montage, seulement l'animation de celui qui
            avait déjà lieu.

            Et elle se tait pendant le DÉMARRAGE : `theme.js` l'interdit
            depuis le lot 1 — on anime ce qui est prêt, pas ce qui
            attend. */}
        <Animated.View
          key={screen}
          style={{ flex: 1 }}
          entering={(sansMouvement || demarrage) ? undefined : FadeInDown.duration(M.bref)}
        >
        {screen === 'home' && (
          <HomeScreen
            /* LES VUES (section 35). On passe la fonction d'API telle
               quelle : le compte à rebours, le regroupement en paquets et
               l'envoi vivent dans `src/lib/compteur-vues.js`, pour qu'un
               défilement ne redessine jamais cet écran-ci. En mode
               démonstration `api.enregistrerVues` est un `noop` — il n'y a
               pas de base, et un compteur qui monterait sans rien
               enregistrer serait le mensonge que la bande noire sert à
               éviter. */
            onVues={api.enregistrerVues}
            /* LE DICTIONNAIRE DES CHANTIERS, pas la liste : la carte n'a
               besoin que du sien, et elle le trouve par son identifiant. */
            chantiers={chantiers} onOuvrirChantier={ouvrirChantier}
            posts={feedFiltered} pros={pros}
            feedMode={feedMode} setFeedMode={changerFeedMode}
            videoCible={videoCible} onOuvrirVideo={ouvrirVideoEnGrand}
            onVoirDepuisVideo={(proId) => viewProfile(proId, 'filVideo')}
            feedTab={feedTab} setFeedTab={changerFeedTab}
            resumeFiltre={resumeFiltre(filtreFil)}
            onEffacerFiltre={() => appliquerFiltre(FILTRE_VIDE)}
            onOuvrirFiltre={() => setLoupeOuverte(true)}
            followingIds={followingIds} savedIds={savedIds}
            openCommentsId={openCommentsId} openContactId={openContactId}
            /* LE commentaire qu'une notification désigne (section 37) :
               il se repère à un trait orange, parce qu'ouvrir le panneau
               et laisser chercher, c'est ce que faisait l'application
               avant — et le propriétaire l'a dit : « ça me ramène sur le
               fil », alors qu'il voulait arriver SUR le commentaire. */
            commentaireCible={commentaireCible}
            bottomInset={videoMode ? navHeight : 0}
            rappel={canPublish && pros[myProId] ? (
              <RappelVerification
                pro={pros[myProId]}
                statut={pros[myProId].verificationStatut}
                note={pros[myProId].verificationNote}
                onAction={() => setScreen('profilEdit')}
              />
            ) : null}
            onLike={toggleLike} onFollow={toggleFollow} onView={viewProfile} onHide={hidePost}
            onSignaler={ouvrirSignalement}
            onChargerPlus={chargerPlusDeFil}
            onSupprimerCommentaire={supprimerCommentaire}
            onModifierCommentaire={modifierCommentaire}
            moiId={api.getUserId()}
            chargePage={chargePage}
            finDuFil={finDuFil}
            rafraichit={rafraichit}
            onRafraichir={rafraichirFil}
            onToggleComments={toggleComments} onAddComment={addComment}
            onVoirCommentateur={voirCommentateur}
            onSave={toggleSave} onToggleContact={toggleContact}
            onContact={handleContact} onShare={showBanner}
            onComment={(post) => setCommentsPostId(post.id)}
          />
        )}

        {screen === 'publication' && (
          <PublicationScreen
            /* On la cherche dans `posts` et non dans `feedFiltered` : la
               loupe ne doit pas pouvoir cacher la publication qu'une
               notification désigne. On vient la lire, pas la filtrer. */
            post={posts.find((p) => String(p.id) === String(postCible)) || null}
            pros={pros}
            chantiers={chantiers}
            onOuvrirChantier={ouvrirChantier}
            commentaireCible={commentaireCible}
            followingIds={followingIds}
            savedIds={savedIds}
            openContactId={openContactId}
            moiId={api.getUserId()}
            onLike={toggleLike}
            onFollow={toggleFollow}
            onView={viewProfile}
            onHide={hidePost}
            onOuvrirVideo={ouvrirVideoEnGrand}
            onSignaler={ouvrirSignalement}
            onAddComment={addComment}
            onVoirCommentateur={voirCommentateur}
            onSupprimerCommentaire={supprimerCommentaire}
            onModifierCommentaire={modifierCommentaire}
            onSave={toggleSave}
            onToggleContact={toggleContact}
            onContact={handleContact}
            onShare={showBanner}
          />
        )}

        {screen === 'decouvrir' && (
          <View style={{ flex: 1 }}>
            <View style={s.subTabs}>
              <PillToggle
                small
                value={decouvrirTab}
                /* LA PASTILLE ET LE GLISSEMENT APPELLENT LA MÊME FONCTION.
                   C'est la règle des voyants du 04/10, appliquée d'avance :
                   deux chemins qui mènent au même écran doivent faire
                   exactement le même travail. Sinon, glisser jusqu'à « Pour
                   moi » n'aurait ni rechargé les demandes ni éteint le
                   point — et personne ne l'aurait remarqué, puisque
                   l'écran, lui, s'affiche. */
                onChange={changerOngletDecouvrir}
                /* « Place des pros » ne porte jamais de point : rien n'y
                   est adressé à quelqu'un en particulier. Un voyant sur une
                   place publique voudrait dire « il s'est passé quelque
                   chose », ce qui est vrai en permanence et ne se termine
                   jamais. */
                options={ongletsDecouvrir}
              />
            </View>

            {/* LES TROIS PAGES CÔTE À CÔTE, qu'on fait défiler au doigt —
                demandé par le propriétaire le 04/10/2026 : « c'est plus
                simple de scroller je trouve ».

                Chaque page est une FONCTION, pas un élément : elle n'est
                APPELÉE que lorsque la page a été visitée au moins une
                fois. Écrire les trois écrans directement les monterait
                tous les trois au premier affichage de « Découvrir » —
                trois listes, trois en-têtes, trois barres de recherche —
                et c'est exactement le défaut qui bloquait l'iPhone
                plusieurs secondes au démarrage le 29/09. */}
            <PagesGlissantes
              pages={ongletsDecouvrir.map((o) => ({
                key: o.key,
                rendu: () => {
                  if (o.key === 'pourmoi') {
                    return (
                      <DemandesRecuesScreen
                        demandes={demandesRecues}
                        /* La demande qu'une notification désigne — elle
                           décide aussi de la PASTILLE ouverte, puisque
                           « a accepté votre demande » vit dans « En
                           cours » et pas dans « À traiter » (section 37). */
                        demandeCible={demandeCible}
                        onCibleConsommee={() => setDemandeCible(null)}
                        chargement={demandesRecuesEtat === 'charge'}
                        /* L'échec était calculé et jamais transmis : l'écran
                           annonçait « aucune demande » quand il n'avait rien
                           pu lire. Corrigé le 04/10/2026. */
                        echec={demandesRecuesEtat === 'echec'}
                        onReessayer={() => chargerDemandesRecues()}
                        onRepondre={repondreDemandeRecue}
                        onAppeler={appeler}
                        onVoirProfil={viewProfile}
                      />
                    );
                  }
                  if (o.key === 'artisans') {
                    return canPublish ? (
                      <PlaceProScreen
                        onRafraichir={rafraichirEcran} rafraichit={rafraichit}
                        annonces={annonces}
                        /* L'annonce qu'une notification désigne, et le
                           moyen de rendre la cible une fois consommée
                           (section 37). */
                        annonceCible={annonceCible}
                        onCibleConsommee={() => setAnnonceCible(null)}
                        moi={pros[myProId] || null}
                        onPublier={publierAnnonce}
                        onRepondre={repondreAnnonce}
                        /* Écrire à quelqu'un qui a répondu : le même chemin
                           que « Contacter », donc la même conversation s'il
                           y en a déjà une. */
                        onEcrire={(pro) => handleContact({ id: pro.id }, 'message')}
                        onFermer={fermerAnnonce}
                        onVoirProfil={viewProfile}
                        onErreur={showErreur}
                        onSignaler={ouvrirSignalement}
                      />
                    ) : (
                      <DecouvrirScreen
                        pros={pros}
                        askAiMatch={askAiMatch}
                        onEffacerIa={() => { setAiMatches(null); setAiMatchError(null); }}
                        aiMatches={aiMatches}
                        aiMatchLoading={aiMatchLoading}
                        aiMatchError={aiMatchError}
                        onView={viewProfile} onContact={handleContact}
                      />
                    );
                  }
                  return (
                    <DemandesScreen
                      onRafraichir={rafraichirEcran} rafraichit={rafraichit}
                      userType={userType}
                      mesMetiers={metiersDe(pros[myProId])}
                      demandes={demandes}
                      filtreMetier={demandeFiltre}
                      setFiltreMetier={setDemandeFiltre}
                      onPublier={publierDemande}
                      onRepondre={repondreDemande}
                      moi={userType === 'pro' ? (pros[myProId] || null) : monProfil}
                      mesReponses={mesReponsesDemandes}
                      vuesLe={demandesVuesLe}
                      monId={api.getUserId()}
                      onChangerStatut={changerStatutDemande}
                      onErreur={showErreur}
                      onSignaler={ouvrirSignalement}
                    />
                  );
                },
              }))}
              index={indexDecouvrir}
              onIndex={changerOngletDecouvrir}
            />
          </View>
        )}

        {screen === 'creer' && (
          <CreerScreen
            moi={pros[myProId] || null}
            createType={createType} setCreateType={setCreateType}
            createConseil={createConseil} setCreateConseil={setCreateConseil}
            mesChantiers={mesChantiersEnCours}
            createChantier={createChantier} setCreateChantier={setCreateChantier}
            onNouveauChantier={() => setFeuilleChantier(true)}
            createDestination={createDestination} setCreateDestination={setCreateDestination}
            medias={medias} setMedias={setMedias}
            musique={musique} setMusique={setMusique}
            envoi={envoi} erreur={erreurPublication}
            onErreur={showErreur}
            createMetier={createMetier} setCreateMetier={setCreateMetier}
            createVille={createVille} setCreateVille={setCreateVille}
            onPublish={publish}
          />
        )}

        {screen === 'messages' && !activeConv && (
          <MessagesScreen
            conversations={conversationsAffichees}
            onOpen={ouvrirConversation}
            onRafraichir={rafraichirEcran}
            rafraichit={rafraichit}
          />
        )}

        {screen === 'messages' && activeConv && (
          <ConversationScreen
            conversation={{ ...activeConv, messages: activeConv.messages || [] }}
            chargement={!Array.isArray(activeConv.messages)}
            onSend={sendMessage}
            onRenvoyer={renvoyerMessage}
            onSignaler={ouvrirSignalement}
            onErreur={showErreur}
            amorce={amorceMessage}
            onAmorceUtilisee={() => setAmorceMessage('')}
            interlocuteur={activeConv.proId && pros[activeConv.proId]
              ? pros[activeConv.proId].entreprise
              : (activeConv.contact ? activeConv.contact.titre : null)}
          />
        )}

        {screen === 'mesPublications' && (
          <MesPublicationsScreen
            posts={mesPublications}
            onSupprimer={supprimerPublication}
            onModifier={modifierPublication}
            onRepublier={republierPublication}
            onPartager={partagerPublication}
            onOuvrir={(p) => {
              setFeedMode(FORMATS_VIDEO.has(p.format) ? 'video' : 'classic');
              setVideoCible(FORMATS_VIDEO.has(p.format) ? p.id : null);
              setOpenCommentsId(null);
              setScreen('home');
            }}
          />
        )}

        {screen === 'gererPortfolio' && (
          <GererPortfolioScreen
            portfolio={(pros[myProId] && pros[myProId].portfolio) || []}
            onEnregistrer={enregistrerPortfolio}
            onAnnuler={() => setScreen('profil')}
          />
        )}

        {screen === 'profilEdit' && (
          <ProfilEditScreen
            userType={userType}
            profil={userType === 'pro' ? (pros[myProId] || {}) : monProfil}
            /* L'adresse du COMPTE, pour la proposer d'un appui — elle n'est
               pas dans `pros[]`, qui est public. */
            emailCompte={monProfil.email || ''}
            sos={mesSos}
            onSave={enregistrerProfil}
            onEnvoyerDocuments={envoyerDocuments}
            onDemanderMetiers={demanderMetiers}
            demandeMetiers={demandeMetiers}
            onProposerSpecialite={proposerSpecialite}
            onErreur={showErreur}
          />
        )}

        {screen === 'sos' && (
          <SosScreen
            pros={pros}
            onEnvoyer={envoyerSos}
            onChercherArtisans={chercherArtisansUrgence}
          />
        )}

        {screen === 'notifications' && (
          <NotificationsScreen
            onRafraichir={rafraichirEcran} rafraichit={rafraichit}
            notifications={notifications}
            onOuvrir={ouvrirNotification}
            onToutLire={toutMarquerLu}
          />
        )}

        {screen === 'profil' && (
          <ProfilOwnScreen
            mesChantiers={mesChantiers} onOuvrirChantier={ouvrirChantier}
            userType={userType} pros={pros} myProId={myProId} monProfil={monProfil}
            followingIds={followingIds} savedIds={savedIds}
            demandesPartenariat={demandesPartenariat}
            partenariatsEnvoyes={partenariatsEnvoyes}
            onDemanderPartenariat={demanderPartenariat}
            onRepondrePartenariat={repondrePartenariat}
            onViewProfile={viewProfile}
            onEdit={() => setScreen('profilEdit')}
            onMesPublications={() => setScreen('mesPublications')}
            onGererPortfolio={() => setScreen('gererPortfolio')}
            nbPublications={mesPublications.length}
            onConfidentialite={() => setScreen('confidentialite')}
            admin={admin}
            onAdmin={() => setScreen('admin')}
            onLogout={deconnexion}
          />
        )}

        {screen === 'confidentialite' && (
          <ConfidentialiteScreen
            onCharger={async () => ({
              blocages: await api.chargerBlocages(),
              signalements: await api.mesSignalements(),
            })}
            /* À PART, exprès : voir le commentaire de l'écran. Le journal de
               l'agent ne doit pas pouvoir emporter l'export RGPD ni la
               suppression de compte en tombant. */
            onChargerActionsIA={api.mesActionsIA}
            onDebloquer={api.debloquer}
            onExporter={api.exporterMesDonnees}
            onSupprimer={supprimerMonCompte}
            onLire={(cle) => { setTexteLegal(cle); setScreen('legal'); }}
            onErreur={showErreur}
          />
        )}

        {screen === 'legal' && <LegalScreen texte={texteLegal} />}

        {screen === 'admin' && (
          <AdminScreen
            onRafraichirResume={chargerResumeAdmin}
            onErreur={showErreur}
          />
        )}

        {screen === 'chantier' && chantierOuvert && (
          <ChantierScreen
            chantier={chantierOuvert}
            publications={publicationsChantier}
            chargement={!chantierCharge}
            pro={pros[chantierOuvert.proId] || null}
            estLeMien={String(chantierOuvert.proId) === String(myProId)}
            onRetour={() => setScreen(
              String(chantierOuvert.proId) === String(myProId) ? 'profil' : 'profilPro')}
            onBasculerStatut={basculerStatutChantier}
            onEcrireRecit={ecrireRecitChantier}
            onEnregistrerRecit={enregistrerRecitChantier}
            onErreur={showErreur}
            /* Toucher une étape ouvre la publication dans le fil vidéo si
               c'en est une ; sinon on reste dans l'histoire. Un appui qui
               ne fait rien serait pire que pas d'appui du tout. */
            onOuvrirPublication={(p) => {
              if (!FORMATS_VIDEO.has(p.format)) return;
              setFeedMode('video');
              setVideoCible(p.id);
              setScreen('home');
            }}
          />
        )}

        {screen === 'profilPublic' && (
          <ProfilPublicScreen
            profil={profilPublic}
            chargement={profilPublicCharge && !profilPublic}
            onContacter={contacterParticulier}
          />
        )}

        {screen === 'profilPro' && viewedProId && pros[viewedProId] && (
          <ProfilProScreen
            pro={pros[viewedProId]} pros={pros}
            /* La fiche s'ouvre AVANT d'être complète : la version légère,
               celle des listes, n'a ni avis ni réalisations. Sans ce
               drapeau, l'écran affichait « Aucun avis — soyez le premier »
               sur un artisan qui en a trente. */
            charge={!!pros[viewedProId].portfolioCharge}
            /* Le geste inverse de celui qui a amené ici. `setFeedMode` est
               une ceinture : on n'arrive de 'filVideo' qu'en mode vidéo,
               mais si quelque chose l'avait changé entre-temps, revenir
               au fil CLASSIQUE serait la pire des réponses. */
            onRetourFilVideo={origineProfil === 'filVideo' ? () => {
              setFeedMode('video');
              setScreen('home');
              setOrigineProfil(null);
            } : null}
            chantiers={Object.values(chantiers)
              .filter((c) => String(c.proId) === String(viewedProId))}
            onOuvrirChantier={ouvrirChantier}
            following={followingIds.has(viewedProId)}
            onFollow={toggleFollow} onContact={handleContact}
            onViewProfile={viewProfile} onSubmitReview={submitReview}
            onSignaler={ouvrirSignalement}
          />
        )}
        </Animated.View>
      </View>

      <BottomNav
        screen={screen}
        dark={videoMode}
        canPublish={canPublish}
        avatarUrl={monAvatar}
        avatarSeed={myProId || 'moi'}
        /* Sans photo, la barre du bas montrait un rond beige vide. Deux
           lettres suffisent à ce qu'on s'y reconnaisse. */
        avatarNom={(myProId && pros[myProId] && pros[myProId].entreprise) || monProfil.nom}
        dots={{
          /* Le OU des deux voyants d'onglet, et rien d'autre : voir le
             bloc « LES DEUX VOYANTS DE DÉCOUVRIR ». */
          decouvrir: voyantDecouvrir,
          messages: messagesNonLus > 0,
        }}
        onLayout={(e) => setNavHeight(e.nativeEvent.layout.height)}
        onNavigate={(key) => {
          setScreen(key);
          setActiveConvId(null);
          /* Une seule fois par session : le droit d'administrer ne change
             pas pendant qu'on se promène dans l'application. */
          if (key === 'profil' && !adminDemande.current) {
            adminDemande.current = true;
            chargerResumeAdmin();
          }
        }}
      />

      {/* LA FEUILLE DE RECHERCHE DU FIL.
          Montée seulement quand elle est ouverte : `FeuilleBas` est un
          `Modal`, et un `Modal` fermé reste un nœud de plus dans l'arbre —
          avec, ici, un sélecteur de métiers de 92 lignes derrière lui. */}
      {loupeOuverte && (
        <FeuilleRecherche
          filtre={filtreFil}
          /* Mes coordonnées viennent de MA fiche pro quand j'en ai une,
             de mon compte sinon. Un particulier n'a pas de fiche, et c'est
             précisément lui qui cherche « autour de moi ». */
          moi={(userType === 'pro' && pros[myProId]) ? pros[myProId] : monProfil}
          onValider={appliquerFiltre}
          onFermer={() => setLoupeOuverte(false)}
        />
      )}

      {feuilleChantier && (
        <NouveauChantier
          villeParDefaut={createVille || (pros[myProId] ? pros[myProId].ville : '')}
          onFermer={() => setFeuilleChantier(false)}
          onCreer={creerChantier}
        />
      )}

      <Signaler
        ouvert={!!aSignaler}
        cibleType={aSignaler ? aSignaler.cibleType : 'publication'}
        cibleId={aSignaler ? aSignaler.cibleId : null}
        auteurId={aSignaler ? aSignaler.auteurId : null}
        auteurNom={aSignaler ? aSignaler.auteurNom : null}
        extrait={aSignaler ? aSignaler.extrait : null}
        onFermer={() => setASignaler(null)}
        onSignaler={api.signaler}
        onBloquer={bloquerPersonne}
      />

      <QuoteModal
        quote={quote}
        moi={userType === 'pro' && pros[myProId]
          ? { nom: pros[myProId].entreprise, ville: pros[myProId].ville, telephone: monProfil.telephone }
          : monProfil}
        onClose={() => setQuote({ open: false, pro: null, mode: 'devis' })}
        onSubmit={submitQuote}
      />

      <CommentsSheet
        visible={!!commentsPost}
        post={commentsPost}
        pros={pros}
        onClose={() => setCommentsPostId(null)}
        onAddComment={addComment}
        onVoirCommentateur={voirCommentateur}
        onSignaler={ouvrirSignalement}
        onSupprimerCommentaire={supprimerCommentaire}
        onModifierCommentaire={modifierCommentaire}
        moiId={api.getUserId()}
      />
    </View>
  );
}

const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg },
  demarrage: { flex: 1, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  subTabs: {
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  body: { flex: 1, backgroundColor: C.bg },
  chargementPleinEcran: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    zIndex: 30,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
});
