/**
 * LA RECHERCHE DE LA PLACE DES PROS — une ligne au lieu de quatre rangées.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Relevé par le propriétaire le 04/10/2026, en demandant un filtre par
 * secteur :
 *
 *   « On a "quoi ?" avec les propositions de choix en dessous, "quand ?"
 *     avec les propositions de choix… si on ajoute "où ?" je trouve que ça
 *     va faire beaucoup et désordonné. Il faudrait peut-être créer une
 *     autre façon de chercher, plus jolie, plus propre et facile à
 *     utiliser. »
 *
 * MESURÉ AU NAVIGATEUR, sur une fenêtre d'iPhone (390 × 900), avant ce
 * lot :
 *
 *   | filtres repliés            | 233 px | il reste 131 px de la 1re annonce |
 *   | « Dates précises » ouvert  | 285 px | il reste  79 px                   |
 *
 * Autrement dit : on arrivait sur la Place des pros et on voyait huit
 * centimètres de puces avant le début d'une annonce. Une rangée « OÙ ? »
 * de plus (≈ 85 px) aurait poussé la première annonce **entièrement sous
 * l'écran**.
 *
 * CE QUI REMPLACE : quatre pastilles sur UNE ligne. Chacune ouvre un petit
 * panneau et affiche ensuite le choix fait. Rien n'est caché derrière un
 * mot vague comme « Filtrer » — on lit « Matériel », « 50 km », « Cette
 * semaine » sans ouvrir quoi que ce soit.
 *
 * ET POURQUOI PAS UN BOUTON « FILTRER » UNIQUE, le standard des sites
 * d'annonces : parce qu'un filtre qu'on ne voit pas est un filtre qu'on
 * oublie d'enlever. On cherche ensuite pendant cinq minutes pourquoi « il
 * n'y a rien ». Même famille que le voyant du 04/10 : un signal doit dire
 * OÙ.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, TOUCHE, interligne,
} from '../theme';
import { ChevronDown, Check } from './icons';
import FeuilleBas from './FeuilleBas';
import { Calendrier } from './Calendrier';
import ChampVille from './ChampVille';
import { RAYONS_KM } from '../lib/adresse';
import {
  libelleDates, jourCourt, creneauSemaine, creneauMois,
} from '../lib/formats';

/* ==========================================================================
 *  LA PASTILLE
 * ========================================================================== */

/**
 * `valeur` remplace le `label` dès qu'un choix est fait, et la pastille se
 * remplit. On ne les affiche pas tous les deux : « Quoi : Matériel » prend
 * deux fois la place pour la même information, et la place est exactement
 * ce qui manquait.
 */
export function PastilleFiltre({ label, valeur, onPress, icone: Icone = null }) {
  const actif = !!valeur;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.pastille, actif && s.pastilleOn, pressed && s.pressee]}
      accessibilityRole="button"
      accessibilityState={{ selected: actif }}
      accessibilityLabel={actif ? `${label} : ${valeur}. Modifier` : `${label}. Choisir`}
    >
      {Icone && <Icone size={13} color={actif ? C.surAccent : C.muted} />}
      <Text style={[s.pastilleTexte, actif && s.pastilleTexteOn]} numberOfLines={1}>
        {valeur || label}
      </Text>
      <ChevronDown size={13} color={actif ? C.surAccent : C.muted} />
    </Pressable>
  );
}

/** Une pastille qui bascule, sans panneau : il n'y a rien à choisir. */
export function PastilleBascule({ label, on, onPress, icone: Icone = null }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.pastille, on && s.pastilleOn, pressed && s.pressee]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
    >
      {Icone && <Icone size={13} color={on ? C.surAccent : C.muted} />}
      <Text style={[s.pastilleTexte, on && s.pastilleTexteOn]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

/* EXPORTÉES — la feuille de recherche du fil s'en sert, et recopier ces
   deux briques ferait diverger deux panneaux qui doivent se ressembler.
   La Place des pros, les Demandes et le fil parlent la même langue. */

/** Une ligne de choix dans un panneau : plus lisible qu'une puce de plus. */
export function Ligne({ texte, aide, choisi, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.ligne, pressed && s.lignePressee]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!choisi }}
      accessibilityLabel={texte}
    >
      <View style={s.ligneTextes}>
        <Text style={[s.ligneTexte, choisi && s.ligneTexteOn]}>{texte}</Text>
        {!!aide && <Text style={s.ligneAide}>{aide}</Text>}
      </View>
      {choisi && <Check size={16} color={C.accentTexte} />}
    </Pressable>
  );
}

