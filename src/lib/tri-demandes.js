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
 *   - pastille ALLUMÉE : la distance d'abord, sans exception ; à distance
 *     égale, mes métiers, puis l'urgence ;
 *   - pastille ÉTEINTE : mes métiers d'abord, puis l'urgence — l'ordre dans
 *     lequel on décide quand la route ne compte pas.
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
 * POURQUOI UN FICHIER À PART, qui n'importe rien : la leçon de
 * `cloudinary-adresses.js`. Le comparateur vivait dans l'écran, où rien ne
 * pouvait le faire tourner — et il avait un second défaut, invisible à
 * l'œil : il rendait « égal » dès qu'UNE des deux distances manquait, ce qui
 * n'est pas un ordre (A = B, B = C, mais A ≠ C), et le moteur range alors
 * comme il peut. `verifier-demandes` le fait tourner.
 */

/**
 * @param {Array<{ km: number|null }>} demandes  déjà filtrées, distance calculée
 * @param {{ parDistance: boolean, pourMoi: (d) => boolean, rangUrgence: (d) => number }} regles
 * @returns {Array} une NOUVELLE liste (celle reçue n'est pas touchée)
 */
export function trierDemandesOuvertes(demandes, { parDistance, pourMoi, rangUrgence }) {
  const sansDistance = (d) => typeof d.km !== 'number' || Number.isNaN(d.km);

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
      if (!manqueA && a.km !== b.km) return a.km - b.km;
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
 * signale. Et des demandes sans lieu précis partent à la fin : on le dit,
 * sinon on croit qu'elles sont les plus lointaines.
 *
 * @param {{ parDistance: boolean, moiLocalise: boolean, demandes: Array<{ km: number|null }> }} etat
 */
export function phraseDuTriParDistance({ parDistance, moiLocalise, demandes }) {
  const liste = demandes || [];
  if (!parDistance || liste.length === 0) return null;
  if (!moiLocalise) {
    return 'Votre ville n’est pas placée sur la carte : le tri par distance ne peut pas se faire. Précisez-la dans « Modifier mon profil ».';
  }
  const sans = liste.filter((d) => typeof d.km !== 'number' || Number.isNaN(d.km)).length;
  if (sans === 0) return null;
  return sans === 1
    ? '1 demande sans lieu précis est en fin de liste.'
    : `${sans} demandes sans lieu précis sont en fin de liste.`;
}
