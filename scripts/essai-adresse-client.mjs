/**
 * L'ADRESSE D'UN CLIENT SE PROPOSE — vérifié sur la VRAIE base.
 *
 *   npx expo start --web --port 8097     (dans un autre terminal)
 *   node scripts/essai-adresse-client.mjs
 *
 * CE QUI SE VÉRIFIE ICI, ET CE QUI NE S'Y VÉRIFIE PAS
 * --------------------------------------------------
 * Ici : que les suggestions arrivent, qu'un appui remplit les TROIS cases
 * (la rue, le code postal, la ville), que la ligne enregistrée en base est
 * bien celle-là, et que la cible d'une suggestion se touche au doigt.
 *
 * PAS ici : le clavier. `react-native-web` n'en rend aucun, et
 * `automaticallyAdjustKeyboardInsets` est jetée par liste blanche. Ce que
 * le navigateur peut dire de ce lot-là, c'est seulement que le remaniement
 * n'a rien cassé — le reste se juge sur l'iPhone.
 *
 * DEUX RELAIS SUR LA MÊME PAGE, et il les faut tous les deux : Supabase
 * pour la base, et la Base Adresse Nationale pour les suggestions. Sans le
 * second, le champ tourne indéfiniment et ça ressemble beaucoup à un
 * défaut du code.
 *
 * ET LA PRUDENCE : c'est la base du propriétaire. Le compte créé ici est
 * supprimé par le CHEMIN DE L'APPLICATION à la fin, dans la même session.
 */
import { mkdirSync } from 'node:fs';
import { poserRelais, adresseEssai } from './relais-supabase.mjs';

const PW = process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.js';
const pw = await import('playwright').catch(() => import(PW));
const { chromium } = pw.default || pw;

const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.URL || 'http://localhost:8097';
const HOTE = 'lqzqdoiiqgqapqldrewg.supabase.co';
const BAN = 'api-adresse.data.gouv.fr';
const DOSSIER = 'captures/adresse-client';
mkdirSync(DOSSIER, { recursive: true });

/* Le compte est créé par `/auth/v1/signup` avant ce script — voir le
   compte rendu du lot. Son adresse est passée par l'environnement pour
   qu'il n'y en ait qu'UNE, et qu'elle soit supprimée à la fin. */
const mail = process.env.COMPTE || adresseEssai('adresse');
const MDP = 'EssaiOpus!2026';
let echecs = 0;
const dire = (nom, ok, detail = '') => {
  if (!ok) echecs += 1;
  console.log(`${ok ? '  OK  ' : 'ECHEC '} ${nom}${detail ? ` — ${detail}` : ''}`);
};

const navigateur = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await navigateur.newContext({ viewport: { width: 390, height: 900 } });
const page = await ctx.newPage();

const appels = [];
await poserRelais(page, { hote: HOTE, onAppel: (a) => appels.push(a) });
const appelsBan = [];
/* SIX ESSAIS, ET PAS TROIS : le mandataire du conteneur coupe environ une
   connexion sur cinq, et une suggestion d'adresse qui n'arrive pas fait
   échouer ce contrôle pour une raison qui n'est pas le code. */
await poserRelais(page, { hote: BAN, essais: 6, onAppel: (a) => appelsBan.push(a) });

