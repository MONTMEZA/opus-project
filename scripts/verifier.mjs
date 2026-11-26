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
 *   npm run verifier -- --delai 5 un délai par contrôle de 5 s (pour l'éprouver)
 *
 * Ce qu'elle NE fait PAS : construire le paquet, ni ouvrir le navigateur.
 * Les deux prennent des minutes et demandent un réseau ; ils restent à la
 * main, et l'intégration continue s'en charge à chaque envoi. Ni jouer les
 * essais SQL : il leur faut un PostgreSQL, et cette commande doit passer
 * partout — c'est `npm run essais-sql`, à part (étape 2c-E).
 *
 * UN CONTRÔLE QUI BOUCLE — le délai, ajouté le 26/11/2026 (étape 2c-E)
 * ---------------------------------------------------------------------
 * Un contrôle qui ne finit jamais (une boucle, une attente réseau sans
 * fin) bloquait TOUS les suivants, et le coureur avec : rien ne rougissait,
 * l'écran restait figé. Chaque contrôle a donc un DÉLAI, au-delà duquel il
 * est arrêté et compté « N'A PAS PU SE LANCER » — il n'a rien vérifié.
 *
 * 300 secondes : le plus long d'aujourd'hui est `verifier-atelier`, 32,7 s
 * (le linter sur tout le dépôt, mesuré le 26/11), soit neuf fois sa durée.
 * Assez pour une machine plus lente, assez court pour qu'un blocage se voie.
 *
 * Et on arrête le GROUPE entier : `npm run` lance un shell qui lance `node`.
 * Tuer `npm` seul laisserait le petit-enfant tourner, en tenant les tuyaux
 * ouverts — et le coureur attendrait encore.
 */
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const bref = process.argv.includes('--bref');

const DELAI_PAR_DEFAUT_S = 300;
const iDelai = process.argv.indexOf('--delai');
const delaiS = iDelai >= 0 ? Number(process.argv[iDelai + 1]) : DELAI_PAR_DEFAUT_S;
if (!(delaiS > 0)) {
  console.error('--delai attend un nombre de secondes.');
  process.exit(2);
}

/* Le contrôle en cours, pour l'arrêter avec nous : lancé dans son propre
   groupe, il ne recevrait pas le Ctrl+C du terminal, et survivrait. */
let enCours = null;
const arreterGroupe = (enfant) => {
  try { process.kill(-enfant.pid, 'SIGKILL'); } catch { /* déjà parti */ }
};
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    if (enCours) arreterGroupe(enCours);
    process.exit(130);
  });
}

function lancer(nom) {
  return new Promise((fin) => {
    const enfant = spawn('npm', ['run', '--silent', nom], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    enCours = enfant;
    let stdout = '';
    let stderr = '';
    let depasse = false;
    enfant.stdout.setEncoding('utf8').on('data', (d) => { stdout += d; });
    enfant.stderr.setEncoding('utf8').on('data', (d) => { stderr += d; });
    const minuterie = setTimeout(() => { depasse = true; arreterGroupe(enfant); }, delaiS * 1000);
    enfant.on('error', (e) => { stderr += String(e); });
    enfant.on('close', (status) => {
      clearTimeout(minuterie);
      enCours = null;
      fin({ status, stdout, stderr, depasse });
    });
  });
}

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
  const r = await lancer(nom);
  const ms = Date.now() - t;
  const sortie = `${r.stdout || ''}${r.stderr || ''}`;

  /* Un contrôle arrêté par le délai n'a rien vérifié : même famille qu'un
     contrôle qui plante, et la phrase dit pourquoi. */
  if (r.depasse) {
    plantes.push([nom, `Il a dépassé le délai de ${delaiS} s et a été arrêté : un contrôle qui ne finit pas ne vérifie rien, `
      + 'et bloquait tous les suivants.\n' + sortie.trim().split('\n').slice(-4).join('\n')]);
    console.error(`  ⚠ ${nom.padEnd(22)} N'A PAS PU SE LANCER (arrêté au bout de ${delaiS} s)`);
    continue;
  }

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
