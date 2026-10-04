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
const {
  libelleDates, libellePrix,
  versISO, jourCourant, chevauche, estTerminee, libelleProximite,
  creneauSemaine, creneauMois, joursEntre,
} = await import('../src/lib/formats.js');

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

  /* ====================================================================
     LES CRÉNEAUX — ajoutés le 04/10/2026.

     C'est le calcul qui décide de ce qu'on voit sur la Place des pros, et
     il est écrit à la main. Il tourne ICI pour de vrai, il n'est pas relu.
     ==================================================================== */
  console.log('\nDeux créneaux se chevauchent-ils ?');
  verifier('12–20 et 15–25 : oui',
    chevauche('2026-10-12', '2026-10-20', '2026-10-15', '2026-10-25'));
  verifier('12–20 et 21–25 : non',
    !chevauche('2026-10-12', '2026-10-20', '2026-10-21', '2026-10-25'));
  verifier('12–20 et 20–25 : oui, ils se touchent',
    chevauche('2026-10-12', '2026-10-20', '2026-10-20', '2026-10-25'),
    'un chantier qui finit le jour où l’autre commence, c’est une journée '
    + 'partagée — pas un manque');
  verifier('l’ordre ne change rien',
    chevauche('2026-10-15', '2026-10-25', '2026-10-12', '2026-10-20')
    === chevauche('2026-10-12', '2026-10-20', '2026-10-15', '2026-10-25'));

  /* LE CAS QUI COMPTE LE PLUS. Une bétonnière à vendre n'a pas de dates :
     la retirer d'une recherche par créneau ferait disparaître du matériel
     qui n'a jamais cessé d'être à vendre. */
  verifier('une annonce SANS dates chevauche tout',
    chevauche(null, null, '2026-10-12', '2026-10-20')
    && chevauche(null, null, '2027-01-01', '2027-01-02'),
    'du matériel à vendre est disponible n’importe quand');
  verifier('« à partir du 12 » chevauche ce qui finit après',
    chevauche('2026-10-12', null, '2026-10-01', '2026-10-15'));
  verifier('…et pas ce qui finit avant',
    !chevauche('2026-10-12', null, '2026-10-01', '2026-10-05'));
  verifier('« jusqu’au 20 » chevauche ce qui commence avant',
    chevauche(null, '2026-10-20', '2026-10-18', '2026-10-30'));

  console.log('\nUne annonce dont le chantier est passé');
  verifier('finie hier : terminée', estTerminee('2026-10-03', '2026-10-04'));
  verifier('finit aujourd’hui : PAS terminée', !estTerminee('2026-10-04', '2026-10-04'),
    'le dernier jour compte encore — un chantier se finit le jour même');
  verifier('sans date de fin : jamais terminée', !estTerminee(null, '2030-01-01'),
    '« à partir du 12 » ne se termine pas tout seul : on ne devine pas');

  console.log('\nCe qui fait agir');
  const p = (d, f, j) => (libelleProximite(d, f, j) || {}).texte;
  verifier('dans 3 jours', p('2026-10-07', '2026-10-20', '2026-10-04') === 'Dans 3 jours',
    p('2026-10-07', '2026-10-20', '2026-10-04'));
  verifier('demain', p('2026-10-05', null, '2026-10-04') === 'Commence demain');
  verifier('aujourd’hui', p('2026-10-04', null, '2026-10-04') === 'Commence aujourd’hui');
  verifier('déjà commencée', p('2026-10-01', '2026-10-20', '2026-10-04') === 'En cours');
  verifier('terminée', p('2026-09-01', '2026-09-20', '2026-10-04') === 'Terminée');
  /* Au-delà d'une dizaine de jours on se tait : un bandeau sur chaque
     annonce finirait par ne plus rien dire. */
  verifier('dans trois mois : on ne dit rien',
    libelleProximite('2027-01-04', null, '2026-10-04') === null);
  verifier('aucune date : on ne dit rien',
    libelleProximite(null, null, '2026-10-04') === null);

  console.log('\nLes raccourcis du filtre');
  /* LE DÉFAUT TROUVÉ AU NAVIGATEUR, un dimanche : la première version
     allait « jusqu'au dimanche », donc ce jour-là elle ne couvrait plus que
     la journée — et un chantier qui commençait trois jours plus tard
     disparaissait. Or le dimanche soir est exactement le moment où l'on
     prépare la semaine. Elle est GLISSANTE depuis : sept jours, tous les
     jours. */
  const mardi = new Date(2026, 9, 6);
  const dimanche = new Date(2026, 9, 4);
  verifier('un mardi : sept jours', creneauSemaine(mardi).fin === '2026-10-13',
    creneauSemaine(mardi).fin);
  verifier('un dimanche AUSSI : sept jours',
    creneauSemaine(dimanche).fin === '2026-10-11', creneauSemaine(dimanche).fin);
  verifier('…et elle couvre bien un chantier dans 3 jours, même un dimanche',
    chevauche('2026-10-07', '2026-10-09',
      creneauSemaine(dimanche).debut, creneauSemaine(dimanche).fin),
    'c’est précisément ce qui ne marchait pas');
  verifier('« ce mois-ci » part d’aujourd’hui, pas du 1er',
    creneauMois(mardi).debut === '2026-10-06', creneauMois(mardi).debut);
  verifier('…et finit le dernier jour du mois',
    creneauMois(mardi).fin === '2026-10-31', creneauMois(mardi).fin);
  /* Février 2028 est bissextile : le dernier jour n'est pas le 28. */
  verifier('un mois bissextile finit le 29',
    creneauMois(new Date(2028, 1, 10)).fin === '2028-02-29',
    creneauMois(new Date(2028, 1, 10)).fin);

  console.log('\nLa saisie d’une date, écrite à la main');
  const ref = new Date(2026, 9, 4);
  verifier('12/10 → 2026-10-12', versISO('12/10', ref) === '2026-10-12');
  verifier('2/3 → 2026-03-02', versISO('2/3', ref) === '2026-03-02',
    'un seul chiffre doit être complété, sinon la base refuse');
  verifier('12/10/27 → 2027-10-12', versISO('12/10/27', ref) === '2027-10-12');
  verifier('32/01 refusé', versISO('32/01', ref) === null);
  verifier('12/13 refusé', versISO('12/13', ref) === null);
  verifier('du texte refusé', versISO('la semaine prochaine', ref) === null,
    'on ne devine pas : un refus vaut mieux qu’une date inventée');
  verifier('vide refusé', versISO('', ref) === null);

  console.log('\nLe jour courant');
  verifier('toujours sur dix caractères',
    /^\d{4}-\d{2}-\d{2}$/.test(jourCourant(new Date(2026, 0, 5))),
    jourCourant(new Date(2026, 0, 5)));
  verifier('le 5 janvier s’écrit 2026-01-05',
    jourCourant(new Date(2026, 0, 5)) === '2026-01-05');
  verifier('joursEntre compte juste par-dessus un changement d’heure',
    joursEntre('2026-10-20', '2026-11-05') === 16,
    String(joursEntre('2026-10-20', '2026-11-05')));
}

console.log(echecs === 0 ? '\n✔ Tout est cohérent.\n' : `\n✘ ${echecs} problème(s).\n`);
process.exit(echecs === 0 ? 0 : 1);
