/**
 * LE N° DE TVA ÉCRIT PAR L'ARTISAN — ce qu'on calcule, ce que VIES répond,
 * ce qu'on dit, ce que la fonction Edge FAIT, et ce que la base garde.
 *
 * POURQUOI CE CONTRÔLE EXISTE — 20/10/2026
 * ----------------------------------------
 * Quand l'annuaire des entreprises ne publie aucun numéro de TVA, l'artisan
 * l'écrit, et Opus ne le garde que si VIES le reconnaît (section 48 de
 * `schema.sql`). Tout ce qui décide passe par `src/lib/tva.js`, recopié
 * OCTET POUR OCTET dans la fonction Edge. Ce contrôle tient six choses :
 *
 *   1. LES DEUX COPIES SONT IDENTIQUES, et le module n'importe rien.
 *
 *   2. LA LECTURE DE VIES, FAITE TOURNER sur des réponses SYNTHÉTIQUES
 *      construites d'après les formes RELEVÉES le 20/10/2026 — dont le
 *      piège mesuré : l'interface du site rend `isValid: false` quand la
 *      France est SATURÉE. Aucune réponse réelle n'entre dans le dépôt :
 *      le nom et l'adresse d'une entreprise réelle n'ont rien à y faire.
 *
 *   3. LES MOTS : VIES « reconnaît » ou « refuse » ; jamais « vérifié »
 *      (le badge), jamais « registre » (VIES n'en est pas un).
 *
 *   4. LA FONCTION EDGE, FAITE TOURNER — et c'est la leçon de la relecture
 *      du 20/10/2026 : la première version de ce contrôle LISAIT son texte,
 *      et vingt-deux sabotages sur vingt-trois passaient (une branche jamais
 *      prise, la preuve retirée AVANT VIES, la clé de service envoyée à
 *      VIES, un jeton forgé accepté…). Le banc, plus bas, la transpile et
 *      l'exécute dans un processus à part, avec VIES, la base, le jeton et
 *      l'horloge SIMULÉS, et regarde ce qu'elle FAIT : ce qu'elle écrit, ce
 *      qu'elle envoie, ce qu'elle répond, et quand.
 *
 *   5. LA BASE : la table et sa ligne se répondent, et ce qui protège la
 *      preuve est là. La preuve du COMPORTEMENT est dans
 *      `supabase/essais-section-48.sql`, sur un vrai PostgreSQL : un fichier
 *      `node` ne sait pas interroger une base, il ne faut pas lui demander
 *      de le prouver.
 *
 *   6. L'APPLICATION ET LES TEXTES LÉGAUX.
 *
 *   npm run verifier-tva
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

import * as T from '../src/lib/tva.js';
import * as S from '../src/lib/siret.js';
import { dateFrancaise } from '../src/lib/entreprise.js';
import * as OCC from '../src/lib/declaration-tva.js';

const ICI = fileURLToPath(import.meta.url);
const RACINE = path.resolve(path.dirname(ICI), '..');
const APP = 'src/lib/tva.js';
const COPIE = 'supabase/functions/tva/tva.js';
const EDGE = 'supabase/functions/tva/index.ts';
const lire = (f) => readFileSync(path.join(RACINE, f), 'utf8');
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Les caractères invisibles sont FABRIQUÉS, jamais écrits dans ce fichier :
   un caractère invisible dans le source d'un contrôle ne se relit pas. */
const ZWSP = String.fromCharCode(0x200b);
const NBSP = String.fromCharCode(0x00a0);
const NNBSP = String.fromCharCode(0x202f);
const TIRET = String.fromCharCode(0x2011);
const WJ = String.fromCharCode(0x2060);

/* ==================================================================== */
/*  LE BANC — la fonction Edge, FAITE TOURNER, dans un processus à part */
/*                                                                      */
/*  Il remplace `Date.now`, `setTimeout`, `fetch`, `console` et `Deno`  */
/*  du processus : il ne doit JAMAIS tourner dans celui des autres      */
/*  vérifications. Le contrôle le relance lui-même avec `--banc`.       */
/* ==================================================================== */
if (process.argv[2] === '--banc') {
  await banc();
  process.exit(0);
}

