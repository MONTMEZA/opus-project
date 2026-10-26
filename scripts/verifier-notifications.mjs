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

/* LES TYPES SE RELÈVENT DANS LA BASE, PAS DANS LA LISTE (25/10/2026).
   Le contrôle faisait confiance à `TYPES_CONNUS` : `verification_attente`
   (écrit par `admin_verifier_pro`) et `metiers_refuses` (par
   `admin_traiter_metiers`) n'y étaient pas, et rien ne rougissait — un
   appui sur ces notifications ne menait nulle part depuis des semaines.
   On relève donc chaque chaîne littérale d'un `insert into
   public.notifications` dans `schema.sql`, et on exige qu'elle soit
   connue. Les morceaux composés (`genre || '_accepte'`) sont nommés à part,
   puisqu'aucun texte ne les écrit en entier. */
const NON_TYPES = new Set(['acceptee', 'verifie', 'refusee', 'en_attente']);
const COMPOSES = { _accepte: ['devis_accepte', 'rappel_accepte', 'sos_accepte'] };
const typesDeLaBase = new Set();
/* SECOND RELEVÉ (relecture « écran », E7) : un type ASSIGNÉ à une variable
   hors de l'insert (`le_type := 'nouveau'`, puis `values (x, le_type, …)`)
   échappait au premier — c'était déjà le cas de `sos`, que seul
   `genre := 'sos'` écrit. On isole l'expression placée dans la colonne
   `type` de chaque insert ; si c'est un nom (ou `nom || '_suffixe'`), on
   relève toutes ses affectations littérales dans schema.sql. Et trois
   lettres suffisent : `sos` en a trois. */
const auPremierNiveau = (texte, sep) => {
  const parts = []; let n = 0; let chaine = false; let dernier = 0;
  for (let i = 0; i < texte.length; i += 1) {
    const c = texte[i];
    if (c === "'") chaine = !chaine;
    if (chaine) continue;
    if (c === '(') n += 1; else if (c === ')') n -= 1;
    else if (n === 0 && texte.startsWith(sep, i)) { parts.push(texte.slice(dernier, i)); dernier = i + sep.length; }
  }
  parts.push(texte.slice(dernier));
  return parts.map((x) => x.trim());
};
const affectations = (nom) => [...schema.matchAll(new RegExp(`\\b${nom}\\s*:=\\s*'([a-z_]{3,40})'`, 'g'))].map((x) => x[1]);
let expressionsLues = 0;
for (const m of schema.matchAll(/insert into public\.notifications\b([\s\S]{0,1200}?);/g)) {
  for (const [, t] of m[1].matchAll(/'([a-z_]{3,40})'/g)) {
    if (NON_TYPES.has(t)) continue;
    for (const u of (COMPOSES[t] || [t])) typesDeLaBase.add(u);
  }
  const cols = m[1].match(/^\s*\(([^)]*)\)\s*(values\s*\(|select\s)/i);
  if (!cols) continue;
  const iType = cols[1].split(',').map((c) => c.trim()).indexOf('type');
  if (iType < 0) continue;
  const reste = m[1].slice(cols.index + cols[0].length);
  const liste = /^values/i.test(cols[2])
    ? auPremierNiveau(reste.slice(0, (() => { let n = 1; let ch = false; for (let i = 0; i < reste.length; i += 1) { const c = reste[i]; if (c === "'") ch = !ch; if (ch) continue; if (c === '(') n += 1; if (c === ')') { n -= 1; if (n === 0) return i; } } return reste.length; })()), ',')
    : auPremierNiveau(reste.split(/\sfrom\s/i)[0], ',');
  const expr = liste[iType] || '';
  expressionsLues += 1;
  const nom = expr.match(/^([a-z_][a-z0-9_]*)(?:\s*\|\|\s*'([a-z_]+)')?$/i);
  if (nom && !/^(null|new|old)$/i.test(nom[1])) {
    for (const v of affectations(nom[1])) {
      const t = nom[2] ? v + nom[2] : v;
      if (!NON_TYPES.has(t)) typesDeLaBase.add(t);
    }
  }
}
verifier('le relevé lit l\'expression de la colonne `type` dans les inserts de notifications',
  expressionsLues >= 10, `${expressionsLues} expression(s) lue(s) : le relevé ne lit rien`);
