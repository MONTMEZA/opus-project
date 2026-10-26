/**
 * LA BASE DE POSTES — lot P du module devis (23/10/2026).
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Le propriétaire veut qu'un artisan retrouve SES postes — sa phrase, son
 * prix de référence — et qu'Opus reconnaisse une même phrase écrite de
 * plusieurs façons : « l'artisan pour le même travail a par exemple rajouté
 * un s ; il ne faut pas qu'il y ait trop de propositions » (23/10). Ce qui
 * décide qu'une phrase est « la même » est la CLÉ DE RAPPROCHEMENT, écrite
 * deux fois : dans le téléphone (`src/lib/rapprochement.js`) et dans la
 * base (`public.cle_de_rapprochement`, ENGENDRÉE depuis le miroir par
 * `npm run generer-rapprochement`). Si les deux divergent, rien ne lève
 * d'erreur : le téléphone dit « nouveau poste », la base refuse — ou
 * l'inverse, et l'artisan a deux postes pour un.
 *
 * Il se construit par parties, une par étape du lot (cahier §6.1, §8.2).
 * AUJOURD'HUI : la partie A, LA CLÉ (étape 1) puis LE CALCUL DES POSTES
 * (étape 3) — `src/lib/postes.js` et la mémoire de `devis.js` FAITS
 * TOURNER sur les 51 cas du cahier (§3.3), le balayage de tous les débuts
 * de mots et son témoin (« Pos » rend exactement trois propositions), les
 * dates dans trois fuseaux ; B, LE SCHÉMA — la section 50 lue comme des
 * propriétés, sa fonction de la clé égale, OCTET POUR OCTET, à ce que rend
 * le générateur, et ses contraintes et son plafond égaux à
 * `CONTRAINTES_POSTE` et `POSTES_MAX` — et C, L'ESSAI — ce que
 * `supabase/essais-section-50.sql` doit contenir (étape 2) ; D, L'API ET SES
 * ERREURS — les quatre fonctions de `api.js` lues (deux fonctions nommées,
 * sous condition, une requête à la fois, jamais d'upsert, le nom de la
 * table nulle part ailleurs), leurs traductions FAITES TOURNER, les phrases
 * d'`erreurs.js` comparées à la base — et G, LA DÉMONSTRATION — la base de
 * postes de `devis-demo.js` faite tourner comme la vraie (ses refus, ses
 * huit postes, les trois lignes de « Sol du séjour », et la COUVERTURE de
 * chaque état de la base) (étape 4) ; E, LES ÉCRANS — la référence
 * au-dessus du prix et le bloc dessous, au style d'une phrase discrète,
 * l'appui sur une proposition qui ne vide jamais un prix tapé, les deux
 * feuilles dans leurs fichiers (jamais l'une dans l'autre, un seul état de
 * feuille dans la saisie), la page, les deux portes, et ce que les écrans
 * affichent en morceaux FAIT TOURNER ; F, QUI LIT, QUI ÉCRIT — chaque
 * colonne de `base_postes`, lue dans le schéma, a un écrivain et un lecteur
 * (étape 5).
 *
 * LA CLÉ ENTRE PAR QUATRE PREUVES, DE QUATRE NATURES (cahier §3.0.5) — et il
 * faut les quatre, c'est mesuré :
 *   1. LA BONNE CHOSE : les cas de `supabase/cas-rapprochement.json`, aux
 *      attendus ÉCRITS À LA MAIN (pas par une implémentation), et les paires
 *      qui doivent rester distinctes ;
 *   2. LA MÊME CHOSE, PARTOUT : une EMPREINTE de la clé sur chaque point de
 *      code d'Unicode, égale à celle que PostgreSQL rend (rangée dans le même
 *      fichier). Elle attrape ce qu'aucun cas ne nomme : un `normalize('NFC')`
 *      ajouté au miroir ne change AUCUN des cas, et change l'empreinte ;
 *   3. LA MÊME TABLE : la fonction SQL ÉVALUÉE — ses littéraux et ses
 *      `chr(n)`, rien d'autre n'est admis — et comparée caractère par
 *      caractère aux chaînes du miroir ;
 *   4. L'INVARIANT : la base applique la table en deux passes, JavaScript en
 *      une ; les deux ne disent la même chose que si un remplacement ne
 *      rapporte que a à z, 0 à 9 et l'espace. « ≤ » → « <= » rendait
 *      « a<=b » d'un côté et « a< b » de l'autre, et aucun cas ne le voyait.
 * Puis ce qui ne se voit pas dans un résultat : la garde de longueur, le
 * pluriel (un LITTÉRAL, jamais exporté), ce que le miroir n'a pas le droit
 * d'appeler (`normalize`, `toLowerCase`, `Intl`…), l'ASCII pur du fichier,
 * et qu'aucun écran ne l'importe.
 *
 * CE QU'IL NE PEUT PAS DIRE : il ne joue aucun SQL. Que PostgreSQL rende
 * vraiment la même clé, c'est `supabase/essais-section-50.sql` (cas 18 et
 * 18 bis) qui le dit, sur un vrai PostgreSQL, à la main. Et qu'une
 * politique filtre, qu'un droit soit bien retiré, qu'un étranger ne prenne
 * pas le verrou de A : c'est l'essai encore, qui interroge le CATALOGUE de
 * la base rejouée — B lit du texte, et un texte peut prendre des formes
 * qu'aucun motif ne prévoit (`npm run verifier` ne joue aucun essai SQL).
 *
 * Il retire les commentaires avant de lire un texte, par un lecteur qui
 * respecte les chaînes et les expressions : l'en-tête du miroir NOMME
 * `normalize` et `toLowerCase` pour dire pourquoi il ne les appelle pas, et
 * un contrôle de ce projet a déjà accusé onze fois la documentation qui
 * expliquait le défaut.
 *
 * Et il lit son CODE DE SORTIE : un contrôle qui plante ne vérifie rien.
 *
 *   npm run verifier-postes
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ICI = fileURLToPath(import.meta.url);
const RACINE = path.resolve(path.dirname(ICI), '..');
const lire = (f) => readFileSync(path.join(RACINE, f), 'utf8');

/* La barre oblique inverse n'est jamais écrite dans ce fichier : elle est
   FABRIQUÉE. Le miroir et la fonction SQL n'en contiennent aucune qui ne
   soit voulue, et l'outil d'écriture des sessions de travail change
   certaines séquences qui en commencent une. */
const BARRE = String.fromCharCode(92);
const LETTRES = 'abcdefghijklmnopqrstuvwxyz';
const SURS = new Set([...LETTRES, ...'0123456789', ' ']);
const nomCar = (c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* ================================================================== */
/*  LES LECTEURS                                                        */
/* ================================================================== */

/* Le JavaScript SANS SES COMMENTAIRES, et ses expressions régulières
   littérales relevées au passage. Le même lecteur que `verifier-devis` :
   il respecte les chaînes ('…', "…", `…` et leurs ${…}) et les expressions,
   où un `//` n'est pas un commentaire. */
const AVANT_REGEX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^', '']);
const MOTS_AVANT_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'void', 'delete', 'new', 'throw', 'else', 'do', 'await', 'yield']);
function lireJs(c) {
  const t = c.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const regex = [];
  let s = '';
  let i = 0;
  const gabarits = [];
  let precedent = '';
  let mot = '';
  let blanc = false;
  const code = (ch) => {
    s += ch;
    if (/\s/.test(ch)) { blanc = true; return; }
    if (/[\w$]/.test(ch)) { mot = /[\w$]/.test(precedent) && !blanc ? mot + ch : ch; } else mot = '';
    precedent = ch;
    blanc = false;
  };
  const chaine = (q) => {
    let j = i + 1;
    while (j < t.length && t[j] !== q) { if (t[j] === BARRE) j += 1; j += 1; }
    s += t.slice(i, j + 1); precedent = q; mot = ''; i = j + 1;
  };
  const gabarit = () => {
    let j = i;
    while (j < t.length && t[j] !== '`' && !(t[j] === '$' && t[j + 1] === '{')) { if (t[j] === BARRE) j += 1; j += 1; }
    if (t[j] === '`') { s += t.slice(i, j + 1); precedent = '`'; mot = ''; i = j + 1; return; }
    s += t.slice(i, j + 2); gabarits.push(0); precedent = '{'; mot = ''; i = j + 2;
  };
  while (i < t.length) {
    const ch = t[i];
    const su = t[i + 1];
    if (ch === '/' && su === '/') { while (i < t.length && t[i] !== '\n') i += 1; continue; }
    if (ch === '/' && su === '*') { const f = t.indexOf('*/', i + 2); i = f < 0 ? t.length : f + 2; s += ' '; continue; }
    if (ch === "'" || ch === '"') { chaine(ch); continue; }
    if (ch === '`') { s += '`'; i += 1; gabarit(); continue; }
    if (ch === '/' && (AVANT_REGEX.has(precedent) || MOTS_AVANT_REGEX.has(mot))) {
      let j = i + 1;
      let classe = false;
      while (j < t.length && t[j] !== '\n') {
        if (t[j] === BARRE) { j += 2; continue; }
        if (t[j] === '[') classe = true;
        else if (t[j] === ']') classe = false;
        else if (t[j] === '/' && !classe) break;
        j += 1;
      }
      j += 1;
      while (j < t.length && /[a-z]/i.test(t[j])) j += 1;
      regex.push(t.slice(i, j));
      s += t.slice(i, j); precedent = '/'; mot = ''; i = j;
      continue;
    }
    if (gabarits.length && ch === '{') gabarits[gabarits.length - 1] += 1;
    if (gabarits.length && ch === '}') {
      if (gabarits[gabarits.length - 1] === 0) { gabarits.pop(); s += '}'; i += 1; gabarit(); continue; }
      gabarits[gabarits.length - 1] -= 1;
    }
    code(ch);
    i += 1;
  }
  return { code: s, regex };
}
const sansCommentairesJs = (c) => lireJs(c).code;

/* LES MODULES qu'un fichier charge, sous toutes leurs formes (`import … from`,
   `export … from`, l'import NU `import './x.js';`), et le nombre
   d'instructions qui chargent quelque chose : les deux doivent s'accorder,
   pour qu'aucune forme inconnue ne passe en silence. */
