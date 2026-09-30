/**
 * Photographie la carte de la zone d'intervention, aux deux endroits où
 * elle apparaît : la fiche publique d'un artisan (lecture seule) et
 * « Modifier mon profil » (avec le curseur).
 *
 *   npx expo start --web --port 8095     (dans un autre terminal)
 *   node scripts/captures-carte.mjs
 *
 * Ce que ça vérifie en plus de l'image : combien de tuiles sont demandées,
 * et si elles reviennent. Une carte grise et une carte juste se
 * ressemblent beaucoup sur une capture.
 *
 * LE PIÈGE DU CONTENEUR DE TRAVAIL — à ne pas redécouvrir
 * -------------------------------------------------------
 * Le navigateur de test n'a **aucun accès direct à l'extérieur** : tout
 * doit passer par le mandataire de l'agent, qui n'accepte que des tunnels
 * HTTPS. Deux conséquences vérifiées ici :
 *
 *   - sans rien faire, les tuiles de l'IGN ne partent jamais et la carte
 *     reste grise. Ça ressemble beaucoup à un bug du code : ce n'en est
 *     pas un, c'est le réseau du test ;
 *   - lancer Chromium AVEC le mandataire ne marche pas davantage : son
 *     option de contournement pour `localhost` est ignorée, et c'est alors
 *     le serveur Expo lui-même qu'on n'atteint plus.
 *
 * D'où la seule voie qui fonctionne : laisser le navigateur tranquille et
 * **intercepter les seules adresses de l'IGN**, qu'on va chercher avec
 * `curl` — lui sait se servir du mandataire. Sur le téléphone du
 * propriétaire, il n'y a rien de tout cela : l'image part directement.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync } from 'node:fs';

const PW = process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = await import('playwright').catch(() => import(PW).then((m) => m.default || m));
const execFileP = promisify(execFile);

const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.URL || 'http://localhost:8095';
const DOSSIER = 'captures/carte';
mkdirSync(DOSSIER, { recursive: true });

const navigateur = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await navigateur.newContext({ viewport: { width: 390, height: 900 } });
const page = await ctx.newPage();

const tuiles = { demandees: 0, rendues: 0, ratees: [] };
await page.route('**data.geopf.fr**', async (route) => {
  const url = route.request().url();
  tuiles.demandees += 1;
  /* Le mandataire du conteneur coupe environ une connexion sur cinq
     (« ws_closed_mid_exchange »). Vérifié en appelant la MÊME adresse cinq
     fois de suite : quatre 200, un échec. Sans ces essais répétés, une
     capture montrerait des carrés gris qu'on prendrait pour un défaut du
     code. Ce n'est pas le cas du téléphone, qui appelle l'IGN en direct. */
  for (let essai = 1; essai <= 4; essai += 1) {
    try {
      const { stdout } = await execFileP(
        'curl', ['-s', '--fail', '--max-time', '30', url],
        { encoding: 'buffer', maxBuffer: 8 * 1024 * 1024 },
      );
      tuiles.rendues += 1;
      await route.fulfill({ status: 200, contentType: 'image/png', body: stdout });
      return;
    } catch (e) { /* on retente */ }
  }
  tuiles.ratees.push(url.slice(-60));
  await route.abort();
});

async function photographier(nom) {
  const carte = page.locator('[aria-label^="Carte :"]').first();
  await carte.scrollIntoViewIfNeeded();
  await page.waitForTimeout(9000);
  console.log(`  étiquette : ${await carte.getAttribute('aria-label')}`);
  await page.screenshot({ path: `${DOSSIER}/${nom}.png` });
}

/* --- 1. La fiche publique, vue par un particulier --- */
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.getByText('JE SUIS UN PARTICULIER').click();
await page.waitForTimeout(1800);
await page.getByText('Découvrir', { exact: false }).first().click();
await page.waitForTimeout(1200);
const fiche = page.getByText('Profil', { exact: true }).first();
if (await fiche.count()) { await fiche.click(); await page.waitForTimeout(1500); }
console.log('fiche publique :');
await photographier('fiche-publique');

/* --- 2. « Modifier mon profil », côté professionnel --- */
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.getByText('JE SUIS UN PROFESSIONNEL').click();
await page.waitForTimeout(1800);
/* Les onglets du bas se visent à la position : le libellé du bouton
   central est vide, et un clic aux coordonnées est plus sûr. */
const { width, height } = page.viewportSize();
await page.mouse.click(width * 0.89, height - 30);
await page.waitForTimeout(1500);
await page.getByText('Modifier mon profil').first().click();
await page.waitForTimeout(1800);
console.log('modifier mon profil :');
await photographier('modifier-profil');

/* Le curseur bouge-t-il vraiment le cercle ? On le pousse et on reprend
   une photo : c'est la seule preuve que les deux sont liés. */
const curseur = page.locator('[aria-label^="Rayon d\'intervention"]').first();
if (await curseur.count()) {
  const boite = await curseur.boundingBox();
  if (boite) {
    await page.mouse.click(boite.x + boite.width * 0.72, boite.y + boite.height / 2);
    await page.waitForTimeout(3000);
    console.log('après déplacement du curseur :');
    await photographier('modifier-profil-rayon-change');
  }
}

console.log(`\ntuiles : ${tuiles.demandees} demandées, ${tuiles.rendues} rendues`);
if (tuiles.ratees.length) console.log(`✘ en échec : ${tuiles.ratees.slice(0, 3).join(', ')}`);

await ctx.close();
await navigateur.close();
console.log(`✔ captures dans ${DOSSIER}/`);
