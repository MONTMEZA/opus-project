/**
 * LE CHIFFRAGE D'UN DEVIS — lot 1 du module devis (21/10/2026).
 *
 * CE QUE CE CONTRÔLE GARDE
 * ------------------------
 * Le chiffrage manie de l'ARGENT : un centime de travers sur un devis est
 * une faute qui se voit, et qui engage l'artisan. Tout ce qui calcule vit
 * dans des fichiers que `node` sait ouvrir — `src/lib/devis.js`,
 * `centimes.js`, `file-ecriture.js`, `identifiant.js` —, et ce contrôle les
 * FAIT TOURNER : il ne relit pas le code, il regarde ce qu'il rend. S'il
 * plante, c'est un échec : `npm run verifier` lit son code de sortie.
 *
 * Il est construit par parties, une par étape du lot (cahier §6.1, §8) :
 *   A. CE QU'IL FAIT TOURNER (étapes 1 et 2) — les cas d'argent de
 *      `supabase/cas-devis.json`, les conversions, la mémoire, les phrases
 *      de la loi, les dates dans trois fuseaux, la file d'écriture et
 *      l'identifiant. (A-7, la démonstration, arrive avec elle à l'étape 4.)
 *   B. LE SCHÉMA — dès l'étape 0, les vérifications qui lisent l'EXISTANT
 *      (D4-c : aucune fonction de motifs ne nomme une origine ; la liste
 *      FERMÉE des fonctions qui nomment les tables du devis ; l'ordre des
 *      contraintes ; la classe de blancs). Elles passent sur le schéma
 *      d'avant la section 49 — sinon elles accuseraient du code juste
 *      (relecture « base » du cahier, B1 et B2). Le reste de B, et C à F,
 *      viennent avec la section 49 et les écrans (étapes 3 à 5).
 *
 * CE QU'IL NE PEUT PAS DIRE
 * -------------------------
 * Il ne joue AUCUN SQL : la moitié PostgreSQL des cas d'argent se joue dans
 * `supabase/essais-section-49.sql` (cas 30), sur un vrai PostgreSQL, et se
 * compare aux MÊMES attendus. Qu'une politique filtre vraiment, qu'un
 * déclencheur parte dans l'ordre annoncé : c'est l'essai qui le dit.
 *
 * Il retire les commentaires avant de lire un texte — ceux de FIN de ligne
 * compris, par un lecteur qui respecte les chaînes : un contrôle de ce
 * projet a déjà accusé onze fois la documentation qui expliquait le défaut.
 *
 * LA RELECTURE DES ÉTAPES 0-2 (21/10/2026) l'a trouvé troué : dix
 * sabotages du calcul et de la file passaient au vert, ainsi qu'un import
 * « nu » glissé dans un fichier pur, et l'unité « jour » décidée par le
 * propriétaire manquait sans que rien ne le dise. Chaque trou a désormais
 * sa vérification, et chacune a été éprouvée en cassant ce qu'elle garde.
 *
 *   npm run verifier-devis
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ICI = fileURLToPath(import.meta.url);
const RACINE = path.resolve(path.dirname(ICI), '..');
const lire = (f) => readFileSync(path.join(RACINE, f), 'utf8');

/* ================================================================== */
/*  LES PROCESSUS ENFANTS — lancés par ce contrôle lui-même             */
/* ================================================================== */

/* A-9 : LES DATES, DANS UN FUSEAU. Le processus est lancé avec `TZ` posé :
   c'est l'heure du téléphone qu'on simule, pas celle du conteneur. Chaque
   cas est [ce qu'on appelle, ce qu'il doit rendre]. */
if (process.argv[2] === '--fuseau') {
  const D = await import('../src/lib/devis.js');
  const tz = process.env.TZ;
  const ms = (iso) => Date.parse(iso);
  const DEPUIS = {
    /* Paris, l'été (UTC+2) : 0 h 30 le 16/07. */
    'Europe/Paris': [
      ['2026-07-15T22:10:00Z', '2026-07-15T22:30:00Z', 'il y a 20\u00a0min'],
      ['2026-07-15T21:00:00Z', '2026-07-15T22:30:00Z', 'hier'],
      ['2026-07-15T20:00:00.123456+00:00', '2026-07-15T21:30:00Z', 'il y a 1\u00a0h'],
      ['2026-07-13 10:00:00+00', '2026-07-15T21:30:00Z', '13/07/2026'],
      /* …et l'hiver (UTC+1) : 0 h 30 le 20/12, une écriture de 23 h 30 la veille. */
      ['2026-12-19T22:30:00Z', '2026-12-19T23:30:00Z', 'hier'],
      ['2026-12-19T23:20:00Z', '2026-12-19T23:30:00Z', 'il y a 10\u00a0min'],
    ],
    /* Les Antilles (UTC−4) : 23 h 30 le 20/10, quand l'UTC est déjà le 21. */
    'America/Martinique': [
      ['2026-10-21T02:00:00Z', '2026-10-21T03:30:00Z', 'il y a 1\u00a0h'],
      ['2026-10-20T03:00:00Z', '2026-10-21T03:30:00Z', 'hier'],
      ['2026-10-21T03:29:30Z', '2026-10-21T03:30:00Z', 'à l’instant'],
    ],
    /* Kiritimati (UTC+14) : 0 h 30 le 20/10, quand l'UTC est encore le 19. */
    'Pacific/Kiritimati': [
      ['2026-10-19T09:00:00Z', '2026-10-19T10:30:00Z', 'hier'],
      ['2026-10-19T10:05:00Z', '2026-10-19T10:30:00Z', 'il y a 25\u00a0min'],
    ],
  };
  const ORIGINES = {
    'Europe/Paris': [['2026-12-19T23:30:00Z', 'depuis une demande du 20/12/2026'],
      ['2026-07-15 21:59:59+00', 'depuis une demande du 15/07/2026']],
    'America/Martinique': [['2026-10-21T02:00:00+00:00', 'depuis une demande du 20/10/2026']],
    'Pacific/Kiritimati': [['2026-10-19T10:00:00Z', 'depuis une demande du 20/10/2026']],
  };
  const MEMOIRE = {
    'Europe/Paris': ['2026-10-19T23:18:21.716617+00:00', '20/10/2026'],
    'America/Martinique': ['2026-10-21T02:00:00Z', '20/10/2026'],
    'Pacific/Kiritimati': ['2026-10-19T10:00:00Z', '20/10/2026'],
  };
  const faux = [];
  for (const [iso, maintenant, attendu] of DEPUIS[tz] || []) {
    const r = D.depuisLisible(iso, ms(maintenant));
    if (r !== attendu) faux.push(`depuisLisible(${iso}) à ${maintenant} → ${r}, attendu ${attendu}`);
  }
  for (const [createdAt, attendu] of ORIGINES[tz] || []) {
    const r = D.origineLisible({ source: 'demande', quoteRequestId: 'q1', demande: { createdAt } });
    if (r !== attendu) faux.push(`origineLisible(${createdAt}) → ${r}, attendu ${attendu}`);
  }
  const urgence = D.origineLisible({ source: 'urgence', sosRequestId: null });
  if (urgence !== 'depuis une urgence') faux.push(`origineLisible(urgence sans lien) → ${urgence}`);
  if (MEMOIRE[tz]) {
    const [modifieLe, attendu] = MEMOIRE[tz];
    const s = D.memoireDesLignes([{ id: 'l1', type: 'poste', designation: 'Chape', unite: 'm2', prixUnitaireCentimes: 4500,
      modifieLe, devis: { id: 'd1', objet: 'Cuisine', modifieLe } }], 'chape');
    const r = s[0] && s[0].origine.date;
    if (r !== attendu) faux.push(`mémoire, date du devis d'origine ${modifieLe} → ${r}, attendu ${attendu}`);
  }
  process.stdout.write(JSON.stringify({ tz, cas: (DEPUIS[tz] || []).length, faux }));
  process.exit(0);
}

/* A-11 : L'IDENTIFIANT, avec et SANS générateur. Le processus retire
   `crypto` lui-même : l'appareil qui n'a ni `crypto.randomUUID` ni
   `expo.uuidv4` doit recevoir `null`, jamais un identifiant bricolé. */
if (process.argv[2] === '--identifiant') {
  const I = await import('../src/lib/identifiant.js');
  const r = {};
  r.navigateur = I.nouvelIdentifiant();
  const randomUUID = globalThis.crypto && globalThis.crypto.randomUUID;
  /* Un navigateur qui rend n'importe quoi : on passe au téléphone. */
  Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => 'pas-un-uuid' }, configurable: true, writable: true });
  globalThis.expo = { uuidv4: () => 'ABCDEF01-2345-4678-89AB-CDEF01234567' };
  r.navigateurFaux = I.nouvelIdentifiant();
  delete globalThis.crypto;
  r.telephone = I.nouvelIdentifiant();
  globalThis.expo = { uuidv4: () => { throw new Error('module absent'); } };
  r.telephoneQuiLeve = I.nouvelIdentifiant();
  globalThis.expo = { uuidv4: () => '12345' };
  r.telephoneFaux = I.nouvelIdentifiant();
  delete globalThis.expo;
  r.sansGenerateur = I.nouvelIdentifiant();
  r.sansGenerateurEncore = I.nouvelIdentifiant();
  r.avaitRandomUUID = typeof randomUUID === 'function';
  process.stdout.write(JSON.stringify(r));
  process.exit(0);
}

/* ================================================================== */
/*  LE CONTRÔLE                                                         */
/* ================================================================== */

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const json = (x) => JSON.stringify(x);
const egalListes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/* Le code JavaScript SANS SES COMMENTAIRES, par un lecteur qui respecte les
   chaînes ('…', "…", `…` et leurs ${…}) et les expressions régulières : un
   `//` de FIN de ligne est un commentaire, un `//` dans une chaîne (une
   adresse) n'en est pas un. Le premier jet ne retirait que les `//` écrits
   en DÉBUT de ligne : un commentaire de fin de ligne qui citait « 10 € »
   faisait accuser `devis.js` d'écrire un montant lui-même (relecture des
   étapes 0-2, M3) — onzième fois qu'un contrôle de ce projet accuse la
   documentation. Ce lecteur est éprouvé plus bas : ce qu'il rend doit
   rester du JavaScript que `node` sait lire. */
const AVANT_REGEX = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^', '']);
const MOTS_AVANT_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'void', 'delete', 'new', 'throw', 'else', 'do', 'await', 'yield']);
function sansCommentairesJs(c) {
  const t = c.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  let s = '';
  let i = 0;
  const gabarits = [];   // un ${ ouvert dans un gabarit : le nombre d'accolades ouvertes depuis
  let precedent = '';    // le dernier caractère significatif du code
  let mot = '';          // le dernier mot du code
  let blanc = false;     // un blanc depuis le dernier caractère significatif
  const code = (ch) => {
    s += ch;
    if (/\s/.test(ch)) { blanc = true; return; }
    if (/[\w$]/.test(ch)) { mot = /[\w$]/.test(precedent) && !blanc ? mot + ch : ch; } else mot = '';
    precedent = ch;
    blanc = false;
  };
  const chaine = (q) => {   // de la quote ouvrante (comprise) à la fermante
    let j = i + 1;
    while (j < t.length && t[j] !== q) { if (t[j] === '\\') j += 1; j += 1; }
    s += t.slice(i, j + 1); precedent = q; mot = ''; i = j + 1;
  };
  const gabarit = () => {   // depuis i, dans le TEXTE d'un gabarit, jusqu'à « ` » ou « ${ »
    let j = i;
    while (j < t.length && t[j] !== '`' && !(t[j] === '$' && t[j + 1] === '{')) { if (t[j] === '\\') j += 1; j += 1; }
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
        if (t[j] === '\\') { j += 2; continue; }
        if (t[j] === '[') classe = true;
        else if (t[j] === ']') classe = false;
        else if (t[j] === '/' && !classe) break;
        j += 1;
      }
      j += 1;
      while (j < t.length && /[a-z]/i.test(t[j])) j += 1;
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
  return s;
}

/* LES MODULES qu'un fichier charge, SOUS TOUTES LEURS FORMES : `import x from`,
   `import { a } from`, `export { a } from`, `export * from`, et l'import NU,
   `import './x.js';`, qui ne nomme rien mais charge le fichier quand même.
   Le premier jet ne voyait que la forme `from` : un `import './tarifs.js';`
   glissé dans `devis.js` ou dans `centimes.js` passait au vert (relecture
   des étapes 0-2, I3) — et c'est exactement la pente par laquelle un
   fichier « pur » cesse de l'être. */
