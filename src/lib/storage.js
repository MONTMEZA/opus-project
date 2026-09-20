/**
 * Envoi de fichiers vers Supabase Storage.
 *
 * Quatre espaces, avec des règles différentes (voir schema.sql) :
 *   avatars, bannieres, publications -> publics
 *   documents                        -> privés (Kbis, assurance)
 *
 * Chaque fichier est rangé dans un dossier portant l'identifiant de son
 * propriétaire : <uid>/<nom>. C'est ce qui permet à la base de savoir à qui
 * il appartient, et d'interdire à quiconque d'écraser les fichiers d'un autre.
 *
 * DEUX CHEMINS D'ENVOI, et la différence compte
 * ---------------------------------------------
 * Une photo pèse 2 Mo : la charger en mémoire ne pose aucun problème. Une
 * vidéo de 30 secondes en pèse 60 : la charger entièrement dans un tableau
 * d'octets fait ramer le téléphone, et peut simplement échouer sans rien
 * dire. C'est ce qui faisait échouer la publication d'un clip.
 *
 * Sur téléphone, les fichiers partent donc en flux continu
 * (`File.upload`, qui lit le fichier morceau par morceau et rend la
 * progression). Sur le web, où cette API n'existe pas, on garde la lecture
 * en mémoire — les fichiers y sont choisis depuis un ordinateur, et la
 * mémoire y est moins comptée.
 */
import { Platform } from 'react-native';
import { supabase, hasSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { TAILLE_MAX_MO } from './media';

/** Devine le type du fichier à partir de son extension. */
function typeDeFichier(uri) {
  const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
  const types = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    heic: 'image/heic', webp: 'image/webp', gif: 'image/gif',
    mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/mp4',
    mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac',
    wav: 'audio/wav', ogg: 'audio/ogg',
    pdf: 'application/pdf',
  };
  return { ext: ext || 'jpg', type: types[ext] || 'application/octet-stream' };
}

function tropLourd(octets) {
  const mo = octets / (1024 * 1024);
  return new Error(
    `Fichier trop lourd : ${mo.toFixed(0)} Mo, pour ${TAILLE_MAX_MO} Mo maximum. `
    + 'Filmez une séquence plus courte, ou choisissez une vidéo plus légère.',
  );
}

/**
 * Envoie un fichier et renvoie son adresse.
 * Pour un espace public, c'est une URL affichable directement.
 * Pour les documents (privés), c'est le chemin interne : il faudra demander
 * une adresse temporaire à Supabase pour les consulter.
 *
 * `onProgress` reçoit un nombre entre 0 et 1 (téléphone uniquement).
 */
export async function envoyerFichier({ uri, bucket, nom, userId, onProgress }) {
  if (!hasSupabase) return uri;           // mode démo : on garde l'adresse locale
  if (!uri || !userId) return null;

  const { ext, type } = typeDeFichier(uri);
  const chemin = `${userId}/${nom}-${Date.now()}.${ext}`;

  if (Platform.OS === 'web') {
    await envoiWeb({ uri, bucket, chemin, type });
  } else {
    await envoiTelephone({ uri, bucket, chemin, type, onProgress });
  }

  if (bucket === 'documents') return chemin;   // privé : on ne publie pas d'URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(chemin);
  return data.publicUrl;
}

/** Web : lecture en mémoire, puis envoi par le client Supabase. */
async function envoiWeb({ uri, bucket, chemin, type }) {
  const reponse = await fetch(uri);
  const octets = new Uint8Array(await reponse.arrayBuffer());
  if (octets.length > TAILLE_MAX_MO * 1024 * 1024) throw tropLourd(octets.length);

  const { error } = await supabase.storage.from(bucket).upload(chemin, octets, {
    contentType: type,
    upsert: true,
  });
  if (error) throw error;
}

/**
 * Téléphone : envoi en flux continu vers l'API REST de Storage.
 *
 * On n'utilise pas le client Supabase ici : il attend les octets en mémoire,
 * ce qu'on cherche précisément à éviter. On parle donc directement à
 * l'endpoint, avec le jeton de la session en cours.
 */
async function envoiTelephone({ uri, bucket, chemin, type, onProgress }) {
  const { File, UploadType } = await import('expo-file-system');
  const fichier = new File(uri);

  const taille = fichier.size || 0;
  if (taille > TAILLE_MAX_MO * 1024 * 1024) throw tropLourd(taille);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Session expirée. Reconnectez-vous et réessayez.');

  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURI(chemin)}`;
  const resultat = await fichier.upload(url, {
    httpMethod: 'POST',
    uploadType: UploadType.BINARY_CONTENT,
    mimeType: type,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
      // Le Content-Type est posé ICI, explicitement, et pas seulement par
      // l'option mimeType ci-dessus : vérifié sur la vraie base, Supabase
      // enregistrait sinon « application/octet-stream ». Une vidéo servie
      // sous ce type n'est plus reconnue comme une vidéo par le lecteur :
      // elle se télécharge en entier avant de démarrer, au lieu de se lire
      // au fil de l'eau. C'est ce qui la rendait si lente à apparaître.
      'Content-Type': type,
      'x-upsert': 'true',
      'cache-control': 'max-age=3600',
    },
    onProgress: onProgress
      ? ({ bytesSent, totalBytes }) => {
          if (totalBytes > 0) onProgress(bytesSent / totalBytes);
        }
      : undefined,
  });

  if (resultat.status >= 400) {
    /* Le corps de la réponse porte le vrai motif : limite de taille du
       projet, espace saturé, règle refusée. L'afficher évite de chercher. */
    let motif = `Erreur ${resultat.status}`;
    try {
      const json = JSON.parse(resultat.body);
      motif = json.message || json.error || motif;
    } catch (e) { /* réponse non JSON : on garde le code */ }
    throw new Error(`Envoi refusé par Supabase : ${motif}`);
  }
}

/**
 * Adresse temporaire pour consulter un document privé (1 heure).
 * Utilisée pour que l'artisan puisse relire le justificatif qu'il a envoyé.
 */
export async function adresseTemporaire(chemin, secondes = 3600) {
  if (!hasSupabase || !chemin) return null;
  const { data, error } = await supabase.storage
    .from('documents').createSignedUrl(chemin, secondes);
  if (error) throw error;
  return data.signedUrl;
}

/** Vrai si l'adresse pointe encore vers un fichier local, pas encore envoyé. */
export function estFichierLocal(uri) {
  return !!uri && !uri.startsWith('http');
}
