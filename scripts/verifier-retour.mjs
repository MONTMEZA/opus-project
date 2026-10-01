/**
 * LE SOCLE DU TOUCHER — ce qui se contrôle ici, et ce qui ne s'y contrôle pas.
 *
 * CE QUI A ÉTÉ CONSTATÉ, LE 01/10/2026
 * ------------------------------------
 * Un relevé sur tout `src/` a trouvé 106 zones appuyables et **zéro**
 * occurrence du mot `pressed` : aucun bouton de l'application ne montrait
 * qu'on l'avait touché. `expo-haptics` était installé depuis le début et
 * appelé à un seul endroit. Et les deux fichiers qui animaient quelque
 * chose avaient chacun écrit SON ressort — 230 et 190 de raideur —, ce qui
 * est exactement la dérive que les échelles de `theme.js` ont corrigée
 * partout ailleurs.
 *
 * Ce contrôle existe pour que ça ne revienne pas.
 *
 * CE QU'IL NE PEUT PAS VÉRIFIER, ET IL FAUT LE DIRE
 * -------------------------------------------------
 * Le vibreur n'existe ni dans le navigateur de test, ni dans le conteneur.
 * On vérifie donc que les appels SONT là, protégés, et au bon endroit —
 * pas qu'ils se sentent bien dans la main. **Seul l'iPhone le dira.**
 *
 *   npm run verifier-retour
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const fichiers = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.js'));
const lire = (f) => readFileSync(f, 'utf8');

/* Le code sans ses commentaires — sinon ce contrôle accuse la documentation
   de ce qu'elle explique. L'erreur a déjà été faite deux fois dans ce
   projet ; `verifier-imports.mjs` porte la même parade. */
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

const code = Object.fromEntries(fichiers.map((f) => [f, sansCommentaires(lire(f))]));

console.log('\nUne seule porte vers le vibreur');
{
  const directs = fichiers.filter((f) => f !== 'src/lib/retour.js'
    && /from 'expo-haptics'/.test(code[f]));
  verifier('`expo-haptics` n’est importé que par src/lib/retour.js',
    directs.length === 0,
    `${directs.join(', ')}\n      → passe par une des six fonctions de retour.js`);
}

console.log('\nLa doctrine est complète, et aucun appel ne peut faire échouer une action');
{
  const r = lire('src/lib/retour.js');
  ['prise', 'decision', 'reussite', 'echec', 'avertissement', 'cran'].forEach((f) => {
    verifier(`\`${f}()\` existe`, new RegExp(`export function ${f}\\(`).test(r));
  });
  const corps = sansCommentaires(r);
  /* On compte les APPELS (`impactAsync(`, `notificationAsync(`,
     `selectionAsync(`), pas les constantes `Haptics.ImpactFeedbackStyle`
     qu'ils reçoivent en argument — sinon le contrôle compte double et
     accuse un fichier correct. */
  const appels = (corps.match(/Haptics\.\w+Async\(/g) || []).length;
  const proteges = (corps.match(/sansJamaisEchouer\(/g) || []).length;
  verifier('chaque appel au vibreur passe par `sansJamaisEchouer`',
    appels > 0 && proteges === appels + 1,
    `${appels} appels à Haptics, ${proteges - 1} protégés`);
}

console.log('\nLe mouvement a son échelle, comme les tailles et les espacements');
{
  const t = lire('src/theme.js');
  ['M', 'RESSORT', 'RESSORT_PORTE', 'APPUI'].forEach((nom) => {
    verifier(`theme.js exporte \`${nom}\``, new RegExp(`export const ${nom} =`).test(t));
  });

  const inventes = fichiers.filter((f) => f !== 'src/theme.js'
    && /\bdamping:\s*\d/.test(code[f]));
  verifier('aucun ressort écrit à la main hors de theme.js',
    inventes.length === 0,
    `${inventes.join(', ')}\n      → utilise RESSORT ou RESSORT_PORTE`);
}

console.log('\nTout ce sur quoi on appuie réagit sous le doigt');
{
  const ui = code['src/components/ui.js'];
  /* Les sept briques partagées : elles couvrent la quasi-totalité des
     appuis de l'application, donc les corriger ici les corrige partout. */
  const briques = ['BtnMain', 'BtnOutline', 'BtnMini', 'Chip', 'ChipFollow', 'IconBtn'];
  briques.forEach((b) => {
    const bloc = ui.split(`export function ${b}(`)[1];
    verifier(`${b} s’enfonce quand on appuie`,
      !!bloc && /style=\{\(\{ pressed \}\)/.test(bloc.slice(0, 1400))
        && /pressed && APPUI\./.test(bloc.slice(0, 1400)));
  });

  const barre = code['src/components/PostCard.js'];
  verifier('les quatre actions du fil ont une zone de touche élargie',
    (barre.match(/hitSlop=\{S\.sm\}/g) || []).length >= 4,
    'PostCard.js — un cœur de 17 px ne se vise pas au pouce');
}

console.log('\nLe seul canal par lequel l’application répond est aussi senti');
{
  const app = code['src/OpusApp.js'];
  verifier('showBanner fait vibrer, différemment selon réussite ou échec',
    /retour\.echec\(\)/.test(app) && /retour\.reussite\(\)/.test(app),
    'src/OpusApp.js — un échec s’affiche en haut, et on regarde en bas');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le socle du toucher tient. Reste à le SENTIR, et ça, '
  + 'seul l’iPhone le dira.\n');
