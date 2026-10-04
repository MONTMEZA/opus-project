/**
 * LES PIÈCES JOINTES — ce qui ne doit jamais se relâcher.
 *
 * L'IDÉE EST DU PROPRIÉTAIRE, LE RISQUE EST AILLEURS
 * ---------------------------------------------------
 * « Des pièces jointes dans la messagerie » : recevoir un plan, un devis
 * signé, une attestation. Le besoin est simple ; ce qui l'est moins, c'est
 * que ce fichier doit être lisible par DEUX personnes, alors que tout le
 * reste du stockage suit la règle « chacun son dossier ».
 *
 * Un devis porte des prix, un plan porte une adresse. Une règle trop large
 * ici ne casse rien, ne lève aucune erreur, et laisse n'importe quel compte
 * lire les devis des autres.
 *
 * LES DEUX CHOSES QUI COMPTENT LE PLUS
 * ------------------------------------
 *   1. **Les deux politiques posent les TROIS questions** : est-ce mon
 *      dossier, est-ce ma conversation, et n'y a-t-il pas de blocage ? Il
 *      suffit d'en oublier une pour tout ouvrir.
 *   2. **Aucune adresse publique n'est fabriquée pour cet espace.** Il est
 *      privé : `getPublicUrl` y rendrait un lien qui répond 404, rangé dans
 *      chaque message, et découvert des semaines plus tard.
 *
 *   npm run verifier-pieces-jointes
 */
import { readFileSync } from 'node:fs';
import { typeDeFichier, morceauDeChemin } from '../src/lib/types-fichiers.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*--.*$/gm, '')
  .replace(/^\s*\/\/.*$/gm, '');

const sql = lire('supabase/schema.sql');
const section = sql.slice(sql.indexOf('--  28. LES PIÈCES JOINTES'));
const api = sansCommentaires(lire('src/lib/api.js'));
const ecran = sansCommentaires(lire('src/screens/ConversationScreen.js'));
const edge = lire('supabase/functions/compte/index.ts');

console.log('\nL’espace est privé, et borné');
{
  verifier('l’espace `pieces-jointes` existe',
    /'pieces-jointes', 'pieces-jointes', false/.test(section),
    'le troisième paramètre est `public` : il doit être FAUX');
  verifier('…avec une limite de taille',
    /file_size_limit[\s\S]{0,80}pieces-jointes/.test(section));
  verifier('…et l’application refuse AVANT d’envoyer',
    /TAILLE_MAX_PIECE/.test(api) && /refusPiece/.test(api),
    'sinon le refus arrive au bout de la montée — trois minutes en 4G pour rien');
  verifier('l’écran appelle ce refus', /refusPiece\(/.test(ecran));
}

console.log('\nLes deux politiques posent les TROIS questions');
{
  const lecture = section.slice(section.indexOf('create policy "lecture piece jointe"'),
    section.indexOf('drop policy if exists "envoi piece jointe"'));
  const envoi = section.slice(section.indexOf('create policy "envoi piece jointe"'));

  [['lecture', lecture], ['envoi', envoi]].forEach(([nom, bloc]) => {
    verifier(`${nom} — la conversation est vérifiée`,
      /from public\.conversations c/.test(bloc) && /foldername\(name\)\)\[2\]/.test(bloc),
      'sans cela, n’importe qui lit les devis de n’importe qui');
    verifier(`${nom} — je dois en faire partie`,
      /c\.client_id = auth\.uid\(\) or c\.professional_id = auth\.uid\(\)/.test(bloc));
    verifier(`${nom} — le blocage s’applique`,
      /est_masque\(c\.client_id\)/.test(bloc) && /est_masque\(c\.professional_id\)/.test(bloc),
      'bloquer quelqu’un masquerait ses messages et laisserait ses fichiers');
  });

  verifier('envoi — on n’écrit que dans SON dossier',
    /foldername\(name\)\)\[1\] = auth\.uid\(\)::text/.test(envoi),
    'c’est la règle de tout le stockage, et c’est elle qui rend le ménage possible');

  /* `::uuid` sur un nom de fichier mal formé ferait échouer la conversion,
     donc la politique entière, sur TOUTES les lignes. */
  verifier('la comparaison reste du texte, jamais un `::uuid`',
    !/foldername\(name\)\)\[2\]\)::uuid/.test(section)
    && /c\.id::text = \(storage\.foldername/.test(section),
    'un nom mal formé ferait lever une exception au lieu de filtrer');
}

