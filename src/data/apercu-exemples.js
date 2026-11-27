/**
 * LES EXEMPLES DE L'APERÇU — trois devis INVENTÉS, pour essayer l'aperçu sur
 * l'iPhone sans toucher un vrai devis (étape 2c-1, cahier §6.4, §7).
 *
 * DANS OPUS DEV SEULEMENT (`__DEV__ && STATUT === 'essai'`, décidé par
 * l'écran « Mes devis ») : une version publiée ne les montre jamais.
 *
 * CE FICHIER N'EST JAMAIS IMPORTÉ EN HAUT D'UN FICHIER (T17) : Metro n'a pas
 * `inlineRequires`, un `import` du haut s'exécuterait au démarrage d'Opus. Il
 * est `require`d au geste, par l'écran des exemples. Et il n'exporte que des
 * FONCTIONS : rien n'est fabriqué à son chargement.
 *
 * LES TROIS, nommés comme à l'écran et dans le protocole de l'essai :
 *   - « Exemple : 1 ligne » — le devis « Terrasse en bois » de la
 *     démonstration : un poste, un devis payant de 30,00 €, sans validité ni
 *     nature d'acompte (deux marqueurs « [à compléter : …] ») ;
 *   - « Exemple : 5 postes (9 lignes) » — le devis « Rénovation salle de
 *     bains » : une zone, une pièce, cinq postes à 10 % et 20 %, une réserve,
 *     une option, la retenue de garantie ;
 *   - « Exemple : 60 lignes » — ENGENDRÉ ici sans hasard : 4 zones, 8 pièces,
 *     44 postes, 2 réserves, 2 options ; les sept unités (dont 8 au mètre
 *     linéaire, 3 m³, 3 jours), les trois taux, une désignation d'environ
 *     300 caractères, un « Offert », trois « fourniture non comprise », une
 *     « réparation urgente » ; une réduction de 5 %, des arrhes de 30 %, une
 *     retenue de 5 %, 30 jours, un devis gratuit ; un client « Łukasz
 *     Ağaoğlu » et une pièce « Łazienka » (le latin étendu d'Inter, jamais
 *     Oswald).
 *
 * L'ÉMETTEUR, L'IDENTITÉ ET LE CLIENT SONT CEUX DE LA DÉMONSTRATION
 * (« Maçonnerie Ferlane », un SIREN fictif), avec leurs cinq manques voulus,
 * qui se voient en « [à compléter : …] ». L'identité porte `source:
 * 'exemple'` et l'instantané le mode `exemple` : la ligne de source devient
 * « Identité inventée pour l’exemple », et « Exemple — données inventées »
 * est dans le tampon de CHAQUE page (D19, C-M10).
 *
 * LES TOTAUX viennent du calcul du téléphone (`totauxDevis`, le miroir dont la
 * parité avec la base est prouvée par `cas-devis.json`) : un exemple prouve la
 * MISE EN PAGE, pas un calcul.
 *
 * `node` le fait tourner (`verifier-apercu`, H.4 ; `verifier-demo` relit ses
 * mots) : il n'importe que des fichiers purs.
 */
import {
  creerBaseDevisDemo, DEVIS_DEMO_IDS, PRO_DEMO_DEVIS,
} from './devis-demo.js';
import { fabriquerEmetteurDemo } from './emetteur-demo.js';
import { IDENTITE_DEMO_DU_PRO } from './siret-demo.js';
import { initialClients } from './demo.js';
import { totauxDevis, totalLigne, avecLesTotauxDeLigne } from '../lib/devis.js';

const JOUR = 24 * 3600 * 1000;

/* Un instant de l'appelant : une `Date` ou des millisecondes. */
const enDate = (m) => (m instanceof Date ? m : new Date(Number(m)));

/* « Mon entreprise » et l'identité de la démonstration, au moment voulu. */
function entrepriseEtFiche(maintenant) {
  const m = enDate(maintenant);
  const fiche = fabriquerEmetteurDemo(m);
  return {
    entreprise: { ...IDENTITE_DEMO_DU_PRO, verifie_le: new Date(m.getTime() - 20 * JOUR).toISOString(), source: 'exemple' },
    emetteur: fiche.emetteur,
    assurances: fiche.assurances,
    tarifs: fiche.tarifs,
    preuveTva: null,
  };
}

