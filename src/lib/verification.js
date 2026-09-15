/**
 * Un seul endroit décide de ce qu'on affiche comme « vérifié ».
 *
 * La règle, côté métier :
 *   - l'extrait Kbis est ce qui prouve l'existence légale de l'entreprise,
 *     donc son SIRET. Tant qu'il n'est pas validé, on n'écrit nulle part
 *     que le SIRET est vérifié ;
 *   - l'attestation décennale prouve la couverture. Même logique ;
 *   - le badge « vérifié » du profil exige les deux. La base de données le
 *     garantit (fonction synchronise_verification dans supabase/schema.sql),
 *     l'application se contente de lire.
 *
 * Avant, l'écran « mon profil » écrivait « SIRET … vérifié » en dur, alors
 * que le rappel juste en dessous réclamait les documents. Deux textes qui se
 * contredisaient sur le même écran : c'est ce que ce module supprime.
 */

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

const MOT_SIRET = {
  [VALIDE]: 'vérifié',
  [ATTENTE]: 'en cours de vérification',
  [REFUSE]: 'non vérifié',
  [ABSENT]: 'non vérifié',
};

const MOT_ASSURANCE = {
  [VALIDE]: 'Assurance décennale à jour',
  [ATTENTE]: 'Assurance en cours de vérification',
  [REFUSE]: 'Assurance refusée',
  [ABSENT]: 'Assurance non renseignée',
};

/** La ligne sous le nom, sur « mon profil ». Jamais en contradiction avec le rappel. */
export function resumeVerification(pro) {
  const kbis = etatKbis(pro);
  const siret = pro.siret
    ? `SIRET ${pro.siret} ${MOT_SIRET[kbis]}`
    : 'SIRET non renseigné';
  return `${siret} · ${MOT_ASSURANCE[etatAssurance(pro)]}`;
}

/** Tout vert seulement quand les deux documents le sont. */
export function toutValide(pro) {
  return etatKbis(pro) === VALIDE && etatAssurance(pro) === VALIDE;
}
