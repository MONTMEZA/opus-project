/**
 * « Qu'est-ce qu'il fait ? » — la première question d'un client.
 *
 * CE QUE CE BLOC REMPLACE
 * -----------------------
 * Avant, la fiche d'un artisan disait « Maçonnerie générale **+2** » sous
 * le nom de l'entreprise — et on ne voyait jamais les deux autres. Les
 * spécialités, elles, étaient quarante lignes plus bas, en vrac, à la fin
 * du bloc « Contact et déplacement ».
 *
 * Remarque du propriétaire, le 01/10/2026, et elle était juste : « on ne
 * comprend pas pourquoi un maçon aurait en spécialité toiture en tuile ».
 * Rien ne disait de quel métier venait quoi, parce que rien ne les
 * rapprochait.
 *
 * CE QUE CELUI-CI FAIT
 * --------------------
 *   - il montre **les quatre métiers**, jamais « +2 » : ils tiennent, il
 *     y en a quatre au maximum ;
 *   - **chaque spécialité est sous son métier**, donc la question ne se
 *     pose plus ;
 *   - et il est **tout en haut**, avant la présentation et avant le
 *     téléphone. Un client veut d'abord savoir si l'artisan fait ce dont
 *     il a besoin ; le reste ne l'intéresse qu'ensuite.
 *
 * LE MÉTIER PRINCIPAL
 * -------------------
 * C'est le premier, et il porte une étoile — la même qu'au moment de le
 * choisir. C'est l'étiquette par laquelle l'artisan apparaît partout
 * ailleurs : dans le fil, sur ses publications, dans les résultats.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F, T, S, R, interligne } from '../theme';
import { SectionLabel } from './ui';
import { Star } from './icons';
import { metiersAvecSpecialites, nomMetier, nomSpecialite } from '../lib/metiers';

export default function MetiersPro({ pro, estMoi = false, onEdit }) {
  const { groupes, autres } = metiersAvecSpecialites(pro);
  if (!groupes.length) return null;

  const aucuneSpecialite = !autres.length
    && groupes.every((g) => !g.specialites.length);

  return (
    <>
      <SectionLabel>Métiers et spécialités</SectionLabel>

      <View style={s.bloc}>
        {groupes.map((g, i) => (
          <View key={g.metier} style={[s.groupe, i > 0 && s.groupeSuivant]}>
            <View style={s.ligneMetier}>
              {i === 0 && <Star size={12} color={C.accent} />}
              <Text style={[s.metier, i === 0 && s.metierPrincipal]}>
                {nomMetier(g.metier)}
              </Text>
            </View>

            {g.specialites.length > 0 && (
              <View style={s.rang}>
                {g.specialites.map((x) => (
                  <View key={x} style={s.pastille}>
                    <Text style={s.pastilleTexte}>{nomSpecialite(x)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Ce qui n'appartient à aucun des métiers déclarés : les mots
            écrits à la main, et ceux restés d'un métier retiré depuis.
            On ne les jette pas — ce sont les siens. */}
        {autres.length > 0 && (
          <View style={[s.groupe, s.groupeSuivant]}>
            <Text style={s.autresTitre}>Aussi</Text>
            <View style={s.rang}>
              {autres.map((x) => (
                <View key={x} style={s.pastille}>
                  <Text style={s.pastilleTexte}>{nomSpecialite(x)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Un visiteur n'a rien à faire d'un cadre vide ; le propriétaire
            de la fiche, si : c'est par les spécialités qu'on le trouve. */}
        {aucuneSpecialite && estMoi && (
          <Text style={s.invite}>
            Aucune spécialité déclarée. Ce sont les mots que vos clients
            tapent dans la recherche — « mur de soutènement », « douche à
            l'italienne ». Sans eux, on ne vous trouve que par votre métier.
            {onEdit ? '\nComplétez-les dans « Modifier mon profil ».' : ''}
          </Text>
        )}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  /* Le bloc PORTE l'information : angle vif, comme toutes les cartes. */
  bloc: {
    backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: C.line, paddingHorizontal: S.lg, paddingVertical: S.md,
  },
  groupe: { paddingVertical: S.sm },
  groupeSuivant: { borderTopWidth: 1, borderTopColor: C.line },

  ligneMetier: { flexDirection: 'row', alignItems: 'center', gap: S.xs + 2 },
  metier: { fontFamily: F.oswald6, fontSize: T.corps, color: C.ink, letterSpacing: 0.3 },
  metierPrincipal: { fontSize: T.sousTitre, color: C.ink },

  rang: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm - 2, marginTop: S.sm },
  /* Une pastille flotte au-dessus du fond : arrondie. */
  pastille: {
    borderWidth: 1, borderColor: C.accent2, borderRadius: R.gelule,
    paddingVertical: 5, paddingHorizontal: S.md - 2,
  },
  pastilleTexte: { fontFamily: F.inter6, fontSize: T.petit, color: C.accent2 },

  autresTitre: { fontFamily: F.inter, fontSize: T.petit, color: C.muted },

  invite: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), paddingTop: S.sm,
  },
});
