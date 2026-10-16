/**
 * Edge Function « siret » — demander au répertoire Sirene si une entreprise
 * existe et est en activité.
 *
 * POURQUOI ELLE EXISTE
 * --------------------
 * Depuis le lot 1 bis, un compte professionnel ne naît qu'avec un SIRET
 * trouvé ACTIF au répertoire Sirene de l'INSEE. PostgreSQL ne sait pas
 * interroger un service web (ni `pg_net` ni `http` sur la vraie base,
 * mesuré) : c'est donc cette fonction qui le fait, et qui range ce que le
 * répertoire a répondu dans `preuves_siret` — une table que personne
 * d'autre ne peut écrire. Le déclencheur d'inscription n'acceptera un
 * compte professionnel que sur cette PREUVE, jamais sur ce que le téléphone
 * prétend (un téléphone se modifie ; une métadonnée s'écrit à la main).
 *
 * CE QU'ELLE PROUVE, ET CE QU'ELLE NE PROUVE PAS
 * ----------------------------------------------
 * Qu'une entreprise EXISTE et est ACTIVE. Jamais que celui qui tape le
 * numéro en est le titulaire : un SIRET est public. Le badge « vérifié »
 * reste un geste humain, sur pièces.
 *
 * L'ORDRE — ET POURQUOI IL NE SE DISCUTE PAS
 * ------------------------------------------
 *   0. l'origine : une page web inconnue est refusée avant tout travail
 *      (15/10/2026 — voir `origineAutorisee`, dans `siret.js`) ;
 *   1. la clé de contrôle : sans base ni réseau → `mal_forme` ;
 *   1 bis. un seau LARGE de lectures par connexion (200 par heure) : la
 *      question « ce SIREN a-t-il un compte ? » ne se pose plus sans fin
 *      (15/10/2026, relecture adverse — l'étape 2 précède les vraies
 *      limites, et pour un EI le SIREN désigne une personne) ;
 *   2. le SIREN déjà porté par une identité active, ou GELÉ par
 *      l'administration (section 45.3) → `deja_utilise`. AVANT le cache :
 *      une preuve de 24 h ne sait pas qu'une autre personne a pris
 *      l'entreprise entre-temps (relecture 2). Une seule exception : la
 *      fiche de l'APPELANT lui-même — un artisan qui a déménagé doit
 *      pouvoir faire consulter son nouvel établissement ;
 *   3. une preuve fraîche → `ok`, sans compter et sans appeler : une
 *      revérification sortie du cache ne coûte rien à personne ;
 *   4. les limites — seuls les VRAIS appels au répertoire comptent ;
 *   5. le répertoire, 8 secondes au plus ;
 *   6. la lecture de sa réponse (`siret.js`, le même code que l'écran) ;
 *   7. si `ok`, la preuve ;
 *   8. la purge — SEULEMENT après un appel compté (étape 4 franchie). Elle
 *      partait à chaque réponse, `mal_forme` comprise : un POST vide, sans
 *      compte et sans limite, coûtait deux suppressions à la base
 *      (relecture adverse du 15/10). Une consultation réelle du répertoire
 *      suffit à faire le ménage, et c'est ce que disent les textes légaux.
 *
 * CE QU'ELLE NE FAIT JAMAIS
 * -------------------------
 *   - dire QUI détient une entreprise : `deja_utilise` n'emporte rien
 *     d'autre que son nom d'issue (pour un EI, le SIREN est une personne) ;
 *   - transmettre au répertoire un en-tête venu du téléphone ;
 *   - lire `X-Forwarded-For` : il arrive exactement tel que le client l'a
 *     écrit (mesuré sur la vraie infrastructure, relecture 1). Seuls
 *     `cf-connecting-ip` et `x-real-ip` sont posés par l'hébergeur ;
 *   - ranger une adresse IP : seulement son empreinte HMAC, et le /64
 *     d'une IPv6 (un abonné en a 2^64 à volonté) — plus son /48, pour le
 *     second seau ;
 *   - lire le jeton de connexion pour autre chose que reconnaître la fiche
 *     de l'appelant à l'étape 2 ;
 *   - renvoyer l'adresse de rue, `nom_complet`, des coordonnées ou des
 *     dirigeants. Tout passe par `reponsePublique()`, qui ne laisse sortir
 *     que l'identité énumérée dans `siret.js`.
 *
 * TOUTES LES ISSUES PARTENT EN HTTP 200
 * -------------------------------------
 * `supabase.functions.invoke` transforme toute réponse non-2xx en
 * « Edge Function returned a non-2xx status code », et jette le corps
 * français (lu dans functions-js). Une issue — même un refus — doit donc
 * arriver en 200 pour que l'écran puisse la dire. Un statut d'erreur ne
 * sort que pour une PANNE réelle d'Opus (base illisible, preuve
 * impossible à écrire) : l'application la rend en `service_indisponible`.
 *
 * DÉPLOIEMENT
 *   supabase functions deploy siret --no-verify-jwt
 * `verify_jwt = false`, comme `compte` : on vérifie un SIRET AVANT d'avoir
 * un compte. Aucun secret à ajouter : SUPABASE_URL et
 * SUPABASE_SERVICE_ROLE_KEY sont fournis d'office à toute fonction Edge.
 * À éprouver une fois déployée : un appel portant un `X-Forwarded-For`
 * forgé ne change pas le compteur, et `cf-connecting-ip` arrive bien.
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  chiffresSeuls,
  cleSiretValide,
  lireReponseRegistre,
  reponsePublique,
  ligneDePreuve,
  CHAMPS_IDENTITE,
  LIMITES,
  debutDeFenetre,
  prefixeIp,
  blocIpv6,
  empreinteIp,
  secondesAvantReessai,
  origineAutorisee,
} from './siret.js';

/* CORS : plus d'étoile (15/10/2026). L'origine n'est renvoyée que si elle
   est connue, et chaque réponse le précise (`Vary`) pour qu'aucun
   intermédiaire ne serve à l'un la réponse faite à l'autre. */
