/**
 * LA FEUILLE DE RECHERCHE DU FIL — ce que la loupe ouvre.
 *
 * DEMANDÉ PAR LE PROPRIÉTAIRE LE 05/10/2026
 * -----------------------------------------
 *   « Pour la recherche sur le fil je ne veux pas des grosses pastilles, je
 *     veux que l'écran du fil reste simple comme ça, peut-être juste une
 *     icône de loupe, et quand on clique on arrive sur une fenêtre où on
 *     paramètre notre recherche. »
 *
 * Il a raison, et pour une raison qui n'est pas que de goût : le fil est le
 * seul écran d'Opus où l'on vient pour REGARDER. La Place des pros et les
 * Demandes portent une rangée de pastilles parce qu'on y vient pour
 * CHERCHER — la question « quoi, où, quand » y est posée à l'arrivée. Ici
 * elle ne l'est pas, et l'afficher en permanence reviendrait à répondre à
 * une question que personne ne pose.
 *
 * UN SEUL PANNEAU, ET PAS QUATRE
 * ------------------------------
 * La Place des pros en a quatre, un par pastille, et c'est juste là-bas :
 * on y affine un critère à la fois. Ici on règle « ce que je veux voir »
 * d'un bloc, et on repart. Quatre allers-retours pour une seule intention
 * seraient trois de trop.
 *
 * ET LE RÉGLAGE NE S'APPLIQUE QU'À LA VALIDATION
 * ----------------------------------------------
 * Pas à chaque appui. Sinon chaque puce touchée relance une requête et
 * redessine le fil DERRIÈRE la feuille — quatre rechargements pour un seul
 * réglage, et le fil qui saute au moment où on le referme.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  C, F, T, S, R, viser, TOUCHE, interligne,
} from '../theme';
import FeuilleBas from './FeuilleBas';
import ChampVille from './ChampVille';
import { ChampMetier } from './SelecteurMetiers';
import { Ligne, Rayons } from './FiltresPlace';
import { FILTRE_VIDE, filtreActif } from '../lib/filtre-fil';

/** Les notes proposées. En dessous de 3, le filtre ne veut plus rien dire. */
const NOTES = [3, 4, 4.5];

