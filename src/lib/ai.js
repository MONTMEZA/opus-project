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

/**
 * Erreur lisible quand l'application tourne SANS Supabase.
 *
 * Le message parlait d'« Edge Function manquante », ce qui envoyait chercher
 * la panne côté serveur alors que la fonction est déployée : c'est
 * l'application qui n'est reliée à rien, faute de fichier `.env`. Un message
 * qui désigne le mauvais coupable coûte plus cher que pas de message.
 */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("L'application tourne en mode démonstration, sans connexion à "
      + 'Supabase : ajoutez un fichier .env pour joindre l\'assistant IA.');
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

/**
 * Améliore un texte que l'artisan a DÉJÀ écrit — description de publication
 * ou présentation d'entreprise.
 *
 * La différence avec `aiRedigerPresentation` est essentielle : ici l'IA ne
 * part pas d'un questionnaire, elle part de SES mots. Elle corrige, elle
 * remet d'aplomb, elle range — elle ne remplace pas. La consigne côté
 * serveur lui interdit la phrase passe-partout : si une phrase pouvait
 * servir à n'importe quel autre artisan, elle est à refaire.
 *
 * `profil` sert à COMPRENDRE (savoir qu'une « dalle » relève de la
 * maçonnerie), pas à remplir : le serveur a interdiction d'ajouter le nom
 * de l'entreprise ou la ville si l'artisan ne les a pas écrits.
 *
 * Retourne [{ titre, texte }].
 */
export async function aiAmeliorerTexte({ texte, contexte = 'publication', profil = {} }) {
  const data = await callAiFunction({ action: 'ameliorer', texte, contexte, profil });
  const liste = (data && data.propositions) || [];
  return liste
    .filter((p) => p && typeof p.texte === 'string' && p.texte.trim())
    .map((p) => ({ titre: String(p.titre || 'Proposition'), texte: p.texte.trim() }));
}

/** Utilisé par l'écran de réglages pour expliquer l'état du backend IA. */
export const aiBackendUrl = hasSupabase ? `${SUPABASE_URL}/functions/v1/ai` : null;
export const aiBackendReady = Boolean(SUPABASE_ANON_KEY);
