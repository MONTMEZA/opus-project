/**
 * « Pour moi » — qui veut me faire travailler.
 *
 * POURQUOI CET ÉCRAN EXISTE
 * -------------------------
 * Jusqu'au 01/10/2026, il n'existait pas. Un client remplissait une demande
 * de devis, de rappel ou une urgence ; la base enregistrait la ligne ; et
 * personne ne la relisait jamais. Trois tables écrites, aucune lue. Pendant
 * ce temps, l'application affichait au client « l'artisan est prévenu ».
 *
 * C'est le défaut le plus grave de tout l'audit, et ce n'est pas une
 * question d'apparence : c'est la promesse du produit.
 *
 * POURQUOI UNE SEULE LISTE POUR TROIS FORMULAIRES
 * -----------------------------------------------
 * Un artisan ne range pas sa journée par type de formulaire. Il ouvre son
 * téléphone entre deux chantiers et veut savoir QUI l'attend, dans l'ordre
 * où c'est arrivé. Le genre devient donc une couleur de bandeau — comme sur
 * la Place des pros —, pas un onglet de plus.
 *
 * L'ORDRE N'EST PAS LA DATE SEULE
 * -------------------------------
 * Une urgence encore en attente passe devant tout le reste : c'est la seule
 * demande qui se périme. Un devis d'hier reste utile demain ; une fuite
 * d'eau, non. Pour le reste, le plus récent d'abord.
 *
 * ET ACCEPTER N'EST PAS UN BOUTON ANODIN
 * --------------------------------------
 * C'est lui qui rend un avis « client vérifié » (déclencheur
 * `calcule_client_verifie` en base). C'est l'argument d'Opus contre un
 * groupe Facebook, et il se joue ici. L'écran le dit.
 */
import React, { useState } from 'react';
import {
  View, Text, FlatList, Pressable, Linking, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, APPUI, interligne, surFond, CARTE, GOUTTIERE,
} from '../theme';
import { Avatar, BtnMini, EmptyState, SectionLabel } from '../components/ui';
import { Phone, Check, X, Clock, AlertTriangle } from '../components/icons';
import { nomMetier } from '../lib/metiers';
import { libelleBudget } from '../data/annonces';
import { METIERS_SOS } from '../data/urgences';

/**
 * LE MÉTIER NE SE NOMME PAS PAREIL SELON L'ORIGINE, et c'est un piège réel :
 * `quote_requests.metier` porte une clé du CATALOGUE (`macon`), tandis que
 * `sos_requests.metier_key` porte une clé d'URGENCE (`plomberie`, pas
 * `plombier`). Passer les deux par `nomMetier()` affichait « plomberie »
 * brut à l'écran — exactement la faute que `captures-metiers.mjs` traque
 * depuis le 30/09 : une clé affichée ressemble à une faute de frappe, donc
 * personne ne la signale.
 */
export function nomDuMetier(demande) {
  if (!demande.metier) return null;
  if (demande.genre === 'sos') {
    const m = METIERS_SOS.find((x) => x.key === demande.metier);
    return m ? m.label : nomMetier(demande.metier);
  }
  return nomMetier(demande.metier);
}

/* Le bandeau dit d'un coup d'œil de quoi il s'agit. Les couleurs sont
   celles du thème, et le rouge brique est réservé à l'urgence — c'est déjà
   le code du SOS partout ailleurs dans l'application. */
const GENRES = {
  sos: {
    titre: 'URGENCE', fond: C.sos, Icone: AlertTriangle,
    aide: 'Une urgence se périme. Répondez, même pour refuser.',
  },
  devis: {
    titre: 'Demande de devis', fond: C.accent2, Icone: Clock,
    aide: null,
  },
  rappel: {
    titre: 'Demande de rappel', fond: C.accent, Icone: Phone,
    aide: null,
  },
};

/* Les mots de la base ne sont pas ceux de l'écran : 'accepte' pour un devis,
   'acceptee' pour une urgence. On lit les deux, on n'en écrit aucun. */
const EN_ATTENTE = ['en_attente', 'envoyee'];
const ACCEPTEE = ['accepte', 'acceptee'];
const REFUSEE = ['refuse', 'refusee'];

const estEnAttente = (d) => EN_ATTENTE.includes(d.statut);
const estAcceptee = (d) => ACCEPTEE.includes(d.statut);
const estRefusee = (d) => REFUSEE.includes(d.statut);

export function compterEnAttente(demandes = []) {
  return demandes.filter(estEnAttente).length;
}

