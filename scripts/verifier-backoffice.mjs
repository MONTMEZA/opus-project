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

console.log('\nLe journal ne garde que l’état — TOUTES les fonctions qui y écrivent');
{
  /* POURQUOI UN RELEVÉ DE TOUT LE FICHIER — 15/10/2026, relecture adverse.
     Le contrôle ne regardait que QUATRE fonctions, et n'y cherchait que
     `to_jsonb(`. Trois autres copiaient encore la ligne entière (le texte
     libre d'un signalement et son auteur, le motif libre d'une demande de
     métiers, le mot proposé par un artisan) pendant que les textes légaux
     promettaient « la décision, le motif écrit par l'administrateur ». Et
     dans les quatre, deux sabotages passaient sans un ✘ :
     `apres := apres || jsonb_build_object('message', d.message)` et
     `apres := apres || jsonb_strip_nulls(row_to_json(d)::jsonb)`.

     On relève donc TOUTES les fonctions qui écrivent au journal ; une
     nouvelle doit être rangée dans une famille ICI, en disant ce qu'elle
     garde. Et dans chacune : chaque état (`avant`, `apres`, `avant_e`,
     `apres_e`) naît d'un `jsonb_build_object` dont les CLÉS sont dans la
     liste de sa famille, sans `||` ni copie de ligne, et l'insertion au
     journal ne passe que ces variables. */
  const sqlNu = sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
  const DECL = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?([a-z_0-9]+)"?\s*\(/gi;
  const debuts = [...sqlNu.matchAll(DECL)];
  const parNom = new Map();
  debuts.forEach((m, i) => {
    const borne = i + 1 < debuts.length ? debuts[i + 1].index : sqlNu.length;
    const tranche = sqlNu.slice(m.index, borne);
    const a = /\bas\s+(\$\w*\$)/i.exec(tranche);
    if (!a) return;
    const fin = tranche.indexOf(a[1], a.index + a[0].length);
    parNom.set(m[1], tranche.slice(a.index + a[0].length, fin < 0 ? undefined : fin));
  });
  const BADGE = ['verifie', 'kbis_valide', 'assurance_valide', 'rge', 'verification_statut'];
  const FAMILLES = {
    admin_verifier_pro: BADGE,
    admin_refuser_pro: BADGE,
    admin_traiter_signalement: ['statut'],
    admin_traiter_metier_demande: ['statut'],
    admin_traiter_specialite: ['statut'],
    admin_traiter_demande_pro: ['statut', 'motif', 'siren'],
    admin_retirer_entreprise: ['statut', 'motif', 'siren'],
  };
  const ecrivains = [...parNom.entries()]
    .filter(([, corps]) => /insert\s+into\s+public\.journal_admin\b/i.test(corps)).map(([n]) => n);
  const inconnus = ecrivains.filter((n) => !FAMILLES[n]);
  verifier(`chaque fonction qui écrit au journal est rangée dans une famille (${ecrivains.length} trouvées)`,
    inconnus.length === 0 && Object.keys(FAMILLES).every((n) => ecrivains.includes(n)),
    `${inconnus.length ? `inconnues : ${inconnus.join(', ')}` : 'une fonction attendue n’écrit plus au journal'}`
    + ' — une fonction nouvelle doit dire ICI ce qu’elle garde');

  /* Les arguments d'un appel, découpés aux virgules de PREMIER niveau. */
  const argumentsDe = (texte) => {
    const args = [];
    let prof = 0;
    let cour = '';
    let chaine = false;
    for (const c of texte) {
      if (c === "'") chaine = !chaine;
      if (!chaine && c === '(') prof += 1;
      if (!chaine && c === ')') prof -= 1;
      if (!chaine && c === ',' && prof === 0) { args.push(cour.trim()); cour = ''; } else cour += c;
    }
    if (cour.trim()) args.push(cour.trim());
    return args;
  };
  /* `jsonb_build_object( … )` en entier, parenthèse fermante comprise. */
  const appelEntier = (texte, debut) => {
    let prof = 0;
    let chaine = false;
    for (let k = debut; k < texte.length; k += 1) {
      const c = texte[k];
      if (c === "'") chaine = !chaine;
      if (chaine) continue;
      if (c === '(') prof += 1;
      if (c === ')') { prof -= 1; if (prof === 0) return texte.slice(debut, k + 1); }
    }
    return null;
  };
  const COPIE = /\b(to_jsonb|row_to_json|to_json|jsonb_populate_record|jsonb_populate_recordset|json_populate_record|jsonb_strip_nulls|hstore)\s*\(|\|\|/i;
  const VARS = '(avant|apres|avant_e|apres_e)';

  for (const nom of ecrivains.filter((n) => FAMILLES[n])) {
    const corps = parNom.get(nom);
    const permises = FAMILLES[nom];
    const fautes = [];
    let etats = 0;
    const jugerExpression = (expr, ou) => {
      const e = expr.trim();
      if (COPIE.test(e)) { fautes.push(`${ou} : copie ou concaténation (${e.slice(0, 60)})`); return; }
      if (!/^jsonb_build_object\s*\(/i.test(e)) { fautes.push(`${ou} : pas un jsonb_build_object (${e.slice(0, 60)})`); return; }
      const appel = appelEntier(e, e.indexOf('('));
      if (!appel || e.slice(e.indexOf('(') + appel.length).trim() !== '') {
        fautes.push(`${ou} : quelque chose suit le jsonb_build_object (${e.slice(0, 60)})`);
        return;
      }
      const args = argumentsDe(appel.slice(1, -1));
      args.forEach((a, k) => {
        if (k % 2 !== 0) return;
        const cle = (/^'([a-z_]+)'$/.exec(a) || [])[1];
        if (!cle) fautes.push(`${ou} : une clé qui n’est pas un mot écrit (${a})`);
        else if (!permises.includes(cle)) fautes.push(`${ou} : clé « ${cle} » hors de la liste`);
      });
      etats += 1;
    };
    // 1. les affectations : `x := …;` et `x = …;` en tête d'instruction
    for (const m of corps.matchAll(new RegExp(`(?:^|[;\\n]|\\bthen|\\belse|\\bbegin|\\bloop)\\s*${VARS}\\s*:?=\\s*([^;]*);`, 'gi'))) {
      jugerExpression(m[2], `${m[1]} :=`);
    }
    // 2. les `select … into x`
    for (const m of corps.matchAll(new RegExp(`select\\s+([\\s\\S]*?)\\s+into\\s+${VARS}\\b`, 'gi'))) {
      // `select jsonb_build_object(…), p.entreprise into avant, qui` : seul le premier terme va au journal
      const liste = argumentsDe(m[1]);
      jugerExpression(liste[0] || '', `select … into ${m[2]}`);
    }
    // 3. l'insertion : avant / apres ne reçoivent QUE ces variables
    const inserts = [...corps.matchAll(/insert\s+into\s+public\.journal_admin\s*\(([^)]*)\)\s*values\s*\(/gi)];
    inserts.forEach((m) => {
      const cols = m[1].split(',').map((x) => x.trim());
      const ouvre = m.index + m[0].length - 1;
      const valeurs = appelEntier(corps, ouvre);
      const vals = valeurs ? argumentsDe(valeurs.slice(1, -1)) : [];
      ['avant', 'apres'].forEach((col) => {
        const k = cols.indexOf(col);
        const v = k >= 0 ? (vals[k] || '') : '';
        if (k >= 0 && !new RegExp(`^${VARS}$`, 'i').test(v)) {
          fautes.push(`insertion : la colonne ${col} reçoit « ${v.slice(0, 50)} »`);
        }
      });
    });
    verifier(`\`${nom}\` : ses états ne portent que ${permises.join(', ')}`,
      fautes.length === 0 && etats >= 2 && inserts.length >= 1,
      fautes.length ? fautes.join(' ; ') : `${etats} état(s), ${inserts.length} insertion(s)`);
  }

  /* Et les lignes DÉJÀ écrites par ces trois files : sans rattrapage, le
     journal de la vraie base garderait pour toujours ce que les fonctions
     n'écrivent plus. Posé APRÈS la section 27 : un `update` est contrôlé
     par la contrainte des actions en vigueur, qui ne connaît les actions de
     la 27 qu'à partir de là (mesuré : placé en 25, le rejeu s'arrêtait). */
  const iRattrapage = sqlNu.search(/update public\.journal_admin j[\s\S]{0,800}?where j\.cible_type in \('signalement', 'metier_demande', 'specialite'\)/);
  const iSpecialite = sqlNu.search(/create or replace function public\.admin_traiter_specialite\(/);
  verifier('les lignes déjà écrites par ces trois files sont rattrapées, après la section 27',
    iRattrapage > 0 && iSpecialite > 0 && iRattrapage > iSpecialite
    && /e\.key = 'statut'/.test(sqlNu.slice(iRattrapage, iRattrapage + 800)),
    'sinon le texte libre d’un signaleur reste au journal de la vraie base, après son départ');
}

console.log('\nLa porte de secours et les entreprises (section 45)');
{
  /* Le corps d'une fonction : de sa déclaration au `$$;` qui la ferme, et
     ses droits : ce qui suit, jusqu'à la déclaration suivante. Les droits
     d'une fonction s'écrivent JUSTE APRÈS elle — dans une boucle qui avale
     `undefined_function`, ils seraient passés sous silence sur une base
     neuve (la leçon de `mes_donnees`, section 35). */
  const morceau = (nom) => {
    const i = section25.indexOf(`create or replace function public.${nom}(`);
    if (i < 0) return { corps: '', apres: '' };
    const fin = section25.indexOf('$$;', i);
    const suivante = section25.indexOf('create or replace function', fin);
    return {
      corps: section25.slice(i, fin),
      apres: section25.slice(fin, suivante < 0 ? undefined : suivante),
    };
  };
  const SIGNATURES = {
    admin_demandes_pro: '',
    admin_traiter_demande_pro: 'uuid, text, text',
    admin_retirer_entreprise: 'uuid, text',
  };
  for (const [nom, args] of Object.entries(SIGNATURES)) {
    const { corps, apres } = morceau(nom);
    verifier(`\`${nom}\` existe et exige le droit d’administration d’abord`,
      /(moi\s+uuid := public\.admin_exige_droit\(\)|begin\s+perform public\.admin_exige_droit\(\);)/.test(corps),
      'sans ce garde en tête, n’importe quel compte connecté ouvrirait des comptes pro');
    const sig = `public\\.${nom}\\(${args.replace(/ /g, '\\s*')}\\)`;
    verifier(`…et ses droits sont écrits JUSTE APRÈS elle (\`from public, anon\`, puis \`authenticated\`)`,
      new RegExp(`revoke all on function ${sig} from public, anon;`).test(apres)
      && new RegExp(`grant execute on function ${sig} to authenticated;`).test(apres),
      'PostgreSQL accorde `execute` à PUBLIC sur toute fonction neuve : sans '
      + '`from public`, elle serait appelable sans compte');
  }

  /* LE JOURNAL NE GARDE QUE L'ÉTAT. Mesuré le 15/10/2026 : il copiait la
     fiche entière — téléphone, SIRET, e-mail, coordonnées — et la gardait
     après la suppression du compte de la personne visée. */
  for (const nom of ['admin_verifier_pro', 'admin_refuser_pro',
    'admin_traiter_demande_pro', 'admin_retirer_entreprise']) {
    verifier(`\`${nom}\` ne recopie aucune ligne entière (\`to_jsonb(\`)`,
      !!morceau(nom).corps && !/to_jsonb\(/.test(morceau(nom).corps),
      '`to_jsonb(ligne)` emporte toutes les colonnes, données personnelles '
      + 'comprises, dans un journal que rien n’efface');
  }
  const clesDe = (corps, variables) => {
    const cles = new Set();
    const motif = new RegExp(`\\b(?:${variables.join('|')})\\s*:=\\s*jsonb_build_object\\(([\\s\\S]*?)\\);`, 'g');
    let n = 0;
    for (const m of corps.matchAll(motif)) {
      n += 1;
      // les clés sont les arguments de rang pair : 'cle', valeur, 'cle', valeur…
      const args = m[1].split(',').map((x) => x.trim());
      args.forEach((a, k) => { if (k % 2 === 0) cles.add(a.replace(/^'|'$/g, '')); });
    }
    return { cles, n };
  };
  for (const nom of ['admin_traiter_demande_pro', 'admin_retirer_entreprise']) {
    const { cles, n } = clesDe(morceau(nom).corps, ['avant', 'apres', 'avant_e', 'apres_e']);
    const intrus = [...cles].filter((c) => !['statut', 'motif', 'siren'].includes(c));
    verifier(`\`${nom}\` : \`avant\`/\`apres\` ne portent que statut, motif, siren`,
      n >= 2 && intrus.length === 0,
      `${n} état(s) trouvé(s)${intrus.length ? `, clés en trop : ${intrus.join(', ')}` : ''} — `
      + 'jamais le message libre, l’entreprise ou l’adresse');
  }
  for (const nom of ['admin_verifier_pro', 'admin_refuser_pro']) {
    const corps = morceau(nom).corps;
    const etats = [...corps.matchAll(/select jsonb_build_object\(([\s\S]*?)\)(?:, [a-z.]+)?\s+into (?:avant|apres)/g)];
    const cles = new Set();
    etats.forEach((m) => m[1].split(',').map((x) => x.trim())
      .forEach((a, k) => { if (k % 2 === 0) cles.add(a.replace(/^'|'$/g, '')); }));
    const permises = ['verifie', 'kbis_valide', 'assurance_valide', 'rge', 'verification_statut'];
    verifier(`\`${nom}\` : \`avant\`/\`apres\` ne portent que les colonnes du badge`,
      etats.length === 2 && [...cles].every((c) => permises.includes(c)),
      `${etats.length} état(s) lu(s), clés : ${[...cles].join(', ')}`);
  }

  verifier('les lignes DÉJÀ écrites sont rattrapées (un `update`, rejouable)',
    /update public\.journal_admin j[\s\S]{0,1500}?where j\.cible_type = 'profil_pro'/.test(section25)
    && /e\.key in \('verifie', 'kbis_valide', 'assurance_valide',\s*'rge', 'verification_statut'\)/.test(section25),
    'sans lui, la copie des fiches d’avant ce lot reste au journal pour toujours');

  const traiter = morceau('admin_traiter_demande_pro').corps;
  verifier('on ne statue pas sur SA PROPRE demande',
    /if d\.compte_id = moi then\s*raise exception/.test(traiter));
  verifier('refuser et transférer exigent une note d’au moins dix caractères',
    (traiter.match(/length\(v_note\) < 10/g) || []).length >= 2
    && /length\(v_motif\) < 10/.test(morceau('admin_retirer_entreprise').corps),
    'celui qu’on refuse, ou à qui on retire son entreprise, doit savoir pourquoi');
  verifier('ACCEPTER ne prend jamais en silence une entreprise tenue par un autre',
    /if found and p_decision = 'accepter' then\s*raise exception[\s\S]{0,300}?using errcode = 'OP007'/.test(traiter),
    'c’est `transferer` qui retire, avec une note, une ligne au journal et une '
    + 'notification — jamais un écrasement sans trace');

  /* Les notifications de l'administration n'ont PAS d'acteur : ce serait
     l'administrateur, et elles porteraient la photo de sa fiche d'artisan. */
  const notifs = [...traiter.matchAll(/insert into public\.notifications \(([^)]*)\)/g),
    ...morceau('admin_retirer_entreprise').corps.matchAll(/insert into public\.notifications \(([^)]*)\)/g)];
  verifier('les notifications au demandeur et au titulaire n’ont pas d’acteur',
    notifs.length >= 4 && notifs.every((m) => !/acteur_id/.test(m[1])),
    `${notifs.length} notification(s) trouvée(s)`);

  /* `admin_resume` compte les demandes nouvelles : elle a dû passer en
     plpgsql, parce qu'une fonction `language sql` est contrôlée à sa
     création et que `demandes_pro` naît plus bas. */
  const resumes = section25.match(/create or replace function public\.admin_resume\(\)/g) || [];
  const resume = morceau('admin_resume').corps;
  verifier('`admin_resume` compte les demandes de compte pro, en plpgsql, une seule fois',
    resumes.length === 1 && /language plpgsql/.test(resume)
    && /'demandes_pro', \(select count\(\*\) from public\.demandes_pro where statut = 'nouvelle'\)/.test(resume),
    'en `language sql`, le premier passage du schéma sur une base neuve échoue');

  /* REJOUABLE SUR UNE BASE QUI A SERVI. Les définitions plus étroites qui
     précèdent la dernière doivent être `not valid` — sinon le rejeu s'arrête
     sur la première ligne d'un acte plus récent. Mesuré. */
  const defs = [...section25.matchAll(
    /journal_admin_action_check\s*\n?\s*check \(action in \([\s\S]*?\)\)\s*(not valid)?\s*;/g)];
  verifier(`les ${defs.length} définitions de l’action : toutes \`not valid\` sauf la dernière`,
    defs.length >= 2 && defs.slice(0, -1).every((d) => d[1]) && !defs[defs.length - 1][1],
    'une définition étroite VALIDÉE refuse au rejeu les actes que la suivante permet');
  const defsC = [...section25.matchAll(/journal_admin_cible_check\s*\n?\s*check \(cible_type in \([^)]*\)\)\s*(not valid)?\s*;/g)];
  verifier(`…et les ${defsC.length} définitions de la cible aussi`,
    defsC.length >= 2 && defsC.slice(0, -1).every((d) => d[1]) && !defsC[defsC.length - 1][1]);
}

console.log('\nL’application ne contourne pas la base');
{
  const apiPropre = sansCommentaires(api);

  /* Les six appels passent par `rpc` : la règle reste dans la base, là où
     un client modifié ne l'atteint pas. */
  /* Les trois de la section 45 aussi : une file que l'écran ne lit pas est
     le défaut du 01/10 — « X est prévenu », et personne ne l'était. */
  ['admin_resume', 'admin_file_verifications', 'admin_signalements',
    'admin_verifier_pro', 'admin_refuser_pro', 'admin_traiter_signalement',
    'admin_demandes_pro', 'admin_traiter_demande_pro', 'admin_retirer_entreprise',
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
