/**
 * LE RÉCIT D'UN CHANTIER — la première action de l'agent, à l'écran.
 *
 * LA PERMISSION DU §4 EST ICI, ET ELLE TIENT EN TROIS MOTS
 * --------------------------------------------------------
 * > **L'agent écrit, l'artisan publie.**
 *
 * Le texte que l'agent rend n'est PAS enregistré. Il arrive dans un champ,
 * l'artisan le lit, le corrige s'il veut, et c'est son appui sur
 * « Publier » qui l'envoie en base. Rien ne part sur sa vitrine sans qu'il
 * l'ait lu : c'est le §2 mot pour mot — « les actions irréversibles ou
 * engageantes demandent une validation ».
 *
 * Et ce n'est pas qu'une précaution morale : `chantiers` est une table
 * PUBLIQUE, et une règle RLS filtre des LIGNES, jamais des COLONNES
 * (section 18). Un brouillon rangé en base serait lisible par tout le
 * monde à la seconde où l'agent l'écrit. **Ce qu'on n'écrit pas ne peut
 * pas fuir.**
 *
 * CE QUE ÇA COÛTE, ET QUI EST ASSUMÉ
 * -----------------------------------
 * Un brouillon qu'on quitte est perdu. C'est le comportement de tous les
 * formulaires d'Opus, et le refaire écrire coûte un appel sur les soixante
 * de la journée. L'alternative — ranger les brouillons en base — demandait
 * une table de plus, des droits de colonne, et protégeait un texte qui n'a
 * pas besoin d'exister.
 *
 * LE CHAMP EST UN `ChampLocal`, ET IL LE FAUT
 * --------------------------------------------
 * C'est un champ multiligne de plusieurs centaines de caractères. Laisser
 * son texte remonter à chaque lettre, c'est le défaut mesuré au lot 4 :
 * 203 ms par lettre sur la description d'une publication. `ChampLocal`
 * garde le texte chez lui et ne rend la valeur exacte qu'au moment de
 * publier.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, CARTE, interligne,
} from '../theme';
import { BtnMain, BtnMini, SectionLabel } from './ui';
import { Sparkles, AlertTriangle, Check, Trash } from './icons';
import ChampLocal from './ChampLocal';
import {
  peutEcrireLeRecit, recitPerime, etapesPourLeRecit, LONGUEUR_MAX_RECIT,
} from '../lib/recit';
import { AGENT_SANS_NOM } from '../lib/agent';
import { messageClair } from '../lib/erreurs';
import * as retour from '../lib/retour';

export default function RecitChantier({
  chantier, publications = [], estLeMien = false,
  onEcrire, onEnregistrer, onErreur,
  /* QUELQU'UN LIT LE NOM DE L'AGENT, et c'est ici. Une colonne qu'on
     écrit sans jamais la relire est la panne silencieuse favorite de ce
     projet — le défaut du 01/10, et celui des photos d'annonce du 04/10
     dans l'autre sens. Le repli (« votre agent ») est calculé par
     `nomAgent()` dans `src/lib/agent.js` : une seule valeur, un seul
     endroit. */
  nomAgent = AGENT_SANS_NOM,
}) {
  /**
   * LE BROUILLON EST UN TEXTE, PAS UN BOOLÉEN — et c'est une correction.
   *
   * Le premier jet posait `setBrouillon(true)` puis, dans un `setTimeout`,
   * `champ.current.ecrire(texte)`. **Mesuré au navigateur sur la vraie
   * base : le champ arrivait VIDE.** La référence n'est pas encore
   * attachée à l'instant où le minuteur part — le composant vient d'être
   * demandé, il n'est pas monté.
   *
   * Et le défaut ne faisait planter personne : on voyait « Relisez avant
   * de publier » au-dessus d'un champ vide, et « Publier » ne faisait
   * rien (le texte était vide, donc `publier()` sortait tout de suite).
   * Un écran parfaitement calme qui ne fait rien.
   *
   * Ici le texte est posé AVANT le rendu, et `ChampLocal` le reçoit comme
   * valeur initiale. `jet` change à chaque génération : sans lui, le champ
   * déjà monté garderait l'ancien texte quand on appuie sur
   * « Recommencer » — `defaut` n'est lu qu'au montage.
   */
  const [brouillon, setBrouillon] = useState(null);
  const [jet, setJet] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const champ = useRef(null);

  const recit = (chantier && chantier.recit) || null;
  const perime = recitPerime(chantier && chantier.recitEcritLe, chantier && chantier.fin);
  const { possible, raison } = peutEcrireLeRecit(publications);
  const nbEtapes = etapesPourLeRecit(publications).length;

  /* Un visiteur ne voit QUE le texte. Il n'a pas à savoir qu'une
     fonctionnalité existe et qu'elle n'a pas servi — c'est la règle déjà
     tenue par la place vide du lot E. */
  if (!estLeMien) {
    if (!recit) return null;
    return (
      <View>
        <SectionLabel>Le chantier en bref</SectionLabel>
        <View style={s.bloc}><Text style={s.texte}>{recit}</Text></View>
      </View>
    );
  }

  const demander = async () => {
    setEnCours(true);
    try {
      const texte = await onEcrire();
      if (!texte) throw new Error("L'agent n'a rien écrit.");
      setJet((n) => n + 1);
      setBrouillon(texte);
      retour.reussite();
    } catch (e) {
      onErreur(messageClair(e, "L'agent n'a pas pu écrire ce récit"));
    }
    setEnCours(false);
  };

  const publier = async () => {
    const texte = champ.current ? champ.current.lire() : '';
    if (!texte.trim()) return;
    setEnCours(true);
    try {
      await onEnregistrer(texte.trim().slice(0, LONGUEUR_MAX_RECIT));
      setBrouillon(null);
      retour.reussite();
    } catch (e) {
      onErreur(messageClair(e, "Le récit n'a pas pu être enregistré"));
    }
    setEnCours(false);
  };

  const retirer = async () => {
    setEnCours(true);
    try {
      await onEnregistrer('');
      setBrouillon(null);
    } catch (e) {
      onErreur(messageClair(e, "Le récit n'a pas pu être retiré"));
    }
    setEnCours(false);
  };

  /* ------------------------------------------------------------------ */
  /*  Le brouillon : on le LIT avant qu'il existe pour les autres        */
  /* ------------------------------------------------------------------ */
  if (brouillon !== null) {
    return (
      <View>
        <SectionLabel>Le chantier en bref</SectionLabel>
        <View style={s.bloc}>
          <View style={s.enTete}>
            <Sparkles size={14} color={C.accent2} />
            <Text style={s.enTeteTexte}>Relisez avant de publier</Text>
          </View>
          <Text style={s.aide}>
            Ce texte n’est encore visible que par vous. Corrigez-le comme
            vous voulez : c’est votre page, ce sont vos mots.
          </Text>
          <ChampLocal
            key={jet}
            ref={champ}
            multiligne
            defaut={brouillon}
            maxLength={LONGUEUR_MAX_RECIT}
            placeholder="Le récit de ce chantier"
            style={s.champ}
          />
          <View style={s.boutons}>
            <BtnMain onPress={publier} disabled={enCours}>
              {enCours
                ? <ActivityIndicator size="small" color={C.surAccent} />
                : <Check size={13} color={C.surAccent} />}
              <Text style={s.publierTexte}>
                {enCours ? 'Enregistrement…' : 'Publier sur ma page'}
              </Text>
            </BtnMain>
            <BtnMini outline label="Recommencer" onPress={demander} disabled={enCours} />
            <BtnMini outline label="Annuler" onPress={() => setBrouillon(null)} />
          </View>
        </View>
      </View>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Le récit publié                                                    */
  /* ------------------------------------------------------------------ */
  if (recit) {
    return (
      <View>
        <SectionLabel>Le chantier en bref</SectionLabel>
        <View style={s.bloc}>
          <Text style={s.texte}>{recit}</Text>

          {/* IL A VIEILLI, ET PERSONNE NE LE VERRAIT. Le texte est
              toujours là, toujours bien écrit, et il raconte un chantier
              qui n'est plus celui d'en dessous. */}
          {perime && (
            <View style={s.alerte}>
              <AlertTriangle size={13} color={C.bad} />
              <Text style={s.alerteTexte}>
                Vous avez publié depuis que ce récit a été écrit : il ne
                parle pas des dernières étapes.
              </Text>
            </View>
          )}

          <View style={s.boutons}>
            <BtnMini outline onPress={demander} disabled={enCours}>
              {enCours
                ? <ActivityIndicator size="small" color={C.muted} />
                : <Sparkles size={12} color={C.accent2} />}
              <Text style={s.miniTexte}>
                {enCours ? 'L’agent écrit…' : 'Réécrire'}
              </Text>
            </BtnMini>
            <BtnMini outline onPress={retirer} disabled={enCours}>
              <Trash size={12} color={C.bad} />
              <Text style={[s.miniTexte, { color: C.bad }]}>Retirer</Text>
            </BtnMini>
          </View>
        </View>
      </View>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Rien encore — et on dit ce qui manque, quand il manque quelque chose */
  /* ------------------------------------------------------------------ */
  return (
    <View>
      <SectionLabel>Le chantier en bref</SectionLabel>
      <View style={s.bloc}>
        <View style={s.enTete}>
          <Sparkles size={14} color={C.accent2} />
          <Text style={s.enTeteTexte}>{`Faites-le raconter par ${nomAgent}`}</Text>
        </View>
        <Text style={s.aide}>
          Il assemble vos étapes en un texte que vos clients liront d’un
          coup — à partir de vos mots, jamais en inventant. Vous le relisez
          avant qu’il paraisse.
        </Text>

        {possible ? (
          <>
            <BtnMain onPress={demander} disabled={enCours}>
              {enCours
                ? <ActivityIndicator size="small" color={C.surAccent} />
                : <Sparkles size={13} color={C.surAccent} />}
              <Text style={s.publierTexte}>
                {enCours ? 'L’agent lit vos étapes…' : 'Demander le récit'}
              </Text>
            </BtnMain>
            <Text style={s.compte}>
              {nbEtapes} étape{nbEtapes > 1 ? 's' : ''} décrite
              {nbEtapes > 1 ? 's' : ''} sur {publications.length}.
            </Text>
          </>
        ) : (
          /* UN BOUTON GRISÉ SANS EXPLICATION EST LA PIRE DES RÉPONSES :
             on appuie, rien ne se passe, et on croit l'application
             cassée. Même famille que la poignée des commentaires qui ne
             s'attrapait pas. */
          <Text style={s.aide}>{raison}</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bloc: { ...CARTE, padding: S.md, gap: S.sm },
  enTete: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  enTeteTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.ink },
  texte: {
    fontFamily: F.inter, fontSize: T.courant, color: C.ink,
    lineHeight: interligne(T.courant) + 2,
  },
  aide: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted,
    lineHeight: interligne(T.petit),
  },
  compte: { fontFamily: F.inter, fontSize: T.micro, color: C.muted },
  champ: { minHeight: 150 },
  boutons: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, alignItems: 'center' },
  publierTexte: { fontFamily: F.oswald6, fontSize: T.courant, color: C.surAccent },
  miniTexte: { fontFamily: F.oswald6, fontSize: T.petit, color: C.ink },
  alerte: {
    flexDirection: 'row', alignItems: 'flex-start', gap: S.sm,
    borderLeftWidth: 3, borderLeftColor: C.bad, paddingLeft: S.sm,
  },
  alerteTexte: {
    flex: 1, fontFamily: F.inter, fontSize: T.petit, color: C.ink,
    lineHeight: interligne(T.petit),
  },
});
