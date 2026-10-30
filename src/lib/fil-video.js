/**
 * LE FIL DES VIDÉOS — ce qu'il montre, et où il s'ouvre (lot S-c, 30/10/2026).
 *
 * On y entre de deux façons :
 *
 *  - par la pastille « Vidéos », qui redemande le fil à la base
 *    (`fil_filtre(p_videos => true)`) : la page ne contient alors que des
 *    vidéos ;
 *  - en TOUCHANT une vidéo — dans le fil, sur la page d'une publication,
 *    dans « Mes publications », sur l'étape d'un chantier. Rien n'est
 *    rechargé : la liste reçue est la page du fil telle qu'elle est, photos
 *    et publicités comprises.
 *
 * DEUX DÉFAUTS, TROUVÉS PAR LA RELECTURE DU LOT S-c, ET QUE CE FICHIER FERME :
 *
 *  1. Entré par un appui, le plein écran montrait la page ENTIÈRE : des
 *     photos, et des publicités, alors que la CGU (« L'ordre du fil ») dit
 *     que le fil des vidéos retire ce qui ne lui répond pas et que les
 *     publicités n'y apparaissent pas.
 *  2. La vidéo touchée était cherchée dans cette page par
 *     `Math.max(0, findIndex(...))`. Absente — une vidéo plus ancienne que
 *     les vingt publications chargées, ce que « Mes publications » rend
 *     courant depuis qu'elle se lit dans la base —, l'index retombait à 0,
 *     et le plein écran s'ouvrait sur la PREMIÈRE diapositive, une publicité
 *     comprise, en se présentant comme la vidéo touchée.
 *
 * D'où une liste FILTRÉE, et la vidéo touchée posée en tête quand la page ne
 * la contient pas. Elle ne touche pas au fil lui-même ni à son curseur : c'est
 * ce que l'écran MONTRE, pas ce que la base a rendu.
 *
 * Ce fichier n'importe que `formats-publication.js`, qui n'importe rien :
 * `node` l'ouvre, et `verifier-remontee` le FAIT TOURNER.
 */
import { FORMATS_VIDEO } from './formats-publication.js';

/** Ce qui se regarde en plein écran : une vidéo ou un montage, jamais une
 *  publicité. La même liste que celle qui décide vers quel fil renvoyer
 *  après une publication (`FORMATS_VIDEO`) : deux listes divergeraient. */
export function seRegardeEnPleinEcran(post) {
  return !!post && post.type !== 'ad' && FORMATS_VIDEO.has(post.format);
}

/**
 * La liste du plein écran, et la diapositive où l'ouvrir.
 *
 * `cible` est la PUBLICATION touchée (l'objet, pas son identifiant : sans
 * l'objet, on ne pourrait pas la montrer quand la page ne la contient pas),
 * ou `null` quand on est entré par la pastille.
 *
 * Jamais un index qui tombe sur autre chose que la cible : présente, on
 * s'ouvre sur elle ; absente, elle est posée en tête et on s'ouvre sur elle.
 * Une cible qui ne se regarde pas en plein écran (une photo, une publicité)
 * n'est jamais ajoutée : on s'ouvre alors au début de la liste filtrée.
 */
export function filVideo(posts, cible) {
  const liste = (Array.isArray(posts) ? posts : []).filter(seRegardeEnPleinEcran);
  if (!cible || cible.id == null) return { liste, index: 0 };
  const meme = (p) => String(p.id) === String(cible.id);
  const i = liste.findIndex(meme);
  if (i >= 0) return { liste, index: i };
  if (!seRegardeEnPleinEcran(cible)) return { liste, index: 0 };
  return { liste: [cible, ...liste], index: 0 };
}
