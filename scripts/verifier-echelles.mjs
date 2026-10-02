/**
 * UNE SEULE CARTE, UNE SEULE ÉCHELLE — et un CLIQUET pour ne pas reculer.
 *
 * CE QUI A ÉTÉ MESURÉ, LE 02/10/2026
 * ----------------------------------
 * Au navigateur, sur six écrans : le Fil posait ses cartes à **12 px** du
 * bord, Découvrir, la Place des pros et les Demandes à **32**. On change
 * d'onglet, et tout le contenu saute de 20 px de côté. C'est ce qui fait
 * dire d'une application qu'elle est « assemblée de morceaux » sans qu'on
 * sache dire pourquoi.
 *
 * Et dans le code : **62 blocs blancs**, pour **12 combinaisons** de
 * bordure, de rayon et de remplissage.
 *
 * POURQUOI UN CLIQUET PLUTÔT QU'UN SEUIL
 * ---------------------------------------
 * Il reste des centaines de valeurs écrites à la main. Les corriger toutes
 * d'un coup serait un massacre : chacune peut déplacer quelque chose, et
 * personne ne relirait trois cents changements à l'œil.
 *
 * Un seuil fixe serait franchi le jour où quelqu'un ajoute un écran, et on
 * le relèverait « juste cette fois ». Un CLIQUET, lui, n'autorise que la
 * descente : on ne peut pas ajouter de valeur écrite à la main sans en
 * retirer autant. Le projet ne se répare pas en un jour — il cesse
 * simplement de se dégrader, et il s'améliore à chaque passage.
 *
 * Quand un nombre baisse, on le REDESCEND ici. C'est le seul geste permis.
 *
 *   npm run verifier-echelles
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
const fichiers = execFileSync('git',
  ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.js') && f !== 'src/theme.js');
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

/* LE CLIQUET. Ces nombres sont ceux du 02/10/2026, après le lot 7.
   On ne les REMONTE jamais : on les redescend quand on a fait le ménage. */
const PLAFOND = {
  /* 225 → 18 le 02/10/2026 : 120 tailles correspondaient EXACTEMENT à une
     marche de `T` (aucun pixel déplacé), et 87 en étaient à un demi-pixel
     — les 11,5 / 12,5 / 10,5 que `theme.js` dénonçait depuis le lot 1
     comme « deux tailles pour le prix d'une seule information ».
     Les 18 qui restent demandent un arbitrage par endroit : 14, 16, 17,
     19, 20, 21, 22 et deux 9. Le cliquet les empêche de se multiplier. */
  fontSize: 18,
  'espacement hors grille de 4': 359,
  lineHeight: 56,
  borderRadius: 21,
};

const MOTIFS = {
  fontSize: /fontSize:\s*[\d.]+/g,
  'espacement hors grille de 4': null,   // calculé à part
  lineHeight: /lineHeight:\s*[\d.]+/g,
  borderRadius: /borderRadius:\s*[\d.]+/g,
};

console.log('\nLe cliquet — ce qui est écrit à la main ne peut que diminuer');
{
  const compte = { fontSize: 0, 'espacement hors grille de 4': 0, lineHeight: 0, borderRadius: 0 };
  const pires = {};
  fichiers.forEach((f) => {
    const c = sansCommentaires(lire(f));
    let n = 0;
    Object.entries(MOTIFS).forEach(([cle, motif]) => {
      if (!motif) return;
      const m = c.match(motif);
      if (m) { compte[cle] += m.length; n += m.length; }
    });
    /* Un espacement hors de la grille de 4 : c'est lui qui fait que deux
       écrans voisins ne s'alignent jamais tout à fait. */
    const esp = c.match(/(?:padding|margin|gap)[A-Za-z]*:\s*(-?[\d.]+)/g) || [];
    const hors = esp.filter((x) => {
      const v = Number(x.split(':')[1]);
      return Number.isFinite(v) && v % 4 !== 0;
    });
    compte['espacement hors grille de 4'] += hors.length;
    n += hors.length;
    if (n) pires[f] = n;
  });

  Object.entries(PLAFOND).forEach(([cle, max]) => {
    const n = compte[cle];
    verifier(`${cle} : ${n} (plafond ${max})`, n <= max,
      n > max
        ? `${n - max} de trop. On n'ajoute pas de valeur écrite à la main — `
          + `elles passent par T, S, R ou interligne() dans theme.js.`
        : '');
    if (n < max) {
      console.log(`      ↓ ${max - n} de moins qu'au plafond : redescendez-le à ${n} dans ce fichier.`);
    }
  });

  const classement = Object.entries(pires).sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log(`\n      les cinq fichiers les plus en retard :\n${
    classement.map(([f, n]) => `        ${String(n).padStart(4)}  ${f}`).join('\n')}`);
}

