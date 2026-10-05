/**
 * LES VOYANTS — un point qui promet doit tenir sa promesse.
 *
 * CE QUI A FAIT NAÎTRE CE CONTRÔLE
 * --------------------------------
 * Le propriétaire, le 04/10/2026 :
 *
 *   « Quand on est connecté sur Opus, on voit un point orange sur
 *     Découvrir, ça veut dire qu'il y a quelque chose à aller voir, c'est
 *     parfait. Après on clique sur Découvrir et là on a trois choix —
 *     Pour moi, Place des pros, Demandes — mais le point ne s'affiche pas,
 *     donc on ne sait pas ce qui doit être vu. »
 *
 * Le défaut n'était pas l'absence de point sur les onglets. C'était que la
 * barre du bas calculait SA condition dans son coin, avec sa propre
 * formule, sans que rien ne la relie à ce qu'on trouverait derrière.
 *
 * LA RÈGLE QUI EN SORT, ET QUI VAUT POUR TOUT CE QUI SUIVRA
 * ---------------------------------------------------------
 *   > **Un voyant de parent est exactement le OU de ses enfants.**
 *
 * Pas « à peu près ». Un voyant qui s'allume pour quelque chose qu'on ne
 * trouvera jamais s'éteint dans la tête de celui qui le regarde : au bout
 * de trois fouilles inutiles, on cesse de le voir. C'est exactement ce qui
 * était arrivé à la cloche des notifications, et c'est pour ça qu'ouvrir
 * « Pour moi » ÉTEINT le signal.
 *
 * ET LA COULEUR EST UNE QUESTION DE MESURE, PAS DE GOÛT
 * -----------------------------------------------------
 * Un point de 7 px est un élément graphique : il lui faut 3 : 1 contre son
 * fond. L'orange de signature n'en donne que 2,76 sur le fond clair de la
 * barre d'onglets — on ne le distingue pas. Les contrastes sont donc
 * RECALCULÉS ici à chaque passage, comme dans `verifier-cibles`.
 *
 *   npm run verifier-voyants
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');

/* Quatre fois déjà, un contrôle a accusé la DOCUMENTATION qui expliquait
   le défaut. On retire les commentaires avant de lire. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const app = sansCommentaires(lire('src/OpusApp.js'));
const ui = sansCommentaires(lire('src/components/ui.js'));
const nav = sansCommentaires(lire('src/components/BottomNav.js'));
const theme = lire('src/theme.js');

console.log('\nLe point du bas est exactement le OU des onglets');
{
  /* LES DEUX VOYANTS SONT NOMMÉS, une seule fois chacun. Une formule
     recopiée dans la barre du bas est précisément ce qui a produit le
     défaut : elle dérive sans que personne ne s'en aperçoive. */
  verifier('les voyants sont nommés, pas recopiés',
    /const voyantPourMoi =/.test(app)
    && /const voyantDemandes =/.test(app)
    && /const voyantDecouvrir =/.test(app));

  verifier('…et le voyant parent est leur OU',
    /const voyantDecouvrir = voyantPourMoi \|\| voyantDemandes;/.test(app),
    'un parent qui s’allume pour autre chose envoie chercher dans le vide');

  /* La barre du bas ne doit PLUS porter de formule : juste le nom. */
  const dots = app.slice(app.indexOf('dots={{'), app.indexOf('dots={{') + 260);
  verifier('la barre du bas ne recalcule rien',
    /decouvrir: voyantDecouvrir,/.test(dots)
    && !/decouvrir:[^,]*(\|\||&&)/.test(dots),
    'c’est la deuxième formule qui a créé le défaut du 04/10/2026');

  /* Et chaque voyant nommé est VRAIMENT posé sur un onglet : sans cela, on
     retomberait sur un parent qui s'allume et des enfants muets. */
  verifier('chaque voyant est posé sur son onglet',
    /key: 'pourmoi'[^}]*dot: voyantPourMoi/.test(app)
    && /key: 'demandes'[^}]*dot: voyantDemandes/.test(app),
    'c’est exactement ce qui manquait');

  /* « Place des pros » n'en porte pas, et c'est voulu : rien n'y est
     adressé à quelqu'un en particulier, donc un voyant ne s'y éteindrait
     jamais. */
  verifier('« Place des pros » n’en porte pas',
    /key: 'artisans', label: 'Place des pros' \}/.test(app),
    'un voyant sur une place publique ne se termine jamais');
}

