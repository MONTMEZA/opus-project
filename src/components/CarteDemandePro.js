/**
 * LA DEMANDE DE COMPTE PROFESSIONNEL, SUR LE PROFIL D'UN PARTICULIER.
 *
 * POURQUOI ELLE EST ICI, ET LUE EN BASE
 * -------------------------------------
 * La porte de secours ouvre un compte PARTICULIER avec une demande que
 * l'administration examinera (section 45.4). Sans cette carte, le profil
 * disait « Particulier » et rien d'autre : l'artisan ne savait ni où en
 * était sa demande, ni comment joindre un justificatif, ni comment
 * l'annuler. Relevé par la relecture du plan, et c'est le défaut du 01/10
 * vu de l'autre côté — une demande qui part, et dont on n'entend plus
 * parler.
 *
 * Elle est lue EN BASE (`maDemandePro`), jamais déduite de l'état local :
 * une demande perdue en silence — une métadonnée malformée que la base a
 * avalée pour ne pas coûter le compte — ne doit pas avoir l'air envoyée.
 * Sans ligne en base, la carte propose simplement de passer pro.
 *
 * TROIS ÉTATS, TROIS CARTES
 * -------------------------
 *   - en attente : ce qui a été demandé, le justificatif, « Revérifier mon
 *     SIRET » (le chemin automatique reste ouvert, et il clôt la demande),
 *     « Annuler » ;
 *   - refusée : la note de l'administration, et « Faire une nouvelle
 *     demande » ;
 *   - aucune, ou close : la rangée « Je suis artisan : passer en compte
 *     professionnel ».
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne,
} from '../theme';
import { BtnMain, BtnMini } from './ui';
import { Clock, FileText, Building, ChevronRight, X } from './icons';
import { formaterSiret, libelleMotif } from '../lib/siret';
import { dateFrancaise } from '../lib/entreprise';
import { choisirDocument } from '../lib/media';
import { messageClair } from '../lib/erreurs';

export default function CarteDemandePro({
  demande, etat, onRecharger, onPasserPro, onJoindre, onAnnuler, onEntrerEnPro, onErreur,
}) {
  const [envoi, setEnvoi] = useState(null);
  const [confirmer, setConfirmer] = useState(false);

  /* Pendant la lecture, RIEN : écrire « passer en compte professionnel »
     à quelqu'un dont la demande attend serait la promesse inverse. */
  if (etat === 'jamais' || etat === 'charge') return null;

  if (etat === 'echec') {
    return (
      <View style={[s.carte, s.carteNeutre]}>
        <Text style={s.texte}>
          Votre demande de compte professionnel n’a pas pu être lue. Ce n’est pas
          qu’il n’y en a pas : réessayez.
        </Text>
        <BtnMini outline label="Réessayer" onPress={onRecharger} style={s.cible} />
      </View>
    );
  }

  if (demande && demande.statut === 'acceptee') {
    /* Acceptée, mais l'application tourne encore en particulier : la
       session n'a pas suivi. Un geste suffit, et il ne faut pas le cacher
       derrière « passer en compte professionnel », qui recommencerait tout. */
    return (
      <View style={[s.carte, s.carteOk]}>
        <Text style={s.titre}>Votre compte professionnel est ouvert</Text>
        <BtnMain block label="Entrer dans mon espace d’artisan" onPress={onEntrerEnPro} />
      </View>
    );
  }

  if (!demande || demande.statut === 'annulee') {
    return (
      <Pressable
        onPress={() => onPasserPro('')}
        accessibilityRole="button"
        accessibilityLabel="Je suis artisan : passer en compte professionnel"
        style={({ pressed }) => [s.rangee, pressed && APPUI.discret]}
      >
        <Building size={16} color={C.accent2} />
        <Text style={s.rangeeTexte}>Je suis artisan : passer en compte professionnel</Text>
        <ChevronRight size={15} color={C.muted} />
      </Pressable>
    );
  }

  const enTete = [demande.entreprise, `SIRET ${formaterSiret(demande.siret)}`]
    .filter(Boolean).join(' · ');

  if (demande.statut === 'refusee') {
    return (
      <View style={[s.carte, s.carteRefus]}>
        <Text style={s.titre}>Demande de compte professionnel non acceptée</Text>
        <Text style={s.ligne}>{enTete}</Text>
        {!!demande.note && <Text style={s.note}>{demande.note}</Text>}
        <Text style={s.texte}>
          Votre compte reste un compte particulier. Vous pouvez refaire une demande,
          ou supprimer votre compte à tout moment.
        </Text>
        <BtnMain block label="Faire une nouvelle demande" onPress={() => onPasserPro(demande.siret)} />
      </View>
    );
  }

  /* --- en attente --- */
  const joindre = async () => {
    if (envoi) return;
    try {
      const doc = await choisirDocument();
      if (!doc) return;
      setEnvoi('justificatif');
      await onJoindre(doc);
    } catch (e) {
      if (onErreur) onErreur(messageClair(e, 'Le fichier n’a pas pu être ouvert'));
    } finally {
      setEnvoi(null);
    }
  };

  const annuler = async () => {
    if (envoi) return;
    setEnvoi('annulation');
    try { await onAnnuler(); } finally { setEnvoi(null); setConfirmer(false); }
  };

  return (
    <View style={[s.carte, s.carteAttente]}>
      <View style={s.haut}>
        <Clock size={16} color={C.accent2} />
        <Text style={s.titre}>Compte professionnel en attente</Text>
      </View>
      <Text style={s.ligne}>{enTete}</Text>
      <Text style={s.texte}>
        Demandé le {dateFrancaise(demande.created_at) || '—'} · {libelleMotif(demande.motif)}.
        {' '}Opus vous répondra dans vos notifications.
      </Text>

      <View style={s.piece}>
        <FileText size={15} color={demande.justificatif ? C.ok : C.muted} />
        <Text style={s.pieceTexte}>
          {demande.justificatif
            ? 'Justificatif joint — lisible par vous et l’administration d’Opus seulement.'
            : 'Aucun justificatif joint. Le plus utile est une pièce que seul le titulaire '
              + 'possède : une attestation d’assurance à votre nom, ou votre attestation de '
              + 'vigilance URSSAF.'}
        </Text>
      </View>
      <Text style={s.aide}>
        N’envoyez jamais ce document par message : ici, il reste dans un espace privé.
      </Text>

      <BtnMain
        block
        label={envoi === 'justificatif' ? 'Envoi…'
          : demande.justificatif ? 'Remplacer le justificatif' : 'Joindre un justificatif'}
        onPress={joindre}
        disabled={!!envoi}
      />
      <BtnMini
        outline
        label="Revérifier mon SIRET"
        /* `demandeEnAttente` : l'écran ne propose plus la porte de secours.
           Elle échouait à coup sûr — une seule demande ouverte par compte —
           après qu'on avait tout rempli (relecture adverse, mesuré). */
        onPress={() => onPasserPro(demande.siret, { demandeEnAttente: true })}
        style={s.cible}
      />

      {confirmer ? (
        <View style={s.confirmer}>
          <Text style={s.texte}>Annuler cette demande ? Vous pourrez en refaire une.</Text>
          <View style={s.boutons}>
            <BtnMini
              outline
              label={envoi === 'annulation' ? 'Annulation…' : 'Oui, annuler'}
              onPress={annuler}
              disabled={!!envoi}
              style={s.cible}
            />
            <BtnMini outline label="Non" onPress={() => setConfirmer(false)} style={s.cible} />
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => setConfirmer(true)}
          accessibilityRole="button"
          accessibilityLabel="Annuler ma demande de compte professionnel"
          style={({ pressed }) => [s.lien, pressed && APPUI.discret]}
        >
          <X size={13} color={C.bad} />
          <Text style={s.lienTexte}>Annuler ma demande</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  /* La carte PORTE l'information : angle vif, et un BORD qui dit son état
     — jamais un fond teinté derrière le texte qu'on vient lire. */
  carte: {
    gap: S.sm, padding: S.md, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.line, borderLeftWidth: S.xs, borderRadius: R.vif,
  },
  carteAttente: { borderLeftColor: C.accent2 },
  carteRefus: { borderLeftColor: C.bad },
  carteOk: { borderLeftColor: C.ok },
  carteNeutre: { borderLeftColor: C.line },
  haut: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  titre: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  ligne: {
    fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
  },
  texte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.muted, lineHeight: interligne(T.courant),
  },
  note: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant),
    borderLeftWidth: S.xs, borderLeftColor: C.bad, paddingLeft: S.sm,
  },
  piece: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  pieceTexte: {
    flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
  },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  /* 44 points par la BOÎTE, dans les DEUX sens : `BtnMini` s'arrête à 36
     et compte sur `hitSlop`, que le navigateur ignore. Et un libellé court
     (« Non ») donnait une cible de 43 de large — mesuré. */
  cible: { minHeight: TOUCHE, minWidth: TOUCHE },
  confirmer: { gap: S.sm },
  boutons: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  lien: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    minHeight: TOUCHE, alignSelf: 'flex-start',
  },
  lienTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.bad },

  /* La rangée « passer pro » : la même forme que les réglages du compte. */
  rangee: {
    flexDirection: 'row', alignItems: 'center', gap: S.md, minHeight: TOUCHE,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    paddingVertical: S.md, paddingHorizontal: S.md,
  },
  rangeeTexte: { flex: 1, minWidth: 0, fontFamily: F.inter5, fontSize: T.courant, color: C.ink },
});