/** Les rayons : des puces, parce qu'on les compare d'un coup d'œil. */
export function Rayons({ valeur, onChange, ferme = false }) {
  return (
    <View style={s.rangee}>
      {RAYONS_KM.map((km) => (
        <Pressable
          key={km}
          disabled={ferme}
          onPress={() => onChange(km)}
          style={({ pressed }) => [
            s.rayon, valeur === km && s.rayonOn, ferme && s.rayonFerme,
            pressed && s.pressee,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: valeur === km, disabled: ferme }}
          accessibilityLabel={`${km} kilomètres`}
        >
          <Text style={[s.rayonTexte, valeur === km && s.rayonTexteOn]}>{km} km</Text>
        </Pressable>
      ))}
    </View>
  );
}

/* ==========================================================================
 *  QUOI
 * ========================================================================== */
export function FeuilleQuoi({ types, valeur, onChoisir, onFermer }) {
  return (
    <FeuilleBas titre="Quel type d’annonce ?" onFermer={onFermer}>
      <Ligne
        texte="Tous les types"
        choisi={!valeur}
        onPress={() => { onChoisir(null); onFermer(); }}
      />
      {types.map((t) => (
        <Ligne
          key={t.cle}
          texte={t.label}
          aide={t.aide}
          choisi={valeur === t.cle}
          onPress={() => { onChoisir(t.cle); onFermer(); }}
        />
      ))}
    </FeuilleBas>
  );
}

/* ==========================================================================
 *  OÙ
 * ========================================================================== */

/**
 * `moi` porte la ville et les coordonnées de celui qui cherche.
 *
 * S'IL N'EN A PAS, ON LE DIT, et on ne propose pas « autour de moi » en
 * grisé sans explication : un bouton fermé sans raison fait croire à une
 * panne. Le cas est réel — relevé le 04/10/2026, une seule fiche sur sept
 * portait des coordonnées.
 */
export function FeuilleOu({ secteur, moi, onChoisir, onFermer }) {
  const jeSuisSitue = typeof (moi || {}).latitude === 'number';
  const [centre, setCentre] = useState(secteur ? secteur.centre : (jeSuisSitue ? 'moi' : null));
  const [ville, setVille] = useState(secteur && secteur.centre === 'ville'
    ? { affichage: secteur.affichage, latitude: secteur.latitude, longitude: secteur.longitude }
    : {});
  const [rayon, setRayon] = useState(secteur ? secteur.rayonKm : 50);

  const villeSituee = typeof ville.latitude === 'number';
  const pret = (centre === 'moi' && jeSuisSitue) || (centre === 'ville' && villeSituee);

  const valider = () => {
    if (!pret) return;
    onChoisir(centre === 'moi'
      ? {
        centre: 'moi', rayonKm: rayon,
        latitude: moi.latitude, longitude: moi.longitude,
        affichage: moi.ville || 'ma ville',
      }
      : {
        centre: 'ville', rayonKm: rayon,
        latitude: ville.latitude, longitude: ville.longitude,
        affichage: ville.affichage,
      });
    onFermer();
  };

  return (
    <FeuilleBas titre="Où chercher ?" onFermer={onFermer}>
      <Ligne
        texte="Partout en France"
        choisi={!centre}
        onPress={() => { onChoisir(null); onFermer(); }}
      />

      <Text style={s.titreBloc}>Autour de</Text>

      {jeSuisSitue ? (
        <Ligne
          texte="Ma ville"
          aide={moi.ville || null}
          choisi={centre === 'moi'}
          onPress={() => setCentre('moi')}
        />
      ) : (
        <Text style={s.avertissement}>
          Votre ville n’est pas encore enregistrée avec ses coordonnées.
          Ouvrez « Modifier mon profil » et choisissez-la dans la liste
          proposée : la recherche autour de vous marchera ensuite partout
          dans l’application.
        </Text>
      )}

      <Ligne
        texte="Une autre ville"
        aide={villeSituee ? ville.affichage : null}
        choisi={centre === 'ville'}
        onPress={() => setCentre('ville')}
      />

      {centre === 'ville' && (
        <ChampVille
          valeur={ville.affichage}
          onChange={setVille}
          placeholder="La ville du chantier, du matériel..."
        />
      )}

      <Text style={s.titreBloc}>Dans un rayon de</Text>
      <Rayons valeur={rayon} onChange={setRayon} ferme={!centre} />

      <Pressable
        onPress={valider}
        disabled={!pret}
        style={({ pressed }) => [s.btnPlein, !pret && s.btnFerme, pressed && s.pressee]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !pret }}
        accessibilityLabel="Valider le secteur"
      >
        <Text style={s.btnPleinTexte}>
          {pret ? `Chercher à ${rayon} km` : 'Choisissez un point de départ'}
        </Text>
      </Pressable>
    </FeuilleBas>
  );
}

