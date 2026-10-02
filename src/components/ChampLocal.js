/**
 * UN CHAMP QUI GARDE SON TEXTE POUR LUI.
 *
 * LA RÈGLE DU PROJET, ET CE QUI LA RENDAIT INAPPLICABLE
 * -----------------------------------------------------
 * CLAUDE.md la pose depuis le 29/09/2026 : « un champ de recherche = un
 * composant, avec son texte à lui ». Elle avait fait passer l'assistant IA
 * de 219 à 26 millisecondes par lettre.
 *
 * Mais trois champs y échappaient encore, et ce sont ceux où l'on tape le
 * plus. Mesuré au navigateur le 02/10/2026, processeur bridé six fois :
 *
 *     description d'une publication  : 203 ms par lettre
 *     message dans une conversation  : 132 ms par lettre
 *     commentaire                    :  72 ms par lettre
 *
 * 203 ms, c'est le niveau de l'assistant IA du 29/09 — celui dont le
 * propriétaire avait dit « on ne peut pas écrire dedans ».
 *
 * POURQUOI ON NE POUVAIT PAS SE CONTENTER DE DESCENDRE L'ÉTAT
 * -----------------------------------------------------------
 * Pour une recherche, le texte ne sert qu'à filtrer : on peut le garder au
 * chaud et prévenir l'écran quand la frappe retombe. Ici, non. La
 * description commande trois choses qui doivent rester justes :
 *
 *   - le bouton « Publier », qui s'éteint tant que le texte est vide ;
 *   - l'assistant de relecture, qui s'active au-delà d'un certain nombre
 *     de caractères ;
 *   - la publication elle-même, qui doit lire le texte EXACT, sans
 *     attendre.
 *
 * Un simple différé casserait les deux premiers et rendrait le troisième
 * approximatif : publier une demi-seconde après la dernière lettre
 * enverrait un texte tronqué.
 *
 * CE QUE CE COMPOSANT FAIT
 * ------------------------
 * Le texte vit ICI. L'écran parent n'est prévenu que lorsque le champ
 * FRANCHIT UN SEUIL — il devient vide, il cesse de l'être, il dépasse la
 * longueur minimale. Deux ou trois fois dans une saisie, au lieu d'une fois
 * par lettre.
 *
 * Et pour lire le texte exact au moment de publier, le parent garde une
 * référence et appelle `lire()`. Aucun rendu, aucune attente.
 *
 *     const legende = useRef(null);
 *     <ChampLocal ref={legende} surSeuil={setEtat} seuilLong={40} … />
 *     // au moment de publier :
 *     onPublier(legende.current.lire());
 */
import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import { Field, TextArea } from './ui';

/**
 * `surSeuil` reçoit `{ vide, long }` — et UNIQUEMENT quand l'un des deux
 * change. `seuilLong` est le nombre de caractères à partir duquel `long`
 * devient vrai ; laissé à 0, il ne sert pas.
 */
const ChampLocal = forwardRef(function ChampLocal({
  defaut = '', surSeuil, seuilLong = 0, multiligne = false, style,
  amorce = '', onAmorceUtilisee, ...reste
}, ref) {
  const [texte, setTexte] = useState(defaut);

  /* Le texte dans une référence EN PLUS de l'état : `lire()` doit répondre
     la valeur du moment, même appelée depuis un gestionnaire qui a été créé
     à un rendu précédent. C'est le piège classique de la fermeture périmée,
     et ici il produirait une publication amputée de ses dernières lettres. */
  const vif = useRef(defaut);
  const seuils = useRef({ vide: !defaut.trim(), long: defaut.trim().length >= seuilLong });

  const changer = useCallback((t) => {
    vif.current = t;
    setTexte(t);

    if (!surSeuil) return;
    const vide = !t.trim();
    const long = seuilLong > 0 && t.trim().length >= seuilLong;
    /* LE CŒUR DE L'AFFAIRE : on ne remonte RIEN tant que rien n'a changé
       d'état. Taper la vingtième lettre d'une description ne concerne pas
       l'écran — il sait déjà que le texte n'est pas vide. */
    if (vide !== seuils.current.vide || long !== seuils.current.long) {
      seuils.current = { vide, long };
      surSeuil({ vide, long });
    }
  }, [surSeuil, seuilLong]);

  useImperativeHandle(ref, () => ({
    /** Le texte exact, à l'instant où on le demande. */
    lire: () => vif.current,
    /** Écrire depuis l'écran — l'assistant de relecture s'en sert. */
    ecrire: (t) => changer(t || ''),
    vider: () => changer(''),
  }), [changer]);

  /* L'AMORCE — un texte que l'écran pose DANS le champ au moment où il
     s'ouvre : « Bonjour, je suis Dylan M., Lambesc. »

     Elle n'écrase JAMAIS ce qui est déjà écrit : quelqu'un qui a commencé
     à taper et qui revient en arrière retrouverait sa phrase remplacée par
     une formule de politesse. Et elle est consommée une fois — sinon elle
     reviendrait à chaque rendu, et on ne pourrait plus l'effacer. */
  useEffect(() => {
    if (!amorce) return;
    if (vif.current.trim()) return;
    changer(amorce);
    if (onAmorceUtilisee) onAmorceUtilisee();
  }, [amorce, changer, onAmorceUtilisee]);

  const Composant = multiligne ? TextArea : Field;
  return (
    <Composant value={texte} onChangeText={changer} style={style} {...reste} />
  );
});

export default ChampLocal;
