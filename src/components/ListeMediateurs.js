/**
 * LA LISTE OFFICIELLE DES MÉDIATEURS — les morceaux que « Mon entreprise »
 * pose dans sa liste.
 *
 * POURQUOI UNE LISTE, ET PAS UN CHAMP
 * -----------------------------------
 * Un devis adressé à un particulier nomme le médiateur de la consommation
 * auquel l'artisan ADHÈRE, et ce médiateur doit être référencé par la CECMC.
 * Une saisie libre laisserait écrire n'importe quel nom ; le plan du devis
 * (10.3) demande « la liste officielle plutôt qu'une saisie libre ». La
 * saisie reste un REPLI, pour un médiateur référencé après le relevé.
 *
 * LA LISTE ELLE-MÊME VIT DANS `MonEntreprise.js`, et c'est voulu : c'est une
 * `FlatList`, qui REMPLACE le `ScrollView` du formulaire au lieu de s'y
 * poser — une liste virtualisée dans un `ScrollView` de même orientation
 * casse le défilement, et ça ne se voit qu'au doigt. Ce fichier ne donne que
 * l'en-tête (avec sa recherche, qui est SON propre composant : la règle
 * « un champ de recherche = un composant » du 29/09), la rangée et le pied.
 *
 * Les données viennent de `src/data/mediateurs.js`, recopiées mot pour mot
 * de l'annuaire publié par la CECMC, et la date du relevé s'affiche : une
 * liste qui vieillit doit le dire.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, APPUI, interligne,
} from '../theme';
import { Field } from './ui';
import { ArrowLeft, ChevronRight } from './icons';
import { useRechercheDifferee } from '../lib/frappe';
import { dateFrancaise } from '../lib/entreprise';
import {
  MEDIATEURS_RELEVES_LE, SOURCE_MEDIATEURS, ADRESSE_A_RECOPIER,
} from '../data/mediateurs';

/** La recherche : son propre texte, et un filtrage qui part quand la frappe retombe. */
function ChampRechercheMediateur({ valeur, onChercher }) {
  const [texte, setTexte] = useRechercheDifferee(valeur, onChercher);
  return (
    <Field
      value={texte}
      onChangeText={setTexte}
      placeholder="Chercher un nom, un secteur…"
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      accessibilityLabel="Chercher un médiateur dans la liste officielle"
    />
  );
}

export function EnteteMediateurs({ recherche, onChercher, onRevenir }) {
  return (
    <View style={s.entete}>
      <Pressable
        onPress={onRevenir}
        accessibilityRole="button"
        accessibilityLabel="Revenir à mes informations de devis"
        style={({ pressed }) => [s.revenir, pressed && APPUI.discret]}
      >
        <ArrowLeft size={16} color={C.accent2} />
        <Text style={s.revenirTexte}>Revenir à mes informations de devis</Text>
      </Pressable>
      <Text style={s.titre}>Choisir mon médiateur</Text>
      <Text style={s.aide}>
        Choisissez celui auquel vous adhérez : c’est une adhésion, pas une information à
        trouver. Ces médiateurs sont référencés par la Commission d’évaluation et de contrôle
        de la médiation de la consommation (CECMC) pour les travaux du bâtiment.
      </Text>
      <Text style={s.aide}>{ADRESSE_A_RECOPIER}</Text>
      <ChampRechercheMediateur valeur={recherche} onChercher={onChercher} />
      <Text style={s.source}>
        {`Liste relevée le ${dateFrancaise(MEDIATEURS_RELEVES_LE)} : ${SOURCE_MEDIATEURS}.`}
      </Text>
    </View>
  );
}

export function RangeeMediateur({ mediateur, onChoisir }) {
  return (
    <Pressable
      onPress={() => onChoisir(mediateur)}
      accessibilityRole="button"
      accessibilityLabel={`${mediateur.nom}, ${mediateur.secteur}. Site : ${mediateur.site}`}
      style={({ pressed }) => [s.rangee, pressed && APPUI.discret]}
    >
      <View style={s.rangeeTexte}>
        <Text style={s.nom}>{mediateur.nom}</Text>
        <Text style={s.secteur} numberOfLines={2}>{mediateur.secteur}</Text>
        <Text style={s.site} numberOfLines={1}>{mediateur.site}</Text>
      </View>
      <ChevronRight size={15} color={C.muted} />
    </Pressable>
  );
}

export function PiedMediateurs({ onLibre }) {
  return (
    <View style={s.pied}>
      <Pressable
        onPress={onLibre}
        accessibilityRole="button"
        accessibilityLabel="Mon médiateur n’est pas dans la liste : l’écrire moi-même"
        style={({ pressed }) => [s.libre, pressed && APPUI.plein]}
      >
        <Text style={s.libreTexte}>Mon médiateur n’est pas dans la liste</Text>
      </Pressable>
    </View>
  );
}

export function AucunMediateur() {
  return (
    <Text style={s.vide}>
      Aucun médiateur de la liste ne correspond à ce que vous cherchez. S’il a été référencé
      après le relevé, écrivez-le vous-même, en bas de la liste.
    </Text>
  );
}

const s = StyleSheet.create({
  entete: { gap: S.sm, paddingBottom: S.md },
  revenir: { flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE },
  revenirTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2 },
  titre: { fontFamily: F.oswald6, fontSize: T.titre, color: C.ink },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  source: { fontFamily: F.inter, fontSize: T.micro, color: C.muted, lineHeight: interligne(T.micro) },
  /* Une rangée de LISTE : angle vif, elle porte l'information. 44 points
     au moins, et toute la rangée se touche — pas seulement le nom. */
  rangee: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE,
    paddingVertical: S.sm, paddingHorizontal: S.md,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.line,
  },
  rangeeTexte: { flex: 1, minWidth: 0, gap: S.xs },
  nom: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink },
  secteur: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  site: { fontFamily: F.inter, fontSize: T.petit, color: C.accent2 },
  pied: { paddingTop: S.lg },
  /* Un bouton qui flotte : il s'arrondit, et fait 44 points. */
  libre: {
    minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.accentTexte, borderRadius: R.gelule, paddingHorizontal: S.md,
  },
  libreTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accentTexte },
  vide: {
    fontFamily: F.inter, fontSize: T.courant, color: C.muted, lineHeight: interligne(T.courant),
    paddingVertical: S.md,
  },
});
