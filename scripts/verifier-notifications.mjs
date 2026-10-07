/**
 * LA CLOCHE — une notification est une ADRESSE, pas une information.
 *
 * CE QUE CE CONTRÔLE TIENT, ET POURQUOI
 * -------------------------------------
 * Trois défauts relevés par le propriétaire sur son iPhone le 06/10/2026,
 * et aucun ne faisait planter quoi que ce soit :
 *
 *   1. **le rond beige.** `api.js` allait chercher le nom de l'acteur et ne
 *      le transmettait pas. Mesuré sur la vraie base : 13 acteurs sur 13
 *      ont un nom, 1 seul a une photo — donc douze ronds vides, pour une
 *      ligne manquante ;
 *   2. **onze notifications sur quinze ne menaient nulle part.** Un seul
 *      `if (!n.postId) return;` ;
 *   3. **`comment_id` était rempli depuis le premier jour et lu par
 *      personne.** Le défaut du 01/10 dans sa forme la plus pure.
 *
 * Et ce contrôle FAIT TOURNER le calcul au lieu de le relire :
 * `destinationNotif` vit dans `src/lib/notifications.js`, qui n'importe
 * rien — neuvième application de la leçon de `cloudinary-adresses.js`.
 *
 *   npm run verifier-notifications
 */
import { readFileSync } from 'node:fs';

const {
  destinationNotif, TYPES_CONNUS, CIBLE_ATTENDUE, NOTIFS_PROFIL, photoActeur,
} = await import('../src/lib/notifications.js');
const { initialNotifications } = await import('../src/data/demo.js');

let echecs = 0;
const lire = (f) => readFileSync(f, 'utf8');
/* Un contrôle qui lit du code retire d'abord les commentaires : cinq fois
   dans ce projet, un contrôle a accusé la documentation qui EXPLIQUE le
   défaut qu'il traque. */
const sansCommentaires = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

function verifier(titre, ok, pourquoi = '') {
  console.log(`  ${ok ? '✔' : '✘'} ${titre}`);
  if (!ok) { echecs += 1; if (pourquoi) console.log(`      ${pourquoi}`); }
}

const app = sansCommentaires(lire('src/OpusApp.js'));
const api = sansCommentaires(lire('src/lib/api.js'));
const schema = lire('supabase/schema.sql').replace(/^\s*--.*$/gm, '');

/* ------------------------------------------------------------------ */
console.log('\nCHAQUE TYPE SAIT OÙ IL MÈNE — le calcul TOURNE, on ne le lit pas');

/* On fabrique une notification de chaque type, avec la cible que la base y
   met, et on exige que `destinationNotif` ne rende jamais `'rien'`. C'est
   ce qui refusera un type ajouté demain sans destination. */
const orphelins = TYPES_CONNUS.filter((t) => {
  const cle = CIBLE_ATTENDUE[t];
  const n = { type: t };
  if (cle) n[cle] = 'cible-de-contrôle';
  return destinationNotif(n).quoi === 'rien';
});
verifier('aucun type connu ne tombe dans le vide',
  orphelins.length === 0,
  `Ces types ne mènent nulle part : ${orphelins.join(', ')}. Un appui qui ne `
  + 'fait rien est pire que pas d\'appui du tout — la règle du lot 5.');

verifier('…et les quinze types de la base sont couverts',
  TYPES_CONNUS.length >= 15,
  'TYPES_CONNUS doit lister ce que les déclencheurs de schema.sql savent '
  + 'écrire. Un type oublié ici n\'est contrôlé par rien.');

/* DEUX LISTES POUR UNE SEULE VÉRITÉ, c'est le défaut des voyants du
   04/10. `NOTIFS_PROFIL` dit « ce type n'a pas de cible, il mène à la
   fiche » et `CIBLE_ATTENDUE` dit « ce type porte telle colonne ». Les
   deux ne peuvent pas être vraies ensemble : une notification qui a une
   cible ne doit pas atterrir sur le profil, et l'inverse non plus. */
const contradictions = TYPES_CONNUS.filter(
  (t) => NOTIFS_PROFIL.has(t) !== (CIBLE_ATTENDUE[t] === null),
);
verifier('aucun type n\'est à la fois « sans cible » et « avec cible »',
  contradictions.length === 0,
  `Ces types se contredisent entre NOTIFS_PROFIL et CIBLE_ATTENDUE : `
  + `${contradictions.join(', ')}. Deux listes pour une seule vérité `
  + 'finissent toujours par se désaligner.');

