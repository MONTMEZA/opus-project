/**
 * L'ÉCRAN DE DÉMARRAGE DU TÉLÉPHONE, ET SA COPIE — étape 2c-0.
 *
 * CE QUI SE PASSE QUAND ON TOUCHE L'ICÔNE
 * ---------------------------------------
 * 1. L'iPhone affiche, avant que JavaScript ne tourne, le logo du
 *    propriétaire sur l'orange. Cet écran est fabriqué à la construction
 *    par le greffon `expo-splash-screen`, avec les options écrites dans
 *    `app.json`.
 * 2. `App.js` lui dit d'attendre (`preventAutoHideAsync`, au niveau du
 *    fichier) : sinon il disparaîtrait d'un coup au premier rendu.
 * 3. L'Ouverture dessine une COPIE exacte (la « plaque ») par-dessus les
 *    barrières fermées, et retire l'écran du téléphone quand l'image de
 *    la copie est chargée. Personne ne voit le passage.
 * 4. La plaque se fond dans les barrières, qui s'ouvrent.
 *
 * Tout tient à ce que la copie soit IDENTIQUE : même image, même largeur,
 * même orange. Ces valeurs sont écrites à deux endroits (`app.json` et
 * `Ouverture.js`) parce que le greffon ne lit que `app.json` et que
 * l'application ne lit pas `app.json`. Ce contrôle les compare.
 *
 * ET DEUX PIÈGES, lus dans le code du greffon (57.0.12) :
 *   - la clé `splash` en haut d'`app.json` n'est plus lue en SDK 57
 *     (expo-doctor la refuse) : la laisser ferait croire qu'elle règle
 *     quelque chose — c'est arrivé, le commentaire de l'Ouverture la
 *     citait ;
 *   - une option `dark` force `UIUserInterfaceStyle = Automatic` dans
 *     l'Info.plist (`withIosSplashInfoPlist.ts`) : TOUTE l'application
 *     suivrait le mode sombre du téléphone, alors qu'elle n'est dessinée
 *     qu'en clair.
 *
 * CE QUI NE SE VÉRIFIE PAS ICI : l'écran du téléphone lui-même. Il ne
 * s'affiche que sur l'iPhone, et Expo prévient qu'un build de
 * développement ne le montre pas toujours fidèlement : il se juge dans la
 * « preview ».
 *
 *   npm run verifier-demarrage
 */
import { readFileSync, existsSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* Un contrôle qui lit du code retire d'abord les commentaires : ceux de
   l'Ouverture EXPLIQUENT `hideAsync` et `preventAutoHideAsync`. */
function sansCommentaires(source) {
  let dedans = null;
  let sortie = '';
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    const suivant = source[i + 1];
    if (!dedans && c === '/' && suivant === '/') { dedans = 'ligne'; }
    else if (!dedans && c === '/' && suivant === '*') { dedans = 'bloc'; }
    else if (dedans === 'ligne' && c === '\n') { dedans = null; }
    else if (dedans === 'bloc' && c === '*' && suivant === '/') {
      dedans = null; sortie += '  '; i += 1; continue;
    }
    sortie += dedans && c !== '\n' ? ' ' : c;
  }
  return sortie;
}

const lire = (f) => readFileSync(f, 'utf8');
const config = JSON.parse(lire('app.json')).expo;
const theme = lire('src/theme.js');
const racine = sansCommentaires(lire('App.js'));
const ouverture = sansCommentaires(lire('src/components/Ouverture.js'));
const accent = (theme.match(/\baccent:\s*'(#[0-9A-Fa-f]{6})'/) || [])[1];

console.log('\n1. app.json : le greffon, avec ses options');
const entree = (config.plugins || []).find((p) => (Array.isArray(p) ? p[0] : p) === 'expo-splash-screen');
const options = Array.isArray(entree) ? entree[1] || {} : null;
{
  verifier('`expo-splash-screen` est dans `plugins`', !!entree);
  verifier('…AVEC ses options (sans elles, le greffon ne fait RIEN : `if (props != null)`)',
    !!options && Object.keys(options).length > 0,
    '`npx expo install expo-splash-screen` l’ajoute sans options : il faut les écrire.');
  verifier('la clé `splash` du haut a disparu (le SDK 57 ne la lit plus)', !('splash' in config));
  const sombre = options && ('dark' in options
    || (options.ios && 'dark' in options.ios) || (options.android && 'dark' in options.android));
  verifier('aucune option `dark`', !sombre,
    'elle forcerait UIUserInterfaceStyle = Automatic : toute l’application passerait au mode sombre.');
  verifier('l’application reste dessinée en clair (`userInterfaceStyle: light`)', config.userInterfaceStyle === 'light');
  verifier('le fond est l’orange de l’identité (`C.accent`)',
    !!options && !!accent && String(options.backgroundColor).toUpperCase() === accent.toUpperCase(),
    `app.json : ${options && options.backgroundColor} — theme.js : ${accent}`);
  verifier('une largeur en nombre', !!options && Number.isFinite(options.imageWidth) && options.imageWidth > 0);
  verifier('aucune option propre à une plateforme (une seule copie à tenir)',
    !!options && !options.ios && !options.android);
}

console.log('\n2. L’image : un dessin carré sur fond TRANSPARENT');
{
  const chemin = options && options.image;
  const ok = !!chemin && existsSync(chemin);
  verifier('le fichier existe', ok, `chemin : ${chemin}`);
  if (ok) {
    const png = readFileSync(chemin);
    const signature = png.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    const largeur = png.readUInt32BE(16);
    const hauteur = png.readUInt32BE(20);
    const type = png[25];
    verifier('c’est un PNG', signature);
    verifier('carré', largeur === hauteur, `${largeur} × ${hauteur}`);
    verifier('au moins trois fois la largeur affichée (pas d’agrandissement sur un iPhone @3x)',
      largeur >= 3 * options.imageWidth, `${largeur} px pour ${options.imageWidth} points`);
    /* Type 6 (RVBA) ou 4 (gris + alpha) : le fond de l'écran vient alors
       de la couleur du greffon, jamais de l'image. Un carré orange opaque
       pourrait se voir sur l'orange si les deux ne tombaient pas pile. */
    verifier('avec une couche de transparence', type === 6 || type === 4, `type de couleur PNG : ${type}`);
  }
}

