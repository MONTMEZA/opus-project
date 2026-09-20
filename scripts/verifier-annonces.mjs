/**
 * Les types d'annonces, les budgets et les urgences existent à DEUX endroits :
 * dans l'application et dans les contraintes `check (... in (...))` de
 * supabase/schema.sql. Une divergence fait refuser l'enregistrement par la
 * base sans que rien ne le montre en mode démo — c'est exactement ce qui
 * s'était passé avec le format « montage ».
 *
 * Ce script compare les listes, et vérifie aussi la mise en forme des dates
 * et des prix, qui s'écrit à la main et se casse facilement.
 */
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/schema.sql', 'utf8');
const app = readFileSync('src/data/annonces.js', 'utf8');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const entreApostrophes = (t) => [...t.matchAll(/'([^']+)'/g)].map((m) => m[1]);

function contrainteSql(motif) {
  const bloc = sql.match(motif);
  if (!bloc) throw new Error(`contrainte introuvable : ${motif}`);
  return entreApostrophes(bloc[1]);
}
function listeApp(nom) {
  const bloc = app.match(new RegExp(`export const ${nom} = \\[([\\s\\S]*?)\\n\\];`));
  if (!bloc) throw new Error(`${nom} introuvable dans src/data/annonces.js`);
  return [...bloc[1].matchAll(/cle: '([^']+)'/g)].map((m) => m[1]);
}

const memesElements = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

console.log('\nTypes d’annonce');
const typesSql = contrainteSql(/create table if not exists public\.annonces_pro[\s\S]*?check \(type in \(([\s\S]*?)\n\s*\)\)/);
const typesApp = listeApp('TYPES_ANNONCE');
verifier(`${typesApp.length} types identiques`, memesElements(typesApp, typesSql),
  `app: ${typesApp.join(', ')}\n      sql: ${typesSql.join(', ')}`);

console.log('\nUnités de location');
const unitesSql = contrainteSql(/check \(unite in \(([\s\S]*?)\)\)/);
const unitesApp = listeApp('UNITES');
verifier(`${unitesApp.length} unités identiques`, memesElements(unitesApp, unitesSql),
  `app: ${unitesApp.join(', ')}\n      sql: ${unitesSql.join(', ')}`);

console.log('\nBudgets et urgences');
const budgetsSql = contrainteSql(/demandes_budget_check[\s\S]*?budget in \(([\s\S]*?)\n\s*\)\)/);
verifier(`${listeApp('BUDGETS').length} budgets identiques`,
  memesElements(listeApp('BUDGETS'), budgetsSql),
  `app: ${listeApp('BUDGETS').join(', ')}\n      sql: ${budgetsSql.join(', ')}`);

const urgencesSql = contrainteSql(/demandes_urgence_check[\s\S]*?urgence in \(([\s\S]*?)\)\)/);
verifier(`${listeApp('URGENCES').length} urgences identiques`,
  memesElements(listeApp('URGENCES'), urgencesSql),
  `app: ${listeApp('URGENCES').join(', ')}\n      sql: ${urgencesSql.join(', ')}`);

/* On importe src/lib/formats.js et pas src/data/annonces.js : le second
   importe le thème, donc React Native, et ne se charge pas sous node. */
const { libelleDates, libellePrix } = await import('../src/lib/formats.js');

{
  console.log('\nDates');
  verifier('même mois abrégé', libelleDates('2026-03-12', '2026-03-20') === 'du 12 au 20 mars',
    libelleDates('2026-03-12', '2026-03-20'));
  verifier('à cheval sur deux mois',
    libelleDates('2026-02-28', '2026-03-03') === 'du 28 févr. au 3 mars',
    libelleDates('2026-02-28', '2026-03-03'));
  verifier('début seul', libelleDates('2026-03-12', null) === 'à partir du 12 mars');
  verifier('fin seule', libelleDates(null, '2026-03-20') === "jusqu'au 20 mars");
  verifier('rien du tout', libelleDates(null, null) === null);

  console.log('\nPrix');
  verifier('entier sans centimes', libellePrix(180, 'total') === '180 €', libellePrix(180, 'total'));
  verifier('par jour', libellePrix(95, 'jour') === '95 € par jour', libellePrix(95, 'jour'));
  verifier('centimes en virgule', libellePrix(12.5, 'total') === '12,50 €', libellePrix(12.5, 'total'));
  verifier('prix absent', libellePrix(null) === null);
}

console.log(echecs === 0 ? '\n✔ Tout est cohérent.\n' : `\n✘ ${echecs} problème(s).\n`);
process.exit(echecs === 0 ? 0 : 1);
