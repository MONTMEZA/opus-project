/**
 * « POUR QUI ? » — CHOISIR UNE FICHE DU CARNET POUR UN DEVIS (lot 1,
 * 22/10/2026).
 *
 * DANS SON PROPRE FICHIER, et ce n'est pas un rangement : `verifier-feuilles`
 * juge PAR FICHIER, et refuse un fichier qui réunit `<FeuilleBas` et
 * `{...CLAVIER}`. Ce qui est collé au bas de l'écran MONTE (la feuille porte
 * déjà un `KeyboardAvoidingView`) ; ce qui défile remonte son CONTENU
 * (`CLAVIER`). Les deux ensemble comptent la hauteur du clavier DEUX FOIS.
 * La liste porte donc `keyboardShouldPersistTaps="handled"` SEUL — le
 * premier appui sur une fiche agit, clavier ouvert —, et la feuille ne
 * défile pas elle-même (`defile={false}`) : une liste virtualisée ne va pas
 * dans un `ScrollView` de même sens.
 *
 * TROIS ÉTATS, et le deuxième est le plus important : une lecture ratée
 * affichée comme un carnet vide ferait RECRÉER un client qui existe déjà.
 * « Lecture impossible », avec un vrai bouton.
 *
 * Le carnet NON ARCHIVÉ seulement : un client archivé est une fiche qu'on a
 * décidé de ne plus voir.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import FeuilleBas from './FeuilleBas';
import { BtnOutline, Field } from './ui';
import { Search, User, Building } from './icons';
import { useRechercheDifferee } from '../lib/frappe';
import { clientsVisibles } from '../lib/clients';

/* La recherche : son PROPRE composant, avec son propre texte — une lettre ne
   redessine pas la liste ; le filtrage part quand la frappe retombe. */
function Recherche({ valeur, onChange }) {
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
        accessibilityLabel="Chercher dans mon carnet"
      />
    </View>
  );
}

/* Une fiche du carnet : une rangée de 44 points au moins. */
const RangeeClient = React.memo(function RangeeClient({ client, onChoisir }) {
  const Icone = client.type === 'entreprise' ? Building : User;
  return (
    <Pressable
      onPress={() => onChoisir(client)}
      accessibilityRole="button"
      accessibilityLabel={`Choisir ${client.nom}${client.ville ? `, ${client.ville}` : ''}`}
      style={({ pressed }) => [s.rangee, pressed && APPUI.discret]}
    >
      <Icone size={16} color={C.accent2} />
      <View style={s.textes}>
        <Text style={s.nom} numberOfLines={1}>{client.nom}</Text>
        {!!client.ville && <Text style={s.meta} numberOfLines={1}>{client.ville}</Text>}
      </View>
    </Pressable>
  );
});

/* Le séparateur, déclaré au niveau du MODULE : écrit en fonction fléchée, ce
   serait un type de composant neuf à chaque rendu. */
function Intervalle() {
  return <View style={s.intervalle} />;
}

export default function ChoixClientDevis({
  clients = [], etat = 'vide', onRecharger, onChoisir, onNouveau, onFermer,
}) {
  const [recherche, setRecherche] = useState('');
  const liste = useMemo(() => clientsVisibles(clients, { recherche, archives: false }), [clients, recherche]);

  let corps;
  if (etat === 'chargement' || etat === 'vide') {
    corps = (
      <View style={s.attente}>
        <ActivityIndicator color={C.accent} />
        <Text style={s.texte}>Lecture de votre carnet…</Text>
      </View>
    );
  } else if (etat === 'echec') {
    corps = (
      <View style={s.attente}>
        <Text style={s.titre}>Lecture impossible</Text>
        <Text style={s.texte}>
          Votre carnet n’a pas pu être lu. Ce n’est pas qu’il est vide : la base n’a pas répondu.
        </Text>
        <BtnOutline label="Réessayer" onPress={onRecharger} />
      </View>
    );
  } else if (!clients.some((c) => !c.archive)) {
    corps = (
      <View style={s.attente}>
        <Text style={s.titre}>Votre carnet est vide</Text>
        <Text style={s.texte}>Créez la fiche de ce client : elle restera dans votre carnet, visible de vous seul.</Text>
        <BtnOutline label="Nouveau client" onPress={onNouveau} />
      </View>
    );
  } else {
    corps = (
      <>
        <Recherche valeur={recherche} onChange={setRecherche} />
        <FlatList
          keyboardShouldPersistTaps="handled"
          data={liste}
          keyExtractor={(c) => String(c.id)}
          renderItem={({ item }) => <RangeeClient client={item} onChoisir={onChoisir} />}
          ItemSeparatorComponent={Intervalle}
          ListEmptyComponent={<Text style={s.texte}>Aucune fiche ne correspond à cette recherche.</Text>}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          style={s.liste}
          contentContainerStyle={s.contenu}
        />
      </>
    );
  }

  return (
    <FeuilleBas titre="Pour qui est ce devis ?" onFermer={onFermer} defile={false}>
      {corps}
    </FeuilleBas>
  );
}

const s = StyleSheet.create({
  recherche: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.md,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.bordChamp,
  },
  rechercheChamp: { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 },
  liste: { maxHeight: 360 },
  contenu: { paddingVertical: S.sm },
  intervalle: { height: 1, backgroundColor: C.line },
  rangee: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, minHeight: TOUCHE, paddingHorizontal: S.sm,
  },
  textes: { flex: 1, minWidth: 0 },
  nom: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },
  meta: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
  attente: { gap: S.sm, paddingVertical: S.md },
  titre: { fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink },
  texte: { fontFamily: F.inter, fontSize: T.corps, color: C.muted, lineHeight: interligne(T.corps) },
});
