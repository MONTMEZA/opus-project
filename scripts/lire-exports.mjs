/**
 * LIRE LES PAQUETS QUE GITHUB VIENT DE CONSTRUIRE — étape 2c-1, cahier §8.4
 * (K12).
 *
 * POURQUOI LIRE LA SORTIE, ET PAS LE CODE
 * ---------------------------------------
 * `npx expo export` a déjà rendu 0 en affichant une pile d'import (CLAUDE.md,
 * lot de la fiche client : un paquet inventé, et le code de sortie mentait).
 * Le job `verifier` de GitHub construit donc ses paquets en gardant leur
 * journal (`… 2>&1 | tee /tmp/export-<plateforme>.log`, sous `bash -o
 * pipefail`), puis ce script LIT ce que chaque export a écrit et ce qu'il a
 * produit. `verifier-atelier` fige la forme de ce job, cette étape comprise.
 *
 *   node scripts/lire-exports.mjs --dans /tmp
 *
 * Il attend, dans le dossier donné :
 *   export-ios.log      et paquet-ios/        (le paquet publié, en bytecode Hermes)
 *   export-android.log  et paquet-android/
 *   export-web.log      et paquet-web/        (avec ses cartes de sources : `--source-maps`)
 *   export-ios-dev.log  et paquet-ios-dev/    (le paquet de DÉVELOPPEMENT : `--dev`)
 *
 * CE QU'IL VÉRIFIE
 * ----------------
 *   1. pour chacun des quatre : exactement un « Exported: <son dossier> »,
 *      zéro « Import stack », et le paquet produit (`metadata.json`, un seul
 *      fichier de paquet de la bonne nature) ;
 *   2. dans le `.hbc` iOS (le bytecode d'Hermes, reconnu à son en-tête) : les
 *      textes du tampon, cherchés EN UTF-16 — Hermes y range les chaînes qui
 *      ne sont pas en ASCII, et un `grep` ordinaire ne les verrait pas
 *      (CLAUDE.md, 2b-3) —, et `PDFDocument` : `@cantoo/pdf-lib` est bien
 *      DANS le paquet, pas la dépendance facultative laissée vide qu'un
 *      `npm ci` oublié produirait (D29). Une contre-épreuve : une marque
 *      fausse n'y est pas (la recherche n'est pas vraie par construction) ;
 *   3. le paquet du NAVIGATEUR, par ses cartes de sources : ni
 *      `expo-print`, ni `react-native-webview`, ni `@cantoo/pdf-lib` — au
 *      navigateur, `printToFileAsync` EST `window.print()` —, et ce sont
 *      bien `devis-pdf.web.js` et `AfficheurPdf.web.js` qui y sont (le refus
 *      STRUCTUREL des `.web.js` : un import écrit avec `.js` les ferait
 *      sauter, K12) ;
 *   4. le paquet de DÉVELOPPEMENT iOS : ZÉRO `asyncRequire` (CLAUDE.md :
 *      « `await import(...)` interdit dans `src/` », deux incidents). C'est
 *      le paquet de développement qu'il faut lire : celui de production
 *      range tout dans un seul fichier et ne montre rien. MESURÉ le
 *      27/11/2026 sur une copie du dépôt : sans `await import`, 0 ; avec UN
 *      seul `await import(...)` ajouté à `App.js`, **15** — le nombre que
 *      CLAUDE.md avait relevé sur le paquet servi par Metro. Le contrôle
 *      n'est donc pas aveugle ; et il exige que ce paquet soit bien un
 *      paquet de développement (ses modules y portent leur nom).
 *
 * Codes de sortie : 0 juste ; 1 un paquet absent, ou qui ne se lit pas comme
 * il faut ; 2 la machine (le dossier donné n'existe pas).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { TEXTES_DU_TAMPON } = await import(pathToFileURL(path.join(RACINE, 'src/lib/tampon-apercu.js')).href);

const iDans = process.argv.indexOf('--dans');
const DANS = path.resolve(iDans > 0 ? process.argv[iDans + 1] || '' : '/tmp');
if (!existsSync(DANS) || !statSync(DANS).isDirectory()) {
  console.error(`✘ La machine : le dossier « ${DANS} » n’existe pas. Donnez celui des paquets par --dans <dossier>.`);
  process.exit(2);
}

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return true; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${String(detail).slice(0, 1200)}` : ''}`);
  return false;
};

/* Les couleurs du terminal retirées : un journal coloré ne doit pas cacher
   « Exported ». */
