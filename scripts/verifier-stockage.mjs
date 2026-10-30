#!/usr/bin/env node
/**
 * Le stockage et le badge suspendu — lot S-a (25/10/2026).
 *
 *   npm run verifier-stockage
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Deux règles GÉNÉRALES de la section 13 (« remplacement de mes fichiers »,
 * « suppression de mes fichiers ») s'appliquaient à TOUS les espaces de
 * stockage, sans filtre : l'expéditeur d'une pièce jointe pouvait la retirer
 * ou la remplacer, un artisan vérifié pouvait remplacer son Kbis validé sous
 * le même nom, et le DÉPLACER vers un espace public (le « move » de
 * storage-api est un UPDATE). Des règles RLS s'additionnent : une absence de
 * règle « à soi » ne ferme rien si une règle plus large existe déjà.
 *
 * Ce qu'il refuse :
 *   A. toute politique de storage.objects sans filtre d'espace (bucket_id = …
 *      ou bucket_id in (…)) au premier niveau de sa condition, pour TOUS les
 *      verbes ; une politique sans « for … » (FOR ALL : quatre portes) ; une
 *      politique UPDATE qui ouvre un espace, ou DELETE hors des trois espaces
 *      publics ; un `or` au premier niveau ;
 *   B. dans src/ : `upsert: true`, un en-tête `x-upsert`, une méthode du
 *      stockage hors de la liste permise, et — le chemin HTTP DIRECT du
 *      téléphone, que les appels du client Supabase ne montrent pas — toute
 *      adresse `/storage/v1/object` appelée autrement qu'en POST, ou vers
 *      `move` / `copy` ;
 *   C. un espace créé dans schema.sql que la fonction Edge `compte` ne vide
 *      pas ;
 *   D. le badge suspendu : la règle de l'écran (`src/lib/verification.js`)
 *      tourne sur les MÊMES cas que `supabase/essais-section-51a.sql`, et la
 *      base tient les cinq points de la décision D4 ;
 *   E. la phrase du 409 (« ce fichier existe déjà ») vit AVANT la branche du
 *      23505 dans `erreurs.js` : la fonction est APPELÉE, pas lue.
 *
 * LIMITE, et elle est écrite : A et D-base lisent du TEXTE. La preuve de
 * sécurité reste l'essai SQL, qui interroge pg_policies sur une base rejouée
 * (`essais-section-51a.sql`, cas B12 et B13).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/* `resolve` et `pathToFileURL` (relecture « écran », E13) : avec un chemin
   RELATIF en argument, `import()` le lisait par rapport au script, et le
   contrôle PLANTAIT au lieu de vérifier. */
const RACINE = resolve(process.argv[2] || process.cwd());
const importer = (f) => import(pathToFileURL(join(RACINE, f)).href);
const lire = (f) => readFileSync(join(RACINE, f), 'utf8');
const ESPACES_PUBLICS = ['avatars', 'bannieres', 'publications'];
const ESPACES_FIGES = ['documents', 'pieces-jointes', 'devis'];
const PERMIS = {
  UPDATE: [],                 // option 1 : personne ne remplace un fichier
  DELETE: ESPACES_PUBLICS,    // option 1 : on retire SES photos publiques
};
/* Espaces que le ménage de compte a le droit de NE PAS vider, avec la raison.
   Vide aujourd'hui : chaque espace doit être vidé. Le lot 2 devra y inscrire
   `devis` S'IL décide qu'un devis remis survit au compte (conservation
   légale), et le dire. */
const EXCLUS_DU_MENAGE = {};
const METHODES_PERMISES = new Set(['from', 'upload', 'getPublicUrl', 'createSignedUrl', 'createSignedUrls']);

let echecs = 0;
const ok = (m) => console.log(`  ✔ ${m}`);
const ko = (m) => { echecs += 1; console.log(`  ✘ ${m}`); };

