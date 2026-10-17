/**
 * ÊTRE UN PROFESSIONNEL NE SE DÉCIDE PAS SOI-MÊME.
 *
 * LE TROU, TROUVÉ LE 15/10/2026 EN PRÉPARANT LE SIRET À L'INSCRIPTION
 * -------------------------------------------------------------------
 * `est_un_pro()` rend « a une ligne dans `professional_profiles` ». Et RIEN
 * ne disait qui a le droit d'en avoir une. Prouvé sur PostgreSQL 16, avec
 * la seule clé publiable, un particulier :
 *
 *   1. se déclarait pro (`update users set type = 'pro'`) ;
 *   2. s'insérait une fiche professionnelle — `est_un_pro()` devenait VRAI ;
 *   3. lisait les demandes des particuliers : la commune, le texte, et
 *      l'adresse des photos de leur maison ;
 *   4. publiait dans le fil, posait une annonce, ouvrait un carnet de
 *      clients, créait un chantier public.
 *
 * « Le fil est réservé aux professionnels » n'était tenu que par l'ÉCRAN
 * (`canPublish = userType === 'pro'`). Un client modifié passait.
 *
 * Et une SECONDE porte, trouvée en écrivant CE contrôle :
 * `preparer_suppression_compte()` efface la ligne `users` de l'appelant,
 * dont le jeton reste valide. Il la recréait avec `type = 'pro'`. Un verrou
 * posé sur l'UPDATE seul ne fermait donc rien.
 *
 * CE QUI SE VÉRIFIE ICI
 * ---------------------
 *   1. le type d'un compte ne change pas par la main de son titulaire, ni à
 *      la modification NI à la création de la ligne ;
 *   2. une fiche professionnelle n'existe que sur un compte professionnel ;
 *   3. le fil, les annonces, les réponses exigent `est_un_pro()` en
 *      ÉCRITURE — et seulement en écriture : on retire toujours ce qu'on a
 *      posé ;
 *   4. `est_mon_entreprise()` l'exige aussi, ce qui ferme d'un coup les
 *      clients et les chantiers ;
 *   5. les deux verrous sont posés AVANT le balayage des portes (section
 *      43), qui leur retire le droit d'exécution ;
 *   6. l'application ne crée ni ne modifie jamais le type elle-même ;
 *   7. (section 45, 15/10/2026) une fiche ne se crée plus depuis
 *      l'application (OP010), le verrou du type laisse passer les fonctions
 *      de la base — et SEULES trois d'entre elles écrivent `users.type`.
 *
 * CE QUI NE SE VÉRIFIE PAS ICI : la base elle-même. Les 21 cas sont dans
 * `supabase/essais-section-44.sql`, à jouer sur un vrai PostgreSQL.
 *
 *   npm run verifier-pro
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

/* Un contrôle qui lit du code retire d'abord les commentaires : c'est
   arrivé cinq fois dans ce projet qu'un contrôle accuse la documentation
   qui EXPLIQUE le défaut qu'il traque. */
function sansCommentaires(source) {
  let dedans = null;
  let sortie = '';
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    const suivant = source[i + 1];
    if (!dedans && c === '/' && suivant === '/') { dedans = 'ligne'; }
    else if (!dedans && c === '/' && suivant === '*') { dedans = 'bloc'; }
    else if (dedans === 'ligne' && c === '\n') { dedans = null; }
    else if (dedans === 'bloc' && c === '*' && suivant === '/') {
      dedans = null; sortie += '  '; i += 1; continue;
    }
    sortie += dedans && c !== '\n' ? ' ' : c;
  }
  return sortie;
}

const lire = (f) => readFileSync(f, 'utf8');
const sql = lire('supabase/schema.sql').replace(/--[^\n]*/g, '');
const api = sansCommentaires(lire('src/lib/api.js'));

/* Le corps d'une fonction, de sa déclaration jusqu'au `$$;` qui la ferme.
   On prend la DERNIÈRE déclaration : c'est elle qui gagne quand le fichier
   est rejoué, et une version corrigée plus haut ne doit pas masquer une
   version cassée plus bas. */
