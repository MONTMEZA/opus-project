/**
 * LE CHIFFRAGE D'UN DEVIS — lot 1 du module devis (21/10/2026).
 *
 * À LIRE AVANT TOUT : UN CONTRÔLE QUI LIT DU TEXTE NE PEUT PAS VOIR TOUTES
 * LES FORMES QU'UN SQL PEUT PRENDRE ; LA PREUVE DE SÉCURITÉ EST L'ESSAI
 * (`supabase/essais-section-49.sql`), QUI INTERROGE LE CATALOGUE DE LA BASE
 * REJOUÉE. Les parties B et C de ce fichier lisent `schema.sql` et l'essai
 * comme du TEXTE : elles attrapent vite et tôt les fautes ordinaires, elles
 * ne PROUVENT rien. Deux relectures de l'étape 3 l'ont montré sur des copies
 * sabotées, dommages à l'appui : au 1er tour, quatre formes passaient
 * (guillemets, `begin atomic`, jointure à virgule, `grant` en masse sur les
 * fonctions) ; corrigées ici par des motifs, et le 2e tour en a trouvé
 * treize de plus. Ce qu'un motif n'attrape pas, c'est l'essai qui le tient,
 * par le catalogue — et ces formes-là, nommées, ne sont gardées QUE par lui
 * quand le motif ci-dessous les manque encore :
 *   - les DROITS, quelle que soit leur écriture (`grant` sans `public.`, en
 *     masse sur les TABLES, par COLONNE, à PUBLIC) : essai, cas 26
 *     (`has_table_privilege` et `has_any_column_privilege`, rôle par rôle) —
 *     sabotages N5, N5b (B vidait les lignes de tous par `truncate`), N12 ;
 *   - toute fonction `security definer`, quels que soient son nom, son corps
 *     (`$…$`, apostrophes, `begin atomic`, `return`), son genre (fonction ou
 *     PROCÉDURE) et la façon d'écrire la table (`public . x`, guillemets,
 *     sans `public.`, `insert into x (cols)`) : essai, cas 27b et 27c, deux
 *     listes FERMÉES relevées dans le catalogue — sabotages N6, N7, N7b,
 *     N7c, N8, N9 (un déclencheur `definer` écrivait dans le devis d'un
 *     autre), N10, N11 ;
 *   - les politiques, quel que soit leur nom ou la façon d'écrire la table :
 *     essai, cas 12 et 28 (`pg_policies`) — sabotages N1 à N4 ;
 *   - les vues et les RÈGLES qui lisent ou écrivent les tables, les
 *     déclencheurs posés sur elles : essai, cas 27e et 27f — sabotage N14
 *     (une règle posée sur `clients` écrivait dans le devis d'un autre ;
 *     B-22 refuse aussi toute `create rule`, le schéma n'en a aucune) ;
 *   - une unité refusée alors que la liste écrite est intacte : essai, cas 4
 *     quater (les sept unités INSÉRÉES) — sabotage N13.
 * L'ESSAI, LUI, NE PEUT PAS SE GARDER : ce qu'il doit contenir est la partie
 * C (et c'est du texte, faute de mieux — E1, E2 l'ont éprouvée).
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
 *      l'identifiant ; A-7, la démonstration (étape 4) : ses données
 *      refaites, et sa base en mémoire mise à l'épreuve.
 *   B. LE SCHÉMA (étape 3) — la section 49 lue sans ses commentaires : la
 *      liste FERMÉE des colonnes, D4, les 23 contraintes, les miroirs de
 *      `devis.js`, les formules, les politiques, les droits, les
 *      déclencheurs sous leurs noms, la parade de la requête tardive
 *      (49.5 bis), la liste fermée des fonctions qui nomment les tables, la
 *      place de la section, l'export. Les vérifications qui lisent
 *      l'EXISTANT (D4-c, la liste qualifiée) ont d'abord été lancées sur le
 *      schéma d'avant la section 49, à l'étape 0 — sinon elles auraient
 *      accusé du code juste (relecture « base » du cahier, B1 et B2).
 *   C. L'ESSAI (étape 3) — ce que `supabase/essais-section-49.sql` doit
 *      contenir ; le JOUER est l'affaire de PostgreSQL, à la main.
 *   D. L'API (étape 4) — `api.js` LU (il charge Supabase, que `node`
 *      n'ouvre pas) : la forme des fonctions, la liste fermée de ce qui
 *      part — `devisVersBase` et `ligneVersBase`, elles, FAITES TOURNER —,
 *      le seul écrivain, la file, la mémoire, le tri ; puis la base de
 *      démonstration FAITE TOURNER par la vraie file, et ses refus
 *      comparés, mot pour mot, à ceux que la section 49 lève.
 *   E. LES ÉCRANS (étape 5) — les sept fichiers de la saisie LUS (ils
 *      chargent React Native) : le bandeau, les claviers (un nombre a SON
 *      champ, `ChampMontant`), `CLAVIER` sans `KeyboardAvoidingView`, aucun
 *      calcul de totaux dans React ni aucune somme de deux totaux, une seule
 *      porte pour écrire un montant (`Montant`), les pastilles, un échec du
 *      régime qui ne dit jamais « non déclaré », la garde de sortie aux CINQ
 *      portes d'`OpusApp`, « Mes devis », la fiche client, « Pour moi », et
 *      les jetons de thème qui existent. Ce que ces écrans FONT au
 *      navigateur, c'est `mesure-devis` (étape 7) qui le mesure.
 *   F. QUI LIT, QUI ÉCRIT (étape 5) — pour chaque colonne du SCHÉMA, un
 *      écrivain et un lecteur ; pour chaque table, une relecture dans
 *      `api.js` ET un appelant à l'écran. Les deux sens du même contrôle :
 *      le 01/10, des tables écrites que personne ne lisait ; le 04/10, une
 *      colonne lue que personne n'écrivait.
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
import { createHash } from 'node:crypto';
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

let D; let C; let E; let ERR; let F; let I; let ENT; let CAS; let DEMO;
try {
  D = await import('../src/lib/devis.js');
  C = await import('../src/lib/centimes.js');
  E = await import('../src/lib/emetteur.js');
  ENT = await import('../src/lib/entreprise.js');
  ERR = await import('../src/lib/erreurs.js');
  F = await import('../src/lib/file-ecriture.js');
  I = await import('../src/lib/identifiant.js');
  DEMO = await import('../src/data/devis-demo.js');
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
/* La forme « conditions » (lot 2a) porte en plus la part de réduction de
   chaque taux, la réduction effective, l'acompte effectif et le total toutes
   options comprises. */
function forme(t, conditions = false) {
  const vent = t.ventilation.filter((e) => e.nbLignes > 0)
    .map((e) => (conditions ? `${e.taux}:${e.base}:${e.remise}:${e.tva}:${e.nbLignes}` : `${e.taux}:${e.base}:${e.tva}:${e.nbLignes}`))
    .join(',') || '—';
  const opts = t.options.map((o) => `${o.taux}:${o.total}`).join(',') || '—';
  const base = `${t.ht}|${t.tva}|${t.ttc}|${vent}|${opts}`;
  return conditions ? `${base}|${t.reduction.effectif}|${t.acompte.effectif}|${t.ttcOptions}` : base;
}
/* L'opération « devis » (lot 2a) écrit des colonnes de `devis` : jugées
   comme la base les juge (`validerDevis`, les contraintes de `devis`), puis
   les totaux refaits avec elles. */
function jouerCas(cas) {
  let lignes = new Map();
  let devis = {};
  let rang = 0;
  const journal = [];
  for (const op of cas.operations || []) {
    let essai = new Map(lignes);
    let devisEssai = devis;
    if (op.op === 'devis') {
      devisEssai = { ...devis, ...camel(op.valeurs) };
      const v = D.validerDevis(devisEssai);
      journal.push({ op, refusPar: v.ok ? null : 'validerDevis', contrainte: v.contrainte });
      if (!v.ok) return { resultat: `REFUS:${v.contrainte}`, journal };
    } else if (op.op === 'ajouter') {
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
    const t = D.totauxDevis([...essai.values()], devisEssai);
    if (!t.ok) return { resultat: `REFUS:${t.contrainte}`, journal };
    lignes = essai;
    devis = devisEssai;
  }
  return { resultat: forme(D.totauxDevis([...lignes.values()], devis), cas.forme === 'conditions'), journal };
}
/* Un tableau de parts s'écrit comme PostgreSQL écrit un `bigint[]` :
   « {a,b} », « {} » pour un tableau vide. */
const tableauSql = (r) => (Array.isArray(r) ? `{${r.map(String).join(',')}}` : r);
const FONCTIONS_JS = {
  devis_tva_de: (base, taux) => D.tvaDe(base, taux),
  devis_total_ligne: (q, p) => D.valeurLigne({ type: 'poste', quantiteMilliemes: q, prixUnitaireCentimes: p }),
  repartir_au_plus_fort_reste: (total, poids) => tableauSql(D.repartirAuPlusFortReste(total, poids)),
};

console.log('\n  1. les cas d’argent de `supabase/cas-devis.json`, joués en JavaScript');
{
  /* LE NOMBRE EST ÉCRIT EN DUR : un fichier vidé, ou à moitié, ne passe
     pas au vert en n'éprouvant plus rien. 44, ceux du §3.5 du cahier du
     lot 1 ; 25 de plus au lot 2a (la réduction, l'acompte, le total toutes
     options comprises, la répartition). */
  const cas = CAS.cas || [];
  verifier('le jeu commun porte exactement 69 cas, chacun avec un identifiant unique — dont 23 suites « conditions » et 2 de répartition',
    cas.length === 69 && CAS.nombre === 69 && new Set(cas.map((c) => c.id)).size === 69
    && cas.filter((c) => c.forme === 'conditions').length === 23
    && cas.filter((c) => (c.fonctions || []).some((f) => f.nom === 'repartir_au_plus_fort_reste')).length === 2,
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
  /* Les colonnes de `devis` que l'opération « devis » écrit (lot 2a) : celles
     que le joueur SQL nomme une par une, et rien d'autre. */
  const ECRITES_DEVIS = ['remise_centiemes', 'remise_centimes', 'acompte_centiemes', 'acompte_centimes', 'acompte_nature',
    'validite_jours', 'retenue_garantie_centiemes'];
  const horsListe = cas.flatMap((c) => (c.operations || []).flatMap((o) => [
    ...(['ajouter', 'modifier', 'retirer', 'devis'].includes(o.op) ? [] : [`${c.id} : opération « ${o.op} »`]),
    ...Object.keys(o.valeurs || {}).filter((k) => !(o.op === 'devis' ? ECRITES_DEVIS : ECRITES).includes(k))
      .map((k) => `${c.id} : colonne « ${k} »`),
    ...(o.op !== 'retirer' && !o.valeurs ? [`${c.id} : « ${o.op} » sans valeurs`] : []),
  ])).concat(cas.flatMap((c) => (c.fonctions || []).filter((f) => !FONCTIONS_JS[f.nom] || f.args.length !== 2)
    .map((f) => `${c.id} : fonction « ${f.nom} »`)));
  verifier('chaque cas se joue aussi en SQL : quatre opérations, des colonnes de `devis_lignes` (et de `devis` pour « devis ») seulement, trois fonctions',
    horsListe.length === 0, horsListe.join(' ; '));
  const faux = [];
  for (const c of cas) {
    if (c.operations) {
      /* Un calcul qui LÈVE au lieu de rendre un refus est un échec de ce
         cas, pas une panne du contrôle (banc de l'étape 4 du lot 2a : une
         réduction non ramenée faisait planter tout `verifier-devis`, sans
         un « ✘ »). */
      let r;
      try { r = jouerCas(c).resultat; } catch (e) { r = `PLANTE : ${e && e.message}`; }
      if (r !== c.attendu) faux.push(`${c.id} : ${r} au lieu de ${c.attendu}`);
    }
    for (const f of c.fonctions || []) {
      const r = FONCTIONS_JS[f.nom] ? FONCTIONS_JS[f.nom](...f.args) : 'FONCTION INCONNUE';
      if (r !== f.attendu) faux.push(`${c.id} : ${f.nom}(${f.args.join(', ')}) → ${r}, attendu ${f.attendu}`);
    }
  }
  verifier(`les 69 cas rendent exactement leurs attendus, octet pour octet (${cas.filter((c) => c.operations).length} suites `
    + `d’opérations, ${cas.reduce((n, c) => n + (c.fonctions || []).length, 0)} appels de fonction)`,
    faux.length === 0, faux.join('\n      '));
  const refus = cas.filter((c) => /^REFUS:/.test(c.attendu || ''));
  verifier(`…dont ${refus.length} refus, chacun par le NOM de sa contrainte`,
    refus.length >= 27 && refus.every((c) => /^REFUS:devis_(ligne_[a-z_]+|plafond|remise(_une_forme)?|acompte(_une_forme|_nature)?|validite)_check$/.test(c.attendu)));
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
  /* « ,5 » vaut 0,5 : sur un pavé décimal on tape la virgule d'abord — il
     était refusé avec « une seule virgule » (relecture « écran » des étapes
     4 à 7, C7). Une virgule seule, non. */
  const mOk = [['2,5', 2500], ['2.5', 2500], ['2,500', 2500], ['1 000', 1000000], ['99999,999', 99999999], ['', null],
    ['  ', null], ['0,001', 1], ['007', 7000], [',5', 500], ['.25', 250], ['5,', 5000]];
  const mKo = ['2,5000', '-1', '100000', '1.000,5', 'deux', '2,5,1', ',', '.', ',,5', ',0005'];
  const fauxM = mOk.filter(([s, v]) => !(m(s).ok && m(s).milliemes === v)).map(([s]) => `${json(s)} → ${json(m(s))}`)
    .concat(mKo.filter((s) => m(s).ok).map((s) => `${json(s)} accepté`));
  verifier('`versMilliemes` : « 2,5 » et « 2.5 » → 2500, « ,5 » → 500 ; quatre décimales, négatif, six chiffres, une virgule '
    + 'seule refusés ; vide → null',
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
      devis: { id: `d${n}`, objet: `Devis ${n}`, source: 'manuelle', modifieLe: `2026-10-${String(n).padStart(2, '0')}T10:00:00Z` }, ...plus,
    };
  };
  /* LA RÉPONSE DU PROPRIÉTAIRE DU 23/10 (lot P, cahier §3.1, mesuré X-16) :
     « il ne faut pas qu'il y ait trop de propositions, ça pourrait nous
     perdre ». La même phrase écrite à 50 € puis à 70 € n'est plus DEUX
     suggestions mais UNE proposition, qui porte les deux prix — le plus
     récent d'abord, celui qu'un appui recopie. Ce qui ne change pas : aucun
     prix que personne n'a écrit, donc jamais 60 €. */
  const deux = [L('Chape sèche', 5000), L('Chape sèche', 7000)];
  const s2 = D.memoireDesLignes(deux, 'chape');
  verifier('50 € et 70 € → UNE proposition (une par phrase, réponse du 23/10) qui porte les DEUX prix, 70 € (le plus récent) '
    + 'd’abord et recopié par un appui — aucun ne vaut 60 €',
  s2.length === 1 && s2[0].prixUnitaireCentimes === 7000 && egalListes((s2[0].prix || []).map((p) => p.prixUnitaireCentimes), [7000, 5000])
    && D.valeursDeLaSuggestion(s2[0]).prixUnitaireCentimes === 7000
    && !s2.some((s) => s.prixUnitaireCentimes === 6000 || (s.prix || []).some((p) => p.prixUnitaireCentimes === 6000)),
  json(s2.map((s) => [s.prixUnitaireCentimes, (s.prix || []).map((p) => p.prixUnitaireCentimes)])));
  const unites = D.memoireDesLignes([L('Ragréage', 4500), L('Ragréage', 4500, { unite: 'forfait' })], 'ragr');
  verifier('la même phrase au m² et au forfait, AU MÊME PRIX → deux suggestions',
    unites.length === 2 && new Set(unites.map((s) => s.unite)).size === 2, json(unites.map((s) => s.unite)));
  const fourniture = D.memoireDesLignes([L('Pose de faïence', 4500), L('Pose de faïence', 4500, { fournitureNonComprise: true })], 'faience');
  verifier('la même phrase avec et sans fourniture, AU MÊME PRIX → deux suggestions (sans accent ni casse : « faience »)',
    fourniture.length === 2 && fourniture.filter((s) => s.fournitureNonComprise).length === 1, json(fourniture));
  const quatre = D.memoireDesLignes([L('Enduit', 1000), L('Enduit', 2000), L('Enduit', 3000), L('Enduit', 4000), L('Enduit', 4000)], 'enduit');
  /* Toujours trois prix au plus, et toujours chacun avec son devis
     d'origine — mais dans UNE proposition (réponse du 23/10) : l'origine de
     la proposition est celle du prix qu'un appui recopie (4 000, « Devis
     11 » ; le 4 000 du devis 10, plus ancien, n'est pas répété). */
  verifier('trois prix au plus par phrase, sans répéter un même prix, chacun avec son devis d’origine — dans UNE proposition, '
    + 'dont l’origine est celle du prix recopié',
  quatre.length === 1 && egalListes((quatre[0].prix || []).map((p) => p.prixUnitaireCentimes), [4000, 3000, 2000])
    && egalListes(quatre[0].prix.map((p) => p.origine && p.origine.objet), ['Devis 11', 'Devis 9', 'Devis 8'])
    && quatre[0].prix.every((p) => /^\d{2}\/10\/2026$/.test((p.origine && p.origine.date) || ''))
    && quatre[0].origine.objet === 'Devis 11' && quatre[0].prixUnitaireCentimes === 4000,
  json(quatre.map((s) => (s.prix || []).map((p) => [p.prixUnitaireCentimes, p.origine]))));
  /* L'ORIGINE D'UNE SUGGESTION, MONTRÉE PENDANT QU'ON CHIFFRE LE DEVIS D'UN
     AUTRE CLIENT : l'objet d'un devis ouvert depuis une demande ou une
     urgence est le texte du PARTICULIER — il ne sort jamais de ses devis ;
     une source inconnue se tait de même ; l'objet d'un devis ouvert à la
     main se montre, réduit à quatre mots (relecture « données » des étapes
     4 à 7, I5). */
  const LE = '2026-10-12T10:00:00Z';
  const oDemande = D.memoireDesLignes([L('Carrelage', 4000, { devis: { id: 'dd', objet: 'Fuite chez moi au 4 rue des Lilas, code 1234', source: 'demande', modifieLe: LE } })], 'carrelage')[0];
  const oUrgence = D.memoireDesLignes([L('Carrelage', 4000, { devis: { id: 'du', objet: 'Dégât des eaux chez Mme X', source: 'urgence', modifieLe: LE } })], 'carrelage')[0];
  const oInconnue = D.memoireDesLignes([L('Carrelage', 4000, { devis: { id: 'di', objet: 'Chez M. Y', modifieLe: LE } })], 'carrelage')[0];
  const oMain = D.memoireDesLignes([L('Carrelage', 4000, { devis: { id: 'dm', objet: 'Rénovation de la salle de bains du haut', source: 'manuelle', modifieLe: LE } })], 'carrelage')[0];
  const texteDe = (s) => json(s && s.origine);
  verifier('l’origine d’une suggestion : un devis ouvert depuis une DEMANDE, une URGENCE ou de source inconnue se nomme par sa '
    + 'DATE (« votre devis du 12/10/2026 »), jamais par le texte du client ; un devis ouvert à la main par quatre mots de son objet',
    oDemande && oDemande.origine.objet === null && oDemande.origine.libelle === 'votre devis du 12/10/2026'
    && !/Lilas|Fuite|1234/.test(texteDe(oDemande)) && oUrgence && !/Mme|Dégât/.test(texteDe(oUrgence))
    && oInconnue && !/M\. Y|Chez/.test(texteDe(oInconnue)) && oMain && oMain.origine.libelle === 'Rénovation de la salle…',
    [oDemande, oUrgence, oInconnue, oMain].map(texteDe).join(' | '));
  const CD = sansCommentairesJs(lire('src/components/ChampDesignation.js'));
  /* Depuis le lot P, `ChampDesignation` n'écrit plus le détail lui-même : il
     affiche les rangées que rend `propositionsAMontrer` (`postes.js`). La
     règle suit le texte là où il s'écrit — et elle se FAIT TOURNER (les
     corrections « écran » du lot P, 24/10/2026) : ce que la rangée montre
     et ce que VoiceOver lit, pour un devis ouvert depuis une demande, une
     urgence ou de source inconnue, ne contient jamais un mot de son objet. */
  const PO = sansCommentairesJs(lire('src/lib/postes.js'));
  const PM = await import('../src/lib/postes.js');
  const rangeesDe = (devis) => PM.propositionsAMontrer({
    memoire: [L('Carrelage', 4000, { devis: { ...devis, modifieLe: LE } })], texte: 'carrelage',
  });
  const vus = [
    ['demande', { id: 'dd', objet: 'Fuite chez moi au 4 rue des Lilas, code 1234', source: 'demande' }, /Lilas|Fuite|1234/],
    ['urgence', { id: 'du', objet: 'Dégât des eaux chez Mme X', source: 'urgence' }, /Mme|Dégât/],
    ['inconnue', { id: 'di', objet: 'Chez M. Y' }, /M\. Y|Chez/],
  ].map(([nom, devis, interdit]) => {
    const r = rangeesDe(devis);
    const dit = json(r.map((x) => [x.titre, x.distinction, x.morceaux, x.libelle]));
    return { nom, ok: r.length === 1 && !interdit.test(dit) && /votre devis du 12\/10\/2026/.test(dit), dit };
  });
  verifier('…et l’écran n’affiche l’origine que par `origine.libelle` : les rangées de `ChampDesignation` viennent de '
    + '`propositionsAMontrer`, FAITE TOURNER — ce qu’elles montrent et ce que VoiceOver lit d’un devis ouvert depuis une demande, '
    + 'une urgence ou de source inconnue dit sa date, jamais un mot de son objet ; et ni l’écran ni `postes.js` ne lisent '
    + '`origine.objet`',
  !/origine\.objet|\.devis\.objet/.test(CD) && !/origine\.objet|\.devis\.objet/.test(PO)
    && /propositionsAMontrer\(\{/.test(CD) && !/memoireDesLignes|suggestionsPourLaFrappe|detailDeSuggestion|libelleDeSuggestion/.test(CD)
    && vus.every((v) => v.ok), vus.filter((v) => !v.ok).map((v) => `${v.nom} : ${v.dit}`).join(' | '));
  /* LE LIEU COPIÉ D'UNE DEMANDE TIENT DANS SES BORNES (29/10/2026) : la
     « ville » d'une demande de devis est un champ LIBRE, sans limite ; le
     lieu d'un devis en a une (`devis_lieu_ville_check`). Au-delà, le
     brouillon ne se créerait pas — la leçon de l'objet trop long des étapes
     4 à 7 (I5). Et un code postal qui n'a pas cinq chiffres n'est pas repris. */
  const longue = D.devisDepuisDemandeEtFiche({ id: 'q', genre: 'devis', titre: 'x' }, null,
    { adresse: `${'a'.repeat(300)}`, codePostal: '1234', ville: `${'b'.repeat(300)}` });
  verifier('le lieu repris d’une demande tient dans `devis_lieu_*_check` (200 et 120 caractères) et un code postal de quatre chiffres '
    + 'n’est pas repris : au-delà, le brouillon ne se créerait pas',
  Boolean(longue) && [...longue.lieuAdresse].length === D.LONGUEURS.lieuAdresse
    && [...longue.lieuVille].length === D.LONGUEURS.lieuVille && !('lieuCodePostal' in longue)
    && D.validerDevis({ ...longue }).ok, json(longue && Object.keys(longue)));
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

  /* LA MÉMOIRE PAR LA CLÉ (lot P, cahier §3.1 et §3.3, cas 15, 28 à 33, 39
     et 41). Des dates relatives à un instant fixé, et non le compteur `n`
     d'au-dessus : passé le 31, il fabriquerait un « 2026-10-35 » illisible,
     donc une ligne sans date, rangée au hasard. */
  /* Un calcul qui PLANTE (une fonction absente, une forme inattendue) ne
     doit pas arrêter le contrôle : l'exception devient un échec NOMMÉ. */
  try {
    const T0 = Date.UTC(2026, 9, 23, 12);
    const il = (h) => new Date(T0 - h * 3600e3).toISOString();
    const M = (id, designation, prix, ageH, plus = {}) => ({
      id, type: 'poste', designation, unite: 'u', prixUnitaireCentimes: prix, offert: false, mainOeuvre: false,
      fournitureNonComprise: false, modifieLe: il(ageH),
      devis: { id: `d-${id}`, objet: `Devis ${id}`, source: 'manuelle', modifieLe: il(ageH) }, ...plus,
    });
    /* Cas 28 : deux orthographes de la même phrase — UNE proposition, titrée
       par la plus RÉCENTE (mot pour mot), les deux prix, chacun avec son
       devis d'origine. La phrase la plus récente gagne : c'est la règle dite
       au propriétaire le 23/10 (question B du cahier, défaut). */
    const seuils = D.memoireDesLignes([
      M('s1', 'Seuils de porte en aluminium (fourniture seule, sans pose)', 2300, 72),
      M('s2', 'Seuil de porte en aluminium (fourniture seule, sans pose)', 2500, 2),
    ], 'seuil');
    verifier('cas 28 : « Seuil de porte… » (il y a 2 h, 25 €) et « Seuils de porte… » (il y a 3 jours, 23 €) → UNE proposition, '
      + 'titrée par la phrase la plus RÉCENTE, mot pour mot, avec les deux prix et leurs devis d’origine',
    seuils.length === 1 && seuils[0].designation === 'Seuil de porte en aluminium (fourniture seule, sans pose)'
      && egalListes(seuils[0].prix.map((p) => p.prixUnitaireCentimes), [2500, 2300])
      && egalListes(seuils[0].prix.map((p) => p.origine.objet), ['Devis s2', 'Devis s1']) && seuils[0].ligneId === 's2',
    json(seuils.map((s) => [s.designation, s.prix.map((p) => p.prixUnitaireCentimes)])));
    /* Cas 30 : la même phrase deux fois au même prix, dont une variante —
       une proposition, un prix (le plus récent des deux). */
    const variante = D.memoireDesLignes([M('v1', 'Chape sèche avant carrelage collé', 4500, 30),
      M('v2', 'CHAPES SECHES, avant carrelages collés.', 4500, 3)], 'chape');
    verifier('cas 30 : la même phrase écrite deux fois AU MÊME PRIX, dont une variante (majuscules, accents, pluriel, ponctuation) → '
      + 'une proposition, un seul prix', variante.length === 1 && variante[0].prix.length === 1
      && variante[0].prix[0].ligneId === 'v2' && variante[0].designation === 'CHAPES SECHES, avant carrelages collés.',
    json(variante));
    /* Cas 31 : la clé d'une proposition est celle d'un poste de même phrase
       (à une variante près), de même unité, de même fourniture : c'est par
       elle que la base de postes la MASQUE (`postes.js`). Une autre unité ou
       une autre fourniture fait une autre clé. */
    const poste = { designation: 'Chape sèche avant carrelage collé', unite: 'u', fournitureNonComprise: false };
    verifier('cas 31 : la clé d’une proposition (`cle`) est `cleDeLigne` d’un poste de même phrase à une variante près, même unité, '
      + 'même fourniture — une autre unité ou une autre fourniture en fait une autre',
    variante[0].cle === D.cleDeLigne(poste) && D.cleDeLigne({ ...poste, unite: 'm2' }) !== variante[0].cle
      && D.cleDeLigne({ ...poste, fournitureNonComprise: true }) !== variante[0].cle
      && D.cleDeLigne({ ...poste, designation: 'Chape seche avant carrelage colle' }) === variante[0].cle,
    `${variante[0] && variante[0].cle} / ${D.cleDeLigne(poste)}`);
    /* Cas 15 et 32 : la recherche par MOTS, dans n'importe quel ordre, et le
       pluriel tapé trouve le singulier écrit. */
    const corpus = [M('c1', 'Chape sèche avant carrelage collé', 4500, 5), M('c2', 'Dalle béton armé, épaisseur 12 cm, sur hérisson', 8500, 6),
      M('c3', 'Dépose de l’ancien carrelage au sol', 1800, 7), M('c4', 'Pose d’un meuble vasque', 18000, 8)];
    const trouve = (t) => D.memoireDesLignes(corpus, t).map((s) => s.ligneId).sort();
    verifier('cas 15 et 32 : « seche chape » trouve « Chape sèche… » ; « Dalles », « beton », « BETON » trouvent la dalle ; '
      + '« carrelages » trouve les deux carrelages — là où le lot 1 ne trouvait que ce qui CONTENAIT le texte tapé',
    json(trouve('seche chape')) === json(['c1']) && json(trouve('Dalles')) === json(['c2']) && json(trouve('beton')) === json(['c2'])
      && json(trouve('BETON')) === json(['c2']) && json(trouve('carrelages')) === json(['c1', 'c3'])
      && D.correspondALaRecherche('Dalle béton armé', 'Dalles') && !D.correspondALaRecherche('Pose de plinthes', 'Les'),
    json(['seche chape', 'Dalles', 'beton', 'BETON', 'carrelages'].map((t) => [t, trouve(t)])));
    /* Cas 33 : « Pos » met « Pose… » (la phrase COMMENCE par le texte, degré
       4) devant « Dépose… » (contenu seulement, degré 2), même quand
       « Dépose » est plus récente. */
    const pos = D.memoireDesLignes([M('p1', 'Pose d’un meuble vasque', 18000, 50), M('p2', 'Dépose de l’ancien carrelage au sol', 1800, 1)], 'Pos');
    verifier('cas 33 : « Pos » range « Pose d’un meuble… » (degré 4) devant « Dépose de… » (degré 2), même plus récente — le degré '
      + 'd’abord, la date ensuite', pos.length === 2 && pos[0].ligneId === 'p1'
      && D.degreDeCorrespondance('Pose d’un meuble vasque', 'Pos') === 4 && D.degreDeCorrespondance('Dépose de l’ancien carrelage', 'Pos') === 2
      && D.degreDeCorrespondance('Pose de plinthes carrelées', 'pose carrel') === 3 && D.degreDeCorrespondance('Dalle béton', 'dalles eton') === 1
      && D.degreDeCorrespondance('Dalle béton', 'Sas') === 0, json(pos.map((s) => s.designation)));
    /* Cas 33 bis (25/10/2026, trouvé sur la VRAIE base) : le degré se lit
       aussi SANS les pluriels. « Dalles » mettait « Dalle béton » au degré 1
       (« trouvée par le pluriel seulement ») ; « creation de la dalles »
       rangeait « Création de la dalle en béton… » DERRIÈRE « CREATION DES
       DALLES EN BETON… », une autre phrase qui contenait toutes les lettres.
       Les clés commencent pareil : degré 4. */
    verifier('cas 33 bis : « Dalles » → « Dalle béton » au degré 4 ; « creation de la dalles » → « Création de la dalle en béton… » (4) '
      + 'devant « CREATION DES DALLES EN BETON… » (2) ; « dalles beton » → 3 ; « dalles eton » reste au degré 1',
    D.degreDeCorrespondance('Dalle béton', 'Dalles') === 4
      && D.degreDeCorrespondance('Création de la dalle en béton y compris coulage manuel, finition talochée', 'creation de la dalles') === 4
      && D.degreDeCorrespondance('CREATION DES DALLES EN BETON y compris coulage manuel finition talochée', 'creation de la dalles') === 2
      && D.degreDeCorrespondance('Création de la dalle en béton', 'dalles beton') === 3
      && D.degreDeCorrespondance('Dalle béton', 'dalles eton') === 1,
    json(['Dalles', 'creation de la dalles', 'dalles beton', 'dalles eton'].map((t) => [t, D.degreDeCorrespondance('Dalle béton', t)])));
    /* Cas 41 : une ligne SANS prix, plus récente, titre la proposition (sa
       phrase est la plus récente) mais ne fait pas perdre le prix : un appui
       recopie 52 €, le plus récent des prix UTILISABLES. */
    const sansPrix = D.memoireDesLignes([M('q1', 'Chape sèche avant carrelage collé', 4500, 72),
      M('q2', 'Chape sèche avant carrelage collé', 5200, 2), M('q3', 'Chape seche avant carrelage colle', null, 0.1)], 'chape');
    verifier('cas 41 : 45 € (il y a 72 h), 52 € (2 h), et la même phrase SANS prix (6 min) → une proposition, titrée par la ligne de '
      + '6 min, `prix` = [52 €, 45 €], et un appui recopie 52 € — une ligne sans prix ne compte pas',
    sansPrix.length === 1 && sansPrix[0].ligneId === 'q3' && sansPrix[0].designation === 'Chape seche avant carrelage colle'
      && egalListes(sansPrix[0].prix.map((p) => p.prixUnitaireCentimes), [5200, 4500])
      && D.valeursDeLaSuggestion(sansPrix[0]).prixUnitaireCentimes === 5200 && sansPrix[0].origine.objet === 'Devis q2',
    json(sansPrix));
    /* Cas 39 : `avertissementDelai` garde ses résultats sans `normalize` (la
       clé de rapprochement ramène « INDICATIFS » à « indicatif »). */
    verifier('cas 39 : « indicatif », « INDICATIFS », « délai indicatif. » avertissent tous trois, comme au lot 1 — et sans `normalize`',
      ['indicatif', 'INDICATIFS', 'délai indicatif.'].every((t) => D.avertissementDelai(t) !== null));
  } catch (e) {
    verifier('les cas de la mémoire par la clé (lot P) se font tourner jusqu’au bout : le calcul ne PLANTE sur aucun', false, e && e.stack);
  }
  verifier('`devis.js` n’appelle plus `normalize` : la clé de rapprochement (`rapprochement.js`) n’a besoin d’aucune table '
    + 'Unicode, et le moteur de l’iPhone n’a pas à en avoir une', !/\bnormalize\b/.test(sansCommentairesJs(lire('src/lib/devis.js'))));
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
  verifier('`devisDepuisDemande` : le lien d’origine SEULEMENT — ni client (un compte n’est pas une fiche, D1), ni lieu, ni '
    + 'OBJET (le texte de la demande ne s’y recopie plus : décision du 29/10/2026) ; un rappel → null',
    json(dd) === json({ source: 'demande', quoteRequestId: 'q1' })
    && json(ds) === json({ source: 'urgence', sosRequestId: 's1' })
    && D.devisDepuisDemande({ ...demande, genre: 'rappel' }) === null
    && [dd, ds].every((x) => !Object.keys(x).some((k) => /client|lieu|ville|adresse|telephone|nom|objet/i.test(k))),
    `${json(dd)} ${json(ds)}`);
  /* LA COMPOSITION AVEC LA FICHE (29/10/2026) garde le lien d'origine :
     dans l'autre sens, `devisDepuisClient` aurait écrit `'manuelle'`, et
     « depuis une demande du … » disparaissait sans un mot. Le lieu est
     celui que le client a écrit (le chantier) ; à défaut, l'adresse de la
     fiche ; un rappel → null. */
  const ficheMarc = { id: 'cl-marc', nom: 'Marc Dumont', adresse: '9 rue des Pins', codePostal: '13410', ville: 'Lambesc' };
  const df = D.devisDepuisDemandeEtFiche(demande, ficheMarc, { adresse: '', codePostal: '', ville: 'Lambesc' });
  const dfSansLieu = D.devisDepuisDemandeEtFiche(demande, ficheMarc, {});
  const dsf = D.devisDepuisDemandeEtFiche({ ...demande, id: 's1', genre: 'sos', titre: 'Fuite' }, null,
    { adresse: '4 Rue des Acacias', codePostal: '13350', ville: 'Charleval' });
  verifier('`devisDepuisDemandeEtFiche` : le lien d’origine GARDÉ (« demande » / « urgence », jamais « manuelle »), la fiche '
    + 'rattachée, le lieu du chantier écrit dans la demande, à défaut celui de la fiche ; jamais d’objet ; un rappel → null',
    json(df) === json({ source: 'demande', quoteRequestId: 'q1', clientId: 'cl-marc', lieuVille: 'Lambesc' })
    && json(dfSansLieu) === json({ source: 'demande', quoteRequestId: 'q1', clientId: 'cl-marc', lieuAdresse: '9 rue des Pins', lieuCodePostal: '13410', lieuVille: 'Lambesc' })
    && json(dsf) === json({ source: 'urgence', sosRequestId: 's1', lieuAdresse: '4 Rue des Acacias', lieuCodePostal: '13350', lieuVille: 'Charleval' })
    && D.devisDepuisDemandeEtFiche({ ...demande, genre: 'rappel' }, ficheMarc, {}) === null
    && [df, dfSansLieu, dsf].every((x) => D.validerDevis({ ...x }).ok && !('objet' in x)),
    `${json(df)} ${json(dfSansLieu)} ${json(dsf)}`);
  verifier('`texteDeLaDemande` : le texte de la demande ou le problème de l’urgence, LU PAR LE LIEN — le lien vide (la demande '
    + 'effacée), plus rien',
    D.texteDeLaDemande({ quoteRequestId: 'q1', demande: { texte: '  Ouverture de mur  ' } }) === 'Ouverture de mur'
    && D.texteDeLaDemande({ sosRequestId: 's1', urgence: { texte: 'Fuite' } }) === 'Fuite'
    && D.texteDeLaDemande({ quoteRequestId: null, demande: { texte: 'reste à l’écran' } }) === null
    && D.texteDeLaDemande({ source: 'manuelle', objet: 'Cuisine' }) === null);
  /* L'URGENCE : le problème ET ce que la personne a écrit, UNE écriture pour
     l'ouverture et la relecture (relecture du 29/10/2026 : la relecture ne
     lisait que le libellé). */
  {
    const API_TEXTE = sansCommentairesJs(lire('src/lib/api.js'));
    verifier('`texteDUrgence` : « problème — ce qu’elle a écrit » ; la jointure du devis ouvert lit `details`, et la relecture de l’urgence aussi',
      D.texteDUrgence({ libelle: 'Plus de courant', details: '  Le disjoncteur saute ' }) === 'Plus de courant — Le disjoncteur saute'
      && D.texteDUrgence({ libelle: 'Fuite', details: '  ' }) === 'Fuite'
      && D.texteDUrgence({ libelle: null, details: 'Ça coule' }) === 'Ça coule'
      && D.texteDUrgence({}) === null
      && /urgence:sos_request_id\(created_at, probleme_label, details\)/.test(D.LIENS_DU_DEVIS_OUVERT)
      && /select\('adresse, code_postal, probleme_label, details'\)/.test(API_TEXTE)
      && /texte: texteDUrgence\(\{ libelle: data\.probleme_label, details: data\.details \}\)/.test(API_TEXTE));
  }
  /* CE QUE LE CLIENT A DEMANDÉ, LU PAR LE LIEN — la lecture TOURNE, et
     l'API ne peut ni lire autre chose ni ouvrir un devis sans ces colonnes.
     Un devis ouvert avec les liens de la LISTE (sans `description`), ou une
     lecture qui prenait le budget pour le texte, passaient tous les
     contrôles (relecture des contrôles du 29/10/2026, F16 et F17). */
  {
    const API_TEXTE = sansCommentairesJs(lire('src/lib/api.js'));
    const o = D.originesDuDevis({
      demande: { created_at: '2026-10-29T08:00:00Z', budget: '500-1000', description: 'Ouvrir un mur porteur' },
      urgence: { created_at: '2026-10-29T09:00:00Z', probleme_label: 'Plus de courant', details: 'Le disjoncteur saute' },
    });
    const liste = D.originesDuDevis({ demande: { created_at: 'x', budget: null }, urgence: { created_at: 'y' } });
    verifier('`originesDuDevis` : le texte de la demande est sa DESCRIPTION, celui de l’urgence « problème — ce qu’elle a écrit » ; sans la colonne, `null`',
      o.demande.texte === 'Ouvrir un mur porteur' && o.demande.budget === '500-1000'
        && o.demande.createdAt === '2026-10-29T08:00:00Z'
        && o.urgence.texte === 'Plus de courant — Le disjoncteur saute' && o.urgence.createdAt === '2026-10-29T09:00:00Z'
        && liste.demande.texte === null && liste.urgence.texte === null
        && json(D.originesDuDevis({})) === json({ demande: null, urgence: null }), json(o));
    verifier('…le devis OUVERT joint la description et le problème, la LISTE non (200 devis ne transportent pas 200 textes)',
      /demande:quote_request_id\(created_at, budget, description\)/.test(D.LIENS_DU_DEVIS_OUVERT)
        && /urgence:sos_request_id\(created_at, probleme_label, details\)/.test(D.LIENS_DU_DEVIS_OUVERT)
        && !/description|details|probleme_label/.test(D.LIENS_DU_DEVIS));
    const unDevisApi = corpsDeFonction(API_TEXTE, 'unDevisSupabase') || '';
    /* `rowToDevis` vit dans `devis.js` depuis la relecture CONTROLES-5 du lot
       2a : `node` la fait tourner (section 35 ter) ; ici, sa forme. */
    const versDevis = corpsDeFonction(sansCommentairesJs(lire('src/lib/devis.js')), 'rowToDevis') || '';
    verifier('…et l’API s’en sert : `unDevis` lit `LIENS_DU_DEVIS_OUVERT`, `rowToDevis` passe par `originesDuDevis`, sans liens à elle',
      /\.select\(`\$\{LIENS_DU_DEVIS_OUVERT\}, devis_lignes\(\*\), `/.test(unDevisApi)
        && /\.\.\.originesDuDevis\(d\),/.test(versDevis) && !/\bdemande:|\burgence:/.test(versDevis)
        && !/const LIENS_DU_DEVIS/.test(API_TEXTE) && !/quote_request_id\(/.test(API_TEXTE.replace(/\.select\('[^']*'\)/g, '')),
      `${unDevisApi.slice(0, 120)} | ${versDevis.slice(0, 120)}`);
  }
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
     an » dit aussi « opposition » (loi n° 71-584, art. 2).

     LE MODULE, C'EST AUSSI SES ÉCRANS (cahier §6.1-32) — et le premier jet ne
     relisait que `devis.js` : l'aide de l'interrupteur « Retenue de
     garantie » (`SaisieDevisScreen`, un ATTRIBUT JSX) disait « rendus un an
     après la réception » sans l'opposition, s'affichait SEULE quand la
     retenue était éteinte, et ce contrôle passait au vert (relecture
     « conformité » des étapes 4 à 7, bloquant 1). On relit donc les chaînes
     de chaque fichier du module, écrans compris : les littéraux ('…', "…" —
     donc les attributs JSX —, les textes de gabarit), RECOUSUS quand ils sont
     concaténés par `+`, et le texte JSX entre deux balises. Sans les
     commentaires : une explication qui cite la faute ne la commet pas. */
  const FICHIERS_DU_MODULE = ['src/lib/devis.js', 'src/lib/centimes.js', 'src/lib/file-ecriture.js',
    'src/data/devis-demo.js', 'src/screens/SaisieDevisScreen.js', 'src/screens/DevisScreen.js',
    'src/components/CarteLigne.js', 'src/components/EnteteDevis.js', 'src/components/ChampDesignation.js',
    'src/components/ChoixClientDevis.js', 'src/components/ChampMontant.js', 'src/components/ConditionsDevis.js'];
  const UN_AN = /(?<![\p{L}\d])un an(?![\p{L}])/u;
  const phrasesDe = (src) => {
    const recousu = sansCommentairesJs(src).replace(/(['"`])\s*\+\s*(['"`])/g, '');
    const litteraux = [...recousu.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)]
      .map((m) => m[1] ?? m[2] ?? m[3]);
    const textesJsx = [...recousu.matchAll(/>([^<>{}=;()]*[\p{L}][^<>{}=;()]*)</gu)].map((m) => m[1]);
    return [...litteraux, ...textesJsx];
  };
  const phrasesModule = FICHIERS_DU_MODULE.flatMap((f) => phrasesDe(lire(f)).map((p) => ({ f, p })));
  const exportees = Object.values(D).flatMap((v) => (typeof v === 'string' ? [v] : (v && typeof v === 'object' ? Object.values(v) : [])))
    .filter((v) => typeof v === 'string').map((p) => ({ f: 'devis.js (export)', p }));
  const sansReserve = [...phrasesModule, ...exportees].filter(({ p }) => UN_AN.test(p) && !/opposition/.test(p));
  const ecransLus = FICHIERS_DU_MODULE.filter((f) => /screens|components/.test(f))
    .every((f) => phrasesDe(lire(f)).length > 3);
  verifier('toute phrase du module — ses ÉCRANS compris, attributs JSX et texte entre balises — qui dit « un an » dit aussi '
    + '« opposition » : jamais la durée sans sa réserve',
    phrasesModule.length > 300 && ecransLus && sansReserve.length === 0 && UN_AN.test(D.PHRASE_RETENUE)
    /* Depuis le lot 2a, la retenue se règle dans la carte « Conditions » :
       c'est elle qui porte l'aide « un an ». */
    && phrasesDe(lire('src/components/ConditionsDevis.js')).some((p) => UN_AN.test(p)),
    sansReserve.map(({ f, p }) => `${f} : « ${p.slice(0, 90)} »`).join(' | ') || `${phrasesModule.length} phrases lues`);
  /* Et, depuis la relecture CONTROLES-11 du lot 2a : la caution est
     « personnelle et solidaire » (art. 1er al. 4), et l'opposition se notifie
     AU CONSIGNATAIRE (ou à la caution), par lettre recommandée (art. 2) —
     sans le destinataire, l'artisan pouvait croire qu'une lettre à LUI
     suffisait. « Un an après la RÉCEPTION des travaux » : le sabotage J12
     (« un an après la signature ») passait au vert, la phrase n'étant
     contrôlée que par la présence d'« opposition ». La forme ENTIÈRE est
     exigée plus bas (« LES AIDES DE DROIT, MOT POUR MOT »). Et, depuis la
     contre-vérification du lot 2a : « la caution est LIBÉRÉE » — l'art. 2
     nomme deux cas, et « Elle vous revient … (ou à la caution) » disait
     qu'une somme revient là où, avec une caution, rien n'a été retenu. */
  verifier('`PHRASE_RETENUE` : au plus 5 %, le consignataire, la caution « personnelle et solidaire » d’une « société de '
    + 'caution mutuelle » — pas une caution « bancaire » seule —, un an après la RÉCEPTION, sauf opposition notifiée AU '
    + 'CONSIGNATAIRE (ou à la caution) par lettre recommandée', /5\u00a0%/.test(D.PHRASE_RETENUE)
    && /consignataire/.test(D.PHRASE_RETENUE)
    && /société de caution mutuelle/.test(D.PHRASE_RETENUE) && /établissement financier habilité/.test(D.PHRASE_RETENUE)
    && !/bancaire/.test(D.PHRASE_RETENUE) && /lettre recommandée/.test(D.PHRASE_RETENUE)
    && /caution personnelle et solidaire/.test(D.PHRASE_RETENUE)
    && /un an après la réception des travaux/.test(D.PHRASE_RETENUE)
    && /notifié au consignataire \(ou à la caution\), par lettre recommandée, une opposition motivée/.test(D.PHRASE_RETENUE)
    && /La somme retenue vous revient \(ou la caution est libérée\) un an après la réception des travaux/.test(D.PHRASE_RETENUE)
    && !/Elle vous revient/.test(D.PHRASE_RETENUE),
    D.PHRASE_RETENUE);
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
  verifier('\u00ab 0 \u00bb est refus\u00e9 comme \u00ab 6 % \u00bb (`devis_retenue_check`) \u2014 et sa phrase (`erreurs.js`, \u00e9tape 4) dit les DEUX '
    + 'bornes (0,01 % et 5 %) et \u00ab laissez vide \u00bb pour une retenue absente',
  D.versCentiemes('0').centiemes === 0 && D.validerDevis({ retenueGarantieCentiemes: 0 }).contrainte === 'devis_retenue_check'
    && phraseRetenue !== null && /0,01\u00a0?%/.test(phraseRetenue) && /\b5\u00a0?%/.test(phraseRetenue) && /vide/i.test(phraseRetenue),
  phraseRetenue || '(absente : `MESSAGES_CONTRAINTE.devis_retenue_check` manque)');
  verifier('`ESPACES_CODE_POSTAL` : les espaces ASCII, U+00A0 et U+202F, et RIEN d\u2019autre \u2014 retir\u00e9s si et seulement s\u2019ils sont '
    + 'dans la classe (\u00ab 13 410 \u00bb en U+2002 est refus\u00e9, comme la base le refusera)',
    D.ESPACES_CODE_POSTAL === CLASSE && ecarts.length === 0
    && D.validerDevis({ lieuCodePostal: '13\u2002410' }).contrainte === 'devis_lieu_code_postal_check',
    `classe ${json(D.ESPACES_CODE_POSTAL)} ; \u00e9carts ${ecarts.join(', ') || '\u2014'}`);
}

console.log('\n  7. la démonstration — elle fait VIVRE le mécanisme, sans `.env`');
{
  /* Le cahier, §4.3 et §6.1-7 : sans fichier `.env`, la démonstration est
     le SEUL endroit où l'écran de saisie s'essaie ici. Si elle ne portait
     ni deux taux, ni option, ni « Offert », ni de quoi nourrir la mémoire,
     ces chemins ne se verraient nulle part — et ne se vérifieraient pas.
     On REFAIT le calcul sur ses données, et on fait tourner sa base. */
  const maintenant = new Date();
  const jeu = DEMO.fabriquerDevisDemo(maintenant);
  const srcDemo = sansCommentairesJs(lire('src/data/devis-demo.js'));
  const fabrique = corpsDeFonction(srcDemo, 'fabriquerDevisDemo') || '';
  const totauxEcrits = [
    ...jeu.devis.flatMap((d) => Object.keys(d).filter((k) => /total/i.test(k)).map((k) => `${d.objet}.${k}`)),
    ...jeu.lignes.flatMap((l) => Object.keys(l).filter((k) => /total/i.test(k)).map((k) => `${l.designation}.${k}`)),
  ];
  verifier('aucun total n’est écrit dans les données de démonstration : ni dans ce que `fabriquerDevisDemo` rend, ni dans son texte',
    fabrique.length > 500 && totauxEcrits.length === 0 && !/total/i.test(fabrique), totauxEcrits.join(', ') || '—');
  const parDevis = jeu.devis.map((d) => ({ d, t: D.totauxDevis(jeu.lignes.filter((l) => l.devisId === d.id)) }));
  verifier('chaque devis de démonstration est recevable, et son total N’EST PAS nul (`totauxDevis`, refait ici)',
    parDevis.length >= 2 && parDevis.every(({ t }) => t.ok && t.ttc > 0),
    parDevis.map(({ d, t }) => `${d.objet} : ${t.ok ? `${t.ht} | ${t.tva} | ${t.ttc}` : t.contrainte}`).join(' ; '));
  const deuxTaux = parDevis.filter(({ t }) => t.ok && t.ventilation.filter((v) => v.nbLignes > 0).length >= 2);
  const offerts = jeu.lignes.filter((l) => l.offert === true && D.valeurLigne(l) > 0 && D.totalLigne(l) === 0);
  const options = jeu.lignes.filter((l) => l.type === 'option' && D.valeurLigne(l) > 0);
  const titres = ['zone', 'piece', 'reserve'].filter((ty) => jeu.lignes.some((l) => l.type === ty));
  const piece = jeu.lignes.find((l) => l.type === 'piece');
  verifier('…à DEUX taux, avec une option, un « Offert » QUI GARDE SA VALEUR (total 0, valeur > 0), une zone, une pièce '
    + 'avec ses surfaces, une réserve, une main-d’œuvre à l’heure et une « fourniture non comprise »',
  deuxTaux.length >= 1 && offerts.length >= 1 && options.length >= 1 && titres.length === 3
    && piece && piece.surfaceSolMilliemes > 0 && piece.surfaceMursMilliemes > 0
    && jeu.lignes.some((l) => l.mainOeuvre === true && l.unite === 'h')
    && jeu.lignes.some((l) => l.fournitureNonComprise === true),
  `deux taux : ${deuxTaux.length} devis ; offerts : ${offerts.map((l) => D.valeurLigne(l)).join(', ')} ; options : ${options.length} ; titres : ${titres.join(', ')}`);
  /* La mémoire, sur « chape » : 52 € et 45 € sont la MÊME phrase, au m²,
     fourniture comprise — UNE proposition qui porte les deux, 52 € (le plus
     récent) d'abord ; la variante sans la fourniture (38 €) en est une
     autre. DEUX propositions (la réponse du 23/10, lot P), et aucun prix ne
     vaut la moyenne de deux autres. */
  const base = DEMO.creerBaseDevisDemo({ maintenant: () => maintenant });
  const memoire = await base.memoire('1');
  const chape = D.memoireDesLignes(memoire, 'chape');
  const prixChape = chape.map((s) => `${(s.prix || []).map((p) => p.prixUnitaireCentimes).join('+')}${s.fournitureNonComprise ? '/sans fourniture' : ''}`).sort();
  verifier('la mémoire de démonstration, sur « chape », rend DEUX propositions : 52 € puis 45 € dans la même, et la variante '
    + '« fourniture non comprise » à 38 € — jamais une moyenne', chape.length === 2
    && json(prixChape) === json(['3800/sans fourniture', '5200+4500'])
    && !chape.some((s) => (s.prix || []).some((p) => p.prixUnitaireCentimes === 4850))
    && chape.every((s) => (s.prix || []).every((p) => p.origine && p.origine.objet && p.origine.date)),
  json(prixChape));
  /* « moi » vaut 1 (un nombre) dans les données et '1' (une chaîne) pour
     `Object.keys()` : la base de démonstration compare par `String()`. */
  const l1 = await base.liste(1);
  const l1s = await base.liste('1');
  const autre = await base.liste('2');
  verifier('les `proId` se comparent par `String()` : `1` et `\'1\'` voient les mêmes devis, une autre fiche n’en voit aucun',
    l1.length === jeu.devis.length && l1s.length === l1.length && autre.length === 0
    && /String\(\s*d\.proId\s*\)\s*===\s*String\(\s*proId\s*\)/.test(srcDemo),
  `1 → ${l1.length}, '1' → ${l1s.length}, '2' → ${autre.length}`);
  const ecarts = [];
  for (const d of l1) {
    const t = await base.relireTotaux('1', d.id);
    const refait = D.totauxDevis(jeu.lignes.filter((l) => l.devisId === d.id));
    if (!(t && t.ht === refait.ht && t.tva === refait.tva && t.ttc === refait.ttc
      && json(t.ventilation) === json(refait.ventilation.filter((v) => v.nbLignes > 0)))) ecarts.push(d.objet);
  }
  verifier('les totaux que la base de démonstration rend sont ceux que `totauxDevis` REFAIT sur ses lignes (ventilation comprise)',
    ecarts.length === 0, ecarts.join(', '));
  const martin = jeu.devis.find((d) => d.clientId === 'cl-martin');
  const fiche = (await import('../src/data/demo.js')).initialClients.find((c) => c.id === 'cl-martin');
  verifier('un devis est LIÉ à une fiche du carnet (Mme Martin), le lieu des travaux COPIÉ de son adresse ; un autre est sans client',
    Boolean(martin && fiche && martin.lieuAdresse === fiche.adresse && martin.lieuCodePostal === fiche.codePostal
      && martin.lieuVille === fiche.ville && martin.source === 'manuelle')
    && jeu.devis.some((d) => d.clientId === null) && (l1.find((d) => d.clientId === 'cl-martin') || {}).client?.nom === fiche.nom);
  /* La demande se lie par le GESTE : elle est « en attente » dans les
     données, « Faire un devis » n'apparaît qu'une fois acceptée, et la
     base de démonstration vérifie qu'elle vous est adressée (OP013). */
  const demandes = (await import('../src/data/demo.js')).initialDemandesRecues;
  const dr = demandes.find((d) => d.id === 'dr-devis-1');
  const acceptee = dr ? { ...dr, statut: 'accepte' } : null;
  const base2 = DEMO.creerBaseDevisDemo({ maintenant: () => maintenant, demandeDe: (g, id) => (acceptee && g === 'devis' && id === acceptee.id ? acceptee : null) });
  const ouverture = acceptee ? D.devisDepuisDemandeEtFiche(acceptee, { id: 'cl-martin', nom: 'Mme Martin' }, { ville: 'Lambesc' }) : null;
  let lien = null;
  if (ouverture) {
    await base2.ecrire('1', { quoi: 'devis', action: 'inserer', id: 'de0000ff-0000-4000-8000-000000000001', valeurs: { ...ouverture }, generation: Date.now() });
    lien = (await base2.liste('1')).find((d) => d.id === 'de0000ff-0000-4000-8000-000000000001');
  }
  verifier('la demande de démonstration se lie PAR LE GESTE : « en attente » dans les données (aucun lien truqué), « Faire un devis » '
    + 'une fois acceptée, et le brouillon dit « depuis une demande du … » avec une date calculée',
  Boolean(dr && dr.statut === 'en_attente' && !D.peutFaireUnDevis(dr) && D.peutFaireUnDevis(acceptee)
    && lien && lien.quoteRequestId === 'dr-devis-1' && /^depuis une demande du \d{2}\/\d{2}\/\d{4}$/.test(D.origineLisible(lien) || '')
    /* …avec la FICHE et le lieu (29/10/2026), et le texte de la demande
       LU PAR LE LIEN, comme `api.unDevis` le joint — jamais dans l'objet. */
    && lien.clientId === 'cl-martin' && lien.lieuVille === 'Lambesc' && !lien.objet
    && D.texteDeLaDemande(lien) === acceptee.titre)
    && !jeu.devis.some((d) => d.quoteRequestId || d.sosRequestId),
  lien ? D.origineLisible(lien) : '(pas de brouillon)');
  /* Des dates CALCULÉES : un jeu fabriqué à deux heures différentes ne
     porte pas les mêmes dates — une date figée vieillirait. */
  const plusTard = DEMO.fabriquerDevisDemo(new Date(maintenant.getTime() + 3600e3));
  verifier('les dates de démonstration sont CALCULÉES depuis l’heure où l’on regarde, jamais écrites en dur',
    jeu.devis.every((d, i) => d.modifieLe !== plusTard.devis[i].modifieLe)
    && !/['"]20\d\d-\d\d-\d\dT/.test(fabrique));
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
  /* Un TROISIÈME import depuis le lot P : `./rapprochement.js`, la clé de
     rapprochement — un fichier qui n'importe RIEN (`verifier-postes` A le
     tient), donc `node` sait toujours faire tourner `devis.js`. */
  verifier('`devis.js` importe EXACTEMENT `./centimes.js` (`centimesLisibles`, `versCentimes` — lot 2a), `./entreprise.js` (`dateFrancaise`, `isoLisible`) '
    + 'et `./rapprochement.js` (`aPlat`, `cleDeRapprochement` — lot P) — trois instructions, aucune autre forme (ni import nu, ni '
    + 'réexportation, ni `import()`)',
  imps.length === 3 && json(imps.find((x) => x.de === './centimes.js')) === json({ de: './centimes.js', noms: ['centimesLisibles', 'versCentimes'] })
    && json(imps.find((x) => x.de === './entreprise.js')) === json({ de: './entreprise.js', noms: ['dateFrancaise', 'isoLisible'] })
    && json(imps.find((x) => x.de === './rapprochement.js')) === json({ de: './rapprochement.js', noms: ['aPlat', 'cleDeRapprochement'] })
    && json(modulesDe(srcDevis).sort()) === json(['./centimes.js', './entreprise.js', './rapprochement.js'])
    && instructionsDImport(srcDevis) === 3
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
  /* ---- la requête tardive (section 49.5 bis, étape 3) : le NUMÉRO ---- */
  /* x. chaque écriture porte un numéro qui MONTE, au-dessus de l'horloge lue
     à l'ouverture et de l'heure du téléphone ; jamais parmi les valeurs ;
     une suppression porte la condition, plus grande que tout ce qui précède. */
  await essayerCas(async () => {
    const b = fausseBase();
    let heure = 1000;
    const f = fabriquer(b, { horloge: 5000, horlogeTelephone: () => heure });
    f.ligne(ligne('A'));
    f.ligne(ligne('B', { ordre: 2000 }));
    await f.attendre(300);
    heure = 9000;
    f.modifierLigne('A', { prixUnitaireCentimes: 4600 });
    await f.attendre(300);
    f.retirerLigne('B');
    await f.attendre(300);
    const nums = b.journal.map((o) => (o.action === 'supprimer' ? o.generationMax : o.generation));
    const b2 = fausseBase();
    const f2 = fabriquer(b2, { horlogeTelephone: () => 7000 });
    f2.ligne(ligne('A'));
    await f2.attendre(300);
    verifier('chaque écriture porte un NUMÉRO qui monte : au-dessus de l’horloge lue à l’ouverture (5001, 5002, 5003), puis de '
      + 'l’heure du téléphone (9000, 9001) ; une suppression porte sa CONDITION, plus grande que tout ce qui précède ; jamais parmi les valeurs',
    json(resume(b)) === json(['inserer devis', 'inserer ligne A', 'inserer ligne B', 'modifier ligne A', 'supprimer ligne B'])
      && json(nums) === json([5001, 5002, 5003, 9000, 9001])
      && b.journal.every((o) => !o.valeurs || !('generation' in o.valeurs))
      && b.journal.filter((o) => o.action !== 'supprimer').every((o) => Number.isSafeInteger(o.generation))
      && f.horloge().dernier === 9001
      && json(b2.journal.map((o) => o.generation)) === json([7000, 7001]),
    `${json(resume(b))} ${json(nums)} ; ${json(b2.journal.map((o) => o.generation))}`);
  });
  /* y. une ligne relue en base PORTE son numéro : il ne repart jamais comme
     une valeur (la base refuserait l'ancien numéro). */
  await essayerCas(async () => {
    const b = fausseBase();
    const f = fabriquer(b, { devisEnBase: true, horloge: 40, lignesEnBase: [ligne('A', { generation: 40 })], horlogeTelephone: () => 0 });
    f.modifierLigne('A', { designation: 'Chape fluide' });
    await f.attendre(300);
    const m = b.journal[0];
    verifier('une ligne relue en base porte son numéro : la modification n’envoie QUE ce qui change, et un numéro neuf (41) à côté',
      b.journal.length === 1 && json(m.valeurs) === json({ designation: 'Chape fluide' }) && m.generation === 41,
      json(b.journal.map((o) => ({ v: o.valeurs, g: o.generation }))));
  });
  /* z. une ligne dont l'INSERTION est partie sans réponse, puis retirée :
     l'horloge du devis MONTE d'abord (une modification du devis, sans
     valeur), puis la suppression part, conditionnée au-dessus — l'insertion
     en retard est alors refusée par la base. Une ligne CONFIRMÉE puis
     retirée : pas de levée. */
  await essayerCas(async () => {
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.id === 'A' && op.action === 'inserer', pendre: true });
    const f = fabriquer(b, { devisEnBase: true, horlogeTelephone: () => 0 });
    f.ligne(ligne('A'));
    await f.attendre(300);
    const apres = f.etatDe('A');
    f.retirerLigne('A');
    await f.attendre(300);
    const lev = b.journal.find((o) => o.lever);
    const sup = b.journal.find((o) => o.action === 'supprimer');
    const ins = b.journal.find((o) => o.action === 'inserer');
    const b2 = fausseBase();
    const f2 = fabriquer(b2, { devisEnBase: true });
    f2.ligne(ligne('A'));
    await f2.attendre(300);
    f2.retirerLigne('A');
    await f2.attendre(300);
    verifier('une insertion SANS RÉPONSE puis la ligne retirée : la file LÈVE l’horloge (modifier le devis, sans valeur, n° plus '
      + 'grand), PUIS supprime au-dessus ; une ligne confirmée puis retirée : aucune levée',
    apres === 'echec' && json(resume(b)) === json(['inserer ligne A', 'modifier devis', 'supprimer ligne A'])
      && lev && lev.quoi === 'devis' && json(lev.valeurs) === json({}) && lev.generation > ins.generation
      && sup && sup.generationMax > lev.generation && f.etatDe('A') === null
      && json(resume(b2)) === json(['inserer ligne A', 'supprimer ligne A']),
    `${apres} ${json(resume(b))} ; ${json(resume(b2))}`);
  });
  /* aa. un refus OP015 de l'écriture EN COURS : un autre appareil a écrit
     plus haut. La file relit l'horloge, la ligne est « echec » (avec
     l'erreur), et « Réessayer » repart AU-DESSUS de l'horloge relue. */
  await essayerCas(async () => {
    const b = fausseBase();
    b.devis.set('D1', { source: 'manuelle', generation: 99999 });
    b.lignes.set('A', { ...ligne('A'), devisId: 'D1' });
    b.commandes.push({ quand: (op) => op.id === 'A' && op.action === 'modifier',
      erreur: Object.assign(new Error('Ce devis a reçu entre-temps une modification plus récente'), { code: 'OP015' }) });
    const f = fabriquer(b, { devisEnBase: true, horloge: 10, lignesEnBase: [ligne('A')], horlogeTelephone: () => 0 });
    f.modifierLigne('A', { prixUnitaireCentimes: 5000 });
    await f.attendre(300);
    const apres = [f.etatDe('A'), f.erreurDe('A') && f.erreurDe('A').code, f.horloge().plancher];
    f.reessayer('A');
    await f.attendre(300);
    const essais = b.journal.filter((o) => o.id === 'A');
    verifier('un refus OP015 : la file RELIT l’horloge (99 999), la ligne est « echec » ; « Réessayer » repart au-dessus (100 000) '
      + 'et s’enregistre — écraser l’autre appareil est un choix de l’artisan, pas de la file',
    json(apres) === json(['echec', 'OP015', 99999]) && essais.length === 2 && essais[0].generation === 11
      && essais[1].generation === 100000 && f.etatDe('A') === 'enregistree' && b.lignes.get('A').prixUnitaireCentimes === 5000,
    `${json(apres)} ${json(essais.map((o) => o.generation))}`);
  });
  /* bb. un refus OP015 de la SUPPRESSION du brouillon : comme pour une ligne,
     la file relit l'horloge — sans elle, « Supprimer » échouait de nouveau
     tant qu'on n'avait pas rouvert le devis (relecture « données » des
     étapes 4 à 7, mineur 1). */
  await essayerCas(async () => {
    const b = fausseBase();
    b.devis.set('D1', { source: 'manuelle', generation: 88888 });
    b.commandes.push({ quand: (op) => op.quoi === 'devis' && op.action === 'supprimer',
      erreur: Object.assign(new Error('Ce devis a reçu entre-temps une modification plus récente'), { code: 'OP015' }) });
    const f = fabriquer(b, { devisEnBase: true, horloge: 10, horlogeTelephone: () => 0 });
    let erreur = null;
    try { await f.supprimerDevis(); } catch (e) { erreur = e; }
    const plancher = f.horloge().plancher;
    let secondeFois = null;
    try { await f.supprimerDevis(); } catch (e) { secondeFois = e; }
    const sup = b.journal.filter((o) => o.quoi === 'devis' && o.action === 'supprimer');
    verifier('un refus OP015 de la SUPPRESSION du brouillon : la file RELIT l’horloge (88 888) ; la seconde suppression part '
      + 'au-dessus (88 889) et passe', erreur && erreur.code === 'OP015' && plancher === 88888 && !secondeFois
      && sup.length === 2 && sup[1].generationMax > 88888 && f.devisEnBase() === false,
    `${erreur && erreur.code} plancher ${plancher} ; ${json(sup.map((o) => o.generationMax))} ; ${secondeFois && secondeFois.message}`);
  });
  /* cc. un refus OP016 (numéro absent ou hors bornes, 49.5 bis point 7 —
     relecture de l'étape 3) n'est PAS un autre appareil : « echec », et la
     file ne relit PAS l'horloge ; et une horloge lue au-delà de NUMERO_MAX
     n'est pas un plancher (la base ne l'accepte plus). */
  await essayerCas(async () => {
    const b = fausseBase();
    b.devis.set('D1', { source: 'manuelle', generation: 99999 });
    b.lignes.set('A', { ...ligne('A'), devisId: 'D1' });
    b.commandes.push({ quand: (op) => op.id === 'A' && op.action === 'modifier',
      erreur: Object.assign(new Error('Cette version d’Opus n’envoie pas de numéro d’écriture valable'), { code: 'OP016' }) });
    const f = fabriquer(b, { devisEnBase: true, horloge: 10, lignesEnBase: [ligne('A')], horlogeTelephone: () => 0 });
    f.modifierLigne('A', { prixUnitaireCentimes: 5000 });
    await f.attendre(300);
    const apres = [f.etatDe('A'), f.erreurDe('A') && f.erreurDe('A').code, f.horloge().plancher];
    const auBord = fabriquer(fausseBase(), { horloge: F.NUMERO_MAX }).horloge().plancher;
    const auDela = fabriquer(fausseBase(), { horloge: F.NUMERO_MAX + 2 }).horloge().plancher;
    verifier('un refus OP016 : la ligne est « echec », et l’horloge N’EST PAS relue (le plancher reste 10, pas 99 999) ; une horloge '
      + 'au-delà de `NUMERO_MAX` (2^53 − 1) n’est pas un plancher',
    json(apres) === json(['echec', 'OP016', 10]) && F.NUMERO_MAX === Number.MAX_SAFE_INTEGER
      && auBord === F.NUMERO_MAX && auDela === 0, `${json(apres)} ; bord ${auBord} ; au-delà ${auDela}`);
  });
  /* bb. la suppression du brouillon porte sa condition. */
  await essayerCas(async () => {
    const b = fausseBase();
    b.devis.set('D1', { source: 'manuelle' });
    const f = fabriquer(b, { devisEnBase: true, horloge: 70, horlogeTelephone: () => 0 });
    f.devis({ objet: 'Cuisine' });
    await f.attendre(300);
    await f.supprimerDevis();
    const m = b.journal.find((o) => o.action === 'modifier');
    const s = b.journal.find((o) => o.action === 'supprimer');
    verifier('l’en-tête porte son numéro (71), et la suppression du brouillon sa condition (72) : partie tard, après une retouche, '
      + 'elle ne supprime rien', m && m.generation === 71 && s && s.generationMax === 72, json(b.journal.map((o) => [o.action, o.generation, o.generationMax])));
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
/*  B. LE SCHÉMA — la section 49, lue sans ses commentaires            */
/* ================================================================== */
console.log('\nB. LE SCHÉMA — la section 49 (texte sans commentaires), `mes_donnees()`, et ce qui les entoure');
const SCHEMA = lire('supabase/schema.sql');
/* LES IDENTIFIANTS ENTRE GUILLEMETS SONT « DÉPLIÉS » avant toute recherche —
   relecture des essais de l'étape 3 (I-2) : `public."devis_lignes"` est la
   même table que `public.devis_lignes`, et une fonction qui l'écrivait ainsi
   lisait les prix d'un autre artisan sans un ✘ (prouvé : B lisait 86 545 c,
   la somme des prix de A). Seuls les noms en minuscules sont dépliés : un
   nom entre guillemets avec une majuscule est un AUTRE objet. */
const deplier = (t) => t.replace(/"([a-z_][a-z0-9_]*)"/g, '$1');
/* Le SQL sans ses chaînes (contenu remplacé par des blancs) : pour chercher
   une référence NON qualifiée après une virgule, sans tomber sur une phrase
   française (« Votre demande, devis… »). */
const sansChaines = (t) => t.replace(/'(?:[^']|'')*'/g, (m) => `'${' '.repeat(Math.max(0, m.length - 2))}'`);
const SQL = deplier(sansCommentairesSql(SCHEMA));
/* LES FONCTIONS, SOUS LEURS TROIS FORMES DE CORPS (relecture des essais de
   l'étape 3, I-2) : `as $…$ … $…$`, et les deux corps SQL STANDARD
   (PostgreSQL 14+) — `begin atomic … end` et `return …;`. Le premier lecteur
   ne connaissait que la première : une fonction `begin atomic` qui lisait
   les prix lui échappait entièrement (prouvé). Et dans N'IMPORTE QUEL
   schéma : un nom en trop dans la liste fermée rougit, d'où qu'il vienne. */
/* …PUIS UNE QUATRIÈME FORME, ET LES PROCÉDURES (relecture des essais de
   l'étape 3, 2e tour) : un corps entre APOSTROPHES (`as 'select …'`, la forme
   d'avant les dollars, toujours acceptée) et une `create procedure` passaient
   ce lecteur — une `definer` de l'une ou l'autre forme rendait à B les prix
   de A (N7c, N8, prouvé : 86 545 c). Et `public . nom`, espacé autour du
   point, est le même nom. Ce lecteur n'en sera jamais complet : c'est l'essai
   (cas 27) qui tient la propriété, par le catalogue. */
function lireFonctions(sql) {
  const res = [];
  const debut = /create\s+(?:or\s+replace\s+)?(?:function|procedure)\s+((?:\w+\s*\.\s*)?\w+)\s*\(/gi;
  let m;
  while ((m = debut.exec(sql))) {
    const base = m.index + m[0].length;
    const apres = sql.slice(base);
    const dollar = /\bas\s+(\$\w*\$)/i.exec(apres);
    const atomique = /\bbegin\s+atomic\b/i.exec(apres);
    const retour = /\breturn\s/i.exec(apres);
    const apostrophe = /\bas\s+([eE]?)'/.exec(apres);
    const qualifie = m[1].replace(/\s+/g, '');
    const nom = qualifie.split('.').pop();
    const schema = qualifie.includes('.') ? qualifie.split('.')[0] : 'public';
    const premier = [dollar, atomique, retour, apostrophe].filter(Boolean).sort((a, b) => a.index - b.index)[0];
    if (!premier) continue;
    let corps; let fin;
    if (premier === apostrophe) {
      /* La chaîne lue jusqu'à son apostrophe fermante (`''` est une
         apostrophe écrite ; `\'` aussi dans un `E'…'`), puis dédoublée. */
      const echappe = apostrophe[1] !== '';
      let j = apostrophe.index + apostrophe[0].length;
      const cDebut = j;
      while (j < apres.length) {
        if (echappe && apres[j] === '\\') { j += 2; continue; }
        if (apres[j] === "'" && apres[j + 1] === "'") { j += 2; continue; }
        if (apres[j] === "'") break;
        j += 1;
      }
      corps = apres.slice(cDebut, j).replace(/''/g, "'"); fin = j + 1;
    } else if (premier === dollar) {
      const cDebut = dollar.index + dollar[0].length;
      const cFin = apres.indexOf(dollar[1], cDebut);
      if (cFin < 0) continue;
      corps = apres.slice(cDebut, cFin); fin = cFin + dollar[1].length;
    } else if (premier === atomique) {
      const cDebut = atomique.index + atomique[0].length;
      const mots = /\b(case|begin|end)\b/gi; mots.lastIndex = cDebut;
      let p = 1; let w; fin = apres.length;
      while ((w = mots.exec(apres))) {
        if (/^end$/i.test(w[1])) { p -= 1; if (p === 0) { fin = w.index + w[0].length; break; } } else p += 1;
      }
      corps = apres.slice(cDebut, fin);
    } else {
      fin = apres.indexOf(';', retour.index); if (fin < 0) fin = apres.length;
      corps = apres.slice(retour.index, fin);
    }
    res.push({ nom, schema, attributs: apres.slice(0, premier.index), corps, index: m.index, fin: base + fin });
    debut.lastIndex = base + fin;
  }
  return res;
}
const FONCTIONS = lireFonctions(SQL);
const TABLES_CREEES = /create\s+table\s+(if\s+not\s+exists\s+)?public\.devis\s*\(/i.test(SQL);
const corpsDe = (nom) => FONCTIONS.filter((f) => f.nom === nom).map((f) => f.corps).join('\n');
const fonctionDe = (nom) => FONCTIONS.find((f) => f.nom === nom) || null;
const sansEspaces = (t) => (t || '').replace(/\s+/g, ' ').trim();
/* LES DROITS DE COLONNE de la section 49.7 (lot 2a) : ce que
   `authenticated` peut CRÉER et MODIFIER, colonne par colonne. Une liste
   écrite ici une fois, comparée au schéma (section 22) ET à ce que
   l'application envoie (`devisVersBase`, `ligneVersBase`, plus le numéro
   d'écriture que `ecrireDevisSupabase` pose à côté — section 27). */
const CONDITIONS_2A = ['remise_centiemes', 'remise_centimes', 'acompte_centiemes', 'acompte_centimes', 'acompte_nature', 'validite_jours'];
const ENTETE_DEVIS = ['client_id', 'quote_request_id', 'sos_request_id', 'objet', 'lieu_adresse', 'lieu_code_postal', 'lieu_ville',
  'delai_execution', 'retenue_garantie_centiemes', ...CONDITIONS_2A];
const COLONNES_LIGNE = ['ordre', 'type', 'designation', 'quantite_milliemes', 'unite', 'prix_unitaire_centimes', 'taux_tva_centiemes',
  'offert', 'main_oeuvre', 'fourniture_non_comprise', 'surface_sol_milliemes', 'surface_murs_milliemes'];
const DROITS_DE_COLONNE = {
  'insert devis': ['id', 'pro_id', 'source', ...ENTETE_DEVIS, 'generation'],
  'update devis': [...ENTETE_DEVIS, 'generation'],
  'insert devis_lignes': ['id', 'devis_id', ...COLONNES_LIGNE, 'generation'],
  'update devis_lignes': [...COLONNES_LIGNE, 'generation'],
};

/* LA SECTION 49, ET ELLE SEULE : du titre « 49. LE CHIFFRAGE » au PROCHAIN
   titre de section, relevés dans le texte brut — les titres sont des
   commentaires —, puis lue sans ses commentaires.
   AU PROCHAIN TITRE, ET PLUS « AU TITRE 42 » (lot P, 23/10/2026) : la
   section 50 (la base de postes) se pose entre la 49 et l'export. Découpée
   jusqu'à la 42, la « section 49 » emportait la 50 — cinq contraintes de
   plus, un quatrième déclencheur, la phrase d'OP018 —, et quatre
   vérifications rougissaient sur du code juste (mesuré). Et il y a DEUX
   découpes dans ce fichier (celle-ci, et celle des phrases de `REFUS_DEVIS`
   plus bas) : n'en corriger qu'une en laissait une rouge. Un titre de
   section, c'est « -- », deux espaces, un nombre, un point, une espace : un
   sous-titre (« 49.1 », « 49.5 bis ») a un chiffre après le point. Et
   EXACTEMENT deux espaces, comme `sectionDuSchema` (`verifier-emetteur`) :
   les listes numérotées des commentaires (« --    1. … », section 49.5 bis)
   en ont quatre, et le premier jet de cette découpe s'y arrêtait (éprouvé :
   sept vérifications rouges sur une section 49 tronquée). */
const iS48 = SCHEMA.search(/^--\s+48\.\s/m);
const iS49 = SCHEMA.search(/^--\s+49\.\s+LE CHIFFRAGE/m);
const iS42 = SCHEMA.search(/^--\s+42\.\s+L'EXPORT RGPD/m);
const iApresS49 = iS49 >= 0 ? SCHEMA.slice(iS49 + 1).search(/^-- {2}\d+\. /m) : -1;
const iFinS49 = iApresS49 >= 0 ? iS49 + 1 + iApresS49 : -1;
const S49 = iS49 >= 0 && iFinS49 > iS49 ? deplier(sansCommentairesSql(SCHEMA.slice(iS49, iFinS49))) : '';
const TABLES49 = ['devis', 'devis_lignes', 'devis_tva'];
/* Les fonctions que la section 49 CRÉE, par leur nom. */
const NOMS49 = [...new Set([...S49.matchAll(/create\s+or\s+replace\s+function\s+public\.(\w+)\s*\(/gi)].map((m) => m[1]))];

/* Les colonnes d'une table, lues dans son `create table` : nom, type, et
   « not null » (une clé primaire l'est aussi). */
function colonnesDe(table) {
  const m = new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\s*\\(([\\s\\S]*?)\\n\\);`, 'i').exec(S49);
  if (!m) return null;
  const lignes = m[1].split('\n').map((l) => l.trim().replace(/,$/, '')).filter((l) => /^[a-z_]+\s/.test(l) && !/^primary\s+key/i.test(l));
  /* …PLUS les colonnes que la section AJOUTE à une table déjà en place
     (lot 2a, 49.4 bis) : `alter table public.<t> add column if not exists`.
     Une base déjà en place n'a pas d'autre moyen de les recevoir, et le
     `create table` ne les porte pas — il n'est joué que sur une base neuve. */
  const ajoutees = [...S49.matchAll(new RegExp(`alter\\s+table\\s+public\\.${table}\\s+add\\s+column\\s+if\\s+not\\s+exists\\s+([^;]*);`, 'gi'))]
    .map((a) => sansEspacesCol(a[1]));
  return [...lignes, ...ajoutees].map((l) => {
    const [nom, type] = l.split(/\s+/);
    return { nom, type, obligatoire: /\bnot\s+null\b|\bprimary\s+key\b/i.test(l), texte: l };
  });
}
function sansEspacesCol(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
/* Les contraintes `check` posées par la section : `{ table, nom, regle }`. */
const CHECKS49 = [...S49.matchAll(/alter\s+table\s+public\.(\w+)\s+add\s+constraint\s+(\w+)\s+check\s*\(([\s\S]*?)\);\s*(?=alter|comment|create|revoke|grant|drop|$)/gi)]
  .map((m) => ({ table: m[1], nom: m[2], regle: m[3] }));
const regleDe = (nom) => (CHECKS49.find((c) => c.nom === nom) || {}).regle || '';
const listeDe = (nom, colonne) => {
  const m = new RegExp(`${colonne}\\s+in\\s*\\(([^)]*)\\)`, 'i').exec(regleDe(nom));
  return m ? m[1].split(',').map((x) => x.trim().replace(/^'|'$/g, '')) : null;
};

/* LES DIX COLONNES QUE LE LOT 2a AJOUTE à une table déjà en place (49.4
   bis), nommées une par une — lues par la section 12 (la liste fermée des
   colonnes) et par la section 12 bis (les seules `alter table` permises). */
const AJOUTS_2A = [
  'devis: add column if not exists remise_centiemes integer',
  'devis: add column if not exists remise_centimes bigint',
  'devis: add column if not exists acompte_centiemes integer',
  'devis: add column if not exists acompte_centimes bigint',
  'devis: add column if not exists acompte_nature text',
  'devis: add column if not exists validite_jours integer',
  'devis: add column if not exists remise_ht_centimes bigint not null default 0',
  'devis: add column if not exists acompte_ttc_centimes bigint not null default 0',
  'devis: add column if not exists total_ttc_options_centimes bigint not null default 0',
  'devis_tva: add column if not exists remise_centimes bigint not null default 0',
];

console.log('\n  12. les colonnes — une liste FERMÉE');
{
  /* Le cahier §2.2-2.4, plus `generation` (49.5 bis, la parade de la
     requête tardive : son écrivain est la file d'écriture, son lecteur la
     base — `recalcule_devis()` et `tient_le_devis()` — et la file, qui
     relit l'horloge). « + » : obligatoire (`not null` ou clé primaire). */
  const FERMEE = {
    devis: ['id uuid +', 'pro_id uuid +', 'client_id uuid', 'quote_request_id uuid', 'sos_request_id uuid', 'source text +',
      'statut text +', 'objet text', 'lieu_adresse text', 'lieu_code_postal text', 'lieu_ville text', 'delai_execution text',
      'retenue_garantie_centiemes integer', 'total_ht_centimes bigint +', 'total_tva_centimes bigint +',
      'total_ttc_centimes bigint +', 'generation bigint +', 'created_at timestamptz +', 'modifie_le timestamptz +',
      /* Lot 2a (49.4 bis) : les conditions que l'artisan écrit — une paire
         (pourcentage, montant) par condition, la nature, la validité —, et
         ce que la BASE pose (droits de colonne, 49.7). */
      'remise_centiemes integer', 'remise_centimes bigint', 'acompte_centiemes integer', 'acompte_centimes bigint',
      'acompte_nature text', 'validite_jours integer', 'remise_ht_centimes bigint +', 'acompte_ttc_centimes bigint +',
      'total_ttc_options_centimes bigint +'],
    devis_lignes: ['id uuid +', 'devis_id uuid +', 'ordre integer +', 'type text +', 'designation text', 'quantite_milliemes bigint',
      'unite text', 'prix_unitaire_centimes bigint', 'taux_tva_centiemes integer', 'total_centimes bigint', 'offert boolean +',
      'main_oeuvre boolean +', 'fourniture_non_comprise boolean +', 'surface_sol_milliemes bigint', 'surface_murs_milliemes bigint',
      'generation bigint +', 'modifie_le timestamptz +'],
    devis_tva: ['devis_id uuid +', 'taux_tva_centiemes integer +', 'base_centimes bigint +', 'tva_centimes bigint +', 'nb_lignes integer +',
      'remise_centimes bigint +'],
  };
  verifier('la section 49 est trouvée, entre la 48 et l’export (42)', S49.length > 5000, `${S49.length} caractères`);
  for (const t of TABLES49) {
    const cols = colonnesDe(t);
    const lues = cols ? cols.map((c) => `${c.nom} ${c.type}${c.obligatoire ? ' +' : ''}`) : [];
    const enTrop = lues.filter((c) => !FERMEE[t].includes(c));
    const enMoins = FERMEE[t].filter((c) => !lues.includes(c));
    verifier(`\`${t}\` : exactement ses ${FERMEE[t].length} colonnes, types et « not null » compris`,
      !!cols && enTrop.length === 0 && enMoins.length === 0 && egalListes(lues, FERMEE[t]),
      `en trop : ${enTrop.join(', ') || '—'} ; en moins : ${enMoins.join(', ') || '—'} — une colonne naît avec son lecteur : `
      + 'ajoutez-le à la liste et à la table « qui lit » du cahier');
  }
  /* PAS SEULEMENT `add column` : `alter table … add if not exists x text`
     (sans le mot `column`) ajoute une colonne aussi — et passait au vert
     (relecture des essais de l'étape 3, M1). Sur ces trois tables, dans TOUT
     le fichier, le seul `add` permis est `add constraint <nom> check`. */
  /* LES AJOUTS PERMIS, nommés un par un (lot 2a, 49.4 bis) : les dix
     colonnes des conditions, chacune une fois, et DANS la section 49.
     Toute autre forme reste refusée — une colonne de plus se décide, elle
     entre dans cette liste ET dans `FERMEE`. */
  const ajoutsDe = (texte) => [...texte.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?public\.(devis(?:_lignes|_tva)?)\b([^;]*);/gi)]
    .flatMap((m) => [...m[2].matchAll(/\badd\b(?!\s+constraint\s+\w+\s+check\b)\s*[^,;]*/gi)].map((a) => `${m[1]}: ${sansEspaces(a[0])}`));
  const ajouts = ajoutsDe(SQL);
  const ajoutsS49 = ajoutsDe(S49);
  const horsListe = ajouts.filter((a) => !AJOUTS_2A.includes(a));
  const malComptes = AJOUTS_2A.filter((a) => ajouts.filter((x) => x === a).length !== 1 || !ajoutsS49.includes(a));
  verifier('…et rien ne s’y ajoute plus bas : sur ces tables, le seul `add` est `add constraint <nom> check` (ni `add column`, ni '
    + '`add if not exists`, ni une contrainte anonyme) — sauf les dix colonnes des conditions (lot 2a), chacune une fois, dans la '
    + 'section 49', horsListe.length === 0 && malComptes.length === 0 && ajouts.length === AJOUTS_2A.length,
  `hors liste : ${horsListe.join(' | ') || '—'} ; manquants ou en double : ${malComptes.join(' | ') || '—'}`);
}

console.log('\n  12 bis. aucune table du devis ne change de FORME après sa création — `alter table` en liste FERMÉE, dans TOUT le fichier');
{
  /* POURQUOI (relecture « contrôles » du lot 2a, CONTROLES-2 et CONTROLES-6,
     prouvé sur PostgreSQL 16) : ce contrôle lisait les colonnes dans le
     `create table` et les `add column`, et RIEN d'autre. Posés plus bas dans
     le fichier, `alter column acompte_nature set default 'acompte'` — la
     nature PRÉ-CHOISIE que le propriétaire a refusée le 03/11 —, `alter
     column validite_jours set default 30` et `alter column
     acompte_ttc_centimes drop not null` passaient les 56 contrôles ET les
     deux essais : un devis inséré sans nature rendait « acompte ». Une
     liste de verbes interdits en oublierait un (`alter` sans le mot
     `column`, `type`, `set data type`, `drop default`, `rename`, `owner to`,
     `disable row level security`, `disable trigger`, `not valid`…).
     D'où une PROPRIÉTÉ : sur ces trois tables, dans TOUT le fichier, une
     instruction `alter table` ne porte qu'UNE action, et c'est l'une de
     celles-ci — `enable row level security` (une fois par table), `drop
     constraint if exists <nom>` puis `add constraint <nom> check (…)` (une
     fois chacune, dans cet ordre, pour les trente-deux noms attendus, dans la
     section 49), ou l'un des dix `add column if not exists` du lot 2a
     (section 12). Tout le reste se DÉCIDE : la base, l'essai et cette liste,
     dans le même lot.
     LECTURE TOLÉRANTE : la casse, les blancs, les guillemets (dépliés), le
     schéma facultatif, `if exists`, `only` — et dans les CHAÎNES aussi
     (`execute 'alter table …'`) : le texte lu garde ses chaînes. */
  const CONTRAINTES_ATTENDUES = {
    devis: [...D.CONTRAINTES_DEVIS],
    devis_lignes: [...D.CONTRAINTES_LIGNE],
    devis_tva: ['devis_tva_arrondi_check', 'devis_tva_nb_check', 'devis_tva_remise_check', 'devis_tva_taux_check',
      'devis_tva_vide_check'],
  };
  const tousLesNoms = Object.values(CONTRAINTES_ATTENDUES).flat();
  /* Une parenthèse ouverte est fermée, et la dernière ferme la première. */
  const fermeEnEntier = (t) => {
    let p = 0;
    for (let i = 0; i < t.length; i += 1) {
      if (t[i] === '(') p += 1;
      else if (t[i] === ')') { p -= 1; if (p === 0 && i !== t.length - 1) return false; }
      if (p < 0) return false;
    }
    return p === 0;
  };
  const lireAlters = (texte) => [...texte.matchAll(/\balter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(?:public\s*\.\s*)?(devis_lignes|devis_tva|devis)\b(?!\s*\.)([^;]*)/gi)]
    .map((m) => ({ table: m[1].toLowerCase(), action: sansEspaces(m[2]).toLowerCase(), brut: sansEspaces(m[0]), index: m.index }));
  const alters = lireAlters(SQL);
  const alters49 = lireAlters(S49).map((a) => a.brut);
  const permise = (a) => {
    if (a.action === 'enable row level security') return `rls ${a.table}`;
    let m = /^drop constraint if exists ([a-z0-9_]+)$/.exec(a.action);
    if (m && CONTRAINTES_ATTENDUES[a.table].includes(m[1])) return `drop ${m[1]}`;
    m = /^add constraint ([a-z0-9_]+) check (\(.*\))$/.exec(a.action);
    if (m && CONTRAINTES_ATTENDUES[a.table].includes(m[1]) && fermeEnEntier(m[2])) return `add ${m[1]}`;
    if (/^add column if not exists /.test(a.action) && AJOUTS_2A.includes(`${a.table}: ${a.action}`)) return `colonne ${a.action}`;
    return null;
  };
  const lues = alters.map((a) => ({ ...a, cle: permise(a) }));
  const horsListe = lues.filter((a) => !a.cle).map((a) => a.brut.slice(0, 160));
  const compte = (cle) => lues.filter((a) => a.cle === cle).length;
  const malComptees = [
    ...TABLES49.filter((t) => compte(`rls ${t}`) !== 1).map((t) => `rls ${t} ×${compte(`rls ${t}`)}`),
    ...tousLesNoms.filter((n) => compte(`drop ${n}`) !== 1 || compte(`add ${n}`) !== 1)
      .map((n) => `${n} : drop ×${compte(`drop ${n}`)}, add ×${compte(`add ${n}`)}`),
  ];
  const desordre = tousLesNoms.filter((n) => {
    const d = lues.find((a) => a.cle === `drop ${n}`);
    const ad = lues.find((a) => a.cle === `add ${n}`);
    return d && ad && !(d.index < ad.index && alters49.includes(d.brut) && alters49.includes(ad.brut));
  });
  verifier(`sur les trois tables, chaque \`alter table\` du fichier (${alters.length} lus) est l’une des formes PERMISES : la RLS, une `
    + 'contrainte refaite (`drop constraint if exists` puis `add constraint … check`), ou une des dix colonnes du lot 2a — ni '
    + '`alter column` (un défaut, un type, un `drop not null`), ni `drop column`, ni `rename`, ni `owner to`, ni `disable`, ni '
    + '`not valid`',
  alters.length >= 69 && horsListe.length === 0, horsListe.join(' | ') || `${alters.length} lus — le lecteur a perdu sa cible`);
  verifier(`…chaque table voit sa RLS posée une fois, et chacune des ${tousLesNoms.length} contraintes est retirée UNE fois puis `
    + 'reposée UNE fois, dans cet ordre et dans la section 49 — aucune n’est refaite plus bas, sous le même nom, avec une autre règle',
  tousLesNoms.length === 32 && malComptees.length === 0 && desordre.length === 0, [...malComptees, ...desordre].join(' | '));
}

/* LA FIN D'UN ORDRE SQL, en sautant ses chaînes (`'…'`, `E'…'` et ses
   `\'`) et ses corps entre dollars (`$$…$$`, `$q$…$q$`) : un point-virgule
   DANS une chaîne n'arrête rien. Partagé par la section 12 ter (le SQL
   fabriqué) et la 26 ter (les ordres des essais). */
function finDOrdreSql(t, depart) {
  let i = depart;
  while (i < t.length) {
    const c = t[i];
    if (c === "'") {
      const echappe = /[eE]/.test(t[i - 1] || '') && !/[\w$]/.test(t[i - 2] || '');
      let j = i + 1;
      while (j < t.length) {
        if (echappe && t[j] === '\\') { j += 2; continue; }
        if (t[j] === "'" && t[j + 1] === "'") { j += 2; continue; }
        if (t[j] === "'") break;
        j += 1;
      }
      i = j + 1;
      continue;
    }
    if (c === '$' && !/[\w$]/.test(t[i - 1] || '')) {
      const m = /^\$([A-Za-z_]\w*)?\$/.exec(t.slice(i, i + 64));
      if (m) {
        const f = t.indexOf(m[0], i + m[0].length);
        i = f < 0 ? t.length : f + m[0].length;
        continue;
      }
    }
    if (c === ';') return i;
    i += 1;
  }
  return t.length;
}

/* LA FORME CANONIQUE D'UN ORDRE : hors des chaînes, les blancs réduits à un
   seul, et aucun blanc autour de `(`, `)`, `,` et `;` ; dans une chaîne, les
   blancs réduits à un seul, mais jamais retirés (un ordre passé à `execute`
   s'écrit sur plusieurs lignes ; « 1, 2 » et « 1,2 » ne sont pas le même
   attendu). Une
   comparaison de texte qui accuserait un ordre JUSTE parce qu'il est écrit
   sur trois lignes exigerait une syntaxe, pas une propriété. */
function formeCanonique(t) {
  let s = '';
  let i = 0;
  while (i < t.length) {
    const c = t[i];
    if (c === "'") {
      const f = (() => {
        const echappe = /[eE]/.test(t[i - 1] || '') && !/[\w$]/.test(t[i - 2] || '');
        let j = i + 1;
        while (j < t.length) {
          if (echappe && t[j] === '\\') { j += 2; continue; }
          if (t[j] === "'" && t[j + 1] === "'") { j += 2; continue; }
          if (t[j] === "'") break;
          j += 1;
        }
        return j;
      })();
      s += t.slice(i, f + 1).replace(/\s+/g, ' ');
      i = f + 1;
      continue;
    }
    if (/\s/.test(c)) {
      while (i < t.length && /\s/.test(t[i])) i += 1;
      if (s && !/[(),;\s]$/.test(s) && i < t.length && !/[(),;]/.test(t[i])) s += ' ';
      continue;
    }
    s += c;
    i += 1;
  }
  return s.trim();
}

console.log('\n  12 ter. le SQL FABRIQUÉ à l’exécution, le catalogue système, et qui ÉCRIT les tables du devis — dans TOUT le fichier');
{
  /* POURQUOI (banc adverse du 04/11/2026, sabotages N01 à N17 : dix défauts
     VERTS aux 56 contrôles) : 12 bis, 18 bis, 21 ter et 22 lisent des
     ordres ÉCRITS. Un ordre FABRIQUÉ — `execute format('alter table
     public.%I …', 'devis')`, `execute 'alter table public.' || 'devis …'`,
     `format(E'grant …')`, `format($q$grant …$q$)`, une fonction redéfinie ou
     un déclencheur posé par `execute`, un `update public.%I` dans une
     fonction `definer` — ne se lit qu'à l'exécution : aucun lecteur de texte
     ne peut savoir ce qu'il fera. On n'en accepte donc QUE des relus, en
     liste FERMÉE avec leur nombre : un ordre fabriqué nouveau ou changé se
     DÉCIDE (le schéma, l'essai qui le joue, et cette liste, dans le même
     lot). Et trois propriétés de plus, qu'aucun lecteur ne tenait : le
     catalogue système ne s'écrit pas (`update pg_catalog.pg_attribute set
     attnotnull = false` rendait l'acompte effectif NULLABLE sans un mot) ;
     aucune méta-commande de psql (`\gexec` exécute ce qu'un `select`
     fabrique) ; et les tables du devis ne s'ÉCRIVENT qu'à deux endroits,
     tous deux comparés ENTIERS en 18 bis — `recalcule_devis` et le
     rattrapage de 49.6 ter. Un second `update public.devis set generation =
     generation + 1`, sans borne, faisait monter chaque horloge à chaque
     rejeu, jusqu'à OP016. */
  const EXECUTES_RELUS_ECRITS = [
    ["execute format('revoke execute on function %s from public', f);", 7],
    ["execute format('revoke execute on function %s from anon, authenticated', f);", 3],
    ["execute format('grant execute on function %s to authenticated', f);", 5],
    ["execute format('revoke execute on function %s from anon', f);", 4],
    ["execute 'revoke execute on function public.maj_comments_count() from public';", 1],
    ["execute 'revoke execute on function public.maj_comments_count() from anon, authenticated';", 1],
    ["execute 'revoke execute on function public.est_admin() from public';", 1],
    ["execute 'revoke execute on function public.est_admin() from anon';", 1],
    ["execute 'drop policy if exists \"lecture des administrateurs\" on public.administrateurs';", 1],
    ["execute 'drop policy if exists \"lecture du journal\" on public.journal_admin';", 1],
    ["execute 'drop policy if exists \"lecture des documents par l administration\" on storage.objects';", 1],
    ["execute 'grant execute on function public.compter_appel_siret(text, timestamptz, int) to service_role';", 1],
    ["execute 'insert into public.sirens_reserves (siren, reserve_le) select siren, max(coalesce(retiree_le, clock_timestamp())) from public.entreprise_registre where gele group by siren on conflict (siren) do nothing';", 1],
    ["execute format('comment on column public.sos_availability.%i is %l', c, 'morte depuis la section 47 (lot t) : ni lue ni écrite par l’application. les tarifs vivent dans ' || 'tarifs_pro. toujours 0 ; toute autre valeur est refusée (op012, refuse_les_colonnes_mortes_du_sos).');", 1],
    ["execute 'grant execute on function public.compter_essai_tva(text, timestamptz, int, timestamptz, int) to service_role';", 1],
    ["execute format('revoke truncate, references, trigger on %s from anon, authenticated', t.nom);", 1],
    ["execute format('revoke maintain on %s from anon, authenticated', t.nom);", 1],
    ["execute 'alter default privileges for role postgres in schema public ' || 'revoke truncate, references, trigger on tables from anon, authenticated';", 1],
    ["execute 'alter default privileges for role postgres in schema public ' || 'revoke maintain on tables from anon, authenticated';", 1],
    ["execute format('revoke all on function %s from public, anon, authenticated', f.signature);", 1],
  ];
  const EXECUTES_RELUS = new Map(EXECUTES_RELUS_ECRITS.map(([f, n]) => [formeCanonique(f).toLowerCase(), n]));
  /* Un `execute` qui n'est NI `execute function|procedure` (un
     déclencheur), NI le privilège `execute on` d'un `grant`/`revoke`, est
     un ordre fabriqué — dans un corps plpgsql, un bloc `do`, ou une chaîne. */
  const fabriques = [...SQL.matchAll(/(?<![\w$])execute\b(?!\s+(?:function|procedure|on)\b)/gi)]
    .map((m) => formeCanonique(SQL.slice(m.index, finDOrdreSql(SQL, m.index) + 1)).toLowerCase());
  const lusParForme = new Map();
  for (const f of fabriques) lusParForme.set(f, (lusParForme.get(f) || 0) + 1);
  const horsListe = [...lusParForme].filter(([f, n]) => n > (EXECUTES_RELUS.get(f) || 0)).map(([f, n]) => `${f.slice(0, 150)} ×${n}`);
  const manquants = [...EXECUTES_RELUS].filter(([f, n]) => (lusParForme.get(f) || 0) !== n).map(([f, n]) => `${f.slice(0, 90)} ×${lusParForme.get(f) || 0}/${n}`);
  verifier(`chaque ordre FABRIQUÉ à l’exécution (\`execute <chaîne>\`, ${fabriques.length} lus dans tout le fichier) est l’un des `
    + `${[...EXECUTES_RELUS.values()].reduce((a, b) => a + b, 0)} relus, en liste FERMÉE avec leur nombre — un \`alter table\`, une `
    + 'fonction, un déclencheur ou un droit FABRIQUÉS ne se lisent nulle part ailleurs',
  horsListe.length === 0 && manquants.length === 0,
  `hors liste : ${horsListe.join(' | ') || '—'} ; changés ou disparus : ${manquants.join(' | ') || '—'}`);

  /* Aucune méta-commande de psql : hors des chaînes, pas une seule barre
     oblique inverse (`\gexec`, `\i`, `\if`, `\q`… ; et l'éditeur SQL de
     Supabase ne les comprendrait pas). */
  const horsChaines = SQL.replace(/[eE]'(?:[^'\\]|\\.|'')*'|'(?:[^']|'')*'/g, "''");
  const meta = [...horsChaines.matchAll(/\\[A-Za-z!?]*/g)].map((m) => horsChaines.slice(Math.max(0, m.index - 40), m.index + 20));
  verifier('aucune méta-commande de psql dans `schema.sql` (`\\gexec` exécute ce qu’un `select` fabrique) : hors des chaînes, aucune '
    + 'barre oblique inverse', meta.length === 0, meta.map(sansEspaces).join(' | '));

  /* Le catalogue système ne s'écrit pas — ni en clair, ni dans une chaîne. */
  const catalogue = [...SQL.matchAll(/\b(?:update|insert\s+into|delete\s+from|truncate(?:\s+table)?|merge\s+into|alter\s+table)\s+(?:only\s+)?(?:(?:pg_catalog|information_schema)\s*\.\s*)?(?:pg_[a-z_]+|information_schema\.\w+)\b/gi)]
    .map((m) => sansEspaces(SQL.slice(m.index, m.index + 120)));
  verifier('aucun ordre n’ÉCRIT le catalogue système (`update pg_catalog.pg_attribute …` change une table sans `alter table`)',
    catalogue.length === 0, catalogue.join(' | '));

  /* Les tables du devis ne s'écrivent que dans `recalcule_devis` (trois
     ordres) et le rattrapage de 49.6 ter (un), tous deux comparés ENTIERS
     en 18 bis. Un `truncate` qui les nomme, où qu'elles soient dans sa
     liste, compte aussi. */
  const iRecalcule = SQL.search(/create\s+(?:or\s+replace\s+)?function\s+(?:public\s*\.\s*)?recalcule_devis\s*\(/i);
  const finRecalcule = iRecalcule >= 0 ? finDOrdreSql(SQL, iRecalcule) : -1;
  const iGarde = SQL.search(/\bdo\s+\$garde_rattrapage_49\$/i);
  const iContrainte = iGarde >= 0 ? SQL.slice(iGarde).search(/\badd\s+constraint\s+devis_calculs_check\b/i) : -1;
  const finRattrapage = iContrainte >= 0 ? SQL.indexOf(';', iGarde + iContrainte) : -1;
  const ecritures = [
    ...[...SQL.matchAll(/\b(?:update|insert\s+into|delete\s+from|merge\s+into|copy)\s+(?:only\s+)?(?:public\s*\.\s*)?(?:devis_lignes|devis_tva|devis)\b(?!\s*\.)/gi)]
      .map((m) => ({ i: m.index, t: m[0] })),
    ...[...SQL.matchAll(/\btruncate\b[^;]*/gi)].filter((m) => /\b(?:devis_lignes|devis_tva|devis)\b(?!\s*\.)/i.test(m[0]))
      .map((m) => ({ i: m.index, t: m[0] })),
  ];
  const dans = (e, a, b) => a >= 0 && b > a && e.i > a && e.i < b;
  const ailleurs = ecritures.filter((e) => !dans(e, iRecalcule, finRecalcule) && !dans(e, iGarde, finRattrapage))
    .map((e) => sansEspaces(SQL.slice(e.i, e.i + 120)));
  const nRecalcule = ecritures.filter((e) => dans(e, iRecalcule, finRecalcule)).length;
  const nRattrapage = ecritures.filter((e) => dans(e, iGarde, finRattrapage)).length;
  verifier('les tables du devis ne s’ÉCRIVENT (`update`, `insert`, `delete`, `merge`, `copy`, `truncate`) que dans `recalcule_devis` '
    + '(trois ordres) et dans le rattrapage de 49.6 ter (un) — tous deux comparés ENTIERS en 18 bis ; nulle part ailleurs dans le fichier',
  ailleurs.length === 0 && nRecalcule === 3 && nRattrapage === 1,
  `ailleurs : ${ailleurs.join(' | ') || '—'} ; recalcule_devis ${nRecalcule}/3, rattrapage ${nRattrapage}/1`);
}

console.log('\n  13. les colonnes interdites, et aucun `numeric`');
{
  const INTERDITES = ['compte_id', 'particulier_id', 'demande_id', 'visite_id', 'dossier_id', 'nature', 'date_redaction',
    'taux_justification', 'regime_tva'];
  const toutes = TABLES49.flatMap((t) => (colonnesDe(t) || []).map((c) => ({ ...c, table: t })));
  const fautes = toutes.filter((c) => INTERDITES.includes(c.nom)).map((c) => `${c.table}.${c.nom}`);
  verifier('aucune des colonnes que les règles D1, D2, 3.12 et le lot 2-3 interdisent (compte_id, particulier_id, demande_id, '
    + 'visite_id, dossier_id, nature, date_redaction, taux_justification, regime_tva)', toutes.length >= 40 && fautes.length === 0,
  fautes.join(', '));
  const flottants = toutes.filter((c) => /^(numeric|decimal|real|float|double)/i.test(c.type)).map((c) => `${c.table}.${c.nom} ${c.type}`);
  verifier('aucune colonne `numeric` ni flottante : l’argent est en centimes `bigint` (la rupture avec `annonces_pro.prix`, '
    + 'commentée dans la section)', flottants.length === 0, flottants.join(', '));
}

console.log('\n  14. D4 — rien n’est obligatoire hors l’entreprise, et aucun motif ne nomme une origine');
{
  /* D4-a : les seules clés obligatoires. */
  const cles = TABLES49.flatMap((t) => (colonnesDe(t) || []).filter((c) => /\breferences\b/i.test(c.texte))
    .map((c) => ({ table: t, nom: c.nom, obligatoire: c.obligatoire, action: ((/on\s+delete\s+(set\s+null|cascade|restrict|no\s+action)/i.exec(c.texte) || [])[1] || 'aucune').toLowerCase().replace(/\s+/g, ' ') })));
  const obligatoires = cles.filter((c) => c.obligatoire).map((c) => `${c.table}.${c.nom}`).sort();
  verifier('D4-a : les seules clés obligatoires sont `devis.pro_id`, `devis_lignes.devis_id`, `devis_tva.devis_id` (en cascade)',
    json(obligatoires) === json(['devis.pro_id', 'devis_lignes.devis_id', 'devis_tva.devis_id'])
    && cles.filter((c) => c.obligatoire).every((c) => c.action === 'cascade'), json(cles));
  const liens = cles.filter((c) => ['client_id', 'quote_request_id', 'sos_request_id'].includes(c.nom));
  verifier('…et les trois liens d’origine sont facultatifs, en `on delete set null` (D3, D11)',
    liens.length === 3 && liens.every((c) => !c.obligatoire && c.action === 'set null'), json(liens));
  /* D4-b : aucune contrainte « origine ⇒ lien » ; la garde ne lève rien sur un lien vide. */
  const nommentUnLien = CHECKS49.filter((c) => /\b(client_id|quote_request_id|sos_request_id)\b/.test(c.regle)).map((c) => c.nom);
  verifier('D4-b : aucune contrainte de la section ne nomme `client_id`, `quote_request_id` ni `sos_request_id`',
    CHECKS49.length >= 20 && nommentUnLien.length === 0, nommentUnLien.join(', '));
  /* LA GARDE OP013, BLOC PAR BLOC, et sa branche INSERT exigée (relecture
     des essais de l'étape 3, I-1) : une version qui ne vérifiait que la
     MODIFICATION d'un lien passait ce contrôle et l'essai — et l'artisan
     rattachait, à la CRÉATION, un devis à la fiche d'un autre (prouvé :
     INSERT 0 1). Chacun des trois blocs doit dire, dans cet ordre : « le
     lien n'est pas vide, ET (c'est une insertion OU il change), ET il n'est
     pas à moi ». */
  const garde = corpsDe('tient_le_devis');
  const gardes = [...garde.matchAll(/if\s+new\.(client_id|quote_request_id|sos_request_id)\s+is\s+not\s+null\s+and\s+\(tg_op\s*=\s*'INSERT'\s+or\s+new\.\1\s+is\s+distinct\s+from\s+old\.\1\)\s+and\s+not\s+exists\s*\([^;]*?\)\s+then\s+raise\s+exception\s+'(?:[^']|'')*'\s+using\s+errcode\s*=\s*'OP013'/gi)].map((m) => m[1]);
  verifier('…et `tient_le_devis()` ne lève OP013 que sur un lien NON VIDE, À LA CRÉATION comme quand il CHANGE : un lien vide '
    + 'passe toujours',
  json(gardes.sort()) === json(['client_id', 'quote_request_id', 'sos_request_id'])
    && (garde.match(/using\s+errcode\s*=\s*'OP013'/gi) || []).length === 3, json(gardes));

  /* D4-c : LES FONCTIONS DE MOTIFS, NOMMÉES : une liste, pas une sélection
     par type de retour, qui ramasserait `admin_traiter_demande_pro`,
     `devenir_pro` ou `rattacher_mon_siret` (relecture « base », B1).
     `emetteur_incomplet` existe depuis le lot 0a ; `motifs_refus_remise`
     naîtra au lot 2. On vise la COLONNE du devis, pas le mot : la première
     lit déjà `r.source` — la source d'une ENTREPRISE (`entreprise_registre`),
     et c'est juste. */
  const MOTIFS = [{ nom: 'emetteur_incomplet', naitAuLot: '0a' }, { nom: 'motifs_refus_remise', naitAuLot: '2' }];
  const trouvees = MOTIFS.map((m) => ({ ...m, corps: corpsDe(m.nom) || null }));
  const INTERDITS = [
    [/\bpublic\.devis\b/i, 'la table `public.devis`'],
    [/\bquote_request_id\b/i, '`quote_request_id`'],
    [/\bsos_request_id\b/i, '`sos_request_id`'],
    [/'(qr|visite|dossier)'/i, 'une origine écrite en toutes lettres (« qr », « visite », « dossier »)'],
  ];
  const fautes = trouvees.filter((m) => m.corps).flatMap((m) => INTERDITS.filter(([re]) => re.test(m.corps)).map(([, quoi]) => `${m.nom} nomme ${quoi}`));
  verifier('`emetteur_incomplet` est lue (sinon ce contrôle n’éprouverait rien)', !!trouvees[0].corps && trouvees[0].corps.length > 500);
  verifier(`D4-c : aucune fonction de motifs (${trouvees.filter((m) => m.corps).map((m) => m.nom).join(', ')}) ne nomme `
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

console.log('\n  15. les contraintes — trente-deux, toutes nommées en `_check`');
{
  const noms = CHECKS49.map((c) => c.nom);
  const tables = [...new Set(CHECKS49.map((c) => c.table))].sort();
  /* NOMMÉES, table par table : vingt-trois au lot 1, neuf de plus au lot 2a
     (six pour les conditions, `devis_calculs_check` posée APRÈS son
     rattrapage en 49.6 ter, et deux sur la ventilation — la part de
     réduction, et « un taux disparu est à zéro en entier »). Un nombre seul
     laissait passer une contrainte remplacée par une autre. */
  const ATTENDUES = {
    devis: ['devis_acompte_check', 'devis_acompte_nature_check', 'devis_acompte_une_forme_check', 'devis_calculs_check',
      'devis_delai_check', 'devis_lieu_adresse_check', 'devis_lieu_code_postal_check', 'devis_lieu_ville_check', 'devis_objet_check',
      'devis_plafond_check', 'devis_remise_check', 'devis_remise_une_forme_check', 'devis_retenue_check', 'devis_source_check',
      'devis_statut_check', 'devis_totaux_check', 'devis_validite_check'],
    devis_lignes: ['devis_ligne_designation_check', 'devis_ligne_forme_check', 'devis_ligne_offert_check', 'devis_ligne_prix_check',
      'devis_ligne_quantite_check', 'devis_ligne_surfaces_check', 'devis_ligne_taux_check', 'devis_ligne_total_check',
      'devis_ligne_type_check', 'devis_ligne_unite_check'],
    devis_tva: ['devis_tva_arrondi_check', 'devis_tva_nb_check', 'devis_tva_remise_check', 'devis_tva_taux_check',
      'devis_tva_vide_check'],
  };
  const parTable = Object.fromEntries(TABLES49.map((t) => [t, CHECKS49.filter((c) => c.table === t).map((c) => c.nom).sort()]));
  verifier(`la section pose ${noms.length} contraintes \`check\` sur les trois tables — il en faut 32, NOMMÉES (17 sur les devis, `
    + '10 sur les lignes, 5 sur la ventilation)',
  noms.length === 32 && json(tables) === json([...TABLES49].sort())
    && TABLES49.every((t) => egalListes(parTable[t], [...ATTENDUES[t]].sort())), json(parTable));
  /* LES RÈGLES DU LOT 2a, ENTIÈRES (espaces réduits) : un nom juste
     portant une règle relâchée — `>= -1`, un `or` à la place d'un `and`,
     une borne de plus — passait au vert, seul l'essai le voyait (banc de
     l'étape 4, S28). Changer une de ces règles se DÉCIDE : la base, l'essai
     et la forme attendue, dans le même lot. */
  const FORMES_2A = {
    devis_acompte_check: '(acompte_centiemes is null or acompte_centiemes between 1 and 10000) and (acompte_centimes is null or '
      + 'acompte_centimes between 1 and 9999999999)',
    devis_acompte_nature_check: "acompte_nature is null or acompte_nature in ('acompte', 'arrhes')",
    devis_acompte_une_forme_check: 'acompte_centiemes is null or acompte_centimes is null',
    devis_calculs_check: 'remise_ht_centimes >= 0 and acompte_ttc_centimes between 0 and total_ttc_centimes and '
      + 'total_ttc_options_centimes >= total_ttc_centimes',
    devis_plafond_check: 'total_ht_centimes >= 0 and total_ht_centimes + remise_ht_centimes <= 9999999999 and total_tva_centimes >= 0 '
      + 'and total_ttc_centimes <= 9999999999 and total_ttc_options_centimes <= 9999999999',
    devis_remise_check: '(remise_centiemes is null or remise_centiemes between 1 and 10000) and (remise_centimes is null or '
      + 'remise_centimes between 1 and 9999999999)',
    devis_remise_une_forme_check: 'remise_centiemes is null or remise_centimes is null',
    devis_validite_check: 'validite_jours is null or validite_jours between 1 and 365',
    devis_tva_remise_check: 'remise_centimes >= 0',
    devis_tva_vide_check: 'nb_lignes > 0 or (base_centimes = 0 and tva_centimes = 0 and remise_centimes = 0)',
  };
  const formesFausses = Object.entries(FORMES_2A).filter(([nom, forme]) => sansEspaces(regleDe(nom)) !== forme)
    .map(([nom]) => `${nom} : « ${sansEspaces(regleDe(nom))} »`);
  verifier('…et les dix règles du lot 2a (conditions, plafond, calculs, ventilation) sont celles ATTENDUES, entières',
    formesFausses.length === 0, formesFausses.join(' | '));
  verifier('…toutes finissent par `_check`, aucune en `_check<chiffres>`, aucune en double',
    noms.every((n) => /_check$/.test(n) && !/_check\d+$/.test(n)) && new Set(noms).size === noms.length);
  const sansDrop = CHECKS49.filter((c) => !new RegExp(`alter\\s+table\\s+public\\.${c.table}\\s+drop\\s+constraint\\s+if\\s+exists\\s+${c.nom}\\s*;`, 'i').test(S49))
    .map((c) => c.nom);
  verifier('…et chacune se REFAIT (`drop constraint if exists` puis `add constraint`) : `add column if not exists` ne touche pas '
    + 'aux contraintes', sansDrop.length === 0, sansDrop.join(', '));
  const anonymes = TABLES49.filter((t) => {
    const m = new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${t}\\s*\\(([\\s\\S]*?)\\n\\);`, 'i').exec(S49);
    return m && /\bcheck\s*\(/i.test(m[1]);
  });
  verifier('…aucune contrainte ANONYME dans un `create table` (PostgreSQL la nommerait `…_check1`, et `erreurs.js` n’aurait '
    + 'pas sa phrase)', anonymes.length === 0, anonymes.join(', '));
  /* LES PHRASES : `MESSAGES_CONTRAINTE` (erreurs.js) les reçoit à l'étape
     4, avec l'écriture par l'application. Dès que `api.js` écrit dans ces
     tables, chaque contrainte DOIT avoir sa phrase — et réciproquement ;
     avant, aucune phrase de devis ne doit nommer une contrainte absente. */
  const phrases = Object.keys(ERR.MESSAGES_CONTRAINTE || {}).filter((k) => /^devis_/.test(k));
  const api = lire('src/lib/api.js');
  const ecritDevis = /from\(\s*['"]devis(_lignes)?['"]\s*\)/.test(api);
  const sansPhrase = noms.filter((n) => !phrases.includes(n));
  const phraseSansContrainte = phrases.filter((n) => !noms.includes(n));
  verifier(ecritDevis
    ? 'chacune a sa phrase dans `MESSAGES_CONTRAINTE` — et réciproquement (l’application écrit dans ces tables)'
    : `aucune phrase de \`MESSAGES_CONTRAINTE\` ne nomme une contrainte absente (${phrases.length} phrase(s) de devis ; les 32 `
      + 's’exigeront dès que `api.js` écrira dans ces tables, étape 4)',
  phraseSansContrainte.length === 0 && (!ecritDevis || sansPhrase.length === 0),
  `sans phrase : ${sansPhrase.join(', ') || '—'} ; phrase sans contrainte : ${phraseSansContrainte.join(', ') || '—'}`);
}

console.log('\n  16. l’ordre des contraintes de ligne — celui de PostgreSQL');
{
  const noms = [...D.CONTRAINTES_LIGNE];
  verifier('`CONTRAINTES_LIGNE` : dix noms `devis_ligne_…_check`, TRIÉS par ordre alphabétique (octet par octet, comme '
    + 'PostgreSQL les applique)', noms.length === 10 && noms.every((n) => /^devis_ligne_[a-z_]+_check$/.test(n))
    && egalListes(noms, [...noms].sort()), json(noms));
  verifier('`CONTRAINTES_DEVIS` : dix-sept noms `devis_…_check` (dix au lot 1, sept au lot 2a), triés de même',
    D.CONTRAINTES_DEVIS.length === 17 && D.CONTRAINTES_DEVIS.every((n) => /^devis_[a-z_]+_check$/.test(n) && !/^devis_ligne_/.test(n))
    && egalListes([...D.CONTRAINTES_DEVIS], [...D.CONTRAINTES_DEVIS].sort()));
  const schemaLigne = CHECKS49.filter((c) => c.table === 'devis_lignes').map((c) => c.nom).sort();
  const schemaDevis = CHECKS49.filter((c) => c.table === 'devis').map((c) => c.nom).sort();
  verifier('…et ce sont EXACTEMENT les dix de `devis_lignes` et les dix-sept de `devis` que le schéma pose',
    egalListes(schemaLigne, noms) && egalListes(schemaDevis, [...D.CONTRAINTES_DEVIS]),
    `schéma (lignes) ${json(schemaLigne)} ; schéma (devis) ${json(schemaDevis)}`);
}

console.log('\n  17. les miroirs — une seule règle, recopiée sous contrôle');
{
  const nombres = (t) => (t || '').split(',').map((x) => Number(x)).filter((x) => Number.isFinite(x));
  const tauxLigne = listeDe('devis_ligne_taux_check', 'taux_tva_centiemes');
  const tauxTva = listeDe('devis_tva_taux_check', 'taux_tva_centiemes');
  verifier('`TAUX_TVA` = la liste de `devis_ligne_taux_check` = celle de `devis_tva_taux_check`',
    !!tauxLigne && !!tauxTva && json(nombres(tauxLigne.join(','))) === json([...D.TAUX_TVA])
    && json(nombres(tauxTva.join(','))) === json([...D.TAUX_TVA]), `${json(tauxLigne)} / ${json(tauxTva)}`);
  const unites = listeDe('devis_ligne_unite_check', 'unite');
  verifier('`UNITES` = les sept clés de `devis_ligne_unite_check` ; aucun libellé « ml » ni « M2 »',
    !!unites && json(unites) === json(D.UNITES.map((u) => u.cle)) && unites.length === 7
    && D.UNITES.every((u) => ![u.court, u.pastille, u.nom].some((x) => x === 'ml' || x === 'M2')), json(unites));
  verifier('`TYPES_LIGNE` = `devis_ligne_type_check` ; `SOURCES` = `devis_source_check`, sans qr, visite ni dossier ; '
    + '`STATUTS` = `devis_statut_check`',
  json(listeDe('devis_ligne_type_check', 'type')) === json([...D.TYPES_LIGNE])
    && json(listeDe('devis_source_check', 'source')) === json([...D.SOURCES])
    && !D.SOURCES.some((x) => /^(qr|visite|dossier)$/.test(x))
    && json(listeDe('devis_statut_check', 'statut')) === json([...D.STATUTS]));
  const n = (x) => String(x);
  const bornes = [
    ['QUANTITE_MAX', D.QUANTITE_MAX, /quantite_milliemes\s+between\s+1\s+and\s+(\d+)/i, 'devis_ligne_quantite_check'],
    ['PRIX_MAX', D.PRIX_MAX, /prix_unitaire_centimes\s+between\s+0\s+and\s+(\d+)/i, 'devis_ligne_prix_check'],
    /* Lot 2a : le plafond porte sur le BRUT (HT + réduction), sur le TTC, et
       sur le total toutes options comprises. */
    ['PLAFOND', D.PLAFOND, /total_ht_centimes\s*\+\s*remise_ht_centimes\s*<=\s*(\d+)/i, 'devis_plafond_check'],
    ['PLAFOND', D.PLAFOND, /total_ttc_centimes\s*<=\s*(\d+)/i, 'devis_plafond_check'],
    ['PLAFOND', D.PLAFOND, /total_ttc_options_centimes\s*<=\s*(\d+)/i, 'devis_plafond_check'],
    ['POURCENT_MAX', D.POURCENT_MAX, /remise_centiemes\s+between\s+1\s+and\s+(\d+)/i, 'devis_remise_check'],
    ['PLAFOND', D.PLAFOND, /remise_centimes\s+between\s+1\s+and\s+(\d+)/i, 'devis_remise_check'],
    ['POURCENT_MAX', D.POURCENT_MAX, /acompte_centiemes\s+between\s+1\s+and\s+(\d+)/i, 'devis_acompte_check'],
    ['PLAFOND', D.PLAFOND, /acompte_centimes\s+between\s+1\s+and\s+(\d+)/i, 'devis_acompte_check'],
    ['VALIDITE_MAX', D.VALIDITE_MAX, /validite_jours\s+between\s+1\s+and\s+(\d+)/i, 'devis_validite_check'],
    ['PLAFOND', D.PLAFOND, /<=\s*(\d+)\s+and\s+total_centimes/i, 'devis_ligne_total_check'],
    ['SURFACE_MAX', D.SURFACE_MAX, /surface_sol_milliemes\s+between\s+1\s+and\s+(\d+)/i, 'devis_ligne_surfaces_check'],
    ['RETENUE_MAX', D.RETENUE_MAX, /between\s+1\s+and\s+(\d+)/i, 'devis_retenue_check'],
    ['LONGUEURS.designation', D.LONGUEURS.designation, /between\s+1\s+and\s+(\d+)/i, 'devis_ligne_designation_check'],
    ['LONGUEURS.objet', D.LONGUEURS.objet, /<=\s*(\d+)/i, 'devis_objet_check'],
    ['LONGUEURS.lieuAdresse', D.LONGUEURS.lieuAdresse, /<=\s*(\d+)/i, 'devis_lieu_adresse_check'],
    ['LONGUEURS.lieuVille', D.LONGUEURS.lieuVille, /<=\s*(\d+)/i, 'devis_lieu_ville_check'],
    ['LONGUEURS.delaiExecution', D.LONGUEURS.delaiExecution, /<=\s*(\d+)/i, 'devis_delai_check'],
  ];
  const fautesB = bornes.filter(([, v, re, c]) => n((re.exec(regleDe(c)) || [])[1]) !== n(v)).map(([k, v, , c]) => `${k}=${v} contre ${c}`);
  verifier('les bornes de `devis.js` sont celles des contraintes (quantité, prix, plafond ×4, surfaces, retenue, cinq longueurs, '
    + 'et les conditions du lot 2a : pourcentages, montants, validité)',
    fautesB.length === 0, fautesB.join(' ; '));
  const fTotal = corpsDe('devis_total_ligne');
  const fTva = corpsDe('devis_tva_de');
  verifier('…et celles des deux fonctions de calcul : `devis_total_ligne` (quantité, prix), `devis_tva_de` (`TAUX_CALCUL_MAX`)',
    new RegExp(`p_quantite\\s+between\\s+1\\s+and\\s+${D.QUANTITE_MAX}\\b`).test(fTotal)
    && new RegExp(`p_prix\\s+between\\s+0\\s+and\\s+${D.PRIX_MAX}\\b`).test(fTotal)
    && new RegExp(`p_taux\\s+between\\s+0\\s+and\\s+${D.TAUX_CALCUL_MAX}\\b`).test(fTva), `${sansEspaces(fTotal)} | ${sansEspaces(fTva)}`);
  const recalc = corpsDe('recalcule_devis');
  const lignesMax = (/\(select\s+count\(\*\)\s+from\s+public\.devis_lignes\s+l\s+where\s+l\.devis_id\s*=\s*p_devis\)\s*>\s*(\d+)/i.exec(recalc) || [])[1];
  verifier('`LIGNES_MAX` est le nombre que `recalcule_devis()` compte, SOUS SON VERROU (OP014)',
    n(lignesMax) === n(D.LIGNES_MAX) && /using\s+errcode\s*=\s*'OP014'/i.test(recalc), `schéma ${lignesMax}, devis.js ${D.LIGNES_MAX}`);

  /* LA CLASSE DE BLANCS — une seule règle, recopiée sous contrôle (CR-B M2) :
     les cinq copies de la section 49, les deux de la section 47, la
     HUITIÈME de la section 50 (`tient_le_poste`, lot P), et `BLANCS_TARIFS`.
     DEUX FORMES SE LISENT : la chaîne `E'…'` à séquences des sections 47
     et 49, et la concaténation de littéraux `'…'` et de `chr(n)` de la
     section 50, qui ne contient AUCUNE barre oblique inverse (cahier du
     lot P, §2.4). Une copie qu'on ne sait pas lire rend `null`, donc
     « différente » : elle n'échappe pas à la comparaison. */
  const decoder = (e) => e.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\v/g, '\v').replace(/\\f/g, '\f');
  /* La concaténation, ÉVALUÉE : chaque terme est un littéral '…' (apostrophe
     doublée) ou un chr(n) — rien d'autre n'est admis, comme dans
     `verifier-postes`. */
  const evaluerConcat = (e) => {
    const termes = e.match(/'(?:[^']|'')*'|chr\(\d+\)/g) || [];
    const reste = e.replace(/'(?:[^']|'')*'|chr\(\d+\)/g, '').replace(/\|\||\s/g, '');
    if (reste !== '' || termes.length === 0) return null;
    return termes.map((x) => (x.startsWith('chr(') ? String.fromCodePoint(Number(x.slice(4, -1))) : x.slice(1, -1).replace(/''/g, "'"))).join('');
  };
  const jeuDe = (nom, colonne) => {
    const m = corpsDe(nom).match(new RegExp(
      `new\\.${colonne} := nullif\\(btrim\\(coalesce\\(new\\.${colonne}, ''\\),\\s*(?:E'((?:[^'\\\\]|\\\\.)*)'|((?:'(?:[^']|'')*'|chr\\(\\d+\\))(?:\\s*\\|\\|\\s*(?:'(?:[^']|'')*'|chr\\(\\d+\\)))*))\\), ''\\);`));
    if (!m) return null;
    const jeu = m[1] !== undefined ? decoder(m[1]) : evaluerConcat(m[2]);
    return jeu === null ? null : [...new Set(jeu)].sort().join('');
  };
  const js = [...new Set(D.BLANCS)].sort().join('');
  const copies = {
    'tient_les_tarifs (47)': jeuDe('tient_les_tarifs', 'frais_deplacement_texte'),
    'tient_les_tarifs_publics (47)': jeuDe('tient_les_tarifs_publics', 'decompte_temps_texte'),
    'tient_le_devis.objet': jeuDe('tient_le_devis', 'objet'),
    'tient_le_devis.lieu_adresse': jeuDe('tient_le_devis', 'lieu_adresse'),
    'tient_le_devis.lieu_ville': jeuDe('tient_le_devis', 'lieu_ville'),
    'tient_le_devis.delai_execution': jeuDe('tient_le_devis', 'delai_execution'),
    'tient_la_ligne_de_devis.designation': jeuDe('tient_la_ligne_de_devis', 'designation'),
    'tient_le_poste.designation (50, en chr(n))': jeuDe('tient_le_poste', 'designation'),
  };
  const tarifs = [...new Set(E.BLANCS_TARIFS || '')].sort().join('');
  /* …ET TOUTE COPIE EST DANS LA LISTE — une PROPRIÉTÉ, pas une liste à
     tenir (lot P, 23/10/2026, éprouvé : retirer la huitième copie de
     `copies` laissait ce contrôle vert). Chaque rognage du fichier dont la
     classe porte les caractères INVISIBLES (U+200B…) est une copie de LA
     classe du projet ; les rognages de la section 46 (« Mon entreprise »),
     sans invisibles, en sont une autre, plus petite, et restent à part. On
     compte ces copies fonction par fonction, et la liste doit compter les
     mêmes. */
  const INVISIBLE = String.fromCharCode(0x200b);
  const trouvees = FONCTIONS.flatMap((f) => [...f.corps.matchAll(
    /new\.(\w+) := nullif\(btrim\(coalesce\(new\.\1, ''\),\s*(E'(?:[^'\\]|\\.)*'|(?:'(?:[^']|'')*'|chr\(\d+\))(?:\s*\|\|\s*(?:'(?:[^']|'')*'|chr\(\d+\)))*)\), ''\);/g)]
    .map((m) => ({ f: f.nom, jeu: m[2].startsWith("E'") ? decoder(m[2].slice(2, -1)) : evaluerConcat(m[2]) })))
    .filter((c) => c.jeu && c.jeu.includes(INVISIBLE));
  const parFonction = (noms) => json(Object.entries(noms.reduce((a, n) => ({ ...a, [n]: (a[n] || 0) + 1 }), {})).sort());
  const dansLeFichier = parFonction(trouvees.map((c) => c.f));
  const dansLaListe = parFonction(Object.keys(copies).map((k) => k.split(/[ .]/)[0]));
  verifier(`chaque copie de la classe que porte le fichier (${trouvees.length}, invisibles compris) est dans la liste comparée ci-dessous`,
    trouvees.length >= 8 && dansLeFichier === dansLaListe, `fichier ${dansLeFichier} ; liste ${dansLaListe}`);
  const differentes = Object.entries(copies).filter(([, v]) => v !== js).map(([k, v]) => `${k} ${json(v)}`);
  verifier('`BLANCS` (devis.js) = les HUIT copies de la classe (section 47 ×2, section 49 ×5, section 50 ×1) = `BLANCS_TARIFS` — les invisibles compris',
    differentes.length === 0 && js === tarifs && [' ', '​', '‌', '‍', '⁠', '﻿'].every((ch) => js.includes(ch)),
    `devis ${json(js)} ; différentes : ${differentes.join(' | ') || '—'} ; tarifs ${json(tarifs)}`);
  verifier('…et le nettoyage d’une désignation la rogne : un U+200B seul n’est pas une désignation',
    D.validerLigne({ type: 'zone', designation: '​  ' }).contrainte === 'devis_ligne_designation_check'
    && D.nettoyerLigne({ designation: '﻿ pose⁠ ' }).designation === 'pose');
  /* LE CODE POSTAL : une liste EXPLICITE, jamais `\s` (relecture 0-2, C10 :
     ce que `\s` retire dépend du serveur). */
  const cp = (/new\.lieu_code_postal\s*:=\s*nullif\(regexp_replace\(coalesce\(new\.lieu_code_postal,\s*''\),\s*E'\[((?:[^'\\\]]|\\.)*)\]',\s*'',\s*'g'\),\s*''\)/i
    .exec(corpsDe('tient_le_devis')) || [])[1];
  const cpSql = cp ? [...new Set(decoder(cp.replace(/\\\\/g, '\\')))].sort().join('') : null;
  const cpJs = [...new Set(D.ESPACES_CODE_POSTAL)].sort().join('');
  verifier('le code postal se nettoie par la MÊME liste explicite des deux côtés (`ESPACES_CODE_POSTAL`) — jamais par `\\s`',
    !!cpSql && cpSql === cpJs && !/regexp_replace\([^;]*'\\\\s'/i.test(corpsDe('tient_le_devis')), `sql ${json(cpSql)} ; js ${json(cpJs)}`);
}

console.log('\n  18. les formules — écrites une fois, en entiers, et deux égalités qui ne passent jamais sur un NULL');
{
  const fTotal = corpsDe('devis_total_ligne');
  const fTva = corpsDe('devis_tva_de');
  verifier('`devis_total_ligne` : `(q × p + 500) / 1000` ; `devis_tva_de` : `(base × taux + 5000) / 10000`',
    /\(p_quantite\s*\*\s*p_prix\s*\+\s*500\)\s*\/\s*1000\b/.test(fTotal) && /\(p_base\s*\*\s*p_taux\s*\+\s*5000\)\s*\/\s*10000\b/.test(fTva));
  const fonctions49 = FONCTIONS.filter((f) => NOMS49.includes(f.nom));
  /* UNE EXCEPTION, NOMMÉE (lot 2a) : `repartir_au_plus_fort_reste` calcule
     `total × poids` en `numeric`, parce qu'un `bigint` déborde dès 10^19
     (mesuré). Elle n'y a droit qu'à une condition : n'en tirer des entiers
     que par `div()` et `mod()`, exacts — aucune division `/` (une division
     `numeric` s'arrête à un nombre de décimales), aucun arrondi, aucun
     flottant. */
  const EXCEPTION_NUMERIC = 'repartir_au_plus_fort_reste';
  const arrondis = fonctions49.filter((f) => f.nom !== EXCEPTION_NUMERIC
    && /\bround\s*\(|\bnumeric\b|\bfloat|\bdouble\s+precision\b|\breal\b/i.test(f.corps)).map((f) => f.nom);
  verifier(`aucune fonction de la section (${fonctions49.map((f) => f.nom).join(', ')}) n’écrit \`round(\`, \`numeric\`, un flottant `
    + `— sauf \`${EXCEPTION_NUMERIC}\`, ci-dessous`,
  fonctions49.length >= 6 && arrondis.length === 0, arrondis.join(', '));
  const rep = fonctions49.find((f) => f.nom === EXCEPTION_NUMERIC);
  verifier(`…et \`${EXCEPTION_NUMERIC}\` ne tire ses entiers du \`numeric\` que par \`div()\` et \`mod()\` : aucune division \`/\`, `
    + 'aucun `round`, `floor`, `ceil` ni `trunc`, aucun flottant',
  !!rep && /\bdiv\s*\(/i.test(rep.corps) && /\bmod\s*\(/i.test(rep.corps) && !/\//.test(sansChaines(rep.corps))
    && !/\bround\s*\(|\bfloor\s*\(|\bceil(?:ing)?\s*\(|\btrunc\s*\(|\bfloat|\bdouble\s+precision\b|\breal\b/i.test(rep.corps),
  rep ? sansEspaces(rep.corps).slice(0, 200) : 'introuvable');
  verifier('`devis_ligne_total_check` : `case when offert then 0` — « Offert » met le TOTAL à 0 et garde le prix',
    /case\s+when\s+offert\s+then\s+0\b/i.test(regleDe('devis_ligne_total_check')));
  /* UN NULL NE SATISFAIT JAMAIS UNE ÉGALITÉ PAR ACCIDENT (CR-B M1) : pour
     chaque `X = public.devis_…(`, un `X is not null and` le précède dans la
     même contrainte. */
  /* …ET C'EST LE RÉSULTAT DE LA FONCTION QU'ON GARDE, pas la colonne
     comparée (relecture de l'étape 3, mineur 5) : `devis_tva_arrondi_check`
     gardait `tva_centimes is not null` — déjà `not null` par la colonne —,
     et une base hors des bornes de `devis_tva_de` (qui rend alors NULL)
     faisait PASSER la contrainte, avec une TVA quelconque (prouvé). Pour
     chaque `X = public.devis_f(…)`, il faut `public.devis_f(…) is not null
     and` AVANT, dans la même contrainte. */
  const egalites = CHECKS49.flatMap((c) => [...c.regle.matchAll(/(\w+)\s*=\s*(?:case\b[\s\S]*?\b(public\.devis_\w+)\(|(public\.devis_\w+)\()/gi)]
    .map((m) => ({ c: c.nom, x: m[1], f: m[2] || m[3], avant: c.regle.slice(0, m.index) })));
  const nues = egalites.filter((e) => !new RegExp(`${e.f.replace('.', '\\.')}\\([^)]*\\)\\s+is\\s+not\\s+null\\s+and\\b`, 'i').test(e.avant))
    .map((e) => `${e.c} (${e.x} = ${e.f}(…) sans « ${e.f}(…) is not null and » avant)`);
  verifier(`les égalités à une fonction de calcul sont gardées par « public.devis_…(…) is not null and » — le RÉSULTAT de la `
    + `fonction, pas la colonne (${egalites.map((e) => e.c).join(', ')})`,
  egalites.length >= 2 && nues.length === 0, nues.join(', '));
  verifier('aucune contrainte ne lie `main_oeuvre` à `unite` (CR-D B1 : un prix au m² est un prix forfaitaire)',
    !CHECKS49.some((c) => /\bmain_oeuvre\b/.test(c.regle) && /\bunite\b/.test(c.regle) && !/devis_ligne_forme_check/.test(c.nom)));
  verifier('`devis_ligne_offert_check` : « un prix de 0 seulement avec Offert » s’écrit `<> 0` (un prix négatif reste à '
    + '`devis_ligne_prix_check` : l’écart n° 1, prouvé)', /prix_unitaire_centimes\s*<>\s*0\s+or\s+offert/i.test(regleDe('devis_ligne_offert_check'))
    && !/prix_unitaire_centimes\s*>\s*0/i.test(regleDe('devis_ligne_offert_check')));
}

console.log('\n  18 bis. les calculs d’argent du lot 2a, côté BASE, ENTIERS — et la garde du rattrapage');
{
  /* POURQUOI (relecture « contrôles » du lot 2a, CONTROLES-1, CONTROLES-7,
     et les restes transmis par le groupe BASE) : de `recalcule_devis`, ce
     contrôle ne lisait que le verrou, OP014, OP015 et l'horloge ; de la
     répartition, l'absence de `/` ; de `tient_le_devis`, rien du calcul.
     Sept défauts remis à la main passaient les 56 contrôles au vert — les
     taux passés croissants à la répartition, la réduction ou l'acompte en
     pourcentage TRONQUÉS (le demi vers le haut perdu), l'acompte calculé sur
     le total OPTIONS COMPRISES, le total toutes options comprises fait par
     ADDITION au lieu de l'union, « à reste égal, la dernière part », une
     réduction effective jamais posée — et le RATTRAPAGE de 49.6 ter, retiré,
     passait aussi : chacun change un montant affiché à l'artisan et rangé en
     base. Seuls les essais SQL les voyaient, et `npm run verifier` n'en joue
     aucun (A-FAIRE §2.3) — il tourne aussi sur GitHub, SANS PostgreSQL.
     Les corps se comparent donc ENTIERS, commentaires retirés et blancs
     réduits, à la forme écrite ICI — le procédé des contraintes du lot 2a
     (`FORMES_2A`), de `verifier-remontee` et de `verifier-moderation`.
     CHANGER UNE FORMULE SE DÉCIDE : la base, l'essai (`essais-section-49.sql`,
     `essais-section-49-conditions.sql`, `essais-section-49-rattrapage.sql`)
     et la forme ci-dessous, dans le même lot, en disant pourquoi.
     La forme d'une fonction : sa signature et ses attributs (`immutable`,
     `security definer` ou `invoker`), puis son corps — et UNE seule
     définition dans tout le fichier (une seconde, plus bas, gagnerait). */
  const FORMES_CALCUL = Object.freeze({
    devis_total_ligne: String.raw`p_quantite bigint, p_prix bigint) returns bigint language sql immutable set search_path = public $$ select case when p_quantite between 1 and 99999999 and p_prix between 0 and 9999999999 then (p_quantite * p_prix + 500) / 1000 end $$`,
    devis_tva_de: String.raw`p_base bigint, p_taux integer) returns bigint language sql immutable set search_path = public $$ select case when p_base between 0 and 999999999999999 and p_taux between 0 and 9000 then (p_base * p_taux + 5000) / 10000 end $$`,
    repartir_au_plus_fort_reste: String.raw`p_total bigint, p_poids bigint[]) returns bigint[] language plpgsql immutable set search_path = public $$ declare v_n integer := coalesce(cardinality(p_poids), 0); v_somme numeric := 0; v_parts bigint[]; v_restes numeric[]; v_manque bigint; v_i integer; v_j integer; v_choix integer; begin if p_total is null or p_total < 0 then return null; end if; if v_n = 0 then return case when p_total = 0 then '{}'::bigint[] end; end if; for v_i in 1 .. v_n loop if p_poids[v_i] is null or p_poids[v_i] < 0 then return null; end if; v_somme := v_somme + p_poids[v_i]; end loop; if p_total > v_somme then return null; end if; v_parts := array_fill(0::bigint, array[v_n]); if v_somme = 0 then return v_parts; end if; v_restes := array_fill(0::numeric, array[v_n]); for v_i in 1 .. v_n loop v_parts[v_i] := div(p_total::numeric * p_poids[v_i], v_somme)::bigint; v_restes[v_i] := mod(p_total::numeric * p_poids[v_i], v_somme); end loop; v_manque := p_total - (select sum(x) from unnest(v_parts) x)::bigint; for v_j in 1 .. v_manque loop v_choix := null; for v_i in 1 .. v_n loop if v_restes[v_i] > 0 and (v_choix is null or v_restes[v_i] > v_restes[v_choix]) then v_choix := v_i; end if; end loop; v_parts[v_choix] := v_parts[v_choix] + 1; v_restes[v_choix] := 0; end loop; return v_parts; end; $$`,
    recalcule_devis: String.raw`p_devis uuid, p_generation bigint) returns void language plpgsql security definer set search_path = public $$ declare v_horloge bigint; v_pct integer; v_montant bigint; v_taux integer[]; v_brut bigint[]; v_nb integer[]; v_total_brut bigint; v_remise bigint; v_parts bigint[]; begin select d.generation, d.remise_centiemes, d.remise_centimes into v_horloge, v_pct, v_montant from public.devis d where d.id = p_devis for no key update; if not found then return; end if; if p_generation is not null and p_generation <= v_horloge then raise exception 'Ce devis a reçu entre-temps une modification plus récente — peut-être depuis un autre appareil. Cette ligne, plus ancienne, n''a pas été enregistrée, pour ne pas écraser la plus récente. Rien de ce qui est enregistré n''est perdu : rouvrez le devis pour voir sa dernière version, puis réessayez.' using errcode = 'OP015'; end if; if p_generation is not null and (select count(*) from public.devis_lignes l where l.devis_id = p_devis) > 500 then raise exception 'Un devis porte au plus 500 lignes : celui-ci est plein. Commencez-en un second, ou regroupez des lignes.' using errcode = 'OP014'; end if; select coalesce(array_agg(x.taux order by x.taux desc), '{}'), coalesce(array_agg(x.brut order by x.taux desc), '{}'), coalesce(array_agg(x.nb order by x.taux desc), '{}') into v_taux, v_brut, v_nb from (select l.taux_tva_centiemes as taux, sum(l.total_centimes)::bigint as brut, count(*)::integer as nb from public.devis_lignes l where l.devis_id = p_devis and l.type = 'poste' group by l.taux_tva_centiemes) x; v_total_brut := coalesce((select sum(b) from unnest(v_brut) b), 0)::bigint; v_remise := case when v_montant is not null then least(v_montant, v_total_brut) when v_pct is not null then (v_total_brut * v_pct + 5000) / 10000 else 0 end; v_parts := public.repartir_au_plus_fort_reste(v_remise, v_brut); insert into public.devis_tva as t (devis_id, taux_tva_centiemes, base_centimes, remise_centimes, tva_centimes, nb_lignes) select p_devis, v_taux[i], v_brut[i] - v_parts[i], v_parts[i], public.devis_tva_de(v_brut[i] - v_parts[i], v_taux[i]), v_nb[i] from generate_subscripts(v_taux, 1) as i on conflict (devis_id, taux_tva_centiemes) do update set base_centimes = excluded.base_centimes, remise_centimes = excluded.remise_centimes, tva_centimes = excluded.tva_centimes, nb_lignes = excluded.nb_lignes; update public.devis_tva t set base_centimes = 0, tva_centimes = 0, remise_centimes = 0, nb_lignes = 0 where t.devis_id = p_devis and t.nb_lignes > 0 and not exists (select 1 from public.devis_lignes l where l.devis_id = p_devis and l.type = 'poste' and l.taux_tva_centiemes = t.taux_tva_centiemes); update public.devis set modifie_le = clock_timestamp(), generation = coalesce(p_generation, generation) where id = p_devis; end; $$`,
    recalcule_apres_reduction: String.raw`) returns trigger language plpgsql security definer set search_path = public $$ begin perform public.recalcule_devis(new.id, null); return null; end; $$`,
    tient_le_devis: String.raw`) returns trigger language plpgsql security invoker set search_path = public $$ declare v_ht bigint; v_tva bigint; v_remise bigint; v_ttc bigint; v_options bigint; v_plafond constant integer := 20; begin new.objet := nullif(btrim(coalesce(new.objet, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), ''); new.lieu_adresse := nullif(btrim(coalesce(new.lieu_adresse, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), ''); new.lieu_ville := nullif(btrim(coalesce(new.lieu_ville, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), ''); new.delai_execution := nullif(btrim(coalesce(new.delai_execution, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), ''); new.lieu_code_postal := nullif(regexp_replace(coalesce(new.lieu_code_postal, ''), E'[ \\t\\n\\v\\f\\r\\u00a0\\u202f]', '', 'g'), ''); if new.generation is null or new.generation not between 1 and 9007199254740991 then raise exception 'Cette version d''Opus n''envoie pas de numéro d''écriture valable pour ce devis : rien n''a été enregistré. Mettez l''application à jour, puis réessayez.' using errcode = 'OP016'; end if; if tg_op = 'INSERT' then new.created_at := clock_timestamp(); else new.created_at := old.created_at; new.source := old.source; if (pg_trigger_depth() = 1 and new.generation <= old.generation) or new.generation < old.generation then raise exception 'Ce devis a reçu entre-temps une modification plus récente — peut-être depuis un autre appareil. Celle-ci, plus ancienne, n''a pas été enregistrée, pour ne pas écraser la plus récente. Rien de ce qui est enregistré n''est perdu : rouvrez le devis pour voir sa dernière version, puis réessayez.' using errcode = 'OP015'; end if; end if; new.modifie_le := clock_timestamp(); if new.client_id is not null and (tg_op = 'INSERT' or new.client_id is distinct from old.client_id) and not exists (select 1 from public.clients c where c.id = new.client_id and c.pro_id = new.pro_id) then raise exception 'Cette fiche n''est pas dans votre carnet : un devis ne se rattache qu''à vos propres clients.' using errcode = 'OP013'; end if; if new.quote_request_id is not null and (tg_op = 'INSERT' or new.quote_request_id is distinct from old.quote_request_id) and not exists (select 1 from public.quote_requests q where q.id = new.quote_request_id and q.professional_id = new.pro_id) then raise exception 'Cette demande de devis ne vous a pas été adressée : un devis ne se rattache qu''à vos propres demandes.' using errcode = 'OP013'; end if; if new.sos_request_id is not null and (tg_op = 'INSERT' or new.sos_request_id is distinct from old.sos_request_id) and not exists (select 1 from public.sos_requests s where s.id = new.sos_request_id and s.professional_id = new.pro_id) then raise exception 'Cette urgence ne vous a pas été adressée : un devis ne se rattache qu''à vos propres urgences.' using errcode = 'OP013'; end if; if new.quote_request_id is not null and (tg_op = 'INSERT' or new.quote_request_id is distinct from old.quote_request_id) then perform pg_advisory_xact_lock(hashtextextended('devis:demande:' || new.quote_request_id::text, 0)); if (select count(*) from public.devis d where d.quote_request_id = new.quote_request_id and d.pro_id = new.pro_id and d.id <> new.id) >= v_plafond then raise exception 'Vous avez déjà % devis pour cette demande : supprimez un brouillon dont vous n''avez plus besoin avant d''en commencer un autre.', v_plafond using errcode = 'OP017'; end if; end if; if new.sos_request_id is not null and (tg_op = 'INSERT' or new.sos_request_id is distinct from old.sos_request_id) then perform pg_advisory_xact_lock(hashtextextended('devis:urgence:' || new.sos_request_id::text, 0)); if (select count(*) from public.devis d where d.sos_request_id = new.sos_request_id and d.pro_id = new.pro_id and d.id <> new.id) >= v_plafond then raise exception 'Vous avez déjà % devis pour cette urgence : supprimez un brouillon dont vous n''avez plus besoin avant d''en commencer un autre.', v_plafond using errcode = 'OP017'; end if; end if; select coalesce(sum(t.base_centimes), 0)::bigint, coalesce(sum(t.tva_centimes), 0)::bigint, coalesce(sum(t.remise_centimes), 0)::bigint into v_ht, v_tva, v_remise from public.devis_tva t where t.devis_id = new.id; v_ttc := v_ht + v_tva; new.total_ht_centimes := v_ht; new.total_tva_centimes := v_tva; new.total_ttc_centimes := v_ttc; new.remise_ht_centimes := v_remise; select coalesce(sum(u.base + public.devis_tva_de(u.base, u.taux)), 0)::bigint into v_options from (select x.taux, sum(x.base)::bigint as base from (select t.taux_tva_centiemes as taux, t.base_centimes as base from public.devis_tva t where t.devis_id = new.id union all select l.taux_tva_centiemes, l.total_centimes from public.devis_lignes l where l.devis_id = new.id and l.type = 'option') x group by x.taux) u; new.total_ttc_options_centimes := v_options; new.acompte_ttc_centimes := case when new.acompte_centimes is not null then least(new.acompte_centimes, v_ttc) when new.acompte_centiemes between 1 and 10000 then least((v_ttc * new.acompte_centiemes + 5000) / 10000, v_ttc) else 0 end; return new; end; $$`,
  });
  /* Où deux textes commencent à différer : la cause se lit d'un coup d'œil. */
  const ecart = (vu, attendu) => {
    let i = 0;
    while (i < vu.length && i < attendu.length && vu[i] === attendu[i]) i += 1;
    return `diffère au caractère ${i} : reçu « …${vu.slice(Math.max(0, i - 40), i + 80)}… », attendu « …${attendu.slice(Math.max(0, i - 40), i + 80)}… »`;
  };
  const formeSqlDe = (nom) => {
    const fs = FONCTIONS.filter((f) => f.nom === nom);
    return fs.length === 1 ? `${sansEspaces(fs[0].attributs)} $$ ${sansEspaces(fs[0].corps)} $$` : `(${fs.length} définition(s) dans le fichier)`;
  };
  for (const [nom, attendu] of Object.entries(FORMES_CALCUL)) {
    const vu = formeSqlDe(nom);
    verifier(`\`${nom}\` a EXACTEMENT la forme relue et éprouvée par les essais — une seule définition, signature et attributs compris`,
      vu === attendu, vu.startsWith('(') ? vu : ecart(vu, attendu));
  }

  /* LE RATTRAPAGE DE 49.6 ter, AVEC SA GARDE, ENTIER (CONTROLES-7 : son
     retrait ne changeait RIEN aux deux essais, qui en rejouaient une copie,
     ni aux 56 contrôles) : le bloc `do $garde_rattrapage_49$`, puis l'ordre
     `update`, puis la contrainte `devis_calculs_check` — dans cet ORDRE, d'un
     seul tenant, dans la section 49, APRÈS le déclencheur qui pose les trois
     colonnes calculées (c'est lui que l'`update` réveille). */
  const RATTRAPAGE_49_6_TER = String.raw`do $garde_rattrapage_49$ declare v_plafond constant bigint := 9999999999; v_borne constant bigint := 9007199254740991; v_n integer; v_ids text; begin select count(*), string_agg(x.id::text, ', ' order by x.id) into v_n, v_ids from (select d.id, (select coalesce(sum(u.base + public.devis_tva_de(u.base, u.taux)), 0) from (select y.taux, sum(y.base)::bigint as base from (select t.taux_tva_centiemes as taux, t.base_centimes as base from public.devis_tva t where t.devis_id = d.id union all select l.taux_tva_centiemes, l.total_centimes from public.devis_lignes l where l.devis_id = d.id and l.type = 'option') y group by y.taux) u) as options from public.devis d) x where x.options > v_plafond; if v_n > 0 then raise exception 'Rattrapage du lot 2a (schema.sql, section 49.6 ter) arrêté avant d''écrire quoi que ce soit. Devis dont le total toutes options comprises, une fois recalculé, dépasserait 99 999 999,99 € — le plafond que le lot 2a impose désormais : %. Laissé ainsi, un tel devis ferait échouer plus tard une écriture qui ne le regarde pas, comme la suppression du compte d''un client. Retirez-lui l''option de trop (ou le brouillon entier), puis rejouez. Devis concernés : %.', v_n, v_ids; end if; select count(*), string_agg(d.id::text, ', ' order by d.id) into v_n, v_ids from public.devis d where d.generation >= v_borne and d.total_ttc_options_centimes < d.total_ttc_centimes; if v_n > 0 then raise exception 'Rattrapage du lot 2a (schema.sql, section 49.6 ter) arrêté avant d''écrire quoi que ce soit. Devis dont le numéro d''écriture est à la borne (9 007 199 254 740 991) et que le rattrapage devrait récrire : %. Seule une application modifiée a pu y mettre ce numéro, et un tel devis ne peut plus être récrit : son total toutes options comprises ne peut pas être posé, et devis_calculs_check le refuserait. Retirez ces brouillons depuis l''éditeur SQL de Supabase, puis rejouez. Devis concernés : %.', v_n, v_ids; end if; end $garde_rattrapage_49$; update public.devis set generation = generation + 1 where generation < 9007199254740991 and (total_ttc_options_centimes < total_ttc_centimes or (total_ttc_options_centimes = 0 and exists (select 1 from public.devis_lignes l where l.devis_id = devis.id and l.type = 'option' and l.total_centimes > 0))); alter table public.devis drop constraint if exists devis_calculs_check; alter table public.devis add constraint devis_calculs_check check (remise_ht_centimes >= 0 and acompte_ttc_centimes between 0 and total_ttc_centimes and total_ttc_options_centimes >= total_ttc_centimes);`;
  const nbGardes = (SQL.match(/\$garde_rattrapage_49\$/g) || []).length;
  const iGarde = S49.search(/\bdo\s+\$garde_rattrapage_49\$/i);
  const iContrainte = iGarde >= 0 ? S49.slice(iGarde).search(/\badd\s+constraint\s+devis_calculs_check\b/i) : -1;
  const iFin = iContrainte >= 0 ? S49.indexOf(';', iGarde + iContrainte) : -1;
  const rattrapage = iFin > 0 ? sansEspaces(S49.slice(iGarde, iFin + 1)) : '';
  const iDeclencheur = S49.search(/create\s+or\s+replace\s+trigger\s+trg_tient_le_devis\b/i);
  verifier('le rattrapage de 49.6 ter — sa GARDE, son `update`, puis `devis_calculs_check` — a EXACTEMENT la forme relue et éprouvée '
    + 'par `essais-section-49-rattrapage.sql`, d’un seul tenant, une seule fois, après `trg_tient_le_devis`',
  nbGardes === 2 && rattrapage === RATTRAPAGE_49_6_TER && iDeclencheur >= 0 && iGarde > iDeclencheur,
  nbGardes !== 2 ? `${nbGardes / 2} bloc(s) $garde_rattrapage_49$` : (rattrapage ? ecart(rattrapage, RATTRAPAGE_49_6_TER) : 'introuvable dans la section 49'));

  /* LA GARDE RECOPIE LA RÈGLE DU POINT 5 DE `tient_le_devis()` POUR JUGER
     (49.6 ter le dit). Les deux formes ci-dessus se comparent chacune à
     elle-même : changer le point 5 ET sa forme attendue, en oubliant la
     garde, passait encore. On compare donc les DEUX COPIES entre elles — le
     même calcul, aux noms près (`new.id` dans le déclencheur, `d.id` dans la
     garde ; l'alias de la sous-requête). */
  const regleOptions = (texte, cible) => {
    const m = new RegExp(String.raw`coalesce\(sum\(u\.base \+ public\.devis_tva_de\(u\.base, u\.taux\)\), 0\)(?:::bigint into v_options)? from \(select (\w+)\.taux, sum\(\1\.base\)::bigint as base from \(([\s\S]*?)\) \1 group by \1\.taux\) u\b`).exec(texte);
    return m ? m[2].split(cible).join(':devis') : null;
  };
  const regleT = regleOptions(sansEspaces(corpsDe('tient_le_devis')), 'new.id');
  const regleG = regleOptions(rattrapage, 'd.id');
  verifier('…et la garde recopie la règle du total toutes options comprises de `tient_le_devis()` (point 5) MOT POUR MOT : l’union, '
    + 'taux par taux, des bases nettes et des options, la TVA arrondie une fois par taux',
  !!regleT && regleT === regleG, `déclencheur : ${regleT} | garde : ${regleG}`);

  /* LES BORNES QUE LA GARDE ET LES CALCULS RECOPIENT : le plafond de
     `devis_plafond_check`, la borne d'OP016 (`NUMERO_MAX`), et la borne de
     l'acompte en pourcentage (relecture BASE-5 : hors de 1 à 10 000, on ne
     multiplie rien et `devis_acompte_check` refuse sous son nom — sans cette
     borne, un client modifié faisait déborder le `bigint`). Une borne
     changée d'un côté sans l'autre se lit ici. */
  const nombre = (re, t) => { const m = re.exec(t || ''); return m ? Number(m[1]) : null; };
  const plafondGarde = nombre(/\bv_plafond\s+constant\s+bigint\s*:=\s*(\d+)\s*;/i, rattrapage);
  const borneGarde = nombre(/\bv_borne\s+constant\s+bigint\s*:=\s*(\d+)\s*;/i, rattrapage);
  const borneUpdate = nombre(/update\s+public\.devis\s+set\s+generation\s*=\s*generation\s*\+\s*1\s+where\s+generation\s*<\s*(\d+)\s+and\b/i, rattrapage);
  const tD = sansEspaces(corpsDe('tient_le_devis'));
  const rD = sansEspaces(corpsDe('recalcule_devis'));
  const borneAcompte = nombre(/when new\.acompte_centiemes between 1 and (\d+) then least\(\(v_ttc \* new\.acompte_centiemes \+ 5000\) \/ \d+, v_ttc\)/, tD);
  const diviseurAcompte = nombre(/least\(\(v_ttc \* new\.acompte_centiemes \+ 5000\) \/ (\d+), v_ttc\)/, tD);
  const diviseurReduction = nombre(/when v_pct is not null then \(v_total_brut \* v_pct \+ 5000\) \/ (\d+)/, rD);
  const borneContrainte = nombre(/acompte_centiemes\s+between\s+1\s+and\s+(\d+)/i, regleDe('devis_acompte_check'));
  verifier('…et ses BORNES sont celles des contraintes et de la file : le plafond de la garde est `PLAFOND` (devis_plafond_check), la '
    + 'borne de l’horloge (garde, `update`) est `NUMERO_MAX` (OP016) ; l’acompte en pourcentage n’est multiplié qu’entre 1 et '
    + '`POURCENT_MAX` (la borne de devis_acompte_check), et les deux pourcentages se divisent par `POURCENT_MAX`',
  plafondGarde === D.PLAFOND && borneGarde === F.NUMERO_MAX && borneUpdate === F.NUMERO_MAX
    && /d\.generation\s*>=\s*v_borne/i.test(rattrapage)
    && borneAcompte === D.POURCENT_MAX && borneContrainte === D.POURCENT_MAX && diviseurAcompte === D.POURCENT_MAX
    && diviseurReduction === D.POURCENT_MAX,
  json({ plafondGarde, borneGarde, borneUpdate, borneAcompte, borneContrainte, diviseurAcompte, diviseurReduction,
    PLAFOND: D.PLAFOND, NUMERO_MAX: F.NUMERO_MAX, POURCENT_MAX: D.POURCENT_MAX }));
}

console.log('\n  19. le statut, et le tri de la liste');
{
  const statuts = listeDe('devis_statut_check', 'statut') || [];
  const api = lire('src/lib/api.js');
  const mesDevis = (/function\s+mesDevis\w*\s*\([\s\S]*?\n\}/.exec(api) || [''])[0];
  verifier('`devis_statut_check` porte UNE valeur ; si un jour il en porte plus, `mesDevis()` ne trie plus par `modifie_le` seule',
    statuts.length === 1 || (statuts.length > 1 && /order\(\s*['"]statut/.test(mesDevis)),
    'la borne de 200 n’est honnête qu’avec le tri : ce qui attend doit passer devant, côté base');
}

console.log('\n  20. les politiques — trois, et rien pour `anon` ; les droits de table, un par un');
{
  /* DANS TOUT LE FICHIER, et pas dans la section 49 seule (relecture des
     essais de l'étape 3, I-3) : « exactement une politique sur `devis` » est
     une propriété de la TABLE. Une politique `using (true)` posée dans la
     section 42 n'existait pas pour l'ancien contrôle — et ouvrait tous les
     devis à tout compte connecté (prouvé : B et P lisaient 1 devis de A). */
  /* LE NOM SOUS SES DEUX FORMES, LA TABLE SOUS TOUTES LES SIENNES (relecture
     des essais, 2e tour, N1 à N4) : un nom sans guillemets (`tout_lire`), un
     nom d'un seul mot entre guillemets — que le dépliage rend nu —, une table
     non qualifiée (`on devis`) ou espacée (`public . devis`) : chacune
     passait l'une ou l'autre version de ce motif, et ouvrait les devis de A à
     B et à P (prouvé). L'essai (cas 12, 28) les voit toutes, par
     `pg_policies`. */
  const pol = [...SQL.matchAll(/create\s+policy\s+(?:"([^"]+)"|([a-z_][\w$]*))\s+on\s+(?:only\s+)?(?:public\s*\.\s*)?(devis|devis_lignes|devis_tva)\b([\s\S]*?);/gi)]
    .map((m) => ({ nom: m[1] || m[2], table: m[3], corps: m[4] }));
  const modifiees = [...SQL.matchAll(/alter\s+policy\s+[^;]*\bon\s+(?:only\s+)?(?:public\s*\.\s*)?(devis|devis_lignes|devis_tva)\b[^;]*;/gi)].map((m) => sansEspaces(m[0]));
  const sur = (tb) => pol.filter((p) => p.table === tb);
  verifier('dans TOUT `schema.sql`, exactement une politique sur `devis`, une sur `devis_lignes`, une sur `devis_tva` (`for select`) ; '
    + 'aucun `alter policy` ne les récrit',
  pol.length === 3 && sur('devis').length === 1 && sur('devis_lignes').length === 1 && sur('devis_tva').length === 1
    && modifiees.length === 0
    && /\bfor\s+all\s+to\s+authenticated\b/i.test(sur('devis')[0].corps) && /\bfor\s+all\s+to\s+authenticated\b/i.test(sur('devis_lignes')[0].corps)
    && /\bfor\s+select\s+to\s+authenticated\b/i.test(sur('devis_tva')[0].corps), `${json(pol.map((p) => `${p.table}:${p.nom}`))} ${modifiees.join(' | ')}`);
  const fautes = pol.filter((p) => /\bto\s+(anon|public)\b/i.test(p.corps) || !/\bto\s+authenticated\b/i.test(p.corps)
    || /auth\.uid\(\)|est_masque|est_admin|professional_partners|blocages|partage|\btrue\b/i.test(p.corps)).map((p) => p.nom);
  verifier('aucune n’est `to anon`, `to public` ou sans rôle, ni n’écrit `auth.uid()`, `true`, `est_masque`, `est_admin`, une '
    + 'relation ou un partage (D6)', fautes.length === 0, fautes.join(', '));
  /* L'APPARTENANCE, par une sous-requête NON CORRÉLÉE (relecture sécurité de
     l'étape 3, I2, mesuré) : `est_mon_entreprise(pro_id)` écrit dans la
     politique s'appelait POUR CHAQUE LIGNE — export de 100 000 lignes à soi
     en 10,6 s, au-delà des 8 s de la vraie base. Les chaînes EXACTES. */
  const DEVIS = 'pro_id in (select public.mes_entreprises())';
  const LIGNES = 'devis_id in (select d.id from public.devis d where d.pro_id in (select public.mes_entreprises()))';
  /* Le contenu d'une clause, PARENTHÈSES COMPTÉES (une expression régulière
     gourmande avalait la clause suivante). */
  const entre = (txt, mot) => {
    const m = new RegExp(`\\b${mot}\\s*\\(`, 'i').exec(txt);
    if (!m) return null;
    let p = 1; let i = m.index + m[0].length;
    const d = i;
    for (; i < txt.length && p > 0; i += 1) { if (txt[i] === '(') p += 1; else if (txt[i] === ')') p -= 1; }
    return sansEspaces(txt.slice(d, i - 1));
  };
  const clauses = (p) => [entre(p.corps, 'using'), entre(p.corps, 'with\\s+check')];
  const [du, dw] = sur('devis')[0] ? clauses(sur('devis')[0]) : [];
  const [lu, lw] = sur('devis_lignes')[0] ? clauses(sur('devis_lignes')[0]) : [];
  const [tu, tw] = sur('devis_tva')[0] ? clauses(sur('devis_tva')[0]) : [];
  verifier('l’appartenance passe par `public.mes_entreprises()`, en sous-requête NON corrélée, des deux côtés — chaînes exactes',
    du === DEVIS && dw === DEVIS && lu === LIGNES && lw === LIGNES && tu === LIGNES && !tw,
    `devis : ${du} / ${dw} ; lignes : ${lu} / ${lw} ; tva : ${tu} / ${tw}`);
  /* …et `mes_entreprises()` ne fait qu'ÉNUMÉRER : c'est `est_mon_entreprise()`
     qui DÉCIDE. Une règle ne s'écrit qu'à UN endroit. */
  const me = FONCTIONS.filter((f) => f.nom === 'mes_entreprises');
  const meApres = me[0] ? SQL.slice(me[0].fin, (FONCTIONS.find((f) => f.index > me[0].index) || { index: SQL.length }).index) : '';
  verifier('`mes_entreprises()` : UNE définition, `security invoker`, `stable`, qui rend `auth.uid()` si et seulement si '
    + '`est_mon_entreprise(auth.uid())` — retirée à PUBLIC et `anon`, rendue à `authenticated`, juste après elle',
  me.length === 1 && /returns\s+setof\s+uuid/i.test(me[0].attributs) && /security\s+invoker/i.test(me[0].attributs)
    && /\bstable\b/i.test(me[0].attributs)
    && sansEspaces(me[0].corps) === 'select auth.uid() where public.est_mon_entreprise(auth.uid())'
    && /revoke\s+all\s+on\s+function\s+public\.mes_entreprises\(\)\s+from\s+public,\s*anon\s*;/i.test(meApres)
    && /grant\s+execute\s+on\s+function\s+public\.mes_entreprises\(\)\s+to\s+authenticated\s*;/i.test(meApres),
  me[0] ? sansEspaces(me[0].corps) : 'introuvable');
  /* LES DROITS DE TABLE (relecture sécurité, M2) : tout retiré à `anon` ET à
     `authenticated`, puis rendu un par un — ni `truncate`, ni `references`,
     ni `trigger`, ni (PostgreSQL 17) `maintain`. Les RÔLES se lisent comme un
     ENSEMBLE (relecture des essais, M4 : l'ordre des mots ne change rien aux
     droits). */
  const roles = (txt) => [...new Set(txt.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean))].sort().join(',');
  const revokes = [...S49.matchAll(/revoke\s+all\s+on\s+public\.devis\s*,\s*public\.devis_lignes\s*,\s*public\.devis_tva\s+from\s+([\w\s,]+?)\s*;/gi)]
    .map((m) => ({ roles: roles(m[1]), index: m.index }));
  /* LA TABLE QUALIFIÉE OU NON (relecture des essais, 2e tour, N12) :
     `grant select on devis_lignes to anon` passait le premier motif, qui
     exigeait `public.` — le droit de table, seconde ligne de défense de la
     section 41, était rendu au visiteur sans un ✘. */
  const grants = [...SQL.matchAll(/grant\s+([^;]*?)\s+on\s+(?:table\s+)?([^;]*?(?:\bpublic\s*\.\s*|(?<![\w$.]))devis(?:_lignes|_tva)?\b[^;]*?)\s+to\s+([^;]*?)\s*;/gi)]
    .map((m) => ({ quoi: sansEspaces(m[1]).toLowerCase(), sur: sansEspaces(m[2]).toLowerCase(), a: roles(m[3]), index: m.index }));
  /* DEPUIS LE LOT 2a, L'ÉCRITURE SE DONNE COLONNE PAR COLONNE : lecture et
     suppression sur les devis et les lignes, puis quatre `grant` de
     colonnes (créer et modifier un devis, créer et modifier une ligne), et
     la lecture seule de la ventilation. Six `grant` exacts, chaque liste de
     colonnes comprise : une colonne ajoutée sans décision — `statut`, un
     total, une date — ouvrirait à un client modifié ce que les déclencheurs
     remplacent, et ce que le lot 2c figera. */
  const attendus = [
    { quoi: 'select, delete', sur: 'public.devis, public.devis_lignes', a: 'authenticated' },
    { quoi: `insert (${DROITS_DE_COLONNE['insert devis'].join(', ')})`, sur: 'public.devis', a: 'authenticated' },
    { quoi: `update (${DROITS_DE_COLONNE['update devis'].join(', ')})`, sur: 'public.devis', a: 'authenticated' },
    { quoi: `insert (${DROITS_DE_COLONNE['insert devis_lignes'].join(', ')})`, sur: 'public.devis_lignes', a: 'authenticated' },
    { quoi: `update (${DROITS_DE_COLONNE['update devis_lignes'].join(', ')})`, sur: 'public.devis_lignes', a: 'authenticated' },
    { quoi: 'select', sur: 'public.devis_tva', a: 'authenticated' },
  ];
  const ok = grants.length === attendus.length
    && attendus.every((g) => grants.some((x) => x.quoi === g.quoi && x.sur === g.sur && x.a === g.a));
  const sRevoke = revokes[0] ? revokes[0].index : -1;
  const iRevokeSql = SQL.search(/revoke\s+all\s+on\s+public\.devis\s*,\s*public\.devis_lignes\s*,\s*public\.devis_tva\s+from\b/i);
  verifier('`revoke all … from anon, authenticated` sur les trois tables, PUIS six `grant` exacts : lecture et suppression des '
    + 'devis et des lignes, leur création et leur modification COLONNE PAR COLONNE (lot 2a), LECTURE SEULE de la ventilation — et '
    + 'aucun autre `grant` sur ces tables dans tout le fichier',
  revokes.length === 1 && revokes[0].roles === 'anon,authenticated' && ok
    /* …et les six APRÈS la révocation, dans le même texte (`SQL`) : un
       `grant` posé avant serait emporté par elle. */
    && sRevoke >= 0 && grants.every((g) => g.index > iRevokeSql),
  `${json(revokes)} ; ${json(grants.map((g) => `${g.quoi} | ${g.sur} | ${g.a}`))}`);
  /* …ET RIEN NE REND CES DROITS SANS NOMMER LES TABLES (relecture des
     essais, 2e tour, N5 et N5b, prouvés) : `grant select on all tables in
     schema public to anon` après la section 49 laissait un visiteur lire les
     e-mails des comptes ; `grant all on all tables … to authenticated`
     laissait B vider par `truncate` les lignes de TOUS les artisans (TRUNCATE
     ignore la RLS). `alter default privileges … on tables` rendrait d'office
     tout ce qui naîtra. L'essai les voit par le catalogue (cas 26) ; ici,
     c'est l'alerte rapide. */
  const iTablesLu = SQL.search(/create\s+table\s+if\s+not\s+exists\s+public\.devis\s*\(/i);
  const enMasseTables = [...SQL.matchAll(/grant\s+[^;]*\bon\s+all\s+tables\s+in\s+schema\b[^;]*;/gi)]
    .filter((m) => iTablesLu > 0 && m.index > iTablesLu).map((m) => sansEspaces(m[0]));
  const parDefautTables = [...SQL.matchAll(/alter\s+default\s+privileges\b[^;]*\bgrant\b[^;]*\bon\s+tables\b[^;]*;/gi)].map((m) => sansEspaces(m[0]));
  verifier('…et aucun `grant … on all tables in schema` après la création des tables du devis, aucun `alter default privileges … on '
    + 'tables` : ils rendraient les droits sans nommer les tables', iTablesLu > 0 && enMasseTables.length === 0 && parDefautTables.length === 0,
  [...enMasseTables, ...parDefautTables].join(' | ') || 'les tables du devis sont introuvables dans le texte lu');
}

console.log('\n  21. les fonctions et les déclencheurs');
{
  const attr = (nom) => (fonctionDe(nom) || {}).attributs || '';
  verifier('`recalcule_devis` et `recalcule_apres_ligne_de_devis` sont `security definer` ; `tient_le_devis`, '
    + '`tient_la_ligne_de_devis`, `devis_total_ligne`, `devis_tva_de` ne le sont pas',
  /security\s+definer/i.test(attr('recalcule_devis')) && /security\s+definer/i.test(attr('recalcule_apres_ligne_de_devis'))
    && ['tient_le_devis', 'tient_la_ligne_de_devis', 'devis_total_ligne', 'devis_tva_de'].every((f) => fonctionDe(f) && !/security\s+definer/i.test(attr(f))));
  const r = fonctionDe('recalcule_devis');
  const apres = r ? SQL.slice(r.fin, (FONCTIONS.find((f) => f.index > r.index) || { index: SQL.length }).index).replace(/^\s*;/, '') : '';
  /* Les RÔLES se lisent comme un ENSEMBLE (relecture des essais, M4) :
     `from anon, authenticated, public` retire exactement la même chose. */
  const rolesRetires = (/^\s*revoke\s+all\s+on\s+function\s+public\.recalcule_devis\(uuid,\s*bigint\)\s+from\s+([\w\s,]+?)\s*;/i.exec(apres) || [])[1] || '';
  verifier('`recalcule_devis(uuid, bigint)` est retirée à PUBLIC, `anon` ET `authenticated`, JUSTE APRÈS ELLE (dans n’importe quel ordre)',
    [...new Set(rolesRetires.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean))].sort().join(',') === 'anon,authenticated,public',
    sansEspaces(apres).slice(0, 160));
  /* QUALIFIÉ OU NON (relecture des essais, 2e tour, N6, prouvé) : une
     `definer` accordée qui appelait `recalcule_devis(p, 2^53 − 1)` sans
     `public.` laissait B figer le devis de A — ni ce motif, qui exigeait
     `public.`, ni les deux autres contrôles ne la voyaient ; l'essai, si
     (cas 27b : une `definer` ouverte de trop). */
  const appelants = FONCTIONS.filter((f) => /\brecalcule_devis\s*\(/.test(f.corps)).map((f) => f.nom);
  /* DEUX APPELANTS depuis le lot 2a, nommés : le déclencheur des lignes,
     et celui de la réduction (`recalcule_apres_reduction`), qui l'appelle
     avec un numéro VIDE — un recalcul sans écriture de ligne, qui ne peut
     ni lever l'horloge ni être refusé par elle. Un numéro écrit là
     laisserait une modification de l'en-tête pousser l'horloge du devis. */
  const reduc = fonctionDe('recalcule_apres_reduction');
  verifier('…et ses SEULS appelants sont `recalcule_apres_ligne_de_devis` et `recalcule_apres_reduction` — le second avec un '
    + 'numéro VIDE (`recalcule_devis(new.id, null)`) et rien d’autre (un appelant de plus, et la révocation le casserait)',
  json([...new Set(appelants)].sort()) === json(['recalcule_apres_ligne_de_devis', 'recalcule_apres_reduction'])
    && !/grant[^;]*recalcule_devis/i.test(SQL) && !!reduc
    && sansEspaces(reduc.corps) === 'begin perform public.recalcule_devis(new.id, null); return null; end;'
    && /security\s+definer/i.test(reduc.attributs),
  `${json(appelants)} ; ${reduc ? sansEspaces(reduc.corps) : 'recalcule_apres_reduction introuvable'}`);
  /* …ET RIEN NE LA REND SANS LA NOMMER (relecture des essais, I-4, prouvé :
     un autre artisan figeait le devis de A, l'horloge poussée au maximum).
     `grant … on all functions in schema …` rend tout ce qui existe déjà ;
     `alter default privileges … on functions` tout ce qui naîtra. Le premier
     n'a pas sa place APRÈS la section 49 ; le second nulle part dans ce
     fichier (Supabase le pose lui-même, et c'est contre lui que chaque
     `revoke` de ce fichier est écrit). */
  /* La place de la section 49 DANS LE TEXTE LU (sans commentaires) : `iS49`
     est un index du texte brut, et les deux ne se comparent pas — le premier
     jet de ce contrôle le faisait, et laissait passer le `grant` en masse
     (éprouvé en le posant avant `mes_donnees()`). */
  const iS49Lu = SQL.search(/create\s+table\s+if\s+not\s+exists\s+public\.devis\s*\(/i);
  const enMasse = [...SQL.matchAll(/grant\s+[^;]*\bon\s+all\s+(functions|routines|procedures)\s+in\s+schema\b[^;]*;/gi)]
    .filter((m) => iS49Lu > 0 && m.index > iS49Lu).map((m) => sansEspaces(m[0]));
  const parDefaut = [...SQL.matchAll(/alter\s+default\s+privileges\b[^;]*\bgrant\b[^;]*\bon\s+(functions|routines)\b[^;]*;/gi)].map((m) => sansEspaces(m[0]));
  verifier('…et aucun `grant … on all functions in schema` après la section 49, aucun `alter default privileges … on functions` : '
    + 'ils la rendraient sans la nommer', iS49Lu > 0 && enMasse.length === 0 && parDefaut.length === 0,
  [...enMasse, ...parDefaut].join(' | ') || 'la section 49 est introuvable dans le texte lu');
  const corpsR = r ? r.corps : '';
  const iVerrou = corpsR.search(/\bfor\s+no\s+key\s+update\b/i);
  const iLignes = corpsR.search(/\bpublic\.devis_lignes\b/i);
  verifier('`recalcule_devis` prend `for no key update` AVANT sa première lecture de `devis_lignes`, et aucun `for update` nu',
    iVerrou > 0 && iLignes > iVerrou && !/\bfor\s+update\b/i.test(corpsR.replace(/\bfor\s+no\s+key\s+update\b/gi, '')),
    'FOR UPDATE interbloque deux insertions (FOR KEY SHARE de la clé étrangère) ; sans verrou, deux lignes au même taux en '
    + 'oublient une (concurrence, passages 1 et 3)');
  const corps49 = FONCTIONS.filter((f) => NOMS49.includes(f.nom));
  const ordresDestructeurs = corps49.filter((f) => /(^|;|\bthen|\bbegin|\bloop|\belse)\s*(delete|drop|truncate)\b/i.test(f.corps)).map((f) => f.nom);
  verifier('aucun corps de fonction de la section ne contient un ordre `delete`, `drop` ni `truncate` (le connecteur les refuse, '
    + 'même là)', corps49.length >= 6 && ordresDestructeurs.length === 0, ordresDestructeurs.join(', '));
  const horsSchema = [...S49.matchAll(/(^|;)\s*(delete|drop)\b([^;]*)/gi)].map((m) => sansEspaces(m[2] + m[3]))
    .filter((o) => !/^drop\s+(policy|constraint|trigger|index)\s+if\s+exists\b/i.test(o));
  verifier('…et les seuls `drop` de la section sont les formes rejouables de `schema.sql` (`drop … if exists`)',
    horsSchema.length === 0, horsSchema.join(' | '));
  verifier('`tient_le_devis` ne lit pas `auth.uid()` : pendant une cascade, c’est celui de QUELQU’UN D’AUTRE',
    !!fonctionDe('tient_le_devis') && !/auth\.uid\(\)/.test(corpsDe('tient_le_devis')));
  /* TOUS les déclencheurs de la section, y compris ceux qui portent une
     liste de colonnes (`update of a, b`) ou une condition (`when (…)`) : le
     premier motif ne lisait ni les virgules ni `when`, et deux déclencheurs
     lui échappaient sans un mot — celui du blocage (lot S-b) et celui de la
     réduction (lot 2a). Le nombre de `create or replace trigger` lus doit
     être celui du texte. */
  const decl = [...S49.matchAll(/create\s+or\s+replace\s+trigger\s+(\w+)\s+(before|after)\s+([\w\s,]+?)\s+on\s+public\.(\w+)\s+for\s+each\s+row\s+(?:when\s*\(([^;]*?)\)\s+)?execute\s+function\s+public\.(\w+)\(\)/gi)]
    .map((m) => `${m[1]}|${m[2]} ${sansEspaces(m[3])}|${m[4]}|${m[6]}${m[5] ? `|when ${sansEspaces(m[5])}` : ''}`);
  const nbDecl = (S49.match(/create\s+or\s+replace\s+trigger\b/gi) || []).length;
  verifier('les cinq déclencheurs existent SOUS LEURS NOMS, en `create or replace trigger` (leur ordre est alphabétique), '
    + 'événements, colonnes et condition compris — et aucun autre',
  nbDecl === decl.length && json(decl.sort()) === json([
    'trg_recalcule_apres_reduction|after update of remise_centiemes, remise_centimes|devis|recalcule_apres_reduction|when '
      + 'old.remise_centiemes is distinct from new.remise_centiemes or old.remise_centimes is distinct from new.remise_centimes',
    'trg_recalcule_devis|after insert or update or delete|devis_lignes|recalcule_apres_ligne_de_devis',
    'trg_tient_la_ligne_de_devis|before insert or update|devis_lignes|tient_la_ligne_de_devis',
    'trg_tient_le_devis|before insert or update|devis|tient_le_devis',
    'trg_tient_le_lien_du_devis|before insert or update of quote_request_id, sos_request_id|devis|tient_le_lien_du_devis',
  ]) && !/create\s+trigger\b/i.test(S49), `${nbDecl} lu(s) dans le texte ; ${json(decl)}`);
}

console.log('\n  21 bis. la requête tardive (49.5 bis) — la parade est tenue par la BASE');
{
  const r = corpsDe('recalcule_devis');
  const t = corpsDe('tient_le_devis');
  const a = corpsDe('recalcule_apres_ligne_de_devis');
  const iVerrou = r.search(/\bfor\s+no\s+key\s+update\b/i);
  const iOP015 = r.search(/p_generation\s+is\s+not\s+null\s+and\s+p_generation\s*<=\s*v_horloge/i);
  verifier('`recalcule_devis` lit l’horloge du devis SOUS son verrou, puis refuse (OP015) une écriture de ligne dont le numéro '
    + 'ne la dépasse pas — et, depuis le lot 2a, la réduction demandée dans la MÊME lecture (une réduction lue hors du verrou '
    + 'pourrait être celle d’avant)',
  /select\s+d\.generation\s*,\s*d\.remise_centiemes\s*,\s*d\.remise_centimes\s+into\s+v_horloge\s*,\s*v_pct\s*,\s*v_montant\s+from\s+public\.devis\s+d\s+where\s+d\.id\s*=\s*p_devis\s+for\s+no\s+key\s+update/i.test(r)
    && iOP015 > iVerrou && iVerrou > 0 && /using\s+errcode\s*=\s*'OP015'/i.test(r));
  verifier('…et l’horloge AVANCE au numéro de l’écriture appliquée (jamais un incrément, jamais un recul)',
    /update\s+public\.devis\s+set\s+modifie_le\s*=\s*clock_timestamp\(\),\s*generation\s*=\s*coalesce\(p_generation,\s*generation\)\s+where\s+id\s*=\s*p_devis/i.test(r));
  /* LE DÉPLACEMENT porte son numéro aux DEUX devis (49.5 bis, point 6 —
     relecture de l'étape 3, prouvé à deux sessions : avec `null` pour le
     devis quitté, un déplacement tardif écrasait une retouche plus récente,
     et le numéro de la ligne RECULAIT). Seule la suppression passe sans
     numéro. */
  verifier('le déclencheur passe le numéro de la ligne pour une insertion ou une modification — AUX DEUX DEVIS quand elle change de '
    + 'devis —, et RIEN pour une suppression seule',
  /tg_op\s*=\s*'DELETE'\s+then\s+perform\s+public\.recalcule_devis\(old\.devis_id,\s*null\)/i.test(a)
    && (a.match(/public\.recalcule_devis\(new\.devis_id,\s*new\.generation\)/gi) || []).length === 3
    && (a.match(/public\.recalcule_devis\(old\.devis_id,\s*new\.generation\)/gi) || []).length === 2
    && (a.match(/public\.recalcule_devis\(old\.devis_id,\s*null\)/gi) || []).length === 1
    && (a.match(/public\.recalcule_devis\(/gi) || []).length === 6, sansEspaces(a).slice(0, 400));
  /* LES BORNES DU NUMÉRO (49.5 bis, point 7) : NULL, 0, un négatif et
     au-delà de 2^53 − 1 sont refusés par OP016 dans les DEUX déclencheurs
     `before` — et la borne est celle de la file (`NUMERO_MAX`). */
  const borne = (c) => (/new\.generation\s+is\s+null\s+or\s+new\.generation\s+not\s+between\s+1\s+and\s+(\d+)\s+then\s+raise\s+exception\s+'(?:[^']|'')*'\s+using\s+errcode\s*=\s*'OP016'/i.exec(c) || [])[1];
  const bL = borne(corpsDe('tient_la_ligne_de_devis'));
  const bD = borne(t);
  verifier('le numéro est BORNÉ — absent, nul, négatif ou au-delà de 2^53 − 1 : OP016 — dans `tient_le_devis` ET '
    + '`tient_la_ligne_de_devis`, et c’est la borne de la file (`NUMERO_MAX`)',
  !!bL && bL === bD && Number(bL) === F.NUMERO_MAX && F.NUMERO_MAX === Number.MAX_SAFE_INTEGER, `ligne ${bL}, devis ${bD}, file ${F.NUMERO_MAX}`);
  /* LE PLAFOND PAR DEMANDE ET PAR URGENCE (OP017 — relecture sécurité, I1,
     mesuré : 100 000 brouillons rattachés à la demande d'un particulier
     bloquaient la suppression de son compte). Compté SOUS UN VERROU
     consultatif pris AVANT le compte, une constante écrite UNE fois. */
  const pl = (lien, mot) => new RegExp(`if\\s+new\\.${lien}\\s+is\\s+not\\s+null\\s+and\\s+\\(tg_op\\s*=\\s*'INSERT'\\s+or\\s+new\\.${lien}\\s+is\\s+distinct\\s+from\\s+old\\.${lien}\\)\\s+then\\s+`
    + `perform\\s+pg_advisory_xact_lock\\(hashtextextended\\('devis:${mot}:'\\s*\\|\\|\\s*new\\.${lien}::text,\\s*0\\)\\)\\s*;\\s*`
    + `if\\s+\\(select\\s+count\\(\\*\\)\\s+from\\s+public\\.devis\\s+d\\s+where\\s+d\\.${lien}\\s*=\\s*new\\.${lien}\\s+and\\s+d\\.pro_id\\s*=\\s*new\\.pro_id\\s+and\\s+d\\.id\\s*<>\\s*new\\.id\\)\\s*>=\\s*v_plafond\\s+then`, 'i');
  verifier('un PLAFOND de devis par demande et par urgence (OP017), compté SOUS un verrou consultatif pris AVANT le compte, '
    + 'quand le lien est posé ou change — la constante écrite une fois (`v_plafond`)',
  pl('quote_request_id', 'demande').test(t) && pl('sos_request_id', 'urgence').test(t)
    && (t.match(/using\s+errcode\s*=\s*'OP017'/gi) || []).length === 2
    && /v_plafond\s+constant\s+integer\s*:=\s*20\s*;/i.test(t) && (t.match(/:=\s*20\b/g) || []).length === 1);
  verifier('`tient_le_devis` : une écriture DIRECTE du devis (`pg_trigger_depth() = 1`) doit faire MONTER le numéro ; aucune '
    + 'écriture, d’où qu’elle vienne, ne le fait reculer (OP015)',
  /pg_trigger_depth\(\)\s*=\s*1\s+and\s+new\.generation\s*<=\s*old\.generation/i.test(t)
    && /or\s+new\.generation\s*<\s*old\.generation/i.test(t) && /using\s+errcode\s*=\s*'OP015'/i.test(t));
  const iOP014 = r.search(/using\s+errcode\s*=\s*'OP014'/i);
  verifier('le plafond de lignes (OP014) est compté SOUS le verrou, et ne refuse jamais une suppression',
    iOP014 > iVerrou && /if\s+p_generation\s+is\s+not\s+null\s+and\s+\(select\s+count\(\*\)/i.test(r)
    && !/OP014/.test(corpsDe('tient_la_ligne_de_devis')));
}

console.log('\n  21 ter. dans TOUT le fichier : les déclencheurs des trois tables, les fonctions du devis, chaque `grant` et chaque `revoke`');
{
  /* POURQUOI (relecture « contrôles » du lot 2a, CONTROLES-6, trois formes
     prouvées au vert) : le compte des déclencheurs ne lisait que la section
     49 — un déclencheur « nature = acompte par défaut » posé APRÈS le titre
     de la section 50 passait ; la section 20 ne lisait qu'UN `revoke`, sous
     sa forme exacte — `revoke update (validite_jours) on public.devis from
     authenticated` posé après les six `grant` passait, et toute écriture des
     conditions aurait rendu 42501. Ces propriétés sont celles des TABLES et
     des FONCTIONS : elles se lisent dans tout le fichier, chaînes comprises
     (un ordre passé à `execute` est un ordre). */
  const TABLE_DEVIS = String.raw`(?:only\s+)?(?:public\s*\.\s*)?(?:devis_lignes|devis_tva|devis)\b(?!\s*\.)`;
  /* 1. LES DÉCLENCHEURS : exactement les cinq de la section 49, chacun une
        fois ; aucun `drop trigger` ni `alter trigger` sur ces tables. */
  const DECLENCHEURS = ['trg_recalcule_apres_reduction', 'trg_recalcule_devis', 'trg_tient_la_ligne_de_devis', 'trg_tient_le_devis',
    'trg_tient_le_lien_du_devis'];
  const surDevis = new RegExp(String.raw`\bon\s+${TABLE_DEVIS}`, 'i');
  /* LE NOM, ENTRE GUILLEMETS AUSSI (banc adverse du 04/11, N11) : `create
     trigger "Zz_Nature" …` — un nom avec une majuscule n'est pas déplié —
     échappait au lecteur, qui n'attendait que `[\w$]+` : un déclencheur
     « nature = acompte par défaut » passait au vert. */
  const NOM_SQL = String.raw`(?:[\w$]+|"(?:[^"]|"")+")`;
  const decl = [...SQL.matchAll(new RegExp(String.raw`\bcreate\s+(?:or\s+replace\s+)?(?:constraint\s+)?trigger\s+(${NOM_SQL})\s+([\s\S]*?)\bexecute\s+(?:function|procedure)\b`, 'gi'))]
    .filter((m) => surDevis.test(m[2])).map((m) => m[1].toLowerCase()).sort();
  const retires = [...SQL.matchAll(new RegExp(String.raw`\b(?:drop|alter)\s+trigger\s+(?:if\s+exists\s+)?${NOM_SQL}\s+on\s+${TABLE_DEVIS}[^;']*`, 'gi'))]
    .map((m) => sansEspaces(m[0]));
  verifier('dans TOUT le fichier, les déclencheurs posés sur `devis`, `devis_lignes` et `devis_tva` sont EXACTEMENT les cinq de la '
    + 'section 49, chacun une fois — et aucun `drop trigger` ni `alter trigger` ne les touche',
  json(decl) === json(DECLENCHEURS) && retires.length === 0, `${json(decl)} ${retires.join(' | ')}`);

  /* 2. LES FONCTIONS DE LA SECTION 49 : une définition chacune, et aucun
        `alter function` ne change après coup ce que la forme a relu
        (`security definer`, `set search_path`, un propriétaire). */
  const plusieurs = NOMS49.filter((n) => FONCTIONS.filter((f) => f.nom === n).length !== 1);
  const alterees = [...SQL.matchAll(new RegExp(String.raw`\balter\s+(?:function|procedure|routine)\s+(?:public\s*\.\s*)?(${NOMS49.join('|')})\b[^;']*`, 'gi'))]
    .map((m) => sansEspaces(m[0]));
  verifier(`les ${NOMS49.length} fonctions de la section 49 ont UNE définition chacune dans tout le fichier, et aucune n’est modifiée `
    + 'par un `alter function` (attributs, propriétaire, `search_path`)',
  NOMS49.length >= 11 && plusieurs.length === 0 && alterees.length === 0, `${plusieurs.join(', ')} ${alterees.join(' | ')}`);

  /* 3. CHAQUE `grant` ET CHAQUE `revoke` QUI NOMME UNE TABLE OU UNE FONCTION
        DU DEVIS, lus comme des ENSEMBLES (privilèges, colonnes, cibles,
        rôles — l'ordre des mots ne change rien aux droits), comparés à la
        liste FERMÉE ci-dessous, écrite en SQL. Un droit de plus ou de moins
        se DÉCIDE : la base, l'essai (cas 18 de l'essai des conditions, cas 26
        et 27 de l'essai 49), et cette liste, dans le même lot. */
  const decouper = (t) => {
    const parts = []; let p = 0; let cur = '';
    for (const ch of t) {
      if (ch === '(') p += 1;
      if (ch === ')') p -= 1;
      if (ch === ',' && p === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  };
  const canon = (texte) => {
    const t = sansEspaces(texte).toLowerCase();
    const m = /^(grant|revoke)\s+(.+?)\s+on\s+(?:(table|function|procedure|routine)\s+)?(.+?)\s+(to|from)\s+(.+)$/.exec(t);
    if (!m) return `illisible : ${t}`;
    const privs = decouper(m[2]).map((x) => {
      const c = /^(\w+)\s*\((.*)\)$/.exec(x);
      return c ? `${c[1]}(${decouper(c[2]).sort().join(',')})` : x;
    }).sort();
    const sortePourFonction = m[3] && m[3] !== 'table';
    const cibles = sortePourFonction ? [m[4].replace(/\s+/g, '').replace(/^public\./, '')]
      : decouper(m[4]).map((x) => x.replace(/\s+/g, '').replace(/^public\./, '')).sort();
    return json([m[1], privs, sortePourFonction ? 'fonction' : 'table', cibles, decouper(m[6]).sort()]);
  };
  const DROITS_DU_DEVIS = [
    'revoke all on function public.devis_total_ligne(bigint, bigint) from public, anon',
    'grant execute on function public.devis_total_ligne(bigint, bigint) to authenticated',
    'revoke all on function public.devis_tva_de(bigint, integer) from public, anon',
    'grant execute on function public.devis_tva_de(bigint, integer) to authenticated',
    'revoke all on function public.repartir_au_plus_fort_reste(bigint, bigint[]) from public, anon, authenticated',
    'revoke all on function public.recalcule_devis(uuid, bigint) from public, anon, authenticated',
    'revoke all on function public.peut_faire_un_devis(uuid, uuid) from public, anon',
    'grant execute on function public.peut_faire_un_devis(uuid, uuid) to authenticated',
    'revoke all on function public.mes_entreprises() from public, anon',
    'grant execute on function public.mes_entreprises() to authenticated',
    'revoke all on public.devis, public.devis_lignes, public.devis_tva from anon, authenticated',
    'grant select, delete on public.devis, public.devis_lignes to authenticated',
    `grant insert (${DROITS_DE_COLONNE['insert devis'].join(', ')}) on public.devis to authenticated`,
    `grant update (${DROITS_DE_COLONNE['update devis'].join(', ')}) on public.devis to authenticated`,
    `grant insert (${DROITS_DE_COLONNE['insert devis_lignes'].join(', ')}) on public.devis_lignes to authenticated`,
    `grant update (${DROITS_DE_COLONNE['update devis_lignes'].join(', ')}) on public.devis_lignes to authenticated`,
    'grant select on public.devis_tva to authenticated',
  ].map(canon).sort();
  const nommeLeDevis = new RegExp(String.raw`\b(?:devis_lignes|devis_tva|devis)\b(?!\s*\.)|\b(?:${NOMS49.join('|')})\b`, 'i');
  const ordres = [...SQL.matchAll(/\b(grant|revoke)\b([^;']*)/gi)]
    .map((m) => ({ texte: sansEspaces(m[0]), index: m.index }))
    .filter((o) => /\bon\b/i.test(o.texte) && nommeLeDevis.test(o.texte.replace(/^\S+\s+[\s\S]*?\bon\s+/i, 'on ')));
  const lus = ordres.map((o) => canon(o.texte)).sort();
  const enTrop = lus.filter((x, i) => lus.indexOf(x) === i && lus.filter((y) => y === x).length > DROITS_DU_DEVIS.filter((y) => y === x).length);
  const enMoins = DROITS_DU_DEVIS.filter((x, i) => DROITS_DU_DEVIS.indexOf(x) === i
    && DROITS_DU_DEVIS.filter((y) => y === x).length > lus.filter((y) => y === x).length);
  verifier(`chaque \`grant\` et chaque \`revoke\` qui nomme une table ou une fonction du devis (${ordres.length} lus dans tout le fichier, `
    + 'chaînes comprises) est dans la liste FERMÉE — ni un droit de colonne RETIRÉ après les `grant`, ni un droit RENDU à un autre rôle',
  ordres.length === DROITS_DU_DEVIS.length && json(lus) === json(DROITS_DU_DEVIS),
  `en trop : ${enTrop.join(' | ') || '—'} ; en moins : ${enMoins.join(' | ') || '—'}`);
  /* …les `grant` de table APRÈS le `revoke` des tables (un `grant` posé avant
     serait emporté par lui). */
  const iRevokeTables = (ordres.find((o) => /^revoke all on public\.devis, public\.devis_lignes, public\.devis_tva from\b/i.test(o.texte)) || {}).index;
  const grantsAvant = ordres.filter((o) => /^grant\b/i.test(o.texte) && !/\bon\s+function\b/i.test(o.texte) && !(o.index > iRevokeTables));
  verifier('…les `grant` de table viennent APRÈS le `revoke` des trois tables', iRevokeTables >= 0 && grantsAvant.length === 0,
    grantsAvant.map((o) => o.texte).join(' | '));
  /* 4. EN MASSE : aucun `grant` NI `revoke` `on all … in schema` après la
        création des tables du devis (la section 20 ne lisait que les
        `grant`). Et un ordre FABRIQUÉ (`execute format('… on %s …')`) qui ne
        vise pas une fonction ne fait que RETIRER `truncate`, `references`,
        `trigger` ou `maintain` — c'est la boucle de la section 53 ; un autre
        rendrait ou retirerait un droit sans nommer la table. */
  const iTables = SQL.search(/create\s+table\s+if\s+not\s+exists\s+public\.devis\s*\(/i);
  const enMasse = [...SQL.matchAll(/\b(?:grant|revoke)\b[^;']*\bon\s+all\s+(?:tables|sequences|functions|routines|procedures)\s+in\s+schema\b[^;']*/gi)]
    .filter((m) => iTables > 0 && m.index > iTables).map((m) => sansEspaces(m[0]));
  const fabriques = [...SQL.matchAll(/\bformat\s*\(\s*'\s*((?:grant|revoke)\b(?:[^']|'')*)'/gi)].map((m) => sansEspaces(m[1]).toLowerCase())
    .filter((t) => !/\bon\s+function\b/.test(t))
    .filter((t) => {
      const m = /^revoke\s+(.+?)\s+on\s+/.exec(t);
      return !m || !decouper(m[1]).every((p) => ['truncate', 'references', 'trigger', 'maintain'].includes(p));
    });
  verifier('…aucun `grant` ni `revoke` « on all … in schema » après les tables du devis, et aucun ordre fabriqué par `format` qui '
    + 'touche une table autrement qu’en RETIRANT `truncate`, `references`, `trigger` ou `maintain`',
  iTables > 0 && enMasse.length === 0 && fabriques.length === 0, [...enMasse, ...fabriques].join(' | '));
  /* 5. UNE FONCTION DU DEVIS NE SE NOMME DANS UNE CHAÎNE QUE POUR LA
        DOCUMENTER (`comment on … is '…'`) : nommée dans une liste d'une
        boucle (`foreach f in array array['public.recalcule_devis(…)']`), elle
        recevrait un droit que le texte ci-dessus ne voit pas. */
  const chaines = [];
  for (const m of SQL.matchAll(/(?<![\w$])[eE]?'((?:[^']|'')*)'/g)) {
    if (!new RegExp(String.raw`\b(?:${NOMS49.join('|')})\s*\(`).test(m[1])) continue;
    const debut = SQL.lastIndexOf(';', m.index) + 1;
    if (!/^\s*comment\s+on\b/i.test(SQL.slice(debut, m.index))) chaines.push(sansEspaces(SQL.slice(debut, m.index + 80)).slice(0, 160));
  }
  verifier('…et une fonction du devis n’est nommée dans une CHAÎNE que par un `comment on` (jamais dans la liste d’une boucle de droits)',
    chaines.length === 0, chaines.join(' | '));
}

console.log('\n  22. qui nomme les tables du devis — une liste FERMÉE');
{
  /* LE NOM QUALIFIÉ, jamais le mot : « devis » est dans les chaînes de cinq
     fonctions existantes (des phrases, et le genre `'devis'` d'une demande).
     Les fonctions qui nomment `public.devis`, `public.devis_lignes` ou
     `public.devis_tva` sont EXACTEMENT ces trois-là — `tient_la_ligne_de_devis`
     n'en nomme plus depuis que le plafond de lignes a déménagé sous le verrou
     de `recalcule_devis` (étape 3, 21/10/2026) ; et aucune référence ne
     s'écrit sans `public.` (relecture « base », B2). */
  const FERMEE = ['mes_donnees', 'recalcule_devis', 'tient_le_devis'];
  const nomment = [...new Set(FONCTIONS.filter((f) => /\bpublic\s*\.\s*devis(_lignes|_tva)?\b/i.test(f.corps)).map((f) => f.nom))].sort();
  const enTrop = nomment.filter((n) => !FERMEE.includes(n));
  const enMoins = FERMEE.filter((n) => !nomment.includes(n));
  verifier(`le schéma est lu (${FONCTIONS.length} fonctions)`, FONCTIONS.length >= 60);
  if (TABLES_CREEES) {
    verifier('les fonctions qui nomment les tables du devis sont EXACTEMENT la liste fermée — un nom en trop ou en moins rougit',
      enTrop.length === 0 && enMoins.length === 0, `en trop : ${enTrop.join(', ') || '—'} ; en moins : ${enMoins.join(', ') || '—'}`);
  } else {
    verifier('les tables du devis ne sont pas encore créées : AUCUNE fonction ne les nomme', nomment.length === 0, nomment.join(', '));
  }
  verifier('aucune fonction `admin_*` ne les nomme (`PLAN-DEVIS` 10.10, l’engagement du 18/10)',
    !nomment.some((n) => /^admin_/.test(n)), nomment.join(', '));
  /* NON QUALIFIÉE, sous TOUTES ses formes (relecture des essais, I-2) :
     après `from`, `join`, `into`, `update`, `table`, `only`, `using` — et
     après une VIRGULE (`from (select 1) x, devis_lignes l`), cherchée dans
     le texte SANS SES CHAÎNES pour ne pas tomber sur une phrase française.
     SANS « regard en avant » sur la parenthèse (2e tour, N9, prouvé) : le
     premier jet écartait `devis_lignes (` — c'est-à-dire `insert into
     devis_lignes (devis_id, …)`, la forme d'un déclencheur `definer` qui
     écrivait dans le devis d'un autre artisan, et que rien ne voyait. */
  const nonQualifiees = [
    ...[...SQL.matchAll(/\b(from|join|into|update|table|only|using)\s+devis(_lignes|_tva)?\b/gi)].map((m) => m[0]),
    ...[...sansChaines(SQL).matchAll(/,\s*devis(_lignes|_tva)?\b(?!\s*[:=])/gi)].map((m) => m[0]),
  ];
  verifier('aucune référence NON qualifiée (`from devis`, `update devis_lignes`, `…, devis_lignes l`…) dans tout `schema.sql`',
    nonQualifiees.length === 0, nonQualifiees.join(' | '));
  /* UNE VUE passe outre la RLS (elle lit avec les droits de son
     propriétaire) : aucune ne nomme ces tables, qualifiées ou non. */
  const vues = [...SQL.matchAll(/create\s+(?:or\s+replace\s+)?(?:materialized\s+)?view\b[^;]*;/gi)]
    .map((m) => m[0]).filter((v) => /\bdevis(_lignes|_tva)?\b/i.test(sansChaines(v)));
  verifier('aucune VUE ne nomme les tables du devis (une vue lit par-dessus les politiques)', vues.length === 0,
    vues.map((v) => sansEspaces(v).slice(0, 100)).join(' | '));
  /* UNE RÈGLE (`create rule`) agit avec les droits du propriétaire de SA
     table, par-dessus la RLS : posée sur `clients`, elle laissait B écrire
     une ligne dans le devis de A en créant une fiche dans son propre carnet
     (sabotage N14 de la fin de l'étape 3, prouvé). `schema.sql` n'en
     contient aucune, et n'en a besoin d'aucune : la règle de texte la plus
     simple est « aucune ». L'essai (cas 27e) la voit par `pg_rewrite`. */
  const regles = [...SQL.matchAll(/create\s+(?:or\s+replace\s+)?rule\b[^;]*/gi)].map((m) => sansEspaces(m[0]).slice(0, 100));
  verifier('aucune RÈGLE (`create rule`) dans tout `schema.sql` : elle écrirait par-dessus les politiques', regles.length === 0,
    regles.join(' | '));
  verifier('…et aucune fonction HORS du schéma `public` ne les nomme', !FONCTIONS.some((f) => f.schema !== 'public'
    && /\bpublic\.devis(_lignes|_tva)?\b|\bdevis(_lignes|_tva)?\b/i.test(f.corps)));
  const definer = FONCTIONS.filter((f) => nomment.includes(f.nom) && /security\s+definer/i.test(f.attributs)).map((f) => f.nom);
  verifier('…et parmi elles, `recalcule_devis` SEULE est `security definer`', json([...new Set(definer)]) === json(['recalcule_devis']),
    json(definer));
}

console.log('\n  23. la place — la 49 entre la 48 et l’export ; `mes_donnees()` la dernière fonction ; le balayage le dernier bloc');
{
  verifier('la section 49 commence après la 48 et finit au plus tard à l’en-tête de la 42 (la 50 se pose entre les deux)',
    iS48 > 0 && iS49 > iS48 && iFinS49 > iS49 && iS42 >= iFinS49);
  const derniere = FONCTIONS[FONCTIONS.length - 1];
  verifier('`mes_donnees()` est la DERNIÈRE fonction du fichier (PostgreSQL contrôle un corps SQL à sa création)',
    derniere && derniere.nom === 'mes_donnees', derniere && derniere.nom);
  const iBalayage = SQL.indexOf('do $portes$');
  const apres = iBalayage > 0 ? SQL.slice(SQL.indexOf('$portes$;', iBalayage) + 9) : 'x';
  verifier('le balayage (`do $portes$`) vient après la dernière fonction, et derrière lui il n’y a plus que des `revoke`',
    iBalayage > derniere.fin && apres.split(';').map((x) => x.trim()).filter(Boolean).every((o) => /^revoke\s/i.test(o)),
    sansEspaces(apres).slice(0, 200));
}

console.log('\n  24. l’export — `mes_donnees()`');
{
  const m = corpsDe('mes_donnees');
  verifier('il rend `devis_emis`, `devis_lignes`, `devis_tva` et `demandes_de_devis`',
    ['devis_emis', 'devis_lignes', 'devis_tva', 'demandes_de_devis'].every((k) => new RegExp(`'${k}'\\s*,`).test(m)));
  verifier('…et ni `\'devis\'` (elle portait les DEMANDES, des deux côtés) ni `\'demandes_de_devis_recues\'` (faux pour un particulier)',
    !/'devis'\s*,/.test(m) && !/'demandes_de_devis_recues'/.test(m));
  verifier('…les lignes dans l’ordre du devis (`ordre`, puis `id`), et la ventilation EN ENTIER (zéros compris)',
    /order\s+by\s+l\.devis_id,\s*l\.ordre,\s*l\.id/i.test(m) && !/nb_lignes\s*>\s*0/.test(m));
}

console.log('\n  25. les noms déjà pris');
{
  verifier('aucun `create index … idx_devis_pro` (il existe sur `quote_requests` : un `if not exists` ne créerait RIEN, sans un mot)',
    !/create\s+(unique\s+)?index\s+(if\s+not\s+exists\s+)?idx_devis_pro\b[^;]*on\s+public\.devis\b/i.test(SQL)
    && (SQL.match(/create\s+(unique\s+)?index\s+(if\s+not\s+exists\s+)?idx_devis_pro\b/gi) || []).length === 1);
  verifier('aucune politique « lecture mes devis » (ni « creation devis », « le pro traite le devis ») posée sur les tables du devis',
    !/create\s+policy\s+"(lecture mes devis|creation devis|le pro traite le devis|mes informations de devis)"\s+on\s+public\.devis(_lignes|_tva)?\b/i.test(SQL));
}

/* ================================================================== */
/*  C. L'ESSAI — `supabase/essais-section-49.sql`                       */
/* ================================================================== */
console.log('\nC. L’ESSAI — ce que le fichier SQL doit contenir (le jouer est l’affaire de PostgreSQL, à la main)');
console.log('\n  26. l’essai et le témoin');
{
  let brut = '';
  try { brut = lire('supabase/essais-section-49.sql'); } catch (e) { brut = ''; }
  const essai = sansCommentairesSql(brut);
  verifier('`supabase/essais-section-49.sql` existe et a un CAS 0 (la donnée existe)',
    brut.length > 5000 && /\\echo\s+'===\s+0\.\s/.test(essai));
  /* AUCUN BLOC `do`, SOUS AUCUNE SYNTAXE, et aucun `set_config` du rôle ou
     du jeton (relecture des essais, 2e tour, E1) : le premier motif ne lisait
     que `do $…$ … $…$` — `do language plpgsql $x$ … $x$` y échappait, et un
     cas de RLS joué là passe au vert sans rien éprouver (01/10/2026). L'essai
     n'a besoin d'aucun bloc `do` : la règle la plus simple est la seule qui
     ne se contourne pas par la syntaxe. */
  const blocsDo = [...essai.matchAll(/(?:^|;)\s*do\s*(?:\$|[eE]?'|language\b)/gim)].map((m) => sansEspaces(m[0]));
  const setConfig = [...essai.matchAll(/set_config\s*\(\s*'(?:role|request\.jwt[^']*)'/gi)].map((m) => m[0]);
  verifier('aucun `set local role` ni `request.jwt` dans un bloc `do` — et aucun bloc `do` du tout, sous aucune syntaxe (`do $…$`, '
    + '`do language …`, `do \'…\'`), ni aucun `set_config` du rôle ou du jeton : la RLS n’est pas appliquée dans un bloc `do`, '
    + 'l’essai passerait au vert sans rien éprouver',
  blocsDo.length === 0 && setConfig.length === 0, [...blocsDo, ...setConfig].join(' | '));
  const annonces = [...essai.matchAll(/\\echo\s+'([^']*)'/g)].map((m) => m[1]).join('\n');
  const noms = [...D.CONTRAINTES_LIGNE, 'devis_retenue_check', 'devis_source_check', 'devis_statut_check', 'devis_lieu_code_postal_check',
    'devis_objet_check', 'devis_plafond_check', 'OP013', 'OP014', 'OP015', 'OP016', 'OP017', '23505',
    'permission denied for table devis_tva', 'permission denied for table devis', 'permission denied for function mes_donnees',
    'permission denied for function recalcule_devis', 'permission denied for function mes_entreprises', 'row-level security policy',
    'row-level security policy (USING expression)'];
  const absents = noms.filter((n) => !annonces.includes(n));
  verifier('il annonce ses refus PAR LEUR NOM (les dix de ligne, six du devis, OP013 à OP017, 23505, les droits de table et de '
    + 'fonction, la RLS)',
    absents.length === 0, `non annoncés : ${absents.join(', ')}`);
  /* Toute suppression d'un cas compte les lignes AVANT et APRÈS — hors le
     ménage de tête, et hors les refus attendus sur `devis_tva` (le dernier
     ordre de leur transaction). */
  /* Le joueur du cas 30 est une fonction TEMPORAIRE : ses `delete` sont
     ceux des cas d'argent, comptés par leur attendu. On lit les cas sans
     les corps de fonction. */
  /* ENCADRÉE, et pas seulement « quelque part » (relecture des essais,
     M5) : un `count(*)` n'importe où avant et après dans le cas suffisait —
     retirer le comptage qui suit la première suppression du cas 8 passait,
     parce qu'un autre suivait la seconde. Désormais, chaque SUITE de
     suppressions (des `delete` consécutifs, seuls `set`, `reset` et `\echo`
     entre eux) doit avoir un comptage depuis la suite précédente — ou le
     début de sa transaction — ET un autre avant la suite suivante — ou la
     fin de sa transaction. */
  const cas = essai.replace(/\$\$[\s\S]*?\$\$/g, ' ').split(/\\echo\s+'===\s+/).slice(1);
  const nus = [];
  let suites = 0;
  cas.forEach((c) => {
    const titre = c.slice(0, 30).trim();
    /* Les ordres du cas, dans l'ordre : `begin`/`rollback`/`commit` ferment
       un encadrement ; les lignes `\…` de psql sont des ordres neutres. */
    const ordres = c.split(/;|\n(?=\\)/).map((o) => sansEspaces(o.replace(/^\s*\\[^\n]*$/gm, ' '))).filter(Boolean);
    const neutre = (o) => /^(set|reset)\b/i.test(o);
    const fin = (o) => /^(begin|rollback|commit)\b/i.test(o);
    /* UN COMPTAGE QUI COMPTE LA TABLE SUPPRIMÉE (relecture des essais, 2e
       tour, E2) : remplacer, au cas 21, le comptage qui suit la suppression
       du brouillon par un `count(*)` des FICHES passait — le cas n'éprouvait
       plus rien. Le comptage doit nommer l'une des tables que la suite
       supprime ; pour `auth.users`, l'une de celles que la cascade vide. */
    const CASCADE_COMPTE = ['auth.users', 'public.devis', 'public.devis_lignes', 'public.devis_tva', 'public.quote_requests',
      'public.sos_requests', 'public.clients'];
    const tableDe = (o) => { const m = /^delete\s+from\s+(public\.\w+|auth\.users)\b/i.exec(o); return m ? m[1].toLowerCase() : null; };
    const compte = (o, tables) => /count\(\*\)/i.test(o) && tables.some((t) => new RegExp(`\\b${t.replace('.', '\\.')}\\b(?![\\w])`, 'i').test(o));
    const supprime = (o) => { const t = tableDe(o); return t && t !== 'public.devis_tva'; };
    for (let i = 0; i < ordres.length; i += 1) {
      if (!supprime(ordres[i])) continue;
      let j = i;
      while (j + 1 < ordres.length && (supprime(ordres[j + 1]) || neutre(ordres[j + 1]))) j += 1;
      const tables = [...new Set(ordres.slice(i, j + 1).map(tableDe).filter(Boolean)
        .flatMap((t) => (t === 'auth.users' ? CASCADE_COMPTE : [t])))];
      let avant = false;
      for (let k = i - 1; k >= 0 && !fin(ordres[k]) && !supprime(ordres[k]); k -= 1) if (compte(ordres[k], tables)) { avant = true; break; }
      let apres = false;
      for (let k = j + 1; k < ordres.length && !fin(ordres[k]) && !supprime(ordres[k]); k += 1) if (compte(ordres[k], tables)) { apres = true; break; }
      suites += 1;
      if (!avant || !apres) nus.push(`${titre} : ${ordres[i].slice(0, 60)}${avant ? '' : ' (rien compté AVANT)'}${apres ? '' : ' (rien compté APRÈS)'}`);
      i = j;
    }
  });
  verifier(`toute suppression d’un cas est ENCADRÉE par un comptage avant et un après — qui compte LA TABLE supprimée —, même quand `
    + `elle doit réussir (${suites} suites de suppressions lues — moins de dix : le lecteur a perdu sa cible)`, suites >= 10 && nus.length === 0,
  nus.join(' | '));
  verifier('le cas 30 lit `supabase/cas-devis.json` et joue les cas par une fonction TEMPORAIRE (rien n’entre dans le schéma)',
    /\\set\s+cas\s+`cat\s+supabase\/cas-devis\.json`/.test(essai) && /create\s+or\s+replace\s+function\s+pg_temp\.jouer_cas\(/i.test(essai)
    && /écarts : /.test(essai));
  const requis = ['14 bis', '14 ter', '14 quater', '14 quinquies', '16 bis', '16 ter', '31', '32', '33', '34'];
  const manquants = requis.filter((n) => !new RegExp(`\\\\echo\\s+'===\\s+${n.replace(' ', '\\s+')}\\.`).test(essai));
  verifier('il contient les cas 14 bis (un lien inchangé), 14 ter (la prémisse d’OP013), 14 quater (les identifiants), 14 quinquies '
    + '(OP013 à la création), 16 bis et 16 ter (OP014, par insertion et par déplacement), 31 (l’ordre des déclencheurs), 32 (la '
    + 'requête tardive), 33 (visiteur, jeton vide, administrateur, blocage, upsert) et 34 (OP017)', manquants.length === 0, manquants.join(', '));
  /* LES CAS QUI ÉPROUVENT CE QUE LES RELECTURES DE L'ÉTAPE 3 ONT TROUVÉ
     (chacun avait PASSÉ un sabotage) : la création liée à la fiche d'un
     autre, la frontière « <= », le déplacement tardif, le contrat « un ordre
     = une ligne », les bornes du numéro, et le cas 9 qui compare aux LIGNES. */
  const exige = [
    [/14 quinquies[\s\S]*?insert\s+into\s+public\.devis\s*\(pro_id,\s*client_id,\s*generation\)\s*values\s*\(:A,\s*:CB,/i, '14 quinquies : une CRÉATION liée à la fiche de B'],
    [/32k\.[\s\S]*?generation\s*=\s*10\s+where\s+id\s*=\s*:L5/i, '32k : une ligne au numéro ÉGAL à l’horloge (10)'],
    [/32l\.[\s\S]*?set\s+devis_id\s*=\s*:D2,[^;]*generation\s*=\s*15/i, '32l : le déplacement tardif (n° 15 après n° 20)'],
    [/32m\.[\s\S]*?'Première',[^;]*?,\s*5\),\s*\([^;]*?,\s*5\);/i, '32m : deux lignes, un seul ordre, le même numéro'],
    [/32n\.[\s\S]*?,\s*null\);/i, '32n : un numéro NULL'],
    [/=== 9\.[\s\S]*?full\s+join\s+ventilation[\s\S]*?=== 10\./i, '9 : la ventilation comparée aux LIGNES par une jointure complète'],
  ].filter(([re]) => !re.test(essai)).map(([, quoi]) => quoi);
  verifier('…et les formes que les relectures ont vu passer : ' + 'création liée à la fiche d’un autre, frontière « <= », '
    + 'déplacement tardif, un ordre = une ligne, numéro NULL, invariants contre les lignes', exige.length === 0, exige.join(' | '));
  /* LES PREUVES PAR LE CATALOGUE (relecture des essais, 2e tour) : c'est
     l'essai qui tient la sécurité, et c'est donc lui qui ne doit rien perdre.
     Ce contrôle ne peut que vérifier qu'il INTERROGE encore le catalogue
     comme il le faut — et que le motif du cas 27 n'a pas retrouvé son
     « regard en avant », qui cachait `insert into devis_lignes (…)` (N9). */
  const c27 = (/===\s+27\.[\s\S]*?===\s+28\./.exec(essai) || [''])[0];
  const c26 = (/===\s+26\.[\s\S]*?===\s+27\./.exec(essai) || [''])[0];
  const c4q = (/===\s+4\s+quater\.[\s\S]*?===\s+5\./.exec(essai) || [''])[0];
  const unites = D.UNITES.map((u) => u.cle);
  const preuves = [
    [/pg_get_function_sqlbody\s*\(\s*p\.oid\s*\)/i.test(c27) && /\bp\.prosrc\b/i.test(c27), '27a : le corps lu dans `prosrc` ET `prosqlbody`'],
    [c27.length > 0 && !/\(\?!\\s\*\\\(\)/.test(c27), '27a : AUCUN regard en avant `(?!\\s*\\()` dans le motif (il cachait N9)'],
    [/definer_ouvertes_attendu_\d+/.test(c27) && /p\.prosecdef\s+and\s+\(has_function_privilege\('anon'/i.test(c27), '27b : les `definer` appelables, en liste fermée'],
    [/definer_fermees_attendu_\d+/.test(c27) && /p\.prosecdef\s+and\s+not\s+\(has_function_privilege\('anon'/i.test(c27), '27c : les `definer` NON appelables (déclencheurs compris), en liste fermée'],
    [/\bpg_rewrite\b/i.test(c27) && /\bpg_depend\b/i.test(c27), '27d-e : dépendances, vues et règles'],
    [/\bpg_trigger\b[\s\S]*?not\s+t\.tgisinternal/i.test(c27), '27f : les déclencheurs posés sur les trois tables'],
    [/has_any_column_privilege\('anon'/i.test(c26) && /has_any_column_privilege\('public'/i.test(c26)
      && /has_table_privilege\('public'/i.test(c26), '26 : PUBLIC, et les droits de COLONNE'],
    [unites.length === 7 && unites.every((k) => new RegExp(`,\\s*'${k}',\\s*\\d+,\\s*\\d+,\\s*(true|false),\\s*\\d+\\)`).test(c4q)),
      `4 quater : les sept unités de \`UNITES\` (${unites.join(', ')}) INSÉRÉES, une ligne chacune (N13)`],
  ].filter(([ok]) => !ok).map(([, quoi]) => quoi);
  verifier('…et les preuves PAR LE CATALOGUE que le 2e tour a rendues nécessaires (droits de colonne et PUBLIC, `prosrc` + `prosqlbody` '
    + 'sans regard en avant, `definer` en deux listes fermées, règles, déclencheurs, les sept unités insérées)', preuves.length === 0,
  preuves.join(' | '));
  let temoin = '';
  try { temoin = lire('supabase/essais-section-49-temoin.sql'); } catch (e) { temoin = ''; }
  verifier('le témoin de concurrence vit dans `supabase/essais-section-49-temoin.sql` (le déclencheur `S_attente`)…',
    /create\s+trigger\s+"S_attente"/i.test(sansCommentairesSql(temoin)) && /pg_sleep\(2\)/.test(temoin));
  verifier('…et JAMAIS dans `schema.sql`', !/S_attente|temoin_attente_essai_49/.test(SQL));
}

console.log('\n  26 bis. l’essai des conditions et l’essai du rattrapage (lot 2a)');
{
  /* Aucun contrôle ne lisait ces deux fichiers. Ce qu'ils doivent contenir
     se garde ici — le JOUER reste l'affaire de PostgreSQL, à la main
     (A-FAIRE §2.3). */
  let brutC = ''; let brutR = '';
  try { brutC = lire('supabase/essais-section-49-conditions.sql'); } catch (e) { brutC = ''; }
  try { brutR = lire('supabase/essais-section-49-rattrapage.sql'); } catch (e) { brutR = ''; }
  const cond = sansCommentairesSql(brutC);
  const ratt = sansCommentairesSql(brutR);
  /* LES DÉFAUTS DES COLONNES DU LOT 2a, RELUS DANS LE CATALOGUE (relecture
     CONTROLES-2) : « nature sans défaut » et « validité : rien de
     pré-choisi » (décisions du 03/11) n'étaient tenues NULLE PART — un
     `alter column … set default` posé plus bas passait les deux essais.
     Le cas 23 lit `column_default` et `is_nullable` des onze colonnes, et
     juge chacune par une colonne `…_attendu_t`. La liste est écrite ici ET
     dans l'essai : chacune garde l'autre. */
  const DEFAUTS_ATTENDUS = [
    ['devis', 'remise_centiemes', null, 'YES'], ['devis', 'remise_centimes', null, 'YES'],
    ['devis', 'acompte_centiemes', null, 'YES'], ['devis', 'acompte_centimes', null, 'YES'],
    ['devis', 'acompte_nature', null, 'YES'], ['devis', 'validite_jours', null, 'YES'],
    ['devis', 'retenue_garantie_centiemes', null, 'YES'],
    ['devis', 'remise_ht_centimes', '0', 'NO'], ['devis', 'acompte_ttc_centimes', '0', 'NO'],
    ['devis', 'total_ttc_options_centimes', '0', 'NO'], ['devis_tva', 'remise_centimes', '0', 'NO'],
  ];
  const c23 = (/\\echo\s+'===\s+23\.[\s\S]*$/.exec(cond) || [''])[0];
  const tuple = ([t, c, d, n]) => new RegExp(String.raw`\(\s*'${t}'\s*,\s*'${c}'\s*,\s*${d === null ? 'null' : `'${d}'`}\s*,\s*'${n}'\s*\)`, 'i');
  const absents = DEFAUTS_ATTENDUS.filter((x) => !tuple(x).test(c23)).map((x) => x.slice(0, 2).join('.'));
  /* …et le JUGEMENT lit le catalogue : la jointure qui nourrit
     `forme_attendu_t` est celle de `information_schema.columns`, sur la
     table et la colonne attendues, et la comparaison porte sur le défaut ET
     le « not null » (sabotage Q47 du banc : la jointure passée sur une autre
     vue laissait un `information_schema.columns` ailleurs dans le cas, et le
     contrôle passait pendant que le cas tombait en erreur). */
  const c23plat = sansEspaces(c23).toLowerCase();
  const jugement = [
    ['from attendu a', 'la liste des onze colonnes n’est pas la source du jugement'],
    ["left join information_schema.columns c on c.table_schema = 'public' and c.table_name = a.tab and c.column_name = a.col",
      'la jointure du jugement ne lit pas `information_schema.columns` sur la table et la colonne attendues'],
    ['coalesce(c.column_default is not distinct from a.defaut and c.is_nullable = a.nullable, false) as forme_attendu_t',
      '`forme_attendu_t` ne compare pas le défaut ET le « not null » lus aux attendus (un manquant = faux)'],
  ].filter(([forme]) => !c23plat.includes(forme)).map(([, quoi]) => quoi);
  verifier('l’essai des conditions relit, cas 23, le DÉFAUT et le « not null » des onze colonnes du lot 2a (et de la retenue) dans '
    + '`information_schema.columns` — aucune valeur par défaut pour ce que l’artisan choisit, 0 pour ce que la base calcule — et '
    + 'juge chacune par une colonne `…_attendu_t`',
  brutC.length > 5000 && /information_schema\.columns/i.test(c23) && /\bcolumn_default\b/i.test(c23) && /\bis_nullable\b/i.test(c23)
    && /is\s+not\s+distinct\s+from/i.test(c23) && /_attendu_t\b/.test(c23) && absents.length === 0 && jugement.length === 0,
  absents.length ? `absents du cas 23 : ${absents.join(', ')}` : (jugement.join(' | ') || 'cas 23 introuvable, ou sans lecture du catalogue'));
  /* LE RATTRAPAGE S'ÉPROUVE PAR schema.sql LUI-MÊME (relecture CONTROLES-7 et
     BASE-6) : l'essai pose d'anciens devis puis REJOUE le schéma (`\ir`),
     deux fois en partie 1, une fois par refus de la garde — et ne recopie
     JAMAIS l'ordre `update` : une copie ne voyait aucun des trois défauts. */
  const irs = (ratt.match(/^\s*\\ir\s+schema\.sql\s*$/gim) || []).length;
  const copies = [cond, ratt].filter((t) => /set\s+generation\s*=\s*generation\s*\+\s*1\b/i.test(t)).length;
  verifier('l’essai du rattrapage REJOUE `schema.sql` (`\\ir`, au moins quatre fois : deux rejeux, puis les deux refus de la garde), en '
    + 'trois parties jugées par des colonnes `…_attendu_t` — et aucun des deux essais ne recopie l’ordre `update` du rattrapage',
  brutR.length > 3000 && irs >= 4 && ['1', '2', '3'].every((n) => new RegExp(String.raw`\\echo\s+'===\s+${n}\.\s`).test(ratt))
    && /_attendu_t\b/.test(ratt) && /\\set\s+ON_ERROR_ROLLBACK\s+on/i.test(ratt) && copies === 0,
  `${irs} \\ir ; ${copies} copie(s) de l’update`);
}

console.log('\n  26 ter. les deux essais du lot 2a jouent ce qui a été relu — ni coupés, ni aveuglés, ni recopiés');
{
  /* POURQUOI (banc adverse du 04/11/2026 : sept défauts verts, tous dans
     les ESSAIS, que `npm run verifier` ne joue pas — A-FAIRE §2.3) : le
     retrait du cas 13 bis (B6a — l'ERROR attendu disparaissait, et rien ne
     le comptait) ; un `relire()` qui ne juge plus rien (B6c — « t » quoi
     qu'il arrive) ; un `\q` ou un `\if false` qui coupent les parties 2 et
     3 du rattrapage (N19, N20) ; un cas 23 filtré par `where false`, ou qui
     n'affiche plus que les colonnes justes (N21, N22) ; et l'ordre du
     rattrapage RECOPIÉ sous une autre forme dans l'essai (N23), qui le
     rendait aveugle au retrait du rattrapage. Ce que fait un essai ne se
     SAIT qu'en le jouant ; ce contrôle tient trois propriétés de son TEXTE :
     (1) aucune méta-commande ne le coupe, ne le saute ni ne le conditionne ;
     (2) ses trois JUGES (`relire`, `lire`, le cas 23) ont la forme relue ;
     (3) il joue EXACTEMENT les ordres relus, dans cet ordre — une EMPREINTE
     par ordre (commentaires et `\echo` retirés, blancs réduits).
     CHANGER UN ESSAI SE DÉCIDE : le rejouer sur une base neuve (le schéma
     deux fois), lire chaque `…_attendu_t` et chaque ERROR annoncé, puis
     `node scripts/verifier-devis.mjs --empreinte-essais` donne l'empreinte
     nouvelle à recopier ici. */
  const ordresDeLEssai = (brut) => {
    const res = [];
    let sql = '';
    const vider = () => {
      let i = 0;
      while (i < sql.length) {
        while (i < sql.length && /\s/.test(sql[i])) i += 1;
        if (i >= sql.length) break;
        const f = finDOrdreSql(sql, i);
        const o = formeCanonique(sql.slice(i, f + 1));
        if (o) res.push(o);
        i = f + 1;
      }
      sql = '';
    };
    for (const l of sansCommentairesSql(brut).split('\n')) {
      if (/^\s*\\/.test(l)) {
        if (/^\s*\\echo\b/.test(l)) continue;
        vider();
        res.push(formeCanonique(l));
      } else sql += `${l}\n`;
    }
    vider();
    return res;
  };
  const empreinteDe = (o) => createHash('sha256').update(o).digest('hex').slice(0, 8);
  const ecartDeTextes = (vu, attendu) => {
    let i = 0;
    while (i < vu.length && i < attendu.length && vu[i] === attendu[i]) i += 1;
    return `diffère au caractère ${i} : « …${vu.slice(Math.max(0, i - 30), i + 60)}… », attendu « …${attendu.slice(Math.max(0, i - 30), i + 60)}… »`;
  };
  const EMPREINTES = {
    'supabase/essais-section-49-conditions.sql': `
      ea204fd0 a42b5839 e6d39479 11f916d2 9ae9ffe7 539ea4c9 fe7a39a2 bf46f024 58364e28 9e84eb77 819a22c5 9535a418
      085b0ee8 3877bf7f 5cd053aa 03edac1b edd65695 8808baf6 364647c8 350fa2c4 16ef89c9 388cebd2 edd65695 19ccc5ce
      95c8eec7 8e18d6e4 78f8158f 4013b479 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f c7ba749f 64b38cfb
      1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f 2152cc4b 3e6917f1 1a2a6843 edd65695 19ccc5ce 95c8eec7
      62ffae9a 78f8158f 3e6917f1 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f c3958304 44ee60e2 1a2a6843
      edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f 1bf8ad18 44ee60e2 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4
      78f8158f 2152cc4b 04cb23cd f92f35fd 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f 2152cc4b ff0cc6c8
      4904ad7b 1a2a6843 edd65695 19ccc5ce 95c8eec7 9d578183 8f37b74c 25e9e855 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 78f8158f dda01f11 594af12f 58ec85c8 5ac61542 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f
      771672ba a59af5b2 cf61d1df c22bc682 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f bea7c175 87b60896
      d307c3fa 04cb23cd 6348b615 ae1e7562 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 64e256eb a8ba364e c7a5b5dd
      ef26e1d2 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 7ceb33f3 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4
      c2387a8f 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 cef63aef 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4
      165de478 1a2a6843 edd65695 19ccc5ce 95c8eec7 9d578183 6a100fb5 671dfbfd 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 3901736e 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 b18b7d04 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 880b6d3d 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 35f500c5 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 d9e37294 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 27b62650 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 4e112200 ed8cb8c7 1a2a6843 edd65695 19ccc5ce 95c8eec7 9318d6e1 eaf42292 1a2a6843 edd65695 19ccc5ce
      95c8eec7 9d578183 026d464a 1a2a6843 edd65695 19ccc5ce 95c8eec7 1e403c83 a3a588e2 27896266 f93f5494 f5a298e2
      8987c181 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f 1a3877fe 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 78f8158f d526dec5 e0cac331 1a2a6843 edd65695 19ccc5ce 95c8eec7 12f96fe4 b9e233f9 00c45eb1 c7cd65de
      c8a15988 73b093f4 bef0bbaf 1a2a6843 edd65695 19ccc5ce 95c8eec7 cb023507 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 4349f47a 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 197321de 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 ef52d54f 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 53d55c1e 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 45d1cebf 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 06c1e1c4 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 77b8828c 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 b9e79b8f 1a2a6843 edd65695 19ccc5ce 95c8eec7
      8e18d6e4 78f8158f 67bfd527 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f 12f16112 1a2a6843 edd65695
      19ccc5ce 95c8eec7 8e18d6e4 78f8158f a0217a90 1a2a6843 cdc577fe 88eb1bd7 248556d1 4b439408 4d880d4c 13912acb
      1441f239 3771726b edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f c43faebb a59edfec a54b0e4f bd2af069 95c8eec7
      0b57b066 1a2a6843 3019c1ab 710f3690`,
    'supabase/essais-section-49-rattrapage.sql': `
      ea204fd0 a42b5839 487feef8 e6d39479 11f916d2 40b5e395 910964bd bbe8eece 9a0b1f3e e85833ec 4910e716 06c1e0f2
      c4f022d1 adac5bc7 2ac8c3b8 5cd053aa c9dc7baa edd65695 2480b900 364647c8 94f16cc3 edd65695 b61a7250 8e64dc2e
      e4628805 263ed406 176aa82e 982dcf16 eb02f8cb 8f2b7c66 3ffecb82 4670ad52 30d72b2b 4cca38df a518b040 28cf07d7
      9b78afba 40a292ba 3bbca5dc 91c07051 ed695e67 3ffecb82 4670ad52 30d72b2b 4cca38df a518b040 28cf07d7 9b78afba
      40a292ba 3bbca5dc 91c07051 ed695e67 5f22fc60 1a2a6843 edd65695 b61a7250 8e64dc2e 0d6ac72a 35e0bc00 982dcf16
      8f2b7c66 3ffecb82 4670ad52 30d72b2b 8d2f9989 1a2a6843 edd65695 b61a7250 8e64dc2e 554b27f7 84775eca 458aa20c
      982dcf16 8f2b7c66 3ffecb82 4670ad52 30d72b2b f37ef7df 1a2a6843 a9cfd3c6 d4da5e3f`,
  };
  const JUGES = {
    'supabase/essais-section-49-conditions.sql': [
      ['`relire()`, le juge des cas 0 à 13 bis', String.raw`prepare relire(uuid, text) as select r.*, concat_ws('|', r.ht, r.tva, r.ttc, r.reduction, r.acompte, r.options, r.ventilation) = $2 as valeurs_attendu_t from (select d.total_ht_centimes as ht, d.total_tva_centimes as tva, d.total_ttc_centimes as ttc, d.remise_ht_centimes as reduction, d.acompte_ttc_centimes as acompte, d.total_ttc_options_centimes as options, coalesce((select string_agg(concat_ws(':', t.taux_tva_centiemes, t.base_centimes, t.remise_centimes, t.tva_centimes, t.nb_lignes), ',' order by t.taux_tva_centiemes desc) from public.devis_tva t where t.devis_id = d.id), '—') as ventilation, d.generation as horloge from public.devis d where d.id = $1) r;`],
      ['le cas 23, le juge des défauts et du « not null »', String.raw`with attendu(tab, col, defaut, nullable) as (values ('devis', 'remise_centiemes', null, 'YES'), ('devis', 'remise_centimes', null, 'YES'), ('devis', 'acompte_centiemes', null, 'YES'), ('devis', 'acompte_centimes', null, 'YES'), ('devis', 'acompte_nature', null, 'YES'), ('devis', 'validite_jours', null, 'YES'), ('devis', 'retenue_garantie_centiemes', null, 'YES'), ('devis', 'remise_ht_centimes', '0', 'NO'), ('devis', 'acompte_ttc_centimes', '0', 'NO'), ('devis', 'total_ttc_options_centimes', '0', 'NO'), ('devis_tva', 'remise_centimes', '0', 'NO') ) select a.tab || '.' || a.col as colonne, c.column_default as defaut_lu, c.is_nullable as nullable_lu, coalesce(c.column_default is not distinct from a.defaut and c.is_nullable = a.nullable, false) as forme_attendu_t from attendu a left join information_schema.columns c on c.table_schema = 'public' and c.table_name = a.tab and c.column_name = a.col order by a.tab, a.col;`],
    ],
    'supabase/essais-section-49-rattrapage.sql': [
      ['`lire()`, le juge des trois parties', String.raw`prepare lire(uuid, text) as select d.objet, d.total_ht_centimes as ht, d.total_tva_centimes as tva, d.total_ttc_centimes as ttc, d.remise_ht_centimes as reduction, d.acompte_ttc_centimes as acompte, d.total_ttc_options_centimes as options, d.generation as horloge, concat_ws('|', d.total_ht_centimes, d.total_tva_centimes, d.total_ttc_centimes, d.remise_ht_centimes, d.acompte_ttc_centimes, d.total_ttc_options_centimes, d.generation) = $2 as valeurs_attendu_t from public.devis d where d.id = $1;`],
    ],
  };
  const essais = Object.keys(EMPREINTES).map((f) => {
    let brut = '';
    try { brut = lire(f); } catch (e) { brut = ''; }
    return { f, brut, ordres: brut ? ordresDeLEssai(brut) : [] };
  });
  if (process.argv[2] === '--empreinte-essais') {
    for (const e of essais) {
      const h = e.ordres.map(empreinteDe);
      const lignes = [];
      for (let i = 0; i < h.length; i += 12) lignes.push(`      ${h.slice(i, i + 12).join(' ')}`);
      console.log(`\n    '${e.f}' (${h.length} ordres) :\n${lignes.join('\n')}`);
    }
  }

  /* (1) LES MÉTA-COMMANDES : `\echo`, `\set`, `\pset`, `\o` (vers
     `/dev/null`, ou rendu) et `\ir schema.sql` — rien d'autre, et rien au
     milieu d'une ligne (`select 1 \gexec`, `… \q`). Une chaîne est vidée
     avant de chercher. */
  const PERMISES = new Set(['echo', 'set', 'pset', 'o', 'ir']);
  const metaFautives = [];
  for (const e of essais) {
    for (const l of sansCommentairesSql(e.brut).split('\n')) {
      const videe = l.replace(/[eE]'(?:[^'\\]|\\.|'')*'|'(?:[^']|'')*'/g, "''");
      const cmds = [...videe.matchAll(/\\([A-Za-z!?]*)/g)];
      cmds.forEach((m, k) => {
        const debutDeLigne = k === 0 && /^\s*$/.test(videe.slice(0, m.index));
        const ok = debutDeLigne && PERMISES.has(m[1])
          && (m[1] !== 'o' || /^\s*\\o(?:\s+\/dev\/null)?\s*$/.test(l))
          && (m[1] !== 'ir' || /^\s*\\ir\s+schema\.sql\s*$/.test(l));
        if (!ok) metaFautives.push(`${e.f.replace('supabase/essais-section-49-', '')} : ${sansEspaces(l).slice(0, 80)}`);
      });
    }
  }
  verifier('les deux essais du lot 2a ne portent AUCUNE méta-commande qui les coupe, les saute ou les conditionne (`\\q`, `\\if`, '
    + '`\\gexec`, `\\i` d’un autre fichier…) : seulement `\\echo`, `\\set`, `\\pset`, `\\o` vers `/dev/null` et `\\ir schema.sql`, '
    + 'chacune en tête de sa ligne',
  essais.every((e) => e.brut.length > 3000) && metaFautives.length === 0, metaFautives.join(' | '));

  /* (2) LES JUGES, ENTIERS. */
  const jugesFaux = [];
  for (const e of essais) {
    for (const [quoi, ecrit] of JUGES[e.f] || []) {
      const attendu = formeCanonique(ecrit);
      const debut = attendu.slice(0, 24);
      const vus = e.ordres.filter((o) => o.startsWith(debut));
      if (vus.length !== 1 || vus[0] !== attendu) {
        jugesFaux.push(`${quoi} : ${vus.length} ordre(s) ${vus.length === 1 ? ecartDeTextes(vus[0], attendu) : ''}`);
      }
    }
  }
  verifier('les JUGES des deux essais ont EXACTEMENT la forme relue : `relire()` compare les sept valeurs relues à l’attendu, le cas 23 '
    + 'lit les onze colonnes dans `information_schema.columns` sans filtre et juge chacune, `lire()` compare les sept valeurs du '
    + 'rattrapage — un juge affaibli rend « t » quoi qu’il arrive',
  jugesFaux.length === 0, jugesFaux.join(' | '));

  /* (3) LES ORDRES, UN PAR UN, DANS L'ORDRE. */
  const ecartsOrdres = [];
  for (const e of essais) {
    const attendues = EMPREINTES[e.f].trim().split(/\s+/);
    const vues = e.ordres.map(empreinteDe);
    let i = 0;
    while (i < vues.length && i < attendues.length && vues[i] === attendues[i]) i += 1;
    if (i < vues.length || i < attendues.length) {
      ecartsOrdres.push(`${e.f.replace('supabase/', '')} : ${vues.length} ordres pour ${attendues.length} relus ; le n° ${i + 1} `
        + `diffère — « ${(e.ordres[i] || '(plus rien)').slice(0, 140)} »`);
    }
  }
  verifier('les deux essais jouent EXACTEMENT les ordres relus, dans cet ordre (une empreinte par ordre) : aucun cas retiré, aucun '
    + 'ordre ajouté — un ordre du rattrapage recopié dans l’essai le rendrait aveugle à son retrait du schéma',
  ecartsOrdres.length === 0, ecartsOrdres.join(' | '));
}

/* ================================================================== */
/*  D. L'API — `src/lib/api.js`, lu sans ses commentaires              */
/* ================================================================== */
console.log('\nD. L’API — par la file, et rien que par elle');

console.log('\n  27. `api.js` : la forme, la liste fermée, la file, la mémoire, le tri');
{
  /* `api.js` charge Supabase et React Native : `node` ne sait pas l'ouvrir.
     Ce qui s'y vérifie se LIT — sauf la traduction vers la base
     (`devisVersBase`, `ligneVersBase`), écrite pour ne dépendre que de ses
     arguments : on la FAIT TOURNER telle qu'elle est écrite. */
  const API = sansCommentairesJs(lire('src/lib/api.js'));
  const iNoop = API.search(/\bconst\s+noop\s*=/);
  /* Les fonctions du devis, et les choix « deux fonctions nommées ». Depuis
     le lot P, celles de la base de postes aussi (`/poste/i`) : une fonction
     `mesPostes` échapperait sinon à ces vérifications par son seul nom
     (cahier du lot P, §6.2). */
  const estDuDevis = (nom) => /devis|poste/i.test(nom) || /^(memoireDesLignes|monRegime|rowToLigne|ligneVersBase)/.test(nom);
  const decls = [...API.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g)]
    .map((m) => ({ nom: m[1], i: m.index })).filter((d) => estDuDevis(d.nom));
  const choix = [...API.matchAll(/(?:^|\n)\s*(?:export\s+)?const\s+(\w+)\s*=\s*(!?)\s*hasSupabase\s*\?([\s\S]*?);/g)]
    .map((m) => ({ nom: m[1], i: m.index, nie: m[2] === '!', reste: m[3] })).filter((d) => estDuDevis(d.nom));
  const avant = [...decls, ...choix].filter((d) => iNoop < 0 || d.i < iNoop).map((d) => d.nom);
  verifier('toute fonction du devis est déclarée APRÈS `const noop` (une `const` lue avant sa déclaration : un écran blanc)',
    iNoop > 0 && decls.length >= 20 && avant.length === 0, avant.join(', ') || `${decls.length} fonctions, ${choix.length} choix`);
  const nomsDecl = new Set([...API.matchAll(/(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g)].map((m) => m[1]));
  const malFaits = choix.filter((c) => {
    const m = /^\s*(\w+)\s*:\s*(\w+)\s*$/.exec(c.reste);
    return c.nie || !m || !nomsDecl.has(m[1]) || !nomsDecl.has(m[2]) || m[1] === 'noop' || m[2] === 'noop'
      || !/Supabase$/.test(m[1]) || !/Demo$/.test(m[2]);
  }).map((c) => c.nom);
  const exportes = ['mesDevis', 'unDevis', 'devisDuClient', 'devisDeLaDemande', 'memoireDesLignes', 'monRegime'];
  const manquants = exportes.filter((n) => !choix.some((c) => c.nom === n && /^\s*export/.test(API.slice(c.i, c.i + 40).replace(/^\n/, ''))));
  verifier('chaque choix du devis a ses DEUX fonctions nommées (`xSupabase`, `xDemo`) et le choix à la fin — aucune forme '
    + '`!hasSupabase ? …`, aucun `noop` (la démonstration doit VIVRE)', choix.length >= 9 && malFaits.length === 0 && manquants.length === 0,
  `mal faits : ${malFaits.join(', ') || '—'} ; exports manquants : ${manquants.join(', ') || '—'}`);

  const mesDevis = corpsDeFonction(API, 'mesDevisSupabase') || '';
  /* LA BORNE N'EST HONNÊTE QU'AVEC LE TRI, et le tri AVANT elle : sans
     `.order('modifie_le', …)`, la borne garde 200 devis au hasard de l'`id`
     et le pied « les plus anciens ne sont pas affichés » ment (relecture
     « conformité » des étapes 4 à 7, I3 : le sabotage passait). */
  const iTri = mesDevis.search(/\.order\(\s*'modifie_le'\s*,\s*\{\s*ascending:\s*false\s*\}\s*\)\s*\.order\(\s*'id'\s*\)/);
  const iBorne = mesDevis.search(/\.limit\(\s*(?:201|PLAFOND_LISTE\s*\+\s*1)\s*\)/);
  verifier('`mesDevis` demande 201 lignes TRIÉES — `.order(\'modifie_le\', { ascending: false })` PUIS `.order(\'id\')` AVANT '
    + '`limit(PLAFOND_LISTE + 1)` — et les découpe par `decouperListe()`, la démonstration aussi : pour SAVOIR s’il y en a plus '
    + 'de 200, et le dire', D.PLAFOND_LISTE === 200 && iTri >= 0 && iBorne > iTri
    && /decouperListe\(/.test(mesDevis) && /decouperListe\(/.test(corpsDeFonction(API, 'mesDevisDemo') || ''),
  `tri à ${iTri}, borne à ${iBorne}`);

  /* LA LISTE FERMÉE, FAITE TOURNER. */
  const fonctionComplete = (src, nom) => {
    const m = new RegExp(`function\\s+${nom}\\s*\\(`).exec(src);
    const corps = corpsDeFonction(src, nom);
    if (!m || !corps) return null;
    const fin = src.indexOf(corps, m.index) + corps.length;
    return src.slice(m.index, fin);
  };
  let versBaseD = null;
  let versBaseL = null;
  try {
    versBaseD = new Function(`${fonctionComplete(API, 'devisVersBase')}\nreturn devisVersBase;`)();
    versBaseL = new Function(`${fonctionComplete(API, 'ligneVersBase')}\nreturn ligneVersBase;`)();
  } catch (e) {
    versBaseD = null;
  }
  const snake = (k) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  const tout = {
    id: 'i', devisId: 'd', proId: 'p', statut: 'remis', generation: 99, createdAt: 'x', modifieLe: 'y',
    totalHtCentimes: 1, totalTvaCentimes: 1, totalTtcCentimes: 2, totalCentimes: 5, client: { nom: 'n' },
  };
  [...D.CHAMPS_DEVIS, ...D.CHAMPS_LIGNE].forEach((k) => { tout[k] = k === 'offert' ? true : `v-${k}`; });
  const interdits = /^(total_|created_at$|modifie_le$|statut$|generation$|client$)/;
  let det = '';
  let okListe = false;
  try {
    const dm = Object.keys(versBaseD(tout)).sort();
    const dc = Object.keys(versBaseD(tout, { creation: true, proId: 'p' })).sort();
    const lm = Object.keys(versBaseL(tout)).sort();
    const lc = Object.keys(versBaseL(tout, { creation: true })).sort();
    const attDm = D.CHAMPS_DEVIS.filter((k) => k !== 'source').map(snake).sort();
    const attDc = [...D.CHAMPS_DEVIS.map(snake), 'id', 'pro_id'].sort();
    const attLm = D.CHAMPS_LIGNE.map(snake).sort();
    const attLc = [...attLm, 'id', 'devis_id'].sort();
    const partiel = versBaseD({ objet: 'x', clientId: undefined });
    const entiere = versBaseL({ id: 'i', devisId: 'd', ordre: 1000 }, { creation: true });
    okListe = json(dm) === json(attDm) && json(dc) === json(attDc) && json(lm) === json(attLm) && json(lc) === json(attLc)
      && ![...dm, ...dc, ...lm, ...lc].some((k) => interdits.test(k))
      && json(Object.keys(partiel)) === json(['objet'])
      && versBaseD(tout, { creation: true, proId: 'p' }).pro_id === 'p'
      && Object.keys(entiere).length === attLc.length && entiere.type === 'poste' && entiere.offert === false
      && entiere.main_oeuvre === false && entiere.designation === null && entiere.ordre === 1000;
    det = `devis modifié ${json(dm)} ; créé ${json(dc)} ; ligne modifiée ${json(lm)} ; créée ${json(lc)}`;
  } catch (e) {
    det = `la traduction ne tourne pas seule : ${e && e.message}`;
  }
  verifier('`devisVersBase` et `ligneVersBase`, FAITES TOURNER : la liste fermée (`CHAMPS_DEVIS`, `CHAMPS_LIGNE`), l’id, l’entreprise, '
    + 'la source et le devis à la CRÉATION seulement, jamais un total, une date, le statut ni le numéro ; une clé absente n’est pas '
    + 'envoyée ; une ligne créée part ENTIÈRE', okListe, det);
  /* …ET CE QU'ELLES ENVOIENT EST EXACTEMENT CE QUE LA BASE LAISSE ÉCRIRE
     (lot 2a, 49.7). Une colonne envoyée sans son droit ferait refuser la
     requête ENTIÈRE (42501) ; un droit sans colonne envoyée est une porte
     que personne n'utilise. Le numéro d'écriture (`generation`) voyage à
     côté : `ecrireDevisSupabase` le pose sur chaque création et chaque
     modification. */
  let detDroits = '';
  let okDroits = false;
  try {
    const avecNumero = (o) => [...Object.keys(o), 'generation'].sort();
    const envoye = {
      'insert devis': avecNumero(versBaseD(tout, { creation: true, proId: 'p' })),
      'update devis': avecNumero(versBaseD(tout)),
      'insert devis_lignes': avecNumero(versBaseL(tout, { creation: true })),
      'update devis_lignes': avecNumero(versBaseL(tout)),
    };
    const ecarts = Object.keys(DROITS_DE_COLONNE).filter((k) => json(envoye[k]) !== json([...DROITS_DE_COLONNE[k]].sort()));
    okDroits = ecarts.length === 0
      && /insert\(\{\s*\.\.\.ligne,\s*id,\s*generation\s*\}\)/.test(API)
      && /update\(\{\s*\.\.\.changements,\s*generation\s*\}\)/.test(API);
    detDroits = ecarts.map((k) => `${k} : envoyé ${json(envoye[k])}, permis ${json([...DROITS_DE_COLONNE[k]].sort())}`).join(' | ');
  } catch (e) {
    detDroits = `la traduction ne tourne pas seule : ${e && e.message}`;
  }
  verifier('ce que l’application ENVOIE (création et modification, d’un devis et d’une ligne, numéro d’écriture compris) est '
    + 'EXACTEMENT ce que les droits de colonne de la section 49.7 laissent écrire', okDroits, detDroits);

  /* LE SEUL ÉCRIVAIN. Chaque appel d'écriture (`insert`, `update`,
     `delete`, `upsert`) précédé, dans la même instruction, d'un `from(…)` :
     sur une table du devis — nommée, ou par une variable dans une fonction
     qui nomme ces tables —, il doit vivre dans `ecrireDevisSupabase`. */
  const tables = /^['"`](devis|devis_lignes|devis_tva)['"`]$/;
  const fonctions = [...API.matchAll(/(?:^|\n)(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(|(?:^|\n)(?:export\s+)?const\s+(\w+)\s*=/g)]
    .map((m) => ({ nom: m[1] || m[2], i: m.index }));
  const fonctionA = (pos) => fonctions.filter((f) => f.i <= pos).pop() || { nom: '?', i: 0 };
  const finDe = (f) => { const k = fonctions.indexOf(f); return k >= 0 && k + 1 < fonctions.length ? fonctions[k + 1].i : API.length; };
  const ecrivain = fonctions.find((f) => f.nom === 'ecrireDevisSupabase');
  /* L'appel de `creerFileEcriture(…)`, parenthèses COMPTÉES : un motif
     paresseux s'arrêterait au premier « }) » de son contenu. */
  const appelFile = (() => {
    const i = API.indexOf('creerFileEcriture(');
    if (i < 0) return '';
    let p = 0;
    for (let k = i + 'creerFileEcriture'.length; k < API.length; k += 1) {
      if (API[k] === '(') p += 1;
      else if (API[k] === ')') { p -= 1; if (p === 0) return API.slice(i, k + 1); }
    }
    return '';
  })();
  const horsFile = [];
  const upserts = [];
  for (const m of API.matchAll(/\.(insert|update|delete|upsert)\s*\(/g)) {
    const debutInstr = Math.max(API.lastIndexOf(';', m.index), API.lastIndexOf('{\n', m.index));
    const instr = API.slice(debutInstr, m.index);
    const from = [...instr.matchAll(/\.from\(\s*([^)]*?)\s*\)/g)].pop();
    if (!from) continue;
    const f = fonctionA(m.index);
    const corps = API.slice(f.i, finDe(f));
    const visee = tables.test(from[1]) || (/^\w+$/.test(from[1]) && /['"`](devis|devis_lignes|devis_tva)['"`]/.test(corps));
    if (!visee) continue;
    if (m[1] === 'upsert') upserts.push(`${f.nom} : .upsert(`);
    if (f.nom !== 'ecrireDevisSupabase') horsFile.push(`${f.nom} : .${m[1]}( sur ${from[1]}`);
  }
  verifier('AUCUN `.upsert(` sur les trois tables du devis — un upsert partiel est jugé sur la ligne PROPOSÉE, et arrivé en retard '
    + 'il recréerait une ligne retirée', upserts.length === 0, upserts.join(' | '));
  verifier('aucune écriture sur `devis` ni `devis_lignes` hors de la file : `ecrireDevisSupabase` est le SEUL écrivain, et '
    + 'c’est lui que la file reçoit', horsFile.length === 0 && Boolean(ecrivain)
    && /\bconst\s+ecrireDevis\s*=\s*hasSupabase\s*\?\s*ecrireDevisSupabase\s*:\s*ecrireDevisDemo\s*;/.test(API)
    && /\becrire:\s*ecrireDevis\s*,/.test(appelFile), horsFile.join(' | '));
  const corpsEcrivain = corpsDeFonction(API, 'ecrireDevisSupabase') || '';
  verifier('la file reçoit `avecDelai` (celui d’`erreurs.js`), `relireUn` et `relireTotaux` — chaque écriture porte un délai',
    /\bavecDelai\b/.test(appelFile) && /\brelireUn:\s*relireUnDevis\b/.test(appelFile) && /\brelireTotaux:\s*relireTotauxDevis\b/.test(appelFile)
    && /import\s*\{[^}]*\bavecDelai\b[^}]*\}\s*from\s*['"]\.\/erreurs['"]/.test(API)
    && /\bdelai\(\s*Promise\.resolve\(\)\.then\(\(\)\s*=>\s*ecrire\(requete\)\)\)/.test(sansCommentairesJs(lire('src/lib/file-ecriture.js'))));
  verifier('l’écrivain tient le contrat de la file : le `signal` part avec la requête (`.abortSignal`), le numéro part AVEC '
    + 'l’insertion et la modification, une suppression porte sa CONDITION (`.lt(\'generation\'`), l’erreur remonte TELLE QUELLE',
  /requete\s*=\s*requete\.abortSignal\(\s*signal\s*\)/.test(corpsEcrivain)
    && /\.insert\(\{[^}]*\bgeneration\b[^}]*\}\)/.test(corpsEcrivain)
    && /\.update\(\{[^}]*\bgeneration\b[^}]*\}\)/.test(corpsEcrivain)
    && /\.delete\(\)[\s\S]{0,40}\.lt\(\s*'generation'\s*,\s*generationMax\s*\)/.test(corpsEcrivain)
    && /if\s*\(\s*error\s*\)\s*throw\s+error\s*;/.test(corpsEcrivain) && !/messageClair\(/.test(corpsEcrivain));
  verifier('…et une modification ou une suppression qui n’a touché AUCUNE ligne n’a pas l’air d’un travail fait (`.select(\'id\')`, '
    + 'puis « n’existe plus » ou, encore là, OP015)', /\.update\([\s\S]{0,80}\.select\(\s*'id'\s*\)/.test(corpsEcrivain)
    && /\.lt\([\s\S]{0,60}\.select\(\s*'id'\s*\)/.test(corpsEcrivain) && /ligneIntrouvable\(\)/.test(corpsEcrivain)
    && /SUPPRESSION_DEPASSEE/.test(corpsEcrivain));

  const memoire = corpsDeFonction(API, 'memoireDesLignesSupabase') || '';
  verifier('`memoireDesLignes` est filtrée par MES devis côté base : `!inner` et `.eq(\'devis.pro_id\'` (jamais la règle d’accès '
    + 'seule : 306 ms contre 2,9 ms sur 200 000 lignes, et la vraie base coupe à 8 s)',
  /devis:devis_id!inner\(/.test(memoire) && /\.eq\(\s*'devis\.pro_id'\s*,\s*currentUserId\s*\)/.test(memoire)
    && /\.in\(\s*'type'\s*,\s*\[\s*'poste'\s*,\s*'option'\s*\]\s*\)/.test(memoire) && /\.limit\(\s*MEMOIRE_MAX\s*\)/.test(memoire));

  /* LE TRI DES LIGNES : par `ordre`, PUIS par `id` (CR-B I7). Toute lecture
     de `devis_lignes` qui rend les lignes d'un devis le dit ; la mémoire,
     qui ne range pas un devis, trie par date puis `id` ; une relecture par
     l'identifiant ne rend qu'une ligne. */
  const lectures = [...API.matchAll(/\.from\(\s*'devis_lignes'\s*\)([\s\S]*?);/g)].map((m) => m[1])
    .filter((c) => !/\.(insert|update|delete|upsert)\s*\(/.test(c));
  /* Les lignes EMBARQUÉES dans la lecture d'un devis (`devis_lignes(*)`, un
     seul instantané) : triées par `ordre` PUIS `id` dans la table liée
     (`referencedTable`). */
  const unDevisLu = corpsDeFonction(API, 'unDevisSupabase') || '';
  const embarqueTriee = /devis_lignes\(\*\)/.test(unDevisLu)
    && /\.order\(\s*'ordre'\s*,\s*\{\s*referencedTable:\s*'devis_lignes'\s*\}\s*\)\s*\.order\(\s*'id'\s*,\s*\{\s*referencedTable:\s*'devis_lignes'\s*\}\s*\)/.test(unDevisLu)
    && !/\.from\(\s*'devis_(lignes|tva)'\s*\)/.test(unDevisLu);
  const malTriees = lectures.filter((c) => {
    if (/\.eq\(\s*'id'\s*,/.test(c) && /\.maybeSingle\(\)/.test(c)) return false;
    if (/!inner/.test(c)) return !/\.order\(\s*'modifie_le'\s*,\s*\{\s*ascending:\s*false\s*\}\s*\)\s*\.order\(\s*'id'\s*\)/.test(c);
    return !/\.order\(\s*'ordre'\s*\)\s*\.order\(\s*'id'\s*\)/.test(c);
  }).map((c) => c.replace(/\s+/g, ' ').slice(0, 90));
  const ordresSeuls = [...API.matchAll(/\.order\(\s*'ordre'[^)]*\)(?!\s*\.order\(\s*'id'\s*[,)])/g)].length;
  verifier('toute lecture de `devis_lignes` est triée par `ordre` PUIS `id` (la mémoire par date puis `id` ; une relecture par '
    + 'l’identifiant ne rend qu’une ligne) — et UN DEVIS SE LIT EN UNE REQUÊTE, ses lignes et sa ventilation embarquées (un seul '
    + 'instantané : trois lectures parallèles étaient trois transactions)',
  lectures.length >= 2 && malTriees.length === 0 && ordresSeuls === 0 && embarqueTriee,
  `${lectures.length} lecture(s) ; mal triées : ${malTriees.join(' | ') || '—'} ; « ordre » sans « id » : ${ordresSeuls} ; `
    + `embarquée et triée : ${embarqueTriee}`);

  verifier('une lecture du devis qui échoue LÈVE (jamais « Aucun devis ») — et une base sans la section 49 le dit (`baseEnRetard`)',
    ['mesDevisSupabase', 'unDevisSupabase', 'devisDuClientSupabase', 'devisDeLaDemandeSupabase', 'memoireDesLignesSupabase']
      .every((n) => /leverLecture\(/.test(corpsDeFonction(API, n) || '') && /lectureDevis\(/.test(corpsDeFonction(API, n) || ''))
    && /tableAbsente\(\s*error\s*\)\)\s*error\.baseEnRetard\s*=\s*true/.test(corpsDeFonction(API, 'leverLecture') || ''));

  /* UNE SEULE EXCEPTION, NOMMÉE (lot S-b, 26/10/2026) : `peut_faire_un_devis`,
     qui ne lit que la demande et les blocages (section 49.6 bis, donc dans
     `S49` : elle aussi ne doit nommer ni `emetteur` ni `tarifs_pro`). Toute
     AUTRE fonction appelée par `.rpc(` rougit encore. */
  const blocDevis = decls.map((d) => corpsDeFonction(API, d.nom) || '').join('\n')
    .replace(/supabase\.rpc\(\s*'peut_faire_un_devis'\s*,/g, '');
  verifier('aucune fonction SQL nouvelle ne lit l’émetteur ni les tarifs : pas de `.rpc(` dans les fonctions du devis (sauf '
    + '`peut_faire_un_devis`, qui ne lit que les blocages), le régime passe par `monEmetteur…`, et la section 49 ne nomme ni '
    + '`emetteur` ni `tarifs_pro`',
  !/\.rpc\(/.test(blocDevis) && /monEmetteurSupabase\(\)/.test(corpsDeFonction(API, 'monRegimeSupabase') || '')
    && /monEmetteurDemo\(\)/.test(corpsDeFonction(API, 'monRegimeDemo') || '')
    && !/\bpublic\.(emetteur|tarifs_pro)\b/.test(S49) && !/\b(from|join)\s+(public\.)?(emetteur|tarifs_pro)\b/.test(S49));

  verifier('la démonstration écrit dans la base de démonstration (`creerBaseDevisDemo`), par la MÊME file — et la déconnexion '
    + 'oublie les files du compte qui s’en va',
  /baseDevisDeDemo\(\)\.ecrire\(\s*moiEnDemo\(\)\s*,\s*op\s*\)/.test(corpsDeFonction(API, 'ecrireDevisDemo') || '')
    && /creerBaseDevisDemo\(/.test(corpsDeFonction(API, 'baseDevisDeDemo') || '')
    && /filesDevis\.clear\(\)/.test(corpsDeFonction(API, 'signOut') || '')
    && /filesDevis\.get\(\s*devisId\s*\)/.test(corpsDeFonction(API, 'fileDuDevis') || ''));
}

console.log('\n  27 bis. la base de démonstration refuse AVEC LES MOTS DE LA BASE — faite tourner, par la vraie file');
{
  const T0 = Date.now();
  const demandes = { 'devis:dr-devis-1': { id: 'dr-devis-1', genre: 'devis', budget: null }, 'sos:dr-sos-1': { id: 'dr-sos-1', genre: 'sos' } };
  const base = DEMO.creerBaseDevisDemo({ demandeDe: (g, id) => demandes[`${g}:${id}`] || null });
  const essayer = async (f) => { try { await f(); return null; } catch (e) { return e; } };
  const vaut = (e, code, texte) => Boolean(e && e.code === code && (texte === undefined || e.message === texte));
  const ecrire = (op, moi = '1') => base.ecrire(moi, op);
  const ID = (n) => `de0000ee-0000-4000-8000-${String(n).padStart(12, '0')}`;
  /* Les numéros d'écriture de l'essai : toujours au-dessus de l'horloge du
     devis — relue après ce que la file a écrit (`resynchroniser`). */
  let g = T0;
  const n = () => { g += 1; return g; };
  const resynchroniser = async () => {
    const d = await base.relireUn('1', { quoi: 'devis', id: ID(1) });
    if (d && d.generation > g) g = d.generation;
  };
  const poste = (plus) => ({ type: 'poste', designation: 'Poste', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 1000, tauxTvaCentiemes: 1000, ...plus });

  /* a. un brouillon neuf et deux lignes, PAR LA VRAIE FILE. */
  const file = F.creerFileEcriture({
    devisId: ID(1), devis: { objet: 'Essai', source: 'manuelle' }, devisEnBase: false,
    ecrire: (op) => base.ecrire('1', op), relireUn: (q) => base.relireUn('1', q),
    relireTotaux: (id) => base.relireTotaux('1', id), avecDelai: ERR.avecDelai, nouvelIdentifiant: I.nouvelIdentifiant,
  });
  const totaux = [];
  file.abonner((ev) => { if (ev.type === 'totaux') totaux.push(ev.totaux); });
  file.ligne({ id: ID(11), ordre: 1000, ...poste({ prixUnitaireCentimes: 3333 }) });
  file.ligne({ id: ID(12), ordre: 2000, ...poste({ prixUnitaireCentimes: 5000, tauxTvaCentiemes: 2000 }) });
  await file.attendre(5000);
  await resynchroniser();
  const lu = await base.un('1', ID(1));
  const dernier = totaux[totaux.length - 1];
  verifier('a. par la vraie file : le brouillon, puis ses deux lignes ; tout « enregistrée » ; les totaux relus sont ceux de la base',
    file.etatDe('devis') === 'enregistree' && file.etatDe(ID(11)) === 'enregistree' && file.etatDe(ID(12)) === 'enregistree'
    && file.enAttente() === 0 && lu && lu.lignes.length === 2 && dernier && dernier.ht === 8333 && dernier.tva === 1333
    && dernier.ttc === 9666 && dernier.ventilation.length === 2,
  dernier ? `${dernier.ht} | ${dernier.tva} | ${dernier.ttc}` : '(aucune relecture)');

  /* b. les refus : la contrainte, au mot de PostgreSQL ; et la phrase. */
  const e1 = await essayer(() => ecrire({ quoi: 'ligne', action: 'inserer', id: ID(13), valeurs: { devisId: ID(1), ordre: 3000, ...poste({ prixUnitaireCentimes: 0 }) }, generation: n() }));
  verifier('b. un prix de 0 sans « Offert » : 23514 `devis_ligne_offert_check`, au mot de PostgreSQL — et `messageClair` dit '
    + 'quoi faire', vaut(e1, '23514', 'new row for relation "devis_lignes" violates check constraint "devis_ligne_offert_check"')
    && ERR.messageClair(e1, 'Cette ligne') === `Cette ligne : ${ERR.MESSAGES_CONTRAINTE.devis_ligne_offert_check}`, e1 && e1.message);
  const e2 = await essayer(() => ecrire({ quoi: 'ligne', action: 'inserer', id: ID(14), valeurs: { devisId: ID(1), ordre: 3000, ...poste() }, generation: 0 }));
  const e3 = await essayer(() => ecrire({ quoi: 'ligne', action: 'modifier', id: ID(11), valeurs: { designation: 'Vieux' }, generation: T0 }));
  const e4 = await essayer(() => ecrire({ quoi: 'devis', action: 'modifier', id: ID(1), valeurs: { objet: 'Vieux' }, generation: T0 }));
  verifier('c. OP016 (numéro hors bornes) et OP015 (plus ancien que l’horloge), d’une ligne comme du devis — les phrases de '
    + '`REFUS_DEVIS`, et rien n’a bougé', vaut(e2, 'OP016', ERR.REFUS_DEVIS.OP016_ligne) && vaut(e3, 'OP015', ERR.REFUS_DEVIS.OP015_ligne)
    && vaut(e4, 'OP015', ERR.REFUS_DEVIS.OP015_devis) && lu.lignes[0].designation === 'Poste'
    && (await base.relireUn('1', { quoi: 'devis', id: ID(1) })).objet === 'Essai');
  const e5 = await essayer(() => ecrire({ quoi: 'devis', action: 'inserer', id: ID(2), valeurs: { clientId: 'cl-inconnue' }, generation: n() }));
  const e6 = await essayer(() => ecrire({ quoi: 'devis', action: 'inserer', id: ID(2), valeurs: { quoteRequestId: 'dr-autre' }, generation: n() }));
  const e7 = await essayer(() => ecrire({ quoi: 'devis', action: 'inserer', id: ID(2), valeurs: { sosRequestId: 'dr-autre' }, generation: n() }));
  verifier('d. OP013 : une fiche, une demande, une urgence qui ne sont pas à vous — les trois phrases de la base',
    vaut(e5, 'OP013', ERR.REFUS_DEVIS.OP013_client) && vaut(e6, 'OP013', ERR.REFUS_DEVIS.OP013_demande)
    && vaut(e7, 'OP013', ERR.REFUS_DEVIS.OP013_urgence) && (await base.relireUn('1', { quoi: 'devis', id: ID(2) })) === null);
  for (let k = 0; k < D.DEVIS_PAR_DEMANDE_MAX; k += 1) {
    await ecrire({ quoi: 'devis', action: 'inserer', id: ID(100 + k), valeurs: { source: 'demande', quoteRequestId: 'dr-devis-1' }, generation: n() });
  }
  const e8 = await essayer(() => ecrire({ quoi: 'devis', action: 'inserer', id: ID(200), valeurs: { source: 'demande', quoteRequestId: 'dr-devis-1' }, generation: n() }));
  verifier(`e. OP017 : le ${D.DEVIS_PAR_DEMANDE_MAX + 1}e devis pour une même demande est refusé, avec la phrase de la base`,
    vaut(e8, 'OP017', ERR.REFUS_DEVIS.OP017_demande) && (await base.deLaDemande('1', 'devis', 'dr-devis-1')).length === 5);
  /* e bis. UN NOUVEAU LIEN SOUS BLOCAGE (OP020, lot S-b) — la démonstration
     ne le refusait pas (relecture du 26/10). APRÈS « pas à vous » : une
     demande qui n'est pas adressée à l'artisan reste OP013, jamais OP020. */
  {
    const fermee = DEMO.creerBaseDevisDemo({
      demandeDe: (g, id) => demandes[`${g}:${id}`] || null,
      lienFerme: (g, id) => (g === 'devis' && id === 'dr-devis-1') || (g === 'sos' && id === 'dr-sos-1'),
    });
    const ecrireF = (op) => fermee.ecrire('1', op);
    const f1 = await essayer(() => ecrireF({ quoi: 'devis', action: 'inserer', id: ID(300), valeurs: { source: 'demande', quoteRequestId: 'dr-devis-1' }, generation: n() }));
    const f2 = await essayer(() => ecrireF({ quoi: 'devis', action: 'inserer', id: ID(301), valeurs: { source: 'urgence', sosRequestId: 'dr-sos-1' }, generation: n() }));
    const f3 = await essayer(() => ecrireF({ quoi: 'devis', action: 'inserer', id: ID(302), valeurs: { quoteRequestId: 'dr-autre' }, generation: n() }));
    verifier('e bis. sous blocage, un NOUVEAU lien vers la demande ou l’urgence est refusé (OP020, les phrases de la base) — '
      + 'et « pas à vous » reste OP013, décidé avant',
      vaut(f1, 'OP020', ERR.REFUS_DEMANDES.OP020_devis_demande) && vaut(f2, 'OP020', ERR.REFUS_DEMANDES.OP020_devis_urgence)
      && vaut(f3, 'OP013', ERR.REFUS_DEVIS.OP013_demande)
      && (await fermee.relireUn('1', { quoi: 'devis', id: ID(300) })) === null,
      [f1, f2, f3].map((e) => (e ? e.code : 'passé')).join(' | '));
    /* f4 (seconde relecture du 27/10) : une demande À LA FOIS fermée par le
       blocage ET inconnue de l'artisan. C'est le seul cas qui éprouve
       l'ORDRE : OP013 d'abord, sinon un tiers apprendrait le blocage. */
    const fermee4 = DEMO.creerBaseDevisDemo({
      demandeDe: (g, id) => demandes[`${g}:${id}`] || null,
      lienFerme: () => true,
    });
    const f4 = await essayer(() => fermee4.ecrire('1', { quoi: 'devis', action: 'inserer', id: ID(303), valeurs: { quoteRequestId: 'dr-ferme-inconnue' }, generation: n() }));
    verifier('e bis. une demande fermée par un blocage ET qui n’est pas à l’artisan : « pas à vous » (OP013), jamais OP020',
      vaut(f4, 'OP013', ERR.REFUS_DEVIS.OP013_demande), f4 ? f4.code : 'passé');
  }
  /* e ter. LA RÈGLE QUE LA DÉMONSTRATION BRANCHE VRAIMENT (seconde relecture
     du 27/10) : `creerLienFermeDemo`, sur les vraies demandes reçues de
     démonstration — u-julie bloquée, puis débloquée. Le GENRE compte : la
     même clé d'un autre genre n'est pas fermée. Et `api.js` la branche. */
  {
    const { creerLienFermeDemo } = DEMO;
    const { initialDemandesRecues } = await import('../src/data/demo.js');
    const blocs = new Set();
    const ferme = creerLienFermeDemo(initialDemandesRecues, blocs);
    const julie = initialDemandesRecues.filter((d) => String(d.clientId) === 'u-julie');
    const autres = initialDemandesRecues.filter((d) => String(d.clientId) !== 'u-julie');
    const avant = julie.every((d) => !ferme(d.genre, d.id));
    blocs.add('u-julie');
    const pendant = julie.every((d) => ferme(d.genre, d.id)) && autres.every((d) => !ferme(d.genre, d.id))
      && julie.every((d) => !ferme(d.genre === 'sos' ? 'devis' : 'sos', d.id));
    blocs.delete('u-julie');
    const apres = julie.every((d) => !ferme(d.genre, d.id));
    /* Commentaires retirés, formes ENTIÈRES (troisième relecture du 27/10) :
       `lienFerme: lienFermeDemo && (() => false)` et un `if (genre) return
       true;` glissé en tête passaient au vert. */
    const apiTexte = sansCommentairesJs(lire('src/lib/api.js'));
    verifier(`e ter. \`creerLienFermeDemo\` sur les demandes de démonstration : u-julie (${julie.length} demande(s)) ouverte, fermée sous blocage — les autres non, ni un autre genre —, rouverte au déblocage ; et \`api.js\` la branche`,
      julie.length >= 1 && autres.length >= 1 && avant && pendant && apres
        && /creerLienFermeDemo\(DEMANDES_RECUES_DEMO, demoBlocages\)\(genre, id\)/.test(apiTexte)
        && /demandeDe: demandeRecueDemo, lienFerme: lienFermeDemo, pauseMs: PAUSE_ECRITURE_DEMO,/.test(apiTexte)
        && /async function nouveauDevisPermisDemo\(genre, id\) \{\s*return !lienFermeDemo\(genre, id\);\s*\}/.test(apiTexte)
        && /function lienFermeDemo\(genre, id\) \{\s*return creerLienFermeDemo\(DEMANDES_RECUES_DEMO, demoBlocages\)\(genre, id\);\s*\}/.test(apiTexte));
  }
  const e9 = await essayer(() => ecrire({ quoi: 'ligne', action: 'inserer', id: ID(15), valeurs: { devisId: ID(1), ordre: 4000, ...poste({ quantiteMilliemes: 1000, prixUnitaireCentimes: 9999999999 }) }, generation: n() }));
  verifier('f. deux lignes recevables dont la SOMME dépasse le plafond : 23514 `devis_plafond_check` sur le DEVIS, comme la base',
    vaut(e9, '23514', 'new row for relation "devis" violates check constraint "devis_plafond_check"')
    && /99\u00a0999\u00a0999,99/.test(ERR.messageClair(e9)), e9 && e9.message);
  const e10 = await essayer(() => ecrire({ quoi: 'ligne', action: 'inserer', id: ID(11), valeurs: { devisId: ID(1), ordre: 1000, ...poste() }, generation: n() }));
  const e11 = await essayer(() => ecrire({ quoi: 'ligne', action: 'modifier', id: ID(99), valeurs: { designation: 'x' }, generation: n() }));
  verifier('g. une clé déjà prise : 23505 sur `devis_lignes_pkey` (la file la RELIT) ; une ligne qui n’existe plus : « n’existe '
    + 'plus… rechargez l’écran »', vaut(e10, '23505') && /devis_lignes_pkey/.test(e10.message) && vaut(e11, 'PGRST116')
    && /n’existe plus/.test(ERR.messageClair(e11)));
  const e12 = await essayer(() => ecrire({ quoi: 'ligne', action: 'supprimer', id: ID(11), generationMax: T0 }));
  const avantSuppr = (await base.un('1', ID(1))).lignes.length;
  await ecrire({ quoi: 'ligne', action: 'supprimer', id: ID(12), generationMax: n() });
  const apresSuppr = await base.un('1', ID(1));
  const e13 = await essayer(() => ecrire({ quoi: 'ligne', action: 'supprimer', id: ID(12), generationMax: n() }));
  verifier('h. une suppression partie TARD (sa condition dépassée) ne supprime rien, et le DIT (OP015) ; à jour, elle supprime et '
    + 'les totaux redescendent ; déjà faite, elle passe', vaut(e12, 'OP015', ERR.SUPPRESSION_DEPASSEE.ligne) && avantSuppr === 2
    && apresSuppr.lignes.length === 1 && e13 === null && (await base.relireTotaux('1', ID(1))).ht === 3333);
  const controle = new AbortController();
  controle.abort();
  const e14 = await essayer(() => ecrire({ quoi: 'ligne', action: 'inserer', id: ID(16), valeurs: { devisId: ID(1), ordre: 5000, ...poste() }, generation: n(), signal: controle.signal }));
  verifier('i. une requête ANNULÉE (le délai de la file) n’écrit rien', Boolean(e14 && e14.name === 'AbortError')
    && (await base.relireUn('1', { quoi: 'ligne', id: ID(16) })) === null);
  const e15 = await essayer(() => ecrire({ quoi: 'ligne', action: 'inserer', id: ID(17), valeurs: { devisId: ID(1), ordre: 6000, ...poste() }, generation: n() }, '2'));
  verifier('j. un AUTRE artisan ne lit rien et n’écrit rien dans ce devis : 42501 à l’insertion, rien à la lecture',
    vaut(e15, '42501') && (await base.un('2', ID(1))) === null && (await base.liste('2')).length === 0
    && (await base.memoire('2')).length === 0 && (await base.relireUn('2', { quoi: 'devis', id: ID(1) })) === null);
  await ecrire({ quoi: 'devis', action: 'modifier', id: ID(1), valeurs: { source: 'urgence', objet: 'Essai 2' }, generation: n() });
  const fige = await base.relireUn('1', { quoi: 'devis', id: ID(1) });
  verifier('k. la `source` ne se récrit pas (D3) ; l’en-tête change, l’horloge monte', fige.source === 'manuelle' && fige.objet === 'Essai 2'
    && fige.generation === g);
  /* l. le 501e : OP014. */
  const plein = ID(3);
  await ecrire({ quoi: 'devis', action: 'inserer', id: plein, valeurs: {}, generation: n() });
  for (let k = 1; k <= D.LIGNES_MAX; k += 1) {
    await ecrire({ quoi: 'ligne', action: 'inserer', id: `de0000ef-0000-4000-8000-${String(k).padStart(12, '0')}`, valeurs: { devisId: plein, ordre: k * 10, ...poste({ prixUnitaireCentimes: 1 }) }, generation: n() });
  }
  const e16 = await essayer(() => ecrire({ quoi: 'ligne', action: 'inserer', id: 'de0000ef-0000-4000-8000-999999999999', valeurs: { devisId: plein, ordre: 99999, ...poste() }, generation: n() }));
  verifier(`l. la ${D.LIGNES_MAX + 1}e ligne : OP014, la phrase de la base`, vaut(e16, 'OP014', ERR.REFUS_DEVIS.OP014)
    && (await base.un('1', plein)).lignes.length === D.LIGNES_MAX);
  /* m. le renvoi après un délai : la file ne crée JAMAIS de doublon. Une
     écriture qui PASSE puis dont la réponse se perd (issue inconnue). */
  let perdre = true;
  const file2 = F.creerFileEcriture({
    devisId: ID(1), devis: { objet: 'Essai 2', source: 'manuelle' }, devisEnBase: true, horloge: g,
    ecrire: async (op) => {
      await base.ecrire('1', op);
      if (perdre && op.quoi === 'ligne' && op.action === 'inserer') { perdre = false; throw Object.assign(new Error('Failed to fetch'), { name: 'TypeError' }); }
      return true;
    },
    relireUn: (q) => base.relireUn('1', q), relireTotaux: (id) => base.relireTotaux('1', id), avecDelai: ERR.avecDelai,
  });
  file2.ligne({ id: ID(18), ordre: 7000, ...poste({ prixUnitaireCentimes: 700 }) });
  await file2.attendre(5000);
  const etatPerdu = file2.etatDe(ID(18));
  file2.reessayer(ID(18));
  await file2.attendre(5000);
  const lignes18 = (await base.un('1', ID(1))).lignes.filter((l) => l.id === ID(18));
  verifier('m. une insertion PASSÉE dont la réponse se perd, puis « Réessayer » : la base de démonstration rend 23505, la file '
    + 'relit — une seule ligne, « enregistrée », aucun message', etatPerdu === 'echec' && file2.etatDe(ID(18)) === 'enregistree'
    && lignes18.length === 1 && file2.erreurDe(ID(18)) === null, `${etatPerdu} → ${file2.etatDe(ID(18))}, ${lignes18.length} ligne(s)`);
  await resynchroniser();
  const e17 = await essayer(() => ecrire({ quoi: 'devis', action: 'supprimer', id: ID(1), generationMax: T0 }));
  await ecrire({ quoi: 'devis', action: 'supprimer', id: ID(1), generationMax: n() });
  verifier('n. la suppression du brouillon : partie tard, elle ne supprime rien et le dit ; à jour, elle emporte ses lignes',
    vaut(e17, 'OP015', ERR.SUPPRESSION_DEPASSEE.devis) && (await base.un('1', ID(1))) === null
    && (await base.relireUn('1', { quoi: 'ligne', id: ID(11) })) === null && !(await base.liste('1')).some((d) => d.id === ID(1)));
  /* Les phrases de `REFUS_DEVIS` sont-elles CELLES de la base ? */
  const raises = [...sansCommentairesSql(SCHEMA.slice(iS49, iFinS49)).matchAll(/raise\s+exception\s+'((?:[^']|'')*)'(?:\s*,\s*v_plafond)?\s+using\s+errcode\s*=\s*'(OP01\d)'/gi)]
    .map((m) => ({ code: m[2], texte: m[1].replace(/''/g, '\'') }));
  const plafondSql = Number((/v_plafond\s+constant\s+integer\s*:=\s*(\d+)/i.exec(SCHEMA) || [])[1]);
  const textesBase = raises.map((r) => (r.code === 'OP017' ? r.texte.replace('%', String(plafondSql)) : r.texte));
  const copies = Object.values(ERR.REFUS_DEVIS);
  const sansCopie = textesBase.filter((t) => !copies.includes(t));
  const copieSansBase = copies.filter((t) => !textesBase.includes(t));
  verifier('les phrases de `REFUS_DEVIS` (erreurs.js) sont EXACTEMENT celles que la section 49 lève — octet pour octet, dans les '
    + 'deux sens — et le plafond par demande est le même des deux côtés',
  raises.length === 10 && sansCopie.length === 0 && copieSansBase.length === 0 && plafondSql === D.DEVIS_PAR_DEMANDE_MAX,
  `${raises.length} phrase(s) dans la section 49 ; sans copie : ${sansCopie.join(' | ') || '—'} ; copie sans base : ${copieSansBase.join(' | ') || '—'}`);

  /* o. LA TRONCATURE, FAITE TOURNER : une base de démonstration de 201 devis
     (des dates toutes différentes), lue comme « Mes devis » la lit. Le pied
     « Vos 200 devis les plus récents » n'était tenu par rien qui la fasse
     tourner — la démonstration n'a que deux devis (relecture « conformité »
     des étapes 4 à 7, I3). */
  {
    const T = Date.UTC(2026, 9, 1);
    const devis201 = Array.from({ length: 201 }, (_, i) => ({
      id: `de0000ee-0000-4000-8000-${String(900 + i).padStart(12, '0')}`, proId: '1', source: 'manuelle', statut: 'brouillon',
      objet: `Devis ${i}`, generation: 1, createdAt: new Date(T + i * 60000).toISOString(),
      modifieLe: new Date(T + i * 60000).toISOString(),
    }));
    const base201 = DEMO.creerBaseDevisDemo({ donnees: { devis: devis201, lignes: [] } });
    const lus = await base201.liste('1');
    const r = D.decouperListe(lus);
    const deux = D.decouperListe(await DEMO.creerBaseDevisDemo().liste('1'));
    verifier('o. 201 devis lus comme « Mes devis » : 200 gardés, `tronque` VRAI, et c’est le plus ANCIEN qui sort ; deux devis : '
      + '`tronque` faux', lus.length === 201 && r.devis.length === 200 && r.tronque === true
      && !r.devis.some((d) => d.objet === 'Devis 0') && r.devis[0].objet === 'Devis 200'
      && deux.tronque === false && deux.devis.length === 2,
    `${lus.length} lus, ${r.devis.length} gardés, tronque ${r.tronque} ; le premier : ${r.devis[0] && r.devis[0].objet}`);
  }

  /* p. ROUVRIR UN DEVIS DONT LA FILE ÉCRIT ENCORE — le scénario prouvé par la
     relecture « données » des étapes 4 à 7 (I2), avec la VRAIE file et la
     base de démonstration lente : un prix changé, une ligne ajoutée, l'écran
     quitté, puis rouvert aussitôt. L'écran se construit sur
     `fusionnerAvecLaFile` : pendant que la file écrit, il montre ce qu'elle
     VEUT ; une fois la file vide, ce que la base a — et les deux coïncident. */
  {
    const baseLente = DEMO.creerBaseDevisDemo({ pauseMs: 150 });
    const id = DEMO.DEVIS_DEMO_IDS.renovation;
    const r1 = await baseLente.un(DEMO.PRO_DEMO_DEVIS, id);
    let k = 0;
    const fileLente = F.creerFileEcriture({
      devisId: id, devis: r1.devis, devisEnBase: true, lignesEnBase: r1.lignes, horloge: r1.devis.generation,
      ecrire: (op) => baseLente.ecrire(DEMO.PRO_DEMO_DEVIS, op), relireUn: (q) => baseLente.relireUn(DEMO.PRO_DEMO_DEVIS, q),
      relireTotaux: (d) => baseLente.relireTotaux(DEMO.PRO_DEMO_DEVIS, d), avecDelai: ERR.avecDelai,
      nouvelIdentifiant: () => { k += 1; return `de0000ee-0000-4000-8000-${String(700 + k).padStart(12, '0')}`; },
    });
    const chape = r1.lignes.find((l) => /Chape/.test(l.designation || ''));
    fileLente.modifierLigne(chape.id, { prixUnitaireCentimes: 9900 });
    const neuve = { id: 'de0000ee-0000-4000-8000-0000000007aa', devisId: id, ordre: 99000, type: 'poste',
      designation: 'Plinthes carrelées', quantiteMilliemes: 12000, unite: 'm', prixUnitaireCentimes: 1500, tauxTvaCentiemes: 1000 };
    fileLente.ligne(neuve);
    const pendant = D.fusionnerAvecLaFile(await baseLente.un(DEMO.PRO_DEMO_DEVIS, id), fileLente.entreesVoulues());
    const vuePendant = { chape: (pendant.lignes.find((l) => l.id === chape.id) || {}).prixUnitaireCentimes, neuve: pendant.lignes.some((l) => l.id === neuve.id) };
    await fileLente.attendre(8000);
    const r2 = await baseLente.un(DEMO.PRO_DEMO_DEVIS, id);
    const apres = D.fusionnerAvecLaFile(r2, fileLente.entreesVoulues());
    const memes = json(D.trierLignes(apres.lignes).map((l) => [l.id, l.prixUnitaireCentimes]))
      === json(D.trierLignes(r2.lignes).map((l) => [l.id, l.prixUnitaireCentimes]));
    const ttcRangees = D.totauxDevis(apres.lignes).ttc;
    verifier('p. rouvrir un devis dont la file écrit encore : PENDANT, l’écran montre ce que la file veut (la chape à 99 €, la ligne '
      + 'ajoutée) ; APRÈS, ce que la base a — mêmes lignes, et le total des rangées = le total de la base',
    vuePendant.chape === 9900 && vuePendant.neuve && fileLente.vide() && memes && ttcRangees === r2.devis.totalTtcCentimes,
    `pendant : ${json(vuePendant)} ; après : mêmes lignes ${memes}, TTC rangées ${ttcRangees} / base ${r2.devis.totalTtcCentimes}`);
    /* …et une ligne RETIRÉE dont la suppression n'est pas faite disparaît de
       l'écran ; une ligne « enregistrée » prend la valeur de la BASE. */
    const fusion = D.fusionnerAvecLaFile({ devis: { id: 'd', objet: 'Base' }, lignes: [{ id: 'a', prixUnitaireCentimes: 1 }, { id: 'b', prixUnitaireCentimes: 2 }] }, [
      { cle: 'devis', voulu: { objet: 'Voulu' }, etat: 'echec' },
      { cle: 'a', voulu: { id: 'a', prixUnitaireCentimes: 9 }, etat: 'enregistree' },
      { cle: 'b', voulu: { id: 'b', prixUnitaireCentimes: 2 }, etat: 'echec', retire: true },
    ]);
    verifier('…`fusionnerAvecLaFile` : l’en-tête en échec reprend ce qui est voulu, une ligne enregistrée garde la base, une ligne '
      + 'retirée disparaît', fusion.devis.objet === 'Voulu' && fusion.lignes.length === 1 && fusion.lignes[0].prixUnitaireCentimes === 1,
    json(fusion));
  }
}

console.log('\nE. LES ÉCRANS — ce que la saisie promet, lu dans le code (sans ses commentaires)');
/* LES FICHIERS DU MODULE : les sept du cahier (§6.1-E). Ils chargent React
   Native : `node` ne les ouvre pas, ils se LISENT — ce qu'ils FONT au
   navigateur, c'est `npm run mesure-devis` (étape 7) qui le mesure. */
const ECRANS_DEVIS = {
  saisie: 'src/screens/SaisieDevisScreen.js',
  carte: 'src/components/CarteLigne.js',
  entete: 'src/components/EnteteDevis.js',
  designation: 'src/components/ChampDesignation.js',
  choix: 'src/components/ChoixClientDevis.js',
  liste: 'src/screens/DevisScreen.js',
  montant: 'src/components/ChampMontant.js',
};
const lireSiExiste = (f) => { try { return lire(f); } catch (e) { return null; } };
/* Les écrans de la base de postes (lot P) : ils ne sont pas dans la liste
   ci-dessus — chacun a ses propres règles, tenues par `verifier-postes` (E) —,
   mais les règles du MODULE (les échelles, jamais de moyenne ni d'arrondi
   flottant) les couvrent aussi. */
const ECRANS_POSTES = ['src/components/FeuilleAjoutPoste.js', 'src/components/FeuillePoste.js', 'src/screens/PostesScreen.js'];
const ECR = Object.fromEntries(Object.entries(ECRANS_DEVIS).map(([k, f]) => [k, sansCommentairesJs(lireSiExiste(f) || '')]));
const TOUS_ECRANS = Object.values(ECR);
/* La balise ouvrante d'un élément, de `<Nom` à son `>` — en sautant les `>`
   des flèches (`=>`) et ceux des accolades. */
function baliseOuvrante(src, i) {
  let prof = 0;
  for (let j = i + 1; j < src.length; j += 1) {
    const c = src[j];
    if (c === '{') prof += 1;
    else if (c === '}') prof -= 1;
    else if (c === '>' && prof === 0 && src[j - 1] !== '=') return src.slice(i, j + 1);
  }
  return src.slice(i);
}
const balises = (src, nom) => {
  const r = [];
  const re = new RegExp(`<${nom}\\b`, 'g');
  let m;
  while ((m = re.exec(src))) r.push(baliseOuvrante(src, m.index));
  return r;
};
/* Les appels d'une fonction, parenthèses comptées : `useEffect(…)` entier. */
function appels(src, nom) {
  const r = [];
  const re = new RegExp(`\\b${nom}\\s*\\(`, 'g');
  let m;
  while ((m = re.exec(src))) {
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
/* Le corps d'une fonction fléchée qui commence après `debut` : de son `=> {`
   à l'accolade qui le ferme. */
function corpsFleche(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) return '';
  const a = src.indexOf('=> {', i);
  if (a < 0) return '';
  let p = 0;
  for (let j = a + 3; j < src.length; j += 1) {
    if (src[j] === '{') p += 1;
    else if (src[j] === '}') { p -= 1; if (p === 0) return src.slice(a, j + 1); }
  }
  return '';
}

console.log('\n  28. la saisie : le bandeau, les claviers, le clavier qui monte, les montants, le régime, la garde');
{
  verifier('les sept fichiers du module existent', Object.values(ECRANS_DEVIS).every((f) => lireSiExiste(f) != null),
    Object.values(ECRANS_DEVIS).filter((f) => lireSiExiste(f) == null).join(', '));
  verifier('le bandeau « Chiffrage — ce brouillon ne part pas encore. » est écrit, et AFFICHÉ par l’en-tête',
    /'Chiffrage — ce brouillon ne part pas encore\.'/.test(ECR.entete) && /\{BANDEAU_CHIFFRAGE\}/.test(ECR.entete)
    && /ListHeaderComponent=\{entete\}/.test(ECR.saisie) && /<EnteteDevis\b/.test(ECR.saisie));
  /* LA DÉSIGNATION : corrigée et relue — c'est le texte que le client lira.
     UN NOMBRE : ni correction, ni orthographe. */
  const champDes = balises(ECR.designation, 'TextInput')[0] || '';
  verifier('`ChampDesignation` : `autoCorrect` et `spellCheck` VRAIS',
    /\bautoCorrect(?!\s*=\s*\{\s*false)/.test(champDes) && /\bspellCheck(?!\s*=\s*\{\s*false)/.test(champDes)
    && !/autoCorrect=\{false\}|spellCheck=\{false\}/.test(ECR.designation), champDes.slice(0, 200));
  verifier('`ChampMontant` : `autoCorrect={false}`, `spellCheck={false}`, le pavé DÉCIMAL, et AUCUN `returnKeyType` (le pavé '
    + 'décimal d’iOS n’a pas de touche retour)',
    /autoCorrect=\{false\}/.test(ECR.montant) && /spellCheck=\{false\}/.test(ECR.montant)
    && /keyboardType="decimal-pad"/.test(ECR.montant) && !/returnKeyType/.test(ECR.montant));
  /* CE QUE LE CLIENT A DEMANDÉ RESTE AU-DESSUS, ET HORS DU DEVIS (décision
     du propriétaire, 29/10/2026). Trois sabotages passaient tous les
     contrôles (relecture des contrôles, X03, F14, F15) : l'objet prérempli
     avec le texte de la demande, la note « Ce texte n'apparaît pas sur le
     devis. » retirée, et « 4 rue des Lilas » revenu dans le lieu. */
  {
    const objet = balises(ECR.entete, 'ChampLocal').filter((b) => /accessibilityLabel="Objet du devis"/.test(b));
    verifier('l’OBJET ne se remplit que de l’objet du devis — jamais du texte de la demande',
      objet.length === 1 && /\bdefaut=\{texte\(devis\.objet\)\}/.test(objet[0])
        && !/demande/i.test(objet[0]), objet.join(' | ').slice(0, 300));
    verifier('…le texte de la demande s’affiche au-dessus, avec « Ce texte n’apparaît pas sur le devis. »',
      /\{!!demandeDuClient && \(\s*<View style=\{s\.demande\}>\s*<Text style=\{s\.demandeTitre\}>Ce que le client a demandé<\/Text>\s*<Text style=\{s\.demandeTexte\}>\{demandeDuClient\}<\/Text>\s*<Text style=\{s\.demandeNote\}>Ce texte n’apparaît pas sur le devis\.<\/Text>\s*<\/View>\s*\)\}/.test(ECR.entete)
        && (ECR.entete.match(/\{demandeDuClient\}/g) || []).length === 1
        && /const demandeDuClient = texteDeLaDemande\(devis\);/.test(ECR.entete));
    const ATTENDU = { 'lieu.lieuAdresse': 'N° et rue', 'lieu.lieuCodePostal': 'Code postal', 'lieu.lieuVille': 'Commune' };
    const champsLieu = [...balises(ECR.entete, 'ChampLocal'), ...balises(ECR.entete, 'ChampVille')];
    const lus = Object.keys(ATTENDU).map((cle) => {
      const b = champsLieu.find((x) => new RegExp(`\\b(defaut|valeur)=\\{${cle.replace('.', '\\.')}\\}`).test(x));
      return { cle, p: b ? (b.match(/\bplaceholder="([^"]*)"/) || [])[1] : undefined };
    });
    verifier('…et le lieu des travaux dit ce qu’il attend : « N° et rue », « Code postal », « Commune » — aucun exemple d’adresse',
      lus.every((x) => x.p === ATTENDU[x.cle]), json(lus));
  }
  /* UNE SEULE EXCEPTION, NOMMÉE : le code postal du lieu des travaux, en
     pavé numérique comme celui du carnet (`FicheClient`) — cinq chiffres ne
     se tapent pas sur le clavier des lettres (relecture « écran » des étapes
     4 à 7, C1). Elle est cherchée sur SA balise : un `keyboardType` ailleurs
     dans l'en-tête rougit. */
  const balisesCp = balises(ECR.entete, 'ChampLocal').filter((b) => /ref=\{refCp\}/.test(b));
  const autresClaviers = Object.entries(ECRANS_DEVIS).filter(([k]) => k !== 'montant')
    .flatMap(([k, f]) => [...ECR[k].matchAll(/keyboardType\s*=\s*(\{[^}]*\}|"[^"]*"|'[^']*')/g)]
      .filter((m) => !(k === 'entete' && balisesCp.some((b) => b.includes(m[0])) && m[1] === '"number-pad"'))
      .map((m) => `${f} : ${m[0]}`));
  verifier('`keyboardType=` ne s’écrit QUE dans `ChampMontant` (un nombre a un champ, et un seul) — et sur le code postal du '
    + 'lieu, `number-pad`, comme le carnet', autresClaviers.length === 0 && balisesCp.length === 1
    && /keyboardType="number-pad"/.test(balisesCp[0] || ''), autresClaviers.join(', ') || `${balisesCp.length} balise(s) du code postal`);
  verifier('aucun défilement horizontal dans les écrans du devis (`horizontal`)', TOUS_ECRANS.every((t) => !/\bhorizontal\b/.test(t)));
  const liste = balises(ECR.saisie, 'FlatList')[0] || '';
  const defile = balises(ECR.carte, 'ScrollView')[0] || '';
  verifier('la liste des lignes ET la carte portent `{...CLAVIER}` et `keyboardDismissMode="on-drag"` (glisser referme le pavé '
    + 'décimal, qui n’a aucune touche pour le faire)',
    [liste, defile].every((b) => /\{\.\.\.CLAVIER\}/.test(b) && /keyboardDismissMode="on-drag"/.test(b)),
    `liste : ${liste.slice(0, 120)} | carte : ${defile.slice(0, 120)}`);
  verifier('aucun `KeyboardAvoidingView` dans les écrans du devis (avec `CLAVIER`, l’inset compterait DEUX FOIS)',
    TOUS_ECRANS.every((t) => !/KeyboardAvoidingView/.test(t)));
  /* JAMAIS `onChangeText` À `ChampLocal` : la propriété de l'appelant passe
     par `...reste` APRÈS la sienne, et l'écraserait — le champ ne se
     mettrait plus à jour. Dans TOUT `src/`. */
  {
    const tousSrc = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { cwd: RACINE, encoding: 'utf8' })
      .stdout.split('\n').filter((f) => f.endsWith('.js'));
    const fautifs = tousSrc.filter((f) => balises(sansCommentairesJs(lire(f)), 'ChampLocal').some((b) => /\bonChangeText\s*=/.test(b)));
    verifier('aucun `onChangeText` passé à `ChampLocal`, nulle part dans `src/`', tousSrc.length > 50 && fautifs.length === 0,
      fautifs.join(', '));
  }
  const effetsTotaux = TOUS_ECRANS.flatMap((t) => appels(t, 'useEffect')).filter((a) => /totauxDevis\s*\(/.test(a));
  verifier('aucun `useEffect` ne calcule les totaux : le calcul est pur, hors de React', effetsTotaux.length === 0,
    effetsTotaux.map((a) => a.slice(0, 80)).join(' | '));
  verifier('aucun `libellePrix(` dans les écrans du devis', TOUS_ECRANS.every((t) => !/\blibellePrix\s*\(/.test(t)));
  const zero = TOUS_ECRANS.flatMap((t) => [...t.matchAll(/(?<![\d,])0(?:\s|\\u00a0| )?%|TVA 0\b/g)].map((m) => m[0]));
  verifier('aucune chaîne « 0 % » ni « TVA 0 » : une ligne sans TVA ne dit pas « 0 % »', zero.length === 0, zero.join(' | '));
  verifier('la mention de franchise vient de `MENTION_FRANCHISE`, jamais écrite en dur',
    /\{MENTION_FRANCHISE\}/.test(ECR.saisie) && TOUS_ECRANS.every((t) => !/TVA non applicable|293\s?B/.test(t)));
  verifier('« Options, non comprises » est écrit', /Options, non comprises/.test(ECR.saisie));
  const sommes = TOUS_ECRANS.flatMap((t) => [...t.matchAll(/\b(?:[\w$]+\.)*(ht|tva|ttc|total\w*)\b\s*\+\s*(?:[\w$]+\.)*(ht|tva|ttc|total\w*)\b/gi)]
    .map((m) => m[0]));
  verifier('aucune somme de deux totaux dans les écrans (`ht + tva`…) : le TTC « option comprise » se calcule par `totauxDevis()` '
    + 'sur l’union des lignes', sommes.length === 0, sommes.join(' | '));
  /* UNE SEULE PORTE D'AFFICHAGE D'UN MONTANT. */
  const formateurs = TOUS_ECRANS.flatMap((t) => [...t.matchAll(/\b(montantDevis|centimesLisibles)\s*\(/g)].map((m) => m[1]));
  const UI = sansCommentairesJs(lire('src/components/ui.js'));
  const corpsMontant = corpsDeFonction(UI, 'Montant') || '';
  const horsMontant = (UI.match(/\b(montantDevis|centimesLisibles)\s*\(/g) || []).length
    - (corpsMontant.match(/\b(montantDevis|centimesLisibles)\s*\(/g) || []).length;
  verifier('`montantDevis(` et `centimesLisibles(` ne sont appelés QUE dans `Montant` (`ui.js`) — chiffres tabulaires, Inter, '
    + 'aligné à droite', formateurs.length === 0 && corpsMontant.length > 50 && /centimesLisibles\(/.test(corpsMontant)
    && horsMontant === 0 && /fontVariant: \['tabular-nums'\]/.test(UI), `${formateurs.join(', ')} ; hors Montant dans ui.js : ${horsMontant}`);
  const dixCar = TOUS_ECRANS.flatMap((t) => [...t.matchAll(/\.(slice|substring|substr)\(\s*0\s*,\s*10\s*\)/g)].map((m) => m[0]));
  verifier('aucune date lue par ses dix premiers caractères : `dateFrancaise()` ou `depuisLisible()`', dixCar.length === 0,
    dixCar.join(', '));
  verifier('les UNITÉS et les TAUX sont des `Pastille` (44 points par leur boîte)',
    /UNITES\.map\(\(u\) => \(\s*<Pastille\b/.test(ECR.carte) && /tauxProposes\.map\(\(t\) => \(\s*<Pastille\b/.test(ECR.carte));
  const ajouts = ['poste', 'piece', 'zone', 'reserve', 'option'].filter((k) => !balises(ECR.saisie, 'Pastille')
    .some((b) => new RegExp(`onAjouter\\('${k}'\\)`).test(b)));
  verifier('la barre « Ajouter » : cinq `Pastille` (Poste, Pièce, Zone, Réserve, Option)', ajouts.length === 0, ajouts.join(', '));
  /* LE RÉGIME : un échec n'est JAMAIS « non déclaré ». */
  const iEchec = ECR.entete.indexOf("avisRegime.type === 'echec' && (");
  const brancheEchec = iEchec >= 0 ? ECR.entete.slice(iEchec, ECR.entete.indexOf('</View>', iEchec)) : '';
  verifier('la branche d’ÉCHEC du régime ne dit ni « non déclaré » ni « pas déclaré », et propose « Réessayer »',
    brancheEchec.length > 80 && !/d[ée]clar/i.test(brancheEchec) && /Réessayer/.test(brancheEchec)
    && /if \(regimeEnEchec\) avisRegime = \{ type: 'echec' \};/.test(ECR.saisie), brancheEchec.slice(0, 200));
  /* LA GARDE DE SORTIE, aux CINQ portes d'`OpusApp`. */
  const APP = sansCommentairesJs(lire('src/OpusApp.js'));
  const iBack = APP.indexOf('title={backTitle}');
  const portes = {
    'le retour (`BackBar`)': iBack >= 0 ? corpsFleche(APP.slice(iBack), 'onBack={') : '',
    'la barre du bas (`onNavigate`)': corpsFleche(APP, 'onNavigate={'),
    'la cloche (`onBell`)': (APP.match(/onBell=\{[^\n]*\n?[^\n]*/) || [''])[0],
    'l’ouverture d’une notification': corpsFleche(APP, 'const ouvrirNotification = '),
    'la déconnexion': corpsFleche(APP, 'const deconnexion = '),
  };
  const premierEffet = (c) => {
    const i = c.search(/\bsetScreen\(|api\.signOut\(|readNotification\(|setActiveConvId\(/);
    return i < 0 ? Infinity : i;
  };
  const ratees = Object.entries(portes).filter(([, c]) => !c || !/quitterSaisieDevis\(/.test(c)
    || c.indexOf('quitterSaisieDevis(') > premierEffet(c)).map(([k]) => k);
  const garde = corpsFleche(APP, 'const quitterSaisieDevis = ');
  /* La garde ne laisse partir SANS la consulter que lorsqu'on n'est pas dans
     la saisie (ou qu'aucune saisie n'est inscrite) : sa première ligne,
     exactement. « … || screen) return true; » passait au vert, la garde
     neutralisée (relecture « conformité » des étapes 4 à 7, sabotage I3 —
     seul `mesure-devis` le voyait). */
  verifier('le retour, la barre du bas, la cloche, une notification et la déconnexion passent par `quitterSaisieDevis` AVANT de '
    + 'changer d’écran — et elle consulte la garde quand l’écran est la saisie',
    ratees.length === 0 && /^\{\s*if \(ecranRef\.current !== 'devisSaisie' \|\| !gardeSortie\.current\) return true;\s*return gardeSortie\.current\.sortir\(\{ parLeRetour \}\);\s*\}$/.test(garde.replace(/^=>\s*/, ''))
    /* L'écran est lu par une RÉFÉRENCE tenue à jour (29/10/2026) : un geste
       qui a attendu (« Faire un devis ») appelle la garde depuis un rendu
       ancien, où `screen` serait figé — elle croirait la saisie fermée. */
    && /const ecranRef = useRef\(screen\);\s*useEffect\(\(\) => \{ ecranRef\.current = screen; \}, \[screen\]\);/.test(APP)
    && /onGarde=\{inscrireGarde\}/.test(APP), `portes ratées : ${ratees.join(', ') || '—'}`);
  /* Depuis le lot 2a, la retenue — et la réduction, l'acompte, la validité
     — vivent dans la carte « Conditions » : fermer la carte ouverte, QUELLE
     QU'ELLE SOIT, l'enregistre. `enregistrerCarte` doit donc savoir lire les
     conditions (sinon une réduction tapée, carte ouverte, partirait avec
     l'écran), et `fermerCarte` passer par lui AVANT de la fermer. */
  const toutCorps = corpsFleche(ECR.saisie, 'const enregistrerTout = ');
  const carteCorps = corpsFleche(ECR.saisie, 'const enregistrerCarte = ');
  const fermerCorps = corpsFleche(ECR.saisie, 'const fermerCarte = ');
  const iFerme = toutCorps.indexOf('if (carteRef.current) fermerCarte();');
  const iEntete = toutCorps.indexOf('if (refEntete.current) refEntete.current.enregistrer();');
  const iAttend = toutCorps.indexOf('.attendre(DELAI_ECRITURE)');
  verifier('…et la saisie lit TOUT avant de partir : la carte ouverte — une ligne OU les conditions (lot 2a) —, l’en-tête, puis '
    + 'attend la file',
  iFerme > 0 && iEntete > iFerme && iAttend > iEntete
    && /^=> \{\s*enregistrerCarte\(\);\s*poserCarte\(null\);/.test(fermerCorps)
    && /^=> \{\s*const id = carteRef\.current;\s*if \(id === CARTE_CONDITIONS\) \{\s*if \(refConditions\.current\) refConditions\.current\.enregistrer\(\);\s*return;\s*\}/.test(carteCorps)
    && /useImperativeHandle\(ref, \(\) => \(\{ lire, enregistrer \}\)\)/.test(lire('src/components/ConditionsDevis.js'))
    /* La balise se lit par `balises` (accolades comptées) : depuis la relecture
       ÉCRAN-2 du lot 2a, elle porte des flèches, donc des « > ». */
    && /onEnregistrer=\{enregistrerConditions\}/.test(balises(ECR.saisie, 'ConditionsDevis')[0] || '')
    && /onFermer=\{fermerCarte\}/.test(balises(ECR.saisie, 'ConditionsDevis')[0] || ''),
  `${sansEspaces(toutCorps).slice(0, 200)} | ${sansEspaces(carteCorps).slice(0, 160)}`);
  /* LA SIXIÈME PORTE (relecture « écran » des étapes 4 à 7, bloquant A1) :
     la liste des cinq portes ne voyait pas « l'autre fiche → Faire un
     devis », qui changeait la clé de la saisie sans la garde. On tient
     désormais la PROPRIÉTÉ : toute fonction d'`OpusApp` qui change la clé de
     la saisie ou la pose attend `quitterSaisieDevis(` AVANT. */
  {
    const fonctions = [...APP.matchAll(/const (\w+) = (?:async )?\([^)]*\) => \{/g)]
      .map((m) => ({ nom: m[1], corps: corpsFleche(APP.slice(m.index), `const ${m[1]} = `) }))
      .filter((x) => /\bsetCleDevis\(|setScreen\(\s*'devisSaisie'\s*\)/.test(x.corps));
    const sansGarde = fonctions.filter((x) => {
      const iGarde = x.corps.indexOf('quitterSaisieDevis(');
      const iEffet = x.corps.search(/\bsetCleDevis\(|setScreen\(\s*'devisSaisie'\s*\)/);
      return iGarde < 0 || iGarde > iEffet || !/await quitterSaisieDevis\(/.test(x.corps);
    }).map((x) => x.nom);
    const pose = (APP.match(/setCleDevis\(/g) || []).length;
    verifier('toute fonction d’`OpusApp` qui change la clé de la saisie (`setCleDevis`) ou la pose (`setScreen(\'devisSaisie\')`) '
      + 'ATTEND `quitterSaisieDevis(` avant — la propriété, pas une liste de portes',
    fonctions.length >= 1 && pose >= 1 && sansGarde.length === 0
      && fonctions.some((x) => x.nom === 'ouvrirDevis'), `sans garde : ${sansGarde.join(', ') || '—'} (${fonctions.length} fonction(s))`);
    const autre = (APP.match(/const ouvrirAutreFiche = [^\n]*/) || [''])[0];
    verifier('…et l’autre fiche ouverte depuis la saisie (l’avertissement de doublon) HÉRITE de la saisie (`apresFicheClient`) : '
      + 'ni « Ses devis » ni « Faire un devis », mais « Choisir ce client pour ce devis »',
    /ouvrirFicheClient\(\s*autre\s*,\s*null\s*,\s*apresFicheClient\.current\s*\)/.test(autre)
      && /onOuvrirAutre=\{ouvrirAutreFiche\}/.test(APP)
      && /onChoisirPourLeDevis=\{ficheClient\.depuisLaSaisie/.test(APP)
      && /onChoisirPourLeDevis\(fiche\)/.test(sansCommentairesJs(lire('src/components/FicheClient.js'))),
    autre.slice(0, 120));
  }
  /* LOT P — CE QU'UN APPUI RECOPIE (T10) : une proposition sans prix ne vide
     jamais un prix déjà tapé. `prixAEcrire` rend `null`, et `null` veut dire
     « ne touchez pas au champ ». */
  {
    const choisir = (/onChoisir=\{\(sug\) => \{[\s\S]*?\n {10}\}\}/.exec(ECR.carte) || [''])[0];
    verifier('lot P : un appui sur une proposition passe par `valeursDeLaProposition` PUIS `prixAEcrire` (T10) — le champ prix '
      + 'n’est écrit que si `prixAEcrire` rend un prix',
    choisir.indexOf('valeursDeLaProposition(sug)') > 0 && choisir.indexOf('prixAEcrire(') > choisir.indexOf('valeursDeLaProposition(sug)')
      && /if \(prix !== null && refPrix\.current\) refPrix\.current\.ecrire\(prix\);/.test(choisir)
      && !/centimesEnSaisie\(v\.prixUnitaireCentimes\)/.test(ECR.carte), choisir.slice(0, 200));
  }
  /* LOT P — LA GARDE, CÔTÉ SORTIE : toute fonction qu'`OpusApp` PASSE à la
     saisie et qui change d'écran attend `quitterSaisieDevis(` d'abord ; et
     aucune fonction passée à la saisie n'ouvre « Ma base de postes » (on y
     change sa référence par une feuille posée PAR-DESSUS, sans la quitter).
     Une porte écrite en paramètre (`onX('postes')`) ou par une variable
     échappait à une liste de noms : on lit chaque rappel de la balise. */
  {
    const balise = balises(APP, 'SaisieDevisScreen')[0] || '';
    const rappels = [...balise.matchAll(/\b(on\w+)=\{([\s\S]*?)\}(?=\s+\w+=|\s*\/?>)/g)].map((m) => ({ prop: m[1], valeur: m[2] }));
    /* Le rappel lui-même, PLUS le corps de chaque fonction d'`OpusApp` qu'il
       appelle (un niveau) : `(section) => ouvrirMonEntreprise(section)` est
       jugé sur `ouvrirMonEntreprise`, pas sur sa flèche. */
    const corpsDe = (v) => {
      const nom = (/^\s*(\w+)\s*$/.exec(v) || [])[1];
      const appeles = nom ? [nom] : [...v.matchAll(/\b([a-z]\w*)\(/g)].map((m) => m[1]);
      return [v, ...appeles.map((n) => corpsFleche(APP, `const ${n} = `))].join('\n');
    };
    const fautes = rappels.filter(({ valeur }) => {
      const c = corpsDe(valeur);
      const iEcran = c.search(/\bsetScreen\(/);
      return /\bouvrirMaBase\b|'postes'/.test(c) || (iEcran >= 0 && (c.indexOf('quitterSaisieDevis(') < 0 || c.indexOf('quitterSaisieDevis(') > iEcran));
    }).map(({ prop }) => prop);
    verifier('lot P : la garde tient AUSSI côté sortie — tout rappel passé à la saisie qui change d’écran attend `quitterSaisieDevis(` '
      + 'avant, et aucun n’ouvre « Ma base de postes » (ni `ouvrirMaBase`, ni l’écran `\'postes\'`)',
    rappels.length >= 10 && rappels.some((r) => r.prop === 'onChargerPostes') && fautes.length === 0,
    `${rappels.length} rappel(s) ; fautifs : ${fautes.join(', ') || '—'}`);
  }
  /* L'APPUI SE VOIT (B4) : la bande « Enregistrement avant de partir… »
     paraît AVANT l'attente de la file, avec « Rester ». */
  verifier('la garde se VOIT au moment de l’appui : `enregistrerTout` appelle `pendantLAttente` AVANT d’attendre la file, et la '
    + 'bande « Enregistrement avant de partir… » propose « Rester »',
  /if \(f && !f\.vide\(\) && pendantLAttente\) pendantLAttente\(\);\s*if \(f\) await f\.attendre\(DELAI_ECRITURE\)/.test(ECR.saisie)
    && /enregistrerTout\(\{ pendantLAttente: enAttente \}\)/.test(ECR.saisie)
    && /garde\.phase === 'attente'[\s\S]{0,600}Enregistrement avant de partir[\s\S]{0,300}label="Rester"/.test(ECR.saisie));
  /* L'EN-TÊTE REFUSÉ (I1) : la garde le compte, l'écran le dit, et ce qui
     est recevable part quand même. */
  const bilanCorps = corpsFleche(ECR.saisie, 'const bilan = ');
  const entCorps = corpsFleche(ECR.saisie, 'const enregistrerEntete = ');
  verifier('un champ de l’en-tête REFUSÉ par l’écran retient la garde : `bilan()` compte `enteteRefuse`, la bande le nomme '
    + '(« Corriger » / « Quitter sans l’enregistrer »), et les autres champs partent quand même',
  /enteteRefuse = Object\.keys\(refusEntete\.current\)/.test(bilanCorps)
    /* CHAQUE `ok:` du bilan — avec la file et sans elle — le compte : il y en
       a deux, et n'en tenir qu'un laissait la garde partir quand la file
       existe (sabotage S09 des corrections des étapes 4 à 7). */
    && (bilanCorps.match(/\bok: /g) || []).length >= 2
    && (bilanCorps.match(/\bok: /g) || []).length === (bilanCorps.match(/\bok: [^\n]*!enteteRefuse\.length/g) || []).length
    && /delete recevables\[v\.champ\]/.test(entCorps) && /return \{ ok, refus \}/.test(entCorps)
    && /garde\.enteteRefuse\.length > 0/.test(ECR.saisie) && /label="Corriger"/.test(ECR.saisie)
    && /label="Quitter sans l’enregistrer"/.test(ECR.saisie)
    /* Lot 2a : un champ refusé de la carte « Conditions » (une retenue de
       7 %, un pourcentage de 150) est COMPTÉ par la garde, PENDANT que les
       champs recevables de la même carte partent ; « Corriger » rouvre la
       carte, et son texte tapé y revient (`textesConditions`). */
    /* Relecture du lot 2a : la carte RELUE ENTIÈRE efface d'abord tous ses
       refus — les deux clés de chaque paire (ÉCRAN-6) —, puis pose ceux
       d'`enregistrerEntete` et ses fautes de saisie ; ses textes et ses choix
       restent gardés pour un refus de l'écran OU d'`enregistrerEntete`
       (ÉCRAN-5) ; et elle ne vibre que pour le geste qu'on vient de faire
       (ÉCRAN-13). La bande nomme chaque champ UNE fois. */
    /* Contre-vérification : les fautes DÉJÀ dites sont relevées AVANT
       l'effacement, et passées à `vibrerPourLaCarte` — une faute née à la
       fermeture (le champ jamais quitté) vibre une fois. */
    && /^=> \{\s*const fautes = Object\.keys\(erreursSaisie \|\| \{\}\);\s*const deja = CHAMPS_CONDITIONS\.filter\(\(k\) => refusEntete\.current\[k\]\);\s*poserRefusEntete\(CHAMPS_CONDITIONS\);\s*const r = enregistrerEntete\(changements, \{ vibrer: false \}\);\s*if \(fautes\.length\) \{\s*poserRefusEntete\(\[\], /.test(sansCommentairesJs(corpsFleche(ECR.saisie, 'const enregistrerConditions = ')))
    && /const refusees = \[\.\.\.fautes, \.\.\.Object\.keys\(r\.refus \|\| \{\}\)\];\s*setTextesConditions\(refusees\.length \? textes : null\);\s*if \(vibrerPourLaCarte\(geste, refusees, deja\)\) retour\.echec\(\);/.test(corpsFleche(ECR.saisie, 'const enregistrerConditions = '))
    && (corpsFleche(ECR.saisie, 'const enregistrerConditions = ').match(/retour\.echec\(\)/g) || []).length === 1
    && /if \(!ok && vibrer\) retour\.echec\(\);/.test(corpsFleche(ECR.saisie, 'const enregistrerEntete = '))
    && ['remiseCentiemes', 'remiseCentimes', 'acompteCentiemes', 'acompteCentimes', 'acompteNature', 'validiteJours',
      'retenueGarantieCentiemes'].every((c) => (/const CHAMPS_CONDITIONS = Object\.freeze\(\[([^\]]*)\]/.exec(ECR.saisie) || ['', ''])[1]
      .includes(`'${c}'`))
    /* La bande nomme chaque champ UNE fois, et l'acompte sous le nom de sa
       NATURE (contre-vérification d'ÉCRAN-8) : `nomsDesRefus` le fait. */
    && /nomsDesRefus\(garde\.enteteRefuse, \{\s*noms: NOMS_ENTETE,\s*nature: textesConditions && textesConditions\.choix \? textesConditions\.choix\.nature : devis\.acompteNature,\s*\}\)/.test(ECR.saisie)
    && !/acompteCentiemes: 'Acompte'|acompteCentimes: 'Acompte'/.test(sansCommentairesJs(ECR.saisie))
    && json(D.nomsDesRefus(['remiseCentimes', 'remiseCentiemes'], { noms: { remiseCentimes: 'Réduction', remiseCentiemes: 'Réduction' } }))
      === json(['Réduction'])
    && json(D.nomsDesRefus(['acompteCentiemes', 'acompteNature'], { noms: { acompteNature: 'Acompte ou arrhes' } })) === json(['Acompte ou arrhes'])
    && json(D.nomsDesRefus(['acompteCentimes'], { noms: {}, nature: 'arrhes' })) === json(['Arrhes'])
    && json(D.nomsDesRefus(['acompteCentimes'], { noms: {}, nature: 'acompte' })) === json(['Acompte'])
    && /if \(CHAMPS_CONDITIONS\.includes\(champ\)\) \{ ouvrirConditions\(\); return; \}/.test(corpsFleche(ECR.saisie, 'const corrigerEntete = '))
    && !/changerRetenue|refBas/.test(sansCommentairesJs(ECR.saisie)));
  /* ROUVRIR UN DEVIS DONT LA FILE ÉCRIT ENCORE (I2) ; « RELIRE » PAR LA FILE (I3). */
  const ouverture = ECR.saisie.slice(ECR.saisie.indexOf('if (ouverture.devisId) {'), ECR.saisie.indexOf('fileRef.current = f;'));
  verifier('rouvrir un devis dont la file écrit encore : on ATTEND la file (`fileExistante`, `attendre`) AVANT `unDevis`, et '
    + 'l’écran se construit sur `fusionnerAvecLaFile` — jamais sur la seule photo de la base',
  ouverture.indexOf('api.fileExistante(') >= 0 && ouverture.indexOf('.attendre(DELAI_ECRITURE)') > ouverture.indexOf('api.fileExistante(')
    && ouverture.indexOf('api.unDevis(') > ouverture.indexOf('.attendre(DELAI_ECRITURE)')
    && /fusionnerAvecLaFile\(\{ devis: r\.devis, lignes: r\.lignes \}, f\.entreesVoulues\(\)\)/.test(ouverture)
    && /lignesRef\.current = vue\.lignes/.test(ouverture));
  verifier('« Relire » passe par la FILE (`relireLesTotaux`) — jamais `api.unDevis` à côté d’elle',
    /f\.relireLesTotaux\(\)/.test(corpsFleche(ECR.saisie, 'const relireTotaux = '))
    && !/api\.unDevis\(/.test(corpsFleche(ECR.saisie, 'const relireTotaux = ')));
  /* LES PETITS ÉCRANS ET LES DÉFAUTS DU TOUCHER (B1, B5, B7, C2, C3, C4, C8, C9, C10). */
  verifier('une ligne EXISTANTE s’ouvre sans suggestion : `ChampDesignation` part de `useState(defaut || null)` (la mémoire '
    + 'répond à une frappe, jamais à l’ouverture)', /const \[choisi, setChoisi\] = useState\(defaut \|\| null\)/.test(ECR.designation));
  verifier('un devis VIDE porte « + Poste » dans le pied fixe — le premier poste sans glisser',
    /lignes\.length === 0 && chiffrerPossible && \(\s*<Pastille label="\+ Poste"[^>]*onPress=\{\(\) => ajouter\('poste'\)\}/.test(ECR.saisie));
  verifier('un poste reprend le taux du dernier POSTE, une option celui de la dernière OPTION (`tauxPour(ordre, type)`)',
    /const tauxPour = \(avantOrdre, type = 'poste'\)/.test(ECR.saisie) && /\.filter\(\(l\) => l\.type === type &&/.test(ECR.saisie)
    && /tauxPour\(ordre, type\)/.test(ECR.saisie));
  /* Depuis le lot 2a, les libellés vivent dans UNE fonction pure
     (`libellesDesTotaux`) : on la FAIT TOURNER sur les cinq états du
     régime, et l'écran doit l'appeler — pour le pied comme pour le bas. */
  const libelles = ['reel', 'franchise', null, 'lecture', 'echec'].map((e) => D.libellesDesTotaux(e));
  verifier('« Total TTC » au régime RÉEL seulement — `libellesDesTotaux` dit « Total » en franchise, non déclaré, en lecture et en '
    + 'échec (aucune taxe nommée hors du réel, règle C2), et le pied l’affiche',
  libelles[0].total === 'Total TTC' && libelles[0].taxe === true && libelles[0].tva === 'TVA'
    && libelles.slice(1).every((l) => l.total === 'Total' && l.taxe === false && l.tva === null && l.unite === null
      && !/HT|TTC|TVA/.test(Object.values(l).filter((v) => typeof v === 'string').join(' ')))
    && /\{libellesDesTotaux\(regime\)\.total\}/.test(ECR.saisie)
    && !/'Total TTC'/.test(sansCommentairesJs(ECR.saisie)),
  json(libelles.map((l) => l.total)));
  /* Et sa phrase ne dit pas « aucune suggestion » : les lignes du devis
     ouvert restent proposées (`memoireComplete`), et une phrase qui annonce
     zéro au-dessus de deux suggestions dément l'écran — mesuré sur une copie
     en panne pendant les corrections des étapes 4 à 7. */
  /* Depuis le lot P, la base de postes est une SECONDE source : un seul
     « Réessayer », sous le champ, qui relit ce qui a échoué — et la mémoire
     d'abord (`relire`). */
  verifier('une mémoire illisible se DIT et se REDEMANDE (`setMemoire(\'echec\')`, `memoireEchec`, « Réessayer »), sans annoncer « aucune suggestion »',
    /\.catch\(\(\) => setMemoire\('echec'\)\)/.test(ECR.saisie) && /memoireEchec=\{memoire === 'echec'\}/.test(ECR.saisie)
    && /\(memoireEchec \|\| baseEchec\) && \(/.test(ECR.designation)
    && /if \(memoireEchec && onRelireMemoire\) onRelireMemoire\(\);/.test(ECR.designation) && /onPress=\{relire\}/.test(ECR.designation)
    && !/aucune suggestion/i.test(ECR.designation));
  verifier('la carte est MODALE pour VoiceOver, et le bas de la saisie (pied, bandes) caché quand elle est ouverte',
    /<View style=\{s\.ecran\} accessibilityViewIsModal>/.test(ECR.carte)
    && (ECR.saisie.match(/importantForAccessibility=\{carte \? 'no-hide-descendants' : 'auto'\}/g) || []).length >= 2);
  verifier('sur une OPTION, le bouton dit « Option suivante » ; un régime en lecture ou en échec dit pourquoi « Poste » et « Option » '
    + 'sont grisés ; « Lecture impossible » ne promet pas « ce qui est affiché reste lisible »',
    /ligne\.type === 'option' \? 'Option suivante' : 'Poste suivant'/.test(ECR.carte)
    && /propositions === null && \(/.test(ECR.saisie) && /messageClair\(e, 'Ce devis', \{ rienAffiche: true \}\)/.test(ECR.saisie));
  verifier('l’aide de « Main-d’œuvre » dit qu’un prix au m² ou au mètre est un prix FORFAITAIRE (CR-D B1 — tenu jusqu’ici par '
    + '`mesure-devis` seul)', /Un prix au m² ou au mètre est un prix forfaitaire/.test(ECR.carte));
  /* « MON ENTREPRISE » REMONTE LE RÉGIME, sans recharger. */
  const ME = sansCommentairesJs(lire('src/components/MonEntreprise.js'));
  verifier('`MonEntreprise` reçoit `surEmetteur`, l’appelle après la LECTURE et après l’ENREGISTREMENT, et `OpusApp` le lui donne',
    /surEmetteur = null/.test(ME) && /if \(surEmetteur\) surEmetteur\(d\.emetteur/.test(ME)
    && /if \(surEmetteur\) surEmetteur\(r\.emetteur/.test(ME) && /surEmetteur=\{recevoirEmetteur\}/.test(APP));
}

console.log('\n  29. « Mes devis » : la pastille, la troncature, l’échec');
{
  const APP29 = sansCommentairesJs(lire('src/OpusApp.js'));
  verifier('la pastille « Brouillon » prend son encre par `surFond(` — et aucun blanc écrit à la main',
    /color: surFond\(FOND_BROUILLON\)/.test(ECR.liste) && !/'#fff'|'#FFFFFF'|'#ffffff'/i.test(ECR.liste));
  /* LA TRONCATURE SE DIT DE CE QUE LA LECTURE A RENDU (`tronque`), jamais
     d'un compte de cartes — et le sabotage « `const pied = false && …` »
     passait (relecture « conformité » des étapes 4 à 7, I3). */
  verifier('le pied de troncature dépend de `tronque` (ce que la lecture a rendu), et le DIT avec `PLAFOND_LISTE`',
    /const pied = tronque\s*\?/.test(ECR.liste) && /PLAFOND_LISTE/.test(ECR.liste)
    && /Les plus anciens ne sont pas affichés/.test(ECR.liste) && /ListFooterComponent=\{pied\}/.test(ECR.liste));
  const iVide = ECR.liste.indexOf("const vide = etat === 'echec'");
  const iSecond = iVide >= 0 ? ECR.liste.indexOf('<EmptyState', ECR.liste.indexOf('<EmptyState', iVide) + 5) : -1;
  const branche = iVide >= 0 && iSecond > iVide ? ECR.liste.slice(iVide, iSecond) : '';
  verifier('« Lecture impossible » est un état À PART, avec un vrai bouton — et JAMAIS « Aucun devis » dans la branche d’échec',
    branche.length > 50 && /titre="Lecture impossible"/.test(branche) && /action=\{onRecharger/.test(branche)
    && !/Aucun devis/i.test(branche), branche.slice(0, 160));
  /* « 0 BROUILLON » AU-DESSUS DE « LECTURE IMPOSSIBLE » disait « Aucun
     devis » par un autre chemin (relecture « écran » des étapes 4 à 7, B2) ;
     et une relecture ratée VIDAIT la liste déjà lue (B3). */
  verifier('le compte de brouillons ne se dit QUE d’une lecture réussie (`etat === \'ok\'`) ; une relecture ratée GARDE la liste '
    + 'déjà lue, sous « Liste non actualisée » et un vrai « Réessayer » ; et `OpusApp` dit si une liste a déjà été lue — '
    + 'au bandeau aussi (`rienAffiche: !devisLus` : sans liste à l’écran, il ne promet pas « ce qui est affiché reste lisible »)',
  /\{etat === 'ok' \? `\$\{devis\.length\}/.test(ECR.liste) && /const garderLaListe = echec && lus;/.test(ECR.liste)
    && /data=\{echec && !garderLaListe \? \[\] : devis\}/.test(ECR.liste) && /Liste non actualisée/.test(ECR.liste)
    && /garderLaListe && \([\s\S]{0,700}label="Réessayer"/.test(ECR.liste) && /lus=\{devisLus\}/.test(APP29)
    && /setDevisLus\(true\)/.test(APP29)
    && /messageClair\(e, "Vos devis n'ont pas pu être lus", \{ rienAffiche: !devisLus \}\)/.test(APP29));
}

console.log('\n  30. la fiche d’un client, « Pour moi », « Pour qui ? »');
{
  const FC = sansCommentairesJs(lire('src/components/FicheClient.js'));
  /* LES DEUX BRANCHES qui suivent `confirmeSuppression` — ses devis LUS, et
     ses devis ILLISIBLES : l'une et l'autre disent que l'adresse des
     travaux reste. La seconde n'était tenue par rien (relecture
     « conformité » des étapes 4 à 7, I4 : le sabotage passait). */
  const branchesSupp = [...FC.matchAll(/\{confirmeSuppression && !!sesDevis && sesDevis\.etat (===|!==) 'ok'[\s\S]*?\n {14}\)\}/g)]
    .map((m) => ({ op: m[1], texte: m[0] }));
  const lue = branchesSupp.find((b) => b.op === '===');
  const illisible = branchesSupp.find((b) => b.op === '!==');
  verifier('la fiche d’un client montre « Ses devis », et sa suppression dit « l’adresse des travaux » DANS LES DEUX BRANCHES (devis '
    + 'lus, et devis illisibles) — jamais « sans nom de client »',
  /Ses devis/.test(FC) && branchesSupp.length === 2 && !!lue && !!illisible
    && /adresse des travaux/.test(lue.texte) && /adresse des\s+travaux/.test(illisible.texte) && /pas pu être lus/.test(illisible.texte)
    && !/sans nom de client/i.test(FC), `${branchesSupp.length} branche(s)`);
  const DR = sansCommentairesJs(lire('src/screens/DemandesRecuesScreen.js'));
  const boutons = balises(DR, 'BtnMini').filter((b) => /Faire un devis/.test(b));
  const gardes = boutons.every((b) => /\{peutFaireUnDevis\(d\) && !!onFaireDevis && \(\s*$/.test(DR.slice(Math.max(0, DR.indexOf(b) - 120), DR.indexOf(b))));
  verifier('« Faire un devis » n’apparaît que par `peutFaireUnDevis(` (jamais sur un rappel)', boutons.length === 1 && gardes);
  const faire = corpsFleche(DR, 'const faireUnDevis = ');
  const nouveau = corpsFleche(DR, 'const nouveauDevis = ');
  verifier('…et l’appui lit `devisDeLaDemande(` AVANT d’ouvrir la saisie ; « Reprendre » existe',
    faire.length > 50 && faire.indexOf('devisDeLaDemande(') > 0 && faire.indexOf('devisDeLaDemande(') < faire.indexOf('nouveauDevis(')
    && /await onFaireDevis\(d\)/.test(nouveau)
    && /label="Reprendre"/.test(DR));
  verifier('`ChoixClientDevis` est une `<FeuilleBas` — et ne porte PAS `{...CLAVIER}`',
    /<FeuilleBas\b/.test(ECR.choix) && !/\{\.\.\.CLAVIER\}/.test(ECR.choix) && /keyboardShouldPersistTaps="handled"/.test(ECR.choix));
  /* Sa liste porte les trois réglages du projet (cahier §4.4) — ils
     n'étaient tenus par rien (relecture « conformité », mineur 4). */
  const listeChoix = balises(ECR.choix, 'FlatList')[0] || '';
  verifier('…et sa liste porte `initialNumToRender`, `maxToRenderPerBatch` et `windowSize`',
    /initialNumToRender=\{\d+\}/.test(listeChoix) && /maxToRenderPerBatch=\{\d+\}/.test(listeChoix) && /windowSize=\{\d+\}/.test(listeChoix),
    listeChoix.slice(0, 160));
  verifier('depuis la saisie, la fiche d’un client EXISTANT propose « Choisir ce client pour ce devis » (jamais un autre devis)',
    /!!fiche && !!onChoisirPourLeDevis && \(/.test(FC) && /label="Choisir ce client pour ce devis"/.test(FC));
}

console.log('\n  31. les jetons de thème existent, et aucune arithmétique sur une taille');
{
  const THEME = await import('../src/theme.js');
  /* Les écrans de la base de postes (lot P) aussi : leurs échelles sont
     celles du devis. */
  const fichiersJetons = [...Object.values(ECRANS_DEVIS), 'src/components/FicheClient.js', ...ECRANS_POSTES];
  const inconnus = [];
  const calculs = [];
  for (const f of fichiersJetons) {
    const t = sansCommentairesJs(lireSiExiste(f) || '');
    for (const m of t.matchAll(/\b([TSR])\.(\w+)/g)) {
      if (!Object.prototype.hasOwnProperty.call(THEME[m[1]], m[2])) inconnus.push(`${f} : ${m[0]}`);
    }
    for (const m of t.matchAll(/\bT\.\w+\s*[-+*/]\s*[\w.]+|\b[SR]\.\w+\s*[-+]\s*\d/g)) calculs.push(`${f} : ${m[0]}`);
  }
  verifier('tout `T.x`, `S.x`, `R.x` des écrans du devis et de `FicheClient` existe dans `theme.js`', inconnus.length === 0,
    inconnus.join(' | '));
  /* …ET LE BON CRAN : `T.micro` (10, « étiquettes posées sur une image »)
     avait rapetissé TOUTES les aides et TOUTES les erreurs de la fiche, dont
     l'avertissement de suppression que le droit a fait ajouter (relecture
     « écran » des étapes 4 à 7, B6). */
  {
    const FCs = sansCommentairesJs(lire('src/components/FicheClient.js'));
    const styleDe = (nom) => (FCs.match(new RegExp(`\\n  ${nom}: \\{([^}]*)\\}`)) || [])[1] || '';
    verifier('la fiche d’un client écrit ses aides en `T.petit` et ses erreurs (l’avertissement de suppression compris) en '
      + '`T.corps` — jamais en `T.micro`', /fontSize: T\.petit\b/.test(styleDe('aide')) && /fontSize: T\.corps\b/.test(styleDe('erreur')),
    `aide : ${styleDe('aide').replace(/\s+/g, ' ')} | erreur : ${styleDe('erreur').replace(/\s+/g, ' ')}`);
  }
  verifier('…et aucune arithmétique sur un jeton (`T.sousTitre + 1`, `S.sm - 2`) : une taille hors de l’échelle', calculs.length === 0,
    calculs.join(' | '));
}

console.log('\n  32. dans les fichiers du calcul : une seule orthographe, jamais une moyenne, jamais un arrondi flottant');
{
  /* TOUT LE MODULE, et pas `devis.js` seul (le cahier, §6.1-32 ; relecture
     des étapes 0-2, M2) : les fichiers que `node` fait tourner — et, depuis
     le lot P, la clé de rapprochement et le calcul de la base de postes
     (cahier du lot P, §6.2 : une fonction `mesPostes` échapperait sinon à la
     règle par son seul nom). Les écrans et la section 49 s'y ajoutent avec
     leurs étapes. */
  const MODULE = ['src/lib/devis.js', 'src/lib/centimes.js', 'src/lib/file-ecriture.js', 'src/lib/identifiant.js',
    'src/lib/rapprochement.js', 'src/lib/postes.js', 'src/data/devis-demo.js', ...Object.values(ECRANS_DEVIS), ...ECRANS_POSTES];
  const textes = MODULE.map((f) => [f, sansCommentairesJs(lire(f))]);
  verifier('…ni dans la section 49 (le schéma du devis ne lit aucun statut de `sos_requests`)', S49.length > 5000
    && !/\b(acceptee|refusee)\b/.test(S49));
  const accordees = textes.flatMap(([f, t]) => t.split('\n')
    .filter((l) => /\b(acceptee|refusee)\b/.test(l) && !(f === 'src/lib/devis.js' && /^\s*sos:\s*Object\.freeze\(\[/.test(l)))
    .map((l) => `${f} : ${l.trim()}`));
  verifier('`acceptee` / `refusee` n’apparaissent dans le module (devis, centimes, file, identifiant, clé, postes, démonstration) que pour LIRE '
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
  /* LOT P : « jamais de moyenne » vaut aussi pour les écrans de la base et
     pour ce que la carte et les propositions affichent — un prix montré a
     été écrit par l'artisan, une fois. */
  const moyennes = textes.filter(([f]) => /postes\.js$|PostesScreen|FeuilleAjoutPoste|FeuillePoste|CarteLigne|ChampDesignation/.test(f))
    .filter(([, x]) => /moyenne|m[ée]diane|\bavg\(|Math\.(min|max)\(|\.reduce\(/i.test(x)).map(([f]) => f);
  verifier('lot P : ni `postes.js`, ni la carte, ni les propositions, ni les écrans de la base ne calculent une moyenne, une médiane, un '
    + 'minimum, un maximum, ni ne réduisent une liste de prix', moyennes.length === 0, moyennes.join(', '));
  const src = textes[0][1];
  const memoire = corpsDeFonction(src, 'memoireDesLignes') || '';
  verifier('`memoireDesLignes` ne calcule ni moyenne, ni médiane, ni minimum, ni maximum',
    memoire.length > 200 && !/moyenne|m[ée]diane|\bavg\(|Math\.(min|max)\(|\/\s*prix\.length|\.reduce\(/i.test(memoire));
}


console.log('\nF. QUI LIT, QUI ÉCRIT — dans les deux sens (le défaut du 01/10 et celui du 04/10)');

console.log('\n  33. chaque colonne a un ÉCRIVAIN et un LECTEUR');
{
  /* LES COLONNES SONT CELLES DU SCHÉMA (`colonnesDe`), pas une liste écrite
     ici : une colonne ajoutée à la table ET à la liste fermée de B-12 doit
     encore trouver son écrivain et son lecteur, sinon elle rougit ici. */
  const API = sansCommentairesJs(lire('src/lib/api.js'));
  const fonctionComplete = (src, nom) => {
    const m = new RegExp(`function\\s+${nom}\\s*\\(`).exec(src);
    const corps = corpsDeFonction(src, nom);
    if (!m || !corps) return null;
    return src.slice(m.index, src.indexOf(corps, m.index) + corps.length);
  };
  /* L'ÉCRIVAIN « application » : la traduction FAITE TOURNER, à la création. */
  let ecritesParLApp = { devis: [], devis_lignes: [] };
  try {
    const vd = new Function(`${fonctionComplete(API, 'devisVersBase')}\nreturn devisVersBase;`)();
    const vl = new Function(`${fonctionComplete(API, 'ligneVersBase')}\nreturn ligneVersBase;`)();
    const tout = { id: 'i', devisId: 'd' };
    [...D.CHAMPS_DEVIS, ...D.CHAMPS_LIGNE].forEach((k) => { tout[k] = `v-${k}`; });
    ecritesParLApp = {
      devis: Object.keys(vd(tout, { creation: true, proId: 'p' })),
      devis_lignes: Object.keys(vl(tout, { creation: true })),
    };
  } catch (e) { /* le contrôle le dira : aucune colonne écrite */ }
  /* Le numéro d'écriture part À CÔTÉ des valeurs, posé par `ecrireDevisSupabase`. */
  const ecrit = corpsDeFonction(API, 'ecrireDevisSupabase') || '';
  if (/insert\(\{\s*\.\.\.ligne,\s*id,\s*generation\s*\}\)/.test(ecrit)) {
    ['devis', 'devis_lignes'].forEach((t) => ecritesParLApp[t].push('generation'));
  }
  /* L'ÉCRIVAIN « base » : un déclencheur ou une fonction de la section 49 qui
     pose `new.colonne :=`, un `default` de la table, ou la liste d'un
     `insert into … (…)` / d'un `update … set` de la section. */
  const ecritParLaBase = (table, col) => {
    const def = (colonnesDe(table) || []).find((c) => c.nom === col);
    if (def && /\bdefault\b/i.test(def.texte)) return true;
    if (new RegExp(`\\bnew\\.${col}\\s*:=`).test(S49)) return true;
    const inserts = [...S49.matchAll(new RegExp(`insert\\s+into\\s+public\\.${table}(?:\\s+as\\s+\\w+)?\\s*\\(([^)]*)\\)`, 'gi'))]
      .map((m) => m[1]);
    if (inserts.some((l) => new RegExp(`\\b${col}\\b`).test(l))) return true;
    const updates = [...S49.matchAll(new RegExp(`update\\s+public\\.${table}\\b[\\s\\S]*?\\bset\\b([\\s\\S]*?)\\bwhere\\b`, 'gi'))]
      .map((m) => m[1]);
    return updates.some((l) => new RegExp(`\\b${col}\\s*=`).test(l));
  };
  /* LE LECTEUR : son nom en camelCase dans `devis.js`, la file, ou un écran
     du devis — jamais le simple passage d'`api.js`. La ventilation lit les
     colonnes de `devis_tva` sous des noms courts (`v.base`, `v.tva`,
     `nbLignes`), et trois colonnes ne sont lues que par la BASE (les
     politiques) : c'est la table « qui lit » du cahier, §2.2-2.4. */
  const LECTEURS = ['src/lib/devis.js', 'src/lib/file-ecriture.js', ...Object.values(ECRANS_DEVIS),
    'src/components/FicheClient.js', 'src/screens/DemandesRecuesScreen.js']
    .map((f) => sansCommentairesJs(lireSiExiste(f) || '')).join('\n');
  const camel = (c) => c.replace(/_([a-z])/g, (x, l) => l.toUpperCase());
  const ALIAS = { 'devis_tva.base_centimes': /\.base\b/, 'devis_tva.tva_centimes': /\.tva\b/, 'devis_tva.taux_tva_centiemes': /\.taux\b/ };
  const POLITIQUES = [...S49.matchAll(/create\s+policy[\s\S]*?;/gi)].map((m) => m[0]).join('\n');
  const LUES_PAR_LA_BASE = ['devis.pro_id', 'devis_lignes.devis_id', 'devis_tva.devis_id'];
  const sansEcrivain = [];
  const sansLecteur = [];
  for (const t of TABLES49) {
    for (const c of colonnesDe(t) || []) {
      const nom = `${t}.${c.nom}`;
      const parLApp = (ecritesParLApp[t] || []).includes(c.nom);
      if (!parLApp && !ecritParLaBase(t, c.nom)) sansEcrivain.push(nom);
      const lu = ALIAS[nom] ? ALIAS[nom].test(LECTEURS) : new RegExp(`\\b${camel(c.nom)}\\b`).test(LECTEURS);
      const luParLaBase = LUES_PAR_LA_BASE.includes(nom) && new RegExp(`\\b${c.nom}\\b`).test(POLITIQUES);
      if (!lu && !luParLaBase) sansLecteur.push(nom);
    }
  }
  const nbColonnes = TABLES49.reduce((n, t) => n + (colonnesDe(t) || []).length, 0);
  verifier(`chacune des ${nbColonnes} colonnes a un ÉCRIVAIN (la traduction d’\`api.js\`, ou la base : un déclencheur, un défaut)`,
    nbColonnes >= 41 && ecritesParLApp.devis.length >= 12 && sansEcrivain.length === 0,
    `sans écrivain : ${sansEcrivain.join(', ') || '—'} — une colonne lue que personne n’écrit (le défaut des photos d’annonce du 04/10)`);
  verifier('…et un LECTEUR (son nom dans `devis.js`, la file ou un écran du devis — ou, pour trois clés, les politiques)',
    nbColonnes >= 41 && sansLecteur.length === 0,
    `sans lecteur : ${sansLecteur.join(', ') || '—'} — une colonne écrite que personne ne lit est une panne silencieuse (01/10) : `
    + 'une colonne naît avec son lecteur');
}

console.log('\n  34. chaque table écrite est RELUE — et quelqu’un appelle la lecture');
{
  const API = sansCommentairesJs(lire('src/lib/api.js'));
  const lit = (fonction, table) => {
    const c = corpsDeFonction(API, fonction) || '';
    return new RegExp(`from\\('${table}'\\)[\\s\\S]{0,200}?\\.select\\(`).test(c);
  };
  const APP = sansCommentairesJs(lire('src/OpusApp.js'));
  const ECRAN = ECR.saisie;
  const DR = sansCommentairesJs(lire('src/screens/DemandesRecuesScreen.js'));
  const relues = {
    '`devis` — « Mes devis » (`mesDevis`)': lit('mesDevisSupabase', 'devis') && /api\.mesDevis\(\)/.test(APP),
    '`devis` — un devis (`unDevis`)': lit('unDevisSupabase', 'devis') && /api\.unDevis\(/.test(ECRAN),
    '`devis` — « Ses devis » (`devisDuClient`)': lit('devisDuClientSupabase', 'devis') && /api\.devisDuClient\b/.test(APP),
    '`devis` — « Reprendre » (`devisDeLaDemande`)': lit('devisDeLaDemandeSupabase', 'devis') && /api\.devisDeLaDemande\(/.test(DR),
    /* EMBARQUÉES dans la lecture du devis (un seul instantané, relecture
       « données » des étapes 4 à 7, I3) : `devis_lignes(*)` et `devis_tva(…)`
       dans le `select` de `devis`. */
    '`devis_lignes` — les lignes d’un devis': /\bdevis_lignes\(\*\)/.test(corpsDeFonction(API, 'unDevisSupabase') || ''),
    '`devis_lignes` — la mémoire': lit('memoireDesLignesSupabase', 'devis_lignes') && /api\.memoireDesLignes\(\)/.test(ECRAN),
    '`devis_tva` — la ventilation': /\bdevis_tva\(taux_tva_centiemes/.test(corpsDeFonction(API, 'unDevisSupabase') || ''),
  };
  const manquent = Object.entries(relues).filter(([, ok]) => !ok).map(([k]) => k);
  verifier('`devis`, `devis_lignes` et `devis_tva` sont RELUES par `api.js`, et chaque lecture a son appelant à l’écran',
    manquent.length === 0, `manquent : ${manquent.join(' ; ')} — une table qu’on écrit sans jamais la lire est une panne silencieuse`);
}

console.log('\n  35. le lot 2a — les conditions, FAITES TOURNER');
{
  /* Ce que l'écran montre et ce que l'artisan tape, joué par les fonctions
     elles-mêmes : la lecture des champs, les rangées des totaux, le résumé,
     le suffixe du pied, les phrases d'effet et d'échec, la répartition, et
     un aller-retour par la base de démonstration. */
  const ok = (r, v, cle) => r && r.ok === true && r[cle] === v;
  const ko = (r, re) => r && r.ok === false && re.test(r.message || '');
  verifier('`versCentiemes` : « 5 » → 500, « 2,5 » → 250, « ,5 » → 50, « 0,01 » → 1, « 5 % » → 500, vide → rien ; une virgule seule, '
    + 'un négatif, trois décimales, mille refusés',
  ok(D.versCentiemes('5'), 500, 'centiemes') && ok(D.versCentiemes('2,5'), 250, 'centiemes') && ok(D.versCentiemes(',5'), 50, 'centiemes')
    && ok(D.versCentiemes('0,01'), 1, 'centiemes') && ok(D.versCentiemes('5 %'), 500, 'centiemes') && ok(D.versCentiemes(''), null, 'centiemes')
    && ko(D.versCentiemes(','), /virgule/) && ko(D.versCentiemes('-1'), /négatif/) && ko(D.versCentiemes('1,234'), /deux chiffres/)
    && ko(D.versCentiemes('1000'), /trop grand/));
  verifier('`versPourcentDeDevis` : 100 % passe, « 0 » refusé (« laissez le champ vide »), au-delà de 100 % refusé — sous la MÊME '
    + 'phrase, que le nombre ait trois chiffres ou quatre',
  ok(D.versPourcentDeDevis('100'), D.POURCENT_MAX, 'centiemes') && ok(D.versPourcentDeDevis(''), null, 'centiemes')
    && ko(D.versPourcentDeDevis('0'), /laissez le champ vide/) && ko(D.versPourcentDeDevis('100,01'), /100/)
    && ko(D.versPourcentDeDevis('150'), /100/) && ko(D.versPourcentDeDevis('1000'), /100/));
  verifier('`versJours` : « 30 », « 30 jours », 365 passent ; 0, 366, « 30,5 » refusés ; vide → rien',
    ok(D.versJours('30'), 30, 'jours') && ok(D.versJours('30 jours'), 30, 'jours') && ok(D.versJours('365'), 365, 'jours')
    && ok(D.versJours(''), null, 'jours') && ko(D.versJours('0'), /1 à 365/) && ko(D.versJours('366'), /1 à 365/)
    && ko(D.versJours('30,5'), /entier/));
  verifier('`versMontantDeDevis` : « 50 » → 5 000 centimes ; 0 refusé ; au-delà du plafond refusé, le plafond écrit par '
    + '`centimesLisibles`',
  ok(D.versMontantDeDevis('50'), 5000, 'centimes') && ok(D.versMontantDeDevis(''), null, 'centimes')
    && ko(D.versMontantDeDevis('0'), /laissez le champ vide/)
    && ko(D.versMontantDeDevis('100000000'), new RegExp(D.montantDevis(D.PLAFOND).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));

  const r1 = D.remiseEffective(10000, { remiseCentiemes: 1000 });
  const r2 = D.remiseEffective(10000, { remiseCentimes: 20000 });
  const a1 = D.acompteEffectif(10000, { acompteCentiemes: 3000 });
  const a2 = D.acompteEffectif(10000, { acompteCentimes: 20000 });
  verifier('réduction et acompte EFFECTIFS : en pourcentage au centime ; en montant RAMENÉS au total (`borne`), jamais refusés ; '
    + 'rien demandé → 0',
  r1.effectif === 1000 && r1.forme === 'pourcent' && !r1.borne && r2.effectif === 10000 && r2.borne === true
    && a1.effectif === 3000 && a2.effectif === 10000 && a2.borne === true
    && D.remiseEffective(10000, {}).effectif === 0 && D.acompteEffectif(10000, null).effectif === 0
    && D.remiseEffective(1, { remiseCentiemes: 5000 }).effectif === 1, json([r1, r2, a1, a2]));
  const rep = [D.repartirAuPlusFortReste(100, [100, 100, 100]), D.repartirAuPlusFortReste(2, [1, 1, 1]),
    D.repartirAuPlusFortReste(0, []), D.repartirAuPlusFortReste(5, [0, 0]), D.repartirAuPlusFortReste(-1, [1]),
    D.repartirAuPlusFortReste(0, [0, 0])];
  const gros = D.repartirAuPlusFortReste(10 ** 15, [10 ** 15, 10 ** 15, 3]);
  verifier('`repartirAuPlusFortReste` : 100 sur trois parts égales → 34, 33, 33 (à reste égal, la PREMIÈRE) ; 2 → 1, 1, 0 ; un '
    + 'total plus grand que les poids, ou négatif → rien ; 10^15 réparti EXACTEMENT, la somme juste',
  json(rep) === json([[34, 33, 33], [1, 1, 0], [], null, null, [0, 0]])
    && Array.isArray(gros) && gros.reduce((x, y) => x + y, 0) === 10 ** 15 && gros[2] <= 3, json([rep, gros]));

  /* LES RANGÉES : une réduction de 10 % et des arrhes de 30 %, une option,
     une retenue — au réel, en franchise, régime non déclaré, en lecture. */
  const Lg = (id, o, type, p, taux) => ({ id, ordre: o, type, designation: `X ${id}`, quantiteMilliemes: 1000, unite: 'u',
    prixUnitaireCentimes: p, tauxTvaCentiemes: taux, offert: false });
  const tc = D.totauxDevis([Lg('a', 1, 'poste', 10000, 2000), Lg('b', 2, 'poste', 5000, 1000), Lg('c', 3, 'option', 2000, 2000)],
    { remiseCentiemes: 1000, acompteCentiemes: 3000 });
  /* La forme que l'écran reçoit (la base, ou la démonstration) : des
     NOMBRES — `totauxDevis` rend des objets « effectifs ». */
  const dv = { remiseCentiemes: 1000, acompteCentiemes: 3000, acompteNature: 'arrhes', retenueGarantieCentiemes: 500 };
  /* …et la DEMANDE que la base a vue (relecture ÉCRAN-1 du lot 2a) : c'est
     contre elle que la carte juge, et d'elle que la rangée tire son « 10 % ». */
  const tEcran = { ht: tc.ht, tva: tc.tva, ttc: tc.ttc, brut: tc.brut, reduction: tc.reduction.effectif, acompte: tc.acompte.effectif,
    ttcOptions: tc.ttcOptions, ventilation: tc.ventilation, demande: D.demandeDuDevis(dv) };
  const cles = (e, t = tEcran) => D.rangeesDesTotaux(t, e, { devis: dv, nbOptions: 1 }).map((r) => r.cle);
  /* En franchise, les lignes ne portent AUCUNE TVA : un devis cohérent. */
  const tf = D.totauxDevis([Lg('a', 1, 'poste', 10000, 0), Lg('b', 2, 'poste', 5000, 0), Lg('c', 3, 'option', 2000, 0)],
    { remiseCentiemes: 1000, acompteCentiemes: 3000 });
  const tEcranF = { ht: tf.ht, tva: tf.tva, ttc: tf.ttc, brut: tf.brut, reduction: tf.reduction.effectif, acompte: tf.acompte.effectif,
    ttcOptions: tf.ttcOptions, ventilation: tf.ventilation, demande: D.demandeDuDevis(dv) };
  const reel = D.rangeesDesTotaux(tEcran, 'reel', { devis: dv, nbOptions: 1 });
  const red = reel.find((r) => r.cle === 'reduction') || {};
  const reste = reel.find((r) => r.cle === 'reste') || {};
  verifier('`rangeesDesTotaux` : au réel, avant réduction · réduction · HT · TVA par taux (sur sa base NETTE) · TVA · total · '
    + 'options comprises · arrhes · reste ; hors du réel, aucune taxe nommée',
  json(cles('reel')) === json(['brut', 'reduction', 'net', 'tva:2000', 'tva:1000', 'tva', 'total', 'options', 'acompte', 'reste'])
    && json(cles('franchise', tEcranF)) === json(['brut', 'reduction', 'total', 'options', 'acompte', 'reste'])
    && json(cles(null, tEcranF)) === json(cles('franchise', tEcranF))
    && reel.find((r) => r.cle === 'tva:2000').base === tc.ventilation.find((v) => v.taux === 2000).base
    && reel.find((r) => r.cle === 'total').fort === true, `${json(cles('reel'))} ; ${json(cles('franchise', tEcranF))}`);
  verifier('…la réduction s’affiche « moins » mais SE DIT sans trait d’union, et le reste « avant la retenue de garantie » quand '
    + 'il y en a une ; l’acompte prend le nom de sa NATURE (« Arrhes »)',
  red.moins === true && red.centimes === tc.reduction.effectif && !/[-−]/.test(red.aDire || '-')
    && /^Réduction 10/.test(red.libelle || '') && reste.libelle === 'Reste à payer, avant la retenue de garantie'
    && reste.centimes === tc.ttc - tc.acompte.effectif && (reel.find((r) => r.cle === 'acompte') || {}).libelle.startsWith('Arrhes')
    /* Sans nature, un nom NEUTRE — jamais « Acompte » seul (relecture ÉCRAN-8,
       CONTROLES-10 du lot 2a). */
    && D.libelleAcompte('arrhes') === 'Arrhes' && D.libelleAcompte('acompte') === 'Acompte'
    && D.libelleAcompte(null) === 'Acompte ou arrhes' && D.libelleAcompte(undefined) === 'Acompte ou arrhes',
  json(reel.map((r) => r.aDire)));
  /* En LECTURE (régime pas encore lu) avec de la TVA : le brut est HORS
     taxe et le total la comprend — ils ne se soustraient pas ; la réduction
     ne se montre que dans la carte. */
  verifier('…régime en lecture et lignes à TVA : ni « avant réduction » ni « réduction » dans le bas (deux montants qui ne se '
    + 'soustraient pas)', !cles('lecture').includes('brut') && !cles('lecture').includes('reduction'), json(cles('lecture')));
  verifier('`suffixeDuPied` : UNE mention — ce qui n’est pas parti, puis l’envoi, puis « réduction comprise »',
    D.suffixeDuPied({ nbNonEnregistrees: 2, enCours: true, reduction: 5 }) === ' · 2 lignes non enregistrées'
    && D.suffixeDuPied({ nbNonEnregistrees: 1 }) === ' · 1 ligne non enregistrée'
    && D.suffixeDuPied({ enCours: true, reduction: 5 }) === ' · enregistrement en cours'
    && D.suffixeDuPied({ reduction: 5 }) === ' · réduction comprise' && D.suffixeDuPied({}) === '');
  verifier('`resumeDesConditions` : rien → l’invitation ; ce qui MANQUE d’abord (la nature, la validité), puis ce qui est posé',
    D.resumeDesConditions({}) === 'Aucune condition — touchez pour en poser'
    && D.resumeDesConditions({ acompteCentiemes: 3000 }) === 'Acompte ou arrhes ? à choisir · Validité à choisir · Acompte ou arrhes 30 %'
    && D.resumeDesConditions(dv) === 'Validité à choisir · Réduction 10 % · Arrhes 30 % · Retenue 5 %'
    && D.resumeDesConditions({ validiteJours: 1 }) === 'Valable 1 jour'
    && D.resumeDesConditions({ validiteJours: 30, remiseCentimes: 5000 }) === `Réduction ${D.montantDevis(5000)} · Valable 30 jours`,
  D.resumeDesConditions(dv));
  const eR = D.effetDeLaReduction({ ht: 0, ttc: 0, reduction: 0, brut: 0, demande: D.demandeDuDevis({ remiseCentimes: 5000 }) },
    { remiseCentimes: 5000 }, 'reel');
  const eA = D.effetDeLAcompte(tEcran, dv, 'reel');
  const eAf = D.effetDeLAcompte(tEcran, dv, 'franchise');
  verifier('les phrases d’effet : une réduction en montant plus grande que les postes est dite RAMENÉE ; l’acompte dit le reste, '
    + '« TTC » au réel seulement ; sans condition, rien',
  eR.ramenee === true && /^Ramenée à /.test(eR.aDire) && eA.ramene === false && / TTC — reste à payer, avant la retenue/.test(eA.aDire)
    && !/TTC|HT/.test(eAf.aDire) && D.effetDeLaReduction(tEcran, {}, 'reel') === null && D.effetDeLAcompte(tEcran, {}, 'reel') === null,
  json([eR, eA, eAf]));
  /* Une phrase d'échec par contrainte que l'APPLICATION peut violer : les
     dix-sept moins les QUATRE que la base pose seule. `devis_plafond_check`
     n'en est plus (relecture BASE-4 du lot 2a, mesuré) : retirer ou baisser
     la réduction d'un devis près du plafond la viole depuis l'en-tête, et sa
     phrase dit « La réduction n'a pas pu être changée. » (section 36, d). */
  const parLaBase = ['devis_calculs_check', 'devis_source_check', 'devis_statut_check', 'devis_totaux_check'];
  const generique = D.phraseEchecDuDevis({ enBase: true, erreur: { message: 'réseau' } });
  const sansPhrase = D.CONTRAINTES_DEVIS.filter((n) => !parLaBase.includes(n))
    .filter((n) => D.phraseEchecDuDevis({ enBase: true, erreur: { message: `violates check constraint "${n}"` } }) === generique);
  verifier('`phraseEchecDuDevis` : avant la base, « le brouillon » ; après, le CHAMP que nomme la contrainte — pour chacune des '
    + 'treize que l’application peut violer (le plafond compris) ; sinon la phrase générale',
  D.phraseEchecDuDevis({ enBase: false }) === 'Le brouillon n’a pas pu être enregistré.' && /les conditions/.test(generique)
    && sansPhrase.length === 0
    && D.phraseEchecDuDevis({ enBase: true, erreur: { message: 'x "devis_validite_check"' } }) === 'La validité de l’offre n’a pas pu être enregistrée.'
    && parLaBase.length === 4 && D.CONTRAINTES_DEVIS.length - parLaBase.length === 13,
  sansPhrase.join(', '));
  /* Les mots qui portent la règle — et, depuis la relecture du lot 2a, ceux
     qui manquaient (CONTROLES-8 : « recevoir », pas « encaisser » ; le
     chèque ; la petite entreprise de L. 221-3 ; l'exception limitée à
     l'entretien ou à la réparation expressément demandés, et aux pièces et
     travaux strictement nécessaires. CONTROLES-9 : la présomption d'arrhes
     dite comme une POSITION de l'administration ; la rétractation de 14 jours
     et le remboursement de tout, L. 221-18 et L. 221-24. CONTROLES-12 : la
     date du devis est celle qui sera IMPRIMÉE, à la REMISE, pas celle du
     brouillon). La validité était comparée à « À compter de la date du
     devis. » : elle l'est désormais à sa forme entière, plus bas.
     CONTRE-VÉRIFICATION du lot 2a : « strictement nécessaires À L'URGENCE »
     (sans ces mots, on lisait « nécessaires au chantier », tout le devis) ;
     l'exemple d'exception à la rétractation porte SA limite (« le strict
     nécessaire d'un dépannage urgent » — « un dépannage urgent » seul
     laissait croire que tout le devis y échappe, le sens qui expose
     l'artisan) ; et « s'il se rétracte, vous lui rendez », pas « : vous lui
     rendez alors » juste après l'exception, qui se lisait « dans ce cas-là ». */
  verifier('les aides de droit citent leur article (L. 214-1 pour les arrhes ; L. 221-18 et L. 221-24 pour la rétractation ; '
    + 'L. 221-10 et L. 221-3 pour le délai de sept jours), disent « recevoir », jamais « rien encaisser », et ne promettent '
    + 'aucune date ; la validité court depuis la date IMPRIMÉE, à la remise',
  /L\.\s214-1/.test(D.AIDE_NATURE_ACOMPTE) && /double/.test(D.AIDE_NATURE_ACOMPTE) && /L\.\s221-10/.test(D.ECHEANCE_ACOMPTE)
    && /8e jour/.test(D.ECHEANCE_ACOMPTE) && /urgents/.test(D.ECHEANCE_ACOMPTE) && /option/.test(D.AIDE_REDUCTION)
    && /options/.test(D.AIDE_ACOMPTE)
    && /l’administration considère qu’une somme versée d’avance par un particulier vaut des arrhes/.test(D.AIDE_NATURE_ACOMPTE)
    && /14\sjours pour se rétracter/.test(D.AIDE_NATURE_ACOMPTE) && /L\.\s221-18/.test(D.AIDE_NATURE_ACOMPTE)
    && /L\.\s221-24/.test(D.AIDE_NATURE_ACOMPTE) && /tout ce qu’il a versé, acompte ou arrhes/.test(D.AIDE_NATURE_ACOMPTE)
    && /recevoir aucun paiement/.test(D.ECHEANCE_ACOMPTE) && !/pouvez rien encaisser/.test(D.ECHEANCE_ACOMPTE)
    && /pas même un chèque/.test(D.ECHEANCE_ACOMPTE) && /L\.\s221-3(?!\d)/.test(D.ECHEANCE_ACOMPTE)
    && /5\ssalariés au plus pour des travaux hors de son métier/.test(D.ECHEANCE_ACOMPTE)
    && /d’entretien ou de réparation urgents qu’il vous a expressément demandés/.test(D.ECHEANCE_ACOMPTE)
    && /strictement nécessaires à l’urgence \(/.test(D.ECHEANCE_ACOMPTE)
    && /sauf exceptions \(par exemple, le strict nécessaire d’un dépannage urgent/.test(D.AIDE_NATURE_ACOMPTE)
    && /s’il se rétracte, vous lui rendez tout ce qu’il a versé/.test(D.AIDE_NATURE_ACOMPTE)
    && !/rendez alors/.test(D.AIDE_NATURE_ACOMPTE)
    && /celle qui sera imprimée dessus/.test(D.AIDE_VALIDITE) && /remettrez au client/.test(D.AIDE_VALIDITE)
    && ![D.AIDE_NATURE_ACOMPTE, D.ECHEANCE_ACOMPTE, D.AIDE_REDUCTION, D.AIDE_ACOMPTE, D.AIDE_VALIDITE].some((t) => /€|20\d\d/.test(t)),
  json([D.AIDE_NATURE_ACOMPTE, D.ECHEANCE_ACOMPTE, D.AIDE_VALIDITE]));

  /* LES AIDES DE DROIT, MOT POUR MOT (relecture CONTROLES-4, 8, 9, 11 et 12
     du lot 2a). Contrôlées par des MOTS, leur contraire passait au vert :
     « vaut un acompte », « dans vos locaux », « un an après la signature ».
     Chacune est donc comparée ENTIÈRE à la forme écrite ICI. La changer se
     DÉCIDE : ici, dans `devis.js` (ou l'écran) et dans le même lot, en disant
     pourquoi — comme `ORDRE_DU_FIL` (`verifier-remontee`). Les mots exigés
     au-dessus restent : une forme recopiée de travers ici se verrait aussi.
     L'aide de l'interrupteur « Retenue de garantie » vit dans l'ÉCRAN (un
     attribut JSX) : elle est RELUE dans `ConditionsDevis.js`, morceaux
     recousus et séquences « \u00a0 » décodées. */
  const AIDES_DE_DROIT_ATTENDUES = Object.freeze({
    AIDE_NATURE_ACOMPTE: 'Des arrhes : chacun peut renoncer — le client en les perdant, vous en lui rendant le double. '
      + 'Un acompte engage les deux. Si rien n’est écrit, l’administration considère qu’une somme versée d’avance par un '
      + 'particulier vaut des arrhes (Code de la consommation, art. L.\u00a0214-1). Mais un devis signé hors de vos locaux '
      + 'ou à distance laisse au client 14\u00a0jours pour se rétracter, sauf exceptions (par exemple, le strict nécessaire '
      + 'd’un dépannage urgent qu’il vous a demandé chez lui) : s’il se rétracte, vous lui rendez tout ce qu’il a versé, '
      + 'acompte ou arrhes (art. L.\u00a0221-18 et L.\u00a0221-24).',
    ECHEANCE_ACOMPTE: 'Devis signé hors de vos locaux (chez le client, sur le chantier) par un particulier, ou par une '
      + 'entreprise de 5\u00a0salariés au plus pour des travaux hors de son métier : vous ne pouvez recevoir aucun paiement '
      + 'avant le 8e jour après la signature — pas même un chèque à encaisser plus tard. Seule exception : des travaux '
      + 'd’entretien ou de réparation urgents qu’il vous a expressément demandés chez lui, et seulement pour les pièces '
      + 'et travaux strictement nécessaires à l’urgence (Code de la consommation, art. L.\u00a0221-10 et L.\u00a0221-3). '
      + 'Opus ne sait '
      + 'pas encore où ce devis sera signé : comptez ce délai.',
    AIDE_VALIDITE: 'À compter de la date du devis, celle qui sera imprimée dessus : le jour où vous le remettrez au client, '
      + 'pas celui où vous l’avez commencé.',
    /* …ET LES QUATRE AUTRES AIDES DE LA CARTE (relecture CONTROLES-4 : « porte
       sur les postes et sur chaque option », « options comprises » passaient
       au vert — le CONTRAIRE de la base, qui ne réduit jamais une option et
       calcule l'acompte sans elles). */
    AIDE_REDUCTION: 'Elle porte sur les postes, jamais sur une option : une option n’est pas commandée tant que le client ne '
      + 'l’a pas choisie.',
    AIDE_ACOMPTE: 'Calculé sur le total sans les options : avant la signature, on ne sait pas lesquelles le client prendra.',
    AIDE_REDUCTION_HT: 'En euros, la réduction est hors taxes : elle baisse le total HT, et la TVA avec lui.',
    AIDE_ACOMPTE_TTC: 'En euros, la somme est toutes taxes comprises : c’est ce que le client verse.',
    PHRASE_RETENUE: 'Retenue sur les acomptes, au plus 5\u00a0% (loi n°\u00a071-584 du 16/07/1971). Le client consigne la '
      + 'somme retenue chez un consignataire accepté par vous deux — à défaut, désigné par le président du tribunal. '
      + 'Elle n’est pas retenue si vous fournissez une caution personnelle et solidaire d’un montant égal (banque, '
      + 'établissement financier habilité ou société de caution mutuelle). La somme retenue vous revient (ou la caution '
      + 'est libérée) un an après la réception des travaux, sauf si le client a notifié au consignataire (ou à la '
      + 'caution), par lettre recommandée, une '
      + 'opposition motivée par l’inexécution de vos obligations.',
  });
  const AIDE_INTERRUPTEUR_RETENUE = 'Au plus 5\u00a0% des acomptes, rendue un an après la réception des travaux, sauf '
    + 'opposition motivée que le client notifie au consignataire (ou à la caution) par lettre recommandée.';
  const ecartsAides = Object.entries(AIDES_DE_DROIT_ATTENDUES).filter(([k, v]) => D[k] !== v).map(([k]) => k);
  verifier('les aides de la carte « Conditions » sont ÉCRITES MOT POUR MOT : la nature de l’acompte, le 8e jour, '
    + 'la validité, la retenue de garantie — et la réduction, l’acompte, et leurs deux aides « en euros »',
  ecartsAides.length === 0,
  ecartsAides.map((k) => `${k} : « ${D[k]} »`).join(' | '));
  {
    /* L'attribut `aide` qui suit le libellé « Retenue de garantie », SANS les
       commentaires (une explication qui cite la faute ne la commet pas). */
    const src = sansCommentairesJs(lire('src/components/ConditionsDevis.js'));
    const m = src.match(/libelle="Retenue de garantie"[\s\S]*?aide=\{([^}]*)\}/);
    const lue = m ? [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]).join('')
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) : null;
    verifier('l’aide de l’interrupteur « Retenue de garantie » est écrite MOT POUR MOT : « rendue » (la retenue), un an '
      + 'après la RÉCEPTION, sauf opposition notifiée AU CONSIGNATAIRE (ou à la caution) par lettre recommandée',
    lue === AIDE_INTERRUPTEUR_RETENUE, `lue : « ${lue} »`);
  }

  /* ================================================================
     LA CARTE « CONDITIONS » — ce que la relecture « écran » du lot 2a a
     corrigé (ÉCRAN-1 à ÉCRAN-14, CONTROLES-2, CONTROLES-10). Chaque règle vit
     dans une fonction PURE de `devis.js`, et on la FAIT TOURNER ici : un
     composant React ne se fait pas tourner par `node`.
     ================================================================ */
  {
    /* Les espaces INSÉCABLES (milliers, « % », « € ») lues comme des espaces. */
    const n = (t) => String(t == null ? '' : t).replace(/[\u00a0\u202f]/g, ' ');
    const vierge = D.demandeDuDevis({});
    /* Un devis de 1 000,00 € HT à 20 %, tel que la base le relit. */
    const t0 = { ht: 100000, tva: 20000, ttc: 120000, brut: 100000, reduction: 0, acompte: 0, ttcOptions: 120000,
      ventilation: [{ taux: 2000, base: 100000, tva: 20000 }], demande: vierge };
    const t50 = { ...t0, ht: 95000, tva: 19000, ttc: 114000, reduction: 5000, demande: D.demandeDuDevis({ remiseCentimes: 5000 }) };
    const tTout = { ...t0, ht: 0, tva: 0, ttc: 0, reduction: 100000, demande: D.demandeDuDevis({ remiseCentimes: 200000 }) };
    const volR = D.effetDeLaReduction(t0, { remiseCentimes: 5000 }, 'reel');
    const vol80 = D.effetDeLaReduction(t50, { remiseCentimes: 8000 }, 'reel');
    const echec80 = D.effetDeLaReduction(t50, { remiseCentimes: 8000 }, 'reel', { enEchec: true });
    const vue50 = D.effetDeLaReduction(t50, { remiseCentimes: 5000 }, 'reel');
    const vraie = D.effetDeLaReduction(tTout, { remiseCentimes: 200000 }, 'reel');
    const sansDemande = D.effetDeLaReduction({ ...tTout, demande: undefined }, { remiseCentimes: 200000 }, 'reel');
    const volA = D.effetDeLAcompte(t0, { acompteCentimes: 30000 }, 'reel');
    const echecA = D.effetDeLAcompte(t0, { acompteCentimes: 30000 }, 'reel', { enEchec: true });
    const vraiA = D.effetDeLAcompte({ ...t0, acompte: 120000, demande: D.demandeDuDevis({ acompteCentimes: 999999 }) },
      { acompteCentimes: 999999 }, 'reel');
    verifier('ÉCRAN-1 : « Ramenée à … » ne se juge QUE contre la demande que la base a vue (`totaux.demande`) — pendant l’envoi '
      + '« Calcul en cours… », après un échec RIEN, et « ramenée » seulement quand la base a vu la demande et l’a ramenée',
    volR && volR.enCours === true && volR.ramenee === false && volR.aDire === D.CALCUL_EN_COURS
      && vol80 && vol80.enCours === true && !vol80.ramenee && echec80 === null
      && vue50 && !vue50.ramenee && /passe de 1 000,00 € à 950,00 €/.test(n(vue50.aDire))
      && vraie && vraie.ramenee === true && /^Ramenée à 1 000,00 €/.test(n(vraie.aDire))
      && sansDemande && sansDemande.enCours === true && !sansDemande.ramenee
      && volA && volA.enCours === true && !volA.ramene && echecA === null && vraiA && vraiA.ramene === true,
    json([volR, vol80, echec80, vue50, vraie, volA, echecA, vraiA].map((e) => e && n(e.aDire))));
    /* …et la carte l'ANNONCE à VoiceOver, seulement quand c'est vrai. */
    const carte = sansCommentairesJs(lire('src/components/ConditionsDevis.js'));
    verifier('…et la carte ANNONCE « Ramenée à … » à VoiceOver (`retour.annoncer`), une fois par phrase, et passe `enEchec` '
      + '(un échec de l’écriture OU des totaux illisibles) aux deux phrases d’effet',
    /effetR && effetR\.ramenee \? effetR\.aDire : null/.test(carte) && /effetA && effetA\.ramene \? effetA\.aDire : null/.test(carte)
      && /if \(ramenees && ramenees !== annonce\.current\) retour\.annoncer\(ramenees\);/.test(carte)
      && /const enEchec = !!\(etatEcriture && etatEcriture\.echec\) \|\| totauxIllisibles;/.test(carte)
      && /effetDeLaReduction\(totaux, devis, regime, \{ enEchec \}\)/.test(carte) && /effetDeLAcompte\(totaux, devis, regime, \{ enEchec \}\)/.test(carte));
    /* La demande relue : `select` et lecture de `totauxDepuisBase`, dans les
       DEUX sens — oublier une colonne au `select` rendrait `null`, et la carte
       dirait « Calcul en cours… » pour toujours sur la vraie base. */
    const API = lire('src/lib/api.js');
    const selectTotaux = (/async function relireTotauxDevisSupabase[\s\S]*?\.select\(([\s\S]*?)\)\s*\.eq/.exec(API) || [])[1] || '';
    const corpsTotaux = corpsDeFonction(sansCommentairesJs(lire('src/lib/devis.js')), 'totauxDepuisBase') || '';
    /* …et les deux colonnes qui NOMMENT les rangées (la nature, la retenue :
       contre-vérification d'ÉCRAN-2). */
    const colonnesDemande = ['remise_centimes', 'remise_centiemes', 'acompte_centimes', 'acompte_centiemes',
      'acompte_nature', 'retenue_garantie_centiemes'];
    verifier('ÉCRAN-1 : la demande vue par la base est RELUE avec les totaux — ses quatre colonnes (et la nature, la retenue, '
      + 'qui nomment les rangées) au `select` de '
      + '`relireTotauxDevisSupabase`, lues par `totauxDepuisBase` sous `demande`, et la démonstration rend la même forme',
    colonnesDemande.every((c) => new RegExp(`\\b${c}\\b`).test(selectTotaux.replace(/devis_tva\([^)]*\)/, '')))
      && colonnesDemande.every((c) => new RegExp(`\\bd\\.${c}\\b`).test(corpsTotaux))
      && /demande: \{/.test(corpsTotaux) && /demande: demandeDuDevis\(d\)/.test(lire('src/data/devis-demo.js'))
      && json(D.COLONNES_DE_LA_DEMANDE) === json(['remiseCentimes', 'remiseCentiemes', 'acompteCentimes', 'acompteCentiemes'])
      && /demande: demandeDuDevis\(\{\}\)/.test(ECR.saisie) && /demande: demandeDuDevis\(r\.devis\)/.test(ECR.saisie),
    selectTotaux.slice(0, 220));

    /* ÉCRAN-2 : le pourcentage du libellé vient de la demande RELUE. */
    const t5 = { ...t0, ht: 95000, tva: 19000, ttc: 114000, reduction: 5000, demande: D.demandeDuDevis({ remiseCentiemes: 500 }) };
    const rangVol = D.rangeesDesTotaux(t5, 'reel', { devis: { remiseCentiemes: 2000 } }).find((r) => r.cle === 'reduction') || {};
    const etats = [D.ligneDEtatDeLaCarte({}), D.ligneDEtatDeLaCarte({ enCours: true }),
      D.ligneDEtatDeLaCarte({ echec: 'x', reessayable: true }), D.ligneDEtatDeLaCarte({ echec: 'x', reessayable: false }),
      D.ligneDEtatDeLaCarte({ totauxIllisibles: true }), D.ligneDEtatDeLaCarte({ echec: 'x', reessayable: true, totauxIllisibles: true })];
    const balise = balises(ECR.saisie, 'ConditionsDevis')[0] || '';
    verifier('ÉCRAN-2 : la rangée « Réduction » prend son pourcentage dans la demande RELUE (5 %, jamais les 20 % encore en route) ; '
      + 'la carte reçoit l’état de la file et `totauxIllisibles`, et sa ligne d’état dit l’envoi, l’échec (« Réessayer »), '
      + 'les totaux pas relus (« Relire »)',
    n(rangVol.aDire) === 'Réduction 5 %, 50,00 €'
      && etats[0].ton === 'neutre' && etats[0].action === null && etats[1].texte === 'Enregistrement en cours…'
      && etats[2].ton === 'echec' && etats[2].action === 'reessayer' && etats[3].action === null
      && etats[4].action === 'relire' && etats[5].action === 'reessayer'
      && /etatEcriture=\{\{/.test(balise) && /totauxIllisibles=\{totauxIllisibles\}/.test(balise)
      && /onReessayer=\{/.test(balise) && /onRelireTotaux=\{relireTotaux\}/.test(balise)
      && /etat\.action === 'reessayer'[\s\S]{0,200}onPress=\{onReessayer\}/.test(carte)
      && /etat\.action === 'relire'[\s\S]{0,200}onPress=\{onRelireTotaux\}/.test(carte),
    `${n(rangVol.aDire)} ; ${json(etats.map((e) => e.action))}`);

    /* CONTRE-VÉRIFICATION d'ÉCRAN-2 (mesurée au navigateur) : le pourcentage
       venait de la demande relue, mais la NATURE et la RETENUE venaient
       encore du devis de l'écran — après une écriture ratée, la rangée
       disait « Arrhes 30 %, 444,87 € » quand la base avait gardé un acompte,
       et « Reste à payer » sans « avant la retenue » quand la base l'avait. */
    const tVu = { ...t0, acompte: 36000, demande: D.demandeDuDevis({ acompteCentiemes: 3000, acompteNature: 'acompte', retenueGarantieCentiemes: 500 }) };
    const localEnAvance = { acompteCentiemes: 3000, acompteNature: 'arrhes', retenueGarantieCentiemes: null };
    const rangMix = D.rangeesDesTotaux(tVu, 'reel', { devis: localEnAvance });
    const effetMix = D.effetDeLAcompte(tVu, localEnAvance, 'reel');
    verifier('contre-vérification d’ÉCRAN-2 : la NATURE et la RETENUE des rangées viennent aussi de la demande RELUE '
      + '(« Acompte 30 % », « avant la retenue de garantie »), jamais du devis de l’écran en avance sur la base ; '
      + '`demandeDuDevis` les porte, et la phrase de l’acompte suit la même règle',
    n((rangMix.find((r) => r.cle === 'acompte') || {}).libelle) === 'Acompte 30 %'
      && (rangMix.find((r) => r.cle === 'reste') || {}).libelle === 'Reste à payer, avant la retenue de garantie'
      && / TTC — reste à payer, avant la retenue de garantie /.test(n((effetMix || {}).aDire))
      && json(D.LIBELLES_DE_LA_DEMANDE) === json(['acompteNature', 'retenueGarantieCentiemes'])
      && json(D.demandeDuDevis({ acompteNature: 'inconnue', retenueGarantieCentiemes: '500' }))
        === json({ remiseCentimes: null, remiseCentiemes: null, acompteCentimes: null, acompteCentiemes: null,
          acompteNature: null, retenueGarantieCentiemes: 500 })
      /* Sans demande relue, aucune nature n'est inventée : le nom NEUTRE. */
      && n((D.rangeesDesTotaux({ ...t0, acompte: 36000 }, 'reel', { devis: localEnAvance }).find((r) => r.cle === 'acompte') || {}).libelle)
        === 'Acompte ou arrhes'
      && /\bd\.acompte_nature\b/.test(corpsTotaux) && /\bd\.retenue_garantie_centiemes\b/.test(corpsTotaux),
    json(rangMix.map((r) => r.aDire)));

    /* CONTROLES-2 : l'état initial, sur un devis vierge, ne choisit RIEN. */
    const vide = D.etatInitialConditions({});
    verifier('CONTROLES-2 : `etatInitialConditions` — sur un devis VIERGE, ni nature, ni validité, ni « Autre », ni retenue ; '
      + 'et la carte part d’ELLE (`useState(() => etatInitialConditions(devis, textes))`), sans autre défaut écrit à la main',
    json(vide) === json({ uniteReduction: 'pourcent', uniteAcompte: 'pourcent', nature: null, validite: null, validiteAutre: false, retenue: false })
      && D.etatInitialConditions({ acompteNature: 'inconnue' }).nature === null
      && D.etatInitialConditions({ validiteJours: 45 }).validiteAutre === true && D.etatInitialConditions({ validiteJours: 30 }).validite === 30
      && /const \[initial\] = useState\(\(\) => etatInitialConditions\(devis, textes\)\);/.test(carte)
      && !/acompteNature \?\?|nature: devis\./.test(carte), json(vide));

    /* ÉCRAN-3 et ÉCRAN-4 : « Corriger » rouvre la carte comme on l'a laissée. */
    const choixEuros = { ...vide, uniteReduction: 'montant' };
    const rouverte = D.etatInitialConditions({}, { reduction: '12,5,3', choix: choixEuros });
    const rouverteVide = D.etatInitialConditions({ remiseCentiemes: 700 }, { reduction: '', choix: choixEuros });
    const autre = D.lireConditions({ choix: { ...D.etatInitialConditions({ validiteJours: 30 }), validiteAutre: true, validite: null },
      tapes: { reduction: '', acompte: '' }, devis: { validiteJours: 30 } });
    const autre400 = D.etatInitialConditions({}, { validite: '400' });
    verifier('ÉCRAN-3 / ÉCRAN-4 : un montant refusé en EUROS rouvre sous « € » (jamais sous « % », où « 35,50 » ferait 35,5 %) ; '
      + 'un champ gardé vide rouvre dans l’unité de la valeur ; toucher « Autre » n’EFFACE PAS 30 jours ; une validité '
      + 'refusée rouvre « Autre » avec son champ',
    rouverte.uniteReduction === 'montant' && rouverteVide.uniteReduction === 'pourcent'
      && autre.changements.validiteJours === 30 && !autre.erreurs.validiteJours
      && autre400.validiteAutre === true && autre400.validite === null
      /* La saisie garde les CHOIX avec les textes, et la carte les lui passe. */
      && /onEnregistrer\(l\.changements, l\.erreurs, \{ \.\.\.l\.textes, choix: choix\.current \}, geste\)/.test(carte),
    json([rouverte, rouverteVide, autre.changements.validiteJours, autre400]));

    /* ÉCRAN-5 : la retenue se borne DANS la carte. */
    const r6 = D.versRetenueDeDevis('6');
    const lu6 = D.lireConditions({ choix: { ...vide, retenue: true }, tapes: { reduction: '', acompte: '', retenue: '6' }, devis: {} });
    verifier('ÉCRAN-5 : une retenue de 6 % (ou 0) est refusée PAR LA CARTE, sous son champ, avec le texte tapé gardé ; 0,01 à 5 % '
      + 'passent ; vide = rien',
    r6.ok === false && /0,01 % et 5 %/.test(n(r6.message)) && D.versRetenueDeDevis('0').ok === false
      && D.versRetenueDeDevis('5').centiemes === 500 && D.versRetenueDeDevis('0,01').centiemes === 1
      && D.versRetenueDeDevis('').ok === true && D.versRetenueDeDevis('').centiemes === null
      && !!lu6.erreurs.retenueGarantieCentiemes && lu6.textes.retenue === '6'
      && !Object.prototype.hasOwnProperty.call(lu6.changements, 'retenueGarantieCentiemes'),
    json([r6, lu6.erreurs]));

    /* ÉCRAN-9 : une pastille d'unité n'écrit RIEN. */
    const devis7 = { remiseCentiemes: 700 };
    const enAttente = D.lireConditions({ choix: { ...D.etatInitialConditions(devis7), uniteReduction: 'montant' },
      tapes: { reduction: '', acompte: '' }, devis: devis7 });
    const remplace = D.lireConditions({ choix: { ...D.etatInitialConditions(devis7), uniteReduction: 'montant' },
      tapes: { reduction: '25', acompte: '' }, devis: devis7 });
    const retire = D.lireConditions({ choix: D.etatInitialConditions(devis7), tapes: { reduction: '', acompte: '' }, devis: devis7 });
    const acompteEnAttente = D.lireConditions({ choix: { ...D.etatInitialConditions({ acompteCentiemes: 3000 }), uniteAcompte: 'montant', nature: 'arrhes' },
      tapes: { reduction: '', acompte: '' }, devis: { acompteCentiemes: 3000 } });
    verifier('ÉCRAN-9 : 7 % enregistrés, la pastille « € » et le champ vide → AUCUNE colonne de la réduction ne part, et la carte '
      + 'dit « Enregistrée : 7 % — écrivez un montant en euros pour la remplacer. » — SEULEMENT si la base a vu ces 7 %, '
      + 'sinon « Pas encore enregistrée » ; « 25 » tapé → 25,00 € ; vidé dans l’unité '
      + 'de la valeur → la réduction est retirée ; la nature d’un acompte en attente part quand même',
    !('remiseCentimes' in enAttente.changements) && !('remiseCentiemes' in enAttente.changements) && !Object.keys(enAttente.erreurs).length
      && n(D.phraseUniteEnAttente(devis7, 'remise', 'montant', null, D.demandeDuDevis(devis7)))
        === 'Enregistrée : 7 % — écrivez un montant en euros pour la remplacer.'
      /* Contre-vérification : pendant l'envoi, ou après un échec, la base n'a
         pas vu la valeur — jamais « Enregistrée ». */
      && n(D.phraseUniteEnAttente(devis7, 'remise', 'montant', null, D.demandeDuDevis({ remiseCentimes: 5000 })))
        === 'Pas encore enregistrée : 7 % — écrivez un montant en euros pour la remplacer.'
      && n(D.phraseUniteEnAttente(devis7, 'remise', 'montant')) === 'Pas encore enregistrée : 7 % — écrivez un montant en euros pour la remplacer.'
      && n(D.phraseUniteEnAttente({ acompteCentiemes: 3000 }, 'acompte', 'montant', 'arrhes', D.demandeDuDevis({ acompteCentiemes: 3000 })))
        === 'Enregistrées : 30 % — écrivez un montant en euros pour les remplacer.'
      && /phraseUniteEnAttente\(devis, 'remise', c\.uniteReduction, null, demandeVue\)/.test(carte)
      && /phraseUniteEnAttente\(devis, 'acompte', c\.uniteAcompte, c\.nature, demandeVue\)/.test(carte)
      && /const demandeVue = totaux && totaux\.demande;/.test(carte)
      && D.phraseUniteEnAttente(devis7, 'remise', 'pourcent') === null && D.phraseUniteEnAttente({}, 'remise', 'montant') === null
      && remplace.changements.remiseCentimes === 2500 && remplace.changements.remiseCentiemes === null
      && retire.changements.remiseCentiemes === null && retire.changements.remiseCentimes === null
      && acompteEnAttente.changements.acompteNature === 'arrhes' && !('acompteCentimes' in acompteEnAttente.changements)
      && D.texteEnregistreDans(devis7, 'remise', 'pourcent') === '7' && D.texteEnregistreDans(devis7, 'remise', 'montant') === ''
      /* Et la pastille d'unité passe par `changerUnite`, jamais par `choisir`. */
      && /onPress=\{\(\) => changerUnite\('remise', 'pourcent'\)\}/.test(carte) && /onPress=\{\(\) => changerUnite\('remise', 'montant'\)\}/.test(carte)
      && /onPress=\{\(\) => changerUnite\('acompte', 'pourcent'\)\}/.test(carte) && /onPress=\{\(\) => changerUnite\('acompte', 'montant'\)\}/.test(carte)
      && /champ\.current\.ecrire\(texteEnregistreDans\(devis, prefixe, unite\)\)/.test(carte),
    json([enAttente.changements, remplace.changements, acompteEnAttente.changements]));

    /* ÉCRAN-10 : la phrase d'effet suit la règle de `rangeesDesTotaux`. */
    const t10 = { ...t0, ht: 90000, tva: 18000, ttc: 108000, reduction: 10000, demande: D.demandeDuDevis({ remiseCentiemes: 1000 }) };
    const sansTaxe = ['franchise', null, { echec: true }, { chargement: true }]
      .map((reg) => n((D.effetDeLaReduction(t10, { remiseCentiemes: 1000 }, reg) || {}).aDire));
    const franchiseSansTva = D.effetDeLaReduction({ ...t10, tva: 0, ttc: 90000 }, { remiseCentiemes: 1000 }, 'franchise');
    verifier('ÉCRAN-10 : régime en lecture, en échec, non déclaré, ou franchise dont des lignes portent de la TVA — la phrase ne '
      + 'compare pas un « avant/après » HT au « Total » qui la comprend ; au réel, « Le total HT » ; en franchise sans TVA, '
      + '« Le total des postes »',
    sansTaxe.every((x) => x === 'Réduction appliquée aux postes : 100,00 €.')
      && /^Le total HT des postes passe de 1 000,00 € à 900,00 €\.$/.test(n(D.effetDeLaReduction(t10, { remiseCentiemes: 1000 }, 'reel').aDire))
      && /^Le total des postes passe de /.test(n(franchiseSansTva.aDire)), json(sansTaxe));

    /* ÉCRAN-7 et ÉCRAN-8 : les noms des champs. */
    const reel = D.libellesDesConditions('reel', null);
    const fr = D.libellesDesConditions('franchise', 'arrhes');
    verifier('ÉCRAN-7 / ÉCRAN-8 : au réel « Réduction HT, en euros » (« Montant HT ») et « … TTC, en euros », et les aides le '
      + 'disent ; hors du réel, ni HT ni TTC ; l’acompte sans nature s’appelle « Acompte ou arrhes » PARTOUT — titre, champs, '
      + 'pastilles, rangée, résumé — jamais « Acompte » seul',
    reel.reductionMontant === 'Réduction HT, en euros' && reel.reductionExemple === 'Montant HT'
      && reel.acompteMontant === 'Acompte ou arrhes TTC, en euros' && reel.acompteExemple === 'Montant TTC'
      && /hors taxes/.test(reel.aideReductionMontant) && /toutes taxes comprises/.test(reel.aideAcompteMontant)
      && fr.reductionMontant === 'Réduction, en euros' && fr.acompteMontant === 'Arrhes, en euros' && fr.aideReductionMontant === null
      && reel.acompte === 'Acompte ou arrhes' && reel.acomptePourcent === 'Acompte ou arrhes, en pour cent'
      && reel.acompteEnPourcentage === 'Acompte ou arrhes en pourcentage'
      && n((D.rangeesDesTotaux({ ...t0, acompte: 36000, demande: D.demandeDuDevis({ acompteCentiemes: 3000 }) }, 'reel',
        { devis: { acompteCentiemes: 3000 } }).find((r) => r.cle === 'acompte') || {}).libelle) === 'Acompte ou arrhes 30 %'
      && /accessibilityRole="header">\{noms\.acompte\}</.test(carte) && !/>Acompte</.test(carte)
      && /accessibilityLabel=\{c\.uniteReduction === 'montant' \? noms\.reductionMontant : noms\.reductionPourcent\}/.test(carte)
      && /accessibilityLabel=\{c\.uniteAcompte === 'montant' \? noms\.acompteMontant : noms\.acomptePourcent\}/.test(carte)
      && !/'Montant en euros'|'Réduction, en euros'|'Acompte, en euros'|'Acompte, en pour cent'/.test(carte),
    json(reel));

    /* ÉCRAN-12 : une place réservée sous chaque montant. */
    verifier('ÉCRAN-12 : sous la réduction ET sous l’acompte, une ZONE de hauteur fixe (deux lignes) porte la faute, la valeur en '
      + 'attente ou l’effet — rien ne pousse la carte au moment où l’on vise ; la ligne du reste, dans la barre, a sa place '
      + 'même vide',
    /zone: \{ minHeight: 2 \* interligne\(T\.petit\) \+ S\.xs, marginTop: S\.xs \}/.test(carte)
      /* Contre-vérification : sous une faute, l'effet de la valeur enregistrée
         se TAIT (il se lisait comme l'effet du texte refusé, et la carte
         sautait de 36 px). */
      && /: !faute && !!effet && <Text style=\{ramene \? s\.rameneZone : s\.aideZone\}>\{effet\.aDire\}<\/Text>/.test(carte)
      && /\{zone\(sous\('remiseCentiemes', 'remiseCentimes'\), attenteR, effetR,/.test(carte)
      && /\{zone\(sous\('acompteCentiemes', 'acompteCentimes'\), attenteA, effetA,/.test(carte)
      && /ligneReste: \{ minHeight: interligne\(T\.petit\) \}/.test(carte) && /<View style=\{s\.ligneReste\}>/.test(carte)
      && /etat: \{[^}]*minHeight: interligne\(T\.petit\) \+ 2 \* S\.xs/.test(carte));

    /* ÉCRAN-13 : on vibre pour le geste qu'on vient de faire. */
    verifier('ÉCRAN-13 : `vibrerPourLaCarte` — une faute de la validité ne fait PAS vibrer un appui sur la nature, une unité ou '
      + 'la retenue ; elle fait vibrer la sortie de son champ ; fermer la carte ne REvibre pas une faute déjà dite, mais une '
      + 'faute NOUVELLE vibre une fois, quel que soit le geste ; et chaque geste de la carte se nomme',
    D.vibrerPourLaCarte('nature', ['validiteJours']) === false && D.vibrerPourLaCarte('unite', ['validiteJours']) === false
      && D.vibrerPourLaCarte('retenue', ['validiteJours']) === false && D.vibrerPourLaCarte('validite', ['validiteJours']) === true
      && D.vibrerPourLaCarte('reduction', ['remiseCentimes']) === true && D.vibrerPourLaCarte('nature', ['acompteCentiemes']) === true
      && D.vibrerPourLaCarte('fermer', ['validiteJours']) === false
      /* Contre-vérification : une faute NOUVELLE (jamais dite) vibre une fois,
         quel que soit le geste ; une faute déjà dite ne revibre pas. */
      && D.vibrerPourLaCarte('fermer', ['validiteJours'], []) === true
      && D.vibrerPourLaCarte('fermer', ['validiteJours'], ['validiteJours']) === false
      && D.vibrerPourLaCarte('nature', ['validiteJours'], ['validiteJours']) === false
      && D.vibrerPourLaCarte('unite', ['remiseCentiemes'], ['remiseCentimes']) === true
      && D.vibrerPourLaCarte('validite', ['validiteJours'], ['validiteJours']) === true
      && ["enregistrer('reduction')", "enregistrer('acompte')", "enregistrer('validite')", "enregistrer('retenue')",
        "choisir({ nature: n }, 'nature')", "'validite')}", "choisir({ retenue: !c.retenue }, 'retenue')", "enregistrer('unite')"]
        .every((x) => carte.includes(x)) && !/onBlur=\{enregistrer\}/.test(carte));

    /* ÉCRAN-14 : VoiceOver dit le total et « réduction comprise ». */
    const ecranDevis = sansCommentairesJs(lire('src/screens/DevisScreen.js'));
    verifier('ÉCRAN-14 : la carte d’un brouillon dans « Mes devis » DIT son total TTC et « réduction comprise » (`libelleCarteDevis`)',
      n(D.libelleCarteDevis({ objet: 'Salle de bains', client: 'Mme Martin', libelleTotal: 'Total TTC', total: 137910, reduction: true }))
        === 'Ouvrir le brouillon Salle de bains, Mme Martin, Total TTC 1 379,10 €, réduction comprise'
      && n(D.libelleCarteDevis({ total: 0 })) === 'Ouvrir le brouillon sans objet, client à choisir, Total 0,00 €'
      && /accessibilityLabel=\{libelleCarteDevis\(\{\s*objet, client, libelleTotal, total, reduction,\s*\}\)\}/.test(ecranDevis));
  }

  /* LES PAIRES, par la FILE : une écriture partie sans réponse a peut-être
     posé le pourcentage ; passer au montant doit envoyer la paire ENTIÈRE,
     sinon la base aurait les deux formes à la fois. */
  const journal = [];
  const fichier = new Map();
  const f = F.creerFileEcriture({
    devisId: 'P1', devis: { source: 'manuelle' }, devisEnBase: true, paires: D.PAIRES_DEVIS,
    ecrire: async (op) => { journal.push(op); fichier.set(op.id, { ...(fichier.get(op.id) || {}), ...op.valeurs }); return null; },
    relireUn: async ({ id }) => (fichier.has(id) ? { ...fichier.get(id) } : null),
    avecDelai: ERR.avecDelai, delaiMs: 200, nouvelIdentifiant: () => null,
  });
  f.devis({ source: 'manuelle', remiseCentimes: 5000, remiseCentiemes: null });
  await f.attendre(500);
  f.devis({ source: 'manuelle', remiseCentimes: 5000, remiseCentiemes: null, acompteCentiemes: 3000, acompteCentimes: null, acompteNature: 'arrhes' });
  await f.attendre(500);
  const premier = journal[0] ? journal[0].valeurs : {};
  const second = journal[1] ? journal[1].valeurs : {};
  verifier('une PAIRE part ENTIÈRE par la file (`PAIRES_DEVIS`, passées par `api.js`) : le montant de la réduction emporte son '
    + 'pourcentage vide, l’acompte sa nature — même quand la base est CRUE vide',
  json(Object.keys(premier).sort()) === json(['remiseCentiemes', 'remiseCentimes'])
    && premier.remiseCentiemes === null && premier.remiseCentimes === 5000
    && json(Object.keys(second).sort()) === json(['acompteCentiemes', 'acompteCentimes', 'acompteNature'])
    && D.PAIRES_DEVIS.flat().every((c) => D.CHAMPS_DEVIS.includes(c))
    && /paires:\s*PAIRES_DEVIS/.test(lire('src/lib/api.js')),
  json(journal.map((o) => o.valeurs)));

  /* L'ALLER-RETOUR PAR LA DÉMONSTRATION : une réduction et un acompte
     écrits, relus en NOMBRES — la forme de la vraie base (`totauxDepuisBase`) —,
     égaux à ce que `totauxDevis` refait. */
  const baseDemo = DEMO.creerBaseDevisDemo({});
  const unDevis = (await baseDemo.liste('1')).find((d) => d.totalHtCentimes > 0);
  let detDemo = 'aucun devis chiffré dans la démonstration';
  let okDemo = false;
  if (unDevis) {
    await baseDemo.ecrire('1', { quoi: 'devis', action: 'modifier', id: unDevis.id, generation: Number(unDevis.generation || 0) + 10,
      valeurs: { remiseCentiemes: 1000, remiseCentimes: null, acompteCentimes: 9999999999, acompteCentiemes: null, acompteNature: 'acompte' } });
    const t = await baseDemo.relireTotaux('1', unDevis.id);
    const lu = await baseDemo.un('1', unDevis.id);
    const refait = D.totauxDevis(lu.lignes, { remiseCentiemes: 1000, acompteCentimes: 9999999999 });
    const clesApi = ['ht', 'tva', 'ttc', 'reduction', 'brut', 'acompte', 'ttcOptions', 'demande', 'generation', 'modifieLe', 'ventilation'];
    const srcApi = corpsDeFonction(sansCommentairesJs(lire('src/lib/devis.js')), 'totauxDepuisBase') || '';
    okDemo = !!t && t.reduction === refait.reduction.effectif && t.acompte === refait.acompte.effectif && t.acompte === t.ttc
      /* La demande que la base a vue revient avec les totaux (ÉCRAN-1). */
      && json(t.demande) === json({ remiseCentimes: null, remiseCentiemes: 1000, acompteCentimes: 9999999999, acompteCentiemes: null,
        acompteNature: 'acompte', retenueGarantieCentiemes: lu.devis.retenueGarantieCentiemes ?? null })
      && t.brut === t.ht + t.reduction && t.ttcOptions === refait.ttcOptions && typeof t.reduction === 'number'
      && json(Object.keys(t).sort()) === json([...clesApi].sort())
      && clesApi.every((k) => new RegExp(`\\b${k}\\b\\s*[:,]`).test(srcApi));
    detDemo = json({ t, effectifs: [refait.reduction.effectif, refait.acompte.effectif] });
  }
  verifier('l’aller-retour par la démonstration : la réduction et l’acompte (ramené au TTC) relus en NOMBRES, égaux à ce que '
    + '`totauxDevis` refait, sous les MÊMES clés que `totauxDepuisBase` (la vraie base)', okDemo, detDemo);
}

console.log('\n  36. le lot 2a — ce que la relecture « contrôles » a vu passer au vert, FAIT TOURNER');
{
  const n = (t) => String(t == null ? '' : t).replace(/[\u00a0\u202f]/g, ' ');
  const dd = D.demandeDuDevis;

  /* a. LES PHRASES D'EFFET, AVEC DES MONTANTS CALCULÉS À LA MAIN (relecture
        CONTROLES-4, J10 et J11) : la forme seule était lue (« passe de »,
        « reste à payer ») — un reste égal au TTC PLUS l'acompte, ou « passe
        de 1 319,00 € à 1 319,00 € », passaient au vert. Chaque montant
        ci-dessous est posé à la main : 131 900 − 13 190 = 118 710 ;
        133 461 − 40 038 = 93 423 ; 120 000 − 30 000 = 90 000. */
  const EFFETS = [
    ['R1 réel, 10 %', D.effetDeLaReduction({ ht: 118710, tva: 12000, ttc: 130710, brut: 131900, reduction: 13190, demande: dd({ remiseCentiemes: 1000 }) }, { remiseCentiemes: 1000 }, 'reel'),
      'Le total HT des postes passe de 1 319,00 € à 1 187,10 €.'],
    ['R2 franchise, 50,00 €', D.effetDeLaReduction({ ht: 95000, tva: 0, ttc: 95000, brut: 100000, reduction: 5000, demande: dd({ remiseCentimes: 5000 }) }, { remiseCentimes: 5000 }, 'franchise'),
      'Le total des postes passe de 1 000,00 € à 950,00 €.'],
    ['R3 ramenée', D.effetDeLaReduction({ ht: 0, tva: 0, ttc: 0, brut: 100000, reduction: 100000, demande: dd({ remiseCentimes: 200000 }) }, { remiseCentimes: 200000 }, 'reel'),
      'Ramenée à 1 000,00 € : le total des postes est plus petit que la réduction demandée.'],
    ['R4 franchise avec TVA', D.effetDeLaReduction({ ht: 90000, tva: 18000, ttc: 108000, brut: 100000, reduction: 10000, demande: dd({ remiseCentiemes: 1000 }) }, { remiseCentiemes: 1000 }, 'franchise'),
      'Réduction appliquée aux postes : 100,00 €.'],
    ['R5 sans brut relu', D.effetDeLaReduction({ ht: 90000, tva: 18000, ttc: 108000, reduction: 10000, demande: dd({ remiseCentiemes: 1000 }) }, { remiseCentiemes: 1000 }, 'reel'),
      'Le total HT des postes passe de 1 000,00 € à 900,00 €.'],
    ['A1 réel, 30 %', D.effetDeLAcompte({ ttc: 133461, acompte: 40038, demande: dd({ acompteCentiemes: 3000 }) }, { acompteCentiemes: 3000 }, 'reel'),
      '400,38 € TTC — reste à payer 934,23 € TTC.'],
    ['A2 réel, 30 %, retenue', D.effetDeLAcompte({ ttc: 133461, acompte: 40038, demande: dd({ acompteCentiemes: 3000, retenueGarantieCentiemes: 500 }) }, { acompteCentiemes: 3000 }, 'reel'),
      '400,38 € TTC — reste à payer, avant la retenue de garantie 934,23 € TTC.'],
    ['A3 franchise, 300,00 €', D.effetDeLAcompte({ ttc: 120000, acompte: 30000, demande: dd({ acompteCentimes: 30000 }) }, { acompteCentimes: 30000 }, 'franchise'),
      '300,00 € — reste à payer 900,00 €.'],
    ['A4 ramené', D.effetDeLAcompte({ ttc: 120000, acompte: 120000, demande: dd({ acompteCentimes: 999999 }) }, { acompteCentimes: 999999 }, 'reel'),
      'Ramené à 1 200,00 € : le total est plus petit que le montant demandé.'],
    ['A5 100 %', D.effetDeLAcompte({ ttc: 120000, acompte: 120000, demande: dd({ acompteCentiemes: 10000 }) }, { acompteCentiemes: 10000 }, 'reel'),
      '1 200,00 € TTC — reste à payer 0,00 € TTC.'],
  ];
  const effetsFaux = EFFETS.filter(([, e, attendu]) => !e || n(e.aDire) !== attendu).map(([k, e]) => `${k} : « ${e && n(e.aDire)} »`);
  verifier('les phrases d’effet de la carte, FAITES TOURNER sur dix cas aux montants posés à la main : la réduction (%, €, ramenée, '
    + 'franchise, franchise avec TVA, sans brut relu) et l’acompte (%, retenue, €, ramené, 100 %) — chaque phrase ENTIÈRE',
  effetsFaux.length === 0 && EFFETS.filter(([k]) => /^R3|^A4/.test(k)).every(([, e]) => e && (e.ramenee === true || e.ramene === true)),
  effetsFaux.join(' | '));

  /* b. LA CARTE AFFICHE CHAQUE AIDE (relecture CONTROLES-4, E03b et E04b) :
        une aide retirée de l'écran n'était refusée que par le cliquet du
        linter (l'import devenu mort) ; mise sous `{false && …}`, l'import
        restant employé, elle passait au vert. On lit l'ÉCRAN, commentaires
        retirés : chaque aide est un enfant `{AIDE_…}` d'un `<Text
        style={s.aide}>`, et les accolades encore OUVERTES autour d'elle
        — ses CONDITIONS d'affichage — sont exactement celles attendues
        (aucune pour les six aides de toujours ; la retenue ouverte pour la
        phrase de la loi ; le régime réel pour les deux aides « en euros »). */
  const carteSrc = sansCommentairesJs(lire('src/components/ConditionsDevis.js'));
  const iEcran = carteSrc.indexOf('<View style={s.ecran}');
  /* Les chaînes et les gabarits VIDÉS (leurs accolades ne comptent pas). */
  const vide = (t) => t.replace(/`(?:[^`\\]|\\.)*`/g, (m) => '`' + ' '.repeat(m.length - 2) + '`')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, (m) => "'" + ' '.repeat(m.length - 2) + "'")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, (m) => '"' + ' '.repeat(m.length - 2) + '"');
  const plat = iEcran >= 0 ? vide(carteSrc) : '';
  const gardesDe = (motif) => {
    const res = [];
    const re = new RegExp(motif, 'g');
    let m;
    while ((m = re.exec(plat))) {
      if (m.index < iEcran) continue;
      const pile = [];
      for (let i = iEcran; i < m.index; i += 1) {
        if (plat[i] === '{') pile.push(i);
        else if (plat[i] === '}') pile.pop();
      }
      /* La condition ENTIÈRE, de l'accolade jusqu'à l'élément qu'elle
         affiche (`<Text`, `<>`) — pas seulement son premier `&&` : une
         condition ALLONGÉE (`{!!a && !!b && <Text…`) cachait l'aide quand
         `b` manquait, et passait (sabotage Q52 du banc). */
      res.push(pile.map((p) => {
        const suite = plat.slice(p + 1, m.index);
        const fin = suite.search(/<[A-Za-z>]/);
        return sansEspaces((fin >= 0 ? suite.slice(0, fin) : suite).replace(/\(\s*$/, ''));
      }));
    }
    return res;
  };
  const AFFICHAGES = [
    ['AIDE_REDUCTION', String.raw`<Text style=\{s\.aide\}>\{AIDE_REDUCTION\}</Text>`, []],
    ['AIDE_ACOMPTE', String.raw`<Text style=\{s\.aide\}>\{AIDE_ACOMPTE\}</Text>`, []],
    ['AIDE_NATURE_ACOMPTE', String.raw`<Text style=\{s\.aide\}>\{AIDE_NATURE_ACOMPTE\}</Text>`, []],
    ['ECHEANCE_ACOMPTE', String.raw`<Text style=\{s\.aide\}>\{ECHEANCE_ACOMPTE\}</Text>`, []],
    ['AIDE_VALIDITE', String.raw`<Text style=\{s\.aide\}>\{AIDE_VALIDITE\}</Text>`, []],
    ['PHRASE_RETENUE', String.raw`<Text style=\{s\.aide\}>\{PHRASE_RETENUE\}</Text>`, ['c.retenue &&']],
    ['aideReductionMontant (AIDE_REDUCTION_HT)', String.raw`<Text style=\{s\.aide\}>\{noms\.aideReductionMontant\}</Text>`, ['!!noms.aideReductionMontant &&']],
    ['aideAcompteMontant (AIDE_ACOMPTE_TTC)', String.raw`<Text style=\{s\.aide\}>\{noms\.aideAcompteMontant\}</Text>`, ['!!noms.aideAcompteMontant &&']],
    ['l’aide de « Retenue de garantie »', String.raw`<Interrupteur\s+actif=\{c\.retenue\}\s+libelle="\s*"\s+aide=\{`, []],
  ];
  const malAffichees = AFFICHAGES.map(([k, motif, attendu]) => {
    const g = gardesDe(motif);
    return g.length === 1 && json(g[0]) === json(attendu) ? null : `${k} : ${g.length} occurrence(s), conditions ${json(g)}`;
  }).filter(Boolean);
  const styleAide = (/\n\s{2}aide:\s*\{([^}]*)\}/.exec(carteSrc) || [])[1] || '';
  verifier('la carte « Conditions » AFFICHE chaque aide : un enfant `{AIDE_…}` d’un `<Text style={s.aide}>`, une seule fois, sous '
    + 'EXACTEMENT ses conditions (aucune pour les six de toujours, la retenue ouverte, le régime réel pour les deux « en euros ») — et '
    + 'le style `aide` ne la cache pas',
  iEcran >= 0 && malAffichees.length === 0 && styleAide.length > 10
    && !/\b(display|opacity|height|maxHeight|width|position|overflow)\s*:|transparent|fontSize:\s*0\b/.test(styleAide),
  [...malAffichees, styleAide ? '' : 'style `aide` introuvable'].filter(Boolean).join(' | '));
  /* …et les deux aides « en euros » sont celles que `libellesDesConditions`
     rend au régime réel — et seulement là (hors du réel, l'euro n'est ni HT
     ni TTC). */
  const reel = D.libellesDesConditions('reel');
  const franchise = D.libellesDesConditions('franchise');
  verifier('…les deux aides « en euros » viennent de `libellesDesConditions` — au régime réel seulement',
    reel.aideReductionMontant === D.AIDE_REDUCTION_HT && reel.aideAcompteMontant === D.AIDE_ACOMPTE_TTC
    && franchise.aideReductionMontant === null && franchise.aideAcompteMontant === null
    && D.libellesDesConditions(null).aideReductionMontant === null,
  json([reel.aideReductionMontant, franchise.aideReductionMontant]));

  /* c. LA LECTURE PAR LA VRAIE BASE, FAITE TOURNER (relecture CONTROLES-5,
        A02 à A04) : `rowToDevis` et `totauxDepuisBase` vivaient dans
        `api.js`, que `node` n'ouvre pas — et la section 35 ne comparait que
        les CLÉS, par la démonstration. Une colonne retirée du `select`,
        une colonne non relue, l'acompte relu dans la colonne du total toutes
        options comprises : trois défauts verts, visibles sur la vraie base
        seulement (la règle n° 1 de CLAUDE.md). Elles vivent dans `devis.js`
        et tournent ici sur une ligne FABRIQUÉE comme PostgREST la rend :
        des noms de colonnes, des nombres JSON — deux en chaîne, pour la
        conversion —, chaque montant DIFFÉRENT des autres (un échange de deux
        colonnes se voit). */
  const ligneDevis = {
    id: 'd-1', pro_id: 'p-1', client_id: 'c-1', quote_request_id: 'q-1', sos_request_id: null, source: 'demande', statut: 'brouillon',
    objet: 'Salle de bains', lieu_adresse: '4 rue des Essais', lieu_code_postal: '13410', lieu_ville: 'Lambesc', delai_execution: '3 semaines',
    retenue_garantie_centiemes: 500, remise_centiemes: 1000, remise_centimes: null, acompte_centiemes: null, acompte_centimes: 35000,
    acompte_nature: 'arrhes', validite_jours: '45', total_ht_centimes: 118710, total_tva_centimes: 15616, total_ttc_centimes: 134326,
    remise_ht_centimes: 13190, acompte_ttc_centimes: 34999, total_ttc_options_centimes: '150826', generation: 1793746523496,
    created_at: '2026-11-01T10:00:00+00:00', modifie_le: '2026-11-03T09:30:00.123456+00:00',
    client: { nom: 'Mme Essai' },
    demande: { created_at: '2026-10-29T08:00:00Z', budget: '500-1000', description: 'Refaire la salle de bains' },
    urgence: { created_at: '2026-10-30T07:00:00Z', probleme_label: 'Fuite', details: 'Sous l’évier' },
  };
  const DEVIS_ATTENDU = {
    id: 'd-1', proId: 'p-1', clientId: 'c-1', quoteRequestId: 'q-1', sosRequestId: null, source: 'demande', statut: 'brouillon',
    objet: 'Salle de bains', lieuAdresse: '4 rue des Essais', lieuCodePostal: '13410', lieuVille: 'Lambesc', delaiExecution: '3 semaines',
    retenueGarantieCentiemes: 500, remiseCentiemes: 1000, remiseCentimes: null, acompteCentiemes: null, acompteCentimes: 35000,
    acompteNature: 'arrhes', validiteJours: 45, totalHtCentimes: 118710, totalTvaCentimes: 15616, totalTtcCentimes: 134326,
    remiseHtCentimes: 13190, acompteTtcCentimes: 34999, totalTtcOptionsCentimes: 150826, generation: 1793746523496,
    createdAt: '2026-11-01T10:00:00+00:00', modifieLe: '2026-11-03T09:30:00.123456+00:00',
    client: { nom: 'Mme Essai' },
    demande: { createdAt: '2026-10-29T08:00:00Z', budget: '500-1000', texte: 'Refaire la salle de bains' },
    urgence: { createdAt: '2026-10-30T07:00:00Z', texte: 'Fuite — Sous l’évier' },
  };
  const ligneTotaux = {
    total_ht_centimes: 118710, total_tva_centimes: 15616, total_ttc_centimes: 134326, remise_ht_centimes: 13190,
    acompte_ttc_centimes: 34999, total_ttc_options_centimes: 150826, remise_centimes: null, remise_centiemes: 1000,
    acompte_centimes: 35000, acompte_centiemes: null, acompte_nature: 'arrhes', retenue_garantie_centiemes: 500,
    generation: 1793746523496, modifie_le: '2026-11-03T09:30:00.123456+00:00',
    devis_tva: [
      { taux_tva_centiemes: 1000, base_centimes: 59355, remise_centimes: 6595, tva_centimes: 5936, nb_lignes: 2 },
      { taux_tva_centiemes: 2000, base_centimes: 59355, remise_centimes: 6595, tva_centimes: 11871, nb_lignes: '3' },
      { taux_tva_centiemes: 550, base_centimes: 0, remise_centimes: 0, tva_centimes: 0, nb_lignes: 0 },
    ],
  };
  const TOTAUX_ATTENDUS = {
    ht: 118710, tva: 15616, ttc: 134326, reduction: 13190, brut: 131900, acompte: 34999, ttcOptions: 150826,
    demande: { remiseCentimes: null, remiseCentiemes: 1000, acompteCentimes: 35000, acompteCentiemes: null, acompteNature: 'arrhes',
      retenueGarantieCentiemes: 500 },
    generation: 1793746523496, modifieLe: '2026-11-03T09:30:00.123456+00:00',
    ventilation: [{ taux: 2000, base: 59355, remise: 6595, tva: 11871, nbLignes: 3 }, { taux: 1000, base: 59355, remise: 6595, tva: 5936, nbLignes: 2 }],
  };
  /* Une comparaison PROFONDE, clés triées : l'ordre des clés n'est pas une
     règle, leur liste et leurs valeurs (et leur TYPE : 45 n'est pas '45') si. */
  const trie = (x) => (Array.isArray(x) ? x.map(trie) : x && typeof x === 'object'
    ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, trie(x[k])])) : x);
  let luDevis = null; let luTotaux = null; let luVide = null;
  try {
    luDevis = D.rowToDevis(ligneDevis);
    luTotaux = D.totauxDepuisBase(ligneTotaux);
    luVide = D.totauxDepuisBase({ total_ht_centimes: null, remise_ht_centimes: 5, acompte_nature: 'inconnue' });
  } catch (e) { luDevis = { plante: String(e && e.message) }; }
  verifier('`rowToDevis` (devis.js), FAIT TOURNER sur une ligne comme PostgREST la rend : chaque colonne à SON nom, les nombres en '
    + 'nombres (« 45 » relu 45), la validité, la nature, les trois montants que la base calcule — chacun dans sa colonne —, et les '
    + 'liens de l’en-tête',
  json(trie(luDevis)) === json(trie(DEVIS_ATTENDU)) && D.rowToDevis(null) === null,
  `reçu ${json(luDevis)}`);
  verifier('`totauxDepuisBase` (devis.js), FAIT TOURNER : l’acompte EFFECTIF (pas le total toutes options comprises), la réduction, le '
    + 'brut = HT + réduction, la demande relue (une nature inconnue ne passe pas), la ventilation sans les taux à zéro, du plus fort '
    + 'au plus faible ; un HT illisible ne fabrique pas de brut',
  json(trie(luTotaux)) === json(trie(TOTAUX_ATTENDUS))
    && !!luVide && luVide.brut === null && luVide.demande.acompteNature === null && json(luVide.ventilation) === '[]',
  `reçu ${json(luTotaux)} ; vide ${json(luVide)}`);
  /* …et le `select` de chaque lecture, comparé aux colonnes que ces
     fonctions LISENT, DANS LES DEUX SENS : on les fait tourner sur une ligne
     qui NOTE chaque colonne lue. */
  const espion = (base, lues) => new Proxy(base, {
    get(cible, cle) {
      if (typeof cle === 'string') lues.add(cle);
      return cible[cle];
    },
  });
  const luesTotaux = new Set(); const luesVentilation = new Set();
  D.totauxDepuisBase(espion({ ...ligneTotaux, devis_tva: ligneTotaux.devis_tva.map((t) => espion({ ...t, nb_lignes: 1 }, luesVentilation)) }, luesTotaux));
  const API = sansCommentairesJs(lire('src/lib/api.js'));
  const argSelect = (corps) => {
    const m = /\.select\(([\s\S]*?)\)\s*\.eq\(/.exec(corps || '');
    if (!m) return null;
    return m[1].replace(/\$\{LIENS_DU_DEVIS_OUVERT\}/g, D.LIENS_DU_DEVIS_OUVERT).replace(/\$\{LIENS_DU_DEVIS\}/g, D.LIENS_DU_DEVIS)
      .replace(/['`]\s*\+\s*['`]/g, '').replace(/^\s*['`]|['`]\s*$/g, '');
  };
  /* Une liste de `select` PostgREST : `{ colonnes, liens: { nom: [colonnes] } }` ;
     `alias:colonne(…)` est rangé sous l'alias. */
  const lireSelect = (t) => {
    const res = { colonnes: [], liens: {} };
    const parts = []; let p = 0; let cur = '';
    for (const ch of t || '') {
      if (ch === '(') p += 1;
      if (ch === ')') p -= 1;
      if (ch === ',' && p === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    for (const x of parts) {
      const m = /^(?:(\w+):)?(\w+)\((.*)\)$/.exec(x);
      if (m) res.liens[m[1] || m[2]] = m[3].split(',').map((c) => c.trim()).filter(Boolean);
      else res.colonnes.push(x);
    }
    return res;
  };
  const selTotaux = lireSelect(argSelect(corpsDeFonction(API, 'relireTotauxDevisSupabase')));
  const attenduTotaux = [...selTotaux.colonnes, 'devis_tva'].sort();
  const luTotauxListe = [...luesTotaux].sort();
  verifier('`relireTotauxDevisSupabase` : son `select` porte EXACTEMENT les colonnes que `totauxDepuisBase` lit — et la ventilation '
    + 'jointe, exactement celles qu’elle en lit (une colonne oubliée au `select` serait relue `null` sur la vraie base seulement)',
  json(luTotauxListe) === json(attenduTotaux)
    && json([...luesVentilation].sort()) === json([...(selTotaux.liens.devis_tva || [])].sort()),
  `select ${json(attenduTotaux)} | lues ${json(luTotauxListe)} | ventilation select ${json(selTotaux.liens.devis_tva)} lues ${json([...luesVentilation].sort())}`);
  /* `unDevis` : `*` (toutes les colonnes de `devis`, lues dans le SCHÉMA),
     les liens de l'en-tête, la ventilation. */
  const luesDevis = new Set(); const luesLiens = { client: new Set(), demande: new Set(), urgence: new Set() };
  D.rowToDevis(espion({
    ...ligneDevis,
    client: espion({ ...ligneDevis.client }, luesLiens.client),
    demande: espion({ ...ligneDevis.demande }, luesLiens.demande),
    urgence: espion({ ...ligneDevis.urgence }, luesLiens.urgence),
  }, luesDevis));
  const selUn = lireSelect(argSelect(corpsDeFonction(API, 'unDevisSupabase')));
  const colonnesDevis = (colonnesDe('devis') || []).map((c) => c.nom).sort();
  const luesColonnes = [...luesDevis].filter((c) => !['client', 'demande', 'urgence'].includes(c)).sort();
  const liensFaux = ['client', 'demande', 'urgence'].filter((l) => json([...luesLiens[l]].sort()) !== json([...(selUn.liens[l] || [])].sort()));
  const luesVentilationUn = new Set();
  D.totauxDepuisBase({ devis_tva: ligneTotaux.devis_tva.map((t) => espion({ ...t, nb_lignes: 1 }, luesVentilationUn)) });
  verifier('`unDevisSupabase` : `*` — `rowToDevis` lit CHACUNE des colonnes de `devis` du schéma, et aucune autre ; chaque lien '
    + '(client, demande, urgence) est lu exactement comme il est joint ; la ventilation jointe est celle que `totauxDepuisBase` lit',
  json(selUn.colonnes) === json(['*']) && colonnesDevis.length >= 28 && json(luesColonnes) === json(colonnesDevis)
    && liensFaux.length === 0 && 'devis_lignes' in selUn.liens
    && json([...luesVentilationUn].sort()) === json([...(selUn.liens.devis_tva || [])].sort()),
  `lues ${json(luesColonnes)} | schéma ${json(colonnesDevis)} | liens faux ${json(liensFaux)}`);
  /* …et `api.js` ne les définit plus : il les IMPORTE de `devis.js` (une
     seule écriture), et sa propre lecture des nombres est la même. */
  const defNombre = (src) => sansEspaces((/\bconst\s+nombreOuNul\s*=\s*([^;]+);/.exec(src) || [])[1] || '');
  verifier('…`api.js` ne définit plus ni `rowToDevis` ni `totauxDepuisBase` : il les importe de `devis.js` et s’en sert pour relire '
    + 'les totaux et le devis ouvert ; ses nombres se lisent comme ceux de `devis.js`',
  !/\bfunction\s+(rowToDevis|totauxDepuisBase)\b/.test(API)
    && /import\s*\{[^}]*\browToDevis\b[^}]*\btotauxDepuisBase\b[^}]*\}\s*from\s*'\.\/devis'/.test(API)
    && /return data \? totauxDepuisBase\(data\) : null;/.test(corpsDeFonction(API, 'relireTotauxDevisSupabase') || '')
    && /devis: rowToDevis\(devis\),/.test(corpsDeFonction(API, 'unDevisSupabase') || '')
    && defNombre(API) !== '' && defNombre(API) === defNombre(sansCommentairesJs(lire('src/lib/devis.js'))));

  /* d. UN REFUS DE CONTRAINTE EST DÉFINITIF (point transmis par les groupes
        BASE et ÉCRAN, mesuré) : retirer la réduction d'un devis près du
        plafond est refusé par `devis_plafond_check` — la bande proposait
        « Réessayer », qui échouait à l'identique. Fait tourner par la VRAIE
        file et la base de démonstration, puis sous la forme de PostgREST pour
        chacune des dix-sept contraintes du devis ; une coupure, un délai, un
        interblocage et une écriture dépassée, eux, se réessaient. */
  const baseP = DEMO.creerBaseDevisDemo({ demandeDe: () => null });
  const IDP = (k) => `de0000ee-0000-4000-8000-0000000036${String(k).padStart(2, '0')}`;
  const fileP = F.creerFileEcriture({
    devisId: IDP(1), devis: { objet: 'Plafond', source: 'manuelle', remiseCentiemes: 5000 }, devisEnBase: false,
    ecrire: (op) => baseP.ecrire('1', op), relireUn: (q) => baseP.relireUn('1', q),
    relireTotaux: (id) => baseP.relireTotaux('1', id), avecDelai: ERR.avecDelai, nouvelIdentifiant: I.nouvelIdentifiant,
  });
  /* 90 000 000,00 € HT à 20 % : avec 50 %, 54 000 000,00 € TTC ; sans, 108 000 000,00 € — au-delà du plafond. */
  fileP.ligne({ id: IDP(11), ordre: 1000, type: 'poste', designation: 'Gros œuvre', quantiteMilliemes: 1000, unite: 'forfait',
    prixUnitaireCentimes: 9000000000, tauxTvaCentiemes: 2000 });
  await fileP.attendre(5000);
  fileP.devis({ remiseCentiemes: null });
  await fileP.attendre(5000);
  const refusP = fileP.erreurDe('devis');
  fileP.reessayer('devis');
  await fileP.attendre(5000);
  const encoreP = fileP.erreurDe('devis');
  const pgDe = (nom) => ({ code: '23514', message: `new row for relation "devis" violates check constraint "${nom}"`, details: 'Failing row contains (…)', hint: null });
  const pasDefinitifs = D.CONTRAINTES_DEVIS.filter((nom) => !ERR.estUnRefusDefinitif(pgDe(nom)));
  const reessayables = [{ message: 'Network request failed' }, { code: '57014' }, { code: '40P01' }, { code: 'OP015' }, { code: 'PGRST116' }, null]
    .filter((e) => ERR.estUnRefusDefinitif(e));
  verifier('retirer la réduction d’un devis près du plafond : refus 23514 `devis_plafond_check` par la vraie file, et ce refus est '
    + 'DÉFINITIF (« Réessayer » échouerait à l’identique — vérifié) ; les dix-sept contraintes du devis, sous la forme de PostgREST, '
    + 'aussi ; une coupure, un délai, un interblocage, une écriture dépassée restent réessayables',
  fileP.etatDe('devis') === 'echec' && !!refusP && refusP.code === '23514' && /"devis_plafond_check"/.test(refusP.message || '')
    && ERR.estUnRefusDefinitif(refusP) === true && !!encoreP && encoreP.code === '23514'
    && D.CONTRAINTES_DEVIS.length === 17 && pasDefinitifs.length === 0 && reessayables.length === 0,
  `refus ${refusP && refusP.code} ; non définitifs : ${pasDefinitifs.join(', ') || '—'} ; réessayables pris pour définitifs : ${reessayables.length}`);
  /* …la PHRASE de ce refus, ENTIÈRE, des deux côtés : l'en-tête nomme la
     réduction (seul chemin de l'en-tête vers ce plafond, BASE-4), la phrase
     commune parle de « ce changement » (pas « de cette ligne »). Depuis la
     reprise « écran » (point 3), la phrase COMMUNE ne dit plus qu'il y a « un
     zéro de trop dans une ligne » — faux pour la réduction : c'est le repli,
     vrai partout ; chaque chemin a la sienne (section 37). */
  const PHRASE_PLAFOND = 'ce devis dépasserait 99\u00a0999\u00a0999,99\u00a0€, la plus grande somme qu’un devis peut '
    + 'porter. Ce changement n’a pas été enregistré.';
  verifier('…la phrase de ce refus, ENTIÈRE : « La réduction n’a pas pu être changée. » puis celle de `devis_plafond_check` (« ce '
    + 'changement », jamais « cette ligne ») ; et l’écran (la bande, la carte) ne propose « Réessayer » que pour un refus qui n’est '
    + 'PAS définitif',
  D.phraseEchecDuDevis({ enBase: true, erreur: refusP }) === 'La réduction n’a pas pu être changée.'
    && ERR.MESSAGES_CONTRAINTE.devis_plafond_check === PHRASE_PLAFOND
    && ERR.messageClair(refusP, '') === `${PHRASE_PLAFOND.charAt(0).toUpperCase()}${PHRASE_PLAFOND.slice(1)}`
    && /\{!estUnRefusDefinitif\(attente\.devisErreur\) && \(\s*<BtnOutline label="Réessayer"/.test(ECR.saisie)
    && /reessayable: !!attente\.devisErreur && !estUnRefusDefinitif\(attente\.devisErreur\)/.test(ECR.saisie),
  `${D.phraseEchecDuDevis({ enBase: true, erreur: refusP })} | ${ERR.messageClair(refusP, '')}`);
}

console.log('\n  37. le lot 2a — la reprise « écran » : le refus définitif d’une ligne, le plafond renvoyé, une phrase par chemin, FAITS TOURNER');
{
  const pg = (nom, ou = 'message') => {
    const e = { code: '23514', message: 'new row for relation "devis" violates check constraint', details: null, hint: null };
    if (ou === 'message') e.message = `new row for relation "devis" violates check constraint "${nom}"`;
    if (ou === 'details') e.details = `Failing row contains (…) — "${nom}"`;
    if (ou === 'constraint') e.constraint = nom;
    return e;
  };

  /* a. UNE PHRASE PAR CHEMIN (point 3) — écrites ICI en toutes lettres : la
        ligne (un zéro de trop dans SA quantité ou SON prix), l'option (le
        total options comprises), l'en-tête (c'est la réduction d'avant qui
        tenait le devis : aucun « zéro de trop dans une ligne » n'est la cause
        de ce geste). */
  const ATTENDUES = {
    ligne: 'Avec cette ligne, le devis dépasserait 99\u00a0999\u00a0999,99\u00a0€, la plus grande somme qu’un devis peut porter : il y a '
      + 'sans doute un zéro de trop dans sa quantité ou son prix. Si le zéro de trop est dans une autre ligne, corrigez celle-là : '
      + 'Opus renverra alors celle-ci tout seul.',
    option: 'Avec cette option, le devis, options comprises, dépasserait 99\u00a0999\u00a0999,99\u00a0€, la plus grande somme qu’un '
      + 'devis peut porter : il y a sans doute un zéro de trop dans sa quantité ou son prix. Si le zéro de trop est dans une '
      + 'ligne, corrigez-la : Opus renverra alors cette option tout seul.',
    entete: 'Avec ce changement, le devis dépasserait 99\u00a0999\u00a0999,99\u00a0€, la plus grande somme qu’un devis peut porter : '
      + 'c’est la réduction d’avant qui le tenait en dessous. Remettez-la, ou baissez d’abord la ligne trop chère — il y a sans '
      + 'doute un zéro de trop : Opus renverra alors ce changement tout seul.',
  };
  const formes = [pg('devis_plafond_check'), pg('devis_plafond_check', 'details'), pg('devis_plafond_check', 'constraint')];
  const parChemin = ['ligne', 'option', 'entete'].filter((c) => formes.every((e) => ERR.messageDEcritureDuDevis(e, c) === ATTENDUES[c]));
  verifier('une phrase par CHEMIN pour le plafond — la ligne, l’option, l’en-tête —, écrites en toutes lettres, sous les trois formes '
    + 'de PostgREST (le nom dans le message, le détail, `constraint`) ; l’en-tête ne dit pas qu’« un zéro de trop dans une '
    + 'ligne » a causé le refus — il nomme la réduction d’avant —, et l’option nomme le total « options comprises »',
  json(Object.keys(ERR.PHRASES_DU_PLAFOND).sort()) === json(['entete', 'ligne', 'option']) && parChemin.length === 3
    && json(ERR.PHRASES_DU_PLAFOND) === json(ATTENDUES)
    && !/dans une ligne/.test(ATTENDUES.entete) && /réduction d’avant/.test(ATTENDUES.entete)
    && /options comprises/.test(ATTENDUES.option) && !/options comprises/.test(ATTENDUES.ligne),
  `chemins justes : ${parChemin.join(', ')}`);
  /* …et TOUT LE RESTE garde sa phrase : un autre 23514, une coupure, un
     délai, un code maison, rien du tout — et un chemin inconnu retombe sur
     `messageClair`, jamais sur la phrase d'un autre chemin. Le repli de
     `devis_plafond_check` ne parle d'aucune ligne. */
  const autres = [pg('devis_remise_check'), { message: 'Network request failed' }, { code: '57014', message: 'canceling statement' },
    { code: 'OP015', message: 'Cette écriture est plus ancienne…' }, null, { code: '40P01' }];
  const restes = autres.flatMap((e) => ['ligne', 'option', 'entete'].filter((c) => ERR.messageDEcritureDuDevis(e, c) !== ERR.messageClair(e, '')));
  verifier('…tout ce qui n’est pas le plafond garde la phrase de `messageClair`, sur les trois chemins ; un chemin inconnu aussi ; et la '
    + 'phrase de REPLI du plafond ne désigne aucune ligne (« un zéro de trop dans une ligne » était faux pour la réduction)',
  restes.length === 0 && ERR.messageDEcritureDuDevis(pg('devis_plafond_check'), 'inconnu') === ERR.messageClair(pg('devis_plafond_check'), '')
    && !/ligne|zéro de trop/.test(ERR.MESSAGES_CONTRAINTE.devis_plafond_check), json(restes));

  /* b. LES DEUX LECTURES DU MÊME REFUS S'ACCORDENT : `devis.js` décide de le
        renvoyer (`estUnRefusDuPlafond`), `erreurs.js` en choisit la phrase.
        Deux écritures d'une règle, tenues ensemble ici, sur les mêmes
        erreurs — y compris celles de la démonstration, fabriquées par la
        VRAIE file. */
  const baseA = DEMO.creerBaseDevisDemo({ demandeDe: () => null });
  const IDA = (k) => `de0000ee-0000-4000-8000-0000000037${String(k).padStart(2, '0')}`;
  const fileA = F.creerFileEcriture({
    devisId: IDA(1), devis: { objet: 'Plafond', source: 'manuelle', remiseCentiemes: 5000 }, devisEnBase: false,
    ecrire: (op) => baseA.ecrire('1', op), relireUn: (q) => baseA.relireUn('1', q),
    relireTotaux: (id) => baseA.relireTotaux('1', id), avecDelai: ERR.avecDelai, nouvelIdentifiant: I.nouvelIdentifiant,
  });
  fileA.ligne({ id: IDA(11), ordre: 1000, type: 'poste', designation: 'Gros œuvre', quantiteMilliemes: 1000, unite: 'forfait',
    prixUnitaireCentimes: 9000000000, tauxTvaCentiemes: 2000 });
  await fileA.attendre(5000);
  fileA.ligne({ id: IDA(12), ordre: 2000, type: 'poste', designation: 'Zéro de trop', quantiteMilliemes: 1000, unite: 'forfait',
    prixUnitaireCentimes: 9999999999, tauxTvaCentiemes: 2000 });
  await fileA.attendre(5000);
  const refusDemo = fileA.erreurDe(IDA(12));
  const essais = [...formes, refusDemo, ...autres, pg('devis_plafond_check_x'), { code: '23505', message: '"devis_plafond_check"' }];
  const desaccords = essais.filter((e) => D.estUnRefusDuPlafond(e) !== (ERR.messageDEcritureDuDevis(e, 'ligne') === ATTENDUES.ligne));
  verifier('`estUnRefusDuPlafond` (devis.js) et la phrase d’`erreurs.js` reconnaissent EXACTEMENT les mêmes refus — sous les trois formes '
    + 'de PostgREST, celle de la démonstration (une ligne refusée par la vraie file), et pas un autre 23514, ni une autre contrainte qui '
    + 'commence pareil, ni un autre code',
  desaccords.length === 0 && !!refusDemo && D.estUnRefusDuPlafond(refusDemo) && ERR.estUnRefusDefinitif(refusDemo)
    && formes.every((e) => D.estUnRefusDuPlafond(e)) && !D.estUnRefusDuPlafond(pg('devis_plafond_check_x')),
  `${desaccords.length} désaccord(s)`);

  /* c. LA RANGÉE D'UNE LIGNE REFUSÉE (point 1) : `refusDeLaLigne` décide de
        ce qui est refusé — la LIGNE (le devis est en base : « La corriger »),
        le BROUILLON (sa création a été refusée, la ligne l'attend : rien à
        corriger en elle) —, et rien pour un échec qui se réessaie ;
        `proprietesDeLaRangee` ne le rend que pour une rangée EN ÉCHEC. */
  const r = D.refusDeLaLigne;
  const lg = { id: 'x', type: 'poste', designation: 'x', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 100, tauxTvaCentiemes: 2000 };
  const pr = (etat, def) => D.proprietesDeLaRangee(lg, { etats: { x: etat }, phrasesEchec: { x: 'p' }, definitifs: { x: def } }).definitif;
  verifier('`refusDeLaLigne` : un refus définitif d’une ligne d’un devis en base → « ligne » ; d’une ligne qui attend un brouillon refusé → '
    + '« brouillon » ; un échec qui se réessaie → rien ; et la rangée ne porte ce refus QUE si elle est en échec — jamais une autre valeur',
  r({ definitif: true, devisEnBase: true }) === 'ligne' && r({ definitif: true, devisEnBase: false }) === 'brouillon'
    && r({ definitif: false, devisEnBase: true }) === null && r({ definitif: false, devisEnBase: false }) === null && r() === null
    && pr('echec', 'ligne') === 'ligne' && pr('echec', 'brouillon') === 'brouillon' && pr('echec', 'autre') === null
    && pr('enregistree', 'ligne') === null && pr('en_cours', 'ligne') === null && pr('echec', undefined) === null
    && D.PROPRIETES_DE_LA_RANGEE.includes('definitif'));
  /* …et la ligne refusée, INCHANGÉE, ne repart pas (fermer sa carte la
     renvoyait telle quelle, refusée pareil — mesuré au navigateur) ;
     changée — un seul champ —, elle part ; un échec qui se réessaie part. */
  const rv = D.renvoyerLaLigne;
  const changees = D.CHAMPS_LIGNE.filter((c) => !rv({ valeurs: { ...lg, [c]: c === 'designation' ? 'y' : (c === 'type' ? 'option' : 7) }, derniere: lg, etat: 'echec', refus: 'ligne' }));
  verifier('`renvoyerLaLigne` : une ligne refusée définitivement et INCHANGÉE ne repart pas (« ligne » comme « brouillon ») ; un seul champ '
    + 'changé — chacun des douze —, elle repart ; un échec qui se réessaie, une ligne enregistrée, une ligne sans dernière écriture '
    + 'connue repartent ; l’identifiant et le devis ne comptent pas',
  rv({ valeurs: { ...lg }, derniere: lg, etat: 'echec', refus: 'ligne' }) === false
    && rv({ valeurs: { ...lg, id: 'autre', devisId: 'd' }, derniere: lg, etat: 'echec', refus: 'brouillon' }) === false
    && changees.length === 0 && D.CHAMPS_LIGNE.length === 12
    && rv({ valeurs: lg, derniere: lg, etat: 'echec', refus: null }) === true
    && rv({ valeurs: lg, derniere: lg, etat: 'enregistree', refus: 'ligne' }) === true
    && rv({ valeurs: lg, derniere: null, etat: 'echec', refus: 'ligne' }) === true,
  `champs qui ne font pas repartir : ${changees.join(', ') || '—'}`);

  /* d. LE PLAFOND RENVOYÉ (point 2), par la VRAIE file et la base de
        démonstration, avec l'écoute que pose la saisie : à l'événement
        `totaux`, `rejouerLesRefusDuPlafond`. On COMPTE les écritures. */
  const monter = (ecrireAussi = null) => {
    const base = DEMO.creerBaseDevisDemo({ demandeDe: () => null });
    const etat = { n: 0, rejoues: [] };
    const file = F.creerFileEcriture({
      devisId: IDA(1), devis: { objet: 'Plafond', source: 'manuelle', remiseCentiemes: 5000 }, devisEnBase: false,
      ecrire: (op) => { etat.n += 1; return ecrireAussi ? ecrireAussi(op, () => base.ecrire('1', op)) : base.ecrire('1', op); },
      relireUn: (q) => base.relireUn('1', q), relireTotaux: (id) => base.relireTotaux('1', id),
      avecDelai: ERR.avecDelai, nouvelIdentifiant: I.nouvelIdentifiant,
    });
    file.abonner((ev) => {
      if (ev.type === 'totaux') Promise.resolve().then(() => etat.rejoues.push(...D.rejouerLesRefusDuPlafond(file)));
    });
    return { base, file, etat };
  };
  const auRepos = async (f) => { for (let k = 0; k < 6; k += 1) { await f.attendre(5000); await new Promise((ok) => { setTimeout(ok, 10); }); } };
  const GROS = { id: IDA(11), ordre: 1000, type: 'poste', designation: 'Gros œuvre', quantiteMilliemes: 1000, unite: 'forfait',
    prixUnitaireCentimes: 9000000000, tauxTvaCentiemes: 2000 };
  const remiseEnBase = async (b) => (await b.relireUn('1', { quoi: 'devis', id: IDA(1) })).remiseCentiemes;
  {
    const { base, file, etat } = monter();
    file.ligne(GROS); await auRepos(file);
    file.devis({ remiseCentiemes: null }); await auRepos(file);
    const refuse = file.etatDe('devis') === 'echec' && D.estUnRefusDuPlafond(file.erreurDe('devis'));
    const n0 = etat.n;
    file.ligne({ ...GROS, prixUnitaireCentimes: 8500000000 }); await auRepos(file);
    const pasAssez = { ecritures: etat.n - n0, rejoues: etat.rejoues.length, entete: file.etatDe('devis'), remise: await remiseEnBase(base) };
    const n1 = etat.n;
    file.ligne({ ...GROS, prixUnitaireCentimes: 100000 }); await auRepos(file);
    const assez = { ecritures: etat.n - n1, rejoues: [...etat.rejoues], entete: file.etatDe('devis'), remise: await remiseEnBase(base) };
    verifier('l’en-tête refusé par le plafond (la réduction retirée) : la ligne baissée PAS ASSEZ (85 000 000,00 €) → rien n’est renvoyé '
      + '(une écriture, la ligne) ; baissée ASSEZ → l’en-tête repart TOUT SEUL, une fois, et passe : la base n’a plus de réduction, '
      + 'comme l’écran',
    refuse && pasAssez.ecritures === 1 && pasAssez.rejoues === 0 && pasAssez.entete === 'echec' && pasAssez.remise === 5000
      && assez.ecritures === 2 && json(assez.rejoues) === json(['devis']) && assez.entete === 'enregistree' && assez.remise === null,
    `${json(pasAssez)} | ${json(assez)}`);
  }
  {
    /* Une LIGNE refusée, puis une AUTRE baissée : la refusée repart ; une
       OPTION refusée (le total options comprises), pareil. */
    const { base, file, etat } = monter();
    /* 80 000 000,00 € à 50 % : TTC 48 000 000,00 €. L'option (45 000 000,00 €)
       ferait 102 000 000,00 € options comprises ; la ligne (30 000 000,00 €),
       un HT avant réduction de 110 000 000,00 €. Le gros poste ramené à
       1 000,00 € : 18 000 000,00 € TTC, 72 000 000,00 € options comprises —
       les DEUX tiennent ENSEMBLE (le calcul est fait sur tout le devis voulu,
       jamais sur un morceau). */
    file.ligne({ ...GROS, prixUnitaireCentimes: 8000000000 }); await auRepos(file);
    const TROP = { id: IDA(12), ordre: 2000, type: 'poste', designation: 'Trop', quantiteMilliemes: 1000, unite: 'forfait',
      prixUnitaireCentimes: 3000000000, tauxTvaCentiemes: 2000 };
    const OPT = { id: IDA(13), ordre: 3000, type: 'option', designation: 'Option', quantiteMilliemes: 1000, unite: 'forfait',
      prixUnitaireCentimes: 4500000000, tauxTvaCentiemes: 2000 };
    file.ligne(OPT); await auRepos(file);
    file.ligne(TROP); await auRepos(file);
    const refusees = [IDA(12), IDA(13)].filter((k) => file.etatDe(k) === 'echec' && D.estUnRefusDuPlafond(file.erreurDe(k)));
    file.ligne({ ...GROS, prixUnitaireCentimes: 100000 }); await auRepos(file);
    const enBase = await Promise.all([IDA(12), IDA(13)].map((k) => base.relireUn('1', { quoi: 'ligne', id: k })));
    verifier('une LIGNE et une OPTION refusées par le plafond repartent toutes seules quand une AUTRE ligne baisse assez — et passent',
      refusees.length === 2 && file.etatDe(IDA(12)) === 'enregistree' && file.etatDe(IDA(13)) === 'enregistree'
      && enBase.every(Boolean) && json([...etat.rejoues].sort()) === json([IDA(12), IDA(13)].sort()),
    `${refusees.length} refusée(s) ; ${file.etatDe(IDA(12))} / ${file.etatDe(IDA(13))} ; rejouées ${json(etat.rejoues)}`);
  }
  {
    /* PAS DE BOUCLE : une base qui refuse l'en-tête quoi que dise le calcul.
       Le renvoi part UNE fois après la ligne enregistrée, il échoue, et rien
       ne repart — un refus 23514 ne fait pas relire les totaux. */
    let tetue = false;
    const { file, etat } = monter((op, normal) => {
      if (tetue && op.quoi === 'devis') {
        const e = new Error('new row for relation "devis" violates check constraint "devis_plafond_check"');
        e.code = '23514';
        return Promise.reject(e);
      }
      return normal();
    });
    file.ligne(GROS); await auRepos(file);
    tetue = true;
    file.devis({ remiseCentiemes: null }); await auRepos(file);
    const n0 = etat.n;
    file.ligne({ ...GROS, prixUnitaireCentimes: 100000 }); await auRepos(file);
    await new Promise((ok) => { setTimeout(ok, 200); }); await auRepos(file);
    verifier('pas de boucle : une base qui refuse encore → UN renvoi après la ligne enregistrée, puis plus rien (deux écritures en tout) ; '
      + 'l’en-tête reste en échec, et son refus reste définitif',
    etat.n - n0 === 2 && etat.rejoues.length === 1 && file.etatDe('devis') === 'echec' && ERR.estUnRefusDefinitif(file.erreurDe('devis')),
    `écritures ${etat.n - n0}, renvois ${etat.rejoues.length}`);
  }
  {
    /* RETIRER UNE LIGNE REFUSÉE n'écrit rien (elle n'a jamais été en base) :
       la saisie regarde quand même — sinon la réduction refusée à cause du
       devis VOULU (avec cette ligne) le restait. Ici : la ligne baissée ne
       suffit pas, parce que la ligne refusée est encore voulue ; retirée,
       l'en-tête repart. */
    const { base, file, etat } = monter();
    file.ligne(GROS); await auRepos(file);
    const ENORME = { id: IDA(14), ordre: 2000, type: 'poste', designation: 'Énorme', quantiteMilliemes: 1000, unite: 'forfait',
      prixUnitaireCentimes: 9900000000, tauxTvaCentiemes: 2000 };
    file.ligne(ENORME); await auRepos(file);
    file.devis({ remiseCentiemes: null }); await auRepos(file);
    file.ligne({ ...GROS, prixUnitaireCentimes: 100000 }); await auRepos(file);
    const avant = { rejoues: etat.rejoues.length, entete: file.etatDe('devis') };
    file.retirerLigne(IDA(14));
    const renvoyes = D.rejouerLesRefusDuPlafond(file);
    await auRepos(file);
    verifier('une ligne refusée ENCORE VOULUE retient l’en-tête (le devis voulu dépasserait) ; RETIRÉE — sans aucune écriture —, '
      + 'l’appel que fait la saisie renvoie l’en-tête, qui passe',
    avant.rejoues === 0 && avant.entete === 'echec' && json(renvoyes) === json(['devis']) && file.etatDe('devis') === 'enregistree'
      && (await remiseEnBase(base)) === null && file.etatDe(IDA(14)) === null, `${json(avant)} ; renvoyés ${json(renvoyes)}`);
  }
  /* `clesARejouerApresLePlafond` ne prend que des refus du PLAFOND en échec,
     jamais une ligne retirée, ni locale dans le calcul — et rien si le devis
     voulu ne tiendrait pas. */
  const E = (cle, etat, erreur, voulu, x = {}) => ({ cle, etat, erreur, voulu, retire: false, locale: false, ...x });
  const PLAF = pg('devis_plafond_check');
  const petit = { ...lg, id: 'p', prixUnitaireCentimes: 100 };
  const grosV = { ...lg, id: 'g', prixUnitaireCentimes: 9999999999 };
  const cas = [
    [[E('devis', 'echec', PLAF, {}), E('p', 'enregistree', null, petit)], ['devis']],
    [[E('devis', 'echec', PLAF, {}), E('g', 'enregistree', null, grosV)], []],
    [[E('devis', 'echec', pg('devis_remise_check'), {}), E('p', 'enregistree', null, petit)], []],
    [[E('devis', 'echec', { message: 'Network request failed' }, {}), E('p', 'enregistree', null, petit)], []],
    [[E('devis', 'enregistree', null, {}), E('g', 'echec', PLAF, grosV, { retire: true })], []],
    [[E('devis', 'enregistree', null, {}), E('p', 'echec', PLAF, petit), E('g', 'locale', null, { ...grosV, quantiteMilliemes: null }, { locale: true })], ['p']],
    [[E('devis', 'enregistree', null, {}), E('p', 'echec', PLAF, petit), E('g', 'enregistree', null, grosV, { retire: true })], ['p']],
  ];
  const fautes = cas.filter(([entrees, attendu]) => json(D.clesARejouerApresLePlafond(entrees)) !== json(attendu));
  verifier('`clesARejouerApresLePlafond` : seulement des refus du PLAFOND en échec ; rien si le devis voulu ne tiendrait pas ; une '
    + 'ligne retirée ou locale ne compte pas dans le calcul ; un autre refus, une coupure, ne se renvoient pas ici',
  fautes.length === 0, fautes.map(([, a]) => json(a)).join(' | '));

  /* e. CE QUE L'ÉCRAN FAIT DE TOUT CELA — lu dans la saisie, sans ses
        commentaires. Chaque appel est cherché DANS sa fonction. */
  const S = ECR.saisie;
  const etatRangee = corpsDeFonction(S, 'EtatDeLaRangee') || '';
  const bloc = (src, debut) => {
    const i = src.indexOf(debut);
    if (i < 0) return '';
    let p = 0;
    for (let j = i + debut.length - 1; j < src.length; j += 1) {
      if (src[j] === '(') p += 1;
      else if (src[j] === ')') { p -= 1; if (p === 0) return src.slice(i, j + 1); }
    }
    return '';
  };
  const brancheLigne = bloc(etatRangee, "{definitif === 'ligne' && (");
  const brancheBrouillon = (etatRangee.match(/\{definitif === 'brouillon' && <Text[^>]*>[^<]*<\/Text>\}/) || [])[0] || '';
  const brancheReessai = bloc(etatRangee, '{!definitif && (');
  verifier('la rangée (`EtatDeLaRangee`) : « Réessayer » et `onReessayer` n’existent QUE sous `!definitif` ; « Non enregistrée — La '
    + 'corriger » ouvre la CARTE (`onOuvrir(id)`) sous `definitif === \'ligne\'` ; un brouillon refusé ne propose AUCUN geste',
  /Non enregistrée — Réessayer/.test(brancheReessai) && /onPress=\{\(\) => onReessayer\(id\)\}/.test(brancheReessai)
    /* TOUS les « Réessayer » et TOUS les `onReessayer` du corps vivent dans cette branche — pas un de plus ailleurs. */
    && (etatRangee.match(/onReessayer/g) || []).length === (brancheReessai.match(/onReessayer/g) || []).length
    && (etatRangee.match(/Réessayer/g) || []).length === (brancheReessai.match(/Réessayer/g) || []).length
    && (brancheReessai.match(/Réessayer/g) || []).length === 2
    && /Non enregistrée — La corriger/.test(brancheLigne) && /onPress=\{\(\) => onOuvrir\(id\)\}/.test(brancheLigne)
    && !/onReessayer|Réessayer/.test(brancheLigne) && !!brancheBrouillon && !/onPress|Réessayer|corriger/i.test(brancheBrouillon));
  const rangee = (S.match(/const RangeeLigne = React\.memo\(function RangeeLigne\([\s\S]*?\n\}\);/) || [])[0] || '';
  const basDuDevis = corpsDeFonction(S, 'BasDuDevis') || '';
  const rendusEtat = balises(S, 'EtatDeLaRangee');
  verifier('…la rangée d’une LIGNE et celle d’une OPTION passent toutes deux par `EtatDeLaRangee`, avec leur `definitif` ; l’option '
    + 'reçoit l’état que `proprietesDeLaRangee` rend avec les mêmes `definitifs` (une option refusée ne disait RIEN)',
  rendusEtat.length === 2 && balises(rangee, 'EtatDeLaRangee').length === 1 && /definitif=\{definitif\}/.test(balises(rangee, 'EtatDeLaRangee')[0] || '')
    && balises(basDuDevis, 'EtatDeLaRangee').length === 1 && /definitif=\{e\.definitif\}/.test(balises(basDuDevis, 'EtatDeLaRangee')[0] || '')
    && /const e = etatDeLOption\(o\);/.test(basDuDevis)
    && /etatDeLOption=\{\(o\) => proprietesDeLaRangee\(o, \{ etats, erreurs, phrasesEchec, definitifs \}\)\}/.test(S)
    && !/Réessayer|onReessayer\(/.test(rangee));
  const ecouter = corpsFleche(S, 'const ecouter = (ev) =>');
  const brancheEtat = (ecouter.match(/if \(ev\.type === 'etat'\) \{[\s\S]*?\n {6}\} else if \(ev\.type === 'totaux'\)/) || [])[0] || '';
  const brancheTotaux = (ecouter.match(/\} else if \(ev\.type === 'totaux'\) \{[\s\S]*?\n {6}\} else if/) || [])[0] || '';
  const brancheSupprimee = (ecouter.match(/\} else if \(ev\.type === 'supprimee' && ev\.cle !== 'devis'\) \{[\s\S]*?\n {6}\}/) || [])[0] || '';
  verifier('…l’écoute de la file : la phrase d’un échec vient de `messageDEcritureDuDevis` AVEC SON CHEMIN (`cheminDeLEcriture`), jamais de '
    + '`messageClair` seul ; ce qui est refusé définitivement est posé par `refusDeLaLigne` sur `estUnRefusDefinitif` et le brouillon '
    + 'en base ; à `totaux`, le plafond est renvoyé (`rejouerLePlafond` → `rejouerLesRefusDuPlafond`) ; une ligne que la file ne '
    + 'connaît plus perd son état, sa phrase et son refus (le pied comptait « 2 lignes non enregistrées » pour des lignes retirées)',
  /const chemin = cheminDeLEcriture\(ev\.cle, ligne\);/.test(brancheEtat)
    && /y\[ev\.cle\] = messageDEcritureDuDevis\(ev\.erreur, chemin\)/.test(brancheEtat) && !/messageClair\(ev\.erreur/.test(ecouter)
    /* …et cet appel est le PREMIER du bloc qui ne vaut que pour une ligne (S25 du banc : sous `if (false)`, l'appel
       restait écrit, et le contrôle passait). */
    && /if \(ev\.cle !== 'devis'\) \{\s*poserDefinitif\(ev\.cle, ev\.etat === 'echec' \? refusDeLaLigne\(\{\s*definitif: estUnRefusDefinitif\(ev\.erreur\), devisEnBase: !!\(fileRef\.current && fileRef\.current\.devisEnBase\(\)\),\s*\}\) : null\);\s*\}/.test(brancheEtat)
    && (brancheEtat.match(/poserDefinitif\(/g) || []).length === 1
    && /rejouerLePlafond\(\)/.test(brancheTotaux)
    && /const f = fileRef\.current;\s*rejouerLesRefusDuPlafond\(f\)/.test(corpsFleche(S, 'const rejouerLePlafond = () =>'))
    && /setEtats\(sans\);/.test(brancheSupprimee) && /setPhrasesEchec\(sans\);/.test(brancheSupprimee) && /poserDefinitif\(ev\.cle, null\);/.test(brancheSupprimee));
  const enregistrer = corpsFleche(S, 'const enregistrerLigne = (valeurs, erreursSaisie = {}) =>');
  const iRenvoi = enregistrer.indexOf('renvoyerLaLigne(');
  const iEnvoi = enregistrer.indexOf('f.ligne(valeurs);');
  const retirerC = corpsFleche(S, 'const retirer = (avecLignes) =>');
  verifier('…`enregistrerLigne` demande `renvoyerLaLigne` (la dernière écriture, l’état de la file, ce qui est refusé) AVANT d’envoyer, et '
    + 'n’envoie pas sinon ; `retirer` regarde le plafond (retirer une ligne refusée n’écrit rien, donc ne relit aucun total)',
  iRenvoi > 0 && iEnvoi > iRenvoi && /if \(!renvoyerLaLigne\(\{\s*valeurs, derniere: derniereEnvoyee\.current\[valeurs\.id\], etat: f\.etatDe\(valeurs\.id\), refus: definitifsRef\.current\[valeurs\.id\],\s*\}\)\) return false;/.test(enregistrer)
    && (enregistrer.match(/f\.ligne\(/g) || []).length === 1 && /rejouerLePlafond\(\);\s*\}$/.test(retirerC.trim()));
  verifier('…la bande du bas et la ligne d’état de la carte « Conditions » disent l’en-tête par `messageDEcritureDuDevis(…, \'entete\')` — '
    + 'plus aucun `messageClair(attente.devisErreur` —, et la carte d’une ligne reçoit son échec (`echec`), qu’elle affiche sans aucun '
    + '« Réessayer »',
  (S.match(/messageDEcritureDuDevis\(attente\.devisErreur, 'entete'\)/g) || []).length === 2 && !/messageClair\(attente\.devisErreur/.test(S)
    && /echec=\{etats\[ligneOuverte\.id\] === 'echec'\s*\? \(phrasesEchec\[ligneOuverte\.id\] \|\| '[^']+'\) : null\}/.test(balises(S, 'CarteLigne')[0] || '')
    && /\{!!echec && \(\s*<Text style=\{s\.echec\}[^>]*>\s*<Text style=\{s\.echecMot\}>Non enregistrée\. <\/Text>\s*\{echec\}\s*<\/Text>\s*\)\}/.test(ECR.carte)
    && !/Réessayer/.test(ECR.carte));

  /* f. LA RÉOUVERTURE : une saisie rouverte sur une file qui avait encore de
        quoi écrire y retrouve ses échecs — et `echecsDeLaFile` en refait les
        phrases et les refus, fait tourner sur la VRAIE file (une ligne et une
        option refusées par le plafond, une ligne coupée du réseau). */
  {
    let coupee = false;
    const { file } = monter((op, normal) => {
      if (coupee && op.quoi === 'ligne' && op.id === IDA(16)) return Promise.reject(new Error('Network request failed'));
      return normal();
    });
    file.ligne(GROS); await auRepos(file);
    file.ligne({ id: IDA(15), ordre: 2000, type: 'poste', designation: 'Trop', quantiteMilliemes: 1000, unite: 'forfait',
      prixUnitaireCentimes: 9999999999, tauxTvaCentiemes: 2000 });
    file.ligne({ id: IDA(17), ordre: 3000, type: 'option', designation: 'Option', quantiteMilliemes: 1000, unite: 'forfait',
      prixUnitaireCentimes: 9999000000, tauxTvaCentiemes: 2000 });
    coupee = true;
    file.ligne({ id: IDA(16), ordre: 4000, type: 'poste', designation: 'Coupée', quantiteMilliemes: 1000, unite: 'forfait',
      prixUnitaireCentimes: 100, tauxTvaCentiemes: 2000 });
    await auRepos(file);
    const ech = D.echecsDeLaFile(file.entreesVoulues().map((x) => ({ ...x, erreur: file.erreurDe(x.cle) })), {
      devisEnBase: file.devisEnBase(), estDefinitif: ERR.estUnRefusDefinitif, phraseDe: ERR.messageDEcritureDuDevis,
    });
    verifier('`echecsDeLaFile` (la réouverture) : la ligne refusée par le plafond → sa phrase de LIGNE et « ligne » ; l’option → sa phrase '
      + 'd’OPTION et « ligne » ; la ligne coupée du réseau → la phrase du réseau, et AUCUN refus définitif (elle se réessaie)',
    ech.phrases[IDA(15)] === ATTENDUES.ligne && ech.definitifs[IDA(15)] === 'ligne'
      && ech.phrases[IDA(17)] === ATTENDUES.option && ech.definitifs[IDA(17)] === 'ligne'
      && ech.phrases[IDA(16)] === ERR.messageClair({ message: 'Network request failed' }, '') && !(IDA(16) in ech.definitifs)
      && !('devis' in ech.definitifs), json(ech.definitifs));
    const ouverture = (S.match(/fileRef\.current = f;[\s\S]*?setEtat\('pret'\);/) || [])[0] || '';
    verifier('…et la saisie s’en sert À L’OUVERTURE (avec `estUnRefusDefinitif` et `messageDEcritureDuDevis`) ; `rejouerLePlafond` '
      + 'ne retient pour l’annonce qu’une clé qui n’est pas déjà enregistrée',
    /const echecs = echecsDeLaFile\(f\.entreesVoulues\(\)\.map\(\(x\) => \(\{ \.\.\.x, erreur: f\.erreurDe\(x\.cle\) \}\)\), \{\s*devisEnBase: f\.devisEnBase\(\), estDefinitif: estUnRefusDefinitif, phraseDe: messageDEcritureDuDevis,\s*\}\);/.test(ouverture)
      && /setPhrasesEchec\(echecs\.phrases\);/.test(ouverture) && /definitifsRef\.current = echecs\.definitifs;/.test(ouverture)
      && /rejouerLesRefusDuPlafond\(f\)\.forEach\(\(c\) => \{ if \(f\.etatDe\(c\) !== 'enregistree'\) rejoues\.current\.add\(c\); \}\);/
        .test(corpsFleche(S, 'const rejouerLePlafond = () =>')));
  }
}

console.log('\n  38. le banc adverse du 04/11 — ce qui passait encore au vert à l’écran, FAIT TOURNER');
{
  /* POURQUOI (banc adverse du lot 2a, 04/11/2026) : douze défauts d'écran
     remis à la main passaient les 56 contrôles. Chacun est tenu ici par la
     PROPRIÉTÉ qu'il cassait, et les fonctions pures tournent pour de bon. */
  const n = (t) => String(t == null ? '' : t).replace(/[\u00a0\u202f]/g, ' ');
  const dd = D.demandeDuDevis;
  const vide0 = D.etatInitialConditions({});

  /* a. LA NATURE PART AVEC L'ACOMPTE (E05, E05b) : un acompte tapé — en
        pourcentage comme en euros — emporte la nature CHOISIE ; sans nature,
        rien n'est inventé ; un acompte vidé vide la nature ; une faute
        n'écrit rien. Le défaut passait : seule la branche « unité en
        attente » était éprouvée. */
  const lc = (choix, acompte, devis = {}) => D.lireConditions({ choix, tapes: { reduction: '', acompte }, devis });
  const NATURE = [
    ['30 % et « arrhes »', lc({ ...vide0, nature: 'arrhes' }, '30'), { acompteCentiemes: 3000, acompteCentimes: null, acompteNature: 'arrhes' }],
    ['30 % et « acompte »', lc({ ...vide0, nature: 'acompte' }, '30'), { acompteCentiemes: 3000, acompteCentimes: null, acompteNature: 'acompte' }],
    ['150 € et « arrhes »', lc({ ...vide0, uniteAcompte: 'montant', nature: 'arrhes' }, '150'), { acompteCentimes: 15000, acompteCentiemes: null, acompteNature: 'arrhes' }],
    ['30 % sans nature', lc({ ...vide0, nature: null }, '30'), { acompteCentiemes: 3000, acompteCentimes: null, acompteNature: null }],
    ['acompte vidé', lc(D.etatInitialConditions({ acompteCentiemes: 3000, acompteNature: 'arrhes' }), '', { acompteCentiemes: 3000, acompteNature: 'arrhes' }),
      { acompteCentiemes: null, acompteCentimes: null, acompteNature: null }],
  ];
  const natureFausse = NATURE.filter(([, l, attendu]) => Object.entries(attendu).some(([k, v]) => l.changements[k] !== v) || Object.keys(l.erreurs).length)
    .map(([k, l]) => `${k} : ${json(l.changements)}`);
  const faute = lc({ ...vide0, nature: 'arrhes' }, 'abc');
  verifier('`lireConditions`, FAIT TOURNER : un acompte TAPÉ (30 %, 150 €) emporte la nature choisie (« arrhes », « acompte ») dans la même '
    + 'écriture ; sans nature, `null` ; un acompte vidé vide la nature ; un acompte illisible n’écrit ni l’acompte ni la nature',
  natureFausse.length === 0 && !('acompteNature' in faute.changements) && !('acompteCentiemes' in faute.changements)
    && !!faute.erreurs.acompteCentiemes, natureFausse.join(' | ') || json(faute));

  /* b. « CORRIGER » ROUVRE CHAQUE CHOIX GARDÉ (É03) : l'unité de l'acompte
        oubliée rouvrait sous « % » un acompte refusé en euros (« 150 »
        devenait 150 %). Les SIX choix gardés, chacun contraire à ce que le
        devis enregistré donnerait, dans les deux sens. */
  const garde1 = { uniteReduction: 'montant', uniteAcompte: 'montant', nature: 'arrhes', validite: 60, validiteAutre: false, retenue: true };
  const r1 = D.etatInitialConditions({ remiseCentiemes: 700, acompteCentiemes: 3000, acompteNature: 'acompte', validiteJours: 30 },
    { reduction: '12', acompte: '150', choix: garde1 });
  const garde2 = { uniteReduction: 'pourcent', uniteAcompte: 'pourcent', nature: null, validite: null, validiteAutre: false, retenue: false };
  const r2 = D.etatInitialConditions({ remiseCentimes: 5000, acompteCentimes: 15000, acompteNature: 'arrhes', validiteJours: 60,
    retenueGarantieCentiemes: 500 }, { reduction: '5', acompte: '10', choix: garde2 });
  verifier('`etatInitialConditions`, FAIT TOURNER : « Corriger » rouvre la carte sur les SIX choix gardés — l’unité de la réduction, '
    + 'CELLE DE L’ACOMPTE, la nature, la validité, « Autre », la retenue — même quand le devis enregistré dit le contraire, dans les deux sens',
  json(r1) === json(garde1) && json(r2) === json(garde2), `${json(r1)} | ${json(r2)}`);

  /* c. LES PHRASES D'EFFET, LES CAS QUE LES DIX DE 36 a NE COUVRAIENT PAS
        (N26) : l'acompte EN EUROS au régime réel (il perdait « TTC » sans
        un ✘), en pourcentage en franchise, sans régime connu, avec la
        retenue ; la réduction en euros au régime réel. */
  const EFFETS2 = [
    ['acompte 300,00 €, réel', D.effetDeLAcompte({ ttc: 120000, acompte: 30000, demande: dd({ acompteCentimes: 30000 }) }, { acompteCentimes: 30000 }, 'reel'),
      '300,00 € TTC — reste à payer 900,00 € TTC.'],
    ['acompte 30 %, franchise', D.effetDeLAcompte({ ttc: 120000, acompte: 36000, demande: dd({ acompteCentiemes: 3000 }) }, { acompteCentiemes: 3000 }, 'franchise'),
      '360,00 € — reste à payer 840,00 €.'],
    ['acompte 300,00 €, régime inconnu', D.effetDeLAcompte({ ttc: 120000, acompte: 30000, demande: dd({ acompteCentimes: 30000 }) }, { acompteCentimes: 30000 }, undefined),
      '300,00 € — reste à payer 900,00 €.'],
    ['acompte 300,00 €, réel, retenue', D.effetDeLAcompte({ ttc: 120000, acompte: 30000, demande: dd({ acompteCentimes: 30000, retenueGarantieCentiemes: 500 }) },
      { acompteCentimes: 30000 }, 'reel'), '300,00 € TTC — reste à payer, avant la retenue de garantie 900,00 € TTC.'],
    ['réduction 50,00 €, réel', D.effetDeLaReduction({ ht: 95000, tva: 19000, ttc: 114000, brut: 100000, reduction: 5000, demande: dd({ remiseCentimes: 5000 }) },
      { remiseCentimes: 5000 }, 'reel'), 'Le total HT des postes passe de 1 000,00 € à 950,00 €.'],
  ];
  const effets2Faux = EFFETS2.filter(([, e, a]) => !e || n(e.aDire) !== a).map(([k, e]) => `${k} : « ${e && n(e.aDire)} »`);
  verifier('les phrases d’effet, FAITES TOURNER sur cinq cas de plus : l’acompte EN EUROS au régime réel garde « TTC » des deux côtés, '
    + 'la franchise et un régime inconnu n’en mettent jamais, la retenue se dit, la réduction en euros au réel — chaque phrase ENTIÈRE',
  effets2Faux.length === 0, effets2Faux.join(' | '));

  /* d. ZÉRO N'EST PAS VIDE (N27) : `nombreOuNul` qui lisait 0 comme vide
        changeait une réduction effective de 0 en « illisible » et un total
        de 0 en `null`, dans `devis.js` ET dans `api.js` (les deux restaient
        égaux, la section 36 c passait). Les zéros de la base, relus. */
  const zero = D.rowToDevis({ id: 'd', pro_id: 'p', total_ht_centimes: 0, total_tva_centimes: 0, total_ttc_centimes: 0, remise_ht_centimes: 0,
    acompte_ttc_centimes: 0, total_ttc_options_centimes: '0', validite_jours: null, generation: 0 });
  const zeroT = D.totauxDepuisBase({ total_ht_centimes: 0, total_tva_centimes: 0, total_ttc_centimes: 0, remise_ht_centimes: 0, acompte_ttc_centimes: 0,
    total_ttc_options_centimes: 0, remise_centimes: null, remise_centiemes: null, acompte_centimes: null, acompte_centiemes: null, acompte_nature: null,
    retenue_garantie_centiemes: null, generation: 0, modifie_le: null, devis_tva: [] });
  verifier('`rowToDevis` et `totauxDepuisBase`, FAITS TOURNER sur des ZÉROS : un total, une réduction effective, un acompte effectif à 0 '
    + 'se relisent 0 — jamais `null` (« illisible »), et le brut d’un devis vide vaut 0',
  [zero.totalHtCentimes, zero.totalTvaCentimes, zero.totalTtcCentimes, zero.remiseHtCentimes, zero.acompteTtcCentimes,
    zero.totalTtcOptionsCentimes, zero.generation].every((v) => v === 0)
    && [zeroT.ht, zeroT.tva, zeroT.ttc, zeroT.reduction, zeroT.brut, zeroT.acompte, zeroT.ttcOptions].every((v) => v === 0),
  `${json(zero)} | ${json(zeroT)}`);

  /* e. LES AIDES SE LISENT (N24, N25) : écrites dans la couleur du FOND
        de la carte (`C.surface`), ou dans une vue parente `display: 'none'`,
        elles passaient. La couleur du style `aide` est relue dans
        `theme.js` et son contraste CALCULÉ sur le fond de la carte (4,5 au
        moins) ; et rien dans la carte n'est caché par un style. */
  const carte38 = sansCommentairesJs(lire('src/components/ConditionsDevis.js'));
  const THEME = lire('src/theme.js');
  const palette = (/export const C = \{([\s\S]*?)\n\};/.exec(THEME) || [])[1] || '';
  const hexDe = (expr) => {
    const v = String(expr || '').trim();
    if (/^['"]#[0-9a-f]{6}['"]$/i.test(v)) return v.slice(1, -1);
    const m = /^C\.(\w+)$/.exec(v);
    const h = m ? new RegExp(String.raw`\b${m[1]}\s*:\s*'(#[0-9A-Fa-f]{6})'`).exec(palette) : null;
    return h ? h[1] : null;
  };
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const styleDe = (nom) => (new RegExp(String.raw`\n\s{2}${nom}:\s*\{([^}]*)\}`).exec(carte38) || [])[1] || '';
  const couleurAide = hexDe((/\bcolor\s*:\s*([^,}\n]+)/.exec(styleDe('aide')) || [])[1]);
  const fondCarte = hexDe((/\bbackgroundColor\s*:\s*([^,}\n]+)/.exec(styleDe('ecran')) || [])[1]);
  const ratio = couleurAide && fondCarte ? contraste(couleurAide, fondCarte) : 0;
  verifier(`les aides de la carte se LISENT : la couleur du style \`aide\` (${couleurAide || '?'}), relue dans \`theme.js\`, donne `
    + `${ratio.toFixed(2)} : 1 sur le fond de la carte (${fondCarte || '?'}) — 4,5 au moins`,
  ratio >= 4.5, `aide ${couleurAide} sur ${fondCarte}`);
  const CACHENT = [
    [/\bdisplay\s*:\s*['"]none['"]/, '`display: \'none\'`'],
    [/\bopacity\s*:\s*0*(?:\.[0-2]\d*)?\s*(?=[,}\n])/, 'une opacité de 0,2 au plus'],
    [/\b(?:height|maxHeight|width|maxWidth|fontSize)\s*:\s*0(?![.\d])/, 'une taille nulle'],
    [/\bscale[XY]?\s*:\s*0(?![.\d])/, 'une échelle nulle'],
    [/\bcolor\s*:\s*['"]transparent['"]/, 'un texte transparent'],
  ].filter(([re]) => re.test(carte38)).map(([, quoi]) => quoi);
  verifier('…et rien dans la carte « Conditions » n’est caché par un STYLE — ni `display: \'none\'`, ni opacité nulle, ni taille ou '
    + 'échelle nulle, ni texte transparent (une vue parente cachait l’aide de la validité sans que ses conditions changent)',
  carte38.length > 3000 && CACHENT.length === 0, CACHENT.join(', '));

  /* f. « RÉESSAYER » NE RENVOIE PAS UN REFUS DÉFINITIF (N28, N29) : un
        second bouton qui renvoyait l'en-tête dans la bande, sans la garde,
        passait ; la carte qui proposait « Réessayer » sur TOUT échec (elle
        lisait `echec` au lieu de `reessayable`) aussi. Chaque appel qui
        renvoie l'en-tête (`reessayer('devis')`) est sous la garde du refus
        définitif, ou il est le `onReessayer` de la carte, dont l'écran pose
        `reessayable` avec cette garde ; et la carte prend `reessayable`
        TEL QUEL. */
  const S38 = ECR.saisie;
  const blanchi = S38.replace(/`(?:[^`\\]|\\.)*`/g, (m) => '`' + ' '.repeat(m.length - 2) + '`')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, (m) => "'" + ' '.repeat(m.length - 2) + "'");
  const finDeParenthese = (t, i) => { let p = 0; for (let j = i; j < t.length; j += 1) { if (t[j] === '(') p += 1; if (t[j] === ')') { p -= 1; if (p === 0) return j; } } return -1; };
  const gardes = [...blanchi.matchAll(/\{!estUnRefusDefinitif\(attente\.devisErreur\) && \(/g)]
    .map((m) => [m.index, finDeParenthese(blanchi, m.index + m[0].length - 1)]);
  const balise38 = balises(S38, 'ConditionsDevis')[0] || '';
  const iBalise = balise38 ? S38.indexOf(balise38) : -1;
  const renvois = [...S38.matchAll(/\breessayer\(\s*'devis'\s*\)/g)].map((m) => m.index);
  const sousGarde = renvois.filter((i) => gardes.some(([a, b]) => i > a && i < b));
  const dansLaCarte = renvois.filter((i) => iBalise >= 0 && i > iBalise && i < iBalise + balise38.length);
  const nus = renvois.filter((i) => !sousGarde.includes(i) && !dansLaCarte.includes(i)).map((i) => sansEspaces(S38.slice(Math.max(0, i - 90), i + 20)));
  verifier('chaque renvoi de l’EN-TÊTE (`reessayer(\'devis\')`) est sous la garde du refus définitif (la bande) ou il est le '
    + '`onReessayer` de la carte, dont `reessayable` porte cette garde — aucun autre bouton ne renvoie un refus définitif',
  renvois.length === 2 && sousGarde.length === 1 && dansLaCarte.length === 1 && nus.length === 0
    && /reessayable: !!attente\.devisErreur && !estUnRefusDefinitif\(attente\.devisErreur\)/.test(balise38)
    && /onReessayer=\{\(\) => fileRef\.current && fileRef\.current\.reessayer\('devis'\)\}/.test(balise38),
  `${renvois.length} renvoi(s), ${sousGarde.length} sous garde, ${dansLaCarte.length} dans la carte ; nus : ${nus.join(' | ') || '—'}`);
  const clesReessayable = [...carte38.matchAll(/\breessayable\s*:\s*([^,\n]+),/g)].map((m) => sansEspaces(m[1]));
  verifier('…et la carte prend `reessayable` de l’écran TEL QUEL (`!!(etatEcriture && etatEcriture.reessayable)`), une seule fois — '
    + 'jamais `echec`, qui proposerait « Réessayer » sur un refus définitif',
  json(clesReessayable) === json(['!!(etatEcriture && etatEcriture.reessayable)']), json(clesReessayable));

  /* g. CE QUE DIT LA GARDE EN PARTANT (R1d) : « Opus les renverra tout
        seul » ajouté à la phrase des lignes en échec passait — or rien
        n'est renvoyé après le départ. Le bilan, ENTIER : les lignes qui
        n'ont pas pu partir, celles dont l'envoi continue SANS garantie, et
        sinon la phrase de l'en-tête. */
  const BILAN = "{[ garde.enEchec > 1 ? `${garde.enEchec} lignes n’ont pas pu être enregistrées.` : null, garde.enEchec === 1 ? 'Une ligne n’a pas pu être enregistrée.' : null, garde.enCours > 1 ? `${garde.enCours} lignes ne sont pas encore enregistrées : l’envoi continue, mais rien ne garantit qu’il aboutira.` : null, garde.enCours === 1 ? 'Une ligne n’est pas encore enregistrée : l’envoi continue, mais rien ne garantit qu’il aboutira.' : null, !garde.enEchec && !garde.enCours ? phraseEchecDuDevis({ enBase: attente.devisEnBase, erreur: attente.devisErreur }) : null, ].filter(Boolean).join(' ')";
  const iBilan = S38.indexOf("garde.phase === 'bilan' && garde.incompletes.length === 0 && garde.enteteRefuse.length === 0");
  const aB = iBilan >= 0 ? S38.indexOf('{[', iBilan) : -1;
  const bB = aB >= 0 ? S38.indexOf(".filter(Boolean).join(' ')", aB) : -1;
  const bilan = bB > 0 ? sansEspaces(S38.slice(aB, bB + ".filter(Boolean).join(' ')".length)) : '';
  verifier('la garde de sortie dit, en partant, EXACTEMENT ce qui est vrai : les lignes qui n’ont pas pu être enregistrées, celles dont '
    + 'l’envoi continue SANS garantie, sinon la phrase de l’en-tête — jamais un renvoi promis après le départ',
  bilan === BILAN, bilan ? bilan.slice(0, 300) : 'bilan introuvable');

  /* h. LA MESURE AU NAVIGATEUR NE REDEVIENT PAS UNE TAUTOLOGIE (É11) :
        `mesure-devis` vérifie que rien n'est pré-choisi en lisant les DEUX
        pastilles de nature, des BOUTONS (`aria-selected`), et le résumé —
        une seule lecture de « radio », ou un `||`, la rendait vraie quoi
        qu'il arrive. */
  const M38 = sansCommentairesJs(lire('scripts/mesure-devis.mjs'));
  const DEF_NATURE = "const choisieNature = async (nom) => page.getByRole('button', { name: nom, exact: true }).first().getAttribute('aria-selected');";
  const iV = M38.indexOf('un acompte sans nature : rien');
  const appel = iV >= 0 ? sansEspaces(M38.slice(M38.lastIndexOf('verifier(', iV), M38.indexOf(');', iV) + 2)) : '';
  verifier('`mesure-devis` : « rien n’est pré-choisi » lit les DEUX pastilles de nature comme des BOUTONS (`aria-selected`) et le '
    + 'résumé, et ne passe que si les trois le disent — aucune lecture de « radio », aucun `||`',
  M38.split('\n').some((l) => sansEspaces(l) === DEF_NATURE)
    && /const arrhesChoisies = await choisieNature\('C’est des arrhes'\);/.test(M38)
    && /const acompteChoisi = await choisieNature\('C’est un acompte'\);/.test(M38)
    && appel.endsWith(", arrhesChoisies === 'false' && acompteChoisi === 'false' && !!sansNature);")
    && !/\|\|/.test(appel.slice(appel.lastIndexOf(', arrhesChoisies')))
    && !/getByRole\(\s*'radio'\s*,\s*\{\s*name:[^)]*(?:arrhes|acompte)/i.test(M38),
  appel.slice(-160));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le chiffrage compte juste, au centime, la file n’écrit rien deux fois ni dans le désordre, et le schéma tient ce '
  + 'qu’il promet. Ce que PostgreSQL en fait, `essais-section-49.sql` le dit — à jouer à la main.\n');
