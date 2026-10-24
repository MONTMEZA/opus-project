/**
 * Engendre la fonction SQL de la CLÉ DE RAPPROCHEMENT à partir de la table
 * JavaScript de `src/lib/rapprochement.js` (lot P du module devis).
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * La même règle — « Chape sèche », « CHAPES SÈCHES. » et la phrase copiée
 * d'un PDF sont UNE même phrase — doit être appliquée à deux endroits : dans
 * le téléphone (`src/lib/rapprochement.js`), pour proposer un poste pendant
 * la frappe, et dans la base (`public.cle_de_rapprochement`, section 50 de
 * `schema.sql`), pour refuser un doublon. Deux écritures tenues à la main
 * finissent toujours par diverger, et ici une divergence ne lèverait aucune
 * erreur : le téléphone dirait « nouveau poste » et la base refuserait —
 * ou l'inverse, et l'artisan aurait deux postes pour un.
 *
 * Le remède est celui du catalogue des métiers (`generer-catalogue`) : le
 * second endroit n'est plus écrit par un humain. La table — 5 093
 * caractères traduits ou supprimés, et 30 remplacés par un mot — vit dans
 * le fichier JavaScript ; la fonction SQL en est ENGENDRÉE, caractère par
 * caractère.
 *
 *   npm run generer-rapprochement                  réécrit la fonction dans
 *                                                  schema.sql, entre ses repères
 *   npm run generer-rapprochement -- --verifier    dit seulement si elle a
 *                                                  divergé (code 1), sans rien toucher
 *   npm run generer-rapprochement -- --afficher    écrit la fonction engendrée
 *                                                  sur la sortie, sans rien toucher
 *
 * CE QU'IL REFUSE D'ENGENDRER (code 1, et il dit pourquoi)
 * --------------------------------------------------------
 * La base applique la table en DEUX passes — la table d'un caractère
 * (`translate`), puis les remplacements par une chaîne (`replace`) sur son
 * résultat (l'ordre, et pourquoi, est écrit dans `engendrerFonction`) —
 * quand JavaScript l'applique en UNE. Les deux ne rendent la même chose que
 * si CE QUE RAPPORTE UN REMPLACEMENT N'EST FAIT QUE DE CARACTÈRES QUE LA
 * TABLE LAISSE TELS QUELS — `a` à `z`, `0` à `9` et l'espace — et si aucun
 * caractère remplacé n'est AUSSI dans la table. Mesuré quand on l'a
 * cherché, dans l'ordre d'avant : « ≤ » remplacé par « <= » donnait
 * « a<=b » d'un côté et « a< b » de l'autre — et aucun des cas écrits à la
 * main ne l'aurait vu. Le script s'arrête donc sur toute table qui casse
 * cette règle, plutôt que d'écrire une fonction qui se tromperait sans un
 * mot. `npm run verifier-postes` refait la même vérification de son côté :
 * une table peut être retouchée sans relancer ce script.
 *
 * Et la fonction engendrée ne contient AUCUNE barre oblique inverse ni aucun
 * caractère hors de l'ASCII : tout caractère spécial s'y écrit `chr(n)`, et
 * le remplacement du pluriel `chr(92) || '1' || chr(92) || '2'`. Son
 * résultat ne dépend donc d'aucun réglage de PostgreSQL
 * (`standard_conforming_strings`), et elle passe le transport du connecteur
 * Supabase sans qu'un octet change. Ce script n'écrit lui-même aucune barre
 * dans ce qu'il produit : il la FABRIQUE (`String.fromCharCode(92)`) le
 * temps de la reconnaître.
 *
 * Il ne lance aucune base : la preuve que la fonction rend la même clé que
 * le miroir est dans `verifier-postes` (la table SQL évaluée et comparée,
 * les cas, l'empreinte) et dans `supabase/essais-section-50.sql`, sur un
 * vrai PostgreSQL.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as MIROIR from '../src/lib/rapprochement.js';

const ICI = fileURLToPath(import.meta.url);
const RACINE = path.resolve(path.dirname(ICI), '..');
const FICHIER = 'supabase/schema.sql';

/* Les repères du bloc engendré dans `schema.sql`. Ils ne doivent jamais
   être supprimés : ils disent où écrire. Ce qu'il y a ENTRE eux est la
   fonction, octet pour octet — rien d'autre, pas même un commentaire. */
export const DEBUT = '-- <<< CLÉ DE RAPPROCHEMENT ENGENDRÉE par npm run generer-rapprochement — ne pas modifier à la main >>>';
export const FIN = '-- <<< FIN DE LA CLÉ DE RAPPROCHEMENT ENGENDRÉE >>>';

