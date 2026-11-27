/**
 * LES TROIS PDF DE DONNÉES DE L'APERÇU — étape 2c-1, cahier §8.1 E (K16).
 *
 * CE QUE FAIT CE SCRIPT
 * ---------------------
 * Il fabrique les trois PDF sur lesquels `verifier-apercu` (E) pose le VRAI
 * tampon, dans GitHub, sans navigateur :
 *
 *   - `scripts/donnees/apercu-chromium-1.pdf`  : un devis d'UNE ligne ;
 *   - `scripts/donnees/apercu-chromium-60.pdf` : un devis de SOIXANTE lignes
 *     (quatre zones, huit pièces, quarante-quatre postes, deux réserves, deux
 *     options), qui tient sur plusieurs pages ;
 *   - `scripts/donnees/apercu-xobjet.pdf`      : le premier, chaque page
 *     enveloppée dans un XObject de forme — ce que fait iOS, qui redessine
 *     chaque page du PDF de WebKit (`CGContextDrawPDFPage`) : ses polices ne
 *     sont plus dans les ressources de la page (T2).
 *
 * Les deux premiers sortent de Chromium, par la VRAIE chaîne : l'instantané,
 * la composition, le gabarit, les polices engendrées (`polices-devis.js`),
 * puis `page.pdf` aux mesures d'iOS (A4, les marges de `format-a4.js`,
 * l'échelle 1,0667 : iOS imprime 1 px CSS à 0,8 pt, Chromium à 0,75 — D30).
 * Un PDF de Chromium prouve la CHAÎNE, pas le document : la vraie mise en page
 * ne se voit que sur l'iPhone.
 *
 * DES DONNÉES INVENTÉES, en mode « exemple » : l'entreprise de démonstration
 * (« Maçonnerie Ferlane », un SIREN fictif) ; une fiche « Mon entreprise », un
 * assureur, un médiateur et des adresses inventés pour ce script (« rue
 * Imaginaire ») ; des numéros de téléphone des racines que l'Arcep réserve à
 * la fiction ; des clients inventés. Les polices embarquées sont sous licence
 * OFL (voir `polices-devis.js`).
 *
 * Ces PDF ne se refont pas à chaque passage : Chromium y écrit des dates, et
 * deux fabrications ne rendent pas les mêmes octets. On les refait quand on
 * le décide, et `npm run verifier-apercu -- --figer` relève ensuite leurs
 * nouvelles empreintes (`apercu-empreintes.json`), dont le diff se relit.
 *
 * Il lui faut Chromium (`/opt/pw-browsers`, ou CHROME=…) et Playwright : ce
 * script n'est pas dans `npm run verifier`, et GitHub ne le lance pas.
 *
 *   npm run generer-pdf-apercu
 *
 * Codes de sortie : 0 juste ; 1 un refus (la chaîne ne compose pas, un PDF
 * trop gros, sans police ou d'une seule page pour soixante lignes) ; 2 la
 * machine (ni Chromium, ni Playwright).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { instantaneDuDevis } from '../src/lib/instantane-devis.js';
import { documentDuDevis } from '../src/lib/document-devis.js';
import { devisHtml } from '../src/lib/devis-html.js';
import { rowToDevis, ligneDepuisBase, totauxDepuisBase, totauxDevis, totalLigne } from '../src/lib/devis.js';
import { clientDepuisBase } from '../src/lib/clients.js';
import { IDENTITE_DEMO_DU_PRO } from '../src/data/siret-demo.js';
import * as A4 from '../src/lib/format-a4.js';
import { policesDuDocument } from '../src/lib/tampon-apercu.js';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DONNEES = path.join(RACINE, 'scripts/donnees');
const exiger = createRequire(import.meta.url);
const PDFLib = exiger('@cantoo/pdf-lib');

const machine = (m) => { console.error(`✘ La machine : ${m}`); process.exit(2); };
const refus = (m) => { console.error(`✘ ${m}`); process.exit(1); };
const sha256 = (o) => createHash('sha256').update(o).digest('hex');

/* Les polices engendrées : chargées ICI, au moment de s'en servir — jamais
   en haut d'un fichier (§4.9). */
