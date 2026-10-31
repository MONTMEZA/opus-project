/**
 * CE QUE CHACUN LIT DES AUTRES — les lectures, les droits, l'export
 * (lot S-d, 30/10/2026).
 *
 * POURQUOI CE CONTRÔLE EXISTE
 * ---------------------------
 * Le lot S-d ferme des LECTURES, et une lecture fermée ne fait aucun bruit :
 *
 * 1. **l'application peut relire ce que la base va fermer.** À l'étape M2,
 *    `users` ne se lit plus que par quatre colonnes (`id, type, nom,
 *    avatar_url`), et huit colonnes des fiches pro se ferment. Une requête
 *    qui en nomme une échoue EN ENTIER — et `loadAll()` les lit au
 *    démarrage : l'application ne démarrerait plus. Ce contrôle relit
 *    chaque `select` de l'application et refuse une colonne fermée ;
 * 2. **la fiche publique d'un particulier** décide de sa ville, de ses
 *    demandes et du bouton « Envoyer un message ». `profil-public.js` le
 *    redit pour la démonstration : il est FAIT TOURNER ici ;
 * 3. **les règles de la base** (`profil_public`, `ma_fiche_pro`, les
 *    politiques des « j'aime », des abonnements, des réponses aux demandes,
 *    des conversations et des urgences) sont comparées ENTIÈRES, espaces
 *    réduits : un `and` devenu `or`, un `to anon` ajouté, un `using (true)`
 *    remis passaient sinon au vert (la leçon du lot S-b) ;
 * 4. **l'export** : la liste fermée de ce qui n'y figure pas (l'identité de
 *    qui vous suit, de qui vous a bloqué, de qui a signalé, de
 *    l'administrateur, la note interne), ses bornes à 5 000, et la limite de
 *    PostgreSQL — 100 arguments par fonction, donc 50 clés par
 *    `jsonb_build_object` — que l'export dépasserait en silence au prochain
 *    lot qui y ajoute une clé : il refuserait de se créer.
 *
 * La PREUVE de sécurité reste l'essai (`essais-section-51d.sql`), qui
 * interroge la base rejouée. Mais `npm run verifier` ne joue aucun essai SQL
 * (docs/A-FAIRE.md §2.3) : ce contrôle-ci est la seule garde qui tourne à
 * chaque envoi.
 *
 *   npm run verifier-lectures
 */
import { readFileSync } from 'node:fs';

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};
const lire = (f) => readFileSync(f, 'utf8');
/* Les commentaires partent d'abord : plusieurs fois dans ce projet un
   contrôle a accusé la documentation qui expliquait le défaut qu'il traque. */
const sansCommentaires = (c) => c
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');
// LES COMMENTAIRES SQL, RETIRÉS COMME POSTGRESQL LES LIT (seconde
// relecture du 31/10, R2T-3 et R2T-4) : « -- » jusqu'à la fin de la ligne,
// les commentaires de bloc IMBRIQUÉS — PostgreSQL compte les niveaux —, et
// rien de tout cela dans une chaîne entre apostrophes (avec « '' », et la
// barre oblique inverse dans un E'…'). Le découpeur d'avant s'arrêtait à la
// première fin de bloc et ne retirait que les « -- » en début de ligne : on
// cachait une clause à PostgreSQL sans changer ce que le contrôle lisait,
// et un `grant` précédé d'un commentaire de bloc ne commençait plus par
// « grant ». Les formes AMBIGUËS — une ouverture de bloc dans un bloc, une
// fin de bloc après « -- » — sont relevées : le schéma n'en a pas besoin,
// et chacune fait lire deux textes différents.
function analyseSql(texte) {
  let sortie = '';
  const ambigus = [];
  const n = texte.length;
  let k = 0;
  const ligneDe = (i) => texte.slice(0, i).split('\n').length;
  while (k < n) {
    const c = texte[k];
    if (c === "'") {
      const echappe = k > 0 && /[eE]/.test(texte[k - 1]) && !/\w/.test(texte[k - 2] || ' ');
      let j = k + 1;
      while (j < n) {
        if (echappe && texte[j] === '\\') { j += 2; continue; }
        if (texte[j] === "'" && texte[j + 1] === "'") { j += 2; continue; }
        if (texte[j] === "'") break;
        j += 1;
      }
      sortie += texte.slice(k, j + 1);
      k = j + 1;
      continue;
    }
    if (c === '-' && texte[k + 1] === '-') {
      const fin = texte.indexOf('\n', k);
      const f = fin < 0 ? n : fin;
      if (texte.slice(k, f).includes('*/')) ambigus.push(`ligne ${ligneDe(k)} : « */ » après « -- »`);
      k = f;
      continue;
    }
    if (c === '/' && texte[k + 1] === '*') {
      let niveau = 1;
      let j = k + 2;
      while (j < n && niveau > 0) {
        if (texte[j] === '/' && texte[j + 1] === '*') { niveau += 1; ambigus.push(`ligne ${ligneDe(j)} : « /* » dans un commentaire`); j += 2; continue; }
        if (texte[j] === '*' && texte[j + 1] === '/') { niveau -= 1; j += 2; continue; }
        j += 1;
      }
      sortie += ' ';
      k = j;
      continue;
    }
    sortie += c;
    k += 1;
  }
  return { sortie, ambigus };
}
const sqlSansCommentaires = (c) => analyseSql(c).sortie;
const espaces = (t) => t.replace(/\s+/g, ' ').trim();
/* Une fonction qui PLANTE sur un cas doit rendre ce cas faux, pas arrêter le
   contrôle : un contrôle qui plante ne vérifie plus rien du tout. */
const sur = (f) => { try { return f(); } catch (e) { return `PLANTE : ${e.message}`; } };

const {
  villeVisible, demandesAMontrer, peutEcrireDepuisLaFiche, FICHE_ILLISIBLE, DEMANDES_ILLISIBLES,
  DEMANDES_SUR_UNE_FICHE, AUCUNE_DEMANDE_A_MONTRER,
} = await import('../src/lib/profil-public.js');

const SCHEMA = lire('supabase/schema.sql');
const sql = sqlSansCommentaires(SCHEMA);
const api = sansCommentaires(lire('src/lib/api.js'));
const app = sansCommentaires(lire('src/OpusApp.js'));
const ecranPublic = sansCommentaires(lire('src/screens/ProfilPublicScreen.js'));

/* Les colonnes que M2 laisse lire, et celles qu'elle ferme (décision du
   30/10, cahier §3). Écrites ICI, en toutes lettres : un contrôle qui
   importerait ces listes du code qu'il surveille vérifierait le code
   contre lui-même. */
const USERS_OUVERTES = ['id', 'type', 'nom', 'avatar_url'];
const PRO_FERMEES = [
  'badge_suspendu_le', 'verification_note', 'demandes_vues_le', 'agent_propositions',
  'siret', 'rge_numero', 'code_insee', 'created_at',
];

/* Le corps d'une fonction SQL, du `create or replace` au `$$` qui la
   ferme. Une seule définition, sinon la seconde gagne au rejeu. */
function fonctionSql(nom) {
  const debut = `create or replace function public.${nom}(`;
  const morceaux = sql.split(debut);
  if (morceaux.length !== 2) return { n: morceaux.length - 1, entete: '', corps: '', tout: '' };
  const reste = morceaux[1];
  const ouvre = reste.indexOf('$$');
  const ferme = reste.indexOf('$$', ouvre + 2);
  return {
    n: 1,
    entete: reste.slice(0, ouvre),
    corps: reste.slice(ouvre + 2, ferme),
    tout: debut + reste.slice(0, ferme + 2),
  };
}
/* Une politique : du `create policy "nom" on table` au `;` qui la ferme,
   en comptant les parenthèses (un `;` n'apparaît pas dans une politique,
   mais une chaîne pourrait en porter un). */
const sqlPlat = espaces(sql);
function politique(nom, table) {
  const debut = `create policy "${nom}" on public.${table}`;
  const morceaux = sqlPlat.split(debut);
  if (morceaux.length !== 2) return { n: morceaux.length - 1, texte: '' };
  const reste = morceaux[1];
  let niveau = 0;
  for (let k = 0; k < reste.length; k += 1) {
    if (reste[k] === '(') niveau += 1;
    else if (reste[k] === ')') niveau -= 1;
    else if (reste[k] === ';' && niveau === 0) return { n: 1, texte: espaces(debut + reste.slice(0, k + 1)) };
  }
  return { n: 1, texte: '' };
}
/* Les ARGUMENTS d'un appel, découpés aux virgules de premier niveau, en
   sautant les chaînes `'…'` (avec `''` à l'intérieur). */
function argumentsDuPremierNiveau(texte) {
  const args = [];
  let niveau = 0;
  let courant = '';
  for (let k = 0; k < texte.length; k += 1) {
    const c = texte[k];
    if (c === "'") {
      let fin = k + 1;
      while (fin < texte.length) {
        if (texte[fin] === "'" && texte[fin + 1] === "'") { fin += 2; continue; }
        if (texte[fin] === "'") break;
        fin += 1;
      }
      courant += texte.slice(k, fin + 1);
      k = fin;
      continue;
    }
    if (c === '(') niveau += 1;
    if (c === ')') niveau -= 1;
    if (c === ',' && niveau === 0) { args.push(courant.trim()); courant = ''; continue; }
    courant += c;
  }
  if (courant.trim()) args.push(courant.trim());
  return args;
}
/* Le contenu de chaque `jsonb_build_object( … )` de PREMIER rang d'un
   texte : on cherche l'appel, puis sa parenthèse fermante. */
function appelsDe(texte, appel) {
  const sortie = [];
  let depart = 0;
  for (;;) {
    const i = texte.indexOf(`${appel}(`, depart);
    if (i < 0) break;
    const ouvre = i + appel.length;
    let niveau = 0;
    let fin = -1;
    for (let k = ouvre; k < texte.length; k += 1) {
      const c = texte[k];
      if (c === "'") { k = texte.indexOf("'", k + 1); if (k < 0) break; continue; }
      if (c === '(') niveau += 1;
      else if (c === ')') { niveau -= 1; if (niveau === 0) { fin = k; break; } }
    }
    if (fin < 0) break;
    sortie.push({ debut: i, interieur: texte.slice(ouvre + 1, fin) });
    depart = fin + 1;
  }
  return sortie;
}

/* ================================================================== */
console.log('\nLA FICHE PUBLIQUE — ce que la démonstration redit, FAIT TOURNER');

const particulier = { id: 'p1', type: 'particulier', ville: 'Brest' };
const casVille = [
  ['un pro non bloqué lit la ville d’un particulier', { personne: particulier, regardeur: { id: 'a', estPro: true, masque: false } }, 'Brest'],
  ['…mais pas s’il y a un blocage entre eux', { personne: particulier, regardeur: { id: 'a', estPro: true, masque: true } }, null],
  ['un AUTRE particulier ne la lit pas', { personne: particulier, regardeur: { id: 'q', estPro: false, masque: false } }, null],
  ['la personne lit la sienne', { personne: particulier, regardeur: { id: 'p1', estPro: false, masque: false } }, 'Brest'],
  ['…même avec un identifiant écrit comme un nombre', { personne: { ...particulier, id: 7 }, regardeur: { id: '7', estPro: false } }, 'Brest'],
  ['personne sans compte : rien', { personne: particulier, regardeur: null }, null],
  ['la ville d’un COMPTE pro n’est jamais rendue ici', { personne: { id: 'a', type: 'pro', ville: 'Lille' }, regardeur: { id: 'b', estPro: true } }, null],
  ['un type inconnu : rien', { personne: { id: 'x', ville: 'Brest' }, regardeur: { id: 'b', estPro: true } }, null],
  ['pas de ville : rien', { personne: { id: 'p1', type: 'particulier' }, regardeur: { id: 'a', estPro: true } }, null],
];
for (const [nom, entree, attendu] of casVille) {
  const rendu = sur(() => villeVisible(entree));
  verifier(`villeVisible : ${nom}`, rendu === attendu, `rendu ${JSON.stringify(rendu)}, attendu ${JSON.stringify(attendu)}`);
}
verifier('villeVisible : appelée sans rien, rend null sans planter', sur(() => villeVisible()) === null);

