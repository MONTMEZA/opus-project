/**
 * UNE SEULE COMMANDE POUR TOUT VÉRIFIER.
 *
 * POURQUOI ELLE MANQUAIT, ET CE QUE ÇA COÛTAIT
 * --------------------------------------------
 * Le projet comptait **vingt-deux contrôles** le 02/10/2026, et aucun moyen
 * de les lancer ensemble. Il fallait les connaître par leur nom, un par un,
 * et se souvenir lesquels existent. Autrement dit : personne ne les lançait
 * tous, jamais.
 *
 * Pire, CLAUDE.md pose une règle que rien ne tenait :
 *
 *   « Lancer les contrôles en lisant leur CODE DE SORTIE, pas leur sortie
 *     à l'écran. »
 *
 * C'est exactement le jour où `verifier-montage` a planté pendant des jours
 * sans que personne ne le voie : il n'écrivait aucun « ✘ », il mourait.
 * Une sortie lue à l'œil ne distingue pas un contrôle qui PASSE d'un
 * contrôle qui n'a pas pu DÉMARRER.
 *
 * Ici, chaque contrôle est jugé sur son code de sortie, et un contrôle qui
 * plante est rapporté comme tel — « n'a pas pu se lancer » — et non comme
 * un échec ordinaire, parce que ça ne se répare pas au même endroit.
 *
 *   npm run verifier              tout, dans l'ordre
 *   npm run verifier -- --bref    seulement ce qui ne va pas
 *
 * Ce qu'elle NE fait PAS : construire le paquet, ni ouvrir le navigateur.
 * Les deux prennent des minutes et demandent un réseau ; ils restent à la
 * main, et l'intégration continue s'en charge à chaque envoi.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const bref = process.argv.includes('--bref');

/* On découvre les contrôles plutôt que de les énumérer : un contrôle ajouté
   demain entre tout seul. C'est la différence entre une liste qui se périme
   et une liste qui se tient à jour. */
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts || {};
const controles = Object.keys(scripts)
  .filter((n) => n.startsWith('verifier-'))
  .sort();

if (controles.length === 0) {
  console.error('Aucun contrôle trouvé dans package.json.');
  process.exit(1);
}

console.log(`\nOpus — ${controles.length} contrôles\n`);

const echoues = [];
const plantes = [];
const t0 = Date.now();

for (const nom of controles) {
  const t = Date.now();
  const r = spawnSync('npm', ['run', '--silent', nom], { encoding: 'utf8' });
  const ms = Date.now() - t;
  const sortie = `${r.stdout || ''}${r.stderr || ''}`;

  /* Un contrôle qui PLANTE ne vérifie rien, et ça ne se voit pas : il
     n'écrit aucun « ✘ ». On le reconnaît à ce qu'il meurt sans avoir écrit
     une seule ligne de verdict. */
  const aParle = /[✔✘]/.test(sortie);
  const ok = r.status === 0;

  if (ok) {
    if (!bref) console.log(`  ✔ ${nom.padEnd(22)} ${String(ms).padStart(5)} ms`);
    continue;
  }
  if (!aParle) {
    plantes.push([nom, sortie.trim().split('\n').slice(-6).join('\n')]);
    console.error(`  ⚠ ${nom.padEnd(22)} N'A PAS PU SE LANCER`);
    continue;
  }
  echoues.push([nom, sortie.split('\n').filter((l) => l.includes('✘')).slice(0, 6).join('\n')]);
  console.error(`  ✘ ${nom.padEnd(22)} ${String(ms).padStart(5)} ms`);
}

const total = ((Date.now() - t0) / 1000).toFixed(1);

if (plantes.length) {
  console.error('\n\nCES CONTRÔLES N\'ONT PAS PU SE LANCER');
  console.error('Ils ne vérifient donc RIEN, et ça ne se voyait pas.\n');
  plantes.forEach(([nom, fin]) => console.error(`── ${nom}\n${fin}\n`));
}
if (echoues.length) {
  console.error('\nCE QUI NE VA PAS\n');
  echoues.forEach(([nom, lignes]) => console.error(`── ${nom}\n${lignes}\n`));
}

const mauvais = echoues.length + plantes.length;
if (mauvais) {
  console.error(`\n✘ ${mauvais} contrôle(s) sur ${controles.length}, en ${total} s.\n`);
  process.exit(1);
}
console.log(`\n✔ Les ${controles.length} contrôles passent, en ${total} s.`);
console.log('  Restent à la main : `npx expo export` et les captures au navigateur.\n');
