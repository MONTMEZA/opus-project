/**
 * Photographie le sélecteur de métier, et mesure ce qui ne se voit pas.
 *
 *   npx expo start --web --port 8095     (dans un autre terminal)
 *   node scripts/captures-metiers.mjs
 *
 * CE QUI SE MESURE ICI, ET POURQUOI
 * ---------------------------------
 * Le processeur est bridé six fois pour imiter un téléphone : la machine de
 * test est bien plus rapide qu'un iPhone, et c'est exactement ce qui avait
 * laissé passer les 219 ms par lettre de l'assistant IA. Un champ de
 * recherche qui parcourt quatre-vingt-douze métiers ET leurs spécialités à
 * chaque touche, c'est le même piège — on le mesure donc, on ne le suppose
 * pas.
 */
const PW = process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = await import('playwright').catch(() => import(PW).then((m) => m.default || m));
import { mkdirSync } from 'node:fs';

const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.URL || 'http://localhost:8095';
const DOSSIER = 'captures/metiers';
mkdirSync(DOSSIER, { recursive: true });

const navigateur = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await navigateur.newContext({ viewport: { width: 390, height: 900 } });
const cdp = await ctx.newCDPSession(await ctx.newPage());
const page = ctx.pages()[0];
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.getByText('JE SUIS UN PROFESSIONNEL').click();
await page.waitForTimeout(2500);

/* UN CHIFFRE SEUL NE VEUT RIEN DIRE. `press()` lettre par lettre coûte
   plus cher que la frappe réelle : les millisecondes obtenues ici ne se
   comparent PAS à celles d'une autre session. Ce qui se compare, c'est le
   sélecteur contre un champ DÉJÀ EN SERVICE et jugé bon — la recherche de
   « Découvrir ». Les deux sont mesurés de la même façon, dans la même
   session, à quelques secondes d'intervalle. */
async function msParLettre(champSaisie, mot) {
  await champSaisie.click();
  const t0 = Date.now();
  for (const lettre of mot) {
    await champSaisie.press(lettre);
    await page.waitForTimeout(40);
  }
  const ms = (Date.now() - t0 - mot.length * 40) / mot.length;
  for (let i = 0; i < mot.length; i += 1) await champSaisie.press('Backspace');
  return ms;
}

const { width, height } = page.viewportSize();

/* La référence, d'abord : on la mesure pendant que rien n'est ouvert.
   Côté professionnel, le deuxième onglet est la PLACE DES PROS — pas
   « Découvrir », qui est l'écran du particulier. Son champ de recherche
   fait le même travail : lire chaque annonce, ignorer les accents,
   développer les synonymes de chantier. C'est la bonne référence. */
await page.mouse.click(width * 0.30, height - 30);
await page.waitForTimeout(1800);
const reference = page.locator('input[placeholder*="placo, nacelle"]').first();
if (await reference.count()) {
  const ms = await msParLettre(reference, 'plomb');
  console.log(`référence — recherche de la Place des pros : ${ms.toFixed(0)} ms par lettre`);
} else {
  console.log('référence : champ introuvable — le chiffre du sélecteur ne '
    + 'veut alors rien dire tout seul.');
}

/* Profil → Modifier mon profil → Métiers */
await page.mouse.click(width * 0.89, height - 30);
await page.waitForTimeout(1800);
await page.getByText('Modifier mon profil').first().click();
await page.waitForTimeout(2000);

const ajouter = page.locator('[aria-label^="Ajouter un métier"]').first();
await ajouter.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: `${DOSSIER}/1-mes-metiers.png` });

await ajouter.click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${DOSSIER}/2-selecteur-categories.png` });

/* Déplier une catégorie : celui qui ne sait pas quoi chercher. */
const cat = page.locator('[aria-label^="Bureaux d\'études"]').first();
if (await cat.count()) {
  await cat.click();
  await page.waitForTimeout(900);
  await cat.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DOSSIER}/3-categorie-depliee.png` });
}

/* Taper : le chemin de celui qui sait. On mesure la frappe.

   UN CHIFFRE SEUL NE VEUT RIEN DIRE. La façon de mesurer compte autant
   que ce qu'on mesure : `press()` lettre par lettre coûte plus cher que
   la frappe réelle, et les millisecondes obtenues ici ne se comparent
   donc PAS à celles d'une autre session. Ce qui se compare, c'est le
   sélecteur contre la recherche de « Découvrir », mesurée plus haut. */
const champ = page.locator('[aria-label="Rechercher un métier"]').first();
const parLettre = await msParLettre(champ, 'plomb');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${DOSSIER}/4-recherche-plomb.png` });
console.log(`frappe dans le sélecteur : ${parLettre.toFixed(0)} ms par lettre `
  + '(processeur bridé ×6)');

/* Chercher par SPÉCIALITÉ — le §13 de la demande. */
await champ.click();
for (const lettre of 'mur de souten') {
  await champ.press(lettre);
  await page.waitForTimeout(30);
}
await page.waitForTimeout(1500);
await page.screenshot({ path: `${DOSSIER}/5-recherche-specialite.png` });
const visible = await page.evaluate(() => document.body.innerText.includes('Maçon'));
console.log(`« mur de souten » fait apparaître Maçon : ${visible}`);

/* LA CLÉ NE DOIT JAMAIS S'AFFICHER. Une fiche enregistre `macon` ; si
   l'écran l'écrit tel quel, personne ne le signalera comme un bug — ça
   ressemble juste à une faute de frappe. On le cherche donc. */
const CLES = ['macon', 'electricien', 'plombier', 'carreleur', 'charpentier',
  'peintre-en-batiment', 'plaquiste', 'couvreur', 'serrurier', 'chauffagiste'];
let fuites = 0;
for (const [nom, x] of [['Découvrir', 0.30], ['Profil', 0.89], ['Accueil', 0.11]]) {
  await page.mouse.click(width * x, height - 30);
  await page.waitForTimeout(1600);
  const texte = await page.innerText('body');
  const vues = CLES.filter((c) => texte.includes(c));
  fuites += vues.length;
  console.log(`${nom} : ${vues.length ? `✘ clés affichées → ${vues.join(', ')}` : '✔ aucune clé'}`);
}
console.log(fuites ? `✘ ${fuites} clé(s) affichée(s) au lieu d'un nom`
  : '✔ nulle part une clé ne s’affiche à la place d’un nom');

await ctx.close();
await navigateur.close();
console.log(`✔ captures dans ${DOSSIER}/`);
