/**
 * Cloudinary — envoi des vidéos et fabrication des montages.
 *
 * CE QUE CLOUDINARY APPORTE, ET POURQUOI SEULEMENT POUR LA VIDÉO
 * Les photos, les avatars, les bannières et surtout les justificatifs
 * (Kbis, assurance) restent dans Supabase Storage : les documents y sont
 * protégés par des règles liées au compte, et les déplacer reviendrait à
 * refaire cette protection. La vidéo, elle, a trois besoins que Supabase ne
 * couvre pas : la compression, la vignette, et surtout le montage — coller
 * plusieurs clips et une musique en UN SEUL fichier.
 *
 * C'est ce fichier unique qui rend un montage réellement fluide : il n'y a
 * plus de passage d'un clip à l'autre, puisqu'il n'y a plus qu'une vidéo.
 *
 * LA CLÉ SECRÈTE N'EST PAS ICI. Le téléphone demande une signature à
 * l'Edge Function « cloudinary » (voir supabase/functions/cloudinary), puis
 * envoie le fichier directement. Voir aussi src/lib/ai.js, même principe.
 */

/* Les imports sont EN HAUT, et pas en `await import(...)` : voir le long
   commentaire de `lib/storage.js`. Sur téléphone, un import dynamique fait
   aller chercher un morceau de paquet auprès du serveur de développement
   au moment de l'envoi — et échoue sur une erreur incompréhensible si la
   liaison a bougé depuis. */
import { File, UploadType } from 'expo-file-system';
import { supabase, hasSupabase } from './supabase';
import { aCloudinary, urlVideo, urlVignette } from './cloudinary-adresses';

/* Les adresses sont calculées à côté, dans un fichier qui n'importe rien :
   c'est ce qui permet à `npm run verifier-montage` de les contrôler avec un
   simple « node ». On les ré-exporte pour que rien n'ait à changer ailleurs. */
export {
  CLOUD_NAME, aCloudinary, LARGEUR, HAUTEUR,
  urlMontage, urlVideo, urlVignette, apercuDe,
} from './cloudinary-adresses';

/**
 * Envoie une vidéo et renvoie son identifiant Cloudinary.
 *
 * Le fichier part directement du téléphone vers Cloudinary, en flux continu :
 * il ne transite pas par nos serveurs. Seule la signature vient de chez nous.
 */
export async function envoyerVideo({ uri, onProgress }) {
  if (!hasSupabase) throw new Error('Cloudinary a besoin de la connexion Supabase.');
  if (!aCloudinary) {
    throw new Error(
      "Cloudinary n'est pas configuré : ajoutez EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME "
      + 'dans le fichier .env.',
    );
  }

  const { data, error } = await supabase.functions.invoke('cloudinary', { body: {} });
  if (error) throw error;
  if (data && data.error) throw new Error(data.error);

  const resultat = await new File(uri).upload(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/video/upload`,
    {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      parameters: {
        api_key: String(data.apiKey),
        timestamp: String(data.timestamp),
        folder: data.folder,
        signature: data.signature,
      },
      onProgress: onProgress
        ? ({ bytesSent, totalBytes }) => {
            if (totalBytes > 0) onProgress(bytesSent / totalBytes);
          }
        : undefined,
    },
  );

  if (resultat.status >= 400) {
    let motif = `Erreur ${resultat.status}`;
    try {
      const json = JSON.parse(resultat.body);
      motif = (json.error && json.error.message) || motif;
    } catch (e) { /* réponse non JSON */ }
    throw new Error(`Cloudinary a refusé le fichier : ${motif}`);
  }

  const reponse = JSON.parse(resultat.body);
  return {
    publicId: reponse.public_id,
    url: urlVideo(reponse.public_id),
    vignette: urlVignette(reponse.public_id),
    duree: reponse.duration || null,
    octets: reponse.bytes || null,
  };
}
