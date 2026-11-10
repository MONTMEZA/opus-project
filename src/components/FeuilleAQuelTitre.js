/**
 * « À QUEL TITRE CE CLIENT COMMANDE-T-IL ? » — la feuille des quatre
 * réponses (lot 2b-2 du module devis, cahier §3.4, annexe A.3).
 *
 * UNE FEUILLE DU BAS, ouverte par l'état UNIQUE `feuille` de la saisie
 * (`{ type: 'pour_qui' }`, critique écran E-I11) — jamais par l'en-tête,
 * qui ne contient aucune `FeuilleBas` : « Répondre », « Autre réponse »,
 * « Changer » et le bouton « Répondre » de la liste « Pour le remettre »
 * ouvrent tous LA MÊME.
 *
 * L'ORDRE PROTECTEUR (critique droit B3, écran E-I9) : les rangées viennent
 * de `REPONSES_A_QUEL_TITRE` (devis.js), celle qui RETIRE des mentions dues
 * à un particulier en DERNIER, avec « Dans le doute, choisissez une autre
 * réponse : c’est la plus sûre. » Une SCI au carnet commence donc par
 * « À titre privé… » puis « Pour une association, une copropriété ou une
 * société civile » — la rangée la plus haute ne retire rien.
 *
 * Un appui ÉCRIT la paire (la réponse et le client à qui elle est donnée —
 * la saisie lit l'identifiant du client À L'INSTANT de l'appui) et ferme la
 * feuille. La réponse actuelle est marquée choisie, pour VoiceOver aussi.
 */
import React from 'react';
import {
  View, Text, Pressable, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import FeuilleBas from './FeuilleBas';
import { A_QUEL_TITRE, REPONSES_A_QUEL_TITRE } from '../lib/devis';

export default function FeuilleAQuelTitre({ valeur = null, onChoisir, onFermer }) {
  return (
    <FeuilleBas titre={A_QUEL_TITRE.titreFeuille} onFermer={onFermer}>
      {REPONSES_A_QUEL_TITRE.map((r) => {
        const choisie = r.valeur === valeur;
        return (
          <Pressable
            key={r.valeur}
            onPress={() => onChoisir(r.valeur)}
            accessibilityRole="button"
            accessibilityLabel={r.aide ? `${r.rangee}. ${r.aide}` : r.rangee}
            accessibilityState={{ selected: choisie }}
            aria-selected={choisie}
            style={({ pressed }) => [s.rangee, choisie && s.choisie, pressed && APPUI.discret]}
          >
            <View style={s.texte}>
              <Text style={[s.titre, choisie && s.titreChoisi]}>{r.rangee}</Text>
              {!!r.aide && <Text style={s.aide}>{r.aide}</Text>}
            </View>
          </Pressable>
        );
      })}
    </FeuilleBas>
  );
}

const s = StyleSheet.create({
  /* UNE RANGÉE : de la structure (angle vif), 44 points au moins, toute la
     rangée comme cible. */
  rangee: {
    minHeight: TOUCHE, justifyContent: 'center', paddingVertical: S.sm, paddingHorizontal: S.md,
    borderWidth: 1, borderColor: C.line, backgroundColor: C.surface,
  },
  /* La réponse actuelle : un filet bleu, et le titre en gras bleu. */
  choisie: { borderColor: C.accent2, borderLeftWidth: S.xs },
  texte: { gap: S.xs },
  titre: { fontFamily: F.inter6, fontSize: T.courant, color: C.ink, lineHeight: interligne(T.courant) },
  titreChoisi: { color: C.accent2 },
  aide: { fontFamily: F.inter, fontSize: T.petit, color: C.muted, lineHeight: interligne(T.petit) },
});