const inconnus = [...typesDeLaBase].filter((t) => !TYPES_CONNUS.includes(t));
verifier('chaque type que la BASE écrit est connu de l\'application',
  typesDeLaBase.size >= 15 && inconnus.length === 0,
  `Types écrits par schema.sql et inconnus de TYPES_CONNUS : ${inconnus.join(', ') || '(relevé vide)'}. `
  + 'Une notification de ce type ne mène nulle part.');
verifier('…dont la suspension du badge (lot S-a)',
  typesDeLaBase.has('verification_suspendue')
  && destinationNotif({ type: 'verification_suspendue' }).quoi === 'profil',
  'La suspension se lit sur la fiche, comme une vérification acceptée ou refusée.');

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

const routage = app.slice(app.indexOf('const ouvrirNotification'));

/* UNE PUBLICATION VISEE S'OUVRE SUR SA PROPRE PAGE.
   Deux tentatives de DEFILEMENT ont echoue sur l'iPhone du proprietaire :
   `scrollToIndex` ne sait pas sauter a une carte qui n'est pas montee, et
   ce fil n'en monte que deux (lot 4). Mesure sur la vraie base : les
   commentaires visent des publications aux rangs 3 a 6. Et ca ne se
   verifie pas au navigateur — 4 cartes sur 4 y sont montees alors que le
   reglage en demande 2. On a donc SUPPRIME le probleme : plus de fil a
   parcourir, plus de rang, plus de virtualisation. */
const ecranPub = sansCommentaires(lire('src/screens/PublicationScreen.js'));
const fil = sansCommentaires(lire('src/screens/HomeScreen.js'));

/* ON BORNE A LA BRANCHE, pas « tout ce qui suit la fonction » : `routage`
   contient aussi le retour generique et deux autres `setScreen('home')`
   parfaitement legitimes. Un controle qui vise une PLACE vise mal — c'est
   la lecon repetee de ce projet. */
const brancheDuPost = routage.slice(
  routage.indexOf("if (ou.quoi === 'post')"),
  routage.indexOf("if (ou.quoi === 'annonce')"),
);
verifier('la cloche ouvre la PUBLICATION sur sa page, pas le fil',
  /setScreen\('publication'\)/.test(brancheDuPost)
  && !/setScreen\('home'\)/.test(brancheDuPost)
  && brancheDuPost.length > 200,
  'Ramener sur le fil obligeait a chercher la publication a la main en '
  + 'descendant — ce que le proprietaire a signale trois fois de suite.');

