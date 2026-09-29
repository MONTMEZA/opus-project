/**
 * Les spécialités d'un artisan — du texte libre, et c'est tout l'intérêt.
 *
 * POURQUOI CE CHAMP EXISTE EN PLUS DES MÉTIERS
 * --------------------------------------------
 * `metiers` est une liste FERMÉE de douze entrées : Maçon, Électricien,
 * Carreleur… C'est ce qu'il faut pour trier, filtrer et vérifier. Mais ce
 * n'est pas ce qu'un particulier tape dans une recherche : personne ne
 * cherche « Maçon », on cherche « mur en pierre », « enduit à la chaux »,
 * « douche à l'italienne », « poêle à granulés ».
 *
 * Ces mots-là n'existaient nulle part dans le projet. Un artisan pouvait
 * être le seul du département à savoir faire une chose, et rester
 * introuvable pour exactement cette chose.
 *
 * LES DEUX LIMITES, ET POURQUOI
 * -----------------------------
 * Douze spécialités, quarante caractères chacune. Au-delà de douze,
 * personne ne les lit et la liste devient un filet à ratisser toutes les
 * recherches ; au-delà de quarante caractères, ce n'est plus un mot-clé,
 * c'est une phrase — et une phrase ne se retrouve jamais.
 *
 * Les deux limites sont aussi tenues PAR LA BASE (déclencheur
 * `tient_le_profil_pro`, section 17 de schema.sql). Ici, elles ne servent
 * qu'à éviter à l'artisan de découvrir le refus après coup.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F, T, S, R, interligne } from '../theme';
import { Field, BtnMini } from './ui';
import { X } from './icons';

export const MAX_SPECIALITES = 12;
export const LONGUEUR_MAX = 40;

/** Deux spécialités identiques à la casse près n'en font qu'une. */
const memeChose = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function ChampSpecialites({ valeurs = [], onChange, onErreur }) {
  const [saisie, setSaisie] = useState('');
  const liste = valeurs.filter(Boolean);

  const ajouter = () => {
    const mot = saisie.trim();
    if (!mot) return;
    if (mot.length > LONGUEUR_MAX) {
      onErreur && onErreur(`« ${mot.slice(0, 20)}… » fait plus de ${LONGUEUR_MAX} caractères : c'est une phrase, pas un mot-clé.`);
      return;
    }
    if (liste.some((x) => memeChose(x, mot))) { setSaisie(''); return; }
    if (liste.length >= MAX_SPECIALITES) {
      onErreur && onErreur(`${MAX_SPECIALITES} spécialités au maximum.`);
      return;
    }
    onChange([...liste, mot]);
    setSaisie('');
  };

  const retirer = (mot) => onChange(liste.filter((x) => x !== mot));

  return (
    <View>
      {liste.length > 0 && (
        <View style={s.rang}>
          {liste.map((mot) => (
            <View key={mot} style={s.pastille}>
              <Text style={s.pastilleTexte}>{mot}</Text>
              <Pressable
                onPress={() => retirer(mot)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Retirer la spécialité ${mot}`}
              >
                <X size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={s.ligneSaisie}>
        <View style={{ flex: 1 }}>
          <Field
            value={saisie}
            onChangeText={setSaisie}
            placeholder="Ex. : enduit à la chaux"
            onSubmitEditing={ajouter}
            returnKeyType="done"
            maxLength={LONGUEUR_MAX}
          />
        </View>
        <BtnMini
          label="Ajouter"
          onPress={ajouter}
          disabled={!saisie.trim() || liste.length >= MAX_SPECIALITES}
        />
      </View>

      <Text style={s.aide}>
        {liste.length} sur {MAX_SPECIALITES}. Ce sont les mots que vos clients
        tapent dans la recherche — écrivez-les comme eux, pas comme un devis.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  rang: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm - 2, marginBottom: S.sm },
  /* Une pastille FLOTTE au-dessus du fond et on appuie dessus (la croix) :
     elle est donc arrondie, comme les puces de filtre. */
  pastille: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm - 2,
    backgroundColor: C.accent2, paddingVertical: 6, paddingHorizontal: S.md,
    borderRadius: R.gelule,
  },
  pastilleTexte: { fontFamily: F.oswald6, fontSize: T.petit + 0.5, color: '#fff' },

  ligneSaisie: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), marginTop: S.xs,
  },
});
