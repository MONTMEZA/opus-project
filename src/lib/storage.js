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
/* POURQUOI CES IMPORTS SONT EN HAUT, ET PLUS `await import(...)`
   --------------------------------------------------------------
   Un `await import()` n'est pas un import : sur téléphone, c'est Metro qui
   DÉCOUPE le paquet et va chercher le morceau manquant auprès du serveur
   de développement, au moment où la ligne s'exécute. Si la liaison a été
   perdue entre-temps — veille du téléphone, Wi-Fi qui bouge, serveur
   redémarré —, l'envoi échoue sur une erreur venue des entrailles d'Expo,
   qui ne parle ni du fichier ni du réseau.

   C'est très probablement ce qu'a vu le propriétaire le 01/10/2026 :
   « envoi de la photo de profil impossible : cannot read property
   'reload' of undefined ». `reload` n'existe nulle part dans ce projet ;
   il vient du mécanisme de découpage d'Expo.

   Et ça explique l'épisode du 29/09, resté sans explication : la photo de
   profil qui refusait de s'enregistrer, puis qui a remarché après un
   `npm start -- --clear` — sans qu'aucune correction n'ait touché à
   l'envoi. Un paquet redécoupé proprement, et le morceau redevient
   joignable.

   Ces modules sont des dépendances DIRECTES du projet : ils sont dans le
   paquet de toute façon. Les charger en haut ne coûte rien et retire
   entièrement ce mécanisme du chemin d'un envoi. */
import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';
import { supabase, hasSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { TAILLE_MAX_MO } from './media';

/* LE CALCUL DE L'EXTENSION VIT DANS SON PROPRE FICHIER, qui n'importe
   rien — c'est ce qui permet au contrôle de le FAIRE TOURNER. Il était
   ici, et il lisait l'extension dans l'ADRESSE du fichier : une adresse
   `blob:` n'en contient aucune, et l'extension devenait l'adresse
   entière. Toute l'histoire est dans `types-fichiers.js`. */
import { typeDeFichier } from './types-fichiers';

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
/** Les espaces qui ne rendent jamais d'adresse publique. */
export const ESPACES_PRIVES = ['documents', 'pieces-jointes'];

export async function envoyerFichier({
  uri, bucket, nom, userId, onProgress, nomOrigine = null, typeMime = null,
}) {
  if (!hasSupabase) return uri;           // mode démo : on garde l'adresse locale
  if (!uri || !userId) return null;

  /* LE NOM D'ORIGINE PASSE AVANT L'ADRESSE, et c'est tout le correctif du
     04/10/2026 : `devis.pdf` dit ce qu'il est, `blob:http://localhost:8097/…`
     ne dit rien. L'appelant qui connaît le nom choisi par l'utilisateur le
     donne ; les autres (avatar, bannière, publication) ne passent rien et
     retrouvent exactement l'ancien comportement. */
  const { ext, type } = typeDeFichier(nomOrigine || uri, typeMime);
  const chemin = `${userId}/${nom}-${Date.now()}.${ext}`;

  if (Platform.OS === 'web') {
    await envoiWeb({ uri, bucket, chemin, type });
  } else {
    await envoiTelephone({ uri, bucket, chemin, type, onProgress });
  }

  /* LES ESPACES PRIVÉS rendent le CHEMIN, pas une adresse : il n'y a pas
     d'adresse publique à publier, et en fabriquer une donnerait un lien
     mort. L'écran demande une adresse signée au moment de l'ouverture.
     `pieces-jointes` s'est ajouté le 04/10/2026 (section 28) — l'oublier
     ici aurait rangé une URL inutilisable dans chaque message. */
  if (ESPACES_PRIVES.includes(bucket)) return chemin;
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
  /* CHAQUE ÉTAPE PORTE SON NOM
     --------------------------
     Un envoi qui échoue depuis un téléphone ne se reproduit pas dans le
     conteneur où je travaille : la seule chose dont je dispose, c'est le
     message que voit le propriétaire. Quand il disait seulement « envoi
     impossible », il fallait deviner laquelle des quatre étapes avait
     lâché — et deux fois, on a deviné faux.

     Les étapes ne coûtent rien et transforment un message inutile en
     indication. `etape()` enveloppe l'erreur sans la perdre : la cause
     d'origine reste écrite à la fin. */
  const etape = async (nom, action) => {
    try {
      return await action();
    } catch (e) {
      const cause = (e && e.message) || String(e);
      /* Déjà nommée par un appel plus profond : on ne rempile pas. */
      if (cause.startsWith('[')) throw e;
      throw new Error(`[${nom}] ${cause}`);
    }
  };

  const fichier = await etape('lecture du fichier', async () => new File(uri));

  const taille = await etape('taille du fichier', async () => fichier.size || 0);
  if (taille > TAILLE_MAX_MO * 1024 * 1024) throw tropLourd(taille);

  const session = await etape('session', async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  });
  if (!session) throw new Error('Session expirée. Reconnectez-vous et réessayez.');

  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURI(chemin)}`;
  const resultat = await etape('envoi vers Supabase', async () => fichier.upload(url, {
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
  }));

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
