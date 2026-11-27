/**
 * L'APERÇU D'UN DEVIS, MESURÉ AU NAVIGATEUR — étape 2c-1, cahier §8.3.
 *
 * POURQUOI UN SCRIPT, ET POURQUOI HORS DE `npm run verifier`
 * ----------------------------------------------------------
 * `verifier-apercu` fait tourner TOUTE la chaîne sans navigateur : le
 * tampon y est posé sur trois PDF commités (`scripts/donnees/`), et le HTML
 * y est lu par ses règles. Ce qu'il ne peut pas faire, faute de navigateur :
 * mettre une page EN PAGES, puis relire le PDF qui en sort comme un lecteur
 * le relit. Et rien ne disait encore si l'écran de l'aperçu, dans
 * l'application, se conduit comme la séance le promet.
 *
 * Il lui faut Chromium (`/opt/pw-browsers`, ou CHROME=…), Playwright, et
 * `pdftotext` / `pdffonts` / `pdftohtml` (poppler) — présents dans le
 * conteneur de travail, pas dans GitHub. D'où sa place à côté de
 * `mesure-devis`, et pas dans `npm run verifier`.
 *
 *   npx expo start --web -c --port 8097      (sans .env : la démonstration)
 *   npm run mesure-apercu                    (ou : node scripts/mesure-apercu.mjs --sorties <dossier>)
 *   node scripts/mesure-apercu.mjs --sans-application   (la chaîne seule, sans serveur)
 *
 * Codes de sortie, qu'on lit — jamais le texte : 0 juste ; 1 une mesure
 * fausse, ou qui n'a pas pu se faire (une cible introuvable est un échec,
 * pas un silence) ; 2 la machine (ni Chromium, ni Playwright, ni poppler,
 * ni serveur).
 *
 * I. LA CHAÎNE, AU NAVIGATEUR (§8.3, points 1 à 5)
 * -------------------------------------------------
 * Les trois exemples d'Opus Dev (`apercu-exemples.js`) et une douzaine de
 * variantes tirées d'eux (franchise, non déclaré, client professionnel,
 * association, assurance échue, déplacement offert ou à 35 €, réduction et
 * acompte en euros, devis vide, une ligne sans TVA, client absent, mode
 * aperçu, désignations très longues) passent par LA chaîne de l'application :
 * `composerLApercu` (l'instantané, la composition, le gabarit, les polices
 * engendrées), puis `page.pdf` aux mesures de `format-a4.js` et à l'ÉCHELLE
 * D'iOS — `scale: 1.0667`, parce qu'iOS imprime 1 px CSS à 0,8 pt quand
 * Chromium l'imprime à 0,75 (D30) —, puis le VRAI tampon (`tamponner`, avec
 * `@cantoo/pdf-lib` chargé comme Metro le charge : `cjs/`).
 *
 * Ce qui se REFUSE ici :
 *   - chaque désignation, chaque titre, chaque réserve se retrouve ENTIÈRE
 *     dans le texte extrait (`pdftotext -raw`, blancs réduits) ;
 *   - le numéro en attente, par POSITION en page 1 (§4.6) : « DEV-2026- »
 *     puis « ···· » sur la même ligne, à moins d'un caractère, dans la zone
 *     du contenu ; aucun « 0000 » (le gabarit est caché) ; aucun chiffre
 *     après « DEV-2026- » ;
 *   - sur CHAQUE page : la tête « APERÇU — ce document n’est pas remis » et
 *     le pied « Devis DEV-2026-···· — Page k sur N », lus dans le texte ;
 *   - `pdffonts` liste Inter ET Oswald, embarquées ;
 *   - « Łukasz » et « Łazienka » (le latin étendu) sont écrits en Inter
 *     (`pdftohtml -xml` : la police de chaque morceau de texte).
 * Ce qui se relève À TITRE INDICATIF SEULEMENT (ⓘ, jamais un refus) : le
 * nombre de pages, la page des totaux, une ligne coupée entre deux pages.
 * Un PDF de Chromium prouve la CHAÎNE, pas le document : la vraie mise en
 * page ne se voit que sur l'iPhone (WebKit coupe autrement).
 *
 * II. L'APPLICATION, EN DÉMONSTRATION (§8.3, point 6)
 * ----------------------------------------------------
 *   - « Mes devis » : les trois exemples EN COLONNE, chacun ouvert dans
 *     l'écran « Exemple d’aperçu », avec la marque d'exemple dans la page ;
 *   - un brouillon → « Aperçu du devis (page A4) » → la carte est TOUJOURS
 *     OUVERTE après l'étape d'enregistrement (E-G1 : `attendreLaFile`, pas
 *     `enregistrerTout`, qui fermait la carte) ;
 *   - le cadre web : `sandbox=""`, sa bande, la phrase « Au navigateur : ni
 *     pages… » ; et le texte de la carte, cette phrase retirée, ne dit JAMAIS
 *     « sur chaque page » — ni « Mise en page… » ni « Marque « APERÇU » sur
 *     chaque page… » à aucun instant de la séance (E-M5) ;
 *   - aucun bouton « Partager » ou « Imprimer » ;
 *   - un script placé dans une DÉSIGNATION ne tourne pas (T13 : on éprouve
 *     CELA, pas un écouteur sur `print`) ;
 *   - VoiceOver : une annonce au début, une à la fin, pas une par étape ;
 *   - la carte fermée par « ‹ Devis » ; rouverte, un aperçu neuf ;
 *   - fermer PENDANT l'enregistrement, puis rouvrir : l'aperçu vient (E-M4) ;
 *   - une ligne qui ne part pas : « [enregistrement] … » et « Revenir au
 *     devis », jamais « Réessayer », et pas d'aperçu ;
 *   - la part du document : au moins 60 % de la hauteur utile, à 393 × 852
 *     et à 320 × 568 (E-M2). Le document, c'est la FEUILLE montrée dans le
 *     cadre web (ses marges de papier de 15 mm comprises, comme la page
 *     d'un PDF sur l'iPhone garde les siennes) ; ce que la page porte à
 *     l'intérieur de ces marges est relevé à titre indicatif ;
 *   - un brouillon neuf : la phrase « L’aperçu sera possible dès que… », sur
 *     44 points, et aucune rangée.
 *
 * « NE PART PAS » EN DÉMONSTRATION, ET CE QUI EST SIMULÉ. Il n'y a aucune
 * route à couper : la base des devis vit en mémoire (`devis-demo.js`), et une
 * écriture y prend `PAUSE_ECRITURE_DEMO` (`api.js`). On ALLONGE cette seule
 * minuterie, appelée depuis l'écrivain de démonstration, comme le fait
 * `mesure-devis` : à 60 s, l'écriture ne revient pas avant le délai de la
 * file (8 s) ; à 3 s, elle est EN ROUTE le temps de fermer la carte.
 *
 * Ce que le navigateur ne dit PAS : rien de l'iPhone — ni `pdf-lib` sous
 * Hermes, ni la mise en page de WebKit, ni l'afficheur de PDF d'iOS, ni
 * `accessibilityViewIsModal` (une propriété d'iOS que `react-native-web` ne
 * traduit pas), ni VoiceOver lui-même.
 */
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { composerLApercu } from '../src/lib/composition-apercu.js';
import { tamponner } from '../src/lib/tampon-apercu.js';
import * as A4 from '../src/lib/format-a4.js';
import { totauxDevis, totalLigne } from '../src/lib/devis.js';
import { TEXTES_DE_L_ECRAN } from '../src/lib/etapes-apercu.js';
import { DELAI_ECRITURE } from '../src/lib/file-ecriture.js';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exiger = createRequire(import.meta.url);

