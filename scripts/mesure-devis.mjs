/**
 * LA SAISIE D'UN DEVIS, MESURÉE AU NAVIGATEUR — lot 1 du module devis
 * (cahier du lot 1, §6.1-G et §7.3), puis la base de postes du lot P
 * (cahier du lot P, §6.2 et §7.3).
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
 * LA BASE DE POSTES (lot P, 24/10/2026) — CE QU'IL EN MESURE
 * ----------------------------------------------------------
 *   - la mémoire du lot 1 regroupée par PHRASE : « chape » rend exactement
 *     DEUX propositions, la base d'abord (45,00 €), jamais 52,00 € ; leurs
 *     clés, reconstruites depuis les libellés par `rapprochement.js` sous
 *     `node`, sont différentes ; un appui recopie 45 et la phrase rangée,
 *     octet pour octet ;
 *   - sur une ligne neuve : « seuils » et « gravats » rendent UNE rangée,
 *     « faience » la base puis le dernier prix, « Pos » exactement trois
 *     « Pose », « Dalles » et « beton » la dalle — la réponse du propriétaire
 *     du 23/10 — et « Les », « Sas », « Aux » RIEN ;
 *   - chaque proposition affichée : un titre de deux lignes au plus, un
 *     détail d'UNE ligne, une rangée de 44 points (à 320 de large) ;
 *   - sur la carte : la référence AU-DESSUS du champ prix, l'écart dessous,
 *     leurs couleurs CALCULÉES (`C.muted` pour la phrase, `C.ink` pour le
 *     montant), « Ce poste existe déjà dans votre base. » sur une variante
 *     — la phrase du poste citée UNE fois, la référence la nommant déjà —,
 *     et RIEN de tout cela dans la liste du devis (Q3 a) ;
 *   - les deux feuilles (« Ajouter à ma base », la feuille d'un poste),
 *     jamais deux à la fois, et la course « ce poste existe déjà » : la
 *     décision avant les explications, atteignable à 320 × 568, et le prix
 *     tapé GARDÉ quand le poste arrive pendant la frappe ;
 *   - la feuille d'un poste ouverte depuis la carte : le prix actuel écrit,
 *     aucun « Retirer » ; dans la page, « Retirer le prix de référence » en
 *     DEUX appuis ;
 *   - la page « Ma base de postes », ses deux portes, sa recherche, ses
 *     écritures ; la base illisible : « Lecture impossible », jamais
 *     « Aucun poste » ; une relecture ratée, puis une écriture et
 *     « Réessayer » : la page et la carte retrouvent la base ;
 *   - les propositions de même titre, distinguées en tête de leur détail
 *     (« avec la fourniture » / « fourniture non comprise »), et la phrase
 *     d'un changement d'unité qui survit à une seconde proposition.
 *
 * La relecture « écran » du lot P (ECRAN1) a sorti ce que ces écrans
 * décident vers des fonctions pures de `postes.js` et de `devis.js`, que
 * `verifier-postes` (partie E bis) FAIT TOURNER sous `node`. Ce qui reste ici
 * seulement, parce que seul un navigateur le dit : une POSITION (la
 * référence au-dessus du prix, la décision dans l'écran à 320 × 568), une
 * COULEUR calculée, une feuille qui change d'état PENDANT qu'on tape, une
 * course entre une lecture et une écriture, et un geste.
 *
 * CE QU'IL SIMULE, ET COMMENT IL LIT LA BASE
 * ------------------------------------------
 * En démonstration, chaque requête de postes attend `PAUSE_POSTES_DEMO`
 * (`api.js`) dans `attendrePostes` (`devis-demo.js`). Comme pour les
 * écritures du devis, seule CETTE minuterie est allongée, et seulement le
 * temps d'une mesure : au-delà de 8 s, la lecture échoue ; à 7 s, deux
 * ajouts du même poste se croisent. Chaque requête de postes est aussi
 * COMPTÉE : une section ne peut mesurer « la première lecture » que si
 * aucune n'a encore eu lieu.
 *
 * Deux choses ne se voient pas à l'écran, et la mesure les lit dans les
 * modules que Metro a chargés (`__r.getModules()`, présent en
 * développement seulement) :
 *   - la base de démonstration, LUE par `api.mesPostes()` — la même porte
 *     que l'application —, pour ouvrir chaque section par sa PRÉCONDITION
 *     (« aucun poste de cette clé n'existe encore ») et pour constater ce
 *     qu'un geste a rangé. Une lecture, jamais une écriture ;
 *   - les annonces à VoiceOver (`retour.annoncer`) :
 *     `AccessibilityInfo.announceForAccessibility` n'est qu'une fonction
 *     vide sous `react-native-web`. La mesure l'écoute ; elle ne dit RIEN
 *     de ce que VoiceOver en fait sur l'iPhone.
 *
 * L'ORDRE DES SECTIONS A UNE RAISON. Les mesures de la base vivent AVANT
 * « Le régime de TVA » : passer en franchise puis revenir au réel REDÉCLARE
 * le régime, donc chaque prix de référence devient « fixé avant la
 * déclaration de votre régime de TVA actuel : vérifiez-le », et l'écart se
 * tait (T9) — c'est voulu, et ça rendrait leurs mesures muettes. Et toutes
 * vivent AVANT « Supprimer ce brouillon », qui efface « Sol du séjour ».
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
 *
 * Pour la base de postes, pas davantage : ni le clavier sous les feuilles,
 * ni `hitSlop` (la croix d'une feuille mesure 18 × 20 ici, environ 38 × 40
 * au doigt), ni VoiceOver, ni Hermes. Deux `Modal` empilées ne laissent
 * aucun voile invisible sous `react-native-web` : ici on compte qu'il n'y en
 * a jamais deux ; ce qu'iOS en ferait, seul l'iPhone le dit. Et « modifié
 * entre-temps » ne se produit pas en démonstration : il est éprouvé par
 * `verifier-postes` (G) sous `node`, et sur la vraie base.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { fabriquerDevisDemo, fabriquerPostesDemo, DEVIS_DEMO_IDS } from '../src/data/devis-demo.js';
import {
  totauxDevis, sousTotaux, totalLigne, validerLigne, trierLignes, UNITES, cleDeLigne,
  MENTION_FRANCHISE, PHRASE_RETENUE, DELAI_PAR_DEFAUT, avertissementDelai, coherenceRegime, tauxLisible,
} from '../src/lib/devis.js';
import { cleDeRapprochement } from '../src/lib/rapprochement.js';
import {
  PHRASE_SORTIE, PHRASE_RETRAIT_DU_POSTE, PHRASE_POSTES_D_UN_CLIENT, changementDUnite, phraseSuppressionDuBrouillon,
} from '../src/lib/postes.js';
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
/* …et celle de la base de postes (lot P), lue de même. */
const PAUSE_POSTES = Number((readFileSync('src/lib/api.js', 'utf8').match(/const PAUSE_POSTES_DEMO = (\d+);/) || [])[1]);

/* Les deux encres de la base de postes, LUES dans `theme.js` : la phrase
   d'aide en gris (`C.muted`), le montant à l'encre du texte (`C.ink`). Une
   couleur se mesure calculée, jamais supposée. */
const THEME = readFileSync('src/theme.js', 'utf8');
const rgbDuTheme = (nom) => {
  const m = THEME.match(new RegExp(`\\b${nom}: '#([0-9A-Fa-f]{6})'`));
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return `rgb(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255})`;
};
const ENCRE = rgbDuTheme('ink');
const GRIS = rgbDuTheme('muted');
const ORANGE_DE_LECTURE = rgbDuTheme('accentTexte');

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

/* LA BASE DE POSTES DE DÉMONSTRATION (lot P) et les lignes de « Sol du
   séjour », telles que `devis-demo.js` les fabrique : les phrases que la
   mesure attend sont CELLES-LÀ, octet pour octet. */
const POSTES_DEMO = fabriquerPostesDemo(new Date());
const posteDemo = (debut) => POSTES_DEMO.find((p) => (p.designation || '').startsWith(debut));
const LIGNES_SEJOUR = trierLignes(jeu.lignes.filter((l) => l.devisId === SEJOUR.id));
const ligneSejour = (debut) => LIGNES_SEJOUR.find((l) => (l.designation || '').startsWith(debut));
const CHAPE = posteDemo('Chape sèche').designation;
const SEUIL = ligneSejour('Seuil de porte').designation;
const SEUILS = ligneSejour('Seuils de porte').designation;
const DEPOSE = posteDemo('Dépose de l’ancien').designation;
const DALLE = posteDemo('Dalle béton').designation;
const RAGREAGE = posteDemo('Ragréage').designation;

/* ======================================================================== */
const n = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const ctx = await n.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(({ pause, pausePostes }) => {
  /* LA SIMULATION DE L'ÉCRITURE QUI NE REVIENT PAS : seule la minuterie de
     `pause` millisecondes appelée depuis l'écrivain de démonstration
     (`ecrire`) est allongée, et seulement quand on le demande. */
  const origine = window.setTimeout.bind(window);
  window.__opusSuspendreEcritures = false;
  /* LA BASE DE POSTES (lot P) : chaque requête de postes de la
     démonstration attend `pausePostes` dans `attendrePostes`. On les
     COMPTE, et on peut allonger leur pause le temps d'une mesure
     (`__opusPausePostes`, en millisecondes ; `null` = la vraie). */
  window.__opusRequetesPostes = 0;
  window.__opusPausePostes = null;
  window.setTimeout = (f, ms, ...reste) => {
    if (window.__opusSuspendreEcritures && ms === pause && /\becrire\b/.test(String(new Error().stack))) {
      return origine(f, 60000, ...reste);
    }
    if (ms === pausePostes && /\battendrePostes\b/.test(String(new Error().stack))) {
      window.__opusRequetesPostes += 1;
      if (window.__opusPausePostes != null) return origine(f, window.__opusPausePostes, ...reste);
    }
    return origine(f, ms, ...reste);
  };
  /* LES FENÊTRES : `react-native-web` rend une `Modal` avec
     `aria-modal="true"`. On retient le PLUS GRAND nombre jamais présent à
     la fois : « jamais deux feuilles ensemble » se juge à chaque instant,
     pas seulement quand on regarde. */
  window.__opusModales = { max: 0 };
  const compterModales = () => {
    const nb = document.querySelectorAll('[aria-modal="true"]').length;
    if (nb > window.__opusModales.max) window.__opusModales.max = nb;
  };
  new MutationObserver(compterModales).observe(document, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['aria-modal'],
  });
  /* LES ANNONCES À VOICEOVER, relevées une fois branchées (voir le
     démarrage). */
  window.__opusAnnonces = [];
  /* UN MODULE DE L'APPLICATION, par son chemin — tel que Metro l'a chargé
     en développement (`__r.getModules()`). Pour LIRE la base de
     démonstration par `api.mesPostes()`, et écouter les annonces. */
  window.__opusModule = (chemin) => {
    const ms = window.__r && window.__r.getModules ? window.__r.getModules() : null;
    if (!ms) return null;
    for (const [, m] of (ms instanceof Map ? ms.entries() : Object.entries(ms))) {
      if (m && m.isInitialized && m.verboseName === chemin) return m.publicModule.exports;
    }
    return null;
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
}, { pause: PAUSE_DEMO, pausePostes: PAUSE_POSTES });
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
  /* La feuille ouverte (lot P) : la dernière `Modal`, posée par-dessus
     tout le reste, qui reste monté dessous. */
  const modale = [...document.querySelectorAll('[aria-modal="true"]')].pop() || null;
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
      dansModale: !!modale && modale.contains(e),
      /* Une ICÔNE est un glyphe d'une police d'icônes (`@expo/vector-icons`),
         rangé dans la zone d'usage privé d'Unicode : un texte qui n'est
         fait que de ces glyphes et de blancs ne dit rien à qui le lit. */
      icone: [...(e.innerText || '')].every((ch) => {
        const c = ch.codePointAt(0);
        return (c >= 0xe000 && c <= 0xf8ff) || ch.trim() === '';
      }),
    };
  }).filter((c) => c.visible);
});
/* LA SECONDE EXCEPTION NOMMÉE (lot P, cahier §4.9) : la croix d'une
   `FeuilleBas` — une icône sans texte, « Fermer », dans la fenêtre. Elle
   fait 18 × 20 par sa boîte (environ 38 × 40 au doigt par `hitSlop`, que
   le navigateur ignore). Pourquoi elle est tolérée : le VOILE ferme aussi
   la feuille, sur toute la largeur de l'écran ; et la corriger touche
   TOUTES les feuilles du projet — un lot à part, écrit dans A-FAIRE. */
const croixDeFeuille = (c) => c.dansModale && c.icone && c.libelle === 'Fermer';
const exceptionNommee = (c) => EXCEPTIONS.some((r) => r.test(c.libelle)) || croixDeFeuille(c);
/** Juge les cibles hors chrome ; `garder` restreint aux cibles d'un écran du
 *  devis quand d'autres écrans sont montés en dessous (une fenêtre). */
const jugerCibles = async (ou, garder = null) => {
  const toutes = await cibles();
  const jugees = toutes.filter((c) => !c.chrome && (!garder || garder(c)));
  const petites = jugees.filter((c) => (c.h < TOUCHE - 0.5 || c.l < TOUCHE - 0.5) && !exceptionNommee(c));
  const nommees = jugees.filter(exceptionNommee);
  const plusPetite = jugees.filter((c) => !exceptionNommee(c))
    .reduce((m, c) => Math.min(m, c.h, c.l), Infinity);
  verifier(`${ou} : ${jugees.length} cible(s), toutes à ${TOUCHE} points au moins par leur BOÎTE hors exception nommée (la plus petite : ${Number.isFinite(plusPetite) ? plusPetite : '—'})`,
    jugees.length > 0 && petites.length === 0,
    petites.map((c) => `« ${c.libelle} » ${c.l} × ${c.h}`).join(' | '));
  nommees.forEach((c) => noter(`${ou} — exception nommée « ${c.libelle} »${croixDeFeuille(c)
    ? ' (la croix d’une feuille : le voile ferme aussi, sur toute la largeur ; un lot à part)' : ''}`, `${c.l} × ${c.h}`));
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
    /* Une pause de la base allongée ne survit pas à la section qui l'a
       posée : la suivante mesurerait la panne d'une autre. */
    await page.evaluate(() => { window.__opusPausePostes = null; }).catch(() => {});
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
/*  LA BASE DE POSTES (lot P) — de quoi la mesurer                          */
/* ======================================================================== */
const PORTE_BASE = 'Ma base de postes : vos phrases et vos prix de référence';
const AJOUTER_BASE = 'Ajouter cette ligne à ma base de postes';
const RELIRE_BASE = 'Relire vos prix déjà écrits et votre base de postes';
/* La phrase de `ChampDesignation` quand SEULE la base n'a pas pu être lue :
   la mémoire, elle, a répondu. */
const ECHEC_BASE = 'Votre base de postes n’a pas pu être lue : seuls vos prix déjà écrits sont proposés.';
const PREFIXE = 'Reprendre : ';
const FIXE_LE = '\\d\\d/\\d\\d/\\d{4}';
const aujourdhui = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const echapper = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** LA BASE DE POSTES TELLE QUE L'APPLICATION LA LIT (`api.mesPostes`, dans
 *  la page) — une LECTURE, pour les préconditions et pour constater ce
 *  qu'un geste a rangé. Elle passe dans la file des postes (une requête à
 *  la fois) : on ne l'appelle jamais pendant une course qu'on mesure. */
