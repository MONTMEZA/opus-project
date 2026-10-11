/**
 * Aucun `await import(...)` dans `src/`. Jamais.
 *
 * POURQUOI CETTE RÈGLE EXISTE
 * ---------------------------
 * Un `await import()` n'est pas un import. Sur téléphone, c'est Metro qui
 * DÉCOUPE le paquet en morceaux et va chercher le morceau manquant auprès
 * du serveur de développement, **au moment où la ligne s'exécute**.
 *
 * Tant que la liaison tient, personne ne voit la différence. Le jour où
 * elle a bougé — téléphone en veille, Wi-Fi qui change, serveur
 * redémarré —, la ligne échoue sur une erreur venue des entrailles
 * d'Expo, qui ne parle ni du fichier ni du réseau.
 *
 * CE QUE ÇA A COÛTÉ, DEUX FOIS
 * ----------------------------
 * **29/09/2026** — « Enregistrement impossible » sur la photo de profil,
 * puis plus rien après un `npm start -- --clear`, sans qu'aucune
 * correction n'ait touché à l'envoi. Resté sans explication.
 *
 * **01/10/2026** — « Envoi de la photo de profil impossible : cannot read
 * property 'reload' of undefined ». `reload` n'existe nulle part dans ce
 * projet : il vient du mécanisme de découpage d'Expo.
 *
 * Les sept imports dynamiques de `src/` ont été remis en haut des
 * fichiers. Ce sont tous des dépendances DIRECTES du projet : elles sont
 * dans le paquet de toute façon, les charger en haut ne coûte rien.
 *
 * ET SI ON EN A VRAIMENT BESOIN UN JOUR ?
 * ---------------------------------------
 * Pour un module lourd qu'on ne veut charger qu'à la demande, ce sera un
 * choix réfléchi — pas la forme par défaut. Il faudra alors retirer le
 * fichier de cette liste EN SACHANT ce qu'on accepte.
 *
 * npm run verifier-imports
 */
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const fichiers = execFileSync('git',
  /* `--others` : un fichier NEUF, pas encore ajouté à git, échappait à
     tous les contrôles — constaté le 02/10/2026 avec `Ouverture.js`,
     qui est passé vert sans jamais avoir été lu. */
  ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.js'));

/**
 * Le code, sans les commentaires — et SANS perdre les numéros de ligne.
 *
 * LE DÉFAUT QUE CECI CORRIGE
 * --------------------------
 * La première version cherchait `await import(` ligne par ligne, et
 * signalait le commentaire de `storage.js` qui EXPLIQUE pourquoi on n'en
 * veut plus. Un contrôle qui accuse la documentation de ce qu'elle décrit
 * cesse d'être lu — c'est la deuxième fois en deux jours que je me fais
 * avoir par une recherche de texte trop naïve.
 *
 * On remplace donc chaque caractère de commentaire par une espace : les
 * lignes gardent leur numéro, et il ne reste que du code.
 */
function sansCommentaires(source) {
  let dedans = null;          // 'ligne' ou 'bloc'
  let sortie = '';
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    const suivant = source[i + 1];
    if (!dedans && c === '/' && suivant === '/') { dedans = 'ligne'; }
    else if (!dedans && c === '/' && suivant === '*') { dedans = 'bloc'; }
    else if (dedans === 'ligne' && c === '\n') { dedans = null; }
    else if (dedans === 'bloc' && c === '*' && suivant === '/') {
      dedans = null;
      sortie += '  ';
      i += 1;
      continue;
    }
    sortie += dedans && c !== '\n' ? ' ' : c;
  }
  return sortie;
}