/* Les données que la séance compose : un exemple n'a pas de liste « Pour le
   remettre » (`motifs: null`), et l'écran tait alors le compte des points. */
const donnees = (devisLu, client, maintenant) => ({
  ok: true,
  donnees: {
    devisLu, ...entrepriseEtFiche(maintenant), client, statut: 'essai', mode: 'exemple', motifs: null,
  },
});

/* Un devis de la démonstration, relu comme `api.unDevis` le relit. */
async function devisDeLaDemonstration(id, maintenant) {
  const m = enDate(maintenant);
  const base = creerBaseDevisDemo({ maintenant: () => m });
  const lu = await base.un(PRO_DEMO_DEVIS, id);
  if (!lu) return { ok: false, phrase: '[lecture du devis] L’exemple n’a pas pu être fabriqué.', bouton: 'reessayer' };
  const fiche = initialClients.find((c) => String(c.id) === String(lu.devis.clientId)) || null;
  return donnees({ ...lu, lignes: avecLesTotauxDeLigne(lu.lignes) }, fiche ? { ...fiche } : null, m);
}

/** « Exemple : 1 ligne ». */
export function exempleUneLigne(maintenant) {
  return devisDeLaDemonstration(DEVIS_DEMO_IDS.terrasse, maintenant);
}

/** « Exemple : 5 postes (9 lignes) ». */
export function exempleCinqPostes(maintenant) {
  return devisDeLaDemonstration(DEVIS_DEMO_IDS.renovation, maintenant);
}

/* LES SOIXANTE LIGNES — sans hasard. Les désignations sont génériques et
   inventées. */
const TRAVAUX = Object.freeze(['Dépose et évacuation', 'Ragréage du sol', 'Pose de plaques de plâtre', 'Enduit et ponçage',
  'Peinture deux couches', 'Pose de plinthes', 'Câblage et prises', 'Raccordement des évacuations', 'Pose de carrelage',
  'Joints et finitions', 'Isolation', 'Pose de menuiseries']);
const ZONES = Object.freeze([
  ['Rez-de-chaussée', ['Séjour', 'Cuisine']],
  ['Étage', ['Chambre', 'Łazienka']],
  ['Combles', ['Bureau', 'Rangement']],
  ['Extérieur', ['Terrasse', 'Garage']],
]);
const TAUX = Object.freeze([2000, 1000, 550]);
/* L'unité du poste n (1 à 44) : 8 au mètre linéaire, 3 au m³, 3 au jour, le
   reste en m², unités, heures et forfaits, à tour de rôle. */
const AU_METRE = Object.freeze([2, 8, 13, 17, 22, 29, 35, 41]);
const AU_M3 = Object.freeze([4, 20, 38]);
const AU_JOUR = Object.freeze([10, 27, 43]);
const AUTRES = Object.freeze(['m2', 'u', 'h', 'forfait']);
function uniteDu(n) {
  if (AU_METRE.includes(n)) return 'm';
  if (AU_M3.includes(n)) return 'm3';
  if (AU_JOUR.includes(n)) return 'jour';
  return AUTRES[n % AUTRES.length];
}
const LONGUE = 'Reprise complète du support avant pose : décollement des anciens revêtements, rebouchage des fissures au mortier de '
  + 'réparation, application d’un primaire d’accrochage, ragréage autolissant sur l’ensemble de la surface, contrôle de la '
  + 'planéité à la règle de deux mètres, et nettoyage soigné du chantier en fin de journée';

const ID_DEVIS_60 = 'de000060-0000-4000-8000-000000000060';
const ID_CLIENT_60 = 'cl-exemple-60';
const idLigne60 = (k) => `de0060a0-0000-4000-8000-${String(k).padStart(12, '0')}`;

