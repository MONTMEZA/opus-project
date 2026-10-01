/**
 * La fiche de contact d'un artisan : téléphone, zone d'intervention,
 * spécialités.
 *
 * POURQUOI UN COMPOSANT PARTAGÉ
 * -----------------------------
 * Deux écrans montrent exactement la même chose : la page publique d'un
 * artisan (`ProfilProScreen`) et sa propre page (`ProfilOwnScreen`). Les
 * écrire deux fois, c'est se condamner à ce qu'ils divergent — et le jour
 * où ils divergent, l'artisan ne voit plus ce que ses clients voient.
 *
 * D'où le drapeau `estMoi` : le même bloc, mais avec une invitation à le
 * remplir quand il est vide. Un visiteur n'a rien à faire d'un cadre vide ;
 * le propriétaire, si.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { C, F, T, S, R, interligne } from '../theme';
import { SectionLabel } from './ui';
import { Phone, MapPin, Clock } from './icons';
import { etatMaintenant, semaineGroupee } from '../lib/horaires';
import { nomSpecialite } from '../lib/metiers';
import CarteZone from './CarteZone';

export default function FicheContactPro({ pro, estMoi = false, onEdit }) {
  const telephone = pro.telephone || '';
  const zoneKm = pro.zoneKm || null;
  const specialites = pro.specialites || [];
  const etat = etatMaintenant(pro.horaires);
  const semaine = semaineGroupee(pro.horaires);
  const [semaineOuverte, setSemaineOuverte] = useState(false);
  const rienDeRempli = !telephone && !zoneKm && specialites.length === 0 && !etat;

  // Un visiteur ne voit rien plutôt qu'un cadre vide.
  if (rienDeRempli && !estMoi) return null;

  return (
    <>
      <SectionLabel>Contact et déplacement</SectionLabel>

      {rienDeRempli ? (
        <View style={s.bloc}>
          <Text style={s.invite}>
            Votre fiche ne porte ni téléphone, ni zone d'intervention, ni
            spécialité, ni horaires. Ce sont les choses qu'un client regarde
            avant d'appeler — et celles par lesquelles il vous trouve.
          </Text>
          <Pressable onPress={onEdit} accessibilityRole="button">
            <Text style={s.inviteLien}>Compléter ma fiche</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.bloc}>
          {!!telephone && (
            <Pressable
              style={s.ligne}
              onPress={() => Linking.openURL(`tel:${telephone.replace(/\s/g, '')}`)}
              accessibilityRole="button"
              accessibilityLabel={`Appeler ${pro.entreprise} au ${telephone}`}
            >
              <Phone size={16} color={C.accent} />
              <Text style={s.label}>Téléphone</Text>
              <Text style={s.valeurLien}>{telephone}</Text>
            </Pressable>
          )}

          {!!zoneKm && (
            <View style={s.ligne}>
              <MapPin size={16} color={C.muted} />
              <Text style={s.label}>Se déplace</Text>
              <Text style={s.valeur}>jusqu'à {zoneKm} km</Text>
            </View>
          )}

          {/* Le chiffre reste : il se lit, il se compare, il se retient.
              La carte, elle, se comprend sans réfléchir — « est-ce qu'il
              vient jusque chez moi ? » ne se répond pas de tête.
              Elle ne s'affiche que si la fiche porte des coordonnées. */}
          {!!zoneKm && (
            <CarteZone
              latitude={pro.latitude}
              longitude={pro.longitude}
              rayonKm={zoneKm}
              ville={pro.ville}
              style={s.carte}
            />
          )}

          {/* UNE SEULE PHRASE, d'abord : « Ouvert · ferme à 18 h ».
              Personne ne lit un tableau de sept lignes au moment où il
              tient son téléphone ; le tableau sert ensuite, pour préparer.
              D'où le repli. */}
          {!!etat && (
            <Pressable
              style={s.ligne}
              onPress={() => setSemaineOuverte((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={`${etat.texte}. ${semaineOuverte ? 'Masquer' : 'Voir'} la semaine`}
              aria-expanded={semaineOuverte}
            >
              <Clock size={16} color={etat.ouvert ? C.ok : C.muted} />
              <Text style={s.label}>Horaires</Text>
              <Text style={[s.valeur, { color: etat.ouvert ? C.ok : C.muted }]}>
                {etat.texte}
              </Text>
            </Pressable>
          )}

          {!!etat && semaineOuverte && (
            <View style={s.semaine}>
              {semaine.map((l) => (
                <View key={l.jours} style={s.ligneSemaine}>
                  <Text style={s.jours}>{l.jours}</Text>
                  <Text style={[s.heures, l.texte === 'Fermé' && { color: C.muted }]}>
                    {l.texte}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {specialites.length > 0 && (
            <View style={s.specialites}>
              <Text style={s.specialitesTitre}>Spécialités</Text>
              <View style={s.rang}>
                {/* La fiche range `mur-soutenement` quand la spécialité
                    vient du catalogue : on affiche le nom, jamais la clé. */}
                {specialites.map((mot) => (
                  <View key={mot} style={s.pastille}>
                    <Text style={s.pastilleTexte}>{nomSpecialite(mot)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  /* Le bloc PORTE l'information : angle vif, comme toutes les cartes. */
  bloc: {
    backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: C.line, paddingHorizontal: S.lg,
  },
  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm + 2,
    paddingVertical: S.md - 2,
  },
  label: { flex: 1, fontFamily: F.inter, fontSize: T.courant, color: C.muted },
  valeur: { fontFamily: F.inter6, fontSize: T.courant + 0.5, color: C.ink },
  /* Un numéro de téléphone se lit de loin et se compose d'un doigt : il est
     plus gros que le reste, et de la couleur sur laquelle on appuie. */
  valeurLien: { fontFamily: F.oswald6, fontSize: T.sousTitre - 1, color: C.accent, letterSpacing: 0.3 },

  carte: { paddingBottom: S.md },

  semaine: {
    paddingBottom: S.md - 2, paddingLeft: S.lg + S.sm,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  ligneSemaine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  jours: { fontFamily: F.inter, fontSize: T.courant, color: C.muted },
  heures: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink },

  specialites: { paddingVertical: S.md - 2, borderTopWidth: 1, borderTopColor: C.line },
  specialitesTitre: {
    fontFamily: F.inter, fontSize: T.courant, color: C.muted, marginBottom: S.sm,
  },
  rang: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm - 2 },
  /* Une pastille flotte au-dessus du fond : arrondie. */
  pastille: {
    borderWidth: 1, borderColor: C.accent2, borderRadius: R.gelule,
    paddingVertical: 6, paddingHorizontal: S.md,
  },
  pastilleTexte: { fontFamily: F.oswald6, fontSize: T.petit + 0.5, color: C.accent2 },

  invite: {
    fontFamily: F.inter, fontSize: T.courant, color: C.muted,
    lineHeight: interligne(T.courant), paddingTop: S.md,
  },
  inviteLien: {
    fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2,
    textDecorationLine: 'underline', paddingVertical: S.md,
  },
});
