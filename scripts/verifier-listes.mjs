/**
 * AUCUNE LISTE NE MONTE TOUT D'UN COUP, ET AUCUN CHAMP NE REDESSINE L'ÉCRAN.
 *
 * CE QUE L'AUDIT A MESURÉ, LE 01/10/2026
 * --------------------------------------
 * Trois `FlatList` dans toute l'application, et **43 boucles `.map()` dans
 * des `ScrollView`**, réparties sur 19 écrans. Avec sept annonces de
 * démonstration, invisible. Avec deux cents — ce qui est le cas normal
 * d'une place de marché qui marche :
 *
 *     Place des pros  : 5 939 nœuds montés d'un coup
 *     Demandes        : 2 265
 *
 * C'est exactement le défaut qui bloquait l'iPhone plusieurs secondes au
 * démarrage le 29/09, mais sur l'écran où l'artisan cherche du travail. Une
 * fois virtualisées : **317 et 257**.
 *
 * Et trois champs de saisie vivaient encore dans `OpusApp`, donc chaque
 * lettre redessinait toute l'application. Mesuré, processeur bridé six fois :
 *
 *     description d'une publication  : 203 ms/lettre → 60
 *     message dans une conversation  : 132 → 48
 *     commentaire                    :  72 → 58
 *
 * CE QUI SE VÉRIFIE ICI
 * ---------------------
 * Qu'on ne recommence pas. Une boucle dans un `ScrollView` ne fait jamais
 * d'erreur, ne rougit aucun test, et ne se voit que le jour où il y a du
 * monde — c'est-à-dire trop tard.
 *
 *   npm run verifier-listes
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
/* QUATRIÈME fois qu'un contrôle accuse la DOCUMENTATION dans ce projet : le
   commentaire qui EXPLIQUE `setMsgDraft` contient le mot. On retire donc les
   commentaires avant de lire, comme `verifier-imports`, `verifier-retour` et
   `verifier-acces` le font déjà. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const fichiers = execFileSync('git',
  /* `--others` : un fichier NEUF, pas encore ajouté à git, échappait à
     tous les contrôles — constaté le 02/10/2026 avec `Ouverture.js`,
     qui est passé vert sans jamais avoir été lu. */
  ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.js'));

/** Les six listes qui portent du contenu produit par les utilisateurs. */
const LISTES = {
  'src/screens/HomeScreen.js': 'le fil',
  'src/screens/PlaceProScreen.js': 'les annonces',
  'src/screens/DemandesScreen.js': 'les demandes',
  'src/screens/MessagesScreen.js': 'les conversations',
  'src/screens/NotificationsScreen.js': 'les notifications',
  'src/screens/ConversationScreen.js': 'les messages',
  'src/screens/DemandesRecuesScreen.js': 'les demandes reçues',
};

console.log('\nToute liste qui grandit est virtualisée');
Object.entries(LISTES).forEach(([f, quoi]) => {
  verifier(`${quoi} — FlatList`, /<FlatList/.test(lire(f)),
    `${f} — une boucle dans un ScrollView monte TOUT`);
});

console.log('\n…et réglée, comme CLAUDE.md l’impose depuis le 29/09');
Object.entries(LISTES).forEach(([f, quoi]) => {
  const c = lire(f);
  const manque = ['initialNumToRender', 'maxToRenderPerBatch', 'windowSize']
    .filter((r) => !c.includes(r));
  verifier(`${quoi} — les trois réglages`, manque.length === 0, `${f} : il manque ${manque.join(', ')}`);
});