async function banc() {
  const ecrire = (ligne) => process.stdout.write(`${ligne}\n`);
  let nb = 0;
  let echecs = 0;
  const ok = (nom, cond, detail = '') => {
    nb += 1;
    if (cond) { ecrire(`  ✔ ${nom}`); return; }
    echecs += 1;
    ecrire(`  ✘ ${nom}${detail ? `\n      ${String(detail).slice(0, 400)}` : ''}`);
  };

  /* --- la fonction, transpilée, ses deux imports remplacés ------------ */
  const source = lire(EDGE);
  let js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const avant = js;
  js = js.replace(/import \{[^}]*\} from 'npm:@supabase\/supabase-js@[^']+';/,
    'const { createClient } = globalThis.__banc;');
  js = js.replace("from './tva.js'", `from '${pathToFileURL(path.join(RACINE, COPIE)).href}'`);
  if (js === avant || js.includes('npm:@supabase')) {
    ok('le banc a pu remplacer les deux imports de la fonction', false);
    ecrire(`BANC ${nb} ${echecs}`);
    return;
  }
  const dossier = mkdtempSync(path.join(os.tmpdir(), 'opus-banc-tva-'));
  const fichier = path.join(dossier, 'index.mjs');
  writeFileSync(fichier, js);

  /* --- l'horloge : elle n'avance que quand la fonction attend ---------- */
  const T0 = Date.parse('2026-10-20T12:34:56.000Z');
  let t = T0;
  const vraiImmediat = globalThis.setImmediate;
  Date.now = () => t;
  const minuteurs = [];
  globalThis.setTimeout = (fn, ms) => {
    /* Le délai d'un essai (l'AbortController) ne se déclenche jamais : la
       réponse simulée arrive avant. Toute autre attente est une PAUSE :
       l'horloge avance d'autant, puis la fonction reprend. */
    if (ms === T.ESSAIS_VIES.delai_ms) { minuteurs.push({ type: 'delai', ms, t }); return { delai: ms }; }
    minuteurs.push({ type: 'pause', ms, t });
    t += ms;
    vraiImmediat(fn);
    return { pause: ms };
  };
  globalThis.clearTimeout = () => {};

  /* --- le journal : capturé, jamais affiché ---------------------------- */
  const journal = [];
  console.log = (...a) => journal.push(a.map(String).join(' '));
  console.error = (...a) => journal.push(a.map(String).join(' '));
  console.warn = (...a) => journal.push(a.map(String).join(' '));

  /* --- la base simulée -------------------------------------------------- */
  const CLE_SERVICE = 'CLE-DE-SERVICE-DU-BANC';
  const MOI = 'a4800000-0000-4000-8000-00000000000a';
  const SIREN = '000048009';
  const NUM = 'FR91000048009';
  const DATE_BASE = '2026-10-20T12:35:30.123Z';
  let E;
  const nouvelleRequete = (table) => {
    const ops = [];
    const q = {};
    for (const m of ['select', 'eq', 'is', 'limit', 'gt', 'lt', 'like', 'delete', 'upsert', 'update',
      'insert', 'single', 'maybeSingle', 'order', 'in', 'neq', 'or', 'not', 'gte', 'lte']) {
      q[m] = (...args) => { ops.push([m, ...args]); return q; };
    }
    q.then = (resolu, rejete) => {
      E.ecritures.push({ table, ops, vies: E.vies.length, t, seq: E.seq++ });
      return Promise.resolve(E.base(table, ops)).then(resolu, rejete);
    };
    return q;
  };
  globalThis.__banc = {
    createClient: (url, cle) => {
      E.clients.push({ url, cle });
      return {
        auth: {
          getUser: async (jeton) => {
            E.getUser.push(jeton);
            return jeton === 'jeton-de-A'
              ? { data: { user: { id: MOI } }, error: null }
              : { data: { user: null }, error: { message: 'invalid JWT' } };
          },
        },
        from: (table) => nouvelleRequete(table),
        rpc: async (nom, args) => {
          E.rpc.push({ nom, args, vies: E.vies.length, t, seq: E.seq++ });
          return E.rpcRep(nom, args, E.rpc.filter((r) => r.nom === nom).length);
        },
      };
    },
  };
  globalThis.fetch = async (url, init) => {
    const n = E.vies.length + 1;
    E.vies.push({ url, init, debut: t });
    const rep = E.viesRep(n);
    t += E.duree(n, rep);
    if (rep === 'reseau') throw new TypeError('fetch failed');
    if (rep && rep.__statut) return new Response('panne', { status: rep.__statut });
    return new Response(JSON.stringify(rep), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  let traiter = null;
  globalThis.Deno = {
    env: { get: (k) => ({ SUPABASE_URL: 'https://banc.supabase.co', SUPABASE_SERVICE_ROLE_KEY: CLE_SERVICE })[k] },
    serve: (h) => { traiter = h; },
  };
  try {
    await import(pathToFileURL(fichier).href);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
  if (typeof traiter !== 'function') {
    ok('la fonction se charge et appelle Deno.serve', false);
    ecrire(`BANC ${nb} ${echecs}`);
    return;
  }

  /* Les réponses de VIES, d'après les formes relevées le 20/10/2026. */
  const VALIDE = {
    countryCode: 'FR', vatNumber: '91000048009', requestDate: '2026-10-20T12:35:05.000Z', valid: true,
    requestIdentifier: '', name: 'SOCIETE FICTIVE DU BANC', address: '1 RUE FICTIVE DU BANC',
  };
  const REFUS = { countryCode: 'FR', vatNumber: '91000048009', valid: false, name: '---', address: '---' };
  const SATURE = { actionSucceed: false, errorWrappers: [{ error: 'MS_MAX_CONCURRENT_REQ' }] };
  const BLOQUE = { actionSucceed: false, errorWrappers: [{ error: 'IP_BLOCKED' }] };

  /* --- la base simulée, AVEC un état (2b-2) ---------------------------
     `preuves_tva` et `siret_limites` sont de vraies listes de lignes : les
     filtres de la fonction (eq, neq, is, not…is null, gt, lt, like) y sont
     APPLIQUÉS, et l'écriture passe par une imitation du déclencheur
     `tient_la_preuve_tva()` (pour la clé de service, la seule qui écrit) et
     des contraintes de la section 48. Un filtre oublié ou retourné se voit
     donc à ce qui RESTE dans la table, pas seulement au texte de la
     requête. Le comportement réel de la base est prouvé ailleurs, sur un
     vrai PostgreSQL (`essais-section-48.sql`). Une requête que le banc ne
     sait pas simuler est une faute du BANC : elle est comptée, et le banc
     échoue. */
  const PHRASE_SQL = 'Je certifie sur l’honneur que ce numéro est celui que l’administration fiscale a attribué à mon entreprise.';
  const COLONNES_PREUVE = ['pro_id', 'siren', 'numero', 'reconnu_le', 'vies_le', 'source', 'declare_le', 'declaration_texte'];
  const COLONNES_LIMITE = ['cle', 'fenetre', 'n'];
  const fautesDuBanc = [];
  const FILTRES = new Set(['eq', 'neq', 'is', 'not', 'gt', 'gte', 'lt', 'lte', 'like']);
  const MODIFICATEURS = new Set(['select', 'limit', 'order', 'delete', 'upsert', 'update', 'insert', 'single', 'maybeSingle']);
  const comparer = (a, b) => {
    const ta = Date.parse(a);
    const tb = Date.parse(b);
    if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
    return String(a) < String(b) ? -1 : (String(a) > String(b) ? 1 : 0);
  };
  const faute = (message) => { fautesDuBanc.push(message); return { data: null, error: { message: `banc : ${message}` } }; };
  const filtrer = (lignes, ops) => {
    const inconnus = ops.filter(([m]) => !FILTRES.has(m) && !MODIFICATEURS.has(m)).map(([m]) => m);
    if (inconnus.length) return { faute: `méthode non simulée : ${inconnus.join(', ')}` };
    for (const [m, c, v, w] of ops) if (m === 'not' && (v !== 'is' || w !== null)) return { faute: `not(${c}, ${v}, ${w}) non simulé` };
    return {
      lignes: lignes.filter((l) => ops.every(([m, c, v]) => {
        if (m === 'eq') return l[c] === v;
        if (m === 'neq') return l[c] != null && l[c] !== v;
        if (m === 'is') return v === null ? l[c] == null : l[c] === v;
        if (m === 'not') return l[c] != null;
        if (m === 'gt') return l[c] != null && comparer(l[c], v) > 0;
        if (m === 'gte') return l[c] != null && comparer(l[c], v) >= 0;
        if (m === 'lt') return l[c] != null && comparer(l[c], v) < 0;
        if (m === 'lte') return l[c] != null && comparer(l[c], v) <= 0;
        if (m === 'like') {
          const motif = String(v);
          return motif.endsWith('%') ? String(l[c]).startsWith(motif.slice(0, -1)) : l[c] === motif;
        }
        return true;
      })),
    };
  };
  /* Ce qu'une requête RELIT : les colonnes nommées (une colonne inconnue est
     une erreur, comme 42703), triées, bornées ; `single()` exige une ligne. */
  const relire = (lignes, ops, colonnes) => {
    const sel = ops.find(([m]) => m === 'select');
    if (!sel) return { data: null, error: null };
    const noms = String(sel[1] == null ? '*' : sel[1]).split(',').map((c) => c.trim()).filter(Boolean);
    const inconnues = noms.filter((c) => c !== '*' && !colonnes.includes(c));
    if (inconnues.length) return { data: null, error: { code: '42703', message: `colonne inconnue : ${inconnues.join(', ')}` } };
    let rangees = lignes.map((l) => ({ ...l }));
    const ordre = ops.find(([m]) => m === 'order');
    if (ordre) {
      const sens = ordre[2] && ordre[2].ascending === false ? -1 : 1;
      rangees.sort((x, y) => sens * comparer(x[ordre[1]], y[ordre[1]]));
    }
    const borne = ops.find(([m]) => m === 'limit');
    if (borne) rangees = rangees.slice(0, borne[1]);
    rangees = rangees.map((l) => (noms.includes('*') ? l : Object.fromEntries(noms.map((c) => [c, l[c] === undefined ? null : l[c]]))));
    if (ops.some(([m]) => m === 'single')) {
      return rangees.length === 1 ? { data: rangees[0], error: null }
        : { data: null, error: { code: 'PGRST116', message: `${rangees.length} ligne(s) au lieu d’une` } };
    }
    return { data: rangees, error: null };
  };

  const scenario = (o = {}) => {
    t = T0;
    minuteurs.length = 0;
    journal.length = 0;
    const preuves = o.preuves || (o.preuveRecente ? [{ pro_id: MOI, siren: SIREN, numero: NUM, source: 'vies',
      vies_le: null, declare_le: null, declaration_texte: null, ...o.preuveRecente }] : []);
    const limites = o.limites || (o.refusRetenu ? [{ cle: cleRefus, n: 1, ...o.refusRetenu }] : []);
    E = {
      ecritures: [], rpc: [], vies: [], getUser: [], clients: [], seq: 0,
      entreprise: o.entreprise === undefined ? { siren: SIREN, tva: null } : o.entreprise,
      preuves: preuves.map((l) => ({ reconnu_le: null, vies_le: null, declare_le: null, declaration_texte: null, ...l })),
      limites: limites.map((l) => ({ n: 1, ...l })),
      horloge: 0,
      viesRep: o.viesRep || (() => VALIDE),
      duree: o.duree || ((n, rep) => (rep === SATURE || rep === BLOQUE ? 1500 : 10000)),
      rpcRep: o.rpcRep || ((nom, args) => {
        if (nom === 'compter_essai_tva') return { data: 'ok', error: null };
        if (nom === 'compter_appel_siret') return E.compterAppel(args);
        return faute(`rpc non simulée : ${nom}`);
      }),
      erreurs: o.erreurs || {},
      /* `compter_appel_siret` (section 45.2) : une ligne par (clé, instant),
         incrémentée si elle existe. */
      compterAppel(args) {
        const ligne = this.limites.find((l) => l.cle === args.p_cle && l.fenetre === args.p_fenetre);
        if (ligne) ligne.n += 1; else this.limites.push({ cle: args.p_cle, fenetre: args.p_fenetre, n: 1 });
        return { data: (ligne ? ligne.n : 1) <= args.p_max, error: null };
      },
      /* L'heure de la BASE (`clock_timestamp()`) : DATE_BASE, puis une
         seconde de plus à chaque écriture. */
      horlogeBase() {
        const d = new Date(Date.parse(DATE_BASE) + 1000 * this.horloge).toISOString();
        this.horloge += 1;
        return d;
      },
      /* `tient_la_preuve_tva()` pour la clé de service, puis les contraintes
         de la section 48 — la même règle, recopiée pour le banc. */
      declencheur(avant, ligne) {
        const nouvelle = ligne;
        const maintenant = this.horlogeBase();
        nouvelle.reconnu_le = maintenant;
        const meme = !!avant && avant.declare_le != null && avant.numero === nouvelle.numero && avant.siren === nouvelle.siren;
        if (nouvelle.source === 'declaration') {
          if (meme) { nouvelle.declare_le = avant.declare_le; nouvelle.declaration_texte = avant.declaration_texte; }
          else nouvelle.declare_le = maintenant;
          nouvelle.reconnu_le = nouvelle.declare_le;
        } else if (nouvelle.source === 'vies' && meme) {
          nouvelle.declare_le = avant.declare_le;
          nouvelle.declaration_texte = avant.declaration_texte;
        } else {
          nouvelle.declare_le = null;
          nouvelle.declaration_texte = null;
        }
        const refus = (nom) => ({ code: '23514', message: `new row violates check constraint "${nom}"` });
        if (!/^FR[0-9A-HJ-NP-Z]{2}[0-9]{9}$/.test(String(nouvelle.numero)) || String(nouvelle.numero).slice(4) !== nouvelle.siren) {
          return refus('preuve_tva_numero_check');
        }
        if (!['vies', 'essai', 'declaration'].includes(nouvelle.source)) return refus('preuve_tva_source_check');
        if ((nouvelle.declare_le == null) !== (nouvelle.declaration_texte == null)
          || (nouvelle.source === 'declaration' && nouvelle.declare_le == null)
          || (nouvelle.source === 'essai' && nouvelle.declare_le != null)
          || (nouvelle.declaration_texte != null && nouvelle.declaration_texte !== PHRASE_SQL)) {
          return refus('preuve_tva_declaration_check');
        }
        const inconnues = Object.keys(nouvelle).filter((c) => !COLONNES_PREUVE.includes(c));
        if (inconnues.length) return { code: 'PGRST204', message: `colonne inconnue : ${inconnues.join(', ')}` };
        return null;
      },
      base(table, ops) {
        const a = (m) => ops.some(([x]) => x === m);
        const op = (m) => ops.find(([x]) => x === m) || [];
        const panneBase = { data: null, error: { message: 'panne' } };
        if (table === 'entreprise_registre') {
          if (this.erreurs.entreprise) return panneBase;
          return { data: this.entreprise ? [this.entreprise] : [], error: null };
        }
        if (table === 'preuves_tva') {
          const vise = filtrer(this.preuves, ops);
          if (vise.faute) return faute(vise.faute);
          if (a('upsert')) {
            if (this.erreurs.upsert) return panneBase;
            const [, ligne, options] = op('upsert');
            if (!ligne || !options || options.onConflict !== 'pro_id') return faute('upsert sans onConflict « pro_id »');
            const avant = this.preuves.find((l) => l.pro_id === ligne.pro_id) || null;
            const nouvelle = { reconnu_le: null, vies_le: null, declare_le: null, declaration_texte: null, ...(avant || {}), ...ligne };
            const refus = this.declencheur(avant, nouvelle);
            if (refus) return { data: null, error: refus };
            this.preuves = this.preuves.filter((l) => l !== avant).concat([nouvelle]);
            const relue = relire([nouvelle], ops, COLONNES_PREUVE);
            if (this.erreurs.sansDate && relue.data) delete relue.data.declare_le;
            return relue;
          }
          if (a('update')) {
            if (this.erreurs.renaissance) return panneBase;
            const [, valeurs] = op('update');
            const apres = [];
            for (const avant of vise.lignes) {
              const nouvelle = { ...avant, ...valeurs };
              const refus = this.declencheur(avant, nouvelle);
              if (refus) return { data: null, error: refus };
              apres.push([avant, nouvelle]);
            }
            for (const [avant, nouvelle] of apres) this.preuves = this.preuves.map((l) => (l === avant ? nouvelle : l));
            return relire(apres.map(([, n]) => n), ops, COLONNES_PREUVE);
          }
          if (a('delete')) {
            if (this.erreurs.retrait) return panneBase;
            this.preuves = this.preuves.filter((l) => !vise.lignes.includes(l));
            return relire(vise.lignes, ops, COLONNES_PREUVE);
          }
          if (a('select')) {
            const enPanne = this.erreurs.preuves;
            if (enPanne === true || (typeof enPanne === 'function' && enPanne(ops))) return panneBase;
            return relire(vise.lignes, ops, COLONNES_PREUVE);
          }
          return faute('requête sur preuves_tva non simulée');
        }
        if (table === 'siret_limites') {
          const vise = filtrer(this.limites, ops);
          if (vise.faute) return faute(vise.faute);
          if (a('delete')) {
            this.limites = this.limites.filter((l) => !vise.lignes.includes(l));
            return { data: null, error: null };
          }
          if (a('select')) {
            const enPanne = this.erreurs.limites;
            if (enPanne === true || (typeof enPanne === 'function' && enPanne(ops))) return panneBase;
            return relire(vise.lignes, ops, COLONNES_LIMITE);
          }
          return faute('requête sur siret_limites non simulée');
        }
        return { data: null, error: { message: `table inattendue : ${table}` } };
      },
    };
  };
  const appeler = async (numero, o = {}) => {
    const enTetes = {
      'Content-Type': 'application/json',
      Cookie: 'session=du-telephone',
      'X-Forwarded-For': '203.0.113.7',
      'X-Telephone': 'secret-du-telephone',
      'User-Agent': 'Expo/telephone',
    };
    if (o.jeton !== null) enTetes.Authorization = `Bearer ${o.jeton || 'jeton-de-A'}`;
    if (o.origine) enTetes.Origin = o.origine;
    const r = await traiter(new Request('https://banc.supabase.co/functions/v1/tva', {
      method: o.methode || 'POST',
      headers: enTetes,
      body: (o.methode || 'POST') === 'POST' ? JSON.stringify(o.corps !== undefined ? o.corps : { numero }) : undefined,
    }));
    const texte = await r.text();
    let corps = null;
    try { corps = JSON.parse(texte); } catch { corps = null; }
    return { statut: r.status, corps, texte, enTetes: r.headers };
  };
  const ecritures = (table, verbe) => E.ecritures.filter((e) => e.table === table && e.ops.some(([m]) => m === verbe));
  const purges = () => ecritures('siret_limites', 'delete');
  const rpcs = (nom) => E.rpc.filter((r) => r.nom === nom);
  const ecritAilleurs = () => E.ecritures.filter((e) => e.ops.some(([m]) => ['delete', 'upsert', 'update', 'insert'].includes(m))
    && !['preuves_tva', 'siret_limites'].includes(e.table));
  const pauses = () => minuteurs.filter((m) => m.type === 'pause').map((m) => m.ms);
  const rien = (r) => !JSON.stringify(r.corps).match(/FICTIVE|CLE-DE-SERVICE|a4800000|jeton/);
  const cleCompte = `tva-compte:${await T.empreinte(CLE_SERVICE, MOI)}`;
  const cleRefus = `tva-refus:${await T.empreinte(CLE_SERVICE, `${MOI}:${NUM}`)}`;
  /* 2b-2 : un AUTRE numéro de la même entreprise (une clé en lettres, que
     seul VIES peut juger), les clés des absences de réponse (P5), et la
     forme d'une déclaration déjà faite. */
  const NUM_K = 'FRK1000048009';
  const cleRefusK = `tva-refus:${await T.empreinte(CLE_SERVICE, `${MOI}:${NUM_K}`)}`;
  const cleMuet = `tva-muet:${await T.empreinte(CLE_SERVICE, `${MOI}:${NUM}`)}`;
  const cleMuetK = `tva-muet:${await T.empreinte(CLE_SERVICE, `${MOI}:${NUM_K}`)}`;
  const DECL_ANCIENNE = '2026-10-01T08:00:00.000Z';
  const preuve = (o = {}) => ({ pro_id: MOI, siren: SIREN, numero: NUM, source: 'vies',
    reconnu_le: '2026-10-05T09:00:00.000Z', vies_le: '2026-10-05T09:00:00.000Z', declare_le: null, declaration_texte: null, ...o });
  const declaration = (numero = NUM, o = {}) => preuve({ numero, source: 'declaration', vies_le: null,
    reconnu_le: DECL_ANCIENNE, declare_le: DECL_ANCIENNE, declaration_texte: PHRASE_SQL, ...o });
  const refusIlYA = (ms, cle = cleRefus) => ({ cle, fenetre: new Date(T0 - ms).toISOString(), n: 1 });
  const silenceIlYA = (ms, cle = cleMuet) => ({ cle, fenetre: new Date(T0 - ms).toISOString(), n: 1 });
  const DECLARER = (o = {}) => ({ numero: NUM, action: 'declarer', engagement: true, texte: PHRASE_SQL, ...o });
  const H = 3600000;
  const opDe = (e, m) => (e && e.ops.find(([x]) => x === m)) || [];
  const aEq = (e, c, v) => !!e && e.ops.some(([m, cc, vv]) => m === 'eq' && cc === c && vv === v);
  const ecrituresPreuve = () => E.ecritures.filter((e) => e.table === 'preuves_tva'
    && e.ops.some(([m]) => ['upsert', 'update', 'delete', 'insert'].includes(m)));
  const rienDeFait = () => ecrituresPreuve().length === 0 && E.vies.length === 0 && E.rpc.length === 0 && purges().length === 0;

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — avant VIES');
  let r;
  scenario(); r = await appeler('FR9100004800');
  ok('une saisie incomplète → mal_forme, SANS lire le jeton ni la base',
    r.statut === 200 && egal(r.corps, { issue: 'mal_forme' }) && E.getUser.length === 0 && E.ecritures.length === 0,
    JSON.stringify(r.corps));
  scenario(); r = await appeler('FR00000048009');
  ok('une clé chiffrée fausse → cle_fausse, sans lire le jeton', egal(r.corps, { issue: 'cle_fausse' }) && E.getUser.length === 0);
  scenario(); r = await appeler(NUM, { jeton: null });
  ok('sans jeton → sans_compte, et rien d’autre n’est lu', egal(r.corps, { issue: 'sans_compte' }) && E.ecritures.length === 0 && E.vies.length === 0);
  scenario();
  r = await appeler(NUM, { jeton: `x.${Buffer.from(JSON.stringify({ sub: MOI, role: 'authenticated' })).toString('base64')}.y` });
  ok('un jeton FORGÉ (son « sub » est lisible, sa signature fausse) → sans_compte : c’est la base qui dit qui appelle',
    egal(r.corps, { issue: 'sans_compte' }) && E.getUser.length === 1 && E.ecritures.length === 0 && E.vies.length === 0);
  ok('…et le jeton est contrôlé par la clé de SERVICE, venue de l’environnement',
    E.clients.length === 1 && E.clients[0].cle === CLE_SERVICE);
  scenario({ entreprise: null }); r = await appeler(NUM);
  ok('aucune entreprise rattachée → sans_entreprise, sans VIES', egal(r.corps, { issue: 'sans_entreprise' }) && E.vies.length === 0);
  const lueEnt = (E.ecritures.find((e) => e.table === 'entreprise_registre') || { ops: [] }).ops;
  ok('…l’entreprise lue est l’ACTIVE, celle de l’appelant',
    lueEnt.some(([m, c, v]) => m === 'eq' && c === 'pro_id' && v === MOI)
    && lueEnt.some(([m, c, v]) => m === 'is' && c === 'retiree_le' && v === null), JSON.stringify(lueEnt));
  scenario({ entreprise: { siren: SIREN, tva: 'FR91000048009' } }); r = await appeler(NUM);
  ok('l’annuaire publie déjà un numéro → deja_publie, ce numéro, et VIES n’est PAS appelé',
    egal(r.corps, { issue: 'deja_publie', numero: 'FR91000048009' }) && E.vies.length === 0 && E.rpc.length === 0);
  scenario(); r = await appeler('FR18000048017');
  ok('le numéro d’une AUTRE entreprise → autre_siren, AVANT VIES, sans compteur ni preuve lue',
    egal(r.corps, { issue: 'autre_siren' }) && E.vies.length === 0 && E.rpc.length === 0
    && ecritures('preuves_tva', 'select').length === 0, JSON.stringify(r.corps));
  scenario({ erreurs: { entreprise: true } }); r = await appeler(NUM);
  ok('une lecture de l’entreprise en échec → panne HTTP 500, sans VIES', r.statut === 500 && E.vies.length === 0);

  scenario({ preuveRecente: { numero: NUM, reconnu_le: '2026-10-19T20:00:00.000Z' } }); r = await appeler(NUM);
  const lueP = (ecritures('preuves_tva', 'select')[0] || { ops: [] }).ops;
  const gt = lueP.find(([m]) => m === 'gt');
  ok('une preuve de moins de 24 h → reconnu, SA date, et ni VIES ni compteur',
    egal(r.corps, { issue: 'reconnu', numero: NUM, reconnu_le: '2026-10-19T20:00:00.000Z' })
    && E.vies.length === 0 && E.rpc.length === 0, JSON.stringify(r.corps));
  ok('…bornée à 24 h EXACTEMENT, pour CE numéro, CE SIREN, CET appelant, source « vies »',
    !!gt && gt[1] === 'reconnu_le' && Date.parse(gt[2]) === T0 - 24 * 3600000
    && ['pro_id', 'numero', 'siren', 'source'].every((c) => lueP.some(([m, cc]) => m === 'eq' && cc === c))
    && lueP.some(([m, c, v]) => m === 'eq' && c === 'source' && v === 'vies')
    && lueP.some(([m, c, v]) => m === 'eq' && c === 'pro_id' && v === MOI), JSON.stringify(lueP));
  ok('…et un appel qui n’a rien compté ne purge rien', purges().length === 0);

  scenario({ refusRetenu: { fenetre: new Date(T0 - 3600000).toISOString() } }); r = await appeler(NUM);
  const lueR = (ecritures('siret_limites', 'select')[0] || { ops: [] }).ops;
  ok('un refus de moins de trois heures → refuse, l’heure où redemander, et ni VIES ni compteur',
    egal(r.corps, { issue: 'refuse', numero: NUM, reessayer_a: new Date(T0 - 3600000 + T.REFUS_RETENU_MS).toISOString() })
    && E.vies.length === 0 && rpcs('compter_essai_tva').length === 0, JSON.stringify(r.corps));
  ok('…cherché sous une EMPREINTE (HMAC de la clé de service) du compte ET du numéro, sur trois heures',
    lueR.some(([m, c, v]) => m === 'eq' && c === 'cle' && v === cleRefus)
    && lueR.some(([m, c, v]) => m === 'gt' && c === 'fenetre' && Date.parse(v) === T0 - T.REFUS_RETENU_MS)
    && !JSON.stringify(lueR).includes(MOI), JSON.stringify(lueR));

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — VIES reconnaît');
  scenario(); r = await appeler(NUM);
  const up = ecritures('preuves_tva', 'upsert');
  const ligne = up[0] && (up[0].ops.find(([m]) => m === 'upsert') || [])[1];
  const options = up[0] && (up[0].ops.find(([m]) => m === 'upsert') || [])[2];
  ok('reconnu : la réponse, avec la date que la BASE a posée, et rien d’autre',
    r.statut === 200 && egal(r.corps, { issue: 'reconnu', numero: NUM, reconnu_le: DATE_BASE }), r.texte);
  ok('…UNE preuve écrite : la ligne de tva.js, sans date de contrôle, en upsert sur le compte',
    up.length === 1 && egal(ligne, { pro_id: MOI, siren: SIREN, numero: NUM, vies_le: VALIDE.requestDate, source: 'vies' })
    && egal(options, { onConflict: 'pro_id' }), JSON.stringify(ligne));
  ok('…écrite APRÈS la réponse de VIES, et rien n’est retiré', up[0] && up[0].vies === 1 && ecritures('preuves_tva', 'delete').length === 0);
  ok('…rien n’est écrit hors de preuves_tva et siret_limites', ecritAilleurs().length === 0, JSON.stringify(ecritAilleurs().map((e) => e.table)));
  const req = E.vies[0];
  const enTetes = req ? [...new Headers(req.init.headers).keys()].sort() : [];
  ok('vers VIES : le point d’entrée documenté, en POST, le pays et le numéro sans son « FR »',
    !!req && req.url === 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number'
    && req.init.method === 'POST' && egal(JSON.parse(req.init.body), { countryCode: 'FR', vatNumber: '91000048009' }));
  ok('…EXACTEMENT trois en-têtes, écrits par la fonction : User-Agent, Accept, Content-Type',
    egal(enTetes, ['accept', 'content-type', 'user-agent']), enTetes.join(', '));
  ok('…et rien du téléphone ni de la clé de service ne part vers VIES',
    !!req && !/CLE-DE-SERVICE|jeton-de-A|203\.0\.113|secret-du-telephone|session=|Expo\//.test(
      JSON.stringify([...new Headers(req.init.headers)]) + req.init.body));
  ok('…le nom et l’adresse que VIES renvoie ne sont ni rendus ni écrits au journal',
    rien(r) && !journal.some((l) => /FICTIVE/.test(l)) && !JSON.stringify(ligne || {}).includes('FICTIVE'), journal.join(' | '));
  const c1 = rpcs('compter_essai_tva')[0];
  ok('…UN compteur, avant VIES : le compte (empreinte, jamais l’identifiant) et tout Opus',
    rpcs('compter_essai_tva').length === 1 && c1.vies === 0 && !!c1
    && egal(c1.args, {
      p_compte: cleCompte,
      p_heure: '2026-10-20T12:00:00.000Z',
      p_max_compte: T.LIMITES_TVA.compte.max,
      p_minute: '2026-10-20T12:34:00.000Z',
      p_max_global: T.LIMITES_TVA.global.max,
    }) && !JSON.stringify(c1.args).includes(MOI), c1 && JSON.stringify(c1.args));
  const p = purges()[0];
  ok('…puis la purge : les seuls compteurs `tva-` de plus d’un jour, APRÈS la preuve',
    purges().length === 1 && p.ops.some(([m, c, v]) => m === 'like' && c === 'cle' && v === 'tva-%')
    && p.ops.some(([m, c, v]) => m === 'lt' && c === 'fenetre' && Date.parse(v) === p.t - 24 * 3600000)
    && E.ecritures.indexOf(p) > E.ecritures.indexOf(up[0]), p && JSON.stringify(p.ops));
  scenario({ erreurs: { upsert: true } }); r = await appeler(NUM);
  ok('une preuve qui ne s’écrit pas → panne HTTP 500, JAMAIS « reconnu »', r.statut === 500 && !/reconnu/.test(r.texte));

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — VIES refuse');
  scenario({ viesRep: () => REFUS }); r = await appeler(NUM);
  const del = ecritures('preuves_tva', 'delete');
  ok('refuse : la réponse, sans heure (VIES vient de répondre)', egal(r.corps, { issue: 'refuse', numero: NUM }), r.texte);
  ok('…la preuve de CE numéro, et d’aucun autre, est retirée — APRÈS VIES',
    del.length === 1 && del[0].vies === 1
    && del[0].ops.some(([m, c, v]) => m === 'eq' && c === 'pro_id' && v === MOI)
    && del[0].ops.some(([m, c, v]) => m === 'eq' && c === 'numero' && v === NUM)
    && ecritures('preuves_tva', 'upsert').length === 0, del[0] && JSON.stringify(del[0].ops));
  const retenu = rpcs('compter_appel_siret')[0];
  ok('…et le refus est RETENU, sous l’empreinte du compte et du numéro, daté de maintenant',
    !!retenu && retenu.args.p_cle === cleRefus && Date.parse(retenu.args.p_fenetre) === t && retenu.args.p_max >= 1,
    retenu && JSON.stringify(retenu.args));
  scenario({ viesRep: () => REFUS, erreurs: { retrait: true } }); r = await appeler(NUM);
  ok('un retrait de preuve en échec → panne HTTP 500 (le numéro s’imprimerait encore)', r.statut === 500);
  scenario({ viesRep: () => REFUS, rpcRep: (nom) => (nom === 'compter_appel_siret' ? { data: null, error: { message: 'panne' } } : { data: 'ok', error: null }) });
  r = await appeler(NUM);
  ok('…un refus qui ne se retient pas dit quand même ce que VIES a répondu', egal(r.corps, { issue: 'refuse', numero: NUM }));

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — VIES ne répond pas');
  scenario({ viesRep: () => SATURE }); r = await appeler(NUM);
  const duree = t - T0;
  ok('saturé jusqu’au bout → indisponible, cause « sature », et aucune preuve touchée',
    egal(r.corps, { issue: 'indisponible', cause: 'sature' }) && ecritures('preuves_tva', 'delete').length === 0
    && ecritures('preuves_tva', 'upsert').length === 0, r.texte);
  ok(`…${T.ESSAIS_VIES.max} essais quand les saturations reviennent vite (1,5 s), et les pauses annoncées`,
    E.vies.length === T.ESSAIS_VIES.max && egal(pauses(), [...T.ESSAIS_VIES.pauses_ms]),
    `${E.vies.length} essais, pauses ${JSON.stringify(pauses())}`);
  ok('…UN compteur avant CHAQUE requête à VIES, reprises comprises',
    rpcs('compter_essai_tva').length === E.vies.length
    && rpcs('compter_essai_tva').every((c, k) => c.vies === k), JSON.stringify(rpcs('compter_essai_tva').map((c) => c.vies)));
  ok('…un délai de 20 s posé sur chaque essai', minuteurs.filter((m) => m.type === 'delai').length === E.vies.length);
  ok('…et le tout tient dans le budget', duree <= T.ESSAIS_VIES.budget_ms, `${duree} ms`);
  ok('…la saturation laisse une trace au journal, avec le code de VIES', journal.some((l) => /MS_MAX_CONCURRENT_REQ/.test(l)));
  scenario({ viesRep: () => SATURE, duree: () => 10000 }); r = await appeler(NUM);
  const debuts = E.vies.map((v) => v.debut - T0);
  ok('des saturations LENTES (10 s) : un essai ne part que si sa pause et ses 20 s tiennent dans le budget',
    E.vies.length >= 1 && debuts.every((d) => d + T.ESSAIS_VIES.delai_ms <= T.ESSAIS_VIES.budget_ms)
    && E.vies.length < T.ESSAIS_VIES.max, `départs ${JSON.stringify(debuts)}`);
  scenario({ viesRep: (n) => (n === 1 ? SATURE : VALIDE) }); r = await appeler(NUM);
  ok('saturé, puis reconnu → reconnu, deux essais, deux compteurs',
    r.corps && r.corps.issue === 'reconnu' && E.vies.length === 2 && rpcs('compter_essai_tva').length === 2);
  scenario({ viesRep: () => BLOQUE }); r = await appeler(NUM);
  ok('VIES BLOQUE Opus → bloque, UN seul essai (réessayer n’y change rien), et une trace au journal',
    egal(r.corps, { issue: 'bloque' }) && E.vies.length === 1 && journal.some((l) => /IP_BLOCKED/.test(l)), r.texte);
  scenario({ viesRep: () => ({ actionSucceed: false, errorWrappers: [{ error: 'MS_MAX_CONCURRENT_REQ' }, { error: 'VAT_BLOCKED' }] }) });
  r = await appeler(NUM);
  ok('…une saturation mêlée à un blocage n’est PAS réessayée', egal(r.corps, { issue: 'bloque' }) && E.vies.length === 1);
  scenario({ viesRep: () => ({ actionSucceed: false, errorWrappers: [{ error: 'INVALID_INPUT' }] }) }); r = await appeler(NUM);
  ok('VIES ne comprend pas le numéro → mal_forme, un essai', egal(r.corps, { issue: 'mal_forme' }) && E.vies.length === 1);
  for (const [nom, rep] of [['HTTP 503', { __statut: 503 }], ['le réseau coupé', 'reseau'],
    ['une réponse sur un autre numéro', { ...VALIDE, vatNumber: '18000048017' }], ['une forme inconnue', { ok: true }]]) {
    scenario({ viesRep: () => rep }); r = await appeler(NUM);
    ok(`${nom} → indisponible, cause « panne », un essai, aucune preuve touchée`,
      egal(r.corps, { issue: 'indisponible', cause: 'panne' }) && E.vies.length === 1
      && ecritures('preuves_tva', 'upsert').length === 0 && ecritures('preuves_tva', 'delete').length === 0, r.texte);
  }

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — les limites');
  scenario({ rpcRep: (nom) => ({ data: nom === 'compter_essai_tva' ? 'compte' : true, error: null }) }); r = await appeler(NUM);
  ok('la limite du compte → trop_d_essais, portée « compte », l’heure suivante, sans VIES ni purge',
    egal(r.corps, { issue: 'trop_d_essais', reessayer_a: '2026-10-20T13:00:00.000Z', portee: 'compte' })
    && E.vies.length === 0 && purges().length === 0, r.texte);
  scenario({ rpcRep: (nom) => ({ data: nom === 'compter_essai_tva' ? 'service' : true, error: null }) }); r = await appeler(NUM);
  ok('la limite de tout Opus → trop_d_essais, portée « service », la minute suivante, sans VIES',
    egal(r.corps, { issue: 'trop_d_essais', reessayer_a: '2026-10-20T12:35:00.000Z', portee: 'service' })
    && E.vies.length === 0, r.texte);
  scenario({
    viesRep: () => SATURE,
    rpcRep: (nom, a, n) => ({ data: nom === 'compter_essai_tva' && n >= 2 ? 'compte' : (nom === 'compter_essai_tva' ? 'ok' : true), error: null }),
  });
  r = await appeler(NUM);
  ok('une limite qui mord PENDANT les reprises les arrête : la saturation reste la cause dite',
    egal(r.corps, { issue: 'indisponible', cause: 'sature' }) && E.vies.length === 1, r.texte);
  scenario({ rpcRep: () => ({ data: null, error: { message: 'panne' } }) }); r = await appeler(NUM);
  ok('un compteur en erreur → panne HTTP 500, et VIES n’est PAS appelé', r.statut === 500 && E.vies.length === 0);
  scenario({ rpcRep: () => ({ data: 'peut-etre', error: null }) }); r = await appeler(NUM);
  ok('un compteur qui répond autre chose → panne, sans VIES', r.statut === 500 && E.vies.length === 0);

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — la porte');
  scenario(); r = await appeler(NUM, { origine: 'https://evil.example' });
  ok('une origine inconnue → 403, AVANT tout travail', r.statut === 403 && E.getUser.length === 0 && E.ecritures.length === 0
    && !r.enTetes.get('access-control-allow-origin'));
  scenario(); r = await appeler(NUM, { origine: 'https://opus-project.com' });
  ok('une origine permise : elle est renvoyée telle quelle, jamais « * »',
    r.statut === 200 && r.enTetes.get('access-control-allow-origin') === 'https://opus-project.com' && r.enTetes.get('vary') === 'Origin');
  scenario(); r = await appeler(NUM, { methode: 'GET' });
  ok('GET → 405, sans travail', r.statut === 405 && E.getUser.length === 0);
  scenario(); r = await appeler(NUM, { methode: 'OPTIONS', origine: 'https://opus-project.com' });
  ok('OPTIONS → 200, sans travail', r.statut === 200 && E.getUser.length === 0 && E.ecritures.length === 0);

  /* ================================================================ */
  /*  2b-2 — LA DÉCLARATION SUR L'HONNEUR, ET P5                        */
  /* ================================================================ */
  ecrire('\nLe banc — 2b-2 : les actions');
  for (const [nom, action] of [['« effacer »', 'effacer'], ['`null`', null], ['« Declarer » (la casse)', 'Declarer'], ['un nombre', 42]]) {
    scenario({ limites: [refusIlYA(H)] });
    r = await appeler(null, { corps: { numero: NUM, action, engagement: true, texte: PHRASE_SQL } });
    ok(`une action inconnue, ${nom} → panne HTTP 500, AVANT tout travail (ni jeton, ni base, ni VIES)`,
      r.statut === 500 && E.getUser.length === 0 && E.ecritures.length === 0 && E.vies.length === 0 && E.rpc.length === 0, r.texte);
  }
  scenario(); r = await appeler(null, { corps: { numero: NUM } });
  ok('…une action ABSENTE est le contrôle d’aujourd’hui (une application ancienne marche toujours)',
    r.corps && r.corps.issue === 'reconnu' && E.vies.length === 1, r.texte);

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — 2b-2 : retirer sa déclaration');
  scenario({ preuves: [declaration()] });
  r = await appeler(null, { corps: { action: 'retirer' } });
  const delR = ecritures('preuves_tva', 'delete');
  ok('retirer : la déclaration part → retire, et son numéro', egal(r.corps, { issue: 'retire', numero: NUM }) && E.preuves.length === 0, r.texte);
  ok('…UN retrait : la ligne `declaration` de l’APPELANT, et aucun autre filtre (pas de numéro à lire)',
    delR.length === 1 && aEq(delR[0], 'pro_id', MOI) && aEq(delR[0], 'source', 'declaration')
    && delR[0].ops.filter(([m]) => FILTRES.has(m)).length === 2, delR[0] && JSON.stringify(delR[0].ops));
  ok('…ni VIES, ni compteur, ni purge, ni autre écriture', E.vies.length === 0 && E.rpc.length === 0 && purges().length === 0
    && ecrituresPreuve().length === 1 && ecritAilleurs().length === 0);
  scenario({ preuves: [declaration()] });
  r = await appeler(null, { corps: { action: 'retirer', numero: NUM_K } });
  ok('…le numéro du corps est ignoré : on retire SA déclaration, quelle qu’elle soit', egal(r.corps, { issue: 'retire', numero: NUM }), r.texte);
  scenario({ preuves: [preuve({ declare_le: DECL_ANCIENNE, declaration_texte: PHRASE_SQL })] });
  r = await appeler(null, { corps: { action: 'retirer' } });
  ok('une preuve VIES qui porte une ancienne déclaration n’est PAS touchée → rien_a_retirer',
    egal(r.corps, { issue: 'rien_a_retirer' }) && E.preuves.length === 1 && E.preuves[0].source === 'vies'
    && E.preuves[0].declare_le === DECL_ANCIENNE, r.texte);
  scenario({ preuves: [preuve({ source: 'essai', vies_le: null })] });
  r = await appeler(null, { corps: { action: 'retirer' } });
  ok('…une preuve d’essai non plus', egal(r.corps, { issue: 'rien_a_retirer' }) && E.preuves.length === 1 && E.preuves[0].source === 'essai');
  scenario({ preuves: [declaration(NUM, { pro_id: 'b4800000-0000-4000-8000-00000000000b' })] });
  r = await appeler(null, { corps: { action: 'retirer' } });
  ok('…ni la déclaration d’un AUTRE compte', egal(r.corps, { issue: 'rien_a_retirer' }) && E.preuves.length === 1);
  scenario(); r = await appeler(null, { corps: { action: 'retirer' } });
  ok('…et rien à retirer → rien_a_retirer', egal(r.corps, { issue: 'rien_a_retirer' }));
  scenario({ preuves: [declaration()] });
  r = await appeler(null, { corps: { action: 'retirer' }, jeton: null });
  ok('retirer sans jeton → sans_compte, et rien n’est retiré', egal(r.corps, { issue: 'sans_compte' }) && E.preuves.length === 1 && E.ecritures.length === 0);
  scenario({ preuves: [declaration()], erreurs: { retrait: true } });
  r = await appeler(null, { corps: { action: 'retirer' } });
  ok('un retrait en échec → panne HTTP 500, JAMAIS « retire »', r.statut === 500 && !/"retire"/.test(r.texte));

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — 2b-2 : déclarer, avant la base');
  for (const [nom, corps, attendu] of [
    ['un numéro incomplet', DECLARER({ numero: 'FR9100004800' }), 'mal_forme'],
    ['une clé chiffrée fausse', DECLARER({ numero: 'FR00000048009' }), 'cle_fausse'],
    ['la case pas cochée (`engagement` absent)', DECLARER({ engagement: undefined }), 'sans_engagement'],
    ['`engagement: false`', DECLARER({ engagement: false }), 'sans_engagement'],
    ['`engagement: "true"` (une chaîne)', DECLARER({ engagement: 'true' }), 'sans_engagement'],
    ['`engagement: 1`', DECLARER({ engagement: 1 }), 'sans_engagement'],
    ['un texte absent', DECLARER({ texte: undefined }), 'texte_perime'],
    ['le texte d’une AUTRE version', DECLARER({ texte: 'Je déclare que ce numéro est celui de mon entreprise.' }), 'texte_perime'],
    ['le texte en apostrophes droites', DECLARER({ texte: PHRASE_SQL.replace(/’/g, "'") }), 'texte_perime'],
    ['le texte suivi d’une espace', DECLARER({ texte: `${PHRASE_SQL} ` }), 'texte_perime'],
    ['la forme passe AVANT la case', DECLARER({ numero: 'FR9100004800', engagement: false, texte: 'x' }), 'mal_forme'],
    ['la case passe AVANT le texte', DECLARER({ engagement: false, texte: 'x' }), 'sans_engagement'],
  ]) {
    scenario({ limites: [refusIlYA(H)] });
    r = await appeler(null, { corps });
    ok(`déclarer, ${nom} → ${attendu}, sans jeton ni base ni VIES`,
      egal(r.corps, { issue: attendu }) && E.getUser.length === 0 && E.ecritures.length === 0 && E.vies.length === 0
      && E.rpc.length === 0, r.texte);
  }
  scenario({ limites: [refusIlYA(H)] }); r = await appeler(null, { corps: DECLARER(), jeton: null });
  ok('déclarer sans jeton → sans_compte, rien de lu ni d’écrit', egal(r.corps, { issue: 'sans_compte' }) && E.ecritures.length === 0);
  scenario({ entreprise: null, limites: [refusIlYA(H)] }); r = await appeler(null, { corps: DECLARER() });
  ok('…sans entreprise → sans_entreprise', egal(r.corps, { issue: 'sans_entreprise' }) && rienDeFait());
  scenario({ entreprise: { siren: SIREN, tva: NUM_K }, limites: [refusIlYA(H)] }); r = await appeler(null, { corps: DECLARER() });
  ok('…l’annuaire publie un numéro → deja_publie (l’annuaire garde le dernier mot), rien d’écrit',
    egal(r.corps, { issue: 'deja_publie', numero: NUM_K }) && rienDeFait(), r.texte);
  scenario({ limites: [refusIlYA(H)] }); r = await appeler(null, { corps: DECLARER({ numero: 'FR18000048017' }) });
  ok('…le numéro d’une AUTRE entreprise → autre_siren, sans lire les preuves', egal(r.corps, { issue: 'autre_siren' })
    && rienDeFait() && ecritures('preuves_tva', 'select').length === 0);

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — 2b-2 : déclarer, la preuve du compte');
  scenario({ preuves: [preuve({ numero: NUM_K })], limites: [refusIlYA(H)] });
  r = await appeler(null, { corps: DECLARER() });
  ok('VIES reconnaît déjà un AUTRE numéro de l’entreprise → deja_reconnu, CE numéro et SA date, et RIEN n’est écrit',
    egal(r.corps, { issue: 'deja_reconnu', numero: NUM_K, reconnu_le: '2026-10-05T09:00:00.000Z' }) && rienDeFait()
    && E.preuves.length === 1 && E.preuves[0].numero === NUM_K && E.preuves[0].source === 'vies', r.texte);
  const lueCompte = (ecritures('preuves_tva', 'select')[0] || { ops: [] });
  ok('…la preuve lue est celle de l’APPELANT, toutes sources', aEq(lueCompte, 'pro_id', MOI)
    && !lueCompte.ops.some(([m, c]) => m === 'eq' && c === 'source'), JSON.stringify(lueCompte.ops));
  scenario({ preuves: [preuve()], limites: [refusIlYA(H)] });
  r = await appeler(null, { corps: DECLARER() });
  ok('VIES reconnaît CE numéro → reconnu, sa date : rien à déclarer, rien d’écrit',
    egal(r.corps, { issue: 'reconnu', numero: NUM, reconnu_le: '2026-10-05T09:00:00.000Z' }) && rienDeFait(), r.texte);
  scenario({ preuves: [declaration()] });
  r = await appeler(null, { corps: DECLARER() });
  ok('CE numéro est déjà déclaré → declare, la date d’ORIGINE, rien d’écrit ni de relu dans les compteurs',
    egal(r.corps, { issue: 'declare', numero: NUM, declare_le: DECL_ANCIENNE }) && rienDeFait()
    && ecritures('siret_limites', 'select').length === 0 && E.preuves[0].declare_le === DECL_ANCIENNE, r.texte);
  scenario({ preuves: [declaration(NUM_K)], limites: [refusIlYA(H)] });
  r = await appeler(null, { corps: DECLARER() });
  ok('une déclaration d’un AUTRE numéro + un refus de CE numéro → elle est REMPLACÉE, datée de nouveau',
    egal(r.corps, { issue: 'declare', numero: NUM, declare_le: DATE_BASE }) && E.preuves.length === 1
    && E.preuves[0].numero === NUM && E.preuves[0].declare_le === DATE_BASE, r.texte);
  scenario({ preuves: [preuve({ source: 'essai', vies_le: null })], limites: [refusIlYA(H)] });
  r = await appeler(null, { corps: DECLARER() });
  ok('…une preuve d’essai de ce numéro aussi', r.corps && r.corps.issue === 'declare'
    && E.preuves[0].source === 'declaration' && E.preuves[0].declare_le === DATE_BASE, r.texte);
  scenario({ preuves: [preuve({ siren: '000048017', numero: 'FR18000048017' })], limites: [refusIlYA(H)] });
  r = await appeler(null, { corps: DECLARER() });
  ok('…et la preuve VIES d’une AUTRE entreprise (le compte en a changé) aussi', r.corps && r.corps.issue === 'declare'
    && E.preuves.length === 1 && E.preuves[0].numero === NUM, r.texte);
  scenario({ limites: [refusIlYA(H)], erreurs: { preuves: true } });
  r = await appeler(null, { corps: DECLARER() });
  ok('une lecture de la preuve en échec → panne HTTP 500, rien d’écrit', r.statut === 500 && ecrituresPreuve().length === 0);

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — 2b-2 : déclarer, un refus de VIES ou trois silences');
  scenario();
  r = await appeler(null, { corps: DECLARER() });
  const luesL = ecritures('siret_limites', 'select');
  ok('ni refus retenu ni silences → non_refuse : ni VIES, ni compteur, ni écriture, ni purge',
    egal(r.corps, { issue: 'non_refuse' }) && rienDeFait() && E.preuves.length === 0, r.texte);
  ok('…le refus cherché sous la MÊME empreinte que le contrôle, sur trois heures ; puis les silences sous la leur, sur un jour',
    luesL.length === 2 && aEq(luesL[0], 'cle', cleRefus)
    && luesL[0].ops.some(([m, c, v]) => m === 'gt' && c === 'fenetre' && Date.parse(v) === T0 - T.REFUS_RETENU_MS)
    && aEq(luesL[1], 'cle', cleMuet)
    && luesL[1].ops.some(([m, c, v]) => m === 'gt' && c === 'fenetre' && Date.parse(v) === T0 - T.SANS_REPONSE_TVA.fenetre_ms)
    && !JSON.stringify(luesL.map((e) => e.ops)).includes(MOI), JSON.stringify(luesL.map((e) => e.ops)));
  scenario({ limites: [refusIlYA(T.REFUS_RETENU_MS + 1)] }); r = await appeler(null, { corps: DECLARER() });
  ok('un refus de plus de trois heures → non_refuse', egal(r.corps, { issue: 'non_refuse' }) && rienDeFait());
  scenario({ limites: [refusIlYA(H, cleRefusK)] }); r = await appeler(null, { corps: DECLARER() });
  ok('un refus d’un AUTRE numéro → non_refuse', egal(r.corps, { issue: 'non_refuse' }) && rienDeFait());
  scenario({ limites: [refusIlYA(H)] });
  r = await appeler(null, { corps: DECLARER({ declare_le: '2001-01-01T00:00:00.000Z', reconnu_le: '2001-01-01T00:00:00.000Z',
    source: 'vies', vies_le: '2001-01-01T00:00:00.000Z', pro_id: 'b4800000-0000-4000-8000-00000000000b', siren: '000048017' }) });
  const upD = ecritures('preuves_tva', 'upsert');
  const ligneD = opDe(upD[0], 'upsert')[1];
  ok('un refus retenu → declare, le numéro, et la date que la BASE a posée (jamais celle du téléphone)',
    egal(r.corps, { issue: 'declare', numero: NUM, declare_le: DATE_BASE }), r.texte);
  ok('…UNE écriture : la ligne de déclaration de tva.js, le texte REÇU, rien de ce que le téléphone ajoute, en upsert sur le compte',
    upD.length === 1 && egal(ligneD, { pro_id: MOI, siren: SIREN, numero: NUM, vies_le: null, source: 'declaration', declaration_texte: PHRASE_SQL })
    && egal(opDe(upD[0], 'upsert')[2], { onConflict: 'pro_id' }) && ecrituresPreuve().length === 1, JSON.stringify(ligneD));
  ok('…relue avec SA date de déclaration', /declare_le/.test(String(opDe(upD[0], 'select')[1])));
  ok('…en base : une déclaration, `reconnu_le` = `declare_le`, toutes deux posées par la base',
    E.preuves.length === 1 && E.preuves[0].source === 'declaration' && E.preuves[0].declare_le === DATE_BASE
    && E.preuves[0].reconnu_le === DATE_BASE && E.preuves[0].pro_id === MOI, JSON.stringify(E.preuves));
  ok('…ni VIES, ni compteur d’essais, ni refus retenu de plus, ni purge',
    E.vies.length === 0 && E.rpc.length === 0 && purges().length === 0 && ecritAilleurs().length === 0);
  scenario({ limites: [refusIlYA(H)], erreurs: { upsert: true } }); r = await appeler(null, { corps: DECLARER() });
  ok('une déclaration qui ne s’écrit pas → panne HTTP 500, JAMAIS « declare »', r.statut === 500 && !/"declare"/.test(r.texte));
  scenario({ limites: [refusIlYA(H)], erreurs: { sansDate: true } }); r = await appeler(null, { corps: DECLARER() });
  ok('…une écriture qui ne rend pas sa date (une base pas migrée) → panne, jamais « declare » sans date', r.statut === 500);
  scenario({ limites: [refusIlYA(H)], erreurs: { limites: true } }); r = await appeler(null, { corps: DECLARER() });
  ok('une lecture du refus retenu en échec → panne, rien d’écrit', r.statut === 500 && ecrituresPreuve().length === 0);

  /* P5 : trois contrôles sans réponse, le premier et le dernier séparés
     d'au moins une heure, sur les dernières 24 heures. */
  for (const [nom, lignes, attendu] of [
    ['trois silences, le premier il y a deux heures', [silenceIlYA(2 * H), silenceIlYA(H), silenceIlYA(60000)], 'declare'],
    ['trois silences séparés d’une heure EXACTEMENT', [silenceIlYA(H + 1000), silenceIlYA(H / 2), silenceIlYA(1000)], 'declare'],
    ['trois silences en une heure moins une milliseconde', [silenceIlYA(H + 999), silenceIlYA(H / 2), silenceIlYA(1000)], 'non_refuse'],
    ['deux silences seulement', [silenceIlYA(2 * H), silenceIlYA(60000)], 'non_refuse'],
    ['trois silences dont un d’il y a 24 h pile', [silenceIlYA(24 * H), silenceIlYA(2 * H), silenceIlYA(1000)], 'non_refuse'],
    ['trois silences dont un d’il y a 25 h', [silenceIlYA(25 * H), silenceIlYA(2 * H), silenceIlYA(1000)], 'non_refuse'],
    ['trois silences d’un AUTRE numéro', [silenceIlYA(2 * H, cleMuetK), silenceIlYA(H, cleMuetK), silenceIlYA(1000, cleMuetK)], 'non_refuse'],
  ]) {
    scenario({ limites: lignes });
    r = await appeler(null, { corps: DECLARER() });
    ok(`P5, ${nom} → ${attendu}`, r.corps && r.corps.issue === attendu && E.vies.length === 0 && E.rpc.length === 0
      && (attendu === 'declare' ? E.preuves.length === 1 : rienDeFait()), r.texte);
  }
  scenario({ limites: [silenceIlYA(2 * H), silenceIlYA(H), silenceIlYA(60000)],
    erreurs: { limites: (ops) => ops.some(([m, c, v]) => m === 'eq' && c === 'cle' && String(v).startsWith('tva-muet:')) } });
  r = await appeler(null, { corps: DECLARER() });
  ok('…une lecture des silences en échec → panne, rien d’écrit', r.statut === 500 && ecrituresPreuve().length === 0);

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — 2b-2 : un refus de VIES n’efface plus une déclaration');
  scenario({ viesRep: () => REFUS, preuves: [declaration()] });
  r = await appeler(NUM);
  const renaissance = ecritures('preuves_tva', 'update')[0];
  const retrait = ecritures('preuves_tva', 'delete')[0];
  ok('recontrôler un numéro DÉCLARÉ que VIES refuse : la déclaration RESTE, et la réponse le dit (sa date d’origine)',
    egal(r.corps, { issue: 'refuse', numero: NUM, declare_le: DECL_ANCIENNE }) && E.preuves.length === 1
    && E.preuves[0].source === 'declaration' && E.preuves[0].declare_le === DECL_ANCIENNE && E.preuves[0].declaration_texte === PHRASE_SQL, r.texte);
  ok('…la renaissance d’ABORD (la preuve VIES de CE numéro, de CE compte, qui porte une déclaration), APRÈS VIES',
    !!renaissance && renaissance.vies === 1 && egal(opDe(renaissance, 'update')[1], { source: 'declaration', vies_le: null })
    && aEq(renaissance, 'pro_id', MOI) && aEq(renaissance, 'numero', NUM) && aEq(renaissance, 'source', 'vies')
    && renaissance.ops.some(([m, c, v, w]) => m === 'not' && c === 'declare_le' && v === 'is' && w === null),
    renaissance && JSON.stringify(renaissance.ops));
  ok('…le retrait ENSUITE, de ce qui n’est PAS une déclaration, pour CE numéro et CE compte',
    !!retrait && E.ecritures.indexOf(renaissance) < E.ecritures.indexOf(retrait)
    && aEq(retrait, 'pro_id', MOI) && aEq(retrait, 'numero', NUM)
    && retrait.ops.some(([m, c, v]) => m === 'neq' && c === 'source' && v === 'declaration'), retrait && JSON.stringify(retrait.ops));
  ok('…et le refus est retenu quand même', rpcs('compter_appel_siret').some((x) => x.args.p_cle === cleRefus));
  scenario({ viesRep: () => REFUS, preuves: [preuve({ declare_le: DECL_ANCIENNE, declaration_texte: PHRASE_SQL })] });
  r = await appeler(NUM);
  ok('une preuve VIES qui porte une déclaration, et que VIES refuse : elle REDEVIENT une déclaration (sans date VIES, la date d’origine gardée)',
    egal(r.corps, { issue: 'refuse', numero: NUM, declare_le: DECL_ANCIENNE }) && E.preuves.length === 1
    && E.preuves[0].source === 'declaration' && E.preuves[0].vies_le === null && E.preuves[0].declare_le === DECL_ANCIENNE, JSON.stringify(E.preuves));
  scenario({ viesRep: () => REFUS, preuves: [preuve()] });
  r = await appeler(NUM);
  ok('une preuve VIES de ce numéro SANS déclaration : retirée, et la réponse ne parle d’aucune déclaration',
    egal(r.corps, { issue: 'refuse', numero: NUM }) && E.preuves.length === 0, r.texte);
  scenario({ viesRep: () => REFUS, preuves: [preuve({ source: 'essai', vies_le: null })] });
  r = await appeler(NUM);
  ok('…une preuve d’essai de ce numéro : retirée', egal(r.corps, { issue: 'refuse', numero: NUM }) && E.preuves.length === 0);
  scenario({ viesRep: () => REFUS, preuves: [declaration(NUM_K)] });
  r = await appeler(NUM);
  ok('…la déclaration d’un AUTRE numéro : intacte, et la réponse ne s’en sert pas',
    egal(r.corps, { issue: 'refuse', numero: NUM }) && E.preuves.length === 1 && E.preuves[0].numero === NUM_K
    && E.preuves[0].declare_le === DECL_ANCIENNE, r.texte);
  scenario({ viesRep: () => REFUS, preuves: [declaration(NUM, { pro_id: 'b4800000-0000-4000-8000-00000000000b' })] });
  r = await appeler(NUM);
  ok('…la déclaration du même numéro par un AUTRE compte : ni touchée, ni dite', egal(r.corps, { issue: 'refuse', numero: NUM })
    && E.preuves.length === 1, r.texte);
  scenario({ viesRep: () => REFUS, preuves: [declaration()], erreurs: { renaissance: true } });
  r = await appeler(NUM);
  ok('une renaissance en échec → panne HTTP 500, et rien n’est retiré', r.statut === 500 && E.preuves.length === 1
    && ecritures('preuves_tva', 'delete').length === 0);
  scenario({ viesRep: () => REFUS, preuves: [declaration()],
    erreurs: { preuves: (ops) => ops.some(([m, c]) => m === 'not' && c === 'declare_le') && !ops.some(([m]) => m === 'update') } });
  r = await appeler(NUM);
  ok('une lecture de la déclaration restante en échec → panne (on ne dirait pas « il ne s’imprimera pas » à tort)', r.statut === 500);
  scenario({ preuves: [declaration()], limites: [refusIlYA(H)] });
  r = await appeler(NUM);
  ok('un refus RETENU d’un numéro déclaré → refuse, l’heure, ET la déclaration qui reste ; ni VIES ni compteur',
    egal(r.corps, { issue: 'refuse', numero: NUM, reessayer_a: new Date(T0 - H + T.REFUS_RETENU_MS).toISOString(), declare_le: DECL_ANCIENNE })
    && E.vies.length === 0 && rpcs('compter_essai_tva').length === 0 && ecrituresPreuve().length === 0, r.texte);
  scenario({ preuves: [declaration()] });
  r = await appeler(NUM);
  const upV = opDe(ecritures('preuves_tva', 'upsert')[0], 'upsert')[1] || {};
  ok('VIES finit par reconnaître le numéro déclaré → reconnu ; la ligne écrite ne nomme pas la déclaration, que la base garde JOINTE',
    r.corps && r.corps.issue === 'reconnu' && E.preuves.length === 1 && E.preuves[0].source === 'vies'
    && E.preuves[0].declare_le === DECL_ANCIENNE && !('declare_le' in upV) && !('declaration_texte' in upV), JSON.stringify(E.preuves));
  scenario({ preuves: [declaration(NUM_K)] });
  r = await appeler(NUM);
  ok('…VIES reconnaît un AUTRE numéro : la déclaration est remplacée', r.corps && r.corps.issue === 'reconnu'
    && E.preuves[0].numero === NUM && E.preuves[0].source === 'vies' && E.preuves[0].declare_le === null, JSON.stringify(E.preuves));

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — 2b-2 : P5, VIES ne répond pas');
  scenario({ viesRep: () => SATURE, limites: [silenceIlYA(2 * H), silenceIlYA(70 * 60000)] });
  r = await appeler(NUM);
  const muets = rpcs('compter_appel_siret').filter((x) => x.args.p_cle === cleMuet);
  const luMuet = ecritures('siret_limites', 'select').filter((e) => aEq(e, 'cle', cleMuet));
  ok('VIES saturé pour la TROISIÈME fois en plus d’une heure → indisponible, et `declarable`',
    egal(r.corps, { issue: 'indisponible', cause: 'sature', declarable: true }), r.texte);
  ok('…l’absence de réponse retenue UNE fois par contrôle (pas par requête), sous l’empreinte du compte et du numéro, datée de maintenant, APRÈS VIES',
    muets.length === 1 && rpcs('compter_appel_siret').length === 1 && muets[0].vies === E.vies.length && E.vies.length === T.ESSAIS_VIES.max
    && Date.parse(muets[0].args.p_fenetre) === t && muets[0].args.p_max >= 1 && !JSON.stringify(muets[0].args).includes(MOI),
    JSON.stringify(rpcs('compter_appel_siret').map((x) => x.args)));
  ok('…les silences relus sous cette même clé, sur un jour, APRÈS l’avoir retenue',
    luMuet.length === 1 && luMuet[0].ops.some(([m, c, v]) => m === 'gt' && c === 'fenetre' && Date.parse(v) === t - T.SANS_REPONSE_TVA.fenetre_ms)
    && luMuet[0].seq > muets[0].seq, luMuet[0] && JSON.stringify(luMuet[0].ops));
  ok('…et aucune preuve touchée', ecrituresPreuve().length === 0);
  scenario({ viesRep: () => ({ __statut: 503 }), limites: [silenceIlYA(2 * H), silenceIlYA(70 * 60000)] });
  r = await appeler(NUM);
  ok('une PANNE de VIES compte aussi → indisponible, panne, declarable', egal(r.corps, { issue: 'indisponible', cause: 'panne', declarable: true }), r.texte);
  for (const [nom, lignes] of [
    ['un seul silence avant', [silenceIlYA(2 * H)]],
    ['deux silences en moins d’une heure', [silenceIlYA(40 * 60000), silenceIlYA(20 * 60000)]],
    ['deux silences de plus d’un jour', [silenceIlYA(26 * H), silenceIlYA(25 * H)]],
    ['deux silences d’un AUTRE numéro', [silenceIlYA(2 * H, cleMuetK), silenceIlYA(70 * 60000, cleMuetK)]],
  ]) {
    scenario({ viesRep: () => SATURE, limites: lignes });
    r = await appeler(NUM);
    ok(`P5, ${nom} → indisponible, SANS declarable`, egal(r.corps, { issue: 'indisponible', cause: 'sature' }), r.texte);
  }
  scenario({ viesRep: () => BLOQUE, limites: [silenceIlYA(2 * H), silenceIlYA(70 * 60000)] });
  r = await appeler(NUM);
  ok('un BLOCAGE d’Opus par VIES ne compte pas : bloque, aucun silence retenu ni relu',
    egal(r.corps, { issue: 'bloque' }) && rpcs('compter_appel_siret').length === 0
    && ecritures('siret_limites', 'select').every((e) => !aEq(e, 'cle', cleMuet)), r.texte);
  scenario({ viesRep: () => ({ actionSucceed: false, errorWrappers: [{ error: 'INVALID_INPUT' }] }), limites: [silenceIlYA(2 * H), silenceIlYA(70 * 60000)] });
  r = await appeler(NUM);
  ok('…ni un numéro que VIES ne comprend pas (mal_forme)', egal(r.corps, { issue: 'mal_forme' }) && rpcs('compter_appel_siret').length === 0);
  scenario({ viesRep: () => REFUS, limites: [silenceIlYA(2 * H), silenceIlYA(70 * 60000)] });
  r = await appeler(NUM);
  ok('…ni un refus (c’est une réponse)', egal(r.corps, { issue: 'refuse', numero: NUM })
    && !rpcs('compter_appel_siret').some((x) => x.args.p_cle === cleMuet));
  scenario({ rpcRep: (nom) => ({ data: nom === 'compter_essai_tva' ? 'compte' : true, error: null }),
    limites: [silenceIlYA(2 * H), silenceIlYA(70 * 60000)] });
  r = await appeler(NUM);
  ok('…ni une limite qui mord AVANT VIES (VIES n’a rien vu)', r.corps && r.corps.issue === 'trop_d_essais'
    && rpcs('compter_appel_siret').length === 0);
  scenario({ viesRep: () => SATURE, limites: [silenceIlYA(2 * H), silenceIlYA(70 * 60000)],
    rpcRep: (nom) => (nom === 'compter_appel_siret' ? { data: null, error: { message: 'panne' } } : { data: 'ok', error: null }) });
  r = await appeler(NUM);
  ok('un silence qui ne se retient pas : indisponible quand même (sans le compter), et une trace au journal',
    egal(r.corps, { issue: 'indisponible', cause: 'sature' }) && journal.some((l) => /Absence de réponse non retenue/.test(l)), r.texte);
  scenario({ viesRep: () => SATURE, limites: [silenceIlYA(2 * H), silenceIlYA(70 * 60000)],
    erreurs: { limites: (ops) => ops.some(([m, c, v]) => m === 'eq' && c === 'cle' && String(v).startsWith('tva-muet:')) } });
  r = await appeler(NUM);
  ok('des silences illisibles : indisponible quand même, SANS declarable, et une trace au journal',
    egal(r.corps, { issue: 'indisponible', cause: 'sature' }) && journal.some((l) => /sans réponse illisibles/.test(l)), r.texte);

  /* ---------------------------------------------------------------- */
  ecrire('\nLe banc — 2b-2 : le parcours entier, dans la même base');
  scenario({ viesRep: () => REFUS });
  r = await appeler(NUM);
  const etape1 = egal(r.corps, { issue: 'refuse', numero: NUM }) && E.preuves.length === 0;
  r = await appeler(null, { corps: DECLARER() });
  const dateDecl = r.corps && r.corps.declare_le;
  const etape2 = r.corps && r.corps.issue === 'declare' && typeof dateDecl === 'string' && E.preuves[0].declare_le === dateDecl;
  const viesAvant = E.vies.length;
  r = await appeler(NUM);
  const etape3 = egal(r.corps, { issue: 'refuse', numero: NUM, reessayer_a: r.corps && r.corps.reessayer_a, declare_le: dateDecl })
    && !!r.corps.reessayer_a && E.vies.length === viesAvant;
  r = await appeler(null, { corps: DECLARER() });
  const etape4 = egal(r.corps, { issue: 'declare', numero: NUM, declare_le: dateDecl });
  r = await appeler(null, { corps: { action: 'retirer' } });
  const etape5 = egal(r.corps, { issue: 'retire', numero: NUM }) && E.preuves.length === 0;
  r = await appeler(NUM);
  const etape6 = r.corps && r.corps.issue === 'refuse' && r.corps.declare_le === undefined && !!r.corps.reessayer_a;
  r = await appeler(null, { corps: { action: 'retirer' } });
  const etape7 = egal(r.corps, { issue: 'rien_a_retirer' });
  ok('refusé → déclaré (date de la base) → recontrôlé (refus retenu, la déclaration reste) → redéclaré (même date) → retiré → recontrôlé (plus de déclaration) → rien à retirer',
    etape1 && etape2 && etape3 && etape4 && etape5 && etape6 && etape7,
    JSON.stringify({ etape1, etape2, etape3, etape4, etape5, etape6, etape7 }));
  scenario({ viesRep: () => SATURE });
  r = await appeler(NUM);
  t += 30 * 60000; r = await appeler(NUM);
  const deux = egal(r.corps, { issue: 'indisponible', cause: 'sature' });
  r = await appeler(null, { corps: DECLARER() });
  const pasEncore = egal(r.corps, { issue: 'non_refuse' });
  t += 31 * 60000; r = await appeler(NUM);
  const trois = egal(r.corps, { issue: 'indisponible', cause: 'sature', declarable: true });
  r = await appeler(null, { corps: DECLARER() });
  ok('trois contrôles saturés en plus d’une heure, dans la même base : non_refuse au deuxième, declarable au troisième, puis declare',
    deux && pasEncore && trois && r.corps && r.corps.issue === 'declare' && E.preuves[0].source === 'declaration',
    JSON.stringify({ deux, pasEncore, trois, fin: r.corps }));

  ok('le banc a su simuler chaque requête de la fonction (aucune méthode, aucun filtre inconnu)', fautesDuBanc.length === 0,
    fautesDuBanc.slice(0, 5).join(' ; '));

  ecrire(`BANC ${nb} ${echecs}`);
}

/* ==================================================================== */
/*  LE CONTRÔLE                                                         */
/* ==================================================================== */
let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* Les commentaires partent avant toute lecture de CODE : un contrôle qui
   accuse la documentation qui explique le défaut, c'est arrivé neuf fois
   dans ce projet. Les lignes `//` ne partent qu'entières, pour ne pas
   couper une adresse `https://`. */
const sansCommentaires = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const sqlSansCommentaires = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');

/* ================================================================== */
console.log('\nLes deux copies de tva.js');
{
  const ok = existsSync(path.join(RACINE, APP)) && existsSync(path.join(RACINE, COPIE));
  verifier('les deux fichiers existent', ok, `${APP} et ${COPIE}`);
  if (ok) {
    const a = readFileSync(path.join(RACINE, APP));
    const b = readFileSync(path.join(RACINE, COPIE));
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    verifier('ils sont identiques OCTET POUR OCTET', a.equals(b),
      `premier écart à l'octet ${i} — recopiez : cp ${APP} ${COPIE}`);
  }
  /* Ces deux fichiers sont DÉPLOYÉS tels quels : une séquence d'échappement
     Unicode (barre oblique inverse suivie de « u ») qui traverse l'outil de
     déploiement peut en ressortir changée en vrai caractère, et la copie
     déployée ne serait plus identique au dépôt (20/10/2026). */
  const echappement = new RegExp(`${String.fromCharCode(92, 92)}u[0-9a-fA-F{]`);
  verifier('ni tva.js ni la fonction ne contiennent de séquence d’échappement Unicode',
    !echappement.test(lire(APP)) && !echappement.test(lire(EDGE)));
  const code = sansCommentaires(lire(APP));
  verifier('tva.js n’importe RIEN (sinon la copie ne tourne plus dans Deno)',
    !/^\s*import\s/m.test(code) && !/\brequire\(/.test(code) && !/\bimport\(/.test(code)
    && !/^\s*export\s[^;]*\sfrom\s/m.test(code));
}

/* ================================================================== */
console.log('\nLa saisie — sans réseau');
{
  /* La clé chiffrée : la formule publique, recalculée ici À PART. */
  const cle = (siren) => String((12 + 3 * (Number(siren) % 97)) % 97).padStart(2, '0');
  const sirens = ['356000000', '000048009', '000046011', '000000029', '999999999', '000000000', '123456782'];
  verifier('cleNumeriqueTva suit la formule (12 + 3 × (SIREN mod 97)) mod 97',
    sirens.every((s) => T.cleNumeriqueTva(s) === cle(s)),
    sirens.map((s) => `${s}:${T.cleNumeriqueTva(s)}/${cle(s)}`).join(' '));
  verifier('…sur DEUX chiffres, une clé < 10 comprise (SIREN 000000029 → 02)',
    T.cleNumeriqueTva('000000029') === '02');
  verifier('…et rien pour ce qui n’est pas un SIREN',
    [null, '', '12345678', '1234567890', 'abcdefghi'].every((s) => T.cleNumeriqueTva(s) === null));

  const N = T.normaliserNumeroTva;
  verifier('normaliser : majuscules, sans espaces, points, tirets, barres ni espaces insécables',
    N(' fr 91 000.048-009 ') === 'FR91000048009' && N('FR 91 000048009') === 'FR91000048009'
    && N(`FR${NBSP}91${NNBSP}000/048_009`) === 'FR91000048009');
  verifier('…ni les INVISIBLES d’un copier-coller, ni les traits d’union typographiques',
    N(`FR${ZWSP}91 000${WJ}048${TIRET}009`) === 'FR91000048009');
  verifier('…onze chiffres reçoivent leur « FR »', N('91000048009') === 'FR91000048009');
  verifier('…et dans la CLÉ seulement, O devient 0 et I devient 1 (aucune clé ne les emploie)',
    N('FRO1000048009') === 'FR01000048009' && N('fr9i000048009') === 'FR91000048009'
    && N('FR91OOO048009') === 'FR91OOO048009');

  const A = (t, s) => T.analyserNumeroTva(t, s).etat;
  const cas = [
    ['', null, 'vide'],
    ['   ', null, 'vide'],
    ['F', null, 'incomplet'],
    ['9', null, 'incomplet'],
    ['9100004800', null, 'incomplet'],
    ['FR91', null, 'incomplet'],
    ['FR9100004800', null, 'incomplet'],
    ['FR910000480091', null, 'mal_forme'],
    ['DE123456789', null, 'mal_forme'],
    ['FR91A00048009', null, 'mal_forme'],
    ['FR91OOO048009', null, 'mal_forme'],
    ['FR9!000048009', null, 'mal_forme'],
    ['910000480091', null, 'mal_forme'],
    ['FR00000048009', null, 'cle_fausse'],
    ['fr 91 000 048 009', null, 'pret'],
    ['91000048009', null, 'pret'],
    ['FRK1000048009', null, 'pret'],
    ['FR0K000048009', null, 'pret'],
    ['FRO1000048009', null, 'cle_fausse'],
    ['FR91000048009', '000048009', 'pret'],
    ['FR91000048009', '000048017', 'autre_siren'],
    ['FR00000048009', '000048017', 'autre_siren'],
    ['FR39356000000', null, 'pret'],
  ];
  const faux = cas.filter(([t, s, e]) => A(t, s) !== e);
  verifier(`analyserNumeroTva : ${cas.length} cas, dont la clé en lettres qui passe`,
    faux.length === 0, faux.map(([t, s, e]) => `${JSON.stringify(t)}/${s} → ${A(t, s)} (attendu ${e})`).join(' ; '));
  verifier('…et le numéro rendu est toujours sous sa forme normale',
    T.analyserNumeroTva('fr 91-000 048 009').numero === 'FR91000048009');
  verifier('FORME_TVA : FR, deux caractères SANS I NI O, neuf chiffres — la même règle que la base',
    T.FORME_TVA.source === '^FR[0-9A-HJ-NP-Z]{2}\\d{9}$'
    && !T.FORME_TVA.test('FRI1000048009') && !T.FORME_TVA.test('FR0O000048009') && T.FORME_TVA.test('FRK1000048009'));
}

/* ================================================================== */
console.log('\nCe que VIES répond — sur les formes relevées le 20/10/2026');
{
  const L = T.lireReponseVies;
  const N = 'FR91000048009';
  /* La forme du contrat officiel (POST /check-vat-number), relevée sur un
     numéro public le 20/10 à 13:51 UTC — nom et adresse remplacés. */
  const postValide = {
    countryCode: 'FR', vatNumber: '91000048009', requestDate: '2026-10-20T13:51:00.982Z', valid: true,
    requestIdentifier: '', name: 'SOCIETE FICTIVE', address: '1 RUE FICTIVE\n13000 MARSEILLE',
    traderName: '---', traderNameMatch: 'NOT_PROCESSED',
  };
  const lu = L(postValide, N);
  verifier('POST, valide → reconnu, avec la date de VIES',
    lu.etat === 'reconnu' && lu.vies_le === '2026-10-20T13:51:00.982Z', JSON.stringify(lu));
  verifier('…et le nom et l’adresse ne sont NI lus NI rendus',
    egal(Object.keys(lu).sort(), ['etat', 'vies_le']) && !JSON.stringify(lu).includes('FICTIVE'));
  verifier('POST, valid: false → refuse',
    L({ countryCode: 'FR', vatNumber: '91000048009', valid: false, name: '---', address: '---' }, N).etat === 'refuse');
  verifier('POST saturé (errorWrappers MS_MAX_CONCURRENT_REQ) → sature',
    L({ actionSucceed: false, errorWrappers: [{ error: 'MS_MAX_CONCURRENT_REQ' }] }, N).etat === 'sature');
  verifier('POST, INVALID_INPUT → mal_forme',
    L({ actionSucceed: false, errorWrappers: [{ error: 'INVALID_INPUT' }] }, N).etat === 'mal_forme');
  verifier('IP_BLOCKED, VAT_BLOCKED, INVALID_REQUESTER_INFO → bloque : ils visent OPUS, et réessayer n’y change rien',
    ['IP_BLOCKED', 'VAT_BLOCKED', 'INVALID_REQUESTER_INFO'].every(
      (e) => L({ actionSucceed: false, errorWrappers: [{ error: e }] }, N).etat === 'bloque')
    && egal([...T.CODES_BLOCAGE].sort(), ['INVALID_REQUESTER_INFO', 'IP_BLOCKED', 'VAT_BLOCKED']));
  verifier('…une saturation mêlée à un blocage → bloque (on ne réessaie pas un blocage)',
    L({ actionSucceed: false, errorWrappers: [{ error: 'MS_MAX_CONCURRENT_REQ' }, { error: 'IP_BLOCKED' }] }, N).etat === 'bloque');
  verifier('MS_UNAVAILABLE, SERVICE_UNAVAILABLE, un code inconnu → indisponible, jamais refuse',
    ['MS_UNAVAILABLE', 'SERVICE_UNAVAILABLE', 'QUELQUE_CHOSE'].every(
      (e) => L({ actionSucceed: false, errorWrappers: [{ error: e }] }, N).etat === 'indisponible'));
  const avecCodes = L({ actionSucceed: false, errorWrappers: [{ error: 'IP_BLOCKED' }] }, N);
  verifier('…et la lecture dit, pour le journal, les CODES de VIES', egal(avecCodes.codes, ['IP_BLOCKED']));
  const inconnu = L({ quelque: 'chose', name: 'SOCIETE FICTIVE', address: 'RUE FICTIVE' }, N);
  verifier('…d’un corps inconnu, les seules CLÉS — jamais une valeur, donc jamais un nom',
    inconnu.etat === 'indisponible' && !JSON.stringify(inconnu).includes('FICTIVE')
    && egal(inconnu.codes, ['cle:address', 'cle:name', 'cle:quelque']), JSON.stringify(inconnu));
  /* LE PIÈGE MESURÉ : l'interface du site rend `isValid: false` quand la
     France est saturée. Lu naïvement, c'est un refus. */
  verifier('LE PIÈGE : isValid false + userError MS_MAX_CONCURRENT_REQ → sature, PAS refuse',
    L({ isValid: false, userError: 'MS_MAX_CONCURRENT_REQ', name: '---', address: '---', vatNumber: '91000048009' }, N).etat === 'sature');
  verifier('l’interface du site : VALID → reconnu, INVALID → refuse',
    L({ isValid: true, userError: 'VALID', vatNumber: '91000048009', requestDate: '2026-10-20T13:23:58.804Z' }, N).etat === 'reconnu'
    && L({ isValid: false, userError: 'INVALID', vatNumber: '91000048009' }, N).etat === 'refuse');
  verifier('une forme inconnue, un corps vide, un tableau, du texte → indisponible',
    [null, undefined, {}, [], 'ok', 42, { valid: 'true' }, { isValid: true }].every((c) => L(c, N).etat === 'indisponible'));
  verifier('un numéro qui n’est pas celui envoyé → indisponible (on ne croit pas une réponse à côté)',
    L({ ...postValide, vatNumber: '18000048017' }, N).etat === 'indisponible');
  verifier('…le même numéro avec son préfixe ou des espaces est bien le même',
    L({ ...postValide, vatNumber: 'FR 91000048009' }, N).etat === 'reconnu');
  verifier('…et une clé « FR » est le numéro envoyé, pas un préfixe à retirer (FRFR356000000)',
    L({ ...postValide, vatNumber: 'FR356000000' }, 'FRFR356000000').etat === 'reconnu'
    && L({ ...postValide, vatNumber: '356000000' }, 'FRFR356000000').etat === 'indisponible');
  verifier('un autre pays → indisponible', L({ ...postValide, countryCode: 'DE' }, N).etat === 'indisponible');
  verifier('une date de VIES illisible n’est pas inventée : vies_le vaut null',
    L({ ...postValide, requestDate: '20/10/2026' }, N).vies_le === null
    && L({ ...postValide, requestDate: '2026-10-20' }, N).vies_le === null
    && L({ ...postValide, requestDate: '2026-10-20T13:51:00+02:00' }, N).vies_le === null);
  verifier('les codes de saturation sont ceux de la WSDL de test de VIES',
    egal([...T.CODES_SATURATION].sort(), ['GLOBAL_MAX_CONCURRENT_REQ', 'GLOBAL_MAX_CONCURRENT_REQ_TIME',
      'MS_MAX_CONCURRENT_REQ', 'MS_MAX_CONCURRENT_REQ_TIME', 'TIMEOUT']));
}

/* ================================================================== */
console.log('\nCe que la fonction renvoie, et ce que la base garde');
{
  const R = T.reponsePubliqueTva;
  let leve = false;
  try { R({ issue: 'ok' }); } catch { leve = true; }
  verifier('une issue inconnue LÈVE (une panne visible, pas une réponse inventée)', leve);
  verifier('reconnu : le numéro et la date, rien d’autre',
    egal(R({ issue: 'reconnu', numero: 'FR91000048009', reconnu_le: 'x', name: 'FUITE', vies_le: 'y', pro_id: 'z' }),
      { issue: 'reconnu', numero: 'FR91000048009', reconnu_le: 'x' }));
  verifier('refuse : le numéro et l’heure où redemander ; indisponible : sa cause ; trop_d_essais : l’heure et la portée',
    egal(R({ issue: 'refuse', numero: 'N', reessayer_a: 'h', siren: 's' }), { issue: 'refuse', numero: 'N', reessayer_a: 'h' })
    && egal(R({ issue: 'indisponible', cause: 'sature', codes: ['X'] }), { issue: 'indisponible', cause: 'sature' })
    && egal(R({ issue: 'trop_d_essais', reessayer_a: 'h', portee: 'compte', cle: 'k' }), { issue: 'trop_d_essais', reessayer_a: 'h', portee: 'compte' }));
  verifier('autre_siren ne dit rien du SIREN ; sans_compte, sans_entreprise, bloque, mal_forme : rien',
    ['autre_siren', 'sans_compte', 'sans_entreprise', 'bloque', 'mal_forme', 'cle_fausse'].every(
      (i) => egal(R({ issue: i, siren: '000048009', numero: 'FR', codes: ['IP_BLOCKED'] }), { issue: i })));
  /* 2b-2 : onze issues du contrôle, et sept de la déclaration sur
     l'honneur (cahier 2b-2, §2.10) — 18 côté serveur, 21 en tout. */
  verifier('les issues du serveur : les onze du contrôle, et les sept de la déclaration (18)',
    egal([...T.ISSUES_TVA_SERVEUR].sort(), ['autre_siren', 'bloque', 'cle_fausse', 'declare', 'deja_publie', 'deja_reconnu',
      'indisponible', 'mal_forme', 'non_refuse', 'reconnu', 'refuse', 'retire', 'rien_a_retirer', 'sans_compte',
      'sans_engagement', 'sans_entreprise', 'texte_perime', 'trop_d_essais'])
    && T.ISSUES_TVA_SERVEUR.length === 18 && T.ISSUES_TVA.length === 21
    && ['reseau', 'lent', 'service_indisponible'].every((i) => T.ISSUES_TVA.includes(i) && !T.ISSUES_TVA_SERVEUR.includes(i)),
    [...T.ISSUES_TVA_SERVEUR].join(', '));
  verifier('declare : le numéro et la date de la BASE ; deja_reconnu : le numéro reconnu et sa date ; retire : le numéro',
    egal(R({ issue: 'declare', numero: 'N', declare_le: 'd', reconnu_le: 'x', declaration_texte: 'T', pro_id: 'z' }),
      { issue: 'declare', numero: 'N', declare_le: 'd' })
    && egal(R({ issue: 'deja_reconnu', numero: 'N', reconnu_le: 'r', declare_le: 'd', vies_le: 'v' }),
      { issue: 'deja_reconnu', numero: 'N', reconnu_le: 'r' })
    && egal(R({ issue: 'retire', numero: 'N', declare_le: 'd' }), { issue: 'retire', numero: 'N' }));
  verifier('refuse emporte la date d’une déclaration qui RESTE ; indisponible, `declarable` (P5) — et rien d’autre',
    egal(R({ issue: 'refuse', numero: 'N', reessayer_a: 'h', declare_le: 'd', declaration_texte: 'T' }),
      { issue: 'refuse', numero: 'N', reessayer_a: 'h', declare_le: 'd' })
    && egal(R({ issue: 'indisponible', cause: 'sature', declarable: true, silences: 3 }),
      { issue: 'indisponible', cause: 'sature', declarable: true })
    && egal(R({ issue: 'indisponible', cause: 'panne', declarable: undefined }), { issue: 'indisponible', cause: 'panne' }));
  verifier('sans_engagement, texte_perime, non_refuse, rien_a_retirer : rien que l’issue',
    ['sans_engagement', 'texte_perime', 'non_refuse', 'rien_a_retirer'].every(
      (i) => egal(R({ issue: i, numero: 'N', declare_le: 'd', texte: 'T', reessayer_a: 'h' }), { issue: i })));

  const P = T.ligneDePreuveTva;
  const ligne = P({ pro_id: 'u', siren: '000048009', numero: 'FR91000048009', vies_le: '2026-10-20T13:51:00.982Z' });
  verifier('la ligne de preuve : cinq colonnes, source « vies », et PAS de reconnu_le (la base la pose)',
    egal(Object.keys(ligne || {}).sort(), ['numero', 'pro_id', 'siren', 'source', 'vies_le']) && ligne.source === 'vies');
  verifier('…et aucune ligne pour un numéro qui ne désigne pas ce SIREN, ou mal formé',
    P({ pro_id: 'u', siren: '000048017', numero: 'FR91000048009' }) === null
    && P({ pro_id: 'u', siren: '000048009', numero: 'FR9100004800' }) === null
    && P({ pro_id: 'u', siren: '000048009', numero: 'FRIO000048009' }) === null
    && P({ pro_id: null, siren: '000048009', numero: 'FR91000048009' }) === null);

  /* 2b-2 : la ligne d'une DÉCLARATION — la même forme, la source
     `declaration`, `vies_le` vide, le texte montré ; ni `declare_le` ni
     `reconnu_le` (la base les pose). */
  const D = T.ligneDeDeclarationTva;
  const decl = D({ pro_id: 'u', siren: '000048009', numero: 'FR91000048009', texte: T.DECLARATION_TVA, declare_le: 'x', vies_le: 'y' });
  verifier('la ligne de déclaration : six colonnes, source « declaration », vies_le vide, le texte — et PAS de date',
    egal(decl, { pro_id: 'u', siren: '000048009', numero: 'FR91000048009', vies_le: null, source: 'declaration',
      declaration_texte: T.DECLARATION_TVA }), JSON.stringify(decl));
  verifier('…et aucune ligne pour un texte hors des versions connues, ou un numéro qui ne désigne pas ce SIREN',
    D({ pro_id: 'u', siren: '000048009', numero: 'FR91000048009', texte: T.DECLARATION_TVA.replace(/’/g, "'") }) === null
    && D({ pro_id: 'u', siren: '000048009', numero: 'FR91000048009', texte: `${T.DECLARATION_TVA} ` }) === null
    && D({ pro_id: 'u', siren: '000048009', numero: 'FR91000048009' }) === null
    && D({ pro_id: 'u', siren: '000048017', numero: 'FR91000048009', texte: T.DECLARATION_TVA }) === null
    && D({ pro_id: null, siren: '000048009', numero: 'FR91000048009', texte: T.DECLARATION_TVA }) === null);
}

/* ================================================================== */
console.log('\nLa déclaration sur l’honneur — le texte, ses versions, P5 (2b-2)');
{
  /* La phrase décidée par le propriétaire (PLAN-DEVIS 10.19) est écrite
     avec des apostrophes DROITES ; le code, avec des typographiques. On
     compare après normalisation — on ne « corrige » jamais la constante. */
  const plan = lire('docs/PLAN-DEVIS.md');
  const duPlan = (plan.match(/« (Je certifie sur l'honneur que ce numéro[^»]*?) »/) || [])[1] || '';
  verifier('DECLARATION_TVA est la phrase décidée (PLAN-DEVIS 10.19), mot pour mot, apostrophes typographiques',
    !!duPlan && T.DECLARATION_TVA.replace(/’/g, "'") === duPlan && !T.DECLARATION_TVA.includes("'")
    && T.DECLARATION_TVA.includes('’'), `plan : ${duPlan}`);
  const schema = sqlSansCommentaires(lire('supabase/schema.sql'));
  const regle = (schema.match(/add constraint preuve_tva_declaration_check[\s\S]*?declaration_texte in \(([\s\S]*?)\)\)\);/) || [])[1] || '';
  const duSql = [...regle.matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'"));
  verifier('DECLARATIONS_TVA_CONNUES = la liste fermée de la base, à l’octet ; DECLARATION_TVA en est la dernière',
    duSql.length >= 1 && egal([...T.DECLARATIONS_TVA_CONNUES], duSql)
    && T.DECLARATIONS_TVA_CONNUES[T.DECLARATIONS_TVA_CONNUES.length - 1] === T.DECLARATION_TVA
    && Object.isFrozen(T.DECLARATIONS_TVA_CONNUES), `base : ${JSON.stringify(duSql)}`);

  verifier('P5 : trois contrôles, le premier et le dernier séparés d’au moins une heure, sur un jour',
    egal(JSON.parse(JSON.stringify(T.SANS_REPONSE_TVA)), { controles: 3, ecart_ms: 3600000, fenetre_ms: 86400000 })
    && Object.isFrozen(T.SANS_REPONSE_TVA));
  verifier('…et trois contrôles de quatre requêtes tiennent sous la limite du compte (24 par heure)',
    T.SANS_REPONSE_TVA.controles * T.ESSAIS_VIES.max <= T.LIMITES_TVA.compte.max);
  const M = Date.parse('2026-10-20T12:00:00.000Z');
  const il = (ms) => new Date(M - ms).toISOString();
  const H = 3600000;
  const cas = [
    ['trois, sur deux heures', [il(2 * H), il(H), il(0)], true],
    ['trois, à une heure EXACTEMENT', [il(H), il(H / 2), il(0)], true],
    ['trois, à une heure moins une milliseconde', [il(H - 1), il(H / 2), il(0)], false],
    ['deux', [il(2 * H), il(0)], false],
    ['quatre en dix minutes', [il(600000), il(400000), il(200000), il(0)], false],
    ['trois dont un à 24 h PILE (exclu)', [il(24 * H), il(2 * H), il(0)], false],
    ['trois dont un à 24 h moins 1 ms', [il(24 * H - 1), il(12 * H), il(0)], true],
    ['trois dont un illisible', [il(2 * H), 'hier', il(0)], false],
    ['les formes de PostgREST et de PostgreSQL', ['2026-10-20T10:00:00.123456+00:00', '2026-10-20 11:00:00+00', '2026-10-20T12:00:00Z'], true],
    ['dans le désordre', [il(0), il(2 * H), il(H)], true],
  ];
  const faux = cas.filter(([, f, att]) => T.declarableSansReponse(f, M) !== att);
  verifier(`declarableSansReponse : ${cas.length} cas, dont les deux bornes`, faux.length === 0,
    faux.map(([n, f]) => `${n} → ${T.declarableSansReponse(f, M)}`).join(' ; '));
  verifier('…et rien pour ce qui n’est pas une liste, ou sans horloge',
    [null, undefined, 'abc', {}, 42].every((f) => T.declarableSansReponse(f, M) === false)
    && T.declarableSansReponse([il(2 * H), il(H), il(0)], NaN) === false);

  /* LES DATES, à l'heure du TÉLÉPHONE — la même règle que `dateFrancaise`
     (entreprise.js), que tva.js ne peut pas importer : comparées dans
     quatre fuseaux, sur les formes de PostgREST et de PostgreSQL. */
  const FORMES = ['2026-10-19T23:18:21.716617+00:00', '2026-10-19 23:18:21+00', '2026-10-19T23:18:21.5+00:00',
    '2026-10-19T23:18:21Z', '2026-10-19 23:18:21-05', '2026-10-19T23:18:21', '2026-10-19T23:18:21+0530',
    '2026-10-19 23:18', '2026-09-02', '2026-03-29T00:30:00Z', '2026-10-25T00:30:00Z', null, 'demain', ''];
  const avant = process.env.TZ;
  const ecarts = [];
  try {
    for (const tz of ['Europe/Paris', 'America/Martinique', 'Pacific/Kiritimati', 'UTC']) {
      process.env.TZ = tz;
      for (const f of FORMES) if (T.dateFrancaiseTva(f) !== dateFrancaise(f)) ecarts.push(`${tz} ${f} : ${T.dateFrancaiseTva(f)} / ${dateFrancaise(f)}`);
    }
    process.env.TZ = 'Europe/Paris';
    if (T.dateFrancaiseTva('2026-11-09T23:30:00.000000+00:00') !== '10/11/2026') ecarts.push('Paris, 0 h 30 : pas le jour du téléphone');
  } finally {
    if (avant === undefined) delete process.env.TZ; else process.env.TZ = avant;
  }
  verifier('dateFrancaiseTva = dateFrancaise, dans quatre fuseaux, sur quatorze formes (0 h 30 à Paris est le 10, pas le 9)',
    ecarts.length === 0, ecarts.join(' ; '));
}

/* ================================================================== */
console.log('\nLes mots — chaque message est FAIT TOURNER');
{
  const etats = ['vide', 'incomplet', 'mal_forme', 'cle_fausse', 'autre_siren'];
  const issues = [...T.ISSUES_TVA, 'issue_que_cette_version_ne_connait_pas'];
  const variantes = [
    { siren: '000048009' },
    { siren: '000048009', regime: 'reel', reessayer_a: '2026-10-20T15:00:00.000Z', portee: 'compte', cause: 'sature' },
    { siren: '000048009', regime: 'franchise', portee: 'service', cause: 'panne' },
  ];
  /* 2b-2 : les branches de la déclaration passent les MÊMES règles de
     vocabulaire — la case offerte, une déclaration qui reste, P5. */
  const variantes2b2 = [
    { siren: '000048009', regime: 'reel', peutDeclarer: true },
    { siren: '000048009', regime: 'franchise', peutDeclarer: true, reessayer_a: '2026-10-20T15:00:00.000Z' },
    { siren: '000048009', regime: 'reel', peutDeclarer: true, declarable: true, cause: 'sature' },
    { siren: '000048009', declare_le: '2026-10-20T13:51:01.716617+00:00', numero: 'FRK1000048009', reconnu_le: '2026-10-19 08:00:00+00' },
    { siren: '000048009', declare_le: '2026-10-20T13:51:01Z', reessayer_a: '2026-10-20T15:00:00.000Z', peutDeclarer: true },
  ];
  const textes = [];
  for (const d of [...variantes, ...variantes2b2]) for (const i of [...etats, ...issues]) textes.push([i, T.messageTva(i, d).texte]);
  const vides = textes.filter(([, t]) => !t || t.length < 30);
  verifier('chaque état et chaque issue a sa phrase (et « pret » n’en a pas)',
    vides.length === 0 && T.messageTva('pret').texte === null, [...new Set(vides.map(([i]) => i))].join(', '));
  const VERIFIE = /v[ée]rifi/i;
  const tout = textes.map(([, t]) => t || '').join(' ¶ ');
  verifier('jamais « vérifi… » : ce mot appartient au badge', !VERIFIE.test(tout),
    textes.filter(([, t]) => VERIFIE.test(t || '')).map(([i]) => i).join(', '));
  verifier('jamais « registre » : VIES n’en est pas un', !/registre/i.test(tout));
  verifier('jamais « certifié », « agréé », « validé par l’État »',
    !/certifi|agré[ée]|validée? par l.(État|INSEE)/i.test(tout));
  verifier('jamais l’apostrophe droite', !tout.includes("'"));
  verifier('autre_siren dit le SIREN attendu, par groupes de trois',
    T.messageTva('autre_siren', { siren: '000048009' }).texte.includes('000 048 009'));
  const nEstPasEnCause = ['indisponible', 'bloque', 'reseau', 'service_indisponible', 'trop_d_essais'];
  verifier('VIES, Opus ou le réseau n’ont pas contrôlé : le numéro n’est JAMAIS accusé',
    nEstPasEnCause.every((i) => variantes.every((d) => T.messageTva(i, d).texte.includes('n’est pas en cause'))));
  verifier('« indisponible » ne dit « saturé » QUE si c’est la cause',
    /saturé/.test(T.messageTva('indisponible', { cause: 'sature' }).texte)
    && !/saturé/.test(T.messageTva('indisponible', { cause: 'panne' }).texte)
    && !/saturé/.test(T.messageTva('indisponible', {}).texte));
  verifier('« bloque » ne propose PAS de réessayer : ce blocage ne se lève pas en réessayant',
    T.messageTva('bloque', {}).action === null && /n’y changerait rien/.test(T.messageTva('bloque', {}).texte));
  verifier('« lent » ne promet PAS que rien n’a changé (la réponse a pu arriver après notre départ)',
    !/rien n.a chang/.test(T.messageTva('lent').texte));
  verifier('« refuse » renvoie au service des impôts des entreprises',
    variantes.every((d) => /service des impôts des entreprises/.test(T.messageTva('refuse', d).texte)));
  verifier('…et ne conseille la franchise qu’à qui ne l’a PAS déjà choisie',
    /franchise en base de TVA/.test(T.messageTva('refuse', { regime: 'reel' }).texte)
    && !/franchise/.test(T.messageTva('refuse', { regime: 'franchise' }).texte));
  verifier('…un refus RETENU dit l’heure où VIES pourra être redemandé',
    /avant \d{1,2} h/.test(T.messageTva('refuse', { reessayer_a: '2026-10-20T15:00:00.000Z' }).texte)
    && !/avant \d{1,2} h/.test(T.messageTva('refuse', {}).texte));
  verifier('trop_d_essais : la portée dit LAQUELLE des deux limites',
    T.messageTva('trop_d_essais', { portee: 'service' }).texte !== T.messageTva('trop_d_essais', { portee: 'compte' }).texte);
  verifier('les actions sont « corriger », « reessayer » ou rien',
    [...etats, ...issues].every((i) => [...variantes, ...variantes2b2].every(
      (d) => [null, 'corriger', 'reessayer'].includes(T.messageTva(i, d).action))));

  /* ---------------------------------------------------------------- */
  /* 2b-2 — LES PHRASES DE LA DÉCLARATION, mot pour mot (cahier 2b-2,
     annexe A.5). Un seul écart, et il est voulu : « pour enregistrer »
     contient « registre », que les contrôles de vocabulaire refusent dans
     tva.js — `sans_engagement` le dit autrement. */
  const avantTz = process.env.TZ;
  process.env.TZ = 'Europe/Paris';
  try {
    const m = (i, d = {}) => T.messageTva(i, d).texte;
    const EXACTES = [
      ['declare', {}, 'Votre déclaration est enregistrée : ce numéro s’imprimera sur vos devis. VIES ne le reconnaît pas aujourd’hui ; '
        + 'si votre service des impôts le corrige ou l’active, faites-le contrôler de nouveau.'],
      ['sans_engagement', {}, 'Cochez la déclaration pour que ce numéro soit enregistré.'],
      ['texte_perime', {}, 'Le texte de la déclaration a changé depuis cette version d’Opus : mettez l’application à jour, puis '
        + 'relisez-le avant de cocher. Rien n’a été enregistré.'],
      ['non_refuse', {}, 'Opus n’a pas de refus récent de VIES pour ce numéro : faites-le contrôler de nouveau. S’il le refuse, la '
        + 'déclaration vous sera proposée.'],
      ['deja_reconnu', { numero: 'FRK1000048009', reconnu_le: '2026-10-19T22:30:00.123456+00:00' },
        'VIES a reconnu le numéro FRK1000048009 de votre entreprise le 20/10/2026 : c’est lui qui s’imprime sur vos devis. S’il '
        + 'n’est plus valable, faites-le contrôler de nouveau.'],
      ['deja_reconnu', {}, 'VIES a reconnu un autre numéro de votre entreprise : c’est lui qui s’imprime sur vos devis. S’il n’est '
        + 'plus valable, faites-le contrôler de nouveau.'],
      ['retire', {}, 'Votre déclaration est retirée : ce numéro ne s’imprimera plus sur vos devis.'],
      ['rien_a_retirer', {}, 'Il n’y a plus de déclaration à retirer : elle a déjà été retirée, ou VIES a reconnu votre numéro '
        + 'entre-temps.'],
      ['refuse', { declare_le: '2026-10-19T22:30:00+00:00', peutDeclarer: true, regime: 'reel' },
        'VIES ne reconnaît pas ce numéro. Votre déclaration sur l’honneur du 20/10/2026 reste enregistrée : il continue de '
        + 's’imprimer sur vos devis. Si vous savez qu’il est faux, retirez votre déclaration.'],
      ['refuse', { declare_le: '2026-10-20T08:00:00Z', reessayer_a: '2026-10-20T13:00:00.000Z' },
        'VIES a refusé ce numéro il y a moins de trois heures : Opus ne le lui redemandera pas avant 15 h. Votre déclaration sur '
        + 'l’honneur du 20/10/2026 reste enregistrée : il continue de s’imprimer sur vos devis. Si vous savez qu’il est faux, '
        + 'retirez votre déclaration.'],
      ['refuse', { peutDeclarer: true, regime: 'reel' },
        'VIES ne reconnaît pas ce numéro aujourd’hui. Un numéro refusé peut n’être pas attribué, ou pas encore actif : votre '
        + 'service des impôts des entreprises peut dire pourquoi, et l’activer. Si vous êtes en franchise en base de TVA, '
        + 'choisissez-la dans « TVA ». Sinon, tant que VIES ne le reconnaît pas, Opus ne l’imprime sur vos devis que si vous le '
        + 'déclarez sur l’honneur, plus bas.'],
      ['refuse', { peutDeclarer: true, regime: 'reel', reessayer_a: '2026-10-20T13:05:00.000Z' },
        'VIES a refusé ce numéro il y a moins de trois heures : Opus ne le lui redemandera pas avant 15 h 05. Un numéro refusé '
        + 'peut n’être pas attribué, ou pas encore actif : votre service des impôts des entreprises peut dire pourquoi, et '
        + 'l’activer. Si vous êtes en franchise en base de TVA, choisissez-la dans « TVA ». Sinon, tant que VIES ne le reconnaît '
        + 'pas, Opus ne l’imprime sur vos devis que si vous le déclarez sur l’honneur, plus bas.'],
      ['refuse', { peutDeclarer: true, regime: 'franchise' },
        'VIES ne reconnaît pas ce numéro aujourd’hui. Un numéro refusé peut n’être pas attribué, ou pas encore actif : votre '
        + 'service des impôts des entreprises peut dire pourquoi, et l’activer. Tant que VIES ne le reconnaît pas, Opus ne '
        + 'l’imprime sur vos devis que si vous le déclarez sur l’honneur, plus bas.'],
      ['refuse', { regime: 'reel' },
        'VIES ne reconnaît pas ce numéro aujourd’hui : il ne s’imprimera pas sur vos devis. Un numéro refusé peut n’être pas '
        + 'attribué, ou pas encore actif : c’est votre service des impôts des entreprises qui peut dire pourquoi, et l’activer. '
        + 'Si vous êtes en franchise en base de TVA, choisissez-la dans « TVA ».'],
    ];
    const ecartes = EXACTES.filter(([i, d, att]) => m(i, d) !== att);
    verifier(`les phrases de la déclaration, mot pour mot (${EXACTES.length}, dont les quatre formes du refus)`,
      ecartes.length === 0, ecartes.map(([i, d]) => `${i} ${JSON.stringify(d)} → « ${m(i, d)} »`).join(' ¶ '));

    /* La case s'offre plus bas : on ne dit JAMAIS « il ne s'imprimera pas »
       au-dessus d'elle (S26) — ni d'un numéro dont la déclaration reste. */
    const refusOffert = [{ peutDeclarer: true }, { peutDeclarer: true, reessayer_a: '2026-10-20T13:00:00.000Z' },
      { peutDeclarer: true, regime: 'franchise' }, { declare_le: '2026-10-20T08:00:00Z' },
      { declare_le: '2026-10-20T08:00:00Z', peutDeclarer: true, reessayer_a: '2026-10-20T13:00:00.000Z' }];
    verifier('« il ne s’imprimera pas » n’est jamais dit quand la case est offerte, ni d’un numéro qui reste déclaré',
      refusOffert.every((d) => !/ne s’imprimera pas/.test(m('refuse', d))));
    verifier('…« plus bas » n’annonce la case que là où l’écran peut l’offrir',
      /plus bas/.test(m('refuse', { peutDeclarer: true })) && !/plus bas/.test(m('refuse', {}))
      && !/plus bas/.test(m('refuse', { peutDeclarer: 'oui' })) && !/plus bas/.test(m('refuse', { declare_le: '2026-10-20T08:00:00Z', peutDeclarer: true }))
      && /plus bas/.test(m('indisponible', { peutDeclarer: true, declarable: true }))
      && !/plus bas/.test(m('indisponible', { declarable: true })) && !/plus bas/.test(m('indisponible', { peutDeclarer: true })));

    /* P5 : ce que dit une absence de réponse, quand la case pourrait
       s'offrir — et RIEN de plus quand elle ne le peut pas. */
    const SILENCE = ' Si VIES ne répond toujours pas à trois contrôles, en plus d’une heure, Opus vous proposera de déclarer ce '
      + 'numéro sur l’honneur.';
    const DECLARABLE = ' VIES n’a pas répondu à trois contrôles en plus d’une heure : si vous êtes sûr de ce numéro, vous pouvez '
      + 'le déclarer sur l’honneur, plus bas.';
    const BLOQUE = ' La déclaration sur l’honneur n’est proposée qu’après une réponse de VIES.';
    const suites = [
      ['indisponible', { cause: 'sature' }, SILENCE], ['indisponible', { cause: 'panne' }, SILENCE],
      ['indisponible', { cause: 'sature', declarable: true }, DECLARABLE], ['indisponible', { declarable: 'oui' }, SILENCE],
      ['lent', {}, SILENCE], ['reseau', {}, SILENCE], ['bloque', {}, BLOQUE], ['bloque', { declarable: true }, BLOQUE],
    ];
    const malSuivies = suites.filter(([i, d, suite]) => m(i, { ...d, peutDeclarer: true }) !== m(i, d) + suite);
    verifier('P5 : saturé, en panne, lent, sans réseau → « trois contrôles » ; declarable → la case, plus bas ; bloqué → « après une réponse »',
      malSuivies.length === 0, malSuivies.map(([i, d]) => `${i} ${JSON.stringify(d)} → « ${m(i, { ...d, peutDeclarer: true })} »`).join(' ¶ '));
    verifier('…rien de tout cela sans `peutDeclarer === true` (un « oui » n’est pas un vrai)',
      ['indisponible', 'lent', 'reseau', 'bloque'].every((i) => m(i, { peutDeclarer: 'oui', declarable: true }) === m(i, {})
        && m(i, { declarable: true }) === m(i, {}) && !/honneur/.test(m(i, {}))));
    verifier('…ni après une limite d’Opus, ni une panne d’Opus : la case n’y a rien à faire',
      ['trop_d_essais', 'service_indisponible'].every((i) => m(i, { peutDeclarer: true, declarable: true }) === m(i, {})));
  } finally {
    if (avantTz === undefined) delete process.env.TZ; else process.env.TZ = avantTz;
  }

  /* LA PHRASE DE LA CASE n'existe qu'à côté de la case : aucun message ne
     la recopie, même en partie (S46). */
  const tousLesTextes = [];
  for (const d of [...variantes, ...variantes2b2]) for (const i of [...etats, ...issues]) tousLesTextes.push(T.messageTva(i, d).texte || '');
  const debutCase = T.DECLARATION_TVA.slice(0, 30);
  const finCase = T.DECLARATION_TVA.slice(-40);
  verifier('aucun message ne recopie la phrase de la case (ni son début, ni sa fin)',
    tousLesTextes.every((x) => !x.includes(debutCase) && !x.includes(finCase) && !/certifi/i.test(x)));
}

/* ================================================================== */
console.log('\nLes limites, les essais, les origines');
{
  verifier('24 requêtes par heure et par compte, 20 par minute pour tout Opus',
    T.LIMITES_TVA.compte.max === 24 && T.LIMITES_TVA.compte.duree_ms === 3600000
    && T.LIMITES_TVA.global.max === 20 && T.LIMITES_TVA.global.duree_ms === 60000);
  verifier('…la limite du compte laisse passer six appuis de quatre essais', T.LIMITES_TVA.compte.max >= 6 * T.ESSAIS_VIES.max);
  verifier('un refus de VIES est retenu trois heures', T.REFUS_RETENU_MS === 3 * 3600000);
  verifier('4 essais, des pauses de 2, 5 et 10 s, 20 s par essai, 45 s en tout',
    egal(JSON.parse(JSON.stringify(T.ESSAIS_VIES)), { max: 4, pauses_ms: [2000, 5000, 10000], delai_ms: 20000, budget_ms: 45000 }));
  verifier('…une pause par reprise, et des pauses CROISSANTES',
    T.ESSAIS_VIES.pauses_ms.length === T.ESSAIS_VIES.max - 1
    && T.ESSAIS_VIES.pauses_ms.every((p, k, a) => k === 0 || p > a[k - 1]));
  /* Le quatrième essai doit pouvoir PARTIR quand les saturations reviennent
     vite (moins de deux secondes, mesuré) : sinon « 4 essais » est écrit et
     jamais tenu (relecture du 20/10/2026, avec 3, 8 et 15 secondes). */
  const ecoule = 3 * 2000 + T.ESSAIS_VIES.pauses_ms[0] + T.ESSAIS_VIES.pauses_ms[1];
  verifier('…le quatrième essai part, si les trois premiers sont revenus en 2 s',
    ecoule + T.ESSAIS_VIES.pauses_ms[2] + T.ESSAIS_VIES.delai_ms <= T.ESSAIS_VIES.budget_ms);
  const api = lire('src/lib/api.js');
  verifier('…et le budget laisse à l’application le temps de recevoir la réponse (60 s)',
    /export const DELAI_CONTROLE_TVA_MS = ESSAIS_VIES\.budget_ms \+ 15000;/.test(api) && T.ESSAIS_VIES.budget_ms + 15000 === 60000);
  verifier('debutDeFenetre : la même que celle du SIRET',
    [0, 1792000000000, 1792000059999, 1792003599999].every((t) =>
      T.debutDeFenetre(t, 60000) === S.debutDeFenetre(t, 60000)
      && T.debutDeFenetre(t, 3600000) === S.debutDeFenetre(t, 3600000)));
  const e1 = await T.empreinte('secret', 'a4800000-0000-4000-8000-00000000000a');
  const e2 = await S.empreinteIp('secret', 'a4800000-0000-4000-8000-00000000000a');
  verifier('empreinte : HMAC-SHA-256 en hexadécimal, la même construction que celle des adresses IP du SIRET',
    /^[0-9a-f]{64}$/.test(e1) && e1 === e2 && e1 !== await T.empreinte('autre', 'a4800000-0000-4000-8000-00000000000a'));
  /* `null` et `undefined`, pas seulement '' : une chaîne vide est refusée
     par WebCrypto lui-même, et ce cas passait sans la garde (sabotage du
     20/10/2026). `String(null)` vaut « null », une clé que tout le monde
     connaît. */
  const sansSecret = [];
  for (const secret of [null, undefined, '']) {
    try { await T.empreinte(secret, 'x'); } catch { sansSecret.push(true); }
  }
  verifier('…et une empreinte SANS secret est refusée (elle se recalculerait par n’importe qui)', sansSecret.length === 3);
  const origines = [null, '', 'https://opus-project.com', 'https://www.opus-project.com', 'HTTPS://OPUS-PROJECT.COM',
    'http://localhost:8081', 'http://127.0.0.1', 'https://opus-project.com.evil.example', 'https://evil.example',
    'http://localhost.evil.example', 'null'];
  verifier('origineAutorisee : la MÊME règle que la fonction siret, sur onze origines',
    egal([...T.ORIGINES_AUTORISEES], [...S.ORIGINES_AUTORISEES])
    && origines.every((o) => T.origineAutorisee(o) === S.origineAutorisee(o)));
}

/* ================================================================== */
const verifierEdge = () => {
  console.log('\nLa fonction Edge — ce qui se lit dans son texte');
  if (!existsSync(path.join(RACINE, EDGE))) { verifier('la fonction Edge existe', false, EDGE); return; }
  const brut = lire(EDGE);
  const transpile = ts.transpileModule(brut, {
    reportDiagnostics: true,
    fileName: 'index.ts',
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  verifier('elle se parse en TypeScript, sans une erreur de syntaxe',
    transpile.diagnostics.length === 0,
    transpile.diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')).join(' ; '));
  const code = sansCommentaires(brut);
  verifier('elle importe ./tva.js — le même code que l’écran — et supabase-js comme `siret`',
    /from '\.\/tva\.js'/.test(code) && code.includes("from 'npm:@supabase/supabase-js@2.58.0'")
    && lire('supabase/functions/siret/index.ts').includes("from 'npm:@supabase/supabase-js@2.58.0'"));
  const lectures = [...code.matchAll(/req\.headers\.get\('([^']+)'\)/g)].map((m) => m[1]).sort();
  verifier('elle ne lit QUE Origin et Authorization (jamais X-Forwarded-For)',
    egal([...new Set(lectures)], ['Authorization', 'Origin']) && !/forwarded/i.test(code), lectures.join(', '));
  verifier('le nom et l’adresse de VIES ne sont jamais lus par la fonction, sous aucune notation',
    !/\.(name|address)\b/.test(code.replace(/data\.user/g, '')) && !/\[\s*['"`](name|address)['"`]\s*\]/.test(code));
  verifier('elle ne nomme ni `emetteur` ni les tarifs (la liste fermée de la section 46)',
    !/\b(tarifs_pro|emetteur_assurances|emetteur)\b/.test(code));
  verifier('…ni aucune autre table que entreprise_registre, preuves_tva et siret_limites',
    egal([...new Set([...code.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]))].sort(),
      ['entreprise_registre', 'preuves_tva', 'siret_limites']));
  verifier('…et n’appelle que compter_essai_tva et compter_appel_siret',
    egal([...new Set([...code.matchAll(/\.rpc\('([a-z_]+)'/g)].map((m) => m[1]))].sort(),
      ['compter_appel_siret', 'compter_essai_tva']));
  /* 2b-2 — ce que le banc ne peut pas distinguer : le texte RANGÉ est celui
     que le téléphone a renvoyé (S20). Comme il doit être, à l'octet, la
     version en vigueur, ranger la constante donnerait la même ligne ; mais
     le jour où une version s'ajoute, seul le texte reçu dit ce que
     l'artisan a lu. */
  verifier('la déclaration range le texte REÇU (`texte: demande.texte`), passé par ligneDeDeclarationTva, jamais la constante',
    /ligneDeDeclarationTva\(\{[^}]*\btexte:\s*demande\.texte\s*\}\)/.test(code)
    && !/ligneDeDeclarationTva\(\{[^}]*\btexte:\s*DECLARATION_TVA/.test(code)
    && (code.match(/declaration_texte/g) || []).length === 0);
  verifier('…après avoir exigé la case (`engagement === true`) et le texte en vigueur, à l’octet',
    /if \(demande\.engagement !== true\) return await repondre\(\{ issue: 'sans_engagement' \}\);/.test(code)
    && /if \(demande\.texte !== DECLARATION_TVA\) return await repondre\(\{ issue: 'texte_perime' \}\);/.test(code));
  verifier('…et la seule règle de P5 est celle de tva.js (`declarableSansReponse`), jamais un compte écrit à la main',
    (code.match(/declarableSansReponse\(/g) || []).length === 1 && !/\.length\s*>=\s*3\b/.test(code)
    && !/SANS_REPONSE_TVA\.(controles|ecart_ms)/.test(code));

  /* LE BANC — lancé dans un processus à part, et relu. Un banc qui PLANTE
     ne vérifie rien : il doit écrire sa dernière ligne, `BANC <n> <échecs>`. */
  const lance = spawnSync(process.execPath, [ICI, '--banc'], {
    cwd: RACINE, encoding: 'utf8', timeout: 120000, env: { ...process.env, TZ: 'Europe/Paris' },
  });
  const sortie = `${lance.stdout || ''}`;
  process.stdout.write(sortie.split('\n').filter((l) => !/^BANC /.test(l)).join('\n'));
  const fin = (sortie.match(/^BANC (\d+) (\d+)$/m) || []);
  const nb = Number(fin[1] || 0);
  const ko = Number(fin[2] || 0);
  echecs += ko;
  verifier('le banc a tourné jusqu’au bout, sans planter',
    lance.status === 0 && fin.length === 3 && nb >= 50,
    `code ${lance.status}, ${nb} vérifications${lance.stderr ? ` — ${lance.stderr.slice(0, 600)}` : ''}`);
};

/* ================================================================== */
const verifierBase = () => {
  console.log('\nLa base — la table, sa ligne, ce qui la protège');
  const schema = sqlSansCommentaires(lire('supabase/schema.sql'));
  const table = (schema.match(/create table if not exists public\.preuves_tva\s*\(([\s\S]*?)\n\);/) || [])[1];
  if (!table) { verifier('la table preuves_tva existe dans schema.sql', false); return; }
  const colonnes = table.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter((c) => /^[a-z_]+$/.test(c)).sort();
  const ligne = T.ligneDePreuveTva({ pro_id: 'u', siren: '000048009', numero: 'FR91000048009', vies_le: null });
  verifier('les colonnes de la table = la ligne de tva.js + reconnu_le (posée par la base)',
    egal(colonnes, [...Object.keys(ligne), 'reconnu_le'].sort()), `table : ${colonnes.join(', ')}`);
  verifier('la forme du numéro, la même des deux côtés (sans I ni O), et les 9 chiffres = le SIREN',
    schema.includes("check (numero ~ '^FR[0-9A-HJ-NP-Z]{2}[0-9]{9}$' and substr(numero, 5) = siren)"));
  verifier('la clé chiffrée : la même formule que tva.js, et sa conversion gardée par un `case`',
    /check \(case when siren ~ '\^\[0-9\]\{9\}\$' and substr\(numero, 3, 2\) ~ '\^\[0-9\]\{2\}\$'\s+then substr\(numero, 3, 2\)::int = \(12 \+ 3 \* \(siren::bigint % 97\)\) % 97\s+else true end\)/.test(schema));
  verifier('aucune contrainte morte sur le SIREN seul (la règle du numéro le dit déjà)',
    !/add constraint preuve_tva_siren_check/.test(schema));
  /* 2b-2 : une troisième source, la déclaration sur l'honneur (cahier 2b-2,
     §2.6) — et rien d'autre. */
  verifier('la source : « vies », « essai » ou « declaration », rien d’autre',
    /add constraint preuve_tva_source_check\s*check \(source in \('vies', 'essai', 'declaration'\)\)/.test(schema)
    && (schema.match(/add constraint preuve_tva_source_check/g) || []).length === 1);
  /* …ses deux colonnes, ajoutées à la table en place (le `create table` ne
     les porte pas), et sa règle ENTIÈRE : la date et le texte ensemble ou
     aucun, une déclaration a sa date, un essai n'en a jamais, et le texte
     est l'une des versions qui ONT EXISTÉ (liste fermée, à l'octet). */
  verifier('la déclaration : `declare_le timestamptz` et `declaration_texte text`, ajoutées une fois chacune',
    (schema.match(/alter table public\.preuves_tva add column if not exists declare_le\s+timestamptz;/g) || []).length === 1
    && (schema.match(/alter table public\.preuves_tva add column if not exists declaration_texte\s+text;/g) || []).length === 1
    && (schema.match(/alter table public\.preuves_tva add column\b/g) || []).length === 2);
  const regleDecl = (schema.match(/add constraint preuve_tva_declaration_check\s*(check[\s\S]*?\)\)\);)/) || [])[1] || '';
  verifier('…et sa règle, ENTIÈRE : ensemble ou aucun, une déclaration datée, un essai jamais, le texte dans la liste fermée',
    regleDecl.replace(/\s+/g, ' ') === "check ((declare_le is null) = (declaration_texte is null) and (source <> 'declaration' or "
      + "declare_le is not null) and (source <> 'essai' or declare_le is null) and (declaration_texte is null or declaration_texte in "
      + "( 'Je certifie sur l’honneur que ce numéro est celui que l’administration fiscale a attribué à mon entreprise.')));"
    && (schema.match(/add constraint preuve_tva_declaration_check/g) || []).length === 1, regleDecl.slice(0, 300));
  const declencheur = (schema.match(/function public\.tient_la_preuve_tva\(\)[\s\S]*?\$\$;/) || [''])[0];
  verifier('la date du contrôle : posée à l’insertion et par la clé de SERVICE seulement, gardée sinon',
    /if tg_op = 'INSERT' or current_user = 'service_role' then\s+new\.reconnu_le := clock_timestamp\(\);\s+else\s+new\.reconnu_le := old\.reconnu_le;\s+end if;/.test(declencheur)
    && /before insert or update on public\.preuves_tva/.test(schema), declencheur.slice(0, 300));
  /* 2b-2 : la date de la déclaration appartient à la BASE, redéclarer le
     même numéro ne la rajeunit pas, VIES qui reconnaît ce même numéro la
     garde jointe, un autre numéro ou un essai la vident ; et une
     déclaration posée AILLEURS que par la fonction Edge (`service_role`) ne
     l'est que sur un compte d'essai (garde I1) — imbriquée, pour que la clé
     de service ne lise jamais `auth.users`. */
  verifier('la déclaration : sa date posée par la base (une seule date, `reconnu_le` = `declare_le`), gardée si le même numéro est '
    + 'redéclaré, jointe si VIES le reconnaît, vidée pour un autre numéro ou un essai',
    /if new\.source = 'declaration' then\s+if tg_op = 'UPDATE' and old\.declare_le is not null\s+and old\.numero = new\.numero and old\.siren = new\.siren then\s+new\.declare_le := old\.declare_le;\s+new\.declaration_texte := old\.declaration_texte;\s+else\s+new\.declare_le := clock_timestamp\(\);/.test(declencheur)
    && /new\.reconnu_le := new\.declare_le;\s+elsif new\.source = 'vies' and tg_op = 'UPDATE' and old\.declare_le is not null\s+and old\.numero = new\.numero and old\.siren = new\.siren then\s+new\.declare_le := old\.declare_le;\s+new\.declaration_texte := old\.declaration_texte;\s+else\s+new\.declare_le := null;\s+new\.declaration_texte := null;\s+end if;/.test(declencheur));
  verifier('…et, posée ailleurs que par la clé de service, sur un compte d’essai SEULEMENT (23514) — la clé de service ne lit pas `auth.users`',
    /if current_user <> 'service_role' then\s+if not exists \(select 1 from auth\.users u\s+where u\.id = new\.pro_id\s+and lower\(u\.email\) like '%@exemple-opus\.test'\) then\s+raise exception '[^']*' *\n?\s*using errcode = '23514';/.test(declencheur));
  verifier('une preuve « essai » ne se pose que sur un compte d’essai (@exemple-opus.test)',
    /if new\.source = 'essai' and not exists \(\s*select 1 from auth\.users u\s+where u\.id = new\.pro_id and lower\(u\.email\) like '%@exemple-opus\.test'\) then\s+raise exception/.test(declencheur));
  const politiques = [...schema.matchAll(/create policy "[^"]+" on public\.preuves_tva\s+for (\w+)/g)].map((m) => m[1]);
  verifier('UNE politique, en lecture : aucun client n’écrit une preuve', egal(politiques, ['select']), politiques.join(', '));
  verifier('…lue par est_mon_entreprise(), pour les connectés',
    /on public\.preuves_tva\s+for select to authenticated\s+using \(public\.est_mon_entreprise\(pro_id\)\);/.test(schema));
  verifier('…et les droits de table : rien pour anon, la lecture seule pour les connectés',
    /revoke all on public\.preuves_tva from anon;/.test(schema)
    && /revoke insert, update, delete, truncate on public\.preuves_tva from authenticated;/.test(schema));
  verifier('la preuve part avec la fiche (cascade)',
    /pro_id\s+uuid primary key references public\.professional_profiles\(id\) on delete cascade/.test(table));

  const compteur = (schema.match(/function public\.compter_essai_tva\([\s\S]*?\$\$;/) || [''])[0];
  verifier('compter_essai_tva : le compte et tout Opus, VERROUILLÉS dans un ordre fixe, dans UN ordre SQL',
    /security definer/.test(compteur) && (compteur.match(/for update;/g) || []).length === 2
    && compteur.indexOf("where cle = p_compte and fenetre = p_heure for update") < compteur.indexOf("where cle = 'tva-global' and fenetre = p_minute for update")
    && /if n_compte >= p_max_compte then return 'compte'; end if;\s+if n_global >= p_max_global then return 'service'; end if;/.test(compteur)
    /* Aucun compteur ne monte AVANT que les deux aient dit oui : sinon le
       refus de l'un consomme la place de l'autre (sabotage du 20/10/2026 ;
       les essais SQL, cas 17, le mesurent). */
    && !/\bupdate public\./i.test(compteur.slice(0, compteur.indexOf("then return 'service'"))));
  verifier('…qui refuse une clé qui n’est pas celle d’un compte',
    /if p_compte is null or p_compte not like 'tva-compte:%' then\s+raise exception/.test(compteur));
  verifier('…appelable par la seule clé de service',
    /revoke all on function public\.compter_essai_tva\(text, timestamptz, int, timestamptz, int\)\s+from public, anon, authenticated;/.test(schema)
    && /grant execute on function public\.compter_essai_tva\(text, timestamptz, int, timestamptz, int\) to service_role/.test(schema)
    && !/grant execute on function public\.compter_essai_tva[^;]*to (anon|authenticated|public)/i.test(schema));

  /* emetteur_incomplet : la preuve ne compte que pour le SIREN ACTIF. */
  const incomplet = (schema.match(/function public\.emetteur_incomplet\(p_pro uuid\)[\s\S]*?\$\$;/) || [''])[0];
  verifier('emetteur_incomplet lit la preuve du SIREN ACTIF seulement',
    /left join public\.preuves_tva v on v\.pro_id = moi\.id and v\.siren = r\.siren/.test(incomplet));
  verifier('…et ne réclame le numéro qu’au réel, sans numéro publié NI preuve',
    /case when e\.regime_tva = 'reel' and r\.id is not null and r\.tva is null and v\.pro_id is null\s+then 'conso_tva_intra: /.test(incomplet));
  verifier('…une seule définition d’emetteur_incomplet dans tout le fichier',
    (schema.match(/create or replace function public\.emetteur_incomplet\(/g) || []).length === 1);
  /* 2b-2 (cahier 2b-2, §2.9) : une DÉCLARATION s'exporte sans `reconnu_le`
     ni `vies_le` — l'export ne dit jamais « reconnu » pour un numéro que
     VIES n'a pas reconnu ; une preuve `vies` ou `essai`, entière. */
  verifier('l’export RGPD la contient — une déclaration sans `reconnu_le` ni `vies_le`',
    /'mon_numero_de_tva',\s*\(select case when x\.source = 'declaration'\s+then to_jsonb\(x\) - 'reconnu_le' - 'vies_le'\s+else to_jsonb\(x\) end\s+from public\.preuves_tva x where x\.pro_id = auth\.uid\(\)\)/.test(schema));
  const f = schema.match(/function public\.compter_appel_siret\(\s*([\s\S]*?)\)\s*returns\s+boolean/);
  verifier('compter_appel_siret(p_cle, p_fenetre, p_max) — les noms qu’appelle la fonction pour retenir un refus',
    !!f && egal(f[1].split(',').map((x) => x.trim().split(/\s+/)[0]), ['p_cle', 'p_fenetre', 'p_max']));
  verifier('la table naît AVANT l’export RGPD et le balayage des portes (section 43)',
    schema.indexOf('create table if not exists public.preuves_tva') < schema.indexOf('create or replace function public.mes_donnees()')
    && schema.indexOf('create or replace trigger trg_tient_la_preuve_tva') < schema.lastIndexOf('do $portes$'));
  verifier('le prélude local donne à la clé de service ce qu’elle a sur Supabase : ignorer la RLS',
    /alter role service_role bypassrls;/.test(sqlSansCommentaires(lire('supabase/local-prelude.sql'))));
  const essais = sqlSansCommentaires(lire('supabase/essais-section-48.sql'));
  verifier('les essais SQL jouent la fonction Edge sous la clé de SERVICE, et les deux compteurs',
    /set local role service_role;\s+insert into public\.preuves_tva/.test(essais)
    && /public\.compter_essai_tva\('tva-compte:/.test(essais) && /maintenance_garde_la_date_attendu_t/.test(essais));
};

/* ================================================================== */
const verifierApplication = () => {
  console.log('\nL’application — l’appel, l’écran');
  const api = sansCommentaires(lire('src/lib/api.js'));
  const corps = (code, debut) => {
    const i = code.indexOf(debut);
    if (i < 0) return '';
    const j = code.indexOf('\nasync function ', i + debut.length);
    const k = code.indexOf('\nexport const ', i + debut.length);
    const l = code.indexOf('\nfunction ', i + debut.length);
    const fin = [j, k, l].filter((x) => x > i).sort((a, b) => a - b)[0];
    return code.slice(i, fin > i ? fin : undefined);
  };
  const sup = corps(api, 'async function controlerTvaSupabase(');
  verifier('l’appel : la fonction `tva`, le numéro SEUL, sous sa forme normale',
    /functions\.invoke\('tva',\s*\{\s*body:\s*\{\s*numero:\s*analyserNumeroTva\(numero\)\.numero\s*\},/.test(sup));
  verifier('…avec le délai qui laisse finir les essais du serveur',
    /timeout:\s*DELAI_CONTROLE_TVA_MS/.test(sup));
  verifier('…et TOUJOURS une issue : jamais d’exception, jamais de réponse devinée',
    (sup.match(/return issueDeVerification\(/g) || []).length === 2
    && /typeof data\.issue !== 'string'\)\s*\{\s*return \{ issue: 'service_indisponible' \};/.test(sup));
  verifier('deux fonctions NOMMÉES, le choix à la fin (le piège Metro)',
    /export const controlerTva = hasSupabase \? controlerTvaSupabase : controlerTvaDemo;/.test(api));
  const demo = corps(api, 'async function controlerTvaDemo(');
  const ordre = ['cle_fausse', 'mal_forme', 'sans_entreprise', 'deja_publie', 'autre_siren']
    .map((i) => demo.indexOf(`issue: '${i}'`));
  verifier('la démonstration suit l’ORDRE de la fonction Edge : forme, entreprise, publié, SIREN',
    ordre.every((x, k) => x > 0 && (k === 0 || x > ordre[k - 1])), ordre.join(','));
  const lecture = corps(api, 'async function monEmetteurSupabase(');
  /* 2b-2 : avec la date d'une déclaration sur l'honneur (`declare_le`) ; et
     une base en retard d'une migration est relue sans elle (critique base M9). */
  verifier('`monEmetteur` lit la preuve avec le reste de la fiche, sa source et la date d’une déclaration comprises — et, sur une '
    + 'base sans `declare_le` (42703), la relit sans elle',
    /from\('preuves_tva'\)\.select\('siren, numero, reconnu_le, source, declare_le'\)/.test(lecture)
    && /colonneAbsente\(v\.error, 'declare_le'\)\) \{\s*v = await supabase\.from\('preuves_tva'\)\.select\('siren, numero, reconnu_le, source'\)/.test(lecture));
  verifier('…et une erreur de lecture LÈVE — sauf la table absente, et elle seule',
    /if \(v\.error && !tableAbsente\(v\.error\)\) throw v\.error;/.test(lecture)
    && /function tableAbsente\(erreur\) \{\s*return !!erreur && \(erreur\.code === 'PGRST205' \|\| erreur\.code === '42P01'\);\s*\}/.test(api));

  const ecran = sansCommentaires(lire('src/components/SaisieTva.js'));
  verifier('l’écran dit ce que la fonction dit : `messageTva` et `analyserNumeroTva`, rien d’écrit à la main',
    /messageTva\(r\.issue,/.test(ecran) && /analyserNumeroTva\(texte,\s*entreprise\.siren\)/.test(ecran));
  const iGarde = ecran.indexOf('if (enVol.current) return;');
  const iPose = ecran.indexOf('enVol.current = true;');
  const iAttente = ecran.indexOf('await onControler(');
  verifier('…un seul contrôle à la fois : le garde du vol, dans une référence, posé AVANT l’attente et levé dans `finally`',
    iGarde > 0 && iPose > iGarde && iAttente > iPose
    && /finally\s*\{\s*enVol\.current = false;/.test(ecran));
  /* Un numéro pas prêt : le CONTRÔLE d'un numéro TAPÉ seulement — le
     recontrôle d'une déclaration (2b-2) porte son numéro, il ne se tape pas. */
  verifier('…un numéro pas prêt DIT pourquoi, au lieu d’un bouton muet',
    /if \(!deja && !pret\) \{[\s\S]{0,200}setMotif\(m\);/.test(ecran));
  /* L'OCCUPATION SAIT CE QUI EST EN VOL (2b-2, cahier §3.7) : le contrôle,
     la déclaration ou le retrait — chacun se dit au-dessus (`onOccupe`), et
     « Mon entreprise » refuse de se fermer ou de passer en édition pendant
     chacun. Chaque envoi lève l'occupation dans son `finally`. */
  const occupations = ['controle', 'declaration', 'retrait'];
  verifier('…l’envoi en vol se dit au-dessus (`onOccupe`, avec CE qui part : le contrôle, la déclaration, le retrait), et « Mon '
    + 'entreprise » refuse de se fermer ou de passer en édition',
    occupations.every((q) => (ecran.match(new RegExp(`if \\(onOccupe\\) onOccupe\\('${q}'\\);`, 'g')) || []).length === 1)
    && (ecran.match(/finally\s*\{\s*enVol\.current = false;\s*if \(onOccupe\) onOccupe\(null\);/g) || []).length === 3
    && !/onOccupe\((?:true|false)\)/.test(ecran)
    && (sansCommentaires(lire('src/components/MonEntreprise.js')).match(/if \(occupeTva\) \{/g) || []).length === 2);
  const meCode = sansCommentaires(lire('src/components/MonEntreprise.js'));
  /* …et le message d'attente NOMME ce qui part : `messageDOccupationTva`
     (declaration-tva.js), fait tourner ici sur les trois occupations ; il
     part avec la fin de l'envoi (il disait « en cours » sur un numéro
     reconnu, 20/10). */
  const occ = OCC;
  verifier('…et le message « attendez » nomme ce qui part (le contrôle, la déclaration, le retrait) et part avec la fin de l’envoi (il '
    + 'disait « en cours » sur un numéro reconnu)',
    (meCode.match(/afficher\(messageDOccupationTva\(occupeTva(?:, \{ fermer: true \})?\), 'attente'\);/g) || []).length === 2
    && /const occuperTva = \(quoi\) => \{\s*setOccupeTva\(quoi \|\| null\);\s*if \(!quoi\) setMessage\(\(m\) => \(m && m\.ton === 'attente' \? null : m\)\);\s*\};/.test(meCode)
    && /onOccupeTva=\{occuperTva\}/.test(meCode)
    && occ.messageDOccupationTva('controle') === 'Contrôle auprès de VIES en cours : attendez sa réponse.'
    && occ.messageDOccupationTva('controle', { fermer: true }) === 'Contrôle auprès de VIES en cours : attendez sa réponse. Fermer ne l’annulerait pas.'
    && occ.messageDOccupationTva('declaration') === 'Enregistrement de votre déclaration en cours : attendez la réponse.'
    && occ.messageDOccupationTva('retrait') === 'Retrait de votre déclaration en cours : attendez la réponse.');
  /* 2b-2 — LA DÉCLARATION SUR L'HONNEUR, À L'ÉCRAN (cahier §3.7, annexe
     A.5). Ce que l'écran DÉCIDE vit dans `declaration-tva.js`, qui n'importe
     que des calculs : fait tourner ici. */
  const E_I3 = [
    ['reconnu', 'reussite', 'reussite', 'ferme_vide'], ['declare', 'reussite', 'reussite', 'ferme_vide'],
    ['retire', 'reussite', 'reussite', 'ferme_vide'],
    ['deja_publie', 'note', null, 'ferme'], ['deja_reconnu', 'note', null, 'ferme'], ['rien_a_retirer', 'note', null, 'ferme'],
    ['sans_engagement', 'erreur', null, 'ouvert'], ['non_refuse', 'erreur', null, 'ouvert'],
    ['refuse', 'erreur', 'echec', 'ouvert'], ['texte_perime', 'erreur', 'echec', 'ouvert'],
    ['sature', 'erreur', 'echec', 'ouvert'], ['une_issue_inconnue', 'erreur', 'echec', 'ouvert'],
  ];
  const tonsFaux = E_I3.filter(([i, ton, ret, champ]) => {
    const p = OCC.presentationDeLIssueTva(i);
    return p.ton !== ton || p.retour !== ret || p.champ !== champ;
  }).map(([i]) => i);
  verifier('2b-2 : le ton, la vibration et le champ de chaque issue (E-I3) : vert pour reconnu, déclaré, retiré ; neutre pour '
    + 'publié, reconnu, rien à retirer ; rouge SANS vibrer pour ce qui manque (case, refus récent) ; rouge et vibrer pour le reste — '
    + 'une issue inconnue n’est jamais « faite »', tonsFaux.length === 0, tonsFaux.join(', '));
  const ent = { siren: '000004242', tva: null };
  const pv = (preuve, numero) => OCC.peutDeclarerTva({ entreprise: ent, preuveTva: preuve, numero });
  const preuveDe = (source, numero = 'FR00000004242') => ({ siren: '000004242', numero, source, reconnu_le: '2026-11-01T10:00:00Z' });
  verifier('2b-2 : la déclaration ne s’offre que pour une preuve vide, une preuve d’essai, ou une déclaration d’un AUTRE numéro — '
    + 'jamais pour le numéro déjà déclaré, jamais sur une preuve VIES, jamais quand l’annuaire publie un numéro (E-I4)',
    pv(null, 'FRKX000004242') === true && pv(preuveDe('essai'), 'FRKX000004242') === true
    && pv(preuveDe('declaration', 'FRKX000004242'), 'FRKY000004242') === true
    && pv(preuveDe('declaration', 'FRKX000004242'), 'FRKX000004242') === false
    && pv(preuveDe('vies'), 'FRKX000004242') === false
    && OCC.peutDeclarerTva({ entreprise: { siren: '000004242', tva: 'FR00000004242' }, preuveTva: null, numero: 'FRKX000004242' }) === false
    && OCC.peutDeclarerTva({ entreprise: null, preuveTva: null, numero: 'FRKX000004242' }) === false);
  const off = (reponse, numero = 'FRKX000004242', peutDeclarer = true) => OCC.declarationOfferte({ peutDeclarer, reponse, numero });
  verifier('2b-2 : la case ne s’affiche qu’après un REFUS (frais ou retenu) du numéro encore dans le champ, ou une absence de réponse '
    + '`declarable` ; jamais après bloque, trop d’essais, réseau, lent, service indisponible, ni une absence sans `declarable`',
    off({ issue: 'refuse', pour: 'FRKX000004242' }) === true
    && off({ issue: 'refuse', pour: 'FRKX000004242', reessayer_a: '2026-11-10T13:00:00Z' }) === true
    && off({ issue: 'refuse', pour: 'FRKX000004242', declare_le: '2026-11-01T10:00:00Z' }) === false
    && off({ issue: 'refuse', pour: 'FRKY000004242' }) === false
    && off({ issue: 'refuse', pour: 'FRKX000004242' }, 'FRKX000004242', false) === false
    && off({ issue: 'indisponible', pour: 'FRKX000004242', declarable: true }) === true
    && off({ issue: 'indisponible', pour: 'FRKX000004242' }) === false
    && ['bloque', 'trop_d_essais', 'reseau', 'lent', 'service_indisponible', 'sature', 'reconnu']
      .every((i) => off({ issue: i, pour: 'FRKX000004242', declarable: true }) === false));
  verifier('2b-2 : les textes de l’écran de la déclaration, MOT POUR MOT (annexe A.5)',
    OCC.DECLARATION_ECRAN.titre === 'Vous êtes sûr de ce numéro ?'
    && OCC.DECLARATION_ECRAN.explication === 'Votre espace professionnel sur impots.gouv.fr le montre, ou un courrier de votre '
      + 'service des impôts ? Vous pouvez alors le déclarer sur l’honneur : Opus l’imprimera sur vos devis. Cette déclaration vous '
      + 'engage ; Opus la garde avec sa date, et vous pourrez la retirer.'
    && OCC.DECLARATION_ECRAN.bouton === 'Déclarer ce numéro sur l’honneur'
    && OCC.DECLARATION_ECRAN.boutonEnCours === 'Enregistrement de votre déclaration…'
    && OCC.DECLARATION_ECRAN.accueilReel === 'S’il le refuse alors que vous êtes sûr de votre numéro, vous pourrez le déclarer sur '
      + 'l’honneur.'
    && OCC.DECLARATION_ECRAN.recontroler === 'Faire contrôler de nouveau par VIES'
    && OCC.DECLARATION_ECRAN.autreNumero === 'Écrire un autre numéro'
    && OCC.DECLARATION_ECRAN.retirer === 'Retirer cette déclaration'
    && OCC.DECLARATION_ECRAN.confirmerRetrait === 'Confirmer : retirer la déclaration'
    && OCC.DECLARATION_ECRAN.demo === 'Démonstration : une clé de deux chiffres juste est reconnue ; une clé en lettres qui commence '
      + 'par Z trouve VIES saturé ; toute autre clé en lettres est refusée, et la déclaration sur l’honneur vous est alors proposée.'
    && OCC.noteDUneDeclaration('2026-11-02T10:00:00Z') === 'Déclaré sur l’honneur par vous le 02/11/2026 : VIES ne l’avait pas '
      + 'reconnu. Il s’imprime sur vos devis, sous votre responsabilité.'
    && OCC.aideDeLaSectionTvaDeclaree('FRKX000004242', '2026-11-02T10:00:00Z') === 'Numéro de TVA intracommunautaire '
      + 'FRKX000004242, déclaré sur l’honneur par vous le 02/11/2026 : VIES ne l’avait pas reconnu. Il s’imprimera sur vos devis, '
      + 'quel que soit votre régime ; vous pouvez retirer votre déclaration dans « Votre entreprise ».'
    && OCC.remplaceraLaDeclaration({ declare_le: '2026-11-02T10:00:00Z', numero: 'FRKX000004242' })
      === 'Elle remplacera votre déclaration du 02/11/2026 pour le numéro FRKX000004242.'
    /* …et jamais « vérifi… » ni « certifi… » dans ces textes de l'écran :
       la phrase qui engage vit dans `DECLARATION_TVA`, seule. */
    && !/v[ée]rifi|certifi/i.test(Object.values(OCC.DECLARATION_ECRAN).join(' ')),
    JSON.stringify(OCC.DECLARATION_ECRAN).slice(0, 120));
  verifier('2b-2 : l’écran décide par ces fonctions, et rien d’autre : le ton et le champ d’une réponse par '
    + '`presentationDeLIssueTva`, la case par `peutDeclarerTva` puis `declarationOfferte`, la note d’une déclaration par '
    + '`noteDUneDeclaration` (jamais « VIES l’a reconnu » d’un numéro déclaré)',
    /const p = presentationDeLIssueTva\(r\.issue\);/.test(ecran)
    && /const peutDeclarer = peutDeclarerTva\(\{ entreprise, preuveTva, numero: numeroRepondu \}\);/.test(ecran)
    && /const offerte = !!onDeclarer && declarationOfferte\(\{ peutDeclarer, reponse, numero: numeroRepondu \}\);/.test(ecran)
    && /\{declaree && noteDUneDeclaration\(preuve\.declare_le\)\}/.test(ecran)
    && /\{preuve\.source === 'vies' && `Écrit par vous\. VIES l’a reconnu/.test(ecran)
    && !/preuve\.source !== 'essai'/.test(ecran));
  /* LA CASE : une vraie case pour VoiceOver, la rangée entière comme cible,
     décochée à chaque réponse et à chaque changement du numéro ; inerte
     pendant un envoi ; et SOUS le bouton VIES (E-I2) : rien de nouveau
     n'apparaît au-dessus du bouton qu'on vient de toucher. */
  const iBoutonVies = ecran.indexOf('label="Faire contrôler par VIES"');
  const iReponse = ecran.lastIndexOf('{laReponse}');
  const iCase = ecran.indexOf('accessibilityRole="checkbox"');
  verifier('2b-2 : la case est une case (`accessibilityRole="checkbox"`, `aria-checked`), inerte pendant un envoi, décochée à chaque '
    + 'réponse et à chaque frappe ; la réponse de VIES et la déclaration sont SOUS le bouton « Faire contrôler par VIES » (E-I2) ; '
    + 'case décochée, « Déclarer » DIT ce qui manque (`sans_engagement`)',
    iCase > 0 && /aria-checked=\{coche\}/.test(ecran) && /accessibilityLabel=\{DECLARATION_TVA\}/.test(ecran)
    && /onPress=\{\(\) => \{ setCoche\(\(v\) => !v\); setMotifDeclaration\(null\); \}\}\s*disabled=\{!!enCours\}/.test(ecran)
    && /const recevoir = \(r, pour\) => \{\s*const p = presentationDeLIssueTva\(r\.issue\);\s*setReponse\(\{ \.\.\.r, pour \}\);\s*setCoche\(false\);/.test(ecran)
    && /setTexte\(t\); setMotif\(null\); setCoche\(false\);/.test(ecran)
    && iBoutonVies > 0 && iReponse > iBoutonVies && iCase > iBoutonVies
    && /if \(!coche\) \{\s*const m = messageTva\('sans_engagement'\)\.texte;\s*setMotifDeclaration\(m\);/.test(ecran)
    && /r = await onDeclarer\(pour, \{ engagement: true \}\);/.test(ecran),
    `bouton ${iBoutonVies}, réponse ${iReponse}, case ${iCase}`);
  verifier('2b-2 : la fiche dit l’origine d’un numéro DÉCLARÉ (`aideDeLaSectionTvaDeclaree`) : sans cette branche, l’aide de la '
    + 'section TVA restait vide',
    /tva && tva\.origine === 'declaration' \? aideDeLaSectionTvaDeclaree\(tva\.numero, tva\.declare_le\) : null/
      .test(sansCommentaires(lire('src/components/FicheEmetteur.js'))));
  const appelsApi = sansCommentaires(lire('src/lib/api.js'));
  verifier('2b-2 : l’application déclare et retire par la fonction `tva` (`declarer` avec l’engagement et le texte que l’écran a '
    + 'montré, `retirer`), deux fonctions nommées, le choix à la fin (le piège Metro)',
    /numero: analyserNumeroTva\(numero\)\.numero,\s*action: 'declarer',\s*engagement: engagement === true,\s*texte: DECLARATION_TVA,/.test(appelsApi)
    && /action: 'retirer'/.test(appelsApi)
    && /export const declarerTva = hasSupabase \? declarerTvaSupabase : declarerTvaDemo;/.test(appelsApi)
    && /export const retirerDeclarationTva = hasSupabase \? retirerDeclarationTvaSupabase : retirerDeclarationTvaDemo;/.test(appelsApi));
  verifier('…et il dit ce qui part, avant le geste : « Seul ce numéro est envoyé à VIES »',
    /Seul ce numéro est envoyé à VIES/.test(ecran));
  verifier('…sans rien afficher quand l’annuaire publie déjà un numéro',
    /if \(!entreprise \|\| entreprise\.tva\) return null;/.test(ecran));
  verifier('…et jamais « vérifié » ni « registre » à l’écran',
    !/v[ée]rifi|registre/i.test(ecran.replace(/accessibilityLabel/g, '')));
  const me = sansCommentaires(lire('src/components/MonEntreprise.js'));
  verifier('« Mon entreprise » ne propose le contrôle qu’une fois la fiche LUE',
    /onControlerTva=\{donnees\.etat === 'pret' \? controlerTva : null\}/.test(me));
};

/* ================================================================== */
const verifierTextesLegaux = () => {
  console.log('\nLes textes légaux — VIES dit pour ce qu’il est');
  const legal = lire('src/data/legal.js');
  const version = (legal.match(/export const VERSION = '(\d{4}-\d{2}-\d{2})';/) || [])[1] || '';
  verifier('les conditions ont changé de version (un destinataire nouveau est un changement de fond)',
    version >= '2026-10-20', version);
  const section = (titre) => {
    const i = legal.indexOf(`titre: '${titre}'`);
    if (i < 0) return '';
    const j = legal.indexOf('titre:', i + 10);
    return legal.slice(i, j > i ? j : undefined).replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ');
  };
  const dest = section('À qui vos données sont transmises');
  const phraseVies = (dest.match(/VIES \(ec\.europa\.eu\)[\s\S]*?jamais le nom ni l’adresse qu’elle renvoie\./) || [''])[0];
  verifier('« À qui vos données sont transmises » : VIES interroge l’administration fiscale, et c’est elle qui répond',
    /interroge l’administration fiscale de chaque pays/.test(phraseVies)
    && /C’est l’administration fiscale française qui y répond/.test(phraseVies), phraseVies.slice(0, 200));
  verifier('…ce qui part : ce numéro seul, depuis les serveurs d’Opus, jamais le nom, l’adresse électronique ni l’IP',
    /seul ce numéro y est envoyé, depuis les serveurs d’Opus — jamais votre nom, jamais votre adresse électronique, jamais votre adresse IP/.test(phraseVies));
  verifier('…et ce qui est gardé : « reconnu » ou « refusé », et sa date, jamais le nom ni l’adresse',
    /« reconnu » ou « refusé », et sa date, jamais le nom ni l’adresse qu’elle renvoie/.test(phraseVies));
  verifier('…aucun texte ne dit que la COMMISSION dit si un numéro est actif',
    !/Commission européenne qui dit/.test(legal.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ')));
  verifier('« Sources » : ni agrément ni caution de l’INSEE, de l’État OU de la Commission européenne',
    /ni agrément ni caution de l’INSEE, de l’État ou de la Commission européenne/.test(section('Sources')));
  verifier('« Ce que nous collectons » dit le numéro écrit et la date de VIES',
    /celui que vous écrivez vous-même, et la date à laquelle VIES/.test(section('Ce que nous collectons')));
  verifier('« Pourquoi, et sur quelle base » donne la base du contrôle par VIES, et de ses limites',
    /Faire contrôler par VIES le numéro de TVA que vous écrivez, et le garder : exécution du contrat/.test(section('Pourquoi, et sur quelle base'))
    && /Limiter le nombre de ces contrôles par compte : intérêt légitime/.test(section('Pourquoi, et sur quelle base')));
  const decision = section('Une décision automatique, et comment la faire revoir');
  verifier('« Une décision automatique » dit que c’est une RÈGLE D’OPUS — jamais « pas une décision d’Opus »',
    /c’est une règle d’Opus/.test(decision) && !/pas une décision d’Opus/.test(legal.replace(/'\s*\+\s*'/g, '')));
  /* LA PORTE DE SORTIE (2b-2) : « Aucune vérification par un humain
     n'existe encore » est remplacée — c'était vrai, et ça le reste
     (« personne chez Opus ne revoit les refus de VIES ») —, mais la règle
     n'est plus sans issue. Le texte doit dire le recours (la déclaration
     sur l'honneur), qu'il ENGAGE, qu'il se RETIRE, et ce qu'Opus ne
     contrôle pas. Retirer la phrase sur l'humain sans dire le recours, ou
     garder l'ancienne, rougit (sabotage S30). */
  verifier('…dit ce qu’elle empêche (les devis à un particulier, et aux clients traités comme tels), et que personne chez Opus ne revoit les refus',
    /devis à des particuliers/.test(decision) && /ni à un client qu’Opus traite comme tel/.test(decision)
    && /personne chez Opus ne revoit les refus de VIES/.test(decision)
    && !/Aucune vérification par un humain n’existe encore/.test(legal.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ')));
  verifier('…et le recours : la déclaration sur l’honneur (après un refus ou trois contrôles sans réponse), qui engage, et qui se retire',
    /S’il le refuse, ou s’il ne répond pas à trois contrôles en plus d’une heure, vous pouvez déclarer sur l’honneur que ce numéro est celui que l’administration fiscale a attribué à votre entreprise/.test(decision)
    && /Cette déclaration vous engage\./.test(decision)
    && /Vous pouvez retirer votre déclaration à tout moment\./.test(decision)
    && /Opus contrôle la forme du numéro et qu’il désigne bien votre entreprise, mais pas qu’il vous a été attribué/.test(decision)
    && !/S’il ne le reconnaît pas, Opus ne l’imprime pas/.test(decision));
  verifier('« Sources » : gardé si VIES le reconnaît, sinon seulement sur la déclaration de l’entreprise — plus « n’est gardé que si VIES »',
    /est gardé si VIES/.test(section('Sources'))
    && /seulement si l’entreprise déclare sur l’honneur, après un refus de VIES, ou après trois contrôles sans réponse/.test(section('Sources'))
    && !/n’est gardé que si VIES/.test(legal.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ')));
  verifier('« Pourquoi » : plus « un numéro qu’aucune administration ne reconnaît », et la base de la déclaration',
    /ni l’administration ne reconnaît, ni l’entreprise n’a déclaré sur l’honneur comme le sien/.test(section('Pourquoi, et sur quelle base'))
    && /Garder votre déclaration sur l’honneur, son texte et sa date : exécution du contrat/.test(section('Pourquoi, et sur quelle base'))
    && !/qu’aucune administration ne reconnaît/.test(legal.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ')));
  verifier('« Ce que nous collectons » dit la déclaration, son texte et sa date',
    /ou, s’il le refuse ou ne répond pas à trois contrôles, votre déclaration sur l’honneur, son texte et sa date/.test(section('Ce que nous collectons')));
  verifier('…et ce qu’on peut faire : le service des impôts des entreprises, ou la franchise',
    /service des impôts des entreprises/.test(decision) && /franchise en base de TVA/.test(decision));
  const temps = section('Combien de temps');
  verifier('« Combien de temps » annonce les compteurs et le refus retenu, sous une empreinte, sans durée promise',
    /Pour limiter les contrôles auprès de VIES/.test(temps) && /sous une empreinte qui ne laisse lire ni le compte ni le numéro/.test(temps)
    && /retient quelques heures/.test(temps) && /y compris si le compte a été supprimé/.test(temps));
  verifier('…dont le compte des silences de VIES (P5), retenu un jour, et ce que la base fait de la déclaration',
    /et un jour que VIES n’a pas répondu pour lui, sous une empreinte/.test(temps)
    && /de même votre déclaration sur l’honneur, son texte et sa date\. Elle est effacée si vous la retirez, ou remplacée si un autre numéro prend sa place/.test(temps)
    && /si VIES reconnaît ensuite ce même numéro, elle reste jointe à sa preuve, et reprend effet s’il le refuse de nouveau/.test(temps));
  verifier('aucun texte légal ne dit « certifi… » (la case le dit, pas Opus)',
    !/certifi/i.test(legal.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')));
};

const verifierPaquet = () => {
  console.log('\nLe contrôle est lancé avec les autres');
  const scripts = JSON.parse(lire('package.json')).scripts || {};
  verifier('`npm run verifier-tva` existe', scripts['verifier-tva'] === 'node scripts/verifier-tva.mjs');
};

try {
  verifierEdge();
  verifierBase();
  verifierApplication();
  verifierTextesLegaux();
  verifierPaquet();
} catch (e) {
  echecs += 1;
  console.error(`  ✘ le contrôle a planté : ${e && e.stack}`);
}
console.log(echecs ? `\n${echecs} échec(s).` : '\nTout est en ordre.');
process.exit(echecs ? 1 : 0);
