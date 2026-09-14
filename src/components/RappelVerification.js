/**
 * Rappel affiché au professionnel tant qu'il n'a pas obtenu le badge vérifié.
 *
 * Non bloquant, mais impossible à oublier : il apparaît en tête de son fil
 * et sur son propre profil. Il disparaît de lui-même une fois le profil
 * vérifié — c'est la seule récompense visible, et c'est ce qui motive l'envoi.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F } from '../theme';
import { ShieldCheck, ShieldX, FileText, ChevronRight } from './icons';

const ETATS = {
  non_soumis: {
    couleur: C.accent,
    Icone: FileText,
    titre: 'Obtenez le badge vérifié',
    texte: "Envoyez votre extrait Kbis et votre attestation d'assurance décennale. "
      + "Les particuliers font deux fois plus confiance à un profil vérifié.",
    action: 'Envoyer mes documents',
  },
  en_attente: {
    couleur: C.accent2,
    Icone: FileText,
    titre: 'Vérification en cours',
    texte: "Vos documents sont bien arrivés. Nous les examinons — le badge apparaîtra "
      + 'sur votre profil dès validation.',
    action: 'Voir mes documents',
  },
  refuse: {
    couleur: C.bad,
    Icone: ShieldX,
    titre: 'Documents refusés',
    texte: "Vos justificatifs n'ont pas pu être validés. Envoyez-en de nouveaux "
      + 'pour obtenir le badge vérifié.',
    action: 'Renvoyer mes documents',
  },
};

export default function RappelVerification({ statut, note, onAction, style }) {
  // Profil vérifié : plus rien à rappeler.
  if (!statut || statut === 'verifie') return null;

  const e = ETATS[statut] || ETATS.non_soumis;

  return (
    <Pressable style={[s.carte, { borderLeftColor: e.couleur }, style]} onPress={onAction}>
      <View style={s.haut}>
        <e.Icone size={16} color={e.couleur} />
        <Text style={[s.titre, { color: e.couleur }]}>{e.titre}</Text>
      </View>
      <Text style={s.texte}>{e.texte}</Text>
      {!!note && <Text style={s.note}>Motif : {note}</Text>}
      <View style={s.action}>
        <Text style={[s.actionTexte, { color: e.couleur }]}>{e.action}</Text>
        <ChevronRight size={13} color={e.couleur} />
      </View>
    </Pressable>
  );
}

/** Version publique, visible par les particuliers sur le profil d'un pro. */
export function EtatVerificationPublic({ pro }) {
  const verifie = pro.verificationStatut === 'verifie' || pro.verifie;

  if (verifie) {
    return (
      <View style={[s.public, { borderLeftColor: C.ok }]}>
        <ShieldCheck size={16} color={C.ok} />
        <View style={{ flex: 1 }}>
          <Text style={[s.publicTitre, { color: C.ok }]}>Profil vérifié par Opus</Text>
          <Text style={s.publicTexte}>
            Extrait Kbis et attestation d'assurance contrôlés
            {pro.verifieLe ? ` le ${formatDate(pro.verifieLe)}` : ''}.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.public, { borderLeftColor: C.bad }]}>
      <ShieldX size={16} color={C.bad} />
      <View style={{ flex: 1 }}>
        <Text style={[s.publicTitre, { color: C.bad }]}>Profil non vérifié</Text>
        <Text style={s.publicTexte}>
          Ce professionnel n'a pas encore fourni son extrait Kbis ni son attestation
          d'assurance décennale. Demandez-les-lui avant tout engagement.
        </Text>
      </View>
    </View>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR');
}

const s = StyleSheet.create({
  carte: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, padding: 12,
  },
  haut: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  titre: { fontFamily: F.oswald6, fontSize: 13 },
  texte: { fontSize: 11.5, color: C.muted, lineHeight: 17, marginTop: 5, fontFamily: F.inter },
  note: { fontSize: 11.5, color: C.bad, lineHeight: 17, marginTop: 5, fontFamily: F.inter6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 9 },
  actionTexte: { fontFamily: F.oswald6, fontSize: 11.5 },

  public: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, padding: 11, marginHorizontal: 16, marginBottom: 8,
  },
  publicTitre: { fontFamily: F.inter6, fontSize: 12.5 },
  publicTexte: { fontSize: 11.5, color: C.muted, lineHeight: 16, marginTop: 3, fontFamily: F.inter },
});
