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
  const longue = D.devisDepuisDemande({ id: 'q', genre: 'devis', titre: `${'a'.repeat(1200)}` });
  verifier('l’objet pré-rempli depuis une demande tient dans `devis_objet_check` (1 000 caractères) : au-delà, le brouillon ne se '
    + 'créerait pas', longue && [...longue.objet].length === D.LONGUEURS.objet && D.validerDevis({ ...longue }).ok,
  `${longue && [...longue.objet].length} caractères`);
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
    'src/components/ChoixClientDevis.js', 'src/components/ChampMontant.js'];
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
    && phrasesDe(lire('src/screens/SaisieDevisScreen.js')).some((p) => UN_AN.test(p)),
    sansReserve.map(({ f, p }) => `${f} : « ${p.slice(0, 90)} »`).join(' | ') || `${phrasesModule.length} phrases lues`);
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
  const ouverture = acceptee ? D.devisDepuisDemande(acceptee) : null;
  let lien = null;
  if (ouverture) {
    await base2.ecrire('1', { quoi: 'devis', action: 'inserer', id: 'de0000ff-0000-4000-8000-000000000001', valeurs: { ...ouverture }, generation: Date.now() });
    lien = (await base2.liste('1')).find((d) => d.id === 'de0000ff-0000-4000-8000-000000000001');
  }
  verifier('la demande de démonstration se lie PAR LE GESTE : « en attente » dans les données (aucun lien truqué), « Faire un devis » '
    + 'une fois acceptée, et le brouillon dit « depuis une demande du … » avec une date calculée',
  Boolean(dr && dr.statut === 'en_attente' && !D.peutFaireUnDevis(dr) && D.peutFaireUnDevis(acceptee)
    && lien && lien.quoteRequestId === 'dr-devis-1' && /^depuis une demande du \d{2}\/\d{2}\/\d{4}$/.test(D.origineLisible(lien) || ''))
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
  verifier('`devis.js` importe EXACTEMENT `./centimes.js` (`centimesLisibles`), `./entreprise.js` (`dateFrancaise`, `isoLisible`) '
    + 'et `./rapprochement.js` (`aPlat`, `cleDeRapprochement` — lot P) — trois instructions, aucune autre forme (ni import nu, ni '
    + 'réexportation, ni `import()`)',
  imps.length === 3 && json(imps.find((x) => x.de === './centimes.js')) === json({ de: './centimes.js', noms: ['centimesLisibles'] })
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
  return m[1].split('\n').map((l) => l.trim().replace(/,$/, '')).filter((l) => /^[a-z_]+\s/.test(l) && !/^primary\s+key/i.test(l))
    .map((l) => {
      const [nom, type] = l.split(/\s+/);
      return { nom, type, obligatoire: /\bnot\s+null\b|\bprimary\s+key\b/i.test(l), texte: l };
    });
}
/* Les contraintes `check` posées par la section : `{ table, nom, regle }`. */
const CHECKS49 = [...S49.matchAll(/alter\s+table\s+public\.(\w+)\s+add\s+constraint\s+(\w+)\s+check\s*\(([\s\S]*?)\);\s*(?=alter|comment|create|revoke|grant|drop|$)/gi)]
  .map((m) => ({ table: m[1], nom: m[2], regle: m[3] }));
const regleDe = (nom) => (CHECKS49.find((c) => c.nom === nom) || {}).regle || '';
const listeDe = (nom, colonne) => {
  const m = new RegExp(`${colonne}\\s+in\\s*\\(([^)]*)\\)`, 'i').exec(regleDe(nom));
  return m ? m[1].split(',').map((x) => x.trim().replace(/^'|'$/g, '')) : null;
};

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
      'total_ttc_centimes bigint +', 'generation bigint +', 'created_at timestamptz +', 'modifie_le timestamptz +'],
    devis_lignes: ['id uuid +', 'devis_id uuid +', 'ordre integer +', 'type text +', 'designation text', 'quantite_milliemes bigint',
      'unite text', 'prix_unitaire_centimes bigint', 'taux_tva_centiemes integer', 'total_centimes bigint', 'offert boolean +',
      'main_oeuvre boolean +', 'fourniture_non_comprise boolean +', 'surface_sol_milliemes bigint', 'surface_murs_milliemes bigint',
      'generation bigint +', 'modifie_le timestamptz +'],
    devis_tva: ['devis_id uuid +', 'taux_tva_centiemes integer +', 'base_centimes bigint +', 'tva_centimes bigint +', 'nb_lignes integer +'],
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
  const ajouts = [...SQL.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?public\.devis(?:_lignes|_tva)?\b([^;]*);/gi)]
    .flatMap((m) => [...m[1].matchAll(/\badd\b(?!\s+constraint\s+\w+\s+check\b)\s*[^,;]*/gi)].map((a) => sansEspaces(a[0])));
  verifier('…et rien ne s’y ajoute plus bas : sur ces tables, le seul `add` est `add constraint <nom> check` (ni `add column`, ni '
    + '`add if not exists`, ni une contrainte anonyme)', ajouts.length === 0, ajouts.join(' | '));
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

