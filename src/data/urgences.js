/**
 * SOS — interventions d'urgence.
 *
 * Principe tarifaire, volontairement simple et honnête :
 * l'artisan renseigne trois chiffres une seule fois
 *   - un forfait de déplacement
 *   - un tarif horaire
 *   - une majoration nuit et week-end (en %)
 * Chaque type de problème porte une durée moyenne (min / max heures).
 * L'app en déduit une FOURCHETTE ESTIMÉE, jamais un prix ferme :
 * l'artisan n'a pas encore vu le chantier.
 */

/** Les quatre métiers qui relèvent d'une vraie urgence domestique. */
export const METIERS_SOS = [
  { key: 'plomberie', label: 'Plomberie', metier: 'Plombier', icon: 'wrench' },
  { key: 'electricite', label: 'Électricité', metier: 'Électricien', icon: 'zap' },
  { key: 'serrurerie', label: 'Serrurerie', metier: 'Serrurier', icon: 'key' },
  { key: 'chauffage', label: 'Chauffage', metier: 'Chauffagiste', icon: 'thermometer' },
];

/**
 * Types de problème par métier, avec la durée d'intervention moyenne.
 * Ce sont ces durées qui transforment trois chiffres en fourchette de prix.
 */
export const PROBLEMES = {
  plomberie: [
    { key: 'fuite', label: "Fuite d'eau", detail: 'Tuyau, robinet, raccord', h: [1, 2] },
    { key: 'bouche', label: 'Canalisation bouchée', detail: 'Évier, douche, WC', h: [1, 2.5] },
    { key: 'wc', label: 'WC hors service', detail: 'Chasse, évacuation', h: [1, 2] },
    { key: 'chauffeeau', label: "Chauffe-eau en panne", detail: "Plus d'eau chaude", h: [1.5, 3] },
    { key: 'degat', label: 'Dégât des eaux', detail: 'Inondation en cours', h: [2, 4] },
  ],
  electricite: [
    { key: 'panne', label: 'Panne totale', detail: 'Plus aucun courant', h: [1, 2.5] },
    { key: 'disjoncteur', label: 'Disjoncteur qui saute', detail: 'Coupures répétées', h: [1, 2] },
    { key: 'prise', label: 'Prise ou interrupteur HS', detail: 'Sur un seul point', h: [0.5, 1.5] },
    { key: 'tableau', label: 'Tableau électrique', detail: 'Odeur, chaleur, étincelles', h: [2, 4] },
  ],
  serrurerie: [
    { key: 'claquee', label: 'Porte claquée', detail: 'Clés restées à l’intérieur', h: [0.5, 1] },
    { key: 'cassee', label: 'Clé cassée dans la serrure', detail: '', h: [0.5, 1.5] },
    { key: 'forcee', label: 'Serrure forcée', detail: 'Après effraction', h: [1.5, 3] },
    { key: 'blindee', label: 'Porte blindée bloquée', detail: 'Multipoints', h: [1.5, 3] },
  ],
  chauffage: [
    { key: 'chaudiere', label: 'Chaudière en panne', detail: 'Plus de chauffage', h: [1.5, 3] },
    { key: 'radiateur', label: 'Radiateur froid', detail: 'Un seul ou plusieurs', h: [1, 2] },
    { key: 'pression', label: 'Perte de pression', detail: 'Circuit à recharger', h: [1, 2] },
    { key: 'thermostat', label: 'Thermostat défaillant', detail: '', h: [1, 2] },
  ],
};

/** Quand l'intervention doit avoir lieu. */
export const CRENEAUX_SOS = [
  { key: 'immediat', label: 'Tout de suite', detail: "Dans l'heure si possible" },
  { key: 'journee', label: 'Dans la journée', detail: 'Aujourd’hui' },
  { key: 'demain', label: 'Demain', detail: 'Ça peut attendre la nuit' },
];

/**
 * Disponibilité et grille tarifaire des artisans, en démonstration.
 * En vrai, ces lignes viennent de la table `sos_availability` remplie
 * par l'artisan depuis son profil.
 *   deplacement : forfait fixe en euros
 *   horaire     : tarif horaire en euros
 *   majoration  : % appliqué la nuit et le week-end
 *   distanceKm  : distance simulée (calculée par géolocalisation en vrai)
 *   delaiMin    : délai d'arrivée annoncé, en minutes
 */
export const SOS_ARTISANS = [
  { proId: 4, metierKey: 'plomberie',   deplacement: 45, horaire: 62, majoration: 40, distanceKm: 2.4, delaiMin: 25, actif: true },
  { proId: 2, metierKey: 'electricite', deplacement: 39, horaire: 58, majoration: 35, distanceKm: 4.1, delaiMin: 40, actif: true },
  { proId: 6, metierKey: 'serrurerie',  deplacement: 55, horaire: 70, majoration: 50, distanceKm: 1.8, delaiMin: 20, actif: true },
  { proId: 7, metierKey: 'chauffage',   deplacement: 49, horaire: 65, majoration: 30, distanceKm: 6.7, delaiMin: 55, actif: true },
  // Un même métier peut avoir plusieurs artisans disponibles : c'est le
  // principe même de l'app, le client compare et choisit lui-même.
  // Un artisan ne peut être disponible que sur SON métier : un maçon
  // n'apparaît jamais dans les plombiers d'urgence.
  { proId: 8, metierKey: 'plomberie',   deplacement: 35, horaire: 55, majoration: 25, distanceKm: 5.2, delaiMin: 45, actif: true },
];

/**
 * Calcule la fourchette estimée pour un artisan et un problème donnés.
 * Retourne { min, max, majore } en euros entiers.
 */
export function estimation(artisan, probleme, nuitOuWeekend = false) {
  if (!artisan || !probleme) return { min: 0, max: 0, majore: false };
  const coef = nuitOuWeekend ? 1 + artisan.majoration / 100 : 1;
  const [hMin, hMax] = probleme.h;
  return {
    min: Math.round((artisan.deplacement + artisan.horaire * hMin) * coef),
    max: Math.round((artisan.deplacement + artisan.horaire * hMax) * coef),
    majore: nuitOuWeekend,
  };
}

/** Vrai entre 20 h et 7 h, ou le samedi et le dimanche. */
export function estNuitOuWeekend(date = new Date()) {
  const h = date.getHours();
  const j = date.getDay();
  return h >= 20 || h < 7 || j === 0 || j === 6;
}

/**
 * Les artisans disponibles pour un métier, triés du plus proche au plus loin.
 * En production, le tri se fait sur la distance réelle calculée par PostGIS.
 */
export function artisansDisponibles(metierKey) {
  return SOS_ARTISANS
    .filter((a) => a.actif && a.metierKey === metierKey)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
