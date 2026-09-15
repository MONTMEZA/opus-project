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