/* La classe des lettres, ÉNUMÉRÉE : un intervalle `[a-z]` dépend, dans une
   expression de PostgreSQL, de la collation de la base. Vingt-six lettres
   écrites une par une ne dépendent de rien. */
export const LETTRES = 'abcdefghijklmnopqrstuvwxyz';
const SURS = new Set([...LETTRES, ...'0123456789', ' ']);
const BARRE = String.fromCharCode(92);
const ASCII = (s) => [...s].every((c) => c.codePointAt(0) < 128);

/** Une table qui ne peut pas être engendrée. */
export class RefusDuGenerateur extends Error {}

/**
 * Ce qui, dans la table, empêcherait les deux écritures de dire la même
 * chose. Une liste vide : la table peut être engendrée.
 */
export function problemesDeLaTable(m) {
  const pb = [];
  if (!Number.isInteger(m.LONGUEUR_MAX) || m.LONGUEUR_MAX < 1) {
    pb.push('LONGUEUR_MAX doit être un entier positif (la garde des deux écritures).');
  }
  if (typeof m.TABLE_DE !== 'string' || typeof m.TABLE_VERS !== 'string' || !Array.isArray(m.TABLE_MULTIPLES)) {
    pb.push('TABLE_DE, TABLE_VERS et TABLE_MULTIPLES doivent être exportées par le miroir.');
    return pb;
  }
  const de = [...m.TABLE_DE];
  const vers = [...m.TABLE_VERS];
  const vus = new Set();
  for (const c of de) {
    const n = c.codePointAt(0);
    if (vus.has(c)) pb.push(`U+${n.toString(16).toUpperCase()} figure deux fois dans TABLE_DE.`);
    vus.add(c);
    if (SURS.has(c)) pb.push(`« ${c} » est dans TABLE_DE : a à z, 0 à 9 et l'espace doivent rester tels quels.`);
    if (n === 0) pb.push('U+0000 est dans TABLE_DE : PostgreSQL ne le porte pas dans un texte.');
    if (n >= 0xd800 && n <= 0xdfff) pb.push(`U+${n.toString(16).toUpperCase()} est une moitié de paire, pas un caractère.`);
  }
  if (vers.length > de.length) pb.push('TABLE_VERS est plus longue que TABLE_DE.');
  for (const c of vers) {
    if (!SURS.has(c)) pb.push(`TABLE_VERS rend « ${c} » : elle ne doit rendre que a à z, 0 à 9 ou l'espace.`);
  }
  const cles = new Set();
  for (const paire of m.TABLE_MULTIPLES) {
    const [c, v] = Array.isArray(paire) ? paire : [];
    if (typeof c !== 'string' || [...c].length !== 1 || typeof v !== 'string') {
      pb.push(`Un remplacement mal formé : ${JSON.stringify(paire)}.`);
      continue;
    }
    const nom = `U+${c.codePointAt(0).toString(16).toUpperCase()}`;
    if (cles.has(c)) pb.push(`${nom} est remplacé deux fois.`);
    cles.add(c);
    if (vus.has(c)) pb.push(`${nom} est à la fois dans TABLE_DE et dans TABLE_MULTIPLES.`);
    if (SURS.has(c) || c.codePointAt(0) === 0) pb.push(`${nom} ne peut pas être remplacé.`);
    /* L'INVARIANT : ce que rapporte un remplacement n'est fait que de
       caractères que la table laisse tels quels. */
    for (const s of v) {
      if (!SURS.has(s)) {
        pb.push(`${nom} → « ${v} » : « ${s} » n'est ni une lettre a à z, ni un chiffre, ni l'espace. `
          + 'La base appliquerait encore la table à ce caractère, JavaScript non : les deux clés différeraient.');
        break;
      }
    }
  }
  for (const [c, v] of m.TABLE_MULTIPLES.filter((p) => Array.isArray(p) && typeof p[1] === 'string')) {
    for (const s of v) {
      if (vus.has(s) || cles.has(s)) {
        pb.push(`U+${String(c).codePointAt(0).toString(16).toUpperCase()} rapporte « ${s} », qui est lui-même dans la table.`);
        break;
      }
    }
  }
  /* LA PROFONDEUR (24/10/2026) : la chaîne du `translate` s'écrit par
     groupes de seize, entre parenthèses ; leur concaténation reste d'un
     seul tenant. Au-delà de 1 000 groupes — 16 000 caractères —, on
     dépasserait la profondeur de la première table (968 termes d'un seul
     tenant, qui passaient), et l'on s'approcherait des ~4 000 qui font
     tomber PostgreSQL sur « stack depth limit exceeded ». */
  if (de.length > 16 * 1000) {
    pb.push(`TABLE_DE compte ${de.length} caractères : au-delà de 16 000, la fonction engendrée serait trop profonde pour `
      + 'PostgreSQL (il faudrait des groupes de groupes).');
  }
  const exc = m.EXCEPTIONS_PLURIEL;
  if (!Array.isArray(exc) || exc.some((e) => typeof e !== 'string' || !/^[a-z]+$/.test(e))) {
    pb.push('EXCEPTIONS_PLURIEL doit être une liste de mots faits de a à z.');
  }
  const src = m.PLURIEL_SOURCE;
  if (typeof src !== 'string') {
    pb.push('PLURIEL_SOURCE doit être exportée (la source de l’expression du pluriel).');
  } else {
    if (!ASCII(src) || src.includes(BARRE)) pb.push('L’expression du pluriel doit être faite d’ASCII, sans barre oblique inverse.');
    if (src.includes('(?<')) pb.push('L’expression du pluriel ne doit contenir aucune rétrospection « (?< ».');
    if (Array.isArray(exc) && !src.includes(`(?!(?:${exc.join('|')})(?: |$))`)) {
      pb.push('L’expression du pluriel ne porte pas l’exception écrite dans EXCEPTIONS_PLURIEL.');
    }
    const motif = src.split('[a-z]').join(`[${LETTRES}]`);
    if (/\[[^\]]*-[^\]]*\]/.test(motif)) pb.push('L’expression du pluriel contient un intervalle autre que [a-z] : la base ne le lirait pas pareil.');
  }
  return pb;
}

