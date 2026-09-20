/**
 * Un seul endroit pour répondre à « quels métiers fait cet artisan ? ».
 *
 * La question se pose partout : la recherche, le tri des demandes, le
 * badge du profil, les publications. Si chaque écran y répond à sa façon,
 * les réponses finissent par diverger — c'est exactement ce qui était
 * arrivé avec « qu'est-ce qui compte comme vidéo », où deux listes
 * distinctes faisaient disparaître les montages du fil vidéo.
 */

/** Les métiers d'un artisan, principal en tête. Toujours un tableau. */
export function metiersDe(pro) {
  if (!pro) return [];
  if (Array.isArray(pro.metiers) && pro.metiers.length) return pro.metiers;
  return pro.metier ? [pro.metier] : [];
}

/** Le métier principal : celui qui s'affiche sur les publications. */
export function metierPrincipal(pro) {
  return metiersDe(pro)[0] || '';
}

/** Cet artisan exerce-t-il ce métier ? */
export function exerce(pro, metier) {
  if (!metier) return true;
  return metiersDe(pro).includes(metier);
}

/**
 * Ce qu'on affiche sous le nom : « Plombier · Chauffagiste ».
 * Au-delà de deux, on abrège — une ligne de quatre métiers ne se lit plus
 * et pousse le reste de la carte hors de l'écran.
 */
export function libelleMetiers(pro, { max = 2 } = {}) {
  const liste = metiersDe(pro);
  if (liste.length <= max) return liste.join(' · ');
  return `${liste.slice(0, max).join(' · ')} +${liste.length - max}`;
}
