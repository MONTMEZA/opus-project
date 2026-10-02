/**
 * ATTEINDRE ET LIRE — ce qu'on vise avec un gant, ce qu'on lit au soleil.
 *
 * CE QUI A ÉTÉ MESURÉ LE 02/10/2026
 * ---------------------------------
 * En relevant la boîte RÉELLE de chaque zone appuyable, sur cinq écrans :
 * **70 cibles sur 71 sous 44 points**, la plus petite à 14.
 *
 * 44, ce n'est pas un goût : c'est la mesure d'Apple, tirée de la taille
 * d'un doigt. Et les utilisateurs d'Opus ne sont pas assis à un bureau — un
 * maçon en gants n'a plus un doigt de 7 mm mais une surface molle de 15 mm
 * qui ne sent pas où elle appuie. À 25 points, la puce « Suivre » se rate
 * une fois sur deux ; à 14, le drapeau de signalement ne s'atteint jamais.
 *
 * Et le contraste, calculé sur la palette réelle :
 *
 *     bordure d'un champ       1,65 : 1   (il en faut 3)
 *     texte secondaire         4,01 : 1   (il en faut 4,5)
 *     texte orange sur le fond 2,76 : 1   (il en faut 4,5)
 *
 * Autrement dit : dehors, on ne voyait plus où étaient les champs.
 *
 * CE QUI SE VÉRIFIE ICI, ET CE QUI NE S'Y VÉRIFIE PAS
 * ---------------------------------------------------
 * Le contraste se CALCULE : ce contrôle le refait à chaque fois, sur la
 * palette du moment. Une couleur ajoutée sans y penser le fera rougir.
 *
 * Les tailles, elles, se mesurent au navigateur (`mesure-cibles.mjs`). Ici
 * on vérifie la RÈGLE : que les briques partagées déclarent une hauteur
 * minimale, et que toute marge de visée passe par `viser()` plutôt que par
 * un nombre écrit à la main — c'est l'arithmétique qui garantit les 44.
 *
 * **`hitSlop` n'existe pas au navigateur** (`react-native-web` l'ignore).
 * Les cibles qui comptent dessus ne se mesurent donc que sur l'iPhone.
 *
 *   npm run verifier-cibles
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
  /* `--others` : un fichier NEUF, pas encore ajouté à git, échappait à
     tous les contrôles — constaté le 02/10/2026 avec `Ouverture.js`,
     qui est passé vert sans jamais avoir été lu. */
  ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
  .split('\n').filter((f) => f.endsWith('.js'));
const theme = lire('src/theme.js');
const ui = lire('src/components/ui.js');

