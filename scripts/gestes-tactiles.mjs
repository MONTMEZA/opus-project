/**
 * LES GESTES, POUR DE VRAI — en tactile synthétisé.
 *
 * CE QUE CE FICHIER CORRIGE DANS LA DOCTRINE DU PROJET
 * ----------------------------------------------------
 * CLAUDE.md affirmait depuis le lot 5 : « le défilement au doigt ne se
 * reproduit pas ici ; l'arbitrage entre un glissement horizontal et un
 * défilement vertical ne peut donc PAS être vérifié ». C'était écrit de la
 * SOURIS, et c'est vrai d'elle : sur ordinateur, une zone défilante répond
 * à la molette, pas au glissement.
 *
 * Mais le protocole de Chrome sait envoyer de VRAIS événements tactiles —
 * `Input.dispatchTouchEvent`, un `touchStart`, des `touchMove`, un
 * `touchEnd`. Mesuré le 04/10/2026 : le navigateur arbitre alors tout
 * seul, exactement comme un téléphone.
 *
 * Deux portes, et une seule marche :
 *
 *   - `Input.synthesizeScrollGesture` (le geste « tout fait », avec
 *     inertie) : **ne déplace rien**, vérifié ;
 *   - `Input.dispatchTouchEvent` posé à la main : **marche**.
 *
 * CE QUE ÇA NE PROUVE TOUJOURS PAS
 * --------------------------------
 * C'est Chromium et `react-native-web`, pas iOS. L'accrochage des pages y
 * est fait par le navigateur (`scroll-snap`), pas par la pagination d'iOS —
 * et c'est précisément cette différence-là qui a fait arriver « entre deux
 * pages » le 04/10. **Ce contrôle n'aurait donc PAS attrapé ce défaut.**
 *
 * Ce qu'il attrape, et qui n'était vérifié nulle part : QUEL geste gagne.
 * Un glissement vertical doit faire défiler la liste sans changer de page ;
 * un glissement horizontal doit changer de page sans faire défiler la
 * liste. C'est de la logique, pas du ressenti, et ça se mesure.
 *
 *   node scripts/gestes-tactiles.mjs          (serveur sur :8097, mode démo)
 */
const PORT = process.env.PORT || 8097;
const PW = '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = await import('playwright').catch(() => import(PW).then((m) => m.default || m));

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
};

const n = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const ctx = await n.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

/**
 * UN GLISSEMENT TACTILE. Les `touchMove` sont espacés dans le temps : un
 * geste instantané ne ressemble à rien et le navigateur l'ignore.
 */
const glisser = async (x, y, dx, dy, { pas = 14, ms = 16 } = {}) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= pas; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + (dx * i) / pas, y: y + (dy * i) / pas }],
    });
    await new Promise((r) => setTimeout(r, ms));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(2000);
};

const etat = () => page.evaluate(() => {
  const pager = [...document.querySelectorAll('div')]
    .find((e) => e.scrollWidth > e.clientWidth + 50 && e.clientWidth > 300);
  const onglet = [...document.querySelectorAll('[role="tab"]')]
    .find((x) => x.getAttribute('aria-selected') === 'true');
  const vertical = [...document.querySelectorAll('div')]
    .filter((e) => e.scrollHeight > e.clientHeight + 50 && e.clientHeight > 300)
    .map((e) => Math.round(e.scrollTop));
  /* Les petites zones qui défilent de côté : la rangée de filtres, les
     carrousels de photos. Ce sont elles qui peuvent voler le geste. */
  const petitesHorizontales = [...document.querySelectorAll('div')]
    .filter((e) => e.scrollWidth > e.clientWidth + 20 && e.clientWidth <= 300)
    .map((e) => Math.round(e.scrollLeft));
  return {
    x: pager ? Math.round(pager.scrollLeft) : null,
    largeur: pager ? pager.clientWidth : null,
    onglet: onglet ? onglet.innerText.trim() : '—',
    vertical,
    petitesHorizontales,
  };
});

