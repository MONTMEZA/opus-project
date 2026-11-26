/**
 * LE JUGE DES ESSAIS SQL, ÉPROUVÉ SANS BASE — relecture de 2c-E (26/11/2026).
 *
 *   npm run verifier-juge-sql
 *
 * POURQUOI IL MANQUAIT
 * --------------------
 * `npm run essais-sql` (scripts/jouer-essais-sql.mjs) juge les essais de
 * `supabase/` contre leur oracle figé. Mais RIEN ne jugeait le juge : un
 * `return 1` du bilan changé en `return 0` laissait GitHub vert avec un
 * essai rouge (mesuré : « ✘ 1 essai(s) sur 1… » imprimé, code 0), et
 * `npm run verifier` restait à 56 sur 56. Les 47 sabotages du constructeur
 * avaient été joués UNE fois, dans son dossier de travail. C'est la règle de
 * CLAUDE.md « un contrôle se vérifie en cassant ce qu'il surveille »,
 * appliquée une fois et pas tenue (C4).
 *
 * CE QU'IL FAIT
 * -------------
 * Il FAIT TOURNER les fonctions pures du script — `lireSource`,
 * `normaliseur`, `analyser`, `juger`, `auditer`, `lireAttendus`,
 * `comparer`, `verdictPropre`, `gardesDeFiger`, `codeDuBilan`,
 * `ecartsDeLaListe` — sur une sortie de psql FIGÉE ci-dessous, puis sur
 * cette sortie abîmée d'une seule chose à la fois. Et il lance le VRAI script
 * cinq fois, sans base (une option inconnue, un nom sous CI, `--comme-github`
 * avec un nom, un lancement par un LIEN, une liste qui ne correspond plus).
 *
 * Il ne demande pas PostgreSQL : son nom commence par `verifier-`, il tourne
 * dans `npm run verifier`, partout. (Ce n'est PAS `verifier-essais-sql`, que
 * verifier-atelier refuse à dessein : un contrôle qui LANCERAIT les essais
 * aurait besoin d'une base.)
 */
import { spawnSync } from 'node:child_process';
import {
  copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ESSAIS, HORS_LISTE, PARITES, ORACLE, DOSSIER_ATTENDUS,
  analyser, auditer, casDeLaSortie, codeDuBilan, comparer, ecartsDeLaListe, essaiVersTexte, gardesDeFiger,
  juger, lireAttendus, lireSource, normaliseur, verdictPropre,
} from './jouer-essais-sql.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(RACINE, 'scripts', 'jouer-essais-sql.mjs');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* ==========================================================================
   LA SORTIE FIGÉE — un essai de démonstration, et ce que psql en rend
   (VERBOSITY=verbose, NULL affiché ∅, comme `jouer-essais-sql` le lance)
   ========================================================================== */
const NOM = 'essais-demo';
const ENTREE = { nom: NOM, raison: 'démonstration', annonce: { motif: /FIN — (\d+) refus attendus/ } };
/* Ses dates sont ÉCRITES (le titre, la version des conditions, le
   commentaire) : la normalisation ne doit jamais les toucher. */
const SOURCE = [
  '-- Un essai de démonstration, qui n’existe que dans verifier-juge-sql',
  '-- (relevé le 30/10/2026). Ses dates sont écrites : jamais normalisées.',
  "\\set A 'aaaa0000-0000-4000-8000-00000000aaaa'",
  "\\echo '=== 1. Le rognage du nom (lot du 30/10/2026) ==='",
  "select true as rogne_attendu_t, 'SCI du Moulin' as nom, 2 as compte, null as rien_attendu_null;",
  "\\echo '--- 2. Un nom vide est refusé (attendu : ERROR 23514)'",
  "insert into public.clients (pro_id, nom) values (:'A', '');",
  "\\echo '--- 3. La version gardée « 2026-10-15 », et la date que pose la base'",
  "select '2026-10-15' as cgu_version, now() as cree_le, :'A' as proprietaire;",
  "\\echo '=== FIN — 1 refus attendus ==='",
  '',
].join('\n');

