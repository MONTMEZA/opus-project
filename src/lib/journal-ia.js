/**
 * CE QUE L'AGENT A FAIT — la lecture du journal d'audit (section 38).
 *
 * POURQUOI CE FICHIER N'IMPORTE RIEN
 * ----------------------------------
 * Dixième application de la leçon de `cloudinary-adresses.js` : un calcul
 * rangé dans un composant ne peut pas être FAIT TOURNER par un contrôle,
 * parce que `node` ne sait pas ouvrir React Native. Ici il y a une règle
 * qu'il faut absolument éprouver — « une action inconnue s'affiche quand
 * même » —, et elle ne se vérifie qu'en l'exécutant.
 *
 * POURQUOI CET ÉCRAN EXISTE, ET CE QU'IL ÉVITE
 * --------------------------------------------
 * `journal_ia` est écrit par la fonction Edge à chaque appel. Sans lecteur,
 * ce serait **une table qu'on écrit et que personne ne lit** — le défaut que
 * ce projet traque depuis le 01/10, et ce serait un comble pour un journal
 * d'audit. Le §23 du cahier des charges le demande d'ailleurs en propres
 * termes : « possibilité de consulter l'historique ».
 *
 * CE QU'ON N'AFFICHE PAS, ET POURQUOI
 * -----------------------------------
 * 1. **Le nombre d'appels qu'il reste aujourd'hui.** C'est tentant, et c'est
 *    un piège : la limite est tenue par `enregistrer_appel_ia()`, qui compte
 *    les lignes `ok` des 24 dernières heures **sur l'horloge du serveur**.
 *    La recalculer ici serait une SECONDE écriture de la même vérité — ce que
 *    ce projet refuse depuis les voyants du 04/10 —, et elle se tromperait
 *    deux fois : sur une page de résultats qui peut être pleine de refus, et
 *    sur l'horloge du téléphone. La base, elle, le dit déjà au bon moment :
 *    un refus revient en 429 avec sa phrase en français.
 * 2. **Les jetons.** « 12 483 jetons » ne veut rien dire pour un maçon, et
 *    rien ne peut en être tiré. Ils sont dans l'export de ses données (le
 *    journal entier y passe), là où ils répondent à la seule question qu'ils
 *    savent traiter : « pourquoi cette facture monte-t-elle ? »
 * 3. **La question posée et la réponse.** Elles ne sont pas en base, par
 *    construction : ce qu'on n'écrit pas ne peut pas fuir.
 */

/**
 * La limite quotidienne, en toutes lettres à l'écran.
 *
 * ELLE EST ÉCRITE DEUX FOIS — ici, et en valeur par défaut de
 * `enregistrer_appel_ia(… p_limite_jour int default 60)`. C'est assumé parce
 * que c'est borné : ce nombre ne sert QU'À composer une phrase, il ne décide
 * de rien. Et `verifier-notifications` compare les deux à chaque passage,
 * donc elles ne peuvent pas se séparer en silence.
 */
export const LIMITE_IA_PAR_JOUR = 60;

/**
 * Les quatre actions que la fonction Edge sait faire aujourd'hui.
 *
 * Le libellé est ce que l'artisan LIT. Jamais la clé : « ameliorer » à
 * l'écran ressemble à une faute de frappe, donc personne ne la signale —
 * c'est la règle du catalogue des métiers (`nomMetier`), et elle vaut pour
 * toute clé technique.
 */
export const ACTIONS_IA = {
  match: {
    label: 'Recherche d’un artisan',
    detail: 'Vous avez décrit un besoin, l’agent a cherché qui pouvait le prendre.',
  },
  summary: {
    label: 'Résumé des avis',
    detail: 'L’agent a lu les avis d’une fiche et les a résumés.',
  },
  bio: {
    label: 'Proposition de présentation',
    detail: 'L’agent a proposé des textes pour votre fiche, à partir de vos réponses.',
  },
  ameliorer: {
    label: 'Relecture d’un texte',
    detail: 'L’agent a relu votre texte et proposé de le remettre d’aplomb.',
  },
  recit: {
    label: 'Récit d’un chantier',
    detail: 'L’agent a assemblé vos étapes en un texte que vous avez relu '
      + 'avant de le publier.',
  },
};

/**
 * Ce que l'action visait, quand elle visait quelque chose.
 *
 * ON NOMME LE TYPE, JAMAIS LA CHOSE. « sur la fiche d'un artisan » et pas
 * « sur la fiche de Dupont Maçonnerie » : un journal n'a pas à conserver le
 * nom d'un TIERS, et il n'a pas non plus besoin d'aller le chercher — il
 * sert à rendre compte, pas à naviguer. L'identifiant exact est dans
 * l'export des données pour qui veut tracer précisément.
 */
export const CIBLES_IA = {
  pro: 'la fiche d’un artisan',
  publication: 'une publication',
  presentation: 'votre présentation',
  chantier: 'un chantier',
};

/**
 * Une action que ce fichier ne connaît pas s'affiche QUAND MÊME.
 *
 * C'est le point le plus important ici, et il se vérifie en l'exécutant :
 * l'agent gagnera des actions (devis, facture, planning…), et une application
 * qui n'a pas été remise à jour doit rendre compte de ce qui s'est passé,
 * pas une ligne vide. Un journal d'audit troué par une version en retard ne
 * prouve plus rien.
 */
export function libelleAction(action) {
  const connue = ACTIONS_IA[action];
  if (connue) return connue.label;
  const brut = String(action || '').trim();
  return brut ? `Action « ${brut} »` : 'Action de l’agent';
}

/** L'explication sous le libellé. Vide pour une action inconnue : on n'invente pas. */
export function detailAction(action) {
  const connue = ACTIONS_IA[action];
  return connue ? connue.detail : '';
}

/** « sur une publication », ou rien du tout. Une clé inconnue se TAIT. */
export function libelleCible(cibleType) {
  const nom = CIBLES_IA[cibleType];
  return nom ? `sur ${nom}` : '';
}

/**
 * Le résultat ne s'affiche que quand il n'est PAS « ok ».
 *
 * Écrire « Réussi » sur chaque ligne ferait du bruit là où l'on cherche
 * justement l'exception. Un refus et une erreur, eux, doivent se voir : une
 * limite qui mord en silence ressemble à une panne.
 */
export function libelleResultat(resultat) {
  if (resultat === 'refuse') {
    return 'Limite du jour atteinte — l’agent n’a pas été appelé';
  }
  if (resultat === 'erreur') return 'L’agent n’a pas pu répondre';
  return '';
}

/** `true` quand la ligne mérite d'être signalée à l'œil (bord coloré). */
export function estUnEchec(resultat) {
  return resultat === 'refuse' || resultat === 'erreur';
}
