/**
 * Les motifs de signalement et les types de cible existent à DEUX endroits :
 * dans l'application (src/data/moderation.js) et dans les contraintes
 * `check (... in (...))` de supabase/schema.sql.
 *
 * Une divergence fait refuser l'enregistrement par la base sans que rien ne
 * le montre en mode démo — exactement ce qui s'était passé avec le format
 * « montage ». Et un signalement refusé, c'est un signalement perdu.
 *
 * node scripts/verifier-moderation.mjs
 */
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/schema.sql', 'utf8');
const app = readFileSync('src/data/moderation.js', 'utf8');

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const entreApostrophes = (t) => [...t.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const memesElements = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function contrainte(nom, colonne) {
  const bloc = sql.match(
    new RegExp(`add constraint ${nom}[\\s\\S]*?check \\(${colonne} in \\(([\\s\\S]*?)\\n?\\s*\\)\\)`),
  );
  if (!bloc) throw new Error(`contrainte introuvable : ${nom}`);
  return entreApostrophes(bloc[1].replace(/--[^\n]*/g, ''));
}

function liste(nom) {
  const bloc = app.match(new RegExp(`export const ${nom} = \\[([\\s\\S]*?)\\n\\];`));
  if (!bloc) throw new Error(`${nom} introuvable dans src/data/moderation.js`);
  return [...bloc[1].matchAll(/cle: '([^']+)'/g)].map((m) => m[1]);
}

console.log('\nMotifs de signalement');
const motifsSql = contrainte('signalements_motif_check', 'motif');
const motifsApp = liste('MOTIFS');
verifier(`${motifsApp.length} motifs identiques`, memesElements(motifsApp, motifsSql),
  `app: ${motifsApp.join(', ')}\n      sql: ${motifsSql.join(', ')}`);

console.log('\nTypes de contenu signalable');
const ciblesSql = contrainte('signalements_cible_type_check', 'cible_type');
const ciblesApp = liste('CIBLES');
verifier(`${ciblesApp.length} types identiques`, memesElements(ciblesApp, ciblesSql),
  `app: ${ciblesApp.join(', ')}\n      sql: ${ciblesSql.join(', ')}`);

console.log('\nCe que la base doit protéger');
verifier('la table des blocages existe', /create table if not exists public\.blocages/.test(sql));
verifier('un blocage ne peut pas viser soi-même',
  /blocage_pas_soi_meme[\s\S]*?check \(bloqueur_id <> bloque_id\)/.test(sql));
verifier('le masquage est symétrique (les deux sens sont testés)',
  /b\.bloqueur_id = auth\.uid\(\) and b\.bloque_id\s+= p_autre[\s\S]*?b\.bloqueur_id = p_autre\s+and b\.bloque_id\s+= auth\.uid\(\)/.test(sql));
verifier('on ne peut pas lister qui vous a bloqué',
  /create policy "mes blocages"[\s\S]*?using \(auth\.uid\(\) = bloqueur_id\)/.test(sql));
verifier('un signalement ne se modifie pas après coup',
  !/create policy[^\n]*signalement[^\n]*for update/i.test(sql));
verifier('les avis survivent à la suppression de leur auteur',
  /reviews_author_id_fkey[\s\S]*?on delete set null/.test(sql));
verifier('les commentaires aussi',
  /comments_author_id_fkey[\s\S]*?on delete set null/.test(sql));
verifier('les signalements aussi',
  /signalements_auteur_id_fkey[\s\S]*?on delete set null/.test(sql));
verifier('`anon` ne peut pas appeler les fonctions à privilèges',
  /revoke execute on function %s from anon/.test(sql));

console.log('');
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Tout est cohérent.\n');
