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
import { resumeEntreprise } from './entreprise.js';

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

/**
 * La ligne sous le nom, sur « mon profil ». Jamais en contradiction avec le rappel.
 *
 * DEPUIS LE 15/10/2026 (section 45), ELLE LIT L'ENTREPRISE RATTACHÉE, et
 * plus jamais l'ancienne colonne `siret` — un champ libre, jamais
 * contrôlé, inventé sur les cinq fiches de la vraie base. Elle disait
 * « SIRET non renseigné » à un artisan qui venait de faire consulter le
 * sien au répertoire : le premier écran après l'inscription se
 * contredisait.
 *
 * `identite` vaut `undefined` tant qu'elle n'est pas lue : la ligne ne dit
 * alors rien de l'entreprise, plutôt que « jamais rattaché » à quelqu'un
 * qui l'est. `null` veut dire « lue, et aucune ».
 */
export function resumeVerification(pro, identite) {
  const siret = identite === undefined ? null : resumeEntreprise(identite);
  const nom = pieceAssurance(pro).court;
  const mots = {
    [VALIDE]: `${nom} à jour`,
    [ATTENTE]: `${nom} en cours de vérification`,
    [REFUSE]: `${nom} refusée`,
    [ABSENT]: `${nom} non renseignée`,
  };
  return siret ? `${siret} · ${mots[etatAssurance(pro)]}` : mots[etatAssurance(pro)];
}

/** Tout vert seulement quand les deux documents le sont. */
export function toutValide(pro) {
  return etatKbis(pro) === VALIDE && etatAssurance(pro) === VALIDE;
}

/* ==========================================================================
 *  LE BADGE SUSPENDU (lot S-a, 25/10/2026, décision D4 du propriétaire)
 *
 *  La BASE décide (`tient_le_profil_pro()`, point 4) : une pièce VALIDÉE
 *  dont le chemin change est suspendue ; si le badge était accordé, il est
 *  suspendu jusqu'à ce que l'administration ait regardé la nouvelle pièce,
 *  et les métiers restent figés d'ici là. Ces deux fonctions ne font que
 *  REDIRE la règle à l'écran — avant l'envoi pour prévenir, après l'envoi
 *  pour que l'état affiché suive sans attendre un rechargement (sinon on lit
 *  « À jour » à côté de « En attente »). Elles n'importent rien de React :
 *  `verifier-stockage` les fait tourner sur les mêmes cas que l'essai
 *  `essais-section-51a.sql`.
 * ========================================================================== */

/**
 * Envoyer ces pièces suspendrait-il le badge ? Seulement si le badge est
 * accordé ET qu'on envoie une pièce d'existence ou d'assurance validée.
 * JAMAIS pour un envoi RGE seul : le RGE ne fait pas le badge.
 */
export function envoiSuspendLeBadge(pro, { kbis = false, assurance = false } = {}) {
  if (!pro || !pro.verifie) return false;
  return (!!kbis && !!(pro.kbis && pro.kbis.valide))
    || (!!assurance && !!(pro.assurance && pro.assurance.valide));
}

/** La phrase de l'écran, écrite une fois. */
/* Ces trois phrases DISENT CE QUI SE PASSE SANS PROMETTRE L'ISSUE (relectures
   « écran » et « textes ») : après examen, l'administration rend le badge OU
   le refuse — et un refus invalide les pièces. « Votre badge reviendra »
   était une promesse que la base ne tient pas. Écrites ici, une fois. */
export const AVERTISSEMENT_SUSPENSION = 'Envoyer une nouvelle pièce suspend votre badge, '
  + 'jusqu’à ce que l’administration d’Opus vous le rende ou le refuse. '
  + 'Vos métiers restent figés pendant ce temps.';

/** Le rappel d'une fiche dont le badge est suspendu. */
export const RAPPEL_SUSPENSION = 'Vous avez remplacé ou retiré une pièce validée : votre '
  + 'badge reste suspendu jusqu’à ce que l’administration d’Opus vous le rende ou le '
  + 'refuse. Vos métiers restent figés d’ici là.';

/** Le verrou des métiers pendant une suspension. */
export const METIERS_FIGES_SUSPENSION = 'Vos métiers restent figés tant que votre badge est '
  + 'suspendu : s’il vous est rendu, il attestera les métiers qui ont été contrôlés.';

/**
 * La fiche telle que la base la rendra après l'envoi : même règle que
 * `tient_le_profil_pro()`, pour que l'écran n'affiche pas un état que la
 * base a déjà quitté. `maintenant` : la date à poser (la base pose la
 * sienne ; celle-ci ne sert qu'à l'affichage, jusqu'au prochain
 * rechargement).
 */
export function apresEnvoiDesPieces(pro, {
  kbisPath = null, assurancePath = null, rgePath = null, rge = null,
} = {}, maintenant = null) {
  if (!pro) return pro;
  const suite = {
    ...pro,
    kbisPath: kbisPath || pro.kbisPath || null,
    assurancePath: assurancePath || pro.assurancePath || null,
    rgePath: rgePath || pro.rgePath || null,
  };
  if (rge) {
    suite.rgeDeclare = !!rge.declare;
    suite.rgeNumero = rge.numero || '';
    suite.rgeExpire = rge.expire || '';
  }
  const kbisChange = !!kbisPath && kbisPath !== (pro.kbisPath || null);
  const assuranceChange = !!assurancePath && assurancePath !== (pro.assurancePath || null);
  const kbisSuspendu = kbisChange && !!(pro.kbis && pro.kbis.valide);
  const assuranceSuspendue = assuranceChange && !!(pro.assurance && pro.assurance.valide);

  if (kbisSuspendu || assuranceSuspendue) {
    if (kbisSuspendu) suite.kbis = { valide: false, maj: null };
    if (assuranceSuspendue) suite.assurance = { valide: false, expire: null };
    suite.verificationStatut = (suite.kbisPath || suite.assurancePath) ? 'en_attente' : 'non_soumis';
    if (pro.verifie) {
      suite.verifie = false;
      suite.verifieLe = null;
      suite.badgeSuspenduLe = maintenant || new Date().toISOString();
    }
    return suite;
  }
  /* Rien de validé n'a changé : une pièce nouvelle (ou une première pièce)
     met la fiche « en attente », sauf si elle reste vérifiée — renvoyer le
     même chemin ne change rien. Un envoi RGE seul ne touche pas au statut. */
  if ((kbisChange || assuranceChange) && !pro.verifie) suite.verificationStatut = 'en_attente';
  return suite;
}

/** Les métiers sont figés : badge accordé, ou suspendu le temps d'un examen. */
export function metiersFiges(pro) {
  return !!(pro && (pro.verifie || pro.badgeSuspenduLe));
}
