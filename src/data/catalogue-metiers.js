/**
 * LE RÉFÉRENTIEL DES MÉTIERS — la seule source de vérité.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Avant lui, la liste des métiers était écrite à DEUX endroits : douze
 * chaînes dans `demo.js`, et les mêmes douze recopiées à la main dans la
 * contrainte `pro_metiers_check` de la base. Deux endroits à tenir
 * d'accord, et personne ne s'en souvient. C'est exactement le défaut qui
 * avait fait refuser tous les montages : l'application envoyait une valeur
 * que la base ne connaissait pas.
 *
 * Désormais il n'y a qu'un seul endroit : celui-ci. Le SQL du catalogue
 * est ENGENDRÉ à partir de ce fichier (`npm run generer-catalogue`), et
 * `npm run verifier-metiers` refuse de passer si les deux ont divergé.
 *
 * LA CLÉ, PAS LE NOM
 * ------------------
 * Un profil enregistre `macon`, pas « Maçon ». La raison est simple : le
 * jour où l'on écrira « Maçonnerie » au lieu de « Maçon », aucune ligne de
 * la base n'aura à être réécrite. Et une clé sans accent ni majuscule ne
 * se compare jamais de travers.
 *
 * Le nom affiché se retrouve avec `nomMetier(cle)` — jamais en lisant la
 * clé directement à l'écran.
 *
 * MÉTIER OU SPÉCIALITÉ ?
 * ----------------------
 * Un **métier**, c'est ce qu'on répond à « vous faites quoi ? » : maçon,
 * couvreur, géomètre. Un professionnel en porte quatre au maximum.
 *
 * Une **spécialité**, c'est ce qu'on fait DANS ce métier : mur de
 * soutènement, toiture en zinc, recherche de fuite. Elles sont rattachées
 * à un métier et **ne consomment aucun des quatre emplacements** — sans
 * quoi un maçon qui fait aussi des extensions aurait déjà brûlé deux
 * places pour un seul métier.
 *
 * LES SYNONYMES
 * -------------
 * Ce que les gens TAPENT, pas ce que le métier s'appelle. « placo » pour
 * un plaquiste, « parpaing » pour un maçon, « clim » pour un climaticien.
 * Sans eux, une recherche parfaitement légitime ne rend rien, et on cesse
 * de faire confiance au moteur.
 *
 * L'INTERNATIONALISATION
 * ----------------------
 * Tout est en français et la France est la seule référence aujourd'hui.
 * La table porte néanmoins une colonne `locale` (`fr-FR`) : ajouter une
 * langue voudra dire ajouter des lignes, jamais réécrire le schéma.
 */

/**
 * LES CATÉGORIES — pour ranger, pas pour faire passer un examen.
 *
 * Elles servent à celui qui cherche sans savoir quoi chercher. Celui qui
 * tape « plombier » ne doit JAMAIS avoir à comprendre notre classement :
 * il tape, il trouve. C'est la règle du §16 de la demande.
 */
export const CATEGORIES = [
  { cle: 'gros-oeuvre', nom: 'Gros œuvre' },
  { cle: 'toiture', nom: 'Toiture, charpente, étanchéité' },
  { cle: 'plomberie-cvc', nom: 'Plomberie, chauffage, climatisation' },
  { cle: 'electricite', nom: 'Électricité, domotique, énergie' },
  { cle: 'menuiserie', nom: 'Menuiserie, serrurerie, vitrerie' },
  { cle: 'finitions', nom: 'Revêtements et finitions' },
  { cle: 'isolation-facade', nom: 'Isolation et façade' },
  { cle: 'terrassement-vrd', nom: 'Terrassement, VRD, assainissement' },
  { cle: 'exterieur', nom: 'Extérieur, paysage, piscine' },
  { cle: 'demolition', nom: 'Démolition et désamiantage' },
  { cle: 'construction', nom: 'Construction et entreprise générale' },
  { cle: 'conception', nom: "Architecture et maîtrise d'œuvre" },
  { cle: 'etudes', nom: "Bureaux d'études et ingénierie" },
  { cle: 'mesure', nom: 'Géomètres, diagnostics, contrôle' },
  { cle: 'conseil', nom: 'Conseil, juridique, assurance, finance' },
];