const ECHAP = String.fromCharCode(27);
const COULEURS = new RegExp(`${ECHAP}\\[[0-9;]*[A-Za-z]`, 'g');
const sansCouleurs = (s) => s.replace(COULEURS, '');
/* Les fichiers d'un dossier, récursivement (le paquet range ses fichiers
   sous `_expo/static/js/<plateforme>/`). */
const fichiers = (d) => (existsSync(d) ? readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  return e.isDirectory() ? fichiers(p) : [p];
}) : []);

/* Les ORACLES, écrits en toutes lettres (K11) : les marques et la diagonale
   du tampon, les quatre points du numéro en attente, la rangée de la saisie.
   Et chaque texte NON ASCII de `TEXTES_DU_TAMPON`, pour qu'un texte ajouté au
   tampon demain soit cherché lui aussi. */
const ORACLES_UTF16 = [
  'APERÇU — ce document n’est pas remis',
  'Document d’essai — sans valeur',
  'Exemple — données inventées',
  'APERÇU',
  '····',
  'Aperçu du devis (page A4)',
];
const nonAscii = (t) => [...t].some((c) => c.codePointAt(0) > 127);
const CHERCHES = [...new Set([...ORACLES_UTF16, ...Object.values(TEXTES_DU_TAMPON).filter(nonAscii)])];
const FAUSSE = 'APERÇU — ce document est remis';
const MAGIE_HERMES = Buffer.from([0xc6, 0x1f, 0xbc, 0x03, 0xc1, 0x03, 0x19, 0x1f]);

const EXPORTS = [
  { nom: 'iOS', journal: 'export-ios.log', dossier: 'paquet-ios', plateforme: 'ios', extension: '.hbc' },
  { nom: 'Android', journal: 'export-android.log', dossier: 'paquet-android', plateforme: 'android', extension: '.hbc' },
  { nom: 'navigateur', journal: 'export-web.log', dossier: 'paquet-web', plateforme: 'web', extension: '.js' },
  { nom: 'iOS de développement', journal: 'export-ios-dev.log', dossier: 'paquet-ios-dev', plateforme: 'ios', extension: '.js' },
];

console.log(`\nLes paquets de ${DANS}`);
const paquets = {};
for (const e of EXPORTS) {
  console.log(`\n${e.nom} (${e.journal}, ${e.dossier}/)`);
  const journal = path.join(DANS, e.journal);
  const dossier = path.join(DANS, e.dossier);
  if (!verifier('le journal de l’export est là', existsSync(journal), `${journal} : l’étape d’export n’a pas tourné, ou n’a pas gardé son journal`)) continue;
  const lignes = sansCouleurs(readFileSync(journal, 'utf8')).split('\n');
  const exportes = lignes.map((l) => /^Exported: (.+)$/.exec(l.trim())).filter(Boolean);
  verifier('exactement un « Exported », vers SON dossier', exportes.length === 1 && path.resolve(exportes[0][1].trim()) === dossier,
    exportes.map((m) => m[0]).join(' | ') || 'aucun');
  const piles = lignes.filter((l) => /Import stack/.test(l)).length;
  verifier('zéro « Import stack »', piles === 0, `${piles} — un export peut rendre 0 en affichant une pile d’import`);
  const tous = fichiers(dossier);
  const bundles = tous.filter((f) => f.includes(`${path.sep}_expo${path.sep}static${path.sep}js${path.sep}${e.plateforme}${path.sep}`)
    && f.endsWith(e.extension));
  verifier(`le paquet est produit : metadata.json et UN fichier « ${e.extension} » sous _expo/static/js/${e.plateforme}/`,
    tous.some((f) => path.basename(f) === 'metadata.json') && bundles.length === 1, `${tous.length} fichiers, paquets : ${bundles.join(', ') || 'aucun'}`);
  if (bundles.length === 1) paquets[e.dossier] = bundles[0];
}