console.log(`\nAucun import dynamique — ${fichiers.length} fichiers relus`);
{
  const coupables = [];
  fichiers.forEach((f) => {
    sansCommentaires(readFileSync(f, 'utf8')).split('\n').forEach((ligne, i) => {
      if (/\bawait\s+import\s*\(/.test(ligne)) coupables.push(`${f}:${i + 1}`);
    });
  });
  verifier('aucun `await import(...)` dans src/',
    coupables.length === 0,
    `${coupables.join('\n      ')}\n      → remonte l'import en haut du fichier`);
}

console.log('\nLes modules dont dépend un envoi sont chargés en haut');
{
  /* Ce sont ceux du chemin critique : une photo de profil, une bannière,
     un Kbis, une vidéo. Si l'un d'eux redevient dynamique, l'envoi
     redevient fragile sans que rien ne le dise. */
  const attendus = {
    'src/lib/storage.js': ['expo-file-system'],
    'src/lib/media.js': ['expo-file-system', 'expo-document-picker', 'expo-image-picker'],
    'src/lib/cloudinary.js': ['expo-file-system'],
  };
  Object.entries(attendus).forEach(([fichier, modules]) => {
    const contenu = readFileSync(fichier, 'utf8');
    modules.forEach((m) => {
      const statique = new RegExp(`^import[^\n]*from '${m}';`, 'm').test(contenu);
      verifier(`${fichier} charge ${m} en haut`, statique);
    });
  });
}

console.log('\nUn envoi qui échoue dit À QUELLE ÉTAPE');
{
  const storage = readFileSync('src/lib/storage.js', 'utf8');
  const etapes = ['lecture du fichier', 'taille du fichier', 'session', 'envoi vers Supabase'];
  etapes.forEach((e) => {
    verifier(`l'étape « ${e} » est nommée`, storage.includes(`'${e}'`));
  });
}

/**
 * CHAQUE PAQUET IMPORTÉ EXISTE VRAIMENT — ajouté le 11/10/2026.
 *
 * LE DÉFAUT QUI A COÛTÉ CE CONTRÔLE. En écrivant le carnet de clients,
 * j'ai importé `lucide-react-native` dans deux fichiers. Ce paquet n'est
 * PAS une dépendance d'Opus : le projet a son propre `src/components/
 * icons.js`, qui porte les mêmes noms « pour que les écrans se lisent
 * comme le fichier de référence » — c'est écrit en tête de ce fichier-là,
 * et je ne l'avais pas lu.
 *
 * ET CE QUI REND CE CONTRÔLE NÉCESSAIRE, c'est que RIEN ne l'a attrapé :
 *
 *   - le linter se tait (il ne résout pas les modules) ;
 *   - les 42 contrôles passaient ;
 *   - **et `npx expo export --platform ios` a rendu un code de sortie
 *     ZÉRO** en affichant pourtant son « Import stack » d'échec. Mesuré.
 *
 * Le troisième est le plus grave : ce projet lit les codes de sortie
 * depuis le lot 8 précisément pour ne pas se fier au texte, et là c'est
 * le code de sortie qui mentait. Seul `npx expo start --web` l'a dit — en
 * répondant 500 sur le paquet, c'est-à-dire un écran blanc.
 *
 * > **Un paquet importé dans `src/` doit figurer dans `package.json`.**
 * > C'est mécanique, ça tourne en une seconde, et ça n'attend pas qu'on
 * > pense à lancer l'application.
 */
console.log('\nChaque paquet importé existe vraiment');
{
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const connus = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]);

  const fichiers = [];
  const parcourir = (dossier) => {
    for (const e of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = `${dossier}/${e.name}`;
      if (e.isDirectory()) parcourir(chemin);
      else if (/\.(js|jsx|mjs)$/.test(e.name)) fichiers.push(chemin);
    }
  };
  parcourir('src');

  const inconnus = [];
  for (const f of fichiers) {
    /* ON VISE LE `from`, PAS LA FORME DE L'IMPORT. Le premier jet
       exigeait `^import … from '…';` sur UNE ligne : il est passé au vert
       en n'éprouvant presque rien, parce qu'un import de sept icônes
       s'écrit sur trois lignes. Éprouvé en remettant le défaut à la main,
       et il ne l'a pas vu. Dixième fois dans ce projet qu'un contrôle rend
       le bon résultat pour la mauvaise raison.

       Les lignes de commentaire partent d'abord — une documentation qui
       NOMME le paquet fautif ne doit pas être accusée (c'est arrivé neuf
       fois, et il y en a justement une dans `icons.js`). */
    const contenu = readFileSync(f, 'utf8')
      .split('\n')
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join('\n');
    for (const m of contenu.matchAll(/\bfrom\s+'([^']+)'/g)) {
      const spec = m[1];
      if (spec.startsWith('.') || spec.startsWith('/')) continue;
      /* Le nom du PAQUET, pas le chemin dedans : `@expo/vector-icons` est
         deux segments, `expo-image/build/x` un seul plus la suite. */
      const paquet = spec.startsWith('@')
        ? spec.split('/').slice(0, 2).join('/')
        : spec.split('/')[0];
      if (!connus.has(paquet)) inconnus.push(`${f} → ${spec}`);
    }
  }

  verifier(`les ${fichiers.length} fichiers de src/ n'importent que des paquets déclarés`,
    inconnus.length === 0,
    inconnus.length
      ? `Introuvable(s) dans package.json :\n      ${inconnus.join('\n      ')}\n      `
        + 'Un paquet inventé passe le linter ET `expo export` (qui rend 0 en '
        + 'échouant) : l’application affiche un écran blanc au démarrage.'
      : '');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Rien ne se charge en route.\n');
