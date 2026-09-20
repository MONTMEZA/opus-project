/**
 * La liste des métiers existe à DEUX endroits : dans l'application
 * (src/data/demo.js) et dans la contrainte `pro_metiers_check` de
 * supabase/schema.sql. Si elles divergent, la base refuse silencieusement
 * les profils — exactement ce qui s'était passé avec le format « montage »,
 * refusé pendant des jours sans qu'aucun test ne le voie.
 *
 * Ce script compare les deux. À lancer avec `npm run verifier-metiers`.
 */
import { readFileSync } from 'node:fs';

const app = readFileSync('src/data/demo.js', 'utf8');
const sql = readFileSync('supabase/schema.sql', 'utf8');

function entreApostrophes(texte) {
  return [...texte.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function listeDeLApp() {
  const bloc = app.match(/export const METIERS = \[([\s\S]*?)\];/);
  if (!bloc) throw new Error('METIERS introuvable dans src/data/demo.js');
  return entreApostrophes(bloc[1]);
}

function listeDuSql() {
  const bloc = sql.match(/pro_metiers_check[\s\S]*?metiers <@ array\[([\s\S]*?)\]::text\[\]/);
  if (!bloc) throw new Error('pro_metiers_check introuvable dans supabase/schema.sql');
  return entreApostrophes(bloc[1]);
}

const app_ = listeDeLApp();
const sql_ = listeDuSql();

const manqueEnBase = app_.filter((m) => !sql_.includes(m));
const manqueDansLApp = sql_.filter((m) => !app_.includes(m));

if (manqueEnBase.length === 0 && manqueDansLApp.length === 0) {
  console.log(`✔ Les ${app_.length} métiers sont identiques dans l'application et dans la base.`);
  process.exit(0);
}

console.error('✘ Les deux listes de métiers ont divergé.\n');
if (manqueEnBase.length) {
  console.error("  Proposés par l'application mais REFUSÉS par la base :");
  manqueEnBase.forEach((m) => console.error(`    - ${m}`));
  console.error('  → ajoutez-les à pro_metiers_check dans supabase/schema.sql,');
  console.error('    puis rejouez le fichier (drop constraint / add constraint).\n');
}
if (manqueDansLApp.length) {
  console.error("  Acceptés par la base mais absents de l'application :");
  manqueDansLApp.forEach((m) => console.error(`    - ${m}`));
  console.error("  → ajoutez-les à METIERS dans src/data/demo.js.\n");
}
process.exit(1);