/* 2. LE PAQUET iOS PUBLIÉ : les textes du tampon, en UTF-16. */
if (paquets['paquet-ios']) {
  console.log('\niOS : ce que le téléphone recevra');
  const b = readFileSync(paquets['paquet-ios']);
  verifier('c’est du bytecode Hermes (son en-tête)', b.subarray(0, 8).equals(MAGIE_HERMES), b.subarray(0, 8).toString('hex'));
  const absents = CHERCHES.filter((t) => !b.includes(Buffer.from(t, 'utf16le')));
  verifier(`les ${CHERCHES.length} textes du tampon et de la rangée y sont, en UTF-16`, absents.length === 0, absents.map((t) => `« ${t} »`).join(' | '));
  verifier(`…et la contre-épreuve : « ${FAUSSE} » n’y est pas`, !b.includes(Buffer.from(FAUSSE, 'utf16le')));
  /* Un nom que SEUL pdf-lib définit (relecture « contrôles » du 27/11) :
     `PDFDocument` est aussi un nom de propriété dans le code d'Opus
     (`tampon-apercu.js`, `fabrication-apercu.js`) — Hermes le range dans le
     paquet même sans pdf-lib, et la vérification passait sur un paquet
     où pdf-lib manquait (mesuré). `PDFHexString` et `PDFRawStream` ne sont
     écrits nulle part dans `src/` : la contre-épreuve ci-dessous le tient. */
  verifier('`@cantoo/pdf-lib` est DANS le paquet (`PDFHexString`, `PDFRawStream`), pas une dépendance facultative laissée vide (D29)',
    ['PDFHexString', 'PDFRawStream'].every((n) => b.includes(Buffer.from(n, 'latin1'))),
    'un `npm ci` oublié ? Sans pdf-lib, l’aperçu dirait « [module] » sur l’iPhone');
  const fichiersDe = (d) => readdirSync(d, { withFileTypes: true })
    .flatMap((x) => (x.isDirectory() ? fichiersDe(path.join(d, x.name)) : [path.join(d, x.name)]));
  const dansSrc = fichiersDe(path.join(RACINE, 'src'))
    .filter((f) => /\.(js|jsx|ts|tsx)$/.test(f) && /PDFHexString|PDFRawStream/.test(readFileSync(f, 'utf8'))).join(', ');
  verifier('…et la contre-épreuve : aucun fichier de `src/` n’écrit ces deux noms (sinon la vérification ne prouverait rien)',
    dansSrc === '', dansSrc);
}

/* 3. LE PAQUET DU NAVIGATEUR, par ses cartes de sources. */
if (paquets['paquet-web']) {
  console.log('\nLe navigateur : ce qui n’y entre pas');
  const carte = `${paquets['paquet-web']}.map`;
  let sources = null;
  try {
    sources = JSON.parse(readFileSync(carte, 'utf8')).sources;
  } catch (err) {
    verifier('la carte de sources se lit (`--source-maps`)', false, `${carte} : ${err.message}`);
  }
  if (Array.isArray(sources)) {
    const js = readFileSync(paquets['paquet-web'], 'utf8');
    verifier(`la carte de sources est celle du paquet (${sources.length} sources)`,
      sources.length >= 100 && js.includes(`sourceMappingURL=`) && js.includes(path.basename(carte)));
    const nom = (s) => String(s).replace(/\\/g, '/');
    const interdits = sources.filter((s) => /\/node_modules\/(expo-print|react-native-webview|@cantoo\/pdf-lib)\//.test(nom(s)));
    verifier('ni `expo-print`, ni `react-native-webview`, ni `@cantoo/pdf-lib`', interdits.length === 0, interdits.slice(0, 5).join(' | '));
    const a = (fin) => sources.some((s) => nom(s).endsWith(fin));
    verifier('ce sont `devis-pdf.web.js` et `AfficheurPdf.web.js` qui y entrent, pas leurs jumeaux du téléphone',
      a('/src/lib/devis-pdf.web.js') && a('/src/components/AfficheurPdf.web.js') && !a('/src/lib/devis-pdf.js') && !a('/src/components/AfficheurPdf.js'),
      sources.filter((s) => /devis-pdf|AfficheurPdf/.test(nom(s))).join(' | '));
  }
}

/* 4. LE PAQUET DE DÉVELOPPEMENT iOS : aucun `asyncRequire`. */
if (paquets['paquet-ios-dev']) {
  console.log('\niOS de développement : aucun chargement différé');
  const js = readFileSync(paquets['paquet-ios-dev'], 'utf8');
  verifier('c’est un paquet de DÉVELOPPEMENT : ses modules portent leur nom', js.includes('"src/lib/devis-pdf.js"')
    && js.includes('"src/lib/etapes-apercu.js"') && js.includes('node_modules/@cantoo/pdf-lib/cjs/index.js'),
    'sans les noms des modules, zéro `asyncRequire` ne prouverait rien');
  const n = (js.match(/asyncRequire/g) || []).length;
  verifier(`zéro « asyncRequire » (${n})`, n === 0, 'un `await import(...)` dans src/ : Metro découpe le paquet et va chercher le morceau au serveur, '
    + 'au moment où la ligne s’exécute (CLAUDE.md)');
}

console.log(echecs
  ? `\n✘ ${echecs} vérification(s) en échec : un paquet ne se lit pas comme il faut.`
  : '\n✔ Les quatre paquets se lisent comme il faut.');
process.exit(echecs ? 1 : 0);
