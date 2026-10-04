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
 *      Tant que tout passe par `@expo/cli` ou `@expo/config-plugins`, il
 *      n'y a rien à faire. Le jour où une alerte apparaît ailleurs —
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

/* LES DEUX PORTES D'ENTRÉE DES OUTILS. Tout ce qui ne passe QUE par l'une
   d'elles tourne sur l'ordinateur, jamais sur le téléphone :
     - `@expo/cli` : le serveur de développement, le surveillant de
       fichiers, la signature du paquet de développement ;
     - `@expo/config-plugins` : la génération d'un projet natif
       (`prebuild`), que ce projet ne fait jamais — il tourne dans Expo Go. */
const OUTILS = ['@expo/cli', '@expo/config-plugins'];

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
      causes.forEach((paquet) => {
        const l = spawnSync('npm', ['ls', paquet, '--json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
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

        chemins.forEach((p) => {
          const outil = p.some((hop) => OUTILS.includes(hop));
          console.log(`      ${outil ? '·' : '⚠'} ${p.join(' > ')}`);
          if (!outil) dansLApplication.push(p.join(' > '));
        });
      });

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
