/**
 * LE BACK-OFFICE — ce qui ne doit jamais se relâcher.
 *
 * POURQUOI UN CONTRÔLE DE PLUS
 * ----------------------------
 * Ce qu'on administre, ce sont les badges et la modération : exactement les
 * deux choses que `CLAUDE.md` protège depuis le 29/09/2026, quand on a
 * découvert qu'un client modifié pouvait s'écrire `kbis_valide = true`.
 *
 * Un back-office est la porte de service de cette protection. Il suffit
 * d'une politique d'écriture ajoutée « pour que ça marche » sur
 * `journal_admin`, et le journal cesse de prouver quoi que ce soit — sans
 * qu'aucun écran ne change d'apparence.
 *
 * LE CONTRÔLE QUI VAUT LES AUTRES RÉUNIS
 * --------------------------------------
 * Le dernier : chaque valeur d'`action` que le SQL INSÈRE doit figurer dans
 * la contrainte `journal_admin_action_check`. C'est la règle la plus chère
 * du projet, apprise avec le format `montage` — la base refusait chaque
 * montage, et le mode démonstration n'y voyait rien. Ici l'oubli serait
 * pire : l'acte d'administration passerait, et c'est la LIGNE DE JOURNAL
 * qui échouerait. On aurait validé un artisan sans trace.
 *
 *   npm run verifier-backoffice
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');

const sql = lire('supabase/schema.sql');
/* On ne lit QUE la section 25 pour les règles qui lui sont propres : le
   reste du fichier contient des politiques d'écriture parfaitement
   légitimes sur d'autres tables. */
/* Le back-office s'étend sur DEUX sections : 25 (la porte, le journal, les
   deux premières files) et 27 (le référentiel). Ne lire que la 25 laissait
   les actions de la 27 hors contrôle — et c'est précisément la contrainte
   `check` qu'il faut tenir à jour. Trouvé le 04/10/2026 en ajoutant la
   troisième file : le contrôle annonçait « 5 actions permises » alors que
   la base en acceptait neuf. */
const section25 = sql.slice(sql.indexOf('--  25. LE BACK-OFFICE'));
const api = lire('src/lib/api.js');
const ecran = lire('src/screens/AdminScreen.js');
const profil = lire('src/screens/ProfilOwnScreen.js');
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*--.*$/gm, '')
  .replace(/^\s*\/\/.*$/gm, '');

console.log('\nLa porte');
{
  verifier('`administrateurs` existe', /create table if not exists public\.administrateurs/.test(section25));
  verifier('…avec la RLS activée', /alter table public\.administrateurs enable row level security/.test(section25));

  /* LE CŒUR : aucune politique d'écriture. Un administrateur qui peut en
     nommer un autre transforme un seul compte compromis en accès
     permanent, et personne ne saurait par où c'est entré. */
  const ecritureAdmins = /create policy[^;]*on public\.administrateurs\s+for\s+(insert|update|delete|all)/i
    .test(section25);
  verifier('aucune politique d’ÉCRITURE sur `administrateurs`', !ecritureAdmins,
    'un administrateur ne doit pas pouvoir en nommer un autre : la seule entrée est l’éditeur SQL');

  verifier('`est_admin()` est `security definer`',
    /create or replace function public\.est_admin\(\)[\s\S]{0,200}security definer/.test(section25),
    'sans cela, la politique de lecture d’`administrateurs` s’appelle elle-même : récursion infinie');

  /* La règle apprise avec `horaires_valides()` le 30/09 : une fonction
     appelée par une POLICY s'exécute avec les droits de celui qui lit. */
  verifier('…et exécutable par `authenticated`',
    /grant execute on function public\.est_admin\(\) to authenticated/.test(section25),
    'une policy l’appelle : révoquée, elle ferait ÉCHOUER la règle au lieu de la filtrer');
}

