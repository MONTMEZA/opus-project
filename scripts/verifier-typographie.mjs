/**
 * La mise en forme hors ligne est ce que l'artisan verra quand l'IA n'est pas
 * joignable. Elle doit être irréprochable sur les cas réels — un texte tapé au
 * pouce sur un chantier — et surtout ne JAMAIS changer les mots.
 */
import { nettoyerTypographie, aChange } from '../src/lib/typographie.js';

let echecs = 0;
const INSEC = ' ';

function verifier(nom, obtenu, attendu) {
  const ok = obtenu === attendu;
  if (!ok) echecs += 1;
  const lisible = (s) => JSON.stringify(s).replace(/\\u00a0/gi, '⍽');
  console.log(`  ${ok ? '✔' : '✘'} ${nom}`);
  if (!ok) console.log(`      obtenu  ${lisible(obtenu)}\n      attendu ${lisible(attendu)}`);
}

console.log('\nEspaces et ponctuation');
verifier('espace avant la virgule retirée',
  nettoyerTypographie('dalle béton , 40 m2'), 'Dalle béton, 40 m2.');
verifier('espace insécable avant le point d’interrogation',
  nettoyerTypographie('un devis ?'), `Un devis${INSEC}?`);
verifier('deux-points collés séparés',
  nettoyerTypographie('résultat:nickel'), `Résultat${INSEC}: nickel.`);
verifier('espaces multiples réduits',
  nettoyerTypographie('chantier     fini'), 'Chantier fini.');

console.log('\nMajuscules');
verifier('majuscule en tête',
  nettoyerTypographie('fini la dalle'), 'Fini la dalle.');
verifier('majuscule après un point',
  nettoyerTypographie('dalle coulée. béton lissé.'), 'Dalle coulée. Béton lissé.');
verifier('majuscule après un point d’exclamation',
  nettoyerTypographie('fini ! content du résultat'),
  `Fini${INSEC}! Content du résultat.`);

console.log('\nLignes');
verifier('lignes vides réduites à une',
  nettoyerTypographie('avant\n\n\n\naprès'), 'Avant\n\nAprès.');
verifier('majuscule en début de ligne',
  nettoyerTypographie('avant\naprès'), 'Avant\nAprès.');

console.log('\nPoint final');
verifier('point ajouté', nettoyerTypographie('travail terminé'), 'Travail terminé.');
verifier('point déjà là, pas doublé',
  nettoyerTypographie('travail terminé.'), 'Travail terminé.');
verifier('point d’exclamation conservé',
  nettoyerTypographie('nickel !'), `Nickel${INSEC}!`);
verifier('points de suspension',
  nettoyerTypographie('et la suite...'), 'Et la suite…');

console.log('\nCas réel, tapé au pouce');
verifier('note de chantier',
  nettoyerTypographie('fini la dalle chez le client a marseille   40m2 de beton lissé , nickel !'),
  `Fini la dalle chez le client a marseille 40m2 de beton lissé, nickel${INSEC}!`);

console.log('\nCe qui ne doit PAS changer');
const original = 'Fini la dalle chez le client a marseille, 40m2 de beton lissé.';
const apres = nettoyerTypographie(original);
verifier('un texte déjà propre est laissé tel quel', apres, original);
verifier('aucune faute corrigée (« a marseille » reste)',
  apres.includes('a marseille'), true);
verifier('aucun mot ajouté',
  apres.split(/\s+/).length, original.split(/\s+/).length);

console.log('\nCas limites');
verifier('texte vide', nettoyerTypographie(''), '');
verifier('espaces seuls', nettoyerTypographie('   '), '');
verifier('null', nettoyerTypographie(null), '');
verifier('aChange détecte une modification', aChange('fini la dalle', 'Fini la dalle.'), true);
verifier('aChange ne signale rien quand rien ne bouge', aChange('Fini.', 'Fini.'), false);

console.log(echecs === 0 ? '\n✔ Tout est correct.\n' : `\n✘ ${echecs} problème(s).\n`);
process.exit(echecs === 0 ? 0 : 1);
