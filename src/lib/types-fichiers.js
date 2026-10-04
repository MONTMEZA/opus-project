/**
 * DE QUEL TYPE EST CE FICHIER, ET SOUS QUELLE EXTENSION LE RANGER.
 *
 * POURQUOI CE FICHIER EXISTE TOUT SEUL
 * ------------------------------------
 * C'est la leçon de `cloudinary-adresses.js` et de `cadre.js`, apprise deux
 * fois : **un calcul pur rangé dans un fichier qui importe React Native ne
 * peut pas être CONTRÔLÉ.** `node` ne sait pas ouvrir React Native, donc le
 * contrôle plante au lieu de vérifier — et un contrôle qui plante n'écrit
 * aucun « ✘ », donc personne ne s'en aperçoit.
 *
 * Ce fichier n'importe RIEN. `npm run verifier-pieces-jointes` le fait
 * tourner pour de vrai, sur les adresses qui ont déjà cassé.
 *
 * LE DÉFAUT QUI L'A FAIT NAÎTRE — mesuré le 04/10/2026
 * ----------------------------------------------------
 * L'extension était lue dans l'ADRESSE du fichier :
 *
 *     const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
 *
 * Sur un téléphone, `expo-document-picker` rend
 * `file:///…/DocumentPicker/devis.pdf` : l'extension est juste. Au
 * navigateur, il rend `blob:http://localhost:8097/3e7d592e-…`, qui ne
 * contient **aucun point** — et `'abc'.split('.').pop()` rend `'abc'`.
 * L'extension devenait donc l'adresse ENTIÈRE. Le fichier s'est rangé là :
 *
 *     <uid>/<conversation>/devis-essai-1791122012598.blob:http:/localhost:8097/3e7d…
 *
 * Trois conséquences, et la première est la plus grave :
 *
 *   1. **le ménage de compte ne le trouvait plus.** Les deux-points et les
 *      barres obliques ont créé DEUX niveaux de dossier en trop ; la
 *      fonction Edge descend jusqu'à trois. Mesuré sur la vraie base : le
 *      compte d'essai supprimé, son message effacé… et le fichier toujours
 *      là, `"pieces-jointes","retires":0`. Un trou RGPD que rien ne
 *      signalait ;
 *   2. le type enregistré était `application/octet-stream` au lieu de
 *      `application/pdf` : un devis se télécharge au lieu de s'ouvrir ;
 *   3. le nom du fichier devenait illisible.
 *
 * LA RÈGLE QUI EN SORT
 * --------------------
 * > **L'extension se lit dans le NOM du fichier, pas dans son adresse.**
 * > Et une extension est un mot court : tout ce qui ne l'est pas n'est pas
 * > une extension, c'est autre chose qu'on vient de lire par erreur.
 */

/** Ce qu'on sait nommer. L'extension décide du type, pas l'inverse. */
export const TYPES = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  heic: 'image/heic', webp: 'image/webp', gif: 'image/gif',
  mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/mp4',
  mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac',
  wav: 'audio/wav', ogg: 'audio/ogg',
  pdf: 'application/pdf',
};

/**
 * L'inverse, pour les cas où le nom ne dit rien mais où le sélecteur de
 * fichiers, lui, connaît le type. C'est le système d'exploitation qui le
 * donne : il est plus fiable qu'un nom tapé à la main.
 */
export const EXTENSIONS = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic',
  'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov',
  'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/aac': 'aac',
  'audio/wav': 'wav', 'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
};

/**
 * Une extension est un mot court, de lettres et de chiffres.
 *
 * C'est tout le garde-fou, et il tient en une expression : `blob:http://…`,
 * un chemin, une adresse complète ou une phrase ne passent pas. Sans lui,
 * n'importe quoi devenait une extension — y compris des caractères que le
 * stockage lit comme des séparateurs de dossier.
 */
export function estExtension(mot) {
  return /^[a-z0-9]{1,5}$/.test(String(mot || ''));
}

/**
 * L'extension et le type d'un fichier.
 *
 * `source` est de préférence le NOM du fichier (`devis.pdf`) ; une adresse
 * marche aussi quand c'est tout ce qu'on a. `typeConnu` est le type MIME
 * rendu par le sélecteur de fichiers, quand il y en a un.
 *
 * Par défaut, `jpg` : tous les appels historiques du projet envoient des
 * images (avatar, bannière, publication), et c'était déjà le défaut.
 */
export function typeDeFichier(source, typeConnu = null) {
  const propre = String(source || '').split('?')[0].split('#')[0];
  const point = propre.lastIndexOf('.');
  const brut = point === -1 ? '' : propre.slice(point + 1).toLowerCase();

  if (estExtension(brut)) {
    /* Le type du catalogue d'abord : il correspond à l'extension sous
       laquelle le fichier est VRAIMENT rangé, donc à la façon dont il sera
       servi. À défaut, ce que dit le sélecteur. */
    return { ext: brut, type: TYPES[brut] || typeConnu || 'application/octet-stream' };
  }

  if (typeConnu && EXTENSIONS[typeConnu]) {
    return { ext: EXTENSIONS[typeConnu], type: typeConnu };
  }

  return { ext: 'jpg', type: typeConnu || 'image/jpeg' };
}

/**
 * Un morceau de chemin de stockage SÛR.
 *
 * Le chemin d'un objet est `<uid>/<…>/<nom>`, et la barre oblique y est un
 * séparateur de dossier : un nom qui en contient creuse des niveaux que la
 * politique de sécurité ne compte plus et que le ménage de compte ne
 * descend plus. On ne garde donc que lettres, chiffres, point, tiret et
 * tiret bas — exactement ce que `storage.foldername()` sait relire.
 */
export function morceauDeChemin(texte, defaut = 'fichier') {
  const propre = String(texte || '')
    .replace(/\.[^.]*$/, '')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-40);
  return propre || defaut;
}
