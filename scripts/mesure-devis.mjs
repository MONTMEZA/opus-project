/**
 * LA SAISIE D'UN DEVIS, MESURÉE AU NAVIGATEUR — lot 1 du module devis
 * (cahier du lot 1, §6.1-G et §7.3).
 *
 * POURQUOI UN SCRIPT, ET POURQUOI HORS DE `npm run verifier`
 * ----------------------------------------------------------
 * `verifier-cibles` lit la hauteur DÉCLARÉE de quelques briques ; aucun
 * contrôle ne mesurait un écran. Les « boîtes mesurées » des lots
 * précédents l'ont été à la main, dans un dossier de travail : le lot 2
 * retouchera cet écran, la mesure doit pouvoir se REJOUER. Elle demande un
 * serveur (`npx expo start --web`), d'où sa place à côté de
 * `gestes-tactiles`, et pas dans `npm run verifier`.
 *
 *   npx expo start --web -c --port 8097      (sans .env : la démonstration)
 *   npm run mesure-devis                     (ou : node scripts/mesure-devis.mjs --captures <dossier>)
 *
 * Il sort en code 1 dès qu'une mesure est fausse — c'est le code de sortie
 * qu'on lit, jamais le texte (la leçon de `verifier-montage`). Une mesure
 * qui n'a pas pu se faire (une cible introuvable) est un échec, pas un
 * silence.
 *
 * CE QU'IL MESURE, ET PAS SEULEMENT CE QU'IL REGARDE
 * --------------------------------------------------
 *   - la BOÎTE RÉELLE de chaque cible des écrans du devis : 44 points au
 *     moins, en hauteur ET en largeur. Une seule exception NOMMÉE : le
 *     `BtnMini` « Faire un devis » de « Pour moi » (36 de boîte), pour que
 *     sa rangée reste d'une hauteur avec « Ajouter à mes clients » (§4.7).
 *     La barre du haut, la barre du bas et le bandeau de démonstration ne
 *     sont pas des écrans du devis : ils sont relevés, pas jugés ;
 *   - les sept pastilles d'unité sur DEUX rangées à 390 points ;
 *   - le total affiché égal, au centime, à celui que `devis.js` calcule sur
 *     les MÊMES lignes — un modèle tenu ici, à qui l'on fait subir chaque
 *     geste fait à l'écran : un poste, une pièce, une zone, une réserve,
 *     une option, deux taux, un « Offert », la main-d'œuvre, la fourniture
 *     non comprise ;
 *   - `font-variant-numeric` CALCULÉ sur chaque montant (`tabular-nums`) ;
 *   - la position de la liste, identique avant l'ouverture d'une carte et
 *     après sa fermeture ;
 *   - le compte des appuis de la « deuxième chape » (≤ 2 avec la mémoire),
 *     et la main qui passe à la quantité ;
 *   - la garde de sortie : une carte incomplète, un appui sur la barre du
 *     bas — la bande apparaît, l'écran ne part pas ;
 *   - « Non enregistrée — Réessayer » : voir plus bas, ce qu'on simule ;
 *   - le régime de TVA : réel, puis franchise, puis réel, sans recharger ;
 *   - « Faire un devis » depuis une demande acceptée, depuis une urgence,
 *     depuis la fiche d'un client ; « Reprendre » ; « Pour qui ? » ;
 *   - aucun défilement horizontal à 320 de large, et le chrome fixe
 *     (barre du haut + barre du bas + pied) ≤ 202 points à 375 × 667.
 *
 * LES GESTES SONT DE VRAIS ÉVÉNEMENTS TACTILES (`Input.dispatchTouchEvent`,
 * comme `gestes-tactiles.mjs`) : un appui sur une pastille, une rangée,
 * « Poste suivant », une suggestion ; un glissement de la liste. Et chaque
 * appui vérifie que le doigt tombe bien SUR la cible (`elementFromPoint`) :
 * une cible recouverte est un défaut, pas un détail.
 *
 * UN PIÈGE DE `react-native-web`, MESURÉ (22/10/2026) : son `ScrollView`
 * traite `keyboardDismissMode="on-drag"` en appelant `dismissKeyboard()` à
 * la fin de TOUT défilement — une minuterie de 100 ms après le dernier
 * événement `scroll`, programmatique compris (pile relevée : `blur` ←
 * `blurTextInput` ← `dismissKeyboard` ← `_handleScroll` ← `handleScrollEnd`).
 * Un champ qui prend le focus juste après un défilement le reperd. iOS ne
 * ferme le clavier qu'au DÉBUT d'un glissement du doigt : ce n'est pas un
 * défaut d'Opus, et ce script le DISTINGUE — il relève chaque `blur()` et
 * sa cause, et un appui attend la fin d'un défilement qu'il a provoqué.
 *
 * « NON ENREGISTRÉE » EN DÉMONSTRATION, ET CE QUI EST SIMULÉ
 * ---------------------------------------------------------
 * En démonstration, il n'y a AUCUNE route réseau à couper : la base des
 * devis vit en mémoire (`src/data/devis-demo.js`), et une écriture y prend
 * `PAUSE_ECRITURE_DEMO` (300 ms, `api.js`). On simule donc l'écriture qui
 * ne revient jamais — le cas d'un réseau de chantier — en ALLONGEANT cette
 * pause au-delà du délai de la file (`DELAI_ECRITURE`, 8 s) : seule la
 * minuterie appelée depuis l'écrivain de démonstration est allongée, et
 * seulement pendant la mesure. La file annule, la rangée dit « Non
 * enregistrée — Réessayer », et « Réessayer » repart par le même chemin.
 * Ce n'est PAS PostgreSQL : sur la vraie base, la coupure se fait par
 * `page.route` (étape 9 du lot).
 *
 * CE QU'IL NE PEUT PAS DIRE
 * -------------------------
 * C'est Chromium et `react-native-web`, pas un iPhone : ni le clavier (et
 * donc ni le pied caché pendant la frappe, ni la virgule du pavé décimal),
 * ni le pouce, ni les chiffres tabulaires rendus par iOS, ni
 * `automaticallyAdjustKeyboardInsets` (que `react-native-web` jette). Et
 * trois des cinq états du régime de TVA ne se produisent pas en
 * démonstration : « en lecture » (la lecture y est immédiate), « échec »
 * (elle ne peut pas y échouer) et « non déclaré » (le compte de
 * démonstration a un régime, et l'on ne peut pas en « décocher » un).
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { fabriquerDevisDemo, DEVIS_DEMO_IDS } from '../src/data/devis-demo.js';
import {
  totauxDevis, sousTotaux, totalLigne, validerLigne, trierLignes, UNITES,
  MENTION_FRANCHISE, PHRASE_RETENUE, DELAI_PAR_DEFAUT, avertissementDelai, coherenceRegime, tauxLisible,
} from '../src/lib/devis.js';
import { centimesLisibles } from '../src/lib/centimes.js';
import { messageDeContrainte } from '../src/lib/erreurs.js';
import { DELAI_ECRITURE } from '../src/lib/file-ecriture.js';
import { initialDemandesRecues } from '../src/data/demo.js';

const PORT = process.env.PORT || 8097;
const PW = '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = await import('playwright').catch(() => import(PW).then((m) => m.default || m));

const iCaptures = process.argv.indexOf('--captures');
const DOSSIER = iCaptures > 0 ? process.argv[iCaptures + 1] : null;
if (DOSSIER) mkdirSync(DOSSIER, { recursive: true });

const TOUCHE = 44;
/* L'exception NOMMÉE (cahier §4.7, §6.1-G) : le libellé parlé du `BtnMini`
   de « Pour moi ». Aucune autre. */
const EXCEPTIONS = [/^Faire un devis pour la demande de /];

/* La pause de la base de démonstration, LUE dans `api.js` : si elle change,
   la simulation suit — et si elle disparaît, la mesure le dit. */
const PAUSE_DEMO = Number((readFileSync('src/lib/api.js', 'utf8').match(/const PAUSE_ECRITURE_DEMO = (\d+);/) || [])[1]);

let echecs = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { console.log(`  ✔ ${nom}`); return true; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${detail}` : ''}`);
  return false;
};
const noter = (k, v) => { console.log(`    · ${k} : ${v}`); };
const net = (t) => String(t || '').replace(/[  ]/g, ' ');
const euros = (c) => (c == null ? '—' : net(centimesLisibles(c)));

/* ======================================================================== */
/*  LE MODÈLE : les lignes du premier devis de démonstration, telles que     */
/*  `devis.js` les calcule. Chaque geste fait à l'écran lui est fait aussi. */
/* ======================================================================== */
const jeu = fabriquerDevisDemo(new Date());
const RENOVATION = jeu.devis.find((d) => d.id === DEVIS_DEMO_IDS.renovation);
const SEJOUR = jeu.devis.find((d) => d.id === DEVIS_DEMO_IDS.sejour);
const modele = trierLignes(jeu.lignes.filter((l) => l.devisId === RENOVATION.id)).map((l) => ({ ...l }));
const ligneDe = (debut) => modele.find((l) => (l.designation || '').startsWith(debut));
const totaux = () => totauxDevis(modele);
const ttcSejour = totauxDevis(jeu.lignes.filter((l) => l.devisId === SEJOUR.id)).ttc;
const TITRES = () => modele.filter((l) => l.type === 'zone' || l.type === 'piece').map((l) => l.designation);
/* Le taux qu'une ligne neuve REPREND au régime réel : celui de la dernière
   ligne DU MÊME TYPE d'ordre inférieur — un poste reprend un poste, une
   option une option : la règle de `tauxPour()` dans la saisie depuis la
   relecture « écran » des étapes 4 à 7 (B7). */
const tauxRepris = (ordre, type = 'poste') => {
  const avant = trierLignes(modele).filter((l) => l.type === type && Number(l.ordre) <= ordre);
  return avant.length ? avant[avant.length - 1].tauxTvaCentiemes : null;
};
const DEMANDE = initialDemandesRecues.find((d) => d.genre === 'devis');
const URGENCE = initialDemandesRecues.find((d) => d.genre === 'sos');