console.log('\n3. Le nom sous l’icône, et ce qui ne doit pas bouger');
{
  verifier('`name` vaut « Opus »', config.name === 'Opus', `trouvé : ${config.name}`);
  verifier('`slug` reste `opus-project` (EAS le compare au projet, et il fait le lien `exp+opus-project`)',
    config.slug === 'opus-project');
}

console.log('\n4. App.js : l’écran du téléphone attend');
{
  const iComposant = racine.indexOf('export default function App');
  const iAttente = racine.indexOf('SplashScreen.preventAutoHideAsync(');
  verifier('`preventAutoHideAsync` est appelé', iAttente >= 0);
  verifier('…au niveau du FICHIER, avant le composant (dans le composant, il arriverait trop tard)',
    iAttente >= 0 && iComposant > iAttente && /^SplashScreen\.preventAutoHideAsync\(/m.test(racine));
  verifier('…sans `await`', iAttente >= 0 && !/await\s+SplashScreen\.preventAutoHideAsync/.test(racine));
  verifier('…et sans laisser filer un refus', /SplashScreen\.preventAutoHideAsync\(\)\.catch\(/.test(racine));
}

console.log('\n5. Ouverture.js : la copie, et qui retire l’écran du téléphone');
{
  const image = (ouverture.match(/const LOGO_DEMARRAGE = require\('\.\.\/\.\.\/([^']+)'\)/) || [])[1];
  verifier('la plaque montre la MÊME image que le greffon',
    !!options && !!image && `./${image}` === options.image, `Ouverture : ${image} — app.json : ${options && options.image}`);
  const largeur = Number((ouverture.match(/const LARGEUR_LOGO_DEMARRAGE = (\d+);/) || [])[1]);
  verifier('…à la MÊME largeur', !!options && largeur === options.imageWidth,
    `Ouverture : ${largeur} — app.json : ${options && options.imageWidth}`);
  const plaque = (ouverture.match(/\n {2}plaque: \{([\s\S]*?)\n {2}\},/) || [])[1] || '';
  verifier('…sur l’orange `C.accent`, au centre de l’écran ENTIER',
    /backgroundColor: C\.accent/.test(plaque) && /\.\.\.StyleSheet\.absoluteFill(?![\w$])/.test(plaque)
    && !/absoluteFillObject/.test(plaque)
    && /alignItems: 'center'/.test(plaque) && /justifyContent: 'center'/.test(plaque),
    '`...StyleSheet.absoluteFill`, jamais `absoluteFillObject` : React Native 0.86 ne l’a plus, '
    + 'et sur l’iPhone la plaque tomberait dans le flux, en bande de 288 points de haut.');
  verifier('l’image est carrée, en `contain`',
    /style=\{\{ width: LARGEUR_LOGO_DEMARRAGE, height: LARGEUR_LOGO_DEMARRAGE \}\}/.test(ouverture)
    && /resizeMode="contain"/.test(ouverture));
  const iPlaque = ouverture.indexOf('style={[s.plaque');
  const iPanneau = ouverture.lastIndexOf('<Panneau ');
  verifier('la plaque est posée APRÈS les barrières (donc par-dessus)', iPlaque > iPanneau && iPanneau > 0);
  verifier('l’écran du téléphone se retire quand l’image de la copie est chargée',
    /onLoadEnd=\{retirerLeDemarrage\}/.test(ouverture));
  verifier('…par `hideAsync`, une seule fois',
    /const retirerLeDemarrage = React\.useCallback\(\(\) => \{\s*if \(natifRetire\.current\) return;\s*natifRetire\.current = true;[\s\S]*?SplashScreen\.hideAsync\(\)/.test(ouverture));
  verifier('filet 1 : un délai', /setTimeout\(retirerLeDemarrage, FILET_DEMARRAGE\)/.test(ouverture));
  const terminer = (ouverture.match(/const terminer = React\.useCallback\(\(\) => \{([\s\S]*?)\}, \[/) || [])[1] || '';
  verifier('filet 2 : la fin de l’ouverture (un doigt peut la passer avant que l’image ne charge)',
    /retirerLeDemarrage\(\)/.test(terminer));
  verifier('PAS dans le nettoyage d’un effet (React le joue à vide en mode strict)',
    !/return \(\) => \{[^}]*retirerLeDemarrage\(\)/.test(ouverture));
}

console.log('\n6. Une seule porte vers l’écran du téléphone');
{
  const { execSync } = await import('node:child_process');
  const fichiers = execSync('git ls-files "*.js" "*.mjs"', { encoding: 'utf8' }).split('\n')
    .filter((f) => f && !f.startsWith('scripts/') && !f.startsWith('node_modules/'));
  const autres = fichiers.filter((f) => {
    if (f === 'App.js' || f === 'src/components/Ouverture.js') return false;
    return /expo-splash-screen|SplashScreen\.(hide|hideAsync|preventAutoHideAsync|setOptions)\(/.test(sansCommentaires(lire(f)));
  });
  verifier('personne d’autre ne touche à `expo-splash-screen`', autres.length === 0, autres.join(', '));
}

if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.`);
  process.exit(1);
}
console.log('\n✔ L’écran de démarrage et sa copie se tiennent.');
