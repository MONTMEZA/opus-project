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
 * LA MÉMOIRE : les suggestions partent quand la frappe RETOMBE
 * (`useRechercheDifferee`), dès trois lettres, trois au plus, SOUS le champ
 * — au-dessus, la liste qui arrive ferait descendre le champ sous le doigt.
 * Elles viennent de `memoireDesLignes()` (`devis.js`) : des prix que
 * l'artisan a RÉELLEMENT écrits, chacun avec son devis d'origine, jamais
 * une moyenne.
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
import { memoireDesLignes, UNITES, LONGUEURS } from '../lib/devis';

/** Trois lettres avant de chercher : en deçà, tout ressemble à tout. */
const LETTRES_MIN = 3;
/** Trois suggestions au plus : au-delà, on lit au lieu de taper. */
const SUGGESTIONS_MAX = 3;

const uniteDe = (cle) => UNITES.find((u) => u.cle === cle) || null;

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
     « écran » des étapes 4 à 7, B1). La mémoire répond à une FRAPPE, jamais
     à l'ouverture. */
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

  const suggestions = useMemo(() => {
    if (!memoire || choisi === recherche) return [];
    if (String(recherche || '').trim().length < LETTRES_MIN) return [];
    return memoireDesLignes(memoire, recherche, { idLigne }).slice(0, SUGGESTIONS_MAX);
  }, [memoire, recherche, idLigne, choisi]);

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
      {memoireEchec && (
        <View style={s.echec} accessibilityLiveRegion="polite">
          <Text style={s.echecTexte}>
            Les prix de vos autres devis n’ont pas pu être lus : seules les lignes de ce devis-ci sont proposées.
          </Text>
          {!!onRelireMemoire && <Pastille label="Réessayer" nom="Relire vos prix déjà écrits" onPress={onRelireMemoire} />}
        </View>
      )}
      {suggestions.length > 0 && (
        <View style={s.liste} accessibilityLabel="Déjà écrit dans vos devis">
          {suggestions.map((sug) => {
            const u = uniteDe(sug.unite);
            /* D'OÙ ELLE VIENT, sans jamais montrer le texte d'un AUTRE
               client : `origineDeSuggestion()` (devis.js) nomme un devis
               ouvert depuis une demande par sa date (relecture « données »
               des étapes 4 à 7, I5). */
            const origine = sug.origine.libelle;
            return (
              <Pressable
                key={`${sug.ligneId}-${sug.prixUnitaireCentimes}`}
                onPress={() => {
                  vif.current = sug.designation;
                  setTexte(sug.designation);
                  setRecherche(sug.designation);
                  setChoisi(sug.designation);
                  if (onChoisir) onChoisir(sug);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Reprendre : ${sug.designation}${u ? `, par ${u.nom}` : ''}`
                  + `${sug.fournitureNonComprise ? ', fourniture non comprise' : ''}`
                  + `${origine ? `, déjà écrit dans ${origine}` : ''}`}
                style={({ pressed }) => [s.suggestion, pressed && APPUI.discret]}
              >
                <Text style={s.suggestionTitre} numberOfLines={2}>{sug.designation}</Text>
                <Text style={s.suggestionDetail} numberOfLines={2}>
                  <Montant centimes={sug.prixUnitaireCentimes} enLigne style={s.suggestionPrix} />
                  {u ? ` / ${u.court}` : ''}
                  {sug.offert ? ' (offert)' : ''}
                  {sug.fournitureNonComprise ? ' · fourniture non comprise' : ''}
                  {origine ? ` · ${origine}` : ''}
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