function modulesDe(src) {
  return [...src.matchAll(/\b(?:import|export)\b[^'"`;()]*?\bfrom\s*(['"])([^'"]+)\1|\bimport\s*(['"])([^'"]+)\3/g)]
    .map((m) => m[2] || m[4]);
}
/* Le nombre d'INSTRUCTIONS qui chargent un module — pour qu'aucune forme
   inconnue de `modulesDe` ne passe en silence : les deux nombres doivent
   être égaux. */
const instructionsDImport = (src) => (src.match(/^\s*import\b(?!\s*\()/gm) || []).length
  + (src.match(/\bexport\s+(?:\*|\{[^}]*\})\s*from\b/g) || []).length;
const chargeQuelqueChose = (src) => modulesDe(src).length > 0 || instructionsDImport(src) > 0
  || /\bimport\s*\(|\brequire\s*\(/.test(src);

/* Le SQL sans ses commentaires, par un lecteur qui RESPECTE LES CHAÎNES
   (y compris `E'…\'…'`) : un nom de table cité dans un commentaire ne
   compte pas ; un nom caché dans une chaîne passée à `execute`, si. Le même
   lecteur que `verifier-legal`. */
function sansCommentairesSql(t) {
  let sortie = '';
  let i = 0;
  while (i < t.length) {
    const c = t[i];
    const suite = t[i + 1];
    if (c === '-' && suite === '-') { while (i < t.length && t[i] !== '\n') i += 1; continue; }
    if (c === '/' && suite === '*') {
      const fin = t.indexOf('*/', i + 2);
      i = fin < 0 ? t.length : fin + 2;
      sortie += ' ';
      continue;
    }
    if (c === "'") {
      const echappe = /[eE]/.test(t[i - 1] || '') && !/[\w$]/.test(t[i - 2] || '');
      let j = i + 1;
      while (j < t.length) {
        if (echappe && t[j] === '\\') { j += 2; continue; }
        if (t[j] === "'" && t[j + 1] === "'") { j += 2; continue; }
        if (t[j] === "'") break;
        j += 1;
      }
      sortie += t.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    sortie += c;
    i += 1;
  }
  return sortie;
}

/* Le corps d'une fonction JavaScript, accolades comptées — APRÈS ses
   paramètres : `memoireDesLignes(lignes, texte, { idLigne } = {})` ouvre une
   accolade avant son corps, et le premier jet de ce lecteur rendait
   `{ idLigne = null }` (le contrôle l'a dit : « corps trop court »). */
function corpsDeFonction(src, nom) {
  const m = new RegExp(`function\\s+${nom}\\s*\\(`).exec(src);
  if (!m) return null;
  let i = m.index + m[0].length;
  for (let p = 1; i < src.length && p > 0; i += 1) {
    if (src[i] === '(') p += 1;
    else if (src[i] === ')') p -= 1;
  }
  i = src.indexOf('{', i);
  const debut = i;
  let n = 0;
  for (; i < src.length; i += 1) {
    if (src[i] === '{') n += 1;
    else if (src[i] === '}') { n -= 1; if (n === 0) return src.slice(debut, i + 1); }
  }
  return null;
}

/* Les imports d'un fichier : `[{ de, noms }]`. */
function importsDe(src) {
  return [...src.matchAll(/\bimport\s*(?:\{([^}]*)\}|[\w*\s,]+)?\s*from\s*['"]([^'"]+)['"]/g)]
    .map((m) => ({ de: m[2], noms: (m[1] || '').split(',').map((x) => x.trim()).filter(Boolean).sort() }));
}

let D; let C; let E; let ERR; let F; let I; let ENT; let CAS;
try {
  D = await import('../src/lib/devis.js');
  C = await import('../src/lib/centimes.js');
  E = await import('../src/lib/emetteur.js');
  ENT = await import('../src/lib/entreprise.js');
  ERR = await import('../src/lib/erreurs.js');
  F = await import('../src/lib/file-ecriture.js');
  I = await import('../src/lib/identifiant.js');
  CAS = JSON.parse(lire('supabase/cas-devis.json'));
} catch (e) {
  console.error(`  ✘ les fichiers du chiffrage s’ouvrent dans node\n      ${e && e.stack}`);
  console.error('\n✘ Le contrôle n’a rien pu éprouver : un fichier de calcul qui charge React Native (ou qui casse) '
    + 'ne se vérifie plus. C’est la leçon de `cloudinary-adresses.js`.\n');
  process.exit(1);
}

/* ================================================================== */
/*  A. CE QU'IL FAIT TOURNER                                            */
/* ================================================================== */
console.log('\nA. CE QU’IL FAIT TOURNER — l’argent, la mémoire, la loi, les dates, la file, l’identifiant');

/* Le joueur JavaScript des cas communs. Il fait ce que la base fait : la
   ligne est jugée (`validerLigne`, les contraintes de `devis_lignes`), puis
   rangée TELLE QUE LE DÉCLENCHEUR LA RANGE (`nettoyerLigne`), puis les
   totaux sont refaits (`totauxDevis`, la contrainte `devis_plafond_check`).
   La première opération refusée arrête le cas. */
const camel = (o) => Object.fromEntries(Object.entries(o || {})
  .map(([k, v]) => [k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase()), v]));
function forme(t) {
  const vent = t.ventilation.filter((e) => e.nbLignes > 0).map((e) => `${e.taux}:${e.base}:${e.tva}:${e.nbLignes}`).join(',') || '—';
  const opts = t.options.map((o) => `${o.taux}:${o.total}`).join(',') || '—';
  return `${t.ht}|${t.tva}|${t.ttc}|${vent}|${opts}`;
}
function jouerCas(cas) {
  let lignes = new Map();
  let rang = 0;
  const journal = [];
  for (const op of cas.operations || []) {
    let essai = new Map(lignes);
    if (op.op === 'ajouter') {
      rang += 1;
      const l = { id: op.ligne, ordre: rang * 1000, ...camel(op.valeurs) };
      const v = D.validerLigne(l);
      journal.push({ op, refusPar: v.ok ? null : 'validerLigne', contrainte: v.contrainte });
      if (!v.ok) return { resultat: `REFUS:${v.contrainte}`, journal };
      essai.set(op.ligne, D.nettoyerLigne(l));
    } else if (op.op === 'modifier') {
      const l = { ...essai.get(op.ligne), ...camel(op.valeurs) };
      const v = D.validerLigne(l);
      journal.push({ op, refusPar: v.ok ? null : 'validerLigne', contrainte: v.contrainte });
      if (!v.ok) return { resultat: `REFUS:${v.contrainte}`, journal };
      essai.set(op.ligne, D.nettoyerLigne(l));
    } else if (op.op === 'retirer') {
      essai.delete(op.ligne);
      journal.push({ op });
    } else {
      return { resultat: `OPERATION INCONNUE:${op.op}`, journal };
    }
    const t = D.totauxDevis([...essai.values()]);
    if (!t.ok) return { resultat: `REFUS:${t.contrainte}`, journal };
    lignes = essai;
  }
  return { resultat: forme(D.totauxDevis([...lignes.values()])), journal };
}
const FONCTIONS_JS = {
  devis_tva_de: (base, taux) => D.tvaDe(base, taux),
  devis_total_ligne: (q, p) => D.valeurLigne({ type: 'poste', quantiteMilliemes: q, prixUnitaireCentimes: p }),
};

console.log('\n  1. les cas d’argent de `supabase/cas-devis.json`, joués en JavaScript');
{
  /* LE NOMBRE EST ÉCRIT EN DUR : un fichier vidé, ou à moitié, ne passe
     pas au vert en n'éprouvant plus rien. 44, ceux du §3.5 du cahier. */
  const cas = CAS.cas || [];
  verifier('le jeu commun porte exactement 44 cas, chacun avec un identifiant unique',
    cas.length === 44 && CAS.nombre === 44 && new Set(cas.map((c) => c.id)).size === 44,
    `${cas.length} cas lus (nombre annoncé : ${CAS.nombre})`);
  const malFormes = cas.filter((c) => !(c.operations ? typeof c.attendu === 'string' : !c.attendu && c.fonctions));
  verifier('chaque cas a des opérations ET un attendu, ou seulement des appels de fonction',
    malFormes.length === 0, malFormes.map((c) => c.id).join(', '));
  /* POSTGRESQL DOIT POUVOIR LES JOUER (cas 30 de l'essai) : chaque colonne
     nommée par un cas est une colonne de `devis_lignes` que l'artisan écrit
     (la liste fermée du §2.3, moins ce que la base pose : l'identifiant, le
     devis, l'ordre, le total, la date) ; chaque opération est l'une des
     trois ; chaque fonction, l'une des deux. Le joueur SQL ne devine rien. */
  const ECRITES = ['type', 'designation', 'quantite_milliemes', 'unite', 'prix_unitaire_centimes', 'taux_tva_centiemes',
    'offert', 'main_oeuvre', 'fourniture_non_comprise', 'surface_sol_milliemes', 'surface_murs_milliemes'];
  const horsListe = cas.flatMap((c) => (c.operations || []).flatMap((o) => [
    ...(['ajouter', 'modifier', 'retirer'].includes(o.op) ? [] : [`${c.id} : opération « ${o.op} »`]),
    ...Object.keys(o.valeurs || {}).filter((k) => !ECRITES.includes(k)).map((k) => `${c.id} : colonne « ${k} »`),
    ...(o.op !== 'retirer' && !o.valeurs ? [`${c.id} : « ${o.op} » sans valeurs`] : []),
  ])).concat(cas.flatMap((c) => (c.fonctions || []).filter((f) => !FONCTIONS_JS[f.nom] || f.args.length !== 2)
    .map((f) => `${c.id} : fonction « ${f.nom} »`)));
  verifier('chaque cas se joue aussi en SQL : trois opérations, des colonnes de `devis_lignes` seulement, deux fonctions',
    horsListe.length === 0, horsListe.join(' ; '));
  const faux = [];
  for (const c of cas) {
    if (c.operations) {
      const r = jouerCas(c).resultat;
      if (r !== c.attendu) faux.push(`${c.id} : ${r} au lieu de ${c.attendu}`);
    }
    for (const f of c.fonctions || []) {
      const r = FONCTIONS_JS[f.nom] ? FONCTIONS_JS[f.nom](...f.args) : 'FONCTION INCONNUE';
      if (r !== f.attendu) faux.push(`${c.id} : ${f.nom}(${f.args.join(', ')}) → ${r}, attendu ${f.attendu}`);
    }
  }
  verifier(`les 44 cas rendent exactement leurs attendus, octet pour octet (${cas.filter((c) => c.operations).length} suites `
    + `d’opérations, ${cas.reduce((n, c) => n + (c.fonctions || []).length, 0)} appels de fonction)`,
    faux.length === 0, faux.join('\n      '));
  const refus = cas.filter((c) => /^REFUS:/.test(c.attendu || ''));
  verifier(`…dont ${refus.length} refus, chacun par le NOM de sa contrainte`,
    refus.length >= 20 && refus.every((c) => /^REFUS:devis_(ligne_[a-z_]+|plafond)_check$/.test(c.attendu)));
}

console.log('\n  2. chaque borne est éprouvée, exactement');
{
  const lignes = (CAS.cas || []).flatMap((c) => (c.operations || []).filter((o) => o.op === 'ajouter')
    .map((o) => ({ cas: c, v: o.valeurs })));
  const q = (x) => x.v.quantite_milliemes;
  const p = (x) => x.v.prix_unitaire_centimes;
  const valeurExacte = (x) => (BigInt(q(x)) * BigInt(p(x)) + 500n) / 1000n;
  const auPlafond = lignes.filter((x) => Number.isInteger(q(x)) && Number.isInteger(p(x)) && q(x) > 0 && p(x) >= 0
    && valeurExacte(x) === BigInt(D.PLAFOND) && !/^REFUS/.test(x.cas.attendu));
  const plafondPlusUn = lignes.filter((x) => Number.isInteger(q(x)) && Number.isInteger(p(x)) && q(x) > 0 && p(x) > 0
    && valeurExacte(x) === BigInt(D.PLAFOND) + 1n && (BigInt(q(x)) * BigInt(p(x))) % 1000n !== 0n);
  verifier('un cas pose une quantité de 99 999,999 (`QUANTITE_MAX`), un autre un prix de 99 999 999,99 € (`PRIX_MAX`)',
    lignes.some((x) => q(x) === D.QUANTITE_MAX) && lignes.some((x) => p(x) === D.PRIX_MAX)
    && D.QUANTITE_MAX === 99999999 && D.PRIX_MAX === 9999999999);
  verifier('un cas ACCEPTÉ tombe exactement AU plafond (99 999 999,99 €)', auPlafond.length >= 1 && D.PLAFOND === 9999999999);
  verifier('un cas atteint le plafond + 1 centime PAR L’ARRONDI, et il est refusé par `devis_ligne_total_check`',
    plafondPlusUn.length >= 1 && plafondPlusUn.every((x) => x.cas.attendu === 'REFUS:devis_ligne_total_check'),
    plafondPlusUn.map((x) => x.cas.id).join(', '));
  /* …et le miroir mord AU bon endroit : une ligne qui vaut le plafond passe,
     une ligne qui vaut le plafond + 1 c est refusée, sur la valeur. */
  const L = (q2, p2, plus = {}) => ({ type: 'poste', designation: 'x', unite: 'u', tauxTvaCentiemes: 0,
    quantiteMilliemes: q2, prixUnitaireCentimes: p2, ...plus });
  const aLaBorne = [
    [L(1001, 9990009989), true], [L(1000, 9999999999), true], [L(1351, 7401924500), false],
    [L(1351, 7401924500, { offert: true }), false], [L(99999999, 9999999999), false],
    [L(99999999, 1), true], [L(100000000, 1), false], [L(1000, 10000000000), false],
  ];
  const mauvais = aLaBorne.filter(([l, ok]) => D.validerLigne(l).ok !== ok)
    .map(([l, ok]) => `${l.quantiteMilliemes} × ${l.prixUnitaireCentimes}${l.offert ? ' (offert)' : ''} : ${ok ? 'refusée' : 'acceptée'}`);
  verifier('`validerLigne` accepte AU plafond et refuse à plafond + 1 c — même pour une ligne offerte', mauvais.length === 0,
    mauvais.join(' ; '));
}

console.log('\n  3. ce qu’on tape, ce qu’on lit');
{
  const m = (s) => D.versMilliemes(s);
  const mOk = [['2,5', 2500], ['2.5', 2500], ['2,500', 2500], ['1 000', 1000000], ['99999,999', 99999999], ['', null],
    ['  ', null], ['0,001', 1], ['007', 7000]];
  const mKo = ['2,5000', '-1', '100000', '1.000,5', 'deux', '2,5,1'];
  const fauxM = mOk.filter(([s, v]) => !(m(s).ok && m(s).milliemes === v)).map(([s]) => `${json(s)} → ${json(m(s))}`)
    .concat(mKo.filter((s) => m(s).ok).map((s) => `${json(s)} accepté`));
  verifier('`versMilliemes` : « 2,5 » et « 2.5 » → 2500 ; quatre décimales, négatif, six chiffres refusés ; vide → null',
    fauxM.length === 0, fauxM.join(' ; '));
  const c = (s) => D.versCentiemes(s);
  const cOk = [['5', 500], ['2,5', 250], ['5 %', 500], ['5%', 500], ['0,01', 1], ['', null]];
  const cKo = ['5,001', '-1', '1000'];
  const fauxC = cOk.filter(([s, v]) => !(c(s).ok && c(s).centiemes === v)).map(([s]) => `${json(s)} → ${json(c(s))}`)
    .concat(cKo.filter((s) => c(s).ok).map((s) => `${json(s)} accepté`));
  const motsC = [c('-1').message, c('5,001').message, c('cinq').message];
  verifier('`versCentiemes` : « 5 » → 500, « 2,5 » → 250, « 5 % » → 500 ; trois décimales et négatif refusés ; vide → null',
    fauxC.length === 0, fauxC.join(' ; '));
  verifier('…et ses messages parlent de POURCENTAGE, jamais d’euros',
    motsC.every((x) => /pourcentage/i.test(x || '') && !/euro|€/i.test(x || '')), json(motsC));
  const NB = '\u00a0';
  const lisibles = [
    [D.milliemesLisibles(2500), '2,5'], [D.milliemesLisibles(1000), '1'], [D.milliemesLisibles(1234500), `1${NB}234,5`],
    [D.milliemesLisibles(17), '0,017'], [D.milliemesLisibles(2.5), null],
    [D.tauxLisible(550), `5,5${NB}%`], [D.tauxLisible(2000), `20${NB}%`], [D.tauxLisible(1000), `10${NB}%`],
    [D.tauxLisible(105), `1,05${NB}%`], [D.tauxLisible(0), null], [D.tauxLisible(null), null],
    [D.montantDevis(9999999999), `99${NB}999${NB}999,99${NB}€`], [D.montantDevis(5), `0,05${NB}€`],
    [D.montantDevis(1.5), null], [D.montantDevis(0), `0,00${NB}€`],
  ];
  const fauxL = lisibles.map(([a, b], i) => (a === b ? null : `#${i} ${json(a)} au lieu de ${json(b)}`)).filter(Boolean);
  verifier('`milliemesLisibles`, `tauxLisible` (0 → null : « 0 % » ne s’affiche jamais) et `montantDevis` (espaces '
    + 'insécables entre les milliers et avant « € »)', fauxL.length === 0, fauxL.join(' ; '));
  const arrondis = [
    [D.diviserArrondi(5, 10), 1], [D.diviserArrondi(14, 10), 1], [D.diviserArrondi(15, 10), 2], [D.diviserArrondi(25, 10), 3],
    [D.diviserArrondi(8332500, 1000), 8333], [D.diviserArrondi(-6, 10), null], [D.diviserArrondi(-5, 10), null],
    [D.diviserArrondi(5, 3), null], [D.diviserArrondi(5, 0), null], [D.diviserArrondi(2.5, 10), null],
    [D.tvaDe(-6, 1000), null], [D.tvaDe(5, -1), null], [D.tvaDe(1000, 105), 11], [D.tvaDe(200, 175), 4],
  ];
  const fauxA = arrondis.map(([a, b], i) => (a === b ? null : `#${i} ${a} au lieu de ${b}`)).filter(Boolean);
  verifier('`diviserArrondi` : le demi MONTE (5/10 → 1, 25/10 → 3, jamais au pair) ; un négatif rend null, jamais un arrondi '
    + 'vers zéro', fauxA.length === 0, fauxA.join(' ; '));
  /* LES BORNES DE `devis_tva_de`, recopiées : une base de 15 chiffres au
     plus, un taux de 0 à 9 000 (90 %). Sans la borne du taux, la fonction SQL
     sort en « 22003 bigint out of range », en anglais (relecture des étapes
     0-2, P8) ; la section 49 écrit la même, et B-18 la comparera. */
  const bornesTva = [
    [D.tvaDe(999_999_999_999_999, 0), 0], [D.tvaDe(1_000_000_000_000_000, 1), null], [D.tvaDe(-1, 1000), null],
    [D.tvaDe(1000, 9000), 900], [D.tvaDe(1000, 9001), null], [D.tvaDe(1000, -1), null], [D.tvaDe(1000, 2.5), null],
  ];
  const fauxB = bornesTva.map(([a, b], i) => (a === b ? null : `#${i} ${a} au lieu de ${b}`)).filter(Boolean);
  verifier('`tvaDe` : `null` hors de 0 ≤ base ≤ 999 999 999 999 999 et de 0 ≤ taux ≤ 9 000 — les bornes de `devis_tva_de`',
    fauxB.length === 0 && D.TAUX_CALCUL_MAX === 9000, fauxB.join(' ; '));
  /* LA LISTE FERMÉE DES UNITÉS, ÉCRITE EN DUR contre la décision du
     propriétaire (21/10/2026, réponse Q2 : « ajouter jour ») — et non contre
     une seconde copie, qui se tromperait avec la première : le prototype de
     l'étape 2 et `UNITES` avaient oublié « jour » ENSEMBLE, et B-17, qui les
     compare l'une à l'autre, aurait passé au vert (relecture des étapes 0-2,
     B1). Les trois libellés de chacune, dans l'ordre des pastilles. */
  const SEPT = [
    ['m2', 'm²', 'm²', 'mètre carré'], ['m', 'm', 'm linéaire', 'mètre linéaire'], ['m3', 'm³', 'm³', 'mètre cube'],
    ['u', 'u', 'unité', 'unité'], ['h', 'h', 'heure', 'heure'], ['jour', 'jour', 'jour', 'jour'],
    ['forfait', 'forfait', 'forfait', 'forfait'],
  ];
  const lues = D.UNITES.map((u) => [u.cle, u.court, u.pastille, u.nom]);
  verifier('`UNITES` : EXACTEMENT les sept unités décidées (m², m linéaire, m³, unité, heure, jour, forfait), leurs trois '
    + 'libellés, dans cet ordre — jamais « ml » ni « M2 »', json(lues) === json(SEPT)
    && D.UNITES.every((u) => ![u.court, u.pastille, u.nom].some((x) => /^(ml|M2)$/.test(x))), json(lues));
  const jour = D.validerLigne({ type: 'poste', designation: 'Pose, une journée', quantiteMilliemes: 1500, unite: 'jour',
    prixUnitaireCentimes: 45000, tauxTvaCentiemes: 1000 });
  const totJour = D.totauxDevis([{ id: 'j', type: 'poste', designation: 'Pose', quantiteMilliemes: 1500, unite: 'jour',
    prixUnitaireCentimes: 45000, tauxTvaCentiemes: 1000 }]);
  verifier('…une ligne « à la journée » est ACCEPTÉE et se chiffre (1,5 jour à 450 € : 675 € HT, 67,50 € de TVA)',
    jour.ok && totJour.ok && totJour.ht === 67500 && totJour.tva === 6750, `${json(jour)} ${json(totJour)}`);
}

console.log('\n  4. la mémoire — les prix déjà écrits, jamais une moyenne');
{
  let n = 0;
  const L = (designation, prix, plus = {}) => {
    n += 1;
    return {
      id: `l${String(n).padStart(2, '0')}`, type: 'poste', designation, unite: 'm2', prixUnitaireCentimes: prix,
      modifieLe: `2026-10-${String(n).padStart(2, '0')}T10:00:00Z`,
      devis: { id: `d${n}`, objet: `Devis ${n}`, modifieLe: `2026-10-${String(n).padStart(2, '0')}T10:00:00Z` }, ...plus,
    };
  };
  const deux = [L('Chape sèche', 5000), L('Chape sèche', 7000)];
  const s2 = D.memoireDesLignes(deux, 'chape');
  verifier('50 € et 70 € → DEUX suggestions, 70 € (la plus récente) d’abord — aucune ne vaut 60 €',
    s2.length === 2 && s2[0].prixUnitaireCentimes === 7000 && s2[1].prixUnitaireCentimes === 5000
    && s2.every((s) => [5000, 7000].includes(s.prixUnitaireCentimes)), json(s2.map((s) => s.prixUnitaireCentimes)));
  const unites = D.memoireDesLignes([L('Ragréage', 4500), L('Ragréage', 4500, { unite: 'forfait' })], 'ragr');
  verifier('la même phrase au m² et au forfait, AU MÊME PRIX → deux suggestions',
    unites.length === 2 && new Set(unites.map((s) => s.unite)).size === 2, json(unites.map((s) => s.unite)));
  const fourniture = D.memoireDesLignes([L('Pose de faïence', 4500), L('Pose de faïence', 4500, { fournitureNonComprise: true })], 'faience');
  verifier('la même phrase avec et sans fourniture, AU MÊME PRIX → deux suggestions (sans accent ni casse : « faience »)',
    fourniture.length === 2 && fourniture.filter((s) => s.fournitureNonComprise).length === 1, json(fourniture));
  const quatre = D.memoireDesLignes([L('Enduit', 1000), L('Enduit', 2000), L('Enduit', 3000), L('Enduit', 4000), L('Enduit', 4000)], 'enduit');
  verifier('trois prix au plus par phrase, sans répéter un même prix, chacun avec son devis d’origine',
    quatre.length === 3 && egalListes(quatre.map((s) => s.prixUnitaireCentimes), [4000, 3000, 2000])
    && quatre[0].origine.objet === 'Devis 11' && /^\d{2}\/10\/2026$/.test(quatre[0].origine.date || ''),
    json(quatre.map((s) => [s.prixUnitaireCentimes, s.origine])));
  const melange = [
    L('Chape', 4500, { id: 'courante' }), L('Chape', 4600, { type: 'zone' }), L('Chape', 4700, { type: 'reserve' }),
    L('Chape', 4800, { type: 'option' }), L('Pose', 9900),
  ];
  const sM = D.memoireDesLignes(melange, 'chape', { idLigne: 'courante' });
  verifier('la ligne en cours n’y est pas ; un titre ou une réserve jamais ; une option, oui ; « chape » ne ramène pas « Pose »',
    sM.length === 1 && sM[0].prixUnitaireCentimes === 4800, json(sM));
  verifier('…et un texte vide ne propose rien', D.memoireDesLignes(melange, '  ').length === 0);
  const offerte = D.memoireDesLignes([L('Nettoyage de fin de chantier', 15000, { offert: true, mainOeuvre: true })], 'nettoyage');
  const copie = D.valeursDeLaSuggestion(offerte[0]);
  verifier('une ligne offerte ressort « offerte », avec sa valeur ; un appui recopie la phrase, l’unité, le prix, la '
    + 'fourniture et la main-d’œuvre — JAMAIS « Offert », jamais la quantité',
    offerte.length === 1 && offerte[0].offert === true && offerte[0].prixUnitaireCentimes === 15000
    && egalListes(Object.keys(copie).sort(), ['designation', 'fournitureNonComprise', 'mainOeuvre', 'prixUnitaireCentimes', 'unite'])
    && copie.prixUnitaireCentimes === 15000 && copie.mainOeuvre === true && !('offert' in copie) && !('quantiteMilliemes' in copie),
    json(copie));
  const sansValeur = D.valeursDeLaSuggestion(D.memoireDesLignes([L('Déplacement', 0, { offert: true })], 'deplacement')[0]);
  const avecFourniture = D.valeursDeLaSuggestion(fourniture.find((s) => s.fournitureNonComprise));
  verifier('…une ligne offerte SANS valeur ne recopie aucun prix (un 0 sans « Offert » serait refusé) ; la fourniture non '
    + 'comprise est recopiée', sansValeur && sansValeur.prixUnitaireCentimes === null && avecFourniture.fournitureNonComprise === true,
    json([sansValeur, avecFourniture]));
}

console.log('\n  5. les lignes rangées, les demandes, le régime, les phrases de la loi');
{
  /* Deux lignes au MÊME ordre : rangées par identifiant, quel que soit
     l'ordre où elles arrivent. */
  const lignes = [
    { id: 'z1', ordre: 1000, type: 'zone', designation: 'R+1' },
    { id: 'p1', ordre: 2000, type: 'piece', designation: 'Salle de bains' },
    { id: 'b', ordre: 3000, type: 'poste', designation: 'B', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 2000, tauxTvaCentiemes: 1000 },
    { id: 'a', ordre: 3000, type: 'poste', designation: 'A', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 1000, tauxTvaCentiemes: 1000 },
    { id: 'o', ordre: 3500, type: 'option', designation: 'Option', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 9999, tauxTvaCentiemes: 1000 },
    { id: 'r', ordre: 3600, type: 'reserve', designation: 'Sous réserve' },
    { id: 'p2', ordre: 4000, type: 'piece', designation: 'Cuisine' },
    /* Un POSTE au même ordre que le titre de pièce : rangé par son
       identifiant (« q » après « p2 »), il appartient à la Cuisine. Rangé au
       hasard de l'arrivée, il passerait dans la Salle de bains — et le
       sous-total le dirait. */
    { id: 'q', ordre: 4000, type: 'poste', designation: 'Q', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 100, tauxTvaCentiemes: 1000 },
    { id: 'c', ordre: 5000, type: 'poste', designation: 'C', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 4000, tauxTvaCentiemes: 2000, offert: true },
    { id: 'd', ordre: 6000, type: 'poste', designation: 'D', quantiteMilliemes: 2000, unite: 'u', prixUnitaireCentimes: 1500, tauxTvaCentiemes: 2000 },
    { id: 'z2', ordre: 7000, type: 'zone', designation: 'R+2' },
    { id: 'p3', ordre: 8000, type: 'piece', designation: 'Chambre' },
    { id: 'e', ordre: 9000, type: 'poste', designation: 'E', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 700, tauxTvaCentiemes: 550 },
  ];
  const ids = (ls) => ls.map((l) => l.id).join(',');
  const ordreAttendu = 'z1,p1,a,b,o,r,p2,q,c,d,z2,p3,e';
  const melanges = [lignes, [...lignes].reverse(), [lignes[3], lignes[2], ...lignes.slice(4), lignes[0], lignes[1]]];
  verifier('`trierLignes` : par `ordre`, PUIS par `id` — le même résultat quel que soit l’ordre d’arrivée',
    melanges.every((x) => ids(D.trierLignes(x)) === ordreAttendu), melanges.map((x) => ids(D.trierLignes(x))).join(' | '));
  const st = melanges.map((x) => json(D.sousTotaux(x)));
  const s0 = D.sousTotaux(lignes);
  verifier('`sousTotaux` : la zone, la pièce ; une option et une réserve n’y entrent pas, une ligne offerte compte 0 ; '
    + 'le même résultat quel que soit l’ordre d’arrivée',
    s0.z1 === 6100 && s0.p1 === 3000 && s0.p2 === 3100 && s0.z2 === 700 && s0.p3 === 700 && new Set(st).size === 1,
    `${json(s0)} ; ${st.join(' | ')}`);
  verifier('`lignesDeLaPiece` : ce qu’emporte un titre — sans les options, qui vivent à part',
    ids(D.lignesDeLaPiece(lignes, 'p1')) === 'a,b,r' && ids(D.lignesDeLaPiece(lignes, 'z1')) === 'p1,a,b,r,p2,q,c,d'
    && D.lignesDeLaPiece(lignes, 'a').length === 0, `${ids(D.lignesDeLaPiece(lignes, 'p1'))} / ${ids(D.lignesDeLaPiece(lignes, 'z1'))}`);
  verifier('`titreQuiRecoit` : la pièce d’avant DANS LA MÊME ZONE, la zone d’avant ; personne sinon',
    (D.titreQuiRecoit(lignes, 'p2') || {}).id === 'p1' && D.titreQuiRecoit(lignes, 'p3') === null
    && (D.titreQuiRecoit(lignes, 'z2') || {}).id === 'z1' && D.titreQuiRecoit(lignes, 'z1') === null
    && D.titreQuiRecoit(lignes, 'p1') === null);
  verifier('`ordreEntre`, `renumeroter`, `monter`, `descendre` : le milieu, la fin, plus de place → renuméroter',
    D.ordreEntre(1000, 2000) === 1500 && D.ordreEntre(null, 1000) === 500 && D.ordreEntre(3000, null) === 4000
    && D.ordreEntre(1000, 1001) === null && D.ordreEntre(3000, 3000) === null && D.ordreEntre(null, null) === 1000
    && json(D.renumeroter(lignes).slice(0, 4)) === json([{ id: 'z1', ordre: 1000 }, { id: 'p1', ordre: 2000 }, { id: 'a', ordre: 3000 }, { id: 'b', ordre: 4000 }])
    && json(D.monter(lignes, 'd')) === json({ ordre: 4500 }) && json(D.descendre(lignes, 'c')) === json({ ordre: 6500 })
    && json(D.monter(lignes, 'b')) === json({ ordre: 2500 }) && json(D.monter(lignes, 'r')) === json({ renumeroter: true })
    && D.monter(lignes, 'z1') === null
    && D.descendre(lignes, 'e') === null && D.monter(lignes, 'o') === null,
    `${json(D.monter(lignes, 'd'))} ${json(D.descendre(lignes, 'c'))} ${json(D.monter(lignes, 'b'))} ${json(D.monter(lignes, 'r'))}`);
  /* La colonne `ordre` est un `integer` : au-delà de 2 147 483 647, la base
     refuserait en anglais (22003). Plus de place en fin : renuméroter. */
  verifier('`ordreEntre` ne dépasse jamais la borne d’un `integer` : en fin de liste, plus de place → `null` (renuméroter)',
    D.ordreEntre(2_147_483_000, null) === null && D.ordreEntre(2_147_482_647, null) === 2_147_483_647,
    `${D.ordreEntre(2_147_483_000, null)} ${D.ordreEntre(2_147_482_647, null)}`);
  /* Une ligne IRRECEVABLE sous une pièce : le sous-total ne l'oublie pas en
     silence, il rend `null` (« on ne sait pas »), comme les totaux refusent. */
  const avecFaute = [...lignes, { id: 'f', ordre: 9500, type: 'poste', designation: 'Faute', quantiteMilliemes: 0, unite: 'u',
    prixUnitaireCentimes: 100, tauxTvaCentiemes: 1000 }];
  const stF = D.sousTotaux(avecFaute);
  verifier('`sousTotaux` : une ligne irrecevable rend le sous-total de SA pièce et de SA zone `null`, jamais une somme qui l’oublie ; '
    + 'les autres titres gardent le leur', stF.p3 === null && stF.z2 === null && stF.p1 === 3000 && stF.z1 === 6100, json(stF));
  /* UNE seule règle pour le type d'une ligne : sans type, c'est un poste —
     dans les totaux ET dans le sous-total de sa pièce (relecture 0-2, P11). */
  const sansType = [{ id: 'p', ordre: 1000, type: 'piece', designation: 'Cuisine' },
    { id: 'x', ordre: 2000, designation: 'Sans type', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 1000, tauxTvaCentiemes: 1000 }];
  verifier('une ligne SANS type compte comme un poste partout : dans le total du devis et dans le sous-total de sa pièce',
    D.totauxDevis(sansType).ht === 1000 && D.sousTotaux(sansType).p === 1000,
    `HT ${D.totauxDevis(sansType).ht}, sous-total ${D.sousTotaux(sansType).p}`);
  /* « Mes devis » : deux devis modifiés à la MÊME date se rangent par leur
     identifiant, quel que soit l'ordre d'arrivée. */
  const memeDate = '2026-10-21T10:00:00Z';
  const liste = [{ id: 'c3', modifieLe: memeDate }, { id: 'a1', modifieLe: memeDate }, { id: 'b2', modifieLe: '2026-10-21T11:00:00Z' }];
  const rangs = [liste, [...liste].reverse(), [liste[1], liste[2], liste[0]]].map((x) => D.trierDevis(x).map((d) => d.id).join(','));
  verifier('`trierDevis` : le plus récent d’abord, PUIS par identifiant — le même rang quel que soit l’ordre d’arrivée',
    rangs.every((r) => r === 'b2,a1,c3'), rangs.join(' | '));
  /* Un devis « depuis une demande » dont le LIEN est devenu vide (la demande
     a été effacée : `on delete set null`) ne s'invente pas de date, même si
     une copie de la demande traîne encore à l'écran. */
  verifier('`origineLisible` : le lien vide → « depuis une demande », sans date — même si `demande` est encore là',
    D.origineLisible({ source: 'demande', quoteRequestId: null, demande: { createdAt: '2026-09-15T10:00:00Z' } }) === 'depuis une demande'
    && D.origineLisible({ source: 'urgence', sosRequestId: null, urgence: { createdAt: '2026-09-15T10:00:00Z' } }) === 'depuis une urgence'
    && D.origineLisible({ source: 'manuelle' }) === null);

  const client = { id: 'cl1', nom: 'Mme Martin', adresse: ' 4 rue des Acacias ', codePostal: '13350', ville: 'Charleval' };
  const dc = D.devisDepuisClient(client);
  verifier('`devisDepuisClient` : la fiche rattachée, son adresse COPIÉE comme lieu (une copie, modifiable)',
    json(dc) === json({ source: 'manuelle', clientId: 'cl1', lieuAdresse: '4 rue des Acacias', lieuCodePostal: '13350', lieuVille: 'Charleval' }),
    json(dc));
  const demande = { id: 'q1', genre: 'devis', statut: 'accepte', titre: 'Ouverture de mur porteur', nom: 'Marc', clientId: 'u-marc',
    ville: 'Lambesc (13)', telephone: '06', budget: '5000_15000' };
  const dd = D.devisDepuisDemande(demande);
  const ds = D.devisDepuisDemande({ ...demande, id: 's1', genre: 'sos', titre: 'Fuite' });
  verifier('`devisDepuisDemande` : la description et le lien d’origine SEULEMENT — ni client (un compte n’est pas une fiche, '
    + 'D1), ni lieu ; un rappel → null',
    json(dd) === json({ source: 'demande', quoteRequestId: 'q1', objet: 'Ouverture de mur porteur' })
    && json(ds) === json({ source: 'urgence', sosRequestId: 's1', objet: 'Fuite' })
    && D.devisDepuisDemande({ ...demande, genre: 'rappel' }) === null
    && [dd, ds].every((x) => !Object.keys(x).some((k) => /client|lieu|ville|adresse|telephone|nom/i.test(k))),
    `${json(dd)} ${json(ds)}`);
  const statuts = [
    [{ genre: 'devis', statut: 'accepte' }, true], [{ genre: 'devis', statut: 'termine' }, true],
    [{ genre: 'sos', statut: 'acceptee' }, true], [{ genre: 'sos', statut: 'termine' }, true],
    [{ genre: 'devis', statut: 'en_attente' }, false], [{ genre: 'sos', statut: 'envoyee' }, false],
    [{ genre: 'rappel', statut: 'accepte' }, false], [{ genre: 'devis', statut: 'refuse' }, false],
  ];
  const fauxS = statuts.filter(([d, ok]) => D.peutFaireUnDevis(d) !== ok).map(([d]) => json(d));
  verifier('`peutFaireUnDevis` : une demande de devis ou une urgence, acceptée ou terminée, dans l’orthographe de chaque '
    + 'table ; jamais un rappel, jamais en attente', fauxS.length === 0, fauxS.join(' ; '));

  /* LES CINQ ÉTATS DU RÉGIME. Un échec, une lecture en cours : on ne sait
     pas — jamais « non déclaré ». */
  const P = (taux) => ({ type: 'poste', designation: 'x', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 1000, tauxTvaCentiemes: taux });
  const ETATS = { franchise: 'franchise', reel: 'reel', non_declare: null, chargement: { chargement: true }, echec: { echec: true } };
  const inconnus = [ETATS.chargement, ETATS.echec, undefined];
  const tarifs = { taux_horaire_centimes: 6250, affiche: true };
  const NB = '\u00a0';
  verifier('`tauxProposes` : franchise [0], réel [20 %, 10 %, 5,5 %], non déclaré [], lecture ou échec → null (« on ne sait pas »)',
    json(D.tauxProposes('franchise')) === '[0]' && json(D.tauxProposes('reel')) === '[2000,1000,550]'
    && json(D.tauxProposes(null)) === '[]' && inconnus.every((x) => D.tauxProposes(x) === null));
  const coherence = {
    franchiseOk: D.coherenceRegime([P(0)], 'franchise'), franchiseTaux: D.coherenceRegime([P(1000)], 'franchise'),
    reelOk: D.coherenceRegime([P(1000)], 'reel'), reelZero: D.coherenceRegime([P(0)], 'reel'),
    nonDeclare: D.coherenceRegime([P(1000)], null), nonDeclareTitres: D.coherenceRegime([{ type: 'zone', designation: 'R+1' }], null),
    incomplete: D.coherenceRegime([{ type: 'poste', designation: 'x' }], 'franchise'),
  };
  verifier('`coherenceRegime` : une phrase quand les lignes contredisent le régime, rien sinon — et rien quand on ne sait pas',
    coherence.franchiseOk === null && /franchise/.test(coherence.franchiseTaux || '') && coherence.reelOk === null
    && /régime réel/.test(coherence.reelZero || '') && /pas déclaré/.test(coherence.nonDeclare || '')
    && coherence.nonDeclareTitres === null && coherence.incomplete === null
    && inconnus.every((x) => D.coherenceRegime([P(1000)], x) === null && D.coherenceRegime([P(0)], x) === null),
    json(coherence));
  const th = {
    franchise: D.tauxHorairePropose(tarifs, 'franchise'), reel: D.tauxHorairePropose(tarifs, 'reel'),
    aucun: D.tauxHorairePropose(null, 'franchise'), sansTaux: D.tauxHorairePropose({ taux_horaire_centimes: null }, 'reel'),
    garde: D.tauxHorairePropose({ taux_horaire_centimes: 6250, affiche: false }, 'franchise'),
  };
  const thInconnus = [
    D.tauxHorairePropose({ chargement: true }, 'reel'), D.tauxHorairePropose({ echec: true }, 'franchise'),
    D.tauxHorairePropose(tarifs, { echec: true }), D.tauxHorairePropose(tarifs, { chargement: true }),
    D.tauxHorairePropose(undefined, 'reel'),
  ];
  verifier('`tauxHorairePropose` : en franchise le taux tel quel ; au régime réel MONTRÉ en TTC, jamais converti, le champ vide',
    th.franchise.valeur === 6250 && th.franchise.phrase.includes(`62,50${NB}€`)
    && th.reel.valeur === null && th.reel.phrase.includes(`62,50${NB}€ TTC`) && /hors taxes/.test(th.reel.phrase)
    && /déclaré/.test(th.garde.phrase) && !/affiché/.test(th.garde.phrase),
    json(th));
  verifier('…sans taux : « pas déclaré » ; en lecture ou en échec : « n’a pas pu être lu », JAMAIS « déclaré »',
    th.aucun.valeur === null && /pas déclaré/.test(th.aucun.phrase) && /pas déclaré/.test(th.sansTaux.phrase)
    && thInconnus.every((x) => x.valeur === null && /n’a pas pu être lu/.test(x.phrase) && !/déclaré/.test(x.phrase)),
    json(thInconnus));
  const phrasesInconnues = [...inconnus.flatMap((x) => [D.coherenceRegime([P(1000)], x), D.coherenceRegime([P(0)], x)]),
    ...thInconnus.map((x) => x.phrase)].filter(Boolean);
  verifier('aucune phrase d’un régime en lecture ou en échec ne dit « non déclaré » ni « pas déclaré »',
    phrasesInconnues.every((s) => !/(non|pas) déclaré/.test(s)), json(phrasesInconnues));

  verifier('`avertissementDelai` : « indicatif » (sans accent ni casse) avertit, en citant R. 212-2 ; un délai ferme, non',
    /R\.\u00a0212-2/.test(D.avertissementDelai('Délai INDICATIF de 3 semaines') || '')
    && D.avertissementDelai('Date indicative : mars') !== null
    && D.avertissementDelai('Sous 3 semaines') === null && D.avertissementDelai(null) === null);
  const pourquoi = D.DELAI_PAR_DEFAUT.pourquoi;
  verifier('le délai proposé dit POURQUOI, face à qui, et depuis quand : « particulier », « sans retard injustifié », '
    + '« conclusion du contrat » (L. 216-1)',
    D.DELAI_PAR_DEFAUT.texte === 'Dans les 30 jours suivant la signature du devis' && /particulier/.test(pourquoi)
    && /sans retard injustifié/.test(pourquoi) && /conclusion du contrat/.test(pourquoi) && /L\.\u00a0216-1/.test(pourquoi),
    pourquoi);
  /* LA DURÉE JAMAIS SANS SA RÉSERVE : toute phrase du module qui dit « un
     an » dit aussi « opposition » (loi n° 71-584, art. 2). On relit toutes
     les chaînes de `devis.js`, et toutes ses constantes exportées. */
  const chaines = [...sansCommentairesJs(lire('src/lib/devis.js')).matchAll(/'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)]
    .map((m) => m[1] ?? m[2]);
  const concat = sansCommentairesJs(lire('src/lib/devis.js')).replace(/'\s*\+\s*'/g, '');
  const phrasesAn = [...concat.matchAll(/'([^']*\bun an\b[^']*)'/g)].map((m) => m[1]);
  const exportees = Object.values(D).flatMap((v) => (typeof v === 'string' ? [v] : (v && typeof v === 'object' ? Object.values(v) : [])))
    .filter((v) => typeof v === 'string');
  const sansReserve = [...phrasesAn, ...exportees].filter((s) => /\bun an\b/.test(s) && !/opposition/.test(s));
  verifier('toute phrase du module qui dit « un an » dit aussi « opposition » — jamais la durée sans sa réserve',
    chaines.length > 30 && sansReserve.length === 0 && /\bun an\b/.test(D.PHRASE_RETENUE), sansReserve.join(' | '));
  verifier('`PHRASE_RETENUE` : au plus 5 %, le consignataire, la caution d’une « société de caution mutuelle » — pas une '
    + 'caution « bancaire » seule', /5\u00a0%/.test(D.PHRASE_RETENUE) && /consignataire/.test(D.PHRASE_RETENUE)
    && /société de caution mutuelle/.test(D.PHRASE_RETENUE) && /établissement financier habilité/.test(D.PHRASE_RETENUE)
    && !/bancaire/.test(D.PHRASE_RETENUE) && /lettre recommandée/.test(D.PHRASE_RETENUE));
  verifier('`MENTION_FRANCHISE` est exactement « TVA non applicable, article 293 B du CGI »',
    D.MENTION_FRANCHISE === 'TVA non applicable, article 293 B du CGI');
}

console.log('\n  6. `validerLigne` nomme la MÊME contrainte que la base');
{
  const refusLigne = (CAS.cas || []).filter((c) => /^REFUS:devis_ligne_/.test(c.attendu || ''));
  const faux = refusLigne.map((c) => {
    const j = jouerCas(c);
    const dernier = j.journal[j.journal.length - 1] || {};
    return dernier.refusPar === 'validerLigne' && `REFUS:${dernier.contrainte}` === c.attendu ? null : `${c.id} : ${j.resultat}`;
  }).filter(Boolean);
  verifier(`pour chacun des ${refusLigne.length} refus d’une ligne du jeu commun, \`validerLigne\` nomme exactement la contrainte attendue`,
    refusLigne.length >= 18 && faux.length === 0, faux.join(' ; '));
  /* Deux fautes à la fois : la base nomme la première par ORDRE ALPHABÉTIQUE. */
  const L = (plus) => ({ type: 'poste', designation: 'x', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 1000, tauxTvaCentiemes: 1000, ...plus });
  const doubles = [
    [L({ quantiteMilliemes: 0, prixUnitaireCentimes: 0 }), 'devis_ligne_offert_check'],
    [L({ prixUnitaireCentimes: -1, tauxTvaCentiemes: 1960 }), 'devis_ligne_prix_check'],
    [L({ designation: '  ', unite: 'ml' }), 'devis_ligne_designation_check'],
    [L({ type: 'remise', unite: 'ml' }), 'devis_ligne_type_check'],
    [L({ quantiteMilliemes: 99999999, prixUnitaireCentimes: 9999999999, unite: 'ml' }), 'devis_ligne_total_check'],
  ];
  const fauxD = doubles.filter(([l, c]) => D.validerLigne(l).contrainte !== c).map(([l, c]) => `${json(l)} → ${D.validerLigne(l).contrainte}, attendu ${c}`);
  verifier('deux fautes à la fois : la première dans l’ordre ALPHABÉTIQUE, comme PostgreSQL', fauxD.length === 0, fauxD.join(' ; '));
  verifier('…un prix NÉGATIF est nommé `devis_ligne_prix_check` (« un prix ne peut pas être négatif »), jamais '
    + '`devis_ligne_offert_check` (« un prix de 0 s’écrit avec Offert »)',
    D.validerLigne(L({ prixUnitaireCentimes: -1 })).contrainte === 'devis_ligne_prix_check'
    && D.validerLigne(L({ prixUnitaireCentimes: -1, offert: true })).contrainte === 'devis_ligne_prix_check'
    && D.validerLigne(L({ prixUnitaireCentimes: 0 })).contrainte === 'devis_ligne_offert_check');
  const devis = [
    [{ retenueGarantieCentiemes: 501 }, 'devis_retenue_check'], [{ retenueGarantieCentiemes: 0 }, 'devis_retenue_check'],
    [{ source: 'qr' }, 'devis_source_check'], [{ statut: 'remis' }, 'devis_statut_check'],
    [{ lieuCodePostal: '1341' }, 'devis_lieu_code_postal_check'], [{ objet: 'x'.repeat(1001) }, 'devis_objet_check'],
    [{ lieuCodePostal: ' 13 410 ', retenueGarantieCentiemes: 500, objet: '\u200b' }, null],
  ];
  const fauxV = devis.filter(([d, c]) => D.validerDevis(d).contrainte !== c).map(([d, c]) => `${json(d)} → ${D.validerDevis(d).contrainte}, attendu ${c}`);
  verifier('`validerDevis` : la retenue (1 à 500), la source, le statut, le code postal, la longueur — et le nettoyage d’abord',
    fauxV.length === 0 && D.nettoyerDevis({ lieuCodePostal: ' 13 410 ' }).lieuCodePostal === '13410'
    && D.nettoyerDevis({ objet: '  \n ' }).objet === null && D.nettoyerDevis({ delaiExecution: '\u00a0' }).delaiExecution === null,
    fauxV.join(' ; '));
  /* LES ESPACES D'UN CODE POSTAL : une classe EXPLICITE, la m\u00eame des deux
     c\u00f4t\u00e9s \u2014 jamais `\s`, dont le sens d\u00e9pend de la locale du serveur
     (PostgreSQL 16 retire U+2002 et garde U+00A0 ; mesur\u00e9, relecture 0-2,
     P10). On v\u00e9rifie la classe ET ce que le nettoyage en fait, caract\u00e8re par
     caract\u00e8re : retir\u00e9 si et seulement s'il est dans la classe. */
  const CLASSE = ' \t\n\v\f\r\u00a0\u202f';
  const essais = [0x20, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0xa0, 0x202f, 0x2002, 0x3000, 0x2028, 0x1680, 0x205f, 0x200b, 0xfeff, 0x85];
  const ecarts = essais.filter((c) => {
    const ch = String.fromCharCode(c);
    const retire = D.nettoyerDevis({ lieuCodePostal: `13${ch}410` }).lieuCodePostal === '13410';
    return retire !== CLASSE.includes(ch);
  }).map((c) => `U+${c.toString(16)}`);
  /* \u00ab 0 \u00bb TAP\u00c9 DANS LA RETENUE : `versCentiemes('0')` rend 0 (c'est bien
     un pourcentage), et la base le refuse (`devis_retenue_check`, de 0,01 % \u00e0
     5 %). La phrase de ce refus na\u00eet au lot 4 (`erreurs.js`) : si elle ne
     disait que \u00ab au plus 5 % \u00bb, elle serait FAUSSE pour un 0 (relecture 0-2,
     mineur 9). Ce contr\u00f4le la tient d\u00e8s qu'elle existe. */
  const phraseRetenue = (ERR.MESSAGES_CONTRAINTE || {}).devis_retenue_check || null;
  verifier('\u00ab 0 \u00bb est refus\u00e9 comme \u00ab 6 % \u00bb (`devis_retenue_check`) \u2014 et sa phrase, quand le lot 4 l\u2019\u00e9crira, dira les DEUX '
    + 'bornes (0,01 % et 5 %) et \u00ab laissez vide \u00bb pour une retenue absente',
  D.versCentiemes('0').centiemes === 0 && D.validerDevis({ retenueGarantieCentiemes: 0 }).contrainte === 'devis_retenue_check'
    && (phraseRetenue === null || (/0,01/.test(phraseRetenue) && /5\u00a0?%/.test(phraseRetenue) && /vide/i.test(phraseRetenue))),
  phraseRetenue || '(pas encore \u00e9crite : lot 4)');
  verifier('`ESPACES_CODE_POSTAL` : les espaces ASCII, U+00A0 et U+202F, et RIEN d\u2019autre \u2014 retir\u00e9s si et seulement s\u2019ils sont '
    + 'dans la classe (\u00ab 13 410 \u00bb en U+2002 est refus\u00e9, comme la base le refusera)',
    D.ESPACES_CODE_POSTAL === CLASSE && ecarts.length === 0
    && D.validerDevis({ lieuCodePostal: '13\u2002410' }).contrainte === 'devis_lieu_code_postal_check',
    `classe ${json(D.ESPACES_CODE_POSTAL)} ; \u00e9carts ${ecarts.join(', ') || '\u2014'}`);
}

console.log('\n  8. une seule écriture des montants');
{
  verifier('`emetteur.js` réexporte la MÊME fonction que `centimes.js` — pas une copie',
    E.versCentimes === C.versCentimes && E.centimesLisibles === C.centimesLisibles && typeof C.versCentimes === 'function');
  verifier('`montantDevis` est `centimesLisibles` sous un second nom', D.montantDevis === C.centimesLisibles);
  /* LE LECTEUR LUI-MÊME, éprouvé : un `//` de fin de ligne part, une adresse
     dans une chaîne reste, une expression régulière qui contient `//` ou une
     apostrophe n'ouvre ni commentaire ni chaîne ; et ce qu'il rend des
     fichiers du calcul reste du JavaScript que `node` sait lire. */
  {
    const essai = "const u = 'https://exemple.fr'; // 10 €\nconst r = /\\/\\//g; /* x */ const g = `a ${1 // c\n} b`;"
      + " const d = 6 / 2; // fin\nconst q = /'/; const k = \"'\"; // \"\nreturn /x/.test(k);";
    const lu = sansCommentairesJs(essai);
    const dossier = mkdtempSync(path.join(os.tmpdir(), 'verifier-devis-'));
    const illisibles = ['src/lib/devis.js', 'src/lib/centimes.js', 'src/lib/file-ecriture.js', 'src/lib/identifiant.js', 'src/lib/entreprise.js']
      .filter((f) => {
        const p = path.join(dossier, `${path.basename(f, '.js')}.mjs`);
        writeFileSync(p, sansCommentairesJs(lire(f)));
        return spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' }).status !== 0;
      });
    rmSync(dossier, { recursive: true, force: true });
    verifier('le lecteur des contrôles retire les commentaires de FIN de ligne, garde les chaînes et les expressions régulières, '
      + 'et rend du JavaScript lisible', !/10 €|\/\/ c|fin|\/\* x/.test(lu) && lu.includes("'https://exemple.fr'")
      && lu.includes('/\\/\\//g') && lu.includes("/'/") && lu.includes('6 / 2') && lu.includes('return /x/') && illisibles.length === 0,
    `${json(lu)} ; illisibles : ${illisibles.join(', ') || '—'}`);
  }
  const srcDevis = sansCommentairesJs(lire('src/lib/devis.js'));
  const imps = importsDe(srcDevis);
  verifier('`devis.js` importe EXACTEMENT `./centimes.js` (`centimesLisibles`) et `./entreprise.js` (`dateFrancaise`, `isoLisible`) — '
    + 'deux instructions, aucune autre forme (ni import nu, ni réexportation, ni `import()`)',
    imps.length === 2 && json(imps.find((x) => x.de === './centimes.js')) === json({ de: './centimes.js', noms: ['centimesLisibles'] })
    && json(imps.find((x) => x.de === './entreprise.js')) === json({ de: './entreprise.js', noms: ['dateFrancaise', 'isoLisible'] })
    && json(modulesDe(srcDevis).sort()) === json(['./centimes.js', './entreprise.js']) && instructionsDImport(srcDevis) === 2
    && !/\brequire\s*\(|\bimport\s*\(/.test(srcDevis), `${json(imps)} ; modules ${json(modulesDe(srcDevis))} ; `
    + `${instructionsDImport(srcDevis)} instruction(s)`);
  const purs = ['src/lib/centimes.js', 'src/lib/file-ecriture.js', 'src/lib/identifiant.js']
    .filter((f) => chargeQuelqueChose(sansCommentairesJs(lire(f))));
  verifier('`centimes.js`, `file-ecriture.js` et `identifiant.js` n’importent RIEN — sous aucune forme, import nu compris',
    purs.length === 0, purs.join(', '));
  /* `entreprise.js` n'importe que des fichiers purs : c'est ce qui permet à
     `devis.js` de l'importer sans charger React Native. */
  const entImps = importsDe(sansCommentairesJs(lire('src/lib/entreprise.js'))).map((x) => x.de).sort();
  verifier('…et `entreprise.js` n’importe que `siret.js` et deux fichiers de données',
    json(entImps) === json(['../data/ape-metiers.js', '../data/formes-juridiques.js', './siret.js'].sort()), json(entImps));
  /* Écrire un montant, c'est poser « € » : `devis.js` ne l'écrit jamais
     lui-même, il passe par `centimesLisibles`. */
  verifier('`devis.js` n’écrit jamais « € » lui-même : un montant ne s’écrit qu’à UN endroit', !/€/.test(srcDevis));
}

console.log('\n  9. les dates, dans trois fuseaux, des deux côtés de minuit');
{
  const FUSEAUX = ['Europe/Paris', 'America/Martinique', 'Pacific/Kiritimati'];
  const resultats = FUSEAUX.map((tz) => {
    const r = spawnSync(process.execPath, [ICI, '--fuseau'], { encoding: 'utf8', env: { ...process.env, TZ: tz } });
    try { return JSON.parse(r.stdout); } catch (e) { return { tz, plante: `${r.stderr || r.stdout}`.slice(0, 400) }; }
  });
  for (const r of resultats) {
    verifier(`${r.tz} : \`depuisLisible\`, \`origineLisible\` et la date de la mémoire, à l’heure du téléphone (${r.cas || 0} cas)`,
      !r.plante && r.cas >= 2 && r.faux.length === 0, r.plante || (r.faux || []).join(' ; '));
  }
  /* Et c'est la date de `dateFrancaise()` — la même écriture des dates que
     tout Opus, pas une seconde. */
  const quand = ['2026-10-19T23:18:21.716617+00:00', '2026-09-02', '2026-10-19 23:18:21+00'];
  verifier('`origineLisible` et `depuisLisible` écrivent la date par `dateFrancaise()` (entreprise.js) — la même que partout',
    quand.every((q) => D.origineLisible({ source: 'urgence', sosRequestId: 's', urgence: { createdAt: q } })
      === `depuis une urgence du ${ENT.dateFrancaise(q)}`)
    && D.depuisLisible('2026-01-02T10:00:00Z', Date.parse('2026-10-21T10:00:00Z')) === ENT.dateFrancaise('2026-01-02T10:00:00Z'));
  const src = sansCommentairesJs(lire('src/lib/devis.js'));
  const parses = [...src.matchAll(/Date\.parse\(\s*(\w+)\s*\)/g)].map((m) => m[1]);
  verifier('aucun horodatage n’atteint `Date.parse` sans être passé par `isoLisible()` ; aucune date lue par ses dix premiers caractères',
    parses.length >= 2 && parses.every((v) => new RegExp(`const\\s+${v}\\s*=\\s*isoLisible\\(`).test(src))
    && !/\.(slice|substring|substr)\(\s*0\s*,\s*10\s*\)/.test(src) && !/new Date\(\s*['"`]/.test(src),
    json(parses));
}

console.log('\n  10. la file d’écriture — avec de fausses écritures, des délais, des réponses en retard');
/* Une promesse de la file qui PLANTE sans être rattrapée arrêterait la file
   en silence sur le téléphone (aucune écriture ne partirait plus) — et ici,
   elle arrêterait le contrôle avant qu'il ait tout dit. On la relève, et
   c'est un échec nommé. */
const plantagesDeLaFile = [];
process.on('unhandledRejection', (e) => { plantagesDeLaFile.push((e && e.stack) || String(e)); });
{
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  /* Une fausse base : des lignes en mémoire, un journal de ce qu'on lui a
     demandé, et des pannes qu'on lui commande. */
  function fausseBase() {
    const lignes = new Map();
    const devis = new Map();
    const journal = [];
    const commandes = [];   // [{ quand: (op) => bool, faire: 'pendre' | { code } | 'lent', ms }]
    const table = (quoi) => (quoi === 'devis' ? devis : lignes);
    return {
      lignes, devis, journal, commandes,
      async ecrire(op) {
        journal.push({ ...op, t: Date.now(), valeurs: op.valeurs ? { ...op.valeurs } : undefined });
        const i = commandes.findIndex((c) => !c.relire && c.quand(op));
        const cmd = i >= 0 ? commandes.splice(i, 1)[0] : null;
        if (cmd && cmd.avant) await pause(cmd.avant);
        /* Une requête ANNULÉE avant d'arriver au serveur n'y arrive jamais :
           c'est ce que fait `fetch`. `recu: true` dit le contraire — le
           serveur l'avait déjà reçue, l'annuler ne l'arrête plus. */
        if (cmd && cmd.avant && !cmd.recu && op.signal && op.signal.aborted) {
          throw Object.assign(new Error('annulée'), { name: 'AbortError' });
        }
        const t = table(op.quoi);
        if (cmd && cmd.erreur) throw cmd.erreur;
        if (op.action === 'inserer') {
          if (t.has(op.id)) throw Object.assign(new Error(`duplicate key value violates unique constraint "${op.quoi === 'devis' ? 'devis' : 'devis_lignes'}_pkey"`), { code: '23505' });
          t.set(op.id, { ...op.valeurs });
        } else if (op.action === 'modifier') {
          if (t.has(op.id)) t.set(op.id, { ...t.get(op.id), ...op.valeurs });
        } else if (op.action === 'supprimer') {
          t.delete(op.id);
          if (op.quoi === 'devis') [...lignes.keys()].forEach((k) => { if (lignes.get(k).devisId === op.id) lignes.delete(k); });
        } else {
          throw new Error(`action inconnue : ${op.action}`);
        }
        if (cmd && cmd.pendre) await new Promise(() => {});
        if (cmd && cmd.apres) await pause(cmd.apres);
        return null;
      },
      async relireUn({ quoi, id }) {
        const i = commandes.findIndex((c) => c.relire && c.quand({ quoi, id }));
        const cmd = i >= 0 ? commandes.splice(i, 1)[0] : null;
        if (cmd && cmd.pendre) await new Promise(() => {});
        if (cmd && cmd.autre) return null;   // l'identifiant est pris par quelqu'un d'autre
        const r = table(quoi).get(id);
        return r ? { ...r } : null;
      },
    };
  }
  const ligne = (id, plus = {}) => ({ id, ordre: 1000, type: 'poste', designation: 'Chape', quantiteMilliemes: 1000, unite: 'm2',
    prixUnitaireCentimes: 4500, tauxTvaCentiemes: 1000, offert: false, ...plus });
  /* Tous les états que la file annonce, sur toutes les files du contrôle :
     l'écran n'en connaît que quatre (`ETATS`). */
  const etatsAnnonces = new Set();
  const fabriquer = (base, plus = {}) => {
    const f = F.creerFileEcriture({
      devisId: 'D1', devis: { source: 'manuelle' }, ecrire: base.ecrire, relireUn: base.relireUn,
      avecDelai: ERR.avecDelai, delaiMs: 40, nouvelIdentifiant: () => null, ...plus,
    });
    f.abonner((e) => { if (e.type === 'etat') etatsAnnonces.add(e.etat); });
    return f;
  };
  const resume = (b) => b.journal.map((o) => `${o.action} ${o.quoi}${o.quoi === 'ligne' ? ` ${o.id}` : ''}`);

  verifier('la file refuse de naître sans délai (`avecDelai`) : une requête qui ne revient jamais n’atteindrait jamais le `catch`',
    (() => { try { F.creerFileEcriture({ devisId: 'D', ecrire: () => null, relireUn: () => null }); return false; } catch (e) { return /avecDelai/.test(e.message); } })());

  /* a. un devis neuf, deux lignes envoyées ensemble : devis, ligne, ligne. */
  {
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 5 });
    const f = fabriquer(b);
    f.ligne(ligne('L1'));
    f.ligne(ligne('L2', { ordre: 2000 }));
    const pendant = f.enAttente();
    await f.attendre(500);
    verifier('un devis neuf et deux lignes envoyés ensemble → dans l’ordre : le devis, la ligne, la ligne ; `enAttente()` 2 puis 0',
      json(resume(b)) === json(['inserer devis', 'inserer ligne L1', 'inserer ligne L2']) && pendant === 2 && f.enAttente() === 0
      && f.etatDe('L1') === 'enregistree' && f.etatDe('L2') === 'enregistree', `${json(resume(b))} ; en attente ${pendant} → ${f.enAttente()}`);
  }
  /* b. deux enregistrements rapprochés d'une ligne NEUVE : une insertion, puis une modification. */
  {
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.quoi === 'ligne' && op.action === 'inserer', avant: 10 });
    const f = fabriquer(b, { devisEnBase: true });
    f.ligne(ligne('L1'));
    await pause(2);
    f.ligne(ligne('L1', { tauxTvaCentiemes: 2000 }));
    f.ligne(ligne('L1', { tauxTvaCentiemes: 2000, prixUnitaireCentimes: 5200 }));
    await f.attendre(500);
    const modifs = b.journal.filter((o) => o.action === 'modifier');
    verifier('deux enregistrements rapprochés d’une ligne neuve → UNE insertion, puis UNE modification (la dernière valeur)',
      json(resume(b)) === json(['inserer ligne L1', 'modifier ligne L1']) && b.lignes.size === 1
      && json(modifs[0] && modifs[0].valeurs) === json({ prixUnitaireCentimes: 5200, tauxTvaCentiemes: 2000 })
      && b.lignes.get('L1').prixUnitaireCentimes === 5200, `${json(resume(b))} ${json(modifs.map((m) => m.valeurs))}`);
  }
  /* c. une insertion pas encore partie ABSORBE ce qui la suit. */
  {
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 10 });
    const f = fabriquer(b);
    f.ligne(ligne('L1'));
    f.ligne(ligne('L1', { tauxTvaCentiemes: 550 }));
    f.modifierLigne('L1', { prixUnitaireCentimes: 3800 });
    await f.attendre(500);
    verifier('une insertion pas encore partie absorbe les modifications qui la suivent → une seule requête pour la ligne',
      json(resume(b)) === json(['inserer devis', 'inserer ligne L1']) && b.lignes.get('L1').tauxTvaCentiemes === 550
      && b.lignes.get('L1').prixUnitaireCentimes === 3800, json(resume(b)));
  }
  /* d. deux modifications en attente d'une même ligne : une seule part, la dernière valeur. */
  {
    const b = fausseBase();
    const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('X'), ligne('L1', { ordre: 2000 })] });
    b.commandes.push({ quand: (op) => op.id === 'X', avant: 15 });
    f.modifierLigne('X', { designation: 'Chape lente' });
    await pause(2);
    f.modifierLigne('L1', { prixUnitaireCentimes: 1 });
    f.modifierLigne('L1', { prixUnitaireCentimes: 2 });
    const pendant = f.enAttente();
    await f.attendre(500);
    const l1 = b.journal.filter((o) => o.id === 'L1');
    verifier('deux modifications d’une même ligne en attente → UNE seule part, avec la dernière valeur ; `enAttente()` juste',
      l1.length === 1 && json(l1[0].valeurs) === json({ prixUnitaireCentimes: 2 }) && pendant === 2 && f.enAttente() === 0,
      `${json(l1)} ; en attente ${pendant}`);
  }
  /* e. une réponse en retard n'est pas affichée : la génération. */
  {
    const b = fausseBase();
    const totaux = [];
    let lectures = 0;
    const f = fabriquer(b, {
      devisEnBase: true,
      relireTotaux: async () => { lectures += 1; const n = lectures; await pause(n === 1 ? 25 : 1); return { lecture: n }; },
    });
    f.abonner((e) => { if (e.type === 'totaux') totaux.push(e.totaux.lecture); });
    f.ligne(ligne('L1'));
    await pause(8);
    f.ligne(ligne('L2', { ordre: 2000 }));
    await f.attendre(500);
    await pause(30);
    verifier('une relecture partie AVANT une autre écriture n’est jamais affichée — seule la dernière l’est (la génération)',
      lectures === 2 && json(totaux) === json([2]), `lectures ${lectures}, affichées ${json(totaux)}`);
  }
  /* f. un délai dépassé, puis la MÊME insertion renvoyée → 23505 → relue, enregistrée, sans doublon ni message. */
  {
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.quoi === 'ligne' && op.action === 'inserer', pendre: true });
    const f = fabriquer(b, { devisEnBase: true });
    f.ligne(ligne('L1'));
    await f.attendre(200);
    const apresDelai = { etat: f.etatDe('L1'), attente: f.enAttente(), erreur: f.erreurDe('L1') && f.erreurDe('L1').name };
    f.reessayer('L1');
    await f.attendre(500);
    verifier('un délai dépassé : la ligne est « echec », comptée en attente — elle n’a pas l’air enregistrée',
      apresDelai.etat === 'echec' && apresDelai.attente === 1 && apresDelai.erreur === 'AbortError', json(apresDelai));
    verifier('…renvoyée, la MÊME insertion rend 23505 : relue, « enregistrée », aucun doublon, aucun message, aucune modification inutile',
      f.etatDe('L1') === 'enregistree' && f.erreurDe('L1') === null && b.lignes.size === 1 && f.enAttente() === 0
      && json(resume(b)) === json(['inserer ligne L1', 'inserer ligne L1']), `${f.etatDe('L1')} ${json(resume(b))}`);
  }
  /* g. …et si la base avait une version plus ANCIENNE, la différence repart en modification. */
  {
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.quoi === 'ligne' && op.action === 'inserer', pendre: true });
    const f = fabriquer(b, { devisEnBase: true });
    f.ligne(ligne('L1'));
    await f.attendre(200);
    f.ligne(ligne('L1', { prixUnitaireCentimes: 6000 }));
    await f.attendre(500);
    verifier('…après un délai dépassé, une ligne changée repart en INSERTION (jamais une modification d’une ligne peut-être '
      + 'absente), puis la différence en modification',
      json(resume(b)) === json(['inserer ligne L1', 'inserer ligne L1', 'modifier ligne L1'])
      && b.lignes.get('L1').prixUnitaireCentimes === 6000 && f.etatDe('L1') === 'enregistree', json(resume(b)));
  }
  /* h. un interblocage (40P01) : une reprise, puis « echec ». */
  {
    const b = fausseBase();
    const interblocage = () => Object.assign(new Error('deadlock detected'), { code: '40P01' });
    b.commandes.push({ quand: (op) => op.id === 'L1', erreur: interblocage() });
    b.commandes.push({ quand: (op) => op.id === 'L2', erreur: interblocage() }, { quand: (op) => op.id === 'L2', erreur: interblocage() });
    const f = fabriquer(b, { devisEnBase: true });
    f.ligne(ligne('L1'));
    f.ligne(ligne('L2', { ordre: 2000 }));
    await f.attendre(500);
    const essaisL2 = b.journal.filter((o) => o.id === 'L2').length;
    verifier('un 40P01 se retente UNE fois : réussi au second essai → enregistrée ; deux 40P01 → « echec », sans troisième essai',
      f.etatDe('L1') === 'enregistree' && b.journal.filter((o) => o.id === 'L1').length === 2
      && f.etatDe('L2') === 'echec' && essaisL2 === 2 && f.erreurDe('L2').code === '40P01' && f.enAttente() === 1,
      `${json(resume(b))} ; L2 ${f.etatDe('L2')}`);
  }
  /* i. le devis n'a pas pu être créé : ses lignes ne partent pas, et « Réessayer » repart du devis. */
  {
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: Object.assign(new Error('refus'), { code: '42501' }) });
    const f = fabriquer(b);
    f.ligne(ligne('L1'));
    await f.attendre(300);
    const avant = [f.etatDe('devis'), f.etatDe('L1'), resume(b).length];
    f.reessayer();
    await f.attendre(300);
    verifier('un devis qui n’a pas pu être créé retient ses lignes (« echec », sans requête) ; « Réessayer » repart du devis',
      json(avant) === json(['echec', 'echec', 1]) && json(resume(b)) === json(['inserer devis', 'inserer devis', 'inserer ligne L1'])
      && f.etatDe('L1') === 'enregistree', `${json(avant)} ${json(resume(b))}`);
  }
  /* j. ce qui n'est jamais parti : « locale », retirée sans requête. */
  {
    const b = fausseBase();
    const f = fabriquer(b, { devisEnBase: true });
    f.marquerLocale('L9', ligne('L9', { prixUnitaireCentimes: 0 }));
    const locale = [f.etatDe('L9'), f.enAttente()];
    f.retirerLigne('L9');
    await f.attendre(200);
    verifier('une ligne refusée avant l’envoi est « locale » et comptée ; retirée, elle part SANS requête, et sans créer de devis',
      json(locale) === json(['locale', 1]) && b.journal.length === 0 && f.enAttente() === 0 && f.etatDe('L9') === null,
      `${json(locale)} ${json(resume(b))}`);
  }
  /* k. JAMAIS d'upsert : l'insertion porte la ligne ENTIÈRE, la modification seulement ce qui change. */
  {
    const b = fausseBase();
    const f = fabriquer(b);
    f.ligne(ligne('L1'));
    await f.attendre(300);
    f.ligne(ligne('L1', { designation: 'Chape fluide' }));
    f.retirerLigne('L1');
    await f.attendre(300);
    const actions = [...new Set(b.journal.map((o) => o.action))].sort();
    const insertion = b.journal.find((o) => o.quoi === 'ligne' && o.action === 'inserer');
    const modification = b.journal.find((o) => o.action === 'modifier');
    const src = sansCommentairesJs(lire('src/lib/file-ecriture.js'));
    verifier('jamais d’« upsert » : insérer la ligne ENTIÈRE (identifiant, ordre, type compris), modifier SEULEMENT ce qui change, supprimer',
      json(actions) === json(['inserer', 'modifier', 'supprimer']) && insertion
      && ['id', 'ordre', 'type', 'designation', 'devisId', 'quantiteMilliemes', 'prixUnitaireCentimes', 'tauxTvaCentiemes'].every((k) => k in insertion.valeurs)
      && json(modification && modification.valeurs) === json({ designation: 'Chape fluide' })
      && !/upsert/i.test(src) && b.lignes.size === 0,
      `${json(actions)} ${json(resume(b))}`);
  }
  /* l. chaque écriture passe par le délai. */
  {
    const src = sansCommentairesJs(lire('src/lib/file-ecriture.js'));
    const appels = [...src.matchAll(/\b(ecrire|relireUn|relireTotaux)\(/g)].length;
    const enveloppes = [...src.matchAll(/delai\(Promise\.resolve\(\)\.then\(\(\) => (ecrire|relireUn|relireTotaux)\(/g)].length;
    verifier('chaque écriture et chaque relecture de la file passent par `avecDelai`', appels >= 4 && appels === enveloppes,
      `${enveloppes} enveloppées sur ${appels}`);
  }
  /* ---- ce que la relecture des étapes 0-2 (21/10/2026) a trouvé, chemin par chemin ---- */
  /* Un cas qui PLANTE (une fonction de la file qui n'existe plus, par
     exemple) est un ÉCHEC nommé, pas une sortie du contrôle : les cas
     suivants doivent encore tourner, et dire ce qu'ils voient. */
  const essayerCas = async (fn) => {
    try { await fn(); } catch (e) { verifier('un cas de la file tourne sans planter', false, e && e.stack); }
  };
  const reseau = () => Object.assign(new Error('Network request failed'), { code: '' });
  /* m. LES TOTAUX SE RELISENT QUAND LA FILE DEVIENT INACTIVE, quelle que soit
     l'issue de la dernière opération (P2). */
  await essayerCas(async () => {
    const b = fausseBase();
    let lectures = 0;
    const totaux = [];
    b.commandes.push({ quand: (op) => op.id === 'A', avant: 5 });
    b.commandes.push({ quand: (op) => op.id === 'B', erreur: Object.assign(new Error('new row violates check constraint "devis_plafond_check"'), { code: '23514' }) });
    const f = fabriquer(b, { devisEnBase: true, relireTotaux: async () => { lectures += 1; return { n: lectures }; } });
    f.abonner((e) => { if (e.type === 'totaux') totaux.push(e.totaux.n); });
    f.ligne(ligne('A'));
    f.ligne(ligne('B', { ordre: 2000 }));
    await f.attendre(500);
    const b2 = fausseBase();
    let lectures2 = 0;
    b2.commandes.push({ quand: (op) => op.id === 'A', avant: 5 });
    const f2 = fabriquer(b2, { devisEnBase: true, lignesEnBase: [ligne('B', { ordre: 2000, devisId: 'D1' })], relireTotaux: async () => { lectures2 += 1; return {}; } });
    f2.ligne(ligne('A'));
    f2.ligne(ligne('B', { ordre: 2000 }));   // quittée sans rien changer : rien à envoyer
    await f2.attendre(500);
    verifier('une ligne enregistrée, puis la suivante REFUSÉE (ou sans rien à envoyer) : les totaux sont relus quand même — '
      + 'l’écran ne garde pas un total qui ignore la première',
    lectures === 1 && json(totaux) === json([1]) && f.etatDe('B') === 'echec' && lectures2 === 1
      && json(resume(b2)) === json(['inserer ligne A']), `${lectures}/${json(totaux)} ; ${lectures2} ${json(resume(b2))}`);
  });
  /* n. UN DÉLAI DÉPASSÉ ANNULE LA REQUÊTE : une modification lente ne
     repasse pas, plus tard, par-dessus la suivante (P5, S5). */
  await essayerCas(async () => {
    const b = fausseBase();
    b.lignes.set('A', { ...ligne('A'), devisId: 'D1' });
    b.commandes.push({ quand: (op) => op.id === 'A' && op.valeurs && op.valeurs.prixUnitaireCentimes === 5000, avant: 120 });
    const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('A')] });
    f.modifierLigne('A', { prixUnitaireCentimes: 5000 });
    await f.attendre(300);
    const premier = b.journal[0];
    f.modifierLigne('A', { prixUnitaireCentimes: 6000 });
    await f.attendre(300);
    await pause(150);
    verifier('un délai dépassé ANNULE la requête (son signal est levé) : la modification lente n’écrase pas la suivante',
      premier && premier.signal && premier.signal.aborted === true && b.lignes.get('A').prixUnitaireCentimes === 6000
      && f.etatDe('A') === 'enregistree', `annulée ${premier && premier.signal && premier.signal.aborted} ; prix ${b.lignes.get('A').prixUnitaireCentimes}`);
  });
  /* o. …et une modification dont on ignore l'issue rend ses colonnes
     INCONNUES : revenir à l'ancienne valeur repart (P5b). */
  await essayerCas(async () => {
    const b = fausseBase();
    b.lignes.set('A', { ...ligne('A'), devisId: 'D1' });
    b.commandes.push({ quand: (op) => op.id === 'A' && op.action === 'modifier', pendre: true });   // passée, réponse perdue
    const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('A')] });
    f.modifierLigne('A', { prixUnitaireCentimes: 5000 });
    await f.attendre(300);
    f.modifierLigne('A', { prixUnitaireCentimes: 4500 });
    await f.attendre(300);
    verifier('une modification sans réponse, puis le RETOUR à l’ancien prix : il repart (la base est peut-être au nouveau)',
      b.lignes.get('A').prixUnitaireCentimes === 4500 && json(resume(b)) === json(['modifier ligne A', 'modifier ligne A'])
      && f.etatDe('A') === 'enregistree', `${b.lignes.get('A').prixUnitaireCentimes} ${json(resume(b))}`);
  });
  /* p. une insertion annulée puis la ligne retirée : rien en base (S6) ; un
     23505 dont la relecture se perd, puis la ligne retirée : la suppression
     PART (S7). */
  await essayerCas(async () => {
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.id === 'A' && op.action === 'inserer', avant: 120 });
    const f = fabriquer(b, { devisEnBase: true });
    f.ligne(ligne('A'));
    await f.attendre(300);
    f.retirerLigne('A');
    await f.attendre(300);
    await pause(150);
    const b2 = fausseBase();
    b2.lignes.set('A', { ...ligne('A'), devisId: 'D1' });
    b2.commandes.push({ relire: true, quand: ({ id }) => id === 'A', pendre: true });
    const f2 = fabriquer(b2, { devisEnBase: true });
    f2.ligne(ligne('A'));
    await f2.attendre(300);
    const apres23505 = f2.etatDe('A');
    f2.retirerLigne('A');
    await f2.attendre(300);
    verifier('une insertion hors délai puis retirée : rien en base ; un 23505 dont la relecture se perd, puis retirée : la '
      + 'suppression part (un 23505 PROUVE que la ligne existe)', !b.lignes.has('A') && apres23505 === 'echec'
      && !b2.lignes.has('A') && json(resume(b2)) === json(['inserer ligne A', 'supprimer ligne A']) && f2.etatDe('A') === null,
    `${b.lignes.has('A')} ; ${apres23505} ${json(resume(b2))}`);
  });
  /* q. une SUPPRESSION de ligne refusée est comptée par `enAttente()` (P4) ;
     « Réessayer » la renvoie. */
  await essayerCas(async () => {
    const b = fausseBase();
    b.lignes.set('A', ligne('A'));
    b.commandes.push({ quand: (op) => op.action === 'supprimer', erreur: Object.assign(new Error('refus'), { code: '42501' }) });
    const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('A')] });
    f.retirerLigne('A');
    await f.attendre(300);
    const apres = [f.etatDe('A'), f.enAttente(), f.retiree('A')];
    f.reessayer('A');
    await f.attendre(300);
    verifier('une suppression refusée : la ligne est « echec », COMPTÉE en attente (elle est encore en base), dite retirée ; '
      + '« Réessayer » renvoie la suppression', json(apres) === json(['echec', 1, true]) && !b.lignes.has('A') && f.enAttente() === 0
      && json(resume(b)) === json(['supprimer ligne A', 'supprimer ligne A']), `${json(apres)} ${json(resume(b))}`);
  });
  /* r. SUPPRIMER LE BROUILLON ne perd rien quand la suppression échoue (P3). */
  await essayerCas(async () => {
    const b = fausseBase();
    b.devis.set('D1', { source: 'manuelle' });
    b.commandes.push({ quand: (op) => op.id === 'A', avant: 10 });
    b.commandes.push({ quand: (op) => op.quoi === 'devis' && op.action === 'supprimer', erreur: reseau() });
    const f = fabriquer(b, { devisEnBase: true });
    f.ligne(ligne('A'));
    f.ligne(ligne('B', { ordre: 2000 }));
    await pause(2);
    let erreur = null;
    try { await f.supprimerDevis(); } catch (e) { erreur = e; }
    const pendant = [f.etatDe('devis'), f.etatDe('B')];
    f.devis({ objet: 'Salle de bains' });
    await f.attendre(500);
    const suppressions = b.journal.filter((o) => o.quoi === 'devis' && o.action === 'supprimer').length;
    verifier('la suppression du brouillon ÉCHOUE : le devis reprend son état, la ligne qui attendait part ensuite, une retouche '
      + 'MODIFIE le devis (jamais une seconde suppression)', erreur && erreur.message === 'Network request failed'
      && json(pendant) === json(['enregistree', 'en_cours']) && suppressions === 1 && b.devis.has('D1')
      && b.lignes.has('B') && b.devis.get('D1').objet === 'Salle de bains' && f.enAttente() === 0,
    `${json(pendant)} ${json(resume(b))}`);
  });
  /* s. …elle RÉUSSIT : la file oublie tout, et plus rien ne s'y écrit. */
  await essayerCas(async () => {
    const b = fausseBase();
    b.devis.set('D1', { source: 'manuelle' });
    b.lignes.set('A', { ...ligne('A'), devisId: 'D1' });
    const evenements = [];
    const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('A')] });
    f.abonner((e) => { if (e.type === 'supprimee') evenements.push(e.cle); });
    await f.supprimerDevis();
    let refus = null;
    try { f.devis({ objet: 'x' }); } catch (e) { refus = e.message; }
    let refusLigne = null;
    try { f.ligne(ligne('B')); } catch (e) { refusLigne = e.message; }
    await f.attendre(200);
    verifier('la suppression RÉUSSIT : une requête, la file oublie le devis (`etatDe` → null, l’événement `supprimee`), et une '
      + 'retouche est REFUSÉE — elle ne recrée ni ne resupprime rien', json(resume(b)) === json(['supprimer devis'])
      && !b.devis.has('D1') && f.etatDe('devis') === null && json(evenements) === json(['devis']) && /supprimé/.test(refus || '')
      && /supprimé/.test(refusLigne || '') && f.devisEnBase() === false, `${json(resume(b))} ${refus}`);
  });
  /* t. …et elle attend la FIN de la requête en vol, si longue soit-elle :
     elle ne s'écrit jamais par-dessus (P3, l'attente de 16 s pouvait
     expirer avant). Ici : un interblocage, sa reprise, un 23505, une
     relecture qui ne revient pas — trois délais. */
  await essayerCas(async () => {
    const b = fausseBase();
    b.devis.set('D1', { source: 'manuelle' });
    b.lignes.set('A', { ...ligne('A'), devisId: 'D1' });
    b.commandes.push({ quand: (op) => op.id === 'A', avant: 35, erreur: Object.assign(new Error('deadlock detected'), { code: '40P01' }) });
    b.commandes.push({ quand: (op) => op.id === 'A', avant: 35, recu: true });
    b.commandes.push({ relire: true, quand: ({ id }) => id === 'A', pendre: true });
    let finDuVol = null;
    const f = fabriquer(b, { devisEnBase: true });
    f.abonner((e) => { if (e.type === 'etat' && e.cle === 'A' && e.etat === 'echec') finDuVol = Date.now(); });
    f.ligne(ligne('A'));
    await pause(5);
    await f.supprimerDevis();
    const suppr = b.journal.find((o) => o.quoi === 'devis' && o.action === 'supprimer');
    verifier('la suppression du brouillon attend la fin de la requête en vol (ici ~110 ms, plus que deux délais) — jamais par-dessus',
      finDuVol !== null && suppr && suppr.t >= finDuVol && !b.devis.has('D1'),
      `fin du vol ${finDuVol}, DELETE ${suppr && suppr.t}`);
  });
  /* u. une ligne REMISE pendant que sa suppression part : elle est réinsérée
     (S4) ; une ligne qui attendait le devis repart toute seule quand il est
     créé (S8) ; une ligne devenue « locale » pendant un vol : rien de plus
     ne part (M4). */
  await essayerCas(async () => {
    const b = fausseBase();
    b.lignes.set('A', { ...ligne('A'), devisId: 'D1' });
    b.commandes.push({ quand: (op) => op.id === 'A' && op.action === 'supprimer', avant: 10 });
    const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('A')] });
    f.retirerLigne('A');
    await pause(2);
    f.ligne(ligne('A', { designation: 'Chape remise' }));
    await f.attendre(500);
    const b2 = fausseBase();
    b2.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: Object.assign(new Error('violates check constraint "devis_lieu_code_postal_check"'), { code: '23514' }) });
    const f2 = fabriquer(b2);
    f2.ligne(ligne('A'));
    await f2.attendre(300);
    f2.devis({ lieuCodePostal: '13410' });
    await f2.attendre(300);
    const b3 = fausseBase();
    b3.lignes.set('L1', { ...ligne('L1') });
    b3.commandes.push({ quand: (op) => op.id === 'L1' && op.valeurs && op.valeurs.prixUnitaireCentimes === 1, avant: 20 });
    const f3 = F.creerFileEcriture({ devisId: 'D', devisEnBase: true, lignesEnBase: [ligne('L1')], ecrire: b3.ecrire,
      relireUn: b3.relireUn, avecDelai: ERR.avecDelai, delaiMs: 500 });
    f3.modifierLigne('L1', { prixUnitaireCentimes: 1 });
    await pause(2);
    f3.modifierLigne('L1', { prixUnitaireCentimes: 2 });
    f3.marquerLocale('L1');
    await f3.attendre(1000);
    verifier('remise pendant sa suppression → réinsérée ; une ligne qui attendait le devis repart quand il est créé, sans '
      + '« Réessayer » ; devenue « locale » pendant un vol → plus rien ne part',
    b.lignes.has('A') && b.lignes.get('A').designation === 'Chape remise' && f.etatDe('A') === 'enregistree'
      && json(resume(b2)) === json(['inserer devis', 'inserer devis', 'inserer ligne A']) && f2.etatDe('A') === 'enregistree'
      && b3.journal.length === 1 && f3.etatDe('L1') === 'locale' && b3.lignes.get('L1').prixUnitaireCentimes === 1,
    `${json(resume(b))} ; ${json(resume(b2))} ${f2.etatDe('A')} ; ${b3.journal.length} ${f3.etatDe('L1')}`);
  });
  /* v. une relecture des totaux qui ne revient JAMAIS : le délai la coupe,
     l'écran apprend que les totaux sont illisibles, et la file se vide
     (M6) ; un identifiant pris AILLEURS : sans générateur, « echec » et
     compté ; avec, la ligne change d'identifiant et s'enregistre (e). */
  await essayerCas(async () => {
    const b = fausseBase();
    const evenements = [];
    const f = fabriquer(b, { devisEnBase: true, relireTotaux: () => new Promise(() => {}) });
    f.abonner((e) => evenements.push(e.type));
    f.ligne(ligne('A'));
    const fini = await f.attendre(400);
    const b2 = fausseBase();
    b2.lignes.set('A', { ...ligne('A'), devisId: 'AUTRE' });
    b2.commandes.push({ relire: true, quand: ({ id }) => id === 'A', autre: true });
    const f2 = fabriquer(b2, { devisEnBase: true });
    f2.ligne(ligne('A'));
    await f2.attendre(300);
    const b3 = fausseBase();
    b3.lignes.set('A', { ...ligne('A'), devisId: 'AUTRE' });
    b3.commandes.push({ relire: true, quand: ({ id }) => id === 'A', autre: true });
    const renommes = [];
    const NOUVEAU = 'a0000000-0000-4000-8000-000000000001';
    const f3 = fabriquer(b3, { devisEnBase: true, nouvelIdentifiant: () => NOUVEAU });
    f3.abonner((e) => { if (e.type === 'renomme') renommes.push(e); });
    f3.ligne(ligne('A'));
    await f3.attendre(300);
    verifier('une relecture des totaux qui ne revient jamais : coupée, « totaux illisibles », la file se vide ; un identifiant '
      + 'pris ailleurs : « echec » sans générateur, renommé et enregistré avec',
    fini === true && f.vide() && evenements.includes('totaux_illisibles') && !evenements.includes('totaux')
      && f2.etatDe('A') === 'echec' && f2.enAttente() === 1 && renommes.length === 1 && renommes[0].nouveau === NOUVEAU
      && f3.etatDe(NOUVEAU) === 'enregistree' && b3.lignes.get(NOUVEAU).devisId === 'D1' && b3.lignes.get('A').devisId === 'AUTRE',
    `${fini} ${json([...new Set(evenements)])} ; ${f2.etatDe('A')} ; ${json(renommes)}`);
  });
  /* w. la file n'annonce que les quatre états que l'écran connaît. */
  verifier('tous les états annoncés par la file sont dans `ETATS` (ce qu’elle ne connaît plus a l’événement `supprimee`)',
    etatsAnnonces.size >= 4 && [...etatsAnnonces].every((x) => F.ETATS.includes(x)), json([...etatsAnnonces]));
  await pause(50);
  verifier('aucune promesse de la file ne plante sans être rattrapée', plantagesDeLaFile.length === 0,
    plantagesDeLaFile.map((x) => x.split('\n').slice(0, 3).join(' / ')).join(' ; '));
}