const CORS_BASE = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

function enTetesCors(origine: string | null): Record<string, string> {
  return origine && origineAutorisee(origine)
    ? { ...CORS_BASE, 'Access-Control-Allow-Origin': origine }
    : { ...CORS_BASE };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** L'API publique « Recherche d'entreprises » (DINUM), sans clé. */
const REPERTOIRE = 'https://recherche-entreprises.api.gouv.fr/search';

/**
 * 8 secondes : au-delà, on rend `injoignable` plutôt que de laisser
 * l'application attendre ses propres 15 secondes au fond d'une cave.
 */
const DELAI_REPERTOIRE_MS = 8000;

/**
 * Qui appelle. Un service public qui voit un trafic anormal doit pouvoir
 * savoir d'où il vient, et nous joindre plutôt que de nous couper.
 */
const USER_AGENT = 'Opus (opus-project.com) - verification d\'inscription professionnelle';

/** Un compteur de plus d'un jour ne sert plus à rien : il part. */
const DUREE_COMPTEURS_MS = 24 * 60 * 60 * 1000;

/* Le type du client, nommé tel quel : `ReturnType<typeof createClient>`
   se résout, avec les types récents de supabase-js, en un client dont le
   schéma vaut `never` — et `tsc` refuse alors de le passer à une fonction
   (constaté aussi sur `compte`). */
type Admin = SupabaseClient;
type Resultat = Record<string, unknown>;

/** La fin d'une fenêtre : l'instant où l'on peut réessayer. */
const finDeFenetre = (debut: string, dureeMs: number) =>
  new Date(Date.parse(debut) + dureeMs).toISOString();

/**
 * (8) La purge : les preuves expirées, les compteurs de plus d'un jour.
 *
 * Elle part après chaque appel COMPTÉ, parce qu'elle est la seule : rien
 * d'autre n'efface ces lignes. Pas avant : une réponse qui n'a coûté
 * aucun compteur (`mal_forme`, le cache, `deja_utilise`) ne doit pas
 * coûter deux suppressions à la base. Et une purge ratée ne fait échouer
 * personne — on la note dans le journal de la fonction, et l'appel suivant
 * la refera.
 *
 * Par `.delete()` de supabase-js, c'est-à-dire par l'API de la base avec
 * la clé de service : aucune chaîne SQL, rien que le connecteur Supabase
 * aurait à refuser.
 */
async function purger(admin: Admin) {
  try {
    const maintenant = Date.now();
    const preuves = await admin.from('preuves_siret')
      .delete()
      .lt('expire_le', new Date(maintenant).toISOString());
    if (preuves.error) console.error('Purge des preuves impossible :', preuves.error.message);
    const compteurs = await admin.from('siret_limites')
      .delete()
      .lt('fenetre', new Date(maintenant - DUREE_COMPTEURS_MS).toISOString());
    if (compteurs.error) console.error('Purge des compteurs impossible :', compteurs.error.message);
  } catch (e) {
    console.error('Purge interrompue :', e);
  }
}

/** Une PANNE d'Opus, et seulement elle : un statut d'erreur, et la trace dans le journal. */
function panne(message: string, detail: unknown = null, status = 500) {
  console.error(message, detail ?? '');
  return json({ error: message }, status);
}

/**
 * La fiche de l'APPELANT, s'il est connecté : son jeton, vérifié par
 * l'authentification de Supabase. Une clé publiable, un jeton expiré ou
 * absent → personne. Ne sert qu'à l'étape 2, et seulement quand le SIREN
 * est déjà porté : un artisan qui a déménagé fait consulter le nouvel
 * établissement de SA propre entreprise.
 */
async function appelant(admin: Admin, autorisation: string | null): Promise<string | null> {
  const jeton = (autorisation ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!jeton) return null;
  try {
    const { data, error } = await admin.auth.getUser(jeton);
    if (error || !data || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Le travail, pour une requête dont l'origine est permise. Toutes les
 * réponses repassent par `Deno.serve`, en bas, qui y pose les en-têtes
 * CORS : un seul endroit, donc aucune réponse sans eux.
 */
async function traiter(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const cleService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !cleService) return panne('La fonction n’est pas correctement configurée côté serveur.');

  const admin = createClient(url, cleService, { auth: { persistSession: false } });

  /* La SEULE porte de sortie d'une issue : `reponsePublique` d'abord (rien
     d'imprévu ne sort), la purge ensuite — mais seulement après un appel
     COMPTÉ (`compte`, posé à l'étape 4) —, puis HTTP 200. */
  let compte = false;
  const repondre = async (resultat: Resultat) => {
    const corps = reponsePublique(resultat);
    if (compte) await purger(admin);
    return json(corps);
  };

  try {
    let demande: { siret?: unknown } = {};
    try { demande = await req.json(); } catch { demande = {}; }

    /* (1) LA CLÉ DE CONTRÔLE. Un numéro qui ne peut pas être un SIRET ne
       mérite ni une lecture de la base, ni un appel au répertoire. */
    const siret = chiffresSeuls(demande && demande.siret);
    if (!cleSiretValide(siret)) return await repondre({ issue: 'mal_forme' });

    /* L'adresse vient de l'hébergeur, jamais du client ; sans elle, on ne
       compte pas sous une clé vide que tout le monde partagerait : on
       répond `injoignable`. Elle est lue ICI, avant l'étape 2, pour le seau
       des lectures. */
    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip');
    const prefixe = prefixeIp(ip);
    if (!prefixe) {
      console.error('Aucune adresse fournie par l’hébergeur : appel non compté, donc refusé.');
      return await repondre({ issue: 'injoignable' });
    }
    const empreinte = await empreinteIp(cleService, prefixe);
    const instant = Date.now();
    const heure = debutDeFenetre(instant, LIMITES.ip.duree_ms);

    /* (1 bis) LES LECTURES. Large exprès (200 par heure) : il ne ferme
       jamais une inscription, il borne l'énumération des SIREN. */
    const lectures = await admin.rpc('compter_appel_siret', {
      p_cle: `lecture:${empreinte}`,
      p_fenetre: debutDeFenetre(instant, LIMITES.lecture.duree_ms),
      p_max: LIMITES.lecture.max,
    });
    if (lectures.error) return panne('Compteur d’appels illisible.', lectures.error);
    if (lectures.data !== true) {
      return await repondre({
        issue: 'trop_d_essais',
        portee: 'connexion',
        reessayer_a: finDeFenetre(debutDeFenetre(instant, LIMITES.lecture.duree_ms), LIMITES.lecture.duree_ms),
      });
    }

    /* (2) LE SIREN EST-IL DÉJÀ PRIS ? Le verrou est sur le SIREN (une
       entreprise), pas sur le SIRET (un établissement) : sinon un second
       établissement de la même entreprise ouvrirait un second compte.

       PRIS veut dire : une identité ACTIVE, ou une identité GELÉE par
       l'administration (section 45.3, 15/10/2026). Sans le gel, mesuré,
       l'entreprise retirée à un squatteur lui revenait la minute suivante
       — et un compte neuf la prenait aussi bien. La réponse ne dit pas
       laquelle des deux : `deja_utilise`, et rien d'autre.

       SAUF pour la fiche de l'appelant, identifiée par SON jeton : sans
       cette exception, « Mon entreprise → Mettre à jour » n'avait AUCUN
       chemin de réussite (relecture adverse) — la fonction répondait
       « déjà utilisé » à l'artisan qui faisait consulter le nouvel
       établissement de sa propre entreprise. `rattacher_mon_siret()`
       exige ensuite, de son côté, que ce soit bien le même SIREN. */
    const porteur = await admin.from('entreprise_registre')
      .select('pro_id, gele')
      .eq('siren', siret.slice(0, 9))
      .or('retiree_le.is.null,gele.is.true')
      .limit(5);
    if (porteur.error) return panne('Lecture des entreprises rattachées impossible.', porteur.error);
    const porteurs = (porteur.data ?? []) as { pro_id: string; gele: boolean }[];
    if (porteurs.length > 0) {
      const gelee = porteurs.some((p) => p.gele);
      const moi = gelee ? null : await appelant(admin, req.headers.get('Authorization'));
      const lAppelant = !!moi && porteurs.every((p) => p.pro_id === moi);
      if (!lAppelant) return await repondre({ issue: 'deja_utilise' });
    }

    /* (3) UNE PREUVE FRAÎCHE. Seulement une preuve du répertoire : une
       preuve « essai » ne sert qu'aux comptes d'essai, et ne doit jamais
       répondre « ok » à quelqu'un d'autre. On ne relit que les colonnes de
       l'identité — l'adresse ne quitte jamais la base. */
    const cache = await admin.from('preuves_siret')
      .select(CHAMPS_IDENTITE.join(', '))
      .eq('siret', siret)
      .eq('source', 'registre')
      .gt('expire_le', new Date().toISOString())
      .limit(1);
    if (cache.error) return panne('Lecture des preuves impossible.', cache.error);
    const enCache = (cache.data ?? []) as unknown as Resultat[];
    if (enCache.length > 0) return await repondre({ issue: 'ok', identite: enCache[0] });

    /* (4) LES LIMITES. À partir d'ici, l'appel est COMPTÉ : la purge
       pourra partir. */
    compte = true;
    const parConnexion = await admin.rpc('compter_appel_siret', {
      p_cle: `ip:${empreinte}`,
      p_fenetre: heure,
      p_max: LIMITES.ip.max,
    });
    if (parConnexion.error) return panne('Compteur d’appels illisible.', parConnexion.error);
    if (parConnexion.data !== true) {
      return await repondre({
        issue: 'trop_d_essais',
        portee: 'connexion',
        reessayer_a: finDeFenetre(heure, LIMITES.ip.duree_ms),
      });
    }

    /* Le BLOC /48, pour une IPv6 seulement : 65 536 abonnés /64 tiennent
       dans un /48 qui se distribue gratuitement. Sans ce seau, une seule
       personne épuisait la limite de tout Opus. */
    const bloc = blocIpv6(prefixe);
    if (bloc) {
      const parBloc = await admin.rpc('compter_appel_siret', {
        p_cle: `bloc:${await empreinteIp(cleService, bloc)}`,
        p_fenetre: heure,
        p_max: LIMITES.bloc.max,
      });
      if (parBloc.error) return panne('Compteur d’appels illisible.', parBloc.error);
      if (parBloc.data !== true) {
        return await repondre({
          issue: 'trop_d_essais',
          portee: 'connexion',
          reessayer_a: finDeFenetre(heure, LIMITES.bloc.duree_ms),
        });
      }
    }

    const minute = debutDeFenetre(instant, LIMITES.global.duree_ms);
    const pourTous = await admin.rpc('compter_appel_siret', {
      p_cle: 'global',
      p_fenetre: minute,
      p_max: LIMITES.global.max,
    });
    if (pourTous.error) return panne('Compteur d’appels illisible.', pourTous.error);
    if (pourTous.data !== true) {
      return await repondre({
        issue: 'trop_d_essais',
        portee: 'service',
        reessayer_a: finDeFenetre(minute, LIMITES.global.duree_ms),
      });
    }

    /* (5) LE RÉPERTOIRE. `minimal=true` retire les dirigeants (des tiers)
       dès la source ; `include` ne rapporte que ce qu'on lit. Les en-têtes
       sont écrits ICI : rien de ce que le téléphone a envoyé ne repart. */
    const adresse = `${REPERTOIRE}?q=${siret}&minimal=true`
      + '&include=siege,complements,tva,matching_etablissements&per_page=5';
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), DELAI_REPERTOIRE_MS);
    let donnees: unknown = null;
    let echec: Resultat | null = null;
    let refus = 0;
    try {
      const reponse = await fetch(adresse, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controle.signal,
      });
      if (reponse.status === 429 || reponse.status >= 500) {
        /* Le service public est saturé ou en panne : on dit QUAND
           réessayer, s'il l'a dit lui-même. */
        echec = {
          issue: 'injoignable',
          reessayer_dans: secondesAvantReessai(reponse.headers.get('Retry-After')),
        };
        await reponse.body?.cancel();
      } else if (!reponse.ok) {
        /* Un autre refus vise NOTRE requête : c'est une panne d'Opus, pas
           une indisponibilité du répertoire. */
        refus = reponse.status;
        await reponse.body?.cancel();
      } else {
        /* Le corps se lit sous le même délai que l'en-tête. */
        donnees = await reponse.json();
      }
    } catch (e) {
      /* Délai dépassé, réseau coupé, corps illisible : le répertoire n'a
         pas répondu. */
      console.error('Répertoire injoignable :', e instanceof Error ? e.message : e);
      echec = { issue: 'injoignable' };
    } finally {
      clearTimeout(minuteur);
    }
    if (refus) return panne(`Le répertoire a refusé la requête d’Opus (HTTP ${refus}).`, null, 502);
    if (echec) return await repondre(echec);

    /* (6) LA LECTURE — la même que celle que l'écran comprend. */
    const resultat = lireReponseRegistre(donnees, siret) as Resultat;

    /* (7) LA PREUVE. Écrite AVANT de répondre « ok » : sans elle,
       l'inscription échouerait sur OP006 après un « ok » déjà affiché. */
    if (resultat.issue === 'ok') {
      const ligne = ligneDePreuve(resultat, Date.now());
      if (!ligne) return panne('Preuve impossible à composer.');
      const ecrite = await admin.from('preuves_siret').upsert(ligne, { onConflict: 'siret' });
      if (ecrite.error) return panne('La preuve n’a pas pu être enregistrée.', ecrite.error);
    }

    return await repondre(resultat);
  } catch (e) {
    return panne('Erreur inattendue dans la fonction siret.', e instanceof Error ? e.message : e);
  }
}

/* (0) L'ORIGINE, puis le travail, puis les en-têtes CORS sur la réponse —
   quelle qu'elle soit. Une page web inconnue est refusée AVANT toute
   lecture de la base et tout compteur : CORS seul ne l'empêcherait pas
   d'envoyer, il cacherait seulement la réponse. L'application installée
   n'envoie pas d'origine : elle passe. */
Deno.serve(async (req) => {
  const origine = req.headers.get('Origin');
  const cors = enTetesCors(origine);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const reponse = origineAutorisee(origine)
    ? await traiter(req)
    : json({ error: 'Origine non autorisée.' }, 403);
  for (const [cle, valeur] of Object.entries(cors)) reponse.headers.set(cle, valeur);
  return reponse;
});
