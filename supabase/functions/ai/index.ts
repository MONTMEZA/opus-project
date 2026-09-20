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
 * QUATRE ACTIONS :
 *   { action: "match",     besoin, artisans }  -> { recommandations: [...] }
 *   { action: "summary",   entreprise, metier, avis } -> { resume: "..." }
 *   { action: "bio",       profil, reponses }  -> { propositions: [{titre, texte}] }
 *   { action: "ameliorer", texte, contexte, profil } -> { propositions: [...] }
 */
import Anthropic from 'npm:@anthropic-ai/sdk@0.127.0';

const MODEL = 'claude-opus-5';

/**
 * ATTENTION — LA RÉFLEXION PARTAGE LE BUDGET DE max_tokens
 *
 * Sur Claude Opus 5, le modèle réfléchit par défaut, et ces jetons de
 * réflexion sont pris sur `max_tokens`. Avec les 1 500 jetons de la première
 * version, la réflexion pouvait consommer presque tout le budget et le JSON
 * arrivait TRONQUÉ — donc illisible, donc une erreur sans cause apparente.
 *
 * 16 000 est le budget recommandé pour une requête sans streaming. On ne paie
 * que ce qui est réellement produit : ce n'est pas un coût, c'est une marge.
 */
const MAX_TOKENS = 16000;

/**
 * `effort: 'low'` : ces trois tâches sont simples (trier une liste, résumer
 * des avis, mettre en forme un questionnaire). Un effort élevé coûterait plus
 * cher sans rien améliorer.
 */
const EFFORT = { effort: 'low' } as const;

/**
 * Le modèle peut refuser une demande (stop_reason « refusal »). C'est très
 * improbable ici — on lui demande d'écrire la présentation d'un maçon — mais
 * sans ce contrôle on lirait un contenu vide et on afficherait « réponse
 * illisible », ce qui enverrait chercher le problème au mauvais endroit.
 */
function aRefuse(message: Anthropic.Message): boolean {
  return message.stop_reason === 'refusal';
}

/**
 * Traduit les pannes d'Anthropic en français lisible.
 *
 * Sans cela, l'application affiche le message brut de l'API — du JSON anglais
 * au milieu d'une phrase française. Le premier essai réel a renvoyé
 * « L'assistant IA n'a pas pu répondre (400 {"type":"error","error":... }) »
 * pour dire simplement : il n'y a plus de crédit sur le compte Anthropic.
 * Chacune de ces pannes a une cause précise et une action précise : c'est ce
 * qu'il faut afficher, pas le JSON.
 */