console.log('\nCe qui vit dans une liste est mémorisé');
{
  /* Sans `memo`, une liste redessine chacune de ses lignes visibles dès que
     l'écran bouge — y compris celles qui n'ont pas changé d'un pixel. */
  [
    ['src/components/PostCard.js', 'PostCard'],
    ['src/components/ArtisanRow.js', 'ArtisanRow'],
    ['src/screens/NotificationsScreen.js', 'la ligne de notification'],
    ['src/screens/MessagesScreen.js', 'la conversation'],
    ['src/screens/ConversationScreen.js', 'la bulle'],
    ['src/screens/DemandesScreen.js', 'la demande'],
  ].forEach(([f, quoi]) => {
    verifier(`${quoi}`, /React\.memo\(/.test(lire(f)), f);
  });
}

console.log('\nAucun champ de saisie ne vit dans OpusApp');
{
  const app = lire('src/OpusApp.js');
  /* Les trois qui y étaient encore. Un champ dont le texte vit dans
     `OpusApp` redessine TOUS les écrans à chaque lettre — c'est la panne
     des 219 ms de l'assistant IA, et elle se reproduit à l'identique. */
  /* SANS CASSE, et ce n'est pas un détail : le contrôle cherchait
     `msgDraft`, et `setMsgDraft` — avec un M majuscule — lui échappait.
     Les deux appels de `setMsgDraft` sont restés dans `OpusApp` après la
     suppression de l'état au lot 4 : ils levaient un `ReferenceError` à
     chaque fois qu'un particulier contactait un artisan. Le contrôle
     passait au vert pendant que l'application plantait. Trouvé par le
     linter du lot 8, pas par ce contrôle. */
  ['msgdraft', 'createtext', 'commentdraft'].forEach((nom) => {
    verifier(`\`${nom}\` n’est plus dans OpusApp (ni sous une autre casse)`,
      !sansCommentaires(app).toLowerCase().includes(nom),
      'src/OpusApp.js — le texte doit vivre dans le champ');
  });
  verifier('`ChampLocal` existe et garde son texte',
    fichiers.includes('src/components/ChampLocal.js')
    && /useImperativeHandle/.test(lire('src/components/ChampLocal.js')));

  const utilisent = ['src/screens/CreerScreen.js', 'src/screens/ConversationScreen.js',
    'src/components/Commentaires.js'];
  utilisent.forEach((f) => {
    verifier(`${f.split('/').pop()} s’en sert`, /ChampLocal/.test(lire(f)));
  });

  const champ = lire('src/components/ChampLocal.js');
  verifier('il ne remonte que les FRANCHISSEMENTS de seuil',
    /vide !== seuils\.current\.vide \|\| long !== seuils\.current\.long/.test(champ),
    'remonter à chaque lettre annulerait tout le gain');
  verifier('et `lire()` rend la valeur du moment, pas celle d’un rendu passé',
    /vif\.current/.test(champ),
    'sinon publier juste après la dernière lettre enverrait un texte amputé');
}

console.log('\nLa clé d’un métier ne s’affiche jamais brute');
{
  /* Rappel du 30/09 : une fiche enregistre `macon`, jamais « Maçon ». Le
     vide des demandes affichait la clé. */
  const d = lire('src/screens/DemandesScreen.js');
  verifier('le vide des demandes passe par `nomMetier`',
    !/Aucune demande en \$\{filtreMetier\}/.test(d), 'DemandesScreen.js');
}

console.log('\nLe cadre d’une photo suit la photo, entre deux bornes');
{
  /* Mesuré le 02/10/2026 sur les VRAIES photos du propriétaire : trois
     carrées (1179 × 1179) et une très verticale (1600 × 2845). Dans le
     cadre fixe de 16:10, la carrée perdait 37,5 % de sa hauteur et la
     verticale 64,9 %. Un cadre fixe en 4:5 n'aurait rien réglé : une photo
     de chantier en paysage y perdrait 55 % de sa LARGEUR.
     Ce contrôle fait tourner le calcul, il ne le relit pas. */
  const { cadrePhoto, PLUS_HAUT, PLUS_LARGE } = await import('../src/lib/cadre.js')
    .catch(() => ({}));
  if (!cadrePhoto) {
    verifier('`cadrePhoto` est exporté', false, 'src/lib/cadre.js');
  } else {
    verifier('une photo carrée est gardée telle quelle', cadrePhoto(1) === 1);
    verifier('une photo très verticale est ramenée à la borne portrait',
      Math.abs(cadrePhoto(1600 / 2845) - PLUS_HAUT) < 1e-9, `${cadrePhoto(1600 / 2845)}`);
    verifier('une photo très large est ramenée à la borne paysage',
      Math.abs(cadrePhoto(21 / 9) - PLUS_LARGE) < 1e-9);
    verifier('un rapport absurde ne casse pas la carte',
      cadrePhoto(0) === 1 && cadrePhoto(NaN) === 1 && cadrePhoto(undefined) === 1,
      'une image sans dimensions retombe sur le carré');
    verifier('les bornes gardent la carte lisible',
      PLUS_HAUT >= 0.6 && PLUS_LARGE <= 2,
      'sans bornes, une carte deviendrait une bande ou un mur de deux écrans');
  }
}

console.log('\nLes trois pages de Découvrir, qu’on fait défiler au doigt');
{
  /* DEMANDÉ PAR LE PROPRIÉTAIRE LE 04/10/2026 : « j'aimerais qu'on puisse
     directement scroller pour passer de "Pour moi" à "Place des pros" à
     "Demandes" ».

     LE RISQUE DE CE LOT N'EST PAS LE GESTE, C'EST LE MONTAGE. Un
     `ScrollView` monte TOUS ses enfants d'un coup : poser les trois écrans
     dedans triplerait le premier rendu de « Découvrir ». C'est exactement
     le défaut qui bloquait l'iPhone plusieurs secondes au démarrage le
     29/09/2026, et que tout ce lot-ci a servi à corriger. */
  const pages = sansCommentaires(lire('src/components/PagesGlissantes.js'));
  const app = sansCommentaires(lire('src/OpusApp.js'));

  verifier('une page n’est montée qu’une fois VISITÉE',
    /vues\.has\(i\) \? p\.rendu\(\) : null/.test(pages)
    && /rendu: \(\) =>/.test(app),
    'chaque page est une FONCTION, pas un élément : écrire les trois écrans '
    + 'directement les monterait tous les trois');

  verifier('…et elle le reste ensuite',
    /new Set\(vues\)\.add\(index\)/.test(pages),
    'revenir en arrière doit être instantané');

  /* UNE SEULE DEHORS COMME DEDANS. Sans cette fonction unique, glisser
     jusqu'à « Pour moi » n'aurait ni rechargé les demandes ni éteint le
     point — et personne ne l'aurait remarqué, puisque l'écran s'affiche.
     C'est la règle des voyants du 04/10. */
  verifier('la pastille et le doigt appellent la MÊME fonction',
    (app.match(/changerOngletDecouvrir/g) || []).length >= 3
    && /onChange=\{changerOngletDecouvrir\}/.test(app)
    && /onIndex=\{changerOngletDecouvrir\}/.test(app));

  verifier('…et lisent la MÊME liste d’onglets',
    /options=\{ongletsDecouvrir\}/.test(app)
    && /pages=\{ongletsDecouvrir\.map/.test(app),
    'deux listes séparées se désaligneraient le jour où l’on ajoute un '
    + 'onglet : la pastille dirait « Demandes » et le doigt ouvrirait '
    + 'autre chose');

  /* DEUX PORTES POUR SAVOIR OÙ L'ON EST ARRIVÉ. Mesuré au navigateur le
     04/10 : un défilement posé par programme ne déclenche AUCUNE fin
     d'élan. Et `Carrousel.js` dit depuis le lot 0 qu'un glissement lent se
     termine sans élan sur Android. Une seule des deux ne suffit pas. */
  verifier('l’arrivée se lit par les DEUX portes',
    /onScroll=\{arrivee\}/.test(pages) && /onMomentumScrollEnd=\{arrivee\}/.test(pages),
    'un glissement lent se termine sans élan : la pastille resterait '
    + 'bloquée sur l’onglet de départ');

  verifier('…et l’état ne change qu’au franchissement',
    /if \(page === pageAffichee\.current\) return;/.test(pages),
    'sinon chaque pixel redessinerait l’application — la leçon de la '
    + 'bannière du lot 6');

  verifier('le placement de départ se fait à la mise en page',
    /onLayout=\{auPremierRendu\}/.test(pages),
    '`contentOffset` est ignoré par react-native-web : sans ce recalage, '
    + 'on arriverait sur « Pour moi » au lieu de la Place des pros');

  /* AUCUNE DÉPENDANCE AJOUTÉE : le système arbitre le geste côté natif,
     comme pour le carrousel de photos. */
  const pkg = lire('package.json');
  verifier('aucun paquet de pagination ajouté',
    !/react-native-pager-view|react-native-tab-view/.test(pkg),
    'le système sait déjà départager un glissement horizontal d’un '
    + 'défilement vertical — la leçon de `Carrousel.js`');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Rien ne monte en bloc, rien ne redessine tout. La fluidité '
  + 'RÉELLE, elle, ne se juge que sur l’iPhone.\n');