function derniereFonction(nom) {
  const motif = new RegExp(
    `create or replace function public\\.${nom}\\([^)]*\\)[\\s\\S]*?\\$\\$;`, 'g',
  );
  const toutes = [...sql.matchAll(motif)];
  return toutes.length ? { corps: toutes[toutes.length - 1][0], index: toutes[toutes.length - 1].index, nombre: toutes.length } : null;
}

console.log('\n1. Le type d’un compte ne change pas par la main de son titulaire');
{
  const f = derniereFonction('tient_le_type_du_compte');
  verifier('`tient_le_type_du_compte()` existe', !!f);
  const corps = f ? f.corps : '';

  verifier('elle ne s’applique qu’au TITULAIRE (`auth.uid() = new.id`)',
    /auth\.uid\(\)\s+is not null/.test(corps) && /auth\.uid\(\)\s*=\s*new\.id/.test(corps),
    'sans cette condition, l’éditeur SQL et les fonctions de l’administration '
    + 'ne pourraient plus corriger un type — et c’est par là que passera un '
    + 'particulier qui devient artisan');

  verifier('elle refuse de CHANGER le type',
    /tg_op\s*=\s*'UPDATE'\s+and\s+new\.type\s+is distinct from\s+old\.type/.test(corps),
    'la première porte : `update users set type = \'pro\'`');

  verifier('…et de le CRÉER autrement que particulier',
    /tg_op\s*=\s*'INSERT'\s+and\s+new\.type\s+is distinct from\s+'particulier'/.test(corps),
    'la seconde porte : `preparer_suppression_compte()` efface la ligne, '
    + 'le jeton reste valide, et la ligne se recréait en pro');

  /* LE MESSAGE A CHANGÉ LE 15/10/2026, et ce contrôle avec lui. Il exigeait
     « contactez Opus » : c'était la seule porte écrite, et elle ne menait
     nulle part — Opus n'a aucune boîte aux lettres (CLAUDE.md, 12/10).
     Depuis la section 45, la vraie porte existe dans l'application. Le
     message doit la NOMMER, et ne plus promettre un contact qui n'existe
     pas. */
  verifier('elle REFUSE, avec un code et une phrase en français (OP004)',
    /raise exception[\s\S]*?using errcode = 'OP004'/.test(corps),
    'un retour silencieux à l’ancienne valeur ferait répondre `UPDATE 1` '
    + 'à un geste qui n’a pas eu lieu');

  verifier('…qui désigne la VRAIE porte : Profil → Passer en compte professionnel',
    /Profil → Passer en compte professionnel/.test(corps),
    'un refus doit dire quoi faire ; la porte existe depuis la section 45');

  verifier('…et ne promet plus de « contacter Opus »',
    !/contactez Opus/i.test(corps),
    'Opus n’a aucune boîte aux lettres : la promesse menait nulle part');

  /* LA SECONDE ÉCHAPPATOIRE (section 45) : une fonction de la base qui
     écrit POUR le titulaire — `devenir_pro()` — a `auth.uid() = new.id`.
     Ce qui la distingue du client, c'est `current_user`. */
  verifier('elle ne refuse que le CLIENT (`current_user in (\'authenticated\', \'anon\')`)',
    /current_user in \('authenticated', 'anon'\)/.test(corps),
    'sans cette condition, `devenir_pro()` — la porte légitime — serait refusée');

  verifier('…et elle est `security invoker`, sinon `current_user` ne dit rien',
    /security invoker/.test(corps) && !/security definer/.test(corps),
    'mesuré sur PostgreSQL 16 : dans une fonction `security definer`, '
    + '`current_user` vaut TOUJOURS son propriétaire — le verrou ne fermerait '
    + 'plus rien, et sans un mot');

  verifier('son déclencheur porte sur la CRÉATION et sur la MODIFICATION',
    /create or replace trigger trg_tient_le_type_du_compte\s+before insert or update of type on public\.users/
      .test(sql),
    '`for all`, c’est quatre portes : un verrou sur l’UPDATE seul laissait '
    + 'l’INSERT ouvert');
}