/* `base` : l'horodatage que la base pose (now()), le jour du passage. */
const sortie = ({ base = '2026-11-26 03:25:08.074609+00', cgu = '2026-10-15' } = {}) => [
  '=== 1. Le rognage du nom (lot du 30/10/2026) ===',
  ' rogne_attendu_t |      nom      | compte | rien_attendu_null ',
  '-----------------+---------------+--------+-------------------',
  ' t               | SCI du Moulin |      2 | ∅',
  '(1 row)',
  '',
  '--- 2. Un nom vide est refusé (attendu : ERROR 23514)',
  'BEGIN',
  'psql:supabase/essais-demo.sql:7: ERROR:  23514: new row for relation "clients" violates check constraint "client_nom_check"',
  `DETAIL:  Failing row contains (3f2b8c1e-9a4d-4e2f-8b1a-2c3d4e5f6a7b, aaaa0000-0000-4000-8000-00000000aaaa, ${base}).`,
  'SCHEMA NAME:  public',
  'TABLE NAME:  clients',
  'CONSTRAINT NAME:  client_nom_check',
  'LOCATION:  ExecConstraints, execMain.c:2032',
  'ROLLBACK',
  '--- 3. La version gardée « 2026-10-15 », et la date que pose la base',
  ' cgu_version |            cree_le            |             proprietaire             ',
  '-------------+-------------------------------+--------------------------------------',
  ` ${cgu}  | ${base} | aaaa0000-0000-4000-8000-00000000aaaa`,
  '(1 row)',
  '',
  '=== FIN — 1 refus attendus ===',
  '',
].join('\n');

/* L'ORACLE FIGÉ de cette sortie, tel que `--figer` l'écrirait — écrit EN DUR :
   s'il dérive, c'est que la façon d'écrire un oracle a changé. */
const ORACLE_FIGE = [
  '# Ce que doit rendre supabase/essais-demo.sql, joué par `npm run essais-sql`',
  '# (scripts/jouer-essais-sql.mjs). ENGENDRÉ par',
  "# `npm run essais-sql -- --figer essais-demo` : ne s'écrit pas à la main. Un changement",
  '# se relit dans le diff — [sortie] est la sortie de psql, normalisée, ligne à',
  '# ligne —, puis se commite avec sa raison. Le compte d’erreurs figé ici doit',
  '# rester celui que l’essai ANNONCE quand il en annonce un.',
  `oracle: ${ORACLE}`,
  'essai: essais-demo',
  '',
  '[partie essai]',
  'erreurs: 1',
  'valeurs-jugees: 2',
  '[erreurs]',
  '| @ --- 2. Un nom vide est refusé (attendu : ERROR 23514)',
  '|   23514 new row for relation "clients" violates check constraint "client_nom_check"',
  '[valeurs]',
  '| rogne_attendu_t = t',
  '| rien_attendu_null = ∅',
  '[sortie]',
  '| === 1. Le rognage du nom (lot du 30/10/2026) ===',
  '| rogne_attendu_t | nom | compte | rien_attendu_null',
  '| ----',
  '| t | SCI du Moulin | 2 | ∅',
  '| (1 row)',
  '|',
  '| --- 2. Un nom vide est refusé (attendu : ERROR 23514)',
  '| BEGIN',
  '| ERREUR 23514 new row for relation "clients" violates check constraint "client_nom_check"',
  '| ROLLBACK',
  '| --- 3. La version gardée « 2026-10-15 », et la date que pose la base',
  '| cgu_version | cree_le | proprietaire',
  '| ----',
  '| 2026-10-15 | <horodatage> | aaaa0000-0000-4000-8000-00000000aaaa',
  '| (1 row)',
  '|',
  '| === FIN — 1 refus attendus ===',
  '',
].join('\n');

const source = lireSource(SOURCE);
const juge = (texte, jour = '2026-11-26') => analyser(texte, source, ENTREE, normaliseur(source, jour));
const run = (texte, code = 0) => ({ code, delaiDepasse: false, texte });
const attendu = lireAttendus(ORACLE_FIGE).parties.essai;
const ecarts = (texte, jour) => comparer(NOM, juge(texte, jour), attendu);
const propres = (texte, jour) => verdictPropre(ENTREE, source, run(texte), juge(texte, jour));

