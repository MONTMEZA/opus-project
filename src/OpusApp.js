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
import ProfilOwnScreen from './screens/ProfilOwnScreen';
import ProfilProScreen from './screens/ProfilProScreen';
import ProfilPublicScreen from './screens/ProfilPublicScreen';
import ProfilEditScreen from './screens/ProfilEditScreen';
import MesPublicationsScreen from './screens/MesPublicationsScreen';
import GererPortfolioScreen from './screens/GererPortfolioScreen';
import SosScreen from './screens/SosScreen';
import DemandesScreen from './screens/DemandesScreen';
import { METIERS, POST_GRADIENTS, avgReviews } from './data/demo';
import * as api from './lib/api';
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

  const [aiQuery, setAiQuery] = useState('');
  const [aiMatches, setAiMatches] = useState(null);
  const [aiMatchLoading, setAiMatchLoading] = useState(false);
  const [aiMatchError, setAiMatchError] = useState(null);

  const [search, setSearch] = useState('');
  const [filterMetier, setFilterMetier] = useState(null);

  const [createType, setCreateType] = useState('photo');
  // Où va la publication : le fil, le portfolio, ou les deux.
  const [createDestination, setCreateDestination] = useState('deux');
  // Fichiers choisis pour la publication en cours, et sa bande-son.
  const [medias, setMedias] = useState([]);
  const [musique, setMusique] = useState(null);
  // Progression de l'envoi : { index, total, part } ou null.
  const [envoi, setEnvoi] = useState(null);
  // Dernier refus, affiché sur l'écran Publier jusqu'au prochain essai.
  const [erreurPublication, setErreurPublication] = useState(null);
  const [createText, setCreateText] = useState('');
  const [createMetier, setCreateMetier] = useState(METIERS[0]);
  const [createVille, setCreateVille] = useState('');

  const showBanner = (msg) => {
    setBanner(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 3000);
  };

  useEffect(() => () => { if (bannerTimer.current) clearTimeout(bannerTimer.current); }, []);

  /* ---------- chargement (démo ou Supabase) ---------- */
  const start = useCallback(async (type) => {
    setLoading(true);
    try {
      await api.ensureSession(type);
      const data = await api.loadAll();
      setPros(data.pros);
      setPosts(data.posts);
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
      showBanner(`Chargement impossible : ${e.message || e}`);
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

  const handleSignUp = async ({ email, motDePasse, nom, entreprise, metier, metiers, ville }) => {
    const { session } = await api.signUp({
      email, password: motDePasse, userType: typeChoisi, nom,
    });
    if (!session) return { confirmationRequise: true };

    if (typeChoisi === 'pro') {
      await api.ensureProProfile({ entreprise, metier, metiers, ville, nom });
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
    api.setLike(id, liked).catch(() => showBanner("Le j'aime n'a pas pu être enregistré."));
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
  const toggleComments = (id) => setOpenCommentsId((c) => (c === id ? null : id));
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
      if (!parentId) return { ...p, comments: [...p.comments, nouveau] };
      return {
        ...p,
        comments: p.comments.map((c) => (c.id === parentId
          ? { ...c, reponses: [...(c.reponses || []), nouveau] }
          : c)),
      };
    }));

    api.addComment(postId, texte, parentId)
      .catch(() => showBanner("Le commentaire n'a pas pu être envoyé."));
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
      showBanner("Ce profil n'a pas pu être chargé.");
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

  const viewProfile = (proId) => {
    setViewedProId(proId);
    setScreen('profilPro');
    setOpenContactId(null);
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
        showBanner("La conversation n'a pas pu être créée.");
      }
      conv = { id, proId: pro.id, messages: [] };
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
    setActiveConvId(conv.id);
    setScreen('messages');
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
      showBanner(`Envoi impossible : ${e.message || e}`);
    }
  };

  /* ---------- messagerie ---------- */
  const sendMessage = () => {
    if (!msgDraft.trim() || activeConvId == null) return;
    const texte = msgDraft.trim();
    setConversations((cs) => cs.map((c) => (c.id === activeConvId
      ? { ...c, messages: [...c.messages, { from: 'moi', texte, heure: "à l'instant" }] }
      : c)));
    setMsgDraft('');
    api.sendMessage(activeConvId, texte).catch(() => showBanner("Message non envoyé."));
  };

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
      showBanner(`Demande impossible : ${e.message || e}`);
      return;
    }
    setPartenariatsEnvoyes((l) => [...new Set([...l, otherId])]);
    showBanner('Demande envoyée. Le partenariat apparaîtra une fois acceptée.');
  };

  const repondrePartenariat = async (demandeurId, accepte) => {
    try {
      await api.repondrePartenariat(demandeurId, accepte);
    } catch (e) {
      showBanner(`Réponse impossible : ${e.message || e}`);
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

  const supprimerPublication = async (post) => {
    setPosts((ps) => ps.filter((p) => p.id !== post.id));
    try {
      await api.supprimerPost(post.id);
      showBanner('Publication supprimée.');
    } catch (e) {
      showBanner(`Suppression impossible : ${e.message || e}`);
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
      showBanner(`Partage impossible : ${e.message || e}`);
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
      showBanner(`Enregistrement impossible : ${e.message || e}`);
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
      showBanner(dejaUne
        ? 'Vous avez déjà une demande en cours d\'examen.'
        : `Demande impossible : ${e.message || e}`);
    }
  };

  const enregistrerProfil = async ({ profil, sos }) => {
    let complet = profil;
    try {
      // Les images choisies sur le téléphone sont d'abord envoyées vers
      // Supabase Storage ; sans ça, elles ne seraient visibles que par vous.
      const uid = api.getUserId();
      const avatarUrl = estFichierLocal(profil.avatarUrl)
        ? await envoyerFichier({ uri: profil.avatarUrl, bucket: 'avatars', nom: 'avatar', userId: uid })
        : profil.avatarUrl;
      const bannerUrl = estFichierLocal(profil.bannerUrl)
        ? await envoyerFichier({ uri: profil.bannerUrl, bucket: 'bannieres', nom: 'banniere', userId: uid })
        : profil.bannerUrl;
      complet = { ...profil, avatarUrl, bannerUrl };

      await api.updateProfile({ userType, profil: complet });
      if (sos) await api.updateSosAvailability(sos);
    } catch (e) {
      showBanner(`Enregistrement impossible : ${e.message || e}`);
      return;
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
  const envoyerDocuments = async ({ kbis, assurance }) => {
    try {
      const uid = api.getUserId();
      const kbisPath = kbis
        ? await envoyerFichier({ uri: kbis.uri, bucket: 'documents', nom: 'kbis', userId: uid })
        : null;
      const assurancePath = assurance
        ? await envoyerFichier({ uri: assurance.uri, bucket: 'documents', nom: 'assurance', userId: uid })
        : null;

      await api.submitDocuments({ kbisPath, assurancePath });

      setPros((prev) => (prev[myProId]
        ? {
            ...prev,
            [myProId]: {
              ...prev[myProId],
              kbisPath: kbisPath || prev[myProId].kbisPath,
              assurancePath: assurancePath || prev[myProId].assurancePath,
              verificationStatut: 'en_attente',
            },
          }
        : prev));

      setScreen('profil');
      showBanner('Documents envoyés. Votre profil passe en vérification.');
    } catch (e) {
      showBanner(`Envoi impossible : ${e.message || e}`);
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
      showBanner(`Publication impossible : ${e.message || e}`);
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
        showBanner("La conversation n'a pas pu être ouverte.");
        return;
      }
      conv = {
        id,
        proId: null,
        contact: {
          id: contactId,
          titre: demande.auteur,
          metier: `Demande · ${demande.metier}`,
          avatarUrl: null,
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

    setActiveConvId(conv.id);
    setScreen('messages');
  };

  /* ---------- la Place des pros ---------- */
  const publierAnnonce = async (annonce) => {
    let id = `local-${Date.now()}`;
    try {
      const ligne = await api.publierAnnonce(annonce);
      if (ligne) id = ligne.id;
    } catch (e) {
      showBanner(`Publication impossible : ${e.message || e}`);
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
      showBanner(`Réponse impossible : ${e.message || e}`);
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
      showBanner(`Retrait impossible : ${e.message || e}`);
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
        showBanner("La conversation n'a pas pu être ouverte.");
        return;
      }
      conv = {
        id,
        proId: null,
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

    setActiveConvId(conv.id);
    setScreen('messages');
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
      showBanner(`Envoi impossible : ${e.message || e}`);
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
  const askAiMatch = async () => {
    if (!aiQuery.trim()) return;
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
      const recs = await aiMatchPros(aiQuery.trim(), liste);
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
    if (conv.proId && pros[conv.proId]) {
      const p = pros[conv.proId];
      return {
        id: p.id, titre: p.entreprise, metier: p.metier,
        avatarUrl: p.avatarUrl, verifie: p.verifie,
      };
    }
    return conv.contact || { id: conv.id, titre: 'Contact' };
  };

  const conversationsAffichees = conversations.map((c) => ({ ...c, contact: contactDe(c) }));
  const activeConv = conversationsAffichees.find((c) => c.id === activeConvId);
  const unreadCount = notifications.filter((n) => !n.lue).length;

  /** Le fil d'actualité est réservé aux professionnels. */
  const canPublish = userType === 'pro';
  /** Le post dont on regarde les commentaires dans le fil vidéo. */
  const commentsPost = commentsPostId != null
    ? posts.find((p) => p.id === commentsPostId)
    : null;

  /* ---------- rendu ---------- */

  // Reprise d'une session existante : on évite de faire clignoter l'accueil.
  if (demarrage) {
    return (
      <View style={s.demarrage}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (!userType) {
    return (
      <>
        <StatusBar style="light" />
        {typeChoisi ? (
          <AuthScreen
            userType={typeChoisi}
            onSignUp={handleSignUp}
            onSignIn={handleSignIn}
            onRetour={() => setTypeChoisi(null)}
          />
        ) : (
          <OnboardingScreen onChoose={choisirType} />
        )}
        {loading && (
          <View style={s.loader}><ActivityIndicator size="large" color={C.accent} /></View>
        )}
      </>
    );
  }

  const showBack = screen === 'profilPro' || screen === 'creer' || screen === 'sos'
    || screen === 'profilEdit' || screen === 'profilPublic'
    || screen === 'mesPublications' || screen === 'gererPortfolio'
    || (screen === 'messages' && activeConvId);

  const backTitle = screen === 'profilPro'
    ? (pros[viewedProId] ? pros[viewedProId].entreprise : '')
    : screen === 'profilPublic' ? (profilPublic ? profilPublic.nom : 'Profil')
    : screen === 'sos' ? 'SOS — Urgence'
    : screen === 'profilEdit' ? 'Modifier mon profil'
    : screen === 'mesPublications' ? 'Mes publications'
    : screen === 'gererPortfolio' ? 'Organiser mes réalisations'
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
            else if (screen === 'profilEdit' || screen === 'mesPublications'
                     || screen === 'gererPortfolio') setScreen('profil');
            else setScreen('home');
          }}
        />
      ) : (
        <TopBrand unreadCount={unreadCount} onBell={() => setScreen('notifications')} />
      ))}

      <View style={[s.body, videoMode && { backgroundColor: C.dark }]}>
        <ConfirmBanner msg={banner} onClose={() => setBanner(null)} />

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
                onErreur={showBanner}
              />
            ) : (
              <DecouvrirScreen
                pros={pros}
                aiQuery={aiQuery} setAiQuery={setAiQuery} askAiMatch={askAiMatch}
                aiMatches={aiMatches} aiMatchLoading={aiMatchLoading} aiMatchError={aiMatchError}
                search={search} setSearch={setSearch}
                filterMetier={filterMetier} setFilterMetier={setFilterMetier}
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
                onErreur={showBanner}
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
            onErreur={showBanner}
            createText={createText} setCreateText={setCreateText}
            createMetier={createMetier} setCreateMetier={setCreateMetier}
            createVille={createVille} setCreateVille={setCreateVille}
            onPublish={publish}
          />
        )}

        {screen === 'messages' && !activeConv && (
          <MessagesScreen conversations={conversationsAffichees} onOpen={setActiveConvId} />
        )}

        {screen === 'messages' && activeConv && (
          <ConversationScreen
            conversation={activeConv}
            draft={msgDraft} setDraft={setMsgDraft} onSend={sendMessage}
          />
        )}

        {screen === 'mesPublications' && (
          <MesPublicationsScreen
            posts={mesPublications}
            onSupprimer={supprimerPublication}
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
            onErreur={showBanner}
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
          <NotificationsScreen notifications={notifications} onOuvrir={ouvrirNotification} />
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
            onLogout={deconnexion}
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
            following={followingIds.has(viewedProId)}
            onFollow={toggleFollow} onContact={handleContact}
            onViewProfile={viewProfile} onSubmitReview={submitReview}
          />
        )}
      </View>

      <BottomNav
        screen={screen}
        dark={videoMode}
        canPublish={canPublish}
        avatarUrl={monAvatar}
        avatarSeed={myProId || 'moi'}
        dots={{ decouvrir: canPublish && !demandesVues && demandes.length > 0 }}
        onLayout={(e) => setNavHeight(e.nativeEvent.layout.height)}
        onNavigate={(key) => { setScreen(key); setActiveConvId(null); }}
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
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
});
