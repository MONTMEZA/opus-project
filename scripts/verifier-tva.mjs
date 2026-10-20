/**
 * LE N° DE TVA ÉCRIT PAR L'ARTISAN — ce qu'on calcule, ce que VIES répond,
 * ce qu'on dit, ce que la fonction Edge fait, et ce que la base garde.
 *
 * POURQUOI CE CONTRÔLE EXISTE — 20/10/2026
 * ----------------------------------------
 * Quand l'annuaire des entreprises ne publie aucun numéro de TVA, l'artisan
 * l'écrit, et Opus ne le garde que si VIES le reconnaît (section 48 de
 * `schema.sql`). Tout ce qui décide passe par `src/lib/tva.js`, recopié
 * OCTET POUR OCTET dans la fonction Edge. Ce contrôle tient cinq choses :
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
 *   4. LA FONCTION EDGE, dans l'ordre : forme → appelant → entreprise →
 *      SIREN → preuve récente → limites → VIES → preuve. `node` n'ouvre pas
 *      un fichier TypeScript de Deno : cette partie lit le TEXTE.
 *
 *   5. LA BASE : la table et sa ligne se répondent, et ce qui protège la
 *      preuve (aucune écriture client, la date posée par la base) est là.
 *
 *   npm run verifier-tva
 */
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';

import * as T from '../src/lib/tva.js';
import * as S from '../src/lib/siret.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* Les commentaires partent avant toute lecture de CODE : un contrôle qui
   accuse la documentation qui explique le défaut, c'est arrivé neuf fois
   dans ce projet. Les lignes `//` ne partent qu'entières, pour ne pas
   couper une adresse `https://`. */
const sansCommentaires = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const sqlSansCommentaires = (sql) => sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');

const APP = 'src/lib/tva.js';
const COPIE = 'supabase/functions/tva/tva.js';
const EDGE = 'supabase/functions/tva/index.ts';

