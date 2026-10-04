/**
 * CHOISIR UN CRÉNEAU DE CHANTIER AU DOIGT.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Demandé par le propriétaire le 04/10/2026 :
 *
 *   « Quand on doit sélectionner des dates il faut les taper à la main. Je
 *     pense que ce serait mieux que quand on sélectionne l'espace pour
 *     rentrer la date, un petit calendrier s'ouvre et qu'on puisse
 *     sélectionner directement dessus. Ce serait plus ludique et il y
 *     aurait moins d'erreurs. »
 *
 * « Moins d'erreurs » n'était pas une impression. La saisie à la main
 * acceptait **« 31/02 »** : `versISO` vérifiait que le jour tenait entre 1
 * et 31 et que le mois tenait entre 1 et 12, mais pas que ce jour-là
 * existe dans CE mois. La ligne partait donc vers une colonne `date` de
 * PostgreSQL, qui la refusait — « date/time field value out of range ».
 * Un refus de la base pour une faute de frappe, et rien à l'écran pour
 * l'expliquer. Un calendrier ne peut pas proposer le 31 février.
 *
 * CE QU'IL REMPLACE, ET CE QUI A DONC DISPARU DU DÉPÔT
 * ---------------------------------------------------
 * `versISO` (« 12/10 » → « 2026-10-12 ») n'a plus un seul appelant : les
 * deux écrans qui s'en servaient reçoivent désormais des dates déjà
 * écrites en « AAAA-MM-JJ ». Elle est partie, avec ses sept contrôles.
 *
 * Ce n'est pas du ménage de confort : une fonction que personne n'appelle
 * est le « bouton §18 » de CLAUDE.md — du code qui a l'air de faire
 * quelque chose, qu'un contrôle couvre consciencieusement, et qui ne sert
 * à rien. La garder « au cas où » aurait aussi gardé le défaut du
 * 31 février.
 *
 * LES CALCULS NE SONT PAS ICI
 * ---------------------------
 * Ils vivent dans `src/lib/formats.js`, qui n'importe RIEN — cinquième
 * application de la leçon de `cloudinary-adresses.js`. Une grille de
 * calendrier se trompe d'une case sans que ça se voie, et seule une
 * machine qui la fait tourner mois par mois le remarque
 * (`npm run verifier-annonces`).
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, viser, interligne,
} from '../theme';
import {
  JOURS_COURTS, SEMAINES_MAX, grilleMois, moisDe, moisDecale, nomMois,
  dansIntervalle, libelleDates, jourCourant,
} from '../lib/formats';
import { ChevronLeft, ChevronRight } from './icons';
import FeuilleBas from './FeuilleBas';

/* ==========================================================================
 *  LA GRILLE SEULE — réutilisable ailleurs (un planning de chantier, un
 *  jour de disponibilité) sans traîner la feuille avec elle.
 * ========================================================================== */
