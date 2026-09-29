/**
 * La note d'un artisan vient de DEUX endroits, et il faut que les deux
 * donnent le même résultat.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * Depuis que les avis ne sont plus téléchargés au démarrage, la note
 * affichée dans les listes vient de `avis_count` / `note_delais` /
 * `note_qualite` / `note_tarif`, tenus par un trigger côté base. Sur la page
 * d'un artisan, en revanche, les avis sont chargés et la note est calculée.
 *
 * Si les deux divergent, l'artisan voit 4,3 dans la liste et 4,7 sur sa
 * page — et personne ne comprend lequel est le bon. Pire : PostgreSQL
 * renvoie les `numeric` sous forme de CHAÎNES. Un `'4.50' + '4.00'` en
 * JavaScript donne « 4.504.00 », pas 8,5. C'est le genre de défaut qui
 * n'apparaît qu'en production, parce que le mode démonstration, lui, manie
 * de vrais nombres.
 *
 * node scripts/verifier-notes.mjs
 */
import { avgReviews } from '../src/data/demo.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const proche = (a, b) => Math.abs(a - b) < 0.001;

console.log('\nQuand les avis SONT chargés, on les calcule');
{
  const pro = { reviews: [
    { delais: 5, qualite: 5, tarif: 3 },
    { delais: 4, qualite: 4, tarif: 4 },
    { delais: 3, qualite: 3, tarif: 5 },
  ] };
  const a = avgReviews(pro);
  verifier('moyenne de trois avis', proche(a.global, 4) && a.count === 3,
    `obtenu ${a.global} sur ${a.count} avis`);
}

console.log('\nQuand ils ne le sont PAS, on prend la moyenne de la base');
{
  const pro = { reviews: [], avisCount: 2, noteDelais: 4.5, noteQualite: 4, noteTarif: 3.5 };
  const a = avgReviews(pro);
  verifier('moyenne tenue par la base', proche(a.global, 4) && a.count === 2,
    `obtenu ${a.global} sur ${a.count} avis`);
}

console.log('\nLe piège des nombres renvoyés en CHAÎNES par PostgreSQL');
{
  const pro = { reviews: [], avisCount: 2, noteDelais: '4.50', noteQualite: '4.00', noteTarif: '3.50' };
  const a = avgReviews(pro);
  verifier('« 4.50 » est bien lu comme 4,5 et non concaténé',
    proche(a.global, 4), `obtenu ${a.global} — une concaténation donnerait un nombre absurde`);
  verifier('chaque critère est un nombre',
    [a.delais, a.qualite, a.tarif].every((x) => typeof x === 'number' && !Number.isNaN(x)),
    JSON.stringify([a.delais, a.qualite, a.tarif]));
}

console.log('\nLes deux sources donnent le MÊME résultat');
{
  const avis = [
    { delais: 5, qualite: 4, tarif: 3 },
    { delais: 2, qualite: 5, tarif: 4 },
  ];
  const moyenne = (k) => avis.reduce((s, r) => s + r[k], 0) / avis.length;
  const parLesAvis = avgReviews({ reviews: avis });
  const parLaBase = avgReviews({
    reviews: [],
    avisCount: avis.length,
    // Ce que le trigger écrit : avg() par critère, en chaîne.
    noteDelais: moyenne('delais').toFixed(2),
    noteQualite: moyenne('qualite').toFixed(2),
    noteTarif: moyenne('tarif').toFixed(2),
  });
  verifier('même note des deux côtés', proche(parLesAvis.global, parLaBase.global),
    `avis ${parLesAvis.global} vs base ${parLaBase.global}`);
  verifier('même nombre d’avis', parLesAvis.count === parLaBase.count);
}

console.log('\nAucun avis, et fiche incomplète');
{
  verifier('aucun avis donne 0', avgReviews({ reviews: [], avisCount: 0 }).global === 0);
  verifier('une fiche sans rien ne plante pas', avgReviews({}).count === 0);
  verifier('null ne plante pas', avgReviews(null).count === 0);
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Tout est cohérent.\n');