const { POLICES_DEVIS } = await import(pathToFileURL(path.join(RACINE, 'src/data/polices-devis.js')).href);

/* ------------------------------------------------------------------ */
/*  Les données, inventées                                              */
/* ------------------------------------------------------------------ */

/* Le 26/11/2026 à 10 h 30 à Paris. */
const MAINTENANT = Date.UTC(2026, 10, 26, 9, 30);

const ENTREPRISE = Object.freeze({
  ...IDENTITE_DEMO_DU_PRO, id: 'ent-exemple', pro_id: 'pro-exemple', verifie_le: '2026-09-28T22:30:00.000Z', retiree_le: null,
});
const EMETTEUR = Object.freeze({
  id: 'em-exemple', pro_id: 'pro-exemple', denomination_ei: null, registre: 'rcs', greffe_ville: 'Marseille', capital_centimes: 500000,
  capital_variable: false, en_liquidation: false, locataire_gerant: false, etablissement_adresse: null, etablissement_code_postal: null,
  etablissement_ville: null, siege_adresse: null, siege_code_postal: null, siege_ville: null, telephone: '04 65 71 00 00',
  email: 'contact@exemple-opus.test', regime_tva: 'reel', regime_tva_declare_le: '2026-09-01T10:00:00Z',
  mediateur_nom: 'Médiateur inventé pour l’exemple', mediateur_adresse: '1 rue Imaginaire, 13004 Marseille',
  mediateur_site: 'https://mediateur.exemple-opus.test/', garantie_legale_texte: 'Parfait achèvement, biennale et décennale.',
  garantie_commerciale_texte: null, sav_texte: 'Sous quarante-huit heures, par téléphone.',
  modalites_paiement_texte: 'Paiement à réception de facture, par virement.',
  modalites_execution_texte: 'Travaux réalisés aux dates convenues ensemble.', reclamations_texte: 'Par écrit, réponse sous quinze jours.',
  modifie_le: '2026-11-01T10:00:00Z',
});
const ASSURANCES = Object.freeze([{
  id: 'as-exemple', pro_id: 'pro-exemple', nature: 'decennale', libelle: null, assureur_nom: 'Assureur inventé pour l’exemple',
  assureur_coordonnees: '2 avenue Imaginaire, 75000 Paris', couverture: 'France métropolitaine', numero_contrat: 'EX-0001',
  valide_jusquau: '2027-06-30', created_at: '2026-10-01T08:00:00+00:00', attestation_chemin: 'pro-exemple/attestation-decennale.pdf',
}]);
const TARIFS = Object.freeze({ pro_id: 'pro-exemple', frais_deplacement_centimes: 3500, frais_deplacement_texte: 'au-delà de 20 km', affiche: false });

