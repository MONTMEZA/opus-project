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
 * ET CE QU'IL NE PEUT PAS TENIR SEUL : UN CONTRÔLE QUI LIT DU TEXTE NE PEUT
 * PAS VOIR TOUTES LES FORMES QU'UN SQL PEUT PRENDRE ; LA PREUVE DE SÉCURITÉ
 * EST L'ESSAI, QUI INTERROGE LE CATALOGUE DE LA BASE REJOUÉE. Pour
 * `recalcule_devis` (lot 1 du devis), ce fichier lit qui l'appelle et qui la
 * rend ; la 2e relecture des essais de l'étape 3 a posé sur une copie une
 * `definer` accordée qui l'appelait SANS `public.` (N6) : ce contrôle ne la
 * voyait pas, et B figeait le devis de A (prouvé). Le motif accepte
 * désormais l'appel non qualifié ; mais c'est `supabase/essais-section-49.sql`
 * qui tient la propriété, par le catalogue — cas 26 (`has_function_privilege`
 * de `recalcule_devis` pour PUBLIC, `anon`, `authenticated`) et cas 27b-27c
 * (les fonctions `security definer`, appelables ou non, en deux listes
 * FERMÉES : une de plus, quels que soient son nom et son corps, rougit).
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

/* LE MÊME CAS, AU LOT 1 DU DEVIS (section 49, 21/10/2026) : `recalcule_devis`
   rend `void`, le balayage ne la voit pas. Elle est `security definer` —
   elle seule écrit `devis_tva`, qui n'a aucune politique d'écriture — et
   elle nomme des tables de PRIX : appelable par `/rest/v1/rpc`, elle
   recalculerait le devis de n'importe qui. D'où le `revoke` à la main. */
{
  /* TOUS les commentaires partent ici, ceux de FIN DE LIGNE compris, par un
     lecteur qui respecte les chaînes — relecture des essais de l'étape 3 du
     lot 1 (M3) : `revoke … ;  -- son seul appelant : public.recalcule_devis(…)`
     comptait pour un appelant de plus, et ce contrôle ACCUSAIT la
     documentation. Dixième fois dans ce projet. */
  const sansCommentaires = (txt) => {
    let sortie = '';
    let i = 0;
    while (i < txt.length) {
      const c = txt[i];
      const suite = txt[i + 1];
      if (c === '-' && suite === '-') { while (i < txt.length && txt[i] !== '\n') i += 1; continue; }
      if (c === '/' && suite === '*') { const fin = txt.indexOf('*/', i + 2); i = fin < 0 ? txt.length : fin + 2; sortie += ' '; continue; }
      if (c === "'") {
        const echappe = /[eE]/.test(txt[i - 1] || '') && !/[\w$]/.test(txt[i - 2] || '');
        let j = i + 1;
        while (j < txt.length) {
          if (echappe && txt[j] === '\\') { j += 2; continue; }
          if (txt[j] === "'" && txt[j + 1] === "'") { j += 2; continue; }
          if (txt[j] === "'") break;
          j += 1;
        }
        sortie += txt.slice(i, j + 1);
        i = j + 1;
        continue;
      }
      sortie += c;
      i += 1;
    }
    return sortie;
  };
  const nu = sansCommentaires(brut);
  /* Les RÔLES se lisent comme un ENSEMBLE (relecture des essais, M4) :
     `from anon, authenticated, public` retire exactement la même chose, et
     l'ancien motif l'accusait. */
  const roles = (/revoke\s+all\s+on\s+function\s+public\.recalcule_devis\(uuid,\s*bigint\)\s+from\s+([\w\s,]+?)\s*;/i.exec(nu) || [])[1] || '';
  verifier('`recalcule_devis` est retirée à la main, à PUBLIC, `anon` ET `authenticated` (dans n’importe quel ordre) — elle ne rend '
    + 'pas `trigger`',
  [...new Set(roles.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean))].sort().join(',') === 'anon,authenticated,public',
  'Le piège de la section 38 : `from anon, authenticated` seul ne retire RIEN — PostgreSQL accorde '
    + '`execute` à PUBLIC sur toute fonction neuve.');
  /* QUALIFIÉ OU NON (2e relecture des essais, N6) : `perform
     recalcule_devis(p, …)` dans une autre fonction est un appelant aussi.
     Compté dans le texte SANS SES CHAÎNES : le `comment on` du déclencheur
     dit « appelle recalcule_devis() » en toutes lettres, et ce n'est pas un
     appel. */
  const nuSansChaines = nu.replace(/'(?:[^']|'')*'/g, "''");
  const appels = (nuSansChaines.match(/\brecalcule_devis\s*\(/g) || []).length;
  const i = nuSansChaines.indexOf('function public.recalcule_apres_ligne_de_devis()');
  const corps = i > 0 ? nuSansChaines.slice(i, nuSansChaines.indexOf('$$;', i)) : '';
  const dedans = (corps.match(/\brecalcule_devis\s*\(/g) || []).length;
  verifier('…et elle n’a aucun appelant hors de `recalcule_apres_ligne_de_devis()`',
    dedans >= 4 && appels === dedans + 3,
    `${appels} mention(s) dans le code, dont ${dedans} dans le déclencheur (les trois autres : sa déclaration, sa `
    + 'révocation, son `comment on`). Un appelant de plus, et la révocation le casserait.');
  verifier('…dont l’appelant est bien `security definer`',
    /function public\.recalcule_apres_ligne_de_devis\(\)[\s\S]{0,120}security definer/.test(nu),
    'En `security invoker`, l’appel interne serait contrôlé contre l’artisan, qui n’a pas le droit : plus '
    + 'aucune ligne de devis ne s’enregistrerait.');
  /* …ET RIEN NE LA REND, même sans la nommer (relecture des essais, I-4,
     prouvé : un autre artisan figeait le devis de A, l'horloge poussée au
     maximum, par `grant execute on all functions in schema public`). */
  const iRevoke = nu.search(/revoke\s+all\s+on\s+function\s+public\.recalcule_devis\(/i);
  const enMasse = [...nu.matchAll(/grant\s+[^;]*\bon\s+all\s+(functions|routines|procedures)\s+in\s+schema\b[^;]*;/gi)]
    .filter((m) => m.index > iRevoke).map((m) => m[0].replace(/\s+/g, ' '));
  const parDefaut = [...nu.matchAll(/alter\s+default\s+privileges\b[^;]*\bgrant\b[^;]*\bon\s+(functions|routines)\b[^;]*;/gi)].map((m) => m[0].replace(/\s+/g, ' '));
  verifier('…et rien ne la rend à un client — ni en la nommant, ni par `grant … on all functions in schema` posé après elle, ni '
    + 'par `alter default privileges … on functions`',
  iRevoke > 0 && !/grant[^;]*recalcule_devis[^;]*to[^;]*(anon|authenticated|public)/i.test(nu)
    && enMasse.length === 0 && parDefaut.length === 0, [...enMasse, ...parDefaut].join(' | '));
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
   dans `supabase/essais-section-43.sql`, qui tourne sur une base rejouée. */
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
  const essais = readFileSync('supabase/essais-section-43.sql', 'utf8')
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
console.log('\nLES PORTES DE TABLE — sortir d’un compte n’est pas un raccourci');

/* Même famille que ci-dessus, autre objet : là c'était `execute` sur une
   fonction, ici c'est `delete` sur une table. Mesuré le 11/10/2026 sur la
   vraie base : `anon` ET `authenticated` pouvaient supprimer une ligne de
   `public.users`, et la politique dit `for all`. Le raccourci sautait donc
   `preparer_suppression_compte()` : pas de `auteur_supprime`, les fichiers
   du stockage abandonnés, `auth.users` intacte — un compte qui ne peut
   plus ni servir, ni se réparer, ni se supprimer. */
verifier('`delete` est retiré sur `public.users`',
  /revoke delete on public\.users from anon, authenticated/.test(schema),
  'Sans lui, `DELETE /rest/v1/users?id=eq.<moi>` répond « DELETE 1 » et '
  + 'laisse un compte irréparable derrière lui.');

verifier('…et rien ne le rend',
  !/grant\s+delete[^;]*on public\.users/i.test(schema)
  && !/grant\s+all[^;]*on public\.users/i.test(schema),
  'Un `grant all` posé plus bas rouvrirait la porte sans un mot — c’est '
  + 'exactement ce que `alter default privileges` fait déjà d’office chez '
  + 'Supabase, et ce que ce `revoke` vient corriger.');

{
  /* L'ORDRE COMPTE ICI AUSSI : un `revoke` posé avant la table échouerait,
     et `schema.sql` s'arrête à la première erreur sous `ON_ERROR_STOP`. */
  const table = schema.indexOf('create table if not exists public.users');
  const retrait = schema.indexOf('revoke delete on public.users');
  verifier('…et il passe après la création de la table',
    retrait > table && table > 0);
}

/* CE QUI REND CE `revoke` SANS DANGER, et qu'il ne faut pas défaire. */
verifier('`preparer_suppression_compte()` est toujours `security definer`',
  /function public\.preparer_suppression_compte\(\)[\s\S]{0,160}security definer/
    .test(schema),
  'En `security invoker`, elle se heurterait au `revoke` qu’on vient de '
  + 'poser : supprimer son compte deviendrait impossible. Le droit de partir '
  + 'n’est pas négociable — c’est le `revoke` qui doit s’adapter, pas lui.');

verifier('…et c’est bien ELLE qui finit par retirer la ligne',
  /delete from public\.users where id = moi/.test(schema),
  'Si cette ligne quitte la fonction, il n’existe plus AUCUN chemin de '
  + 'suppression : le raccourci est fermé, et le vrai chemin ne supprime '
  + 'plus rien. Une porte murée des deux côtés.');

{
  /* L'application ne doit pas emprunter le raccourci : elle appelle la
     fonction. On relit `src/` plutôt que de le croire. */
  const api = readFileSync('src/lib/api.js', 'utf8');
  verifier('l’application ne supprime jamais `users` elle-même',
    !/from\('users'\)[\s\S]{0,80}\.delete\(/.test(api)
    && /rpc\('preparer_suppression_compte'\)/.test(api),
    'Elle doit passer par la fonction : c’est elle qui anonymise ce qui '
    + 'concerne des tiers, et la fonction Edge qui retire les fichiers.');

  verifier('…et `auteur_supprime` est toujours LU quelque part',
    /auteur_supprime/.test(api),
    'Tout le raisonnement de la section 18.2 tient à ce drapeau : il fait '
    + 'écrire « Compte supprimé » au lieu d’un « Client » anonyme. Personne '
    + 'pour le lire, et l’anonymisation ne se voit plus — ce serait la panne '
    + 'silencieuse du 01/10, une table qu’on écrit sans la relire.');
}

{
  /* TOUS les commentaires partent, ceux de FIN DE LIGNE compris — 15/10,
     relecture adverse. Ne retirer que les lignes entières laissait le
     contrôle trouver « OP010 attendu » dans `values (…);  -- OP010
     attendu`, alors même que son propre commentaire affirmait ne plus lire
     que le code. Et l'essai pouvait répondre OP005 sans un ✘ : retirer le
     rôle et le jeton du cas 5 le faisait tomber sur un autre refus. */
  const essais = readFileSync('supabase/essais-suppression-compte.sql', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');
  verifier('les essais éprouvent le refus, et pas seulement le droit',
    /* On vise la PROPRIÉTÉ, pas la syntaxe : le rôle peut venir d’une
       colonne (`r.rolname`) au lieu d’être écrit en clair, et exiger
       la seconde forme ferait accuser un essai parfaitement juste.
       C’est la faute que ce fichier documente quarante lignes plus
       haut, et je viens de la refaire. */
    /has_table_privilege\([^)]*public\.users[^)]*delete[^)]*\)/.test(essais)
    && /set local role authenticated/.test(essais)
    && /delete from public\.users where id = :A/.test(essais),
    'Lire `has_table_privilege` ne prouve rien tout seul : il faut voir '
    + 'l’ordre être REFUSÉ, avec un rôle et un jeton, chacun dans son propre '
    + 'ordre et jamais dans un bloc `do`.');

  verifier('…et qu’une sortie de compte reste possible',
    /select public\.preparer_suppression_compte\(\)/.test(essais)
    && /delete from auth\.users/.test(essais),
    'Les deux vrais chemins — la fonction, et la cascade depuis `auth.users` '
    + 'par la fonction Edge ou l’administration.');

  /* CE CONTRÔLE EXIGEAIT « 23503 », ET IL PASSAIT POUR LA MAUVAISE RAISON.
     Depuis la section 44 (15/10/2026), l'insertion de l'essai tombait sur
     OP005 — la ligne `users` absente rend un type vide — AVANT d'atteindre
     la clé étrangère. La base ne répondait donc plus 23503 ; ce contrôle,
     lui, trouvait toujours le nombre… dans le commentaire `-- 23503
     attendu`. Mesuré en rejouant l'essai le jour de la section 45. Depuis,
     une fiche ne se crée plus du tout depuis l'application (OP010), et
     l'essai le dit — ce qui rend le compte laissé derrière irréparable par
     construction : c'est pour ça que le raccourci doit rester fermé. Le
     motif ne lit plus que le CODE, pas un commentaire. */
  /* Le BLOC du cas 5, et lui seul : un rôle, un jeton, une annonce, PUIS
     l'insertion. Sans le rôle ni le jeton, l'ordre passe en
     superutilisateur et tombe sur OP005 — un refus, donc l'air juste. */
  const i5 = essais.indexOf("=== 5.");
  const i6 = essais.indexOf("=== 6.", i5);
  const cas5 = i5 >= 0 && i6 > i5 ? essais.slice(i5, i6) : '';
  const iRole = cas5.indexOf('set local role authenticated;');
  const iJeton = cas5.search(/set local request\.jwt\.claim\.sub = :A;/);
  const iAnnonce = cas5.search(/\\echo '[^']*OP010/);
  const iInsert = cas5.indexOf('insert into public.professional_profiles');
  verifier('…et que le compte laissé derrière ne se répare plus depuis l’application',
    iRole >= 0 && iJeton > iRole && iAnnonce > iJeton && iInsert > iAnnonce
    && /using errcode = 'OP010'/.test(schema),
    'L’essai doit viser OP010 : une fiche ne se crée plus depuis le client. '
    + 'Au premier jet il tombait sur une contrainte `not null`, puis sur '
    + 'OP005 en annonçant 23503 — deux fois pour la mauvaise raison.');
}

/* ================================================================== */
console.log('\nLA SECTION 45 — des portes nouvelles, fermées dès leur naissance');

/* Les fonctions nouvelles, et ce que chacune doit avoir JUSTE APRÈS elle.
   Pas dans une boucle plus bas : les boucles de ce fichier avalent
   `undefined_function`, et un droit passé sous silence sur une base neuve
   n'apparaît qu'au second rejeu. */
const NOUVELLES = {
  completer_ma_demande_pro: 'jsonb',
  annuler_ma_demande_pro: '',
  rattacher_mon_siret: 'text',
  devenir_pro: 'jsonb',
  admin_demandes_pro: '',
  admin_traiter_demande_pro: 'uuid, text, text',
  admin_retirer_entreprise: 'uuid, text',
};
const apresFonction = (nom) => {
  const i = schema.indexOf(`create or replace function public.${nom}(`);
  if (i < 0) return '';
  const fin = schema.indexOf('$$;', i);
  const suivante = schema.indexOf('create or replace function', fin);
  return schema.slice(fin, suivante < 0 ? undefined : suivante);
};
for (const [nom, args] of Object.entries(NOUVELLES)) {
  const sig = `public\\.${nom}\\(${args.replace(/ /g, '\\s*')}\\)`;
  const apres = apresFonction(nom);
  verifier(`\`${nom}\` : retirée à PUBLIC et à \`anon\` juste après elle, rendue à \`authenticated\``,
    new RegExp(`revoke all on function ${sig} from public, anon;`).test(apres)
    && new RegExp(`grant execute on function ${sig} to authenticated;`).test(apres),
    'Une fonction neuve est appelable par PUBLIC, donc SANS COMPTE : l’alerte '
    + 'Supabase ramenée à zéro le 11/10 reviendrait.');
}

{
  /* Le compteur d'appels n'est appelé QUE par la fonction Edge, avec la clé
     de service. Personne d'autre : un client qui pourrait l'appeler
     remplirait les compteurs des autres. */
  const sig = 'public\\.compter_appel_siret\\(text,\\s*timestamptz,\\s*int\\)';
  verifier('`compter_appel_siret` est retirée à PUBLIC, `anon` ET `authenticated`',
    new RegExp(`revoke all on function ${sig}\\s+from public, anon, authenticated;`).test(apresFonction('compter_appel_siret')),
    'Le piège de la section 38 : `from anon, authenticated` seul ne retire RIEN.');
  verifier('…et rien ne la rend à un client',
    !/grant[^;]*compter_appel_siret[^;]*to[^;]*(anon|authenticated|public)/i.test(schema));
}

/* Les tables nouvelles : RLS, et les droits de TABLE retirés explicitement,
   sans attendre qu'une politique rattrape (la leçon de la section 18.2).
   Mesuré par la relecture du plan : `siret_limites` créée sans cela se
   LISAIT et se VIDAIT par `anon`. */
for (const t of ['preuves_siret', 'siret_limites', 'entreprise_registre', 'demandes_pro']) {
  verifier(`\`${t}\` a la RLS activée`,
    new RegExp(`alter table public\\.${t} enable row level security;`).test(schema));
}
for (const t of ['preuves_siret', 'siret_limites']) {
  verifier(`\`${t}\` : aucun droit pour \`anon\` ni \`authenticated\`, et AUCUNE politique`,
    new RegExp(`revoke all on public\\.${t} from anon, authenticated;`).test(schema)
    && !new RegExp(`create policy[^;]*on public\\.${t}\\b`).test(schema),
    'Seule la fonction Edge y écrit, avec la clé de service. Un client qui '
    + 'écrirait une preuve se fabriquerait une entreprise.');
}
verifier('`entreprise_registre` : lecture seule pour `authenticated`, rien pour `anon`',
  /revoke all on public\.entreprise_registre from anon;/.test(schema)
  && /revoke insert, update, delete, truncate on public\.entreprise_registre from authenticated;/.test(schema)
  && !/create policy[^;]*on public\.entreprise_registre\s+for\s+(insert|update|delete|all)/.test(schema),
  'Une politique d’écriture sur l’identité légale, et un client se rattache '
  + 'l’entreprise de son choix.');
verifier('`demandes_pro` : rien pour `anon`, ni modification ni suppression pour le client',
  /revoke all on public\.demandes_pro from anon;/.test(schema)
  && /revoke update, delete, truncate on public\.demandes_pro from authenticated;/.test(schema)
  && !/create policy[^;]*on public\.demandes_pro\s+for\s+(update|delete|all)/.test(schema),
  'Une demande se complète et s’annule par deux fonctions ; tranchée, elle ne '
  + 'se récrit plus.');
verifier('…et le client n’insère qu’une demande NEUVE, sans réponse de l’administration',
  /create policy "envoi de ma demande pro" on public\.demandes_pro\s+for insert to authenticated\s+with check \(auth\.uid\(\) = compte_id\s+and not public\.est_un_pro\(\)\s+and statut = 'nouvelle'\s+and traitee_le is null\s+and traitee_par is null\s+and note is null\)/
    .test(schema),
  'Mesuré par la relecture du plan : sans ces conditions, un client '
  + 's’insérait une demande « acceptée », signée « Validé par Opus ».');
/* RIEN NE ROUVRE CES QUATRE TABLES — sauf, depuis le 15/10, DEUX droits de
   COLONNE sur `demandes_pro`, et ils sont plus étroits que ce qu'ils
   remplacent (relecture adverse) : le client n'écrit plus la date de dépôt
   (il passait en tête de la file en antidatant), et ne lit plus
   `traitee_par` (l'identité de l'administrateur qui l'a refusé). Ces deux
   ordres-là, EXACTEMENT, et rien d'autre : une colonne de plus dans l'un
   d'eux rouvrirait ce qu'il ferme. */
const DROITS_DE_COLONNE_PERMIS = [
  'grant select (id, compte_id, siret, motif, entreprise, metiers, message, justificatif, statut, note, created_at, traitee_le) on public.demandes_pro to authenticated;',
  'grant insert (compte_id, siret, motif, entreprise, metiers, message, justificatif) on public.demandes_pro to authenticated;',
];
const reouvertures = [...schema.matchAll(
  /grant\s+(all|insert|update|delete|select)[^;]*on\s+(table\s+)?public\.(preuves_siret|siret_limites|entreprise_registre|demandes_pro)\b[^;]*to[^;]*(anon|authenticated)[^;]*;/gi,
)].map((m) => m[0].replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim());
const horsListe = reouvertures.filter((g) => !DROITS_DE_COLONNE_PERMIS.includes(g));
verifier('…et rien ne rouvre ces quatre tables plus bas — hors les deux droits de colonne de `demandes_pro`',
  horsListe.length === 0, horsListe.join(' | '));
verifier('…et ces deux droits de colonne suivent le retrait des droits de TABLE (sinon ils ne retirent rien)',
  DROITS_DE_COLONNE_PERMIS.every((g) => reouvertures.includes(g))
  && (() => {
    const norm = schema.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
    const r = norm.indexOf('revoke select, insert on public.demandes_pro from authenticated;');
    return r >= 0 && DROITS_DE_COLONNE_PERMIS.every((g) => norm.indexOf(g) > r);
  })(),
  '`revoke select (colonne)` ne retire rien tant que le rôle peut lire la table entière '
  + '(CLAUDE.md, section 18) : il faut retirer la table, PUIS rendre colonne par colonne.');

{
  const essais45 = readFileSync('supabase/essais-section-45.sql', 'utf8').replace(/^\s*--.*$/gm, '');
  const manquantes = [...Object.keys(NOUVELLES), 'compter_appel_siret']
    .filter((f) => !essais45.includes(`'${f}'`));
  verifier('les essais de la section 45 interrogent le droit de `anon` sur CHACUNE',
    /has_function_privilege\('anon'/.test(essais45) && manquantes.length === 0,
    `Manquantes : ${manquantes.join(', ')}. Ce fichier lit le texte ; seule la `
    + 'base dit si le droit est vraiment retiré.');
}

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} contrôle(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Les portes : un déclencheur n’est appelable par personne, '
  + 'une gardienne garde son droit.\n');
