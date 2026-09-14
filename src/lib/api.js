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
  initialDemandes,
} from '../data/demo';

export const mode = hasSupabase ? 'supabase' : 'demo';

/* ------------------------------------------------------------------ */
/*  Session                                                            */
/* ------------------------------------------------------------------ */

let currentUserId = null;

/** Mode démo : pas de vrai compte, un identifiant fictif suffit. */
export async function ensureSession(userType) {
  if (!hasSupabase) { currentUserId = 'demo-user'; return currentUserId; }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Aucune session ouverte.');
  currentUserId = session.user.id;
  return currentUserId;
}

/**
 * Reprend la session déjà ouverte sur ce téléphone, s'il y en a une.
 * Évite de redemander le mot de passe à chaque ouverture de l'app.
 * Renvoie { userId, userType } ou null.
 */
export async function restoreSession() {
  if (!hasSupabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  currentUserId = session.user.id;

  const { data } = await supabase.from('users').select('type').eq('id', currentUserId).maybeSingle();
  return { userId: currentUserId, userType: (data && data.type) || 'particulier' };
}

/**
 * Création de compte. Le type et le nom voyagent dans les métadonnées :
 * un trigger côté base crée la fiche dans `users` à partir de là
 * (voir cree_fiche_utilisateur dans schema.sql).
 *
 * Renvoie { session } — session vaut null quand Supabase exige une
 * confirmation par email avant d'ouvrir le compte.
 */
export async function signUp({ email, password, userType, nom }) {
  if (!hasSupabase) { currentUserId = 'demo-user'; return { session: true }; }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { type: userType, nom: nom.trim() } },
  });
  if (error) throw error;

  if (data.session) currentUserId = data.session.user.id;
  return { session: data.session };
}

/** Connexion à un compte existant. */
export async function signIn({ email, password }) {
  if (!hasSupabase) { currentUserId = 'demo-user'; return { userType: null }; }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  currentUserId = data.session.user.id;

  const { data: fiche } = await supabase.from('users')
    .select('type').eq('id', currentUserId).maybeSingle();
  return { userType: (fiche && fiche.type) || 'particulier' };
}

/**
 * Crée la fiche professionnelle si elle n'existe pas encore.
 * Appelée juste après l'inscription d'un pro : sans elle, l'artisan n'a
 * pas de profil public et n'apparaît nulle part.
 */
export async function ensureProProfile({
  entreprise, metier, ville, nom, codePostal, codeInsee, latitude, longitude,
}) {
  if (!hasSupabase) return null;

  const { data: existante } = await supabase.from('professional_profiles')
    .select('id').eq('id', currentUserId).maybeSingle();
  if (existante) return existante;

  const { data, error } = await supabase.from('professional_profiles').insert({
    id: currentUserId,
    nom: nom || '',
    entreprise: entreprise || 'Mon entreprise',
    metier: metier || 'Maçon',
    ville: ville || '',
    code_postal: codePostal || null,
    code_insee: codeInsee || null,
    latitude: latitude || null,
    longitude: longitude || null,
    verification_statut: 'non_soumis',
  }).select().single();
  if (error) throw error;
  return data;
}

/**
 * Envoi des justificatifs. Le profil passe en « en attente » : c'est VOUS
 * qui basculerez verification_statut sur 'verifie' depuis Supabase, après
 * avoir regardé les documents. Le badge vérifié ne s'obtient pas tout seul.
 */
export async function submitDocuments({ kbisPath, assurancePath }) {
  if (!hasSupabase) return null;
  const patch = { verification_statut: 'en_attente' };
  if (kbisPath) patch.kbis_url = kbisPath;
  if (assurancePath) patch.assurance_url = assurancePath;

  const { error } = await supabase.from('professional_profiles')
    .update(patch).eq('id', currentUserId);
  if (error) throw error;
}

export function getUserId() { return currentUserId; }