function sansCommentaires(sql) {
  // retire /* … */ puis -- … (hors chaînes simples, approximation suffisante ici)
  let s = sql.replace(/\/\*[\s\S]*?\*\//g, ' ');
  s = s.split('\n').map((ligne) => {
    let dansChaine = false;
    for (let i = 0; i < ligne.length; i += 1) {
      const c = ligne[i];
      if (c === "'") dansChaine = !dansChaine;
      if (!dansChaine && c === '-' && ligne[i + 1] === '-') return ligne.slice(0, i);
    }
    return ligne;
  }).join('\n');
  return s;
}

/** Le contenu des parenthèses qui s'ouvrent à `debut` (index de « ( »). */
function parenthese(s, debut) {
  let n = 0;
  for (let i = debut; i < s.length; i += 1) {
    if (s[i] === '(') n += 1;
    else if (s[i] === ')') { n -= 1; if (n === 0) return { dedans: s.slice(debut + 1, i), fin: i }; }
  }
  return null;
}

function sansParenthesesExterieures(e) {
  let x = e.trim();
  while (x.startsWith('(')) {
    const p = parenthese(x, 0);
    if (!p || p.fin !== x.length - 1) break;
    x = p.dedans.trim();
  }
  return x;
}

/** Découpe au premier niveau sur un mot-clé (and / or). */
function decouper(e, mot) {
  const parts = []; let n = 0; let dernier = 0; let chaine = false;
  const re = new RegExp(`^\\s${mot}\\s`, 'i');
  for (let i = 0; i < e.length; i += 1) {
    const c = e[i];
    if (c === "'") chaine = !chaine;
    if (chaine) continue;
    if (c === '(') n += 1; else if (c === ')') n -= 1;
    else if (n === 0 && re.test(e.slice(i, i + mot.length + 2))) {
      parts.push(e.slice(dernier, i)); dernier = i + mot.length + 1;
    }
  }
  parts.push(e.slice(dernier));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Les espaces qu'une condition ouvre, ou une erreur lisible. */
function espacesDe(expr) {
  const e = sansParenthesesExterieures(expr);
  if (/^false$/i.test(e)) return { espaces: [] };
  if (decouper(e, 'or').length > 1) return { erreur: 'un « or » au premier niveau' };
  for (const terme of decouper(e, 'and')) {
    const t = sansParenthesesExterieures(terme);
    let m = t.match(/^bucket_id\s*=\s*'([^']+)'$/i);
    if (m) return { espaces: [m[1]] };
    m = t.match(/^bucket_id\s+in\s*\(([^()]*)\)$/i);
    if (m) return { espaces: [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) };
    if (/^false$/i.test(t)) return { espaces: [] };
  }
  return { erreur: 'aucun filtre bucket_id au premier niveau' };
}

function politiques(sql) {
  const etat = new Map();
  const re = /\b(create|alter|drop)\s+policy\s+(?:if\s+exists\s+)?"([^"]+)"\s+on\s+storage\.objects\b([\s\S]*?);/gi;
  for (const m of sql.matchAll(re)) {
    const [, verbe, nom, reste] = m;
    if (verbe.toLowerCase() === 'drop') { etat.delete(nom); continue; }
    const p = verbe.toLowerCase() === 'create' ? { nom, cmd: null, using: null, check: null } : (etat.get(nom) || { nom, cmd: null });
    if (verbe.toLowerCase() === 'create') {
      const f = reste.match(/\bfor\s+(select|insert|update|delete|all)\b/i);
      p.cmd = f ? f[1].toUpperCase() : 'ALL (implicite)';
    }
    const iu = reste.search(/\busing\s*\(/i);
    if (iu >= 0) p.using = parenthese(reste, reste.indexOf('(', iu)).dedans;
    const ic = reste.search(/\bwith\s+check\s*\(/i);
    if (ic >= 0) p.check = parenthese(reste, reste.indexOf('(', ic)).dedans;
    etat.set(nom, p);
  }
  return [...etat.values()];
}

console.log('— A. Les politiques de storage.objects (supabase/schema.sql)');
const schema = sansCommentaires(readFileSync(join(RACINE, 'supabase/schema.sql'), 'utf8'));
const liste = politiques(schema);
if (liste.length === 0) ko('aucune politique trouvée : le contrôle ne lit rien');
for (const p of liste) {
  if (p.cmd.startsWith('ALL')) { ko(`« ${p.nom} » est ${p.cmd} — quatre portes`); continue; }
  const conditions = [['using', p.using], ['with check', p.check]].filter(([, x]) => x !== null);
  if (conditions.length === 0) { ko(`« ${p.nom} » n'a aucune condition`); continue; }
  let espaces = null;
  for (const [quoi, x] of conditions) {
    const r = espacesDe(x);
    if (r.erreur) { ko(`« ${p.nom} » (${p.cmd}, ${quoi}) : ${r.erreur}`); espaces = null; break; }
    espaces = espaces === null ? r.espaces : [...new Set([...espaces, ...r.espaces])];
  }
  if (espaces === null) continue;
  if (p.cmd === 'UPDATE' || p.cmd === 'DELETE') {
    const interdits = espaces.filter((e) => !PERMIS[p.cmd].includes(e));
    const figes = espaces.filter((e) => ESPACES_FIGES.includes(e));
    if (figes.length) ko(`« ${p.nom} » (${p.cmd}) touche un espace figé : ${figes.join(', ')}`);
    else if (interdits.length) ko(`« ${p.nom} » (${p.cmd}) ouvre ${interdits.join(', ')}, hors de la liste permise`);
    else ok(`« ${p.nom} » (${p.cmd}) : ${espaces.length ? espaces.join(', ') : 'aucun espace (neutralisée)'}`);
  } else ok(`« ${p.nom} » (${p.cmd}) : ${espaces.join(', ')}`);
}

console.log('— B. Les appels au stockage dans src/');
const fichiers = [];
(function parcourir(d) {
  for (const n of readdirSync(d)) {
    const c = join(d, n);
    if (statSync(c).isDirectory()) parcourir(c);
    else if (/\.(js|jsx|ts|tsx)$/.test(n)) fichiers.push(c);
  }
}(join(RACINE, 'src')));
let appels = 0;
for (const f of fichiers) {
  const code = sansCommentaires(readFileSync(f, 'utf8'));
  const nom = f.replace(RACINE + '/', '');
  if (/\bupsert\s*:\s*true\b/.test(code) && /storage/.test(code)) ko(`${nom} : « upsert: true » dans un fichier qui parle au stockage`);
  if (/['"]x-upsert['"]/i.test(code)) ko(`${nom} : en-tête x-upsert`);
  for (const m of code.matchAll(/\.storage\s*\.\s*from\([^)]*\)\s*\.\s*([A-Za-z]+)/g)) {
    appels += 1;
    if (!METHODES_PERMISES.has(m[1])) ko(`${nom} : storage.${m[1]}() n'est pas dans la liste permise`);
  }
  /* SECOND PASSAGE (relecture « écran », E8) : `const espace =
     supabase.storage.from('x')` puis `espace.remove(…)` échappait au premier.
     On relève les noms qui reçoivent un `storage.from(…)` ou un `.storage`,
     puis toute méthode appelée sur eux. */
  const noms = new Set();
  for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;\n]*?\.storage\b(?:\s*\.\s*from\([^)]*\))?\s*;?\s*$/gm)) noms.add(m[1]);
  for (const n of noms) {
    for (const m of code.matchAll(new RegExp(`\\b${n.replace(/\$/g, '\\$')}\\s*\\.\\s*([A-Za-z]+)\\s*\\(`, 'g'))) {
      appels += 1;
      if (!METHODES_PERMISES.has(m[1])) ko(`${nom} : ${n}.${m[1]}() (stockage par une variable) n'est pas dans la liste permise`);
    }
  }
}
if (appels === 0) ko('aucun appel au stockage trouvé : le contrôle ne lit rien');
else ok(`${appels} appels au stockage, tous dans la liste permise (ou signalés ci-dessus)`);