/* ======================================================================== */
const n = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const ctx = await n.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(({ pause }) => {
  /* LA SIMULATION DE L'ÉCRITURE QUI NE REVIENT PAS : seule la minuterie de
     `pause` millisecondes appelée depuis l'écrivain de démonstration
     (`ecrire`) est allongée, et seulement quand on le demande. */
  const origine = window.setTimeout.bind(window);
  window.__opusSuspendreEcritures = false;
  window.setTimeout = (f, ms, ...reste) => {
    if (window.__opusSuspendreEcritures && ms === pause && /\becrire\b/.test(String(new Error().stack))) {
      return origine(f, 60000, ...reste);
    }
    return origine(f, ms, ...reste);
  };
  /* CHAQUE PERTE DE FOCUS, ET SA CAUSE : un `blur()` venu du
     `dismissKeyboard` de react-native-web (la fin d'un défilement) n'est
     pas un défaut d'Opus ; un autre, si. */
  window.__opusBlurs = [];
  window.__opusFocus = [];
  const blur = HTMLElement.prototype.blur;
  HTMLElement.prototype.blur = function blurTrace() {
    const pile = String(new Error().stack);
    window.__opusBlurs.push({ qui: this.getAttribute('aria-label') || this.tagName, rnw: /dismissKeyboard/.test(pile) });
    return blur.call(this);
  };
  document.addEventListener('focusin', (e) => {
    window.__opusFocus.push(e.target.getAttribute ? (e.target.getAttribute('aria-label') || e.target.tagName) : '?');
  }, true);
  window.__opusMarqueur = 'page jamais rechargée';
}, { pause: PAUSE_DEMO });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const erreursPage = [];
page.on('pageerror', (e) => erreursPage.push(`pageerror : ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erreursPage.push(`console : ${m.text().slice(0, 300)}`); });

const attendre = (ms) => page.waitForTimeout(ms);
const capture = async (nom) => { if (DOSSIER) await page.screenshot({ path: `${DOSSIER}/${nom}.png` }); };
const texte = async () => net(await page.evaluate(() => document.body.innerText));

/** Attendre qu'une condition (évaluée côté Node) devienne vraie. */
const jusqua = async (f, ms = 6000, pas = 150) => {
  const fin = Date.now() + ms;
  for (;;) {
    const v = await f();
    if (v || Date.now() > fin) return v;
    await attendre(pas);
  }
};

/* --- LE DOIGT --------------------------------------------------------- */
const nomDe = async (loc) => loc.evaluate((e) => (e.getAttribute('aria-label') || e.innerText || '').slice(0, 50)).catch(() => '?');
let appuis = 0;
/** Un appui tactile au centre de la cible, après avoir vérifié qu'elle est
 *  bien SOUS le doigt. */
const toucher = async (cible) => {
  const loc = typeof cible === 'string' ? page.getByText(cible, { exact: true }).first() : cible;
  const avant = await loc.boundingBox({ timeout: 8000 }).catch(() => null);
  await loc.scrollIntoViewIfNeeded({ timeout: 8000 });
  const apres0 = await loc.boundingBox();
  /* Un défilement vient d'avoir lieu : on laisse passer la fin de défilement
     de react-native-web (100 ms), qui ferait perdre le focus au champ que
     cet appui va peut-être ouvrir. */
  if (!avant || !apres0 || Math.abs(avant.y - apres0.y) > 1) await attendre(400);
  /* Une animation, une bande qui arrive : quatre secondes au plus pour que
     la cible soit SOUS le doigt — au-delà, elle est recouverte. */
  let x;
  let y;
  let sous = null;
  const fin = Date.now() + 4000;
  for (;;) {
    const b = await loc.boundingBox();
    if (!b) throw new Error(`cible introuvable : ${typeof cible === 'string' ? cible : await nomDe(loc)}`);
    x = b.x + b.width / 2;
    y = b.y + b.height / 2;
    sous = await loc.evaluate((e, p) => {
      const t = document.elementFromPoint(p.x, p.y);
      if (!t) return 'rien';
      return (e === t || e.contains(t) || t.contains(e)) ? null
        : `${t.tagName} « ${(t.getAttribute('aria-label') || t.innerText || '').slice(0, 40)} »`;
    }, { x, y });
    if (!sous || Date.now() > fin) break;
    await attendre(200);
  }
  if (sous) throw new Error(`le doigt ne tombe pas sur « ${typeof cible === 'string' ? cible : await nomDe(loc)} » : elle est recouverte par ${sous}`);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await new Promise((r) => { setTimeout(r, 40); });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  appuis += 1;
  await attendre(400);
};
/** Un glissement tactile, des `touchMove` espacés dans le temps. */
const glisser = async (x, y, dx, dy, { pas = 14, ms = 16 } = {}) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= pas; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / pas, y: y + (dy * i) / pas }] });
    await new Promise((r) => { setTimeout(r, ms); });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await attendre(900);
};
const parLibelle = (l, exact = true) => page.getByLabel(l, { exact }).first();
const bouton = (nom) => page.getByRole('button', { name: nom, exact: typeof nom === 'string' }).first();
const taper = async (t) => { await page.keyboard.type(t, { delay: 30 }); };
const viderEtTaper = async (loc, t) => {
  await toucher(loc);
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  if (t) await taper(t);
};

/* --- CE QUE L'ÉCRAN MONTRE ------------------------------------------- */
/** Les cibles visibles, avec leur boîte et si elles sont dans le « chrome »
 *  (barre du haut, barre du bas, bandeau de démonstration). */
const cibles = () => page.evaluate(() => {
  const SEL = '[role="button"],[role="switch"],[role="tab"],[role="link"],[role="checkbox"],[role="radio"],button,a[href],input,textarea,select';
  const vw = window.innerWidth;
  const conteneurPleineLargeur = (e, hmax) => {
    let c = e;
    while (c && c.parentElement) {
      const b = c.getBoundingClientRect();
      if (b.width >= vw - 1 && b.height <= hmax) return c;
      c = c.parentElement;
    }
    return null;
  };
  const retour = document.querySelector('[aria-label="Revenir en arrière"]');
  /* La carte d'une ligne, quand elle est ouverte : posée au-dessus de la
     liste, qui reste montée dessous (et donc mesurable, mais recouverte). */
  let carte = document.querySelector('[aria-label="Enregistrer cette ligne et revenir au devis"]');
  while (carte && carte.parentElement && getComputedStyle(carte).position !== 'absolute') carte = carte.parentElement;
  const chrome = [
    retour ? conteneurPleineLargeur(retour, 120) : null,
    document.querySelector('[role="tablist"]'),
    document.querySelector('[role="alert"]'),
  ].filter(Boolean);
  return [...document.querySelectorAll(SEL)].map((e) => {
    const b = e.getBoundingClientRect();
    const st = getComputedStyle(e);
    return {
      libelle: (e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 70),
      l: Math.round(b.width * 10) / 10,
      h: Math.round(b.height * 10) / 10,
      visible: b.width > 0 && b.height > 0 && st.visibility !== 'hidden' && st.display !== 'none',
      chrome: chrome.some((c) => c.contains(e)),
      dansCarte: !!carte && carte.contains(e),
    };
  }).filter((c) => c.visible);
});
/** Juge les cibles hors chrome ; `garder` restreint aux cibles d'un écran du
 *  devis quand d'autres écrans sont montés en dessous (une fenêtre). */
const jugerCibles = async (ou, garder = null) => {
  const toutes = await cibles();
  const jugees = toutes.filter((c) => !c.chrome && (!garder || garder(c)));
  const petites = jugees.filter((c) => (c.h < TOUCHE - 0.5 || c.l < TOUCHE - 0.5)
    && !EXCEPTIONS.some((r) => r.test(c.libelle)));
  const nommees = jugees.filter((c) => EXCEPTIONS.some((r) => r.test(c.libelle)));
  const plusPetite = jugees.filter((c) => !EXCEPTIONS.some((r) => r.test(c.libelle)))
    .reduce((m, c) => Math.min(m, c.h, c.l), Infinity);
  verifier(`${ou} : ${jugees.length} cible(s), toutes à ${TOUCHE} points au moins par leur BOÎTE hors exception nommée (la plus petite : ${Number.isFinite(plusPetite) ? plusPetite : '—'})`,
    jugees.length > 0 && petites.length === 0,
    petites.map((c) => `« ${c.libelle} » ${c.l} × ${c.h}`).join(' | '));
  nommees.forEach((c) => noter(`${ou} — exception nommée « ${c.libelle} »`, `${c.l} × ${c.h}`));
};

/** Les montants affichés et leur `font-variant-numeric` CALCULÉ. */
const montants = () => page.evaluate(() => [...document.querySelectorAll('div[dir="auto"],span')]
  .filter((e) => /\d,\d\d\s?€$/.test((e.innerText || '').replace(/[  ]/g, ' ').trim())
    && ![...e.children].some((c) => /\d,\d\d\s?€/.test(c.innerText || '')))
  .map((e) => ({
    t: (e.innerText || '').replace(/[  ]/g, ' ').trim(),
    fv: getComputedStyle(e).fontVariantNumeric,
    l: e.getBoundingClientRect().width,
  }))
  .filter((m) => m.l > 0));
const jugerMontants = async (ou) => {
  const ms = await montants();
  const fautifs = ms.filter((m) => !/tabular-nums/.test(m.fv));
  verifier(`${ou} : ${ms.length} montants, tous en chiffres tabulaires (font-variant-numeric calculé)`,
    ms.length > 0 && fautifs.length === 0, fautifs.map((m) => `« ${m.t} » : ${m.fv}`).join(' | '));
};

/** Le pied : son texte, son montant en centimes, et sa hauteur. */
const pied = () => page.evaluate(() => {
  const e = document.querySelector('[role="region"]');
  if (!e) return { texte: '(aucun pied)', centimes: null, h: 0 };
  const t = (e.innerText || '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
  const m = t.match(/(\d[\d ]*),(\d\d) €/);
  return { texte: t, centimes: m ? Number(m[1].replace(/ /g, '') + m[2]) : null, h: Math.round(e.getBoundingClientRect().height) };
});
const piedVaut = async (c, ms = 6000) => jusqua(async () => {
  const p = await pied();
  return p.centimes === c ? p : null;
}, ms);

/** Le défileur de la liste des lignes (le plus grand des défileurs verticaux). */
const defileur = () => page.evaluate(() => {
  const d = [...document.querySelectorAll('div')]
    .filter((e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY))
    .sort((a, b) => b.clientHeight - a.clientHeight)[0];
  if (!d) return null;
  const b = d.getBoundingClientRect();
  return { haut: Math.round(d.scrollTop), x: Math.round(b.x + b.width / 2), y: Math.round(b.y), h: Math.round(b.height) };
});

/* Les rangées de la liste, dans l'ordre : leur libellé parlé et leur total
   lu à l'écran (le sous-total pour un titre). */
const rangees = () => page.evaluate(() => [...document.querySelectorAll('button[aria-label$=", ouvrir"],button[aria-label^="Réserve : "]')]
  .filter((e) => !/^Option : /.test(e.getAttribute('aria-label')))
  .map((e) => {
    const t = (e.innerText || '').replace(/[  ]/g, ' ').trim();
    const m = t.match(/(\d[\d ]*),(\d\d) €\s*$/);
    return {
      libelle: e.getAttribute('aria-label').replace(/, ouvrir$/, ''),
      total: m ? Number(m[1].replace(/ /g, '') + m[2]) : null,
      offert: /Offert$/.test(t),
    };
  }));

const ouvrirRangee = async (debut, { derniere = false } = {}) => {
  const l = page.locator(`button[aria-label^="${debut}"]`);
  return toucher(derniere ? l.last() : l.first());
};
const RETOUR_CARTE = 'Enregistrer cette ligne et revenir au devis';
const SUIVANT = 'Enregistrer, puis ouvrir un poste neuf juste après';
const fermerCarte = async () => toucher(parLibelle(RETOUR_CARTE));
const carteOuverte = async () => (await page.getByLabel(RETOUR_CARTE, { exact: true }).count()) > 0;
const BANDEAU = 'Chiffrage — ce brouillon ne part pas encore.';
const dansLaSaisie = async () => (await texte()).includes(BANDEAU);

const section = async (titre, f) => {
  console.log(`\n${titre}`);
  try {
    await f();
  } catch (e) {
    verifier(`${titre} : la mesure est allée au bout`, false, e && e.message ? e.message.split('\n')[0] : String(e));
    await capture(`echec-${titre.slice(0, 30).replace(/[^\p{L}\d]+/gu, '-')}`);
  }
};
/** Aller sur « Mes devis » depuis n'importe où (par la barre du bas). */
const allerAMesDevis = async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(parLibelle('Mes devis : les brouillons de chiffrage'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await attendre(500);
};
const ouvrirLeDevis = async (objet) => {
  await toucher(page.locator(`button[aria-label^="Ouvrir le brouillon ${objet}"]`).first());
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(700);
};

/* ======================================================================== */
/*  LE PARCOURS                                                             */
/* ======================================================================== */
console.log(`Mesure de la saisie d’un devis — http://localhost:${PORT}, en démonstration`);
verifier(`la pause de la base de démonstration est lue dans api.js (${PAUSE_DEMO} ms)`, PAUSE_DEMO > 0,
  'sans elle, « Non enregistrée » ne se simule pas : la mesure a perdu sa cible');
verifier('le jeu de démonstration a une demande de devis et une urgence', !!DEMANDE && !!URGENCE);

let demarre = false;
await section('Le démarrage', async () => {
  const t0 = Date.now();
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
  await page.getByText('JE SUIS UN PROFESSIONNEL').first().waitFor({ timeout: 240000 });
  noter('accueil affiché après', `${Math.round((Date.now() - t0) / 1000)} s`);
  await toucher(page.getByText('JE SUIS UN PROFESSIONNEL').first());
  await attendre(3000);
  /* La fenêtre « Votre agent a besoin d'un nom » s'ouvre à la première
     entrée d'un pro, par-dessus la barre d'onglets. */
  if (await page.getByText('Plus tard').first().count()) { await toucher(page.getByText('Plus tard').first()); await attendre(800); }
  demarre = verifier('la bande « mode démonstration » est visible', /MODE DÉMONSTRATION/.test(await texte()));
});
if (!demarre) {
  console.error('\n✘ L’application n’a pas démarré en démonstration : rien d’autre ne peut se mesurer.\n');
  await n.close();
  process.exit(1);
}

await section('« Mon profil » → « Mes devis »', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(1200);
  const clients = await parLibelle('Mes clients').boundingBox();
  const devis = await parLibelle('Mes devis : les brouillons de chiffrage').boundingBox();
  verifier('« Mes devis » est sous « Mes clients »', !!clients && !!devis && devis.y > clients.y);
  verifier(`…et sa rangée fait 44 points (${devis && Math.round(devis.height)})`, !!devis && devis.height >= TOUCHE - 0.5);
  await toucher(parLibelle('Mes devis : les brouillons de chiffrage'));
  await page.getByText('Rénovation salle de bains').first().waitFor({ timeout: 8000 });
  await attendre(600);
  const t = await texte();
  const cartes = await page.locator('button[aria-label^="Ouvrir le brouillon "]').count();
  verifier(`deux cartes de brouillon (${cartes})`, cartes === 2);
  verifier('deux pastilles « Brouillon »', (t.match(/\bBrouillon\b/g) || []).length >= 2);
  /* L'encre de la pastille se CALCULE (`surFond`) : on mesure son contraste. */
  const contraste = await page.evaluate(() => {
    const e = [...document.querySelectorAll('div[dir="auto"]')].find((x) => x.innerText.trim() === 'Brouillon');
    if (!e) return null;
    const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const l1 = lum(rgb(getComputedStyle(e).color));
    const l2 = lum(rgb(getComputedStyle(e.parentElement).backgroundColor));
    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
  });
  verifier(`l’encre de « Brouillon » sur son fond : ${contraste} : 1 (4,5 au moins)`, contraste >= 4.5);
  verifier('« Client à choisir » sur le second', t.includes('Client à choisir'));
  verifier('« modifié il y a … » sur les cartes', /modifié (il y a|à l’instant|hier)/.test(t));
  verifier(`le total du premier est celui que calcule devis.js (${euros(totaux().ttc)})`, t.includes(euros(totaux().ttc)));
  verifier(`…et celui du second (${euros(ttcSejour)})`, t.includes(euros(ttcSejour)));
  verifier('au régime réel, la carte dit « Total TTC »', /Total TTC/.test(t));
  await jugerMontants('« Mes devis »');
  await jugerCibles('« Mes devis »');
  await capture('01-mes-devis');
});

await section('Le brouillon « Rénovation salle de bains », en liste', async () => {
  await ouvrirLeDevis('Rénovation salle de bains');
  const t = await texte();
  verifier(`le bandeau « ${BANDEAU} »`, t.includes(BANDEAU));
  verifier('« R+1 » puis « Salle de bains »', t.indexOf('R+1') > -1 && t.indexOf('Salle de bains') > t.indexOf('R+1'));
  const rs = await rangees();
  const st = sousTotaux(modele);
  const zone = rs.find((r) => r.libelle === 'R+1');
  const sdb = rs.find((r) => r.libelle === 'Salle de bains');
  verifier(`leurs sous-totaux sont ceux de devis.js (${euros(st[ligneDe('R+1').id])} et ${euros(st[ligneDe('Salle de bains').id])})`,
    !!zone && !!sdb && zone.total === st[ligneDe('R+1').id] && sdb.total === st[ligneDe('Salle de bains').id],
    JSON.stringify([zone, sdb]));
  verifier('« Réserve : » devant la réserve', t.includes('Réserve : Les reprises de plomberie'));
  const gravats = rs.find((r) => r.libelle.startsWith('Évacuation des gravats'));
  verifier('« Offert » À LA PLACE du total de la ligne offerte', !!gravats && gravats.offert && gravats.total === null, JSON.stringify(gravats));
  verifier('…et sa valeur dans le détail (« 1 forfait × 150,00 € »)', /1 forfait × 150,00 €/.test(t));
  verifier('« fourniture non comprise » écrit sur la ligne qui l’est', /Pose d’un meuble vasque[\s\S]{0,80}fourniture non comprise/.test(t));
  const postes = rs.filter((r) => modele.some((l) => l.type === 'poste' && l.designation === r.libelle && !l.offert));
  const fautes = postes.filter((r) => r.total !== totalLigne(modele.find((l) => l.designation === r.libelle)));
  verifier(`chaque total de ligne est celui de devis.js (${postes.length} postes chiffrés)`, postes.length === 4 && fautes.length === 0, JSON.stringify(fautes));
  /* L'option : sous « Options, non comprises », avec SON prix, et aucun total. */
  const options = await page.evaluate(() => {
    /* Un titre (`accessibilityRole="header"`) devient un `<h…>` sous
       react-native-web : on cherche le TEXTE, quel que soit l'élément. */
    const titre = [...document.querySelectorAll('body *')].find((e) => (e.innerText || '').trim() === 'Options, non comprises'
      && ![...e.children].some((c) => (c.innerText || '').trim() === 'Options, non comprises'));
    return titre ? (titre.parentElement.innerText || '').replace(/[  ]/g, ' ') : null;
  });
  const niche = ligneDe('Niche murale');
  verifier('l’option est sous « Options, non comprises », avec son prix', !!options && options.includes('Niche murale carrelée') && options.includes(euros(totalLigne(niche))), options);
  verifier('…et ce bloc ne porte AUCUN total', !!options && !/Total/.test(options), options);
  /* La ventilation : deux taux, chacun la base et la TVA de devis.js. */
  const tx = totaux();
  verifier('le modèle a bien deux taux', tx.ok && tx.ventilation.length === 2);
  tx.ventilation.forEach((v) => {
    const pct = v.taux === 550 ? '5,5 %' : `${v.taux / 100} %`;
    verifier(`« TVA ${pct} sur ${euros(v.base)} » et ${euros(v.tva)}`, t.includes(`TVA ${pct} sur ${euros(v.base)}`) && t.includes(euros(v.tva)));
  });
  verifier(`« Total HT » ${euros(tx.ht)} dans la ventilation`, t.includes(euros(tx.ht)) && /Total HT/.test(t));
  /* L'option n'entre pas dans les totaux : le TTC affiché est celui SANS elle. */
  const avecOption = totauxDevis(modele.map((l) => (l.type === 'option' ? { ...l, type: 'poste' } : l)));
  noter('TTC option comprise (union des lignes, devis.js) — jamais affiché au lot 1', euros(avecOption.ttc));
  const p = await pied();
  verifier(`le pied dit ${euros(tx.ttc)} — le TTC de devis.js, option non comprise`, p.centimes === tx.ttc && p.centimes !== avecOption.ttc, p.texte);
  const lignesPied = await page.evaluate(() => {
    const e = document.querySelector('[role="region"]');
    const tops = [...e.querySelectorAll('div[dir="auto"]')].map((x) => Math.round((x.getBoundingClientRect().top + x.getBoundingClientRect().height / 2) / 6));
    return new Set(tops).size;
  });
  verifier(`le pied tient sur UNE rangée (${p.h} points de haut, ${lignesPied} ligne de texte)`, p.h > 0 && p.h <= 56 && lignesPied === 1);
  await jugerMontants('La liste du devis');
  await jugerCibles('La liste du devis');
  await capture('02-saisie-haut');
  /* Le bandeau DÉFILE avec l'en-tête : il n'est pas fixe. */
  const avant = await page.getByText(BANDEAU).first().boundingBox();
  const d = await defileur();
  await glisser(d.x, d.y + 420, 0, -300);
  const apres = await page.getByText(BANDEAU).first().boundingBox();
  const d2 = await defileur();
  verifier(`le bandeau défile avec la liste, sous le doigt (liste ${d.haut} → ${d2.haut}, bandeau ${Math.round(avant.y)} → ${Math.round(apres.y)})`,
    d2.haut > d.haut && Math.abs((avant.y - apres.y) - (d2.haut - d.haut)) <= 2);
  verifier('un glissement vertical n’ouvre aucune carte', !(await carteOuverte()));
  await capture('03-saisie-lignes');
});

await section('La carte d’un poste prend l’écran', async () => {
  await ouvrirRangee('Pose de faïence murale');
  const carte = await page.evaluate((retour) => {
    const r = document.querySelector(`[aria-label="${retour}"]`);
    let c = r;
    while (c && c.parentElement && getComputedStyle(c).position !== 'absolute') c = c.parentElement;
    const b = c.getBoundingClientRect();
    const liste = [...document.querySelectorAll('div')].filter((e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY))
      .sort((a, x) => x.clientHeight - a.clientHeight).find((e) => !c.contains(e));
    const bl = liste ? liste.getBoundingClientRect() : null;
    return {
      l: b.width, h: b.height, fond: getComputedStyle(c).backgroundColor,
      couvreListe: bl ? (b.y <= bl.y + 1 && b.y + b.height >= bl.y + bl.height - 1 && b.width >= bl.width - 1) : null,
    };
  }, RETOUR_CARTE);
  verifier(`la carte couvre la liste entière, fond opaque (${Math.round(carte.l)} × ${Math.round(carte.h)}, ${carte.fond})`,
    carte.couvreListe === true && /rgb\(255, 255, 255\)/.test(carte.fond));
  const t = await texte();
  const tx = sousTotaux(modele)[ligneDe('Salle de bains').id];
  verifier(`sa barre : « ‹ Devis », « Salle de bains » et son sous-total ${euros(tx)}, « Poste suivant »`,
    t.includes('‹ Devis') && t.includes('Poste suivant') && t.includes(euros(tx)));
  const unites = await page.evaluate((noms) => noms.map((nom) => {
    const e = document.querySelector(`[aria-label="${nom}"]`);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return { nom, l: b.width, h: b.height, y: Math.round(b.y) };
  }), UNITES.map((u) => u.nom));
  verifier(`les sept unités (${unites.filter(Boolean).length}) : ${UNITES.map((u) => u.pastille).join(', ')}`, unites.length === 7 && unites.every(Boolean));
  const rangs = [...new Set(unites.filter(Boolean).map((u) => u.y))];
  verifier(`…sur DEUX rangées à 390 points (${rangs.length} : y = ${rangs.join(', ')})`, rangs.length === 2);
  verifier('…chacune de 44 × 44 au moins', unites.every((u) => u && u.l >= TOUCHE - 0.5 && u.h >= TOUCHE - 0.5),
    unites.filter((u) => u && (u.l < TOUCHE - 0.5 || u.h < TOUCHE - 0.5)).map((u) => `${u.nom} ${u.l}×${u.h}`).join(' | '));
  const q = await parLibelle('Temps estimé').boundingBox();
  const prix = await parLibelle('Taux horaire (HT)').boundingBox();
  verifier('à l’heure et en main-d’œuvre, « Temps estimé » et « Taux horaire (HT) »', !!q && !!prix);
  verifier('l’unité est AVANT la quantité', !!q && Math.max(...rangs) < q.y);
  verifier(`quantité et prix côte à côte (y = ${q && Math.round(q.y)} et ${prix && Math.round(prix.y)})`, !!q && !!prix && Math.abs(q.y - prix.y) < 2 && prix.x > q.x);
  verifier(`trois taux au régime réel (${await page.locator('[aria-label^="TVA à "]').count()})`, (await page.locator('[aria-label^="TVA à "]').count()) === 3);
  verifier('trois interrupteurs : Main-d’œuvre, Fourniture non comprise, Offert',
    (await page.getByRole('switch', { name: /^(Main-d’œuvre|Fourniture non comprise|Offert)\b/ }).count()) === 3);
  await jugerCibles('La carte d’un poste', (c) => c.dansCarte);
  await capture('04-carte-poste');
  await fermerCarte();
  verifier('« ‹ Devis » ferme la carte', !(await carteOuverte()));
});

await section('Fermer une carte : la liste est à la même place', async () => {
  const d = await defileur();
  await glisser(d.x, d.y + 400, 0, -220);
  const avant = await defileur();
  await ouvrirRangee('Chape sèche avant carrelage collé');
  verifier('la carte est ouverte', await carteOuverte());
  await fermerCarte();
  const apres = await defileur();
  verifier(`même position avant et après (${avant.haut} → ${apres.haut})`, avant.haut > 0 && avant.haut === apres.haut);
});

await section('Taper « 2,5 » puis quitter le champ', async () => {
  const chape = ligneDe('Chape sèche');
  const avant = (await pied()).centimes;
  await ouvrirRangee('Chape sèche avant carrelage collé');
  await viderEtTaper(parLibelle('Quantité'), '2,5');
  await attendre(900);
  verifier(`pendant la frappe, le pied ne bouge pas (${euros(avant)})`, (await pied()).centimes === avant);
  await toucher(parLibelle('Prix unitaire HT'));
  chape.quantiteMilliemes = 2500;
  verifier(`le champ quitté, le pied passe à ${euros(totaux().ttc)} (devis.js)`, !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
  await capture('05-apres-2-5');
  await fermerCarte();
  const r = (await rangees()).find((x) => x.libelle.startsWith('Chape sèche'));
  verifier(`et la rangée dit ${euros(totalLigne(chape))}`, !!r && r.total === totalLigne(chape), JSON.stringify(r));
});

await section('Changer SEULEMENT le taux (une pastille), puis « ‹ Devis »', async () => {
  const chape = ligneDe('Chape sèche');
  await ouvrirRangee('Chape sèche avant carrelage collé');
  await toucher(parLibelle('TVA à 20 %'));
  await fermerCarte();
  chape.tauxTvaCentiemes = 2000;
  verifier(`la ligne est ENREGISTRÉE : le pied passe à ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
  verifier('…sans « Non enregistrée » ni « Incomplète »', !/Non enregistrée|Incomplète/.test(await texte()));
  await ouvrirRangee('Chape sèche avant carrelage collé');
  verifier('…et rouverte, la carte a gardé 20 %', (await parLibelle('TVA à 20 %').getAttribute('aria-selected')) === 'true');
  await fermerCarte();
});

await section('Un prix à 0 sans « Offert »', async () => {
  const vasque = ligneDe('Pose d’un meuble vasque');
  await ouvrirRangee('Pose d’un meuble vasque');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '0');
  await toucher(parLibelle('Quantité'));
  await attendre(500);
  const v = validerLigne({ ...vasque, prixUnitaireCentimes: 0, offert: false });
  const phrase = net(messageDeContrainte(v.contrainte));
  verifier(`la phrase de ${v.contrainte} sous le champ`, !v.ok && (await texte()).includes(phrase.slice(0, 60)), phrase);
  await capture('06-prix-zero');
  await fermerCarte();
  const c = parLibelle('Ligne incomplète. La compléter');
  verifier('la rangée dit « Incomplète — La compléter »', (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 1);
  const b = await c.boundingBox();
  verifier(`…un vrai bouton de 44 points (${b && Math.round(b.width)} × ${b && Math.round(b.height)})`, !!b && b.height >= TOUCHE - 0.5 && b.width >= TOUCHE - 0.5);
  const p = await pied();
  verifier(`le pied le dit, et garde la dernière valeur sûre (« ${p.texte} »)`, /1 ligne non enregistrée/.test(p.texte) && p.centimes === totaux().ttc);
  await toucher(c);
  verifier('« La compléter » rouvre sa carte', await carteOuverte());
  await viderEtTaper(parLibelle('Prix unitaire HT'), '180');
  await toucher(parLibelle('Quantité'));
  await fermerCarte();
  verifier('remis à 180 €, la ligne n’est plus incomplète', (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 0);
  verifier(`…et le pied est ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)));
});

