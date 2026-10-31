/**
 * LES ALERTES DE SÉCURITÉ NPM — lesquelles comptent, et laquelle ne compte pas.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Le 04/10/2026, le propriétaire lance `npm install` et lit :
 *
 *     26 vulnerabilities (7 moderate, 19 high)
 *     To address all issues (including breaking changes), run:
 *       npm audit fix --force
 *
 * C'est inquiétant, c'est écrit en rouge, et la commande proposée
 * **détruirait le projet** : mesuré le jour même, `--force` installerait
 * **expo@44.0.6** — trois versions majeures en arrière, une version de
 * 2021. (Le 30/09 il proposait expo@46 ; le chiffre empire avec le temps.)
 *
 * Et le nombre monte tout seul : 11 alertes le 30/09, 26 le 04/10, sans
 * qu'une seule ligne du projet ait changé. Ce sont de NOUVEAUX avis publiés
 * sur des paquets déjà installés.
 *
 * LA SEULE QUESTION QUI COMPTE
 * ----------------------------
 * Pas « combien ? », mais : **est-ce que ce paquet part sur le téléphone ?**
 *
 * Les 26 alertes du 04/10 se ramènent à TROIS causes, et les trois vivent
 * dans les outils d'Expo qui tournent sur l'ordinateur pendant
 * `npm start` :
 *
 *     expo > @expo/cli > @expo/code-signing-certificates > node-forge
 *     expo > @expo/cli > @expo/metro-file-map > micromatch > braces
 *     expo > @expo/cli > node-forge
 *     expo > @expo/config-plugins > xcode > uuid
 *
 * Aucune n'entre dans l'application installée. Et `xcode` ne sert qu'au
 * `prebuild`, que ce projet ne fait jamais puisqu'il tourne dans Expo Go.
 *
 * CE QUE CE CONTRÔLE VÉRIFIE DONC
 * -------------------------------
 *   1. **Expo n'a pas été ramené en arrière.** C'est le garde-fou contre
 *      un `npm audit fix --force` lancé un jour de fatigue. Il tourne même
 *      sans réseau, et c'est le plus important des deux ;
 *   2. **aucune alerte ne touche un paquet qui part sur le téléphone.**
 *      Tant que tout passe par les outils d'Expo (`@expo/cli`,
 *      `@expo/config-plugins`, `@expo/metro`, `@expo/config`) ou par une
 *      dépendance de développement, il n'y a rien à faire. Le jour où une alerte apparaît ailleurs —
 *      `react-native`, `@supabase/supabase-js`, `expo-image` — ce contrôle
 *      rougit, et là il faut agir.
 *
 *   npm run verifier-dependances
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* La version MAJEURE sous laquelle le projet ne tourne plus. Expo 57 est
   celle d'Expo Go aujourd'hui ; descendre casse tout, et c'est exactement
   ce que `npm audit fix --force` propose. */
const EXPO_MINIMUM = 57;

/* LES PORTES D'ENTRÉE DES OUTILS. Tout ce qui ne passe QUE par l'une
   d'elles tourne sur l'ordinateur, jamais sur le téléphone :
     - `@expo/cli` : le serveur de développement, le surveillant de
       fichiers, la signature du paquet de développement ;
     - `@expo/config-plugins` : la génération d'un projet natif
       (`prebuild`), que ce projet ne fait jamais — il tourne dans Expo Go ;
     - `@expo/metro` : le bundler lui-même, ajouté le 06/10/2026.

   POURQUOI `@expo/metro` a été AJOUTÉ, et comment ça a été prouvé.
   Expo 57.0.27 a réorganisé ses paquets : `metro-file-map` — le scanner de
   fichiers du bundler — passait par `@expo/cli > @expo/metro-file-map`, il
   passe maintenant par `@expo/metro`. Le contrôle a donc rougi sur
   `expo > @expo/metro > metro-file-map > micromatch > braces`, le MÊME
   paquet que ce document décrit depuis le 04/10 comme un outil. Un
   renommage de chemin, pas un changement de nature.

   Et ça ne se croit pas, ça se MESURE. Sur le paquet iOS exporté
   (`npx expo export --platform ios`, 4,7 Mo de bytecode Hermes) :

     metro-file-map   0 occurrence
     micromatch       0 occurrence
     braces           2 occurrences — et ce sont des NOMS D'ICÔNES
                      (`application-braces-outline`, `code-block-braces`),
                      la table de `@expo/vector-icons`.

   Le bundler construit le paquet ; il n'entre pas dedans. La règle de ce
   contrôle est inchangée : **la bonne question n'est jamais « combien ? »,
   c'est « est-ce que ce paquet part sur le téléphone ? »** — et on y
   répond en regardant le paquet, pas en raisonnant sur un nom.

   ET LES DÉPENDANCES DE DÉVELOPPEMENT, ajoutées le 24/10/2026. Ce jour-là,
   le contrôle a rougi sans qu'une ligne du projet ait bougé : un avis neuf
   sur `zod`, par `eslint-config-expo > eslint-plugin-react-hooks > zod`.
   C'est le LINTER : il tourne sur l'ordinateur quand on lance `npm run
   lint`, et il est rangé dans `devDependencies`. Mesuré sur le paquet iOS
   exporté (5,9 Mo) : `zod-validation-error`, `eslint-plugin-react-hooks` et
   `ZodError` 0 occurrence ; les 4 « zod » trouvés sont des noms d'icônes
   (`zodiac-aries`, `zodiac-leo`…). Un chemin qui PART d'une dépendance de
   développement est donc un outil — à une condition, que le contrôle tient
   aussi : qu'aucun fichier de `src/` ne l'importe, sinon il entrerait dans
   le paquet comme n'importe quelle dépendance. */
