/**
 * LES POLICES DE L'APERÇU D'UN DEVIS, ENGENDRÉES — étape 2c-1, cahier §4.9.
 *
 * CE QUE FAIT CE SCRIPT
 * ---------------------
 * Il fabrique `src/data/polices-devis.js` : trois polices en SOUS-ENSEMBLE
 * WOFF2 (Inter 400 et 700, Oswald 600), en chaînes base64, avec leur
 * empreinte SHA-256, leur taille, la liste des caractères qu'elles portent,
 * leurs noms (dont la licence) et d'où elles viennent. Le gabarit
 * (`devis-html.js`) les pose chacune comme la seule source de son
 * `@font-face` : l'aperçu n'emprunte ainsi aucune police au téléphone.
 *
 * Les polices d'origine sont celles que l'application emploie déjà, dans
 * `node_modules/@expo-google-fonts/` (licence SIL Open Font License 1.1, sans
 * « Reserved Font Name » : les réduire et les embarquer est permis, à
 * condition de garder l'avis de droit d'auteur et la licence — d'où les noms
 * 0, 13 et 14 gardés dans chaque police, et le texte de la licence en tête du
 * fichier engendré).
 *
 * POURQUOI UN FICHIER ENGENDRÉ, et pourquoi la CI ne le refait pas : la
 * réduction se fait par `pyftsubset` (fontTools, en Python), que GitHub n'a
 * pas. `verifier-apercu` (section D) vérifie dans GitHub ce qui se vérifie
 * sans lui — l'empreinte de chaque police, la liste de ses caractères lue par
 * un VRAI lecteur de WOFF2, ses noms de licence. La régénération elle-même ne
 * se vérifie qu'ici, avec `--verifier`.
 *
 * LES VERSIONS SONT FIXÉES (fontTools 4.69.1, brotli 1.2.1) : deux versions
 * différentes ne rendent pas forcément les mêmes octets, et une police qui
 * change change l'empreinte de chaque page (`apercu-empreintes.json`). Le
 * script refuse une autre version au lieu de fabriquer en silence un fichier
 * différent. Et il fait CHAQUE réduction deux fois : deux sorties
 * différentes, c'est un outil qui glisse une date ou un hasard, et il refuse.
 *
 * Préparer la machine (une fois, dans un dossier hors du dépôt) :
 *   python3 -m venv /chemin/venv
 *   /chemin/venv/bin/pip install fonttools==4.69.1 brotli==1.2.1
 *
 * Puis :
 *   npm run generer-polices-devis -- --pyftsubset /chemin/venv/bin/pyftsubset
 *   npm run generer-polices-devis -- --pyftsubset … --verifier
 *
 * (ou la variable PYFTSUBSET). Le Python qui lit les polices est celui du même
 * dossier que `pyftsubset` (sinon `--python`, ou `python3`).
 *
 * Codes de sortie : 0 juste ; 1 un refus (une sortie qui change d'un passage
 * à l'autre, un nom de licence absent, un fichier différent sous
 * `--verifier`) ; 2 la machine (pyftsubset ou une police d'origine absents,
 * une autre version de fontTools).
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CIBLE = path.join(RACINE, 'src/data/polices-devis.js');
const VERSION_FONTTOOLS = '4.69.1';
const VERSION_BROTLI = '1.2.1';

/* La limite de `devis-html.js` (`LIMITE_POLICE`), écrite ici aussi : le
   gabarit LÈVE au-delà, et ce script doit le savoir avant lui. */
const LIMITE_BASE64 = 1000000;

/* LES CARACTÈRES DE CHAQUE POLICE. Inter porte le latin étendu (un nom tapé :
   « Łukasz », « Ağaoğlu », « Ștefan ») ; Oswald ne reçoit que des libellés
   FIXES (« DEVIS », les titres de section), il n'a donc que le latin de base
   (T16). Une plage ne promet rien : `pyftsubset` ne garde que ce que la
   police a — Oswald n'a ni l'espace fine insécable ni le trait d'union
   insécable. Ce que chaque police PORTE est relu après coup, et c'est cette
   liste-là qui est écrite. */
const PLAGES_INTER = 'U+0020-007E,U+00A0-00FF,U+0100-017F,U+0218-021B,U+2010-2027,U+202F-203A,U+20AC,U+2122,U+2212,'
  + 'U+2264-2265,U+25A1';
const PLAGES_OSWALD = 'U+0020-007E,U+00A0-00FF,U+0152-0153,U+0178,U+2010-2027,U+202F,U+2030-203A,U+20AC,U+2122,U+2212,'
  + 'U+2264-2265';
/* Les fonctions typographiques gardées : le crénage, les ligatures, les
   chiffres tabulaires (les colonnes de montants) et alignés. */
const FONCTIONS = 'kern,liga,tnum,lnum';

