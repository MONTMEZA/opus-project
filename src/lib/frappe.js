/**
 * Taper et filtrer sont deux choses différentes.
 *
 * LE DÉFAUT QUE CE FICHIER CORRIGE
 * --------------------------------
 * Une barre de recherche écrite de la façon évidente filtre la liste à
 * CHAQUE lettre. Or filtrer coûte cher ici : il faut relire la fiche de
 * chaque artisan ou chaque annonce, ignorer les accents, développer les
 * synonymes de chantier (placo = BA13 = plaque de plâtre). Puis redessiner
 * les résultats.
 *
 * Mesuré au navigateur avec le processeur bridé six fois, pour imiter un
 * téléphone — la machine où tournent les essais est bien plus rapide qu'un
 * iPhone :
 *
 *     Découvrir, recherche d'artisan  : 74 ms par lettre
 *     Place des pros                  : 93 ms par lettre
 *
 * Avec six artisans de démonstration. Avec cinq cents, le champ devient
 * inutilisable — et c'est exactement ce qui a été signalé le 29/09/2026 sur
 * l'assistant IA, où le coût venait d'ailleurs mais donnait la même
 * impression : « on ne peut pas écrire ».
 *
 * LA RÈGLE
 * --------
 * La lettre s'affiche TOUT DE SUITE — c'est le seul retour dont on a besoin
 * en tapant. Le filtrage, lui, part un court instant après la dernière
 * touche. Personne ne lit les résultats pendant qu'il tape.
 */
import { useState, useEffect } from 'react';

/** Le temps de silence, en millisecondes, avant de filtrer pour de bon. */
export const ATTENTE = 220;

/**
 * Renvoie `[texte, setTexte]` à brancher sur le champ de saisie.
 * `onChange` n'est appelé qu'une fois la frappe retombée.
 *
 * `valeur` est la valeur RÉELLE tenue par l'écran : elle sert à repartir du
 * bon texte, et à suivre un effacement venu d'ailleurs (le bouton croix,
 * par exemple).
 */
export function useRechercheDifferee(valeur, onChange, attente = ATTENTE) {
  const [texte, setTexte] = useState(valeur || '');

  /* Le champ a été vidé ou rempli par l'écran lui-même : on se recale.
     Sans cela, appuyer sur la croix effacerait les résultats mais
     laisserait le texte affiché dans le champ. */
  useEffect(() => {
    setTexte((actuel) => (actuel === valeur ? actuel : (valeur || '')));
  }, [valeur]);

  useEffect(() => {
    if (texte === valeur) return undefined;
    const minuteur = setTimeout(() => onChange(texte), attente);
    return () => clearTimeout(minuteur);
    // `onChange` change à chaque rendu du parent : l'inclure relancerait
    // le minuteur sans arrêt. C'est le TEXTE qui décide, et lui seul.
  }, [texte]);   // eslint-disable-line react-hooks/exhaustive-deps

  return [texte, setTexte];
}
