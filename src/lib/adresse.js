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

/**
 * Met en forme un résultat brut de l'API.
 *
 * EXPORTÉE POUR ÊTRE ÉPROUVÉE. `verifier-adresse` la fait tourner sur des
 * réponses RÉELLES relevées le 11/10/2026 — une par type —, en plus
 * d'appeler la vraie API. Les deux sont nécessaires : l'appel réel attrape
 * un paramètre que l'API refuse, le jeu figé attrape un `properties.type`
 * qu'on aurait mal interprété, et il tourne même quand le mandataire du
 * conteneur coupe la connexion.
 *
 * LES QUATRE TYPES, et non trois : `housenumber`, `street`, `municipality`
 * et **`locality`** — un lieu-dit, qui est un cas fréquent en zone rurale,
 * donc chez les clients d'un artisan. Mesuré : `q=paris` rend un `locality`
 * nommé « Paris » dans la commune de Gonfaron (83590).
 */
export function formater(feature) {
  const p = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;
  // context = "13, Bouches-du-Rhône, Provence-Alpes-Côte d'Azur"
  const morceaux = (p.context || '').split(',').map((x) => x.trim());
  return {
    id: p.id,
    label: p.label,                       // "Marseille" ou "12 rue X, 13001 Marseille"
    /** `housenumber` · `street` · `locality` · `municipality` */
    genre: p.type || null,
    /**
     * LA LIGNE DE RUE, ET SEULEMENT SI C'EN EST UNE.
     *
     * `properties.name` ne veut pas dire la même chose selon le type, et
     * c'est le piège naturel de ce champ : pour un `housenumber` il vaut
     * « 4 Rue des Acacias » — exactement ce qu'on veut sur une facture —,
     * mais pour une `municipality` il vaut le NOM DE LA COMMUNE. Le poser
     * sans regarder le type écrirait « Charleval » dans un champ « rue ».
     */
    rue: (p.type === 'housenumber' || p.type === 'street') ? p.name : null,
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

/**
 * UNE COMMUNE N'EST PAS UNE LIGNE D'ADRESSE — et son code postal est un
 * mensonge.
 *
 * Mesuré le 11/10/2026 : le code postal d'un résultat `municipality` est UN
 * code parmi plusieurs, **le plus petit**. Paris rend 75001, Marseille
 * 13001, Lyon 69001. Remplir le champ « code postal » d'un client depuis un
 * résultat de commune donnerait donc 75001 à tous les Parisiens — une
 * valeur parfaitement formée, jamais signalée, et fausse sur chaque
 * facture. Le vrai code postal ne s'obtient que d'un numéro ou d'une rue
 * (`q=10 rue de la paix paris` rend bien 75002).
 *
 * Deux autres pièges tombent avec celui-là : les ARRONDISSEMENTS remontent
 * comme des communes (`q=lyon&type=municipality` rend une « municipality »
 * dont la ville est « Lyon 3e Arrondissement »), et un `locality` est un
 * lieu-dit dont le nom n'a aucun rapport avec sa commune.
 *
 * MAIS CE FILTRE NE S'APPLIQUE QU'AU PSEUDO-TYPE `'rue'`, ET JAMAIS À
 * `'address'`. Posé sur les deux, il aurait cassé en silence la chose la
 * plus urgente du projet : l'écran SOS passe `type="address"` et envoie
 * `lieu.latitude` / `lieu.longitude` DIRECTEMENT à la recherche d'artisans
 * disponibles. Ce chemin n'appelle pas `completerLieu()` — vérifié —, donc
 * les coordonnées ne viennent QUE de la suggestion choisie. Écarter les
 * communes y aurait laissé quelqu'un taper « Charleval » sans aucune
 * suggestion, donc sans coordonnées, donc avec une liste d'artisans vide
 * et pas la moindre erreur à l'écran. Une fuite d'eau à minuit.
 */
export function estUneAdresse(lieu) {
  return !!lieu && (lieu.genre === 'housenumber' || lieu.genre === 'street');
}

/** Un code INSEE de commune : cinq caractères, « 2A » et « 2B » compris pour la Corse. */
function estUnCodeInsee(code) {
  return !!code && /^[0-9][0-9AB][0-9]{3}$/i.test(String(code));
}

/** `__DEV__` n'existe que dans React Native ; ailleurs (tests, Node) il est absent. */
function enDeveloppement() {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

/**
 * Cherche des villes (`type: 'municipality'`) ou des adresses complètes
 * (`type: 'address'`).
 *
 * `'address'` N'EST PAS UN TYPE DE L'API : c'est un mot de ce projet. Il
 * veut dire deux choses, et la seconde a été apprise le 11/10/2026 en
 * mesurant les réponses réelles :
 *
 *   1. on n'envoie AUCUN paramètre `type`, donc l'API fait une recherche
 *      libre (en envoyer un qu'elle ne connaît pas rend un HTTP 400, et
 *      plus aucune suggestion — c'est pour ça que ce contrôle existe) ;
 *   2. on garde TOUT ce qui situe un lieu — un numéro, une rue, un
 *      lieu-dit, une commune. C'est ce que veut l'écran SOS : ce qui
 *      compte, à minuit, c'est d'avoir un point sur la carte.
 *
 * ET UN TROISIÈME, `'rue'`, qui est celui d'une LIGNE D'ADRESSE POSTALE —
 * la facturation d'un client. Même recherche libre, mais on n'y garde
 * qu'un numéro ou une rue (voir `estUneAdresse`) : une commune n'est pas
 * une ligne d'adresse, et son code postal est le plus petit de la commune.
 *
 * Une recherche libre mélange les quatre types dans une seule liste, triés
 * par score et par rien d'autre : `q=charleval` rend en PREMIER une rue
 * nommée « Charleval », et la commune cherchée seulement en deuxième.
 *
 * ET LE PIÈGE QUI DÉCIDE DE TOUT CE QUI S'EN SERT : **la Base Adresse
 * Nationale ne répond JAMAIS « introuvable ». Elle rend une AUTRE
 * adresse.** Il n'existe aucune « rue des Lilas » à Charleval ;
 * `q=4 rue des lilas charleval` rend « 4 Rue des Acacias 13350 Charleval »,
 * parfaitement formée, sans erreur, sans le moindre signal. Le seul
 * indicateur est `properties.score` : la MÊME ligne vaut 0,954 quand la
 * requête correspond et 0,590 quand c'est un repli.
 *
 * > **Conséquence tenue par l'écran, pas par cette fonction : on ne
 * > remplit JAMAIS un champ depuis `resultats[0]`.** Une suggestion se
 * > CHOISIT, et elle s'affiche en entier — « 4 Rue des Acacias 13350
 * > Charleval » se lit, et on voit que ce n'est pas ce qu'on a tapé.
 * > Le jour où quelque chose remplira tout seul, il faudra un seuil de
 * > score, et le dire quand il n'est pas atteint.
 *
 * Renvoie [] plutôt que de lever une erreur : une suggestion qui n'arrive
 * pas ne doit jamais empêcher quelqu'un de taper sa ville à la main. Mais en
 * développement, on écrit la raison dans la console, sans quoi une requête
 * mal formée passe inaperçue.
 */
export async function chercher(texte, { type = 'municipality', limite = 6, citycode = null } = {}) {
  const q = (texte || '').trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({ q, limit: String(limite) });
  if (TYPES_VALIDES.includes(type)) params.set('type', type);
  /* `citycode` : le code INSEE de la commune, un FILTRE de l'API. Il ne
     sert que quand on le connaît déjà — c'est le cas d'une commune lue au
     répertoire Sirene (voir `completerLieu`). Cinq caractères, « 2A » et
     « 2B » compris ; tout le reste est ignoré plutôt qu'envoyé. */
  if (estUnCodeInsee(citycode)) params.set('citycode', String(citycode).toUpperCase());

  try {
    const reponse = await fetch(`${BASE}?${params.toString()}`);
    if (!reponse.ok) {
      if (enDeveloppement()) {
        console.warn(`[adresse] L'API a répondu ${reponse.status} pour « ${q} »`);
      }
      return [];
    }
    const data = await reponse.json();
    const liste = (data.features || []).map(formater);
    /* Aucun résultat n'est PAS une erreur : une requête fantaisiste rend un
       HTTP 200 avec `features: []`. Ce qui compte, c'est ce qu'on en garde. */
    return type === 'rue' ? liste.filter(estUneAdresse) : liste;
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

  /* LE CODE INSEE, QUAND ON LE CONNAÎT, DÉPARTAGE MIEUX QUE TOUT — 15/10/2026.
     L'inscription pro préremplit la ville depuis le répertoire Sirene, qui
     donne le code INSEE de la commune : il n'y a alors plus rien à deviner,
     pas même entre deux Sainte-Marie du même département. On demande à
     l'API de filtrer sur ce code, et on n'accepte qu'un résultat qui le
     porte. Une réponse sans lui retombe sur la règle du département —
     jamais sur le premier résultat venu. */
  if (estUnCodeInsee(lieu.codeInsee)) {
    const exacts = await chercher(nom, { type: 'municipality', limite: 6, citycode: lieu.codeInsee });
    const exact = exacts.find((r) => String(r.codeInsee || '').toUpperCase()
      === String(lieu.codeInsee).toUpperCase());
    if (exact) {
      return {
        ...lieu,
        codePostal: lieu.codePostal || exact.codePostal || null,
        codeInsee: exact.codeInsee,
        latitude: exact.latitude,
        longitude: exact.longitude,
      };
    }
  }

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
/* UNE SEULE ÉCHELLE DE RAYONS, pour la Place des pros ET pour le fil.
   Deux listes séparées finiraient par diverger — c'est exactement ce qui
   excluait les montages du fil vidéo, et ce qui a désaligné les voyants le
   04/10. 10 et 20 km sont entrés le 05/10 avec la loupe du fil : le
   propriétaire a demandé « maçon à 20 km », et 25 était le plus petit. */
export const RAYONS_KM = [10, 20, 50, 100, 200];
