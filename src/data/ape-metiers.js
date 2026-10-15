/**
 * LE CODE D'ACTIVITÉ PROPOSE UN MÉTIER. IL NE LE BLOQUE JAMAIS.
 *
 * LA DÉCISION, ET POURQUOI
 * ------------------------
 * Le propriétaire voulait que le code APE « bloque le métier principal ».
 * Mesuré le 12/10/2026 (docs/SIRET-ET-CLAUSES.md §8.5), c'est impossible
 * sans enfermer de vrais artisans hors de leur propre métier :
 *
 *   - un seul code, 43.99C, couvre une entreprise générale, du génie civil,
 *     du coffrage, une MENUISERIE et une maçonnerie ;
 *   - pour « peintre », 19 codes différents sur 25 entreprises ; pour
 *     « couvreur », 18 ;
 *   - une entreprise a UN code, Opus autorise QUATRE métiers ;
 *   - le code est déclaré une fois, à l'immatriculation, et ne se met
 *     presque jamais à jour.
 *
 * > Le code PROPOSE : le sélecteur s'ouvre avec le métier déjà coché, et la
 * > phrase « d'après votre code d'activité — corrigez si ce n'est pas le
 * > bon ». Un geste suffit pour le changer.
 *
 * CE QUI EST DANS LA TABLE, ET CE QUI N'Y EST PAS
 * -----------------------------------------------
 * Uniquement les codes qui désignent UN métier du catalogue sans ambiguïté.
 * Un code trop large (« autres travaux spécialisés », « ingénierie, études
 * techniques ») ne propose RIEN : une proposition fausse coûte plus qu'une
 * absence de proposition, parce qu'on la valide sans la lire.
 *
 * DEUX NOMENCLATURES, ET ELLES COHABITENT
 * ---------------------------------------
 * Le registre rend `activite_principale` (la nomenclature NAF rév. 2, celle
 * d'aujourd'hui) ET `activite_principale_naf25` (la NAF 2025, qui la
 * remplacera). Les codes NAF 2025 de cette table sont ceux OBSERVÉS sur de
 * vraies entreprises le 15/10/2026 : pour chaque code d'aujourd'hui, 75
 * entreprises interrogées, et le code 2025 retenu est celui qu'elles portent
 * à plus de 85 % (43.99C → 43.91Y chez 63 sur 75, 43.21A → 43.21G chez 74
 * sur 75…). On regarde d'abord le code d'aujourd'hui, puis l'autre.
 *
 * Ce fichier n'importe RIEN : `verifier-siret` le fait tourner, et vérifie
 * que chaque clé proposée existe bien dans le catalogue.
 */

/** NAF rév. 2 — la nomenclature en vigueur. */
export const METIERS_PAR_APE = {
  // Gros œuvre et structure
  '43.99C': ['macon'],                 // maçonnerie générale et gros œuvre
  '43.99A': ['etancheur'],             // travaux d'étanchéification
  '43.99B': ['metallier'],             // montage de structures métalliques
  '43.11Z': ['demolisseur'],           // démolition
  '43.12A': ['terrassier'],            // terrassement courant
  '43.12B': ['terrassier'],            // terrassements spécialisés
  '43.13Z': ['forage'],                // forages et sondages
  '23.70Z': ['tailleur-pierre'],       // taille, façonnage de pierres

  // Toiture
  '43.91A': ['charpentier'],           // travaux de charpente
  '43.91B': ['couvreur'],              // couverture par éléments

  // Fluides et énergie
  '43.21A': ['electricien'],           // installation électrique des bâtiments
  '43.22A': ['plombier'],              // eau et gaz
  '43.22B': ['chauffagiste'],          // chauffage, climatisation
  '43.29A': ['isolation'],             // travaux d'isolation

  // Menuiserie et métal
  '43.32A': ['menuisier'],             // menuiserie bois et PVC
  '43.32B': ['metallier'],             // menuiserie métallique et serrurerie
  '16.23Z': ['menuisier'],             // fabrication de charpentes et menuiseries
  '25.11Z': ['metallier'],             // fabrication de structures métalliques
  '25.12Z': ['metallier'],             // fabrication de portes et fenêtres en métal

  // Finitions
  '43.31Z': ['plaquiste'],             // plâtrerie
  '43.33Z': ['carreleur'],             // revêtement des sols et des murs
  '43.34Z': ['peintre-en-batiment'],   // peinture et vitrerie

  // Construction
  '41.20A': ['constructeur-maisons'],  // construction de maisons individuelles
  '41.20B': ['entreprise-generale'],   // construction d'autres bâtiments
  '42.21Z': ['canalisateur'],          // réseaux pour fluides

  // Conception, mesure, extérieur
  '71.11Z': ['architecte'],            // activités d'architecture
  '71.12A': ['geometre-expert'],       // activité des géomètres
  '81.30Z': ['paysagiste'],            // services d'aménagement paysager
};

/** NAF 2025 — seulement les correspondances observées (voir l'en-tête). */
export const METIERS_PAR_NAF25 = {
  '43.91Y': ['macon'],
  '43.21G': ['electricien'],
  '43.22G': ['plombier'],
  '43.22H': ['chauffagiste'],
  '43.23Y': ['isolation'],
  '43.31Y': ['plaquiste'],
  '43.32G': ['menuisier'],
  '43.32H': ['metallier'],
  '43.33Y': ['carreleur'],
  '43.34G': ['peintre-en-batiment'],
  '43.41G': ['charpentier'],
  '43.41H': ['couvreur'],
  '43.12G': ['terrassier'],
  '71.11Y': ['architecte'],
};

/**
 * Les métiers à PROPOSER pour une entreprise, d'après ce que dit le
 * registre. Rend une liste vide quand rien n'est sûr — jamais un repli
 * « maçon par défaut » : le formulaire a déjà le sien, et une proposition
 * inventée se validerait sans être lue.
 */
export function metiersProposes(ape, naf25) {
  const a = String(ape == null ? '' : ape).trim().toUpperCase();
  const b = String(naf25 == null ? '' : naf25).trim().toUpperCase();
  return (METIERS_PAR_APE[a] || METIERS_PAR_NAF25[b] || []).slice();
}
