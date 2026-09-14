/**
 * Accès à l'appareil photo et à la galerie.
 *
 * Pour l'instant on récupère seulement le fichier choisi sur le téléphone
 * (son adresse locale). L'envoi vers Supabase Storage viendra avec le bloc
 * suivant : c'est ce qui rendra la photo visible par les autres utilisateurs.
 */
import * as ImagePicker from 'expo-image-picker';

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

/** Même chose pour une vidéo (utilisé plus tard par la publication). */
export async function choisirVideo({ camera = false, dureeMax = 60 } = {}) {
  if (!(await autorisation(camera))) {
    throw new Error("Accès refusé. Autorisez-le dans les réglages du téléphone.");
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
