/**
 * LE RÉCIT D'UN CHANTIER — ce que l'agent a le droit de raconter.
 *
 * POURQUOI CE FICHIER N'IMPORTE RIEN
 * ----------------------------------
 * Onzième application de la leçon de `cloudinary-adresses.js`. Ici ce
 * n'est pas une commodité : **ce fichier décide si l'agent a le droit
 * d'écrire**, et une règle de ce genre ne se juge ni à l'œil ni à l'écran.
 * `node` doit pouvoir la FAIRE TOURNER.
 *
 * LA RÈGLE QUI PORTE TOUT LE LOT
 * -------------------------------
 * > **Un récit s'écrit à partir de MOTS, jamais à partir de photos.**
 *
 * Trois publications sans un seul texte, et l'agent n'a rien à raconter —
 * il inventerait, et c'est exactement ce que la consigne serveur lui
 * interdit depuis le premier jour (« n'invente RIEN »). Un modèle à qui
 * l'on ne donne rien ne répond pas « je ne sais pas » : il produit une
 * jolie phrase creuse, et cette phrase irait sur la vitrine publique d'un
 * artisan.
 *
 * Donc on REFUSE en amont, et **l'écran dit pourquoi** : « vos étapes
 * n'ont pas de description ». C'est la règle des « 3 annonces sans lieu
 * précisé ne sont pas affichées » — un travail qui ne peut pas se faire ne
 * doit jamais ressembler à un travail fait.
 */

/**
 * Trois étapes avant de proposer quoi que ce soit.
 *
 * Deux publications ne font pas une histoire : c'est un avant et un après,
 * et la carte les montre déjà. Le récit sert à relier ce qu'on ne voit
 * plus — la dépose, le support, ce qui a été trouvé en ouvrant.
 */
export const MIN_ETAPES_RECIT = 3;

/**
 * …dont DEUX au moins portent une vraie description.
 *
 * Pourquoi deux et pas une : avec un seul texte, l'agent ne fait que le
 * recopier. Ce n'est pas un récit, c'est une citation — et l'artisan se
 * demanderait à juste titre à quoi sert ce bouton.
 */
export const MIN_TEXTES_RECIT = 2;

/**
 * En dessous, ce n'est pas une description.
 *
 * « Fini 💪 » fait 7 caractères et ne dit rien du travail. Le seuil n'est
 * pas une note donnée à l'artisan : c'est la quantité de matière en
 * dessous de laquelle le modèle n'aurait d'autre choix que d'inventer.
 */
export const MIN_LONGUEUR_TEXTE = 15;

/** Ce qu'on accepte de ranger en base. L'artisan peut corriger le texte. */
export const LONGUEUR_MAX_RECIT = 2000;

/** Ce qu'on envoie au modèle, par étape : au-delà, c'est du remplissage. */
export const LONGUEUR_MAX_ETAPE = 600;

/** Un texte qui dit quelque chose. */
export function texteUtilisable(texte) {
  return String(texte || '').trim().length >= MIN_LONGUEUR_TEXTE;
}

/**
 * Les étapes telles que le modèle les recevra : dans l'ORDRE DU CHANTIER,
 * sans les photos, sans les vides, et bornées.
 *
 * L'ordre est le sujet : on ne raconte pas une toiture en commençant par
 * les tuiles. C'est le seul endroit d'Opus qui remonte le temps à
 * l'endroit, comme la page du chantier.
 */
export function etapesPourLeRecit(publications = []) {
  return publications
    .filter((p) => texteUtilisable(p && p.texte))
    .map((p) => ({
      date: String((p.publieLe || p.curseur || '')).slice(0, 10) || null,
      texte: String(p.texte).trim().slice(0, LONGUEUR_MAX_ETAPE),
    }));
}

/**
 * L'agent peut-il écrire ? Et sinon, POURQUOI.
 *
 * On rend une raison, pas un `false` : un bouton grisé sans explication
 * est la pire des réponses — on appuie, rien ne se passe, et on croit
 * l'application cassée. Même famille que la poignée des commentaires qui
 * ne s'attrapait pas.
 */
export function peutEcrireLeRecit(publications = []) {
  const total = publications.length;
  if (total < MIN_ETAPES_RECIT) {
    return {
      possible: false,
      raison: `Il faut au moins ${MIN_ETAPES_RECIT} étapes pour qu'il y ait `
        + `une histoire à raconter. Ce chantier en compte ${total}.`,
    };
  }
  const avecTexte = etapesPourLeRecit(publications).length;
  if (avecTexte < MIN_TEXTES_RECIT) {
    return {
      possible: false,
      raison: 'Vos étapes n’ont pas de description. L’agent écrit à partir '
        + 'de VOS mots — sans eux, il inventerait. Ajoutez quelques phrases '
        + 'en publiant, et il saura quoi raconter.',
    };
  }
  return { possible: true, raison: '' };
}

/**
 * LE RÉCIT A-T-IL VIEILLI ?
 *
 * On publie trois étapes de plus après avoir fait écrire le récit, et il
 * raconte alors un chantier qui n'est plus celui qu'on voit en dessous.
 * Rien ne le signalerait : le texte est toujours là, et il est toujours
 * bien écrit.
 *
 * On compare deux dates DÉJÀ en base — `recit_ecrit_le` et `fin`, que le
 * déclencheur des compteurs tient à jour. Et on compare des CHAÎNES ISO,
 * pas des `Date` : la leçon des dates de la Place des pros du 04/10.
 */
export function recitPerime(recitEcritLe, derniereEtape) {
  if (!recitEcritLe || !derniereEtape) return false;
  return String(derniereEtape) > String(recitEcritLe);
}