console.log('\n  11. l’identifiant d’une ligne, choisi par le téléphone');
{
  const r = spawnSync(process.execPath, [ICI, '--identifiant'], { encoding: 'utf8' });
  let x = null;
  try { x = JSON.parse(r.stdout); } catch (e) { x = null; }
  const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  verifier('au navigateur, `crypto.randomUUID()` : un UUID version 4 bien formé', x && x.avaitRandomUUID && V4.test(x.navigateur || ''),
    r.stderr || r.stdout);
  verifier('sur le téléphone, `expo.uuidv4()` — rendu en minuscules, comme PostgreSQL l’écrit',
    x && x.telephone === 'abcdef01-2345-4678-89ab-cdef01234567' && x.navigateurFaux === x.telephone, json(x));
  verifier('SANS générateur, ou avec un générateur qui lève ou rend n’importe quoi : `null` — JAMAIS un identifiant bricolé',
    x && x.sansGenerateur === null && x.sansGenerateurEncore === null && x.telephoneQuiLeve === null && x.telephoneFaux === null, json(x));
  const src = sansCommentairesJs(lire('src/lib/identifiant.js'));
  verifier('…et `identifiant.js` ne contient ni `Math.random`, ni l’heure : rien de deviné',
    !/Math\.random|Date\.now|new Date|performance\.now/.test(src));
  verifier('`IDENTIFIANT_IMPOSSIBLE` dit quoi faire, et qu’il n’a rien enregistré',
    /mettez Opus à jour/.test(I.IDENTIFIANT_IMPOSSIBLE) && /Rien n’a été enregistré/.test(I.IDENTIFIANT_IMPOSSIBLE));
}

