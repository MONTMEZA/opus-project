import React, { useState } from "react";
import {
  Home, Search, PlusSquare, MessageCircle, User, Heart, Share2,
  MessageSquare, MapPin, BadgeCheck, Star, HardHat, Hammer, Wrench,
  Paintbrush, ArrowLeft, Bell, Send, Camera, Video as VideoIcon,
  Type as TypeIcon, Layers, Lightbulb, X, Users, Bookmark, Phone,
  FileText, Check, ChevronRight, EyeOff, ShieldCheck, ShieldX,
  Sparkles, Loader2, ClipboardCheck
} from "lucide-react";

/* ================================================================== */
/*  DONNÉES DE DÉMONSTRATION                                           */
/*  (tout est simulé en mémoire — voir note en fin de fichier)         */
/* ================================================================== */

const METIERS = [
  "Maçon", "Électricien", "Plombier", "Charpentier", "Peintre",
  "Carreleur", "Couvreur", "Menuisier", "Plaquiste", "Terrassier",
];

const proProfiles = {
  1: { id: 1, nom: "Karim Belaïd", entreprise: "Belaïd Maçonnerie", metier: "Maçon",
       ville: "Marseille (13)", verifie: true, exp: 9,
       siret: "812 345 678 00019", followers: 1240,
       bio: "Entreprise familiale spécialisée dans la maçonnerie générale et la rénovation depuis 2015.",
       partners: [2, 4],
       assurance: { valide: true, expire: "12/2026" },
       kbis: { valide: true, maj: "03/2026" },
       rge: true,
       portfolio: ["#3a3a38,#8a8578", "#6b4226,#b98255", "#1b4b6b,#4d7f9e", "#4b4b2f,#9a9a5a", "#5a3a3a,#a87a7a", "#2f4b3a,#6a9a7a"],
       reviews: [
         { id: 1, auteur: "Julie M.", verifie: true, date: "Sept. 2026", delais: 5, qualite: 5, tarif: 4, commentaire: "Chantier livré dans les temps, très bon relationnel, travail soigné." },
         { id: 2, auteur: "Thomas B.", verifie: true, date: "Août 2026", delais: 4, qualite: 5, tarif: 4, commentaire: "Fondations nickel, un léger retard sur la fin mais bien communiqué." },
         { id: 3, auteur: "Nadia K.", verifie: true, date: "Juil. 2026", delais: 5, qualite: 4, tarif: 3, commentaire: "Bon travail dans l'ensemble, tarif un peu élevé par rapport au devis initial." },
       ] },
  2: { id: 2, nom: "Sophie Renaud", entreprise: "Renaud Élec", metier: "Électricien",
       ville: "Lyon (69)", verifie: true, exp: 6,
       siret: "798 221 044 00027", followers: 860,
       bio: "Installations électriques neuves et rénovation, mise aux normes NF C 15-100.",
       partners: [1],
       assurance: { valide: true, expire: "09/2027" },
       kbis: { valide: true, maj: "01/2026" },
       rge: true,
       portfolio: ["#1b4b6b,#4d7f9e", "#3a3a38,#8a8578", "#4b4b2f,#9a9a5a"],
       reviews: [
         { id: 1, auteur: "Marc L.", verifie: true, date: "Sept. 2026", delais: 5, qualite: 5, tarif: 5, commentaire: "Impeccable du devis à la mise en service, je recommande." },
       ] },
  3: { id: 3, nom: "Yanis Cortez", entreprise: "YC Carrelage", metier: "Carreleur",
       ville: "Toulouse (31)", verifie: false, exp: 4,
       siret: "889 112 004 00013", followers: 410,
       bio: "Pose de carrelage grand format, faïence, douches à l'italienne.",
       partners: [],
       assurance: { valide: false, expire: null },
       kbis: { valide: true, maj: "11/2025" },
       rge: false,
       portfolio: ["#6b4226,#b98255", "#5a3a3a,#a87a7a"],
       reviews: [
         { id: 1, auteur: "Antoine R.", verifie: true, date: "Août 2026", delais: 3, qualite: 4, tarif: 5, commentaire: "Très bon rapport qualité-prix, quelques jours de retard sur le planning." },
       ] },
  4: { id: 4, nom: "Marc Dubreuil", entreprise: "Dubreuil Plomberie", metier: "Plombier",
       ville: "Marseille (13)", verifie: true, exp: 12,
       siret: "701 998 332 00041", followers: 990,
       bio: "Plomberie générale, chauffage, dépannage rapide sur Marseille et alentours.",
       partners: [1],
       assurance: { valide: true, expire: "06/2027" },
       kbis: { valide: true, maj: "02/2026" },
       rge: false,
       portfolio: ["#1b4b6b,#4d7f9e", "#2f4b3a,#6a9a7a", "#3a3a38,#8a8578"],
       reviews: [
         { id: 1, auteur: "Claire D.", verifie: true, date: "Sept. 2026", delais: 5, qualite: 4, tarif: 4, commentaire: "Intervention rapide pour une urgence, très professionnel." },
         { id: 2, auteur: "Hugo P.", verifie: true, date: "Juin 2026", delais: 4, qualite: 5, tarif: 3, commentaire: "Excellent travail sur le remplacement de chaudière, prix un peu haut." },
       ] },
  5: { id: 5, nom: "Élodie Faure", entreprise: "Faure Charpente", metier: "Charpentier",
       ville: "Aix-en-Provence (13)", verifie: true, exp: 8,
       siret: "845 667 210 00018", followers: 320,
       bio: "Charpente traditionnelle et ossature bois, du neuf à la rénovation.",
       partners: [1],
       assurance: { valide: true, expire: "04/2027" },
       kbis: { valide: false, maj: null },
       rge: true,
       portfolio: ["#4b4b2f,#9a9a5a", "#6b4226,#b98255"],
       reviews: [] },
};

const grad = (colors) => `linear-gradient(160deg,${colors})`;

/* Moyenne des avis sur 3 critères : respect des délais, qualité du travail, rapport qualité-prix */
function avgReviews(pro) {
  const rs = pro.reviews || [];
  if (rs.length === 0) return { delais: 0, qualite: 0, tarif: 0, global: 0, count: 0 };
  const sum = (k) => rs.reduce((a, r) => a + r[k], 0) / rs.length;
  const delais = sum("delais"), qualite = sum("qualite"), tarif = sum("tarif");
  return { delais, qualite, tarif, global: (delais + qualite + tarif) / 3, count: rs.length };
}

/* Appel à l'API Claude pour les fonctions IA de l'app (résumé d'avis, mise en relation) */
async function askClaude(userPrompt, system) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await response.json();
  const text = (data.content || []).map((b) => b.text || "").join("\n");
  return text;
}

const initialPosts = [
  { id: 1, type: "post", proId: 1, time: "Il y a 2 h",
    texte: "Fondations coulées ce matin, dalle prévue vendredi. Chantier villa R+1.",
    media: grad("#3a3a38,#8a8578"), likes: 214, liked: false,
    comments: [{ id: 1, auteur: "Julie M.", texte: "Superbe avancée, bravo !" }] },
  { id: 2, type: "post", proId: 2, time: "Il y a 4 h",
    texte: "Tableau électrique aux normes NF C 15-100, mise en service demain matin.",
    media: grad("#1b4b6b,#4d7f9e"), likes: 132, liked: false, comments: [] },
  { id: "ad1", type: "ad", annonceur: "BricoPro Matériaux",
    accroche: "-15% sur les sacs de ciment ce mois-ci pour les pros inscrits.",
    cta: "Voir l'offre", media: grad("#2b2b2b,#555555") },
  { id: 3, type: "post", proId: 3, time: "Hier",
    texte: "Pose grand format 120x60 en salle de bain, jointoiement fini cette semaine. Rendu au top.",
    media: grad("#6b4226,#b98255"), likes: 341, liked: false,
    comments: [{ id: 2, auteur: "Antoine R.", texte: "Magnifique travail, vous intervenez sur Toulouse centre ?" }] },
  { id: 4, type: "post", proId: 4, time: "Hier",
    texte: "Remplacement chaudière + purge complète du circuit. Client satisfait, garantie 2 ans.",
    media: grad("#1b4b6b,#2f4b3a"), likes: 87, liked: false, comments: [] },
  { id: "ad2", type: "ad", annonceur: "AssurBTP",
    accroche: "Assurance décennale dès 39€/mois pour les artisans du bâtiment.",
    cta: "En savoir plus", media: grad("#111111,#3a3a38") },
  { id: 5, type: "post", proId: 5, time: "Il y a 2 j",
    texte: "Charpente traditionnelle posée en 3 jours, ossature chêne massif.",
    media: grad("#4b4b2f,#9a9a5a"), likes: 176, liked: false, comments: [] },
];

