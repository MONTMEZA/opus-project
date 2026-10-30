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
  villeVisible, demandesAMontrer, peutEcrireDepuisLaFiche,
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
    if (ouvre < 0 || !/^\.\w+$/.test(texte.slice(j, ouvre))) return texte.slice(i, k);
    let niveau = 0;
    let fin = -1;
    for (let q = ouvre; q < texte.length; q += 1) {
      const c = texte[q];
      if (c === "'" || c === '`') { const ferme = texte.indexOf(c, q + 1); if (ferme < 0) break; q = ferme; continue; }
      if (c === '(') niveau += 1;
      else if (c === ')') { niveau -= 1; if (niveau === 0) { fin = q; break; } }
    }
    if (fin < 0) return texte.slice(i, k);
    k = fin + 1;
  }
}
function lecturesDe(table) {
  const sortie = [];
  const marque = `.from('${table}')`;
  let i = api.indexOf(marque);
  while (i >= 0) {
    const ordre = chaineApres(api, i + marque.length);
    for (const m of ordre.matchAll(/\.select\(\s*(?:'([^']*)'|([A-Z_]+))?\s*[,)]/g)) {
      sortie.push({ brut: m[1], constante: m[2], ordre: espaces(marque + ordre).slice(0, 120) });
    }
    i = api.indexOf(marque, i + marque.length);
  }
  return sortie;
}
const colonnes = (liste) => liste.split(',').map((c) => c.trim()).filter(Boolean);

/* Tout ce qui précède ne relit que `api.js`. Ce n'est vrai que si c'est
   le SEUL fichier de l'application qui parle à la base. */
const { execSync } = await import('node:child_process');
const autresLecteurs = execSync('git ls-files src', { encoding: 'utf8' }).split('\n')
  .filter((f) => /\.(?:js|jsx|ts|tsx)$/.test(f) && f !== 'src/lib/api.js')
  .filter((f) => /\bsupabase\s*\.\s*(?:from|rpc|schema)\s*\(/.test(sansCommentaires(lire(f))));
verifier('`api.js` est le SEUL fichier de `src/` qui lit la base (sinon ce contrôle ne voit pas tout)',
  autresLecteurs.length === 0, autresLecteurs.join(', '));

const lecturesUsers = lecturesDe('users');
verifier('l’application lit `users` (sinon ce contrôle ne regarde rien)', lecturesUsers.length >= 2,
  `${lecturesUsers.length} lecture(s) trouvée(s)`);
for (const l of lecturesUsers) {
  const cols = l.brut == null ? ['*'] : colonnes(l.brut);
  const fermees = cols.filter((c) => !USERS_OUVERTES.includes(c));
  verifier(`\`users\` : « ${l.brut == null ? '(tout)' : l.brut} » ne nomme que ${USERS_OUVERTES.join(', ')}`,
    fermees.length === 0, `${fermees.join(', ')} — dans ${l.ordre}`);
}

/* Les jointures intégrées vers `users` : `users:author_id(nom, …)`,
   `acteur:acteur_id(…)`. Le sous-objet `fiche:professional_profiles(…)`
   est une autre table : il est retiré avant de compter. */
const jointuresUsers = [...api.matchAll(/(\w+):(author_id|client_id|acteur_id|bloque_id|auteur_id|sender_id|follower_id|user_id)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g)];
verifier('les jointures vers `users` sont trouvées (au moins quatre aujourd’hui)', jointuresUsers.length >= 4,
  `${jointuresUsers.length} trouvée(s)`);
for (const m of jointuresUsers) {
  const cols = colonnes(m[3].replace(/\w+:\w+\s*\([^()]*\)/g, ''));
  const fermees = cols.filter((c) => !USERS_OUVERTES.includes(c));
  verifier(`jointure \`${m[1]}:${m[2]}(…)\` : rien que ${USERS_OUVERTES.join(', ')}`,
    fermees.length === 0, fermees.join(', '));
}

/* La liste des colonnes des fiches pro : une constante, lue à part. */
const listePro = (lire('src/lib/api.js').match(/const COLONNES_PRO_LISTE = \[([\s\S]*?)\]\.join/) || [])[1] || '';
const colsListe = [...listePro.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
verifier('la liste des fiches pro est trouvée, et porte encore la vitrine (`entreprise`, `agent_nom`)',
  colsListe.includes('entreprise') && colsListe.includes('agent_nom') && colsListe.length > 20,
  `${colsListe.length} colonne(s)`);
verifier(`…et aucune des huit colonnes fermées (${PRO_FERMEES.join(', ')})`,
  PRO_FERMEES.every((c) => !colsListe.includes(c)),
  colsListe.filter((c) => PRO_FERMEES.includes(c)).join(', '));

const lecturesPro = lecturesDe('professional_profiles');
verifier('l’application lit les fiches pro par `select` (sinon ce contrôle ne regarde rien)', lecturesPro.length >= 2,
  `${lecturesPro.length} lecture(s)`);
for (const l of lecturesPro) {
  if (l.constante) {
    verifier(`fiches pro : la constante \`${l.constante}\` est la liste contrôlée ci-dessus`, l.constante === 'COLONNES_PRO_LISTE');
    continue;
  }
  const cols = l.brut == null ? ['*'] : colonnes(l.brut);
  const fermees = cols.filter((c) => c === '*' || PRO_FERMEES.includes(c));
  verifier(`fiches pro : « ${l.brut == null ? '(tout)' : l.brut} » ne lit aucune colonne fermée, ni tout`,
    fermees.length === 0, `${fermees.join(', ')} — dans ${l.ordre}`);
}
const jointuresPro = [...api.matchAll(/:professional_profiles\s*\(([^()]*)\)/g)];
for (const m of jointuresPro) {
  const cols = colonnes(m[1]);
  const fermees = cols.filter((c) => c === '*' || PRO_FERMEES.includes(c));
  verifier(`jointure vers les fiches pro « ${m[1].slice(0, 60)} » : aucune colonne fermée`, fermees.length === 0, fermees.join(', '));
}

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
  && /demandesAMontrer\(dRes\.data \|\| \[\], \{ jeSuisPro \}\)/.test(chargerSupabase));
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
  /catch \(e\) \{\s*showErreur\(messageClair\(e,/.test(voir));
verifier('« Pour moi » ouvre la fiche du client par `voirPersonne`',
  /onVoirProfil=\{\(id\) => voirPersonne\(id\)\}/.test(app));
verifier('l’écran décide du bouton par `peutEcrireDepuisLaFiche`, et dit `AUCUNE_DEMANDE_A_MONTRER`',
  /const ecrire = !!onContacter && peutEcrireDepuisLaFiche\(\{ profil, monId, jeSuisPro \}\);/.test(ecranPublic)
  && /\{ecrire && \(/.test(ecranPublic)
  && /<EmptyState>\{AUCUNE_DEMANDE_A_MONTRER\}<\/EmptyState>/.test(ecranPublic)
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
verifier('…aucune politique ne la protège : CHAQUE morceau est filtré sur `auth.uid()`',
  (sansMasque.corps.match(/auth\.uid\(\)/g) || []).length >= 14
  && !/where true|using \(true\)/.test(sansMasque.corps));
verifier('…les messages reçus : les 5 000 plus récents, avec leur nombre total',
  /order by m\.created_at desc, m\.id desc\s+limit 5000\) x\)/.test(sansMasque.corps)
  && /'messages_recus_total',/.test(sansMasque.corps));
const visant = (sansMasque.corps.match(/'signalements_visant_mes_contenus',[\s\S]*?where s\.cible_auteur_id = auth\.uid\(\)\)/) || [''])[0];
verifier('…un signalement qui me vise : ni qui l’a déposé, ni ce qu’il a écrit, ni la note, ni l’administrateur',
  visant.length > 0 && !/\bauteur_id\b|\bdetails\b|\bnote\b|\btraite_par\b/.test(visant.replace(/cible_auteur_id/g, '')));
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
];
verifier('…les seize clés du lot S-d y sont',
  ATTENDUES_SD.every((c) => clesExport.includes(c)), ATTENDUES_SD.filter((c) => !clesExport.includes(c)).join(', '));
verifier('…ses notifications : les 5 000 plus récentes, le total dans `limites_de_l_export`',
  /order by n\.created_at desc, n\.id desc\s+limit 5000\) x\)/.test(corpsExport)
  && /'rendus', least\(\(select count\(\*\) from public\.notifications n where n\.user_id = auth\.uid\(\)\), 5000\)\)/.test(corpsExport));

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
