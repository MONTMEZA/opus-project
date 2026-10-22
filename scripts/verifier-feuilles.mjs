/**
 * LE CLAVIER NE RECOUVRE PLUS CE QU'ON ÉCRIT — les deux formes.
 *
 * Ce contrôle s'appelle toujours `verifier-feuilles`, parce que c'est une
 * feuille du bas qui l'a fait naître le 04/10. Il garde désormais les DEUX
 * formes du même défaut — et la seconde vient de ce qu'il affirmait, à
 * tort, pour écarter les fenêtres plein écran. Voir la section
 * « AUCUN CONTENEUR QUI DÉFILE » plus bas.
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
  /* LA BALISE, PAS LE MOT — onzième fois dans ce projet qu'un contrôle
     vise un texte au lieu d'une chose, et celui-ci a été pris la main dans
     le sac : en remplaçant `<KeyboardAvoidingView>` par `<View>` à la
     main, la feuille ne montait plus du tout et le contrôle restait VERT.
     La ligne d'`import` nomme encore le composant. */
  verifier('elle monte avec le clavier',
    /<KeyboardAvoidingView/.test(c) && /behavior=\{Platform\.OS === 'ios' \? 'padding'/.test(c),
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

    if (/<FeuilleBas/.test(c) || /<KeyboardAvoidingView/.test(c)) return;
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

/* ======================================================================
 *  AUCUN CONTENEUR QUI DÉFILE NE LAISSE LE CLAVIER RECOUVRIR SES CHAMPS
 * ======================================================================
 *
 * CE QUE CE CONTRÔLE AFFIRMAIT, ET QUI ÉTAIT FAUX. Il écartait les
 * fenêtres plein écran avec ce raisonnement, écrit plus haut dans ce
 * fichier : « un champ caché par le clavier dans une liste plein écran, on
 * le fait défiler ». Le propriétaire l'a démenti le 11/10/2026, depuis son
 * iPhone, sur le formulaire client :
 *
 *   « le clavier bloque un peu les champs du bas du formulaire »
 *
 * On PEUT le faire défiler. RIEN ne le fait : vérifié dans le source de
 * React Native 0.86.3, `scrollResponderScrollNativeHandleToKeyboard`
 * n'a aucun appelant.
 *
 * La distinction du 04/10 reste juste — une feuille du bas enferme, une
 * fenêtre plein écran non — mais elle ne rendait pas le second cas
 * acceptable. D'où `src/lib/clavier.js`, et d'où cette section. */
console.log('\nLa brique du clavier, et les deux propriétés qu’elle porte');
{
  const clavier = lire('src/lib/clavier.js');
  const c = sansCommentaires(clavier);

  verifier('le premier appui agit, clavier ouvert',
    /keyboardShouldPersistTaps: 'handled'/.test(c),
    'sans lui, le premier appui sur un bouton ne fait que refermer le '
    + 'clavier. On appuie, « rien ne se passe », on recommence.');

  verifier('…et le champ actif REMONTE au-dessus du clavier',
    /automaticallyAdjustKeyboardInsets: true/.test(c),
    'c’est la seule des deux approches qui AMÈNE le champ : elle pose '
    + 'l’inset ET défile jusqu’au premier répondant '
    + '(RCTScrollViewComponentView.mm). Un KeyboardAvoidingView le rend '
    + 'seulement atteignable.');

  /* Un fichier de propriétés n'a rien à importer. S'il chargeait React
     Native, il ne pourrait pas être ouvert par `node` — la leçon de
     `cloudinary-adresses.js`, et celle de `verifier-montage`. */
  verifier('…et elle n’importe RIEN',
    !/^import /m.test(clavier),
    'un fichier que `node` ne peut pas ouvrir ne peut pas être éprouvé.');

  /* LA RÈGLE QUI COÛTERAIT LE PLUS CHER À REDÉCOUVRIR. Le natif mute
     `contentInset` synchronement sur la notification UIKit ; le
     KeyboardAvoidingView passe par un événement ASYNCHRONE vers
     JavaScript puis un `setState`. Le natif est donc toujours premier, il
     pose l'inset sur la boîte d'AVANT, et rien ne le recalcule : la
     hauteur du clavier est comptée DEUX FOIS. */
  verifier('…et le fichier DIT qu’on ne cumule pas les deux',
    /DEUX FOIS/.test(clavier) && /KeyboardAvoidingView/.test(clavier),
    'une brique qui ne dit pas ce qu’elle exclut se fera cumuler avec '
    + 'l’autre mécanisme au prochain lot.');
}

console.log('\nTout conteneur qui défile et qui porte un champ est couvert');
{
  const fichiers = execFileSync('git',
    ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f.endsWith('.js') && f !== 'src/lib/clavier.js');

  /* `ChampMontant` et `ChampDesignation` (lot 1 du devis) : ce sont des
     champs, et un fichier qui les pose dans un conteneur qui défile a les
     mêmes devoirs. Sans eux, la carte d'une ligne de devis — six champs —
     échappait à ce contrôle. */
  const CHAMPS = /<Field|<TextArea|<TextInput|<ChampLocal|<ChampVille|<ChampMotDePasse|<ChampMontant|<ChampDesignation/;
  /* `<Zone` de `Commentaires.js` n'est volontairement PAS ici : ce
     composant ne possède pas son conteneur, il le reçoit de son hôte
     (`CommentsSheet`, qui monte avec le clavier, ou `PostCard`, qui vit
     dans la liste du fil). Un fichier qui n'ouvre aucun conteneur n'a rien
     à régler. */
  const OUVRE = /<(ScrollView|FlatList|Animated\.ScrollView|Animated\.FlatList)\b/g;

  const nus = [];
  const cumulent = [];

  fichiers.forEach((f) => {
    const c = sansCommentaires(lire(f));
    if (!CHAMPS.test(c)) return;

    /* CE QUI EST COLLÉ AU BAS DE L'ÉCRAN MONTE, et c'est l'autre
       mécanisme : une feuille, une barre de saisie de conversation, un
       formulaire court et centré. Ces fichiers-là sont couverts, et ils ne
       doivent justement PAS porter `CLAVIER` en plus. */
    const monte = /<FeuilleBas|<KeyboardAvoidingView/.test(c);
    const insets = /\{\.\.\.CLAVIER\}/.test(c);

    if (monte && insets) { cumulent.push(f); return; }
    if (monte) return;

    /* On regarde chaque balise ouvrante, une par une : un fichier peut
       porter une rangée de pastilles HORIZONTALE, qui n'a rien à voir avec
       le clavier — le code natif sort lui-même tout de suite sur une liste
       horizontale. */
    let m;
    OUVRE.lastIndex = 0;
    while ((m = OUVRE.exec(c)) !== null) {
      const fin = c.indexOf('>', m.index);
      const balise = c.slice(m.index, fin === -1 ? c.length : fin);
      if (/\bhorizontal\b/.test(balise)) continue;
      if (!/\{\.\.\.CLAVIER\}/.test(balise)) {
        nus.push(`${f} — <${m[1]}> ligne ${c.slice(0, m.index).split('\n').length}`);
      }
    }
  });

  verifier('aucun conteneur vertical n’est laissé nu',
    nus.length === 0,
    `${nus.join('\n      ')}\n      → étalez {...CLAVIER} dessus `
    + '(src/lib/clavier.js), ou passez par <FeuilleBas> si c’est une '
    + 'feuille collée au bas de l’écran.');

  verifier('…et personne ne cumule les deux mécanismes',
    cumulent.length === 0,
    `${cumulent.join('\n      ')}\n      → la hauteur du clavier serait `
    + 'comptée deux fois. Il faut choisir : ce qui est collé au bas MONTE, '
    + 'ce qui défile remonte son CONTENU.');
}

console.log('\nCe qui montait avec le clavier continue de monter');
{
  /* Ces quatre-là ne passent pas par `CLAVIER`, et c'est voulu. Le dire
     ici empêche qu'on leur retire leur `KeyboardAvoidingView` un jour en
     croyant que la brique du 11/10 l'a remplacé — elle ne remplace que le
     cas du conteneur qui défile. */
  const COLLES = {
    'src/components/FeuilleBas.js': 'la brique des feuilles du bas',
    'src/components/CommentsSheet.js': 'le panneau des commentaires du fil vidéo',
    'src/components/QuoteModal.js': 'la demande de devis',
    'src/screens/ConversationScreen.js': 'la barre de saisie d’une conversation',
    'src/screens/AuthScreen.js': 'le formulaire centré de connexion',
  };
  Object.entries(COLLES).forEach(([f, quoi]) => {
    verifier(`${quoi} monte toujours`,
      /<KeyboardAvoidingView/.test(sansCommentaires(lire(f))),
      `${f} a perdu son KeyboardAvoidingView. Ce qui est collé au bas de `
      + 'l’écran doit MONTER : l’inset du contenu n’y suffit pas.');
  });
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Le clavier n’enferme personne, et ne recouvre plus ce qu’on écrit.\n');
