/**
 * LE RÉFÉRENTIEL DES MÉTIERS — tout ce qui doit rester d'accord.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * Avant, la liste des métiers était écrite à deux endroits : dans le code
 * et, recopiée à la main, dans la contrainte `pro_metiers_check`. Ce
 * script comparait les deux listes. Il n'a plus à le faire : le SQL est
 * désormais ENGENDRÉ depuis le catalogue, et deux choses engendrées l'une
 * de l'autre ne divergent pas.
 *
 * Ce qui PEUT encore diverger, et que ce script vérifie :
 *
 *   1. le SQL engendré n'a pas été regénéré après une modification du
 *      catalogue — le cas le plus probable, et le plus silencieux ;
 *   2. le catalogue lui-même est incohérent : deux clés identiques, une
 *      spécialité rattachée à un métier qui n'existe pas, une clé avec un
 *      accent (qui ne se comparerait jamais juste) ;
 *   3. la table de migration ne mène pas à des métiers réels — une seule
 *      erreur, et un profil existant perd son métier le jour du passage ;
 *   4. la recherche ne trouve plus ce qu'elle doit trouver. Ce sont les
 *      exemples du propriétaire, repris tels quels de sa demande.
 *
 * npm run verifier-metiers
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

import { CATALOGUE, CATEGORIES, ANCIENS_NOMS } from '../src/data/catalogue-metiers.js';
import { chercherMetiers, MAP_METIERS, MAP_SPECIALITES, nomMetier, motsDuMetier,
  nomSpecialite, specialitesProposees } from '../src/lib/metiers.js';
import { texteDePro, correspond } from '../src/lib/recherche.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const METIERS = CATALOGUE.filter((m) => m.actif !== false);
const SPECIALITES = CATALOGUE.flatMap((m) => (m.spe || []).map((s) => ({ ...s, parent: m.cle })));

console.log(`\nLe catalogue : ${CATEGORIES.length} catégories, `
  + `${METIERS.length} métiers, ${SPECIALITES.length} spécialités`);
{
  const cles = CATALOGUE.map((m) => m.cle);
  const toutes = [...cles, ...SPECIALITES.map((s) => s.cle)];
  const doublons = toutes.filter((c, i) => toutes.indexOf(c) !== i);
  verifier('aucune clé en double, métiers et spécialités confondus',
    doublons.length === 0, JSON.stringify([...new Set(doublons)]));

  /* Une clé avec un accent ou une majuscule ne se compare jamais juste :
     c'est exactement le défaut qu'on vient de retirer. */
  const malFormees = toutes.filter((c) => !/^[a-z0-9-]+$/.test(c));
  verifier('les clés n’ont ni accent, ni majuscule, ni espace',
    malFormees.length === 0, JSON.stringify(malFormees));

  const connues = new Set(CATEGORIES.map((c) => c.cle));
  const orphelins = CATALOGUE.filter((m) => !connues.has(m.categorie));
  verifier('chaque métier est dans une catégorie qui existe',
    orphelins.length === 0, JSON.stringify(orphelins.map((m) => m.cle)));

  const clesMetiers = new Set(cles);
  const speOrphelines = SPECIALITES.filter((s) => !clesMetiers.has(s.parent));
  verifier('chaque spécialité est rattachée à un métier qui existe',
    speOrphelines.length === 0, JSON.stringify(speOrphelines.map((s) => s.cle)));

  const vides = CATEGORIES.filter((c) => !METIERS.some((m) => m.categorie === c.cle));
  verifier('aucune catégorie vide (elle s’afficherait sans rien dedans)',
    vides.length === 0, JSON.stringify(vides.map((c) => c.cle)));

  /* Une spécialité ne doit jamais porter la clé d'un métier : la contrainte
     `pro_metiers_check` n'accepte que les lignes sans parent, et un profil
     qui enregistrerait cette clé serait refusé sans qu'on comprenne. */
  const collision = SPECIALITES.filter((s) => clesMetiers.has(s.cle));
  verifier('aucune spécialité ne porte la clé d’un métier',
    collision.length === 0, JSON.stringify(collision.map((s) => s.cle)));
}