/* LES ORACLES SONT ÉCRITS ICI, EN TOUTES LETTRES (K11) : comparer la page à
   une constante qu'on importe du code ne vérifie rien — une marque réécrite
   dans le code le serait aussi dans la mesure. Les constantes importées ne
   servent qu'à TROUVER une cible à l'écran. */
const MARQUE_APERCU = 'APERÇU — ce document n’est pas remis';
const MARQUE_ESSAI = 'Document d’essai — sans valeur';
const MARQUE_EXEMPLE = 'Exemple — données inventées';
const DIAGONALE = 'APERÇU';
const pied = (numero, k, total) => `Devis ${numero} — Page ${k} sur ${total}`;
const PHRASE_WEB = 'Au navigateur : ni pages, ni marque sur chaque page, ni numéros de page.';
const BANDE_WEB = 'APERÇU — ce document n’est pas remis';
const ETAPE_ENREGISTREMENT = 'Enregistrement de vos dernières modifications…';
const ETAPE_MISE_EN_PAGE = 'Mise en page…';
const ETAPE_MARQUE = 'Marque « APERÇU » sur chaque page…';
const ANNONCE_FIN_WEB = 'Aperçu prêt.';
const REFUS_UNE_LIGNE = '[enregistrement] Il n’y a pas d’aperçu : 1 ligne n’est pas encore en base.';
const REVENIR = 'Revenir au devis';
const REESSAYER = 'Réessayer';
const PAS_EN_BASE = 'L’aperçu sera possible dès que ce devis aura une ligne ou un objet.';
const PRECEDENT = 'Un aperçu précédent se termine encore : réessayez dans quelques secondes.';

/* ------------------------------------------------------------------ */
/*  Les options, la machine                                             */
/* ------------------------------------------------------------------ */

const PORT = process.env.PORT || 8097;
const iSorties = process.argv.indexOf('--sorties');
const SORTIES = iSorties > 0 ? path.resolve(process.argv[iSorties + 1]) : null;
const SANS_APPLICATION = process.argv.includes('--sans-application');
const DOSSIER = SORTIES || mkdtempSync(path.join(os.tmpdir(), 'mesure-apercu-'));
mkdirSync(DOSSIER, { recursive: true });

const machine = (m) => { console.error(`\n✘ La machine : ${m}`); process.exit(2); };

for (const outil of ['pdftotext', 'pdffonts', 'pdftohtml']) {
  const r = spawnSync(outil, ['-v'], { encoding: 'utf8' });
  if (r.error) machine(`« ${outil} » est introuvable (poppler-utils). Ce script en a besoin pour relire les PDF.`);
}
const PW = '/opt/node22/lib/node_modules/playwright/index.js';
const playwright = await import('playwright').catch(() => (existsSync(PW) ? import(PW).then((m) => m.default || m) : null));
if (!playwright || !playwright.chromium) machine('Playwright est introuvable (ni dans node_modules, ni dans /opt/node22).');
const CHEMINS_CHROME = [
  process.env.CHROME,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium',
  '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
].filter(Boolean);
const CHROME = CHEMINS_CHROME.find((c) => existsSync(c));
if (!CHROME) machine(`aucun navigateur (essayés : ${CHEMINS_CHROME.join(', ')}). Donnez son chemin par CHROME=…`);

/* `pdf-lib`, résolu comme Metro le résout (`cjs/`, K-m3). */
const PDFLib = exiger('@cantoo/pdf-lib');
/* Les polices engendrées et les exemples : chargés ICI, au moment de s'en
   servir — jamais en haut d'un fichier de l'application (§4.9, T17). */
const { POLICES_DEVIS } = await import(pathToFileURL(path.join(RACINE, 'src/data/polices-devis.js')).href);
const EXEMPLES = await import(pathToFileURL(path.join(RACINE, 'src/data/apercu-exemples.js')).href);

/* ------------------------------------------------------------------ */
/*  Les outils                                                          */
/* ------------------------------------------------------------------ */

let echecs = 0;
let justes = 0;
const verifier = (nom, ok, detail = '') => {
  if (ok) { justes += 1; console.log(`  ✔ ${nom}`); return true; }
  echecs += 1;
  console.error(`  ✘ ${nom}${detail ? `\n      ${String(detail).slice(0, 1500)}` : ''}`);
  return false;
};
const indicatifs = [];
const noter = (nom, valeur) => { indicatifs.push({ nom, valeur }); console.log(`  ⓘ ${nom} : ${valeur}`); };
/* La section en cours : une erreur de console dit OÙ elle est arrivée. */
let sectionCourante = '';
const titre = (t) => { sectionCourante = t.split(' ')[0]; console.log(`\n${t}`); };
const attendre = (ms) => new Promise((r) => { setTimeout(r, ms); });
/* Les blancs réduits à une espace : un retour à la ligne n'est pas une
   coupure de la désignation. */