verifier('…et un type sans cible mène bien à la fiche',
  [...NOTIFS_PROFIL].every((t) => destinationNotif({ type: t }).quoi === 'profil'),
  'Une vérification acceptée ou un partenariat demandé n\'a aucune cible à '
  + 'ouvrir : la seule destination honnête est la fiche concernée.');

verifier('un commentaire mène au POST **et** au commentaire',
  (() => {
    const d = destinationNotif({ type: 'commentaire', postId: 'p1', commentId: 'c9' });
    return d.quoi === 'post' && d.postId === 'p1' && d.commentId === 'c9';
  })(),
  '`comment_id` était rempli depuis le premier jour et lu par personne.');

verifier('un rappel accepté mène à la DEMANDE, avec son origine',
  (() => {
    const d = destinationNotif({ type: 'rappel_accepte', rappelId: 'r4' });
    return d.quoi === 'demande' && d.id === 'r4' && d.origine === 'rappel';
  })(),
  'L\'origine décide de la pastille : « a accepté votre demande » vit dans '
  + '« En cours », pas dans « À traiter ».');

verifier('la CIBLE passe avant le type',
  (() => {
    /* Un partenariat qui porterait un post irait au post : l'adresse est
       plus précise que la famille. */
    const d = destinationNotif({ type: 'partenaire_demande', postId: 'p7' });
    return d.quoi === 'post';
  })(),
  'Une notification porte son adresse ; le type ne dit que la famille.');

verifier('un type INCONNU rend « rien », il ne plante pas',
  destinationNotif({ type: 'concours_gagne' }).quoi === 'rien'
  && destinationNotif(null).quoi === 'rien',
  'Et l\'écran l\'EXPLIQUE au lieu de ne pas bouger.');

/* ------------------------------------------------------------------ */
console.log('\nLA BASE PORTE LA CIBLE');

for (const col of ['annonce_id', 'devis_id', 'rappel_id', 'sos_id']) {
  verifier(`\`notifications.${col}\` existe`,
    new RegExp(`add column if not exists ${col} uuid`).test(schema));
}

verifier('…et chacune porte une clé étrangère avec son nettoyage',
  (schema.match(/add column if not exists (?:annonce|devis|rappel|sos)_id uuid\s*\n\s*references public\.\w+\(id\) on delete cascade/g) || []).length === 4,
  'Une colonne générique (cible_type, cible_id) ne peut pas porter de clé '
  + 'étrangère : la base ne garantirait plus que la cible existe, et une '
  + 'demande supprimée laisserait une notification qui pointe dans le vide.');

verifier('`notifie_demande()` remplit la bonne des trois',
  /insert into public\.notifications\s*\n?\s*\(user_id, type, texte, acteur_id, devis_id, rappel_id, sos_id\)/.test(schema)
  && /case when genre = 'devis'\s+then new\.id end/.test(schema),
  'Une colonne ajoutée qui resterait vide serait le « bouton §18 ».');

verifier('`notifie_reponse_annonce()` remplit `annonce_id`',
  /insert into public\.notifications \(user_id, type, texte, acteur_id, annonce_id\)/.test(schema),
  'C\'est LE cas que le propriétaire a nommé : « rien ne se passe ».');

/* LE RATTRAPAGE — mesuré sur la vraie base : 7 notifications sur 15 ne
   menaient nulle part, et ce sont exactement celles que le propriétaire a
   touchées. Poser les colonnes sans les remplir aurait laissé son écran
   dans l'état qu'il a signalé pendant que tous les contrôles passaient au
   vert. */
const rattrapage = (schema.match(/do \$rattrapage\$[\s\S]*?end \$rattrapage\$;/) || [''])[0];

verifier('le rattrapage existe — les anciennes notifications aussi mènent quelque part',
  rattrapage.length > 0,
  'Sans lui, ce lot ne corrige que les notifications à VENIR. C\'est la '
  + 'leçon du lot A : un rattrapage absent ressemble trait pour trait à '
  + 'une fonctionnalité cassée.');

/* CE CONTRÔLE COMPTAIT D'ABORD LES GARDES, et il y en a trois (les deux
   branches, plus le décompte final) : en retirer une le laissait passer.
   Éprouvé en remettant le défaut à la main — il n'a rien vu. Il regarde
   maintenant les DEUX CHEMINS D'ÉCRITURE, chacun entre le début de sa
   branche et son premier `update`. */
