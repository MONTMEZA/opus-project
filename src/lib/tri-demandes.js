/**
 * L'ORDRE DES DEMANDES OUVERTES, côté professionnel (page « Demandes »).
 *
 * DÉCIDÉ PAR LE PROPRIÉTAIRE LE 26/10/2026 : la pastille « Les plus
 * proches » trie VRAIMENT par distance. Avant, la distance ne venait qu'en
 * TROISIÈME critère, après « c'est un de mes métiers » et l'urgence : la
 * pastille allumée laissait donc un chantier à 80 km devant un autre à 3 km
 * dès qu'il était un peu plus pressé. On lisait « Les plus proches », et ce
 * n'étaient pas les plus proches. Relevé au tournage des vidéos.
 *
 * Les deux ordres, désormais :
 *   - pastille ALLUMÉE : la distance d'abord ; à distance LUE égale, mes
 *     métiers, puis l'urgence, puis la plus proche au dixième ;
 *   - pastille ÉTEINTE : mes métiers d'abord, puis l'urgence — l'ordre dans
 *     lequel on décide quand la route ne compte pas.
 *
 * « À DISTANCE LUE ÉGALE » — relecture du 26/10/2026. Deux cartes qui
 * affichent toutes les deux « à 12 km » sont à la même distance pour celui
 * qui les lit. Comparées au dixième (12,0 contre 12,4), elles laissaient un
 * chantier tranquille d'un autre métier devant une urgence du mien, et la
 * règle avait l'air de ne pas s'appliquer. La distance se compare donc au
 * palier AFFICHÉ (`distanceLue`, `adresse.js`, la même règle que le
 * libellé) ; le dixième ne départage qu'en dernier.
 *
 * UNE DEMANDE SANS DISTANCE va À LA FIN quand on trie par distance. On ne
 * sait pas où elle est (pas de coordonnées, ou les miennes manquent) :
 * la placer en tête serait affirmer qu'elle est proche. Entre elles, elles
 * gardent l'ordre de la pastille éteinte.
 *
 * Et une demande ne change jamais de place sans raison : à critères égaux,
 * l'ordre reçu (le plus récent d'abord) est gardé — le tri est STABLE,
 * c'est ce qu'exige le langage depuis 2019, Hermes compris.
 *
 * POURQUOI UN FICHIER À PART, qui n'importe que `adresse.js` (qui n'importe
 * rien) : la leçon de `cloudinary-adresses.js`. Le comparateur vivait dans
 * l'écran, où rien ne pouvait le faire tourner — et il avait un second
 * défaut, invisible à l'œil : il rendait « égal » dès qu'UNE des deux
 * distances manquait, ce qui n'est pas un ordre (A = B, B = C, mais A ≠ C),
 * et le moteur range alors comme il peut.
 *
 * ET LES RÈGLES QUE L'ÉCRAN LUI PASSE vivent ICI aussi (`reglesDuTri`,
 * `distanceDe`, `estPlace`) — relecture du 26/10/2026 : elles vivaient dans
 * l'écran, et trois sabotages sur quatre (« mes métiers » mort, l'urgence à
 * l'envers, ma ville toujours « placée ») passaient tous les contrôles.
 * `verifier-demandes` les fait tourner.
 */

import { distanceKm, distanceLue } from './adresse.js';

/** Un lieu est placé s'il porte une latitude ET une longitude, en nombres. */
export function estPlace(lieu) {
  return !!lieu
    && typeof lieu.latitude === 'number' && Number.isFinite(lieu.latitude)
    && typeof lieu.longitude === 'number' && Number.isFinite(lieu.longitude);
}

/** La distance entre ma fiche et une demande, en km — `null` si l'une des deux n'est pas placée. */
export function distanceDe(moi, demande) {
  if (!estPlace(moi) || !estPlace(demande)) return null;
  return distanceKm(moi.latitude, moi.longitude, demande.latitude, demande.longitude);
}

