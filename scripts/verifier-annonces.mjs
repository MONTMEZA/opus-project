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
  jourCourant, chevauche, estTerminee, libelleProximite,
  creneauSemaine, creneauMois, joursEntre,
  JOURS_COURTS, SEMAINES_MAX, grilleMois, moisDe, moisDecale, nomMois,
  joursDuMois, indexJourSemaine, jourCourt, dansIntervalle,
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

  /* ======================================================================
     LA GRILLE DU CALENDRIER — 04/10/2026
     ----------------------------------------------------------------------
     Elle remplace les sept contrôles de `versISO`, le découpage de
     « 12/10 » tapé à la main, qui a quitté le dépôt avec son appelant.

     ET CE N'EST PAS UN ÉCHANGE À ÉGALITÉ : `versISO` acceptait « 31/02 »
     et rendait « 2026-02-31 ». Vérifié sur la VRAIE base le 04/10 :
     `select '2026-02-31'::date` répond
     « ERROR 22008: date/time field value out of range ». Une faute de
     frappe se traduisait donc en refus de la base. Une grille, elle, ne
     peut pas proposer un jour qui n'existe pas — c'est le genre de défaut
     qu'on supprime au lieu de le contrôler.

     Un calendrier se trompe d'UNE CASE sans que ça se voie : un décalage
     d'un cran en février, et toutes les dates du mois sont fausses. D'où
     des mois choisis exprès pour leurs bords.
     ====================================================================== */
  console.log('\nLe calendrier — la grille d’un mois');

  verifier('sept jours, lundi d’abord',
    JOURS_COURTS.length === 7 && JOURS_COURTS[0] === 'L' && JOURS_COURTS[6] === 'D',
    'la semaine française commence le lundi : un décalage d’un cran ici '
    + 'décale TOUTE la grille');

  /* 1er octobre 2026 = un JEUDI, donc trois cases vides avant lui. */
  const oct = grilleMois('2026-10');
  verifier('octobre 2026 commence un jeudi (3 cases vides avant)',
    oct[0][0] === null && oct[0][2] === null && oct[0][3] === '2026-10-01',
    JSON.stringify(oct[0]));
  verifier('…et finit le 31',
    oct[oct.length - 1].filter(Boolean).pop() === '2026-10-31');
  verifier('toutes les semaines font exactement sept cases',
    oct.every((sem) => sem.length === 7));
  verifier('les 31 jours sont là, une seule fois chacun',
    new Set(oct.flat().filter(Boolean)).size === 31);

  /* LE PIRE CAS : le 1er tombe un DIMANCHE. Six cases vides avant, et le
     mois déborde sur une sixième semaine. C'est lui qui fixe la hauteur à
     réserver — sans quoi « Valider » remonte en changeant de mois. */
  const mars = grilleMois('2026-03');   // 1er mars 2026 = dimanche, 31 jours
  verifier('un mois qui commence un dimanche occupe six semaines',
    mars.length === 6, `${mars.length} semaines`);
  verifier(`la hauteur réservée couvre ce cas (${SEMAINES_MAX} semaines)`,
    SEMAINES_MAX >= mars.length);

  /* LE MEILLEUR CAS : février de 28 jours commençant un lundi → quatre
     semaines pleines, aucune case vide. */
  const fev2021 = grilleMois('2021-02');
  verifier('février 2021 tient en quatre semaines pleines',
    fev2021.length === 4 && fev2021.flat().every(Boolean),
    `${fev2021.length} semaines`);

  verifier('une année bissextile donne 29 jours',
    joursDuMois('2024-02') === 29);
  verifier('…et 2100 n’en est pas une',
    joursDuMois('2100-02') === 28,
    'la règle des siècles : divisible par 100 mais pas par 400');
  verifier('février 2026 en a 28', joursDuMois('2026-02') === 28);

  verifier('lundi vaut 0', indexJourSemaine('2026-10-05') === 0);
  verifier('dimanche vaut 6', indexJourSemaine('2026-10-04') === 6,
    'getUTCDay() rend 0 pour dimanche : c’est l’inversion qu’on corrige');

  /* LE PASSAGE D'ANNÉE est la seule chose qui casse dans ce genre de
     fonction, donc elle ne fait que des divisions entières. */
  verifier('décembre + 1 = janvier de l’année suivante',
    moisDecale('2026-12', 1) === '2027-01');
  verifier('janvier − 1 = décembre de l’année d’avant',
    moisDecale('2026-01', -1) === '2025-12');
  verifier('reculer de douze mois rend le même mois',
    moisDecale('2026-10', -12) === '2025-10');

  verifier('le mois d’un jour', moisDe('2026-10-12') === '2026-10');
  verifier('nomMois est en français, avec l’année',
    nomMois('2026-10') === 'octobre 2026', nomMois('2026-10'));
  verifier('jourCourt rend « 12/10 »', jourCourt('2026-10-12') === '12/10');
  verifier('jourCourt sur rien rend rien', jourCourt('') === null);

  /* L'INTERVALLE, bornes comprises — et la borne ABSENTE, qui ne se
     devine pas : avec un seul bout posé, seul ce bout est dedans. Même
     règle que `chevauche`. */
  verifier('le premier jour est dedans',
    dansIntervalle('2026-10-12', '2026-10-12', '2026-10-20'));
  verifier('le dernier aussi',
    dansIntervalle('2026-10-20', '2026-10-12', '2026-10-20'));
  verifier('un jour du milieu aussi',
    dansIntervalle('2026-10-15', '2026-10-12', '2026-10-20'));
  verifier('la veille, non',
    !dansIntervalle('2026-10-11', '2026-10-12', '2026-10-20'));
  verifier('avec un seul bout, seul ce bout est dedans',
    dansIntervalle('2026-10-12', '2026-10-12', null)
    && !dansIntervalle('2026-10-13', '2026-10-12', null),
    'on ne devine pas une fin que personne n’a donnée');

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
