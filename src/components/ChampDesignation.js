/**
 * LA DÉSIGNATION D'UNE LIGNE DE DEVIS — et la mémoire des prix déjà écrits,
 * sous le champ (lot 1 du devis, 22/10/2026).
 *
 * SON PROPRE COMPOSANT, AVEC SON PROPRE TEXTE ET SES PROPRES SUGGESTIONS.
 * Une lettre tapée ne redessine que lui : la carte de la ligne porte une
 * dizaine de pastilles, l'écran une liste entière, et un texte qui
 * remonterait à chaque lettre rendrait la frappe lourde au pouce (les
 * 219 ms de l'assistant IA du 29/09, la règle « un champ = son propre
 * composant »). Il ne remonte que :
 *   - le CHOIX d'une suggestion (`onChoisir`), qui recopie la phrase,
 *     l'unité, le prix, la fourniture et la main-d'œuvre ;
 *   - la sortie du champ (`onBlur`), qui enregistre la ligne.
 * L'écran LIT le texte quand il en a besoin (`lire()`), au moment
 * d'enregistrer — y compris quand on touche une pastille, qui ne fait PAS
 * perdre le focus au champ (`keyboardShouldPersistTaps: 'handled'`).
 *
 * UN `TextInput` À LUI, et pas `ChampLocal` ni `TextArea` : `TextArea`
 * n'est pas une `forwardRef`, et `ChampLocal` multiligne n'a pas de
 * `focus()` (« `autoFocus` sur un poste neuf », et la main rendue au champ
 * après un refus). Et on ne passe JAMAIS `onChangeText` à `ChampLocal` : la
 * propriété de l'appelant passe par `...reste` APRÈS la sienne et
 * l'écraserait — le champ ne se mettrait plus à jour.
 *
 * CORRECTION ET ORTHOGRAPHE ACTIVES (`autoCorrect`, `spellCheck`) : c'est
 * le texte que le client lira. L'inverse exact de `ChampMontant`.
 *
 * LES PROPOSITIONS : elles partent quand la frappe RETOMBE
 * (`useRechercheDifferee`), dès trois lettres, trois au plus, SOUS le champ
 * — au-dessus, la liste qui arrive ferait descendre le champ sous le doigt.
 * Depuis le lot P (24/10/2026), elles viennent de DEUX sources, dans UNE
 * liste (`suggestionsPourLaFrappe`, `postes.js`) :
 *   - la BASE DE POSTES de l'artisan — ses phrases rangées d'un appui, avec
 *     le prix de référence qu'il a fixé lui-même ;
 *   - la MÉMOIRE du lot 1 — les prix qu'il a RÉELLEMENT écrits dans ses
 *     devis, chacun avec son devis d'origine, jamais une moyenne.
 * UNE PROPOSITION PAR PHRASE (à une variante d'écriture près : majuscules,
 * accents, ponctuation, un s de pluriel), jamais plus de trois — la réponse
 * du propriétaire du 23/10 : « il ne faut pas qu'il y ait trop de
 * propositions, ça pourrait nous perdre ». Ce qui s'affiche et ce qu'un
 * appui recopie est TOUJOURS une phrase rangée, mot pour mot : la clé qui
 * rapproche deux phrases ne sort jamais de `devis.js` et de `postes.js`, et
 * cet écran n'importe pas `rapprochement.js`.
 *
 * UNE RANGÉE = un titre de deux lignes au plus + un détail d'UNE ligne. Le
 * prix qu'un appui recopie est écrit par `Montant`, à l'encre du texte ; le
 * reste du détail en gris. Si quelque chose est coupé, c'est l'historique
 * ou l'origine, jamais « fourniture non comprise » (`detailDeSuggestion`
 * les range dans cet ordre). Et VoiceOver entend d'abord le prix qu'un
 * appui recopie (`libelleDeSuggestion`).
 */
import React, {
  forwardRef, useImperativeHandle, useRef, useState, useMemo,
} from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
} from 'react-native';
import {
  C, F, T, S, TOUCHE, APPUI, interligne,
} from '../theme';
import { uiStyles, Montant, Pastille } from './ui';
import { useRechercheDifferee } from '../lib/frappe';
import { LONGUEURS } from '../lib/devis';
import { suggestionsPourLaFrappe, morceauxDuDetail, libelleDeSuggestion } from '../lib/postes';

