/**
 * Choix des métiers d'un artisan.
 *
 * POURQUOI PLUSIEURS
 * ------------------
 * Un artisan n'exerce presque jamais un seul métier : plombier ET
 * chauffagiste, maçon ET carreleur. Avec un champ unique, il devait choisir,
 * et il disparaissait de la moitié des recherches qui le concernaient.
 *
 * POURQUOI QUATRE AU MAXIMUM
 * --------------------------
 * Parce que tout cocher serait la façon évidente de capter toutes les
 * demandes. Quatre, c'est large pour une vraie entreprise, et déjà suspect
 * pour un artisan seul. La limite est tenue par la base, pas seulement ici.
 *
 * LE MÉTIER PRINCIPAL
 * -------------------
 * C'est le premier de la liste. Il s'affiche sur les publications, sur le
 * profil et dans le fil : c'est l'étiquette par laquelle on vous reconnaît.
 * On le change en touchant un métier déjà choisi.
 *
 * LA GRILLE DE PUCES A DISPARU
 * ----------------------------
 * Elle affichait les douze métiers d'un coup. Le catalogue en compte
 * quatre-vingt-douze : la même grille serait un mur. On garde les métiers
 * CHOISIS bien visibles — c'est la seule chose qui compte ici — et on
 * ajoute par le sélecteur, qui sait chercher.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F, T, S, R, interligne, viser } from '../theme';
import { X, Lock, Star, Plus } from './icons';
import SelecteurMetiers from './SelecteurMetiers';
import { nomMetier } from '../lib/metiers';

export const MAX_METIERS = 4;

export default function ChoixMetiers({
  valeurs = [], onChange, verrouille = false, onDemanderModification, demandeEnCours,
}) {
  const choisis = valeurs.filter(Boolean);
  const [selecteurOuvert, setSelecteurOuvert] = useState(false);

  const basculer = (m) => {
    if (choisis.includes(m)) return;             // on retire par la croix
    if (choisis.length >= MAX_METIERS) return;
    onChange([...choisis, m]);
  };
  const retirer = (m) => {
    if (choisis.length <= 1) return;             // au moins un métier, toujours
    onChange(choisis.filter((x) => x !== m));
  };
  const mettreEnPrincipal = (m) => {
    if (choisis[0] === m) return;
    onChange([m, ...choisis.filter((x) => x !== m)]);
  };

  /* --- profil vérifié : les métiers sont figés --- */
  if (verrouille) {
    return (
      <View>
        <View style={s.choisisRang}>
          {choisis.map((m, i) => (
            <View key={m} style={[s.pastille, s.pastilleFigee]}>
              {i === 0 && <Star size={11} color={C.muted} />}
              <Text style={s.pastilleTexteFige}>{nomMetier(m)}</Text>
            </View>
          ))}
        </View>

        <View style={s.verrou}>
          <Lock size={13} color={C.accent2} />
          <Text style={s.verrouTexte}>
            Vos métiers sont figés depuis la vérification de vos documents.
            C'est ce qui donne sa valeur à votre badge : un client sait que le
            métier affiché est celui qui a été contrôlé.
          </Text>
        </View>

        {demandeEnCours ? (
          <Text style={s.enCours}>
            Demande de modification envoyée — en cours d'examen.
          </Text>
        ) : (
          <Pressable style={s.lien} onPress={onDemanderModification}>
            <Text style={s.lienTexte}>Demander une modification</Text>
          </Pressable>
        )}
      </View>
    );
  }

  /* --- profil non vérifié : libre --- */
  return (
    <View>
      <View style={s.choisisRang}>
        {choisis.map((m, i) => (
          <View key={m} style={[s.pastille, i === 0 && s.pastillePrincipale]}>
            <Pressable
              style={s.pastilleCorps}
              onPress={() => mettreEnPrincipal(m)}
              hitSlop={viser(24)}
            >
              {i === 0 && <Star size={11} color="#fff" />}
              <Text style={s.pastilleTexte}>{nomMetier(m)}</Text>
            </Pressable>
            {choisis.length > 1 && (
              <Pressable
                onPress={() => retirer(m)}
                hitSlop={viser(24)}
                accessibilityRole="button"
                accessibilityLabel={`Retirer le métier ${nomMetier(m)}`}
              >
                <X size={12} color="#fff" />
              </Pressable>
            )}
          </View>
        ))}
      </View>

      <Text style={s.aide}>
        {choisis.length > 1
          ? `Métier principal : ${nomMetier(choisis[0])}. Touchez un autre métier choisi pour en faire le principal.`
          : 'Ajoutez un deuxième métier si vous en exercez un autre.'}
        {'\n'}
        {choisis.length} sur {MAX_METIERS} — vos métiers seront figés le jour où
        vos documents seront vérifiés.
      </Text>

      {/* Un bouton FLOTTE au-dessus du fond : arrondi, contrairement aux
          pastilles de métier qui, elles, portent l'information. */}
      <Pressable
        style={[s.ajouter, choisis.length >= MAX_METIERS && s.ajouterEteint]}
        onPress={() => setSelecteurOuvert(true)}
        disabled={choisis.length >= MAX_METIERS}
        aria-disabled={choisis.length >= MAX_METIERS}
        accessibilityRole="button"
        accessibilityLabel={choisis.length >= MAX_METIERS
          ? 'Ajouter un métier, indisponible : quatre métiers au maximum'
          : 'Ajouter un métier'}
      >
        <Plus size={14} color={choisis.length >= MAX_METIERS ? C.muted : C.accent2} />
        <Text style={[s.ajouterTexte, choisis.length >= MAX_METIERS && s.ajouterTexteEteint]}>
          Ajouter un métier
        </Text>
      </Pressable>

      {choisis.length >= MAX_METIERS && (
        <Text style={s.limite}>
          Vous pouvez sélectionner jusqu'à 4 métiers maximum. Supprimez un
          métier pour en sélectionner un autre.
        </Text>
      )}

      <SelecteurMetiers
        ouvert={selecteurOuvert}
        onFermer={() => setSelecteurOuvert(false)}
        onChoisir={basculer}
        choisis={choisis}
        restant={MAX_METIERS - choisis.length}
        titre="Ajouter un métier"
      />
    </View>
  );
}

