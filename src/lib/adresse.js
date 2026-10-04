/**
 * Recherche de villes et d'adresses françaises.
 *
 * Source : la Base Adresse Nationale (api-adresse.data.gouv.fr), le service
 * officiel de l'État. Gratuit, sans clé d'API, sans quota à demander.
 *
 * Elle renvoie le code postal, le code INSEE et surtout les COORDONNÉES GPS,
 * qui servent ensuite à calculer les distances pour les urgences.
 */

const BASE = 'https://api-adresse.data.gouv.fr/search/';

/** Met en forme un résultat brut de l'API. */
function formater(feature) {
  const p = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;
  // context = "13, Bouches-du-Rhône, Provence-Alpes-Côte d'Azur"
  const morceaux = (p.context || '').split(',').map((x) => x.trim());
  return {
    id: p.id,
    label: p.label,                       // "Marseille" ou "12 rue X, 13001 Marseille"
    ville: p.city || p.name,
    codePostal: p.postcode || '',
    codeInsee: p.citycode || '',
    departement: morceaux[1] || '',
    codeDepartement: morceaux[0] || '',
    latitude: lat,
    longitude: lon,
    /** Forme affichée dans l'app : "Marseille (13)" */
    affichage: p.city || p.name
      ? `${p.city || p.name} (${(p.postcode || '').slice(0, 2)})`
      : p.label,
  };
}

/**
 * Les seules valeurs que l'API accepte pour le paramètre `type`.
 * En envoyer une autre lui fait renvoyer une erreur 400, et donc aucune
 * suggestion. Pour chercher une adresse, on n'envoie PAS de type : la
 * recherche libre renvoie numéros de rue, rues et communes mélangés.
 */
const TYPES_VALIDES = ['housenumber', 'street', 'locality', 'municipality'];

