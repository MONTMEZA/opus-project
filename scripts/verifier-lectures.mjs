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
const sqlSansCommentaires = (c) => c.replace(/^\s*--.*$/gm, '').replace(/[ \t]+--[^\n']*$/gm, '');
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
  && (api.match(/supabase\.from\(table\)/g) || []).length === 3
  && (api.match(/const table = /g) || []).length === 1
  && /const regles = GENRES_DEMANDE\[genre\];/.test(api)
  && JSON.stringify(TABLES_VARIABLES.get('regles.table')) === JSON.stringify(['quote_requests', 'callback_requests', 'sos_requests']),
  JSON.stringify(TABLES_VARIABLES.get('regles.table')));
const lectures = [];
const nonLues = [];
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
  && /demandes: dRes\.error \? \[\] : demandesAMontrer\(dRes\.data \|\| \[\], \{ jeSuisPro \}\)/.test(chargerSupabase));
verifier('…et une lecture des demandes RATÉE se dit (`demandesEchec`), elle n’est pas « aucune demande »',
  /demandesEchec: !!dRes\.error,/.test(chargerSupabase)
  && /demandesEchec: false,/.test((api.match(/async function chargerProfilPublicDemo[\s\S]*?\n\}/) || [''])[0]));
const chargerDemo = (api.match(/async function chargerProfilPublicDemo[\s\S]*?\n\}/) || [''])[0];
verifier('…et la démonstration décide de la ville par `villeVisible` (la règle D3, visible sans `.env`)',
  /ville: villeVisible\(\{ personne, regardeur \}\)/.test(chargerDemo)
  && /estPro: jeSuisPro/.test(chargerDemo) && /demandesAMontrer\(siennes, \{ jeSuisPro \}\)/.test(chargerDemo));

/* ================================================================== */
console.log('\nL’ÉCRAN — la fiche d’une personne, d’où qu’on l’ouvre');

const voir = (app.match(/const voirPersonne = async \(id, repli = null\) => \{[\s\S]*?\n {2}\};/) || [''])[0];
verifier('`voirPersonne` ouvre la page d’un artisan s’il en est un, la fiche publique sinon',
  /if \(pros\[id\]\) \{ viewProfile\(id\); return; \}/.test(voir)
  && /api\.chargerProfilPublic\(id, \{ jeSuisPro: userType === 'pro' \}\)/.test(voir));
verifier('…retient d’où l’on vient (le retour y ramène), sans s’écraser entre deux fiches',
  /setOrigineProfilPublic\(screen === 'profilPublic' \? origineProfilPublic : screen\)/.test(voir)
  && /else if \(screen === 'profilPublic'\) setScreen\(origineProfilPublic \|\| 'home'\)/.test(app));