const devisBrut = (o) => ({
  id: 'dev-exemple', pro_id: 'pro-exemple', client_id: 'cli-exemple', quote_request_id: null, sos_request_id: null, source: 'manuelle',
  statut: 'brouillon', objet: 'Rénovation d’une maison', lieu_adresse: '7 chemin Imaginaire', lieu_code_postal: '13410',
  lieu_ville: 'Lambesc', delai_execution: 'Six semaines', retenue_garantie_centiemes: null, remise_centiemes: null, remise_centimes: null,
  acompte_centiemes: null, acompte_centimes: null, acompte_nature: null, validite_jours: 30, total_ht_centimes: 0, total_tva_centimes: 0,
  total_ttc_centimes: 0, remise_ht_centimes: 0, acompte_ttc_centimes: 0, total_ttc_options_centimes: 0, pour_qui: 'consommateur',
  pour_qui_client: 'cli-exemple', chantier_neuf_conso: null, chantier_neuf_conso_le: null, chantier_neuf_tva: null, engage_decennale: true,
  acompte_a_la_signature: null, cout_devis_centimes: 0, generation: 3, created_at: '2026-11-20T10:00:00+00:00',
  modifie_le: '2026-11-20T10:00:00+00:00', ...o,
});
const clientBrut = (nom) => ({
  id: 'cli-exemple', pro_id: 'pro-exemple', type: 'particulier', nom, siret: null, telephone: '06 39 98 00 42',
  email: 'client@exemple-opus.test', adresse: '7 chemin Imaginaire', code_postal: '13410', ville: 'Lambesc', notes: null,
  archive: false, created_at: '2026-10-05T10:00:00+00:00', modifie_le: '2026-10-05T10:00:00+00:00',
});
const ligneBrute = (k, o) => ({
  id: `lig-${String(k).padStart(3, '0')}`, devis_id: 'dev-exemple', ordre: k * 1000, type: 'poste', designation: 'Poste',
  quantite_milliemes: 1000, unite: 'forfait', prix_unitaire_centimes: 10000, taux_tva_centiemes: 2000, total_centimes: 0, offert: false,
  main_oeuvre: false, fourniture_non_comprise: false, surface_sol_milliemes: null, surface_murs_milliemes: null, urgence: false,
  generation: 3, modifie_le: '2026-11-20T10:00:00+00:00', ...o,
});
const titre = (k, type, designation) => ligneBrute(k, {
  type, designation, quantite_milliemes: null, unite: null, prix_unitaire_centimes: null, taux_tva_centiemes: null, total_centimes: null,
});

/* LES TOTAUX, CALCULÉS par le miroir du téléphone (`totauxDevis`, dont la
   parité avec la base est prouvée par `cas-devis.json`), puis REMIS À LA
   FORME DE LA BASE — la composition imprime les totaux de la base. */
function entreesDe({ devis, lignes, client }) {
  const lignesRangees = lignes.map((l) => {
    const app = ligneDepuisBase(l);
    return ['poste', 'option'].includes(l.type) ? { ...l, total_centimes: totalLigne(app) } : l;
  });
  const t = totauxDevis(lignesRangees.map(ligneDepuisBase), rowToDevis(devis));
  if (!t.ok) refus(`les lignes de l’exemple sont irrecevables (${t.contrainte}).`);
  const d = {
    ...devis, total_ht_centimes: t.ht, total_tva_centimes: t.tva, total_ttc_centimes: t.ttc, remise_ht_centimes: t.reduction.effectif,
    acompte_ttc_centimes: t.acompte.effectif, total_ttc_options_centimes: t.ttcOptions,
  };
  const tva = t.ventilation.map((e) => ({
    taux_tva_centiemes: e.taux, base_centimes: e.base, remise_centimes: e.remise, tva_centimes: e.tva, nb_lignes: e.nbLignes,
  }));
  return {
    devisLu: { devis: rowToDevis(d), lignes: lignesRangees.map(ligneDepuisBase), ventilation: totauxDepuisBase({ ...d, devis_tva: tva }).ventilation },
    entreprise: ENTREPRISE, emetteur: EMETTEUR, assurances: [...ASSURANCES], tarifs: TARIFS, preuveTva: null,
    client: clientDepuisBase(client), maintenant: MAINTENANT, statut: 'essai', mode: 'exemple',
  };
}

/* UNE LIGNE. */
const UNE = entreesDe({
  devis: devisBrut({ objet: 'Terrasse en bois', cout_devis_centimes: 3000 }),
  lignes: [ligneBrute(1, { designation: 'Pose d’une terrasse en lames de pin, sur lambourdes', quantite_milliemes: 18500, unite: 'm2',
    prix_unitaire_centimes: 6500, taux_tva_centiemes: 1000 })],
  client: clientBrut('Mme Exemple'),
});

/* SOIXANTE LIGNES, engendrées sans hasard : 4 zones, 8 pièces, 44 postes,
   2 réserves, 2 options ; les sept unités ; les trois taux ; une désignation
   longue ; un « Offert », trois « fourniture non comprise », une réparation
   urgente ; un client et une pièce au latin étendu (Inter, jamais Oswald). */