console.log('— C. Chaque espace créé est vidé par le ménage de compte');
const crees = new Set();
for (const m of schema.matchAll(/insert\s+into\s+storage\.buckets[^;]*?values([\s\S]*?)(?:on\s+conflict|;)/gi)) {
  for (const t of m[1].matchAll(/\(\s*'([^']+)'/g)) crees.add(t[1]);
}
const compte = readFileSync(join(RACINE, 'supabase/functions/compte/index.ts'), 'utf8');
const mEsp = compte.match(/const\s+ESPACES\s*=\s*\[([^\]]*)\]/);
const vides = new Set(mEsp ? [...mEsp[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : []);
if (crees.size === 0) ko('aucun espace trouvé dans schema.sql');
for (const e of crees) {
  if (vides.has(e)) ok(`${e} : vidé`);
  else if (EXCLUS_DU_MENAGE[e]) ok(`${e} : exclu du ménage (${EXCLUS_DU_MENAGE[e]})`);
  else ko(`${e} : créé dans schema.sql, mais la fonction compte ne le vide pas`);
}


console.log('— B bis. Le chemin HTTP direct du téléphone (storage.js)');
{
  const code = sansCommentaires(lire('src/lib/storage.js'));
  const adresses = [...code.matchAll(/\/storage\/v1\/object[^`'"\s]*/g)].map((m) => m[0]);
  if (adresses.length === 0) ko('aucune adresse /storage/v1/object trouvée : le contrôle ne lit rien');
  const deplace = adresses.filter((a) => /\/(move|copy)\b/.test(a));
  if (deplace.length) ko(`adresse de déplacement ou de copie : ${deplace.join(', ')}`);
  else ok(`${adresses.length} adresse(s) d’envoi, aucune vers move ou copy`);
  const methodes = [...code.matchAll(/httpMethod\s*:\s*'([A-Z]+)'/g)].map((m) => m[1]);
  if (methodes.length === 0) ko('aucune méthode HTTP déclarée pour l’envoi direct');
  else if (methodes.some((m) => m !== 'POST')) ko(`méthode HTTP autre que POST : ${methodes.join(', ')} (PUT remplace un fichier)`);
  else ok('l’envoi direct est un POST (créer, jamais remplacer)');
  if (/upsert\s*:\s*false/.test(code)) ok('le client Supabase envoie avec `upsert: false`');
  else ko('storage.js doit envoyer avec `upsert: false` explicitement');
}

console.log('— D. Le badge suspendu : la règle de l’écran tourne sur les cas de l’essai');
const V = await importer('src/lib/verification.js');
{
  const A = {
    verifie: true, verifieLe: '2026-01-01T00:00:00Z', verificationStatut: 'verifie',
    kbis: { valide: true, maj: '03/2026' }, assurance: { valide: true, expire: '12/2026' },
    kbisPath: 'a/kbis-1.pdf', assurancePath: 'a/assurance-1.pdf', rgePath: 'a/rge-1.pdf',
  };
  const T = '2026-10-25T10:00:00Z';
  const cas = [
    ['C1 — Kbis validé remplacé : badge suspendu, pièce suspendue, en attente',
      () => { const r = V.apresEnvoiDesPieces(A, { kbisPath: 'a/kbis-2.pdf' }, T);
        return !r.verifie && !r.kbis.valide && r.assurance.valide && r.verificationStatut === 'en_attente'
          && r.badgeSuspenduLe === T && r.verifieLe === null && V.metiersFiges(r); }],
    ['C1 — l’avertissement s’affiche avant l’envoi',
      () => V.envoiSuspendLeBadge(A, { kbis: true }) && V.envoiSuspendLeBadge(A, { assurance: true })],
    ['C5 — le MÊME chemin ne change rien',
      () => { const r = V.apresEnvoiDesPieces(A, { kbisPath: 'a/kbis-1.pdf' }, T);
        return r.verifie && !r.badgeSuspenduLe && r.verificationStatut === 'verifie'; }],
    ['C6 — vérifié SANS fichier : le premier envoi suspend',
      () => { const r = V.apresEnvoiDesPieces({ ...A, kbisPath: null, assurancePath: null }, { kbisPath: 'a/k9.pdf' }, T);
        return !r.verifie && r.badgeSuspenduLe === T && r.verificationStatut === 'en_attente'; }],
    ['C8 — non vérifié, pièce validée remplacée : pièce suspendue, aucun badge à suspendre',
      () => { const B = { ...A, verifie: false, assurance: { valide: false }, verificationStatut: 'en_attente' };
        const r = V.apresEnvoiDesPieces(B, { kbisPath: 'a/kbis-2.pdf' }, T);
        return !r.kbis.valide && !r.badgeSuspenduLe && !V.envoiSuspendLeBadge(B, { kbis: true }); }],
    ['D1 — un envoi RGE seul ne touche ni au badge, ni au statut, ni à l’avertissement',
      () => { const r = V.apresEnvoiDesPieces(A, { rgePath: 'a/rge-2.pdf', rge: { declare: true, numero: 'X' } }, T);
        return r.verifie && r.verificationStatut === 'verifie' && !r.badgeSuspenduLe && !V.envoiSuspendLeBadge(A, {}); }],
    ['les métiers sont figés pour un badge accordé ou suspendu, libres sinon',
      () => V.metiersFiges(A) && V.metiersFiges({ verifie: false, badgeSuspenduLe: T })
        && !V.metiersFiges({ verifie: false, badgeSuspenduLe: null })],
  ];
  for (const [nom, f] of cas) {
    let r = false;
    try { r = f(); } catch (e) { r = false; }
    if (r) ok(nom); else ko(nom);
  }
}

/* LES 768 CAS DE LA BASE (relecture « écran », E3) : le contrôle ne faisait
   tourner que sept cas écrits à la main — ni la première pièce d'un artisan
   non vérifié (le cas le plus courant), ni une déclaration RGE jointe.
   `supabase/cas-badge.json` range ce que le VRAI déclencheur fait de chaque
   situation (`scripts/generer-cas-badge.mjs`) ; la règle de l'écran doit
   rendre la même fiche, et prévenir exactement quand la base notifie. */
console.log('— D (suite). La règle de l’écran rend ce que la base a rendu, sur supabase/cas-badge.json');
{
  let donnees = null;
  try { donnees = JSON.parse(lire('supabase/cas-badge.json')); } catch (e) { donnees = null; }
  const liste = (donnees && Array.isArray(donnees.cas)) ? donnees.cas : [];
  if (liste.length < 768) ko(`supabase/cas-badge.json : ${liste.length} cas au lieu de 768 — le contrôle ne lit rien`);
  const T = '2026-10-25T10:00:00Z';
  const versPro = (f) => ({
    verifie: f[0], verifieLe: f[1] ? '2026-10-01T00:00:00Z' : null, verificationStatut: f[2],
    kbis: { valide: f[3], maj: f[4] }, assurance: { valide: f[5], expire: f[6] },
    kbisPath: f[7], assurancePath: f[8], rgePath: f[9], badgeSuspenduLe: f[10] ? '2026-10-20T10:00:00Z' : null,
  });
  const versFiche = (p) => [!!p.verifie, p.verifieLe ? 1 : 0, p.verificationStatut, !!(p.kbis && p.kbis.valide),
    (p.kbis && p.kbis.maj) || null, !!(p.assurance && p.assurance.valide), (p.assurance && p.assurance.expire) || null,
    p.kbisPath || null, p.assurancePath || null, p.rgePath || null, p.badgeSuspenduLe ? 1 : 0];
  const ecarts = []; const avertissements = [];
  for (const [n, avant, envoi, apres, notif] of liste) {
    const pro = versPro(avant);
    const [kbisPath, assurancePath, rgePath] = envoi;
    const rendu = versFiche(V.apresEnvoiDesPieces(pro,
      { kbisPath, assurancePath, rgePath, rge: { declare: true, numero: 'QB/1', expire: '12/2027' } }, T));
    if (JSON.stringify(rendu) !== JSON.stringify(apres)) ecarts.push(`cas ${n} : écran ${JSON.stringify(rendu)} / base ${JSON.stringify(apres)}`);
    const previent = V.envoiSuspendLeBadge(pro, { kbis: !!kbisPath, assurance: !!assurancePath });
    if (previent !== (notif === 1)) avertissements.push(`cas ${n} : l’écran ${previent ? 'prévient' : 'ne prévient pas'}, la base ${notif ? 'notifie' : 'ne notifie pas'}`);
  }
  if (liste.length && ecarts.length === 0) ok(`${liste.length} cas : la fiche rendue par l’écran est celle de la base`);
  else if (liste.length) ko(`${ecarts.length} écart(s), dont : ${ecarts.slice(0, 3).join(' | ')}`);
  if (liste.length && avertissements.length === 0) ok(`${liste.length} cas : l’avertissement avant envoi part exactement quand la base suspend le badge`);
  else if (liste.length) ko(`${avertissements.length} écart(s) d’avertissement, dont : ${avertissements.slice(0, 3).join(' | ')}`);
}

console.log('— D bis. La base tient les cinq points de la décision D4');
{
  const corps = (nom) => {
    const i = schema.search(new RegExp(`create or replace function public\\.${nom}\\(`));
    if (i < 0) return '';
    const debut = schema.indexOf('$$', i);
    const fin = schema.indexOf('$$', debut + 2);
    return schema.slice(debut, fin);
  };
  const tpp = corps('tient_le_profil_pro');
  const branche = tpp.slice(tpp.search(/if tg_op = 'UPDATE' and auth\.uid\(\) is not null and auth\.uid\(\) = new\.id then/));
  const verifs = [
    ['la colonne `badge_suspendu_le` existe', /add column if not exists badge_suspendu_le timestamptz/.test(schema)],
    ['le titulaire ne l’écrit pas : remise à l’ancienne valeur (UPDATE) et à vide (INSERT)',
      /new\.badge_suspendu_le\s*:=\s*old\.badge_suspendu_le/.test(branche)
      && /tg_op = 'INSERT'[\s\S]*?new\.badge_suspendu_le\s*:=\s*null[\s\S]*?end if;/.test(tpp)],
    ['une pièce VALIDÉE dont le chemin change est suspendue (Kbis et assurance)',
      /old\.kbis_valide and new\.kbis_url is distinct from old\.kbis_url/.test(branche)
      && /old\.assurance_valide and new\.assurance_url is distinct from old\.assurance_url/.test(branche)
      && /new\.kbis_valide\s*:=\s*false/.test(branche) && /new\.assurance_valide\s*:=\s*false/.test(branche)],
    ['si le badge était accordé : suspendu, daté par la BASE, et une notification',
      /if old\.verifie then[\s\S]*?new\.verifie\s*:=\s*false[\s\S]*?new\.badge_suspendu_le\s*:=\s*clock_timestamp\(\)[\s\S]*?insert into public\.notifications[\s\S]*?'verification_suspendue'/.test(branche)],
    ['un Kbis retiré sans autre pièce sort « non soumis », pas « en attente »',
      /new\.verification_statut\s*:=\s*case\s+when new\.kbis_url is not null or new\.assurance_url is not null then 'en_attente'\s+else 'non_soumis'/.test(branche)],
    ['le verrou des métiers tient PENDANT la suspension',
      /old\.verifie or old\.badge_suspendu_le is not null/.test(corps('tient_les_metiers'))],
    ['la suspension s’efface quand le badge est rendu ou refusé',
      (() => { const c = corps('synchronise_verification');
        return (c.match(/new\.badge_suspendu_le\s*:=\s*null/g) || []).length >= 2 && /'refuse'/.test(c); })()],
    ['l’écran fige les métiers par `metiersFiges()` et prévient avant l’envoi, avec les DEUX pièces choisies',
      (() => { const e = sansCommentaires(lire('src/screens/ProfilEditScreen.js'));
        return /verrouille=\{metiersFiges\(profil\)\}/.test(e)
          && /envoiSuspendLeBadge\(profil,\s*\{\s*kbis:\s*!!kbis,\s*assurance:\s*!!assurance\s*\}\)\s*&&/.test(e)
          && /\{AVERTISSEMENT_SUSPENSION\}/.test(e); })()],
    ['l’état local suit la base après l’envoi (`apresEnvoiDesPieces`, avec ce qui part vraiment)',
      (() => { const a = sansCommentaires(lire('src/OpusApp.js'));
        return /\[myProId\]:\s*apresEnvoiDesPieces\(prev\[myProId\],\s*\{\s*kbisPath,\s*assurancePath,\s*rgePath,\s*rge\s*\}\)/.test(a)
          && /envoiSuspendLeBadge\(avant,\s*\{\s*kbis:\s*!!kbisPath,\s*assurance:\s*!!assurancePath\s*\}\)/.test(a); })()],
    ['l’application LIT `badge_suspendu_le` sur sa propre fiche (sinon, après rechargement, des métiers modifiables que la base refusera)',
      (() => { const a = sansCommentaires(lire('src/lib/api.js'));
        /* Depuis le lot S-d : par `ma_fiche_pro()`, la seule porte vers les
           colonnes privées de SA fiche, fusionnée à elle seule ; et jamais
           dans la liste que tous les téléphones reçoivent. */
        const prives = (a.match(/function champsPrivesDeMaFiche\(row\) \{[\s\S]*?\n\}/) || [''])[0];
        return /supabase\.rpc\('ma_fiche_pro'\)\.maybeSingle\(\)/.test(a)
          && /badgeSuspenduLe:\s*row\.badge_suspendu_le \|\| null/.test(prives)
          && /if \(pros\[uid\]\) \{\s*if \(ficheRes\.error\) throw ficheRes\.error;\s*if \(ficheRes\.data\) pros\[uid\] = \{ \.\.\.pros\[uid\], \.\.\.champsPrivesDeMaFiche\(ficheRes\.data\) \};/.test(a)
          && !/COLONNES_PRO_LISTE\s*=[^;]*badge_suspendu_le/.test(a); })()],
    ['une fiche ne range que les pièces de SON dossier (`pro_pieces_dossier_check`, les trois pièces)',
      /add constraint pro_pieces_dossier_check[\s\S]{0,400}?kbis_url is null or split_part\(kbis_url, '\/', 1\) = id::text[\s\S]{0,200}?assurance_url is null or split_part\(assurance_url, '\/', 1\) = id::text[\s\S]{0,200}?rge_url is null or split_part\(rge_url, '\/', 1\) = id::text/.test(schema)],
    ['valider une pièce RETIRÉE est refusé (OP024 dans `admin_verifier_pro`)',
      /if \(p_kbis is true and le_kbis is null\) or \(p_assurance is true and l_assurance is null\) then[\s\S]{0,300}?errcode = 'OP024'/.test(corps('admin_verifier_pro'))],
    ['l’écran valide la pièce qu’il a VUE (`admin_valider_pieces` compare les chemins, OP024, appelée par l’application)',
      (() => { const c = corps('admin_valider_pieces');
        const a = sansCommentaires(lire('src/lib/api.js'));
        return /\(p_kbis is true and le_kbis is distinct from p_kbis_vu\)\s*or \(p_assurance is true and l_assurance is distinct from p_assurance_vu\)/.test(c)
          && /errcode = 'OP024'/.test(c) && /for update/.test(c) && /perform public\.admin_verifier_pro\(/.test(c)
          && /'public\.admin_valider_pieces\(uuid, text, text, boolean, boolean, boolean, text\)'/.test(schema)
          && /rpc\('admin_valider_pieces',[\s\S]{0,200}?p_kbis_vu[\s\S]{0,80}?p_assurance_vu/.test(a)
          && !/rpc\('admin_verifier_pro'/.test(a); })()],
    ['la suspension ne lève pas OP009 (`rattacher_mon_siret`)',
      /p\.verifie or p\.badge_suspendu_le is not null/.test(corps('rattacher_mon_siret'))],
    ['la fiche suspendue passe EN TÊTE de la file de l’administration',
      /order by \(p\.badge_suspendu_le is not null\) desc/.test(corps('admin_file_verifications'))],
    ['la notification dit la suspension sans promettre l’issue, et dit le retrait quand une pièce est retirée',
      (() => { const t = (schema.match(/'verification_suspendue',\s*case[\s\S]*?end\);/) || [''])[0];
        return /vous avez retiré une pièce/.test(t) && (t.match(/le rende ou le refuse/g) || []).length >= 1
          && !/reviendra|le temps que/.test(t); })()],
    ['`en_attente` ne part qu’avec une pièce d’existence ou d’assurance',
      /if \(kbisPath \|\| assurancePath\) patch\.verification_statut = 'en_attente'/.test(sansCommentaires(lire('src/lib/api.js')))],
    ['l’essai SQL du lot existe et éprouve la suspension, le verrou et le stockage',
      (() => { let t = ''; try { t = lire('supabase/essais-section-51a.sql').replace(/^\s*--.*$/gm, ''); } catch (e) { return false; }
        return /verification_suspendue/.test(t) && /tant que votre badge est suspendu/.test(t)
          && /on conflict \(bucket_id, name\) do update/.test(t) && /set bucket_id = 'publications'/.test(t); })()],
  ];
  for (const [nom, v] of verifs) { if (v) ok(nom); else ko(nom); }
}

console.log('— E. La phrase du 409 passe AVANT celle du 23505 (la fonction est appelée)');
{
  const E = await importer('src/lib/erreurs.js');
  const telephone = E.messageClair(new Error('Envoi refusé par Supabase : The resource already exists'), 'Votre pièce');
  const nav = new Error('The resource already exists'); nav.statusCode = '409';
  const navigateur = E.messageClair(nav, 'Votre pièce');
  const doublon = E.messageClair({ message: 'duplicate key value violates unique constraint "x_pkey"', code: '23505' }, 'Votre ligne');
  if (/ne remplace\s+jamais un fichier/.test(telephone) && /ne remplace\s+jamais un fichier/.test(navigateur))
    ok('un 409 du stockage (téléphone et navigateur) dit qu’Opus ne remplace jamais un fichier');
  else ko(`un 409 du stockage est mal traduit : « ${telephone} » / « ${navigateur} »`);
  if (/depuis un autre appareil/.test(doublon) && !/fichier/.test(doublon)) ok('un 23505 garde sa propre phrase');
  else ko(`un 23505 a perdu sa phrase : « ${doublon} »`);
}

console.log(echecs ? `\n${echecs} défaut(s).` : '\nAucun défaut.');
process.exit(echecs ? 1 : 0);