const net = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const lancer = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} : ${r.error ? r.error.message : (r.stderr || '').trim()}`);
  return r.stdout;
};
const versEntites = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, '\'')
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');

/* ================================================================== */
/*  I. LA CHAÎNE, AU NAVIGATEUR                                         */
/* ================================================================== */

/* Le 26/11/2026 à 10 h 30 à Paris : un instant FIXÉ, pour que deux passages
   composent la même page. */
const MAINTENANT = Date.UTC(2026, 10, 26, 9, 30);

/* LES TOTAUX D'UNE VARIANTE, refaits par le miroir du téléphone
   (`totauxDevis`) : une variante change des lignes ou des conditions, ses
   totaux doivent suivre — un exemple prouve la mise en page, pas un calcul. */
function recalculer(d) {
  const lu = d.devisLu;
  lu.lignes = lu.lignes.map((l) => (l.type === 'poste' || l.type === 'option' ? { ...l, totalCentimes: totalLigne(l) } : l));
  const t = totauxDevis(lu.lignes, lu.devis);
  if (!t.ok) throw new Error(`les lignes de la variante sont irrecevables (${t.contrainte})`);
  Object.assign(lu.devis, {
    totalHtCentimes: t.ht, totalTvaCentimes: t.tva, totalTtcCentimes: t.ttc, remiseHtCentimes: t.reduction.effectif,
    acompteTtcCentimes: t.acompte.effectif, totalTtcOptionsCentimes: t.ttcOptions,
  });
  lu.ventilation = t.ventilation.filter((v) => v.nbLignes > 0);
  return d;
}
const varier = (base, f) => {
  const d = structuredClone(base);
  f(d);
  return recalculer(d);
};
const TITRES = new Set(['zone', 'piece', 'reserve']);

const E1 = (await EXEMPLES.exempleUneLigne(MAINTENANT)).donnees;
const E5 = (await EXEMPLES.exempleCinqPostes(MAINTENANT)).donnees;
const E60 = (await EXEMPLES.exempleSoixanteLignes(MAINTENANT)).donnees;

const LONGUE = (k) => `Poste ${k} : reprise soignée du support existant, ponçage, dépoussiérage, application d’une sous-couche `
  + 'adaptée puis de deux couches de finition, protection des sols et des menuiseries, nettoyage du chantier en fin de journée';

/** Les cas : un nom, les données de la séance, et ce que la page doit montrer. */
const CAS = [
  { nom: 'E1 — Exemple : 1 ligne', donnees: E1 },
  { nom: 'E5 — Exemple : 5 postes (9 lignes)', donnees: E5 },
  { nom: 'E60 — Exemple : 60 lignes', donnees: E60, latin: ['Łukasz', 'Łazienka'] },
  { nom: 'E5 en mode aperçu (« Document d’essai — sans valeur »)', donnees: varier(E5, (d) => { d.mode = 'apercu'; }) },
  { nom: 'E60 en mode aperçu', donnees: varier(E60, (d) => { d.mode = 'apercu'; }), latin: ['Łukasz', 'Łazienka'] },
  {
    nom: 'E5 en franchise de TVA',
    donnees: varier(E5, (d) => {
      d.emetteur = { ...d.emetteur, regime_tva: 'franchise' };
      d.devisLu.lignes = d.devisLu.lignes.map((l) => (TITRES.has(l.type) ? l : { ...l, tauxTvaCentiemes: 0 }));
    }),
  },
  {
    nom: 'E5 au régime non déclaré, titres et réserve seulement',
    donnees: varier(E5, (d) => {
      d.emetteur = { ...d.emetteur, regime_tva: null };
      d.devisLu.lignes = d.devisLu.lignes.filter((l) => TITRES.has(l.type));
    }),
  },
  {
    nom: 'E5, le client commande pour son entreprise',
    donnees: varier(E5, (d) => {
      d.client = { ...d.client, type: 'entreprise', nom: 'SCI DE L’EXEMPLE', siret: '00004800900013' };
      Object.assign(d.devisLu.devis, { pourQui: 'professionnel', pourQuiClient: d.client.id });
    }),
  },
  {
    nom: 'E5, une association, une copropriété ou une société civile',
    donnees: varier(E5, (d) => { Object.assign(d.devisLu.devis, { pourQui: 'non_professionnel', pourQuiClient: d.client.id }); }),
  },
  {
    nom: 'E5, une assurance dont la date est passée',
    donnees: varier(E5, (d) => { d.assurances = d.assurances.map((a) => ({ ...a, valide_jusquau: '2026-10-01' })); }),
  },
  {
    nom: 'E5, déplacement offert',
    donnees: varier(E5, (d) => { d.tarifs = { pro_id: '1', frais_deplacement_centimes: 0, frais_deplacement_texte: null, affiche: false }; }),
  },
  {
    nom: 'E5, déplacement à 35 € au-delà de 20 km',
    donnees: varier(E5, (d) => {
      d.tarifs = { pro_id: '1', frais_deplacement_centimes: 3500, frais_deplacement_texte: 'au-delà de 20 km', affiche: false };
    }),
  },
  {
    nom: 'E5, réduction et acompte en euros, payant, 30 jours',
    donnees: varier(E5, (d) => {
      Object.assign(d.devisLu.devis, {
        remiseCentiemes: null, remiseCentimes: 5000, acompteCentiemes: null, acompteCentimes: 20000, acompteNature: 'acompte',
        validiteJours: 30, coutDevisCentimes: 3000,
      });
    }),
  },
  {
    nom: 'E1, une ligne sans TVA au régime réel',
    donnees: varier(E1, (d) => {
      const l = d.devisLu.lignes.find((x) => x.type === 'poste');
      d.devisLu.lignes = [...d.devisLu.lignes, {
        ...l, id: `${l.id.slice(0, -3)}999`, ordre: 999000, designation: 'Évacuation des déchets verts', unite: 'forfait',
        quantiteMilliemes: 1000, prixUnitaireCentimes: 9000, tauxTvaCentiemes: 0,
      }];
    }),
  },
  {
    nom: 'E1, le client absent',
    donnees: varier(E1, (d) => {
      d.client = null;
      Object.assign(d.devisLu.devis, { clientId: null, pourQui: null, pourQuiClient: null });
    }),
  },
  {
    nom: 'E1, un devis vide',
    donnees: varier(E1, (d) => {
      d.client = null;
      d.devisLu.lignes = [];
      Object.assign(d.devisLu.devis, {
        clientId: null, pourQui: null, pourQuiClient: null, objet: null, lieuAdresse: null, lieuCodePostal: null, lieuVille: null,
        delaiExecution: null, validiteJours: null, coutDevisCentimes: null,
      });
    }),
  },
  {
    nom: 'E60, chaque désignation longue de 200 caractères',
    donnees: varier(E60, (d) => {
      let k = 0;
      d.devisLu.lignes = d.devisLu.lignes.map((l) => {
        if (l.type !== 'poste') return l;
        k += 1;
        return { ...l, designation: LONGUE(k) };
      });
    }),
  },
];

/* CE QUE LA PAGE DOIT PORTER EN ENTIER : les désignations des lignes et des
   options, les titres des zones et des pièces, les réserves — tels que la
   composition les écrit. */
function textesEntiers(document) {
  const t = [];
  for (const e of document.decompte || []) {
    if (e.genre === 'ligne') t.push(e.designation);
    else if (e.genre === 'reserve') t.push(e.texte);
    else if (e.titre) t.push(e.titre);
  }
  for (const e of (document.options && document.options.lignes) || []) t.push(e.designation);
  return t.filter((x) => typeof x === 'string' && x.trim());
}

/* LES MOTS DE `pdftotext -bbox`, page par page. */
function motsParPage(xhtml) {
  return xhtml.split(/<page\b/).slice(1).map((p) => [...p.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)]
    .map((m) => ({ x0: +m[1], y0: +m[2], x1: +m[3], y1: +m[4], t: versEntites(m[5]) })));
}

/* LA POLICE DE CHAQUE MORCEAU DE TEXTE, par `pdftohtml -xml`. */
function morceauxEtPolices(xml) {
  const polices = new Map([...xml.matchAll(/<fontspec id="(\d+)"[^>]*family="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  return [...xml.matchAll(/<text [^>]*font="(\d+)"[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => ({ police: polices.get(m[1]) || '?', texte: versEntites(m[2].replace(/<[^>]+>/g, '')) }));
}

const navigateur = await playwright.chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const releve = [];

titre(`I. La chaîne, au navigateur — Chromium ${navigateur.version()}, ${CAS.length} cas, échelle d’iOS (1,0667)`);
verifier('trois exemples et une douzaine de variantes (§8.3, point 1)', CAS.length >= 15, String(CAS.length));

for (const [rang, c] of CAS.entries()) {
  titre(`I.${rang + 1} ${c.nom}`);
  const fichier = path.join(DOSSIER, `cas-${String(rang + 1).padStart(2, '0')}`);
  let compose;
  try {
    compose = composerLApercu(c.donnees, MAINTENANT, POLICES_DEVIS);
  } catch (e) {
    verifier('la chaîne compose la page', false, String(e && e.stack));
    continue;
  }
  if (!verifier('la chaîne compose la page', compose && compose.ok === true, JSON.stringify(compose && { raison: compose.raison, phrase: compose.phrase }))) continue;
  const { document, html } = compose;
  writeFileSync(`${fichier}.html`, html);

  /* 2. LA MISE EN PAGES, aux mesures d'iOS. */
  const page = await navigateur.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const brut = Buffer.from(await page.pdf({
    width: A4.A4_MM.largeur, height: A4.A4_MM.hauteur, margin: A4.MARGES_MM, scale: 1.0667,
  }));
  await page.close();

  /* 3. LE TAMPON, le vrai, dans `node`. */
  let t;
  try {
    t = await tamponner(PDFLib, brut, { textes: document.marques, numeroAffiche: document.numeroAffiche, a4: A4 });
  } catch (e) {
    verifier('le tampon se pose', false, String(e && e.message));
    continue;
  }
  writeFileSync(`${fichier}.pdf`, t.octets);
  const N = t.pages;

  /* 4. CE QUI SE REFUSE. */
  const brutTexte = lancer('pdftotext', ['-enc', 'UTF-8', '-raw', `${fichier}.pdf`, '-']);
  const pages = brutTexte.split('\f');
  const tout = net(brutTexte);
  const entiers = textesEntiers(document);
  const absents = entiers.filter((x) => !tout.includes(net(x)));
  verifier(`chaque désignation, titre et réserve se lit ENTIER dans le texte du PDF (${entiers.length})`, absents.length === 0,
    absents.map((x) => `« ${x} »`).join(' | '));

  /* Les marques de CHAQUE page, posées par le tampon. */
  /* La page 1 porte la marque DEUX fois : dans le flux (le gabarit) et en
     tête (le tampon). Les suivantes, une fois : celle du tampon. La
     diagonale est une ligne « APERÇU » seule. */
  const sansTete = [];
  const sansDiagonale = [];
  const sansPied = [];
  for (let k = 1; k <= N; k += 1) {
    const brute = pages[k - 1] || '';
    const p = net(brute);
    if (p.split(MARQUE_APERCU).length - 1 < (k === 1 ? 2 : 1)) sansTete.push(k);
    if (!brute.split('\n').some((l) => l.trim() === DIAGONALE)) sansDiagonale.push(k);
    if (!p.includes(net(pied(document.numeroAffiche, k, N)))) sansPied.push(k);
  }
  verifier(`chaque page porte « ${MARQUE_APERCU} » en tête (la page 1 aussi dans le flux)`, sansTete.length === 0,
    `pages ${sansTete.join(', ')}`);
  verifier(`…la diagonale « ${DIAGONALE} »`, sansDiagonale.length === 0, `pages ${sansDiagonale.join(', ')}`);
  verifier(`…et son pied « ${pied(document.numeroAffiche, 1, N)} », page par page`, sansPied.length === 0, `pages ${sansPied.join(', ')}`);
  if (document.marques && document.marques.exemple) {
    const sansExemple = pages.slice(0, N).map((p, k) => (net(p).includes(MARQUE_EXEMPLE) ? null : k + 1)).filter(Boolean);
    verifier(`…et « ${MARQUE_EXEMPLE} » sur chaque page (D19)`, sansExemple.length === 0, `pages ${sansExemple.join(', ')}`);
  }

  /* Le numéro en attente, PAR POSITION, en page 1 (§4.6). */
  {
    const mots = motsParPage(lancer('pdftotext', ['-enc', 'UTF-8', '-bbox', '-f', '1', '-l', '1', `${fichier}.pdf`, '-']))[0] || [];
    const haut = A4.MARGES_PT.top - 1;
    const bas = A4.A4_PT.hauteur - A4.MARGES_PT.bottom + 1;
    const dansLeContenu = mots.filter((m) => m.y0 >= haut && m.y1 <= bas);
    const prefixe = document.numero.prefixe;
    const i = dansLeContenu.findIndex((m) => m.t === prefixe || m.t.startsWith(prefixe));
    const dev = dansLeContenu[i];
    let ok = false;
    let detail = `aucun mot « ${prefixe} » dans la zone du contenu`;
    if (dev && dev.t === `${prefixe}····`) {
      ok = true;
      detail = '';
    } else if (dev && dev.t === prefixe) {
      const suite = dansLeContenu[i + 1];
      const em = dev.y1 - dev.y0;
      const ecart = suite ? suite.x0 - dev.x1 : null;
      ok = !!suite && suite.t === '····' && Math.abs(suite.y0 - dev.y0) < 1 && ecart >= -0.5 && ecart < em;
      detail = suite ? `« ${suite.t} », écart ${ecart.toFixed(1)} pt, hauteur d’un caractère ${em.toFixed(1)} pt` : 'rien après';
      if (ok) noter('l’écart entre « DEV-2026- » et « ···· »', `${ecart.toFixed(1)} pt (un caractère : ${em.toFixed(1)} pt)`);
    }
    verifier(`le numéro : « ${prefixe} » puis « ···· » sur la même ligne, à moins d’un caractère, dans le contenu de la page 1`, ok, detail);
    /* Ni le gabarit « 0000 », ni un rang chiffré collé au préfixe, ni un
       nombre posé sur la ligne du numéro. */
    const chiffres = dansLeContenu.filter((m) => m.t === '0000' || new RegExp(`^${prefixe}\\d`).test(m.t)
      || (dev && Math.abs(m.y0 - dev.y0) < 1 && m.x0 > dev.x0 && /^\d+$/.test(m.t)));
    verifier('…et ni « 0000 » ni un rang chiffré ne se lit (le gabarit est caché)', chiffres.length === 0,
      chiffres.map((m) => m.t).join(' | '));
  }

  /* Les polices : Inter et Oswald, embarquées. */
  {
    const lignes = lancer('pdffonts', [`${fichier}.pdf`]).split('\n').slice(2).filter(Boolean);
    const embarquee = (re) => lignes.some((l) => re.test(l.split(/\s+/)[0]) && /\byes\b/.test(l.split(/\s+/).slice(-5).join(' ')));
    verifier('`pdffonts` : Inter et Oswald, embarquées', embarquee(/Inter/i) && embarquee(/Oswald/i), lignes.map((l) => l.split(/\s+/)[0]).join(', '));
  }

  /* Le latin étendu, en Inter (jamais en Oswald, jamais une police du
     système). */
  if (c.latin) {
    const morceaux = morceauxEtPolices(lancer('pdftohtml', ['-xml', '-i', '-q', '-stdout', `${fichier}.pdf`]));
    for (const mot of c.latin) {
      const ou = morceaux.filter((m) => m.texte.includes(mot));
      verifier(`« ${mot} » est écrit en Inter (${ou.length} fois)`, ou.length > 0 && ou.every((m) => /Inter/i.test(m.police)),
        ou.map((m) => `${m.police} : « ${m.texte} »`).join(' | ') || 'introuvable');
    }
  }

  /* 5. CE QUI SE RELÈVE, SANS REFUSER. */
  const rangeeTotal = ((document.totaux && document.totaux.rangees) || []).find((r) => r.cle === 'total');
  const pageDesTotaux = rangeeTotal
    ? pages.slice(0, N).map((p, k) => (net(p).includes(net(rangeeTotal.libelle)) && net(p).includes(net(rangeeTotal.montant)) ? k + 1 : null))
      .filter(Boolean).pop() ?? null
    : null;
  /* Les lignes chiffrées : celles du décompte et les options. Une ligne
     « coupée » n'a pas sa désignation ET son détail sur une même page ; les
     totaux sont « seuls » quand leur page ne porte aucune de ces lignes. */
  const lignesChiffrees = [...(document.decompte || []), ...((document.options && document.options.lignes) || [])]
    .filter((e) => e.genre === 'ligne');
  const coupees = lignesChiffrees.filter((e) => !pages.slice(0, N).some((p) => net(p).includes(net(e.designation))
    && net(p).includes(net(e.detail || ''))));
  const totauxSeuls = pageDesTotaux > 1
    && !lignesChiffrees.some((e) => net(pages[pageDesTotaux - 1]).includes(net(e.designation)));
  noter('pages', String(N));
  noter('page des totaux', pageDesTotaux == null ? 'aucune rangée « total »' : `${pageDesTotaux}${totauxSeuls ? ' (les totaux sont SEULS sur cette page)' : ''}`);
  noter('lignes coupées entre deux pages', coupees.length ? coupees.map((e) => `« ${e.designation.slice(0, 40)} »`).join(' ; ') : 'aucune');
  releve.push({
    cas: c.nom, pages: N, pageDesTotaux, totauxSeuls, coupees: coupees.length, octets: t.octets.length, polices: t.polices,
  });
}
await navigateur.close();

/* ================================================================== */
/*  II. L'APPLICATION, EN DÉMONSTRATION                                 */
/* ================================================================== */

const PAUSE_DEMO = Number((readFileSync(path.join(RACINE, 'src/lib/api.js'), 'utf8').match(/const PAUSE_ECRITURE_DEMO = (\d+);/) || [])[1]);
const RANGEE_VOIX = TEXTES_DE_L_ECRAN.rangeeVoix;
const TERRASSE = 'Platelage de terrasse en pin traité';
/* Une désignation qui essaie de faire tourner du code dans le cadre : un
   `<script>` et un `<img onerror>`, qui écriraient tous deux à la page. */
const PIEGE = `${TERRASSE} <script>parent.postMessage('opus-script','*')</script><img src=x onerror="parent.postMessage('opus-img','*')">`;

if (SANS_APPLICATION) {
  titre('II. L’application : non mesurée (--sans-application)');
} else {
  const reponse = await fetch(`http://localhost:${PORT}`).catch(() => null);
  if (!reponse || !reponse.ok) machine(`aucun serveur sur http://localhost:${PORT}. Lancez : npx expo start --web -c --port ${PORT} (sans .env).`);
  titre(`II. L’application, en démonstration — http://localhost:${PORT}`);
  verifier(`la pause de la base de démonstration est lue dans api.js (${PAUSE_DEMO} ms)`, PAUSE_DEMO > 0,
    'sans elle, une écriture qui ne revient pas ne se simule pas : la mesure a perdu sa cible');

  const n = await playwright.chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await n.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(({ pause }) => {
    /* LA PAGE SEULE, jamais le cadre de l'aperçu : Playwright pose ce script
       dans CHAQUE cadre, celui `sandbox=""` compris, où chaque tour de la
       minuterie ci-dessous est un script BLOQUÉ — mesuré le 27/11 : environ
       cinquante « Blocked script execution in 'about:srcdoc' » par seconde,
       qui venaient de cette mesure et non du devis. */
    if (window.top !== window) return;
    /* L'ÉCRITURE DE DÉMONSTRATION, ralentie à la demande : seule la
       minuterie de `pause` millisecondes appelée depuis l'écrivain
       (`ecrire`). `null` = la vraie. */
    const origine = window.setTimeout.bind(window);
    window.__opusPauseEcritures = null;
    window.setTimeout = (f, ms, ...reste) => {
      if (window.__opusPauseEcritures != null && ms === pause && /\becrire\b/.test(String(new Error().stack))) {
        return origine(f, window.__opusPauseEcritures, ...reste);
      }
      return origine(f, ms, ...reste);
    };
    /* LE TEXTE DE L'ÉCRAN, relevé à chaque changement pendant une séance :
       « jamais à aucun instant » se juge à chaque instant. */
    window.__opusReleve = null;
    const relever = () => {
      if (!window.__opusReleve || !document.body) return;
      const t = document.body.innerText;
      if (window.__opusReleve[window.__opusReleve.length - 1] !== t) window.__opusReleve.push(t);
    };
    window.setInterval(relever, 20);
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(relever).observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    /* CE QU'UN SCRIPT DU CADRE ÉCRIRAIT À LA PAGE. */
    window.__opusMessages = [];
    window.addEventListener('message', (e) => { window.__opusMessages.push(String(e.data)); });
    /* LES ANNONCES À VOICEOVER, relevées une fois branchées. */
    window.__opusAnnonces = [];
  }, { pause: PAUSE_DEMO });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const ou = m.location() && m.location().url ? ` (${String(m.location().url).slice(0, 60)})` : '';
    erreurs.push(`[${sectionCourante}] ${m.text().slice(0, 300)}${ou}`);
  });
  page.on('pageerror', (e) => erreurs.push(`[${sectionCourante}] pageerror : ${String(e.message).slice(0, 300)}`));

  const texte = () => page.evaluate(() => document.body.innerText);
  const parLibelle = (l) => page.getByLabel(l, { exact: true }).first();
  const bouton = (nom) => page.getByRole('button', { name: nom, exact: true }).first();
  const capture = async (nom) => { if (SORTIES) await page.screenshot({ path: path.join(SORTIES, `capture-${nom}.png`) }); };
  const appuyer = async (loc) => { await loc.scrollIntoViewIfNeeded({ timeout: 8000 }); await loc.click({ timeout: 8000 }); await attendre(350); };
  const jusqua = async (f, ms = 15000, pas = 100) => {
    const fin = Date.now() + ms;
    for (;;) {
      const v = await f().catch(() => null);
      if (v || Date.now() > fin) return v;
      await attendre(pas);
    }
  };
  const cadre = () => page.locator('iframe').first().evaluate((f) => ({
    sandbox: f.getAttribute('sandbox'), doc: f.getAttribute('srcdoc') || '', titre: f.getAttribute('title'),
  })).catch(() => null);
  /* Les boutons visibles DANS la carte de l'aperçu (la carte est posée par
     dessus la saisie, qui reste montée dessous). */
  const boutonsDeLaCarte = () => page.evaluate((libelleRetour) => {
    let racine = document.querySelector(`[aria-label="${libelleRetour}"]`);
    while (racine && racine.parentElement && getComputedStyle(racine).position !== 'absolute') racine = racine.parentElement;
    if (!racine) return null;
    return [...racine.querySelectorAll('[role="button"],button')].map((b) => (b.getAttribute('aria-label') || b.innerText || '').trim());
  }, TEXTES_DE_L_ECRAN.retourVoix);
  /* LA PART DU DOCUMENT dans la hauteur UTILE : entre le bas de la barre de
     la carte (« ‹ Devis ») et le haut de la barre du bas d'OpusApp (ou le
     bas de la fenêtre si elle n'y est pas). Le document : la FEUILLE (le
     parent du cadre, réduit à la largeur de l'écran), marges de papier
     comprises. Le premier jet mesurait le cadre SEUL, à l'intérieur des
     15 mm de marge : il comptait les marges blanches de la page comme du
     vide — ce que la page d'un PDF, sur l'iPhone, ne fait pas. Ce qu'il
     mesurait reste relevé, à titre indicatif (`interieur`). */
  const partDuDocument = () => page.evaluate((libelleRetour) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let barre = document.querySelector(`[aria-label="${libelleRetour}"]`);
    while (barre && barre.parentElement && barre.getBoundingClientRect().width < vw - 1) barre = barre.parentElement;
    const f = document.querySelector('iframe');
    if (!barre || !f) return null;
    const onglets = document.querySelector('[role="tablist"]');
    const bo = onglets ? onglets.getBoundingClientRect() : null;
    const basUtile = bo && bo.height > 0 && bo.top < vh ? bo.top : vh;
    const hautUtile = barre.getBoundingClientRect().bottom;
    const doc = (f.parentElement || f).getBoundingClientRect();
    const dedans = f.getBoundingClientRect();
    const part = (r) => Math.min(r.bottom, basUtile) - Math.max(r.top, hautUtile);
    return {
      utile: basUtile - hautUtile, document: part(doc), interieur: part(dedans), vw, vh,
    };
  }, TEXTES_DE_L_ECRAN.retourVoix);
  const releverTextes = (oui) => page.evaluate((v) => { window.__opusReleve = v ? [] : null; }, oui);
  /* Le relevé se LIT avant d'être arrêté : arrêté d'abord, il ne rendait
     rien, et « à aucun des 0 instants » ne jugeait rien (mesuré, 27/11). */
  const finirLeReleve = () => page.evaluate(() => { const r = window.__opusReleve || []; window.__opusReleve = null; return r; });
  const annonces = () => page.evaluate(() => window.__opusAnnonces.slice());
  const viderAnnonces = () => page.evaluate(() => { window.__opusAnnonces.length = 0; });

  /* LE WEB DIT LA VÉRITÉ : la phrase fixe retirée, aucun « sur chaque
     page » ; ni « Mise en page… », ni la marque sur chaque page, ni le résumé
     « N pages ». Sur CHAQUE texte relevé pendant la séance. */
  const ditFaux = (t) => {
    const sans = t.split(PHRASE_WEB).join(' ');
    return /sur chaque page/.test(sans) || sans.includes(ETAPE_MISE_EN_PAGE) || sans.includes(ETAPE_MARQUE);
  };
  const PARTAGER = /partag|imprim|share|print/i;

  try {
    titre('II.1 Le démarrage');
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
    await page.getByText('JE SUIS UN PROFESSIONNEL').first().waitFor({ timeout: 240000 });
    const ecoute = await page.evaluate(() => {
      const ms = window.__r && window.__r.getModules ? window.__r.getModules() : null;
      if (!ms) return false;
      const tous = [...(ms instanceof Map ? ms.entries() : Object.entries(ms))].map(([, m]) => m);
      for (const m of tous) {
        if (m && m.isInitialized && typeof m.verboseName === 'string'
          && m.verboseName.endsWith('node_modules/react-native-web/dist/exports/AccessibilityInfo/index.js')) {
          const o = m.publicModule && m.publicModule.exports && (m.publicModule.exports.default || m.publicModule.exports);
          if (!o || typeof o.announceForAccessibility !== 'function') return false;
          if (!o.opusEcoute) {
            const avant = o.announceForAccessibility;
            o.announceForAccessibility = function ecouter(t) { window.__opusAnnonces.push(String(t)); return avant.call(this, t); };
            o.opusEcoute = true;
          }
          return true;
        }
      }
      return false;
    });
    verifier('les annonces à VoiceOver sont écoutées (Metro expose ses modules en développement)', ecoute);
    await appuyer(page.getByText('JE SUIS UN PROFESSIONNEL').first());
    await attendre(2500);
    if (await page.getByText('Plus tard').first().count()) await appuyer(page.getByText('Plus tard').first());
    if (!verifier('la démonstration démarre (« MODE DÉMONSTRATION »)', /MODE DÉMONSTRATION/.test(await texte()))) throw new Error('pas de démonstration');

    titre('II.2 « Mes devis » : les exemples d’Opus Dev');
    await appuyer(page.getByRole('tab', { name: 'Profil' }));
    await appuyer(parLibelle('Mes devis : les brouillons de chiffrage'));
    await page.getByText('Rénovation salle de bains').first().waitFor({ timeout: 8000 });
    await attendre(500);
    verifier(`la ligne « ${TEXTES_DE_L_ECRAN.exemplesTitre} »`, (await texte()).includes(TEXTES_DE_L_ECRAN.exemplesTitre));
    const NOMS = [TEXTES_DE_L_ECRAN.exempleUneLigne, TEXTES_DE_L_ECRAN.exempleCinqPostes, TEXTES_DE_L_ECRAN.exempleSoixanteLignes];
    const boites = [];
    for (const b of NOMS) boites.push(await bouton(b).boundingBox().catch(() => null));
    verifier('…trois boutons EN COLONNE, de 44 points au moins, à la même abscisse',
      boites.every((x) => x && x.height >= 43.5 && x.width >= 43.5) && boites[0].y < boites[1].y && boites[1].y < boites[2].y
      && Math.abs(boites[0].x - boites[2].x) < 1, JSON.stringify(boites.map((x) => x && [Math.round(x.x), Math.round(x.y), Math.round(x.height)])));
    verifier('…et les cartes de brouillon sont toujours cinq (les exemples n’en sont pas)',
      (await page.locator('button[aria-label^="Ouvrir le brouillon "]').count()) === 5);
    await capture('mes-devis');
    const ATTENDUS = { [NOMS[0]]: 'Terrasse', [NOMS[1]]: 'Rénovation', [NOMS[2]]: 'Łukasz' };
    for (const b of NOMS) {
      await appuyer(bouton(b));
      const vu = await jusqua(() => page.locator('iframe').count().then((k) => k > 0), 30000);
      await attendre(500);
      const t = await texte();
      const f = await cadre();
      verifier(`${b} : l’écran « ${TEXTES_DE_L_ECRAN.titreExemple} », la phrase du navigateur et la bande`,
        !!vu && t.includes(TEXTES_DE_L_ECRAN.titreExemple) && t.includes(PHRASE_WEB) && t.includes(BANDE_WEB));
      verifier(`${b} : le cadre est fermé (sandbox=""), il porte la page composée et « ${MARQUE_EXEMPLE} »`,
        !!f && f.sandbox === '' && f.doc.includes(ATTENDUS[b]) && f.doc.includes(MARQUE_EXEMPLE) && !/<script/i.test(f.doc),
        f && `${f.sandbox} ${f.doc.length}`);
      verifier(`${b} : le texte de l’écran ne dit pas « sur chaque page » (hors de sa phrase fixe), aucun bouton qui partage ou imprime`,
        !ditFaux(t) && !(await page.getByRole('button').evaluateAll((bs) => bs.map((x) => x.getAttribute('aria-label') || x.innerText || '')))
          .some((x) => PARTAGER.test(x)));
      await capture(`exemple-${NOMS.indexOf(b) + 1}`);
      await appuyer(parLibelle('Revenir en arrière'));
      await page.getByText('Rénovation salle de bains').first().waitFor({ timeout: 8000 });
    }
    verifier('« Revenir en arrière » ramène à « Mes devis » après chaque exemple', (await texte()).includes(TEXTES_DE_L_ECRAN.exemplesTitre));

    titre('II.3 Un brouillon → « Aperçu du devis (page A4) » : la carte reste ouverte, le cadre web');
    await appuyer(page.locator('button[aria-label^="Ouvrir le brouillon "]').filter({ hasText: 'Terrasse en bois' }).first());
    await parLibelle(RANGEE_VOIX).waitFor({ timeout: 8000 });
    const rangee = parLibelle(RANGEE_VOIX);
    await rangee.scrollIntoViewIfNeeded();
    const bRangee = await rangee.boundingBox();
    verifier(`la rangée « ${TEXTES_DE_L_ECRAN.rangee} », 44 points par sa boîte`, !!bRangee && bRangee.height >= 43.5, JSON.stringify(bRangee));
    /* Une ligne CHANGÉE juste avant le geste : l'enregistrement a quelque
       chose à attendre. La désignation porte le piège. */
    await appuyer(parLibelle(`${TERRASSE}, ouvrir`));
    await page.getByLabel('Désignation de la ligne', { exact: true }).first().fill(PIEGE);
    await appuyer(parLibelle('Enregistrer cette ligne et revenir au devis'));
    await viderAnnonces();
    await releverTextes(true);
    await appuyer(parLibelle(RANGEE_VOIX));
    const vu = await jusqua(() => page.locator('iframe').count().then((k) => k > 0), 30000);
    await attendre(1500);
    const etapes = await finirLeReleve();
    const t = await texte();
    verifier('la carte « Aperçu du devis » est OUVERTE après l’enregistrement (E-G1) : « ‹ Devis », son titre, le cadre',
      !!vu && t.includes(TEXTES_DE_L_ECRAN.retour) && t.includes(TEXTES_DE_L_ECRAN.titre) && t.includes(BANDE_WEB)
      && t.includes(PHRASE_WEB));
    noter('étapes vues pendant la séance', [ETAPE_ENREGISTREMENT, 'Lecture du devis…', ETAPE_MISE_EN_PAGE, ETAPE_MARQUE]
      .filter((x) => etapes.some((e) => e.includes(x))).join(', ') || 'aucune (trop rapide)');
    const faux = etapes.filter(ditFaux);
    verifier(`à aucun des ${etapes.length} instants relevés, l’écran ne dit « sur chaque page », « Mise en page… » ou la marque sur chaque page (E-M5)`,
      etapes.length > 0 && faux.length === 0, faux.slice(0, 2).join(' ⏎ ').slice(0, 600));
    const f = await cadre();
    verifier('le cadre : sandbox="" (la chaîne vide), le titre « Aperçu du devis », « Document d’essai — sans valeur », pas la marque d’exemple',
      !!f && f.sandbox === '' && f.titre === TEXTES_DE_L_ECRAN.titre && f.doc.includes(MARQUE_ESSAI) && !f.doc.includes(MARQUE_EXEMPLE));
    verifier('le piège de la désignation est ÉCHAPPÉ dans la page (aucun <script, aucun <img)',
      !!f && f.doc.includes('&lt;script&gt;') && !/<script/i.test(f.doc) && !/<img/i.test(f.doc));
    const messages = await page.evaluate(() => window.__opusMessages.slice());
    verifier('…et aucun script n’a tourné : rien n’est arrivé à la page (T13)', messages.length === 0, messages.join(' | '));
    const boutons = await boutonsDeLaCarte();
    verifier('aucun bouton « Partager » ou « Imprimer » dans la carte', Array.isArray(boutons) && !boutons.some((x) => PARTAGER.test(x)),
      JSON.stringify(boutons));
    const ann = await annonces();
    verifier(`VoiceOver : une annonce au début (« ${ETAPE_ENREGISTREMENT} »), une à la fin (« ${ANNONCE_FIN_WEB} »), pas une par étape`,
      ann.length === 2 && ann[0] === ETAPE_ENREGISTREMENT && ann[1] === ANNONCE_FIN_WEB, JSON.stringify(ann));
    await appuyer(parLibelle(TEXTES_DE_L_ECRAN.depliant));
    verifier('« Ce que montre cet aperçu » déplie ses phrases, À LA PLACE du document',
      (await texte()).includes('Ce n’est pas encore le document complet') && (await page.locator('iframe').count()) === 0);
    await capture('ce-que-montre');
    await appuyer(parLibelle(TEXTES_DE_L_ECRAN.depliant));
    for (const [l, h] of [[393, 852], [320, 568]]) {
      await page.setViewportSize({ width: l, height: h });
      await attendre(900);
      const p = await partDuDocument();
      verifier(`à ${l} × ${h} : la feuille du document garde au moins 60 % de la hauteur utile (E-M2)`, !!p && p.utile > 0 && p.document / p.utile >= 0.6,
        JSON.stringify(p));
      if (p) {
        noter(`part de la feuille à ${l} × ${h}`, `${Math.round((100 * p.document) / p.utile)} % (${Math.round(p.document)} sur ${Math.round(p.utile)} points)`);
        noter(`…dont l’intérieur des marges de papier`, `${Math.round((100 * p.interieur) / p.utile)} % (${Math.round(p.interieur)} points)`);
      }
      await capture(`carte-${l}x${h}`);
    }
    await page.setViewportSize({ width: 393, height: 852 });
    await attendre(600);

    titre('II.4 « ‹ Devis » ferme la carte ; rouvrir donne un aperçu neuf');
    await appuyer(parLibelle(TEXTES_DE_L_ECRAN.retourVoix));
    verifier('la carte est fermée : la saisie est là, plus de cadre', (await page.locator('iframe').count()) === 0
      && (await parLibelle(RANGEE_VOIX).count()) === 1 && !(await texte()).includes(BANDE_WEB));
    await appuyer(parLibelle(RANGEE_VOIX));
    verifier('rouvrir : un aperçu neuf, le cadre revient',
      !!(await jusqua(() => page.locator('iframe').count().then((k) => k === 1), 15000)));
    await appuyer(parLibelle(TEXTES_DE_L_ECRAN.retourVoix));

    titre('II.5 Fermer PENDANT l’enregistrement, puis rouvrir (E-M4)');
    await page.evaluate(() => { window.__opusPauseEcritures = 3000; });
    await appuyer(parLibelle(`${PIEGE}, ouvrir`));
    await page.getByLabel('Désignation de la ligne', { exact: true }).first().fill(TERRASSE);
    await appuyer(parLibelle('Enregistrer cette ligne et revenir au devis'));
    await releverTextes(true);
    await appuyer(parLibelle(RANGEE_VOIX));
    const enCours = await jusqua(() => texte().then((x) => x.includes(ETAPE_ENREGISTREMENT)), 2500, 30);
    verifier(`la séance est à « ${ETAPE_ENREGISTREMENT} » (une écriture en route)`, !!enCours);
    await appuyer(parLibelle(TEXTES_DE_L_ECRAN.retourVoix));
    verifier('…fermée pendant l’enregistrement : aucun cadre', (await page.locator('iframe').count()) === 0);
    await appuyer(parLibelle(RANGEE_VOIX));
    const revenu = await jusqua(() => page.locator('iframe').count().then((k) => k === 1), 20000);
    const etapesM4 = await finirLeReleve();
    const apres = await texte();
    const fauxM4 = etapesM4.filter(ditFaux);
    verifier(`…à aucun des ${etapesM4.length} instants relevés de ce va-et-vient, l’écran ne dit « sur chaque page » (E-M5)`,
      etapesM4.length > 0 && fauxM4.length === 0, fauxM4.slice(0, 2).join(' ⏎ ').slice(0, 600));
    verifier('rouverte : l’aperçu vient, sans refus ni « aperçu précédent »', !!revenu
      && !apres.includes(PRECEDENT) && !apres.includes('[enregistrement]'));
    verifier('…et le cadre porte la désignation enregistrée', !!(await cadre()) && (await cadre()).doc.includes(TERRASSE)
      && !(await cadre()).doc.includes('&lt;script&gt;'));
    await page.evaluate(() => { window.__opusPauseEcritures = null; });
    await appuyer(parLibelle(TEXTES_DE_L_ECRAN.retourVoix));

    titre('II.6 Une ligne qui ne part pas : « [enregistrement] … », « Revenir au devis », pas d’aperçu');
    await page.evaluate(() => { window.__opusPauseEcritures = 60000; });
    await appuyer(parLibelle(`${TERRASSE}, ouvrir`));
    await page.getByLabel('Désignation de la ligne', { exact: true }).first().fill(`${TERRASSE}, lames de 27 mm`);
    await appuyer(parLibelle('Enregistrer cette ligne et revenir au devis'));
    await viderAnnonces();
    await appuyer(parLibelle(RANGEE_VOIX));
    const refus = await jusqua(() => texte().then((x) => x.includes('[enregistrement]')), DELAI_ECRITURE + 8000, 200);
    const tr = await texte();
    const bc = await boutonsDeLaCarte();
    verifier(`le refus dit « ${REFUS_UNE_LIGNE} »`, !!refus && tr.includes(REFUS_UNE_LIGNE), tr.slice(0, 400));
    verifier(`…avec « ${REVENIR} », jamais « ${REESSAYER} », et aucun cadre`,
      Array.isArray(bc) && bc.filter((x) => x === REVENIR).length >= 2 && !bc.includes(REESSAYER)
      && (await page.locator('iframe').count()) === 0, JSON.stringify(bc));
    /* LA PHRASE DU REFUS (§6.3) : « [enregistrement] … », puis la phrase de
       la garde PAR CAS (`bilanDeLaGarde`) — ici une ligne en route, ou une
       ligne qui n'a pas pu l'être, selon l'instant. Écrites en toutes
       lettres (K11). */
    const GARDES = [
      'Une ligne n’est pas encore enregistrée : l’envoi continue, mais rien ne garantit qu’il aboutira.',
      'Une ligne n’a pas pu être enregistrée.',
    ];
    const refusEntiers = GARDES.map((g) => `${REFUS_UNE_LIGNE} ${g}`);
    verifier('…la phrase du refus est suivie de la phrase de la garde, par cas (§6.3)',
      refusEntiers.some((x) => tr.includes(x)), tr.slice(0, 400));
    const annR = await annonces();
    /* LES ANNONCES DE LA SÉANCE (§5.3) : une au début, une au refus, aucune
       « Aperçu prêt ». La SAISIE, elle, annonce son propre échec d'écriture
       (« Une ligne n’a pas pu être enregistrée. », lot 1) : relevé, pas
       jugé ici. */
    const deLaSeance = annR.filter((a) => a === ETAPE_ENREGISTREMENT || a.startsWith('[') || a === ANNONCE_FIN_WEB);
    verifier('VoiceOver, les annonces de la séance : celle du début, puis la phrase ENTIÈRE du refus — et aucune « Aperçu prêt »',
      deLaSeance.length === 2 && deLaSeance[0] === ETAPE_ENREGISTREMENT && refusEntiers.includes(deLaSeance[1])
      && annR[annR.length - 1] === deLaSeance[1], JSON.stringify(annR));
    const autres = annR.filter((a) => !deLaSeance.includes(a));
    noter('autres annonces pendant la séance (la saisie)', autres.length ? JSON.stringify(autres) : 'aucune');
    await capture('refus-enregistrement');
    /* Le bouton du REFUS (le second « Revenir au devis » : le premier est la
       barre de la carte). */
    await appuyer(page.getByRole('button', { name: REVENIR, exact: true }).last());
    verifier(`« ${REVENIR} » ferme la carte`, (await parLibelle(RANGEE_VOIX).count()) === 1 && !(await texte()).includes(BANDE_WEB));
    await page.evaluate(() => { window.__opusPauseEcritures = null; });
    /* LE MÉNAGE : la ligne repart, par son « Réessayer » (la rangée de la
       ligne : « Ligne non enregistrée. Réessayer »), pour que la saisie se
       quitte sans la garde. */
    const reessayer = parLibelle('Ligne non enregistrée. Réessayer');
    await jusqua(() => reessayer.count().then((k) => k > 0), 2 * DELAI_ECRITURE + 5000);
    if (await reessayer.count()) await appuyer(reessayer);
    const repartie = await jusqua(() => reessayer.count().then((k) => k === 0), DELAI_ECRITURE + 4000);
    verifier('le ménage : la ligne est repartie (plus de « Non enregistrée »)', !!repartie);

    titre('II.7 Un brouillon NEUF : la phrase, sur la même hauteur, et aucune rangée');
    await appuyer(parLibelle('Revenir en arrière'));
    const surMesDevis = await jusqua(() => page.getByText('Nouveau devis', { exact: true }).count().then((k) => k > 0), DELAI_ECRITURE + 4000);
    if (!surMesDevis) throw new Error(`la saisie ne s’est pas quittée : ${(await texte()).slice(-300)}`);
    await appuyer(page.getByText('Nouveau devis', { exact: true }).first());
    const phrase = page.getByText(PAS_EN_BASE, { exact: true }).first();
    await jusqua(() => phrase.count().then((k) => k > 0), 8000);
    const bPhrase = await phrase.evaluate((e) => e.parentElement.getBoundingClientRect().height).catch(() => null);
    verifier(`« ${PAS_EN_BASE} », aucune rangée`, (await phrase.count()) === 1 && (await parLibelle(RANGEE_VOIX).count()) === 0);
    verifier('…sur 44 points au moins, la place de la rangée', bPhrase >= 43.5, String(bPhrase));
    await capture('brouillon-neuf');

    titre('II.8 La console');
    const graves = erreurs.filter((e) => !/play\(\)|Download the React DevTools|ResizeObserver|aria-hidden|Unknown event handler|accessibilityViewIsModal/.test(e));
    /* Le détail, GROUPÉ : chaque message une fois, avec son nombre. */
    const groupes = [...graves.reduce((m, e) => m.set(e, (m.get(e) || 0) + 1), new Map())].map(([e, k]) => `${k} × ${e}`);
    verifier('aucune erreur de console grave', graves.length === 0, groupes.slice(0, 8).join(' || '));
    verifier('…et aucun « Blocked script execution » : le cadre n’a jamais eu de script à bloquer',
      !erreurs.some((e) => /Blocked script execution/i.test(e)));
  } catch (e) {
    verifier('la mesure de l’application est allée au bout', false, String(e && e.stack).slice(0, 1200));
    await capture('erreur').catch(() => {});
  } finally {
    await n.close();
  }
}

/* ------------------------------------------------------------------ */
/*  Le bilan                                                            */
/* ------------------------------------------------------------------ */

if (SORTIES) writeFileSync(path.join(SORTIES, 'releve-indicatif.json'), `${JSON.stringify({ releve, indicatifs }, null, 1)}\n`);
else rmSync(DOSSIER, { recursive: true, force: true });
console.log(`\n${justes} justes, ${echecs} en échec${SORTIES ? ` — sorties dans ${SORTIES}` : ''}.`);
console.log('Ce que cette mesure ne dit pas : rien de l’iPhone (pdf-lib sous Hermes, la mise en page de WebKit, '
  + 'l’afficheur de PDF d’iOS, VoiceOver lui-même).');
process.exit(echecs ? 1 : 0);