console.log('\n2. Une fiche professionnelle n’existe que sur un compte professionnel');
{
  const f = derniereFonction('exige_un_compte_pro');
  verifier('`exige_un_compte_pro()` existe', !!f);
  const corps = f ? f.corps : '';

  verifier('elle lit le type du compte dans `users`',
    /select u\.type into le_type from public\.users u where u\.id = new\.id/.test(corps));

  verifier('elle refuse tout ce qui n’est pas `pro`',
    /if le_type is distinct from 'pro' then/.test(corps)
    && /using errcode = 'OP005'/.test(corps),
    '`is distinct from` et pas `<>` : une ligne `users` absente rend NULL, '
    + 'et `NULL <> \'pro\'` n’est pas vrai — la fiche passerait');

  /* ELLE A CESSÉ D'ÊTRE `security definer` LE 15/10/2026, et ce contrôle
     l'exigeait. Il avait raison sur le moment — elle lit `users.type`, que
     les droits de colonne pourraient un jour fermer. Mais OP010 repose sur
     `current_user`, et dans une fonction `security definer` il vaut TOUJOURS
     le propriétaire : mesuré, la même écriture du client affiche `postgres`
     en `definer` et `authenticated` en `invoker`. Écrite en `definer`, la
     fermeture n'aurait jamais rien fermé. Et la lecture du type ne se fait
     plus qu'APRÈS le refus du client : seuls la base et la clé de service
     l'atteignent, et ils lisent tout. */
  verifier('elle est `security invoker`',
    /security invoker/.test(corps) && !/security definer/.test(corps),
    'en `security definer`, `current_user` vaut le propriétaire : OP010 ne '
    + 'serait JAMAIS levé, et rien ne le dirait');

  verifier('elle refuse TOUTE fiche venue du client (OP010)',
    /if current_user in \('authenticated', 'anon'\) then\s*raise exception[\s\S]*?using errcode = 'OP010'/
      .test(corps),
    'section 45 : une fiche ne naît que dans une fonction de la base, qui '
    + 'exige une entreprise. Un INSERT du client créerait une fiche SANS '
    + 'entreprise — exactement ce que faisaient `ensureProProfile` et '
    + '`reparerFichePro`');

  verifier('…et ce refus passe AVANT la lecture du type',
    corps.indexOf("errcode = 'OP010'") > -1
    && corps.indexOf("errcode = 'OP010'") < corps.indexOf('select u.type into le_type'),
    'après, un client sans ligne `users` tomberait sur OP005 et un client pro '
    + 'passerait : la fermeture dépendrait de l’état du compte');

  verifier('elle ne dépend PAS de `auth.uid()`',
    !/auth\.uid\(\)/.test(corps),
    'c’est une règle sur une DONNÉE : elle n’a pas d’échappatoire, et '
    + '`auth.uid()` n’est pas nul dans une fonction `security definer` '
    + '(section 25)');

  verifier('son déclencheur porte sur la CRÉATION de la fiche',
    /create or replace trigger trg_exige_un_compte_pro\s+before insert on public\.professional_profiles/
      .test(sql));
}