const vingtCinq = Array.from({ length: 25 }, (_, i) => ({ id: i, statut: 'ouverte' }));
const melange = [
  { id: 'o1', statut: 'ouverte' }, { id: 'p', statut: 'pourvue' }, { id: 'f', statut: 'fermee' },
  { id: 'o2', statut: null }, null, { id: 'o3' },
];
verifier('demandesAMontrer : rien à un particulier',
  sur(() => demandesAMontrer(vingtCinq, { jeSuisPro: false })).length === 0);
verifier('demandesAMontrer : rien sans option (un particulier par défaut)',
  sur(() => demandesAMontrer(vingtCinq)).length === 0);
verifier(`demandesAMontrer : ${DEMANDES_SUR_UNE_FICHE} au plus, et ce nombre vaut 20`,
  DEMANDES_SUR_UNE_FICHE === 20 && sur(() => demandesAMontrer(vingtCinq, { jeSuisPro: true })).length === 20);
verifier('demandesAMontrer : les OUVERTES seulement, dans l’ordre reçu (une pourvue passait pour en cours)',
  JSON.stringify(sur(() => demandesAMontrer(melange, { jeSuisPro: true }).map((d) => d.id))) === JSON.stringify(['o1', 'o2', 'o3']));
verifier('demandesAMontrer : une liste absente ne plante pas',
  sur(() => demandesAMontrer(null, { jeSuisPro: true })).length === 0);

const ecrit = (o) => sur(() => peutEcrireDepuisLaFiche(o));
verifier('« Envoyer un message » : un pro sur la fiche d’un particulier', ecrit({ profil: particulier, monId: 'a', jeSuisPro: true }) === true);
verifier('…jamais un particulier (décision du 30/10 : la base refuse aussi)', ecrit({ profil: particulier, monId: 'q', jeSuisPro: false }) === false);
verifier('…jamais sur sa propre fiche', ecrit({ profil: particulier, monId: 'p1', jeSuisPro: true }) === false);
verifier('…jamais sur la fiche d’un compte pro (il a sa page, et son bouton)',
  ecrit({ profil: { id: 'b', type: 'pro' }, monId: 'a', jeSuisPro: true }) === false);
verifier('…ni sans fiche', ecrit({ profil: null, monId: 'a', jeSuisPro: true }) === false && ecrit() === false);
verifier('…ni sur la fiche d’une personne que J’AI bloquée (la base refuserait — seconde relecture du 31/10)',
  ecrit({ profil: { ...particulier, bloque: true }, monId: 'a', jeSuisPro: true }) === false
  && ecrit({ profil: { ...particulier, bloque: false }, monId: 'a', jeSuisPro: true }) === true);
verifier('…ni tant que le TYPE n’est pas connu (pendant la lecture, ou après un échec : seul le nom d’un commentaire)',
  ecrit({ profil: { id: 'p9', nom: 'Paule', type: null }, monId: 'a', jeSuisPro: true }) === false
  && ecrit({ profil: { id: 'p9', nom: 'Paule' }, monId: 'a', jeSuisPro: true }) === false);