const SOIXANTE = (() => {
  const UNITES = ['m2', 'm', 'm3', 'u', 'h', 'jour', 'forfait'];
  const TAUX = [2000, 1000, 550];
  const TRAVAUX = ['Dépose et évacuation', 'Ragréage du sol', 'Pose de plaques de plâtre', 'Enduit et ponçage', 'Peinture deux couches',
    'Pose de plinthes', 'Câblage et prises', 'Raccordement des évacuations', 'Pose de carrelage', 'Joints et finitions', 'Isolation',
    'Pose de menuiseries'];
  const ZONES = [['Rez-de-chaussée', ['Séjour', 'Cuisine']], ['Étage', ['Chambre', 'Łazienka']], ['Combles', ['Bureau', 'Rangement']],
    ['Extérieur', ['Terrasse', 'Garage']]];
  const lignes = [];
  let k = 0;
  let poste = 0;
  const ajouter = (o) => { k += 1; lignes.push(ligneBrute(k, o)); };
  const ajouterTitre = (type, nom) => { k += 1; lignes.push(titre(k, type, nom)); };
  for (const [zone, pieces] of ZONES) {
    ajouterTitre('zone', zone);
    for (const piece of pieces) {
      ajouterTitre('piece', piece);
      for (let n = 0; n < 5 + (poste % 2 === 0 && piece !== 'Rangement' ? 1 : 0) && poste < 44; n += 1) {
        poste += 1;
        const unite = UNITES[poste % UNITES.length];
        const designation = poste === 7
          ? 'Reprise complète du support avant pose : décollement des anciens revêtements, rebouchage des fissures au mortier de '
            + 'réparation, application d’un primaire d’accrochage, ragréage autolissant sur l’ensemble de la surface, contrôle de la '
            + 'planéité à la règle de deux mètres, et nettoyage soigné du chantier en fin de journée'
          : `${TRAVAUX[poste % TRAVAUX.length]} — ${piece.toLowerCase()}`;
        ajouter({
          designation, unite, taux_tva_centiemes: TAUX[poste % TAUX.length],
          quantite_milliemes: unite === 'forfait' ? 1000 : 1500 + (poste * 750) % 24000,
          prix_unitaire_centimes: 1200 + (poste * 1370) % 9800,
          offert: poste === 12, fourniture_non_comprise: [5, 19, 33].includes(poste), urgence: poste === 26,
        });
      }
    }
    if (zone === 'Étage' || zone === 'Extérieur') {
      ajouterTitre('reserve', zone === 'Étage' ? 'Sous réserve de l’état des solives' : 'Sous réserve de l’accès des engins');
    }
  }
  ajouter({ type: 'option', designation: 'Option : faïence murale décorative', unite: 'm2', quantite_milliemes: 6000,
    prix_unitaire_centimes: 5500, taux_tva_centiemes: 1000 });
  ajouter({ type: 'option', designation: 'Option : volets roulants motorisés', unite: 'u', quantite_milliemes: 2000,
    prix_unitaire_centimes: 42000, taux_tva_centiemes: 550 });
  return { lignes };
})();
{
  const compte = (t) => SOIXANTE.lignes.filter((l) => l.type === t).length;
  const vu = { zone: compte('zone'), piece: compte('piece'), poste: compte('poste'), reserve: compte('reserve'), option: compte('option') };
  if (SOIXANTE.lignes.length !== 60 || vu.zone !== 4 || vu.piece !== 8 || vu.poste !== 44 || vu.reserve !== 2 || vu.option !== 2) {
    refus(`l’exemple de soixante lignes n’a pas sa forme : ${SOIXANTE.lignes.length} lignes, ${JSON.stringify(vu)}`);
  }
}
const ENTREES_60 = entreesDe({
  devis: devisBrut({ remise_centiemes: 500, acompte_centiemes: 3000, acompte_nature: 'arrhes', retenue_garantie_centiemes: 500 }),
  lignes: SOIXANTE.lignes,
  client: clientBrut('Łukasz Ağaoğlu'),
});