function modulesDe(src) {
  return [...src.matchAll(/\b(?:import|export)\b[^'"`;()]*?\bfrom\s*(['"])([^'"]+)\1|\bimport\s*(['"])([^'"]+)\3/g)]
    .map((m) => m[2] || m[4]);
}
const instructionsDImport = (src) => (src.match(/^\s*import\b(?!\s*\()/gm) || []).length
  + (src.match(/\bexport\s+(?:\*|\{[^}]*\})\s*from\b/g) || []).length;
const chargeQuelqueChose = (src) => modulesDe(src).length > 0 || instructionsDImport(src) > 0
  || /\bimport\s*\(|\brequire\s*\(/.test(src);

/* LA FONCTION SQL, ÉVALUÉE. On découpe son corps en jetons (chaînes '…' à
   apostrophe doublée, nombres, mots, ponctuation), puis on suit la forme
   qu'elle doit avoir, de la garde au pluriel. Chaque argument est une
   concaténation de littéraux '…' et de `chr(n)` — RIEN D'AUTRE n'est admis :
   une chaîne `E'…'`, une barre oblique inverse, une fonction de plus font
   échouer la lecture, et donc le contrôle. Ce qu'on rend est ce que
   PostgreSQL calculerait de ces arguments, caractère par caractère. */
class LectureSql extends Error {}
function jetonsSql(t) {
  const j = [];
  let i = 0;
  while (i < t.length) {
    const c = t[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === "'") {
      let k = i + 1;
      let v = '';
      for (;;) {
        if (k >= t.length) throw new LectureSql('une chaîne n’est pas refermée');
        if (t[k] === "'" && t[k + 1] === "'") { v += "'"; k += 2; continue; }
        if (t[k] === "'") break;
        v += t[k];
        k += 1;
      }
      if (v.includes(BARRE)) throw new LectureSql(`une barre oblique inverse dans le littéral '${v.slice(0, 20)}…'`);
      j.push({ t: 'chaine', v });
      i = k + 1;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let k = i;
      while (k < t.length && /[0-9]/.test(t[k])) k += 1;
      j.push({ t: 'nombre', v: Number(t.slice(i, k)) });
      i = k;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let k = i;
      while (k < t.length && /[\w]/.test(t[k])) k += 1;
      j.push({ t: 'mot', v: t.slice(i, k) });
      i = k;
      continue;
    }
    if (c === '|' && t[i + 1] === '|') { j.push({ t: 'op', v: '||' }); i += 2; continue; }
    if ('(),>;$.='.includes(c)) { j.push({ t: 'op', v: c }); i += 1; continue; }
    throw new LectureSql(`un caractère inattendu « ${c} » (${nomCar(c)})`);
  }
  return j;
}
function evaluerFonctionSql(texte) {
  const debut = texte.indexOf('as $$');
  const fin = texte.lastIndexOf('$$;');
  if (debut < 0 || fin <= debut) throw new LectureSql('le corps « as $$ … $$; » est introuvable');
  const jt = jetonsSql(texte.slice(debut + 5, fin));
  let p = 0;
  const voir = () => jt[p] || { t: 'fin', v: '' };
  const attendre = (...valeurs) => {
    for (const v of valeurs) {
      const x = voir();
      if (x.v !== v) throw new LectureSql(`« ${v} » attendu, « ${x.v} » trouvé (jeton ${p})`);
      p += 1;
    }
  };
  const nombre = () => {
    const x = voir();
    if (x.t !== 'nombre') throw new LectureSql(`un nombre attendu, « ${x.v} » trouvé (jeton ${p})`);
    p += 1;
    return x.v;
  };
  const terme = () => {
    const x = voir();
    if (x.t === 'chaine') { p += 1; return x.v; }
    if (x.t === 'mot' && x.v === 'chr') {
      p += 1;
      attendre('(');
      const n = nombre();
      attendre(')');
      if (n < 1 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) throw new LectureSql(`chr(${n}) n’est pas un caractère`);
      return String.fromCodePoint(n);
    }
    /* Un GROUPE entre parenthèses — la chaîne du `translate` s'écrit par
       seize termes parenthésés, sans quoi PostgreSQL dépasse sa pile en la
       préparant (24/10/2026). Ce qu'il contient obéit à la même règle. */
    if (x.v === '(') {
      p += 1;
      const s = concat();
      attendre(')');
      return s;
    }
    throw new LectureSql(`un littéral '…', un chr(n) ou un groupe ( … ) attendu, « ${x.v} » trouvé (jeton ${p})`);
  };
  function concat() {
    let s = terme();
    while (voir().v === '||') { p += 1; s += terme(); }
    return s;
  }
  attendre('select', 'case', 'when', 'char_length', '(', 'p_phrase', ')', '>');
  const garde = nombre();
  /* LA TABLE D'ABORD, LES REMPLACEMENTS ENSUITE : `replace(…(translate(
     p_phrase, <de>, <vers>), <c>, <mot>)…)`. L'ordre d'avant (les
     remplacements, puis la table sur leur résultat) n'est plus lu : il
     faisait travailler `translate` sur une phrase allongée dix fois. */
  attendre('then', 'null', 'else', 'regexp_replace', '(', 'btrim', '(', 'regexp_replace', '(');
  let k = 0;
  while (voir().v === 'replace') { attendre('replace', '('); k += 1; }
  attendre('translate', '(', 'p_phrase', ',');
  const de = concat();
  attendre(',');
  const vers = concat();
  attendre(')');
  const multiples = [];
  for (let n = 0; n < k; n += 1) {
    attendre(',');
    const c = concat();
    attendre(',');
    const v = concat();
    attendre(')');
    multiples.push([c, v]);
  }
  attendre(',');
  const blancs = concat();
  attendre(',');
  const uneEspace = concat();
  attendre(',');
  const drapeauBlancs = concat();
  attendre(')', ',');
  const bord = concat();
  attendre(')', ',');
  const motif = concat();
  attendre(',');
  const remplacement = concat();
  attendre(',');
  const drapeau = concat();
  attendre(')', 'end');
  if (p !== jt.length) throw new LectureSql(`du texte après « end » (jeton ${p})`);
  return { garde, multiples, de, vers, blancs, uneEspace, drapeauBlancs, bord, motif, remplacement, drapeau };
}

/* Où deux chaînes divergent, dit en points de code. */
function premiereDifference(a, b) {
  const x = [...a];
  const y = [...b];
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    if (x[i] !== y[i]) {
      return `au caractère ${i} : ${x[i] === undefined ? 'rien' : nomCar(x[i])} contre ${y[i] === undefined ? 'rien' : nomCar(y[i])}`;
    }
  }
  return '';
}

/* La table SQL évaluée, comparée au miroir. Rend la liste des écarts. */
function ecartsDeTable(ev, R) {
  const e = [];
  if (ev.de !== R.TABLE_DE) e.push(`la chaîne de départ du translate() diffère de TABLE_DE ${premiereDifference(ev.de, R.TABLE_DE)}`);
  if (ev.vers !== R.TABLE_VERS) e.push(`la chaîne d’arrivée du translate() diffère de TABLE_VERS ${premiereDifference(ev.vers, R.TABLE_VERS)}`);
  const sql = new Map();
  for (const [c, v] of ev.multiples) {
    if ([...c].length !== 1) e.push(`un replace() remplace « ${c} », qui n’est pas UN caractère`);
    if (sql.has(c)) e.push(`${nomCar(c)} est remplacé deux fois côté SQL`);
    sql.set(c, v);
  }
  const js = new Map(R.TABLE_MULTIPLES);
  if (sql.size !== js.size) e.push(`${sql.size} remplacements côté SQL, ${js.size} dans TABLE_MULTIPLES`);
  for (const [c, v] of js) {
    if (!sql.has(c)) e.push(`${nomCar(c)} → « ${v} » manque côté SQL`);
    else if (sql.get(c) !== v) e.push(`${nomCar(c)} → « ${sql.get(c)} » côté SQL, « ${v} » dans le miroir`);
  }
  for (const c of sql.keys()) if (!js.has(c)) e.push(`${nomCar(c)} est remplacé côté SQL, pas dans le miroir`);
  return e;
}

/* L'empreinte : pour chaque point de code c (moitiés de paire exceptées), la
   clé de la sonde c + 'a' + c + 'bs ' + c + 'X' + c, une ligne « n:clé »,
   et le md5 de l'ensemble. La MÊME sonde que celle de l'essai 50. */
function empreinte(cle, de, a) {
  const h = createHash('md5');
  let n = 0;
  let premier = true;
  for (let cp = de; cp <= a; cp += 1) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const c = String.fromCodePoint(cp);
    h.update(`${premier ? '' : '\n'}${cp}:${cle(`${c}a${c}bs ${c}X${c}`)}`, 'utf8');
    premier = false;
    n += 1;
  }
  return { points: n, md5: h.digest('hex') };
}

/* ================================================================== */
/*  CE QUI S'OUVRE                                                      */
/* ================================================================== */
let R; let CAS; let G; let D; let P; let DEMO; let ERR; let EM; let CT;
try {
  R = await import('../src/lib/rapprochement.js');
  G = await import('./generer-rapprochement.mjs');
  CAS = JSON.parse(lire('supabase/cas-rapprochement.json'));
  /* Depuis l'étape 3 du lot, le calcul des postes EXISTE : un `postes.js`
     absent ou qui ne s'ouvre pas est un refus, jamais une comparaison qui
     se tait. */
  D = await import('../src/lib/devis.js');
  P = await import('../src/lib/postes.js');
  DEMO = await import('../src/data/devis-demo.js');
  /* Depuis l'étape 4 : les phrases des refus (D) et la date du régime de
     démonstration (G). Deux fichiers purs, eux aussi. */
  ERR = await import('../src/lib/erreurs.js');
  EM = await import('../src/data/emetteur-demo.js');
  /* Depuis l'étape 5 : l'écriture d'un montant, pour recoudre ce que les
     écrans affichent en morceaux (`morceauxDuDetail`). */
  CT = await import('../src/lib/centimes.js');
} catch (e) {
  console.error(`  ✘ le miroir de la clé, son générateur, ses cas, devis.js, postes.js, erreurs.js et la démonstration s’ouvrent dans node\n      ${e && e.stack}`);
  console.error('\n✘ Le contrôle n’a rien pu éprouver : un fichier de calcul qui charge React Native (ou qui casse) '
    + 'ne se vérifie plus. C’est la leçon de `cloudinary-adresses.js`.\n');
  process.exit(1);
}
const cle = R.cleDeRapprochement;

/* LE MODE « --fuseau » : ce même fichier, relancé sous un autre fuseau
   horaire (TZ), écrit les dates d'un poste fixé à 00 h 30 à Paris, et
   s'arrête. Une date d'horodatage se lit à l'heure du TÉLÉPHONE — la leçon
   de la nuit du lot T —, et seul un autre processus change de fuseau. */
if (process.argv.includes('--fuseau')) {
  const quand = '2026-10-13T22:30:00Z';
  const t = Date.parse(quand);
  const d = new Date(t);
  const deux = (n) => String(n).padStart(2, '0');
  const local = `${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()}`;
  const poste = { id: 'z', designation: 'Chape sèche avant carrelage collé', unite: 'm2', fournitureNonComprise: false,
    mainOeuvre: false, prixReferenceCentimes: 4500, prixFixeLe: quand, createdAt: quand, modifieLe: quand, devisOrigineId: null };
  const ligne = { id: 'l', type: 'poste', designation: poste.designation, unite: 'm2', prixUnitaireCentimes: 5200 };
  const s = P.suggestionsPourLaFrappe({ postes: [poste], memoire: [], texte: 'chape' })[0];
  const essais = [
    ['phraseReference', P.phraseReference(P.referenceDuPoste(ligne, [poste])), `fixé le ${local}`],
    ['detailDeSuggestion', s && P.detailDeSuggestion(s), `réf. du ${local}`],
    ['libelleDeSuggestion', s && P.libelleDeSuggestion(s), `fixé le ${local}`],
    ['libelleOrigine', P.libelleOrigine(poste), `Ajouté le ${local}`],
  ];
  const faux = essais.filter(([, obtenu, attendu]) => !String(obtenu || '').includes(attendu)).map(([nom, obtenu]) => `${nom} : ${obtenu}`);
  process.stdout.write(JSON.stringify({ tz: process.env.TZ, date: local, cas: essais.length, faux }));
  process.exit(0);
}

/* ================================================================== */
/*  A. LA CLÉ DE RAPPROCHEMENT                                          */
/* ================================================================== */
console.log('\nA. LA CLÉ DE RAPPROCHEMENT — les cas, l’empreinte, la table SQL évaluée, l’invariant, la garde, le pluriel');

/* ---- (1) les cas écrits à la main, et les paires distinctes ---------- */
{
  const cas = Array.isArray(CAS.cas) ? CAS.cas : [];
  const ids = new Set(cas.map((c) => c.id));
  verifier(`supabase/cas-rapprochement.json porte ses ${CAS.nombre} cas (au moins 188, chacun son identifiant)`,
    cas.length >= 188 && cas.length === CAS.nombre && ids.size === cas.length,
    `${cas.length} cas lus, « nombre » vaut ${CAS.nombre}, ${ids.size} identifiants distincts — un cas retiré ne doit pas passer en silence`);
  const ecarts = cas.filter((c) => cle(c.phrase) !== c.attendu);
  verifier(`les ${cas.length} cas rendent EXACTEMENT leur attendu (écrit à la main)`, ecarts.length === 0,
    ecarts.slice(0, 6).map((c) => `${c.id} : ${JSON.stringify(String(c.phrase).slice(0, 40))} → ${JSON.stringify(cle(c.phrase))}, attendu ${JSON.stringify(c.attendu)}`).join('\n      '));
  const distincts = Array.isArray(CAS.distincts) ? CAS.distincts : [];
  const confondues = distincts.filter((d) => cle(d.a) === cle(d.b));
  verifier(`les ${distincts.length} paires qui doivent rester DISTINCTES le restent (au moins 22)`,
    distincts.length >= 22 && confondues.length === 0,
    confondues.length ? `confondues : ${confondues.map((d) => `« ${d.a} » / « ${d.b} »`).join(' ; ')}` : `${distincts.length} paires seulement`);
  verifier('null rend null (la fonction SQL est `strict`)', cle(null) === null && R.aPlat(null) === null && cle(undefined) === null);
  const fois = [1, 2, 3].map(() => cle('Pose des plinthes collées'));
  verifier('la même phrase rend trois fois la même clé : l’expression /g ne garde aucun état d’un appel à l’autre',
    fois.every((x) => x === fois[0]), fois.map((x) => JSON.stringify(x)).join(' puis '));
}

/* ---- (2) les deux empreintes ----------------------------------------- */
{
  const E = CAS.empreintes || {};
  for (const [nom, libelle] of [['plan_de_base', 'du plan de base'], ['tout_unicode', 'de tout Unicode']]) {
    const attendu = E[nom] || {};
    const t0 = Date.now();
    const obtenu = empreinte(cle, attendu.de, attendu.a);
    verifier(`l’empreinte ${libelle} (${obtenu.points} points de code, ${Date.now() - t0} ms) est celle que PostgreSQL rend`,
      Number.isInteger(attendu.de) && Number.isInteger(attendu.a) && obtenu.points === attendu.points && obtenu.md5 === attendu.md5,
      `obtenu ${obtenu.points} / ${obtenu.md5}, attendu ${attendu.points} / ${attendu.md5} — la clé ne dit plus la même chose `
      + 'que la fonction SQL sur au moins un caractère (si la table a changé VOLONTAIREMENT : recalculer les deux empreintes, '
      + 'des deux côtés, cahier §3.0.8)');
  }
}

/* ---- (3) la table SQL, évaluée --------------------------------------- */
{
  verifier('le miroir exporte sa table : TABLE_DE et TABLE_VERS (chaînes), TABLE_MULTIPLES (paires)',
    typeof R.TABLE_DE === 'string' && typeof R.TABLE_VERS === 'string' && Array.isArray(R.TABLE_MULTIPLES)
      && R.TABLE_MULTIPLES.every((x) => Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && typeof x[1] === 'string'));
  const de = [...R.TABLE_DE];
  const vers = [...R.TABLE_VERS];
  console.log(`      la table : ${de.length} caractères dans le translate() (${vers.length} changés, ${de.length - vers.length} supprimés) `
    + `et ${R.TABLE_MULTIPLES.length} remplacements par une chaîne, ${de.length + R.TABLE_MULTIPLES.length} en tout`);

  /* Les textes SQL à évaluer : TOUJOURS celui que le générateur rend (il
     prouve le générateur) ; et, dès que la section 50 existe dans
     `schema.sql`, celui qui y est rangé entre ses repères (il prouve ce qui
     partira dans la base). Tant que la section 50 n'est pas écrite (étape 1
     du lot), il n'y a rien d'autre à lire — mais dès qu'elle l'est, ses
     repères deviennent OBLIGATOIRES : les retirer ne fait pas taire ce
     contrôle, il rougit. */
  const textes = [];
  try {
    textes.push(['la fonction que rend `generer-rapprochement`', G.engendrerFonction(R)]);
  } catch (e) {
    verifier('le générateur engendre la fonction depuis le miroir', false, e.message);
  }
  const schema = lire('supabase/schema.sql');
  const aLaSection = /^--  50\. /m.test(schema) || schema.includes(G.DEBUT) || schema.includes(G.FIN);
  if (aLaSection) {
    const i = schema.indexOf(G.DEBUT);
    const j = schema.indexOf(G.FIN);
    const uneFois = (r) => schema.indexOf(r) === schema.lastIndexOf(r);
    const ok = i >= 0 && j > i && uneFois(G.DEBUT) && uneFois(G.FIN);
    verifier('la section 50 de schema.sql porte les repères de la fonction engendrée, une fois chacun', ok,
      `il faut, autour de public.cle_de_rapprochement :\n      ${G.DEBUT}\n      ${G.FIN}`);
    if (ok) textes.push(['la fonction rangée dans schema.sql', schema.slice(i + G.DEBUT.length + 1, j)]);
  } else {
    console.log('      (la section 50 n’est pas encore dans schema.sql : seule la fonction engendrée est évaluée)');
  }
  const attenduMotif = String(R.PLURIEL_SOURCE).split('[a-z]').join(`[${LETTRES}]`);
  for (const [nom, texte] of textes) {
    let ev = null;
    try {
      ev = evaluerFonctionSql(texte);
    } catch (e) {
      verifier(`${nom} se lit : littéraux '…' et chr(n), rien d’autre`, false,
        `${e instanceof LectureSql ? e.message : e && e.stack} — une autre forme n’est pas évaluée, donc refusée`);
      continue;
    }
    const ecarts = ecartsDeTable(ev, R);
    verifier(`${nom} : sa table, ÉVALUÉE, est celle du miroir, caractère par caractère `
      + `(${[...ev.de].length} + ${ev.multiples.length})`, ecarts.length === 0, ecarts.slice(0, 6).join('\n      '));
    verifier(`${nom} : la garde vaut LONGUEUR_MAX (${ev.garde}), les blancs se réduisent et se rognent sur l’espace seule`,
      ev.garde === R.LONGUEUR_MAX && ev.blancs === ' {2,}' && ev.uneEspace === ' ' && ev.drapeauBlancs === 'g' && ev.bord === ' ',
      `garde ${ev.garde}, blancs ${JSON.stringify([ev.blancs, ev.uneEspace, ev.drapeauBlancs, ev.bord])}`);
    verifier(`${nom} : le motif du pluriel est PLURIEL_SOURCE, la classe des lettres ÉNUMÉRÉE, et son remplacement `
      + 'chr(92) || \'1\' || chr(92) || \'2\'',
      ev.motif === attenduMotif && ev.remplacement === `${BARRE}1${BARRE}2` && ev.drapeau === 'g'
        && ev.motif.includes('(?!(?:bas)(?: |$))') && [...ev.motif].every((c) => c.codePointAt(0) < 128),
      `motif ${JSON.stringify(ev.motif)}, attendu ${JSON.stringify(attenduMotif)} ; remplacement ${JSON.stringify(ev.remplacement)}`);
    verifier(`${nom} : aucune barre oblique inverse écrite, aucun caractère hors de l’ASCII`,
      !texte.includes(BARRE) && [...texte].every((c) => c.codePointAt(0) < 128));
    /* LA PROFONDEUR (24/10/2026) : PostgreSQL prépare une concaténation
       `a || b || c …` comme un arbre aussi profond qu'elle est longue, et le
       parcourt récursivement. Mesuré sur PostgreSQL 16 : 4 000 termes d'un
       seul tenant passent, 4 500 tombent sur « stack depth limit exceeded ».
       La table compte 5 093 caractères : écrite d'un seul tenant, le schéma
       ne se rejouait plus. On compte, à chaque niveau de parenthèses, la plus
       longue suite de `||` — sans les chaînes ; la première table en avait
       968, qui passaient. */
    const plusLongue = (() => {
      const sans = texte.replace(/'(?:[^']|'')*'/g, "''");
      const pile = [0];
      let max = 0;
      for (let i = 0; i < sans.length; i += 1) {
        const c = sans[i];
        if (c === '(') pile.push(0);
        else if (c === ')') pile.pop();
        else if (c === ',') pile[pile.length - 1] = 0;
        else if (c === '|' && sans[i + 1] === '|') { pile[pile.length - 1] += 1; max = Math.max(max, pile[pile.length - 1]); i += 1; }
      }
      return max + 1;
    })();
    verifier(`${nom} : aucune concaténation de plus de 1 000 termes d’un seul tenant (la plus longue : ${plusLongue}) — `
      + 'au-delà, PostgreSQL dépasse sa pile en préparant la fonction', plusLongue <= 1000);
  }

  /* L'AUTO-ÉPREUVE du lecteur : sans elle, un lecteur qui ne verrait rien
     passerait au vert. Une lettre changée côté SQL (é → è), une chaîne
     `E'…'` et une barre oblique inverse doivent être vues. */
  if (textes.length) {
    const base = textes[0][1];
    /* Le premier chr(n) hors de l'ASCII devient chr(n + 1) : une lettre
       changée côté SQL, quelle qu'elle soit. */
    const lettre = base.replace(/chr\((\d{3,})\)/, (_, n) => `chr(${Number(n) + 1})`);
    let vu1 = false;
    try { vu1 = ecartsDeTable(evaluerFonctionSql(lettre), R).length > 0; } catch { vu1 = true; }
    let vu2 = false;
    try { evaluerFonctionSql(base.replace("' {2,}'", "E' {2,}'")); } catch (e) { vu2 = e instanceof LectureSql; }
    let vu3 = false;
    try { evaluerFonctionSql(base.replace("' {2,}'", `'${BARRE}s{2,}'`)); } catch (e) { vu3 = e instanceof LectureSql; }
    verifier('le lecteur voit ce qu’il garde : une lettre changée côté SQL, une chaîne E\'…\', une barre oblique inverse',
      lettre !== base && vu1 && vu2 && vu3, `lettre ${vu1}, E'…' ${vu2}, barre ${vu3}`);
  }
}

/* ---- (4) l'invariant de parité ---------------------------------------- */
{
  const de = new Set(R.TABLE_DE);
  const cles = new Set(R.TABLE_MULTIPLES.map(([c]) => c));
  const sortiesHors = R.TABLE_MULTIPLES.filter(([, v]) => ![...v].every((c) => SURS.has(c)));
  verifier('chaque remplacement ne rapporte QUE a à z, 0 à 9 et l’espace (la base applique la table en deux passes)',
    sortiesHors.length === 0, sortiesHors.map(([c, v]) => `${nomCar(c)} → ${JSON.stringify(v)}`).join(' ; '));
  const surs = [...de, ...cles].filter((c) => SURS.has(c));
  verifier('aucune lettre a à z, aucun chiffre ni l’espace dans la table', surs.length === 0,
    `dans la table : ${surs.map(nomCar).join(' ')}`);
  const reprises = R.TABLE_MULTIPLES.filter(([, v]) => [...v].some((c) => de.has(c) || cles.has(c)));
  verifier('aucun caractère rapporté par un remplacement n’est lui-même dans la table', reprises.length === 0,
    reprises.map(([c, v]) => `${nomCar(c)} → ${JSON.stringify(v)}`).join(' ; '));
  const doubles = [...cles].filter((c) => de.has(c));
  verifier('chaque caractère est dans UNE partie de la table : jamais à la fois remplacé et traduit',
    doubles.length === 0 && de.size === [...R.TABLE_DE].length && cles.size === R.TABLE_MULTIPLES.length,
    `en double : ${doubles.map(nomCar).join(' ')}`);
  verifier('la table ne compte ni U+0000 (PostgreSQL ne le porte pas) ni moitié de paire',
    ![...de, ...cles].some((c) => { const n = c.codePointAt(0); return n === 0 || (n >= 0xd800 && n <= 0xdfff); }));
}

/* ---- (4 bis) les invisibles ------------------------------------------ */
/* UNE PROPRIÉTÉ, PAS UNE LISTE (relecture « base », BASE2, 24/10/2026).
   Huit caractères qu'on ne voit pas — U+2800, U+E0100, U+061C, U+180B… —
   faisaient des postes « vides à l'œil » et des doublons non reconnus, et
   aucun contrôle ne le disait : les cas écrits à la main ne nomment que ce
   qu'on a pensé à nommer. Ici, CHAQUE point de code de la propriété Unicode
   `Default_Ignorable_Code_Point` (la classe DI que connaît node — ce
   contrôle peut s'en servir, le miroir non : il ne dépend d'aucune table
   Unicode) doit disparaître de la clé, au milieu d'un mot comme seul. Le
   jour où une version d'Unicode en ajoute un, ce contrôle rougit, et la
   table se complète (par script). */
{
  const di = [];
  const estDI = new RegExp(`^${BARRE}p{Default_Ignorable_Code_Point}$`, 'u');
  for (let cp = 1; cp <= 0x10ffff; cp += 1) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    if (estDI.test(String.fromCodePoint(cp))) di.push(cp);
  }
  const restent = di.filter((cp) => { const c = String.fromCodePoint(cp); return cle(`pla${c}co`) !== 'placo' || cle(c) !== ''; });
  verifier(`chacun des ${di.length} invisibles de la propriété Unicode Default_Ignorable_Code_Point disparaît de la clé — « pla<c>co » `
    + 'rend « placo », et <c> seul une clé VIDE (donc pas de poste, `base_poste_rapprochement_check`)',
  di.length >= 4174 && restent.length === 0,
  `${restent.length} restent, dont ${restent.slice(0, 8).map((cp) => `U+${cp.toString(16).toUpperCase()}`).join(' ')} — `
    + 'les ajouter aux SUPPRIMÉS de la table de src/lib/rapprochement.js (par un script), puis npm run generer-rapprochement');
  const braille = String.fromCodePoint(0x2800);
  verifier('U+2800, le motif braille vide — un blanc qui a la largeur d’une lettre —, est un SÉPARATEUR : « Chape<U+2800>sèche » rend '
    + '« chape seche », et seul une clé vide', cle(`Chape${braille}sèche`) === 'chape seche' && cle(braille) === '',
  JSON.stringify(cle(`Chape${braille}sèche`)));
}

/* ---- (5) la garde ------------------------------------------------------ */
{
  const feu = String.fromCodePoint(0x1f525);
  verifier('LONGUEUR_MAX vaut 2 000 : la borne de toute phrase rangée', R.LONGUEUR_MAX === 2000, `vaut ${R.LONGUEUR_MAX}`);
  verifier('2 001 points de code : pas de clé (null), sans rien calculer — aPlat comme cleDeRapprochement',
    cle('a'.repeat(2001)) === null && R.aPlat('a'.repeat(2001)) === null && cle(feu.repeat(2001)) === null);
  verifier('2 000 points de code ont leur clé — même quand chacun pèse deux unités (un émoji)',
    cle('a'.repeat(2000)) === 'a'.repeat(2000) && cle(feu.repeat(2000)) === feu.repeat(2000));
}

/* ---- (6) le pluriel ----------------------------------------------------- */
{
  const exportees = Object.entries(R).filter(([, v]) => v instanceof RegExp).map(([k]) => k);
  verifier('aucune expression régulière n’est exportée (une expression /g garde son lastIndex d’un appel à l’autre)',
    exportees.length === 0, `exportées : ${exportees.join(', ')}`);
  verifier('EXCEPTIONS_PLURIEL vaut [\'bas\'] : « plancher bas » n’est pas « plancher BA », le béton armé',
    Array.isArray(R.EXCEPTIONS_PLURIEL) && R.EXCEPTIONS_PLURIEL.length === 1 && R.EXCEPTIONS_PLURIEL[0] === 'bas');
  verifier('PLURIEL_SOURCE : trois lettres au moins, un s ou un x, l’exception en anticipation négative',
    R.PLURIEL_SOURCE === '(^| )(?!(?:bas)(?: |$))([a-z]{2,})[sx](?= |$)', `vaut ${JSON.stringify(R.PLURIEL_SOURCE)}`);
  const src = sansCommentairesJs(lire('src/lib/rapprochement.js'));
  verifier('le pluriel est un LITTÉRAL (le compilateur Hermes le valide), jamais un `new RegExp`',
    /\bconst\s+PLURIEL\s*=\s*\//.test(src) && !/\bRegExp\s*\(/.test(src)
      && !/\bexport\s+(?:const|let|var)\s+PLURIEL\s*=/.test(src) && !/\bexport\s*\{[^}]*\bPLURIEL\b(?!\w)/.test(src));
}

/* ---- (7) ce que le miroir n'a pas le droit de faire --------------------- */
{
  const brut = lire('src/lib/rapprochement.js');
  const { code, regex } = lireJs(brut);
  verifier('src/lib/rapprochement.js n’importe RIEN', !chargeQuelqueChose(code),
    `il charge : ${modulesDe(code).join(', ') || 'une forme d’import'}`);
  const interdits = ['normalize', 'toLowerCase', 'toUpperCase', 'toLocaleLowerCase', 'toLocaleUpperCase', 'localeCompare',
    'Intl', `${BARRE}p{`, `${BARRE}P{`, '(?<'];
  const trouves = interdits.filter((x) => code.includes(x));
  verifier('il n’appelle ni normalize, ni toLowerCase/toUpperCase, ni localeCompare, ni Intl, ni classe Unicode, ni rétrospection',
    trouves.length === 0, `trouvé : ${trouves.join(', ')} — des tables Unicode qui ne sont pas les mêmes dans Hermes et dans PostgreSQL`);
  const drapeauxU = regex.filter((r) => /[uv]/.test(r.slice(r.lastIndexOf('/') + 1)));
  verifier(`aucune de ses ${regex.length} expressions ne porte le drapeau u ou v`, regex.length > 0 && drapeauxU.length === 0,
    drapeauxU.length ? `avec u ou v : ${drapeauxU.join(' ')}` : 'aucune expression relevée : le lecteur ne voit plus rien');
  const horsAscii = [...brut].filter((c) => c.codePointAt(0) > 127);
  verifier('aucun caractère hors de l’ASCII dans le fichier, commentaires compris (la table s’écrit en séquences)',
    horsAscii.length === 0, `${horsAscii.length} caractère(s), dont ${[...new Set(horsAscii)].slice(0, 6).map(nomCar).join(' ')} `
    + '— une séquence changée en caractère par un outil d’édition ne se voit pas à l’œil');
}

/* ---- (9) aucun écran ne l'importe --------------------------------------- */
{
  const fichiers = [];
  const parcourir = (d) => {
    if (!existsSync(path.join(RACINE, d))) return;
    for (const e of readdirSync(path.join(RACINE, d), { withFileTypes: true })) {
      const f = `${d}/${e.name}`;
      if (e.isDirectory()) parcourir(f);
      else if (/\.(jsx?|tsx?)$/.test(e.name)) fichiers.push(f);
    }
  };
  parcourir('src/screens');
  parcourir('src/components');
  const importeurs = fichiers.filter((f) => modulesDe(sansCommentairesJs(lire(f))).some((m) => /(^|\/)rapprochement(\.js)?$/.test(m)));
  verifier(`aucun écran n’importe rapprochement.js (${fichiers.length} fichiers de src/screens et src/components lus) : `
    + 'la clé ne s’affiche nulle part, devis.js et postes.js la calculent pour eux',
    fichiers.length > 0 && importeurs.length === 0, `l’importent : ${importeurs.join(', ')}`);
}

/* ================================================================== */
/*  A (suite). LE CALCUL DES POSTES — postes.js et la mémoire de devis.js */
/* ================================================================== */
console.log('\nA (suite). LE CALCUL DES POSTES — les 51 cas du cahier (§3.3), le balayage, et ce que postes.js n’a pas le droit '
  + 'de faire');

/* LES DONNÉES D'ESSAI. Les huit postes du cahier (§4.3), écrits ICI : la
   réserve de démonstration n'existe qu'à l'étape 4, et ces cas éprouvent le
   CALCUL, pas la démonstration (G le fera). Les dates sont à midi UTC, pour
   tomber le même jour à Paris et sous le fuseau de la machine qui fait
   tourner ce contrôle ; le cas 20 éprouve les fuseaux, à part. */
const NB = String.fromCharCode(0xa0);
const eur = (s) => `${s}${NB}€`;
const LE14 = '2026-10-14T12:00:00Z';
const T0 = Date.UTC(2026, 9, 23, 12);
const il = (h) => new Date(T0 - h * 3600e3).toISOString();
const Po = (id, designation, unite, prix, plus = {}) => ({
  id, designation, unite, fournitureNonComprise: false, mainOeuvre: false, prixReferenceCentimes: prix,
  prixFixeLe: prix ? LE14 : null, devisOrigineId: null, createdAt: LE14, modifieLe: LE14, ...plus,
});
const POSTES = [
  Po('p1', 'Chape sèche avant carrelage collé', 'm2', 4500, { devisOrigineId: 'demo-devis-1' }),
  Po('p2', 'Pose de faïence murale', 'h', null, { mainOeuvre: true }),
  Po('p3', 'Faïence murale, forfait pour une salle d’eau complète', 'forfait', 90000),
  Po('p4', 'Ragréage autolissant fibré sur plancher bois, après pose d’un primaire d’accrochage', 'm2', 2800),
  Po('p5', 'Dépose de l’ancien carrelage au sol', 'm2', 1800),
  Po('p6', 'Pose de plinthes carrelées', 'm', 1200),
  Po('p7', 'Pose d’un meuble vasque', 'u', 18000, { fournitureNonComprise: true }),
  Po('p8', 'Dalle béton armé, épaisseur 12 cm, sur hérisson', 'm2', 8500),
];
/* Une ligne de mémoire, d'un devis ouvert à la main (son objet se montre). */
const Lm = (id, designation, unite, prix, ageH, plus = {}) => ({
  id, type: 'poste', designation, unite, prixUnitaireCentimes: prix, offert: false, mainOeuvre: false,
  fournitureNonComprise: false, modifieLe: il(ageH),
  devis: { id: `d-${id}`, objet: `Devis ${id}`, source: 'manuelle', modifieLe: il(ageH) }, ...plus,
});
const Li = (designation, unite, prix, plus = {}) => ({
  id: 'ligne', type: 'poste', designation, unite, quantiteMilliemes: 1000, prixUnitaireCentimes: prix,
  tauxTvaCentiemes: 2000, offert: false, fournitureNonComprise: false, mainOeuvre: false, ...plus,
});
const sugg = (args) => P.suggestionsPourLaFrappe(args);
const json = (x) => JSON.stringify(x);

/* LA MÉMOIRE DE DÉMONSTRATION, avec les trois lignes de « Sol du séjour »
   (cahier §4.3) que l'étape 4 a posées dans `devis-demo.js` — jusque-là,
   ce contrôle les SIMULAIT avec leurs valeurs du cahier. Ce sont désormais
   les vraies qui servent, et leur absence est un refus : un cas éprouvé sur
   une ligne que la démonstration n'a plus ne prouverait rien de ce que le
   propriétaire voit. (G vérifie aussi leur prix, leur taux et l'horloge du
   devis.) */
const MOMENT = new Date('2026-10-23T12:00:00Z');
const ilDemo = (h) => new Date(MOMENT.getTime() - h * 3600e3).toISOString();
const MEMOIRE_DEMO = await DEMO.creerBaseDevisDemo({ maintenant: () => MOMENT }).memoire('1');
const seuil = MEMOIRE_DEMO.find((l) => /^Seuil de porte/.test(l.designation || ''));
const TROIS = [
  ['Seuils de porte en aluminium (fourniture seule, sans pose)', 'u', 2300],
  ['Depose de l’ancien carrelage au sol', 'm2', 2000],
  ['evacuation des gravats en dechetterie', 'forfait', 18000],
];
const MEMOIRE2 = MEMOIRE_DEMO;
verifier('la mémoire de démonstration s’ouvre, et porte la ligne « Seuil de porte… » de « Sol du séjour » (la base des trois lignes)',
  MEMOIRE_DEMO.length > 5 && !!seuil && seuil.devis && seuil.devis.objet === 'Sol du séjour', `${MEMOIRE_DEMO.length} lignes`);
const absentes = TROIS.filter(([d, u, prix]) => !MEMOIRE_DEMO.some((l) => l.designation === d && l.unite === u
  && l.prixUnitaireCentimes === prix && l.devis && l.devis.objet === 'Sol du séjour'));
verifier('…et les trois lignes de la base de postes — « Seuils… » à 23 €, « Depose… » sans accent à 20 €, « evacuation… » à 180 € — '
  + 'y sont, dans « Sol du séjour » : les cas les éprouvent pour de vrai, plus aucune n’est simulée',
absentes.length === 0, absentes.map(([d]) => d).join(' | '));

/* ---- (8) devis.js sans normalize, (10) les imports de postes.js -------- */
{
  verifier('(8) `devis.js` n’appelle plus `normalize` : la recherche passe par la clé de rapprochement',
    !/\bnormalize\b/.test(sansCommentairesJs(lire('src/lib/devis.js'))));
  const src = sansCommentairesJs(lire('src/lib/postes.js'));
  const mods = modulesDe(src).sort();
  verifier('`postes.js` n’importe que quatre fichiers purs — `./centimes.js`, `./devis.js`, `./entreprise.js`, `./rapprochement.js` '
    + '— en quatre instructions, ni `require` ni `import()`',
  json(mods) === json(['./centimes.js', './devis.js', './entreprise.js', './rapprochement.js'])
    && instructionsDImport(src) === 4 && !/\brequire\s*\(|\bimport\s*\(/.test(src), `${json(mods)} ; ${instructionsDImport(src)} instruction(s)`);
}

/* ---- (11) ce que postes.js n'a pas le droit d'écrire --------------------- */
{
  const src = sansCommentairesJs(lire('src/lib/postes.js'));
  const flottants = [...src.matchAll(/\bMath\.(round|fround|min|max)\s*\(|\.toFixed\s*\(|\bparseFloat\s*\(/g)].map((m) => m[0]);
  verifier('`postes.js` n’écrit jamais « € » lui-même (`centimesLisibles` est la seule écriture d’un montant), ni `Math.round`, '
    + '`toFixed`, `parseFloat`, ni minimum, ni maximum', !src.includes('€') && flottants.length === 0, flottants.join(', '));
  verifier('…ni moyenne, ni médiane, ni `reduce` : aucun prix que l’artisan n’a pas écrit lui-même',
    !/moyenne|m[ée]diane|\bavg\s*\(|\.reduce\s*\(/i.test(src));
  const casse = ['normalize', 'toLowerCase', 'toUpperCase', 'toLocaleLowerCase', 'toLocaleUpperCase', 'localeCompare', 'Intl']
    .filter((x) => src.includes(x));
  verifier('…ni `normalize`, ni changement de casse, ni comparaison selon la langue : la clé suffit', casse.length === 0, casse.join(', '));
  const parses = [...src.matchAll(/Date\.parse\(\s*(\w+)\s*\)/g)].map((m) => m[1]);
  verifier('…et aucun horodatage n’atteint `Date.parse` sans être passé par `isoLisible()`',
    parses.length >= 1 && parses.every((v) => new RegExp(`const\\s+${v}\\s*=\\s*isoLisible\\(`).test(src)), json(parses));
  /* « avant » se lisait mal sous « Chape sèche AVANT carrelage collé », et
     comme un « prix avant réduction » (cahier T23). */
  const detail = (/export function detailDeSuggestion\([\s\S]*?\n\}/.exec(src) || [''])[0];
  verifier('le détail d’une proposition ne dit jamais « avant » (il se lisait comme un prix avant réduction)',
    detail.length > 200 && !/avant/i.test(detail));
  /* Les clés des postes se calculent une fois par tableau (CP8) : la liste
     des propositions passe par l'index des postes, jamais par `cleDeLigne`
     appliqué à chaque poste à chaque frappe. */
  const liste = (/export function suggestionsPourLaFrappe\([\s\S]*?\n\}/.exec(src) || [''])[0];
  verifier('`suggestionsPourLaFrappe` lit les postes par leur index (`postesParCle`, sur `postesPrepares`), jamais par `cleDeLigne` '
    + 'appliqué à chaque poste', /postesParCle\(postes\)/.test(liste) && !/cleDeLigne\(\s*p\b/.test(liste)
    && /postesPrepares\(postes\)/.test((/function postesParCle\([\s\S]*?\n\}/.exec(src) || [''])[0]));
}

/* ---- (12) le vocabulaire : jamais un prix venu d'ailleurs ---------------- */
{
  const INTERDITS = ['conseill', 'recommand', 'moyen', 'marché', 'habituel', 'align', 'prix juste'];
  const chainesDe = (code) => code.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) || [];
  const ecrans = ['src/lib/postes.js', 'src/screens/PostesScreen.js', 'src/components/FeuillePoste.js', 'src/components/FeuilleAjoutPoste.js',
    'src/components/CarteLigne.js', 'src/components/ChampDesignation.js']
    .filter((f) => existsSync(path.join(RACINE, f)));
  const fautes = [];
  for (const f of ecrans) {
    for (const s of chainesDe(sansCommentairesJs(lire(f)))) {
      for (const mot of INTERDITS) {
        if (new RegExp(`(?<![\\p{L}])${mot}`, 'iu').test(s)) fautes.push(`${f} : ${s.slice(0, 60)} (« ${mot} »)`);
      }
    }
  }
  verifier(`aucune chaîne de ${ecrans.join(', ')} ne dit « conseillé », « recommandé », « moyen(ne) », « marché », « habituel », `
    + '« aligner » ni « prix juste » : le prix de référence est SON prix, jamais un prix venu d’ailleurs',
  ecrans.includes('src/lib/postes.js') && fautes.length === 0, fautes.slice(0, 4).join(' | '));
}

/* ---- (13) les 51 cas du cahier (§3.3) ------------------------------------ */
/* Un calcul qui PLANTE au cas 30 ne doit pas faire taire les cas 31 à 51 ni
   le balayage : l'exception devient un échec NOMMÉ, et le contrôle
   continue (un contrôle qui plante ne vérifie rien). */
try {
  const chape = POSTES[0];
  const phr = (l, postes = POSTES, o = {}) => P.phraseReference(P.referenceDuPoste(l, postes, o));
  const ecart = (l, postes = POSTES, o = {}) => P.ecartAuPoste(l, postes, o);
  /* 1 à 8 : la référence et l'écart. */
  const l52 = Li('Chape sèche avant carrelage collé', 'm2', 5200);
  verifier('cas 1 : la référence « Votre prix de référence : 45,00 € / m², fixé le 14/10/2026. » et l’écart « Vous mettez 52,00 € — '
    + 'c’est voulu ? » ; VoiceOver dit la phrase entière', phr(l52) === `Votre prix de référence : ${eur('45,00')} / m², fixé le 14/10/2026.`
    && P.phraseEcart(ecart(l52)) === `Vous mettez ${eur('52,00')} — c’est voulu ?`
    && P.libelleEcart(ecart(l52)) === `Votre prix de référence est ${eur('45,00')} le mètre carré, vous mettez ${eur('52,00')} : c’est voulu ?`,
  `${json(phr(l52))} ; ${json(P.phraseEcart(ecart(l52)))} ; ${json(P.libelleEcart(ecart(l52)))}`);
  verifier('cas 2 et 3 : à 45,00 € la référence sans écart ; à 44,99 €, l’écart — dès le premier centime',
    !!phr(Li(chape.designation, 'm2', 4500)) && ecart(Li(chape.designation, 'm2', 4500)) === null
    && !!ecart(Li(chape.designation, 'm2', 4499)) && ecart(Li(chape.designation, 'm2', 4499)).prix === 4499);
  verifier('cas 4 : une ligne OFFERTE a sa référence, et pas d’écart (offrir est un écart voulu)',
    !!phr(Li(chape.designation, 'm2', 5200, { offert: true })) && ecart(Li(chape.designation, 'm2', 5200, { offert: true })) === null);
  const auForfait = Li(chape.designation, 'forfait', 5200);
  const sansFourniture = Li(chape.designation, 'm2', 5200, { fournitureNonComprise: true });
  verifier('cas 5 et 6 : la même phrase au forfait, ou « fourniture non comprise », n’est PAS ce poste — ni référence, ni écart, '
    + 'et « ajoutable »', phr(auForfait) === null && ecart(auForfait) === null && phr(sansFourniture) === null && ecart(sansFourniture) === null
    && P.etatDansLaBase(auForfait, POSTES, 'ok').etat === 'ajoutable');
  const faience = Li('Pose de faïence murale', 'h', 4500, { mainOeuvre: true });
  verifier('cas 7 : un poste SANS prix de référence — ni référence, ni écart, mais « dans la base »',
    phr(faience) === null && ecart(faience) === null && P.etatDansLaBase(faience, POSTES, 'ok').etat === 'dans_la_base'
    && P.etatDansLaBase(faience, POSTES, 'ok').poste.id === 'p2');
  verifier('cas 8 : une ligne SANS prix a sa référence, et pas d’écart', !!phr(Li(chape.designation, 'm2', null))
    && ecart(Li(chape.designation, 'm2', null)) === null);
  /* 9, 10, 10 bis : la même phrase écrite autrement. */
  const bord1 = Li(`${NB}${chape.designation}`, 'm2', 4500);
  const bord2 = Li(`${chape.designation}${String.fromCharCode(0x200b)}`, 'm2', 4500);
  verifier('cas 9 : une espace insécable ou un U+200B au bord — même clé, même poste, et `sous` vide (rien ne se voit)',
    D.cleDeLigne(bord1) === D.cleDeLigne(chape) && D.cleDeLigne(bord2) === D.cleDeLigne(chape)
    && P.etatDansLaBase(bord1, POSTES, 'ok').sous === null && P.etatDansLaBase(bord2, POSTES, 'ok').sous === null);
  const minuscule = Li('chape sèche avant carrelage collé', 'm2', 4500);
  const e10 = P.etatDansLaBase(minuscule, POSTES, 'ok');
  verifier('cas 10 : « chape sèche… » contre « Chape sèche… » — « dans la base », `sous` = la phrase du POSTE, et la référence la '
    + 'NOMME', e10.etat === 'dans_la_base' && e10.sous === chape.designation
    && phr(minuscule) === `Votre prix de référence pour « ${chape.designation} » : ${eur('45,00')} / m², fixé le 14/10/2026.`,
  json([e10.etat, e10.sous, phr(minuscule)]));
  const decompose = `Chape se${String.fromCharCode(0x300)}che avant carrelage colle${String.fromCharCode(0x301)}`;
  const cinq = [chape.designation, 'chape sèche avant carrelage collé', 'Chape  sèche avant carrelage collé', decompose,
    `Chape${NB}sèche avant carrelage collé`];
  /* La base se REMPLACE à chaque ajout, comme l'état d'`OpusApp` : les clés
     des postes sont gardées par tableau, et un tableau modifié en place
     garderait les anciennes. */
  let base10 = [];
  let refusees = 0;
  for (const d of cinq) {
    const v = { designation: d, unite: 'm2', fournitureNonComprise: false };
    if (P.posteExistant(v, base10)) refusees += 1;
    else base10 = [...base10, { ...v, id: `x${base10.length}`, modifieLe: LE14 }];
  }
  const sous10 = cinq.map((d) => P.etatDansLaBase(Li(d, 'm2', 4500), POSTES, 'ok'));
  verifier('cas 10 bis : les cinq variantes (casse, double espace, forme décomposée, espace insécable) font UNE clé ; ajoutées '
    + 'l’une après l’autre, quatre sur cinq sont refusées ; `sous` est vide pour l’espace insécable et le double espace, non vide '
    + 'pour la casse et la forme décomposée (dit, T21)',
  new Set(cinq.map((d) => D.cleDeLigne({ designation: d, unite: 'm2' }))).size === 1 && refusees === 4
    && sous10.every((e) => e.etat === 'dans_la_base')
    && json(sous10.map((e) => e.sous === null)) === json([true, false, true, false, true]), json(sous10.map((e) => e.sous)));
  /* 11, 12, 12 bis : les états. */
  const titres = ['reserve', 'zone', 'piece'].map((t) => P.etatDansLaBase({ type: t, designation: chape.designation, unite: 'm2' }, POSTES, 'ok'));
  verifier('cas 11 : une réserve, une zone, une pièce — « sans objet », et ni référence ni écart',
    titres.every((e) => e.etat === 'sans_objet' && e.poste === null)
    && P.referenceDuPoste({ type: 'reserve', designation: chape.designation, unite: 'm2' }, POSTES) === null);
  verifier('cas 12 : une OPTION peut porter un écart', !!ecart(Li(chape.designation, 'm2', 5200, { type: 'option' })));
  verifier('cas 12 bis : la base pas encore lue → « en lecture » (jamais « Ajouter » : on proposerait un doublon) ; lue en échec → '
    + '« illisible »', ['vide', 'chargement', undefined, null].every((e) => P.etatDansLaBase(l52, POSTES, e).etat === 'en_lecture')
    && P.etatDansLaBase(l52, POSTES, 'echec').etat === 'illisible' && P.etatDansLaBase(Li('Niche murale', 'u', 100), POSTES, 'chargement').etat === 'en_lecture');
  /* 13 à 15 : la liste fusionnée. */
  const r13 = sugg({ postes: POSTES, memoire: MEMOIRE_DEMO, texte: 'chape' });
  const v13 = r13.map((s) => [s.source, P.valeursDeLaProposition(s).prixUnitaireCentimes, s.fournitureNonComprise === true]);
  verifier('cas 13 : sur « chape », DEUX propositions — la base à 45,00 € (sa référence), puis la mémoire à 38,00 € « fourniture non '
    + 'comprise » ; la mémoire à 52 € et 45 € a la clé du poste, elle se tait',
  json(v13) === json([['base', 4500, false], ['memoire', 3800, true]]), json(v13));
  const quatreChapes = [Po('c1', 'Chape anhydrite fluide', 'm2', 3200), Po('c2', 'Chape ciment traditionnelle', 'm2', 3500),
    Po('c3', 'Chape fibrée sur isolant', 'm2', 3900), Po('c4', 'Chape sèche avant carrelage collé', 'm2', 4500)];
  const r14 = sugg({ postes: quatreChapes, memoire: MEMOIRE_DEMO, texte: 'chape' });
  verifier('cas 14 : quatre postes correspondent — trois postes, aucune mémoire', r14.length === 3 && r14.every((s) => s.source === 'base'),
    json(r14.map((s) => [s.source, s.designation])));
  const r15 = sugg({ postes: POSTES, memoire: MEMOIRE_DEMO, texte: 'seche chape' });
  verifier('cas 15 : « seche chape » trouve « Chape sèche avant carrelage collé », dans la base ET dans la mémoire',
    r15.length === 2 && r15.every((s) => /^Chape sèche avant carrelage collé$/.test(s.designation)) && json(r15.map((s) => s.source)) === json(['base', 'memoire']));
  /* 16, 17 : ce qu'un appui recopie, ce que la feuille propose. */
  const sansRien = P.valeursDeLaProposition({ source: 'base', ...POSTES[1], dernierPrix: null });
  const offerteZero = P.valeursDeLaProposition({ source: 'memoire', ...D.memoireDesLignes([Lm('o', 'Déplacement', 'forfait', 0, 1, { offert: true })], 'deplacement')[0] });
  verifier('cas 16 : un poste sans prix ni dernier prix recopie la phrase, l’unité, la fourniture, la main-d’œuvre, et un prix `null` — '
    + 'jamais un taux, « Offert » ni une quantité ; `prixAEcrire` rend `null` (« ne touchez pas au champ ») ; une ligne offerte à 0 aussi',
  json(Object.keys(sansRien).sort()) === json(['designation', 'fournitureNonComprise', 'mainOeuvre', 'prixUnitaireCentimes', 'unite'])
    && sansRien.prixUnitaireCentimes === null && P.prixAEcrire(sansRien) === null && P.prixAEcrire(null) === null
    && offerteZero.prixUnitaireCentimes === null && P.prixAEcrire(offerteZero) === null
    && P.prixAEcrire({ prixUnitaireCentimes: 4500 }) === '45' && P.prixAEcrire({ prixUnitaireCentimes: 2550 }) === '25,50',
  json([sansRien, offerteZero]));
  const p17 = P.posteDepuisLaLigne(Li('Nettoyage de fin de chantier', 'forfait', 15000, { offert: true, mainOeuvre: true }));
  verifier('cas 17 : la feuille propose la VALEUR d’une ligne offerte (150,00 €), jamais « Offert », jamais la quantité ni le taux ; '
    + 'une ligne offerte à 0 ne propose rien', p17.prixPropose === 15000 && p17.mainOeuvre === true
    && json(Object.keys(p17).sort()) === json(['designation', 'fournitureNonComprise', 'mainOeuvre', 'prixPropose', 'unite'])
    && P.posteDepuisLaLigne(Li('Déplacement', 'forfait', 0, { offert: true })).prixPropose === null
    && P.posteDepuisLaLigne(Li(`  Chape${String.fromCharCode(0x200b)}`, 'm2', 100)).designation === 'Chape', json(p17));
  /* 18 : les refus, dans l'ordre de la base. */
  const V = (designation, plus = {}) => P.validerPoste({ designation, unite: 'm2', prixReferenceCentimes: 4500, ...plus }).contrainte;
  const feu = String.fromCodePoint(0x1f525);
  const tiret = '—';
  const attendus18 = [
    [V(String.fromCharCode(0x200b)), 'base_poste_designation_check'], [V('a'.repeat(2001)), 'base_poste_designation_check'],
    [V(feu.repeat(2000)), null], [V('Chape', { unite: 'ml' }), 'base_poste_unite_check'], [V('Chape', { unite: null }), 'base_poste_unite_check'],
    [V('Chape', { prixReferenceCentimes: 0 }), 'base_poste_prix_check'], [V('Chape', { prixReferenceCentimes: -1 }), 'base_poste_prix_check'],
    [V('Chape', { prixReferenceCentimes: 1e10 }), 'base_poste_prix_check'], [V('', { unite: 'ml' }), 'base_poste_designation_check'],
    [V(tiret), 'base_poste_rapprochement_check'], [V(tiret, { unite: 'ml' }), 'base_poste_rapprochement_check'],
    [V(tiret, { prixReferenceCentimes: 0 }), 'base_poste_prix_check'], [V(String.fromCharCode(0x3000)), 'base_poste_rapprochement_check'],
    [V(String.fromCharCode(0x3164)), 'base_poste_rapprochement_check'], [V(String.fromCharCode(0xfe0f)), 'base_poste_rapprochement_check'],
    [V('Chape', { prixReferenceCentimes: null }), null], [V(feu), null],
  ];
  const faux18 = attendus18.map(([obtenu, attendu], i) => [i, obtenu, attendu]).filter(([, o, a]) => o !== a);
  verifier('cas 18 : `validerPoste` refuse dans l’ORDRE de la base — un U+200B seul et 2 001 caractères par la phrase, « ml » et une '
    + 'unité absente par l’unité, 0, −1 et 10^10 par le prix, « — », une espace idéographique, U+3164 et U+FE0F par la clé vide, '
    + '« — » avec un prix de 0 par le PRIX ; 2 000 émojis et un émoji seul passent',
  faux18.length === 0 && P.validerPoste({ designation: 'Chape', unite: 'm2' }).ok, json(faux18));
  /* 19 : le changement d'unité. */
  /* TEXTES16 : « passée de heure », « de unité » manquaient l'élision. Les
     noms d'unité sont CITÉS — et la propriété est vérifiée sur les 42
     couples, pas sur deux exemples. */
  const couples19 = D.UNITES.flatMap((a) => D.UNITES.filter((b) => b.cle !== a.cle).map((b) => [a, b]));
  const mal19 = couples19.filter(([a, b]) => P.changementDUnite({ unite: a.cle, quantiteMilliemes: 2000 }, { unite: b.cle })
    !== `L’unité est passée de « ${a.pastille} » à « ${b.pastille} » : la quantité 2 est restée, vérifiez-la.`);
  verifier('cas 19 : « L’unité est passée de « m² » à « forfait » : la quantité 27 est restée, vérifiez-la. » — les noms CITÉS, '
    + 'aucune élision manquée (« de heure », « de unité »), sur les 42 couples ; sans quantité, rien',
  P.changementDUnite({ unite: 'm2', quantiteMilliemes: 27000 }, { unite: 'forfait' })
      === 'L’unité est passée de « m² » à « forfait » : la quantité 27 est restée, vérifiez-la.'
    && P.changementDUnite({ unite: 'm2', quantiteMilliemes: null }, { unite: 'forfait' }) === null
    && P.changementDUnite({ unite: 'm2', quantiteMilliemes: 27000 }, { unite: 'm2' }) === null
    && couples19.length === 42 && mal19.length === 0
    && couples19.every(([a, b]) => !/ de [aeiouhé]/.test(P.changementDUnite({ unite: a.cle, quantiteMilliemes: 2000 }, { unite: b.cle }))),
  json(mal19.map(([a, b]) => `${a.cle}→${b.cle}`)));
  /* 21 : le plafond et la limite de lecture. */
  verifier('cas 21 : `POSTES_MAX` vaut 1 000, et ne dépasse pas `LIMITE_LECTURE_API` (une réponse plus longue serait COUPÉE, sans erreur)',
    P.POSTES_MAX === 1000 && P.LIMITE_LECTURE_API === 1000 && P.POSTES_MAX <= P.LIMITE_LECTURE_API, `${P.POSTES_MAX} / ${P.LIMITE_LECTURE_API}`);
  /* 22 : avant la déclaration du régime. */
  const avant = [Po('r1', chape.designation, 'm2', 4500, { prixFixeLe: '2026-09-01T12:00:00Z' })];
  const o22 = { regimeDeclareLe: '2026-10-03T12:00:00Z' };
  verifier('cas 22 : une référence fixée le 01/09 sous un régime déclaré le 03/10 se VÉRIFIE (« … avant la déclaration de votre régime '
    + 'de TVA actuel : vérifiez-le. »), et la question de l’écart se tait ; un régime du 01/08 ou absent ne dit rien',
  P.referenceDuPoste(l52, avant, o22).avantRegime === true
    && phr(l52, avant, o22) === `Votre prix de référence : ${eur('45,00')} / m², fixé le 01/09/2026, avant la déclaration de votre régime de TVA actuel : vérifiez-le.`
    && P.phraseEcart(ecart(l52, avant, o22)) === null && P.libelleEcart(ecart(l52, avant, o22)) === null
    && P.referenceDuPoste(l52, avant, { regimeDeclareLe: '2026-08-01T12:00:00Z' }).avantRegime === false
    && P.referenceDuPoste(l52, avant).avantRegime === false && !!P.phraseEcart(ecart(l52, avant)), json(phr(l52, avant, o22)));
  /* 23 : le nom d'un client dans une phrase. */
  const fiche = { nom: 'Mme Fictive Durandal', adresse: '4 rue des Essais', telephone: '06 12 34 56 78' };
  const I = (phrase, client = fiche) => P.indicesDuClient(phrase, { client }).map((x) => (x.mot ? `${x.genre}:${x.mot}` : x.genre));
  const r23 = [
    I('Remplacement du ballon chez Mme Durandal, 4 rue des Essais'), I('Chape sèche avant carrelage collé'),
    I('Pose de faïence murale (rappeler au 06 12 34 56 78)'), I('Dépose cuisine Durandal'), I('Enduit de finition, teinte blanc cassé'),
    I('Enduit blanc cassé', { nom: 'M. Blanc' }),
  ];
  verifier('cas 23 : les six cas de la critique droit — nom, adresse et « chez / Mme » ; rien ; le téléphone de la fiche et un numéro ; '
    + 'le nom ; rien ; et le faux positif connu « M. Blanc » — l’indice dit le mot de la FICHE (« Durandal »), jamais la clé',
  json(r23) === json([['nom:Durandal', 'adresse:Essais', 'civilite'], [], ['telephone', 'numero'], ['nom:Durandal'], [], ['nom:Blanc']])
    && json(I('DURANDAL, carrelage')) === json(['nom:Durandal']), json(r23));
  /* 24 : l'origine d'un poste. */
  verifier('cas 24 : « Ajouté le 14/10/2026 depuis un de vos devis » ; lien vidé : « Ajouté le 14/10/2026 » — jamais un mot de l’objet '
    + 'd’un devis', P.libelleOrigine(chape) === 'Ajouté le 14/10/2026 depuis un de vos devis'
    && P.libelleOrigine({ ...chape, devisOrigineId: null }) === 'Ajouté le 14/10/2026'
    && !/Mme|Fuite/.test(P.libelleOrigine({ ...chape, devis: { objet: 'Fuite chez Mme X' } })), P.libelleOrigine(chape));
  /* 25 : le vocabulaire des phrases rendues. */
  const rendues = [phr(l52), phr(minuscule), phr(l52, avant, o22), P.phraseReference({ reference: 4500, unite: 'h', fixeLe: LE14 })];
  verifier('cas 25 : chaque phrase de référence commence par « Votre » — c’est SON prix ; à l’heure, « Votre taux horaire de référence »',
    rendues.every((x) => typeof x === 'string' && x.startsWith('Votre '))
    && rendues[3] === `Votre taux horaire de référence : ${eur('45,00')} / h, fixé le 14/10/2026.`, json(rendues));
  /* 26 : la ligne descriptive, le libellé du prix. */
  const noms = D.UNITES.map((u) => P.ligneDescriptive({ unite: u.cle }));
  verifier('cas 26 : les sept unités dites comme sur un chantier, par leur NOM (« À l’unité », « Au mètre carré » : « Unité : '
    + 'unité » se lisait comme une faute, ECRAN8, et « Unité : à l’unité » à côté de « Unité : mètre carré » disait la même chose de '
    + 'deux façons, TEXTES16), la fourniture et la main-d’œuvre ; « Taux horaire de référence (HT) » au réel, '
    + 'sans « HT » en franchise, non déclaré, en lecture ou en échec',
  json(noms) === json(['Au mètre carré', 'Au mètre linéaire', 'Au mètre cube', 'À l’unité', 'À l’heure', 'Au jour', 'Au forfait'])
    && noms.every((n, i) => n.endsWith(D.UNITES[i].nom) && !/^Unité/.test(n))
    && P.ligneDescriptive({ unite: 'm2', fournitureNonComprise: true, mainOeuvre: true }) === 'Au mètre carré · fourniture non comprise · main-d’œuvre'
    && P.etiquettePrixReference({ unite: 'h' }, 'reel') === 'Taux horaire de référence (HT)'
    && P.etiquettePrixReference({ unite: 'h' }, 'franchise') === 'Taux horaire de référence'
    && P.etiquettePrixReference({ unite: 'm2' }, 'reel') === 'Prix de référence HT'
    && [null, 'franchise', { echec: true }, { chargement: true }, undefined].every((r) => P.etiquettePrixReference({ unite: 'm2' }, r) === 'Prix de référence'),
  json(noms));
  /* 27 à 31 : la mémoire et la base dans la liste. */
  const base27 = sugg({ postes: POSTES, memoire: [], texte: 'chape' })[0];
  verifier('cas 27 : le détail d’un poste de la base, « 45,00 € / m² · réf. du 14/10/2026 »', !!base27
    && P.detailDeSuggestion(base27) === `${eur('45,00')} / m² · réf. du 14/10/2026`, base27 && P.detailDeSuggestion(base27));
  const r28 = sugg({ postes: [], memoire: [Lm('s1', 'Seuils de porte en aluminium (fourniture seule, sans pose)', 'u', 2300, 72),
    Lm('s2', 'Seuil de porte en aluminium (fourniture seule, sans pose)', 'u', 2500, 2)], texte: 'seuil' });
  verifier('cas 28 : « Seuil de porte… » (2 h, 25 €) et « Seuils de porte… » (3 jours, 23 €) — UNE proposition, titrée par la plus '
    + 'RÉCENTE, les deux prix avec leur origine, « 25,00 € / u · aussi 23,00 € »',
  r28.length === 1 && r28[0].designation === 'Seuil de porte en aluminium (fourniture seule, sans pose)'
    && json(r28[0].prix.map((p) => [p.prixUnitaireCentimes, p.origine.objet])) === json([[2500, 'Devis s2'], [2300, 'Devis s1']])
    && P.detailDeSuggestion(r28[0]) === `${eur('25,00')} / u · aussi ${eur('23,00')}`, json(r28.map((s) => [s.designation, P.detailDeSuggestion(s)])));
  const r29 = sugg({ postes: [], memoire: [Lm('a', 'Chape sèche', 'm2', 5000, 5), Lm('b', 'Chape sèche', 'm2', 7000, 1)], texte: 'chape' });
  verifier('cas 29 : 50 € et 70 € — une proposition, un appui recopie 70 €, 50 € reste dans `prix` ; jamais 60 €',
    r29.length === 1 && P.valeursDeLaProposition(r29[0]).prixUnitaireCentimes === 7000
    && json(r29[0].prix.map((p) => p.prixUnitaireCentimes)) === json([7000, 5000]) && !json(r29).includes('6000'));
  const r30 = sugg({ postes: [], memoire: [Lm('a', 'Chape sèche', 'm2', 4500, 5), Lm('b', 'CHAPES SECHES', 'm2', 4500, 1)], texte: 'chape' });
  verifier('cas 30 : la même phrase deux fois au même prix, dont une variante — une proposition, un prix',
    r30.length === 1 && r30[0].prix.length === 1, json(r30.map((s) => s.prix)));
  const r31 = sugg({ postes: [chape], memoire: [Lm('a', 'Chape sèche avant carrelage collé', 'm2', 5200, 1)], texte: 'chape' });
  verifier('cas 31 : un poste et une ligne de mémoire de même clé, à des prix différents — seul le poste', r31.length === 1
    && r31[0].source === 'base' && r31[0].id === 'p1' && r31[0].dernierPrix === 5200, json(r31.map((s) => [s.source, s.dernierPrix])));
  /* 32, 33 : la recherche, sur la démonstration. */
  const trouve = (t) => sugg({ postes: POSTES, memoire: MEMOIRE_DEMO, texte: t });
  const ids = (t) => trouve(t).map((s) => s.id || s.ligneId);
  verifier('cas 32 : « Dalles », « beton », « BETON » trouvent la dalle ; « carrelages » trouve les phrases de carrelage — que le lot 1 '
    + 'ne trouvait pas', json(ids('Dalles')) === json(['p8']) && json(ids('beton')) === json(['p8']) && json(ids('BETON')) === json(['p8'])
    && trouve('carrelages').length === 3 && ['p1', 'p5'].every((x) => ids('carrelages').includes(x))
    && trouve('carrelages').every((s) => D.cleDeLigne(s).includes('carrelage')), json(['Dalles', 'beton', 'BETON', 'carrelages'].map(ids)));
  const r33 = trouve('Pos');
  verifier('cas 33 : « Pos » rend les trois « Pose » de la base — « Pose de faïence murale » « sans réf. · dernier : 45,00 € / h » — '
    + 'et jamais « Dépose » en tête', r33.length === 3 && r33.every((s) => s.source === 'base' && /^Pose /.test(s.designation))
    && json(r33.map((s) => s.id).sort()) === json(['p2', 'p6', 'p7'])
    && P.detailDeSuggestion(r33.find((s) => s.id === 'p2')) === `sans réf. · dernier : ${eur('45,00')} / h`,
  json(r33.map((s) => [s.designation, P.detailDeSuggestion(s)])));
  /* 34 à 38 : ce que la feuille et la page calculent. */
  verifier('cas 34 : une ligne « — » (clé vide) est « sans objet », et la mémoire ne la propose jamais',
    P.etatDansLaBase(Li(tiret, 'u', 100), POSTES, 'ok').etat === 'sans_objet'
    && sugg({ postes: [], memoire: [Lm('t', tiret, 'u', 100, 1), Lm('u', 'Tiret de couverture', 'u', 100, 2)], texte: 'tir' }).every((s) => s.designation !== tiret));
  verifier('cas 35 : « chapes seches avant carrelage colle » au m² trouve le poste « Chape sèche… » qui EXISTE déjà ; au forfait, aucun',
    (P.posteExistant({ designation: 'chapes seches avant carrelage colle', unite: 'm2' }, POSTES) || {}).id === 'p1'
    && P.posteExistant({ designation: 'chapes seches avant carrelage colle', unite: 'forfait' }, POSTES) === null
    && P.posteExistant({ designation: tiret, unite: 'm2' }, POSTES) === null);
  const c36 = (phrase) => P.consequenceDeLaCorrection(chape, phrase, POSTES);
  verifier('cas 36 : corriger « Chape sèche… » en « CHAPES SÈCHES… » ne change rien ; en « Chape sèche fibrée… » détache ; en la phrase '
    + 'd’un autre poste de même unité, c’est un doublon, et il est NOMMÉ',
  c36('CHAPES SÈCHES AVANT CARRELAGES COLLÉS').consequence === 'aucune'
    && c36('Chape sèche fibrée avant carrelage collé').consequence === 'detache'
    && c36('Dalle béton armé, épaisseur 12 cm, sur hérisson').consequence === 'doublon'
    && c36('dalles beton arme epaisseur 12 cm sur herisson').autre.id === 'p8',
  json(['CHAPES SÈCHES AVANT CARRELAGES COLLÉS', 'Chape sèche fibrée avant carrelage collé', 'Dalle béton armé, épaisseur 12 cm, sur hérisson']
    .map((x) => c36(x).consequence)));
  const proches = P.postesProches([chape, Po('f1', chape.designation, 'forfait', 90000), Po('f2', 'Chape sèche avant carrelage collé, fibrée', 'm2', 5000)],
    { designation: chape.designation, unite: 'm2', fournitureNonComprise: false });
  verifier('cas 37 : les postes PROCHES de « Chape sèche… » au m² — le seul poste au FORFAIT ; jamais la phrase plus longue, jamais le '
    + 'poste lui-même', json(proches.map((p) => p.id)) === json(['f1'])
    && json(P.postesProches(POSTES, { designation: chape.designation, unite: 'm2', fournitureNonComprise: true }).map((p) => p.id)) === json(['p1']),
  json(proches.map((p) => p.id)));
  const jumeaux = [Po('j1', 'Chape sèche', 'm2', 4000, { modifieLe: '2026-10-01T12:00:00Z' }), Po('j2', 'chape seche', 'm2', 4200, { modifieLe: '2026-10-10T12:00:00Z' })];
  const r38 = sugg({ postes: jumeaux, memoire: [], texte: 'chape' });
  verifier('cas 38 : deux postes de même clé (une base incohérente, fabriquée) — UNE proposition, le plus récemment modifié',
    r38.length === 1 && r38[0].id === 'j2' && P.posteDeLaLigne(Li('Chape sèche', 'm2', 1), jumeaux).id === 'j2', json(r38.map((s) => s.id)));
  /* 39, 40 : devis.js et le miroir. */
  verifier('cas 39 : « indicatif », « INDICATIFS », « délai indicatif. » avertissent (`avertissementDelai`, sans `normalize`)',
    ['indicatif', 'INDICATIFS', 'délai indicatif.'].every((t) => D.avertissementDelai(t) !== null) && D.avertissementDelai('Sous 3 semaines') === null);
  verifier('cas 40 : le miroir — null rend null, « Chapes » à plat reste « chapes » (le pluriel est l’affaire de la clé), 2 001 « a » '
    + 'n’ont pas de clé', R.cleDeRapprochement(null) === null && R.aPlat(null) === null && R.aPlat('Chapes') === 'chapes'
    && R.cleDeRapprochement('a'.repeat(2001)) === null);
  /* 41 à 45 : ce que la version finale a corrigé. */
  const r41 = sugg({ postes: [], memoire: [Lm('a', 'Chape sèche avant carrelage collé', 'm2', 4500, 72), Lm('b', 'Chape sèche avant carrelage collé', 'm2', 5200, 2),
    Lm('c', 'Chape sèche avant carrelage collé', 'm2', null, 0.1)], texte: 'chape' });
  verifier('cas 41 : une ligne SANS prix, la plus récente, titre la proposition mais ne fait pas perdre le prix — un appui recopie 52 €, '
    + '« 52,00 € / m² · aussi 45,00 € »', r41.length === 1 && r41[0].ligneId === 'c'
    && json(r41[0].prix.map((p) => p.prixUnitaireCentimes)) === json([5200, 4500]) && P.valeursDeLaProposition(r41[0]).prixUnitaireCentimes === 5200
    && P.detailDeSuggestion(r41[0]) === `${eur('52,00')} / m² · aussi ${eur('45,00')}`, json(r41.map((s) => P.detailDeSuggestion(s))));
  const r42 = trouve('faience');
  verifier('cas 42 : « faience » — le forfait à 900,00 € (sa référence), puis « Pose de faïence murale » « sans réf. · dernier : 45,00 € / h », '
    + 'qu’un appui recopie à 45 €', r42.length === 2 && r42[0].id === 'p3' && r42[1].id === 'p2'
    && P.detailDeSuggestion(r42[0]) === `${eur('900,00')} / forfait · réf. du 14/10/2026`
    && P.detailDeSuggestion(r42[1]) === `sans réf. · dernier : ${eur('45,00')} / h` && P.valeursDeLaProposition(r42[1]).prixUnitaireCentimes === 4500,
  json(r42.map((s) => [s.id, P.detailDeSuggestion(s)])));
  const r43 = sugg({ postes: [Po('q1', 'Faïence murale, forfait pour une salle d’eau complète', 'forfait', 90000),
    Po('q2', 'Plan de travail posé sur tasseaux', 'm', 9000), Po('q3', 'Ragréage autolissant après pose du primaire', 'm2', 2800)],
  memoire: [Lm('g', 'Pose de carrelage mural 30x60', 'm2', 4000, 5)], texte: 'Pos' });
  verifier('cas 43 : « Pos » — la mémoire « Pose de carrelage… » (la phrase COMMENCE par le texte) devant les deux postes trouvés au milieu '
    + 'd’un mot ; jamais « … pour une salle d’eau »', json(r43.map((s) => [s.source, s.degre])) === json([['memoire', 4], ['base', 3], ['base', 3]])
    && !r43.some((s) => s.id === 'q1'), json(r43.map((s) => [s.source, s.designation, s.degre])));
  const r44 = sugg({ postes: quatreChapes, memoire: [Lm('h1', 'Chape sèche avant carrelage collé', 'm2', 4500, 1), Lm('h2', 'Chape fibrée sur isolant', 'm2', 3900, 300)], texte: 'chape' });
  verifier('cas 44 : quatre « Chape » — la sèche servie il y a une heure, puis la fibrée (300 h), puis l’anhydrite (l’ordre à plat)',
    json(r44.map((s) => s.id)) === json(['c4', 'c3', 'c1']), json(r44.map((s) => s.designation)));
  /* Cas 44 bis (25/10/2026, trouvé sur la VRAIE base avec un compte
     d'essai) : un « s » de trop ne range plus la bonne phrase derrière une
     voisine. La voisine, plus récente, contient toutes les lettres tapées ;
     la bonne phrase n'était trouvée que par sa clé. */
  const r44b = sugg({ postes: [Po('d1', 'Création de la dalle en béton y compris coulage manuel, finition talochée', 'm2', 7500,
    { modifieLe: '2026-10-25T10:36:00Z' }),
  Po('d2', 'CREATION DES DALLES EN BETON y compris coulage manuel finition talochée', 'm2', null, { modifieLe: '2026-10-25T10:50:00Z' })],
  memoire: [], texte: 'creation de la dalles' });
  verifier('cas 44 bis : « creation de la dalles » — « Création de la dalle en béton… » (degré 4) DEVANT « CREATION DES DALLES… » '
    + '(degré 2), même plus récente', json(r44b.map((s) => [s.id, s.degre])) === json([['d1', 4], ['d2', 2]]),
  json(r44b.map((s) => [s.id, s.degre])));
  const courts =['Les', 'Aux', 'Sas', 'Mes', 'Pas', 'oss'].map((t) => [t, trouve(t).length]);
  /* « Des » rend UNE proposition, celle des gravats. Depuis l'étape 4, la
     démonstration porte aussi « evacuation des gravats en dechetterie »,
     tapée vite et plus récente que « Évacuation… » : même clé, donc la
     même proposition, titrée par la phrase la plus RÉCENTE (la règle dite
     au propriétaire le 23/10). Le titre se compare donc À PLAT. */
  verifier('cas 45 : « Les », « Aux », « Sas », « Mes », « Pas », « oss » → aucune proposition ; « Des » → la seule proposition des '
    + 'gravats (titrée, depuis les trois lignes de l’étape 4, par la plus récente : « evacuation des gravats… ») ; « Évacuation des » '
    + 'trouve « Evacuation de gravats » ; « sous » ne trouve pas « soufflage », « Cons » pas « contre-cloison »',
  courts.every(([, n]) => n === 0) && trouve('Des').length === 1 && R.aPlat(trouve('Des')[0].designation).startsWith('evacuation des gravats')
    && D.correspondALaRecherche('Evacuation de gravats', 'Évacuation des') && !D.correspondALaRecherche('Isolation par soufflage', 'sous')
    && !D.correspondALaRecherche('Pose d’une contre-cloison', 'Cons'), json(courts));
  /* 46 à 50 : nommer, dire, ranger. */
  const fenetre = [Po('w1', 'Dépose fenêtre', 'forfait', 30000)];
  const l46 = Li('Dépose fenêtres', 'forfait', 90000);
  verifier('cas 46 : « Dépose fenêtres » sur le poste « Dépose fenêtre » — la référence NOMME le poste, l’écart se pose, `sous` n’est pas '
    + 'vide, et la phrase de sortie existe', D.cleDeLigne(l46) === D.cleDeLigne(fenetre[0])
    && phr(l46, fenetre) === `Votre prix de référence pour « Dépose fenêtre » : ${eur('300,00')} / forfait, fixé le 14/10/2026.`
    && !!ecart(l46, fenetre) && P.etatDansLaBase(l46, fenetre, 'ok').sous === 'Dépose fenêtre'
    && P.PHRASE_SORTIE === 'Ce n’est pas le même travail ? Changez un mot de la ligne (un s, un accent ou une majuscule ne suffit pas).'
    /* …et ce qu'elle dit est VRAI (TEXTES16) : un s, un accent, une
       majuscule laissent la ligne rapprochée du même poste. */
    && [Li('Dépose fenêtres', 'forfait', 1), Li('Depose fenetre', 'forfait', 1), Li('DÉPOSE FENÊTRE', 'forfait', 1)]
      .every((x) => D.cleDeLigne(x) === D.cleDeLigne(fenetre[0])),
  json(phr(l46, fenetre)));
  const r47 = sugg({ postes: POSTES, memoire: MEMOIRE2, texte: 'seuils' });
  verifier('cas 47 : le libellé VoiceOver de « seuils » dit d’abord le prix qu’un appui recopie, puis l’autre',
    r47.length === 1 && P.libelleDeSuggestion(r47[0]) === 'Reprendre : Seuil de porte en aluminium (fourniture seule, sans pose), par unité, '
      + `au prix de ${eur('25,00')}, déjà écrit dans Sol du séjour ; aussi écrit à ${eur('23,00')}`, r47[0] && P.libelleDeSuggestion(r47[0]));
  const nbsp48 = { designation: `Chape${NB}sèche avant carrelage collé${String.fromCharCode(0x200b)}` };
  const depose = MEMOIRE2.find((l) => l.designation === 'Depose de l’ancien carrelage au sol');
  verifier('cas 48 : une espace insécable au milieu et un U+200B à la fin ne font pas dire « sous » ; « Depose… » sans accent le fait '
    + 'dire, avec la phrase du poste', P.sousQuelPoste(nbsp48, chape) === null && !!depose
    && P.sousQuelPoste(depose, POSTES[4]) === 'Dépose de l’ancien carrelage au sol'
    && P.etatDansLaBase(depose, POSTES, 'ok').sous === 'Dépose de l’ancien carrelage au sol');
  const det = (memoire, texte) => {
    const s = sugg({ postes: [], memoire, texte })[0];
    return s ? P.detailDeSuggestion(s) : null;
  };
  const formes49 = [
    det([Lm('a', 'Chape', 'm2', 4500, 9), Lm('b', 'Chape', 'm2', 5000, 5), Lm('c', 'Chape', 'm2', 5200, 1)], 'chape'),
    det([Lm('a', 'Chape', 'm2', 4500, 9, { fournitureNonComprise: true }), Lm('b', 'Chape', 'm2', 3800, 1, { fournitureNonComprise: true })], 'chape'),
    det([Lm('a', 'Évacuation', 'forfait', 15000, 9), Lm('b', 'Évacuation', 'forfait', 18000, 1, { offert: true })], 'evacuation'),
    P.detailDeSuggestion({ source: 'base', ...POSTES[1], dernierPrix: null }),
    det([Lm('g', 'Pose de carrelage', 'm2', 4000, 5)], 'pose'),
  ];
  verifier('cas 49 : le détail sur UNE ligne — « +2 prix » ; « fourniture non comprise · +1 prix » ; « (offert) · aussi » ; « votre base, '
    + 'sans prix de référence » ; un seul prix : l’origine du lot 1',
  json(formes49) === json([`${eur('52,00')} / m² · +2 prix`, `${eur('38,00')} / m² · fourniture non comprise · +1 prix`,
    `${eur('180,00')} / forfait (offert) · aussi ${eur('150,00')}`, 'votre base, sans prix de référence', `${eur('40,00')} / m² · Devis g`]),
  json(formes49));
  const prepa = P.postesPrepares(POSTES);
  verifier('cas 50 : `postesPrepares` rend le MÊME objet pour le même tableau (les clés ne se recalculent pas à chaque frappe), et un '
    + 'tableau neuf en refait un', prepa === P.postesPrepares(POSTES) && prepa !== P.postesPrepares([...POSTES])
    && prepa.every((p, i) => p.cle === D.cleDeLigne(POSTES[i])) && P.postesPrepares(null).length === 0);
  verifier('le tri de la page range par la phrase à PLAT, puis l’identifiant — « Évacuation » avec les « e », jamais après « z »',
    json(P.trierPostes([Po('b', 'Zinc', 'u', 1), Po('a', 'Évacuation', 'u', 1), Po('c', 'evacuation', 'u', 1), Po('d', 'Dalle', 'u', 1)]).map((p) => p.id))
      === json(['d', 'a', 'c', 'b']));
} catch (e) {
  verifier('les 51 cas du cahier se font tourner jusqu’au bout : le calcul ne PLANTE sur aucun', false, e && e.stack);
}

/* ---- (13 bis) le cache des clés se VÉRIFIE ---------------------------------- */
{
  /* `devis.js` garde la clé de chaque ligne (un `WeakMap` sur l'objet) pour
     ne pas la recalculer à chaque frappe. Une ligne modifiée SUR LE MÊME
     OBJET — sa phrase, son unité, sa fourniture — doit rendre sa NOUVELLE
     clé : une clé périmée rapprocherait la ligne d'un poste qui n'est plus
     le sien, sans un mot. */
  const l = { id: 'm', type: 'poste', designation: 'Chape sèche', unite: 'm2', fournitureNonComprise: false, prixUnitaireCentimes: 1 };
  const avant = D.cleDeLigne(l);
  l.designation = 'Dalle béton';
  const apresPhrase = D.cleDeLigne(l);
  l.unite = 'u';
  const apresUnite = D.cleDeLigne(l);
  l.fournitureNonComprise = true;
  const apresFourniture = D.cleDeLigne(l);
  const neuve = (o) => D.cleDeLigne({ ...o });
  const trouveApres = D.memoireDesLignes([l], 'dalle').length === 1 && D.memoireDesLignes([l], 'chape').length === 0;
  verifier('la clé d’une ligne modifiée SUR LE MÊME OBJET (phrase, unité, fourniture) est recalculée — le cache ne rend jamais une '
    + 'clé périmée, et la mémoire cherche dans la phrase du moment',
  avant === neuve({ designation: 'Chape sèche', unite: 'm2' }) && apresPhrase === neuve({ designation: 'Dalle béton', unite: 'm2' })
    && apresUnite === neuve({ designation: 'Dalle béton', unite: 'u' })
    && apresFourniture === neuve({ designation: 'Dalle béton', unite: 'u', fournitureNonComprise: true }) && trouveApres,
  json([avant, apresPhrase, apresUnite, apresFourniture, trouveApres]));
  const gele = Object.freeze({ designation: 'Seuils', unite: 'u' });
  verifier('…et une ligne GELÉE (`Object.freeze`) a sa clé comme les autres', D.cleDeLigne(gele) === neuve(gele)
    && D.cleDeLigne(null) === json([null, null, false]) && D.cleDeLigne('texte') === json([null, null, false]));
}

/* ---- (14) la forme visible, sur chaque point de code --------------------- */
{
  /* Les deux listes du cahier (§3.2), écrites ici par leurs points de code :
     un blanc se ramène à UNE espace, un invisible disparaît, tout le reste
     se garde. Éprouvé sur TOUT Unicode, pas sur trois exemples. */
  const plage = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const BLANCS_V = new Set([...plage(0x09, 0x0d), 0x20, 0x85, 0xa0, 0x1680, ...plage(0x2000, 0x200a), 0x2028, 0x2029, 0x202f, 0x205f, 0x3000]);
  const INVIS = new Set([0xad, 0x180e, ...plage(0x200b, 0x200f), ...plage(0x202a, 0x202e), ...plage(0x2060, 0x2064), ...plage(0x2066, 0x2069),
    ...plage(0xfe00, 0xfe0f), 0xfeff]);
  const faux = [];
  for (let n = 1; n <= 0x10ffff; n += 1) {
    if (n >= 0xd800 && n <= 0xdfff) continue;
    const c = String.fromCodePoint(n);
    const attendu = BLANCS_V.has(n) ? 'a b' : INVIS.has(n) ? 'ab' : `a${c}b`;
    if (P.formeVisible(`a${c}b`) !== attendu || P.formeVisible(`${c}x${c}`) !== (BLANCS_V.has(n) || INVIS.has(n) ? 'x' : `${c}x${c}`)) {
      faux.push(nomCar(c));
      if (faux.length > 5) break;
    }
  }
  verifier('`formeVisible`, sur chaque point de code : les blancs du cahier se ramènent à une espace, les invisibles disparaissent, '
    + 'le reste se garde — et les bords se rognent', faux.length === 0 && P.formeVisible(`  a ${NB} b  `) === 'a b' && P.formeVisible(null) === '',
  faux.join(' '));
}

/* ---- (15) le balayage, et ses témoins (cas 51) --------------------------- */
try {
  /* La mémoire de démonstration, ses trois lignes de « Sol du séjour », et
     quatre variantes de chaque ligne (majuscules, minuscules, un s final,
     les accents retirés) ; puis chaque début de mot de trois lettres et plus
     de chaque phrase rangée. Sur CHACUN de ces textes, la liste tient ses
     propriétés — pas trois exemples choisis. */
  const variantes = [];
  let n = 0;
  for (const l of MEMOIRE2.filter((x) => ['poste', 'option'].includes(x.type))) {
    for (const f of [(s) => s.toUpperCase(), (s) => s.toLowerCase(), (s) => `${s}s`, (s) => s.replace(/é/g, 'e').replace(/è/g, 'e')]) {
      variantes.push({ ...l, id: `v${n}`, designation: f(l.designation), modifieLe: ilDemo((n += 1) / 10) });
    }
  }
  const memoire = [...MEMOIRE2, ...variantes, Lm('tiret', '—', 'u', 100, 1)];
  const rangees = new Set([...memoire.map((l) => D.texteNet(l.designation)), ...POSTES.map((p) => p.designation)]);
  const textes = new Set();
  for (const x of rangees) for (const mot of String(x).split(/\s+/)) for (let k = 3; k <= mot.length; k += 1) textes.add(mot.slice(0, k));
  const clesPostes = new Set(POSTES.map((p) => D.cleDeLigne(p)));
  const fautes = [];
  let maxi = 0;
  for (const t of textes) {
    const r = sugg({ postes: POSTES, memoire, texte: t });
    maxi = Math.max(maxi, r.length);
    const cles = r.map((s) => s.cle);
    const quoi = [];
    if (r.length > 3) quoi.push('plus de trois');
    if (new Set(cles).size !== cles.length) quoi.push('une clé en double');
    if (r.some((s) => s.source === 'memoire' && clesPostes.has(s.cle))) quoi.push('une mémoire de la clé d’un poste');
    if (r.some((s) => !rangees.has(s.designation) || P.valeursDeLaProposition(s).designation !== s.designation)) quoi.push('un titre qui n’est pas une phrase rangée');
    if (r.some((s) => s.cle !== D.cleDeLigne(s))) quoi.push('une `cle` qui n’est pas celle de sa phrase');
    if (r.some((s) => s.prix && (s.prix.length > 3 || s.prix.some((p) => !(Number.isSafeInteger(p.prixUnitaireCentimes) && p.prixUnitaireCentimes > 0))
      || new Set(s.prix.map((p) => p.prixUnitaireCentimes)).size !== s.prix.length))) quoi.push('des prix inutilisables ou répétés');
    if (r.some((s) => s.designation === '—')) quoi.push('« — »');
    /* CE QUE L'ÉCRAN AFFICHE EN MORCEAUX (le prix recopié par `Montant`, le
       reste en gris) se recoud en `detailDeSuggestion`, octet pour octet,
       et le prix mis en avant est celui qu'un appui recopie. */
    if (r.some((s) => {
      const m = P.morceauxDuDetail(s);
      const v = P.valeursDeLaProposition(s);
      const recopie = v && Number.isSafeInteger(v.prixUnitaireCentimes) && v.prixUnitaireCentimes > 0 ? v.prixUnitaireCentimes : null;
      return `${m.avant}${m.prix == null ? '' : CT.centimesLisibles(m.prix)}${m.apres}` !== P.detailDeSuggestion(s)
        || m.prix !== recopie;
    })) quoi.push('un détail affiché en morceaux qui ne se recoud pas, ou qui met en avant un autre prix que celui recopié');
    if (quoi.length) fautes.push(`« ${t} » : ${quoi.join(', ')}`);
  }
  verifier(`cas 51 : le balayage — ${textes.size} textes (chaque début de mot de chaque phrase rangée, ${variantes.length} variantes) : `
    + 'au plus 3 propositions, aucune clé en double, aucune mémoire de la clé d’un poste, chaque titre une phrase RANGÉE octet pour '
    + 'octet (ce qu’un appui recopie aussi), des prix utilisables, distincts, trois au plus ; et le détail que l’écran affiche en '
    + 'morceaux (`morceauxDuDetail`) se recoud en `detailDeSuggestion`, autour du prix qu’un appui recopie',
  textes.size >= 400 && fautes.length === 0, `${fautes.length} faute(s) : ${fautes.slice(0, 4).join(' | ')} ; au plus ${maxi}`);
  /* LE TÉMOIN POSITIF : sans lui, une liste cassée qui ne propose plus rien
     passerait « au plus trois ». */
  const pos = sugg({ postes: POSTES, memoire, texte: 'Pos' });
  verifier('…et le TÉMOIN : « Pos » rend EXACTEMENT trois propositions (une liste vide passerait « au plus trois »)', pos.length === 3,
    `${pos.length} : ${json(pos.map((s) => s.designation))}`);
  /* LES MOTS COURTS ne rendent que ce qui CONTIENT ce qu'on a tapé : leur
     clé (« le », « sa ») est dans presque toutes les phrases. */
  const contient = ['Les', 'Sas', 'oss', 'Aux', 'Mes'].map((t) => [t, sugg({ postes: POSTES, memoire, texte: t })
    .filter((s) => !(R.aPlat(s.designation) || '').includes(R.aPlat(t)))]);
  verifier('…et « Les », « Sas », « oss », « Aux », « Mes » ne rendent que des phrases qui CONTIENNENT ces lettres',
    contient.every(([, x]) => x.length === 0), json(contient.filter(([, x]) => x.length).map(([t, x]) => [t, x.map((s) => s.designation)])));
} catch (e) {
  verifier('le balayage se fait tourner jusqu’au bout : le calcul ne PLANTE sur aucun texte', false, e && e.stack);
}

/* ---- (16) la date, dans trois fuseaux, des deux côtés de minuit (cas 20) -- */
{
  const FUSEAUX = ['Europe/Paris', 'America/Martinique', 'Pacific/Kiritimati'];
  const resultats = FUSEAUX.map((tz) => {
    const r = spawnSync(process.execPath, [ICI, '--fuseau'], { encoding: 'utf8', env: { ...process.env, TZ: tz } });
    try { return JSON.parse(r.stdout); } catch { return { tz, plante: `${r.stderr || r.stdout}`.slice(0, 400) }; }
  });
  for (const r of resultats) {
    verifier(`cas 20, ${r.tz} : « fixé le », « réf. du » et l’origine d’un poste écrivent la date du TÉLÉPHONE `
      + `(un horodatage de 00 h 30 à Paris)${r.tz === 'Europe/Paris' ? ' — à Paris, le 14/10/2026, pas la veille' : ''}`,
    !r.plante && r.faux && r.faux.length === 0 && r.cas >= 3 && (r.tz !== 'Europe/Paris' || r.date === '14/10/2026'),
    r.plante || json(r.faux));
  }
}

/* ================================================================== */
/*  LES LECTEURS DU SQL                                                 */
/* ================================================================== */

/* Le SQL SANS SES COMMENTAIRES, par un lecteur qui respecte les chaînes
   ('…' à apostrophe doublée) : un nom de table cité dans un commentaire ne
   compte pas, un « -- » dans une chaîne n'est pas un commentaire. La
   section 50 ne contient aucune barre oblique inverse, donc aucune chaîne
   E'…' à lire autrement. */
function sqlSansCommentaires(t) {
  let s = '';
  let i = 0;
  while (i < t.length) {
    const c = t[i];
    const su = t[i + 1];
    if (c === '-' && su === '-') { while (i < t.length && t[i] !== '\n') i += 1; continue; }
    if (c === '/' && su === '*') { const f = t.indexOf('*/', i + 2); i = f < 0 ? t.length : f + 2; s += ' '; continue; }
    if (c === "'") {
      let j = i + 1;
      while (j < t.length) {
        if (t[j] === "'" && t[j + 1] === "'") { j += 2; continue; }
        if (t[j] === "'") break;
        j += 1;
      }
      s += t.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    s += c;
    i += 1;
  }
  return s;
}
const plat = (t) => (t || '').replace(/\s+/g, ' ').trim();

/* UNE SECTION DE `schema.sql`, du titre donné au PROCHAIN titre de section.
   Un titre, c'est « -- », EXACTEMENT deux espaces, un nombre, un point, une
   espace (le modèle de `sectionDuSchema`, `verifier-emetteur`) : un
   sous-titre (« 50.4 ») a un chiffre après le point, et une liste numérotée
   de commentaire (« --    1. ») a quatre espaces. */
function sectionBrute(brut, titre) {
  const i = brut.search(titre);
  if (i < 0) return { debut: -1, fin: -1, texte: '' };
  const suite = /^-- {2}\d+\. /gm;
  suite.lastIndex = i + 1;
  const m = suite.exec(brut);
  const fin = m ? m.index : brut.length;
  return { debut: i, fin, texte: brut.slice(i, fin) };
}

/* Une concaténation de littéraux '…' et de chr(n), ÉVALUÉE ; `null` pour
   toute autre forme — elle est alors « différente », jamais ignorée. */
function evaluerConcat(e) {
  const termes = e.match(/'(?:[^']|'')*'|chr\(\d+\)/g) || [];
  const reste = e.replace(/'(?:[^']|'')*'|chr\(\d+\)/g, '').replace(/\|\||\s/g, '');
  if (reste !== '' || termes.length === 0) return null;
  return termes.map((x) => (x.startsWith('chr(') ? String.fromCodePoint(Number(x.slice(4, -1))) : x.slice(1, -1).replace(/''/g, "'"))).join('');
}

/* Le corps et les attributs d'une fonction `create or replace function
   public.<nom>(` d'un texte SANS commentaires : ce qui précède `as $$`, et
   ce qui est entre les deux `$$`. */
function fonctionSql(texte, nom) {
  const i = texte.search(new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${nom}\\s*\\(`, 'i'));
  if (i < 0) return null;
  const a = texte.indexOf('as $$', i);
  const b = a < 0 ? -1 : texte.indexOf('$$', a + 5);
  if (a < 0 || b < 0) return null;
  return { index: i, attributs: texte.slice(i, a), corps: texte.slice(a + 5, b) };
}

/* ================================================================== */
/*  B. LE SCHÉMA — la section 50                                        */
/* ================================================================== */
console.log('\nB. LE SCHÉMA — la section 50, lue sans ses commentaires (sauf ce qui se juge sur le texte brut)');

/* `devis.js` et `postes.js` sont ouverts en tête (« CE QUI S'OUVRE ») :
   s'ils ne s'ouvrent pas, le contrôle s'est déjà arrêté en échec. B compare
   donc TOUJOURS `CONTRAINTES_POSTE` et `POSTES_MAX` à la base. */

const SCHEMA_BRUT = lire('supabase/schema.sql');
const S50B = sectionBrute(SCHEMA_BRUT, /^-- {2}50\. LA BASE DE POSTES/m);
const S50 = sqlSansCommentaires(S50B.texte);
const iS49 = SCHEMA_BRUT.search(/^-- {2}49\. /m);
const iS42 = SCHEMA_BRUT.search(/^-- {2}42\. /m);
const SQL_ENTIER = sqlSansCommentaires(SCHEMA_BRUT);

{
  verifier('la section 50 existe, APRÈS la 49 et AVANT le titre de la 42 (l’export doit pouvoir nommer sa table)',
    S50B.debut > 0 && iS49 > 0 && S50B.debut > iS49 && iS42 > S50B.debut && S50B.fin === iS42 && S50.length > 3000,
    `49 à ${iS49}, 50 de ${S50B.debut} à ${S50B.fin}, 42 à ${iS42}`);

  /* -- LE TEXTE BRUT : aucune barre oblique inverse, nulle part ---------- */
  const barres = [...S50B.texte].filter((c) => c === BARRE).length;
  verifier('AUCUNE barre oblique inverse dans toute la section, commentaires compris — donc aucune séquence que l’outil '
    + 'd’écriture ou le transport du connecteur changerait', barres === 0, `${barres} barre(s)`);

  /* -- L'ASCII : le code ne porte que la phrase d'OP018 hors de l'ASCII -- */
  const sansCommentOn = S50.replace(/comment\s+on\s+(?:table|column|function)\s+[^;]*?\bis\s+(?:'(?:[^']|'')*'\s*)+;/gi, ' ');
  const op018 = (/raise\s+exception\s+'((?:[^']|'')*)'\s+using\s+errcode\s*=\s*'OP018'/i.exec(S50) || [])[1] || '';
  const horsAscii = [...sansCommentOn.replace(op018, '')].filter((c) => c.codePointAt(0) > 127);
  verifier('dans le CODE de la section (hors commentaires et `comment on`), aucun caractère hors de l’ASCII sauf ceux de la phrase '
    + 'd’OP018 : la table, les blancs, le pluriel s’écrivent chr(n)', op018.length > 0 && horsAscii.length === 0,
  `${horsAscii.length} caractère(s) : ${[...new Set(horsAscii)].slice(0, 8).map(nomCar).join(' ')}`);

  /* -- LA FONCTION DE LA CLÉ, AVANT LA TABLE ------------------------------ */
  const fCle = fonctionSql(S50, 'cle_de_rapprochement');
  const iTable = S50.search(/create\s+table\s+if\s+not\s+exists\s+public\.base_postes\s*\(/i);
  const attrCle = plat(fCle ? fCle.attributs : '').toLowerCase();
  verifier('`public.cle_de_rapprochement(p_phrase text)` naît AVANT la table et son déclencheur, qui l’appelle : `language sql`, '
    + '`immutable`, `strict`, `parallel safe`, `security invoker`, `set search_path = public`',
  !!fCle && iTable > fCle.index && /\(p_phrase text\) returns text\b/.test(attrCle)
    && ['language sql', 'immutable', 'strict', 'parallel safe', 'security invoker', 'set search_path = public'].every((x) => attrCle.includes(x))
    && !attrCle.includes('security definer'), attrCle.slice(0, 200));
  const interditsSql = ['lower(', 'upper(', 'initcap(', 'unaccent', 'normalize', 'collate', 'ilike', '~*', '[[:'];
  const trouvesSql = fCle ? interditsSql.filter((x) => fCle.corps.toLowerCase().includes(x)) : interditsSql;
  verifier('son corps n’appelle ni lower, ni upper, ni initcap, ni unaccent, ni normalize, ni collate, ni ilike, ni ~*, ni [[:…:]]',
    !!fCle && trouvesSql.length === 0, `trouvé : ${trouvesSql.join(', ')}`);
  /* L'ÉGALITÉ OCTET POUR OCTET : ce qui est rangé entre les repères est ce
     que rend le générateur depuis la table du miroir — la même chose que
     `npm run generer-rapprochement -- --verifier`. */
  let bloc = '';
  try { bloc = G.blocEngendre(G.engendrerFonction(R)); } catch (e) { bloc = ''; }
  const occurrences = bloc ? SCHEMA_BRUT.split(bloc).length - 1 : 0;
  verifier('le bloc entre les repères est, OCTET POUR OCTET, celui que rend `generer-rapprochement` (une fois, dans la section 50)',
    bloc.length > 10000 && occurrences === 1 && S50B.texte.includes(bloc),
    `${occurrences} occurrence(s) — la fonction a été retouchée à la main, ou la table a changé sans relancer `
    + '`npm run generer-rapprochement`');
  verifier('…et son droit : `revoke all … from public, anon` puis `grant execute … to authenticated` — par NÉCESSITÉ (le déclencheur, '
    + '`security invoker`, l’appelle avec les droits de celui qui écrit), et rien ne le retire à `authenticated`',
  /revoke\s+all\s+on\s+function\s+public\.cle_de_rapprochement\(text\)\s+from\s+public\s*,\s*anon\s*;/i.test(S50)
    && /grant\s+execute\s+on\s+function\s+public\.cle_de_rapprochement\(text\)\s+to\s+authenticated\s*;/i.test(S50)
    && !/revoke[^;]*cle_de_rapprochement[^;]*\bauthenticated\b/i.test(SQL_ENTIER));

  /* -- LA TABLE : douze colonnes, une liste FERMÉE ------------------------- */
  const corpsTable = (/create\s+table\s+if\s+not\s+exists\s+public\.base_postes\s*\(([\s\S]*?)\n\);/i.exec(S50) || [])[1] || '';
  /* Une colonne, c'est une ligne indentée de DEUX espaces ; la suite d'une
     clause (`references …` de la contrainte composée) en a quatre. */
  const colonnes = corpsTable.split('\n').filter((l) => /^ {2}[a-z_]+\s/.test(l)).map((l) => plat(l).replace(/,$/, ''))
    .filter((l) => !/^constraint\s/i.test(l))
    .map((l) => { const [nom, type] = l.split(/\s+/); return `${nom} ${type}${/\bnot\s+null\b|\bprimary\s+key\b/i.test(l) ? ' +' : ''}`; });
  const FERMEE = ['id uuid +', 'pro_id uuid +', 'designation text', 'cle_rapprochement text', 'unite text',
    'fourniture_non_comprise boolean +', 'main_oeuvre boolean +', 'prix_reference_centimes bigint', 'prix_fixe_le timestamptz',
    'devis_origine_id uuid', 'created_at timestamptz +', 'modifie_le timestamptz +'];
  verifier(`\`base_postes\` : exactement ses ${FERMEE.length} colonnes, dans l’ordre, types et « not null » compris (aucune colonne `
    + 'sans lecteur : ni taux, ni métier, ni région, ni client)', JSON.stringify(colonnes) === JSON.stringify(FERMEE),
  `lues : ${colonnes.join(', ')}`);
  const ajouts = [...SQL_ENTIER.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?public\.base_postes\b([^;]*);/gi)]
    .flatMap((m) => [...m[1].matchAll(/\badd\b(?!\s+constraint\s+\w+\s+check\b)\s*[^,;]*/gi)].map((a) => plat(a[0])));
  verifier('…et rien ne s’y ajoute plus bas : sur cette table, le seul `add` est `add constraint <nom> check`', ajouts.length === 0,
    ajouts.join(' | '));
  /* PLUS AUCUNE COLONNE GÉNÉRÉE (relecture « base », BASE1, 24/10/2026) :
     PostgreSQL recalcule toute colonne générée stockée à CHAQUE modification
     d'une table qui porte un déclencheur `before update` — un prix changé,
     la cascade d'un devis supprimé —, 999 appels et 60 s pour 999 postes de
     pire cas. La clé est une colonne ORDINAIRE que le déclencheur pose ; les
     propriétés de ce qu'il en fait sont lues plus bas, et JOUÉES par l'essai
     50 (cas 19, 20, 21 et 21 ter). */
  verifier('`cle_rapprochement` est une colonne ORDINAIRE (`text`, rien d’autre), et aucune colonne de `base_postes` n’est générée : '
    + 'une colonne générée se recalcule à CHAQUE modification d’une table qui porte un déclencheur `before update`',
  /^\s*cle_rapprochement\s+text\s*,\s*$/im.test(corpsTable) && !/\bgenerated\b/i.test(corpsTable));
  verifier('…et une base d’essai qui l’avait GÉNÉRÉE la voit redevenir ordinaire, ses valeurs gardées : '
    + '`alter column cle_rapprochement drop expression if exists`, après la table',
  /alter\s+table\s+public\.base_postes\s+alter\s+column\s+cle_rapprochement\s+drop\s+expression\s+if\s+exists\s*;/i.test(S50)
    && S50.search(/drop\s+expression\s+if\s+exists/i) > iTable);
  verifier('`pro_id` → `professional_profiles(id) on delete cascade` : le compte part, ses postes avec lui',
    /pro_id\s+uuid\s+not\s+null\s+references\s+public\.professional_profiles\(id\)\s+on\s+delete\s+cascade\s*,/i.test(corpsTable));
  verifier('le lien d’origine est une clé COMPOSÉE vers `devis (id, pro_id)`, en `on delete set null (devis_origine_id)` — AVEC sa '
    + 'liste de colonnes (sans elle, supprimer le devis voudrait vider `pro_id`)',
  /constraint\s+base_postes_devis_origine_fkey\s+foreign\s+key\s+\(devis_origine_id,\s*pro_id\)\s+references\s+public\.devis\s+\(id,\s*pro_id\)\s+on\s+delete\s+set\s+null\s+\(devis_origine_id\)/i.test(corpsTable)
    && !/references\s+public\.devis\s*\(id\)/i.test(corpsTable));
  verifier('l’index unique `idx_devis_id_pro` sur `devis (id, pro_id)` — la cible de la clé composée, et un index, pas une contrainte',
    /create\s+unique\s+index\s+if\s+not\s+exists\s+idx_devis_id_pro\s+on\s+public\.devis\s+\(id,\s*pro_id\)\s*;/i.test(S50));

  /* -- LES CONTRAINTES ------------------------------------------------------ */
  const checks = [...S50.matchAll(/alter\s+table\s+public\.base_postes\s+add\s+constraint\s+(\w+)\s+check\s*\(([\s\S]*?)\);\s*(?=alter|comment|create|revoke|grant|drop|$)/gi)]
    .map((m) => ({ nom: m[1], regle: plat(m[2]) }));
  const noms = checks.map((c) => c.nom);
  const ATTENDUES = ['base_poste_designation_check', 'base_poste_prix_check', 'base_poste_prix_date_check',
    'base_poste_rapprochement_check', 'base_poste_unite_check'];
  verifier('cinq contraintes, toutes en `_check`, écrites dans l’ORDRE ALPHABÉTIQUE (l’ordre où PostgreSQL les nomme)',
    JSON.stringify(noms) === JSON.stringify(ATTENDUES) && JSON.stringify([...noms].sort()) === JSON.stringify(noms),
    `lues : ${noms.join(', ')}`);
  const sansDrop = noms.filter((n) => !new RegExp(`alter\\s+table\\s+public\\.base_postes\\s+drop\\s+constraint\\s+if\\s+exists\\s+${n}\\s*;`, 'i').test(S50));
  verifier('…chacune précédée de son `drop constraint if exists` (le schéma se rejoue, et une contrainte se REFAIT)', sansDrop.length === 0,
    sansDrop.join(', '));
  verifier('…et ses noms sont `CONTRAINTES_POSTE` (postes.js), dans le même ordre : `validerPoste()` teste comme la base',
    Array.isArray(P.CONTRAINTES_POSTE) && JSON.stringify(P.CONTRAINTES_POSTE) === JSON.stringify(noms),
    `postes.js : ${JSON.stringify(P.CONTRAINTES_POSTE)}`);
  const regle = (n) => (checks.find((c) => c.nom === n) || {}).regle || '';
  const unites = D ? D.UNITES.map((u) => `'${u.cle}'`).join(', ') : '?';
  verifier('les règles, exactes : la phrase de 1 à LONGUEUR_MAX caractères ; un prix NULL ou de 1 à 9 999 999 999, jamais 0 ; '
    + 'la date du prix vide si et seulement si le prix l’est ; une clé non vide ; l’unité OBLIGATOIRE, parmi les sept du lot 1',
  regle('base_poste_designation_check') === `designation is not null and char_length(designation) between 1 and ${R.LONGUEUR_MAX}`
    && regle('base_poste_prix_check') === 'prix_reference_centimes is null or prix_reference_centimes between 1 and 9999999999'
    && regle('base_poste_prix_date_check') === '(prix_reference_centimes is null) = (prix_fixe_le is null)'
    && regle('base_poste_rapprochement_check') === "cle_rapprochement is null or cle_rapprochement <> ''"
    && regle('base_poste_unite_check') === `unite is not null and unite in (${unites})`,
  checks.map((c) => `${c.nom} : ${c.regle}`).join(' | '));

  /* -- LE DÉCLENCHEUR -------------------------------------------------------- */
  const fPoste = fonctionSql(S50, 'tient_le_poste');
  const attrPoste = plat(fPoste ? fPoste.attributs : '').toLowerCase();
  const corps = plat(fPoste ? fPoste.corps : '');
  verifier('`tient_le_poste()` : `returns trigger`, `language plpgsql`, `security invoker` (en `definer`, un autre artisan apprendrait '
    + 'que la base de A est pleine), `set search_path = public`',
  !!fPoste && ['returns trigger', 'language plpgsql', 'security invoker', 'set search_path = public'].every((x) => attrPoste.includes(x))
    && !/security\s+definer/i.test(S50), attrPoste.slice(0, 160));
  const iIns = corps.indexOf("if tg_op = 'INSERT' then");
  const iMod = corps.indexOf('new.id := old.id;');
  const insertion = iIns >= 0 && iMod > iIns ? corps.slice(iIns, iMod) : '';
  const modification = iMod > 0 ? corps.slice(iMod) : '';
  const uids = [...corps.matchAll(/auth\.uid\(\)/g)].map((m) => m.index);
  verifier('`auth.uid()` ne se lit QUE dans la branche d’insertion (en modification, pendant une cascade, c’est celui de quelqu’un d’autre)',
    uids.length >= 1 && insertion.length > 0 && uids.every((x) => x > iIns && x < iMod), `${uids.length} lecture(s), insertion de ${iIns} à ${iMod}`);
  /* « SANS JETON » SE DÉCIDE SUR LE RÔLE (relecture « base », BASE5) : une
     session `authenticated` sans `sub` a `auth.uid()` vide, et elle prenait
     le verrou de n'importe quelle entreprise. */
  const BLOC_PLAFOND = "if auth.uid() is null then v_compter := current_user not in ('anon', 'authenticated'); "
    + 'else v_compter := public.est_mon_entreprise(new.pro_id); end if; '
    + "if v_compter then perform pg_advisory_xact_lock(hashtextextended('base_postes:' || new.pro_id::text, 0)); "
    + 'if (select count(*) from public.base_postes b where b.pro_id = new.pro_id) >= v_plafond_postes then raise exception';
  verifier('le verrou et le compte ne sont pris que pour SA propre entreprise — ou pour un rôle qui n’est pas un client (`anon`, '
    + '`authenticated`) —, les deux `if` IMBRIQUÉS, et le verrou AVANT le compte', insertion.includes(BLOC_PLAFOND)
    && insertion.indexOf('pg_advisory_xact_lock') < insertion.indexOf('select count(*) from public.base_postes')
    && (corps.match(/pg_advisory_xact_lock/g) || []).length === 1 && (corps.match(/count\(\*\)/g) || []).length === 1,
  'un étranger qui écrit au nom de A ne doit ni prendre son verrou, ni payer son compte (cahier §2.4, T20)');
  const plafond = Number((/v_plafond_postes\s+constant\s+integer\s*:=\s*(\d+)\s*;/i.exec(corps) || [])[1]);
  const chiffres = op018.replace(/[^0-9]/g, '');
  verifier('la phrase d’OP018 écrit le plafond EN TOUTES LETTRES (« 1 000 », une espace ordinaire), sans `%`, et ses chiffres valent '
    + '`v_plafond_postes` — jamais `v_plafond`, que `verifier-devis` lit pour OP017',
  plafond === 1000 && chiffres === String(plafond) && op018.includes('1 000') && !op018.includes('%')
    && !/\bv_plafond\s+constant\b/i.test(S50), `phrase « ${op018} », constante ${plafond}`);
  verifier('…et `POSTES_MAX` (postes.js) vaut le même nombre', P.POSTES_MAX === plafond, `POSTES_MAX = ${P.POSTES_MAX}`);
  verifier('en modification, l’identifiant, l’entreprise et la date de création sont FIGÉS, le lien d’origine ne peut que disparaître, '
    + 'et `modifie_le` ne bouge que pour une écriture DIRECTE (`pg_trigger_depth() = 1`)',
  modification.startsWith('new.id := old.id; new.pro_id := old.pro_id; new.created_at := old.created_at; '
    + 'new.devis_origine_id := case when new.devis_origine_id is null then null else old.devis_origine_id end;')
    && /if pg_trigger_depth\(\) = 1 then new\.modifie_le := clock_timestamp\(\); else new\.modifie_le := old\.modifie_le; end if;/.test(modification),
  modification.slice(0, 200));
  verifier('les dates par `clock_timestamp()`, jamais `now()` (l’heure du DÉBUT de la transaction)',
    /new\.created_at := clock_timestamp\(\);/.test(insertion) && !/\bnow\(\)/i.test(corps));
  const blancs = (/new\.designation := nullif\(btrim\(coalesce\(new\.designation, ''\), (.*?)\), ''\);/.exec(corps) || [])[1];
  const jeuSql = blancs ? evaluerConcat(blancs) : null;
  const jeuJs = D ? [...new Set(D.BLANCS)].sort().join('') : null;
  verifier('la phrase est rognée par la classe de blancs du projet, écrite en chr(n) — la HUITIÈME copie, ÉVALUÉE et égale à `BLANCS` '
    + '(devis.js)', jeuSql !== null && jeuJs !== null && [...new Set(jeuSql)].sort().join('') === jeuJs,
  `section 50 : ${jeuSql === null ? 'illisible' : [...jeuSql].map(nomCar).join(' ')}`);
  /* LA CLÉ, POSÉE PAR LE DÉCLENCHEUR : calculée pour TOUTE insertion (en
     tête de la branche, avant le verrou — une ligne rangée sans clé passerait
     à côté de l'index du doublon), recalculée SEULEMENT quand la phrase
     change, et une clé ÉCRITE n'est acceptée que si elle est exactement son
     recalcul (la réécriture du contrat, 50.0). Ce qui se lit ici est la
     forme ; la propriété est JOUÉE par l'essai 50 (19a, 19b, 19b bis, 21,
     21 ter : un prix, une cascade, 0 appel). */
  const CLE_INSERTION = "if tg_op = 'INSERT' then v_cle := public.cle_de_rapprochement(new.designation); "
    + 'if new.cle_rapprochement is not null and new.cle_rapprochement is distinct from v_cle then raise exception ';
  const CLE_MODIFICATION = 'if new.cle_rapprochement is distinct from old.cle_rapprochement then '
    + 'if new.cle_rapprochement is distinct from public.cle_de_rapprochement(new.designation) then raise exception ';
  const CLE_PHRASE = 'elsif new.designation is distinct from old.designation then '
    + 'new.cle_rapprochement := public.cle_de_rapprochement(new.designation); end if;';
  const iCle = insertion.indexOf('new.cle_rapprochement := v_cle;');
  verifier('à l’INSERTION, la clé est calculée en TÊTE de la branche, pour qui que ce soit (avant le verrou et hors de tout `if`), '
    + 'et une clé envoyée qui n’est pas la sienne est refusée par 428C9 avant d’être remplacée',
  insertion.startsWith(CLE_INSERTION) && iCle > 0 && iCle < insertion.indexOf('pg_advisory_xact_lock')
    && /raise exception '(?:[^']|'')*' using errcode = '428C9'; end if; new\.cle_rapprochement := v_cle;/.test(insertion),
  insertion.slice(0, 260));
  verifier('à la MODIFICATION, la clé n’est recalculée que si la phrase CHANGE (`is distinct from`), et une clé ÉCRITE n’est acceptée '
    + 'que si elle est EXACTEMENT son recalcul (428C9 sinon) — jamais pour un prix, jamais pendant une cascade',
  modification.includes(CLE_MODIFICATION) && modification.includes(CLE_PHRASE)
    && /using errcode = '428C9'; end if; elsif new\.designation is distinct from old\.designation then/.test(modification),
  modification.slice(0, 400));
  verifier('…et nulle part ailleurs : trois appels à la fonction dans le corps, deux affectations de la clé, deux refus 428C9',
    (corps.match(/cle_de_rapprochement\(/g) || []).length === 3 && (corps.match(/new\.cle_rapprochement\s*:=/g) || []).length === 2
      && (corps.match(/errcode = '428C9'/g) || []).length === 2,
  `${(corps.match(/cle_de_rapprochement\(/g) || []).length} appel(s), ${(corps.match(/new\.cle_rapprochement\s*:=/g) || []).length} affectation(s)`);
  verifier('le déclencheur est posé sous son nom, en `create or replace trigger`, avant insertion et modification',
    /create\s+or\s+replace\s+trigger\s+trg_tient_le_poste\s+before\s+insert\s+or\s+update\s+on\s+public\.base_postes\s+for\s+each\s+row\s+execute\s+function\s+public\.tient_le_poste\(\)\s*;/i.test(S50)
    && !/create\s+trigger\b/i.test(S50));

  /* -- QUI LIT, QUI ÉCRIT ------------------------------------------------------ */
  const politiques = [...SQL_ENTIER.replace(/"([a-z_][a-z0-9_]*)"/g, '$1').matchAll(/create\s+policy\s+(?:"[^"]+"|[a-z_][\w$]*)\s+on\s+(?:only\s+)?(?:public\s*\.\s*)?base_postes\b[\s\S]*?;/gi)].map((m) => plat(m[0]));
  verifier('UNE politique dans tout le fichier, de forme EXACTE : `for all to authenticated`, `pro_id in (select public.mes_entreprises())` '
    + 'des deux côtés — et la RLS activée',
  politiques.length === 1 && politiques[0] === 'create policy "ma base de postes" on public.base_postes for all to authenticated '
    + 'using (pro_id in (select public.mes_entreprises())) with check (pro_id in (select public.mes_entreprises()));'
    && /alter\s+table\s+public\.base_postes\s+enable\s+row\s+level\s+security\s*;/i.test(S50), politiques.join(' | '));
  const iRevoke = S50.search(/revoke\s+all\s+on\s+public\.base_postes\s+from\s+anon\s*,\s*authenticated\s*;/i);
  const iGrant = S50.search(/grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+public\.base_postes\s+to\s+authenticated\s*;/i);
  const autresGrants = [...SQL_ENTIER.matchAll(/grant\s+[^;]*\bon\s+(?:table\s+)?(?:public\s*\.\s*)?base_postes\b[^;]*;/gi)].map((m) => plat(m[0]));
  verifier('`revoke all … from anon, authenticated`, PUIS exactement quatre droits pour `authenticated` — ni `truncate`, ni '
    + '`references`, ni `trigger` —, et aucun autre `grant` sur la table dans tout le fichier',
  iRevoke > 0 && iGrant > iRevoke && autresGrants.length === 1, autresGrants.join(' | '));
  verifier('aucune fonction `security definer` dans la section', !/security\s+definer/i.test(S50));

  /* -- L'INDEX DU DOUBLON ------------------------------------------------------- */
  verifier('l’index unique s’appelle `idx_base_postes_rapprochement` et porte EXACTEMENT `(pro_id, (md5(cle_rapprochement)::uuid), '
    + '(unite collate "C"), fourniture_non_comprise)` — une entrée fixe, sans collation',
  /create\s+unique\s+index\s+if\s+not\s+exists\s+idx_base_postes_rapprochement\s+on\s+public\.base_postes\s+\(pro_id,\s*\(md5\(cle_rapprochement\)::uuid\),\s*\(unite\s+collate\s+"C"\),\s*fourniture_non_comprise\)\s*;/i.test(S50));
  const indexEnClair = [...SQL_ENTIER.matchAll(/create\s+(?:unique\s+)?index[^;]*\bon\s+public\.base_postes\b[^;]*;/gi)].map((m) => plat(m[0]))
    .filter((x) => /md5\(\s*designation\s*\)/i.test(x) || /\bcle_rapprochement\b/i.test(x.replace(/md5\(\s*cle_rapprochement\s*\)/gi, '')));
  verifier('…jamais sur `md5(designation)`, jamais sur la clé EN CLAIR (une clé de 8 000 octets dépasse la taille d’une entrée d’index)',
    indexEnClair.length === 0, indexEnClair.join(' | '));
  verifier('l’index de la cascade : `idx_base_postes_devis` sur `devis_origine_id`, partiel',
    /create\s+index\s+if\s+not\s+exists\s+idx_base_postes_devis\s+on\s+public\.base_postes\s+\(devis_origine_id\)\s+where\s+devis_origine_id\s+is\s+not\s+null\s*;/i.test(S50));
  /* L'ANCIEN NOM, fabriqué ici pour que ce fichier ne se dénonce pas
     lui-même : un `create unique index if not exists` sous un nom déjà pris
     garde l'ANCIENNE définition, sans erreur. */
  const ANCIEN = `idx_base_postes${'_cle'}`;
  const fichiersAncien = [];
  const parcourirTout = (d) => {
    if (!existsSync(path.join(RACINE, d))) return;
    for (const e of readdirSync(path.join(RACINE, d), { withFileTypes: true })) {
      const f = `${d}/${e.name}`;
      if (e.isDirectory()) parcourirTout(f);
      else if (/\.(jsx?|mjs|cjs|tsx?|sql|json)$/.test(e.name) && new RegExp(`\\b${ANCIEN}\\b`).test(lire(f))) fichiersAncien.push(f);
    }
  };
  parcourirTout('src');
  parcourirTout('scripts');
  if (new RegExp(`\\b${ANCIEN}\\b`).test(SCHEMA_BRUT)) fichiersAncien.push('supabase/schema.sql');
  verifier(`l’ancien nom de l’index (« ${ANCIEN} ») n’apparaît nulle part : ni schema.sql, ni src/, ni scripts/`, fichiersAncien.length === 0,
    fichiersAncien.join(', '));

  /* -- L'EXPORT ------------------------------------------------------------------ */
  const fExport = fonctionSql(SQL_ENTIER, 'mes_donnees');
  verifier('l’export RGPD (`mes_donnees()`, toujours la DERNIÈRE fonction, après la section 50) rend la clé `ma_base_de_postes` : '
    + 'les lignes ENTIÈRES du compte, dans l’ordre de leur création',
  !!fExport && fExport.index > SQL_ENTIER.indexOf('public.base_postes')
    && /'ma_base_de_postes'\s*,\s*coalesce\(\(select\s+jsonb_agg\(to_jsonb\(x\)\s+order\s+by\s+x\.created_at,\s*x\.id\)\s+from\s+public\.base_postes\s+x\s+where\s+x\.pro_id\s*=\s*auth\.uid\(\)\),\s*'\[\]'::jsonb\)/i.test(fExport.corps));
}

/* ================================================================== */
/*  C. L'ESSAI — supabase/essais-section-50.sql                         */
/* ================================================================== */
console.log('\nC. L’ESSAI — ce que le fichier SQL doit contenir (le jouer est l’affaire de PostgreSQL, à la main)');
{
  let brut = '';
  try { brut = lire('supabase/essais-section-50.sql'); } catch (e) { brut = ''; }
  const essai = sqlSansCommentaires(brut);
  /* Les ordres SQL seuls : sans commentaires ni lignes de psql (`\echo`
     dit ce qu'on attend, il n'éprouve rien — il peut nommer ce que le cas
     ne doit PAS lire). */
  const ordres = essai.replace(/^\s*\\[^\n]*$/gm, ' ');
  const annonces = [...essai.matchAll(/\\echo\s+'([^']*)'/g)].map((m) => m[1]).join('\n');
  verifier('`supabase/essais-section-50.sql` existe et a un CAS 0 (la donnée existe)',
    brut.length > 5000 && /\\echo\s+'===\s+0\.\s/.test(essai));
  const blocsDo = [...essai.matchAll(/(?:^|;)\s*do\s*(?:\$|[eE]?'|language\b)/gim)].map((m) => plat(m[0]));
  const setConfig = [...essai.matchAll(/set_config\s*\(\s*'(?:role|request\.jwt[^']*)'/gi)].map((m) => m[0]);
  verifier('aucun bloc `do`, sous aucune syntaxe, ni aucun `set_config` du rôle ou du jeton : la RLS n’est pas appliquée dans un bloc '
    + '`do`, et un cas joué là passerait au vert sans rien éprouver', blocsDo.length === 0 && setConfig.length === 0,
  [...blocsDo, ...setConfig].join(' | '));
  const NOMS = ['base_poste_designation_check', 'base_poste_prix_check', 'base_poste_rapprochement_check', 'base_poste_unite_check',
    'idx_base_postes_rapprochement', 'base_postes_devis_origine_fkey', 'devis_pkey', 'OP018', '428C9',
    'row-level security policy for table "base_postes"', 'permission denied for table base_postes',
    'permission denied for function cle_de_rapprochement'];
  const absents = NOMS.filter((n) => !annonces.includes(n));
  verifier('il annonce ses refus PAR LEUR NOM (les contraintes, l’index du doublon, la clé d’origine, `devis_pkey`, OP018, 428C9, la '
    + 'RLS, les droits de table et de fonction)', absents.length === 0, `non annoncés : ${absents.join(', ')}`);
  const requis = ['1 bis', '4 bis', '5 bis', '5 ter', '6 bis', '8 bis', '14', '15', '16', '17', '18', '18 bis', '19', '20', '21',
    '21 bis', '21 ter', '22', '23', '24', '25', '26'];
  const manquants = requis.filter((n) => !new RegExp(`\\\\echo\\s+'===\\s+${n.replace(' ', '\\s+')}\\.\\s`).test(essai));
  verifier(`il contient les cas ${requis.join(', ')}`, manquants.length === 0, `manquants : ${manquants.join(', ')}`);
  const PROCEDURES = [
    [/^--\s+A\.\s+LE PLAFOND/m, 'A (le plafond, avec et sans le verrou)'],
    [/^--\s+B\.\s+LA MODIFICATION ET LA SUPPRESSION TARDIVES/m, 'B (la modification et la suppression tardives)'],
    [/^--\s+C\.\s+L'EMPREINTE DE TOUT UNICODE/m, 'C (l’empreinte de tout Unicode)'],
    [/^--\s+D\.\s+UN ÉTRANGER NE PREND JAMAIS LE VERROU DE A/m, 'D (un étranger ne prend jamais le verrou de A)'],
  ].filter(([re]) => !re.test(brut)).map(([, quoi]) => quoi);
  verifier('son en-tête écrit les QUATRE procédures à deux sessions (A, B, C, D) — elles ne tiennent pas dans un seul psql',
    PROCEDURES.length === 0, `manquantes : ${PROCEDURES.join(', ')}`);
  const cas = (n, suivant) => (new RegExp(`===\\s+${n}\\.[\\s\\S]*?===\\s+${suivant}\\.`).exec(essai) || [''])[0];
  const c12 = cas('12', '13');
  verifier('le cas 12 lit les droits de COLONNE dans `pg_attribute.attacl`, et JAMAIS dans `column_privileges` (qui en invente)',
    /\battacl\b/.test(c12) && !/column_privileges/i.test(ordres));
  const c13 = cas('13', '14');
  verifier('le cas 13 porte le motif NORMALISÉ du cas 27a de l’essai 49 : `prosrc` ET `prosqlbody`, commentaires et chaînes retirés, '
    + 'aucun regard en avant',
  /pg_get_function_sqlbody\s*\(\s*p\.oid\s*\)/i.test(c13) && /\bp\.prosrc\b/i.test(c13) && /base_postes/.test(c13)
    && /definer_ouvertes_attendu_25/.test(c13) && /definer_fermees_attendu_27/.test(c13) && !c13.includes(`(?!${BARRE}s*${BARRE}()`));
  const c18 = cas('18', '18\\s+bis');
  verifier('le cas 18 lit `supabase/cas-rapprochement.json` par `\\set … cat`, compte les écarts et les paires confondues',
    /\\set\s+cas\s+`cat\s+supabase\/cas-rapprochement\.json`/.test(c18) && /is\s+distinct\s+from\s+c->>'attendu'/.test(c18)
    && /ecarts_attendu_0/.test(c18) && /paires_confondues_attendu_0/.test(c18));
  const c18b = cas('18\\s+bis', '19');
  verifier('le cas 18 bis calcule l’empreinte du plan de base sous les QUATRE collations et sous `standard_conforming_strings = off`',
    ['collate "C"', 'collate "und-x-icu"', 'collate "fr-x-icu"', 'collate "tr-TR-x-icu"'].every((x) => c18b.includes(x))
    && /set\s+local\s+standard_conforming_strings\s*=\s*off/i.test(c18b) && /'empreintes'->'plan_de_base'/.test(c18b));
  const c20 = cas('20', '21');
  verifier('le cas 20 lit `pg_get_indexdef` et `indcollation`', /pg_get_indexdef/.test(c20) && /indcollation/.test(c20));
  /* LE CONTRAT DE LA RÈGLE, JOUÉ (relecture « base », BASE1) : le prix seul
     ne recalcule plus la clé, la réécriture se fait sous le verrou, la
     cascade d'un devis entre le remplacement et la réécriture ne tombe plus
     sur 23505, et les appels à la fonction se COMPTENT. */
  const c21 = cas('21', '21\\s+bis');
  const c21b = cas('21\\s+bis', '21\\s+ter');
  const c21t = cas('21\\s+ter', '22');
  verifier('le cas 21 joue le contrat : la fonction remplacée, le PRIX seul change sans toucher la clé, puis la réécriture EXACTE '
    + '(`set cle_rapprochement = public.cle_de_rapprochement(designation)`)',
  /create\s+or\s+replace\s+function\s+public\.cle_de_rapprochement/i.test(c21) && /prix_seul_cle_gardee_attendu_t/.test(c21)
    && /set\s+cle_rapprochement\s*=\s*public\.cle_de_rapprochement\(designation\)/i.test(c21));
  verifier('le cas 21 bis : la recherche des doublons par une fonction `pg_temp`, la cascade d’un devis entre le remplacement et la '
    + 'réécriture (la clé ne bouge pas), puis la réécriture sous `lock table … in share row exclusive mode`, qui tombe sur le doublon',
  /create\s+function\s+pg_temp\./i.test(c21b) && /delete\s+from\s+public\.devis/i.test(c21b)
    && /cle_inchangee_par_la_cascade_attendu_t/.test(c21b) && /lock\s+table\s+public\.base_postes\s+in\s+share\s+row\s+exclusive\s+mode/i.test(c21b));
  verifier('le cas 21 ter COMPTE les appels à la fonction (`pg_stat_get_xact_function_calls`, `track_functions`) : un prix, une '
    + 'modification vide et une cascade n’en ajoutent aucun, une phrase changée en ajoute un',
  /pg_stat_get_xact_function_calls/.test(c21t) && /track_functions\s*=\s*'all'/.test(c21t)
    && /appels_apres_prix_rien_et_cascade_attendu_1/.test(c21t) && /appels_apres_phrase_changee_attendu_2/.test(c21t));
  const c1b = cas('1\\s+bis', '2');
  const blancsHors = ['chr(12288)', 'chr(8239)', 'chr(11)', 'chr(133)', 'chr(8232)'];
  verifier('le cas 1 bis attend un REFUS pour chacun des cinq blancs hors classe (`base_poste_rapprochement_check`)',
    blancsHors.every((b) => new RegExp(`${b.replace(/[()]/g, (x) => BARRE + x)}\\s*,\\s*'u'\\)`).test(c1b))
    && (c1b.match(/→ base_poste_rapprochement_check/g) || []).length >= 5);
  const c22 = cas('22', '23');
  verifier('le cas 22 éprouve la garde : 10 Mo sous `statement_timeout`, 2 000 points de code avec une clé, 2 001 sans',
    /statement_timeout\s*=\s*'2s'/.test(c22) && /700000/.test(c22) && /repeat\('a',\s*2001\)/.test(c22));
  /* TOUTE SUPPRESSION COMPTE CE QU'ELLE A SUPPRIMÉ : `with s as (delete …
     returning 1) select count(*)` — ou, pour la cascade depuis `auth.users`,
     un comptage des postes juste après. Le ménage de tête est la seule
     exception. */
  const suppressions = [...ordres.matchAll(/(with\s+\w+\s+as\s+\(\s*)?delete\s+from\s+([\w.]+)[^;]*;/gi)];
  const nues = suppressions.filter((m) => !m[1]).filter((m) => {
    const suite = ordres.slice(m.index + m[0].length, m.index + m[0].length + 300);
    const tete = /like\s+'a5000000-%'/.test(m[0]);
    return !tete && !(m[2] === 'auth.users' && /^\s*select\s+count\(\*\)[^;]*public\.base_postes/i.test(suite));
  }).map((m) => plat(m[0]).slice(0, 80));
  verifier(`toute suppression d’un cas compte ce qu’elle supprime (${suppressions.length} lues)`, suppressions.length >= 8 && nues.length === 0,
    nues.join(' | '));
}

/* ================================================================== */
/*  D. L'API ET SES ERREURS — `src/lib/api.js` lu sans ses commentaires, */
/*     ce qui ne dépend que de ses arguments FAIT TOURNER, et            */
/*     `src/lib/erreurs.js` (qui s'ouvre dans node) éprouvé              */
/* ================================================================== */
console.log('\nD. L’API ET SES ERREURS — les quatre fonctions de la base de postes, lues ; leurs traductions et leurs refus, '
  + 'faits tourner');

/* LE TEXTE D'UNE FONCTION `function nom(…) { … }` — du mot `function` à son
   accolade fermante, avec sa place dans le texte (le modèle de
   `corpsDeFonction`, `verifier-devis`). `api.js` charge Supabase et React
   Native : `node` ne sait pas l'ouvrir. Ce qui s'y vérifie se LIT — sauf
   les fonctions écrites pour ne dépendre que de leurs arguments, qu'on
   extrait et qu'on FAIT TOURNER telles qu'elles sont écrites. */
function fonctionJs(src, nom) {
  const m = new RegExp(`(?:^|\\n)\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${nom}\\s*\\(`).exec(src);
  if (!m) return null;
  let i = m.index + m[0].length;
  for (let p = 1; i < src.length && p > 0; i += 1) {
    if (src[i] === '(') p += 1;
    else if (src[i] === ')') p -= 1;
  }
  i = src.indexOf('{', i);
  let n = 0;
  for (let k = i; k >= 0 && k < src.length; k += 1) {
    if (src[k] === '{') n += 1;
    else if (src[k] === '}') {
      n -= 1;
      if (n === 0) {
        const debut = src.indexOf('function', m.index);
        const tete = src.lastIndexOf('async', debut) === debut - 6 ? debut - 6 : debut;
        return { texte: src.slice(tete, k + 1), debut: tete, fin: k + 1 };
      }
    }
  }
  return null;
}
const leve = (f) => { try { f(); return null; } catch (e) { return e || new Error('levée vide'); } };
/* Les fichiers de code d'un dossier, chemins relatifs à la racine. */
const fichiersDe = (d) => {
  const r = [];
  const aller = (x) => {
    if (!existsSync(path.join(RACINE, x))) return;
    for (const e of readdirSync(path.join(RACINE, x), { withFileTypes: true })) {
      const f = `${x}/${e.name}`;
      if (e.isDirectory()) aller(f);
      else if (/\.(jsx?|mjs|cjs|tsx?)$/.test(e.name)) r.push(f);
    }
  };
  aller(d);
  return r;
};

const API = sansCommentairesJs(lire('src/lib/api.js'));
const iNoop = API.search(/\bconst\s+noop\s*=/);
const QUATRE = ['mesPostes', 'ajouterPoste', 'modifierPoste', 'retirerPoste'];
const HUIT = QUATRE.flatMap((n) => [`${n}Supabase`, `${n}Demo`]);
const corpsApi = (nom) => (fonctionJs(API, nom) || { texte: '' }).texte;
/* Une fonction d'`api.js` qui ne dépend que de ses arguments, prête à
   tourner (`injecte` : les noms qu'elle lit ailleurs, donnés tels quels). */
const extraire = (nom, injecte = {}) => {
  try {
    return new Function(...Object.keys(injecte), `${corpsApi(nom)}\nreturn ${nom};`)(...Object.values(injecte));
  } catch (e) {
    return null;
  }
};

{
  /* -- LA FORME : deux fonctions nommées, et le choix à la fin ----------- */
  const formes = [...QUATRE, 'monRegimeEtSaDate'].map((n) => {
    const choix = new RegExp(`(?:^|\\n)export\\s+const\\s+${n}\\s*=\\s*hasSupabase\\s*\\?\\s*${n}Supabase\\s*:\\s*${n}Demo\\s*;`).exec(API);
    const s = fonctionJs(API, `${n}Supabase`);
    const d = fonctionJs(API, `${n}Demo`);
    return { n, ok: Boolean(choix && s && d && s.debut > iNoop && d.debut > iNoop && choix.index > Math.max(s.debut, d.debut)) };
  });
  const malFaites = formes.filter((f) => !f.ok).map((f) => f.n);
  verifier('les quatre fonctions de la base de postes et `monRegimeEtSaDate` : DEUX fonctions nommées (`xSupabase`, `xDemo`), déclarées '
    + 'APRÈS `const noop`, et le choix à la fin — le piège Metro de l’asynchrone dans un ternaire, et l’écran blanc d’une `const` '
    + 'lue avant sa déclaration', iNoop > 0 && malFaites.length === 0, malFaites.join(', '));

  /* -- JAMAIS D'UPSERT ------------------------------------------------------ */
  const upserts = [...API.matchAll(/\.upsert\s*\(/g)]
    .filter((m) => /base_postes/.test(API.slice(Math.max(0, API.lastIndexOf(';', m.index)), m.index)));
  verifier('jamais d’`upsert` sur `base_postes` (PostgreSQL juge la ligne PROPOSÉE avant de la fusionner, et le déclencheur compte '
    + 'le plafond avant de savoir qu’elle fusionnerait) — ni dans les huit fonctions, ni ailleurs',
  HUIT.every((n) => corpsApi(n).length > 60 && !/\.upsert\s*\(|onConflict/.test(corpsApi(n))) && upserts.length === 0,
  HUIT.filter((n) => corpsApi(n).length <= 60).join(', '));

  /* -- SOUS CONDITION ----------------------------------------------------- */
  const mS = corpsApi('modifierPosteSupabase');
  const rS = corpsApi('retirerPosteSupabase');
  verifier('modifier et retirer se font SOUS CONDITION sur la date lue : `.eq(\'id\', id).eq(\'modifie_le\', modifieLe)`, puis '
    + '`.select(…)` pour SAVOIR qu’une ligne a été touchée ; la démonstration reçoit la même date, et les quatre exigent qu’elle soit '
    + 'là (`exigerDateLue`) et lèvent quand rien n’a été touché (`unPosteTouche`)',
  /\.update\(\s*patch\s*\)\s*\.eq\(\s*'id'\s*,\s*id\s*\)\s*\.eq\(\s*'modifie_le'\s*,\s*modifieLe\s*\)\s*\.select\(\s*COLONNES_POSTE\s*\)/.test(mS)
    && /\.delete\(\)\s*\.eq\(\s*'id'\s*,\s*id\s*\)\s*\.eq\(\s*'modifie_le'\s*,\s*modifieLe\s*\)\s*\.select\(\s*'id'\s*\)/.test(rS)
    && ['modifierPosteSupabase', 'modifierPosteDemo', 'retirerPosteSupabase', 'retirerPosteDemo']
      .every((n) => /exigerDateLue\(\s*modifieLe\s*\)/.test(corpsApi(n)) && /unPosteTouche\(/.test(corpsApi(n)))
    && /\{\s*modifieLe\s*,\s*signal\s*,\s*pauseMs:\s*PAUSE_POSTES_DEMO\s*\}/.test(corpsApi('modifierPosteDemo'))
    && /\{\s*modifieLe\s*,\s*signal\s*,\s*pauseMs:\s*PAUSE_POSTES_DEMO\s*\}/.test(corpsApi('retirerPosteDemo')));
  const touche = extraire('unPosteTouche', { ErreurPoste: ERR.ErreurPoste });
  const exiger = extraire('exigerDateLue');
  const e0 = touche ? leve(() => touche([])) : null;
  verifier('…et une écriture qui n’a touché AUCUNE ligne lève `ErreurPoste` (« modifié entre-temps ») — jamais un travail fait en '
    + 'silence ; une date absente est une faute d’Opus, qui se voit (faites tourner)',
  Boolean(touche && e0 && e0.name === 'ErreurPoste' && e0.message === ERR.MODIFIE_ENTRE_TEMPS && leve(() => touche(null))
    && touche([{ id: 'x' }]).id === 'x' && exiger && leve(() => exiger(undefined)) && leve(() => exiger(''))
    && leve(() => exiger(1760443200000)) && leve(() => exiger('2026-10-14T12:00:00.123456+00:00')) === null),
  e0 ? `${e0.name} : ${e0.message}` : 'non extraites');

  /* -- LA RELANCE SANS LE LIEN D'ORIGINE ----------------------------------- */
  const refuse = extraire('lienOrigineRefuse');
  const fk = (code, nom) => ({ code, message: `insert or update on table "base_postes" violates foreign key constraint "${nom}"` });
  const aS = corpsApi('ajouterPosteSupabase');
  const aD = corpsApi('ajouterPosteDemo');
  verifier('la relance SANS le lien d’origine ne part que sur `base_postes_devis_origine_fkey` (23503) — faite tourner : une autre '
    + 'clé étrangère, un doublon, un refus quelconque remontent tels quels ; c’est la SEULE condition de relance des deux ajouts, '
    + 'et elle ne part qu’une fois',
  Boolean(refuse) && refuse(fk('23503', 'base_postes_devis_origine_fkey')) === true && refuse(fk('23503', 'base_postes_pro_id_fkey')) === false
    && refuse({ code: '23505', message: 'base_postes_devis_origine_fkey' }) === false && refuse(null) === false
    && /if\s*\(\s*error\s*&&\s*devisOrigineId\s*&&\s*lienOrigineRefuse\(\s*error\s*\)\s*\)\s*\(\s*\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+essayer\(\s*null\s*\)\s*\)/.test(aS)
    && /if\s*\(\s*devisOrigineId\s*&&\s*lienOrigineRefuse\(\s*e\s*\)\s*\)\s*return\s+essayer\(\s*null\s*\)\s*;/.test(aD)
    && (aS.match(/\bessayer\(/g) || []).length === 2 && (aD.match(/\bessayer\(/g) || []).length === 2
    && !/catch\s*\(/.test(aS) && (aD.match(/catch\s*\(/g) || []).length === 1);

  /* -- UNE À LA FOIS, LE DÉLAI, L'ANNULATION ---------------------------- */
  const tour = corpsApi('uneRequeteDePosteALaFois');
  const lecture = corpsApi('lectureDevis');
  verifier('UNE requête de poste à la fois, avec le délai de 8 s et son annulation : les huit fonctions passent par '
    + '`uneRequeteDePosteALaFois`, qui enchaîne les tours et applique `lectureDevis` (`avecDelai`, `DELAI_ECRITURE`, `abort()`) au '
    + 'TOUR de la requête — jamais à sa mise en file ; les requêtes Supabase portent leur signal (`avecSignal`), la démonstration le '
    + 'reçoit',
  HUIT.every((n) => /uneRequeteDePosteALaFois\(/.test(corpsApi(n)))
    && HUIT.filter((n) => /Supabase$/.test(n)).every((n) => /avecSignal\(/.test(corpsApi(n)))
    && HUIT.filter((n) => /Demo$/.test(n)).every((n) => /\bsignal\s*,\s*pauseMs:\s*PAUSE_POSTES_DEMO\b/.test(corpsApi(n)))
    && /tourDesPostes\.then\(\s*\(\)\s*=>\s*lectureDevis\(\s*quoi\s*,\s*construire\s*\)\s*\)/.test(tour)
    && /tourDesPostes\s*=\s*tour\.then\(\s*\(\)\s*=>\s*undefined\s*,\s*\(\)\s*=>\s*undefined\s*\)/.test(tour)
    && /avecDelai\(/.test(lecture) && /DELAI_ECRITURE/.test(lecture) && /\.abort\(\)/.test(lecture));

  /* -- LA LECTURE --------------------------------------------------------- */
  const lect = corpsApi('mesPostesSupabase');
  const decl = (/\bconst\s+COLONNES_POSTE\s*=\s*((?:'[^']*'\s*\+?\s*)+);/.exec(API) || [])[1] || '';
  const colonnesLues = (decl.match(/'([^']*)'/g) || []).map((x) => x.slice(1, -1)).join('').split(',').map((x) => x.trim());
  const DIX = ['id', 'designation', 'unite', 'fourniture_non_comprise', 'main_oeuvre', 'prix_reference_centimes', 'prix_fixe_le',
    'devis_origine_id', 'created_at', 'modifie_le'];
  verifier('la lecture : `COLONNES_POSTE`, EXACTEMENT les dix colonnes (aucun plongeon dans `devis`, aucun objet, pas la clé), filtrée '
    + 'par MON entreprise côté base (`.eq(\'pro_id\', currentUserId)`), TRIÉE par l’identifiant AVANT d’être bornée au plafond, '
    + 'AVEC son compte (`count: \'exact\'`) — et `incomplete` le dit, en démonstration aussi',
  json(colonnesLues) === json(DIX)
    && /\.from\(\s*'base_postes'\s*\)\s*\.select\(\s*COLONNES_POSTE\s*,\s*\{\s*count:\s*'exact'\s*\}\s*\)\s*\.eq\(\s*'pro_id'\s*,\s*currentUserId\s*\)\s*\.order\(\s*'id'\s*\)\s*\.limit\(\s*POSTES_MAX\s*\)/.test(lect)
    && /incomplete:\s*Number\(\s*count\s*\)\s*>\s*postes\.length/.test(lect) && !/\bdevis\b|objet/.test(lect)
    && /if\s*\(\s*error\s*\)\s*leverLecture\(\s*error\s*\)/.test(lect)
    && /incomplete:\s*compte\s*>\s*postes\.length/.test(corpsApi('mesPostesDemo'))
    && ['ajouterPosteSupabase', 'modifierPosteSupabase'].every((n) => /\.select\(\s*COLONNES_POSTE\s*\)/.test(corpsApi(n))),
  `colonnes : ${colonnesLues.join(', ')}`);

  /* -- LE NOM DE LA TABLE, PARTOUT -------------------------------------- */
  const fichiers = [...fichiersDe('src'), ...fichiersDe('supabase/functions')];
  const permises = HUIT.filter((n) => /Supabase$/.test(n)).map((n) => fonctionJs(API, n)).filter(Boolean);
  const horsPlace = [];
  for (const f of fichiers) {
    const code = f === 'src/lib/api.js' ? API : sansCommentairesJs(lire(f));
    for (const m of code.matchAll(/\bbase_postes\b/g)) {
      if (f === 'src/lib/api.js' && permises.some((x) => m.index > x.debut && m.index < x.fin)) continue;
      if (f === 'src/data/devis-demo.js' && /const\s+TABLE_POSTES\s*=\s*'$/.test(code.slice(Math.max(0, m.index - 40), m.index))) continue;
      horsPlace.push(`${f} : …${code.slice(Math.max(0, m.index - 30), m.index + 20).replace(/\s+/g, ' ')}…`);
    }
  }
  const demoSrc = sansCommentairesJs(lire('src/data/devis-demo.js'));
  verifier('la CHAÎNE `base_postes`, sous toute forme (guillemets, gabarit, constante), n’apparaît dans `src/` et `supabase/functions/` '
    + 'qu’à l’intérieur des quatre fonctions Supabase de `api.js` — chacune la nomme — et UNE fois dans la démonstration, la constante '
    + 'qui imite les messages de PostgreSQL (le fichier ne charge aucun client Supabase)',
  permises.length === 4 && permises.every((x) => /\.from\(\s*'base_postes'\s*\)/.test(x.texte)) && horsPlace.length === 0
    && (demoSrc.match(/\bbase_postes\b/g) || []).length === 1 && !modulesDe(demoSrc).some((m) => /supabase/i.test(m)),
  horsPlace.slice(0, 4).join(' | '));

  /* -- QUI APPELLE QUOI ---------------------------------------------------- */
  const autres = fichiers.filter((f) => f.startsWith('src/') && f !== 'src/lib/api.js');
  const nomment = (nom) => autres.filter((f) => new RegExp(`\\b${nom}\\b`).test(sansCommentairesJs(lire(f))));
  const FA = 'src/components/FeuilleAjoutPoste.js';
  const FP = 'src/components/FeuillePoste.js';
  const feuilles = existsSync(path.join(RACINE, FA));
  const ajout = nomment('ajouterPoste');
  const modif = nomment('modifierPoste');
  const retrait = nomment('retirerPoste');
  const appelsAjout = feuilles ? (sansCommentairesJs(lire(FA)).match(/\bajouterPoste\s*\(/g) || []).length : 0;
  /* Depuis l'étape 5 du lot, les deux feuilles EXISTENT : leurs appels sont
     exigés, et plus seulement permis. */
  verifier('`ajouterPoste` n’est nommé qu’à UN endroit hors d’`api.js`, `FeuilleAjoutPoste`, et appelé une fois — aucun ajout '
    + 'automatique ; `modifierPoste` par `FeuilleAjoutPoste` (le prix) et `FeuillePoste`, et par eux seuls ; `retirerPoste` par '
    + '`FeuillePoste` seule',
  feuilles && existsSync(path.join(RACINE, FP)) && json(ajout) === json([FA]) && appelsAjout === 1
    && json([...modif].sort()) === json([FA, FP].sort()) && json(retrait) === json([FP]), json({ ajout, modif, retrait }));

  /* -- LE RÉGIME ET SA DATE ------------------------------------------------ */
  const rs = extraire('regimeEtSaDate');
  verifier('`monRegimeEtSaDate` rend `{ regime, declareLe }` (la date posée par la base au changement de régime), lus par la MÊME '
    + 'lecture que `monRegime` (`monEmetteur…`) — qui rend toujours le régime SEUL, une chaîne ou `null` ; rien n’avale une erreur',
  Boolean(rs) && json(rs({ emetteur: { regime_tva: 'reel', regime_tva_declare_le: '2026-10-03T12:00:00Z' } }))
      === json({ regime: 'reel', declareLe: '2026-10-03T12:00:00Z' })
    && json(rs({ emetteur: null })) === json({ regime: null, declareLe: null }) && json(rs(null)) === json({ regime: null, declareLe: null })
    && /return\s+regimeEtSaDate\(\s*await\s+monEmetteurSupabase\(\)\s*\)\.regime\s*;/.test(corpsApi('monRegimeSupabase'))
    && /return\s+regimeEtSaDate\(\s*await\s+monEmetteurDemo\(\)\s*\)\.regime\s*;/.test(corpsApi('monRegimeDemo'))
    && /return\s+regimeEtSaDate\(\s*await\s+monEmetteurSupabase\(\)\s*\)\s*;/.test(corpsApi('monRegimeEtSaDateSupabase'))
    && /return\s+regimeEtSaDate\(\s*await\s+monEmetteurDemo\(\)\s*\)\s*;/.test(corpsApi('monRegimeEtSaDateDemo'))
    && !/catch\s*\(/.test(corpsApi('monRegimeEtSaDateSupabase') + corpsApi('regimeEtSaDate')));

  /* -- LA CLÉ DE RAPPROCHEMENT, NULLE PART DANS L'APPLICATION ------------ */
  const nommentLaCle = fichiers.filter((f) => f.startsWith('src/') && /cle_rapprochement/.test(f === 'src/lib/api.js' ? API : sansCommentairesJs(lire(f))));
  verifier('la chaîne `cle_rapprochement` n’apparaît NULLE PART dans le code de `src/` : ni lue, ni envoyée (la base la calcule — '
    + '428C9 pour qui l’envoie —, l’application calcule la même par son miroir)', nommentLaCle.length === 0, nommentLaCle.join(', '));

  /* -- CE QUE LE TÉLÉPHONE ENVOIE, FAIT TOURNER -------------------------- */
  const versBase = extraire('posteVersBase');
  let detail = '';
  let okEnvoi = false;
  try {
    const cles = (o) => Object.keys(o).sort();
    const creation = versBase({ designation: 'Chape', unite: 'm2', fournitureNonComprise: true, mainOeuvre: false, prixReferenceCentimes: 4500 },
      { creation: true, proId: 'p', devisOrigineId: 'd' });
    const partielle = versBase({ designation: 'Chape', unite: 'm2' }, { creation: true, proId: 'p' });
    const prix = versBase({ prixReferenceCentimes: 5200 });
    const sansPrix = versBase({ prixReferenceCentimes: null });
    const phrase = versBase({ designation: 'Chape sèche' });
    const INTERDITES = ['id', 'proId', 'pro_id', 'createdAt', 'modifieLe', 'prixFixeLe', 'cleRapprochement', 'cle_rapprochement',
      'prix_reference_centimes', 'prixPropose', 'offert', 'tauxTvaCentiemes', 'quantiteMilliemes', 'devisOrigineId'];
    const refusCreation = INTERDITES.filter((k) => !leve(() => versBase({ designation: 'Chape', unite: 'm2', [k]: 'x' }, { creation: true, proId: 'p' })));
    const refusModif = [...INTERDITES, 'unite', 'fournitureNonComprise', 'mainOeuvre']
      .filter((k) => !leve(() => versBase({ prixReferenceCentimes: 1, [k]: 'x' })));
    const sorties = [creation, partielle, prix, sansPrix, phrase].flatMap((o) => Object.keys(o));
    okEnvoi = json(cles(creation)) === json(['designation', 'devis_origine_id', 'fourniture_non_comprise', 'main_oeuvre',
      'prix_reference_centimes', 'pro_id', 'unite'])
      && creation.pro_id === 'p' && creation.devis_origine_id === 'd' && creation.fourniture_non_comprise === true
      && partielle.fourniture_non_comprise === false && partielle.main_oeuvre === false && partielle.prix_reference_centimes === null
      && partielle.devis_origine_id === null && json(prix) === json({ prix_reference_centimes: 5200 })
      && json(sansPrix) === json({ prix_reference_centimes: null }) && json(phrase) === json({ designation: 'Chape sèche' })
      && refusCreation.length === 0 && refusModif.length === 0 && Boolean(leve(() => versBase({})))
      && !sorties.some((k) => /^(id|created_at|modifie_le|prix_fixe_le|cle_rapprochement)$/.test(k));
    detail = `création ${json(cles(creation))} ; acceptés à tort : ${json({ refusCreation, refusModif })}`;
  } catch (e) {
    detail = `la traduction ne tourne pas seule : ${e && e.message}`;
  }
  verifier('`posteVersBase`, FAITE TOURNER : à la création, la phrase, l’unité, les deux interrupteurs (`false` s’ils ne sont pas dits), '
    + 'le prix (vide permis), l’entreprise et le lien ; en modification, la phrase ou le prix SEULEMENT ; jamais un identifiant, une '
    + 'date, la clé — et un nom inconnu LÈVE au lieu de partir sans rien changer (`prix_reference_centimes`, `prixPropose`…)', okEnvoi, detail);

  const defNombre = (/\bconst\s+nombreOuNul\s*=\s*([^;]+);/.exec(API) || [])[1];
  let nombreOuNul = null;
  try { nombreOuNul = new Function(`return ${defNombre};`)(); } catch (e) { nombreOuNul = null; }
  const lu = extraire('rowToPoste', { nombreOuNul });
  const ligneBase = { id: 'i', pro_id: 'p', designation: 'Chape', unite: 'm2', fourniture_non_comprise: true, main_oeuvre: 'oui',
    prix_reference_centimes: '4500', prix_fixe_le: '2026-10-14T12:00:00.123456+00:00', devis_origine_id: null,
    created_at: '2026-10-14T12:00:00+00:00', modifie_le: '2026-10-14T12:00:00.123456+00:00', cle_rapprochement: 'chape' };
  const poste = lu ? lu(ligneBase) : null;
  const srcPostes = sansCommentairesJs(lire('src/lib/postes.js'));
  const LUS = ['designation', 'unite', 'fournitureNonComprise', 'mainOeuvre', 'prixReferenceCentimes', 'prixFixeLe', 'devisOrigineId',
    'createdAt', 'modifieLe'];
  verifier('`rowToPoste`, FAIT TOURNER : les dix colonnes aux noms que `postes.js` lit (et lui seul les nomme), un nombre pour le prix, '
    + 'des booléens STRICTS, ni l’entreprise ni la clé — et `modifieLe` reste la CHAÎNE reçue : elle repart telle quelle dans la '
    + 'condition, et la reformater ferait dire « modifié entre-temps » sur un poste que personne n’a touché',
  Boolean(poste) && json(Object.keys(poste).sort()) === json(['id', ...LUS].sort()) && poste.prixReferenceCentimes === 4500
    && poste.mainOeuvre === false && poste.fournitureNonComprise === true && poste.modifieLe === ligneBase.modifie_le
    && poste.prixFixeLe === ligneBase.prix_fixe_le && lu(null) === null
    && LUS.every((k) => new RegExp(`\\.${k}\\b`).test(srcPostes)), poste ? json(poste) : 'non extraite');

  /* -- LES PHRASES DES REFUS (erreurs.js) ------------------------------- */
  const op018 = (/raise\s+exception\s+'((?:[^']|'')*)'\s+using\s+errcode\s*=\s*'OP018'/i.exec(S50) || [])[1];
  const op018Base = op018 ? op018.replace(/''/g, "'") : null;
  verifier('`REFUS_POSTES.OP018` (erreurs.js) est la phrase d’OP018 de la section 50, OCTET POUR OCTET (« 1 000 » avec une espace '
    + 'ordinaire) — la démonstration refuse avec les mots exacts de la base, et `messageClair` la rend telle quelle',
  Boolean(op018Base && ERR.REFUS_POSTES) && json(Object.keys(ERR.REFUS_POSTES)) === json(['OP018'])
    && Buffer.from(ERR.REFUS_POSTES.OP018, 'utf8').equals(Buffer.from(op018Base, 'utf8'))
    && ERR.messageClair({ code: 'OP018', message: ERR.REFUS_POSTES.OP018 }, 'Votre base de postes') === op018Base,
  `base : ${json(op018Base)} ; erreurs.js : ${json(ERR.REFUS_POSTES && ERR.REFUS_POSTES.OP018)}`);
  const PG = (n) => ({ code: '23514', message: `new row for relation "base_postes" violates check constraint "${n}"` });
  const phrasesPostes = Object.keys(ERR.MESSAGES_CONTRAINTE).filter((k) => /^base_poste_/.test(k));
  const malDites = P.CONTRAINTES_POSTE.filter((n) => {
    const m = ERR.messageClair(PG(n), 'Ce poste');
    return !ERR.MESSAGES_CONTRAINTE[n] || m !== `Ce poste : ${ERR.MESSAGES_CONTRAINTE[n]}` || /schema\.sql/.test(m);
  });
  verifier('chaque contrainte de la section 50 (`CONTRAINTES_POSTE`) a SA phrase dans `MESSAGES_CONTRAINTE`, et réciproquement ; '
    + '`messageClair` la rend après le sujet, sans la piste « schema.sql » (ce n’est pas un schéma oublié, c’est une saisie)',
  json(phrasesPostes) === json([...P.CONTRAINTES_POSTE]) && malDites.length === 0, `mal dites : ${malDites.join(', ')}`);
  const doublonPg = { code: '23505', message: 'duplicate key value violates unique constraint "idx_base_postes_rapprochement"' };
  const phraseDoublon = ERR.MESSAGES_CONTRAINTE.idx_base_postes_rapprochement || '';
  verifier('le 23505 de l’index du doublon se reconnaît à son NOM (`idx_base_postes_rapprochement`, celui de la section 50) : la '
    + 'phrase dit que le poste existe déjà, presque mot pour mot, et OÙ changer son prix (depuis la ligne, ou « Ma base de postes ») '
    + '— sans nommer « Changer ma référence », qui n’existe que s’il y a un écart (TEXTES13)',
  /create\s+unique\s+index\s+if\s+not\s+exists\s+idx_base_postes_rapprochement\b/i.test(S50)
    && ERR.messageClair(doublonPg, 'Votre base de postes') === `Votre base de postes : ${phraseDoublon}`
    && /presque identique/.test(phraseDoublon) && /depuis la ligne/.test(phraseDoublon) && /« Ma base de postes »/.test(phraseDoublon)
    && !/Changer ma référence/.test(phraseDoublon),
  phraseDoublon);
  /* TEXTES13 : « puis ajoutez-la » ne se dit pas d'un refus qu'on ne
     rencontre qu'en CORRIGEANT une phrase dans « Ma base de postes » — la
     feuille d'ajout ne propose jamais une phrase sans lettre ni chiffre. */
  verifier('…et le refus d’une phrase sans lettre ni chiffre ne dit pas « ajoutez-la » : on ne le rencontre qu’en la corrigeant',
    !/ajoutez-la/.test(ERR.MESSAGES_CONTRAINTE.base_poste_rapprochement_check || 'ajoutez-la')
    && /écrivez ce que vous faites/.test(ERR.MESSAGES_CONTRAINTE.base_poste_rapprochement_check || ''),
  ERR.MESSAGES_CONTRAINTE.base_poste_rapprochement_check);
  const c428 = [
    { code: '428C9', message: 'cannot insert a non-DEFAULT value into column "cle_rapprochement"' },
    { code: '428C9', message: 'column "cle_rapprochement" can only be updated to DEFAULT' },
    { message: 'cannot insert a non-DEFAULT value into column "cle_rapprochement"' },
  ].map((e) => ERR.messageClair(e));
  verifier('428C9 — une valeur envoyée dans une colonne que la base calcule — se dit en français, et dit de mettre Opus à jour : jamais '
    + 'le texte anglais de PostgreSQL (« non-DEFAULT », « can only be updated »), avec ou sans son code',
  c428.every((m) => m === 'Opus a envoyé une valeur que la base calcule elle-même : mettez Opus à jour, puis réessayez.'), json(c428));
  const ep = new ERR.ErreurPoste();
  verifier('`ErreurPoste` dit, mot pour mot, « Ce poste a été modifié ou retiré entre-temps — peut-être depuis un autre appareil. '
    + 'Rien n’a été enregistré. » — ce qu’on peut dire SANS savoir : ni « relu », ni « modifié » seul (TEXTES5) — et `messageClair` '
    + 'la rend TELLE QUELLE, sans sujet (elle est déjà en français)',
  ERR.MODIFIE_ENTRE_TEMPS === 'Ce poste a été modifié ou retiré entre-temps — peut-être depuis un autre appareil. Rien n’a été '
    + 'enregistré.' && ep.name === 'ErreurPoste' && ep instanceof Error && ep.message === ERR.MODIFIE_ENTRE_TEMPS
    && !/relu/.test(ERR.MODIFIE_ENTRE_TEMPS) && ERR.messageClair(ep, 'Ce poste') === ERR.MODIFIE_ENTRE_TEMPS, ERR.messageClair(ep, 'Ce poste'));
  /* …ET CE QUE LES FEUILLES EN DISENT, d'après ce que la relecture a RENDU
     (`issueDuModifieEntreTemps`) : une relecture ratée ne se dit jamais
     « relue » ; un poste absent de la base relue a été RETIRÉ ; présent, il
     a été modifié. */
  const relueRatee = P.issueDuModifieEntreTemps(null, 'p1');
  const retire = P.issueDuModifieEntreTemps([{ id: 'p2' }], 'p1');
  const modifie = P.issueDuModifieEntreTemps([{ id: 'p1' }, { id: 'p2' }], 'p1');
  verifier('l’issue d’un « modifié entre-temps » (`issueDuModifieEntreTemps`) : relecture ratée → « n’a pas pu être relue », jamais '
    + '« a été relue » ; poste absent → `absent` et « n’est plus dans votre base » ; présent → « modifié » et « a été relue »',
  !relueRatee.absent && /n’a pas pu être relue/.test(relueRatee.phrase) && !/a été relue/.test(relueRatee.phrase)
    && /modifié ou retiré/.test(relueRatee.phrase)
    && retire.absent === true && retire.phrase === P.PHRASE_POSTE_ABSENT && /n’est plus dans votre base/.test(retire.phrase)
    && !modifie.absent && /a été modifié entre-temps/.test(modifie.phrase) && /a été relue/.test(modifie.phrase),
  json({ relueRatee, retire, modifie }));
}

/* ================================================================== */
/*  E. LES ÉCRANS — ce que les écrans de la base promettent, lu dans   */
/*     leur code (sans les commentaires)                                */
/* ================================================================== */
console.log('\nE. LES ÉCRANS — la référence, l’écart, le bloc « base », les deux feuilles (une seule à l’écran), la page, les '
  + 'deux portes ; lus dans le code, commentaires retirés (ce qu’ils FONT au navigateur, `mesure-devis` le mesure)');

/* La balise ouvrante d'un élément, de `<Nom` à son `>` — en sautant les `>`
   des flèches (`=>`) et ceux des accolades (le modèle de `verifier-devis`). */
function baliseOuvranteE(src, i) {
  let prof = 0;
  for (let j = i + 1; j < src.length; j += 1) {
    const c = src[j];
    if (c === '{') prof += 1;
    else if (c === '}') prof -= 1;
    else if (c === '>' && prof === 0 && src[j - 1] !== '=') return src.slice(i, j + 1);
  }
  return src.slice(i);
}
const balisesE = (src, nom) => [...src.matchAll(new RegExp(`<${nom}\\b`, 'g'))].map((m) => baliseOuvranteE(src, m.index));
/* Les appels d'une fonction, parenthèses comptées. */
function appelsE(src, nom) {
  const r = [];
  for (const m of src.matchAll(new RegExp(`\\b${nom}\\s*\\(`, 'g'))) {
    let p = 0;
    let j = m.index + m[0].length - 1;
    for (; j < src.length; j += 1) {
      if (src[j] === '(') p += 1;
      else if (src[j] === ')') { p -= 1; if (p === 0) break; }
    }
    r.push(src.slice(m.index, j + 1));
  }
  return r;
}
/* Le bloc qui s'ouvre à la première accolade après `debut`, jusqu'à celle
   qui le ferme. */
function blocApres(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) return '';
  const a = src.indexOf('{', i + debut.length - 1);
  if (a < 0) return '';
  let p = 0;
  for (let j = a; j < src.length; j += 1) {
    if (src[j] === '{') p += 1;
    else if (src[j] === '}') { p -= 1; if (p === 0) return src.slice(a, j + 1); }
  }
  return '';
}
/* Les instructions d'un bloc, AU PREMIER NIVEAU : on coupe à chaque `;` et
   à chaque `}` qui referme ce qu'il a ouvert, les chaînes et les
   parenthèses sautées. `if (x) onFermer();` est UNE instruction ; un appel
   écrit dans un `if`, derrière un `&&` ou dans un ternaire n'en commence
   jamais une. */
function instructionsDuBloc(bloc) {
  const r = [];
  let cur = '';
  let p = 0;
  for (let i = 0; i < bloc.length; i += 1) {
    const c = bloc[i];
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < bloc.length && bloc[j] !== c) { if (bloc[j] === BARRE) j += 1; j += 1; }
      cur += bloc.slice(i, j + 1);
      i = j;
      continue;
    }
    if ('({['.includes(c)) p += 1;
    else if (')}]'.includes(c)) p -= 1;
    cur += c;
    if (p === 0 && (c === ';' || c === '}')) { if (cur.trim()) r.push(cur.trim()); cur = ''; }
  }
  if (cur.trim()) r.push(cur.trim());
  return r;
}
const lireSiE = (f) => (existsSync(path.join(RACINE, f)) ? sansCommentairesJs(lire(f)) : '');
const ECRANS_BASE = {
  carte: 'src/components/CarteLigne.js',
  designation: 'src/components/ChampDesignation.js',
  ajout: 'src/components/FeuilleAjoutPoste.js',
  poste: 'src/components/FeuillePoste.js',
  page: 'src/screens/PostesScreen.js',
  saisie: 'src/screens/SaisieDevisScreen.js',
  liste: 'src/screens/DevisScreen.js',
  profil: 'src/screens/ProfilOwnScreen.js',
  app: 'src/OpusApp.js',
};
const EC = Object.fromEntries(Object.entries(ECRANS_BASE).map(([k, f]) => [k, lireSiE(f)]));
/* Une entrée d'un `StyleSheet.create` : `  nom: { … },`. */
const styleE = (src, nom) => (new RegExp(`\\n {2}${nom}: \\{([^}]*)\\}`).exec(src) || [])[1] || '';

try {
  verifier('les écrans de la base existent : `FeuilleAjoutPoste`, `FeuillePoste`, `PostesScreen` (chacun dans SON fichier)',
    Object.values(ECRANS_BASE).every((f) => existsSync(path.join(RACINE, f))),
    Object.values(ECRANS_BASE).filter((f) => !existsSync(path.join(RACINE, f))).join(', '));

  /* -- LA CARTE : la référence AU-DESSUS du prix, le bloc DESSOUS ------- */
  {
    const c = EC.carte;
    const iRef = c.indexOf('{vue.reference.avant}');
    const iChiffree = c.indexOf('{chiffree && (');
    const iDeux = c.indexOf('<View style={s.deux}>', iChiffree);
    const iBloc = c.indexOf('{bloc}');
    const iSurfaces = c.indexOf('surfaces.length > 0 &&');
    verifier('`CarteLigne` : la ligne de RÉFÉRENCE est rendue AVANT la rangée quantité/prix, le BLOC juste APRÈS (avant les '
      + 'surfaces) — la référence se lit avant qu’on tape le prix',
    iChiffree > 0 && iRef > iChiffree && iDeux > iRef && iBloc > iDeux && iSurfaces > iBloc,
    `réf. ${iRef}, rangée ${iDeux}, bloc ${iBloc}, surfaces ${iSurfaces}`);
    verifier('…la référence et l’écart sont des `Text` au style EXACTEMENT `s.aide` (gris, une phrase discrète), le montant par '
      + '`Montant` ; l’écart porte son libellé VoiceOver entier (`libelleEcart`)',
    /<Text style=\{s\.aide\}>\s*\{vue\.reference\.avant\}/.test(c)
      && /<Text style=\{s\.aide\} accessibilityLabel=\{vue\.ecart\.libelle\}>\s*\{vue\.ecart\.morceaux\.avant\}/.test(c)
      && /<Montant centimes=\{vue\.reference\.prix\}/.test(c) && /<Montant centimes=\{vue\.ecart\.morceaux\.prix\}/.test(c));
    const iDebutBloc = c.indexOf('const bloc = ');
    const segBloc = iDebutBloc >= 0 ? c.slice(iDebutBloc, c.indexOf('\n  return (', iDebutBloc)) : '';
    const stylesBloc = ['aide', 'aideMontant', 'bloc'].map((n) => styleE(c, n));
    verifier('…le bloc « base » n’emploie ni le style `erreur`, ni `C.bad` (le rouge des refus), ni l’orange (`C.accent`, '
      + '`C.accentTexte`), ni une couleur écrite en ligne : c’est une question, pas un refus',
    segBloc.length > 500 && !/s\.erreur|C\.bad|C\.accent|style=\{\{|style=\{\[/.test(segBloc)
      && stylesBloc.every((x) => x.length > 0 && !/C\.bad|C\.accent/.test(x)), stylesBloc.join(' | '));
    verifier('…quand la ligne est une VARIANTE d’un poste, le bloc affiche `vue.existe` — « Ce poste existe déjà dans votre base » et '
      + 'la sortie, en UN paragraphe discret (`s.aide`, plus de gras : il se lisait comme un avertissement de doublon, ECRAN9)',
    /\{!!vue\.existe && <Text style=\{s\.aide\}>\{vue\.existe\}<\/Text>\}/.test(segBloc) && !/blocTexte|inter6/.test(segBloc)
      && !/blocTexte/.test(c));
    const choisir = blocApres(c, 'onChoisir={(sug) => {');
    verifier('…un appui sur une proposition passe par `valeursDeLaProposition` PUIS `prixAEcrire` — `null` veut dire « ne touchez '
      + 'pas au champ » : une proposition sans prix ne vide jamais un prix déjà tapé (T10) ; plus aucun `valeursDeLaSuggestion`',
    choisir.indexOf('valeursDeLaProposition(sug)') > 0 && choisir.indexOf('prixAEcrire(') > choisir.indexOf('valeursDeLaProposition(sug)')
      && /if \(prix !== null && refPrix\.current\) refPrix\.current\.ecrire\(prix\);/.test(choisir)
      && /if \(prix !== null\) changement\.prixUnitaireCentimes/.test(choisir) && !/valeursDeLaSuggestion/.test(c),
    choisir.slice(0, 160));
    const versFeuille = blocApres(c, 'const versLaFeuille = (demander) => {');
    verifier('…une feuille se demande APRÈS que la carte s’est enregistrée et a fermé le clavier (`Keyboard.dismiss()` avant '
      + '`demander(`) — et les deux demandes ne partent que par là',
    versFeuille.indexOf('onEnregistrer(') > 0 && versFeuille.indexOf('Keyboard.dismiss()') > versFeuille.indexOf('onEnregistrer(')
      && versFeuille.indexOf('demander(') > versFeuille.indexOf('Keyboard.dismiss()')
      && appelsE(c, 'onAjouterALaBase').length === 1 && /versLaFeuille\(\(v\) => onAjouterALaBase\(v\)\)/.test(c)
      && appelsE(c, 'onOuvrirPoste').length === 1
      && /const ouvrirLePoste = \(avecLePrixDeLaLigne\) => versLaFeuille\(/.test(c), versFeuille.slice(0, 160));
  }

  /* -- UNE LIGNE DE TITRE N'A RIEN À PROPOSER (S13) ----------------------- */
  {
    const champDes = balisesE(EC.carte, 'ChampDesignation')[0] || '';
    verifier('…une ligne de TITRE (zone, pièce) ne reçoit NI la mémoire NI la base : `ChampDesignation` n’a de propositions que '
      + 'sur une ligne chiffrée — `memoire`, `postes` et `postesEtat` y sont tous trois conditionnés par `chiffree`',
    /memoire=\{chiffree \? memoire : null\}/.test(champDes) && /postes=\{chiffree \? postes : null\}/.test(champDes)
      && /postesEtat=\{chiffree \? postesEtat : 'sans_objet'\}/.test(champDes), champDes.slice(0, 200));
  }

  /* -- LA FEUILLE D'AJOUT ------------------------------------------------- */
  {
    const a = EC.ajout;
    const existe = a.slice(a.indexOf("} else if (feuille.etat === 'existe') {"), a.indexOf("titre = 'Ajouter à ma base';"));
    const memePrix = blocApres(existe, 'if (feuille.memePrix) {');
    const champs = ['TextInput', 'TextArea', 'Field', 'ChampLocal', 'ChampDesignation', 'ChampPhrase'].filter((n) => balisesE(a, n).length);
    const montants = balisesE(a, 'ChampMontant');
    verifier('`FeuilleAjoutPoste` : AUCUN champ pour la phrase (elle est montrée, mot pour mot) — un seul champ, le prix, un '
      + '`ChampMontant` SANS `autoFocus` (sinon le pavé décimal monte et cache le bouton)',
    a.length > 2000 && champs.length === 0 && montants.length === 1 && !/autoFocus/.test(a), `champs : ${champs.join(', ')}`);
    verifier('…une garde par référence (`enVol`) dans ses deux validations, `retour.reussite()`, et AUCUNE attente de la file du '
      + 'devis (ni `attendre`, ni `fileDuDevis`, ni `devisEnBase`) : le lien d’origine est décidé par la saisie à l’appui',
    /const ajouter = async \(\) => \{\s*if \(enVol\.current\) return;/.test(a)
      && /const changer = async \(\) => \{\s*if \(enVol\.current \|\| !existant\) return;/.test(a)
      && /retour\.reussite\(\)/.test(a) && !/\.attendre\(|fileDuDevis|devisEnBase/.test(a));
    verifier('…elle n’importe ni n’ouvre JAMAIS `FeuillePoste` (deux `Modal` empilées laissent sur l’iPhone un voile qui avale les '
      + 'touches), et n’envoie JAMAIS la phrase à `modifierPoste` (le prix seul)',
    !/FeuillePoste/.test(a) && appelsE(a, 'api\\.modifierPoste').length === 1
      && appelsE(a, 'api\\.modifierPoste').every((x) => !/designation/.test(x)) && appelsE(a, 'api\\.ajouterPoste').length === 1);
    verifier('…son état « ce poste existe déjà » n’a AUCUN bouton pour ajouter un second poste ni pour remplacer la phrase du poste ; '
      + 'et à PRIX ÉGAL, seul « Fermer » (ni champ, ni bouton principal)',
    existe.length > 500 && !/onPress=\{ajouter\}|Ajouter à ma base|ajouterPoste/.test(existe)
      && memePrix.length > 50 && !/<BtnMain|<ChampMontant|champ\(|<BtnOutline/.test(memePrix)
      && (existe.match(/<BtnOutline key="fermer" label="Fermer"/g) || []).length === 1
      && /\n {4}contenu\.push\(<BtnOutline key="fermer" label="Fermer" onPress=\{onFermer\} \/>\);/.test(existe), memePrix.slice(0, 120));
    verifier('…la feuille passe d’elle-même à « existe déjà » : son état vient de `etatDeLaFeuilleAjout`, RECALCULÉ à chaque rendu '
      + '(jamais retenu dans un état), avec le prix PORTÉ et le drapeau « en train de taper » ; et un 23505 relit la base avant de '
      + 'montrer la phrase de l’index',
    /\n {2}const feuille = etatDeLaFeuilleAjout\(\{ valeurs, postes, prixTape, prixTouche, doublonInvisible \}\);/.test(a)
      && !/useState\([^)]*etatDeLaFeuilleAjout/.test(a) && (a.match(/etatDeLaFeuilleAjout\(/g) || []).length === 1
      && /=== '23505'\) \{[\s\S]{0,400}await onRelire\(\)/.test(a));
  }

  /* -- UNE FEUILLE FERMÉE PENDANT L'ENVOI : LE RÉSULTAT EST RANGÉ QUAND MÊME --
     Trouvé par le banc de sabotages final (24/10/2026) : poser
     `if (vivant.current) onRanger(pose);` après « Changer ma référence »
     passait TOUS les contrôles ET `mesure-devis` (450 mesures vertes). Or
     une feuille fermée pendant l'envoi (le voile, la croix) laisse alors la
     base de l'écran derrière la vraie : la carte montre l'ancienne
     référence, et la prochaine écriture part avec une date périmée
     (« modifié entre-temps »). La PROPRIÉTÉ : dans les deux feuilles, le
     résultat de chaque écriture (l'ajout, le prix changé, l'écriture de la
     feuille d'un poste) est rangé par `onRanger(<résultat>` au PREMIER
     niveau du bloc où l'écriture a réussi, sans `return` ni `throw` entre
     les deux — et `onRanger` n'est appelé nulle part ailleurs (donc jamais
     sous une condition). `vivant.current` ne garde que la feuille
     elle-même : la fermer, y écrire. */
  {
    const fautes = [];
    const vues = [];
    for (const [nom, src] of [['FeuilleAjoutPoste', EC.ajout], ['FeuillePoste', EC.poste]]) {
      let ranges = 0;
      for (const m of src.matchAll(/const (\w+) = await (api\.(?:ajouterPoste|modifierPoste)|faire)\(/g)) {
        vues.push(`${nom} : ${m[2]}`);
        const iTry = src.lastIndexOf('try {', m.index);
        const corps = iTry >= 0 ? blocApres(src.slice(iTry), 'try {').slice(1, -1) : '';
        const ins = instructionsDuBloc(corps);
        const k = ins.findIndex((x) => x.startsWith(`const ${m[1]} = await `));
        const j = ins.findIndex((x, n) => n > k && new RegExp(`^onRanger\\(${m[1]}\\b`).test(x));
        const entre = k >= 0 && j > k ? ins.slice(k + 1, j) : [];
        if (k < 0 || j < 0 || entre.some((x) => /\breturn\b|\bthrow\b/.test(x))) {
          fautes.push(`${nom} : le résultat de ${m[2]} n’est pas rangé au premier niveau (${(j < 0 ? ins.slice(k + 1, k + 3) : entre).join(' ').slice(0, 140)})`);
        } else ranges += 1;
      }
      const appels = appelsE(src, 'onRanger').length;
      if (appels !== ranges) fautes.push(`${nom} : ${appels} appel(s) à onRanger, dont ${ranges} rangé(s) sans condition après une écriture`);
    }
    verifier('les deux feuilles RANGENT le résultat de chaque écriture même fermées pendant l’envoi (le voile, la croix) : '
      + '`onRanger(<résultat>` au premier niveau du bloc où l’écriture a réussi — l’ajout, le prix changé, l’écriture de la '
      + 'feuille d’un poste —, jamais sous une condition (`vivant.current` ne garde que la feuille elle-même) ; sinon la carte '
      + 'garde l’ancienne référence et la prochaine écriture part « modifiée entre-temps »',
    vues.length === 3 && fautes.length === 0, fautes.join(' ; ') || vues.join(' ; '));
  }

  /* -- LE PRIX PORTÉ, L'AVERTISSEMENT, LE POSTE PROCHE ------------------- */
  {
    const a = EC.ajout;
    const montant = balisesE(a, 'ChampMontant')[0] || '';
    const existe = a.slice(a.indexOf("} else if (feuille.etat === 'existe') {"), a.indexOf("titre = 'Ajouter à ma base';"));
    const saisie = a.slice(a.indexOf("titre = 'Ajouter à ma base';"));
    const porter = blocApres(a, 'const porter = (centimes) => {');
    verifier('…quand la feuille passe à « existe déjà », le champ du prix GARDE ce qui y est tapé : le même `ChampMontant`, sous la '
      + 'MÊME clé (`key="prix"`, écrite en clair), rendu par `champ(` dans les deux états ; la PREMIÈRE lettre tapée le dit '
      + '(`surPremiereFrappe`), et seul `porter()` — un prix lu, puis réarmé — l’efface (ECRAN4). « Même prix » se décide dans '
      + '`etatDeLaFeuilleAjout`, jamais ici',
    /key="prix"/.test(montant) && !/key=\{/.test(montant) && /\.\.\.champ\(existant\)/.test(existe) && /\.\.\.champ\(/.test(saisie)
      && /surPremiereFrappe=\{\(\) => setPrixTouche\(true\)\}/.test(montant)
      && (a.match(/setPrixTouche\(/g) || []).length === 2 && /setPrixTouche\(false\)/.test(porter)
      && /refPrix\.current\.rearmer\(\)/.test(porter) && /setPrixTape\(centimes\)/.test(porter)
      && (a.match(/setPrixTape\(/g) || []).length === 1
      && !/memePrix\s*=|aUneReference\s*=|posteExistant\(valeurs, postes\)/.test(a), montant.slice(0, 160));
    const lePoste = [...existe.matchAll(/Le poste : « \$\{([\w.]+)\}/g)].map((m) => m[1]);
    verifier('…« ce poste existe déjà » nomme le POSTE par SA phrase (`existant.designation`), jamais par celle de la ligne ; la '
      + 'ligne, elle, est dite « Votre ligne » ; et la sortie (`PHRASE_SORTIE`) est là quand l’une est la variante de l’autre',
    lePoste.length >= 1 && lePoste.every((x) => x === 'existant.designation')
      && /Votre ligne : « \$\{valeurs\.designation\} »/.test(existe) && /\{PHRASE_SORTIE\}/.test(existe), lePoste.join(', '));
    const desactives = [...a.matchAll(/disabled=\{([^}]*)\}/g)].map((m) => m[1]);
    verifier('…l’avertissement d’un nom de client ne DÉSACTIVE rien (« M. Blanc » et « blanc cassé » font un faux positif connu) : '
      + 'chaque bouton de la feuille n’est grisé que pendant l’envoi (`disabled={envoi}`)',
    desactives.length >= 2 && desactives.every((x) => x.trim() === 'envoi'), desactives.join(' | '));
    verifier('…et un SEUL poste proche est nommé : `postesProches(…)[0]`, un seul appel, aucune liste parcourue',
    (a.match(/postesProches\(/g) || []).length === 1 && /postesProches\(postes, valeurs\)\[0\] \|\| null/.test(a)
      && !/postesProches\([^)]*\)\.(map|forEach|slice)/.test(a));
  }

  /* -- LA FEUILLE D'UN POSTE ---------------------------------------------- */
  {
    const p = EC.poste;
    const phrases = balisesE(p, 'ChampPhrase');
    verifier('`FeuillePoste` : la phrase n’est MODIFIABLE que depuis la page (`depuisLaPage`) — depuis la carte, elle détacherait le '
      + 'poste de la ligne ouverte ; la conséquence d’une correction se CALCULE (`consequenceDeLaCorrection`)',
    phrases.length === 1 && /\{depuisLaPage \? \(\s*<ChampPhrase\b/.test(p) && /consequenceDeLaCorrection\(/.test(p)
      && /disabled=\{envoi \|\| consequence\.consequence === 'doublon'\}/.test(p));
    verifier('…toute écriture part SOUS CONDITION sur la date lue, une garde par référence, et les DEUX retraits — le prix et le '
      + 'poste — en DEUX appuis : le premier ne fait que demander (ECRAN2)',
    appelsE(p, 'api\\.(?:modifierPoste|retirerPoste)').length === 3
      && appelsE(p, 'api\\.(?:modifierPoste|retirerPoste)').every((x) => /modifieLe: poste\.modifieLe/.test(x))
      && /if \(enVol\.current\) return;/.test(p) && /if \(!confirmeRetrait\) \{ setConfirmeRetrait\(true\); return; \}/.test(p)
      && /const retirerLePrix = \(\) => \{\s*if \(!confirmeRetraitPrix\) \{ setConfirmeRetraitPrix\(true\); return; \}\s*ecrire\(/.test(p));
  }

  /* -- LES DEUX FEUILLES, DANS LEURS FICHIERS ----------------------------- */
  verifier('les deux feuilles passent par `<FeuilleBas` (elles montent avec le clavier), chacune dans SON fichier, sans '
    + '`{...CLAVIER}` ; rendues par `SaisieDevisScreen` et `PostesScreen`, qui ne posent pas de `<FeuilleBas` eux-mêmes',
  [EC.ajout, EC.poste].every((x) => /<FeuilleBas\b/.test(x) && !/\{\.\.\.CLAVIER\}/.test(x))
    && /<FeuilleAjoutPoste\b/.test(EC.saisie) && /<FeuillePoste\b/.test(EC.saisie) && /<FeuillePoste\b/.test(EC.page)
    && ![EC.saisie, EC.page].some((x) => /<FeuilleBas\b/.test(x)));

  /* -- LA SAISIE : UN SEUL ÉTAT DE FEUILLE --------------------------------- */
  {
    const s = EC.saisie;
    const booleens = [...s.matchAll(/const \[(\w+), set\w+\] = useState\(false\)/g)].map((m) => m[1]);
    const sortir = blocApres(s, 'const sortir = async ({ parLeRetour = false } = {}) => {');
    const rendre = blocApres(s, 'const rendreLaFeuille = () => {');
    verifier('`SaisieDevisScreen` tient UN état `feuille` (jamais deux booléens) : plus de `choixClient`, aucun `useState(false)` '
      + 'nommé pour une feuille, `sortir()` pose `feuille` à `null`, et le rendu est UN `switch` sur `feuille.type`',
    /const \[feuille, setFeuille\] = useState\(null\);/.test(s) && !/choixClient/.test(s)
      && !booleens.some((n) => /choix|feuille|ajout|poste|client/i.test(n))
      && /setFeuille\(null\)/.test(sortir) && /switch \(feuille\.type\)/.test(rendre)
      && ['ChoixClientDevis', 'FeuilleAjoutPoste', 'FeuillePoste'].every((n) => balisesE(s, n).length === 1
        && balisesE(rendre, n).length === 1), `booléens : ${booleens.join(', ')}`);
    /* Q3 a : la LISTE est l'écran qu'on montre à un client. */
    const def = (/const RangeeLigne = React\.memo\(function RangeeLigne\(\{([\s\S]*?)\}\)/.exec(s) || [])[1] || '';
    const rangee = balisesE(s, 'RangeeLigne').join('\n');
    verifier('…et `RangeeLigne` (la liste du devis) ne reçoit RIEN de la base de postes — ni référence, ni écart, ni « réf. » '
      + '(réponse du propriétaire du 23/10, Q3 a)', def.length > 50 && rangee.length > 50
      && !/postes?\b|reference|ecart|r[ée]f\b/i.test(def + rangee), def.replace(/\s+/g, ' ').slice(0, 160));
  }

  /* -- LA PAGE ------------------------------------------------------------ */
  {
    const pg = EC.page;
    const liste = balisesE(pg, 'FlatList')[0] || '';
    const brancheEchec = blocApres(pg, "if (vue.vide === 'illisible') {");
    const chaines = pg.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) || [];
    const textesJsx = [...pg.matchAll(/>([^<>{}=;()]*[\p{L}][^<>{}=;()]*)</gu)].map((m) => m[1]);
    const dits = [...chaines, ...textesJsx].join('\n');
    const promesses = [/personne d.autre ne/i, /personne ne les/i, /ne peut pas lire/i]
      .filter((r) => r.test(dits)).map(String);
    const impossibles = (dits.match(/impossible/gi) || []).length - (dits.match(/Lecture impossible/g) || []).length;
    verifier('`PostesScreen` : une `FlatList` réglée (les trois réglages) qui porte `{...CLAVIER}` ; sur un échec « Lecture '
      + 'impossible » et un vrai bouton, JAMAIS « Aucun poste » ; « Liste incomplète » branchée sur `incomplete` ; aucun bouton '
      + '« Nouveau poste » (Q4 a)',
    /initialNumToRender=\{\d+\}/.test(liste) && /maxToRenderPerBatch=\{\d+\}/.test(liste) && /windowSize=\{\d+\}/.test(liste)
      && /\{\.\.\.CLAVIER\}/.test(liste) && /titre="Lecture impossible"/.test(brancheEchec)
      && /label: 'Réessayer'/.test(brancheEchec) && !/Aucun poste/.test(brancheEchec)
      && /\{!!vue\.bandeIncomplete && \([\s\S]{0,200}\{vue\.bandeIncomplete\}/.test(pg) && !/Nouveau poste/i.test(pg), liste.slice(0, 120));
    /* TEXTES11 : sur CET écran, « la base », pour l'artisan, c'est SA base de
       postes — le serveur se nomme « le serveur d’Opus » ; et « n’a pas
       répondu » affirmait une cause qu'on ne connaît pas. */
    const laBase = dits.match(/(?<![\p{L}])[Ll]a base(?! de postes)[^\n]{0,40}/gu) || [];
    verifier('…et « la base » n’y désigne jamais le serveur, ni une cause qu’on ne connaît pas (« n’a pas répondu ») — TEXTES11',
      laBase.length === 0 && !/n’a pas répondu/.test(dits) && /serveur d’Opus/.test(dits),
      `${laBase.join(' | ')}`);
    verifier('…et aucune promesse qu’aucun écran ne tient : ni « personne d’autre ne », ni « personne ne les », ni « ne peut pas '
      + 'lire », ni « impossible » ailleurs que dans « Lecture impossible » — c’est un ENGAGEMENT, pas une impossibilité',
    promesses.length === 0 && impossibles === 0 && /Aucun écran d’Opus ne les montre à quelqu’un d’autre que vous\./.test(pg),
    `${promesses.join(', ')} ; « impossible » hors « Lecture impossible » : ${impossibles}`);
  }

  /* -- LES PROPOSITIONS ---------------------------------------------------- */
  {
    const d = EC.designation;
    const conteneur = balisesE(d, 'View').find((b) => /style=\{s\.liste\}/.test(b)) || '';
    const detail = balisesE(d, 'Text').find((b) => /style=\{s\.suggestionDetail\}/.test(b)) || '';
    verifier('`ChampDesignation` : les rangées viennent de `propositionsAMontrer` ; le conteneur de la liste ne porte AUCUN '
      + 'libellé (VoiceOver ne le lit pas) ; chaque rangée porte `r.libelle` ; le détail tient sur UNE ligne '
      + '(`numberOfLines={1}`) ; la clé React porte la `cle` de la rangée',
    /propositionsAMontrer\(\{/.test(d) && conteneur.length > 0 && !/accessibilityLabel/.test(conteneur)
      && /accessibilityLabel=\{r\.libelle\}/.test(d) && /numberOfLines=\{1\}/.test(detail)
      && /key=\{r\.cle\}/.test(d) && !/memoireDesLignes|suggestionsPourLaFrappe/.test(d), `${conteneur} | ${detail}`);
    verifier('`ChampDesignation` et `CarteLigne` obtiennent les clés des postes par `postesPrepares` (dans `postes.js`), jamais par '
      + '`cleDeLigne` appliqué à chaque poste — et aucun des deux n’importe la clé de rapprochement',
    [EC.designation, EC.carte].every((x) => !/cleDeLigne|rapprochement/.test(x)));
  }

  /* -- LES PORTES, ET L'ÉTAT D'`OpusApp` ---------------------------------- */
  {
    const app = EC.app;
    const devisBalise = balisesE(app, 'DevisScreen')[0] || '';
    const profilBalise = balisesE(app, 'ProfilOwnScreen')[0] || '';
    const ouvrir = blocApres(app, 'const ouvrirMaBase = () => {');
    const ranger = blocApres(app, 'const rangerPoste = useCallback((p, { retire = false } = {}) => {');
    verifier('les DEUX portes (« Mes devis » et « Mon profil ») appellent la MÊME fonction, `ouvrirMaBase`, qui relit la base ET le '
      + 'régime ; la page n’existe que pour un professionnel',
    /onMaBase=\{ouvrirMaBase\}/.test(devisBalise) && /onMaBase=\{canPublish \? ouvrirMaBase : null\}/.test(profilBalise)
      && /onPress=\{onMaBase\}/.test(EC.liste) && /onPress=\{onMaBase\}/.test(EC.profil)
      && /setScreen\('postes'\)/.test(ouvrir) && /chargerPostes\(\)/.test(ouvrir) && /lireRegime\(/.test(ouvrir)
      && (app.match(/\bouvrirMaBase\b/g) || []).length === 3, ouvrir.slice(0, 120));
    verifier('`rangerPoste` REMPLACE le tableau (jamais une mutation en place : c’est ce qui invalide les clés en cache de '
      + '`postesPrepares`) ; `lireRegime` lit le régime ET sa date (`monRegimeEtSaDate`)',
    /setPostes\(\(liste\) => \{/.test(ranger) && !/liste\.(?:push|splice|sort|reverse)\(|liste\[\w+\]\s*=/.test(ranger)
      && /\.slice\(\)/.test(ranger) && /api\.monRegimeEtSaDate\(\)/.test(app) && !/api\.monRegime\(\)/.test(app)
      && /setRegimeDeclareLe\(/.test(blocApres(app, 'const recevoirEmetteur = useCallback((emetteur) => {')));
  }

  /* -- CE QUE LES ÉCRANS AFFICHENT, FAIT TOURNER ------------------------- */
  {
    const recoud = (m) => `${m.avant}${m.prix == null ? '' : CT.centimesLisibles(m.prix)}${m.apres}`;
    const l52 = Li('Chape sèche avant carrelage collé', 'm2', 5200);
    const r = P.referenceDuPoste(l52, POSTES);
    const e = P.ecartAuPoste(l52, POSTES);
    const mr = P.morceauxDeLaReference(r);
    const me = P.morceauxDeLEcart(e);
    /* Un poste dont la phrase CONTIENT déjà le montant : la coupe se fait sur
       le DERNIER, celui qui suit la phrase citée. */
    const piege = { ...POSTES[0], designation: `Forfait ${CT.centimesLisibles(4500)} chape` };
    const lp = Li(`forfait ${CT.centimesLisibles(4500)} chape`, 'm2', 5200);
    const rp = P.referenceDuPoste(lp, [piege]);
    const mp = rp ? P.morceauxDeLaReference(rp) : { avant: '', prix: null, apres: '' };
    verifier('ce que la carte affiche en morceaux se RECOUD : la référence et l’écart, montant compris (`Montant` à l’encre du texte), '
      + 'et la coupe d’une référence qui nomme un poste dont la phrase contient déjà le montant tombe sur le BON',
    !!r && !!e && recoud(mr) === P.phraseReference(r) && mr.prix === 4500 && recoud(me) === P.phraseEcart(e) && me.prix === 5200
      && !!rp && recoud(mp) === P.phraseReference(rp) && mp.prix === 4500 && mp.avant.includes('« Forfait ') && mp.apres.startsWith(' / m²')
      && json(P.morceauxDeLaReference(null)) === json({ avant: '', prix: null, apres: '' }),
    json({ mr, me, mp }));
    const fnc = POSTES.find((x) => x.fournitureNonComprise) || null;
    const proche = P.phraseProche({ ...POSTES[0], unite: 'forfait', prixReferenceCentimes: 90000 }, { unite: 'm2' });
    const prixPoste = P.phrasePrixDuPoste(POSTES[0], 'Son prix de référence');
    verifier('…et leurs phrases : « Faire de 52,00 € votre prix de référence pour ce poste » ; « Déjà dans votre base, au forfait : '
      + '« … » (900,00 € / forfait). » ; « Son prix de référence : 45,00 € / m², fixé le … » ; l’avertissement d’un nom de client ; '
      + '« fixé le …, avant la déclaration de votre régime de TVA actuel : vérifiez-le » sur un poste',
    P.libelleChangerReference(e) === `Faire de ${CT.centimesLisibles(5200)} votre prix de référence pour ce poste`
      && proche === `Déjà dans votre base, au forfait : « ${POSTES[0].designation} » (${CT.centimesLisibles(90000)} / forfait).`
      && /^Son prix de référence : 45,00\s€ \/ m², fixé le \d\d\/\d\d\/\d{4}\.$/.test(prixPoste || '')
      && P.phrasePrixDuPoste({ ...POSTES[0], prixReferenceCentimes: null }, 'Son prix') === null
      && /^Cette phrase contient « Durandal », le nom du client de ce devis\. Elle resterait dans votre base même si vous supprimez ce client\.$/
        .test(P.phraseIndices(P.indicesDuClient('Pose chez Durandal', { client: { nom: 'Mme Fictive Durandal' } }).filter((i) => i.genre === 'nom')) || '')
      && P.phraseIndices([]) === null
      && /avant la déclaration de votre régime de TVA actuel : vérifiez-le$/.test(P.phraseFixeLe(POSTES[0], { regimeDeclareLe: '2099-01-01T00:00:00Z' }) || '')
      && !/avant/.test(P.phraseFixeLe(POSTES[0], { regimeDeclareLe: '2001-01-01T00:00:00Z' }) || 'avant')
      && (fnc === null || /^Déjà dans votre base, (avec la fourniture|fourniture non comprise) : /.test(P.phraseProche(fnc, { unite: fnc.unite, fournitureNonComprise: !fnc.fournitureNonComprise }) || '')),
    json({ proche, prixPoste }));
  }

  /* -- AUCUNE COMPARAISON DE PHRASES PAR L'ÉCRAN ------------------------- */
  {
    const fautifs = ['carte', 'designation', 'ajout', 'poste', 'page', 'saisie']
      .filter((k) => /\.normalize\(|\.toLowerCase\(|\.toUpperCase\(|localeCompare\(/.test(EC[k])).map((k) => ECRANS_BASE[k]);
    verifier('aucun écran de la base n’appelle `normalize`, `toLowerCase` ni `localeCompare` pour comparer des phrases : la clé '
      + '(dans `postes.js`) suffit, et elle est la même sur l’iPhone et dans PostgreSQL', fautifs.length === 0, fautifs.join(', '));
  }
} catch (e) {
  verifier('la lecture des écrans va jusqu’au bout : rien ne PLANTE', false, e && e.stack);
}

/* ================================================================== */
/*  E bis. CE QUE LES ÉCRANS MONTRENT, FAIT TOURNER — et les écrans     */
/*         qui doivent passer par là (corrections « écran », 24/10)     */
/* ================================================================== */
console.log('\nE bis. CE QUE LES ÉCRANS MONTRENT, FAIT TOURNER — les propositions, la phrase de T11, le bloc de la carte, les deux '
  + 'feuilles, la page, la lecture de la base, la rangée de la liste ; puis les écrans, qui doivent passer par ces fonctions sans '
  + 'toucher à ce qu’elles rendent');
/*
 * POURQUOI CETTE PARTIE. La relecture « écran » du lot P a posé quinze
 * défauts d'écran sur une copie du dépôt — six propositions, des
 * propositions dès une lettre, la phrase de T11 qui s'efface au premier
 * champ quitté, « Ajouter à ma base » pendant la lecture, une porte
 * masquée, une page qui cherche « à la lettre », la référence écrite dans
 * la liste du devis… — et quatorze passaient ce contrôle, qui lisait la
 * FORME du code des écrans (ECRAN1). Les règles vivent désormais dans
 * `postes.js` et `devis.js`, qu'on FAIT TOURNER ici sur les cas qui
 * comptent ; la seconde moitié refuse un écran qui ne les appelle plus, ou
 * qui touche à ce qu'elles rendent (une liste FERMÉE de formes, pas une
 * liste de noms interdits). Ce qui ne se voit qu'à l'écran — une position,
 * une couleur calculée, un geste, une feuille qui passe d'un état à
 * l'autre pendant qu'on tape — reste à `mesure-devis`, au navigateur.
 */
try {
  const recoudre = (m) => (m ? `${m.avant}${m.prix == null ? '' : CT.centimesLisibles(m.prix)}${m.apres}` : null);
  const parleDeFourniture = (d) => /fourniture/.test(d || '');

  /* -- (1) LES NOMBRES DE LA PROMESSE ------------------------------------ */
  verifier('la promesse au propriétaire, écrite UNE fois, dans `postes.js` : `PROPOSITIONS_MAX` vaut 3 et `LETTRES_MIN` vaut 3 '
    + '(« il ne faut pas qu’il y ait trop de propositions, ça pourrait nous perdre », 23/10)',
  P.PROPOSITIONS_MAX === 3 && P.LETTRES_MIN === 3, `${P.PROPOSITIONS_MAX} / ${P.LETTRES_MIN}`);

  /* -- (2) LES PROPOSITIONS À MONTRER, sur TOUS les débuts de mots ------- */
  {
    const montrer = (texte, plus = {}) => P.propositionsAMontrer({ postes: POSTES, postesEtat: 'ok', memoire: MEMOIRE_DEMO, texte, ...plus });
    const rangees = new Set([...MEMOIRE_DEMO.map((l) => D.texteNet(l.designation)), ...POSTES.map((p) => p.designation)].filter(Boolean));
    const textes = new Set();
    for (const x of rangees) for (const mot of String(x).split(/\s+/)) for (let k = 1; k <= mot.length; k += 1) textes.add(mot.slice(0, k));
    const fautes = [];
    let courts = 0;
    for (const t of textes) {
      const r = montrer(t);
      const quoi = [];
      if (r.length > 3) quoi.push(`${r.length} rangées`);
      if (t.trim().length < 3 && r.length) quoi.push('des rangées sous trois lettres');
      if (t.trim().length < 3) courts += 1;
      if (new Set(r.map((x) => x.cle)).size !== r.length) quoi.push('une clé de rangée en double');
      r.forEach((x) => {
        const p = x.proposition;
        const fourniture = parleDeFourniture(x.distinction);
        const v = P.valeursDeLaProposition(p);
        const recopie = v && Number.isSafeInteger(v.prixUnitaireCentimes) && v.prixUnitaireCentimes > 0 ? v.prixUnitaireCentimes : null;
        if (x.titre !== p.designation || !rangees.has(x.titre)) quoi.push('un titre qui n’est pas la phrase rangée');
        if (recoudre(x.morceaux) !== P.detailDeSuggestion(p, { sansFourniture: fourniture }) || x.morceaux.prix !== recopie) {
          quoi.push('un détail qui ne se recoud pas, ou qui met en avant un autre prix que celui recopié');
        }
        if (x.libelle !== P.libelleDeSuggestion(p, { avecLaFourniture: fourniture })) quoi.push('un libellé VoiceOver qui n’est pas le sien');
        if (fourniture && /fourniture non comprise/.test(recoudre(x.morceaux))) quoi.push('la fourniture dite deux fois sur la ligne');
      });
      if (quoi.length) fautes.push(`« ${t} » : ${quoi.join(', ')}`);
    }
    verifier(`les rangées que \`ChampDesignation\` affiche (\`propositionsAMontrer\`), sur ${textes.size} textes — chaque début de mot `
      + `de chaque phrase rangée, dès UNE lettre (${courts} textes de moins de trois lettres) : jamais plus de trois, RIEN sous trois `
      + 'lettres, chaque titre la phrase rangée mot pour mot, le détail recousu autour du prix qu’un appui recopie, le libellé '
      + 'VoiceOver le sien, la fourniture jamais dite deux fois',
    textes.size >= 300 && courts >= 30 && fautes.length === 0, `${textes.size} textes ; ${fautes.slice(0, 4).join(' | ')}`);
    const pos = montrer('Pos');
    const po = montrer('Po');
    const brut = P.suggestionsPourLaFrappe({ postes: POSTES, memoire: MEMOIRE_DEMO, texte: 'Po' });
    verifier('…et les TÉMOINS : « Pos » rend EXACTEMENT trois rangées, les trois « Pose » ; « Po » n’en rend AUCUNE, alors que le '
      + 'calcul sans la garde en trouverait — c’est bien la garde des trois lettres qui se tait',
    pos.length === 3 && pos.every((x) => /^Pose /.test(x.titre)) && po.length === 0 && brut.length > 0,
    `${json(pos.map((x) => x.titre))} ; « Po » : ${po.length}, sans la garde : ${brut.length}`);
    const six = [1, 2, 3, 4, 5, 6].map((n) => Lm(`e${n}`, `Enduit de lissage numéro ${n}`, 'm2', 1000 * n, n));
    verifier('…`suggestionsPourLaFrappe` ne rend JAMAIS plus de trois propositions, même quand on lui en demande six (la promesse '
      + 'est tenue par le calcul, pas par l’écran qui l’appelle)',
    P.suggestionsPourLaFrappe({ postes: [], memoire: six, texte: 'enduit', max: 6 }).length === 3
      && P.suggestionsPourLaFrappe({ postes: [], memoire: six, texte: 'enduit', max: 2 }).length === 2
      && P.propositionsAMontrer({ memoire: six, texte: 'enduit' }).length === 3);
    verifier('…RIEN à l’ouverture d’une ligne existante ni après un choix : le texte CHOISI (`choisi`) ne propose rien — « chape » '
      + 'en propose deux, « chape » choisi aucune (B1 du lot 1 : un appui distrait changeait le prix)',
    montrer('chape').length === 2 && montrer('chape', { choisi: 'chape' }).length === 0 && montrer('chape', { choisi: 'autre' }).length === 2);
    const nonLue = ['echec', 'chargement', 'vide', undefined].map((e) => [e, montrer('chape', { postesEtat: e })]);
    verifier('…une base NON LUE (en lecture, en échec, jamais demandée) ne propose rien d’elle — la mémoire, oui ; et sans aucune des '
      + 'deux sources, rien',
    nonLue.every(([, r]) => r.length > 0 && r.every((x) => x.proposition.source !== 'base'))
      && P.propositionsAMontrer({ postes: POSTES, postesEtat: 'echec', memoire: null, texte: 'chape' }).length === 0
      && P.postesLus(POSTES, 'ok') === POSTES && ['echec', 'chargement', 'vide', null].every((e) => P.postesLus(POSTES, e) === null),
    json(nonLue.map(([e, r]) => [e, r.map((x) => x.proposition.source)])));
    const chape = montrer('chape');
    const unite = P.propositionsAMontrer({ postes: POSTES, postesEtat: 'ok', memoire: [Lm('cf', 'Chape sèche avant carrelage collé', 'forfait', 90000, 1)], texte: 'chape' });
    verifier('…deux propositions de la MÊME phrase disent ce qui les DISTINGUE, en tête du détail : « avec la fourniture » / '
      + '« fourniture non comprise » (la fourniture n’est plus répétée plus loin), « au mètre carré » / « au forfait » ; VoiceOver '
      + 'entend « avec la fourniture » ; deux phrases différentes ne portent rien (ECRAN9)',
    chape.length === 2 && chape[0].titre === chape[1].titre
      && json(chape.map((x) => x.distinction)) === json(['avec la fourniture', 'fourniture non comprise'])
      && /, avec la fourniture, /.test(chape[0].libelle) && /, fourniture non comprise, /.test(chape[1].libelle)
      && !/fourniture/.test(recoudre(chape[1].morceaux))
      && json(unite.map((x) => x.distinction)) === json(['au mètre carré', 'au forfait'])
      && pos.every((x) => x.distinction === null),
    json({ chape: chape.map((x) => [x.distinction, recoudre(x.morceaux)]), unite: unite.map((x) => x.distinction) }));
  }

  /* -- (3) LA PHRASE DE T11 --------------------------------------------- */
  {
    const avantH = { unite: 'h', quantiteMilliemes: 12000 };
    const pas = (e, g) => P.phraseUniteApres(e, g);
    const posee = pas(P.PHRASE_UNITE_VIDE, { type: 'proposition', avant: avantH, unite: 'forfait', quantite: '12' });
    const attendue = P.changementDUnite(avantH, { unite: 'forfait' });
    const seconde = pas(posee, { type: 'proposition', avant: { unite: 'forfait', quantiteMilliemes: 12000 }, unite: 'forfait', quantite: '12' });
    verifier('la phrase de T11 (`phraseUniteApres`) : une proposition qui change l’unité d’une ligne qui a une quantité la POSE ; une '
      + 'SECONDE proposition de même unité la GARDE (ECRAN7) ; la quantité quittée SANS changement la garde (le défaut de l’étape 7) ; '
      + 'retouchée, elle l’efface ; une unité rechoisie ou une surface recopiée l’effacent ; sans quantité, rien',
    attendue && posee.phrase === attendue && posee.quantite === '12' && seconde.phrase === attendue
      && pas(posee, { type: 'quantite_quittee', quantite: '12' }).phrase === attendue
      && pas(posee, { type: 'quantite_quittee', quantite: '1' }).phrase === null
      && pas(posee, { type: 'unite' }).phrase === null && pas(posee, { type: 'surface' }).phrase === null
      && pas(P.PHRASE_UNITE_VIDE, { type: 'proposition', avant: { unite: 'h' }, unite: 'forfait', quantite: '' }).phrase === null
      && pas(P.PHRASE_UNITE_VIDE, { type: 'quantite_quittee', quantite: '3' }).phrase === null,
    json({ posee, seconde }));
  }

  /* -- (4) LE BLOC DE LA CARTE --------------------------------------------- */
  {
    const l52 = Li('Chape sèche avant carrelage collé', 'm2', 5200);
    const vue = (l, etat = 'ok', opts = {}) => P.vueDeLaBase(l, POSTES, etat, opts);
    const v52 = vue(l52);
    const muets = ['echec', 'chargement', 'vide', null].map((e) => vue(l52, e));
    const vide = (v) => v.reference === null && v.existe === null && v.ecart === null && v.phraseEtat === null && v.action === null;
    const neuve = Li('Niche murale carrelée', 'u', 24000);
    verifier('le bloc de la carte (`vueDeLaBase`) : la chape à 52 € dit sa référence et son écart (recousus), et propose « Changer ma '
      + 'référence » avec le prix de la LIGNE ; une base NON LUE ne dit RIEN — ni référence peut-être périmée, ni bouton ; « Ajouter '
      + 'à ma base » n’existe que d’une base lue (jamais pendant la lecture : on proposerait un doublon) et que si l’écran a une '
      + 'feuille à ouvrir',
    recoudre(v52.reference) === P.phraseReference(P.referenceDuPoste(l52, POSTES)) && v52.ecart
      && recoudre(v52.ecart.morceaux) === P.phraseEcart(P.ecartAuPoste(l52, POSTES)) && v52.ecart.libelle === P.libelleEcart(P.ecartAuPoste(l52, POSTES))
      && v52.action && v52.action.cle === 'changer' && v52.action.avecLePrixDeLaLigne === true
      && v52.action.nom === P.libelleChangerReference(P.ecartAuPoste(l52, POSTES)) && muets.every(vide)
      && vue(neuve).action && vue(neuve).action.cle === 'ajouter' && vide(vue(neuve, 'chargement')) && vide(vue(neuve, 'echec'))
      && vue(neuve, 'ok', { peutAjouter: false }).action === null && vide(vue({ ...l52, type: 'zone' })),
    json({ v52, muets }));
    const dep = Li('Depose de l’ancien carrelage au sol', 'm2', 2000);
    const vDep = vue(dep);
    const faience = Li('pose de faience murale', 'h', 4500, { mainOeuvre: true });
    const vFai = vue(faience);
    const vFai2 = vue(Li('Pose de faïence murale', 'h', 4500, { mainOeuvre: true }));
    const vAvant = vue(l52, 'ok', { regimeDeclareLe: '2099-01-01T00:00:00Z' });
    const vEgal = vue(Li('Chape sèche avant carrelage collé', 'm2', 4500));
    verifier('…une ligne VARIANTE dit « Ce poste existe déjà dans votre base » et la sortie en UN paragraphe — sans recopier la phrase '
      + 'du poste quand la référence la cite déjà (ECRAN9) ; sans référence, il la nomme, dit « Il n’a pas encore de prix de '
      + 'référence. » et propose « Fixer le prix » ; même phrase sans prix : « Dans votre base, sans prix de référence. » ; prix égal : '
      + '« Dans votre base de postes. » et « Modifier » ; référence d’avant le régime : « Modifier », aucune question',
    vDep.existe === `Ce poste existe déjà dans votre base. ${P.PHRASE_SORTIE}` && /pour « Dépose de l’ancien carrelage au sol »/.test(recoudre(vDep.reference))
      && vDep.action.cle === 'changer'
      && vFai.existe === `Ce poste existe déjà dans votre base, sous « Pose de faïence murale ». ${P.PHRASE_SORTIE}`
      && vFai.reference === null && vFai.phraseEtat === 'Il n’a pas encore de prix de référence.' && vFai.action.cle === 'fixer'
      && vFai2.existe === null && vFai2.phraseEtat === 'Dans votre base, sans prix de référence.' && vFai2.action.cle === 'fixer'
      && vEgal.ecart === null && vEgal.phraseEtat === 'Dans votre base de postes.' && vEgal.action.cle === 'modifier'
      && vEgal.action.avecLePrixDeLaLigne === false && vAvant.ecart === null && vAvant.action.cle === 'modifier',
    json({ vDep: vDep.existe, vFai: [vFai.existe, vFai.phraseEtat], vFai2: vFai2.phraseEtat, vEgal: vEgal.phraseEtat }));
  }

  /* -- (5) LA FEUILLE « AJOUTER À MA BASE » ------------------------------- */
  {
    const valeurs = P.posteDepuisLaLigne(Li('Chape sèche avant carrelage collé', 'm2', 5200));
    const etat = (plus) => P.etatDeLaFeuilleAjout({ valeurs, postes: POSTES, ...plus });
    const ref = POSTES[0].prixReferenceCentimes;
    const sansPrix = P.etatDeLaFeuilleAjout({ valeurs: P.posteDepuisLaLigne(Li('Pose de faïence murale', 'h', 4500, { mainOeuvre: true })), postes: POSTES, prixTape: 4500 });
    const r = {
      saisie: P.etatDeLaFeuilleAjout({ valeurs, postes: null, prixTape: 5200 }),
      invisible: P.etatDeLaFeuilleAjout({ valeurs, postes: [], doublonInvisible: true }),
      meme: etat({ prixTape: ref }),
      enTrainDeTaper: etat({ prixTape: ref, prixTouche: true }),
      vide: etat({ prixTape: null }),
      autre: etat({ prixTape: 5200 }),
    };
    verifier('la feuille d’ajout (`etatDeLaFeuilleAjout`) : « saisie » tant que la base lue n’a pas ce poste ; « existe » sinon — et '
      + '« même prix » (« Fermer » seul, NI champ NI bouton) seulement quand le prix PORTÉ est un vrai montant égal à la référence ET '
      + 'que l’artisan ne tape pas : un prix en train d’être tapé garde le champ et « Changer ma référence » (ECRAN4), un prix VIDE '
      + 'n’est jamais « le même » ; sans référence, « Fixer le prix » ; un doublon que la base ne montre pas : « invisible »',
    r.saisie.etat === 'saisie' && r.saisie.champ && r.saisie.action === 'ajouter'
      && r.invisible.etat === 'invisible' && !r.invisible.champ && r.invisible.action === null
      && r.meme.etat === 'existe' && r.meme.memePrix && !r.meme.champ && r.meme.action === null
      && !r.enTrainDeTaper.memePrix && r.enTrainDeTaper.champ && r.enTrainDeTaper.action === 'changer'
      && !r.vide.memePrix && r.vide.champ && r.vide.action === 'changer' && r.autre.action === 'changer'
      && sansPrix.etat === 'existe' && sansPrix.action === 'fixer' && sansPrix.champ
      && !!r.meme.existant && r.meme.existant.id === 'p1',
    json(Object.fromEntries(Object.entries(r).map(([k, x]) => [k, [x.etat, x.memePrix, x.champ, x.action]]))));
  }

  /* -- (6) LA FEUILLE D'UN POSTE ------------------------------------------ */
  {
    const chape = POSTES[0];
    const carte = P.vueDeLaFeuillePoste({ poste: chape, prixPropose: 5200 });
    const page = P.vueDeLaFeuillePoste({ poste: chape, depuisLaPage: true });
    const sansPrix = P.vueDeLaFeuillePoste({ poste: POSTES[1], depuisLaPage: true });
    const retrait = P.phraseRetraitDuPrix(chape);
    verifier('la feuille d’un poste (`vueDeLaFeuillePoste`) : ouverte depuis la CARTE avec un autre prix que la référence, elle DIT '
      + 'la référence (« Votre prix de référence actuel : 45,00 € / m², fixé le … », ECRAN3), n’offre qu’« Enregistrer » et renvoie '
      + 'à la page pour retirer (ECRAN2) ; depuis la PAGE, « Le prix actuel a été fixé le … » et les deux retraits — celui du prix '
      + 'seulement s’il y en a un ; le second appui dit ce qui part (« … sera effacé : Opus n’en garde aucune trace. »)',
    carte.prixDepart === 5200 && recoudre(carte.phrasePrix) === `Votre prix de référence actuel : ${CT.centimesLisibles(4500)} / m², fixé le 14/10/2026.`
      && carte.phrasePrix.prix === 4500 && !carte.retirerLePrix && !carte.retirerLePoste && carte.renvoiALaPage
      && page.prixDepart === 4500 && recoudre(page.phrasePrix) === 'Le prix actuel a été fixé le 14/10/2026.'
      && page.retirerLePrix && page.retirerLePoste && !page.renvoiALaPage
      && !sansPrix.retirerLePrix && sansPrix.retirerLePoste && sansPrix.phrasePrix === null
      && recoudre(retrait) === `Le prix de référence ${CT.centimesLisibles(4500)} / m², fixé le 14/10/2026, sera effacé : Opus n’en garde aucune trace.`
      && retrait.prix === 4500 && P.phraseRetraitDuPrix(POSTES[1]) === null,
    json({ carte, page, sansPrix, retrait }));

    const absente = P.vueDeLaFeuillePoste({ poste: chape, depuisLaPage: true, absent: true });
    verifier('…et un poste ABSENT de la base relue (TEXTES5) : rien à enregistrer, rien à retirer, la phrase dit pourquoi',
      absente.enregistrer === false && !absente.retirerLePrix && !absente.retirerLePoste && !absente.renvoiALaPage
      && absente.phraseAbsent === P.PHRASE_POSTE_ABSENT && page.enregistrer === true && page.phraseAbsent === null,
    json(absente));

    /* « RETIRER CE POSTE » DIT CE QUI ARRIVE VRAIMENT (relecture « textes »,
       TEXTES2). La phrase d'avant promettait « Il ne sera plus proposé sur
       vos devis » ; or un poste naît d'une ligne de devis, et la mémoire des
       prix relit ces lignes : le poste retiré, la même phrase REVIENT. On le
       FAIT TOURNER — un poste et la ligne d'où il vient, puis le poste
       retiré —, et la phrase de confirmation doit dire ce que le calcul
       montre : si la mémoire repropose, elle le dit, et ne promet rien
       d'autre. Puis la feuille doit afficher CETTE phrase-là, au second
       appui. */
    const phraseDuPoste = 'Dépose de l’évier chez Mme Martin';
    const posteRetire = { id: 'r1', designation: phraseDuPoste, unite: 'forfait', fournitureNonComprise: false, mainOeuvre: false,
      prixReferenceCentimes: 12000, prixFixeLe: '2026-10-20T10:01:00Z', modifieLe: '2026-10-20T10:01:00Z', createdAt: '2026-10-20T10:01:00Z' };
    const ligneDOrigine = { id: 'lr1', type: 'poste', designation: phraseDuPoste, unite: 'forfait', prixUnitaireCentimes: 12000,
      modifieLe: '2026-10-20T10:00:00Z', devis: { id: 'd-martin', objet: 'Salle de bains', source: 'manuelle', modifieLe: '2026-10-20T10:00:00Z' } };
    const avantRetrait = P.suggestionsPourLaFrappe({ postes: [posteRetire], memoire: [ligneDOrigine], texte: 'Dépose', idLigne: 'autre' });
    const apresRetrait = P.suggestionsPourLaFrappe({ postes: [], memoire: [ligneDOrigine], texte: 'Dépose', idLigne: 'autre' });
    const reproposee = apresRetrait.some((x) => x.designation === phraseDuPoste);
    const phraseRetrait = String(P.PHRASE_RETRAIT_DU_POSTE || '');
    verifier('« Retirer ce poste » dit la vérité (TEXTES2) : poste retiré, la mémoire des prix REPROPOSE sa phrase — la confirmation '
      + 'le dit (« Opus peut encore vous la proposer »), ne promet pas « plus proposé sur vos devis », et la feuille l’affiche au '
      + 'second appui',
    avantRetrait.length > 0 && avantRetrait[0].source === 'base' && reproposee
      && /Opus peut encore vous la proposer/.test(phraseRetrait) && /plus proposé comme poste de votre base/.test(phraseRetrait)
      && !/plus proposée? sur vos devis/.test(phraseRetrait) && !/(tant qu|toujours|jamais plus)/.test(phraseRetrait)
      && /\{vue\.retirerLePoste && confirmeRetrait && <Text style=\{s\.aide\}>\{PHRASE_RETRAIT_DU_POSTE\}<\/Text>\}/.test(EC.poste)
      && !/plus proposé sur vos devis/.test(EC.poste),
    json({ avant: avantRetrait.map((x) => x.source), apres: apresRetrait.map((x) => x.source), phraseRetrait }));
  }

  /* -- (7) LA PAGE « MA BASE DE POSTES » ---------------------------------- */
  {
    const page = (plus) => P.vueDeLaPage({ postes: POSTES, etat: 'ok', lus: true, recherche: '', ...plus });
    const ids = (v) => v.visibles.map((p) => p.id);
    const relueRatee = page({ etat: 'echec', recherche: 'zzzz' });
    const jamaisLue = page({ etat: 'echec', lus: false, recherche: 'zzzz' });
    verifier('la page (`vueDeLaPage`) cherche par la CLÉ : « beton » et « BETON » trouvent la dalle, « seche chape » la chape, '
      + '« Les » et « DURANDAL » rien ; triée par la phrase ; après une relecture RATÉE, une recherche sans résultat dit « Aucun poste '
      + 'ne contient » — jamais « Lecture impossible » sous une liste lue (ECRAN6) ; jamais lue : « Lecture impossible », aucune '
      + 'rangée ; le compte (« 8 postes », « 1 poste ») ne se dit que d’une liste lue',
    json(ids(page({ recherche: 'beton' }))) === json(['p8']) && json(ids(page({ recherche: 'BETON' }))) === json(['p8'])
      && json(ids(page({ recherche: 'seche chape' }))) === json(['p1']) && ids(page({ recherche: 'Les' })).length === 0
      && ids(page({ recherche: 'DURANDAL' })).length === 0 && json(ids(page({}))) === json(P.trierPostes(POSTES).map((p) => p.id))
      && relueRatee.garderLaListe && relueRatee.vide === 'recherche' && relueRatee.visibles.length === 0
      && jamaisLue.vide === 'illisible' && jamaisLue.visibles.length === 0 && !jamaisLue.garderLaListe
      && page({ postes: [] }).vide === 'base_vide' && page({}).compte === '8 postes' && page({ postes: [POSTES[0]] }).compte === '1 poste'
      && page({ etat: 'chargement', lus: false }).enAttente && page({ etat: 'chargement', lus: false }).compte === null
      && !page({ etat: 'chargement', lus: true }).enAttente,
    json({ relueRatee: [relueRatee.vide, relueRatee.garderLaListe], jamaisLue: jamaisLue.vide }));
  }

  /* -- (8) LA LECTURE DE LA BASE ------------------------------------------ */
  {
    const combos = [];
    for (const reussie of [true, false]) for (const depassee of [true, false]) for (const jetee of [true, false]) for (const relancee of [true, false]) {
      combos.push([{ reussie, depassee, jetee, relancee }, P.issueDeLaLecture({ reussie, depassee, jetee, relancee })]);
    }
    const coince = combos.filter(([c, i]) => i.etat === null && !i.relancer && !c.depassee);
    verifier('une lecture de la base (`issueDeLaLecture`) ne laisse JAMAIS la base « en lecture » sans qu’une autre lecture soit en '
      + 'route (ECRAN5 : une lecture jetée revenait sans rien poser, et la base disparaissait des devis) : dépassée, la plus récente '
      + 'décidera ; jetée une première fois, elle se RELANCE ; une seconde fois, elle pose l’état sans écraser la liste rangée ; et '
      + 'une base lue reste « ok » pendant qu’on la relit (`etatAuDepartDeLaLecture`)',
    combos.length === 16 && coince.length === 0
      && combos.every(([c, i]) => (c.depassee ? i.etat === null && !i.relancer && !i.prendre : true))
      && combos.every(([c, i]) => (!c.depassee && !c.jetee ? i.etat === (c.reussie ? 'ok' : 'echec') && i.prendre === c.reussie : true))
      && combos.every(([c, i]) => (!c.depassee && c.jetee && !c.relancee ? i.relancer && i.etat === null : true))
      && combos.every(([c, i]) => (!c.depassee && c.jetee && c.relancee ? !i.relancer && !i.prendre && i.etat === (c.reussie ? 'ok' : 'echec') : true))
      && P.etatAuDepartDeLaLecture('ok') === 'ok' && ['echec', 'vide', 'chargement', undefined].every((e) => P.etatAuDepartDeLaLecture(e) === 'chargement'),
    json(coince));
  }

  /* -- (9) LA RANGÉE DE LA LISTE DU DEVIS (Q3 a) -------------------------- */
  {
    const sejour = MEMOIRE_DEMO.filter((l) => l.devis && l.devis.objet === 'Sol du séjour');
    const fautes = sejour.filter((l) => {
      const r = D.proprietesDeLaRangee(l, { etats: { [l.id]: 'echec' }, phrasesEchec: { [l.id]: 'non enregistrée' } });
      return json(Object.keys(r)) !== json(D.PROPRIETES_DE_LA_RANGEE) || r.designation !== l.designation || r.total !== D.totalLigne(l)
        || /r[ée]f/i.test(json(r)) || r.erreurTexte !== 'non enregistrée';
    });
    const avecRef = sejour.filter((l) => P.referenceDuPoste(l, POSTES));
    verifier('la rangée de la liste du devis (`proprietesDeLaRangee`) reçoit EXACTEMENT les treize valeurs de '
      + '`PROPRIETES_DE_LA_RANGEE` — la phrase de la ligne mot pour mot, son total, son état — et rien de la base de postes : la liste '
      + 'est l’écran qu’on montre à un client (Q3 a ; la relecture y avait écrit la phrase de référence sans qu’un contrôle rougisse)',
    sejour.length === 6 && avecRef.length >= 2 && fautes.length === 0 && D.PROPRIETES_DE_LA_RANGEE.length === 13
      && D.proprietesDeLaRangee.length === 1, fautes.map((l) => l.designation).join(' | '));
  }

  /* ================================================================== */
  /*  LES ÉCRANS PASSENT PAR CES FONCTIONS — une liste FERMÉE de formes   */
  /* ================================================================== */
  const norm = (x) => String(x || '').replace(/\s+/g, ' ').trim();
  const importsDe = (src, de) => {
    const m = new RegExp(`import \\{([^}]*)\\} from '${de.replace(/[./]/g, (c) => `\\${c}`)}';`).exec(src);
    return m ? m[1].split(',').map((x) => x.trim()).filter(Boolean).sort() : null;
  };

  /* -- (10) ChampDesignation ---------------------------------------------- */
  {
    const d = EC.designation;
    const corps = d.slice(d.indexOf('}, ref) {'));
    verifier('`ChampDesignation` affiche les rangées de `propositionsAMontrer` TELLES QUELLES : il n’importe de `postes.js` QUE cette '
      + 'fonction, l’appelle UNE fois avec le texte tapé, le texte choisi, la base, son état et la mémoire — sans les retoucher —, et '
      + 'ne filtre, ne coupe, ne trie, ne complète jamais la liste qu’elle rend (`rangees` : sa déclaration, `.length > 0`, `.map`)',
    json(importsDe(d, '../lib/postes')) === json(['propositionsAMontrer'])
      && norm(d).includes(norm('const rangees = useMemo( () => propositionsAMontrer({ postes, postesEtat, memoire, texte: recherche, '
        + 'choisi, idLigne }), [postes, postesEtat, memoire, recherche, choisi, idLigne], );'))
      && (d.match(/\bpropositionsAMontrer\(/g) || []).length === 1 && (d.match(/\brangees\b/g) || []).length === 3
      && /\{rangees\.length > 0 && \(/.test(d) && /\{rangees\.map\(\(r\) => \(/.test(d) && (d.match(/\.map\(/g) || []).length === 1
      && !/\.(slice|filter|concat|splice|sort|reverse|push|unshift)\(/.test(d)
      && !/\b(postes|postesEtat|memoire|recherche|choisi)\s*=[^=>]/.test(corps)
      && /onChoisir\(r\.proposition\)/.test(d) && /<Text style=\{s\.suggestionTitre\} numberOfLines=\{2\}>\{r\.titre\}<\/Text>/.test(d)
      && /setChoisi\(null\)/.test(d) && /setChoisi\(r\.titre\)/.test(d)
      /* LE TEXTE D'OUVERTURE COMPTE COMME « CHOISI » : sans cela, une ligne
         existante s'ouvre avec des propositions (B1 du lot 1). */
      && /const \[choisi, setChoisi\] = useState\(defaut \|\| null\);/.test(d));
  }

  /* -- (11) CarteLigne ---------------------------------------------------- */
  {
    const c = EC.carte;
    const t11 = [...c.matchAll(/suivreT11\(\{ type: '(\w+)'/g)].map((m) => m[1]).sort();
    const quantite = balisesE(c, 'ChampMontant').find((b) => /ref=\{refQuantite\}/.test(b)) || '';
    const iU = c.indexOf('{UNITES.map((');
    const unites = iU >= 0 ? c.slice(iU, c.indexOf("{sous('unite')}", iU)) : '';
    const choisir = blocApres(c, 'onChoisir={(sug) => {');
    verifier('`CarteLigne` affiche `vueDeLaBase` TELLE QUELLE : elle n’importe de `postes.js` que la liste fermée (`vueDeLaBase`, la '
      + 'phrase de T11, ce qu’un appui recopie, le poste à ouvrir), l’appelle UNE fois — avec `peutAjouter` —, ne lit JAMAIS l’état '
      + 'de la base elle-même (`postesEtat ===`), et n’écrit aucun libellé de bouton de la base : le seul bouton du bloc est '
      + '`vue.action`',
    json(importsDe(c, '../lib/postes')) === json(['PHRASE_UNITE_VIDE', 'phraseUniteApres', 'posteDeLaLigne', 'posteDepuisLaLigne',
      'prixAEcrire', 'valeursDeLaProposition', 'vueDeLaBase'])
      && norm(c).includes(norm("const vue = vueDeLaBase(ligne, chiffree ? postes : null, chiffree ? postesEtat : 'sans_objet', { "
        + 'regimeDeclareLe, peutAjouter: !!onAjouterALaBase, });'))
      && (c.match(/\bvueDeLaBase\(/g) || []).length === 1 && !/postesEtat\s*[!=]==/.test(c)
      && !/'(Ajouter à ma base|Changer ma référence|Fixer le prix|Modifier)'|"(Ajouter à ma base|Changer ma référence|Fixer le prix|Modifier)"/.test(c)
      && (c.match(/<Pastille label=\{vue\.action\.label\} nom=\{vue\.action\.nom\} onPress=\{\(\) => agir\(vue\.action\)\} \/>/g) || []).length === 1
      && /\{!!vue\.action && \(/.test(c) && /\{!!vue\.reference && \(/.test(c));
    verifier('…et sa phrase de T11 ne change QUE par `phraseUniteApres` : un seul `setT11`, et les quatre gestes — la proposition '
      + '(au choix d’une suggestion), la quantité quittée (au `onBlur` de la quantité, avec son texte), l’unité rechoisie, la '
      + 'surface recopiée ; la phrase rendue est `t11.phrase`',
    (c.match(/\bsetT11\(/g) || []).length === 1 && /const suivreT11 = \(geste\) => setT11\(\(e\) => phraseUniteApres\(e, geste\)\);/.test(c)
      && json(t11) === json(['proposition', 'quantite_quittee', 'surface', 'unite'])
      && /suivreT11\(\{ type: 'quantite_quittee', quantite: quantiteLue\(\) \}\)/.test(quantite)
      && /suivreT11\(\{ type: 'proposition', avant, unite: v\.unite, quantite: quantiteLue\(\) \}\)/.test(choisir)
      && /suivreT11\(\{ type: 'unite' \}\)/.test(unites)
      && /\{!!t11\.phrase && <Text style=\{s\.aide\} accessibilityLiveRegion="polite">\{t11\.phrase\}<\/Text>\}/.test(c),
    json(t11));
  }

  /* -- (12) les deux feuilles --------------------------------------------- */
  {
    const a = EC.ajout;
    const existe = a.slice(a.indexOf("} else if (feuille.etat === 'existe') {"), a.indexOf("titre = 'Ajouter à ma base';"));
    const i = (k) => existe.indexOf(`key="${k}"`);
    verifier('`FeuilleAjoutPoste` : « existe déjà » met la DÉCISION avant les explications — le poste, son prix, le champ, « Changer '
      + 'ma référence », « Fermer », PUIS « Votre ligne », pourquoi, la sortie (ECRAN10) ; la ligne qui redisait le titre est partie '
      + '(ECRAN8)',
    i('poste') >= 0 && i('poste') < i('sa-reference') && i('sa-reference') < i('changer') && i('changer') < i('fermer')
      && i('fermer') < i('ligne') && i('ligne') < i('pourquoi') && i('pourquoi') < i('sortie')
      && !/Ce poste existe déjà dans votre base\./.test(a), json(['poste', 'sa-reference', 'changer', 'fermer', 'ligne', 'pourquoi', 'sortie'].map(i)));
    const p = EC.poste;
    verifier('`FeuillePoste` montre `vueDeLaFeuillePoste` : appelée UNE fois ; le champ part de `vue.prixDepart` ; la phrase du prix est '
      + '`vue.phrasePrix` ; « Retirer le prix de référence » n’existe que sous `vue.retirerLePrix`, « Retirer ce poste » que sous '
      + '`vue.retirerLePoste`, le renvoi à la page que sous `vue.renvoiALaPage` — aucune condition écrite à la main sur le prix',
    norm(p).includes(norm('const vue = vueDeLaFeuillePoste({ poste, prixPropose, depuisLaPage, regimeDeclareLe, absent });'))
      && (p.match(/\bvueDeLaFeuillePoste\(/g) || []).length === 1 && /defaut=\{centimesEnSaisie\(vue\.prixDepart\)\}/.test(p)
      && /<Phrase morceaux=\{vue\.phrasePrix\} style=\{s\.aide\} \/>/.test(p)
      && /\{vue\.retirerLePrix && \(\s*<Pressable\s+onPress=\{retirerLePrix\}/.test(p)
      && /\{vue\.retirerLePoste && \(\s*<Pressable\s+onPress=\{retirerLePoste\}/.test(p)
      && (p.match(/onPress=\{retirerLePrix\}/g) || []).length === 1 && (p.match(/onPress=\{retirerLePoste\}/g) || []).length === 1
      && /\{vue\.renvoiALaPage && \(/.test(p) && !/prixReferenceCentimes\s*(!=|!==|==|===)\s*null\s*&&/.test(p)
      && !/phraseFixeLe/.test(p));
    /* TEXTES5 : un poste qui n'est plus dans la base relue ne laisse que sa
       phrase, POURQUOI, et « Fermer » — ni « Enregistrer » (qui repartirait
       vers un poste qui n'existe plus), ni retrait. Et le « modifié
       entre-temps » se dit d'après la relecture, jamais « relu » d'office. */
    const branchesAbsent = p.slice(p.indexOf('if (vue.phraseAbsent) {'), p.indexOf('if (vue.phraseAbsent) {') + 600);
    const finAbsent = branchesAbsent.indexOf('</FeuilleBas>');
    const absentSeul = finAbsent > 0 ? branchesAbsent.slice(0, finAbsent) : '';
    verifier('…un poste ABSENT de la base relue (`vue.phraseAbsent`) ne montre que sa phrase, pourquoi, et « Fermer » ; le « modifié '
      + 'entre-temps » se dit par `issueDuModifieEntreTemps(await onRelire(), …)`, jamais « relu » d’office (TEXTES5)',
    /\{vue\.phraseAbsent\}/.test(absentSeul) && /<BtnOutline label="Fermer" onPress=\{onFermer\} \/>/.test(absentSeul)
      && !/enregistrer|retirerLe|ChampMontant/.test(absentSeul)
      && /issueDuModifieEntreTemps\(await onRelire\(\), poste\.id\)/.test(p) && !/await onRelire\(\);/.test(p)
      && /issueDuModifieEntreTemps\(await onRelire\(\), existant\.id\)/.test(a)
      && /<FeuillePoste\b[^>]*\babsent=\{!posteLu\}/.test(EC.page.replace(/\s+/g, ' '))
      && /\babsent=\{!!lue && !posteLu\}/.test(EC.saisie),
    absentSeul.slice(0, 200));
  }

  /* -- (13) la page -------------------------------------------------------- */
  {
    const pg = EC.page;
    verifier('`PostesScreen` montre `vueDeLaPage` : appelée UNE fois avec la base, son état, « déjà lue » et la recherche ; la liste '
      + 'est `vue.visibles`, le message vide `vue.vide`, l’attente `vue.enAttente` — aucun filtre, aucun tri écrit ici',
    norm(pg).includes(norm('const vue = useMemo( () => vueDeLaPage({ postes, etat, lus, recherche, incomplete, total }), '
      + '[postes, etat, lus, recherche, incomplete, total], );'))
      && (pg.match(/\bvueDeLaPage\(/g) || []).length === 1 && /data=\{vue\.visibles\}/.test(pg) && /if \(vue\.enAttente\) \{/.test(pg)
      && /if \(vue\.vide === 'illisible'\) \{/.test(pg) && /\} else if \(vue\.vide === 'recherche'\) \{/.test(pg)
      && !/\.(filter|sort)\(|correspondALaRecherche|trierPostes/.test(pg));
  }

  /* -- (14) la saisie : la rangée, la feuille d'ajout --------------------- */
  {
    const s = EC.saisie;
    const def = (/const RangeeLigne = React\.memo\(function RangeeLigne\(\{([\s\S]*?)\}\)/.exec(s) || [])[1] || '';
    const params = def.split(',').map((x) => x.trim().split(/\s*=/)[0]).filter(Boolean).sort();
    const balises = balisesE(s, 'RangeeLigne');
    const iR = s.indexOf('<RangeeLigne');
    const element = iR >= 0 ? s.slice(iR, s.indexOf('/>', iR) + 2) : '';
    verifier('`SaisieDevisScreen` : la rangée de la liste reçoit `proprietesDeLaRangee(item, …)` ET RIEN D’AUTRE que ses deux '
      + 'rappels — l’élément est écrit EXACTEMENT ainsi : une valeur ajoutée, une désignation retouchée font rougir',
    balises.length === 1 && norm(element) === norm('<RangeeLigne {...proprietesDeLaRangee(item, { sousTotaux: sous, etats, erreurs, '
      + 'phrasesEchec })} onOuvrir={ouvrirStable} onReessayer={reessayerStable} />'), norm(element).slice(0, 220));
    verifier('…`RangeeLigne` n’accepte que les treize valeurs et les deux rappels ; la feuille d’ajout reçoit `postesLus(postes, postesEtat)`',
      json(params) === json([...D.PROPRIETES_DE_LA_RANGEE, 'onOuvrir', 'onReessayer'].sort())
      && /postes=\{postesLus\(postes, postesEtat\)\}/.test(balisesE(s, 'FeuilleAjoutPoste')[0] || ''), json(params));
  }

  /* -- (14 bis) LES PHRASES DE LA RELECTURE « TEXTES » ----------------------
     Chaque propriété est FAITE TOURNER, puis on vérifie que l'écran affiche
     ce que la fonction rend — jamais une phrase écrite à la main. */
  {
    /* TEXTES8 : supprimer un brouillon dit que ses postes restent. */
    const devisDeLaChape = POSTES[0].devisOrigineId;
    const avecPostes = P.phraseSuppressionDuBrouillon({ postes: POSTES, postesEtat: 'ok', devisId: devisDeLaChape });
    const sansPostes = P.phraseSuppressionDuBrouillon({ postes: POSTES, postesEtat: 'ok', devisId: 'un-autre-devis' });
    const pasLue = P.phraseSuppressionDuBrouillon({ postes: POSTES, postesEtat: 'echec', devisId: devisDeLaChape });
    const debut = 'Définitif : le brouillon et toutes ses lignes partent. Rien n’avait été envoyé au client.';
    verifier('« Supprimer ce brouillon » dit ce qui RESTE (TEXTES8) : un poste rangé depuis ce devis → « Les postes que vous en '
      + 'avez rangés … restent » ; aucun → rien de plus ; base pas lue → « S’il y en a… » — et la saisie affiche ce que la '
      + 'fonction rend',
    devisDeLaChape != null && avecPostes === `${debut} Les postes que vous en avez rangés dans votre base de postes restent.`
      && sansPostes === debut && pasLue === `${debut} S’il y en a, les postes que vous en avez rangés dans votre base de postes restent.`
      && /\{confirmeSuppression && <Text style=\{s\.aide\}>\{phraseSuppression\}<\/Text>\}/.test(EC.saisie)
      && /phraseSuppression=\{phraseSuppressionDuBrouillon\(\{ postes, postesEtat, devisId: devisIdInitial \}\)\}/.test(EC.saisie)
      && !/toutes ses lignes partent/.test(EC.saisie),
    json({ avecPostes, sansPostes, pasLue }));

    /* TEXTES9 : les motifs qui désignent un client sans connaître sa fiche,
       et la fiche demandée à l'ouverture de la feuille d'ajout. */
    const motifs = ['Travaux Mlle Durand', 'Travaux Mr Durand', 'Travaux M.Durand', 'Cuisine famille Dupont', 'Travaux Mme, au 2e',
      'Appeler +33 6 12 34 56 78', 'Appeler 0033 6 12 34 56 78', 'Appeler 06.12.34.56.78']
      .map((ph) => [ph, P.indicesDuClient(ph).map((x) => x.genre)]);
    const muets = motifs.filter(([, g]) => g.length === 0);
    const neutres = ['Chape sèche avant carrelage collé', 'Pose de 12 m de plinthes', 'Dalle béton 12 cm, ferraillage HA8']
      .filter((ph) => P.indicesDuClient(ph).length > 0);
    verifier('les motifs d’un client sans sa fiche (TEXTES9) : « Mlle », « Mr », « M.Durand », « famille », une civilité suivie d’une '
      + 'virgule, un numéro en +33 ou 0033 sont signalés ; trois phrases de métier ne le sont pas ; la saisie demande le carnet à '
      + 'l’ouverture de la feuille d’ajout, et passe le nom du demandeur quand elle le connaît',
    muets.length === 0 && neutres.length === 0
      && /if \(devis\.clientId && \(clientsEtat === 'vide' \|\| clientsEtat === 'echec'\)\) onChargerClients\(\);\s*setFeuille\(\{\s*type: 'ajout'/.test(EC.saisie)
      && /client=\{clientFiche \|\| client \|\| \(ouverture\.demandeSource \? clientDepuisDemande\(ouverture\.demandeSource\) : null\)\}/.test(EC.saisie),
    json({ muets, neutres }));

    /* TEXTES10 : la phrase de l'avertissement ne dit rien deux fois. */
    const ind = (liste) => P.phraseIndices(liste);
    const deuxNoms = ind([{ genre: 'nom', mot: 'Durand' }, { genre: 'nom', mot: 'Lefèvre' }]);
    const deuxNumeros = ind([{ genre: 'telephone', mot: null }, { genre: 'numero', mot: null }]);
    const nomEtFormule = ind([{ genre: 'nom', mot: 'Martin' }, { genre: 'civilite', mot: null }]);
    const adresse = ind([{ genre: 'adresse', mot: 'Oliviers' }]);
    const compte = (t, x) => t.split(x).length - 1;
    verifier('l’avertissement d’un nom de client ne répète rien (TEXTES10) : deux mots du nom en UN morceau, le numéro du client sans '
      + '« un numéro de téléphone » en double, une virgule avant le dernier « et » quand un morceau en porte une, et un mot '
      + 'd’adresse « du client ou du chantier »',
    deuxNoms === 'Cette phrase contient « Durand » et « Lefèvre », des mots du nom du client de ce devis. Elle resterait dans votre base '
      + 'même si vous supprimez ce client.'
      && compte(deuxNoms, 'du client de ce devis') === 1
      && deuxNumeros === 'Cette phrase contient le numéro de téléphone du client de ce devis. Elle resterait dans votre base même si vous '
        + 'supprimez ce client.'
      && /« Martin », le nom du client de ce devis, et une formule/.test(nomEtFormule)
      && /« Oliviers », un mot de l’adresse du client ou du chantier\./.test(adresse) && !/adresse de ce devis/.test(adresse)
      && P.phraseIndices([]) === null,
    json({ deuxNoms, deuxNumeros, nomEtFormule, adresse }));

    /* TEXTES12 : la page dit qu'elle est coupée, avec le vrai total, et que
       la recherche ne porte que sur ce qui est lu ; une civilité ne compte
       pas ; une recherche de plusieurs mots sans résultat est conseillée. */
    const coupee = P.vueDeLaPage({ postes: POSTES, etat: 'ok', lus: true, incomplete: true, total: 1200 });
    const coupeeSansTotal = P.vueDeLaPage({ postes: POSTES, etat: 'ok', lus: true, incomplete: true, total: null });
    const entiere = P.vueDeLaPage({ postes: POSTES, etat: 'ok', lus: true, incomplete: false, total: POSTES.length });
    const nbsp = String.fromCharCode(0xa0);
    const civil = P.vueDeLaPage({ postes: [...POSTES, { id: 'zm', designation: 'Reprise fissures maison MARTIN', unite: 'u' }],
      etat: 'ok', lus: true, recherche: 'Mme Martin' });
    const rien = P.vueDeLaPage({ postes: POSTES, etat: 'ok', lus: true, recherche: 'Mme Introuvable' });
    const unMot = P.vueDeLaPage({ postes: POSTES, etat: 'ok', lus: true, recherche: 'Introuvable' });
    verifier('la page coupée (TEXTES12) : « votre base compte 1 200 postes, Opus n’en a lu que 8 » et « La recherche ne porte que sur '
      + 'ceux-là » ; le compte de l’en-tête est le VRAI total ; sans total, « plus de postes qu’Opus n’en a lu » ; entière, aucune '
      + 'bande ; « Mme Martin » trouve « maison MARTIN » ; une recherche de plusieurs mots sans résultat conseille le nom de famille',
    coupee.bandeIncomplete === `Liste incomplète : votre base compte 1${nbsp}200 postes, Opus n’en a lu que ${POSTES.length}. La recherche ne porte que sur ceux-là.`
      && coupee.compte === `1${nbsp}200 postes`
      && /plus de postes qu’Opus n’en a lu/.test(coupeeSansTotal.bandeIncomplete || '') && /ceux-là/.test(coupeeSansTotal.bandeIncomplete || '')
      && entiere.bandeIncomplete === null && entiere.compte === `${POSTES.length} postes`
      && civil.visibles.length === 1 && civil.visibles[0].id === 'zm'
      && rien.vide === 'recherche' && /nom de famille, seul/.test(rien.aideRecherche || '') && unMot.aideRecherche === null
      && /\{vue\.aideRecherche\}/.test(EC.page),
    json({ bande: coupee.bandeIncomplete, compte: coupee.compte, civil: civil.visibles.map((x) => x.id), aide: rien.aideRecherche }));

    /* TEXTES14 : la feuille d'ajout donne les DEUX façons d'ôter un nom. */
    verifier('la feuille d’ajout donne les deux façons d’ôter un nom de client : corriger la ligne, ou corriger la phrase ensuite dans '
      + '« Ma base de postes » — qui ne touche pas le devis de ce client (TEXTES14)',
    /corrigez d’abord la ligne, ou corrigez-la ensuite dans « Ma base de\s+postes »/.test(EC.ajout), '');
  }

  /* -- (15) OpusApp : la lecture de la base ------------------------------- */
  {
    const app = EC.app;
    const charger = blocApres(app, 'const chargerPostes = useCallback(() => {');
    const etats = [...app.matchAll(/setPostesEtat\(([^;]*?)\);/g)].map((m) => m[1].trim()).sort();
    verifier('`OpusApp` : l’état de la base ne change QUE par `etatAuDepartDeLaLecture` et `issueDeLaLecture` (deux écritures, et pas '
      + 'une de plus) ; une lecture jetée se relance ; la liste lue ne remplace celle de l’écran que si l’issue le dit',
    json(etats) === json(['(e) => etatAuDepartDeLaLecture(e)', 'issue.etat'].sort())
      && /if \(issue\.relancer\) return lire\(true\);/.test(charger) && /if \(issue\.etat\) setPostesEtat\(issue\.etat\);/.test(charger)
      && /if \(issue\.prendre\) \{\s*setPostes\(lu\.postes \|\| \[\]\);/.test(charger) && (charger.match(/setPostes\(/g) || []).length === 1
      && /issueDeLaLecture\(\{/.test(charger), json(etats));
  }

  /* -- (16) les deux portes : rendues sous `onMaBase`, et RIEN d'autre ---- */
  {
    /* Les conditions qui enveloppent une position dans du JSX : chaque `{`
       (ou `(` derrière `&&`, `||`, `?`, `:`) ouvert et pas encore refermé,
       jusqu'au corps de la fonction. */
    const enveloppes = (src, i) => {
      const r = [];
      let prof = 0;
      for (let k = i - 1; k >= 0; k -= 1) {
        const ch = src[k];
        if (ch === '}' || ch === ')') prof += 1;
        else if (ch === '{' || ch === '(') {
          if (prof > 0) { prof -= 1; continue; }
          const avant = src.slice(0, k).replace(/\s+$/, '');
          if (ch === '{' && (/\)$/.test(avant) || /=>$/.test(avant))) break;
          let entree = null;
          if (ch === '{') entree = norm(src.slice(k, src.indexOf('\n', k)));
          else if (/(&&|\|\||\?|:)$/.test(avant)) entree = norm(src.slice(Math.max(0, avant.lastIndexOf('\n')), k + 1));
          /* `{x && (` : la parenthèse et l'accolade sont la MÊME condition. */
          if (entree && r[r.length - 1] !== entree) r.push(entree);
        }
      }
      return r;
    };
    const portes = [[EC.liste, 'DevisScreen'], [EC.profil, 'ProfilOwnScreen']].map(([src, nom]) => {
      const n = (src.match(/onPress=\{onMaBase\}/g) || []).length;
      return { nom, n, chaine: n === 1 ? enveloppes(src, src.indexOf('onPress={onMaBase}')) : null };
    });
    verifier('les DEUX portes de « Ma base de postes » sont rendues sous `{!!onMaBase && (` et sous AUCUNE autre condition (la '
      + 'relecture les masquait d’un `false &&` sans qu’un contrôle rougisse) : une seule par écran',
    portes.every((x) => x.n === 1 && json(x.chaine) === json(['{!!onMaBase && (']) ), json(portes));
  }
} catch (e) {
  verifier('ce que les écrans montrent se fait tourner jusqu’au bout : rien ne PLANTE', false, e && e.stack);
}

/* ================================================================== */
/*  F. QUI LIT, QUI ÉCRIT — chaque colonne de `base_postes`             */
/* ================================================================== */
console.log('\nF. QUI LIT, QUI ÉCRIT — chaque colonne de `base_postes`, lue dans le SCHÉMA, a un écrivain et un lecteur');
try {
  const corps = (/create\s+table\s+if\s+not\s+exists\s+public\.base_postes\s*\(([\s\S]*?)\n\);/i.exec(S50) || [])[1] || '';
  const defs = corps.split('\n').filter((l) => /^ {2}[a-z_]+\s/.test(l) && !/^ {2}constraint\s/i.test(l))
    .map((l) => ({ nom: l.trim().split(/\s+/)[0], texte: l }));
  /* L'ÉCRIVAIN « application » : `posteVersBase`, FAITE TOURNER à la
     création, avec toutes les valeurs que l'application connaît. */
  const versBase = extraire('posteVersBase');
  const ecritesParLApp = versBase ? Object.keys(versBase({
    designation: 'Chape', unite: 'm2', fournitureNonComprise: true, mainOeuvre: true, prixReferenceCentimes: 4500,
  }, { creation: true, proId: 'p', devisOrigineId: 'd' })) : [];
  const fPoste = (fonctionSql(S50, 'tient_le_poste') || { corps: '' }).corps;
  const ecritParLaBase = (d) => /\bdefault\b/i.test(d.texte) || new RegExp(`\\bnew\\.${d.nom}\\s*:=`).test(fPoste)
    || /\bgenerated\s+always\s+as\b/i.test(d.texte);
  /* LE LECTEUR : son nom en camelCase dans le calcul ou un écran — jamais
     le simple passage d'`api.js`, qui traduit sans lire. */
  /* Les lecteurs d'un POSTE : le calcul et les écrans qui en montrent un —
     pas `OpusApp`, la saisie ni les portes, qui le passent sans le lire (et
     où `proId`, par exemple, désigne autre chose). */
  const LECTEURS = ['src/lib/postes.js', 'src/lib/devis.js', ...['carte', 'designation', 'ajout', 'poste', 'page'].map((k) => ECRANS_BASE[k])]
    .map((f) => (existsSync(path.join(RACINE, f)) ? sansCommentairesJs(lire(f)) : '')).join('\n');
  const camel = (c) => c.replace(/_([a-z])/g, (x, l) => l.toUpperCase());
  const politique = (S50.match(/create\s+policy[\s\S]*?;/gi) || []).join('\n');
  const index = (/create\s+unique\s+index\s+if\s+not\s+exists\s+idx_base_postes_rapprochement[\s\S]*?;/i.exec(S50) || [''])[0];
  const sansEcrivain = defs.filter((d) => !ecritesParLApp.includes(d.nom) && !ecritParLaBase(d)).map((d) => d.nom);
  const sansLecteur = [];
  const parExceptions = [];
  defs.forEach((d) => {
    if (new RegExp(`\\b${camel(d.nom)}\\b`).test(LECTEURS)) return;
    /* `pro_id` : l'appartenance, lue par la BASE (la politique), comme
       `devis.pro_id` dans `verifier-devis` — l'application ne la lit pas
       (elle ne la sélectionne même pas). */
    if (d.nom === 'pro_id' && /\bpro_id\b/.test(politique)) { parExceptions.push('pro_id (la politique)'); return; }
    /* L'EXCEPTION NOMMÉE : la clé, écrite par le DÉCLENCHEUR (24/10/2026 :
       elle n'est plus générée), lue par l'index du doublon — l'application
       ne la lit pas (T18). */
    if (d.nom === 'cle_rapprochement' && /\bnew\.cle_rapprochement\s*:=/.test(fPoste) && /\bcle_rapprochement\b/.test(index)) {
      parExceptions.push('cle_rapprochement (l’index)');
      return;
    }
    sansLecteur.push(d.nom);
  });
  verifier(`chacune des ${defs.length} colonnes de \`base_postes\` a un ÉCRIVAIN (\`posteVersBase\`, faite tourner, ou la base : un `
    + 'défaut, le déclencheur, la génération)', defs.length === 12 && ecritesParLApp.length >= 7 && sansEcrivain.length === 0,
  `sans écrivain : ${sansEcrivain.join(', ') || '—'} ; écrites par l’application : ${ecritesParLApp.join(', ')}`);
  verifier('…et un LECTEUR (son nom dans `postes.js`, `devis.js` ou un écran de la base) — avec deux exceptions NOMMÉES, et '
    + 'aucune autre : `cle_rapprochement`, lue par `idx_base_postes_rapprochement`, et `pro_id`, lue par la politique',
  defs.length === 12 && sansLecteur.length === 0 && parExceptions.length === 2,
  `sans lecteur : ${sansLecteur.join(', ') || '—'} ; exceptions : ${parExceptions.join(', ')}`);
} catch (e) {
  verifier('la lecture de qui lit et qui écrit va jusqu’au bout : rien ne PLANTE', false, e && e.stack);
}

/* ================================================================== */
/*  G. LA DÉMONSTRATION — la base de postes de `devis-demo.js`, FAITE   */
/*     TOURNER comme la vraie                                           */
/* ================================================================== */
console.log('\nG. LA DÉMONSTRATION — la base de postes en mémoire, ses refus, ses huit postes, ses trois lignes, et chaque état '
  + 'de la base vu sans `.env`');
try {
  const DEVIS_IDS = DEMO.DEVIS_DEMO_IDS;
  const M = new Date('2026-10-23T12:00:00Z');
  /* Une horloge qui AVANCE d'une seconde à chaque lecture : deux écritures
     ne portent jamais la même date — sans quoi une condition sur la date
     lue ne prouverait rien. */
  const nouvelleBase = (plus = {}) => {
    let t = M.getTime();
    return DEMO.creerBaseDevisDemo({ maintenant: () => new Date((t += 1000)), ...plus });
  };
  const essayer = async (f) => { try { return { r: await f() }; } catch (e) { return { e }; } };
  const ligneEnvoyee = (plus = {}) => ({
    designation: 'Niche murale carrelée', unite: 'u', fourniture_non_comprise: false, main_oeuvre: false,
    prix_reference_centimes: 24000, pro_id: '1', devis_origine_id: null, ...plus,
  });
  const DIX_APP = ['createdAt', 'designation', 'devisOrigineId', 'fournitureNonComprise', 'id', 'mainOeuvre', 'modifieLe', 'prixFixeLe',
    'prixReferenceCentimes', 'unite'];

  /* -- a. la lecture, et les huit postes ------------------------------- */
  const b0 = nouvelleBase();
  const l1 = await b0.lirePostes('1');
  const l1n = await b0.lirePostes(1);
  const l2 = await b0.lirePostes('2');
  verifier('a. la base de démonstration rend les postes du compte, triés par l’identifiant, avec leur nombre — `1` et `\'1\'` voient '
    + 'les mêmes (le piège des trois `===`), une autre fiche n’en voit aucun — aux dix noms de `rowToPoste`, ni l’entreprise ni la clé',
  l1.compte === 8 && l1.postes.length === 8 && json(l1.postes.map((p) => p.id)) === json([...l1.postes.map((p) => p.id)].sort())
    && json(l1n) === json(l1) && l2.compte === 0 && l1.postes.every((p) => json(Object.keys(p).sort()) === json(DIX_APP)),
  `${l1.compte} postes ; '2' → ${l2.compte}`);
  const jeuP = DEMO.fabriquerPostesDemo(M);
  const jeuD = DEMO.fabriquerDevisDemo(M);
  const em = EM.fabriquerEmetteurDemo(M);
  const regimeLe = em.emetteur && em.emetteur.regime_tva_declare_le;
  const HUIT_POSTES = [
    ['Chape sèche avant carrelage collé', 'm2', 4500, false, false],
    ['Pose de faïence murale', 'h', null, false, true],
    ['Faïence murale, forfait pour une salle d’eau complète', 'forfait', 90000, false, false],
    ['Ragréage autolissant fibré sur plancher bois, après pose d’un primaire d’accrochage et d’une bande périphérique, '
      + 'épaisseur moyenne 5 mm, nettoyage compris', 'm2', 2800, false, false],
    ['Dépose de l’ancien carrelage au sol', 'm2', 1800, false, false],
    ['Pose de plinthes carrelées', 'm', 1200, false, false],
    ['Pose d’un meuble vasque', 'u', 18000, true, false],
    ['Dalle béton armé, épaisseur 12 cm, sur hérisson', 'm2', 8500, false, false],
  ];
  const lus = jeuP.map((p) => [p.designation, p.unite, p.prixReferenceCentimes, p.fournitureNonComprise, p.mainOeuvre]);
  const chapes = jeuP.filter((p) => R.aPlat(p.designation).includes('chape')).map((p) => p.id);
  verifier('…ce sont les huit postes du cahier (§4.3), dans l’ordre, phrase, unité, prix, fourniture et main-d’œuvre compris — et le mot '
    + '« chape » n’est que dans le premier', json(lus) === json(HUIT_POSTES) && json(chapes) === json([jeuP[0].id]), json(lus.filter((x, i) => json(x) !== json(HUIT_POSTES[i]))));
  const devis1 = jeuD.devis.find((d) => d.id === DEVIS_IDS.renovation);
  const lignes1 = jeuD.lignes.filter((l) => l.devisId === DEVIS_IDS.renovation);
  const finDevis1 = Math.max(...lignes1.map((l) => Date.parse(l.modifieLe)));
  const depuis1 = jeuP.filter((p) => p.devisOrigineId === DEVIS_IDS.renovation);
  const avantRegime = jeuP.filter((p) => Date.parse(p.createdAt) < Date.parse(regimeLe)).map((p) => p.designation);
  verifier('…leurs dates sont celles de la BASE (création = dernière écriture ; prix fixé à la même heure, vide sans prix) et '
    + 'COHÉRENTES : un poste rangé depuis « Rénovation salle de bains » l’a été APRÈS ses lignes ; seul celui des plinthes est '
    + 'antérieur à la déclaration du régime de démonstration ; chaque lien d’origine désigne un devis du compte, et seuls ces trois-là '
    + 'en ont un (la dépose a perdu le sien : son devis a été supprimé)',
  jeuP.every((p) => p.createdAt === p.modifieLe && p.prixFixeLe === (p.prixReferenceCentimes == null ? null : p.createdAt))
    && json(depuis1.map((p) => p.designation)) === json(['Chape sèche avant carrelage collé', 'Pose de faïence murale', 'Pose d’un meuble vasque'])
    && json(jeuP.filter((p) => p.devisOrigineId !== null).map((p) => p.id)) === json(depuis1.map((p) => p.id))
    && depuis1.every((p) => Date.parse(p.createdAt) > finDevis1 && Date.parse(p.createdAt) > Date.parse(devis1.createdAt))
    && json(avantRegime) === json(['Pose de plinthes carrelées'])
    && jeuP.every((p) => p.devisOrigineId === null || jeuD.devis.some((d) => d.id === p.devisOrigineId && String(d.proId) === String(p.proId))),
  `avant le régime : ${json(avantRegime)}`);

  /* -- b. les trois lignes de « Sol du séjour » ------------------------ */
  const sejour = jeuD.devis.find((d) => d.id === DEVIS_IDS.sejour);
  const lignes2 = jeuD.lignes.filter((l) => l.devisId === DEVIS_IDS.sejour);
  const TROIS_LIGNES = [
    ['Seuils de porte en aluminium (fourniture seule, sans pose)', 'u', 1000, 2300, 2000],
    ['Depose de l’ancien carrelage au sol', 'm2', 24000, 2000, 1000],
    ['evacuation des gravats en dechetterie', 'forfait', 1000, 18000, 1000],
  ];
  const trouvees = TROIS_LIGNES.map(([d, u, q, prix, taux]) => lignes2.find((l) => l.designation === d && l.unite === u
    && l.quantiteMilliemes === q && l.prixUnitaireCentimes === prix && l.tauxTvaCentiemes === taux && l.type === 'poste' && !l.offert));
  verifier('b. les trois lignes de « Sol du séjour » existent, chacune avec sa phrase, son prix, sa quantité et son taux — « Seuils… » à '
    + '23 €, « Depose… » à 20 €, « evacuation… » à 180 € — et respectent l’horloge du devis (numéro et date au plus les siens) ; '
    + 'le devis reste recevable',
  trouvees.every(Boolean) && trouvees.every((l) => l.generation <= sejour.generation && Date.parse(l.modifieLe) <= Date.parse(sejour.modifieLe))
    && D.totauxDevis(lignes2).ok && !jeuD.lignes.some((l) => l.devisId === DEVIS_IDS.renovation && TROIS_LIGNES.some(([d]) => d === l.designation)),
  trouvees.map((l, i) => (l ? '' : TROIS_LIGNES[i][0])).filter(Boolean).join(' | '));

  /* -- c. l'ajout, et les dates posées par la base ---------------------- */
  const b1 = nouvelleBase();
  const ajout = await b1.ajouterUnPoste('1', ligneEnvoyee({
    designation: ` Niche murale carrelée${String.fromCharCode(0x200b)}`, devis_origine_id: DEVIS_IDS.renovation,
    created_at: '2001-01-01T00:00:00Z', modifie_le: '2001-01-01T00:00:00Z', prix_fixe_le: '2001-01-01T00:00:00Z',
  }));
  verifier('c. un ajout rend le poste tel que la base l’a gardé : la phrase rognée (la classe de blancs du projet), le lien vers un devis '
    + 'du compte, et les dates posées par la BASE — celles que le client envoie sont ignorées',
  ajout.designation === 'Niche murale carrelée' && ajout.devisOrigineId === DEVIS_IDS.renovation && ajout.createdAt === ajout.modifieLe
    && ajout.prixFixeLe === ajout.createdAt && !/^2001/.test(ajout.createdAt) && (await b1.lirePostes('1')).compte === 9
    && json(Object.keys(ajout).sort()) === json(DIX_APP), json(ajout));

  /* -- d. le doublon, à une variante près ------------------------------ */
  const d1 = await essayer(() => b1.ajouterUnPoste('1', ligneEnvoyee()));
  const d2 = await essayer(() => b1.ajouterUnPoste('1', ligneEnvoyee({ designation: 'NICHES MURALES CARRELEES' })));
  const d3 = await essayer(() => b1.ajouterUnPoste('1', ligneEnvoyee({ designation: 'Chapes sèches avant carrelages collés', unite: 'm2' })));
  const d4 = await essayer(() => b1.ajouterUnPoste('1', ligneEnvoyee({ unite: 'forfait' })));
  const d5 = await essayer(() => b1.ajouterUnPoste('1', ligneEnvoyee({ fourniture_non_comprise: true })));
  const estDoublon = (x) => Boolean(x.e && x.e.code === '23505'
    && x.e.message === 'duplicate key value violates unique constraint "idx_base_postes_rapprochement"' && x.e.details == null);
  verifier('d. le doublon est refusé sur la clé COMPLÈTE, nommé `idx_base_postes_rapprochement`, SANS détail de valeurs (la table a la '
    + 'RLS) — la même phrase, sa VARIANTE en majuscules sans accents au pluriel, et une variante d’un poste de départ (la chape) ; '
    + 'la même phrase à une autre unité ou fourniture est un autre poste ; `messageClair` dit la phrase de l’index',
  estDoublon(d1) && estDoublon(d2) && estDoublon(d3) && !d4.e && !d5.e
    && ERR.messageClair(d2.e, 'Votre base de postes') === `Votre base de postes : ${ERR.MESSAGES_CONTRAINTE.idx_base_postes_rapprochement}`,
  json([d1, d2, d3, d4, d5].map((x) => (x.e ? `${x.e.code} ${x.e.message}` : 'accepté'))));

  /* -- e. les refus des contraintes, dans l'ordre de la base ------------ */
  const avantRefus = (await b1.lirePostes('1')).compte;
  const TIRET = '—';
  const REFUS = [
    [{ designation: '', unite: 'ml' }, 'base_poste_designation_check'],
    [{ designation: TIRET }, 'base_poste_rapprochement_check'],
    [{ designation: TIRET, unite: 'ml' }, 'base_poste_rapprochement_check'],
    [{ designation: TIRET, prix_reference_centimes: 0 }, 'base_poste_prix_check'],
    [{ designation: 'a'.repeat(2001) }, 'base_poste_designation_check'],
    [{ designation: String.fromCharCode(0x200b) }, 'base_poste_designation_check'],
    [{ designation: 'Raccord de plinthe', unite: 'ml' }, 'base_poste_unite_check'],
    [{ designation: 'Raccord de plinthe', unite: null }, 'base_poste_unite_check'],
    [{ designation: 'Raccord de plinthe', prix_reference_centimes: 0 }, 'base_poste_prix_check'],
    [{ designation: 'Raccord de plinthe', prix_reference_centimes: 1e10 }, 'base_poste_prix_check'],
  ];
  const fauxRefus = [];
  for (const [plus, nom] of REFUS) {
    const x = await essayer(() => b1.ajouterUnPoste('1', ligneEnvoyee(plus)));
    const attendu = `new row for relation "base_postes" violates check constraint "${nom}"`;
    if (!(x.e && x.e.code === '23514' && x.e.message === attendu
      && ERR.messageClair(x.e, 'Ce poste') === `Ce poste : ${ERR.MESSAGES_CONTRAINTE[nom]}`)) {
      fauxRefus.push(`${json(plus).slice(0, 50)} → ${x.e ? x.e.message : 'accepté'}`);
    }
  }
  verifier('e. les contraintes refusent dans l’ORDRE ALPHABÉTIQUE de la base, avec ses mots — une phrase vide avec « ml » par la phrase, '
    + '« — » par la clé vide (et avant l’unité), « — » avec un prix de 0 par le prix, 2 001 caractères et un U+200B seul par la '
    + 'phrase, « ml » et une unité absente par l’unité, 0 et 10^10 par le prix —, chacune dite par sa phrase de '
    + '`MESSAGES_CONTRAINTE` ; et rien n’est rangé', fauxRefus.length === 0 && (await b1.lirePostes('1')).compte === avantRefus,
  fauxRefus.join(' | '));

  /* -- f. le lien d'origine : un devis DE CE compte, sans oracle -------- */
  const idAutre = 'de0000aa-0000-4000-8000-000000000001';
  await b1.ecrire('2', { quoi: 'devis', action: 'inserer', id: idAutre, valeurs: { objet: 'Chez un autre', source: 'manuelle' }, generation: 1 });
  const f1 = await essayer(() => b1.ajouterUnPoste('1', ligneEnvoyee({ designation: 'Raccord de seuil', devis_origine_id: idAutre })));
  const f2 = await essayer(() => b1.ajouterUnPoste('1', ligneEnvoyee({ designation: 'Raccord de seuil', devis_origine_id: 'de0000aa-0000-4000-8000-000000000999' })));
  const fkAttendu = 'insert or update on table "base_postes" violates foreign key constraint "base_postes_devis_origine_fkey"';
  verifier('f. le lien d’origine ne désigne qu’un devis DE CE compte : le devis d’un autre et un devis inexistant rendent le MÊME '
    + 'refus, au mot près, détail compris — aucun oracle ; rien n’est rangé',
  Boolean(f1.e && f2.e) && f1.e.code === '23503' && f1.e.message === fkAttendu && f1.e.message === f2.e.message
    && f1.e.details === 'Key is not present in table "devis".' && f1.e.details === f2.e.details
    && !(await b1.lirePostes('1')).postes.some((p) => p.designation === 'Raccord de seuil'),
  json([f1, f2].map((x) => (x.e ? `${x.e.code} ${x.e.details}` : 'accepté'))));

  /* -- g. OP018, le plafond, pour SA propre entreprise ----------------- */
  const pleins = Array.from({ length: P.POSTES_MAX }, (_, k) => ({
    id: `ba5f${String(k).padStart(4, '0')}-0000-4000-8000-${String(k).padStart(12, '0')}`, proId: 1, designation: `Poste numéro ${k}`,
    unite: 'u', fournitureNonComprise: false, mainOeuvre: false, prixReferenceCentimes: null, prixFixeLe: null, devisOrigineId: null,
    createdAt: M.toISOString(), modifieLe: M.toISOString(),
  }));
  const bP = nouvelleBase({ donnees: { devis: [], lignes: [], postes: pleins } });
  const g1 = await essayer(() => bP.ajouterUnPoste('1', ligneEnvoyee({ designation: 'Le mille et unième' })));
  const g2 = await essayer(() => bP.ajouterUnPoste('1', ligneEnvoyee({ designation: 'Le mille et unième', pro_id: '2' })));
  const g3 = await essayer(() => bP.ajouterUnPoste('2', ligneEnvoyee({ designation: 'Le mille et unième', pro_id: '2' })));
  verifier(`g. au plafond (${P.POSTES_MAX} postes), un ajout reçoit OP018 avec la phrase de la base (\`REFUS_POSTES\`), que \`messageClair\` `
    + 'rend telle quelle ; un étranger qui écrit au nom d’un autre reçoit le refus de la règle d’accès, jamais OP018 (il n’apprend pas '
    + 'que la base est pleine) ; un autre compte range le sien',
  Boolean(g1.e && g1.e.code === 'OP018' && g1.e.message === ERR.REFUS_POSTES.OP018
    && ERR.messageClair(g1.e, 'Votre base de postes') === ERR.REFUS_POSTES.OP018
    && g2.e && g2.e.code === '42501' && g2.e.message === 'new row violates row-level security policy for table "base_postes"' && !g3.e)
    && (await bP.lirePostes('1')).compte === P.POSTES_MAX && (await bP.lirePostes('1')).postes.length === P.POSTES_MAX,
  json([g1, g2, g3].map((x) => (x.e ? `${x.e.code}` : 'accepté'))));

  /* -- h. sous condition, et ce que le déclencheur fige ------------------ */
  const b2 = nouvelleBase();
  const chape = (await b2.lirePostes('1')).postes.find((p) => p.designation === 'Chape sèche avant carrelage collé');
  const h0 = await b2.modifierUnPoste('1', chape.id, { prix_reference_centimes: 5200 }, { modifieLe: 'une autre date' });
  const h1 = await b2.modifierUnPoste('1', chape.id, { prix_reference_centimes: 5200 }, { modifieLe: chape.modifieLe });
  const h2 = await b2.modifierUnPoste('1', chape.id, { prix_reference_centimes: 5500 }, { modifieLe: chape.modifieLe });
  const apres = h1[0];
  const h3 = await b2.modifierUnPoste('1', chape.id, {
    id: 'ba5e9999-0000-4000-8000-000000009999', pro_id: '2', created_at: '2001-01-01T00:00:00Z', prix_fixe_le: '2001-01-01T00:00:00Z',
    modifie_le: '2001-01-01T00:00:00Z', devis_origine_id: 'de0000aa-0000-4000-8000-000000000001', designation: 'Chape sèche avant carrelage collé',
  }, { modifieLe: apres && apres.modifieLe });
  const fige = h3[0];
  const h4 = await b2.modifierUnPoste('1', chape.id, { devis_origine_id: null }, { modifieLe: fige && fige.modifieLe });
  const h5 = await b2.modifierUnPoste('2', chape.id, { prix_reference_centimes: 1 }, { modifieLe: h4[0] && h4[0].modifieLe });
  const h6 = await b2.modifierUnPoste('1', chape.id, { prix_reference_centimes: null }, { modifieLe: h4[0] && h4[0].modifieLe });
  verifier('h. une modification part SOUS CONDITION sur la date lue : une autre date, une date périmée (la « tardive ») ou un autre '
    + 'compte → aucune ligne (`[]`), rien ne bouge ; avec la bonne date, le prix change, sa date aussi, et la dernière écriture ; '
    + 'le déclencheur FIGE l’identifiant, l’entreprise et la création, ignore les dates envoyées, ne laisse le lien d’origine que '
    + 'disparaître ; un prix retiré vide sa date',
  json(h0) === '[]' && h1.length === 1 && apres.prixReferenceCentimes === 5200 && apres.prixFixeLe !== chape.prixFixeLe
    && apres.modifieLe !== chape.modifieLe && json(h2) === '[]' && h3.length === 1 && fige.id === chape.id && fige.createdAt === chape.createdAt
    && fige.prixFixeLe === apres.prixFixeLe && fige.modifieLe !== apres.modifieLe && !/^2001/.test(fige.modifieLe)
    && fige.devisOrigineId === DEVIS_IDS.renovation && (await b2.lirePostes('1')).postes.some((p) => p.id === chape.id)
    && (await b2.lirePostes('2')).compte === 0 && h4[0].devisOrigineId === null && json(h5) === '[]'
    && h6[0].prixReferenceCentimes === null && h6[0].prixFixeLe === null,
  json({ h0, h2, h5, fige }));
  const dalle = (await b2.lirePostes('1')).postes.find((p) => /^Dalle/.test(p.designation));
  const h7 = await essayer(() => b2.modifierUnPoste('1', dalle.id, { designation: 'Chape seche avant carrelage colle' }, { modifieLe: dalle.modifieLe }));
  const h8 = await essayer(() => b2.modifierUnPoste('1', dalle.id, { designation: '' }, { modifieLe: dalle.modifieLe }));
  const r0 = await b2.retirerUnPoste('1', dalle.id, { modifieLe: 'une autre date' });
  const r1 = await b2.retirerUnPoste('1', dalle.id, { modifieLe: dalle.modifieLe });
  const r2 = await b2.retirerUnPoste('1', dalle.id, { modifieLe: dalle.modifieLe });
  verifier('…une phrase corrigée vers celle d’un autre poste de même unité est un doublon (23505), vers rien un refus de la phrase ; un '
    + 'retrait part sous la même condition : `[]` avec une autre date, `[{ id }]` avec la bonne, puis `[]` — il est parti',
  estDoublon(h7) && Boolean(h8.e && /base_poste_designation_check/.test(h8.e.message)) && json(r0) === '[]'
    && json(r1) === json([{ id: dalle.id }]) && json(r2) === '[]' && !(await b2.lirePostes('1')).postes.some((p) => p.id === dalle.id),
  json({ h7: h7.e && h7.e.code, h8: h8.e && h8.e.code, r0, r1, r2 }));

  /* -- i. un devis supprimé vide le lien, sans toucher la date --------- */
  const b3 = nouvelleBase();
  const lie = await b3.ajouterUnPoste('1', ligneEnvoyee({ designation: 'Raccord de carrelage', devis_origine_id: DEVIS_IDS.sejour }));
  const autresAvant = (await b3.lirePostes('1')).postes.filter((p) => p.devisOrigineId === DEVIS_IDS.renovation).map((p) => p.id);
  await b3.ecrire('1', { quoi: 'devis', action: 'supprimer', id: DEVIS_IDS.sejour, generationMax: 9007199254740991 });
  const relu = (await b3.lirePostes('1')).postes;
  const lieApres = relu.find((p) => p.id === lie.id);
  verifier('i. un devis supprimé vide le lien d’origine de ses postes SANS toucher leur dernière écriture (la cascade tourne plus profond '
    + 'que l’écriture directe) : le poste n’est pas « modifié entre-temps » ; les postes d’un autre devis gardent le leur',
  Boolean(lieApres) && lie.devisOrigineId === DEVIS_IDS.sejour && lieApres.devisOrigineId === null && lieApres.modifieLe === lie.modifieLe
    && (await b3.un('1', DEVIS_IDS.sejour)) === null
    && json(relu.filter((p) => p.devisOrigineId === DEVIS_IDS.renovation).map((p) => p.id)) === json(autresAvant) && autresAvant.length === 3,
  json(lieApres));

  /* -- j. une requête à la fois, et l'annulation ------------------------ */
  const b4 = nouvelleBase();
  const PAUSE = 120;
  const t0 = Date.now();
  const fins = [];
  const premier = essayer(() => b4.ajouterUnPoste('1', ligneEnvoyee(), { pauseMs: PAUSE })).then((x) => { fins.push(['premier', Date.now() - t0]); return x; });
  const second = essayer(() => b4.ajouterUnPoste('1', ligneEnvoyee({ designation: 'niches murales carrelees' }), { pauseMs: PAUSE }))
    .then((x) => { fins.push(['second', Date.now() - t0]); return x; });
  const [j1, j2] = await Promise.all([premier, second]);
  const meme = (await b4.lirePostes('1')).postes.filter((p) => D.cleDeLigne(p) === D.cleDeLigne({ designation: 'Niche murale carrelée', unite: 'u' }));
  verifier('j. deux ajouts lancés ENSEMBLE : le second attend que le premier ait fini (sa pause commence après), puis reçoit le 23505 — un '
    + 'seul poste de cette clé, comme sur la vraie base où le plafond se compte sous verrou',
  !j1.e && estDoublon(j2) && fins[0][0] === 'premier' && fins[1][0] === 'second' && fins[1][1] >= 2 * PAUSE - 10 && meme.length === 1,
  json(fins));
  const ctl0 = new AbortController();
  ctl0.abort();
  const k0 = await essayer(() => b4.ajouterUnPoste('1', ligneEnvoyee({ designation: 'Annulé avant de partir' }), { signal: ctl0.signal }));
  const ctl1 = new AbortController();
  const t1 = Date.now();
  const longue = essayer(() => b4.ajouterUnPoste('1', ligneEnvoyee({ designation: 'Annulé en route' }), { signal: ctl1.signal, pauseMs: 4000 }));
  setTimeout(() => ctl1.abort(), 50);
  const k1 = await longue;
  const dureeAnnulee = Date.now() - t1;
  const t2 = Date.now();
  const suivante = await b4.lirePostes('1');
  const dureeSuivante = Date.now() - t2;
  verifier('…une requête annulée avant de partir, ou PENDANT sa pause (le délai de 8 s), n’est jamais partie — rien n’est rangé — et '
    + 'elle libère aussitôt son tour : la suivante n’attend pas la fin d’une pause abandonnée',
  Boolean(k0.e && k0.e.name === 'AbortError' && k1.e && k1.e.name === 'AbortError') && dureeAnnulee < 1000 && dureeSuivante < 1000
    && !suivante.postes.some((p) => /^Annulé/.test(p.designation)), `annulée en ${dureeAnnulee} ms, suivante en ${dureeSuivante} ms`);

  /* -- k. la pause NOMMÉE, passée par les quatre fonctions -------------- */
  const pause = Number((/\bconst\s+PAUSE_POSTES_DEMO\s*=\s*(\d+)\s*;/.exec(API) || [])[1]);
  const pauseDevis = Number((/\bconst\s+PAUSE_ECRITURE_DEMO\s*=\s*(\d+)\s*;/.exec(API) || [])[1]);
  const demos = QUATRE.map((n) => corpsApi(`${n}Demo`));
  const base = ['lirePostes', 'ajouterUnPoste', 'modifierUnPoste', 'retirerUnPoste'];
  verifier(`k. \`PAUSE_POSTES_DEMO\` (${pause} ms) est NOMMÉE, distincte de celle des devis (${pauseDevis} ms) — allonger l’une ne doit pas `
    + 'changer l’autre — et passée par les QUATRE fonctions de démonstration, chacune vers sa fonction de la base de démonstration',
  pause > 0 && pause < 8000 && pause !== pauseDevis
    && demos.every((c, i) => new RegExp(`baseDevisDeDemo\\(\\)\\.${base[i]}\\(`).test(c) && /pauseMs:\s*PAUSE_POSTES_DEMO\b/.test(c)),
  demos.map((c, i) => `${QUATRE[i]}Demo : ${/pauseMs:\s*PAUSE_POSTES_DEMO\b/.test(c)}`).join(', '));

  /* -- l. la COUVERTURE : chaque état de §4.3, vu sans `.env` ----------- */
  const bC = DEMO.creerBaseDevisDemo({ maintenant: () => M });
  const postesC = (await bC.lirePostes('1')).postes;
  const memoireC = await bC.memoire('1');
  const lignesC = jeuD.lignes;
  const opts = { regimeDeclareLe: regimeLe };
  const etats = new Set();
  const vus = {};
  const noter = (nom, ou) => { etats.add(nom); if (!vus[nom]) vus[nom] = ou; };
  for (const l of lignesC) {
    const e = P.etatDansLaBase(l, postesC, 'ok');
    const ref = P.referenceDuPoste(l, postesC, opts);
    const ec = P.ecartAuPoste(l, postesC, opts);
    if (e.etat === 'sans_objet') noter('sans objet', l.designation);
    if (e.etat === 'ajoutable') noter('ajoutable', l.designation);
    if (e.etat === 'ajoutable' && P.postesProches(postesC, l).length > 0) noter('proche', l.designation);
    if (ref && !ec) noter('référence sans écart', l.designation);
    if (ec && P.phraseEcart(ec)) noter('écart', l.designation);
    if (e.etat === 'dans_la_base' && !ref) noter('sans prix', l.designation);
    if (e.etat === 'dans_la_base' && e.sous && ec) noter('sous non nul, avec écart', l.designation);
  }
  for (const p of postesC) {
    const r = P.referenceDuPoste({ type: 'poste', designation: p.designation, unite: p.unite, fournitureNonComprise: p.fournitureNonComprise }, postesC, opts);
    if (r && r.avantRegime) noter('avant le régime', p.designation);
    if (!/depuis/.test(P.libelleOrigine(p))) noter('origine vide', p.designation);
    if (/depuis un de vos devis/.test(P.libelleOrigine(p))) noter('origine nommée', p.designation);
  }
  const S = (t) => P.suggestionsPourLaFrappe({ postes: postesC, memoire: memoireC, texte: t });
  /* T11, le geste du cahier : sur la ligne de faïence (12 h), retaper
     « faïence » et choisir le poste au forfait. */
  const surLaFaience = lignesC.find((l) => l.designation === 'Pose de faïence murale' && l.unite === 'h');
  const auForfait = S('faience').find((s) => s.source === 'base' && s.unite === 'forfait');
  if (surLaFaience && auForfait && P.changementDUnite(surLaFaience, P.valeursDeLaProposition(auForfait))) {
    noter('T11', P.changementDUnite(surLaFaience, P.valeursDeLaProposition(auForfait)));
  }
  const chapeMem = D.memoireDesLignes(memoireC, 'chape');
  const clePosteChape = D.cleDeLigne(postesC.find((p) => /^Chape/.test(p.designation)));
  if (S('seuils').some((s) => (s.prix || []).length >= 2)) noter('une proposition à plusieurs prix', 'seuils');
  if (S('seuils').length === 1 && /^Seuil de porte/.test(S('seuils')[0].designation)
    && S('gravats').length === 1 && S('gravats')[0].designation === 'evacuation des gravats en dechetterie') noter('variantes regroupées sous la plus récente', 'seuils, gravats');
  if (chapeMem.some((s) => s.cle === clePosteChape) && S('chape').some((s) => s.source === 'base' && s.cle === clePosteChape)
    && !S('chape').some((s) => s.source === 'memoire' && s.cle === clePosteChape)) noter('mémoire masquée par la base', 'chape');
  if (S('faience').some((s) => s.source === 'base' && s.prixReferenceCentimes == null && s.dernierPrix === 4500)) noter('poste sans référence qui porte un dernier prix', 'faience');
  if (S('Dalles').some((s) => s.source === 'base' && /^Dalle béton/.test(s.designation))) noter('« Dalles » trouve la dalle', 'Dalles');
  const pos = S('Pos');
  if (pos.length === 3 && pos.every((s) => s.source === 'base' && /^Pose /.test(s.designation))) noter('« Pos » rend exactement les trois « Pose »', 'Pos');
  const ATTENDUS = ['référence sans écart', 'écart', 'sans prix', 'ajoutable', 'proche', 'T11', 'avant le régime', 'origine vide',
    'origine nommée', 'sans objet', 'une proposition à plusieurs prix', 'variantes regroupées sous la plus récente',
    'mémoire masquée par la base', 'poste sans référence qui porte un dernier prix', 'sous non nul, avec écart', '« Dalles » trouve la dalle',
    '« Pos » rend exactement les trois « Pose »'];
  const manquants = ATTENDUS.filter((x) => !etats.has(x));
  verifier(`l. la COUVERTURE (cahier §4.3) : sur les lignes, les postes et la mémoire de démonstration, chacun des ${ATTENDUS.length} états `
    + 'apparaît au moins une fois — sans eux, ce que l’écran montre ne se verrait nulle part sans `.env`, et ne se vérifierait pas ici',
  manquants.length === 0, `manquants : ${manquants.join(', ')} ; vus : ${json(vus)}`);

  /* -- m. ce que la mémoire et la liste rendent, mot pour mot ------------ */
  const prixDe = (s) => (s.prix || []).map((p) => p.prixUnitaireCentimes);
  const chapeVue = chapeMem.map((s) => `${prixDe(s).join('+')}${s.fournitureNonComprise ? '/fnc' : ''}`).sort();
  const fusion = S('chape').map((s) => [s.source, P.valeursDeLaProposition(s).prixUnitaireCentimes, s.fournitureNonComprise === true]);
  const seuils = S('seuils');
  const gravats = S('gravats');
  const faience = S('faience').find((s) => s.source === 'base' && s.designation === 'Pose de faïence murale');
  verifier('m. la mémoire de démonstration, sur « chape », rend DEUX propositions (52 € puis 45 € dans la même ; 38 € « fourniture non '
    + 'comprise ») ; la liste fusionnée en montre deux (la base à 45 €, puis 38 €) ; « seuils » UNE, prix [2 500, 2 300] ; « gravats » '
    + 'UNE, titrée « evacuation des gravats en dechetterie », prix [18 000, 15 000] ; « faience » : la base sans référence porte '
    + '`dernierPrix` 4 500',
  json(chapeVue) === json(['3800/fnc', '5200+4500']) && json(fusion) === json([['base', 4500, false], ['memoire', 3800, true]])
    && seuils.length === 1 && json(prixDe(seuils[0])) === json([2500, 2300])
    && gravats.length === 1 && gravats[0].designation === 'evacuation des gravats en dechetterie' && json(prixDe(gravats[0])) === json([18000, 15000])
    && Boolean(faience) && faience.prixReferenceCentimes == null && faience.dernierPrix === 4500,
  json({ chapeVue, fusion, seuils: seuils.map(prixDe), gravats: gravats.map((s) => [s.designation, prixDe(s)]), faience: faience && faience.dernierPrix }));
} catch (e) {
  verifier('la base de postes de démonstration se fait tourner jusqu’au bout : rien ne PLANTE', false, e && e.stack);
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ La clé de rapprochement dit la même chose dans le miroir et dans la fonction SQL engendrée : '
  + 'mêmes cas, même empreinte, même table ; le calcul des postes tient les 51 cas du cahier et ses propriétés sur chaque '
  + 'début de mot ; la section 50 tient ce qu’elle promet ; l’API n’écrit la base de postes que par ses quatre fonctions, '
  + 'sous condition, une requête à la fois, et ses refus parlent français ; les écrans montrent la référence avant le prix, '
  + 'l’écart en phrase discrète, une seule feuille à la fois, et la page dit un échec pour ce qu’il est ; chaque colonne a son '
  + 'écrivain et son lecteur ; la démonstration refuse comme la base et fait voir chaque état sans `.env`. Ce que PostgreSQL en '
  + 'fait, `essais-section-50.sql` le dit — à jouer à la main ; ce que le doigt en fait, `mesure-devis` et l’iPhone.\n');
