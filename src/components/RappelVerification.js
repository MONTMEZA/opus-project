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
  C, F, T, S, interligne,
} from '../theme';
import { ShieldCheck, ShieldX, FileText, ChevronRight, Check } from './icons';
import {
  toutValide, etatKbis, etatAssurance, ATTENTE, VALIDE,
  pieceExistence, pieceAssurance, RAPPEL_SUSPENSION,
} from '../lib/verification';
import { enMilieuDePhrase } from '../lib/texte';

const ETATS = {
  non_soumis: {
    couleur: C.accent,
    Icone: FileText,
    titre: 'Obtenez le badge vérifié',
    /* Le texte dépend du MÉTIER (un avocat n'a pas de décennale), donc il
       se calcule. La table ne garde que ce qui est vraiment commun. */
    texte: (pro) => `Envoyez votre ${enMilieuDePhrase(pieceExistence().nom)} et votre `
      + `attestation — ${enMilieuDePhrase(pieceAssurance(pro).nom)}. `
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

const SUSPENDU = {
  couleur: C.accent2,
  Icone: FileText,
  titre: 'Badge suspendu',
  texte: RAPPEL_SUSPENSION,
  action: 'Voir mes documents',
};

/**
 * DEPUIS LE 15/10/2026 (section 45), LE RAPPEL A DEUX ÉTAPES.
 *
 * Il réclamait « votre extrait Kbis ou avis SIRENE » à un artisan dont
 * l'entreprise venait d'être trouvée au répertoire : on lui redemandait,
 * sans dire pourquoi, ce qu'Opus semblait savoir déjà. Les deux ne prouvent
 * pas la même chose — le répertoire dit que l'entreprise EXISTE, le badge
 * dit qu'un humain a VU les pièces de celui qui la déclare — et le rappel le
 * dit désormais, en deux lignes.
 *
 * `identite` : l'entreprise rattachée, `null` s'il n'y en a pas, et
 * `undefined` tant qu'elle n'est pas lue — la première étape ne s'affiche
 * alors pas, plutôt que de dire « aucune » à tort. Et « aucune », jamais
 * « jamais » : une entreprise retirée par l'administration a été rattachée
 * (relecture adverse du 15/10).
 */
export default function RappelVerification({
  statut, note, onAction, style, pro = null, identite,
}) {
  // Profil vérifié : plus rien à rappeler.
  if (!statut || statut === 'verifie') return null;

  /* LE BADGE SUSPENDU (lot S-a) : la fiche était vérifiée, une nouvelle
     pièce est partie. « Vérification en cours » laissait croire à une
     première demande, et ne disait pas pourquoi le badge avait disparu. */
  const suspendu = !!(pro && pro.badgeSuspenduLe) && statut !== 'refuse';
  const e = suspendu ? SUSPENDU : (ETATS[statut] || ETATS.non_soumis);
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
      {identite !== undefined && (
        <View style={s.etapes}>
          <View style={s.etape}>
            {identite ? <Check size={13} color={C.ok} /> : <FileText size={13} color={C.muted} />}
            <Text style={s.etapeTexte}>
              {identite
                ? (identite.source === 'administration'
                  ? '1. Entreprise rattachée par l’administration d’Opus'
                  : '1. Entreprise active au répertoire Sirene')
                : '1. Entreprise : aucune rattachée (Modifier mon profil → Mon entreprise)'}
            </Text>
          </View>
          <View style={s.etape}>
            <FileText size={13} color={e.couleur} />
            <Text style={s.etapeTexte}>
              2. Vos pièces — le répertoire dit que l’entreprise existe ; le badge
              dit qu’un humain a vu vos documents.
            </Text>
          </View>
        </View>
      )}
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
            {pieceExistence().court} et {enMilieuDePhrase(pieceAssurance(pro).court)} contrôlés
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
  if (etatKbis(pro) !== VALIDE) liste.push(`son ${enMilieuDePhrase(pieceExistence().nom)}`);
  if (etatAssurance(pro) !== VALIDE) liste.push(`son attestation — ${enMilieuDePhrase(pieceAssurance(pro).nom)}`);
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
  etapes: { gap: S.xs, marginTop: S.sm },
  etape: { flexDirection: 'row', alignItems: 'flex-start', gap: S.sm },
  etapeTexte: {
    flex: 1, minWidth: 0, fontFamily: F.inter5, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant),
  },
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
