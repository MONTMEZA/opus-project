/**
 * Fonctions IA de l'app.
 *
 * SÉCURITÉ — point important par rapport au prototype web :
 * le prototype appelait https://api.anthropic.com directement depuis le navigateur.
 * Dans une vraie app mobile c'est interdit : le fichier JavaScript de l'app est
 * lisible sur le téléphone, donc la clé API serait volable.
 *
 * Ici, le téléphone appelle une Edge Function Supabase (supabase/functions/ai),
 * qui appelle Anthropic côté serveur avec la clé rangée dans les secrets Supabase.
 * Aucune clé Anthropic ne circule dans ce fichier.
 */
import { supabase, hasSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

/** Erreur lisible quand le backend IA n'est pas encore branché. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("L'assistant IA n'est pas encore configuré (Edge Function Supabase manquante).");
  }
}

async function callAiFunction(payload) {
  if (!hasSupabase) throw new AiNotConfiguredError();
  const { data, error } = await supabase.functions.invoke('ai', { body: payload });
  if (error) throw error;
  if (data && data.error) throw new Error(data.error);
  return data;
}

/**
 * Écran Découvrir — l'IA lit le besoin décrit par l'utilisateur
 * et renvoie les artisans pertinents avec une explication.
 * Retourne [{ proId, pertinence, raison }]
 */
export async function aiMatchPros(besoin, artisans) {
  const data = await callAiFunction({ action: 'match', besoin, artisans });
  const recs = (data && data.recommandations) || [];
  return recs;
}

/**
 * Profil d'un professionnel — résumé des avis en 2-3 phrases.
 * Retourne une chaîne de caractères.
 */
export async function aiSummarizeReviews(pro, reviews) {
  const data = await callAiFunction({
    action: 'summary',
    entreprise: pro.entreprise,
    metier: pro.metier,
    avis: reviews.map((r) => ({
      delais: r.delais, qualite: r.qualite, tarif: r.tarif, commentaire: r.commentaire,
    })),
  });
  return String((data && data.resume) || '').trim();
}

/**
 * Écran « Modifier mon profil » — l'IA met en forme les réponses au
 * questionnaire et renvoie trois présentations au choix.
 *
 * Elle n'ajoute AUCUNE information : la consigne côté serveur le lui
 * interdit. Une présentation qui invente un label ou une garantie ferait
 * courir un vrai risque à l'artisan.
 *
 * Retourne [{ titre, texte }].
 */
export async function aiRedigerPresentation({ profil, reponses }) {
  /* On traduit les clés du questionnaire avant de les envoyer : « longue »
     ne veut rien dire pour le modèle, « depuis plus de dix ans » si. */
  const { reponsesLisibles } = await import('./presentation');
  const data = await callAiFunction({
    action: 'bio',
    profil,
    reponses: reponsesLisibles(reponses),
  });
  const liste = (data && data.propositions) || [];
  return liste
    .filter((p) => p && typeof p.texte === 'string' && p.texte.trim())
    .map((p) => ({ titre: String(p.titre || 'Proposition'), texte: p.texte.trim() }));
}

/** Utilisé par l'écran de réglages pour expliquer l'état du backend IA. */
export const aiBackendUrl = hasSupabase ? `${SUPABASE_URL}/functions/v1/ai` : null;
export const aiBackendReady = Boolean(SUPABASE_ANON_KEY);