console.log('\nLe juge rend « juste » sur la sortie qu’il a figée');
{
  const r = juge(sortie());
  verifier('l’oracle s’écrit EXACTEMENT comme figé ici (essaiVersTexte, puis lireAttendus)',
    essaiVersTexte(NOM, r) === ORACLE_FIGE,
    'la façon d’écrire un oracle a changé : c’est un changement d’ORACLE (monter ORACLE, `--figer --oracle`)');
  verifier('lireAttendus relit sa version, son essai, son erreur, ses deux valeurs, ses 17 lignes de sortie',
    lireAttendus(ORACLE_FIGE).entete.oracle === String(ORACLE) && lireAttendus(ORACLE_FIGE).entete.essai === NOM
      && attendu.erreurs.length === 1 && attendu.erreurs[0].cas === '--- 2. Un nom vide est refusé (attendu : ERROR 23514)'
      && attendu.valeurs.length === 2 && attendu.sortie.length === 17);
  verifier('comparer ne trouve rien, et le verdict propre non plus', ecarts(sortie()).length === 0 && propres(sortie()).length === 0,
    [...ecarts(sortie()), ...propres(sortie())].join(' / '));
  verifier('l’UUID tiré au hasard devient <uuid>, celui que l’essai nomme reste',
    !r.erreurs[0].signature.includes('3f2b8c1e') && r.projection.some((l) => l.includes('aaaa0000-0000-4000-8000-00000000aaaa')));
}

console.log('\nUne seule chose abîmée à la fois — chacune rougit, par la bonne vérification');
{
  /* Une erreur de PLUS, dans le cas 3. */
  const deux = sortie().replace('--- 3. La version gardée', [
    "psql:supabase/essais-demo.sql:8: ERROR:  23505: duplicate key value violates unique constraint \"clients_pkey\"",
    'LOCATION:  _bt_check_unique, nbtinsert.c:666',
    '--- 3. La version gardée',
  ].join('\n'));
  const e = ecarts(deux);
  verifier('une erreur de plus : « 2 erreur(s) au lieu de 1 », au bon cas',
    e.some((p) => /^2 erreur\(s\) au lieu de 1\. Premier écart, dans le cas « --- 2\. Un nom vide/.test(p)), e.join(' / '));
  verifier('…et le compte que l’essai ANNONCE la refuse aussi', propres(deux).some((p) => /l’essai annonce 1 refus, il en a rendu 2/.test(p)),
    propres(deux).join(' / '));
  /* Une erreur de MOINS. */
  const zero = sortie().replace(/psql:supabase\/essais-demo\.sql:7: ERROR:[\s\S]*?LOCATION: [^\n]*\n/, '');
  verifier('une erreur de moins : « 0 erreur(s) au lieu de 1 »', ecarts(zero).some((p) => /^0 erreur\(s\) au lieu de 1/.test(p)));
  /* Une cellule jugée fausse. */
  const faux = sortie().replace(' t               | SCI du Moulin', ' f               | SCI du Moulin');
  verifier('une valeur jugée fausse : « la valeur `rogne_attendu_t` vaut « f » »',
    propres(faux).includes('la valeur `rogne_attendu_t` vaut « f »'), propres(faux).join(' / '));
  verifier('…et la valeur figée a changé', ecarts(faux).some((p) => /la valeur jugée n° 1 a changé/.test(p)));
  /* Une ligne de sortie changée (une colonne qui n'est pas un verdict). */
  const ligne = sortie().replace('| SCI du Moulin |', '| SCI du Moulon |');
  verifier('une ligne changée : « la sortie a changé, ligne 4 »',
    ecarts(ligne).some((p) => /^la sortie a changé, ligne 4 : attendu « t \| SCI du Moulin \| 2 \| ∅ », reçu « t \| SCI du Moulon/.test(p)),
    ecarts(ligne).join(' / '));
  /* Une erreur de l'OUTIL (psql), pas de l'essai. */
  const outil = sortie().replace('ROLLBACK\n', 'ROLLBACK\npsql:supabase/essais-demo.sql:8: error: no rows returned for \\gset\n');
  verifier('une erreur de l’outil : nommée comme telle', propres(outil).some((p) => /^erreur de l’outil psql, pas de l’essai : « psql: error: no rows returned for \\gset »/.test(p)),
    propres(outil).join(' / '));
  verifier('…et psql qui ne rend pas 0 est un rouge', verdictPropre(ENTREE, source, run(sortie(), 3), juge(sortie())).some((p) => /psql a rendu le code 3/.test(p)));
  /* Un espace de TÊTE dans une valeur (le défaut d'un rognage). */
  const espace = sortie()
    .replace(' rogne_attendu_t |      nom      | compte | rien_attendu_null ', ' rogne_attendu_t |      nom       | compte | rien_attendu_null ')
    .replace('-----------------+---------------+--------+-------------------', '-----------------+----------------+--------+-------------------')
    .replace(' t               | SCI du Moulin |      2 | ∅', ' t               |  SCI du Moulin |      2 | ∅');
  verifier('un espace de tête dans le contenu : rendu visible (␣SCI du Moulin), la sortie a changé',
    ecarts(espace).some((p) => /reçu « t \| ␣SCI du Moulin \| 2 \| ∅ »/.test(p)), ecarts(espace).join(' / '));
  verifier('…et une cellule jugée qui en porte un est fausse', juger('nom_attendu_sci_du_moulin', ' SCI du Moulin') === false
    && juger('nom_attendu_sci_du_moulin', 'SCI du Moulin') === true);
  /* La dernière annonce absente : l'essai s'est arrêté avant sa fin. */
  const coupe = sortie().replace('=== FIN — 1 refus attendus ===\n', '');
  verifier('l’essai coupé avant sa fin : « sa dernière annonce … n’est pas dans la sortie »',
    propres(coupe).some((p) => /sa dernière annonce .* n’est pas dans la sortie/.test(p)));
  /* L'audit des « (attendu : ERROR …) ». */
  const sansRefus = sortie().replace(/psql:supabase\/essais-demo\.sql:7: ERROR:[\s\S]*?LOCATION: [^\n]*\n/, '');
  const a = auditer(sansRefus, source);
  verifier('l’audit : un cas qui annonce une erreur et n’en montre aucune',
    a.annoncees === 1 && a.ko.some((k) => /annonce une erreur, et n’en montre aucune/.test(k)) && auditer(sortie(), source).ko.length === 0);
}