/* ET `@expo/config`, ajouté le 29/10/2026 — même famille, même preuve.
   Ce jour-là, la vérification continue (GitHub) a rougi à CHAQUE envoi
   depuis le 29/10 à 17 h, sans qu'une ligne du projet ait bougé : un avis
   neuf, de gravité « faible », sur `deepmerge`, par
   `expo > @expo/config > deepmerge`. `@expo/config` est le LECTEUR de
   `app.json` : il tourne sur l'ordinateur quand Metro, le serveur ou un
   build lisent la configuration. Mesuré sur le paquet iOS exporté (6,1 Mo
   de bytecode Hermes) : `isMergeableObject`, `deepmerge`,
   `cloneUnlessOtherwiseSpecified`, `customMerge` (le code de `deepmerge`),
   `getConfigFilePaths` et `withConfigPlugins` (celui d'`@expo/config`) :
   0 occurrence chacun — et le témoin `accentTexte` (une couleur de
   `theme.js`) : 1. Un mot ASCII survit dans la table des chaînes de
   Hermes ; s'il n'y est pas, le code n'y est pas. */
/* ET `@expo/fingerprint` ET `@expo/metro-config`, ajoutés le 31/10/2026 —
   même famille, même preuve. Ce jour-là, le contrôle a rougi sans qu'une
   ligne du projet ait bougé : des avis neufs sur `glob` et `minimatch`, par
   `expo > @expo/fingerprint > glob|minimatch` et
   `expo > @expo/metro-config > glob`. `@expo/fingerprint` calcule
   l'empreinte du projet natif pour un build ou une mise à jour ;
   `@expo/metro-config` est la configuration du bundler (`metro.config.js`) :
   les deux tournent sur l'ordinateur. Mesuré sur le paquet iOS exporté
   (6,1 Mo de bytecode Hermes) : `GLOBSTAR`, `braceExpand`, `minimatch`,
   `PathScurry`, `GlobStream`, `escapePath`, `globSync` (le code de `glob`
   et de `minimatch`), `createFingerprintAsync` et `getDefaultConfig` :
   0 occurrence chacun. Un seul « makeRe » : un morceau de
   « _makeReferrer-Policy » dans la table des chaînes, pas une fonction de
   `minimatch`. Témoin `accentTexte` : 1. */
const OUTILS = ['@expo/cli', '@expo/config-plugins', '@expo/metro', '@expo/config',
  '@expo/fingerprint', '@expo/metro-config'];
const PAQUET = JSON.parse(readFileSync('package.json', 'utf8'));
const DEV = Object.keys(PAQUET.devDependencies || {});

/* Une dépendance de développement importée par l'application entrerait dans
   le paquet : elle cesse alors d'être un outil. On lit les fichiers suivis
   de `src/`, commentaires compris — un faux « importé » ne fait que rougir,
   jamais passer au vert à tort. */
const SOURCES = spawnSync('git', ['ls-files', 'src'], { encoding: 'utf8' }).stdout
  .split('\n').filter((f) => /\.(js|jsx|ts|tsx|mjs)$/.test(f) && existsSync(f))
  .map((f) => readFileSync(f, 'utf8')).join('\n');
const importeParLApplication = (nom) => {
  const n = nom.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  return new RegExp(`(from\\s*|require\\(\\s*|import\\(\\s*)['"]${n}(['"/])`).test(SOURCES);
};
const estUnOutil = (chemin) => chemin.some((hop) => OUTILS.includes(hop))
  || (DEV.includes(chemin[0]) && !importeParLApplication(chemin[0]));

