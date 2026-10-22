/**
 * « MES DEVIS » — la liste des brouillons (lot 1 du module devis, 22/10/2026).
 *
 * Ouverte depuis « Mon profil », au même rang que « Mes clients » et « Mon
 * entreprise » : un outil de travail se trouve sans fouiller. Pour un compte
 * professionnel seulement — un particulier n'a pas de devis à écrire.
 *
 * CE QU'ELLE DIT, ET CE QU'ELLE NE DIT PAS
 * ----------------------------------------
 *   - TROIS ÉTATS, et le deuxième n'est jamais confondu avec le troisième :
 *     « Lecture impossible » avec un vrai bouton « Réessayer », jamais
 *     « Aucun devis » devant une lecture qui a échoué (la règle de « Pour
 *     moi » du 05/10 : un travail qui n'a pas pu se faire ne ressemble
 *     jamais à un travail fait). Une base où la section 49 n'est pas posée
 *     le dit aussi : « la base n'est pas à jour » ;
 *   - BORNÉE À 200, et elle le DIT au-delà : une liste coupée en silence
 *     cache du travail ;
 *   - TRIÉE PAR DATE, et c'est honnête AU LOT 1 SEULEMENT : il n'y a qu'un
 *     statut (« Brouillon »). Le jour où un devis pourra attendre une
 *     réponse, ce qui attend devra passer devant, côté base —
 *     `verifier-devis` l'exigera ;
 *   - « Total TTC » au régime réel, « Total » en franchise ou quand le
 *     régime n'est pas connu : un artisan en franchise ne facture pas de
 *     TVA, et un régime qu'on n'a pas pu lire ne permet pas de nommer la
 *     taxe.
 */
import React from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, GOUTTIERE, CARTE_PLEINE, TOUCHE, APPUI, interligne, surFond,
} from '../theme';
import {
  BtnMain, BtnOutline, EmptyState, Montant,
} from '../components/ui';
import { FileText, ChevronRight } from '../components/icons';
import { CLAVIER } from '../lib/clavier';
import { PLAFOND_LISTE, origineLisible, depuisLisible } from '../lib/devis';
import { dateFrancaise } from '../lib/entreprise';

/* Le fond de la pastille « Brouillon » — son ENCRE se calcule (`surFond`) :
   écrite en dur, elle serait fausse le jour où ce fond change. */
const FOND_BROUILLON = C.accent2;