console.log('\nLes dates : celles que l’essai ÉCRIT ne bougent jamais, celles de la base seulement près du passage');
{
  /* L'invariance qui manquait (G1, C1) : un dépôt immobile ne rougit pas un
     autre jour. La base pose sa date le jour du passage, quel qu'il soit. */
  const jours = [['2026-11-26', '2026-11-26 03:25:08.074609+00'], ['2029-11-25', '2029-11-25 05:51:08.123456+00'],
    ['2023-11-27', '2023-11-27 05:51:08.123456+00'], ['2036-11-23', '2036-11-23 05:51:08.123456+00'],
    ['2028-12-31', '2029-01-01 00:00:41.000001+00'],
    /* À UN jour des dates que l'essai écrit : c'est là que la version 1 de
       l'oracle les effaçait (« 2026-10-15 », « 30/10/2026 »). */
    ['2026-10-16', '2026-10-16 09:00:00.000001+00'], ['2026-10-31', '2026-10-31 09:00:00.000001+00']];
  for (const [jour, base] of jours) {
    verifier(`le passage du ${jour} (la base pose ${base.slice(0, 16)}) rend l’oracle figé`, ecarts(sortie({ base }), jour).length === 0,
      ecarts(sortie({ base }), jour).join(' / '));
  }
  /* La contre-épreuve de C1 : la base rend la version + 1 jour. */
  const c1 = ecarts(sortie({ cgu: '2026-10-16' }));
  verifier('la version des conditions rendue d+1 (« 2026-10-16 ») : la sortie a changé',
    c1.some((p) => /attendu « 2026-10-15 \| <horodatage>.*reçu « 2026-10-16 \| <horodatage>/.test(p)), c1.join(' / '));
  /* La contre-épreuve de M1 : la base range la date du jour à la place de la version envoyée. */
  const m1 = ecarts(sortie({ cgu: '2026-11-26' }));
  verifier('la date du jour à la place de la version : <jour> au lieu de « 2026-10-15 », rouge',
    m1.some((p) => /attendu « 2026-10-15 \|.*reçu « <jour> \|/.test(p)), m1.join(' / '));
  /* Une date de la base LOIN du passage : gardée telle quelle, et `--figer` la refuse. */
  const loin = juge(sortie({ base: '2025-10-22 03:25:08.074609+00' }));
  const g = gardesDeFiger(loin, source, attendu);
  verifier('une date de la base à 400 jours du passage : `--figer` la refuse (elle changerait chaque jour)',
    g.some((p) => /« 2025-10-22 03:25:08\.074609\+00 », que l’essai n’écrit pas/.test(p)), g.join(' / '));
  verifier('…et la sortie du jour, elle, se fige', gardesDeFiger(juge(sortie()), source, attendu).length === 0,
    gardesDeFiger(juge(sortie()), source, attendu).join(' / '));
  /* Une date d'aujourd'hui sous une forme que la normalisation ne réduit pas. */
  const auj = juge(sortie().replace('BEGIN', 'BEGIN\n2026/11/26'));
  verifier('« 2026/11/26 » le jour même : `--figer` la refuse', gardesDeFiger(auj, source, attendu, { maintenant: Date.UTC(2026, 10, 26, 12) })
    .some((p) => /hier, d’aujourd’hui ou de demain \(.*2026\/11\/26/.test(p)));
}

console.log('\n`--figer` ne fige pas un essai vidé (C9)');
{
  const vide = analyser('=== essai vide ===\n', lireSource("\\echo '=== essai vide ==='\n"), { nom: NOM }, (s) => s);
  const g = gardesDeFiger(vide, lireSource("\\echo '=== essai vide ==='\n"), attendu);
  verifier('tous ses refus perdus, toutes ses valeurs, tous ses cas : trois refus',
    g.some((p) => /perdu TOUS ses refus \(1 → 0\)/.test(p)) && g.some((p) => /perdu TOUTES ses valeurs jugées \(2 → 0\)/.test(p))
      && g.some((p) => /aucun des 4 cas de l’oracle d’avant ne revient/.test(p)), g.join(' / '));
  /* Un essai qui numérote ses cas « 0. », « 1. » (l'essai 25), sans « --- » :
     ses cas sont ses lignes de texte, pas les tableaux ni les étiquettes. */
  const vingtCinq = ['0. LA DONNEE EXISTE', 'BEGIN', 'INSERT 0 1', 'est_admin | x', '----', 't | f', '(1 row)', '',
    'ERREUR 23514 refus', 'ALTER DEFAULT PRIVILEGES', '1. est_admin : admin / tiers / visiteur', 'appel', '----', 't', '(1 row)'];
  verifier('les cas d’une sortie figée sont ses lignes de texte, même sans « --- » (l’essai 25)',
    JSON.stringify(casDeLaSortie(vingtCinq)) === JSON.stringify(['0. LA DONNEE EXISTE', '1. est_admin : admin / tiers / visiteur']),
    JSON.stringify(casDeLaSortie(vingtCinq)));
  const vingtCinqVide = gardesDeFiger(vide, lireSource("\\echo '=== essai vide ==='\n"), { erreurs: [], valeurs: [], sortie: vingtCinq });
  verifier('…et vidé, il les a tous perdus', vingtCinqVide.some((p) => /aucun des 2 cas de l’oracle d’avant ne revient/.test(p)), vingtCinqVide.join(' / '));
  verifier('…sauf `--accepter-la-perte`, tapé à la main',
    gardesDeFiger(vide, lireSource("\\echo '=== essai vide ==='\n"), attendu, { accepterLaPerte: true }).length === 0);
}

console.log('\nLe code de sortie (le bilan)');
{
  const c = (o) => codeDuBilan(o).code;
  verifier('un essai rouge : 1', c({ rouges: 1, joues: 38, total: 38, ci: true }) === 1 && c({ rouges: 1, joues: 1, total: 38, ci: false }) === 1);
  verifier('tout juste, complet : 0', c({ rouges: 0, joues: 38, total: 38, ci: true }) === 0 && c({ rouges: 0, joues: 38, total: 38, ci: false }) === 0);
  verifier('sous CI, un passage PARTIEL : un rouge (C3)', c({ rouges: 0, joues: 1, total: 38, ci: true }) === 1
    && /Sous CI, le passage doit jouer les 38 entrées : il en a joué 1/.test(codeDuBilan({ rouges: 0, joues: 1, total: 38, ci: true }).phrase));
  verifier('à la main, un passage partiel : 0, et il le DIT', c({ rouges: 0, joues: 1, total: 38, ci: false }) === 0
    && /1 sur 38 joués : ce n’est PAS le passage complet/.test(codeDuBilan({ rouges: 0, joues: 1, total: 38, ci: false }).phrase));

  /* La COLLE du bilan dans `principal()`, comparée entière : c'est elle qui
     rend le code de `codeDuBilan`. Un `return 0` glissé là ne se verrait pas
     autrement sans base. */
  const texte = readFileSync(SCRIPT, 'utf8');
  const debut = texte.indexOf('  /* 8. LE BILAN.');
  const fin = texte.indexOf('\n}\n', debut);
  const colle = debut < 0 || fin < 0 ? '' : texte.slice(debut, fin).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  const COLLE = 'const total = ESSAIS.length + PROCEDURES_A_DEUX.length + PARITES.length; const nonCommites = ceQuiNEstPasCommite(); '
    + 'if (nonCommites && nonCommites.length) { console.log(`\\n ⚠ ${nonCommites.length} fichier(s) lu(s) par les essais ne sont pas commités — GitHub jouera la version COMMITÉE :`); '
    + 'nonCommites.slice(0, 12).forEach((l) => console.log(` ${l}`)); console.log(\' Après le commit, avant l’envoi : `npm run essais-sql -- --comme-github`.\'); } '
    + 'const bilan = codeDuBilan({ rouges, joues, total, ci: !!process.env.CI }); if (bilan.code !== 0) { console.error(`\\n${bilan.phrase}`); '
    + 'console.error(` Les sorties brutes : ${sorties}\\n`); return bilan.code; } if (propreSorties) rmSync(sorties, { recursive: true, force: true }); '
    + 'console.log(`\\n${bilan.phrase}\\n`); return bilan.code;';
  verifier('la fin de `principal()` rend le code de `codeDuBilan`, et rien d’autre (forme figée)', colle === COLLE,
    `reçu : ${colle.slice(0, 300)}…`);
}

console.log('\nLa liste fermée, sur un dossier temporaire (C8)');
{
  const d = mkdtempSync(join(tmpdir(), 'opus-juge-liste-'));
  try {
    mkdirSync(join(d, DOSSIER_ATTENDUS), { recursive: true });
    for (const e of [...ESSAIS, ...HORS_LISTE]) writeFileSync(join(d, 'supabase', `${e.nom}.sql`), '\n');
    for (const n of [...ESSAIS.map((e) => e.nom), ...PARITES.map((p) => p.nom)]) writeFileSync(join(d, DOSSIER_ATTENDUS, `${n}.txt`), `oracle: ${ORACLE}\n`);
    for (const f of ['schema.sql', 'local-prelude.sql', 'seed.sql']) writeFileSync(join(d, 'supabase', f), '\n');
    verifier('la liste du dépôt, recopiée : aucun écart', ecartsDeLaListe(d).length === 0, ecartsDeLaListe(d).join(' / '));
    const essaye = (rel, motif) => {
      mkdirSync(dirname(join(d, 'supabase', rel)), { recursive: true });
      writeFileSync(join(d, 'supabase', rel), "\\echo '=== 1. un cas qui casse'\nselect 1/0;\n");
      const e = ecartsDeLaListe(d);
      rmSync(join(d, 'supabase', rel));
      return e.length === 1 && motif.test(e[0]);
    };
    verifier('un essai rangé nulle part', essaye('essais-section-99.sql', /essais-section-99\.sql n’est dans aucune liste/));
    verifier('…au singulier (essai-…)', essaye('essai-section-52.sql', /essai-section-52\.sql ressemble à un essai, mais il ne sera JAMAIS joué/));
    verifier('…dans un sous-dossier', essaye('essais/essais-section-53.sql', /essais\/essais-section-53\.sql ressemble à un essai/));
    verifier('…avec une majuscule', essaye('Essais-section-54.sql', /Essais-section-54\.sql ressemble à un essai/));
    verifier('…avec l’extension en majuscules', essaye('essais-section-55.SQL', /essais-section-55\.SQL ressemble à un essai/));
    rmSync(join(d, DOSSIER_ATTENDUS, `${ESSAIS[0].nom}.txt`));
    verifier('un oracle qui manque', ecartsDeLaListe(d).some((e) => new RegExp(`« ${ESSAIS[0].nom} » n’a pas d’oracle`).test(e)));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
}

console.log('\nLe VRAI script, lancé sans base');
{
  const lancer = (args, { env = {}, cwd = RACINE, script = SCRIPT } = {}) => {
    const base = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'CI'));
    const r = spawnSync(process.execPath, [script, ...args], { cwd, env: { ...base, ...env }, encoding: 'utf8', timeout: 60000 });
    return { code: r.status, texte: `${r.stdout || ''}${r.stderr || ''}` };
  };
  /* Le code d'une option inconnue, jusqu'au `process.exit` : la promesse de
     `principal()` est bien rendue au processus. */
  const bidon = lancer(['--option-bidon']);
  verifier('une option inconnue : code 2', bidon.code === 2 && /Option inconnue : --option-bidon/.test(bidon.texte), `code ${bidon.code} : ${bidon.texte.trim().slice(0, 200)}`);
  const ci = lancer(['essais-section-25'], { env: { CI: 'true' } });
  verifier('sous CI, un nom d’essai : refusé, code 2 (C3)', ci.code === 2 && /Sous CI, le passage est COMPLET/.test(ci.texte), `code ${ci.code} : ${ci.texte.trim().slice(0, 200)}`);
  const cg = lancer(['--comme-github', 'essais-section-25']);
  verifier('`--comme-github` avec un nom : refusé, code 2 (il pose CI=true)', cg.code === 2 && /rejoue le passage COMPLET/.test(cg.texte), `code ${cg.code}`);
  /* m1 : par un chemin qui passe par un LIEN, le script tournait… à vide. */
  const t = mkdtempSync(join(tmpdir(), 'opus-juge-lien-'));
  try {
    symlinkSync(RACINE, join(t, 'lien'));
    const lien = lancer(['--option-bidon'], { cwd: '/', script: join(t, 'lien', 'scripts', 'jouer-essais-sql.mjs') });
    verifier('lancé par un chemin qui passe par un lien, il TOURNE (code 2 sur une option inconnue, et non 0 en silence)',
      lien.code === 2 && /Option inconnue/.test(lien.texte), `code ${lien.code} : « ${lien.texte.trim().slice(0, 120)} »`);
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
  /* Une liste qui ne correspond plus, dans une COPIE du script : le code 1
     arrive avant toute base. */
  const c = mkdtempSync(join(tmpdir(), 'opus-juge-copie-'));
  try {
    mkdirSync(join(c, 'scripts'));
    mkdirSync(join(c, DOSSIER_ATTENDUS), { recursive: true });
    copyFileSync(SCRIPT, join(c, 'scripts', 'jouer-essais-sql.mjs'));
    for (const e of [...ESSAIS, ...HORS_LISTE]) writeFileSync(join(c, 'supabase', `${e.nom}.sql`), '\n');
    for (const n of [...ESSAIS.map((e) => e.nom), ...PARITES.map((p) => p.nom)]) writeFileSync(join(c, DOSSIER_ATTENDUS, `${n}.txt`), `oracle: ${ORACLE}\n`);
    writeFileSync(join(c, 'supabase', 'essai-section-52.sql'), "select 1/0;\n");
    const l = lancer([], { cwd: c, script: join(c, 'scripts', 'jouer-essais-sql.mjs') });
    verifier('une liste qui ne correspond plus : code 1, avant toute base', l.code === 1 && /La liste fermée ne correspond pas/.test(l.texte),
      `code ${l.code} : ${l.texte.trim().slice(0, 200)}`);
  } finally {
    rmSync(c, { recursive: true, force: true });
  }
  /* Importé, le module ne fait RIEN (verifier-atelier et ce contrôle-ci l'importent). */
  const imp = spawnSync(process.execPath, ['-e', `import(${JSON.stringify(SCRIPT)}).then(() => console.log('importé'))`], { encoding: 'utf8', timeout: 30000 });
  verifier('importé, il ne lance rien', imp.status === 0 && imp.stdout.trim() === 'importé', `${imp.stdout}${imp.stderr}`.trim().slice(0, 200));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec : le juge des essais SQL ne juge plus ce qu’il annonce.\n`);
  process.exit(1);
}
console.log('✔ Le juge des essais SQL tient : il rougit sur chaque défaut qu’on lui montre, et son code de sortie aussi.\n');
