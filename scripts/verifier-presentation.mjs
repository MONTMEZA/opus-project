/**
 * Vérifie que l'assistant de présentation écrit du français correct SANS IA.
 * C'est le cas qui compte : si l'Edge Function n'est pas branchée ou que le
 * téléphone est hors réseau, c'est ce texte-là que l'artisan verra.
 */
import { redigerLocalement, assezRempli, activitesDe, metiersEnToutesLettres } from '../src/lib/presentation.js';

let echecs = 0;
const verifier = (nom, condition, detail = '') => {
  if (condition) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

console.log('\nAccords et listes');
verifier('un métier', activitesDe(['Maçon']) === 'maçonnerie');
verifier('deux métiers', activitesDe(['Maçon', 'Carreleur']) === 'maçonnerie et carrelage');
verifier('trois métiers',
  activitesDe(['Plombier', 'Chauffagiste', 'Électricien']) === 'plomberie, chauffage et électricité');
verifier('métiers en toutes lettres',
  metiersEnToutesLettres(['Maçon', 'Carreleur']) === 'maçon et carreleur');

console.log('\nQuestionnaire incomplet');
verifier('vide : pas assez', !assezRempli({}));
verifier('sans chantiers : pas assez', !assezRempli({ anciennete: 'longue', equipe: 'seul' }));
verifier('complet : assez',
  assezRempli({ anciennete: 'longue', equipe: 'seul', chantiers: 'dalles béton' }));

console.log('\nRédaction complète');
const propositions = redigerLocalement({
  profil: { entreprise: 'Belaïd Maçonnerie', metiers: ['Maçon', 'Carreleur'], ville: 'Marseille (13)' },
  reponses: {
    anciennete: 'longue',
    equipe: 'petite',
    chantiers: 'Rénovation de façades, dalles béton, ouvertures dans le mur porteur',
    qualites: ['propre', 'prix', 'delais'],
    particularite: 'Je repasse voir le chantier un mois après la fin',
  },
});

verifier('trois propositions', propositions.length === 3, `reçu ${propositions.length}`);
/** Toute phrase doit commencer par une majuscule — la faute la plus visible. */
function minusculeApresPoint(texte) {
  return /[.!?] +[a-zà-öø-ÿ]/.test(texte);
}
/** « je » et « nous » dans le même texte : l'autre faute qui saute aux yeux. */
function melangeJeNous(texte) {
  const je = /\b(je |j'|mes clients|mon |décrivez-moi)/i.test(texte);
  const nous = /\b(nous |nos |notre |décrivez-nous)/i.test(texte);
  return je && nous;
}

propositions.forEach((p) => {
  verifier(`« ${p.titre} » n'est pas vide`, p.texte.length > 40, p.texte);
  verifier(`« ${p.titre} » sans double point`, !/\.\./.test(p.texte), p.texte);
  verifier(`« ${p.titre} » sans espace double`, !/ {2}/.test(p.texte), p.texte);
  verifier(`« ${p.titre} » se termine par un point`, /[.!?]$/.test(p.texte), p.texte);
  verifier(`« ${p.titre} » majuscule après chaque point`,
    !minusculeApresPoint(p.texte), p.texte);
  verifier(`« ${p.titre} » ne mélange pas je et nous`,
    !melangeJeNous(p.texte), p.texte);
});

console.log('\nRédaction minimale (le strict nécessaire)');
const mini = redigerLocalement({
  profil: { entreprise: 'Sanchez Plomberie', metiers: ['Plombier'], ville: 'Toulouse (31)' },
  reponses: { anciennete: 'debut', equipe: 'seul', chantiers: 'dépannage et petites rénovations' },
});
verifier('trois propositions aussi', mini.length === 3);
verifier('pas de virgule orpheline', !/, \./.test(mini.map((p) => p.texte).join(' ')));
mini.forEach((p) => {
  verifier(`« ${p.titre} » majuscule après chaque point`,
    !minusculeApresPoint(p.texte), p.texte);
  verifier(`« ${p.titre} » ne mélange pas je et nous`, !melangeJeNous(p.texte), p.texte);
});

console.log('\n--- les trois textes ---');
propositions.forEach((p) => console.log(`\n[${p.titre}]\n${p.texte}`));
console.log('\n--- version minimale ---');
mini.forEach((p) => console.log(`\n[${p.titre}]\n${p.texte}`));

console.log(echecs === 0 ? '\n✔ Tout est correct.\n' : `\n✘ ${echecs} problème(s).\n`);
process.exit(echecs === 0 ? 0 : 1);