/**
 * Le tri, isolé pour être contrôlable par `npm run verifier-demandes` :
 * une urgence en attente d'abord, le reste par date décroissante.
 */
export function trierDemandes(demandes = []) {
  const urgent = (d) => (d.genre === 'sos' && estEnAttente(d) ? 0 : 1);
  return [...demandes].sort((a, b) => {
    const u = urgent(a) - urgent(b);
    if (u !== 0) return u;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

export default function DemandesRecuesScreen({
  demandes = [], chargement = false, onRepondre, onAppeler, onVoirProfil,
}) {
  if (chargement) {
    return <EmptyState>Chargement de vos demandes…</EmptyState>;
  }
  if (!demandes.length) {
    return (
      <EmptyState>
        Aucune demande pour le moment. C'est ici qu'arriveront les devis, les
        rappels et les urgences qu'on vous adresse — et vous serez prévenu
        par une notification.
      </EmptyState>
    );
  }

  const liste = trierDemandes(demandes);
  const enAttente = compterEnAttente(liste);

  return (
    <FlatList
      style={s.pad}
      data={liste}
      keyExtractor={(d) => `${d.genre}-${d.id}`}
      /* Les réglages que CLAUDE.md impose à toute liste longue. Un artisan
         qui travaille depuis six mois en a des centaines. */
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      windowSize={5}
      contentContainerStyle={{ paddingBottom: 32 }}
      ListHeaderComponent={(
        <SectionLabel>
          {enAttente > 0
            ? `${enAttente} demande${enAttente > 1 ? 's' : ''} à traiter`
            : 'Tout est traité'}
        </SectionLabel>
      )}
      renderItem={({ item }) => (
        <Demande
          d={item}
          onRepondre={onRepondre}
          onAppeler={onAppeler}
          onVoirProfil={onVoirProfil}
        />
      )}
    />
  );
}

function Demande({ d, onRepondre, onAppeler, onVoirProfil }) {
  /* Le verrou contre le double appui : accepter deux fois une urgence
     enverrait deux fois l'artisan. Même famille de défaut que le bouton
     « Choisir » du SOS. */
  const [envoi, setEnvoi] = useState(null);
  const genre = GENRES[d.genre] || GENRES.devis;
  const { Icone } = genre;

  const repondre = async (statut) => {
    if (envoi) return;
    setEnvoi(statut);
    try { await onRepondre(d, statut); } finally { setEnvoi(null); }
  };

  return (
    <View style={s.carte}>
      {/* Rouge brique pour une urgence, bleu pour un devis, ORANGE pour un
          rappel : trois fonds, donc une encre calculée. En blanc fixe, le
          bandeau « Demande de rappel » tombait à 3,51 : 1. */}
      <View style={[s.bandeau, { backgroundColor: genre.fond }]}>
        <Icone size={13} color={surFond(genre.fond)} />
        <Text style={[s.bandeauTexte, { color: surFond(genre.fond) }]}>{genre.titre}</Text>
        <Text style={[s.quand, { color: surFond(genre.fond) }]}>{d.quand}</Text>
      </View>

      <View style={s.corps}>
        <Pressable
          style={({ pressed }) => [s.client, pressed && APPUI.discret]}
          onPress={() => onVoirProfil && onVoirProfil(d.clientId)}
          accessibilityRole="button"
          accessibilityLabel={`Voir le profil de ${d.nom}`}
        >
          <Avatar seed={d.clientId} uri={d.avatarUrl} size={34} nom={d.nom} />
          {/* LE MÉTIER N'EST PAS CELUI DU CLIENT. Écrit sous son nom, il se
              lisait « Julie M., plombier-chauffagiste » — or Julie n'est pas
              plombière, elle en CHERCHE un. Il est descendu avec les autres
              informations de la demande. */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.nom} numberOfLines={1}>{d.nom}</Text>
          </View>
        </Pressable>

        {!!d.titre && <Text style={s.titre}>{d.titre}</Text>}
        {!!d.details && <Text style={s.details}>{d.details}</Text>}

        <View style={s.infos}>
          {!!nomDuMetier(d) && <Info>{nomDuMetier(d)}</Info>}
          {!!d.ville && <Info>{d.ville}</Info>}
          {!!d.budget && <Info>Budget {libelleBudget(d.budget)}</Info>}
          {!!d.creneau && <Info>{libelleCreneau(d.creneau)}</Info>}
          {d.prixMin != null && d.prixMax != null && (
            <Info>Estimation {d.prixMin}–{d.prixMax} €</Info>
          )}
        </View>

        {/* Le numéro n'est PAS celui du compte du client : c'est celui qu'il
            a écrit dans sa demande, pour vous. Il peut donc manquer. */}
        {estEnAttente(d) ? (
          <View style={s.boutons}>
            <BtnMini
              label={envoi === 'accepte' ? 'Envoi…' : 'Accepter'}
              disabled={!!envoi}
              onPress={() => repondre('accepte')}
            >
              <Check size={12} color={C.surAccent} />
              <Text style={s.btnTexte}>
                {envoi === 'accepte' ? 'Envoi…' : 'Accepter'}
              </Text>
            </BtnMini>
            <BtnMini
              outline
              label={envoi === 'refuse' ? 'Envoi…' : 'Refuser'}
              disabled={!!envoi}
              onPress={() => repondre('refuse')}
            >
              <X size={12} color={C.ink} />
              <Text style={[s.btnTexte, { color: C.ink }]}>
                {envoi === 'refuse' ? 'Envoi…' : 'Refuser'}
              </Text>
            </BtnMini>
          </View>
        ) : (
          <View style={s.boutons}>
            {estAcceptee(d) && !!d.telephone && (
              <BtnMini
                accessibilityLabel={`Appeler ${d.nom} au ${d.telephone}`}
                onPress={() => onAppeler && onAppeler(d.telephone)}
              >
                <Phone size={12} color={C.surAccent} />
                <Text style={s.btnTexte}>{d.telephone}</Text>
              </BtnMini>
            )}
            {estAcceptee(d) && (
              <BtnMini
                outline
                label={envoi === 'termine' ? 'Envoi…' : 'Marquer terminé'}
                disabled={!!envoi}
                onPress={() => repondre('termine')}
              />
            )}
            {estRefusee(d) && <Text style={s.etat}>Refusée</Text>}
            {d.statut === 'termine' && <Text style={s.etat}>Terminée</Text>}
          </View>
        )}

        {estEnAttente(d) && (
          <Text style={s.aide}>
            {genre.aide
              || 'Accepter permet à ce client de laisser un avis « client vérifié » '
                + 'sur votre fiche. C’est ce qui distingue Opus d’un groupe Facebook.'}
          </Text>
        )}
      </View>
    </View>
  );
}

function Info({ children }) {
  return <Text style={s.info}>{children}</Text>;
}

function libelleCreneau(c) {
  if (c === 'immediat') return 'Tout de suite';
  if (c === 'journee') return 'Dans la journée';
  if (c === 'demain') return 'Demain';
  return c;
}

/** Ouvrir le téléphone. Si l'appareil ne sait pas, on ne casse rien. */
export function appeler(numero) {
  const propre = String(numero || '').replace(/[^+\d]/g, '');
  if (!propre) return;
  Linking.openURL(`tel:${propre}`).catch(() => {});
}

const s = StyleSheet.create({
  pad: { flex: 1, backgroundColor: C.bg },

  /* Une carte PORTE l'information : angle vif, comme partout ailleurs. */
  carte: {
    ...CARTE,
    marginHorizontal: GOUTTIERE, marginBottom: S.md,
  },
  bandeau: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm - 2,
    paddingVertical: S.sm - 2, paddingHorizontal: S.md,
  },
  bandeauTexte: {
    fontFamily: F.oswald6, fontSize: T.petit, letterSpacing: 0.5,
  },
  quand: { marginLeft: 'auto', fontFamily: F.inter, fontSize: T.micro, opacity: 0.85 },

  corps: { padding: S.md, gap: S.sm },
  client: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: 40 },
  nom: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  meta: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },

  titre: {
    fontFamily: F.inter6, fontSize: T.corps, color: C.ink,
    lineHeight: interligne(T.corps),
  },
  details: {
    fontFamily: F.inter, fontSize: T.courant, color: C.muted,
    lineHeight: interligne(T.courant),
  },

  infos: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  info: { fontFamily: F.inter5, fontSize: T.petit, color: C.accent2 },

  boutons: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.xs },
  btnTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.surAccent, letterSpacing: 0.3 },
  etat: { fontFamily: F.inter5, fontSize: T.petit, color: C.muted },

  aide: {
    fontFamily: F.inter, fontSize: T.micro, color: C.muted,
    lineHeight: interligne(T.micro), paddingTop: S.xs,
  },
});
