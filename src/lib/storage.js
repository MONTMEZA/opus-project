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
 */
import { Platform } from 'react-native';
import { supabase, hasSupabase } from './supabase';

/** Devine le type du fichier à partir de son extension. */
function typeDeFichier(uri) {
  const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
  const types = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    heic: 'image/heic', webp: 'image/webp', gif: 'image/gif',
    mp4: 'video/mp4', mov: 'video/quicktime',
    pdf: 'application/pdf',
  };
  return { ext: ext || 'jpg', type: types[ext] || 'application/octet-stream' };
}

/**
 * Lit le fichier local et renvoie ses octets.
 * Sur le téléphone, on passe par expo-file-system ; sur le web, par fetch.
 * Cette distinction évite le piège classique du fichier envoyé vide.
 */
async function octetsDuFichier(uri) {
  if (Platform.OS === 'web') {
    const reponse = await fetch(uri);
    return new Uint8Array(await reponse.arrayBuffer());
  }
  const { File } = await import('expo-file-system');
  return new File(uri).bytes();
}

/**
 * Envoie un fichier et renvoie son adresse.
 * Pour un espace public, c'est une URL affichable directement.
 * Pour les documents (privés), c'est le chemin interne : il faudra demander
 * une adresse temporaire à Supabase pour les consulter.
 */
export async function envoyerFichier({ uri, bucket, nom, userId }) {
  if (!hasSupabase) return uri;           // mode démo : on garde l'adresse locale
  if (!uri || !userId) return null;

  const { ext, type } = typeDeFichier(uri);
  const chemin = `${userId}/${nom}-${Date.now()}.${ext}`;
  const octets = await octetsDuFichier(uri);

  const { error } = await supabase.storage.from(bucket).upload(chemin, octets, {
    contentType: type,
    upsert: true,
  });
  if (error) throw error;

  if (bucket === 'documents') return chemin;   // privé : on ne publie pas d'URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(chemin);
  return data.publicUrl;
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
