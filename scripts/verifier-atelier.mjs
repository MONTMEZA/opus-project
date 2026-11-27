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
/* La liste fermée des essais SQL, lue sans rien lancer : le module ne fait
   rien d'autre que se déclarer quand on l'importe. */
import {
  ESSAIS, HORS_LISTE, PARITES, PROCEDURES_A_DEUX, ORACLE, ecartsDeLaListe,
} from './jouer-essais-sql.mjs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');

/* Le cliquet du linter. On le REDESCEND quand on a réparé, jamais l'inverse. */
const PLAFOND_LINT = 32;

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
    /* LE JOB `verifier`, FIGÉ ENTIER (2c-1, cahier §8.2, K12), comme celui
       des essais SQL plus bas : l'aperçu d'un devis a des fichiers propres
       à une plateforme (`devis-pdf.web.js`, `AfficheurPdf.web.js`), et une
       construction iOS ou Android qu'on ferait sauter (`if: false`,
       `continue-on-error`, `|| true`) cacherait celle qui ne passe pas.
       Changer ce job se DÉCIDE : le workflow ET la forme ci-dessous, dans le
       même commit. Depuis 2c-1 (§8.4), les quatre exports — iOS, Android,
       le navigateur et le paquet iOS de développement — gardent leur
       journal, et l'étape `lire-exports` LIT leur sortie : la retirer, ou
       sauter un export, rougit ici (S61). Lu comme le job des essais : sans
       commentaires, sans lignes vides, les fins de ligne rognées. */
    const lignesCi = ci.split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l !== '' && !/^\s*#/.test(l));
    const iVerifier = lignesCi.findIndex((l) => l === '  verifier:');
    const finVerifier = lignesCi.findIndex((l, i) => i > iVerifier && /^ {2}\S/.test(l));
    const jobVerifier = iVerifier < 0 ? [] : lignesCi.slice(iVerifier, finVerifier < 0 ? lignesCi.length : finVerifier);
    const JOB_VERIFIER = [
      '  verifier:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v4',
      '        with:',
      "          node-version: '22'",
      '          cache: npm',
      '      - name: Installer les dépendances',
      '        run: npm ci',
      '      - name: Les contrôles du projet',
      '        run: npm run verifier',
      /* Chaque export garde son journal, sous `bash -o pipefail` : c'est
         sa SORTIE que `lire-exports` lit (§8.4) — un export a déjà rendu 0
         en affichant une pile d'import. */
      '      - name: Construire le paquet iOS',
      '        shell: bash',
      '        run: npx expo export --platform ios --output-dir /tmp/paquet-ios 2>&1 | tee /tmp/export-ios.log',
      '      - name: Construire le paquet Android',
      '        shell: bash',
      '        run: npx expo export --platform android --output-dir /tmp/paquet-android 2>&1 | tee /tmp/export-android.log',
      '      - name: Construire le paquet du navigateur',
      '        shell: bash',
      '        run: npx expo export --platform web --source-maps --output-dir /tmp/paquet-web 2>&1 | tee /tmp/export-web.log',
      '      - name: Construire le paquet iOS de développement',
      '        shell: bash',
      '        run: npx expo export --platform ios --dev --output-dir /tmp/paquet-ios-dev 2>&1 | tee /tmp/export-ios-dev.log',
      '      - name: Lire les paquets',
      '        run: node scripts/lire-exports.mjs --dans /tmp',
    ];
    verifier('…et le job `verifier` a EXACTEMENT sa forme figée (K12 : ni `if:`, ni `continue-on-error`, ni `|| true`)',
      lignesCi.filter((l) => l === '  verifier:').length === 1 && JSON.stringify(jobVerifier) === JSON.stringify(JOB_VERIFIER),
      (() => {
        const k = JOB_VERIFIER.findIndex((l, i) => l !== jobVerifier[i]);
        const i = k >= 0 ? k : JOB_VERIFIER.length;
        return `ligne ${i + 1} du job : attendu « ${JOB_VERIFIER[i] ?? '(fin du job)'} », reçu « ${jobVerifier[i] ?? '(fin du job)'} »`;
      })());
    /* …et `lire-exports` lit EXACTEMENT ce que le job écrit : chaque journal
       et chaque dossier de paquet nommés par une étape d'export le sont
       aussi par le script. Renommer l'un sans l'autre, et l'étape de lecture
       chercherait un journal qui n'existe pas — elle rougirait dans GitHub,
       mais ici, avant l'envoi, c'est mieux. */
    const lecteur = existsSync('scripts/lire-exports.mjs') ? lire('scripts/lire-exports.mjs') : '';
    const ecrits = JOB_VERIFIER.join('\n').match(/\/tmp\/(export-[a-z-]+\.log|paquet-[a-z-]+)/g) || [];
    const oublies = ecrits.map((x) => x.replace('/tmp/', '')).filter((x) => !lecteur.includes(`'${x}'`));
    verifier(`…et \`scripts/lire-exports.mjs\` lit les ${ecrits.length} journaux et paquets que le job écrit`,
      !!lecteur && ecrits.length === 8 && oublies.length === 0, oublies.join(', ') || 'scripts/lire-exports.mjs absent');
  }
}

