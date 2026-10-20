/**
 * Edge Function « tva » — faire contrôler par VIES le n° de TVA
 * intracommunautaire qu'un artisan écrit lui-même (20/10/2026).
 *
 * POURQUOI ELLE EXISTE
 * --------------------
 * Le numéro de TVA d'une entreprise vient de l'annuaire des entreprises,
 * qui recopie la liste des numéros ACTIFS de la DGFiP. Quand il n'en publie
 * aucun, l'artisan l'écrit, et Opus ne le garde que si VIES — le service de
 * la Commission européenne — le reconnaît. PostgreSQL ne sait pas appeler
 * le web (ni `pg_net` ni `http` sur la vraie base) : c'est donc cette
 * fonction qui appelle VIES, et qui range sa réponse dans `preuves_tva`
 * (section 48 de `schema.sql`), une table que personne d'autre ne peut
 * écrire.
 *
 * CE QU'ELLE PROUVE, ET CE QU'ELLE NE PROUVE PAS
 * ----------------------------------------------
 * Que VIES dit ce numéro actif, CE JOUR-LÀ (VIES ne confirme que pour le
 * jour même), et qu'il désigne l'entreprise rattachée au compte. Rien sur
 * le reste : le badge « vérifié » reste un geste humain, sur pièces.
 *
 * L'ORDRE — ET POURQUOI IL NE SE DISCUTE PAS
 * ------------------------------------------
 *   0. l'origine : une page web inconnue est refusée avant tout travail ;
 *   1. la forme et la clé, sans base ni réseau → `mal_forme`, `cle_fausse` ;
 *   2. l'appelant, par SON jeton → `sans_compte`. Contrairement à `siret`,
 *      il n'y a rien à contrôler avant d'avoir un compte : sans cette
 *      étape, Opus serait un relais VIES ouvert à tous ;
 *   3. son entreprise ACTIVE → `sans_entreprise` ; un numéro déjà publié
 *      par l'annuaire → `deja_publie` (l'annuaire garde le dernier mot) ;
 *   4. le numéro désigne SON SIREN → sinon `autre_siren`. AVANT VIES :
 *      Opus ne fait pas contrôler le numéro d'une autre entreprise ;
 *   5. une preuve de moins de 24 h pour CE numéro → `reconnu`, sans appeler
 *      VIES : ses conditions d'usage rangent parmi les abus « la validation
 *      multiple du même numéro dans la journée » ;
 *   6. les limites — seuls les VRAIS appels à VIES comptent ;
 *   7. VIES : 4 essais au plus, et seulement après une saturation ;
 *   8. si `reconnu`, la preuve, écrite AVANT de répondre ; si `refuse`, la
 *      preuve de CE numéro est retirée : un numéro que VIES ne reconnaît
 *      plus ne doit plus s'imprimer ;
 *   9. la purge des compteurs `tva-` de plus d'un jour, après un appel
 *      compté seulement.
 *
 * CE QU'ELLE NE FAIT JAMAIS
 * -------------------------
 *   - garder le nom ou l'adresse que VIES renvoie : ils ne sont même pas
 *     lus (`lireReponseVies`) ;
 *   - transmettre à VIES un en-tête venu du téléphone ;
 *   - dire « refusé » quand VIES n'a pas répondu : une forme inconnue ou
 *     une saturation donnent `indisponible`, jamais `refuse` ;
 *   - écrire ailleurs que dans `preuves_tva` et `siret_limites`.
 *
 * TOUTES LES ISSUES PARTENT EN HTTP 200
 * -------------------------------------
 * `supabase.functions.invoke` transforme toute réponse non-2xx en
 * « Edge Function returned a non-2xx status code », et jette le corps
 * français. Un statut d'erreur ne sort que pour une PANNE réelle d'Opus.
 *
 * DÉPLOIEMENT
 *   supabase functions deploy tva --no-verify-jwt
 * `verify_jwt = false`, comme `siret` et `compte` : la fonction lit le
 * jeton elle-même et répond `sans_compte` EN FRANÇAIS. Avec la vérification
 * de la passerelle, un jeton expiré recevrait un 401 en anglais, avant
 * qu'elle ne tourne. Aucun secret à ajouter : SUPABASE_URL et
 * SUPABASE_SERVICE_ROLE_KEY sont fournis d'office.
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  analyserNumeroTva,
  lireReponseVies,
  reponsePubliqueTva,
  ligneDePreuveTva,
  LIMITES_TVA,
  ESSAIS_VIES,
  debutDeFenetre,
  origineAutorisee,
} from './tva.js';

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

/**
 * Le point d'entrée DOCUMENTÉ de VIES (le contrat officiel de la
 * Commission, swagger_publicVAT.yaml). Mesuré le 20/10/2026 : il partage
 * sa file d'attente avec l'interface du site et avec le SOAP — aucune n'est
 * plus disponible que les autres —, et c'est le seul dont la forme est
 * publiée.
 */
