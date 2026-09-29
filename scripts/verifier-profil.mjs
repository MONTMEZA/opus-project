/**
 * Le profil professionnel : la certification RGE, et la recherche par
 * spécialité.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * Deux choses se décident ici, et toutes les deux sont faciles à casser
 * sans s'en apercevoir.
 *
 * 1. LE RGE A TROIS ÉTATS, PAS DEUX. « Certifié », « déclarée, en cours de
 *    vérification », et « non communiquée ». Le troisième doit rester
 *    NEUTRE : un carreleur n'a aucune raison d'être RGE, et afficher un feu
 *    rouge sur sa fiche lui ferait du tort pour un label qui ne le concerne
 *    pas. Le jour où quelqu'un simplifiera en `pro.rge ? vert : rouge`,
 *    c'est ici que ça se verra.
 *
 * 2. UNE SPÉCIALITÉ QUI NE REND PAS TROUVABLE NE SERT À RIEN. Le champ
 *    n'a d'intérêt que si la recherche le lit. On le vérifie des deux
 *    côtés : la fiche d'un artisan (écran Découvrir) et l'annonce d'un
 *    fournisseur (Place des pros).
 *
 * node scripts/verifier-profil.mjs
 */
import { detailRge, etatRge, VALIDE, ATTENTE, REFUSE, ABSENT } from '../src/lib/verification.js';
import { correspond, texteDePro, texteDe } from '../src/lib/recherche.js';
import { proProfiles } from '../src/data/demo.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

console.log('\nLa certification RGE a trois états');
{
  const certifie = { rge: true, rgeDeclare: true, rgeExpire: '09/2027' };
  const declare = { rge: false, rgeDeclare: true, rgePath: 'x/rge.pdf' };
  const rien = { rge: false, rgeDeclare: false };
  const refuse = { rge: false, rgeDeclare: true, rgePath: 'x/rge.pdf', verificationStatut: 'refuse' };

  verifier('vérifiée par l’équipe → certifié', etatRge(certifie) === VALIDE);
  verifier('la date de validité s’affiche',
    detailRge(certifie).valeur.includes('09/2027'), detailRge(certifie).valeur);
  verifier('déclarée mais pas contrôlée → en attente', etatRge(declare) === ATTENTE);
  verifier('déclarée ne dit JAMAIS « certifié »',
    !detailRge(declare).valeur.toLowerCase().includes('certifié'), detailRge(declare).valeur);
  verifier('documents refusés → refusée', etatRge(refuse) === REFUSE);
  verifier('rien de déclaré → absente', etatRge(rien) === ABSENT);
}

console.log('\nEt l’absence de RGE reste NEUTRE, jamais un feu rouge');
{
  verifier('« non communiquée » porte le drapeau neutre',
    detailRge({ rge: false, rgeDeclare: false }).neutre === true);
  verifier('« certifié » ne le porte pas', !detailRge({ rge: true }).neutre);
  verifier('« refusée » ne le porte pas',
    !detailRge({ rge: false, rgeDeclare: true, rgePath: 'x', verificationStatut: 'refuse' }).neutre);
}

console.log('\nLe badge RGE ne s’allume PAS sur une simple déclaration');
{
  // C'est la base qui le garantit (déclencheur tient_le_profil_pro), mais
  // l'écran ne doit pas non plus s'y tromper.
  const menteur = { rge: false, rgeDeclare: true, rgeNumero: 'QB/00000', rgeExpire: '12/2030' };
  verifier('déclarer un numéro ne suffit pas', etatRge(menteur) !== VALIDE);
}

console.log('\nUne spécialité rend l’artisan trouvable');
{
  const pro = {
    entreprise: 'YC Carrelage', metier: 'Carreleur', metiers: ['Carreleur'],
    ville: 'Toulouse (31)',
    specialites: ['Douche à l’italienne', 'Carrelage grand format'],
  };
  const texte = texteDePro(pro);
  verifier('trouvé par sa spécialité', correspond(texte, 'douche italienne'), texte);
  verifier('trouvé sans les accents', correspond(texte, 'italienne'));
  verifier('trouvé par son métier', correspond(texte, 'carreleur'));
  verifier('trouvé par sa ville', correspond(texte, 'toulouse'));
  verifier('PAS trouvé par un mot absent', !correspond(texte, 'charpente'));
  verifier('les deux mots sont exigés',
    !correspond(texte, 'douche charpente'),
    'une recherche à deux mots ne doit pas passer si un seul correspond');
}

console.log('\nEt sur une annonce, la spécialité de l’auteur compte aussi');
{
  const annonce = {
    titre: 'Déstockage', texte: 'Fin de série', metier: 'Fournisseur', ville: 'Lyon (69)',
    auteur: { entreprise: 'Sofrabat', metier: 'Fournisseur', specialites: ['Nacelle'] },
  };
  verifier('trouvée par la spécialité de l’auteur', correspond(texteDe(annonce), 'nacelle'));
  verifier('et par son synonyme de chantier (nacelle = PEMP)',
    correspond(texteDe(annonce), 'pemp'));
}

console.log('\nLes fiches de démonstration portent bien ces champs');
{
  const pros = Object.values(proProfiles);
  const avecTel = pros.filter((p) => p.telephone);
  const avecSpec = pros.filter((p) => p.specialites && p.specialites.length);
  verifier('au moins trois ont un téléphone', avecTel.length >= 3, `${avecTel.length} trouvés`);
  verifier('au moins trois ont des spécialités', avecSpec.length >= 3, `${avecSpec.length} trouvés`);
  verifier('aucune fiche ne dépasse douze spécialités',
    pros.every((p) => !p.specialites || p.specialites.length <= 12));
  verifier('aucune spécialité ne dépasse quarante caractères',
    pros.every((p) => (p.specialites || []).every((x) => x.length <= 40)));
  verifier('aucune zone d’intervention hors des bornes de la base (1 à 300 km)',
    pros.every((p) => p.zoneKm == null || (p.zoneKm >= 1 && p.zoneKm <= 300)));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le profil professionnel tient.\n');
