/**
 * LE NOM DE L'AGENT — et la seule règle qui décide quand on le demande.
 *
 * CE FICHIER N'IMPORTE RIEN, et c'est la douzième fois dans ce projet que
 * c'est une condition et pas une élégance (après `cloudinary-adresses.js`,
 * `cadre.js`, `types-fichiers.js`, `formats.js`, `filtre-fil.js`,
 * `formats-publication.js`, `vues.js`, `notifications.js`,
 * `journal-ia.js`, `recit.js`). Un calcul rangé dans un composant charge
 * React Native, que `node` ne sait pas ouvrir : le contrôle ne pourrait
 * alors plus le FAIRE TOURNER, et un contrôle qui plante ne vérifie rien.
 *
 * Ici c'est d'autant plus vrai que la règle porte une PROMESSE :
 *
 *   > « les suggestions de l'IA ne doivent pas être insistantes » (§2)
 *
 * Une promesse de ce genre ne se juge ni à l'œil ni à l'écran. On ne peut
 * pas ouvrir l'application cent fois pour voir si la fenêtre finit par se
 * taire. `npm run verifier-agent` fait tourner `doitProposerLeNom()` sur
 * tous les cas, y compris ceux qu'on n'atteindrait jamais à la main.
 */

/** La longueur d'un nom. 24 caractères : « Jean-Baptiste » tient, une
 *  phrase non. La même borne est écrite dans la contrainte
 *  `pro_agent_nom_check` (section 40), et le contrôle compare les deux. */
export const LONGUEUR_MIN_NOM_AGENT = 2;
export const LONGUEUR_MAX_NOM_AGENT = 24;

/**
 * COMBIEN DE FOIS ON PROPOSE, ET POURQUOI TROIS.
 *
 * Le propriétaire a demandé que la fenêtre revienne « de temps en temps »
 * pour qu'on ne saute pas l'étape. Trois est le nombre le plus petit qui
 * tient les deux bouts : la première fois on découvre l'agent et on est
 * pressé, la deuxième on l'a vu travailler, la troisième on sait de quoi
 * il s'agit. Au quatrième refus, insister n'apprend plus rien à personne
 * et le réglage reste accessible pour toujours dans le profil.
 */
export const MAX_PROPOSITIONS_NOM = 3;

/**
 * LE NOM PAR DÉFAUT EST EN MINUSCULES, ET CE N'EST PAS UN OUBLI.
 *
 * Tous les textes d'Opus placent ce nom au MILIEU d'une phrase :
 * « Faites raconter ce chantier par votre agent » / « … par Léo ». Un
 * défaut écrit « Votre agent » donnerait « par Votre agent ».
 *
 * > **Le nom de l'agent ne commence jamais une phrase.** C'est la seule
 * > façon d'avoir UNE valeur de repli et pas deux (une majuscule et une
 * > minuscule) — et deux écritures d'une même vérité finissent toujours
 * > par se contredire, c'est la leçon des voyants du 04/10.
 */
export const AGENT_SANS_NOM = 'votre agent';

/** Trois noms proposés d'un appui. Rien d'obligatoire : c'est pour que la
 *  fenêtre se referme en deux secondes quand on n'a pas d'idée, au lieu
 *  d'être un champ vide devant lequel on hésite puis on renonce. */
export const NOMS_SUGGERES = ['Léon', 'Margot', 'Gaston'];

/** Le nom à écrire à l'écran : le sien, ou le repli. */
export function nomAgent(agentNom) {
  const propre = String(agentNom == null ? '' : agentNom).trim();
  return propre || AGENT_SANS_NOM;
}

/** Vrai quand l'artisan a donné un nom à son agent. */
export function aUnNom(agentNom) {
  return String(agentNom == null ? '' : agentNom).trim().length > 0;
}

/**
 * Ce que l'écran accepte d'envoyer en base.
 *
 * Rend `{ valeur, erreur }` : `valeur` est le nom nettoyé, `erreur` un
 * message en français qui dit QUOI FAIRE — la règle du 01/10, « les
 * messages d'erreur sont en français et disent quoi faire ».
 *
 * `/\p{L}/u` — « au moins une lettre » : « 12 » et « ??? » ne sont pas des
 * noms, et la base les accepterait sans broncher. C'est la seule règle de
 * forme, parce que c'est la seule qui soit vraie partout : un nom peut
 * porter un trait d'union, un espace, un accent, une apostrophe.
 */
export function validerNomAgent(saisie) {
  const valeur = String(saisie == null ? '' : saisie).replace(/\s+/g, ' ').trim();

  if (!valeur) {
    return { valeur: '', erreur: 'Écrivez un nom, ou touchez « Plus tard ».' };
  }
  if (valeur.length < LONGUEUR_MIN_NOM_AGENT) {
    return { valeur, erreur: 'Un nom fait au moins deux lettres.' };
  }
  if (valeur.length > LONGUEUR_MAX_NOM_AGENT) {
    return {
      valeur,
      erreur: `Un nom tient en ${LONGUEUR_MAX_NOM_AGENT} caractères. Au-delà, c'est une phrase.`,
    };
  }
  if (!/\p{L}/u.test(valeur)) {
    return { valeur, erreur: 'Un nom contient au moins une lettre.' };
  }
  return { valeur, erreur: null };
}

/**
 * FAUT-IL OUVRIR LA FENÊTRE ?
 *
 * Quatre questions, dans cet ordre, et chacune ferme la porte pour une
 * raison différente :
 *
 *   1. **un particulier n'a pas d'agent** (§3) — rien à nommer ;
 *   2. **un agent déjà nommé ne se redemande pas** — c'est le réglage du
 *      profil qui sert à le changer, pour toujours ;
 *   3. **trois refus et on se tait** — le §2 interdit d'insister ;
 *   4. **la première fois, on ouvre tout de suite** ; ensuite, seulement
 *      quand l'agent VIENT DE TRAVAILLER pour lui.
 *
 * Le point 4 est la réponse exacte à la demande du propriétaire, et ce
 * n'est pas « de temps en temps » au sens d'un minuteur :
 *
 *   > **Elle revient au bon MOMENT, pas au bout d'un certain temps.** Une
 *   > fenêtre qui s'ouvre parce que trois jours ont passé interrompt
 *   > quelqu'un au milieu d'autre chose. Juste après que l'agent a écrit
 *   > le récit d'un chantier, la question « comment voulez-vous
 *   > l'appeler ? » tombe au seul instant où elle a un sens — on vient de
 *   > voir à quoi il sert.
 */
export function doitProposerLeNom({
  estPro = false, agentNom = null, propositions = 0, vientDeTravailler = false,
} = {}) {
  if (!estPro) return false;
  if (aUnNom(agentNom)) return false;

  const faites = Number.isFinite(Number(propositions)) ? Math.max(0, Number(propositions)) : 0;
  if (faites >= MAX_PROPOSITIONS_NOM) return false;

  if (faites === 0) return true;
  return Boolean(vientDeTravailler);
}