/** `__DEV__` n'existe que dans React Native ; ailleurs (tests, Node) il est absent. */
function enDeveloppement() {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

/**
 * Cherche des villes (`type: 'municipality'`) ou des adresses complètes
 * (`type: 'address'`, qui déclenche une recherche libre).
 *
 * Renvoie [] plutôt que de lever une erreur : une suggestion qui n'arrive
 * pas ne doit jamais empêcher quelqu'un de taper sa ville à la main. Mais en
 * développement, on écrit la raison dans la console, sans quoi une requête
 * mal formée passe inaperçue.
 */
export async function chercher(texte, { type = 'municipality', limite = 6 } = {}) {
  const q = (texte || '').trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({ q, limit: String(limite) });
  if (TYPES_VALIDES.includes(type)) params.set('type', type);

  try {
    const reponse = await fetch(`${BASE}?${params.toString()}`);
    if (!reponse.ok) {
      if (enDeveloppement()) {
        console.warn(`[adresse] L'API a répondu ${reponse.status} pour « ${q} »`);
      }
      return [];
    }
    const data = await reponse.json();
    return (data.features || []).map(formater);
  } catch (e) {
    if (enDeveloppement()) console.warn('[adresse] Appel impossible :', e.message);
    return [];
  }
}

/**
 * Distance à vol d'oiseau entre deux points, en kilomètres (formule de
 * haversine). Utilisée pour trier les artisans disponibles lors d'une urgence.
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => typeof v !== 'number')) return null;
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
}

/**
 * La distance, écrite comme on la dirait.
 *
 * `· 0 km` s'affichait quand l'artisan et le chantier étaient dans la même
 * commune. C'est juste, et ça ne veut rien dire : personne ne comprend
 * « zéro kilomètre ». Ce qu'on veut savoir à cet instant, c'est « c'est
 * chez moi » ou « c'est loin ».
 *
 * Trois paliers, et rien de plus :
 *   - moins de 1 km  → « dans votre commune »
 *   - moins de 10 km → au demi-kilomètre près, parce que 3 et 7 km ne se
 *     décident pas pareil
 *   - au-delà        → au kilomètre entier
 *
 * Renvoie `null` quand la distance est inconnue : l'écran n'affiche alors
 * rien du tout, plutôt qu'un tiret qui ferait croire à une panne.
 */
export function libelleDistance(km) {
  if (km === null || km === undefined || Number.isNaN(Number(km))) return null;
  const d = Number(km);
  if (d < 1) return 'dans votre commune';
  if (d < 10) {
    const arrondi = Math.round(d * 2) / 2;
    return `à ${String(arrondi).replace('.', ',')} km`;
  }
  return `à ${Math.round(d)} km`;
}

/* ==========================================================================
 *  RETROUVER LES COORDONNÉES D'UNE VILLE DÉJÀ ÉCRITE
 * ==========================================================================
 *
 * POURQUOI CECI EXISTE — relevé le 04/10/2026, sur la vraie base :
 *
 *   annonces_pro      : 0 ligne sur 4 avec des coordonnées
 *   fiches pro        : 1 sur 7  (celle du propriétaire)
 *
 * Les colonnes existent, l'API les envoie, le calcul de distance est écrit
 * et la liste est censée être triée par proximité. Presque rien ne les
 * remplit. C'est la troisième fois que ce projet rencontre cette famille de
 * défaut — et ici elle était silencieuse des deux côtés : aucune erreur à
 * l'écriture, et à la lecture `distanceKm` rend simplement `null`, donc
 * aucune distance ne s'affiche et le tri ne trie rien.
 *
 * LA CAUSE : `ChampVille` ne rend les coordonnées QUE si l'on touche une
 * suggestion. Taper sa ville à la main renvoie `{ affichage }` tout court —
 * et c'est volontaire, une suggestion qui n'arrive pas ne doit jamais
 * bloquer quelqu'un. Pire, dans le formulaire d'annonce le champ est
 * PRÉ-REMPLI depuis le profil : personne ne le touche, donc personne ne
 * choisit de suggestion, donc aucune annonce n'a jamais eu de coordonnées.
 *
 * LA PARADE : on complète AU MOMENT D'ENREGISTRER, là où il y a déjà une
 * attente visible et un contexte asynchrone. Pas dans le champ : compléter
 * en arrière-plan pendant la frappe ferait bouger la valeur du parent sans
 * que personne ne l'ait demandé.
 */

/**
 * « Lambesc (13) » → `{ nom: 'Lambesc', departement: '13' }`.
 *
 * LE NUMÉRO ENTRE PARENTHÈSES N'EST PAS DÉCORATIF : il départage. Il y a
 * une Sainte-Marie dans quinze départements, et prendre la première réponse
 * venue placerait un artisan à six cents kilomètres de chez lui — une
 * erreur qui ne lèverait aucune alerte et qui se verrait seulement le jour
 * où quelqu'un filtrerait par distance.
 */
export function decouperAffichage(texte) {
  const brut = String(texte || '').trim();
  const m = brut.match(/^(.*?)\s*\((\d{2,3}|2[AB])\)\s*$/i);
  return m
    ? { nom: m[1].trim(), departement: m[2].toUpperCase() }
    : { nom: brut, departement: null };
}

/**
 * LA CORSE N'A PAS DE NUMÉRO DE DÉPARTEMENT DANS SON CODE POSTAL.
 *
 * La Corse-du-Sud est le département « 2A », et ses codes postaux
 * commencent par **20**. Comparer « 2A » au début de « 20000 » échoue, donc
 * un artisan d'Ajaccio ne serait jamais reconnu — et la fonction rendrait
 * simplement le lieu sans coordonnées, en silence. Deux lignes, et le cas
 * est traité pour de bon.
 */
function prefixePostal(departement) {
  if (!departement) return null;
  return /^2[AB]$/.test(departement) ? '20' : departement;
}

/**
 * Complète un lieu avec ses coordonnées, si elles manquent.
 *
 * Trois règles, et chacune a sa raison :
 *
 *   1. **un lieu qui a déjà des coordonnées n'est pas retouché.** Elles
 *      viennent d'une suggestion choisie, donc d'un point précis ; les
 *      remplacer par le centre de la commune serait une perte ;
 *   2. **on ne devine jamais la commune.** Si l'API ne répond pas, ou ne
 *      propose rien dans le bon département, on rend le lieu tel quel. Une
 *      annonce sans coordonnées est gênante ; une annonce placée dans la
 *      mauvaise ville est pire, et personne ne s'en apercevrait ;
 *   3. **l'échec ne bloque RIEN.** Un réseau coupé ne doit pas empêcher de
 *      publier — la même règle que le vibreur de `retour.js`. La ligne
 *      part sans coordonnées, et le prochain enregistrement la complétera.
 *
 * Et le niveau reste la COMMUNE, jamais l'adresse : c'est la règle posée
 * avec la carte le 30/09. Beaucoup d'artisans déclarent l'adresse de leur
 * maison ; une distance calculée depuis le centre de leur ville ne la
 * trahit pas.
 */
export async function completerLieu(lieu) {
  if (!lieu) return lieu;
  if (typeof lieu.latitude === 'number' && typeof lieu.longitude === 'number') return lieu;

  const { nom, departement } = decouperAffichage(lieu.affichage || lieu.ville);
  if (nom.length < 3) return lieu;

  const resultats = await chercher(nom, { type: 'municipality', limite: 6 });
  if (!resultats.length) return lieu;

  const prefixe = prefixePostal(departement);
  const trouve = prefixe
    ? resultats.find((r) => (r.codePostal || '').startsWith(prefixe))
    : resultats[0];
  if (!trouve) return lieu;

  return {
    ...lieu,
    codePostal: lieu.codePostal || trouve.codePostal || null,
    codeInsee: lieu.codeInsee || trouve.codeInsee || null,
    latitude: trouve.latitude,
    longitude: trouve.longitude,
  };
}

/**
 * CE POINT EST-IL DANS LE SECTEUR CHERCHÉ ?
 *
 * Demandé par le propriétaire le 04/10/2026 :
 *
 *   « Quand il y aura beaucoup de monde de toute la France, une annonce de
 *     bétonnière n'intéressera pas quelqu'un de Marseille alors que la
 *     bétonnière est à Paris. »
 *
 * UNE ANNONCE SANS COORDONNÉES NE CHEVAUCHE PAS TOUT, contrairement à une
 * annonce sans dates. Les deux cas se ressemblent et n'ont rien à voir :
 *
 *   - « pas de dates » veut dire **disponible n'importe quand**. Une
 *     bétonnière à vendre l'est vraiment ;
 *   - « pas de coordonnées » veut dire **on ne sait pas où**. Prétendre
 *     qu'elle est à 10 km serait inventer.
 *
 * Elle est donc écartée — et l'écran le DIT, au lieu de la faire
 * disparaître en silence. Un filtrage incomplet ne doit pas ressembler à un
 * filtrage fait : c'est la leçon du ménage de compte des pièces jointes.
 */
export function dansSecteur(latitude, longitude, secteur) {
  if (!secteur || !secteur.rayonKm) return true;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (typeof secteur.latitude !== 'number' || typeof secteur.longitude !== 'number') return true;
  return distanceKm(secteur.latitude, secteur.longitude, latitude, longitude) <= secteur.rayonKm;
}

/** Les rayons proposés. Au-delà de 200 km, on ne se déplace plus : on vend. */
export const RAYONS_KM = [25, 50, 100, 200];