export default function FeuilleRecherche({ filtre, moi, onValider, onFermer }) {
  const f = filtre || FILTRE_VIDE;
  const jeSuisSitue = typeof (moi || {}).latitude === 'number';

  const [metier, setMetier] = useState(f.metier || null);
  const [noteMin, setNoteMin] = useState(f.noteMin || null);
  const [verifies, setVerifies] = useState(!!f.verifies);

  const secteurPose = !!(f.secteur && f.secteur.rayonKm);
  const [centre, setCentre] = useState(secteurPose ? f.secteur.centre : null);
  const [ville, setVille] = useState(
    secteurPose && f.secteur.centre === 'ville'
      ? { affichage: f.secteur.ville, latitude: f.secteur.latitude, longitude: f.secteur.longitude }
      : {});
  const [rayon, setRayon] = useState(secteurPose ? f.secteur.rayonKm : 20);

  const villeSituee = typeof ville.latitude === 'number';
  const secteurPret = (centre === 'moi' && jeSuisSitue) || (centre === 'ville' && villeSituee);

  const construire = () => ({
    metier,
    noteMin,
    verifies,
    secteur: !secteurPret ? null : (centre === 'moi'
      ? {
        centre: 'moi', rayonKm: rayon,
        latitude: moi.latitude, longitude: moi.longitude,
        ville: moi.ville || 'ma ville',
      }
      : {
        centre: 'ville', rayonKm: rayon,
        latitude: ville.latitude, longitude: ville.longitude,
        ville: ville.affichage,
      }),
  });

  const futur = construire();
  const quelqueChose = filtreActif(futur);

  return (
    <FeuilleBas titre="Que voulez-vous voir ?" onFermer={onFermer}>
      <Text style={s.titreBloc}>Métier</Text>
      <ChampMetier
        valeur={metier}
        onChange={(m) => setMetier(m || null)}
        titre="Métier des publications"
        placeholder="Tous les métiers"
        avecTous
      />

      <Text style={s.titreBloc}>Où</Text>
      <Ligne
        texte="Partout en France"
        choisi={!centre}
        onPress={() => setCentre(null)}
      />
      {jeSuisSitue ? (
        <Ligne
          texte="Autour de moi"
          aide={moi.ville || null}
          choisi={centre === 'moi'}
          onPress={() => setCentre('moi')}
        />
      ) : (
        /* On le DIT, au lieu d'afficher une ligne qui ne répondrait pas.
           Un bouton qui ne fait rien quand on appuie dessus est la pire des
           deux solutions — même famille que les cases vides du calendrier,
           qui sont vraiment vides plutôt que grises. */
        <Text style={s.avertissement}>
          Votre ville n’est pas encore enregistrée avec ses coordonnées.
          Ouvrez « Modifier mon profil » et choisissez-la dans la liste
          proposée : la recherche autour de vous marchera ensuite partout
          dans l’application.
        </Text>
      )}
      <Ligne
        texte="Autour d’une autre ville"
        aide={villeSituee ? ville.affichage : null}
        choisi={centre === 'ville'}
        onPress={() => setCentre('ville')}
      />
      {centre === 'ville' && (
        <ChampVille
          valeur={ville.affichage}
          onChange={setVille}
          placeholder="La ville où vous cherchez..."
        />
      )}
      {!!centre && <Rayons valeur={rayon} onChange={setRayon} />}

      <Text style={s.titreBloc}>Note minimum</Text>
      <View style={s.rangee}>
        <Puce texte="Toutes" on={!noteMin} onPress={() => setNoteMin(null)} />
        {NOTES.map((n) => (
          <Puce
            key={n}
            texte={`${String(n).replace('.', ',')}/5`}
            on={noteMin === n}
            onPress={() => setNoteMin(noteMin === n ? null : n)}
          />
        ))}
      </View>
      {!!noteMin && (
        /* MESURÉ LE 05/10/2026 SUR LA VRAIE BASE : 4 artisans sur 7 n'ont
           AUCUN avis. Un filtre sur la note les écarte tous — donc tous les
           nouveaux inscrits, pour toujours. On ne peut pas faire autrement
           (on ne va pas leur prêter une note), mais le taire reviendrait à
           laisser croire qu'il n'y a personne. C'est la règle des
           « 3 annonces sans lieu précisé ne sont pas affichées ». */
        <Text style={s.avertissement}>
          Les artisans qui n’ont encore aucun avis n’apparaîtront pas :
          sans avis, il n’y a pas de note — ce n’est pas une mauvaise note.
        </Text>
      )}

      <Pressable
        onPress={() => setVerifies((v) => !v)}
        style={({ pressed }) => [s.bascule, pressed && s.pressee]}
        accessibilityRole="switch"
        accessibilityState={{ checked: verifies }}
        accessibilityLabel="Artisans vérifiés seulement"
      >
        <View style={[s.case, verifies && s.caseCochee]}>
          {verifies && <Text style={s.coche}>✓</Text>}
        </View>
        <Text style={s.basculeTexte}>Artisans vérifiés seulement</Text>
      </Pressable>

      <Pressable
        onPress={() => { onValider(construire()); onFermer(); }}
        style={({ pressed }) => [s.btnPlein, pressed && s.pressee]}
        accessibilityRole="button"
        accessibilityLabel={quelqueChose ? 'Voir le fil filtré' : 'Voir tout le fil'}
      >
        <Text style={s.btnPleinTexte}>
          {quelqueChose ? 'Voir le fil filtré' : 'Voir tout le fil'}
        </Text>
      </Pressable>

      {/* TOUT EFFACER EST TOUJOURS LÀ, même quand rien n'est posé : un
          bouton qui apparaît et disparaît se cherche, et celui-ci est la
          sortie de secours d'un filtre dur. */}
      <Pressable
        onPress={() => { onValider(FILTRE_VIDE); onFermer(); }}
        style={({ pressed }) => [s.btnVide, pressed && s.pressee]}
        accessibilityRole="button"
        accessibilityLabel="Tout effacer"
      >
        <Text style={s.btnVideTexte}>Tout effacer</Text>
      </Pressable>
    </FeuilleBas>
  );
}

/** Une puce de choix. Arrondie : elle flotte, et on appuie dessus. */
function Puce({ texte, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.puce, on && s.puceOn, pressed && s.pressee]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={texte}
    >
      <Text style={[s.puceTexte, on && s.puceTexteOn]}>{texte}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  titreBloc: {
    fontFamily: F.oswald6, fontSize: T.petit, color: C.muted,
    marginTop: S.lg, marginBottom: S.sm, letterSpacing: 0.4,
  },
  rangee: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },

  /* Arrondi : une puce FLOTTE au-dessus du fond, et on appuie dessus. */
  puce: {
    ...viser(32),
    paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.line, borderRadius: R.gelule,
    backgroundColor: C.surface, justifyContent: 'center',
  },
  puceOn: { backgroundColor: C.accent, borderColor: C.accent },
  puceTexte: { fontFamily: F.oswald, fontSize: T.courant, color: C.ink },
  puceTexteOn: { color: C.surAccent },

  /* La case à cocher est CARRÉE : c'est de la structure, pas un bouton. */
  bascule: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    marginTop: S.lg, minHeight: TOUCHE,
  },
  case: {
    width: 20, height: 20, borderWidth: 1.5, borderColor: C.bordChamp,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  caseCochee: { backgroundColor: C.accent, borderColor: C.accent },
  coche: { color: C.surAccent, fontSize: T.petit, fontFamily: F.oswald7 },
  basculeTexte: { flex: 1, fontFamily: F.inter, fontSize: T.courant, color: C.ink },

  avertissement: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit), marginTop: S.sm,
  },

  btnPlein: {
    ...viser(TOUCHE),
    backgroundColor: C.accent, borderRadius: R.gelule,
    alignItems: 'center', justifyContent: 'center', marginTop: S.xl,
  },
  btnPleinTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.surAccent },

  btnVide: {
    ...viser(TOUCHE),
    alignItems: 'center', justifyContent: 'center', marginTop: S.xs,
  },
  btnVideTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.accentTexte },

  pressee: { opacity: 0.7 },
});
