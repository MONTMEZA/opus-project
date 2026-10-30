/**
 * UNE LIGNE DE `posts` DEVIENT UNE PUBLICATION DE L'APPLICATION
 *
 * POURQUOI CE FICHIER EXISTE — lot S-c, 30/10/2026
 * ------------------------------------------------
 * `rowToPost` vivait dans `api.js`, qui charge le client Supabase, donc
 * React Native : `node` ne sait pas l'ouvrir, et un contrôle ne pouvait que
 * RELIRE ce qu'elle fait. Or la remise en avant lui a donné trois dates qui
 * ne servent pas à la même chose, et confondre deux d'entre elles ne lève
 * aucune erreur :
 *
 *   - `time` — l'ancienneté AFFICHÉE sur la carte : la date de PUBLICATION
 *     (`created_at`). Une publication remise en avant reste « Il y a 3 sem. »
 *     et porte « Remise en avant » (décision du propriétaire du 29/10) ;
 *   - `publieLe` — la date de publication elle-même, que le récit d'un
 *     chantier raconte (`recit.js`). Il lisait le CURSEUR faute de mieux :
 *     une étape remise en avant aurait été datée du jour de sa remise
 *     (mesuré, critique du 29/10) — un texte public faux ;
 *   - `curseur` — la clé de pagination, `cleDeTri()` : la date de remise en
 *     avant si elle existe, sinon la date de publication. Ce n'est PAS une
 *     date à afficher ni à raconter.
 *
 * Ici, `verifier-fil` et `verifier-recit` la FONT TOURNER. Ce fichier
 * n'importe que des fichiers qui n'importent rien.
 */
import { relativeTime } from './formats.js';
import { cleDeTri } from './page-fil.js';

/**
 * Une ligne de la table `posts` devient une publication de l'application.
 *
 * `commentaires` vaut `null` quand ils n'ont PAS été chargés — ce qui est
 * désormais le cas normal, on ne les charge qu'à l'ouverture. Le nombre
 * affiché vient alors de `comments_count`, tenu par un trigger côté base.
 * Distinguer `null` (pas chargés) de `[]` (chargés, aucun) est ce qui permet
 * à l'écran de savoir s'il faut aller les chercher.
 */
export function rowToPost(p, likedSet, commentaires = null) {
  const aimes = likedSet || new Set();
  if (p.is_ad) {
    return {
      id: p.id, type: 'ad', annonceur: p.annonceur, accroche: p.accroche,
      cta: p.cta, media: p.media,
      /* UNE PUBLICITÉ A AUSSI UN CURSEUR (17/10/2026). Sans lui, une page
         qui finissait sur une publicité faisait croire au bout du fil :
         `chargerPlusDeFil` ne savait pas d'où repartir, et posait
         « fin ». Relevé sur la vraie base : les deux publicités aux rangs
         16 et 17 — trois publications de plus, et elles fermaient la
         première page. */
      curseur: cleDeTri(p),
    };
  }
  return {
    id: p.id, type: 'post', proId: p.author_id,
    /* L'ANCIENNETÉ AFFICHÉE est celle de la PUBLICATION, jamais celle de la
       remise en avant : une publication de trois semaines ne se fait pas
       passer pour neuve. */
    time: relativeTime(p.created_at),
    publieLe: p.created_at || null,
    remonteLe: p.remonte_le || null,
    // « type » dit si c'est une publication ou une publicité ; « format »
    // dit ce qu'on regarde. Les deux étaient confondus, si bien qu'une
    // photo se retrouvait dans le fil des vidéos.
    format: p.type || 'photo',
    /* L'INTENTION, à côté du SUPPORT. `type` dit ce qu'on regarde (photo,
       vidéo, montage) ; `conseil` dit pourquoi c'est là. Les deux se
       combinent — une vidéo-conseil est les deux à la fois. */
    conseil: !!p.conseil,
    /* LE CHANTIER AUQUEL ELLE APPARTIENT (section 36), ou `null`. Le TITRE
       ne voyage pas ici : il vit dans la table `chantiers`, et l'écran le
       lit dans le dictionnaire que `chantiersDeCesPosts()` remplit. Le
       recopier sur chaque publication ferait deux sources pour une seule
       vérité — et un chantier renommé laisserait l'ancien nom dans le
       fil, pour toujours. */
    chantierId: p.chantier_id || null,
    texte: p.texte, media: p.media,
    medias: (p.medias && p.medias.length) ? p.medias : (p.media ? [p.media] : []),
    musique: p.musique || null,
    // Le montage assemblé en un seul fichier, quand Cloudinary l'a fabriqué.
    montageUrl: p.montage_url || null,
    likes: p.likes_count || 0,
    /* COMBIEN DE PERSONNES ONT VU (section 35). Jamais QUI : la table du
       détail n'est lisible que par celui qui a regardé. */
    vues: p.vues_count || 0,
    liked: aimes.has(p.id),
    comments: commentaires,
    nbCommentaires: p.comments_count || 0,
    modifie: !!p.modifie_le,
    // Le repère de pagination : on redemande « ce qui est plus ancien que »
    // CETTE clé — la date de remise en avant, sinon celle de publication.
    curseur: cleDeTri(p),
  };
}
