/**
 * Mise en forme d'un texte écrit à la main, sans IA.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Le bouton « Améliorer avec l'IA » doit faire quelque chose même quand l'IA
 * n'est pas joignable — téléphone hors réseau, clé absente, service saturé.
 * Un bouton qui échoue une fois sur trois n'est plus jamais touché.
 *
 * Ce que cette fonction sait faire est modeste mais réel : les espaces, les
 * majuscules de début de phrase, la ponctuation française. C'est déjà ce qui
 * distingue le plus visiblement un texte soigné d'un texte tapé au pouce sur
 * un chantier. L'écran dit franchement que l'IA n'est pas intervenue.
 *
 * CE QU'ELLE NE FAIT PAS, ET NE DOIT PAS FAIRE
 * --------------------------------------------
 * Elle ne reformule rien, ne corrige aucune faute d'orthographe, n'ajoute ni
 * ne retire un mot. Le texte reste celui de l'artisan — c'est justement ce
 * qu'il faut préserver.
 *
 * Aucune dépendance : ce fichier se teste avec node.
 */

/**
 * L'espace insécable (U+00A0) plutôt que la fine insécable (U+202F) : toutes
 * les polices ne portent pas la seconde, et une police qui ne la connaît pas
 * affiche un rectangle vide au milieu de la phrase.
 */
const INSECABLE = ' ';

/** Signes qui prennent une espace AVANT en français. */
const AVANT = [';', ':', '!', '?', '»'];

/** Signes qui n'en prennent pas. */
const SANS_AVANT = [',', '.', ')', ']', '…'];

export function nettoyerTypographie(entree) {
  let t = String(entree || '');
  if (!t.trim()) return '';

  // 1. Normaliser les espaces : tabulations, espaces multiples, insécables
  //    déjà posées (on les remet proprement à l'étape 4).
  t = t.replace(/[\t  ]/g, ' ');
  t = t.replace(/ {2,}/g, ' ');

  // 2. Au plus une ligne vide entre deux paragraphes. Trois retours à la
  //    ligne d'affilée, c'est un doigt resté appuyé, pas une intention.
  t = t.replace(/\r\n?/g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  t = t.split('\n').map((l) => l.trim()).join('\n');

  // 3. Pas d'espace avant une virgule ou un point, une seule espace après.
  SANS_AVANT.forEach((signe) => {
    t = t.split(` ${signe}`).join(signe);
  });
  t = t.replace(/([,.;:!?…])(?=[^\s,.;:!?…)\]»\n])/g, '$1 ');

  // 4. Espace insécable avant ; : ! ? » — et après « .
  AVANT.forEach((signe) => {
    const sansEspace = new RegExp(`\\s*\\${signe}`, 'g');
    t = t.replace(sansEspace, `${INSECABLE}${signe}`);
  });
  t = t.replace(/«\s*/g, `«${INSECABLE}`);

  // 5. Trois points deviennent des points de suspension.
  t = t.replace(/\.{3,}/g, '…');

  // 6. Une majuscule en début de texte et après un point.
  t = t.replace(/(^|[.!?…] ?[.!?]*\s+|\n)([a-zà-öø-ÿ])/g,
    (_, avant, lettre) => avant + lettre.toUpperCase());

  // 7. Un point final, s'il manque. Une description qui s'arrête en plein
  //    milieu donne l'impression d'un message envoyé par erreur.
  t = t.trim();
  if (t && !/[.!?…:»)]$/.test(t)) t += '.';

  return t;
}

/**
 * Le texte a-t-il vraiment changé ? Sert à ne pas annoncer une amélioration
 * quand il n'y en a pas — dire « voici votre texte amélioré » en rendant le
 * même texte est la meilleure façon de perdre la confiance de quelqu'un.
 */
export function aChange(avant, apres) {
  return String(avant || '').trim() !== String(apres || '').trim();
}
