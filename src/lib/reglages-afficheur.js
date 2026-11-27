/**
 * LES RÉGLAGES DE L'AFFICHEUR DE L'APERÇU — la `WebView` qui montre le PDF,
 * portes fermées (étape 2c-1, cahier §5.5).
 *
 * POURQUOI UN FICHIER À PART. L'enveloppe (`AfficheurPdf.js`) ne fait que
 * brancher `react-native-webview` : ce qui DÉCIDE — les réglages, l'adresse
 * permise, le délai d'une page qui reste blanche — vit ici, dans un fichier
 * que `node` fait tourner (`verifier-apercu`, G). Lue dans un composant, une
 * porte grande ouverte (`onShouldStartLoadWithRequest={() => true}`) ou un
 * réglage écrasé par un attribut écrit après l'étalement passeraient une
 * relecture ; jouées, elles ne passent pas.
 *
 * LES RÉGLAGES, et pourquoi chacun :
 *   - `originWhitelist: ['*']` : le défaut REFUSE `file://` et l'envoie à
 *     `Linking.openURL` — le PDF partirait dans une autre application ;
 *   - `allowsLinkPreview: false` : l'aperçu d'un lien offre « Partager… » ;
 *   - `textInteractionEnabled: false` : pas de sélection du texte ;
 *   - `menuItems: []` : un tableau vide supprime le menu ;
 *   - `dataDetectorTypes: 'none'` : posé pour un contenu web ; sans objet pour
 *     un PDF sur iOS (la détection des données d'un PDF n'existe que sur Mac) ;
 *   - `incognito: true` : rien de WebKit écrit sur le disque (déduit) ;
 *   - `javaScriptEnabled: false` : non établi pour un PDF — c'est le premier
 *     réglage à rendre si la page reste blanche sur l'iPhone.
 * ABSENTS, exprès : `allowingReadAccessToURL`, `allowFileAccess`,
 * `allowFileAccessFromFileURLs`, `allowUniversalAccessFromFileURLs` — le
 * droit de lecture reste au FICHIER de l'aperçu, seul.
 *
 * L'EFFET DE CES RÉGLAGES SUR L'AFFICHEUR DE PDF D'iOS 26 (le « PDF unifié »)
 * N'EST PAS ÉTABLI : ils ont été lus pour du contenu web. La question 4 de
 * l'essai sur l'iPhone tranche.
 *
 * CE FICHIER N'IMPORTE RIEN.
 */

/** Les réglages de la `WebView`, étalés EN DERNIER par l'enveloppe : un
 *  attribut écrit après eux les remplacerait. */
export const PROPS_AFFICHEUR = Object.freeze({
  originWhitelist: Object.freeze(['*']),
  allowsLinkPreview: false,
  textInteractionEnabled: false,
  menuItems: Object.freeze([]),
  dataDetectorTypes: 'none',
  incognito: true,
  javaScriptEnabled: false,
});

/** Sans fin de chargement après ce délai, la page est tenue pour blanche
 *  (E-M7) : un refus de navigation ne lève aucune erreur, et la fin du
 *  chargement peut ne jamais venir. */
export const DELAI_AFFICHAGE = 10000;

/* Une adresse de fichier, ramenée à son chemin : sans `file://`, sans le
   préfixe `/private` que WebKit peut écrire devant `/var/…`, les `%xx`
   décodés (sauf ceux d'une barre oblique, que `decodeURI` garde). Rien
   d'autre qu'un chemin absolu : une autre adresse ne se ramène à rien. */
function chemin(adresse) {
  if (typeof adresse !== 'string' || adresse === '') return null;
  let c = adresse.replace(/^file:\/\//i, '');
  if (!c.startsWith('/')) return null;
  try { c = decodeURI(c); } catch { return null; }
  if (c.startsWith('/private/var/')) c = c.slice('/private'.length);
  return c.length > 1 ? c : null;
}

/**
 * L'ADRESSE PERMISE — vrai SEULEMENT pour le fichier de l'aperçu
 * (`attendue`), comparé sans `file://` et sans `/private` ; faux pour tout le
 * reste : un autre fichier, une page web, `about:blank`, une adresse vide.
 * L'afficheur inscrit chaque adresse refusée pour les Détails.
 */
export function adresseAutorisee(vue, attendue) {
  const a = chemin(vue);
  const b = chemin(attendue);
  return a !== null && b !== null && a === b;
}
