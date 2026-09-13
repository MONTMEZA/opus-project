/**
 * Couche de données de l'app.
 *
 * Deux modes, la même interface :
 *  - MODE DÉMO   : pas de .env → tout vit en mémoire (comportement du prototype).
 *  - MODE SUPABASE : .env rempli → lectures/écritures réelles dans la base.
 *
 * Les écrans n'appellent jamais Supabase directement : ils appellent ce fichier.
 * Ça permet de lancer l'app dans Expo Go avant même d'avoir créé la base.
 */
import { supabase, hasSupabase } from './supabase';
import {
  proProfiles as demoPros, initialPosts, initialConversations, initialNotifications,
} from '../data/demo';

export const mode = hasSupabase ? 'supabase' : 'demo';

/* ------------------------------------------------------------------ */
/*  Session                                                            */
/* ------------------------------------------------------------------ */

let currentUserId = null;

/**
 * En mode Supabase on ouvre une session anonyme (pas d'écran de connexion
 * dans le prototype). L'utilisateur est ensuite enregistré dans `users`
 * avec son type (pro / particulier).
 */
export async function ensureSession(userType) {
  if (!hasSupabase) { currentUserId = 'demo-user'; return currentUserId; }

  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  currentUserId = session.user.id;

  if (userType) {
    await supabase.from('users').upsert(
      { id: currentUserId, type: userType, nom: userType === 'pro' ? 'Mon entreprise' : 'Vous' },
      { onConflict: 'id' },
    );
  }
  return currentUserId;
}

export function getUserId() { return currentUserId; }

/* ------------------------------------------------------------------ */
/*  Lecture                                                            */
/* ------------------------------------------------------------------ */

/** Transforme une ligne `professional_profiles` en objet utilisé par les écrans. */
function rowToPro(row, reviews = [], partners = []) {
  return {
    id: row.id,
    nom: row.nom || '',
    entreprise: row.entreprise,
    metier: row.metier,
    ville: row.ville,
    verifie: !!row.verifie,
    exp: row.experience_annees || 0,
    siret: row.siret || '',
    followers: row.followers_count || 0,
    bio: row.bio || '',
    partners,
    assurance: { valide: !!row.assurance_valide, expire: row.assurance_expire },
    kbis: { valide: !!row.kbis_valide, maj: row.kbis_maj },
    rge: !!row.rge,
    portfolio: row.portfolio || [],
    reviews,
  };
}

function rowToReview(row) {
  return {
    id: row.id,
    auteur: row.auteur || 'Client',
    verifie: !!row.client_verifie,
    date: formatDate(row.created_at),
    delais: row.delais,
    qualite: row.qualite,
    tarif: row.tarif,
    commentaire: row.commentaire,
  };
}