const VIES = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number';

/** Qui appelle : la Commission doit pouvoir savoir d'où vient le trafic. */
const USER_AGENT = 'Opus (opus-project.com) - controle du numero de TVA de l\'artisan';

/** Un compteur de plus d'un jour ne sert plus à rien : il part. */
const DUREE_COMPTEURS_MS = 24 * 60 * 60 * 1000;

/** Une preuve de moins de 24 h dispense de rappeler VIES pour le même numéro. */
const FRAICHEUR_PREUVE_MS = 24 * 60 * 60 * 1000;

type Admin = SupabaseClient;
type Resultat = Record<string, unknown>;

const finDeFenetre = (debut: string, dureeMs: number) =>
  new Date(Date.parse(debut) + dureeMs).toISOString();

const patienter = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Une PANNE d'Opus, et seulement elle : un statut d'erreur, et la trace dans le journal. */
function panne(message: string, detail: unknown = null, status = 500) {
  console.error(message, detail ?? '');
  return json({ error: message }, status);
}

/**
 * La purge des compteurs `tva-` de plus d'un jour. Rien d'autre ne les
 * efface ; une purge ratée ne fait échouer personne.
 */
async function purger(admin: Admin) {
  try {
    const compteurs = await admin.from('siret_limites')
      .delete()
      .like('cle', 'tva-%')
      .lt('fenetre', new Date(Date.now() - DUREE_COMPTEURS_MS).toISOString());
    if (compteurs.error) console.error('Purge des compteurs impossible :', compteurs.error.message);
  } catch (e) {
    console.error('Purge interrompue :', e);
  }
}

/** L'appelant, par SON jeton. Une clé publiable, un jeton expiré ou absent → personne. */
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
 * Un essai auprès de VIES. Rend la lecture de `lireReponseVies`, ou
 * `indisponible` si rien n'est revenu à temps. Les en-têtes sont écrits
 * ICI : rien de ce que le téléphone a envoyé ne repart.
 */
async function essaiVies(numero: string, delaiMs: number): Promise<Resultat> {
  const controle = new AbortController();
  const minuteur = setTimeout(() => controle.abort(), delaiMs);
  try {
    const reponse = await fetch(VIES, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ countryCode: 'FR', vatNumber: numero.slice(2) }),
      signal: controle.signal,
    });
    if (!reponse.ok) {
      /* VIES répond 200 même à ses erreurs (mesuré) : un autre statut est
         une panne de son côté, ou du réseau. On n'accuse pas le numéro. */
      console.error(`VIES a répondu HTTP ${reponse.status}.`);
      await reponse.body?.cancel();
      return { etat: 'indisponible' };
    }
    return lireReponseVies(await reponse.json(), numero) as Resultat;
  } catch (e) {
    console.error('VIES injoignable :', e instanceof Error ? e.message : e);
    return { etat: 'indisponible' };
  } finally {
    clearTimeout(minuteur);
  }
}