console.log('\nLe composant d’onglets sait le montrer, et le DIRE');
{
  verifier('`PillToggle` affiche le point',
    /o\.dot && <View style=\{\[s\.pillDot/.test(ui));

  /* UN POINT EST UNE INFORMATION, PAS UNE DÉCORATION. Sans ce mot dans
     l'étiquette, VoiceOver annonce « Pour moi » que l'onglet ait du neuf
     ou non — la même règle que la barre du bas tient déjà. */
  verifier('…et il entre dans l’étiquette parlée',
    /accessibilityLabel=\{o\.label \+ \(o\.dot \? ', nouveautés' : ''\)\}/.test(ui),
    'un voyant qu’on ne peut qu’apercevoir n’existe pas pour qui se sert '
    + 'de VoiceOver');

  verifier('la barre du bas tient la même règle',
    /nouveautés/.test(nav),
    'les deux voyants doivent se dire de la même façon');
}

console.log('\nUn point de 7 px doit se VOIR — contraste recalculé');
{
  const luminance = (hex) => {
    const h = hex.replace('#', '');
    const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]);
  };
  const contraste = (a, b) => {
    const [x, y] = [luminance(a), luminance(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const couleur = (nom) => {
    const m = theme.match(new RegExp(`\\n\\s*${nom}:\\s*'(#[0-9A-Fa-f]{6})'`));
    return m ? m[1] : null;
  };

  /* 3 : 1, c'est le seuil d'un élément GRAPHIQUE — un point n'est pas du
     texte, mais il porte une information, donc il doit se distinguer. */
  const SEUIL = 3;
  [
    ['le point d’un onglet au repos', 'accentTexte', 'bg'],
    ['le point de l’onglet choisi', 'accent', 'ink'],
    ['le point de la barre du bas', 'accent', 'surface'],
  ].forEach(([quoi, encre, fond]) => {
    const a = couleur(encre);
    const b = couleur(fond);
    const k = a && b ? contraste(a, b) : 0;
    verifier(`${quoi} : ${k.toFixed(2)} : 1`, k >= SEUIL,
      `${encre} sur ${fond} — il en faut ${SEUIL} pour un élément graphique`);
  });

  /* LE PIÈGE QU'ON VIENT D'ÉVITER, et qui reviendrait tout seul : l'orange
     de signature sur le fond clair de la barre d'onglets ne donne que
     2,76. C'est la règle du lot 5 — `accent` pour ce qu'on REMPLIT,
     `accentTexte` pour ce qu'on doit distinguer sur un fond clair. */
  const surFondClair = contraste(couleur('accent'), couleur('bg'));
  verifier('…et l’orange de signature n’y conviendrait PAS',
    surFondClair < SEUIL,
    `accent sur bg donne ${surFondClair.toFixed(2)} : si ce contrôle passe `
    + 'au vert ici, la palette a changé et ce choix est à refaire');

  verifier('le composant choisit l’encre selon le fond',
    /pillDotOn/.test(ui) && /backgroundColor: C\.accentTexte/.test(ui));

  /* L'ANNEAU DE L'ONGLET ACTIF est lui aussi un élément graphique : il lui
     faut 3 : 1 sur le fond de la barre. Posé ici, et pas dans le bloc
     suivant, parce que c'est ici que vivent `contraste` et `couleur` — et
     que tous les contrastes recalculés de ce contrôle doivent se lire
     ensemble. */
  const anneauSurBarre = contraste(couleur('accent'), couleur('surface'));
  verifier(`l’anneau orange sur la barre : ${anneauSurBarre.toFixed(2)} : 1`,
    anneauSurBarre >= SEUIL,
    'si la palette change et que ce chiffre passe sous 3, l’anneau cesse '
    + 'de se voir — et le signal disparaît sans que rien ne le dise');
}

console.log('\nLa barre du bas dit AUSSI où l’on se trouve');
{
  /* ====================================================================
     DEMANDÉ PAR LE PROPRIÉTAIRE LE 05/10/2026 : « quand on va dans
     Découvrir ou dans le menu, on ne voit pas forcément où on est ».

     Il avait raison, et c'était mesurable : le seul signal était la
     couleur de l'icône, et le contraste entre l'inactive (`muted`) et
     l'active (`ink`) vaut 3,02 : 1 — le minimum pour un élément
     graphique. Perceptible, et c'est tout.

     L'onglet Profil, lui, avait DÉJÀ son anneau orange. Ce lot l'étend
     aux quatre autres, avec UNE seule règle.
     ==================================================================== */
  verifier('l’anneau de l’onglet actif est calculé UNE fois',
    /const anneau = on \? \(dark \? '#fff' : C\.accent\) : 'transparent'/.test(nav),
    'deux façons de dire « vous êtes ici » dans la même barre finiraient '
    + 'par se contredire — c’est exactement le défaut des voyants du 04/10');

  verifier('…et la photo de profil s’en sert, elle aussi',
    /ringColor=\{anneau\}/.test(nav),
    'elle avait sa propre formule : c’est la première à avoir eu l’anneau, '
    + 'elle ne doit pas rester à part');

  verifier('…comme les quatre autres icônes',
    /style=\{\[s\.anneau, \{ borderColor: anneau \}\]\}/.test(nav));

  /* Une bordure qui APPARAÎT décalerait l'icône de deux pixels à chaque
     changement d'onglet, et toute la barre sauterait. La boîte a donc une
     taille fixe, et seule la couleur bouge. Mesuré au navigateur : 69 px
     de haut avant comme après. */
  verifier('la boîte a une taille fixe, seule la COULEUR change',
    /anneau: \{\s*width: 30, height: 30, borderRadius: R\.gelule, borderWidth: 2,/
      .test(nav),
    'une bordure posée seulement quand l’onglet est actif ferait sauter '
    + 'la barre de deux pixels à chaque changement de page');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Un point qui s’allume dit où regarder, et se voit.\n');
