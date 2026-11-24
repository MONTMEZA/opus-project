/**
 * LES TRAVAUX D’ÉCONOMIES D’ÉNERGIE ET D’ÉNERGIE RENOUVELABLE — la liste
 * fermée de l’étape 2b-6 du module devis (le label RGE, 24/11/2026).
 *
 * POURQUOI CETTE LISTE EXISTE
 * ---------------------------
 * Quand un professionnel propose à un particulier des travaux « afférents à
 * des logements en vue de la réalisation d’économies d’énergie ou de la
 * production d’énergie renouvelable » dont les aides exigent un label ou un
 * signe de qualité, le devis doit dire s’il en détient un « pour les
 * catégories de travaux concernés », et s’il fait faire tout ou partie du
 * travail par un sous-traitant (code de la consommation, L. 224-114 et
 * L. 224-115 ; sans ces informations, le contrat est nul : L. 242-51).
 * L’artisan coche donc, devis par devis, les travaux qu’il fera ; et il range
 * une fois, dans « Mon entreprise », les travaux que couvre chacun de ses
 * signes de qualité. Les DEUX listes parlent avec les MÊMES clés : c’est ce
 * qui permet à Opus de dire, travail par travail, si un label le porte.
 *
 * DIX-NEUF CLÉS, et l’ordre compte (réponse P12 du propriétaire, 24/11 :
 * « Les 17, plus ces 2 ») :
 *   - les dix-sept catégories du décret n° 2014-812 (article 1er, 1° à 17°),
 *     dans l’ordre du décret ;
 *   - puis deux lignes comptées PAR PRUDENCE : les panneaux solaires
 *     photovoltaïques (l’obligation d’achat est-elle une « aide » ? au
 *     juriste, J44) et le désembouage d’un chauffage central à eau (la fiche
 *     d’économies d’énergie BAR-SE-108 exige une qualification d’entretien ;
 *     est-ce « un label ou un signe de qualité » au sens de la loi ? J74).
 *     Quand elles seules manquent, le point dit « Par prudence », jamais
 *     « La loi ».
 * « Aucun de ces travaux » n’est PAS une catégorie : c’est une réponse du
 * devis seul (`aucun`, dans `devis.js`), jamais celle d’un label.
 *
 * LE LIBELLÉ EST SÉPARÉ DE SES EXEMPLES (la règle de `FLUX_DECHETS`,
 * ÉCRAN-8) : le libellé, court, est ce que l’étape 2c imprimera « pour les
 * catégories de travaux concernés » ; les exemples aident à l’écran
 * seulement, sous la case. Les mots suivent le décret (annexe A.2 du cahier
 * 2b-6, corrigés par la critique « droit » : le 3° et le 4° pour le bois,
 * le 7°, le 11°, le 17° « offre globale »). Le numéro du décret et le
 * domaine de l’annuaire RGE de l’ADEME sont rangés avec chaque clé, et
 * JAMAIS affichés : le second servira le jour où Opus lira cet annuaire, pour
 * comparer des mots qui se ressemblent.
 *
 * LA LISTE VIT AUSSI DANS LA BASE, en toutes lettres, dans cinq endroits :
 * les contraintes `devis_energie_travaux_check` (avec `aucun` en tête),
 * `devis_energie_sans_label_check`, `emetteur_label_categories_check`,
 * `emetteur_sous_traitant_categories_check` (sections 46.2 ter, 46.2 quater
 * et 49.5 de `schema.sql`), et la liste de prudence du rang 14 de
 * `motifs_refus_remise()`. `verifier-devis` et `verifier-emetteur` comparent
 * chacune à celle-ci, contenu ET ordre : l’allonger demande une migration,
 * comme pour les déchets.
 *
 * CE FICHIER N’IMPORTE RIEN : `devis.js` et `emetteur.js` l’importent (ils ne
 * s’importent pas l’un l’autre), et `node` les fait tourner. Une seule
 * source, comme le catalogue des métiers.
 */

/**
 * `cle` : ce que la base range ; `libelle` : ce qui s’imprimera (2c) ;
 * `exemples` : l’aide de la case, à l’écran seulement, ou `null` ; `aide` :
 * une consigne propre à la case (le 17°), ou `null` ; `decret` : le numéro
 * de la catégorie dans l’article 1er du décret n° 2014-812, `null` hors du
 * décret ; `ademe` : le domaine de l’annuaire RGE de l’ADEME (jamais
 * affiché), `null` quand l’annuaire n’en a pas ; `prudence` : une ligne
 * comptée par prudence.
 */
