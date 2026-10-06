/**
 * « C'EST UN CONSEIL » — une étiquette, et quelqu'un qui la LIT.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Le lot C remplace un FORMAT par une ÉTIQUETTE. Le format avait une
 * propriété que l'étiquette n'a pas : il se voyait. Zéro publication de type
 * `conseil` sur seize dans la vraie base, mais au moins le bouton était là,
 * à l'écran, visible.
 *
 * Une colonne booléenne, elle, peut parfaitement être cochée, enregistrée,
 * et n'apparaître NULLE PART. Ce serait la panne silencieuse favorite de ce
 * projet, vue deux fois en quatre jours :
 *
 *   - 01/10 : trois tables écrites, jamais relues (« X est prévenu ») ;
 *   - 04/10 : `annonces_pro.medias` lue, jamais écrite.
 *
 * > Chercher qui LIT ce qu'on écrit ne suffit pas : il faut aussi chercher
 * > qui ÉCRIT ce qu'on lit. Ce contrôle tient les DEUX bouts de la chaîne,
 * > de la case à cocher jusqu'au bloc « Ses conseils ».
 *
 * CE QU'IL NE PEUT PAS FAIRE
 * --------------------------
 * Il lit du code, il ne lance pas l'application. Les deux défauts que le
 * lot a trouvés — un carré de dégradé vide pour le format « Texte », et une
 * barre d'actions en blanc sur blanc — ne se voient qu'à l'écran. Il
 * verrouille ce qui a été corrigé ; il ne l'aurait pas trouvé.
 *
 *   npm run verifier-conseil
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');

/* LES COMMENTAIRES PARTENT D'ABORD. Cinq fois dans ce projet un contrôle a
   accusé la DOCUMENTATION qui expliquait le défaut qu'il traque — et ce
   lot-ci en parle beaucoup. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const { FORMATS_SANS_VISUEL, porteUnVisuel } =
  await import('../src/lib/formats-publication.js');

const schema = lire('supabase/schema.sql').replace(/^\s*--.*$/gm, '');
const api = sansCommentaires(lire('src/lib/api.js'));
const creer = sansCommentaires(lire('src/screens/CreerScreen.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const carte = sansCommentaires(lire('src/components/PostCard.js'));
const bloc = sansCommentaires(lire('src/components/ConseilsPro.js'));
const fichePro = sansCommentaires(lire('src/screens/ProfilProScreen.js'));
const ficheMoi = sansCommentaires(lire('src/screens/ProfilOwnScreen.js'));
const mesPubs = sansCommentaires(lire('src/screens/MesPublicationsScreen.js'));
const demo = sansCommentaires(lire('src/data/demo.js'));

/* ------------------------------------------------------------------ */
console.log('\nLa base — une colonne, et un index qui sert à quelqu\'un');

verifier('`posts.conseil` existe, et ne peut pas être nulle',
  /add column if not exists conseil boolean not null default false/.test(schema),
  'Sans `not null`, trois états pour une question qui n\'en a que deux.');

verifier('…avec son index partiel, pour la requête de la fiche',
  /create index if not exists idx_posts_conseils[\s\S]{0,160}?where conseil/.test(schema));