/** L'écriture SQL d'une suite de caractères : l'ASCII imprimable en clair, le reste en `chr(n)`. */
function sqlChaine(cars) {
  const morceaux = [];
  let clair = '';
  for (const c of cars) {
    const n = c.codePointAt(0);
    if (n >= 0x20 && n < 0x7f && c !== "'" && c !== BARRE) {
      clair += c;
    } else {
      if (clair) { morceaux.push(`'${clair}'`); clair = ''; }
      morceaux.push(`chr(${n})`);
    }
  }
  if (clair) morceaux.push(`'${clair}'`);
  return morceaux.join(' || ');
}

/* LES GROUPES DE SEIZE, ENTRE PARENTHÈSES (24/10/2026). La chaîne de départ
   du `translate` est une concaténation de littéraux et de `chr(n)`. Écrite
   d'un seul tenant — `chr(1) || chr(2) || … ` —, PostgreSQL en fait un
   arbre aussi PROFOND qu'elle est longue, qu'il parcourt récursivement en
   préparant la fonction : mesuré sur PostgreSQL 16, une chaîne de 4 000
   termes passe, une de 4 500 tombe sur « stack depth limit exceeded »
   (`max_stack_depth` = 2 Mo, la valeur par défaut de PostgreSQL ; celle de
   la vraie base n'a pas été relevée). La table complétée des invisibles en
   compte 5 093. Seize termes par
   parenthèse, et l'arbre n'a plus que ~320 niveaux, sous les 968 de la
   première table, qui passaient. */
const groupes16 = (cars) => {
  const g = [];
  for (let i = 0; i < cars.length; i += 16) g.push(cars.slice(i, i + 16));
  return g;
};

/** Le motif SQL du pluriel : celui du miroir, la classe des lettres énumérée. */
export const motifSqlDuPluriel = (source) => source.split('[a-z]').join(`[${LETTRES}]`);

/**
 * La fonction SQL, telle qu'elle s'écrit entre les repères : de
 * `create or replace function` à `$$;`, retour à la ligne final compris.
 */
