/**
 * Engendre le SQL du catalogue des métiers à partir du fichier JavaScript.
 *
 * POURQUOI CE SCRIPT EXISTE
 * -------------------------
 * La liste des métiers était écrite à DEUX endroits : douze chaînes dans
 * le code, et les mêmes douze recopiées à la main dans la contrainte
 * `pro_metiers_check`. Deux endroits à tenir d'accord, et personne ne s'en
 * souvient. C'est ce qui avait fait refuser tous les montages : le code
 * envoyait une valeur que la base ne connaissait pas.
 *
 * Le remède n'est pas « faire attention » — ça ne marche jamais. C'est que
 * le second endroit ne soit plus écrit par un humain.
 *
 *   npm run generer-catalogue         réécrit la section 21.1 de schema.sql
 *   npm run generer-catalogue -- --verifier     dit seulement si ça diverge
 *
 * Le second mode sert à `npm run verifier-metiers` : il ne touche à rien et
 * sort en erreur si le SQL ne correspond plus au catalogue.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const { CATALOGUE, CATEGORIES } = await import('../src/data/catalogue-metiers.js');

const FICHIER = 'supabase/schema.sql';
const DEBUT = '-- <<< CATALOGUE ENGENDRÉ — ne pas modifier à la main >>>';
const FIN = '-- <<< FIN DU CATALOGUE ENGENDRÉ >>>';

/** Une chaîne SQL : l'apostrophe se double, et rien d'autre ne passe. */
const txt = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Un tableau SQL de chaînes. Vide, c'est `'{}'`, pas `null`. */
const tableau = (liste) => (
  !liste || !liste.length
    ? `'{}'::text[]`
    : `array[${liste.map(txt).join(', ')}]::text[]`
);

function engendrer() {
  const lignes = [];

  lignes.push(DEBUT);
  lignes.push('');
  lignes.push(`-- ${CATEGORIES.length} catégories.`);
  lignes.push('insert into public.metiers_categories (cle, nom, ordre) values');
  lignes.push(CATEGORIES
    .map((c, i) => `  (${txt(c.cle)}, ${txt(c.nom)}, ${i})`)
    .join(',\n') + ';');
  lignes.push('');

  const metiers = CATALOGUE.filter((m) => m.actif !== false);
  const specialites = metiers.flatMap((m) => (m.spe || []).map((s) => ({ ...s, parent: m })));

  lignes.push(`-- ${metiers.length} métiers.`);
  lignes.push('insert into public.metiers_catalogue');
  lignes.push('  (cle, nom, categorie, parent, synonymes, ordre, herite_de) values');
  lignes.push(metiers
    .map((m, i) => `  (${txt(m.cle)}, ${txt(m.nom)}, ${txt(m.categorie)}, null, `
      + `${tableau(m.syn)}, ${i}, ${m.herite ? txt(m.herite) : 'null'})`)
    .join(',\n') + ';');
  lignes.push('');

  /* Les spécialités APRÈS les métiers, et c'est obligatoire : `parent`
     est une clé étrangère, donc le métier doit déjà exister. */
  lignes.push(`-- ${specialites.length} spécialités — après les métiers, car `
    + '`parent` pointe vers eux.');
  lignes.push('insert into public.metiers_catalogue');
  lignes.push('  (cle, nom, categorie, parent, synonymes, ordre, herite_de) values');
  lignes.push(specialites
    .map((s, i) => `  (${txt(s.cle)}, ${txt(s.nom)}, ${txt(s.parent.categorie)}, `
      + `${txt(s.parent.cle)}, ${tableau(s.syn)}, ${i}, null)`)
    .join(',\n') + ';');
  lignes.push('');
  lignes.push(FIN);

  return lignes.join('\n');
}

/**
 * Les `insert` ci-dessus échoueraient au deuxième passage : le fichier doit
 * être rejouable. On les enveloppe donc pour qu'ils mettent à jour au lieu
 * d'échouer — et `actif` n'est jamais écrasé, sinon un métier désactivé par
 * l'administrateur ressusciterait à chaque migration.
 */
function avecConflit(sql) {
  return sql
    .replace(/(insert into public\.metiers_categories[\s\S]*?);\n/,
      (bloc) => bloc.replace(/;\n$/, '\n'
        + '  on conflict (cle) do update set nom = excluded.nom, ordre = excluded.ordre;\n'))
    .replace(/(insert into public\.metiers_catalogue[\s\S]*?);\n/g,
      (bloc) => bloc.replace(/;\n$/, '\n'
        + '  on conflict (cle) do update set\n'
        + '    nom = excluded.nom, categorie = excluded.categorie,\n'
        + '    parent = excluded.parent, synonymes = excluded.synonymes,\n'
        + '    ordre = excluded.ordre, herite_de = excluded.herite_de;\n'));
}

const sql = avecConflit(engendrer());
const fichier = readFileSync(FICHIER, 'utf8');
const i = fichier.indexOf(DEBUT);
const j = fichier.indexOf(FIN);

if (i === -1 || j === -1) {
  console.error(`✘ Les repères du bloc engendré sont introuvables dans ${FICHIER}.`);
  console.error('  Ils ne doivent jamais être supprimés : ils disent où écrire.');
  process.exit(1);
}

const actuel = fichier.slice(i, j + FIN.length);
const verifierSeulement = process.argv.includes('--verifier');

if (actuel === sql) {
  console.log(`✔ Le catalogue de ${FICHIER} correspond au fichier JavaScript.`);
  process.exit(0);
}

if (verifierSeulement) {
  console.error('✘ Le SQL du catalogue ne correspond plus à');
  console.error('  src/data/catalogue-metiers.js.');
  console.error('  Lance : npm run generer-catalogue');
  process.exit(1);
}

writeFileSync(FICHIER, fichier.slice(0, i) + sql + fichier.slice(j + FIN.length));
const nbMetiers = CATALOGUE.filter((m) => m.actif !== false).length;
const nbSpe = CATALOGUE.reduce((n, m) => n + ((m.spe || []).length), 0);
console.log(`✔ ${FICHIER} réécrit : ${CATEGORIES.length} catégories, `
  + `${nbMetiers} métiers, ${nbSpe} spécialités.`);
console.log('  Pense à rejouer le schéma sur la base — ou laisse-moi le faire.');
