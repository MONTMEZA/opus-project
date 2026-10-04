/**
 * Accès à l'appareil photo, à la galerie et aux fichiers.
 *
 * Ces fonctions ne renvoient que l'adresse LOCALE du fichier sur le
 * téléphone. L'envoi vers Supabase Storage se fait ensuite (voir
 * lib/storage.js) : c'est lui qui rend le média visible par les autres.
 */
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Limite par fichier. Supabase plafonne aussi côté projet (50 Mo par défaut) :
 * on reste en dessous pour que le refus vienne d'ici, avec une phrase claire,
 * plutôt que du serveur avec un code d'erreur.
 */
export const TAILLE_MAX_MO = 45;

/**
 * Un clip court, et filmé en qualité moyenne.
 *
 * Ce n'est pas de l'avarice : trente secondes filmées en 4K pèsent plus de
 * 100 Mo, ne passent pas, et mettent une minute à se charger chez celui qui
 * regarde. Vingt secondes en 720p pèsent une dizaine de mégaoctets et
 * démarrent tout de suite. Sur un chantier, c'est la seule version qui sert.
 */
export const DUREE_CLIP_MAX = 20;
export const CLIPS_MAX = 6;

/**
 * Combien de photos dans une même publication.
 *
 * Un chantier ne se montre pas en une image : le carrelage, la douche, la
 * robinetterie, les joints. Six, c'est assez pour raconter un chantier et
 * assez peu pour que personne n'abandonne au milieu du carrousel.
 */
export const PHOTOS_MAX = 6;

/** Qualité de capture vidéo : moyenne, volontairement (voir ci-dessus). */
const QUALITE_VIDEO = ImagePicker.UIImagePickerControllerQualityType
  ? ImagePicker.UIImagePickerControllerQualityType.Medium
  : undefined;

/** Formats de découpe selon l'usage. */
const RATIOS = {
  avatar: [1, 1],
  banniere: [3, 1],
  photo: [4, 3],
};

/**
 * LA LARGEUR MAXIMALE DE CHAQUE IMAGE, SELON CE QU'ELLE SERT À MONTRER.
 *
 * POURQUOI CE RÉGLAGE EXISTE
 * --------------------------
 * `expo-image-picker` était réglé sur `quality: 0.8` mais SANS aucune limite
 * de dimension : une photo d'iPhone arrivait telle quelle, 3 à 4 Mo. Une
 * publication de six photos, c'était une vingtaine de mégaoctets — à
 * l'envoi, sur le forfait de l'artisan, et de nouveau à CHAQUE fois que
 * quelqu'un la regardait.
 *
 * 1600 px de large, c'est déjà plus que ce que montre un téléphone (un
 * iPhone affiche environ 1200 px de large en pixels réels sur toute la
 * largeur de l'écran). Au-delà, on paie des pixels que personne ne voit.
 *
 * Un avatar de 40 px affiché n'a aucun besoin de 4000 px : 512 suffisent
 * largement, y compris sur la grande photo du profil.
 */
const LARGEUR_MAX = {
  photo: 1600,
  banniere: 1600,
  avatar: 512,
};

/** En dessous, on ne touche à rien : recompresser une petite image l'abîme. */
const POIDS_PLANCHER = 200 * 1024;

/**
 * Réduit une image avant l'envoi, et renvoie sa nouvelle adresse locale.
 *
 * Deux garde-fous :
 *   - on ne fait RIEN si le fichier est déjà petit. Repasser une image de
 *     80 Ko dans un compresseur la dégrade sans rien gagner ;
 *   - en cas d'échec, on renvoie l'image d'origine plutôt que de faire
 *     échouer la publication. Une photo lourde vaut mieux que pas de photo.
 *
 * `resize` avec la seule largeur conserve les proportions : on ne déforme
 * jamais, et on ne recadre pas — le recadrage, c'est le rôle de
 * `allowsEditing`, quand l'utilisateur le décide.
 */
export async function reduireImage(uri, usage = 'photo') {
  if (!uri) return uri;
  const largeur = LARGEUR_MAX[usage] || LARGEUR_MAX.photo;

  try {
    const avant = await poidsDe(uri);
    if (avant !== null && avant < POIDS_PLANCHER) return uri;

    /* L'API contextuelle d'expo-image-manipulator : on enchaîne les
       transformations, `renderAsync` attend qu'elles soient faites, et
       `saveAsync` écrit le résultat dans le cache. `resize` avec la seule
       largeur conserve les proportions. */
    const rendu = await ImageManipulator.manipulate(uri)
      .resize({ width: largeur })
      .renderAsync();
    const image = await rendu.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
    return image.uri || uri;
  } catch (e) {
    /* On le dit dans les journaux — c'est ce qui permettra de comprendre si
       un jour les envois redeviennent lourds — mais on ne bloque pas. */
    console.warn('Réduction de l’image impossible, envoi tel quel :', e);
    return uri;
  }
}

/**
 * Le poids d'un fichier local, ou null si on ne peut pas le savoir.
 *
 * `getInfoAsync` n'existe plus dans expo-file-system : depuis le SDK 54,
 * c'est la classe `File` qui porte la taille. Même usage que dans
 * lib/storage.js.
 */
export async function poidsDe(uri) {
  try {
    const taille = new File(uri).size;
    return typeof taille === 'number' ? taille : null;
  } catch {
    return null;
  }
}

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
  return reduireImage(res.assets[0].uri, usage);
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
    videoQuality: QUALITE_VIDEO,
    quality: 0.7,
  };

  const res = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  return res.assets[0];
}

