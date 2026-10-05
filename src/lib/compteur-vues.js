/**
 * LE CROCHET QUI COMPTE LES VUES — et pourquoi il est à part.
 *
 * Tout le CALCUL vit dans `./vues.js`, qui n'importe RIEN et qu'un contrôle
 * peut donc faire tourner sous `node`. Ce fichier-ci importe React : il ne
 * se lance pas sous `node`, et c'est précisément pour ça que les deux sont
 * séparés. Essayé avant de trancher : `import { useRef } from 'react'` hors
 * du bon dossier échoue sur `ERR_MODULE_NOT_FOUND`, et un contrôle qui
 * PLANTE ne vérifie rien — c'est la panne silencieuse de
 * `verifier-montage`, le 02/10/2026.
 *
 * CE QU'IL FAIT, ET CE QU'IL NE FAIT SURTOUT PAS
 * -----------------------------------------------
 * Il ne redessine JAMAIS l'écran. Tout vit dans des références : le
 * registre des arrivées, la file d'attente, ce qui a déjà été envoyé. Un
 * `useState` ici serait un rendu plusieurs fois par seconde pendant qu'on
 * fait défiler — exactement ce que le lot 6 interdit, et ce qui a fait
 * passer la bannière de profil sur le fil natif.
 *
 * LES TROIS MOMENTS OÙ ÇA PART
 * -----------------------------
 *   1. le paquet est plein (`PAQUET_MAX`) ;
 *   2. le délai est écoulé (`DELAI_ENVOI`) ;
 *   3. **on quitte l'écran.** Sans ce troisième, les dernières
 *      publications regardées avant de changer d'onglet seraient perdues —
 *      et ce sont justement celles qu'on a regardées le plus longtemps.
 *
 * Et un échec d'envoi ne casse rien : on perd des vues, pas une session.
 * Même règle que le vibreur de `retour.js` — personne ne doit voir une
 * erreur parce qu'un compteur n'a pas pu monter.
 */
import { useCallback, useEffect, useRef } from 'react';
import {
  aRetenir, prochainPaquet, DUREE_VUE, DELAI_ENVOI, PAQUET_MAX,
} from './vues';

/** Toutes les combien on regarde si quelque chose a atteint la durée. */
const BATTEMENT = 500;

export default function useCompteurDeVues({ envoyer, actif = true }) {
  /* Ce que l'écran montre EN CE MOMENT. Une référence, pas un état :
     l'écrire ne doit rien redessiner. */
  const visibles = useRef([]);
  const arrivees = useRef(new Map());
  const dejaVues = useRef(new Set());
  const file = useRef([]);
  /* `0` et pas `Date.now()` : le linter de React refuse un appel impur
     pendant le rendu, et il a raison — deux rendus ne doivent pas produire
     deux valeurs différentes. L'horloge se pose dans l'effet, c'est-à-dire
     au moment où le compteur commence vraiment à tourner. */
  const dernierEnvoi = useRef(0);
  /* `envoyer` change d'identité à chaque rendu du parent. Sans cette
     référence, l'effet se remonterait à chaque rendu — donc le minuteur
     repartirait de zéro, et une publication regardée pendant 900 ms ne
     compterait jamais. C'est le piège de `React.memo` du lot 4, vu du
     côté des effets.

     Et l'affectation est dans un EFFET, pas dans le corps : écrire une
     référence pendant le rendu est refusé par le linter, pour la même
     raison que ci-dessus. */
  const envoiRef = useRef(envoyer);
  useEffect(() => { envoiRef.current = envoyer; }, [envoyer]);

  const vider = useCallback(async () => {
    if (file.current.length === 0) return;
    const paquet = prochainPaquet(file.current, PAQUET_MAX);
    dernierEnvoi.current = Date.now();
    try { await envoiRef.current(paquet); } catch { /* on perd des vues, pas une session */ }
  }, []);

  /** À appeler quand la composition de l'écran change. */
  const signaler = useCallback((ids) => { visibles.current = ids || []; }, []);

  useEffect(() => {
    if (!actif) return undefined;
    dernierEnvoi.current = Date.now();
    const battement = setInterval(() => {
      const dus = aRetenir(
        arrivees.current, visibles.current, dejaVues.current, Date.now(), DUREE_VUE,
      );
      dus.forEach((id) => { dejaVues.current.add(id); file.current.push(id); });
      if (file.current.length >= PAQUET_MAX
          || (file.current.length > 0 && Date.now() - dernierEnvoi.current >= DELAI_ENVOI)) {
        vider();
      }
    }, BATTEMENT);
    return () => {
      clearInterval(battement);
      /* En quittant l'écran. Pas de `await` : on ne retient pas un
         démontage pour un compteur. */
      vider();
    };
  }, [actif, vider]);

  return signaler;
}
