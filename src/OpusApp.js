/**
 * Racine de l'application : contient l'état et enchaîne les écrans,
 * exactement comme le composant OpusProject du prototype.
 *
 * Principe : l'écran met à jour l'état local tout de suite (l'app reste fluide),
 * puis on écrit dans Supabase en arrière-plan via src/lib/api.js.
 * Sans .env, l'écriture Supabase ne fait rien : l'app tourne en mode démo.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from './theme';
import { ConfirmBanner, PillToggle } from './components/ui';
import { TopBrand, BackBar } from './components/TopBar';
import BottomNav from './components/BottomNav';
import QuoteModal from './components/QuoteModal';
import CommentsSheet from './components/CommentsSheet';
import RappelVerification from './components/RappelVerification';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import DecouvrirScreen from './screens/DecouvrirScreen';
import PlaceProScreen from './screens/PlaceProScreen';
import CreerScreen from './screens/CreerScreen';
import MessagesScreen from './screens/MessagesScreen';
import ConversationScreen from './screens/ConversationScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SqueletteFil from './components/Squelette';
import ProfilOwnScreen from './screens/ProfilOwnScreen';
import ProfilProScreen from './screens/ProfilProScreen';
import ProfilPublicScreen from './screens/ProfilPublicScreen';
import ConfidentialiteScreen from './screens/ConfidentialiteScreen';
import LegalScreen, { TITRES_LEGAUX } from './screens/LegalScreen';
import Signaler from './components/Signaler';
import ProfilEditScreen from './screens/ProfilEditScreen';
import MesPublicationsScreen from './screens/MesPublicationsScreen';
import GererPortfolioScreen from './screens/GererPortfolioScreen';
import SosScreen from './screens/SosScreen';
import DemandesScreen from './screens/DemandesScreen';
import { POST_GRADIENTS, avgReviews } from './data/demo';
import { METIER_PAR_DEFAUT, nomMetier } from './lib/metiers';
import * as api from './lib/api';
import * as retour from './lib/retour';
import { metiersDe } from './lib/metiers';
import { hasSupabase } from './lib/supabase';
import { artisansDisponibles as artisansDisponiblesDemo } from './data/urgences';
import { envoyerFichier, estFichierLocal } from './lib/storage';
import {
  aCloudinary, urlMontage, envoyerVideo as envoyerVideoCloudinary,
} from './lib/cloudinary';
import { aiMatchPros } from './lib/ai';
import { partagerPost } from './lib/partage';
import { FORMATS_VISUELS, FORMATS_VIDEO } from './screens/CreerScreen';

/** Ce qu'on annonce à l'artisan, selon l'endroit où sa publication est partie. */
const MESSAGE_PUBLICATION = {
  fil: 'Votre publication est en ligne.',
  portfolio: 'Ajouté à votre portfolio.',
  deux: 'En ligne, et ajouté à votre portfolio.',
};