export function engendrerFonction(m = MIROIR) {
  const pb = problemesDeLaTable(m);
  if (pb.length) {
    throw new RefusDuGenerateur(`la table ne peut pas être engendrée :\n      - ${pb.join('\n      - ')}`);
  }
  const de = [...m.TABLE_DE];
  const multiples = [...m.TABLE_MULTIPLES].sort((a, b) => a[0].codePointAt(0) - b[0].codePointAt(0));
  /* LA TABLE D'ABORD, LES REMPLACEMENTS ENSUITE (24/10/2026). `translate`
     cherche chaque caractère de la phrase dans TOUTE sa chaîne de départ :
     son coût est la longueur de la phrase fois celle de la table. Appliqué
     APRÈS les remplacements, il travaillait sur une phrase que « % » →
     « pourcent » avait rendue dix fois plus longue — 2 000 « % » en
     faisaient 20 000. Appliqué AVANT, il ne voit jamais plus que les 2 000
     points de code de la garde. Les deux ordres rendent la même clé, par
     l'invariant que `problemesDeLaTable` tient : un caractère remplacé n'est
     pas dans TABLE_DE (le translate le laisse tel quel), et ce que rapporte
     un remplacement n'est fait que de a à z, 0 à 9 et de l'espace (le
     translate ne l'aurait pas touché non plus). Mesuré : 2 000 « % » en
     ~70 ms avec la table complétée des invisibles, contre ~460 ms dans
     l'ordre d'avant. */
  let expr = `translate(\n          p_phrase,\n          ${groupes16(de).map((g) => `(${sqlChaine(g)})`).join('\n          || ')},\n`
    + `          '${m.TABLE_VERS}')`;
  for (const [c, v] of multiples) expr = `replace(${expr}, chr(${c.codePointAt(0)}), '${v}')`;
  const lignes = [
    'create or replace function public.cle_de_rapprochement(p_phrase text)',
    'returns text', 'language sql', 'immutable', 'strict', 'parallel safe', 'security invoker',
    'set search_path = public', 'as $$',
    `  select case when char_length(p_phrase) > ${m.LONGUEUR_MAX} then null else`,
    '  regexp_replace(', '    btrim(regexp_replace(', `      ${expr},`, "      ' {2,}', ' ', 'g'), ' '),",
    `    '${motifSqlDuPluriel(m.PLURIEL_SOURCE)}', chr(92) || '1' || chr(92) || '2', 'g')`, '  end', '$$;',
  ];
  const corps = `${lignes.join('\n')}\n`;
  if (corps.includes(BARRE)) throw new RefusDuGenerateur('la fonction engendrée contiendrait une barre oblique inverse.');
  if (!ASCII(corps)) throw new RefusDuGenerateur('la fonction engendrée contiendrait un caractère hors de l’ASCII.');
  return corps;
}

/** Le bloc complet, repères compris, tel qu'il doit se lire dans `schema.sql`. */
export const blocEngendre = (corps) => `${DEBUT}\n${corps}${FIN}`;

function principal() {
  const verifierSeulement = process.argv.includes('--verifier');
  const afficher = process.argv.includes('--afficher');
  let corps;
  try {
    corps = engendrerFonction();
  } catch (e) {
    if (!(e instanceof RefusDuGenerateur)) throw e;
    console.error(`✘ ${e.message}`);
    console.error('  Rien n’a été écrit. Corrigez la table de src/lib/rapprochement.js (par un script :');
    console.error('  elle porte des séquences que l’outil d’édition changerait), puis relancez.');
    process.exit(1);
  }
  if (afficher) {
    process.stdout.write(corps);
    console.error(`✔ Fonction engendrée : ${Buffer.byteLength(corps)} octets, aucune barre oblique inverse.`);
    process.exit(0);
  }
  const fichier = readFileSync(path.join(RACINE, FICHIER), 'utf8');
  const i = fichier.indexOf(DEBUT);
  const j = fichier.indexOf(FIN);
  const deux = (rep) => fichier.indexOf(rep) !== fichier.lastIndexOf(rep);
  if (i === -1 || j === -1 || j < i || deux(DEBUT) || deux(FIN)) {
    console.error(`✘ Les repères de la fonction engendrée sont introuvables (ou en double) dans ${FICHIER}.`);
    console.error('  La section 50 doit les porter, une fois chacun, autour de public.cle_de_rapprochement :');
    console.error(`    ${DEBUT}`);
    console.error(`    ${FIN}`);
    console.error('  Ils ne doivent jamais être supprimés : ils disent où écrire.');
    process.exit(1);
  }
  const attendu = blocEngendre(corps);
  const actuel = fichier.slice(i, j + FIN.length);
  if (actuel === attendu) {
    console.log(`✔ La fonction de ${FICHIER} correspond à la table de src/lib/rapprochement.js.`);
    process.exit(0);
  }
  if (verifierSeulement) {
    console.error(`✘ La fonction public.cle_de_rapprochement de ${FICHIER} ne correspond plus`);
    console.error('  à la table de src/lib/rapprochement.js. Lance : npm run generer-rapprochement');
    process.exit(1);
  }
  writeFileSync(path.join(RACINE, FICHIER), fichier.slice(0, i) + attendu + fichier.slice(j + FIN.length));
  console.log(`✔ ${FICHIER} réécrit : public.cle_de_rapprochement engendrée depuis la table du miroir.`);
  console.log('  Rejouer le schéma sur une base d’essai, puis npm run verifier-postes.');
  console.log('  Et sur la vraie base, une fonction remplacée ne recalcule AUCUNE clé déjà rangée : remplacement et');
  console.log('  réécriture se font dans UNE transaction — le contrat est écrit en section 50.0 de schema.sql.');
}

/* Lancé (`npm run generer-rapprochement`), il écrit ; importé (par
   `verifier-postes`), il ne fait que prêter ses fonctions. */
if (process.argv[1] && path.resolve(process.argv[1]) === ICI) principal();