/** Trois lettres avant de chercher : en deçà, tout ressemble à tout. */
const LETTRES_MIN = 3;
/** Trois propositions au plus : au-delà, on lit au lieu de taper. */
const SUGGESTIONS_MAX = 3;
const AUCUN_POSTE = Object.freeze([]);

/* CE QUI N'A PAS PU ÊTRE LU, en UNE phrase — et un seul « Réessayer », qui
   relit ce qui a échoué. Une source en panne n'éteint jamais l'autre : la
   phrase dit laquelle manque, et ce qui reste proposé. */
function phraseEchec(memoire, base) {
  if (memoire && base) return 'Vos prix déjà écrits et votre base de postes n’ont pas pu être lus.';
  if (base) return 'Votre base de postes n’a pas pu être lue : seuls vos prix déjà écrits sont proposés.';
  return 'Les prix de vos autres devis n’ont pas pu être lus : seules les lignes de ce devis-ci sont proposées.';
}

const ChampDesignation = forwardRef(function ChampDesignation({
  defaut = '', placeholder, accessibilityLabel, autoFocus = false,
  memoire = null, idLigne = null, onChoisir, onBlur,
  /* La mémoire n'a pas pu être lue : on le DIT sous le champ, avec un vrai
     bouton pour la redemander (relecture « écran » des étapes 4 à 7, C3).
     La phrase ne dit PAS « aucune suggestion » : les lignes du devis ouvert
     restent proposées (elles sont à l'écran, pas dans la base), et une
     phrase qui annonce zéro au-dessus de deux suggestions dément ce qu'on
     voit — mesuré au navigateur sur une copie en panne. */
  memoireEchec = false, onRelireMemoire = null,
  /* La base de postes (lot P) : le tableau tel qu'`OpusApp` l'a lu — le
     MÊME objet d'un rendu à l'autre, c'est ce qui garde ses clés en cache
     (`postesPrepares`) —, l'état de sa lecture, et de quoi la relire. Elle
     ne propose rien tant qu'elle n'est pas lue (`'ok'`). */
  postes = null, postesEtat = 'vide', onRelirePostes = null,
}, ref) {
  /* `recherche` : le texte une fois la frappe retombée — c'est lui qui
     décide des suggestions. `vif` : le texte exact, pour `lire()` au moment
     d'enregistrer (une lecture d'un rendu passé amputerait les dernières
     lettres — la leçon de `ChampLocal`). */
  const [recherche, setRecherche] = useState(defaut || '');
  const [texte, setTexte] = useRechercheDifferee(recherche, setRecherche);
  /* Une suggestion choisie se tait jusqu'à la prochaine lettre — ET LE TEXTE
     D'OUVERTURE AUSSI. Avec `null`, la carte d'une ligne EXISTANTE s'ouvrait
     avec des suggestions qu'on n'avait pas demandées (sa désignation valait
     déjà trois lettres), et UN appui distrait changeait son prix : 45 € →
     38 € « fourniture non comprise », le total du devis avec (relecture
     « écran » des étapes 4 à 7, B1). Les propositions répondent à une
     FRAPPE, jamais à l'ouverture — celles de la base comme celles de la
     mémoire. */
  const [choisi, setChoisi] = useState(defaut || null);
  const vif = useRef(defaut || '');
  const champ = useRef(null);

  const changer = (t) => {
    vif.current = t;
    setTexte(t);
    setChoisi(null);
  };

  useImperativeHandle(ref, () => ({
    lire: () => vif.current,
    ecrire: (t) => {
      const v = t == null ? '' : String(t);
      vif.current = v;
      setTexte(v);
      setRecherche(v);
      setChoisi(v);
    },
    focus: () => { if (champ.current && champ.current.focus) champ.current.focus(); },
  }), [setTexte]);

  const postesLus = postesEtat === 'ok' && Array.isArray(postes) ? postes : null;
  const suggestions = useMemo(() => {
    if ((!memoire && !postesLus) || choisi === recherche) return [];
    if (String(recherche || '').trim().length < LETTRES_MIN) return [];
    return suggestionsPourLaFrappe({
      postes: postesLus || AUCUN_POSTE,
      memoire: Array.isArray(memoire) ? memoire : [],
      texte: recherche,
      idLigne,
      max: SUGGESTIONS_MAX,
    });
  }, [memoire, postesLus, recherche, idLigne, choisi]);

  /* L'échec de la base ne se dit que là où elle aurait proposé quelque
     chose : la carte ne passe `postesEtat` qu'à une ligne chiffrée (un
     poste, une option) — un titre n'en reçoit pas. */
  const baseEchec = postesEtat === 'echec';
  const relire = () => {
    if (memoireEchec && onRelireMemoire) onRelireMemoire();
    if (baseEchec && onRelirePostes) onRelirePostes();
  };

  return (
    <View>
      <TextInput
        ref={champ}
        value={texte}
        onChangeText={changer}
        onBlur={onBlur}
        multiline
        textAlignVertical="top"
        autoFocus={autoFocus}
        autoCorrect
        spellCheck
        autoCapitalize="sentences"
        maxLength={LONGUEURS.designation}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        accessibilityLabel={accessibilityLabel}
        style={[uiStyles.textarea, s.champ]}
      />
      {(memoireEchec || baseEchec) && (
        <View style={s.echec} accessibilityLiveRegion="polite">
          <Text style={s.echecTexte}>{phraseEchec(memoireEchec, baseEchec)}</Text>
          {!!(onRelireMemoire || onRelirePostes) && (
            <Pastille label="Réessayer" nom="Relire vos prix déjà écrits et votre base de postes" onPress={relire} />
          )}
        </View>
      )}
      {/* LE CONTENEUR NE PORTE AUCUN LIBELLÉ : posé sur une vue qui n'est
          pas un élément d'accessibilité, VoiceOver ne le lit pas. Chaque
          rangée porte le sien, au préfixe commun « Reprendre : ». */}
      {suggestions.length > 0 && (
        <View style={s.liste}>
          {suggestions.map((sug) => {
            /* LE DÉTAIL COUPÉ AUTOUR DU PRIX RECOPIÉ (`morceauxDuDetail`) :
               le prix par `Montant`, à l'encre du texte, le reste en gris.
               L'origine d'une ligne de mémoire ne montre jamais le texte
               d'un AUTRE client : un devis ouvert depuis une demande se
               nomme par sa date (`origine.libelle`, `devis.js`). */
            const m = morceauxDuDetail(sug);
            return (
              <Pressable
                key={`${sug.source}-${sug.cle}`}
                onPress={() => {
                  vif.current = sug.designation;
                  setTexte(sug.designation);
                  setRecherche(sug.designation);
                  setChoisi(sug.designation);
                  if (onChoisir) onChoisir(sug);
                }}
                accessibilityRole="button"
                accessibilityLabel={libelleDeSuggestion(sug)}
                style={({ pressed }) => [s.suggestion, pressed && APPUI.discret]}
              >
                <Text style={s.suggestionTitre} numberOfLines={2}>{sug.designation}</Text>
                <Text style={s.suggestionDetail} numberOfLines={1}>
                  {m.avant}
                  {m.prix != null && <Montant centimes={m.prix} enLigne style={s.suggestionPrix} />}
                  {m.apres}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
});

export default ChampDesignation;

const s = StyleSheet.create({
  champ: { marginBottom: 0, minHeight: TOUCHE * 2 },
  /* La liste est de la STRUCTURE (angle vif) posée sous le champ ; chaque
     suggestion est une rangée de 44 points au moins. */
  liste: { borderWidth: 1, borderTopWidth: 0, borderColor: C.line, backgroundColor: C.surface },
  suggestion: {
    minHeight: TOUCHE, paddingVertical: S.sm, paddingHorizontal: S.md,
    borderTopWidth: 1, borderTopColor: C.line, justifyContent: 'center',
  },
  suggestionTitre: { fontFamily: F.inter6, fontSize: T.corps, color: C.ink, lineHeight: interligne(T.corps) },
  suggestionDetail: {
    fontFamily: F.inter, fontSize: T.petit, color: C.muted, marginTop: S.xs, lineHeight: interligne(T.petit),
  },
  suggestionPrix: { fontSize: T.petit, color: C.ink },
  echec: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.xs, paddingHorizontal: S.md,
    borderWidth: 1, borderTopWidth: 0, borderColor: C.line, backgroundColor: C.surface,
  },
  echecTexte: {
    flex: 1, minWidth: 0, fontFamily: F.inter, fontSize: T.petit, color: C.bad, lineHeight: interligne(T.petit),
  },
});