/* ================================================================== */
/*  B. LE SCHÉMA — ce qui se juge dès aujourd'hui                       */
/* ================================================================== */
console.log('\nB. LE SCHÉMA — les vérifications qui lisent l’EXISTANT (le reste vient avec la section 49)');
const SCHEMA = lire('supabase/schema.sql');
const SQL = sansCommentairesSql(SCHEMA);
const FONCTIONS = [...SQL.matchAll(
  /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\bas\s+(\$\w*\$)([\s\S]*?)\3/gi,
)].map((m) => ({ nom: m[1], attributs: m[2], corps: m[4] }));
const TABLES_CREEES = /create\s+table\s+(if\s+not\s+exists\s+)?public\.devis\s*\(/i.test(SQL);

console.log('\n  14. D4-c — aucun motif de refus ne nomme une ORIGINE');
{
  /* LES FONCTIONS DE MOTIFS, NOMMÉES : une liste, pas une sélection par
     type de retour, qui ramasserait `admin_traiter_demande_pro`,
     `devenir_pro` ou `rattacher_mon_siret` (relecture « base », B1).
     `emetteur_incomplet` existe depuis le lot 0a ; `motifs_refus_remise`
     naîtra au lot 2. On vise la COLONNE du devis, pas le mot : la première
     lit déjà `r.source` — la source d'une ENTREPRISE (`entreprise_registre`),
     et c'est juste. */
  const MOTIFS = [{ nom: 'emetteur_incomplet', naitAuLot: '0a' }, { nom: 'motifs_refus_remise', naitAuLot: '2' }];
  const trouvees = MOTIFS.map((m) => ({ ...m, corps: FONCTIONS.filter((f) => f.nom === m.nom).map((f) => f.corps).join('\n') || null }));
  const INTERDITS = [
    [/\bpublic\.devis\b/i, 'la table `public.devis`'],
    [/\bquote_request_id\b/i, '`quote_request_id`'],
    [/\bsos_request_id\b/i, '`sos_request_id`'],
    [/'(qr|visite|dossier)'/i, 'une origine écrite en toutes lettres (« qr », « visite », « dossier »)'],
  ];
  const fautes = trouvees.filter((m) => m.corps).flatMap((m) => INTERDITS.filter(([re]) => re.test(m.corps)).map(([, quoi]) => `${m.nom} nomme ${quoi}`));
  verifier('`emetteur_incomplet` est lue (sinon ce contrôle n’éprouverait rien)', !!trouvees[0].corps && trouvees[0].corps.length > 500);
  verifier(`aucune fonction de motifs (${trouvees.filter((m) => m.corps).map((m) => m.nom).join(', ')}) ne nomme `
    + '`public.devis`, `quote_request_id`, `sos_request_id` ni une origine (qr, visite, dossier)',
  fautes.length === 0, `${fautes.join(' ; ')} — un motif de refus de remise qui dépend d’une origine rendrait le QR, la `
    + 'visite ou la demande OBLIGATOIRES pour remettre un devis (D4-c, validé le 19/10).');
  /* Les index UNIQUES sur un devis : aucun ne porte l'entreprise avec un
     client, une demande ou un lieu — un client a plusieurs projets (D4). */
  const uniques = [...SQL.matchAll(/create\s+unique\s+index[^;]*?\bon\s+public\.devis\s*(?:using\s+\w+\s*)?\(([^)]*)\)/gi)].map((m) => m[1])
    .concat([...SQL.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.devis\s*\(([\s\S]*?)\n\);/gi)]
      .flatMap((m) => [...m[1].matchAll(/\bunique\s*\(([^)]*)\)/gi)].map((u) => u[1])));
  const mauvais = uniques.filter((c) => /\bpro_id\b/.test(c) && /\b(client_id|quote_request_id|sos_request_id|lieu_\w+)\b/.test(c));
  verifier(`aucun index unique ne lie l’entreprise à un client, une demande ou un lieu (${uniques.length} index unique(s) sur \`devis\`)`,
    mauvais.length === 0, mauvais.join(' | '));
}

