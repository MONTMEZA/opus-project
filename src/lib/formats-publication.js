/**
 * CE QU'UNE PUBLICATION MONTRE — du calcul pur, et rien d'autre.
 *
 * POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'IMPORTE RIEN
 * ---------------------------------------------------------
 * Septième application de la leçon de `cloudinary-adresses.js` : un calcul
 * rangé dans un composant ou dans un écran ne peut pas être FAIT TOURNER
 * par un contrôle, parce que `node` ne sait pas ouvrir React Native.
 *
 * Mais surtout, ces deux listes vivaient dans `src/screens/CreerScreen.js`,
 * et `OpusApp`, `PostCard` et le bloc des conseils devaient donc importer
 * un ÉCRAN pour savoir ce qu'est un format. Chacun a fini par se faire sa
 * propre idée — et c'est exactement comme ça qu'on obtient deux vérités
 * pour une seule question.
 *
 * LE DÉFAUT QUI A FAIT NAÎTRE CE FICHIER — 05/10/2026
 * ---------------------------------------------------
 * Trouvé en publiant pour de vrai, pas en relisant. Un conseil au format
 * « Texte » publié sur la VRAIE base s'affichait avec une vignette grise et
 * une pastille « agrandir », comme s'il portait une photo.
 *
 * La cause : `OpusApp` écrivait
 *
 *     const couverture = envoyes[0] || POST_GRADIENTS[0];
 *
 * — autrement dit, faute de fichier, un DÉGRADÉ de démonstration. Une
 * publication sans image en recevait donc une fausse, rangée en base pour
 * toujours, et tout ce qui lisait `media` concluait « il y a un visuel ».
 *
 * En mode démonstration le défaut n'existait pas : les conseils d'exemple
 * portent `media: null`, écrit à la main. L'écran était donc juste là où je
 * l'avais regardé, et faux là où le propriétaire l'aurait vu.
 *
 * > **Le FORMAT décide, pas le contenu du champ `media`.** Un dégradé est
 * > une image pour le fil (toutes les publications de démonstration en
 * > portent), donc on ne peut pas trancher sur « est-ce un vrai fichier ».
 * > On tranche sur ce que l'artisan a CHOISI de publier.
 */

/** Les formats qui produisent une image ou une vidéo, donc bons pour le portfolio. */
export const FORMATS_VISUELS = new Set(['photo', 'video', 'montage', 'avantapres']);

/** Ceux qui alimentent le fil « Vidéos ». */
export const FORMATS_VIDEO = new Set(['video', 'montage']);

/**
 * Les formats qui n'ont RIEN à montrer.
 *
 * `conseil` y est, et il le faut : c'était un format jusqu'au 05/10/2026
 * (section 34 de schema.sql), et des lignes anciennes peuvent le porter. Il
 * n'avait pas d'image non plus.
 */
export const FORMATS_SANS_VISUEL = new Set(['texte', 'conseil']);

/**
 * Cette publication montre-t-elle quelque chose ?
 *
 * Un format inconnu — une version plus récente de l'application, une ligne
 * posée à la main — est supposé en porter un : afficher le cadre d'une image
 * qui manque est un défaut visible, cacher une image qui existe en est un
 * qu'on ne remarque jamais.
 */
export function porteUnVisuel(format) {
  return !FORMATS_SANS_VISUEL.has(format);
}