console.log('\n3. Le fil, les annonces et les réponses exigent d’être pro EN ÉCRITURE');
{
  /* Toutes les politiques d'écriture de ces trois tables, où qu'elles
     soient dans le fichier : une politique ajoutée demain sans la condition
     rouvrirait le trou, et elle n'aurait pas le nom de celles d'aujourd'hui. */
  for (const table of ['posts', 'annonces_pro', 'annonce_reponses']) {
    const motif = new RegExp(
      `create policy "([^"]+)"\\s+on public\\.${table}\\s+for (all|insert)\\b([\\s\\S]*?);`, 'g',
    );
    const politiques = [...sql.matchAll(motif)];
    verifier(`\`${table}\` a au moins une politique d’écriture`, politiques.length > 0,
      'si ce contrôle ne la trouve plus, il ne vérifie plus rien');

    for (const [, nom, verbe, reste] of politiques) {
      const avec = /with check\s*\(([\s\S]*)\)\s*$/.exec(reste.trim());
      verifier(`« ${nom} » exige \`est_un_pro()\` dans son \`with check\``,
        !!avec && /public\.est_un_pro\(\)/.test(avec[1]),
        'sans elle, n’importe quel compte connecté écrit dans une table '
        + 'réservée aux professionnels — l’écran ne protège personne');

      if (verbe === 'all') {
        const sur = /using\s*\(([\s\S]*?)\)\s*with check/.exec(reste);
        verifier(`…et PAS dans son \`using\` (on retire toujours ce qu’on a posé)`,
          !!sur && !/est_un_pro/.test(sur[1]),
          '`using` gouverne aussi la SUPPRESSION : un auteur dont la fiche '
          + 'aurait disparu ne pourrait plus retirer sa propre publication');
      }
    }
  }
}

console.log('\n4. `est_mon_entreprise()` ferme les clients et les chantiers');
{
  const f = derniereFonction('est_mon_entreprise');
  verifier('`est_mon_entreprise()` existe', !!f);
  const corps = f ? f.corps : '';
  verifier('elle exige d’être pro, en plus d’être soi',
    /auth\.uid\(\)\s*=\s*p_entreprise/.test(corps) && /public\.est_un_pro\(\)/.test(corps),
    'c’est la fonction prévue pour CE jour-là : changer une ligne ici ferme '
    + 'toutes les règles des chantiers et des clients, au lieu de les '
    + 'réécrire une par une');
  verifier('elle reste `security invoker`',
    /security invoker/.test(corps),
    'elle est appelée par des POLITIQUES ; en `security definer`, '
    + '`est_un_pro()` y lirait les fiches avec les droits du propriétaire');
}

console.log('\n5. Les deux verrous sont posés AVANT le balayage des portes');
{
  const balayage = sql.indexOf('do $portes$');
  verifier('le balayage de la section 43 existe toujours', balayage > 0);
  for (const nom of ['tient_le_type_du_compte', 'exige_un_compte_pro']) {
    const f = derniereFonction(nom);
    verifier(`\`${nom}()\` est créée avant le balayage`,
      !!f && balayage > 0 && f.index < balayage,
      'le balayage ne voit que les déclencheurs déjà créés : posée après, la '
      + 'fonction resterait exécutable par `authenticated` — la porte que '
      + 'la section 43 a fermée');
  }
}