page.on('console', (m) => {
  if (m.type() === 'error' && !/favicon|readyState|play\(\)/.test(m.text())) {
    console.log('    [console]', m.text().slice(0, 160));
  }
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);

/* ------------------------------------------------------------------ */
console.log('\n1. UN COMPTE PROFESSIONNEL JETABLE');

/* ON NE PILOTE PLUS LE FORMULAIRE D'INSCRIPTION, ET C'EST UNE LEÇON DE
   MÉTHODE : le compte entier — la ligne `users` ET la fiche pro — naît
   d'un seul appel à `/auth/v1/signup`, c'est le lot du 05/10 qui l'a
   obtenu. Piloter neuf champs, un sélecteur de métier plein écran et une
   liste de suggestions pour arriver au même état, c'est trois points de
   casse pour éprouver quelque chose qui n'a rien à voir. Le compte est
   donc créé AVANT le navigateur, et ici on se CONNECTE. */
await page.getByText('JE SUIS UN PROFESSIONNEL').click();
await page.waitForTimeout(2000);
await page.getByText('Se connecter', { exact: true }).first().click();
await page.waitForTimeout(1200);
await page.locator('input[placeholder*="exemple.fr"]').first().fill(mail);
await page.locator('input[type="password"]').first().fill(MDP);
await page.screenshot({ path: `${DOSSIER}/0-connexion.png` });
await page.getByRole('button', { name: /Se connecter/i }).last().click();
await page.waitForTimeout(9000);

const plusTard = page.getByText('Plus tard', { exact: true }).first();
if (await plusTard.count()) { await plusTard.click(); await page.waitForTimeout(1200); }

const connecte = await page.getByText('JE SUIS UN PROFESSIONNEL').count() === 0;
dire('le compte est créé et connecté', connecte, mail);
if (!connecte) {
  await page.screenshot({ path: `${DOSSIER}/echec-inscription.png` });
  await navigateur.close();
  process.exit(1);
}

/* ------------------------------------------------------------------ */
console.log('\n2. LE CARNET, PUIS LE FORMULAIRE');

const { width, height } = page.viewportSize();
await page.mouse.click(width * 0.9, height - 30);          // onglet Profil
await page.waitForTimeout(2500);
await page.getByText('Mes clients', { exact: true }).first().click();
await page.waitForTimeout(2000);
await page.getByRole('button', { name: /Nouveau/i }).first().click();
await page.waitForTimeout(1500);
dire('le formulaire est ouvert', await page.getByText('Nouveau client').count() > 0);

/* UN NOM UNIQUE PAR PASSAGE. Les cinq premiers essais ont laissé cinq
   « Essai Suggestion » dans le carnet, et `getByText(...).first()` ouvrait
   la fiche du PREMIER — celle d'un essai où la suggestion n'était jamais
   arrivée. Mon contrôle accusait donc le code d'avoir enregistré le texte
   tapé, alors qu'il relisait une autre fiche. Un essai qui échoue pour la
   mauvaise raison ne vaut pas mieux qu'un essai qui passe pour la
   mauvaise raison. */
const nomClient = `Essai Suggestion ${Date.now().toString().slice(-5)}`;
await page.locator('input[placeholder*="Mme Martin"]').first().fill(nomClient);
await page.waitForTimeout(300);

/* ------------------------------------------------------------------ */
console.log('\n3. L’ADRESSE PROPOSE — et on choisit');

const avant = appelsBan.length;
const champAdresse = page.locator('input[placeholder*="rue des Lilas"]').first();
await champAdresse.click();
await champAdresse.type('4 rue des acacias charl', { delay: 60 });

/* ON ATTEND LA CHOSE, PAS UN DÉLAI. Mesuré : à travers le mandataire du
   conteneur, le relais met parfois plus de quatre secondes à rendre la
   réponse de la Base Adresse — alors qu'elle répond 200. Un
   `waitForTimeout(2500)` concluait donc « aucune suggestion » sur un
   chemin qui marchait. Sur un téléphone, c'est quelques centaines de
   millisecondes : la lenteur est celle du mandataire, pas celle du code. */
const suggestions = page.locator('text=/13350 Charleval/');
await suggestions.first().waitFor({ timeout: 40000 }).catch(() => {});

dire('la Base Adresse a été interrogée', appelsBan.length > avant,
  `${appelsBan.length - avant} appel(s), statuts ${appelsBan.slice(avant).map((a) => a.statut).join(' ')}`);

const nb = await suggestions.count();
dire('des suggestions s’affichent', nb > 0, `${nb} ligne(s) à Charleval`);
await page.screenshot({ path: `${DOSSIER}/1-suggestions.png` });

if (nb > 0) {
  /* LA CIBLE SE TOUCHE AU DOIGT ? 44 points, la mesure d'Apple (lot 5). */
  const ligne = suggestions.first();
  /* MESURER LA RANGÉE, PAS LE TEXTE. Le premier jet remontait jusqu'à un
     ancêtre portant `role="button"` — `react-native-web` n'en pose aucun
     sur un `Pressable`, donc la boucle montait jusqu'à `null` et je
     mesurais le bloc de texte : 315 × 16. On remonte donc jusqu'à ce que
     la boîte ait une hauteur de rangée. Un essai qui échoue pour la
     mauvaise raison ne dit rien de plus qu'un essai qui passe pour la
     mauvaise raison. */
  const boite = await ligne.evaluate((el) => {
    /* LA RANGÉE SE RECONNAÎT À SA FORME : un filet en bas, et ses deux
       textes côte à côte de l'icône (`flexDirection: row`). Un seuil de
       hauteur ne suffit pas — la boîte intermédiaire des deux lignes de
       texte en fait 31, et mon premier jet s'y arrêtait en annonçant une
       cible trop petite sur une rangée qui en fait 50. */
    let n = el;
    for (let i = 0; i < 7 && n; i += 1) {
      const cs = getComputedStyle(n);
      if (cs.borderBottomWidth === '1px' && cs.flexDirection === 'row') break;
      n = n.parentElement;
    }
    const r = (n || el).getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  dire('…et la rangée se touche au doigt', boite.h >= 44, `${boite.w} × ${boite.h}`);

  await ligne.click();
  await page.waitForTimeout(1200);
}

const lire = async (motif) => page.locator(`input[placeholder*="${motif}"]`).first().inputValue();
const rue = await lire('rue des Lilas');
const cp = await lire('13350');
const ville = await lire('Charleval');
console.log(`    rue « ${rue} » · code postal « ${cp} » · ville « ${ville} »`);
dire('la RUE est posée, sans le code postal ni la ville',
  /Acacias/i.test(rue) && !/13350/.test(rue) && !/Charleval/.test(rue),
  'sinon l’adresse s’imprimerait deux fois sur une facture');
dire('…le CODE POSTAL est rempli', cp === '13350');
dire('…et la VILLE aussi', ville === 'Charleval');
await page.screenshot({ path: `${DOSSIER}/2-trois-cases.png` });

/* ------------------------------------------------------------------ */
console.log('\n4. ENREGISTRÉ POUR DE VRAI, ET RELU APRÈS RECHARGEMENT');

const avantPost = appels.filter((a) => a.chemin.includes('/clients')).length;
await page.getByRole('button', { name: /Ajouter ce client/i }).first().click();
await page.waitForTimeout(4000);
const posts = appels.filter((a) => a.chemin.includes('/clients') && a.methode === 'POST');
dire('la ligne part vers la base', posts.length > avantPost || posts.length > 0,
  posts.map((a) => `${a.methode} ${a.statut}`).join(', ') || 'aucun appel');

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
const plusTard2 = page.getByText('Plus tard', { exact: true }).first();
if (await plusTard2.count()) { await plusTard2.click(); await page.waitForTimeout(1000); }
await page.mouse.click(width * 0.9, height - 30);
await page.waitForTimeout(2500);
const versCarnet = page.getByText('Mes clients', { exact: true }).first();
if (await versCarnet.count()) { await versCarnet.click(); await page.waitForTimeout(2500); }

const carte = await page.getByText(nomClient).count();
dire('après rechargement complet, la fiche est là', carte > 0);
await page.screenshot({ path: `${DOSSIER}/3-apres-rechargement.png` });

/* LA CARTE DU CARNET N'AFFICHE PAS LA RUE — relevé dans `CarteClient` :
   elle montre le nom, le téléphone et « ville · code postal ». Chercher
   « Acacias » dans la liste, c'était donc chercher ce qui n'y est pas, et
   mon essai accusait du code juste. L'adresse se lit dans la FICHE. */
if (carte > 0) {
  await page.getByText(nomClient).first().click();
  await page.waitForTimeout(2500);
  const rueRelue = await lire('rue des Lilas');
  const cpRelu = await lire('13350');
  const villeRelue = await lire('Charleval');
  console.log(`    relu en base : « ${rueRelue} » · « ${cpRelu} » · « ${villeRelue} »`);
  dire('…et les trois cases viennent bien de la base',
    /Acacias/i.test(rueRelue) && cpRelu === '13350' && villeRelue === 'Charleval',
    'donc ce n’est pas la mémoire du navigateur qui les affichait');
  await page.screenshot({ path: `${DOSSIER}/4-fiche-relue.png` });
}

/* ------------------------------------------------------------------ */
console.log('\n5. ET ON SUPPRIME DERRIÈRE SOI');
console.log(`    compte à retirer : ${mail}`);

await navigateur.close();
console.log(echecs === 0 ? '\nTout est bon.' : `\n${echecs} vérification(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