async function traiter(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const cleService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !cleService) return panne('La fonction n’est pas correctement configurée côté serveur.');

  const admin = createClient(url, cleService, { auth: { persistSession: false } });

  /* La SEULE porte de sortie d'une issue : `reponsePubliqueTva` d'abord
     (rien d'imprévu ne sort), la purge ensuite — après un appel COMPTÉ
     seulement —, puis HTTP 200. */
  let compte = false;
  const repondre = async (resultat: Resultat) => {
    const corps = reponsePubliqueTva(resultat);
    if (compte) await purger(admin);
    return json(corps);
  };

  try {
    let demande: { numero?: unknown } = {};
    try { demande = await req.json(); } catch { demande = {}; }

    /* (1) LA FORME ET LA CLÉ, sans base ni réseau. */
    const saisie = analyserNumeroTva(demande && demande.numero);
    if (saisie.etat === 'cle_fausse') return await repondre({ issue: 'cle_fausse' });
    if (saisie.etat !== 'pret') return await repondre({ issue: 'mal_forme' });
    const numero = saisie.numero;

    /* (2) L'APPELANT. */
    const moi = await appelant(admin, req.headers.get('Authorization'));
    if (!moi) return await repondre({ issue: 'sans_compte' });

    /* (3) SON ENTREPRISE ACTIVE. */
    const lue = await admin.from('entreprise_registre')
      .select('siren, tva')
      .eq('pro_id', moi)
      .is('retiree_le', null)
      .limit(1);
    if (lue.error) return panne('Lecture de l’entreprise impossible.', lue.error);
    const entreprise = ((lue.data ?? []) as { siren: string; tva: string | null }[])[0];
    if (!entreprise) return await repondre({ issue: 'sans_entreprise' });
    if (entreprise.tva) return await repondre({ issue: 'deja_publie', numero: entreprise.tva });

    /* (4) LE NUMÉRO DÉSIGNE SON SIREN — avant VIES. */
    if (analyserNumeroTva(numero, entreprise.siren).etat !== 'pret') {
      return await repondre({ issue: 'autre_siren' });
    }

    /* (5) UNE PREUVE FRAÎCHE POUR CE NUMÉRO : VIES n'est pas rappelé. */
    const recente = await admin.from('preuves_tva')
      .select('numero, reconnu_le')
      .eq('pro_id', moi)
      .eq('numero', numero)
      .eq('siren', entreprise.siren)
      .eq('source', 'vies')
      .gt('reconnu_le', new Date(Date.now() - FRAICHEUR_PREUVE_MS).toISOString())
      .limit(1);
    if (recente.error) return panne('Lecture des preuves impossible.', recente.error);
    const deja = ((recente.data ?? []) as { numero: string; reconnu_le: string }[])[0];
    if (deja) return await repondre({ issue: 'reconnu', numero: deja.numero, reconnu_le: deja.reconnu_le });

    /* (6) LES LIMITES. À partir d'ici, l'appel est COMPTÉ. */
    compte = true;
    const instant = Date.now();
    const heure = debutDeFenetre(instant, LIMITES_TVA.compte.duree_ms);
    const parCompte = await admin.rpc('compter_appel_siret', {
      p_cle: `tva-compte:${moi}`,
      p_fenetre: heure,
      p_max: LIMITES_TVA.compte.max,
    });
    if (parCompte.error) return panne('Compteur d’appels illisible.', parCompte.error);
    if (parCompte.data !== true) {
      return await repondre({
        issue: 'trop_d_essais',
        portee: 'compte',
        reessayer_a: finDeFenetre(heure, LIMITES_TVA.compte.duree_ms),
      });
    }
    const minute = debutDeFenetre(instant, LIMITES_TVA.global.duree_ms);
    const pourTous = await admin.rpc('compter_appel_siret', {
      p_cle: 'tva-global',
      p_fenetre: minute,
      p_max: LIMITES_TVA.global.max,
    });
    if (pourTous.error) return panne('Compteur d’appels illisible.', pourTous.error);
    if (pourTous.data !== true) {
      return await repondre({
        issue: 'trop_d_essais',
        portee: 'service',
        reessayer_a: finDeFenetre(minute, LIMITES_TVA.global.duree_ms),
      });
    }

    /* (7) VIES — de nouveaux essais après une SATURATION seulement, et
       jamais au-delà du budget : l'application n'attend que 60 s. */
    const debut = Date.now();
    let lu: Resultat = { etat: 'indisponible' };
    for (let n = 1; n <= ESSAIS_VIES.max; n += 1) {
      if (n > 1) {
        if (Date.now() - debut + ESSAIS_VIES.pause_ms + ESSAIS_VIES.delai_ms > ESSAIS_VIES.budget_ms) break;
        await patienter(ESSAIS_VIES.pause_ms);
      }
      lu = await essaiVies(numero, ESSAIS_VIES.delai_ms);
      if (lu.etat !== 'sature') break;
    }

    /* (8) CE QUE VIES A DIT. */
    if (lu.etat === 'reconnu') {
      /* La preuve, écrite AVANT de répondre : sans elle, l'écran dirait
         « reconnu » et le devis réclamerait encore le numéro. La date du
         contrôle est celle que la BASE pose, et c'est elle qu'on renvoie. */
      const ligne = ligneDePreuveTva({ pro_id: moi, siren: entreprise.siren, numero, vies_le: lu.vies_le as string | null });
      if (!ligne) return panne('Preuve impossible à composer.');
      const ecrite = await admin.from('preuves_tva')
        .upsert(ligne, { onConflict: 'pro_id' })
        .select('numero, reconnu_le')
        .single();
      if (ecrite.error || !ecrite.data) return panne('La preuve n’a pas pu être enregistrée.', ecrite.error);
      const preuve = ecrite.data as { numero: string; reconnu_le: string };
      return await repondre({ issue: 'reconnu', numero: preuve.numero, reconnu_le: preuve.reconnu_le });
    }
    if (lu.etat === 'refuse') {
      /* Un numéro que VIES ne reconnaît plus cesse de s'imprimer. Seulement
         CE numéro : un autre numéro refusé ne retire pas celui qui a été
         reconnu. */
      const retiree = await admin.from('preuves_tva').delete().eq('pro_id', moi).eq('numero', numero);
      if (retiree.error) return panne('La preuve refusée n’a pas pu être retirée.', retiree.error);
      return await repondre({ issue: 'refuse', numero });
    }
    if (lu.etat === 'mal_forme') return await repondre({ issue: 'mal_forme' });
    return await repondre({ issue: 'indisponible' });
  } catch (e) {
    return panne('Erreur inattendue dans la fonction tva.', e instanceof Error ? e.message : e);
  }
}

/* (0) L'ORIGINE, puis le travail, puis les en-têtes CORS sur la réponse —
   quelle qu'elle soit. L'application installée n'envoie pas d'origine. */
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