console.log('\n5 bis. Seules TROIS fonctions de la base écrivent `users.type`');
{
  /* LA PORTE QUE LA SECTION 45 A DÛ OUVRIR, et qu'il faut garder étroite.
     Le verrou 44.1 laisse passer `current_user` différent du client, donc
     TOUTE fonction `security definer` — ou tout déclencheur `security
     definer` — qui écrirait `users.type` promouvrait n'importe qui, et ce
     verrou ne dirait rien. Éprouvé dans `essais-section-45.sql` (B36) : un
     déclencheur `definer` posé sur `demandes_pro` passe un particulier en
     pro sans une erreur. Rien dans la base ne peut l'empêcher ; c'est donc
     ICI qu'on tient la liste. */
  const PERMISES = ['cree_fiche_utilisateur', 'devenir_pro', 'admin_traiter_demande_pro'];

  // Chaque fonction : son nom, son en-tête (entre la signature et `as $…$`)
  // et son corps (jusqu'au délimiteur qui le ferme, `$$` ou `$nom$`).
  const fonctions = [];
  /* TOUTES les formes d'une déclaration — 15/10/2026, relecture adverse :
     une fonction écrite SANS `public.` (le `search_path` la range pourtant
     là) ou sans `or replace` échappait au relevé ET au décompte, donc à la
     règle, sans un ✘. */
  const DECLARATION = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?([a-z_0-9]+)"?\s*\(/gi;
  const debuts = [...sql.matchAll(DECLARATION)];
  debuts.forEach((m, i) => {
    /* Le `as $…$` est cherché AVANT la déclaration suivante, jamais au-delà :
       sinon une fonction au délimiteur inattendu emprunterait le corps de
       sa voisine, et le décompte resterait juste en contrôlant la mauvaise
       chose. */
    const borne = i + 1 < debuts.length ? debuts[i + 1].index : sql.length;
    const tranche = sql.slice(m.index, borne);
    const a = /\bas\s+(\$\w*\$)/i.exec(tranche);
    if (!a) return;
    const finCorps = tranche.indexOf(a[1], a.index + a[0].length);
    if (finCorps < 0) return;
    fonctions.push({
      nom: m[1],
      entete: tranche.slice(0, a.index),
      corps: tranche.slice(a.index + a[0].length, finCorps),
    });
  });
  /* Chaque déclaration du fichier doit avoir été LUE jusqu'à son corps : une
     fonction dont on n'a pas trouvé le corps échapperait à la règle sans
     un mot — le contrôle passerait au vert sans l'avoir regardée. */
  const declarees = (sql.match(DECLARATION) || []).length;
  verifier(`le relevé lit le corps de chaque fonction (${fonctions.length} sur ${declarees})`,
    fonctions.length === declarees && declarees > 0,
    'une fonction dont le corps n’a pas été trouvé n’est pas contrôlée');

  /* Les formes SQL ordinaires d'une écriture de `users.type` — la relecture
     adverse en a fait passer trois au vert : un alias introduit par `as`
     (`update public.users as u set type = …`), une colonne entre
     guillemets (`set "type" = …`), et la table sans `public.`. */
  const TYPE = '"?type"?';
  const ecritType = (corps) =>
    new RegExp(`update\\s+(?:only\\s+)?(?:public\\.)?"?users"?\\b(?:\\s+(?:as\\s+)?\\w+)?\\s+set\\b[^;]*?(?:^|[\\s,(])${TYPE}\\s*=`, 'i').test(corps)
    || new RegExp(`insert\\s+into\\s+(?:public\\.)?"?users"?\\s*\\([^)]*${TYPE}`, 'i').test(corps)
    || new RegExp(`insert\\s+into\\s+(?:public\\.)?"?users"?\\b[^;]*?do\\s+update\\s+set[^;]*?(?:^|[\\s,(])${TYPE}\\s*=`, 'i').test(corps);

  const definers = fonctions.filter((f) => /security definer/i.test(f.entete));
  const fautives = [...new Set(definers.filter((f) => ecritType(f.corps)).map((f) => f.nom))]
    .filter((n) => !PERMISES.includes(n));
  verifier('aucune AUTRE fonction `security definer` n’écrit `users.type`',
    fautives.length === 0,
    `${fautives.join(', ')} — le verrou 44.1 la laisserait promouvoir n’importe `
    + 'qui. Si c’est voulu, elle exige une preuve du répertoire ou une décision '
    + 'humaine, et elle rejoint la liste PERMISES en disant pourquoi');

  /* Et dans l'autre sens : une liste qui nomme des fonctions qui n'écrivent
     plus le type est une liste périmée, et un contrôle qui ne trouve pas sa
     cible passe au vert pour la mauvaise raison. */
  for (const nom of PERMISES) {
    const f = definers.filter((x) => x.nom === nom).pop();
    verifier(`\`${nom}\` existe, est \`security definer\` et écrit bien le type`,
      !!f && ecritType(f.corps),
      'la liste des trois fonctions permises doit décrire le fichier tel qu’il est');
  }

  /* LA LISTE NE SUFFIT PAS : CHAQUE PERMISE DOIT TENIR SA GARDE — 15/10,
     relecture adverse. La justification de la liste dit « elle exige une
     preuve du répertoire ou une décision humaine », et rien ne le
     vérifiait : retirer le `if not found then … OP006` de `devenir_pro`
     faisait passer un particulier en pro SANS SIRET, et les six contrôles
     restaient verts (prouvé sur PostgreSQL 16). La garde se lit donc DANS
     le corps de chaque fonction, AVANT son `update public.users`.
     `cree_fiche_utilisateur` est tenue, elle, par `verifier-compte`. */
  const derniere = (nom) => definers.filter((x) => x.nom === nom).pop();
  const avantLeType = (f) => {
    if (!f) return '';
    const m = /update\s+public\.users\s+set\s+type\s*=/i.exec(f.corps);
    return m ? f.corps.slice(0, m.index) : '';
  };
  {
    const avant = avantLeType(derniere('devenir_pro'));
    verifier('`devenir_pro` : une preuve FRAÎCHE, du répertoire ou d’essai pour SON adresse, sinon OP006 aussitôt — avant d’écrire le type',
      /select pr\.\* into la_preuve\s+from public\.preuves_siret pr\s+where pr\.siret = le_siret\s+and pr\.expire_le > now\(\)\s+and \(pr\.source = 'registre'\s+or \(pr\.source = 'essai'\s+and pr\.pour_email = lower\(coalesce\(mon_email, ''\)\)\)\);\s+if not found then\s+raise exception[^;]*using errcode = 'OP006';/
        .test(avant),
      'sans elle, un particulier passe en pro sans SIRET — la faille même que la section 44 ferme');
    verifier('…et une entreprise prise ou réservée est refusée (OP007), avant d’écrire le type',
      /from public\.entreprise_registre e\s+where e\.siren = la_preuve\.siren and e\.retiree_le is null\)\s+or public\.siren_reserve\(la_preuve\.siren\) then\s+raise exception[^;]*using errcode = 'OP007';/
        .test(avant));
    verifier('…et seul un compte PARTICULIER passe par là',
      /if not found or le_compte\.type is distinct from 'particulier' then\s+raise exception/.test(avant));
  }
  {
    const f = derniere('admin_traiter_demande_pro');
    verifier('`admin_traiter_demande_pro` : `admin_exige_droit()` EN TÊTE, dans sa déclaration',
      !!f && /^\s*declare\s+moi\s+uuid\s*:=\s*public\.admin_exige_droit\(\);/.test(f.corps),
      'sans elle, n’importe quel compte connecté ouvrirait le compte pro de n’importe qui');
    verifier('…et une demande se tranche une fois : seulement si elle est encore « nouvelle »',
      /if d\.statut <> 'nouvelle' then\s+raise exception/.test(avantLeType(f)));
  }
}

