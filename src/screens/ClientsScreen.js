/**
 * MES CLIENTS — le carnet de l'entreprise (section 41).
 *
 * C'est le module 1 du logiciel de gestion, et le premier écran d'Opus dont
 * le contenu concerne des TIERS qui n'ont pas de compte. D'où ce qu'il ne
 * fait PAS : rien d'ici ne part ailleurs dans l'application — ni sur la
 * fiche publique, ni dans le fil, ni dans une notification.
 *
 * ON CHERCHE, ON NE FAIT PAS DÉFILER. C'est l'inverse du fil, et c'est ce
 * qui décide de tout l'écran : la liste est triée par NOM et non par date,
 * parce qu'on vient chercher quelqu'un qu'on connaît. Un carnet rangé du
 * plus récent au plus ancien ne se consulte pas, il se fait défiler.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, Linking, ActivityIndicator,
} from 'react-native';
import {
  Search, X, Users, Phone, Building, User, ChevronRight,
} from '../components/icons';
import {
  C, F, T, S, R, GOUTTIERE, CARTE_PLEINE, TOUCHE, viser, interligne,
} from '../theme';
import { BtnMain, Field, EmptyState, Chip } from '../components/ui';
import { useRechercheDifferee } from '../lib/frappe';
import { clientsVisibles } from '../lib/clients';
import { CLAVIER } from '../lib/clavier';

/**
 * LE CHAMP DE RECHERCHE EST SON PROPRE COMPOSANT, avec son texte à lui.
 *
 * La règle du 29/09, mesurée : un champ qui vit dans l'écran fait
 * re-rendre l'écran entier à chaque lettre — 93 ms par lettre sur la Place
 * des pros, 29 une fois le champ isolé. Et poser le différé SEUL dans
 * l'écran ne sert à rien : il se redessine quand même, et le minuteur
 * coûte en plus (180 ms mesurés).
 */
function BarreRecherche({ valeur, onChange }) {
  const [texte, setTexte] = useRechercheDifferee(valeur, onChange);

  return (
    <View style={s.recherche}>
      <Search size={15} color={C.muted} />
      <Field
        style={s.rechercheChamp}
        value={texte}
        onChangeText={setTexte}
        placeholder="un nom, une ville, un numéro..."
        autoCorrect={false}
        returnKeyType="search"
      />
      {!!texte && (
        <Pressable
          onPress={() => { setTexte(''); onChange(''); }}
          hitSlop={viser(24)}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
        >
          <X size={15} color={C.muted} />
        </Pressable>
      )}
    </View>
  );
}

/**
 * UNE CARTE, DEUX CIBLES VOISINES — jamais imbriquées.
 *
 * La règle du lot 6 : pour un lecteur d'écran, une cible qui en contient
 * une autre ne s'annonce pas, on ne sait plus laquelle on actionne. Le
 * conteneur n'est donc PAS un bouton ; la zone qui ouvre la fiche et le
 * bouton « Appeler » sont côte à côte.
 *
 * `React.memo` ne sert à rien si on lui passe des fonctions recréées à
 * chaque rendu de l'écran (lot 4, `jyAiRepondu`). `onOuvrir` vient donc
 * d'un `useCallback` du parent, et la carte ne reçoit que des valeurs.
 */