console.log('\nExpo n’a pas été ramené en arrière');
{
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const demande = String((pkg.dependencies || {}).expo || '');
  const majeure = parseInt(demande.replace(/[^0-9.]/g, '').split('.')[0], 10);
  verifier(`package.json demande Expo ${demande || '(absent)'}`,
    Number.isFinite(majeure) && majeure >= EXPO_MINIMUM,
    `Expo ${EXPO_MINIMUM} au minimum. En dessous, l’application ne démarre plus — `
    + 'et c’est précisément ce que `npm audit fix --force` installerait.');

  const chemin = 'node_modules/expo/package.json';
  if (existsSync(chemin)) {
    const installee = JSON.parse(readFileSync(chemin, 'utf8')).version;
    const maj = parseInt(String(installee).split('.')[0], 10);
    verifier(`…et la version installée est Expo ${installee}`, maj >= EXPO_MINIMUM,
      'un `npm audit fix --force` est passé par là : réinstallez avec `npm ci`');
  } else {
    console.log('      (node_modules absent : rien à comparer)');
  }
}

console.log('\nAucune alerte ne touche ce qui part sur le téléphone');
{
  /* `npm audit` interroge le registre : sans réseau, il échoue. On le dit
     franchement plutôt que d’afficher un ✔ qui ne vérifierait rien — la
     règle du projet depuis `verifier-montage`. */
  const r = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let rapport = null;
  try { rapport = JSON.parse(r.stdout); } catch { rapport = null; }

  if (!rapport || !rapport.vulnerabilities) {
    console.log('  ⚠ `npm audit` n’a pas répondu (pas de réseau ?) — cette partie '
      + 'n’a RIEN vérifié.');
  } else {
    const v = rapport.vulnerabilities;
    const m = rapport.metadata ? rapport.metadata.vulnerabilities : {};
    console.log(`      ${m.total || 0} alerte(s) : ${m.critical || 0} critique(s), `
      + `${m.high || 0} haute(s), ${m.moderate || 0} moyenne(s)`);

    /* Les CAUSES racines : un paquet dont l'avis porte sur lui-même, et non
       sur une de ses dépendances. Une cause peut produire dix alertes. */
    const causes = Object.values(v)
      .filter((x) => (x.via || []).some((y) => typeof y === 'object'))
      .map((x) => x.name);

    if (!causes.length) {
      verifier('aucune alerte du tout', true);
    } else {
      const dansLApplication = [];
      const introuvables = [];
      causes.forEach((paquet) => {
        /* `--package-lock-only` : l'arbre se lit dans le VERROU, celui que
           `npm ci` installe — pas dans un `node_modules` qui peut en avoir
           dérivé. Constaté le 29/10 : dans le conteneur de travail, `npm ls`
           rendait un arbre VIDE, aucun chemin n'était trouvé, et le contrôle
           passait au vert sans avoir rien regardé, pendant que la
           vérification continue, installée par `npm ci`, rougissait. */
        const l = spawnSync('npm', ['ls', paquet, '--json', '--all', '--package-lock-only'],
          { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
        let arbre = null;
        try { arbre = JSON.parse(l.stdout); } catch { arbre = null; }
        const chemins = [];
        const marche = (n, pile) => {
          Object.entries((n && n.dependencies) || {}).forEach(([nom, x]) => {
            const p = [...pile, nom];
            if (nom === paquet) chemins.push(p);
            else marche(x, p);
          });
        };
        if (arbre) marche(arbre, []);

        /* Un paquet signalé dont on ne trouve AUCUN chemin n'est pas « dans
           les outils » : c'est le contrôle qui n'a rien vu. Il le dit. */
        if (!chemins.length) {
          introuvables.push(paquet);
          console.log(`      ? ${paquet} — aucun chemin trouvé dans le verrou`);
        }

        chemins.forEach((p) => {
          const outil = estUnOutil(p);
          console.log(`      ${outil ? '·' : '⚠'} ${p.join(' > ')}`);
          if (!outil) dansLApplication.push(p.join(' > '));
        });
      });

      verifier('chaque paquet signalé est retrouvé dans le verrou',
        introuvables.length === 0,
        `${introuvables.join(', ')} : sans chemin, rien ne dit s’il part sur `
        + 'le téléphone. Le contrôle n’a rien vérifié pour lui.');

      verifier('tout passe par les outils, rien par l’application',
        dansLApplication.length === 0,
        `${dansLApplication.join('\n      ')}\n      → CELLE-CI compte : le paquet `
        + 'part sur le téléphone. Chercher une version corrigée, pas un `--force`.');
    }
  }
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Les alertes restent dans les outils qui tournent sur l’ordinateur. '
  + '`npm audit fix --force` : JAMAIS.\n');