await section('« Offert » sur une ligne à 45 €', async () => {
  const faience = ligneDe('Pose de faïence murale');
  await ouvrirRangee('Pose de faïence murale');
  await toucher(page.getByRole('switch', { name: /^Offert\b/ }));
  faience.offert = true;
  const prix = await parLibelle('Taux horaire (HT)').inputValue();
  verifier(`le prix RESTE écrit (« ${prix} »)`, prix === '45' || prix === '45,00');
  await fermerCarte();
  const r = (await rangees()).find((x) => x.libelle.startsWith('Pose de faïence'));
  verifier('le total de la ligne devient « Offert »', !!r && r.offert && r.total === null, JSON.stringify(r));
  verifier(`le pied suit : ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)));
  await capture('07-offert');
  await ouvrirRangee('Pose de faïence murale');
  await toucher(page.getByRole('switch', { name: /^Offert\b/ }));
  faience.offert = false;
  await fermerCarte();
  const r2 = (await rangees()).find((x) => x.libelle.startsWith('Pose de faïence'));
  verifier(`éteint, le total revient (${euros(totalLigne(faience))})`, !!r2 && r2.total === totalLigne(faience), JSON.stringify(r2));
  verifier(`…et le pied aussi (${euros(totaux().ttc)})`, !!(await piedVaut(totaux().ttc)));
});

await section('« Main-d’œuvre » sur une ligne au m², puis sur une ligne sans unité', async () => {
  await ouvrirRangee('Chape sèche avant carrelage collé');
  await toucher(page.getByRole('switch', { name: /^Main-d’œuvre/ }));
  const t = await texte();
  verifier('aucun refus : la ligne au m² l’accepte', !/Non enregistrée|Incomplète|Choisissez une unité/.test(t));
  verifier('l’aide dit qu’un prix au m² est un prix forfaitaire', t.includes('Un prix au m² ou au mètre est un prix forfaitaire'));
  verifier('…et l’unité reste « m² »', (await parLibelle('mètre carré').getAttribute('aria-selected')) === 'true');
  ligneDe('Chape sèche').mainOeuvre = true;
  await toucher(page.getByRole('switch', { name: /^Main-d’œuvre/ }));
  ligneDe('Chape sèche').mainOeuvre = false;
  await toucher(parLibelle(SUIVANT));
  await toucher(page.getByRole('switch', { name: /^Main-d’œuvre/ }));
  verifier('sur une ligne sans unité, « heure » est proposée', (await parLibelle('heure').getAttribute('aria-selected')) === 'true');
  await capture('08-main-oeuvre');
  /* On la retire : elle n'a ni désignation ni prix. */
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  verifier('la ligne neuve est retirée, la carte fermée', !(await carteOuverte()));
  verifier(`…et le pied n’a pas bougé (${euros(totaux().ttc)})`, !!(await piedVaut(totaux().ttc)));
});

await section('Une pièce et ses surfaces, puis un poste au m² dans cette pièce', async () => {
  await toucher(parLibelle('Ajouter une pièce'));
  const focus = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('aria-label'));
  verifier(`la carte d’une pièce neuve donne la main à son nom (« ${focus} »)`, focus === 'Nom de la pièce');
  await taper('Cuisine');
  await toucher(parLibelle('Surface du sol, en mètres carrés'));
  await taper('17');
  await toucher(parLibelle('Surface des murs, en mètres carrés'));
  await taper('42,5');
  await toucher(parLibelle('Nom de la pièce'));
  await toucher(page.getByText('Ajouter un poste dans cette pièce', { exact: true }).first());
  await taper('Carrelage du sol');
  await toucher(parLibelle('mètre carré'));
  const sol = page.locator('[aria-label^="Surface du sol : 17 mètres carrés"]');
  const murs = page.locator('[aria-label^="Surface des murs : 42,5 mètres carrés"]');
  verifier('les deux appuis « Sol 17 m² » et « Murs 42,5 m² »', (await sol.count()) === 1 && (await murs.count()) === 1);
  await toucher(sol.first());
  const q = await parLibelle('Quantité').inputValue();
  verifier(`un appui remplit la quantité (« ${q} »)`, q === '17');
  const repris = tauxRepris(11000);
  const pris = await page.locator('[aria-label^="TVA à "][aria-selected="true"]').getAttribute('aria-label').catch(() => null);
  verifier(`le taux de la ligne chiffrée précédente est repris (« ${net(pris)} »)`, net(pris) === `TVA à ${repris / 100} %`);
  await toucher(parLibelle('Prix unitaire HT'));
  await taper('30');
  await toucher(parLibelle('Quantité'));
  await capture('09-piece-surfaces');
  await fermerCarte();
  /* Les ordres que l'application pose : la pièce après la dernière ligne
     (l'option comprise, 9 000), puis le poste juste après elle. */
  modele.push({ id: 'cuisine', ordre: 10000, type: 'piece', designation: 'Cuisine', surfaceSolMilliemes: 17000, surfaceMursMilliemes: 42500 });
  modele.push({
    id: 'carrelage', ordre: 11000, type: 'poste', designation: 'Carrelage du sol', quantiteMilliemes: 17000, unite: 'm2',
    prixUnitaireCentimes: 3000, tauxTvaCentiemes: repris, offert: false, mainOeuvre: false, fournitureNonComprise: false,
  });
  verifier(`le pied suit : ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
  const cuisine = (await rangees()).find((r) => r.libelle === 'Cuisine');
  verifier(`« Cuisine » et son sous-total ${euros(sousTotaux(modele).cuisine)}`, !!cuisine && cuisine.total === sousTotaux(modele).cuisine, JSON.stringify(cuisine));
});

await section('Une ligne EXISTANTE s’ouvre sans suggestion', async () => {
  /* La mémoire répond à une FRAPPE, jamais à l'ouverture : une ligne déjà
     écrite (« Chape sèche… », plus de trois lettres) s'ouvrait avec deux
     suggestions, et un appui distrait changeait son prix (relecture
     « écran » des étapes 4 à 7, B1). */
  await ouvrirRangee('Chape sèche');
  await attendre(1200);
  const nb = await page.locator('[aria-label^="Reprendre : "]').count();
  verifier(`aucune suggestion à l’ouverture (${nb})`, nb === 0);
  await fermerCarte();
});

await section('La deuxième chape : la mémoire, deux appuis', async () => {
  await ouvrirRangee('Carrelage du sol');
  await page.evaluate(() => { window.__opusFocus = []; window.__opusBlurs = []; });
  appuis = 0;
  await toucher(parLibelle(SUIVANT));
  await taper('chape');
  await attendre(900);
  const sugg = page.locator('[aria-label^="Reprendre : "]');
  const nb = await sugg.count();
  const t = await page.evaluate(() => {
    const e = document.querySelector('[aria-label="Déjà écrit dans vos devis"]');
    return e ? e.innerText.replace(/[  ]/g, ' ') : '';
  });
  verifier(`trois suggestions (${nb})`, nb === 3, t);
  verifier('…45,00 €, 52,00 € et la variante « fourniture non comprise » à 38,00 €',
    t.includes('45,00 €') && t.includes('52,00 €') && /38,00 €[^\n]*fourniture non comprise/.test(t), t);
  verifier('…chacune avec son devis d’origine', (t.match(/Sol du séjour|Rénovation salle de bains/g) || []).length >= 3, t);
  const rangsSugg = await sugg.evaluateAll((es) => es.map((e) => Math.round(e.getBoundingClientRect().height)));
  verifier(`…des rangées de 44 points au moins (${rangsSugg.join(', ')})`, rangsSugg.every((h) => h >= TOUCHE));
  await capture('10-memoire');
  await page.evaluate(() => { window.__opusFocus = []; window.__opusBlurs = []; });
  await toucher(page.locator('[aria-label^="Reprendre : "]', { hasText: '52,00' }).first());
  const trace = await page.evaluate(() => ({ focus: window.__opusFocus.slice(), blurs: window.__opusBlurs.slice(), actif: document.activeElement && document.activeElement.getAttribute('aria-label') }));
  const dernierFocus = trace.focus[trace.focus.length - 1];
  verifier(`la main passe à la QUANTITÉ (dernier focus donné : « ${dernierFocus} »)`, dernierFocus === 'Quantité', JSON.stringify(trace));
  const perduesOpus = trace.blurs.filter((b) => b.qui === 'Quantité' && !b.rnw);
  verifier('…et aucun code d’Opus ne la lui reprend', perduesOpus.length === 0, JSON.stringify(trace.blurs));
  const perduesRnw = trace.blurs.filter((b) => b.qui === 'Quantité' && b.rnw);
  if (perduesRnw.length) noter('focus repris par react-native-web (fin de défilement, `on-drag`) — pas un défaut d’iOS', `${perduesRnw.length} fois`);
  verifier(`deux appuis en tout (${appuis})`, appuis === 2);
  if (trace.actif !== 'Quantité') await toucher(parLibelle('Quantité'));
  await taper('3');
  await toucher(parLibelle('Prix unitaire HT'));
  const prix = await parLibelle('Prix unitaire HT').inputValue();
  verifier(`le prix est recopié (« ${prix} »)`, prix === '52' || prix === '52,00');
  await fermerCarte();
  modele.push({
    id: 'chape2', ordre: 12000, type: 'poste', designation: 'Chape sèche avant carrelage collé', quantiteMilliemes: 3000, unite: 'm2',
    prixUnitaireCentimes: 5200, tauxTvaCentiemes: tauxRepris(12000), offert: false, mainOeuvre: false, fournitureNonComprise: false,
  });
  verifier(`le pied suit : ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
});

await section('« Monter » un poste par-dessus un titre : il change de pièce, les sous-totaux suivent', async () => {
  const avant = (await rangees()).map((r) => r.libelle);
  const i = avant.indexOf('Carrelage du sol');
  await ouvrirRangee('Carrelage du sol');
  await toucher(parLibelle('Monter cette ligne'));
  await fermerCarte();
  await attendre(800);
  modele.find((l) => l.id === 'carrelage').ordre = 9000;
  const rs = await rangees();
  const j = rs.map((r) => r.libelle).indexOf('Carrelage du sol');
  verifier(`il est monté d’un rang, au-dessus de « Cuisine » (${i} → ${j})`, j === i - 1 && rs[j + 1].libelle === 'Cuisine', rs.map((r) => r.libelle).join(' | '));
  const st = sousTotaux(modele);
  [['R+1', ligneDe('R+1').id], ['Salle de bains', ligneDe('Salle de bains').id], ['Cuisine', 'cuisine']].forEach(([nom, id]) => {
    const r = rs.find((x) => x.libelle === nom);
    verifier(`le sous-total de « ${nom} » suit : ${euros(st[id])}`, !!r && r.total === st[id], JSON.stringify(r));
  });
  verifier(`et le pied n’a pas bougé (${euros(totaux().ttc)})`, !!(await piedVaut(totaux().ttc)));
});

await section('« Ajouter » : une zone, une réserve, une option — l’option reste HORS du total', async () => {
  const ttcAvant = totaux().ttc;
  await toucher(parLibelle('Ajouter une zone'));
  await taper('Rez-de-chaussée');
  await fermerCarte();
  await toucher(parLibelle('Ajouter une réserve'));
  await taper('Accès au compteur à prévoir par le client.');
  await fermerCarte();
  await toucher(parLibelle('Ajouter une option'));
  await taper('Peinture du plafond');
  await toucher(parLibelle('forfait'));
  await toucher(parLibelle('TVA à 5,5 %'));
  await toucher(parLibelle('Quantité'));
  await taper('1');
  await toucher(parLibelle('Prix unitaire HT'));
  await taper('300');
  await toucher(parLibelle('Quantité'));
  await capture('12a-option');
  await fermerCarte();
  modele.push({ id: 'rdc', ordre: 13000, type: 'zone', designation: 'Rez-de-chaussée' });
  modele.push({ id: 'reserve2', ordre: 14000, type: 'reserve', designation: 'Accès au compteur à prévoir par le client.' });
  modele.push({
    id: 'option2', ordre: 15000, type: 'option', designation: 'Peinture du plafond', quantiteMilliemes: 1000, unite: 'forfait',
    prixUnitaireCentimes: 30000, tauxTvaCentiemes: 550, offert: false, mainOeuvre: false, fournitureNonComprise: false,
  });
  const rs = await rangees();
  const t = await texte();
  const rdc = rs.find((r) => r.libelle === 'Rez-de-chaussée');
  verifier(`la zone « Rez-de-chaussée », et son sous-total ${euros(sousTotaux(modele).rdc)}`, !!rdc && rdc.total === sousTotaux(modele).rdc, JSON.stringify(rdc));
  verifier('la réserve, précédée de « Réserve : »', t.includes('Réserve : Accès au compteur à prévoir par le client.'));
  const options = await page.evaluate(() => {
    const titre = [...document.querySelectorAll('body *')].find((e) => (e.innerText || '').trim() === 'Options, non comprises'
      && ![...e.children].some((c) => (c.innerText || '').trim() === 'Options, non comprises'));
    return titre ? (titre.parentElement.innerText || '').replace(/[  ]/g, ' ') : '';
  });
  verifier('l’option rejoint « Options, non comprises », avec son prix et son taux', options.includes('Peinture du plafond') && options.includes('300,00 €') && /HT · 5,5 %/.test(options), options);
  verifier(`…et le TTC du devis ne bouge PAS (${euros(ttcAvant)})`, ttcAvant === totaux().ttc && !!(await piedVaut(ttcAvant)), `lu : ${(await pied()).texte}`);
  verifier('…ni la ventilation : aucun taux de 5,5 %', !/TVA 5,5 % sur/.test(t));
  /* LE TAUX D'UN POSTE AJOUTÉ APRÈS CETTE OPTION : celui du dernier POSTE,
     jamais celui de l'option (5,5 %) — les options s'affichent à part, sous
     la liste (relevé à l'étape 7, corrigé après la relecture « écran », B7). */
  await toucher(parLibelle('Ajouter un poste chiffré'));
  const pris = net(await page.locator('[aria-label^="TVA à "][aria-selected="true"]').getAttribute('aria-label').catch(() => '(aucun)'));
  const auDessus = trierLignes(modele).filter((l) => l.type === 'poste').pop();
  verifier(`un poste ajouté après l’option reprend le taux du dernier POSTE (« ${pris} » ; ${auDessus.tauxTvaCentiemes / 100} % attendus)`,
    pris === net(`TVA à ${tauxLisible(auDessus.tauxTvaCentiemes)}`));
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  verifier('le poste d’essai retiré, le pied n’a pas bougé', !(await carteOuverte()) && !!(await piedVaut(totaux().ttc)));
});

await section('« Retirer » le titre « Salle de bains » : le second appui dit ce qui part', async () => {
  const rs = await rangees();
  const i = rs.findIndex((r) => r.libelle === 'Salle de bains');
  const titres = TITRES();
  const j = rs.findIndex((r, k) => k > i && titres.includes(r.libelle));
  const nb = (j < 0 ? rs.slice(i + 1) : rs.slice(i + 1, j)).length;
  await ouvrirRangee('Salle de bains');
  await toucher(parLibelle('Retirer cette ligne'));
  const t = await texte();
  const phrase = (t.match(/Les \d+ lignes de cette pièce[^\n]*/) || [''])[0];
  verifier(`« Les ${nb} lignes de cette pièce passeront … » (lu : « ${phrase} »)`, new RegExp(`^Les ${nb} lignes de cette pièce (passeront|resteront) `).test(phrase));
  verifier(`« Retirer la pièce et ses ${nb} lignes »`, t.includes(`Retirer la pièce et ses ${nb} lignes`));
  await capture('11-retirer-piece');
  await fermerCarte();
  verifier('rien n’est retiré tant qu’on ne confirme pas', (await rangees()).length === rs.length);
});

await section('Le délai d’exécution', async () => {
  const d = await defileur();
  await glisser(d.x, d.y + 200, 0, 1500);
  await toucher(bouton(DELAI_PAR_DEFAUT.texte));
  verifier('l’appui écrit « Dans les 30 jours suivant la signature du devis »', (await parLibelle('Délai d’exécution').inputValue()) === DELAI_PAR_DEFAUT.texte);
  verifier('…et la phrase de L. 216-1 est sous lui', (await texte()).includes(net(DELAI_PAR_DEFAUT.pourquoi).slice(0, 80)));
  await viderEtTaper(parLibelle('Délai d’exécution'), '3 semaines, délai indicatif');
  await toucher(parLibelle('Objet du devis'));
  const av = net(avertissementDelai('délai indicatif'));
  verifier('« délai indicatif » → l’avertissement, et pas un refus', (await texte()).includes(av.slice(0, 60)) && !/Non enregistrée|Le brouillon n’a pas pu/.test(await texte()));
  await capture('12-delai');
  await toucher(bouton(DELAI_PAR_DEFAUT.texte));
});

await section('La retenue de garantie', async () => {
  const sw = page.getByRole('switch', { name: /^Retenue de garantie/ });
  verifier('l’interrupteur est allumé sur ce devis (5 %)', (await sw.getAttribute('aria-checked')) === 'true');
  await toucher(sw);
  verifier('éteint', (await sw.getAttribute('aria-checked')) === 'false');
  await toucher(sw);
  const v = await parLibelle('Taux de la retenue de garantie, en pour cent').inputValue();
  verifier(`rallumé, « 5 » est proposé (« ${v} »)`, v === '5' || v === '5,00');
  const bloc = await page.evaluate(() => {
    const s = document.querySelector('[role="switch"][aria-label^="Retenue de garantie"]');
    return s ? (s.parentElement.innerText || '').replace(/[  ]/g, ' ') : '';
  });
  verifier('PHRASE_RETENUE est écrite', bloc.includes(net(PHRASE_RETENUE).slice(0, 50)), bloc);
  verifier('…et AUCUN montant dans les conditions', !/\d,\d\d €/.test(bloc), bloc);
  await capture('13-retenue');
});

await section('Une écriture qui ne revient pas : « Non enregistrée — Réessayer »', async () => {
  await ouvrirRangee('Pose d’un meuble vasque');
  await page.evaluate(() => { window.__opusSuspendreEcritures = true; });
  await viderEtTaper(parLibelle('Quantité'), '2');
  await toucher(parLibelle('Prix unitaire HT'));
  await fermerCarte();
  ligneDe('Pose d’un meuble vasque').quantiteMilliemes = 2000;
  verifier('« enregistrement… » se voit', !!(await jusqua(async () => (await texte()).includes('enregistrement…'), 3000)));
  /* L'APPUI SUR LA BARRE DU BAS SE VOIT TOUT DE SUITE (relecture « écran »
     des étapes 4 à 7, B4) : la file écrit encore, donc la bande « Enregistrement
     avant de partir… » paraît au moment de l'appui — avant, l'écran restait
     identique jusqu'à huit secondes. « Rester » y reste. */
  const t0 = Date.now();
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const attente = await jusqua(async () => (await texte()).includes('Enregistrement avant de partir'), 1500, 50);
  const delaiBande = Date.now() - t0;
  verifier(`la bande « Enregistrement avant de partir… » paraît dès l’appui (${delaiBande} ms, appui compris)`, !!attente && delaiBande < 1500);
  await jugerCibles('La bande d’attente', (c) => c.libelle === 'Rester');
  await toucher(bouton('Rester'));
  verifier('« Rester » : on reste, et la bande s’en va', (await dansLaSaisie()) && !(await texte()).includes('Enregistrement avant de partir'));
  /* Mesuré : DEUX délais, pas un. La carte fermée pendant l'envoi relit la
     ligne et la remet dans la file ; quand le premier envoi est abandonné,
     la file envoie cette dernière version — qui ne revient pas non plus. */
  const debut = Date.now();
  const echec = await jusqua(async () => (await page.getByLabel('Ligne non enregistrée. Réessayer', { exact: true }).count()) >= 1, 2 * DELAI_ECRITURE + 5000);
  const duree = Math.round((Date.now() - debut) / 100) / 10;
  verifier(`« Non enregistrée — Réessayer », après ${duree} s (la file abandonne au bout de ${DELAI_ECRITURE / 1000} s par envoi)`, !!echec);
  noter('délai mesuré avant « Non enregistrée »', `${duree} s`);
  const b = await parLibelle('Ligne non enregistrée. Réessayer').boundingBox();
  verifier(`…un vrai bouton de 44 points (${b && Math.round(b.width)} × ${b && Math.round(b.height)})`, !!b && b.height >= TOUCHE - 0.5 && b.width >= TOUCHE - 0.5);
  const phrase = ((await texte()).match(/Non enregistrée — Réessayer\n([^\n]+)/) || [])[1];
  noter('la phrase sous le bouton', phrase || '(aucune)');
  verifier('…avec une phrase en français qui dit quoi faire', !!phrase && !/[Ee]rror|undefined|null|AbortError/.test(phrase));
  const p = await pied();
  const avantEchec = totauxDevis(modele.map((l) => (l.designation === 'Pose d’un meuble vasque' ? { ...l, quantiteMilliemes: 1000 } : l))).ttc;
  verifier(`le pied le dit, et garde la dernière valeur SÛRE (« ${p.texte} » ; ${euros(avantEchec)} attendus)`, /1 ligne non enregistrée/.test(p.texte) && p.centimes === avantEchec);
  await capture('14-non-enregistree');
  await page.evaluate(() => { window.__opusSuspendreEcritures = false; });
  await toucher(parLibelle('Ligne non enregistrée. Réessayer'));
  verifier(`« Réessayer » : la ligne part, et le pied passe à ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc, 8000)), `lu : ${(await pied()).texte}`);
  verifier('…et plus rien n’est « non enregistré »', !/[Nn]on enregistrée/.test(await texte()));
});