/**
 * LE CATALOGUE.
 *
 * `cle` sans accent ni majuscule, `nom` tel qu'il s'affiche, `syn` ce que
 * les gens tapent, `spe` les spécialités de ce métier.
 *
 * Une spécialité qui vaut pour plusieurs métiers est écrite sous chacun :
 * « recherche de fuite » n'est pas la même chose chez un plombier et chez
 * un couvreur, et celui qui cherche veut le bon artisan, pas le bon mot.
 */
export const CATALOGUE = [
  /* ---------------------------------------------------------------- */
  /*  Gros œuvre                                                       */
  /* ---------------------------------------------------------------- */
  {
    cle: 'macon', nom: 'Maçon', categorie: 'gros-oeuvre',
    syn: ['maçonnerie', 'parpaing', 'agglo', 'béton', 'briques'],
    spe: [
      { cle: 'construction-maison', nom: 'Construction de maison' },
      { cle: 'renovation-maconnerie', nom: 'Rénovation' },
      { cle: 'extension', nom: 'Extension' },
      { cle: 'fondations', nom: 'Fondations' },
      { cle: 'dalle-beton', nom: 'Dalle béton' },
      { cle: 'beton-arme', nom: 'Béton armé' },
      { cle: 'ouverture-mur-porteur', nom: 'Ouverture de mur porteur', syn: ['ipn', 'poutre'] },
      { cle: 'mur-soutenement', nom: 'Mur de soutènement' },
      { cle: 'maconnerie-pierre', nom: 'Maçonnerie en pierre' },
    ],
  },
  {
    cle: 'maconnerie-generale', nom: 'Maçonnerie générale', categorie: 'gros-oeuvre',
    syn: ['entreprise de maçonnerie', 'gros œuvre'],
  },
  {
    cle: 'macon-patrimoine', nom: 'Maçon du patrimoine', categorie: 'gros-oeuvre',
    syn: ['monument historique', 'bâti ancien', 'restauration'],
    spe: [
      { cle: 'pierre-de-taille', nom: 'Pierre de taille' },
      { cle: 'enduit-chaux-ancien', nom: 'Enduit à la chaux' },
      { cle: 'rejointoiement', nom: 'Rejointoiement' },
    ],
  },
  {
    cle: 'coffreur-bancheur', nom: 'Coffreur-bancheur', categorie: 'gros-oeuvre',
    syn: ['banche', 'coffrage'],
  },
  { cle: 'ferrailleur', nom: 'Ferrailleur', categorie: 'gros-oeuvre', syn: ['armature', 'treillis'] },
  { cle: 'tailleur-pierre', nom: 'Tailleur de pierre', categorie: 'gros-oeuvre' },

  /* ---------------------------------------------------------------- */
  /*  Toiture, charpente, étanchéité                                   */
  /* ---------------------------------------------------------------- */
  {
    cle: 'couvreur', nom: 'Couvreur', categorie: 'toiture',
    syn: ['toiture', 'toit', 'couverture'],
    spe: [
      { cle: 'toiture-tuile', nom: 'Toiture en tuile' },
      { cle: 'toiture-ardoise', nom: 'Toiture en ardoise' },
      { cle: 'toiture-zinc', nom: 'Toiture en zinc' },
      { cle: 'renovation-toiture', nom: 'Rénovation de toiture' },
      { cle: 'recherche-fuite-toiture', nom: 'Recherche de fuite' },
      { cle: 'isolation-toiture', nom: 'Isolation de toiture' },
      { cle: 'fenetre-de-toit', nom: 'Fenêtre de toit', syn: ['velux'] },
      { cle: 'demoussage', nom: 'Démoussage' },
    ],
  },
  {
    cle: 'zingueur', nom: 'Zingueur', categorie: 'toiture',
    syn: ['zinc', 'gouttière', 'chéneau'],
    spe: [
      { cle: 'gouttiere', nom: 'Gouttières' },
      { cle: 'habillage-zinc', nom: 'Habillage en zinc' },
    ],
  },
  {
    cle: 'charpentier', nom: 'Charpentier', categorie: 'toiture',
    syn: ['charpente', 'bois', 'poutre'],
    spe: [
      { cle: 'charpente-traditionnelle', nom: 'Charpente traditionnelle' },
      { cle: 'fermette', nom: 'Fermette industrielle' },
      { cle: 'ossature-bois', nom: 'Ossature bois' },
      { cle: 'surelevation', nom: 'Surélévation' },
      { cle: 'carport', nom: 'Abri, carport, pergola' },
    ],
  },
  {
    cle: 'etancheur', nom: 'Étancheur', categorie: 'toiture',
    syn: ['étanchéité', 'infiltration'],
    spe: [
      { cle: 'toiture-terrasse', nom: 'Toiture-terrasse' },
      { cle: 'membrane-epdm', nom: 'Membrane EPDM' },
      { cle: 'etancheite-balcon', nom: 'Étanchéité de balcon' },
    ],
  },
  { cle: 'bardeur', nom: 'Bardeur', categorie: 'toiture', syn: ['bardage'] },
  { cle: 'ramoneur', nom: 'Ramoneur', categorie: 'toiture', syn: ['ramonage', 'conduit'] },

  /* ---------------------------------------------------------------- */
  /*  Plomberie, chauffage, climatisation                              */
  /* ---------------------------------------------------------------- */
  {
    cle: 'plombier', nom: 'Plombier', categorie: 'plomberie-cvc',
    syn: ['plomberie', 'sanitaire', 'fuite', 'canalisation'],
    spe: [
      { cle: 'salle-de-bain', nom: 'Salle de bain' },
      { cle: 'douche-italienne', nom: "Douche à l'italienne" },
      { cle: 'recherche-fuite-eau', nom: "Recherche de fuite d'eau" },
      { cle: 'degorgement', nom: 'Débouchage et dégorgement' },
      { cle: 'chauffe-eau', nom: 'Chauffe-eau' },
      { cle: 'reseau-per-cuivre', nom: 'Réseau cuivre ou PER' },
    ],
  },
  {
    cle: 'chauffagiste', nom: 'Chauffagiste', categorie: 'plomberie-cvc',
    syn: ['chauffage', 'chaudière', 'radiateur'],
    spe: [
      { cle: 'chaudiere-gaz', nom: 'Chaudière gaz' },
      { cle: 'pompe-a-chaleur', nom: 'Pompe à chaleur', syn: ['pac'] },
      { cle: 'plancher-chauffant', nom: 'Plancher chauffant' },
      { cle: 'radiateurs', nom: 'Radiateurs' },
      { cle: 'entretien-chaudiere', nom: 'Entretien de chaudière' },
    ],
  },
  {
    cle: 'climaticien', nom: 'Climaticien', categorie: 'plomberie-cvc',
    syn: ['climatisation', 'clim', 'cvc'],
    spe: [
      { cle: 'clim-reversible', nom: 'Climatisation réversible' },
      { cle: 'gainable', nom: 'Climatisation gainable' },
      { cle: 'vmc', nom: 'VMC et ventilation' },
    ],
  },
  { cle: 'frigoriste', nom: 'Frigoriste', categorie: 'plomberie-cvc', syn: ['froid', 'chambre froide'] },
  {
    cle: 'installateur-poele', nom: 'Installateur de poêle et cheminée',
    categorie: 'plomberie-cvc', syn: ['poêle', 'insert', 'cheminée', 'granulés'],
  },

  /* ---------------------------------------------------------------- */
  /*  Électricité, domotique, énergie                                  */
  /* ---------------------------------------------------------------- */
  {
    cle: 'electricien', nom: 'Électricien', categorie: 'electricite',
    syn: ['électricité', 'courant', 'tableau', 'prise'],
    spe: [
      { cle: 'renovation-electrique', nom: 'Rénovation électrique' },
      { cle: 'tableau-electrique', nom: 'Tableau électrique' },
      { cle: 'mise-aux-normes', nom: 'Mise aux normes NF C 15-100' },
      { cle: 'eclairage', nom: 'Éclairage' },
      { cle: 'reseau-informatique', nom: 'Réseau informatique et TV' },
    ],
  },
  {
    cle: 'domoticien', nom: 'Domoticien', categorie: 'electricite',
    syn: ['domotique', 'maison connectée', 'volets connectés'],
  },
  {
    cle: 'installateur-photovoltaique', nom: 'Installateur photovoltaïque',
    categorie: 'electricite', syn: ['panneaux solaires', 'solaire', 'autoconsommation'],
  },
  {
    cle: 'installateur-borne-recharge', nom: 'Installateur de bornes de recharge',
    categorie: 'electricite', syn: ['borne électrique', 'wallbox', 'irve'],
  },
  {
    cle: 'installateur-alarme', nom: 'Installateur alarme et vidéosurveillance',
    categorie: 'electricite', syn: ['alarme', 'caméra', 'sécurité'],
  },

  /* ---------------------------------------------------------------- */
  /*  Menuiserie, serrurerie, vitrerie                                 */
  /* ---------------------------------------------------------------- */
  {
    cle: 'menuisier', nom: 'Menuisier', categorie: 'menuiserie',
    syn: ['menuiserie', 'porte', 'fenêtre', 'placard'],
    spe: [
      { cle: 'cuisine', nom: 'Cuisine' },
      { cle: 'dressing', nom: 'Dressing et placards' },
      { cle: 'escalier-bois', nom: 'Escalier bois' },
      { cle: 'agencement', nom: 'Agencement sur mesure' },
      { cle: 'porte-interieure', nom: 'Portes intérieures' },
    ],
  },
  { cle: 'menuisier-bois', nom: 'Menuisier bois', categorie: 'menuiserie' },
  { cle: 'menuisier-alu', nom: 'Menuisier aluminium', categorie: 'menuiserie', syn: ['alu'] },
  { cle: 'menuisier-pvc', nom: 'Menuisier PVC', categorie: 'menuiserie' },
  {
    cle: 'serrurier', nom: 'Serrurier', categorie: 'menuiserie',
    syn: ['serrure', 'porte claquée', 'clé', 'verrou'],
    spe: [
      { cle: 'ouverture-porte', nom: 'Ouverture de porte' },
      { cle: 'changement-serrure', nom: 'Changement de serrure' },
      { cle: 'porte-blindee', nom: 'Porte blindée' },
      { cle: 'controle-acces', nom: "Contrôle d'accès" },
    ],
  },
  {
    cle: 'metallier', nom: 'Métallier', categorie: 'menuiserie',
    syn: ['ferronnerie', 'acier', 'soudure'],
    spe: [
      { cle: 'garde-corps', nom: 'Garde-corps' },
      { cle: 'portail', nom: 'Portail' },
      { cle: 'verriere', nom: 'Verrière' },
      { cle: 'escalier-metal', nom: 'Escalier métallique' },
    ],
  },
  {
    cle: 'vitrier', nom: 'Vitrier', categorie: 'menuiserie',
    syn: ['vitre', 'vitrage', 'miroir'],
    spe: [
      { cle: 'double-vitrage', nom: 'Double vitrage' },
      { cle: 'remplacement-vitre', nom: 'Remplacement de vitre' },
      { cle: 'miroiterie', nom: 'Miroiterie' },
    ],
  },
  {
    cle: 'poseur-volets', nom: 'Poseur de volets et stores', categorie: 'menuiserie',
    syn: ['volet roulant', 'store', 'pergola bioclimatique'],
  },

  /* ---------------------------------------------------------------- */
  /*  Revêtements et finitions                                         */
  /* ---------------------------------------------------------------- */
  {
    cle: 'peintre-en-batiment', nom: 'Peintre en bâtiment', categorie: 'finitions',
    syn: ['peintre', 'peinture', 'papier peint'],
    spe: [
      { cle: 'peinture-interieure', nom: 'Peinture intérieure' },
      { cle: 'peinture-exterieure', nom: 'Peinture extérieure' },
      { cle: 'papier-peint', nom: 'Papier peint' },
      { cle: 'enduit-decoratif', nom: 'Enduit décoratif' },
      { cle: 'laque-boiserie', nom: 'Laque et boiseries' },
    ],
  },
  {
    cle: 'plaquiste', nom: 'Plaquiste', categorie: 'finitions',
    syn: ['placo', 'placoplatre', 'ba13', 'plaque de plâtre'],
    spe: [
      { cle: 'cloison', nom: 'Cloisons' },
      { cle: 'faux-plafond', nom: 'Faux plafond' },
      { cle: 'doublage', nom: 'Doublage' },
      { cle: 'bandes-joints', nom: 'Bandes et joints' },
    ],
  },
  {
    cle: 'platrier', nom: 'Plâtrier', categorie: 'finitions',
    syn: ['plâtre', 'staff'],
    spe: [
      { cle: 'enduit-platre', nom: 'Enduit au plâtre' },
      { cle: 'moulure-staff', nom: 'Moulures et staff' },
    ],
  },
  {
    cle: 'carreleur', nom: 'Carreleur', categorie: 'finitions',
    syn: ['carrelage', 'faïence', 'carreau', 'mosaïque'],
    spe: [
      { cle: 'carrelage-grand-format', nom: 'Grand format' },
      { cle: 'faience', nom: 'Faïence' },
      { cle: 'mosaique', nom: 'Mosaïque' },
      { cle: 'carrelage-exterieur', nom: 'Terrasse et extérieur' },
      { cle: 'chape', nom: 'Chape' },
    ],
  },
  {
    cle: 'solier', nom: 'Solier-moquettiste', categorie: 'finitions',
    syn: ['sol souple', 'lino', 'moquette', 'pvc'],
  },
  {
    cle: 'parqueteur', nom: 'Parqueteur', categorie: 'finitions',
    syn: ['parquet', 'ponçage', 'vitrification'],
    spe: [
      { cle: 'pose-parquet', nom: 'Pose de parquet' },
      { cle: 'poncage-vitrification', nom: 'Ponçage et vitrification' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /*  Isolation et façade                                              */
  /* ---------------------------------------------------------------- */
  {
    cle: 'facadier', nom: 'Façadier', categorie: 'isolation-facade',
    syn: ['façade', 'ravalement', 'crépi'],
    spe: [
      { cle: 'ravalement', nom: 'Ravalement de façade' },
      { cle: 'enduit-monocouche', nom: 'Enduit monocouche' },
      { cle: 'enduit-chaux', nom: 'Enduit à la chaux' },
      { cle: 'nettoyage-facade', nom: 'Nettoyage de façade' },
    ],
  },
  { cle: 'enduiseur', nom: 'Enduiseur', categorie: 'isolation-facade', syn: ['enduit'] },
  {
    cle: 'isolation', nom: "Entreprise d'isolation", categorie: 'isolation-facade',
    syn: ['isolant', 'laine de verre', 'laine de roche', 'combles'],
    spe: [
      { cle: 'isolation-combles', nom: 'Isolation des combles' },
      { cle: 'isolation-murs', nom: 'Isolation des murs' },
      { cle: 'isolation-plancher', nom: 'Isolation du plancher' },
      { cle: 'soufflage', nom: 'Soufflage' },
      { cle: 'isolation-phonique', nom: 'Isolation phonique' },
    ],
  },
  {
    cle: 'ite', nom: "Isolation thermique par l'extérieur", categorie: 'isolation-facade',
    syn: ['ite', 'isolation extérieure'],
  },

  /* ---------------------------------------------------------------- */
  /*  Terrassement, VRD, assainissement                                */
  /* ---------------------------------------------------------------- */
  {
    cle: 'terrassier', nom: 'Terrassier', categorie: 'terrassement-vrd',
    syn: ['terrassement', 'pelle', 'remblai', 'fouille'],
    spe: [
      { cle: 'fouille', nom: 'Fouilles et tranchées' },
      { cle: 'nivellement', nom: 'Nivellement et plateforme' },
      { cle: 'viabilisation', nom: 'Viabilisation de terrain' },
      { cle: 'drainage', nom: 'Drainage' },
    ],
  },
  { cle: 'canalisateur', nom: 'Canalisateur', categorie: 'terrassement-vrd', syn: ['canalisation', 'réseau enterré'] },
  { cle: 'vrd', nom: 'Entreprise VRD', categorie: 'terrassement-vrd', syn: ['voirie', 'réseaux divers', 'vrd'] },
  {
    cle: 'assainissement', nom: 'Assainissement', categorie: 'terrassement-vrd',
    syn: ['fosse', 'tout à l’égout', 'eaux usées'],
    spe: [
      { cle: 'fosse-septique', nom: 'Fosse septique' },
      { cle: 'micro-station', nom: 'Micro-station' },
      { cle: 'epandage', nom: 'Épandage' },
    ],
  },
  { cle: 'forage', nom: 'Forage et puits', categorie: 'terrassement-vrd', syn: ['puits', 'géothermie'] },

  /* ---------------------------------------------------------------- */
  /*  Extérieur, paysage, piscine                                      */
  /* ---------------------------------------------------------------- */
  {
    cle: 'paysagiste', nom: 'Paysagiste', categorie: 'exterieur',
    syn: ['jardin', 'espaces verts', 'gazon', 'plantation'],
    spe: [
      { cle: 'creation-jardin', nom: 'Création de jardin' },
      { cle: 'entretien-espaces-verts', nom: 'Entretien des espaces verts' },
      { cle: 'arrosage-automatique', nom: 'Arrosage automatique' },
      { cle: 'gazon', nom: 'Gazon et pelouse' },
    ],
  },
  {
    cle: 'macon-paysagiste', nom: 'Maçon paysagiste', categorie: 'exterieur',
    syn: ['terrasse', 'allée', 'muret'],
    spe: [
      { cle: 'terrasse', nom: 'Terrasse' },
      { cle: 'allee', nom: 'Allée et accès' },
      { cle: 'muret', nom: 'Muret' },
      { cle: 'escalier-exterieur', nom: 'Escalier extérieur' },
    ],
  },
  {
    cle: 'pisciniste', nom: 'Pisciniste', categorie: 'exterieur',
    syn: ['piscine', 'bassin', 'spa'],
    spe: [
      { cle: 'piscine-beton', nom: 'Piscine béton' },
      { cle: 'piscine-coque', nom: 'Piscine coque' },
      { cle: 'renovation-piscine', nom: 'Rénovation de piscine' },
      { cle: 'local-technique', nom: 'Local technique' },
      { cle: 'spa', nom: 'Spa et jacuzzi' },
    ],
  },
  { cle: 'elagueur', nom: 'Élagueur', categorie: 'exterieur', syn: ['élagage', 'abattage', 'arbre'] },
  { cle: 'cloturiste', nom: 'Poseur de clôtures et portails', categorie: 'exterieur', syn: ['clôture', 'grillage', 'portail'] },

  /* ---------------------------------------------------------------- */
  /*  Démolition et désamiantage                                       */
  /* ---------------------------------------------------------------- */
  {
    cle: 'demolisseur', nom: 'Entreprise de démolition', categorie: 'demolition',
    syn: ['démolition', 'casse', 'curage'],
    spe: [
      { cle: 'demolition-interieure', nom: 'Démolition intérieure' },
      { cle: 'curage', nom: 'Curage' },
    ],
  },
  { cle: 'desamianteur', nom: 'Désamianteur', categorie: 'demolition', syn: ['amiante', 'désamiantage'] },
  { cle: 'depollution', nom: 'Entreprise de dépollution', categorie: 'demolition', syn: ['dépollution', 'sol pollué'] },

  /* ---------------------------------------------------------------- */
  /*  Construction et entreprise générale                              */
  /* ---------------------------------------------------------------- */
  { cle: 'constructeur-maisons', nom: 'Constructeur de maisons individuelles', categorie: 'construction', syn: ['cmi', 'maison neuve'] },
  { cle: 'entreprise-generale', nom: 'Entreprise générale du bâtiment', categorie: 'construction', syn: ['tous corps d’état', 'tce'] },
  { cle: 'contractant-general', nom: 'Contractant général', categorie: 'construction' },
  { cle: 'renovation-globale', nom: 'Entreprise de rénovation globale', categorie: 'construction', syn: ['rénovation complète', 'clé en main'] },
  { cle: 'promoteur', nom: 'Promoteur immobilier', categorie: 'construction' },

  /* ---------------------------------------------------------------- */
  /*  Architecture et maîtrise d'œuvre                                 */
  /* ---------------------------------------------------------------- */
  {
    cle: 'architecte', nom: 'Architecte', categorie: 'conception',
    syn: ['archi', 'plans', 'permis'],
    spe: [
      { cle: 'permis-de-construire', nom: 'Permis de construire' },
      { cle: 'maison-individuelle', nom: 'Maison individuelle' },
      { cle: 'renovation-lourde', nom: 'Rénovation lourde' },
      { cle: 'erp', nom: 'Bâtiment recevant du public' },
    ],
  },
  { cle: 'architecte-interieur', nom: "Architecte d'intérieur", categorie: 'conception', syn: ['archi intérieur', 'aménagement'] },
  { cle: 'architecte-paysagiste', nom: 'Architecte paysagiste', categorie: 'conception' },
  { cle: 'maitre-oeuvre', nom: "Maître d'œuvre", categorie: 'conception', syn: ['moe', 'suivi de chantier'] },
  { cle: 'amo', nom: "Assistant à maîtrise d'ouvrage", categorie: 'conception', syn: ['amo', 'amoa'] },
  { cle: 'decorateur-interieur', nom: "Décorateur d'intérieur", categorie: 'conception', syn: ['décoration', 'home staging'] },
  { cle: 'dessinateur-projeteur', nom: 'Dessinateur-projeteur', categorie: 'conception', syn: ['plans', 'autocad'] },
  { cle: 'bim-manager', nom: 'BIM Manager', categorie: 'conception', syn: ['bim', 'maquette numérique'] },
  { cle: 'modeleur-bim', nom: 'Modeleur BIM', categorie: 'conception', syn: ['revit'] },

  /* ---------------------------------------------------------------- */
  /*  Bureaux d'études et ingénierie                                   */
  /* ---------------------------------------------------------------- */
  { cle: 'ingenieur-structure', nom: 'Ingénieur structure', categorie: 'etudes', syn: ['calcul de structure', 'descente de charges'] },
  { cle: 'ingenieur-batiment', nom: 'Ingénieur bâtiment', categorie: 'etudes' },
  { cle: 'ingenieur-genie-civil', nom: 'Ingénieur génie civil', categorie: 'etudes' },
  { cle: 'be-structure', nom: "Bureau d'études structure", categorie: 'etudes', syn: ['bet structure'] },
  { cle: 'be-thermique', nom: "Bureau d'études thermique", categorie: 'etudes', syn: ['rt 2020', 're 2020', 'étude thermique'] },
  { cle: 'be-fluides', nom: "Bureau d'études fluides", categorie: 'etudes', syn: ['cvc', 'plomberie', 'électricité'] },
  { cle: 'be-acoustique', nom: "Bureau d'études acoustique", categorie: 'etudes', syn: ['acoustique', 'bruit'] },
  { cle: 'be-environnement', nom: "Bureau d'études environnement", categorie: 'etudes' },
  { cle: 'be-geotechnique', nom: "Bureau d'études géotechnique", categorie: 'etudes', syn: ['g2', 'étude de sol'] },
  { cle: 'geotechnicien', nom: 'Géotechnicien', categorie: 'etudes', syn: ['étude de sol', 'sondage'] },
  { cle: 'economiste-construction', nom: 'Économiste de la construction', categorie: 'etudes', syn: ['chiffrage', 'dpgf'] },
  { cle: 'metreur', nom: 'Métreur', categorie: 'etudes', syn: ['métré', 'quantitatif'] },

  /* ---------------------------------------------------------------- */
  /*  Géomètres, diagnostics, contrôle                                 */
  /* ---------------------------------------------------------------- */
  { cle: 'geometre-expert', nom: 'Géomètre-expert', categorie: 'mesure', syn: ['bornage', 'division parcellaire'] },
  { cle: 'topographe', nom: 'Topographe', categorie: 'mesure', syn: ['relevé topographique'] },
  {
    cle: 'diagnostiqueur', nom: 'Diagnostiqueur immobilier', categorie: 'mesure',
    syn: ['diagnostic', 'dpe', 'amiante', 'plomb'],
    spe: [
      { cle: 'dpe', nom: 'DPE' },
      { cle: 'diag-amiante', nom: 'Amiante' },
      { cle: 'diag-plomb', nom: 'Plomb' },
      { cle: 'diag-termites', nom: 'Termites' },
      { cle: 'diag-electricite-gaz', nom: 'Électricité et gaz' },
      { cle: 'loi-carrez', nom: 'Loi Carrez' },
    ],
  },
  { cle: 'expert-batiment', nom: 'Expert bâtiment', categorie: 'mesure', syn: ['expertise', 'fissures', 'malfaçon'] },
  { cle: 'expert-construction', nom: 'Expert construction', categorie: 'mesure', syn: ['sinistre', 'contre-expertise'] },
  { cle: 'bureau-controle', nom: 'Bureau de contrôle', categorie: 'mesure', syn: ['contrôle technique', 'ctc'] },
  { cle: 'coordonnateur-sps', nom: 'Coordonnateur SPS', categorie: 'mesure', syn: ['sps', 'sécurité chantier'] },

  /* ---------------------------------------------------------------- */
  /*  Conseil, juridique, assurance, finance                           */
  /* ---------------------------------------------------------------- */
  { cle: 'avocat-construction', nom: 'Avocat en droit de la construction', categorie: 'conseil', syn: ['avocat', 'litige chantier'] },
  { cle: 'avocat-immobilier', nom: 'Avocat en droit immobilier', categorie: 'conseil', syn: ['avocat', 'copropriété'] },
  { cle: 'expert-comptable-btp', nom: 'Expert-comptable spécialisé BTP', categorie: 'conseil', syn: ['comptable', 'comptabilité'] },
  { cle: 'courtier-assurance-construction', nom: 'Courtier en assurance construction', categorie: 'conseil', syn: ['assurance', 'décennale', 'orias'] },
  { cle: 'courtier-financement', nom: 'Courtier en financement', categorie: 'conseil', syn: ['prêt', 'crédit', 'financement'] },
  { cle: 'consultant-btp', nom: 'Consultant BTP', categorie: 'conseil', syn: ['conseil', 'accompagnement'] },
];

/**
 * LA MIGRATION — l'ancienne liste vers les nouvelles clés.
 *
 * Douze noms, écrits tels qu'ils sont RÉELLEMENT en base aujourd'hui.
 * Cette table a une seule raison d'être : ne perdre aucune ligne le jour du
 * changement. Elle ne doit plus jamais servir ensuite, mais elle reste —
 * effacée, une base restaurée d'une vieille sauvegarde n'aurait plus de
 * chemin de retour.
 *
 * Un seul nom change de libellé au passage : « Peintre » devient
 * « Peintre en bâtiment », qui est le nom du métier.
 */
export const ANCIENS_NOMS = {
  'Maçon': 'macon',
  'Électricien': 'electricien',
  'Plombier': 'plombier',
  'Charpentier': 'charpentier',
  'Peintre': 'peintre-en-batiment',
  'Carreleur': 'carreleur',
  'Couvreur': 'couvreur',
  'Menuisier': 'menuisier',
  'Plaquiste': 'plaquiste',
  'Terrassier': 'terrassier',
  'Serrurier': 'serrurier',
  'Chauffagiste': 'chauffagiste',
};
