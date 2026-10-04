/**
 * LES PIÈCES JUSTIFICATIVES — ce qu'on demande à qui.
 *
 * CE QUE CE CONTRÔLE DÉFEND
 * -------------------------
 * La décision du propriétaire du 30/09/2026 : « tout l'écosystème peut
 * s'inscrire, avec des pièces justificatives PAR CATÉGORIE — un avocat n'a
 * pas d'assurance décennale, et son badge vérifié ne voudrait rien dire ».
 *
 * Deux défauts réels s'en déduisaient, et aucun ne faisait planter quoi que
 * ce soit :
 *
 *   1. un avocat ne pouvait JAMAIS obtenir le badge — la base exige
 *      `kbis_valide AND assurance_valide`, et il n'a pas de décennale ;
 *   2. « extrait Kbis » est faux pour un micro-entrepreneur, qui n'en a
 *      pas. Le propriétaire est lui-même dans ce cas.
 *
 * LE CONTRÔLE QUI COMPTE LE PLUS
 * ------------------------------
 * Le troisième : **un seul métier qui construit suffit à exiger la
 * décennale.** Un professionnel porte jusqu'à quatre métiers, et rien
 * n'empêche un courtier en assurance construction d'être aussi maçon.
 * Prendre la catégorie du PREMIER métier laisserait une entreprise de gros
 * œuvre sans décennale — exactement ce que le badge est censé empêcher.
 *
 *   npm run verifier-pieces
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  EXISTENCE, DECENNALE, RC_PRO,
  assuranceAttendue, complementairesDe, piecesDeCategorie, tableauDesPieces,
} from '../src/data/pieces-justificatives.js';
import { cleCategorieDe, categorieDe, MAP_METIERS } from '../src/lib/metiers.js';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

console.log('\nLa clé d’une catégorie n’est pas son nom');
{
  /* LE PIÈGE RENCONTRÉ EN L'ÉCRIVANT, le 04/10/2026. `categorieDe()` rend
     « Conseil, juridique, assurance, finance » — ce qui s'affiche. La
     comparaison avec `conseil` échouait donc en silence, et un avocat se
     voyait réclamer une décennale. Les deux fonctions se ressemblent assez
     pour qu'on les confonde à nouveau. */
  verifier('`cleCategorieDe` rend bien une CLÉ',
    cleCategorieDe('avocat-construction') === 'conseil',
    `a rendu « ${cleCategorieDe('avocat-construction')} »`);
  verifier('…et `categorieDe` rend bien un NOM',
    categorieDe('avocat-construction').includes(' '),
    'si les deux rendaient la même chose, l’une des deux serait inutile');
}

console.log('\nChaque catégorie demande une assurance, et la bonne');
{
  const table = tableauDesPieces();
  verifier(`les ${table.length} catégories du catalogue sont couvertes`, table.length >= 15);

  const sansAssurance = table.filter((c) => !c.assurance || !c.assurance.nom);
  verifier('aucune catégorie sans assurance attendue', sansAssurance.length === 0,
    sansAssurance.map((c) => c.cle).join(', '));

  /* La seule exception, et elle est VOULUE : le conseil ne construit pas.
     Vérifié le 04/10/2026 — architectes, bureaux d'études et géomètres SONT
     soumis à la décennale, ce sont des « constructeurs » au sens de
     l'article 1792 du Code civil. C'était ma première erreur de conception. */
  const rcPro = table.filter((c) => c.assurance.cle === RC_PRO.cle).map((c) => c.cle);
  verifier('seul « conseil » échappe à la décennale',
    rcPro.length === 1 && rcPro[0] === 'conseil',
    `catégories en RC pro : ${rcPro.join(', ') || '(aucune)'} — `
    + 'architectes, BE et géomètres sont des constructeurs au sens de l’article 1792');

  verifier('`conseil` demande bien une RC professionnelle',
    piecesDeCategorie('conseil').assurance.cle === RC_PRO.cle);
  verifier('`gros-oeuvre` demande bien une décennale',
    piecesDeCategorie('gros-oeuvre').assurance.cle === DECENNALE.cle);
}

console.log('\nUn seul métier qui construit suffit');
{
  /* LE CONTRÔLE LE PLUS IMPORTANT DU FICHIER. */
  verifier('avocat seul → RC professionnelle',
    assuranceAttendue(['avocat-construction']).cle === RC_PRO.cle);
  verifier('maçon seul → décennale',
    assuranceAttendue(['macon']).cle === DECENNALE.cle);
  verifier('courtier ET maçon → DÉCENNALE',
    assuranceAttendue(['courtier-assurance-construction', 'macon']).cle === DECENNALE.cle,
    'prendre la catégorie du premier métier laisserait une entreprise de gros '
    + 'œuvre sans décennale');
  verifier('maçon ET courtier (ordre inverse) → décennale',
    assuranceAttendue(['macon', 'courtier-assurance-construction']).cle === DECENNALE.cle,
    'le résultat ne doit pas dépendre de l’ordre de saisie');

  /* Sans information, on exige le PLUS : une fiche sans métier, ou avec un
     métier retiré du catalogue, ne doit pas glisser sous le radar. */
  verifier('aucun métier → décennale (le défaut prudent)',
    assuranceAttendue([]).cle === DECENNALE.cle);
  verifier('métier inconnu → décennale',
    assuranceAttendue(['metier-qui-nexiste-pas']).cle === DECENNALE.cle,
    'une donnée ancienne ou un métier désactivé ne doit pas ouvrir une porte');
}