const initialConversations = [
  { id: 1, proId: 4, messages: [{ from: "pro", texte: "Je passe lundi matin pour le devis.", heure: "09:12" }] },
  { id: 2, proId: 2, messages: [{ from: "pro", texte: "Photos du tableau envoyées ✅", heure: "hier" }] },
];

const initialNotifications = [
  { id: 1, texte: "Sophie Renaud a aimé votre publication", lue: false },
  { id: 2, texte: "Nouveau commentaire de Julie M.", lue: false },
  { id: 3, texte: "Marc Dubreuil vous suit désormais", lue: true },
  { id: 4, texte: "Votre publication a été enregistrée par 3 personnes", lue: true },
];

/* ================================================================== */
/*  PETITS COMPOSANTS RÉUTILISABLES                                    */
/* ================================================================== */

function Avatar({ seed, size = 40 }) {
  const bg = ["#c9c4b8", "#b5a99a", "#9fb3ad", "#c2ab9a"][seed % 4];
  return <div className="avatar" style={{ width: size, height: size, background: bg }} />;
}

function ConfirmBanner({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className="confirm-banner" onClick={onClose}>
      <Check size={14} /> {msg}
    </div>
  );
}

/* ================================================================== */
/*  ÉCRAN D'ACCUEIL / ONBOARDING                                       */
/* ================================================================== */

function OnboardingScreen({ onChoose }) {
  return (
    <div className="onboard">
      <div className="onboard-hazard" />
      <div className="onboard-icons">
        <HardHat size={22} /><Hammer size={22} /><Wrench size={22} /><Paintbrush size={22} />
      </div>
      <div className="onboard-brand">OPUS<span>-PROJECT</span></div>
      <div className="onboard-tag">Découvrez. Partagez. Construisez.</div>
      <div className="onboard-spacer" />
      <button className="onboard-btn onboard-btn-pro" onClick={() => onChoose("pro")}>
        JE SUIS UN PROFESSIONNEL
      </button>
      <button className="onboard-btn onboard-btn-part" onClick={() => onChoose("particulier")}>
        JE SUIS UN PARTICULIER
      </button>
      <div className="onboard-note">Démo — aucune vraie inscription n'est créée ici.</div>
    </div>
  );
}

/* ================================================================== */
/*  CARTE PUBLICATION (fil classique)                                  */
/* ================================================================== */

