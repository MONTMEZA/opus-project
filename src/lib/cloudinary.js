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
/* La connexion Supabase n'est chargée qu'au moment de l'envoi, pas à
   l'ouverture du fichier : cela permet de vérifier la fabrication des
   adresses avec un simple « node », sans embarquer React Native.
   Voir scripts/verifier-montage.mjs. */

/** Nom public du compte Cloudinary : il apparaît dans chaque adresse. */
export const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

/** true quand le projet est relié à un compte Cloudinary. */
export const aCloudinary = Boolean(CLOUD_NAME);

/** Format vertical, comme le fil vidéo. Tous les clips y sont ramenés. */
export const LARGEUR = 720;
export const HAUTEUR = 1280;

/**
 * Un identifiant de fichier peut contenir des barres obliques
 * (« opus/<utilisateur>/<fichier> »). Dans une superposition, Cloudinary
 * attend des deux-points à la place.
 */
function enCalque(publicId) {
  return String(publicId).replace(/\//g, ':');
}

const CADRAGE = `c_fill,h_${HAUTEUR},w_${LARGEUR}`;

/**
 * Adresse d'un montage : les clips collés bout à bout, avec la musique.
 *
 * Les clips sont tous ramenés au même cadrage — Cloudinary refuse d'assembler
 * des vidéos de tailles différentes, et un artisan filme aussi bien debout que
 * couché.
 *
 * `musique` remplace le son des clips (ac_none), plutôt que de s'y superposer :
 * une bande-son par-dessus des bruits de chantier ne s'écoute pas.
 */
export function urlMontage(publicIds = [], { musique = null } = {}) {
  if (!aCloudinary || publicIds.length === 0) return null;

  const [premier, ...suivants] = publicIds;
  const etapes = [CADRAGE];

  suivants.forEach((id) => {
    etapes.push(`fl_splice,l_video:${enCalque(id)}`, CADRAGE, 'fl_layer_apply');
  });

  if (musique) {
    etapes.push('ac_none', `l_audio:${enCalque(musique)}`, 'fl_layer_apply');
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/`
    + `${etapes.join('/')}/${premier}.mp4`;
}

/** Adresse d'un clip seul, ramené au même cadrage que les montages. */
export function urlVideo(publicId) {
  if (!aCloudinary || !publicId) return null;
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${CADRAGE}/${publicId}.mp4`;
}

/**
 * Vignette d'une vidéo : une vraie image, prise à la deuxième seconde.
 *
 * Sans elle, afficher l'aperçu d'une vidéo oblige à charger la vidéo entière
 * pour n'en montrer qu'une image — ce que fait l'application aujourd'hui.
 */
export function urlVignette(publicId, { seconde = 2 } = {}) {
  if (!aCloudinary || !publicId) return null;
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/`
    + `so_${seconde},${CADRAGE}/${publicId}.jpg`;
}

/**
 * Envoie une vidéo et renvoie son identifiant Cloudinary.
 *
 * Le fichier part directement du téléphone vers Cloudinary, en flux continu :
 * il ne transite pas par nos serveurs. Seule la signature vient de chez nous.
 */
export async function envoyerVideo({ uri, onProgress }) {
  const { supabase, hasSupabase } = await import('./supabase');
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

  const { File, UploadType } = await import('expo-file-system');
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
