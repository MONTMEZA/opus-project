/**
 * Rappel affiché au professionnel tant qu'il n'a pas obtenu le badge vérifié.
 *
 * Non bloquant, mais impossible à oublier : il apparaît en tête de son fil
 * et sur son propre profil. Il disparaît de lui-même une fois le profil
 * vérifié — c'est la seule récompense visible, et c'est ce qui motive l'envoi.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T,
} from '../theme';
import { ShieldCheck, ShieldX, FileText, ChevronRight } from './icons';
import {
  toutValide, etatKbis, etatAssurance, ATTENTE, VALIDE,
  pieceExistence, pieceAssurance,
} from '../lib/verification';

const ETATS = {
  non_soumis: {
    couleur: C.accent,
    Icone: FileText,
    titre: 'Obtenez le badge vérifié',
    /* Le texte dépend du MÉTIER (un avocat n'a pas de décennale), donc il
       se calcule. La table ne garde que ce qui est vraiment commun. */
    texte: (pro) => `Envoyez votre ${pieceExistence().nom.toLowerCase()} et votre `
      + `attestation — ${pieceAssurance(pro).nom.toLowerCase()}. `
      + 'Les particuliers font deux fois plus confiance à un profil vérifié.',
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

export default function RappelVerification({ statut, note, onAction, style, pro = null }) {
  // Profil vérifié : plus rien à rappeler.
  if (!statut || statut === 'verifie') return null;

  const e = ETATS[statut] || ETATS.non_soumis;
  /* Certains textes dépendent du métier — un avocat n'a pas de décennale.
     `pro` peut manquer (un appel ancien) : `pieceAssurance(null)` rend alors
     la décennale, qui est le bon défaut dans une application du bâtiment. */
  const texte = typeof e.texte === 'function' ? e.texte(pro) : e.texte;

  return (
    <Pressable style={[s.carte, { borderLeftColor: e.couleur }, style]} onPress={onAction}>
      <View style={s.haut}>
        <e.Icone size={16} color={e.couleur} />
        <Text style={[s.titre, { color: e.couleur }]}>{e.titre}</Text>
      </View>
      <Text style={s.texte}>{texte}</Text>
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
  // Même source que le reste de l'application : le badge n'apparaît que si
  // les deux documents sont réellement validés.
  const verifie = toutValide(pro);
  const enCours = !verifie
    && (etatKbis(pro) === ATTENTE || etatAssurance(pro) === ATTENTE);

  if (verifie) {
    return (
      <View style={[s.public, { borderLeftColor: C.ok }]}>
        <ShieldCheck size={16} color={C.ok} />
        <View style={{ flex: 1 }}>
          <Text style={[s.publicTitre, { color: C.ok }]}>Profil vérifié par Opus</Text>
          <Text style={s.publicTexte}>
            {pieceExistence().court} et {pieceAssurance(pro).court.toLowerCase()} contrôlés
            {pro.verifieLe ? ` le ${formatDate(pro.verifieLe)}` : ''}.
          </Text>
        </View>
      </View>
    );
  }

  if (enCours) {
    return (
      <View style={[s.public, { borderLeftColor: C.accent2 }]}>
        <FileText size={16} color={C.accent2} />
        <View style={{ flex: 1 }}>
          <Text style={[s.publicTitre, { color: C.accent2 }]}>Vérification en cours</Text>
          <Text style={s.publicTexte}>
            Ce professionnel a transmis ses justificatifs. Ils sont en cours de
            contrôle : le badge vérifié n'est pas encore accordé.
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
          {texteManquant(pro)} Demandez-{manquantsDe(pro).length > 1 ? 'les' : 'le'}-lui
          avant tout engagement.
        </Text>
      </View>
    </View>
  );
}

/** Ne nomme que les justificatifs réellement manquants. */
function manquantsDe(pro) {
  const liste = [];
  if (etatKbis(pro) !== VALIDE) liste.push(`son ${pieceExistence().nom.toLowerCase()}`);
  if (etatAssurance(pro) !== VALIDE) liste.push(`son attestation — ${pieceAssurance(pro).nom.toLowerCase()}`);
  return liste;
}

function texteManquant(pro) {
  const liste = manquantsDe(pro);
  if (liste.length === 0) return 'Les justificatifs de ce professionnel sont incomplets.';
  if (liste.length === 1) return `Ce professionnel n'a pas fourni ${liste[0]}.`;
  return `Ce professionnel n'a fourni ni ${liste[0]} ni ${liste[1]}.`;
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
  titre: { fontFamily: F.oswald6, fontSize: T.corps },
  texte: { fontSize: T.courant, color: C.muted, lineHeight: 17, marginTop: 5, fontFamily: F.inter },
  note: { fontSize: T.courant, color: C.bad, lineHeight: 17, marginTop: 5, fontFamily: F.inter6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 9 },
  actionTexte: { fontFamily: F.oswald6, fontSize: T.courant },

  public: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 4, padding: 11, marginHorizontal: 16, marginBottom: 8,
  },
  publicTitre: { fontFamily: F.inter6, fontSize: T.corps },
  publicTexte: { fontSize: T.courant, color: C.muted, lineHeight: 16, marginTop: 3, fontFamily: F.inter },
});