verifier('un échec se DIT, et ne ressemble ni à un profil supprimé ni à « aucune demande »',
  typeof FICHE_ILLISIBLE === 'string' && typeof DEMANDES_ILLISIBLES === 'string'
  && /ce n[’']est pas que ce profil n[’']existe plus/i.test(FICHE_ILLISIBLE)
  && /ce n[’']est pas qu[’']il n[’']y en a aucune/i.test(DEMANDES_ILLISIBLES)
  && /réessayez/i.test(FICHE_ILLISIBLE) && /réessayez/i.test(DEMANDES_ILLISIBLES));
verifier('la fiche sans demande ne dit jamais « n’a publié aucune demande » (une pourvue, ou masquée, existe)',
  typeof AUCUNE_DEMANDE_A_MONTRER === 'string' && AUCUNE_DEMANDE_A_MONTRER.length > 0
  && !/n[’']a (?:publié|écrit|déposé)|aucune demande publiée/i.test(AUCUNE_DEMANDE_A_MONTRER));

/* ================================================================== */
console.log('\nL’APPLICATION NE LIT PLUS CE QUE LA BASE FERME');

/* Chaque `.from('<table>')…select('…')` de l'application, jusqu'au `;`
   qui finit l'ordre. Un `select` sans argument, ou `*`, rend TOUTES les
   colonnes — fermées comprises : il est refusé sur ces deux tables. */
/* La CHAÎNE d'appels qui suit `.from('<table>')` : `.methode(…)` répétés,
   parenthèses équilibrées, et rien d'autre. Un `;` ne suffit pas à la
   borner : dans un `Promise.all([...])`, la chaîne suivante (une autre
   table) commence avant le premier `;`. */
function chaineApres(texte, i) {
  let k = i;
  for (;;) {
    let j = k;
    while (j < texte.length && /\s/.test(texte[j])) j += 1;
    if (texte[j] !== '.') return texte.slice(i, k);
    const ouvre = texte.indexOf('(', j);
    if (ouvre < 0 || !/^\.\s*\w+\s*$/.test(texte.slice(j, ouvre))) return texte.slice(i, k);
    const { fin } = interieurAppel(texte, ouvre);
    if (fin >= texte.length) return texte.slice(i, k);
    k = fin + 1;
  }
}
/* LIRE UNE LECTURE SOUS TOUTES SES FORMES (relecture du 30/10, RT11 et
   RT13). Le contrôle précédent ne reconnaissait que `.from('table')` entre
   apostrophes et `.select('…')` ou une constante en majuscules : un
   gabarit, des guillemets doubles, une variable, une jointure `users!fk(…)`
   ou une colonne ajoutée après un `.join` passaient au vert — et, après M2,
   une telle lecture fait tomber l'application au démarrage. Il ÉVALUE
   désormais l'argument (chaînes, gabarits, concaténations, constantes du
   fichier ou importées, `[…].join(', ')`), puis lit la liste PostgREST
   comme un arbre, et décide de la table d'une jointure par la CLÉ
   ÉTRANGÈRE de la table lue — `client:client_id(…)` d'un devis mène au
   carnet `clients`, pas à `users`. Ce qu'il ne sait pas lire, il le
   REFUSE : un contrôle qui ne comprend pas une forme ne doit pas la
   déclarer bonne. */

/* Un parcours de JavaScript qui saute les chaînes (', ", et les gabarits
   avec leurs `${…}` imbriqués) et compte les parenthèses, crochets et
   accolades. `rendre(c, k, niveau)` est appelé sur chaque caractère hors
   chaîne ; il rend `true` pour s'arrêter. */
function parcourir(texte, debut, rendre) {
  let niveau = 0;
  for (let k = debut; k < texte.length; k += 1) {
    const c = texte[k];
    if (c === "'" || c === '"') {
      let q = k + 1;
      while (q < texte.length && texte[q] !== c) q += texte[q] === '\\' ? 2 : 1;
      k = q;
      continue;
    }
    if (c === '`') { k = finGabarit(texte, k); continue; }
    if (rendre(c, k, niveau)) return k;
    if ('([{'.includes(c)) niveau += 1;
    else if (')]}'.includes(c)) niveau -= 1;
  }
  return texte.length;
}
function finGabarit(texte, k) {
  let q = k + 1;
  while (q < texte.length && texte[q] !== '`') {
    if (texte[q] === '\\') { q += 2; continue; }
    if (texte[q] === '$' && texte[q + 1] === '{') {
      q = parcourir(texte, q + 2, (c, _k, niveau) => c === '}' && niveau === 0) + 1;
      continue;
    }
    q += 1;
  }
  return q;
}
/* L'intérieur d'un appel dont la parenthèse ouvrante est à `ouvre`. */
function interieurAppel(texte, ouvre) {
  const ferme = parcourir(texte, ouvre + 1, (c, _k, niveau) => c === ')' && niveau === 0);
  return { interieur: texte.slice(ouvre + 1, ferme), fin: ferme };
}
/* Découpe aux séparateurs de premier niveau (`,` pour des arguments, `+`
   pour une concaténation). */
function decouper(texte, sep) {
  const morceaux = [];
  let debut = 0;
  parcourir(texte, 0, (c, k, niveau) => {
    if (c === sep && niveau === 0) { morceaux.push(texte.slice(debut, k)); debut = k + 1; }
    return false;
  });
  morceaux.push(texte.slice(debut));
  return morceaux.map((m) => m.trim()).filter((m) => m !== '');
}

const SOURCES = new Map();
const sourceDe = (f) => {
  if (!SOURCES.has(f)) SOURCES.set(f, sansCommentaires(lire(f)));
  return SOURCES.get(f);
};
const echapper = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* La valeur d'une constante : dans le fichier (`const X = …;`), ou dans
   le module d'où elle est importée. */
function constante(nom, fichier, profondeur) {
  const texte = sourceDe(fichier);
  /* UN NOM DÉFINI DEUX FOIS (dans deux fonctions) : lequel vaut ici ? Le
     contrôle lisait le PREMIER du fichier ; il refuse désormais de choisir
     (seconde relecture du 31/10, R2T-6). Même refus pour un nom déclaré par
     `let`/`var` (il peut changer) ou une liste MODIFIÉE après coup. */
  const declarations = [...texte.matchAll(new RegExp(`(?:^|[^\\w$.])(?:export\\s+)?(?:const|let|var)\\s+${echapper(nom)}\\s*=`, 'g'))];
  if (declarations.length > 1) return { ok: false, raison: `« ${nom} » est défini ${declarations.length} fois dans ${fichier}` };
  if (declarations.length === 1 && !/\bconst\s/.test(declarations[0][0])) return { ok: false, raison: `« ${nom} » n’est pas une constante (let/var)` };
  if (new RegExp(`(?:^|[^\\w$.])${echapper(nom)}\\s*(?:\\.\\s*(?:push|unshift|splice|fill|copyWithin|reverse|sort)\\s*\\(|\\[[^\\]]*\\]\\s*=(?!=)|\\.length\\s*=(?!=))`).test(texte)) {
    return { ok: false, raison: `« ${nom} » est modifié après sa définition` };
  }
  const def = new RegExp(`(?:^|[^\\w$.])(?:export\\s+)?const\\s+${echapper(nom)}\\s*=`).exec(texte);
  if (def) {
    const debut = def.index + def[0].length;
    const fin = parcourir(texte, debut, (c, _k, niveau) => c === ';' && niveau === 0);
    return evaluer(texte.slice(debut, fin), fichier, profondeur + 1);
  }
  for (const m of texte.matchAll(/import\s*\{([^}]*)\}\s*from\s*'(\.[^']+)'/g)) {
    for (const nomImporte of m[1].split(',').map((x) => x.trim())) {
      const [origine, local] = nomImporte.split(/\s+as\s+/).map((x) => x.trim());
      if ((local || origine) !== nom) continue;
      const base = `${fichier.replace(/\/[^/]*$/, '')}/${m[2]}`.replace(/\/\.\//g, '/');
      const chemin = [`${base}.js`, `${base}/index.js`].find((c) => { try { lire(c); return true; } catch { return false; } });
      if (!chemin) return { ok: false, raison: `module introuvable pour ${nom}` };
      return constante(origine, chemin, profondeur + 1);
    }
  }
  return { ok: false, raison: `constante introuvable : ${nom}` };
}
function evaluer(expr, fichier, profondeur = 0) {
  if (profondeur > 12) return { ok: false, raison: 'trop d’indirections' };
  const e = expr.trim();
  const termes = decouper(e, '+');
  if (termes.length > 1) {
    let valeur = '';
    for (const t of termes) {
      const r = evaluer(t, fichier, profondeur + 1);
      if (!r.ok || typeof r.valeur !== 'string') return { ok: false, raison: r.raison || `« ${t} » n’est pas une chaîne` };
      valeur += r.valeur;
    }
    return { ok: true, valeur };
  }
  if (/^'(?:[^'\\]|\\.)*'$/.test(e) || /^"(?:[^"\\]|\\.)*"$/.test(e)) {
    return { ok: true, valeur: e.slice(1, -1).replace(/\\(.)/g, '$1') };
  }
  if (e.startsWith('`') && finGabarit(e, 0) === e.length - 1) {
    let valeur = '';
    let k = 1;
    while (k < e.length - 1) {
      if (e[k] === '\\') { valeur += e[k + 1]; k += 2; continue; }
      if (e[k] === '$' && e[k + 1] === '{') {
        const fin = parcourir(e, k + 2, (c, _k, niveau) => c === '}' && niveau === 0);
        const r = evaluer(e.slice(k + 2, fin), fichier, profondeur + 1);
        if (!r.ok || typeof r.valeur !== 'string') return { ok: false, raison: r.raison || 'gabarit illisible' };
        valeur += r.valeur;
        k = fin + 1;
        continue;
      }
      valeur += e[k];
      k += 1;
    }
    return { ok: true, valeur };
  }
  if (e.startsWith('[') && parcourir(e, 0, (c, _k, niveau) => c === ']' && niveau === 1) === e.length - 1) {
    const valeurs = [];
    for (const el of decouper(e.slice(1, -1), ',')) {
      const r = evaluer(el, fichier, profondeur + 1);
      if (!r.ok || typeof r.valeur !== 'string') return { ok: false, raison: r.raison || 'élément de liste illisible' };
      valeurs.push(r.valeur);
    }
    return { ok: true, valeur: valeurs };
  }
  const gele = /^Object\.freeze\(([\s\S]*)\)$/.exec(e);
  if (gele) return evaluer(gele[1], fichier, profondeur + 1);
  /* `X.join(', ')` — et `X.filter(…).join(', ')`, qui ne peut que RETIRER
     des colonnes : on garde la liste entière, ce qui est prudent. */
  const joint = /^([\s\S]+?)\.join\(\s*(['"])([^'"]*)\2\s*\)$/.exec(e);
  if (joint) {
    const base = joint[1].replace(/\.filter\([\s\S]*\)$/, '');
    const r = evaluer(base, fichier, profondeur + 1);
    if (!r.ok || !Array.isArray(r.valeur)) return { ok: false, raison: r.raison || '`.join` sur autre chose qu’une liste' };
    return { ok: true, valeur: r.valeur.join(joint[3]) };
  }
  if (/^[A-Za-z_$][\w$]*$/.test(e)) return constante(e, fichier, profondeur + 1);
  /* `a ? 'x' : 'y'` : les DEUX valeurs possibles (une liste), jamais l'une
     des deux au hasard. */
  const ternaire = decouper(e, '?');
  if (ternaire.length === 2) {
    const branches = decouper(ternaire[1], ':');
    if (branches.length === 2) {
      const valeurs = [];
      for (const b of branches) {
        const rb = evaluer(b, fichier, profondeur + 1);
        if (!rb.ok || typeof rb.valeur !== 'string') return { ok: false, raison: rb.raison || 'branche illisible' };
        valeurs.push(rb.valeur);
      }
      return { ok: true, valeur: valeurs, ternaire: true };
    }
  }
  return { ok: false, raison: `forme illisible : « ${e.slice(0, 60)} »` };
}

/* LES CLÉS ÉTRANGÈRES DU SCHÉMA : `table.colonne → table visée`. C'est
   d'elles que dépend la table d'une jointure `alias:colonne(…)`. */
const CLES = new Map();
const TABLES = new Set();
for (const m of sql.matchAll(/create table if not exists public\.(\w+) \(([\s\S]*?)\n\);/g)) {
  TABLES.add(m[1]);
  for (const l of m[2].matchAll(/^\s*(\w+)\s+[^,\n]*?references public\.(\w+)/gm)) CLES.set(`${m[1]}.${l[1]}`, l[2]);
}
for (const m of sql.matchAll(/alter table (?:if exists )?public\.(\w+)\s+add column if not exists (\w+)\s+[^;]*?references public\.(\w+)/g)) CLES.set(`${m[1]}.${m[2]}`, m[3]);
for (const m of sql.matchAll(/alter table (?:if exists )?public\.(\w+)\s+add constraint \w+\s+foreign key \((\w+)[^)]*\)\s+references public\.(\w+)/g)) CLES.set(`${m[1]}.${m[2]}`, m[3]);
verifier('les clés étrangères du schéma sont lues (une jointure se décide par elles)',
  CLES.get('devis.client_id') === 'clients' && CLES.get('conversations.client_id') === 'users'
  && CLES.get('notifications.acteur_id') === 'users' && CLES.get('devis.quote_request_id') === 'quote_requests',
  `devis.client_id → ${CLES.get('devis.client_id')}, conversations.client_id → ${CLES.get('conversations.client_id')}`);

/* Une liste PostgREST, en arbre : `col`, `alias:col`, `col::type`, `*`,
   et les jointures `[alias:]cible[!indice](…)`. Chaque nœud dit sa table. */
function lireListe(liste, table, chemin, sortie) {
  for (const item of decouper(liste, ',')) {
    const jointure = /^(?:(\w+)\s*:\s*)?(\w+)\s*(?:!\s*(\w+))?\s*\(([\s\S]*)\)$/.exec(item);
    if (jointure) {
      const [, , cible, indice, interieur] = jointure;
      const visee = CLES.get(`${table}.${cible}`) || (TABLES.has(cible) ? cible : null)
        || (indice && CLES.get(`${table}.${indice}`)) || null;
      if (!visee) { sortie.push({ table: null, colonne: item, chemin, raison: `jointure « ${cible} » sans table connue depuis ${table}` }); continue; }
      sortie.push({ table: visee, jointure: true, chemin: `${chemin} → ${visee}` });
      lireListe(interieur, visee, `${chemin} → ${visee}`, sortie);
      continue;
    }
    const colonne = item.replace(/^\w+\s*:\s*/, '').replace(/::\w+$/, '').replace(/\s*->>?.*$/, '').trim();
    if (!/^(?:\w+|\*)$/.test(colonne)) { sortie.push({ table: null, colonne: item, chemin, raison: `élément illisible « ${item} »` }); continue; }
    sortie.push({ table, colonne, chemin });
  }
  return sortie;
}

/* CHAQUE `.from(` de l'application. Un `.storage.from(…)` est un espace de
   fichiers, pas une table ; `Array.from` n'est pas une lecture. */
const { execSync } = await import('node:child_process');
const FICHIERS = execSync('git ls-files src', { encoding: 'utf8' }).split('\n')
  .filter((f) => /\.(?:js|jsx|ts|tsx)$/.test(f));
const PAS_UNE_TABLE = /(?:\bArray|\bBuffer|\bUint8Array|\bstorage\s*)$/;
const appels = [];
for (const f of FICHIERS) {
  const texte = sourceDe(f);
  for (const m of texte.matchAll(/\.\s*(from|rpc|schema)\s*\(/g)) {
    const avant = texte.slice(Math.max(0, m.index - 40), m.index);
    if (m[1] === 'from' && PAS_UNE_TABLE.test(avant)) continue;
    appels.push({ fichier: f, methode: m[1], index: m.index, ouvre: m.index + m[0].length - 1 });
  }
}
const horsApi = appels.filter((a) => a.fichier !== 'src/lib/api.js');
verifier('`api.js` est le SEUL fichier de `src/` qui parle à la base — quel que soit le nom du client',
  horsApi.length === 0, horsApi.map((a) => `${a.fichier} (.${a.methode})`).join(', '));
verifier('…et personne n’importe le client sous un autre nom',
  FICHIERS.every((f) => !/import\s*\{[^}]*\bsupabase\s+as\b/.test(sourceDe(f))));

/* Une table qu'on ne sait pas nommer ne peut pas être contrôlée. Les deux
   seules d'aujourd'hui sont écrites ici, avec les tables qu'elles visent —
   et ces tables sont RELUES là où le code les décide : toute autre forme
   est refusée. */
const { GENRES_DEMANDE } = await import('../src/lib/transitions-demandes.js');
const TABLES_VARIABLES = new Map([
  ['table', ['devis', 'devis_lignes']],
  ['regles.table', Object.values(GENRES_DEMANDE).map((g) => g.table)],
]);
verifier('les deux tables VARIABLES sont celles que le code décide, et aucune n’est `users` ni une fiche pro',
  /const table = quoi === 'devis' \? 'devis' : 'devis_lignes';/.test(api)
  && (api.match(/supabase\s*\.\s*from\s*\(\s*table\s*\)/g) || []).length === 3
  && (api.match(/\b(?:const|let|var)\s+table\b/g) || []).length === 1
  && (api.match(/\btable\s*=(?![=>])/g) || []).length === 1
  && /const regles = GENRES_DEMANDE\[genre\];/.test(api)
  && !/\b(?:let|var)\s+regles\b/.test(api)
  && (api.match(/\bregles\s*=(?![=>])/g) || []).length
    === (api.match(/\bconst regles = GENRES_DEMANDE\[\w+\](?: \|\| GENRES_DEMANDE\.\w+)?;/g) || []).length
  && JSON.stringify(TABLES_VARIABLES.get('regles.table')) === JSON.stringify(['quote_requests', 'callback_requests', 'sos_requests']),
  JSON.stringify(TABLES_VARIABLES.get('regles.table')));
/* Les appels de PREMIER niveau d'une chaîne (`.select(…).eq(…)…`) : un
   `.filter(…)` À L'INTÉRIEUR d'un argument n'est pas un filtre PostgREST. */
const FILTRES = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains',
  'containedBy', 'overlaps', 'rangeGt', 'rangeGte', 'rangeLt', 'rangeLte', 'rangeAdjacent', 'textSearch',
  'order', 'not', 'filter', 'match', 'or', 'likeAllOf', 'likeAnyOf', 'ilikeAllOf', 'ilikeAnyOf']);
function appelsDeLaChaine(chaine) {
  const sortie = [];
  let k = 0;
  for (;;) {
    while (k < chaine.length && /\s/.test(chaine[k])) k += 1;
    if (chaine[k] !== '.') return sortie;
    const ouvre = chaine.indexOf('(', k);
    if (ouvre < 0) return sortie;
    const nom = /^\.\s*(\w+)\s*$/.exec(chaine.slice(k, ouvre));
    if (!nom) return sortie;
    const { interieur, fin } = interieurAppel(chaine, ouvre);
    sortie.push({ methode: nom[1], interieur });
    k = fin + 1;
  }
}
const lectures = [];
const nonLues = [];
const sansOperation = [];
const filtresIllisibles = [];
for (const a of appels.filter((x) => x.fichier === 'src/lib/api.js' && x.methode === 'from')) {
  const texte = sourceDe(a.fichier);
  const { interieur, fin } = interieurAppel(texte, a.ouvre);
  const arg = decouper(interieur, ',')[0] || '';
  const r = evaluer(arg, a.fichier);
  let tables;
  if (r.ok && typeof r.valeur === 'string') tables = [r.valeur];
  else if (TABLES_VARIABLES.has(arg.trim())) tables = TABLES_VARIABLES.get(arg.trim());
  else { nonLues.push(`.from(${arg.trim().slice(0, 40)})`); continue; }
  const chaine = chaineApres(texte, fin + 1);
  if (!/^\s*\.\s*(?:select|insert|update|upsert|delete)\s*\(/.test(chaine)
    && !/\.\s*(?:select|insert|update|upsert|delete)\s*\(/.test(chaine.slice(0, 400))) {
    sansOperation.push(`.from(${arg.trim().slice(0, 40)}) ${espaces(chaine).slice(0, 60)}`);
  }
  /* LES FILTRES ET LES TRIS lisent aussi une colonne : après M2, nommer
     une colonne fermée dans un `eq` ou un `order` fait échouer la requête
     entière (seconde relecture du 31/10, R2T-6). */
  for (const fm of appelsDeLaChaine(chaine).filter((x) => FILTRES.has(x.methode))) {
    const argsF = decouper(fm.interieur, ',');
    const premierF = argsF[0] || '';
    let colonnesF = [];
    if (fm.methode === 'or') {
      /* Une colonne JOINTE se filtre aussi dans un `.or()` (« users.email.eq.… ») :
         elle est lue avec son préfixe, et vérifiée sur SA table (banc du 31/10, Y15c). */
      const brut = premierF.replace(/\$\{[^}]*\}/g, 'X').replace(/[`'"+\s]/g, '');
      colonnesF = [...brut.matchAll(/(?:^|[,(])(\w+(?:\.(?!not\.)\w+)?)\.(?:not\.)?(?:eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|ov|sl|sr|nxr|nxl|adj|fts|plfts|phfts|wfts|match|imatch)\./g)].map((x) => x[1]);
      if (colonnesF.length === 0) { filtresIllisibles.push(`.or(${premierF.slice(0, 50)})`); continue; }
    } else if (fm.methode === 'match') {
      const cles = [...premierF.matchAll(/(\w+)\s*:/g)].map((x) => x[1]);
      if (!/^\{[\s\S]*\}$/.test(premierF.trim()) || cles.length === 0) { filtresIllisibles.push(`.match(${premierF.slice(0, 50)})`); continue; }
      colonnesF = cles;
    } else {
      const rf = evaluer(premierF, a.fichier);
      if (!rf.ok) { filtresIllisibles.push(`.${fm.methode}(${premierF.slice(0, 40)}) — ${rf.raison}`); continue; }
      colonnesF = Array.isArray(rf.valeur) ? rf.valeur : [rf.valeur];
    }
    for (const t of tables) {
      for (const brute of colonnesF) {
        const col = String(brute).replace(/\s*->>?.*$/, '').trim();
        const points = col.split('.');
        const visee = points.length === 2 ? (CLES.get(`${t}.${points[0]}`) || (TABLES.has(points[0]) ? points[0] : null)) : t;
        const nomCol = points[points.length - 1];
        if (!visee || !/^\w+$/.test(nomCol)) { filtresIllisibles.push(`.${fm.methode}(${col})`); continue; }
        lectures.push({ table: visee, colonne: nomCol, chemin: `${t} (filtre .${fm.methode})`, filtre: true, ordre: espaces(chaine).slice(0, 100) });
      }
    }
  }
  for (const s of chaine.matchAll(/\.\s*select\s*\(/g)) {
    const ouvre = s.index + s[0].length - 1;
    const premier = decouper(interieurAppel(chaine, ouvre).interieur, ',')[0];
    const valeur = premier == null ? { ok: true, valeur: '*' } : evaluer(premier, a.fichier);
    for (const t of tables) {
      if (!valeur.ok || typeof valeur.valeur !== 'string') {
        lectures.push({ table: t, colonne: null, chemin: t, raison: valeur.raison || 'liste illisible', ordre: espaces(chaine).slice(0, 100) });
        continue;
      }
      for (const n of lireListe(valeur.valeur, t, t, [])) lectures.push({ ...n, ordre: espaces(chaine).slice(0, 100) });
    }
  }
}
verifier('chaque `.from(…)` nomme une table que le contrôle sait lire (une constante, ou une des deux variables connues)',
  nonLues.length === 0, nonLues.join(', '));
verifier('chaque `.from(…)` est suivi tout de suite de son opération (`select`, `insert`, `update`, `upsert`, `delete`) — rangé dans une variable, il échappait au contrôle',
  sansOperation.length === 0, sansOperation.join(' | '));
verifier('chaque filtre et chaque tri (`eq`, `in`, `or`, `order`…) nomme une colonne que le contrôle sait lire',
  filtresIllisibles.length === 0, filtresIllisibles.join(' | '));
/* LES AUTRES FORMES D'ACCÈS à `from` : `.from.call(…)`, `['from'](…)`. */
const accesDetournes = FICHIERS.filter((f) => /\.\s*from\s*\.\s*(?:call|apply|bind)\b|\[\s*['"`]from['"`]\s*\]/.test(sourceDe(f)));
verifier('personne n’appelle `from` par un détour (`.from.call`, `[\'from\']`)', accesDetournes.length === 0, accesDetournes.join(', '));
const illisibles = lectures.filter((l) => l.raison);
verifier('chaque liste de colonnes lue par l’application est LISIBLE par le contrôle (sinon elle est refusée)',
  illisibles.length === 0, illisibles.map((l) => `${l.raison} — dans ${l.ordre}`).join(' | '));

const colonnes = (liste) => liste.split(',').map((c) => c.trim()).filter(Boolean);
const surUsers = lectures.filter((l) => !l.raison && !l.jointure && l.table === 'users');
const surPro = lectures.filter((l) => !l.raison && !l.jointure && l.table === 'professional_profiles');
const lecturesUsers = lectures.filter((l) => l.table === 'users' && !l.jointure && l.chemin === 'users');
const jointuresUsers = lectures.filter((l) => l.jointure && l.table === 'users');
verifier('l’application lit `users` (sinon ce contrôle ne regarde rien)', lecturesUsers.length >= 2,
  `${lecturesUsers.length} colonne(s) lue(s) directement`);
verifier('les jointures vers `users` sont trouvées (au moins quatre aujourd’hui)', jointuresUsers.length >= 4,
  `${jointuresUsers.length} trouvée(s)`);
const fermeesUsers = surUsers.filter((l) => !USERS_OUVERTES.includes(l.colonne));
verifier(`\`users\`, directement ou par jointure : rien que ${USERS_OUVERTES.join(', ')}`,
  fermeesUsers.length === 0, fermeesUsers.map((l) => `${l.colonne} (${l.chemin}) — dans ${l.ordre}`).join(' | '));
const lecturesPro = surPro.filter((l) => l.table === 'professional_profiles');
verifier('l’application lit les fiches pro (sinon ce contrôle ne regarde rien)', lecturesPro.length >= 20,
  `${lecturesPro.length} colonne(s)`);
const fermeesPro = surPro.filter((l) => l.colonne === '*' || PRO_FERMEES.includes(l.colonne));
verifier(`fiches pro, directement ou par jointure : ni tout, ni ${PRO_FERMEES.join(', ')}`,
  fermeesPro.length === 0, fermeesPro.map((l) => `${l.colonne} (${l.chemin}) — dans ${l.ordre}`).join(' | '));

/* La liste des colonnes des fiches pro : ÉVALUÉE, pas lue entre crochets —
   une colonne ajoutée après le `.join` y est comptée. */
const listePro = evaluer('COLONNES_PRO_LISTE', 'src/lib/api.js');
const colsListe = listePro.ok && typeof listePro.valeur === 'string' ? colonnes(listePro.valeur) : [];
verifier('la liste des fiches pro est trouvée, et porte encore la vitrine (`entreprise`, `agent_nom`)',
  colsListe.includes('entreprise') && colsListe.includes('agent_nom') && colsListe.length > 20,
  listePro.ok ? `${colsListe.length} colonne(s)` : listePro.raison);
verifier(`…et aucune des huit colonnes fermées (${PRO_FERMEES.join(', ')})`,
  colsListe.length > 0 && PRO_FERMEES.every((c) => !colsListe.includes(c)),
  colsListe.filter((c) => PRO_FERMEES.includes(c)).join(', '));

/* MA fiche, entière : par `ma_fiche_pro()`, fusionnée à elle SEULE, et
   l'échec n'est pas toléré pour un pro (sinon un n° RGE vide repartirait
   en base au prochain envoi). */
const prives = (lire('src/lib/api.js').match(/function champsPrivesDeMaFiche\(row\) \{[\s\S]*?\n\}/) || [''])[0];
verifier('`champsPrivesDeMaFiche` rend les colonnes privées de SA fiche (motif, RGE, compteur, suspension)',
  /verificationNote: row\.verification_note/.test(prives) && /rgeNumero: row\.rge_numero/.test(prives)
  && /agentPropositions: row\.agent_propositions/.test(prives) && /badgeSuspenduLe: row\.badge_suspendu_le/.test(prives));
verifier('`loadAll` lit MA fiche par `ma_fiche_pro()` et la fusionne à `pros[uid]` seulement, échec refusé',
  /supabase\.rpc\('ma_fiche_pro'\)\.maybeSingle\(\)/.test(api)
  && /if \(pros\[uid\]\) \{\s*if \(ficheRes\.error\) throw ficheRes\.error;\s*if \(ficheRes\.data\) pros\[uid\] = \{ \.\.\.pros\[uid\], \.\.\.champsPrivesDeMaFiche\(ficheRes\.data\) \};\s*\}/.test(api));
verifier('…et `champsPrivesDeMaFiche` n’est appelée nulle part ailleurs (jamais sur la fiche d’un autre)',
  (api.match(/champsPrivesDeMaFiche\(/g) || []).length === 2);
verifier('la date de ma dernière visite des Demandes vient de `ma_fiche_pro()`, pas d’un `select`',
  /demandesVuesLe: ficheRes && ficheRes\.data \? ficheRes\.data\.demandes_vues_le : null/.test(api));
verifier('le compteur de la fenêtre de l’agent se relit par `ma_fiche_pro()` avant de monter',
  /const \{ data: fiche \} = await supabase\.rpc\('ma_fiche_pro'\)\.maybeSingle\(\);\s*const suivant = \(\(fiche && fiche\.agent_propositions\) \|\| 0\) \+ 1;/.test(api));
verifier('la file de l’administration lit la suspension par `admin_etat_des_fiches()`',
  /supabase\.rpc\('admin_etat_des_fiches', \{ p_ids: ids \}\)/.test(api));

/* La fiche publique d'un particulier : par `profil_public()`, plus de
   `select` sur `users` dans cette fonction. */
const chargerSupabase = (api.match(/export const chargerProfilPublic = !hasSupabase \? chargerProfilPublicDemo : async[\s\S]*?\n\};/) || [''])[0];
verifier('`chargerProfilPublic` passe par `profil_public()`, sans `select` sur `users`',
  /supabase\.rpc\('profil_public', \{ p_id: userId \}\)\.maybeSingle\(\)/.test(chargerSupabase)
  && !/from\('users'\)/.test(chargerSupabase));
verifier('…ne lit les demandes qu’à un pro, OUVERTES, et au plus `DEMANDES_SUR_UNE_FICHE`',
  /jeSuisPro\s*\?\s*supabase\.from\('demandes'\)/.test(chargerSupabase)
  && /\.eq\('statut', 'ouverte'\)/.test(chargerSupabase)
  && /\.limit\(DEMANDES_SUR_UNE_FICHE\)/.test(chargerSupabase)
  && /const particulier = uRes\.data\.type === 'particulier';/.test(chargerSupabase)
  && /demandes: !particulier \|\| dRes\.error \? \[\] : demandesAMontrer\(dRes\.data \|\| \[\], \{ jeSuisPro \}\)/.test(chargerSupabase));
verifier('…et une lecture des demandes RATÉE se dit (`demandesEchec`), elle n’est pas « aucune demande »',
  /demandesEchec: particulier && !!dRes\.error,/.test(chargerSupabase)
  && /demandesEchec: false,/.test((api.match(/async function chargerProfilPublicDemo[\s\S]*?\n\}/) || [''])[0]));
verifier('…dit si J’AI bloqué cette personne (mes blocages, jamais les siens), des deux côtés',
  /supabase\.from\('blocages'\)\.select\('bloque_id'\)\s*\.eq\('bloqueur_id', currentUserId\)\.eq\('bloque_id', userId\)/.test(chargerSupabase)
  && /bloque: !bRes\.error && Array\.isArray\(bRes\.data\) && bRes\.data\.length > 0,/.test(chargerSupabase)
  && !/eq\('bloque_id', currentUserId\)/.test(chargerSupabase)
  && /bloque: demoBlocages\.has\(String\(userId\)\),/.test((api.match(/async function chargerProfilPublicDemo[\s\S]*?\n\}/) || [''])[0]));
verifier('…et la démonstration refuse d’écrire à une personne bloquée, comme la base (42501)',
  /async function createConversationWithClientDemo\(clientId\) \{\s*if \(demoBlocages\.has\(String\(clientId\)\)\) \{[\s\S]*?e\.code = '42501';\s*throw e;/.test(api)
  && /export const createConversationWithClient = !hasSupabase \? createConversationWithClientDemo :/.test(api));
const chargerDemo = (api.match(/async function chargerProfilPublicDemo[\s\S]*?\n\}/) || [''])[0];
verifier('…et la démonstration décide de la ville par `villeVisible` (la règle D3, visible sans `.env`)',
  /ville: villeVisible\(\{ personne, regardeur \}\)/.test(chargerDemo)
  && /estPro: jeSuisPro/.test(chargerDemo) && /demandesAMontrer\(siennes, \{ jeSuisPro \}\)/.test(chargerDemo));

/* ================================================================== */
console.log('\nL’ÉCRAN — la fiche d’une personne, d’où qu’on l’ouvre');

const voir = (app.match(/const voirPersonne = async \(id, repli = null, \{ garderLaFiche = false \} = \{\}\) => \{[\s\S]*?\n {2}\};/) || [''])[0];
verifier('`voirPersonne` ouvre la page d’un artisan s’il en est un, la fiche publique sinon',
  /if \(pros\[id\]\) \{ viewProfile\(id\); return; \}/.test(voir)
  && /avecDelai\(api\.chargerProfilPublic\(id, \{ jeSuisPro: userType === 'pro' \}\), 12000, 'La fiche'\)/.test(voir));
verifier('…SON propre nom (en démonstration, l’identifiant du compte n’est pas celui de sa fiche) mène à SA page',
  /if \(maFicheId && String\(id\) === String\(api\.getUserId\(\)\) && pros\[maFicheId\]\) \{\s*viewProfile\(maFicheId\);\s*return;\s*\}/.test(voir));
verifier('…« Réessayer » sous les demandes GARDE la fiche affichée, et un échec ne l’efface pas',
  /if \(!garderLaFiche\) setProfilPublic\(deRepli\);/.test(voir)
  && /if \(garderLaFiche\) setProfilPublic\(\(p\) => \(p && String\(p\.id\) === String\(id\) \? \{ \.\.\.p, demandesEchec: true \} : p\)\);/.test(voir)
  && /const relireDemandesDuProfil = \(\) => \{\s*const \{ id, repli \} = profilDemande\.current;\s*if \(id\) voirPersonne\(id, repli, \{ garderLaFiche: true \}\);\s*\};/.test(app));
verifier('…une personne inconnue garde son nom en DÉMONSTRATION seulement (sur la vraie base : « n’est plus disponible »)',
  /if \(fiche\) setProfilPublic\(fiche\);\s*else setProfilPublic\(api\.mode === 'demo' && deRepli \? \{ \.\.\.deRepli, type: 'particulier', demandesEchec: false \} : null\);/.test(voir));
verifier('après un blocage, la fiche ouverte de cette personne perd « Envoyer un message » ; un refus de la base se dit',
  /setProfilPublic\(\(p\) => \(p && String\(p\.id\) === String\(userId\) \? \{ \.\.\.p, bloque: true \} : p\)\);/.test(app)
  && /e && e\.code === '42501'\s*\? CONVERSATION_IMPOSSIBLE/.test(app));
verifier('…retient d’où l’on vient (le retour y ramène), sans s’écraser entre deux fiches',
  /setOrigineProfilPublic\(screen === 'profilPublic' \? origineProfilPublic : screen\)/.test(voir)
  && /else if \(screen === 'profilPublic'\) setScreen\(origineProfilPublic \|\| 'home'\)/.test(app));
verifier('…et un échec de chargement se DIT par l’ÉTAT de l’écran, pas par un bandeau qui survivrait à la relecture',
  /catch \(e\) \{\s*if \(!toujoursLa\(\)\) return;\s*setProfilPublicEchec\(true\);/.test(voir)
  && !/showErreur|showBanner/.test(voir)
  && /echec=\{profilPublicEchec\}\s+onReessayer=\{relireProfilPublic\}\s+onRelireDemandes=\{relireDemandesDuProfil\}/.test(app));
verifier('…une réponse TARDIVE ne touche à rien : ni si une autre fiche a été demandée, ni si l’écran a été quitté',
  /const demande = \{ id, repli \};\s*profilDemande\.current = demande;/.test(voir)
  && /const toujoursLa = \(\) => profilDemande\.current === demande && ecranRef\.current === 'profilPublic';/.test(voir)
  && (voir.match(/if \(!toujoursLa\(\)\) return;/g) || []).length === 2
  && !/setProfilPublic\(fiche \|\| null\)/.test(voir));
verifier('« Pour moi » ouvre la fiche du client par `voirPersonne`',
  /onVoirProfil=\{\(id\) => voirPersonne\(id\)\}/.test(app));
verifier('l’écran décide du bouton par `peutEcrireDepuisLaFiche`, et dit `AUCUNE_DEMANDE_A_MONTRER`',
  /const ecrire = !!onContacter && peutEcrireDepuisLaFiche\(\{ profil, monId, jeSuisPro \}\);/.test(ecranPublic)
  && /\{ecrire && \(/.test(ecranPublic)
  && /<EmptyState>\{AUCUNE_DEMANDE_A_MONTRER\}<\/EmptyState>/.test(ecranPublic)
  && /\{jeSuisPro && profil\.type === 'particulier' && \(/.test(ecranPublic)
  && /profil\.demandesEchec \? \(\s*<EmptyState action=\{relireDemandes\}>\{DEMANDES_ILLISIBLES\}<\/EmptyState>/.test(ecranPublic)
  && (ecranPublic.match(/<EmptyState titre="Lecture impossible" action=\{reessayer\}>\{FICHE_ILLISIBLE\}<\/EmptyState>/g) || []).length === 2
  && !/Envoyer un message[\s\S]{0,200}\bjeSuisPro\s*&&\s*!estPro\s*&&/.test(ecranPublic));
const iBlocDemandes = ecranPublic.indexOf("{jeSuisPro && profil.type === 'particulier' && (");
const blocDemandes = iBlocDemandes < 0 ? '' : ecranPublic.slice(iBlocDemandes,
  parcourir(ecranPublic, ecranPublic.indexOf('(', iBlocDemandes) + 1, (c, _k, niveau) => c === ')' && niveau === 0) + 1);
verifier('…les cartes des demandes vivent DANS le bloc de leur titre (sur la fiche d’un compte pro, elles s’affichaient seules)',
  /\bdemandes\.map\(/.test(blocDemandes) && (ecranPublic.match(/\bdemandes\.map\(/g) || []).length === 1);
verifier('…n’affiche une ville que si la base (ou `villeVisible`) en a rendu une — jamais le code postal',
  /\{!!profil\.ville && \(/.test(ecranPublic) && !/codePostal|code_postal/.test(ecranPublic));

/* ================================================================== */
console.log('\nLA BASE — les règles nouvelles, comparées ENTIÈRES');

/* Une seule définition de chaque fonction, et sa forme exacte. Changer une
   de ces règles se DÉCIDE : la base, l'essai 51d et la forme ci-dessous,
   dans le même lot. */
const FONCTIONS = {
  profil_public: 'create or replace function public.profil_public(p_id uuid) returns table (id uuid, nom text, avatar_url text, type text, ville text) language sql stable security definer set search_path = public as $$ select u.id, u.nom, u.avatar_url, u.type, case when u.type = \'particulier\' and (u.id = auth.uid() or (public.est_un_pro() and not public.est_masque(u.id))) then u.ville end from public.users u where u.id = p_id and auth.uid() is not null $$',
  ma_fiche_pro: 'create or replace function public.ma_fiche_pro() returns setof public.professional_profiles language sql stable security definer set search_path = public as $$ select p.* from public.professional_profiles p where p.id = auth.uid() $$',
  admin_etat_des_fiches: 'create or replace function public.admin_etat_des_fiches(p_ids uuid[]) returns table (id uuid, badge_suspendu_le timestamptz) language plpgsql stable security definer set search_path = public as $$ begin perform public.admin_exige_droit(); return query select p.id, p.badge_suspendu_le from public.professional_profiles p where p.id = any(coalesce(p_ids, \'{}\'::uuid[])); end; $$',
};
for (const [nom, attendu] of Object.entries(FONCTIONS)) {
  const f = fonctionSql(nom);
  verifier(`\`${nom}()\` : une seule définition, et sa forme exacte`, f.n === 1 && espaces(f.tout) === attendu,
    f.n !== 1 ? `${f.n} définition(s)` : espaces(f.tout).slice(0, 200));
}
const DROITS = ['profil_public(uuid)', 'ma_fiche_pro()', 'admin_etat_des_fiches(uuid[])', 'mes_donnees_sans_masquage()'];
for (const sig of DROITS) {
  const echappe = sig.replace(/[()[\]]/g, (c) => `\\${c}`);
  verifier(`\`${sig}\` : rien pour un visiteur, \`authenticated\` seulement`,
    new RegExp(`revoke all on function public\\.${echappe} from public, anon;`).test(sql)
    && new RegExp(`grant execute on function public\\.${echappe} to authenticated;`).test(sql)
    && !new RegExp(`grant [^;]*on function public\\.${echappe} to [^;]*\\b(?:anon|public)\\b`).test(sql));
}

const POLITIQUES = [
  ['lecture likes', 'post_likes', 'create policy "lecture likes" on public.post_likes for select to authenticated using (auth.uid() = user_id);'],
  ['lecture follows', 'follows', 'create policy "lecture follows" on public.follows for select to authenticated using (auth.uid() = follower_id);'],
  ['lecture users', 'users', 'create policy "lecture users" on public.users for select to authenticated using (true);'],
  ['lecture reponses', 'demande_reponses', 'create policy "lecture reponses" on public.demande_reponses for select to authenticated using (exists ( select 1 from public.demandes d where d.id = demande_reponses.demande_id and d.client_id = auth.uid()));'],
  ['creation conversation', 'conversations', 'create policy "creation conversation" on public.conversations for insert to authenticated with check ( ((auth.uid() = client_id and not public.est_masque(professional_id)) or (auth.uid() = professional_id and not public.est_masque(client_id))) and exists (select 1 from public.professional_profiles p where p.id = conversations.professional_id) );'],
  ['lecture dispo sos', 'sos_availability', 'create policy "lecture dispo sos" on public.sos_availability for select to authenticated using (true);'],
];
for (const [nom, table, attendu] of POLITIQUES) {
  const p = politique(nom, table);
  verifier(`politique « ${nom} » : une seule création, et sa forme exacte`, p.n === 1 && p.texte === attendu,
    p.n !== 1 ? `${p.n} création(s)` : p.texte.slice(0, 220));
}

/* LES DROITS DE TABLE. `anon` GARDE la lecture des « j'aime » et des
   abonnements, exprès : `fil_filtre()` est ouverte aux visiteurs et nomme
   `follows`, et PostgreSQL vérifie le droit de chaque table nommée au
   moment de PRÉPARER la requête (mesuré : tout le fil tombait). */
verifier('`users` : plus rien pour un visiteur (`revoke all … from anon`), et 18.1 ne rend qu’aux connectés',
  /revoke all on public\.users from anon;/.test(sql)
  && /execute format\('grant select \(%s\) on public\.users to authenticated', permises\);/.test(sql)
  && !/grant select[^;]*on public\.users to [^;]*\banon\b/.test(sql));
verifier('les « j’aime » et les abonnements : `anon` perd l’écriture, GARDE la lecture (le fil des visiteurs)',
  /revoke insert, update, delete on public\.post_likes, public\.follows from anon;/.test(sql)
  && !/revoke (?:all|select)[^;]*on [^;]*public\.(?:post_likes|follows)\b[^;]*from [^;]*\banon\b/.test(sql)
  && /\bpublic\.follows\b/.test(fonctionSql('fil_filtre').corps));
verifier('les urgences : plus rien pour un visiteur, politique ET droit de table',
  /revoke all on public\.sos_availability from anon;/.test(sql));
verifier('un signalement : la note interne et l’administrateur fermés à son auteur (droits de colonne)',
  /revoke select on public\.signalements from anon, authenticated;/.test(sql)
  && /grant select \(id, auteur_id, cible_type, cible_id, motif, details,\s*statut, created_at, traite_at\)\s*on public\.signalements to authenticated;/.test(sql)
  && !/grant select \([^)]*\b(?:note|traite_par)\b[^)]*\) on public\.signalements/.test(sql)
  && !/grant (?:all|select) on public\.signalements to/.test(sql));
/* LES DROITS, LUS COMME DES PROPRIÉTÉS (relecture du 30/10, RT9). Les
   vérifications ci-dessus cherchent une ORTHOGRAPHE : `on table`, un nom
   sans `public.`, des majuscules, `all privileges`, ou `grant authenticated
   to anon` (un visiteur qui HÉRITE de tout ce qu'a un connecté) passaient
   au vert. Ici le schéma est découpé en instructions, normalisé (casse,
   blancs, guillemets, schéma, `table`), et chaque `grant` est lu pour ce
   qu'il DONNE. Les corps de fonction et de bloc `do` sont lus à part,
   pour les droits accordés par `execute`. */
const ambigus = analyseSql(SCHEMA).ambigus;
verifier('le schéma n’a aucun commentaire AMBIGU (un `/*` dans un commentaire, un `*/` après `--`) : chacun fait lire deux textes',
  ambigus.length === 0, ambigus.join(' | '));
/* UNE VUE tourne avec les droits de son propriétaire : sans
   `security_invoker`, elle rouvre une table sans RLS ni droits de colonne
   (seconde relecture du 31/10, R2T-5). Le schéma n'en a aucune. */
const vues = [...sql.matchAll(/create\s+(?:or\s+replace\s+)?(?:temp\w*\s+)?(?:materialized\s+)?view\b[^;]*/gi)].map((m) => m[0]);
verifier('aucune vue dans le schéma sans `security_invoker` (elle lirait tout avec les droits de son propriétaire)',
  vues.every((v) => /security_invoker\s*=\s*(?:true|on)\b/i.test(v) && !/materialized/i.test(v)), vues.join(' | '));
/* LE TABLEAU DES COLONNES SECRÈTES de `users` (section 18.1), figé : en
   retirer `email`, et la boucle la rendait à tout compte connecté. */
verifier('`users` : le tableau `secretes` de la section 18.1 est figé (email, téléphone, latitude, longitude)',
  (sql.match(/secretes text\[\] := array\['email', 'telephone', 'latitude', 'longitude'\];/g) || []).length === 1
  && (sql.match(/\bsecretes\b/g) || []).length === 2
  && /and not \(column_name = any\(secretes\)\);/.test(sql));
/* UN DROIT CONSTRUIT DANS UNE CHAÎNE (`execute format('grant …')`) ne se
   lit pas comme un ordre : chaque chaîne qui nomme `grant` est dans une
   liste FERMÉE, avec son nombre. */
const chainesSql = [];
for (let k = 0; k < sql.length; k += 1) {
  if (sql[k] !== "'") continue;
  const echappe = /[eE]/.test(sql[k - 1] || '') && !/\w/.test(sql[k - 2] || ' ');
  let j = k + 1;
  while (j < sql.length) {
    if (echappe && sql[j] === '\\') { j += 2; continue; }
    if (sql[j] === "'" && sql[j + 1] === "'") { j += 2; continue; }
    if (sql[j] === "'") break;
    j += 1;
  }
  chainesSql.push(sql.slice(k + 1, j));
  k = j;
}
const GRANTS_CONSTRUITS = new Map([
  ['grant execute on function %s to authenticated', 5],
  ['grant select (%s) on public.users to authenticated', 1],
  ['grant execute on function public.compter_appel_siret(text, timestamptz, int) to service_role', 1],
  ['grant execute on function public.compter_essai_tva(text, timestamptz, int, timestamptz, int) to service_role', 1],
]);
const grantsConstruits = new Map();
for (const c of chainesSql.filter((x) => /\bgrant\b/i.test(x))) grantsConstruits.set(c, (grantsConstruits.get(c) || 0) + 1);
const grantsInattendus = [...grantsConstruits].filter(([c, n]) => GRANTS_CONSTRUITS.get(c) !== n);
verifier('un droit construit dans une chaîne (`execute format(\'grant …\')`) est l’un des quatre connus, autant de fois',
  grantsInattendus.length === 0 && grantsConstruits.size === GRANTS_CONSTRUITS.size,
  grantsInattendus.map(([c, n]) => `${n} × « ${c} »`).join(' | '));
const sqlCorpsAPart = sql.replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, (_m, t) => `$${t}$corps$${t}$`);
const normaliser = (x) => x.replace(/"/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
  .replace(/\bpublic\.(?=\w)/g, '').replace(/ on table /g, ' on ').replace(/\ball privileges\b/g, 'all');
const INSTRUCTIONS = sqlCorpsAPart.split(';').map(normaliser).filter(Boolean);
const PUBLICS = /\b(?:anon|public)\b/;
const attributions = INSTRUCTIONS.map((x, rang) => ({ x, rang })).filter((i) => /^grant /.test(i.x));
const appartenances = attributions.filter((i) => !/ on /.test(i.x));
verifier('aucun rôle ne fait HÉRITER ses droits à un visiteur ou à un connecté (`grant <rôle> to anon`)',
  appartenances.every((i) => !/ to [^;]*\b(?:anon|authenticated|public)\b/.test(i.x)),
  appartenances.map((i) => i.x).join(' | '));
const surTable = (i, table) => {
  const m = / on (?!function |schema |sequence |all )(.+?) to /.exec(i.x);
  return !!m && m[1].split(',').map((t) => t.trim()).includes(table);
};
for (const table of ['users', 'sos_availability', 'signalements']) {
  const fautives = attributions.filter((i) => surTable(i, table) && PUBLICS.test(i.x.split(' to ').pop()));
  verifier(`\`${table}\` : aucun droit, sous aucune forme, pour un visiteur (\`anon\`, \`public\`)`,
    fautives.length === 0, fautives.map((i) => i.x).join(' | '));
}
const surTout = attributions.filter((i) => / on all (?:tables|sequences|functions) in schema /.test(i.x));
verifier('aucun `grant … on all tables in schema` (il rouvrirait toutes les colonnes fermées d’un coup)',
  surTout.length === 0, surTout.map((i) => i.x).join(' | '));
const sig = attributions.filter((i) => surTable(i, 'signalements'));
const sigFautives = sig.filter((i) => {
  const privileges = i.x.replace(/^grant /, '').replace(/ on .*$/, '');
  /* Chaque privilège doit porter SA liste de colonnes, sans la note ni
     l'administrateur : un `select` de table entière les rendrait. */
  return decouper(privileges, ',').some((p) => !/^(?:select|insert|update) \([^)]*\)$/.test(p) || /\b(?:note|traite_par)\b/.test(p));
});
verifier('`signalements` : chaque droit porte ses colonnes, et jamais la note ni l’administrateur (sous aucune forme)',
  sig.length >= 2 && sigFautives.length === 0, sigFautives.map((i) => i.x).join(' | '));
/* CE QUE LA BASE RELÈVE (l'auteur et l'extrait du contenu visé) ne se
   relit pas par celui qui signale (seconde relecture du 31/10) : il les
   lisait, et signaler devenait un moyen de LIRE ce que la RLS lui cache. */
const sigRelus = sig.filter((i) => decouper(i.x.replace(/^grant /, '').replace(/ on .*$/, ''), ',')
  .some((p) => /^select\b/.test(p) && /\b(?:cible_auteur_id|extrait)\b/.test(p)));
verifier('`signalements` : celui qui signale ne relit ni l’auteur ni l’extrait que la base relève (aucun `select` ne les nomme)',
  sigRelus.length === 0, sigRelus.map((i) => i.x).join(' | '));
const lectureUsers = attributions.filter((i) => surTable(i, 'users') && /(?:^grant |, )(?:select|all)\b/.test(i.x.replace(/ on .*$/, '')));
verifier(`\`users\` : une lecture écrite à la main ne nomme que ${USERS_OUVERTES.join(', ')}`,
  lectureUsers.every((i) => {
    const m = /select \(([^)]*)\)/.exec(i.x);
    return !!m && colonnes(m[1]).every((c) => USERS_OUVERTES.includes(c));
  }), lectureUsers.map((i) => i.x).join(' | '));
const iFinDroits = INSTRUCTIONS.findIndex((x) => /^do \$droits\$/.test(x));
const apresDroits = INSTRUCTIONS.slice(iFinDroits + 1)
  .filter((x) => (/^grant /.test(x) && !/^grant execute on function /.test(x)) || /^alter default privileges/.test(x));
verifier('après le balayage `$droits$`, plus aucun droit de table n’est accordé (il échapperait au balayage)',
  iFinDroits > 0 && apresDroits.length === 0, apresDroits.join(' | '));
/* LES FONCTIONS QUI TOURNENT AVEC LES DROITS DU PROPRIÉTAIRE (banc du
   30/10, X3). Une fonction `security definer` ignore la RLS et les droits
   de colonne : une NOUVELLE, qui rendrait la ligne `users` entière à tout
   connecté, rouvrait d'un coup ce que tout le lot ferme — et seul l'essai
   SQL, joué à la main, la voyait. Leur liste est FERMÉE ici, comme dans
   l'essai 49 (27c) ; en ajouter une se DÉCIDE, avec sa raison. */
const DEFINER_ATTENDUES = [
  'a_deja_une_reponse', 'admin_demandes_pro', 'admin_etat_des_fiches', 'admin_exige_droit',
  'admin_file_verifications', 'admin_metier_demandes', 'admin_refuser_pro', 'admin_resume',
  'admin_retirer_entreprise', 'admin_signalements', 'admin_specialites', 'admin_traiter_demande_pro',
  'admin_traiter_metier_demande', 'admin_traiter_signalement', 'admin_traiter_specialite',
  'admin_valider_pieces', 'admin_verifier_pro', 'annuler_ma_demande_pro', 'anonymise_actes_admin',
  'calcule_client_verifie', 'completer_ma_demande_pro', 'compter_appel_siret', 'compter_essai_tva',
  'cree_fiche_utilisateur', 'devenir_pro', 'enregistrer_appel_ia', 'est_admin', 'est_masque',
  'fiche_pro_indestructible', 'ma_fiche_pro', 'maj_chantier', 'maj_comments_count',
  'maj_followers_count', 'maj_likes_count', 'maj_nb_reponses', 'maj_nb_reponses_demande',
  'maj_notes_pro', 'maj_vues_count', 'marquer_lus', 'mes_demandes_recues',
  'mes_donnees_sans_masquage', 'mon_compte', 'notifie_commentaire', 'notifie_demande',
  'notifie_demande_pro', 'notifie_partenariat', 'notifie_reponse_annonce', 'peut_faire_un_devis',
  'pose_le_lieu_du_post', 'preparer_suppression_compte', 'profil_public', 'rattacher_mon_siret',
  'recalcule_apres_ligne_de_devis', 'recalcule_chantier', 'recalcule_devis', 'recalcule_notes_pro',
  'remonter_publication', 'siren_reserve', 'tait_les_notifications_bloquees',
  'tient_le_chantier_du_post', 'tient_le_lien_du_devis', 'tient_le_signalement',
];
const definerTrouvees = new Set();
for (const m of sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+(?:"?public"?\s*\.\s*)?"?(\w+)"?\s*\(/gi)) {
  const reste = sql.slice(m.index, m.index + 4000);
  const fin = reste.search(/\bas\s+\$\w*\$/i);
  if (/security\s+definer/i.test(fin < 0 ? reste : reste.slice(0, fin))) definerTrouvees.add(m[1].toLowerCase());
}
const definerEnTrop = [...definerTrouvees].filter((n) => !DEFINER_ATTENDUES.includes(n));
const definerManquantes = DEFINER_ATTENDUES.filter((n) => !definerTrouvees.has(n));
verifier(`les fonctions \`security definer\` sont EXACTEMENT les ${DEFINER_ATTENDUES.length} de la liste fermée`,
  definerEnTrop.length === 0 && definerManquantes.length === 0,
  `en trop : ${definerEnTrop.join(', ') || '—'} ; manquantes : ${definerManquantes.join(', ') || '—'}`);
verifier('…et aucune ne le devient après coup (`alter function … security definer`, ou dans un corps)',
  !/alter\s+function[^;]*security\s+definer/i.test(sql) && !/alter\s+routine[^;]*security\s+definer/i.test(sql));

/* Et dans les corps (`execute 'grant …'`) : les mêmes interdits. */
const sqlNormalise = normaliser(sql);
const dynamiques = [
  ...sqlNormalise.matchAll(/grant [^;']*? on [^;']*?\b(?:users|sos_availability|signalements)\b[^;']*? to [^;']*?\b(?:anon|public)\b/g),
  ...sqlNormalise.matchAll(/grant (?!execute|select|insert|update|delete|truncate|references|trigger|usage|all|connect|create|temp)\w+(?:, ?\w+)* to [^;']*?\b(?:anon|authenticated|public)\b/g),
].map((m) => m[0]);
verifier('…ni par un ordre construit dans un corps de fonction ou de bloc `do`', dynamiques.length === 0, dynamiques.join(' | '));

verifier('une notification part avec le compte qui l’a déclenchée (`acteur_id … on delete cascade`)',
  /add constraint notifications_acteur_id_fkey\s+foreign key \(acteur_id\) references public\.users\(id\) on delete cascade;/.test(sql)
  && !/acteur_id[^,;]*references public\.users\(id\) on delete set null/.test(sql));
for (const idx of ['idx_demandes_client on public.demandes (client_id)', 'idx_demande_reponses_pro on public.demande_reponses (professional_id)',
  'idx_messages_expediteur on public.messages (sender_id)', 'idx_notifications_acteur on public.notifications (acteur_id)']) {
  verifier(`l’index ${idx.split(' ')[0]} existe`, sql.includes(`create index if not exists ${idx};`));
}

/* LE BALAYAGE DES DROITS QUE PERSONNE N'UTILISE (42 bis) : présent, après
   l'export, AVANT les portes de la section 43 — donc après toute table. */
const iDroits = sql.indexOf('do $droits$');
const iExport = sql.indexOf('create or replace function public.mes_donnees()');
const iPortes = sql.indexOf('do $portes$');
const droits = iDroits < 0 ? '' : sql.slice(iDroits, sql.indexOf('$droits$;', iDroits));
verifier('le balayage `$droits$` existe, après l’export et avant les portes',
  iDroits > iExport && iExport > 0 && iPortes > iDroits);
verifier('…retire TRUNCATE, REFERENCES et TRIGGER à `anon` et `authenticated`, sur toutes les tables de `public`',
  /execute format\('revoke truncate, references, trigger on %s from anon, authenticated', t\.nom\);/.test(droits)
  && /where n\.nspname = 'public'\s+and c\.relkind in \('r', 'p', 'v', 'm', 'f'\)/.test(droits));
verifier('…et des droits PAR DÉFAUT (une table de demain naît sans eux)',
  /alter default privileges for role postgres in schema public '\s*\|\| 'revoke truncate, references, trigger on tables from anon, authenticated'/.test(droits));
verifier('…MAINTAIN seulement sous PostgreSQL 17 (la commande n’existe pas en 16)',
  (droits.match(/current_setting\('server_version_num'\)::int >= 170000/g) || []).length === 2
  && /revoke maintain on %s from anon, authenticated/.test(droits));
verifier('aucune table n’est créée APRÈS le balayage (elle naîtrait avec ses droits)',
  iDroits < 0 || !/create table/i.test(sql.slice(iDroits)));

/* ================================================================== */
console.log('\nL’EXPORT — tout, sauf une liste FERMÉE, et borné là où d’autres écrivent');

const sansMasque = fonctionSql('mes_donnees_sans_masquage');
const export_ = fonctionSql('mes_donnees');
verifier('`mes_donnees_sans_masquage()` : une définition, `security definer`, `stable`',
  sansMasque.n === 1 && /security definer/.test(sansMasque.entete) && /\bstable\b/.test(sansMasque.entete));
/* SA FORME ENTIÈRE (relecture du 30/10, RT10). Cette fonction est
   `security definer`, sans RLS, et appelable directement : élargir un
   filtre (`c.client_id = c.client_id`) ou ajouter une clé `bloque_par`
   fuit vers un tiers, et passait au vert avec « au moins 14 `auth.uid()` ».
   Son texte (commentaires retirés, espaces réduits) est comparé à une
   EMPREINTE. Changer cette fonction se DÉCIDE : la base, l'essai 51d (J1 à
   J15) et cette empreinte, dans le même lot. Même règle pour
   `tient_le_signalement()`, qui décide de l'extrait qu'un tiers retrouve
   dans son export. */
const { createHash } = await import('node:crypto');
const EMPREINTES = {
  mes_donnees_sans_masquage: '9abe58152e3be5434658dd234be73c4aceda91acfd2d3bb10b29945d1476268c',
  tient_le_signalement: '9dbf97e75796c7b1989ca56ea4bc9e66ca71c15efdf7248309d8c1913b1f5d00',
  /* Et l'export lui-même (seconde relecture du 31/10, R2T-13) : y remettre
     ses propres messages derrière le masquage passait les contrôles. */
  mes_donnees: '5aecd0ec28af992cf8b80397ea8ec23961e7749c421659862b9e31051c9bfb68',
};
for (const [nom, attendue] of Object.entries(EMPREINTES)) {
  const f = fonctionSql(nom);
  const texte = espaces(f.tout.replace(/\/\*[\s\S]*?\*\//g, ''));
  const empreinte = createHash('sha256').update(texte).digest('hex');
  verifier(`\`${nom}()\` : une seule définition, et EXACTEMENT celle que l’essai 51d éprouve (empreinte)`,
    f.n === 1 && empreinte === attendue,
    f.n !== 1 ? `${f.n} définition(s)` : `empreinte ${empreinte} — si le changement est voulu, rejouer l’essai 51d puis mettre à jour EMPREINTES`);
}
verifier('…aucune politique ne la protège : CHAQUE morceau est filtré sur `auth.uid()`',
  (sansMasque.corps.match(/auth\.uid\(\)/g) || []).length >= 14
  && !/where true|using \(true\)/.test(sansMasque.corps));
/* CE QUE D'AUTRES REMPLISSENT est borné DEUX fois : les 5 000 plus
   récents, PUIS une taille cumulée (5 000 messages de 56 ko dépassaient la
   taille maximale d'un jsonb : tout l'export tombait — relecture du 30/10).
   Chaque morceau est `materialized` (lu une fois, pour l'export et pour son
   décompte), et chacun a son décompte dans `limites`. */
const corpsSansMasque = sansMasque.corps.replace(/\/\*[\s\S]*?\*\//g, '');
const BORNES_RECUES = [
  ['recus_messages', 'messages_recus', 'm', 10000000],
  ['recus_commentaires', 'commentaires_recus', 'k', 5000000],
  ['recus_reponses_annonces', 'reponses_recues_a_mes_annonces', 'r', 5000000],
  ['recus_reponses_demandes', 'reponses_recues_a_mes_demandes', 'r', 5000000],
  ['recus_avis', 'avis_recus', 'v', 5000000],
  ['recus_signalements', 'signalements_visant_mes_contenus', 'g', 5000000],
  ['recus_devis', 'demandes_de_devis_recues', 'q', 5000000],
  ['recus_rappels', 'rappels_recus', 'q', 2000000],
  ['recus_urgences', 'urgences_recues', 'q', 5000000],
  ['mes_notifications', 'mes_notifications', 'n', 2000000],
];
const cte = (nom) => {
  const i = corpsSansMasque.search(new RegExp(`\\b${nom} as materialized \\(`));
  if (i < 0) return '';
  const debut = corpsSansMasque.indexOf('(', i);
  let niveau = 0;
  for (let k = debut; k < corpsSansMasque.length; k += 1) {
    if (corpsSansMasque[k] === '(') niveau += 1;
    else if (corpsSansMasque[k] === ')') { niveau -= 1; if (niveau === 0) return corpsSansMasque.slice(debut, k + 1); }
  }
  return '';
};
/* LA TAILLE D'UNE LIGNE COMPTE TOUTES SES COLONNES DE LONGUEUR VARIABLE
   (seconde relecture du 31/10) : la liste ne comptait que quelques textes,
   et un tiers remplissait les autres (`piece_url`, `budget`, un numéro).
   Les colonnes de chaque table sont lues dans le SCHÉMA (création et
   `add column`), et comparées à celles que `octet_length(z.…)` compte. */
const PLAFOND_LIGNE = 1000000;
const LONGUEUR_VARIABLE = /^(?:text|varchar|character varying|jsonb|json|bytea)\b|\[\]/i;
function colonnesVariables(table) {
  const sortie = new Set();
  const creation = new RegExp(`create table if not exists public\\.${table} \\(([\\s\\S]*?)\\n\\);`).exec(sql);
  if (creation) {
    for (const l of creation[1].split('\n')) {
      const m = /^\s*(\w+)\s+([\w ]+?(?:\[\])?)(?:\s|,|$)/.exec(l);
      if (!m || /^(?:constraint|primary|unique|foreign|check)$/i.test(m[1])) continue;
      if (LONGUEUR_VARIABLE.test(m[2]) || /\[\]/.test(l.split(/\bdefault\b|\breferences\b/)[0])) sortie.add(m[1]);
    }
  }
  for (const m of sql.matchAll(new RegExp(`alter table (?:if exists )?public\\.${table}\\s+add column if not exists (\\w+)\\s+([^;,]+)`, 'g'))) {
    const type = m[2].trim();
    if (LONGUEUR_VARIABLE.test(type) || /^\w+\[\]/.test(type)) sortie.add(m[1]);
  }
  return [...sortie].sort();
}
const TABLE_DE = {
  recus_messages: 'messages', recus_commentaires: 'comments', recus_reponses_annonces: 'annonce_reponses',
  recus_reponses_demandes: 'demande_reponses', recus_avis: 'reviews', recus_signalements: 'signalements',
  recus_devis: 'quote_requests', recus_rappels: 'callback_requests', recus_urgences: 'sos_requests',
  mes_notifications: 'notifications',
};
for (const [nom, cle, alias, budget] of BORNES_RECUES) {
  const corps = cte(nom);
  verifier(`…${cle} : \`${nom}\` lu une fois, les 5 000 plus récents D’ABORD, puis la taille : au plus ${budget / 1e6} Mo, une ligne de plus de 1 Mo écartée`,
    corps.length > 0
    && new RegExp(`order by ${alias}\\.created_at desc, ${alias}\\.id desc\\s+limit 5000\\) z\\) x\\) y\\)$`).test(corps)
    && new RegExp(`sum\\(x\\.taille\\) filter \\(where x\\.taille <= ${PLAFOND_LIGNE}\\)\\s+over \\(order by x\\.created_at desc, x\\.id desc\\) as cumul`).test(corps)
    && new RegExp(`\\(y\\.taille <= ${PLAFOND_LIGNE} and y\\.cumul <= ${budget}\\) as rendu`).test(corps)
    && (corps.match(/\blimit\b/g) || []).length === 1 && (corps.match(/\bover\b/g) || []).length === 1);
  const sansMesure = corps.replace(/from \(select z\.\*/, '');
  const choisies = /from \(select \w\.\*\s/.test(sansMesure)
    ? null
    : ((/from \(select ((?!z\.)\w\.\w+(?:, \w\.\w+)*)/.exec(corps) || [])[1] || '').split(', ').map((c) => c.replace(/^\w\./, ''));
  const attendues = colonnesVariables(TABLE_DE[nom]).filter((c) => !choisies || choisies.includes(c));
  const comptees = [...corps.matchAll(/octet_length\(z\.(\w+)\)/g)].map((m) => m[1]).sort();
  verifier(`…${cle} : la taille compte TOUTES les colonnes de longueur variable de \`${TABLE_DE[nom]}\``,
    attendues.length > 0 && JSON.stringify(comptees) === JSON.stringify(attendues)
    && /from \(select z\.\*, 600 \+ coalesce\(octet_length/.test(corps),
    `comptées : ${comptees.join(', ')} ; attendues : ${attendues.join(', ')}`);
  verifier(`…et son décompte dans \`limites\` : '${cle}' (total, rendus, écartées)`,
    new RegExp(`'${cle}', jsonb_build_object\\(\\s*'total', \\(select count\\(\\*\\)[\\s\\S]*?\\),\\s*'rendus', \\(select count\\(\\*\\) from ${nom} where rendu\\),\\s*'ecartees', \\(select count\\(\\*\\) from ${nom} where taille > ${PLAFOND_LIGNE}\\)\\)`).test(corpsSansMasque));
}
verifier('…aucune partie bornée ne rend ses colonnes de calcul, ni une ligne qui ne part pas',
  (corpsSansMasque.match(/to_jsonb\(x\) - 'cumul' - 'taille' - 'rendu' order by x\.created_at, x\.id\)\s+from (?:recus_\w+|mes_notifications) x where x\.rendu\)/g) || []).length === 7
  && (corpsSansMasque.match(/select to_jsonb\(r\) - 'cumul' - 'taille' - 'rendu', r\.created_at, r\.id\s+from recus_(?:devis|rappels|urgences) r where r\.rendu\)/g) || []).length === 3
  && !/to_jsonb\([xr]\)(?! - 'cumul' - 'taille' - 'rendu')/.test(corpsSansMasque)
  && !/join recus_/.test(corpsSansMasque));
const visant = cte('recus_signalements');
verifier('…un signalement qui me vise : ni qui l’a déposé, ni ce qu’il a écrit, ni la note, ni l’administrateur',
  /select g\.id, g\.cible_type, g\.cible_id, g\.motif, g\.extrait, g\.statut, g\.created_at, g\.traite_at\s/.test(visant)
  && !/\bauteur_id\b|\bdetails\b|\bnote\b|\btraite_par\b|g\.\*/.test(visant.replace(/cible_auteur_id/g, '')));
verifier('…ni un signalement de MESSAGE (à deux, il dirait qui l’a déposé)',
  /where g\.cible_auteur_id = auth\.uid\(\)\s+and g\.cible_type <> 'message'/.test(visant)
  && /where g\.cible_auteur_id = auth\.uid\(\) and g\.cible_type <> 'message'\),/.test(corpsSansMasque));
verifier('…les demandes REÇUES : seulement les miennes en artisan, jamais une « à soi-même » deux fois',
  ['quote_requests', 'callback_requests', 'sos_requests'].every((t) => new RegExp(
    `from public\\.${t} q\\s+where q\\.professional_id = auth\\.uid\\(\\) and q\\.client_id is distinct from auth\\.uid\\(\\)`).test(corpsSansMasque)));
const decisions = (sansMasque.corps.match(/'decisions_de_l_administration',[\s\S]*?'\[\]'::jsonb\)/) || [''])[0];
verifier('…une décision de l’administration : jamais l’identité de l’administrateur (`admin_id`)',
  decisions.length > 0 && !/admin_id/.test(decisions) && /'motif', j\.motif/.test(decisions));

verifier('`mes_donnees()` : `with s as materialized` (sinon neuf appels de la même fonction : 5,3 s au lieu de 0,6 s)',
  /^\s*with s as materialized \(select public\.mes_donnees_sans_masquage\(\) as j\)/.test(export_.corps.replace(/\/\*[\s\S]*?\*\//g, ''))
  && /\)\s*from s\s*$/.test(export_.corps));
verifier('…la fiche pro passe par `ma_fiche_pro()` (un `to_jsonb(p)` direct échouerait à M2)',
  /'fiche_professionnelle',\s*\(select to_jsonb\(p\) from public\.ma_fiche_pro\(\) p\)/.test(export_.corps)
  && !/from public\.professional_profiles/.test(export_.corps));

/* LA LIMITE DE POSTGRESQL : 100 arguments par fonction, donc 50 clés par
   `jsonb_build_object`. On en garde CINQ de marge : le prochain lot qui
   ajoute une clé doit trouver la place, ou ouvrir un troisième objet. */
const corpsExport = export_.corps.replace(/\/\*[\s\S]*?\*\//g, '');
const objetsDuHaut = appelsDe(corpsExport, 'jsonb_build_object')
  .filter((o) => /(?:\bselect|\|\|)\s*$/.test(corpsExport.slice(Math.max(0, o.debut - 12), o.debut)));
const clesParObjet = objetsDuHaut.map((o) => argumentsDuPremierNiveau(o.interieur).length / 2);
verifier('l’export est fait de DEUX objets joints par `||`', objetsDuHaut.length === 2, `${objetsDuHaut.length} objet(s)`);
verifier('…aucun ne dépasse 45 clés (la limite est 50 : 100 arguments)',
  clesParObjet.length === 2 && clesParObjet.every((n) => Number.isInteger(n) && n <= 45), clesParObjet.join(' + '));
const clesExport = objetsDuHaut.flatMap((o) => argumentsDuPremierNiveau(o.interieur).filter((_, k) => k % 2 === 0))
  .map((c) => c.replace(/^'|'$/g, ''));
verifier('…et aucune clé n’y est écrite deux fois (la seconde écraserait la première sans un mot)',
  new Set(clesExport).size === clesExport.length,
  clesExport.filter((c, k) => clesExport.indexOf(c) !== k).join(', '));
const ATTENDUES_SD = [
  'conversations', 'messages_recus', 'reponses_recues_a_mes_annonces', 'signalements_visant_mes_contenus',
  'decisions_de_l_administration', 'metadonnees_d_inscription', 'mes_j_aime', 'publications_enregistrees',
  'partenariats', 'reponses_que_j_ai_ecrites', 'reponses_recues_a_mes_demandes', 'avis_recus',
  'mes_demandes_de_metier', 'mes_specialites_proposees', 'mes_notifications', 'limites_de_l_export',
  'commentaires_recus',
];
verifier('…les dix-sept clés du lot S-d y sont',
  ATTENDUES_SD.every((c) => clesExport.includes(c)), ATTENDUES_SD.filter((c) => !clesExport.includes(c)).join(', '));
verifier('…les parties bornées viennent de `mes_donnees_sans_masquage()`, et `limites_de_l_export` aussi',
  ['demandes_de_devis', 'rappels', 'urgences', 'reponses_recues_a_mes_demandes', 'commentaires_recus',
    'avis_recus', 'mes_notifications'].every((c) => new RegExp(`'${c}',\\s+s\\.j -> '${c}'`).test(corpsExport))
  && ['conversations', 'messages', 'messages_recus', 'reponses_recues_a_mes_annonces', 'signalements_visant_mes_contenus']
    .every((c) => new RegExp(`'${c}',\\s+s\\.j -> '${c}'`).test(corpsExport))
  && /'limites_de_l_export',\s+s\.j -> 'limites'/.test(corpsExport)
  && !/from public\.notifications/.test(corpsExport));

/* LA LISTE FERMÉE : ce qui n'y figure PAS, et qui se glisserait sans bruit. */
verifier('exclusion 1 — l’identité de qui me suit : aucun abonnement lu par `following_id`',
  !/following_id/.test(corpsExport) && /from public\.follows x where x\.follower_id = auth\.uid\(\)/.test(corpsExport));
verifier('exclusion 2 — qui m’a bloqué : aucun blocage lu par `bloque_id`',
  !/bloque_id/.test(corpsExport) && /from public\.blocages x where x\.bloqueur_id = auth\.uid\(\)/.test(corpsExport));
const deposes = (corpsExport.match(/'signalements_deposes',[\s\S]*?where x\.auteur_id = auth\.uid\(\)\)/) || [''])[0];
verifier('exclusions 4 et 5 — mes signalements déposés : colonne par colonne, sans `note` ni `traite_par`',
  deposes.length > 0 && !/\bnote\b|traite_par|to_jsonb/.test(deposes));
verifier('…ni l’auteur ni l’extrait que la base a relevés sur ce que j’ai signalé (je n’ai pas forcément le droit de les lire)',
  deposes.length > 0 && !/cible_auteur_id|extrait/.test(deposes));
verifier('exclusion 7 — aucune fiche de carnet ni aucun devis qu’un AUTRE artisan tient sur moi',
  !/from public\.clients x where (?!x\.pro_id = auth\.uid\(\))/.test(corpsExport)
  && !/from public\.devis x where (?!x\.pro_id = auth\.uid\(\))/.test(corpsExport));
verifier('l’export reste `security invoker` (il lit ce que les politiques laissent passer)',
  /security invoker/.test(export_.entete) && !/security definer/.test(export_.entete));

/* Les textes disent la MÊME borne que la base. */
const { CONFIDENTIALITE, BORNES_DE_L_EXPORT } = await import('../src/data/legal.js');
const texteExport = CONFIDENTIALITE.map((b) => b.texte).join(' ');
verifier('les textes disent la borne des 5 000, comme la base',
  /5[\u00a0\u202f ]?000/.test(texteExport));
/* LES CHIFFRES DU TEXTE SONT CEUX DE LA BASE (seconde relecture du 31/10,
   R2T-12) : le plus petit et le plus grand budget, et la pièce écartée. */
const budgets = BORNES_RECUES.map((b) => b[3] / 1e6);
const plafonds = [...corpsSansMasque.matchAll(/y\.taille <= (\d+) and/g)].map((m) => Number(m[1]));
verifier(`\`BORNES_DE_L_EXPORT\` dit « de ${Math.min(...budgets)} à ${Math.max(...budgets)} Mo » et « 1 Mo », comme la base`,
  typeof BORNES_DE_L_EXPORT === 'string'
  && new RegExp(`de ${Math.min(...budgets)} à ${Math.max(...budgets)}[\\u00a0\\u202f ]Mo`).test(BORNES_DE_L_EXPORT)
  && /plus de 1[\u00a0\u202f ]Mo est écartée/.test(BORNES_DE_L_EXPORT)
  && /5[\u00a0\u202f ]000 plus récents/.test(BORNES_DE_L_EXPORT)
  && plafonds.length === BORNES_RECUES.length && plafonds.every((p) => p === 1e6));

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Ce que chacun lit des autres : la base le ferme, l’application ne le relit plus, l’export le dit.\n');