const CarteClient = React.memo(function CarteClient({ client, onOuvrir }) {
  const Icone = client.type === 'entreprise' ? Building : User;
  const lieu = [client.ville, client.codePostal].filter(Boolean).join(' · ');

  return (
    <View style={s.carte}>
      <Pressable
        style={s.zone}
        onPress={() => onOuvrir(client)}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir la fiche de ${client.nom}`}
      >
        <Icone size={16} color={C.accent2} />
        <View style={s.textes}>
          <Text style={s.nom} numberOfLines={1}>{client.nom}</Text>
          {/* C'EST LA VILLE QUI SE COUPE, PAS LE NUMÉRO : sur un chantier,
              le numéro est ce qu'on vient chercher. Même arbitrage que la
              ligne de métadonnées du lot 5. */}
          {(!!lieu || !!client.telephone) && (
            <Text style={s.meta} numberOfLines={1}>
              {client.telephone ? client.telephone : ''}
              {client.telephone && lieu ? '  ·  ' : ''}
              {lieu}
            </Text>
          )}
        </View>
        <ChevronRight size={15} color={C.muted} />
      </Pressable>

      {/* « APPELER » N'EXISTE QUE S'IL Y A UN NUMÉRO. Un bouton qui
          composerait une chaîne vide, on appuie dessus, rien ne se passe,
          et on croit l'application cassée — la règle de `FicheContactPro`
          et celle du lot E. */}
      {!!client.telephone && (
        <Pressable
          style={s.appeler}
          onPress={() => Linking.openURL(`tel:${String(client.telephone).replace(/\s/g, '')}`)}
          accessibilityRole="button"
          accessibilityLabel={`Appeler ${client.nom} au ${client.telephone}`}
        >
          <Phone size={16} color={C.accent} />
        </Pressable>
      )}
    </View>
  );
});

export default function ClientsScreen({
  clients = [], chargement = false, echec = false,
  onRecharger, onOuvrir, onNouveau,
}) {
  const [recherche, setRecherche] = useState('');
  const [archives, setArchives] = useState(false);

  const actifs = useMemo(() => clients.filter((c) => !c.archive).length, [clients]);
  const nbArchives = useMemo(() => clients.filter((c) => c.archive).length, [clients]);
  const liste = useMemo(
    () => clientsVisibles(clients, { recherche, archives }),
    [clients, recherche, archives],
  );

  const ouvrir = React.useCallback((c) => onOuvrir && onOuvrir(c), [onOuvrir]);

  /* UN ÉCHEC NE DOIT JAMAIS ANNONCER UNE BONNE NOUVELLE. « Aucun client
     pour le moment » devant une lecture qui a échoué, c'est la règle de
     « Pour moi » du 05/10 : un travail qui n'a pas pu se faire ne doit pas
     ressembler à un travail fait. Et le bouton est un BOUTON, pas un mot
     souligné dans un paragraphe. */
  const vide = echec
    ? (
      <EmptyState
        icone={Users}
        titre="Lecture impossible"
        action={onRecharger ? { label: 'Réessayer', onPress: onRecharger } : null}
      >
        Votre carnet n&apos;a pas pu être lu. Ce n&apos;est pas qu&apos;il est
        vide : la base n&apos;a pas répondu.
      </EmptyState>
    )
    : archives
      ? (
        <EmptyState icone={Users} titre="Aucun client archivé">
          Archiver un client le retire de votre liste sans le supprimer.
        </EmptyState>
      )
      : recherche
        ? (
          <EmptyState icone={Search} titre="Aucun client ne correspond">
            La recherche porte sur le nom, la ville, le téléphone et
            l&apos;e-mail.
          </EmptyState>
        )
        : (
          <EmptyState
            icone={Users}
            titre="Votre carnet est vide"
            action={onNouveau ? { label: 'Ajouter un client', onPress: onNouveau } : null}
          >
            Vos clients resteront ici, visibles de vous seul. C&apos;est à
            eux que s&apos;adresseront vos devis et vos factures.
          </EmptyState>
        );

  const entete = (
    <View>
      <View style={s.ligneHaut}>
        <Text style={s.compte}>
          {actifs} {actifs > 1 ? 'clients' : 'client'}
          {nbArchives > 0 ? ` · ${nbArchives} archivé${nbArchives > 1 ? 's' : ''}` : ''}
        </Text>
        <BtnMain label="Nouveau" onPress={onNouveau} />
      </View>

      <BarreRecherche valeur={recherche} onChange={setRecherche} />

      {/* DEUX PASTILLES, comme la Place des pros et les Demandes : les
          pages de gestion doivent se ressembler. Et chacune AFFICHE son
          nombre — un filtre qu'on ne voit pas est un filtre qu'on oublie
          d'enlever (04/10). */}
      <View style={s.pastilles}>
        <Chip label={`Ma liste (${actifs})`} on={!archives} onPress={() => setArchives(false)} />
        <Chip label={`Archivés (${nbArchives})`} on={archives} onPress={() => setArchives(true)} />
      </View>
    </View>
  );

  if (chargement && clients.length === 0) {
    return (
      <View style={s.attente}>
        <ActivityIndicator color={C.accent} />
        <Text style={s.attenteTexte}>Lecture de votre carnet…</Text>
      </View>
    );
  }

  return (
    <FlatList
      {...CLAVIER}
      data={liste}
      keyExtractor={(c) => String(c.id)}
      renderItem={({ item }) => <CarteClient client={item} onOuvrir={ouvrir} />}
      ListHeaderComponent={entete}
      ListHeaderComponentStyle={s.enteteBoite}
      ListEmptyComponent={vide}
      ItemSeparatorComponent={() => <View style={{ height: S.sm }} />}
      /* LES TROIS RÉGLAGES, la règle du lot 4 : une FlatList monte DIX
         éléments d'un coup par défaut, et c'est ce qui bloquait l'iPhone
         plusieurs secondes au démarrage. */
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
      /* LA GOUTTIÈRE VA DANS `contentContainerStyle`, jamais dans `style` :
         un ScrollView a DEUX boîtes, et une marge dans `style` rétrécit
         AUSSI le cadre qui reçoit le doigt (lot 7). */
      contentContainerStyle={s.contenu}
    />
  );
}

const s = StyleSheet.create({
  contenu: { padding: GOUTTIERE, paddingBottom: S.xxl * 2 },
  enteteBoite: { marginBottom: S.md },

  ligneHaut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: S.md, marginBottom: S.md,
  },
  compte: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },

  /* Un champ de saisie est de la STRUCTURE : angle VIF, et sa propre
     bordure (`bordChamp`) — elle dit où appuyer, elle ne sépare pas. */
  recherche: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    paddingHorizontal: S.md, marginBottom: S.md,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.bordChamp,
  },
  rechercheChamp: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },

  pastilles: { flexDirection: 'row', gap: S.sm },

  carte: { ...CARTE_PLEINE, flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: 0 },
  /* `minHeight: TOUCHE` et non `paddingVertical` : React Native aplatit
     par PRÉCISION, donc la forme longue l'emporterait sur le `padding: 0`
     ci-dessus, où qu'il soit écrit (lot 4 des pièces jointes). */
  zone: {
    flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: S.sm,
    minHeight: TOUCHE + S.md, paddingHorizontal: S.md,
  },
  textes: { flex: 1, minWidth: 0 },
  nom: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },
  meta: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    /* `S.xs` et non un 2 écrit à la main : `verifier-echelles` est un
       CLIQUET, les nombres hors grille ne peuvent que descendre. Et il m'a
       attrapé sur celui-ci. */
    marginTop: S.xs, lineHeight: interligne(T.petit),
  },
  /* Arrondi : ce bouton FLOTTE au-dessus de la carte, on appuie dessus. */
  appeler: {
    width: TOUCHE, height: TOUCHE, marginRight: S.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.line, borderRadius: R.doux,
  },

  attente: { padding: S.xxl, alignItems: 'center', gap: S.md },
  attenteTexte: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },
});
