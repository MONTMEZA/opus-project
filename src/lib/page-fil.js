/**
 * UNE PAGE DU FIL, ET LA RÉPONSE À « Y EN A-T-IL D'AUTRES ? »
 *
 * POURQUOI CE FICHIER N'IMPORTE RIEN
 * ----------------------------------
 * La leçon de `cloudinary-adresses.js` : `api.js` charge le client
 * Supabase, donc React Native, et `node` ne sait pas l'ouvrir. Rangé là-bas,
 * ce calcul ne pourrait être que RELU par un contrôle ; ici, `verifier-fil`
 * le FAIT TOURNER.
 *
 * LE DÉFAUT QU'IL CORRIGE — 15/10/2026
 * ------------------------------------
 * On demandait vingt publications, et on concluait « c'est la fin » quand il
 * en revenait MOINS de vingt. Avec exactement vingt publications en base —
 * le cas de la vraie base ce jour-là —, la première page en rendait vingt,
 * donc « pas la fin », donc arriver en bas du fil partait chercher une page
 * VIDE : une requête pour rien, et deux rendus de toute l'application.
 *
 * Il n'y a qu'une façon de savoir s'il en reste sans aller voir : demander
 * UNE DE PLUS que ce qu'on garde. Si elle arrive, il y a une suite ; sinon,
 * c'était la dernière page.
 *
 * LA LIGNE DE TROP N'EST REPRISE QUE SI LE CURSEUR LE PERMET — 17/10/2026
 * ----------------------------------------------------------------------
 * La première version de ce commentaire affirmait qu'elle l'était toujours.
 * C'était faux, et une relecture adverse l'a prouvé sur la forme exacte de la
 * vraie base. La page suivante redemande « ce qui est STRICTEMENT plus ancien
 * que la dernière gardée » (`created_at < p_avant` dans `fil_filtre`). Donc :
 *
 *   - une ligne qui porte la MÊME heure que la dernière gardée n'arrive
 *     jamais — elle n'est pas plus ancienne, elle est à égalité. Relevé sur
 *     la vraie base ce jour-là : deux publications à la même seconde, côte à
 *     côte. On ne coupe donc JAMAIS une page au milieu d'un groupe à égalité :
 *     le groupe entier passe à la page suivante, qui le reprend en entier ;
 *   - une PUBLICITÉ n'avait pas de curseur, et une page qui finissait sur
 *     elle faisait croire au bout du fil (`api.js` lui en donne un désormais).
 *
 * `fil_filtre()` plafonne à 50 lignes (section 33 de `schema.sql`) : vingt
 * et une passent sans rien changer à la base. Un vrai curseur composé
 * (heure + identifiant) demanderait un paramètre de plus, donc une seconde
 * signature de la fonction — ce que la section 34 interdit.
 *
 * LA CLÉ DE TRI N'EST PLUS LA DATE DE PUBLICATION — lot S-c, 30/10/2026
 * --------------------------------------------------------------------
 * Une publication REMISE EN AVANT se range à la date de sa remise en avant
 * (`remonte_le`), sans que sa date de publication (`created_at`) bouge :
 * `fil_filtre()` ordonne par `coalesce(remonte_le, created_at)`. Le curseur
 * et l'égalité se lisent donc sur CETTE clé, `cleDeTri()`. Lue sur
 * `created_at`, une remise en avant qui fermait une page faisait redemander
 * « plus ancien que sa date de PUBLICATION » — d'il y a trois semaines :
 * toutes les publications entre les deux disparaissaient (mesuré : 20 sur
 * 40). Et une égalité lue sur `created_at` coupait une page au mauvais
 * endroit.
 *
 * `decouperPage` reçoit la clé en paramètre : « Mes publications » se trie,
 * elle, par date de PUBLICATION (`created_at`), et lui passe la sienne.
 */

/**
 * La clé de tri d'une ligne de `posts` — la même que l'ordre de
 * `fil_filtre()`. Rend la CHAÎNE telle que la base l'a écrite, jamais
 * repassée par `new Date` : c'est elle qui repart comme `p_avant`, et un
 * aller-retour par l'heure du téléphone pourrait la décaler.
 */
export function cleDeTri(ligne) {
  if (!ligne) return null;
  return ligne.remonte_le || ligne.created_at || null;
}

/**
 * La même question pour la DÉMONSTRATION, dont les publications sont écrites
 * en camelCase (`remonteLe`, `publieLe`) : `cleDeTri` y rendrait `null`
 * partout, et un tri sur des clés nulles garde l'ordre du FICHIER, sans un
 * mot (mesuré, critique du 29/10).
 */
export function cleDemo(p) {
  if (!p) return '';
  return p.remonteLe || p.publieLe || '';
}

/**
 * Le fil de démonstration, dans l'ordre de `fil_filtre()` : la clé de tri
 * d'abord, la plus récente en tête ; puis l'identifiant, en chaîne — ils
 * mêlent des nombres et `'ad1'`. Une seule fonction pour les deux portes
 * (premier chargement, page suivante) : deux tris finiraient par diverger.
 * Ne modifie pas la liste reçue.
 */
export function trierDemo(liste) {
  return (Array.isArray(liste) ? liste.slice() : []).sort((a, b) => {
    const ka = cleDemo(a);
    const kb = cleDemo(b);
    if (ka !== kb) return ka < kb ? 1 : -1;
    const ia = String(a && a.id);
    const ib = String(b && b.id);
    if (ia === ib) return 0;
    return ia < ib ? 1 : -1;
  });
}

/**
 * Coupe ce que la base a rendu — `taille + 1` lignes demandées — en une page
 * de `taille` au plus, et dit si c'était la dernière.
 *
 * Si la ligne de trop est à égalité de CLÉ avec la dernière gardée, on
 * retire de la page tout ce groupe à égalité : la page suivante, qui demande
 * « plus ancien que la dernière GARDÉE », le reprendra en entier. Si la page
 * entière est à la même heure, on la garde telle quelle — c'est le seul cas
 * où une ligne peut encore manquer, et il demanderait vingt publications à la
 * même microseconde.
 */
export function decouperPage(lignes, taille, cle = cleDeTri) {
  const recues = Array.isArray(lignes) ? lignes : [];
  if (recues.length <= taille) return { lignes: recues, fin: true };

  let page = recues.slice(0, taille);
  const limite = cle(recues[taille]);
  if (limite != null && cle(page[page.length - 1]) === limite) {
    const avant = page.filter((l) => cle(l) !== limite);
    if (avant.length > 0) page = avant;
  }
  return { lignes: page, fin: false };
}

/**
 * La même question en mode démonstration, où il n'y a pas de base : on
 * connaît la liste entière, et `depart` est un rang. Rangée ici pour que les
 * deux chemins de démonstration (premier chargement, page suivante) ne
 * puissent pas se mettre à répondre différemment — et pour que le contrôle
 * la fasse tourner aux bords, comme `decouperPage`.
 */
export function finDemo(depart, taille, total) {
  return depart + taille >= total;
}
