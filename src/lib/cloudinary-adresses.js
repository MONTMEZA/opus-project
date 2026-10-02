/**
 * LES ADRESSES CLOUDINARY — du calcul de chaînes, et rien d'autre.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Il était dans `cloudinary.js`, avec l'envoi des fichiers. Donc avec
 * `./supabase`, donc avec React Native. Et `npm run verifier-montage`, qui
 * ne contrôle QUE la fabrication de ces chaînes, ne pouvait plus se lancer :
 *
 *     Cannot find module '/home/.../src/lib/supabase'
 *
 * Il tombait ainsi depuis le jour où les `await import(...)` ont été
 * interdits dans `src/` : avant, la connexion n'était chargée qu'à l'envoi,
 * et `node` pouvait ouvrir le fichier sans rien d'autre. Le commentaire qui
 * le promettait est resté en place après le changement — c'est exactement
 * une panne silencieuse : le contrôle plantait, personne ne le lançait, et
 * une adresse de montage fausse serait passée sans bruit.
 *
 * Ces adresses sont de longues chaînes où l'ordre des morceaux compte : une
 * barre oblique oubliée, et Cloudinary renvoie une erreur au lieu d'une
 * vidéo. D'où un fichier qui n'importe RIEN, et qu'un `node` ouvre.
 */

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
 * Transforme l'adresse d'une vidéo Cloudinary en celle de son aperçu.
 *
 * Mesuré sur un clip réel : 45 Ko pour l'image contre 780 Ko pour la vidéo.
 * Une grille de six réalisations passe donc de 4,7 Mo à 270 Ko — et n'ouvre
 * plus six décodeurs vidéo pour ne montrer que six images fixes.
 *
 * Renvoie l'adresse telle quelle si elle ne vient pas de Cloudinary.
 */
export function apercuDe(url) {
  if (typeof url !== 'string') return url;
  if (!url.includes('/video/upload/')) return url;
  return url
    .replace('/video/upload/', '/video/upload/so_2,')
    .replace(/\.(mp4|mov|m4v|webm)(\?|$)/i, '.jpg$2');
}
