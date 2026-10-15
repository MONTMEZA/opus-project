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
 *   6. l'application ne crée ni ne modifie jamais le type elle-même.
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

  verifier('elle REFUSE, avec un code et une phrase en français (OP004)',
    /raise exception[\s\S]*?using errcode = 'OP004'/.test(corps)
    && /contactez Opus/.test(corps),
    'un retour silencieux à l’ancienne valeur ferait répondre `UPDATE 1` '
    + 'à un geste qui n’a pas eu lieu');

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

  verifier('elle est `security definer`',
    /security definer/.test(corps),
    'elle lit `users.type`, dont les droits de colonne pourraient un jour '
    + 'retirer la lecture : la règle tomberait en « permission denied »');

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