const s = StyleSheet.create({
  choisisRang: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pastille: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.ink, paddingVertical: 6, paddingHorizontal: 10,
  },
  pastillePrincipale: { backgroundColor: C.accent },
  pastilleCorps: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pastilleTexte: { fontFamily: F.oswald6, fontSize: 11.5, color: '#fff' },
  pastilleFigee: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  pastilleTexteFige: { fontFamily: F.oswald6, fontSize: 11.5, color: C.ink },

  aide: { fontFamily: F.inter, fontSize: 11, color: C.muted, lineHeight: 16, marginBottom: 8 },
  limite: {
    fontFamily: F.inter, fontSize: T.petit, color: C.bad,
    lineHeight: interligne(T.petit), marginTop: S.sm,
  },

  ajouter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm,
    borderWidth: 1, borderColor: C.accent2, borderRadius: R.gelule,
    paddingVertical: S.md - 2, paddingHorizontal: S.lg,
  },
  ajouterEteint: { borderColor: C.line },
  ajouterTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.accent2 },
  ajouterTexteEteint: { color: C.muted },

  verrou: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.accent2,
    padding: 10, marginTop: 2,
  },
  verrouTexte: { flex: 1, fontFamily: F.inter, fontSize: 11.5, color: C.ink, lineHeight: 17 },
  lien: { paddingVertical: 8 },
  lienTexte: { fontFamily: F.oswald6, fontSize: 12, color: C.accent2, textDecorationLine: 'underline' },
  enCours: { fontFamily: F.inter, fontSize: 11.5, color: C.muted, paddingVertical: 8 },
});