console.log('\nLes pièces complémentaires');
{
  verifier('un courtier se voit réclamer son ORIAS',
    complementairesDe(['courtier-assurance-construction']).some((c) => c.cle === 'orias'));
  verifier('un diagnostiqueur, sa certification',
    complementairesDe(['diagnostiqueur']).some((c) => c.cle === 'cofrac'));
  verifier('un maçon, rien de plus',
    complementairesDe(['macon']).length === 0,
    'réclamer des pièces inutiles écarte des artisans légitimes');

  /* Deux métiers de la même catégorie ne doublent pas la liste. */
  const deux = complementairesDe(['diagnostiqueur', 'geometre-expert']);
  verifier('pas de doublon entre deux métiers d’une même catégorie',
    deux.length === new Set(deux.map((c) => c.cle)).size);

  /* Toutes les clés citées existent vraiment au catalogue : une faute de
     frappe rendrait la règle muette sans erreur. */
  const cites = ['avocat-construction', 'courtier-assurance-construction',
    'diagnostiqueur', 'geometre-expert', 'macon'];
  const inconnus = cites.filter((c) => !MAP_METIERS[c]);
  verifier('les métiers cités par ce contrôle existent au catalogue',
    inconnus.length === 0, inconnus.join(', '));
}

console.log('\nAucun écran ne nomme un document en dur');
{
  /* Un libellé recopié dans un écran se périme sans bruit : c'est ainsi que
     « extrait Kbis » est resté affiché à des micro-entrepreneurs qui n'en
     ont pas. Tout passe par `pieces-justificatives.js`. */
  const fichiers = execFileSync('git',
    ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => (f.endsWith('.js'))
      && !f.endsWith('pieces-justificatives.js')
      && !f.endsWith('catalogue-metiers.js')
      && !f.endsWith('demo.js')
      /* LES TEXTES LÉGAUX, EUX, DOIVENT NOMMER LES DOCUMENTS. Des CGU qui
         diraient « une pièce adaptée à votre métier » n'engageraient
         personne : une clause doit être lisible sans l'application sous les
         yeux. L'exception est donc justifiée — et elle est compensée juste
         en dessous par un contrôle PLUS exigeant. */
      && !f.endsWith('data/legal.js'));

  const fautifs = [];
  fichiers.forEach((f) => {
    const c = sansCommentaires(lire(f));
    if (/["'`][^"'`]*[Ee]xtrait Kbis/.test(c) || /["'`][^"'`]*ssurance décennale/.test(c)) {
      fautifs.push(f);
    }
  });
  verifier('aucun « extrait Kbis » ni « assurance décennale » écrit à la main',
    fautifs.length === 0,
    `${fautifs.join('\n      ')}\n      → passez par EXISTENCE / assuranceAttendue()`);
}

console.log('\nLes textes légaux nomment les DEUX cas, pas un seul');
{
  /* C'était une incohérence réelle, trouvée par ce contrôle le 04/10/2026 :
     les CGU promettaient le badge « après contrôle d'un extrait Kbis et
     d'une attestation d'assurance décennale ». L'application accepte
     pourtant d'inscrire des micro-entrepreneurs (pas de Kbis) et des
     avocats (pas de décennale) : les CGU leur fermaient le badge par
     écrit. */
  const legal = lire('src/data/legal.js');
  const badge = legal.slice(legal.indexOf('Le badge vérifié'), legal.indexOf('Le badge vérifié') + 1600);
  verifier('les CGU citent le Kbis ET l’avis SIRENE',
    /Kbis/.test(badge) && /SIRENE/.test(badge),
    'un micro-entrepreneur n’a pas de Kbis : le texte doit le dire');
  verifier('…et la décennale ET la responsabilité civile professionnelle',
    /décennale/.test(badge) && /responsabilité civile/i.test(badge),
    'un avocat n’a pas de décennale : le texte doit dire ce qu’on lui demande');
}

console.log('\nLe libellé de l’existence parle des DEUX statuts');
{
  /* Un micro-entrepreneur n'a pas de Kbis. Ne nommer que le Kbis, c'est lui
     faire chercher un document qui n'existe pas — puis renoncer. */
  verifier('« Kbis » ET « SIRENE » sont nommés',
    /Kbis/i.test(EXISTENCE.nom) && /SIRENE/i.test(EXISTENCE.nom),
    `libellé actuel : « ${EXISTENCE.nom} »`);
  verifier('…et l’aide explique lequel est pour qui',
    /micro/i.test(EXISTENCE.aide) && /société/i.test(EXISTENCE.aide));
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ On demande à chacun ce qu’il peut fournir — et la décennale '
  + 'dès qu’un seul métier construit.\n');
