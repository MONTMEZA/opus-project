/**
 * Un seul endroit décide de ce qu'on affiche comme « vérifié ».
 *
 * La règle, côté métier :
 *   - la première pièce prouve l'existence légale de l'entreprise, donc son
 *     SIRET. Tant qu'elle n'est pas validée, on n'écrit nulle part que le
 *     SIRET est vérifié. **Son NOM dépend de qui la fournit** : un extrait
 *     Kbis pour une société, un avis de situation SIRENE pour un
 *     micro-entrepreneur — qui n'a pas de Kbis, et que l'ancien libellé
 *     arrêtait net ;
 *   - la seconde prouve la COUVERTURE. Même logique, et là aussi le nom
 *     dépend du métier : décennale pour qui construit, responsabilité
 *     civile professionnelle pour qui conseille. Un avocat ne peut pas
 *     avoir de décennale ; lui en réclamer une lui fermait le badge pour
 *     toujours (voir `src/data/pieces-justificatives.js`) ;
 *   - le badge « vérifié » du profil exige les deux. La base de données le
 *     garantit (fonction synchronise_verification dans supabase/schema.sql),
 *     l'application se contente de lire.
 *
 * Avant, l'écran « mon profil » écrivait « SIRET … vérifié » en dur, alors
 * que le rappel juste en dessous réclamait les documents. Deux textes qui se
 * contredisaient sur le même écran : c'est ce que ce module supprime.
 */

import { EXISTENCE, assuranceAttendue } from '../data/pieces-justificatives.js';
import { metiersDe } from './metiers.js';

export const VALIDE = 'valide';
export const ATTENTE = 'attente';
export const REFUSE = 'refuse';
export const ABSENT = 'absent';

function etat(envoye, valide, statut) {
  if (valide) return VALIDE;
  if (statut === 'refuse' && envoye) return REFUSE;
  if (envoye || statut === 'en_attente') return ATTENTE;
  return ABSENT;
}

export function etatKbis(pro) {
  return etat(!!pro.kbisPath, !!(pro.kbis && pro.kbis.valide), pro.verificationStatut);
}

export function etatAssurance(pro) {
  return etat(!!pro.assurancePath, !!(pro.assurance && pro.assurance.valide), pro.verificationStatut);
}

/** Le détail affiché dans le bloc « Informations vérifiées ». */
export function detailDocument(pro, doc) {
  const e = doc === 'kbis' ? etatKbis(pro) : etatAssurance(pro);

  if (e === VALIDE) {
    if (doc === 'kbis') {
      return { etat: e, valeur: pro.kbis.maj ? `À jour · maj ${pro.kbis.maj}` : 'À jour' };
    }
    return { etat: e, valeur: pro.assurance.expire ? `À jour · exp. ${pro.assurance.expire}` : 'À jour' };
  }
  if (e === ATTENTE) return { etat: e, valeur: 'Reçu · en cours de vérification' };
  if (e === REFUSE) return { etat: e, valeur: 'Refusé' };
  return { etat: e, valeur: doc === 'kbis' ? 'Non communiqué' : 'Non communiquée' };
}

/**
 * La certification RGE — et pourquoi elle ne se lit PAS comme les deux
 * autres documents.
 *
 * Le Kbis et l'assurance décennale sont obligatoires : leur absence est un
 * manque, et s'affiche en rouge. Le RGE ne l'est pas. Un carreleur, un
 * serrurier, un terrassier n'ont aucune raison d'en avoir une, et il serait
 * injuste que leur fiche affiche un feu rouge pour un label qui ne les
 * concerne pas. D'où le drapeau `neutre` : même ligne, même place, mais en
 * gris — « non communiquée », et non « manquant ».
 *
 * Le label lui-même ne s'allume (`pro.rge`) que lorsqu'un humain a regardé
 * l'attestation. Entre les deux, il y a l'état « déclarée » : l'artisan l'a
 * dite, elle n'est pas encore contrôlée, et on l'écrit tel quel.
 */
export function etatRge(pro) {
  if (pro.rge) return VALIDE;
  if (pro.verificationStatut === 'refuse' && pro.rgePath) return REFUSE;
  if (pro.rgeDeclare || pro.rgePath) return ATTENTE;
  return ABSENT;
}

export function detailRge(pro) {
  const e = etatRge(pro);
  if (e === VALIDE) {
    return { etat: e, valeur: pro.rgeExpire ? `Certifié · exp. ${pro.rgeExpire}` : 'Certifié' };
  }
  if (e === ATTENTE) return { etat: e, valeur: 'Déclarée · en cours de vérification' };
  if (e === REFUSE) return { etat: e, valeur: 'Refusée' };
  return { etat: e, valeur: 'Non communiquée', neutre: true };
}

const MOT_SIRET = {
  [VALIDE]: 'vérifié',
  [ATTENTE]: 'en cours de vérification',
  [REFUSE]: 'non vérifié',
  [ABSENT]: 'non vérifié',
};

/**
 * LES DEUX PIÈCES, NOMMÉES POUR CE PROFESSIONNEL-LÀ.
 *
 * Elles ne changent ni de nombre ni de place en base : `kbis_url` et
 * `assurance_url` restent les deux emplacements, et
 * `synchronise_verification()` continue d'exiger les deux. Seul le LIBELLÉ
 * suit le métier.
 */
export function pieceExistence() {
  return EXISTENCE;
}

export function pieceAssurance(pro) {
  return assuranceAttendue(metiersDe(pro));
}

/** La ligne sous le nom, sur « mon profil ». Jamais en contradiction avec le rappel. */
export function resumeVerification(pro) {
  const kbis = etatKbis(pro);
  const siret = pro.siret
    ? `SIRET ${pro.siret} ${MOT_SIRET[kbis]}`
    : 'SIRET non renseigné';
  const nom = pieceAssurance(pro).court;
  const mots = {
    [VALIDE]: `${nom} à jour`,
    [ATTENTE]: `${nom} en cours de vérification`,
    [REFUSE]: `${nom} refusée`,
    [ABSENT]: `${nom} non renseignée`,
  };
  return `${siret} · ${mots[etatAssurance(pro)]}`;
}

/** Tout vert seulement quand les deux documents le sont. */
export function toutValide(pro) {
  return etatKbis(pro) === VALIDE && etatAssurance(pro) === VALIDE;
}