const POLICES = [
  { cle: 'inter400', famille: 'Inter', graisse: 400, paquet: 'inter', fichier: '400Regular/Inter_400Regular.ttf', plages: PLAGES_INTER },
  { cle: 'inter700', famille: 'Inter', graisse: 700, paquet: 'inter', fichier: '700Bold/Inter_700Bold.ttf', plages: PLAGES_INTER },
  { cle: 'oswald600', famille: 'Oswald', graisse: 600, paquet: 'oswald', fichier: '600SemiBold/Oswald_600SemiBold.ttf', plages: PLAGES_OSWALD },
];

const args = process.argv.slice(2);
const valeurDe = (nom) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : null);
const VERIFIER = args.includes('--verifier');

const machine = (message) => {
  console.error(`✘ La machine : ${message}`);
  process.exit(2);
};
const refus = (message) => {
  console.error(`✘ ${message}`);
  process.exit(1);
};
const sha256 = (octets) => createHash('sha256').update(octets).digest('hex');

/* ------------------------------------------------------------------ */
/*  Les outils                                                          */
/* ------------------------------------------------------------------ */

const PYFTSUBSET = valeurDe('--pyftsubset') || process.env.PYFTSUBSET || 'pyftsubset';
const voisin = path.isAbsolute(PYFTSUBSET) ? path.join(path.dirname(PYFTSUBSET), 'python') : null;
const PYTHON = valeurDe('--python') || process.env.PYTHON_FONTTOOLS || (voisin && existsSync(voisin) ? voisin : 'python3');

