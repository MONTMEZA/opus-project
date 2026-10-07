/**
 * LA FENÊTRE QUI PROPOSE DE NOMMER L'AGENT — et qui sait se taire.
 *
 * CE QUE LE PROPRIÉTAIRE A DEMANDÉ, ET POURQUOI C'EST DÉLICAT
 * -----------------------------------------------------------
 *   « quand la fenetre s'ouvre il puisse dire plus tard mais je pence
 *     qu'il faut que de temp en temp elle lui re propose pour pas qu'il
 *     ne saute cette etape »
 *
 * Il a raison des deux côtés, et les deux côtés tirent en sens inverse.
 * Une fenêtre toujours refusable se saute pour toujours ; une fenêtre qui
 * revient sans fin devient ce que son propre cahier des charges interdit
 * en propres termes — « les suggestions de l'IA ne doivent pas être
 * insistantes » (§2).
 *
 * La règle qui tient les deux vit dans `src/lib/agent.js`, qui n'importe
 * rien, et le contrôle la FAIT TOURNER : trois propositions au plus, et la
 * deuxième comme la troisième n'arrivent qu'après que l'agent a travaillé
 * pour lui. Ce fichier-là ne décide de rien ; il affiche.
 *
 * POURQUOI `FeuilleBas` ET PAS UNE `Modal` ÉCRITE ICI
 * ---------------------------------------------------
 * Elle porte un CHAMP DE SAISIE, et une feuille collée au bas de l'écran
 * avec un champ est exactement la forme du défaut du 04/10 : le clavier de
 * l'iPhone recouvrait le champ ET la croix de fermeture, et l'application
 * avait l'air plantée alors qu'elle marchait. `FeuilleBas` monte avec le
 * clavier, défile, et garde une bande de voile à toucher — donc une sortie.
 *
 * ON NE PEUT PAS LA FERMER SANS RÉPONDRE, ET C'EST VOULU
 * ------------------------------------------------------
 * Le voile et la croix appellent `onPlusTard`, pas un simple `onFermer` :
 * fermer la fenêtre EST un refus, et un refus qu'on ne compte pas est un
 * refus qui revient à chaque démarrage. C'est le compteur en base qui nous
 * fera nous taire ; une sortie qui ne le fait pas monter annulerait toute
 * la section 40 en silence.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, R, APPUI, TOUCHE, interligne,
} from '../theme';
import FeuilleBas from './FeuilleBas';
import { Field, BtnMain } from './ui';
import { Sparkles } from './icons';
import {
  NOMS_SUGGERES, LONGUEUR_MAX_NOM_AGENT, validerNomAgent, nomAgent, aUnNom,
} from '../lib/agent';
import { messageClair } from '../lib/erreurs';
import * as retour from '../lib/retour';

export default function FenetreAgent({
  visible, nomActuel = null, onNommer, onPlusTard, onFermer,
  /* L'EN-TÊTE DOIT DIRE LA VÉRITÉ. À la toute première ouverture, l'agent
     n'a encore rien fait : écrire « il travaille déjà pour vous » serait un
     travail annoncé qui n'a pas eu lieu — la famille de défauts que ce
     projet traque depuis le « X est prévenu » du 01/10. Quand la fenêtre
     revient, en revanche, c'est précisément PARCE QU'il vient de
     travailler, et le dire est ce qui donne son sens à la question. */
  vientDeTravailler = false,
}) {
  const [saisie, setSaisie] = useState(nomActuel || '');
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);
  /* Le champ reçoit un nom suggéré par `ecrire()`. Il est court — deux
     mots au plus —, donc `ChampLocal` et son économie de rendus n'ont rien
     à faire ici : c'est un `Field` ordinaire, dont l'état est à côté. */
  const champ = useRef(null);

  /** On RENOMME quand l'agent a déjà un nom : ce n'est plus une
   *  proposition, c'est un réglage, et il n'y a donc rien à refuser. */
  const renommage = aUnNom(nomActuel);

  if (!visible) return null;

  const valider = async () => {
    const { valeur, erreur: souci } = validerNomAgent(saisie);
    if (souci) { setErreur(souci); return; }
    setErreur(null);
    setEnCours(true);
    try {
      await onNommer(valeur);
      retour.reussite();
    } catch (e) {
      setErreur(messageClair(e));
    } finally {
      setEnCours(false);
    }
  };

  const choisir = (n) => {
    setSaisie(n);
    setErreur(null);
    if (champ.current && champ.current.focus) champ.current.focus();
  };

  return (
    <FeuilleBas
      titre={renommage ? 'Le nom de votre agent' : 'Votre agent a besoin d’un nom'}
      /* Fermer, c'est refuser — donc ça compte. En renommage, il n'y a
         rien à compter : on repart sans rien changer. */
      onFermer={renommage ? onFermer : onPlusTard}
    >
      {!renommage && (
        <View style={s.enTete}>
          <Sparkles size={14} color={C.accent2} />
          <Text style={s.enTeteTexte}>
            {vientDeTravailler
              ? 'Il vient de travailler pour vous'
              : 'Il est prêt à travailler pour vous'}
          </Text>
        </View>
      )}

      <Text style={s.aide}>
        {renommage
          ? `Votre agent s’appelle ${nomAgent(nomActuel)}. Vous pouvez en changer quand vous voulez.`
          : 'Il écrit le récit de vos chantiers, remet vos textes d’aplomb, '
            + 'et il en fera bien plus. Donnez-lui un nom : c’est plus simple '
            + 'de dire « demande à Léon » que « demande à l’assistant ».'}
      </Text>

      <View style={s.puces}>
        {NOMS_SUGGERES.map((n) => (
          <Pressable
            key={n}
            onPress={() => choisir(n)}
            style={({ pressed }) => [s.puce, saisie === n && s.puceOn, pressed && APPUI.plein]}
            accessibilityRole="button"
            accessibilityLabel={`Choisir le nom ${n}`}
            accessibilityState={{ selected: saisie === n }}
          >
            <Text style={[s.puceTexte, saisie === n && s.puceTexteOn]}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Field
        ref={champ}
        value={saisie}
        onChangeText={(t) => { setSaisie(t); setErreur(null); }}
        placeholder="Ou écrivez le nom de votre choix"
        maxLength={LONGUEUR_MAX_NOM_AGENT}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={valider}
        accessibilityLabel="Nom de votre agent"
      />

      {/* UN ÉCHEC NE S'AFFICHE JAMAIS EN VERT, et il dit quoi faire. */}
      {erreur ? <Text style={s.erreur}>{erreur}</Text> : null}

      <BtnMain onPress={valider} disabled={enCours}>
        {enCours ? <ActivityIndicator size="small" color={C.surAccent} /> : null}
        <Text style={s.validerTexte}>
          {enCours ? 'Enregistrement…' : (renommage ? 'Changer son nom' : 'C’est son nom')}
        </Text>
      </BtnMain>

      {!renommage && (
        <Pressable
          onPress={onPlusTard}
          style={({ pressed }) => [s.plusTard, pressed && APPUI.discret]}
          accessibilityRole="button"
          accessibilityLabel="Plus tard"
        >
          <Text style={s.plusTardTexte}>Plus tard</Text>
        </Pressable>
      )}
    </FeuilleBas>
  );
}

const s = StyleSheet.create({
  enTete: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  enTeteTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.accent2 },
  aide: {
    fontFamily: F.inter4, fontSize: T.corps, color: C.muted,
    lineHeight: interligne(T.corps),
  },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  /* Une puce FLOTTE et on appuie dessus : elle s'arrondit. Règle des bords,
     `src/theme.js` — l'angle vif est pour ce qui porte l'information. */
  puce: {
    minHeight: TOUCHE, justifyContent: 'center',
    paddingHorizontal: S.lg, borderRadius: R.gelule,
    borderWidth: 1, borderColor: C.line, backgroundColor: C.surface,
  },
  puceOn: { backgroundColor: C.accent, borderColor: C.accent },
  puceTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  /* `surAccent` est l'encre de l'orange : le blanc n'y donne que 3,51 : 1. */
  puceTexteOn: { color: C.surAccent },
  erreur: { fontFamily: F.inter5, fontSize: T.petit, color: C.bad },
  validerTexte: { fontFamily: F.oswald6, fontSize: T.corps, color: C.surAccent },
  plusTard: {
    minHeight: TOUCHE, alignItems: 'center', justifyContent: 'center',
  },
  plusTardTexte: { fontFamily: F.inter5, fontSize: T.corps, color: C.muted },
});