export default function OpusApp() {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demarrage, setDemarrage] = useState(true);   // reprise de session
  const [typeChoisi, setTypeChoisi] = useState(null); // type retenu avant connexion
  const [screen, setScreen] = useState('home');
  const [feedMode, setFeedMode] = useState('classic');
  // Vidéo sur laquelle ouvrir le plein écran, quand on y arrive depuis le fil.
  const [videoCible, setVideoCible] = useState(null);
  const [feedTab, setFeedTab] = useState('pourvous');

  const [pros, setPros] = useState({});
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [openContactId, setOpenContactId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [msgDraft, setMsgDraft] = useState('');

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
  const [demandesVues, setDemandesVues] = useState(false);

  /* Compte : profil du particulier, et disponibilité SOS du professionnel. */
  const [monProfil, setMonProfil] = useState({
    nom: 'Vous', ville: '', telephone: '', avatarUrl: null, bannerUrl: null,
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
  const [createText, setCreateText] = useState('');
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
    setBanner({ texte: msg, erreur });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), erreur ? 9000 : 3000);
  };
  const showErreur = (msg) => showBanner(msg, true);

  useEffect(() => () => { if (bannerTimer.current) clearTimeout(bannerTimer.current); }, []);

  /* ---------- chargement (démo ou Supabase) ---------- */
  const start = useCallback(async (type) => {
    setLoading(true);
    try {
      await api.ensureSession(type);
      const data = await api.loadAll();
      setPros(data.pros);
      setPosts(data.posts);
      setFinDuFil(!!data.finDuFil);
      setConversations(data.conversations);
      setDemandes(data.demandes || []);
      setMesSos(data.mesSos || null);
      setNotifications(data.notifications);
      setFollowingIds(new Set(data.followingIds));
      setSavedIds(new Set(data.savedIds));
      setDemandesPartenariat(data.demandesPartenariat || []);
      setPartenariatsEnvoyes(data.partenariatsEnvoyes || []);
      /* Une demande de modification des métiers déjà déposée doit réapparaître
         à la reconnexion, sinon l'artisan la redépose et la base la refuse. */
      if (type === 'pro') {
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
      setUserType(type);
      setScreen('home');
    } catch (e) {
      showErreur(`Chargement impossible : ${e.message || e}`);
    }
    setLoading(false);
  }, []);

  /* Une session déjà ouverte sur ce téléphone évite de redemander le mot de passe. */
  useEffect(() => {
    let vivant = true;
    (async () => {
      try {
        const session = await api.restoreSession();
        if (session && vivant) await start(session.userType);
      } catch (e) {
        // pas de session valide : on affichera l'écran d'accueil
      }
      if (vivant) setDemarrage(false);
    })();
    return () => { vivant = false; };
  }, [start]);

  /* ---------- création de compte et connexion ---------- */
  const choisirType = (type) => {
    // En mode démo, il n'y a pas de compte : on entre directement.
    if (!hasSupabase) { start(type); return; }
    setTypeChoisi(type);
  };

  const handleSignUp = async ({
    email, motDePasse, nom, entreprise, metier, metiers, ville, cguVersion,
  }) => {
    const { session } = await api.signUp({
      email, password: motDePasse, userType: typeChoisi, nom,
    });
    if (!session) return { confirmationRequise: true };

    if (typeChoisi === 'pro') {
      await api.ensureProProfile({ entreprise, metier, metiers, ville, nom });
    }
    /* La trace de l'acceptation, avec sa VERSION. Si elle échoue, le compte
       existe quand même : refuser l'inscription entière pour ça serait pire.
       On le consigne dans les journaux plutôt que de bloquer quelqu'un. */
    if (cguVersion) {
      try { await api.accepterConditions(cguVersion); } catch (e) {
        console.warn('Acceptation des conditions non enregistrée :', e);
      }
    }
    await start(typeChoisi);
    return {};
  };

  const handleSignIn = async ({ email, motDePasse }) => {
    const { userType: type } = await api.signIn({ email, password: motDePasse });
    await start(type || typeChoisi);
  };

  /** Mon compte professionnel : le mien s'il existe, sinon le premier de la liste. */
  const myProId = pros[api.getUserId()] ? api.getUserId() : Object.keys(pros)[0];

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

  /* Bascule manuelle Fil / Vidéos : on oublie la vidéo visée, sinon le fil
     rouvrirait toujours au même endroit. */
  const changerFeedMode = (mode) => {
    setVideoCible(null);
    setFeedMode(mode);
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
      const { posts: suite, fin } = await api.chargerPageFil({ curseur: dernier.curseur });
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
      const { posts: page, fin } = await api.chargerPageFil({});
      setPosts(page);
      setFinDuFil(fin);
    } catch (e) {
      showErreur('Le fil n’a pas pu être rafraîchi.');
    }
    setRafraichit(false);
  };

  /**
   * Ouvrir les commentaires d'une publication — et aller les chercher si
   * c'est la première fois. Depuis que le fil se charge par pages, ils ne
   * sont plus téléchargés d'avance.
   */
  const toggleComments = async (id) => {
    const ouvre = openCommentsId !== id;
    setOpenCommentsId(ouvre ? id : null);
    if (!ouvre) return;

    const post = posts.find((p) => p.id === id);
    if (!post || Array.isArray(post.comments)) return;

    try {
      const liste = await api.chargerCommentaires(id);
      setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, comments: liste } : p)));
    } catch (e) {
      showErreur('Les commentaires n’ont pas pu être chargés.');
      setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, comments: [] } : p)));
    }
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
  const viewProfile = async (proId) => {
    setViewedProId(proId);
    setScreen('profilPro');
    setOpenContactId(null);

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
  const handleContact = async (pro, mode) => {
    setOpenContactId(null);
    if (mode !== 'message') { setQuote({ open: true, pro, mode }); return; }

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
        setMsgDraft(presentation
          ? `Bonjour, je suis ${presentation.replace(/\.+$/, '')}. `
          : 'Bonjour, ');
      }
    }
    await ouvrirConversation(conv.id);
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
      showBanner(mode === 'devis'
        ? `Demande de devis envoyée à ${pro.entreprise}.`
        : `Demande de rappel envoyée à ${pro.entreprise}.`);
    } catch (e) {
      showErreur(`Envoi impossible : ${e.message || e}`);
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

  const sendMessage = () => {
    if (!msgDraft.trim() || activeConvId == null) return;
    const texte = msgDraft.trim();
    setConversations((cs) => cs.map((c) => (c.id === activeConvId
      ? {
        ...c,
        messages: [...(Array.isArray(c.messages) ? c.messages : []),
          { from: 'moi', texte, heure: "à l'instant" }],
        dernier: { texte, heure: "à l'instant", de: api.getUserId() },
      }
      : c)));
    setMsgDraft('');
    api.sendMessage(activeConvId, texte).catch(() => showBanner("Message non envoyé."));
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
      },
    });

    return fermer;
  }, [userType, activeConvId]);

  /* ---------- création ---------- */
  const publish = async () => {
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

    if (versLeFil && !createText.trim()) {
      showBanner('Ajoute une description avant de publier.');
      return;
    }
    if (aUnVisuel && medias.length === 0) {
      showBanner('Choisis une photo ou une vidéo avant de publier.');
      return;
    }
    if (createType === 'avantapres' && medias.length < 2) {
      showBanner("Un avant/après demande deux photos : l'avant, puis l'après.");
      return;
    }

    const texte = createText.trim();
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
      const couverture = envoyes[0] || POST_GRADIENTS[0];

      /* Le montage assemblé : une seule adresse, que Cloudinary fabriquera au
         premier visionnage puis gardera en cache. Un montage d'un seul clip
         n'a rien à assembler. */
      if (createType === 'montage' && identifiants.length > 1) {
        montageUrl = urlMontage(identifiants, { musique: identifiantMusique });
      }

      if (versLeFil) {
        const row = await api.createPost({
          type: createType, texte, media: couverture, medias: envoyes,
          musique: urlMusique, montageUrl, metier: createMetier, ville: createVille,
        });
        if (row) id = row.id;
      }
      if (versLePortfolio) {
        for (const url of envoyes) await api.ajouterAuPortfolio(url);
      }
    } catch (e) {
      setEnvoi(null);
      setErreurPublication(e.message || String(e));
      showBanner('Publication non enregistrée.');
      return;
    }
    setEnvoi(null);

    const couverture = envoyes[0] || POST_GRADIENTS[0];
    if (versLeFil) {
      setPosts((ps) => [{
        id, type: 'post', format: createType, proId: myProId, time: "À l'instant",
        texte, media: couverture, medias: envoyes, musique: urlMusique, montageUrl,
        likes: 0, liked: false, comments: [],
      }, ...ps]);
    }
    if (versLePortfolio && myProId) {
      setPros((ps) => (ps[myProId]
        ? { ...ps, [myProId]: { ...ps[myProId], portfolio: [...ps[myProId].portfolio, ...envoyes] } }
        : ps));
    }

    setCreateText(''); setCreateVille(''); setMedias([]); setMusique(null);
    // Le fil des vidéos ne montre que des vidéos : on y renvoie l'artisan
    // quand c'est là que sa publication vient d'atterrir.
    if (versLeFil) setFeedMode(FORMATS_VIDEO.has(createType) ? 'video' : 'classic');
    setScreen(versLeFil ? 'home' : 'profil');
    showBanner(MESSAGE_PUBLICATION[destination]);
  };

  /* ---------- avis ---------- */
  const submitReview = async (proId, { delais, qualite, tarif, commentaire }) => {
    let verifie = true;   // en démo, l'avis est considéré comme vérifié
    let id = `local-${Date.now()}`;
    try {
      const row = await api.createReview({ proId, delais, qualite, tarif, commentaire });
      if (row) { id = row.id; verifie = !!row.client_verifie; }
    } catch (e) {
      showBanner(`Avis non enregistré : ${e.message || e}`);
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
      showErreur(`Demande impossible : ${e.message || e}`);
      return;
    }
    setPartenariatsEnvoyes((l) => [...new Set([...l, otherId])]);
    showBanner('Demande envoyée. Le partenariat apparaîtra une fois acceptée.');
  };

  const repondrePartenariat = async (demandeurId, accepte) => {
    try {
      await api.repondrePartenariat(demandeurId, accepte);
    } catch (e) {
      showErreur(`Réponse impossible : ${e.message || e}`);
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
      showErreur(`Correction impossible : ${e.message || e}`);
    }
  };

  const supprimerPublication = async (post) => {
    setPosts((ps) => ps.filter((p) => p.id !== post.id));
    try {
      await api.supprimerPost(post.id);
      showBanner('Publication supprimée.');
    } catch (e) {
      showErreur(`Suppression impossible : ${e.message || e}`);
      await start(userType);          // on remet la liste d'aplomb
    }
  };

  /* Remonter une publication, sans la recopier : une copie perdrait ses
     j'aime et ses commentaires, et laisserait deux fois la même chose. */
  const republierPublication = async (post) => {
    try {
      await api.republierPost(post.id);
    } catch (e) {
      showBanner(`Impossible de remettre en avant : ${e.message || e}`);
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
      showErreur(`Partage impossible : ${e.message || e}`);
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
      showErreur(`Enregistrement impossible : ${e.message || e}`);
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
  const ouvrirNotification = (n) => {
    readNotification(n.id);
    if (!n.postId) return;
    if (!posts.some((p) => p.id === n.postId)) {
      showBanner("Cette publication n'est plus disponible.");
      return;
    }
    setFeedMode('classic');
    setFeedTab('pourvous');
    setHiddenIds((h) => { const c = new Set(h); c.delete(n.postId); return c; });
    setOpenCommentsId(n.postId);
    setScreen('home');
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
      showErreur(`Les notifications n'ont pas pu être marquées lues : ${e.message || e}`);
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
        : `Demande impossible : ${e.message || e}`);
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
        showErreur(`Envoi de la photo de profil impossible : ${e.message || e}`);
        return;
      }
    }

    if (estFichierLocal(profil.bannerUrl)) {
      try {
        bannerUrl = await envoyerFichier({
          uri: profil.bannerUrl, bucket: 'bannieres', nom: 'banniere', userId: uid,
        });
      } catch (e) {
        showErreur(`Envoi de la bannière impossible : ${e.message || e}`);
        return;
      }
    }

    complet = { ...profil, avatarUrl, bannerUrl };

    try {
      await api.updateProfile({ userType, profil: complet });
    } catch (e) {
      showErreur(`Enregistrement de la fiche impossible : ${e.message || e}`);
      return;
    }

    if (sos) {
      try {
        await api.updateSosAvailability(sos);
      } catch (e) {
        showErreur(`Disponibilité aux urgences non enregistrée : ${e.message || e}`);
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
      showErreur(`Envoi impossible : ${e.message || e}`);
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
    setDemandesVues(false);
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
      showErreur(`Publication impossible : ${e.message || e}`);
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

  /* ---------- la Place des pros ---------- */
  const publierAnnonce = async (annonce) => {
    let id = `local-${Date.now()}`;
    try {
      const ligne = await api.publierAnnonce(annonce);
      if (ligne) id = ligne.id;
    } catch (e) {
      showErreur(`Publication impossible : ${e.message || e}`);
      return;
    }
    const moi = pros[myProId] || {};
    setAnnonces((as) => [{
      ...annonce,
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
  const repondreAnnonce = async (annonce) => {
    if (!annonce.auteur) return;
    try {
      await api.repondreAnnonce(annonce.id, null);
    } catch (e) {
      showErreur(`Réponse impossible : ${e.message || e}`);
      return;
    }
    setAnnonces((as) => as.map((a) => (
      a.id === annonce.id ? { ...a, jyAiRepondu: true, reponses: a.reponses + 1 } : a
    )));

    /* La conversation entre professionnels existe déjà : on réutilise le même
       chemin que « Contacter », avec une amorce qui rappelle l'annonce —
       un artisan qui reçoit « Bonjour » tout court doit redemander de quoi
       il s'agit. */
    setMsgDraft(`Bonjour, au sujet de votre annonce « ${annonce.titre} ». `);
    handleContact({ id: annonce.auteur.id }, 'message');
  };

  const fermerAnnonce = async (annonce) => {
    try {
      await api.fermerAnnonce(annonce.id);
    } catch (e) {
      showErreur(`Retrait impossible : ${e.message || e}`);
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
      await api.createSosRequest(demande);
    } catch (e) {
      showErreur(`Envoi impossible : ${e.message || e}`);
      return;
    }
    setScreen('home');
    setNotifications((ns) => [{
      id: `sos-${Date.now()}`,
      texte: `${pro ? pro.entreprise : "L'artisan"} a été prévenu : ${demande.probleme} · ${demande.adresse || 'adresse à préciser'}`,
      lue: false,
    }, ...ns]);
    showBanner(
      pro
        ? `${pro.entreprise} est prévenu. Estimation ${demande.prixMin}–${demande.prixMax} €.`
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
  const feedAbonnements = feedTab === 'abonnements'
    ? visiblePosts.filter((p) => p.type === 'ad' || followingIds.has(p.proId))
    : visiblePosts;
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
  const feedFiltered = feedMode === 'video'
    ? feedAbonnements.filter((p) => p.type === 'post' && FORMATS_VIDEO.has(p.format))
    : feedAbonnements;

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

  const showBack = screen === 'profilPro' || screen === 'creer' || screen === 'sos'
    || screen === 'profilEdit' || screen === 'profilPublic'
    || screen === 'mesPublications' || screen === 'gererPortfolio'
    || screen === 'confidentialite' || screen === 'legal'
    || (screen === 'messages' && activeConvId);

  const backTitle = screen === 'profilPro'
    ? (pros[viewedProId] ? pros[viewedProId].entreprise : '')
    : screen === 'profilPublic' ? (profilPublic ? profilPublic.nom : 'Profil')
    : screen === 'sos' ? 'SOS — Urgence'
    : screen === 'profilEdit' ? 'Modifier mon profil'
    : screen === 'mesPublications' ? 'Mes publications'
    : screen === 'gererPortfolio' ? 'Organiser mes réalisations'
    : screen === 'confidentialite' ? 'Confidentialité et sécurité'
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
            if (screen === 'messages') setActiveConvId(null);
            else if (screen === 'legal') setScreen('confidentialite');
            else if (screen === 'profilEdit' || screen === 'mesPublications'
                     || screen === 'gererPortfolio'
                     || screen === 'confidentialite') setScreen('profil');
            else setScreen('home');
          }}
        />
      ) : (
        <TopBrand unreadCount={unreadCount} onBell={() => setScreen('notifications')} />
      ))}

      <View style={[s.body, videoMode && { backgroundColor: C.dark }]}>
        <ConfirmBanner
          msg={banner && banner.texte}
          erreur={!!(banner && banner.erreur)}
          onClose={() => setBanner(null)}
        />

        {screen === 'home' && (
          <HomeScreen
            posts={feedFiltered} pros={pros}
            feedMode={feedMode} setFeedMode={changerFeedMode}
            videoCible={videoCible} onOuvrirVideo={ouvrirVideoEnGrand}
            onGlisserVersProfil={(pro) => viewProfile(pro.id)}
            feedTab={feedTab} setFeedTab={setFeedTab}
            followingIds={followingIds} savedIds={savedIds}
            openCommentsId={openCommentsId} openContactId={openContactId}
            bottomInset={videoMode ? navHeight : 0}
            rappel={canPublish && pros[myProId] ? (
              <RappelVerification
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

        {screen === 'decouvrir' && (
          <View style={{ flex: 1 }}>
            <View style={s.subTabs}>
              <PillToggle
                small
                value={decouvrirTab}
                onChange={(k) => {
                  setDecouvrirTab(k);
                  if (k === 'demandes') setDemandesVues(true);
                }}
                /* Un artisan n'a pas besoin qu'on lui trouve un artisan :
                   il en est un. Le premier onglet devient sa place de
                   marché entre pros. */
                options={[
                  userType === 'pro'
                    ? { key: 'artisans', label: 'Place des pros' }
                    : { key: 'artisans', label: 'Artisans' },
                  { key: 'demandes', label: 'Demandes' },
                ]}
              />
            </View>

            {decouvrirTab === 'artisans' ? (userType === 'pro' ? (
              <PlaceProScreen
                annonces={annonces}
                moi={pros[myProId] || null}
                onPublier={publierAnnonce}
                onRepondre={repondreAnnonce}
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
                aiMatches={aiMatches} aiMatchLoading={aiMatchLoading} aiMatchError={aiMatchError}
                onView={viewProfile} onContact={handleContact}
              />
            )) : (
              <DemandesScreen
                userType={userType}
                mesMetiers={metiersDe(pros[myProId])}
                demandes={demandes}
                filtreMetier={demandeFiltre}
                setFiltreMetier={setDemandeFiltre}
                onPublier={publierDemande}
                onRepondre={repondreDemande}
                moi={userType === 'pro' ? (pros[myProId] || null) : monProfil}
                mesReponses={mesReponsesDemandes}
                onErreur={showErreur}
                onSignaler={ouvrirSignalement}
              />
            )}
          </View>
        )}

        {screen === 'creer' && (
          <CreerScreen
            moi={pros[myProId] || null}
            createType={createType} setCreateType={setCreateType}
            createDestination={createDestination} setCreateDestination={setCreateDestination}
            medias={medias} setMedias={setMedias}
            musique={musique} setMusique={setMusique}
            envoi={envoi} erreur={erreurPublication}
            onErreur={showErreur}
            createText={createText} setCreateText={setCreateText}
            createMetier={createMetier} setCreateMetier={setCreateMetier}
            createVille={createVille} setCreateVille={setCreateVille}
            onPublish={publish}
          />
        )}

        {screen === 'messages' && !activeConv && (
          <MessagesScreen conversations={conversationsAffichees} onOpen={ouvrirConversation} />
        )}

        {screen === 'messages' && activeConv && (
          <ConversationScreen
            conversation={{ ...activeConv, messages: activeConv.messages || [] }}
            chargement={!Array.isArray(activeConv.messages)}
            draft={msgDraft} setDraft={setMsgDraft} onSend={sendMessage}
            onSignaler={ouvrirSignalement}
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
            notifications={notifications}
            onOuvrir={ouvrirNotification}
            onToutLire={toutMarquerLu}
          />
        )}

        {screen === 'profil' && (
          <ProfilOwnScreen
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
            onLogout={deconnexion}
          />
        )}

        {screen === 'confidentialite' && (
          <ConfidentialiteScreen
            onCharger={async () => ({
              blocages: await api.chargerBlocages(),
              signalements: await api.mesSignalements(),
            })}
            onDebloquer={api.debloquer}
            onExporter={api.exporterMesDonnees}
            onSupprimer={supprimerMonCompte}
            onLire={(cle) => { setTexteLegal(cle); setScreen('legal'); }}
            onErreur={showErreur}
          />
        )}

        {screen === 'legal' && <LegalScreen texte={texteLegal} />}

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
            following={followingIds.has(viewedProId)}
            onFollow={toggleFollow} onContact={handleContact}
            onViewProfile={viewProfile} onSubmitReview={submitReview}
            onSignaler={ouvrirSignalement}
          />
        )}
      </View>

      <BottomNav
        screen={screen}
        dark={videoMode}
        canPublish={canPublish}
        avatarUrl={monAvatar}
        avatarSeed={myProId || 'moi'}
        dots={{
          decouvrir: canPublish && !demandesVues && demandes.length > 0,
          messages: messagesNonLus > 0,
        }}
        onLayout={(e) => setNavHeight(e.nativeEvent.layout.height)}
        onNavigate={(key) => { setScreen(key); setActiveConvId(null); }}
      />

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