console.log('\n  16. l’ordre des contraintes de ligne — celui de PostgreSQL');
{
  const noms = [...D.CONTRAINTES_LIGNE];
  verifier('`CONTRAINTES_LIGNE` : dix noms `devis_ligne_…_check`, TRIÉS par ordre alphabétique (octet par octet, comme '
    + 'PostgreSQL les applique)', noms.length === 10 && noms.every((n) => /^devis_ligne_[a-z_]+_check$/.test(n))
    && egalListes(noms, [...noms].sort()), json(noms));
  verifier('`CONTRAINTES_DEVIS` : dix noms `devis_…_check`, triés de même',
    D.CONTRAINTES_DEVIS.length === 10 && D.CONTRAINTES_DEVIS.every((n) => /^devis_[a-z_]+_check$/.test(n) && !/^devis_ligne_/.test(n))
    && egalListes([...D.CONTRAINTES_DEVIS], [...D.CONTRAINTES_DEVIS].sort()));
}

console.log('\n  17. la classe de blancs — une seule règle, recopiée sous contrôle');
{
  const decoder = (e) => e.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\n/g, '\n');
  const corps = (nom) => (FONCTIONS.find((f) => f.nom === nom) || {}).corps || '';
  const jeuDe = (nom, colonne) => {
    const m = corps(nom).match(new RegExp(
      `new\\.${colonne} := nullif\\(btrim\\(coalesce\\(new\\.${colonne}, ''\\),\\s*E'((?:[^'\\\\]|\\\\.)*)'\\), ''\\);`));
    return m ? [...new Set(decoder(m[1]))].sort().join('') : null;
  };
  const js = [...new Set(D.BLANCS)].sort().join('');
  const s47a = jeuDe('tient_les_tarifs', 'frais_deplacement_texte');
  const s47b = jeuDe('tient_les_tarifs_publics', 'decompte_temps_texte');
  const tarifs = [...new Set(E.BLANCS_TARIFS || '')].sort().join('');
  verifier('`BLANCS` (devis.js) = la classe de la section 47 (ses deux déclencheurs) = `BLANCS_TARIFS` — les invisibles compris',
    !!s47a && js === s47a && js === s47b && js === tarifs && ['\u00a0', '\u200b', '\u200c', '\u200d', '\u2060', '\ufeff'].every((ch) => js.includes(ch)),
    `devis ${json(js)} ; 47 ${json(s47a)} / ${json(s47b)} ; tarifs ${json(tarifs)}`);
  verifier('…et le nettoyage d’une désignation la rogne : un U+200B seul n’est pas une désignation',
    D.validerLigne({ type: 'zone', designation: '\u200b\u00a0 ' }).contrainte === 'devis_ligne_designation_check'
    && D.nettoyerLigne({ designation: '\ufeff pose\u2060 ' }).designation === 'pose');
}