export const TRAVAUX_ENERGIE = Object.freeze([
  Object.freeze({
    cle: 'chaudiere',
    libelle: 'Chaudière à haute performance (condensation, micro-cogénération gaz) et sa régulation',
    exemples: null,
    aide: null,
    decret: 1,
    ademe: 'Chaudière condensation ou micro-cogénération gaz ou fioul',
    prudence: false,
  }),
  Object.freeze({
    cle: 'solaire_thermique',
    libelle: 'Chauffage ou eau chaude par capteurs solaires',
    exemples: null,
    aide: null,
    decret: 2,
    ademe: 'Chauffage et/ou eau chaude solaire',
    prudence: false,
  }),
  Object.freeze({
    cle: 'bois_chaudiere',
    libelle: 'Chaudière ou poêle hydraulique au bois ou à la biomasse (relié au chauffage central ou à l’eau chaude)',
    exemples: null,
    aide: null,
    decret: 3,
    ademe: 'Chaudière bois',
    prudence: false,
  }),
  Object.freeze({
    cle: 'bois_poele',
    libelle: 'Poêle, insert ou cuisinière au bois ou à la biomasse, non relié au chauffage central ni à l’eau chaude',
    exemples: null,
    aide: null,
    decret: 4,
    ademe: 'Poêle ou insert bois',
    prudence: false,
  }),
  Object.freeze({
    cle: 'pac_chauffage',
    libelle: 'Pompe à chaleur pour le chauffage',
    exemples: null,
    aide: null,
    decret: 5,
    ademe: 'Pompe à chaleur : chauffage',
    prudence: false,
  }),
  Object.freeze({
    cle: 'pac_eau_chaude',
    libelle: 'Chauffe-eau thermodynamique (pompe à chaleur pour l’eau chaude)',
    exemples: null,
    aide: null,
    decret: 6,
    ademe: 'Chauffe-Eau Thermodynamique',
    prudence: false,
  }),
  Object.freeze({
    cle: 'emetteurs_electriques',
    libelle: 'Radiateurs ou autres émetteurs électriques, et leur régulation',
    exemples: 'Plancher chauffant électrique, panneau rayonnant',
    aide: null,
    decret: 7,
    ademe: 'Radiateurs électriques, dont régulation',
    prudence: false,
  }),
  Object.freeze({
    cle: 'ventilation',
    libelle: 'Ventilation mécanique',
    exemples: 'VMC simple ou double flux',
    aide: null,
    decret: 8,
    ademe: 'Ventilation mécanique',
    prudence: false,
  }),
  Object.freeze({
    cle: 'fenetres',
    libelle: 'Fenêtres, portes-fenêtres, volets isolants, porte d’entrée sur l’extérieur',
    exemples: null,
    aide: null,
    decret: 9,
    ademe: 'Fenêtres, volets, portes donnant sur l’extérieur',
    prudence: false,
  }),
  Object.freeze({
    cle: 'fenetres_toit',
    libelle: 'Fenêtres de toit',
    exemples: null,
    aide: null,
    decret: 10,
    ademe: 'Fenêtres de toit',
    prudence: false,
  }),
  Object.freeze({
    cle: 'isolation_interieur',
    libelle: 'Isolation par l’intérieur des murs, des rampants de toiture ou des plafonds sous combles',
    exemples: 'Doublage ou faux plafond isolé compris',
    aide: null,
    decret: 11,
    ademe: 'Isolation par l’intérieur des murs ou rampants de toitures ou plafonds',
    prudence: false,
  }),
  Object.freeze({
    cle: 'isolation_exterieur',
    libelle: 'Isolation des murs par l’extérieur',
    exemples: null,
    aide: null,
    decret: 12,
    ademe: 'Isolation des murs par l’extérieur',
    prudence: false,
  }),
  Object.freeze({
    cle: 'isolation_toiture',
    libelle: 'Isolation d’une toiture-terrasse, ou d’une toiture par l’extérieur',
    exemples: null,
    aide: null,
    decret: 13,
    ademe: 'Isolation des toitures terrasses ou des toitures par l’extérieur',
    prudence: false,
  }),
  Object.freeze({
    cle: 'isolation_combles',
    libelle: 'Isolation des combles perdus',
    exemples: null,
    aide: null,
    decret: 14,
    ademe: 'Isolation des combles perdus',
    prudence: false,
  }),
  Object.freeze({
    cle: 'isolation_plancher',
    libelle: 'Isolation d’un plancher bas sur local non chauffé',
    exemples: 'Cave, garage, vide sanitaire',
    aide: null,
    decret: 15,
    ademe: 'Isolation des planchers bas',
    prudence: false,
  }),
  Object.freeze({
    cle: 'geothermie',
    libelle: 'Sonde géothermique d’une pompe à chaleur',
    exemples: 'Forage',
    aide: null,
    decret: 16,
    ademe: 'Forage géothermique',
    prudence: false,
  }),
  /* LE 17° EST UNE CERTIFICATION « OFFRE GLOBALE », pas « plusieurs de ces
     travaux » : les aides d’une rénovation d’ampleur exigent le signe de
     CHAQUE catégorie, du 1° au 16°, jamais celui-ci (DROIT-5, J73). Avec un
     libellé qui le laissait croire, un artisan couvert catégorie par
     catégorie aurait dû déclarer ne pas détenir le 17°. D’où sa consigne. */
  Object.freeze({
    cle: 'renovation_ensemble',
    libelle: 'Rénovation énergétique en « offre globale » (conception, coordination et suivi de tout le projet)',
    exemples: null,
    aide: 'Ne cochez pas cette ligne parce que le devis réunit plusieurs des travaux ci-dessus : cochez chacun d’eux.',
    decret: 17,
    ademe: 'Projet complet de rénovation',
    prudence: false,
  }),
  /* LES DEUX LIGNES PAR PRUDENCE (P12 = 1), hors du décret. */
  Object.freeze({
    cle: 'photovoltaique',
    libelle: 'Panneaux solaires photovoltaïques',
    exemples: null,
    aide: null,
    decret: null,
    ademe: 'Panneaux solaires photovoltaïques',
    prudence: true,
  }),
  Object.freeze({
    cle: 'desembouage',
    libelle: 'Désembouage d’un chauffage central à eau',
    exemples: 'Hors installation chauffée par une pompe à chaleur',
    aide: null,
    decret: null,
    ademe: null,
    prudence: true,
  }),
]);
