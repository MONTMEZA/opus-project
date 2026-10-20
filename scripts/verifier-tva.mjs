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
      'insert', 'single', 'maybeSingle', 'order', 'in', 'neq', 'or']) {
      q[m] = (...args) => { ops.push([m, ...args]); return q; };
    }
    q.then = (resolu, rejete) => {
      E.ecritures.push({ table, ops, vies: E.vies.length, t });
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
          E.rpc.push({ nom, args, vies: E.vies.length, t });
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

  const scenario = (o = {}) => {
    t = T0;
    minuteurs.length = 0;
    journal.length = 0;
    E = {
      ecritures: [], rpc: [], vies: [], getUser: [], clients: [],
      entreprise: o.entreprise === undefined ? { siren: SIREN, tva: null } : o.entreprise,
      preuveRecente: o.preuveRecente || null,
      refusRetenu: o.refusRetenu || null,
      viesRep: o.viesRep || (() => VALIDE),
      duree: o.duree || ((n, rep) => (rep === SATURE || rep === BLOQUE ? 1500 : 10000)),
      rpcRep: o.rpcRep || ((nom) => (nom === 'compter_essai_tva' ? { data: 'ok', error: null } : { data: true, error: null })),
      erreurs: o.erreurs || {},
      base(table, ops) {
        const a = (m) => ops.some(([x]) => x === m);
        if (table === 'entreprise_registre') {
          if (this.erreurs.entreprise) return { data: null, error: { message: 'panne' } };
          return { data: this.entreprise ? [this.entreprise] : [], error: null };
        }
        if (table === 'preuves_tva' && a('upsert')) {
          if (this.erreurs.upsert) return { data: null, error: { message: 'panne' } };
          const ligne = (ops.find(([m]) => m === 'upsert') || [])[1] || {};
          return { data: { numero: ligne.numero, reconnu_le: DATE_BASE }, error: null };
        }
        if (table === 'preuves_tva' && a('delete')) {
          return this.erreurs.retrait ? { data: null, error: { message: 'panne' } } : { data: null, error: null };
        }
        if (table === 'preuves_tva' && a('select')) {
          if (this.erreurs.preuves) return { data: null, error: { message: 'panne' } };
          return { data: this.preuveRecente ? [this.preuveRecente] : [], error: null };
        }
        if (table === 'siret_limites' && a('delete')) return { data: null, error: null };
        if (table === 'siret_limites' && a('select')) {
          return { data: this.refusRetenu ? [this.refusRetenu] : [], error: null };
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
      body: (o.methode || 'POST') === 'POST' ? JSON.stringify({ numero }) : undefined,
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
  verifier('les issues du serveur, les onze',
    egal([...T.ISSUES_TVA_SERVEUR].sort(), ['autre_siren', 'bloque', 'cle_fausse', 'deja_publie', 'indisponible',
      'mal_forme', 'reconnu', 'refuse', 'sans_compte', 'sans_entreprise', 'trop_d_essais'])
    && T.ISSUES_TVA.length === 14
    && ['reseau', 'lent', 'service_indisponible'].every((i) => T.ISSUES_TVA.includes(i) && !T.ISSUES_TVA_SERVEUR.includes(i)));

  const P = T.ligneDePreuveTva;
  const ligne = P({ pro_id: 'u', siren: '000048009', numero: 'FR91000048009', vies_le: '2026-10-20T13:51:00.982Z' });
  verifier('la ligne de preuve : cinq colonnes, source « vies », et PAS de reconnu_le (la base la pose)',
    egal(Object.keys(ligne || {}).sort(), ['numero', 'pro_id', 'siren', 'source', 'vies_le']) && ligne.source === 'vies');
  verifier('…et aucune ligne pour un numéro qui ne désigne pas ce SIREN, ou mal formé',
    P({ pro_id: 'u', siren: '000048017', numero: 'FR91000048009' }) === null
    && P({ pro_id: 'u', siren: '000048009', numero: 'FR9100004800' }) === null
    && P({ pro_id: 'u', siren: '000048009', numero: 'FRIO000048009' }) === null
    && P({ pro_id: null, siren: '000048009', numero: 'FR91000048009' }) === null);
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
  const textes = [];
  for (const d of variantes) for (const i of [...etats, ...issues]) textes.push([i, T.messageTva(i, d).texte]);
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
    [...etats, ...issues].every((i) => [null, 'corriger', 'reessayer'].includes(T.messageTva(i, {}).action)));
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
  verifier('la source : « vies » ou « essai », rien d’autre',
    /add constraint preuve_tva_source_check\s*check \(source in \('vies', 'essai'\)\)/.test(schema));
  const declencheur = (schema.match(/function public\.tient_la_preuve_tva\(\)[\s\S]*?\$\$;/) || [''])[0];
  verifier('la date du contrôle : posée à l’insertion et par la clé de SERVICE seulement, gardée sinon',
    /if tg_op = 'INSERT' or current_user = 'service_role' then\s+new\.reconnu_le := clock_timestamp\(\);\s+else\s+new\.reconnu_le := old\.reconnu_le;\s+end if;/.test(declencheur)
    && /before insert or update on public\.preuves_tva/.test(schema), declencheur.slice(0, 300));
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
  verifier('l’export RGPD la contient',
    /'mon_numero_de_tva',\s*\(select to_jsonb\(x\) from public\.preuves_tva x where x\.pro_id = auth\.uid\(\)\)/.test(schema));
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
  verifier('`monEmetteur` lit la preuve avec le reste de la fiche, sa source comprise',
    /from\('preuves_tva'\)\.select\('siren, numero, reconnu_le, source'\)/.test(lecture));
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
  verifier('…un numéro pas prêt DIT pourquoi, au lieu d’un bouton muet',
    /if \(!pret\) \{[\s\S]{0,200}setMotif\(m\);/.test(ecran));
  verifier('…le contrôle en vol se dit au-dessus (`onOccupe`), et « Mon entreprise » refuse de se fermer ou de passer en édition',
    /if \(onOccupe\) onOccupe\(true\);/.test(ecran) && /if \(onOccupe\) onOccupe\(false\);/.test(ecran)
    && (sansCommentaires(lire('src/components/MonEntreprise.js')).match(/if \(occupeTva\) \{/g) || []).length === 2);
  const meCode = sansCommentaires(lire('src/components/MonEntreprise.js'));
  verifier('…et le message « attendez » part avec la fin du contrôle (il disait « en cours » sur un numéro reconnu)',
    (meCode.match(/attendez sa réponse[^']*', 'attente'\);/g) || []).length === 2
    && /const occuperTva = \(enCours\) => \{\s*setOccupeTva\(enCours\);\s*if \(!enCours\) setMessage\(\(m\) => \(m && m\.ton === 'attente' \? null : m\)\);\s*\};/.test(meCode)
    && /onOccupeTva=\{occuperTva\}/.test(meCode));
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
  verifier('…dit ce qu’elle empêche (les devis à un particulier), et qu’aucune révision humaine n’existe encore',
    /devis à des particuliers/.test(decision) && /Aucune vérification par un humain n’existe encore pour cette décision/.test(decision));
  verifier('…et ce qu’on peut faire : le service des impôts des entreprises, ou la franchise',
    /service des impôts des entreprises/.test(decision) && /franchise en base de TVA/.test(decision));
  const temps = section('Combien de temps');
  verifier('« Combien de temps » annonce les compteurs et le refus retenu, sous une empreinte, sans durée promise',
    /Pour limiter les contrôles auprès de VIES/.test(temps) && /sous une empreinte qui ne laisse lire ni le compte ni le numéro/.test(temps)
    && /retient quelques heures/.test(temps) && /y compris si le compte a été supprimé/.test(temps));
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
