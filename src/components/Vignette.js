/**
 * UNE VIGNETTE : l'image fixe d'un média, jamais un lecteur vidéo.
 *
 * POURQUOI ELLE EXISTE (17/10/2026)
 * ---------------------------------
 * Cinq endroits montrent une réalisation en petit — la grille du
 * portfolio, sa gestion, la bande des chantiers, les conseils et « Mes
 * publications ». Tous passaient par `apercuDe()`, qui rend l'image de la
 * 2e seconde d'une vidéo… quand elle est chez Cloudinary. Une vidéo rangée
 * chez Supabase n'a pas d'image à extraire : `apercuDe()` rend la vidéo
 * elle-même, et `Media` créait alors UN LECTEUR PAR CASE — un
 * AVPlayerViewController sur le fil principal, et le fichier entier
 * téléchargé, pour un carré de 130 px qui ne joue jamais.
 *
 * Mesuré sur la vraie base le 17/10 : 2 vidéos de portfolio sur 58 médias
 * sont dans ce cas. Rare, donc invisible — et c'est exactement pour ça que
 * la règle vit ici, une fois, et non dans cinq écrans.
 *
 * LE MÉCANISME : le compteur d'arrêts de `Media`, figé. Une vidéo arme son
 * lecteur quand ce compteur a bougé depuis son montage ; un compteur qui ne
 * bouge JAMAIS ne l'arme jamais. La case montre alors un fond sombre et le
 * triangle de lecture : on voit que c'est une vidéo, on l'ouvre en grand
 * pour la regarder.
 */
import React from 'react';
import Media from './Media';
import { apercuDe } from '../lib/cloudinary';
import { estVideo } from '../lib/types-media';

/** Un compteur d'arrêts qui ne bouge jamais : le lecteur ne naît pas. */
const JAMAIS = 0;

export default function Vignette({ media, style, children }) {
  const image = apercuDe(media);
  return (
    <Media media={image} style={style} repos={estVideo(image) ? JAMAIS : undefined}>
      {children}
    </Media>
  );
}