await section('La garde de sortie : une carte incomplète, puis la barre du bas', async () => {
  await ouvrirRangee('Pose d’un meuble vasque');
  await toucher(parLibelle(SUIVANT));
  await taper('Plinthes carrelées');
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const bande = await jusqua(async () => /n’est pas complète|ne sont pas complètes/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier('la bande de la garde apparaît', !!bande);
  verifier('…et l’écran ne part PAS', await dansLaSaisie());
  await jugerCibles('La bande de la garde', (c) => /^(La compléter|L’abandonner)$/.test(c.libelle));
  await capture('15-garde');
  await toucher(bouton('La compléter'));
  verifier('« La compléter » rouvre la carte', await carteOuverte());
  const v = await parLibelle('Désignation de la ligne').inputValue();
  verifier(`…avec ce qui était tapé (« ${v} »)`, v === 'Plinthes carrelées');
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
  verifier('retirée, la ligne incomplète ne retient plus personne', !(await carteOuverte()) && !/Incomplète/.test(await texte()));
});

await section('L’en-tête refusé : un code postal de quatre chiffres, puis la barre du bas', async () => {
  /* La garde partait sans un mot : refusé par l'écran, le champ n'avait rien
     envoyé, et « tout est en base » était faux (relecture « données » des
     étapes 4 à 7, I1). */
  const cp = parLibelle('Code postal du lieu des travaux');
  const avant = await cp.inputValue();
  await viderEtTaper(cp, '1310');
  await toucher(parLibelle('Objet du devis'));
  verifier('le code postal est refusé SOUS le champ', /Un code postal fait cinq chiffres/.test(await texte()));
  await toucher(page.getByRole('tab', { name: 'Accueil' }));
  const bande = await jusqua(async () => /« Code postal » : ce que vous avez écrit n’est pas enregistré/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier('la barre du bas : la bande NOMME le champ refusé, et l’écran ne part PAS', !!bande && await dansLaSaisie());
  await jugerCibles('La bande de l’en-tête refusé', (c) => /^(Corriger|Quitter sans l’enregistrer)$/.test(c.libelle));
  await capture('15a-entete-refuse');
  await toucher(bouton('Corriger'));
  verifier('« Corriger » : on reste, la bande s’en va, la phrase reste sous le champ',
    (await dansLaSaisie()) && !/ce que vous avez écrit n’est pas enregistré/.test(await texte()) && /Un code postal fait cinq chiffres/.test(await texte()));
  await viderEtTaper(cp, avant);
  await toucher(parLibelle('Objet du devis'));
  verifier(`rétabli (« ${avant} »), la phrase s’en va`, !/Un code postal fait cinq chiffres/.test(await texte()));
});

await section('À 320 points de large : aucun défilement horizontal', async () => {
  await page.setViewportSize({ width: 320, height: 700 });
  await attendre(900);
  /* Ce qui DÉPASSE l'écran sans être rogné par un parent (un décor rogné,
     les bandes de chantier, ne se voit pas), et les défileurs horizontaux. */
  const deborde = () => page.evaluate(() => {
    const vw = window.innerWidth;
    const trop = [...document.querySelectorAll('div,input,textarea,button')].filter((e) => {
      const b = e.getBoundingClientRect();
      if (b.width === 0 || b.right <= vw + 1) return false;
      let p = e.parentElement;
      while (p) {
        if (getComputedStyle(p).overflowX !== 'visible' && p.getBoundingClientRect().right <= vw + 1) return false;
        p = p.parentElement;
      }
      return true;
    }).map((e) => `${(e.getAttribute('aria-label') || e.innerText || e.tagName).slice(0, 40)} → ${Math.round(e.getBoundingClientRect().right)}`);
    const defileurs = [...document.querySelectorAll('div')].filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowX)
      && e.scrollWidth > e.clientWidth + 1 && e.getBoundingClientRect().width > 0).length;
    return { page: document.documentElement.scrollWidth, trop: trop.slice(0, 5), defileurs };
  });
  const liste = await deborde();
  verifier(`la liste du devis : ${liste.page} de large, rien ne dépasse, ${liste.defileurs} défileur horizontal`,
    liste.page <= 320 && liste.trop.length === 0 && liste.defileurs === 0, liste.trop.join(' | '));
  await capture('16-liste-320');
  await ouvrirRangee('Pose de faïence murale');
  const carte = await deborde();
  verifier(`la carte : ${carte.page} de large, rien ne dépasse, ${carte.defileurs} défileur horizontal`,
    carte.page <= 320 && carte.trop.length === 0 && carte.defileurs === 0, carte.trop.join(' | '));
  const rangs = await page.evaluate((noms) => new Set(noms.map((nom) => {
    const e = document.querySelector(`[aria-label="${nom}"]`);
    return e ? Math.round(e.getBoundingClientRect().y) : null;
  })).size, UNITES.map((u) => u.nom));
  noter('rangées des sept unités à 320 de large', rangs);
  /* « 99 999 999,99 » tient-il dans le champ du prix ? On le tape, on
     mesure, et on remet le prix d'avant — sans quitter le champ. */
  const champ = parLibelle('Taux horaire (HT)');
  const avant = await champ.inputValue();
  await viderEtTaper(champ, '99999999,99');
  const tient = await champ.evaluate((e) => ({ l: Math.round(e.clientWidth), contenu: e.scrollWidth }));
  verifier(`à 320 de large, « 99999999,99 » tient dans le champ du prix (${tient.contenu} pour ${tient.l} points)`, tient.contenu <= tient.l + 1);
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await taper(avant);
  await capture('17-carte-320');
  await fermerCarte();
  verifier(`le prix remis, le pied reste ${euros(totaux().ttc)}`, !!(await piedVaut(totaux().ttc)));
});

