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
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import DecouvrirScreen from './screens/DecouvrirScreen';
import CreerScreen from './screens/CreerScreen';
import MessagesScreen from './screens/MessagesScreen';
import ConversationScreen from './screens/ConversationScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfilOwnScreen from './screens/ProfilOwnScreen';
import ProfilProScreen from './screens/ProfilProScreen';
import ProfilEditScreen from './screens/ProfilEditScreen';
import SosScreen from './screens/SosScreen';
import DemandesScreen from './screens/DemandesScreen';
import { METIERS, POST_GRADIENTS, avgReviews, initialDemandes } from './data/demo';
import * as api from './lib/api';
import { hasSupabase } from './lib/supabase';
import { envoyerFichier, estFichierLocal } from './lib/storage';
import { aiMatchPros } from './lib/ai';

export default function OpusApp() {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demarrage, setDemarrage] = useState(true);   // reprise de session
  const [typeChoisi, setTypeChoisi] = useState(null); // type retenu avant connexion
  const [screen, setScreen] = useState('home');
  const [feedMode, setFeedMode] = useState('classic');
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
  const [navHeight, setNavHeight] = useState(0);               // hauteur de la nav flottante

  /* Espace « Demandes » : l'inverse du fil, réservé aux particuliers qui publient. */
  const [decouvrirTab, setDecouvrirTab] = useState('artisans');
  const [demandes, setDemandes] = useState(initialDemandes);
  const [demandeFiltre, setDemandeFiltre] = useState(null);
  const [demandesVues, setDemandesVues] = useState(false);

  /* Compte : profil du particulier, et disponibilité SOS du professionnel. */
  const [monProfil, setMonProfil] = useState({ nom: 'Vous', ville: '', avatarUrl: null, bannerUrl: null });
  const [mesSos, setMesSos] = useState(null);

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
      setNotifications(data.notifications);
      setFollowingIds(new Set(data.followingIds));
      setSavedIds(new Set(data.savedIds));
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

  const handleSignUp = async ({ email, motDePasse, nom, entreprise, metier, ville }) => {
    const { session } = await api.signUp({
      email, password: motDePasse, userType: typeChoisi, nom,
    });
    if (!session) return { confirmationRequise: true };

    if (typeChoisi === 'pro') {
      await api.ensureProProfile({ entreprise, metier, ville, nom });
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

  const addComment = (id, texte) => {
    setPosts((ps) => ps.map((p) => (p.id === id
      ? { ...p, comments: [...p.comments, { id: `local-${Date.now()}`, auteur: 'Vous', texte }] }
      : p)));
    api.addComment(id, texte).catch(() => showBanner("Le commentaire n'a pas pu être envoyé."));
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
    }
    setActiveConvId(conv.id);
    setScreen('messages');
  };

  const submitQuote = async (form) => {
    const { pro, mode } = quote;
    setQuote({ open: false, pro: null, mode: 'devis' });
    try {
      if (mode === 'devis') {
        await api.createQuoteRequest({ proId: pro.id, ...form });
      } else {
        await api.createCallbackRequest({ proId: pro.id, ...form });
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
    if (userType !== 'pro') {
      showBanner("Le fil d'actualité est réservé aux professionnels.");
      return;
    }
    if (!createText.trim()) { showBanner('Ajoute une description avant de publier.'); return; }
    const media = POST_GRADIENTS[Math.floor(Math.random() * POST_GRADIENTS.length)];
    const texte = (userType === 'particulier' ? `[Demande particulier · ${createMetier}] ` : '')
      + createText.trim();

    let id = `local-${Date.now()}`;
    try {
      const row = await api.createPost({
        type: createType, texte, media, metier: createMetier, ville: createVille,
      });
      if (row) id = row.id;
    } catch (e) {
      showBanner(`Publication non enregistrée : ${e.message || e}`);
      return;
    }

    setPosts((ps) => [{
      id, type: 'post', proId: myProId, time: "À l'instant",
      texte, media, likes: 0, liked: false, comments: [],
    }, ...ps]);
    setCreateText(''); setCreateVille('');
    setScreen('home');
    showBanner('Votre publication est en ligne.');
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

  /* ---------- partenaires ---------- */
  const addPartner = async (myId, otherId) => {
    try {
      await api.addPartner(myId, otherId);
    } catch (e) {
      showBanner(`Partenariat impossible : ${e.message || e}`);
      return;
    }
    setPros((prev) => ({
      ...prev,
      [myId]: { ...prev[myId], partners: [...new Set([...prev[myId].partners, otherId])] },
      [otherId]: { ...prev[otherId], partners: [...new Set([...prev[otherId].partners, myId])] },
    }));
    showBanner('Partenariat confirmé.');
    setScreen('profil');
  };

  /* ---------- notifications ---------- */
  const readNotification = (id) => {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, lue: true } : n)));
    api.markNotificationRead(id).catch(() => {});
  };

  /* ---------- mon compte ---------- */
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
    setMonProfil({ nom: 'Vous', ville: '', avatarUrl: null, bannerUrl: null });
    setMesSos(null);
    setFeedMode('classic');
    setFeedTab('pourvous');
  };

  /* ---------- demandes de particuliers ---------- */
  const publierDemande = ({ metier, ville, texte }) => {
    setDemandes((ds) => [{
      id: `local-${Date.now()}`,
      auteur: 'Vous',
      metier,
      ville: ville || 'Non précisée',
      texte,
      media: null,
      time: "À l'instant",
      reponses: 0,
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
      setDemandes((ds) => ds.map((d) => (
        d.id === demande.id ? { ...d, reponses: d.reponses + 1 } : d
      )));
    }

    setActiveConvId(conv.id);
    setScreen('messages');
  };

  /* ---------- SOS : intervention d'urgence ---------- */
  const envoyerSos = (demande) => {
    const pro = pros[demande.proId];
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
      const liste = Object.values(pros).map((p) => {
        const avg = avgReviews(p);
        return {
          proId: p.id, metier: p.metier, ville: p.ville, exp: p.exp,
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
  const feedFiltered = feedTab === 'abonnements'
    ? visiblePosts.filter((p) => p.type === 'ad' || followingIds.has(p.proId))
    : visiblePosts;

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
    || screen === 'profilEdit' || (screen === 'messages' && activeConvId);

  const backTitle = screen === 'profilPro'
    ? (pros[viewedProId] ? pros[viewedProId].entreprise : '')
    : screen === 'sos' ? 'SOS — Urgence'
    : screen === 'profilEdit' ? 'Modifier mon profil'
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
            else if (screen === 'profilEdit') setScreen('profil');
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
            feedMode={feedMode} setFeedMode={setFeedMode}
            feedTab={feedTab} setFeedTab={setFeedTab}
            followingIds={followingIds} savedIds={savedIds}
            openCommentsId={openCommentsId} openContactId={openContactId}
            bottomInset={videoMode ? navHeight : 0}
            onLike={toggleLike} onFollow={toggleFollow} onView={viewProfile} onHide={hidePost}
            onToggleComments={toggleComments} onAddComment={addComment}
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
                options={[
                  { key: 'artisans', label: 'Artisans' },
                  { key: 'demandes', label: 'Demandes' },
                ]}
              />
            </View>

            {decouvrirTab === 'artisans' ? (
              <DecouvrirScreen
                pros={pros}
                aiQuery={aiQuery} setAiQuery={setAiQuery} askAiMatch={askAiMatch}
                aiMatches={aiMatches} aiMatchLoading={aiMatchLoading} aiMatchError={aiMatchError}
                search={search} setSearch={setSearch}
                filterMetier={filterMetier} setFilterMetier={setFilterMetier}
                onView={viewProfile} onContact={handleContact}
              />
            ) : (
              <DemandesScreen
                userType={userType}
                monMetier={pros[myProId] ? pros[myProId].metier : null}
                demandes={demandes}
                filtreMetier={demandeFiltre}
                setFiltreMetier={setDemandeFiltre}
                onPublier={publierDemande}
                onRepondre={repondreDemande}
              />
            )}
          </View>
        )}

        {screen === 'creer' && (
          <CreerScreen
            createType={createType} setCreateType={setCreateType}
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

        {screen === 'profilEdit' && (
          <ProfilEditScreen
            userType={userType}
            profil={userType === 'pro' ? (pros[myProId] || {}) : monProfil}
            sos={mesSos}
            onSave={enregistrerProfil}
            onEnvoyerDocuments={envoyerDocuments}
            onErreur={showBanner}
          />
        )}

        {screen === 'sos' && (
          <SosScreen pros={pros} onEnvoyer={envoyerSos} />
        )}

        {screen === 'notifications' && (
          <NotificationsScreen notifications={notifications} onRead={readNotification} />
        )}

        {screen === 'profil' && (
          <ProfilOwnScreen
            userType={userType} pros={pros} myProId={myProId} monProfil={monProfil}
            followingIds={followingIds} savedIds={savedIds}
            onAddPartner={addPartner} onViewProfile={viewProfile}
            onEdit={() => setScreen('profilEdit')}
            onLogout={deconnexion}
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
        dots={{ decouvrir: canPublish && !demandesVues && demandes.length > 0 }}
        onLayout={(e) => setNavHeight(e.nativeEvent.layout.height)}
        onNavigate={(key) => { setScreen(key); setActiveConvId(null); }}
      />

      <QuoteModal
        quote={quote}
        onClose={() => setQuote({ open: false, pro: null, mode: 'devis' })}
        onSubmit={submitQuote}
      />

      <CommentsSheet
        visible={!!commentsPost}
        post={commentsPost}
        onClose={() => setCommentsPostId(null)}
        onAddComment={addComment}
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
