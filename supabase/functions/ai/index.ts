/**
 * Edge Function "ai" — le seul endroit du projet qui connaît la clé Anthropic.
 *
 * POURQUOI CETTE FONCTION EXISTE
 * Dans le prototype web, le navigateur appelait api.anthropic.com directement.
 * Impossible dans une vraie app mobile : le code JavaScript est lisible sur le
 * téléphone, donc la clé serait volée en quelques minutes. Ici, le téléphone
 * appelle cette fonction, et c'est elle — sur le serveur Supabase — qui appelle
 * Anthropic avec la clé rangée dans les secrets.
 *
 * DÉPLOIEMENT (voir README.md, section "Brancher l'IA") :
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy ai
 *
 * TROIS ACTIONS :
 *   { action: "match",   besoin, artisans }  -> { recommandations: [...] }
 *   { action: "summary", entreprise, metier, avis } -> { resume: "..." }
 *   { action: "bio",     profil, reponses }  -> { propositions: [{titre, texte}] }
 */
import Anthropic from 'npm:@anthropic-ai/sdk';

const MODEL = 'claude-opus-5';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

/** Récupère le texte de la réponse (on ignore les blocs de réflexion). */
function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json({ error: "La clé ANTHROPIC_API_KEY n'est pas configurée côté serveur." }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide.' }, 400);
  }

  const client = new Anthropic({ apiKey });

  try {
    /* ---------------- Mise en relation (écran Découvrir) ---------------- */
    if (payload.action === 'match') {
      const besoin = String(payload.besoin || '').slice(0, 2000);
      const artisans = Array.isArray(payload.artisans) ? payload.artisans.slice(0, 200) : [];
      if (!besoin.trim()) return json({ error: 'Besoin vide.' }, 400);

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        output_config: { effort: 'low' },
        system: `Tu es l'assistant de mise en relation d'un réseau social du BTP. Réponds UNIQUEMENT avec un JSON valide, sans aucun texte autour, de la forme exacte :
{"recommandations":[{"proId":"identifiant","pertinence":5,"raison":"courte phrase expliquant pourquoi ce pro correspond"}]}
Trie du plus pertinent au moins pertinent. N'utilise que des proId présents dans la liste fournie, recopiés à l'identique. Ne propose que des artisans dont le métier correspond réellement au besoin. Si aucun ne correspond, renvoie une liste vide.`,
        messages: [{
          role: 'user',
          content: `Besoin décrit par un particulier : "${besoin}"\n\n`
            + `Liste des artisans disponibles (JSON) :\n${JSON.stringify(artisans)}`,
        }],
      });

      const brut = textOf(message).replace(/```json|```/g, '').trim();
      let parsed: { recommandations?: unknown };
      try {
        parsed = JSON.parse(brut);
      } catch {
        return json({ error: "L'assistant IA a renvoyé une réponse illisible. Réessayez." }, 502);
      }
      const recommandations = Array.isArray(parsed.recommandations) ? parsed.recommandations : [];
      return json({ recommandations });
    }

    /* ---------------- Résumé des avis (profil d'un pro) ---------------- */
    if (payload.action === 'summary') {
      const avis = Array.isArray(payload.avis) ? payload.avis.slice(0, 100) : [];
      if (avis.length === 0) return json({ error: 'Aucun avis à résumer.' }, 400);

      const lignes = avis.map((r: Record<string, unknown>) =>
        `- (délais ${r.delais}/5, qualité ${r.qualite}/5, tarif ${r.tarif}/5) ${String(r.commentaire || '').slice(0, 600)}`,
      ).join('\n');

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 600,
        output_config: { effort: 'low' },
        system: "Tu résumes des avis clients d'un artisan du BTP en français, de façon neutre, concise et utile. N'invente aucune information absente des avis fournis. Réponds uniquement avec le résumé, sans préambule.",
        messages: [{
          role: 'user',
          content: `Voici les avis clients pour l'artisan "${payload.entreprise}" (${payload.metier}) :\n${lignes}\n\n`
            + `Résume ces avis en 2 à 3 phrases claires pour un particulier qui hésite à le contacter.`,
        }],
      });

      return json({ resume: textOf(message).trim() });
    }

    /* -------- Présentation d'un artisan (écran Modifier mon profil) -------- */
    if (payload.action === 'bio') {
      const profil = (payload.profil || {}) as Record<string, unknown>;
      const reponses = (payload.reponses || {}) as Record<string, unknown>;

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1200,
        output_config: { effort: 'low' },
        system: `Tu écris la présentation d'un artisan du bâtiment pour son profil public, en français.

RÈGLES ABSOLUES
- N'invente RIEN. Tu n'utilises que les informations fournies. Pas de label, pas de certification, pas de chiffre, pas de garantie qui ne soit pas dans les réponses.
- Pas de superlatif publicitaire ("leader", "expert incontournable", "excellence", "votre satisfaction est notre priorité"). Un artisan qui se relit doit reconnaître sa façon de parler.
- Français simple, phrases courtes. On s'adresse à un particulier qui hésite.
- Chaque proposition tient en 3 à 5 phrases, et ne mélange jamais "je" et "nous".

Réponds UNIQUEMENT avec un JSON valide, sans texte autour, de la forme exacte :
{"propositions":[{"titre":"Factuelle","texte":"..."},{"titre":"À la première personne","texte":"..."},{"titre":"Courte","texte":"..."}]}

"Factuelle" n'emploie ni "je" ni "nous". "À la première personne" emploie "je" si l'artisan travaille seul, "nous" sinon. "Courte" fait deux phrases au plus.`,
        messages: [{
          role: 'user',
          content: `Artisan :\n${JSON.stringify(profil)}\n\n`
            + `Ses réponses au questionnaire :\n${JSON.stringify(reponses)}`,
        }],
      });

      const brut = textOf(message).replace(/```json|```/g, '').trim();
      let parsed: { propositions?: unknown };
      try {
        parsed = JSON.parse(brut);
      } catch {
        return json({ error: "L'assistant a renvoyé une réponse illisible. Réessayez." }, 502);
      }
      const propositions = Array.isArray(parsed.propositions) ? parsed.propositions : [];
      return json({ propositions });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (e) {
    console.error('Erreur Anthropic:', e);
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: `L'assistant IA n'a pas pu répondre (${msg}).` }, 502);
  }
});
