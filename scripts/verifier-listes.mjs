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
const fichiers = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
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
  ['msgDraft', 'createText', 'commentDraft'].forEach((nom) => {
    verifier(`\`${nom}\` n’est plus dans OpusApp`, !app.includes(nom),
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

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Rien ne monte en bloc, rien ne redessine tout. La fluidité '
  + 'RÉELLE, elle, ne se juge que sur l’iPhone.\n');