console.log('\n  22. qui nomme les tables du devis — une liste FERMÉE');
{
  /* LE NOM QUALIFIÉ, jamais le mot : « devis » est dans les chaînes de cinq
     fonctions existantes (des phrases, et le genre `'devis'` d'une demande).
     Les fonctions qui nomment `public.devis`, `public.devis_lignes` ou
     `public.devis_tva` sont, au plus, ces quatre-là ; et aucune référence ne
     s'écrit sans `public.` (relecture « base », B2). */
  const FERMEE = ['tient_le_devis', 'tient_la_ligne_de_devis', 'recalcule_devis', 'mes_donnees'];
  const nomment = [...new Set(FONCTIONS.filter((f) => /\bpublic\.devis(_lignes|_tva)?\b/i.test(f.corps)).map((f) => f.nom))].sort();
  const enTrop = nomment.filter((n) => !FERMEE.includes(n));
  const enMoins = FERMEE.filter((n) => !nomment.includes(n));
  verifier(`le schéma est lu (${FONCTIONS.length} fonctions)`, FONCTIONS.length >= 60);
  if (TABLES_CREEES) {
    verifier('les fonctions qui nomment les tables du devis sont EXACTEMENT la liste fermée — un nom en trop ou en moins rougit',
      enTrop.length === 0 && enMoins.length === 0, `en trop : ${enTrop.join(', ') || '—'} ; en moins : ${enMoins.join(', ') || '—'}`);
  } else {
    verifier('les tables du devis ne sont pas encore créées : AUCUNE fonction ne les nomme (la liste fermée se juge en entier '
      + 'dès la section 49)', nomment.length === 0, nomment.join(', '));
  }
  verifier('aucune fonction `admin_*` ne les nomme (`PLAN-DEVIS` 10.10, l’engagement du 18/10)',
    !nomment.some((n) => /^admin_/.test(n)), nomment.join(', '));
  const nonQualifiees = [...SQL.matchAll(/\b(from|join|into|update|table)\s+devis(_lignes|_tva)?\b/gi)].map((m) => m[0]);
  verifier('aucune référence NON qualifiée (`from devis`, `update devis_lignes`…) dans tout `schema.sql`',
    nonQualifiees.length === 0, nonQualifiees.join(' | '));
}

