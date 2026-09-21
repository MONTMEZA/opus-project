/**
 * Edge Function « compte » — fermer définitivement un compte.
 *
 * POURQUOI ELLE EXISTE
 * --------------------
 * Supprimer un compte d'authentification (`auth.users`) demande la CLÉ DE
 * SERVICE de Supabase. Cette clé donne tous les droits sur toute la base :
 * elle ne doit jamais se trouver dans l'application, où le code JavaScript
 * est lisible sur le téléphone. Même règle que pour la clé Anthropic.
 *
 * Le téléphone appelle donc cette fonction, et c'est elle — sur le serveur —
 * qui agit. Elle n'accepte qu'UNE chose : la suppression du compte de celui
 * qui appelle, identifié par son jeton. Jamais un identifiant passé dans la
 * requête : n'importe qui pourrait alors supprimer le compte de n'importe
 * qui.
 *
 * L'ORDRE COMPTE
 *   1. l'application appelle `preparer_suppression_compte()` (base de
 *      données) : ménage des données, anonymisation de ce qui concerne des
 *      tiers ;
 *   2. cette fonction supprime les FICHIERS du stockage — ils ne partent pas
 *      avec les lignes de la base, et un Kbis oublié dans un espace privé
 *      est exactement ce qu'on a promis d'effacer ;
 *   3. puis le compte d'authentification.
 *
 * DÉPLOIEMENT
 *   supabase functions deploy compte
 * Aucun secret à ajouter : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont
 * fournis d'office à toute fonction Edge.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

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

/** Les espaces de stockage où un compte peut avoir déposé des fichiers. */
const ESPACES = ['avatars', 'bannieres', 'publications', 'documents'];

/**
 * Vide le dossier d'un utilisateur dans un espace de stockage.
 *
 * La convention du projet : chaque fichier est rangé sous « <uid>/… ». On
 * liste puis on retire. Une erreur ici n'interrompt pas la suppression du
 * compte — mieux vaut un fichier orphelin qu'un compte à moitié fermé — mais
 * elle est renvoyée, pour qu'on sache quoi nettoyer.
 */
async function viderEspace(admin: ReturnType<typeof createClient>, espace: string, uid: string) {
  const { data, error } = await admin.storage.from(espace).list(uid, { limit: 1000 });
  if (error || !data || data.length === 0) return { espace, retires: 0, erreur: error?.message ?? null };

  const chemins = data.map((f) => `${uid}/${f.name}`);
  const { error: erreurSuppression } = await admin.storage.from(espace).remove(chemins);
  return {
    espace,
    retires: erreurSuppression ? 0 : chemins.length,
    erreur: erreurSuppression?.message ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const cleService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !cleService) {
    return json({
      error: 'La fonction n’est pas correctement configurée côté serveur.',
    }, 500);
  }

  /* L'identité vient du JETON, et de nulle part ailleurs. C'est tout ce qui
     empêche quelqu'un de supprimer le compte d'un autre. */
  const autorisation = req.headers.get('Authorization') ?? '';
  const jeton = autorisation.replace(/^Bearer\s+/i, '').trim();
  if (!jeton) return json({ error: 'Aucune session : reconnectez-vous.' }, 401);

  const admin = createClient(url, cleService, { auth: { persistSession: false } });

  const { data: { user }, error: erreurJeton } = await admin.auth.getUser(jeton);
  if (erreurJeton || !user) {
    return json({ error: 'Session expirée : reconnectez-vous avant de supprimer le compte.' }, 401);
  }

  let corps: { action?: string } = {};
  try { corps = await req.json(); } catch { corps = {}; }
  if (corps.action !== 'supprimer') return json({ error: 'Action inconnue.' }, 400);

  const fichiers = [];
  for (const espace of ESPACES) {
    fichiers.push(await viderEspace(admin, espace, user.id));
  }

  const { error: erreurSuppression } = await admin.auth.admin.deleteUser(user.id);
  if (erreurSuppression) {
    console.error('Suppression du compte impossible :', erreurSuppression);
    return json({
      error: 'Vos données ont été supprimées, mais le compte de connexion n’a pas pu être fermé.',
      fichiers,
    }, 500);
  }

  return json({ supprime: true, fichiers });
});