/* Troisième fois que la DOCUMENTATION se fait accuser par un contrôle : un
   exemple écrit dans un commentaire n'est pas du code. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

/* ---------- le contraste, recalculé à chaque passage ---------- */
function luminance(hex) {
  const h = hex.replace('#', '');
  const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]);
}
function contraste(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function couleur(nom) {
  const m = theme.match(new RegExp(`\\n\\s*${nom}:\\s*'(#[0-9A-Fa-f]{6})'`));
  return m ? m[1] : null;
}

console.log('\nCe qu’on lit dehors — le contraste, calculé sur la palette du moment');
{
  const C = Object.fromEntries(['ink', 'bg', 'surface', 'line', 'accent',
    'accent2', 'muted', 'bad', 'bordChamp', 'accentTexte', 'surAccent', 'sos']
    .map((n) => [n, couleur(n)]));

  const cas = [
    ['la bordure d’un champ, sur blanc', C.bordChamp, C.surface, 3],
    ['la bordure d’un champ, sur le fond', C.bordChamp, C.bg, 3],
    ['le texte secondaire sur le fond', C.muted, C.bg, 4.5],
    ['le texte secondaire sur blanc', C.muted, C.surface, 4.5],
    ['le texte orange sur blanc', C.accentTexte, C.surface, 4.5],
    ['le texte orange sur le fond', C.accentTexte, C.bg, 4.5],
    ['le texte principal sur le fond', C.ink, C.bg, 4.5],
    ['le bleu sur blanc', C.accent2, C.surface, 4.5],
  ];
  cas.forEach(([quoi, a, b, seuil]) => {
    if (!a || !b) { verifier(quoi, false, 'couleur introuvable dans theme.js'); return; }
    const r = contraste(a, b);
    verifier(`${quoi} — ${r.toFixed(2)} : 1 (il en faut ${seuil})`, r >= seuil);
  });

  /* L'orange de REMPLISSAGE ne bouge pas : c'est la signature d'Opus. On
     vérifie seulement qu'on ne l'emploie pas comme couleur de TEXTE. */
  verifier('l’orange de signature est resté #E85C1F', C.accent === '#E85C1F',
    'la couleur de remplissage ne se renégocie pas sans le propriétaire');

  /* CE QU'ON POSE SUR L'ORANGE — l'option retenue le 02/10/2026.
     Le blanc n'y donnait que 3,51 : 1. Et la règle ne se généralise pas :
     sur le rouge brique et sur le bleu, c'est le blanc qui gagne, donc le
     contrôle vérifie les DEUX sens. */
  const surA = couleur('surAccent');
  if (!surA) {
    verifier('`surAccent` existe', false, 'theme.js — l’encre posée sur l’orange');
  } else {
    const r = contraste(surA, C.accent);
    verifier(`l’encre posée sur l’orange — ${r.toFixed(2)} : 1 (il en faut 4.5)`, r >= 4.5);
    verifier('…et elle y bat le blanc',
      r > contraste('#FFFFFF', C.accent),
      'si le blanc redevenait meilleur, c’est l’orange qui aurait changé');
    [['le rouge brique', C.sos], ['le bleu acier', C.accent2], ['le presque-noir', C.ink]]
      .forEach(([quoi, fond]) => {
        verifier(`${quoi} garde le blanc`,
          contraste('#FFFFFF', fond) > contraste(surA, fond),
          'le noir y serait un recul — ce n’est pas une règle « tout en noir »');
      });
  }

  /* `surFond()` tranche par le calcul : c'est ce qui rend une étiquette
     lisible le jour où une couleur est ajoutée à `annonces.js` sans que
     personne n'y repense. */
  verifier('`surFond()` existe et choisit la meilleure des deux encres',
    /export function surFond\(/.test(theme) && /contraste\(C\.surAccent, fond\)/.test(theme));

  /* Un `'#fff'` écrit dans le même objet de style qu'un remplissage orange
     est l'erreur exacte qu'on vient de corriger, à quinze endroits. */
  const blancSurOrange = [];
  fichiers.forEach((f) => {
    const c = sansCommentaires(lire(f));
    /* Chaque objet de style, du `{` à son `}` de même niveau — approché par
       un découpage sur les accolades de premier niveau d'un StyleSheet. */
    (c.match(/\{[^{}]*\}/g) || []).forEach((bloc) => {
      if (!/backgroundColor: C\.accent[,}\s]/.test(bloc)) return;
      if (/color: '#fff'|color: '#FFFFFF'|color: C\.surface/.test(bloc)) {
        blancSurOrange.push(`${f} : ${bloc.replace(/\s+/g, ' ').slice(0, 90)}`);
      }
    });
  });
  verifier('aucun blanc posé sur un remplissage orange',
    blancSurOrange.length === 0,
    `${blancSurOrange.join('\n      ')}\n      → C.surAccent, ou surFond() si le fond vient des données`);

  /* Il y avait DEUX encres sombres dans le projet — `#111` et `C.ink` —
     employées au hasard sur le même orange. Ce n'est pas une faute de
     lisibilité (5,38 contre 4,92, les deux passent) mais une faute
     d'entretien : le jour où l'orange bouge, l'une des deux sera oubliée. */
  const centOnze = fichiers.filter((f) => /'#111'/.test(sansCommentaires(lire(f))));
  verifier('une seule encre sombre, et elle a un nom',
    centOnze.length === 0,
    `${centOnze.join(', ')}\n      → C.surAccent`);
  /* Une exception, et une seule : le mot-symbole de l'écran d'accueil, où
     l'orange est posé sur le presque-noir — 4,92 : 1, il passe. On la
     reconnaît au commentaire qui la justifie, juste au-dessus : sans
     justification écrite, le contrôle rougit. */
  const fautifs = fichiers.filter((f) => {
    const c = lire(f);
    if (!/color: C\.accent[,}\s]/.test(c)) return false;
    return !/sur le presque-noir de cet écran/.test(c);
  });
  verifier('aucun texte en orange de remplissage',
    fautifs.length === 0,
    `${fautifs.join(', ')}\n      → C.accentTexte pour ce qui se LIT`);
}

