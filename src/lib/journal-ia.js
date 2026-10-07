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
 * Les actions que la fonction Edge sait faire aujourd'hui.
 *
 * Le libellé est ce que l'artisan LIT. Jamais la clé : « ameliorer » à
 * l'écran ressemble à une faute de frappe, donc personne ne la signale —
 * c'est la règle du catalogue des métiers (`nomMetier`), et elle vaut pour
 * toute clé technique.
 *
 * CHAQUE ACTION PORTE QUATRE CHOSES, ET LES QUATRE SERVENT
 * --------------------------------------------------------
 *   `label`  le titre, au journal comme dans la liste ;
 *   `detail` ce qui s'est passé, au PASSÉ — c'est une ligne de journal ;
 *   `sait`   ce qu'il sait faire, au PRÉSENT — c'est une promesse tenue ;
 *   `ou`     **OÙ on le lui demande.**
 *
 * Le dernier est celui qui change tout, et il vient du propriétaire :
 *
 *   « quand on avancera sur les différentes actions il faudra ajouter sur
 *     cette page pour que la personne qui voit cette page comprenne à quoi
 *     cet agent va lui servir, ça va être son plus fidèle assistant et il
 *     faut qu'il s'en rende compte »
 *
 * Un artisan ne lit pas un mode d'emploi. Lui dire « il résume les avis »
 * sans dire où, c'est une fonctionnalité qu'il ne trouvera jamais — et
 * quatre des cinq actions d'aujourd'hui sont exactement dans ce cas : elles
 * existent, elles marchent, et rien nulle part ne dit qu'elles existent.
 *
 * > **ET C'EST POUR ÇA QUE LES QUATRE CHAMPS SONT OBLIGATOIRES.**
 * > `npm run verifier-agent` refuse une action à qui il en manque un. Le
 * > jour où l'agent apprend à rédiger un devis, sa ligne sur cette page
 * > s'écrit DANS LE MÊME LOT — on ne peut pas l'oublier, le contrôle
 * > rougit. C'est la même mécanique que « toute section qui ajoute une
 * > table ajoute sa ligne à `mes_donnees()` ».
 */
export const ACTIONS_IA = {
  match: {
    label: 'Recherche d’un artisan',
    detail: 'Vous avez décrit un besoin, l’agent a cherché qui pouvait le prendre.',
    sait: 'Décrivez ce que vous cherchez avec vos mots, il trouve les artisans '
      + 'qui peuvent le prendre et dit pourquoi.',
    ou: 'Découvrir',
  },
  summary: {
    label: 'Résumé des avis',
    detail: 'L’agent a lu les avis d’une fiche et les a résumés.',
    sait: 'Il lit tous les avis d’un artisan et vous en fait trois phrases, '
      + 'au lieu de les parcourir un par un.',
    ou: 'La fiche d’un artisan',
  },
  bio: {
    label: 'Proposition de présentation',
    detail: 'L’agent a proposé des textes pour votre fiche, à partir de vos réponses.',
    sait: 'Répondez à quelques questions sur votre métier, il écrit votre '
      + 'présentation — en trois versions, vous choisissez.',
    ou: 'Modifier mon profil',
  },
  ameliorer: {
    label: 'Relecture d’un texte',
    detail: 'L’agent a relu votre texte et proposé de le remettre d’aplomb.',
    sait: 'Écrivez comme vous parlez, il remet d’aplomb. Il part de VOS mots, '
      + 'il n’invente rien et n’ajoute rien.',
    ou: 'Publier, et votre présentation',
  },
  recit: {
    label: 'Récit d’un chantier',
    detail: 'L’agent a assemblé vos étapes en un texte que vous avez relu '
      + 'avant de le publier.',
    sait: 'Il assemble les étapes d’un chantier en une histoire que vos '
      + 'clients lisent d’un coup. Vous relisez avant qu’elle paraisse.',
    ou: 'La page d’un chantier',
  },
};

/**
 * CE QU'IL SAIT FAIRE, dans l'ordre où on s'en sert.
 *
 * Une liste dérivée d'`ACTIONS_IA`, jamais recopiée : deux listes pour une
 * seule vérité finissent toujours par se contredire — c'est la leçon des
 * voyants du 04/10, et ici ce serait pire qu'ailleurs, puisque la seconde
 * promettrait des choses que la première ne fait pas.
 *
 * L'ordre est celui d'`ACTIONS_IA` et il n'est pas alphabétique : on
 * commence par ce qui sert le plus souvent.
 */
export function savoirFaireAgent() {
  return Object.entries(ACTIONS_IA).map(([cle, a]) => ({
    cle, label: a.label, sait: a.sait, ou: a.ou,
  }));
}

/**
 * LA SEULE PHRASE QUI PARLE DE L'AVENIR, et elle est pesée.
 *
 * Le propriétaire veut que l'artisan comprenne que ce sera « son plus
 * fidèle assistant ». Une LISTE de fonctionnalités à venir serait le
 * « bouton §18 » en pire — un menu de promesses que rien ne tient, et qui
 * vieillit mal. Une phrase, en revanche, dit la direction sans promettre
 * de date, et elle est vraie : l'ordre des modules est arrêté dans
 * `docs/A-FAIRE.md`.
 */
export const AGENT_PLUS_TARD = 'Il apprendra ensuite vos devis, vos factures '
  + 'et votre planning : c’est le logiciel de gestion qu’on construit autour '
  + 'de lui.';

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
