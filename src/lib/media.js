/**
 * Accès à l'appareil photo, à la galerie et aux fichiers.
 *
 * Ces fonctions ne renvoient que l'adresse LOCALE du fichier sur le
 * téléphone. L'envoi vers Supabase Storage se fait ensuite (voir
 * lib/storage.js) : c'est lui qui rend le média visible par les autres.
 */
import * as ImagePicker from 'expo-image-picker';

/** Au-delà, l'envoi échoue côté Supabase (limite par fichier). */
export const TAILLE_MAX_MO = 45;

/** Un clip de montage : court, sinon le fichier devient trop lourd. */
export const DUREE_CLIP_MAX = 30;
export const CLIPS_MAX = 6;

/** Formats de découpe selon l'usage. */
const RATIOS = {
  avatar: [1, 1],
  banniere: [3, 1],
  photo: [4, 3],
};

async function autorisation(camera) {
  const demande = camera
    ? ImagePicker.requestCameraPermissionsAsync
    : ImagePicker.requestMediaLibraryPermissionsAsync;
  const { granted } = await demande();
  return granted;
}

/**
 * Ouvre l'appareil photo ou la galerie et renvoie l'adresse locale de l'image
 * choisie, ou null si l'utilisateur annule ou refuse l'autorisation.
 */
export async function choisirImage({ camera = false, usage = 'photo' } = {}) {
  if (!(await autorisation(camera))) {
    throw new Error(camera
      ? "Accès à l'appareil photo refusé. Autorisez-le dans les réglages du téléphone."
      : 'Accès aux photos refusé. Autorisez-le dans les réglages du téléphone.');
  }

  const options = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: RATIOS[usage] || RATIOS.photo,
    quality: 0.8,
  };

  const res = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  return res.assets[0].uri;
}

/** Une vidéo, filmée ou prise dans la galerie. Renvoie l'asset complet. */
export async function choisirVideo({ camera = false, dureeMax = 60 } = {}) {
  if (!(await autorisation(camera))) {
    throw new Error('Accès refusé. Autorisez-le dans les réglages du téléphone.');
  }

  const options = {
    mediaTypes: ['videos'],
    allowsEditing: true,
    videoMaxDuration: dureeMax,
    quality: 0.8,
  };

  const res = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  return res.assets[0];
}

/**
 * Plusieurs clips d'un coup, pour un montage. La galerie permet la sélection
 * multiple ; l'appareil photo, non — on filme un clip à la fois.
 */
export async function choisirClips({ restants = CLIPS_MAX } = {}) {
  if (!(await autorisation(false))) {
    throw new Error('Accès aux vidéos refusé. Autorisez-le dans les réglages du téléphone.');
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsMultipleSelection: true,
    selectionLimit: Math.max(1, restants),
    videoMaxDuration: DUREE_CLIP_MAX,
    quality: 0.8,
  });

  if (res.canceled || !res.assets) return [];
  return res.assets.map((a) => ({
    uri: a.uri,
    duree: a.duration ? Math.round(a.duration / 1000) : null,
    taille: a.fileSize || null,
  }));
}

/**
 * Bande-son du montage, prise dans les fichiers du téléphone.
 *
 * Pas de bibliothèque de musiques intégrée : il faudrait des morceaux sous
 * licence, ce qui est une décision d'entreprise, pas un détail technique.
 * L'artisan apporte donc sa musique — et reste responsable de ses droits.
 */
export async function choisirMusique() {
  const DocumentPicker = await import('expo-document-picker');
  const res = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const a = res.assets[0];
  return { uri: a.uri, nom: a.name, taille: a.size };
}

/**
 * Choix d'un justificatif : PDF ou photo du document.
 * Un Kbis est souvent un PDF téléchargé, une attestation d'assurance souvent
 * une photo — on accepte les deux.
 */
export async function choisirDocument() {
  const DocumentPicker = await import('expo-document-picker');
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const a = res.assets[0];
  return { uri: a.uri, nom: a.name, taille: a.size, type: a.mimeType };
}
