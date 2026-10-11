/**
 * LES PORTES DE LA BASE — qui a le droit d'appeler quoi.
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Il tient DEUX règles qui tirent en sens inverse, et c'est précisément
 * pour ça qu'il faut une machine : à la main, on corrige l'une en cassant
 * l'autre. Les deux ont déjà coûté quelque chose dans ce projet.
 *
 * 1. **Une fonction de DÉCLENCHEUR n'est appelable par personne.** Relevé
 *    le 11/10/2026 sur la vraie base : huit fonctions `security definer`
 *    joignables par `/rest/v1/rpc/<nom>` SANS COMPTE. Le droit d'un
 *    déclencheur est vérifié à sa création, pas à l'écriture — mesuré dans
 *    les deux sens le jour même —, donc le lui laisser n'ouvre que la porte.
 *
 * 2. **Une fonction appelée par une POLITIQUE ou une CONTRAINTE garde son
 *    droit.** C'est l'incident `horaires_valides` du 30/09/2026 : révoquée
 *    « par prudence », et plus aucun horaire ne s'enregistrait. Une règle
 *    RLS qui appelle une fonction interdite à l'appelant **ÉCHOUE au lieu
 *    de filtrer**.
 *
 * La seconde règle est écrite dans CLAUDE.md depuis un an et **rien ne la
 * tenait**. Elle est tenue ici.
 *
 *   npm run verifier-portes
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* Les commentaires `--` partent d'abord : NEUF fois dans ce projet un
   contrôle a accusé la documentation qui expliquait le défaut qu'il traque.
   Les blocs `/* … *​/` restent, eux : le SQL en contient dans des corps de
   fonction, et les retirer couperait du code. */
const brut = readFileSync('supabase/schema.sql', 'utf8');
const schema = brut.replace(/^\s*--.*$/gm, '');

/* ================================================================== */
console.log('\nLE BALAYAGE — tout ce qui rend `trigger` perd son droit');

const BALAYAGE = 'do $portes$';
verifier('le balayage existe', schema.includes(BALAYAGE));

{
  const i = schema.indexOf(BALAYAGE);
  const bloc = i < 0 ? '' : schema.slice(i, schema.indexOf('$portes$;', i));

  verifier('il vise ce qui rend `trigger`, et rien d’autre',
    /prorettype = 'pg_catalog\.trigger'::regtype/.test(bloc)
    && /nspname = 'public'/.test(bloc),
    'Viser plus large retirerait le droit d’une fonction appelée par une '
    + 'contrainte, et la règle ÉCHOUERAIT au lieu de filtrer.');

  verifier('…et il retire à PUBLIC, pas seulement aux deux rôles',
    /from public, anon, authenticated/.test(bloc),
    'PostgreSQL accorde `execute` à PUBLIC sur toute fonction neuve : '
    + 'révoquer à `anon, authenticated` seuls ne retire RIEN. C’est le piège '
    + 'mesuré au lot H, sur la vraie base.');

  verifier('il emploie `revoke`, jamais un ordre qui commence par `drop`',
    /revoke all on function/.test(bloc) && !/\bdrop\b/i.test(bloc),
    'Le connecteur Supabase refuse tout ordre commençant par `drop`, même '
    + 'dans une chaîne passée à `execute`.');
}

/* L'ORDRE EST LA CONDITION. Le balayage ne voit que les déclencheurs déjà
   créés : posé trop tôt, il laisse passer tout ce qui suit — et c'est
   exactement ce que la prochaine section ajoutera. */
{
  const dernierTrigger = schema.lastIndexOf('create or replace trigger');
  const balayage = schema.indexOf(BALAYAGE);
  verifier('il passe APRÈS le dernier déclencheur du fichier',
    balayage > dernierTrigger && dernierTrigger > 0,
    'Un déclencheur créé après lui garderait son droit, sans que rien ne le '
    + 'dise. C’est pour ça que ce bloc est le dernier du fichier.');

  const apres = schema.slice(balayage);
  verifier('…et plus rien ne crée de déclencheur derrière',
    !apres.includes('create or replace trigger') && !/\bcreate trigger\b/.test(apres));
}