console.log('\nLes essais SQL : une liste fermée, hors de cette commande (étape 2c-E)');
{
  /* `npm run essais-sql` joue les fichiers `supabase/essais-*.sql` sur une
     grappe PostgreSQL qu'il crée ; cette commande-ci doit passer partout,
     y compris sans base. Ce qui se vérifie ICI, donc sur toutes les
     machines : qu'un essai ajouté demain n'échappe pas à la liste. C'est
     l'incident du 15-17/10 — sept fichiers d'essais cassés pendant deux
     jours, parce que rien ne les rejouait.

     La comparaison au disque est CELLE du script (`ecartsDeLaListe`), pas
     une recopie de son motif : la première version de ce contrôle ne voyait
     ni un `essai-…` au singulier, ni un `Essais-…`, ni un `….SQL`, ni un
     essai rangé dans un sous-dossier (relecture de 2c-E, C8). */
  const ecarts = ecartsDeLaListe();
  verifier('la liste fermée correspond à ce qui existe : chaque fichier qui ressemble à un essai est rangé, '
    + `chacun a son fichier, sa raison et son oracle à la version ${ORACLE}, aucun oracle n’est orphelin`,
  ecarts.length === 0, ecarts.join('\n      '));

  /* LE NOMBRE D'ENTRÉES EST FIGÉ, comme le nombre de cas de la parité
     (relecture de 2c-E, C10) : déplacer un essai dans HORS_LISTE avec
     n'importe quelle raison et effacer son oracle faisait passer le total de
     38 à 37 sans un mot. Sortir — ou ajouter — un essai se DÉCIDE : on change
     ces nombres ici, dans le même commit, en disant pourquoi. Et la seule
     entrée hors de la liste est nommée : l'outil de la famille D. */
  const FIGES = { essais: 33, procedures: 4, parites: 1 };
  const HORS_LISTE_FIGEE = ['essais-section-49-temoin'];
  verifier(`${FIGES.essais} essais, ${FIGES.procedures} procédures à deux sessions, ${FIGES.parites} parité : `
    + `${FIGES.essais + FIGES.procedures + FIGES.parites} entrées, le nombre figé`,
  ESSAIS.length === FIGES.essais && PROCEDURES_A_DEUX.length === FIGES.procedures && PARITES.length === FIGES.parites,
  `trouvé ${ESSAIS.length} essais, ${PROCEDURES_A_DEUX.length} procédures, ${PARITES.length} parité(s) — sortir ou ajouter `
    + 'un essai se décide : mettre à jour FIGES dans scripts/verifier-atelier.mjs, et dire pourquoi dans le commit');
  const horsListe = HORS_LISTE.map((e) => e.nom).sort();
  verifier(`hors de la liste : ${HORS_LISTE_FIGEE.join(', ')}, et rien d’autre`,
    JSON.stringify(horsListe) === JSON.stringify(HORS_LISTE_FIGEE),
    `trouvé : ${horsListe.join(', ') || '(rien)'} — un essai ne sort pas de la liste sans qu’on le décide ici`);

  /* LA COMMANDE NPM, EXACTE (relecture de 2c-E, C3) : « contient le nom du
     script » laissait passer `node scripts/jouer-essais-sql.mjs || true` (un
     rouge avalé) et `… essais-section-43` (un essai sur 38). Et aucun script
     `pre`/`post` : npm les lance d'office autour de la commande. */
  const scripts = JSON.parse(lire('package.json')).scripts || {};
  verifier('`npm run essais-sql` est EXACTEMENT `node scripts/jouer-essais-sql.mjs`',
    scripts['essais-sql'] === 'node scripts/jouer-essais-sql.mjs', `reçu : ${scripts['essais-sql'] ?? '(absent)'}`);
  verifier('…sans `preessais-sql` ni `postessais-sql`', !scripts['preessais-sql'] && !scripts['postessais-sql']);
  /* Le NOM tient tout : `scripts/verifier.mjs` lance ce qui commence par
     `verifier-`. Préfixés ainsi, les essais demanderaient une base à tout
     `npm run verifier`. */
  const prefixes = Object.entries(scripts).filter(([n, c]) => n.startsWith('verifier-') && /jouer-essais-sql/.test(c)).map(([n]) => n);
  verifier('…et aucun contrôle `verifier-` ne le lance', prefixes.length === 0,
    `${prefixes.join(', ')} — \`npm run verifier\` aurait besoin d’une base, et rougirait partout ailleurs`);

  /* LES COMMANDES DES CONTRÔLES, EXACTES (relecture « contrôles » de 2c-1,
     27/11) : `scripts/verifier.mjs` lance chaque `npm run --silent
     verifier-…` et lit son CODE. Un `|| true` posé dans `package.json` sur
     `verifier-apercu` avalait ses 271 vérifications, et `npm run verifier`
     restait vert, dans GitHub aussi. Chaque contrôle est donc EXACTEMENT
     `node scripts/<son nom>.mjs` — un seul nom fait exception, écrit ici —,
     sans `pre`/`post`, et leur nombre ne descend pas sans qu'on le décide. */
  const EXCEPTIONS_DE_NOM = { 'verifier-signature': 'verifier-signature-cloudinary' };
  const NOMBRE_DE_CONTROLES = 59;
  const controles = Object.keys(scripts).filter((n) => n.startsWith('verifier-'));
  const commandesFausses = controles.filter((n) => scripts[n] !== `node scripts/${EXCEPTIONS_DE_NOM[n] || n}.mjs`)
    .map((n) => `${n} : ${scripts[n]}`);
  verifier('chaque contrôle `verifier-…` est EXACTEMENT `node scripts/<son nom>.mjs` (une exception, écrite ici), et `verifier` aussi',
    commandesFausses.length === 0 && scripts.verifier === 'node scripts/verifier.mjs',
    `${commandesFausses.join(' | ')}${scripts.verifier === 'node scripts/verifier.mjs' ? '' : ` | verifier : ${scripts.verifier}`}`);
  const prePost = Object.keys(scripts).filter((n) => /^(pre|post)verifier/.test(n));
  verifier('…sans aucun script `pre`/`post` autour d’eux', prePost.length === 0, prePost.join(', '));
  verifier(`…au moins ${NOMBRE_DE_CONTROLES}, dont \`verifier-apercu\` et \`verifier-atelier\` — retirer un contrôle se décide ici`,
    controles.length >= NOMBRE_DE_CONTROLES && controles.includes('verifier-apercu') && controles.includes('verifier-atelier'),
    `${controles.length} contrôles`);

  const WORKFLOW = '.github/workflows/verifier.yml';
  if (!existsSync(WORKFLOW)) verifier(`${WORKFLOW} existe`, false);
  else {
    /* LA FORME DU JOB, FIGÉE ET COMPARÉE ENTIÈRE (relecture de 2c-E, C2, M2) :
       le premier contrôle ne cherchait que « npm run essais-sql » et
       « fetch-depth: 0 ». Sept retouches qui empêchent le job d'échouer
       passaient au vert : `|| true` sur la ligne, `continue-on-error: true`
       sur le job ou l'étape, `if: false` sur le job ou l'étape, `run: echo
       npm run essais-sql`, un seul essai nommé. C'est la règle « une forme
       figée, comparée entière » de verifier-moderation : changer ce job se
       DÉCIDE — on change le workflow ET la forme ci-dessous, dans le même
       commit, en disant pourquoi.

       Lu : les lignes de commentaire retirées (elles ne s'exécutent pas, et
       celle qui présente le job nomme la commande), les lignes vides
       retirées, les fins de ligne rognées. Rien d'autre n'est toléré : un
       commentaire en FIN de ligne, une ancre YAML, un `env:` ajouté rougissent. */
    const lignes = lire(WORKFLOW).split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l !== '' && !/^\s*#/.test(l));
    const iJobs = lignes.findIndex((l) => l === 'jobs:');
    const PREAMBULE = [
      'name: Vérifier',
      'on:',
      '  push:',
      "    branches: ['**']",
      '  pull_request:',
    ];
    /* Le préambule entier : les déclencheurs RÉELS (tout envoi, toute branche,
       et chaque pull request), et rien d'autre — un `env: { CI: '' }` posé ici
       lèverait la règle « sous CI, le passage est complet ». */
    verifier('le workflow se déclenche à chaque envoi, sur toute branche, et à chaque pull request — rien d’autre avant `jobs:`',
      iJobs > 0 && JSON.stringify(lignes.slice(0, iJobs)) === JSON.stringify(PREAMBULE),
      `reçu :\n        ${lignes.slice(0, Math.max(iJobs, 0)).join('\n        ')}`);
    const iJob = lignes.findIndex((l) => l === '  essais-sql:');
    const nbJobs = lignes.filter((l) => l === '  essais-sql:').length;
    const finJob = lignes.findIndex((l, i) => i > iJob && /^ {2}\S/.test(l));
    const job = iJob < 0 ? [] : lignes.slice(iJob, finJob < 0 ? lignes.length : finJob);
    const JOB = [
      '  essais-sql:',
      '    runs-on: ubuntu-24.04',
      '    timeout-minutes: 25',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '        with:',
      '          fetch-depth: 0',
      '      - uses: actions/setup-node@v4',
      '        with:',
      "          node-version: '22'",
      '      - name: PostgreSQL 16',
      '        run: |',
      '          if [ ! -x /usr/lib/postgresql/16/bin/initdb ]; then',
      '            sudo apt-get update',
      '            sudo apt-get install -y postgresql-16',
      '          fi',
      '          /usr/lib/postgresql/16/bin/postgres --version',
      '      - name: Les essais SQL',
      '        run: npm run essais-sql -- --sorties "$RUNNER_TEMP/sorties-essais-sql"',
      '      - name: Garder les sorties brutes si un essai a rougi',
      '        if: failure()',
      '        uses: actions/upload-artifact@v4',
      '        with:',
      '          name: sorties-essais-sql',
      '          path: ${{ runner.temp }}/sorties-essais-sql',
      '          retention-days: 7',
    ];
    verifier('GitHub les joue, dans UN job à part, `essais-sql`', nbJobs === 1, `${nbJobs} job(s) de ce nom`);
    /* Les causes, nommées une à une — la forme entière, plus bas, est ce qui
       ferme tout le reste. */
    const lignesRun = job.filter((l) => /essais-sql/.test(l) && /^\s+(- )?run:/.test(l));
    const run = '        run: npm run essais-sql -- --sorties "$RUNNER_TEMP/sorties-essais-sql"';
    verifier('…la ligne `run:` des essais, mot pour mot : ni `||`, ni `;`, ni `&&`, ni `true`, ni `echo`, ni nom d’essai',
      lignesRun.length === 1 && lignesRun[0] === run
        && !/\|\||;|&&|\btrue\b|\becho\b|essais-section|essais-suppression/.test(lignesRun[0].replace('npm run essais-sql', '')),
      `reçu : ${lignesRun.join(' / ') || '(aucune)'}`);
    verifier('…aucun `continue-on-error`, sur le job ni sur ses étapes', !job.some((l) => /continue-on-error/.test(l)),
      'un job qui ne peut plus échouer ne rougit plus jamais, même avec un essai cassé');
    const conditions = job.filter((l) => /^\s+(- )?if:/.test(l));
    const iArtefact = job.findIndex((l) => /actions\/upload-artifact/.test(l));
    verifier('…un seul `if:`, `if: failure()`, et c’est celui de l’artefact',
      conditions.length === 1 && conditions[0] === '        if: failure()' && iArtefact === job.indexOf('        if: failure()') + 1,
      `reçu : ${conditions.join(' / ') || '(aucun)'} — un \`if: false\` sur le job ou l’étape les fait SAUTER, en vert`);
    verifier('…avec l’historique entier (le rattrapage du lot T lit d0560e8)', job.includes('          fetch-depth: 0'));
    verifier('…et le job a EXACTEMENT sa forme figée (scripts/verifier-atelier.mjs)', JSON.stringify(job) === JSON.stringify(JOB),
      (() => {
        const k = JOB.findIndex((l, i) => l !== job[i]);
        const i = k >= 0 ? k : JOB.length;
        return `ligne ${i + 1} du job : attendu « ${JOB[i] ?? '(fin du job)'} », reçu « ${job[i] ?? '(fin du job)'} »`;
      })());
  }
}

console.log('\nUn contrôle qui boucle ne bloque plus tout');
{
  /* Le délai par contrôle de `scripts/verifier.mjs` (26/11/2026), et ce qui
     le rend vrai : arrêter le GROUPE, sinon le petit-enfant de `npm run`
     survit en tenant les tuyaux, et le coureur attend toujours. */
  const v = lire('scripts/verifier.mjs');
  const d = Number((v.match(/DELAI_PAR_DEFAUT_S = (\d+)/) || [])[1]);
  verifier(`chaque contrôle a un délai (${d || '?'} s)`, d > 0, 'un contrôle qui ne finit pas bloquerait tous les suivants');
  verifier('…et c’est le GROUPE qui est arrêté', /detached: true/.test(v) && /process\.kill\(-/.test(v),
    'tuer `npm` seul laisse son petit-enfant tenir les tuyaux');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ L’atelier tient : une commande, un linter avec son cliquet, '
  + 'aucun secret qui sorte.\n');
