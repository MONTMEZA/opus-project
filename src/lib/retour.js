/**
 * LE RETOUR AU DOIGT — ce que le téléphone répond quand on le touche.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Relevé le 01/10/2026 : `expo-haptics` était installé depuis le début et
 * appelé à UN seul endroit dans tout le projet — la grille de photos qu'on
 * réordonne au doigt (`GestionMedias.js`). Partout ailleurs, le téléphone
 * reste muet : on publie, on envoie un SOS, on demande un devis, et rien
 * ne confirme que le doigt a été entendu.
 *
 * C'est la moitié de ce qui fait dire « cette application est bien faite ».
 * L'autre moitié, c'est l'état pressé des boutons (`APPUI`, dans
 * `theme.js`) : l'œil et la peau doivent répondre ensemble.
 *
 * LA DOCTRINE, ET POURQUOI ELLE EST COURTE
 * ----------------------------------------
 * Une application qui vibre à chaque touche devient fatigante, et on finit
 * par couper le retour haptique du téléphone entier — donc on perd aussi
 * les vibrations utiles. La règle tenue ici :
 *
 *   ON NE VIBRE PAS pour ce qu'on voit déjà.
 *     Ouvrir un écran, choisir dans une liste, défiler : l'écran répond,
 *     c'est suffisant.
 *
 *   ON VIBRE pour ce qu'on ne voit pas encore, ou qu'on ne regarde pas.
 *     Un geste qui vient d'être validé (le doigt est sur l'écran, les yeux
 *     suivent le mouvement), un envoi qui part, un refus.
 *
 * Six fonctions, pas davantage. Si une septième semble nécessaire, c'est
 * probablement qu'une des six convient.
 *
 * CE QUI SE VÉRIFIE, ET CE QUI NE SE VÉRIFIE PAS
 * ----------------------------------------------
 * Le vibreur n'existe NI dans le navigateur de test, NI dans le simulateur.
 * `npm run verifier-retour` contrôle donc ce qui se contrôle : que chaque
 * appel est protégé, que la doctrine est respectée, que personne n'appelle
 * `expo-haptics` directement ailleurs. **Que ça se sente bien dans la main,
 * seul l'iPhone le dira.**
 */
import * as Haptics from 'expo-haptics';

/**
 * Tout passe par ici, et rien ne remonte jamais.
 *
 * Un téléphone peut n'avoir aucun vibreur, l'utilisateur peut l'avoir coupé
 * dans les réglages du système, et sur le web la fonction n'existe pas du
 * tout. Dans les trois cas, l'appel échoue — et une publication qui
 * échouerait parce que le téléphone ne sait pas vibrer serait absurde.
 *
 * `GestionMedias.js` tenait déjà ce `try`/`catch` depuis le début : on ne
 * fait que le remonter là où tout le monde peut s'en servir.
 */
function sansJamaisEchouer(faire) {
  try {
    const p = faire();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) {
    /* Volontairement vide : un vibreur absent n'est pas une panne. */
  }
}

/**
 * LE GESTE A PRIS — un glissement validé, une photo attrapée, un cran de
 * curseur franchi. Le plus léger des trois : il accompagne le doigt, il ne
 * l'interrompt pas.
 */
export function prise() {
  sansJamaisEchouer(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/**
 * UNE DÉCISION — on a appuyé sur quelque chose qui engage : publier,
 * envoyer, accepter. Plus ferme que `prise`, parce qu'il faut la sentir
 * même en gant de chantier.
 */
export function decision() {
  sansJamaisEchouer(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** C'EST PARTI — l'action a réussi, pour de bon, côté base. */
export function reussite() {
  sansJamaisEchouer(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/**
 * ÇA N'EST PAS PARTI — et c'est le retour le plus important de tous.
 *
 * Un échec s'affiche en haut de l'écran, et on regarde rarement le haut de
 * l'écran quand on vient d'appuyer en bas. La vibration est souvent la
 * seule chose qui prévient.
 */
export function echec() {
  sansJamaisEchouer(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

/**
 * ATTENTION — l'action est partie, mais quelque chose mérite un regard :
 * une donnée manquante, un envoi partiel.
 */
export function avertissement() {
  sansJamaisEchouer(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/**
 * UN CRAN — un pas de curseur, un onglet qui bascule. Le plus discret
 * possible : il se répète, donc il doit rester imperceptible pris un par
 * un. À n'appeler QUE lorsque la valeur a réellement changé, jamais à
 * chaque mouvement du doigt.
 */
export function cran() {
  sansJamaisEchouer(() => Haptics.selectionAsync());
}
