/**
 * Racine de l'application : contient l'état et enchaîne les écrans,
 * exactement comme le composant OpusProject du prototype.
 *
 * Principe : l'écran met à jour l'état local tout de suite (l'app reste fluide),
 * puis on écrit dans Supabase en arrière-plan via src/lib/api.js.
 * Sans .env, l'écriture Supabase ne fait rien : l'app tourne en mode démo.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { C } from './theme';
import { ConfirmBanner } from './components/ui';
import { TopBrand, BackBar } from './components/TopBar';
import BottomNav from './components/BottomNav';
import QuoteModal from './components/QuoteModal';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import DecouvrirScreen from './screens/DecouvrirScreen';
import CreerScreen from './screens/CreerScreen';
import MessagesScreen from './screens/MessagesScreen';
import ConversationScreen from './screens/ConversationScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfilOwnScreen from './screens/ProfilOwnScreen';
import ProfilProScreen from './screens/ProfilProScreen';
import { METIERS, POST_GRADIENTS, avgReviews } from './data/demo';
import * as api from './lib/api';
import { aiMatchPros } from './lib/ai';

export default function OpusApp() {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const start = async (type) => {
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

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const unreadCount = notifications.filter((n) => !n.lue).length;

  /* ---------- rendu ---------- */
  if (!userType) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onChoose={start} />
        {loading && (
          <View style={s.loader}><ActivityIndicator size="large" color={C.accent} /></View>
        )}
      </>
    );
  }

  const showBack = screen === 'profilPro' || screen === 'creer'
    || (screen === 'messages' && activeConvId);

  const backTitle = screen === 'profilPro'
    ? (pros[viewedProId] ? pros[viewedProId].entreprise : '')
    : screen === 'creer' ? 'Publier'
    : activeConv && pros[activeConv.proId] ? pros[activeConv.proId].entreprise : '';

  return (
    <View style={s.app}>
      <StatusBar style="dark" />

      {showBack ? (
        <BackBar
          title={backTitle}
          onBack={() => {
            if (screen === 'messages') setActiveConvId(null);
            else setScreen('home');
          }}
        />
      ) : (
        <TopBrand unreadCount={unreadCount} onBell={() => setScreen('notifications')} />
      )}

      <View style={s.body}>
        <ConfirmBanner msg={banner} onClose={() => setBanner(null)} />

        {screen === 'home' && (
          <HomeScreen
            posts={feedFiltered} pros={pros}
            feedMode={feedMode} setFeedMode={setFeedMode}
            feedTab={feedTab} setFeedTab={setFeedTab}
            followingIds={followingIds} savedIds={savedIds}
            openCommentsId={openCommentsId} openContactId={openContactId}
            onLike={toggleLike} onFollow={toggleFollow} onView={viewProfile} onHide={hidePost}
            onToggleComments={toggleComments} onAddComment={addComment}
            onSave={toggleSave} onToggleContact={toggleContact}
            onContact={handleContact} onShare={showBanner}
          />
        )}

        {screen === 'decouvrir' && (
          <DecouvrirScreen
            pros={pros}
            aiQuery={aiQuery} setAiQuery={setAiQuery} askAiMatch={askAiMatch}
            aiMatches={aiMatches} aiMatchLoading={aiMatchLoading} aiMatchError={aiMatchError}
            search={search} setSearch={setSearch}
            filterMetier={filterMetier} setFilterMetier={setFilterMetier}
            onView={viewProfile} onContact={handleContact}
          />
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
          <MessagesScreen conversations={conversations} pros={pros} onOpen={setActiveConvId} />
        )}

        {screen === 'messages' && activeConv && (
          <ConversationScreen
            conversation={activeConv}
            draft={msgDraft} setDraft={setMsgDraft} onSend={sendMessage}
          />
        )}

        {screen === 'notifications' && (
          <NotificationsScreen notifications={notifications} onRead={readNotification} />
        )}

        {screen === 'profil' && (
          <ProfilOwnScreen
            userType={userType} pros={pros} myProId={myProId}
            followingIds={followingIds} savedIds={savedIds}
            onAddPartner={addPartner} onViewProfile={viewProfile}
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
        onNavigate={(key) => { setScreen(key); setActiveConvId(null); }}
      />

      <QuoteModal
        quote={quote}
        onClose={() => setQuote({ open: false, pro: null, mode: 'devis' })}
        onSubmit={submitQuote}
      />
    </View>
  );
}

const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1, backgroundColor: C.bg },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
});