await section('À 375 × 667 (iPhone SE) : le chrome fixe', async () => {
  await page.setViewportSize({ width: 375, height: 667 });
  await attendre(900);
  const c = await page.evaluate(() => {
    const vw = window.innerWidth;
    const retour = document.querySelector('[aria-label="Revenir en arrière"]');
    let haut = retour;
    while (haut && haut.parentElement) { const b = haut.getBoundingClientRect(); if (b.width >= vw - 1 && b.height <= 120) break; haut = haut.parentElement; }
    const h = (e) => (e ? Math.round(e.getBoundingClientRect().height) : 0);
    return {
      haut: retour ? h(haut) : 0, bas: h(document.querySelector('[role="tablist"]')),
      pied: h(document.querySelector('[role="region"]')), demo: h(document.querySelector('[role="alert"]')),
    };
  });
  const somme = c.haut + c.bas + c.pied;
  /* Les trois doivent EXISTER : une somme de zéros passerait au vert sans
     rien mesurer. */
  verifier(`barre du haut ${c.haut} + barre du bas ${c.bas} + pied ${c.pied} = ${somme} points (202 au plus)`,
    c.haut > 0 && c.bas > 0 && c.pied > 0 && somme <= 202);
  noter('bande de démonstration, en plus (absente hors démonstration)', `${c.demo} points`);
  noter('hauteur visible de la liste à 375 × 667', `${(await defileur()).h} points`);
  await capture('18-se-375x667');
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
});

