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
import { C, F, T, S, interligne  } from '../theme';
import { SectionLabel } from './ui';
import { Phone, Mail, MapPin, Clock } from './icons';
import { etatMaintenant, semaineGroupee } from '../lib/horaires';
import CarteZone from './CarteZone';

export default function FicheContactPro({ pro, estMoi = false, onEdit }) {
  const telephone = pro.telephone || '';
  const email = pro.emailPro || '';
  const zoneKm = pro.zoneKm || null;
  const etat = etatMaintenant(pro.horaires);
  const semaine = semaineGroupee(pro.horaires);
  const [semaineOuverte, setSemaineOuverte] = useState(false);
  const rienDeRempli = !telephone && !email && !zoneKm && !etat;

  // Un visiteur ne voit rien plutôt qu'un cadre vide.
  if (rienDeRempli && !estMoi) return null;

  return (
    <>
      <SectionLabel>Contact et déplacement</SectionLabel>

      {rienDeRempli ? (
        <View style={s.bloc}>
          <Text style={s.invite}>
            Votre fiche ne porte ni téléphone, ni e-mail, ni zone
            d'intervention, ni horaires. Ce sont les choses qu'un client
            regarde au moment de vous joindre.
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

          {/* L'e-mail PROFESSIONNEL, et jamais celui du compte. Celui-ci
              est déclaré pour être public, comme le téléphone ; l'autre a
              été retiré de ce que tout le monde peut lire le 29/09/2026,
              et le remettre à l'écran par une autre porte n'aurait aucun
              sens. */}
          {!!email && (
            <Pressable
              style={s.ligne}
              onPress={() => Linking.openURL(`mailto:${email}`)}
              accessibilityRole="button"
              accessibilityLabel={`Écrire à ${pro.entreprise} à l'adresse ${email}`}
            >
              <Mail size={16} color={C.accent2} />
              <Text style={s.label}>E-mail</Text>
              <Text style={s.valeurMail} numberOfLines={1}>{email}</Text>
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
  valeurLien: { fontFamily: F.oswald6, fontSize: T.sousTitre - 1, color: C.accentTexte, letterSpacing: 0.3 },
  /* L'e-mail est long : il ne peut pas avoir la taille du téléphone sans
     repousser son libellé hors de l'écran. */
  valeurMail: { flexShrink: 1, fontFamily: F.inter6, fontSize: T.courant, color: C.accent2 },

  carte: { paddingBottom: S.md },

  semaine: {
    paddingBottom: S.md - 2, paddingLeft: S.lg + S.sm,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  ligneSemaine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  jours: { fontFamily: F.inter, fontSize: T.courant, color: C.muted },
  heures: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink },

  invite: {
    fontFamily: F.inter, fontSize: T.courant, color: C.muted,
    lineHeight: interligne(T.courant), paddingTop: S.md,
  },
  inviteLien: {
    fontFamily: F.oswald6, fontSize: T.courant, color: C.accent2,
    textDecorationLine: 'underline', paddingVertical: S.md,
  },
});