console.log('\nLe journal');
{
  verifier('`journal_admin` existe', /create table if not exists public\.journal_admin/.test(section25));
  verifier('…avec la RLS activée', /alter table public\.journal_admin enable row level security/.test(section25));

  const ecritureJournal = /create policy[^;]*on public\.journal_admin\s+for\s+(insert|update|delete|all)/i
    .test(section25);
  verifier('aucune politique d’ÉCRITURE sur `journal_admin`', !ecritureJournal,
    'un journal qu’on peut récrire ne prouve rien — pas même pour l’administration');

  /* `now()` rend l'heure de DÉBUT DE TRANSACTION : deux actes de la même
     transaction porteraient le même horodatage, et l'ordre du journal
     deviendrait illisible. Trouvé par les essais le 02/10/2026. */
  verifier('l’horodatage est `clock_timestamp()`, pas `now()`',
    /created_at\s+timestamptz not null default clock_timestamp\(\)/.test(section25),
    '`now()` donne l’heure de début de transaction : deux actes y seraient indiscernables');

  verifier('un acte s’ANONYMISE quand son auteur part',
    /create or replace function public\.anonymise_actes_admin/.test(section25)
    && /create or replace trigger trg_anonymise_actes_admin/.test(section25),
    'ce qui concerne un TIERS s’anonymise, il ne se supprime pas');

  /* Un déclencheur n'a rien à faire en API REST. */
  verifier('…et sa fonction n’est pas appelable depuis l’extérieur',
    /'public\.anonymise_actes_admin\(\)'/.test(sql));
}

console.log('\nLes garde-fous des actions');
{
  verifier('on ne vérifie pas SA PROPRE fiche',
    /if p_pro = moi then[\s\S]{0,400}raise exception/.test(section25),
    'dans une fonction `security definer`, `auth.uid()` reste l’appelant : '
    + 'le verrou `tient_le_profil_pro()` annulerait le geste EN SILENCE');

  verifier('un refus exige un motif',
    /length\(note\) < 10[\s\S]{0,200}raise exception/.test(section25),
    'un refus sans explication fait partir l’artisan sans qu’il sache quoi corriger');

  verifier('`admin_exige_droit()` n’est PAS appelable depuis l’extérieur',
    /'public\.admin_exige_droit\(\)'[\s\S]{0,400}revoke execute/.test(section25)
    || /revoke execute[\s\S]{0,400}'public\.admin_exige_droit\(\)'/.test(section25),
    'exposée en REST, elle dirait à n’importe qui s’il est administrateur');

  /* `verifie` est calculé par `synchronise_verification()`. L'écrire aussi
     ici créerait deux vérités, et c'est toujours la mauvaise qui gagne. */
  const corpsVerifier = section25.slice(
    section25.indexOf('create or replace function public.admin_verifier_pro'),
    section25.indexOf('create or replace function public.admin_refuser_pro'),
  );
  verifier('`admin_verifier_pro` n’écrit PAS `verifie` à la main',
    !/^\s*verifie\s*=/m.test(corpsVerifier),
    '`synchronise_verification()` le calcule : deux sources pour un badge, c’est une de trop');
}

console.log('\nChaque action insérée est dans la contrainte');
{
  /* LA RÈGLE QUI A DÉJÀ COÛTÉ CHER (le format `montage`). Ici, l'oubli ne
     ferait pas échouer l'action mais la LIGNE DE JOURNAL : on validerait un
     artisan sans en garder trace. */
  /* On prend la DERNIÈRE définition du fichier : une contrainte se refait
     (`drop` puis `add`), et c'est la dernière qui s'applique. */
  const toutes = [...section25.matchAll(
    /journal_admin_action_check\s*\n?\s*check \(action in \(([\s\S]*?)\)\)/g)];
  const contrainte = toutes.length ? toutes[toutes.length - 1] : null;
  const permises = new Set(
    contrainte ? [...contrainte[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]) : [],
  );
  /* On ne lit QUE les `insert into journal_admin`, et on y retire les
     valeurs de `cible_type`. Une extraction plus large attrapait
     « verifie » (une valeur de `verification_statut`) et
     « verification_acceptee » (un type de notification) : un contrôle qui
     se trompe de cible fait perdre plus de temps qu'il n'en fait gagner. */
  /* Les `cible_type` ne sont pas des actions. On prend là aussi la DERNIÈRE
     définition : la contrainte a été refaite en section 27, et lire la
     première faisait passer `metier_demande` et `specialite` pour des
     actions manquantes. */
  const toutesCibles = [...section25.matchAll(/cible_type in \(([^)]*)\)/g)];
  const cibles = new Set(
    toutesCibles.length
      ? [...toutesCibles[toutesCibles.length - 1][1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1])
      : [],
  );
  const inserees = new Set();
  [...section25.matchAll(/insert into public\.journal_admin[\s\S]*?;/g)].forEach((bloc) => {
    /* `->>'verifie'` lit une CLÉ du JSON, ce n'est pas une action. Sans
       cette ligne le contrôle accusait la lecture de l'état d'avant. */
    const texte = bloc[0].replace(/->>\s*'[a-z_]+'/g, '');
    [...texte.matchAll(/'([a-z_]+)'/g)].forEach((m) => {
      if (!cibles.has(m[1])) inserees.add(m[1]);
    });
  });
  const manquantes = [...inserees].filter((a) => !permises.has(a));
  verifier(`les ${inserees.size} actions insérées sont toutes permises (${permises.size} dans la contrainte)`,
    manquantes.length === 0,
    `${manquantes.join(', ')} — « alter table … add column if not exists » ne touche pas aux `
    + 'contraintes : il faut la refaire explicitement (voir CLAUDE.md)');

  const inutiles = [...permises].filter((a) => !inserees.has(a));
  if (inutiles.length) {
    console.log(`      (jamais insérées, à retirer un jour : ${inutiles.join(', ')})`);
  }
}

