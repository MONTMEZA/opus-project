/**
 * LA DÉCLARATION SUR L'HONNEUR DU N° DE TVA, CÔTÉ ÉCRAN (lot 2b-2 du module
 * devis, cahier §3.7 et annexe A.5).
 *
 * Ce que l'écran « Mon entreprise → Votre entreprise » DÉCIDE et DIT de la
 * déclaration — des fonctions PURES et des textes, ici et pas dans
 * `SaisieTva.js` : `node` les fait tourner (`verifier-tva`), la leçon de
 * `cloudinary-adresses.js`. Et pas dans `tva.js` : ce fichier-là est
 * recopié octet pour octet dans la fonction Edge, qui n'a que faire de
 * l'écran.
 *
 * TROIS RÈGLES, et aucune n'est cosmétique :
 *   - LA DÉCLARATION NE S'OFFRE QUE LÀ OÙ ELLE A UN SENS (`peutDeclarerTva`,
 *     critique écran E-I4) : pas de preuve, une preuve d'essai, ou une
 *     déclaration d'un AUTRE numéro. Jamais pour le numéro déjà déclaré —
 *     rien à refaire —, jamais quand VIES en reconnaît un : on ne
 *     rétrograde pas un numéro reconnu en numéro déclaré ;
 *   - ET SEULEMENT APRÈS UNE RÉPONSE DE VIES QUI LE PERMET
 *     (`declarationOfferte`) : un refus pour le numéro encore dans le champ,
 *     ou, décision P5 du 09/11/2026, trois contrôles sans réponse en plus
 *     d'une heure (`declarable`, que seule la fonction Edge compte). Jamais
 *     après un blocage d'Opus par VIES, une limite, le réseau ;
 *   - CHAQUE ISSUE A SON TON (`presentationDeLIssueTva`, critique écran
 *     E-I3) : « déclaré » et « retiré » sont des réussites, en vert et sans
 *     vibration d'échec ; « déjà reconnu » une simple note ; une case pas
 *     cochée dit ce qui manque, sans vibrer.
 *
 * Les textes sont ceux de l'annexe A.5, mot pour mot. Le texte de la CASE
 * n'est pas ici : il ne vit que dans `DECLARATION_TVA` (`tva.js`), à côté de
 * la case, et c'est lui que le téléphone renvoie.
 */
import { preuveTvaPour } from './emetteur.js';
import { dateFrancaise } from './entreprise.js';

/** Les textes du bloc de la déclaration, de la note d'une déclaration, et
 *  de la démonstration (annexe A.5). */
export const DECLARATION_ECRAN = Object.freeze({
  titre: 'Vous êtes sûr de ce numéro ?',
  explication: 'Votre espace professionnel sur impots.gouv.fr le montre, ou un courrier de votre service des impôts ? '
    + 'Vous pouvez alors le déclarer sur l’honneur : Opus l’imprimera sur vos devis. Cette déclaration vous engage ; '
    + 'Opus la garde avec sa date, et vous pourrez la retirer.',
  bouton: 'Déclarer ce numéro sur l’honneur',
  boutonEnCours: 'Enregistrement de votre déclaration…',
  /* Ajouté au texte d'accueil, au régime réel, quand aucun numéro n'est
     gardé. */
  accueilReel: 'S’il le refuse alors que vous êtes sûr de votre numéro, vous pourrez le déclarer sur l’honneur.',
  recontroler: 'Faire contrôler de nouveau par VIES',
  autreNumero: 'Écrire un autre numéro',
  retirer: 'Retirer cette déclaration',
  confirmerRetrait: 'Confirmer : retirer la déclaration',
  demo: 'Démonstration : une clé de deux chiffres juste est reconnue ; une clé en lettres qui commence par Z trouve VIES '
    + 'saturé ; toute autre clé en lettres est refusée, et la déclaration sur l’honneur vous est alors proposée.',
});

/** « Elle remplacera votre déclaration du JJ/MM/AAAA pour le numéro … » —
 *  quand une déclaration d'un AUTRE numéro existe. */
export function remplaceraLaDeclaration({ declare_le: le = null, numero = null } = {}) {
  const jour = le ? dateFrancaise(le) : null;
  return `Elle remplacera votre déclaration${jour ? ` du ${jour}` : ''}${numero ? ` pour le numéro ${numero}` : ''}.`;
}

/** La note d'un numéro DÉCLARÉ (jamais « VIES l'a reconnu » : il ne l'a
 *  pas reconnu — c'était l'affichage faux d'avant 2b-2). */
export function noteDUneDeclaration(declareLe = null) {
  const jour = declareLe ? dateFrancaise(declareLe) : null;
  return `Déclaré sur l’honneur par vous${jour ? ` le ${jour}` : ''} : VIES ne l’avait pas reconnu. `
    + 'Il s’imprime sur vos devis, sous votre responsabilité.';
}