console.log('\nCe qui a été envoyé ne se défait pas');
{
  /* Même règle qu'un message, qui ne se récrit pas (section 20) : ce qui
     engage quelqu'un d'autre se ferme. Et retirer le fichier laisserait un
     lien mort dans la conversation. */
  const defait = /create policy[^;]*pieces-jointes[\s\S]{0,400}for\s+(update|delete|all)/i.test(section)
    || /for\s+(update|delete)\s+to authenticated[\s\S]{0,200}pieces-jointes/i.test(section);
  verifier('aucune politique de modification ni de suppression', !defait,
    'une pièce envoyée ne se retire pas — comme un message ne se récrit pas');
}

console.log('\nUne bulle n’est jamais vide');
{
  verifier('la base exige du texte OU une pièce',
    /messages_contenu_check[\s\S]{0,200}btrim\(texte\) <> ''[\s\S]{0,60}piece_url is not null/.test(section),
    '`texte` est `not null`, mais rien n’empêchait une chaîne vide');
  verifier('les quatre colonnes existent',
    ['piece_url', 'piece_nom', 'piece_taille', 'piece_type']
      .every((c) => new RegExp(`add column if not exists ${c}`).test(section)));
}

console.log('\nAucune adresse publique pour un espace privé');
{
  const storage = sansCommentaires(lire('src/lib/storage.js'));
  verifier('`pieces-jointes` est déclaré privé côté application',
    /ESPACES_PRIVES[\s\S]{0,120}'pieces-jointes'/.test(storage),
    '`getPublicUrl` y rendrait un lien qui répond 404, rangé dans chaque message');
  verifier('…et l’ouverture passe par une adresse SIGNÉE',
    /createSignedUrl\('?[\s\S]{0,60}/.test(api) && /urlPiece/.test(api));
  verifier('l’écran demande cette adresse au moment de l’ouverture',
    /urlPiece\(/.test(ecran),
    'une adresse éternelle posée dans une conversation finit par circuler');
}

console.log('\nLe trombone laisse CHOISIR d’où vient le fichier');
{
  /* LE DÉFAUT SIGNALÉ PAR LE PROPRIÉTAIRE le 04/10/2026, après l'avoir
     essayé sur son iPhone : « le bouton ouvre directement les fichiers sur
     le téléphone ; il faudrait qu'on puisse choisir, si par exemple ce
     qu'on veut envoyer est une photo ».

     Sur iPhone, Fichiers et Photos sont DEUX MONDES SÉPARÉS : la
     photothèque n'apparaît pas dans Fichiers, et aucun filtre `image/*`
     n'y change quoi que ce soit. Sur un chantier, la photo est pourtant le
     cas le plus fréquent. */
  const media = sansCommentaires(lire('src/lib/media.js'));
  const choix = sansCommentaires(lire('src/components/ChoixPiece.js'));

  verifier('les trois portes existent',
    ['photos', 'camera', 'fichiers']
      .every((c) => new RegExp(`cle: '${c}'`).test(media)),
    'la photothèque, l’appareil photo et les fichiers : trois endroits '
    + 'différents sur un iPhone');

  verifier('le trombone ouvre le choix, pas directement les fichiers',
    /setChoixOuvert\(true\)/.test(ecran) && !/onPress=\{joindre\}/.test(ecran),
    'c’est exactement le défaut du 04/10/2026');

  verifier('…et il a l’icône d’un trombone',
    /<Paperclip /.test(ecran),
    'une icône de document laisse croire qu’on ne peut envoyer que des fichiers');

  /* UNE PIÈCE JOINTE NE SE RECADRE PAS. `choisirImage()` impose un rapport
     fixe parce qu'une photo de publication entre dans un cadre ; recadrer
     en 16:10 la photo d'une fissure verticale en couperait la moitié. */
  const bloc = media.slice(media.indexOf('export async function choisirPieceJointe'));
  verifier('aucun recadrage imposé sur une pièce jointe',
    !/allowsEditing/.test(bloc),
    'recadrer la photo d’une fissure verticale en couperait la moitié');

  verifier('chaque choix porte une phrase, pas seulement un mot',
    (media.match(/aide: '/g) || []).length >= 3 && /source\.aide/.test(choix),
    '« Photothèque » et « Fichiers » ne veulent rien dire pour qui ne '
    + 'connaît pas iOS');

  /* Une photo d'iPhone pèse 5 à 12 Mo et passe par `reduireImage()` : la
     refuser sur son poids BRUT écarterait des photos qui, réduites,
     tiennent dix fois dans la limite. */
  verifier('une photo n’est pas refusée sur son poids d’origine',
    /startsWith\('image\/'\)/.test(api.slice(api.indexOf('export function refusPiece'),
      api.indexOf('async function envoyerPieceSupabase'))),
    'un iPhone rend des photos de 5 à 12 Mo, et elles sont réduites avant '
    + 'de partir');
}

console.log('\nL’extension se lit dans le NOM, pas dans l’adresse');
{
  /* CE BLOC FAIT TOURNER LE CALCUL, il ne relit pas le code. C'est pour ça
     que `types-fichiers.js` n'importe rien : rangé dans `storage.js`, qui
     charge React Native, `node` ne pourrait pas l'ouvrir — et le contrôle
     planterait au lieu de vérifier. La leçon de `cloudinary-adresses.js`.

     LE CAS QUI A CASSÉ, le 04/10/2026, mesuré sur la vraie base. Au
     navigateur, `expo-document-picker` rend une adresse `blob:` sans aucun
     point, et `split('.').pop()` rendait l'adresse ENTIÈRE comme
     extension. Le fichier s'est rangé deux niveaux trop bas, le ménage de
     compte ne l'a plus trouvé, et la réponse disait pourtant
     « retires: 0 » sans erreur. */
  const blob = 'blob:http://localhost:8097/3e7d592e-7bb0-4322-998b-d8fe46f01150';

  verifier('une adresse `blob:` ne donne JAMAIS son contenu comme extension',
    typeDeFichier(blob).ext === 'jpg' && !typeDeFichier(blob).ext.includes(':'),
    `a rendu « ${typeDeFichier(blob).ext} »`);

  verifier('…et le nom du fichier, lui, décide',
    typeDeFichier('devis-signe.pdf', 'application/pdf').ext === 'pdf');

  verifier('le type MIME rattrape un nom sans extension',
    typeDeFichier(blob, 'application/pdf').ext === 'pdf'
    && typeDeFichier(blob, 'application/pdf').type === 'application/pdf',
    'c’est ce que rend le sélecteur de fichiers : plus fiable qu’un nom tapé');

  verifier('un PDF est enregistré comme un PDF, pas en octets bruts',
    typeDeFichier('devis.pdf').type === 'application/pdf',
    'servi en `application/octet-stream`, un devis se télécharge au lieu de s’ouvrir');

  /* Les appels historiques (avatar, bannière, publication) ne passent ni
     nom ni type : ils doivent retrouver EXACTEMENT l'ancien résultat. */
  verifier('les envois d’images gardent leur comportement',
    typeDeFichier('file:///data/photo.jpg').ext === 'jpg'
    && typeDeFichier('file:///data/clip.mov').type === 'video/quicktime'
    && typeDeFichier('file:///data/photo.JPG?x=1').ext === 'jpg');

  /* UN NOM NE CREUSE PAS DE DOSSIER. Le chemin d'un objet est
     `<uid>/<conversation>/<nom>` ; une barre oblique ou un deux-points de
     plus, et la politique ne compte plus les mêmes niveaux. */
  [['../../autre/devis.pdf', 'un nom ne remonte pas d’un dossier'],
   ['a/b/c.pdf', 'un nom ne creuse pas de niveaux'],
   ['blob:http://x/y.pdf', 'une adresse entière ne passe pas en nom'],
   ['', 'un nom vide reste un nom']].forEach(([entree, quoi]) => {
    const m = morceauDeChemin(entree);
    verifier(quoi,
      !m.includes('/') && !m.includes(':') && m.length > 0,
      `« ${entree} » → « ${m} »`);
  });
}

console.log('\nLe ménage de compte descend jusqu’aux pièces');
{
  /* `list()` ne descend PAS tout seul : il rend les sous-dossiers comme des
     entrées sans `id`. Sans récursion, les pièces jointes resteraient après
     la fermeture d'un compte — un trou RGPD invisible. */
  verifier('la fonction Edge connaît l’espace',
    /'pieces-jointes'/.test(edge));
  verifier('…et elle descend dans les sous-dossiers',
    /listerFichiers/.test(edge) && /entree\.id/.test(edge),
    '`list()` rend un sous-dossier comme une entrée sans identifiant : '
    + 'sans récursion, les fichiers restent après la fermeture du compte');

  /* ET SURTOUT : elle DIT quand elle s'est arrêtée. Le 04/10/2026, elle a
     répondu « retires: 0, erreur: null » sur un fichier qui est resté. Un
     ménage incomplet ne doit pas pouvoir ressembler à un ménage fait. */
  verifier('…et elle signale une arborescence trop profonde',
    /tronque/.test(edge) && /dépassent \$\{PROFONDEUR_MAX\} niveaux/.test(edge),
    'sans ça, un fichier oublié se solde par « retires: 0 » sans erreur — '
    + 'exactement ce qui a caché le trou RGPD du 04/10/2026');
}

console.log('\nL’appelant passe bien le nom et le type');
{
  verifier('`envoyerFichier` accepte un nom d’origine et un type',
    /nomOrigine/.test(sansCommentaires(lire('src/lib/storage.js')))
    && /typeMime/.test(sansCommentaires(lire('src/lib/storage.js'))));
  const envoi = api.slice(api.indexOf('async function envoyerPieceSupabase'),
    api.indexOf('async function envoyerMessageDemo'));
  verifier('…et l’envoi d’une pièce les passe',
    /nomOrigine:/.test(envoi) && /typeMime:/.test(envoi),
    'sans eux, l’extension retombe sur l’adresse du fichier');
  verifier('le nom est assaini avant d’entrer dans le chemin',
    /morceauDeChemin\(/.test(envoi));

  /* CE QUI EST ENVOYÉ N'EST PAS TOUJOURS CE QUI A ÉTÉ CHOISI :
     `reduireImage()` enregistre en JPEG. Un PNG réduit resterait annoncé
     « image/png » sous une extension `.png` alors que ce sont des octets
     JPEG, et la bulle afficherait le poids d'AVANT — un chiffre faux rangé
     en base pour toujours. */
  verifier('le type suit la réduction, pas le fichier d’origine',
    /image\/jpeg/.test(envoi),
    'un PNG réduit reste annoncé « image/png » alors que ce sont des octets JPEG');

  /* LE POIDS VIENT DE L'ENVOI LUI-MÊME. `poidsDe()` ne répond rien au
     navigateur (`expo-file-system` n'y a pas de fichiers), et une photo
     réduite de 5,9 Mo à 1,3 Mo était rangée en base comme pesant 5,9 —
     mesuré sur la vraie base le 04/10/2026. */
  verifier('le poids rangé en base est celui du fichier RÉELLEMENT envoyé',
    /onTaille:/.test(envoi)
    && /onTaille\(octets\.length\)/.test(sansCommentaires(lire('src/lib/storage.js')))
    && /onTaille && taille/.test(sansCommentaires(lire('src/lib/storage.js'))),
    'sinon la bulle annonce 5,9 Mo pour un fichier de 1,3 Mo, pour toujours');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Un devis n’est lisible que par les deux personnes de la '
  + 'conversation, et il part avec le compte.\n');