verifier('`recalcule_chantier` est retirée à la main — elle ne rend pas `trigger`',
  /revoke all on function public\.recalcule_chantier\(uuid\) from public, anon, authenticated/
    .test(schema),
  'Elle rend `void`, donc le balayage ne la voit pas ; et son seul appelant '
  + 'est `maj_chantier()`, qui est `security definer`.');

{
  const appels = (schema.match(/public\.recalcule_chantier\(/g) || []).length;
  const i = schema.indexOf('function public.maj_chantier()');
  const corps = i > 0 ? schema.slice(i, schema.indexOf('$$;', i)) : '';
  const dedans = (corps.match(/public\.recalcule_chantier\(/g) || []).length;
  verifier('…et elle n’a toujours aucun appelant hors de `maj_chantier()`',
    appels === dedans + 2 && dedans === 2,
    `${appels} appel(s) dans le fichier, dont ${dedans} dans maj_chantier `
    + '(les deux autres étant sa déclaration et sa révocation). Un appelant '
    + 'de plus, et la révocation le casserait.');

  verifier('…dont l’appelant est bien `security definer`',
    /function public\.maj_chantier\(\)[\s\S]{0,120}security definer/.test(schema),
    'En `security invoker`, l’appel interne serait contrôlé contre l’artisan '
    + 'qui publie — qui n’a plus le droit. Le compteur de publications d’un '
    + 'chantier cesserait de monter, sans erreur visible.');
}

/* ================================================================== */
console.log('\nET CE QU’ON NE RETIRE JAMAIS — la règle `horaires_valides`');

/* On RELÈVE dans le fichier les fonctions `public.*` nommées par une
   contrainte `check` ou par une politique, au lieu d'en tenir une liste :
   une liste écrite à la main serait une seconde vérité, et c'est elle qui
   se tromperait le jour où une politique nouvelle appelle une fonction
   nouvelle. */
const depuisContraintes = new Set();
for (const m of schema.matchAll(/check \(([^;]*?)\)[\s,]*(?:not valid)?\s*;/g)) {
  for (const f of m[1].matchAll(/public\.([a-z_]+)\s*\(/g)) depuisContraintes.add(f[1]);
}
const depuisPolitiques = new Set();
for (const m of schema.matchAll(/\b(?:using|with check)\s*\(([\s\S]{0,600}?)\)\s*(?:;|with check|to\s)/g)) {
  for (const f of m[1].matchAll(/public\.([a-z_]+)\s*\(/g)) depuisPolitiques.add(f[1]);
}
const gardiennes = new Set([...depuisContraintes, ...depuisPolitiques]);

verifier('le relevé trouve bien des fonctions gardiennes',
  gardiennes.size >= 4,
  `Trouvé : ${[...gardiennes].join(', ') || '(aucune)'}. Zéro ou presque veut `
  + 'dire que le motif de lecture ne vise plus rien — le contrôle passerait '
  + 'alors au vert sans rien éprouver, ce que ce projet traque depuis '
  + '`verifier-montage`.');

verifier('…et `horaires_valides` en fait partie — c’est le cas d’école',
  gardiennes.has('horaires_valides'),
  'Si elle n’y est plus, c’est le relevé qui est cassé, pas le schéma.');

/* CE QUE CE CONTRÔLE PEUT DIRE, ET CE QU'IL NE PEUT PAS
   ------------------------------------------------------
   Le premier jet exigeait un `grant execute … to authenticated` écrit en
   toutes lettres pour chaque gardienne. Il a refusé QUATRE fonctions qui
   vont parfaitement bien, et c'est moi qui avais tort :

     - `est_masque` est accordée dans une BOUCLE (section 13.8), par
       `execute format('grant execute on function %s …', f)` ;
     - `metiers_connus` l'est sur DEUX LIGNES, et le motif exigeait « to »
       collé à la parenthèse ;
     - `est_un_pro` et `horaires_valides` ne sont accordées nulle part :
       elles sont `security invoker` et vivent sur le droit que PostgreSQL
       donne à PUBLIC d'office. C'est l'état normal, pas un oubli.

   Vérifié sur le bac à sable (schéma rejoué deux fois) ET sur la vraie
   base : les cinq ont bien leur droit. **Un contrôle qui exige une
   SYNTAXE au lieu d'une PROPRIÉTÉ accuse du code juste** — c'est la faute
   que ce projet a déjà commise avec `insert into … \);`.

   Ce fichier ne peut pas interroger PostgreSQL. Il tient donc ce qui se
   lit, et la vraie preuve — `has_function_privilege` sur chacune — vit
   dans `supabase/essais-section-42.sql`, qui tourne sur une base rejouée. */
for (const f of [...gardiennes].sort()) {
  /* Le vrai invariant : RIEN ne doit retirer ce droit. Un `revoke` posé un
     jour sur une gardienne, et la règle qui l'appelle échoue au lieu de
     filtrer — sans message, sans ligne rouge, sans rien. */
  const retire = new RegExp(
    `revoke[^;]*\\bfunction\\s+public\\.${f}\\s*\\([^)]*\\)[^;]*?\\bauthenticated`, 's');
  verifier(`rien ne retire \`${f}\` à \`authenticated\``,
    !retire.test(schema),
    'Une politique ou une contrainte l’appelle. Sans ce droit elle ÉCHOUE au '
    + 'lieu de filtrer — « permission denied for function », la panne du 30/09.');

  /* …y compris par la boucle de la section 13.8, qui retire en masse. */
  const i13 = schema.indexOf("foreach f in array array[");
  const bloc13 = i13 > 0 ? schema.slice(i13, schema.indexOf('end $$;', i13)) : '';
  verifier(`…et la boucle de la 13.8 ne l’emporte pas`,
    !(bloc13.includes(`'public.${f}(`) && /revoke execute/.test(bloc13)),
    'Cette boucle-là retire le droit à une liste nommée. Y glisser une '
    + 'gardienne la casserait en silence.');
}

/* Et le sens inverse : aucune gardienne ne doit rendre `trigger`, sinon le
   balayage la prendrait et les deux règles se contrediraient. */
for (const f of [...gardiennes].sort()) {
  const i = schema.indexOf(`function public.${f}(`);
  const entete = i > 0 ? schema.slice(i, i + 300) : '';
  verifier(`…et \`${f}\` ne rend pas \`trigger\``,
    !/returns trigger/.test(entete),
    'Elle serait alors prise par le balayage ET exigée par une règle : les '
    + 'deux moitiés du contrôle se contrediraient.');
}

/* ================================================================== */
console.log('\nLA VRAIE PREUVE EST EN SQL — ce fichier ne sait pas interroger PostgreSQL');

{
  /* ET ON RETIRE LES COMMENTAIRES DE L'AUTRE FICHIER AUSSI. Éprouvé en
     cassant ce contrôle : commenter l'écriture d'essai (`-- insert into
     public.posts`) le laissait passer au VERT, puisque le texte y était
     toujours. Neuvième fois dans ce projet qu'un commentaire trompe un
     contrôle — et la première où c'est du SQL d'essai et non du code. */
  const essais = readFileSync('supabase/essais-section-42.sql', 'utf8')
    .replace(/^\s*--.*$/gm, '');
  verifier('les essais éprouvent les huit portes refermées',
    /has_function_privilege\('anon'/.test(essais)
    && /prorettype = 'pg_catalog\.trigger'::regtype/.test(essais));

  verifier('…et le droit de CHACUNE des gardienne relevées ici',
    [...gardiennes].every((f) => essais.includes(f)),
    `Manquantes dans les essais : ${[...gardiennes].filter((f) => !essais.includes(f)).join(', ')}. `
    + 'Les deux fichiers doivent parler des mêmes fonctions, sinon celui qui '
    + 'ne sait pas interroger la base couvre ce que l’autre n’éprouve pas.');

  verifier('…et qu’une écriture passe encore, déclencheur compris',
    /insert into public\.posts/.test(essais) && /vues_count|nb_publications/.test(essais),
    'Retirer le droit sans éprouver une écriture réelle, ce serait refermer '
    + 'une porte sans vérifier qu’on n’a pas muré la pièce.');
}

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} contrôle(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Les portes : un déclencheur n’est appelable par personne, '
  + 'une gardienne garde son droit.\n');