console.log('\n  32. dans les fichiers du calcul : une seule orthographe, jamais une moyenne, jamais un arrondi flottant');
{
  /* TOUT LE MODULE, et pas `devis.js` seul (le cahier, §6.1-32 ; relecture
     des étapes 0-2, M2) : les quatre fichiers que `node` fait tourner. Les
     écrans et la section 49 s'y ajouteront avec leurs étapes. */
  const MODULE = ['src/lib/devis.js', 'src/lib/centimes.js', 'src/lib/file-ecriture.js', 'src/lib/identifiant.js'];
  const textes = MODULE.map((f) => [f, sansCommentairesJs(lire(f))]);
  const accordees = textes.flatMap(([f, t]) => t.split('\n')
    .filter((l) => /\b(acceptee|refusee)\b/.test(l) && !(f === 'src/lib/devis.js' && /^\s*sos:\s*Object\.freeze\(\[/.test(l)))
    .map((l) => `${f} : ${l.trim()}`));
  verifier('`acceptee` / `refusee` n’apparaissent dans le module (devis, centimes, file, identifiant) que pour LIRE '
    + '`sos_requests` (D9)', accordees.length === 0, accordees.join(' | '));
  /* La règle du cahier (§3.1), tenue enfin : jamais `Math.round`, `toFixed`
     ni `parseFloat` sur de l'argent. Elle ne se voit pas toujours dans un
     calcul — `Math.round(n / d)` rend le même nombre sur les cas d'aujourd'hui
     (relecture 0-2, mineur 14) —, d'où une règle de texte, sur tout le
     module : aucun de ces fichiers n'a de raison d'en écrire un. */
  const flottants = textes.flatMap(([f, t]) => [...t.matchAll(/\bMath\.round\s*\(|\.toFixed\s*\(|\bparseFloat\s*\(|\bMath\.fround\s*\(/g)]
    .map((m) => `${f} : ${m[0]}`));
  verifier('le module n’écrit jamais `Math.round`, `toFixed` ni `parseFloat` : l’argent se calcule en entiers, et se convertit '
    + 'sur la chaîne', flottants.length === 0, flottants.join(' | '));
  const src = textes[0][1];
  const memoire = corpsDeFonction(src, 'memoireDesLignes') || '';
  verifier('`memoireDesLignes` ne calcule ni moyenne, ni médiane, ni minimum, ni maximum',
    memoire.length > 200 && !/moyenne|m[ée]diane|\bavg\(|Math\.(min|max)\(|\/\s*prix\.length|\.reduce\(/i.test(memoire));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le chiffrage compte juste, au centime, et la file n’écrit rien deux fois. Ce que PostgreSQL en fait, '
  + '`essais-section-49.sql` le dira (étape 3).\n');
