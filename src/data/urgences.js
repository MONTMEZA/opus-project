/**
 * SOS — interventions d'urgence : les DONNÉES, et rien d'autre.
 *
 * Ce fichier dit quels métiers relèvent d'une urgence domestique, quels
 * problèmes on peut signaler, combien de temps ils prennent en moyenne, et
 * quand une heure compte comme « la nuit ou le week-end ». Il ne contient
 * plus AUCUN tarif, et plus aucun calcul de prix — depuis le lot T
 * (19/10/2026) :
 *
 *   - les tarifs d'un artisan vivent dans `tarifs_pro`, une seule liste pour
 *     ses devis et pour le SOS, réglée dans « Mon entreprise » et affichée
 *     au choix de l'artisan (décision du 17/10/2026). Les trois chiffres
 *     qu'on saisissait ici une seule fois (`sos_availability.deplacement`,
 *     `.horaire`, `.majoration`) sont des colonnes MORTES ;
 *   - l'estimation et la liste des artisans disponibles en démonstration
 *     vivent dans `src/lib/tarifs.js`, en centimes, sur les tarifs AFFICHÉS.
 *
 * Le principe reste le même, volontairement simple et honnête : chaque
 * problème porte une durée moyenne (min / max heures), et l'app en déduit
 * une FOURCHETTE ESTIMÉE, jamais un prix ferme — l'artisan n'a pas encore
 * vu le chantier.
 *
 * CE FICHIER N'IMPORTE RIEN : `verifier-metiers` et `verifier-tarifs`
 * l'ouvrent avec `node`, et `tarifs.js` l'importe. Un import dans l'autre
 * sens ferait une boucle.
 */

/** Les quatre métiers qui relèvent d'une vraie urgence domestique. */
export const METIERS_SOS = [
  { key: 'plomberie', label: 'Plomberie', metier: 'plombier', icon: 'wrench' },
  { key: 'electricite', label: 'Électricité', metier: 'electricien', icon: 'zap' },
  { key: 'serrurerie', label: 'Serrurerie', metier: 'serrurier', icon: 'key' },
  { key: 'chauffage', label: 'Chauffage', metier: 'chauffagiste', icon: 'thermometer' },
];

/**
 * Types de problème par métier, avec la durée d'intervention moyenne.
 * Ce sont ces durées qui transforment les tarifs affichés d'un artisan en
 * fourchette de prix (`estimationSos`, src/lib/tarifs.js). Ce sont des
 * durées MOYENNES d'Opus, et la carte le dit.
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
 * Disponibilité des artisans, en démonstration — SANS leurs tarifs.
 * En vrai, ces lignes viennent de la table `sos_availability`, remplie par
 * l'artisan depuis « Modifier mon profil » ; leurs tarifs viennent de
 * `tarifs_pro` (en démonstration : `src/data/tarifs-demo.js`).
 *   distanceKm  : distance simulée (calculée par géolocalisation en vrai)
 *   delaiMin    : délai d'arrivée annoncé, en minutes
 *
 * Un artisan n'apparaît dans une recherche que si ses tarifs sont AFFICHÉS
 * et complets (lot T, réponse du propriétaire du 19/10/2026 : répondre aux
 * urgences demande d'afficher ses tarifs). La fiche 8 ne les affiche pas :
 * elle a une ligne ici, et n'apparaît nulle part — c'est voulu.
 */
export const SOS_ARTISANS = [
  { proId: 4, metierKey: 'plomberie',   distanceKm: 2.4, delaiMin: 25, actif: true },
  { proId: 2, metierKey: 'electricite', distanceKm: 4.1, delaiMin: 40, actif: true },
  { proId: 6, metierKey: 'serrurerie',  distanceKm: 1.8, delaiMin: 20, actif: true },
  { proId: 7, metierKey: 'chauffage',   distanceKm: 6.7, delaiMin: 55, actif: true },
  // Un même métier peut avoir plusieurs artisans disponibles : c'est le
  // principe même de l'app, le client compare et choisit lui-même.
  // Un artisan ne peut être disponible que sur SON métier : un maçon
  // n'apparaît jamais dans les plombiers d'urgence.
  { proId: 8, metierKey: 'plomberie',   distanceKm: 5.2, delaiMin: 45, actif: true },
];

/**
 * Vrai entre 20 h et 7 h, ou le samedi et le dimanche : les heures où Opus
 * applique la majoration de nuit et de week-end d'un artisan dans
 * l'estimation des urgences. C'est une convention d'OPUS, pas celle de
 * l'artisan, qui ne déclare qu'un pourcentage : sa fiche ne la montre pas.
 * `HEURES_MAJOREES` (src/lib/tarifs.js) la dit en mots, et `verifier-tarifs`
 * compare les deux.
 */
export function estNuitOuWeekend(date = new Date()) {
  const h = date.getHours();
  const j = date.getDay();
  return h >= 20 || h < 7 || j === 0 || j === 6;
}
