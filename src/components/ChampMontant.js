/**
 * UN CHAMP POUR UN NOMBRE — une quantité, un prix, une surface, un taux de
 * retenue (lot 1 du devis, 22/10/2026).
 *
 * POURQUOI UN COMPOSANT À LUI, et le seul endroit des écrans du devis où
 * s'écrit `keyboardType` :
 *   - le PAVÉ DÉCIMAL (`decimal-pad`) : un chiffre et une virgule, rien
 *     d'autre. Sur le clavier des lettres, on tape « 2.5 » ou « 2,5 » selon
 *     la langue du téléphone, et on se trompe de touche avec des gants ;
 *   - AUCUNE correction automatique ni orthographe (`autoCorrect`,
 *     `spellCheck` à faux) : iOS « corrige » volontiers « 1,5 » en
 *     « 1.5 », ou propose un mot à la place d'un nombre ;
 *   - AUCUN `returnKeyType` : le pavé décimal d'iOS n'a PAS de touche
 *     retour. Promettre « Suivant » sur un clavier qui ne peut pas
 *     l'afficher, c'est le défaut du 11/10 (le SIRET et le code postal du
 *     carnet). On sort du champ en touchant le suivant, ou en glissant la
 *     liste vers le bas (`keyboardDismissMode="on-drag"`).
 *
 * Il garde SON texte (c'est un `ChampLocal`) : une lettre tapée ne
 * redessine pas l'écran — la règle « un champ = son propre composant »
 * (les 219 ms de l'assistant IA, 29/09). L'écran le LIT quand il en a
 * besoin (`lire()`), au moment d'enregistrer : un champ quitté, une
 * pastille touchée, une carte fermée.
 *
 * `forwardRef` : `lire()`, `ecrire()` (une surface copiée, une suggestion de
 * la mémoire) et `focus()` (« la main passe à la quantité »).
 */
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ChampLocal from './ChampLocal';

const ChampMontant = forwardRef(function ChampMontant({
  defaut = '', placeholder, accessibilityLabel, onBlur, style, maxLength = 16,
}, ref) {
  const champ = useRef(null);
  useImperativeHandle(ref, () => ({
    lire: () => (champ.current ? champ.current.lire() : ''),
    ecrire: (t) => { if (champ.current) champ.current.ecrire(t == null ? '' : String(t)); },
    focus: () => { if (champ.current) champ.current.focus(); },
  }), []);
  return (
    <ChampLocal
      ref={champ}
      defaut={defaut}
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      keyboardType="decimal-pad"
      inputMode="decimal"
      autoCorrect={false}
      spellCheck={false}
      maxLength={maxLength}
      onBlur={onBlur}
      style={style}
    />
  );
});

export default ChampMontant;