const postesEnBase = () => page.evaluate(async () => {
  const api = window.__opusModule('src/lib/api.js');
  if (!api || typeof api.mesPostes !== 'function') return null;
  const r = await api.mesPostes();
  return (r.postes || []).map((p) => ({
    id: p.id, designation: p.designation, unite: p.unite, fournitureNonComprise: p.fournitureNonComprise,
    mainOeuvre: p.mainOeuvre, prixReferenceCentimes: p.prixReferenceCentimes, prixFixeLe: p.prixFixeLe,
    devisOrigineId: p.devisOrigineId,
  }));
});
/** Les postes de MÊME CLÉ (`cleDeLigne`, la clé de `devis.js` sous `node`). */
const postesDeCle = (postes, v) => (postes || []).filter((p) => cleDeLigne(p) === cleDeLigne({ fournitureNonComprise: false, ...v }));
/** Une section de la base s'ouvre par sa PRÉCONDITION : sinon elle
 *  s'arrête en disant que l'ordre des sections a changé, au lieu d'échouer
 *  plus bas pour une raison qui n'est pas la sienne. */
const exiger = (ok, quoi) => {
  if (!ok) throw new Error(`précondition non tenue — ${quoi} : l’ordre des sections a changé`);
  verifier(`précondition : ${quoi}`, true);
};
/** Les lignes de « Sol du séjour » sont-elles toutes dans la liste ouverte ? */
const sejourEstLa = async () => {
  const ls = await page.locator('button[aria-label$=", ouvrir"]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  return LIGNES_SEJOUR.every((l) => ls.includes(`${l.designation}, ouvrir`))
    && ls.filter((l) => l === `${CHAPE}, ouvrir`).length >= 2;
};
const ouvrirSejour = async () => {
  if (await carteOuverte()) await fermerCarte();
  await allerAMesDevis();
  await ouvrirLeDevis('Sol du séjour');
};
/** Une rangée de la liste par son libellé EXACT (deux chapes ont le même :
 *  la première vaut 52 €, la seconde 38 € « fourniture non comprise »). */
const rangee = (designation, n = 0) => page.locator(`button[aria-label="${designation}, ouvrir"]`).nth(n);

/** Les fenêtres ouvertes, leur texte, le plus grand nombre vu à la fois. */
const modales = () => page.evaluate(() => document.querySelectorAll('[aria-modal="true"]').length);
const texteDeLaFeuille = async () => net(await page.evaluate(() => {
  const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
  return m ? m.innerText : '';
}));
const remettreModalesMax = () => page.evaluate(() => {
  window.__opusModales.max = document.querySelectorAll('[aria-modal="true"]').length;
});
const modalesMax = () => page.evaluate(() => window.__opusModales.max);
const annonces = async () => (await page.evaluate(() => window.__opusAnnonces.slice())).map(net);
const oublierAnnonces = () => page.evaluate(() => { window.__opusAnnonces.length = 0; });
/** Un bouton DE LA FEUILLE, par son texte (la croix et « Fermer » portent
 *  le même libellé : la croix n'a pas de texte). */
const boutonDeLaFeuille = (nom) => page.locator('[aria-modal="true"] button').filter({ hasText: new RegExp(`^${echapper(nom)}$`) }).last();
/* La croix vient AVANT le contenu de la feuille, donc avant tout « Fermer »
   écrit en toutes lettres. */
const croixDeLaFeuille = () => page.locator('[aria-modal="true"]').last().locator('button[aria-label="Fermer"]').first();
const champPrixDeLaFeuille = () => page.locator('[aria-modal="true"] input[aria-label^="Prix de référence"], [aria-modal="true"] input[aria-label^="Taux horaire de référence"]').last();
const attendreModales = (nb, ms = 5000) => jusqua(async () => (await modales()) === nb, ms, 100);

/** LE VOILE d'une feuille, touché en haut de l'écran — là où la feuille ne
 *  le recouvre pas. C'est la sortie de secours : on vérifie que le doigt
 *  tombe bien sur LUI, et pas sur la croix ni sur la feuille. */
const toucherLeVoile = async () => {
  const p = await page.evaluate(() => {
    const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
    if (!m) return null;
    const x = Math.round(window.innerWidth / 2);
    const y = 24;
    const t = document.elementFromPoint(x, y);
    return {
      x, y,
      voile: !!t && m.contains(t) && t.getAttribute('aria-label') === 'Fermer' && t.tagName !== 'BUTTON' && t.getAttribute('role') !== 'button',
    };
  });
  if (!p || !p.voile) throw new Error('le voile de la feuille n’est pas sous le doigt, en haut de l’écran');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
  await new Promise((r) => { setTimeout(r, 40); });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  appuis += 1;
  await attendre(600);
};

/** LES PROPOSITIONS sous la désignation, lues par leurs RANGÉES (préfixe
 *  commun « Reprendre : ») : leur libellé parlé, leur titre et leur détail,
 *  le nombre de lignes de chacun (hauteur ÷ interligne calculé), la hauteur
 *  de la rangée, et si le détail est coupé par sa garde d'une ligne. */
const lirePropositions = async () => (await page.evaluate((prefixe) => [...document.querySelectorAll(`[aria-label^="${prefixe}"]`)]
  .map((e) => {
    const [titre, detail] = [...e.children].filter((c) => (c.innerText || '').trim());
    const lignes = (x) => (x ? Math.round(x.getBoundingClientRect().height / parseFloat(getComputedStyle(x).lineHeight)) : 0);
    return {
      libelle: e.getAttribute('aria-label') || '',
      titre: titre ? titre.innerText : '',
      detail: detail ? detail.innerText : '',
      lignesTitre: lignes(titre),
      lignesDetail: lignes(detail),
      coupe: !!detail && (detail.scrollWidth > detail.clientWidth + 1 || detail.scrollHeight > detail.clientHeight + 1),
      visible: (() => {
        /* CE QUE L'ŒIL LIT du détail, et pas seulement s'il est coupé : les
           caractères dont la boîte tient avant les points de suspension que
           la garde d'une ligne pose au bout (leur largeur mesurée dans la
           police CALCULÉE du détail). Sans cela, « jamais le prix ni
           « fourniture non comprise » » (T23) resterait une promesse. */
        if (!detail) return '';
        const cs = getComputedStyle(detail);
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const ellipse = detail.scrollWidth > detail.clientWidth + 1 ? ctx.measureText(String.fromCharCode(0x2026)).width : 0;
        const limite = detail.getBoundingClientRect().left + detail.clientLeft + detail.clientWidth - ellipse + 0.5;
        const r = document.createRange();
        const marche = document.createTreeWalker(detail, NodeFilter.SHOW_TEXT);
        let vu = '';
        for (let n = marche.nextNode(); n; n = marche.nextNode()) {
          for (let i = 0; i < n.length; i += 1) {
            r.setStart(n, i); r.setEnd(n, i + 1);
            if (r.getBoundingClientRect().right > limite) return vu;
            vu += n.data[i];
          }
        }
        return vu;
      })(),
      h: Math.round(e.getBoundingClientRect().height),
    };
  }), PREFIXE)).map((p) => ({ ...p, libelle: net(p.libelle), titre: net(p.titre), detail: net(p.detail), visible: net(p.visible) }));
/* Toutes les propositions affichées pendant la mesure, pour le compte rendu
   de la propriété « deux lignes + une ligne ». */
const PROPOSITIONS_VUES = [];
/** LA PROPRIÉTÉ D'UNE RANGÉE (CE3-10) : un titre de deux lignes au plus, un
 *  détail d'UNE ligne, 44 points au moins. Le détail peut être coupé par sa
 *  garde — c'est l'historique ou l'origine qui part, jamais le prix ni
 *  « fourniture non comprise » (`detailDeSuggestion`) : on le relève. */
const jugerPropositions = (ou, ps) => {
  const largeur = page.viewportSize().width;
  ps.forEach((p) => PROPOSITIONS_VUES.push({ ou, largeur, ...p }));
  const fautives = ps.filter((p) => p.lignesTitre > 2 || p.lignesTitre < 1 || p.lignesDetail !== 1 || p.h < TOUCHE - 0.5);
  verifier(`${ou}, à ${largeur} : chaque rangée = un titre de deux lignes au plus + un détail d’UNE ligne, 44 points au moins (${ps.map((p) => `${p.lignesTitre}+${p.lignesDetail} l., ${p.h} pt`).join(' ; ')})`,
    ps.length > 0 && fautives.length === 0, fautives.map((p) => `« ${p.titre} » ${p.lignesTitre}+${p.lignesDetail} ${p.h}`).join(' | '));
  /* CE QUE LA GARDE COUPE (T23) : le prix et son unité — le premier morceau
     du détail — et « fourniture non comprise » restent LUS en entier ; seul
     l'historique ou l'origine peut partir. Et un détail non coupé se lit
     tout entier : c'est le témoin de la mesure elle-même. */
  /* Le premier morceau qui porte un montant, et tout ce qui le précède :
     depuis la relecture « écran » (ECRAN9), deux titres identiques
     s'ouvrent par ce qui les distingue (« avec la fourniture »), AVANT le
     prix — la distinction et le prix doivent être lus, tous les deux. */
  const jusquAuPrix = (d) => {
    const m = d.split(' · ');
    const i = m.findIndex((x) => /\d,\d\d €/.test(x));
    return m.slice(0, i < 0 ? 1 : i + 1).join(' · ');
  };
  const mal = ps.filter((p) => !p.visible.startsWith(jusquAuPrix(p.detail))
    || (p.detail.includes('fourniture non comprise') && !p.visible.includes('fourniture non comprise'))
    || (!p.coupe && p.visible !== p.detail));
  verifier(`${ou}, à ${largeur} : ce que l’œil lit du détail garde le prix${ps.some((p) => p.detail.includes('fourniture non comprise')) ? ' et « fourniture non comprise »' : ''} (${ps.map((p) => `« ${p.visible}${p.coupe ? '…' : ''} »`).join(' ; ')})`,
    ps.length > 0 && mal.length === 0, mal.map((p) => `« ${p.detail} » lu « ${p.visible} »`).join(' | '));
  ps.filter((p) => p.coupe).forEach((p) => noter(`${ou} — détail coupé par sa garde d’une ligne`, `« ${p.detail} », lu « ${p.visible}… »`));
};
/** Taper dans la désignation (vidée), attendre que la frappe retombe, et
 *  lire les propositions. */
const taperDesignation = async (t) => {
  await viderEtTaper(parLibelle('Désignation de la ligne'), t);
  await attendre(900);
  return lirePropositions();
};
const toucherProposition = async (i) => toucher(page.locator(`[aria-label^="${PREFIXE}"]`).nth(i));

/** LA CLÉ D'UNE PROPOSITION, reconstruite depuis son LIBELLÉ parlé (la
 *  phrase, « par <unité> », « fourniture non comprise ») par
 *  `rapprochement.js`, sous `node` — jamais lue dans l'écran, qui ne la
 *  connaît pas. */
const NOMS_UNITES = UNITES.map((u) => u.nom).sort((a, b) => b.length - a.length);
const cleDuLibelle = (libelle) => {
  const reste = net(libelle).replace(PREFIXE, '');
  for (const nom of NOMS_UNITES) {
    const marque = `, par ${nom}`;
    const i = reste.indexOf(marque);
    if (i > 0) {
      const r = cleDeRapprochement(reste.slice(0, i));
      const fnc = reste.slice(i + marque.length).startsWith(', fourniture non comprise');
      return r ? JSON.stringify([r, UNITES.find((u) => u.nom === nom).cle, fnc]) : null;
    }
  }
  return null;
};

/** UNE PHRASE DE LA CARTE (la référence, l'écart, …) : son texte, sa boîte,
 *  la couleur CALCULÉE de la phrase et celle de son montant (un `Montant`
 *  posé dedans). */
const phraseDeLaCarte = (debut) => page.evaluate((d) => {
  const net0 = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const e = [...document.querySelectorAll('div[dir="auto"]')].find((x) => net0(x.innerText).startsWith(d)
    && ![...x.children].some((c) => net0(c.innerText).startsWith(d)));
  if (!e) return null;
  const montant = [...e.querySelectorAll('*')].find((s) => /\d,\d\d/.test(s.innerText || '')
    && ![...s.children].some((c) => /\d,\d\d/.test(c.innerText || '')));
  const b = e.getBoundingClientRect();
  return {
    texte: e.innerText, y: b.y, bas: b.y + b.height,
    couleur: getComputedStyle(e).color, couleurMontant: montant ? getComputedStyle(montant).color : null,
    police: `${getComputedStyle(e).fontFamily} ${getComputedStyle(e).fontWeight}`,
  };
}, debut).then((r) => (r ? { ...r, texte: net(r.texte) } : null));

/** Trois captures du même écran, à 390, 375 et 320 points de large — et la
 *  fenêtre remise comme elle était. */
const capturerAuxTroisLargeurs = async (nom, viser = null) => {
  if (!DOSSIER) return;
  const avant = page.viewportSize();
  /* `viser` : un morceau de la phrase MESURÉE. À 375 × 667 et 320 × 568 elle
     tombe souvent sous le pli ; une capture qui ne la montre pas ne prouve
     rien. On l'amène au milieu du cadre, puis on remet chaque défilement où
     il était — les mesures suivantes repartent du même écran. */
  if (viser) {
    await page.evaluate(() => {
      window.__opusDefilements = [...document.querySelectorAll('*')]
        .filter((e) => e.scrollHeight > e.clientHeight + 1).map((e) => [e, e.scrollTop]);
    });
  }
  for (const [l, h] of [[390, 844], [375, 667], [320, 568]]) {
    await page.setViewportSize({ width: l, height: h });
    await attendre(500);
    if (viser) {
      await page.evaluate((m) => {
        const e = [...document.querySelectorAll('div[dir="auto"],span')].reverse().find((x) => (x.innerText || '').includes(m));
        if (e) e.scrollIntoView({ block: 'center' });
      }, viser);
      await attendre(400);
    }
    await page.screenshot({ path: `${DOSSIER}/${nom}-${l}.png` });
  }
  await page.setViewportSize(avant);
  if (viser) {
    await page.evaluate(() => {
      (window.__opusDefilements || []).forEach(([e, t]) => { if (e.isConnected) e.scrollTop = t; });
      window.__opusDefilements = null;
    });
  }
  await attendre(500);
};
/** Retirer la ligne ouverte, en deux appuis. */
const retirerLaLigneOuverte = async () => {
  await toucher(parLibelle('Retirer cette ligne'));
  await toucher(parLibelle('Confirmer : retirer cette ligne'));
};
/** La page « Ma base de postes » est-elle à l'écran ? */
const surLaPage = async () => (await texte()).includes('Vos phrases et vos prix de référence.');
const ouvrirLaPageDepuisMesDevis = async () => {
  if (await carteOuverte()) await fermerCarte();
  await allerAMesDevis();
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
};
/** Une rangée de la page, par sa phrase. */
const rangeeDuPoste = (designation) => page.locator(`[aria-label="Ouvrir le poste ${designation}"]`).first();
/* Le texte d'une rangée SANS ses glyphes d'icônes (le chevron, rangé dans
   la zone d'usage privé d'Unicode par la police d'icônes) : on lit ce qui
   est ÉCRIT. */
const sansIcones = (t) => [...String(t || '')].filter((ch) => {
  const c = ch.codePointAt(0);
  return c < 0xe000 || c > 0xf8ff;
}).join('');
const texteDeLaRangeeDuPoste = async (designation) => net(sansIcones(await rangeeDuPoste(designation).innerText().catch(() => ''))).trim();

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
  /* LES ANNONCES À VOICEOVER (lot P) : `retour.annoncer` appelle
     `AccessibilityInfo.announceForAccessibility`, une fonction VIDE sous
     `react-native-web`. On l'écoute pour savoir qu'une annonce part — ce
     que VoiceOver en fait, seul l'iPhone le dit. */
  const ecoute = await page.evaluate(() => {
    const ai = window.__opusModule('node_modules/react-native-web/dist/exports/AccessibilityInfo/index.js');
    const o = ai && (ai.default || ai);
    if (!o || typeof o.announceForAccessibility !== 'function') return false;
    if (!o.opusEcoute) {
      const avant = o.announceForAccessibility;
      o.announceForAccessibility = function ecouter(t) {
        window.__opusAnnonces.push(String(t));
        return avant.call(this, t);
      };
      o.opusEcoute = true;
    }
    return true;
  });
  verifier('les annonces à VoiceOver sont écoutées (Metro expose ses modules en développement)', ecoute);
  verifier(`la pause de la base de postes est lue dans api.js (${PAUSE_POSTES} ms), et les encres dans theme.js (${ENCRE}, ${GRIS})`,
    PAUSE_POSTES > 0 && !!ENCRE && !!GRIS && !!ORANGE_DE_LECTURE);
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

await section('La base de postes illisible : « Lecture impossible », et la carte s’en passe (lot P)', async () => {
  /* PREMIÈRE de la base, et il le faut : « Lecture impossible » ne se voit
     que sur une PREMIÈRE lecture ratée — une relecture ratée garde la liste
     déjà lue, sous « Liste non actualisée » (cahier §4.7). */
  exiger((await page.evaluate(() => window.__opusRequetesPostes)) === 0, 'la base de postes n’a encore jamais été lue');
  exiger(!!(await page.getByText('Nouveau devis', { exact: true }).count()), '« Mes devis » est à l’écran');
  await page.evaluate(() => { window.__opusPausePostes = 60000; });
  const porte = parLibelle(PORTE_BASE);
  const b = await porte.boundingBox();
  verifier(`« Mes devis » porte « Ma base de postes » : un bouton de 44 points (${b && Math.round(b.width)} × ${b && Math.round(b.height)})`,
    !!b && b.height >= TOUCHE - 0.5);
  await toucher(porte);
  const enLecture = await jusqua(async () => (await texte()).includes('Lecture de votre base de postes…'), 3000, 100);
  verifier('la page s’ouvre sur « Lecture de votre base de postes… »', !!enLecture);
  const t0 = Date.now();
  const impossible = await jusqua(async () => (await texte()).includes('Lecture impossible'), 14000, 200);
  const t = await texte();
  verifier(`la lecture qui ne revient pas : « Lecture impossible », au bout de ${Math.round((Date.now() - t0) / 100) / 10} s`, !!impossible);
  verifier('…jamais « Aucun poste » ni « Votre base est vide » : ce n’est pas qu’elle est vide',
    !/Aucun poste|Votre base est vide/.test(t) && t.includes('Ce n’est pas qu’elle est vide'));
  const reessayer = await page.getByRole('button', { name: 'Réessayer', exact: true }).first().boundingBox();
  verifier(`…avec un vrai « Réessayer » de 44 points (${reessayer && Math.round(reessayer.width)} × ${reessayer && Math.round(reessayer.height)})`,
    !!reessayer && reessayer.height >= TOUCHE - 0.5 && reessayer.width >= TOUCHE - 0.5);
  await capturerAuxTroisLargeurs('p00-base-illisible');
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await ouvrirLeDevis('Sol du séjour');
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  /* LA CARTE, BASE ILLISIBLE : la phrase sous la désignation, UN
     « Réessayer », et le bloc « base » se tait — aucune référence peut-être
     périmée, aucun « Ajouter à ma base » qui ferait un doublon. */
  await toucher(rangee(CHAPE));
  const tc = await texte();
  verifier(`la carte de la chape : « ${ECHEC_BASE} »`, tc.includes(ECHEC_BASE));
  verifier(`…UN seul « Réessayer » (${await page.getByLabel(RELIRE_BASE, { exact: true }).count()})`,
    (await page.getByLabel(RELIRE_BASE, { exact: true }).count()) === 1);
  verifier('…et le bloc ne dit rien : ni référence, ni écart, ni « Ajouter à ma base »',
    !/Votre prix de référence|Vous mettez|Dans votre base|Ce poste existe déjà/.test(tc)
    && (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0
    && (await page.getByText('Changer ma référence', { exact: true }).count()) === 0);
  await capture('p00-carte-base-illisible-390');
  /* LA MÉMOIRE MARCHE ENCORE : une source en panne n'éteint pas l'autre. */
  await toucher(parLibelle(SUIVANT));
  await taper('chape');
  await attendre(900);
  const ps = await lirePropositions();
  verifier(`la mémoire propose encore (« chape » : ${ps.length} proposition(s), aucune de la base)`,
    ps.length >= 1 && ps.every((p) => !/de votre base/.test(p.libelle)), ps.map((p) => p.libelle).join(' | '));
  await retirerLaLigneOuverte();
  /* PENDANT LA LECTURE : aucun « Ajouter à ma base » (on proposerait un
     doublon d'un poste pas encore lu). La ligne du seuil à 25 € est ajoutable dès
     que la base est lue. */
  await toucher(rangee(SEUIL));
  await toucher(parLibelle(RELIRE_BASE));
  await attendre(1500);
  const pendant = await texte();
  verifier('« Réessayer », la lecture repart : pendant qu’elle attend, aucun « Ajouter à ma base », et la phrase d’échec s’efface',
    (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0 && !pendant.includes(ECHEC_BASE));
  const revenu = await jusqua(async () => (await texte()).includes(ECHEC_BASE), 14000, 200);
  verifier('…elle échoue encore : la phrase revient, toujours sans bloc', !!revenu && (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0);
  /* LA LECTURE RÉTABLIE : un appui sur « Réessayer », et le bloc parle. */
  await page.evaluate(() => { window.__opusPausePostes = null; });
  await toucher(parLibelle(RELIRE_BASE));
  const ajoutable = await jusqua(async () => (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 1, 4000, 100);
  verifier('lecture rétablie : la phrase d’échec part, et la ligne du seuil dit « Ajouter à ma base »',
    !!ajoutable && !(await texte()).includes(ECHEC_BASE));
  await fermerCarte();
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await attendre(500);
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
  verifier(`aucune proposition à l’ouverture, des DEUX sources — la mémoire et la base (${nb})`, nb === 0);
  /* …ET LA FRAPPE LES RAPPELLE (CE3-14) : sans cette moitié, un champ qui
     ne proposerait plus jamais rien passerait la mesure au vert. Un « s »
     au bout de la phrase, puis effacé : la phrase revient intacte. */
  const champ = parLibelle('Désignation de la ligne');
  const avant = await champ.inputValue();
  await toucher(champ);
  await page.keyboard.press('Control+End');
  await taper('s');
  await attendre(900);
  const ps = await lirePropositions();
  verifier(`un « s » tapé au bout : au moins une proposition (${ps.length} : ${ps.map((p) => p.titre).join(' | ')})`, ps.length >= 1);
  await page.keyboard.press('Backspace');
  await attendre(400);
  const apres = await champ.inputValue();
  verifier(`le « s » effacé, la phrase est intacte, octet pour octet (« ${apres} »)`, apres === avant && apres === CHAPE);
  await fermerCarte();
});

await section('La deuxième chape : la base d’abord, une proposition par phrase, deux appuis', async () => {
  /* LOT P : la mémoire du lot 1 se regroupe par PHRASE (la clé de
     rapprochement), et la base de postes passe devant à pertinence égale.
     « chape » rendait trois suggestions (45 €, 52 €, 38 €) ; il en rend
     DEUX : le poste de la base à 45 €, qui masque les 52 € et 45 € écrits,
     puis la variante « fourniture non comprise » à 38 € — une autre clé. */
  await ouvrirRangee('Carrelage du sol');
  await page.evaluate(() => { window.__opusFocus = []; window.__opusBlurs = []; });
  appuis = 0;
  await toucher(parLibelle(SUIVANT));
  await taper('chape');
  await attendre(900);
  const ps = await lirePropositions();
  verifier(`exactement DEUX propositions, comptées par leur préfixe commun « ${PREFIXE}» (${ps.length})`, ps.length === 2,
    ps.map((p) => p.libelle).join(' | '));
  /* DEUX TITRES IDENTIQUES SE DISTINGUENT EN TÊTE DU DÉTAIL (relecture
     « écran » du lot P, ECRAN9) : la seule différence entre les deux chapes
     — la fourniture — vient AVANT le prix, à l'encre du texte, et le
     libellé parlé de la première dit « avec la fourniture ». Avant, elle
     n'était que dans la ligne grise de la seconde, après le prix. */
  verifier('…la BASE en tête : « avec la fourniture · 45,00 € / m² · réf. du … », et son libellé le dit',
    !!ps[0] && /, par mètre carré, avec la fourniture, de votre base, prix de référence 45,00 €/.test(ps[0].libelle)
    && new RegExp(`^avec la fourniture · 45,00 € / m² · réf\\. du ${FIXE_LE}$`).test(ps[0].detail), ps[0] && `${ps[0].libelle} — ${ps[0].detail}`);
  verifier('…puis « fourniture non comprise · 38,00 € / m² · … »',
    !!ps[1] && /au prix de 38,00 €/.test(ps[1].libelle) && /, fourniture non comprise,/.test(ps[1].libelle)
    && /^fourniture non comprise · 38,00 € \/ m²/.test(ps[1].detail), ps[1] && `${ps[1].libelle} — ${ps[1].detail}`);
  const encres = await page.evaluate((prefixe) => [...document.querySelectorAll(`[aria-label^="${prefixe}"]`)].map((e) => {
    const detail = [...e.children].filter((c) => (c.innerText || '').trim())[1];
    const premier = detail && [...detail.childNodes].find((n) => n.nodeType === 1 && (n.innerText || '').trim());
    return premier ? { mot: premier.innerText, couleur: getComputedStyle(premier).color, gris: getComputedStyle(detail).color } : null;
  }), PREFIXE);
  verifier(`…la distinction est à l’encre du texte, le reste du détail en gris (${encres.map((x) => x && `« ${x.mot} » ${x.couleur} / ${x.gris}`).join(' ; ')})`,
    encres.length === 2 && encres.every((x) => !!x && x.couleur === ENCRE && x.gris === GRIS)
    && encres[0].mot === 'avec la fourniture' && encres[1].mot === 'fourniture non comprise');
  verifier('…et 52,00 € n’apparaît NULLE PART (masqué par la base)', ps.every((p) => !/52,00/.test(`${p.libelle} ${p.detail}`)));
  const cles = ps.map((p) => cleDuLibelle(p.libelle));
  verifier(`…leurs clés, reconstruites depuis les libellés par rapprochement.js sous node, sont toutes différentes (${cles.join(' ≠ ')})`,
    cles.length === 2 && cles.every(Boolean) && new Set(cles).size === cles.length);
  verifier('…et chaque titre est une phrase RANGÉE, jamais une clé', ps.every((p) => p.titre === CHAPE));
  jugerPropositions('« chape »', ps);
  await capture('10-memoire');
  await page.evaluate(() => { window.__opusFocus = []; window.__opusBlurs = []; });
  await toucherProposition(0);
  const trace = await page.evaluate(() => ({ focus: window.__opusFocus.slice(), blurs: window.__opusBlurs.slice(), actif: document.activeElement && document.activeElement.getAttribute('aria-label') }));
  const dernierFocus = trace.focus[trace.focus.length - 1];
  verifier(`la main passe à la QUANTITÉ (dernier focus donné : « ${dernierFocus} »)`, dernierFocus === 'Quantité', JSON.stringify(trace));
  const perduesOpus = trace.blurs.filter((b) => b.qui === 'Quantité' && !b.rnw);
  verifier('…et aucun code d’Opus ne la lui reprend', perduesOpus.length === 0, JSON.stringify(trace.blurs));
  const perduesRnw = trace.blurs.filter((b) => b.qui === 'Quantité' && b.rnw);
  if (perduesRnw.length) noter('focus repris par react-native-web (fin de défilement, `on-drag`) — pas un défaut d’iOS', `${perduesRnw.length} fois`);
  verifier(`deux appuis en tout (${appuis})`, appuis === 2);
  const designation = await parLibelle('Désignation de la ligne').inputValue();
  verifier(`le champ « Désignation » vaut la phrase de la démonstration, octet pour octet (« ${designation} »)`, designation === CHAPE);
  if (trace.actif !== 'Quantité') await toucher(parLibelle('Quantité'));
  await taper('3');
  await toucher(parLibelle('Prix unitaire HT'));
  const prix = await parLibelle('Prix unitaire HT').inputValue();
  verifier(`le prix recopié est le prix de référence de la base (« ${prix} »)`, prix === '45' || prix === '45,00');
  await fermerCarte();
  modele.push({
    id: 'chape2', ordre: 12000, type: 'poste', designation: 'Chape sèche avant carrelage collé', quantiteMilliemes: 3000, unite: 'm2',
    prixUnitaireCentimes: 4500, tauxTvaCentiemes: tauxRepris(12000), offert: false, mainOeuvre: false, fournitureNonComprise: false,
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

/* ======================================================================== */
/*  LA BASE DE POSTES (lot P, cahier §7.3) — AVANT « Le régime de TVA » :   */
/*  il redéclare le régime, et toute référence deviendrait « fixée avant la */
/*  déclaration » (voir l'en-tête). Chaque section s'ouvre par sa           */
/*  PRÉCONDITION.                                                           */
/* ======================================================================== */

await section('« Sol du séjour », la chape à 52 € : la référence au-dessus du prix, l’écart dessous (lot P)', async () => {
  await ouvrirSejour();
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  const base = await postesEnBase();
  const chape = postesDeCle(base, { designation: CHAPE, unite: 'm2' });
  exiger(chape.length === 1 && chape[0].prixReferenceCentimes === 4500, 'la chape de la base vaut 45,00 € (le poste de démonstration, intact)');
  await toucher(rangee(CHAPE));
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '52', 'la chape de « Sol du séjour » est à 52 €');
  const ref = await phraseDeLaCarte('Votre prix de référence');
  const ecart = await phraseDeLaCarte('Vous mettez');
  const champ = await parLibelle('Prix unitaire HT').boundingBox();
  verifier(`la référence : « ${ref && ref.texte} »`, !!ref && new RegExp(`^Votre prix de référence : 45,00 € / m², fixé le ${FIXE_LE}\\.$`).test(ref.texte));
  verifier(`…AU-DESSUS du champ prix, avant qu’on le tape (bas de la phrase ${ref && Math.round(ref.bas)} ≤ haut du champ ${champ && Math.round(champ.y)})`,
    !!ref && !!champ && ref.bas <= champ.y + 0.5);
  verifier(`l’écart : « ${ecart && ecart.texte} », SOUS le champ (${ecart && Math.round(ecart.y)} ≥ ${champ && Math.round(champ.y + champ.height)})`,
    !!ecart && ecart.texte === 'Vous mettez 52,00 € — c’est voulu ?' && ecart.y >= champ.y + champ.height - 0.5);
  verifier(`les deux phrases en gris, C.muted (${ref && ref.couleur} ; ${ecart && ecart.couleur} ; attendu ${GRIS})`,
    !!ref && !!ecart && ref.couleur === GRIS && ecart.couleur === GRIS);
  verifier(`leurs montants à l’encre du texte, C.ink (${ref && ref.couleurMontant} ; ${ecart && ecart.couleurMontant} ; attendu ${ENCRE})`,
    !!ref && !!ecart && ref.couleurMontant === ENCRE && ecart.couleurMontant === ENCRE);
  verifier(`aucune fenêtre ne s’impose (${await modales()})`, (await modales()) === 0);
  const t = await texte();
  verifier('même phrase que le poste : ni « Ce poste existe déjà », ni la phrase de sortie',
    !t.includes('Ce poste existe déjà') && !t.includes(net(PHRASE_SORTIE)));
  const changer = await parLibelle('Faire de 52,00 € votre prix de référence pour ce poste').boundingBox();
  verifier(`« Changer ma référence », sa réponse sur place : 44 points (${changer && Math.round(changer.width)} × ${changer && Math.round(changer.height)})`,
    !!changer && changer.height >= TOUCHE - 0.5 && changer.width >= TOUCHE - 0.5);
  await jugerMontants('La carte de la chape, avec sa référence et son écart');
  await jugerCibles('La carte de la chape, avec sa référence et son écart', (c) => c.dansCarte);
  await capturerAuxTroisLargeurs('p01-chape-reference-ecart', 'Votre prix de référence');
  /* Le prix remis à 45 : l'écart part, la référence reste. */
  await viderEtTaper(parLibelle('Prix unitaire HT'), '45');
  await toucher(parLibelle('Quantité'));
  await attendre(500);
  const t45 = await texte();
  verifier('prix remis à 45 et champ quitté : l’écart disparaît, la référence reste, « Dans votre base de postes. »',
    !t45.includes('Vous mettez') && t45.includes('Votre prix de référence : 45,00 €') && t45.includes('Dans votre base de postes.'));
  await capture('p01b-chape-sans-ecart-390');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '52');
  await toucher(parLibelle('Quantité'));
  await attendre(500);
  verifier('remis à 52 : la question revient', (await texte()).includes('Vous mettez 52,00 € — c’est voulu ?'));
  await fermerCarte();
});

await section('Q3 a : la liste du devis ne dit RIEN de la référence (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  await toucher(rangee(CHAPE));
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '52', 'la chape de « Sol du séjour » est à 52 €');
  await viderEtTaper(parLibelle('Prix unitaire HT'), '70');
  await toucher(parLibelle(SUIVANT));
  verifier('« Poste suivant » ouvre une ligne neuve', (await carteOuverte()) && (await parLibelle('Désignation de la ligne').inputValue()) === '');
  await fermerCarte();
  verifier('la ligne neuve, vierge, ne reste pas', !(await carteOuverte()) && (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 0);
  const rs = await page.locator('button[aria-label$=", ouvrir"]').evaluateAll((es) => es.map((e) => ({ l: e.getAttribute('aria-label'), t: e.innerText })));
  const ch = rs.find((r) => r.l === `${CHAPE}, ouvrir`);
  verifier(`la rangée de la chape dit SON prix et son total (« ${ch && net(ch.t).replace(/\n/g, ' · ')} »)`,
    !!ch && /× 70,00 €/.test(net(ch.t)) && /1 680,00 €/.test(net(ch.t)));
  verifier('…et RIEN de la référence : ni « réf. », ni « référence », ni 45,00 €', !!ch && !/réf|45,00/.test(net(ch.t)));
  verifier(`aucune rangée de la liste ne dit « réf. » ni « référence » (${rs.length} rangées)`, rs.length > 0 && rs.every((r) => !/réf/.test(net(r.t))));
  await capture('p02-liste-sans-reference-390');
  await toucher(rangee(CHAPE));
  await viderEtTaper(parLibelle('Prix unitaire HT'), '52');
  await toucher(parLibelle('Quantité'));
  await fermerCarte();
  const ch2 = (await rangees()).find((r) => r.libelle === CHAPE);
  verifier(`la chape remise à 52 € (total ${ch2 && euros(ch2.total)})`, !!ch2 && ch2.total === 124800);
});

await section('« Depose… » sans accent : la variante reconnue, la référence qui NOMME le poste (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  const base = await postesEnBase();
  const dep = postesDeCle(base, { designation: DEPOSE, unite: 'm2' });
  exiger(dep.length === 1 && dep[0].prixReferenceCentimes === 1800 && dep[0].designation === DEPOSE, 'la dépose de la base vaut 18,00 €, sous sa phrase accentuée');
  await toucher(rangee(ligneSejour('Depose').designation));
  const ref = await phraseDeLaCarte('Votre prix de référence');
  const champ = await parLibelle('Prix unitaire HT').boundingBox();
  verifier(`la référence NOMME le poste : « ${ref && ref.texte} »`,
    !!ref && new RegExp(`^Votre prix de référence pour « ${echapper(DEPOSE)} » : 18,00 € / m², fixé le ${FIXE_LE}\\.$`).test(ref.texte));
  verifier('…au-dessus du champ prix', !!ref && !!champ && ref.bas <= champ.y + 0.5);
  /* LA PHRASE DU POSTE N'EST CITÉE QU'UNE FOIS (relecture « écran »,
     ECRAN9) : la référence la nomme déjà au-dessus du prix, donc le bloc ne
     la recopie pas — « Ce poste existe déjà dans votre base. » puis la
     sortie, dans UN paragraphe, à la police de la référence (pas en gras :
     sur une ligne où l'artisan n'a rien demandé, il se lisait comme un
     avertissement de doublon). Mesuré à 320 × 568, de la référence au
     bouton : 274 points avant, 254 après. */
  const existe = await phraseDeLaCarte('Ce poste existe déjà');
  const ecart = await phraseDeLaCarte('Vous mettez');
  verifier(`le bloc, un seul paragraphe : « ${existe && existe.texte} »`,
    !!existe && existe.texte === `Ce poste existe déjà dans votre base. ${net(PHRASE_SORTIE)}`);
  verifier(`…à la police et à l’encre de la référence, pas en gras (${existe && existe.police} ; ${ref && ref.police})`,
    !!existe && !!ref && existe.police === ref.police && existe.couleur === ref.couleur);
  const citations = ((await texte()).match(new RegExp(`« ${echapper(DEPOSE)} »`, 'g')) || []).length;
  verifier(`…et la phrase du poste citée UNE fois dans la carte (${citations})`, citations === 1);
  verifier(`…puis l’écart : « ${ecart && ecart.texte} »`, !!ecart && ecart.texte === 'Vous mettez 20,00 € — c’est voulu ?');
  verifier('…dans cet ordre, et sous le champ prix', !!existe && !!ecart && !!champ
    && champ.y + champ.height <= existe.y + 0.5 && existe.y < ecart.y);
  const bouton = await page.getByLabel('Faire de 20,00 € votre prix de référence pour ce poste', { exact: true }).boundingBox();
  if (ref && bouton) noter('de la référence au bouton, à cette largeur', `${Math.round(bouton.y + bouton.height - ref.y)} points (${page.viewportSize().width} de large)`);
  verifier('« Changer ma référence » est là, « Ajouter à ma base » ne l’est PAS',
    (await page.getByLabel('Faire de 20,00 € votre prix de référence pour ce poste', { exact: true }).count()) === 1
    && (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0);
  await capturerAuxTroisLargeurs('p03-depose-variante', 'Ce poste existe déjà');
  await fermerCarte();
});

await section('Les propositions d’une ligne neuve, à 320 points : une par phrase, trois au plus (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  const base = await postesEnBase();
  exiger(postesDeCle(base, { designation: SEUIL, unite: 'u' }).length === 0, 'aucun poste « Seuil de porte… » dans la base');
  exiger(postesDeCle(base, { designation: 'Pose de faïence murale', unite: 'h' }).some((p) => p.prixReferenceCentimes == null)
    && postesDeCle(base, { designation: posteDemo('Faïence murale').designation, unite: 'forfait' }).length === 1,
    'la faïence à l’heure sans prix de référence, et la faïence au forfait, sont dans la base');
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(700);
  await toucher(parLibelle('Ajouter un poste chiffré'));
  verifier('une ligne neuve est ouverte', await carteOuverte());

  /* « seuils » : deux orthographes, UNE rangée, titrée par la plus récente. */
  let ps = await taperDesignation('seuils');
  verifier(`« seuils » : UNE rangée (${ps.length}), titrée « ${ps[0] && ps[0].titre} »`, ps.length === 1 && ps[0].titre === SEUIL);
  verifier(`…détail « ${ps[0] && ps[0].detail} »`, !!ps[0] && ps[0].detail === '25,00 € / u · aussi 23,00 €');
  const libelleSeuil = `${PREFIXE}${SEUIL}, par unité, au prix de 25,00 €, déjà écrit dans Sol du séjour ; aussi écrit à 23,00 €`;
  verifier(`…libellé parlé « ${ps[0] && ps[0].libelle} » — le prix recopié d’abord`,
    !!ps[0] && ps[0].libelle === libelleSeuil && ps[0].libelle.indexOf('25,00') < ps[0].libelle.indexOf('23,00'));
  jugerPropositions('« seuils »', ps);
  await capture('p04a-seuils-320');
  await toucherProposition(0);
  verifier(`un appui recopie 25 et la phrase (« ${await parLibelle('Prix unitaire HT').inputValue()} »)`,
    (await parLibelle('Prix unitaire HT').inputValue()) === '25' && (await parLibelle('Désignation de la ligne').inputValue()) === SEUIL);

  /* « gravats » : la règle de la phrase la plus RÉCENTE, sous les yeux. */
  ps = await taperDesignation('gravats');
  verifier(`« gravats » : UNE rangée, titrée par la plus récente (« ${ps[0] && ps[0].titre} »)`,
    ps.length === 1 && ps[0].titre === ligneSejour('evacuation').designation);
  verifier(`…détail « ${ps[0] && ps[0].detail} »`, !!ps[0] && ps[0].detail === '180,00 € / forfait · aussi 150,00 €');
  jugerPropositions('« gravats »', ps);

  /* « faience » : la base au forfait, puis la faïence sans référence, qui
     porte son dernier prix — et un appui le RECOPIE, par-dessus un prix
     déjà tapé (25, celui du seuil). */
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '25', 'un prix est déjà tapé dans la ligne (25)');
  ps = await taperDesignation('faience');
  verifier(`« faience » : deux rangées, la base au forfait d’abord (${ps.map((p) => p.titre).join(' | ')})`,
    ps.length === 2 && ps[0].titre === posteDemo('Faïence murale').designation && ps[1].titre === 'Pose de faïence murale');
  verifier(`…« ${ps[0] && ps[0].detail} », puis « ${ps[1] && ps[1].detail} »`,
    ps.length === 2 && new RegExp(`^900,00 € / forfait · réf\\. du ${FIXE_LE}$`).test(ps[0].detail)
    && ps[1].detail === 'sans réf. · dernier : 45,00 € / h');
  jugerPropositions('« faience »', ps);
  await capture('p04b-faience-320');
  await toucherProposition(1);
  verifier(`un appui sur « Pose de faïence murale » remplace le prix tapé par 45 (« ${await parLibelle('Taux horaire (HT)').inputValue().catch(() => '?')} »)`,
    (await parLibelle('Taux horaire (HT)').inputValue().catch(() => '')) === '45');
  verifier('…et recopie l’heure et la main-d’œuvre', (await parLibelle('heure').getAttribute('aria-selected')) === 'true'
    && (await page.getByRole('switch', { name: /^Main-d’œuvre/ }).getAttribute('aria-checked')) === 'true');

  /* « Pos » : exactement les trois « Pose », jamais « Dépose » en tête. */
  ps = await taperDesignation('Pos');
  verifier(`« Pos » : exactement TROIS, les trois « Pose » (${ps.map((p) => p.titre).join(' | ')})`,
    ps.length === 3 && ps.every((p) => p.titre.startsWith('Pose')));
  jugerPropositions('« Pos »', ps);
  await capture('p04c-pos-320');

  /* « Dalles », « beton » : la réponse du propriétaire du 23/10 — un s, un
     accent, et le poste se retrouve. */
  for (const q of ['Dalles', 'beton']) {
    ps = await taperDesignation(q);
    verifier(`« ${q} » propose la dalle de la base (${ps.map((p) => p.titre).join(' | ') || 'rien'})`, ps.some((p) => p.titre === DALLE && /de votre base/.test(p.libelle)));
    jugerPropositions(`« ${q} »`, ps);
  }
  /* « chape », à 320 cette fois : la propriété de la rangée vaut à la plus
     petite largeur, pas seulement à 390 (« La deuxième chape »). */
  ps = await taperDesignation('chape');
  verifier(`« chape », à 320 : les deux mêmes propositions, la base d’abord (${ps.map((p) => p.detail).join(' | ')})`,
    ps.length === 2 && /de votre base, prix de référence 45,00 €/.test(ps[0].libelle) && /fourniture non comprise/.test(ps[1].libelle));
  jugerPropositions('« chape »', ps);
  await capture('p04d-chape-320');
  noter('un poste SANS référence et SANS dernier prix laisse le prix tapé en place (T10)',
    'la démonstration n’en a pas — c’est le cas 16 de verifier-postes, sous node');
  /* « Les », « Sas », « Aux » : rien — un mot court ne trouve que ce qui le
     CONTIENT, comme au lot 1. */
  for (const q of ['Les', 'Sas', 'Aux']) {
    ps = await taperDesignation(q);
    verifier(`« ${q} » : AUCUNE proposition (${ps.length})`, ps.length === 0, ps.map((p) => p.titre).join(' | '));
  }
  await retirerLaLigneOuverte();
  verifier('la ligne d’essai retirée', !(await carteOuverte()) && (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
});

await section('Une ligne SANS PRIX ne vide pas la proposition de son groupe (lot P, CE3-2)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  exiger(postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 0, 'aucun poste « Seuil de porte… » dans la base');
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper(SEUIL);
  await toucher(parLibelle('unité'));
  await fermerCarte();
  verifier('une ligne « Seuil de porte… » sans prix est dans le devis, incomplète',
    (await page.locator(`button[aria-label="${SEUIL}, ouvrir"]`).count()) === 2
    && (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 1);
  await toucher(parLibelle('Ajouter un poste chiffré'));
  const ps = await taperDesignation('seuils');
  verifier(`« seuils » : UNE rangée, titrée par cette phrase (« ${ps[0] && ps[0].titre} »)`, ps.length === 1 && ps[0].titre === SEUIL);
  verifier(`…qui porte le prix écrit, pas un vide (« ${ps[0] && ps[0].detail} »)`, !!ps[0] && /^25,00 € \/ u/.test(ps[0].detail));
  await toucherProposition(0);
  verifier(`un appui recopie 25 (« ${await parLibelle('Prix unitaire HT').inputValue()} »)`, (await parLibelle('Prix unitaire HT').inputValue()) === '25');
  await retirerLaLigneOuverte();
  await toucher(parLibelle('Ligne incomplète. La compléter'));
  verifier('« La compléter » rouvre la ligne sans prix', (await parLibelle('Désignation de la ligne').inputValue()) === SEUIL
    && (await parLibelle('Prix unitaire HT').inputValue()) === '');
  await retirerLaLigneOuverte();
  verifier('les deux lignes d’essai retirées, en deux appuis chacune', !(await carteOuverte())
    && (await page.getByLabel('Ligne incomplète. La compléter', { exact: true }).count()) === 0 && await sejourEstLa());
});

await section('Une ligne neuve « chapes seches avant carrelage colle » : ce poste existe déjà (lot P)', async () => {
  const chape = postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' });
  exiger(chape.length === 1 && chape[0].designation === CHAPE && chape[0].prixReferenceCentimes === 4500, 'la chape de la base vaut 45,00 €, sous sa phrase');
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('chapes seches avant carrelage colle');
  await toucher(parLibelle('mètre carré'));
  await attendre(500);
  const existe = await phraseDeLaCarte('Ce poste existe déjà');
  const ref = await phraseDeLaCarte('Votre prix de référence');
  const champ = await parLibelle('Prix unitaire HT').boundingBox();
  verifier('pas d’« Ajouter à ma base »', (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0);
  /* La référence nomme le poste au-dessus : le bloc ne recopie pas sa
     phrase (ECRAN9), et la sortie suit dans le même paragraphe. */
  verifier(`« ${existe && existe.texte} » — sans recopier la phrase du poste`,
    !!existe && existe.texte === `Ce poste existe déjà dans votre base. ${net(PHRASE_SORTIE)}`);
  const citations = ((await texte()).match(new RegExp(`« ${echapper(CHAPE)} »`, 'g')) || []).length;
  verifier(`la phrase du poste citée UNE fois dans la carte (${citations})`, citations === 1);
  verifier(`la référence, au-dessus du prix, NOMME le poste : « ${ref && ref.texte} »`,
    !!ref && !!champ && ref.bas <= champ.y + 0.5
    && new RegExp(`^Votre prix de référence pour « ${echapper(CHAPE)} » : 45,00 € / m², fixé le ${FIXE_LE}\\.$`).test(ref.texte));
  await capture('p05-variante-ligne-neuve-390');
  await retirerLaLigneOuverte();
  verifier('la ligne d’essai retirée', !(await carteOuverte()));
});

await section('La chape « fourniture non comprise » → « Ajouter à ma base » : une seule ligne de poste proche (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  const base = await postesEnBase();
  exiger(postesDeCle(base, { designation: CHAPE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 4500)
    && postesDeCle(base, { designation: CHAPE, unite: 'm2', fournitureNonComprise: true }).length === 0,
    'la chape avec la fourniture vaut 45,00 €, la chape sans la fourniture n’est pas dans la base');
  await toucher(rangee(CHAPE, 1));
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '38', 'la seconde chape est celle à 38 €, fourniture non comprise');
  await remettreModalesMax();
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  const tf = await texteDeLaFeuille();
  const proche = `Déjà dans votre base, avec la fourniture : « ${CHAPE} » (45,00 € / m²).`;
  verifier(`la feuille montre UNE ligne : « ${proche} »`, tf.includes(proche) && (tf.match(/Déjà dans votre base/g) || []).length === 1, tf.slice(0, 400));
  verifier(`…le prix proposé est celui de la ligne (« ${await champPrixDeLaFeuille().inputValue()} »)`, (await champPrixDeLaFeuille().inputValue()) === '38');
  await jugerCibles('La feuille d’ajout', (c) => c.dansModale);
  await capturerAuxTroisLargeurs('p06-feuille-ajout-proche');
  const croix = await croixDeLaFeuille().boundingBox();
  noter('la croix de la feuille, par sa boîte (exception nommée)', croix ? `${Math.round(croix.width)} × ${Math.round(croix.height)}` : '?');
  await toucher(croixDeLaFeuille());
  verifier('la croix ferme la feuille sans rien ajouter ; la carte est toujours ouverte', (await modales()) === 0 && await carteOuverte()
    && postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2', fournitureNonComprise: true }).length === 0);
  verifier(`une seule fenêtre à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await fermerCarte();
});

/** LA COURSE « CE POSTE EXISTE DÉJÀ » (CE3-6, CE3-8) — deux ajouts du même
 *  poste qui se croisent : le premier part depuis « Seuil… » (25 €), sa
 *  feuille fermée par le voile PENDANT l'envoi ; la carte de « Seuils… »
 *  (23 €) dit encore « Ajouter à ma base », puisque le premier n'est pas
 *  arrivé ; on y porte `prix`, on valide. La feuille passe d'elle-même à
 *  « Ce poste existe déjà ». La pause de la base est de 7 s, toujours sous
 *  le délai de 8 s. Le cahier dit 5 s ; 7 s laisse plus de marge : la
 *  seconde ligne s'ouvre environ 2,4 s après le premier envoi (mesuré), et
 *  il faut encore ouvrir sa feuille, y taper le prix et valider avant que
 *  le premier ajout n'arrive. Si la course n'a pas lieu, la section le DIT
 *  et s'arrête, au lieu de mesurer autre chose. */
const PAUSE_COURSE = 7000;
const courseExisteDeja = async (prix) => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  exiger(postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 0, 'aucun poste « Seuil de porte… » dans la base');
  await remettreModalesMax();
  await oublierAnnonces();
  await page.evaluate((ms) => { window.__opusPausePostes = ms; }, PAUSE_COURSE);
  await toucher(rangee(SEUIL));
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  verifier(`le premier ajout : « Seuil… » propose 25 (« ${await champPrixDeLaFeuille().inputValue()} »)`, (await champPrixDeLaFeuille().inputValue()) === '25');
  const t0 = Date.now();
  await toucher(boutonDeLaFeuille('Ajouter à ma base'));
  verifier('…« Enregistrement… » pendant l’envoi', (await boutonDeLaFeuille('Enregistrement…').count()) === 1);
  await toucherLeVoile();
  verifier('…la feuille fermée par le VOILE pendant l’envoi', (await modales()) === 0);
  await fermerCarte();
  await toucher(rangee(SEUILS));
  const encore = (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 1;
  verifier(`la carte de « Seuils… » dit ENCORE « Ajouter à ma base » (${Date.now() - t0} ms après le premier envoi)`, encore);
  if (!encore) throw new Error('le premier ajout est arrivé avant la seconde ligne : la course n’a pas eu lieu');
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  await viderEtTaper(champPrixDeLaFeuille(), String(prix));
  await toucher(boutonDeLaFeuille('Ajouter à ma base'));
  const existe = await jusqua(async () => (await texteDeLaFeuille()).includes(`Le poste : « ${SEUIL} »`), 15000, 150);
  verifier(`la feuille passe d’ELLE-MÊME à « Ce poste existe déjà » (${Date.now() - t0} ms après le premier envoi)`, !!existe);
  const tf = await verifierLaFeuilleExisteDeja();
  return { t0, tf };
};
/** CE QUE MONTRE LA FEUILLE « CE POSTE EXISTE DÉJÀ » (CE3-8, et la relecture
 *  « écran » : ECRAN8, ECRAN10) — son titre, dit UNE fois ; le poste, son
 *  unité dite en mots (« À l’unité », jamais « Unité : unité » — TEXTES16) ; et la
 *  DÉCISION (le prix, les boutons) AVANT les explications (votre ligne, ce
 *  qu'Opus reconnaît, la sortie) : à 320 × 568 elles poussaient « Fermer »
 *  sous le pli. */
const verifierLaFeuilleExisteDeja = async () => {
  const tf = await texteDeLaFeuille();
  verifier('…elle montre le poste, son unité en mots, la ligne, l’explication et la sortie',
    tf.startsWith('Ce poste existe déjà') && tf.includes(`Le poste : « ${SEUIL} »`) && tf.includes('À l’unité')
    && !tf.includes('Unité :')
    && tf.includes(`Votre ligne : « ${SEUILS} »`)
    && tf.includes('Opus la reconnaît comme la phrase de ce poste : majuscules, accents, espaces, ponctuation et pluriel mis à part.')
    && tf.includes(net(PHRASE_SORTIE)), tf.slice(0, 500));
  verifier('…son titre n’est pas redit à la ligne suivante (« Ce poste existe déjà dans votre base. » n’y est plus)',
    (tf.match(/Ce poste existe déjà/g) || []).length === 1);
  const ordre = await page.evaluate(() => {
    const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
    if (!m) return null;
    const haut = (debut) => {
      const e = [...m.querySelectorAll('div[dir="auto"]')].find((x) => (x.innerText || '').trim().startsWith(debut));
      return e ? e.getBoundingClientRect().top : null;
    };
    const fermer = [...m.querySelectorAll('button')].filter((b) => (b.innerText || '').trim() === 'Fermer').pop();
    return { fermer: fermer ? fermer.getBoundingClientRect().top : null, ligne: haut('Votre ligne'), sortie: haut('Ce n’est pas le même travail') };
  });
  verifier(`…la décision avant les explications : « Fermer » (${ordre && Math.round(ordre.fermer)}) au-dessus de « Votre ligne » (${ordre && Math.round(ordre.ligne)}) et de la sortie (${ordre && Math.round(ordre.sortie)})`,
    !!ordre && ordre.fermer != null && ordre.ligne != null && ordre.sortie != null && ordre.fermer < ordre.ligne && ordre.ligne < ordre.sortie);
  verifier('…et aucun bouton pour créer un second poste ni remplacer sa phrase',
    (await boutonDeLaFeuille('Ajouter à ma base').count()) === 0 && !/Remplacer|second poste/.test(tf));
  return tf;
};
/** OÙ TOMBE LA DÉCISION DE LA FEUILLE : le champ du prix, « Changer ma
 *  référence », « Fermer » — et la LIMITE de ce qu'on voit sans défiler :
 *  le bas de l'écran, ou celui de la zone qui défile s'il est plus haut
 *  (un bouton coupé par elle n'est pas atteignable). */
const decisionDeLaFeuille = () => page.evaluate(() => {
  const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
  if (!m) return null;
  const bouton = (t) => [...m.querySelectorAll('button')].filter((b) => (b.innerText || '').trim() === t).pop();
  const champ = m.querySelector('input[aria-label^="Prix de référence"]');
  const elements = [['champ', champ], ['Changer ma référence', bouton('Changer ma référence')], ['Fermer', bouton('Fermer')]]
    .filter(([, e]) => !!e).map(([nom, e]) => {
      const b = e.getBoundingClientRect();
      return { nom, haut: b.top, bas: b.bottom };
    });
  let limite = window.innerHeight;
  for (let e = champ && champ.parentElement; e && e !== document.body; e = e.parentElement) {
    const o = getComputedStyle(e).overflowY;
    if (o === 'auto' || o === 'scroll' || o === 'hidden') limite = Math.min(limite, e.getBoundingClientRect().bottom);
  }
  return { elements, limite };
});
/** La file des postes vidée : la pause remise, puis une lecture — elle passe
 *  APRÈS le second ajout (son refus 23505) et la relecture qu'il déclenche. */
const viderLaFileDesPostes = async () => {
  await page.evaluate(() => { window.__opusPausePostes = null; });
  return postesEnBase();
};

await section('« Ce poste existe déjà » : la course, le prix porté égal à la référence (25 €) — « Fermer » seul (lot P)', async () => {
  const { tf } = await courseExisteDeja(25);
  verifier('« Il a déjà ce prix de référence : 25,00 € / u, fixé le … »', new RegExp(`Il a déjà ce prix de référence : 25,00 € / u, fixé le ${FIXE_LE}\\.`).test(tf), tf.slice(0, 500));
  verifier('…et le SEUL bouton « Fermer » : ni champ, ni « Changer ma référence »',
    (await boutonDeLaFeuille('Fermer').count()) === 1 && (await boutonDeLaFeuille('Changer ma référence').count()) === 0
    && (await champPrixDeLaFeuille().count()) === 0);
  await capture('p07a-existe-deja-meme-prix-390');
  const apres = await viderLaFileDesPostes();
  const seuils = postesDeCle(apres, { designation: SEUIL, unite: 'u' });
  verifier(`UN seul poste de cette clé dans la base de démonstration (${seuils.length}), à 25,00 €, sous la phrase du PREMIER ajout`,
    seuils.length === 1 && seuils[0].prixReferenceCentimes === 2500 && seuils[0].designation === SEUIL);
  verifier(`le premier ajout, fermé pendant l’envoi, a quand même été ANNONCÉ (« ${(await annonces()).join(' | ')} »)`,
    (await annonces()).includes('Ajouté à votre base de postes.'));
  verifier(`jamais deux fenêtres à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await toucher(boutonDeLaFeuille('Fermer'));
  verifier('« Fermer » : la feuille part, la carte reste', (await modales()) === 0 && await carteOuverte());
  await fermerCarte();
});

await section('Retirer un poste depuis « Ma base de postes », en deux appuis (lot P)', async () => {
  exiger(postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 1, 'le poste « Seuil de porte… » est dans la base');
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  const avant = Number(((await texte()).match(/(\d+) postes/) || [])[1]);
  await oublierAnnonces();
  await toucher(rangeeDuPoste(SEUIL));
  await attendreModales(1);
  await toucher(parLibelle('Retirer ce poste de ma base'));
  /* CE QUI ARRIVERA VRAIMENT (relecture « textes », TEXTES2) : la mémoire
     des prix peut reproposer la phrase — jamais « plus proposé sur vos
     devis ». */
  const tRetrait = await texteDeLaFeuille();
  verifier('le premier appui ne retire rien : il demande, et dit ce qui arrivera — la mémoire peut reproposer la phrase',
    (await modales()) === 1 && (await page.getByLabel('Confirmer : retirer ce poste de ma base', { exact: true }).count()) === 1
    && tRetrait.includes(net(PHRASE_RETRAIT_DU_POSTE)) && !tRetrait.includes('plus proposé sur vos devis'), tRetrait.slice(-300));
  await toucher(parLibelle('Confirmer : retirer ce poste de ma base'));
  await attendreModales(0);
  const apres = Number(((await texte()).match(/(\d+) postes?/) || [])[1]);
  verifier(`le second retire : la page passe de ${avant} à ${apres} postes, la rangée disparaît`,
    apres === avant - 1 && (await rangeeDuPoste(SEUIL).count()) === 0);
  verifier('…c’est annoncé, et la base ne l’a plus', (await annonces()).includes('Le poste est retiré de votre base.')
    && postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 0);
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await ouvrirLeDevis('Sol du séjour');
});

await section('« Ce poste existe déjà » : la même course, prix porté à 24 € — « Changer ma référence » (lot P)', async () => {
  const { tf } = await courseExisteDeja(24);
  verifier('« Son prix de référence : 25,00 € / u, fixé le … »', new RegExp(`Son prix de référence : 25,00 € / u, fixé le ${FIXE_LE}\\.`).test(tf), tf.slice(0, 500));
  verifier(`…le champ vaut 24 — le prix TAPÉ, gardé (« ${await champPrixDeLaFeuille().inputValue()} »)`, (await champPrixDeLaFeuille().inputValue()) === '24');
  /* Tant que le SECOND ajout est en route (il recevra le refus 23505), la
     feuille le dit : son bouton porte « Enregistrement… ». Une requête de
     cette feuille est bel et bien partie. */
  noter('pendant que le second ajout est en route, le bouton de la feuille dit', (await boutonDeLaFeuille('Enregistrement…').count()) === 1 ? '« Enregistrement… »' : '« Changer ma référence »');
  await viderLaFileDesPostes();
  await attendre(400);
  verifier('le second ajout revenu (23505, puis la base relue) : « Changer ma référence » et « Fermer »',
    (await boutonDeLaFeuille('Changer ma référence').count()) === 1 && (await boutonDeLaFeuille('Fermer').count()) === 1
    && (await champPrixDeLaFeuille().inputValue()) === '24');
  await jugerCibles('La feuille « Ce poste existe déjà »', (c) => c.dansModale);
  /* À 320 × 568 (relecture « écran », ECRAN10) : le champ, « Changer ma
     référence » et « Fermer » tiennent dans l'écran ET dans la zone qui
     défile, sans défiler. Avant, les explications passaient d'abord :
     « Changer ma référence » était coupé par le bas de la zone, « Fermer »
     à 568–612, hors de l'écran. */
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(700);
  const pos = await decisionDeLaFeuille();
  verifier(`à 320 × 568, la décision est atteignable SANS DÉFILER (${pos && pos.elements.map((e) => `${e.nom} ${Math.round(e.haut)}–${Math.round(e.bas)}`).join(', ')} ; limite ${pos && Math.round(pos.limite)})`,
    !!pos && pos.elements.length === 3 && pos.elements.every((e) => e.haut >= 0 && e.bas <= pos.limite + 0.5));
  await capture('p07c-existe-deja-24-320');
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
  await capturerAuxTroisLargeurs('p07b-existe-deja-24');
  await oublierAnnonces();
  await toucher(boutonDeLaFeuille('Changer ma référence'));
  await attendreModales(0);
  const seuils = postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' });
  verifier(`« Changer ma référence » : le poste vaut 24,00 € (${seuils.map((p) => euros(p.prixReferenceCentimes)).join(', ')}), et il reste UN seul poste de cette clé`,
    seuils.length === 1 && seuils[0].prixReferenceCentimes === 2400);
  verifier('…c’est annoncé', (await annonces()).includes('Votre prix de référence est changé.'));
  verifier(`jamais deux fenêtres à la fois, sur toute la course (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`la carte de « Seuils… » : la référence nomme le poste, à 24,00 € (« ${ref && ref.texte} »), et l’écart parle`,
    !!ref && ref.texte.startsWith(`Votre prix de référence pour « ${SEUIL} » : 24,00 € / u`)
    && (await texte()).includes('Vous mettez 23,00 € — c’est voulu ?'));
  await fermerCarte();
});

/** Retirer un poste depuis « Ma base de postes », en deux appuis, puis
 *  revenir à « Sol du séjour » — la remise en état d'une section qui a
 *  besoin que ce poste n'existe pas encore. */
const retirerDeLaBase = async (designation) => {
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  await toucher(rangeeDuPoste(designation));
  await attendreModales(1);
  await toucher(parLibelle('Retirer ce poste de ma base'));
  await toucher(parLibelle('Confirmer : retirer ce poste de ma base'));
  await attendreModales(0);
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await ouvrirLeDevis('Sol du séjour');
};

await section('« Ce poste existe déjà » qui arrive PENDANT la frappe : le prix tapé reste (lot P, ECRAN4)', async () => {
  /* La relecture « écran » (ECRAN4) : la course, mais le second prix tapé
     SANS quitter le champ ni valider. Le premier ajout arrive pendant ce
     temps ; la feuille jugeait « même prix » sur le prix PORTÉ (25) et
     retirait le champ — le 24 disparaissait sans un mot. Elle juge
     désormais sur ce que l'artisan a touché : un prix tapé garde le
     champ, et « Changer ma référence ». */
  if (postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length) await retirerDeLaBase(SEUIL);
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  exiger(postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' }).length === 0, 'aucun poste « Seuil de porte… » dans la base');
  await remettreModalesMax();
  await oublierAnnonces();
  await page.evaluate((ms) => { window.__opusPausePostes = ms; }, PAUSE_COURSE);
  await toucher(rangee(SEUIL));
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  const t0 = Date.now();
  await toucher(boutonDeLaFeuille('Ajouter à ma base'));
  await toucherLeVoile();
  await fermerCarte();
  await toucher(rangee(SEUILS));
  const encore = (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 1;
  verifier(`la carte de « Seuils… » dit ENCORE « Ajouter à ma base » (${Date.now() - t0} ms après le premier envoi)`, encore);
  if (!encore) throw new Error('le premier ajout est arrivé avant la seconde ligne : la course n’a pas eu lieu');
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  await viderEtTaper(champPrixDeLaFeuille(), '24');
  const avant = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('aria-label'));
  verifier(`24 tapé, le champ garde le curseur, rien n’est validé (« ${avant} »)`, /^Prix de référence/.test(avant || '') && (await modales()) === 1);
  const arrive = await jusqua(async () => (await texteDeLaFeuille()).includes(`Le poste : « ${SEUIL} »`), 15000, 150);
  verifier(`la feuille passe d’ELLE-MÊME à « Ce poste existe déjà » (${Date.now() - t0} ms après le premier envoi)`, !!arrive);
  const tf = await verifierLaFeuilleExisteDeja();
  verifier(`…le champ est LÀ et vaut 24 — le prix tapé, gardé (« ${(await champPrixDeLaFeuille().count()) ? await champPrixDeLaFeuille().inputValue() : 'aucun champ'} »)`,
    (await champPrixDeLaFeuille().count()) === 1 && (await champPrixDeLaFeuille().inputValue()) === '24');
  verifier('…« Son prix de référence : 25,00 € », jamais « Il a déjà ce prix », et « Changer ma référence »',
    tf.includes('Son prix de référence : 25,00 € / u') && !tf.includes('Il a déjà ce prix')
    && (await boutonDeLaFeuille('Changer ma référence').count()) === 1);
  await capture('p07d-existe-deja-pendant-la-frappe-390');
  await viderLaFileDesPostes();
  await oublierAnnonces();
  await toucher(boutonDeLaFeuille('Changer ma référence'));
  await attendreModales(0);
  const seuils = postesDeCle(await postesEnBase(), { designation: SEUIL, unite: 'u' });
  verifier(`« Changer ma référence » : le poste vaut 24,00 € (${seuils.map((p) => euros(p.prixReferenceCentimes)).join(', ')}), UN seul poste`,
    seuils.length === 1 && seuils[0].prixReferenceCentimes === 2400 && (await annonces()).includes('Votre prix de référence est changé.'));
  verifier(`jamais deux fenêtres à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await fermerCarte();
});

await section('« Dépose de l’évier chez Mme Exemple » → « Ajouter à ma base » : l’avertissement, jamais un refus (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('Dépose de l’évier chez Mme Exemple');
  await toucher(parLibelle('unité'));
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  const tf = await texteDeLaFeuille();
  const avert = 'Cette phrase contient une formule comme « chez » ou « Mme », qui désigne souvent un client. Elle resterait dans votre base même si vous supprimez ce client.';
  verifier(`l’avertissement : « ${avert} »`, tf.includes(avert), tf.slice(0, 600));
  const filet = await page.evaluate((a) => {
    const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
    const e = m && [...m.querySelectorAll('div[dir="auto"]')].find((x) => (x.innerText || '').startsWith(a.slice(0, 30)));
    return e && e.parentElement ? { bord: getComputedStyle(e.parentElement).borderLeftColor, encre: getComputedStyle(e).color } : null;
  }, avert);
  verifier(`…encre du texte, filet ORANGE DE LECTURE (${filet && filet.encre}, ${filet && filet.bord})`,
    !!filet && filet.encre === ENCRE && filet.bord === ORANGE_DE_LECTURE);
  verifier('…et le bouton reste ACTIF : un faux positif existe (« M. Blanc » et « blanc cassé »)',
    (await boutonDeLaFeuille('Ajouter à ma base').getAttribute('aria-disabled')) !== 'true');
  await capturerAuxTroisLargeurs('p08-avertissement-client');
  await toucherLeVoile();
  verifier('le voile ferme la feuille, rien n’est ajouté', (await modales()) === 0);
  await retirerLaLigneOuverte();
  verifier('la ligne d’essai retirée', !(await carteOuverte()));
});

await section('La chape à 52 € → « Changer ma référence » : la feuille du poste, PAR-DESSUS la carte (lot P)', async () => {
  exiger(await sejourEstLa(), 'les six lignes de « Sol du séjour » sont là');
  exiger(postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 4500), 'la chape de la base vaut 45,00 €');
  await toucher(rangee(CHAPE));
  exiger((await parLibelle('Prix unitaire HT').inputValue()) === '52', 'la chape de « Sol du séjour » est à 52 €');
  await remettreModalesMax();
  await oublierAnnonces();
  await toucher(parLibelle('Faire de 52,00 € votre prix de référence pour ce poste'));
  await attendreModales(1);
  const tf = await texteDeLaFeuille();
  verifier(`la feuille du poste, pré-remplie avec le prix de la LIGNE (« ${await champPrixDeLaFeuille().inputValue()} »)`,
    tf.startsWith('Prix de référence') && tf.includes(CHAPE) && (await champPrixDeLaFeuille().inputValue()) === '52');
  verifier('…posée PAR-DESSUS la carte, qui reste montée dessous', (await page.getByLabel(RETOUR_CARTE, { exact: true }).count()) === 1);
  /* LE PRIX ACTUEL EST ÉCRIT (relecture « écran », ECRAN3) : le champ porte
     52, le prix de la LIGNE ; « Le prix actuel a été fixé le … », seul, se
     lisait comme si 52 € était déjà la référence. */
  verifier('…la feuille DIT le prix actuel : « Votre prix de référence actuel : 45,00 € / m², fixé le … »',
    new RegExp(`Votre prix de référence actuel : 45,00 € / m², fixé le ${FIXE_LE}\\.`).test(tf) && !tf.includes('Le prix actuel a été fixé'), tf.slice(0, 400));
  /* DEPUIS LA CARTE, RIEN NE SE RETIRE (ECRAN2) : on venait « changer sa
     référence » ; deux boutons qui détruisent (« Retirer le prix », 8 points
     sous « Enregistrer », en UN appui ; « Retirer ce poste ») ne s'y
     montrent plus. Retirer se fait dans la page, où l'on vient pour ça, et
     la feuille le dit. */
  verifier('…aucun « Retirer » depuis la carte, et la phrase qui renvoie à la page',
    (await boutonDeLaFeuille('Retirer le prix de référence').count()) === 0 && (await boutonDeLaFeuille('Retirer ce poste').count()) === 0
    && tf.includes('Pour retirer ce prix ou ce poste, ouvrez « Ma base de postes ».'));
  await jugerCibles('La feuille d’un poste, depuis la carte', (c) => c.dansModale);
  await capturerAuxTroisLargeurs('p09-feuille-poste');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await attendreModales(0);
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`« Enregistrer » : « ${ref && ref.texte} »`, !!ref && ref.texte === `Votre prix de référence : 52,00 € / m², fixé le ${aujourdhui()}.`);
  verifier('…l’écart disparaît, la carte est toujours ouverte, l’écran n’a pas quitté la saisie',
    !(await texte()).includes('Vous mettez') && await carteOuverte() && await dansLaSaisie());
  verifier('…c’est annoncé, et la base le dit', (await annonces()).includes('Votre prix de référence est changé.')
    && postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 5200));
  verifier(`une seule fenêtre à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await capture('p09b-reference-changee-390');
  await fermerCarte();
});

await section('La faïence (12 h) devient un forfait : la phrase qui le DIT, puis s’efface (lot P, T11)', async () => {
  await allerAMesDevis();
  await ouvrirLeDevis('Rénovation salle de bains');
  const faience = ligneDe('Pose de faïence murale');
  exiger(faience.quantiteMilliemes === 12000 && faience.unite === 'h' && faience.prixUnitaireCentimes === 4500 && !faience.offert,
    'la faïence de « Rénovation salle de bains » est à 12 h, à 45 €');
  exiger(postesDeCle(await postesEnBase(), { designation: posteDemo('Faïence murale').designation, unite: 'forfait' }).length === 1,
    'la faïence au forfait est dans la base');
  await ouvrirRangee('Pose de faïence murale');
  let ps = await taperDesignation('faïence');
  const auForfait = ps.findIndex((p) => p.titre === posteDemo('Faïence murale').designation);
  exiger(auForfait >= 0, '« faïence » propose la faïence au forfait');
  await toucherProposition(auForfait);
  const attendue = net(changementDUnite({ unite: 'h', quantiteMilliemes: 12000 }, { unite: 'forfait' }));
  const phrase = await phraseDeLaCarte('L’unité est passée');
  const unites = await page.evaluate((noms) => Math.max(...noms.map((nom) => {
    const e = document.querySelector(`[aria-label="${nom}"]`);
    return e ? e.getBoundingClientRect().bottom : 0;
  })), UNITES.map((u) => u.nom));
  const taux = await parLibelle('TVA à 10 %').boundingBox();
  verifier(`la phrase de T11, sous les unités : « ${phrase && phrase.texte} »`,
    !!phrase && phrase.texte === attendue && phrase.y >= unites - 0.5 && !!taux && phrase.bas <= taux.y + 0.5);
  await capturerAuxTroisLargeurs('p10-changement-d-unite', 'L’unité est passée');
  /* UNE SECONDE PROPOSITION DE MÊME UNITÉ NE L'EFFACE PAS (relecture
     « écran », ECRAN7) : la quantité 12 est toujours là, au forfait, et la
     phrase qui demande de la vérifier doit rester. Avant, une proposition
     qui ne changeait pas d'unité rendait `null` et l'effaçait — 12 × 180 €,
     sans un mot. */
  ps = await taperDesignation('gravats');
  const auForfaitAussi = ps.findIndex((p) => /\/ forfait/.test(p.detail));
  exiger(auForfaitAussi >= 0, '« gravats » propose une ligne au forfait');
  await toucherProposition(auForfaitAussi);
  await attendre(400);
  const encore = await phraseDeLaCarte('L’unité est passée');
  verifier(`une SECONDE proposition au forfait : la phrase reste (« ${encore && encore.texte} »), la quantité aussi (${await parLibelle('Quantité').inputValue()})`,
    !!encore && encore.texte === attendue && (await parLibelle('Quantité').inputValue()) === '12');
  /* « RETOUCHÉE » VEUT DIRE CHANGÉE : la quantité QUITTÉE sans changement
     (le clavier qu'on ferme pour relire) garde la phrase — elle demande
     justement de vérifier ce nombre. Puis une quantité tapée l'efface. */
  await toucher(parLibelle('Quantité'));
  await toucher(parLibelle('Prix unitaire HT'));
  await attendre(400);
  verifier('la quantité quittée SANS changement : la phrase reste', (await texte()).includes(attendue));
  await viderEtTaper(parLibelle('Quantité'), '1');
  await toucher(parLibelle('Prix unitaire HT'));
  await attendre(400);
  verifier('la quantité retouchée (12 → 1) : la phrase s’efface', !(await texte()).includes('L’unité est passée'));
  /* Remise en l'état : la faïence à l'heure, à 45 €, et le modèle intact. */
  ps = await taperDesignation('faïence');
  const aLHeure = ps.findIndex((p) => p.titre === 'Pose de faïence murale');
  exiger(aLHeure >= 0, '« faïence » propose la faïence à l’heure');
  await toucherProposition(aLHeure);
  await viderEtTaper(parLibelle('Temps estimé'), '12');
  await viderEtTaper(parLibelle('Taux horaire (HT)'), '45');
  await toucher(parLibelle('Temps estimé'));
  await fermerCarte();
  const r = (await rangees()).find((x) => x.libelle === 'Pose de faïence murale');
  verifier(`remise à 12 h × 45 € : la rangée et le pied sont ceux de devis.js (${euros(totalLigne(faience))}, ${euros(totaux().ttc)})`,
    !!r && r.total === totalLigne(faience) && !!(await piedVaut(totaux().ttc)), `lu : ${(await pied()).texte}`);
});

await section('« Niche murale carrelée » → « Ajouter à ma base », à 320 × 568 (lot P)', async () => {
  exiger(postesDeCle(await postesEnBase(), { designation: 'Niche murale carrelée', unite: 'u' }).length === 0, 'aucun poste « Niche murale carrelée » dans la base');
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(700);
  await toucher(page.locator('button[aria-label="Option : Niche murale carrelée, ouvrir"]').first());
  await remettreModalesMax();
  await oublierAnnonces();
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  await attendre(500);
  const etat = await page.evaluate(() => {
    const a = document.activeElement;
    const m = [...document.querySelectorAll('[aria-modal="true"]')].pop();
    const btn = m && [...m.querySelectorAll('button')].find((b) => (b.innerText || '').trim() === 'Ajouter à ma base');
    const prix = m && m.querySelector('input[aria-label^="Prix de référence"]');
    const b = btn ? btn.getBoundingClientRect() : null;
    return {
      focus: a && /^(INPUT|TEXTAREA)$/.test(a.tagName) ? (a.getAttribute('aria-label') || a.tagName) : null,
      prix: prix ? prix.value : null,
      champsDePhrase: m ? [...m.querySelectorAll('input, textarea')].filter((x) => x.value === 'Niche murale carrelée').length : -1,
      bouton: b && { haut: b.top, bas: b.bottom, h: b.height, l: b.width },
      vh: window.innerHeight,
    };
  });
  verifier(`aucun champ n’a le focus — le pavé décimal ne monte pas (${etat.focus || 'aucun'})`, etat.focus === null);
  verifier(`une seule fenêtre (${await modales()})`, (await modales()) === 1);
  verifier('la phrase est MONTRÉE, sans champ pour la corriger', (await texteDeLaFeuille()).includes('Niche murale carrelée') && etat.champsDePhrase === 0);
  verifier(`le prix proposé est celui de la ligne (« ${etat.prix} »)`, etat.prix === '240');
  verifier(`« Ajouter à ma base » est visible SANS DÉFILER à 320 × 568 (${etat.bouton && Math.round(etat.bouton.haut)}–${etat.bouton && Math.round(etat.bouton.bas)} sur ${etat.vh}), 44 points (${etat.bouton && Math.round(etat.bouton.h)})`,
    !!etat.bouton && etat.bouton.haut >= 0 && etat.bouton.bas <= etat.vh + 0.5 && etat.bouton.h >= TOUCHE - 0.5);
  await jugerCibles('La feuille d’ajout de la niche, à 320', (c) => c.dansModale);
  await capture('p11-feuille-niche-320');
  await toucher(boutonDeLaFeuille('Ajouter à ma base'));
  await attendreModales(0, 4000);
  const t = await texte();
  verifier('après validation : « Dans votre base de postes. », et « Ajouter à ma base » a disparu',
    t.includes('Dans votre base de postes.') && (await page.getByLabel(AJOUTER_BASE, { exact: true }).count()) === 0);
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`…la référence paraît : « ${ref && ref.texte} »`, !!ref && ref.texte === `Votre prix de référence : 240,00 € / u, fixé le ${aujourdhui()}.`);
  verifier(`…et c’est annoncé (« ${(await annonces()).join(' | ')} »)`, (await annonces()).includes('Ajouté à votre base de postes.'));
  const niche = postesDeCle(await postesEnBase(), { designation: 'Niche murale carrelée', unite: 'u' });
  verifier(`la base a UN poste « Niche murale carrelée », à 240,00 €, rattaché à ce devis (${niche.length})`,
    niche.length === 1 && niche[0].prixReferenceCentimes === 24000 && niche[0].devisOrigineId === RENOVATION.id);
  verifier(`une seule fenêtre à la fois (au plus ${await modalesMax()})`, (await modalesMax()) <= 1);
  await capture('p11b-niche-ajoutee-320');
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
  await fermerCarte();
});

await section('« … chez Mme Martin », dans le devis de Mme Martin : l’avertissement NOMME le client (lot P)', async () => {
  /* La moitié de l'avertissement que « Sol du séjour » ne peut pas montrer :
     il n'a pas de client. Ici, le devis est celui d'une fiche du carnet, et
     la saisie passe cette fiche à la feuille. */
  /* Sa ville ne s'écrit à côté du nom que si le carnet a été lu ; le NOM,
     lui, vient du devis — et c'est lui que la feuille cherche. */
  exiger((await texte()).includes('Mme Martin'), 'le devis ouvert est celui de Mme Martin');
  await toucher(parLibelle('Ajouter un poste chiffré'));
  await taper('Dépose de l’évier chez Mme Martin');
  await toucher(parLibelle('unité'));
  await toucher(parLibelle(AJOUTER_BASE));
  await attendreModales(1);
  const tf = await texteDeLaFeuille();
  /* La virgule avant le dernier « et », quand un morceau en porte déjà une
     (relecture « textes », TEXTES10). */
  const avert = 'Cette phrase contient « Martin », le nom du client de ce devis, et une formule comme « chez » ou « Mme », qui désigne souvent un client. Elle resterait dans votre base même si vous supprimez ce client.';
  verifier(`l’avertissement nomme le client : « ${avert} »`, tf.includes(avert), tf.slice(0, 600));
  verifier('…et le bouton reste actif', (await boutonDeLaFeuille('Ajouter à ma base').getAttribute('aria-disabled')) !== 'true');
  await capture('p11c-avertissement-nom-390');
  await toucherLeVoile();
  await retirerLaLigneOuverte();
  verifier('rien n’est ajouté, la ligne d’essai retirée', (await modales()) === 0 && !(await carteOuverte())
    && !(await postesEnBase()).some((p) => /Martin/.test(p.designation)));
});

await section('« Ma base de postes » : deux portes, une page (lot P)', async () => {
  await allerAMesDevis();
  await page.setViewportSize({ width: 320, height: 568 });
  await attendre(700);
  const porte = await page.evaluate((l) => {
    const e = document.querySelector(`[aria-label="${l}"]`);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    const tx = [...e.querySelectorAll('div[dir="auto"]')].pop();
    return { x: b.x, droite: b.right, h: b.height, l: b.width, deborde: !!tx && tx.scrollWidth > tx.clientWidth + 1, vw: window.innerWidth };
  }, PORTE_BASE);
  verifier(`la porte de « Mes devis » tient à 320 points (${porte && Math.round(porte.x)}–${porte && Math.round(porte.droite)}, ${porte && Math.round(porte.h)} de haut, texte entier)`,
    !!porte && porte.x >= 0 && porte.droite <= porte.vw + 0.5 && porte.h >= TOUCHE - 0.5 && !porte.deborde);
  await capture('p12-porte-mes-devis-320');
  await page.setViewportSize({ width: 390, height: 844 });
  await attendre(600);
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(800);
  const base = await postesEnBase();
  const t = await texte();
  verifier(`la page : « ${base.length} postes », la phrase d’en-tête, aucun « Nouveau poste »`,
    t.includes(`${base.length} postes`) && t.includes('Aucun écran d’Opus ne les montre à quelqu’un d’autre que vous.') && !/Nouveau poste/.test(t));
  /* Les mots de la carte, pas un mot de plus (relecture « écran », ECRAN8) :
     « écart » n'apparaît nulle part ailleurs ; la carte demande « c’est
     voulu ? ». Et un poste à l'unité se dit « à l’unité ». */
  verifier('l’aide parle comme la carte : « Pour ne plus voir la question « c’est voulu ? » sur un poste, retirez son prix de référence. »',
    t.includes('Pour ne plus voir la question « c’est voulu ? » sur un poste, retirez son prix de référence.') && !t.includes('écart'));
  verifier('…et « À l’unité », jamais « Unité : unité » ni « Unité : à l’unité » (TEXTES16)',
    t.includes('À l’unité') && !t.includes('Unité : unité') && !t.includes('Unité : à l’unité'));
  const hauteurs = await page.locator('[aria-label^="Ouvrir le poste "]').evaluateAll((es) => es.map((e) => Math.round(e.getBoundingClientRect().height)));
  verifier(`les rangées font 44 points au moins (${hauteurs.length} montées : ${hauteurs.join(', ')})`, hauteurs.length > 0 && hauteurs.every((h) => h >= TOUCHE));
  const plinthes = await texteDeLaRangeeDuPoste('Pose de plinthes carrelées');
  const chape = await texteDeLaRangeeDuPoste(CHAPE);
  verifier('les plinthes disent « avant la déclaration de votre régime de TVA actuel : vérifiez-le », la chape non',
    plinthes.includes('avant la déclaration de votre régime de TVA actuel : vérifiez-le') && !!chape && !chape.includes('avant la déclaration'));
  const depose = await texteDeLaRangeeDuPoste(DEPOSE);
  verifier('« Ajouté le … depuis un de vos devis » sur la chape, « Ajouté le … » seul sur la dépose (son devis a été supprimé)',
    new RegExp(`Ajouté le ${FIXE_LE} depuis un de vos devis`).test(chape) && new RegExp(`Ajouté le ${FIXE_LE}$`).test(depose));
  const ragreage = await rangeeDuPoste(RAGREAGE).evaluate((e) => {
    const p = [...e.querySelectorAll('div[dir="auto"]')].find((x) => (x.innerText || '').startsWith('Ragréage'));
    return p ? { lignes: Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)), coupe: p.scrollHeight > p.clientHeight + 1 } : null;
  });
  verifier(`la phrase longue du ragréage tient sur TROIS lignes (${ragreage && ragreage.lignes}, coupée : ${ragreage && ragreage.coupe ? 'oui' : 'non'})`,
    !!ragreage && ragreage.lignes === 3);
  await jugerCibles('La page « Ma base de postes »', (c) => !c.dansModale);
  await capturerAuxTroisLargeurs('p12-ma-base');
  /* La recherche, par les mots de la CLÉ. */
  await toucher(parLibelle('Chercher dans ma base de postes'));
  await taper('seche chape');
  await attendre(900);
  let trouves = await page.locator('[aria-label^="Ouvrir le poste "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier(`« seche chape » trouve la chape, et elle seule (${trouves.join(' | ')})`, trouves.length === 1 && trouves[0] === `Ouvrir le poste ${CHAPE}`);
  await jugerCibles('La page, recherche en cours', (c) => !c.dansModale);
  await viderEtTaper(parLibelle('Chercher dans ma base de postes'), 'seche');
  await attendre(900);
  trouves = await page.locator('[aria-label^="Ouvrir le poste "]').evaluateAll((es) => es.map((e) => e.getAttribute('aria-label')));
  verifier(`« seche » trouve la chape (${trouves.join(' | ')})`, trouves.includes(`Ouvrir le poste ${CHAPE}`));
  await viderEtTaper(parLibelle('Chercher dans ma base de postes'), 'DURANDAL');
  await attendre(900);
  verifier('« DURANDAL » : aucun poste de démonstration ne nomme ce client — « Aucun poste ne contient « DURANDAL ». »',
    (await page.locator('[aria-label^="Ouvrir le poste "]').count()) === 0 && (await texte()).includes('Aucun poste ne contient « DURANDAL ».'));
  await capture('p12b-recherche-vide-390');
  await toucher(parLibelle('Effacer la recherche'));
  await attendre(700);
  verifier('« Effacer la recherche » rend toute la liste', (await page.locator('[aria-label^="Ouvrir le poste "]').count()) === hauteurs.length);
  /* LA SECONDE PORTE : « Mon profil ». */
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  const rangeeProfil = await parLibelle(PORTE_BASE).boundingBox();
  verifier(`« Mon profil » porte la rangée « Ma base de postes », 44 points (${rangeeProfil && Math.round(rangeeProfil.height)})`, !!rangeeProfil && rangeeProfil.height >= TOUCHE - 0.5);
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  verifier(`…elle ouvre la MÊME page (« ${base.length} postes »)`, (await texte()).includes(`${base.length} postes`));
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
  verifier('…et le retour ramène à « Mon profil »', (await page.getByLabel('Mes devis : les brouillons de chiffrage', { exact: true }).count()) === 1);
});

await section('Dans la page : fixer, changer, retirer un prix de référence (lot P)', async () => {
  const base = await postesEnBase();
  exiger(postesDeCle(base, { designation: 'Pose de faïence murale', unite: 'h' }).some((p) => p.prixReferenceCentimes == null)
    && postesDeCle(base, { designation: RAGREAGE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 2800)
    && postesDeCle(base, { designation: DALLE, unite: 'm2' }).some((p) => p.prixReferenceCentimes === 8500),
    'la faïence à l’heure sans prix, le ragréage à 28 €, la dalle à 85 €');
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  await oublierAnnonces();
  /* Fixer : la faïence à l'heure, « Prix non fixé ». */
  verifier('la faïence à l’heure dit « Prix non fixé »', (await texteDeLaRangeeDuPoste('Pose de faïence murale')).includes('Prix non fixé'));
  await toucher(rangeeDuPoste('Pose de faïence murale'));
  await attendreModales(1);
  verifier('sa feuille : « Ce poste », le taux horaire de référence, vide', (await texteDeLaFeuille()).startsWith('Ce poste')
    && (await champPrixDeLaFeuille().getAttribute('aria-label')) === 'Taux horaire de référence (HT)' && (await champPrixDeLaFeuille().inputValue()) === '');
  await jugerCibles('La feuille d’un poste, depuis la page', (c) => c.dansModale);
  await capture('p13-feuille-poste-page-390');
  await viderEtTaper(champPrixDeLaFeuille(), '50');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await attendreModales(0);
  let r = await texteDeLaRangeeDuPoste('Pose de faïence murale');
  verifier(`fixer : « 50,00 € » et « fixé le ${aujourdhui()} »`, r.includes('50,00 €') && r.includes(`fixé le ${aujourdhui()}`), r);
  /* Changer : le ragréage, 28 → 30. */
  await toucher(rangeeDuPoste(RAGREAGE));
  await attendreModales(1);
  verifier('la feuille du ragréage montre la phrase ENTIÈRE', (await page.locator('[aria-modal="true"] textarea[aria-label="Phrase du poste"]').inputValue()) === RAGREAGE);
  await viderEtTaper(champPrixDeLaFeuille(), '30');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await attendreModales(0);
  r = await texteDeLaRangeeDuPoste(RAGREAGE);
  verifier(`changer : « 30,00 € » et « fixé le ${aujourdhui()} »`, r.includes('30,00 €') && r.includes(`fixé le ${aujourdhui()}`), r);
  /* Retirer : la dalle — « Prix non fixé », plus aucune date. */
  await toucher(rangeeDuPoste(DALLE));
  await attendreModales(1);
  /* DEUX APPUIS (relecture « écran », ECRAN2) : le lot n'a aucun historique
     des prix ; un appui distrait, 8 points sous « Enregistrer », effaçait
     85,00 € et sa date. Le premier appui DIT ce qui part, le second retire
     — la règle de « Retirer ce poste », juste en dessous. */
  await toucher(parLibelle('Retirer le prix de référence'));
  const confirmer = new RegExp(`Le prix de référence 85,00 € / m², fixé le ${FIXE_LE}, sera effacé : Opus n’en garde aucune trace\\.`);
  verifier('le premier appui ne retire rien : il demande, et dit ce qui part (« Le prix de référence 85,00 € / m², fixé le …, sera effacé : Opus n’en garde aucune trace. »)',
    (await modales()) === 1 && (await page.getByLabel('Confirmer : retirer le prix de référence', { exact: true }).count()) === 1
    && confirmer.test(await texteDeLaFeuille())
    && postesDeCle(await postesEnBase(), { designation: DALLE, unite: 'm2' })[0].prixReferenceCentimes === 8500);
  await capture('p13b-retirer-le-prix-confirmation-390');
  await toucher(parLibelle('Confirmer : retirer le prix de référence'));
  await attendreModales(0);
  r = await texteDeLaRangeeDuPoste(DALLE);
  verifier('retirer : « Prix non fixé », plus de « fixé le »', r.includes('Prix non fixé') && !r.includes('fixé le'), r);
  verifier(`chaque écriture est annoncée (« ${(await annonces()).join(' | ')} »)`,
    (await annonces()).filter((a) => a === 'Votre prix de référence est changé.').length === 2 && (await annonces()).includes('Le prix de référence est retiré.'));
  /* La page RELUE : on la quitte, on y revient, et la base le confirme. */
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(800);
  await toucher(parLibelle(PORTE_BASE));
  await jusqua(surLaPage, 8000);
  await attendre(600);
  const relue = await postesEnBase();
  verifier('la page relue montre les mêmes prix, et la base aussi (50 €, 30 €, aucun)',
    (await texteDeLaRangeeDuPoste('Pose de faïence murale')).includes('50,00 €') && (await texteDeLaRangeeDuPoste(RAGREAGE)).includes('30,00 €')
    && (await texteDeLaRangeeDuPoste(DALLE)).includes('Prix non fixé')
    && postesDeCle(relue, { designation: 'Pose de faïence murale', unite: 'h' })[0].prixReferenceCentimes === 5000
    && postesDeCle(relue, { designation: RAGREAGE, unite: 'm2' })[0].prixReferenceCentimes === 3000
    && postesDeCle(relue, { designation: DALLE, unite: 'm2' })[0].prixReferenceCentimes == null);
});

await section('Dans la page : corriger la phrase d’un poste (lot P, T14)', async () => {
  exiger(await surLaPage(), 'la page « Ma base de postes » est à l’écran');
  exiger(postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' }).some((p) => p.designation === CHAPE), 'la chape porte sa phrase de démonstration');
  await oublierAnnonces();
  const nouvelle = 'CHAPES SÈCHES avant carrelage collé';
  await toucher(rangeeDuPoste(CHAPE));
  await attendreModales(1);
  await viderEtTaper(page.locator('[aria-modal="true"] textarea[aria-label="Phrase du poste"]'), nouvelle);
  await attendre(900);
  let tf = await texteDeLaFeuille();
  verifier('une majuscule, un s, un accent : AUCUNE phrase d’avertissement, « Enregistrer » actif',
    !tf.includes('ne seront plus reconnues') && !tf.includes('Un autre poste de votre base') && (await boutonDeLaFeuille('Enregistrer').getAttribute('aria-disabled')) !== 'true');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await attendreModales(0);
  verifier('…enregistré, et annoncé', (await rangeeDuPoste(nouvelle).count()) === 1 && (await annonces()).includes('Le poste est enregistré.'));
  /* La ligne du devis reste reconnue : sa référence nomme le poste. */
  await ouvrirSejour();
  await toucher(rangee(CHAPE));
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`la ligne de « Sol du séjour » reste reconnue : « ${ref && ref.texte} »`,
    !!ref && new RegExp(`^Votre prix de référence pour « ${echapper(nouvelle)} » : 52,00 € / m², fixé le ${FIXE_LE}\\.$`).test(ref.texte));
  await fermerCarte();
  await ouvrirLaPageDepuisMesDevis();
  /* La phrase d'un AUTRE poste : refusée avant d'envoyer. Le cahier écrit
     « Pose de plinthes carrelées » — au mètre linéaire, quand la chape est
     au m² : ce ne serait PAS un doublon (la clé d'un poste porte son
     unité). Comme le dit sa parenthèse, on choisit un poste de MÊME unité :
     la dalle, au m². */
  await toucher(rangeeDuPoste(nouvelle));
  await attendreModales(1);
  await viderEtTaper(page.locator('[aria-modal="true"] textarea[aria-label="Phrase du poste"]'), 'DALLES béton armé, épaisseur 12 cm, sur hérisson');
  await attendre(900);
  tf = await texteDeLaFeuille();
  verifier(`la phrase d’un autre poste : « Un autre poste de votre base porte presque la même phrase : « ${DALLE} ». », « Enregistrer » désactivé`,
    tf.includes(`Un autre poste de votre base porte presque la même phrase : « ${DALLE} ».`)
    && (await boutonDeLaFeuille('Enregistrer').getAttribute('aria-disabled')) === 'true', tf.slice(0, 600));
  await capture('p14-correction-doublon-390');
  await viderEtTaper(page.locator('[aria-modal="true"] textarea[aria-label="Phrase du poste"]'), 'Chape liquide anhydrite');
  await attendre(900);
  tf = await texteDeLaFeuille();
  verifier('une AUTRE phrase, libre : « Les lignes déjà écrites avec l’ancienne phrase ne seront plus reconnues comme ce poste. »',
    tf.includes('Les lignes déjà écrites avec l’ancienne phrase ne seront plus reconnues comme ce poste.')
    && (await boutonDeLaFeuille('Enregistrer').getAttribute('aria-disabled')) !== 'true');
  await toucher(croixDeLaFeuille());
  verifier('la croix ferme sans rien écrire : la chape garde sa phrase', (await modales()) === 0
    && postesDeCle(await postesEnBase(), { designation: CHAPE, unite: 'm2' }).some((p) => p.designation === nouvelle));
  noter('« modifié entre-temps »', 'ne se produit pas en démonstration : éprouvé par verifier-postes (G) sous node, et sur la vraie base (cahier §7.5)');
});

await section('Une relecture ratée, une écriture, « Réessayer » : la base ne reste jamais « en lecture » (lot P, ECRAN5, ECRAN6)', async () => {
  /* La relecture « écran » (ECRAN5) : une relecture ratée, puis une
     écriture partie de la page (feuille fermée pendant l'envoi), puis
     « Réessayer ». La file des postes passe une requête à la fois : la
     lecture revient APRÈS l'écriture, elle est périmée, et elle était JETÉE
     sans remettre l'état — la page perdait son compte, et la carte d'un
     devis ne montrait plus rien (ni référence, ni échec, ni « Réessayer »),
     jusqu'à ce qu'on rouvre la page. Une lecture jetée se relance une fois,
     et sa relance remet l'état. */
  exiger(await surLaPage(), 'la page « Ma base de postes » est à l’écran');
  const n = (await postesEnBase()).length;
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await page.evaluate(() => { window.__opusPausePostes = 60000; });
  await toucher(parLibelle(PORTE_BASE));
  const ratee = await jusqua(async () => (await texte()).includes('Liste non actualisée'), 14000, 200);
  verifier(`la relecture qui ne revient pas : « Liste non actualisée », la liste lue gardée (« ${n} postes »)`,
    !!ratee && (await texte()).includes(`${n} postes`));
  /* ECRAN6 : une recherche sans résultat sous une liste GARDÉE dit qu'elle
     ne trouve rien — pas « Lecture impossible », et pas un SECOND
     « Réessayer » sous celui de la bande. */
  await toucher(parLibelle('Chercher dans ma base de postes'));
  await taper('zzzz');
  await attendre(900);
  const tz = await texte();
  const reessayer = await page.getByRole('button', { name: 'Réessayer', exact: true }).count();
  verifier(`…« zzzz » : « Aucun poste ne contient « zzzz ». », jamais « Lecture impossible », un seul « Réessayer » (${reessayer})`,
    tz.includes('Aucun poste ne contient « zzzz ».') && !tz.includes('Lecture impossible') && reessayer === 1);
  await capture('p15a-recherche-apres-relecture-ratee-390');
  await toucher(parLibelle('Effacer la recherche'));
  await attendre(600);
  await page.evaluate(() => { window.__opusPausePostes = 3000; });
  await oublierAnnonces();
  await toucher(rangeeDuPoste(RAGREAGE));
  await attendreModales(1);
  await viderEtTaper(champPrixDeLaFeuille(), '31');
  await toucher(boutonDeLaFeuille('Enregistrer'));
  await toucher(croixDeLaFeuille());
  verifier('l’écriture partie (31 € pour le ragréage), sa feuille fermée pendant l’envoi', (await modales()) === 0);
  const t0 = Date.now();
  await toucher(page.getByRole('button', { name: 'Réessayer', exact: true }).first());
  const remise = await jusqua(async () => {
    const t = await texte();
    return t.includes(`${n} postes`) && !t.includes('Liste non actualisée') && !t.includes('Lecture de votre base');
  }, 15000, 200);
  const r = await texteDeLaRangeeDuPoste(RAGREAGE);
  verifier(`« Réessayer » : la page retrouve son compte (« ${n} postes »), sans bande, au bout de ${Math.round((Date.now() - t0) / 100) / 10} s`, !!remise);
  verifier(`…la rangée du ragréage dit 31,00 €, la base aussi, et c’est annoncé (« ${(await annonces()).join(' | ')} »)`,
    r.includes('31,00 €') && (await annonces()).includes('Votre prix de référence est changé.')
    && postesDeCle(await postesEnBase(), { designation: RAGREAGE, unite: 'm2' })[0].prixReferenceCentimes === 3100);
  await capture('p15b-page-apres-lecture-jetee-390');
  await page.evaluate(() => { window.__opusPausePostes = null; });
  /* Et dans un devis : la carte de la chape retrouve sa référence (52 €
     depuis « Changer ma référence », plus haut — donc pas d'écart), et
     aucune phrase d'échec : la base est LUE. */
  await toucher(parLibelle('Revenir en arrière'));
  await page.getByText('Nouveau devis', { exact: true }).first().waitFor({ timeout: 8000 });
  await ouvrirLeDevis('Sol du séjour');
  await toucher(rangee(CHAPE));
  await attendre(800);
  const ref = await phraseDeLaCarte('Votre prix de référence');
  verifier(`…la carte de la chape : la référence est là (« ${ref && ref.texte} »), sans phrase d’échec ni « Réessayer »`,
    !!ref && /: 52,00 € \/ m², fixé le /.test(ref.texte) && !(await texte()).includes(ECHEC_BASE)
    && (await page.getByLabel(RELIRE_BASE, { exact: true }).count()) === 0);
  await fermerCarte();
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
  /* …ET LA BASE DE POSTES (relecture « textes », TEXTES1). */
  verifier('…et la base de postes : « cherchez son nom dans « Ma base de postes » », et le devis d’un autre client',
    t.includes(net(PHRASE_POSTES_D_UN_CLIENT)), t.slice(-500));
  await capture('27-supprimer-fiche');
  await toucher(parLibelle('Faire un devis pour Mme Martin'));
  await page.getByText(BANDEAU).first().waitFor({ timeout: 8000 });
  await attendre(600);
  verifier('« Faire un devis » ouvre un brouillon pour elle, son adresse comme lieu',
    (await texte()).includes('Mme Martin') && (await parLibelle('Ville du lieu des travaux').inputValue()) === 'Charleval');
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

/* LA FICHE D'UN CLIENT SANS DEVIS (relecture « textes », TEXTES1) : son seul
   avertissement ne paraissait que s'il avait des devis — or c'est quand il
   n'en a pas qu'une phrase de la base peut être la dernière copie de son nom. */
await section('La fiche d’un client SANS devis : supprimer dit quand même la base de postes (TEXTES1)', async () => {
  await toucher(page.getByRole('tab', { name: 'Profil' }));
  await attendre(900);
  await toucher(parLibelle('Mes clients'));
  await toucher(parLibelle('Ouvrir la fiche de SCI du Moulin'));
  await page.getByText('Ses devis', { exact: true }).first().waitFor({ timeout: 6000 });
  await attendre(800);
  const sesDevis = await page.locator('[aria-label^="Ouvrir le devis "]').count();
  exiger(sesDevis === 0, `la SCI du Moulin n’a aucun devis en démonstration (${sesDevis})`);
  await toucher(page.getByRole('button', { name: 'Supprimer cette fiche', exact: true }));
  const t = await texte();
  verifier('sans devis : aucune phrase sur des devis, mais la base de postes, « cherchez son nom », et le devis d’un autre client',
    !t.includes('Ce client a ') && t.includes(net(PHRASE_POSTES_D_UN_CLIENT)), t.slice(-500));
  await capture('27b-supprimer-fiche-sans-devis');
  /* On n'appuie PAS une seconde fois : la fiche reste. On la ferme, puis on
     quitte le carnet. */
  await toucher(parLibelle('Fermer'));
  await attendre(600);
  await toucher(parLibelle('Revenir en arrière'));
  await attendre(900);
});

await section('« Supprimer ce brouillon », deux appuis', async () => {
  await allerAMesDevis();
  /* CE QUI RESTE (relecture « textes », TEXTES8) : « Rénovation salle de
     bains » a des postes rangés depuis lui, « Sol du séjour » aucun. La
     phrase attendue est celle que la fonction rend sur les postes de la
     démonstration ENCORE EN BASE à cet instant. */
  const enBase = await postesEnBase();
  const attendueRenovation = phraseSuppressionDuBrouillon({ postes: enBase, postesEtat: 'ok', devisId: DEVIS_DEMO_IDS.renovation });
  exiger(/Les postes que vous en avez rangés dans votre base de postes restent\./.test(attendueRenovation),
    'au moins un poste de la démonstration vient encore de « Rénovation salle de bains »');
  await ouvrirLeDevis('Rénovation salle de bains');
  await toucher(bouton('Supprimer ce brouillon'));
  const tR = await texte();
  verifier('« Rénovation salle de bains » : le second appui dit que ses postes restent dans la base',
    tR.includes(net(attendueRenovation)), tR.slice(-400));
  await toucher(parLibelle('Revenir en arrière'));
  await jusqua(async () => !(await dansLaSaisie()), 8000);
  await attendre(800);
  const avant = await page.locator('button[aria-label^="Ouvrir le brouillon "]').count();
  await ouvrirLeDevis('Sol du séjour');
  await toucher(bouton('Supprimer ce brouillon'));
  verifier('le premier appui ne supprime rien, il demande', (await bouton('Confirmer la suppression de ce brouillon').count()) === 1 && await dansLaSaisie());
  /* « Sol du séjour » : les sections précédentes y ont peut-être rangé des
     postes (« Ajouter à ma base ») — l'attente se CALCULE sur la base telle
     qu'elle est, et la mesure dit quel cas elle a vu. Le cas « aucun poste »
     est éprouvé par `verifier-postes`, qui fait tourner la fonction. */
  const attendueSejour = phraseSuppressionDuBrouillon({ postes: await postesEnBase(), postesEtat: 'ok', devisId: DEVIS_DEMO_IDS.sejour });
  const tS = await texte();
  verifier(`« Sol du séjour » : le second appui dit ce que la fonction rend sur la base actuelle (${
    /restent\.$/.test(attendueSejour) ? 'des postes en viennent' : 'aucun poste n’en vient'})`,
    tS.includes(net(attendueSejour))
    && (/restent\.$/.test(attendueSejour) || !tS.includes('Les postes que vous en avez rangés')), attendueSejour);
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

/* LA PROPRIÉTÉ DES RANGÉES, en un chiffre : combien de propositions ont été
   jugées, dont combien à 320 points, et combien de détails la garde d'une
   ligne a coupés (l'historique ou l'origine, jamais le prix). */
console.log('\nLes propositions vues');
noter('propositions jugées « titre de deux lignes au plus + détail d’une ligne »',
  `${PROPOSITIONS_VUES.length}, dont ${PROPOSITIONS_VUES.filter((p) => p.largeur === 320).length} à 320 points ; détails coupés : ${PROPOSITIONS_VUES.filter((p) => p.coupe).length}`);

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
