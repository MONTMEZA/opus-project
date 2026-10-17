/**
 * QU'EST-CE QU'UNE ADRESSE DE MÉDIA : un dégradé, une image, une vidéo ?
 * Et quelle AFFICHE montrer pour une vidéo qui n'a pas encore son lecteur ?
 *
 * POURQUOI CE FICHIER N'IMPORTE QUE `cloudinary-adresses.js`
 * ----------------------------------------------------------
 * La leçon de `cloudinary-adresses.js`, appliquée une fois de plus : ces
 * deux réponses vivaient dans `Media.js`, qui charge React Native, et `node`
 * ne sait pas l'ouvrir. Un contrôle ne pouvait donc que RELIRE le texte ;
 * ici, `verifier-fil` les FAIT TOURNER.
 *
 * LE DÉFAUT QU'IL CORRIGE — 17/10/2026
 * ------------------------------------
 * `estVideo` répondait « vidéo » à toute adresse contenant `/video/`. Or la
 * vignette d'une vidéo Cloudinary — `apercuDe()` — garde ce chemin :
 *
 *     …/video/upload/so_2,c_fill,…/clip.jpg
 *
 * Une IMAGE, donc, prise pour une vidéo : la grille du portfolio, la bande
 * des chantiers, les conseils et « Mes publications » ouvraient un LECTEUR
 * VIDÉO complet sur un JPEG, qui ne lit rien et laisse une case noire. Le
 * contraire exact de ce que `apercuDe()` promet (« n'ouvre plus six
 * décodeurs vidéo pour ne montrer que six images fixes »). Trouvé en
 * préparant l'affiche des vidéos du fil, en faisant tourner le code.
 *
 * Une extension d'IMAGE l'emporte donc désormais sur le chemin.
 */
import { apercuDe } from './cloudinary-adresses.js';

const EXT_VIDEO = /\.(mp4|mov|m4v|webm)(\?|$)/i;
const EXT_IMAGE = /\.(jpe?g|png|webp|gif|heic|heif|avif)(\?|$)/i;

/** Un dégradé s'écrit « couleur,couleur » ; tout le reste est un fichier. */
export function estFichier(media) {
  return typeof media === 'string'
    && /^(https?:|file:|data:|content:|blob:|assets-library:|ph:)/.test(media);
}

export function estVideo(media) {
  if (!estFichier(media)) return false;
  if (EXT_IMAGE.test(media)) return false;
  return EXT_VIDEO.test(media) || /\/video\//i.test(media);
}

/**
 * L'AFFICHE d'une vidéo : la vraie image que Cloudinary sait en tirer
 * (45 Ko contre 780 Ko pour le clip, mesuré), ou `null` quand il n'y en a
 * pas — une vidéo rangée chez Supabase, que le plan gratuit ne sait pas
 * transformer. `apercuDe()` rend alors l'adresse TELLE QUELLE : la prendre
 * pour une affiche ferait charger le clip entier dans une vue d'image.
 */
export function afficheVideo(url) {
  if (typeof url !== 'string') return null;
  const a = apercuDe(url);
  return typeof a === 'string' && a !== url && EXT_IMAGE.test(a) ? a : null;
}
