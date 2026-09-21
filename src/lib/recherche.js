/**
 * La recherche par mots-clés de la Place des pros.
 *
 * CE QU'ON CHERCHE VRAIMENT
 * -------------------------
 * Un artisan ne parcourt pas une liste d'annonces : il sait déjà ce qu'il
 * veut. Il tape « placo », « nacelle », « IPN », et il attend de voir ce qui
 * existe. Les filtres par type et par métier ne répondent pas à ça — le
 * métier d'un fournisseur de placo n'est pas « Plaquiste ».
 *
 * TROIS RÈGLES, ET RIEN DE PLUS
 * -----------------------------
 * 1. Les accents ne comptent pas. « plâtre » et « platre » doivent trouver
 *    la même chose : personne ne met les accents sur un téléphone, sur un
 *    chantier, avec des gants.
 * 2. TOUS les mots tapés doivent être présents. « nacelle 12 » ne doit pas
 *    ramener toutes les nacelles : chaque mot en plus restreint. C'est ce
 *    qu'attend quelqu'un qui affine sa recherche.
 * 3. Un mot peut être un début de mot. « placo » trouve « placoplâtre »,
 *    « plaque » trouve « plaques ». On ne cherche pas le mot exact, sinon
 *    la moitié des recherches ne rendent rien à cause d'un pluriel.
 *
 * LE VOCABULAIRE DU BÂTIMENT
 * --------------------------
 * Le même produit porte plusieurs noms selon la région et l'habitude :
 * placo, BA13, plaque de plâtre. Une recherche qui ignore ça rend zéro
 * résultat sur un catalogue pourtant rempli. La table de synonymes ci-
 * dessous est volontairement COURTE : chaque ligne est un couple qu'on
 * entend réellement sur un chantier, pas une liste devinée. Une équivalence
 * fausse est pire que pas d'équivalence — elle fait remonter des résultats
 * qui n'ont rien à voir, et on cesse de faire confiance à la recherche.
 *
 * Aucune dépendance : ce fichier se teste avec node
 * (npm run verifier-recherche).
 */

/**
 * LES GROUPES D'ÉQUIVALENCE.
 *
 * Chaque ligne rassemble des mots qui désignent la MÊME chose sur un
 * chantier. Le sens n'a pas de direction : celui qui tape « BA13 » doit
 * trouver « plaque de plâtre », et l'inverse doit marcher aussi. D'où des
 * groupes plutôt qu'une table « clé → valeurs », qui ne fonctionnerait que
 * dans un sens — l'erreur trouvée par `npm run verifier-recherche`.
 *
 * La liste est volontairement COURTE : chaque ligne s'entend réellement sur
 * un chantier. Une équivalence fausse est pire que pas d'équivalence, parce
 * qu'elle fait remonter des résultats sans rapport et qu'on cesse alors de
 * faire confiance à la recherche.
 */
export const GROUPES = [
  ['placo', 'placoplatre', 'plaque de platre', 'ba13'],
  ['nacelle', 'plateforme elevatrice', 'pemp'],
  ['ipn', 'poutrelle', 'poutre acier'],
  ['parpaing', 'agglo', 'bloc beton'],
  ['carrelage', 'carreau', 'faience'],
  ['isolation', 'isolant', 'laine de verre', 'laine de roche'],
  ['echafaudage', 'echaffaudage'],   // la faute est tellement courante
];

/**
 * Enlève les accents et la casse.
 * `normalize('NFD')` sépare la lettre de son accent, et on retire ensuite
 * tous les signes diacritiques d'un coup.
 */
export function normaliser(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Les mots utiles d'une recherche. On écarte ce qui fait moins de deux
 * lettres : « a », « de », « m » ne restreignent rien et feraient échouer
 * des recherches légitimes.
 */
export function motsDe(requete) {
  return normaliser(requete)
    .split(/[^a-z0-9]+/)
    .filter((m) => m.length >= 2);
}

/**
 * Un terme est-il présent dans le contenu ?
 *
 * Un terme d'un seul mot se cherche tel quel : « placo » se trouve dans
 * « placoplâtre ». Un terme de plusieurs mots ne peut PAS se chercher ainsi,
 * parce qu'un pluriel le casse : « plaque de platre » n'est pas contenu dans
 * « plaques de platre ». On demande alors que chacun de ses mots soit
 * présent, dans n'importe quel ordre — et on ignore les mots de moins de
 * trois lettres (« de », « à »), qui ne restreignent rien.
 */
function present(foin, terme) {
  const t = normaliser(terme);
  if (!t) return false;
  const mots = t.split(' ');
  if (mots.length === 1) return foin.includes(t);
  return mots.filter((m) => m.length >= 3).every((m) => foin.includes(m));
}

/**
 * Le contenu contient-il TOUS les mots de la recherche ?
 * Une recherche vide laisse tout passer : c'est l'état normal de la page.
 *
 * LES ÉQUIVALENCES, DANS LES DEUX SENS
 * ------------------------------------
 * On regarde d'abord si la recherche ÉVOQUE un groupe (« ba13 », ou bien
 * « plaque de plâtre » en entier), et si le contenu en porte une autre
 * forme (« placo »). Si les deux sont vrais, les mots de la recherche qui
 * servaient à nommer ce produit sont considérés comme trouvés.
 *
 * Il faut passer par la requête ENTIÈRE, et pas mot à mot : « plaque » tout
 * seul n'est pas un synonyme de placo (il y a des plaques de cuisson et des
 * plaques d'égout), c'est « plaque de plâtre » qui l'est. Mot à mot, on
 * rendrait la recherche bavarde — et une recherche bavarde ne sert à rien.
 */
export function correspond(contenu, requete) {
  const mots = motsDe(requete);
  if (mots.length === 0) return true;

  const foin = normaliser(contenu);
  const demande = normaliser(requete);

  /* Les mots de la recherche déjà justifiés par une équivalence. */
  const couverts = new Set();
  GROUPES.forEach((groupe) => {
    /* Le contenu porte-t-il l'une des formes de ce produit ? Sinon,
       l'équivalence ne sert à rien ici. */
    if (!groupe.some((terme) => present(foin, terme))) return;

    const simples = groupe.map(normaliser).filter((t) => !t.includes(' '));
    const composes = groupe.map(normaliser).filter((t) => t.includes(' '));

    /* Un mot tapé qui CONTIENT une forme simple : « placoplâtre » contient
       « placo ». L'inverse serait faux — « plaque » ne contient pas
       « placo » et n'a rien à voir avec lui. */
    mots.forEach((mot) => {
      if (simples.some((t) => mot.includes(t))) couverts.add(mot);
    });

    /* Une forme en plusieurs mots ne vaut que si la recherche ENTIÈRE la
       reprend : « plaque de plâtre » oui, « plaque » toute seule non. */
    composes.forEach((terme) => {
      if (!present(demande, terme)) return;
      motsDe(terme).forEach((m) => couverts.add(m));
    });
  });

  return mots.every((mot) => couverts.has(mot) || foin.includes(mot));
}

/**
 * Tout le texte d'une annonce, mis bout à bout pour la recherche.
 *
 * Le nom de l'entreprise en fait partie : chercher « Point P » ou « Sofrabat »
 * doit ramener ce que cette maison propose. La ville aussi — « nacelle lyon »
 * est une recherche naturelle.
 */
export function texteDe(annonce) {
  const a = annonce || {};
  const auteur = a.auteur || {};
  return [
    a.titre, a.texte, a.metier, a.ville,
    auteur.entreprise, auteur.metier,
    ...(auteur.metiers || []),
  ].filter(Boolean).join(' ');
}
