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
 * QUI A LE DROIT D'APPELER — ajouté le 07/10/2026, et ce n'était pas un
 * détail. Mesuré avant de l'écrire, depuis le conteneur de travail et
 * SANS AUCUN COMPTE, avec la seule clé publiable (celle qui est dans
 * l'application, donc lisible par quiconque installe Opus) :
 *
 *     POST /functions/v1/ai  { action: "summary", … }  ->  200
 *
 * Cette fonction ne lisait aucun jeton. N'importe qui pouvait donc faire
 * tourner la clé Anthropic du propriétaire en boucle, sans limite et sans
 * trace. Ce n'est pas une fuite de données : c'est une fuite d'ARGENT.
 *
 * Désormais, et c'est le §21 du cahier des charges :
 *   1. l'identité vient du JETON, et de nulle part ailleurs ;
 *   2. chaque appel est inscrit au journal d'audit (`journal_ia`) ;
 *   3. une limite par compte et par 24 h, tenue par la BASE — comptage et
 *      écriture dans le même ordre, sinon deux appels simultanés passent
 *      tous les deux.
 *
 * CINQ ACTIONS :
 *   { action: "match",     besoin, artisans }  -> { recommandations: [...] }
 *   { action: "summary",   entreprise, metier, avis } -> { resume: "..." }
 *   { action: "bio",       profil, reponses }  -> { propositions: [{titre, texte}] }
 *   { action: "ameliorer", texte, contexte, profil } -> { propositions: [...] }
 *   { action: "recit",     titre, ville, metier, etapes } -> { recit: "..." }
 */
import Anthropic from 'npm:@anthropic-ai/sdk@0.127.0';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

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

/** Ce qu'Anthropic a réellement compté, pour le journal d'audit. */
function coutDe(message: Anthropic.Message): { entree: number; sortie: number } {
  return {
    entree: message.usage?.input_tokens ?? 0,
    sortie: message.usage?.output_tokens ?? 0,
  };
}

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

  /* L'IDENTITÉ VIENT DU JETON, ET DE NULLE PART AILLEURS. C'est le même
     motif que la fonction `compte`, et c'est tout ce qui sépare « un
     artisan demande un résumé » de « quelqu'un fait tourner la facture
     Anthropic de quelqu'un d'autre ». */
  const urlSupabase = Deno.env.get('SUPABASE_URL');
  const cleService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!urlSupabase || !cleService) {
    return json({ error: 'La fonction n’est pas correctement configurée côté serveur.' }, 500);
  }

  const autorisation = req.headers.get('Authorization') ?? '';
  const jeton = autorisation.replace(/^Bearer\s+/i, '').trim();
  const admin = createClient(urlSupabase, cleService, { auth: { persistSession: false } });

  /* La clé publiable EST un jeton valide, mais elle ne désigne personne :
     `getUser` ne rend alors aucun utilisateur. C'est précisément ce qui
     ferme la porte ouverte depuis le premier jour. */
  const { data: { user } = { user: null } } = jeton
    ? await admin.auth.getUser(jeton)
    : { data: { user: null } };

  if (!user) {
    return json({
      error: "L'assistant n'est accessible qu'une fois connecté. Reconnectez-vous.",
    }, 401);
  }

  const action = String(payload.action || '');

  /* LE JOURNAL ET LA LIMITE SONT LE MÊME ORDRE, et il part AVANT Anthropic :
     refuser après avoir payé l'appel ne protège rien. */
  const { data: ligne, error: erreurJournal } = await admin.rpc('enregistrer_appel_ia', {
    p_user: user.id,
    p_action: action,
    p_cible_type: payload.cibleType ? String(payload.cibleType) : null,
    p_cible_id: payload.cibleId ? String(payload.cibleId) : null,
  });

  if (erreurJournal) {
    console.error('journal_ia:', erreurJournal);
    return json({ error: "L'assistant n'a pas pu être appelé. Réessayez dans un instant." }, 500);
  }

  /* UN REFUS N'EST PAS UNE PANNE, et il se DIT. Une limite qui mord en
     silence ressemble à une application cassée — c'est la règle des
     « 3 annonces sans lieu précisé ne sont pas affichées ». */
  if (ligne && ligne.resultat === 'refuse') {
    return json({
      error: 'Vous avez atteint la limite d’appels à l’assistant pour aujourd’hui. '
        + 'Elle se remet à zéro 24 h après votre premier appel.',
    }, 429);
  }

  /* LE COÛT NE SE CONNAÎT QU'APRÈS. On inscrit la ligne AVANT l'appel —
     c'est elle qui fait tenir la limite —, puis on y range les jetons
     qu'Anthropic a réellement comptés. Sans ce second temps,
     `jetons_entree` et `jetons_sortie` resteraient à zéro pour toujours :
     deux colonnes écrites et jamais remplies, c'est-à-dire le défaut que
     ce projet traque depuis le 01/10.

     `service_role` contourne la RLS, donc cet ordre passe là où la table
     n'accorde aucune écriture à personne. C'est le même privilège qui a
     permis d'y insérer la ligne. */
  const noter = async (entree: number, sortie: number, resultat: string) => {
    if (!ligne || !ligne.id) return;
    const { error } = await admin.from('journal_ia')
      .update({ jetons_entree: entree, jetons_sortie: sortie, resultat })
      .eq('id', ligne.id);
    /* Un journal qui n'a pas pu se compléter ne doit PAS faire échouer la
       réponse : l'artisan a sa réponse, c'est l'essentiel. On le dit dans
       les journaux Supabase, où on le lira en cherchant une panne. */
    if (error) console.error('journal_ia (mise à jour):', error);
  };

  /**
   * REFUSER UNE DEMANDE MAL FORMÉE, EN LE NOTANT.
   *
   * Trouvé le 07/10 en lisant le journal après le premier vrai récit : un
   * appel refusé pour « une seule étape » s'y inscrivait **`ok`, avec zéro
   * jeton**. L'écran « Mon agent » l'aurait donc affiché comme un travail
   * fait, et il aurait consommé un des soixante appels de la journée.
   *
   * > **Un travail qui n'a pas pu se faire ne doit jamais ressembler à un
   * > travail fait.** C'est la règle de « Pour moi » du 05/10, et elle vaut
   * > pour le journal autant que pour un écran.
   *
   * Marquer `erreur` fait les deux : la ligne se voit, et elle ne compte
   * plus contre la limite — `enregistrer_appel_ia()` ne compte que les
   * `ok`. Une demande malformée ne doit pas punir celui qui l'envoie.
   */
  const refuser = async (texte: string, statut = 400) => {
    await noter(0, 0, 'erreur');
    return json({ error: texte }, statut);
  };

  const client = new Anthropic({ apiKey });

  try {
    /* ---------------- Mise en relation (écran Découvrir) ---------------- */
    if (payload.action === 'match') {
      const besoin = String(payload.besoin || '').slice(0, 2000);
      const artisans = Array.isArray(payload.artisans) ? payload.artisans.slice(0, 200) : [];
      if (!besoin.trim()) return refuser('Besoin vide.');

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

      const { entree, sortie } = coutDe(message);
    await noter(entree, sortie, 'ok');
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
      if (avis.length === 0) return refuser('Aucun avis à résumer.');

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
      const { entree, sortie } = coutDe(message);
      await noter(entree, sortie, 'ok');
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

      const { entree, sortie } = coutDe(message);
    await noter(entree, sortie, 'ok');
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
        return refuser('Écrivez d\'abord quelques mots : il faut de la matière à améliorer.');
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

      const { entree, sortie } = coutDe(message);
    await noter(entree, sortie, 'ok');
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

    /* ---------------- Le récit d'un chantier (section 39) ---------------- */
    /* LA PREMIÈRE ACTION DE L'AGENT au sens du §3, et la consigne porte
       tout le lot : il ASSEMBLE, il ne raconte pas. Les étapes arrivent
       déjà filtrées et dans l'ordre du chantier (`src/lib/recit.js`) —
       jamais une étape sans texte, parce qu'un modèle à qui l'on ne donne
       rien ne répond pas « je ne sais pas » : il produit une jolie phrase
       creuse, et elle irait sur la vitrine publique d'un artisan. */
    if (payload.action === 'recit') {
      const titre = String(payload.titre || '').slice(0, 120);
      const ville = String(payload.ville || '').slice(0, 80);
      const metier = String(payload.metier || '').slice(0, 80);
      const etapes = Array.isArray(payload.etapes) ? payload.etapes.slice(0, 40) : [];

      /* La garde est déjà posée côté application. On la refait ici : cette
         fonction est joignable directement, et une consigne sans matière
         est exactement ce qui fait inventer un modèle. */
      if (etapes.length < 2) {
        return refuser('Il faut au moins deux étapes décrites pour écrire un récit.');
      }

      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        output_config: EFFORT,
        system: `Tu assembles les étapes d'un chantier du bâtiment en un récit court, en français, pour la page publique d'un artisan.

RÈGLES ABSOLUES
- N'invente RIEN. Tu n'as le droit d'utiliser QUE ce qui est écrit dans les étapes. Pas une technique, pas un matériau, pas une durée, pas une difficulté, pas un chiffre qui n'y soit pas. Si les étapes ne disent pas pourquoi une chose a été faite, tu ne le dis pas non plus.
- Ne nomme JAMAIS le client, et n'invente aucun nom. Si une étape contient un nom de personne, écris "le client".
- Pas de prix, pas de devis, pas de garantie, pas de label, pas de délai promis. Ce texte est public et il engage l'artisan.
- GARDE SON VOCABULAIRE DE MÉTIER. "Dépose de la couverture", "pare-pluie", "liteaunage" : ces mots prouvent qu'il est du métier, et c'est ce qu'un lecteur vient chercher. Ne les remplace pas par des mots généraux.
- Pas de superlatif publicitaire ("sur-mesure", "excellence", "savoir-faire d'exception", "votre satisfaction"). Un artisan qui se relit doit reconnaître sa façon de parler.
- Le récit suit l'ORDRE des étapes, du début à la fin du chantier.
- 4 à 8 phrases, 900 caractères au maximum. On le lit d'un coup, sur un téléphone.
- Emploie "nous" si plusieurs personnes semblent intervenir, "je" si l'artisan parle à la première personne du singulier dans ses étapes. Ne mélange jamais les deux.
- Pas de titre, pas de liste à puces, pas d'émoji : un seul paragraphe de texte suivi.

Réponds UNIQUEMENT avec un JSON valide, sans texte autour, de la forme exacte :
{"recit":"..."}`,
        messages: [{
          role: 'user',
          content: `Chantier : ${titre || '(sans titre)'}\n`
            + `Commune : ${ville || '(non précisée)'}\n`
            + `Métier de l'artisan : ${metier || '(non précisé)'}\n\n`
            + `Les étapes, dans l'ordre :\n${JSON.stringify(etapes)}`,
        }],
      });

      if (aRefuse(message)) {
        return json({ error: "L'assistant a refusé d'écrire ce récit." }, 422);
      }

      const { entree, sortie } = coutDe(message);
      await noter(entree, sortie, 'ok');
      const brut = textOf(message).replace(/```json|```/g, '').trim();
      let parsed: { recit?: unknown };
      try {
        parsed = JSON.parse(brut);
      } catch {
        return json({ error: "L'assistant a renvoyé une réponse illisible. Réessayez." }, 502);
      }
      const recit = String(parsed.recit || '').trim();
      if (!recit) {
        return json({ error: "L'assistant n'a rien écrit. Réessayez." }, 502);
      }
      return json({ recit });
    }

    return refuser('Action inconnue.');
  } catch (e) {
    /* Le détail complet part dans les journaux Supabase, où on peut le lire
       quand on cherche une panne. L'utilisateur, lui, reçoit une phrase. */
    console.error('Erreur Anthropic:', e);
    /* On note l'ÉCHEC. Sans cela, le journal ne garderait que ce qui a
       marché — et on chercherait longtemps pourquoi un artisan dit « ça ne
       répond pas » alors qu'il n'y a aucune ligne pour le montrer. */
    await noter(0, 0, 'erreur');
    const { texte, statut } = messageLisible(e);
    return json({ error: texte }, statut);
  }
});
