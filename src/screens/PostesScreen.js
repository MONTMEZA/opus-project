/**
 * « MA BASE DE POSTES » — les phrases que l'artisan a rangées, et ses prix
 * de référence (lot P du module devis, 24/10/2026).
 *
 * Deux portes l'ouvrent : « Mes devis » et « Mon profil » (`ouvrirMaBase`,
 * dans `OpusApp`, la même fonction pour les deux). Elle se RELIT à chaque
 * ouverture : une base vue la veille sur un autre appareil n'est plus
 * celle d'aujourd'hui.
 *
 * ON NE CRÉE PAS UN POSTE ICI — décidé par le propriétaire le 23/10 : un
 * poste se crée depuis une ligne de devis, d'un appui, pour que chacun ait
 * été chiffré une fois. Ici, on le RETROUVE (par les mots de sa phrase, à
 * une variante d'écriture près : « seuils », « beton » ou « DURANDAL »
 * trouvent « Seuil », « béton », « Durandal »), on fixe, change ou retire
 * son prix de référence, on corrige sa phrase, on le retire.
 *
 * CE QU'ELLE DIT, ET CE QU'ELLE NE DIT PAS
 * ----------------------------------------
 *   - « Aucun écran d'Opus ne les montre à quelqu'un d'autre que vous » —
 *     la forme du texte opposable, et c'est un ENGAGEMENT : le propriétaire
 *     d'un projet Supabase peut toujours lire sa base. Elle ne promet pas
 *     ce qu'aucun écran ne peut tenir ;
 *   - un échec n'est JAMAIS « votre base est vide » : « Lecture
 *     impossible », avec un vrai bouton. Une liste déjà lue RESTE, sous
 *     « Liste non actualisée » (le modèle de « Mes devis ») ;
 *   - une liste COUPÉE se dit (`incomplete`) : l'API de Supabase coupe une
 *     réponse à sa limite de lignes, sans erreur.
 *
 * CE QU'ELLE MONTRE — la liste triée et cherchée, la liste gardée, le
 * message d'une liste vide, le compte — est décidé par `vueDeLaPage`
 * (`postes.js`), que `verifier-postes` fait tourner. Écrit ici, une
 * recherche « à la lettre » (« beton » ne trouvait plus « béton ») passait
 * au vert (relecture « écran », ECRAN1) ; et après une relecture ratée, une
 * recherche sans résultat disait « Lecture impossible » sous une liste qui
 * avait été lue (ECRAN6).
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, GOUTTIERE, CARTE_PLEINE, TOUCHE, APPUI, interligne,
} from '../theme';
import { BtnOutline, Field, EmptyState, Montant } from '../components/ui';
import { Search, X, FileText, ChevronRight } from '../components/icons';
import FeuillePoste from '../components/FeuillePoste';
import { CLAVIER } from '../lib/clavier';
import { useRechercheDifferee } from '../lib/frappe';
import {
  vueDeLaPage, ligneDescriptive, libelleOrigine, phraseFixeLe,
} from '../lib/postes';

/* LA RECHERCHE EST SON PROPRE COMPOSANT, avec son texte à lui : une lettre
   ne redessine pas la liste ; le filtrage part quand la frappe retombe. */
function BarreRecherche({ valeur, onChange }) {
  const [texte, setTexte] = useRechercheDifferee(valeur, onChange);
  return (
    <View style={s.recherche}>
      <Search size={15} color={C.muted} />
      <Field
        style={s.rechercheChamp}
        value={texte}
        onChangeText={setTexte}
        placeholder="un mot de la phrase…"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Chercher dans ma base de postes"
      />
      {/* EFFACER : une BOÎTE de 44 points, l'icône garde sa taille. Mesurée
          au navigateur (`mesure-devis`, lot P) : la croix seule faisait
          15 × 16 — `hitSlop` l'agrandissait au doigt, mais il ne se vérifie
          pas ici, et la règle des écrans du devis est la boîte. */}
      {!!texte && (
        <Pressable
          onPress={() => { setTexte(''); onChange(''); }}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
          style={({ pressed }) => [s.effacer, pressed && APPUI.discret]}
        >
          <X size={15} color={C.muted} />
        </Pressable>
      )}
    </View>
  );
}

/* UN POSTE, une rangée mémorisée — elle ne reçoit que des VALEURS (la
   phrase, des libellés déjà calculés) et un rappel stable. Angle VIF : c'est
   de la structure, elle porte l'information. */
