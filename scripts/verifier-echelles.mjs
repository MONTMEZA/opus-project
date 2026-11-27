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
/* `src/lib/devis-html.js` est SORTI PAR SON NOM (étape 2c-1, cahier §8.2,
   K3) : c'est la feuille de style d'un PAPIER A4, en millimètres et en
   points, pas un écran. Ses `margin: 4mm` et `padding: 2.5pt` ne sont pas des
   pixels de la grille de 4 — les compter « hors grille » ferait du cliquet un
   faux ami (6 valeurs sur 8 d'un CSS plausible, mesuré). Ses règles, elles,
   sont tenues par `verifier-apercu` (C.3, C.4 : unités du papier seulement,
   listes positives de propriétés et de valeurs). */
const HORS_DES_ECRANS = ['src/theme.js', 'src/lib/devis-html.js'];
const fichiers = execFileSync('git',
  ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.js') && !HORS_DES_ECRANS.includes(f));
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
  /* 359 → 354 le 05/10/2026, en posant l'étiquette « conseil » (lot C). Le
     cliquet a d'abord REFUSÉ le lot : six valeurs écrites à la main
     (`gap: 3`, `paddingVertical: 1`, `marginTop: 2`…) le faisaient passer à
     360. Remises sur la grille, le compte est descendu sous le plafond
     d'avant — c'est exactement ce que ce fichier est censé provoquer.
     354 → 353 le 19/10/2026 (lot T) : mesuré à 353 avant même les écrans
     du lot, qui n'ajoutent aucune valeur hors grille. On redescend. */
  'espacement hors grille de 4': 353,
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

/* UN MEMBRE DE `StyleSheet` QUE L'IPHONE NE CONNAÎT PAS — constaté le
   27/11/2026, capture du propriétaire à l'appui. React Native 0.86 n'a plus
   `StyleSheet.absoluteFillObject` (seul `absoluteFill`) ; `react-native-web`
   les a tous les deux. Étalé dans un style, `...StyleSheet.absoluteFillObject`
   ne posait donc RIEN sur le téléphone, et TOUT au navigateur : la carte de
   l'aperçu se rangeait sous le pied du devis, réduite à sa barre, pendant que
   chaque mesure au navigateur la voyait plein écran.

   LA PROPRIÉTÉ, pas une liste écrite à la main : les membres que l'iPhone
   connaît se LISENT dans `StyleSheetExports.js` de React Native (l'objet
   exporté), et chaque `StyleSheet.<membre>` de `src/` y est cherché. Un
   membre inconnu n'est toléré que sous le CLIQUET (les usages d'avant le
   27/11, qui ne peuvent que diminuer) et JAMAIS dans les fichiers de
   l'aperçu (2c-1). */
console.log('\nChaque `StyleSheet.<membre>` existe dans React Native du téléphone');
{
  const RN = 'node_modules/react-native/Libraries/StyleSheet/StyleSheetExports.js';
  let membres = null;
  try {
    const texte = lire(RN);
    const debut = texte.indexOf('export default {');
    if (debut >= 0) {
      membres = new Set();
      const re = /^ {2}(?:get\s+)?([A-Za-z_$][\w$]*)\s*(?=[,:(<])/gm;
      re.lastIndex = debut;
      let m;
      while ((m = re.exec(texte))) membres.add(m[1]);
    }
  } catch (e) {
    membres = null;
  }
  verifier('les membres de `StyleSheet` se lisent dans React Native (`npm ci` fait)',
    !!membres && membres.has('create') && membres.has('absoluteFill'),
    `${RN} : introuvable, ou sans « create » ni « absoluteFill ».`);
  if (membres) {
    /* Ce que les fichiers de l'aperçu n'ont JAMAIS le droit d'écrire, et le
       cliquet des autres : 16 le 27/11/2026 au matin, tous
       `absoluteFillObject` ; 0 le soir même, quand le propriétaire a décidé de
       tout corriger (« Tout corriger », après l'audit des 16, un critique
       adverse ayant confirmé chaque verdict). Il reste à ZÉRO : un seul
       membre inconnu remis quelque part rougit. */
    const APERCU = ['src/components/CarteApercu.js', 'src/components/AfficheurPdf.js',
      'src/components/AfficheurPdf.web.js', 'src/components/ApercuDevis.js'];
    const PLAFOND_INCONNUS = 0;
    const inconnus = [];
    [...fichiers, 'App.js'].forEach((f) => {
      let c;
      try { c = sansCommentaires(lire(f)); } catch (e) { return; }
      const re = /\bStyleSheet\.([A-Za-z_$][\w$]*)/g;
      let m;
      while ((m = re.exec(c))) {
        if (!membres.has(m[1])) inconnus.push({ f, membre: m[1] });
      }
    });
    const dansLApercu = inconnus.filter((x) => APERCU.includes(x.f));
    verifier('aucun membre inconnu de l’iPhone dans les fichiers de l’aperçu', dansLApercu.length === 0,
      dansLApercu.map((x) => `${x.f} : StyleSheet.${x.membre}`).join(' ; '));
    verifier(`membres inconnus de l’iPhone ailleurs : ${inconnus.length} (plafond ${PLAFOND_INCONNUS})`,
      inconnus.length <= PLAFOND_INCONNUS,
      `${inconnus.length - PLAFOND_INCONNUS} de trop : ${[...new Set(inconnus.map((x) => `StyleSheet.${x.membre}`))].join(', ')}`
        + ' n’existe pas dans React Native 0.86 — sur l’iPhone, il vaut `undefined` et ne pose rien. '
        + 'Écrivez `StyleSheet.absoluteFill`.');
    if (inconnus.length < PLAFOND_INCONNUS) {
      console.log(`      ↓ ${PLAFOND_INCONNUS - inconnus.length} de moins qu'au plafond : redescendez-le à ${inconnus.length} dans ce fichier.`);
    }
  }
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
