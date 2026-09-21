/**
 * La recherche par mots-clés de la Place des pros.
 *
 * Elle est simple, donc elle se teste entièrement — et elle DOIT l'être :
 * une recherche qui rend zéro résultat sur un catalogue rempli est la
 * meilleure façon de faire croire que la page est vide.
 *
 * node scripts/verifier-recherche.mjs
 */
import { normaliser, motsDe, correspond, texteDe, GROUPES } from '../src/lib/recherche.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

console.log('\nNormalisation');
verifier('les accents tombent', normaliser('Plâtre Élagage') === 'platre elagage',
  normaliser('Plâtre Élagage'));
verifier('les espaces en trop disparaissent', normaliser('  deux   mots ') === 'deux mots');

console.log('\nDécoupage en mots');
verifier('la ponctuation sépare', JSON.stringify(motsDe('placo, BA13 !')) === '["placo","ba13"]',
  JSON.stringify(motsDe('placo, BA13 !')));
verifier('les mots d’une lettre sont écartés', JSON.stringify(motsDe('a m nacelle')) === '["nacelle"]',
  JSON.stringify(motsDe('a m nacelle')));

console.log('\nCorrespondance');
const annonce = {
  titre: 'Placo BA13 hydrofuge — palette complète',
  texte: 'Nouvelle gamme hydrofuge, 60 plaques par palette, livraison sous 48 h.',
  ville: 'Lyon (69)',
  auteur: { entreprise: 'Négoce Rhône', metier: 'Plaquiste', metiers: ['Plaquiste'] },
};
const foin = texteDe(annonce);

verifier('une recherche vide laisse tout passer', correspond(foin, '') && correspond(foin, '   '));
verifier('« placo » trouve', correspond(foin, 'placo'));
verifier('« PLACO » trouve aussi (casse ignorée)', correspond(foin, 'PLACO'));
verifier('« hydrofuge » trouve dans le détail', correspond(foin, 'hydrofuge'));
verifier('« lyon » trouve par la ville', correspond(foin, 'lyon'));
verifier('« negoce » trouve par l’entreprise, sans accent', correspond(foin, 'negoce'));
verifier('« plaque » trouve « plaques » (pluriel)', correspond(foin, 'plaque'));

verifier('TOUS les mots doivent être présents', correspond(foin, 'placo hydrofuge'));
verifier('un mot absent fait échouer', !correspond(foin, 'placo nacelle'),
  'placo est là, nacelle non : l’annonce ne doit PAS remonter');
verifier('un mot sans rapport ne trouve rien', !correspond(foin, 'chaudiere'));

console.log('\nVocabulaire du bâtiment');
const autre = texteDe({ titre: 'Plaques de plâtre standard', texte: 'Palette de 50.' });
verifier('« placo » trouve « plaque de plâtre »', correspond(autre, 'placo'),
  'c’est le même produit, deux noms');
verifier('« ba13 » trouve « plaque de plâtre »', correspond(autre, 'ba13'));
verifier('« placo » ne trouve PAS une annonce de carrelage',
  !correspond(texteDe({ titre: 'Carrelage grès cérame', texte: '60x60.' }), 'placo'),
  'une équivalence fausse est pire que pas d’équivalence');

const mal = texteDe({ titre: 'Échafaudage roulant 6 m', texte: 'Location à la semaine.' });
verifier('« echaffaudage » (faute courante) trouve quand même', correspond(mal, 'echaffaudage'));

/* L'équivalence doit marcher DANS LES DEUX SENS. C'est précisément ce qui
   manquait à la première version : « placo » trouvait « plaque de plâtre »,
   mais « plaque » ne trouvait pas « placo ». */
console.log('\nLes équivalences marchent dans les deux sens');
GROUPES.forEach((groupe) => {
  groupe.forEach((depuis) => {
    groupe.forEach((vers) => {
      if (depuis === vers) return;
      const contenu = texteDe({ titre: `Lot de ${vers}`, texte: 'Disponible.' });
      verifier(`« ${depuis} » trouve « ${vers} »`, correspond(contenu, depuis));
    });
  });
});

/* Et l'équivalence ne doit PAS déborder : un mot d'une expression, pris
   seul, n'est pas un synonyme. « plaque » ne doit pas ramener tout le placo
   — il existe des plaques de cuisson et des plaques d'égout. */
console.log('\nLes équivalences ne débordent pas');
verifier('« plaque » seul ne ramène pas « placo »',
  !correspond(texteDe({ titre: 'Lot de placo', texte: 'Disponible.' }), 'plaque'));
verifier('« laine » seul ne ramène pas « isolant »',
  !correspond(texteDe({ titre: 'Isolant semi-rigide', texte: 'Disponible.' }), 'laine'));
verifier('« plaque de platre » ramène bien « placo »',
  correspond(texteDe({ titre: 'Lot de placo', texte: 'Disponible.' }), 'plaque de platre'),
  'l’expression entière, elle, est bien un synonyme');

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Tout est cohérent.\n');