verifier('`conseil` ne touche PAS à la signature de `fil_filtre`',
  !/create or replace function public\.fil_filtre\([\s\S]*?p_conseil/.test(schema),
  'Ajouter un paramètre ne remplace pas la fonction : ça la SURCHARGE, et '
  + 'l\'appel sans argument devient « is not unique ». Éprouvé sur '
  + 'PostgreSQL 16 le 05/10/2026. Le connecteur refuse `drop function`.');

/* ------------------------------------------------------------------ */
console.log('\nQui ÉCRIT l\'étiquette');

verifier('le FORMAT « conseil » a quitté l\'écran de publication',
  !/\['conseil',/.test(creer),
  'Il obligeait à renoncer à la photo pour donner un conseil. Personne ne '
  + 'faisait ce marché : zéro ligne sur seize.');

verifier('…mais le format « Texte » est resté',
  /\['texte', TypeIcon, 'Texte'\]/.test(creer),
  'Demandé par le propriétaire : « on garde le texte sans image ».');

verifier('la case « C\'est un conseil » est dans l\'écran de publication',
  /setCreateConseil\(!createConseil\)/.test(creer)
  && /accessibilityRole="checkbox"/.test(creer));

verifier('…et elle DISPARAÎT quand la publication ne va qu\'au portfolio',
  /\{dansLeFil && \([\s\S]{0,400}?setCreateConseil/.test(creer),
  'Le portfolio ne crée AUCUNE ligne dans `posts` : la case se cocherait et '
  + 'ne toucherait rien. C\'est le « bouton §18 ».');

verifier('`createPost` envoie la colonne',
  /conseil: !!conseil,/.test(api) && /conseil = false,/.test(api));

/* ON VISE L'APPEL, PAS LA LIGNE QUI LE SUIT. Le premier jet exigeait
   `conseil: createConseil,` immédiatement suivi de `});` — donc il a
   refusé le lot du chantier, qui a simplement ajouté un argument après.
   Un contrôle qui vise une POSITION casse au lot suivant ; on vise ce que
   l'appel contient. */
{
  const i = app.indexOf('api.createPost({');
  const appel = i === -1 ? '' : app.slice(i, app.indexOf('});', i));
  verifier('…et `OpusApp` la lui passe',
    /conseil: createConseil,/.test(appel),
    'elle doit partir dans l\'appel à `createPost`, pas ailleurs.');
}

verifier('la case se remet à faux après chaque publication',
  /setCreateConseil\(false\);/.test(app),
  'Restée cochée, elle étiquetterait la photo de chantier suivante.');

/* ------------------------------------------------------------------ */
console.log('\nQui LIT l\'étiquette — l\'autre bout de la chaîne');

verifier('`rowToPost` la fait voyager',
  /conseil: !!p\.conseil,/.test(api));

verifier('la fiche va CHERCHER les conseils en base',
  /\.eq\('conseil', true\)/.test(api),
  'Sans cette requête, la colonne est cochée et ne s\'affiche nulle part.');

verifier('…bornée, comme tout le reste depuis le 04/10',
  /\.eq\('conseil', true\)[\s\S]{0,200}?\.limit\(TAILLE_CONSEILS\)/.test(api));

verifier('…et rendue sous le nom `conseils`',
  /conseils: complet\.conseils,/.test(api));

verifier('le bloc « Ses conseils » est sur la fiche d\'un artisan',
  /<SectionLabel>Ses conseils<\/SectionLabel>/.test(fichePro)
  && /<ConseilsPro items=\{pro\.conseils\}/.test(fichePro));

verifier('…et « Mes conseils » sur la mienne',
  /<SectionLabel>Mes conseils<\/SectionLabel>/.test(ficheMoi)
  && /<ConseilsPro items=\{me\.conseils\}/.test(ficheMoi));

verifier('le fil la montre, et en marine — pas en orange',
  /estConseil && \(/.test(carte) && /backgroundColor: C\.accent2/.test(carte),
  'Dans cette application l\'orange veut dire « du neuf » ou « appuie ici ». '
  + 'Un conseil est une information.');

verifier('« Mes publications » la montre aussi',
  /!!p\.conseil &&/.test(mesPubs),
  'C\'est l\'écran où l\'artisan relit ce qu\'il a publié : sans repère, la '
  + 'case cochée n\'a laissé aucune trace visible.');

/* ------------------------------------------------------------------ */
console.log('\nLe SON — ce qu\'un fil muet doit dire');

verifier('le fil classique reste muet',
  /\n\s*muet\n/.test(carte),
  'Une liste qui parle toute seule en défilant se coupe au bout de dix '
  + 'secondes.');

verifier('…donc un conseil en vidéo DIT qu\'il y a une voix',
  /Conseil — touchez pour écouter/.test(carte));

verifier('…et ce repère n\'est pas posé sur la barre d\'actions',
  /indicePleinEcran: \{[^}]*top: S\.sm/.test(carte)
  && !/indicePleinEcran: \{[^}]*bottom:/.test(carte),
  'Il était à `bottom: 10`, sur la rangée de la barre : le bouton '
  + '« Contacter », calé à droite, lui passait dessus et on lisait « Voi… ». '
  + 'Vu sur une capture le 05/10/2026, invisible autrement.');

verifier('et le plein écran, lui, a le son',
  /muet=\{false\}/.test(sansCommentaires(lire('src/components/Visionneuse.js'))));

/* ------------------------------------------------------------------ */
console.log('\nLe bloc « Ses conseils » — et ce qu\'il ne promet pas');

verifier('le texte d\'un conseil n\'est JAMAIS tronqué',
  !/numberOfLines/.test(bloc),
  'Un conseil coupé ne conseille rien. C\'est la différence avec la grille '
  + 'du portfolio, qui ne montre que des images.');

verifier('une rangée sans visuel ne s\'appuie pas',
  /const Rangee = aUnVisuel \? Pressable : View;/.test(bloc),
  'Une cible qui ne répond pas est pire que pas de cible : on appuie, rien '
  + 'ne se passe, et on croit l\'application cassée.');

verifier('la visionneuse ne reçoit QUE les conseils qui ont un visuel',
  /items=\{visuels\.map\(\(c\) => c\.media\)\}/.test(bloc),
  'Avec la liste entière, le premier conseil en texte décale tous les '
  + 'index et on ouvre la photo du voisin.');

verifier('la vignette est une IMAGE, pas un lecteur vidéo',
  /apercuDe\(c\.media\)/.test(bloc),
  'Mesuré au lot du portfolio : 45 Ko contre 780 Ko par vignette.');

verifier('`ConseilsPro` n\'affiche rien quand il n\'y a rien',
  /if \(items\.length === 0\) return null;/.test(bloc));

/* ------------------------------------------------------------------ */
console.log('\nLa publication SANS VISUEL — le format « Texte », enfin regardé');

verifier('la carte sait qu\'il n\'y a pas de visuel',
  /const sansVisuel = !estVideo && \(!porteUnVisuel\(post\.format\) \|\| photos\.length === 0\);/.test(carte));

verifier('…et ne monte alors AUCUN cadre d\'image',
  /\) : sansVisuel \? null : \(/.test(carte),
  'Sinon la carte affiche un carré de dégradé vide, avec la barre d\'actions '
  + 'posée dessus. Personne ne l\'avait jamais vu : zéro publication de ce '
  + 'format sur seize.');

verifier('la barre redescend sous le texte',
  /style=\{sansVisuel \? s\.barreSousTexte : s\.barreSurPhoto\}/.test(carte));

verifier('…et le voile ne se pose que s\'il y a une photo dessous',
  /\{!sansVisuel && \(\s*<LinearGradient/.test(carte));

/* LES QUATRE ICÔNES DE LA BARRE, nommées une par une, et pas un
   « aucun C.surface nulle part » : l'ampoule du bandeau « Conseil de pro »
   est posée sur du marine, elle DOIT être blanche. Un contrôle trop large
   aurait refusé le lot pour la seule chose qui était juste. */
['Heart', 'MessageSquare', 'Share2', 'Bookmark'].forEach((icone) => {
  const pose = new RegExp(`<${icone} [^>]*color=\\{[^}]*\\}`, 'g');
  const poses = carte.match(pose) || [];
  verifier(`l'encre de ${icone} suit le fond`,
    poses.length > 0 && poses.every((p) => p.includes('encre')),
    'Du blanc sur le fond clair de la carte ne lève aucune erreur et ne se '
    + 'voit qu\'à l\'écran.');
});

verifier('…et l\'encre est calculée une seule fois',
  /const encre = sansVisuel \? C\.ink : C\.surface;/.test(carte),
  'Deux formules pour une seule vérité finissent toujours par se '
  + 'contredire — la leçon des voyants du 04/10.');

/* ------------------------------------------------------------------ */
console.log('\nCE QUI MONTRE QUELQUE CHOSE — le FORMAT décide, pas `media`');

/* Ce bloc FAIT TOURNER le calcul, il ne lit pas le code : `formats-publication.js`
   n'importe rien, donc `node` sait l'ouvrir. */
verifier('`porteUnVisuel` : une photo et une vidéo en portent un',
  porteUnVisuel('photo') && porteUnVisuel('video') && porteUnVisuel('montage')
  && porteUnVisuel('avantapres'));

verifier('…un texte, non',
  !porteUnVisuel('texte'));

verifier('…l\'ancien format `conseil` non plus',
  !porteUnVisuel('conseil') && FORMATS_SANS_VISUEL.has('conseil'),
  'Il n\'avait pas d\'image lui non plus, et des lignes anciennes le portent.');

verifier('…et un format inconnu est supposé en porter un',
  porteUnVisuel('quelque-chose-de-neuf') && porteUnVisuel(undefined),
  'Afficher le cadre d\'une image qui manque est un défaut visible ; cacher '
  + 'une image qui existe est un défaut qu\'on ne remarque jamais.');

verifier('la bibliothèque des formats n\'importe RIEN',
  !/^import /m.test(lire('src/lib/formats-publication.js')),
  'Septième application de la leçon de `cloudinary-adresses.js` : un calcul '
  + 'rangé dans un écran ne peut pas être FAIT TOURNER par un contrôle.');

verifier('une publication SANS visuel ne reçoit pas de fausse couverture',
  (app.match(/envoyes\[0\] \|\| \(aUnVisuel \? POST_GRADIENTS\[0\] : null\)/g) || []).length === 2
  && !/envoyes\[0\] \|\| POST_GRADIENTS\[0\]/.test(app),
  'Elle en recevait un DÉGRADÉ de démonstration, rangé en base pour '
  + 'toujours : un conseil en texte s\'affichait avec une vignette grise et '
  + 'une pastille « agrandir ». Trouvé en publiant pour de vrai sur la vraie '
  + 'base, le 05/10/2026 — le mode démonstration ne le montrait pas, ses '
  + 'conseils d\'exemple portant `media: null` écrit à la main.');

verifier('…et les deux lecteurs tranchent sur le FORMAT',
  /porteUnVisuel\(post\.format\)/.test(carte)
  && /porteUnVisuel\(c\.format\) && !!c\.media/.test(bloc),
  'On ne peut pas trancher sur « est-ce un vrai fichier » : les '
  + 'publications de démonstration portent de vrais dégradés comme photos.');

/* ------------------------------------------------------------------ */
console.log('\nLe mode démonstration doit faire VIVRE le mécanisme');

verifier('deux conseils de démonstration',
  (demo.match(/conseil: true,/g) || []).length >= 2,
  'La vraie base en contient ZÉRO : sans eux, rien de ce lot ne se vérifie '
  + 'ici. Même raison que les dates calculées des demandes, le 04/10.');

verifier('…dont un en VIDÉO, pour le repère de son',
  /format: 'video'[\s\S]{0,80}?conseil: true,/.test(demo));

verifier('…et un en TEXTE sans image, pour la carte sans visuel',
  /format: 'texte'[\s\S]{0,80}?conseil: true,/.test(demo));

verifier('les conseils de démonstration se DÉDUISENT des publications',
  /function conseilsDemoDe\(proId\)/.test(api)
  && /initialPosts\s*\n?\s*\.filter\(\(p\) => p\.type !== 'ad' && p\.conseil/.test(api),
  'Une liste recopiée à la main se désaligne au premier conseil ajouté.');

verifier('…et la fiche est déclarée complète en démonstration',
  /p\.portfolioCharge = true;/.test(api),
  '`chargerProfilPro()` rend `null` en démonstration : sans ce drapeau, le '
  + 'squelette des réalisations tournait POUR TOUJOURS.');

/* ------------------------------------------------------------------ */
if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ L\'étiquette s\'écrit, et quelqu\'un la lit. Les deux bouts tiennent.\n');