console.log('\nLe SQL engendré suit-il le catalogue ?');
{
  let sorti = '';
  let ok = true;
  try {
    sorti = execFileSync('node', ['scripts/generer-catalogue.mjs', '--verifier'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    ok = false;
    sorti = String((e.stderr || '') + (e.stdout || ''));
  }
  verifier('supabase/schema.sql correspond à src/data/catalogue-metiers.js',
    ok, `${sorti.trim()}\n      → lance : npm run generer-catalogue`);
}

console.log('\nLa migration des douze anciens noms');
{
  const sql = readFileSync('supabase/schema.sql', 'utf8');

  const inconnues = Object.entries(ANCIENS_NOMS).filter(([, cle]) => !MAP_METIERS[cle]);
  verifier('chaque ancien nom mène à un métier qui existe',
    inconnues.length === 0, JSON.stringify(inconnues));

  /* La fonction SQL est écrite à la main : c'est le seul endroit du
     référentiel qui ne soit pas engendré, donc le seul qui puisse encore
     diverger. Sans ce contrôle, un profil perdrait son métier en silence
     le jour du passage. */
  const bloc = sql.match(/function public\.metier_depuis_ancien_nom[\s\S]*?\$\$;/);
  verifier('la fonction de migration existe dans schema.sql', !!bloc);
  if (bloc) {
    const manquants = Object.entries(ANCIENS_NOMS).filter(([ancien, cle]) => {
      const ligne = new RegExp(`when '${ancien.replace(/'/g, "''")}'\\s+then '${cle}'`);
      return !ligne.test(bloc[0]);
    });
    verifier('les douze correspondances sont les mêmes des deux côtés',
      manquants.length === 0, JSON.stringify(manquants));
  }
}

console.log('\nPlus aucun ancien nom ne traîne comme VALEUR dans le code');
{
  /* On cherche les libellés d'avant écrits entre apostrophes hors du
     catalogue et de sa table de migration : ce serait une comparaison
     vouée à échouer, puisque la base ne contient plus que des clés. */
  const fichiers = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
    .split('\n').filter((f) => f.endsWith('.js')
      && !f.endsWith('catalogue-metiers.js'));
  const noms = Object.keys(ANCIENS_NOMS);
  const coupables = [];
  fichiers.forEach((f) => {
    const contenu = readFileSync(f, 'utf8');
    noms.forEach((n) => {
      if (contenu.includes(`'${n}'`)) coupables.push(`${f} → '${n}'`);
    });
  });
  verifier('aucun fichier ne compare encore un libellé de métier',
    coupables.length === 0, coupables.join('\n      '));
}

console.log('\nPersonne ne refabrique une grille de métiers dans son coin');
{
  /* LE DÉFAUT QUE CECI EMPÊCHE
     --------------------------
     Les grilles de puces ont été retirées de neuf écrans le 30/09/2026.
     Rien n'empêche d'en refaire une : il suffit d'importer le catalogue et
     de le parcourir. Six mois plus tard, on aurait de nouveau un écran qui
     affiche quatre-vingt-douze boutons, et personne ne saurait d'où il
     sort.

     Le catalogue n'est donc lisible QUE par le sélecteur et par la
     bibliothèque des métiers. Partout ailleurs, on passe par
     `SelecteurMetiers` ou `ChampMetier`. */
  const AUTORISES = [
    'src/lib/metiers.js',
    'src/components/SelecteurMetiers.js',
  ];
  const fichiers = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
    .split('\n').filter((f) => f.endsWith('.js') && !f.endsWith('catalogue-metiers.js'));
  const intrus = fichiers.filter((f) => !AUTORISES.includes(f)
    && readFileSync(f, 'utf8').includes('catalogue-metiers'));
  verifier('seuls le sélecteur et lib/metiers.js lisent le catalogue',
    intrus.length === 0,
    `${intrus.join(', ')}\n      → passe par <SelecteurMetiers> ou <ChampMetier>`);
}

console.log('\nLes quatre métiers d’urgence existent vraiment');
{
  /* `METIERS_SOS` porte des clés de métier écrites à la main. Si l'une
     d'elles cesse de correspondre au catalogue, le bouton SOS n'atteint
     plus aucun artisan — et rien ne le signale : l'écran s'affiche, la
     demande part, personne ne la reçoit. */
  const sos = JSON.parse(JSON.stringify(
    (await import('../src/data/urgences.js')).METIERS_SOS,
  ));
  const inconnus = sos.filter((m) => !MAP_METIERS[m.metier]);
  verifier('chaque métier SOS existe dans le catalogue',
    inconnus.length === 0, JSON.stringify(inconnus.map((m) => m.metier)));
  const specialites = sos.filter((m) => MAP_SPECIALITES[m.metier]);
  verifier('aucun n’est une spécialité (personne ne l’aurait comme métier)',
    specialites.length === 0, JSON.stringify(specialites.map((m) => m.metier)));
}

console.log('\nLa recherche — les exemples de la demande, mot pour mot');
{
  const cles = (texte) => chercherMetiers(texte).map((m) => m.cle);
  const premier = (texte) => cles(texte)[0];

  /* « maç » → Maçon, Maçonnerie générale, Maçon du patrimoine… (§5) */
  verifier('« maç » rend Maçon EN PREMIER',
    premier('maç') === 'macon', JSON.stringify(cles('maç').slice(0, 4)));
  verifier('« mac » sans cédille rend la même chose',
    premier('mac') === 'macon', JSON.stringify(cles('mac').slice(0, 4)));
  verifier('… et les trois maçonneries y sont',
    ['macon', 'maconnerie-generale', 'macon-patrimoine'].every((c) => cles('maç').includes(c)));

  /* « archi » → Architecte, Architecte d'intérieur, Architecte paysagiste */
  verifier('« archi » rend les trois architectes',
    ['architecte', 'architecte-interieur', 'architecte-paysagiste']
      .every((c) => cles('archi').includes(c)), JSON.stringify(cles('archi')));

  /* « avocat construction » → l'avocat spécialisé, pas tous les avocats */
  verifier('« avocat construction » rend l’avocat en droit de la construction',
    cles('avocat construction').includes('avocat-construction'));
  verifier('… et PAS l’avocat en droit immobilier',
    !cles('avocat construction').includes('avocat-immobilier'),
    JSON.stringify(cles('avocat construction')));

  /* §13 : chercher par SPÉCIALITÉ doit rendre le métier. */
  verifier('« mur de soutènement » rend Maçon',
    cles('mur de soutènement').includes('macon'),
    JSON.stringify(cles('mur de soutènement')));
  verifier('« recherche de fuite toiture » rend Couvreur',
    cles('recherche de fuite toiture').includes('couvreur'),
    JSON.stringify(cles('recherche de fuite toiture')));
  verifier('« pompe à chaleur » rend Chauffagiste',
    cles('pompe à chaleur').includes('chauffagiste'));

  /* Les synonymes de chantier : ce que les gens TAPENT. */
  verifier('« placo » rend Plaquiste', cles('placo').includes('plaquiste'));
  verifier('« ba13 » rend Plaquiste', cles('ba13').includes('plaquiste'));
  verifier('« parpaing » rend Maçon', cles('parpaing').includes('macon'));
  verifier('« clim » rend Climaticien', cles('clim').includes('climaticien'));
  verifier('« velux » rend Couvreur', cles('velux').includes('couvreur'));

  /* Et ce que la recherche NE doit PAS faire : tout rendre. */
  verifier('une recherche vide ne rend rien', chercherMetiers('').length === 0);
  verifier('un mot qui n’existe pas ne rend rien',
    chercherMetiers('astronaute').length === 0, JSON.stringify(cles('astronaute')));
  verifier('« plombier » ne rend pas quarante résultats',
    cles('plombier').length <= 3, JSON.stringify(cles('plombier')));
}

console.log('\nTrouver un artisan PAR SA SPÉCIALITÉ — le §13, bout en bout');
{
  /* Ce n'est pas la même chose que le contrôle du dessus. Plus haut, on
     vérifie que le SÉLECTEUR trouve le métier Maçon quand on tape « mur de
     soutènement ». Ici, on vérifie qu'un artisan dont la FICHE porte cette
     spécialité est trouvé par la recherche de « Découvrir » — c'est le
     chemin qu'emprunte un vrai client.

     Le piège : une fiche range `mur-soutenement`, pas « Mur de
     soutènement ». Sans passer par le catalogue, la recherche chercherait
     un texte que personne ne tape jamais. */
  const macon = {
    nom: 'Untel', entreprise: 'Untel SARL', ville: 'Lyon (69)', bio: '',
    metier: 'macon', metiers: ['macon'],
    specialites: ['mur-soutenement', 'Poêle à granulés'],
  };
  const couvreur = {
    nom: 'Autre', entreprise: 'Autre SARL', ville: 'Lyon (69)', bio: '',
    metier: 'couvreur', metiers: ['couvreur'],
    specialites: ['recherche-fuite-toiture'],
  };
  const trouve = (pro, requete) => correspond(texteDePro(pro), requete);

  verifier('« mur de soutènement » trouve le maçon qui l’a déclaré',
    trouve(macon, 'mur de soutènement'));
  verifier('… sans les accents non plus', trouve(macon, 'mur de soutenement'));
  verifier('… et pas le couvreur', !trouve(couvreur, 'mur de soutènement'));

  /* Une spécialité ÉCRITE À LA MAIN doit marcher pareil : c'est toute la
     raison de garder le texte libre. */
  verifier('« poêle à granulés », écrit à la main, le trouve aussi',
    trouve(macon, 'poele a granules'));

  verifier('« recherche de fuite » trouve le couvreur',
    trouve(couvreur, 'recherche de fuite'));
  verifier('« maçon » trouve le maçon malgré la clé rangée',
    trouve(macon, 'maçon'));
  verifier('« parpaing » aussi, par les synonymes du catalogue',
    trouve(macon, 'parpaing'));
  verifier('un mot sans rapport ne le trouve pas', !trouve(macon, 'piscine'));
}

console.log('\nLes noms s’affichent, jamais les clés');
{
  verifier('nomMetier(« macon ») donne « Maçon »', nomMetier('macon') === 'Maçon');
  verifier('nomMetier(« peintre-en-batiment ») donne « Peintre en bâtiment »',
    nomMetier('peintre-en-batiment') === 'Peintre en bâtiment');
  /* Une clé inconnue rend la clé : une fiche à moitié vide serait pire, et
     un mot technique se remarque tout de suite. */
  verifier('une clé inconnue rend la clé, jamais du vide',
    nomMetier('metier-retire') === 'metier-retire');
  verifier('nomMetier(null) rend une chaîne vide', nomMetier(null) === '');
  verifier('motsDuMetier rend le nom ET les synonymes',
    motsDuMetier('plaquiste').includes('Plaquiste')
      && motsDuMetier('plaquiste').includes('ba13'));
  verifier('une spécialité connue a son nom',
    MAP_SPECIALITES['mur-soutenement'].nom === 'Mur de soutènement');
  verifier('nomSpecialite traduit une clé du catalogue',
    nomSpecialite('mur-soutenement') === 'Mur de soutènement');
  /* Une spécialité écrite à la main n'est dans aucun catalogue : elle se
     rend telle quelle, et c'est voulu. */
  verifier('… et laisse le texte libre intact',
    nomSpecialite('Poêle à granulés') === 'Poêle à granulés');
}

console.log('\nLes spécialités proposées suivent les métiers choisis');
{
  const cles = (metiers) => specialitesProposees(metiers).map((s0) => s0.cle);

  verifier('un maçon se voit proposer « mur de soutènement »',
    cles(['macon']).includes('mur-soutenement'));
  verifier('… et PAS « toiture en zinc »',
    !cles(['macon']).includes('toiture-zinc'), JSON.stringify(cles(['macon'])));
  verifier('un maçon-carreleur voit les deux listes',
    cles(['macon', 'carreleur']).includes('mur-soutenement')
      && cles(['macon', 'carreleur']).includes('faience'));
  verifier('un métier sans spécialité n’en propose aucune',
    cles(['ramoneur']).length === 0);
  verifier('aucun métier choisi → aucune proposition',
    cles([]).length === 0 && cles(null).length === 0);
  /* Douze au maximum sur la fiche : si un seul métier en proposait plus,
     l'artisan ne pourrait plus rien écrire à lui. */
  const plusGrosse = Math.max(...Object.keys(MAP_METIERS)
    .map((c) => cles([c]).length));
  verifier(`le métier le plus fourni propose ${plusGrosse} spécialités, pas plus de 12`,
    plusGrosse <= 12, String(plusGrosse));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le référentiel tient, et la recherche trouve.\n');