console.log('\n  15. les contraintes — vingt-trois, toutes nommées en `_check`');
{
  const noms = CHECKS49.map((c) => c.nom);
  const tables = [...new Set(CHECKS49.map((c) => c.table))].sort();
  verifier(`la section pose ${noms.length} contraintes \`check\` sur les trois tables — il en faut 23`,
    noms.length === 23 && json(tables) === json([...TABLES49].sort()), json(noms));
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
    : `aucune phrase de \`MESSAGES_CONTRAINTE\` ne nomme une contrainte absente (${phrases.length} phrase(s) de devis ; les 23 `
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
  verifier('`CONTRAINTES_DEVIS` : dix noms `devis_…_check`, triés de même',
    D.CONTRAINTES_DEVIS.length === 10 && D.CONTRAINTES_DEVIS.every((n) => /^devis_[a-z_]+_check$/.test(n) && !/^devis_ligne_/.test(n))
    && egalListes([...D.CONTRAINTES_DEVIS], [...D.CONTRAINTES_DEVIS].sort()));
  const schemaLigne = CHECKS49.filter((c) => c.table === 'devis_lignes').map((c) => c.nom).sort();
  const schemaDevis = CHECKS49.filter((c) => c.table === 'devis').map((c) => c.nom).sort();
  verifier('…et ce sont EXACTEMENT les dix de `devis_lignes` et les dix de `devis` que le schéma pose',
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
    ['PLAFOND', D.PLAFOND, /total_ht_centimes\s+between\s+0\s+and\s+(\d+)/i, 'devis_plafond_check'],
    ['PLAFOND', D.PLAFOND, /total_ttc_centimes\s*<=\s*(\d+)/i, 'devis_plafond_check'],
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
  verifier('les bornes de `devis.js` sont celles des contraintes (quantité, prix, plafond ×3, surfaces, retenue, cinq longueurs)',
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
  const arrondis = fonctions49.filter((f) => /\bround\s*\(|\bnumeric\b|\bfloat|\bdouble\s+precision\b|\breal\b/i.test(f.corps)).map((f) => f.nom);
  verifier(`aucune fonction de la section (${fonctions49.map((f) => f.nom).join(', ')}) n’écrit \`round(\`, \`numeric\`, un flottant`,
    fonctions49.length >= 6 && arrondis.length === 0, arrondis.join(', '));
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
  const attendus = [
    { quoi: 'select, insert, update, delete', sur: 'public.devis, public.devis_lignes', a: 'authenticated' },
    { quoi: 'select', sur: 'public.devis_tva', a: 'authenticated' },
  ];
  const ok = grants.length === 2 && attendus.every((g) => grants.some((x) => x.quoi === g.quoi && x.sur === g.sur && x.a === g.a));
  const sRevoke = revokes[0] ? revokes[0].index : -1;
  const iGrants = grants.map((g) => S49.indexOf(g.quoi === 'select' ? 'grant select on public.devis_tva' : 'grant select, insert, update, delete'));
  verifier('`revoke all … from anon, authenticated` sur les trois tables, PUIS deux `grant` exacts : lecture et écriture des '
    + 'devis et des lignes, LECTURE SEULE de la ventilation — et aucun autre `grant` sur ces tables dans tout le fichier',
  revokes.length === 1 && revokes[0].roles === 'anon,authenticated' && ok && iGrants.every((i) => i > sRevoke),
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
  verifier('…et son SEUL appelant est `recalcule_apres_ligne_de_devis` (un appelant de plus, et la révocation le casserait)',
    json([...new Set(appelants)]) === json(['recalcule_apres_ligne_de_devis'])
    && !/grant[^;]*recalcule_devis/i.test(SQL), json(appelants));
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
  const decl = [...S49.matchAll(/create\s+or\s+replace\s+trigger\s+(\w+)\s+(before|after)\s+([\w\s]+?)\s+on\s+public\.(\w+)\s+for\s+each\s+row\s+execute\s+function\s+public\.(\w+)\(\)/gi)]
    .map((m) => `${m[1]}|${m[2]} ${sansEspaces(m[3])}|${m[4]}|${m[5]}`);
  verifier('les trois déclencheurs existent SOUS LEURS NOMS, en `create or replace trigger` (leur ordre est alphabétique)',
    json(decl.sort()) === json([
      'trg_recalcule_devis|after insert or update or delete|devis_lignes|recalcule_apres_ligne_de_devis',
      'trg_tient_la_ligne_de_devis|before insert or update|devis_lignes|tient_la_ligne_de_devis',
      'trg_tient_le_devis|before insert or update|devis|tient_le_devis',
    ]) && !/create\s+trigger\b/i.test(S49), json(decl));
}

console.log('\n  21 bis. la requête tardive (49.5 bis) — la parade est tenue par la BASE');
{
  const r = corpsDe('recalcule_devis');
  const t = corpsDe('tient_le_devis');
  const a = corpsDe('recalcule_apres_ligne_de_devis');
  const iVerrou = r.search(/\bfor\s+no\s+key\s+update\b/i);
  const iOP015 = r.search(/p_generation\s+is\s+not\s+null\s+and\s+p_generation\s*<=\s*v_horloge/i);
  verifier('`recalcule_devis` lit l’horloge du devis SOUS son verrou, puis refuse (OP015) une écriture de ligne dont le numéro '
    + 'ne la dépasse pas', /select\s+d\.generation\s+into\s+v_horloge\s+from\s+public\.devis\s+d\s+where\s+d\.id\s*=\s*p_devis\s+for\s+no\s+key\s+update/i.test(r)
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
    const apiTexte = lire('src/lib/api.js');
    verifier(`e ter. \`creerLienFermeDemo\` sur les demandes de démonstration : u-julie (${julie.length} demande(s)) ouverte, fermée sous blocage — les autres non, ni un autre genre —, rouverte au déblocage ; et \`api.js\` la branche`,
      julie.length >= 1 && autres.length >= 1 && avant && pendant && apres
        && /creerLienFermeDemo\(DEMANDES_RECUES_DEMO, demoBlocages\)\(genre, id\)/.test(apiTexte)
        && /lienFerme: lienFermeDemo/.test(apiTexte)
        && /return !lienFermeDemo\(genre, id\);/.test(apiTexte));
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
    ratees.length === 0 && /^\{\s*if \(screen !== 'devisSaisie' \|\| !gardeSortie\.current\) return true;\s*return gardeSortie\.current\.sortir\(\{ parLeRetour \}\);\s*\}$/.test(garde.replace(/^=>\s*/, ''))
    && /onGarde=\{inscrireGarde\}/.test(APP), `portes ratées : ${ratees.join(', ') || '—'}`);
  verifier('…et la saisie lit TOUT avant de partir : la carte ouverte, l’en-tête, la retenue, puis attend la file',
    /const enregistrerTout = async \([^)]*\) => \{[\s\S]{0,400}fermerCarte\(\)[\s\S]{0,200}refEntete\.current\.enregistrer\(\)[\s\S]{0,200}refBas\.current\.enregistrer\(\)[\s\S]{0,240}\.attendre\(DELAI_ECRITURE\)/
      .test(ECR.saisie));
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
    && /poserRefusEntete\(\['retenueGarantieCentiemes'\]/.test(corpsFleche(ECR.saisie, 'const changerRetenue = ')));
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
  verifier('« Total TTC » au régime RÉEL seulement — le pied et la ventilation disent « Total » quand le régime n’est pas connu',
    /\{reel \? 'Total TTC' : 'Total'\}/.test(ECR.saisie) && !/franchise \? 'Total' : 'Total TTC'/.test(ECR.saisie)
    && /\{!franchise && !reel \? \(/.test(ECR.saisie));
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
  verifier('…et l’appui lit `devisDeLaDemande(` AVANT d’ouvrir la saisie ; « Reprendre » existe',
    faire.length > 50 && faire.indexOf('devisDeLaDemande(') > 0 && faire.indexOf('devisDeLaDemande(') < faire.indexOf('onFaireDevis(')
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

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le chiffrage compte juste, au centime, la file n’écrit rien deux fois ni dans le désordre, et le schéma tient ce '
  + 'qu’il promet. Ce que PostgreSQL en fait, `essais-section-49.sql` le dit — à jouer à la main.\n');