/**
 * Les deux règles de départage, telles que l'écran les applique.
 *
 * `pourMoi` : un de MES métiers — et seulement pour un professionnel.
 * `rangUrgence` : la place de l'urgence dans `clesUrgence` (la liste
 * `URGENCES` de `annonces.js`, de la moins à la plus pressée). Une urgence
 * absente ou inconnue vaut la PREMIÈRE, comme à l'écran (`urgenceDe()`
 * affiche « Pas pressé ») : elle ne se range pas plus bas que ce qu'elle
 * affiche.
 *
 * @param {{ estPro: boolean, mesMetiers: string[], clesUrgence: string[] }} etat
 */
export function reglesDuTri({ estPro, mesMetiers, clesUrgence }) {
  const metiers = mesMetiers || [];
  const cles = clesUrgence || [];
  return {
    pourMoi: (d) => !!estPro && metiers.includes(d.metier),
    rangUrgence: (d) => Math.max(0, cles.indexOf(d.urgence)),
  };
}

const sansDistance = (d) => typeof d.km !== 'number' || Number.isNaN(d.km);

/**
 * @param {Array<{ km: number|null }>} demandes  déjà filtrées, distance calculée
 * @param {{ parDistance: boolean, pourMoi: (d) => boolean, rangUrgence: (d) => number }} regles
 * @returns {Array} une NOUVELLE liste (celle reçue n'est pas touchée)
 */
export function trierDemandesOuvertes(demandes, { parDistance, pourMoi, rangUrgence }) {
  const parMetierPuisUrgence = (a, b) => {
    const mien = Number(!!pourMoi(b)) - Number(!!pourMoi(a));
    if (mien !== 0) return mien;
    return rangUrgence(b) - rangUrgence(a);
  };

  return [...(demandes || [])].sort((a, b) => {
    if (parDistance) {
      const manqueA = sansDistance(a);
      const manqueB = sansDistance(b);
      if (manqueA !== manqueB) return manqueA ? 1 : -1;
      if (!manqueA) {
        const lueA = distanceLue(a.km);
        const lueB = distanceLue(b.km);
        if (lueA !== lueB) return lueA - lueB;
        const autres = parMetierPuisUrgence(a, b);
        if (autres !== 0) return autres;
        return a.km - b.km;
      }
    }
    return parMetierPuisUrgence(a, b);
  });
}

/**
 * CE QUE LE TRI PAR DISTANCE N'A PAS PU FAIRE, dit en une phrase — ou `null`.
 *
 * Un tri incomplet ne doit pas ressembler à un tri fait : c'est la règle des
 * « 3 annonces sans lieu précisé » de la Place des pros. La pastille dit
 * « Les plus proches » ; si ma propre fiche n'a pas de coordonnées, AUCUNE
 * distance ne se calcule et la liste garde l'autre ordre sans que rien ne le
 * signale. Des demandes non placées partent à la fin : on le dit, sinon on
 * croit qu'elles sont les plus lointaines. Et quand AUCUNE ne l'est, il n'y a
 * pas de « fin de liste » : la liste entière est dans l'autre ordre, et on
 * le dit (relecture du 26/10/2026).
 *
 * « Pas placée sur la carte », et non « sans lieu » : la carte d'une demande
 * affiche sa VILLE, c'est sa position qui manque.
 *
 * @param {{ parDistance: boolean, moiLocalise: boolean, demandes: Array<{ km: number|null }> }} etat
 */
export function phraseDuTriParDistance({ parDistance, moiLocalise, demandes }) {
  const liste = demandes || [];
  if (!parDistance || liste.length === 0) return null;
  if (!moiLocalise) {
    return 'Votre ville n’est pas placée sur la carte\u00a0: le tri par distance ne peut pas se faire. Précisez-la dans «\u00a0Modifier mon profil\u00a0».';
  }
  const sans = liste.filter(sansDistance).length;
  if (sans === 0) return null;
  if (sans === liste.length) {
    return sans === 1
      ? 'Cette demande n’est pas placée sur la carte\u00a0: sa distance ne se calcule pas.'
      : 'Aucune de ces demandes n’est placée sur la carte\u00a0: elles sont rangées par métier, puis par urgence.';
  }
  return sans === 1
    ? '1 demande n’est pas placée sur la carte\u00a0: elle est en fin de liste.'
    : `${sans} demandes ne sont pas placées sur la carte\u00a0: elles sont en fin de liste.`;
}
