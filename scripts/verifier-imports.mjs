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
import { readFileSync } from 'node:fs';
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

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Rien ne se charge en route.\n');