verifier('…et le fil n\'essaie plus de defiler jusqu\'a elle',
  !/scrollToIndex\(/.test(fil) && !/onScrollToIndexFailed/.test(fil),
  'Du code qui a l\'air de servir et qui n\'a plus d\'appelant est le '
  + '« bouton §18 ». On le retire au lieu de le garder « au cas ou ».');

verifier('la page ouvre le panneau des commentaires d\'office',
  /commentsOpen/.test(ecranPub),
  'On y arrive par une notification de commentaire : c\'est precisement '
  + 'ce qu\'on vient lire.');

verifier('…et elle cherche dans `posts`, jamais dans le fil FILTRE',
  /post=\{posts\.find\(\(p\) => String\(p\.id\) === String\(postCible\)\)/.test(app),
  'La loupe ne doit pas pouvoir cacher la publication qu\'une '
  + 'notification designe : on vient la lire, pas la filtrer.');

verifier('…et le retour ramene a la CLOCHE, d\'ou l\'on vient',
  /screen === 'publication'\) \{ setPostCible\(null\); setScreen\('notifications'\)/.test(app),
  'Repartir sur le fil ferait perdre la liste des notifications qu\'on '
  + 'etait en train de parcourir.');

verifier('…et une publication disparue se DIT',
  /Publication introuvable/.test(ecranPub),
  'Un ecran vide ressemblerait a un chargement qui ne finit pas.');

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
console.log('\nLA DEMANDE DE COMPTE PRO (section 45) — une colonne, trois destinataires');

/* La même colonne `demande_pro_id`, et trois personnes qui ne vont pas au
   même endroit : l'administrateur à sa file, le demandeur refusé à son
   profil, le demandeur accepté dans son espace d'artisan. Une seule erreur
   d'aiguillage et l'appui « ne fait rien » — ou pire, ouvre l'écran
   d'administration à quelqu'un qui n'a rien à y faire. */
verifier('`notifications.demande_pro_id` existe, avec sa clé étrangère et son nettoyage',
  /add column if not exists demande_pro_id uuid references public\.demandes_pro\(id\) on delete cascade/.test(schema),
  'Sans clé étrangère, une demande supprimée laisserait une notification '
  + 'qui pointe dans le vide.');

for (const t of ['demande_pro_nouvelle', 'compte_pro_ouvert', 'demande_pro_refusee', 'entreprise_retiree']) {
  verifier(`la base écrit vraiment \`${t}\` dans les notifications`,
    new RegExp(`insert into public\\.notifications[^;]{0,400}'${t}'`).test(schema),
    'Un type que l\'écran connaît et que la base n\'écrit jamais est un '
    + 'aiguillage qui ne sert à personne — et l\'inverse, une notification '
    + 'qui ne mène nulle part.');
}

verifier('`demandeProId` arrive jusqu\'à l\'écran',
  /demandeProId: n\.demande_pro_id \|\| null/.test(api));

/* QUI REÇOIT CHAQUE TYPE — 15/10/2026, relecture adverse. Le contrôle
   exigeait seulement que le TYPE apparaisse dans un `insert into
   public.notifications`. Un sabotage changeait la source des destinataires
   (`from public.administrateurs a` → `from public.users a`) : chaque compte
   aurait reçu « un compte attend d'être ouvert (SIRET …) » — et pour un
   entrepreneur individuel, ce SIRET désigne une personne. Trois contrôles
   passaient au vert. On lit donc, pour chaque ordre qui écrit l'un de ces
   types, la PREMIÈRE valeur — celle qui va dans `user_id` — et, pour une
   insertion par `select`, sa source. */
{
  const schemaNu = schema.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
  const ordres = [...schemaNu.matchAll(/insert into public\.notifications\s*\(([^)]*)\)\s*([\s\S]*?);/g)]
    .map((m) => ({ colonnes: m[1].split(',').map((x) => x.trim()), reste: m[2] }));
  const DESTINATAIRES = {
    demande_pro_nouvelle: ['select a.user_id from public.administrateurs a'],
    compte_pro_ouvert: ['d.compte_id'],
    demande_pro_refusee: ['d.compte_id'],
    entreprise_retiree: ['le_detenteur.pro_id', 'p_pro'],
  };
  for (const [type, attendus] of Object.entries(DESTINATAIRES)) {
    const vus = ordres.filter((o) => o.reste.includes(`'${type}'`)).map((o) => {
      if (o.colonnes[0] !== 'user_id') return `(première colonne : ${o.colonnes[0]})`;
      const sel = /^select\s+([^,]+),[\s\S]*?\bfrom\s+([a-z_.]+\s+[a-z_]+)\s*$/i.exec(o.reste.trim());
      if (sel) return `select ${sel[1].trim()} from ${sel[2].trim()}`;
      const val = /^values\s*\(\s*([^,]+),/i.exec(o.reste.trim());
      return val ? val[1].trim() : `(illisible : ${o.reste.slice(0, 40)})`;
    });
    verifier(`\`${type}\` ne va qu'à ${attendus.join(' ou ')}`,
      vus.length === attendus.length && vus.every((v) => attendus.includes(v))
      && attendus.every((a) => vus.includes(a)),
      `lu : ${vus.join(' | ') || '(aucun ordre)'}`);
  }
}

/* LE TEMPS RÉEL TRADUIT COMME LE CHARGEMENT — 15/10/2026, relecture
   adverse, mesuré : `onNotification` recopiait la ligne à la main et
   oubliait les cibles. « Votre compte professionnel est ouvert : touchez
   ici » arrivé en direct répondait « plus rien à montrer ». Une seule
   traduction, et elle porte TOUTES les clés que `CIBLE_ATTENDUE` nomme. */
{
  const iT = api.indexOf('export function notificationDepuisLigne(');
  const traduction = iT >= 0 ? api.slice(iT, api.indexOf('\n}\n', iT)) : '';
  const cles = [...new Set(Object.values(CIBLE_ATTENDUE).filter(Boolean))];
  const manquantes = cles.filter((c) => !new RegExp(`\\b${c}:`).test(traduction));
  verifier('UNE traduction des lignes de notification, qui porte chaque cible',
    !!traduction && manquantes.length === 0,
    manquantes.length ? `manquent : ${manquantes.join(', ')}` : 'notificationDepuisLigne introuvable');
  const iRT = app.indexOf('onNotification: (n) =>');
  const tempsReel = iRT >= 0 ? app.slice(iRT, app.indexOf('});', iRT)) : '';
  verifier('…utilisée par le chargement ET par le temps réel, jamais une copie à la main',
    /notifications: \(notifRes\.data \|\| \[\]\)\.map\(notificationDepuisLigne\)/.test(api)
    && /\.\.\.api\.notificationDepuisLigne\(n\)/.test(tempsReel)
    && !/postId:\s*n\.post_id/.test(tempsReel),
    'deux traductions pour une seule ligne finissent toujours par se contredire');
}

const aiguillage = {
  demande_pro_nouvelle: 'administration',
  compte_pro_ouvert: 'compte_pro',
  demande_pro_refusee: 'profil',
};
const malAiguilles = Object.entries(aiguillage)
  .filter(([t, q]) => destinationNotif({ type: t, demandeProId: 'd1' }).quoi !== q)
  .map(([t, q]) => `${t} → ${destinationNotif({ type: t, demandeProId: 'd1' }).quoi} (attendu ${q})`);
verifier('chaque destinataire va à SON endroit — le calcul TOURNE',
  malAiguilles.length === 0,
  malAiguilles.join(' ; '));

verifier('une entreprise retirée mène à la fiche, sans cible',
  destinationNotif({ type: 'entreprise_retiree' }).quoi === 'profil',
  'L\'acte vient de l\'administration ; la notification ne porte ni acteur '
  + 'ni cible, et la seule destination honnête est le profil du titulaire.');

/* Toutes les destinations que le calcul peut rendre, et chacune doit
   avoir SA branche dans le routage et SA phrase pour VoiceOver. Une
   destination sans branche tombe dans « n'a plus rien à montrer » : un
   appui qui ne fait rien, exactement ce que ce contrôle traque. */
const destinations = new Set(TYPES_CONNUS.map((t) => {
  const cle = CIBLE_ATTENDUE[t];
  const n = { type: t };
  if (cle) n[cle] = 'cible-de-contrôle';
  return destinationNotif(n).quoi;
}).filter((q) => q !== 'rien'));
const sansBranche = [...destinations].filter((q) => !routage.includes(`ou.quoi === '${q}'`));
verifier('chaque destination a SA branche dans le routage',
  destinations.size >= 6 && sansBranche.length === 0,
  `Sans branche : ${sansBranche.join(', ') || '(aucune — mais seulement '
  + destinations.size + ' destinations lues)'}.`);

const ouvrir = (ecranNotifs.match(/const OUVRIR = \{([\s\S]*?)\};/) || ['', ''])[1];
const sansVoix = [...destinations].filter((q) => !new RegExp(`\\b${q}:`).test(ouvrir));
verifier('…et SA phrase pour VoiceOver',
  !!ouvrir && sansVoix.length === 0,
  `Sans phrase : ${sansVoix.join(', ')}. Un libellé qui ne dit pas où l'on va `
  + 'laisse croire à « Ouvrir la publication ».');

const brancheAdmin = routage.slice(routage.indexOf("ou.quoi === 'administration'"),
  routage.indexOf("ou.quoi === 'compte_pro'"));
verifier('la file d\'administration s\'ouvre sur l\'écran d\'administration',
  /setScreen\('admin'\)/.test(brancheAdmin) && /chargerResumeAdmin\(\)/.test(brancheAdmin),
  'Sans le résumé chargé, l\'écran d\'administration s\'ouvrirait sur ses '
  + 'squelettes et attendrait pour toujours.');

const branchePro = routage.slice(routage.indexOf("ou.quoi === 'compte_pro'"),
  routage.indexOf("ou.quoi === 'profil'"));
const iAligne = branchePro.indexOf("api.alignerTypeDuCompte('pro')");
const iStart = branchePro.indexOf("start('pro')");
verifier('un compte ouvert en pro : la session est RÉALIGNÉE, puis l\'application redémarre en pro',
  iAligne > 0 && iStart > iAligne,
  'La base a changé `users.type` ; les métadonnées de la session disent '
  + 'encore « particulier », et c\'est elles que `sessionLocale()` lit au '
  + 'prochain lancement. Redémarrer sans réaligner rebasculerait le compte '
  + 'en particulier au démarrage suivant.');

const brancheProfil = routage.slice(routage.indexOf("ou.quoi === 'profil'"));
verifier('…et un refus ou un retrait RELIT ce que la base vient de décider',
  /n\.type === 'demande_pro_refusee'\) chargerMaDemandePro\(\)/.test(brancheProfil)
  && /n\.type === 'entreprise_retiree'\) chargerMonEntreprise\(\)/.test(brancheProfil),
  'La carte du profil doit dire ce que la base vient de décider, pas ce '
  + 'qu\'on savait ce matin.');

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
