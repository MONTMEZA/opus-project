/**
 * L'ATELIER — ce qu'un développeur voit en ouvrant le dépôt.
 *
 * CE QUI MANQUAIT, LE 02/10/2026
 * ------------------------------
 * Le projet comptait vingt-deux contrôles et **aucune commande pour les
 * lancer tous** : il fallait les connaître par leur nom. Autrement dit,
 * personne ne les lançait tous, jamais.
 *
 * Et aucun linter, sur 86 fichiers de JavaScript. Son premier passage a
 * trouvé **deux défauts réels** que l'œil n'avait pas vus en trois jours :
 *
 *   1. `setMsgDraft` appelé à DEUX endroits alors que la fonction avait été
 *      supprimée au lot 4. Un `ReferenceError` à chaque fois qu'un
 *      particulier contactait un artisan, et à chaque réponse à une
 *      annonce. Le contrôle `verifier-listes` cherchait pourtant
 *      `msgDraft` dans `OpusApp` — mais `setMsgDraft` porte un M
 *      majuscule, et la recherche était sensible à la casse. Le contrôle
 *      passait au vert pendant que l'application plantait.
 *   2. `latitude` et `longitude` écrits DEUX FOIS dans le même objet, dans
 *      `api.js`. La seconde paire écrasait la première en silence.
 *
 * > **Un contrôle écrit à la main cherche ce qu'on a pensé à chercher.**
 * > Un linter, lui, lit ce qui est écrit. Les deux sont nécessaires, et
 * > aucun ne remplace l'autre.
 *
 * LE CLIQUET SUR LE LINTER
 * ------------------------
 * Il reste 33 alertes, toutes de la famille `react-hooks` — les règles du
 * compilateur React. Elles décrivent de vrais risques (une référence lue
 * pendant le rendu, un `setState` dans un effet), mais chacune demande un
 * arbitrage, et les corriger en bloc serait réécrire `OpusApp` à l'aveugle.
 *
 * Même parade qu'au lot 7 : **un cliquet**. Le nombre ne peut que
 * descendre. On ne répare pas tout aujourd'hui ; on s'interdit d'empirer.
 *
 *   npm run verifier-atelier
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');

/* Le cliquet du linter. On le REDESCEND quand on a réparé, jamais l'inverse. */
const PLAFOND_LINT = 33;

console.log('\nUne seule commande pour tout vérifier');
{
  const scripts = JSON.parse(lire('package.json')).scripts || {};
  const controles = Object.keys(scripts).filter((n) => n.startsWith('verifier-'));
  verifier('`npm run verifier` existe', !!scripts.verifier && existsSync('scripts/verifier.mjs'),
    'vingt-deux contrôles qu’il faut connaître par leur nom, personne ne les lance tous');

  /* Le coureur DÉCOUVRE les contrôles dans package.json au lieu de les
     énumérer : c'est ce qui fait qu'un contrôle ajouté demain entre tout
     seul. Une liste écrite à la main se périme au premier oubli. */
  verifier('…et il les découvre au lieu de les énumérer',
    /startsWith\('verifier-'\)/.test(lire('scripts/verifier.mjs')),
    'sinon un contrôle ajouté plus tard ne sera jamais lancé');

  verifier(`il y a ${controles.length} contrôles, et ils sont tous préfixés`,
    controles.length >= 20);

  /* La règle de CLAUDE.md que rien ne tenait avant ce coureur. */
  verifier('un contrôle qui PLANTE est rapporté comme tel',
    /N'A PAS PU SE LANCER/.test(lire('scripts/verifier.mjs')),
    'un contrôle qui meurt n’écrit aucun « ✘ » : il ressemble à un contrôle qui passe');
}

console.log('\nLe linter, et son cliquet');
{
  verifier('le linter est installé et configuré',
    existsSync('eslint.config.js')
    && !!(JSON.parse(lire('package.json')).devDependencies || {}).eslint);

  const r = spawnSync('npx', ['eslint', '.', '-f', 'json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  let total = null;
  try {
    const rapport = JSON.parse(r.stdout);
    total = rapport.reduce((n, f) => n + f.messages.length, 0);
  } catch (e) {
    verifier('le linter se lance', false, (r.stderr || '').trim().split('\n').slice(-3).join('\n'));
  }
  if (total !== null) {
    verifier(`${total} alerte(s) (plafond ${PLAFOND_LINT})`, total <= PLAFOND_LINT,
      total > PLAFOND_LINT
        ? `${total - PLAFOND_LINT} de plus qu’avant. On ne laisse pas le linter se dégrader.`
        : '');
    if (total < PLAFOND_LINT) {
      console.log(`      ↓ ${PLAFOND_LINT - total} de moins : redescendez le plafond à ${total}.`);
    }
  }
}

console.log('\nLes secrets ne partent jamais sur GitHub');
{
  /* La règle la plus dure du projet, et la seule dont une violation ne se
     rattrape pas : une clé publiée est une clé à changer. */
  const suivis = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n');
  verifier('`.env` n’est pas suivi par git', !suivis.includes('.env'),
    'un secret poussé reste dans l’historique, même effacé ensuite');
  verifier('…et `.gitignore` le dit', /^\.env$/m.test(lire('.gitignore')));
  verifier('`.env.example` existe', existsSync('.env.example'));

  /* Un exemple incomplet est pire que pas d'exemple : on croit avoir tout
     rempli, et l'application repart en mode démonstration sans le dire. */
  const exemple = lire('.env.example');
  const lues = new Set(
    execFileSync('git', ['grep', '-ho', 'process\\.env\\.EXPO_PUBLIC_[A-Z_]*', '--', 'src'],
      { encoding: 'utf8' })
      .split('\n').filter(Boolean).map((x) => x.replace('process.env.', '')),
  );
  const manquantes = [...lues].filter((v) => !exemple.includes(v));
  verifier(`\`.env.example\` cite les ${lues.size} variables que le code lit`,
    manquantes.length === 0,
    `${manquantes.join(', ')} — on croirait avoir tout rempli, et l’application `
    + 'repasserait en mode démonstration sans le dire');

  /* Une clé SECRÈTE dans l'application serait lisible par n'importe qui :
     tout ce qui est dans le paquet part sur le téléphone. */
  const interdits = ['SERVICE_ROLE', 'ANTHROPIC_API_KEY', 'CLOUDINARY_API_SECRET'];
  const fautifs = interdits.filter((mot) => {
    const g = spawnSync('git', ['grep', '-l', mot, '--', 'src', 'App.js'], { encoding: 'utf8' });
    return g.status === 0 && g.stdout.trim();
  });
  verifier('aucune clé secrète nommée dans `src/`', fautifs.length === 0,
    `${fautifs.join(', ')} — tout ce qui est dans le paquet part sur le téléphone`);
}

console.log('\nCe qui tourne tout seul');
{
  verifier('une intégration continue existe',
    existsSync('.github/workflows/verifier.yml'),
    'sans elle, les contrôles ne tournent que si quelqu’un y pense');
  if (existsSync('.github/workflows/verifier.yml')) {
    const ci = lire('.github/workflows/verifier.yml');
    verifier('…elle lance la commande unique', /npm run verifier/.test(ci));
    verifier('…et elle construit le paquet des DEUX plateformes',
      /platform ios/.test(ci) && /platform android/.test(ci),
      'une construction qui ne passe que d’un côté se découvre trop tard');
  }
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ L’atelier tient : une commande, un linter avec son cliquet, '
  + 'aucun secret qui sorte.\n');
