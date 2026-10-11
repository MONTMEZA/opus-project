/**
 * LE CLAVIER NE RECOUVRE PLUS CE QU'ON ÉCRIT.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Signalé par le propriétaire le 11/10/2026, depuis son iPhone, en
 * enregistrant son premier vrai client :
 *
 *   « le clavier bloque un peu les champs du bas du formulaire »
 *
 * CE QUE LA RÈGLE DU 04/10 AVAIT À MOITIÉ RAISON DE DIRE
 * -----------------------------------------------------
 * Ce jour-là, `FeuilleBas` a été écrit contre un défaut plus grave : une
 * feuille transparente collée au bas de l'écran se fait recouvrir par le
 * clavier, **la croix de fermeture comprise**. Il n'y a alors plus de
 * sortie, et l'application a l'air plantée.
 *
 * Et `verifier-feuilles` en a tiré une exemption, écrite noir sur blanc :
 * « un champ caché par le clavier dans une fenêtre plein écran, on le fait
 * défiler ». Elle est FAUSSE, et c'est ce lot qui le dit :
 *
 *   **On PEUT le faire défiler. Rien ne le fait.**
 *
 * Ce n'est pas une impression : mesuré dans le source de React Native
 * 0.86.3. `scrollResponderScrollNativeHandleToKeyboard` existe
 * (`ScrollView.js:958`) et **n'a aucun appelant** dans toute la
 * bibliothèque — `TextInput.js` ne contient ni `measureLayout`, ni
 * `scrollTo`, ni `ScrollView`. Les quatre abonnements au clavier de
 * `ScrollView` ne font que mémoriser la géométrie.
 *
 * LES DEUX MÉCANISMES, ET LEQUEL POUR QUELLE FORME
 * -----------------------------------------------
 * > **Ce qui est COLLÉ au bas de l'écran doit MONTER.** Une feuille, une
 * > barre de saisie de conversation : c'est le travail d'un
 * > `KeyboardAvoidingView`, qui réduit sa propre hauteur. `FeuilleBas`,
 * > `CommentsSheet`, `QuoteModal` et `ConversationScreen` sont dans ce cas
 * > et ne changent pas.
 * >
 * > **Ce qui DÉFILE ne monte pas : c'est son CONTENU qui remonte.** Et
 * > c'est `automaticallyAdjustKeyboardInsets`, posé par ce fichier.
 *
 * POURQUOI PAS UN `KeyboardAvoidingView` PARTOUT, ALORS
 * ----------------------------------------------------
 * C'était mon premier jet, et il était recevable : `AuthScreen` est le
 * seul formulaire du projet qui gérait le clavier, avec ce motif, et c'est
 * le seul dont le propriétaire ne s'est jamais plaint — alors qu'il y a
 * créé son compte au doigt.
 *
 * Mais son formulaire est COURT et centré. Un `KeyboardAvoidingView`
 * réduit le cadre, donc il rend le champ du bas **atteignable** ; quand le
 * formulaire tient dans ce qui reste, on ne voit pas la différence. Sur
 * neuf champs, ou sur les dix-huit de « Modifier mon profil », il ne tient
 * pas — et le champ qui vient de prendre le focus reste sous le clavier.
 * C'est exactement la plainte, et le motif éprouvé ne l'aurait pas
 * corrigée.
 *
 * CE QUE LA PROPRIÉTÉ NATIVE FAIT DE PLUS, ET QUI EST LE POINT
 * -----------------------------------------------------------
 * `RCTScrollViewComponentView.mm:187-265` — le code iOS, sur
 * `UIKeyboardWillChangeFrameNotification` :
 *
 *   1. il pose `contentInset.bottom` = ce que le clavier recouvre
 *      vraiment, **calculé en coordonnées absolues de fenêtre**
 *      (`convertPoint:toView:nil`). Il n'y a donc RIEN à régler : la barre
 *      d'onglets de 69 px, un en-tête, une zone sûre, une fenêtre
 *      modale — tout est pris en compte par construction. Un
 *      `KeyboardAvoidingView`, lui, ne tombe juste que parce que la barre
 *      d'onglets est un frère en flux ; le jour où un écran passe sous la
 *      barre flottante du mode vidéo, il se tromperait de 69 px en
 *      silence ;
 *   2. **il DÉFILE jusqu'au champ actif** (`reactUpdateResponderOffsetForScrollView:`),
 *      en visant le rectangle du curseur, avec la durée et la courbe
 *      d'animation du clavier. C'est la seule des deux approches qui
 *      AMÈNE le champ au lieu de le rendre accessible ;
 *   3. il garde le `contentInset.bottom` que l'écran s'est posé lui-même
 *      (`MAX(inset, props.contentInset.bottom)`).
 *
 * ET SURTOUT : ON NE CUMULE PAS LES DEUX
 * --------------------------------------
 * Prouvé par l'ordre des événements. Le natif mute `contentInset`
 * **synchronement** dans le callback UIKit ; le `KeyboardAvoidingView`
 * passe par `RCTKeyboardObserver`, qui envoie un événement **asynchrone
 * vers JavaScript**, puis par un `setState`. Le natif est donc toujours
 * premier, il pose l'inset sur la boîte d'AVANT, et rien ne le recalcule
 * quand la mise en page change — aucune notification de clavier n'est
 * émise par un changement de mise en page.
 *
 * > **Résultat : la hauteur du clavier comptée DEUX FOIS**, soit un vide
 * > défilable de la taille d'un clavier sous le dernier champ, pendant
 * > toute la saisie. Il faut choisir, et ce n'est pas une affaire de goût.
 *
 * `npm run verifier-feuilles` refuse qu'un même conteneur porte les deux.
 *
 * LES DEUX AUTRES PROPRIÉTÉS, ET POURQUOI ELLES SONT ICI
 * -----------------------------------------------------
 * `keyboardShouldPersistTaps: 'handled'` n'est pas un détail : sans lui,
 * le premier appui sur un bouton alors que le clavier est ouvert ne fait
 * que refermer le clavier. On appuie, « rien ne se passe », on recommence.
 * Le relevé du 11/10 en a trouvé **cinq conteneurs qui en manquaient** —
 * dont le fil, où l'on écrit un commentaire, et l'écran d'administration.
 *
 * Elles voyagent ENSEMBLE parce qu'elles répondent à la même question, et
 * parce qu'un objet qu'on étale (`{...CLAVIER}`) se pose aussi bien sur un
 * `ScrollView` que sur une `FlatList` — ce qu'un composant enveloppant ne
 * ferait pas sans ajouter une vue dans l'arbre du fil, qui est l'écran le
 * plus sensible du projet (lot 4).
 *
 * CE QUI NE SE VÉRIFIE PAS ICI, ET QU'IL FAUT DIRE
 * -----------------------------------------------
 * **Rien de tout cela.** `automaticallyAdjustKeyboardInsets` est
 * `@platform ios` : aucune implémentation Android (la fenêtre s'y
 * redimensionne seule, `adjustResize`, y compris celle d'un `Modal`), et
 * `react-native-web` la jette par liste blanche — sans avertissement, sans
 * casse, et sans effet. Au navigateur, on vérifie seulement que le
 * remaniement n'a rien cassé. **Le reste se juge sur l'iPhone, et nulle
 * part ailleurs.**
 *
 * VÉRIFIÉ SUR L'IPHONE le 11/10/2026, et c'est ce qui tranche ce fichier
 * ----------------------------------------------------------------------
 * Le propriétaire, le soir du lot : « j'ai testé sur mon iPhone et ça
 * marche très bien ».
 *
 * > **C'était un pari, et il faut le savoir avant de revenir en arrière.**
 * > Le seul motif qui avait fait ses preuves sur son téléphone était le
 * > `KeyboardAvoidingView` d'`AuthScreen` ; ce fichier a livré l'AUTRE
 * > mécanisme, sur la foi d'une lecture du source de React Native. Son
 * > iPhone a confirmé. **Remettre un `KeyboardAvoidingView` par-dessus
 * > annulerait cette preuve et doublerait l'inset.**
 *
 * Ce que sa phrase ne couvre PAS : il a essayé ce qu'il avait sous la main,
 * pas les dix-sept conteneurs — ni les dix-huit champs de « Modifier mon
 * profil », ni le mot de confirmation de suppression de compte, ni un
 * commentaire écrit dans le fil.
 *
 * Et une limite honnête, lisible dans le code natif : ce défilement ne
 * vit que dans `_keyboardWillChangeFrame:`. Passer du champ 3 au champ 9
 * **clavier déjà ouvert** n'émet aucune notification, donc ce code ne
 * tourne pas ; ce qui prend le relais est le recadrage d'UIKit, qui ne
 * s'établit pas depuis `node_modules`. Si l'iPhone montre ce défaut, la
 * parade est un appel à la main à
 * `scrollResponderScrollNativeHandleToKeyboard` sur `onFocus` — **et
 * surtout pas un `KeyboardAvoidingView` ajouté par-dessus**, qui
 * doublerait l'inset.
 */

/**
 * À étaler sur TOUT conteneur vertical qui défile et qui porte un champ de
 * saisie : `<ScrollView {...CLAVIER} …>`, `<FlatList {...CLAVIER} …>`.
 */
export const CLAVIER = {
  /* Le premier appui sur un bouton, clavier ouvert, DOIT agir. */
  keyboardShouldPersistTaps: 'handled',
  /* iOS : l'inset du clavier, et le défilement jusqu'au champ actif.
     Ailleurs, inerte — et ce n'est pas un défaut, c'est que personne
     d'autre n'a ce problème. */
  automaticallyAdjustKeyboardInsets: true,
};

export default CLAVIER;