/**
 * Plusieurs photos d'un coup, pour une publication à faire défiler.
 *
 * ATTENTION à un détail qui surprend : avec `allowsMultipleSelection`, le
 * recadrage (`allowsEditing`) est IGNORÉ par le système, sur iPhone comme sur
 * Android. Les photos gardent donc leur cadrage d'origine — ce qui tombe
 * bien ici : c'est le carrousel qui impose un cadre commun à l'affichage, et
 * recadrer six photos à la main serait une corvée.
 */
export async function choisirPhotos({ restants = PHOTOS_MAX } = {}) {
  if (!(await autorisation(false))) {
    throw new Error('Accès aux photos refusé. Autorisez-le dans les réglages du téléphone.');
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: Math.max(1, restants),
    quality: 0.8,
  });

  if (res.canceled || !res.assets) return [];
  /* En série : six réductions en parallèle saturent la mémoire d'un
     téléphone d'entrée de gamme, et l'application se ferme sans rien dire. */
  const reduites = [];
  for (const a of res.assets) reduites.push(await reduireImage(a.uri, 'photo'));
  return reduites;
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
    videoQuality: QUALITE_VIDEO,
    quality: 0.7,
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
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const a = res.assets[0];
  return { uri: a.uri, nom: a.name, taille: a.size, type: a.mimeType };
}

/**
 * UNE PIÈCE JOINTE, DEPUIS LÀ OÙ ELLE SE TROUVE VRAIMENT.
 *
 * LE DÉFAUT SIGNALÉ PAR LE PROPRIÉTAIRE, le 04/10/2026
 * ----------------------------------------------------
 * « Le bouton ouvre directement les fichiers sur le téléphone ; il faudrait
 * qu'on puisse choisir, si par exemple ce qu'on veut envoyer est une
 * photo. »
 *
 * Il a raison, et c'est une erreur de ma part : sur iPhone, l'application
 * **Fichiers** ne montre PAS la photothèque. Ce sont deux mondes séparés.
 * Un `type: ['image/*']` passé au sélecteur de documents n'y change rien —
 * il filtre ce qu'on voit dans Fichiers, il n'ouvre pas les Photos.
 *
 * Et sur un chantier, c'est le cas le PLUS fréquent : on photographie une
 * fissure, un compteur, un support avant de couler. Le devis en PDF vient
 * après.
 *
 * TROIS PORTES, ET CHACUNE A SA RAISON
 * ------------------------------------
 *   - `photos`   : la photothèque — la fissure prise ce matin ;
 *   - `camera`   : l'appareil photo — on est devant, on ne range pas
 *                  d'abord dans la photothèque pour ressortir aussitôt ;
 *   - `fichiers` : l'application Fichiers — le devis, le plan, le PDF.
 *
 * TROIS CHOSES À NE PAS REDÉCOUVRIR
 * ---------------------------------
 *   1. **Aucun recadrage.** `choisirImage()` impose `allowsEditing` avec un
 *      rapport fixe, parce qu'une photo de publication entre dans un cadre.
 *      Une pièce jointe, non : recadrer en 16:10 la photo d'une fissure
 *      verticale en couperait la moitié. Ici, on ne touche pas au cadrage ;
 *   2. **le nom rendu par la photothèque peut être vide.** On en fabrique
 *      un lisible et daté — « photo-2026-10-04-1530.jpg ». Sans ça, la
 *      bulle afficherait « Pièce jointe » et deux photos du même chantier
 *      deviendraient indiscernables ;
 *   3. **la forme rendue est la MÊME dans les trois cas**
 *      (`{ uri, nom, taille, type }`), pour que l'écran n'ait pas à savoir
 *      d'où vient le fichier.
 */
export const SOURCES_PIECE = [
  { cle: 'photos', label: 'Photothèque', aide: 'Une photo déjà prise' },
  { cle: 'camera', label: 'Appareil photo', aide: 'Photographier maintenant' },
  { cle: 'fichiers', label: 'Fichiers', aide: 'Un devis, un plan, un PDF' },
];

/** Deux chiffres, pour que la date se lise et se trie. */
const deux = (n) => String(n).padStart(2, '0');

function nomDatePour(type) {
  const d = new Date();
  const ext = (type || '').includes('png') ? 'png' : 'jpg';
  return `photo-${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`
    + `-${deux(d.getHours())}${deux(d.getMinutes())}.${ext}`;
}

export async function choisirPieceJointe(depuis = 'fichiers') {
  if (depuis === 'fichiers') return choisirDocument();

  const camera = depuis === 'camera';
  if (!(await autorisation(camera))) {
    throw new Error(camera
      ? 'Accès à l’appareil photo refusé. Autorisez-le dans les réglages du téléphone.'
      : 'Accès aux photos refusé. Autorisez-le dans les réglages du téléphone.');
  }

  /* PAS de `allowsEditing` : voir le point 1 ci-dessus. */
  const options = { mediaTypes: ['images'], quality: 0.8 };
  const res = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const a = res.assets[0];
  const type = a.mimeType || 'image/jpeg';
  return {
    uri: a.uri,
    nom: a.fileName || nomDatePour(type),
    taille: a.fileSize ?? (await poidsDe(a.uri)),
    type,
  };
}