/** « Exemple : 60 lignes ». */
export async function exempleSoixanteLignes(maintenant) {
  const m = enDate(maintenant);
  const lignes = [];
  let k = 0;
  let poste = 0;
  const ligne = (o) => {
    k += 1;
    const l = {
      id: idLigne60(k), devisId: ID_DEVIS_60, ordre: k * 1000, type: 'poste', designation: 'Poste', quantiteMilliemes: 1000,
      unite: 'forfait', prixUnitaireCentimes: 10000, tauxTvaCentiemes: 2000, totalCentimes: null, offert: false, mainOeuvre: false,
      fournitureNonComprise: false, surfaceSolMilliemes: null, surfaceMursMilliemes: null, urgence: false, ...o,
    };
    lignes.push(l);
  };
  const titre = (type, designation) => ligne({
    type, designation, quantiteMilliemes: null, unite: null, prixUnitaireCentimes: null, tauxTvaCentiemes: null,
  });
  for (const [zone, pieces] of ZONES) {
    titre('zone', zone);
    for (const piece of pieces) {
      titre('piece', piece);
      const combien = piece === 'Rangement' || piece === 'Garage' ? 5 : 6;
      for (let n = 0; n < combien && poste < 44; n += 1) {
        poste += 1;
        const unite = uniteDu(poste);
        ligne({
          designation: poste === 7 ? LONGUE : `${TRAVAUX[poste % TRAVAUX.length]} — ${piece.toLowerCase()}`,
          unite,
          tauxTvaCentiemes: TAUX[poste % TAUX.length],
          quantiteMilliemes: unite === 'forfait' ? 1000 : 1500 + ((poste * 750) % 24000),
          prixUnitaireCentimes: 1200 + ((poste * 1370) % 9800),
          offert: poste === 12,
          fournitureNonComprise: [5, 19, 33].includes(poste),
          urgence: poste === 26,
        });
      }
    }
    if (zone === 'Étage') titre('reserve', 'Sous réserve de l’état des solives');
    if (zone === 'Extérieur') titre('reserve', 'Sous réserve de l’accès des engins');
  }
  ligne({
    type: 'option', designation: 'Option : faïence murale décorative', unite: 'm2', quantiteMilliemes: 6000,
    prixUnitaireCentimes: 5500, tauxTvaCentiemes: 1000,
  });
  ligne({
    type: 'option', designation: 'Option : volets roulants motorisés', unite: 'u', quantiteMilliemes: 2000,
    prixUnitaireCentimes: 42000, tauxTvaCentiemes: 550,
  });
  const avecTotaux = lignes.map((l) => (l.type === 'poste' || l.type === 'option' ? { ...l, totalCentimes: totalLigne(l) } : l));

  const client = {
    id: ID_CLIENT_60, type: 'particulier', nom: 'Łukasz Ağaoğlu', siret: null, adresse: '7 chemin Imaginaire',
    codePostal: '13410', ville: 'Lambesc',
  };
  const conditions = {
    remiseCentiemes: 500, remiseCentimes: null, acompteCentiemes: 3000, acompteCentimes: null, acompteNature: 'arrhes',
    retenueGarantieCentiemes: 500,
  };
  const t = totauxDevis(avecTotaux, conditions);
  if (!t.ok) return { ok: false, phrase: '[lecture du devis] L’exemple n’a pas pu être fabriqué.', bouton: 'reessayer' };
  const devis = {
    id: ID_DEVIS_60, proId: PRO_DEMO_DEVIS, clientId: ID_CLIENT_60, quoteRequestId: null, sosRequestId: null, source: 'manuelle',
    statut: 'brouillon', objet: 'Rénovation d’une maison', lieuAdresse: client.adresse, lieuCodePostal: client.codePostal,
    lieuVille: client.ville, delaiExecution: 'Six semaines à compter de la signature', validiteJours: 30, coutDevisCentimes: 0,
    ...conditions,
    pourQui: 'consommateur', pourQuiClient: ID_CLIENT_60, engageDecennale: true,
    totalHtCentimes: t.ht, totalTvaCentimes: t.tva, totalTtcCentimes: t.ttc, remiseHtCentimes: t.reduction.effectif,
    acompteTtcCentimes: t.acompte.effectif, totalTtcOptionsCentimes: t.ttcOptions,
    createdAt: new Date(m.getTime() - 2 * JOUR).toISOString(), modifieLe: new Date(m.getTime() - JOUR).toISOString(),
  };
  return donnees({ devis, lignes: avecTotaux, ventilation: t.ventilation.filter((v) => v.nbLignes > 0) }, client, m);
}