const RangeePoste = React.memo(function RangeePoste({
  id, designation, descriptive, prix, fixe, origine, onOuvrir,
}) {
  return (
    <Pressable
      onPress={() => onOuvrir(id)}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le poste ${designation}`}
      style={({ pressed }) => [s.rangee, pressed && APPUI.discret]}
    >
      <View style={s.textes}>
        {/* Trois lignes : la phrase ENTIÈRE est dans la feuille. */}
        <Text style={s.phrase} numberOfLines={3}>{designation}</Text>
        <Text style={s.meta}>{descriptive}</Text>
        {prix != null
          ? <Montant centimes={prix} style={s.prix} />
          : <Text style={s.sansPrix}>Prix non fixé</Text>}
        {!!fixe && <Text style={s.meta}>{fixe}</Text>}
        {!!origine && <Text style={s.meta}>{origine}</Text>}
      </View>
      <ChevronRight size={15} color={C.muted} />
    </Pressable>
  );
});

/* Le séparateur, déclaré au niveau du MODULE : écrit en fonction fléchée,
   ce serait un type de composant neuf à chaque rendu. */
function Intervalle() {
  return <View style={s.intervalle} />;
}

export default function PostesScreen({
  postes = [], etat = 'vide', lus = false, incomplete = false, total = null, enRetard = false,
  regime = null, regimeDeclareLe = null,
  onRecharger, onRanger, onRelire,
}) {
  const [recherche, setRecherche] = useState('');
  /* La feuille ouverte : le poste TEL QU'IL ÉTAIT à l'ouverture, relu dans
     la liste à chaque rendu — une base relue (« modifié entre-temps ») lui
     donne la date à jour pour la prochaine écriture. L'instantané ne sert
     que si le poste a DISPARU de la base relue (retiré depuis un autre
     appareil) : la feuille le dit au lieu de s'effacer sans un mot
     (relecture « textes », TEXTES5). */
  const [ouvert, setOuvert] = useState(null);

  /* CE QUE LA PAGE MONTRE : `vueDeLaPage`, jamais un filtre écrit ici. */
  const vue = useMemo(
    () => vueDeLaPage({ postes, etat, lus, recherche, incomplete, total }),
    [postes, etat, lus, recherche, incomplete, total],
  );
  const ouvrir = React.useCallback((id) => setOuvert(postes.find((p) => String(p.id) === String(id)) || null), [postes]);
  const posteLu = ouvert ? postes.find((p) => String(p.id) === String(ouvert.id)) : null;
  const posteOuvert = posteLu || ouvert;

  if (vue.enAttente) {
    return (
      <View style={s.attente}>
        <ActivityIndicator color={C.accent} />
        <Text style={s.attenteTexte}>Lecture de votre base de postes…</Text>
      </View>
    );
  }

  /* Une relecture ratée ne VIDE pas l'écran : ce qui a été lu reste, sous
     une rangée qui dit qu'il n'est pas à jour. « Lecture impossible »
     plein écran, seulement quand rien n'a jamais été lu. */
  const { garderLaListe } = vue;

  let vide;
  if (vue.vide === 'illisible') {
    vide = (
      <EmptyState
        icone={FileText}
        titre="Lecture impossible"
        action={onRecharger ? { label: 'Réessayer', onPress: onRecharger } : null}
      >
        {/* « LA BASE » NE DÉSIGNE PAS LE SERVEUR SUR CET ÉCRAN (relecture
            « textes », TEXTES11) : pour l'artisan, ici, « la base », c'est SA
            base de postes. Et « n'a pas répondu » affirmait une cause qu'on
            ne connaît pas — session expirée, délai, refus… */}
        {enRetard
          ? 'Le serveur d’Opus n’est pas encore à jour pour les postes : ce n’est pas que votre base est vide. Réessayez plus tard.'
          : 'Votre base de postes n’a pas pu être lue. Ce n’est pas qu’elle est vide : la lecture n’a pas abouti — vérifiez '
            + 'votre connexion, puis réessayez.'}
      </EmptyState>
    );
  } else if (vue.vide === 'recherche') {
    vide = (
      <EmptyState icone={Search} titre={`Aucun poste ne contient « ${vue.recherche} ».`}>
        {vue.aideRecherche}
      </EmptyState>
    );
  } else {
    vide = (
      <EmptyState icone={FileText} titre="Votre base est vide">
        Dans un devis, ouvrez une ligne chiffrée et touchez « Ajouter à ma base ».
      </EmptyState>
    );
  }

  const entete = (
    <View style={s.entete}>
      <Text style={s.compte}>{vue.compte || 'Ma base de postes'}</Text>
      <Text style={s.aide}>
        Vos phrases et vos prix de référence. Aucun écran d’Opus ne les montre à quelqu’un d’autre que vous.
      </Text>
      {/* La liste coupée se DIT, avec le vrai total, et la recherche avec
          elle : sans cela, « Ma base » montrerait les premiers postes sans
          un mot sur les autres — et une recherche sans résultat, faite sur
          une partie de la base, ressemblerait à une base vérifiée
          (`vueDeLaPage`, relecture « textes », TEXTES12). */}
      {!!vue.bandeIncomplete && (
        <View style={s.bande} accessibilityLiveRegion="polite">
          <Text style={s.bandeTexte}>{vue.bandeIncomplete}</Text>
        </View>
      )}
      {garderLaListe && (
        <View style={s.bande} accessibilityLiveRegion="polite">
          <Text style={s.bandeTexte}>
            {enRetard
              ? 'Liste non actualisée : le serveur d’Opus n’est pas encore à jour pour les postes. Ce qui est affiché date de votre '
                + 'dernière lecture.'
              : 'Liste non actualisée : votre base de postes n’a pas pu être relue. Ce qui est affiché date de votre dernière lecture.'}
          </Text>
          {!!onRecharger && <BtnOutline label="Réessayer" onPress={onRecharger} />}
        </View>
      )}
      {postes.length > 0 && (
        <>
          {/* « Écart » n'apparaît nulle part ailleurs à l'écran : la carte
              pose une QUESTION, et c'est elle qu'on nomme (ECRAN8). */}
          <Text style={s.aide}>Pour ne plus voir la question « c’est voulu ? » sur un poste, retirez son prix de référence.</Text>
          <BarreRecherche valeur={recherche} onChange={setRecherche} />
        </>
      )}
    </View>
  );

  return (
    <View style={s.ecran}>
      <FlatList
        {...CLAVIER}
        data={vue.visibles}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <RangeePoste
            id={item.id}
            designation={item.designation}
            descriptive={ligneDescriptive(item)}
            prix={item.prixReferenceCentimes}
            fixe={phraseFixeLe(item, { regimeDeclareLe })}
            origine={libelleOrigine(item)}
            onOuvrir={ouvrir}
          />
        )}
        ListHeaderComponent={entete}
        ListHeaderComponentStyle={s.enteteBoite}
        ListEmptyComponent={vide}
        ItemSeparatorComponent={Intervalle}
        /* LES TROIS RÉGLAGES, la règle du lot 4 : une FlatList monte DIX
           éléments d'un coup par défaut. */
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={5}
        /* La gouttière va dans `contentContainerStyle`, jamais dans `style`. */
        contentContainerStyle={s.contenu}
      />
      {!!posteOuvert && (
        <FeuillePoste
          key={String(posteOuvert.id)}
          poste={posteOuvert}
          depuisLaPage
          postes={postes}
          regime={regime}
          regimeDeclareLe={regimeDeclareLe}
          absent={!posteLu}
          onRanger={onRanger}
          onRelire={onRelire}
          onFermer={() => setOuvert(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: C.bg },
  intervalle: { height: S.sm },
  contenu: { padding: GOUTTIERE, paddingBottom: S.xxl * 2 },
  enteteBoite: { marginBottom: S.md },
  entete: { gap: S.sm },
  compte: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  /* Ce qui n'est pas à jour, ou pas entier : encre du texte sur une surface
     blanche, filet rouge brique — le rouge seul sur le fond beige ne donne
     que 4,37 : 1. */
  bande: {
    backgroundColor: C.surface, borderLeftWidth: 3, borderLeftColor: C.bad, padding: S.md, gap: S.sm,
  },
  bandeTexte: { fontFamily: F.inter, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  /* Un champ de saisie est de la STRUCTURE : angle vif, sa propre bordure. */
  recherche: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.bordChamp,
  },
  rechercheChamp: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },
  effacer: { minWidth: TOUCHE, minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center' },
  /* Une carte de contenu, angle vif, 44 points au moins. */
  rangee: {
    ...CARTE_PLEINE, flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE,
  },
  textes: { flex: 1, minWidth: 0, gap: S.xs },
  phrase: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  meta: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  prix: { fontSize: T.corps, color: C.ink, textAlign: 'left' },
  sansPrix: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },
  attente: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.bg },
  attenteTexte: { fontFamily: F.inter, fontSize: T.corps, color: C.muted },
});