/* Une carte par devis, mémorisée : elle ne reçoit que des VALEURS. */
const CarteDevis = React.memo(function CarteDevis({
  id, objet, client, origine, total, libelleTotal, modifie, commence, onOuvrir,
}) {
  return (
    <Pressable
      onPress={() => onOuvrir(id)}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le brouillon ${objet || 'sans objet'}, ${client || 'client à choisir'}`}
      style={({ pressed }) => [s.carte, pressed && APPUI.discret]}
    >
      <View style={s.haut}>
        <View style={[s.pastille, { backgroundColor: FOND_BROUILLON }]}>
          <Text style={[s.pastilleTexte, { color: surFond(FOND_BROUILLON) }]}>Brouillon</Text>
        </View>
        <Text style={s.modifie} numberOfLines={1}>{modifie ? `modifié ${modifie}` : ''}</Text>
      </View>
      <View style={s.corps}>
        <View style={s.textes}>
          <Text style={s.objet} numberOfLines={2}>{objet || 'Sans objet'}</Text>
          <Text style={s.client} numberOfLines={1}>{client || 'Client à choisir'}</Text>
          {!!origine && <Text style={s.meta} numberOfLines={1}>{origine}</Text>}
          {/* « Commencé le … » : la date de CRÉATION du brouillon, jamais une
              date de rédaction — celle-là sera la date de remise (lot 2). */}
          {!!commence && <Text style={s.meta} numberOfLines={1}>{`commencé le ${commence}`}</Text>}
        </View>
        <View style={s.droite}>
          <Text style={s.libelle}>{libelleTotal}</Text>
          <Montant centimes={total} fort />
        </View>
        <ChevronRight size={15} color={C.muted} />
      </View>
    </Pressable>
  );
});

/* Le séparateur, déclaré au niveau du MODULE. */
function Intervalle() {
  return <View style={s.intervalle} />;
}

export default function DevisScreen({
  devis = [], etat = 'vide', lus = false, tronque = false, enRetard = false, regime = null,
  onRecharger, onOuvrir, onNouveau,
}) {
  const libelleTotal = regime === 'reel' ? 'Total TTC' : 'Total';
  const ouvrir = React.useCallback((id) => onOuvrir && onOuvrir(id), [onOuvrir]);

  if ((etat === 'chargement' || etat === 'vide') && devis.length === 0) {
    return (
      <View style={s.attente}>
        <ActivityIndicator color={C.accent} />
        <Text style={s.attenteTexte}>Lecture de vos devis…</Text>
      </View>
    );
  }

  const vide = etat === 'echec'
    ? (
      <EmptyState
        icone={FileText}
        titre="Lecture impossible"
        action={onRecharger ? { label: 'Réessayer', onPress: onRecharger } : null}
      >
        {enRetard
          ? 'La base n’est pas encore à jour pour les devis : ce n’est pas que vous n’en avez pas. Réessayez plus tard.'
          : 'Vos devis n’ont pas pu être lus. Ce n’est pas que vous n’en avez pas : la base n’a pas répondu.'}
      </EmptyState>
    )
    : (
      <EmptyState
        icone={FileText}
        titre="Aucun devis pour le moment"
        action={onNouveau ? { label: 'Nouveau devis', onPress: onNouveau } : null}
      >
        Vos brouillons resteront ici. Rien ne part chez un client tant que vous ne l’avez pas décidé.
      </EmptyState>
    );

  /* UNE RELECTURE RATÉE NE VIDE PAS L'ÉCRAN DE TRAVAIL (relecture « écran »
     des étapes 4 à 7, B3) : la liste est relue à chaque retour d'un devis, et
     sur un chantier le réseau va et vient. Ce qui a déjà été lu RESTE, sous
     une rangée qui dit qu'il n'est pas à jour. « Lecture impossible » plein
     écran, seulement quand rien n'a jamais été lu. */
  const echec = etat === 'echec';
  const garderLaListe = echec && lus;

  /* LE COMPTE NE SE DIT QUE D'UNE LECTURE RÉUSSIE : au-dessus de « Lecture
     impossible », « 0 brouillon » disait exactement « Aucun devis » — ce que
     la règle interdit (B2). */
  const entete = (
    <View style={s.entete}>
      <View style={s.ligneHaut}>
        <Text style={s.compte}>
          {etat === 'ok' ? `${devis.length} ${devis.length > 1 ? 'brouillons' : 'brouillon'}` : 'Mes brouillons'}
        </Text>
        <BtnMain label="Nouveau devis" onPress={onNouveau} />
      </View>
      {garderLaListe && (
        <View style={s.nonActualisee} accessibilityLiveRegion="polite">
          <Text style={s.nonActualiseeTexte}>
            {enRetard
              ? 'Liste non actualisée : la base n’est pas encore à jour pour les devis. Ce qui est affiché date de votre dernière lecture.'
              : 'Liste non actualisée : vos devis n’ont pas pu être relus. Ce qui est affiché date de votre dernière lecture.'}
          </Text>
          {!!onRecharger && <BtnOutline label="Réessayer" onPress={onRecharger} />}
        </View>
      )}
    </View>
  );

  /* LA TRONCATURE SE DIT — et elle se dit de ce que la LECTURE a rendu
     (`tronque` : la base avait plus de PLAFOND_LISTE devis), jamais d'un
     compte de cartes : 200 devis exactement ne sont pas une liste coupée. */
  const pied = tronque
    ? <Text style={s.pied}>{`Vos ${PLAFOND_LISTE} devis les plus récents. Les plus anciens ne sont pas affichés.`}</Text>
    : null;

  return (
    <FlatList
      {...CLAVIER}
      data={echec && !garderLaListe ? [] : devis}
      keyExtractor={(d) => String(d.id)}
      renderItem={({ item }) => (
        <CarteDevis
          id={item.id}
          objet={item.objet}
          client={item.client && item.client.nom}
          origine={origineLisible(item)}
          total={item.totalTtcCentimes}
          libelleTotal={libelleTotal}
          modifie={depuisLisible(item.modifieLe)}
          commence={dateFrancaise(item.createdAt)}
          onOuvrir={ouvrir}
        />
      )}
      ListHeaderComponent={entete}
      ListHeaderComponentStyle={s.enteteBoite}
      ListEmptyComponent={vide}
      ListFooterComponent={pied}
      ItemSeparatorComponent={Intervalle}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
      contentContainerStyle={s.contenu}
    />
  );
}

const s = StyleSheet.create({
  intervalle: { height: S.sm },
  contenu: { padding: GOUTTIERE, paddingBottom: S.xxl * 2 },
  enteteBoite: { marginBottom: S.md },
  entete: { gap: S.md },
  ligneHaut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.md },
  /* De la STRUCTURE posée sur la liste : angle vif, un filet rouge brique —
     la même famille que les bandes de la saisie. */
  nonActualisee: {
    backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.bad, padding: S.md, gap: S.sm,
  },
  nonActualiseeTexte: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  compte: { flex: 1, minWidth: 0, fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  /* Une carte de CONTENU : angle vif. */
  carte: { ...CARTE_PLEINE, gap: S.sm, minHeight: TOUCHE },
  haut: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  /* La pastille de statut FLOTTE : arrondie. */
  pastille: { paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: R.gelule },
  pastilleTexte: { fontFamily: F.oswald6, fontSize: T.micro, letterSpacing: 0.5 },
  modifie: { flex: 1, minWidth: 0, textAlign: 'right', fontFamily: F.inter, fontSize: T.petit, color: C.muted },
  corps: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  textes: { flex: 1, minWidth: 0 },
  objet: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink },
  client: { fontFamily: F.inter, fontSize: T.petit, color: C.ink, marginTop: S.xs },
  meta: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  droite: { alignItems: 'flex-end' },
  libelle: { fontFamily: F.inter, fontSize: T.micro, color: C.muted },
  pied: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, textAlign: 'center',
    marginTop: S.md, lineHeight: interligne(T.petit),
  },
  attente: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.bg },
  attenteTexte: { fontFamily: F.inter, fontSize: T.corps, color: C.muted },
});