console.log('\nCe qu’on vise avec un gant');
{
  verifier('`TOUCHE` et `viser()` existent',
    /export const TOUCHE = 44/.test(theme) && /export function viser\(/.test(theme));

  [['btnMain', 'TOUCHE'], ['btnOutline', 'TOUCHE'], ['field', 'TOUCHE'],
    ['iconBtn', 'TOUCHE'], ['btnMini', '36'], ['chip', '40'], ['chipFollow', '40'],
    ['pillBtn', '38']].forEach(([brique, attendu]) => {
    const m = ui.match(new RegExp(`\\n  ${brique}: \\{([\\s\\S]*?)\\n  \\},`));
    verifier(`${brique} déclare sa hauteur minimale`,
      !!m && new RegExp(`minHeight: ${attendu}`).test(m[1]),
      'une brique sans hauteur minimale retombe à la taille de son texte');
  });

  /* Un `hitSlop` écrit à la main ment : 8 sur une boîte de 14 donne 30, pas
     44. En passant par `viser()`, l'arithmétique est faite pour nous. */
  const brut = [];
  fichiers.forEach((f) => {
    const c = lire(f);
    const m = c.match(/hitSlop=\{(?!viser\()[^}]*\}/g);
    if (m) brut.push(`${f} : ${m.join(', ')}`);
  });
  verifier('toute marge de visée passe par `viser()`',
    brut.length === 0,
    brut.join('\n      '));
}

console.log('\nLe mot de passe ne se tape plus à l’aveugle');
{
  verifier('`ChampMotDePasse` existe', /export const ChampMotDePasse/.test(ui));
  verifier('…avec un œil pour relire', /Afficher le mot de passe/.test(ui));
  verifier('…et ce qu’il faut au trousseau du téléphone',
    /autoComplete=\{nouveau \? 'new-password'/.test(ui)
    && /textContentType=\{nouveau \? 'newPassword'/.test(ui),
    'sans ça, iOS ne propose ni le remplissage ni « mot de passe fort »');

  const auth = lire('src/screens/AuthScreen.js');
  verifier('l’inscription s’en sert', /<ChampMotDePasse/.test(auth));
  verifier('et le clavier mène au champ suivant',
    /returnKeyType="next"/.test(auth) && /champMotDePasse\.current\.focus\(\)/.test(auth),
    'sinon il faut refermer le clavier pour viser le champ d’après');
  verifier('l’email aussi est connu du trousseau',
    /autoComplete="email"/.test(auth) && /textContentType="emailAddress"/.test(auth));
}

console.log('\nCe qui s’annonce, et ce qui se respecte');
{
  const retour = lire('src/lib/retour.js');
  verifier('`annoncer()` existe', /export function annoncer\(/.test(retour));
  verifier('…et tout message y passe',
    /retour\.annoncer\(msg\)/.test(lire('src/OpusApp.js')),
    '`accessibilityLiveRegion` n’existe que sur Android : sur iPhone, un '
    + 'échec passait inaperçu pour qui se sert de VoiceOver');
  verifier('« Réduire les animations » est lu',
    /export function useMouvementReduit\(/.test(retour)
    && /isReduceMotionEnabled/.test(retour));
  verifier('…et respecté par ce qui bouge',
    /sansMouvement \? undefined : FadeInUp/.test(ui),
    'ce réglage existe pour les personnes que le mouvement rend malades');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Ça se vise et ça se lit. Ce qui passe par `hitSlop` ne se '
  + 'mesure PAS au navigateur — seul l’iPhone le dira.\n');