console.log('\nUne seule gouttière, sur tous les écrans');
{
  const theme = lire('src/theme.js');
  verifier('`GOUTTIERE` existe', /export const GOUTTIERE = S\.lg;/.test(theme));

  /* La marge d'une liste va dans `contentContainerStyle`. Dans `style`,
     elle se retrouve AUSSI sur le cadre qui défile — c'est le 16 + 16 = 32
     mesuré le 02/10. */
  const fautifs = [];
  fichiers.forEach((f) => {
    const c = sansCommentaires(lire(f));
    /* on cherche un style de liste nommé, posé en `style=` ET qui porte une
       marge horizontale */
    const poses = [...c.matchAll(/<(?:FlatList|ScrollView)[^>]*?\sstyle=\{s\.(\w+)\}/gs)];
    poses.forEach((m) => {
      const nom = m[1];
      const def = c.match(new RegExp(`\\n\\s*${nom}:\\s*\\{([^{}]*)\\}`));
      if (def && /padding(Horizontal|Left|Right)?:/.test(def[1])) {
        fautifs.push(`${f} : <… style={s.${nom}}> porte une marge`);
      }
    });
  });
  verifier('aucune liste ne porte sa marge dans `style`',
    fautifs.length === 0,
    `${fautifs.join('\n      ')}\n      → la marge d'une liste va dans \`contentContainerStyle\``);

  ['src/screens/HomeScreen.js', 'src/screens/DecouvrirScreen.js',
    'src/screens/PlaceProScreen.js', 'src/screens/DemandesScreen.js'].forEach((f) => {
    verifier(`${f.split('/').pop()} emploie la gouttière`,
      /GOUTTIERE/.test(lire(f)), 'une marge écrite à la main désaligne cet écran des autres');
  });
}

console.log('\nUne seule carte de contenu');
{
  const theme = lire('src/theme.js');
  verifier('`CARTE` et `CARTE_PLEINE` existent',
    /export const CARTE = \{/.test(theme) && /export const CARTE_PLEINE =/.test(theme));
  verifier('…et l’angle y reste vif',
    /borderRadius: R\.vif/.test(theme.slice(theme.indexOf('export const CARTE = {'))),
    'une carte PORTE l’information : elle ne flotte pas');

  /* Les cartes de CONTENU — celles qui présentent une publication, une
     annonce, une demande, un avis, un artisan — passent toutes par là. */
  const DOIVENT = [
    ['src/components/PostCard.js', 'card'],
    ['src/components/ArtisanRow.js', 'row'],
    ['src/screens/DemandesScreen.js', 'carte'],
    ['src/screens/PlaceProScreen.js', 'carte'],
    ['src/screens/ProfilPublicScreen.js', 'carte'],
    ['src/screens/MesPublicationsScreen.js', 'carte'],
    ['src/screens/SosScreen.js', 'artisan'],
    ['src/screens/ProfilProScreen.js', 'reviewCard'],
    ['src/screens/DemandesRecuesScreen.js', 'carte'],
  ];
  DOIVENT.forEach(([f, nom]) => {
    const def = sansCommentaires(lire(f)).match(new RegExp(`\\n\\s*${nom}:\\s*\\{([\\s\\S]{0,220}?)\\}`));
    verifier(`${f.split('/').pop()} — \`${nom}\``,
      !!def && /\.\.\.CARTE/.test(def[1]),
      'cette carte présente un contenu : elle doit ressembler à toutes les autres');
  });
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Une gouttière, une carte, et le cliquet tient. Ce qui reste '
  + 'écrit à la main se corrige au fil des lots — jamais d’un bloc.\n');