const cheminGarde = (depuis, jusqua) => {
  const a = rattrapage.indexOf(depuis);
  const b = rattrapage.indexOf(jusqua);
  return a >= 0 && b > a
    && /if combien = 1 then/.test(rattrapage.slice(a, b));
};
verifier('…et il ne remplit QUE s\'il n\'y a qu\'un seul candidat',
  cheminGarde("if n.type = 'annonce' then",
    'update public.notifications set annonce_id')
  && cheminGarde('(array_agg(r.genre))',
    'update public.notifications set devis_id'),
  'Une notification qui ouvre LA MAUVAISE demande montrerait à quelqu\'un '
  + 'le dossier d\'un autre. On ne devine pas — règle de completerLieu().');

verifier('…et il prend `array_agg`, pas `min` — il n\'existe pas de `min(uuid)`',
  !/\bmin\(\s*(a\.id|r\.id|r\.genre)\s*\)/.test(rattrapage)
  && /\(array_agg\(/.test(rattrapage),
  'Un bloc `do` n\'est analysé qu\'à l\'EXÉCUTION : avec `min(uuid)` il se '
  + 'crée sans un mot, et comme il ne boucle sur rien sur une base neuve, '
  + '`schema.sql` passait deux fois au vert. L\'erreur vivait dans un '
  + 'chemin que rien n\'empruntait.');

verifier('…et il ne touche que ce qui est encore sans cible — donc rejouable',
  /and post_id\s+is null and annonce_id is null/.test(rattrapage)
  && /and devis_id\s+is null and rappel_id\s+is null and sos_id is null/.test(rattrapage),
  '`schema.sql` est rejoué deux fois, toujours. Un rattrapage qui '
  + 'réécrirait une cible déjà posée pourrait se tromper au second tour.');

verifier('l\'export RGPD reste la DERNIÈRE fonction du fichier',
  schema.lastIndexOf('create or replace function public.mes_donnees()')
    > schema.lastIndexOf('create or replace function public.notifie_demande()'),
  'PostgreSQL contrôle le corps d\'une fonction SQL à sa création : elle ne '
  + 'peut pas nommer une table née plus bas.');

/* ------------------------------------------------------------------ */
console.log('\nL\'APPLICATION TRANSMET CE QUE LA BASE DONNE');

verifier('`acteurNom` est transmis — la ligne qui valait douze ronds vides',
  /acteurNom: n\.acteur \? n\.acteur\.nom : null/.test(api),
  'La requête va chercher `acteur:acteur_id(nom, avatar_url)` depuis le '
  + 'début ; seule l\'adresse de la photo était reportée. Or `Avatar` '
  + 'affiche les INITIALES quand il n\'a pas d\'image.');

for (const champ of ['annonceId', 'devisId', 'rappelId', 'sosId']) {
  verifier(`\`${champ}\` arrive jusqu'à l'écran`,
    new RegExp(`${champ}: n\\.\\w+ \\|\\| null`).test(api));
}

verifier('une publication ABSENTE de la page se cherche en base',
  /export const publicationParId/.test(api)
  && /await api\.publicationParId\(ou\.postId\)/.test(app),
  '`posts.some(...)` ne regardait que les vingt publications du fil '
  + 'courant, filtrées par la loupe : un commentaire du 21/09 répondait '
  + '« plus disponible » alors qu\'il existait.');

verifier('…et le message ne sort QUE si elle a vraiment disparu',
  /if \(!presente\) \{\s*\n\s*showBanner\("Cette publication n'est plus disponible\."\)/.test(app),
  'Un message précis et faux est pire qu\'un message général et juste.');

verifier('`destinationNotif` est la SEULE porte du routage',
  /const ou = destinationNotif\(n\);/.test(app)
  && !/if \(!n\.postId\) return;/.test(app),
  'Deux façons de décider où mène une notification finiraient par se '
  + 'contredire — la leçon des voyants du 04/10.');

/* LE PANNEAU S'OUVRAIT VIDE. Trouve au navigateur, sur la vraie base :
   le bon post arrivait, le commentaire non. `setOpenCommentsId` ouvre le
   panneau ; c'est `ouvrirCommentaires` qui VA CHERCHER le fil, parce que
   le fil se charge par pages depuis le lot 4. Deux facons d'arriver au
   meme ecran doivent faire exactement le meme travail. */
/* LE CHEVRON ET LA VOIX. Trouve sur une capture : une seule des trois
   lignes portait le chevron, parce que l'ecran calculait `!!n.postId`
   dans son coin — un TROISIEME endroit qui reinvente la meme verite,
   apres la barre du bas et le routage. */
/* LA PHOTO D'ABORD, LES INITIALES SEULEMENT A DEFAUT. `Avatar` affiche
   l'image des que `uri` est fourni, et retombe sur les initiales sinon.
   Le lot G a corrige le NOM ; il ne faudrait pas qu'un jour quelqu'un
   retire `uri` en croyant que les initiales sont le comportement voulu.
   Mesure sur la vraie base le 06/10/2026, avec un compte portant une vraie
   photo : 1 <img> rendue depuis l'espace `avatars`, 0 initiale,
   alt="Photo de Melina Meinhard". */
const ecranNotifs = sansCommentaires(lire('src/screens/NotificationsScreen.js'));
verifier('la cloche passe la PHOTO de l\'acteur, pas seulement son nom',
  /<Avatar[^>]*uri=\{n\.avatarUrl\}[^>]*nom=\{n\.acteurNom\}/.test(ecranNotifs),
  'Les initiales ne sont pas le comportement voulu : c\'est le repli quand '
  + 'il n\'y a pas de photo. Sans `uri`, tout le monde redeviendrait un '
  + 'rond a initiales, et ca ressemblerait au defaut qu\'on vient de '
  + 'corriger.');

verifier('le chevron suit la DESTINATION, pas seulement `postId`',
  /destinationNotif\(n\)/.test(ecranNotifs)
  && !/menuQuelquePart = !!n\.postId/.test(ecranNotifs),
  'Une ligne sans chevron a l\'air d\'etre une information : on n\'appuie '
  + 'pas dessus. Depuis la section 37, une notification mene aussi a une '
  + 'annonce, a une demande ou a une fiche.');

verifier('…et la voix annonce OU l\'on va, pas toujours « la publication »',
  /OUVRIR\[ou\.quoi\]/.test(ecranNotifs)
  && /annonce: '\. Ouvrir l/.test(ecranNotifs),
  'VoiceOver disait « Ouvrir la publication » pour toutes : on s\'attendait '
  + 'a une publication et on tombait sur la Place des pros.');

/* UNE CLE D'ONGLET INVENTEE NE LEVE RIEN. C'est le defaut qui a coute le
   plus de temps dans ce lot : la cloche appelait
   `changerOngletDecouvrir('pros')` alors que la cle est `'artisans'`.
   `indexDecouvrir` fait `Math.max(0, findIndex(...))`, donc −1 devenait 0 :
   on atterrissait sur « Pour moi », aucune pastille n'etait active, et rien
   — ni le linter, ni l'export, ni les 37 controles — n'a dit un mot. Pire :
   la destination « demande » marchait, par pur HASARD, parce que
   « Pour moi » est justement la page de repli. */
const clesOnglets = [...app.matchAll(/\{ key: '([a-z]+)', label:/g)].map((m) => m[1]);
const clesDemandees = [...app.matchAll(/changerOngletDecouvrir\('([a-z]+)'\)/g)].map((m) => m[1]);
const inventees = clesDemandees.filter((k) => !clesOnglets.includes(k));
verifier('aucun onglet n\'est demande par une cle qui n\'existe pas',
  clesOnglets.length >= 3 && clesDemandees.length >= 2 && inventees.length === 0,
  `Cles inventees : ${inventees.join(', ') || '(aucune, mais la lecture a '
  + 'echoue — ' + clesOnglets.length + ' cles, ' + clesDemandees.length
  + ' demandes)'}. Elles retombent sur la PREMIERE page, en silence.`);

verifier('…et une cle absente de CE compte se DIT, au lieu de retomber sur 0',
  /if \(!ongletsDecouvrir\.some\(\(o\) => o\.key === k\)\)/.test(app),
  'Un PARTICULIER n\'a pas d\'onglet « Pour moi », et il recoit pourtant '
  + '« a accepte votre demande ». Le poser sur une page au hasard est pire '
  + 'que de lui dire que l\'ecran n\'existe pas encore.');

/* ARRIVER AU BON ENDROIT NE SUFFIT PAS : IL FAUT LE VOIR. Mesure au
   navigateur, fenetre de 844 : le commentaire vise tombait a y = 816,
   c'est-a-dire SOUS la barre d'onglets (69 px). Apres le defilement :
   y = 666, au-dessus d'elle, avec le post cale en haut. */
const fil = sansCommentaires(lire('src/screens/HomeScreen.js'));
verifier('le fil DEFILE jusqu\'a la publication visee',
  /scrollToIndex\(\{ index: i, viewPosition: 0/.test(fil),
  'Le panneau s\'ouvrait, et le commentaire tombait sous la barre du bas : '
  + 'du point de vue de celui qui regarde, « ca me ramene sur le fil ».');

verifier('…et un index pas encore mesure ne fait pas echouer le defilement',
  /onScrollToIndexFailed=/.test(fil),
  'Les cartes n\'ont pas toutes la meme hauteur depuis le 02/10 (le cadre '
  + 'suit la photo) : `scrollToIndex` leve une erreur sur un element pas '
  + 'encore rendu, et ne defile nulle part.');

const routage = app.slice(app.indexOf('const ouvrirNotification'));
/* LA PHOTO D'UN ARTISAN VIT SUR SA FICHE. Mesure sur la vraie base le
   07/10 : 2 artisans sur 7 ont une photo, et ZERO l'avait sur `users` —
   la table que la cloche lisait. Mon essai de la veille l'avait masque en
   ecrivant dans les DEUX tables a la main, ce que l'application ne fait
   jamais. Le calcul TOURNE, on ne le relit pas. */
verifier('la photo se cherche sur la FICHE PRO autant que sur le compte',
  photoActeur({ avatar_url: null, fiche: { avatar_url: 'f.jpg' } }) === 'f.jpg'
  && photoActeur({ avatar_url: 'u.jpg' }) === 'u.jpg'
  && photoActeur({ avatar_url: null, fiche: [{ avatar_url: 'f.jpg' }] }) === 'f.jpg'
  && photoActeur(null) === null,
  'Un artisan enregistre sa photo dans `professional_profiles` ; un '
  + 'particulier dans `users`. Lire une seule des deux laisse un rond vide '
  + 'a tous les artisans — c\'est-a-dire a presque tout le monde ici.');

verifier('…et la requete de la cloche va bien la chercher',
  /acteur:acteur_id\(nom, avatar_url, fiche:professional_profiles\(avatar_url\)\)/.test(api)
  && /avatarUrl: photoActeur\(n\.acteur\)/.test(api),
  'Sans la jointure, la fonction n\'a rien a lire : elle rendrait `null` '
  + 'sans erreur, et le controle ci-dessus passerait quand meme.');

verifier('…et les COMMENTAIRES avaient le meme defaut',
  /users:author_id\(nom, avatar_url, type, fiche:professional_profiles\(avatar_url\)\)/.test(api)
  && /avatarUrl: photoActeur\(c\.users\)/.test(api),
  'Le commentaire d\'un artisan portait un rond vide pour exactement la '
  + 'meme raison. Corriger la cloche seule aurait laisse le defaut visible '
  + 'a cote.');

/* LE DEFILEMENT. Mesure sur la vraie base : les cinq commentaires visent
   des publications aux rangs 3, 3, 3, 6 et 6, alors que la liste n'en
   monte que DEUX au depart. `scrollToIndex` echouait donc, et la
   re-tentative refaisait l'appel qui venait d'echouer. */
verifier('le fil defile sur une CIBLE explicite, pas sur le commentaire',
  /setPostCible\(ou\.postId\)/.test(routage)
  && /if \(!postCible\)/.test(fil),
  'Lier le defilement a `commentaireCible` le rendait muet pour toute '
  + 'notification qui mene a une publication sans viser de commentaire.');

verifier('…et il ne saute pas sous le doigt d\'un appui ordinaire',
  !/postCible/.test(fil.slice(fil.indexOf('const toggleComments')) || '')
  && /const \[postCible, setPostCible\] = useState\(null\)/.test(app),
  'Le bouton « commentaires » d\'une carte pose aussi `openCommentsId` : '
  + 'faire sauter le fil de quelqu\'un deja devant la bonne publication '
  + 'serait desagreable.');

verifier('…et un index pas encore monte passe par une position APPROCHEE',
  /scrollToOffset\(\{\s*offset: Math\.max\(0, moyenne \* info\.index\)/.test(fil),
  'Refaire `scrollToIndex` apres son echec, c\'est refaire l\'appel qui '
  + 'vient d\'echouer : il echoue pareil. Il faut d\'abord sauter pres de '
  + 'la cible pour que la liste monte ce qu\'il y a autour.');


verifier('la cloche CHARGE les commentaires, elle n\'ouvre pas un panneau vide',
  /ouvrirCommentaires\(ou\.postId\)/.test(routage)
  && !/setOpenCommentsId\(ou\.postId\)/.test(routage),
  'Poser `openCommentsId` a la main affiche un panneau sans contenu : '
  + '`post.comments` n\'existe pas tant que personne ne l\'a demande. '
  + 'C\'est le defaut signale — « ca me ramene sur le fil » — corrige a '
  + 'moitie, et aucune relecture de code ne l\'aurait vu.');

verifier('…et `ouvrirCommentaires` est la seule porte, partagee avec la carte',
  /const ouvrirCommentaires = async \(id\)/.test(app)
  && /await ouvrirCommentaires\(id\);/.test(app),
  '`toggleComments` BASCULE : l\'appeler depuis la cloche refermerait le '
  + 'panneau quand il est deja ouvert sur ce post.');

verifier('le commentaire visé descend jusqu\'aux commentaires',
  /commentaireCible=\{openCommentsId === p\.id \? commentaireCible : null\}/
    .test(sansCommentaires(lire('src/screens/HomeScreen.js')))
  && /cibleId=\{commentaireCible\}/.test(sansCommentaires(lire('src/components/PostCard.js'))),
  '`PostCard` est mémorisée : lui passer la cible pour les vingt cartes les '
  + 'ferait toutes redessiner. C\'est le piège du lot 4.');

verifier('…et il se marque au BORD, pas au fond',
  /ligneVisee: \{\s*\n?\s*paddingLeft: S\.md, borderLeftWidth: 3, borderLeftColor: C\.accent,/
    .test(lire('src/components/Commentaires.js')),
  'Un fond teinté derrière le texte le rendrait moins lisible, et c\'est '
  + 'justement ce texte qu\'on vient lire. Règle du 04/10.');

verifier('la cible se REND dès qu\'elle est consommée',
  /onCibleConsommee=\{\(\) => setAnnonceCible\(null\)\}/.test(app)
  && /onCibleConsommee=\{\(\) => setDemandeCible\(null\)\}/.test(app),
  'Une cible qui traîne rouvrirait la même chose à chaque passage, et on '
  + 'croirait l\'écran bloqué.');

verifier('…et elle est DÉRIVÉE, jamais recopiée dans un état',
  !/useEffect\(\(\) => \{[\s\S]{0,200}setALire\(/.test(lire('src/screens/PlaceProScreen.js'))
  && /const lecture = aLire/.test(lire('src/screens/PlaceProScreen.js')),
  'Recopier une prop dans un état, c\'est deux vérités pour une seule '
  + 'chose. Le linter du projet le refuse (react-hooks/set-state-in-effect).');

/* ------------------------------------------------------------------ */
console.log('\nLE MODE DÉMONSTRATION DOIT FAIRE VIVRE LE MÉCANISME');

verifier('les notifications d\'exemple portent un NOM d\'acteur',
  initialNotifications.filter((n) => n.acteurId).every((n) => !!n.acteurNom),
  'Sans nom, l\'avatar est un rond vide — et c\'est précisément le défaut '
  + 'qu\'on corrige. En démonstration il n\'y a pas de jointure pour '
  + 'l\'apporter : il s\'écrit à la main.');

const parQuoi = {};
initialNotifications.forEach((n) => {
  const q = destinationNotif(n).quoi;
  parQuoi[q] = (parQuoi[q] || 0) + 1;
});
verifier('…et elles couvrent les QUATRE destinations',
  ['post', 'annonce', 'demande', 'profil'].every((q) => parQuoi[q] > 0),
  `Couvertes : ${JSON.stringify(parQuoi)}. Une destination qu'aucun exemple `
  + 'n\'emprunte ne se vérifie nulle part sans fichier `.env`.');

verifier('…dont une demande ACCEPTÉE, qui n\'ouvre pas la même pastille',
  initialNotifications.some((n) => n.rappelId || n.devisId)
  && initialNotifications.some((n) => /_accepte$/.test(n.type)),
  'C\'est le cas qui prouve que la pastille suit la DEMANDE et non le '
  + 'type : « a accepté » vit dans « En cours ».');

/* ------------------------------------------------------------------ */
if (echecs) {
  console.log(`\n✘ ${echecs} vérification(s) en échec.`);
  process.exit(1);
}
console.log('\n✔ Une notification est une adresse : chaque type sait où il mène.');