function formatDate(iso) {
  if (!iso) return '';
  const MOIS = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
  const d = new Date(iso);
  return `${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Temps relatif simple, comme "Il y a 2 h" dans le prototype. */
export function relativeTime(iso) {
  if (!iso) return "À l'instant";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'Hier';
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

/**
 * Charge tout ce dont l'app a besoin au démarrage.
 * Retourne toujours la même forme, quel que soit le mode.
 */
export async function loadAll() {
  if (!hasSupabase) {
    return {
      pros: JSON.parse(JSON.stringify(demoPros)),
      posts: initialPosts.map((p) => ({ ...p, comments: p.comments ? [...p.comments] : undefined })),
      conversations: initialConversations.map((c) => ({ ...c, messages: [...c.messages] })),
      notifications: initialNotifications.map((n) => ({ ...n })),
      followingIds: [4],
      savedIds: [],
    };
  }

  const uid = currentUserId;

  const [profilesRes, reviewsRes, partnersRes, postsRes, commentsRes,
         likesRes, savesRes, followsRes, convRes, msgRes, notifRes] = await Promise.all([
    supabase.from('professional_profiles').select('*'),
    supabase.from('reviews').select('*, users:author_id(nom)').order('created_at', { ascending: false }),
    supabase.from('professional_partners').select('*'),
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('comments').select('*, users:author_id(nom)').order('created_at'),
    supabase.from('post_likes').select('post_id').eq('user_id', uid),
    supabase.from('saved_posts').select('post_id').eq('user_id', uid),
    supabase.from('follows').select('following_id').eq('follower_id', uid),
    supabase.from('conversations').select('*').or(`client_id.eq.${uid},professional_id.eq.${uid}`),
    supabase.from('messages').select('*').order('created_at'),
    supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
  ]);

  const err = [profilesRes, reviewsRes, partnersRes, postsRes].find((r) => r.error);
  if (err) throw err.error;

  const reviewsByPro = {};
  (reviewsRes.data || []).forEach((r) => {
    (reviewsByPro[r.professional_id] ||= []).push(
      rowToReview({ ...r, auteur: r.users ? r.users.nom : 'Client' }),
    );
  });

  const partnersByPro = {};
  (partnersRes.data || []).forEach((p) => {
    (partnersByPro[p.professional_id] ||= []).push(p.partner_id);
  });

  const pros = {};
  (profilesRes.data || []).forEach((row) => {
    pros[row.id] = rowToPro(row, reviewsByPro[row.id] || [], partnersByPro[row.id] || []);
  });

  const commentsByPost = {};
  (commentsRes.data || []).forEach((c) => {
    (commentsByPost[c.post_id] ||= []).push({
      id: c.id, auteur: c.users ? c.users.nom : 'Client', texte: c.texte,
    });
  });

  const likedSet = new Set((likesRes.data || []).map((l) => l.post_id));

  const posts = (postsRes.data || []).map((p) => (p.is_ad
    ? {
        id: p.id, type: 'ad', annonceur: p.annonceur, accroche: p.accroche,
        cta: p.cta, media: p.media,
      }
    : {
        id: p.id, type: 'post', proId: p.author_id, time: relativeTime(p.created_at),
        texte: p.texte, media: p.media, likes: p.likes_count || 0,
        liked: likedSet.has(p.id), comments: commentsByPost[p.id] || [],
      }));

  const msgsByConv = {};
  (msgRes.data || []).forEach((m) => {
    (msgsByConv[m.conversation_id] ||= []).push({
      from: m.sender_id === uid ? 'moi' : 'pro',
      texte: m.texte,
      heure: relativeTime(m.created_at),
    });
  });

  const conversations = (convRes.data || []).map((c) => ({
    id: c.id,
    proId: c.professional_id === uid ? c.client_id : c.professional_id,
    messages: msgsByConv[c.id] || [],
  }));

  return {
    pros,
    posts,
    conversations,
    notifications: (notifRes.data || []).map((n) => ({ id: n.id, texte: n.texte, lue: n.lue })),
    followingIds: (followsRes.data || []).map((f) => f.following_id),
    savedIds: (savesRes.data || []).map((s) => s.post_id),
  };
}

/* ------------------------------------------------------------------ */
/*  Écriture                                                           */
/*  Toutes ces fonctions ne font rien en mode démo : l'état local de    */
/*  l'app a déjà été mis à jour par l'écran (mise à jour optimiste).    */
/* ------------------------------------------------------------------ */

const noop = async () => null;

export const setLike = !hasSupabase ? noop : async (postId, liked) => {
  if (liked) {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId });
  } else {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
  }
};

export const setSaved = !hasSupabase ? noop : async (postId, saved) => {
  if (saved) {
    await supabase.from('saved_posts').insert({ post_id: postId, user_id: currentUserId });
  } else {
    await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', currentUserId);
  }
};

export const setFollow = !hasSupabase ? noop : async (proId, following) => {
  if (following) {
    await supabase.from('follows').insert({ follower_id: currentUserId, following_id: proId });
  } else {
    await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', proId);
  }
};

export const addComment = !hasSupabase ? noop : async (postId, texte) => {
  const { data } = await supabase.from('comments')
    .insert({ post_id: postId, author_id: currentUserId, texte })
    .select().single();
  return data;
};

export const createPost = !hasSupabase ? noop : async ({ type, texte, media, metier, ville }) => {
  const { data, error } = await supabase.from('posts')
    .insert({ author_id: currentUserId, type, texte, media, metier, ville })
    .select().single();
  if (error) throw error;
  return data;
};

export const createConversation = !hasSupabase ? noop : async (proId) => {
  const { data, error } = await supabase.from('conversations')
    .insert({ client_id: currentUserId, professional_id: proId })
    .select().single();
  if (error) throw error;
  return data;
};

export const sendMessage = !hasSupabase ? noop : async (conversationId, texte) => {
  const { data, error } = await supabase.from('messages')
    .insert({ conversation_id: conversationId, sender_id: currentUserId, texte })
    .select().single();
  if (error) throw error;
  return data;
};

export const markNotificationRead = !hasSupabase ? noop : async (id) => {
  await supabase.from('notifications').update({ lue: true }).eq('id', id);
};

/**
 * Enregistre un avis. `client_verifie` n'est PAS envoyé par l'app :
 * c'est un trigger Postgres qui le calcule à partir des devis / demandes
 * de rappel réellement acceptés (voir supabase/schema.sql).
 */
export const createReview = !hasSupabase ? noop : async ({ proId, delais, qualite, tarif, commentaire }) => {
  const { data, error } = await supabase.from('reviews')
    .insert({ professional_id: proId, author_id: currentUserId, delais, qualite, tarif, commentaire })
    .select().single();
  if (error) throw error;
  return data;
};

export const createQuoteRequest = !hasSupabase ? noop : async ({ proId, metier, description, ville, budget }) => {
  const { error } = await supabase.from('quote_requests')
    .insert({ client_id: currentUserId, professional_id: proId, metier, description, ville, budget });
  if (error) throw error;
};

export const createCallbackRequest = !hasSupabase ? noop : async ({ proId, nom, telephone, creneau }) => {
  const { error } = await supabase.from('callback_requests')
    .insert({ client_id: currentUserId, professional_id: proId, nom, telephone, creneau });
  if (error) throw error;
};

export const addPartner = !hasSupabase ? noop : async (proId, partnerId) => {
  const { error } = await supabase.from('professional_partners').insert([
    { professional_id: proId, partner_id: partnerId },
    { professional_id: partnerId, partner_id: proId },
  ]);
  if (error) throw error;
};