await section('Le régime de TVA : réel → franchise → réel, sans recharger', async () => {
  await page.evaluate(() => { window.__opusMarqueur = 'toujours la même page'; });
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  verifier('tout étant enregistré, la garde laisse partir', !(await dansLaSaisie()));
  await toucher(parLibelle('Mon entreprise : identité et informations de devis'));
  await toucher(bouton(/^(Compléter|Modifier) mes informations de devis$/));
  await toucher(page.getByRole('radio', { name: /^Franchise en base de TVA/ }));
  await toucher(bouton('Enregistrer mes informations de devis'));
  await jusqua(async () => (await bouton(/^(Compléter|Modifier) mes informations de devis$/).count()) > 0, 5000);
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  await allerAMesDevis();
  verifier('en franchise, « Mes devis » dit « Total », pas « Total TTC »', !/Total TTC/.test(await texte()) && /\bTotal\b/.test(await texte()));
  await ouvrirLeDevis('Rénovation salle de bains');
  const t = await texte();
  const phrase = net(coherenceRegime(modele, 'franchise'));
  verifier('le bandeau de cohérence : « des lignes portent un taux de TVA »', !!phrase && t.includes(phrase.slice(0, 70)), phrase);
  const me = await parLibelle('Ouvrir Mon entreprise, section TVA').boundingBox();
  verifier(`…avec « Mon entreprise », un bouton de 44 points (${me && Math.round(me.height)})`, !!me && me.height >= TOUCHE - 0.5);
  verifier('la ventilation dit la mention de franchise, et aucun taux', t.includes(MENTION_FRANCHISE) && !/TVA (20|10|5,5) % sur/.test(t));
  verifier('le pied dit « Total », pas « Total TTC »', /^Total\b/.test((await pied()).texte) && !/Total TTC/.test((await pied()).texte));
  await capture('19-franchise');
  await ouvrirRangee('Pose d’un meuble vasque');
  verifier('dans une carte : aucun taux à choisir', (await page.locator('[aria-label^="TVA à "]').count()) === 0);
  verifier('…mais « Retirer la TVA » sur une ligne qui en porte un', (await page.getByText('Retirer la TVA', { exact: true }).count()) === 1);
  verifier('…et « Prix unitaire », sans « HT »', (await page.getByLabel('Prix unitaire', { exact: true }).count()) === 1);
  await fermerCarte();
  /* Le bouton du bandeau ouvre « Mon entreprise » sur la TVA ; au retour, le
     régime est RELU (`surEmetteur`). */
  await toucher(parLibelle('Ouvrir Mon entreprise, section TVA'));
  await toucher(page.getByRole('radio', { name: /^Régime réel/ }));
  await toucher(bouton('Enregistrer mes informations de devis'));
  await jusqua(async () => (await bouton(/^(Compléter|Modifier) mes informations de devis$/).count()) > 0, 5000);
  await toucher(parLibelle('Fermer « Mon entreprise »'));
  await attendre(800);
  const t2 = await texte();
  verifier('revenu au réel : le bandeau est parti', !t2.includes(phrase.slice(0, 70)));
  verifier('…les taux sont revenus dans la ventilation, et « Total TTC » au pied', /TVA (20|10) % sur/.test(t2) && /Total TTC/.test((await pied()).texte));
  verifier('…sans que la page ait été rechargée', (await page.evaluate(() => window.__opusMarqueur)) === 'toujours la même page');
  noter('les états « en lecture », « échec » et « non déclaré »', 'ne se produisent pas en démonstration (voir l’en-tête)');
});