function PostCard({ post, pro, following, onLike, onFollow, onView, onHide,
                    commentsOpen, onToggleComments, onAddComment,
                    saved, onSave, contactOpen, onToggleContact, onContact, onShare }) {
  const [draft, setDraft] = useState("");

  if (post.type === "ad") {
    return (
      <div className="post-card ad-card">
        <div className="ad-tag">Sponsorisé</div>
        <div className="post-media" style={{ background: post.media, height: 140 }} />
        <div className="post-body">
          <div className="ad-annonceur">{post.annonceur}</div>
          <p className="post-text">{post.accroche}</p>
          <button className="btn-main btn-block" onClick={() => onShare(`Ouverture de "${post.annonceur}" (simulation).`)}>
            {post.cta}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-card">
      <div className="post-head">
        <button className="post-head-left" onClick={() => onView(pro.id)}>
          <Avatar seed={pro.id} />
          <div>
            <div className="post-name">{pro.entreprise} {pro.verifie && <BadgeCheck size={14} className="verif-ic" />}</div>
            <div className="post-meta">{pro.metier} · {pro.ville} · {post.time}</div>
          </div>
        </button>
        <div className="post-head-right">
          <button className={"chip-follow" + (following ? " chip-followed" : "")} onClick={() => onFollow(pro.id)}>
            {following ? "Suivi" : "Suivre"}
          </button>
          <button className="icon-btn" onClick={() => onHide(post.id)} title="Masquer"><EyeOff size={15} /></button>
        </div>
      </div>

      <p className="post-text">{post.texte}</p>
      <div className="post-media" style={{ background: post.media }} />

      <div className="post-actions">
        <button className={"post-action" + (post.liked ? " on" : "")} onClick={() => onLike(post.id)}>
          <Heart size={17} fill={post.liked ? "currentColor" : "none"} /> {post.likes}
        </button>
        <button className="post-action" onClick={() => onToggleComments(post.id)}>
          <MessageSquare size={17} /> {post.comments.length}
        </button>
        <button className="post-action" onClick={() => onShare("Lien de la publication copié.")}>
          <Share2 size={16} /> Partager
        </button>
        <button className={"post-action" + (saved ? " on" : "")} onClick={() => onSave(post.id)}>
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="contact-wrap">
          <button className="btn-mini" onClick={() => onToggleContact(post.id)}>Contacter</button>
          {contactOpen && (
            <div className="contact-pop">
              <button onClick={() => onContact(pro, "message")}><MessageCircle size={13} /> Envoyer un message</button>
              <button onClick={() => onContact(pro, "rappel")}><Phone size={13} /> Être rappelé</button>
              <button onClick={() => onContact(pro, "devis")}><FileText size={13} /> Demander un devis</button>
              <button onClick={() => onView(pro.id)}><User size={13} /> Voir le profil</button>
            </div>
          )}
        </div>
      </div>

      {commentsOpen && (
        <div className="comments-zone">
          {post.comments.map((c) => (
            <div className="comment-row" key={c.id}><b>{c.auteur}</b> {c.texte}</div>
          ))}
          {post.comments.length === 0 && <div className="comment-empty">Aucun commentaire pour l'instant.</div>}
          <div className="comment-input-row">
            <input placeholder="Ajouter un commentaire..." value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button onClick={() => { if (draft.trim()) { onAddComment(post.id, draft.trim()); setDraft(""); } }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  FIL VIDÉO (style TikTok)                                           */
/* ================================================================== */

function VideoSlide({ post, pro, following, saved, onLike, onFollow, onSave, onView, onShare, onContact }) {
  if (post.type === "ad") {
    return (
      <div className="feed-card" style={{ background: post.media }}>
        <div className="feed-card-scrim" />
        <div className="feed-info">
          <div className="feed-tag ad-tag-video">Sponsorisé</div>
          <div className="feed-name">{post.annonceur}</div>
          <p className="feed-text">{post.accroche}</p>
          <button className="btn-main" style={{ marginTop: 10 }} onClick={() => onShare(`Ouverture de "${post.annonceur}" (simulation).`)}>
            {post.cta}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="feed-card" style={{ background: post.media }}>
      <div className="feed-card-scrim" />
      <div className="feed-actions">
        <button className="feed-action" onClick={() => onLike(post.id)}>
          <div className={"feed-action-icon" + (post.liked ? " on" : "")}><Heart size={22} fill={post.liked ? "currentColor" : "none"} /></div>
          <span>{post.likes}</span>
        </button>
        <div className="feed-action">
          <div className="feed-action-icon"><MessageSquare size={22} /></div>
          <span>{post.comments.length}</span>
        </div>
        <button className="feed-action" onClick={() => onShare("Lien de la vidéo copié.")}>
          <div className="feed-action-icon"><Share2 size={20} /></div>
          <span>Partager</span>
        </button>
        <button className="feed-action" onClick={() => onSave(post.id)}>
          <div className={"feed-action-icon" + (saved ? " on" : "")}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></div>
        </button>
      </div>
      <div className="feed-info">
        <div className="feed-tag">{pro.metier}</div>
        <button className="feed-name feed-name-btn" onClick={() => onView(pro.id)}>
          {pro.entreprise} {pro.verifie && <BadgeCheck size={15} className="verif-ic" />}
        </button>
        <div className="feed-loc"><MapPin size={12} /> {pro.ville}</div>
        <p className="feed-text">{post.texte}</p>
        <div className="feed-btn-row">
          <button className={"chip-follow chip-follow-video" + (following ? " chip-followed" : "")} onClick={() => onFollow(pro.id)}>
            {following ? "Suivi" : "Suivre"}
          </button>
          <button className="btn-main" onClick={() => onContact(pro, "message")}>Contacter</button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  APP RACINE                                                         */
/* ================================================================== */

const TABS = [
  { key: "home", label: "Accueil", icon: Home },
  { key: "decouvrir", label: "Découvrir", icon: Search },
  { key: "creer", label: "", icon: PlusSquare },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "profil", label: "Profil", icon: User },
];

export default function OpusProject() {
  const [userType, setUserType] = useState(null);
  const [screen, setScreen] = useState("home");
  const [feedMode, setFeedMode] = useState("classic");
  const [feedTab, setFeedTab] = useState("pourvous");

  const [posts, setPosts] = useState(initialPosts);
  const [followingIds, setFollowingIds] = useState(new Set([4]));
  const [savedIds, setSavedIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [openContactId, setOpenContactId] = useState(null);

  const [conversations, setConversations] = useState(initialConversations);
  const [activeConvId, setActiveConvId] = useState(null);
  const [msgDraft, setMsgDraft] = useState("");

  const [notifications, setNotifications] = useState(initialNotifications);
  const [viewedProId, setViewedProId] = useState(null);

  const [quote, setQuote] = useState({ open: false, pro: null, mode: "devis" });
  const [banner, setBanner] = useState(null);

  const [aiQuery, setAiQuery] = useState("");
  const [aiMatches, setAiMatches] = useState(null);
  const [aiMatchLoading, setAiMatchLoading] = useState(false);
  const [aiMatchError, setAiMatchError] = useState(false);

  const askAiMatch = async () => {
    if (!aiQuery.trim()) return;
    setAiMatchLoading(true); setAiMatchError(false); setAiMatches(null);
    try {
      const liste = Object.values(proProfiles).map((p) => ({
        proId: p.id, metier: p.metier, ville: p.ville, exp: p.exp,
        note: avgReviews(p).count ? avgReviews(p).global.toFixed(1) : null, bio: p.bio,
      }));
      const raw = await askClaude(
        `Besoin décrit par un particulier : "${aiQuery.trim()}"\n\nListe des artisans disponibles (JSON) :\n${JSON.stringify(liste)}`,
        `Tu es l'assistant de mise en relation d'un réseau social du BTP. Réponds UNIQUEMENT avec un JSON valide, sans aucun texte autour, de la forme exacte :
{"recommandations":[{"proId":1,"pertinence":5,"raison":"courte phrase expliquant pourquoi ce pro correspond"}]}
Trie du plus pertinent au moins pertinent. N'utilise que des proId présents dans la liste fournie. Ne propose que des artisans dont le métier correspond réellement au besoin.`
      );
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const recs = (parsed.recommandations || []).filter((r) => proProfiles[r.proId]);
      setAiMatches(recs);
    } catch (e) {
      setAiMatchError(true);
    }
    setAiMatchLoading(false);
  };

  const [search, setSearch] = useState("");
  const [filterMetier, setFilterMetier] = useState(null);

  const [createType, setCreateType] = useState("photo");
  const [createText, setCreateText] = useState("");
  const [createMetier, setCreateMetier] = useState(METIERS[0]);
  const [createVille, setCreateVille] = useState("");

  const showBanner = (msg) => { setBanner(msg); };

  /* ---------- actions publication ---------- */
  const toggleLike = (id) => setPosts((ps) => ps.map((p) =>
    p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));

  const toggleSave = (id) => setSavedIds((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const hidePost = (id) => setHiddenIds((s) => new Set(s).add(id));

  const toggleComments = (id) => setOpenCommentsId((c) => (c === id ? null : id));
  const toggleContact = (id) => setOpenContactId((c) => (c === id ? null : id));

  const addComment = (id, texte) => setPosts((ps) => ps.map((p) =>
    p.id === id ? { ...p, comments: [...p.comments, { id: Date.now(), auteur: "Vous", texte }] } : p));

  const toggleFollow = (proId) => setFollowingIds((s) => {
    const n = new Set(s); n.has(proId) ? n.delete(proId) : n.add(proId); return n;
  });

  const viewProfile = (proId) => { setViewedProId(proId); setScreen("profilPro"); setOpenContactId(null); };

  /* ---------- contact / devis / rappel ---------- */
  const handleContact = (pro, mode) => {
    setOpenContactId(null);
    if (mode === "message") {
      let conv = conversations.find((c) => c.proId === pro.id);
      if (!conv) {
        conv = { id: Date.now(), proId: pro.id, messages: [] };
        setConversations((cs) => [conv, ...cs]);
      }
      setActiveConvId(conv.id);
      setScreen("messages");
    } else {
      setQuote({ open: true, pro, mode });
    }
  };

  const submitQuote = () => {
    const { pro, mode } = quote;
    setQuote({ open: false, pro: null, mode: "devis" });
    showBanner(mode === "devis"
      ? `Demande de devis envoyée à ${pro.entreprise}.`
      : `Demande de rappel envoyée à ${pro.entreprise}.`);
  };

  /* ---------- messagerie ---------- */
  const sendMessage = () => {
    if (!msgDraft.trim() || activeConvId == null) return;
    setConversations((cs) => cs.map((c) => c.id === activeConvId
      ? { ...c, messages: [...c.messages, { from: "moi", texte: msgDraft.trim(), heure: "à l'instant" }] }
      : c));
    setMsgDraft("");
  };

  /* ---------- création ---------- */
  const publish = () => {
    if (!createText.trim()) { showBanner("Ajoute une description avant de publier."); return; }
    const grads = ["#3a3a38,#8a8578", "#1b4b6b,#4d7f9e", "#6b4226,#b98255", "#4b4b2f,#9a9a5a"];
    const newPost = {
      id: Date.now(), type: "post", proId: 1, time: "À l'instant",
      texte: (userType === "particulier" ? `[Demande particulier · ${createMetier}] ` : "") + createText.trim(),
      media: grad(grads[Math.floor(Math.random() * grads.length)]),
      likes: 0, liked: false, comments: [],
    };
    setPosts((ps) => [newPost, ...ps]);
    setCreateText(""); setCreateVille("");
    setScreen("home");
    showBanner("Votre publication est en ligne.");
  };

  /* ---------- partenaires ---------- */
  const addPartner = (myId, otherId) => {
    proProfiles[myId].partners = [...new Set([...proProfiles[myId].partners, otherId])];
    proProfiles[otherId].partners = [...new Set([...proProfiles[otherId].partners, myId])];
    showBanner("Partenariat confirmé.");
    setScreen("profil");
  };

  const visiblePosts = posts.filter((p) => !hiddenIds.has(p.id));
  const feedFiltered = feedTab === "abonnements"
    ? visiblePosts.filter((p) => p.type === "ad" || followingIds.has(p.proId))
    : visiblePosts;

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const unreadCount = notifications.filter((n) => !n.lue).length;

  const searchResults = Object.values(proProfiles).filter((p) => {
    const matchText = (p.nom + p.entreprise + p.metier + p.ville).toLowerCase().includes(search.toLowerCase());
    const matchMetier = !filterMetier || p.metier === filterMetier;
    return matchText && matchMetier;
  });

  if (!userType) {
    return <StyleWrap><OnboardingScreen onChoose={(t) => { setUserType(t); setScreen("home"); }} /></StyleWrap>;
  }

  const showBack = screen === "profilPro" || screen === "creer" || (screen === "messages" && activeConvId);

  return (
    <StyleWrap>
      <div className="phone">
        {!showBack ? (
          <div className="topbrand">
            <div className="hazard-strip" />
            <div className="topbrand-row">
              <div className="topbrand-left"><HardHat size={18} /><span className="brand-word">OPUS</span></div>
              <button className="icon-btn" onClick={() => setScreen("notifications")}>
                <Bell size={18} />
                {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
              </button>
            </div>
          </div>
        ) : (
          <div className="backbar">
            <button className="icon-btn" onClick={() => {
              if (screen === "messages") setActiveConvId(null);
              else setScreen("home");
            }}><ArrowLeft size={18} /></button>
            <span className="backbar-title">
              {screen === "profilPro" ? proProfiles[viewedProId]?.entreprise : screen === "creer" ? "Publier" : activeConv ? proProfiles[activeConv.proId]?.entreprise : ""}
            </span>
          </div>
        )}

        <ConfirmBanner msg={banner} onClose={() => setBanner(null)} />

        <div className="body-area">
          {screen === "home" && (
            <div className="home-wrap">
              <div className="mode-row">
                <div className="pill-toggle">
                  <button className={feedMode === "classic" ? "on" : ""} onClick={() => setFeedMode("classic")}>Fil</button>
                  <button className={feedMode === "video" ? "on" : ""} onClick={() => setFeedMode("video")}>Vidéos</button>
                </div>
                {feedMode === "classic" && (
                  <div className="pill-toggle pill-toggle-sm">
                    <button className={feedTab === "pourvous" ? "on" : ""} onClick={() => setFeedTab("pourvous")}>Pour vous</button>
                    <button className={feedTab === "abonnements" ? "on" : ""} onClick={() => setFeedTab("abonnements")}>Abonnements</button>
                  </div>
                )}
              </div>

              {feedMode === "classic" ? (
                <div className="classic-scroll">
                  {feedFiltered.length === 0 && (
                    <div className="empty-state">Suis des professionnels pour voir leurs publications ici.</div>
                  )}
                  {feedFiltered.map((p) => (
                    <PostCard key={p.id} post={p} pro={p.proId ? proProfiles[p.proId] : null}
                      following={p.proId ? followingIds.has(p.proId) : false}
                      onLike={toggleLike} onFollow={toggleFollow} onView={viewProfile} onHide={hidePost}
                      commentsOpen={openCommentsId === p.id} onToggleComments={toggleComments} onAddComment={addComment}
                      saved={savedIds.has(p.id)} onSave={toggleSave}
                      contactOpen={openContactId === p.id} onToggleContact={toggleContact} onContact={handleContact}
                      onShare={showBanner} />
                  ))}
                </div>
              ) : (
                <div className="feed-scroll">
                  {feedFiltered.map((p) => (
                    <VideoSlide key={p.id} post={p} pro={p.proId ? proProfiles[p.proId] : null}
                      following={p.proId ? followingIds.has(p.proId) : false}
                      saved={savedIds.has(p.id)}
                      onLike={toggleLike} onFollow={toggleFollow} onSave={toggleSave} onView={viewProfile}
                      onShare={showBanner} onContact={handleContact} />
                  ))}
                </div>
              )}
            </div>
          )}

          {screen === "decouvrir" && (
            <div className="screen-pad">
              <div className="ai-match-box">
                <div className="ai-summary-head"><Sparkles size={14} /> Assistant IA — trouver le bon pro</div>
                <textarea className="create-textarea" style={{ minHeight: 50 }}
                  placeholder="Décrivez votre besoin : « je veux refaire ma salle de bain, carrelage et plomberie »..."
                  value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} />
                <button className="btn-main btn-block" onClick={askAiMatch} disabled={aiMatchLoading}>
                  {aiMatchLoading ? <><Loader2 size={13} className="spin" /> L'IA analyse votre besoin...</> : "Demander à l'IA"}
                </button>
                {aiMatchError && <div className="ai-error">L'assistant IA n'a pas pu répondre. Réessayez.</div>}
                {aiMatches && (
                  <div className="ai-match-results">
                    {aiMatches.length === 0 && <div className="empty-state">Aucun artisan pertinent trouvé pour ce besoin.</div>}
                    {aiMatches.map((r) => {
                      const p = proProfiles[r.proId];
                      return (
                        <div className="artisan-row" key={r.proId}>
                          <Avatar seed={p.id} size={40} />
                          <div className="artisan-info">
                            <div className="artisan-name">{p.entreprise} {p.verifie && <BadgeCheck size={13} className="verif-ic" />}</div>
                            <div className="artisan-meta">{p.metier} · {p.ville}</div>
                            <div className="ai-raison">{r.raison}</div>
                          </div>
                          <button className="btn-mini" onClick={() => viewProfile(r.proId)}>Profil</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="search-bar">
                <Search size={16} />
                <input placeholder="Rechercher un métier, une entreprise, une ville..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="chip-row">
                {METIERS.map((m) => (
                  <button key={m} className={"chip" + (filterMetier === m ? " chip-on" : "")}
                    onClick={() => setFilterMetier(filterMetier === m ? null : m)}>{m}</button>
                ))}
              </div>
              <div className="artisan-list">
                {searchResults.map((a) => (
                  <div className="artisan-row" key={a.id}>
                    <Avatar seed={a.id} size={44} />
                    <div className="artisan-info">
                      <div className="artisan-name">{a.entreprise} {a.verifie && <BadgeCheck size={14} className="verif-ic" />}</div>
                      <div className="artisan-meta">{a.metier} · {a.ville}</div>
                      <div className="artisan-rate"><Star size={12} className="star-ic" /> {avgReviews(a).count ? avgReviews(a).global.toFixed(1) : "—"} ({avgReviews(a).count} avis)</div>
                    </div>
                    <div className="artisan-btns">
                      <button className="btn-mini" onClick={() => viewProfile(a.id)}>Profil</button>
                      <button className="btn-mini btn-mini-outline" onClick={() => handleContact(a, "devis")}>Devis</button>
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && <div className="empty-state">Aucun résultat pour cette recherche.</div>}
              </div>
            </div>
          )}

          {screen === "creer" && (
            <div className="screen-pad">
              <div className="create-types">
                {[["photo", Camera, "Photo"], ["video", VideoIcon, "Vidéo"], ["avantapres", Layers, "Avant/Après"], ["texte", TypeIcon, "Texte"], ["conseil", Lightbulb, "Conseil"]].map(([key, Icon, label]) => (
                  <button key={key} className={"create-type" + (createType === key ? " on" : "")} onClick={() => setCreateType(key)}>
                    <Icon size={18} /><span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="create-media" style={{ background: "linear-gradient(160deg,#3a3a38,#8a8578)" }}>
                <Camera size={26} color="#fff" />
              </div>
              <textarea className="create-textarea" placeholder="Décris ta publication..." value={createText} onChange={(e) => setCreateText(e.target.value)} />
              <div className="create-row">
                <select className="create-select" value={createMetier} onChange={(e) => setCreateMetier(e.target.value)}>
                  {METIERS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <input className="create-input" placeholder="Ville" value={createVille} onChange={(e) => setCreateVille(e.target.value)} />
              </div>
              <button className="btn-main btn-block" onClick={publish}>Publier</button>
            </div>
          )}

          {screen === "messages" && !activeConv && (
            <div className="screen-pad">
              <div className="msg-list">
                {conversations.map((c) => {
                  const pro = proProfiles[c.proId];
                  const last = c.messages[c.messages.length - 1];
                  return (
                    <button className="msg-row" key={c.id} onClick={() => setActiveConvId(c.id)}>
                      <Avatar seed={pro.id} size={44} />
                      <div className="msg-body">
                        <div className="msg-top"><span className="msg-name">{pro.entreprise}</span><span className="msg-time">{last?.heure}</span></div>
                        <div className="msg-preview">{last?.texte}</div>
                      </div>
                    </button>
                  );
                })}
                {conversations.length === 0 && <div className="empty-state">Vos prochaines conversations apparaîtront ici.</div>}
              </div>
            </div>
          )}

          {screen === "messages" && activeConv && (
            <div className="conv-wrap">
              <div className="conv-scroll">
                {activeConv.messages.map((m, i) => (
                  <div key={i} className={"bubble" + (m.from === "moi" ? " bubble-moi" : "")}>{m.texte}</div>
                ))}
                {activeConv.messages.length === 0 && <div className="empty-state">Dites bonjour 👋</div>}
              </div>
              <div className="conv-input-row">
                <input placeholder="Écrire un message..." value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                <button onClick={sendMessage}><Send size={16} /></button>
              </div>
            </div>
          )}

          {screen === "notifications" && (
            <div className="screen-pad">
              {notifications.map((n) => (
                <button key={n.id} className={"notif-row" + (n.lue ? "" : " notif-unread")}
                  onClick={() => setNotifications((ns) => ns.map((x) => x.id === n.id ? { ...x, lue: true } : x))}>
                  {!n.lue && <span className="notif-dot" />}
                  {n.texte}
                </button>
              ))}
            </div>
          )}

          {screen === "profil" && (
            <ProfilOwnScreen userType={userType} following={followingIds} saved={savedIds}
              onAddPartner={addPartner} onViewProfile={viewProfile} />
          )}

          {screen === "profilPro" && viewedProId && (
            <ProfilProScreen pro={proProfiles[viewedProId]} following={followingIds.has(viewedProId)}
              onFollow={toggleFollow} onContact={handleContact} onViewProfile={viewProfile} />
          )}
        </div>

        <div className="bottom-nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = screen === t.key || (t.key === "profil" && screen === "profilPro");
            return (
              <button key={t.key} className={"nav-btn" + (active ? " on" : "")} onClick={() => { setScreen(t.key); setActiveConvId(null); }}>
                {t.key === "creer" ? <div className="nav-publier"><Icon size={18} /></div> : <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />}
                {t.label && <span>{t.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {quote.open && (
        <div className="modal-overlay" onClick={() => setQuote({ open: false, pro: null, mode: "devis" })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <span>{quote.mode === "devis" ? "Demander un devis" : "Être rappelé"} — {quote.pro?.entreprise}</span>
              <button onClick={() => setQuote({ open: false, pro: null, mode: "devis" })}><X size={16} /></button>
            </div>
            {quote.mode === "devis" ? (
              <>
                <select className="create-select" defaultValue={quote.pro?.metier}>
                  {METIERS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <textarea className="create-textarea" placeholder="Décrivez votre projet..." />
                <input className="create-input" placeholder="Ville ou adresse" />
                <input className="create-input" placeholder="Budget approximatif (facultatif)" />
              </>
            ) : (
              <>
                <input className="create-input" placeholder="Votre nom" />
                <input className="create-input" placeholder="Votre numéro" />
                <div className="chip-row">
                  {["Matin", "Midi", "Après-midi", "Soir"].map((c) => <button key={c} className="chip">{c}</button>)}
                </div>
              </>
            )}
            <button className="btn-main btn-block" onClick={submitQuote}>
              {quote.mode === "devis" ? "Envoyer ma demande" : "Demander à être rappelé"}
            </button>
          </div>
        </div>
      )}
    </StyleWrap>
  );
}

/* ================================================================== */
/*  PROFIL — moi (pro ou particulier)                                  */
/* ================================================================== */

function ProfilOwnScreen({ userType, following, saved, onAddPartner, onViewProfile }) {
  const me = proProfiles[1]; // "mon" compte pro de démo
  const [showAdd, setShowAdd] = useState(false);

  if (userType === "particulier") {
    return (
      <div className="profil-scroll">
        <div className="profil-cover" />
        <div className="profil-head">
          <Avatar seed={9} size={76} />
          <div className="profil-name">Vous</div>
          <div className="profil-metier">Particulier</div>
          <div className="profil-stats">
            <div><b>{following.size}</b><span>Abonnements</span></div>
            <div><b>{saved.size}</b><span>Enregistrés</span></div>
          </div>
        </div>
        <div className="portfolio-label">Professionnels suivis</div>
        <div className="artisan-list" style={{ padding: "0 16px 20px" }}>
          {[...following].map((id) => (
            <div className="artisan-row" key={id}>
              <Avatar seed={id} size={40} />
              <div className="artisan-info">
                <div className="artisan-name">{proProfiles[id].entreprise}</div>
                <div className="artisan-meta">{proProfiles[id].metier} · {proProfiles[id].ville}</div>
              </div>
              <button className="btn-mini" onClick={() => onViewProfile(id)}>Profil</button>
            </div>
          ))}
          {following.size === 0 && <div className="empty-state">Vous ne suivez encore aucun professionnel.</div>}
        </div>
      </div>
    );
  }

  const candidats = Object.values(proProfiles).filter((p) => p.id !== me.id && !me.partners.includes(p.id));

  return (
    <div className="profil-scroll">
      <div className="profil-cover" />
      <div className="profil-head">
        <Avatar seed={me.id} size={76} />
        <div className="profil-name">{me.entreprise} {me.verifie && <BadgeCheck size={16} className="verif-ic" />}</div>
        <div className="profil-metier">{me.metier} · {me.ville}</div>
        <div className="profil-sub">SIRET {me.siret} vérifié · {me.assurance.valide ? "Assurance décennale à jour" : "Assurance non renseignée"}</div>
        <div className="profil-stats">
          <div><b>{me.portfolio.length}</b><span>Réalisations</span></div>
          <div><b>{me.followers}</b><span>Abonnés</span></div>
          <div><b>{avgReviews(me).count ? avgReviews(me).global.toFixed(1) : "—"}</b><span>Note</span></div>
        </div>
      </div>
      <p className="profil-bio">{me.bio}</p>

      <div className="portfolio-label">Portfolio de chantiers</div>
      <div className="portfolio-grid">
        {me.portfolio.map((g, i) => <div className="portfolio-cell" style={{ background: grad(g) }} key={i} />)}
      </div>

      <div className="portfolio-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Mes partenaires</span>
        <button className="btn-mini" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? "Fermer" : "+ Ajouter"}
        </button>
      </div>
      <div className="artisan-list" style={{ padding: "0 16px 24px" }}>
        {me.partners.map((id) => (
          <div className="artisan-row" key={id}>
            <Avatar seed={id} size={40} />
            <div className="artisan-info">
              <div className="artisan-name">{proProfiles[id].entreprise}</div>
              <div className="artisan-meta">{proProfiles[id].metier} · {proProfiles[id].ville}</div>
            </div>
            <button className="btn-mini" onClick={() => onViewProfile(id)}>Profil</button>
          </div>
        ))}
        {me.partners.length === 0 && !showAdd && (
          <div className="empty-state">Vous n'avez pas encore ajouté de partenaire. Développez votre réseau Opus.</div>
        )}
        {showAdd && candidats.map((c) => (
          <div className="artisan-row" key={c.id}>
            <Avatar seed={c.id} size={40} />
            <div className="artisan-info">
              <div className="artisan-name">{c.entreprise}</div>
              <div className="artisan-meta">{c.metier} · {c.ville}</div>
            </div>
            <button className="btn-mini" onClick={() => onAddPartner(me.id, c.id)}>Ajouter</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PROFIL — un autre professionnel                                    */
/* ================================================================== */

function CritereBar({ label, value }) {
  return (
    <div className="crit-row">
      <span className="crit-label">{label}</span>
      <div className="crit-bar"><div className="crit-bar-fill" style={{ width: `${(value / 5) * 100}%` }} /></div>
      <span className="crit-val">{value ? value.toFixed(1) : "—"}</span>
    </div>
  );
}

function ProfilProScreen({ pro, following, onFollow, onContact, onViewProfile }) {
  const [reviews, setReviews] = useState(pro.reviews);
  const [showForm, setShowForm] = useState(false);
  const [rDelais, setRDelais] = useState(5);
  const [rQualite, setRQualite] = useState(5);
  const [rTarif, setRTarif] = useState(5);
  const [rTexte, setRTexte] = useState("");
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const proWithReviews = { ...pro, reviews };
  const avg = avgReviews(proWithReviews);

  const submitReview = () => {
    if (!rTexte.trim()) return;
    const newReview = { id: Date.now(), auteur: "Vous", verifie: true, date: "À l'instant", delais: rDelais, qualite: rQualite, tarif: rTarif, commentaire: rTexte.trim() };
    const updated = [newReview, ...reviews];
    setReviews(updated);
    pro.reviews = updated; // persiste tant que la session est ouverte
    setRTexte(""); setShowForm(false);
  };

  const generateSummary = async () => {
    if (reviews.length === 0) return;
    setAiLoading(true); setAiError(false);
    try {
      const avisTexte = reviews.map((r) => `- (délais ${r.delais}/5, qualité ${r.qualite}/5, tarif ${r.tarif}/5) ${r.commentaire}`).join("\n");
      const summary = await askClaude(
        `Voici les avis clients pour l'artisan "${pro.entreprise}" (${pro.metier}) :\n${avisTexte}\n\nRésume ces avis en 2 à 3 phrases claires pour un particulier qui hésite à le contacter.`,
        "Tu résumes des avis clients d'un artisan du BTP en français, de façon neutre, concise et utile. N'invente aucune information absente des avis fournis. Réponds uniquement avec le résumé, sans préambule."
      );
      setAiSummary(summary.trim());
    } catch (e) {
      setAiError(true);
    }
    setAiLoading(false);
  };

  return (
    <div className="profil-scroll">
      <div className="profil-cover" />
      <div className="profil-head">
        <Avatar seed={pro.id} size={76} />
        <div className="profil-name">{pro.entreprise} {pro.verifie && <BadgeCheck size={16} className="verif-ic" />}</div>
        <div className="profil-metier">{pro.metier} · {pro.ville}</div>
        <div className="profil-sub">{pro.exp} ans d'expérience · {avg.count} avis vérifiés</div>
        <div className="profil-stats">
          <div><b>{pro.portfolio.length}</b><span>Réalisations</span></div>
          <div><b>{pro.followers + (following ? 1 : 0)}</b><span>Abonnés</span></div>
          <div><b>{avg.count ? avg.global.toFixed(1) : "—"}</b><span>Note</span></div>
        </div>
        <div className="profil-btns">
          <button className="btn-main" onClick={() => onContact(pro, "devis")}>Demander un devis</button>
          <button className={"btn-outline" + (following ? " btn-outline-on" : "")} onClick={() => onFollow(pro.id)}>
            {following ? "Suivi ✓" : "Suivre"}
          </button>
        </div>
        <button className="link-btn" onClick={() => onContact(pro, "message")}><MessageCircle size={13} /> Envoyer un message</button>
      </div>
      <p className="profil-bio">{pro.bio}</p>

      <div className="portfolio-label">Informations vérifiées</div>
      <div className="verif-block">
        <div className={"verif-row" + (pro.assurance.valide ? " verif-ok" : " verif-bad")}>
          {pro.assurance.valide ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
          <span>Assurance décennale</span>
          <b>{pro.assurance.valide ? `À jour · exp. ${pro.assurance.expire}` : "Non communiquée"}</b>
        </div>
        <div className={"verif-row" + (pro.kbis.valide ? " verif-ok" : " verif-bad")}>
          {pro.kbis.valide ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
          <span>Extrait Kbis</span>
          <b>{pro.kbis.valide ? `À jour · maj ${pro.kbis.maj}` : "Non communiqué"}</b>
        </div>
        <div className={"verif-row" + (pro.rge ? " verif-ok" : " verif-bad")}>
          {pro.rge ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
          <span>Certification RGE</span>
          <b>{pro.rge ? "Certifié" : "Non certifié"}</b>
        </div>
      </div>

      <div className="portfolio-label">Réalisations</div>
      <div className="portfolio-grid">
        {pro.portfolio.map((g, i) => <div className="portfolio-cell" style={{ background: grad(g) }} key={i} />)}
      </div>

      <div className="portfolio-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Avis clients vérifiés</span>
        <button className="btn-mini" onClick={() => setShowForm((s) => !s)}>{showForm ? "Fermer" : "Laisser un avis"}</button>
      </div>

      {avg.count > 0 && (
        <div className="rating-block">
          <CritereBar label="Respect des délais" value={avg.delais} />
          <CritereBar label="Qualité du travail" value={avg.qualite} />
          <CritereBar label="Rapport qualité-prix" value={avg.tarif} />
        </div>
      )}

      {avg.count > 0 && (
        <div className="ai-summary-box">
          <div className="ai-summary-head"><Sparkles size={14} /> Résumé IA des avis</div>
          {aiSummary ? (
            <p>{aiSummary}</p>
          ) : (
            <button className="btn-mini btn-mini-outline" onClick={generateSummary} disabled={aiLoading}>
              {aiLoading ? <><Loader2 size={12} className="spin" /> Génération...</> : "Générer un résumé IA"}
            </button>
          )}
          {aiError && <div className="ai-error">Le résumé IA n'a pas pu être généré. Réessayez.</div>}
        </div>
      )}

      {showForm && (
        <div className="review-form">
          <div className="slider-row"><span>Respect des délais</span><input type="range" min="1" max="5" value={rDelais} onChange={(e) => setRDelais(+e.target.value)} /><b>{rDelais}/5</b></div>
          <div className="slider-row"><span>Qualité du travail</span><input type="range" min="1" max="5" value={rQualite} onChange={(e) => setRQualite(+e.target.value)} /><b>{rQualite}/5</b></div>
          <div className="slider-row"><span>Rapport qualité-prix</span><input type="range" min="1" max="5" value={rTarif} onChange={(e) => setRTarif(+e.target.value)} /><b>{rTarif}/5</b></div>
          <textarea className="create-textarea" placeholder="Votre expérience avec cet artisan..." value={rTexte} onChange={(e) => setRTexte(e.target.value)} />
          <button className="btn-main btn-block" onClick={submitReview}>Publier l'avis</button>
        </div>
      )}

      <div className="review-list">
        {reviews.map((r) => (
          <div className="review-card" key={r.id}>
            <div className="review-top">
              <span className="review-auteur">{r.auteur}</span>
              {r.verifie && <span className="review-badge"><ClipboardCheck size={11} /> Client vérifié</span>}
              <span className="review-date">{r.date}</span>
            </div>
            <div className="review-scores">
              <span>Délais {r.delais}/5</span><span>Qualité {r.qualite}/5</span><span>Tarif {r.tarif}/5</span>
            </div>
            <p className="review-texte">{r.commentaire}</p>
          </div>
        ))}
        {reviews.length === 0 && <div className="empty-state">Aucun avis pour le moment — soyez le premier à en laisser un.</div>}
      </div>

      <div className="portfolio-label">Partenaires</div>
      <div className="artisan-list" style={{ padding: "0 16px 24px" }}>
        {pro.partners.map((id) => (
          <div className="artisan-row" key={id}>
            <Avatar seed={id} size={40} />
            <div className="artisan-info">
              <div className="artisan-name">{proProfiles[id].entreprise}</div>
              <div className="artisan-meta">{proProfiles[id].metier} · {proProfiles[id].ville}</div>
            </div>
            <button className="btn-mini" onClick={() => onViewProfile(id)}>Profil</button>
          </div>
        ))}
        {pro.partners.length === 0 && <div className="empty-state">Aucun partenaire pour le moment.</div>}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  STYLES                                                              */
/* ================================================================== */

function StyleWrap({ children }) {
  return (
    <div className="app-outer">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        :root{
          --ink:#1A1B19; --bg:#E7E4DC; --surface:#FFFFFF; --line:#CFC9BB;
          --accent:#E85C1F; --accent-2:#1B4B6B; --muted:#726E63;
        }
        .app-outer{ display:flex; justify-content:center; align-items:flex-start; font-family:'Inter',sans-serif; color:var(--ink); padding:16px 0; position:relative; }
        .phone{ width:380px; height:800px; background:var(--bg); border-radius:34px; overflow:hidden; position:relative;
          box-shadow:0 20px 50px rgba(0,0,0,0.35); display:flex; flex-direction:column; border:6px solid #111; }

        .topbrand{ background:var(--surface); border-bottom:1px solid var(--line); flex-shrink:0; }
        .hazard-strip{ height:5px; background:repeating-linear-gradient(135deg,var(--accent) 0 10px,#1A1B19 10px 20px); }
        .topbrand-row{ display:flex; align-items:center; justify-content:space-between; padding:10px 14px; }
        .topbrand-left{ display:flex; align-items:center; gap:8px; }
        .brand-word{ font-family:'Oswald',sans-serif; font-weight:700; font-size:18px; letter-spacing:0.5px; }
        .bell-badge{ position:absolute; top:-3px; right:-4px; background:var(--accent); color:#111; font-size:9px; font-weight:700;
          border-radius:50%; width:15px; height:15px; display:flex; align-items:center; justify-content:center; }
        .icon-btn{ position:relative; background:none; border:none; cursor:pointer; color:var(--ink); padding:4px; display:flex; }
        .backbar{ display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--surface); border-bottom:1px solid var(--line); flex-shrink:0; }
        .backbar-title{ font-family:'Oswald',sans-serif; font-weight:600; font-size:14px; }

        .confirm-banner{ position:absolute; top:60px; left:50%; transform:translateX(-50%); z-index:20;
          background:#1A1B19; color:#fff; font-size:11.5px; padding:8px 14px; border-radius:20px;
          display:flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 6px 16px rgba(0,0,0,0.3); }

        .body-area{ flex:1; overflow:hidden; position:relative; background:var(--bg); }
        .home-wrap{ height:100%; display:flex; flex-direction:column; }
        .mode-row{ display:flex; flex-direction:column; gap:8px; padding:10px 14px; background:var(--surface); border-bottom:1px solid var(--line); flex-shrink:0; }
        .pill-toggle{ display:flex; background:var(--bg); border-radius:20px; padding:3px; width:fit-content; }
        .pill-toggle button{ border:none; background:none; font-family:'Oswald',sans-serif; font-weight:600; font-size:11.5px;
          padding:6px 14px; border-radius:16px; cursor:pointer; color:var(--muted); }
        .pill-toggle button.on{ background:var(--ink); color:#fff; }
        .pill-toggle-sm button{ font-size:10.5px; padding:5px 11px; }

        .classic-scroll{ flex:1; overflow-y:auto; padding:10px 12px 16px; display:flex; flex-direction:column; gap:10px; }
        .post-card{ background:var(--surface); border:1px solid var(--line); }
        .post-head{ display:flex; align-items:center; justify-content:space-between; padding:10px 12px 6px; }
        .post-head-left{ display:flex; align-items:center; gap:9px; background:none; border:none; cursor:pointer; text-align:left; }
        .post-name{ font-weight:600; font-size:13px; display:flex; align-items:center; gap:4px; }
        .post-meta{ font-size:10.5px; color:var(--muted); margin-top:1px; }
        .post-head-right{ display:flex; align-items:center; gap:6px; }
        .avatar{ border-radius:50%; flex-shrink:0; }
        .verif-ic{ color:#4FA9E0; flex-shrink:0; }
        .chip-follow{ font-family:'Oswald',sans-serif; font-size:10.5px; font-weight:600; padding:5px 10px;
          background:var(--ink); color:#fff; border:none; cursor:pointer; }
        .chip-followed{ background:var(--bg); color:var(--ink); border:1px solid var(--line); }
        .post-text{ font-size:12.8px; padding:4px 12px 8px; line-height:1.4; }
        .post-media{ width:100%; aspect-ratio:16/10; }
        .post-actions{ display:flex; align-items:center; gap:14px; padding:10px 12px; flex-wrap:wrap; }
        .post-action{ display:flex; align-items:center; gap:5px; font-size:12px; background:none; border:none; cursor:pointer; color:var(--muted); }
        .post-action.on{ color:var(--accent); }
        .contact-wrap{ position:relative; margin-left:auto; }
        .contact-pop{ position:absolute; right:0; bottom:34px; background:var(--surface); border:1px solid var(--line);
          box-shadow:0 8px 20px rgba(0,0,0,0.15); display:flex; flex-direction:column; z-index:10; width:190px; }
        .contact-pop button{ display:flex; align-items:center; gap:8px; padding:9px 12px; background:none; border:none;
          border-bottom:1px solid var(--line); text-align:left; font-size:12px; cursor:pointer; color:var(--ink); }
        .contact-pop button:last-child{ border-bottom:none; }

        .comments-zone{ border-top:1px solid var(--line); padding:8px 12px 10px; }
        .comment-row{ font-size:12px; padding:4px 0; }
        .comment-empty{ font-size:11.5px; color:var(--muted); padding:4px 0; }
        .comment-input-row{ display:flex; gap:6px; margin-top:6px; }
        .comment-input-row input{ flex:1; border:1px solid var(--line); padding:7px 10px; font-size:12px; font-family:'Inter'; }
        .comment-input-row button{ background:var(--ink); color:#fff; border:none; padding:0 12px; cursor:pointer; }

        .ad-card{ position:relative; }
        .ad-tag{ position:absolute; top:8px; left:8px; z-index:2; background:rgba(0,0,0,0.65); color:#fff;
          font-size:10px; font-family:'Oswald',sans-serif; padding:3px 8px; }
        .ad-annonceur{ font-family:'Oswald',sans-serif; font-weight:600; font-size:13px; padding-top:2px; }
        .btn-block{ width:100%; margin-top:8px; }

        /* --- vidéo (TikTok) --- */
        .feed-scroll{ height:100%; overflow-y:scroll; scroll-snap-type:y mandatory; background:#111; }
        .feed-card{ height:100%; scroll-snap-align:start; position:relative; display:flex; align-items:flex-end; }
        .feed-card-scrim{ position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.35) 100%); }
        .feed-actions{ position:absolute; right:10px; bottom:150px; z-index:2; display:flex; flex-direction:column; gap:16px; align-items:center; }
        .feed-action{ color:#fff; display:flex; flex-direction:column; align-items:center; gap:3px; font-size:11px; background:none; border:none; cursor:pointer; }
        .feed-action-icon{ width:38px; height:38px; border-radius:10px; background:rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; }
        .feed-action-icon.on{ color:var(--accent); }
        .feed-info{ position:relative; z-index:2; padding:0 16px 24px; color:#fff; }
        .feed-tag{ display:inline-block; background:var(--accent); color:#111; font-family:'Oswald',sans-serif; font-weight:600; font-size:11px; padding:3px 9px; margin-bottom:8px; }
        .ad-tag-video{ background:#fff; }
        .feed-name{ font-family:'Oswald',sans-serif; font-weight:600; font-size:16px; display:flex; align-items:center; gap:5px; }
        .feed-name-btn{ background:none; border:none; color:#fff; cursor:pointer; padding:0; }
        .feed-loc{ font-size:11px; opacity:0.85; display:flex; align-items:center; gap:3px; margin-top:2px; }
        .feed-text{ font-size:13px; margin-top:8px; line-height:1.4; max-width:250px; }
        .feed-btn-row{ display:flex; gap:8px; margin-top:12px; }
        .chip-follow-video{ background:rgba(255,255,255,0.2); }

        /* --- écrans généraux --- */
        .screen-pad{ padding:12px 16px; height:100%; overflow-y:auto; }
        .empty-state{ font-size:12.5px; color:var(--muted); text-align:center; padding:30px 20px; line-height:1.5; }
        .ai-match-box{ background:var(--surface); border:1px solid var(--accent-2); padding:12px; margin-bottom:14px; }
        .ai-match-results{ display:flex; flex-direction:column; gap:8px; margin-top:10px; }
        .ai-raison{ font-size:10.5px; color:var(--accent-2); margin-top:2px; line-height:1.3; }
        .search-bar{ display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--line); padding:10px 12px; color:var(--muted); }
        .search-bar input{ border:none; outline:none; background:transparent; font-size:13px; flex:1; font-family:'Inter'; }
        .chip-row{ display:flex; flex-wrap:wrap; gap:6px; margin:12px 0 16px; }
        .chip{ font-family:'Oswald',sans-serif; font-size:11px; padding:6px 11px; background:var(--surface); border:1px solid var(--line); color:var(--ink); cursor:pointer; }
        .chip-on{ background:var(--ink); color:#fff; border-color:var(--ink); }
        .artisan-list{ display:flex; flex-direction:column; gap:10px; }
        .artisan-row{ display:flex; align-items:center; gap:12px; background:var(--surface); border:1px solid var(--line); padding:10px 12px; width:100%; text-align:left; }
        .artisan-info{ flex:1; min-width:0; }
        .artisan-name{ font-weight:600; font-size:13px; display:flex; align-items:center; gap:4px; }
        .artisan-meta{ font-size:11.5px; color:var(--muted); margin-top:1px; }
        .artisan-rate{ font-size:11px; display:flex; align-items:center; gap:3px; margin-top:3px; }
        .star-ic{ color:var(--accent); fill:var(--accent); }
        .artisan-btns{ display:flex; flex-direction:column; gap:5px; }
        .btn-mini{ font-family:'Oswald',sans-serif; font-size:11px; font-weight:600; background:var(--accent); color:#111; border:none; padding:7px 11px; cursor:pointer; white-space:nowrap; }
        .btn-mini-outline{ background:none; border:1px solid var(--ink); color:var(--ink); }

        .create-types{ display:flex; gap:6px; overflow-x:auto; padding-bottom:6px; }
        .create-type{ display:flex; flex-direction:column; align-items:center; gap:4px; font-size:10.5px; background:var(--surface);
          border:1px solid var(--line); padding:10px 12px; cursor:pointer; flex-shrink:0; color:var(--muted); font-family:'Oswald',sans-serif; }
        .create-type.on{ background:var(--ink); color:#fff; border-color:var(--ink); }
        .create-media{ height:130px; margin:10px 0; display:flex; align-items:center; justify-content:center; }
        .create-textarea{ width:100%; min-height:70px; border:1px solid var(--line); padding:10px; font-family:'Inter'; font-size:12.5px; resize:none; margin-bottom:10px; }
        .create-row{ display:flex; gap:8px; margin-bottom:14px; }
        .create-select, .create-input{ flex:1; border:1px solid var(--line); padding:9px 10px; font-size:12px; font-family:'Inter'; background:var(--surface); }

        .msg-list{ display:flex; flex-direction:column; }
        .msg-row{ display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px solid var(--line); background:none; border-left:none; border-right:none; border-top:none; width:100%; text-align:left; cursor:pointer; }
        .msg-body{ flex:1; min-width:0; }
        .msg-top{ display:flex; justify-content:space-between; }
        .msg-name{ font-weight:600; font-size:13.5px; }
        .msg-time{ font-size:11px; color:var(--muted); }
        .msg-preview{ font-size:12px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .conv-wrap{ height:100%; display:flex; flex-direction:column; }
        .conv-scroll{ flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:8px; }
        .bubble{ background:var(--surface); border:1px solid var(--line); padding:8px 12px; border-radius:12px; font-size:12.5px; max-width:75%; align-self:flex-start; }
        .bubble-moi{ background:var(--ink); color:#fff; align-self:flex-end; }
        .conv-input-row{ display:flex; gap:8px; padding:10px 12px; border-top:1px solid var(--line); background:var(--surface); }
        .conv-input-row input{ flex:1; border:1px solid var(--line); padding:9px 12px; font-size:12.5px; font-family:'Inter'; }
        .conv-input-row button{ background:var(--ink); color:#fff; border:none; padding:0 14px; cursor:pointer; }

        .notif-row{ display:flex; align-items:center; gap:8px; padding:12px 4px; border-bottom:1px solid var(--line);
          font-size:12.5px; background:none; border-left:none; border-right:none; border-top:none; width:100%; text-align:left; cursor:pointer; }
        .notif-unread{ font-weight:600; }
        .notif-dot{ width:7px; height:7px; border-radius:50%; background:var(--accent); flex-shrink:0; }

        .profil-scroll{ height:100%; overflow-y:auto; }
        .profil-cover{ height:100px; background:linear-gradient(120deg,#1B4B6B,#3a3a38); }
        .profil-head{ padding:0 16px 6px; text-align:center; margin-top:-34px; }
        .profil-name{ font-family:'Oswald',sans-serif; font-weight:600; font-size:17px; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:5px; }
        .profil-metier{ font-size:12.5px; color:var(--muted); margin-top:2px; }
        .profil-sub{ font-size:11px; color:var(--accent-2); margin-top:4px; font-weight:600; }
        .profil-bio{ font-size:12px; color:var(--muted); padding:6px 20px 4px; text-align:center; line-height:1.5; }
        .profil-stats{ display:flex; justify-content:center; gap:26px; margin:14px 0; }
        .profil-stats div{ display:flex; flex-direction:column; align-items:center; font-size:11px; color:var(--muted); }
        .profil-stats b{ font-family:'Oswald',sans-serif; font-size:16px; color:var(--ink); }
        .profil-btns{ display:flex; gap:8px; justify-content:center; margin-bottom:8px; }
        .btn-main{ font-family:'Oswald',sans-serif; font-weight:600; font-size:12.5px; background:var(--ink); color:#fff; border:none; padding:9px 18px; cursor:pointer; }
        .btn-outline{ font-family:'Oswald',sans-serif; font-weight:600; font-size:12.5px; background:transparent; color:var(--ink); border:1.5px solid var(--ink); padding:9px 18px; cursor:pointer; }
        .btn-outline-on{ background:var(--ink); color:#fff; }
        .link-btn{ display:flex; align-items:center; gap:5px; justify-content:center; margin:0 auto; background:none; border:none; color:var(--accent-2); font-size:11.5px; font-weight:600; cursor:pointer; }
        .portfolio-label{ font-family:'Oswald',sans-serif; font-size:12.5px; font-weight:600; padding:14px 16px 8px; }
        .portfolio-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:2px; padding:0 2px 6px; }
        .portfolio-cell{ aspect-ratio:1; }

        .verif-block{ display:flex; flex-direction:column; gap:6px; padding:0 16px 6px; }
        .verif-row{ display:flex; align-items:center; gap:8px; font-size:11.5px; background:var(--surface); border:1px solid var(--line); padding:8px 10px; }
        .verif-row span{ flex:1; color:var(--muted); }
        .verif-row b{ font-size:11px; }
        .verif-ok{ color:#1F7A4D; }
        .verif-ok b{ color:#1F7A4D; }
        .verif-bad{ color:#B4432B; }
        .verif-bad b{ color:#B4432B; }

        .rating-block{ padding:2px 16px 10px; display:flex; flex-direction:column; gap:7px; }
        .crit-row{ display:flex; align-items:center; gap:8px; }
        .crit-label{ font-size:11px; color:var(--muted); width:120px; flex-shrink:0; }
        .crit-bar{ flex:1; height:6px; background:var(--line); border-radius:4px; overflow:hidden; }
        .crit-bar-fill{ height:100%; background:var(--accent); }
        .crit-val{ font-size:11px; font-weight:600; width:26px; text-align:right; }

        .ai-summary-box{ margin:0 16px 14px; background:var(--surface); border:1px solid var(--accent-2); padding:10px 12px; }
        .ai-summary-head{ display:flex; align-items:center; gap:6px; font-family:'Oswald',sans-serif; font-weight:600; font-size:12px; color:var(--accent-2); margin-bottom:6px; }
        .ai-summary-box p{ font-size:12px; line-height:1.5; color:var(--ink); }
        .ai-error{ font-size:11px; color:#B4432B; margin-top:4px; }
        .spin{ animation:spin 1s linear infinite; }
        @keyframes spin{ from{transform:rotate(0deg);} to{transform:rotate(360deg);} }

        .review-form{ margin:0 16px 14px; background:var(--surface); border:1px solid var(--line); padding:12px; display:flex; flex-direction:column; gap:8px; }
        .slider-row{ display:flex; align-items:center; gap:8px; font-size:11px; color:var(--muted); }
        .slider-row span{ width:120px; flex-shrink:0; }
        .slider-row input{ flex:1; }
        .slider-row b{ width:28px; text-align:right; color:var(--ink); }

        .review-list{ display:flex; flex-direction:column; gap:8px; padding:0 16px 6px; }
        .review-card{ background:var(--surface); border:1px solid var(--line); padding:10px 12px; }
        .review-top{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .review-auteur{ font-weight:600; font-size:12px; }
        .review-badge{ display:flex; align-items:center; gap:3px; font-size:9.5px; background:#E7F3EC; color:#1F7A4D; padding:2px 6px; border-radius:8px; }
        .review-date{ font-size:10.5px; color:var(--muted); margin-left:auto; }
        .review-scores{ display:flex; gap:10px; font-size:10px; color:var(--muted); margin:4px 0; }
        .review-texte{ font-size:12px; line-height:1.4; }

        .bottom-nav{ display:flex; background:var(--surface); border-top:1px solid var(--line); flex-shrink:0; padding:8px 6px 12px; }
        .nav-btn{ flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; cursor:pointer; color:var(--muted); font-size:9.5px; font-family:'Inter'; font-weight:500; }
        .nav-btn.on{ color:var(--ink); }
        .nav-publier{ width:40px; height:30px; background:var(--accent); color:#111; display:flex; align-items:center; justify-content:center; }

        .modal-overlay{ position:absolute; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:flex-end; z-index:30; }
        .modal-card{ background:var(--surface); width:100%; padding:16px; display:flex; flex-direction:column; gap:8px; max-height:80%; overflow-y:auto; }
        .modal-head{ display:flex; justify-content:space-between; align-items:center; font-family:'Oswald',sans-serif; font-weight:600; font-size:13px; margin-bottom:6px; }
        .modal-head button{ background:none; border:none; cursor:pointer; color:var(--ink); }

        /* --- onboarding --- */
        .onboard{ width:380px; height:800px; border-radius:34px; overflow:hidden; border:6px solid #111;
          background:linear-gradient(160deg,#1A1B19,#3a3a38 60%,#1B4B6B); display:flex; flex-direction:column;
          align-items:center; padding:0 26px 30px; color:#fff; position:relative; }
        .onboard-hazard{ height:6px; width:100%; background:repeating-linear-gradient(135deg,var(--accent) 0 10px,#111 10px 20px); }
        .onboard-icons{ display:flex; gap:16px; margin-top:60px; opacity:0.85; }
        .onboard-brand{ font-family:'Oswald',sans-serif; font-weight:700; font-size:34px; margin-top:24px; letter-spacing:0.5px; }
        .onboard-brand span{ color:var(--accent); }
        .onboard-tag{ font-size:13px; opacity:0.85; margin-top:6px; }
        .onboard-spacer{ flex:1; }
        .onboard-btn{ width:100%; padding:14px; font-family:'Oswald',sans-serif; font-weight:600; font-size:13px; border:none; cursor:pointer; margin-bottom:10px; letter-spacing:0.3px; }
        .onboard-btn-pro{ background:var(--accent); color:#111; }
        .onboard-btn-part{ background:rgba(255,255,255,0.12); color:#fff; border:1px solid rgba(255,255,255,0.4); }
        .onboard-note{ font-size:10px; opacity:0.6; text-align:center; }
      `}</style>
      {children}
    </div>
  );
}