export function Calendrier({ debut, fin, minimum = null, onJour }) {
  const [mois, setMois] = useState(moisDe(debut) || moisDe(jourCourant()));
  const semaines = grilleMois(mois);
  const aujourdhui = jourCourant();

  return (
    <View>
      {/* L'EN-TÊTE DU MOIS. Les deux flèches sont des boutons de 44 points :
          ce sont les cibles les plus utilisées de l'écran, et les rater
          fait changer de mois dans le mauvais sens. */}
      <View style={s.entete}>
        <Pressable
          onPress={() => setMois(moisDecale(mois, -1))}
          style={({ pressed }) => [s.fleche, pressed && s.flechePressee]}
          accessibilityRole="button"
          accessibilityLabel={`Mois précédent, ${nomMois(moisDecale(mois, -1))}`}
        >
          <ChevronLeft size={20} color={C.ink} />
        </Pressable>

        <Text style={s.mois}>{nomMois(mois)}</Text>

        <Pressable
          onPress={() => setMois(moisDecale(mois, 1))}
          style={({ pressed }) => [s.fleche, pressed && s.flechePressee]}
          accessibilityRole="button"
          accessibilityLabel={`Mois suivant, ${nomMois(moisDecale(mois, 1))}`}
        >
          <ChevronRight size={20} color={C.ink} />
        </Pressable>
      </View>

      {/* LES INITIALES DES JOURS. Deux « M » de suite paraissent fautifs, et
          c'est pourtant juste : mardi et mercredi. `importantForAccessibility`
          les retire du parcours parlé — un lecteur d'écran qui annonce
          « L M M J V S D » avant la grille ne rend service à personne, et
          chaque jour porte déjà sa date complète. */}
      <View style={s.semaine} importantForAccessibility="no-hide-descendants">
        {JOURS_COURTS.map((j, i) => (
          <Text key={`${j}${i}`} style={s.initiale}>{j}</Text>
        ))}
      </View>

      {/* LA HAUTEUR EST RÉSERVÉE POUR SIX SEMAINES. Un mois en occupe 4, 5
          ou 6 ; sans cette réserve, « Valider » remonte d'une rangée en
          changeant de mois, et le doigt appuie à côté. */}
      <View style={{ minHeight: SEMAINES_MAX * (TOUCHE + S.xs) }}>
        {semaines.map((sem, i) => (
          <View key={i} style={s.semaine}>
            {sem.map((iso, k) => {
              if (!iso) return <View key={k} style={s.case_} />;
              const trop_tot = minimum && iso < minimum;
              const bout = iso === debut || (fin && iso === fin);
              const dedans = dansIntervalle(iso, debut, fin);
              return (
                <Pressable
                  key={k}
                  disabled={trop_tot}
                  onPress={() => onJour(iso)}
                  style={({ pressed }) => [
                    s.case_,
                    dedans && !bout && s.dedans,
                    bout && s.bout,
                    pressed && !bout && s.pressee,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: dedans, disabled: !!trop_tot }}
                  accessibilityLabel={`${Number(iso.slice(8))} ${nomMois(moisDe(iso))}`}
                >
                  <Text
                    style={[
                      s.chiffre,
                      iso === aujourdhui && s.chiffreAujourdhui,
                      trop_tot && s.chiffrePasse,
                      bout && s.chiffreBout,
                    ]}
                  >
                    {Number(iso.slice(8))}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

/* ==========================================================================
 *  LA FEUILLE — un créneau, deux appuis
 * ========================================================================== */

/**
 * `minimum` ne vaut PAS la même chose des deux côtés, et c'est voulu.
 *
 *   - dans le FORMULAIRE d'annonce, c'est aujourd'hui : un chantier qui a
 *     déjà eu lieu n'est pas une annonce, et le laisser poser ne sert
 *     qu'à produire une ligne qui sortira aussitôt de la liste ;
 *   - dans le FILTRE, il n'y a pas de minimum. Un filtre est une question,
 *     pas un engagement — et l'auteur d'une annonce terminée doit pouvoir
 *     la retrouver, puisqu'elle lui reste visible.
 */
export default function FeuilleDates({
  debut: debutInitial, fin: finInitiale, minimum = null, onValider, onFermer,
  titre = 'Choisir les dates',
}) {
  const [debut, setDebut] = useState(debutInitial || null);
  const [fin, setFin] = useState(finInitiale || null);

  /**
   * UN APPUI POSE LE DÉBUT, LE SUIVANT POSE LA FIN — et un appui AVANT le
   * début recommence là.
   *
   * C'est ce qui rend le geste impossible à rater : il n'existe aucun
   * enchaînement qui produise un créneau à l'envers, donc aucun message
   * d'erreur à écrire. Choisir le 20 puis le 12 ne « refuse » pas, ça
   * repart du 12.
   */
  const toucher = (iso) => {
    if (!debut || fin) { setDebut(iso); setFin(null); return; }
    if (iso < debut) { setDebut(iso); setFin(null); return; }
    setFin(iso);
  };

  return (
    <FeuilleBas titre={titre} onFermer={onFermer}>
      {/* LE CRÉNEAU EN MOTS, toujours à la même place. C'est lui qui porte
          l'information quand la teinte pâle ne se distingue pas — dehors,
          en plein soleil, ou pour qui voit mal les couleurs. */}
      <Text style={s.lecture}>
        {libelleDates(debut, fin)
          || 'Appuyez sur le premier jour, puis sur le dernier.'}
      </Text>

      <Calendrier debut={debut} fin={fin} minimum={minimum} onJour={toucher} />

      <View style={s.actions}>
        <Pressable
          onPress={() => { setDebut(null); setFin(null); }}
          style={({ pressed }) => [s.btnVide, pressed && s.pressee]}
          accessibilityRole="button"
          accessibilityLabel="Effacer les dates"
        >
          <Text style={s.btnVideTexte}>Effacer</Text>
        </Pressable>

        <Pressable
          onPress={() => { onValider(debut, fin); onFermer(); }}
          style={({ pressed }) => [s.btnPlein, pressed && s.pressee]}
          accessibilityRole="button"
          accessibilityLabel="Valider les dates"
        >
          <Text style={s.btnPleinTexte}>Valider</Text>
        </Pressable>
      </View>
    </FeuilleBas>
  );
}

/* ==========================================================================
 *  LE BOUTON QUI OUVRE LA FEUILLE — à la place d'un champ de saisie
 * ========================================================================== */

/**
 * CE N'EST PLUS UN CHAMP DE TEXTE, ET C'EST LE POINT.
 *
 * Un `TextInput` sur lequel on appuie ouvre le clavier. Poser une feuille
 * par-dessus laisserait donc le clavier dessous, à pousser la mise en page
 * d'une fenêtre où il n'y a rien à écrire — exactement le défaut du matin,
 * par une autre porte. Un `Pressable` n'a pas ce problème : rien ne prend
 * le focus, rien ne monte.
 */
export function ChampDate({ valeur, placeholder, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.champ, pressed && s.pressee]}
      accessibilityRole="button"
      accessibilityLabel={valeur ? `${placeholder} : ${valeur}` : placeholder}
    >
      <Text style={[s.champTexte, !valeur && s.champVide]} numberOfLines={1}>
        {valeur || placeholder}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  entete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: S.sm,
  },
  /* La flèche est une icône seule : on agrandit la BOÎTE plutôt que de
     poser un `hitSlop` que le navigateur ignore (règle du lot 5). */
  fleche: {
    width: TOUCHE, height: TOUCHE, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.gelule,
  },
  flechePressee: { backgroundColor: C.bg },
  mois: {
    flex: 1, minWidth: 0, textAlign: 'center',
    fontFamily: F.oswald6, fontSize: T.sousTitre, color: C.ink,
  },

  semaine: { flexDirection: 'row', gap: S.xs, marginBottom: S.xs },
  initiale: {
    flex: 1, textAlign: 'center',
    fontFamily: F.inter5, fontSize: T.petit, color: C.muted,
  },

  /* UNE CASE EST CARRÉE ET REMPLIT LA LARGEUR DISPONIBLE.
     Sept colonnes dans une feuille de 390 points (un iPhone courant)
     donnent 48 points de côté : au-dessus des 44. Sur le plus petit
     écran encore vendu (320 points), elles tombent à 39 — aucun
     calendrier au monde ne fait autrement avec sept colonnes, donc
     `minHeight` garantit au moins les 44 en HAUTEUR, et la cible fait
     39 × 44 plutôt que 39 × 39. C'est mesuré, ce n'est pas une
     estimation. */
  case_: {
    flex: 1, aspectRatio: 1, minHeight: TOUCHE,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: R.gelule,
  },
  /* Un jour est quelque chose sur quoi on APPUIE, donc il s'arrondit —
     règle des bords de `theme.js`. La grille, elle, n'a pas de cadre :
     elle n'a rien à porter. */
  dedans: { backgroundColor: C.accentBg },
  bout: { backgroundColor: C.accent },
  pressee: { opacity: 0.72, transform: [{ scale: 0.97 }] },

  chiffre: { fontFamily: F.inter5, fontSize: T.corps, color: C.ink },
  /* AUJOURD'HUI SE RECONNAÎT À SON TRAIT, pas à une couleur de fond : le
     fond est déjà pris par la sélection, et deux fonds qui se
     ressemblent dans la même grille ne veulent plus rien dire. */
  chiffreAujourdhui: { fontFamily: F.inter6, textDecorationLine: 'underline' },
  chiffrePasse: { color: C.line },
  chiffreBout: { color: C.surAccent, fontFamily: F.inter6 },

  lecture: {
    fontFamily: F.inter5, fontSize: T.corps, lineHeight: interligne(T.corps),
    color: C.muted, marginBottom: S.sm,
  },

  actions: { flexDirection: 'row', gap: S.sm, marginTop: S.sm },
  btnVide: {
    flex: 1, minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.gelule, borderWidth: 1, borderColor: C.bordChamp,
  },
  btnVideTexte: { fontFamily: F.oswald, fontSize: T.courant, color: C.ink },
  btnPlein: {
    flex: 1, minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.gelule, backgroundColor: C.accent,
  },
  btnPleinTexte: { fontFamily: F.oswald, fontSize: T.courant, color: C.surAccent },

  /* Le champ PORTE une information, donc angle vif et bordure de champ —
     il est posé dans un formulaire, exactement comme les autres. */
  champ: {
    minHeight: TOUCHE, justifyContent: 'center',
    paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.bordChamp, borderRadius: R.vif,
    backgroundColor: C.surface,
  },
  champTexte: { fontFamily: F.inter, fontSize: T.courant, color: C.ink },
  champVide: { color: C.muted },
});

/* `viser` est importé pour rester cohérent avec le reste du projet : ici
   toutes les cibles font déjà 44 par leur BOÎTE, donc aucun `hitSlop`
   n'est nécessaire — et c'est la bonne façon, celle qui se mesure. */
void viser;
