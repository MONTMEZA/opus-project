/**
 * Edge Function "cloudinary" — le seul endroit du projet qui connaît le
 * secret Cloudinary.
 *
 * POURQUOI ELLE EXISTE
 * Cloudinary propose d'envoyer des fichiers « sans signature », avec un simple
 * mot de passe glissé dans l'application. Leur propre documentation demande
 * alors de traiter ce mot de passe comme un secret — or le code JavaScript
 * d'une application mobile se lit en quelques minutes. N'importe qui pourrait
 * alors déposer ce qu'il veut dans l'espace de stockage du projet.
 *
 * Ici, le téléphone demande une SIGNATURE à cette fonction, qui la calcule
 * sur le serveur avec le secret. La signature ne vaut que quelques minutes,
 * et seulement pour le dossier de l'utilisateur qui l'a demandée. Le fichier,
 * lui, part directement du téléphone vers Cloudinary : il ne transite pas par
 * ici, ce qui serait lent et inutile.
 *
 * DÉPLOIEMENT
 *   Les trois valeurs se règlent dans Supabase → Edge Functions → Secrets :
 *     CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   Seul CLOUDINARY_API_SECRET est réellement sensible.
 */
import { createClient } from '@supabase/supabase-js';

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

/**
 * Signature attendue par Cloudinary : les paramètres triés par nom, collés en
 * « cle=valeur&cle=valeur », suivis du secret, le tout passé en SHA-1.
 */
async function signer(parametres: Record<string, string>, secret: string) {
  const aSigner = Object.keys(parametres)
    .sort()
    .map((cle) => `${cle}=${parametres[cle]}`)
    .join('&');

  const octets = new TextEncoder().encode(aSigner + secret);
  const empreinte = await crypto.subtle.digest('SHA-1', octets);
  return Array.from(new Uint8Array(empreinte))
    .map((o) => o.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  if (!cloudName || !apiKey || !apiSecret) {
    return json({
      error: "Cloudinary n'est pas configuré côté serveur. Renseignez "
        + 'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET '
        + 'dans les secrets Supabase.',
    }, 500);
  }

  /* Qui demande ? Une signature n'est délivrée qu'à un utilisateur connecté,
     et elle ne vaut que pour SON dossier : personne ne peut déposer de
     fichiers chez quelqu'un d'autre. */
  const autorisation = req.headers.get('Authorization') || '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: autorisation } } },
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ error: 'Connectez-vous pour envoyer un fichier.' }, 401);

  const timestamp = Math.floor(Date.now() / 1000);
  const dossier = `opus/${user.id}`;

  const aSigner: Record<string, string> = {
    folder: dossier,
    timestamp: String(timestamp),
  };
  const signature = await signer(aSigner, apiSecret);

  return json({
    cloudName,
    apiKey,            // publique par nature : elle voyage avec chaque envoi
    timestamp,
    folder: dossier,
    signature,
  });
});