/* ==========================================================================
 *  QUAND
 * ========================================================================== */

/**
 * LES RACCOURCIS ET LE CALENDRIER DANS LE MÊME PANNEAU.
 *
 * Avant, « Dates précises » était une puce qui FAISAIT APPARAÎTRE deux
 * champs sous la rangée — donc la mise en page sautait, et la hauteur des
 * filtres passait de 233 à 285 px. Ici, toucher « Cette semaine » remplit
 * la grille : on VOIT ce que le raccourci veut dire, ce qu'aucune puce ne
 * disait.
 */
export function FeuilleQuand({ debut, fin, mode, onChoisir, onFermer }) {
  const [sel, setSel] = useState({ debut: debut || null, fin: fin || null, mode: mode || null });

  const raccourci = (nom) => {
    const c = nom === 'semaine' ? creneauSemaine() : creneauMois();
    setSel({ debut: c.debut, fin: c.fin, mode: nom });
  };

  /* Toucher la grille sort du raccourci : ce ne sont plus « les sept jours
     qui viennent », ce sont des dates choisies. */
  const toucher = (iso) => {
    setSel((v) => {
      if (!v.debut || v.fin) return { debut: iso, fin: null, mode: null };
      if (iso < v.debut) return { debut: iso, fin: null, mode: null };
      return { debut: v.debut, fin: iso, mode: null };
    });
  };

  return (
    <FeuilleBas titre="Quand ?" onFermer={onFermer}>
      <View style={s.rangee}>
        <Pressable
          onPress={() => raccourci('semaine')}
          style={({ pressed }) => [s.raccourci, sel.mode === 'semaine' && s.raccourciOn, pressed && s.pressee]}
          accessibilityRole="button"
          accessibilityState={{ selected: sel.mode === 'semaine' }}
          accessibilityLabel="Cette semaine"
        >
          <Text style={[s.raccourciTexte, sel.mode === 'semaine' && s.raccourciTexteOn]}>
            Cette semaine
          </Text>
        </Pressable>
        <Pressable
          onPress={() => raccourci('mois')}
          style={({ pressed }) => [s.raccourci, sel.mode === 'mois' && s.raccourciOn, pressed && s.pressee]}
          accessibilityRole="button"
          accessibilityState={{ selected: sel.mode === 'mois' }}
          accessibilityLabel="Ce mois-ci"
        >
          <Text style={[s.raccourciTexte, sel.mode === 'mois' && s.raccourciTexteOn]}>
            Ce mois-ci
          </Text>
        </Pressable>
      </View>

      <Text style={s.lecture}>
        {libelleDates(sel.debut, sel.fin)
          || 'Touchez un raccourci, ou le premier jour puis le dernier.'}
      </Text>

      <Calendrier debut={sel.debut} fin={sel.fin} onJour={toucher} />

      <View style={s.rangee}>
        <Pressable
          onPress={() => { onChoisir(null, null, null); onFermer(); }}
          style={({ pressed }) => [s.btnVide, pressed && s.pressee]}
          accessibilityRole="button"
          accessibilityLabel="N’importe quand"
        >
          <Text style={s.btnVideTexte}>N’importe quand</Text>
        </Pressable>
        <Pressable
          onPress={() => { onChoisir(sel.debut, sel.fin, sel.mode); onFermer(); }}
          style={({ pressed }) => [s.btnPlein, { flex: 1 }, pressed && s.pressee]}
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
 *  LES ÉTIQUETTES DES PASTILLES
 * ========================================================================== */

/** Ce que la pastille « Où » affiche une fois réglée. */
export function libelleSecteur(secteur) {
  if (!secteur) return null;
  return secteur.centre === 'moi'
    ? `${secteur.rayonKm} km`
    : `${secteur.affichage} · ${secteur.rayonKm} km`;
}

/** Ce que la pastille « Quand » affiche une fois réglée. */
export function libelleQuand(debut, fin, mode) {
  if (mode === 'semaine') return 'Cette semaine';
  if (mode === 'mois') return 'Ce mois-ci';
  if (!debut && !fin) return null;
  if (debut && fin) return `${jourCourt(debut)} → ${jourCourt(fin)}`;
  return libelleDates(debut, fin);
}

const s = StyleSheet.create({
  /* Une pastille FLOTTE et on appuie dessus : arrondi complet, règle des
     bords de `theme.js`. Et elle fait 44 points par sa BOÎTE, pas par un
     `hitSlop` que le navigateur ignore. */
  pastille: {
    flexDirection: 'row', alignItems: 'center', gap: S.xs,
    minHeight: TOUCHE, paddingHorizontal: S.md,
    borderRadius: R.gelule, borderWidth: 1, borderColor: C.bordChamp,
    backgroundColor: C.surface, maxWidth: 220,
  },
  pastilleOn: { backgroundColor: C.accent, borderColor: C.accent },
  pastilleTexte: {
    flexShrink: 1, fontFamily: F.oswald, fontSize: T.courant, color: C.ink,
  },
  pastilleTexteOn: { color: C.surAccent },
  pressee: { opacity: 0.72, transform: [{ scale: 0.97 }] },

  ligne: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    minHeight: TOUCHE, paddingVertical: S.sm,
  },
  lignePressee: { opacity: 0.55 },
  ligneTextes: { flex: 1, minWidth: 0 },
  ligneTexte: { fontFamily: F.inter5, fontSize: T.corps, color: C.ink },
  ligneTexteOn: { fontFamily: F.inter6, color: C.accentTexte },
  ligneAide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit),
  },

  titreBloc: {
    fontFamily: F.oswald6, fontSize: T.petit, color: C.muted,
    letterSpacing: 0.6, marginTop: S.md,
  },
  avertissement: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit),
  },

  rangee: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  rayon: {
    minHeight: TOUCHE, paddingHorizontal: S.md, justifyContent: 'center',
    borderRadius: R.gelule, borderWidth: 1, borderColor: C.bordChamp,
  },
  rayonOn: { backgroundColor: C.accent, borderColor: C.accent },
  rayonFerme: { opacity: 0.4 },
  rayonTexte: { fontFamily: F.oswald, fontSize: T.courant, color: C.ink },
  rayonTexteOn: { color: C.surAccent },

  raccourci: {
    flex: 1, minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.gelule, borderWidth: 1, borderColor: C.bordChamp,
  },
  raccourciOn: { backgroundColor: C.accent, borderColor: C.accent },
  raccourciTexte: { fontFamily: F.oswald, fontSize: T.courant, color: C.ink },
  raccourciTexteOn: { color: C.surAccent },

  lecture: {
    fontFamily: F.inter5, fontSize: T.corps, lineHeight: interligne(T.corps),
    color: C.muted, marginTop: S.sm,
  },

  btnVide: {
    minHeight: TOUCHE, paddingHorizontal: S.md,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: R.gelule, borderWidth: 1, borderColor: C.bordChamp,
  },
  btnVideTexte: { fontFamily: F.oswald, fontSize: T.courant, color: C.ink },
  btnPlein: {
    minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center',
    borderRadius: R.gelule, backgroundColor: C.accent, marginTop: S.md,
  },
  btnFerme: { backgroundColor: C.line },
  btnPleinTexte: { fontFamily: F.oswald, fontSize: T.courant, color: C.surAccent },
});