/** Ferme la session. En mode démo, il n'y a rien à fermer côté serveur. */
export async function signOut() {
  if (hasSupabase && supabase) await supabase.auth.signOut();
  currentUserId = null;
}

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
    avatarUrl: row.avatar_url || null,
    bannerUrl: row.banner_url || null,
    kbisPath: row.kbis_url || null,
    assurancePath: row.assurance_url || null,
    verificationStatut: row.verification_statut || 'non_soumis',
    verificationNote: row.verification_note || null,
    verifieLe: row.verifie_le || null,
    codePostal: row.code_postal || null,
    latitude: row.latitude || null,
    longitude: row.longitude || null,
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
    // En démonstration, l'état de vérification découle du drapeau `verifie`
    // des données d'exemple : un pro vérifié n'a pas de rappel à voir.
    const pros = JSON.parse(JSON.stringify(demoPros));
    Object.values(pros).forEach((p) => {
      p.verificationStatut = p.verifie ? 'verifie' : 'non_soumis';
    });
    return {
      pros,
      posts: initialPosts.map((p) => ({ ...p, comments: p.comments ? [...p.comments] : undefined })),
      conversations: initialConversations.map((c) => ({ ...c, messages: [...c.messages] })),
      demandes: initialDemandes.map((d) => ({ ...d })),
      mesSos: null,
      notifications: initialNotifications.map((n) => ({ ...n })),
      followingIds: [4],
      savedIds: [],
    };
  }

  const uid = currentUserId;

  const [profilesRes, reviewsRes, partnersRes, postsRes, commentsRes,
         likesRes, savesRes, followsRes, convRes, msgRes, notifRes,
         demandesRes, reponsesRes, masosRes] = await Promise.all([
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
    supabase.from('demandes').select('*, users:client_id(nom)').order('created_at', { ascending: false }),
    supabase.from('demande_reponses').select('demande_id'),
    supabase.from('sos_availability').select('*').eq('professional_id', uid).maybeSingle(),
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

  // Nombre de réponses par demande, compté ici plutôt qu'en interrogeant
  // la base une fois par demande.
  const nbReponses = {};
  (reponsesRes.data || []).forEach((r) => {
    nbReponses[r.demande_id] = (nbReponses[r.demande_id] || 0) + 1;
  });

  const demandes = (demandesRes.data || []).map((d) => ({
    id: d.id,
    auteurId: d.client_id,
    auteur: d.users ? d.users.nom : 'Un particulier',
    metier: d.metier,
    ville: d.ville || 'Non précisée',
    codePostal: d.code_postal,
    latitude: d.latitude,
    longitude: d.longitude,
    texte: d.texte,
    media: d.media,
    time: relativeTime(d.created_at),
    reponses: nbReponses[d.id] || 0,
  }));

  const ligne = masosRes.data;
  const mesSos = ligne ? {
    actif: ligne.actif,
    metierKey: ligne.metier_key,
    deplacement: Number(ligne.deplacement),
    horaire: Number(ligne.horaire),
    majoration: ligne.majoration,
    rayonKm: ligne.rayon_km,
    delaiMinutes: ligne.delai_minutes,
  } : null;

  return {
    pros,
    posts,
    conversations,
    demandes,
    mesSos,
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

/** Côté professionnel : ouvrir une conversation avec le particulier auteur d'une demande. */
export const createConversationWithClient = !hasSupabase ? noop : async (clientId) => {
  const { data, error } = await supabase.from('conversations')
    .insert({ client_id: clientId, professional_id: currentUserId })
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

/** Enregistre les modifications du profil (pro ou particulier). */
export const updateProfile = !hasSupabase ? noop : async ({ userType, profil }) => {
  if (userType === 'pro') {
    const { error } = await supabase.from('professional_profiles').update({
      entreprise: profil.entreprise,
      metier: profil.metier,
      ville: profil.ville,
      bio: profil.bio,
      siret: profil.siret,
      experience_annees: profil.exp,
      avatar_url: profil.avatarUrl,
      banner_url: profil.bannerUrl,
      code_postal: profil.codePostal || null,
      code_insee: profil.codeInsee || null,
      latitude: profil.latitude || null,
      longitude: profil.longitude || null,
    }).eq('id', currentUserId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('users').update({
      nom: profil.nom,
      ville: profil.ville,
      avatar_url: profil.avatarUrl,
      code_postal: profil.codePostal || null,
      latitude: profil.latitude || null,
      longitude: profil.longitude || null,
    }).eq('id', currentUserId);
    if (error) throw error;
  }
};

/**
 * Disponibilité aux urgences d'un artisan : l'interrupteur « je réponds aux
 * urgences » et les trois chiffres qui servent à calculer la fourchette.
 */
export const updateSosAvailability = !hasSupabase ? noop : async (sos) => {
  if (!sos) return;
  const { error } = await supabase.from('sos_availability').upsert({
    professional_id: currentUserId,
    metier_key: sos.metierKey,
    actif: sos.actif,
    deplacement: sos.deplacement,
    horaire: sos.horaire,
    majoration: sos.majoration,
    rayon_km: sos.rayonKm,
    delai_minutes: sos.delaiMinutes || 45,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'professional_id,metier_key' });
  if (error) throw error;
};

/** Publication d'une demande par un particulier. */
export const createDemande = !hasSupabase ? noop : async (
  { metier, ville, texte, media, codePostal, latitude, longitude },
) => {
  const { data, error } = await supabase.from('demandes').insert({
    client_id: currentUserId,
    metier, ville, texte, media: media || null,
    code_postal: codePostal || null,
    latitude: latitude || null,
    longitude: longitude || null,
  }).select().single();
  if (error) throw error;
  return data;
};

/** Un professionnel répond à une demande. */
export const repondreADemande = !hasSupabase ? noop : async (demandeId, message) => {
  const { error } = await supabase.from('demande_reponses').upsert(
    { demande_id: demandeId, professional_id: currentUserId, message: message || null },
    { onConflict: 'demande_id,professional_id' },
  );
  if (error) throw error;
};

/**
 * Les artisans disponibles autour d'une urgence.
 * Le tri par distance et le filtrage par rayon d'intervention sont faits
 * par la base (fonction artisans_urgence), pas par le téléphone.
 */
export const chercherArtisansUrgence = !hasSupabase ? noop : async (
  { metierKey, latitude, longitude },
) => {
  const { data, error } = await supabase.rpc('artisans_urgence', {
    p_metier_key: metierKey,
    p_lat: latitude,
    p_lon: longitude,
  });
  if (error) throw error;
  return (data || []).map((a) => ({
    proId: a.professional_id,
    metierKey,
    deplacement: Number(a.deplacement),
    horaire: Number(a.horaire),
    majoration: a.majoration,
    delaiMin: a.delai_minutes,
    distanceKm: a.distance,
    actif: true,
  }));
};

/** Enregistre la demande d'urgence envoyée à un artisan. */
export const createSosRequest = !hasSupabase ? noop : async (d) => {
  const { data, error } = await supabase.from('sos_requests').insert({
    client_id: currentUserId,
    professional_id: d.proId,
    metier_key: d.metierKey,
    probleme_key: d.problemeKey,
    probleme_label: d.probleme,
    adresse: d.adresse || null,
    details: d.details || null,
    creneau: d.creneau || 'immediat',
    code_postal: d.codePostal || null,
    latitude: d.latitude || null,
    longitude: d.longitude || null,
    prix_min: d.prixMin,
    prix_max: d.prixMax,
  }).select().single();
  if (error) throw error;
  return data;
};

export const addPartner = !hasSupabase ? noop : async (proId, partnerId) => {
  const { error } = await supabase.from('professional_partners').insert([
    { professional_id: proId, partner_id: partnerId },
    { professional_id: partnerId, partner_id: proId },
  ]);
  if (error) throw error;
};
