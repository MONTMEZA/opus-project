/**
 * Photographie UN fil de commentaires, avant et après un changement de
 * design. Le script de captures général ne l'ouvre pas : il s'arrête aux
 * écrans, et une discussion se trouve dans un panneau qu'il faut déplier.
 *
 *   npx expo start --web --port 8095     (dans un autre terminal)
 *   node scripts/captures-commentaires.mjs <nom>   -> captures/commentaires/<nom>-*.png
 *
 * Le post de démonstration nº 1 porte un commentaire AVEC deux réponses :
 * c'est celui qui montre à la fois le filet des réponses et le bouton
 * « Modifier » absent sur une réponse à laquelle une autre a succédé.
 */
import { mkdirSync } from 'node:fs';
const PW = process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = await import('playwright').catch(() => import(PW).then((m) => m.default || m));

const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.URL || 'http://localhost:8095';
const nom = process.argv[2] || 'essai';
const DOSSIER = 'captures/commentaires';
mkdirSync(DOSSIER, { recursive: true });

const navigateur = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });

for (const { etiquette, width } of [{ etiquette: 'mobile', width: 390 }]) {
  const ctx = await navigateur.newContext({ viewport: { width, height: 1100 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  await page.getByText('JE SUIS UN PROFESSIONNEL').click();
  await page.waitForTimeout(1800);

  /* Le bouton des commentaires porte son libellé accessible : on le vise
     par là plutôt que par sa position, qui bougera au prochain design. */
  const bouton = page.locator('[aria-label^="Commentaires,"]').first();
  await bouton.click();
  await page.waitForTimeout(1200);

  const fil = page.getByText('Superbe avancée').first();
  await fil.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  /* Les réponses sont repliées dès qu'il y en a plus d'une : sans ce clic,
     la capture ne montrerait jamais le filet vertical. */
  const deplier = page.locator('[aria-label^="Voir les"]').first();
  if (await deplier.count()) {
    await deplier.click();
    await page.waitForTimeout(700);
    await fil.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  }

  await page.screenshot({
    path: `${DOSSIER}/${nom}-${etiquette}.png`,
    fullPage: false,
  });

  /* Ce qui se compte, en plus de ce qui se voit : combien de « Modifier »
     l'écran propose. Une réponse suivie d'une autre ne doit plus en avoir. */
  const compte = await page.evaluate(() => {
    const t = (s) => document.body.innerText.split(s).length - 1;
    return { modifier: t('Modifier'), supprimer: t('Supprimer'), repondre: t('Répondre') };
  });
  console.log(`${etiquette} : ${JSON.stringify(compte)}`);

  await ctx.close();
}

await navigateur.close();
console.log(`✔ captures dans ${DOSSIER}/`);