function messageLisible(e: unknown): { texte: string; statut: number } {
  const brut = e instanceof Error ? e.message : String(e);
  const statutApi = (e as { status?: number })?.status ?? 0;

  if (/credit balance is too low/i.test(brut)) {
    return {
      texte: "Le compte Anthropic n'a plus de crédit. Rechargez-le sur "
        + 'console.anthropic.com → Plans & Billing, puis réessayez.',
      statut: 402,
    };
  }
  if (statutApi === 401 || /invalid x-api-key|authentication/i.test(brut)) {
    return {
      texte: "La clé Anthropic est refusée. Vérifiez ANTHROPIC_API_KEY dans "
        + 'Supabase → Edge Functions → Secrets : une clé révoquée ou recopiée '
        + 'de travers donne cette erreur.',
      statut: 401,
    };
  }
  if (statutApi === 429 || /rate limit/i.test(brut)) {
    return {
      texte: "Trop de demandes d'un coup. Attendez une minute et réessayez.",
      statut: 429,
    };
  }
  if (statutApi === 529 || /overloaded/i.test(brut)) {
    return {
      texte: 'Le service est momentanément saturé. Réessayez dans un instant.',
      statut: 503,
    };
  }
  if (/model/i.test(brut) && /not found|does not exist/i.test(brut)) {
    return {
      texte: "Le modèle demandé n'existe pas ou n'est pas accessible à ce "
        + "compte. C'est une erreur de configuration du serveur, pas de votre fait.",
      statut: 500,
    };
  }
  return { texte: `L'assistant IA n'a pas pu répondre (${brut}).`, statut: 502 };
}

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
    /* On renvoie les NOMS des secrets ajoutés au projet, jamais leurs
       valeurs. C'est ce qui a permis de diagnostiquer, pour Cloudinary, un
       secret rangé sous un mauvais nom : sans cela on cherche pendant une
       heure une clé qui est bien là, mais qui s'appelle autrement. */
    const ajoutes = Object.keys(Deno.env.toObject())
      .filter((n) => !/^(SUPABASE_|SB_|DENO_|EDGE_|FUNCTION|NODE_|PATH$|HOME$|LANG$|PWD$|SHLVL$|_$)/i.test(n))
      .sort();

    return json({
      error: "La clé ANTHROPIC_API_KEY n'est pas configurée côté serveur. "
        + 'À renseigner dans Supabase → Edge Functions → Secrets, sous ce nom exact.',
      secretsAjoutesAuProjet: ajoutes,
    }, 500);
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
        max_tokens: MAX_TOKENS,
        output_config: EFFORT,
        system: `Tu es l'assistant de mise en relation d'un réseau social du BTP. Réponds UNIQUEMENT avec un JSON valide, sans aucun texte autour, de la forme exacte :
{"recommandations":[{"proId":"identifiant","pertinence":5,"raison":"courte phrase expliquant pourquoi ce pro correspond"}]}
Trie du plus pertinent au moins pertinent. N'utilise que des proId présents dans la liste fournie, recopiés à l'identique. Ne propose que des artisans dont le métier correspond réellement au besoin. Si aucun ne correspond, renvoie une liste vide.`,
        messages: [{
          role: 'user',
          content: `Besoin décrit par un particulier : "${besoin}"\n\n`
            + `Liste des artisans disponibles (JSON) :\n${JSON.stringify(artisans)}`,
        }],
      });

      if (aRefuse(message)) return json({ error: "L'assistant a refusé de répondre à cette demande." }, 422);

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
        max_tokens: MAX_TOKENS,
        output_config: EFFORT,
        system: "Tu résumes des avis clients d'un artisan du BTP en français, de façon neutre, concise et utile. N'invente aucune information absente des avis fournis. Réponds uniquement avec le résumé, sans préambule.",
        messages: [{
          role: 'user',
          content: `Voici les avis clients pour l'artisan "${payload.entreprise}" (${payload.metier}) :\n${lignes}\n\n`
            + `Résume ces avis en 2 à 3 phrases claires pour un particulier qui hésite à le contacter.`,
        }],
      });

      if (aRefuse(message)) return json({ error: "L'assistant a refusé de résumer ces avis." }, 422);
      return json({ resume: textOf(message).trim() });
    }

    /* -------- Présentation d'un artisan (écran Modifier mon profil) -------- */
    if (payload.action === 'bio') {
      const profil = (payload.profil || {}) as Record<string, unknown>;
      const reponses = (payload.reponses || {}) as Record<string, unknown>;

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        output_config: EFFORT,
        system: `Tu écris la présentation d'un artisan du bâtiment pour son profil public, en français.

RÈGLES ABSOLUES
- N'invente RIEN. Tu n'utilises que les informations fournies. Pas de label, pas de certification, pas de chiffre, pas de garantie qui ne soit pas dans les réponses.
- N'élargis RIEN. Si la ville est "Marseille (13)", tu écris Marseille — pas "et dans le département", pas "et ses environs", pas "dans toute la région". Une zone d'intervention non demandée engage l'artisan à se déplacer où il ne veut peut-être pas aller. Même règle pour les spécialités : rien au-delà des chantiers cités.
- Reprends les indications de durée et d'effectif TELLES QUELLES. "depuis plus de dix ans" ne devient pas "depuis de nombreuses années" : l'artisan a répondu précisément, la précision est son argument.
- Pas de superlatif publicitaire ("leader", "expert incontournable", "excellence", "votre satisfaction est notre priorité"). Un artisan qui se relit doit reconnaître sa façon de parler.
- Français simple, phrases courtes. On s'adresse à un particulier qui hésite.
- Chaque proposition tient en 3 à 5 phrases, et ne mélange JAMAIS "je" et "nous".
- La réponse "particularite" est écrite par l'artisan avec SES mots, donc à SA personne. Reprends-la en l'ACCORDANT au texte : dans une présentation au "nous", "je repasse voir le chantier" devient "nous repassons voir le chantier" ; dans la présentation factuelle, "une visite est effectuée". Ne change rien d'autre à son contenu.

Réponds UNIQUEMENT avec un JSON valide, sans texte autour, de la forme exacte :
{"propositions":[{"titre":"Factuelle","texte":"..."},{"titre":"À la première personne","texte":"..."},{"titre":"Courte","texte":"..."}]}

"Factuelle" n'emploie ni "je" ni "nous". "À la première personne" emploie "je" si l'artisan travaille seul, "nous" sinon. "Courte" fait deux phrases au plus.`,
        messages: [{
          role: 'user',
          content: `Artisan :\n${JSON.stringify(profil)}\n\n`
            + `Ses réponses au questionnaire :\n${JSON.stringify(reponses)}`,
        }],
      });

      if (aRefuse(message)) return json({ error: "L'assistant a refusé d'écrire cette présentation." }, 422);

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

    /* ---- Améliorer un texte déjà écrit (publication, présentation) ---- */
    if (payload.action === 'ameliorer') {
      const texte = String(payload.texte || '').slice(0, 4000).trim();
      const contexte = payload.contexte === 'presentation' ? 'presentation' : 'publication';
      const profil = (payload.profil || {}) as Record<string, unknown>;

      if (texte.length < 10) {
        return json({ error: 'Écrivez d\'abord quelques mots : il faut de la matière à améliorer.' }, 400);
      }

      const angles = contexte === 'presentation'
        ? `"Fidèle" : son texte, corrigé et remis d'aplomb. Même longueur, même ordre, mêmes mots partout où ils tiennent.
"Mise en valeur" : les mêmes faits, rangés pour que son savoir-faire se voie. Rien de nouveau, un meilleur ordre.
"Courte" : deux phrases, pour qui lit vite.`
        : `"Fidèle" : son texte, corrigé et remis d'aplomb. Même longueur, même ordre, mêmes mots partout où ils tiennent.
"Mise en valeur" : les mêmes faits, rangés pour que le travail accompli se voie — la difficulté, le soin, le résultat, s'il les a mentionnés. Rien de nouveau.
"Courte" : une à deux lignes, pour un fil qu'on fait défiler.`;

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        output_config: EFFORT,
        system: `Tu améliores un texte écrit par un artisan du bâtiment. Tu RÉÉCRIS, tu n'écris pas : son texte est la matière, tu ne pars jamais de zéro.

CE QUI COMPTE PLUS QUE TOUT — RIEN DE GÉNÉRIQUE
Si une phrase que tu écris pourrait servir telle quelle à un autre artisan, sur un autre chantier, elle est ratée. Supprime-la, ou remplace-la par un détail concret pris dans SON texte. « Un travail soigné dans les règles de l'art » ne dit rien de personne. « Dalle de 40 m² coulée et lissée en une journée » dit tout de lui.

GARDE SA VOIX
- Son vocabulaire de métier est son autorité : « béton lissé », « chape », « IPN », « mur porteur » restent tels quels. Ne les remplace jamais par du vague (« finition de qualité »).
- Son ton reste le sien. S'il est bref et direct, tu restes bref et direct. S'il est chaleureux, tu l'es.
- S'il tutoie, s'il emploie « je » ou « nous », tu gardes ce choix. Ne mélange jamais « je » et « nous » dans un même texte.

N'INVENTE RIEN
Pas une mesure, pas une durée, pas un matériau, pas un nom de client, pas une garantie, pas un label, pas un délai qui ne soit pas dans son texte. Si son texte ne dit pas combien de m², tu n'écris pas de m².

LA FICHE SERT À COMPRENDRE, PAS À REMPLIR
Les informations sur l'artisan (métiers, ville, entreprise) t'aident à comprendre de quoi il parle — qu'une « dalle » relève de la maçonnerie, par exemple. Elles ne doivent PAS être ajoutées au texte s'il ne les a pas écrites lui-même. N'ajoute ni son nom d'entreprise, ni sa ville, ni son ancienneté de ta propre initiative.

LONGUEUR
Ne dépasse jamais le double de son texte. Une note de dix mots ne devient pas une annonce de cinq lignes — elle devient dix mots corrects.

CE QUE TU CORRIGES
L'orthographe, les accords, la ponctuation, les phrases qui ne se terminent pas. C'est souvent là tout le travail, et c'est déjà beaucoup.

INTERDITS
Pas de hashtag, pas d'emoji (sauf s'il en a mis), pas de slogan, pas d'appel à l'action ajouté, pas de superlatif publicitaire (« leader », « expert incontournable », « excellence », « votre satisfaction est notre priorité »).

TROIS ANGLES
${angles}

Réponds UNIQUEMENT avec un JSON valide, sans texte autour :
{"propositions":[{"titre":"Fidèle","texte":"..."},{"titre":"Mise en valeur","texte":"..."},{"titre":"Courte","texte":"..."}]}`,
        messages: [{
          role: 'user',
          content: `Ce que l'artisan a écrit, mot pour mot :\n"""\n${texte}\n"""\n\n`
            + `Sa fiche, pour comprendre son métier (à ne PAS recopier dans le texte) :\n${JSON.stringify(profil)}\n\n`
            + (contexte === 'presentation'
              ? `Ce texte est la présentation de son entreprise, sur son profil public.`
              : `Ce texte est la description d'une publication qu'il s'apprête à poster.`),
        }],
      });

      if (aRefuse(message)) return json({ error: "L'assistant a refusé de retravailler ce texte." }, 422);

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
    /* Le détail complet part dans les journaux Supabase, où on peut le lire
       quand on cherche une panne. L'utilisateur, lui, reçoit une phrase. */
    console.error('Erreur Anthropic:', e);
    const { texte, statut } = messageLisible(e);
    return json({ error: texte }, statut);
  }
});