function pageDe(entrees, nom) {
  const r = instantaneDuDevis(entrees);
  if (!r.ok) refus(`${nom} : l’instantané refuse (${r.raison}).`);
  return devisHtml(documentDuDevis(r.instantane), POLICES_DEVIS);
}

/* ------------------------------------------------------------------ */
/*  Chromium                                                            */
/* ------------------------------------------------------------------ */

const PW = '/opt/node22/lib/node_modules/playwright/index.js';
const playwright = await import('playwright').catch(() => (existsSync(PW) ? import(PW).then((m) => m.default || m) : null));
if (!playwright || !playwright.chromium) machine('Playwright est introuvable (ni dans node_modules, ni dans /opt/node22).');
const CHEMINS_CHROME = [process.env.CHROME, '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
  .filter(Boolean);
const CHROME = CHEMINS_CHROME.find((c) => existsSync(c));
if (!CHROME) machine(`aucun Chromium (essayés : ${CHEMINS_CHROME.join(', ')}). Donnez son chemin par CHROME=…`);

const navigateur = await playwright.chromium.launch({ executablePath: CHROME });
const pdfs = {};
try {
  const version = navigateur.version();
  for (const [nom, entrees] of [['apercu-chromium-1.pdf', UNE], ['apercu-chromium-60.pdf', ENTREES_60]]) {
    const page = await navigateur.newPage();
    await page.setContent(pageDe(entrees, nom), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    pdfs[nom] = Buffer.from(await page.pdf({
      width: A4.A4_MM.largeur, height: A4.A4_MM.hauteur, margin: A4.MARGES_MM, scale: 1.0667,
    }));
    await page.close();
  }
  console.log(`  Chromium ${version}`);
} finally {
  await navigateur.close();
}

/* LA VARIANTE XOBJECT : chaque page du premier, posée comme un XObject de
   forme sur une page de la même taille. */
{
  const src = await PDFLib.PDFDocument.load(pdfs['apercu-chromium-1.pdf'], { updateMetadata: false });
  const d = await PDFLib.PDFDocument.create({ updateMetadata: false });
  d.setTitle(src.getTitle() || 'Aperçu du devis');
  d.setCreator('generer-pdf-apercu');
  d.setProducer('pdf-lib : chaque page de apercu-chromium-1.pdf posée en XObject de forme, comme iOS');
  const formes = await d.embedPages(src.getPages());
  src.getPages().forEach((p, k) => {
    d.addPage([p.getWidth(), p.getHeight()]).drawPage(formes[k], { x: 0, y: 0 });
  });
  pdfs['apercu-xobjet.pdf'] = Buffer.from(await d.save({ useObjectStreams: true, addDefaultPage: false }));
}

/* ------------------------------------------------------------------ */
/*  Les refus, puis l'écriture                                          */
/* ------------------------------------------------------------------ */

for (const [nom, octets] of Object.entries(pdfs)) {
  const doc = await PDFLib.PDFDocument.load(octets, { updateMetadata: false });
  const polices = policesDuDocument(PDFLib, doc);
  const pages = doc.getPageCount();
  if (!polices.inter || !polices.oswald) refus(`${nom} : Inter et Oswald n’y sont pas toutes deux (${JSON.stringify(polices.noms)}).`);
  if (octets.length > 60000) refus(`${nom} : ${octets.length} octets — trop gros pour une donnée de contrôle.`);
  if (nom === 'apercu-chromium-60.pdf' && pages < 2) refus(`${nom} : une seule page pour soixante lignes.`);
  console.log(`  ${nom} : ${octets.length} octets, ${pages} page(s), polices ${polices.noms.join(', ')} — ${sha256(octets).slice(0, 16)}…`);
}
mkdirSync(DONNEES, { recursive: true });
for (const [nom, octets] of Object.entries(pdfs)) writeFileSync(path.join(DONNEES, nom), octets);
console.log('✔ Les trois PDF sont écrits dans scripts/donnees/. Puis : npm run verifier-apercu -- --figer, et relisez le diff.');
