/**
 * Photographie les écrans importants, toujours de la même façon.
 *
 * POURQUOI
 * Une amélioration visuelle sur un écran en casse souvent un autre, et
 * personne ne s'en aperçoit avant l'utilisateur. Ce script prend une photo de
 * chaque écran prioritaire ; on compare l'avant et l'après, et la différence
 * se voit. C'est l'instrument de mesure, à lancer AVANT de changer quoi que
 * ce soit.
 *
 * USAGE
 *   npx expo start --web --port 8095          (dans un autre terminal)
 *   node scripts/captures.mjs reference       -> captures/reference/
 *   ...on modifie le design...
 *   node scripts/captures.mjs apres           -> captures/apres/
 *   node scripts/captures.mjs --comparer      -> dit ce qui a bougé, et de combien
 *
 * Trois largeurs, parce qu'un téléphone n'est pas une tablette : 390 (mobile),
 * 768 (tablette), 1280 (ordinateur).
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.URL || 'http://localhost:8095';
const RACINE = 'captures';

const LARGEURS = [
  { nom: 'mobile', width: 390, height: 844 },
  { nom: 'tablette', width: 768, height: 1024 },
  { nom: 'ordinateur', width: 1280, height: 900 },
];

/** Les écrans prioritaires, et comment y arriver depuis l'accueil. */
const ECRANS = [
  { nom: '01-onboarding', chemin: [] },
  { nom: '02-fil', chemin: ['pro'] },
  { nom: '03-fil-video', chemin: ['pro', 'texte:Vidéos'] },
  { nom: '04-decouvrir', chemin: ['pro', 'onglet:decouvrir'] },
  { nom: '05-demandes', chemin: ['pro', 'onglet:decouvrir', 'texte:Demandes'] },
  { nom: '06-publier', chemin: ['pro', 'onglet:creer'] },
  { nom: '07-messages', chemin: ['pro', 'onglet:messages'] },
  { nom: '08-profil', chemin: ['pro', 'onglet:profil'] },
  { nom: '09-profil-modifier', chemin: ['pro', 'onglet:profil', 'texte:Modifier mon profil'] },
  { nom: '10-profil-artisan', chemin: ['particulier', 'onglet:decouvrir', 'texte:Profil'] },
  { nom: '11-sos', chemin: ['particulier', 'onglet:sos'] },
];

/* Les onglets du bas, repérés par leur position : leur libellé est parfois
   vide (le bouton central), un clic aux coordonnées est plus sûr. */
const ONGLETS = { home: 0.11, decouvrir: 0.30, creer: 0.50, sos: 0.50, messages: 0.69, profil: 0.89 };

async function aller(page, etapes, largeur) {
  for (const etape of etapes) {
    if (etape === 'pro') await page.getByText('JE SUIS UN PROFESSIONNEL').click();
    else if (etape === 'particulier') await page.getByText('JE SUIS UN PARTICULIER').click();
    else if (etape.startsWith('onglet:')) {
      const x = ONGLETS[etape.slice(7)] * largeur;
      const { height } = page.viewportSize();
      await page.mouse.click(x, height - 35);
    } else if (etape.startsWith('texte:')) {
      const cible = page.getByText(etape.slice(6)).first();
      if (await cible.count()) await cible.click();
    }
    await page.waitForTimeout(1800);
  }
}

const dossier = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'reference';

if (process.argv.includes('--comparer')) {
  const [a, b] = ['reference', 'apres'].map((d) => join(RACINE, d));
  if (!existsSync(a) || !existsSync(b)) {
    console.error(`Il faut ${a}/ et ${b}/. Lancez d'abord les deux captures.`);
    process.exit(1);
  }
  const fichiers = readdirSync(a).filter((f) => f.endsWith('.png'));
  let bouge = 0;
  console.log('\nÉcran                              avant      après      écart');
  for (const f of fichiers) {
    if (!existsSync(join(b, f))) { console.log(`  ${f.padEnd(34)} — manquant après —`); continue; }
    const t1 = readFileSync(join(a, f)).length;
    const t2 = readFileSync(join(b, f)).length;
    const ecart = t1 === t2 ? 0 : ((t2 - t1) / t1) * 100;
    if (ecart !== 0) bouge += 1;
    console.log(`  ${f.replace('.png', '').padEnd(34)} ${String(t1).padStart(8)} ${String(t2).padStart(10)}   ${ecart.toFixed(1).padStart(6)} %`);
  }
  console.log(`\n${bouge} écran(s) sur ${fichiers.length} ont changé.`);
  console.log('Un écart non nul signale un changement : ouvrez les deux images côte à côte.\n');
  process.exit(0);
}

mkdirSync(join(RACINE, dossier), { recursive: true });
const nav = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
console.log(`Captures vers ${RACINE}/${dossier}/\n`);

for (const taille of LARGEURS) {
  for (const ecran of ECRANS) {
    const ctx = await nav.newContext({
      viewport: { width: taille.width, height: taille.height },
      ignoreHTTPSErrors: true,
      reducedMotion: 'reduce',     // pour que deux captures soient comparables
    });
    const page = await ctx.newPage();
    try {
      await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
      await page.waitForTimeout(9000);
      await aller(page, ecran.chemin, taille.width);
      const nom = `${ecran.nom}-${taille.nom}.png`;
      await page.screenshot({ path: join(RACINE, dossier, nom), fullPage: true });
      console.log(`  ✔ ${nom}`);
    } catch (e) {
      console.log(`  ✘ ${ecran.nom}-${taille.nom} — ${String(e.message).slice(0, 70)}`);
    }
    await ctx.close();
  }
}
await nav.close();
console.log('\nTerminé.');