verifier('…et un échec de chargement se DIT (pas une fiche vide qui passe pour la bonne)',
  /catch \(e\) \{\s*if \(profilDemande\.current !== demande\) return;\s*setProfilPublicEchec\(true\);\s*showErreur\(messageClair\(e,/.test(voir)
  && /echec=\{profilPublicEchec\}\s+onReessayer=\{relireProfilPublic\}/.test(app));
verifier('…une réponse TARDIVE ne remplace pas la fiche demandée ensuite (objet comparé par identité)',
  /const demande = \{ id, repli \};\s*profilDemande\.current = demande;/.test(voir)
  && /if \(profilDemande\.current !== demande\) return;\s*setProfilPublic\(fiche \|\| null\);/.test(voir)
  && (voir.match(/profilDemande\.current !== demande/g) || []).length === 2);
verifier('« Pour moi » ouvre la fiche du client par `voirPersonne`',
  /onVoirProfil=\{\(id\) => voirPersonne\(id\)\}/.test(app));
verifier('l’écran décide du bouton par `peutEcrireDepuisLaFiche`, et dit `AUCUNE_DEMANDE_A_MONTRER`',
  /const ecrire = !!onContacter && peutEcrireDepuisLaFiche\(\{ profil, monId, jeSuisPro \}\);/.test(ecranPublic)
  && /\{ecrire && \(/.test(ecranPublic)
  && /<EmptyState>\{AUCUNE_DEMANDE_A_MONTRER\}<\/EmptyState>/.test(ecranPublic)
  && /\{jeSuisPro && profil\.type === 'particulier' && \(/.test(ecranPublic)
  && /\{profil\.demandesEchec \? \(\s*<EmptyState action=\{reessayer\}>\{DEMANDES_ILLISIBLES\}<\/EmptyState>/.test(ecranPublic)
  && (ecranPublic.match(/<EmptyState titre="Lecture impossible" action=\{reessayer\}>\{FICHE_ILLISIBLE\}<\/EmptyState>/g) || []).length === 2
  && !/Envoyer un message[\s\S]{0,200}\bjeSuisPro\s*&&\s*!estPro\s*&&/.test(ecranPublic));
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
  && /grant select \(id, auteur_id, cible_type, cible_id, cible_auteur_id, extrait, motif, details,\s*statut, created_at, traite_at\)\s*on public\.signalements to authenticated;/.test(sql)
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
  mes_donnees_sans_masquage: '918fa410f0d62161b66e00d2755beff588a933fc820cb1bcb1516c0c0b366df4',
  tient_le_signalement: '572948566887ad8edd3fc423e3bf2ced21c5a4fab15cb0ca5993e7c01149b2e4',
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
for (const [nom, cle, alias, budget] of BORNES_RECUES) {
  const corps = cte(nom);
  verifier(`…${cle} : \`${nom}\` lu une fois, les 5 000 plus récents PUIS au plus ${budget / 1e6} Mo`,
    corps.length > 0
    && new RegExp(`over \\(order by ${alias}\\.created_at desc, ${alias}\\.id desc\\) as cumul`).test(corps)
    && new RegExp(`order by ${alias}\\.created_at desc, ${alias}\\.id desc\\s+limit 5000\\) x\\s+where x\\.cumul <= ${budget}\\)$`).test(corps));
  verifier(`…et son décompte dans \`limites\` : '${cle}' (total, et rendus = \`${nom}\`)`,
    new RegExp(`'${cle}', jsonb_build_object\\(\\s*'total', \\(select count\\(\\*\\)[\\s\\S]*?\\),\\s*'rendus', \\(select count\\(\\*\\) from ${nom}\\)\\)`).test(corpsSansMasque));
}
verifier('…aucune partie bornée ne rend la colonne de calcul `cumul`',
  (corpsSansMasque.match(/to_jsonb\(x\) - 'cumul'/g) || []).length === 7
  && !/to_jsonb\(x\)(?! - 'cumul')[^\n]*from (?:recus_|mes_notifications)/.test(corpsSansMasque));
const visant = cte('recus_signalements');
verifier('…un signalement qui me vise : ni qui l’a déposé, ni ce qu’il a écrit, ni la note, ni l’administrateur',
  /select g\.id, g\.cible_type, g\.cible_id, g\.motif, g\.extrait, g\.statut, g\.created_at, g\.traite_at,/.test(visant)
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
  && ['conversations', 'messages_recus', 'reponses_recues_a_mes_annonces', 'signalements_visant_mes_contenus']
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
verifier('exclusion 7 — aucune fiche de carnet ni aucun devis qu’un AUTRE artisan tient sur moi',
  !/from public\.clients x where (?!x\.pro_id = auth\.uid\(\))/.test(corpsExport)
  && !/from public\.devis x where (?!x\.pro_id = auth\.uid\(\))/.test(corpsExport));
verifier('l’export reste `security invoker` (il lit ce que les politiques laissent passer)',
  /security invoker/.test(export_.entete) && !/security definer/.test(export_.entete));

/* Les textes disent la MÊME borne que la base. */
const { CONFIDENTIALITE } = await import('../src/data/legal.js');
const texteExport = CONFIDENTIALITE.map((b) => b.texte).join(' ');
verifier('les textes disent la borne des 5 000, comme la base',
  /5[   ]?000/.test(texteExport));

/* ================================================================== */
if (echecs) {
  console.error(`\n✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('\n✔ Ce que chacun lit des autres : la base le ferme, l’application ne le relit plus, l’export le dit.\n');
