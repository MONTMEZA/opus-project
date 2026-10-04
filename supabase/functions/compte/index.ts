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
const ESPACES = ['avatars', 'bannieres', 'publications', 'documents', 'pieces-jointes'];

/**
 * Jusqu'où descendre dans les sous-dossiers.
 *
 * Quatre espaces sur cinq sont PLATS : « <uid>/fichier.jpg ». Le cinquième
 * ne l'est pas — une pièce jointe est rangée sous
 * « <uid>/<conversation>/fichier.pdf » (section 28 de `schema.sql`), parce
 * qu'il faut que DEUX personnes puissent la lire et que la politique de
 * sécurité doive retrouver la conversation.
 *
 * Et `list()` ne descend PAS tout seul : il rend les sous-dossiers comme
 * des entrées sans `id`. Sans cette récursion, les pièces jointes
 * resteraient en place après la fermeture d'un compte — un trou RGPD
 * invisible, puisque le compte, lui, disparaîtrait bien.
 *
 * Deux niveaux suffisent aujourd'hui ; la limite est là pour qu'une
 * arborescence inattendue ne fasse pas tourner la fonction sans fin.
 *
 * ET ELLE A DÉJÀ SERVI, LE 04/10/2026 — mal.
 * ------------------------------------------
 * Une extension lue dans une adresse `blob:` a rangé une pièce jointe sous
 * « <uid>/<conv>/devis.blob:http:/localhost:8097/<uuid> » : deux niveaux de
 * trop. La fonction a donc retourné la liste vide, répondu
 * `{"espace":"pieces-jointes","retires":0}` — et le fichier est resté
 * APRÈS la suppression du compte. Mesuré sur la vraie base.
 *
 * Le défaut est corrigé à sa source (`src/lib/types-fichiers.js`). Mais ce
 * jour-là, la limite a transformé un trou RGPD en réponse rassurante : elle
 * DIT désormais qu'elle s'est arrêtée (`tronque`), et l'appelant le reçoit.
 * Un ménage incomplet ne doit pas pouvoir ressembler à un ménage fait.
 */
const PROFONDEUR_MAX = 3;

/** Ce qu'une descente a trouvé, et si elle est allée au bout. */
type Descente = { chemins: string[]; tronque: boolean };

/** Les chemins de FICHIERS sous un dossier, en descendant les sous-dossiers. */
async function listerFichiers(
  admin: ReturnType<typeof createClient>,
  espace: string,
  prefixe: string,
  profondeur = 0,
): Promise<Descente> {
  if (profondeur >= PROFONDEUR_MAX) return { chemins: [], tronque: true };
  const { data, error } = await admin.storage.from(espace).list(prefixe, { limit: 1000 });
  if (error || !data) return { chemins: [], tronque: false };

  const chemins: string[] = [];
  let tronque = false;
  for (const entree of data) {
    const complet = `${prefixe}/${entree.name}`;
    /* Un DOSSIER se reconnaît à l'absence d'identifiant : Supabase le
       fabrique à la volée à partir des noms de fichiers, il n'a pas de
       ligne à lui. */
    if (entree.id) { chemins.push(complet); continue; }
    const dessous = await listerFichiers(admin, espace, complet, profondeur + 1);
    chemins.push(...dessous.chemins);
    if (dessous.tronque) tronque = true;
  }
  return { chemins, tronque };
}

/**
 * Vide le dossier d'un utilisateur dans un espace de stockage.
 *
 * La convention du projet : chaque fichier est rangé sous « <uid>/… ». Une
 * erreur ici n'interrompt pas la suppression du compte — mieux vaut un
 * fichier orphelin qu'un compte à moitié fermé — mais elle est renvoyée,
 * pour qu'on sache quoi nettoyer.
 */
async function viderEspace(admin: ReturnType<typeof createClient>, espace: string, uid: string) {
  const { chemins, tronque } = await listerFichiers(admin, espace, uid);

  /* L'ARBORESCENCE ÉTAIT PLUS PROFONDE QUE PRÉVU : on le dit, même si on
     n'a rien trouvé à retirer. C'est exactement le cas qui, le 04/10/2026,
     ressemblait à un ménage fait. */
  const reste = tronque
    ? `Des sous-dossiers de « ${uid} » dépassent ${PROFONDEUR_MAX} niveaux : `
      + 'des fichiers peuvent rester. À retirer à la main dans Supabase → Storage.'
    : null;

  if (chemins.length === 0) return { espace, retires: 0, erreur: reste };

  const { error: erreurSuppression } = await admin.storage.from(espace).remove(chemins);
  return {
    espace,
    retires: erreurSuppression ? 0 : chemins.length,
    erreur: erreurSuppression?.message ?? reste,
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
