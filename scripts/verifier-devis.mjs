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
  /* 2b-3 : LE JOUR DU TÉLÉPHONE (`jourDuTelephone`), le défaut du `jour` de
     `motifsDeRemise` — le jour CALENDAIRE local, avec ses zéros, de part et
     d'autre de minuit UTC ; une attestation valable « jusqu'au » ce jour-là
     l'est encore, celle de la veille non. Et `motifsDeRemise` SANS `jour`
     rend la même chose qu'avec `jourDuTelephone()` (M10 écran). */
  const JOURS = {
    'Europe/Paris': [['2026-07-15T22:30:00Z', '2026-07-16'], ['2026-12-19T23:30:00Z', '2026-12-20'], ['2026-01-05T10:00:00Z', '2026-01-05']],
    'America/Martinique': [['2026-10-21T03:30:00Z', '2026-10-20'], ['2026-03-01T03:59:00Z', '2026-02-28']],
    'Pacific/Kiritimati': [['2026-10-19T10:30:00Z', '2026-10-20'], ['2026-12-31T09:59:00Z', '2026-12-31']],
  };
  const veille = (j) => { const [a, m, d] = j.split('-').map(Number); const t = new Date(Date.UTC(a, m - 1, d - 1));
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; };
  const dec = (fin) => [{ nature: 'decennale', attestation_chemin: 'p/attestation.pdf', valide_jusquau: fin }];
  for (const [iso, attendu] of JOURS[tz] || []) {
    const j = D.jourDuTelephone(new Date(Date.parse(iso)));
    if (j !== attendu) faux.push(`jourDuTelephone(${iso}) → ${j}, attendu ${attendu}`);
    if (D.etatDeLAttestation(dec(attendu), j) !== 'valable') faux.push(`attestation jusqu'au ${attendu}, jugée le ${j} : pas valable`);
    if (D.etatDeLAttestation(dec(veille(attendu)), j) !== 'absente') faux.push(`attestation jusqu'à la veille de ${j} : encore valable`);
  }
  const auj = D.jourDuTelephone();
  const devisOui = { clientId: 'c', pourQui: 'consommateur', pourQuiClient: 'c', lieuVille: 'v', delaiExecution: 'x', validiteJours: 30,
    engageDecennale: true };
  const lignesU = [{ id: 'l', type: 'poste', tauxTvaCentiemes: 0, ordre: 1 }];
  for (const fin of [auj, veille(auj), null]) {
    const sans = JSON.stringify(D.motifsDeRemise({ devis: devisOui, lignes: lignesU, regime: 'franchise', assurances: dec(fin) }));
    const avec = JSON.stringify(D.motifsDeRemise({ devis: devisOui, lignes: lignesU, regime: 'franchise', assurances: dec(fin), jour: auj }));
    if (sans !== avec) faux.push(`motifsDeRemise sans jour ≠ avec jourDuTelephone() (fin ${fin})`);
  }
  if (D.etatDeLAttestation(dec(auj)) !== 'valable') faux.push(`etatDeLAttestation sans jour : une attestation jusqu'à aujourd'hui (${auj}) n'est pas valable`);
  process.stdout.write(JSON.stringify({ tz, cas: (DEPUIS[tz] || []).length + (JOURS[tz] || []).length, faux }));
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
       c'est elle qui porte l'aide « un an » — depuis la relecture finale
       (TC-3), par la constante `AIDE_RETENUE` de `devis.js`, lue ici dans
       les exports (`exportees`) et affichée telle quelle par la carte. */
    && UN_AN.test(D.AIDE_RETENUE)
    && /aide=\{AIDE_RETENUE\}/.test(sansCommentairesJs(lire('src/components/ConditionsDevis.js'))),
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
     lui-même, il passe par `centimesLisibles`. UNE exception depuis 2b-2 :
     l'amende que la loi prévoit (L. 242-5, L. 242-7), dans la feuille de
     confirmation du chantier neuf (annexe A.4) — une phrase de droit, pas un
     montant d'un devis. Elle est écrite UNE fois, telle quelle ; tout autre
     « € » reste refusé. */
  const AMENDE_SOURCE = 'deux ans d’emprisonnement et 150\\u00a0000\\u00a0€ d’amende.';
  const morceauxAmende = srcDevis.split(AMENDE_SOURCE);
  verifier('`devis.js` n’écrit jamais « € » lui-même : un montant ne s’écrit qu’à UN endroit — sauf l’amende de la loi, dans la '
    + 'confirmation du chantier neuf, écrite UNE fois', morceauxAmende.length === 2 && !/€/.test(morceauxAmende.join('')),
  `${morceauxAmende.length - 1} amende(s) ; « € » ailleurs : ${/€/.test(morceauxAmende.join(''))}`);
}

console.log('\n  9. les dates, dans trois fuseaux, des deux côtés de minuit');
{
  const FUSEAUX = ['Europe/Paris', 'America/Martinique', 'Pacific/Kiritimati'];
  const resultats = FUSEAUX.map((tz) => {
    const r = spawnSync(process.execPath, [ICI, '--fuseau'], { encoding: 'utf8', env: { ...process.env, TZ: tz } });
    try { return JSON.parse(r.stdout); } catch (e) { return { tz, plante: `${r.stderr || r.stdout}`.slice(0, 400) }; }
  });
  for (const r of resultats) {
    verifier(`${r.tz} : \`depuisLisible\`, \`origineLisible\`, la date de la mémoire et le jour qui juge l’attestation décennale `
      + `(\`jourDuTelephone\`, \`motifsDeRemise\` sans \`jour\`, 2b-3), à l’heure du téléphone (${r.cas || 0} cas)`,
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
  /* j bis. LA MARQUE DU RENVOI (relecture 6 de 2b-1, 18) : `renvoisEnRoute()`
     rend les clés dont une écriture RENVOYÉE APRÈS UN ÉCHEC (`reessayer()`,
     devis en base) est en route. La marque est posée AVANT l'événement « en
     cours » et retirée AVANT l'événement qui le quitte : l'écran, qui la
     recopie à chaque événement (`majAttente`), ne voit jamais l'une sans
     l'autre. Une écriture ordinaire d'une ligne en échec n'est pas un renvoi ;
     un renvoi fait avant que le devis soit en base n'en porte pas. */
  {
    const refus = () => Object.assign(new Error('refus'), { code: '23514' });
    const b = fausseBase();
    b.commandes.push({ quand: (op) => op.id === 'L1', erreur: refus() });
    const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('X')] });
    const vus = [];
    f.abonner((e) => { if (e.type === 'etat') vus.push(`${e.cle}:${e.etat}:${json(f.renvoisEnRoute())}`); });
    f.ligne(ligne('L1'));
    await f.attendre(300);
    const apresEchec = json(f.renvoisEnRoute());
    /* 1. le renvoi, puis de nouveau en échec */
    b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30, erreur: refus() });
    f.reessayer('L1');
    const pendant1 = json(f.renvoisEnRoute());
    await f.attendre(400);
    const apresReechec = json(f.renvoisEnRoute());
    /* 1 bis. une CORRECTION À LA MAIN de la ligne de nouveau en échec (elle
       échoue encore) : un nouveau geste, pas un renvoi — la marque est tombée
       avec le second échec, et ne revient pas avec l'écriture ordinaire */
    b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30, erreur: refus() });
    f.modifierLigne('L1', { prixUnitaireCentimes: 5 });
    const corrigeeALaMain = json(f.renvoisEnRoute());
    await f.attendre(400);
    /* 2. le renvoi qui réussit */
    b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
    f.reessayer('L1');
    const pendant2 = json(f.renvoisEnRoute());
    await f.attendre(400);
    const apresReussite = json(f.renvoisEnRoute());
    /* 2 bis. une écriture ORDINAIRE de la même ligne, après le renvoi réussi :
       pas un renvoi — une marque restée collée réserverait la place à chaque
       modification qui suit */
    b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
    f.modifierLigne('L1', { prixUnitaireCentimes: 3 });
    const apresRenvoiOrdinaire = json(f.renvoisEnRoute());
    await f.attendre(400);
    /* 3. une écriture ORDINAIRE d'une ligne en échec : pas un renvoi */
    b.commandes.push({ quand: (op) => op.id === 'X', erreur: refus() });
    f.modifierLigne('X', { prixUnitaireCentimes: 1 });
    await f.attendre(300);
    b.commandes.push({ quand: (op) => op.id === 'X', avant: 30 });
    f.modifierLigne('X', { prixUnitaireCentimes: 2 });
    const ordinaire = json(f.renvoisEnRoute());
    await f.attendre(400);
    /* 4. l'en-tête renvoyé, et le renvoi automatique (le plafond) */
    b.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: refus() });
    f.devis({ objet: 'Essai' });
    await f.attendre(300);
    b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30 });
    f.reessayer('devis', { retenues: true, automatique: true });
    const pendantEntete = json(f.renvoisEnRoute());
    await f.attendre(400);
    /* 5. un retrait renvoyé : marqué jusqu'à sa suppression */
    b.commandes.push({ quand: (op) => op.id === 'X' && op.action === 'supprimer', erreur: refus() });
    f.retirerLigne('X');
    await f.attendre(300);
    b.commandes.push({ quand: (op) => op.id === 'X' && op.action === 'supprimer', avant: 30 });
    f.reessayer('X');
    const pendantRetrait = json(f.renvoisEnRoute());
    await f.attendre(400);
    const apresRetrait = json(f.renvoisEnRoute());
    /* 6. un renvoi quand le devis n'est PAS en base : aucune marque, même à
       son entrée en base pendant le renvoi de la ligne */
    const b2 = fausseBase();
    b2.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: refus() });
    const f2 = fabriquer(b2);
    const vus2 = [];
    f2.abonner((e) => { if (e.type === 'etat') vus2.push(json(f2.renvoisEnRoute())); });
    f2.ligne(ligne('L2'));
    await f2.attendre(300);
    b2.commandes.push({ quand: (op) => op.id === 'L2', avant: 30 });
    f2.reessayer();
    const pendantHorsBase = json(f2.renvoisEnRoute());
    await f2.attendre(400);
    /* 7. le devis supprimé : plus rien */
    const b3 = fausseBase();
    b3.commandes.push({ quand: (op) => op.id === 'L3', erreur: refus() });
    const f3 = fabriquer(b3, { devisEnBase: true });
    f3.ligne(ligne('L3'));
    await f3.attendre(300);
    b3.commandes.push({ quand: (op) => op.id === 'L3', avant: 30 });
    f3.reessayer('L3');
    const avantSuppression = json(f3.renvoisEnRoute());
    await f3.supprimerDevis().catch(() => null);
    const apresSuppression = json(f3.renvoisEnRoute());
    /* (« en cours » est annoncé deux fois : à l'entrée dans la file, puis au départ de la requête.) */
    const tousL1 = vus.filter((v) => v.startsWith('L1:'));
    const evenementsL1 = tousL1.filter((v, i) => i === 0 || v !== tousL1[i - 1]);
    verifier('j bis. la MARQUE DU RENVOI (relecture 6) : `renvoisEnRoute()` rend la clé d’une écriture renvoyée après un échec tant qu’elle '
      + 'est en route — une ligne, l’en-tête (renvoi automatique du plafond compris), un retrait —, plus rien dès qu’elle réussit, échoue de '
      + 'nouveau ou disparaît ; l’événement « en cours » la porte déjà, celui qui le quitte ne la porte plus ; une écriture ORDINAIRE d’une '
      + 'ligne en échec n’est pas un renvoi, ni la correction à la main d’une ligne dont le renvoi a échoué, ni une modification qui suit un '
      + 'renvoi réussi (la marque ne reste pas collée) ; un renvoi fait avant que le devis soit en base ne porte aucune marque ; le devis '
      + 'supprimé, rien',
    apresEchec === '[]' && pendant1 === '["L1"]' && apresReechec === '[]' && corrigeeALaMain === '[]' && pendant2 === '["L1"]'
      && apresReussite === '[]' && apresRenvoiOrdinaire === '[]'
      && f.etatDe('L1') === 'enregistree' && ordinaire === '[]' && pendantEntete === '["devis"]' && pendantRetrait === '["X"]'
      && apresRetrait === '[]' && f.etatDe('X') === null && json(f.renvoisEnRoute()) === '[]'
      && pendantHorsBase === '[]' && vus2.every((v) => v === '[]') && f2.etatDe('L2') === 'enregistree'
      && avantSuppression === '["L3"]' && apresSuppression === '[]'
      && json(evenementsL1) === json(['L1:en_cours:[]', 'L1:echec:[]', 'L1:en_cours:["L1"]', 'L1:echec:[]', 'L1:en_cours:[]',
        'L1:echec:[]', 'L1:en_cours:["L1"]', 'L1:enregistree:[]', 'L1:en_cours:[]', 'L1:enregistree:[]']),
    json({
      apresEchec, pendant1, apresReechec, corrigeeALaMain, pendant2, apresReussite, apresRenvoiOrdinaire, ordinaire, pendantEntete,
      pendantRetrait, apresRetrait,
      pendantHorsBase, vus2, avantSuppression, apresSuppression, evenementsL1,
    }));
  }
  /* j ter. LA MARQUE DU RENVOI, ce que j bis ne jouait pas (banc de la
     relecture 6 de 2b-1, 08/11/2026 : huit sabotages de la file y passaient
     au vert) :
       a. l'EN-TÊTE renvoyé À LA MAIN (« Réessayer » de la bande, sans
          `automatique`) — j bis ne le renvoyait que par le plafond : une
          marque réservée au renvoi automatique passait ; puis une écriture
          ORDINAIRE de l'en-tête après ce renvoi réussi — une marque restée
          collée sur le seul `devis` passait ;
       b. une LIGNE refusée renvoyée par le plafond (`automatique`) — j bis
          ne le faisait que pour l'en-tête ;
       c. une ligne rendue « locale » PENDANT son renvoi (incomplète), puis
          écrite à la main — une marque que « locale » n'ôtait pas
          réservait la place pendant cette écriture ordinaire ;
       d. `reessayer()` SANS clé, devis en base : chaque échec renvoyé est
          marqué (aucun appelant de l'écran aujourd'hui — la bande passe une
          clé, TC-1 —, mais c'est le contrat du point 18) ;
       e. un renvoi de l'en-tête qui ATTEND derrière une autre écriture
          quand le devis est supprimé : plus rien après la suppression (la
          garde `supprime` de `renvoisEnRoute()`, que le cas 7 de j bis
          n'atteignait pas : sa marque était déjà tombée) ;
       f. « Réessayer » sur une ligne qui n'est PAS en échec (un appui arrivé
          après que le renvoi automatique l'a déjà enregistrée) : rien ne
          part, rien n'est marqué — et l'écriture ordinaire qui suit ne
          réserve pas la place (une marque posée avant le test de l'état
          restait collée jusque-là). */
  {
    const refus = () => Object.assign(new Error('refus'), { code: '23514' });
    const vu = {};
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('X')] });
      b.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: refus() });
      f.devis({ objet: 'Essai' });
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30 });
      f.reessayer('devis');
      vu.aBande = json(f.renvoisEnRoute());
      await f.attendre(400);
      vu.aApres = json(f.renvoisEnRoute());
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30 });
      f.devis({ objet: 'Essai 2' });
      vu.aOrdinaire = json(f.renvoisEnRoute());
      await f.attendre(400);
      vu.aEtat = f.etatDe('devis');
    }
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true });
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: refus() });
      f.ligne(ligne('L1'));
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      f.reessayer('L1', { retenues: true, automatique: true });
      vu.bAuto = json(f.renvoisEnRoute());
      await f.attendre(400);
      vu.bApres = json(f.renvoisEnRoute());
    }
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: refus() });
      f.modifierLigne('L1', { prixUnitaireCentimes: 7 });
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      f.reessayer('L1');
      vu.cRenvoi = json(f.renvoisEnRoute());
      f.marquerLocale('L1', { prixUnitaireCentimes: 0 });
      vu.cLocale = json(f.renvoisEnRoute());
      await f.attendre(400);
      vu.cEtatLocale = f.etatDe('L1');
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      f.modifierLigne('L1', { prixUnitaireCentimes: 9 });
      vu.cOrdinaire = json(f.renvoisEnRoute());
      await f.attendre(400);
      vu.cEtat = f.etatDe('L1');
    }
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true });
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: refus() });
      b.commandes.push({ quand: (op) => op.id === 'L2', erreur: refus() });
      f.ligne(ligne('L1'));
      f.ligne(ligne('L2', { ordre: 2000 }));
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      b.commandes.push({ quand: (op) => op.id === 'L2', avant: 30 });
      f.reessayer();
      vu.dTout = json(f.renvoisEnRoute().sort());
      await f.attendre(400);
      vu.dApres = json(f.renvoisEnRoute());
    }
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('X')] });
      b.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: refus() });
      f.devis({ objet: 'Essai' });
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'X', avant: 30 });
      f.modifierLigne('X', { prixUnitaireCentimes: 3 });
      f.reessayer('devis');
      vu.eEnAttente = json(f.renvoisEnRoute());
      vu.eSupprime = await f.supprimerDevis().then(() => true, (x) => String(x));
      vu.eApres = json(f.renvoisEnRoute());
    }
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      f.reessayer('L1');
      vu.fRien = json(f.renvoisEnRoute());
      vu.fJournal = b.journal.length;
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      f.modifierLigne('L1', { prixUnitaireCentimes: 11 });
      vu.fOrdinaire = json(f.renvoisEnRoute());
      await f.attendre(400);
    }
    verifier('j ter. …la MARQUE DU RENVOI, là où j bis ne regardait pas (banc de la relecture 6) : l’en-tête renvoyé À LA MAIN (la '
      + 'bande) est marqué, et une écriture ordinaire de l’en-tête après sa réussite ne l’est plus ; une LIGNE renvoyée par le plafond '
      + '(`automatique`) est marquée ; une ligne rendue « locale » pendant son renvoi perd la marque, et l’écriture à la main qui suit ne '
      + 'la reprend pas ; `reessayer()` sans clé marque chaque échec renvoyé ; un renvoi de l’en-tête qui attend derrière une autre '
      + 'écriture ne survit pas à la suppression du devis ; « Réessayer » sur une ligne qui n’est pas en échec ne marque rien, ni '
      + 'l’écriture ordinaire qui suit',
    vu.aBande === '["devis"]' && vu.aApres === '[]' && vu.aOrdinaire === '[]' && vu.aEtat === 'enregistree'
      && vu.bAuto === '["L1"]' && vu.bApres === '[]'
      && vu.cRenvoi === '["L1"]' && vu.cLocale === '[]' && vu.cEtatLocale === 'locale' && vu.cOrdinaire === '[]' && vu.cEtat === 'enregistree'
      && vu.dTout === '["L1","L2"]' && vu.dApres === '[]'
      && vu.eEnAttente === '["devis"]' && vu.eSupprime === true && vu.eApres === '[]'
      && vu.fRien === '[]' && vu.fJournal === 0 && vu.fOrdinaire === '[]',
    json(vu));
  }
  /* j quater. LA MARQUE DU RENVOI, PAR LES AUTRES PORTES (relecture 7 de
     2b-1, 08/11/2026 : RELIRE6-1, RELIRE6-2, RELIRE6-3). La carte d'une
     ligne EN ÉCHEC fermée SANS RIEN CHANGER renvoyait la même écriture sans
     la marque : la place se rendait au départ, puis se réservait au nouvel
     échec (110 → 74 → 110 points à 393, mesuré au navigateur). Même chose
     pour le reste d'un refus partiel de l'en-tête (16) quand une écriture
     attendait derrière lui. On fait tourner la VRAIE file, et la VRAIE règle
     de la place (`garderLaPlace` sur `ceQueLaListeNeComptePas` et
     `renvoisEnRoute()`) recalculée à CHAQUE événement — plus strict que
     l'écran, qui regroupe les événements d'une même tâche :
       a. une réécriture INCHANGÉE d'une ligne en échec est un renvoi — par
          `ligne()` (la carte fermée), par `modifierLigne()` (mêmes valeurs,
          ou rien), pour une modification partie sans réponse, une insertion
          partie sans réponse, un interblocage deux fois : marquée, et la
          place ne bouge pas jusqu'au nouvel échec ;
       b. une réécriture CHANGÉE (le prix corrigé) n'en est pas un : aucune
          marque, le saut nommé (rendue au départ, réservée au nouvel échec) ;
       c. une ligne refusée DÉFINITIVEMENT, la carte fermée sans changer :
          `renvoyerLaLigne` ne la renvoie pas — aucune écriture, rien ne
          bouge ;
       d. le reste d'un refus partiel (16) est marqué, avec et sans une
          écriture derrière l'en-tête : la place se réserve AU REFUS et ne
          bouge plus — et la ligne qui attendait passe AVANT le reste (remis
          en fin de file) ;
       e. une écriture faite PENDANT le vol d'un renvoi garde la marque
          jusqu'à ce que l'entrée quitte « en cours » (RELIRE6-3) : réussie,
          la place se rend à sa réussite ; ratée, elle ne s'est jamais rendue
          (aucun rebond) — et si c'est le RENVOI qui échoue, ce qui a été
          voulu pendant son vol repart AVEC la marque : la même écriture
          remise (« Poste suivant » enregistre la carte, puis `ouvrirCarte`
          l'enregistre encore : 110 → 74 → 110 au navigateur, avant), ou une
          correction ;
       f. l'EN-TÊTE : une réécriture inchangée après un échec est marquée ; un
          AUTRE champ changé pendant qu'un refus est TENU (16) l'est aussi —
          la réduction reste hors du compte quoi qu'il arrive à l'écriture ;
          la réduction elle-même changée, ou un champ changé sans refus
          tenu, ne l'est pas (le saut nommé) ;
       g. le RETRAIT : retirer de nouveau une ligne dont la suppression a
          échoué est marqué ; retirer une ligne en échec qui ne l'était pas ne
          l'est pas ;
       h. un devis qui n'est PAS en base : aucune marque, même inchangée. */
  {
    const reseau = () => new TypeError('Failed to fetch');
    const deadlock = () => Object.assign(new Error('deadlock detected'), { code: '40P01' });
    const prix23514 = () => Object.assign(new Error('new row violates check constraint "devis_ligne_prix_check"'), { code: '23514' });
    const plafondJq = () => Object.assign(new Error('new row for relation "devis" violates check constraint "devis_plafond_check"'), { code: '23514' });
    /* La place, recalculée à chaque événement « etat », comme `majAttente`
       puis le rendu : G (réservée) ou — (ordinaire), les répétitions
       fondues ; la première est celle du moment où l'on commence à suivre. */
    const suivre = (f) => {
      const vu = [];
      const place = () => {
        const etats = f.etats();
        const n = Object.keys(etats).filter((k) => etats[k] === 'echec' || etats[k] === 'locale').length;
        const pasCompte = D.ceQueLaListeNeComptePas({ nbLignes: n, entete: f.etatDe('devis') === 'echec', enBase: f.devisEnBase() });
        return D.garderLaPlace({ enBase: f.devisEnBase(), pasCompte, renvoi: f.renvoisEnRoute().length > 0 }) ? 'G' : '—';
      };
      vu.push(place());
      f.abonner((e) => {
        if (e.type !== 'etat' && e.type !== 'supprimee') return;
        const p = place();
        if (vu[vu.length - 1] !== p) vu.push(p);
      });
      return () => vu.join('');
    };
    const avecAPart = { aPart: D.colonnesDuRefus, paires: D.PAIRES_DEVIS };
    const vu = {};
    /* a. réécritures inchangées */
    const inchangee = async (nom, { erreur, porte, neuve = false }) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: neuve ? [] : [ligne('L1')] });
      const place = suivre(f);
      const v1 = neuve ? ligne('L1') : ligne('L1', { quantiteMilliemes: 2000 });
      const fois = erreur === deadlock ? 2 : 1;
      for (let i = 0; i < fois; i += 1) {
        b.commandes.push(erreur === 'pendre' ? { quand: (op) => op.id === 'L1', pendre: true } : { quand: (op) => op.id === 'L1', erreur: erreur() });
      }
      f.ligne(v1);
      await f.attendre(300);
      const avant = f.etatDe('L1');
      const n0 = b.journal.length;
      /* Le renvoi échoue de nouveau — pour l'insertion sans réponse, par le
         réseau, AVANT d'arriver (sinon la base, qui l'a déjà, rendrait 23505
         et la relecture la dirait enregistrée). */
      for (let i = 0; i < fois; i += 1) {
        b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30, erreur: erreur === 'pendre' ? reseau() : erreur() });
      }
      if (porte === 'ligne') f.ligne({ ...v1 });
      else if (porte === 'rien') f.modifierLigne('L1', {});
      else f.modifierLigne('L1', { quantiteMilliemes: v1.quantiteMilliemes });
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      vu[nom] = { avant, juste, apres: json(f.renvoisEnRoute()), etat: f.etatDe('L1'), parties: b.journal.length - n0, place: place() };
    };
    await inchangee('aLigne', { erreur: reseau, porte: 'ligne' });
    await inchangee('aModifier', { erreur: reseau, porte: 'modifier' });
    await inchangee('aRien', { erreur: reseau, porte: 'rien' });
    await inchangee('aInsertion', { erreur: 'pendre', porte: 'ligne', neuve: true });
    await inchangee('aInterblocage', { erreur: deadlock, porte: 'modifier' });
    /* b. réécritures changées */
    const changee = async (nom, porte) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      const place = suivre(f);
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: reseau() });
      f.ligne(ligne('L1', { quantiteMilliemes: 2000 }));
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30, erreur: reseau() });
      if (porte === 'ligne') f.ligne(ligne('L1', { quantiteMilliemes: 2000, prixUnitaireCentimes: 4200 }));
      else f.modifierLigne('L1', { prixUnitaireCentimes: 4200 });
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      vu[nom] = { juste, etat: f.etatDe('L1'), place: place() };
    };
    await changee('bLigne', 'ligne');
    await changee('bModifier', 'modifier');
    /* c. un refus définitif, la carte fermée sans changer (le chemin de
       `enregistrerLigne` : `refusDeLaLigne`, `renvoyerLaLigne`, puis `ligne`) */
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      const place = suivre(f);
      const v1 = ligne('L1', { quantiteMilliemes: 2000 });
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: prix23514() });
      f.ligne(v1);
      await f.attendre(300);
      const refus = D.refusDeLaLigne({ definitif: ERR.estUnRefusDefinitif(f.erreurDe('L1')), devisEnBase: f.devisEnBase() });
      const n0 = b.journal.length;
      const part = D.renvoyerLaLigne({ valeurs: { ...v1 }, derniere: v1, etat: f.etatDe('L1'), refus });
      if (part) f.ligne({ ...v1 });
      await f.attendre(300);
      vu.cDefinitif = { refus, part, parties: b.journal.length - n0, etat: f.etatDe('L1'), place: place() };
    }
    /* d. le reste d'un refus partiel (16) */
    const resteDuRefus = async (nom, derriere) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')], ...avecAPart });
      const place = suivre(f);
      b.commandes.push({ quand: (op) => op.quoi === 'devis' && 'remiseCentiemes' in (op.valeurs || {}), avant: 30, erreur: plafondJq() });
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30 });
      if (derriere) b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      const marques = [];
      f.abonner((e) => { if (e.type === 'etat' && e.cle === 'devis' && e.etat === 'en_cours') marques.push(json(f.renvoisEnRoute())); });
      f.devis({ objet: 'Objet 2', remiseCentiemes: 5000 });
      if (derriere) f.modifierLigne('L1', { quantiteMilliemes: 3000 });
      await f.attendre(400);
      vu[nom] = {
        place: place(), marques, etat: f.etatDe('devis'), retenue: !!f.retenueDe('devis'), l1: f.etatDe('L1'),
        ordre: b.journal.map((o) => `${o.quoi}:${Object.keys(o.valeurs || {}).join(',')}`),
      };
    };
    await resteDuRefus('dDerriere', true);
    await resteDuRefus('dSeul', false);
    /* e. une écriture faite PENDANT le vol d'un renvoi */
    const pendantLeVol = async (nom, rate) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      const place = suivre(f);
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: reseau() });
      f.ligne(ligne('L1', { quantiteMilliemes: 2000 }));
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      b.commandes.push(rate ? { quand: (op) => op.id === 'L1', avant: 30, erreur: reseau() } : { quand: (op) => op.id === 'L1', avant: 30 });
      const apresLeRenvoi = [];
      f.abonner((e) => { if (e.type === 'etat' && e.cle === 'L1') apresLeRenvoi.push(`${e.etat}:${json(f.renvoisEnRoute())}`); });
      f.reessayer('L1');
      f.modifierLigne('L1', { prixUnitaireCentimes: 2500 });
      await f.attendre(400);
      vu[nom] = { place: place(), suite: apresLeRenvoi.filter((x, i) => i === 0 || x !== apresLeRenvoi[i - 1]), etat: f.etatDe('L1') };
    };
    await pendantLeVol('eReussie', false);
    await pendantLeVol('eRatee', true);
    /* …le renvoi lui-même ÉCHOUE, et ce qui a été voulu pendant son vol
       repart : le chemin de « Poste suivant » (la carte enregistrée deux
       fois, la seconde pendant le vol de la première), puis une correction */
    const renvoiRate = async (nom, change) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      const place = suivre(f);
      const v1 = ligne('L1', { quantiteMilliemes: 2000 });
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: reseau() });
      f.ligne(v1);
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30, erreur: reseau() });
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30, erreur: reseau() });
      const suite = [];
      f.abonner((e) => { if (e.type === 'etat' && e.cle === 'L1') suite.push(`${e.etat}:${json(f.renvoisEnRoute())}`); });
      f.ligne({ ...v1 });
      f.ligne(change ? { ...v1, prixUnitaireCentimes: 4300 } : { ...v1 });
      await f.attendre(400);
      vu[nom] = { place: place(), parties: b.journal.filter((o) => o.id === 'L1').length, etat: f.etatDe('L1'),
        suite: suite.filter((x, i) => i === 0 || x !== suite[i - 1]) };
    };
    await renvoiRate('eRenvoiRateMeme', false);
    await renvoiRate('eRenvoiRateCorrige', true);
    /* f. l'en-tête */
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      const place = suivre(f);
      b.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: reseau() });
      f.devis({ delaiExecution: 'Trois semaines' });
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30, erreur: reseau() });
      f.devis({ delaiExecution: 'Trois semaines' });
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      vu.fInchange = { juste, place: place(), etat: f.etatDe('devis') };
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30, erreur: reseau() });
      const place2 = suivre(f);
      f.devis({ delaiExecution: 'Quatre semaines' });
      vu.fChange = { juste: json(f.renvoisEnRoute()) };
      await f.attendre(300);
      vu.fChange.place = place2();
    }
    /* …un renvoi de l'en-tête qui échoue, RIEN n'attendant derrière : la
       marque tombe pour de bon — la suppression du brouillon qui suit n'est
       pas un renvoi */
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      b.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: reseau() });
      f.devis({ objet: 'Essai' });
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30, erreur: reseau() });
      f.reessayer('devis');
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.quoi === 'devis' && op.action === 'supprimer', avant: 30 });
      const fin = f.supprimerDevis().then(() => true, (x) => String(x));
      await pause(10);
      vu.fSuppression = { etat: f.etatDe('devis'), juste: json(f.renvoisEnRoute()) };
      vu.fSuppression.fin = await fin;
    }
    const tenue = async (nom, geste) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')], ...avecAPart });
      b.commandes.push({ quand: (op) => op.quoi === 'devis' && 'remiseCentiemes' in (op.valeurs || {}), erreur: plafondJq() });
      f.devis({ objet: 'Objet 2', remiseCentiemes: 5000 });
      await f.attendre(300);
      const avant = { etat: f.etatDe('devis'), retenue: !!f.retenueDe('devis') };
      const place = suivre(f);
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30 });
      f.devis(geste);
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      vu[nom] = { avant, juste, place: place(), etat: f.etatDe('devis'), retenue: !!f.retenueDe('devis') };
    };
    await tenue('fTenueObjet', { objet: 'Objet 3' });
    await tenue('fTenueReduction', { remiseCentiemes: 2000 });
    /* g. le retrait */
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1'), ligne('L2', { ordre: 2000 })] });
      const place = suivre(f);
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: reseau() });
      f.retirerLigne('L1');
      await f.attendre(300);
      const avant = { etat: f.etatDe('L1'), retiree: f.retiree('L1') };
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30, erreur: reseau() });
      f.retirerLigne('L1');
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      vu.gDeNouveau = { avant, juste, place: place(), etat: f.etatDe('L1') };
      /* une ligne en échec (une modification), puis retirée : un nouveau geste */
      b.commandes.push({ quand: (op) => op.id === 'L2', erreur: reseau() });
      f.modifierLigne('L2', { prixUnitaireCentimes: 7 });
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'L2', avant: 30 });
      f.retirerLigne('L2');
      vu.gPremier = { juste: json(f.renvoisEnRoute()) };
      await f.attendre(300);
      vu.gPremier.etat = f.etatDe('L2');
    }
    /* h. hors base */
    {
      const b = fausseBase();
      b.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: Object.assign(new Error('refus'), { code: '42501' }) });
      const f = fabriquer(b);
      f.ligne(ligne('L1'));
      await f.attendre(300);
      const avant = [f.etatDe('devis'), f.etatDe('L1'), f.devisEnBase()];
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30, erreur: Object.assign(new Error('refus'), { code: '42501' }) });
      f.ligne(ligne('L1'));
      vu.hHorsBase = { avant, juste: json(f.renvoisEnRoute()) };
      await f.attendre(300);
    }
    const inchangeesOk = ['aLigne', 'aModifier', 'aRien', 'aInsertion', 'aInterblocage'].every((k) => vu[k].avant === 'echec'
      && vu[k].juste === '["L1"]' && vu[k].apres === '[]' && vu[k].etat === 'echec' && vu[k].parties >= 1 && vu[k].place === '—G');
    verifier('j quater. la MARQUE DU RENVOI par les AUTRES PORTES (relecture 7, RELIRE6-1, -2, -3), la place recalculée à CHAQUE événement : '
      + 'une réécriture INCHANGÉE d’une ligne en échec (`ligne()`, `modifierLigne()` mêmes valeurs ou rien ; une modification ou une insertion '
      + 'sans réponse, un interblocage deux fois) est marquée et la place ne bouge pas ; CHANGÉE, elle ne l’est pas (le saut nommé) ; un refus '
      + 'définitif refermé sans changer n’envoie rien ; le reste d’un refus partiel est marqué, avec ou sans écriture derrière (la ligne qui '
      + 'attendait passe AVANT lui) ; une écriture faite PENDANT le vol d’un renvoi reste marquée jusqu’à la sortie de « en cours », sans '
      + 'rebond si elle échoue, et repart marquée si c’est le renvoi qui échoue (« Poste suivant », la carte enregistrée deux fois) ; '
      + 'l’en-tête réécrit inchangé, ou changé pendant qu’un refus est TENU, est marqué — la réduction changée ou un '
      + 'champ changé sans refus tenu ne l’est pas ; retirer DE NOUVEAU un retrait en échec est marqué, retirer une ligne en échec ne l’est pas ; '
      + 'hors base, rien',
    inchangeesOk
      && ['bLigne', 'bModifier'].every((k) => vu[k].juste === '[]' && vu[k].etat === 'echec' && vu[k].place === '—G—G')
      && vu.cDefinitif.refus && vu.cDefinitif.part === false && vu.cDefinitif.parties === 0 && vu.cDefinitif.etat === 'echec' && vu.cDefinitif.place === '—G'
      && ['dDerriere', 'dSeul'].every((k) => vu[k].place === '—G' && vu[k].etat === 'echec' && vu[k].retenue
        && vu[k].marques.length >= 2 && vu[k].marques[vu[k].marques.length - 1] === '["devis"]')
      && json(vu.dDerriere.ordre) === json(['devis:objet,remiseCentiemes', 'ligne:quantiteMilliemes', 'devis:objet'])
      && vu.dDerriere.l1 === 'enregistree' && json(vu.dSeul.ordre) === json(['devis:objet,remiseCentiemes', 'devis:objet'])
      && vu.eReussie.place === '—G—' && vu.eReussie.etat === 'enregistree'
      && json(vu.eReussie.suite) === json(['en_cours:["L1"]', 'enregistree:[]'])
      && vu.eRatee.place === '—G' && vu.eRatee.etat === 'echec' && json(vu.eRatee.suite) === json(['en_cours:["L1"]', 'echec:[]'])
      && ['eRenvoiRateMeme', 'eRenvoiRateCorrige'].every((k) => vu[k].place === '—G' && vu[k].parties === 3 && vu[k].etat === 'echec'
        && json(vu[k].suite) === json(['en_cours:["L1"]', 'echec:[]', 'en_cours:["L1"]', 'echec:[]']))
      && vu.fInchange.juste === '["devis"]' && vu.fInchange.place === '—G' && vu.fInchange.etat === 'echec'
      && vu.fChange.juste === '[]' && vu.fChange.place === 'G—G'
      && vu.fSuppression.etat === 'en_cours' && vu.fSuppression.juste === '[]' && vu.fSuppression.fin === true
      && vu.fTenueObjet.avant.etat === 'echec' && vu.fTenueObjet.avant.retenue && vu.fTenueObjet.juste === '["devis"]'
      && vu.fTenueObjet.place === 'G' && vu.fTenueObjet.etat === 'echec' && vu.fTenueObjet.retenue
      && vu.fTenueReduction.juste === '[]' && vu.fTenueReduction.place === 'G—' && vu.fTenueReduction.etat === 'enregistree' && !vu.fTenueReduction.retenue
      && vu.gDeNouveau.avant.etat === 'echec' && vu.gDeNouveau.avant.retiree && vu.gDeNouveau.juste === '["L1"]'
      && vu.gDeNouveau.place === '—G' && vu.gDeNouveau.etat === 'echec'
      && vu.gPremier.juste === '[]' && vu.gPremier.etat === null
      && json(vu.hHorsBase.avant) === json(['echec', 'echec', false]) && vu.hHorsBase.juste === '[]',
    json(vu));
  }
  /* j quinquies. CE QUI N'EST PAS UN RENVOI NE PORTE PAS LA MARQUE (banc de
     la relecture 7 de 2b-1, 08/11/2026). « j quater » prouvait qu'une
     réécriture INCHANGÉE d'une entrée en échec est marquée ; rien ne
     prouvait les gardes qui disent ce qui n'en est PAS une, et le banc les a
     retirées une à une sans qu'aucun contrôle ne rougisse :
       a. une colonne de l'en-tête JAMAIS voulue avant, écrite après un échec
          (`changements` lu à l'envers ne la voyait pas) ;
       b. la réduction tenue sur la PAIRE ENTIÈRE — les deux colonnes, comme
          l'écran les a (`PAIRES_DEVIS`) —, puis le pourcentage changé : un
          nouveau geste, même si l'autre colonne de la paire, elle, n'a pas
          bougé (`some` au lieu de `every` dans `tenueGardee`) ; l'objet
          changé, lui, reste marqué (le refus tenu le restera) ;
       c. une ligne RETIRÉE en échec, remise telle quelle — par `ligne()` et
          par `modifierLigne()` : la remettre est un nouveau geste ;
       d. une ligne « LOCALE » et en échec — rendue incomplète pendant son
          vol, qui échoue —, remise telle quelle : par `ligne()` (le geste
          « L'abandonner » de l'écran, `abandonnerIncompletes`) et par
          `modifierLigne()` ;
       e. une réécriture inchangée PENDANT un vol ORDINAIRE (rien n'est en
          échec) : la carte enregistrée deux fois par « Poste suivant » sur
          une ligne qui n'a pas échoué, par `ligne()`, par `modifierLigne()`,
          et l'en-tête par `devis()` — sans la garde « en échec », la place
          se réservait pendant une écriture ordinaire (mesuré par la vraie
          file). */
  {
    const reseau = () => new TypeError('Failed to fetch');
    const plafondJq = () => Object.assign(new Error('new row for relation "devis" violates check constraint "devis_plafond_check"'), { code: '23514' });
    const vu = {};
    /* a. une colonne jamais voulue */
    {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      b.commandes.push({ quand: (op) => op.quoi === 'devis', erreur: reseau() });
      f.devis({ objet: 'Essai' });
      await f.attendre(300);
      const avant = { etat: f.etatDe('devis'), voulue: 'delaiExecution' in ((f.entreesVoulues().find((e) => e.cle === 'devis') || {}).voulu || {}) };
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30 });
      f.devis({ delaiExecution: 'Trois semaines' });
      vu.aNouvelle = { avant, juste: json(f.renvoisEnRoute()) };
      await f.attendre(300);
      vu.aNouvelle.etat = f.etatDe('devis');
    }
    /* b. la paire entière tenue */
    const paire = async (geste) => {
      const b = fausseBase();
      const f = fabriquer(b, {
        devisEnBase: true, devis: { source: 'manuelle', objet: 'O', remiseCentiemes: null, remiseCentimes: null },
        lignesEnBase: [ligne('L1')], aPart: D.colonnesDuRefus, paires: D.PAIRES_DEVIS,
      });
      b.commandes.push({ quand: (op) => op.quoi === 'devis' && 'remiseCentiemes' in (op.valeurs || {}), erreur: plafondJq() });
      f.devis({ objet: 'O2', remiseCentiemes: 5000 });
      await f.attendre(300);
      const d = f.entreesVoulues().find((e) => e.cle === 'devis') || {};
      const avant = { etat: f.etatDe('devis'), tenue: json(d.tenue) };
      b.commandes.push({ quand: (op) => op.quoi === 'devis', avant: 30 });
      f.devis(geste);
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      return { avant, juste };
    };
    vu.bPourcentage = await paire({ remiseCentiemes: 2000 });
    vu.bObjet = await paire({ objet: 'O3' });
    /* c. une ligne retirée en échec, remise telle quelle (ses colonnes devenues inconnues : elle repart) */
    const retireeRemise = async (porte) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      const v = ligne('L1', { quantiteMilliemes: 2000 });
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: reseau() });
      f.ligne(v);
      await f.attendre(300);
      b.commandes.push({ quand: (op) => op.id === 'L1', erreur: reseau() });
      f.retirerLigne('L1');
      await f.attendre(300);
      const avant = { etat: f.etatDe('L1'), retiree: f.retiree('L1') };
      const n0 = b.journal.length;
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      if (porte === 'ligne') f.ligne({ ...v }); else f.modifierLigne('L1', {});
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      return { avant, juste, parties: b.journal.length - n0, etat: f.etatDe('L1') };
    };
    vu.cLigne = await retireeRemise('ligne');
    vu.cModifier = await retireeRemise('modifier');
    /* d. une ligne « locale » et en échec, remise telle quelle */
    const localeRemise = async (porte) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      const v = ligne('L1', { quantiteMilliemes: 2000 });
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30, erreur: reseau() });
      f.ligne(v);
      await pause(5);
      f.marquerLocale('L1', { ...v, prixUnitaireCentimes: null });
      await f.attendre(300);
      const e = f.entreesVoulues().find((x) => x.cle === 'L1') || {};
      const avant = { etat: f.etatDe('L1'), locale: e.locale === true };
      const n0 = b.journal.length;
      b.commandes.push({ quand: (op) => op.id === 'L1', avant: 30 });
      if (porte === 'ligne') f.ligne({ ...v }); else f.modifierLigne('L1', {});
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      return { avant, juste, parties: b.journal.length - n0, etat: f.etatDe('L1') };
    };
    vu.dLigne = await localeRemise('ligne');
    vu.dModifier = await localeRemise('modifier');
    /* e. une réécriture inchangée pendant un vol ORDINAIRE */
    const pendantUnVolOrdinaire = async (porte) => {
      const b = fausseBase();
      const f = fabriquer(b, { devisEnBase: true, lignesEnBase: [ligne('L1')] });
      const v = ligne('L1', { quantiteMilliemes: 2000 });
      const cle = porte === 'devis' ? 'devis' : 'L1';
      b.commandes.push({ quand: (op) => (cle === 'devis' ? op.quoi === 'devis' : op.id === 'L1'), avant: 30 });
      const vus = [];
      f.abonner((x) => { if (x.type === 'etat') vus.push(json(f.renvoisEnRoute())); });
      if (porte === 'devis') f.devis({ objet: 'Essai' }); else f.ligne(v);
      await pause(5);
      const pendant = f.etatDe(cle);
      if (porte === 'devis') f.devis({ objet: 'Essai' });
      else if (porte === 'ligne') f.ligne({ ...v });
      else f.modifierLigne('L1', {});
      const juste = json(f.renvoisEnRoute());
      await f.attendre(300);
      return { pendant, juste, jamais: vus.every((x) => x === '[]'), etat: f.etatDe(cle) };
    };
    vu.eLigne = await pendantUnVolOrdinaire('ligne');
    vu.eModifier = await pendantUnVolOrdinaire('modifier');
    vu.eDevis = await pendantUnVolOrdinaire('devis');
    verifier('j quinquies. CE QUI N’EST PAS UN RENVOI ne porte pas la marque (banc de la relecture 7) : une colonne de l’en-tête jamais '
      + 'voulue, écrite après un échec ; la réduction tenue sur la PAIRE ENTIÈRE puis le pourcentage changé (l’objet changé, lui, reste '
      + 'marqué) ; une ligne RETIRÉE en échec remise telle quelle, par `ligne()` et `modifierLigne()` ; une ligne « LOCALE » en échec remise '
      + 'telle quelle (« L’abandonner ») ; une réécriture inchangée pendant un vol ORDINAIRE — ligne, modification, en-tête',
    vu.aNouvelle.avant.etat === 'echec' && vu.aNouvelle.avant.voulue === false && vu.aNouvelle.juste === '[]' && vu.aNouvelle.etat === 'enregistree'
      && ['bPourcentage', 'bObjet'].every((k) => vu[k].avant.etat === 'echec' && vu[k].avant.tenue === json(['remiseCentiemes', 'remiseCentimes']))
      && vu.bPourcentage.juste === '[]' && vu.bObjet.juste === '["devis"]'
      && ['cLigne', 'cModifier'].every((k) => vu[k].avant.etat === 'echec' && vu[k].avant.retiree === true && vu[k].juste === '[]'
        && vu[k].parties >= 1 && vu[k].etat === 'enregistree')
      && ['dLigne', 'dModifier'].every((k) => vu[k].avant.etat === 'echec' && vu[k].avant.locale === true && vu[k].juste === '[]'
        && vu[k].parties >= 1 && vu[k].etat === 'enregistree')
      && ['eLigne', 'eModifier', 'eDevis'].every((k) => vu[k].pendant === 'en_cours' && vu[k].juste === '[]' && vu[k].jamais
        && vu[k].etat === 'enregistree'),
    json(vu));
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
/* 2b-2 (49.7) : la réponse « à quel titre », son témoin, et les deux
   réponses du chantier neuf — JAMAIS `chantier_neuf_conso_le`, que la base
   seule pose (`tient_le_devis()`). */
const QUI_ET_CHANTIER_2B2 = ['pour_qui', 'pour_qui_client', 'chantier_neuf_conso', 'chantier_neuf_tva'];
/* 2b-3 (49.4 quater, 49.7) : deux réponses de l'artisan sur le devis — la
   décennale (« Le chantier », P1 = A du 12/11) et le moment où l'acompte est
   payé (« Conditions », P2) —, et une sur la ligne (la réparation urgente,
   49.3 bis). Aucune date : personne ne la lirait. */
const DECENNALE_ET_SIGNATURE_2B3 = ['engage_decennale', 'acompte_a_la_signature'];
const ENTETE_DEVIS = ['client_id', 'quote_request_id', 'sos_request_id', 'objet', 'lieu_adresse', 'lieu_code_postal', 'lieu_ville',
  'delai_execution', 'retenue_garantie_centiemes', ...CONDITIONS_2A, ...QUI_ET_CHANTIER_2B2, ...DECENNALE_ET_SIGNATURE_2B3];
const COLONNES_LIGNE = ['ordre', 'type', 'designation', 'quantite_milliemes', 'unite', 'prix_unitaire_centimes', 'taux_tva_centiemes',
  'offert', 'main_oeuvre', 'fourniture_non_comprise', 'surface_sol_milliemes', 'surface_murs_milliemes', 'urgence'];
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
/* …ET LES CINQ DE 2b-2 (49.4 ter) : « à quel titre » le client commande et
   son témoin, le chantier neuf (deux questions) et la date du « Oui » —
   toutes nullables, sans défaut, sans contrainte qui nomme `client_id` (D4). */
const AJOUTS_2B2 = [
  'devis: add column if not exists pour_qui text',
  'devis: add column if not exists pour_qui_client uuid',
  'devis: add column if not exists chantier_neuf_conso boolean',
  'devis: add column if not exists chantier_neuf_conso_le timestamptz',
  'devis: add column if not exists chantier_neuf_tva boolean',
];
/* …ET LES TROIS DE 2b-3 (12/11/2026) : la réparation urgente d'une ligne
   (49.3 bis, `not null default false` — une ligne existante n'est pas
   urgente, et la contrainte `devis_ligne_urgence_check` ne la nomme que sur
   un poste) ; la décennale et le moment de l'acompte sur le devis (49.4
   quater, nullables SANS défaut : le vide est une réponse à part — pour la
   décennale, « Oui » par prudence). */
const AJOUTS_2B3 = [
  'devis_lignes: add column if not exists urgence boolean not null default false',
  'devis: add column if not exists engage_decennale boolean',
  'devis: add column if not exists acompte_a_la_signature boolean',
];
const AJOUTS_PERMIS = [...AJOUTS_2A, ...AJOUTS_2B2, ...AJOUTS_2B3];

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
      'total_ttc_options_centimes bigint +',
      /* 2b-2 (49.4 ter) : la réponse « à quel titre » et son témoin (écrits
         par l'artisan), le chantier neuf (deux réponses de l'artisan) et la
         date du « Oui » (posée par la BASE, `tient_le_devis()` ; jamais un
         droit de colonne, 49.7). */
      'pour_qui text', 'pour_qui_client uuid', 'chantier_neuf_conso boolean', 'chantier_neuf_conso_le timestamptz',
      'chantier_neuf_tva boolean',
      /* 2b-3 (49.4 quater) : la décennale (rang 11 de la liste) et le moment
         de l'acompte (rang 10) — deux réponses de l'artisan, nullables, sans
         défaut ni date. */
      'engage_decennale boolean', 'acompte_a_la_signature boolean'],
    devis_lignes: ['id uuid +', 'devis_id uuid +', 'ordre integer +', 'type text +', 'designation text', 'quantite_milliemes bigint',
      'unite text', 'prix_unitaire_centimes bigint', 'taux_tva_centiemes integer', 'total_centimes bigint', 'offert boolean +',
      'main_oeuvre boolean +', 'fourniture_non_comprise boolean +', 'surface_sol_milliemes bigint', 'surface_murs_milliemes bigint',
      'generation bigint +', 'modifie_le timestamptz +',
      /* 2b-3 (49.3 bis) : la réparation urgente, posée APRÈS le `create
         table` (une base déjà en place la reçoit par `add column`). */
      'urgence boolean +'],
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
  const horsListe = ajouts.filter((a) => !AJOUTS_PERMIS.includes(a));
  const malComptes = AJOUTS_PERMIS.filter((a) => ajouts.filter((x) => x === a).length !== 1 || !ajoutsS49.includes(a));
  verifier('…et rien ne s’y ajoute plus bas : sur ces tables, le seul `add` est `add constraint <nom> check` (ni `add column`, ni '
    + '`add if not exists`, ni une contrainte anonyme) — sauf les dix colonnes des conditions (lot 2a), les cinq de 2b-2 (49.4 ter) '
    + 'et les trois de 2b-3 (49.3 bis, 49.4 quater), chacune une fois, dans la section 49', horsListe.length === 0 && malComptes.length === 0 && ajouts.length === AJOUTS_PERMIS.length,
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
  /* 2b-2 : `devis_pour_qui_check` est posée par la base ; `CONTRAINTES_DEVIS`
     (devis.js) la reçoit avec le calcul — l'union la compte une fois, avant
     comme après. La PARITÉ, elle, est tenue par la section 16. */
  const CONTRAINTES_ATTENDUES = {
    devis: [...new Set([...D.CONTRAINTES_DEVIS, 'devis_pour_qui_check'])].sort(),
    /* 2b-3 : `devis_ligne_urgence_check` (49.5) est posée par la base ;
       `CONTRAINTES_LIGNE` (devis.js) la reçoit avec le calcul — même pont
       que `devis_pour_qui_check` en 2b-2 : l'union la compte une fois, avant
       comme après. La parité reste tenue par la section 16. */
    devis_lignes: [...new Set([...D.CONTRAINTES_LIGNE, 'devis_ligne_urgence_check'])].sort(),
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
    if (/^add column if not exists /.test(a.action) && AJOUTS_PERMIS.includes(`${a.table}: ${a.action}`)) return `colonne ${a.action}`;
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
    + 'contrainte refaite (`drop constraint if exists` puis `add constraint … check`), ou une des dix-huit colonnes du lot 2a, de 2b-2 et de 2b-3 — ni '
    + '`alter column` (un défaut, un type, un `drop not null`), ni `drop column`, ni `rename`, ni `owner to`, ni `disable`, ni '
    + '`not valid`',
  alters.length >= 74 && horsListe.length === 0, horsListe.join(' | ') || `${alters.length} lus — le lecteur a perdu sa cible`);
  verifier(`…chaque table voit sa RLS posée une fois, et chacune des ${tousLesNoms.length} contraintes est retirée UNE fois puis `
    + 'reposée UNE fois, dans cet ordre et dans la section 49 — aucune n’est refaite plus bas, sous le même nom, avec une autre règle',
  tousLesNoms.length === 34 && malComptees.length === 0 && desordre.length === 0, [...malComptees, ...desordre].join(' | '));
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
  /* RESSERRÉE AU LOT 2b-1 (05/11/2026, cahier §3.6, critique B5) — UNE
     LISTE D'INTERDITS PAR FONCTION, et plus une liste commune.
     `motifs_refus_remise` est née (section 49.9) : elle DOIT nommer
     `public.devis` (c'est le devis qu'elle juge), donc l'interdit de la
     table ne vaut plus que pour `emetteur_incomplet`, qui n'a aucune raison
     de lire un devis. En échange, la nouvelle reçoit des interdits que
     l'ancienne liste n'avait pas — la critique B5 a fait passer QUATRE
     lectures de l'origine sous les quatre motifs d'avant (prouvé) :
     `to_jsonb(d)->>'source'`, un alias autre que `d` (`x.source`), une
     variable `%rowtype` (`v.source`), et la TABLE des demandes sans sa
     colonne (`public.quote_requests`). D'où, pour elle seule :
       - le MOT `source`, sous AUCUNE forme (chaînes comprises) — elle ne
         lit pas `entreprise_registre`, elle n'en a aucun usage ;
       - les liens et les tables d'origine (`quote_request_id`,
         `sos_request_id`, `quote_requests`, `sos_requests`,
         `callback_requests`, `demandes`, `demande_reponses`), et les
         BLOCAGES (`blocages`, `est_masque`, `peut_faire_un_devis`) : la
         liste ne voit pas le blocage (cahier §3.2), c'est la remise de 2c
         qui le refusera ;
       - une origine écrite en toutes lettres — les trois de l'addendum
         (`'qr'`, `'visite'`, `'dossier'`) ET les trois valeurs de
         `devis.source` (`'manuelle'`, `'demande'`, `'urgence'`) ;
       - toute lecture d'une LIGNE ENTIÈRE, qui contient l'origine sans la
         nommer : `select *`, `x.*`, `%rowtype`, une variable `record`,
         `to_json`/`to_jsonb`, `row_to_json`, `json(b)_populate_record`,
         `json(b)_agg`, `hstore(` — `count(*)` reste permis (il ne lit
         aucune colonne) ;
       - le SQL FABRIQUÉ (`execute`, `format(`) et les identifiants écrits
         en `U&"…"` : deux façons d'écrire un mot sans l'écrire.
     `emetteur_incomplet` GARDE ses interdits d'avant, et aussi la table du
     devis sous toutes ses formes ; elle lit légitimement `r.source` — la
     source d'une ENTREPRISE (`entreprise_registre`) — : le mot n'y est pas
     interdit.
     UN CONTRÔLE DE TEXTE NE VOIT QUE LA FORME QU'IL CHERCHE : la preuve qui
     compte est la PROPRIÉTÉ, dans l'essai (`essais-section-49-remise.sql`,
     cas 13 : trois devis identiques sauf leurs liens et leur source rendent
     la MÊME liste) ; et la forme ENTIÈRE de la fonction, comparée plus bas
     (section 40), arrête toute réécriture. Ce qui est ici dit POURQUOI. */
  const MOTIFS = [{ nom: 'emetteur_incomplet', naitAuLot: '0a' }, { nom: 'motifs_refus_remise', naitAuLot: '2b-1' }];
  const trouvees = MOTIFS.map((m) => ({ ...m, corps: corpsDe(m.nom) || null, n: FONCTIONS.filter((f) => f.nom === m.nom).length }));
  /* `count(*)` ôté d'abord : c'est la seule étoile permise. */
  const sansCompte = (t) => (t || '').replace(/\bcount\s*\(\s*\*\s*\)/gi, 'count(1)');
  const ORIGINES = [
    [/\bquote_request_id\b/i, '`quote_request_id`', 'code'],
    [/\bsos_request_id\b/i, '`sos_request_id`', 'code'],
    [/'(qr|visite|dossier)'/i, 'une origine écrite en toutes lettres (« qr », « visite », « dossier »)', 'tout'],
  ];
  const INTERDITS_PAR_FONCTION = {
    emetteur_incomplet: [
      [/\bpublic\s*\.\s*devis(_lignes|_tva)?\b|\b(from|join|into|update|table|only|using)\s+devis(_lignes|_tva)?\b/i,
        'une table du devis (`public.devis`, `devis_lignes`, `devis_tva`)', 'code'],
      ...ORIGINES,
    ],
    motifs_refus_remise: [
      ...ORIGINES,
      [/source/i, 'le mot `source`, sous une forme ou une autre', 'tout'],
      [/\b(quote_requests|sos_requests|callback_requests|demandes|demande_reponses)\b/i,
        'une TABLE d’origine (`quote_requests`, `sos_requests`, `callback_requests`, `demandes`, `demande_reponses`)', 'code'],
      [/\b(blocages|est_masque|peut_faire_un_devis)\b/i, 'le BLOCAGE (`blocages`, `est_masque`, `peut_faire_un_devis`)', 'code'],
      [/'(manuelle|demande|urgence)'/i, 'une valeur de `devis.source` (« manuelle », « demande », « urgence »)', 'tout'],
      [/\bselect\s+(?:all\s+|distinct\s+)?\*|\.\s*\*|,\s*\*|\(\s*\*\s*\)|\breturning\s+\*/i,
        'une ligne entière par une étoile (`select *`, `x.*`) — `count(*)` est permis', 'etoile'],
      [/%\s*rowtype\b|\brecord\b/i, 'une variable qui porte une ligne entière (`%rowtype`, `record`)', 'code'],
      [/\b(to_jsonb?|row_to_json|jsonb?_populate_record(set)?|jsonb?_agg|hstore)\s*\(/i,
        'une ligne entière passée à `to_jsonb`, `row_to_json`, `json_populate_record`, `json_agg` ou `hstore`', 'code'],
      [/\bexecute\b|\bformat\s*\(/i, 'du SQL FABRIQUÉ (`execute`, `format(`)', 'code'],
      [/\bU&\s*["']/i, 'un identifiant ou une chaîne écrits en `U&"…"` (un mot écrit sans l’écrire)', 'tout'],
    ],
  };
  const lu = (texte, ou) => {
    if (ou === 'code') return sansChaines(texte);
    if (ou === 'etoile') return sansChaines(sansCompte(texte));
    return texte;
  };
  const fautesDe = (m) => (INTERDITS_PAR_FONCTION[m.nom] || []).filter(([re, , ou]) => re.test(lu(m.corps, ou)))
    .map(([, quoi]) => `${m.nom} nomme ${quoi}`);
  verifier('`emetteur_incomplet` est lue (sinon ce contrôle n’éprouverait rien)', !!trouvees[0].corps && trouvees[0].corps.length > 500);
  verifier('`motifs_refus_remise` (lot 2b-1) est lue, UNE définition, et elle nomme bien `public.devis` (sinon les interdits ci-dessous '
    + 'n’éprouveraient rien)', trouvees[1].n === 1 && !!trouvees[1].corps && trouvees[1].corps.length > 2000
    && /\bfrom\s+public\.devis\s+d\b/i.test(trouvees[1].corps), `${trouvees[1].n} définition(s)`);
  const fautesE = trouvees[0].corps ? fautesDe(trouvees[0]) : ['introuvable'];
  verifier('D4-c : `emetteur_incomplet` ne nomme AUCUNE table du devis, ni `quote_request_id`, `sos_request_id`, ni une origine '
    + '(qr, visite, dossier)', fautesE.length === 0, `${fautesE.join(' ; ')} — un motif de l’entreprise qui lirait un devis ferait `
    + 'dépendre la fiche « Mon entreprise » d’un devis particulier.');
  const fautesR = trouvees[1].corps ? fautesDe(trouvees[1]) : ['introuvable'];
  verifier('D4-c resserrée (lot 2b-1) : `motifs_refus_remise` peut nommer `public.devis`, mais JAMAIS le mot `source`, un lien ou une '
    + 'table d’origine, le blocage, une origine ou une valeur de la source écrites en toutes lettres, une ligne entière (`select *`, '
    + '`x.*`, `%rowtype`, `record`, `to_jsonb`, `row_to_json`…), du SQL fabriqué ni un identifiant `U&"…"` — un `count(*)` reste permis',
  fautesR.length === 0, `${fautesR.join(' ; ')} — un motif de refus de remise qui dépend d’une origine rendrait le QR, la `
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

console.log('\n  15. les contraintes — trente-quatre, toutes nommées en `_check`');
{
  const noms = CHECKS49.map((c) => c.nom);
  const tables = [...new Set(CHECKS49.map((c) => c.table))].sort();
  /* NOMMÉES, table par table : vingt-trois au lot 1, neuf de plus au lot 2a
     (six pour les conditions, `devis_calculs_check` posée APRÈS son
     rattrapage en 49.6 ter, et deux sur la ventilation — la part de
     réduction, et « un taux disparu est à zéro en entier »), une en 2b-2
     (`devis_pour_qui_check`) et une en 2b-3 (`devis_ligne_urgence_check` :
     la réparation urgente, sur un POSTE seulement — À PART de
     `devis_ligne_forme_check`, qui ne change pas). Un nombre seul laissait
     passer une contrainte remplacée par une autre. */
  const ATTENDUES = {
    devis: ['devis_acompte_check', 'devis_acompte_nature_check', 'devis_acompte_une_forme_check', 'devis_calculs_check',
      'devis_delai_check', 'devis_lieu_adresse_check', 'devis_lieu_code_postal_check', 'devis_lieu_ville_check', 'devis_objet_check',
      'devis_plafond_check', 'devis_pour_qui_check', 'devis_remise_check', 'devis_remise_une_forme_check', 'devis_retenue_check',
      'devis_source_check',
      'devis_statut_check', 'devis_totaux_check', 'devis_validite_check'],
    devis_lignes: ['devis_ligne_designation_check', 'devis_ligne_forme_check', 'devis_ligne_offert_check', 'devis_ligne_prix_check',
      'devis_ligne_quantite_check', 'devis_ligne_surfaces_check', 'devis_ligne_taux_check', 'devis_ligne_total_check',
      'devis_ligne_type_check', 'devis_ligne_unite_check', 'devis_ligne_urgence_check'],
    devis_tva: ['devis_tva_arrondi_check', 'devis_tva_nb_check', 'devis_tva_remise_check', 'devis_tva_taux_check',
      'devis_tva_vide_check'],
  };
  const parTable = Object.fromEntries(TABLES49.map((t) => [t, CHECKS49.filter((c) => c.table === t).map((c) => c.nom).sort()]));
  verifier(`la section pose ${noms.length} contraintes \`check\` sur les trois tables — il en faut 34, NOMMÉES (18 sur les devis, `
    + '11 sur les lignes, 5 sur la ventilation)',
  noms.length === 34 && json(tables) === json([...TABLES49].sort())
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
    /* 2b-2 (49.5) : les quatre réponses « à quel titre », et le vide. */
    devis_pour_qui_check: "pour_qui is null or pour_qui in ('consommateur', 'professionnel', 'professionnel_hors_activite', "
      + "'non_professionnel')",
    /* 2b-3 (49.5) : la réparation urgente, sur un POSTE seulement. Une
       contrainte À PART — `devis_ligne_forme_check` ne change pas, et son
       nom passe AVANT dans l'ordre alphabétique : une zone urgente ET
       chiffrée est nommée par elle (essai 49-remise, cas 19 f). */
    devis_ligne_urgence_check: "type = 'poste' or not urgence",
    devis_tva_remise_check: 'remise_centimes >= 0',
    devis_tva_vide_check: 'nb_lignes > 0 or (base_centimes = 0 and tva_centimes = 0 and remise_centimes = 0)',
  };
  const formesFausses = Object.entries(FORMES_2A).filter(([nom, forme]) => sansEspaces(regleDe(nom)) !== forme)
    .map(([nom]) => `${nom} : « ${sansEspaces(regleDe(nom))} »`);
  verifier('…et les dix règles du lot 2a (conditions, plafond, calculs, ventilation), celle de 2b-2 (`pour_qui`) et celle de 2b-3 '
    + '(`urgence`) sont celles ATTENDUES, entières',
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
  /* ONZE depuis 2b-3 : `devis_ligne_urgence_check` (49.3 bis), qui vient
     en DERNIER (`unite` < `urgence`). */
  verifier('`CONTRAINTES_LIGNE` : onze noms `devis_ligne_…_check` (dix au lot 1, une à 2b-3), TRIÉS par ordre alphabétique '
    + '(octet par octet, comme PostgreSQL les applique)', noms.length === 11 && noms.every((n) => /^devis_ligne_[a-z_]+_check$/.test(n))
    && egalListes(noms, [...noms].sort()) && noms[10] === 'devis_ligne_urgence_check', json(noms));
  verifier('`CONTRAINTES_DEVIS` : dix-huit noms `devis_…_check` (dix au lot 1, sept au lot 2a, une à 2b-2), triés de même',
    D.CONTRAINTES_DEVIS.length === 18 && D.CONTRAINTES_DEVIS.every((n) => /^devis_[a-z_]+_check$/.test(n) && !/^devis_ligne_/.test(n))
    && egalListes([...D.CONTRAINTES_DEVIS], [...D.CONTRAINTES_DEVIS].sort()));
  const schemaLigne = CHECKS49.filter((c) => c.table === 'devis_lignes').map((c) => c.nom).sort();
  const schemaDevis = CHECKS49.filter((c) => c.table === 'devis').map((c) => c.nom).sort();
  verifier('…et ce sont EXACTEMENT les dix de `devis_lignes` et les dix-huit de `devis` que le schéma pose',
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
    /* 2b-2 (49.4 ter) : le point « 1 bis » — la date du « Oui » au chantier
       neuf (`chantier_neuf_conso_le`), posée par la base à la PREMIÈRE
       confirmation, gardée tant qu'elle reste, vidée sinon. Rien d'autre n'a
       changé dans le corps. */
    tient_le_devis: String.raw`) returns trigger language plpgsql security invoker set search_path = public $$ declare v_ht bigint; v_tva bigint; v_remise bigint; v_ttc bigint; v_options bigint; v_plafond constant integer := 20; begin new.objet := nullif(btrim(coalesce(new.objet, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), ''); new.lieu_adresse := nullif(btrim(coalesce(new.lieu_adresse, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), ''); new.lieu_ville := nullif(btrim(coalesce(new.lieu_ville, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), ''); new.delai_execution := nullif(btrim(coalesce(new.delai_execution, ''), E' \t\r\n\u00a0\u200b\u200c\u200d\u2060\ufeff'), ''); new.lieu_code_postal := nullif(regexp_replace(coalesce(new.lieu_code_postal, ''), E'[ \\t\\n\\v\\f\\r\\u00a0\\u202f]', '', 'g'), ''); if new.chantier_neuf_conso is true then if tg_op = 'INSERT' or old.chantier_neuf_conso is not true then new.chantier_neuf_conso_le := clock_timestamp(); else new.chantier_neuf_conso_le := old.chantier_neuf_conso_le; end if; else new.chantier_neuf_conso_le := null; end if; if new.generation is null or new.generation not between 1 and 9007199254740991 then raise exception 'Cette version d''Opus n''envoie pas de numéro d''écriture valable pour ce devis : rien n''a été enregistré. Mettez l''application à jour, puis réessayez.' using errcode = 'OP016'; end if; if tg_op = 'INSERT' then new.created_at := clock_timestamp(); else new.created_at := old.created_at; new.source := old.source; if (pg_trigger_depth() = 1 and new.generation <= old.generation) or new.generation < old.generation then raise exception 'Ce devis a reçu entre-temps une modification plus récente — peut-être depuis un autre appareil. Celle-ci, plus ancienne, n''a pas été enregistrée, pour ne pas écraser la plus récente. Rien de ce qui est enregistré n''est perdu : rouvrez le devis pour voir sa dernière version, puis réessayez.' using errcode = 'OP015'; end if; end if; new.modifie_le := clock_timestamp(); if new.client_id is not null and (tg_op = 'INSERT' or new.client_id is distinct from old.client_id) and not exists (select 1 from public.clients c where c.id = new.client_id and c.pro_id = new.pro_id) then raise exception 'Cette fiche n''est pas dans votre carnet : un devis ne se rattache qu''à vos propres clients.' using errcode = 'OP013'; end if; if new.quote_request_id is not null and (tg_op = 'INSERT' or new.quote_request_id is distinct from old.quote_request_id) and not exists (select 1 from public.quote_requests q where q.id = new.quote_request_id and q.professional_id = new.pro_id) then raise exception 'Cette demande de devis ne vous a pas été adressée : un devis ne se rattache qu''à vos propres demandes.' using errcode = 'OP013'; end if; if new.sos_request_id is not null and (tg_op = 'INSERT' or new.sos_request_id is distinct from old.sos_request_id) and not exists (select 1 from public.sos_requests s where s.id = new.sos_request_id and s.professional_id = new.pro_id) then raise exception 'Cette urgence ne vous a pas été adressée : un devis ne se rattache qu''à vos propres urgences.' using errcode = 'OP013'; end if; if new.quote_request_id is not null and (tg_op = 'INSERT' or new.quote_request_id is distinct from old.quote_request_id) then perform pg_advisory_xact_lock(hashtextextended('devis:demande:' || new.quote_request_id::text, 0)); if (select count(*) from public.devis d where d.quote_request_id = new.quote_request_id and d.pro_id = new.pro_id and d.id <> new.id) >= v_plafond then raise exception 'Vous avez déjà % devis pour cette demande : supprimez un brouillon dont vous n''avez plus besoin avant d''en commencer un autre.', v_plafond using errcode = 'OP017'; end if; end if; if new.sos_request_id is not null and (tg_op = 'INSERT' or new.sos_request_id is distinct from old.sos_request_id) then perform pg_advisory_xact_lock(hashtextextended('devis:urgence:' || new.sos_request_id::text, 0)); if (select count(*) from public.devis d where d.sos_request_id = new.sos_request_id and d.pro_id = new.pro_id and d.id <> new.id) >= v_plafond then raise exception 'Vous avez déjà % devis pour cette urgence : supprimez un brouillon dont vous n''avez plus besoin avant d''en commencer un autre.', v_plafond using errcode = 'OP017'; end if; end if; select coalesce(sum(t.base_centimes), 0)::bigint, coalesce(sum(t.tva_centimes), 0)::bigint, coalesce(sum(t.remise_centimes), 0)::bigint into v_ht, v_tva, v_remise from public.devis_tva t where t.devis_id = new.id; v_ttc := v_ht + v_tva; new.total_ht_centimes := v_ht; new.total_tva_centimes := v_tva; new.total_ttc_centimes := v_ttc; new.remise_ht_centimes := v_remise; select coalesce(sum(u.base + public.devis_tva_de(u.base, u.taux)), 0)::bigint into v_options from (select x.taux, sum(x.base)::bigint as base from (select t.taux_tva_centiemes as taux, t.base_centimes as base from public.devis_tva t where t.devis_id = new.id union all select l.taux_tva_centiemes, l.total_centimes from public.devis_lignes l where l.devis_id = new.id and l.type = 'option') x group by x.taux) u; new.total_ttc_options_centimes := v_options; new.acompte_ttc_centimes := case when new.acompte_centimes is not null then least(new.acompte_centimes, v_ttc) when new.acompte_centiemes between 1 and 10000 then least((v_ttc * new.acompte_centiemes + 5000) / 10000, v_ttc) else 0 end; return new; end; $$`,
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
    /* LOT 2b-1 (section 49.9) : la liste de ce qu'il manque pour remettre un
       devis. Retirée à PUBLIC ET à `anon` (le piège de la section 38 :
       PostgreSQL l'accorde à PUBLIC, Supabase à `anon`) ; un visiteur n'a
       pas de devis. Rendue à `authenticated` seul : c'est la garde DANS sa
       lecture (`est_mon_entreprise`) qui choisit le devis. */
    'revoke all on function public.motifs_refus_remise(uuid) from public, anon',
    'grant execute on function public.motifs_refus_remise(uuid) to authenticated',
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
  /* …ET `motifs_refus_remise` DEPUIS LE LOT 2b-1 (section 49.9, 05/11/2026) :
     elle LIT `public.devis` et `public.devis_lignes` pour dire ce qu'il
     manque — en `security invoker`, sous la garde `est_mon_entreprise` écrite
     dans sa lecture, et sans jamais en écrire une ligne. Elle n'est donc
     dans aucune des deux listes `security definer` de l'essai 49 (cas 27b,
     27c), qui ne bougent pas. Sa FORME ENTIÈRE est tenue par la section 40
     de ce contrôle : une liste fermée dit QUI peut lire ces tables, la forme
     dit CE QU'elle en lit. Même liste dans `essais-section-49.sql` (cas 27a)
     et dans `verifier-legal` (liste « devis »). */
  const FERMEE = ['mes_donnees', 'motifs_refus_remise', 'recalcule_devis', 'tient_le_devis'];
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
  /* `devis_ligne_urgence_check` (2b-3) est éprouvée par l'essai de la liste
     (`essais-section-49-remise.sql`, cas 19 a à e) : c'est LÀ qu'on la
     cherche, plus bas — l'essai 49 n'a pas été rouvert pour elle. */
  const noms = [...D.CONTRAINTES_LIGNE.filter((n) => n !== 'devis_ligne_urgence_check'),
    'devis_retenue_check', 'devis_source_check', 'devis_statut_check', 'devis_lieu_code_postal_check',
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
  /* LE JOUEUR DU CAS 30 FAIT NAÎTRE UNE LIGNE ENTIÈRE (banc des textes de
     2b-3, S5) : `jsonb_populate_record` met `null` dans toute colonne absente
     de l'objet, et chaque booléen `not null` de `devis_lignes` — lu dans le
     schéma — doit y être nommé `false`. Sans `'urgence', false`, TOUS les cas
     joués étaient refusés (23502) ; l'essai ne le disait que dans une phrase
     lue à l'œil (« écarts : 66 ») : son bilan est désormais un nombre JUGÉ
     (`ecarts_des_cas_attendu_0`). */
  const ajout30 = (/insert\s+into\s+public\.devis_lignes\s+select\s+\*\s+from\s+jsonb_populate_record\(null::public\.devis_lignes,\s*jsonb_build_object\(([\s\S]*?)\)\s*\|\|/i
    .exec(essai) || [])[1] || '';
  const booleens30 = (colonnesDe('devis_lignes') || []).filter((c) => /^boolean$/i.test(c.type) && c.obligatoire).map((c) => c.nom);
  const oublies30 = booleens30.filter((c) => !new RegExp(`'${c}'\\s*,\\s*false\\b`).test(ajout30));
  verifier('…et son opération « ajouter » nomme `false` CHAQUE booléen `not null` de `devis_lignes` (lu dans le schéma, `urgence` '
    + 'compris), et son bilan est un nombre JUGÉ (`ecarts_des_cas_attendu_0`)',
  ajout30.length > 0 && booleens30.length >= 4 && booleens30.includes('urgence') && oublies30.length === 0
    && /\bas\s+ecarts_des_cas_attendu_0\b/.test(essai),
  `booléens : ${json(booleens30)} ; oubliés : ${json(oublies30)}`);
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
    /* 2b-2 (49.4 ter) : les cinq colonnes naissent VIDES — aucun défaut, et
       nullables (un « Non » par défaut serait une réponse jamais donnée). */
    ['devis', 'pour_qui', null, 'YES'], ['devis', 'pour_qui_client', null, 'YES'],
    ['devis', 'chantier_neuf_conso', null, 'YES'], ['devis', 'chantier_neuf_conso_le', null, 'YES'],
    ['devis', 'chantier_neuf_tva', null, 'YES'],
    /* 2b-3 : la décennale et le moment de l'acompte naissent VIDES (le vide
       est le cas protecteur : « Oui » par prudence, le 8e jour) ; la
       réparation urgente d'une ligne naît ÉTEINTE (`not null default false`) :
       une ligne existante n'est pas urgente, et rien ne la marque à sa
       place. */
    ['devis', 'engage_decennale', null, 'YES'], ['devis', 'acompte_a_la_signature', null, 'YES'],
    ['devis_lignes', 'urgence', 'false', 'NO'],
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
  verifier('l’essai des conditions relit, cas 23, le DÉFAUT et le « not null » des onze colonnes du lot 2a (et de la retenue), des '
    + 'cinq de 2b-2 et des trois de 2b-3 dans '
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
    /* Relecture finale du lot 2a (RBM-1) : le cas 13 bis relit `:ERROR`
       (`\set refus_13bis :ERROR`) et juge son refus en SQL — deux empreintes
       de plus, après avoir rejoué l'essai sur une base neuve (27 ERROR, 32 `t`). */
    /* 2b-2 : le cas 18 (39 colonnes nommées, dont les cinq de 49.4 ter) et
       le cas 23 (seize défauts, dont les cinq de 49.4 ter) — quatre ordres
       changés (les n° 333-334 et 353-354, deux par cas), aucun ajouté ni
       retiré ; rejoué sur une base neuve (27 ERROR,
       37 valeurs justes, 0 écart). */
    /* Banc de la phase 5 de 2b-2 (10/11, S10) : le cas 18 JUGÉ EN SQL — la
       liste des écarts de droits devient une ligne (`droits_sans_ecart_
       attendu_t` et les écarts en clair), le nombre de colonnes et les
       droits de table gagnent leur colonne `…_attendu_t`. Trois ordres
       changés (les n° 333 à 335), aucun ajouté ni retiré ; rejoué sur une
       base neuve : 27 ERROR, 40 valeurs justes, 0 écart. */
    /* 2b-3 (12/11/2026) : le cas 18 (42 colonnes nommées, dont les trois de
       2b-3) et le cas 23 (dix-neuf défauts, dont les trois de 2b-3) — quatre
       ordres changés (les n° 333-334 et 353-354), aucun ajouté ni retiré ;
       rejoué sur une base neuve : 27 ERROR, 43 valeurs justes, 0 écart. */
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
      8987c181 0d4100cc 1a2a6843 c9404ff8 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f 1a3877fe 1a2a6843 edd65695
      19ccc5ce 95c8eec7 8e18d6e4 78f8158f d526dec5 e0cac331 1a2a6843 edd65695 19ccc5ce 95c8eec7 12f96fe4 b9e233f9
      00c45eb1 c7cd65de c8a15988 73b093f4 bef0bbaf 1a2a6843 edd65695 19ccc5ce 95c8eec7 cb023507 1a2a6843 edd65695
      19ccc5ce 95c8eec7 8e18d6e4 4349f47a 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 197321de 1a2a6843 edd65695
      19ccc5ce 95c8eec7 8e18d6e4 ef52d54f 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 53d55c1e 1a2a6843 edd65695
      19ccc5ce 95c8eec7 8e18d6e4 45d1cebf 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 06c1e1c4 1a2a6843 edd65695
      19ccc5ce 95c8eec7 8e18d6e4 77b8828c 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 b9e79b8f 1a2a6843 edd65695
      19ccc5ce 95c8eec7 8e18d6e4 78f8158f 67bfd527 1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f 12f16112
      1a2a6843 edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f a0217a90 1a2a6843 2c451b25 1db2a08a 0ac89d76 4b439408
      4d880d4c 13912acb 1441f239 3771726b edd65695 19ccc5ce 95c8eec7 8e18d6e4 78f8158f c43faebb a59edfec a54b0e4f
      bd2af069 95c8eec7 0b57b066 1a2a6843 990f1204 85348a3a`,
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
      ['le cas 23, le juge des défauts et du « not null »', String.raw`with attendu(tab, col, defaut, nullable) as (values ('devis', 'remise_centiemes', null, 'YES'), ('devis', 'remise_centimes', null, 'YES'), ('devis', 'acompte_centiemes', null, 'YES'), ('devis', 'acompte_centimes', null, 'YES'), ('devis', 'acompte_nature', null, 'YES'), ('devis', 'validite_jours', null, 'YES'), ('devis', 'retenue_garantie_centiemes', null, 'YES'), ('devis', 'remise_ht_centimes', '0', 'NO'), ('devis', 'acompte_ttc_centimes', '0', 'NO'), ('devis', 'total_ttc_options_centimes', '0', 'NO'), ('devis_tva', 'remise_centimes', '0', 'NO'), ('devis', 'pour_qui', null, 'YES'), ('devis', 'pour_qui_client', null, 'YES'), ('devis', 'chantier_neuf_conso', null, 'YES'), ('devis', 'chantier_neuf_conso_le', null, 'YES'), ('devis', 'chantier_neuf_tva', null, 'YES'), ('devis', 'engage_decennale', null, 'YES'), ('devis', 'acompte_a_la_signature', null, 'YES'), ('devis_lignes', 'urgence', 'false', 'NO') ) select a.tab || '.' || a.col as colonne, c.column_default as defaut_lu, c.is_nullable as nullable_lu, coalesce(c.column_default is not distinct from a.defaut and c.is_nullable = a.nullable, false) as forme_attendu_t from attendu a left join information_schema.columns c on c.table_schema = 'public' and c.table_name = a.tab and c.column_name = a.col order by a.tab, a.col;`],
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

  /* (4) LE NOMBRE D'ERREURS ANNONCÉ (relecture finale du lot 2a, RBM-1).
     Une erreur annoncée qui MANQUE ne laisse aucun `f` : la garde de 49.6 ter
     neutralisée laissait l'essai du rattrapage à zéro `f`, deux « ERROR » au
     lieu de quatre. Ce que l'essai FAIT ne se sait qu'en le jouant ; ce
     contrôle tient seulement que l'ANNONCE est là, et la même en tête et à la
     fin — sans elle, la seule parade disparaît sans bruit. Changer ce nombre
     se décide, comme une empreinte : après avoir rejoué l'essai. */
  const ANNONCES = {
    'supabase/essais-section-49-conditions.sql': [/EXACTEMENT 27 lignes\s+--\s+`psql:… ERROR`/, /grep -c '\^psql:\.\*ERROR:'` → 27\)/,
      /\\echo '=== FIN — ce fichier a écrit EXACTEMENT 27 lignes « psql:… ERROR »/],
    'supabase/essais-section-49-rattrapage.sql': [/EXACTEMENT QUATRE lignes `psql:… ERROR`/, /grep -c '\^psql:\.\*ERROR:'\n--\s+→ 4\n/,
      /grep -c '\^psql:\.\*ERROR:  P0001: Rattrapage du lot 2a'\n--\s+→ 2\n/,
      /\\echo '    et ce fichier a écrit EXACTEMENT 4 lignes « psql:… ERROR », dont 2 « P0001: Rattrapage du lot 2a »'/],
  };
  const sansAnnonce = essais.flatMap((e) => (ANNONCES[e.f] || []).filter((re) => !re.test(e.brut))
    .map((re) => `${e.f.replace('supabase/essais-section-49-', '')} : ${String(re).slice(1, 60)}`));
  verifier('les deux essais ANNONCENT leur nombre exact d’erreurs (27 pour les conditions ; 4 pour le rattrapage, dont 2 « P0001: '
    + 'Rattrapage du lot 2a »), en tête et à la fin — une erreur annoncée qui manque est un échec, et seul ce compte la voit',
  sansAnnonce.length === 0, sansAnnonce.join(' | '));
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
  /* …ET CELLES DE LA LISTE « CE QU'IL MANQUE POUR REMETTRE CE DEVIS »
     (lot 2b-1) : `motifsRefusRemise…` ne contient pas le mot « devis » ;
     sans ce nom, elle échappait aux vérifications de forme ci-dessous
     (déclarée après `noop`, deux fonctions nommées, la lecture qui LÈVE). */
  const estDuDevis = (nom) => /devis|poste/i.test(nom) || /^(memoireDesLignes|monRegime|rowToLigne|ligneVersBase|motifsRefusRemise)/.test(nom);
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
  const exportes = ['mesDevis', 'unDevis', 'devisDuClient', 'devisDeLaDemande', 'memoireDesLignes', 'monRegime', 'motifsRefusRemise'];
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
    /* CHAQUE BOOLÉEN `not null` DE `devis_lignes`, LU DANS LE SCHÉMA, part
       `false` à la création — pas seulement `offert` et `main_oeuvre` (banc
       des textes de 2b-3, S4) : `urgence` oubliée dans `booleens` partait
       `null`, la base refusait CHAQUE création de ligne (23502), et ce
       contrôle restait vert. Une colonne booléenne ajoutée demain entre ici
       toute seule. */
    const booleensObligatoires = (colonnesDe('devis_lignes') || [])
      .filter((c) => /^boolean$/i.test(c.type) && c.obligatoire).map((c) => c.nom);
    okListe = json(dm) === json(attDm) && json(dc) === json(attDc) && json(lm) === json(attLm) && json(lc) === json(attLc)
      && ![...dm, ...dc, ...lm, ...lc].some((k) => interdits.test(k))
      && json(Object.keys(partiel)) === json(['objet'])
      && versBaseD(tout, { creation: true, proId: 'p' }).pro_id === 'p'
      && Object.keys(entiere).length === attLc.length && entiere.type === 'poste' && entiere.offert === false
      && entiere.main_oeuvre === false && entiere.designation === null && entiere.ordre === 1000
      && booleensObligatoires.length >= 4 && booleensObligatoires.includes('urgence')
      && booleensObligatoires.every((c) => entiere[c] === false);
    det = `devis modifié ${json(dm)} ; créé ${json(dc)} ; ligne modifiée ${json(lm)} ; créée ${json(lc)} ; `
      + `booléens obligatoires ${json(booleensObligatoires.map((c) => `${c}=${json(entiere[c])}`))}`;
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
    ['mesDevisSupabase', 'unDevisSupabase', 'devisDuClientSupabase', 'devisDeLaDemandeSupabase', 'memoireDesLignesSupabase',
      'motifsRefusRemiseSupabase']
      .every((n) => /leverLecture\(/.test(corpsDeFonction(API, n) || '') && /lectureDevis\(/.test(corpsDeFonction(API, n) || ''))
    && /tableAbsente\(\s*error\s*\)\)\s*error\.baseEnRetard\s*=\s*true/.test(corpsDeFonction(API, 'leverLecture') || ''));

  /* UNE SEULE EXCEPTION, NOMMÉE (lot S-b, 26/10/2026) : `peut_faire_un_devis`,
     qui ne lit que la demande et les blocages (section 49.6 bis, donc dans
     `S49` : elle aussi ne doit nommer ni `emetteur` ni `tarifs_pro`). Toute
     AUTRE fonction appelée par `.rpc(` rougit encore. */
  /* LA SECONDE EXCEPTION, NOMMÉE (lot 2b-1, 05/11/2026) :
     `motifs_refus_remise`, qui lit le RÉGIME de TVA (`emetteur.regime_tva`)
     pour juger le taux de chaque ligne (`devis_taux_franchise`,
     `devis_taux_sans_tva`) et appelle
     `emetteur_incomplet` pour les motifs de l'entreprise. La règle a changé,
     et elle est écrite ici sous sa forme la plus étroite : dans la section
     49, `emetteur` n'est nommé QUE par elle, une seule fois, pour UNE
     colonne (`select e.regime_tva into v_regime from public.emetteur e where
     e.pro_id = v_pro`) ; `tarifs_pro` ne l'est par personne. Elle entre dans
     les listes « émetteur » de `verifier-emetteur` et `verifier-legal`
     PARCE QUE sa forme entière (section 40) ne lit que cette colonne — une
     liste fermée ouvre la TABLE, seule la forme la restreint au régime
     (critique B4). L'appel par l'application est UN seul, et sa forme est
     celle-ci : `supabase.rpc('motifs_refus_remise', { p_devis: devisId })`. */
  const blocDevis = decls.map((d) => corpsDeFonction(API, d.nom) || '').join('\n')
    .replace(/supabase\.rpc\(\s*'peut_faire_un_devis'\s*,/g, '')
    .replace(/supabase\.rpc\(\s*'motifs_refus_remise'\s*,\s*\{\s*p_devis:\s*devisId\s*\}\s*\)/g, '');
  const corpsMRR = corpsDe('motifs_refus_remise');
  const s49SansMRR = corpsMRR ? S49.split(corpsMRR).join('') : S49;
  const mrrCode = sansChaines(corpsMRR || '');
  const LECTURE_DU_REGIME = 'select e.regime_tva into v_regime from public.emetteur e where e.pro_id = v_pro;';
  verifier('aucune fonction SQL nouvelle ne lit l’émetteur ni les tarifs : pas de `.rpc(` dans les fonctions du devis (sauf '
    + '`peut_faire_un_devis`, qui ne lit que les blocages, et `motifs_refus_remise` sous sa seule forme), le régime passe par '
    + '`monEmetteur…`, et la section 49 ne nomme ni `emetteur` ni `tarifs_pro` — HORS `motifs_refus_remise`, qui lit de l’émetteur le seul régime, '
    + 'une fois (et, depuis 2b-3, la décennale par `emetteur_assurances`, sous la porte étroite que tient `verifier-emetteur`)',
  !/\.rpc\(/.test(blocDevis) && /monEmetteurSupabase\(\)/.test(corpsDeFonction(API, 'monRegimeSupabase') || '')
    && /monEmetteurDemo\(\)/.test(corpsDeFonction(API, 'monRegimeDemo') || '')
    && !!corpsMRR && s49SansMRR.length < S49.length
    && !/\bpublic\s*\.\s*(emetteur|tarifs_pro)\b/.test(s49SansMRR) && !/\b(from|join)\s+(public\s*\.\s*)?(emetteur|tarifs_pro)\b/.test(s49SansMRR)
    && !/\btarifs_pro\b/.test(corpsMRR)
    && (mrrCode.match(/\bemetteur\b/gi) || []).length === 1
    && (sansEspaces(corpsMRR).match(new RegExp(LECTURE_DU_REGIME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length === 1,
  `${(mrrCode.match(/\bemetteur\b/gi) || []).length} mention(s) d’\`emetteur\` dans la fonction ; `
    + `${/\.rpc\(/.test(blocDevis) ? 'un `.rpc(` de trop dans les fonctions du devis' : ''}`);

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
    /* LES DEVIS DE LA DÉMONSTRATION : DEUX jusqu'au lot 2a, QUATRE depuis le
       lot 2b-1 — « Muret » (« Ce devis » complet) et « Terrasse » (il y
       manque la validité et la nature de l'acompte), pour que la liste « Ce
       qu'il manque pour remettre ce devis » se VOIE dans ses deux états sans
       `.env` (cahier 2b-1, §3.4). Le nombre se lit dans le jeu fabriqué, pas
       écrit ici : un brouillon de plus ne doit pas faire rougir la
       troncature, qui n'en dépend pas. */
    const nbDemo = DEMO.fabriquerDevisDemo(new Date()).devis.length;
    const deux = D.decouperListe(await DEMO.creerBaseDevisDemo().liste('1'));
    verifier(`o. 201 devis lus comme « Mes devis » : 200 gardés, \`tronque\` VRAI, et c’est le plus ANCIEN qui sort ; les ${nbDemo} devis `
      + 'de la démonstration : `tronque` faux', lus.length === 201 && r.devis.length === 200 && r.tronque === true
      && !r.devis.some((d) => d.objet === 'Devis 0') && r.devis[0].objet === 'Devis 200'
      && nbDemo === 4 && deux.tronque === false && deux.devis.length === nbDemo,
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
/* …et ceux de l'étape 2b-2 (« À quel titre ? », « Le chantier ») : la carte
   du chantier, ses deux feuilles. Leurs règles propres sont plus bas
   (« 2b-2 — l'écran »), celles du module les couvrent aussi. */
const ECRANS_2B2 = ['src/components/ChantierDevis.js', 'src/components/FeuilleAQuelTitre.js', 'src/components/FeuilleChantierNeuf.js'];
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
  verifier('la liste des lignes ET la carte portent `{...CLAVIER}` ; glisser referme le pavé décimal, qui n’a aucune touche pour le faire : '
    + '`keyboardDismissMode="on-drag"` sur la carte, et sur la liste tant que ni carte ni feuille ne la couvre (`glisserFermeLeClavier`, '
    + 'relecture 6)',
    [liste, defile].every((b) => /\{\.\.\.CLAVIER\}/.test(b)) && /keyboardDismissMode="on-drag"/.test(defile)
    && /keyboardDismissMode=\{glisserFermeLeClavier\}/.test(liste)
    && ECR.saisie.includes("const glisserFermeLeClavier = carte || feuille ? 'none' : 'on-drag';"),
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
      'retenueGarantieCentiemes', 'acompteALaSignature'].every((c) => (/const CHAMPS_CONDITIONS = Object\.freeze\(\[([^\]]*)\]/.exec(ECR.saisie) || ['', ''])[1]
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
  const fichiersJetons = [...Object.values(ECRANS_DEVIS), 'src/components/FicheClient.js', ...ECRANS_POSTES, ...ECRANS_2B2];
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
    'src/lib/rapprochement.js', 'src/lib/postes.js', 'src/data/devis-demo.js', ...Object.values(ECRANS_DEVIS), ...ECRANS_POSTES,
    ...ECRANS_2B2];
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
  /* RIEN DE POSÉ → « Validité à choisir », plus « Aucune condition — touchez
     pour en poser » (lot 2b-1, critique E-12) : la rangée « Conditions » est
     posée juste au-dessus de la liste « Ce qu'il manque pour remettre ce
     devis », qui compte la validité comme un point à compléter ; une
     invitation facultative à côté d'un point qui bloque la remise, c'étaient
     deux rangées voisines qui se contredisaient. Sans validité, elle MANQUE
     — et le résumé le dit, comme il le disait déjà quand une autre condition
     était posée. */
  verifier('`resumeDesConditions` : rien → « Validité à choisir » (jamais plus « Aucune condition ») ; ce qui MANQUE d’abord (la nature, '
    + 'la validité), puis ce qui est posé',
    D.resumeDesConditions({}) === 'Validité à choisir' && D.resumeDesConditions(null) === 'Validité à choisir'
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
     dix-huit moins les QUATRE que la base pose seule (la réponse « à quel
     titre » depuis 2b-2). `devis_plafond_check`
     n'en est plus (relecture BASE-4 du lot 2a, mesuré) : retirer ou baisser
     la réduction d'un devis près du plafond la viole depuis l'en-tête, et sa
     phrase dit « La réduction n'a pas pu être changée. » (section 36, d). */
  const parLaBase = ['devis_calculs_check', 'devis_source_check', 'devis_statut_check', 'devis_totaux_check'];
  const generique = D.phraseEchecDuDevis({ enBase: true, erreur: { message: 'réseau' } });
  const sansPhrase = D.CONTRAINTES_DEVIS.filter((n) => !parLaBase.includes(n))
    .filter((n) => D.phraseEchecDuDevis({ enBase: true, erreur: { message: `violates check constraint "${n}"` } }) === generique);
  verifier('`phraseEchecDuDevis` : avant la base, « le brouillon » ; après, le CHAMP que nomme la contrainte — pour chacune des '
    + 'quatorze que l’application peut violer (le plafond et la réponse « à quel titre » compris) ; sinon la phrase générale',
  D.phraseEchecDuDevis({ enBase: false }) === 'Le brouillon n’a pas pu être enregistré.' && /les conditions/.test(generique)
    && sansPhrase.length === 0
    && D.phraseEchecDuDevis({ enBase: true, erreur: { message: 'x "devis_validite_check"' } }) === 'La validité de l’offre n’a pas pu être enregistrée.'
    && parLaBase.length === 4 && D.CONTRAINTES_DEVIS.length - parLaBase.length === 14
    && D.phraseEchecDuDevis({ enBase: true, erreur: { message: 'x "devis_pour_qui_check"' } })
      === 'La réponse à « À quel titre ? » n’a pas pu être enregistrée.',
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
     rendez alors » juste après l'exception, qui se lisait « dans ce cas-là ».
     RELECTURE FINALE du lot 2a (TC-8) : l'exemple dit « qu'il vous a
     EXPRESSÉMENT demandé » — L. 221-28 8° dit « expressément sollicités par
     lui », le même mot que l'aide du 8e jour ; sans lui, l'exception
     s'élargit au dépannage que l'artisan a lui-même proposé. */
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
    && /5\ssalariés au plus pour des travaux hors de son activité principale/.test(D.ECHEANCE_ACOMPTE)
    && !/hors de son métier|Seule exception/.test(D.ECHEANCE_ACOMPTE)
    && /Exceptions : des travaux d’entretien ou de réparation urgents qu’il vous a expressément demandés/.test(D.ECHEANCE_ACOMPTE)
    && /strictement nécessaires à l’urgence ; et la construction d’un bâtiment neuf ou la transformation importante d’un bâtiment existant, à indiquer dans « Le chantier » \(/.test(D.ECHEANCE_ACOMPTE)
    && /L\.\s221-2(?!\d)/.test(D.ECHEANCE_ACOMPTE)
    && /sauf exceptions \(par exemple, le strict nécessaire d’un dépannage urgent qu’il vous a expressément demandé chez lui\)/
      .test(D.AIDE_NATURE_ACOMPTE)
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
      + 'd’un dépannage urgent qu’il vous a expressément demandé chez lui) : s’il se rétracte, vous lui rendez tout ce qu’il '
      + 'a versé, '
      + 'acompte ou arrhes (art. L.\u00a0221-18 et L.\u00a0221-24).',
    /* 2b-2 (annexe A.6, critique droit B3, B4) : « hors de son ACTIVITÉ
       PRINCIPALE » (les mots de L. 221-3), et DEUX exceptions — l'urgence,
       et le bâtiment neuf ou la transformation importante (L. 221-2 12°),
       à dire dans « Le chantier ». */
    ECHEANCE_ACOMPTE: 'Devis signé hors de vos locaux (chez le client, sur le chantier) par un particulier, ou par une '
      + 'entreprise de 5\u00a0salariés au plus pour des travaux hors de son activité principale : vous ne pouvez recevoir '
      + 'aucun paiement avant le 8e jour après la signature — pas même un chèque à encaisser plus tard. Exceptions : des '
      + 'travaux d’entretien ou de réparation urgents qu’il vous a expressément demandés chez lui, et seulement pour les '
      + 'pièces et travaux strictement nécessaires à l’urgence ; et la construction d’un bâtiment neuf ou la '
      + 'transformation importante d’un bâtiment existant, à indiquer dans « Le chantier » (Code de la consommation, '
      + 'art. L.\u00a0221-10, L.\u00a0221-2 et L.\u00a0221-3). Opus ne sait pas encore où ce devis sera signé : comptez ce délai.',
    /* …ET SES DEUX VARIANTES, ET L'AIDE DE LA NATURE POUR UN PROFESSIONNEL
       (annexe A.6, critique droit I5 et M9). */
    ECHEANCE_ACOMPTE_PRUDENCE: 'Pour une association, une copropriété ou une société civile sans activité professionnelle, '
      + 'la loi ne pose peut-être pas cette règle ; Opus la compte, par prudence : ne recevez aucun paiement avant le 8e jour '
      + 'après la signature.',
    AIDE_NATURE_ACOMPTE_PRO: 'Des arrhes : chacun peut renoncer — le client en les perdant, vous en lui rendant le double. Un '
      + 'acompte engage les deux. Écrivez lequel des deux vous demandez.',
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
    /* L'aide de l'interrupteur « Retenue de garantie » : « rendue » (la
       retenue), un an après la RÉCEPTION, sauf opposition notifiée AU
       CONSIGNATAIRE (ou à la caution) par lettre recommandée. Elle vivait en
       attribut JSX dans l'écran, relue par ses seuls littéraux : une
       constante concaténée ou une prop étalée la contredisaient au vert
       (relecture finale du lot 2a, TC-3). Elle est dans `devis.js`, comparée
       par sa VALEUR. */
    AIDE_RETENUE: 'Au plus 5\u00a0% des acomptes, rendue un an après la réception des travaux, sauf opposition motivée '
      + 'que le client notifie au consignataire (ou à la caution) par lettre recommandée.',
    /* 2b-3 (annexe A.4) : l'échéance permise par l'urgence, et la nature
       d'une association (T7 : elle affirmait 14 jours de rétractation). */
    ECHEANCE_ACOMPTE_URGENCE: 'Toutes les lignes chiffrées de ce devis sont marquées « réparation urgente » : pour elles, la règle '
      + 'du 8e jour ne s’applique pas. Si une ligne ne l’est pas vraiment, retirez sa marque : un paiement reçu trop tôt permettrait '
      + 'au client d’annuler le contrat.',
    AIDE_NATURE_ACOMPTE_PRUDENCE: 'Des arrhes : chacun peut renoncer — le client en les perdant, vous en lui rendant le double. Un '
      + 'acompte engage les deux. Pour une association, une copropriété ou une société civile, la loi ne prévoit peut-être pas de délai '
      + 'de rétractation ; Opus le compte, par prudence : si le client se rétracte, rendez-lui tout ce qu’il a versé.',
    /* 2b-3 (annexe A.2) : la ligne « réparation urgente » — libellé, aide
       FIXE, ce que coûte une erreur (l'amende de la loi, la même constante
       que la confirmation du chantier neuf), le rappel d'un devis venu d'une
       urgence, le détail de la liste. */
    LIBELLE_URGENCE: 'Réparation urgente expressément demandée par le client',
    AIDE_URGENCE: 'Seulement le strict nécessaire d’un entretien ou d’une réparation urgents que votre client vous a expressément '
      + 'demandés, chez lui : s’il commande à titre privé, il n’aura pas de droit de rétractation pour cette ligne.',
    URGENCE_SI_ALLUMEE: 'Si ce n’est pas vraiment le cas, c’est vous qui prenez le risque : le client peut se rétracter jusqu’à '
      + 'douze mois de plus, sans forcément vous devoir les travaux déjà faits ; un paiement reçu avant le 8e jour permet d’annuler le '
      + 'contrat, et l’exiger ou le recevoir est puni jusqu’à deux ans d’emprisonnement et 150\u00a0000\u00a0€ d’amende. Profiter de '
      + 'l’urgence pour faire signer davantage peut être un abus de faiblesse (code de la consommation, L.\u00a0121-9).',
    DEPUIS_UNE_URGENCE: 'Ce devis vient d’une demande d’urgence : ne marquez une ligne que si elle remplit les conditions '
      + 'ci-dessous, et seulement le strict nécessaire.',
    DETAIL_URGENCE: 'réparation urgente',
  });
  const ecartsAides = Object.entries(AIDES_DE_DROIT_ATTENDUES).filter(([k, v]) => D[k] !== v).map(([k]) => k);
  verifier('les aides de la carte « Conditions » sont ÉCRITES MOT POUR MOT : la nature de l’acompte, le 8e jour, '
    + 'la validité, la retenue de garantie (sa phrase et l’aide de son interrupteur) — et la réduction, l’acompte, et leurs '
    + 'deux aides « en euros » ; 2b-3 : l’échéance de l’urgence, la nature d’une association, et les cinq textes de la ligne urgente',
  ecartsAides.length === 0,
  ecartsAides.map((k) => `${k} : « ${D[k]} »`).join(' | '));
  {
    /* L'INTERRUPTEUR « Retenue de garantie », LU ENTIER (relecture finale du
       lot 2a, TC-3). Le contrôle d'avant lisait l'attribut `aide` et n'en
       recousait que les littéraux : `+ SUITE_RETENUE` au bout, ou
       `{...{ aide: '…par courriel' }}` après lui (JSX : la dernière prop
       gagne), passaient au vert. L'élément — de `<Interrupteur` à sa fin,
       accolades comptées, SANS les commentaires — porte donc exactement
       `aide={AIDE_RETENUE}`, une seule fois, et aucune prop étalée ; un seul
       interrupteur porte ce libellé. La constante, elle, est comparée par sa
       VALEUR plus haut, et son import est tenu par la règle de TC-2 (sans
       alias, aucune déclaration locale du même nom). */
    const src = sansCommentairesJs(lire('src/components/ConditionsDevis.js'));
    const elements = balises(src, 'Interrupteur').filter((b) => /libelle="Retenue de garantie"/.test(b));
    const el = elements[0] || '';
    verifier('l’interrupteur « Retenue de garantie » porte EXACTEMENT `aide={AIDE_RETENUE}`, une seule fois, sans morceau '
      + 'ajouté ni prop étalée — un seul interrupteur porte ce libellé',
    elements.length === 1 && balises(src, 'Interrupteur').length === 1
      && (el.match(/\baide\s*=/g) || []).length === 1 && /\baide=\{AIDE_RETENUE\}/.test(el) && !/\{\s*\.\.\./.test(el)
      && D.AIDE_RETENUE === AIDES_DE_DROIT_ATTENDUES.AIDE_RETENUE,
    `${elements.length} interrupteur(s) : « ${sansEspaces(el).slice(0, 200)} »`);
  }
  {
    /* …ET CE QUE L'INTERRUPTEUR EN ÉCRIT À L'ÉCRAN (banc final du lot 2a,
       N10). La carte lui passe `aide={AIDE_RETENUE}` mot pour mot, mais c'est
       `Interrupteur` (ui.js) qui l'affiche : `{aide.split(', sauf')[0]}` y
       faisait lire « rendue un an après la réception des travaux » SANS
       l'opposition — exactement ce que l'aide existe pour empêcher —, vert
       contre les 56 contrôles (seul `mesure-devis`, au navigateur, le
       voyait). L'aide s'y affiche ENTIÈRE et telle quelle, une seule fois,
       jamais transformée (`aide.…`, `aide[…]`, une concaténation) ;
       VoiceOver la lit avec le libellé ; son style ne la cache pas, n'étale
       rien, et sa couleur se lit sur le fond de l'interrupteur (4,5 : 1). */
    const UIsrc = sansCommentairesJs(lire('src/components/ui.js'));
    const corpsI = corpsDeFonction(UIsrc, 'Interrupteur') || '';
    const styleI = (/\n\s{2}interrupteurAide:\s*\{([^}]*)\}/.exec(UIsrc) || [])[1] || '';
    const fondI = (/\n\s{2}interrupteur:\s*\{([^}]*)\}/.exec(UIsrc) || [])[1] || '';
    const paletteI = (/export const C = \{([\s\S]*?)\n\};/.exec(lire('src/theme.js')) || [])[1] || '';
    const hexI = (expr) => {
      const m = /^C\.(\w+)$/.exec(String(expr || '').trim());
      const h = m ? new RegExp(String.raw`\b${m[1]}\s*:\s*'(#[0-9A-Fa-f]{6})'`).exec(paletteI) : null;
      return h ? h[1] : null;
    };
    const lumI = (hex) => {
      const c = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const encreI = hexI((/\bcolor\s*:\s*([^,}\n]+)/.exec(styleI) || [])[1]);
    const papierI = hexI((/\bbackgroundColor\s*:\s*([^,}\n]+)/.exec(fondI) || [])[1]);
    const ratioI = encreI && papierI ? (() => { const [x, y] = [lumI(encreI), lumI(papierI)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); })() : 0;
    const enfants = (corpsI.match(/<Text\b[^>]*>\{[^}]*\baide\b[^}]*\}<\/Text>/g) || []);
    /* …et ce qui l'enveloppe ne la cache pas davantage : la case
       (`interrupteur`) et le bloc du texte (`interrupteurTexte`), où elle vit
       directement. */
    const CACHE_I = /\b(display|opacity|height|maxHeight|width|maxWidth|position|overflow|transform|zIndex)\s*:|\.\.\.|transparent/;
    const cadres = ['interrupteur', 'interrupteurTexte'].map((n) => [n, (new RegExp(String.raw`\n\s{2}${n}:\s*\{([^}]*)\}`).exec(UIsrc) || [])[1] || '']);
    const cadresFautifs = cadres.filter(([, c]) => !c || CACHE_I.test(c)).map(([n]) => n);
    const directe = /<View style=\{s\.interrupteurTexte\}>\s*<Text style=\{s\.interrupteurLibelle\}>\{libelle\}<\/Text>\s*\{!!aide && \(?\s*<Text style=\{s\.interrupteurAide\}>\{aide\}<\/Text>\s*\)?\s*\}\s*<\/View>/.test(corpsI);
    verifier('`Interrupteur` (ui.js) écrit l’aide ENTIÈRE, telle quelle : `{!!aide && <Text style={s.interrupteurAide}>{aide}</Text>}`, '
      + 'une seule fois, jamais transformée (`aide.…`, `aide[…]`, `aide +`) ; VoiceOver la lit (`${libelle}. ${aide}`) ; son style ne '
      + `la cache pas et se lit sur le fond (${ratioI.toFixed(2)} : 1, 4,5 au moins)`,
    corpsI.length > 100 && enfants.length === 1 && enfants[0] === '<Text style={s.interrupteurAide}>{aide}</Text>'
      && /\{!!aide && \(?\s*<Text style=\{s\.interrupteurAide\}>\{aide\}<\/Text>\s*\)?\s*\}/.test(corpsI)
      && !/\baide\s*(?:\?\.|\.|\[|\+)/.test(corpsI.replace(/aide \? `\$\{libelle\}\. \$\{aide\}` : libelle/, ''))
      && /accessibilityLabel=\{aide \? `\$\{libelle\}\. \$\{aide\}` : libelle\}/.test(corpsI)
      && styleI.length > 10 && !/\.\.\./.test(styleI)
      && !/\b(display|opacity|height|maxHeight|width|position|overflow|transform)\s*:|transparent|fontSize:\s*0\b/.test(styleI)
      && ratioI >= 4.5 && directe && cadresFautifs.length === 0,
    `${enfants.length} enfant(s) : ${json(enfants)} ; style « ${sansEspaces(styleI)} » ; fond « ${sansEspaces(fondI).slice(0, 120)} » ; `
      + `dans le bloc du texte : ${directe} ; cadres fautifs ${json(cadresFautifs)}`);
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
          acompteNature: null, retenueGarantieCentiemes: 500, clientId: null, pourQui: null, pourQuiClient: null,
          chantierNeufConso: null, chantierNeufConsoLe: null, chantierNeufTva: null })
      /* Sans demande relue, aucune nature n'est inventée : le nom NEUTRE. */
      && n((D.rangeesDesTotaux({ ...t0, acompte: 36000 }, 'reel', { devis: localEnAvance }).find((r) => r.cle === 'acompte') || {}).libelle)
        === 'Acompte ou arrhes'
      && /\bd\.acompte_nature\b/.test(corpsTotaux) && /\bd\.retenue_garantie_centiemes\b/.test(corpsTotaux),
    json(rangMix.map((r) => r.aDire)));

    /* CONTROLES-2 : l'état initial, sur un devis vierge, ne choisit RIEN. */
    const vide = D.etatInitialConditions({});
    verifier('CONTROLES-2 : `etatInitialConditions` — sur un devis VIERGE, ni nature, ni validité, ni « Autre », ni retenue ; '
      + 'et la carte part d’ELLE (`useState(() => etatInitialConditions(devis, textes))`), sans autre défaut écrit à la main',
    json(vide) === json({ uniteReduction: 'pourcent', uniteAcompte: 'pourcent', nature: null, validite: null, validiteAutre: false, retenue: false,
      echeance: null })
      /* 2b-3 : l'échéance relue telle que la base la garde — `true`, `false`,
         et `null` pour tout le reste (jamais « À la signature » par défaut). */
      && D.etatInitialConditions({ acompteALaSignature: true }).echeance === true
      && D.etatInitialConditions({ acompteALaSignature: false }).echeance === false
      && D.etatInitialConditions({ acompteALaSignature: 'true' }).echeance === null
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
        acompteNature: 'acompte', retenueGarantieCentiemes: lu.devis.retenueGarantieCentiemes ?? null,
        /* 2b-2 : la réponse « à quel titre », son client et le chantier,
           relus dans la MÊME photo que les totaux. */
        clientId: lu.devis.clientId ?? null, pourQui: lu.devis.pourQui ?? null, pourQuiClient: lu.devis.pourQuiClient ?? null,
        chantierNeufConso: lu.devis.chantierNeufConso ?? null, chantierNeufConsoLe: lu.devis.chantierNeufConsoLe ?? null,
        chantierNeufTva: lu.devis.chantierNeufTva ?? null })
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
    ['AIDE_REDUCTION', String.raw`<Text style=\{s\.aide\}\s*>\{\s*AIDE_REDUCTION\s*\}</Text>`, []],
    ['AIDE_ACOMPTE', String.raw`<Text style=\{s\.aide\}\s*>\{\s*AIDE_ACOMPTE\s*\}</Text>`, []],
    /* 2b-2 : la nature et le 8e jour viennent d'`aidesDeLAcompte` (la
       réponse « à quel titre » de l'écran, le chantier neuf) — la nature
       toujours, l'échéance quand elle a lieu d'être (`null` pour une réponse
       « pour son entreprise »). Le CHOIX de la phrase est fait tourner plus
       bas (« les aides de l'acompte suivent la réponse de l'ÉCRAN »). */
    ['aides.nature (aidesDeLAcompte)', String.raw`<Text style=\{s\.aide\}\s*>\{\s*aides\.nature\s*\}</Text>`, []],
    ['aides.echeance (aidesDeLAcompte)', String.raw`<Text style=\{s\.aide\}\s*>\{\s*aides\.echeance\s*\}</Text>`, ['!!aides.echeance &&']],
    ['AIDE_VALIDITE', String.raw`<Text style=\{s\.aide\}\s*>\{\s*AIDE_VALIDITE\s*\}</Text>`, []],
    ['PHRASE_RETENUE', String.raw`<Text style=\{s\.aide\}\s*>\{\s*PHRASE_RETENUE\s*\}</Text>`, ['c.retenue &&']],
    ['aideReductionMontant (AIDE_REDUCTION_HT)', String.raw`<Text style=\{s\.aide\}\s*>\{\s*noms\.aideReductionMontant\s*\}</Text>`, ['!!noms.aideReductionMontant &&']],
    ['aideAcompteMontant (AIDE_ACOMPTE_TTC)', String.raw`<Text style=\{s\.aide\}\s*>\{\s*noms\.aideAcompteMontant\s*\}</Text>`, ['!!noms.aideAcompteMontant &&']],
    ['l’aide de « Retenue de garantie »', String.raw`<Interrupteur\b`, []],
  ];
  /* CE CONTRÔLE EXIGE UNE FORME (contre-vérification finale du lot 2a,
     N2) : `<Text style={s.aide}>{AIDE_…}</Text>`, un seul import, un titre
     en chaîne simple. Du code JUSTE écrit autrement — `style={[s.aide]}`,
     `libelle={'…'}`, une seconde ligne d'import — est refusé aussi, et
     l'aide se dit alors « introuvable ». C'est voulu (une forme exacte ne
     laisse rien passer au vert), mais le message doit le dire : il ne
     prétend pas que l'aide est cachée. */
  const FORME_ATTENDUE = ' — introuvable SOUS LA FORME ATTENDUE `<Text style={s.aide}>{AIDE_…}</Text>` (un seul import de '
    + '`../lib/devis`, un titre en chaîne simple) : si le code est juste et écrit autrement, c’est la forme de ce contrôle qu’on met '
    + 'à jour, avec sa raison';
  const malAffichees = AFFICHAGES.map(([k, motif, attendu]) => {
    const g = gardesDe(motif);
    return g.length === 1 && json(g[0]) === json(attendu) ? null
      : `${k} : ${g.length} occurrence(s), conditions ${json(g)}${g.length === 0 ? FORME_ATTENDUE : ''}`;
  }).filter(Boolean);
  const styleAide = (/\n\s{2}aide:\s*\{([^}]*)\}/.exec(carteSrc) || [])[1] || '';
  /* …et le style `aide` n'ÉTALE rien (banc final du lot 2a, N02) :
     `aide: { ...VOILE, fontFamily: … }` avec `VOILE = { opacity: 0.3 }`
     cachait les huit aides à la fois, au vert — ce qu'il étale ne se lit pas. */
  verifier('la carte « Conditions » AFFICHE chaque aide : un enfant `{AIDE_…}` d’un `<Text style={s.aide}>`, une seule fois, sous '
    + 'EXACTEMENT ses conditions (aucune pour les six de toujours, la retenue ouverte, le régime réel pour les deux « en euros ») — et '
    + 'le style `aide` ne la cache pas, ni n’étale un autre style',
  iEcran >= 0 && malAffichees.length === 0 && styleAide.length > 10 && !/\.\.\./.test(styleAide)
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

  /* b bis. CHAQUE AIDE EST LA SIENNE, SOUS SON TITRE, ET RIEN NE LA CACHE
        (relecture finale du lot 2a, TC-2). La vérification d'au-dessus lit
        des NOMS : `{AIDE_VALIDITE}` sous `<Text style={s.aide}>`. Elle ne
        voyait ni ce que le nom DÉSIGNE, ni la PLACE de l'aide, ni ce que fait
        une vue autour d'elle. Six défauts passaient au vert, contre ce
        contrôle comme contre les 56 :
        - `AIDE_VALIDITE as ECHEANCE_ACOMPTE` dans l'import : la règle du
          8e jour (L. 221-10) quittait la carte, remplacée par la validité ;
        - deux alias croisés : la réduction et l'acompte échangeaient leurs
          aides ;
        - deux aides échangeaient leur PLACE (« À compter de la date du
          devis… » sous « Réduction ») ;
        - une vue autour d'une aide, `maxHeight: 2, overflow: 'hidden'`,
          `opacity: 0.3` (contraste rendu 1,53 : 1), ou
          `position: 'absolute', left: -9999` : l'aide était là, et ne se
          lisait pas ;
        - et une constante LOCALE du même nom masquait l'import (seul le
          cliquet du linter l'attrapait, par hasard).
        D'où trois règles, sur l'écran SANS ses commentaires :
        1. chaque aide de droit est importée de `../lib/devis` SOUS SON NOM
           (aucun `as`), et son nom n'apparaît que DEUX fois dans le code :
           l'import, puis l'endroit où elle s'affiche — aucune déclaration,
           aucun paramètre, aucun alias ne peut la remplacer ;
        2. les quatre titres de la carte sont là, une fois chacun, dans
           l'ordre (Réduction, l'acompte, Validité de l'offre, Retenue de
           garantie), et chaque aide s'affiche sous LE SIEN, dans l'ordre
           attendu ;
        3. entre le début du CONTENU de la carte (après l'ouverture du
           `ScrollView`, jamais le `ScrollView` lui-même, ni la carte) et une
           aide, aucun élément ouvert autour d'elle n'a de style qui la
           cache, la rogne, la déplace ou l'efface — ni opacité, ni hauteur
           ou largeur, ni `overflow`, ni `position`, ni `transform`, ni
           `display` —, ni `numberOfLines`, ni de quoi la taire à VoiceOver,
           ni de prop étalée. Un fragment (`<>`) ne porte rien : il passe.
        Ce que le texte ne peut pas dire — une vue AUTOUR de la carte, un
        composant qui changerait ailleurs — se MESURE au navigateur
        (`mesure-devis`, « Les aides de droit de la carte ») : la boîte,
        l'opacité calculée avec tous les ancêtres, le contraste rendu,
        l'ordre, contre des textes écrits en toutes lettres. */
  {
    /* 2b-2 : la nature et le 8e jour ne sont plus des constantes de la
       carte, mais ce que rend `aidesDeLAcompte` — importée sous son nom, et
       appelée UNE fois, sur la réponse de l'écran et le chantier neuf
       (vérifié juste après). */
    const AIDES_DE_DROIT = ['AIDE_REDUCTION', 'AIDE_ACOMPTE', 'aidesDeLAcompte', 'AIDE_VALIDITE',
      'AIDE_RETENUE', 'PHRASE_RETENUE'];
    /* 1. L'import, et les deux seules apparitions de chaque nom. */
    const importsDe = [...carteSrc.matchAll(/\bimport\s+([\s\S]*?)\s+from\s+'([^']+)'/g)].map((m) => ({ quoi: m[1], de: m[2] }));
    const deDevis = importsDe.filter((i) => i.de === '../lib/devis');
    const specs = deDevis.length === 1 ? (/\{([\s\S]*)\}/.exec(deDevis[0].quoi) || [])[1] || '' : '';
    const noms = specs.split(',').map((x) => sansEspaces(x)).filter(Boolean);
    const fautesImport = AIDES_DE_DROIT.filter((nom) => {
      const sous = noms.filter((x) => x === nom).length === 1;
      const alias = noms.some((x) => new RegExp(`\\b${nom}\\b`).test(x) && x !== nom);
      const ailleurs = importsDe.some((i) => i.de !== '../lib/devis' && new RegExp(`\\b${nom}\\b`).test(i.quoi));
      const fois = (plat.match(new RegExp(`(?<![\\w$])${nom}(?![\\w$])`, 'g')) || []).length;
      return !sous || alias || ailleurs || fois !== 2;
    });
    verifier('TC-2 : chaque aide de droit de la carte est importée de `../lib/devis` SOUS SON NOM (aucun `as`), et son nom '
      + 'n’apparaît que deux fois — l’import, puis son affichage : aucune déclaration locale, aucun alias ne la remplace',
    deDevis.length === 1 && noms.length > 10 && fautesImport.length === 0,
    `${deDevis.length} import(s) de ../lib/devis ; en faute : ${fautesImport.join(', ') || '—'}`);
    /* …et `aidesDeLAcompte` est appelée SUR CE QU'IL FAUT (2b-2, cahier
       §3.5) : la réponse « à quel titre » de l'ÉCRAN et le chantier neuf
       reçus de la saisie, et rien d'autre — `aides`, une seule constante,
       lue deux fois (la nature, l'échéance). Une réponse figée
       (`reponse: null`) aurait laissé le 8e jour sous une réponse « pour
       son entreprise », au vert. */
    const appelAides = /const aides = aidesDeLAcompte\(\{([^}]*)\}\);/.exec(plat);
    const lectures = (plat.match(/(?<![\w$.])aides(?![\w$])/g) || []).length;
    /* 2b-3 (cahier §3.7, D8) — DÉCIDÉ : une quatrième propriété, `toutUrgent`
       (les lignes chiffrées de l'ÉCRAN toutes marquées « réparation
       urgente »), que la saisie calcule et passe (`toutUrgent(lignes)`),
       avec un défaut `false`. Sans elle, l'aide de l'échéance dirait le 8e
       jour sous un devis tout urgent que le motif laisse « à la signature ». */
    verifier('2b-2 : les aides de l’acompte de la carte viennent d’`aidesDeLAcompte({ reponse: reponseATitre, chantierNeufConso, '
      + 'chantierNeufConsoLe, toutUrgent })` — les quatre propriétés que la saisie passe (2b-3 : `toutUrgent`) —, rangées dans `aides`, '
      + 'lue deux fois',
    !!appelAides && sansEspaces(appelAides[1]) === 'reponse: reponseATitre, chantierNeufConso, chantierNeufConsoLe, toutUrgent'
      && lectures === 4
      && /\breponseATitre\s*=\s*null\s*,\s*chantierNeufConso\s*=\s*null\s*,\s*chantierNeufConsoLe\s*=\s*null\b/.test(plat)
      && /\btoutUrgent\s*=\s*false\s*,\s*lignes\s*=\s*\[\]/.test(plat),
    `${appelAides ? sansEspaces(appelAides[1]) : 'appel introuvable'} ; « aides » ${lectures} fois`);

    /* 2. Les titres, et l'aide sous le sien. Positions lues dans `plat`
       (les chaînes vidées, même longueur), textes lus dans `carteSrc`. */
    const iScroll = plat.indexOf('<ScrollView', iEcran);
    const ouvreScroll = iScroll >= 0 ? baliseOuvrante(plat, iScroll) : '';
    const debutContenu = iScroll >= 0 ? iScroll + ouvreScroll.length : -1;
    const finContenu = plat.indexOf('</ScrollView>', debutContenu);
    const TITRES = ['Réduction', '{noms.acompte}', 'Validité de l’offre', 'Retenue de garantie'];
    const titres = [];
    const reTitre = /<Text style=\{s\.titre\}[^>]*>([\s\S]*?)<\/Text>/g;
    let mt;
    while (debutContenu >= 0 && (mt = reTitre.exec(plat))) {
      if (mt.index < debutContenu || mt.index > finContenu) continue;
      titres.push({ i: mt.index, texte: sansEspaces(carteSrc.slice(mt.index + mt[0].length - mt[1].length - 7, mt.index + mt[0].length - 7)) });
    }
    const entetes = (carteSrc.slice(Math.max(debutContenu, 0), finContenu).match(/accessibilityRole="header"/g) || []).length;
    const AIDES_PAR_TITRE = [
      ['AIDE_REDUCTION', 0], ['noms.aideReductionMontant', 0],
      ['AIDE_ACOMPTE', 1], ['noms.aideAcompteMontant', 1], ['aides.nature', 1], ['aides.echeance', 1],
      ['AIDE_VALIDITE', 2],
      ['AIDE_RETENUE', 3], ['PHRASE_RETENUE', 3],
    ];
    const ouEst = (nom) => {
      if (nom === 'AIDE_RETENUE') {
        const m = /<Interrupteur\b/.exec(plat.slice(debutContenu));
        return m && /\baide=\{AIDE_RETENUE\}/.test(baliseOuvrante(plat, debutContenu + m.index)) ? debutContenu + m.index : -1;
      }
      const re = new RegExp(String.raw`<Text style=\{s\.aide\}\s*>\{\s*${nom.replace('.', '\\.')}\s*\}</Text>`, 'g');
      const t = [...plat.matchAll(re)].map((m) => m.index).filter((i) => i > debutContenu && i < finContenu);
      return t.length === 1 ? t[0] : -1;
    };
    const bornes = titres.map((t) => t.i).concat(finContenu);
    const places = AIDES_PAR_TITRE.map(([nom, k]) => ({ nom, k, i: ouEst(nom) }));
    const malPlacees = places.filter(({ k, i }) => !(i > bornes[k] && i < bornes[k + 1])).map(({ nom }) => nom);
    const dansLOrdre = places.every((p, j) => j === 0 || p.i > places[j - 1].i);
    verifier('TC-2 : les quatre titres de la carte sont là, une fois chacun et dans l’ordre (Réduction, l’acompte, Validité de '
      + 'l’offre, Retenue de garantie), aucun autre titre ; et chaque aide s’affiche sous LE SIEN, dans l’ordre attendu',
    debutContenu > 0 && finContenu > debutContenu && json(titres.map((t) => t.texte)) === json(TITRES) && entetes === 4
      && malPlacees.length === 0 && dansLOrdre,
    `titres ${json(titres.map((t) => t.texte))}, ${entetes} en-tête(s) ; mal placées : ${malPlacees.join(', ') || '—'} ; `
      + `ordre ${dansLOrdre ? 'juste' : 'faux'}`);

    /* 3. Les éléments OUVERTS autour de chaque aide, depuis le début du
       contenu : un fragment passe, tout autre élément est jugé. */
    const ouverts = (jusqua) => {
      const pile = [];
      let i = debutContenu;
      while (i < jusqua) {
        if (plat[i] !== '<') { i += 1; continue; }
        if (plat[i + 1] === '/') {
          const f = plat.indexOf('>', i);
          const nom = plat.slice(i + 2, f).trim();
          let k = pile.length - 1;
          while (k >= 0 && pile[k].nom !== nom) k -= 1;
          pile.length = Math.max(k, 0);
          i = f + 1;
        } else if (plat[i + 1] === '>') {
          pile.push({ nom: '', balise: '<>' }); i += 2;
        } else if (/[A-Za-z]/.test(plat[i + 1])) {
          const balise = baliseOuvrante(plat, i);
          if (i + balise.length > jusqua) break;
          if (!/\/>$/.test(balise)) pile.push({ nom: /^<([\w.]+)/.exec(balise)[1], balise });
          i += balise.length;
        } else i += 1;
      }
      return pile;
    };
    /* Un style qui ÉTALE quelque chose (`{ ...VOILE }`, ou `voile: { ...VOILE }`
       dans la feuille de styles) est illisible ici : ce qu'il étale ne se lit
       pas, et c'est par là qu'une opacité de 0,3 passait au vert (banc final
       du lot 2a, N03). */
    const stylesDe = (expr) => {
      const e = sansEspaces(expr);
      const corps = (nom) => (new RegExp(String.raw`\n\s{2}${nom}:\s*\{([^}]*)\}`).exec(carteSrc) || [])[1];
      if (/^\{\{[\s\S]*\}\}$/.test(e)) return /\.\.\./.test(e) ? null : [e.slice(2, -2)];
      const noms = /^\{\[?((?:\s*s\.\w+\s*,?)+)\]?\}$/.exec(e);
      if (!noms) return null;
      const r = noms[1].split(',').map((x) => x.trim()).filter(Boolean).map((x) => corps(x.slice(2)));
      return r.every((x) => typeof x === 'string' && !/\.\.\./.test(x)) ? r : null;
    };
    const QUI_CACHE = /\b(opacity|height|maxHeight|minHeight|width|maxWidth|overflow|position|left|right|top|bottom|transform|display|zIndex|scale\w*)\s*:/;
    const cachees = [];
    places.forEach(({ nom, i }) => {
      if (i < 0) return;
      ouverts(i).forEach(({ nom: el, balise }) => {
        if (el === '') return;
        const style = /\bstyle=(\{[\s\S]*?\})(?=\s+\w+=|\s*\/?>$)/.exec(balise);
        const corps = style ? stylesDe(style[1]) : [];
        /* SEULE UNE VUE SIMPLE (banc final du lot 2a, N01) : une `<Modal
           visible={false}>` n'a aucun style, aucune prop étalée, rien de ce
           que la liste ci-dessous connaît — et l'aide du 8e jour n'était
           jamais montrée, au vert. Un `ScrollView` horizontal décalé, une
           `Animated.View`, un `Pressable` : la liste des façons de cacher ne
           se ferme pas, celle de ce qui est PERMIS, si — un fragment, ou une
           `View` au style anodin. */
        const faute = el !== 'View' ? `un élément <${el}> (seuls un fragment ou une \`View\` simple peuvent envelopper une aide)`
          : /\{\s*\.\.\./.test(balise) ? 'une prop étalée'
          : /\bnumberOfLines\b/.test(balise) ? '`numberOfLines`'
            : /\b(accessibilityElementsHidden|importantForAccessibility|aria-hidden)\b/.test(balise) ? 'cachée à VoiceOver'
              : corps === null ? 'un style illisible ici'
                : corps.some((c) => QUI_CACHE.test(c)) ? `un style qui cache (${corps.join(' ; ').slice(0, 80)})` : null;
        if (faute) cachees.push(`${nom} dans <${el}> : ${faute}`);
      });
    });
    verifier('TC-2 : entre le début du contenu de la carte et chaque aide, aucun élément ouvert autour d’elle ne la cache — '
      + 'seulement un fragment ou une `View` simple (jamais une `Modal`, un `ScrollView`…), et ni opacité, ni taille, ni '
      + '`overflow`, ni `position`, ni `transform`, ni `display`, ni style étalé, ni `numberOfLines`, ni de quoi la taire à '
      + 'VoiceOver, ni prop étalée (le `ScrollView` et la carte elle-même ne sont pas jugés ici)',
    debutContenu > 0 && places.every(({ i }) => i > 0) && cachees.length === 0,
    cachees.join(' | ') || `${places.filter(({ i }) => i < 0).map(({ nom }) => nom).join(', ')}${FORME_ATTENDUE}`);
  }

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
    pour_qui: 'non_professionnel', pour_qui_client: 'c-1', chantier_neuf_conso: true,
    chantier_neuf_conso_le: '2026-11-02T14:00:00+00:00', chantier_neuf_tva: false,
    /* 2b-3 : « Non » à la décennale (FAUX, pas vide : il se relit faux) et
       l'acompte « à la signature ». */
    engage_decennale: false, acompte_a_la_signature: true,
    client: { nom: 'Mme Essai', type: 'entreprise', siret: '12345678900012' },
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
    pourQui: 'non_professionnel', pourQuiClient: 'c-1', chantierNeufConso: true,
    chantierNeufConsoLe: '2026-11-02T14:00:00+00:00', chantierNeufTva: false,
    engageDecennale: false, acompteALaSignature: true,
    client: { nom: 'Mme Essai', type: 'entreprise', siret: '12345678900012' },
    demande: { createdAt: '2026-10-29T08:00:00Z', budget: '500-1000', texte: 'Refaire la salle de bains' },
    urgence: { createdAt: '2026-10-30T07:00:00Z', texte: 'Fuite — Sous l’évier' },
  };
  const ligneTotaux = {
    total_ht_centimes: 118710, total_tva_centimes: 15616, total_ttc_centimes: 134326, remise_ht_centimes: 13190,
    acompte_ttc_centimes: 34999, total_ttc_options_centimes: 150826, remise_centimes: null, remise_centiemes: 1000,
    acompte_centimes: 35000, acompte_centiemes: null, acompte_nature: 'arrhes', retenue_garantie_centiemes: 500,
    generation: 1793746523496, modifie_le: '2026-11-03T09:30:00.123456+00:00',
    client_id: 'c-1', pour_qui: 'professionnel', pour_qui_client: 'c-1', chantier_neuf_conso: false,
    chantier_neuf_conso_le: null, chantier_neuf_tva: true,
    devis_tva: [
      { taux_tva_centiemes: 1000, base_centimes: 59355, remise_centimes: 6595, tva_centimes: 5936, nb_lignes: 2 },
      { taux_tva_centiemes: 2000, base_centimes: 59355, remise_centimes: 6595, tva_centimes: 11871, nb_lignes: '3' },
      { taux_tva_centiemes: 550, base_centimes: 0, remise_centimes: 0, tva_centimes: 0, nb_lignes: 0 },
    ],
  };
  const TOTAUX_ATTENDUS = {
    ht: 118710, tva: 15616, ttc: 134326, reduction: 13190, brut: 131900, acompte: 34999, ttcOptions: 150826,
    demande: { remiseCentimes: null, remiseCentiemes: 1000, acompteCentimes: 35000, acompteCentiemes: null, acompteNature: 'arrhes',
      retenueGarantieCentiemes: 500, clientId: 'c-1', pourQui: 'professionnel', pourQuiClient: 'c-1', chantierNeufConso: false,
      chantierNeufConsoLe: null, chantierNeufTva: true },
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
  json(trie(luDevis)) === json(trie(DEVIS_ATTENDU)) && D.rowToDevis(null) === null
    /* S42 (2b-2) : un type de fiche ABSENT reste absent — jamais
       « particulier » par défaut, qui ferait PROPOSER « à titre privé ». */
    && D.rowToDevis({ ...ligneDevis, client: { nom: 'X' } }).client.type === null
    && D.rowToDevis({ ...ligneDevis, client: { nom: 'X' } }).client.siret === null,
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
        chacune des dix-huit contraintes du devis ; une coupure, un délai, un
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
    + 'DÉFINITIF (« Réessayer » échouerait à l’identique — vérifié) ; les dix-huit contraintes du devis, sous la forme de PostgREST, '
    + 'aussi ; une coupure, un délai, un interblocage, une écriture dépassée restent réessayables',
  fileP.etatDe('devis') === 'echec' && !!refusP && refusP.code === '23514' && /"devis_plafond_check"/.test(refusP.message || '')
    && ERR.estUnRefusDefinitif(refusP) === true && !!encoreP && encoreP.code === '23514'
    && D.CONTRAINTES_DEVIS.length === 18 && pasDefinitifs.length === 0 && reessayables.length === 0,
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
  /* 2b-3 : TREIZE champs — `urgence` en plus ; l'allumer est un NOUVEAU
     geste (point 18 de la file), la ligne repart. */
  const changees = D.CHAMPS_LIGNE.filter((c) => !rv({ valeurs: { ...lg, [c]: c === 'designation' ? 'y' : (c === 'type' ? 'option' : (c === 'urgence' ? true : 7)) }, derniere: { ...lg, urgence: false }, etat: 'echec', refus: 'ligne' }));
  verifier('`renvoyerLaLigne` : une ligne refusée définitivement et INCHANGÉE ne repart pas (« ligne » comme « brouillon ») ; un seul champ '
    + 'changé — chacun des treize, l’urgence comprise (2b-3) —, elle repart ; un échec qui se réessaie, une ligne enregistrée, une ligne sans dernière écriture '
    + 'connue repartent ; l’identifiant et le devis ne comptent pas',
  rv({ valeurs: { ...lg }, derniere: lg, etat: 'echec', refus: 'ligne' }) === false
    && rv({ valeurs: { ...lg, id: 'autre', devisId: 'd' }, derniere: lg, etat: 'echec', refus: 'brouillon' }) === false
    && changees.length === 0 && D.CHAMPS_LIGNE.length === 13 && D.CHAMPS_LIGNE[12] === 'urgence'
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
    /* UNE LIGNE QUI A UNE VERSION EN BASE, et que rien ne renverra
       (relecture finale du lot 2a, ÉCRAN-F2) : la prédiction compte ce que
       la BASE a — sinon l'en-tête « tiendrait », repartait, et la base le
       refusait de nouveau après CHAQUE écriture réussie. La ligne locale
       JAMAIS insérée, juste au-dessus, ne compte toujours pas. */
    [[E('devis', 'echec', PLAF, {}), E('p', 'enregistree', null, petit),
      E('g', 'locale', null, { ...grosV, prixUnitaireCentimes: null }, { locale: true, confirme: grosV })], []],
    [[E('devis', 'echec', PLAF, {}), E('p', 'enregistree', null, petit),
      E('g', 'echec', { message: 'Network request failed' }, petit, { confirme: grosV })], []],
    [[E('devis', 'echec', PLAF, {}), E('p', 'enregistree', null, petit),
      E('g', 'echec', { message: 'Network request failed' }, petit, { confirme: { ...grosV }, inconnues: ['prixUnitaireCentimes'] })], []],
    [[E('devis', 'echec', PLAF, {}), E('p', 'enregistree', null, petit),
      E('g', 'echec', { message: 'Network request failed' }, grosV, { retire: true, confirme: grosV })], []],
    [[E('devis', 'echec', PLAF, {}), E('p', 'enregistree', null, petit),
      E('g', 'echec', { message: 'Network request failed' }, grosV, { peutEtreInseree: true })], []],
    /* …et la version en base PETITE : on renvoie (ce n'est pas un refus de principe). */
    [[E('devis', 'echec', PLAF, {}), E('p', 'enregistree', null, petit),
      E('g', 'locale', null, { ...grosV, prixUnitaireCentimes: null }, { locale: true, confirme: petit })], ['devis']],
    /* L'en-tête lui-même, en échec pour une coupure sur la réduction : on ne sait pas laquelle la base a. */
    [[E('devis', 'echec', { message: 'Network request failed' }, {}, { confirme: {}, inconnues: ['remiseCentiemes'] }),
      E('p', 'echec', PLAF, petit)], []],
    [[E('devis', 'echec', { message: 'Network request failed' }, {}, { confirme: {}, inconnues: ['objet'] }),
      E('p', 'echec', PLAF, petit)], ['p']],
  ];
  const fautes = cas.filter(([entrees, attendu]) => json(D.clesARejouerApresLePlafond(entrees)) !== json(attendu));
  verifier('`clesARejouerApresLePlafond` : seulement des refus du PLAFOND en échec ; rien si le devis ne tiendrait pas ; une ligne '
    + 'retirée en cours, ou locale JAMAIS insérée, ne compte pas ; une ligne qui a une version EN BASE et que rien ne renverra '
    + '(locale, en échec pour une coupure, un retrait qui n’a pas pu se faire, une insertion sans réponse) compte pour ce que la '
    + 'base a — et rien ne part quand on ne sait pas ce qu’elle a (une colonne qui compte, partie sans réponse)',
  fautes.length === 0, fautes.map(([, a]) => json(a)).join(' | '));
  /* …et PAR LA VRAIE FILE (les deux formes reproduites par la relecture) :
     une ligne en base rendue « locale », et une ligne baissée dont l'écriture
     s'est perdue. Trois petites lignes écrites ensuite : AUCUN renvoi, AUCUN
     refus de plus de l'en-tête, AUCUN signal (`echecASignaler`). */
  for (const variante of ['locale', 'coupure']) {
    let coupe = false;
    const { base, file, etat } = monter((op, normal) => {
      if (coupe && op.quoi === 'ligne' && op.id === GROS.id) return Promise.reject(new Error('Network request failed'));
      return normal();
    });
    /* `monter` renvoie déjà le plafond à chaque `totaux` (`etat.rejoues`) :
       on n'écoute ici que les échecs, et ce qu'ils signaleraient. */
    const signaux = { n: 0, refusEntete: 0 };
    file.abonner((ev) => {
      if (ev.type !== 'etat') return;
      if (D.echecASignaler({ etat: ev.etat, automatique: false, retenu: ev.retenu === true })) signaux.n += 1;
      if (ev.cle === 'devis' && ev.etat === 'echec') signaux.refusEntete += 1;
    });
    file.ligne(GROS); await auRepos(file);
    file.devis({ remiseCentiemes: null }); await auRepos(file);
    if (variante === 'locale') file.marquerLocale(GROS.id, { ...GROS, prixUnitaireCentimes: null });
    else { coupe = true; file.ligne({ ...GROS, prixUnitaireCentimes: 100000 }); await auRepos(file); coupe = false; }
    const r0 = { n: etat.n, rejoues: etat.rejoues.length, signaux: signaux.n, refus: signaux.refusEntete };
    for (let k = 1; k <= 3; k += 1) {
      file.ligne({ id: IDA(40 + k), ordre: 5000 + k, type: 'poste', designation: `Petit ${k}`, quantiteMilliemes: 1000, unite: 'forfait',
        prixUnitaireCentimes: 10000, tauxTvaCentiemes: 2000 });
      await auRepos(file);
    }
    const apres = { ecritures: etat.n - r0.n, renvois: etat.rejoues.length - r0.rejoues, signaux: signaux.n - r0.signaux,
      refus: signaux.refusEntete - r0.refus, remise: await remiseEnBase(base), gros: file.etatDe(GROS.id) };
    verifier(`la vraie file, une ligne en base ${variante === 'locale' ? 'rendue « locale »' : 'baissée sans réponse (une coupure)'} : trois `
      + 'petites lignes écrites ensuite font TROIS écritures — aucun renvoi de l’en-tête, aucun refus de plus, aucune vibration ni '
      + 'annonce —, et la base garde sa réduction',
    apres.ecritures === 3 && apres.renvois === 0 && apres.signaux === 0 && apres.refus === 0 && apres.remise === 5000
      && apres.gros === (variante === 'locale' ? 'locale' : 'echec'), json(apres));
  }

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
    && /const f = fileRef\.current;\s*if \(f\) renvois\.rejouer\(f\);/.test(corpsFleche(S, 'const rejouerLePlafond = () =>'))
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
      && /const \[renvois\] = useState\(creerRenvoisAutomatiques\);/.test(S)
      && /const f = fileRef\.current;\s*if \(f\) renvois\.rejouer\(f\);/.test(corpsFleche(S, 'const rejouerLePlafond = () =>'))
      /* …et `rejouer` ne retient pas une clé déjà enregistrée au retour, FAIT TOURNER sur une file factice. */
      && (() => {
        const r = D.creerRenvoisAutomatiques();
        const faux = {
          entreesVoulues: () => [{ cle: 'devis', etat: 'echec' }, { cle: 'L', etat: 'echec' }],
          erreurDe: () => Object.assign(new Error('x "devis_plafond_check"'), { code: '23514' }),
          reessayer: () => {}, etatDe: (c) => (c === 'devis' ? 'enregistree' : 'en_cours'), gestesDe: () => 0,
        };
        const parti = r.rejouer(faux);
        return Array.isArray(parti) && !r.issue(faux, { cle: 'devis', etat: 'enregistree' })
          && (parti.includes('L') ? r.issue(faux, { cle: 'L', etat: 'enregistree' }) : true);
      })());
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
  /* 2b-3 (E-B1) : un SEPTIÈME choix gardé, l'échéance — « À la signature »
     gardé sur un devis qui dit « Dès le 8e jour », et l'inverse ; et `null`
     gardé (rien de choisi) l'emporte aussi. */
  const garde1 = { uniteReduction: 'montant', uniteAcompte: 'montant', nature: 'arrhes', validite: 60, validiteAutre: false, retenue: true,
    echeance: true };
  const r1 = D.etatInitialConditions({ remiseCentiemes: 700, acompteCentiemes: 3000, acompteNature: 'acompte', validiteJours: 30,
    acompteALaSignature: false }, { reduction: '12', acompte: '150', choix: garde1 });
  const garde2 = { uniteReduction: 'pourcent', uniteAcompte: 'pourcent', nature: null, validite: null, validiteAutre: false, retenue: false,
    echeance: false };
  const r2 = D.etatInitialConditions({ remiseCentimes: 5000, acompteCentimes: 15000, acompteNature: 'arrhes', validiteJours: 60,
    retenueGarantieCentiemes: 500, acompteALaSignature: true }, { reduction: '5', acompte: '10', choix: garde2 });
  const r3 = D.etatInitialConditions({ acompteALaSignature: true }, { choix: { echeance: null } });
  const r4 = D.etatInitialConditions({ acompteALaSignature: true }, { choix: { echeance: 'oui' } });
  verifier('`etatInitialConditions`, FAIT TOURNER : « Corriger » rouvre la carte sur les SEPT choix gardés — l’unité de la réduction, '
    + 'CELLE DE L’ACOMPTE, la nature, la validité, « Autre », la retenue, et l’échéance (2b-3) — même quand le devis enregistré dit le '
    + 'contraire, dans les deux sens ; une échéance gardée VIDE l’emporte, une valeur inconnue non',
  json(r1) === json(garde1) && json(r2) === json(garde2) && r3.echeance === null && r4.echeance === true,
  `${json(r1)} | ${json(r2)} | ${json(r3)} | ${json(r4)}`);

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
        lisait `echec` au lieu de `reessayable`) aussi.

        ET LE CONTRÔLE NE VOYAIT QU'UNE ÉCRITURE (relecture finale du lot 2a,
        TC-1) : il ne comptait que `reessayer('devis')`, apostrophes et clé en
        toutes lettres. La bande des lignes retirées appelait `reessayer()`
        SANS clé — qui renvoie l'en-tête et les lignes refusés pour de bon —,
        et `reessayer("devis")` ou `reessayerStable('devis')` hors garde
        passaient au vert. Il relève désormais CHAQUE appel de la file, quelle
        que soit l'écriture de l'argument, et chacun doit être l'un des trois
        permis : la rangée (`reessayerStable(id)`, dont `EtatDeLaRangee` ne
        se sert que sous `!definitif` — section 37 e), la bande de l'en-tête
        sous la garde, la carte « Conditions ». La bande des retraits passe
        par `renvoyerLesRetraits`, FAIT TOURNER plus bas sur une vraie file. */
  const S38 = ECR.saisie;
  const blanchi = S38.replace(/`(?:[^`\\]|\\.)*`/g, (m) => '`' + ' '.repeat(m.length - 2) + '`')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, (m) => "'" + ' '.repeat(m.length - 2) + "'")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, (m) => '"' + ' '.repeat(m.length - 2) + '"');
  const finDeParenthese = (t, i) => { let p = 0; for (let j = i; j < t.length; j += 1) { if (t[j] === '(') p += 1; if (t[j] === ')') { p -= 1; if (p === 0) return j; } } return -1; };
  const gardes = [...blanchi.matchAll(/\{!estUnRefusDefinitif\(attente\.devisErreur\) && \(/g)]
    .map((m) => [m.index, finDeParenthese(blanchi, m.index + m[0].length - 1)]);
  const balise38 = balises(S38, 'ConditionsDevis')[0] || '';
  const iBalise = balise38 ? S38.indexOf(balise38) : -1;
  /* TOUS les appels à la file, l'argument écrit comme on voudra — et aucun
     accès détourné (`const { reessayer } = …`, `f['reessayer']`). */
  const appelsFile = [...blanchi.matchAll(/\.\s*reessayer\b/g)].map((m) => m.index);
  const detournes = [...blanchi.matchAll(/(?<![.\w])reessayer\b/g)].length + (S38.match(/\[\s*['"`]reessayer['"`]\s*\]/g) || []).length;
  const appelDe = (i) => sansEspaces(S38.slice(i, finDeParenthese(S38, S38.indexOf('(', i)) + 1))
    .replace(/^\.reessayer\(\s*["`]devis["`]\s*\)$/, ".reessayer('devis')");
  const DEF_STABLE = 'const reessayerStable = useCallback((id) => { if (fileRef.current) fileRef.current.reessayer(id); }, []);';
  const iStable = sansEspaces(S38).indexOf(DEF_STABLE);
  const classe = appelsFile.map((i) => {
    const appel = appelDe(i);
    if (appel === ".reessayer('devis')" && gardes.some(([a, b]) => i > a && i < b)) return 'bande';
    if (appel === ".reessayer('devis')" && iBalise >= 0 && i > iBalise && i < iBalise + balise38.length) return 'carte';
    if (appel === '.reessayer(id)' && /const reessayerStable = useCallback\(\(id\) => \{ if \(fileRef\.current\) fileRef\.current$/.test(sansEspaces(S38.slice(Math.max(0, i - 120), i)))) return 'rangee';
    return `NU : ${appel} — ${sansEspaces(S38.slice(Math.max(0, i - 80), i))}`;
  });
  const nus = classe.filter((c) => c.startsWith('NU'));
  /* `reessayerStable` : sa définition, et deux passages `onReessayer={reessayerStable}` — jamais appelé avec une clé. */
  const stables = [...blanchi.matchAll(/\breessayerStable\b/g)].map((m) => sansEspaces(S38.slice(m.index - 14, m.index + 'reessayerStable'.length + 1)));
  const passages = stables.filter((t) => t === 'onReessayer={reessayerStable}').length;
  verifier('CHAQUE renvoi par la file (`.reessayer(`, quelle que soit l’écriture de l’argument) est l’un des trois permis : la bande de '
    + 'l’en-tête sous la garde du refus définitif, la carte « Conditions » (dont `reessayable` porte cette garde), la rangée '
    + '(`reessayerStable(id)`, passé tel quel aux rangées) — aucun `reessayer()` sans clé, aucun accès détourné, aucun '
    + '`reessayerStable(…)` appelé à la main',
  appelsFile.length === 3 && json(classe.slice().sort()) === json(['bande', 'carte', 'rangee']) && nus.length === 0 && detournes === 0
    && iStable >= 0 && stables.length === 3 && passages === 2
    && /reessayable: !!attente\.devisErreur && !estUnRefusDefinitif\(attente\.devisErreur\)/.test(balise38)
    && /onReessayer=\{\(\) => fileRef\.current && fileRef\.current\.reessayer\((['\"`])devis\1\)\}/.test(balise38),
  `${appelsFile.length} appel(s) : ${classe.join(' | ')} ; reessayerStable : ${json(stables)} ; détournés ${detournes}`);
  {
    /* …ET PAR AUCUNE AUTRE PORTE (banc final du lot 2a, N13 à N15). Trois
       façons de renvoyer un refus définitif passaient encore au vert, contre
       ce contrôle comme contre les 56 :
       - un accès CALCULÉ sur la file (`fileRef.current['rees' + 'sayer']()`) :
         une chaîne recousue ne se lit pas ;
       - une fonction d'un AUTRE fichier qui renvoie tout pour l'écran
         (`toutRenvoyer(file)` → `file.reessayer()`, dans devis.js) ;
       - un second appel de `renvoyerLesRetraits` SANS le refus définitif.
       D'où, sur le code sans ses commentaires ni ses chaînes : aucun accès
       calculé sur la file (l'écran et devis.js) ; dans TOUT `src/`,
       `.reessayer(` n'est appelé que par l'écran (les trois permis, plus
       haut) et, dans devis.js, par les deux seules fonctions qui ont à le
       faire (`rejouerLesRefusDuPlafond`, `renvoyerLesRetraits`) ; et ces
       deux-là ne sont appelées, dans tout `src/`, qu'une fois chacune — par
       l'écran (la bande des retraits est vérifiée plus bas, avec son refus
       définitif). */
    const vider38 = (t) => t.replace(/`(?:[^`\\]|\\.)*`/g, (m) => '`' + ' '.repeat(m.length - 2) + '`')
      .replace(/'(?:[^'\\\n]|\\.)*'/g, (m) => "'" + ' '.repeat(m.length - 2) + "'")
      .replace(/"(?:[^"\\\n]|\\.)*"/g, (m) => '"' + ' '.repeat(m.length - 2) + '"');
    const SAISIE38 = 'src/screens/SaisieDevisScreen.js';
    const DEVIS38 = 'src/lib/devis.js';
    const fichiers38 = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { cwd: RACINE, encoding: 'utf8' })
      .stdout.split('\n').filter((f) => /\.(js|jsx|ts|tsx)$/.test(f));
    const plats38 = Object.fromEntries(fichiers38.map((f) => [f, vider38(sansCommentairesJs(lire(f)))]));
    const nomsFile = ['fileRef\\.current', ...[...(plats38[SAISIE38] || '').matchAll(/\bconst\s+(\w+)\s*=\s*fileRef\.current\b/g)].map((m) => m[1])];
    const calcules = [
      ...nomsFile.flatMap((n) => [...(plats38[SAISIE38] || '').matchAll(new RegExp(String.raw`(?<![\w.$])${n}\s*(?:\?\.)?\s*\[`, 'g'))]
        .map((m) => `l’écran : ${sansEspaces((plats38[SAISIE38] || '').slice(m.index, m.index + 40))}`)),
      ...[...(plats38[DEVIS38] || '').matchAll(/(?<![\w.$])(?:file|f)\s*(?:\?\.)?\s*\[/g)]
        .map((m) => `devis.js : ${sansEspaces((plats38[DEVIS38] || '').slice(m.index, m.index + 40))}`),
    ];
    const permis = ['rejouerLesRefusDuPlafond', 'renvoyerLesRetraits'].map((n) => {
      const corps = corpsDeFonction(plats38[DEVIS38] || '', n) || '';
      const a = corps ? (plats38[DEVIS38] || '').indexOf(corps) : -1;
      return [a, a + corps.length];
    });
    const sitesHors = fichiers38.filter((f) => f !== SAISIE38).flatMap((f) => [...plats38[f].matchAll(/\.\s*reessayer\s*\(/g)]
      .filter((m) => !(f === DEVIS38 && permis.some(([a, b]) => a >= 0 && m.index > a && m.index < b)))
      .map((m) => `${f} : ${sansEspaces(plats38[f].slice(Math.max(0, m.index - 50), m.index + 20))}`));
    const appelsDe = (nom) => fichiers38.flatMap((f) => [...plats38[f].matchAll(new RegExp(String.raw`(?<![\w.$])${nom}\s*\(`, 'g'))]
      .filter((m) => !/function\s+$/.test(plats38[f].slice(Math.max(0, m.index - 10), m.index))).map(() => f));
    const appelsRejouer = appelsDe('rejouerLesRefusDuPlafond');
    /* Depuis N1, le renvoi du plafond passe par `creerRenvoisAutomatiques`
       (devis.js), que l'écran tient UNE fois (`useState`) : l'appel de
       `rejouerLesRefusDuPlafond` vit DANS son corps, et `renvois.rejouer(`
       n'est écrit qu'une fois, dans l'écran. */
    const corpsRenvois = corpsDeFonction(plats38[DEVIS38] || '', 'creerRenvoisAutomatiques') || '';
    const rejouerDansRenvois = (corpsRenvois.match(/(?<![\w.$])rejouerLesRefusDuPlafond\s*\(/g) || []).length === 1;
    const renvoisDansEcran = fichiers38.flatMap((f) => [...plats38[f].matchAll(/\.\s*rejouer\s*\(/g)].map(() => f));
    const appelsRetraits = appelsDe('renvoyerLesRetraits');
    verifier('« Réessayer » ne passe par AUCUNE autre porte : aucun accès calculé sur la file (`fileRef.current[…]`, `file[…]`) ; dans '
      + 'tout `src/`, `.reessayer(` n’est appelé que par l’écran et, dans devis.js, par `rejouerLesRefusDuPlafond` et '
      + '`renvoyerLesRetraits` seules ; et ces deux-là ne sont appelées qu’une fois chacune, par l’écran',
    fichiers38.length > 50 && !!plats38[SAISIE38] && !!plats38[DEVIS38] && calcules.length === 0 && sitesHors.length === 0
      && permis.every(([a]) => a >= 0) && json(appelsRejouer) === json([DEVIS38]) && rejouerDansRenvois
      && json(renvoisDansEcran) === json([SAISIE38]) && json(appelsRetraits) === json([SAISIE38]),
    `calculés ${json(calcules)} ; hors permis ${json(sitesHors)} ; rejouer ${json(appelsRejouer)} (dans creerRenvoisAutomatiques : `
      + `${rejouerDansRenvois}) ; .rejouer( ${json(renvoisDansEcran)} ; retraits ${json(appelsRetraits)}`);
  }
  /* …la bande des retraits passe par `renvoyerLesRetraits`, avec le refus
     définitif de l'écran, sous `retraitsRenvoyables` ; et la règle TOURNE
     sur une vraie file : l'en-tête et une ligne refusés par le plafond, un
     retrait coupé du réseau — SEUL le retrait repart. */
  const iRetraits = S38.indexOf('attente.retraitsEnEchec > 0 && (');
  const bandeRetraits = iRetraits >= 0 ? sansEspaces(S38.slice(iRetraits, finDeParenthese(S38, S38.indexOf('(', iRetraits + 'attente.retraitsEnEchec > 0 && '.length)) + 1)) : '';
  const journalTc1 = [];
  const plafondTc1 = () => Object.assign(new Error('new row for relation "devis" violates check constraint "devis_plafond_check"'), { code: '23514' });
  let couperTc1 = true;
  const baseTc1 = new Map([['L1', { id: 'L1' }], ['L2', { id: 'L2' }]]);
  const ligneTc1 = (id, plus = {}) => ({ id, ordre: 1000, type: 'poste', designation: 'Chape', quantiteMilliemes: 1000, unite: 'm2',
    prixUnitaireCentimes: 4500, tauxTvaCentiemes: 1000, offert: false, ...plus });
  const fileTc1 = F.creerFileEcriture({
    devisId: 'D1', devis: { source: 'manuelle', remiseCentiemes: 5000 }, devisEnBase: true, lignesEnBase: [ligneTc1('L1'), ligneTc1('L2')],
    ecrire: async (op) => {
      journalTc1.push(`${op.action} ${op.quoi}${op.quoi === 'ligne' ? ` ${op.id}` : ''}`);
      if (op.quoi === 'devis' && op.action === 'modifier') throw plafondTc1();
      if (op.quoi === 'ligne' && op.id === 'L3') throw plafondTc1();
      if (op.action === 'supprimer' && couperTc1) throw new TypeError('Network request failed');
      return null;
    },
    relireUn: async ({ quoi, id }) => (quoi === 'ligne' ? (baseTc1.get(id) || null) : { id }),
    avecDelai: ERR.avecDelai, delaiMs: 40, nouvelIdentifiant: () => null, paires: D.PAIRES_DEVIS, aPart: D.colonnesDuRefus,
  });
  fileTc1.devis({ remiseCentiemes: null });
  fileTc1.ligne(ligneTc1('L3', { prixUnitaireCentimes: 999999999 }));
  fileTc1.retirerLigne('L2');
  await new Promise((ok) => { setTimeout(ok, 300); });
  const avantTc1 = { devis: fileTc1.etatDe('devis'), l3: fileTc1.etatDe('L3'), l2: fileTc1.etatDe('L2'), retiree: fileTc1.retiree('L2'),
    definitifs: [ERR.estUnRefusDefinitif(fileTc1.erreurDe('devis')), ERR.estUnRefusDefinitif(fileTc1.erreurDe('L3'))] };
  const n0Tc1 = journalTc1.length;
  couperTc1 = false;
  const renvoyesTc1 = D.renvoyerLesRetraits(fileTc1, { estDefinitif: ERR.estUnRefusDefinitif });
  await new Promise((ok) => { setTimeout(ok, 300); });
  const partisTc1 = journalTc1.slice(n0Tc1);
  verifier('« Réessayer » de la bande des lignes RETIRÉES ne renvoie QUE les retraits : `renvoyerLesRetraits(fileRef.current, { estDefinitif: '
    + 'estUnRefusDefinitif })`, sous `retraitsRenvoyables` — et, FAIT TOURNER sur une vraie file (l’en-tête et une ligne refusés par le '
    + 'plafond, un retrait coupé), seul le retrait repart ; l’en-tête et la ligne restent refusés, sans une écriture de plus',
  /attente\.retraitsRenvoyables > 0 && \(\s*<BtnOutline label="Réessayer" onPress=\{\(\) => fileRef\.current && renvoyerLesRetraits\(fileRef\.current, \{ estDefinitif: estUnRefusDefinitif \}\)\} \/>\s*\)/.test(bandeRetraits)
    && !/\.reessayer\(/.test(bandeRetraits)
    && avantTc1.devis === 'echec' && avantTc1.l3 === 'echec' && avantTc1.l2 === 'echec' && avantTc1.retiree && avantTc1.definitifs.every(Boolean)
    && json(renvoyesTc1) === json(['L2']) && json(partisTc1) === json(['supprimer ligne L2'])
    && fileTc1.etatDe('devis') === 'echec' && fileTc1.etatDe('L3') === 'echec' && fileTc1.etatDe('L2') === null,
  `${json(avantTc1)} → renvoyés ${json(renvoyesTc1)}, partis ${json(partisTc1)} ; bande : ${bandeRetraits.slice(0, 220)}`);
  /* …et `retraitsARenvoyer` laisse un retrait refusé pour de bon, l'en-tête et une ligne non retirée. */
  const ER = (cle, etat, erreur, x = {}) => ({ cle, etat, erreur, voulu: {}, retire: false, ...x });
  const casRetraits = D.retraitsARenvoyer([ER('devis', 'echec', plafondTc1(), { retire: true }), ER('a', 'echec', { message: 'Network request failed' }, { retire: true }),
    ER('b', 'echec', plafondTc1(), { retire: true }), ER('c', 'echec', { message: 'Network request failed' }), ER('d', 'en_cours', null, { retire: true })],
  { estDefinitif: ERR.estUnRefusDefinitif });
  verifier('`retraitsARenvoyer` : un retrait coupé du réseau, oui ; un retrait refusé pour de bon, l’en-tête, une ligne non retirée, un '
    + 'retrait en cours, non', json(casRetraits) === json(['a']), json(casRetraits));
  const clesReessayable = [...carte38.matchAll(/\breessayable\s*:\s*([^,\n]+),/g)].map((m) => sansEspaces(m[1]));
  verifier('…et la carte prend `reessayable` de l’écran TEL QUEL (`!!(etatEcriture && etatEcriture.reessayable)`), une seule fois — '
    + 'jamais `echec`, qui proposerait « Réessayer » sur un refus définitif',
  json(clesReessayable) === json(['!!(etatEcriture && etatEcriture.reessayable)']), json(clesReessayable));

  /* g. CE QUE DIT LA GARDE EN PARTANT (R1d) : « Opus les renverra tout
        seul » ajouté à la phrase des lignes en échec passait — or rien
        n'est renvoyé après le départ. ET (relecture finale du lot 2a,
        ÉCRAN-F1) : l'en-tête n'était dit que quand AUCUNE ligne n'était en
        cause, et le bouton disait « Quitter sans elles » pour un en-tête
        seul. La règle vit dans `bilanDeLaGarde` (devis.js), FAITE TOURNER
        ici, phrase ENTIÈRE et bouton, cas par cas ; l'écran la prend telle
        quelle. */
  const PH = D.phraseEchecDuDevis({ enBase: true, erreur: { code: '23514', message: 'x "devis_plafond_check"' } });
  const GARDES = [
    [{ enEchec: 2 }, '2 lignes n’ont pas pu être enregistrées.', 'Quitter sans elles'],
    [{ enEchec: 1 }, 'Une ligne n’a pas pu être enregistrée.', 'Quitter sans elles'],
    [{ enCours: 2 }, '2 lignes ne sont pas encore enregistrées : l’envoi continue, mais rien ne garantit qu’il aboutira.', 'Quitter quand même'],
    [{ enCours: 1 }, 'Une ligne n’est pas encore enregistrée : l’envoi continue, mais rien ne garantit qu’il aboutira.', 'Quitter quand même'],
    [{ entete: PH }, 'La réduction n’a pas pu être changée.', 'Quitter sans l’enregistrer'],
    [{ entete: D.ENTETE_EN_COURS }, 'L’en-tête du devis n’est pas encore enregistré : l’envoi continue, mais rien ne garantit qu’il aboutira.', 'Quitter quand même'],
    [{ enEchec: 1, entete: PH }, 'Une ligne n’a pas pu être enregistrée. La réduction n’a pas pu être changée.', 'Quitter quand même'],
    [{ enEchec: 1, enCours: 1 }, 'Une ligne n’a pas pu être enregistrée. Une ligne n’est pas encore enregistrée : l’envoi continue, mais rien ne garantit qu’il aboutira.', 'Quitter quand même'],
  ];
  const gardesFausses = GARDES.filter(([arg, phrase, quitter]) => { const r = D.bilanDeLaGarde(arg); return r.phrase !== phrase || r.quitter !== quitter; })
    .map(([arg]) => `${json(arg)} → ${json(D.bilanDeLaGarde(arg))}`);
  verifier('`bilanDeLaGarde`, FAITE TOURNER : la garde dit, en partant, EXACTEMENT ce qui n’est pas en base — les lignes refusées, celles dont '
    + 'l’envoi continue SANS garantie, et l’EN-TÊTE même avec des lignes (refusé, ou encore en route) ; jamais un renvoi promis après le '
    + 'départ ; le bouton ne dit « sans elles » que pour des lignes, « sans l’enregistrer » pour l’en-tête seul et refusé, « quand même » '
    + 'quand un envoi continue',
  gardesFausses.length === 0 && GARDES.every(([arg]) => !/renverra|tout seul/.test(D.bilanDeLaGarde(arg).phrase)), gardesFausses.join(' | '));
  const bilanEcran = corpsFleche(S38, 'const bilan = () =>');
  const iBilan = S38.indexOf("garde.phase === 'bilan' && garde.incompletes.length === 0 && garde.enteteRefuse.length === 0");
  const bandeBilan = iBilan >= 0 ? sansEspaces(S38.slice(iBilan, S38.indexOf('</View>\n        )}', iBilan))) : '';
  verifier('…et la saisie la prend TELLE QUELLE : `bilan()` appelle `bilanDeLaGarde({ enEchec, enCours, entete })` — l’en-tête refusé par '
    + '`phraseEchecDuDevis` avec ce qui reste tenu à part, ou `ENTETE_EN_COURS` —, la bande écrit `garde.texte`, le bouton `garde.quitter` ; '
    + 'aucune phrase de bilan écrite dans l’écran',
  /const \{ phrase, quitter \} = bilanDeLaGarde\(\{ enEchec, enCours, entete \}\);/.test(bilanEcran)
    && /if \(etatEntete === 'echec'\) \{\s*entete = phraseEchecDuDevis\(\{ enBase: f\.devisEnBase\(\), erreur: f\.erreurDe\('devis'\), retenue: f\.retenueDe\('devis'\) \}\);\s*\} else if \(etatEntete === 'en_cours'\) entete = ENTETE_EN_COURS;/.test(bilanEcran)
    && /texte: phrase, quitter/.test(bilanEcran)
    && /<Text style=\{s\.bandeTexte\}>\{garde\.texte\}<\/Text>/.test(bandeBilan) && /<BtnOutline label=\{garde\.quitter\} onPress=\{\(\) => repondreGarde\(true\)\} \/>/.test(bandeBilan)
    && !/n’ont pas pu être enregistrées|Quitter sans elles|Quitter quand même/.test(S38),
  bandeBilan.slice(0, 260));

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
  {
    /* i. LES AIDES QUE LA MESURE CHERCHE SONT CELLES DE `devis.js` (banc
          final du lot 2a, N42). `mesure-devis` écrit les neuf aides EN TOUTES
          LETTRES — exprès, pour ne pas devenir une tautologie : il compare
          l'écran à SA copie. Mais rien ne tenait cette copie : « expressément »
          retiré de la mesure passait au vert ici (et la mesure n'est pas dans
          `npm run verifier`). La copie de la mesure est donc comparée, mot
          pour mot, aux constantes de `devis.js` (espaces insécables lues comme
          des espaces, comme la mesure les lit à l'écran), dans l'ordre et sous
          les titres de la carte. */
    const blocA = (/const ATTENDUES = \[([\s\S]*?)\n {2}\];/.exec(M38) || [])[1] || '';
    const lues = [...blocA.matchAll(/\{\s*titre:\s*'([^']*)',\s*aide:\s*((?:'(?:[^'\\]|\\.)*'\s*\+?\s*)+)\}/g)]
      .map((m) => [m[1], [...m[2].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]).join('')]);
    const plat2 = (t) => String(t || '').replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();
    const REFERENCE = [['Réduction', D.AIDE_REDUCTION], ['Réduction', D.AIDE_REDUCTION_HT], ['Acompte', D.AIDE_ACOMPTE],
      ['Acompte', D.AIDE_ACOMPTE_TTC], ['Acompte', D.AIDE_NATURE_ACOMPTE], ['Acompte', D.ECHEANCE_ACOMPTE],
      ['Validité de l’offre', D.AIDE_VALIDITE], ['Retenue de garantie', D.AIDE_RETENUE], ['Retenue de garantie', D.PHRASE_RETENUE]];
    const ecarts = REFERENCE.map(([t, a], k) => (lues[k] && lues[k][0] === t && plat2(lues[k][1]) === plat2(a) ? null
      : `${k + 1} (${t}) : « ${lues[k] ? plat2(lues[k][1]).slice(0, 80) : '—'} »`)).filter(Boolean);
    verifier('`mesure-devis` cherche à l’écran EXACTEMENT les neuf aides de `devis.js` — sa copie écrite en toutes lettres est comparée '
      + 'mot pour mot aux constantes, dans l’ordre et sous leurs titres (une mesure qui perdrait « expressément » accepterait l’ancienne aide)',
    lues.length === REFERENCE.length && ecarts.length === 0, `${lues.length} aide(s) lue(s) ; écarts : ${ecarts.join(' | ') || '—'}`);
  }
}

console.log('\n  39. la relecture finale du 04/11 — l’en-tête refusé n’emporte plus le reste, un renvoi automatique se tait, FAITS TOURNER');
{
  /* POURQUOI (relecture finale du lot 2a, ÉCRAN-F1 = TC-4, F2, F3, F4) :
     après un refus du plafond sur la réduction, l'objet tapé ensuite
     partait AVEC elle, était refusé avec elle, n'était nommé nulle part,
     et « Mes devis » l'affichait quand même ; un renvoi automatique refusé
     vibrait ; VoiceOver entendait « La réduction est maintenant
     enregistrée » quand elle venait d'être RETIRÉE ; la gélule de l'option
     refusée avait perdu son remplissage. Tout est FAIT TOURNER, par la
     VRAIE file configurée comme `api.js` la configure. */
  const IDZ = (k) => `de0000ee-0000-4000-8000-0000000039${String(k).padStart(2, '0')}`;
  const API39 = sansCommentairesJs(lire('src/lib/api.js'));
  verifier('`api.js` donne à la file ce qu’un refus met à part : `aPart: colonnesDuRefus` (devis.js) — et `colonnesDuRefus` ne nomme que la '
    + 'paire de la réduction, et seulement pour un refus du plafond',
  /paires: PAIRES_DEVIS,\s*aPart: colonnesDuRefus,\s*\}\);/.test(API39)
    && json(D.colonnesDuRefus({ code: '23514', message: 'x "devis_plafond_check"' })) === json(['remiseCentiemes', 'remiseCentimes'])
    && D.colonnesDuRefus({ code: '23514', message: 'x "devis_validite_check"' }) === null
    && D.colonnesDuRefus({ message: 'Network request failed' }) === null && D.colonnesDuRefus(null) === null);

  /* UNE BOUCLE DE RENVOI NE TIENT PAS LE CONTRÔLE SANS FIN (banc final du
     lot 2a, N73) : les deux barrières de la file retirées (les colonnes
     tenues repartaient avec l'objet, et `dejaReparti` ne bornait plus le
     départ « sans la réduction »), le renvoi était refusé pareil, à
     l'infini — ce contrôle ne finissait JAMAIS, donc ne rougissait jamais,
     et `npm run verifier` n'a pas de délai par contrôle. Au-delà de
     `PLAFOND39` écritures, le faux serveur refuse tout (une coupure, qui ne
     relance rien), et le compte des emballements est relevé à la fin. */
  const PLAFOND39 = 300;
  let emballements39 = 0;
  let ecrituresMax39 = 0;
  const monter39 = (intercepter = null) => {
    const base = DEMO.creerBaseDevisDemo({ demandeDe: () => null });
    const etat = { n: 0, ops: [], evenements: [], signaux: 0, annonces: [], renvois: D.creerRenvoisAutomatiques() };
    const file = F.creerFileEcriture({
      devisId: IDZ(1), devis: { objet: 'Ancien objet', source: 'manuelle', remiseCentiemes: 5000 }, devisEnBase: false,
      ecrire: (op) => {
        etat.n += 1;
        ecrituresMax39 = Math.max(ecrituresMax39, etat.n);
        if (etat.n > PLAFOND39) {
          if (etat.n === PLAFOND39 + 1) emballements39 += 1;
          return Promise.reject(new Error('Network request failed'));
        }
        etat.ops.push(`${op.action} ${op.quoi}${op.quoi === 'devis' ? ` ${json(op.valeurs || {})}` : ''}`);
        return intercepter ? intercepter(op, () => base.ecrire('1', op)) : base.ecrire('1', op);
      },
      relireUn: (q) => base.relireUn('1', q), relireTotaux: (id) => base.relireTotaux('1', id),
      avecDelai: ERR.avecDelai, nouvelIdentifiant: I.nouvelIdentifiant, paires: D.PAIRES_DEVIS, aPart: D.colonnesDuRefus,
    });
    /* L'écoute de la saisie, réduite à ce qui décide : le renvoi au repos,
       le signal d'un échec, l'annonce d'un renvoi qui passe. */
    file.abonner((ev) => {
      if (ev.type === 'totaux') {
        Promise.resolve().then(() => etat.renvois.rejouer(file));
      }
      if (ev.type !== 'etat') return;
      etat.evenements.push(`${ev.cle === 'devis' ? 'devis' : 'ligne'}:${ev.etat}${ev.retenu ? ':retenu' : ''}`);
      const automatique = etat.renvois.issue(file, ev);
      if (automatique && ev.etat === 'enregistree') etat.annonces.push(D.phraseDuRejeu(ev.cle === 'devis' ? 'entete' : 'ligne', file.entreesVoulues().find((x) => x.cle === 'devis').voulu));
      if (D.echecASignaler({ etat: ev.etat, automatique, retenu: ev.retenu === true })) etat.signaux += 1;
    });
    return { base, file, etat };
  };
  const repos39 = async (f) => { for (let k = 0; k < 6; k += 1) { await f.attendre(5000); await new Promise((ok) => { setTimeout(ok, 10); }); } };
  const GROS39 = { id: IDZ(11), ordre: 1000, type: 'poste', designation: 'Gros œuvre', quantiteMilliemes: 1000, unite: 'forfait',
    prixUnitaireCentimes: 9000000000, tauxTvaCentiemes: 2000 };
  const enBase39 = async (b) => b.relireUn('1', { quoi: 'devis', id: IDZ(1) });

  /* a. L'OBJET ET LA VALIDITÉ, APRÈS LA RÉDUCTION REFUSÉE (F1 = TC-4). */
  {
    const { base, file, etat } = monter39();
    file.ligne(GROS39); await repos39(file);
    file.devis({ remiseCentiemes: null }); await repos39(file);
    const refuse = { etat: file.etatDe('devis'), signaux: etat.signaux, plafond: D.estUnRefusDuPlafond(file.erreurDe('devis')) };
    const n0 = etat.ops.length; const s0 = etat.signaux; const e0 = etat.evenements.length;
    file.devis({ objet: 'Nouvel objet' }); await repos39(file);
    file.devis({ validiteJours: 60 }); await repos39(file);
    const b = await enBase39(base);
    const partis = etat.ops.slice(n0);
    const conf = file.entreesVoulues().find((x) => x.cle === 'devis');
    verifier('après la réduction refusée par le plafond, l’OBJET puis la VALIDITÉ partent SEULS — deux écritures, sans la réduction — et '
      + 'sont EN BASE ; la réduction refusée reste tenue (la base garde 50 %), l’en-tête reste « en échec » sur ce refus-là, re-posé '
      + 'SANS signal neuf (aucune vibration, aucune annonce : l’objet, lui, est enregistré)',
    refuse.etat === 'echec' && refuse.plafond && refuse.signaux === 1
      && json(partis) === json(['modifier devis {"objet":"Nouvel objet"}', 'modifier devis {"validiteJours":60}'])
      && b.objet === 'Nouvel objet' && b.validiteJours === 60 && b.remiseCentiemes === 5000
      && file.etatDe('devis') === 'echec' && D.estUnRefusDuPlafond(file.erreurDe('devis')) && D.estUnRefusDuPlafond(file.retenueDe('devis'))
      && etat.signaux - s0 === 0 && etat.evenements.slice(e0).filter((x) => x === 'devis:echec:retenu').length === 2
      && Array.isArray(conf.tenue) && conf.tenue.includes('remiseCentiemes') && conf.tenue.every((c) => D.PAIRES_DEVIS[0].includes(c)),
    `${json(refuse)} ; partis ${json(partis)} ; base ${json({ objet: b.objet, validite: b.validiteJours, remise: b.remiseCentiemes })} ; `
      + `événements ${json(etat.evenements.slice(e0))}`);
    verifier('…« Mes devis » reçoit ce que la BASE a (`devisPourMesDevis` sur la version confirmée) : le nouvel objet, une fois enregistré, '
      + 'et la réduction de la base — jamais celle que l’écran montre',
    D.devisPourMesDevis({ confirme: conf.confirme, local: { objet: 'Nouvel objet', remiseCentiemes: null } }).objet === 'Nouvel objet'
      && D.devisPourMesDevis({ confirme: conf.confirme, local: { remiseCentiemes: null } }).remiseCentiemes === 5000);
    /* « Remettez-la » : rien ne part, la bande s'en va. */
    const n1 = etat.n;
    file.devis({ remiseCentiemes: 5000 }); await repos39(file);
    verifier('…remettre la réduction comme en base n’envoie RIEN (0 écriture) et l’en-tête redevient « enregistrée » : plus rien n’est tenu',
      etat.n === n1 && file.etatDe('devis') === 'enregistree' && file.retenueDe('devis') === null, `${etat.n - n1} écriture(s), ${file.etatDe('devis')}`);
  }
  {
    /* UNE AUTRE VALEUR, TAPÉE APRÈS LE REFUS, PART TOUT DE SUITE (banc final
       du lot 2a, N19). Ce qui est tenu à part cesse de l'être quand l'artisan
       demande AUTRE CHOSE (point 17 de file-ecriture.js). Que la file ne le
       libère plus que « remis comme en base », et la réduction de 20 %
       tapée après le refus du retrait restait en attente, sans un mot, jusqu'au
       prochain changement des totaux : seul le linter le voyait, par hasard
       (une variable devenue inutile) ; écrite autrement, plus rien. */
    const { base, file, etat } = monter39();
    file.ligne(GROS39); await repos39(file);
    file.devis({ remiseCentiemes: null }); await repos39(file);
    const refuse = file.etatDe('devis') === 'echec' && D.estUnRefusDuPlafond(file.retenueDe('devis'));
    const n0 = etat.ops.length; const s0 = etat.signaux;
    file.devis({ remiseCentiemes: 2000 }); await repos39(file);
    const partis = etat.ops.slice(n0);
    const b = await enBase39(base);
    verifier('…une AUTRE réduction tapée après le refus (20 %, qui tient) part TOUT DE SUITE — une écriture, en base — et l’en-tête '
      + 'redevient « enregistrée » : ce qui était tenu ne l’est plus, et rien ne vibre',
    refuse && partis.length === 1 && /"remiseCentiemes":2000/.test(partis[0]) && b.remiseCentiemes === 2000
      && file.etatDe('devis') === 'enregistree' && file.retenueDe('devis') === null && etat.signaux === s0,
    `${json(partis)} ; base ${b.remiseCentiemes} ; ${file.etatDe('devis')}`);
  }
  {
    /* Dans la MÊME écriture que la réduction (elles attendaient ensemble) :
       l'objet repart SEUL aussitôt après le refus. */
    let retenir = true;
    const fileEnVol = [];
    const { base, file, etat } = monter39((op, normal) => {
      if (retenir && op.quoi === 'devis' && op.action === 'modifier') return new Promise((ok, ko) => { fileEnVol.push(() => normal().then(ok, ko)); });
      return normal();
    });
    retenir = false;
    file.ligne(GROS39); await repos39(file);
    retenir = true;
    file.devis({ objet: 'Pendant' });
    await new Promise((ok) => { setTimeout(ok, 30); });
    file.devis({ remiseCentiemes: null, objet: 'Ensemble' });
    retenir = false;
    fileEnVol.splice(0).forEach((f) => f());
    await repos39(file);
    const b = await enBase39(base);
    verifier('…la réduction et l’objet partis dans la MÊME écriture, refusés ensemble : l’objet repart SEUL aussitôt, et il est en base ; '
      + 'la réduction reste refusée — UN signal, celui du geste',
    b.objet === 'Ensemble' && b.remiseCentiemes === 5000 && file.etatDe('devis') === 'echec' && etat.signaux === 1
      && etat.ops.includes('modifier devis {"objet":"Ensemble"}'), `${json(etat.ops)} ; signaux ${etat.signaux}`);
  }
  {
    /* « Réessayer » d'une coupure ne renvoie pas le refus tenu ; le renvoi
       du plafond (`retenues: true`), si. */
    let couper = false;
    const { base, file, etat } = monter39((op, normal) => {
      if (couper && op.quoi === 'devis') return Promise.reject(new Error('Network request failed'));
      return normal();
    });
    file.ligne(GROS39); await repos39(file);
    file.devis({ remiseCentiemes: null }); await repos39(file);
    couper = true;
    file.devis({ objet: 'Coupé' }); await repos39(file);
    couper = false;
    /* CE QUE LA FILE DIT DE LA BASE pendant la coupure (banc final du lot
       2a, N21) : l'objet parti sans réponse n'a PAS de valeur connue — il
       est nommé dans `inconnues`, ABSENT de `confirme`, et « Mes devis » ne
       reçoit pas d'objet. `confirme` exposé tel quel (symbole compris)
       passait au vert : le symbole serait allé jusqu'à l'écran de la liste,
       où un `<Text>` ne sait pas l'écrire. */
    const pendant = file.entreesVoulues().find((x) => x.cle === 'devis');
    const valeursPendant = pendant && pendant.confirme ? Object.values(pendant.confirme) : [];
    verifier('…pendant la coupure, la file dit ce qu’elle ne sait pas : l’objet est dans `inconnues`, absent de `confirme` (aucun symbole '
      + 'n’en sort), et « Mes devis » (`devisPourMesDevis`) ne reçoit pas d’objet',
    !!pendant && Array.isArray(pendant.inconnues) && pendant.inconnues.includes('objet') && !!pendant.confirme
      && !Object.prototype.hasOwnProperty.call(pendant.confirme, 'objet') && valeursPendant.every((v) => typeof v !== 'symbol')
      && !Object.prototype.hasOwnProperty.call(D.devisPourMesDevis({ confirme: pendant.confirme, local: { objet: 'Coupé' } }), 'objet'),
    json({ inconnues: pendant && pendant.inconnues, confirme: pendant && pendant.confirme && Object.keys(pendant.confirme) }));
    const phrase = D.phraseEchecDuDevis({ enBase: true, erreur: file.erreurDe('devis'), retenue: file.retenueDe('devis') });
    const n0 = etat.ops.length;
    file.reessayer('devis'); await repos39(file);
    const partis = etat.ops.slice(n0);
    const n1 = etat.ops.length;
    file.reessayer('devis', { retenues: true }); await repos39(file);
    const partis2 = etat.ops.slice(n1);
    verifier('…une COUPURE sur l’objet : la phrase nomme les deux — l’en-tête, et la réduction toujours refusée (`retenue`) ; « Réessayer » '
      + '(sans `retenues`) ne renvoie QUE l’objet ; le renvoi du plafond (`retenues: true`) renvoie la réduction, refusée pareil, sans boucle',
    /* 2b-3 (annexe A.6, E2) : la phrase par défaut nomme aussi « À quel
       titre ? » et « Le chantier ». */
    phrase === 'L’en-tête du devis n’a pas pu être enregistré : l’objet, le lieu, le délai, « À quel titre ? », « Le chantier » ou les '
      + 'conditions. La réduction n’a pas pu être changée.'
      && json(partis) === json(['modifier devis {"objet":"Coupé"}']) && (await enBase39(base)).objet === 'Coupé'
      && partis2.length === 1 && /"remiseCentiemes":null/.test(partis2[0]) && file.etatDe('devis') === 'echec',
    `${phrase} | ${json(partis)} | ${json(partis2)}`);
  }

  /* b. LA PHRASE DU RENVOI QUI PASSE (F3) : la réduction RETIRÉE ne se dit
        pas « enregistrée » ; BAISSÉE (50 % → 5 %, refusée, puis la ligne
        baissée), elle l'est. */
  {
    const { base, file, etat } = monter39();
    file.ligne(GROS39); await repos39(file);
    file.devis({ remiseCentiemes: null }); await repos39(file);
    file.ligne({ ...GROS39, prixUnitaireCentimes: 100000 }); await repos39(file);
    const retiree = { annonces: [...etat.annonces], remise: (await enBase39(base)).remiseCentiemes };
    const m = monter39();
    m.file.ligne(GROS39); await repos39(m.file);
    m.file.devis({ remiseCentiemes: 500 }); await repos39(m.file);
    const refusee = m.file.etatDe('devis');
    m.file.ligne({ ...GROS39, prixUnitaireCentimes: 100000 }); await repos39(m.file);
    const baissee = { annonces: [...m.etat.annonces], remise: (await enBase39(m.base)).remiseCentiemes };
    verifier('VoiceOver entend ce qui est PARTI : la réduction retirée → « La réduction est maintenant retirée du devis. » ; baissée à 5 % → '
      + '« La réduction est maintenant enregistrée. » ; et `phraseDuRejeu` garde la phrase d’une ligne et d’une option',
    json(retiree) === json({ annonces: ['La réduction est maintenant retirée du devis.'], remise: null })
      && refusee === 'echec' && json(baissee) === json({ annonces: ['La réduction est maintenant enregistrée.'], remise: 500 })
      && D.phraseDuRejeu('entete', { remiseCentimes: 2000, remiseCentiemes: null }) === 'La réduction est maintenant enregistrée.'
      && D.phraseDuRejeu('ligne') === 'Une ligne refusée tout à l’heure est maintenant enregistrée.'
      && D.phraseDuRejeu('option') === 'Une option refusée tout à l’heure est maintenant enregistrée.'
      && D.phraseDuRejeu('enteteSansReduction') === null && D.phraseDuRejeu('inconnu') === null,
    `${json(retiree)} | ${refusee} | ${json(baissee)}`);
  }

  /* c. UN RENVOI AUTOMATIQUE REFUSÉ SE TAIT (F2) : une base qui refuse
        l'en-tête quoi que dise le calcul — le renvoi part une fois, il est
        refusé, et rien ne vibre. */
  {
    let tetue = false;
    const { file, etat } = monter39((op, normal) => {
      if (tetue && op.quoi === 'devis') {
        return Promise.reject(Object.assign(new Error('new row for relation "devis" violates check constraint "devis_plafond_check"'), { code: '23514' }));
      }
      return normal();
    });
    file.ligne(GROS39); await repos39(file);
    tetue = true;
    file.devis({ remiseCentiemes: null }); await repos39(file);
    const s0 = etat.signaux; const n0 = etat.n;
    file.ligne({ ...GROS39, prixUnitaireCentimes: 100000 }); await repos39(file);
    verifier('un renvoi AUTOMATIQUE du plafond, refusé encore : UNE écriture de plus que la ligne, et AUCUN signal (ni vibration, ni '
      + 'annonce : l’artisan n’a rien fait, la bande suffit) ; `echecASignaler` ne signale qu’un échec de GESTE',
    etat.n - n0 === 2 && etat.signaux === s0 && file.etatDe('devis') === 'echec'
      && D.echecASignaler({ etat: 'echec' }) && !D.echecASignaler({ etat: 'echec', automatique: true })
      && !D.echecASignaler({ etat: 'echec', retenu: true }) && !D.echecASignaler({ etat: 'enregistree' }) && !D.echecASignaler({ etat: 'en_cours' }),
    `écritures ${etat.n - n0}, signaux ${etat.signaux - s0}`);
  }

  /* c bis. UN GESTE PENDANT LE RENVOI AUTOMATIQUE (contre-vérification
     finale du lot 2a, N1) : le plafond renvoie L12 tout seul ; PENDANT cet
     envoi, l'artisan la remonte à un prix refusé. L'échec est celui de SON
     geste — il se signale (vibration, annonce). Avant, la clé était encore
     « renvoyée tout seul » et l'échec se taisait (reproduit par la vraie
     file). Et `gestesDe` ne compte que les gestes : le renvoi automatique
     n'en est pas un. */
  {
    const IDN = (k) => `de0000ee-0000-4000-8000-0000000098${String(k).padStart(2, '0')}`;
    const LN = (k, prix) => ({ id: IDN(k), ordre: 1000 * k, type: 'poste', designation: `L${k}`, quantiteMilliemes: 1000, unite: 'forfait',
      prixUnitaireCentimes: prix, tauxTvaCentiemes: 2000 });
    const baseN = DEMO.creerBaseDevisDemo({ demandeDe: () => null });
    const renvoisN = D.creerRenvoisAutomatiques();
    const etatN = { signaux: [], annonces: 0, envoisL12: 0, arme: false, fait: false };
    let fileN = null;
    fileN = F.creerFileEcriture({
      devisId: IDN(1), devis: { objet: 'X', source: 'manuelle' }, devisEnBase: false,
      ecrire: (op) => {
        if (op.quoi === 'ligne' && op.id === IDN(12)) {
          etatN.envoisL12 += 1;
          if (etatN.arme && !etatN.fait) { etatN.fait = true; fileN.ligne(LN(12, 99999999900)); }
        }
        return baseN.ecrire('1', op);
      },
      relireUn: (q) => baseN.relireUn('1', q), relireTotaux: (id) => baseN.relireTotaux('1', id),
      avecDelai: ERR.avecDelai, nouvelIdentifiant: I.nouvelIdentifiant, paires: D.PAIRES_DEVIS, aPart: D.colonnesDuRefus,
    });
    fileN.abonner((ev) => {
      if (ev.type === 'totaux') Promise.resolve().then(() => renvoisN.rejouer(fileN));
      if (ev.type !== 'etat') return;
      const automatique = renvoisN.issue(fileN, ev);
      if (automatique && ev.etat === 'enregistree') etatN.annonces += 1;
      if (D.echecASignaler({ etat: ev.etat, automatique, retenu: ev.retenu === true })) etatN.signaux.push(ev.cle);
    });
    fileN.ligne(LN(11, 5000000000)); await repos39(fileN);
    fileN.ligne(LN(12, 4000000000)); await repos39(fileN);
    const refusee = { etat: fileN.etatDe(IDN(12)), signaux: etatN.signaux.length, gestes: fileN.gestesDe(IDN(12)) };
    const s0 = etatN.signaux.length; const e0 = etatN.envoisL12;
    etatN.arme = true;
    fileN.ligne(LN(11, 100000)); await repos39(fileN);
    const apres = {
      geste: etatN.fait, envois: etatN.envoisL12 - e0, etat: fileN.etatDe(IDN(12)), code: (fileN.erreurDe(IDN(12)) || {}).code,
      signaux: etatN.signaux.slice(s0), gestes: fileN.gestesDe(IDN(12)), annonces: etatN.annonces,
    };
    verifier('un GESTE pendant le renvoi automatique du plafond (N1) : L12 renvoyée toute seule, remontée PENDANT l’envoi à un prix '
      + 'refusé → l’échec est celui du geste, et il se SIGNALE (un signal sur L12) ; aucun « enfin enregistrée » annoncé ; `gestesDe` compte '
      + '2 gestes (la saisie et la remontée), jamais le renvoi automatique',
    refusee.etat === 'echec' && refusee.signaux === 1 && refusee.gestes === 1
      && apres.geste === true && apres.envois === 2 && apres.etat === 'echec' && apres.code === '23514'
      && json(apres.signaux) === json([IDN(12)]) && apres.gestes === 2 && apres.annonces === 0,
    `${json(refusee)} → ${json(apres)}`);
    /* La règle de l'issue, sur une file factice : un renvoi qui finit SANS
       geste depuis est automatique ; avec un geste, non ; une clé jamais
       renvoyée, non ; « en cours » ne la consomme pas. */
    let g = 0;
    const fausse = {
      entreesVoulues: () => [{ cle: 'L', etat: 'echec' }],
      erreurDe: () => Object.assign(new Error('x "devis_plafond_check"'), { code: '23514' }),
      reessayer: () => {}, etatDe: () => 'en_cours', gestesDe: () => g,
    };
    const r1 = D.creerRenvoisAutomatiques();
    const partis1 = r1.rejouer(fausse);
    const sansGeste = r1.issue(fausse, { cle: 'L', etat: 'en_cours' }) === false && r1.issue(fausse, { cle: 'L', etat: 'echec' }) === true
      && r1.issue(fausse, { cle: 'L', etat: 'echec' }) === false;
    const r2 = D.creerRenvoisAutomatiques();
    r2.rejouer(fausse); g += 1;
    const avecGeste = r2.issue(fausse, { cle: 'L', etat: 'echec' }) === false;
    verifier('…`creerRenvoisAutomatiques` : l’issue d’un renvoi sans geste depuis est automatique (une fois) ; après un geste, elle ne '
      + 'l’est plus ; « en cours » ne la consomme pas ; et une file sait compter : `reessayer(…, { automatique: true })` n’est pas un geste, '
      + '`reessayer(…)` en est un',
    json(partis1) === json(['L']) && sansGeste && avecGeste
      && /cles\.forEach\(\(c\) => file\.reessayer\(c, \{ retenues: true, automatique: true \}\)\);/
        .test(sansCommentairesJs(corpsDeFonction(lire('src/lib/devis.js'), 'rejouerLesRefusDuPlafond') || ''))
      && /if \(automatique !== true\) unGeste\(e\);/.test(sansCommentairesJs(lire('src/lib/file-ecriture.js'))),
    `partis ${json(partis1)} ; sans geste ${sansGeste} ; avec geste ${avecGeste}`);
  }

  /* d. CE QUE L'ÉCRAN EN FAIT — lu dans la saisie, sans ses commentaires. */
  const S39 = ECR.saisie;
  const ecouter39 = corpsFleche(S39, 'const ecouter = (ev) =>');
  const brancheEtat39 = (ecouter39.match(/if \(ev\.type === 'etat'\) \{[\s\S]*?\n {6}\} else if \(ev\.type === 'totaux'\)/) || [])[0] || '';
  const vibrations = [...brancheEtat39.matchAll(/retour\.echec\(\)/g)].length;
  verifier('l’écoute : `automatique` vient de `renvois.issue(fileRef.current, ev)` (le renvoi qui finit, sans geste depuis : N1) ; la '
    + 'phrase du renvoi qui passe est `phraseDuRejeu(chemin, devisRef.current)` ; la SEULE vibration est sous `echecASignaler({ etat, '
    + 'automatique, retenu })`',
  /const automatique = renvois\.issue\(fileRef\.current, ev\);/.test(brancheEtat39)
    && (brancheEtat39.match(/renvois\.issue\(/g) || []).length === 1
    && /if \(automatique && ev\.etat === 'enregistree'\) retour\.annoncer\(phraseDuRejeu\(chemin, devisRef\.current\)\);/.test(brancheEtat39)
    && vibrations === 1 && /if \(echecASignaler\(\{ etat: ev\.etat, automatique, retenu: ev\.retenu === true \}\)\) \{\s*retour\.echec\(\);/.test(brancheEtat39)
    && !/PHRASES_DU_REJEU/.test(S39), brancheEtat39.slice(0, 200));
  const ranger39 = corpsFleche(S39, 'const ranger = (t = null) =>');
  verifier('« Mes devis » reçoit ce que la base a : `ranger` passe par `devisPourMesDevis` sur la version CONFIRMÉE de la file — plus aucun '
    + 'champ de l’en-tête copié de l’écran',
  /const enBase = f\.entreesVoulues\(\)\.find\(\(x\) => x\.cle === 'devis'\);/.test(ranger39)
    && /\.\.\.devisPourMesDevis\(\{ confirme: enBase \? enBase\.confirme : null, local: d, client: clientAffiche \}\),/.test(ranger39)
    && !/choisirChamps\(/.test(ranger39) && !/CHAMPS_DEVIS/.test(ranger39), ranger39.slice(0, 200));
  verifier('la bande de l’en-tête et la carte « Conditions » nomment aussi ce qui reste TENU à part (`retenue: attente.devisRetenue`), et '
    + '`majAttente` le lit dans la file (`retenueDe`)',
  (S39.match(/phraseEchecDuDevis\(\{ enBase: attente\.devisEnBase, erreur: attente\.devisErreur, retenue: attente\.devisRetenue \}\)/g) || []).length === 2
    && /devisRetenue: f\.etatDe\('devis'\) === 'echec' \? f\.retenueDe\('devis'\) : null,/.test(S39));
  /* LA DEVIS-DEMO de `devisPourMesDevis` : une colonne inconnue manque ; le client n'est nommé que s'il est le client confirmé. */
  const pm = D.devisPourMesDevis({ confirme: { objet: 'Base', clientId: 'c1' }, local: { objet: 'Écran', clientId: 'c2' }, client: { nom: 'Mme Écran' } });
  const pm2 = D.devisPourMesDevis({ confirme: { objet: 'Base', clientId: 'c1' }, local: { objet: 'Écran', clientId: 'c1' }, client: { nom: 'Mme Base' } });
  verifier('`devisPourMesDevis`, FAIT TOURNER : l’objet de la base, jamais celui de l’écran ; un client changé à l’écran mais pas en base '
    + 'n’est pas nommé (la liste garde le sien) ; le client confirmé, si ; une colonne partie sans réponse (absente de `confirme`) n’est pas '
    + 'envoyée',
  pm.objet === 'Base' && !('client' in pm) && json(pm2.client) === json({ nom: 'Mme Base' })
    && !('objet' in D.devisPourMesDevis({ confirme: { clientId: null }, local: { objet: 'x' } })), `${json(pm)} | ${json(pm2)}`);
  /* …et quand la file ne sait RIEN de la base (`confirme: null`, ce que rend
     `entreesVoulues()` tant que rien n'est confirmé) : rien de l'écran ne part
     vers la liste (banc final du lot 2a, N66 — `confirme || local` passait au
     vert : aucun cas ne donnait `null` avec un objet à l'écran). */
  const pmRien = D.devisPourMesDevis({ confirme: null, local: { objet: 'Écran', clientId: 'c2', client: { nom: 'Mme Écran' } }, client: { nom: 'Mme Écran' } });
  const pmRien2 = D.devisPourMesDevis({ local: { objet: 'Écran' } });
  verifier('`devisPourMesDevis`, FAIT TOURNER : quand la file ne sait rien de la base (`confirme` absent ou `null`), « Mes devis » ne reçoit '
    + 'RIEN de l’écran — ni objet, ni client',
  json(pmRien) === '{}' && json(pmRien2) === '{}', `${json(pmRien)} | ${json(pmRien2)}`);
  /* LA PHRASE D'UN ÉCHEC ne dit pas deux fois la même chose (banc final du
     lot 2a, N67 — `q ? …` au lieu de `q && q !== p ? …` passait au vert) :
     le renvoi du plafond refusé PAREIL rend une erreur et une retenue
     DISTINCTES, de la même contrainte ; deux contraintes de la réduction
     disent aussi la même phrase. Une retenue de phrase différente, elle, est
     dite. */
  const refusPla1 = { code: '23514', message: 'x "devis_plafond_check"' };
  const refusPla2 = { code: '23514', message: 'y "devis_plafond_check"' };
  const phrasesDouble = [
    D.phraseEchecDuDevis({ enBase: true, erreur: refusPla2, retenue: refusPla1 }),
    D.phraseEchecDuDevis({ enBase: true, erreur: { message: 'x "devis_remise_check"' }, retenue: { message: 'y "devis_remise_une_forme_check"' } }),
    D.phraseEchecDuDevis({ enBase: true, erreur: { message: 'réseau' }, retenue: refusPla1 }),
  ];
  verifier('`phraseEchecDuDevis`, FAIT TOURNER : une retenue DISTINCTE de l’erreur mais de même phrase (le plafond refusé deux fois ; deux '
    + 'contraintes de la réduction) n’est pas écrite deux fois ; une retenue de phrase différente (une coupure, puis le plafond), si',
  phrasesDouble[0] === 'La réduction n’a pas pu être changée.'
    && phrasesDouble[1] === 'La réduction n’a pas pu être enregistrée.'
    && phrasesDouble[2] === 'L’en-tête du devis n’a pas pu être enregistré : l’objet, le lieu, le délai, « À quel titre ? », '
      + '« Le chantier » ou les conditions. La réduction n’a pas pu être changée.',
  json(phrasesDouble));

  /* e. L'OPTION REFUSÉE (F4) : sa gélule garde son remplissage — seule sa
        MARGE tombe dans le bloc des options —, et VoiceOver dit « Option ».
        (Le remplissage MESURÉ au navigateur : `mesure-devis`.) */
  const styleDe39 = (nom) => (new RegExp(String.raw`\n\s{2}${nom}:\s*\{([^}]*)\}`).exec(S39) || [])[1] || '';
  const etatRangee39 = corpsDeFonction(S39, 'EtatDeLaRangee') || '';
  verifier('l’option refusée : le bouton garde son remplissage (`etatBoutonAligne` ne retire que la MARGE ; `etatBoiteAligne` le '
    + 'remplissage de la BOÎTE) ; ses trois étiquettes disent « Option … » (`option`, passé par le bloc des options), la ligne « Ligne … »',
  sansEspaces(styleDe39('etatBoutonAligne')) === 'marginHorizontal: 0' && sansEspaces(styleDe39('etatBoiteAligne')) === 'paddingHorizontal: 0'
    && !/etatAligne\b/.test(S39) && /\[s\.etatBouton, aligne && s\.etatBoutonAligne, pressed && APPUI\.plein\]/.test(etatRangee39)
    && /const quoi = option \? 'Option' : 'Ligne';/.test(etatRangee39)
    && (etatRangee39.match(/accessibilityLabel=\{`\$\{quoi\} (?:non enregistrée\. La corriger|non enregistrée\. Réessayer|incomplète\. La compléter)`\}/g) || []).length === 3
    && !/accessibilityLabel="Ligne /.test(etatRangee39)
    && /aligne\s+option\s*\/>/.test(balises(corpsDeFonction(S39, 'BasDuDevis') || '', 'EtatDeLaRangee')[0] || '')
    && !/option/.test(balises((S39.match(/const RangeeLigne = React\.memo\(function RangeeLigne\([\s\S]*?\n\}\);/) || [])[0] || '', 'EtatDeLaRangee')[0] || ''));

  /* f. AUCUNE FILE DE CETTE SECTION N'A BOUCLÉ (N73) : le relevé du faux
        serveur, une fois tous les cas joués. */
  verifier('aucune file de cette section n’a renvoyé en boucle : chaque cas reste sous '
    + `${PLAFOND39} écritures (un renvoi refusé pareil ne repart pas sans fin)`,
  emballements39 === 0 && ecrituresMax39 > 0 && ecrituresMax39 <= PLAFOND39,
  `${emballements39} emballement(s) ; au plus ${ecrituresMax39} écriture(s) dans un cas`);
}

console.log('\n  40. le lot 2b-1 — ce qu’il manque pour remettre ce devis : la fonction, ses phrases, ses cas, l’essai et l’écran');
{
  /* POURQUOI (cahier du lot 2b, §3.6 et annexe B, « le contrat », figé le
     05/11/2026 avant la construction). `motifs_refus_remise(p_devis)`
     (section 49.9) est la SEULE autorité de ce qui manque pour remettre un
     devis : la remise (lot 2c) refusera tant qu'elle rend une ligne. Elle a
     un MIROIR en JavaScript (`motifsDeRemise`, devis.js) pour faire vivre la
     démonstration ; deux écritures de la même règle ne valent que si un
     contrôle tient les deux. Ce qui suit les tient ainsi :
       a. la FORME ENTIÈRE de la fonction, commentaires retirés et blancs
          réduits — signature, attributs, corps : changer une règle (un rang,
          une nature, une phrase, une condition) SE DÉCIDE — la base, l'essai
          (`essais-section-49-remise.sql`), `cas-remise.json`, le miroir et
          cette forme, dans le même lot. C'est aussi elle qui restreint sa
          lecture de l'émetteur au RÉGIME (critique B4) ;
       b. ses neuf phrases, rangs et natures comparés OCTET POUR OCTET à
          `MOTIFS_DEVIS`, et à la table du contrat écrite ici ;
       c. `supabase/cas-remise.json` — ce que la VRAIE fonction a rendu sur un
          PostgreSQL local, situation par situation — joué par le miroir :
          ZÉRO écart exigé, et le fichier absent est un échec ;
       d. l'essai SQL, ce qu'il doit contenir (le jouer est l'affaire de
          PostgreSQL, à la main : `npm run verifier` n'en joue aucun) ;
       e. l'API et la démonstration ;
       f. l'écran : les quatre états, jamais « rien ne manque » sur un échec
          ni sur un brouillon pas encore en base, la phrase « Pas encore
          vérifié », les relectures, un bouton par point de l'entreprise, le
          retour à la liste depuis « Conditions », les avis jamais comptés.
     Ses fonctions pures de l'écran (`etatDeLaListe`, `texteDeLaLigneRemise`,
     `ceQueDitLaCarte`, `ceQueLaListeNeComptePas`, `actionDuPoint`…) vivent
     dans `devis.js` depuis la vérification de construction (écart 9) : ce
     contrôle les IMPORTE et les fait tourner. Elles vivaient dans
     `PourRemettre.js`, qui charge React Native, et ce contrôle les
     EXTRAYAIT par leur texte (`new Function`) — un contrôle qui lit un
     morceau de fichier perd sa cible au premier déménagement. Il refuse
     désormais qu'elles y reviennent (la leçon de `cloudinary-adresses.js`). */
  const egal = (a, b) => json(a) === json(b);
  const net = (t) => String(t == null ? '' : t).replace(/[\u00a0\u202f]/g, ' ');
  const ecart40 = (vu, attendu) => {
    let i = 0;
    while (i < vu.length && i < attendu.length && vu[i] === attendu[i]) i += 1;
    return `diffère au caractère ${i} : reçu « …${vu.slice(Math.max(0, i - 40), i + 80)}… », attendu « …${attendu.slice(Math.max(0, i - 40), i + 80)}… »`;
  };

  /* ---------------- a. LA FORME ENTIÈRE ---------------- */
  /* 2b-2 (cahier 2b-2, §2.5) : la MÊME signature, et dans le corps — la
     réponse « à quel titre » lue avec le devis, et VALABLE seulement si son
     témoin est le client du devis (`v_valable`) ; `devis_pour_qui` au rang 1,
     exclusif avec `devis_client` ; une troisième clé de rang 3,
     `devis_taux_reduit_neuf` (prudence), par deux tableaux ALIGNÉS (mêmes
     `filter` et `order by l.ordre, l.id`) ; le filtre des `conso_` pour une
     réponse « professionnel » (sauf les deux adresses), appliqué APRÈS le
     calcul du rang ; et les natures : un `conso_` est une prudence quand la
     réponse est « non_professionnel » ou « professionnel ». */
  /* 2b-3 (cahier 2b-3, §2.5 et annexe A.1, 12/11/2026) : la MÊME signature ;
     dans le corps — les deux réponses de 49.4 quater lues avec le devis ;
     « tout urgent » (`bool_and(l.urgence)` sur les postes et les options) lu
     avec les lignes, dans le MÊME select ; le jour de PARIS
     (`(now() at time zone 'Europe/Paris')::date`, jamais `current_date`) ;
     la décennale de L'ENTREPRISE DU DEVIS, lue dans `emetteur_assurances`
     seulement si la réponse n'est pas « Non » (colonnes nommées, filtrée par
     `a.pro_id = v_pro` — sous un `security definer` de 2c, ce filtre sera la
     SEULE barrière) ; le rang 10 (`devis_acompte_signature`, prudence) par la
     règle `signaturePermise` écrite en SQL, et le rang 11 (au plus UNE clé :
     `devis_decennale` prudence, `devis_attestation_date` prudence,
     `devis_attestation` loi). Écarts VOULUS à l'esquisse du cahier :
     `v_att_valable is not true` et `elsif v_dec_sans_date is true` — jamais
     `not x` sur une valeur qui peut manquer (la leçon du lot 0a). */
  const FORME_MOTIFS_REFUS_REMISE =String.raw`p_devis uuid) returns table (rang smallint, cle text, phrase text, nature text, ligne_id uuid) language plpgsql stable security invoker set search_path = public $$ declare v_pro uuid; v_client uuid; v_adresse text; v_code_postal text; v_ville text; v_delai text; v_validite integer; v_acompte_pct integer; v_acompte_eur bigint; v_acompte_nat text; v_acompte_eff bigint; v_remise_eur bigint; v_remise_eff bigint; v_pour_qui text; v_pour_qui_cl uuid; v_neuf_tva boolean; v_neuf_conso boolean; v_decennale boolean; v_signature boolean; v_valable text; v_regime text; v_un_poste boolean; v_tout_urgent boolean; v_fautives uuid[]; v_cles_lignes text[]; v_jour date := (now() at time zone 'Europe/Paris')::date; v_dec_sans_date boolean := false; v_att_valable boolean := false; v_i integer; v_ligne uuid; v_motif text; v_position bigint; begin select d.pro_id, d.client_id, d.lieu_adresse, d.lieu_code_postal, d.lieu_ville, d.delai_execution, d.validite_jours, d.acompte_centiemes, d.acompte_centimes, d.acompte_nature, d.acompte_ttc_centimes, d.remise_centimes, d.remise_ht_centimes, d.pour_qui, d.pour_qui_client, d.chantier_neuf_tva, d.chantier_neuf_conso, d.engage_decennale, d.acompte_a_la_signature into v_pro, v_client, v_adresse, v_code_postal, v_ville, v_delai, v_validite, v_acompte_pct, v_acompte_eur, v_acompte_nat, v_acompte_eff, v_remise_eur, v_remise_eff, v_pour_qui, v_pour_qui_cl, v_neuf_tva, v_neuf_conso, v_decennale, v_signature from public.devis d where d.id = p_devis and public.est_mon_entreprise(d.pro_id); if not found then raise exception 'Ce devis n’existe pas, ou il n’est pas le vôtre.' using errcode = 'OP027'; end if; v_valable := case when v_client is not null and v_pour_qui_cl = v_client then v_pour_qui end; select e.regime_tva into v_regime from public.emetteur e where e.pro_id = v_pro; select coalesce(bool_or(l.type = 'poste'), false), coalesce(bool_and(l.urgence) filter (where l.type in ('poste', 'option')), false), coalesce(array_agg(l.id order by l.ordre, l.id) filter (where l.type in ('poste', 'option') and ((v_regime = 'franchise' and l.taux_tva_centiemes <> 0) or (v_regime = 'reel' and l.taux_tva_centiemes = 0) or (v_regime = 'reel' and v_neuf_tva is true and l.taux_tva_centiemes in (550, 1000)))), '{}'), coalesce(array_agg(case when v_regime = 'franchise' then 'devis_taux_franchise' when l.taux_tva_centiemes = 0 then 'devis_taux_sans_tva' else 'devis_taux_reduit_neuf' end order by l.ordre, l.id) filter (where l.type in ('poste', 'option') and ((v_regime = 'franchise' and l.taux_tva_centiemes <> 0) or (v_regime = 'reel' and l.taux_tva_centiemes = 0) or (v_regime = 'reel' and v_neuf_tva is true and l.taux_tva_centiemes in (550, 1000)))), '{}') into v_un_poste, v_tout_urgent, v_fautives, v_cles_lignes from public.devis_lignes l where l.devis_id = p_devis; if v_decennale is not false then select coalesce(bool_or(a.valide_jusquau is null), false), coalesce(bool_or(a.valide_jusquau >= v_jour), false) into v_dec_sans_date, v_att_valable from public.emetteur_assurances a where a.pro_id = v_pro and a.nature = 'decennale' and a.attestation_chemin is not null; end if; ligne_id := null; if v_client is null then rang := 1; cle := 'devis_client'; nature := 'regle_opus'; phrase := 'Ce devis ne s’adresse encore à personne : choisissez le client. La loi demande son nom pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus le demande pour tous vos devis.'; return next; elsif v_valable is null then rang := 1; cle := 'devis_pour_qui'; nature := 'regle_opus'; phrase := 'Dites à quel titre ce client commande : selon la réponse, la loi ne demande pas les mêmes mentions sur le devis. Opus le demande pour tous vos devis.'; return next; end if; if not v_un_poste then rang := 2; cle := 'devis_lignes'; nature := 'regle_opus'; phrase := 'Ce devis ne chiffre encore aucun travail : ajoutez au moins un poste. La loi demande de décrire les travaux et leur prix pour un devis à un particulier ; Opus le demande pour tous vos devis.'; return next; end if; for v_i in 1 .. coalesce(array_length(v_fautives, 1), 0) loop v_ligne := v_fautives[v_i]; if v_cles_lignes[v_i] = 'devis_taux_franchise' then rang := 3; cle := 'devis_taux_franchise'; nature := 'loi'; ligne_id := v_ligne; phrase := 'En franchise de TVA, aucune ligne ne porte de TVA : corrigez le taux de cette ligne.'; elsif v_cles_lignes[v_i] = 'devis_taux_sans_tva' then rang := 3; cle := 'devis_taux_sans_tva'; nature := 'prudence'; ligne_id := v_ligne; phrase := 'Au régime réel, une ligne sans TVA n’est possible que dans quelques cas, comme la sous-traitance en autoliquidation, qu’Opus ne sait pas encore imprimer : corrigez le taux de cette ligne.'; else rang := 3; cle := 'devis_taux_reduit_neuf'; nature := 'prudence'; ligne_id := v_ligne; phrase := 'Mettez cette ligne au taux normal, ou changez votre réponse dans « Le chantier » : vous avez répondu que ces travaux font partie d’un chantier qui crée un bâtiment neuf.'; end if; return next; end loop; ligne_id := null; if v_adresse is null and v_code_postal is null and v_ville is null then rang := 4; cle := 'devis_lieu'; nature := 'prudence'; phrase := 'Écrivez le lieu des travaux. La loi le demande pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un.'; return next; end if; if v_delai is null then rang := 5; cle := 'devis_delai'; nature := 'regle_opus'; phrase := 'Écrivez le délai d’exécution des travaux. La loi le demande pour la plupart des devis à un particulier ; Opus le demande pour tous vos devis.'; return next; end if; if v_validite is null then rang := 6; cle := 'devis_validite'; nature := 'prudence'; phrase := 'Choisissez la durée de validité du devis. La loi la demande pour un dépannage, une réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un.'; return next; end if; if (v_acompte_pct is not null or v_acompte_eur is not null) and v_acompte_nat is null then rang := 7; cle := 'devis_acompte_nature'; nature := 'prudence'; phrase := 'Dites si la somme demandée d’avance est un acompte ou des arrhes : leurs effets ne sont pas les mêmes, et Opus ne choisit pas à votre place.'; return next; end if; if v_acompte_eur is not null and v_acompte_eff < v_acompte_eur then rang := 8; cle := 'devis_acompte_ramene'; nature := 'prudence'; phrase := 'L’acompte en euros dépasse le total du devis : Opus l’a ramené. Corrigez-le pour que le devis dise ce que vous voulez.'; return next; end if; if v_remise_eur is not null and v_remise_eff < v_remise_eur then rang := 9; cle := 'devis_reduction_ramenee'; nature := 'prudence'; phrase := 'La réduction en euros dépasse le total des postes : Opus l’a ramenée. Corrigez-la pour que le devis dise ce que vous voulez.'; return next; end if; if v_signature is true and (v_acompte_pct is not null or v_acompte_eur is not null) and v_valable is distinct from 'professionnel' and v_neuf_conso is not true and (v_tout_urgent and v_valable in ('consommateur', 'non_professionnel')) is not true then rang := 10; cle := 'devis_acompte_signature'; nature := 'prudence'; phrase := 'Choisissez « Dès le 8e jour » pour l’acompte ou les arrhes : signé chez le client, ce devis pourrait n’autoriser aucun paiement avant, et Opus ne sait pas où il le sera.'; return next; end if; if v_decennale is not false and v_att_valable is not true then if v_decennale is null then rang := 11; cle := 'devis_decennale'; nature := 'prudence'; phrase := 'Joignez dans « Mon entreprise » votre attestation décennale et sa date de fin, ou répondez « Non » dans « Le chantier » si ces travaux ne peuvent pas engager votre décennale.'; return next; elsif v_dec_sans_date is true then rang := 11; cle := 'devis_attestation_date'; nature := 'prudence'; phrase := 'Écrivez dans « Mon entreprise » la date de fin de votre attestation décennale : sans elle, Opus ne sait pas si l’attestation jointe est encore valable.'; return next; else rang := 11; cle := 'devis_attestation'; nature := 'loi'; phrase := 'Joignez dans « Mon entreprise » votre attestation décennale et sa date de fin : la loi demande de la joindre à ce devis, puisque ses travaux peuvent engager cette garantie.'; return next; end if; end if; for v_motif, v_position in select u.m, u.o from unnest(public.emetteur_incomplet(v_pro)) with ordinality as u(m, o) order by u.o loop rang := 100 + v_position; cle := split_part(v_motif, ': ', 1); phrase := substr(v_motif, char_length(cle) + 3); continue when v_valable = 'professionnel' and left(cle, 6) = 'conso_' and cle not in ('conso_adresse_etablissement', 'conso_adresse_siege'); nature := case when cle in ('entreprise_ancienne', 'conso_tva_intra', 'frais_deplacement') then 'regle_opus' when v_valable in ('non_professionnel', 'professionnel') and left(cle, 6) = 'conso_' then 'prudence' when cle in ('conso_profession_reglementee', 'regime_tva') then 'prudence' else 'loi' end; ligne_id := null; return next; end loop; return; end; $$`;
  const defsMRR = FONCTIONS.filter((f) => f.nom === 'motifs_refus_remise');
  const vuMRR = defsMRR.length === 1 ? `${sansEspaces(defsMRR[0].attributs)} $$ ${sansEspaces(defsMRR[0].corps)} $$` : `(${defsMRR.length} définition(s) dans le fichier)`;
  verifier('a. `motifs_refus_remise` a EXACTEMENT la forme du contrat, relue et éprouvée par l’essai et `cas-remise.json` — une seule '
    + 'définition, signature, `returns table (rang, cle, phrase, nature, ligne_id)`, `plpgsql stable security invoker`, '
    + '`search_path` et corps compris', vuMRR === FORME_MOTIFS_REFUS_REMISE,
  vuMRR.startsWith('(') ? vuMRR : ecart40(vuMRR, FORME_MOTIFS_REFUS_REMISE));
  /* …dans la section 49, APRÈS `recalcule_devis` (cahier §3.3), et nulle
     part ailleurs ; et aucun `alter function` ne change après coup ce que la
     forme a relu. */
  const iDefMRR = SQL.search(/create\s+or\s+replace\s+function\s+public\.motifs_refus_remise\s*\(/i);
  const iRecalc = SQL.search(/create\s+or\s+replace\s+function\s+public\.recalcule_devis\s*\(/i);
  verifier('…posée dans la section 49 (49.9), après `recalcule_devis`, et jamais retouchée par un `alter function`',
    NOMS49.includes('motifs_refus_remise') && iDefMRR > iRecalc && iRecalc > 0
    && !/\balter\s+(?:function|routine)\s+(?:public\s*\.\s*)?motifs_refus_remise\b/i.test(SQL));
  /* Aucune séquence d'échappement ni espace insécable ÉCRITE dans son corps :
     le transport du connecteur Supabase change une séquence `\u…` (CLAUDE.md)
     — les espaces insécables s'écrivent en CARACTÈRES, et ses phrases n'en
     ont aucune. */
  const corpsMRRbrut = defsMRR.length === 1 ? defsMRR[0].corps : '';
  verifier('…son corps ne contient AUCUNE barre oblique inverse (donc aucune séquence `\\u…`), ni espace insécable, ni espace fine',
    !!corpsMRRbrut && !/\\/.test(corpsMRRbrut) && !/[\u00a0\u202f]/.test(corpsMRRbrut));

  /* ---------------- b. LES PHRASES, OCTET POUR OCTET ---------------- */
  /* LA TABLE DU CONTRAT (annexe B.2) : clé, rang, nature, écrits ici en
     toutes lettres — une TROISIÈME écriture, qui garde les deux autres.
     DIX CLÉS SUR NEUF RANGS depuis la relecture de 2b-1 (05/11/2026) : le
     rang 3 est coupé en deux (TXT-1) — `devis_taux_franchise`, la loi,
     `devis_taux_sans_tva`, une prudence (l'autoliquidation le permet) ; et
     `devis_client`, `devis_lignes` sont des RÈGLES D'OPUS (décision D-C du
     propriétaire, le soir du 05/11, constat TXT-4).
     DOUZE CLÉS SUR NEUF RANGS depuis 2b-2 (cahier 2b-2, §2.5 et annexe A.1) :
     `devis_pour_qui` (rang 1, règle d'Opus, EXCLUSIF avec `devis_client` :
     sans client, on ne demande pas à quel titre il commande) et
     `devis_taux_reduit_neuf` (rang 3, prudence : le taux réduit sur une ligne
     d'un chantier qui crée un bâtiment neuf, selon la réponse de l'artisan).
     SEIZE CLÉS SUR ONZE RANGS depuis 2b-3 (cahier 2b-3, §2.5 et annexe A.1,
     réponses du 12/11 : P1 = A, P2 = oui) : `devis_acompte_signature` (rang
     10, prudence : « À la signature » sans savoir où le devis sera signé), et
     au rang 11, au plus UNE des trois clés de la décennale —
     `devis_decennale` (prudence : la question laissée vide vaut « Oui »),
     `devis_attestation_date` (prudence : une attestation jointe sans date de
     fin) et `devis_attestation` (LA LOI, L. 243-2 : aucune attestation
     valable, ou la réponse « Oui »). */
  const CONTRAT_B2 = [
    ['devis_client', 1, 'regle_opus'], ['devis_pour_qui', 1, 'regle_opus'], ['devis_lignes', 2, 'regle_opus'],
    ['devis_taux_franchise', 3, 'loi'], ['devis_taux_sans_tva', 3, 'prudence'], ['devis_taux_reduit_neuf', 3, 'prudence'],
    ['devis_lieu', 4, 'prudence'], ['devis_delai', 5, 'regle_opus'], ['devis_validite', 6, 'prudence'],
    ['devis_acompte_nature', 7, 'prudence'], ['devis_acompte_ramene', 8, 'prudence'], ['devis_reduction_ramenee', 9, 'prudence'],
    ['devis_acompte_signature', 10, 'prudence'], ['devis_decennale', 11, 'prudence'], ['devis_attestation_date', 11, 'prudence'],
    ['devis_attestation', 11, 'loi'],
  ];
  const motifsSql = [...sansEspaces(corpsMRRbrut).matchAll(/rang := (\d+); cle := '(\w+)'; nature := '(\w+)';(?: ligne_id := v_ligne;)? phrase := '((?:[^']|'')*)';/g)]
    .map((m) => ({ cle: m[2], rang: Number(m[1]), nature: m[3], phrase: m[4].replace(/''/g, "'") }));
  const motifsJs = Object.entries(D.MOTIFS_DEVIS || {}).map(([cle, m]) => ({ cle, rang: m.rang, nature: m.nature, phrase: m.phrase }))
    .sort((a, b) => a.rang - b.rang);
  verifier('b. les SEIZE motifs du devis (onze rangs) : mêmes clés, rangs, natures et phrases dans `schema.sql` et dans `MOTIFS_DEVIS` '
    + '(devis.js) — octet pour octet, dans l’ordre des rangs', motifsSql.length === 16 && egal(motifsSql, motifsJs),
  motifsSql.length !== 16 ? `${motifsSql.length} motif(s) lus dans la fonction`
    : motifsSql.filter((m, i) => !egal(m, motifsJs[i])).map((m) => `${m.cle} : SQL ${json(m)} ≠ JS ${json(motifsJs.find((j) => j.cle === m.cle))}`).join(' | '));
  verifier('…et ce sont les clés, rangs et natures du CONTRAT (annexe B.2) : `devis_delai`, `devis_client` et `devis_lignes` sont des '
    + 'RÈGLES D’OPUS (réponses du 05/11), `devis_pour_qui` aussi (rang 1, avec `devis_client`, 2b-2), le rang 3 a trois clés (la franchise, '
    + 'la loi ; le réel sans TVA, une prudence ; le taux réduit d’un chantier neuf, une prudence — 2b-2), `devis_lieu`, '
    + '`devis_validite`, la nature et les « ramenés » des PRUDENCES, aucun `devis_taux_reduit` tout court (réponse 3 : tout permettre) ni '
    + '`devis_taux_regime` (coupé en deux) ; depuis 2b-3, le rang 10 (`devis_acompte_signature`, une prudence) et le rang 11 '
    + '(`devis_decennale` et `devis_attestation_date`, des prudences ; `devis_attestation`, la loi)',
  egal(motifsSql.map((m) => [m.cle, m.rang, m.nature]), CONTRAT_B2) && egal(motifsJs.map((m) => [m.cle, m.rang, m.nature]), CONTRAT_B2)
    && !('devis_taux_reduit' in (D.MOTIFS_DEVIS || {})) && !/devis_taux_reduit(?!_neuf\b)/.test(SQL)
    && !('devis_taux_regime' in (D.MOTIFS_DEVIS || {})) && !/devis_taux_regime/.test(SQL), json(motifsSql.map((m) => [m.cle, m.rang, m.nature])));
  /* UNE NATURE SE DIT DANS LA PHRASE (relecture de 2b-1, TXT-4, TXT-5, TXT-6,
     TXT-1) : une règle d'Opus du devis dit, après le cas où la loi la
     demande, « Opus le demande pour tous vos devis » ; une prudence de lieu
     ou de validité dit le cas qui décide — « signé dans vos locaux », « les
     services à la personne » — et « Opus ne sait pas encore » ; la prudence
     du taux nomme l'autoliquidation ; une phrase qui dit la loi sans dire
     « pour tous vos devis » ne porte pas la nature d'une règle d'Opus, et
     inversement. Les phrases changées le 05/11 au soir sont écrites ici EN
     TOUTES LETTRES (un sabotage qui changerait la fonction, le miroir ET la
     forme ci-dessus ensemble passerait sinon). */
  const PHRASES_DU_05_11 = {
    devis_client: 'Ce devis ne s’adresse encore à personne : choisissez le client. La loi demande son nom pour un dépannage, une '
      + 'réparation ou un entretien signé dans vos locaux, et pour les services à la personne ; Opus le demande pour tous vos devis.',
    devis_lignes: 'Ce devis ne chiffre encore aucun travail : ajoutez au moins un poste. La loi demande de décrire les travaux et '
      + 'leur prix pour un devis à un particulier ; Opus le demande pour tous vos devis.',
    devis_taux_franchise: 'En franchise de TVA, aucune ligne ne porte de TVA : corrigez le taux de cette ligne.',
    devis_taux_sans_tva: 'Au régime réel, une ligne sans TVA n’est possible que dans quelques cas, comme la sous-traitance en '
      + 'autoliquidation, qu’Opus ne sait pas encore imprimer : corrigez le taux de cette ligne.',
    devis_lieu: 'Écrivez le lieu des travaux. La loi le demande pour un dépannage, une réparation ou un entretien signé dans vos '
      + 'locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un.',
    devis_delai: 'Écrivez le délai d’exécution des travaux. La loi le demande pour la plupart des devis à un particulier ; Opus le '
      + 'demande pour tous vos devis.',
    devis_validite: 'Choisissez la durée de validité du devis. La loi la demande pour un dépannage, une réparation ou un entretien '
      + 'signé dans vos locaux, et pour les services à la personne ; Opus ne sait pas encore si ce devis en est un.',
    devis_reduction_ramenee: 'La réduction en euros dépasse le total des postes : Opus l’a ramenée. Corrigez-la pour que le devis '
      + 'dise ce que vous voulez.',
  };
  const phrasesFausses = Object.entries(PHRASES_DU_05_11)
    .filter(([cle, ph]) => (D.MOTIFS_DEVIS[cle] || {}).phrase !== ph || !(motifsSql.find((m) => m.cle === cle) || {}).phrase
      || motifsSql.find((m) => m.cle === cle).phrase !== ph).map(([cle]) => cle);
  const natureDitePasLaPhrase = motifsJs.filter((m) => (m.nature === 'regle_opus') !== /Opus le demande pour tous vos devis\.$/.test(m.phrase)
    || (m.nature === 'prudence' && /La loi l[ae] demande/.test(m.phrase) && !/Opus ne sait pas encore/.test(m.phrase))).map((m) => m.cle);
  verifier('…les phrases changées par la relecture du 05/11 (client, lignes, les deux taux, lieu, délai, validité, réduction) sont, '
    + 'MOT POUR MOT, celles écrites ici, des deux côtés ; et une règle d’Opus — et elle seule — finit par « Opus le demande pour tous vos '
    + 'devis. » ; une prudence qui cite la loi dit qu’Opus ne sait pas encore ; la réduction se compare au « total des postes », '
    + 'jamais au « total du devis »',
  phrasesFausses.length === 0 && natureDitePasLaPhrase.length === 0
    && !/dépasse le total du devis : Opus l’a ramenée/.test(SQL) && !/pour un particulier et pour un devis signé chez le client/.test(SQL),
  `phrases : ${phrasesFausses.join(', ') || '—'} ; nature ≠ phrase : ${natureDitePasLaPhrase.join(', ') || '—'}`);
  /* 2b-3 : UNE exception, et une seule — « 8e » dans la phrase de
     `devis_acompte_signature` (annexe A.1 : « Dès le 8e jour » est le libellé
     de la pastille qu'elle nomme). Ce n'est pas un montant mis en forme. */
  const sansLe8e = (m) => (m.cle === 'devis_acompte_signature' ? m.phrase.replace('« Dès le 8e jour »', '« Dès le jour »') : m.phrase);
  const fauteDeForme = motifsJs.filter((m) => /\d|€|'|[\u00a0\u202f]|\\/.test(sansLe8e(m)) || !/[.]$/.test(m.phrase) || !/’/.test(m.phrase + '’'));
  verifier('…aucune phrase ne porte de chiffre (sauf « Dès le 8e jour », le nom d’une pastille, dans `devis_acompte_signature`), d’euro, '
    + 'd’apostrophe DROITE, d’espace insécable ni de barre oblique : la base ne met pas '
    + 'de montant en forme, et l’apostrophe est typographique, comme dans `emetteur_incomplet()`', motifsJs.length === 16
    && fauteDeForme.length === 0, fauteDeForme.map((m) => m.cle).join(', '));
  /* Les natures de l'ENTREPRISE (annexe B.3) : `regle_opus` pour les trois
     règles d'Opus gardées le 05/11, `prudence` pour la profession
     réglementée ET le régime de TVA (relecture de 2b-1, TXT-7 : aucune loi
     ne demande de déclarer son régime à Opus), `loi` sinon — `registre`
     compris —, lues dans le `case` de la fonction et comparées à
     `NATURE_DU_MOTIF_ENTREPRISE`. */
  /* 2b-2 : entre les deux listes, la nature qui dépend de la RÉPONSE
     VALABLE — un `conso_` est une prudence quand le client commande comme
     non-professionnel ou comme professionnel (Opus ne sait pas encore si la
     mention lui est due) ; écrite ici en toutes lettres. */
  const caseNat = /nature := case when cle in \(((?:'\w+'(?:, )?)+)\) then 'regle_opus' when v_valable in \('non_professionnel', 'professionnel'\) and left\(cle, 6\) = 'conso_' then 'prudence' when cle in \(((?:'\w+'(?:, )?)+)\) then 'prudence' else 'loi' end;/.exec(sansEspaces(corpsMRRbrut));
  const natSql = caseNat ? Object.fromEntries([
    ...caseNat[1].split(', ').map((x) => [x.replace(/'/g, ''), 'regle_opus']),
    ...caseNat[2].split(', ').map((x) => [x.replace(/'/g, ''), 'prudence'])]) : null;
  const natJs = D.NATURE_DU_MOTIF_ENTREPRISE || {};
  const triee = (o) => Object.fromEntries(Object.entries(o || {}).sort(([a], [b]) => a.localeCompare(b)));
  verifier('…les natures des motifs de l’entreprise sont les MÊMES des deux côtés : `entreprise_ancienne`, `conso_tva_intra`, '
    + '`frais_deplacement` en règle d’Opus, `conso_profession_reglementee` et `regime_tva` en prudence, toute autre clé en loi '
    + '(`registre` et les neuf autres `conso_` compris)',
  !!natSql && egal(triee(natSql), triee(natJs))
    && egal(triee(natJs), triee({ entreprise_ancienne: 'regle_opus', conso_tva_intra: 'regle_opus', frais_deplacement: 'regle_opus',
      conso_profession_reglementee: 'prudence', regime_tva: 'prudence' }))
    && D.natureDuMotifEntreprise('regime_tva') === 'prudence' && D.natureDuMotifEntreprise('registre') === 'loi'
    && D.natureDuMotifEntreprise('conso_mediateur') === 'loi'
    && D.natureDuMotifEntreprise('identite') === 'loi' && D.natureDuMotifEntreprise('cle_inconnue') === 'loi'
    && D.natureDuMotifEntreprise('__proto__') === 'loi',
  `SQL ${json(natSql)} | JS ${json(natJs)}`);
  verifier('…et le rang de l’entreprise est `100 + position` des deux côtés, la clé coupée au PREMIER « : »',
    /rang := 100 \+ v_position;/.test(sansEspaces(corpsMRRbrut)) && D.RANG_DE_L_ENTREPRISE === 100
    && /cle := split_part\(v_motif, ': ', 1\);/.test(sansEspaces(corpsMRRbrut))
    /* `engageDecennale: false` (2b-3) : « Non » ne lit rien, le rang 11 se
       tait — seuls les motifs de l'entreprise restent. */
    && egal(D.motifsDeRemise({ devis: { clientId: 'c', pourQui: 'consommateur', pourQuiClient: 'c', delaiExecution: 'x', lieuVille: 'v', validiteJours: 30, engageDecennale: false }, lignes: [{ id: 'l', type: 'poste', tauxTvaCentiemes: 0, ordre: 1 }], regime: 'franchise',
      motifsEmetteur: ['conso_mediateur: Pour un devis : le médiateur.', 'frais_deplacement: Vos frais : à dire.'] })
      .map((m) => [m.rang, m.cle, m.phrase, m.nature]),
    [[101, 'conso_mediateur', 'Pour un devis : le médiateur.', 'loi'], [102, 'frais_deplacement', 'Vos frais : à dire.', 'regle_opus']]));
  /* LA COUPURE « cle: phrase » EST CELLE DE LA BASE (vérification de
     construction, écart 4) : `split_part(v_motif, ': ', 1)` et
     `substr(v_motif, char_length(cle) + 3)` — au PREMIER « : » SUIVI D'UNE
     ESPACE. Les sorties attendues ci-dessous ont été RELEVÉES sur PostgreSQL
     16 avec ces deux expressions (compte rendu de la correction, point 2) ;
     la forme ENTIÈRE de la fonction (a.) garantit que la base coupe bien
     ainsi. Le second motif DÉPARTAGE les deux règles : coupé au premier
     « : » seul, il rendait « a » / « b: phrase ». */
  const COUPURES = [
    ['cle: phrase avec a:b et : c', 'cle', 'phrase avec a:b et : c'],
    ['a:b: phrase', 'a:b', 'phrase'],
    ['sans separateur', 'sans separateur', ''],
    ['cle:', 'cle:', ''],
    ['', '', ''],
  ];
  const coupuresFausses = COUPURES.filter(([m, cle, phrase]) => {
    const r = D.motifsDeRemise({ devis: { clientId: 'c', lieuVille: 'x', delaiExecution: 'x', validiteJours: 30 },
      lignes: [{ id: 'l', type: 'poste', ordre: 1000, prixUnitaireCentimes: 100, tauxTvaCentiemes: 0 }], regime: 'franchise', motifsEmetteur: [m] });
    const e = r.find((x) => x.rang === 101);
    return !e || e.cle !== cle || e.phrase !== phrase;
  }).map(([m]) => m);
  verifier('…la coupure « clé: phrase » est CELLE DE LA BASE — au premier « : » SUIVI D’UNE ESPACE, et sans séparateur toute la '
    + 'chaîne en clé, une phrase vide (`split_part` / `substr`) : « a:b: phrase » rend « a:b » / « phrase »',
  coupuresFausses.length === 0 && /split_part\(v_motif, ': ', 1\)/.test(FORME_MOTIFS_REFUS_REMISE)
    && /substr\(v_motif, char_length\(cle\) \+ 3\)/.test(FORME_MOTIFS_REFUS_REMISE)
    && json(D.couperMotifEntreprise(null)) === json({ cle: null, phrase: null }), coupuresFausses.join(' | '));
  /* LES PHRASES DE L'ÉCRAN (annexe B.8) et les AVIS (B.7), en toutes lettres
     — aux espaces insécables près, que `devis.js` pose devant « % » et « : »
     où la typographie le veut. */
  const B8 = {
    MENTIONS_PARTICULIER_PAR_PRUDENCE: 'Opus ne sait pas encore pour qui le client commande : dans le doute, il compte ce qu’on doit à un particulier.',
    /* 2b-2 (annexe A.6, critique droit I6) : « pour qui » et l'immeuble neuf
       sont maintenant DEMANDÉS ; restent sept faits, dont les conditions du
       taux réduit. 2b-3 (annexe A.6) : « la garantie décennale » sort (le
       rang 11 la lit), « l'urgence » devient « si une ligne marquée
       « réparation urgente » l'est vraiment », et la COUVERTURE de
       l'attestation entre. */
    PAS_ENCORE_VERIFIE: 'Pas encore vérifié : le moment de la signature, si une ligne marquée « réparation urgente » l’est vraiment, si le devis lui-même est payant, les déchets de chantier, le label RGE pour des travaux d’énergie, les conditions du taux réduit de TVA (l’ancienneté du logement, la certification du client), et si votre attestation décennale couvre ces travaux (ses activités, la date où le chantier s’ouvrira).',
    RIEN_NE_MANQUE_POUR_CE_DEVIS: 'Ce devis : rien ne manque de ce qu’Opus vérifie aujourd’hui.',
    LISTE_AVANT_LA_PREMIERE_LIGNE: 'Écrivez une première ligne : la liste se calculera ensuite.',
    LISTE_EN_ROUTE: 'Des changements partent : la liste sera à jour juste après.',
    LISTE_NON_LUE: 'Liste non lue — Réessayer',
    AIDE_TAUX_REDUIT: 'À 10 % ou 5,5 %, le client devra certifier sur le devis que les conditions du taux réduit sont remplies : un logement achevé depuis plus de deux ans, des travaux qui ne créent pas un immeuble neuf et n’agrandissent pas la surface de plus de 10 % ; à 5,5 %, des travaux de rénovation énergétique. Opus imprimera la certification prévue par la loi, avec la place de signer.',
    /* La relecture de 2b-1 (05/11/2026) : une partie qui se relit (ECR-1),
       un brouillon pas en base qui porte quelque chose (ECR-3). */
    CE_DEVIS_SE_MET_A_JOUR: 'Ce devis : la liste se met à jour.',
    ENTREPRISE_SE_MET_A_JOUR: 'Votre entreprise : la liste se met à jour.',
    ENTETE_PAS_ENCORE_ENREGISTRE: 'Un champ du devis n’est pas encore enregistré : la liste se calculera ensuite.',
  };
  const B8faux = Object.entries(B8).filter(([k, v]) => net(D[k]) !== v).map(([k]) => k);
  verifier('…les phrases de l’écran (annexe B.8) sont celles du contrat, mot pour mot', B8faux.length === 0, B8faux.join(', '));
  /* …ET L'AIDE DU TAUX RÉDUIT GARDE SES ESPACES INSÉCABLES avant « % »
     (vérification de construction, écart 5) : la comparaison ci-dessus les
     ramène à des espaces ordinaires (`net`), elle ne verrait pas qu'on les
     perd — « 10 » finirait une ligne et « % » commencerait la suivante. Et
     elles sont ÉCRITES `\u00a0` dans le source, comme toutes les insécables
     de `devis.js` : un caractère invisible collé ne se relit pas. */
  /* …ET ELLE NOMME LES CONDITIONS À CERTIFIER (relecture de 2b-1, TXT-3) :
     elle ne nommait que « le logement a plus de deux ans » — un artisan
     pouvait en déduire le 10 % pour une extension —, et promettait
     d'imprimer « cette phrase ». Comparée EXACTEMENT, insécables comprises :
     les QUATRE espaces entre un nombre et « % ». */
  const nb = '\u00a0';
  verifier('…l’aide du taux réduit nomme les conditions (deux ans, ni immeuble neuf ni plus de 10 % de surface, rénovation énergétique à '
    + '5,5 %), promet « la certification prévue par la loi » — et garde ses QUATRE espaces INSÉCABLES avant « % », écrites `\\u00a0` dans le source',
  D.AIDE_TAUX_REDUIT === `À 10${nb}% ou 5,5${nb}%, le client devra certifier sur le devis que les conditions du taux réduit sont remplies : un `
    + 'logement achevé depuis plus de deux ans, des travaux qui ne créent pas un immeuble neuf et n’agrandissent pas la surface de plus '
    + `de 10${nb}% ; à 5,5${nb}%, des travaux de rénovation énergétique. Opus imprimera la certification prévue par la loi, avec la place de signer.`
    && /export const AIDE_TAUX_REDUIT = 'À 10\\u00a0% ou 5,5\\u00a0%, /.test(lire('src/lib/devis.js'))
    && (D.AIDE_TAUX_REDUIT.match(/\d \u00a0?%/g) || []).length === 0 && (D.AIDE_TAUX_REDUIT.match(/\u00a0%/g) || []).length === 4
    && !/cette phrase/.test(D.AIDE_TAUX_REDUIT), JSON.stringify(D.AIDE_TAUX_REDUIT));
  /* …ET SES QUATRE INSÉCABLES SONT TOUTES ÉCRITES EN SÉQUENCE (banc
     indépendant de 2b-1, 05/11/2026 au soir) : la vérification ci-dessus ne
     relisait la forme écrite que des DEUX premières. La quatrième collée en
     caractère invisible rendait la même valeur, et passait tout — or « un
     caractère invisible collé ne se relit pas », et l'outil d'édition de ces
     sessions en fabrique (CLAUDE.md, lot 1). Le SOURCE de la constante,
     relu entier : quatre séquences, aucun caractère U+00A0 ni U+202F. */
  const sourceAide = (/export const AIDE_TAUX_REDUIT = [\s\S]*?;\n/.exec(lire('src/lib/devis.js')) || [''])[0];
  verifier('…et ses QUATRE insécables sont écrites `\\u00a0` dans le source de la constante — aucune n’y est collée en caractère invisible',
    sourceAide.length > 200 && (sourceAide.match(/\\u00a0/g) || []).length === 4 && !/[\u00a0\u202f]/.test(sourceAide),
  `${(sourceAide.match(/\\u00a0/g) || []).length} séquence(s), ${(sourceAide.match(/[\u00a0\u202f]/g) || []).length} caractère(s) invisible(s)`);
  verifier('…les étiquettes de nature disent « La loi », « Par prudence », « Règle d’Opus » — et les avis (B.7) leurs deux phrases',
    egal(D.ETIQUETTE_DE_NATURE, { loi: 'La loi', prudence: 'Par prudence', regle_opus: 'Règle d’Opus' })
    && egal(Object.fromEntries(Object.entries(D.AVIS_DU_DEVIS || {}).map(([k, v]) => [k, net(v)])), {
      avis_objet: 'Ce devis n’a pas de titre : le document dira seulement « Devis ».',
      avis_gratuit: 'Ce devis ne coûte rien au client : vérifiez que c’est voulu.',
      /* 2b-2 (annexe A.3) : deux avis de la FICHE, jamais bloquants. */
      avis_siret_client: 'Ce client commande pour son entreprise : ajoutez son SIRET à sa fiche, il vous servira pour la facture.',
      avis_fiche_particulier: 'Ce client commande pour son entreprise, mais votre carnet le range parmi les particuliers : passez '
        + 'sa fiche en « Entreprise » pour y écrire son SIRET.',
    }) && egal(D.NATURES_DE_MOTIF, ['loi', 'prudence', 'regle_opus']));
  /* « PAS ENCORE VÉRIFIÉ » NE PROMET RIEN (critique E-11) : aucune date,
     aucun « prochain lot », aucun « bientôt » — on dit ce qui manque, pas
     quand. Et il nomme les HUIT faits que 2b-1 ne vérifie pas (critique D2 :
     sans eux, « rien ne manque » mentirait) — le label RGE et l'immeuble
     neuf depuis la relecture de 2b-1 (TXT-2), et « si le devis lui-même
     est payant » à la place du « prix du devis », qui se lisait comme le
     total. */
  const pev = net(D.PAS_ENCORE_VERIFIE);
  verifier('…« Pas encore vérifié » nomme les SEPT faits qu’Opus ne vérifie pas encore (2b-2 : « pour qui » et l’immeuble neuf sont '
    + 'DEMANDÉS, les conditions du taux réduit restent — l’ancienneté du logement, la certification du client ; 2b-3 : la décennale est '
    + 'LUE, sauf ce que couvre l’attestation, et l’urgence reste — si une ligne marquée l’est vraiment), jamais « le prix du '
    + 'devis », et n’annonce ni date ni lot (S13)',
  ['le moment de la signature', 'si une ligne marquée « réparation urgente » l’est vraiment', 'si le devis lui-même est payant',
    'les déchets de chantier', 'le label RGE pour des travaux d’énergie',
    'les conditions du taux réduit de TVA (l’ancienneté du logement, la certification du client)',
    'si votre attestation décennale couvre ces travaux (ses activités, la date où le chantier s’ouvrira)']
    .every((x) => pev.includes(x)) && !/le prix du devis/.test(pev)
    && !/pour qui le client commande|immeuble neuf|la garantie décennale|, l’urgence,/.test(pev)
    && !/bient[oô]t|prochain|lot\b|\b20\d\d\b|\d{1,2}\/\d{1,2}|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre/i.test(pev), pev);

  /* ---------------- OP027 — le même refus, des deux côtés ---------------- */
  const op027 = [...SQL.matchAll(/raise\s+exception\s+'((?:[^']|'')*)'\s+using\s+errcode\s*=\s*'OP027'/gi)].map((m) => m[1].replace(/''/g, "'"));
  const op027Partout = (SQL.match(/'OP027'/g) || []).length;
  verifier('OP027 : levé UNE fois dans tout le schéma (par `motifs_refus_remise`), avec la phrase de `REFUS_REMISE.OP027` (erreurs.js), '
    + 'octet pour octet — « n’existe pas » et « pas le vôtre » dans la MÊME phrase',
  op027.length === 1 && op027Partout === 1 && op027[0] === ERR.REFUS_REMISE.OP027
    && ERR.REFUS_REMISE.OP027 === 'Ce devis n’existe pas, ou il n’est pas le vôtre.' && /\bif not found then raise exception 'Ce devis/.test(sansEspaces(corpsMRRbrut)),
  json(op027));
  const msgOp027 = ERR.messageClair(new ERR.ErreurDeLaBase('OP027', ERR.REFUS_REMISE.OP027), 'La liste de ce qu’il manque pour remettre ce devis');
  const msgAbsente = ERR.messageClair({ code: '42883', message: 'function public.motifs_refus_remise(uuid) does not exist' }, 'La liste');
  verifier('…OP027 est un refus DÉFINITIF (pas de « Réessayer » qui rendrait la même réponse), `messageClair` rend sa phrase telle quelle ; '
    + 'et une base où la fonction manque le DIT en français (« la fonction « motifs_refus_remise » lui manque »), jamais en anglais',
  ERR.estUnRefusDefinitif({ code: 'OP027' }) === true && ERR.estUnRefusDefinitif({ code: 'OP028' }) === false
    && msgOp027.includes(ERR.REFUS_REMISE.OP027) && /la fonction « motifs_refus_remise » lui manque/.test(msgAbsente)
    && !/does not exist/.test(msgAbsente), `${msgOp027} | ${msgAbsente}`);
  /* …MAIS UNE FAUTE DE PROGRAMMATION N'EST PAS UNE BASE EN RETARD
     (relecture de 2b-1, TXT-8) : 42883 dit aussi « une fonction de
     PostgreSQL appelée avec de mauvais types » et « un opérateur
     introuvable ». L'écran les imputait à la base et disait de rejouer
     `schema.sql`. Seule une fonction QUALIFIÉE « public. » — la forme d'un
     appel de l'application — est une base en retard ; les autres suivent le
     chemin ordinaire. Les trois messages, FAITS TOURNER. */
  const enRetard = (msg) => /lui manque|n’a pas encore reçu la mise à jour|schema\.sql/.test(msg);
  const msgLower = ERR.messageClair({ code: '42883', message: 'function lower(integer) does not exist' }, 'La liste');
  const msgOperateur = ERR.messageClair({ code: '42883', message: 'operator does not exist: uuid = text' }, 'La liste');
  verifier('…et `messageClair` ne prend pour une base en retard QUE la fonction qualifiée « public. » : « function lower(integer) does not '
    + 'exist » et « operator does not exist » suivent le chemin ordinaire',
  enRetard(msgAbsente) && !enRetard(msgLower) && !enRetard(msgOperateur)
    && enRetard(ERR.messageClair({ code: '42883', message: 'function public.emetteur_incomplet(uuid) does not exist' }, 'La liste')),
  `${msgLower} | ${msgOperateur}`);

  /* ---------------- c. LES CAS DE PARITÉ, JOUÉS PAR LE MIROIR ---------------- */
  /* Engendrés par `scripts/generer-cas-remise.mjs`, qui fait jouer la VRAIE
     fonction sur un PostgreSQL local (le procédé des 768 cas du badge, lot
     S-a). Un fichier ABSENT est un échec, pas un silence : sans lui, la
     parité n'est plus éprouvée nulle part. */
  let CR = null;
  try { CR = JSON.parse(lire('supabase/cas-remise.json')); } catch (e) { CR = null; }
  const casR = CR && Array.isArray(CR.cas) ? CR.cas : [];
  const ecartsR = [];
  for (const c of casR) {
    let vu;
    try {
      /* 2b-3 : les assurances que la base a lues (celles d'un AUTRE artisan
         comprises), et le jour par DÉFAUT — celui du téléphone : les dates
         du fichier sont fixes (2001 ou 2999), il juge pareil n'importe quel
         jour d'ici là. */
      vu = D.motifsDeRemise({ devis: c.devis, lignes: c.lignes, regime: c.regime, motifsEmetteur: c.motifsEmetteur,
        assurances: c.assurances })
        .map((m) => ({ rang: m.rang, cle: m.cle, phrase: m.phrase, nature: m.nature,
          ligne_id: m.ligneId == null ? null : c.lignes.findIndex((l) => l.id === m.ligneId) }));
    } catch (e) {
      vu = `plante : ${e && e.message}`;
    }
    if (!egal(vu, c.attendu)) ecartsR.push(`cas ${c.n} « ${c.nom} » : ${json(vu).slice(0, 160)} ≠ ${json(c.attendu).slice(0, 160)}`);
  }
  verifier(`c. \`supabase/cas-remise.json\` est là, et le miroir \`motifsDeRemise\` rend, sur ses ${casR.length} situations, EXACTEMENT ce que `
    + 'la vraie fonction a rendu — rang, clé, phrase, nature et ligne désignée : ZÉRO écart',
  !!CR && casR.length >= 50 && ecartsR.length === 0,
  !CR ? 'fichier absent ou illisible : la parité n’est plus éprouvée (npm run generer-cas-remise)' : ecartsR.slice(0, 4).join(' | '));
  /* SA COUVERTURE : sans elle, un fichier réduit à trois cas faciles
     passerait « zéro écart ». Chaque motif du devis y apparaît SEUL au moins
     une fois ; chaque nature ; « rien ne manque » ; un motif de
     l'entreprise ; trois lignes fautives dans un même devis, ÉCRITES dans un
     autre ordre que celui du devis (le miroir doit les ranger lui-même) — en
     franchise ET au réel, puisque le rang 3 a deux clés (relecture de 2b-1,
     TXT-1) ; et D4-c sur un devis NEUF VIDE venu d'une urgence, puis d'une
     demande et d'une urgence (PAR-6) : chaque motif du devis y est éprouvé
     contre l'origine. */
  const seul = (k) => casR.some((c) => c.attendu.length === 1 && c.attendu[0].cle === k);
  const natures = new Set(casR.flatMap((c) => c.attendu.map((a) => a.nature)));
  const desordreDe = (cle) => casR.some((c) => {
    const ix = c.attendu.filter((a) => a.cle === cle).map((a) => a.ligne_id);
    return ix.length >= 3 && ix.some((v, i) => i > 0 && v < ix[i - 1]);
  });
  const desordre = desordreDe('devis_taux_franchise') && desordreDe('devis_taux_sans_tva');
  const CLES_DU_NEUF = 'devis_client,devis_lignes,devis_lieu,devis_delai,devis_validite';
  const neufVide = (source, demande, urgence) => casR.some((c) => c.devis && c.devis.source === source
    && !!c.devis.quoteRequestId === demande && !!c.devis.sosRequestId === urgence && c.lignes.length === 0
    && c.attendu.filter((a) => a.rang < 100).map((a) => a.cle).join() === CLES_DU_NEUF);
  const d4cNeufs = neufVide('manuelle', false, false) && neufVide('urgence', false, true) && neufVide('demande', true, true);
  /* BASE-1 : le délai fait d'un seul U+3000 (hors de la classe de blancs)
     est FIGÉ dans le fichier engendré — sans motif `devis_delai`. Sans cette
     exigence, retirer le cas du générateur passait au vert (banc du 05/11). */
  const u3000 = casR.some((c) => c.devis && c.devis.delaiExecution === '\u3000'
    && !c.attendu.some((a) => a.cle === 'devis_delai'));
  const clesDevisApp = Object.keys(D.rowToDevis({})).sort();
  const formeApp = casR.every((c) => egal(Object.keys(c.devis || {}).sort(), clesDevisApp) && Array.isArray(c.lignes) && Array.isArray(c.motifsEmetteur)
    && Array.isArray(c.assurances));
  /* 2b-3 : AUCUNE date d'assurance entre 2002 et 2998 — une date proche
     ferait vieillir le fichier (une attestation « valable » cesserait de
     l'être, et le miroir, qui juge au jour du TÉLÉPHONE, rougirait un
     matin sans que rien n'ait changé) ; et une assurance d'un AUTRE artisan
     au moins une fois (le miroir doit l'écarter, comme `a.pro_id = v_pro`). */
  const datesProches = casR.flatMap((c) => (c.assurances || []).map((a) => a.valide_jusquau)
    .filter((v) => v !== null && !(v <= '2001-12-31' || v >= '2999-01-01')));
  const autreArtisan = casR.some((c) => (c.assurances || []).some((a) => String(a.pro_id) !== String(c.devis && c.devis.proId))
    && c.attendu.some((m) => m.rang === 11));
  const nonCouverts = CONTRAT_B2.map(([k]) => k).filter((k) => !seul(k));
  verifier('…et ils COUVRENT la règle : chaque motif du devis seul au moins une fois, les trois natures, au moins un devis où rien ne '
    + 'manque, un motif de l’entreprise, trois lignes fautives rangées autrement qu’écrites (en franchise ET au réel), le devis NEUF VIDE '
    + 'ouvert à la main, venu d’une urgence, venu d’une demande et d’une urgence (D4-c), le délai fait d’un seul U+3000 sans motif (BASE-1), '
    + 'des assurances aux dates FIXES (2001 ou 2999, jamais entre) et une d’un AUTRE artisan (2b-3) '
    + '— et le devis est dans la forme de l’application '
    + '(`rowToDevis`)',
  nonCouverts.length === 0 && ['loi', 'prudence', 'regle_opus'].every((n) => natures.has(n))
    && casR.some((c) => c.attendu.length === 0) && casR.some((c) => c.attendu.some((a) => a.rang > 100)) && desordre && d4cNeufs && u3000 && formeApp
    && datesProches.length === 0 && autreArtisan,
  `non couverts seuls : ${nonCouverts.join(', ') || '—'} ; natures ${json([...natures])} ; désordre ${desordre} ; neufs D4-c ${d4cNeufs} ; U+3000 ${u3000} ; forme ${formeApp} ; dates proches ${json(datesProches)} ; autre artisan ${autreArtisan}`);
  let PKG = {};
  try { PKG = JSON.parse(lire('package.json')); } catch (e) { PKG = {}; }
  const GEN = sansCommentairesJs(lireSiExiste('scripts/generer-cas-remise.mjs') || '');
  verifier('…engendrés par `npm run generer-cas-remise`, qui rejoue `schema.sql` et appelle la VRAIE `motifs_refus_remise` (jamais un '
    + 'fichier écrit à la main)', (PKG.scripts || {})['generer-cas-remise'] === 'node scripts/generer-cas-remise.mjs'
    && /schema\.sql/.test(GEN) && /motifs_refus_remise\s*\(/.test(GEN) && /emetteur_incomplet\s*\(/.test(GEN)
    && /--verifier/.test(GEN) && /generer-cas-remise/.test((CR && CR._lisez_moi) || ''));

  /* ---------------- LE MIROIR, ET CE QUI L'ENTOURE ---------------- */
  const M = (devis, lignes = [], regime = 'reel', motifsEmetteur = []) => D.motifsDeRemise({ devis, lignes, regime, motifsEmetteur }).map((m) => m.cle);
  /* 2b-2 : un devis « complet » porte aussi une réponse « à quel titre »
     VALABLE (pour son client) — sans elle, `devis_pour_qui` s'ajoute. */
  /* 2b-3 : « complet » répond aussi « Non » à la décennale — « Non » ne lit
     rien, le rang 11 se tait (une réponse vide compterait « Oui », et
     `devis_decennale` s'ajouterait à chaque bord). */
  const complet = { clientId: 'c', pourQui: 'consommateur', pourQuiClient: 'c', lieuVille: 'Brest', delaiExecution: '2 semaines', validiteJours: 30,
    engageDecennale: false };
  const poste20 = { id: 'p', type: 'poste', tauxTvaCentiemes: 2000, ordre: 1000 };
  verifier('le miroir, FAIT TOURNER sur les bords : des BLANCS ne sont pas un délai ni un lieu (insécable, espace sans chasse compris) ; un '
    + 'acompte en % n’est jamais « ramené » ; une réduction ÉGALE ne l’est pas ; un effectif absent ne se compare pas',
  egal(M({ ...complet, delaiExecution: ' \u00a0\u200b ' }, [poste20]), ['devis_delai'])
    /* La classe de blancs de `tient_le_devis()` : U+00A0 et l'espace sans
       chasse pour le texte ; U+202F pour le CODE POSTAL seulement (une
       ville faite d'un U+202F reste rangée telle quelle par la base). */
    && egal(M({ ...complet, lieuVille: ' \u00a0', lieuAdresse: '\u200b ', lieuCodePostal: ' \u202f ' }, [poste20]), ['devis_lieu'])
    && egal(M({ ...complet, lieuVille: '\u202f' }, [poste20]), [])
    && egal(M({ ...complet, acompteCentiemes: 10000, acompteNature: 'acompte', acompteTtcCentimes: 1 }, [poste20]), [])
    && egal(M({ ...complet, remiseCentimes: 500, remiseHtCentimes: 500 }, [poste20]), [])
    && egal(M({ ...complet, remiseCentimes: 500, remiseHtCentimes: 499 }, [poste20]), ['devis_reduction_ramenee'])
    && egal(M({ ...complet, acompteCentimes: 500, acompteNature: 'arrhes' }, [poste20]), [])
    && egal(M({ ...complet, acompteCentimes: 500 }, [poste20]), ['devis_acompte_nature']),
  json(M({ ...complet, delaiExecution: ' \u00a0\u200b ' }, [poste20])));
  /* LES BORDS DE `devis_lieu`, EN TOUTES LETTRES (relecture de 2b-1, PAR-7).
     Ils n'étaient gardés que par un cas du fichier ENGENDRÉ (`cas-remise.json`,
     « le code postal seul ») : un miroir réduit à l'adresse et à la ville, et
     un fichier récrit à la main d'après lui, passaient au vert — la parité
     n'est rattachée à la base que par `generer-cas-remise --verifier`, qui
     demande PostgreSQL et ne tourne pas ici (`docs/A-FAIRE.md` §2.3). Un
     seul des trois suffit ; les trois vides, et seulement eux, font le motif.
     ET LA LISTE VÉRIFIE UNE PRÉSENCE, PAS UN SENS (BASE-1) : un délai fait
     d'un seul U+3000 — hors de la classe de blancs du projet — passe pour
     écrit, comme la base le range (cas 62 du fichier, cas 5 de l'essai). */
  const sansLieu = { ...complet, lieuVille: null };
  verifier('les bords de `devis_lieu`, écrits ici et FAITS TOURNER : le code postal seul, la ville seule, l’adresse seule → aucun motif ; '
    + 'les trois vides → `devis_lieu` ; un délai d’un seul U+3000 → pas de `devis_delai` (une présence, pas un sens)',
  egal(M({ ...sansLieu, lieuCodePostal: '13410' }, [poste20]), [])
    && egal(M({ ...sansLieu, lieuVille: 'Lambesc' }, [poste20]), [])
    && egal(M({ ...sansLieu, lieuAdresse: '4 rue de l’Essai' }, [poste20]), [])
    && egal(M({ ...sansLieu, lieuAdresse: null, lieuCodePostal: null }, [poste20]), ['devis_lieu'])
    && egal(M({ ...sansLieu, lieuAdresse: '', lieuCodePostal: '', lieuVille: '' }, [poste20]), ['devis_lieu'])
    && egal(M({ ...complet, delaiExecution: '\u3000' }, [poste20]), []),
  json([M({ ...sansLieu, lieuCodePostal: '13410' }, [poste20]), M({ ...complet, delaiExecution: '\u3000' }, [poste20])]));
  /* LES AUTRES BORDS DU MIROIR, EN TOUTES LETTRES (banc indépendant de 2b-1,
     05/11/2026 au soir — le trou de PAR-7 hors du lieu). Comme ceux de
     `devis_lieu`, ils n'étaient gardés que par des cas du fichier ENGENDRÉ :
     un miroir faux ET `cas-remise.json` récrit d'après lui passaient tous les
     contrôles — l'acompte en euros « ramené » à égalité, une OPTION comptée
     pour un poste, la nature exigée sur un acompte en euros seulement. La
     parité n'est rattachée à la base que par `generer-cas-remise --verifier`,
     qui demande PostgreSQL et ne tourne pas ici (`docs/A-FAIRE.md` §2.3).
     Les sorties attendues sont celles que la VRAIE fonction a rendues (cas 8,
     30, 35, 36 et 39 de `cas-remise.json`, relevés sur PostgreSQL 16). */
  verifier('les autres bords du miroir, écrits ici et FAITS TOURNER : un acompte EN EUROS égal au TTC n’est pas ramené, un centime de plus '
    + 'l’est, un TTC de 0 le ramène ; une OPTION seule ne chiffre aucun travail (`devis_lignes`), un poste OFFERT seul en est un ; un '
    + 'acompte EN POURCENTAGE sans nature rend `devis_acompte_nature`, comme un acompte en euros',
  egal(M({ ...complet, acompteCentimes: 100000, acompteNature: 'acompte', acompteTtcCentimes: 100000 }, [poste20]), [])
    && egal(M({ ...complet, acompteCentimes: 100001, acompteNature: 'acompte', acompteTtcCentimes: 100000 }, [poste20]), ['devis_acompte_ramene'])
    && egal(M({ ...complet, acompteCentimes: 5000, acompteNature: 'acompte', acompteTtcCentimes: 0 }, [poste20]), ['devis_acompte_ramene'])
    && egal(M({ ...complet, acompteCentiemes: 3000, acompteTtcCentimes: 30000 }, [poste20]), ['devis_acompte_nature'])
    && egal(M(complet, [{ id: 'o', type: 'option', tauxTvaCentiemes: 2000, ordre: 1000 }]), ['devis_lignes'])
    && egal(M(complet, [{ id: 'p', type: 'poste', tauxTvaCentiemes: 2000, ordre: 1000, offert: true }]), []),
  json([M({ ...complet, acompteCentimes: 100000, acompteNature: 'acompte', acompteTtcCentimes: 100000 }, [poste20]),
    M(complet, [{ id: 'o', type: 'option', tauxTvaCentiemes: 2000, ordre: 1000 }]), M({ ...complet, acompteCentiemes: 3000, acompteTtcCentimes: 30000 }, [poste20])]));
  /* LE RANG 3 A DEUX CLÉS, CHOISIES PAR LE RÉGIME (TXT-1) : en franchise
     `devis_taux_franchise` (la loi), au réel `devis_taux_sans_tva` (une
     prudence), dans l'ordre des lignes, en une boucle ; régime inconnu :
     aucune. */
  const lt = (id, type, t, ordre) => ({ id, type, tauxTvaCentiemes: t, ordre, prixUnitaireCentimes: 100 });
  const rang3 = (regime, lignes) => D.motifsDeRemise({ devis: complet, lignes, regime }).filter((m) => m.rang === 3)
    .map((m) => `${m.cle}:${m.nature}:${m.ligneId}`).join();
  verifier('le rang 3, FAIT TOURNER : en franchise chaque ligne taxée rend `devis_taux_franchise` (la loi), au réel chaque ligne à 0 rend '
    + '`devis_taux_sans_tva` (une prudence), dans l’ordre `ordre, id` ; régime inconnu, aucune',
  rang3('franchise', [lt('b', 'poste', 2000, 2), lt('a', 'option', 550, 2), lt('c', 'poste', 0, 1)])
      === 'devis_taux_franchise:loi:a,devis_taux_franchise:loi:b'
    && rang3('reel', [lt('b', 'poste', 0, 2), lt('a', 'option', 0, 2), lt('c', 'poste', 2000, 1)])
      === 'devis_taux_sans_tva:prudence:a,devis_taux_sans_tva:prudence:b'
    && rang3(null, [lt('b', 'poste', 0, 2), lt('a', 'option', 2000, 2)]) === '',
  `${rang3('franchise', [lt('b', 'poste', 2000, 2), lt('a', 'option', 550, 2)])} | ${rang3('reel', [lt('b', 'poste', 0, 2)])}`);
  /* RÉGIME ↔ TAUX : UNE règle (`ligneContreditLeRegime`), lue par le motif ET
     par la bande du haut (`coherenceRegime`) — elles ne se contredisent pas. */
  const cR = corpsDeFonction(sansCommentairesJs(lire('src/lib/devis.js')), 'coherenceRegime') || '';
  const L = (type, t, offert = false) => ({ id: `${type}${t}`, type, tauxTvaCentiemes: t, offert, ordre: 1 });
  verifier('régime ↔ taux : `ligneContreditLeRegime` est la seule règle (`coherenceRegime` l’appelle) — un poste OU une option, offerte '
    + 'comprise ; en franchise tout taux non nul, au réel un taux nul ; un régime inconnu, un titre ou une ligne sans taux ne contredisent rien',
  (cR.match(/ligneContreditLeRegime\(/g) || []).length === 2
    && D.ligneContreditLeRegime(L('poste', 2000), 'franchise') && D.ligneContreditLeRegime(L('option', 550, true), 'franchise')
    && D.ligneContreditLeRegime(L('poste', 0, true), 'reel') && D.ligneContreditLeRegime(L('option', 0), 'reel')
    && !D.ligneContreditLeRegime(L('poste', 0), 'franchise') && !D.ligneContreditLeRegime(L('poste', 2000), 'reel')
    && !D.ligneContreditLeRegime(L('poste', 2000), null) && !D.ligneContreditLeRegime(L('reserve', 2000), 'franchise')
    && !D.ligneContreditLeRegime(L('piece', 2000), 'franchise') && !D.ligneContreditLeRegime({ type: 'poste', tauxTvaCentiemes: null }, 'franchise'));
  /* LA TRADUCTION D'UNE LIGNE RENDUE PAR POSTGREST. */
  verifier('`rowToMotifDeRemise` traduit une ligne de PostgREST (`ligne_id` → `ligneId`), sans rien inventer',
    egal(D.rowToMotifDeRemise({ rang: 3, cle: 'devis_taux_franchise', phrase: 'p', nature: 'loi', ligne_id: 'x' }),
      { rang: 3, cle: 'devis_taux_franchise', phrase: 'p', nature: 'loi', ligneId: 'x' })
    && egal(D.rowToMotifDeRemise(null), { rang: null, cle: null, phrase: null, nature: null, ligneId: null }));
  /* LES AVIS NE SONT PAS DES MOTIFS (critique B6) : ils ne vivent pas dans la
     fonction, et leurs clés ne sont jamais celles d'un motif. */
  verifier('les AVIS ne bloquent rien : `avisDuDevis` est pur (objet vide → `avis_objet` ; au moins un poste et un TTC relu à 0, sur une liste '
    + 'SÛRE → `avis_gratuit` ; TTC inconnu → rien ; pas de devis → rien), aucune clé `avis_` dans la fonction de la base ni parmi les motifs',
  egal(D.avisDuDevis({ devis: { objet: '  ' }, lignes: [poste20], totaux: { ttc: 0 }, etat: 'liste' }).map((a) => a.cle), ['avis_objet', 'avis_gratuit'])
    && egal(D.avisDuDevis({ devis: { objet: 'Mur', totalTtcCentimes: 0 }, lignes: [poste20], etat: 'liste' }).map((a) => a.cle), ['avis_gratuit'])
    && egal(D.avisDuDevis({ devis: { objet: 'Mur' }, lignes: [poste20], etat: 'liste' }), [])
    && egal(D.avisDuDevis({ devis: { objet: 'Mur' }, lignes: [], totaux: { ttc: 0 }, etat: 'liste' }), [])
    && egal(D.avisDuDevis({ devis: null }), [])
    && !/avis_/.test(corpsMRRbrut) && !Object.keys(D.MOTIFS_DEVIS || {}).some((k) => /^avis_/.test(k)));
  /* « CE DEVIS NE COÛTE RIEN » SE TAIT TANT QUE LA LISTE N'EST PAS SÛRE
     (relecture de 2b-1, PAR-8) : le cas du relecteur — une seule ligne,
     un poste PAS ENREGISTRÉ, et un TTC de la base à 0 — faisait dire à la
     même carte « 1 ligne n’est pas enregistrée », « ne chiffre encore aucun
     travail » ET « ne coûte rien au client ». Tu : en route, en lecture, en
     échec, sur un brouillon pas en base, quand quelque chose n'est pas
     compté — et sans état du tout. */
  const pasEnregistre = D.ceQueLaListeNeComptePas({ nbLignes: 1 });
  const gratuit = (o) => D.avisDuDevis({ devis: { objet: 'x' }, lignes: [{ type: 'poste', prixUnitaireCentimes: 5000 }], totaux: { ttc: 0 }, ...o })
    .map((a) => a.cle);
  verifier('…et « ce devis ne coûte rien » se TAIT tant que la liste n’est pas SÛRE : un seul poste pas enregistré et un TTC de base à 0 ne '
    + 'le font pas dire ; ni en route, ni en lecture, ni en échec, ni sans état',
  egal(gratuit({ etat: 'liste', pasCompte: pasEnregistre }), []) && egal(gratuit({ etat: 'en_route' }), [])
    && egal(gratuit({ etat: 'lecture' }), []) && egal(gratuit({ etat: 'echec' }), []) && egal(gratuit({}), [])
    && egal(gratuit({ etat: 'pas_en_base' }), []) && egal(gratuit({ etat: 'liste' }), ['avis_gratuit']),
  json([gratuit({ etat: 'liste', pasCompte: pasEnregistre }), gratuit({ etat: 'liste' })]));
  /* LA LISTE RANGÉE POUR L'ÉCRAN — par endroit, et une clé inconnue
     s'affiche quand même, sans jamais passer pour une mention secondaire. */
  const liste = [
    { rang: 1, cle: 'devis_client', phrase: 'a', nature: 'loi', ligneId: null },
    { rang: 3, cle: 'devis_taux_franchise', phrase: 'b', nature: 'loi', ligneId: 'L9' },
    { rang: 101, cle: 'identite', phrase: 'c', nature: 'loi', ligneId: null },
    { rang: 102, cle: 'conso_mediateur', phrase: 'd', nature: 'loi', ligneId: null },
    { rang: 103, cle: 'conso_nouvelle_cle', phrase: 'e', nature: 'loi', ligneId: null },
    { rang: 7, cle: 'devis_cle_nouvelle', phrase: '', nature: 'xyz', ligneId: null },
  ];
  const lue = D.lireMotifsDeRemise(liste, { sections: E.SECTION_DU_MOTIF });
  const sans = D.lireMotifsDeRemise(liste);
  verifier('`lireMotifsDeRemise` range par ENDROIT et compte chacun : une mention `conso_` CONNUE va aux « mentions dues à un particulier », '
    + 'une clé INCONNUE s’affiche quand même (dans « Votre entreprise » au-delà du rang 100, « Ce devis » sinon), jamais comme mention '
    + 'secondaire ; une phrase vide d’une clé inconnue reste lisible ; sans la table des sections, aucun bouton d’entreprise',
  egal(lue.comptes, { devis: 3, entreprise: 2, particulier: 1 }) && lue.total === 6
    && lue.parties.particulier.map((p) => p.cle).join() === 'conso_mediateur'
    && lue.parties.entreprise.map((p) => p.cle).join() === 'identite,conso_nouvelle_cle'
    && lue.parties.devis.map((p) => p.cle).join() === 'devis_client,devis_taux_franchise,devis_cle_nouvelle'
    && lue.parties.devis[2].phrase.length > 10 && lue.parties.devis[2].nature === null
    && egal(lue.parties.devis[1].endroit, { endroit: 'ligne', ligneId: 'L9' })
    && egal(lue.parties.entreprise[0].endroit, { endroit: 'entreprise', section: E.SECTION_DU_MOTIF.identite })
    && sans.parties.entreprise.every((p) => p.endroit === null) && sans.comptes.particulier === 0
    && egal(D.lireMotifsDeRemise([]).comptes, { devis: 0, entreprise: 0, particulier: 0 }),
  json(lue.comptes));
  /* LA BASE FAIT FOI (relecture de 2b-1, PAR-2) : la phrase et la nature
     RENDUES s'affichent, jamais celles du miroir — une base plus récente que
     l'application dit ce qu'elle a décidé. Remplacer l'une par
     `MOTIFS_DEVIS[cle]` passait tous les contrôles. */
  const rendue = D.lireMotifsDeRemise([{ rang: 4, cle: 'devis_lieu', phrase: 'Phrase rendue par la base.', nature: 'loi' }]);
  verifier('…la phrase et la nature RENDUES par la base s’affichent, jamais celles du miroir : « a » reste « a », et `devis_lieu` rendu '
    + '« loi » (le miroir dit « prudence ») reste « loi », étiqueté « La loi »',
  lue.parties.devis[0].phrase === 'a' && lue.parties.devis[1].phrase === 'b'
    && rendue.parties.devis[0].phrase === 'Phrase rendue par la base.' && rendue.parties.devis[0].nature === 'loi'
    && rendue.parties.devis[0].etiquette === 'La loi' && D.MOTIFS_DEVIS.devis_lieu.nature !== 'loi',
  json(rendue.parties.devis[0]));
  /* UN BOUTON PAR POINT DE L'ENTREPRISE (critique E-8) : chaque motif
     d'`emetteur.js` qui a une section mène à « Mon entreprise » sur ELLE. */
  const sansEndroit = E.MOTIFS.filter((m) => m.section).filter((m) => {
    const p = D.lireMotifsDeRemise([{ rang: 101, cle: m.cle, phrase: 'x', nature: 'loi' }], { sections: E.SECTION_DU_MOTIF });
    const pt = [...p.parties.entreprise, ...p.parties.particulier][0];
    return !pt || !pt.endroit || pt.endroit.endroit !== 'entreprise' || pt.endroit.section !== m.section;
  }).map((m) => m.cle);
  verifier(`…chacun des ${E.MOTIFS.filter((m) => m.section).length} motifs de l’entreprise qui a une section mène à « Mon entreprise » sur SA `
    + 'section', E.MOTIFS.length >= 20 && sansEndroit.length === 0, sansEndroit.join(', '));
  /* CE QUE L'ÉCRAN FAIT DE CHAQUE MOTIF DU DEVIS (critique E-13, E-16). */
  verifier('chaque motif du devis a son ENDROIT : le client, les lignes, LA ligne fautive, le lieu, le délai, ou « Conditions » ouverte SUR '
    + 'son champ (la validité, la nature, l’acompte, la réduction)',
  CONTRAT_B2.every(([k]) => !!D.ENDROIT_DU_MOTIF[k])
    && egal(D.endroitDuMotif({ cle: 'devis_validite' }), { endroit: 'conditions', champ: 'validite' })
    && egal(D.endroitDuMotif({ cle: 'devis_acompte_nature' }), { endroit: 'conditions', champ: 'nature' })
    && egal(D.endroitDuMotif({ cle: 'devis_taux_franchise', ligneId: null }), { endroit: 'lignes' })
    && egal(D.endroitDuMotif({ cle: 'devis_taux_sans_tva', ligneId: 'L2' }), { endroit: 'ligne', ligneId: 'L2' })
    && D.endroitDuMotif({ cle: 'inconnue' }) === null);

  /* ---------------- d. L'ESSAI SQL ---------------- */
  let brutE = '';
  try { brutE = lire('supabase/essais-section-49-remise.sql'); } catch (e) { brutE = ''; }
  const essE = sansCommentairesSql(brutE);
  /* Les blocs `do` ne portent JAMAIS un essai de RLS (CLAUDE.md : la
     politique `with check` n'y est pas appliquée) : aucun n'y change de
     rôle ni de jeton. */
  const blocsDo = [...essE.matchAll(/\bdo\s+(\$\w*\$)([\s\S]*?)\1/gi)].map((m) => m[2]);
  /* 2b-2 : deux refus de plus — 15 g (`devis_pour_qui_check`, une réponse
     inconnue) et 18 b (la date du « Oui » écrite par un client : droit de
     colonne refusé) —, soit TREIZE.
     2b-3 : six de plus, le cas 19 (`devis_ligne_urgence_check` sur une
     option, une zone, une pièce, une réserve, un poste changé en option ; et
     une zone urgente ET chiffrée, nommée par `devis_ligne_forme_check` :
     l'ordre alphabétique) —, soit DIX-NEUF. */
  const errs = (essE.match(/\\set\s+e1[2589]\w+_err\s+:ERROR\b/g) || []).length;
  const juges = (essE.match(/:'e1[2589]\w+_err'\s*=\s*'true'/g) || []).length;
  verifier('d. l’essai `essais-section-49-remise.sql` annonce EXACTEMENT ses 19 erreurs et JUGE chacune en SQL (`:ERROR`, '
    + '`LAST_ERROR_SQLSTATE`, `LAST_ERROR_MESSAGE`) ; aucun bloc `do` n’y change de rôle ni de jeton ; OP027 y est éprouvé avec un jeton, '
    + 'depuis une fonction `security definer` et par `service_role`, et un visiteur y est refusé',
  brutE.length > 20000 && /EXACTEMENT 19 lignes/.test(brutE) && errs === 19 && juges === 19
    && (essE.match(/LAST_ERROR_SQLSTATE/g) || []).length >= 19
    && blocsDo.every((b) => !/\brole\b|request\.jwt|set_config/i.test(b))
    && /set\s+local\s+role\s+service_role\s*;/i.test(essE) && /security\s+definer/i.test(essE) && /set\s+local\s+role\s+anon\s*;/i.test(essE)
    && (essE.match(/motifs_refus_remise\s*\(/g) || []).length >= 30,
  `${errs} erreur(s) relevée(s), ${juges} jugée(s), ${blocsDo.length} bloc(s) do`);
  /* …ET IL SE PROTÈGE LUI-MÊME D'UN REFUS RETIRÉ (vérification de
     construction, constat T01 : le cas 12 h retiré, le fichier écrivait
     encore 11 erreurs — une variable indéfinie en levait une autre — et le
     juge rendait 0 écart sur 120 valeurs au lieu de 126). Trois gardes :
       - les 33 variables des refus DÉCLARÉES D'AVANCE (« jamais relevé ») :
         un cas retiré laisse un `f`, pas une erreur de syntaxe ;
       - le nombre de valeurs jugées ANNONCÉ (`VALEURS_ANNONCEES`, 126,
         puis 130 depuis la relecture de 2b-1 : les deux clés du rang 3,
         et le délai d'un seul U+3000), et
         CHAQUE valeur jugée passée par `pg_temp.v(…)`, qui avance une
         séquence temporaire (aucun `rollback` ne l'annule) ;
       - un jugement final EN SQL qui compare le compte à l'annonce. */
  const aliasJuges = (essE.match(/\bas\s+[a-z0-9_]*_attendu_[a-z0-9]+\b/g) || []).length;
  /* `pg_temp.v(` moins sa définition : les valeurs ENVELOPPÉES. */
  const enveloppes = (essE.match(/pg_temp\.v\(/g) || []).length - (essE.match(/create function pg_temp\.v\(/g) || []).length;
  const declarees = ['e12a', 'e12b', 'e12c', 'e12d', 'e12e', 'e12f1', 'e12f2', 'e12g1', 'e12g2', 'e12g3', 'e12h', 'e15g', 'e18b',
    'e19a', 'e19b', 'e19c', 'e19d', 'e19e', 'e19f']
    .every((v) => ['err', 'code', 'msg'].every((x) => {
      const i = essE.indexOf(`\\set ${v}_${x} 'jamais relevé'`);
      const j = essE.indexOf(`\\set ${v}_${x} :`);
      return i >= 0 && j > i;
    }));
  const valeursAnnoncees = Number((/\\set\s+VALEURS_ANNONCEES\s+(\d+)/.exec(essE) || [])[1]);
  verifier('…il ANNONCE ses 267 valeurs jugées (130 jusqu’à 2b-1, 187 avec les cas 15 à 18 de 2b-2, et les cas 19 à 24 de 2b-3), les '
    + 'COMPTE (chaque valeur passe par '
    + '`pg_temp.v`, une séquence que `rollback` n’annule pas) et un jugement final EN SQL refuse un autre compte ; les 57 variables des '
    + 'refus sont déclarées d’avance (un cas retiré laisse un `f`, pas une autre erreur)',
  valeursAnnoncees === 267 && /JUGE EXACTEMENT 267 VALEURS/.test(brutE)
    && /create temporary sequence essai_valeurs;/.test(essE)
    && /create function pg_temp\.v\(x anyelement\) returns anyelement\s+language plpgsql volatile security definer as \$v\$\s+begin\s+perform nextval\('pg_temp\.essai_valeurs'\);\s+return x;\s+end;\s+\$v\$;/.test(essE)
    && /select pg_temp\.valeurs_jugees\(\) = :VALEURS_ANNONCEES as toutes_les_valeurs_jugees_attendu_t,/.test(essE)
    && aliasJuges === enveloppes + 1 && declarees,
  `${aliasJuges} colonne(s) jugée(s), ${enveloppes} enveloppée(s), annonce ${valeursAnnoncees}, déclarées d’avance : ${declarees}`);
  /* …ET IL ÉPROUVE CE QUE LA RELECTURE DE 2b-1 A CHANGÉ — pas seulement son
     compte (banc indépendant, 05/11/2026 au soir) : le cas 3 a ramené à
     `count(*) = 5`, le cas 3 b à `count(*) = 2`, ou le délai d'un seul U+3000
     remplacé par « x », gardaient les 130 valeurs et passaient tout — l'essai,
     `cas-remise.json`, `npm run verifier`. La nature ET la phrase de CHAQUE
     clé du rang 3 sont jugées, mot pour mot celles de `MOTIFS_DEVIS` ; et le
     délai d'un seul U+3000 est rangé tel quel, PUIS la liste ne dit rien. */
  const juge3 = (n, cle, alias) => `select pg_temp.v(count(*) = ${n} and bool_and(nature = '${D.MOTIFS_DEVIS[cle].nature}' and phrase = '${D.MOTIFS_DEVIS[cle].phrase.replace(/'/g, "''")}')) as ${alias} from public.motifs_refus_remise(:D1) where rang = 3;`;
  const essEs = sansEspaces(essE);
  const u3000Essai = "update public.devis set delai_execution = chr(12288), generation = 5 where id = :D1; select pg_temp.v(delai_execution = chr(12288)) as u3000_range_tel_quel_attendu_t from public.devis where id = :D1; execute motifs(:D1, '—'); rollback;";
  verifier('…et il JUGE ce que la relecture a changé, pas seulement son compte : la nature et la phrase de `devis_taux_franchise` (cas 3 a) et de '
    + '`devis_taux_sans_tva` (cas 3 b), mot pour mot celles de `MOTIFS_DEVIS` ; un délai d’un seul U+3000 rangé tel quel, puis aucune ligne (cas 5)',
  essEs.includes(juge3(5, 'devis_taux_franchise', 'franchise_la_loi_attendu_t'))
    && essEs.includes(juge3(2, 'devis_taux_sans_tva', 'reel_sans_tva_prudence_attendu_t'))
    && essEs.includes(u3000Essai),
  `3 a ${essEs.includes(juge3(5, 'devis_taux_franchise', 'franchise_la_loi_attendu_t'))}, 3 b ${essEs.includes(juge3(2, 'devis_taux_sans_tva', 'reel_sans_tva_prudence_attendu_t'))}, cas 5 ${essEs.includes(u3000Essai)}`);
  /* LA PREUVE QUI COMPTE POUR D4-c EST LA PROPRIÉTÉ (critique B5) : trois
     devis identiques sauf leurs liens et leur source, comparés sur leur
     signature ENTIÈRE ; et le catalogue relu (`prosrc`, `prosecdef`). */
  const c13 = (/\\echo\s+'===\s+13\.[\s\S]*?(?=\\echo\s+'===\s+14\.)/.exec(essE) || [''])[0];
  const c14 = (/\\echo\s+'===\s+14\.[\s\S]*$/.exec(essE) || [''])[0];
  verifier('…son cas 13 éprouve D4-c par la PROPRIÉTÉ (des devis identiques sauf leurs liens et leur source rendent la même liste) et son '
    + 'cas 14 relit le CATALOGUE (une seule fonction, `prosecdef` faux, `provolatile`, le corps relu dans `prosrc`)',
  /quote_request_id/.test(c13) && /sos_request_id/.test(c13) && /'manuelle'|manuelle/.test(c13) && /_attendu_t\b/.test(c13)
    && /prosrc/.test(c14) && /prosecdef/.test(c14) && /provolatile/.test(c14) && /_attendu_t\b/.test(c14));

  /* ---------------- e. L'API ET LA DÉMONSTRATION ---------------- */
  const API40 = sansCommentairesJs(lire('src/lib/api.js'));
  const sup = sansEspaces(corpsDeFonction(API40, 'motifsRefusRemiseSupabase') || '');
  const demo = sansEspaces(corpsDeFonction(API40, 'motifsRefusRemiseDemo') || '');
  verifier('e. `motifsRefusRemise` (api.js) : la base par `supabase.rpc(\'motifs_refus_remise\', { p_devis })`, sous un délai '
    + '(`lectureDevis`) ; une erreur LÈVE (`leverLecture`) — une fonction absente le dit (`baseEnRetard`) — et une réponse qui n’est pas '
    + 'une liste LÈVE aussi : JAMAIS une liste vide, qui voudrait dire « rien ne manque »',
  /lectureDevis\('La liste de ce qu’il manque pour remettre ce devis', \(signal\) => avecSignal\( supabase\.rpc\('motifs_refus_remise', \{ p_devis: devisId \}\), signal\)\)/.test(sup)
    && /if \(fonctionAbsente\(error\)\) error\.baseEnRetard = true; leverLecture\(error\);/.test(sup)
    && /if \(!Array\.isArray\(data\)\) \{ throw new Error\(/.test(sup) && /return data\.map\(rowToMotifDeRemise\);/.test(sup)
    && !/return \[\]/.test(sup) && !/catch\s*\(/.test(sup)
    /* « Cette fonction n'existe pas » : PGRST202, ou 42883 QUAND c'est
       `motifs_refus_remise` (relecture de 2b-1, TXT-8) — jamais un
       opérateur ni une fonction appelée avec de mauvais types, qui ne sont
       pas une base en retard. */
    && sansEspaces(corpsDeFonction(API40, 'fonctionAbsente') || '') === "{ if (!erreur) return false; if (erreur.code === 'PGRST202') return true; "
      + "return erreur.code === '42883' && /function (public\\.)?motifs_refus_remise\\(/.test(String(erreur.message || '')); }",
  sup.slice(0, 200));
  verifier('…la démonstration fait tourner le MIROIR sur sa propre base, avec la MÊME lecture de l’entreprise que « Mon entreprise » '
    + '(`entreeDesMotifsEmetteurDemo`) ET le RÉGIME de la fiche de démonstration ; un devis inconnu y rend OP027, avec la phrase de la base',
  /if \(!lu\) throw new ErreurDeLaBase\('OP027', REFUS_REMISE\.OP027\);/.test(demo) && /motifsDeRemise\(\{/.test(demo)
    && /motifsEmetteur: motifsEmetteur\(entreeDesMotifsEmetteurDemo\(moi\)\)/.test(demo)
    /* LE RÉGIME (relecture de 2b-1, PAR-5) : sans lui (`regime: null`), la
       démonstration ne signalait plus jamais une ligne dont le taux
       contredit le régime, alors que la base le signale — et rien ne
       rougissait. */
    && /regime: regimeEtSaDate\(ficheEmetteurDemo\(moi\)\)\.regime,/.test(demo)
    && /motifsEmetteur\(entreeDesMotifsEmetteurDemo\(moiEnDemo\(\)\)\)/.test(sansEspaces(corpsDeFonction(API40, 'emetteurIncompletDemo') || '')));
  /* LES DEUX BROUILLONS DE LA DÉMONSTRATION (cahier §3.4) : l'un où « Ce
     devis » est complet, l'autre où manquent la validité et la nature de
     l'acompte — avec le régime de la fiche de démonstration. */
  const jeuD = DEMO.fabriquerDevisDemo(new Date());
  let regimeDemo = null;
  let assurancesDemo = null;
  try {
    const ed = (await import('../src/data/emetteur-demo.js')).fabriquerEmetteurDemo(new Date());
    regimeDemo = ed.emetteur.regime_tva;
    assurancesDemo = ed.assurances;
  } catch (e) { regimeDemo = null; }
  /* 2b-3 : avec les ASSURANCES de la fiche de démonstration (sa décennale
     est jointe et valable), comme `motifsRefusRemiseDemo` les passe. */
  const duDemo = (id, assurances = assurancesDemo) => {
    const d = jeuD.devis.find((x) => x.id === id);
    return d ? D.motifsDeRemise({ devis: d, lignes: jeuD.lignes.filter((l) => l.devisId === id), regime: regimeDemo, motifsEmetteur: [],
      assurances }).map((m) => m.cle) : null;
  };
  verifier('…et en démonstration, « Muret » est COMPLET (aucun motif du devis), « Terrasse » attend la validité et la nature de l’acompte '
    + '— avec la décennale de démonstration, JOINTE et valable (2b-3) ; sans elle, « Muret » attendrait l’attestation',
    !!DEMO.DEVIS_DEMO_IDS.muret && !!DEMO.DEVIS_DEMO_IDS.terrasse && regimeDemo === 'reel'
    && egal(duDemo(DEMO.DEVIS_DEMO_IDS.muret), []) && egal(duDemo(DEMO.DEVIS_DEMO_IDS.terrasse), ['devis_validite', 'devis_acompte_nature'])
    && Array.isArray(assurancesDemo) && assurancesDemo.some((a) => a.nature === 'decennale' && !!a.attestation_chemin)
    && D.etatDeLAttestation(assurancesDemo) === 'valable'
    && egal(duDemo(DEMO.DEVIS_DEMO_IDS.muret, []), ['devis_decennale']),
  `${json(duDemo(DEMO.DEVIS_DEMO_IDS.muret))} | ${json(duDemo(DEMO.DEVIS_DEMO_IDS.terrasse))}`);

  /* ---------------- f. L'ÉCRAN ---------------- */
  const PRb = lireSiExiste('src/components/PourRemettre.js') || '';
  const PR = sansCommentairesJs(PRb);
  /* CE QUE L'ÉCRAN DÉCIDE VIT DANS `devis.js`, IMPORTÉ ET FAIT TOURNER
     (vérification de construction, écart 9). `PourRemettre.js` n'en définit
     plus aucun : il les importe. S'ils y revenaient, `node` ne pourrait plus
     les faire tourner — on le refuse. */
  const P = D;
  const NOMS_PURS = ['CARTE_POUR_REMETTRE', 'TITRE_POUR_REMETTRE', 'etatDeLaListe', 'points', 'comptesParEndroit', 'phraseDesEndroits',
    'premierePhrase', 'SEUIL_LIRE_LA_SUITE', 'actionDuPoint', 'texteDeLaLigneRemise', 'ceQueDitLaCarte', 'ceQueLaListeNeComptePas',
    'LISTE_EN_LECTURE', 'LISTE_MISE_A_JOUR', 'ENTETE_PAS_COMPTE', 'phraseEnRoute', 'GABARITS_DE_LA_LIGNE',
    'CHIFFRE_LE_PLUS_LARGE', 'garderLaPlace'];
  const redefinis = NOMS_PURS.filter((n) => new RegExp(`(?:function|const|let|var)\\s+${n}\\b`).test(PR));
  const importeDe = (/import\s*\{([^}]*)\}\s*from\s*'\.\.\/lib\/devis'/.exec(PR) || ['', ''])[1];
  verifier('f. `PourRemettre.js` existe et ne garde que le DESSIN : ce que l’écran décide (`etatDeLaListe`, `texteDeLaLigneRemise`, '
    + '`ceQueDitLaCarte`, `premierePhrase`, `actionDuPoint`…) vit dans `devis.js`, IMPORTÉ — aucun n’est redéfini dans le composant ; '
    + '`CARTE_POUR_REMETTRE` vaut `pour_remettre`, jamais `remise` (la réduction, E-18) ni `conditions`',
  PRb.length > 3000 && redefinis.length === 0 && NOMS_PURS.every((n) => n in D)
    && ['texteDeLaLigneRemise', 'ceQueDitLaCarte', 'actionDuPoint', 'premierePhrase'].every((n) => new RegExp(`\\b${n}\\b`).test(importeDe))
    && P.CARTE_POUR_REMETTRE === 'pour_remettre' && P.TITRE_POUR_REMETTRE === 'Pour le remettre',
  `redéfinis ici : ${redefinis.join(', ') || '—'} ; importés : ${sansEspaces(importeDe)}`);
  {
    const lue2 = D.lireMotifsDeRemise([{ rang: 1, cle: 'devis_client', phrase: 'x', nature: 'loi' }]);
    const err = new Error('x');
    /* Ce que la lecture en cours relit (relecture de 2b-1, ECR-1) : une
       écriture du devis confirmée, ou « Mon entreprise » refermée. */
    const RD = { devis: true, entreprise: false };
    const RE = { devis: false, entreprise: true };
    /* LE RETOUR DE « MON ENTREPRISE » relit TOUJOURS les deux causes
       (relecture 4 de 2b-1, 06/11/2026) : c'est la relecture qu'il note. */
    const RDE = { devis: true, entreprise: true };
    const etats = [
      P.etatDeLaListe({ enBase: false, enRoute: true, erreur: err, lue: lue2 }),
      P.etatDeLaListe({ enBase: true, enRoute: true, erreur: err, lue: lue2 }),
      P.etatDeLaListe({ enBase: true, champOuvert: true, erreur: err, lue: lue2 }),
      P.etatDeLaListe({ enBase: true, erreur: err, lue: lue2 }),
      P.etatDeLaListe({ enBase: true, champOuvert: true }),
      P.etatDeLaListe({ enBase: true }),
      P.etatDeLaListe({ enBase: true, lue: lue2 }),
      P.etatDeLaListe(),
      /* LE VRAI ÉTAT D'ÉCHEC (relecture de 2b-1, PAR-1) : l'écran EFFACE la
         liste sur un échec (`lireLaListe` pose `motifs: null`), donc `lue`
         est nul. Le contrôle ne jugeait qu'un échec avec une liste déjà lue :
         permuter les deux tests d'`etatDeLaListe` laissait tout échec sur
         « Lecture de la liste… » pour toujours, sans « Réessayer », au vert. */
      P.etatDeLaListe({ enBase: true, erreur: err }),
      P.etatDeLaListe({ enBase: true, erreur: err, lue: null, champOuvert: false }),
      /* LA LECTURE QUI SUIT UNE ÉCRITURE DU DEVIS fait partie du même temps
         (ECR-1) : `en_route`, liste lue ou non ; celle qui suit « Mon
         entreprise » aussi (relecture 4 de 2b-1 : elle relit les deux causes,
         et rien ne relit plus l'entreprise SEULE — une relecture de la seule
         entreprise, si elle revenait, serait « en route » elle aussi, jamais
         une liste dont une partie se tait sous un compte qui ne bouge pas). */
      P.etatDeLaListe({ enBase: true, lue: lue2, relecture: RD }),
      P.etatDeLaListe({ enBase: true, relecture: RD }),
      P.etatDeLaListe({ enBase: true, lue: lue2, relecture: RE }),
      P.etatDeLaListe({ enBase: false, relecture: RD }),
      P.etatDeLaListe({ enBase: true, lue: lue2, relecture: RDE }),
      P.etatDeLaListe({ enBase: true, erreur: err, relecture: RDE }),
      P.etatDeLaListe({ enBase: true, lue: lue2, relecture: { devis: false, entreprise: false } }),
    ];
    verifier('…`etatDeLaListe`, FAIT TOURNER, dans l’ordre du cahier (§3.1) : pas en base AVANT TOUT ; des changements en route — une '
      + 'écriture, un champ de l’en-tête tapé et pas quitté, OU la lecture qui suit une écriture du devis — AVANT l’échec ; JAMAIS « liste » '
      + 'sur un échec ; le VRAI échec (liste effacée, `lue` nul) → « echec » ; rien de lu → « lecture » ; la relecture qui suit « Mon '
      + 'entreprise » (les deux causes) est « en route » elle aussi, avant l’échec',
    egal(etats, ['pas_en_base', 'en_route', 'en_route', 'echec', 'en_route', 'lecture', 'liste', 'pas_en_base',
      'echec', 'echec', 'en_route', 'en_route', 'en_route', 'pas_en_base', 'en_route', 'en_route', 'liste']), json(etats));
    /* CE QUE LA LISTE NE COMPTE PAS (écart 8) : LE compte du pied, dit en
       toutes lettres — et l'en-tête refusé, quand aucune ligne ne l'est. Sur
       un brouillon PAS ENCORE EN BASE (ECR-3), la liste se calculera
       ensuite : il n'y en a aucune. */
    const nc = P.ceQueLaListeNeComptePas;
    verifier('…`ceQueLaListeNeComptePas`, FAIT TOURNER : « 1 ligne n’est pas enregistrée : elle n’est pas comptée dans cette liste. », '
      + 'le pluriel, l’en-tête refusé quand aucune ligne ne l’est, RIEN quand tout est enregistré — et sur un brouillon PAS EN BASE, « … pas '
      + 'encore enregistrée(s) : la liste se calculera ensuite. », avec le même compte',
    nc({ nbLignes: 1 }) === '1 ligne n’est pas enregistrée : elle n’est pas comptée dans cette liste.'
    && nc({ nbLignes: 3, entete: true }) === '3 lignes ne sont pas enregistrées : elles ne sont pas comptées dans cette liste.'
    && nc({ entete: true }) === 'Un champ du devis n’est pas enregistré : il n’est pas compté dans cette liste.'
    && nc({}) === null && nc({ nbLignes: 0, entete: false }) === null && nc() === null && nc({ nbLignes: -2 }) === null
    && nc({ nbLignes: 1, enBase: false }) === '1 ligne n’est pas encore enregistrée : la liste se calculera ensuite.'
    && nc({ nbLignes: 2, entete: true, enBase: false }) === '2 lignes ne sont pas encore enregistrées : la liste se calculera ensuite.'
    && nc({ entete: true, enBase: false }) === 'Un champ du devis n’est pas encore enregistré : la liste se calculera ensuite.'
    && nc({ enBase: false }) === null && nc({ nbLignes: 1, enBase: true }) === nc({ nbLignes: 1 }),
    json([nc({ nbLignes: 1 }), nc({ nbLignes: 2 }), nc({ entete: true }), nc({ nbLignes: 1, enBase: false })]));
    /* LA LIGNE (en haut et en bas), FAITE TOURNER : la phrase EXACTE du
       contrat en route (B.8), SEULE — à l'écran et dans l'étiquette parlée
       (ECR-1 : le compte d'avant disait « ce devis — aucun point » juste
       après qu'on avait vidé le délai) ; « pas compté » DEVANT le compte,
       et LE COMPTE AVEC LUI (décision D-A) ; pas en base, ce n'est pas une
       cible, et une ligne pas enregistrée le dit (ECR-3) ; en échec,
       « Réessayer » ; « mise à jour » seulement pendant une RELECTURE sans
       cause ; pendant la relecture qui suit « Mon entreprise », « Mise à jour
       de la liste… » seule (relecture 4 : rien ne prouve qu'on y a changé
       quoi que ce soit). Cinquième colonne : les GABARITS qui donnent la
       hauteur — la liste FIXE `GABARITS_DE_LA_LIGNE` dès que quelque chose
       n'est pas compté sur un devis en base (REL-1, D-A bis, RELIRE3-1). */
    const lig = (o) => P.texteDeLaLigneRemise({ lue: lue2, ...o });
    const enRoute = lig({ etat: 'en_route' });
    const pc = nc({ nbLignes: 1 });
    const pcNeuf = nc({ nbLignes: 1, enBase: false });
    const pcNeuf2 = nc({ nbLignes: 2, enBase: false });
    const compte2 = 'ce devis — 1 point · votre entreprise — aucun point';
    const G = D.GABARITS_DE_LA_LIGNE;
    const parLigne = [
      [lig({ etat: 'pas_en_base' }), D.LISTE_AVANT_LA_PREMIERE_LIGNE, null, null, null],
      [lig({ etat: 'pas_en_base', pasCompte: pcNeuf }), '1 ligne n’est pas encore enregistrée : la liste se calculera ensuite.', null, null, null],
      [lig({ etat: 'pas_en_base', pasCompte: pcNeuf2 }), '2 lignes ne sont pas encore enregistrées : la liste se calculera ensuite.', null, null, null],
      [enRoute, D.LISTE_EN_ROUTE, 'ouvrir', null, null],
      [lig({ etat: 'en_route', lue: null }), D.LISTE_EN_ROUTE, 'ouvrir', null, null],
      [lig({ etat: 'en_route', pasCompte: pc }), D.LISTE_EN_ROUTE, 'ouvrir', null, G],
      [lig({ etat: 'en_route', relecture: RD, enLecture: true }), D.LISTE_EN_ROUTE, 'ouvrir', null, null],
      [lig({ etat: 'en_route', relecture: RDE, enLecture: true }), D.LISTE_MISE_A_JOUR, 'ouvrir', null, null],
      [lig({ etat: 'en_route', relecture: RDE, enLecture: true, pasCompte: pc }), D.LISTE_MISE_A_JOUR, 'ouvrir', null, G],
      [lig({ etat: 'en_route', relecture: RDE, enLecture: true, lue: null, pasCompte: pc }), D.LISTE_MISE_A_JOUR, 'ouvrir', null, G],
      [lig({ etat: 'echec' }), D.LISTE_NON_LUE, 'reessayer', null, null],
      [lig({ etat: 'echec', erreurReessayable: false, erreurPhrase: 'Ce devis n’existe pas.' }), 'Ce devis n’existe pas.', 'ouvrir', null, null],
      [lig({ etat: 'echec', pasCompte: pc }), D.LISTE_NON_LUE, 'reessayer', null, G],
      [lig({ etat: 'lecture', lue: null }), D.LISTE_EN_LECTURE, 'ouvrir', null, null],
      [lig({ etat: 'lecture', lue: null, pasCompte: pc }), pc, 'ouvrir', null, G],
      [lig({ etat: 'liste' }), compte2, 'ouvrir', null, null],
      [lig({ etat: 'liste', enLecture: true }), `${compte2} · mise à jour…`, 'ouvrir', null, null],
      [lig({ etat: 'liste', pasCompte: pc }), pc, 'ouvrir', compte2, G],
    ];
    const lignesFausses = parLigne.filter(([r, c, a, k, g]) => !r || r.contenu !== c || r.action !== a || r.compte !== k || !egal(r.gabarits, g)
      || 'lignes' in r || 'gabarit' in r).map(([r]) => json(r));
    verifier('…`texteDeLaLigneRemise`, FAIT TOURNER : en route, la phrase EXACTE « Des changements partent : la liste sera à jour juste '
      + 'après. » SEULE (jamais le compte d’avant, ni à l’écran ni dans l’étiquette parlée — ECR-1) ; ce que la liste ne compte pas passe '
      + 'DEVANT le compte, ET le compte reste (D-A) ; pas en base → pas une cible, et une ligne pas enregistrée le dit (ECR-3) ; échec → '
      + '« Réessayer » ; la relecture qui suit « Mon entreprise » → « Mise à jour de la liste… » seule, jamais « Des changements partent » '
      + '(rien ne prouve qu’on y a changé quoi que ce soit) ; et les GABARITS de chaque état (REL-1, D-A bis, RELIRE3-1), plus aucun '
      + '« lignes » ni un seul « gabarit »',
    lignesFausses.length === 0 && D.LISTE_EN_ROUTE === 'Des changements partent : la liste sera à jour juste après.'
      && enRoute.aDire === 'Pour le remettre : Des changements partent : la liste sera à jour juste après. Ouvrir la liste'
      && !/Dernière liste|point/.test(lig({ etat: 'en_route', pasCompte: pc }).aDire)
      && lig({ etat: 'liste', pasCompte: pc }).aDire === `Pour le remettre : ${pc} Dernière liste : ${compte2}. Ouvrir la liste`
      && lig({ etat: 'pas_en_base' }).aDire === 'Pour le remettre : Écrivez une première ligne : la liste se calculera ensuite.'
      && lig({ etat: 'pas_en_base', pasCompte: pcNeuf }).aDire === `Pour le remettre : ${pcNeuf}`
      && lig({ etat: 'echec' }).aDire === 'Liste de ce qu’il manque non lue. Réessayer'
      && lig({ etat: 'liste' }).aDire === `Pour le remettre : ${compte2}. Ouvrir la liste`
      && lig({ etat: 'liste', enLecture: true }).aDire === `Pour le remettre : ${compte2} · mise à jour… Ouvrir la liste`
      && D.LISTE_MISE_A_JOUR === 'Mise à jour de la liste…'
      && lig({ etat: 'en_route', relecture: RDE, enLecture: true, pasCompte: pc }).aDire === 'Pour le remettre : Mise à jour de la liste… Ouvrir la liste'
      /* `phraseEnRoute`, FAITE TOURNER : « Mise à jour de la liste… » pour
         la relecture qui suit « Mon entreprise » (une seule de ses causes
         suffit), « Des changements partent » sinon. */
      && P.phraseEnRoute(null) === D.LISTE_EN_ROUTE && P.phraseEnRoute(RD) === D.LISTE_EN_ROUTE && P.phraseEnRoute() === D.LISTE_EN_ROUTE
      && P.phraseEnRoute(RE) === D.LISTE_MISE_A_JOUR && P.phraseEnRoute(RDE) === D.LISTE_MISE_A_JOUR,
    lignesFausses.join(' | '));
    /* LA PLACE DE LA LIGNE NE DÉPEND NI DE L'ÉTAT, NI DES NOMBRES, NI DE LA
       PHRASE, tant que quelque chose n'est pas compté sur un devis en base
       (relecture 2 de 2b-1, REL-1 ; décision D-A bis du propriétaire,
       06/11/2026 ; relecture 4, RELIRE3-1). Ce contrôle exigeait d'abord 3
       lignes réservées dans un état et 2 dans un autre : il consacrait le
       saut 92 → 74 points de la première lettre tapée. Puis il exigeait la
       MÊME paire de gabarits « phrase + décompte » DE LA LISTE LUE de part et
       d'autre des transitions : il consacrait le saut que la relecture 3 a
       trouvé — la place suivait les NOMBRES (92 → 110 points à 393 quand le
       dernier point du devis était corrigé), et à la première lecture, sans
       liste, il n'y avait aucun gabarit. Il exige désormais :
         1. LA MÊME LISTE, `GABARITS_DE_LA_LIGNE` (le même objet), dans TOUS
            les états où quelque chose n'est pas compté sur un devis en base —
            liste, en route (une écriture, la relecture qui la suit, celle qui
            suit « Mon entreprise »), lecture, échec, OP027 —, avec ou sans
            liste lue, quels que soient les nombres et la phrase ; `null` sans
            « pas compté » ou sur un brouillon pas en base ;
         2. SA COMPOSITION : chaque phrase « pas compté » d'un devis en base
            (une ligne, N lignes, le champ de l'en-tête) sous sa forme la plus
            large, croisée avec chaque décompte le plus large, puis les
            phrases d'état ;
         3. LES BORNES qui la rendent suffisante : trois chiffres au plus pour
            les points du devis (huit motifs + un par ligne, 500 lignes) et
            pour les lignes non enregistrées, deux pour l'entreprise (21
            motifs) ;
         4. LE TEXTE LU de chacun de ces états, ramené à ses formes les plus
            larges (chaque nombre écrit avec le chiffre le plus large, « 1
            point » lu comme « aucun point »), est l'un des gabarits — ou la
            première moitié de l'un (la phrase seule, en lecture) —, ou la
            phrase d'un refus définitif : il n'agrandit pas la place. Que ces
            formes soient bien les plus LARGES est une affaire de police :
            `mesure-devis` le mesure dans la page, et balaie les hauteurs de
            320 à 440 points. */
    const pcsTous = [nc({ nbLignes: 1 }), nc({ nbLignes: 2 }), nc({ nbLignes: 12 }), nc({ nbLignes: 444 }), nc({ nbLignes: 500 }),
      nc({ nbLignes: 999 }), nc({ entete: true }), nc({ nbLignes: 1, entete: true }), nc({ nbLignes: 7, entete: true })];
    const listes = [null, ...[[0, 0, 0], [1, 5, 0], [2, 5, 3], [10, 0, 0], [0, 21, 0], [508, 18, 3], [99, 9, 0], [1, 1, 1]]
      .map(([devis, entreprise, particulier]) => ({ comptes: { devis, entreprise, particulier } }))];
    const op027 = 'Ce devis n’existe pas, ou il n’est pas le vôtre.';
    const etatsPasCompte = (lue) => [
      ...(lue ? [{ etat: 'liste', lue }, { etat: 'liste', lue, enLecture: true }] : []),
      { etat: 'en_route', lue }, { etat: 'en_route', lue, relecture: RD, enLecture: true }, { etat: 'en_route', lue, relecture: RDE, enLecture: true },
      { etat: 'lecture', lue: null }, { etat: 'echec', lue: null }, { etat: 'echec', lue: null, erreurReessayable: false, erreurPhrase: op027 },
    ];
    const vus = pcsTous.flatMap((q) => listes.flatMap((l) => etatsPasCompte(l).map((o) => P.texteDeLaLigneRemise({ pasCompte: q, ...o }))));
    const horsDeLaListe = vus.filter((r) => r.gabarits !== D.GABARITS_DE_LA_LIGNE).map((r) => json(r));
    const sansGabarit = [
      ...listes.flatMap((l) => [...(l ? [{ etat: 'liste', lue: l }] : []), { etat: 'en_route', lue: l }, { etat: 'lecture', lue: null },
        { etat: 'echec', lue: null }, { etat: 'en_route', lue: l, relecture: RDE }].map((o) => P.texteDeLaLigneRemise(o))),
      P.texteDeLaLigneRemise({ etat: 'pas_en_base', pasCompte: pcNeuf }), P.texteDeLaLigneRemise({ etat: 'pas_en_base', pasCompte: pcNeuf2 }),
      P.texteDeLaLigneRemise({ etat: 'pas_en_base', pasCompte: nc({ entete: true, enBase: false }) }),
    ].filter((r) => r.gabarits !== null).map((r) => json(r));
    const W = P.CHIFFRE_LE_PLUS_LARGE;
    const phrasesG = [nc({ nbLignes: 1 }), nc({ nbLignes: Number(W.repeat(3)) }), nc({ entete: true })];
    const decomptesG = [0, Number(W.repeat(3))].flatMap((d) => [0, Number(W.repeat(2))]
      .map((e) => `ce devis — ${P.points(d)} · votre entreprise — ${P.points(e)}`));
    const attendus = [...phrasesG.flatMap((p) => decomptesG.map((d) => `${p}\n${d}`)), D.LISTE_EN_ROUTE, D.LISTE_MISE_A_JOUR, D.LISTE_NON_LUE];
    /* un seul des deux motifs de taux par devis, un par ligne fautive */
    const pointsDuDevisMax = Object.keys(D.MOTIFS_DEVIS).length - 2 + D.LIGNES_MAX;
    const pointsEntrepriseMax = E.MOTIFS.length;
    const largeDe = (t) => t
      .replace(/^\d{1,3} lignes ne sont pas/, `${W.repeat(3)} lignes ne sont pas`)
      .replace(/ce devis — (?:1 point|\d{1,3} points)(?= ·)/, (m) => (m.endsWith(' 1 point') ? 'ce devis — aucun point' : `ce devis — ${W.repeat(3)} points`))
      .replace(/votre entreprise — (?:1 point|\d{1,2} points)$/, (m) => (m.endsWith(' 1 point') ? 'votre entreprise — aucun point'
        : `votre entreprise — ${W.repeat(2)} points`));
    const lu = (r) => (r.compte ? `${r.contenu}\n${r.compte}` : r.contenu);
    const nonCouverts = vus.map(lu).filter((t) => t !== op027 && !G.includes(largeDe(t)) && !G.some((g) => g.split('\n')[0] === largeDe(t)));
    verifier('…REL-1, D-A bis et RELIRE3-1 : les gabarits de la ligne sont la liste FIXE `GABARITS_DE_LA_LIGNE` — le même objet — dans TOUS '
      + 'les états où quelque chose n’est pas compté sur un devis en base (liste, en route, la relecture qui suit une écriture et celle qui '
      + 'suit « Mon entreprise », lecture, échec, OP027), avec ou sans liste lue, quels que soient les nombres (0 à 508 points) et la phrase '
      + '(1 à 999 lignes, le champ de l’en-tête) ; aucun gabarit sans « pas compté » ni sur un brouillon pas en base ; la liste croise '
      + 'chaque phrase et chaque décompte sous leur forme la plus large (le chiffre le plus large d’Inter, « 4 »), puis les phrases d’état ; '
      + 'et le texte lu, ramené à ses formes les plus larges, est l’un d’eux, la première moitié de l’un, ou la phrase d’un refus définitif',
    horsDeLaListe.length === 0 && vus.length === pcsTous.length * (6 + 8 * 8) && sansGabarit.length === 0
      && egal([...G], attendus) && Object.isFrozen(G) && G.length === 15 && W === '4'
      && String(pointsDuDevisMax).length <= 3 && String(pointsEntrepriseMax).length <= 2 && String(D.LIGNES_MAX).length <= 3
      && nonCouverts.length === 0 && largeDe('ce devis — 1 point · votre entreprise — 5 points') === decomptesG[1],
    `${horsDeLaListe.slice(0, 2).join(' | ')} ${sansGabarit.slice(0, 2).join(' | ')} ; non couverts : ${nonCouverts.slice(0, 3).join(' | ')}`);
    /* LA RÈGLE DE LA PLACE, SANS MÉMOIRE (relecture 6 de 2b-1, 07/11/2026 :
       décision d'architecture). La ligne réserve ses gabarits SI ET SEULEMENT
       SI le devis est en base et que quelque chose n'est pas compté OU qu'une
       écriture renvoyée après un échec est en route (`renvoi`, la file le
       dit). `garderLaPlace`, FAITE TOURNER rendu par rendu — chaque rendu ne
       voit QUE ses entrées : aucune mémoire, rien ne se retient d'un rendu au
       suivant —, puis ce que la ligne réserve (`texteDeLaLigneRemise` avec
       `renvoi`). « G » : les gabarits, la place réservée (110 points en haut à
       393) ; « — » : les deux lignes ordinaires (74). Les suites :
         1. une ligne en échec → « Réessayer » → de nouveau en échec : G G G
            (RELIRE4-C : le renvoi en route ne rend pas la place) ;
         2. …→ « Réessayer » qui réussit : G G, puis — DÈS LA RÉUSSITE (l'instant
            où l'ancienne liste est encore là compris), et le retour de la liste
            ne change plus rien : le saut nommé « ce n'est plus pas compté » ;
         3. une ligne incomplète, puis complétée (elle part, ce n'est pas un
            renvoi) : la place se rend au geste ;
         4-6. ce qui cesse d'être compté SANS ÉCRITURE — une ligne incomplète
            retirée, une valeur refusée remise (carte ouverte), un champ de
            l'en-tête refusé puis rétabli : — au geste, et rien ensuite. Ces
            suites ne consacrent PAS RELIRE5-R1 (la place qui attendait une
            liste neuve) : elles l'interdisent ;
         7. tout compté, puis une écriture : — partout ;
         8. un brouillon pas en base : rien de réservé, même « pas compté »,
            même un renvoi ; puis son entrée en base avec une ligne incomplète :
            G (le saut nommé) ; ou, tout compté, rien ;
         9. sous une carte ouverte : la règle ne regarde pas les cartes — la
            place se réserve ou se rend sans attendre leur fermeture (la saisie
            n'y éteint que la fermeture du clavier par la liste,
            `glisserFermeLeClavier`) ;
        10. un renvoi qui réussit, puis la lecture de la liste en échec : la
            place est déjà rendue, l'échec de la lecture ne la réserve pas ;
            une ligne devenue incomplète PENDANT l'échec, puis complétée ;
        11. l'en-tête refusé et le retour de « Mon entreprise » : G tant que le
            champ est refusé, — dès qu'il est corrigé (une écriture neuve). */
    {
      const L1 = [{ cle: 'l1' }];
      const L2 = [{ cle: 'l2' }];
      const L3 = [{ cle: 'l3' }];
      const pc1 = nc({ nbLignes: 1 });
      const pcE = nc({ entete: true });
      const pcNeuf = nc({ nbLignes: 1, enBase: false });
      const rendus = (suite) => suite.map((r) => {
        const o = {
          enBase: true, pasCompte: null, liste: null, relecture: null, renvoi: false, ...r,
        };
        const regle = P.garderLaPlace({ enBase: o.enBase, pasCompte: o.pasCompte, renvoi: o.renvoi });
        const t = P.texteDeLaLigneRemise({
          etat: o.etat, lue: o.liste ? lue2 : null, pasCompte: o.pasCompte, relecture: o.relecture, renvoi: o.renvoi,
        });
        if ((t.gabarits === D.GABARITS_DE_LA_LIGNE) !== regle) return '?';
        if (t.gabarits === D.GABARITS_DE_LA_LIGNE) return 'G';
        return t.gabarits === null ? '—' : '?';
      }).join(' ');
      const L = (liste, o = {}) => ({ etat: 'liste', liste, ...o });
      const R = (liste, o = {}) => ({ etat: 'en_route', liste, ...o });
      const carte = { carte: true };
      const suites = [
        ['échec → renvoi → échec', [L(L1, { pasCompte: pc1 }), R(L1, { renvoi: true }), L(L1, { pasCompte: pc1 })], 'G G G'],
        ['échec → renvoi → réussite', [L(L1, { pasCompte: pc1 }), R(L1, { renvoi: true }), L(L1), R(L1, { relecture: RD }), L(L2)],
          'G G — — —'],
        ['échec → renvoi → échec → renvoi → réussite', [L(L1, { pasCompte: pc1 }), R(L1, { renvoi: true }), L(L1, { pasCompte: pc1 }),
          R(L1, { renvoi: true }), R(L1, { relecture: RD }), L(L2)], 'G G G G — —'],
        ['incomplète → complétée (elle part)', [L(L1), L(L1, { pasCompte: pc1 }), R(L1), L(L1), R(L1, { relecture: RD }), L(L2)],
          '— G — — — —'],
        ['incomplète → retirée sans écriture', [L(L1), L(L1, { pasCompte: pc1 }), L(L1), R(L1), L(L2)], '— G — — —'],
        ['refusée → remise sans écriture, carte ouverte', [L(L1), L(L1, { pasCompte: pc1 }), L(L1, { pasCompte: pc1, ...carte }),
          L(L1, { ...carte }), L(L1)], '— G G — —'],
        ['en-tête refusé → rétabli sans écriture', [L(L1), R(L1, { pasCompte: pcE }), L(L1, { pasCompte: pcE }), R(L1, { pasCompte: pcE }),
          L(L1), R(L1), L(L2)], '— G G G — — —'],
        ['tout compté → écriture', [L(L1), R(L1), L(L1), R(L1, { relecture: RD }), L(L2)], '— — — — —'],
        ['brouillon pas en base, puis en base avec une ligne incomplète', [{ etat: 'pas_en_base', enBase: false },
          { etat: 'pas_en_base', enBase: false, pasCompte: pcNeuf }, { etat: 'pas_en_base', enBase: false, renvoi: true },
          R(null, { pasCompte: pc1 }), { etat: 'lecture', pasCompte: pc1 }, L(L1, { pasCompte: pc1 })], '— — — G G G'],
        ['brouillon pas en base, puis en base tout compté', [{ etat: 'pas_en_base', enBase: false }, R(null), { etat: 'lecture' }, L(L1)],
          '— — — —'],
        ['brouillon pas en base, une ligne incomplète puis complétée, puis en base tout compté', [
          { etat: 'pas_en_base', enBase: false, pasCompte: pcNeuf }, { etat: 'pas_en_base', enBase: false }, R(null), { etat: 'lecture' },
          L(L1)], '— — — — —'],
        ['sous une carte ouverte : se réserve et se rend sans attendre sa fermeture', [L(L1, { ...carte }),
          L(L1, { pasCompte: pc1, ...carte }), R(L1, { renvoi: true, ...carte }), L(L1, { ...carte }), L(L1)], '— G G — —'],
        ['tout compté, un champ ouvert', [L(L1), R(L1), L(L1)], '— — —'],
        ['un renvoi qui réussit, puis la lecture en échec, puis relue', [L(L1, { pasCompte: pc1 }), R(L1, { renvoi: true }), { etat: 'echec' },
          { etat: 'lecture' }, L(L2)], 'G G — — —'],
        ['la lecture en échec, une ligne devenue incomplète PENDANT l’échec, puis complétée', [{ etat: 'echec' },
          { etat: 'echec', pasCompte: pc1 }, R(null), R(null, { relecture: RD }), L(L1)], '— G — — —'],
        ['l’en-tête refusé, le retour de « Mon entreprise », puis le champ corrigé', [L(L1, { pasCompte: pcE }),
          R(L1, { pasCompte: pcE, relecture: RDE }), L(L2, { pasCompte: pcE }), R(L2), L(L2), R(L2, { relecture: RD }), L(L3)],
          'G G G — — — —'],
        ['un retrait en échec, renvoyé, qui réussit', [L(L1, { pasCompte: pc1 }), R(L1, { renvoi: true }), R(L1, { relecture: RD }), L(L2)],
          'G G — —'],
      ];
      const faux = suites.map(([nom, suite, attendu]) => [nom, rendus(suite), attendu]).filter(([, vu, attendu]) => vu !== attendu);
      const corpsRegle = sansEspaces(corpsDeFonction(sansCommentairesJs(lire('src/lib/devis.js')), 'garderLaPlace') || '');
      verifier('…la place de la ligne suit UNE RÈGLE SANS MÉMOIRE (relecture 6) : `garderLaPlace` — devis en base ET (quelque chose n’est pas '
        + 'compté OU une écriture renvoyée après un échec est en route) —, FAITE TOURNER rendu par rendu sur dix-sept suites (échec → renvoi → '
        + 'échec : G G G ; → réussite : rendue À LA RÉUSSITE ; une ligne complétée ; ce qui cesse d’être compté SANS écriture — une ligne '
        + 'retirée, une valeur remise, un champ rétabli — : rendue AU GESTE ; tout compté ; un brouillon pas en base ; sous une carte ouverte, '
        + 'sans attendre sa fermeture ; un renvoi puis la lecture en échec ; l’en-tête refusé et « Mon entreprise » ; un retrait renvoyé) ; '
        + 'la ligne réserve exactement quand la règle le dit ; elle ne prend ni mémoire, ni liste, ni état, ni carte ; `renvoi` doit valoir '
        + '`true` ; et un renvoi seul ne réserve rien sur un brouillon pas en base',
      faux.length === 0 && P.garderLaPlace() === false && P.garderLaPlace({ enBase: true }) === false
        && P.garderLaPlace({ enBase: true, pasCompte: pc1 }) === true && P.garderLaPlace({ enBase: true, renvoi: true }) === true
        && P.garderLaPlace({ enBase: true, renvoi: 1 }) === false && P.garderLaPlace({ enBase: false, pasCompte: pcNeuf }) === false
        && P.garderLaPlace({ enBase: false, renvoi: true }) === false
        && corpsRegle === '{ return !!enBase && (!!pasCompte || renvoi === true); }'
        && (sansEspaces(sansCommentairesJs(lire('src/lib/devis.js'))).match(/function garderLaPlace\(/g) || []).length === 1
        && sansEspaces(sansCommentairesJs(lire('src/lib/devis.js')))
          .includes('export function garderLaPlace({ enBase = false, pasCompte = null, renvoi = false } = {}) {')
        && P.texteDeLaLigneRemise({ etat: 'pas_en_base', renvoi: true }).gabarits === null
        && P.texteDeLaLigneRemise({ etat: 'en_route', lue: lue2, renvoi: true }).gabarits === D.GABARITS_DE_LA_LIGNE
        && P.texteDeLaLigneRemise({ etat: 'liste', lue: lue2, renvoi: true }).contenu === compte2
        && P.texteDeLaLigneRemise({ etat: 'liste', lue: lue2, garder: true }).gabarits === null
        && P.texteDeLaLigneRemise({ etat: 'liste', lue: lue2 }).gabarits === null
        && sansEspaces(corpsDeFonction(sansCommentairesJs(lire('src/lib/devis.js')), 'texteDeLaLigneRemise') || '')
          .includes("const gabarits = garderLaPlace({ enBase: etat !== 'pas_en_base', pasCompte, renvoi }) ? GABARITS_DE_LA_LIGNE : null;")
        && /export function texteDeLaLigneRemise\(\{[^}]*\brelecture = null,\s+renvoi = false,\s*\}/.test(sansCommentairesJs(lire('src/lib/devis.js'))),
      `${faux.map(([nom, vu, attendu]) => `${nom} : ${vu} au lieu de ${attendu}`).join(' | ')} ; règle : ${corpsRegle.slice(0, 200)}`);
    }
    /* LA CARTE, FAITE TOURNER : ses phrases d'état, dans l'ordre ; « pas
       compté » dit DANS LA CARTE aussi, sur la liste comme sur un échec ; et
       LES PARTIES À MONTRER (relecture de 2b-1, ECR-1) dans les TROIS cas :
         1. une écriture du devis part (`en_route`) : « Ce devis » cède la
            place à sa phrase, « Votre entreprise » reste ;
         2. la lecture qui SUIT cette écriture : l'état reste `en_route`
            (`etatDeLaListe`), même partage ;
         3. le retour de « Mon entreprise » : l'inverse — « Votre
            entreprise » (et ses mentions dues à un particulier) cède la
            place, « Ce devis » reste.
       CE QUI A CHANGÉ, ET POURQUOI : ce contrôle exigeait que la liste se
       montre EN ENTIER en `en_route` (« elle ne clignote pas pendant un
       envoi », E-6). La relecture a montré que la partie « Ce devis » de
       cette liste mentait pendant l'envoi : « ne chiffre encore aucun
       travail » sous un poste qu'on venait d'écrire, « rien ne manque »
       juste après avoir vidé le délai. `montrerLaListe` reste vrai en
       `en_route` — la partie JUSTE ne clignote pas —, mais la partie
       périmée ne se montre plus. */
    const ca = (o) => P.ceQueDitLaCarte({ lue: lue2, ...o });
    const textes = (o) => ca(o).phrases.map((x) => x.texte);
    const montre = (o) => { const c = ca(o); return [c.montrerLaListe, c.parties.devis.montrer, c.parties.entreprise.montrer]; };
    const aLaPlace = (o) => { const c = ca(o); return [c.parties.devis.phrase, c.parties.entreprise.phrase]; };
    const garde = (o) => { const c = ca(o); return [c.parties.devis.garder, c.parties.entreprise.garder]; };
    const ecriture = { etat: P.etatDeLaListe({ enBase: true, enRoute: true, lue: lue2 }) };
    const lectureApres = { etat: P.etatDeLaListe({ enBase: true, lue: lue2, relecture: RD }), relecture: RD, enLecture: true };
    /* LE RETOUR DE « MON ENTREPRISE » relit TOUJOURS les deux causes
       (relecture 4 de 2b-1, 06/11/2026, la décision « simplifier ») : c'est
       un temps « en route », et les DEUX parties se taisent jusqu'au retour
       de la liste. Ce contrôle consacrait d'abord « Ce devis » montré au
       retour quel que soit le changement (relecture 2, REL-2 : le régime de
       TVA décide de ses points), puis une comparaison de régimes qui décidait
       s'il se taisait — elle se trompait dans deux courses (relecture 3,
       RELIRE3-2 et RELIRE3-3). La ligne dit alors « Mise à jour de la
       liste… » : rien ne prouve qu'on a changé quoi que ce soit dans « Mon
       entreprise ». */
    const retourEntreprise = { etat: P.etatDeLaListe({ enBase: true, lue: lue2, relecture: RDE }), relecture: RDE, enLecture: true };
    verifier('…`ceQueDitLaCarte`, FAIT TOURNER sur les TROIS cas de la relecture (ECR-1) : pendant une écriture du devis ET pendant la lecture '
      + 'qui la suit, « Ce devis » cède la place à « Ce devis : la liste se met à jour. » et « Votre entreprise » reste ; au retour de « Mon '
      + 'entreprise », les DEUX se taisent (relecture 4 : toujours les deux causes), et la ligne dit « Mise à jour de la liste… » ; sinon les '
      + 'deux se montrent ; JAMAIS rien sur un échec, une lecture ou un brouillon pas en base',
    egal(montre(ecriture), [true, false, true]) && egal(aLaPlace(ecriture), [D.CE_DEVIS_SE_MET_A_JOUR, null])
      && lectureApres.etat === 'en_route' && egal(montre(lectureApres), [true, false, true]) && egal(aLaPlace(lectureApres), [D.CE_DEVIS_SE_MET_A_JOUR, null])
      && retourEntreprise.etat === 'en_route' && egal(montre(retourEntreprise), [true, false, false])
      && egal(aLaPlace(retourEntreprise), [D.CE_DEVIS_SE_MET_A_JOUR, D.ENTREPRISE_SE_MET_A_JOUR]) && egal(textes(retourEntreprise), [])
      && P.texteDeLaLigneRemise({ lue: lue2, ...retourEntreprise }).contenu === D.LISTE_MISE_A_JOUR
      && egal(montre({ etat: 'en_route', relecture: RE }), [true, false, false])
      && egal(montre({ etat: 'liste' }), [true, true, true]) && egal(aLaPlace({ etat: 'liste' }), [null, null])
      && ['echec', 'lecture', 'pas_en_base'].every((e) => egal(montre({ etat: e }), [false, false, false]) && egal(aLaPlace({ etat: e }), [null, null]))
      && egal(montre({ etat: 'en_route', lue: null }), [false, false, false]) && egal(aLaPlace({ etat: 'en_route', lue: null }), [null, null]),
    json([montre(ecriture), montre(lectureApres), montre(retourEntreprise)]));
    /* LA PLACE DES PARTIES QUI SE TAISENT (relecture 2 de 2b-1, REL-3) : une
       partie périmée n'est plus RETIRÉE — tout ce qui la suivait remontait
       puis redescendait (le premier bouton de « Votre entreprise » passait
       de y = 400 à 470, liste revenue identique). Elle est GARDÉE
       (`garder`), invisible et cachée à l'accessibilité, sous sa phrase —
       quand une liste sûre existe ; sans liste, rien n'est gardé. Et
       `garder` n'est jamais vrai pour une partie qui se lit. */
    const grille = [];
    ['liste', 'en_route', 'echec', 'lecture', 'pas_en_base'].forEach((etat) => [lue2, null].forEach((lue) => [null, RE, RD, RDE].forEach((relecture) => {
      grille.push(P.ceQueDitLaCarte({ etat, lue, relecture, enLecture: !!relecture }));
    })));
    const incoherents = grille.filter((c) => ['devis', 'entreprise'].some((k) => {
      const x = c.parties[k];
      return x.garder !== (c.montrerLaListe && !x.montrer) || (x.garder ? !x.phrase : x.phrase !== null) || (x.garder && x.montrer);
    }));
    verifier('…REL-3 : une partie qui se tait est GARDÉE (montée invisible, sous sa phrase) quand une liste sûre existe — « Ce devis » '
      + 'pendant une écriture et la lecture qui la suit, les DEUX pendant la relecture qui suit « Mon entreprise » — et JAMAIS sans '
      + 'liste ; `garder` n’est jamais vrai pour une partie qui se lit',
    egal(garde(ecriture), [true, false]) && egal(garde(lectureApres), [true, false]) && egal(garde(retourEntreprise), [true, true])
      && egal(garde({ etat: 'liste' }), [false, false])
      && ['echec', 'lecture', 'pas_en_base'].every((e) => egal(garde({ etat: e }), [false, false]))
      && egal(garde({ etat: 'en_route', lue: null }), [false, false]) && egal(garde({ etat: 'en_route', lue: null, relecture: RDE }), [false, false])
      && grille.length === 40 && incoherents.length === 0,
    json(incoherents.slice(0, 2)));
    verifier('…et ses phrases d’état, dans l’ordre : en route, la phrase EXACTE du contrat EN TÊTE seulement quand aucune liste ne se '
      + 'montre — avec une liste, « Ce devis : la liste se met à jour. » le dit à SA place (REL-3 : une phrase d’en-tête qui disparaissait '
      + 'au retour faisait remonter tout ce qui la suit) ; ce qui n’est pas compté est DIT ; « mise à jour » pour une relecture sans cause '
      + 'seulement ; la relecture qui suit « Mon entreprise », sans liste, « Mise à jour de la liste… » ; sur un brouillon pas en base, ce '
      + 'qu’il porte (ECR-3) ou « Écrivez une première ligne »',
    egal(textes({ etat: 'en_route' }), []) && egal(textes({ etat: 'en_route', lue: null }), [D.LISTE_EN_ROUTE])
      /* la relecture qui suit « Mon entreprise », sans liste à montrer (un
         échec avant) : « Mise à jour de la liste… » en tête, jamais « Des
         changements partent » (relecture 4) ; avec une liste, rien en tête */
      && egal(textes({ etat: 'en_route', lue: null, relecture: RDE }), [D.LISTE_MISE_A_JOUR])
      && egal(textes({ etat: 'en_route', lue: null, relecture: RDE, pasCompte: pc }), [D.LISTE_MISE_A_JOUR, pc])
      && egal(textes({ etat: 'en_route', relecture: RDE }), [])
      && egal(textes({ etat: 'en_route', pasCompte: pc }), [pc]) && egal(textes({ etat: 'en_route', lue: null, pasCompte: pc }), [D.LISTE_EN_ROUTE, pc])
      && egal(textes({ etat: 'en_route', pasCompte: pc }), textes({ etat: 'liste', pasCompte: pc }))
      && egal(textes({ etat: 'liste', pasCompte: pc }), [pc]) && egal(textes({ etat: 'echec', pasCompte: pc }), [pc])
      && egal(textes({ etat: 'liste' }), []) && egal(textes({ etat: 'liste', enLecture: true }), [D.LISTE_MISE_A_JOUR])
      && egal(textes({ etat: 'pas_en_base' }), [D.LISTE_AVANT_LA_PREMIERE_LIGNE])
      && egal(textes({ etat: 'pas_en_base', pasCompte: pcNeuf }), [pcNeuf])
      && egal(textes({ etat: 'lecture', lue: null }), [D.LISTE_EN_LECTURE]),
    json([textes({ etat: 'en_route', pasCompte: pc }), textes({ etat: 'liste', pasCompte: pc })]));
    /* LE RÉGIME DE TVA N'EST PLUS SUIVI PAR LA LISTE (relecture 4 de 2b-1,
       06/11/2026, la décision « simplifier ») : la liste est calculée par la
       BASE, qui lit le régime DANS la base au moment de la lecture — une
       liste lue est toujours juste pour le régime que la base avait alors.
       Ce que le téléphone sait du régime (pas encore lu, en lecture, en
       échec) ne la rend jamais fausse, et le régime de la base ne change que
       par « Mon entreprise », dont la fermeture relit les deux causes. Toute
       la machinerie qui suivait le régime de la liste — une marque de
       l'inconnu, sa normalisation, l'adoption d'un régime arrivé pendant une
       lecture, la décision d'un régime reçu, la comparaison au retour de
       « Mon entreprise », une référence dans l'écran, un régime rangé avec la
       liste, et la dernière liste lue gardée pour les gabarits — est retirée,
       et ses contrôles avec elle (les scénarios S1 à S7, la table de
       décision, les formes figées). « Un régime inconnu ne relit rien et
       n'efface pas une liste juste » (relecture 3, RELIRE-1) devient vrai PAR
       CONSTRUCTION : rien n'écoute plus le régime (vérifié plus bas, sur la
       saisie). Ce contrôle refuse qu'une trace en revienne, dans le code ET
       dans les commentaires des trois fichiers. */
    const RETIRES = ['REGIME_INCONNU', 'regimePourLaListe', 'regimeAdopte', 'decisionDuRegime', 'causesAuRetourDeLEntreprise', 'regimeRef',
      'regimeLu', 'derniereLue', 'ENTREPRISE_A_JOUR_SUR_LA_LIGNE', 'RELECTURE_DE_L_ENTREPRISE', 'liste.regime', 'liste.derniere', 'l.derniere'];
    const traces = ['src/lib/devis.js', 'src/components/PourRemettre.js', 'src/screens/SaisieDevisScreen.js']
      .flatMap((f) => RETIRES.filter((nom) => new RegExp(`(?<![\\w.])${nom.replace(/\./g, '\\.')}\\b`).test(lire(f))).map((nom) => `${f} : ${nom}`));
    verifier('…la machinerie du régime attachée à la liste est RETIRÉE (relecture 4, « simplifier ») : aucun de ses noms n’est exporté par '
      + '`devis.js`, ni écrit — code ou commentaire — dans `devis.js`, `PourRemettre.js` et la saisie ; un régime reçu ne relit donc rien, '
      + 'par construction (l’effet qui l’écoutait n’existe plus, vérifié plus bas)',
    traces.length === 0 && RETIRES.filter((nom) => !nom.includes('.')).every((nom) => !(nom in D)),
    traces.join(' | '));
    const l3 = D.lireMotifsDeRemise([
      { rang: 1, cle: 'devis_client' }, { rang: 6, cle: 'devis_validite' },
      { rang: 101, cle: 'identite' }, { rang: 102, cle: 'conso_mediateur' },
    ], { sections: E.SECTION_DU_MOTIF });
    verifier('…le compte se dit PAR ENDROIT (« ce devis — 2 points · votre entreprise — 2 points ») : les mentions dues à un particulier '
      + 'comptent avec l’entreprise, les AVIS jamais ; `comptesParEndroit` dit aussi combien de points de l’entreprise sont dus à un '
      + 'particulier (D-B)',
    P.phraseDesEndroits(l3) === 'ce devis — 2 points · votre entreprise — 2 points'
    && P.phraseDesEndroits(D.lireMotifsDeRemise([{ rang: 101, cle: 'identite' }], { sections: E.SECTION_DU_MOTIF })) === 'ce devis — aucun point · votre entreprise — 1 point'
    /* plus de forme « mise à jour… » sur la ligne (relecture 4) : une
       option passée est ignorée, et aucun gabarit ne la porte */
    && P.phraseDesEndroits(l3, { relecture: RE }) === P.phraseDesEndroits(l3)
    && D.GABARITS_DE_LA_LIGNE.every((g) => !/votre entreprise — mise à jour/.test(g))
    && egal(P.comptesParEndroit({ comptes: { devis: 1, entreprise: 1, particulier: 1 }, avis: [1, 2, 3] }), { devis: 1, entreprise: 2, dontParticulier: 1 })
    && !/avis/.test(corpsDeFonction(sansCommentairesJs(lire('src/lib/devis.js')), 'comptesParEndroit') || 'avis'), P.phraseDesEndroits(l3));
    /* LE TITRE DE L'ENTREPRISE DIT COMBIEN SONT DUS À UN PARTICULIER
       (décision D-B du propriétaire, 05/11/2026 au soir, relecture ECR-6) :
       on comptait 2 points sous un titre qui en annonçait 5. Les accords,
       FAITS TOURNER ; et UNE seule écriture du compte (`comptesParEndroit`). */
    const tit = (devis, entreprise, particulier) => P.titresDesParties({ comptes: { devis, entreprise, particulier } });
    const corpsTitres = sansEspaces(corpsDeFonction(sansCommentairesJs(lire('src/lib/devis.js')), 'titresDesParties') || '');
    verifier('…les titres de la carte (D-B) : « Votre entreprise — 5 points, dont 3 dus à un particulier », « 1 point, dont 1 dû », « 2 points, '
      + 'dont 1 dû » ; sans point dû à un particulier, « Votre entreprise — N points » ; « Ce devis — N points » — et le compte vient de '
      + '`comptesParEndroit`, une seule écriture',
    tit(0, 2, 3).entreprise === 'Votre entreprise — 5 points, dont 3 dus à un particulier'
    && tit(1, 0, 1).entreprise === 'Votre entreprise — 1 point, dont 1 dû à un particulier'
    && tit(0, 1, 1).entreprise === 'Votre entreprise — 2 points, dont 1 dû à un particulier'
    && tit(0, 0, 2).entreprise === 'Votre entreprise — 2 points, dont 2 dus à un particulier'
    && tit(0, 2, 0).entreprise === 'Votre entreprise — 2 points' && tit(0, 1, 0).entreprise === 'Votre entreprise — 1 point'
    && tit(0, 0, 0).entreprise === 'Votre entreprise — aucun point'
    && tit(0, 0, 0).devis === 'Ce devis — aucun point' && tit(1, 0, 0).devis === 'Ce devis — 1 point' && tit(3, 0, 0).devis === 'Ce devis — 3 points'
    && /const c = comptesParEndroit\(lue\);/.test(corpsTitres) && !/\.comptes\b/.test(corpsTitres),
    json([tit(0, 2, 3), tit(1, 0, 1), tit(0, 1, 1)]));
    const tva = (E.MOTIFS.find((m) => m.cle === 'conso_tva_intra') || {}).phrase || '';
    const pp = P.premierePhrase(tva);
    /* Une phrase COURTE du contrat : depuis la relecture du 05/11, celles du
       lieu (203 caractères) et de la validité (216) dépassent le seuil et
       montrent leur première phrase ; celle du délai (141) reste entière. */
    const court = P.premierePhrase(D.MOTIFS_DEVIS.devis_delai.phrase);
    verifier('…« Lire la suite » au-delà de 200 caractères : la phrase de la TVA (plus de 600) montre sa première phrase ; une phrase courte se '
      + 'montre ENTIÈRE ; « L. 111-1 » ne coupe pas',
    tva.length > 600 && pp.suite === true && pp.debut.length < tva.length && tva.startsWith(pp.debut) && /[.!?]$/.test(pp.debut)
    && court.suite === false && P.SEUIL_LIRE_LA_SUITE === 200
    && P.premierePhrase(`${'x'.repeat(190)} chez M. Dupont (code de la consommation, L. 111-1). Fin ici.`).debut.endsWith('L. 111-1).'),
    pp.debut.slice(0, 120));
    const act = (endroit, opts = {}) => P.actionDuPoint({ endroit }, opts);
    verifier('…`actionDuPoint`, FAIT TOURNER : un bouton par endroit connu — le client, le délai, le lieu, la validité, la nature, l’acompte, '
      + 'la réduction, la ligne QUI EXISTE, un poste SI l’on peut chiffrer, « Mon entreprise » SI la section existe — et AUCUN sinon (une '
      + 'cible qui ne mène nulle part est pire que pas de cible)',
    act({ endroit: 'client' }).libelle === 'Choisir le client' && act({ endroit: 'delai' }).libelle === 'Écrire le délai'
    && act({ endroit: 'lieu' }).libelle === 'Écrire le lieu' && act({ endroit: 'conditions', champ: 'validite' }).libelle === 'Choisir la validité'
    && act({ endroit: 'conditions', champ: 'nature' }).libelle === 'Choisir : acompte ou arrhes'
    && act({ endroit: 'conditions', champ: 'acompte' }).libelle === 'Corriger l’acompte'
    && act({ endroit: 'conditions', champ: 'reduction' }).libelle === 'Corriger la réduction'
    && act({ endroit: 'ligne', ligneId: 'L' }, { ligneExiste: (id) => id === 'L' }).libelle === 'Ouvrir cette ligne'
    && act({ endroit: 'ligne', ligneId: 'M' }, { ligneExiste: (id) => id === 'L' }) === null
    && act({ endroit: 'lignes' }, { chiffrerPossible: true }).libelle === 'Ajouter un poste' && act({ endroit: 'lignes' }) === null
    && act({ endroit: 'entreprise', section: 'tva' }).libelle === 'Compléter dans « Mon entreprise »'
    && act({ endroit: 'entreprise', section: null }) === null && act({ endroit: 'autre' }) === null && P.actionDuPoint({ endroit: null }) === null);
    /* DES ÉTIQUETTES PARLÉES DISTINCTES (relecture de 2b-1, ECR-5) : les cinq
       points de l'entreprise portaient tous « Compléter dans « Mon
       entreprise » », les deux points ramenés « Corriger dans les
       conditions » — au rotor « Boutons », rien ne disait lequel corrige
       quoi. L'étiquette COMMENCE par le libellé affiché (Contrôle vocal), y
       ajoute le NOM de la section visée — jamais la phrase entière (672
       caractères pour la TVA). Chaque motif d'`emetteur.js` qui a une
       section, FAIT TOURNER. */
    const ptsEntreprise = E.MOTIFS.filter((m) => m.section).map((m) => {
      const l = D.lireMotifsDeRemise([{ rang: 101, cle: m.cle, phrase: m.phrase, nature: 'loi' }], { sections: E.SECTION_DU_MOTIF });
      const pt = [...l.parties.entreprise, ...l.parties.particulier][0];
      return { cle: m.cle, section: m.section, a: P.actionDuPoint(pt) };
    });
    /* SECONDE MESURE (05/11, au navigateur) : le premier jet regroupait
       par SECTION, et la liste du « Muret de clôture » montrait deux fois
       « … : Vos conditions » (modalités de paiement, réclamations) — au
       vert. La propriété se juge par MOTIF : deux motifs de l'entreprise ne
       partagent jamais une étiquette, hors des deux paires d'adresses, qui
       mènent au même champ et qu'`emetteur.js` ne rend jamais ensemble. */
    const PAIRES = [['adresse_etablissement', 'conso_adresse_etablissement'], ['adresse_siege', 'conso_adresse_siege']];
    const memePaire = (a, b) => PAIRES.some((p) => p.includes(a) && p.includes(b));
    const parEtiquette = new Map();
    ptsEntreprise.forEach(({ cle, a }) => { if (a) parEtiquette.set(a.aDire, [...(parEtiquette.get(a.aDire) || []), cle]); });
    const partagees = [...parEtiquette.entries()].filter(([, cles]) => cles.length > 1
      && !(cles.length === 2 && memePaire(cles[0], cles[1])));
    const sectionsMotifs = E.MOTIFS.filter((m) => m.section).map((m) => m.section);
    const sectionsPartagees = new Set(sectionsMotifs.filter((x, i) => sectionsMotifs.indexOf(x) !== i));
    const attendue = (cle, section) => {
      const base = `Compléter dans « Mon entreprise » : ${D.NOM_DES_SECTIONS[section]}`;
      return sectionsPartagees.has(section) ? `${base}, ${D.CHAMP_DU_MOTIF[cle]}` : base;
    };
    const fautifs = ptsEntreprise.filter(({ cle, section, a }) => !a || !a.aDire.startsWith(`${a.libelle} : `)
      || a.aDire !== attendue(cle, section) || a.aDire.length > 90).map((x) => x.cle);
    /* Aucune entrée de `CHAMP_DU_MOTIF` pour un motif qui n'existe pas, ou
       dont la section n'est visée par aucun autre ; et le champ nommé est
       celui de l'ÉCRAN quand c'en est un — son libellé dans « Mon
       entreprise », à la majuscule près. */
    const orphelins = Object.keys(D.CHAMP_DU_MOTIF).filter((k) => {
      const m = E.MOTIFS.find((x) => x.cle === k);
      return !m || !sectionsPartagees.has(m.section);
    });
    const ficheLibelles = lire('src/components/FicheEmetteur.js');
    const identiteLibelles = lire('src/components/IdentiteEntreprise.js');
    /* Une entrée absente de `CHAMP_DU_MOTIF` doit faire ROUGIR cette
       vérification, pas PLANTER le contrôle (banc indépendant de 2b-1,
       05/11/2026 au soir : vider ou amputer le dictionnaire levait un
       TypeError ici, et les vérifications qui suivent n'étaient plus
       lancées — « un contrôle qui plante ne vérifie rien »). */
    const majuscule = (t) => (typeof t === 'string' && t.length > 0
      ? t.charAt(0).toUpperCase() + t.slice(1) : '« entrée absente de CHAMP_DU_MOTIF »');
    const champsEcran =['adresse_etablissement', 'adresse_siege', 'conso_telephone', 'conso_email',
      'conso_modalites_paiement', 'conso_modalites_execution', 'conso_reclamations'];
    const champsAbsents = champsEcran.filter((k) => !ficheLibelles.includes(`<Text style={s.label}>${majuscule(D.CHAMP_DU_MOTIF[k])}</Text>`))
      .concat(identiteLibelles.includes(`libelle="${majuscule(D.CHAMP_DU_MOTIF.conso_tva_intra)}"`) ? [] : ['conso_tva_intra']);
    const ptCond = (cle) => P.actionDuPoint({ cle, endroit: { endroit: 'entreprise', section: 'conditions' } });
    verifier('…chaque bouton « Compléter dans « Mon entreprise » » DIT sa section à VoiceOver (« … : Capital social », « … : TVA »), et son '
      + 'CHAMP quand la section en porte plusieurs (« … : Vos conditions, modalités de paiement ») ; commence par son libellé affiché, '
      + 'jamais la phrase du point ; deux motifs, deux étiquettes — hors des deux paires d’adresses ; la ligne fautive dit sa désignation',
    fautifs.length === 0 && partagees.length === 0 && orphelins.length === 0 && champsAbsents.length === 0 && parEtiquette.size >= 15
      && act({ endroit: 'entreprise', section: 'capital' }).aDire === 'Compléter dans « Mon entreprise » : Capital social'
      && act({ endroit: 'entreprise', section: 'contact' }).aDire === 'Compléter dans « Mon entreprise » : Pour vous joindre'
      && act({ endroit: 'entreprise', section: 'tva' }).aDire === 'Compléter dans « Mon entreprise » : TVA'
      && ptCond('conso_modalites_paiement').aDire === 'Compléter dans « Mon entreprise » : Vos conditions, modalités de paiement'
      && ptCond('conso_reclamations').aDire === 'Compléter dans « Mon entreprise » : Vos conditions, réclamations'
      && ptCond('conso_reclamations').libelle === 'Compléter dans « Mon entreprise »'
      && act({ endroit: 'ligne', ligneId: 'L' }, { ligneExiste: () => true, designation: 'Dalle béton' }).aDire === 'Ouvrir cette ligne : « Dalle béton »'
      && act({ endroit: 'conditions', champ: 'acompte' }).aDire === 'Corriger l’acompte'
      && act({ endroit: 'conditions', champ: 'reduction' }).aDire === 'Corriger la réduction'
      && act({ endroit: 'client' }).aDire === 'Choisir le client',
    `${fautifs.join(', ')} | partagées ${json(partagees)} | orphelins ${json(orphelins)} | absents ${json(champsAbsents)} | ${parEtiquette.size}`);
    /* …ET LES NOMS DES SECTIONS SONT CEUX DE L'ÉCRAN : une COPIE dans
       `devis.js` (il n'importe pas les écrans), comparée ici aux titres de
       `FicheEmetteur.js` (`<Section ancre="…" titre="…">`) et au bloc
       d'identité (« Votre entreprise », `IdentiteEntreprise.js`). */
    const ficheE = lire('src/components/FicheEmetteur.js');
    const titresEcran = Object.fromEntries([...ficheE.matchAll(/<Section ancre="([a-z_]+)" titre="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    const identiteE = sansCommentairesJs(lire('src/components/IdentiteEntreprise.js'));
    verifier('…les noms des sections (`NOM_DES_SECTIONS`, devis.js) sont EXACTEMENT les titres de « Mon entreprise » : ceux de '
      + '`FicheEmetteur.js`, et « Votre entreprise » pour le bloc d’identité ; chaque section d’un motif a le sien',
    egal(Object.entries({ ...titresEcran, entreprise: 'Votre entreprise' }).sort(), Object.entries(D.NOM_DES_SECTIONS).sort())
      && /<Text style=\{s\.titre\}>Votre entreprise<\/Text>/.test(identiteE)
      && E.MOTIFS.filter((m) => m.section).every((m) => typeof D.NOM_DES_SECTIONS[m.section] === 'string'),
    `${json(titresEcran)} | ${json(D.NOM_DES_SECTIONS)}`);
  }
  /* « RIEN NE MANQUE » N'EST DIT QUE SUR UNE LISTE LUE, et toujours avec
     « Pas encore vérifié » (critique D2) : la carte ne montre les parties
     que si `lue` existe ET que l'état est `liste` ou `en_route` — jamais sur
     un échec, jamais sur un brouillon pas en base. ET CHAQUE PARTIE NE SE LIT
     QUE SI ELLE N'EST PAS PÉRIMÉE (relecture de 2b-1, ECR-1) : « Ce devis »
     dans `<Partie partie={aMontrer.devis}>`, « Votre entreprise » ET ses
     mentions dues à un particulier dans `<Partie partie={aMontrer.entreprise}>`.
     Les titres viennent de `titresDesParties` (D-B). */
  const prE = sansEspaces(PR);
  const brancheEntreprise = (/<Partie partie=\{aMontrer\.entreprise\}>[\s\S]*?<\/Partie>/.exec(prE) || [''])[0];
  verifier('la carte ne dit « rien ne manque » QUE dans la partie « Ce devis » d’une liste LUE (`montrer`, décidé par `ceQueDitLaCarte` : '
    + '`lue` ET l’état `liste` ou `en_route`), DANS `<Partie partie={aMontrer.devis}>` — qui ne la laisse lire que si elle n’est PAS '
    + 'périmée (ECR-1, REL-3) —, UNE fois, immédiatement suivi de « Pas encore vérifié » ; les mentions dues à un particulier vivent DANS '
    + 'la partie de l’entreprise ; ses phrases d’état sont celles de `ceQueDitLaCarte`, et aucune n’est écrite dans le composant',
  /const \{ phrases, montrerLaListe: montrer, parties: aMontrer \} = ceQueDitLaCarte\(\{ etat, lue, enLecture, pasCompte, relecture, \}\); const parties = montrer \? lue\.parties : null; const titres = montrer \? titresDesParties\(lue\) : null;/.test(prE)
    && /\{phrases\.map\(\(p\) => \( <Text key=\{p\.texte\}/.test(prE)
    && !/LISTE_EN_ROUTE|LISTE_AVANT_LA_PREMIERE_LIGNE|LISTE_EN_LECTURE|LISTE_MISE_A_JOUR|CE_DEVIS_SE_MET_A_JOUR|ENTREPRISE_SE_MET_A_JOUR|ceQueLaListeNeComptePas\(|\bpoints\(/.test(PR)
    && (prE.match(/\{RIEN_NE_MANQUE_POUR_CE_DEVIS\}/g) || []).length === 1
    && prE.includes('{!!parties && ( <> <Partie partie={aMontrer.devis}> <Text style={s.titre} accessibilityRole="header">{titres.devis}</Text> '
      + '{parties.devis.length === 0 ? ( <View style={s.rien}> <Text style={s.rienTexte}>{RIEN_NE_MANQUE_POUR_CE_DEVIS}</Text> '
      + '<Text style={s.aide}>{PAS_ENCORE_VERIFIE}</Text> </View> ) : parties.devis.map(rendrePoint)} </Partie> '
      + '<Partie partie={aMontrer.entreprise}> <Text style={s.titre} accessibilityRole="header">{titres.entreprise}</Text> '
      + '{parties.entreprise.map(rendrePoint)} {parties.particulier.length > 0 && ( <> <Text style={s.sousTitre} accessibilityRole="header">'
      /* 2b-2 (cahier §3.6) : la phrase est choisie par la réponse que la
         BASE a vue dans la même photo que la liste (`reponseVue`), jamais par
         celle de l'écran ; inconnue, la phrase de prudence (fait tourner
         plus haut, `phraseDesMentionsParticulier`). */
      + 'Mentions dues à un particulier</Text> <Text style={s.aide}>{phraseDesMentionsParticulier(reponseVue)}</Text> '
      + '{parties.particulier.map(rendrePoint)} </> )} </Partie> </> )}')
    && /parties\.particulier\.map\(rendrePoint\)/.test(brancheEntreprise)
    && (prE.match(/parties\.particulier\.map\(rendrePoint\)/g) || []).length === 1
    && (prE.match(/\{titres\.(?:devis|entreprise)\}/g) || []).length === 2
    && (prE.match(/<Partie /g) || []).length === 2 && !/aMontrer\.(?:devis|entreprise)\.montrer/.test(prE),
  brancheEntreprise.slice(0, 200) || prE.slice(prE.indexOf('{!!parties'), prE.indexOf('{!!parties') + 300));
  /* …ET UNE PARTIE QUI SE TAIT GARDE SA PLACE, SANS SE LIRE (relecture 2 de
     2b-1, REL-3) : `Partie` monte TOUJOURS ses enfants dans le MÊME arbre
     (la partie ne se démonte pas en se relisant) ; gardée, ils sont
     INVISIBLES (opacité nulle, aucun toucher : `s.cachee`) et CACHÉS à
     l'accessibilité — `aria-hidden` (le navigateur, et `react-native` le
     traduit), `accessibilityElementsHidden` (VoiceOver),
     `importantForAccessibility="no-hide-descendants"` (TalkBack) —, et sa
     phrase est posée PAR-DESSUS, en COUCHE de la même superposition
     (`s.superpose` : une rangée qui prend la hauteur de son élément le plus
     haut ; `s.couche` : toute la largeur ; `s.coucheSuivante` : ramenée sous
     la première par une marge de −100 %). En position absolue, elle
     débordait sur ce qui suit quand elle était plus haute que la partie
     gardée (banc de la relecture 2, point 2 ; relecture 3 : « Votre
     entreprise — aucun point » avec un texte agrandi) ; en couche, la place
     est la plus grande des deux. La partie gardée est toujours la PREMIÈRE
     couche : le même arbre, lue ou gardée. Jamais estompée (ECR-1) :
     `s.cachee` vaut une opacité NULLE. Sans liste sûre, rien n'est monté :
     `{!!parties && …}` (vérifié au-dessus). Le corps ENTIER. */
  const corpsPartie = sansEspaces(corpsDeFonction(PR, 'Partie') || '');
  verifier('…REL-3 : `Partie` garde la place de la partie qui se tait — ses enfants restent montés, invisibles (`opacity: 0`, '
    + '`pointerEvents: \'none\'`) et cachés à VoiceOver et TalkBack (`aria-hidden`, `accessibilityElementsHidden`, '
    + '`importantForAccessibility="no-hide-descendants"`), jamais retirés ni estompés, et sa phrase est posée par-dessus, en COUCHE : la '
    + 'place est la plus grande des deux (elle ne déborde plus sur ce qui suit, relecture 3)',
  corpsPartie === "{ const garder = !!partie.garder; return ( <View style={s.superpose}> <View style={[s.partie, s.couche, garder && s.cachee]} "
    + "aria-hidden={garder} accessibilityElementsHidden={garder} importantForAccessibility={garder ? 'no-hide-descendants' : 'auto'} > "
    + "{children} </View> {garder && ( <View style={[s.couche, s.coucheSuivante]}> <Text style={s.seRelit} accessibilityRole=\"header\">"
    + "{partie.phrase}</Text> </View> )} </View> ); }"
    && /cachee: \{ opacity: 0, pointerEvents: 'none' \},/.test(prE) && /partie: \{ gap: S\.sm \},/.test(prE)
    && /superpose: \{ flexDirection: 'row', alignItems: 'flex-start' \},/.test(prE) && /couche: \{ width: '100%' \},/.test(prE)
    && /coucheSuivante: \{ marginLeft: '-100%' \},/.test(prE) && !/parDessus|position: 'absolute', top: 0/.test(prE)
    && (prE.match(/function Partie\(/g) || []).length === 1,
  corpsPartie.slice(0, 300));
  /* …ET SA PHRASE EST POSÉE À LA PLACE DU TITRE QU'ELLE REMPLACE (banc de la
     relecture 2 de 2b-1, C10). Posée par-dessus la partie gardée (`top: 0`),
     elle ne tombe sur le titre que si elle porte la MÊME marge du haut que
     lui : sans la sienne, elle montait de 16 points au-dessus de la place
     du titre, et rien ne le voyait. La position elle-même est mesurée au
     navigateur (mesure-devis, REL-3). */
  const margeHaut = (nom) => ((new RegExp(`\\b${nom}: \\{[^}]*?\\bmarginTop: ([^,}]+)`).exec(prE) || [])[1] || null);
  verifier('…et la phrase d’une partie qui se relit est posée À LA PLACE du titre qu’elle remplace : `seRelit` porte la même marge du haut '
    + 'que `titre`', margeHaut('seRelit') !== null && margeHaut('seRelit').trim() === (margeHaut('titre') || '').trim(),
  `${margeHaut('seRelit')} / ${margeHaut('titre')}`);
  /* AUCUN « RIEN NE MANQUE » ÉCRIT EN DUR dans les écrans du devis : la seule
     phrase permise est la constante, et une phrase qui le NIE (« ce n'est
     pas que rien ne manque »). */
  const enDur = ['src/components/PourRemettre.js', ...Object.values(ECRANS_DEVIS), 'src/components/ConditionsDevis.js', 'src/OpusApp.js', ...ECRANS_2B2]
    .flatMap((f) => [...sansCommentairesJs(lireSiExiste(f) || '').matchAll(/(['"`])((?:(?!\1)[^\\]|\\.)*?rien ne manque(?:(?!\1)[^\\]|\\.)*?)\1/gi)]
      .filter((m) => !/pas que rien ne manque/i.test(m[2])).map((m) => `${f} : ${m[2].slice(0, 80)}`));
  verifier('…et aucun écran n’écrit « rien ne manque » en dur, sauf pour le NIER (« ce n’est pas que rien ne manque »)', enDur.length === 0,
    enDur.join(' | '));
  /* …NI EN MORCEAUX, NI EN TEXTE JSX (trou trouvé par le banc du lot 2b-1,
     P14) : `'Rien ne ' + 'manque'`, `{'Rien ne '}manque` ou `<Text>Rien ne
     manque</Text>` échappaient à la lecture chaîne par chaîne. Le code, sans
     commentaires, est relu une seconde fois une fois les concaténations
     recollées et les guillemets, accolades et `$` retirés : la phrase ne
     peut plus y apparaître que pour être NIÉE. Les noms de constantes
     (`RIEN_NE_MANQUE_…`) ne correspondent pas : le tiret bas n'est pas un
     blanc. */
  const recolle = (c) => c
    .replace(/(['"`])\s*\+\s*(['"`])/g, '')
    .replace(/\$\{\s*(['"`])/g, '').replace(/(['"`])\s*\}/g, '')
    .replace(/[{}'"`$]/g, ' ');
  const enMorceaux = ['src/components/PourRemettre.js', ...Object.values(ECRANS_DEVIS), 'src/components/ConditionsDevis.js', 'src/OpusApp.js',
    ...ECRANS_2B2]
    .flatMap((f) => [...recolle(sansCommentairesJs(lireSiExiste(f) || '')).matchAll(/(.{0,12})rien\s*ne\s*manque/gi)]
      .filter((m) => !/pas\s+que\s*$/i.test(m[1])).map((m) => `${f} : …${sansEspaces(m[0])}`));
  verifier('…ni en morceaux recollés (`\'Rien ne \' + \'manque\'`), ni en texte JSX : relu concaténations recollées, la phrase n’apparaît que NIÉE',
    enMorceaux.length === 0, enMorceaux.join(' | '));
  const ligne = sansEspaces(corpsDeFonction(PR, 'LigneRemise') || '');
  verifier('la LIGNE (haut et bas) dit ce que décide `texteDeLaLigneRemise` (fait tourner plus haut), et rien d’autre : aucune phrase '
    + 'ni aucun compte écrit dans le composant ; `ouvrir` ouvre la carte, `reessayer` RELIT, sinon ce n’est PAS une cible',
  /const dit = texteDeLaLigneRemise\(\{ etat, lue, enLecture, erreurReessayable, erreurPhrase, pasCompte, relecture, renvoi, \}\); const \{ contenu, compte, gabarits, aDire \} = dit; let action = null; if \(dit\.action === 'ouvrir'\) action = onOuvrir; else if \(dit\.action === 'reessayer'\) action = onReessayer;/.test(ligne)
    && !/phraseDesEndroits|LISTE_|MISE_A_JOUR|\bpoints\(/.test(ligne) && /if \(!action\) \{ return <View/.test(ligne)
    /* LA PHRASE ET LE DÉCOMPTE (décision D-A), le décompte à la ligne ; ET
       LES GABARITS (relecture 2 de 2b-1, REL-1 ; D-A bis, 06/11) : quand
       `texteDeLaLigneRemise` en rend, CHACUN est posé DANS LE FLUX, en
       couche d'une même superposition (`s.superpose` : une rangée, qui prend
       la hauteur de son élément le PLUS HAUT ; `s.couche` : toute la
       largeur ; `s.coucheSuivante` : ramenée sous la première par une marge
       de −100 %) — c'est le plus grand qui donne la hauteur —, invisible
       (`s.gabarit` : opacité nulle, aucun toucher) et caché à VoiceOver et
       TalkBack (`aria-hidden`, `accessibilityElementsHidden`,
       `importantForAccessibility`) ; et le texte LU est la DERNIÈRE couche,
       posé par-dessus : il ne peut ni déborder ni chevaucher ce qui suit,
       même agrandi dans les réglages du téléphone. Rien n'est coupé :
       aucun `numberOfLines` dans cette branche (le texte lu est l'un des
       gabarits ou composé de leurs pièces les plus larges, vérifié plus haut). Sans gabarit,
       deux lignes réservées, comme avant. Plus aucune « troisième ligne »
       réservée : c'était elle qui sautait (92 → 74 points). */
    && ligne.includes('const dit = texteDeLaLigneRemise({ etat, lue, enLecture, erreurReessayable, erreurPhrase, pasCompte, relecture, '
      + 'renvoi, }); const { contenu, compte, gabarits, aDire } = dit;')
    /* …et elle ne reçoit plus la dernière liste lue (relecture 4) : les
       gabarits n'en dépendent plus */
    && !/\bderniere\b/.test(sansCommentairesJs(corpsDeFonction(PR, 'LigneRemise') || ''))
    /* …et SANS `renvoi`, elle ne réserve RIEN de plus que « pas compté »
       (banc de la relecture 5, N10, pour l'ancien `garder`) : un
       `renvoi = true` par défaut passait tout — la saisie le donne
       toujours, mais le prochain appelant qui l'oublierait réserverait la
       place pour toujours, et le balayage de `mesure-devis` ne fait que
       NOTER la hauteur ordinaire de son témoin. */
    && /export function LigneRemise\(\{[^}]*\brelecture = null, renvoi = false, onOuvrir, onReessayer,\s*\}\)/.test(sansCommentairesJs(PR))
    && !/\bgarder\b/.test(sansCommentairesJs(corpsDeFonction(PR, 'LigneRemise') || ''))
    && ligne.includes("const styleTexte = variante === 'bas' ? s.ligneTexteBas : s.ligneTexte; const texte = compte ? `${contenu}\\n${compte}` : contenu;")
    && ligne.includes('{gabarits ? ( <View style={s.superpose}> {gabarits.map((g, i) => ( <View key={`gabarit-${i}`} '
      + 'style={[s.couche, i > 0 && s.coucheSuivante, s.gabarit]} aria-hidden accessibilityElementsHidden '
      + 'importantForAccessibility="no-hide-descendants" > <Text style={styleTexte}>{g}</Text> </View> ))} '
      + '<View style={[s.couche, s.coucheSuivante]}> <Text style={styleTexte}>{texte}</Text> </View> </View> ) : '
      + '<Text style={styleTexte} numberOfLines={3}>{texte}</Text>}')
    && (ligne.match(/numberOfLines/g) || []).length === 1 && !/\blignes\b|trois/.test(ligne) && !/troisLignes/.test(PR)
    && /gabarit: \{ opacity: 0, pointerEvents: 'none' \},/.test(prE)
    && /superpose: \{ flexDirection: 'row', alignItems: 'flex-start' \},/.test(prE) && /couche: \{ width: '100%' \},/.test(prE)
    && /coucheSuivante: \{ marginLeft: '-100%' \},/.test(prE) && !/\bgabarit\b(?!s|-|:| \?)/.test(ligne.replace(/s\.gabarit\b/g, ''))
    && /minHeight: 2 \* interligne\(T\.courant\),/.test(prE) && /minHeight: 2 \* interligne\(T\.petit\),/.test(prE), ligne.slice(0, 300));
  verifier('…et la carte, en échec, propose « Liste non lue — Réessayer » (`onReessayer`), sans liste dessous',
    /\{etat === 'echec' && \( <View style=\{s\.echec\}> \{erreurReessayable \? \( <Pressable onPress=\{onReessayer\}[^]*?\{LISTE_NON_LUE\}/.test(prE));
  /* UN BOUTON PAR POINT : chaque point de chaque partie est rendu par
     `rendrePoint`, qui pose SON action (`onAgir(point)`). */
  verifier('chaque point des trois parties est rendu par `rendrePoint`, et chacun porte SON bouton (`onAgir(point)`) — les avis à part, '
    + 'jamais comptés', /parties\.entreprise\.map\(rendrePoint\)/.test(prE) && /parties\.particulier\.map\(rendrePoint\)/.test(prE)
    && /parties\.devis\.map\(rendrePoint\)/.test(prE) && /onPress=\{\(\) => onAgir\(point\)\}/.test(prE)
    && /action=\{actionDuPoint\(p, \{ chiffrerPossible, ligneExiste, designation \}\)\}/.test(prE)
    /* L'ÉTIQUETTE PARLÉE DU BOUTON est celle d'`actionDuPoint` (ECR-5) :
       le libellé ET sa section, jamais le libellé seul pour tous. */
    && /accessibilityLabel=\{action\.aDire \|\| action\.libelle\}/.test(prE) && !/accessibilityLabel=\{action\.libelle\}/.test(prE)
    && /\{avis\.map\(\(a\) => <Text key=\{a\.cle\}/.test(prE)
    && /const titres = montrer \? titresDesParties\(lue\) : null;/.test(prE) && !/comptesParEndroit/.test(PR)
    && (prE.match(/\bavis\.length\b/g) || []).length === 1 && /etat !== 'pas_en_base' && avis\.length > 0 && \(/.test(prE));
  /* …ET CHAQUE POINT DIT CE QU'IL DOIT DIRE (banc indépendant de 2b-1,
     05/11/2026 au soir) : rien ne relisait le corps du point. « Lire la
     suite » qui ne dépliait plus la phrase (`ouvert` retiré), passait tout ;
     la désignation de la ligne fautive retirée de sous son point n'était
     refusée que PAR HASARD, par le cliquet du linter (une variable devenue
     inutilisée) — gardée en usage (`{!!designation && null}`), elle passait
     aussi. Le corps du point, ENTIER, ligne à ligne. */
  const corpsPoint = sansEspaces(corpsDeFonction(PR, 'Point') || '');
  verifier('…et chaque point dit ce qu’il doit dire : la phrase ENTIÈRE une fois « Lire la suite » touché (son début avant), la '
    + 'désignation de la ligne fautive écrite sous lui, « Lire la suite » / « Réduire » qui bascule',
  corpsPoint.includes('const [ouvert, setOuvert] = useState(false); const { debut, suite } = premierePhrase(point.phrase);')
    && corpsPoint.includes('<Text style={s.phrase}>{ouvert || !suite ? point.phrase : debut}</Text>')
    && corpsPoint.includes('{!!designation && <Text style={s.designation} numberOfLines={2}>{`« ${designation} »`}</Text>}')
    && corpsPoint.includes('{suite && ( <Pressable onPress={() => setOuvert((o) => !o)}')
    && corpsPoint.includes("accessibilityLabel={ouvert ? 'Réduire ce point' : 'Lire la suite de ce point'} accessibilityState={{ expanded: ouvert }}")
    && corpsPoint.includes("<Text style={s.suiteTexte}>{ouvert ? 'Réduire' : 'Lire la suite'}</Text>")
    && corpsPoint.split('point.phrase').length - 1 === 2 && corpsPoint.split('designation').length - 1 === 3,
  corpsPoint.slice(0, 300));

  const SA = ECR.saisie;
  const saE = sansEspaces(SA);
  const lireListe = sansEspaces(corpsFleche(SA, 'const lireLaListe = (cause = null) =>'));
  verifier('la saisie ne demande JAMAIS la liste d’un brouillon qui n’est pas en base (la fonction rendrait OP027), et garde la réponse '
    + 'sous la MÊME garde que les totaux : la génération relevée AVANT l’appel, une réponse partie avant une écriture ÉCARTÉE',
  /^=> \{ const f = fileRef\.current; if \(!f \|\| !f\.devisEnBase\(\)\) return;/.test(lireListe)
    && lireListe.indexOf('const g = f.generation();') > 0 && lireListe.indexOf('const g = f.generation();') < lireListe.indexOf('api.motifsRefusRemise(f.devisId())')
    && /if \(g !== f\.generation\(\)\) \{/.test(lireListe)
    /* 2b-2 (cahier §3.6) : la liste range avec elle la réponse « à quel
       titre » que la base a vue DANS LA MÊME PHOTO — celle des derniers
       totaux relus, s'ils l'ont été sous la génération relevée au départ ;
       sinon `undefined` (la phrase de prudence). Un échec garde l'ancienne. */
    && lireListe.includes('const g = f.generation(); const t = totauxRef.current; const vue = t && t.demande && '
      + 'totauxGenRef.current === g ? pourQuiValable(t.demande) : undefined;')
    && lireListe.includes('if (!r.erreur) reponseVueRef.current = vue; setListe((l) => (r.erreur ? { motifs: null, erreur: r.erreur, '
      + 'enLecture: false, relecture: AUCUNE_RELECTURE, reponseVue: l.reponseVue, } : { motifs: lues, erreur: null, enLecture: false, '
      + 'relecture: AUCUNE_RELECTURE, reponseVue: vue, }));')
    && lireListe.includes('const lues = !r.erreur && Array.isArray(r.motifs) ? r.motifs : null;'),
  lireListe.slice(0, 160));
  /* …ET LA GARDE ÉCARTE VRAIMENT (relecture de 2b-1, PAR-4) : le contrôle
     voyait le `if`, pas son effet — sans le `return;`, une liste lue AVANT
     une écriture partie pendant la lecture était posée comme liste sûre.
     Le bloc ENTIER, de la garde à `setListe`, avec son `return;` entre les
     deux ; et la relecture qui suit ne repart que si aucune autre lecture
     n'est partie depuis. */
  verifier('…la garde de génération de `lireLaListe` ÉCARTE la réponse : le bloc entier — attendre la file, relire si cette lecture est '
    + 'toujours la dernière, puis `return;` — se tient ENTRE la garde et `setListe`',
  lireListe.includes('if (g !== f.generation()) { f.attendre(DELAI_ECRITURE).then(() => { if (monte.current && n === lectureListe.current) '
    + 'lireLaListe(); }); return; } const lues = !r.erreur && Array.isArray(r.motifs) ? r.motifs : null; if (!r.erreur) '
    + 'reponseVueRef.current = vue; setListe((l) => (r.erreur ? {')
    && (lireListe.match(/setListe\(\(l\) => \(r\.erreur/g) || []).length === 1
    && lireListe.indexOf('return; } const lues') > lireListe.indexOf('if (g !== f.generation())'),
  lireListe.slice(lireListe.indexOf('if (g !=='), lireListe.indexOf('if (g !==') + 220));
  /* …ET UNE RÉPONSE PÉRIMÉE N'EST JAMAIS POSÉE (banc indépendant de 2b-1,
     05/11/2026 au soir) : le contrôle tenait la garde de GÉNÉRATION, pas
     celle qui la précède. Sans `n !== lectureListe.current`, la réponse
     d'une lecture qu'une autre a remplacée (un « Réessayer », une relecture
     après une écriture, le retour de « Mon entreprise ») était posée si elle
     revenait la DERNIÈRE — une liste plus ancienne par-dessus une plus
     récente —, et rien ne rougissait. La première ligne du traitement de la
     réponse, ENTIÈRE, avant la garde de génération. */
  verifier('…et la réponse d’une lecture PÉRIMÉE (une autre lecture est partie depuis, l’écran est démonté, la file a changé) n’est '
    + 'jamais posée : `if (!monte.current || n !== lectureListe.current || fileRef.current !== f) return;` ouvre le traitement de la réponse, '
    + 'avant la garde de génération',
  lireListe.includes('.then((r) => { if (!monte.current || n !== lectureListe.current || fileRef.current !== f) return; if (g !== f.generation()) {')
    && lireListe.indexOf('const n = lectureListe.current;') > 0 && lireListe.indexOf('const n = lectureListe.current;') < lireListe.indexOf('api.motifsRefusRemise(')
    && (lireListe.match(/lectureListe\.current \+= 1;/g) || []).length === 1,
  lireListe.slice(lireListe.indexOf('.then((r)'), lireListe.indexOf('.then((r)') + 160));
  /* CE QUE LA LECTURE RELIT (relecture de 2b-1, ECR-1) : la cause, notée en
     la lançant — `'devis'` après une écriture du devis (la relecture des
     totaux), `'entreprise'` au retour de « Mon entreprise » —, S'AJOUTE
     tant qu'aucune liste n'est revenue, et s'efface au retour, liste ou
     échec. L'état et les deux composants la reçoivent. */
  verifier('…la lecture NOTE ce qu’elle relit : `\'devis\'` après une écriture confirmée, `\'entreprise\'` au retour de « Mon entreprise » ; '
    + 'les causes s’ajoutent jusqu’au retour, et s’effacent au retour (liste ou échec) ; l’état, la ligne et la carte la reçoivent',
  lireListe.includes("const causes = Array.isArray(cause) ? cause : [cause]; "
    + "setListe((l) => ({ ...l, erreur: null, enLecture: true, relecture: { devis: l.relecture.devis || causes.includes('devis'), "
    + "entreprise: l.relecture.entreprise || causes.includes('entreprise'), }, }));")
    && (lireListe.match(/relecture: AUCUNE_RELECTURE/g) || []).length === 2
    && /const AUCUNE_RELECTURE = Object\.freeze\(\{ devis: false, entreprise: false \}\);/.test(saE)
    && saE.includes('const [liste, setListe] = useState({ motifs: null, erreur: null, enLecture: false, relecture: AUCUNE_RELECTURE, '
      + 'reponseVue: undefined, }); const reponseVueRef = useRef(undefined); const totauxGenRef = useRef(null); '
      + 'const lectureListe = useRef(0);')
    /* 2b-2 (cahier §3.8) : la partie « Votre entreprise » se tait AUSSI
       pendant qu'une réponse « à quel titre » part — calculé à chaque
       rendu depuis l'état de la file, jamais gardé ; et l'état, la ligne et
       la carte reçoivent CETTE relecture. */
    && saE.includes('const relectureVue = attente.etatAQuelTitre.enRoute && !liste.relecture.entreprise ? { ...liste.relecture, '
      + 'entreprise: true } : liste.relecture;')
    && (saE.match(/relecture=\{relectureVue\}/g) || []).length === 2 && /relecture: relectureVue,/.test(saE)
    && !/relecture=\{liste\.relecture\}/.test(saE),
  lireListe.slice(0, 400));
  /* LES RELECTURES (critique E-1, E-5, B11) : à l'ouverture d'un devis en
     base, après chaque relecture des totaux, au retour de « Mon
     entreprise », sur « Réessayer » — en haut ET dans la carte. */
  const brancheTotaux = (/if \(ev\.type === 'totaux'\) \{[\s\S]*?\} else if \(ev\.type === 'totaux_illisibles'\)/.exec(SA) || [''])[0];
  const effetRetour = appels(SA, 'useEffect').map(sansEspaces).find((a) => /\[retourEntreprise\]\)$/.test(a)) || '';
  verifier('la liste se RELIT : à l’ouverture d’un devis en base (après `setEtat(\'pret\')`), après chaque relecture des totaux, au retour '
    + 'de « Mon entreprise » (`retourEntreprise`, et pas à la valeur de départ), et sur « Réessayer » — en haut, en bas ET dans la carte',
  /* 2b-2 (cahier §3.6) : « Votre entreprise » se relit AUSSI quand la
     réponse « à quel titre » que la base a vue n'est plus celle de la
     dernière liste (les mentions dues à un particulier en dépendent) ;
     avant la première liste, rien à comparer. */
  sansEspaces(brancheTotaux).includes('const vueNouvelle = ev.totaux ? pourQuiValable(ev.totaux.demande) : reponseVueRef.current; '
    + 'const changee = reponseVueRef.current !== undefined && vueNouvelle !== reponseVueRef.current; '
    + "lireLaListe(changee ? ['devis', 'entreprise'] : 'devis');")
    && (brancheTotaux.match(/\blireLaListe\(/g) || []).length === 1
    && /if \(ev\.totaux\) \{ poserTotaux\(ev\.totaux\); totauxGenRef\.current = fileRef\.current \? fileRef\.current\.generation\(\) : null; \}/
      .test(sansEspaces(brancheTotaux))
    && /setEtat\('pret'\); lireLaListe\(\);/.test(saE)
    /* L'EFFET ENTIER, et lui seul (banc de la relecture 2 de 2b-1, R17) :
       `includes` laissait passer une ligne glissée AVANT la garde —
       `lireLaListe(['devis', 'entreprise'])` à chaque retour —, et « Ce
       devis » se taisait sans que le régime ait changé. */
    /* …ET IL RELIT TOUJOURS LES DEUX CAUSES, une fois par retour (relecture
       4 de 2b-1, 06/11/2026 : la décision « simplifier » — la base calcule
       la liste avec SON régime, il suffit de relire). */
    && effetRetour === 'useEffect(() => { if (retourEntrepriseVu.current === retourEntreprise) return; retourEntrepriseVu.current = '
      + "retourEntreprise; lireLaListe(['devis', 'entreprise']); }, [retourEntreprise])"
    && appels(SA, 'useEffect').map(sansEspaces).filter((a) => /\[retourEntreprise\]\)$/.test(a)).length === 1
    && (saE.match(/onReessayer=\{lireLaListe\}/g) || []).length === 2
    && /ligneRemise=\{ligneRemise\('haut'\)\}/.test(saE) && /rangeeRemise=\{ligneRemise\('bas'\)\}/.test(saE));
  /* UN CHANGEMENT DU RÉGIME NE RELIT RIEN ET N'EFFACE RIEN (relecture 4 de
     2b-1, 06/11/2026) : aucun effet de la saisie n'écoute plus la propriété
     `regime` (ni seule, ni parmi d'autres), et la liste n'y range ni le
     régime ni la dernière liste lue — elle a ses quatre champs. Ce contrôle
     figeait l'effet du régime ENTIER (banc de la relecture 2, R13) ; il
     refuse désormais qu'un effet sur le régime revienne : un tel effet qui
     relirait (« Des changements partent » sans que rien ne parte) ou
     effacerait (une liste juste perdue sur un réseau coupé) était
     exactement le défaut de la relecture 3 (RELIRE-1). Les DEUX seules
     écritures de la liste sont celles de `lireLaListe` (son départ et son
     retour). La ligne et la carte ne reçoivent plus `derniere` : les
     gabarits n'en dépendent plus.
     BANC DE LA RELECTURE 4 (N3) : ce contrôle ne regardait que `useEffect`.
     Un `useLayoutEffect(() => { lectureListe.current += 1; }, [regime])` —
     ni `lireLaListe`, ni `setListe` — passait au vert : il JETTE la lecture
     en vol à chaque régime reçu (sa réponse n'est plus « la dernière »), et
     la liste restait « en lecture » pour toujours quand la lecture du régime
     levait à l'ouverture. Désormais : AUCUN crochet de React (effets,
     `useMemo`, `useCallback`) n'a `regime` dans ses dépendances, et les trois
     GARDES de `lireLaListe` — `lectureListe`, `monte`, `fileRef` — n'ont que
     leurs écritures connues (une chacune : la numérotation dans
     `lireLaListe`, le démontage, l'ouverture), sans alias de la référence.
     Ce qui relit (`lireLaListe`, liste fermée plus bas), ce qui efface
     (`setListe`, deux) et ce qui jette une lecture (ces gardes) sont donc
     fermés quelle que soit la dépendance — `regime`, ou ce qui en dérive
     (`franchise`, `reel`). */
  const CROCHETS_REACT = ['useEffect', 'useLayoutEffect', 'useInsertionEffect', 'useMemo', 'useCallback'];
  const effetsDuRegime = CROCHETS_REACT.flatMap((c) => appels(SA, c)).map(sansEspaces).filter((a) => /\[[^\]]*\bregime\b[^\]]*\]\)$/.test(a));
  /* toute affectation composée compte (`+=`, mais aussi `^=`, `**=`, `&&=`, `??=`… :
     banc de la relecture 4, N3f et N3g, qui passaient quand seules `+=`, `-=`,
     la multiplication et la division étaient comptées) */
  const ecritures = (ref) => (saE.match(new RegExp(`(?:\\+\\+|--)\\s*${ref}\\.current\\b|\\b${ref}\\.current\\s*(?:\\+\\+|--|(?:\\*\\*|<<|>>>?|&&|\\|\\||\\?\\?|[-+*/%&|^])?=(?!=))`, 'g')) || []).length;
  /* la référence elle-même ne s'écrit nulle part ailleurs que dans sa déclaration (ni alias, ni prop, ni argument) */
  const alias = (ref) => (saE.match(new RegExp(`\\b${ref}\\b(?!\\.current\\b)`, 'g')) || []).length !== 1 || !saE.includes(`const ${ref} = useRef(`);
  const gardesFermees = ecritures('lectureListe') === 1 && (lireListe.match(/\blectureListe\.current \+= 1;/g) || []).length === 1
    && ecritures('monte') === 1 && saE.includes('useEffect(() => () => { monte.current = false; }, []);')
    && ecritures('fileRef') === 1 && ['lectureListe', 'monte', 'fileRef'].every((r) => !alias(r));
  verifier('…un changement de la propriété `regime` ne relit RIEN et n’efface RIEN : aucun crochet de la saisie ne l’écoute (effets, `useMemo`, '
    + '`useCallback`), la liste n’a que ses champs `motifs`, `erreur`, `enLecture`, `relecture` (ni régime, ni dernière liste lue), '
    + '`lireLaListe` est seule à l’écrire, ses gardes (`lectureListe`, `monte`, `fileRef`) n’ont que leurs écritures connues — rien ne jette une '
    + 'lecture en vol —, et ni la ligne ni la carte ne reçoivent `derniere`',
  effetsDuRegime.length === 0 && gardesFermees
    && (saE.match(/\bsetListe\(/g) || []).length === 2 && (lireListe.match(/\bsetListe\(/g) || []).length === 2
    && balises(SA, 'LigneRemise').length === 1 && balises(SA, 'LigneRemise').every((b) => !/derniere/.test(b))
    && balises(SA, 'PourRemettre').every((b) => !/derniere/.test(b)) && !/\bliste\.(regime|derniere)\b/.test(saE),
  json([effetsDuRegime, ['lectureListe', 'monte', 'fileRef'].map((r) => [r, ecritures(r), alias(r)])]));
  /* QUI RELIT LA LISTE : une liste FERMÉE (banc de la relecture 2 de 2b-1,
     R5b et R15). Les vérifications au-dessus tiennent chaque appel CONNU,
     pas celui qu'on AJOUTE : un second effet sur le retour de « Mon
     entreprise », ou une ligne de plus à l'ouverture, qui relisent avec la
     cause « devis », faisaient taire « Ce devis » et dire « Des changements
     partent » alors que rien ne partait — et tout passait au vert. Chaque
     occurrence du nom, dans l'ordre du fichier, doit être l'une de celles-ci :
     une de plus, un alias (`const relire = lireLaListe`), un appel déplacé,
     rougit. Ajouter un appel est une DÉCISION : on l'écrit ici, avec sa
     raison. */
  const usagesDeLireLaListe = [...saE.matchAll(/\blireLaListe\b/g)].map((m) => saE.slice(m.index + 11, m.index + 11 + 60));
  const USAGES_DE_LIRE_LA_LISTE = [
    ' = (cause = null) => { const f = fileRef.current;', // la définition
    '(); }); return; } const lues = ', //                   la garde de génération relit la DERNIÈRE lecture
    /* une écriture du devis confirmée — « Votre entreprise » aussi quand la réponse vue par la base change (2b-2) */
    "(changee ? ['devis', 'entreprise'] : 'devis'); } else if (",
    '(); })(); return () => {', //                          l'ouverture d'un devis en base
    "(['devis', 'entreprise']); }, [retourEntreprise]);", // le retour de « Mon entreprise » (les deux causes, toujours)
    '} />', //                                              « Réessayer » de la ligne (en haut et en bas)
    '} onFermer={fermerCarte} />', //                       « Réessayer » de la carte
  ];
  verifier('…et RIEN D’AUTRE ne relit la liste : les sept occurrences de `lireLaListe` dans la saisie, dans l’ordre (la définition, la garde '
    + 'de génération, l’écriture confirmée, l’ouverture, le retour de « Mon entreprise », « Réessayer » ×2 — plus aucune sur un changement '
    + 'du régime, relecture 4) — un appel '
    + 'de plus, ou un alias, rougit (banc de la relecture 2 : un second effet qui relisait « devis » à chaque retour passait au vert)',
  usagesDeLireLaListe.length === USAGES_DE_LIRE_LA_LISTE.length
    && USAGES_DE_LIRE_LA_LISTE.every((u, i) => usagesDeLireLaListe[i].startsWith(u)),
  json(usagesDeLireLaListe.map((u) => u.slice(0, 40))));
  /* LES COMMENTAIRES CORRIGÉS PAR LA RELECTURE 2 NE REVIENNENT PAS À LEUR
     VERSION PÉRIMÉE (banc de la relecture 2, K1 à K4). Tous les contrôles
     de ce fichier lisent le code SANS ses commentaires : un commentaire qui
     dit le contraire du code passe donc toujours au vert — c'est ainsi que
     « la ligne ne saute pas d'un état à l'autre » a survécu au saut qu'il
     niait (REL-1). Ce contrôle-ci lit le TEXTE BRUT, et refuse les phrases
     que la relecture 2 a retirées parce qu'elles étaient fausses. Il ne
     prouve pas qu'un commentaire est juste ; il empêche les phrases fausses
     connues de revenir. */
  const brut = (f) => lire(f).replace(/[  ]/g, ' ').replace(/\n\s*(?:\*(?!\/)|\/\/)/g, ' ').replace(/\s+/g, ' ');
  const PHRASES_PERIMEES = {
    'src/lib/devis.js': [/`lignes` : les lignes RÉSERVÉES/, /TROIS lignes réservées/, /Trois lignes dans CET état seulement/,
      /UNE PARTIE PÉRIMÉE NE S'AFFICHE PAS/, /relecture de l'ENTREPRISE ne change pas l'état/, /« Ce devis »,? (?:lui, )?reste(?: juste)?\./,
      /* relecture 3 (RELIRE-1) : l'inconnu n'est jamais « non déclaré » */
      /ils deviennent `null`/, /un régime inconnu \(lecture en cours ou ratée\) compte comme `null`/,
      /* relecture 3 (D-A bis, 06/11) : le saut « mise à jour… » est tranché */
      /une décision du propriétaire, pas une correction/, /Ce qui RESTE, mesuré le 06\/11 : à 390 points/,
      /* banc de la relecture 3 (M32) : rien n'est posé en position absolue */
      /position absolue/,
      /* relecture 4 (RELIRE3-1) : la place ne dépend plus des nombres — ces
         phrases n'étaient vraies que pour « aucun point » */
      /Plus rien ne bouge, jamais/, /≈ 110 points à 393/, /sous ses DEUX formes/, /DEUX GABARITS, LE PLUS GRAND/,
      /* relecture 4 (la décision « simplifier ») : rien ne relit plus l'entreprise seule */
      /Une relecture de la seule ENTREPRISE ne change pas l'état/,
      /* relecture 5 (RELIRE4-C) : la place ne se rend plus quand la phrase « pas compté » disparaît */
      /qui APPARAÎT ou DISPARAÎT/,
      /* relecture 6 (RELIRE5-R1) : plus de mémoire, la place ne se rend plus « au retour d'une liste » */
      /LA PLACE GARDÉE/, /POURQUOI UNE MÉMOIRE/, /ne se REND qu.au RETOUR d.une liste/, /NE SE REND QU.AU RETOUR D.UNE/,
      /la mémoire de `garderLaPlace`/,
      /* banc de la relecture 6 : les deux formes de l'ancienne règle « couverte », qui disaient le contraire du code */
      /elle se REND au retour d.une liste qui/, /à leur fermeture/,
      /* banc de la relecture 7 (RELIRE6-1, -3) : la place ne se rend plus « à la réussite » seulement, et un renvoi
         n'est plus une liste de quatre portes */
      /À LA RÉUSSITE de l.écriture renvoyée/, /ou à la réussite d.une écriture renvoyée/,
      /sur un retrait, et le renvoi automatique du plafond\)/, /renvoi automatique du plafond — la phrase « pas compté »/,
      /quatre renvois/],
    'src/components/PourRemettre.js': [/TROIS dans un seul état/, /\(`lignes`\)/, /« Ce devis »,? (?:lui, )?reste(?: juste)?\./,
      /* relecture 3 (D-A bis, point 3) : plus rien n'est posé en position absolue, le gabarit n'est plus seul */
      /`s\.parDessus`/, /est celle du gabarit, à toutes les largeurs/,
      /* banc de la relecture 3 (M32) : la même phrase fausse sans nommer le
         style — « le texte lu posé par-dessus en position absolue » —
         passait. Plus rien n'est posé en position absolue dans ce fichier :
         la seule mention permise est l'HISTOIRE de la phrase d'une partie
         (« Posée en position absolue, elle débordait »). */
      /(?<!Posée en )position absolue/,
      /* relecture 4 (RELIRE3-1) */
      /« phrase \+ décompte » de la liste lue, sous ses deux formes/, /SA HAUTEUR NE BOUGE PAS TANT QUE QUELQUE CHOSE N'EST PAS COMPTÉ\s/,
      /* relecture 5 (RELIRE4-C) */
      /phrase « pas compté » qui apparaît ou disparaît, et le passage/,
      /* relecture 6 (RELIRE5-R1) */
      /NE SE REND QU.AU RETOUR D.UNE LISTE/, /la mémoire de `garderLaPlace`/, /elle se REND au retour d.une liste qui/,
      /* banc de la relecture 6 */
      /à la fermeture de la carte ou de la feuille/,
      /* banc de la relecture 7 */
      /ou à la réussite d.une écriture renvoyée/, /le renvoi du plafond —, la saisie passe/, /quatre renvois/],
    'src/screens/SaisieDevisScreen.js': [/se relit ne s'affiche pas tant que la liste/, /« Ce devis »,? (?:lui, )?reste(?: juste)?\./,
      /* relecture 3 (RELIRE-1) */
      /un objet neuf ne relance rien s'il ne change pas ce qu'on sait/, /ratée\) compte comme `null`/, /position absolue/,
      /* relecture 4 : plus de comparaison de régimes au retour de « Mon entreprise » */
      /la seule cause « entreprise »/, /SAUF si les deux régimes sont CONNUS/,
      /* relecture 6 (RELIRE5-R1) */
      /LA PLACE GARDÉE/, /NE SE REND QU.AU RETOUR D.UNE LISTE/, /`placeGardee`/,
      /* banc de la relecture 6 */
      /ne se rend pas sous une carte/, /se rend à leur fermeture/, /\(`couverte`\)/,
      /* banc de la relecture 7 */
      /quatre renvois/],
    /* banc de la relecture 7 : le point 18 de la file disait qu'une écriture qui n'est pas « Réessayer » n'est pas un
       renvoi (« n'en porte pas non plus ») — la carte d'une ligne en échec fermée sans rien changer en est un */
    'src/lib/file-ecriture.js': [/n.en porte\s+pas non plus : c.est un nouveau geste/, /quatre renvois/],
  };
  const perimees = Object.entries(PHRASES_PERIMEES).flatMap(([f, rs]) => rs.filter((r) => r.test(brut(f))).map((r) => `${f} : ${r}`));
  verifier('…les commentaires que la relecture 2 a corrigés ne reviennent pas à leur version FAUSSE (trois lignes réservées « dans cet état '
    + 'seulement », une sortie `lignes`, « Ce devis » qui « reste » sans l’exception du régime de TVA) : les contrôles lisent le code sans ses '
    + 'commentaires, celui-ci lit le texte brut', perimees.length === 0, perimees.join(' | '));
  /* CHAQUE COMMENTAIRE AU-DESSUS DE SON EFFET (banc de la relecture 2 de
     2b-1, point 3 ; relecture 3) : l'effet du régime avait été inséré ENTRE
     le commentaire « « MON ENTREPRISE » VIENT DE SE FERMER » et l'effet
     qu'il décrit — ce commentaire se lisait au-dessus de l'effet du
     régime. Lu dans le TEXTE BRUT de la saisie : chaque commentaire est
     suivi, sans rien entre deux, du code qu'il décrit. */
  const brutSaisie = brut('src/screens/SaisieDevisScreen.js');
  const accroche = (titre, suite) => {
    const i = brutSaisie.indexOf(titre);
    const fin = i < 0 ? -1 : brutSaisie.indexOf('*/', i);
    return i >= 0 && fin > i && brutSaisie.slice(fin + 2).trimStart().startsWith(suite) && brutSaisie.indexOf(titre, i + 1) < 0;
  };
  verifier('…et le commentaire « « MON ENTREPRISE » VIENT DE SE FERMER » est juste au-dessus du retour de « Mon entreprise » (le banc de '
    + 'la relecture 2 l’avait trouvé emmêlé avec l’effet du régime) — et celui de l’effet du régime, retiré avec lui (relecture 4), n’est plus là',
  accroche("/* « MON ENTREPRISE » VIENT DE SE FERMER", 'const retourEntrepriseVu = useRef(retourEntreprise); useEffect(() => {')
    && !brutSaisie.includes('LE RÉGIME DE TVA REÇU'),
  brutSaisie.slice(brutSaisie.indexOf('« MON ENTREPRISE » VIENT DE SE FERMER'), brutSaisie.indexOf('« MON ENTREPRISE » VIENT DE SE FERMER') + 900));
  /* OUVRIR LA LISTE ENREGISTRE D'ABORD CE QUI EST OUVERT (trou trouvé par le
     banc du lot 2b-1, Q16) : un délai tapé dans l'en-tête sans avoir quitté
     le champ, ou une carte de ligne en cours, part AVANT que la carte ne se
     pose — sinon la liste dirait « le délai manque » devant un délai écrit.
     Sans cette vérification, retirer les deux enregistrements passait tous
     les contrôles. Le CORPS de `ouvrirPourRemettre`, dans son ordre. */
  const ouvrirListe = sansEspaces(corpsFleche(SA, 'const ouvrirPourRemettre = () =>'));
  verifier('ouvrir la liste ENREGISTRE d’abord la carte ouverte et l’en-tête (un délai tapé sans quitter le champ), PUIS pose la carte',
    /^=> \{ if \(carteRef\.current && carteRef\.current !== CARTE_POUR_REMETTRE\) enregistrerCarte\(\); if \(refEntete\.current\) refEntete\.current\.enregistrer\(\); Keyboard\.dismiss\(\); poserRetour\(null\); poserCarte\(CARTE_POUR_REMETTRE\);/.test(ouvrirListe)
    && (saE.match(/const ouvrirPourRemettre = /g) || []).length === 1,
  ouvrirListe.slice(0, 200));
  const opus = sansEspaces(sansCommentairesJs(lire('src/OpusApp.js')));
  verifier('…« Mon entreprise » le signale à sa FERMETURE (`setRetourEntreprise`), et la saisie le reçoit',
    /onFermer=\{\(\) => \{ setEntrepriseOuverte\(false\); setRetourEntreprise\(\(n\) => n \+ 1\); \}\}/.test(opus)
    && /retourEntreprise=\{retourEntreprise\}/.test(opus));
  verifier('la carte se pose par `carte === CARTE_POUR_REMETTRE` (une valeur de PLUS de l’unique état de carte), reçoit `etatDeLaListe`, '
    + 'la liste rangée avec la table des sections d’« Mon entreprise », et les avis À PART — jamais dans la ligne',
  /\{carte === CARTE_POUR_REMETTRE && \( <PourRemettre/.test(saE) && /if \(id === CARTE_POUR_REMETTRE \|\| id === CARTE_CHANTIER\) return;/.test(saE)
    && /lireMotifsDeRemise\(liste\.motifs, \{ sections: SECTION_DU_MOTIF \}\)/.test(saE) && /Array\.isArray\(liste\.motifs\) \?/.test(saE)
    && /erreur: liste\.erreur,/.test(saE) && /enBase: attente\.devisEnBase,/.test(saE)
    && balises(SA, 'LigneRemise').every((b) => !/\bavis\b/.test(b)) && balises(SA, 'PourRemettre').some((b) => /avis=\{avis\}/.test(b)));
  /* LES ÉTATS DE LA SAISIE (écarts 7 et 8) : « des changements partent »
     pendant une écriture ET pendant la frappe d'un champ de l'en-tête — que
     l'en-tête signale UNE fois par saisie, et retire en s'enregistrant ; ce
     que la liste ne compte pas, avec LE compte du pied (`nbNonEnregistrees`,
     que `suffixeDuPied` reçoit aussi) — jamais un second compte. */
  const corpsEntete = sansEspaces(ECR.entete);
  const champsFrappe = balises(ECR.entete, 'ChampLocal').filter((b) => /surPremiereFrappe=\{\(\) => signalerFrappe\(true\)\}/.test(b));
  verifier('la saisie : « des changements partent » pendant une écriture (`attente.enCours`) ET pendant la frappe d’un champ de l’en-tête '
    + '(`champOuvert`, que l’en-tête signale par `onFrappe`) ; ce que la liste ne compte pas vient de `ceQueLaListeNeComptePas` avec LE '
    + 'compte du pied (`nbNonEnregistrees`), et passe à la ligne ET à la carte',
  /const etatListe = etatDeLaListe\(\{ enBase: attente\.devisEnBase, enRoute: attente\.enCours, champOuvert, erreur: liste\.erreur, lue, relecture: relectureVue, \}\);/.test(saE)
    && /const pasCompte = ceQueLaListeNeComptePas\(\{ nbLignes: nbNonEnregistrees, entete: !!attente\.devisErreur \|\| Object\.keys\(erreursEntete\)\.length > 0, enBase: attente\.devisEnBase, \}\);/.test(saE)
    /* LES AVIS, une fois l'état connu (PAR-8) ; et « Réessayer » JAMAIS
       sur un refus définitif (PAR-3 : retirer la garde laissait OP027
       « Liste non lue — Réessayer », un bouton qui relit sans fin le même
       refus, et rien ne rougissait). */
    /* 2b-2 : les avis de la fiche (SIRET, « particulier ») lisent la fiche
       jointe et la réponse que la BASE a vue avec la liste. */
    && /const avis = avisDuDevis\(\{ devis, lignes, totaux, etat: etatListe, pasCompte, client, reponseVue: liste\.reponseVue, \}\);/.test(saE)
    && saE.indexOf('const avis = avisDuDevis(') > saE.indexOf('const pasCompte = ceQueLaListeNeComptePas(')
    && !/useMemo\(\(\) => avisDuDevis/.test(saE)
    && (saE.match(/const listeReessayable = !!liste\.erreur && !estUnRefusDefinitif\(liste\.erreur\);/g) || []).length === 1
    && (saE.match(/erreurReessayable=\{listeReessayable\}/g) || []).length === 2
    && /const suffixe = suffixeDuPied\(\{ nbNonEnregistrees,/.test(saE)
    && (saE.match(/pasCompte=\{pasCompte\}/g) || []).length === 2
    && /const \[champOuvert, setChampOuvert\] = useState\(false\);/.test(saE) && /onFrappe=\{setChampOuvert\}/.test(saE)
    && !/\bnonParties\b/.test(saE) && !/enRoute=\{attente\.enCours\}/.test(saE));
  /* LA PLACE DE LA LIGNE, DANS LA SAISIE : AUCUNE MÉMOIRE (relecture 6 de
     2b-1). La relecture 5 y avait mis un état `placeGardee`, remis à jour
     pendant le rendu, qui ne rendait la place qu'au retour d'une liste
     neuve : ce qui cessait d'être compté sans écriture ne la rendait plus
     (RELIRE5-R1). La saisie ne garde plus rien : la ligne reçoit `pasCompte`
     et `renvoi`, et `garderLaPlace` (devis.js, appelée par
     `texteDeLaLigneRemise`) décide à chaque rendu. `renvoi` vient de
     l'ÉTAT d'attente (`attente.renvoisEnRoute`), que `majAttente` recopie
     de la file (`renvoisEnRoute()`) après chaque événement — jamais d'une
     référence lue pendant le rendu (le cliquet du linter). Et la liste ne
     ferme plus le clavier quand une carte ou une feuille la couvre
     (`glisserFermeLeClavier`) : la place y change de hauteur, et le
     défilement qu'en tire Chromium fermait le clavier du champ de la carte. */
  const balisesLigne = balises(SA, 'LigneRemise');
  const iMaj = saE.indexOf('const majAttente = () => {');
  const corpsMaj = iMaj >= 0 ? saE.slice(iMaj, saE.indexOf('};', iMaj)) : '';
  verifier('la saisie ne GARDE plus la place (relecture 6) : aucun état ni aucune référence de la place, aucun appel à `garderLaPlace` '
    + 'dans l’écran, aucun `garder=` ; la ligne — UNE balise, en haut et en bas — reçoit `renvoi={attente.renvoisEnRoute > 0}`, que '
    + '`majAttente` recopie de la file (`f.renvoisEnRoute().length`) et que l’état d’attente initialise à 0 ; et la liste ne ferme plus le '
    + 'clavier sous une carte ou une feuille (`keyboardDismissMode={glisserFermeLeClavier}`, `carte || feuille ? \'none\' : \'on-drag\'`) ; '
    + 'et l’ouverture recopie l’état de la file (`majAttente()`) avant `setEtat(\'pret\')`',
  !/\bplaceGardee\b|\bsetPlaceGardee\b|\bplace(?:Gardee)?Ref\b/.test(SA) && !/\bgarderLaPlace\b/.test(saE) && !/\bgarder=\{/.test(saE)
    && balisesLigne.length === 1 && balisesLigne.every((b) => /\brenvoi=\{attente\.renvoisEnRoute > 0\}/.test(b))
    && (saE.match(/\brenvoi=\{/g) || []).length === 1
    && /renvoisEnRoute: f\.renvoisEnRoute\(\)\.length,/.test(corpsMaj)
    /* 2b-3 (E-I6) : l'état de la troisième question, `etatQ3`, part du même
       état de repos. */
    && /const \[attente, setAttente\] = useState\(\{ nb: 0, enCours: false, devisErreur: null, devisEnBase: false, retraitsEnEchec: 0, renvoisEnRoute: 0, etatAQuelTitre: AUCUN_ETAT, etatChantier: AUCUN_ETAT, etatQ1: AUCUN_ETAT, etatQ2: AUCUN_ETAT, etatQ3: AUCUN_ETAT, \}\);/.test(saE)
    && (saE.match(/\brenvoisEnRoute\b/g) || []).length === 4
    && !/fileRef\.current\.renvoisEnRoute|fileRef\.current && fileRef\.current\.renvoisEnRoute/.test(saE)
    && saE.includes("const glisserFermeLeClavier = carte || feuille ? 'none' : 'on-drag';")
    && (saE.match(/keyboardDismissMode=\{glisserFermeLeClavier\}/g) || []).length === 1
    /* …et l'OUVERTURE relit la file AVANT que l'écran se dise prêt (banc de
       la relecture 6, N15 : retirer cet appel passait) — une file qui a
       survécu à l'écran, quitté pendant un renvoi, garde sa marque, et
       l'écran ne la voit qu'en recopiant l'état d'attente à l'ouverture ;
       sans lui, le premier rendu croit aussi le brouillon « pas en base ». */
    && (saE.match(/majAttente\(\); setEtat\('pret'\); lireLaListe\(\);/g) || []).length === 1
    && saE.indexOf('fileRef.current = f; desabonner = f.abonner(ecouter);') >= 0
    && saE.indexOf('fileRef.current = f; desabonner = f.abonner(ecouter);') < saE.indexOf("majAttente(); setEtat('pret'); lireLaListe();"),
  `${balisesLigne.length} balise(s) ; renvoisEnRoute ×${(saE.match(/\brenvoisEnRoute\b/g) || []).length} ; ouverture `
    + `${saE.indexOf('fileRef.current = f; desabonner = f.abonner(ecouter);')} < ${saE.indexOf("majAttente(); setEtat('pret'); lireLaListe();")}`);
  verifier('…et l’en-tête signale la frappe UNE fois (`surPremiereFrappe` sur l’objet, le code postal, la ville et le délai ; la première '
    + 'lettre de la rue), et la retire quand le champ s’enregistre (chaque `onBlur`, le lieu, `enregistrer()`), réarmant ses champs',
  champsFrappe.length === 4
    && /const signalerFrappe = \(oui\) => \{ if \(enFrappe\.current === oui\) return; enFrappe\.current = oui; if \(onFrappe\) onFrappe\(oui\); \};/.test(corpsEntete)
    && /\[refObjet, refDelai, refCp, refVille\]\.forEach\(\(r\) => \{ if \(r\.current && r\.current\.rearmer\) r\.current\.rearmer\(\); \}\); signalerFrappe\(false\);/.test(corpsEntete)
    && /enregistrer: \(\) => \{ onEnregistrer\(lire\(\)\); frappeFinie\(\); \},/.test(corpsEntete)
    && /\} else \{ signalerFrappe\(true\); \}/.test(corpsEntete)
    && (corpsEntete.match(/frappeFinie\(\);/g) || []).length >= 4,
  `${champsFrappe.length} champ(s) qui signalent la frappe`);
  /* QUITTER LA RUE L'ENREGISTRE (relecture de 2b-1, ECR-2) : une rue tapée
     sans choisir de suggestion signalait « champ ouvert », et rien ne
     l'enregistrait ni ne retirait le signal — « Des changements partent »
     restait sans que rien ne parte. `ChampVille` reçoit un `onBlur`
     FACULTATIF, sans valeur par défaut (les six autres écrans ne le passent
     pas : pour eux, rien ne change), qu'il passe à son champ ; l'en-tête y
     branche `enregistrerLieu`, qui enregistre ET retire le signal. */
  const champVille = sansEspaces(sansCommentairesJs(lire('src/components/ChampVille.js')));
  const rueDuLieu = sansEspaces(balises(ECR.entete, 'ChampVille').find((b) => /type="rue"/.test(b)) || '');
  verifier('…et QUITTER la rue l’enregistre : `ChampVille` passe un `onBlur` FACULTATIF (sans valeur par défaut) à son champ, et l’en-tête '
    + 'y branche `enregistrerLieu` (qui enregistre le lieu et retire le signal de frappe)',
  /type = 'municipality', style, maxLength, onBlur, \}, ref\) \{/.test(champVille) && /maxLength=\{maxLength\} onBlur=\{onBlur\} \/>/.test(champVille)
    && /onBlur=\{enregistrerLieu\}/.test(rueDuLieu)
    && /const enregistrerLieu = \(\) => \{ const l = lire\(\); onEnregistrer\(\{ lieuAdresse: l\.lieuAdresse, lieuCodePostal: l\.lieuCodePostal, lieuVille: l\.lieuVille \}\); frappeFinie\(\); \};/.test(corpsEntete),
  rueDuLieu.slice(0, 200));
  /* LE RETOUR À LA LISTE DEPUIS « CONDITIONS » (critique E-13) : ouverte
     depuis la liste sur son champ, la carte y RAMÈNE ; ouverte autrement,
     elle revient au devis. */
  const agir = sansEspaces(corpsFleche(SA, 'const agirSurLePoint = (point) =>'));
  const fermer = sansEspaces(corpsFleche(SA, 'const fermerCarte = () =>'));
  verifier('« Conditions » ouverte DEPUIS LA LISTE s’ouvre sur le champ et y RAMÈNE (« ‹ Liste ») ; ouverte autrement, elle revient au devis',
    /const ouvrirConditionsSur = \(champ\) => \{ ouvrirConditions\(\); setChampConditions\(champ \|\| null\); poserRetour\(CARTE_POUR_REMETTRE\); \}/.test(saE)
    && /const ouvrirConditions = \(\) => \{[^}]*poserRetour\(null\);/.test(saE)
    && /const vers = retourRef\.current; poserRetour\(null\); if \(vers === CARTE_POUR_REMETTRE\) ouvrirPourRemettre\(\);/.test(fermer)
    && /depuisLaListe=\{retourCarte === CARTE_POUR_REMETTRE\}/.test(saE) && /champInitial=\{champConditions\}/.test(saE)
    && /\{depuisLaListe \? '‹ Liste' : '‹ Devis'\}/.test(sansCommentairesJs(lire('src/components/ConditionsDevis.js'))));
  verifier('…chaque point mène à son endroit : le client (« Pour qui ? »), « Conditions » sur son champ, « Mon entreprise » sur SA section, la '
    + 'ligne qui EXISTE, un poste neuf, le délai et le lieu (le champ prend le focus)',
  /case 'client': ouvrirChoixClient\(\); return;/.test(agir) && /case 'entreprise': if \(e\.section && onMonEntreprise\) onMonEntreprise\(e\.section\); return;/.test(agir)
    && /case 'conditions': ouvrirConditionsSur\(e\.champ\); return;/.test(agir)
    && /case 'ligne': if \(!lignesRef\.current\.some\(/.test(agir) && /case 'lieu': case 'delai':/.test(agir)
    && /focusChamp: \(champ\) => \{ const cible = \{ lieu: refRue, delai: refDelai \}\[champ\];/.test(sansEspaces(ECR.entete))
    && /ref=\{refRue\}/.test(ECR.entete) && /\{ligneRemise\}/.test(ECR.entete));
  /* …ET « OUVRIR CETTE LIGNE » OUVRE CETTE LIGNE-LÀ (banc indépendant de
     2b-1, 05/11/2026 au soir) : le contrôle voyait la garde (`some`), pas
     ce qu'elle ouvre — `ouvrirCarte(lignesRef.current[0].id)` ouvrait la
     PREMIÈRE ligne du devis à la place de la fautive, et passait tout. Les
     deux cas qui ouvrent une carte, ENTIERS : la ligne fautive, ou le poste
     qu'on vient d'insérer, et « ‹ Liste » qui ramène. */
  verifier('…« Ouvrir cette ligne » ouvre la ligne FAUTIVE (`e.ligneId`), « Chiffrer un poste » le poste qu’il vient d’insérer, et '
    + 'l’une comme l’autre ramène à la liste',
  agir.includes("case 'ligne': if (!lignesRef.current.some((l) => String(l.id) === String(e.ligneId))) return; ouvrirCarte(e.ligneId); poserRetour(CARTE_POUR_REMETTRE); return;")
    && agir.includes("case 'lignes': { if (!(Array.isArray(propositions) && propositions.length > 0)) return; if (carteRef.current) enregistrerCarte(); const id = inserer('poste', null); if (!id) return; ouvrirCarte(id); poserRetour(CARTE_POUR_REMETTRE); return; }")
    && agir.split('ouvrirCarte(').length - 1 === 2,
  agir.slice(agir.indexOf("case 'ligne'"), agir.indexOf("case 'ligne'") + 240));
  /* 2b-2 — L'ÉCRAN (cahier §3.4 à §3.8). Ce que les fonctions PURES décident
     (le bloc, la rangée, les questions, les états, les aides) est fait
     tourner plus haut ; ici, la saisie et ses composants s'y BRANCHENT, et
     sous la forme qui tient les règles :
       - une SEULE feuille à la fois, par l'état `feuille` : `pour_qui` et
         `chantier_neuf` (critique écran E-I11), aucune `FeuilleBas` dans
         l'en-tête ;
       - la paire « à quel titre » écrite avec le client lu À L'INSTANT de
         l'appui (E-M8), jamais sans client ;
       - le « Oui » au chantier neuf n'est écrit QUE par « Je confirme » ;
       - « Le chantier », une valeur de plus de l'état `carte`, qui ramène à
         la liste quand on y vient d'elle ;
       - les états « en route » / « en échec » recalculés à chaque événement
         de la file (`majAttente`), jamais gardés (E-B2) ;
       - la date du « Oui » : celle de la BASE (les totaux relus). */
  {
    const ent = sansEspaces(ECR.entete);
    const CH = sansCommentairesJs(lireSiExiste('src/components/ChantierDevis.js') || '');
    const chE = sansEspaces(CH);
    const FQ = sansEspaces(sansCommentairesJs(lireSiExiste('src/components/FeuilleAQuelTitre.js') || ''));
    const FN = sansEspaces(sansCommentairesJs(lireSiExiste('src/components/FeuilleChantierNeuf.js') || ''));
    const BDD = sansEspaces(corpsDeFonction(SA, 'BasDuDevis') || '');
    verifier('2b-2 : l’en-tête ne contient AUCUNE feuille (`FeuilleBas`, `Modal`) : « Répondre », « Autre réponse », « Changer » ouvrent '
      + 'la feuille de la saisie (`onRepondreAQuelTitre`) ; la moitié droite n’écrit QUE dans la proposition (`droite.ecrit`) ; texte et '
      + 'moitiés posés sur leurs gabarits (`GABARITS_A_QUEL_TITRE`, les trois libellés de gauche, celui de droite)',
    !/\bFeuilleBas\b|\bModal\b/.test(ECR.entete)
      && ent.includes('<BtnOutline label={aQuelTitre.gauche.libelle} onPress={onRepondreAQuelTitre} />')
      && ent.includes('{aQuelTitre.droite && aQuelTitre.droite.ecrit ? ( <BtnOutline label={aQuelTitre.droite.libelle} '
        + 'onPress={onOuiATitrePrive} /> ) : <View />}')
      && ent.includes('const LIBELLES_GAUCHE = Object.freeze([A_QUEL_TITRE.repondre, A_QUEL_TITRE.autreReponse, A_QUEL_TITRE.changer]);')
      && ent.includes('const LIBELLES_DROITE = Object.freeze([A_QUEL_TITRE.ouiATitrePrive]);')
      && ent.includes('<Superpose gabarits={GABARITS_A_QUEL_TITRE.map(')
      && (ent.match(/onPress=\{onOuiATitrePrive\}/g) || []).length === 1
      && (ent.match(/onPress=\{onRepondreAQuelTitre\}/g) || []).length === 1
      /* …et il se pose APRÈS le choix du client, avant « Objet » (§3.4). */
      && ent.indexOf("{sous('clientId')}") >= 0 && ent.indexOf("{sous('clientId')}") < ent.indexOf('{!!aQuelTitre && (')
      && ent.indexOf('{!!aQuelTitre && (') < ent.indexOf('<Text style={s.titre}>Objet</Text>'),
    ent.slice(ent.indexOf('{!!aQuelTitre'), ent.indexOf('{!!aQuelTitre') + 200));
    /* S40 (banc de la phase 5, 10/11) : les questions du chantier vivent dans
       la carte « Le chantier », jamais dans l'en-tête (§3.4) — ni leurs
       textes, ni ce qui les fabrique, ni une phrase qui les reformule. Le
       premier banc a posé une question écrite à la main au-dessus de
       « Objet » : rien ne la refusait. */
    {
      const textes = [];
      const cueillir = (v) => {
        if (typeof v === 'string') textes.push(v);
        else if (v && typeof v === 'object') Object.values(v).forEach(cueillir);
      };
      cueillir(D.LE_CHANTIER);
      const longs = textes.filter((t) => t.length > 12);
      const dedans = longs.filter((t) => ECR.entete.includes(t) || ECR.entete.includes(t.slice(0, 24)));
      verifier('2b-2 : l’en-tête ne pose AUCUNE question du chantier (§3.4) : aucun texte de `LE_CHANTIER`, ni `questionsDuChantier`, '
        + '`ChantierDevis`, `FeuilleChantierNeuf`, `chantierNeufConso` / `chantierNeufTva`, ni « bâtiment », « transformation '
        + 'importante », « chantier qui crée »',
      longs.length >= 10 && dedans.length === 0
        && !/\bLE_CHANTIER\b|questionsDuChantier|ChantierDevis|FeuilleChantierNeuf|chantierNeuf|CARTE_CHANTIER|GABARITS_DU_CHANTIER|resumeChantier/.test(ECR.entete)
        && !/b[âa]timent|transformation importante|chantier qui cr[ée]e/i.test(ECR.entete),
      dedans.join(' | ').slice(0, 160) || `${longs.length} textes`);
    }
    verifier('2b-2 : la saisie passe le bloc calculé par `resumeAQuelTitre` sur le devis de l’ÉCRAN, la fiche (type et SIRET compris) et '
      + 'l’état de la file ; la paire part avec le client lu À L’INSTANT de l’appui (`devisRef.current.clientId`), jamais sans client',
    saE.includes('const aQuelTitre = resumeAQuelTitre({ devis, client, enRoute: attente.etatAQuelTitre.enRoute, enEchec: '
      + 'attente.etatAQuelTitre.enEchec, });')
      && saE.includes('const ecrireAQuelTitre = (valeur) => { const clientId = devisRef.current ? devisRef.current.clientId : null; '
        + 'if (!clientId || !valeur) return; enregistrerEntete({ pourQui: valeur, pourQuiClient: clientId }); };')
      && saE.includes("const ouiATitrePrive = () => ecrireAQuelTitre('consommateur');")
      && saE.includes('const choisirAQuelTitre = (valeur) => { setFeuille(null); ecrireAQuelTitre(valeur); };')
      && saE.includes("const ouvrirAQuelTitre = () => { Keyboard.dismiss(); setFeuille({ type: 'pour_qui' }); };")
      && saE.includes('aQuelTitre={aQuelTitre} onRepondreAQuelTitre={ouvrirAQuelTitre} onOuiATitrePrive={ouiATitrePrive}')
      && (saE.match(/enregistrerEntete\(\{ pourQui:/g) || []).length === 1
      && /const client = clientFiche \? \{ nom: clientFiche\.nom, ville: clientFiche\.ville, type: clientFiche\.type \?\? null, siret: clientFiche\.siret \?\? null, \} : clientAffiche;/.test(saE)
      && /setClientAffiche\(\{ nom: fiche\.nom, ville: fiche\.ville \|\| null, type: fiche\.type \?\? null, siret: fiche\.siret \?\? null, \}\);/.test(saE),
    saE.slice(saE.indexOf('const ecrireAQuelTitre'), saE.indexOf('const ecrireAQuelTitre') + 200));
    verifier('2b-2 : les deux feuilles de 2b-2 sont des valeurs de l’UNIQUE état `feuille` (`pour_qui` : la réponse actuelle marquée, '
      + '`chantier_neuf` : la confirmation), et la feuille « À quel titre ? » dit les rangées dans l’ordre de `REPONSES_A_QUEL_TITRE`',
    saE.includes("case 'pour_qui': return ( <FeuilleAQuelTitre valeur={pourQuiValable(devis)} onChoisir={choisirAQuelTitre} "
      + 'onFermer={() => setFeuille(null)} /> );')
      && saE.includes("case 'chantier_neuf': return ( <FeuilleChantierNeuf onConfirmer={confirmerChantierNeuf} "
        + 'onFermer={() => setFeuille(null)} /> );')
      && FQ.includes('{REPONSES_A_QUEL_TITRE.map((r) => { const choisie = r.valeur === valeur;')
      && FQ.includes('onPress={() => onChoisir(r.valeur)}') && FQ.includes('accessibilityState={{ selected: choisie }}')
      && /<FeuilleBas titre=\{A_QUEL_TITRE\.titreFeuille\}/.test(FQ)
      && /<BtnOutline label=\{c\.garder\} onPress=\{onFermer\} \/> <BtnMain block ton="sombre" label=\{c\.confirmer\} onPress=\{onConfirmer\} \/>/.test(FN)
      && FN.includes('{c.paragraphes.map(') && /<FeuilleBas titre=\{c\.titre\}/.test(FN),
    `${FQ.length} / ${FN.length}`);
    verifier('2b-2 : le « Oui » au chantier neuf (droits du client) n’est écrit QUE par « Je confirme » — jamais par la carte, qui ne fait '
      + 'que demander la confirmation ; revenir à « Non » s’écrit d’un appui ; la seconde question s’écrit d’un appui',
    saE.includes('const confirmerChantierNeuf = () => { setFeuille(null); enregistrerEntete({ chantierNeufConso: true }); };')
      && (saE.match(/chantierNeufConso: true/g) || []).length === 1
      && saE.includes("const demanderConfirmationChantier = () => setFeuille({ type: 'chantier_neuf' });")
      && !/chantierNeufConso: true/.test(chE)
      && chE.includes('onPress={() => { if (d.chantierNeufConso !== false) onRepondre({ chantierNeufConso: false }); }}')
      && chE.includes('onPress={() => { if (!oui1) onDemanderConfirmation(); }}')
      && chE.includes('onPress={() => { if (d.chantierNeufTva !== false) onRepondre({ chantierNeufTva: false }); }}')
      && chE.includes('onPress={() => { if (!oui2) onRepondre({ chantierNeufTva: true }); }}')
      && chE.includes('const { q1, q2, q3 } = questionsDuChantier({ devis: d, regime });')
      && chE.includes('const ouiDit = libelleOuiDuChantier({ confirmeLe, enRoute: !!e1.enRoute, enEchec: !!e1.enEchec });')
      && chE.includes('const [nonTva, ouiTva] = pastillesDeLaQuestionTva(d.chantierNeufTva);'),
    chE.slice(0, 200));
    /* 2b-3 (réponse P1 du 12/11 : « A », cahier §3.6) — LA TROISIÈME
       QUESTION, la décennale : chaque pastille écrit d'un APPUI, sans
       confirmation (S36), et jamais rien sans appui ; « Non » À GAUCHE,
       comme les deux autres (E-I3, S42) — l'ordre des pastilles de Q3 est
       celui de `pastillesDeLaQuestionDecennale` (« Non » d'abord), rendu
       dans cet ordre ; son état vient de la file (`etats.q3`, E-I6). */
    const q3Bloc = chE.slice(chE.indexOf('{q3 && ('), chE.indexOf('</ScrollView>'));
    const iNonQ3 = q3Bloc.indexOf('label={nonDec}');
    const iOuiQ3 = q3Bloc.indexOf('label={ouiDec}');
    verifier('2b-3 : la question de la décennale (Q3) écrit d’un APPUI, sans confirmation — « Non » écrit `false`, « Oui » (ou « Oui (par '
      + 'défaut) ») écrit `true` —, rien sans appui ; « Non » À GAUCHE comme Q1 et Q2 ; son état vient de la file (`etats.q3`)',
    chE.includes('const [nonDec, ouiDec] = pastillesDeLaQuestionDecennale(d.engageDecennale);')
      && chE.includes('const non3 = d.engageDecennale === false;')
      && chE.includes('const e3 = (etats && etats.q3) || {};') && chE.includes('const etat3 = etatDeLaReponse(e3);')
      && iNonQ3 > 0 && iOuiQ3 > iNonQ3
      && q3Bloc.includes('label={nonDec} choisie={non3} onPress={() => { if (d.engageDecennale !== false) onRepondre({ engageDecennale: false }); }}')
      && q3Bloc.includes('label={ouiDec} choisie={!non3} onPress={() => { if (d.engageDecennale !== true) onRepondre({ engageDecennale: true }); }}')
      && (chE.match(/engageDecennale: (?:true|false)/g) || []).length === 2
      && !/onDemanderConfirmation/.test(q3Bloc) && !/setFeuille|confirm/i.test(q3Bloc)
      && /\{q1 && \([\s\S]*\{q2 && \([\s\S]*\{q3 && \(/.test(chE)
      && q3Bloc.includes('{LE_CHANTIER.q3.sousTitre}') && q3Bloc.includes('{LE_CHANTIER.q3.question}')
      && q3Bloc.includes('{LE_CHANTIER.q3.aide}'),
    q3Bloc.slice(0, 300) || 'bloc de Q3 introuvable');
    verifier('2b-2 : « Le chantier » est une valeur de plus de l’état `carte` (`CARTE_CHANTIER`), sans champ à lire, qui RAMÈNE à la liste '
      + 'quand on y vient d’elle (« Revoir « Le chantier » », le second bouton du point) ; sa rangée vit dans le pied, juste AVANT '
      + '« Conditions », posée sur ses gabarits, et n’existe que si une question au moins est montrée',
    /const CARTE_CHANTIER = 'chantier';/.test(saE)
      && saE.includes('{carte === CARTE_CHANTIER && ( <ChantierDevis')
      /* 2b-3 (E-I1) — DÉCIDÉ : ouverte depuis un point, la carte s'ouvre SUR
         la question que dit `secondeActionDuPoint` (`seconde.question`,
         `'q2'` ou `'q3'`), gardée dans `questionChantier` et passée en
         `questionInitiale` ; ouverte depuis sa rangée, en haut (`null`). */
      && saE.includes("const ouvrirChantierDepuisLaListe = (question = null) => { ouvrirChantier(); setQuestionChantier(question === 'q2' "
        + "|| question === 'q3' ? question : null); poserRetour(CARTE_POUR_REMETTRE); };")
      && saE.includes("const agirAussiSurLePoint = (point, seconde) => { if (seconde && seconde.endroit === 'chantier') "
        + 'ouvrirChantierDepuisLaListe(seconde.question || null); };')
      && saE.includes('onAgirAussi={agirAussiSurLePoint}')
      && /const ouvrirChantier = \(\) => \{ if \(carteRef\.current && carteRef\.current !== CARTE_CHANTIER\) enregistrerCarte\(\); if \(refEntete\.current\) refEntete\.current\.enregistrer\(\); Keyboard\.dismiss\(\); poserRetour\(null\); setQuestionChantier\(null\); poserCarte\(CARTE_CHANTIER\);/.test(saE)
      && saE.includes('questionInitiale={questionChantier}')
      && chE.includes('if (place.current || cle !== questionInitiale || !refDefile.current) return;')
      && chE.includes("onLayout={(e) => ancrer(e, 'q2')}") && chE.includes("onLayout={(e) => ancrer(e, 'q3')}")
      && chE.includes('<ScrollView ref={refDefile}')
      && saE.includes('depuisLaListe={retourCarte === CARTE_POUR_REMETTRE}')
      && BDD.includes('{!!resumeChantier && ( <Pressable onPress={onOuvrirChantier}')
      && BDD.includes('{GABARITS_DU_CHANTIER.map((g, i) => (')
      && BDD.indexOf('{!!resumeChantier && (') > BDD.indexOf('totauxIllisibles')
      && BDD.indexOf('{!!resumeChantier && (') < BDD.indexOf('onPress={onOuvrirConditions}')
      && saE.includes('resumeChantier={resumeChantier} onOuvrirChantier={ouvrirChantier}'),
    BDD.slice(BDD.indexOf('{!!resumeChantier'), BDD.indexOf('{!!resumeChantier') + 160));
    verifier('2b-2 : le point `devis_pour_qui` FERME la carte et ouvre la feuille « À quel titre ? » (cahier §3.6) — la même porte que '
      + 'l’en-tête',
    agir.includes("case 'pour_qui': poserRetour(null); poserCarte(null); if (rappels.current.onCarte) rappels.current.onCarte(null); "
      + 'ouvrirAQuelTitre(); return;'),
    agir.slice(agir.indexOf("case 'pour_qui'"), agir.indexOf("case 'pour_qui'") + 180));
    verifier('2b-2 : les états « en route » / « en échec » de « À quel titre », du chantier et de chaque question sont RECALCULÉS par '
      + '`majAttente` depuis la file (`etatDesChampsDuDevis`) à chaque événement, jamais gardés ; le résumé du chantier porte la date '
      + 'de la BASE (les totaux relus), et seulement quand la base a ce « Oui »',
    saE.includes('etatAQuelTitre: etatDesChampsDuDevis(entrees, CHAMPS_A_QUEL_TITRE), etatChantier: etatDesChampsDuDevis(entrees, '
      + "CHAMPS_DU_CHANTIER), etatQ1: etatDesChampsDuDevis(entrees, ['chantierNeufConso']), etatQ2: etatDesChampsDuDevis(entrees, "
      + "['chantierNeufTva']), etatQ3: etatDesChampsDuDevis(entrees, ['engageDecennale']),")
      && saE.includes('const entrees = f.entreesVoulues();')
      && (saE.match(/etatDesChampsDuDevis\(/g) || []).length === 5
      && saE.includes('f.devis(diff); majAttente(); return { ok, refus };')
      && saE.includes('const dejaVu = totaux && totaux.demande ? totaux.demande : null; const confirmeLe = dejaVu && '
        + 'dejaVu.chantierNeufConso === true ? (dejaVu.chantierNeufConsoLe || null) : null;')
      && saE.includes('const resumeChantier = resumeDuChantier({ devis: { ...devis, chantierNeufConsoLe: confirmeLe }, regime, enRoute: '
        + 'attente.etatChantier.enRoute, enEchec: attente.etatChantier.enEchec, });')
      && saE.includes('etats={{ q1: attente.etatQ1, q2: attente.etatQ2, q3: attente.etatQ3 }}') && saE.includes('confirmeLe={confirmeLe}')
      && !/useState\([^)]*etatAQuelTitre/.test(saE.replace('etatAQuelTitre: AUCUN_ETAT', '')),
    saE.slice(saE.indexOf('etatAQuelTitre: etatDes'), saE.indexOf('etatAQuelTitre: etatDes') + 160));
    verifier('2b-2 : « Conditions » reçoit la réponse « à quel titre » de l’ÉCRAN et le chantier neuf (les aides suivent ce que '
      + 'l’artisan voit), avec la date de la base ; la liste reçoit la réponse que la BASE a vue (`liste.reponseVue`)',
    saE.includes('reponseATitre={pourQuiValable(devis)} chantierNeufConso={devis.chantierNeufConso ?? null} '
      + 'chantierNeufConsoLe={confirmeLe}')
      && saE.includes('reponseVue={liste.reponseVue}')
      && balises(SA, 'PourRemettre').every((b) => /reponseVue=\{liste\.reponseVue\}/.test(b)),
    `${balises(SA, 'PourRemettre').length} balise(s) PourRemettre`);
  }
  /* L'AIDE SOUS UN TAUX RÉDUIT (réponse 3 du 05/11 : « tout permettre ») :
     sous 10 % et 5,5 % seulement, jamais un refus. */
  verifier('l’aide du taux réduit s’affiche sous 10 % et 5,5 % SEULEMENT (une aide, pas un refus)',
    /const TAUX_REDUITS = Object\.freeze\(\[1000, 550\]\);/.test(ECR.carte)
    && /\{TAUX_REDUITS\.includes\(Number\(ligne\.tauxTvaCentiemes\)\) && \( <Text style=\{s\.aide\}>\{AIDE_TAUX_REDUIT\}<\/Text> \)\}/.test(sansEspaces(ECR.carte)));
}

console.log('\n  41. le lot 2b-2 — « à quel titre », le chantier, et ce qu’ils changent au calcul, FAITS TOURNER');
{
  /* POURQUOI (cahier 2b-2, §3.3 et §5.4) : la règle est tenue par la base
     (`motifs_refus_remise`) et rejouée par le miroir sur `cas-remise.json` ;
     ce qui suit tient ce que le fichier ENGENDRÉ ne peut pas tenir — les
     textes EN TOUTES LETTRES (annexes A.1, A.3, A.4, A.6), la garde de la
     réponse valable, et les fonctions pures que l'écran lira. Un sabotage
     qui changerait le miroir ET le fichier engendré ensemble passerait
     sinon (la leçon de PAR-7, 2b-1). */
  const egal = (a, b) => json(a) === json(b);
  const nb = '\u00a0';

  /* a. LES DEUX MOTIFS NOUVEAUX (annexe A.1), mot pour mot, courts, sans
        « lire la suite » ; et la base les écrit de même (`b.` de la
        section 40 compare déjà le SQL au miroir, ici on tient le TEXTE). */
  const PHRASES_2B2 = {
    devis_pour_qui: 'Dites à quel titre ce client commande : selon la réponse, la loi ne demande pas les mêmes mentions sur le '
      + 'devis. Opus le demande pour tous vos devis.',
    devis_taux_reduit_neuf: 'Mettez cette ligne au taux normal, ou changez votre réponse dans « Le chantier » : vous avez '
      + 'répondu que ces travaux font partie d’un chantier qui crée un bâtiment neuf.',
  };
  const phrasesFaussesB2 = Object.entries(PHRASES_2B2).filter(([k, ph]) => {
    const m = D.MOTIFS_DEVIS[k] || {};
    return m.phrase !== ph || ph.length > 200 || D.premierePhrase(ph).suite !== false;
  }).map(([k]) => k);
  verifier('a. les deux motifs de 2b-2 (`devis_pour_qui`, `devis_taux_reduit_neuf`) disent, MOT POUR MOT, la phrase du contrat '
    + '(annexe A.1), en 200 caractères au plus et sans « lire la suite » ; le premier au rang 1 (règle d’Opus), le second au rang 3 '
    + '(prudence)',
  phrasesFaussesB2.length === 0 && D.MOTIFS_DEVIS.devis_pour_qui.rang === 1 && D.MOTIFS_DEVIS.devis_pour_qui.nature === 'regle_opus'
    && D.MOTIFS_DEVIS.devis_taux_reduit_neuf.rang === 3 && D.MOTIFS_DEVIS.devis_taux_reduit_neuf.nature === 'prudence',
  phrasesFaussesB2.join(', '));

  /* b. LA RÉPONSE VALABLE (S45) : elle ne vaut que pour le client qu'elle
        nomme. Le premier jet comparait `pourQuiClient === clientId` : deux
        vides étaient « égaux », et une réponse laissée sur un devis SANS
        client filtrait les mentions de l'entreprise. */
  const V = D.pourQuiValable;
  verifier('b. la réponse « à quel titre » n’est VALABLE que pour le client qu’elle nomme : un client vide, un témoin vide, un autre '
    + 'client ne valent rien — même quand les deux sont vides (S45) ; l’identifiant se compare sans la casse, comme un uuid',
  V({ clientId: null, pourQuiClient: null, pourQui: 'professionnel' }) === null
    && V({ clientId: 'c', pourQuiClient: null, pourQui: 'professionnel' }) === null
    && V({ clientId: null, pourQuiClient: 'c', pourQui: 'professionnel' }) === null
    && V({ clientId: 'c', pourQuiClient: 'd', pourQui: 'professionnel' }) === null
    && V({ clientId: 'c', pourQuiClient: 'c', pourQui: 'professionnel' }) === 'professionnel'
    && V({ clientId: 'AB-1', pourQuiClient: 'ab-1', pourQui: 'consommateur' }) === 'consommateur'
    && V({ clientId: 'c', pourQuiClient: 'c', pourQui: null }) === null && V(null) === null && V(undefined) === null);

  /* c. LE RANG 1 EST EXCLUSIF, et LE FILTRE DE L'ENTREPRISE (cahier §3.3) :
        `devis_pour_qui` ne sort qu'avec un client et sans réponse valable,
        jamais avec `devis_client` (S1) ; « pour son entreprise, dans son
        activité principale » retire les `conso_` sauf les deux adresses ;
        les rangs restent TROUÉS (le filtre passe APRÈS le rang, S5) ; la
        nature d'un `conso_` gardé est une prudence pour une association ou
        une entreprise dans son activité ; les règles d'Opus le restent. */
  const ENT = ['identite: a', 'conso_adresse_etablissement: b', 'conso_mediateur: c', 'conso_adresse_siege: d',
    'frais_deplacement: e', 'conso_tva_intra: f', 'consomme_x: g'];
  /* 2b-3 : « Non » à la décennale — le rang 11 se tait, ces cas ne parlent
     que du rang 1 et de l'entreprise. */
  const DEV = { clientId: 'c', lieuVille: 'Brest', delaiExecution: 'x', validiteJours: 30, engageDecennale: false };
  const POSTE = { id: 'p', type: 'poste', tauxTvaCentiemes: 2000, ordre: 1000 };
  const avec = (pq, autre = {}) => D.motifsDeRemise({ devis: { ...DEV, pourQui: pq, pourQuiClient: pq ? 'c' : null, ...autre },
    lignes: [POSTE], regime: 'reel', motifsEmetteur: ENT }).map((m) => [m.rang, m.cle, m.nature]);
  const ENT_LOI = [[101, 'identite', 'loi'], [102, 'conso_adresse_etablissement', 'loi'], [103, 'conso_mediateur', 'loi'],
    [104, 'conso_adresse_siege', 'loi'], [105, 'frais_deplacement', 'regle_opus'], [106, 'conso_tva_intra', 'regle_opus'],
    [107, 'consomme_x', 'loi']];
  const pro = avec('professionnel');
  verifier('c. le rang 1 est EXCLUSIF (`devis_client` OU `devis_pour_qui`, S1) ; « pour son entreprise » ne garde des `conso_` que les '
    + 'deux adresses, en PRUDENCE, aux rangs TROUÉS (filtre après le rang, S5) ; une association garde tout, ses `conso_` en '
    + 'prudence ; une réponse privée ou une petite entreprise hors de son activité gardent tout, en loi ; « consomme_x » n’est '
    + 'pas un `conso_` (S6) ; les règles d’Opus restent des règles d’Opus',
  egal(avec(null), [[1, 'devis_pour_qui', 'regle_opus'], ...ENT_LOI])
    && egal(avec(null, { clientId: null }).filter((x) => x[0] < 100).map((x) => x[1]), ['devis_client'])
    && egal(avec('consommateur'), ENT_LOI) && egal(avec('professionnel_hors_activite'), ENT_LOI)
    && egal(avec('non_professionnel').map((x) => x[2]), ['loi', 'prudence', 'prudence', 'prudence', 'regle_opus', 'regle_opus', 'loi'])
    && egal(pro, [[101, 'identite', 'loi'], [102, 'conso_adresse_etablissement', 'prudence'], [104, 'conso_adresse_siege', 'prudence'],
      [105, 'frais_deplacement', 'regle_opus'], [107, 'consomme_x', 'loi']])
    /* Une réponse donnée pour un AUTRE client ne filtre rien, et rouvre la question. */
    && egal(avec('professionnel', { pourQuiClient: 'autre' }), [[1, 'devis_pour_qui', 'regle_opus'], ...ENT_LOI])
    && D.natureDuMotifEntreprise('conso_mediateur', 'professionnel') === 'prudence'
    && D.natureDuMotifEntreprise('conso_mediateur', 'consommateur') === 'loi'
    && D.natureDuMotifEntreprise('conso_mediateur') === 'loi'
    && D.natureDuMotifEntreprise('conso_tva_intra', 'professionnel') === 'regle_opus'
    && D.natureDuMotifEntreprise('conso_profession_reglementee', 'consommateur') === 'prudence'
    && egal([...D.MENTIONS_GARDEES_POUR_UN_PRO].sort(), ['conso_adresse_etablissement', 'conso_adresse_siege']),
  json(pro));

  /* d. LE RANG 3 DU CHANTIER NEUF (S8) : au réel et `chantierNeufTva`
        VRAI seulement, un poste ou une option à 10 % ou 5,5 %, offerte
        comprise ; une clé par ligne, rangée parmi les autres clés du rang 3
        dans l'ordre `ordre, id`. Ni en franchise, ni pour une réponse vide ou
        fausse, ni pour une chaîne « true ». */
  const lr = (id, type, t, ordre, plus = {}) => ({ id, type, tauxTvaCentiemes: t, ordre, prixUnitaireCentimes: 100, ...plus });
  const r3 = (regime, tva, lignes) => D.motifsDeRemise({ devis: { ...DEV, pourQui: 'consommateur', pourQuiClient: 'c', chantierNeufTva: tva },
    lignes, regime }).filter((m) => m.rang === 3).map((m) => `${m.cle}:${m.nature}:${m.ligneId}`).join();
  const lignesNeuf = [lr('b', 'poste', 1000, 2), lr('a', 'option', 550, 2, { offert: true }), lr('c', 'poste', 0, 1),
    lr('d', 'poste', 2000, 3), lr('e', 'reserve', 550, 4), lr('f', 'piece', 1000, 5)];
  verifier('d. `devis_taux_reduit_neuf` : au réel ET « crée un bâtiment neuf » VRAI, chaque poste ou option à 10 % ou 5,5 % (offerte '
    + 'comprise), une ligne par ligne, rangée avec `devis_taux_sans_tva` dans l’ordre `ordre, id` ; faux, vide, « true » écrit en '
    + 'chaîne, ou en franchise : rien (S8)',
  r3('reel', true, lignesNeuf) === 'devis_taux_sans_tva:prudence:c,devis_taux_reduit_neuf:prudence:a,devis_taux_reduit_neuf:prudence:b'
    && r3('reel', false, lignesNeuf) === 'devis_taux_sans_tva:prudence:c' && r3('reel', null, lignesNeuf) === 'devis_taux_sans_tva:prudence:c'
    && r3('reel', 'true', lignesNeuf) === 'devis_taux_sans_tva:prudence:c'
    && r3('franchise', true, [lr('b', 'poste', 1000, 2)]) === 'devis_taux_franchise:loi:b'
    && r3(null, true, [lr('b', 'poste', 1000, 2)]) === ''
    && D.cleDuTauxDeLaLigne(lr('x', 'poste', 550, 1), 'reel', true) === 'devis_taux_reduit_neuf'
    && D.cleDuTauxDeLaLigne(lr('x', 'poste', 2000, 1), 'reel', true) === null
    && D.cleDuTauxDeLaLigne(lr('x', 'poste', 0, 1), 'reel', true) === 'devis_taux_sans_tva',
  r3('reel', true, lignesNeuf));

  /* e. LE 8e JOUR ET SES VARIANTES (annexe A.6, §3.5), et QUI LES CHOISIT :
        les variantes sont comparées mot pour mot plus haut (section 35,
        `AIDES_DE_DROIT_ATTENDUES`) ; ici, la phrase datée du chantier neuf
        et le choix par la réponse de l'écran. « professionnel » : ni le 8e
        jour, ni la rétractation ; le chantier neuf l'emporte sur la prudence
        d'une association (ce qui écarte la règle pour un consommateur
        l'écarte a fortiori — un choix, dit dans le compte rendu). */
  const SUITE_NEUF = 'ce devis porte sur la construction d’un bâtiment neuf ou la transformation importante d’un bâtiment '
    + 'existant : la règle du 8e jour ne s’applique pas à ces chantiers. Si ce n’est pas vraiment le cas, revenez à « Non » dans '
    + '« Le chantier » : un paiement reçu trop tôt permettrait au client d’annuler le contrat.';
  const neufDate = D.echeanceAcompteChantierNeuf('2026-11-08T08:00:00Z');
  const A = D.aidesDeLAcompte;
  const ordinaire = { nature: D.AIDE_NATURE_ACOMPTE, echeance: D.ECHEANCE_ACOMPTE };
  verifier('e. l’aide du 8e jour suit la réponse de l’ÉCRAN : « pour son entreprise » n’a ni 8e jour ni rétractation '
    + '(`AIDE_NATURE_ACOMPTE_PRO`) ; « Oui » au bâtiment neuf dit « Vous avez indiqué le JJ/MM/AAAA » avec la date de la BASE, '
    + '« Vous venez d’indiquer » avant qu’elle soit relue ; tout urgent, à titre privé ou pour une association, '
    + '`ECHEANCE_ACOMPTE_URGENCE` (2b-3) ; une association, la prudence, nature comprise (T7) ; sinon `ECHEANCE_ACOMPTE`',
  neufDate === `Vous avez indiqué le 08/11/2026 que ${SUITE_NEUF}`
    && D.echeanceAcompteChantierNeuf(null) === `Vous venez d’indiquer que ${SUITE_NEUF}`
    && egal(A({ reponse: 'professionnel', chantierNeufConso: true }), { nature: D.AIDE_NATURE_ACOMPTE_PRO, echeance: null })
    && egal(A({ reponse: 'consommateur', chantierNeufConso: true, chantierNeufConsoLe: '2026-11-08T08:00:00Z' }),
      { nature: D.AIDE_NATURE_ACOMPTE, echeance: neufDate })
    && egal(A({ reponse: 'non_professionnel', chantierNeufConso: true }), { nature: D.AIDE_NATURE_ACOMPTE,
      echeance: `Vous venez d’indiquer que ${SUITE_NEUF}` })
    /* 2b-3, T7 : la nature d'une association ne promet plus 14 jours de
       rétractation — `AIDE_NATURE_ACOMPTE_PRUDENCE`. */
    && egal(A({ reponse: 'non_professionnel' }), { nature: D.AIDE_NATURE_ACOMPTE_PRUDENCE, echeance: D.ECHEANCE_ACOMPTE_PRUDENCE })
    && egal(A({ reponse: 'professionnel_hors_activite' }), ordinaire) && egal(A({ reponse: 'consommateur' }), ordinaire)
    /* 2b-3, D8 : tout urgent — à titre privé, l'aide ordinaire de la nature ;
       pour une association, ni « rendez-lui tout », ni « 14 jours » ; pour
       une petite entreprise ou sans réponse, l'urgence ne change rien ; le
       chantier neuf et « pour son entreprise » passent avant. */
    && egal(A({ reponse: 'consommateur', toutUrgent: true }), { nature: D.AIDE_NATURE_ACOMPTE, echeance: D.ECHEANCE_ACOMPTE_URGENCE })
    && egal(A({ reponse: 'non_professionnel', toutUrgent: true }), { nature: D.AIDE_NATURE_ACOMPTE_PRO, echeance: D.ECHEANCE_ACOMPTE_URGENCE })
    && egal(A({ reponse: 'professionnel_hors_activite', toutUrgent: true }), ordinaire) && egal(A({ toutUrgent: true }), ordinaire)
    && egal(A({ reponse: 'professionnel', toutUrgent: true }), { nature: D.AIDE_NATURE_ACOMPTE_PRO, echeance: null })
    && egal(A({ reponse: 'consommateur', toutUrgent: true, chantierNeufConso: true }), { nature: D.AIDE_NATURE_ACOMPTE,
      echeance: `Vous venez d’indiquer que ${SUITE_NEUF}` })
    && egal(A({ reponse: 'consommateur', toutUrgent: 'true' }), ordinaire)
    && egal(A({ chantierNeufConso: false }), ordinaire) && egal(A(), ordinaire)
    && !/rétract|L\.\s221/.test(D.AIDE_NATURE_ACOMPTE_PRO) && !/€|20\d\d/.test(D.ECHEANCE_ACOMPTE_PRUDENCE + SUITE_NEUF),
  json([neufDate, A({ reponse: 'non_professionnel', chantierNeufConso: true })]));

  /* f. « À QUEL TITRE ? » (annexe A.3) : les textes, l'ordre de la feuille
        (du plus protecteur au moins protecteur, « pour son entreprise » en
        DERNIER, avec « Dans le doute… », S39), la liste de la base. */
  const REPONSES_ATTENDUES = [
    { valeur: 'consommateur', rangee: 'À titre privé, pour lui-même', aide: null, resume: 'à titre privé' },
    { valeur: 'non_professionnel', rangee: 'Pour une association, une copropriété ou une société civile',
      aide: 'Sans activité professionnelle : une SCI familiale, un syndicat de copropriétaires (même représenté par un syndic '
        + 'professionnel), une association. Opus leur compte, par prudence, les mentions dues à un particulier.',
      resume: 'pour une association, une copropriété ou une société civile' },
    { valeur: 'professionnel_hors_activite', rangee: `Pour son entreprise de 5${nb}salariés au plus, hors de son activité principale`,
      aide: 'Par exemple, une boulangerie qui fait refaire sa vitrine. Quand le devis est signé hors de vos locaux, la loi la protège '
        + 'comme un particulier (sauf pour un bâtiment neuf ou une transformation importante) ; Opus lui compte, par prudence, '
        + 'toutes les mentions dues à un particulier.',
      resume: `pour son entreprise (5${nb}salariés au plus), hors de son activité principale` },
    { valeur: 'professionnel', rangee: `Pour son entreprise, dans son activité principale, ou une entreprise de plus de 5${nb}salariés`,
      aide: `Par exemple, un autre artisan qui vous sous-traite une partie de son chantier, ou un commerce de plus de 5${nb}salariés. `
        + 'La plupart des mentions dues à un particulier ne sont alors plus comptées. Dans le doute, choisissez une autre réponse : '
        + 'c’est la plus sûre.',
      resume: `pour son entreprise, dans son activité principale (ou plus de 5${nb}salariés)` },
  ];
  const A_QUEL_TITRE_ATTENDU = {
    sousTitre: 'À quel titre ?', question: 'À quel titre ce client commande-t-il ?',
    proposition: 'Au carnet : particulier. Commande-t-il à titre privé ?', prefixeReponse: 'Commande : ', repondre: 'Répondre',
    autreReponse: 'Autre réponse', ouiATitrePrive: 'Oui, à titre privé', changer: 'Changer',
    titreFeuille: 'À quel titre ce client commande-t-il ?',
  };
  const valeursSql = listeDe('devis_pour_qui_check', 'pour_qui');
  verifier('f. « À quel titre ? » : les textes du bloc et de la feuille, MOT POUR MOT (annexe A.3, « 5 salariés » insécable) ; la '
    + 'feuille va du plus protecteur au moins protecteur, « pour son entreprise » en DERNIER avec « Dans le doute… » (S39) ; ses '
    + 'quatre valeurs sont celles de `devis_pour_qui_check` (l’ordre de la contrainte ne compte pas, celui de la feuille si) ; les '
    + 'suffixes d’état',
  egal(D.REPONSES_A_QUEL_TITRE, REPONSES_ATTENDUES) && egal(D.A_QUEL_TITRE, A_QUEL_TITRE_ATTENDU)
    && egal(D.REPONSES_A_QUEL_TITRE.map((r) => r.valeur), [...D.POUR_QUI]) && egal([...(valeursSql || [])].sort(), [...D.POUR_QUI].sort())
    && /^Dans le doute|Dans le doute, choisissez une autre réponse : c’est la plus sûre\.$/.test(D.REPONSES_A_QUEL_TITRE[3].aide)
    && D.SUFFIXE_EN_ROUTE === ' — enregistrement…' && D.SUFFIXE_EN_ECHEC === ' — pas enregistré'
    && D.resumeDeLaReponse('non_professionnel') === REPONSES_ATTENDUES[1].resume && D.resumeDeLaReponse('x') === null,
  `${json(valeursSql)} ; ${json(D.REPONSES_A_QUEL_TITRE.map((r) => r.valeur))}`);

  /* g. LE BLOC « À QUEL TITRE ? » DIT CE QUE LA BASE A, ET NE RÉPOND
        JAMAIS SANS APPUI (S32, S33) : la moitié gauche n'écrit RIEN (elle
        ouvre la feuille) ; seule la droite d'une PROPOSITION écrit, et
        seulement « à titre privé » ; la proposition n'existe que pour une
        fiche LUE « particulier » (un type absent pose la question, S42) ;
        une réponse pour un autre client rouvre la question ; les suffixes
        viennent de l'état de la file, jamais d'une mémoire (S35). */
  const cl = { nom: 'X', type: 'particulier', siret: null };
  const R = (devis, client, plus = {}) => D.resumeAQuelTitre({ devis, client, ...plus });
  const tous = [
    R({ clientId: 'c' }, cl), R({ clientId: 'c' }, { nom: 'S', type: 'entreprise' }), R({ clientId: 'c' }, { nom: 'S' }),
    R({ clientId: 'c' }, null), R({ clientId: 'c', pourQui: 'consommateur', pourQuiClient: 'autre' }, cl),
    ...D.POUR_QUI.flatMap((v) => [R({ clientId: 'c', pourQui: v, pourQuiClient: 'c' }, cl),
      R({ clientId: 'c', pourQui: v, pourQuiClient: 'c' }, cl, { enRoute: true }),
      R({ clientId: 'c', pourQui: v, pourQuiClient: 'c' }, cl, { enEchec: true })]),
  ];
  const ecritSansAppui = tous.filter((r) => !r || r.gauche.ecrit !== false || (r.droite && (r.etat !== 'proposition'
    || r.droite.ecrit !== true || r.droite.pourQui !== 'consommateur' || r.droite.libelle !== 'Oui, à titre privé'))).length;
  verifier('g. le bloc « À quel titre ? » : sans client, rien ; une fiche LUE « particulier » sans réponse PROPOSE « à titre privé » '
    + '(seule la droite écrit, S32 ; la gauche « Autre réponse » n’écrit rien, S33) — même quand la réponse rangée était pour un '
    + 'AUTRE client ; une entreprise ou un type absent POSENT la question (« Répondre ») ; une réponse valable se lit « Commande : … » avec '
    + '« Changer », et son état d’envoi en suffixe ; chaque texte possible est un GABARIT (la hauteur ne change pas, S34)',
  R({}, cl) === null && R(null, cl) === null && ecritSansAppui === 0
    && tous[0].etat === 'proposition' && tous[0].texte === A_QUEL_TITRE_ATTENDU.proposition && tous[0].gauche.libelle === 'Autre réponse'
    && [tous[1], tous[2], tous[3]].every((r) => r.etat === 'question' && r.texte === A_QUEL_TITRE_ATTENDU.question
      && r.gauche.libelle === 'Répondre' && r.droite === null)
    && tous[4].etat === 'proposition' && tous[4].reponse === null
    && R({ clientId: 'c', pourQui: 'professionnel', pourQuiClient: 'autre' }, { nom: 'S', type: 'entreprise' }).etat === 'question'
    && tous[5].etat === 'reponse' && tous[5].texte === 'Commande : à titre privé' && tous[5].gauche.libelle === 'Changer'
    && tous[6].texte === 'Commande : à titre privé — enregistrement…' && tous[7].texte === 'Commande : à titre privé — pas enregistré'
    && R({ clientId: 'c' }, undefined) !== null && R({ clientId: 'c', client: cl }, undefined).etat === 'proposition'
    && tous.every((r) => D.GABARITS_A_QUEL_TITRE.includes(r.texte))
    && D.GABARITS_A_QUEL_TITRE.length === 2 + 3 * D.POUR_QUI.length,
  json(tous.map((r) => r && r.texte)));

  /* h. L'ÉTAT D'ENVOI DES CHAMPS (S35) : lu dans la file, champ par champ —
        une valeur voulue qui diffère de la valeur confirmée est en route,
        en échec ou locale ; une valeur égale ne l'est pas ; une colonne
        INCONNUE (issue perdue) n'est jamais « enregistrée ». */
  const E = (entree, champs = D.CHAMPS_A_QUEL_TITRE) => D.etatDesChampsDuDevis([{ cle: 'devis', ...entree }], champs);
  const rien = { enRoute: false, enEchec: false, local: false };
  verifier('h. `etatDesChampsDuDevis` : en route, en échec, local — seulement si un champ du bloc DIFFÈRE de ce que la base a '
    + 'confirmé, ou si son issue est INCONNUE ; un autre champ en route ne touche pas le bloc ; les champs du bloc sont le client '
    + 'du devis, la réponse et le client pour lequel elle est donnée, ceux du chantier ses trois questions (la décennale, 2b-3)',
  egal(E({ voulu: { pourQui: 'consommateur' }, confirme: { pourQui: null }, etat: 'en_cours' }), { ...rien, enRoute: true })
    && egal(E({ voulu: { pourQui: 'consommateur' }, confirme: {}, etat: 'echec' }), { ...rien, enEchec: true })
    && egal(E({ voulu: { pourQuiClient: 'c' }, etat: 'locale' }), { ...rien, local: true })
    && egal(E({ voulu: { pourQui: 'consommateur' }, confirme: { pourQui: 'consommateur' }, etat: 'en_cours' }), rien)
    && egal(E({ voulu: { objet: 'x' }, confirme: {}, etat: 'en_cours' }), rien)
    && egal(E({ voulu: { pourQui: 'consommateur' }, confirme: { pourQui: 'consommateur' }, etat: 'echec', inconnues: ['pourQui'] }),
      { ...rien, enEchec: true })
    && egal(D.etatDesChampsDuDevis([], D.CHAMPS_A_QUEL_TITRE), rien) && egal(D.etatDesChampsDuDevis(null, null), rien)
    && egal(E({ voulu: { clientId: 'd' }, confirme: { clientId: 'c' }, etat: 'en_cours' }), { ...rien, enRoute: true })
    && egal([...D.CHAMPS_A_QUEL_TITRE], ['clientId', 'pourQui', 'pourQuiClient'])
    /* 2b-3 (E-I6) : la question de la décennale est un champ du chantier —
       sa réponse en route se dit sur la rangée « Le chantier ». */
    && egal([...D.CHAMPS_DU_CHANTIER], ['chantierNeufConso', 'chantierNeufTva', 'engageDecennale'])
    && egal(E({ voulu: { engageDecennale: false }, confirme: { engageDecennale: null }, etat: 'en_cours' }, D.CHAMPS_DU_CHANTIER),
      { ...rien, enRoute: true }),
  json(E({ voulu: { pourQui: 'consommateur' }, confirme: { pourQui: null }, etat: 'en_cours' })));

  /* i. LES MENTIONS DUES À UN PARTICULIER ET LES AVIS (annexe A.3) : la
        phrase est choisie par la réponse que la BASE a vue (l'écran la lui
        passe, `liste.reponseVue`, S36) ; inconnue, la prudence
        d'aujourd'hui. Les avis ne sont jamais bloquants. */
  const MENTIONS_ATTENDUES = {
    consommateur: 'Ce client commande à titre privé : la loi demande de lui communiquer ces informations, et Opus les imprime sur le devis.',
    non_professionnel: 'Une association, une copropriété ou une société civile sans activité professionnelle : la loi ne demande '
      + 'peut-être pas ces mentions pour elle ; Opus les compte, par prudence.',
    professionnel_hors_activite: `Ce client commande pour son entreprise de 5${nb}salariés au plus, hors de son activité principale : `
      + 'quand le devis est signé hors de vos locaux, la loi lui doit ces mentions comme à un particulier (sauf pour un bâtiment neuf '
      + 'ou une transformation importante). Opus les compte toutes, par prudence.',
    professionnel: 'Ce client commande pour son entreprise : Opus ne garde que l’adresse de votre établissement ou de votre siège, '
      + 'par prudence — la loi la demande peut-être sur tous vos devis.',
  };
  const av = (reponseVue, client) => D.avisDuDevis({ devis: { objet: 'x' }, client, reponseVue }).map((a) => a.cle).join();
  verifier('i. les mentions dues à un particulier disent la réponse VUE par la base (annexe A.3, mot pour mot ; inconnue : la '
    + 'prudence d’aujourd’hui) ; les avis de la fiche ne sortent que pour une entreprise : SIRET absent, ou fiche rangée parmi les '
    + 'particuliers — jamais pour un type absent, ni pour une réponse privée',
  egal(D.MENTIONS_PARTICULIER_SELON_LA_REPONSE, MENTIONS_ATTENDUES)
    && D.POUR_QUI.every((v) => D.phraseDesMentionsParticulier(v) === MENTIONS_ATTENDUES[v])
    && [null, undefined, 'x'].every((v) => D.phraseDesMentionsParticulier(v) === D.MENTIONS_PARTICULIER_PAR_PRUDENCE)
    && av('professionnel', { type: 'entreprise', siret: null }) === 'avis_siret_client'
    && av('professionnel', { type: 'entreprise', siret: `  ${nb}` }) === 'avis_siret_client'
    && av('professionnel_hors_activite', { type: 'entreprise', siret: null }) === 'avis_siret_client'
    && av('professionnel', { type: 'entreprise', siret: '12345678900012' }) === ''
    && av('professionnel_hors_activite', { type: 'particulier' }) === 'avis_fiche_particulier'
    && av('professionnel', { type: null }) === '' && av('professionnel', null) === ''
    && av('consommateur', { type: 'particulier' }) === '' && av('non_professionnel', { type: 'entreprise' }) === ''
    && av(null, { type: 'entreprise' }) === '',
  json([av('professionnel', { type: 'entreprise', siret: null }), av('professionnel_hors_activite', { type: 'particulier' })]));

  /* j. « LE CHANTIER » (annexe A.4) : les textes MOT POUR MOT, sans
        « font du neuf » ni « Un bâtiment récent n’est pas en cause » (S41) ;
        la première question cachée pour une réponse VALABLE « pour son
        entreprise » ; la seconde au réel, ou quand elle vaut déjà « Oui » ;
        les résumés, et chacun est un GABARIT, la date la plus large
        comprise. */
  const LE_CHANTIER_ATTENDU = {
    titre: 'Le chantier',
    /* 2b-3 (annexe A.3) : TROIS questions. */
    introduction: 'Ces questions sont indépendantes : on peut répondre « Oui » à l’une et « Non » à une autre.',
    ordinaire: 'Chantier ordinaire',
    q1: {
      sousTitre: 'Pour les droits de votre client',
      question: 'Ce devis porte-t-il sur la construction d’un bâtiment neuf, ou sur la transformation importante d’un bâtiment existant ?',
      non: 'Non', oui: 'Oui',
      aide: `Ces chantiers échappent aux règles du devis signé hors de vos locaux : 14${nb}jours pour se rétracter, formulaire de `
        + 'rétractation, aucun paiement avant le 8e jour. Une réparation, un entretien ou une rénovation ordinaire n’en font pas '
        + 'partie. Si vous ne faites qu’une partie des travaux d’un bâtiment neuf (l’électricité, la plomberie…), la loi ne dit pas '
        + 'clairement que votre devis en fait partie. Dans le doute, gardez « Non » : c’est le cas le plus sûr.',
    },
    confirmation: {
      titre: 'Bâtiment neuf ou transformation importante',
      paragraphes: [
        `Dans ce cas, le devis n’aura pas de formulaire de rétractation, ne laissera pas 14${nb}jours au client pour changer d’avis, `
          + 'et la règle du 8e jour ne s’appliquera pas.',
        'Si ce n’est pas vraiment le cas, c’est vous qui prenez le risque : le client garde le droit de se rétracter pendant douze '
          + 'mois de plus ; un paiement reçu avant le 8e jour permet d’annuler le contrat ; et la loi punit ces manquements jusqu’à '
          + `deux ans d’emprisonnement et 150${nb}000${nb}€ d’amende.`,
        'La loi ne définit pas la « transformation importante », et ne dit pas clairement qu’un devis pour une partie seulement des '
          + 'travaux d’un bâtiment neuf en fait partie. Dans le doute, gardez « Non ».',
      ],
      garder: 'Garder « Non »', confirmer: 'Je confirme',
    },
    q2: {
      sousTitre: 'Pour la TVA',
      question: 'Ces travaux font-ils partie d’un chantier qui crée un bâtiment neuf ?',
      nonParDefaut: 'Non (par défaut)', non: 'Non', oui: 'Oui',
      aide: 'C’est le cas si vos travaux font partie, même pour un seul corps d’état, d’un chantier qui construit un bâtiment ou le '
        + 'surélève, qui refait la majorité de ses fondations, de sa structure ou de ses façades (hors ravalement), ou la plus grande '
        + 'partie de chacun des éléments de son second œuvre, ou qui augmente sa surface de plancher de plus de '
        + `10${nb}% — en comptant tous les travaux faits sur deux ans, par vous ou par d’autres. La TVA est alors au taux normal. Ce `
        + 'sont les travaux qui comptent, pas l’âge du bâtiment — mais le taux réduit demande, en plus, un logement achevé depuis '
        + 'plus de deux ans.',
    },
    /* 2b-3 (réponse P1 du 12/11, annexe A.3) : la décennale, UNE question par
       devis — vide = « Oui », par prudence. */
    q3: {
      sousTitre: 'Pour votre assurance',
      question: 'Ces travaux peuvent-ils engager votre garantie décennale ?',
      non: 'Non', ouiParDefaut: 'Oui (par défaut)', oui: 'Oui',
      aide: '« Oui » si ces travaux construisent ou refont un ouvrage, ou un élément qui fait corps avec lui — un mur, une dalle, '
        + 'une charpente, une toiture… —, même sur un bâtiment existant : la loi demande alors de joindre votre attestation décennale '
        + `au devis, et pas seulement pour un particulier (code des assurances, L.${nb}243-2). « Non » pour un dépannage ou un `
        + 'entretien qui ne crée ni ne refait aucun ouvrage. En sous-traitance, ou pour certains ouvrages que la loi exclut (voirie, '
        + 'réseaux…), elle ne la demande peut-être pas. Dans le doute, gardez « Oui » : c’est le cas le plus sûr.',
    },
  };
  const textesChantier = json(D.LE_CHANTIER);
  const RC = (devis, regime = 'reel', plus = {}) => D.resumeDuChantier({ devis, regime, ...plus });
  const LE = '2026-11-08T08:00:00Z';
  const resumes = [RC({}), RC({ chantierNeufConso: false, chantierNeufTva: false }), RC({ chantierNeufConso: true, chantierNeufConsoLe: LE }),
    RC({ chantierNeufConso: true }), RC({ chantierNeufTva: true }), RC({ chantierNeufConso: true, chantierNeufConsoLe: LE, chantierNeufTva: true }),
    RC({ chantierNeufConso: true, chantierNeufTva: true }), RC({}, 'reel', { enRoute: true }), RC({ chantierNeufTva: true }, 'reel', { enEchec: true })];
  /* 2b-3 (annexe A.3, M1 écran) : la partie de la décennale APRÈS celle des
     deux premières (vide : rien) ; seule quand les deux premières sont
     cachées (« pour son entreprise » en franchise) ; puis l'état d'envoi. */
  const proV = { clientId: 'c', pourQui: 'professionnel', pourQuiClient: 'c' };
  const resumesDec = [RC({ engageDecennale: true }), RC({ engageDecennale: false }),
    RC({ chantierNeufConso: true, chantierNeufConsoLe: LE, chantierNeufTva: true, engageDecennale: false }, 'reel', { enEchec: true }),
    RC(proV, 'franchise'), RC({ ...proV, engageDecennale: true }, 'franchise'),
    RC({ ...proV, engageDecennale: false }, 'franchise', { enRoute: true }), RC({ ...proV, engageDecennale: 'true' }, 'franchise')];
  const Q = (devis, regime) => D.questionsDuChantier({ devis, regime });
  const proValable = { clientId: 'c', pourQui: 'professionnel', pourQuiClient: 'c' };
  const largeDate = (t) => String(t).replace(/\d{2}\/\d{2}\/\d{4}/g, '44/44/4444');
  verifier('j. « Le chantier » : les textes MOT POUR MOT (annexe A.4, et A.3 de 2b-3 : la décennale, insécables comprises), sans « font du '
    + 'neuf » ni « Un bâtiment récent n’est pas en cause » (S41) ; la question 1 cachée pour une réponse VALABLE « pour son entreprise » ; '
    + 'la question 2 au réel ou quand elle vaut déjà « Oui » ; la question 3 TOUJOURS ; les résumés (« Chantier ordinaire », la date de la '
    + 'BASE, « taux normal de TVA », « ; décennale : … », la décennale seule) et leur état d’envoi, chacun un GABARIT à la date la plus '
    + 'large ; « Non (par défaut) » tant que la réponse TVA est vide, « Oui (par défaut) » tant que la décennale l’est',
  egal(D.LE_CHANTIER, LE_CHANTIER_ATTENDU) && !/font du neuf|Un bâtiment récent n’est pas en cause/.test(textesChantier)
    && egal(resumes, ['Chantier ordinaire', 'Chantier ordinaire', 'Bâtiment neuf ou transformation importante, confirmé le 08/11/2026',
      'Bâtiment neuf ou transformation importante', 'Crée un bâtiment neuf : taux normal de TVA',
      'Bâtiment neuf, confirmé le 08/11/2026 ; taux normal de TVA', 'Bâtiment neuf ; taux normal de TVA',
      'Chantier ordinaire — enregistrement…', 'Crée un bâtiment neuf : taux normal de TVA — pas enregistré'])
    && resumes.every((t) => D.GABARITS_DU_CHANTIER.includes(largeDate(t)))
    && egal(resumesDec, ['Chantier ordinaire ; décennale : oui', 'Chantier ordinaire ; décennale : non',
      'Bâtiment neuf, confirmé le 08/11/2026 ; taux normal de TVA ; décennale : non — pas enregistré',
      'Décennale : oui (par défaut)', 'Décennale : oui', 'Décennale : non — enregistrement…', 'Décennale : oui (par défaut)'])
    && resumesDec.every((t) => D.GABARITS_DU_CHANTIER.includes(largeDate(t)))
    && D.GABARITS_DU_CHANTIER.length === (6 * 3 + 3) * 3
    /* 2b-3 : la question de la décennale est TOUJOURS montrée, donc la
       rangée aussi (la loi la demande quel que soit le client). */
    && egal(Q({}, 'reel'), { q1: true, q2: true, q3: true, rangee: true }) && egal(Q({}, 'franchise'), { q1: true, q2: false, q3: true, rangee: true })
    && egal(Q({ chantierNeufTva: true }, 'franchise'), { q1: true, q2: true, q3: true, rangee: true })
    && egal(Q(proValable, 'reel'), { q1: false, q2: true, q3: true, rangee: true })
    && egal(Q(proValable, 'franchise'), { q1: false, q2: false, q3: true, rangee: true })
    && egal(Q({ ...proValable, pourQuiClient: 'autre' }, 'franchise'), { q1: true, q2: false, q3: true, rangee: true })
    && egal(D.pastillesDeLaQuestionTva(null), ['Non (par défaut)', 'Oui']) && egal(D.pastillesDeLaQuestionTva(false), ['Non', 'Oui'])
    && egal(D.pastillesDeLaQuestionTva(true), ['Non', 'Oui'])
    /* « Non » à GAUCHE, comme les deux autres (E-I3) ; « Oui (par défaut) »
       tant que la réponse est vide. */
    && egal(D.pastillesDeLaQuestionDecennale(null), ['Non', 'Oui (par défaut)'])
    && egal(D.pastillesDeLaQuestionDecennale(undefined), ['Non', 'Oui (par défaut)'])
    && egal(D.pastillesDeLaQuestionDecennale(true), ['Non', 'Oui']) && egal(D.pastillesDeLaQuestionDecennale(false), ['Non', 'Oui'])
    /* L'aide de la décennale garde son insécable, ÉCRITE en séquence. */
    && /L\.\\u00a0243-2/.test(lire('src/lib/devis.js')),
  json([...resumes, ...resumesDec]));

  /* k. LE SECOND BOUTON ET L'ENDROIT (cahier §3.6) : `devis_pour_qui` mène
        au bloc « À quel titre ? » ; `devis_taux_reduit_neuf` à SA ligne, et
        un second bouton « Revoir « Le chantier » » ; aucun autre motif n'en
        porte. */
  const pt = (cle, ligneId = null) => ({ cle, endroit: D.endroitDuMotif({ cle, ligneId }) });
  verifier('k. les points : « Dites à quel titre » mène au bloc « À quel titre ? » (« Répondre ») ; le taux réduit d’un chantier '
    + 'neuf mène à SA ligne ET porte un second bouton « Revoir « Le chantier » » (sur la question TVA) ; la décennale sans réponse '
    + 'porte « Répondre dans « Le chantier » » (sur SA question, 2b-3) ; aucun autre motif n’en porte',
  egal(D.endroitDuMotif({ cle: 'devis_pour_qui' }), { endroit: 'pour_qui' })
    && egal(D.endroitDuMotif({ cle: 'devis_taux_reduit_neuf', ligneId: 'l' }), { endroit: 'ligne', ligneId: 'l', aussi: 'chantier' })
    && egal(D.secondeActionDuPoint(pt('devis_taux_reduit_neuf', 'l')), { libelle: 'Revoir « Le chantier »', aDire: 'Revoir « Le chantier »',
      endroit: 'chantier', question: 'q2' })
    /* 2b-3 (E-I1, E-I4) : la décennale SANS réponse porte un second bouton,
       « Répondre dans « Le chantier » », qui ouvre la carte SUR sa question ;
       l'attestation absente ou sans date, aucun (l'artisan a dit « Oui »). */
    && egal(D.secondeActionDuPoint(pt('devis_decennale')), { libelle: 'Répondre dans « Le chantier »',
      aDire: 'Répondre dans « Le chantier »', endroit: 'chantier', question: 'q3' })
    && egal(D.QUESTION_DU_CHANTIER, { devis_taux_reduit_neuf: 'q2', devis_decennale: 'q3' })
    && Object.keys(D.MOTIFS_DEVIS).filter((k) => !['devis_taux_reduit_neuf', 'devis_decennale'].includes(k))
      .every((k) => D.secondeActionDuPoint(pt(k, 'l')) === null)
    && D.secondeActionDuPoint(null) === null,
  json(D.endroitDuMotif({ cle: 'devis_taux_reduit_neuf', ligneId: 'l' })));

  /* l. CE QUE L'APPLICATION ÉCRIT ET RELIT (S10, S44, §3.1) : la paire
        « à quel titre » part ENTIÈRE, mais n'est pas la PREMIÈRE paire (la
        réduction le reste) ; la date du « Oui » n'est ni un champ de l'écran
        ni une colonne écrite par `api.js` ; la jointure du client porte son
        type et son SIRET (la proposition et les avis en dépendent). */
  const API2 = sansCommentairesJs(lire('src/lib/api.js'));
  const versBase = corpsDeFonction(API2, 'devisVersBase') || '';
  verifier('l. `PAIRES_DEVIS[0]` reste la paire de la réduction, la paire « à quel titre » (`pourQui`, `pourQuiClient`) part entière '
    + '(S44) ; les quatre champs de 2b-2 sont des champs de l’écran, la date du « Oui » NON ; `devisVersBase` écrit les quatre '
    + 'colonnes et jamais `chantier_neuf_conso_le` (S10) ; la jointure du client ouvert lit `nom, type, siret`',
  egal([...D.PAIRES_DEVIS[0]], ['remiseCentiemes', 'remiseCentimes'])
    && D.PAIRES_DEVIS.filter((p) => egal([...p], ['pourQui', 'pourQuiClient'])).length === 1
    && ['pourQui', 'pourQuiClient', 'chantierNeufConso', 'chantierNeufTva'].every((c) => D.CHAMPS_DEVIS.includes(c))
    && !D.CHAMPS_DEVIS.includes('chantierNeufConsoLe')
    && [['pour_qui', 'pourQui'], ['pour_qui_client', 'pourQuiClient'], ['chantier_neuf_conso', 'chantierNeufConso'],
      ['chantier_neuf_tva', 'chantierNeufTva']].every(([c, k]) => versBase.includes(`poser('${c}', '${k}');`))
    && !/chantier_neuf_conso_le|chantierNeufConsoLe/.test(versBase)
    && /\bclient:client_id\(nom, type, siret\)/.test(D.LIENS_DU_DEVIS_OUVERT),
  `${json(D.PAIRES_DEVIS)} ; ${D.LIENS_DU_DEVIS_OUVERT}`);

  /* m. L'INVARIANT DE LA DÉMONSTRATION (cahier §3.9) : sans `.env`, chaque
        motif nouveau se voit quelque part — « Rénovation » (un client, pas de
        réponse) porte `devis_pour_qui` ; « Sol du séjour » (« crée un bâtiment
        neuf » à Oui) porte `devis_taux_reduit_neuf` sur chacune de ses
        lignes à taux réduit ; « Muret » et « Terrasse » portent une réponse
        valable pour Mme Martin, et gardent leurs invariants de 2b-1 (vérifiés
        en section 40). */
  const jeu2 = DEMO.fabriquerDevisDemo(new Date());
  let regime2 = null;
  try { regime2 = (await import('../src/data/emetteur-demo.js')).fabriquerEmetteurDemo(new Date()).emetteur.regime_tva; } catch (e) { regime2 = null; }
  const de2 = (id) => {
    const d = jeu2.devis.find((x) => x.id === id);
    return d ? { d, cles: D.motifsDeRemise({ devis: d, lignes: jeu2.lignes.filter((l) => l.devisId === id), regime: regime2, motifsEmetteur: [] })
      .map((m) => m.cle) } : { d: null, cles: null };
  };
  const reno = de2(DEMO.DEVIS_DEMO_IDS.renovation);
  const sejour = de2(DEMO.DEVIS_DEMO_IDS.sejour);
  const reduitsSejour = jeu2.lignes.filter((l) => l.devisId === DEMO.DEVIS_DEMO_IDS.sejour && ['poste', 'option'].includes(l.type)
    && [550, 1000].includes(Number(l.tauxTvaCentiemes))).length;
  const valables = [DEMO.DEVIS_DEMO_IDS.muret, DEMO.DEVIS_DEMO_IDS.terrasse].map((id) => D.pourQuiValable(de2(id).d));
  verifier('m. en démonstration, chaque motif de 2b-2 se voit : « Rénovation » demande à quel titre le client commande, « Sol du séjour » '
    + 'porte le taux réduit d’un chantier neuf sur CHACUNE de ses lignes à 10 % ou 5,5 % ; « Muret » et « Terrasse » ont une réponse '
    + 'VALABLE (« à titre privé », pour leur client) ; quatre devis, pas un de plus',
  !!reno.d && reno.cles.includes('devis_pour_qui') && !reno.cles.includes('devis_client') && D.pourQuiValable(reno.d) === null
    && !!sejour.d && sejour.d.chantierNeufTva === true && reduitsSejour > 0
    && sejour.cles.filter((k) => k === 'devis_taux_reduit_neuf').length === reduitsSejour
    && egal(valables, ['consommateur', 'consommateur']) && jeu2.devis.length === 4 && regime2 === 'reel',
  `${json(reno.cles)} | ${json(sejour.cles)} | ${json(valables)}`);
}

console.log('\n  42. le lot 2b-3 — la réparation urgente, « à la signature », l’attestation décennale, FAITS TOURNER');
{
  const POSTES = await import('../src/lib/postes.js');
  const EMd = await import('../src/data/emetteur-demo.js');
  const egal = (a, b) => json(a) === json(b);
  const net = (t) => String(t == null ? '' : t).replace(/[\u00a0\u202f]/g, ' ');

  /* a. LES QUATRE MOTIFS (annexe A.1) : leur rang, leur nature, chacun en
        200 caractères au plus et d'UNE phrase, la consigne d'abord. */
  const NOUVEAUX = {
    devis_acompte_signature: [10, 'prudence'], devis_decennale: [11, 'prudence'],
    devis_attestation_date: [11, 'prudence'], devis_attestation: [11, 'loi'],
  };
  const fauxA = Object.entries(NOUVEAUX).filter(([k, [rang, nature]]) => {
    const m = D.MOTIFS_DEVIS[k] || {};
    return m.rang !== rang || m.nature !== nature || !m.phrase || m.phrase.length > 200 || D.premierePhrase(m.phrase).suite !== false;
  }).map(([k]) => k);
  verifier('a. les quatre motifs de 2b-3 : `devis_acompte_signature` au rang 10 (prudence), et au rang 11 `devis_decennale` (prudence), '
    + '`devis_attestation_date` (prudence), `devis_attestation` (la loi) — chacun en 200 caractères au plus, d’une seule phrase ; '
    + 'seize clés sur onze rangs en tout',
  fauxA.length === 0 && Object.keys(D.MOTIFS_DEVIS).length === 16
    && new Set(Object.values(D.MOTIFS_DEVIS).map((m) => m.rang)).size === 11, fauxA.join(', '));

  /* b. LA RÈGLE DE « À LA SIGNATURE », UNE SEULE FOIS : sur TOUTES les
        combinaisons (réponse valable, chantier neuf, lignes), l'aide dit « ne
        s'applique pas » SI ET SEULEMENT SI `signaturePermise` est vraie, ET
        `pourquoiPasALaSignature` est `null` si et seulement si elle l'est, ET
        le motif de rang 10 sort si et seulement si elle est fausse (avec un
        acompte et « à la signature »). */
  const REPONSES = [null, 'consommateur', 'non_professionnel', 'professionnel_hors_activite', 'professionnel', 'inconnue'];
  const NEUFS = [null, false, true];
  const P0 = (id, plus = {}) => ({ id, type: 'poste', designation: `Poste ${id}`, tauxTvaCentiemes: 0, ordre: 1000, ...plus });
  const JEUX = [
    [], [{ id: 'z', type: 'zone', ordre: 1 }], [P0('a')], [P0('a', { urgence: true })],
    [P0('a', { urgence: true }), P0('b', { urgence: true, ordre: 2000 })], [P0('a', { urgence: true }), P0('b', { ordre: 2000 })],
    [P0('a', { urgence: true }), { id: 'o', type: 'option', tauxTvaCentiemes: 0, ordre: 3000 }],
    [P0('a', { urgence: true, offert: true }), { id: 'r', type: 'reserve', ordre: 4000 }],
    [P0('a', { urgence: 'true' })],
  ];
  const ECHEANCES_PERMISES = (aide) => aide.echeance === null || aide.echeance === D.ECHEANCE_ACOMPTE_URGENCE
    || /la règle du 8e jour ne s’applique pas à ces chantiers/.test(aide.echeance);
  const incoherences = [];
  for (const reponse of REPONSES) {
    for (const neuf of NEUFS) {
      for (const lignes of JEUX) {
        const tout = D.toutUrgent(lignes);
        const permise = D.signaturePermise({ reponse, chantierNeufConso: neuf, toutUrgent: tout });
        const aide = D.aidesDeLAcompte({ reponse, chantierNeufConso: neuf, toutUrgent: tout });
        const pq = D.pourquoiPasALaSignature({ reponse, chantierNeufConso: neuf, lignes });
        const devis = { clientId: 'c', pourQui: reponse, pourQuiClient: 'c', lieuVille: 'v', delaiExecution: 'x', validiteJours: 30,
          engageDecennale: false, chantierNeufConso: neuf, acompteCentiemes: 3000, acompteNature: 'acompte', acompteALaSignature: true };
        const r10 = D.motifsDeRemise({ devis, lignes, regime: 'franchise' }).some((m) => m.cle === 'devis_acompte_signature');
        if (ECHEANCES_PERMISES(aide) !== permise || (pq === null) !== permise || r10 === permise) {
          incoherences.push(`${reponse}/${neuf}/${json(lignes.map((l) => `${l.type}${l.urgence === true ? '!' : ''}`))}`);
        }
      }
    }
  }
  verifier('b. « à la signature » : sur les 162 combinaisons (six réponses, trois chantiers, neuf jeux de lignes), l’aide dit « ne '
    + 's’applique pas » ⇔ `signaturePermise` ⇔ `pourquoiPasALaSignature` est `null` ⇔ le rang 10 se tait — LA même règle partout ; '
    + '« true » écrit en chaîne n’est pas une marque',
  incoherences.length === 0 && D.toutUrgent([P0('a', { urgence: 'true' })]) === false && D.toutUrgent([]) === false,
  incoherences.slice(0, 4).join(' | '));

  /* c. LA LIGNE « POURQUOI » : la PREMIÈRE cause, dans l'ordre de l'annexe
        A.4 ; la première ligne non marquée dans l'ordre du DEVIS, nommée par
        sa désignation ; jamais « marquez ». */
  const PQ = (reponse, lignes, neuf = null) => D.pourquoiPasALaSignature({ reponse, chantierNeufConso: neuf, lignes });
  const ordre2 = [P0('b', { ordre: 2000, designation: 'Second' }), P0('a', { ordre: 1000, urgence: true, designation: 'Premier' }),
    P0('c', { ordre: 3000, designation: 'Troisième' })];
  const textesPq = Object.values(D.POURQUOI_PAS_A_LA_SIGNATURE);
  verifier('c. la ligne « pourquoi » dit LA première cause : pas de réponse ; une petite entreprise hors de son activité ; aucune ligne '
    + 'chiffrée marquée ; une option ; la première ligne non marquée DANS L’ORDRE DU DEVIS, par sa désignation (sans désignation, '
    + '« Une ligne… ») — jamais une invitation à marquer',
  PQ(null, [P0('a', { urgence: true })]) === D.POURQUOI_PAS_A_LA_SIGNATURE.sans_reponse
    && PQ('inconnue', []) === D.POURQUOI_PAS_A_LA_SIGNATURE.sans_reponse
    && PQ('professionnel_hors_activite', [P0('a', { urgence: true })]) === D.POURQUOI_PAS_A_LA_SIGNATURE.professionnel_hors_activite
    && PQ('consommateur', [P0('a')]) === D.POURQUOI_PAS_A_LA_SIGNATURE.aucune_marquee
    && PQ('consommateur', []) === D.POURQUOI_PAS_A_LA_SIGNATURE.aucune_marquee
    /* L'ORDRE : rien de marqué ET une option → « aucune ligne marquée »
       (A.4 la dit avant l'option ; le banc l'a trouvée sans garde). */
    && PQ('consommateur', [P0('a'), { id: 'o', type: 'option', ordre: 9 }]) === D.POURQUOI_PAS_A_LA_SIGNATURE.aucune_marquee
    && PQ('consommateur', [P0('a', { urgence: true }), { id: 'o', type: 'option', ordre: 9 }, P0('b', { ordre: 5 })])
      === D.POURQUOI_PAS_A_LA_SIGNATURE.option
    && PQ('non_professionnel', ordre2) === 'La ligne « Second » n’est pas marquée « réparation urgente ».'
    && PQ('consommateur', [P0('a', { urgence: true }), P0('b', { ordre: 2000, designation: '  ' })])
      === D.POURQUOI_PAS_A_LA_SIGNATURE.ligne_sans_nom
    && PQ('consommateur', [P0('a', { urgence: true })]) === null && PQ('professionnel', []) === null
    && PQ('consommateur', [P0('a')], true) === null
    && textesPq.every((t) => !/\bmarquez\b|\bmarquer\b/i.test(t))
    && egal(D.POURQUOI_PAS_A_LA_SIGNATURE, {
      sans_reponse: 'Dites d’abord à quel titre ce client commande : sans réponse, Opus compte le 8e jour.',
      professionnel_hors_activite: 'Pour une entreprise, Opus n’applique pas l’exception des réparations urgentes, par prudence : la '
        + 'loi la prévoit au domicile d’un particulier.',
      aucune_marquee: 'Aucune ligne chiffrée de ce devis n’est marquée « réparation urgente ».',
      option: 'Une option n’est jamais une réparation urgente : tant que ce devis en porte une, comptez le 8e jour.',
      ligne_sans_nom: 'Une ligne de ce devis n’est pas marquée « réparation urgente ».',
    }), json(PQ('non_professionnel', ordre2)));

  /* d. L'ATTESTATION DÉCENNALE, FAITE TOURNER : jointe = un chemin écrit
        (des blancs ne sont pas un chemin) ; valable = une date au moins le
        jour ; une RC pro ne compte pas ; une autre entreprise non plus ; des
        DATES comparées comme des chaînes (un horodatage relu garde son
        jour). Le rang 11 : une clé au plus, « Non » ne lit rien. */
  const as = (nature, chemin, fin, pro = 'p') => ({ pro_id: pro, nature, attestation_chemin: chemin, valide_jusquau: fin });
  const ET = (liste, jour = '2026-11-12', o = {}) => D.etatDeLAttestation(liste, jour, o);
  const r11 = (engage, assurances, proId = 'p') => D.motifsDeRemise({ devis: { clientId: 'c', pourQui: 'consommateur',
    pourQuiClient: 'c', lieuVille: 'v', delaiExecution: 'x', validiteJours: 30, engageDecennale: engage, proId }, lignes: [P0('a')],
  regime: 'franchise', assurances, jour: '2026-11-12' }).filter((m) => m.rang === 11).map((m) => `${m.cle}:${m.nature}`).join();
  verifier('d. l’attestation décennale, FAITE TOURNER : valable (une jointe, au moins jusqu’au jour), sans date, absente (rien de '
    + 'joint, ou seulement des dates passées) ; un chemin de blancs, une RC pro, celle d’une AUTRE entreprise ne comptent pas ; un '
    + 'horodatage garde son jour ; et le rang 11 — vide → `devis_decennale`, « Oui » sans date → `devis_attestation_date`, « Oui » '
    + 'absente → `devis_attestation` (la loi), « Non » → rien, une valable → rien, UNE clé au plus',
  ET([as('decennale', 'p/a.pdf', '2026-11-12')]) === 'valable' && ET([as('decennale', 'p/a.pdf', '2026-11-11')]) === 'absente'
    && ET([as('decennale', 'p/a.pdf', '2026-11-12T23:00:00+00:00')]) === 'valable'
    && ET([as('decennale', 'p/a.pdf', null)]) === 'sans_date' && ET([as('decennale', null, '2999-01-01')]) === 'absente'
    && ET([as('decennale', ' \t\r\n', '2999-01-01')]) === 'absente' && ET([as('rc_pro', 'p/a.pdf', '2999-01-01')]) === 'absente'
    && ET([as('decennale', 'p/a.pdf', '2001-01-01'), as('decennale', 'p/b.pdf', null)]) === 'sans_date'
    && ET([as('decennale', 'p/a.pdf', '2001-01-01'), as('decennale', 'p/b.pdf', '2999-01-01')]) === 'valable'
    && ET([as('decennale', 'q/a.pdf', '2999-01-01', 'q')], '2026-11-12', { proId: 'p' }) === 'absente'
    && ET([as('decennale', 'q/a.pdf', '2999-01-01', 'q')], '2026-11-12', { proId: null }) === 'valable'
    && ET([], '2026-11-12') === 'absente' && ET(null) === 'absente' && ET(undefined, 'n’importe quoi') === 'absente'
    && r11(null, []) === 'devis_decennale:prudence' && r11(undefined, []) === 'devis_decennale:prudence'
    && r11(null, [as('decennale', 'p/a.pdf', null)]) === 'devis_decennale:prudence'
    && r11(true, [as('decennale', 'p/a.pdf', null)]) === 'devis_attestation_date:prudence'
    && r11(true, []) === 'devis_attestation:loi' && r11(true, [as('decennale', 'p/a.pdf', '2001-01-01')]) === 'devis_attestation:loi'
    && r11(true, [as('decennale', 'q/a.pdf', '2999-01-01', 'q')]) === 'devis_attestation:loi'
    && r11(false, []) === '' && r11(true, [as('decennale', 'p/a.pdf', '2999-01-01')]) === ''
    && r11('true', []) === 'devis_decennale:prudence',
  json([r11(null, []), r11(true, []), r11(true, [as('decennale', 'p/a.pdf', null)])]));

  /* e. LE RANG 10, FAIT TOURNER sur ses bords : sans acompte, rien ; un
        acompte en euros compte ; « Dès le 8e jour » (faux) et une chaîne
        « true » ne font rien ; rangé AVANT le rang 11. */
  const sig = (plus, lignes = [P0('a')]) => D.motifsDeRemise({ devis: { clientId: 'c', pourQui: 'consommateur', pourQuiClient: 'c',
    lieuVille: 'v', delaiExecution: 'x', validiteJours: 30, engageDecennale: true, ...plus }, lignes, regime: 'franchise', assurances: [],
  jour: '2026-11-12' }).map((m) => m.cle).join();
  verifier('e. le rang 10, FAIT TOURNER : « à la signature » sans acompte → rien ; un acompte en euros → le motif ; « Dès le 8e jour » '
    + '(faux) ou « true » en chaîne → rien ; tout marqué à titre privé → rien ; et le rang 10 sort AVANT le rang 11',
  sig({ acompteALaSignature: true }) === 'devis_attestation'
    && sig({ acompteALaSignature: true, acompteCentimes: 5000, acompteNature: 'arrhes' }) === 'devis_acompte_signature,devis_attestation'
    && sig({ acompteALaSignature: false, acompteCentiemes: 3000, acompteNature: 'acompte' }) === 'devis_attestation'
    && sig({ acompteALaSignature: 'true', acompteCentiemes: 3000, acompteNature: 'acompte' }) === 'devis_attestation'
    && sig({ acompteALaSignature: true, acompteCentiemes: 3000, acompteNature: 'acompte' }, [P0('a', { urgence: true })]) === 'devis_attestation',
  sig({ acompteALaSignature: true, acompteCentimes: 5000, acompteNature: 'arrhes' }));

  /* f. LA CARTE « CONDITIONS », VOIE DE L'ÉCHÉANCE (E-B1), FAITE TOURNER :
        ouverte puis fermée sans geste, elle rend l'échéance ENREGISTRÉE (la
        saisie n'envoie que ce qui diffère : aucune écriture) ; un acompte
        vidé GARDE l'échéance ; les pastilles et le résumé. */
  const devisSig = { acompteCentiemes: 3000, acompteNature: 'acompte', validiteJours: 30, acompteALaSignature: true };
  const fermee = D.lireConditions({ devis: devisSig, tapes: { acompte: '30' } });
  const videe = D.lireConditions({ devis: devisSig, tapes: { acompte: '' } });
  const choisie = D.lireConditions({ devis: { ...devisSig, acompteALaSignature: null },
    choix: { ...D.etatInitialConditions(devisSig), echeance: false }, tapes: { acompte: '30' } });
  const sansEcheance = D.lireConditions({ devis: devisSig, choix: { uniteReduction: 'pourcent', uniteAcompte: 'pourcent', nature: 'acompte',
    validite: 30, validiteAutre: false, retenue: false }, tapes: { acompte: '30' } });
  verifier('f. la carte « Conditions » et l’échéance : ouverte puis fermée sans geste, `acompteALaSignature` reste VRAI (rien ne diffère, '
    + 'rien ne part) ; l’acompte vidé GARDE l’échéance (la nature, elle, part avec) ; un choix « Dès le 8e jour » s’écrit FAUX ; un choix '
    + 'qui ne la porte pas n’en dit rien ; les pastilles (« Dès le 8e jour (par défaut) » tant que c’est vide, à gauche) ; le résumé '
    + '« Acompte 30 % à la signature »',
  fermee.changements.acompteALaSignature === true && videe.changements.acompteALaSignature === true
    && videe.changements.acompteNature === null && choisie.changements.acompteALaSignature === false
    && !('acompteALaSignature' in sansEcheance.changements)
    && egal(D.pastillesDeLEcheance(null), ['Dès le 8e jour (par défaut)', 'À la signature'])
    && egal(D.pastillesDeLEcheance(false), ['Dès le 8e jour', 'À la signature'])
    && egal(D.pastillesDeLEcheance(true), ['Dès le 8e jour', 'À la signature'])
    && D.ECHEANCE_DE_L_ACOMPTE.etiquette === 'Quand le client paie-t-il cette somme ?'
    && net(D.resumeDesConditions(devisSig)) === 'Acompte 30 % à la signature · Valable 30 jours'
    && net(D.resumeDesConditions({ ...devisSig, acompteALaSignature: false })) === 'Acompte 30 % · Valable 30 jours'
    && net(D.resumeDesConditions({ validiteJours: 30, acompteALaSignature: true })) === 'Valable 30 jours',
  json([fermee.changements, videe.changements, D.resumeDesConditions(devisSig)]));

  /* g. LES ENDROITS ET LES ACTIONS (cahier §3.1) : « Conditions » SUR
        l'échéance ; « Mon entreprise », section « Assurances », pour les
        trois clés du rang 11 — sans entrée dans `CHAMP_DU_MOTIF` (aucun motif
        de l'entreprise n'y mène, les trois s'excluent). */
  const pt = (cle) => ({ cle, endroit: D.endroitDuMotif({ cle }) });
  verifier('g. les endroits : `devis_acompte_signature` → « Conditions », champ `echeance` (« Choisir le moment du paiement ») ; les trois '
    + 'clés du rang 11 → « Mon entreprise » : Assurances, `devis_decennale` avec un second bouton vers « Le chantier », les deux autres '
    + 'SANS ; aucune n’est dans `CHAMP_DU_MOTIF`',
  egal(D.endroitDuMotif({ cle: 'devis_acompte_signature' }), { endroit: 'conditions', champ: 'echeance' })
    && egal(D.actionDuPoint(pt('devis_acompte_signature')), { libelle: 'Choisir le moment du paiement', aDire: 'Choisir le moment du paiement' })
    && egal(D.endroitDuMotif({ cle: 'devis_decennale' }), { endroit: 'entreprise', section: 'assurances', aussi: 'chantier' })
    && egal(D.endroitDuMotif({ cle: 'devis_attestation' }), { endroit: 'entreprise', section: 'assurances' })
    && egal(D.endroitDuMotif({ cle: 'devis_attestation_date' }), { endroit: 'entreprise', section: 'assurances' })
    && ['devis_decennale', 'devis_attestation', 'devis_attestation_date'].every((k) => !(k in D.CHAMP_DU_MOTIF)
      && egal(D.actionDuPoint(pt(k)), { libelle: 'Compléter dans « Mon entreprise »', aDire: 'Compléter dans « Mon entreprise » : Assurances' }))
    && D.secondeActionDuPoint(pt('devis_attestation')) === null && D.secondeActionDuPoint(pt('devis_attestation_date')) === null
    && Object.keys(D.MOTIFS_DEVIS).every((k) => !!D.ENDROIT_DU_MOTIF[k]),
  json(D.actionDuPoint(pt('devis_decennale'))));

  /* h. LA LIGNE « RÉPARATION URGENTE », FAITE TOURNER : un poste seulement
        (`devis_ligne_urgence_check`, la DERNIÈRE de l'ordre alphabétique) ;
        `nettoyerLigne` en fait un booléen ; une ligne neuve où l'on n'a
        touché que l'urgence n'est pas vierge ; la rangée la porte ; JAMAIS
        posée par une proposition, une suggestion, ni un poste de la base. */
  const L = (plus) => ({ id: 'x', type: 'poste', designation: 'x', quantiteMilliemes: 1000, unite: 'u', prixUnitaireCentimes: 100,
    tauxTvaCentiemes: 2000, ...plus });
  const proposition = POSTES.valeursDeLaProposition({ source: 'base', designation: 'x', unite: 'u', urgence: true, prixReferenceCentimes: 100 });
  const suggestion = D.valeursDeLaSuggestion({ designation: 'x', unite: 'u', urgence: true, prixUnitaireCentimes: 100 });
  const duPoste = POSTES.posteDepuisLaLigne(L({ urgence: true }));
  verifier('h. la ligne urgente : un POSTE seulement — une option, une zone, une pièce, une réserve marquées sont refusées par '
    + '`devis_ligne_urgence_check`, avec sa phrase (annexe A.5) ; `nettoyerLigne` rend un booléen ; une ligne neuve marquée n’est pas '
    + 'vierge ; la rangée la porte ; une proposition, une suggestion, un poste de la base ne la posent JAMAIS',
  D.validerLigne(L({ urgence: true })).ok === true
    && ['option', 'zone', 'piece', 'reserve'].every((t) => {
      const v = D.validerLigne(t === 'option' ? L({ type: 'option', urgence: true })
        : { id: 'x', type: t, designation: 'x', urgence: true });
      return v.contrainte === 'devis_ligne_urgence_check' && v.champ === 'urgence';
    })
    && D.nettoyerLigne({ type: 'poste' }).urgence === false && D.nettoyerLigne({ type: 'poste', urgence: 'true' }).urgence === false
    && D.nettoyerLigne({ type: 'poste', urgence: true }).urgence === true
    && D.ligneVierge({ type: 'poste', urgence: true }) === false && D.ligneVierge({ type: 'poste', urgence: false }) === true
    && D.proprietesDeLaRangee(L({ urgence: true })).urgence === true && D.proprietesDeLaRangee(L({})).urgence === false
    && !!proposition && !('urgence' in proposition) && !!suggestion && !('urgence' in suggestion) && !('urgence' in duPoste)
    && ERR.MESSAGES_CONTRAINTE.devis_ligne_urgence_check === 'seul un poste peut être marqué « réparation urgente » — ni une option, '
      + 'ni un titre, ni une réserve. Rien n’a été enregistré.'
    && ERR.messageDeContrainte('devis_ligne_urgence_check').startsWith('Seul un poste peut être marqué « réparation urgente »'),
  json([proposition, suggestion, duPoste]));

  /* i. LA DÉMONSTRATION : chaque ligne dit `urgence: false` (une clé
        absente se lirait `null`, et `false` contre `null` ferait croire à
        un changement) ; « Sol du séjour » répond « Oui » à la décennale ; la
        décennale de démonstration est JOINTE et valable ; la base de
        démonstration refuse l'urgence hors d'un poste, comme la base. */
  const jeu3 = DEMO.fabriquerDevisDemo(new Date());
  const ed3 = EMd.fabriquerEmetteurDemo(new Date());
  const sejour3 = jeu3.devis.find((x) => x.id === DEMO.DEVIS_DEMO_IDS.sejour);
  let refusDemo = null;
  try {
    const base = DEMO.creerBaseDevisDemo();
    const muret = jeu3.devis.find((x) => x.id === DEMO.DEVIS_DEMO_IDS.muret);
    await base.ecrire(muret.proId, { quoi: 'ligne', action: 'inserer', id: '00000000-0000-4000-8000-0000000000aa', generation: Date.now(),
      valeurs: { devisId: muret.id, ordre: 99000, type: 'option', designation: 'x', quantiteMilliemes: 1000, unite: 'u',
        prixUnitaireCentimes: 100, tauxTvaCentiemes: 2000, urgence: true } });
  } catch (e) { refusDemo = e; }
  verifier('i. en démonstration, chaque ligne porte `urgence: false` ; « Sol du séjour » répond « Oui » à la décennale ; la décennale de '
    + 'la fiche est JOINTE (dans le dossier de l’artisan) et valable ; une option marquée urgente est REFUSÉE par la base de démonstration, '
    + 'comme par la vraie',
  jeu3.lignes.length > 0 && jeu3.lignes.every((l) => l.urgence === false) && !!sejour3 && sejour3.engageDecennale === true
    && D.etatDeLAttestation(ed3.assurances) === 'valable'
    && ed3.assurances.every((a) => !a.attestation_chemin || String(a.attestation_chemin).startsWith(`${a.pro_id}/`))
    && !!refusDemo && /devis_ligne_urgence_check/.test(`${refusDemo.message || ''} ${refusDemo.constraint || ''} ${refusDemo.details || ''}`),
  `${jeu3.lignes.filter((l) => l.urgence !== false).length} ligne(s) sans urgence:false ; refus ${refusDemo && refusDemo.message}`);
}

/* i bis. CE QUE LE BANC DES TEXTES DE 2b-3 A TROUVÉ (13/11/2026) — trois
      défauts remis à la main passaient au vert, parce que les vérifications
      ci-dessus font tourner les FONCTIONS, pas leurs APPELANTS :
        - S21 : `motifsRefusRemiseDemo` qui passait `jour: new
          Date().toISOString().slice(0, 10)` — le jour d'UTC, faux chaque
          nuit en métropole (de minuit à 1 h ou 2 h) et chaque soir aux
          Antilles. Le miroir sans `jour` était juste ; son APPELANT ne
          l'était plus ;
        - S22 : la ligne neuve qui reprenait la marque de la précédente PAR
          SON APPELANT (`{ ...ligneNeuve(…), urgence: … }`), `ligneNeuve`
          restant intacte ;
        - S26 : « · réparation urgente » posé APRÈS le total de la rangée —
          `rangees()` lit le total en fin de texte (annexe B, point 9), et le
          cahier ne le confiait qu'à `mesure-devis`, qui ne tourne pas ici. */
{
  /* S21 — LE JOUR QUI JUGE L'ATTESTATION, CHEZ CHAQUE APPELANT : aucun appel
     de `motifsDeRemise`, `etatDeLAttestation` ou `etatDeLAssurance` dans
     `src/` ne porte un jour calculé (`toISOString`, `getUTC…`, `Date.UTC`,
     `slice(0, 10)`) ni un `jour` qui ne soit pas `jourDuTelephone()` ou
     `jourLocal(…)` ; le seul appel qui passe un `jour` nu est celui de
     `motifsDeRemise` à `etatDeLAttestation` — son propre paramètre, dont le
     défaut est `jourDuTelephone()`. */
  const fichiersJour = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { cwd: RACINE, encoding: 'utf8' })
    .stdout.split('\n').filter((f) => /\.js$/.test(f));
  const JUGES = ['motifsDeRemise', 'etatDeLAttestation', 'etatDeLAssurance'];
  const appelsJuges = [];
  for (const f of fichiersJour) {
    const src = sansCommentairesJs(lireSiExiste(f) || '');
    for (const nom of JUGES) {
      const re = new RegExp(`\\b${nom}\\s*\\(`, 'g');
      let m;
      while ((m = re.exec(src))) {
        if (/function\s+$/.test(src.slice(Math.max(0, m.index - 12), m.index))) continue;
        let p = 0;
        let j = m.index + m[0].length - 1;
        for (; j < src.length; j += 1) {
          if (src[j] === '(') p += 1;
          else if (src[j] === ')') { p -= 1; if (p === 0) break; }
        }
        appelsJuges.push({ f, nom, texte: sansEspaces(src.slice(m.index, j + 1)) });
      }
    }
  }
  const interne = 'etatDeLAttestation(assurances, jour, { proId: d.proId ?? null })';
  const fautifsJour = appelsJuges.filter((a) => {
    if (a.f === 'src/lib/devis.js' && a.texte === interne) return false;
    const sansPermis = a.texte.replace(/\bjourDuTelephone\s*\(\s*\)/g, '').replace(/\bjourLocal\s*\(/g, '');
    return /toISOString|getUTC|Date\.UTC|\.(slice|substring|substr)\(\s*0\s*,\s*10\s*\)/.test(a.texte) || /\bjour\b/.test(sansPermis);
  });
  const defauts = sansEspaces(sansCommentairesJs(lire('src/lib/devis.js')));
  const defautsEm = sansEspaces(sansCommentairesJs(lire('src/lib/emetteur.js')));
  verifier('i bis. le jour qui juge l’attestation décennale n’est JAMAIS celui d’UTC, chez AUCUN appelant : `motifsDeRemise`, '
    + '`etatDeLAttestation` et `etatDeLAssurance` gardent leur défaut (`jourDuTelephone()`, `jourLocal(…)`), et aucun appel dans `src/` '
    + 'ne leur passe un jour calculé (banc des textes, S21)',
  appelsJuges.length >= 3 && appelsJuges.some((a) => a.f === 'src/lib/api.js' && a.nom === 'motifsDeRemise')
    && fautifsJour.length === 0
    && /assurances = \[\], jour = jourDuTelephone\(\), \} = \{\}\) \{/.test(defauts)
    && /export function etatDeLAttestation\(assurances, jour = jourDuTelephone\(\), \{ proId = null \} = \{\}\) \{/.test(defauts)
    && /export function etatDeLAssurance\(a, jour = jourLocal\(new Date\(\)\)\) \{/.test(defautsEm),
  `${appelsJuges.length} appel(s) ; fautifs : ${fautifsJour.map((a) => `${a.f} : ${a.texte.slice(0, 140)}`).join(' | ') || '—'}`);

  /* S22 — LA MARQUE D'UNE LIGNE NEUVE, CHEZ SON APPELANT : `ligneNeuve` est
     appelée UNE fois, et sa ligne entre TELLE QUELLE dans la liste ; dans la
     saisie, aucune clé `urgence:` n'est écrite hors de `ligneNeuve` (`false`)
     et des deux qui portent l'URGENCE D'ORIGINE du devis (la demande SOS,
     un autre objet), et aucune n'est affectée (`.urgence =`). La seule
     écriture de la marque est l'appui sur l'interrupteur de la carte (j1). */
  const SAi = ECR.saisie;
  const appelsNeuve = [];
  {
    const re = /\bligneNeuve\s*\(/g;
    let m;
    while ((m = re.exec(SAi))) {
      if (!/function\s+$/.test(SAi.slice(Math.max(0, m.index - 12), m.index))) appelsNeuve.push(m.index);
    }
  }
  const clesUrgence = [...SAi.matchAll(/\burgence\s*:\s*([^,}\n]*)/g)].map((m) => sansEspaces(m[1]));
  const PERMISES = ['false', 'ouverture.urgence || null', 'd.urgence || null'];
  verifier('i bis. une ligne neuve naît ÉTEINTE chez son APPELANT aussi : `ligneNeuve` appelée une fois, sa ligne versée telle quelle '
    + '(`changerLignes((ls) => [...ls, l])`), aucune clé `urgence:` ni affectation `.urgence =` ailleurs dans la saisie (banc des textes, S22)',
  appelsNeuve.length === 1
    && /const l = ligneNeuve\(type, id, ordre, tauxPour\(ordre, type\)\);\s*changerLignes\(\(ls\) => \[\.\.\.ls, l\]\);/.test(SAi)
    && clesUrgence.length === 3 && clesUrgence.filter((v) => v === 'false').length === 1
    && clesUrgence.every((v) => PERMISES.includes(v))
    && !/\.urgence\s*=(?!=)/.test(SAi),
  `${appelsNeuve.length} appel(s) de ligneNeuve ; clés urgence: ${json(clesUrgence)}`);

  /* S26 — « · réparation urgente » AVANT LE TOTAL de la rangée : dans
     `RangeeLigne`, la marque (`DETAIL_URGENCE`, et `DETAIL_URGENCE_SEUL`
     sans quantité) vient avant `<Montant centimes={total} fort />`, et
     jamais entre le total et l'étiquette parlée. */
  const iRangee = SAi.indexOf('const RangeeLigne = React.memo(');
  const iLibelleR = iRangee < 0 ? -1 : SAi.indexOf('const libelle =', iRangee);
  const iTotalR = iRangee < 0 ? -1 : SAi.indexOf('<Montant centimes={total} fort />', iRangee);
  const avantTotal = iRangee >= 0 && iTotalR > iRangee ? SAi.slice(iRangee, iTotalR) : '';
  const apresTotal = iTotalR >= 0 && iLibelleR > iTotalR ? SAi.slice(iTotalR, iLibelleR) : 'introuvable';
  verifier('i bis. la rangée d’un poste dit « · réparation urgente » AVANT son total (`rangees()` lit le total en fin de texte), jamais '
    + 'après (banc des textes, S26 — que seul `mesure-devis` voyait)',
  (avantTotal.match(/\bDETAIL_URGENCE\b/g) || []).length >= 1 && (avantTotal.match(/\bDETAIL_URGENCE_SEUL\b/g) || []).length >= 1
    && !/DETAIL_URGENCE/.test(apresTotal),
  `avant le total : ${(avantTotal.match(/DETAIL_URGENCE\w*/g) || []).join(', ') || '—'} ; après : ${(apresTotal.match(/DETAIL_URGENCE\w*/g) || []).join(', ') || '—'}`);
}

/* j. L'ÉCRAN DE 2b-3 (cahier §3.4-§3.8) — ce que les écrans font des
      fonctions pures ci-dessus. Lu dans les SOURCES, commentaires retirés et
      blancs réduits : les mesures au doigt sont dans `mesure-devis`
      (§5.5), qui ne tourne pas ici. */
{
  const CL = sansEspaces(ECR.carte);
  const SAj = sansEspaces(ECR.saisie);
  const CDj = sansEspaces(sansCommentairesJs(lireSiExiste('src/components/ConditionsDevis.js') || ''));
  const PRj = sansEspaces(sansCommentairesJs(lireSiExiste('src/components/PourRemettre.js') || ''));

  /* j1. LA CARTE D'UNE LIGNE (§3.4) : un bloc sur un POSTE seulement, APRÈS
         « Offert », AVANT « Monter » ; l'interrupteur porte EXACTEMENT
         `aide={AIDE_URGENCE}` (fixe : la rangée touchée ne change pas de
         hauteur, S25) ; le risque est un texte À PART, sous la rangée,
         allumée seulement ; la seule écriture de la marque est l'appui
         (`urgence: allume`, S24) — `depuisUneUrgence` ne fait qu'afficher
         la ligne qui LIMITE ; la carte ne lit pas l'origine du devis. */
  const iBloc = CL.indexOf("{ligne.type === 'poste' && ( <View style={s.blocUrgence}>");
  const blocU = iBloc >= 0 ? CL.slice(iBloc, CL.indexOf('</View> )}', iBloc) + 10) : '';
  const interrupteursU = balises(ECR.carte, 'Interrupteur').filter((b) => /libelle=\{LIBELLE_URGENCE\}/.test(b));
  verifier('j1. la carte d’un POSTE porte « Pour les droits de votre client » et l’interrupteur « Réparation urgente… », APRÈS « Offert » '
    + 'et AVANT « Monter » ; son aide est EXACTEMENT `AIDE_URGENCE` (fixe) ; le risque, un texte À PART sous la rangée, allumée seulement '
    + '(annoncé à VoiceOver à l’allumage) ; la seule écriture de la marque est l’appui ; la ligne d’un devis venu d’une urgence ne fait '
    + 'que LIMITER, et la carte ne lit pas l’origine du devis (S24, S25)',
  iBloc > CL.indexOf('libelle="Offert"') && CL.indexOf('libelle="Offert"') > 0 && iBloc < CL.indexOf('label="Monter"')
    && interrupteursU.length === 1 && /\baide=\{AIDE_URGENCE\}/.test(interrupteursU[0])
    && /actif=\{!!ligne\.urgence\}/.test(interrupteursU[0])
    && blocU.includes('{depuisUneUrgence && <Text style={s.aide}>{DEPUIS_UNE_URGENCE}</Text>} <Text style={s.sousTitre} accessibilityRole="header">{LE_CHANTIER.q1.sousTitre}</Text> <Interrupteur')
    && blocU.includes('onPress={() => { const allume = !ligne.urgence; if (allume) retour.annoncer(URGENCE_SI_ALLUMEE); enregistrer({ urgence: allume }); }}')
    && blocU.includes("/> {sous('urgence')} {!!ligne.urgence && <Text style={s.risque}>{URGENCE_SI_ALLUMEE}</Text>} </View>")
    && (CL.match(/\burgence:/g) || []).length === 1
    && (CL.match(/\bdepuisUneUrgence\b/g) || []).length === 2 && /\bdepuisUneUrgence = false,/.test(CL)
    && !/\bsource\b|sosRequestId/.test(CL),
  blocU.slice(0, 260) || 'bloc de l’urgence introuvable');

  /* j2. LA SAISIE (§3.4, §3.5) : une ligne neuve naît ÉTEINTE (S22) ; la
         carte reçoit la VALEUR `depuisUneUrgence`, calculée sur la source
         (qui ne se récrit jamais, D3) ; aucune écriture `urgence: true`
         nulle part dans la saisie ; « Conditions » reçoit les lignes de
         l'ÉCRAN et `toutUrgent(lignes)`. */
  const neuve = corpsDeFonction(ECR.saisie, 'ligneNeuve') || '';
  verifier('j2. une ligne neuve naît avec `urgence: false` (jamais reprise, S22) ; la carte reçoit `depuisUneUrgence={devis.source === '
    + '\'urgence\'}` ; la saisie n’écrit jamais `urgence: true` ; « Conditions » reçoit `toutUrgent={toutUrgent(lignes)}` et `lignes={lignes}`',
  /surfaceMursMilliemes: null,\s*urgence: false,\s*\};/.test(sansCommentairesJs(neuve))
    && SAj.includes("depuisUneUrgence={devis.source === 'urgence'}")
    && !/urgence: true/.test(SAj)
    && SAj.includes('toutUrgent={toutUrgent(lignes)} lignes={lignes}'),
  sansEspaces(neuve).slice(-160));

  /* j3. « CONDITIONS » (§3.7, E-I2, E-B1, E-I7) : la question de l'échéance
         TOUJOURS montrée — son titre suit DIRECTEMENT l'aide de la nature,
         hors de toute condition —, avec son ancre ; deux pastilles, RIEN de
         choisi d'office, écrites par la voie unique (`choisir`) ; sous elles
         la ligne « pourquoi », seulement « à la signature » ET un acompte
         posé, puis l'aide de l'échéance, qui n'a pas bougé. */
  verifier('j3. « Conditions » : « Quand le client paie-t-il cette somme ? » TOUJOURS montrée, juste après l’aide de la nature, avec son '
    + 'ancre ; deux pastilles, rien de choisi d’office, écrites par `choisir` ; la ligne « pourquoi » sous elles (« à la signature » ET un '
    + 'acompte posé), puis l’aide de l’échéance',
  CDj.includes("<Text style={s.aide}>{aides.nature}</Text> <Text style={s.etiquette} onLayout={ancre('echeance')}>{ECHEANCE_DE_L_ACOMPTE.etiquette}</Text> <View style={s.pastilles}>")
    && CDj.includes("<Pastille label={pastilleHuitieme} choisie={c.echeance === false} onPress={() => choisir({ echeance: false }, 'echeance')} />")
    && CDj.includes("<Pastille label={pastilleSignature} choisie={c.echeance === true} onPress={() => choisir({ echeance: true }, 'echeance')} />")
    && CDj.includes('const [pastilleHuitieme, pastilleSignature] = pastillesDeLEcheance(c.echeance);')
    && CDj.includes('const pourquoi = c.echeance === true && acomptePose ? pourquoiPasALaSignature({ reponse: reponseATitre, chantierNeufConso, lignes }) : null;')
    && CDj.includes('const acomptePose = present(devis.acompteCentiemes) || present(devis.acompteCentimes);')
    && CDj.includes('</View> {!!pourquoi && <Text style={s.pourquoi}>{pourquoi}</Text>} {!!aides.echeance && <Text style={s.aide}>{aides.echeance}</Text>}')
    && (CDj.match(/\becheance: (?:true|false)\b/g) || []).length === 2,
  CDj.slice(CDj.indexOf('{aides.nature}'), CDj.indexOf('{aides.nature}') + 300));

  /* j4. JAMAIS UN BOUTON QUI PROPOSE DE MARQUER une ligne « urgente » pour
         lever un point ou une aide (annexe B, point 6 ; S29) : ni dans
         « Conditions », ni dans « Pour le remettre » — un marquage faux,
         c'est la nullité et le pénal. Lu sur le code, commentaires retirés. */
  const marquer = /marqu/i;
  verifier('j4. aucun texte de « Conditions » ni de « Pour le remettre » ne propose de MARQUER une ligne (S29) — la ligne « pourquoi » dit '
    + 'la cause, elle ne propose jamais le geste',
  !marquer.test(CDj) && !marquer.test(PRj),
  `${(CDj.match(/.{0,40}marqu.{0,40}/i) || [''])[0]} | ${(PRj.match(/.{0,40}marqu.{0,40}/i) || [''])[0]}`);
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le chiffrage compte juste, au centime, la file n’écrit rien deux fois ni dans le désordre, et le schéma tient ce '
  + 'qu’il promet. Ce que PostgreSQL en fait, `essais-section-49.sql` le dit — à jouer à la main.\n');