await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
const pro = page.getByText('JE SUIS UN PROFESSIONNEL').first();
if (await pro.count()) { await pro.click(); await page.waitForTimeout(3500); }
await page.getByText('Découvrir', { exact: false }).first().click();
await page.waitForTimeout(3500);

console.log('\nLe tactile est bien actif');
verifier('le navigateur se déclare tactile',
  await page.evaluate(() => 'ontouchstart' in window));

console.log('\nLe glissement change de page, et tombe JUSTE');
{
  const depart = await etat();
  verifier(`on ouvre sur « Place des pros » (offset ${depart.x})`,
    depart.x === depart.largeur && depart.onglet === 'Place des pros');

  await glisser(300, 500, -250, 0);
  const a = await etat();
  verifier(`un doigt vers la gauche va à la page suivante (offset ${a.x})`,
    a.x === depart.largeur * 2, `attendu ${depart.largeur * 2}`);
  verifier('…et il tombe EXACTEMENT sur la page, pas entre deux',
    a.x % depart.largeur === 0, `reste ${a.x % depart.largeur} px`);
  verifier(`…et la pastille a suivi (« ${a.onglet} »)`, a.onglet === 'Demandes');
  verifier('…sans faire défiler la liste',
    JSON.stringify(a.vertical) === JSON.stringify(depart.vertical));

  await glisser(90, 500, 250, 0);
  const b = await etat();
  verifier(`un doigt vers la droite revient (offset ${b.x}, « ${b.onglet} »)`,
    b.x === depart.largeur && b.onglet === 'Place des pros');
}

console.log('\nL’ARBITRAGE — un geste vertical ne doit PAS changer de page');
{
  const avant = await etat();
  await glisser(195, 600, 0, -300);
  const apres = await etat();
  verifier('la page n’a pas bougé',
    apres.x === avant.x && apres.onglet === avant.onglet,
    `${avant.x} → ${apres.x}`);
  verifier(`la liste a bien défilé (${apres.vertical.join(', ')})`,
    JSON.stringify(apres.vertical) !== JSON.stringify(avant.vertical),
    'si elle ne bouge pas, c’est le geste qui n’est pas arrivé — pas une '
    + 'preuve que l’arbitrage est bon');
  /* On remet la liste en haut pour la suite. */
  await glisser(195, 400, 0, 400);
}

console.log('\nCE QUI VOLE LE GESTE — et c’était une affirmation NON vérifiée');
{
  /* Le 04/10, j'ai écrit à propos de ce lot : « un glissement qui démarre
     sur une zone qui défile déjà horizontalement déplace CETTE zone, pas la
     page ». C'était du raisonnement, pas une mesure. On la fait. */
  const cible = await page.evaluate(() => {
    const e = [...document.querySelectorAll('div')]
      .find((d) => d.scrollWidth > d.clientWidth + 20 && d.clientWidth <= 300);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) };
  });
  if (!cible) {
    console.log('  — aucune zone horizontale imbriquée visible, rien à mesurer');
  } else {
    const avant = await etat();
    await glisser(cible.x, cible.y, -120, 0, { pas: 10 });
    const apres = await etat();
    const pageBougee = apres.x !== avant.x;
    const zoneBougee = JSON.stringify(apres.petitesHorizontales)
      !== JSON.stringify(avant.petitesHorizontales);
    console.log(`  mesuré : la page ${pageBougee ? 'a' : 'n’a pas'} changé, `
      + `la zone imbriquée ${zoneBougee ? 'a' : 'n’a pas'} défilé`);
    verifier('un geste parti d’une zone imbriquée ne change PAS la page',
      !pageBougee,
      'c’est le comportement d’Instagram, et le seul possible : deux '
      + 'défilements du même axe ne peuvent pas répondre au même doigt');
  }
}

console.log('');
await ctx.close(); await n.close();
if (echecs) {
  console.error(`✘ ${echecs} vérification(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ Les gestes font ce qu’on attend d’eux — au NAVIGATEUR.');
console.log('  L’accrochage réel d’iOS, lui, ne se juge toujours que sur le téléphone.\n');
