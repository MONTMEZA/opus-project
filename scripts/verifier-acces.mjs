/**
 * Aucun bouton ne doit rester muet.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * Un relevé sur `src/` n'avait trouvé AUCUN `accessibilityLabel` dans tout
 * le projet. Sur un chantier, ce n'est pas un détail : un artisan qui
 * travaille avec des lunettes, qui a agrandi les caractères de son iPhone
 * ou qui se sert de VoiceOver entendait « bouton » — sans savoir lequel.
 *
 * Le pire cas est le bouton qui ne porte QU'UNE ICÔNE : un cœur, une
 * flèche, une croix. Sans étiquette, il ne dit rigoureusement rien.
 *
 * Ce script relit tous les fichiers de `src/` et refuse de passer si un
 * `<Pressable>` n'a ni texte à l'intérieur, ni `accessibilityLabel`, ni la
 * mention explicite qu'il est masqué aux lecteurs d'écran (le cas de
 * l'avatar doublé par le nom juste à côté).
 *
 * Il ne remplace pas un essai avec VoiceOver — il empêche seulement la
 * régression la plus facile à commettre : ajouter un bouton et oublier.
 *
 * node scripts/verifier-acces.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RACINE = new URL('../src', import.meta.url).pathname;

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return chemin.endsWith('.js') ? [chemin] : [];
  });
}

/**
 * Le bloc JSX d'un `<Pressable>`, de son ouverture à SA fermeture.
 *
 * Le piège, découvert en écrivant ce script : un `<Pressable>` en contient
 * souvent un autre — le voile d'une fenêtre entoure son contenu, qui
 * entoure ses boutons. Chercher la première balise fermante venue donnait
 * donc au voile le contenu de ses enfants, et il passait pour étiqueté
 * alors qu'il ne l'était pas. On compte les ouvertures et les fermetures.
 */
function blocsPressable(texte) {
  const blocs = [];
  const re = /<Pressable\b/g;
  let m;
  while ((m = re.exec(texte)) !== null) {
    const debut = m.index;
    let i = debut;
    let profondeur = 0;
    let fin = -1;
    while (i < texte.length) {
      const ouvre = texte.indexOf('<Pressable', i + 1);
      const ferme = texte.indexOf('</Pressable>', i + 1);
      if (ferme === -1) break;
      if (ouvre !== -1 && ouvre < ferme) { profondeur += 1; i = ouvre; continue; }
      if (profondeur === 0) { fin = ferme; break; }
      profondeur -= 1;
      i = ferme;
    }
    /* Seul ce qui appartient EN PROPRE au bouton compte : ses attributs,
       plus son contenu direct. On coupe donc au premier enfant Pressable. */
    const complet = fin === -1 ? texte.slice(debut, debut + 400) : texte.slice(debut, fin);
    const enfant = complet.indexOf('<Pressable', 1);
    blocs.push({
      ligne: texte.slice(0, debut).split('\n').length,
      code: enfant === -1 ? complet : complet.slice(0, enfant),
    });
  }
  return blocs;
}

/* Un bouton parle s'il contient du texte, s'il porte une étiquette, ou
   s'il est explicitement retiré aux lecteurs d'écran parce que la même
   information est juste à côté. */
const PARLE = [
  '<Text',                        // il porte son propre texte
  'accessibilityLabel',           // il est nommé
  'accessibilityElementsHidden',  // il est volontairement retiré (voile de fenêtre)
  'accessibilityViewIsModal',     // il n'est pas un bouton : il retient le focus
];

let muets = 0;
let total = 0;
const sansRole = [];

for (const chemin of fichiers(RACINE)) {
  const texte = readFileSync(chemin, 'utf8');
  const court = chemin.slice(chemin.indexOf('/src/') + 1);

  for (const { ligne, code } of blocsPressable(texte)) {
    total += 1;
    if (!PARLE.some((mot) => code.includes(mot))) {
      muets += 1;
      console.error(`  ✘ ${court}:${ligne} — bouton sans texte ni étiquette`);
    } else if (code.includes('accessibilityLabel') && !code.includes('accessibilityRole')) {
      // Une étiquette sans rôle : le lecteur lit le texte mais n'annonce
      // pas « bouton ». C'est un avertissement, pas un échec.
      sansRole.push(`${court}:${ligne}`);
    }
  }
}

console.log(`\n${total} boutons relus dans src/`);
if (muets === 0) console.log('  ✔ aucun bouton muet');

/* Les composants partagés doivent porter leur rôle : c'est eux qui
   donnent le ton à tout le reste. */
const ui = readFileSync(join(RACINE, 'components/ui.js'), 'utf8');
const attendus = ['BtnMain', 'BtnOutline', 'BtnMini', 'Chip', 'ChipFollow', 'IconBtn'];
const manquants = attendus.filter((nom) => {
  const i = ui.indexOf(`export function ${nom}(`);
  if (i === -1) return true;
  const bloc = ui.slice(i, i + 900);
  return !bloc.includes('accessibilityRole');
});
if (manquants.length) {
  console.error(`  ✘ composants partagés sans accessibilityRole : ${manquants.join(', ')}`);
} else {
  console.log(`  ✔ les ${attendus.length} composants partagés portent leur rôle`);
}

if (sansRole.length) {
  console.log(`\n  ${sansRole.length} bouton(s) étiquetés mais sans rôle explicite :`);
  sansRole.slice(0, 8).forEach((x) => console.log(`     · ${x}`));
  if (sansRole.length > 8) console.log(`     … et ${sansRole.length - 8} autres`);
  console.log('  (ce n’est pas bloquant : le texte est lu, seul le mot « bouton » manque)');
}

console.log('');
if (muets || manquants.length) {
  console.error('✘ L’accessibilité a reculé.\n');
  process.exit(1);
}
console.log('✔ Tout ce qui s’appuie se nomme.\n');