/** L'aide de la section TVA de la fiche (`FicheEmetteur.js`) pour un numéro
 *  déclaré : sans elle, cette aide restait VIDE. */
export function aideDeLaSectionTvaDeclaree(numero, declareLe = null) {
  const jour = declareLe ? dateFrancaise(declareLe) : null;
  return `Numéro de TVA intracommunautaire ${numero}, déclaré sur l’honneur par vous${jour ? ` le ${jour}` : ''} : `
    + 'VIES ne l’avait pas reconnu. Il s’imprimera sur vos devis, quel que soit votre régime ; vous pouvez retirer votre '
    + 'déclaration dans « Votre entreprise ».';
}

/**
 * CE QUE « MON ENTREPRISE » DIT PENDANT UN ENVOI — selon CE qui part
 * (`'controle' | 'declaration' | 'retrait'`). Fermer la fenêtre ou passer en
 * édition n'annulerait rien : la fonction Edge finirait d'écrire. `fermer` :
 * le geste qui vient d'être retenu est une fermeture.
 */
export function messageDOccupationTva(quoi, { fermer = false } = {}) {
  if (quoi === 'declaration') return 'Enregistrement de votre déclaration en cours : attendez la réponse.';
  if (quoi === 'retrait') return 'Retrait de votre déclaration en cours : attendez la réponse.';
  return fermer
    ? 'Contrôle auprès de VIES en cours : attendez sa réponse. Fermer ne l’annulerait pas.'
    : 'Contrôle auprès de VIES en cours : attendez sa réponse.';
}

/**
 * LA DÉCLARATION PEUT-ELLE S'OFFRIR POUR CE NUMÉRO ? (critique écran E-I4) —
 * `entreprise` : l'identité ACTIVE ; `preuveTva` : la ligne de
 * `preuves_tva` ; `numero` : celui qu'on vient de faire contrôler. Une
 * preuve qui ne vaut pas pour le SIREN actif est une preuve absente
 * (`preuveTvaPour`). L'annuaire qui publie un numéro : rien à déclarer.
 */
export function peutDeclarerTva({ entreprise = null, preuveTva = null, numero = null } = {}) {
  if (!entreprise || entreprise.tva) return false;
  const p = preuveTvaPour(entreprise, preuveTva);
  if (!p) return true;
  if (p.source === 'essai') return true;
  if (p.source === 'declaration') return typeof numero === 'string' && numero !== '' && p.numero !== numero;
  return false;
}

/**
 * LA CASE S'AFFICHE-T-ELLE ? — après une réponse qui le permet, pour le
 * numéro ENCORE dans le champ (`reponse.pour`, posé par l'écran au départ
 * du contrôle) :
 *   - `refuse`, frais ou retenu, sans déclaration de ce numéro qui reste ;
 *   - `indisponible` qui porte `declarable: true` (P5).
 * Jamais après `bloque`, `trop_d_essais`, `reseau`, `lent`,
 * `service_indisponible`, ni `indisponible` sans `declarable`.
 */
export function declarationOfferte({ peutDeclarer = false, reponse = null, numero = null } = {}) {
  if (peutDeclarer !== true || !reponse || typeof numero !== 'string' || !numero) return false;
  if (reponse.pour !== numero) return false;
  if (reponse.issue === 'refuse') return !reponse.declare_le;
  if (reponse.issue === 'indisponible') return reponse.declarable === true;
  return false;
}

/* Les issues, par ton (le tableau du cahier §3.7). */
const REUSSITES = Object.freeze(['reconnu', 'declare', 'retire']);
const NOTES = Object.freeze(['deja_publie', 'deja_reconnu', 'rien_a_retirer']);
const DIRE_SANS_VIBRER = Object.freeze(['sans_engagement', 'non_refuse']);

/**
 * LE TON D'UNE ISSUE — `{ ton, retour, champ }` :
 *   - `ton` : `'reussite'` (vert), `'note'` (neutre) ou `'erreur'` (rouge) ;
 *   - `retour` : la vibration — `'reussite'`, `'echec'` ou `null` ;
 *   - `champ` : `'ferme_vide'` (fermé et vidé), `'ferme'` ou `'ouvert'`.
 * Une issue inconnue est une erreur : on ne dit pas « fait » d'une réponse
 * qu'on n'a pas comprise.
 */
export function presentationDeLIssueTva(issue) {
  if (REUSSITES.includes(issue)) return { ton: 'reussite', retour: 'reussite', champ: 'ferme_vide' };
  if (NOTES.includes(issue)) return { ton: 'note', retour: null, champ: 'ferme' };
  if (DIRE_SANS_VIBRER.includes(issue)) return { ton: 'erreur', retour: null, champ: 'ouvert' };
  return { ton: 'erreur', retour: 'echec', champ: 'ouvert' };
}
