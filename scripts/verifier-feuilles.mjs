/**
 * LES FEUILLES QUI MONTENT DU BAS — et le clavier qui les recouvre.
 *
 * CE QUI A FAIT NAÎTRE CE CONTRÔLE
 * --------------------------------
 * Le propriétaire, le 04/10/2026, depuis son iPhone, en répondant à une
 * annonce :
 *
 *   « Le clavier de l'iPhone cache la partie où on écrit le texte et en
 *     même temps la croix pour le fermer. Et même si j'écris un texte et
 *     que je valide avec le clavier de l'iPhone, la fenêtre ne se ferme
 *     pas, donc je suis bloqué. »
 *
 * Trois défauts en une phrase :
 *
 *   1. une feuille collée en bas ne bouge pas quand le clavier s'ouvre ;
 *   2. la croix de fermeture passe donc sous le clavier : plus de sortie ;
 *   3. sur un champ MULTILIGNE, « Entrée » insère un retour à la ligne.
 *      Elle ne valide rien, et elle ne peut pas.
 *
 * L'application a l'air plantée alors qu'elle fonctionne. C'est le pire
 * genre de défaut : celui qui donne tort au programme.
 *
 * ET IL ÉTAIT À DEUX ENDROITS
 * ---------------------------
 * La réponse à une annonce, et le SIGNALEMENT — c'est-à-dire le chemin par
 * lequel on demande de l'aide. `QuoteModal` et `CommentsSheet` géraient
 * déjà le clavier, chacun à leur façon. Écrire le bon comportement une
 * fois est la seule manière d'empêcher la troisième.
 *
 *   npm run verifier-feuilles
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

/* Cinquième fois qu'un contrôle accuserait la DOCUMENTATION qui explique
   le défaut : on retire les commentaires avant de lire du code. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const brique = lire('src/components/FeuilleBas.js');

console.log('\nLa brique partagée fait les trois choses');
{
  const c = sansCommentaires(brique);
  verifier('elle monte avec le clavier',
    /KeyboardAvoidingView/.test(c) && /behavior=\{Platform\.OS === 'ios' \? 'padding'/.test(c),
    'sans elle, le clavier recouvre le champ ET la croix');

  verifier('le voile ferme la feuille — la sortie de secours',
    /<Pressable style=\{s\.fond\} onPress=\{onFermer\}/.test(c),
    'quoi qu’il arrive à la mise en page, il reste une bande à toucher');

  /* Sans lui, le premier appui sur un bouton alors que le clavier est
     ouvert ne fait que refermer le clavier. On appuie, « rien ne se
     passe », on recommence. */
  verifier('un bouton répond du PREMIER appui, clavier ouvert',
    /keyboardShouldPersistTaps="handled"/.test(c));

  verifier('le contenu défile',
    /<ScrollView/.test(c) && /maxHeight: hauteurMax/.test(c),
    'sur un petit écran avec un grand clavier, une feuille qui ne défile '
    + 'pas cache son propre bouton');

  /* `box-none` : l'ancrage occupe tout l'écran pour pousser la feuille vers
     le bas, mais il ne doit RIEN intercepter — sinon il avale les touches
     destinées au voile, et la sortie de secours disparaît. */
  verifier('l’ancrage n’avale pas les touches du voile',
    /pointerEvents="box-none"/.test(c));
}

console.log('\nAucune feuille ne réinvente la sienne');
{
  /* On lit TOUS les fichiers de `src/`, y compris ceux qui ne sont pas
     encore ajoutés à git — c'est ainsi qu'`Ouverture.js` était passé
     entre les mailles le 02/10. */
  const fichiers = execFileSync('git',
    ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f.endsWith('.js') && !f.endsWith('FeuilleBas.js'));

  const fautives = [];
  fichiers.forEach((f) => {
    const c = sansCommentaires(lire(f));
    if (!/<Modal/.test(c)) return;

    /* CE N'EST PAS « TOUTE FENÊTRE », C'EST UNE FORME PRÉCISE — et le
       contrôle l'a appris en se trompant. Il a d'abord accusé
       `SelecteurMetiers`, qui est une fenêtre PLEIN ÉCRAN
       (`transparent={false}`) : sa croix est en HAUT, le clavier monte du
       bas, il ne peut donc enfermer personne. Un champ caché par le
       clavier dans une liste plein écran, on le fait défiler ; une feuille
       posée en bas, non.
       Le risque, c'est la feuille TRANSPARENTE collée au bas de l'écran. */
    if (!/transparent(\s|=\{true\}|>)/.test(c)) return;

    /* Une feuille SANS champ de saisie n'a pas ce problème : le clavier ne
       s'ouvre jamais dessus. `ChoixPiece` est dans ce cas. */
    if (!/<TextArea|<Field|<TextInput|<ChampLocal/.test(c)) return;

    if (/FeuilleBas/.test(c) || /KeyboardAvoidingView/.test(c)) return;
    fautives.push(f);
  });

  verifier('toute feuille avec un champ gère le clavier',
    fautives.length === 0,
    `${fautives.join('\n      ')}\n      → passez par <FeuilleBas>, ou `
    + 'enveloppez d’un KeyboardAvoidingView comme QuoteModal');
}

console.log('\nUne liste virtualisée ne se met pas dans un ScrollView');
{
  /* React Native le dit — « VirtualizedLists should never be nested inside
     plain ScrollViews with the same orientation » — et ça ne se voit qu'au
     doigt. D'où `defile={false}`, qui laisse la liste défiler seule. */
  const c = sansCommentaires(brique);
  verifier('la feuille sait s’effacer',
    /defile = true/.test(c) && /defile \?/.test(c));

  const reponses = sansCommentaires(lire('src/components/ReponsesAnnonce.js'));
  verifier('…et la liste des réponses s’en sert',
    /<FlatList/.test(reponses) ? /defile=\{false\}/.test(reponses) : true,
    'une FlatList dans un ScrollView casse le défilement');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le clavier ne peut plus enfermer personne dans une feuille.\n');