let objetDemande = null;
await section('« Pour moi » : accepter la demande de devis, « Faire un devis »', async () => {
  await toucher(page.getByRole('tab', { name: /^Découvrir/ }));
  await attendre(900);
  await toucher(page.getByRole('tab', { name: 'Pour moi' }));
  await attendre(900);
  /* L'urgence d'abord, la demande de devis ensuite (ordre de « À traiter »). */
  await toucher(page.getByRole('button', { name: 'Accepter', exact: true }).nth(1));
  await attendre(900);
  await toucher(page.getByRole('button', { name: /^En cours/ }));
  const faire = parLibelle(`Faire un devis pour la demande de ${DEMANDE.nom}`);
  verifier('acceptée, la demande montre « Faire un devis »', (await page.getByLabel(`Faire un devis pour la demande de ${DEMANDE.nom}`, { exact: true }).count()) === 1);
  await jugerCibles('« Pour moi », la demande acceptée', (c) => /^(Faire un devis|Reprendre|Nouveau devis)/.test(c.libelle));
  await capture('20-pour-moi');
  await toucher(faire);
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  const t = await texte();
  objetDemande = await parLibelle('Objet du devis').inputValue();
  verifier(`le brouillon s’ouvre, son objet est la description de la demande (« ${objetDemande} »)`, objetDemande === DEMANDE.titre);
  verifier('…sans client (« À choisir ») ni lieu', t.includes('À choisir') && (await parLibelle('Ville du lieu des travaux').inputValue()) === '' && (await parLibelle('Code postal du lieu des travaux').inputValue()) === '');
  verifier('…« depuis une demande du … »', /depuis une demande du \d\d\/\d\d\/\d{4}/.test(t));
  verifier('…et le budget écrit par le client', /Budget indiqué par le client : /.test(t));
  await capture('21-depuis-demande');
  /* Le brouillon ne naît qu'au premier geste : l'appui du délai. */
  await toucher(bouton(DELAI_PAR_DEFAUT.texte));
  await attendre(900);
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
  verifier('le retour ramène à « Pour moi »', !(await dansLaSaisie()) && /À traiter/.test(await texte()));
  /* Relevé : la pastille revient à « À traiter » — l'écran a été démonté. */
  const surEnCours = (await page.getByLabel(`Faire un devis pour la demande de ${DEMANDE.nom}`, { exact: true }).count()) === 1;
  noter('au retour, la pastille de « Pour moi » est restée sur « En cours »', surEnCours ? 'oui' : 'non — revenue à « À traiter »');
  if (!surEnCours) await toucher(page.getByRole('button', { name: /^En cours/ }));
  await toucher(parLibelle(`Faire un devis pour la demande de ${DEMANDE.nom}`));
  const t2 = await texte();
  verifier('« Faire un devis » de nouveau : « Brouillon en cours » — Reprendre · Nouveau devis',
    /Brouillon en cours, modifié/.test(t2) && (await bouton('Reprendre le brouillon le plus récent pour cette demande').count()) === 1);
  await jugerCibles('« Pour moi », le brouillon en cours', (c) => /^(Reprendre|Nouveau devis)/.test(c.libelle));
  await capture('22-reprendre');
  await toucher(bouton('Reprendre le brouillon le plus récent pour cette demande'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  verifier('« Reprendre » ouvre LE MÊME brouillon (son objet, et le délai posé)',
    (await parLibelle('Objet du devis').inputValue()) === objetDemande
    && (await parLibelle('Délai d’exécution').inputValue()) === DELAI_PAR_DEFAUT.texte);
});

await section('« Pour qui ? » → « Choisir dans mon carnet »', async () => {
  await toucher(bouton('Choisir dans mon carnet'));
  const recherche = parLibelle('Chercher dans mon carnet');
  await recherche.waitFor({ timeout: 6000 });
  await jugerCibles('La feuille du carnet', (c) => /^(Chercher dans mon carnet|Choisir |Nouveau client)/.test(c.libelle));
  await toucher(recherche);
  await taper('mart');
  await attendre(700);
  const choix = page.locator('[aria-label^="Choisir Mme Martin"]');
  const autres = (await page.locator('[aria-label^="Choisir "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label'))))
    .filter((l) => l !== 'Choisir dans mon carnet').length;
  verifier(`la recherche ne garde que Mme Martin (${autres} fiche)`, (await choix.count()) === 1 && autres === 1);
  await capture('23-carnet');
  await toucher(choix.first());
  await attendre(900);
  const t = await texte();
  verifier('le client est posé : « Mme Martin · Charleval »', t.includes('Mme Martin · Charleval'));
  verifier('le lieu vide reçoit SON adresse', (await parLibelle('Ville du lieu des travaux').inputValue()) === 'Charleval'
    && (await parLibelle('Code postal du lieu des travaux').inputValue()) === '13350');
  verifier('…et le DIT', t.includes('Adresse du client reprise : modifiez-la si le chantier est ailleurs.'));
  await capture('24-client-pose');
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

await section('« Pour moi » : l’urgence acceptée, et le rappel', async () => {
  await toucher(page.getByRole('button', { name: /^À traiter/ }));
  await toucher(page.getByRole('button', { name: 'Accepter', exact: true }).first());
  await attendre(900);
  await toucher(page.getByRole('button', { name: /^En cours/ }));
  const faire = page.getByLabel(`Faire un devis pour la demande de ${URGENCE.nom}`, { exact: true });
  verifier('acceptée, l’urgence montre « Faire un devis »', (await faire.count()) === 1);
  const cartes = await page.locator('[aria-label^="Voir le profil de "]').count();
  const boutons = await page.locator('[aria-label^="Faire un devis pour la demande de "]').count();
  verifier(`le rappel accepté n’a PAS de bouton (${cartes} demandes en cours, ${boutons} « Faire un devis »)`, cartes === 3 && boutons === 2);
  await toucher(faire.first());
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  verifier('« depuis une urgence du … »', /depuis une urgence du \d\d\/\d\d\/\d{4}/.test(await texte()));
  await capture('25-depuis-urgence');
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

await section('La fiche de Mme Martin : « Ses devis », « Faire un devis », ce qu’une suppression laisse', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(parLibelle('Mes clients'));
  await toucher(parLibelle('Ouvrir la fiche de Mme Martin'));
  await page.getByText('Ses devis', { exact: true }).first().waitFor({ timeout: 6000 });
  await attendre(800);
  const sesDevis = await page.locator('[aria-label^="Ouvrir le devis "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier(`« Ses devis » : ${sesDevis.length} — Rénovation salle de bains, et celui de la demande`,
    sesDevis.includes('Ouvrir le devis Rénovation salle de bains') && sesDevis.includes(`Ouvrir le devis ${objetDemande}`), sesDevis.join(' | '));
  const f = await parLibelle('Faire un devis pour Mme Martin').boundingBox();
  verifier(`« Faire un devis » : un bouton de 44 points (${f && Math.round(f.width)} × ${f && Math.round(f.height)})`, !!f && f.height >= TOUCHE - 0.5);
  await capture('26-fiche-martin');
  await toucher(page.getByRole('button', { name: 'Supprimer cette fiche', exact: true }));
  const t = await texte();
  verifier('le second appui de « Supprimer » dit « avec l’adresse des travaux »', /devis : (ils resteront, détachés|il restera, détaché) de sa fiche, avec l’adresse des travaux/.test(t));
  await capture('27-supprimer-fiche');
  await toucher(parLibelle('Faire un devis pour Mme Martin'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  verifier('« Faire un devis » ouvre un brouillon pour elle, son adresse comme lieu',
    (await texte()).includes('Mme Martin') && (await parLibelle('Ville du lieu des travaux').inputValue()) === 'Charleval');
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

await section('« Supprimer ce brouillon », deux appuis', async () => {
  await allerAMesDevis();
  const avant = await page.locator('button[aria-label^="Ouvrir le brouillon "]').count();
  await ouvrirLeDevis('Sol du séjour');
  await toucher(bouton('Supprimer ce brouillon'));
  verifier('le premier appui ne supprime rien, il demande', (await bouton('Confirmer la suppression de ce brouillon').count()) === 1 && await dansLaSaisie());
  await toucher(bouton('Confirmer la suppression de ce brouillon'));
  await jusqua(async () => !(await dansLaSaisie()), 5000);
  await attendre(800);
  const apres = await page.locator('button[aria-label^="Ouvrir le brouillon "]').count();
  verifier(`la carte disparaît de « Mes devis » (${avant} → ${apres})`, apres === avant - 1 && !(await texte()).includes('Sol du séjour'));
  await capture('28-apres-suppression');
});

await section('Un devis neuf : « + Poste » sans défiler, et la sixième porte gardée', async () => {
  /* LE PREMIER POSTE SANS GLISSER (relecture « écran » des étapes 4 à 7,
     B5) : sous l'en-tête, la barre « Ajouter » tombait SOUS le pied et la
     barre du bas (y = 793 sur 844). Un devis vide porte « + Poste » dans
     son pied fixe. */
  await toucher(bouton('Nouveau devis'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  const plus = parLibelle('Ajouter un premier poste chiffré');
  const b = await plus.boundingBox().catch(() => null);
  const barre = await page.getByRole('tab', { name: 'Accueil' }).boundingBox();
  verifier(`« + Poste » est à l’écran sans défiler, au-dessus de la barre du bas (y ${b && Math.round(b.y)}, h ${b && Math.round(b.height)} ; barre à ${barre && Math.round(barre.y)})`,
    !!b && !!barre && b.y + b.height <= barre.y + 0.5 && b.height >= TOUCHE - 0.5);
  appuis = 0;
  await toucher(plus);
  verifier('…et un appui ouvre la carte d’un poste', await carteOuverte());
  await taper('Ragréage');
  await toucher(parLibelle('mètre carré'));
  await fermerCarte();
  verifier('…qui s’ouvre avec un appui — et la ligne laissée incomplète l’est à l’écran', /Incomplète/.test(await texte()));
  /* LA SIXIÈME PORTE (bloquant A1) : « Nouveau client » → un nom déjà pris →
     sa fiche. Elle propose « Choisir ce client pour ce devis », JAMAIS
     « Faire un devis » — qui démontait la saisie sans la garde. */
  await toucher(bouton('Nouveau client'));
  await page.getByText('Nouveau client', { exact: true }).first().waitFor({ timeout: 6000 });
  await taper('Mme Martin');
  await attendre(600);
  await toucher(page.locator('[aria-label^="Vous avez déjà un client nommé Mme Martin"]').first());
  await attendre(900);
  verifier('la fiche existante, ouverte depuis la saisie, propose « Choisir ce client pour ce devis » — ni « Faire un devis » ni « Ses devis »',
    (await page.getByLabel('Choisir Mme Martin pour le devis en cours', { exact: true }).count()) === 1
    && (await page.getByLabel('Faire un devis pour Mme Martin', { exact: true }).count()) === 0
    && !(await texte()).includes('Ses devis'));
  await capture('28a-fiche-depuis-la-saisie');
  await toucher(parLibelle('Choisir Mme Martin pour le devis en cours'));
  await attendre(900);
  const t = await texte();
  verifier('…un appui la pose sur CE devis, et la ligne incomplète est toujours là', (await dansLaSaisie())
    && t.includes('Mme Martin · Charleval') && /Ragréage/.test(t) && /Incomplète/.test(t));
  await toucher(parLibelle('Revenir en arrière'));
  const bande = await jusqua(async () => /n’est pas complète/.test(await texte()), DELAI_ECRITURE + 3000);
  verifier('le retour passe par la garde : la ligne incomplète la retient', !!bande && await dansLaSaisie());
  await toucher(bouton('L’abandonner'));
  await jusqua(async () => !(await dansLaSaisie()), 6000);
  verifier('« L’abandonner » : on revient à « Mes devis »', !(await dansLaSaisie()));
});

await section('Les textes : la politique de confidentialité parle des devis', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(page.getByText('Confidentialité et sécurité', { exact: true }).first());
  await toucher(page.getByText('Politique de confidentialité', { exact: true }).first());
  await page.getByText('Les clients que vous enregistrez', { exact: true }).first().waitFor({ timeout: 6000 });
  const t = await texte();
  verifier('« Les clients que vous enregistrez » nomme les devis, et ce qu’une suppression de fiche n’efface pas',
    t.includes('de préparer des devis') && t.includes('Supprimer la fiche d’un client ne supprime pas ses devis'));
  verifier('« Combien de temps » dit ce qui relève de l’artisan', t.includes('relève de lui') && !/trois exceptions/.test(t));
  await page.getByText('Les clients que vous enregistrez', { exact: true }).first().scrollIntoViewIfNeeded();
  await capture('29-confidentialite-clients');
  await page.getByText('Combien de temps', { exact: true }).first().scrollIntoViewIfNeeded();
  await capture('30-confidentialite-combien');
});

await section('Un particulier n’a pas « Mes devis »', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(page.getByText('Se déconnecter', { exact: true }).first());
  await page.getByText('JE SUIS UN PARTICULIER').first().waitFor({ timeout: 10000 });
  await toucher(page.getByText('JE SUIS UN PARTICULIER').first());
  await attendre(2500);
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(1200);
  verifier('le profil d’un particulier ne montre ni « Mes devis » ni « Mes clients »',
    (await page.getByLabel('Mes devis : les brouillons de chiffrage', { exact: true }).count()) === 0
    && (await page.getByLabel('Mes clients', { exact: true }).count()) === 0);
  await capture('31-particulier');
});

console.log('\nCe que la page a dit');
const vraies = erreursPage.filter((e) => !/play\(\)|Failed to load resource/.test(e));
verifier('aucune erreur de page ni de console', vraies.length === 0, vraies.slice(0, 5).join(' | '));

await ctx.close();
await n.close();
console.log('');
if (echecs) {
  console.error(`✘ ${echecs} mesure(s) en échec.\n`);
  process.exit(1);
}
console.log('✔ La saisie d’un devis tient ses mesures — au NAVIGATEUR.');
console.log('  Le clavier, le pouce et le rendu d’iOS, eux, ne se jugent que sur l’iPhone.\n');