console.log('\nL’application ne contourne pas la base');
{
  const apiPropre = sansCommentaires(api);

  /* Les six appels passent par `rpc` : la règle reste dans la base, là où
     un client modifié ne l'atteint pas. */
  ['admin_resume', 'admin_file_verifications', 'admin_signalements',
    'admin_verifier_pro', 'admin_refuser_pro', 'admin_traiter_signalement',
  ].forEach((f) => {
    verifier(`\`${f}\` est appelée par \`rpc\``,
      new RegExp(`rpc\\('${f}'`).test(apiPropre));
  });

  /* Une écriture directe des colonnes de vérification échouerait EN
     SILENCE : le verrou de la section 17.3 les remet à leur ancienne
     valeur, sans lever d'erreur. Le pire des défauts. */
  verifier('aucune écriture directe des colonnes de vérification',
    !/from\('professional_profiles'\)[\s\S]{0,300}(kbis_valide|assurance_valide|verifie)\s*:/.test(apiPropre),
    'le verrou `tient_le_profil_pro()` l’annulerait sans la moindre erreur');

  /* Le mode démonstration n'administre rien : il n'y a pas de base à
     administrer, et un badge posé sur des données en mémoire donnerait
     l'illusion d'avoir validé un artisan qui n'existe pas. */
  verifier('le back-office est fermé en mode démonstration',
    /async function resumeAdminDemo[\s\S]{0,300}admin: false/.test(apiPropre));
}

console.log('\nL’écran suit les règles de la maison');
{
  const e = sansCommentaires(ecran);
  verifier('les cartes passent par `CARTE`', /\.\.\.CARTE/.test(e));
  verifier('la marge passe par `GOUTTIERE`', /GOUTTIERE/.test(e));
  verifier('les deux listes portent leurs trois réglages',
    (e.match(/initialNumToRender/g) || []).length >= 2
    && (e.match(/maxToRenderPerBatch/g) || []).length >= 2
    && (e.match(/windowSize/g) || []).length >= 2,
    'une FlatList monte DIX éléments d’un coup par défaut');

  /* La saisie d'une note dans une carte : si le texte vivait dans l'écran,
     chaque lettre redessinerait les deux files. C'est le défaut mesuré à
     203 ms par lettre le 02/10. */
  verifier('les notes sont des `ChampLocal`', /ChampLocal/.test(e),
    'sinon chaque lettre redessine toute la file');

  verifier('le libellé d’un motif vient de `moderation.js`',
    /motifDe\(/.test(e),
    'une clé affichée brute (« travail_dissimule ») ressemble à une faute de frappe');
  verifier('le délai promis vient de `moderation.js`',
    /DELAI_EXAMEN_HEURES/.test(e) && !/\b48 heures\b/.test(e.replace(/DELAI_EXAMEN_HEURES/g, '')),
    'recopier « 48 » ici, c’est garantir que l’écran et la promesse divergeront');

  verifier('le propriétaire est prévenu pour SA fiche', /estMoi/.test(e),
    'sinon son premier geste tombe sur une erreur incompréhensible');

  verifier('le bouton d’entrée est conditionné au droit',
    /admin && !!onAdmin/.test(sansCommentaires(profil)),
    'il ne s’affiche que pour qui l’a — et la base revérifie de toute façon');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ La porte tient, le journal ne se récrit pas, et l’écran ne '
  + 'contourne pas la base.\n');