/* ================================================================== */
console.log('\nLes deux copies de tva.js');
{
  const ok = existsSync(APP) && existsSync(COPIE);
  verifier('les deux fichiers existent', ok, `${APP} et ${COPIE}`);
  if (ok) {
    const a = readFileSync(APP);
    const b = readFileSync(COPIE);
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    verifier('ils sont identiques OCTET POUR OCTET', a.equals(b),
      `premier écart à l'octet ${i} — recopiez : cp ${APP} ${COPIE}`);
  }
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
  verifier('normaliser : majuscules, sans espaces, points, tirets ni espaces insécables',
    N(' fr 91 000.048-009 ') === 'FR91000048009' && N('FR 91 000048009') === 'FR91000048009');
  verifier('…et onze chiffres reçoivent leur « FR »', N('91000048009') === 'FR91000048009');

  const A = (t, s) => T.analyserNumeroTva(t, s).etat;
  const cas = [
    ['', null, 'vide'],
    ['   ', null, 'vide'],
    ['F', null, 'incomplet'],
    ['FR91', null, 'incomplet'],
    ['FR9100004800', null, 'incomplet'],
    ['FR910000480091', null, 'mal_forme'],
    ['DE123456789', null, 'mal_forme'],
    ['FR91A00048009', null, 'mal_forme'],
    ['FR9!000048009', null, 'mal_forme'],
    ['FR00000048009', null, 'cle_fausse'],
    ['fr 91 000 048 009', null, 'pret'],
    ['FRK1000048009', null, 'pret'],
    ['FR0K000048009', null, 'pret'],
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
  verifier('FORME_TVA : FR, deux caractères, neuf chiffres',
    T.FORME_TVA.source === '^FR[0-9A-Z]{2}\\d{9}$');
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
  verifier('POST, MS_UNAVAILABLE / VAT_BLOCKED / IP_BLOCKED → indisponible, jamais refuse',
    ['MS_UNAVAILABLE', 'VAT_BLOCKED', 'IP_BLOCKED', 'SERVICE_UNAVAILABLE'].every(
      (e) => L({ actionSucceed: false, errorWrappers: [{ error: e }] }, N).etat === 'indisponible'));
  verifier('…une saturation mêlée à un blocage → indisponible (on ne réessaie pas un blocage)',
    L({ actionSucceed: false, errorWrappers: [{ error: 'MS_MAX_CONCURRENT_REQ' }, { error: 'IP_BLOCKED' }] }, N).etat === 'indisponible');
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
  verifier('un autre pays → indisponible', L({ ...postValide, countryCode: 'DE' }, N).etat === 'indisponible');
  verifier('une date de VIES illisible n’est pas inventée : vies_le vaut null',
    L({ ...postValide, requestDate: '20/10/2026' }, N).vies_le === null
    && L({ ...postValide, requestDate: '2026-10-20' }, N).vies_le === null);
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
  verifier('autre_siren ne dit rien du SIREN ; sans_compte, sans_entreprise, indisponible : rien',
    ['autre_siren', 'sans_compte', 'sans_entreprise', 'indisponible', 'mal_forme', 'cle_fausse'].every(
      (i) => egal(R({ issue: i, siren: '000048009', numero: 'FR' }), { issue: i })));
  verifier('les issues du serveur, les dix',
    T.ISSUES_TVA_SERVEUR.length === 10 && T.ISSUES_TVA.length === 13
    && ['reseau', 'lent', 'service_indisponible'].every((i) => T.ISSUES_TVA.includes(i) && !T.ISSUES_TVA_SERVEUR.includes(i)));

  const P = T.ligneDePreuveTva;
  const ligne = P({ pro_id: 'u', siren: '000048009', numero: 'FR91000048009', vies_le: '2026-10-20T13:51:00.982Z' });
  verifier('la ligne de preuve : cinq colonnes, source « vies », et PAS de reconnu_le (la base la pose)',
    egal(Object.keys(ligne || {}).sort(), ['numero', 'pro_id', 'siren', 'source', 'vies_le']) && ligne.source === 'vies');
  verifier('…et aucune ligne pour un numéro qui ne désigne pas ce SIREN, ou mal formé',
    P({ pro_id: 'u', siren: '000048017', numero: 'FR91000048009' }) === null
    && P({ pro_id: 'u', siren: '000048009', numero: 'FR9100004800' }) === null
    && P({ pro_id: null, siren: '000048009', numero: 'FR91000048009' }) === null);
}

/* ================================================================== */
console.log('\nLes mots — chaque message est FAIT TOURNER');
{
  const etats = ['vide', 'incomplet', 'mal_forme', 'cle_fausse', 'autre_siren'];
  const issues = [...T.ISSUES_TVA, 'issue_que_cette_version_ne_connait_pas'];
  const textes = [...etats, ...issues].map((i) => [i, T.messageTva(i, { siren: '000048009', reessayer_a: '2026-10-20T15:00:00.000Z', portee: 'compte' }).texte]);
  const vides = textes.filter(([, t]) => !t || t.length < 30);
  verifier('chaque état et chaque issue a sa phrase (et « pret » n’en a pas)',
    vides.length === 0 && T.messageTva('pret').texte === null, vides.map(([i]) => i).join(', '));
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
  const nEstPasEnCause = ['indisponible', 'reseau', 'service_indisponible', 'trop_d_essais'];
  verifier('VIES ou le réseau n’ont pas répondu : le numéro n’est JAMAIS accusé',
    nEstPasEnCause.every((i) => T.messageTva(i, {}).texte.includes('n’est pas en cause')));
  verifier('« lent » ne promet PAS que rien n’a changé (la réponse a pu arriver après notre départ)',
    !/rien n.a chang/.test(T.messageTva('lent').texte));
  verifier('« refuse » renvoie au service des impôts des entreprises, et à la franchise',
    /service des impôts des entreprises/.test(T.messageTva('refuse').texte)
    && /franchise en base de TVA/.test(T.messageTva('refuse').texte));
  verifier('trop_d_essais : la portée dit LAQUELLE des deux limites',
    T.messageTva('trop_d_essais', { portee: 'service' }).texte !== T.messageTva('trop_d_essais', { portee: 'compte' }).texte);
  verifier('les actions sont « corriger », « reessayer » ou rien',
    [...etats, ...issues].every((i) => [null, 'corriger', 'reessayer'].includes(T.messageTva(i, {}).action)));
}

/* ================================================================== */
console.log('\nLes limites, les essais, les origines');
{
  verifier('6 appels par heure et par compte, 20 par minute pour tout Opus',
    T.LIMITES_TVA.compte.max === 6 && T.LIMITES_TVA.compte.duree_ms === 3600000
    && T.LIMITES_TVA.global.max === 20 && T.LIMITES_TVA.global.duree_ms === 60000);
  verifier('4 essais, 3 s de pause, 20 s par essai, 45 s en tout',
    egal({ ...T.ESSAIS_VIES }, { max: 4, pause_ms: 3000, delai_ms: 20000, budget_ms: 45000 }));
  verifier('…un essai seul tient dans le budget (sinon aucun ne partirait)',
    T.ESSAIS_VIES.delai_ms <= T.ESSAIS_VIES.budget_ms);
  verifier('debutDeFenetre : la même que celle du SIRET',
    [0, 1792000000000, 1792000059999, 1792003599999].every((t) =>
      T.debutDeFenetre(t, 60000) === S.debutDeFenetre(t, 60000)
      && T.debutDeFenetre(t, 3600000) === S.debutDeFenetre(t, 3600000)));
  const origines = [null, '', 'https://opus-project.com', 'https://www.opus-project.com', 'HTTPS://OPUS-PROJECT.COM',
    'http://localhost:8081', 'http://127.0.0.1', 'https://opus-project.com.evil.example', 'https://evil.example',
    'http://localhost.evil.example', 'null'];
  verifier('origineAutorisee : la MÊME règle que la fonction siret, sur onze origines',
    egal([...T.ORIGINES_AUTORISEES], [...S.ORIGINES_AUTORISEES])
    && origines.every((o) => T.origineAutorisee(o) === S.origineAutorisee(o)));
}

/* ================================================================== */
const verifierEdge = () => {
  console.log('\nLa fonction Edge — l’ordre, les en-têtes, ce qui sort');
  if (!existsSync(EDGE)) { verifier('la fonction Edge existe', false, EDGE); return; }
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
  const i0 = code.indexOf('Deno.serve(');
  const iT = code.indexOf('async function traiter(');
  verifier('elle répond par Deno.serve, qui appelle `traiter()`', i0 >= 0 && iT >= 0 && iT < i0);
  const corps = iT >= 0 && i0 > iT ? code.slice(iT, i0) : '';
  const serve = i0 >= 0 ? code.slice(i0) : '';

  verifier('elle importe ./tva.js — le même code que l’écran — et supabase-js comme `siret`',
    /from '\.\/tva\.js'/.test(code) && code.includes("from 'npm:@supabase/supabase-js@2.58.0'")
    && lire('supabase/functions/siret/index.ts').includes("from 'npm:@supabase/supabase-js@2.58.0'"));

  /* L'ORDRE. */
  const pos = [
    ['la forme et la clé', corps.search(/analyserNumeroTva\(demande/)],
    ['l’appelant', corps.search(/await appelant\(admin,/)],
    ['l’entreprise active', corps.search(/from\('entreprise_registre'\)\s*\.select\(/)],
    ['le SIREN', corps.search(/analyserNumeroTva\(numero,\s*entreprise\.siren\)/)],
    ['la preuve récente', corps.search(/from\('preuves_tva'\)\s*\.select\(/)],
    ['la limite par compte', corps.search(/rpc\('compter_appel_siret',\s*\{\s*p_cle:\s*`tva-compte:\$\{moi\}`/)],
    ['la limite pour tous', corps.search(/rpc\('compter_appel_siret',\s*\{\s*p_cle:\s*'tva-global'/)],
    ['VIES', corps.search(/await essaiVies\(/)],
    ['la preuve écrite', corps.search(/from\('preuves_tva'\)\s*\.upsert\(/)],
  ];
  const absents = pos.filter(([, p]) => p < 0).map(([n]) => n);
  verifier('les neuf étapes sont là', absents.length === 0, `absentes : ${absents.join(', ')}`);
  const desordre = pos.slice(1).filter(([, p], k) => p >= 0 && pos[k][1] >= 0 && p < pos[k][1]);
  verifier('…et dans l’ordre : forme → appelant → entreprise → SIREN → preuve récente → limites → VIES → preuve',
    absents.length === 0 && desordre.length === 0,
    desordre.map(([n]) => `« ${n} » arrive trop tôt`).join(' ; '));
  verifier('l’entreprise lue est l’ACTIVE, celle de l’appelant, et un numéro publié l’emporte',
    /\.eq\('pro_id',\s*moi\)\s*\.is\('retiree_le',\s*null\)/.test(corps)
    && /if \(entreprise\.tva\) return await repondre\(\{\s*issue:\s*'deja_publie'/.test(corps)
    && /if \(!moi\) return await repondre\(\{\s*issue:\s*'sans_compte'\s*\}\)/.test(corps));
  verifier('la preuve récente : CE numéro, CE SIREN, CET appelant, source « vies », moins de 24 h',
    /from\('preuves_tva'\)\s*\.select\('numero, reconnu_le'\)\s*\.eq\('pro_id',\s*moi\)\s*\.eq\('numero',\s*numero\)\s*\.eq\('siren',\s*entreprise\.siren\)\s*\.eq\('source',\s*'vies'\)\s*\.gt\('reconnu_le'/.test(corps)
    && /FRAICHEUR_PREUVE_MS = 24 \* 60 \* 60 \* 1000;/.test(code));

  /* CE QUI SORT. */
  const appelsJson = [...code.matchAll(/(?<![.\w])json\(([^)]{0,40})/g)].map((x) => x[1]);
  const horsPorte = appelsJson.filter((a) => a !== 'corps' && !/^\{\s*error:/.test(a));
  verifier('toute issue sort par `repondre` → reponsePubliqueTva → HTTP 200',
    horsPorte.length === 0 && /const corps = reponsePubliqueTva\(resultat\);/.test(code)
    && !/json\(\{\s*issue/.test(code), `appels hors porte : ${horsPorte.join(' | ')}`);
  verifier('reconnu : la ligne de tva.js, un upsert sur le compte, et la date que la BASE a posée',
    /ligneDePreuveTva\(\{\s*pro_id:\s*moi,\s*siren:\s*entreprise\.siren,\s*numero,/.test(corps)
    && /\.upsert\(ligne,\s*\{\s*onConflict:\s*'pro_id'\s*\}\)\s*\.select\('numero, reconnu_le'\)\s*\.single\(\)/.test(corps)
    && /issue:\s*'reconnu',\s*numero:\s*preuve\.numero,\s*reconnu_le:\s*preuve\.reconnu_le/.test(corps));
  verifier('refuse : la preuve de CE numéro, et d’aucun autre, est retirée — et un échec est une panne',
    /from\('preuves_tva'\)\.delete\(\)\.eq\('pro_id',\s*moi\)\.eq\('numero',\s*numero\)/.test(corps)
    && /if \(retiree\.error\) return panne\(/.test(corps)
    && (corps.match(/\.delete\(\)/g) || []).length === 1);
  /* La saturation, et elle seule, déclenche un nouvel essai. */
  verifier('VIES : un nouvel essai après une SATURATION seulement, et dans le budget',
    /if \(lu\.etat !== 'sature'\) break;/.test(corps)
    && /ESSAIS_VIES\.budget_ms\) break;/.test(corps) && /n <= ESSAIS_VIES\.max/.test(corps));
  verifier('…et ce qui n’est ni reconnu, ni refusé, ni mal formé rend `indisponible`',
    /return await repondre\(\{\s*issue:\s*'indisponible'\s*\}\);\s*\}\s*catch/.test(corps));

  /* L'APPEL À VIES. */
  verifier('VIES : le point d’entrée DOCUMENTÉ, en POST, pays FR et le numéro sans son « FR »',
    /const VIES = 'https:\/\/ec\.europa\.eu\/taxation_customs\/vies\/rest-api\/check-vat-number';/.test(code)
    && /method:\s*'POST'/.test(code)
    && /JSON\.stringify\(\{\s*countryCode:\s*'FR',\s*vatNumber:\s*numero\.slice\(2\)\s*\}\)/.test(code));
  const fetchs = [...code.matchAll(/headers:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  verifier('aucun en-tête du téléphone ne repart : User-Agent, Accept, Content-Type, écrits à la main',
    fetchs.some((h) => /'User-Agent':\s*USER_AGENT/.test(h) && /Accept:\s*'application\/json'/.test(h)
      && /'Content-Type':\s*'application\/json'/.test(h) && !/req\./.test(h)));
  const lectures = [...code.matchAll(/req\.headers\.get\('([^']+)'\)/g)].map((m) => m[1]).sort();
  verifier('elle ne lit QUE Origin et Authorization (jamais X-Forwarded-For)',
    egal([...new Set(lectures)], ['Authorization', 'Origin']) && !/forwarded/i.test(code), lectures.join(', '));
  verifier('un délai par essai (AbortController), annulé dans `finally`',
    /new AbortController\(\)/.test(code) && /setTimeout\(\(\) => controle\.abort\(\), delaiMs\)/.test(code)
    && /finally\s*\{\s*clearTimeout\(minuteur\);/.test(code));
  verifier('le nom et l’adresse de VIES ne sont jamais lus par la fonction',
    !/\.(name|address)\b/.test(code.replace(/data\.user/g, '')));

  /* LES COMPTEURS. */
  const cles = [...code.matchAll(/p_cle:\s*([`'][^`']*[`'])/g)].map((m) => m[1]);
  verifier('ses compteurs sont préfixés `tva-` : jamais ceux du SIRET',
    cles.length === 2 && cles.every((c) => /^[`']tva-/.test(c)), cles.join(', '));
  const iCompte = corps.indexOf('compte = true');
  verifier('la purge : après un appel COMPTÉ seulement, et sur les seuls compteurs `tva-`',
    /let compte = false;/.test(corps) && /if \(compte\) await purger\(admin\)/.test(corps)
    && (code.match(/await purger\(admin\)/g) || []).length === 1
    && iCompte > pos[4][1] && iCompte < pos[5][1]
    && /from\('siret_limites'\)\s*\.delete\(\)\s*\.like\('cle',\s*'tva-%'\)\s*\.lt\('fenetre'/.test(code)
    && !/delete from/i.test(code));
  verifier('POST seulement, et la clé de service ne vient que de l’environnement',
    /req\.method !== 'POST'/.test(corps) && /Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/.test(corps));

  /* L'ORIGINE. */
  verifier('plus d’étoile : l’origine renvoyée est celle de la requête, si elle est permise',
    !/Access-Control-Allow-Origin'?\s*:\s*'\*'/.test(code)
    && /'Access-Control-Allow-Origin':\s*origine/.test(code) && /Vary:\s*'Origin'/.test(code));
  verifier('…et une origine inconnue est refusée AVANT le travail',
    /const origine = req\.headers\.get\('Origin'\)/.test(serve)
    && /origineAutorisee\(origine\)\s*\?\s*await traiter\(req\)\s*:\s*json\(\{\s*error:[^}]*\},\s*403\)/.test(serve)
    && (code.match(/traiter\(req\)/g) || []).length === 1);
  verifier('elle ne nomme ni `emetteur` ni les tarifs (la liste fermée de la section 46)',
    !/\b(tarifs_pro|emetteur_assurances|emetteur)\b/.test(code));
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
  verifier('la forme du numéro, la même des deux côtés, et les 9 chiffres = le SIREN',
    schema.includes("check (numero ~ '^FR[0-9A-Z]{2}[0-9]{9}$' and substr(numero, 5) = siren)"));
  verifier('la clé chiffrée : la même formule que tva.js',
    /substr\(numero, 3, 2\)::int = \(12 \+ 3 \* \(siren::bigint % 97\)\) % 97/.test(schema));
  verifier('la source : « vies » ou « essai », rien d’autre',
    /add constraint preuve_tva_source_check\s*check \(source in \('vies', 'essai'\)\)/.test(schema));
  const declencheur = (schema.match(/function public\.tient_la_preuve_tva\(\)[\s\S]*?\$\$;/) || [''])[0];
  verifier('la date du contrôle est posée par la BASE, à l’insertion comme à la mise à jour',
    /new\.reconnu_le := clock_timestamp\(\);/.test(declencheur)
    && /before insert or update on public\.preuves_tva/.test(schema));
  const politiques = [...schema.matchAll(/create policy "[^"]+" on public\.preuves_tva\s+for (\w+)/g)].map((m) => m[1]);
  verifier('UNE politique, en lecture : aucun client n’écrit une preuve', egal(politiques, ['select']), politiques.join(', '));
  verifier('…lue par est_mon_entreprise(), pour les connectés',
    /on public\.preuves_tva\s+for select to authenticated\s+using \(public\.est_mon_entreprise\(pro_id\)\);/.test(schema));
  verifier('…et les droits de table : rien pour anon, la lecture seule pour les connectés',
    /revoke all on public\.preuves_tva from anon;/.test(schema)
    && /revoke insert, update, delete, truncate on public\.preuves_tva from authenticated;/.test(schema));
  verifier('la preuve part avec la fiche (cascade)',
    /pro_id\s+uuid primary key references public\.professional_profiles\(id\) on delete cascade/.test(table));

  /* emetteur_incomplet : la preuve ne compte que pour le SIREN ACTIF. */
  const incomplet = (schema.match(/function public\.emetteur_incomplet\(p_pro uuid\)[\s\S]*?\$\$;/) || [''])[0];
  verifier('emetteur_incomplet lit la preuve du SIREN ACTIF seulement',
    /left join public\.preuves_tva v on v\.pro_id = moi\.id and v\.siren = r\.siren/.test(incomplet));
  verifier('…et ne réclame le numéro qu’au réel, sans numéro publié NI preuve',
    /case when e\.regime_tva = 'reel' and r\.id is not null and r\.tva is null and v\.pro_id is null\s+then 'conso_tva_intra: /.test(incomplet));
  verifier('l’export RGPD la contient',
    /'mon_numero_de_tva',\s*\(select to_jsonb\(x\) from public\.preuves_tva x where x\.pro_id = auth\.uid\(\)\)/.test(schema));
  const f = schema.match(/function public\.compter_appel_siret\(\s*([\s\S]*?)\)\s*returns\s+boolean/);
  verifier('compter_appel_siret(p_cle, p_fenetre, p_max) — les noms qu’appelle la fonction',
    !!f && egal(f[1].split(',').map((x) => x.trim().split(/\s+/)[0]), ['p_cle', 'p_fenetre', 'p_max']));
  verifier('la table naît AVANT l’export RGPD et le balayage des portes (section 43)',
    schema.indexOf('create table if not exists public.preuves_tva') < schema.indexOf('create or replace function public.mes_donnees()')
    && schema.indexOf('create or replace trigger trg_tient_la_preuve_tva') < schema.lastIndexOf('do $portes$'));
};

/* ================================================================== */
const verifierApplication = () => {
  console.log('\nL’application — l’appel, l’écran, les textes');
  const api = sansCommentaires(lire('src/lib/api.js'));
  const corps = (code, debut) => {
    const i = code.indexOf(debut);
    if (i < 0) return '';
    const j = code.indexOf('\nasync function ', i + debut.length);
    const k = code.indexOf('\nexport const ', i + debut.length);
    const fin = [j, k].filter((x) => x > i).sort((a, b) => a - b)[0];
    return code.slice(i, fin > i ? fin : undefined);
  };
  const sup = corps(api, 'async function controlerTvaSupabase(');
  verifier('l’appel : la fonction `tva`, le numéro SEUL, sous sa forme normale',
    /functions\.invoke\('tva',\s*\{\s*body:\s*\{\s*numero:\s*analyserNumeroTva\(numero\)\.numero\s*\},/.test(sup));
  verifier('…un délai qui laisse finir les essais du serveur (45 s) : budget + 15 s',
    /export const DELAI_CONTROLE_TVA_MS = ESSAIS_VIES\.budget_ms \+ 15000;/.test(api)
    && /timeout:\s*DELAI_CONTROLE_TVA_MS/.test(sup));
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
  verifier('`monEmetteur` lit la preuve avec le reste de la fiche',
    /from\('preuves_tva'\)\.select\('siren, numero, reconnu_le'\)/.test(corps(api, 'async function monEmetteurSupabase(')));

  const ecran = sansCommentaires(lire('src/components/SaisieTva.js'));
  verifier('l’écran dit ce que la fonction dit : `messageTva` et `analyserNumeroTva`, rien d’écrit à la main',
    /messageTva\(r\.issue,/.test(ecran) && /analyserNumeroTva\(texte,\s*entreprise\.siren\)/.test(ecran));
  verifier('…un seul contrôle à la fois : le garde du vol, dans une référence',
    /if \(!pret \|\| enVol\.current\) return;/.test(ecran) && /enVol\.current = true;/.test(ecran));
  verifier('…et il dit ce qui part, avant le geste : « Seul ce numéro est envoyé à VIES »',
    /Seul ce numéro est envoyé à VIES/.test(ecran));
  verifier('…sans rien afficher quand l’annuaire publie déjà un numéro',
    /if \(!entreprise \|\| entreprise\.tva\) return null;/.test(ecran));
  const me = sansCommentaires(lire('src/components/MonEntreprise.js'));
  verifier('« Mon entreprise » ne propose le contrôle qu’une fois la fiche LUE',
    /onControlerTva=\{donnees\.etat === 'pret' \? controlerTva : null\}/.test(me));

  const legal = lire('src/data/legal.js');
  const version = (legal.match(/export const VERSION = '(\d{4}-\d{2}-\d{2})';/) || [])[1] || '';
  verifier('les conditions ont changé de version (un destinataire nouveau est un changement de fond)',
    version >= '2026-10-20', version);
  const section = (titre) => {
    const i = legal.indexOf(`titre: '${titre}'`);
    if (i < 0) return '';
    const j = legal.indexOf('titre:', i + 10);
    return legal.slice(i, j > i ? j : undefined).replace(/'\s*\+\s*'/g, '');
  };
  const dest = section('À qui vos données sont transmises');
  const phraseVies = (dest.match(/VIES \(ec\.europa\.eu\)[^.]*\.[^.]*\./) || [''])[0];
  verifier('« À qui vos données sont transmises » nomme VIES, ce qui part, et ce qui n’est pas gardé',
    /seul ce numéro y est envoyé/.test(phraseVies) && /jamais le nom ni l’adresse/.test(phraseVies),
    phraseVies.slice(0, 160));
  verifier('« Ce que nous collectons » dit le numéro écrit et la date de VIES',
    /celui que vous écrivez vous-même, et la date à laquelle VIES/.test(section('Ce que nous collectons')));
  verifier('« Une décision automatique » dit qui peut changer la réponse de VIES',
    /VIES[\s\S]*service des impôts des entreprises/.test(section('Une décision automatique, et comment la faire revoir')));
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
  verifierPaquet();
} catch (e) {
  echecs += 1;
  console.error(`  ✘ le contrôle a planté : ${e && e.stack}`);
}
console.log(echecs ? `\n${echecs} échec(s).` : '\nTout est en ordre.');
process.exit(echecs ? 1 : 0);
