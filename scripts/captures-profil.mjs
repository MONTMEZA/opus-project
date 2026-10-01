/**
 * Photographie la fiche d'un artisan, du haut vers le bas.
 *
 *   npx expo start --web --port 8095     (dans un autre terminal)
 *   node scripts/captures-profil.mjs
 *
 * CE QU'ON REGARDE
 * ----------------
 * L'ORDRE. Le 01/10/2026, le propriétaire a relevé que sa fiche disait
 * « Maçonnerie générale +2 » sans qu'on puisse dérouler, et que les
 * spécialités arrivaient quarante lignes plus bas, détachées de leur
 * métier. Ces captures servent à vérifier que ça ne revient pas.
 */
const PW = process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = await import('playwright').catch(() => import(PW).then((m) => m.default || m));
import { mkdirSync } from 'node:fs';

const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.URL || 'http://localhost:8095';
const DOSSIER = 'captures/profil';
mkdirSync(DOSSIER, { recursive: true });

const navigateur = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await navigateur.newContext({ viewport: { width: 390, height: 900 } });
const page = await ctx.newPage();

/* Les tuiles de l'IGN passent par curl : le navigateur du conteneur n'a
   pas d'accès direct à l'extérieur (voir scripts/captures-carte.mjs). */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);
await page.route('**data.geopf.fr**', async (route) => {
  for (let essai = 1; essai <= 4; essai += 1) {
    try {
      const { stdout } = await execFileP('curl',
        ['-s', '--fail', '--max-time', '30', route.request().url()],
        { encoding: 'buffer', maxBuffer: 8 * 1024 * 1024 });
      await route.fulfill({ status: 200, contentType: 'image/png', body: stdout });
      return;
    } catch (e) { /* on retente */ }
  }
  await route.abort();
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.getByText('JE SUIS UN PARTICULIER').click();
await page.waitForTimeout(2000);
await page.getByText('Découvrir', { exact: false }).first().click();
await page.waitForTimeout(1500);
const fiche = page.getByText('Profil', { exact: true }).first();
if (await fiche.count()) { await fiche.click(); await page.waitForTimeout(2500); }

await page.screenshot({ path: `${DOSSIER}/1-haut-de-fiche.png` });

const contact = page.getByText('Contact et déplacement').first();
if (await contact.count()) {
  await contact.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${DOSSIER}/2-contact.png` });
}

/* L'ORDRE est ce qui compte : on le relève, il ne se voit pas sur une
   capture coupée. */
const ordre = await page.evaluate(() => {
  const reperes = ['Métiers et spécialités', 'Informations vérifiées',
    'Contact et déplacement', 'Réalisations'];
  const t = document.body.innerText;
  return reperes.filter((r) => t.includes(r))
    .map((r) => [r, t.indexOf(r)])
    .sort((a, b) => a[1] - b[1])
    .map(([r]) => r);
});
console.log('ordre des sections :', ordre.join(' → '));

const texte = await page.innerText('body');
console.log(`« +2 » (ne doit plus y être) : ${/\+\d/.test(texte.split('Métiers')[0])}`);
console.log(`les quatre métiers visibles : ${['Maçonnerie générale', 'Carreleur', 'Façadier', 'Terrassier']
  .every((m) => texte.includes(m))}`);
console.log(`e-mail affiché : ${texte.includes('contact@belaid-maconnerie.fr')}`);

await ctx.close();
await navigateur.close();
console.log(`✔ captures dans ${DOSSIER}/`);