{
  const r = spawnSync(PYFTSUBSET, ['--help'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) {
    machine(`« ${PYFTSUBSET} » ne se lance pas (${r.error ? r.error.message : `code ${r.status}`}). Installez fontTools `
      + `${VERSION_FONTTOOLS} et brotli ${VERSION_BROTLI} (voir l’en-tête de ce script), puis donnez --pyftsubset <chemin>.`);
  }
}
const VERSIONS = (() => {
  const r = spawnSync(PYTHON, ['-I', '-c', 'import json, fontTools, brotli; print(json.dumps([fontTools.version, brotli.__version__]))'],
    { encoding: 'utf8' });
  if (r.error || r.status !== 0) machine(`« ${PYTHON} » ne lit pas fontTools et brotli (${r.error ? r.error.message : r.stderr.trim()}).`);
  const [fonttools, brotli] = JSON.parse(r.stdout);
  if (fonttools !== VERSION_FONTTOOLS || brotli !== VERSION_BROTLI) {
    machine(`fontTools ${fonttools} et brotli ${brotli} : ce script veut fontTools ${VERSION_FONTTOOLS} et brotli `
      + `${VERSION_BROTLI} exactement (une autre version ne rend pas forcément les mêmes octets).`);
  }
  return { fonttools, brotli };
})();

/* LE LECTEUR, par fontTools : ce que la police PORTE (la cmap, sans les
   caractères envoyés au glyphe vide), ses noms (plateforme Windows,
   anglais), son nombre de glyphes et ses fonctions. `verifier-apercu` relit
   la même chose avec son propre lecteur de WOFF2, en JavaScript : deux
   lecteurs indépendants doivent tomber d'accord. */
const LECTEUR_PY = `
import json, sys
from fontTools.ttLib import TTFont
sortie = {}
for f in sys.argv[1:]:
    t = TTFont(f)
    cm = {c: g for c, g in t.getBestCmap().items() if g != '.notdef'}
    noms = {}
    for n in t['name'].names:
        if n.platformID == 3 and n.langID == 0x409:
            noms[str(n.nameID)] = n.toUnicode()
    fonctions = {}
    for tag in ('GSUB', 'GPOS'):
        if tag in t:
            fonctions[tag] = sorted({fr.FeatureTag for fr in t[tag].table.FeatureList.FeatureRecord})
    sortie[f] = {'points': sorted(cm), 'glyphes': t['maxp'].numGlyphs, 'noms': noms, 'fonctions': fonctions,
                 'saveur': t.flavor}
print(json.dumps(sortie))
`;
function lireLesPolices(fichiers) {
  const r = spawnSync(PYTHON, ['-I', '-c', LECTEUR_PY, ...fichiers], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) refus(`la lecture par fontTools a échoué : ${r.error ? r.error.message : r.stderr.trim()}`);
  return JSON.parse(r.stdout);
}

/* « 32, 33, 34, 160 » → « U+0020-0022,U+00A0 » : la liste des caractères,
   écrite en plages. */
function enPlages(points) {
  const tri = [...new Set(points)].sort((a, b) => a - b);
  const plages = [];
  for (const c of tri) {
    const derniere = plages[plages.length - 1];
    if (derniere && c === derniere[1] + 1) derniere[1] = c;
    else plages.push([c, c]);
  }
  const hex = (c) => c.toString(16).toUpperCase().padStart(4, '0');
  return plages.map(([a, b]) => (a === b ? `U+${hex(a)}` : `U+${hex(a)}-${hex(b)}`)).join(',');
}

/* ------------------------------------------------------------------ */
/*  La réduction                                                        */
/* ------------------------------------------------------------------ */

const dossier = mkdtempSync(path.join(tmpdir(), 'polices-devis-'));
const fabriquees = {};
try {
  for (const p of POLICES) {
    const source = path.join(RACINE, 'node_modules/@expo-google-fonts', p.paquet, p.fichier);
    if (!existsSync(source)) machine(`la police d’origine manque : ${path.relative(RACINE, source)} (lancez npm ci).`);
    const paquet = JSON.parse(readFileSync(path.join(RACINE, 'node_modules/@expo-google-fonts', p.paquet, 'package.json'), 'utf8'));
    const passages = [1, 2].map((k) => {
      const sortie = path.join(dossier, `${p.cle}-${k}.woff2`);
      const r = spawnSync(PYFTSUBSET, [source, `--unicodes=${p.plages}`, `--layout-features=${FONCTIONS}`, '--flavor=woff2',
        `--output-file=${sortie}`], { encoding: 'utf8' });
      if (r.error || r.status !== 0) refus(`pyftsubset a échoué sur ${p.cle} : ${r.error ? r.error.message : r.stderr.trim()}`);
      return sortie;
    });
    const [a, b] = passages.map((f) => readFileSync(f));
    if (Buffer.compare(a, b) !== 0) {
      refus(`${p.cle} : deux réductions de la même police rendent des octets différents — l’outil glisse une date ou un hasard.`);
    }
    fabriquees[p.cle] = {
      ...p, octets: a, fichierWoff2: passages[0],
      source: {
        fichier: path.relative(RACINE, source).split(path.sep).join('/'),
        paquet: `@expo-google-fonts/${p.paquet}@${paquet.version}`,
        sha256: sha256(readFileSync(source)),
      },
      licencePaquet: readFileSync(path.join(RACINE, 'node_modules/@expo-google-fonts', p.paquet, 'LICENSE_FONT'), 'utf8'),
    };
  }
  const lus = lireLesPolices(POLICES.map((p) => fabriquees[p.cle].fichierWoff2));
  for (const p of POLICES) {
    const f = fabriquees[p.cle];
    const l = lus[f.fichierWoff2];
    f.lu = l;
    if (l.saveur !== 'woff2') refus(`${p.cle} : la sortie n’est pas un WOFF2 (${l.saveur}).`);
    for (const id of ['0', '1', '6', '13', '14']) {
      if (!l.noms[id]) refus(`${p.cle} : le nom ${id} manque (0 : droit d’auteur, 13 et 14 : la licence) — la licence l’exige.`);
    }
    if (!/SIL Open Font License, Version 1\.1/.test(l.noms['13'])) refus(`${p.cle} : le nom 13 ne cite pas la licence OFL 1.1.`);
    if (l.noms['1'].split(' ')[0] !== p.famille) refus(`${p.cle} : la famille lue (« ${l.noms['1']} ») n’est pas ${p.famille}.`);
    if (l.points.length < 150) refus(`${p.cle} : ${l.points.length} caractères seulement.`);
    f.base64 = f.octets.toString('base64');
    if (f.base64.length > LIMITE_BASE64) refus(`${p.cle} : ${f.base64.length} caractères de base64, au-delà de ${LIMITE_BASE64}.`);
  }
} finally {
  rmSync(dossier, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ */
/*  Le fichier                                                          */
/* ------------------------------------------------------------------ */

/* La licence : le texte d'OFL 1.1 tel que le paquet le donne, sans sa
   première ligne (le droit d'auteur, qui diffère d'une famille à l'autre).
   Les deux paquets doivent porter le MÊME texte. */
const corpsDeLicence = (texte) => texte.replace(/\r\n/g, '\n').split('\n').slice(1).join('\n').trim();
const CORPS = corpsDeLicence(fabriquees.inter400.licencePaquet);
if (corpsDeLicence(fabriquees.oswald600.licencePaquet) !== CORPS) {
  refus('les deux paquets ne portent pas le même texte de licence : à relire à la main avant d’engendrer.');
}
if (CORPS.includes('*/')) refus('le texte de licence fermerait le commentaire d’en-tête.');
const droits = [...new Set(POLICES.map((p) => fabriquees[p.cle].licencePaquet.replace(/\r\n/g, '\n').split('\n')[0].trim()))];
const enCommentaire = (texte) => texte.split('\n').map((l) => (l ? ` * ${l}` : ' *')).join('\n');

const chaine = (v) => JSON.stringify(v);
const objet = (f) => `Object.freeze({\n${POLICES.map((p) => `  ${p.cle}: ${f(fabriquees[p.cle])},`).join('\n')}\n})`;

const contenu = `/**
 * LES POLICES DE L’APERÇU D’UN DEVIS — FICHIER ENGENDRÉ : NE PAS L’ÉCRIRE À LA MAIN.
 *
 * Engendré par \`scripts/generer-polices-devis.mjs\` (fontTools ${VERSIONS.fonttools},
 * brotli ${VERSIONS.brotli}) depuis les polices de \`@expo-google-fonts\`. Trois
 * sous-ensembles WOFF2 en base64, que le gabarit (\`devis-html.js\`) pose chacun
 * comme la SEULE source de son \`@font-face\` (cahier 2c-1, §4.9). Pour les
 * refaire : \`npm run generer-polices-devis\` (voir l’en-tête du script).
 * \`verifier-apercu\` (D) vérifie leur empreinte, la liste de leurs caractères
 * lue par un lecteur de WOFF2 et leurs noms de licence.
 *
 * JAMAIS IMPORTÉ EN HAUT D’UN FICHIER (§4.9, T17) : Metro n’a pas
 * \`inlineRequires\`, un \`import\` du haut s’exécuterait au démarrage d’Opus.
 * Ces ${Math.round(POLICES.reduce((s, p) => s + fabriquees[p.cle].base64.length, 0) / 1000)} Ko de chaînes ne se chargent qu’au geste « Aperçu du devis »,
 * par un \`require\` écrit dans la fabrication.
 *
 * LA LICENCE. Ces polices sont des versions réduites (des sous-ensembles)
 * d’Inter et d’Oswald, distribuées sous la SIL Open Font License 1.1, sans
 * « Reserved Font Name ». Chaque police garde ses noms 0 (droit d’auteur), 13
 * et 14 (la licence et son adresse). Le texte de la licence suit, tel que les
 * paquets le donnent.
 *
${enCommentaire(droits.join('\n'))}
 *
${enCommentaire(CORPS)}
 */

/** Les polices, en base64 : les clés que \`devisHtml(document, polices)\` attend. */
export const POLICES_DEVIS = ${objet((f) => chaine(f.base64))};

/** L’empreinte SHA-256 des octets du WOFF2 de chaque police. */
export const EMPREINTES_POLICES = ${objet((f) => chaine(sha256(f.octets)))};

/** La taille du WOFF2, en octets. */
export const TAILLES_POLICES = ${objet((f) => String(f.octets.length))};

/** Les caractères que chaque police PORTE (sa cmap, relue après la réduction). */
export const POINTS_POLICES = ${objet((f) => chaine(enPlages(f.lu.points)))};

/** Les noms que chaque police garde : famille, nom PostScript (celui qu’un PDF
 *  écrit), version, droit d’auteur et licence. */
export const NOMS_POLICES = ${objet((f) => `Object.freeze(${chaine({
    famille: f.lu.noms['1'], postscript: f.lu.noms['6'], version: f.lu.noms['5'] || null, droitDAuteur: f.lu.noms['0'],
    licence: f.lu.noms['13'], adresseDeLaLicence: f.lu.noms['14'],
  })})`)};

/** D’où viennent ces polices, et comment elles ont été réduites. */
export const ORIGINE_POLICES = Object.freeze(${chaine({
    fonttools: VERSIONS.fonttools, brotli: VERSIONS.brotli, fonctions: FONCTIONS,
    plages: { inter: PLAGES_INTER, oswald: PLAGES_OSWALD },
    sources: Object.fromEntries(POLICES.map((p) => [p.cle, fabriquees[p.cle].source])),
  })});
`;

const RELATIF = path.relative(RACINE, CIBLE);
if (VERIFIER) {
  const actuel = existsSync(CIBLE) ? readFileSync(CIBLE, 'utf8') : null;
  if (actuel !== contenu) {
    refus(`${RELATIF} n’est pas ce que ce script engendre aujourd’hui${actuel == null ? ' (il manque)' : ''} : `
      + 'relancez-le sans --verifier, et relisez le diff.');
  }
  console.log(`✔ ${RELATIF} est exactement ce que ce script engendre (fontTools ${VERSIONS.fonttools}, brotli ${VERSIONS.brotli}).`);
  process.exit(0);
}
writeFileSync(CIBLE, contenu);
for (const p of POLICES) {
  const f = fabriquees[p.cle];
  console.log(`  ${p.cle} : ${f.octets.length} octets de WOFF2, ${f.base64.length} de base64, ${f.lu.glyphes} glyphes, `
    + `${f.lu.points.length} caractères — ${sha256(f.octets).slice(0, 16)}…`);
}
console.log(`✔ ${RELATIF} écrit. Puis : npm run verifier-apercu (D), et, si les empreintes changent, `
  + 'npm run verifier-apercu -- --figer.');