console.log('\n6. L’application ne décide jamais du type elle-même');
{
  verifier('aucune insertion dans `users` depuis l’application',
    !/from\('users'\)\s*\.(insert|upsert)\(/.test(api),
    'la ligne `users` naît du déclencheur de la base, à l’inscription. Un '
    + 'écran qui l’insère se heurterait désormais à OP004');

  /* Chaque `update({...})` sur `users`, lu jusqu'à son accolade fermante. */
  const majUsers = [...api.matchAll(/from\('users'\)\s*\.update\(\{([\s\S]*?)\}\)/g)];
  verifier('les mises à jour de `users` sont bien trouvées', majUsers.length > 0,
    'si ce contrôle n’en trouve plus aucune, il ne vérifie plus rien');
  verifier('aucune ne contient `type`',
    majUsers.every(([, champs]) => !/\btype\s*:/.test(champs)),
    'aucune version de l’application n’envoie un type DIFFÉRENT : c’est '
    + 'précisément ce qui permet à la base de refuser au lieu de taire');

  verifier('les essais de la section 44 sont dans le dépôt, seconde porte comprise',
    (() => {
      try {
        const e = lire('supabase/essais-section-44.sql');
        return /B10\./.test(e) && /preparer_suppression_compte/.test(e);
      } catch (e) { return false; }
    })(),
    'vingt et un cas, chacun dans son `begin … rollback`, et jamais dans un '
    + 'bloc `do`');
}

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Personne ne devient professionnel par lui-même, et ce qui est '
  + 'réservé aux professionnels leur reste réservé.\n');
